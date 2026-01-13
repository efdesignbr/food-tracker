import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { getPool } from '@/lib/db';
import { logger } from '@/lib/logger';
import { REVENUECAT } from '@/lib/constants';
import type { Plan, SubscriptionStatus } from '@/lib/types/subscription';

/**
 * Estrutura do CustomerInfo retornado pelo SDK do RevenueCat
 * Ref: https://www.revenuecat.com/docs/api-reference/customer-info
 */
interface RevenueCatCustomerInfo {
  entitlements: {
    active: Record<string, {
      identifier: string;
      isActive: boolean;
      willRenew: boolean;
      periodType: string;
      latestPurchaseDate: string;
      originalPurchaseDate: string;
      expirationDate: string | null;
      productIdentifier: string;
      store: string;
    }>;
    all: Record<string, unknown>;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  originalAppUserId: string;
  managementURL: string | null;
}

interface SyncRequestBody {
  customerInfo: RevenueCatCustomerInfo;
}

/**
 * Mapeia store do RevenueCat para valor do banco
 */
function mapStoreToDb(store: string): 'app_store' | 'play_store' | null {
  const upperStore = store.toUpperCase();
  if (upperStore === 'APP_STORE' || upperStore === 'APPLE') return 'app_store';
  if (upperStore === 'PLAY_STORE' || upperStore === 'GOOGLE') return 'play_store';
  return null;
}

/**
 * POST /api/subscription/sync
 *
 * Sincroniza o status da assinatura do RevenueCat com o banco de dados.
 * Chamado pelo app mobile apos compra, restauracao ou ao inicializar.
 *
 * Body: { customerInfo: RevenueCatCustomerInfo }
 */
export async function POST(req: Request) {
  try {
    await init();

    // Autentica o usuario
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse do body
    let body: SyncRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { customerInfo } = body;

    if (!customerInfo) {
      return NextResponse.json(
        { error: 'customerInfo is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Verifica se o usuario tem o entitlement premium ativo
    const activeEntitlements = customerInfo.entitlements?.active || {};
    const premiumEntitlement = activeEntitlements[REVENUECAT.ENTITLEMENT_ID as keyof typeof activeEntitlements] as any;
    // Fallback: qualquer entitlement ativo
    const anyActiveEntitlement = premiumEntitlement?.isActive
      ? premiumEntitlement
      : Object.values(activeEntitlements).find((e: any) => e?.isActive);
    // Fallback 2: produtos ativos conhecidos em activeSubscriptions
    const activeProductId = (customerInfo.activeSubscriptions || []).find((pid) =>
      pid === REVENUECAT.PRODUCTS.MONTHLY || pid === REVENUECAT.PRODUCTS.ANNUAL
    ) || null;
    // Fallback 3: produtos comprados (útil para simulador StoreKit)
    const purchasedProductId = (customerInfo.allPurchasedProductIdentifiers || []).find((pid) =>
      pid === REVENUECAT.PRODUCTS.MONTHLY || pid === REVENUECAT.PRODUCTS.ANNUAL
    ) || null;
    const isPremium = !!anyActiveEntitlement || !!activeProductId || !!purchasedProductId;

    logger.info('[Subscription Sync] Detection', {
      hasEntitlement: !!anyActiveEntitlement,
      activeProductId,
      purchasedProductId,
      isPremium,
      activeSubscriptions: customerInfo.activeSubscriptions,
      allPurchased: customerInfo.allPurchasedProductIdentifiers,
    });

    // Busca estado atual do usuario
    const { rows: userRows } = await pool.query<{
      plan: Plan;
      subscription_status: SubscriptionStatus;
      revenuecat_app_user_id: string | null;
    }>(
      `SELECT plan, subscription_status, revenuecat_app_user_id
       FROM users
       WHERE id = $1 AND tenant_id = $2`,
      [user.id, user.tenantId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = userRows[0];
    const originalAppUserId = customerInfo.originalAppUserId;

    // Determina o novo estado da assinatura
    let newPlan: Plan = 'free';
    let newStatus: SubscriptionStatus = 'active';
    let expiresAt: Date | null = null;
    let productId: string | null = null;
    let store: 'app_store' | 'play_store' | null = null;

    if (isPremium) {
      newPlan = 'premium';
      const ent = anyActiveEntitlement as any;
      // willRenew pode não existir em alguns SDKs → assume true quando houver activeSubscriptions ou purchasedProducts
      const willRenew = ent?.willRenew ?? (activeProductId || purchasedProductId ? true : false);
      newStatus = willRenew ? 'active' : 'canceled';
      productId = ent?.productIdentifier || activeProductId || purchasedProductId;
      // store pode não estar no entitlement; mantém null se indisponível
      store = ent?.store ? mapStoreToDb(ent.store) : null;

      const exp = ent?.expirationDate;
      if (exp) {
        expiresAt = new Date(exp);
      }
    } else {
      // Se nao tem premium ativo, verifica se tinha antes
      if (currentUser.plan === 'premium') {
        newStatus = 'expired';
      }
    }

    // Atualiza o usuario no banco
    await pool.query(
      `UPDATE users SET
        plan = $1,
        subscription_status = $2,
        subscription_expires_at = $3,
        subscription_product_id = $4,
        subscription_store = $5,
        revenuecat_app_user_id = COALESCE($6, revenuecat_app_user_id),
        subscription_started_at = CASE
          WHEN $1::text = 'premium' AND subscription_started_at IS NULL
          THEN NOW()
          ELSE subscription_started_at
        END,
        updated_at = NOW()
      WHERE id = $7 AND tenant_id = $8`,
      [
        newPlan,
        newStatus,
        expiresAt,
        productId,
        store,
        originalAppUserId,
        user.id,
        user.tenantId,
      ]
    );

    logger.info('[Subscription Sync]', {
      userId: user.id,
      previousPlan: currentUser.plan,
      newPlan,
      newStatus,
      isPremium,
      productId,
    });

    return NextResponse.json({
      ok: true,
      synced: true,
      plan: newPlan,
      subscription_status: newStatus,
      expires_at: expiresAt?.toISOString() || null,
    });
  } catch (err: unknown) {
    logger.error('[API] Subscription sync error', err);

    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
