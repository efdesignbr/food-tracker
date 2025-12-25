import { NextRequest, NextResponse } from 'next/server';
import { analyzeFood } from '@/lib/ai';
import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { getPool } from '@/lib/db';
import { checkQuota, incrementQuota } from '@/lib/quota';
import { searchTacoByName } from '@/lib/repos/taco.repo';
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
      // Tentar buscar na TACO antes de chamar IA
      const foodsFromTaco: any[] = [];
      const foodsForAI: any[] = [];

      for (const f of foodsToEstimate) {
        const tacoMatch = await searchTacoByName(f.name);
        if (tacoMatch && tacoMatch.calories) {
          // Encontrou na TACO - calcular valores proporcionais à quantidade
          // TACO tem valores por 100g, precisamos extrair a quantidade em gramas

          // Tenta extrair quantidade do nome (ex: "150g arroz" -> 150)
          const qtyMatch = f.name.match(/^(\d+)\s*(g|ml|kg|l)\s+/i);
          let qtyInGrams = f.quantity || 100;

          if (qtyMatch) {
            const num = parseFloat(qtyMatch[1]);
            const unit = qtyMatch[2].toLowerCase();
            if (unit === 'kg') qtyInGrams = num * 1000;
            else if (unit === 'l') qtyInGrams = num * 1000;
            else qtyInGrams = num; // g ou ml
          } else if (f.unit && f.unit.toLowerCase().includes('g')) {
            // Se a unidade é gramas, usa a quantidade diretamente
            qtyInGrams = f.quantity || 100;
          }

          const multiplier = qtyInGrams / 100;

          foodsFromTaco.push({
            ...f,
            calories: Math.round((tacoMatch.calories || 0) * multiplier),
            protein_g: Math.round(((tacoMatch.protein || 0) * multiplier) * 10) / 10,
            carbs_g: Math.round(((tacoMatch.carbs || 0) * multiplier) * 10) / 10,
            fat_g: Math.round(((tacoMatch.fat || 0) * multiplier) * 10) / 10,
            fiber_g: tacoMatch.fiber ? Math.round((tacoMatch.fiber * multiplier) * 10) / 10 : null,
            sodium_mg: tacoMatch.sodium ? Math.round(tacoMatch.sodium * multiplier) : null,
            source: 'taco'
          });
        } else {
          // Não encontrou na TACO - vai para IA
          foodsForAI.push(f);
        }
      }

      if (foodsForAI.length > 0) {
        // Ainda tem alimentos para estimar pela IA
        const foodsDescription = foodsForAI.map((f: any) => {
          return `${f.name} (${f.quantity} ${f.unit}) - Novo alimento, precisa estimar valores nutricionais`;
        }).join('\n');

        let description = `Analise esta refeição e estime os valores nutricionais:\n\n${foodsDescription}`;

        if (locationType === 'out' && restaurantName) {
          description += `\n\nLocal: ${restaurantName}`;
        }

        if (imageBase64) {
          description += '\n\n(Foto da refeição anexada para contexto adicional)';
        }

        // Chamar IA apenas para estimar os que não encontrou na TACO
        result = await analyzeFood(description, imageBase64);

        // Combinar: banco + TACO + IA
        result.foods = [...foodsFromBank, ...foodsFromTaco, ...result.foods];
      } else {
        // Todos foram encontrados na TACO - gerar notes via IA
        const allFoods = [...foodsFromBank, ...foodsFromTaco];
        const allFoodsDescription = allFoods.map((f: any) => {
          return `${f.name} (${f.quantity} ${f.unit}): ${f.calories} kcal, ${f.protein_g}g prot, ${f.carbs_g}g carb, ${f.fat_g}g gord`;
        }).join('\n');

        const aiResponse = await analyzeFood(
          `Gere uma análise nutricional breve (máx 200 chars) para esta refeição:\n\n${allFoodsDescription}`
        );

        result = {
          meal_type: aiResponse.meal_type,
          foods: allFoods,
          notes: aiResponse.notes
        };
      }
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
