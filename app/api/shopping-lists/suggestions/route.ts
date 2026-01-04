import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { getFoodSuggestions, getSuggestionsFromPreviousLists } from '@/lib/repos/shopping-list.repo';

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // Buscar sugestões de ambas as fontes em paralelo
    const [consumptionSuggestions, previousListSuggestions] = await Promise.all([
      getFoodSuggestions({ tenantId: tenant.id, userId: session.userId, limit }),
      getSuggestionsFromPreviousLists({ tenantId: tenant.id, userId: session.userId, limit })
    ]);

    // Combinar sugestões (prioridade: consumo > listas anteriores)
    const seenNames = new Set<string>();
    const combined = [];

    // Primeiro adiciona sugestões de consumo (tem mais dados)
    for (const s of consumptionSuggestions) {
      if (!seenNames.has(s.food_name)) {
        seenNames.add(s.food_name);
        combined.push({
          food_name: s.food_name,
          consumption_count: s.consumption_count,
          days_consumed: s.days_consumed,
          avg_quantity: s.avg_quantity,
          common_unit: s.common_unit,
          last_consumed: s.last_consumed
        });
      }
    }

    // Depois adiciona sugestões de listas anteriores (se não duplicadas)
    for (const s of previousListSuggestions) {
      if (!seenNames.has(s.food_name)) {
        seenNames.add(s.food_name);
        combined.push({
          food_name: s.food_name,
          consumption_count: s.list_count,
          days_consumed: s.list_count,
          avg_quantity: s.last_quantity,
          common_unit: s.common_unit,
          last_consumed: null
        });
      }
    }

    return NextResponse.json({ ok: true, suggestions: combined.slice(0, limit) });
  } catch (err: any) {
    console.error('[suggestions GET] error:', err);
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}
