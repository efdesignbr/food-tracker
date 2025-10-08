import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { auth } from '@/lib/auth';
import { findMealsWithFoodsByDateRange } from '@/lib/repos/meal.repo';
import { init } from '@/lib/init';

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const userId = (session as any).userId as string | undefined;
    const tokenTenantId = (session as any).tenantId as string | undefined;

    if (!userId || tokenTenantId !== tenant.id) {
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
      userId,
      start,
      end
    });

    return NextResponse.json({ meals });
  } catch (err: any) {
    console.error('Error fetching meals:', err);
    return NextResponse.json({ error: err?.message || 'unknown_error' }, { status: 400 });
  }
}
