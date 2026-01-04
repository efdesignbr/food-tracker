import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { init } from '@/lib/init';
import { getPool } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getCurrentUser } from '@/lib/auth-helper';
import { getCurrentMonthUsage } from '@/lib/quota';
import { PLAN_LIMITS } from '@/lib/constants';

/**
 * GET /api/subscription/quota
 * Retorna a quota de uso do usuário logado para o mês atual
 */
export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);

    const sessionData = await getCurrentUser();
    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Set tenant context
      await client.query(`SET LOCAL app.tenant_id = '${sessionData.tenantId}'`);

      // Buscar plano do usuário
      const { rows: userRows } = await client.query<{
        plan: string;
      }>(
        'SELECT plan FROM users WHERE id = $1 AND tenant_id = $2',
        [sessionData.userId, sessionData.tenantId]
      );

      if (userRows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const plan = userRows[0].plan;

      // Buscar uso atual do mês usando a função do quota.ts
      const usage = await getCurrentMonthUsage(
        sessionData.userId,
        sessionData.tenantId
      );

      // Definir limites baseados no plano
      let limits = {
        photo_analyses_per_month: 0,
        ocr_analyses_per_month: 0
      };

      if (plan === 'premium') {
        limits = {
          photo_analyses_per_month: PLAN_LIMITS.premium.photo_analyses_per_month,
          ocr_analyses_per_month: PLAN_LIMITS.premium.ocr_analyses_per_month
        };
      } else if (plan === 'unlimited') {
        limits = {
          photo_analyses_per_month: 999999, // Praticamente ilimitado
          ocr_analyses_per_month: 999999
        };
      }

      return NextResponse.json({
        ok: true,
        month: usage.month,
        photo_analyses: usage.photo_analyses,
        ocr_analyses: usage.ocr_analyses,
        text_analyses: usage.text_analyses,
        limits: {
          ...limits,
          text_analyses_per_month: plan === 'premium' ? PLAN_LIMITS.premium.text_analyses_per_month : (plan === 'unlimited' ? 999999 : 0),
          report_analyses_per_month: plan === 'premium' ? PLAN_LIMITS.premium.report_analyses_per_month : (plan === 'unlimited' ? 999999 : 0)
        },
        report_analyses: usage.report_analyses
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    logger.error('[API] Error fetching quota usage', err);
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message || 'unknown_error' }, { status: 400 });
  }
}
