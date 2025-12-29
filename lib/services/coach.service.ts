import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPool } from '@/lib/db';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { getLatestWeightLog } from '@/lib/repos/weight.repo';
import { getLatestBodyMeasurement } from '@/lib/repos/body-measurements.repo';
import { toDateBR, toTimeBR } from '@/lib/datetime';

function getClient() {
  const e = env();
  return new GoogleGenerativeAI(e.GEMINI_API_KEY);
}

export interface CoachContext {
  userId: string;
  tenantId: string;
  weight?: {
    current: number;
    history: Array<{ weight: number; date: string }>;
  };
  measurements?: {
    current: Record<string, number>;
    history: Array<{ date: string; measurements: Record<string, number> }>;
  };
  meals?: {
    recent: Array<{
      date: string;
      time: string;
      foods: string[];
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  };
  micronutrients?: {
    totals: {
      calcium_mg: number;
      iron_mg: number;
      magnesium_mg: number;
      phosphorus_mg: number;
      potassium_mg: number;
      zinc_mg: number;
      vitamin_c_mg: number;
      vitamin_a_mcg: number;
      vitamin_b1_mg: number;
      vitamin_b2_mg: number;
      vitamin_b3_mg: number;
      vitamin_b6_mg: number;
    };
    daysWithData: number;
  };
  userGoals?: {
    goal_type?: string;
    height_cm?: number;
    age?: number;
    gender?: string;
    activity_level?: string;
    target_weight_kg?: number;
    weekly_goal_kg?: number;
  };
  goals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  dietaryRestrictions?: Array<{
    type: string;
    value: string;
    severity: string;
    notes: string | null;
  }>;
}

export interface CoachAnalysis {
  analysisText: string;
  recommendations: string[];
  insights: string[];
  warnings: string[];
}

// JSON Schema para forçar resposta estruturada do Gemini
const responseSchema = {
  type: 'object',
  properties: {
    analysis_text: {
      type: 'string',
      description: 'Análise geral completa do estado nutricional e corporal do usuário'
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista de 3-5 recomendações práticas e específicas'
    },
    insights: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista de 3-5 insights identificados nos dados'
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista de alertas (se houver problemas identificados)'
    }
  },
  required: ['analysis_text', 'recommendations', 'insights', 'warnings']
};

/**
 * Coleta dados do contexto do usuário
 */
export async function gatherUserContext(params: {
  userId: string;
  tenantId: string;
}): Promise<CoachContext> {
  const pool = getPool();
  const context: CoachContext = {
    userId: params.userId,
    tenantId: params.tenantId
  };

  // 1. Buscar peso atual e histórico
  const latestWeight = await getLatestWeightLog({
    userId: params.userId,
    tenantId: params.tenantId
  });

  if (latestWeight) {
    const { rows: weightHistory } = await pool.query(
      `SELECT weight, log_date as date
       FROM weight_logs
       WHERE user_id = $1 AND tenant_id = $2
       ORDER BY log_date DESC
       LIMIT 10`,
      [params.userId, params.tenantId]
    );

    context.weight = {
      current: latestWeight.weight,
      history: weightHistory.map(r => ({ weight: r.weight, date: r.date }))
    };
  }

  // 2. Buscar medidas corporais
  const latestMeasurement = await getLatestBodyMeasurement({
    userId: params.userId,
    tenantId: params.tenantId
  });

  if (latestMeasurement) {
    const { rows: measurementHistory } = await pool.query(
      `SELECT measurement_date as date, waist, neck, chest, hips,
              left_bicep, right_bicep, left_thigh, right_thigh,
              left_calf, right_calf
       FROM body_measurements
       WHERE user_id = $1 AND tenant_id = $2
       ORDER BY measurement_date DESC
       LIMIT 5`,
      [params.userId, params.tenantId]
    );

    context.measurements = {
      current: {
        waist: latestMeasurement.waist || 0,
        neck: latestMeasurement.neck || 0,
        chest: latestMeasurement.chest || 0,
        hips: latestMeasurement.hips || 0,
        bicep: ((latestMeasurement.left_bicep || 0) + (latestMeasurement.right_bicep || 0)) / 2,
        thigh: ((latestMeasurement.left_thigh || 0) + (latestMeasurement.right_thigh || 0)) / 2,
        calf: ((latestMeasurement.left_calf || 0) + (latestMeasurement.right_calf || 0)) / 2
      },
      history: measurementHistory.map(m => ({
        date: m.date,
        measurements: {
          waist: m.waist,
          neck: m.neck,
          chest: m.chest,
          hips: m.hips,
          bicep: ((m.left_bicep || 0) + (m.right_bicep || 0)) / 2,
          thigh: ((m.left_thigh || 0) + (m.right_thigh || 0)) / 2,
          calf: ((m.left_calf || 0) + (m.right_calf || 0)) / 2
        }
      }))
    };
  }

  // 3. Buscar refeições recentes (últimos 30 dias com mais detalhes)
  const { rows: meals } = await pool.query(
    `SELECT m.id, m.meal_type, m.consumed_at,
            array_agg(fi.name) as foods,
            SUM(COALESCE(nd.calories, 0)) as total_calories,
            SUM(COALESCE(nd.protein_g, 0)) as total_protein,
            SUM(COALESCE(nd.carbs_g, 0)) as total_carbs,
            SUM(COALESCE(nd.fat_g, 0)) as total_fat
     FROM meals m
     LEFT JOIN food_items fi ON fi.meal_id = m.id
     LEFT JOIN nutrition_data nd ON nd.food_item_id = fi.id
     WHERE m.user_id = $1 AND m.tenant_id = $2
       AND m.consumed_at >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY m.id, m.meal_type, m.consumed_at
     ORDER BY m.consumed_at DESC
     LIMIT 100`,
    [params.userId, params.tenantId]
  );

  console.log(`📊 [COACH] Found ${meals.length} meals for user ${params.userId}`);
  if (meals.length > 0) {
    console.log('📊 [COACH] Sample meal:', meals[0]);
  }

  context.meals = {
    recent: meals.map(m => {
      const consumedDate = new Date(m.consumed_at);
      return {
        date: toDateBR(consumedDate),
        time: toTimeBR(consumedDate),
        foods: m.foods || [],
        calories: parseFloat(m.total_calories) || 0,
        protein: parseFloat(m.total_protein) || 0,
        carbs: parseFloat(m.total_carbs) || 0,
        fat: parseFloat(m.total_fat) || 0
      };
    })
  };

  // 3.5. Buscar micronutrientes agregados (últimos 30 dias)
  const { rows: microRows } = await pool.query(
    `SELECT
       COUNT(DISTINCT DATE(m.consumed_at)) as days_with_data,
       SUM(COALESCE(nd.calcium_mg, 0)) as total_calcium,
       SUM(COALESCE(nd.iron_mg, 0)) as total_iron,
       SUM(COALESCE(nd.magnesium_mg, 0)) as total_magnesium,
       SUM(COALESCE(nd.phosphorus_mg, 0)) as total_phosphorus,
       SUM(COALESCE(nd.potassium_mg, 0)) as total_potassium,
       SUM(COALESCE(nd.zinc_mg, 0)) as total_zinc,
       SUM(COALESCE(nd.vitamin_c_mg, 0)) as total_vitamin_c,
       SUM(COALESCE(nd.vitamin_a_mcg, 0)) as total_vitamin_a,
       SUM(COALESCE(nd.vitamin_b1_mg, 0)) as total_vitamin_b1,
       SUM(COALESCE(nd.vitamin_b2_mg, 0)) as total_vitamin_b2,
       SUM(COALESCE(nd.vitamin_b3_mg, 0)) as total_vitamin_b3,
       SUM(COALESCE(nd.vitamin_b6_mg, 0)) as total_vitamin_b6
     FROM meals m
     LEFT JOIN food_items fi ON fi.meal_id = m.id
     LEFT JOIN nutrition_data nd ON nd.food_item_id = fi.id
     WHERE m.user_id = $1 AND m.tenant_id = $2
       AND m.consumed_at >= CURRENT_DATE - INTERVAL '30 days'`,
    [params.userId, params.tenantId]
  );

  if (microRows.length > 0 && microRows[0].days_with_data > 0) {
    const m = microRows[0];
    context.micronutrients = {
      totals: {
        calcium_mg: parseFloat(m.total_calcium) || 0,
        iron_mg: parseFloat(m.total_iron) || 0,
        magnesium_mg: parseFloat(m.total_magnesium) || 0,
        phosphorus_mg: parseFloat(m.total_phosphorus) || 0,
        potassium_mg: parseFloat(m.total_potassium) || 0,
        zinc_mg: parseFloat(m.total_zinc) || 0,
        vitamin_c_mg: parseFloat(m.total_vitamin_c) || 0,
        vitamin_a_mcg: parseFloat(m.total_vitamin_a) || 0,
        vitamin_b1_mg: parseFloat(m.total_vitamin_b1) || 0,
        vitamin_b2_mg: parseFloat(m.total_vitamin_b2) || 0,
        vitamin_b3_mg: parseFloat(m.total_vitamin_b3) || 0,
        vitamin_b6_mg: parseFloat(m.total_vitamin_b6) || 0
      },
      daysWithData: parseInt(m.days_with_data) || 0
    };
  }

  // 4. Buscar objetivos e metas do usuário
  const { rows: userGoals } = await pool.query(
    `SELECT goal_type, height_cm, age, gender, activity_level,
            target_weight_kg, weekly_goal_kg,
            goal_calories, goal_protein_g, goal_carbs_g, goal_fat_g
     FROM users
     WHERE id = $1`,
    [params.userId]
  );

  if (userGoals.length > 0) {
    const g = userGoals[0];

    // Objetivos do usuário (perder/ganhar/manter peso)
    context.userGoals = {
      goal_type: g.goal_type,
      height_cm: g.height_cm,
      age: g.age,
      gender: g.gender,
      activity_level: g.activity_level,
      target_weight_kg: g.target_weight_kg ? parseFloat(g.target_weight_kg) : undefined,
      weekly_goal_kg: g.weekly_goal_kg ? parseFloat(g.weekly_goal_kg) : undefined,
    };

    // Metas nutricionais (se definidas)
    if (g.goal_calories) {
      context.goals = {
        calories: g.goal_calories,
        protein: g.goal_protein_g,
        carbs: g.goal_carbs_g,
        fat: g.goal_fat_g
      };
    }
  }

  console.log('📊 [COACH] User goals:', context.userGoals);

  // 5. Buscar restricoes alimentares do usuario
  const { rows: restrictions } = await pool.query(
    `SELECT restriction_type, restriction_value, severity, notes
     FROM user_dietary_restrictions
     WHERE user_id = $1 AND tenant_id = $2`,
    [params.userId, params.tenantId]
  );

  if (restrictions.length > 0) {
    context.dietaryRestrictions = restrictions.map(r => ({
      type: r.restriction_type,
      value: r.restriction_value,
      severity: r.severity,
      notes: r.notes
    }));
    console.log(`📊 [COACH] Found ${restrictions.length} dietary restrictions`);
  }

  return context;
}

/**
 * Analisa o contexto com Gemini IA
 */
export async function analyzeWithAI(context: CoachContext): Promise<CoachAnalysis> {
  const e = env();
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: e.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as any,
      temperature: 0.3,
    }
  });

  const systemPrompt = `Você é um Coach de Saúde e Nutrição PROFISSIONAL especializado em análise corporal e nutricional baseada em dados.

COMPETÊNCIAS TÉCNICAS:
- Cálculo de composição corporal (% gordura, massa magra)
- Análise de balanço energético (TMB, TDEE, déficit/superávit)
- Avaliação de distribuição de macronutrientes
- Identificação de padrões temporais e correlações
- Recomendações baseadas em evidências científicas

DIRETRIZES DE ANÁLISE:
1. **SEJA ESPECÍFICO**: Use números reais, não generalidades
   - ❌ "Você está comendo muito carboidrato"
   - ✅ "Você está consumindo 280g/dia de carboidratos (60% das calorias), recomenda-se 180-200g (40-45%)"

2. **CALCULE MÉTRICAS PROFISSIONAIS**:
   - % de gordura corporal (US Navy Method ou similar)
   - TMB (Taxa Metabólica Basal)
   - TDEE (Gasto Energético Total Diário)
   - Déficit/Superávit calórico real
   - Distribuição de macros (% e gramas)

3. **ANALISE EVOLUÇÃO TEMPORAL**:
   - Compare dados atuais vs anteriores
   - Identifique tendências (ganho/perda de peso, mudanças em medidas)
   - Calcule taxa de mudança (ex: -0.5kg/semana)

4. **RECOMENDAÇÕES ACIONÁVEIS**:
   - Números específicos (ex: "Aumente proteína para 140g/dia")
   - Timing (ex: "Consuma 30g de proteína no café da manhã")
   - Alimentos específicos quando relevante

5. **TOM PROFISSIONAL MAS MOTIVADOR**:
   - Reconheça esforços e acertos
   - Seja honesto sobre problemas sem desmotivar
   - Explique o "porquê" das recomendações

FORMATO DE RESPOSTA:
- analysis_text: Análise técnica completa (3-5 parágrafos com NÚMEROS e CÁLCULOS)
- recommendations: 3-5 ações ESPECÍFICAS com números
- insights: 3-5 descobertas baseadas nos dados
- warnings: Alertas sérios (apenas se houver risco real)`;

  const dataPrompt = buildCoachPrompt(context);
  const fullPrompt = `${systemPrompt}\n\n${dataPrompt}`;

  try {
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    return {
      analysisText: parsed.analysis_text,
      recommendations: parsed.recommendations || [],
      insights: parsed.insights || [],
      warnings: parsed.warnings || []
    };
  } catch (error: any) {
    logger.error('Gemini Coach Analysis error', error);
    throw new Error(`Erro ao analisar com Coach IA: ${error.message}`);
  }
}

/**
 * Constrói o prompt para a IA
 */
function buildCoachPrompt(context: CoachContext): string {
  let prompt = `Analise os seguintes dados do usuário e forneça insights e recomendações:\n\n`;

  // Peso
  if (context.weight) {
    prompt += `## PESO\n`;
    prompt += `Atual: ${context.weight.current} kg\n`;
    if (context.weight.history.length > 1) {
      const oldest = context.weight.history[context.weight.history.length - 1];
      const diff = context.weight.current - oldest.weight;
      const days = Math.ceil(
        (new Date().getTime() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      prompt += `Variação: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg nos últimos ${days} dias\n`;
      prompt += `Histórico (últimos 10 registros): ${context.weight.history.map(h => `${h.weight}kg em ${h.date}`).join(', ')}\n`;
    }
    prompt += `\n`;
  }

  // Medidas
  if (context.measurements) {
    prompt += `## MEDIDAS CORPORAIS\n`;
    prompt += `Medidas atuais:\n`;
    prompt += `- Cintura: ${context.measurements.current.waist} cm\n`;
    prompt += `- Pescoço: ${context.measurements.current.neck} cm\n`;
    prompt += `- Peitoral: ${context.measurements.current.chest} cm\n`;
    prompt += `- Quadril: ${context.measurements.current.hips} cm\n`;
    prompt += `- Bíceps (média): ${context.measurements.current.bicep} cm\n`;
    prompt += `- Coxa (média): ${context.measurements.current.thigh} cm\n`;
    prompt += `- Panturrilha (média): ${context.measurements.current.calf} cm\n`;

    if (context.measurements.history.length > 1) {
      const oldest = context.measurements.history[context.measurements.history.length - 1];
      prompt += `\nEvolução de medidas:\n`;
      prompt += `- Cintura: ${context.measurements.current.waist - (oldest.measurements.waist || 0) > 0 ? '+' : ''}${(context.measurements.current.waist - (oldest.measurements.waist || 0)).toFixed(1)} cm\n`;
      prompt += `- Peitoral: ${context.measurements.current.chest - (oldest.measurements.chest || 0) > 0 ? '+' : ''}${(context.measurements.current.chest - (oldest.measurements.chest || 0)).toFixed(1)} cm\n`;
    }
    prompt += `\n`;
  }

  // Alimentação com análise completa de macros
  if (context.meals && context.meals.recent.length > 0) {
    prompt += `## ALIMENTAÇÃO (últimos 30 dias)\n`;
    prompt += `Total de refeições registradas: ${context.meals.recent.length}\n`;

    // Cálculos nutricionais
    const totalCals = context.meals.recent.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalProtein = context.meals.recent.reduce((sum, m) => sum + ((m as any).protein || 0), 0);
    const totalCarbs = context.meals.recent.reduce((sum, m) => sum + ((m as any).carbs || 0), 0);
    const totalFat = context.meals.recent.reduce((sum, m) => sum + ((m as any).fat || 0), 0);

    const daysWithMeals = new Set(context.meals.recent.map(m => m.date)).size;
    const avgCalsPerDay = totalCals / Math.max(daysWithMeals, 1);
    const avgProteinPerDay = totalProtein / Math.max(daysWithMeals, 1);
    const avgCarbsPerDay = totalCarbs / Math.max(daysWithMeals, 1);
    const avgFatPerDay = totalFat / Math.max(daysWithMeals, 1);

    prompt += `\n**MÉDIAS DIÁRIAS (${daysWithMeals} dias com registros):**\n`;
    prompt += `- Calorias: ${avgCalsPerDay.toFixed(0)} kcal/dia\n`;
    prompt += `- Proteína: ${avgProteinPerDay.toFixed(1)}g/dia (${((avgProteinPerDay * 4 / avgCalsPerDay) * 100).toFixed(0)}% das calorias)\n`;
    prompt += `- Carboidratos: ${avgCarbsPerDay.toFixed(1)}g/dia (${((avgCarbsPerDay * 4 / avgCalsPerDay) * 100).toFixed(0)}% das calorias)\n`;
    prompt += `- Gorduras: ${avgFatPerDay.toFixed(1)}g/dia (${((avgFatPerDay * 9 / avgCalsPerDay) * 100).toFixed(0)}% das calorias)\n\n`;

    // Análise por período
    const last7Days = context.meals.recent.filter(m => {
      const diff = Math.ceil((new Date().getTime() - new Date(m.date).getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 7;
    });

    if (last7Days.length > 0) {
      const cals7d = last7Days.reduce((sum, m) => sum + (m.calories || 0), 0);
      prompt += `**ÚLTIMA SEMANA:**\n`;
      prompt += `- ${last7Days.length} refeições registradas\n`;
      prompt += `- Média: ${(cals7d / Math.min(7, last7Days.length)).toFixed(0)} kcal/dia\n\n`;
    }

    prompt += `**AMOSTRA DE REFEIÇÕES RECENTES (últimas 10):**\n`;
    context.meals.recent.slice(0, 10).forEach(meal => {
      const m = meal as any;
      prompt += `- ${meal.date}: ${meal.foods.filter(f => f).slice(0, 3).join(', ')} - ${meal.calories}kcal (P:${m.protein || 0}g C:${m.carbs || 0}g G:${m.fat || 0}g)\n`;
    });
    prompt += `\n`;
  } else {
    prompt += `## ALIMENTAÇÃO\n`;
    prompt += `⚠️ Nenhuma refeição registrada nos últimos 30 dias.\n`;
    prompt += `IMPORTANTE: Sem dados de alimentação, a análise será limitada apenas a peso e medidas.\n\n`;
  }

  // Objetivos do usuário
  if (context.userGoals) {
    prompt += `## OBJETIVOS E DADOS PESSOAIS DO USUÁRIO\n`;

    const goalTypeMap: Record<string, string> = {
      'lose_weight': 'PERDER PESO (emagrecimento)',
      'gain_weight': 'GANHAR PESO (ganho de massa)',
      'maintain_weight': 'MANTER PESO (manutenção)'
    };

    prompt += `**OBJETIVO PRINCIPAL:** ${goalTypeMap[context.userGoals.goal_type || ''] || 'Não definido'}\n`;

    if (context.userGoals.target_weight_kg) {
      prompt += `- Peso alvo: ${context.userGoals.target_weight_kg} kg\n`;
    }
    if (context.userGoals.weekly_goal_kg) {
      const direction = context.userGoals.weekly_goal_kg > 0 ? 'ganho' : 'perda';
      prompt += `- Meta semanal: ${Math.abs(context.userGoals.weekly_goal_kg)} kg/${direction} por semana\n`;
    }

    prompt += `\n**DADOS PESSOAIS:**\n`;
    if (context.userGoals.height_cm) prompt += `- Altura: ${context.userGoals.height_cm} cm\n`;
    if (context.userGoals.age) prompt += `- Idade: ${context.userGoals.age} anos\n`;
    if (context.userGoals.gender) {
      const genderMap = { 'male': 'Masculino', 'female': 'Feminino', 'other': 'Outro' };
      prompt += `- Gênero: ${genderMap[context.userGoals.gender as keyof typeof genderMap] || context.userGoals.gender}\n`;
    }
    if (context.userGoals.activity_level) {
      const activityMap = {
        'sedentary': 'Sedentário (pouco exercício)',
        'light': 'Leve (1-3 dias/semana)',
        'moderate': 'Moderado (3-5 dias/semana)',
        'active': 'Ativo (6-7 dias/semana)',
        'very_active': 'Muito Ativo (2x/dia ou trabalho físico)'
      };
      prompt += `- Nível de atividade: ${activityMap[context.userGoals.activity_level as keyof typeof activityMap] || context.userGoals.activity_level}\n`;
    }
    prompt += `\n`;
  }

  // Metas nutricionais (se definidas)
  if (context.goals) {
    prompt += `## METAS NUTRICIONAIS DIÁRIAS\n`;
    prompt += `- Calorias: ${context.goals.calories} kcal\n`;
    prompt += `- Proteína: ${context.goals.protein}g\n`;
    prompt += `- Carboidratos: ${context.goals.carbs}g\n`;
    prompt += `- Gorduras: ${context.goals.fat}g\n`;
    prompt += `\n`;
  }

  // Restricoes alimentares
  if (context.dietaryRestrictions && context.dietaryRestrictions.length > 0) {
    prompt += `## RESTRICOES ALIMENTARES DO USUARIO\n`;
    prompt += `**IMPORTANTE:** O usuario possui as seguintes restricoes que DEVEM ser consideradas em TODAS as recomendacoes:\n\n`;

    const typeLabels: Record<string, string> = {
      allergy: 'ALERGIAS (risco de reacao alergica)',
      intolerance: 'INTOLERANCIAS (desconforto digestivo)',
      diet: 'DIETAS (escolha alimentar)',
      religious: 'RESTRICOES RELIGIOSAS',
      medical: 'CONDICOES MEDICAS',
      preference: 'PREFERENCIAS PESSOAIS'
    };

    // Agrupar por tipo
    const grouped: Record<string, typeof context.dietaryRestrictions> = {};
    context.dietaryRestrictions.forEach(r => {
      if (!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type].push(r);
    });

    for (const [type, items] of Object.entries(grouped)) {
      prompt += `**${typeLabels[type] || type.toUpperCase()}:**\n`;
      items.forEach(item => {
        const severityText = type === 'allergy'
          ? ` [Severidade: ${item.severity === 'severe' ? 'GRAVE' : item.severity === 'moderate' ? 'Moderada' : 'Leve'}]`
          : '';
        prompt += `- ${item.value.charAt(0).toUpperCase() + item.value.slice(1).replace(/_/g, ' ')}${severityText}\n`;
        if (item.notes) prompt += `  Obs: ${item.notes}\n`;
      });
      prompt += `\n`;
    }

    prompt += `**DIRETRIZES PARA RECOMENDACOES:**\n`;
    prompt += `- NUNCA recomende alimentos que contenham ingredientes das alergias listadas\n`;
    prompt += `- Para intolerancias, sugira alternativas ou versoes sem o ingrediente\n`;
    prompt += `- Respeite dietas e restricoes religiosas em todas as sugestoes\n`;
    prompt += `- Para condicoes medicas, foque em alimentos adequados para a condicao\n`;
    prompt += `- Se sugerir um alimento, verifique se nao conflita com nenhuma restricao\n\n`;
  }

  // Micronutrientes (se houver dados)
  if (context.micronutrients && context.micronutrients.daysWithData > 0) {
    const micro = context.micronutrients;
    const days = micro.daysWithData;

    // Valores de Referência Diária (RDA) para adultos - baseados em diretrizes internacionais
    const RDA = {
      calcium_mg: 1000,      // mg/dia
      iron_mg: 14,           // mg/dia (média homem/mulher)
      magnesium_mg: 400,     // mg/dia
      phosphorus_mg: 700,    // mg/dia
      potassium_mg: 3500,    // mg/dia
      zinc_mg: 11,           // mg/dia
      vitamin_c_mg: 90,      // mg/dia
      vitamin_a_mcg: 900,    // mcg/dia
      vitamin_b1_mg: 1.2,    // mg/dia (Tiamina)
      vitamin_b2_mg: 1.3,    // mg/dia (Riboflavina)
      vitamin_b3_mg: 16,     // mg/dia (Niacina)
      vitamin_b6_mg: 1.7     // mg/dia
    };

    prompt += `## MICRONUTRIENTES (últimos ${days} dias com dados)\n\n`;
    prompt += `**VALORES DE REFERÊNCIA:** RDA (Recommended Dietary Allowance) para adultos.\n\n`;

    prompt += `| Nutriente | Consumo Total | Média/Dia | RDA/Dia | % da RDA |\n`;
    prompt += `|-----------|---------------|-----------|---------|----------|\n`;

    const formatMicro = (name: string, total: number, rda: number, unit: string) => {
      const avg = total / days;
      const percent = (avg / rda) * 100;
      return `| ${name} | ${total.toFixed(1)}${unit} | ${avg.toFixed(1)}${unit} | ${rda}${unit} | ${percent.toFixed(0)}% |`;
    };

    prompt += formatMicro('Cálcio', micro.totals.calcium_mg, RDA.calcium_mg, 'mg') + '\n';
    prompt += formatMicro('Ferro', micro.totals.iron_mg, RDA.iron_mg, 'mg') + '\n';
    prompt += formatMicro('Magnésio', micro.totals.magnesium_mg, RDA.magnesium_mg, 'mg') + '\n';
    prompt += formatMicro('Fósforo', micro.totals.phosphorus_mg, RDA.phosphorus_mg, 'mg') + '\n';
    prompt += formatMicro('Potássio', micro.totals.potassium_mg, RDA.potassium_mg, 'mg') + '\n';
    prompt += formatMicro('Zinco', micro.totals.zinc_mg, RDA.zinc_mg, 'mg') + '\n';
    prompt += formatMicro('Vitamina C', micro.totals.vitamin_c_mg, RDA.vitamin_c_mg, 'mg') + '\n';
    prompt += formatMicro('Vitamina A', micro.totals.vitamin_a_mcg, RDA.vitamin_a_mcg, 'mcg') + '\n';
    prompt += formatMicro('Vitamina B1', micro.totals.vitamin_b1_mg, RDA.vitamin_b1_mg, 'mg') + '\n';
    prompt += formatMicro('Vitamina B2', micro.totals.vitamin_b2_mg, RDA.vitamin_b2_mg, 'mg') + '\n';
    prompt += formatMicro('Vitamina B3', micro.totals.vitamin_b3_mg, RDA.vitamin_b3_mg, 'mg') + '\n';
    prompt += formatMicro('Vitamina B6', micro.totals.vitamin_b6_mg, RDA.vitamin_b6_mg, 'mg') + '\n';

    prompt += `\n**NOTA IMPORTANTE:** Os dados de micronutrientes dependem da qualidade dos registros alimentares. `;
    prompt += `Se muitos alimentos foram cadastrados sem informações de micronutrientes, os valores podem estar subestimados.\n\n`;
  }

  prompt += `---\n\n`;
  prompt += `## INSTRUÇÕES DE ANÁLISE PROFISSIONAL\n\n`;

  prompt += `**PASSO 1: CALCULE MÉTRICAS**\n`;
  if (context.weight && context.measurements) {
    prompt += `Com os dados disponíveis, calcule:\n`;
    prompt += `- % de Gordura Corporal (use US Navy Method: com cintura, pescoço, e estimativa de altura padrão ~175cm para homem)\n`;
    prompt += `- TMB (Taxa Metabólica Basal) usando Mifflin-St Jeor ou Harris-Benedict\n`;
    prompt += `- TDEE (Total Daily Energy Expenditure) considerando atividade moderada\n`;
    if (context.meals && context.meals.recent.length > 0) {
      prompt += `- Déficit/Superávit calórico real (TDEE vs consumo médio)\n`;
      prompt += `- Taxa de perda/ganho de peso esperada vs real\n`;
    }
  }

  prompt += `\n**PASSO 2: ANÁLISE DE MICRONUTRIENTES (se houver dados)**\n`;
  prompt += `DIRETRIZES PROFISSIONAIS:\n`;
  prompt += `- Analise APENAS se houver dados suficientes (mínimo 7 dias com registros)\n`;
  prompt += `- Compare consumo médio diário com RDA (Recommended Dietary Allowance)\n`;
  prompt += `- Identifique nutrientes com consumo < 70% da RDA como "atenção necessária"\n`;
  prompt += `- Identifique nutrientes com consumo < 50% da RDA como "possível deficiência"\n`;
  prompt += `- NÃO faça diagnósticos médicos - apenas observações educativas\n`;
  prompt += `- Sugira fontes alimentares naturais para nutrientes em baixa\n`;
  prompt += `- Mencione que suplementação deve ser avaliada por profissional de saúde\n`;
  prompt += `- Reconheça limitações: dados podem estar incompletos\n\n`;

  prompt += `**PASSO 3: ANÁLISE TEMPORAL**\n`;
  prompt += `- Compare dados atuais vs anteriores (se houver histórico)\n`;
  prompt += `- Identifique tendências e correlações\n`;
  prompt += `- Avalie consistência do padrão alimentar\n\n`;

  prompt += `**PASSO 4: ESTRUTURE A RESPOSTA JSON**\n\n`;
  prompt += `1. **analysis_text**: Análise técnica completa (4-6 parágrafos) incluindo:\n`;
  prompt += `   - PARÁGRAFO 1: Composição corporal com NÚMEROS (peso atual, % gordura estimado, massa magra aproximada)\n`;
  prompt += `   - PARÁGRAFO 2: Balanço energético com CÁLCULOS (TMB, TDEE, consumo médio, déficit/superávit)\n`;
  prompt += `   - PARÁGRAFO 3: Análise de macronutrientes com PERCENTUAIS e comparação com recomendações\n`;
  prompt += `   - PARÁGRAFO 4: Análise de MICRONUTRIENTES (se houver dados) - identifique nutrientes em baixa e sugira fontes alimentares\n`;
  prompt += `   - PARÁGRAFO 5: Evolução temporal (se houver dados históricos) com taxas de mudança\n`;
  prompt += `   - PARÁGRAFO 6: Síntese e prognóstico baseado nos dados\n\n`;

  prompt += `2. **recommendations**: Array de 3-5 ações ESPECÍFICAS com números exatos:\n`;
  prompt += `   - Ex: "Aumente proteína de ${context.meals?.recent.length ? '120g' : 'X g'} para 150g/dia (distribuir 40g café, 50g almoço, 40g jantar, 20g lanches)"\n`;
  prompt += `   - Ex: "Ajuste déficit calórico de 800kcal para 500kcal/dia para perda sustentável de ~0.5kg/semana"\n`;
  prompt += `   - Ex MICRONUTRIENTES: "Inclua mais fontes de cálcio: 1 copo de leite (300mg), 30g queijo (200mg), ou vegetais verde-escuros"\n`;
  prompt += `   - Ex MICRONUTRIENTES: "Para aumentar ferro: inclua carnes vermelhas magras 2-3x/semana, ou combine leguminosas com vitamina C"\n`;
  prompt += `   - Sempre inclua números específicos e contexto\n\n`;

  prompt += `3. **insights**: Array de 3-5 descobertas baseadas NOS DADOS REAIS:\n`;
  prompt += `   - Ex: "Sua ingestão proteica de X g/kg está abaixo do ideal para preservação de massa magra durante déficit"\n`;
  prompt += `   - Ex: "Padrão de X refeições/dia está bem distribuído, mantendo metabolismo ativo"\n`;
  prompt += `   - Sempre cite números e dados concretos\n\n`;

  prompt += `4. **warnings**: Array de alertas APENAS se houver risco real:\n`;
  prompt += `   - Déficit calórico > 800kcal/dia (risco de perda muscular)\n`;
  prompt += `   - Proteína < 1.2g/kg peso (risco de perda muscular)\n`;
  prompt += `   - Carboidratos < 50g/dia sem supervisão médica\n`;
  prompt += `   - Padrão alimentar muito irregular\n`;
  prompt += `   - MICRONUTRIENTES (tom educativo, não alarmista):\n`;
  prompt += `     * Ferro < 50% RDA por período prolongado: "Seu consumo de ferro está abaixo do ideal. Considere incluir mais fontes como carnes, leguminosas e vegetais verde-escuros. Se sentir fadiga persistente, consulte um profissional de saúde."\n`;
  prompt += `     * Cálcio < 50% RDA: "Consumo de cálcio está baixo. Laticínios, vegetais verde-escuros e peixes com ossos são boas fontes. Importante para saúde óssea a longo prazo."\n`;
  prompt += `     * Vitamina C < 50% RDA: "Vitamina C abaixo do recomendado. Frutas cítricas, morangos, pimentões e brócolis são excelentes fontes."\n`;
  prompt += `   - NÃO use termos alarmistas como "deficiência grave" ou "risco imediato"\n`;
  prompt += `   - Sempre sugira consultar profissional de saúde para avaliação completa\n`;
  prompt += `   - Se não houver riscos sérios, retorne array vazio []\n\n`;

  prompt += `**IMPORTANTE**: Use NÚMEROS REAIS dos dados fornecidos. Não invente valores. Se faltar algum dado para cálculo, mencione isso explicitamente.\n\n`;
  prompt += `Retorne APENAS o JSON estruturado, sem texto adicional.`;

  return prompt;
}

/**
 * Salva análise no banco
 */
export async function saveCoachAnalysis(params: {
  userId: string;
  tenantId: string;
  context: CoachContext;
  analysis: CoachAnalysis;
  analysisDate?: string; // Timestamp enviado pelo frontend no timezone do usuario
}): Promise<void> {
  const pool = getPool();

  // Se o frontend enviou a data, usa ela; senao deixa o banco usar NOW()
  if (params.analysisDate) {
    await pool.query(
      `INSERT INTO coach_analyses (
        tenant_id, user_id, analysis_date, context_data, analysis_text,
        recommendations, insights, warnings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        params.tenantId,
        params.userId,
        params.analysisDate,
        JSON.stringify(params.context),
        params.analysis.analysisText,
        params.analysis.recommendations,
        params.analysis.insights,
        params.analysis.warnings
      ]
    );
  } else {
    await pool.query(
      `INSERT INTO coach_analyses (
        tenant_id, user_id, context_data, analysis_text,
        recommendations, insights, warnings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.tenantId,
        params.userId,
        JSON.stringify(params.context),
        params.analysis.analysisText,
        params.analysis.recommendations,
        params.analysis.insights,
        params.analysis.warnings
      ]
    );
  }
}
