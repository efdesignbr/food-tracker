import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { auth } from '@/lib/auth';
import { findMealsWithFoodsByDateRange } from '@/lib/repos/meal.repo';
import { init } from '@/lib/init';
import { logger } from '@/lib/logger';
import { getSessionData } from '@/lib/types/auth';

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Parse query params
    const url = new URL(req.url);
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');

    // Default to last 30 days
    const end = endParam ? new Date(endParam) : new Date();
    const start = startParam ? new Date(startParam) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const meals = await findMealsWithFoodsByDateRange({
      tenantId: tenant.id,
      userId: session.userId,
      start,
      end
    });

    return NextResponse.json({ meals });
  } catch (err: any) {
    logger.error('Error fetching meals', err);
    return NextResponse.json({ error: err?.message || 'unknown_error' }, { status: 400 });
  }
}
