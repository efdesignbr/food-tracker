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
    if (!userId || tokenTenantId !== tenant.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const url = new URL(req.url);
    const start = url.searchParams.get('start_date');
    const end = url.searchParams.get('end_date');
    if (!start || !end) {
      return NextResponse.json({ error: 'missing_period' }, { status: 400 });
    }
    const meals = await findMealsWithFoodsByDateRange({ tenantId: tenant.id, userId, start: new Date(start), end: new Date(end) });
    return NextResponse.json({ ok: true, items: meals });
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 400;
    const payload = err instanceof Response ? await err.text() : JSON.stringify({ error: err.message });
    return new NextResponse(payload, { status });
  }
}
