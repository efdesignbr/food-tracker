import { NextRequest, NextResponse } from 'next/server';
import { analyzeFood } from '@/lib/ai';
import { requireTenant } from '@/lib/tenant';
import { auth } from '@/lib/auth';
import { getSessionData } from '@/lib/types/auth';
import { init } from '@/lib/init';
import { getPool } from '@/lib/db';
import { checkQuota, incrementQuota } from '@/lib/quota';
import type { Plan } from '@/lib/types/subscription';

export async function POST(req: NextRequest) {
  try {
    // Autenticação
    await init();
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());

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

    // 🔒 PAYWALL: Verificar quota se tem foto
    if (imageBase64) {
      // FREE não pode usar fotos
      if (userPlan === 'free') {
        return NextResponse.json(
          {
            error: 'upgrade_required',
            message: 'Análise de foto é um recurso PREMIUM',
            feature: 'photo_analysis',
            currentPlan: 'free',
            upgradeTo: 'premium',
          },
          { status: 403 }
        );
      }

      // PREMIUM: verificar quota
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

    // Montar prompt para IA
    const foodsDescription = foods.map((f: any) => {
      if (f.calories && f.protein_g) {
        // Alimento do banco - já tem valores nutricionais
        const parts = [
          `${f.name} (${f.quantity} ${f.unit}) - Do banco de alimentos:`,
          `${f.calories} kcal`,
          `${f.protein_g}g proteína`,
          `${f.carbs_g}g carboidrato`,
          `${f.fat_g}g gordura`
        ];

        // Adiciona fibras, sódio e açúcar se existirem
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
      } else {
        // Alimento novo - precisa estimar
        return `${f.name} (${f.quantity} ${f.unit}) - Novo alimento, precisa estimar valores nutricionais`;
      }
    }).join('\n');

    let description = `Analise esta refeição:\n\n${foodsDescription}`;

    if (locationType === 'out' && restaurantName) {
      description += `\n\nLocal: ${restaurantName}`;
    }

    if (imageBase64) {
      description += '\n\n(Foto da refeição anexada para contexto adicional)';
    }

    // Chamar IA
    const result = await analyzeFood(description, imageBase64);

    // ✅ Incrementar quota APÓS sucesso (só se usou foto e é PREMIUM)
    if (imageBase64 && userPlan === 'premium') {
      await incrementQuota(session.userId, tenant.id, 'photo');
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
