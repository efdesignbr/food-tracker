import { getPool } from '@/lib/db';
import { REVENUECAT } from '@/lib/constants';
import type {
  RevenueCatWebhookEvent,
  RevenueCatEventType,
  RevenueCatStore,
  ProcessedRevenueCatEvent,
} from '@/lib/types/revenuecat';
import type { Plan, SubscriptionStatus } from '@/lib/types/subscription';
import {
  saveWebhookEvent,
  getEventById,
  updateEventUserId,
} from '@/lib/repos/webhook-events.repo';

/**
 * Processa o payload do webhook e extrai dados relevantes
 */
export function processWebhookPayload(
  payload: RevenueCatWebhookEvent
): ProcessedRevenueCatEvent {
  const event = payload.event;

  // Verifica se e um evento de ativacao
  const isActivateEvent = (REVENUECAT.ACTIVATE_EVENTS as readonly string[]).includes(event.type);
  const isDeactivateEvent = (REVENUECAT.DEACTIVATE_EVENTS as readonly string[]).includes(event.type);

  return {
    eventId: event.id,
    eventType: event.type,
    appUserId: event.app_user_id,
    originalAppUserId: event.original_app_user_id,
    productId: event.product_id,
    store: event.store,
    environment: event.environment,
    priceCents: event.price_in_purchased_currency
      ? Math.round(event.price_in_purchased_currency * 100)
      : null,
    currency: event.currency,
    expirationAt: event.expiration_at_ms
      ? new Date(event.expiration_at_ms)
      : null,
    purchasedAt: new Date(event.purchased_at_ms),
    originalTransactionId: event.original_transaction_id,
    isActive: isActivateEvent && !isDeactivateEvent,
  };
}

/**
 * Busca usuario pelo revenuecat_app_user_id
 */
export async function findUserByRevenueCatId(
  appUserId: string
): Promise<{ id: string; tenant_id: string } | null> {
  const pool = getPool();

  const result = await pool.query<{ id: string; tenant_id: string }>(
    `SELECT id, tenant_id FROM users WHERE revenuecat_app_user_id = $1`,
    [appUserId]
  );

  return result.rows[0] || null;
}

/**
 * Busca usuario pelo ID do banco (UUID)
 * O appUserId do RevenueCat pode ser o UUID do usuario
 */
export async function findUserById(
  userId: string
): Promise<{ id: string; tenant_id: string } | null> {
  const pool = getPool();

  // Verifica se e um UUID valido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return null;
  }

  const result = await pool.query<{ id: string; tenant_id: string }>(
    `SELECT id, tenant_id FROM users WHERE id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Mapeia store do RevenueCat para valor do banco
 */
function mapStoreToDb(store: RevenueCatStore): 'app_store' | 'play_store' | null {
  if (store === 'APP_STORE') return 'app_store';
  if (store === 'PLAY_STORE') return 'play_store';
  return null;
}

/**
 * Atualiza a subscription do usuario no banco
 */
export async function updateUserSubscription(args: {
  userId: string;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  revenuecatAppUserId: string;
  originalTransactionId: string;
  productId: string;
  store: RevenueCatStore;
  expiresAt: Date | null;
}): Promise<void> {
  const pool = getPool();

  const storeValue = mapStoreToDb(args.store);

  await pool.query(
    `UPDATE users SET
      plan = $1,
      subscription_status = $2,
      subscription_started_at = COALESCE(subscription_started_at, NOW()),
      subscription_expires_at = $3,
      revenuecat_app_user_id = $4,
      revenuecat_original_transaction_id = $5,
      subscription_product_id = $6,
      subscription_store = $7,
      updated_at = NOW()
    WHERE id = $8`,
    [
      args.plan,
      args.subscriptionStatus,
      args.expiresAt,
      args.revenuecatAppUserId,
      args.originalTransactionId,
      args.productId,
      storeValue,
      args.userId,
    ]
  );
}

/**
 * Reverte usuario para plano free
 */
export async function revertToFreePlan(userId: string): Promise<void> {
  const pool = getPool();

  await pool.query(
    `UPDATE users SET
      plan = 'free',
      subscription_status = 'expired',
      updated_at = NOW()
    WHERE id = $1`,
    [userId]
  );
}

/**
 * Processa um evento do RevenueCat
 * Retorna true se processado com sucesso, false se ja foi processado antes
 */
export async function handleRevenueCatEvent(
  payload: RevenueCatWebhookEvent
): Promise<{ processed: boolean; userId: string | null; error?: string }> {
  const processed = processWebhookPayload(payload);

  // Verifica duplicidade
  const existingEvent = await getEventById(processed.eventId);
  if (existingEvent) {
    return { processed: false, userId: existingEvent.user_id };
  }

  // Tenta encontrar o usuario
  // Primeiro, tenta pelo revenuecat_app_user_id
  let user = await findUserByRevenueCatId(processed.appUserId);

  // Se nao encontrou, tenta pelo UUID (caso appUserId seja o ID do usuario)
  if (!user) {
    user = await findUserById(processed.appUserId);
  }

  // Salva o evento no banco
  await saveWebhookEvent({
    eventId: processed.eventId,
    eventType: processed.eventType,
    userId: user?.id || null,
    appUserId: processed.appUserId,
    productId: processed.productId,
    store: processed.store,
    environment: processed.environment,
    priceCents: processed.priceCents,
    currency: processed.currency,
    expirationAt: processed.expirationAt,
    rawPayload: payload as unknown as Record<string, unknown>,
  });

  // Se nao encontrou usuario, retorna sem processar a subscription
  if (!user) {
    return {
      processed: true,
      userId: null,
      error: `User not found for app_user_id: ${processed.appUserId}`,
    };
  }

  // Processa baseado no tipo de evento
  const eventType = processed.eventType;

  if ((REVENUECAT.ACTIVATE_EVENTS as readonly string[]).includes(eventType)) {
    // Ativa a subscription
    await updateUserSubscription({
      userId: user.id,
      plan: 'premium',
      subscriptionStatus: 'active',
      revenuecatAppUserId: processed.appUserId,
      originalTransactionId: processed.originalTransactionId,
      productId: processed.productId,
      store: processed.store,
      expiresAt: processed.expirationAt,
    });
  } else if ((REVENUECAT.DEACTIVATE_EVENTS as readonly string[]).includes(eventType)) {
    // Desativa/expira a subscription
    await revertToFreePlan(user.id);
  } else if (eventType === 'BILLING_ISSUE') {
    // Problema de cobranca - atualiza status mas mantem premium por ora
    await updateUserSubscription({
      userId: user.id,
      plan: 'premium',
      subscriptionStatus: 'canceled', // Indica problema, mas ainda tem acesso
      revenuecatAppUserId: processed.appUserId,
      originalTransactionId: processed.originalTransactionId,
      productId: processed.productId,
      store: processed.store,
      expiresAt: processed.expirationAt,
    });
  }
  // Outros eventos (TEST, PRODUCT_CHANGE, etc) sao apenas logados

  return { processed: true, userId: user.id };
}
