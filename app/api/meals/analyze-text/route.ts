import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { AnalyzeTextSchema } from '@/lib/schemas/meal';
import { requireTenant } from '@/lib/tenant';
import { analyzeMealFromText } from '@/lib/ai';
import { init } from '@/lib/init';

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const body = await req.json();
    const input = AnalyzeTextSchema.parse(body);

    const result = await analyzeMealFromText(input.description, input.meal_type, {
      location_type: input.location_type,
      restaurant_name: input.restaurant_name
    });
    return NextResponse.json({ ok: true, tenant, result });
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 400;
    const payload = err instanceof Response ? await err.text() : JSON.stringify({ error: err.message });
    return new NextResponse(payload, { status, headers: { 'Content-Type': 'application/json' } });
  }
}
