import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { getPool } from '@/lib/db';
import { PLAN_LIMITS } from '@/lib/constants';
import type { Plan } from '@/lib/types/subscription';
import { getCurrentDateBR } from '@/lib/datetime';
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

    const adCompleted = (req.headers.get('x-ad-completed') || '').trim() === '1';

    // Gate por anúncio: FREE sempre exige; PREMIUM exige após limite mensal de 5
    if (userPlan === 'free') {
      if (!adCompleted) {
        return NextResponse.json(
          { error: 'watch_ad_required', feature: 'coach_analysis', currentPlan: userPlan },
          { status: 403 }
        );
      }
    } else if (userPlan === 'premium') {
      // Contar análises do mês atual
      const monthStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);
      const { rows: countRows } = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text as count
         FROM coach_analyses
         WHERE user_id = $1 AND tenant_id = $2 AND to_char(analysis_date at time zone 'America/Sao_Paulo', 'YYYY-MM') = $3`,
        [session.userId, tenant.id, monthStr]
      );
      const used = parseInt(countRows[0]?.count || '0', 10);
      const limit = PLAN_LIMITS.premium.coach_analyses_per_month || 5;
      if (used >= limit && !adCompleted) {
        return NextResponse.json(
          { error: 'watch_ad_required', feature: 'coach_analysis', currentPlan: userPlan },
          { status: 403 }
        );
      }
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
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err.message || 'failed_to_analyze' },
      { status: 500 }
    );
  }
}
