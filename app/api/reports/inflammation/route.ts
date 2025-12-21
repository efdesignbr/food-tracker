import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { PeriodSchema } from '@/lib/schemas/report';
import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { findMealsWithFoodsByDateRange } from '@/lib/repos/meal.repo';
import { buildInflammationReport } from '@/lib/reports';
import { init } from '@/lib/init';

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (session.tenantId !== tenant.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const url = new URL(req.url);
    const period = PeriodSchema.parse({
      start_date: url.searchParams.get('start_date') || '',
      end_date: url.searchParams.get('end_date') || ''
    });
    const meals = await findMealsWithFoodsByDateRange({ tenantId: tenant.id, userId: session.userId, start: new Date(period.start_date), end: new Date(period.end_date) });
    const report = buildInflammationReport(meals.map(m => ({ consumed_at: m.consumed_at, meal_type: m.meal_type, foods: m.foods.map((f: any) => ({ name: f.name })) })));
    return NextResponse.json({ ok: true, period, total_meals: meals.length, ...report });
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 400;
    const payload = err instanceof Response ? await err.text() : JSON.stringify({ error: err.message });
    return new NextResponse(payload, { status });
  }
}
