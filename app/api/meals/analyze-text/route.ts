import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { AnalyzeTextSchema } from '@/lib/schemas/meal';
import { requireTenant } from '@/lib/tenant';
import { analyzeMealFromText } from '@/lib/ai';
import { init } from '@/lib/init';
import { getCurrentUser } from '@/lib/auth-helper';

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);

    // Autenticação
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // TODO: Implementar Reward Ads para usuários FREE
    // Após aprovação na Apple Store, adicionar:
    // 1. Verificação de créditos de análise (ganhos via Reward Ad)
    // 2. Se FREE sem créditos, retornar 403 com error: 'watch_ad_required'
    // 3. Decrementar crédito após análise bem-sucedida
    // Custo estimado: ~$0.00024 por análise (Gemini 2.0 Flash)
    // Reward Ad paga ~$0.01-0.03, cobre ~40-120 análises

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
