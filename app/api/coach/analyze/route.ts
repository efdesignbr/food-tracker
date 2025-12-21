import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { getPool } from '@/lib/db';
import { PLAN_LIMITS } from '@/lib/constants';
import type { Plan } from '@/lib/types/subscription';
import {
  gatherUserContext,
  analyzeWithAI,
  saveCoachAnalysis
} from '@/lib/services/coach.service';

export async function POST(req: Request) {
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

    // Buscar plano do usuário
    const pool = getPool();
    const { rows: userData } = await pool.query<{ plan: Plan }>(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );
    const userPlan = (userData[0]?.plan || 'free') as Plan;

    // Verificar se o plano tem acesso ao Coach IA
    if (!PLAN_LIMITS[userPlan].coach_ai) {
      return NextResponse.json(
        {
          error: 'upgrade_required',
          message: 'Coach IA é um recurso exclusivo PREMIUM',
          feature: 'coach_analysis',
          currentPlan: userPlan,
          upgradeTo: 'premium',
        },
        { status: 403 }
      );
    }

    // Coletar contexto
    const context = await gatherUserContext({
      userId: session.userId,
      tenantId: tenant.id
    });

    // Validar dados mínimos
    if (!context.weight && !context.measurements && (!context.meals || context.meals.recent.length === 0)) {
      return NextResponse.json({
        error: 'insufficient_data',
        message: 'Dados insuficientes para análise. Registre pelo menos peso, medidas ou refeições.'
      }, { status: 400 });
    }

    // Analisar com IA
    const analysis = await analyzeWithAI(context);

    // Salvar no banco
    await saveCoachAnalysis({
      userId: session.userId,
      tenantId: tenant.id,
      context,
      analysis
    });

    return NextResponse.json({
      ok: true,
      analysis
    });
  } catch (err: any) {
    console.error('Coach analyze error:', err);
    return NextResponse.json(
      { error: err.message || 'failed_to_analyze' },
      { status: 500 }
    );
  }
}
