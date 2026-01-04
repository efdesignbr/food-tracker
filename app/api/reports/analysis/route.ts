import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { findMealsWithFoodsByDateRange } from '@/lib/repos/meal.repo';
import { init } from '@/lib/init';
import { analyzeReportPeriod } from '@/lib/ai/reports-analyzer';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import type { Plan } from '@/lib/types/subscription';

const AnalysisRequestSchema = z.object({
  start_date: z.string().min(1, 'Data inicial é obrigatória'),
  end_date: z.string().min(1, 'Data final é obrigatória'),
  goals: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    water: z.number().optional(),
  }).optional()
});

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

    // Verificar plano do usuário
    const pool = getPool();
    const { rows: userData } = await pool.query<{ plan: Plan }>(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );
    const userPlan = (userData[0]?.plan || 'free') as Plan;

    // Gate por anúncio para FREE; Premium exige anúncio quando exceder 5/mês
    const adCompleted = (req.headers.get('x-ad-completed') || '').trim() === '1';
    if (userPlan === 'free' && !adCompleted) {
      return NextResponse.json(
        { error: 'watch_ad_required', feature: 'ai_reports', currentPlan: 'free' },
        { status: 403 }
      );
    }
    if (userPlan === 'premium') {
      const { checkQuota } = await import('@/lib/quota');
      const quota = await checkQuota(session.userId, tenant.id, userPlan, 'report' as any);
      if (!quota.allowed && !adCompleted) {
        return NextResponse.json(
          { error: 'watch_ad_required', feature: 'ai_reports', currentPlan: 'premium' },
          { status: 403 }
        );
      }
    }

    // Parse request body
    const body = await req.json();
    const { start_date, end_date, goals } = AnalysisRequestSchema.parse(body);

    // Validar que end_date >= start_date
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'Data final deve ser maior ou igual à data inicial' },
        { status: 400 }
      );
    }

    // Validar que o período não seja muito longo (máximo 90 dias para performance)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return NextResponse.json(
        { error: 'Período máximo permitido é de 90 dias' },
        { status: 400 }
      );
    }

    // Buscar refeições do período
    const meals = await findMealsWithFoodsByDateRange({
      tenantId: tenant.id,
      userId: session.userId,
      start: startDate,
      end: endDate
    });

    // Se não houver refeições, retornar erro amigável
    if (meals.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma refeição encontrada neste período' },
        { status: 404 }
      );
    }

    // Buscar dados de água do período
    const waterIntakeRows = await pool.query(
      `SELECT
        DATE(consumed_at) as date,
        SUM(amount_ml) as total_ml
      FROM water_intake
      WHERE user_id = $1
        AND tenant_id = $2
        AND consumed_at >= $3
        AND consumed_at <= $4
      GROUP BY DATE(consumed_at)
      ORDER BY date`,
      [session.userId, tenant.id, startDate, endDate]
    );

    const waterRecords: Array<{ date: string; total_ml: number }> = waterIntakeRows.rows.map(row => ({
      date: row.date,
      total_ml: Number(row.total_ml)
    }));

    // Chamar análise de IA
    const analysis = await analyzeReportPeriod(
      meals.map(m => ({
        id: m.id,
        meal_type: m.meal_type,
        consumed_at: m.consumed_at,
        foods: m.foods.map((f: any) => ({
          name: f.name,
          quantity: f.quantity,
          unit: f.unit,
          calories: f.calories,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,
          fat_g: f.fat_g,
          fiber_g: f.fiber_g,
          sodium_mg: f.sodium_mg,
          sugar_g: f.sugar_g
        })),
        notes: m.notes || undefined
      })),
      waterRecords,
      { start: start_date, end: end_date },
      goals
    );

    // Incrementa quota de relatórios
    if (userPlan !== 'unlimited') {
      const { incrementQuota } = await import('@/lib/quota');
      await incrementQuota(session.userId, tenant.id, 'report' as any);
    }

    return NextResponse.json({
      ok: true,
      period: { start: start_date, end: end_date, days: daysDiff },
      total_meals: meals.length,
      analysis
    });

  } catch (err: any) {
    // Tratamento de erros Zod
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.errors },
        { status: 400 }
      );
    }

    // Tratamento de erros gerais
    const status = err instanceof Response ? err.status : 500;
    const message = err.message || 'Erro interno do servidor';

    console.error('Error in /api/reports/analysis:', err);

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
