import { NextRequest, NextResponse } from 'next/server';
import { analyzeFood } from '@/lib/ai';
import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { getPool } from '@/lib/db';
import { checkQuota, incrementQuota } from '@/lib/quota';
import type { Plan } from '@/lib/types/subscription';

export async function POST(req: NextRequest) {
  try {
    // Autenticação
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';

    let foods: any[] = [];
    let locationType: string | undefined;
    let restaurantName: string | undefined;
    let imageBase64: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      // Com foto
      const formData = await req.formData();
      const image = formData.get('image') as File;
      const dataStr = formData.get('data') as string;

      if (dataStr) {
        const data = JSON.parse(dataStr);
        foods = data.foods || [];
        locationType = data.location_type;
        restaurantName = data.restaurant_name;
      }

      if (image) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageBase64 = `data:${image.type};base64,${buffer.toString('base64')}`;
      }
    } else {
      // Sem foto
      const body = await req.json();
      foods = body.foods || [];
      locationType = body.location_type;
      restaurantName = body.restaurant_name;
    }

    if (foods.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum alimento fornecido' },
        { status: 400 }
      );
    }

    // Buscar plano do usuário (necessário para verificação de quota)
    let userPlan: Plan = 'free';
    if (imageBase64) {
      const pool = getPool();
      const { rows: userData } = await pool.query<{ plan: Plan }>(
        'SELECT plan FROM users WHERE id = $1',
        [session.userId]
      );
      userPlan = (userData[0]?.plan || 'free') as Plan;
    }

    // Verificar quota se tem foto (todos os planos têm limite, exceto UNLIMITED)
    if (imageBase64) {
      const quota = await checkQuota(session.userId, tenant.id, userPlan, 'photo');

      if (!quota.allowed) {
        // Calcular próximo reset (dia 1º do próximo mês)
        const now = new Date();
        const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

        return NextResponse.json(
          {
            error: 'quota_exceeded',
            message: `Você atingiu o limite de ${quota.limit} análises de foto este mês`,
            used: quota.used,
            limit: quota.limit,
            remaining: 0,
            resetDate: nextMonth.toISOString(),
          },
          { status: 429 }
        );
      }
    }

    // Separar alimentos do banco (já tem valores) dos novos (precisam estimar)
    const foodsFromBank: any[] = [];
    const foodsToEstimate: any[] = [];

    for (const f of foods) {
      // Considera do banco se tem todos os valores nutricionais principais
      if (f.calories !== undefined && f.protein_g !== undefined && f.carbs_g !== undefined) {
        foodsFromBank.push(f);
      } else {
        foodsToEstimate.push(f);
      }
    }

    let result: any;

    if (foodsToEstimate.length > 0) {
      // Tem alimentos para estimar - chamar IA
      const foodsDescription = foodsToEstimate.map((f: any) => {
        return `${f.name} (${f.quantity} ${f.unit}) - Novo alimento, precisa estimar valores nutricionais`;
      }).join('\n');

      let description = `Analise esta refeição e estime os valores nutricionais:\n\n${foodsDescription}`;

      if (locationType === 'out' && restaurantName) {
        description += `\n\nLocal: ${restaurantName}`;
      }

      if (imageBase64) {
        description += '\n\n(Foto da refeição anexada para contexto adicional)';
      }

      // Chamar IA apenas para estimar os novos
      result = await analyzeFood(description, imageBase64);

      // Combinar alimentos do banco com os estimados pela IA
      result.foods = [...foodsFromBank, ...result.foods];
    } else {
      // Todos são do banco - não precisa estimar, apenas gerar análise nutricional
      const allFoodsDescription = foodsFromBank.map((f: any) => {
        const parts = [
          `${f.name} (${f.quantity} ${f.unit}):`,
          `${f.calories} kcal`,
          `${f.protein_g}g proteína`,
          `${f.carbs_g}g carboidrato`,
          `${f.fat_g || 0}g gordura`
        ];

        if (f.fiber_g !== undefined && f.fiber_g !== null) {
          parts.push(`${f.fiber_g}g fibras`);
        }
        if (f.sodium_mg !== undefined && f.sodium_mg !== null) {
          parts.push(`${f.sodium_mg}mg sódio`);
        }
        if (f.sugar_g !== undefined && f.sugar_g !== null) {
          parts.push(`${f.sugar_g}g açúcar`);
        }

        return parts.join(', ');
      }).join('\n');

      let description = `Gere uma análise nutricional breve (máx 200 chars) para esta refeição:\n\n${allFoodsDescription}`;

      if (locationType === 'out' && restaurantName) {
        description += `\n\nLocal: ${restaurantName}`;
      }

      // Chamar IA apenas para gerar as notes
      const aiResponse = await analyzeFood(description, imageBase64);

      // Montar resultado mantendo valores do banco
      result = {
        meal_type: aiResponse.meal_type,
        foods: foodsFromBank,
        notes: aiResponse.notes
      };
    }

    // ✅ Incrementar quota APÓS sucesso (exceto UNLIMITED)
    if (userPlan !== 'unlimited') {
      if (imageBase64) {
        await incrementQuota(session.userId, tenant.id, 'photo');
      } else {
        await incrementQuota(session.userId, tenant.id, 'text');
      }
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Erro ao analisar refeição:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao analisar refeição' },
      { status: 500 }
    );
  }
}
