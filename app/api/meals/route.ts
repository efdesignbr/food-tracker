import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { findMealsWithFoodsByDateRange } from '@/lib/repos/meal.repo';
import { init } from '@/lib/init';
import { logger } from '@/lib/logger';
import { getSessionData } from '@/lib/types/auth';
import { getCurrentDateBR } from '@/lib/datetime';
import { getUserPlanById } from '@/lib/quota';
import { PLAN_LIMITS } from '@/lib/constants';

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser() as any;
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Busca o plano do usuário para determinar limite de histórico
    const userPlan = await getUserPlanById(session.userId);
    const historyDays = PLAN_LIMITS[userPlan]?.history_days;

    // Parse query params
    const url = new URL(req.url);
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');

    // Default to last N days based on plan (using America/Sao_Paulo timezone)
    let end: Date;
    if (endParam) {
      end = new Date(endParam);
    } else {
      // Usa a data atual em America/Sao_Paulo
      const todayBR = getCurrentDateBR();
      end = new Date(todayBR + 'T23:59:59-03:00');
    }

    // Se historyDays é null (premium/unlimited), usa 5 anos de histórico
    // Caso contrário usa o limite do plano (free = 30 dias)
    const start = startParam
      ? new Date(startParam)
      : historyDays === null
        ? new Date(end.getTime() - 5 * 365 * 24 * 60 * 60 * 1000) // 5 anos
        : new Date(end.getTime() - historyDays * 24 * 60 * 60 * 1000);

    const meals = await findMealsWithFoodsByDateRange({
      tenantId: tenant.id,
      userId: session.userId,
      start,
      end
    });

    return NextResponse.json({ meals });
  } catch (err: any) {
    // Preserve thrown Response (e.g., 401 from requireTenant)
    if (err instanceof Response) {
      return err;
    }
    logger.error('Error fetching meals', err);
    return NextResponse.json({ error: err?.message || 'unknown_error' }, { status: 400 });
  }
}
