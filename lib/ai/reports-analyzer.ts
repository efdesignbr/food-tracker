import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';
import { logger } from '../logger';

export type ReportMeal = {
  id: string;
  meal_type: string;
  consumed_at: string | Date;
  foods: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
    sugar_g?: number;
  }>;
  notes?: string;
};

export type WaterRecord = {
  date: string;
  total_ml: number;
};

export type ReportAnalysisResult = {
  summary: string;
  caloric_balance: string;
  macronutrient_distribution: string;
  inflammatory_foods: string;
  meal_regularity: string;
  hydration: string;
  suggestions: string[];
};

function getClient() {
  const e = env();
  return new GoogleGenerativeAI(e.GEMINI_API_KEY);
}

const responseSchema = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'Resumo geral do período analisado (2-3 frases)'
    },
    caloric_balance: {
      type: 'string',
      description: 'Análise do balanço calórico do período'
    },
    macronutrient_distribution: {
      type: 'string',
      description: 'Análise da distribuição de macronutrientes (proteínas, carboidratos, gorduras)'
    },
    inflammatory_foods: {
      type: 'string',
      description: 'Identificação de alimentos inflamatórios consumidos com frequência'
    },
    meal_regularity: {
      type: 'string',
      description: 'Análise da regularidade das refeições (horários, frequência)'
    },
    hydration: {
      type: 'string',
      description: 'Avaliação da hidratação no período'
    },
    suggestions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista de 3-5 sugestões práticas de melhoria'
    }
  },
  required: ['summary', 'caloric_balance', 'macronutrient_distribution', 'inflammatory_foods', 'meal_regularity', 'hydration', 'suggestions']
};

export async function analyzeReportPeriod(
  meals: ReportMeal[],
  waterRecords: WaterRecord[],
  period: { start: string; end: string },
  goals?: { calories?: number; protein?: number; carbs?: number; fat?: number; water?: number }
): Promise<ReportAnalysisResult> {
  const e = env();
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: e.GEMINI_MODEL || 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as any,
      temperature: 0.3,
    }
  });

  // Preparar dados para o prompt
  const totalMeals = meals.length;
  const totalCalories = meals.reduce((sum, meal) =>
    sum + meal.foods.reduce((s, f) => s + (f.calories || 0), 0), 0
  );
  const totalProtein = meals.reduce((sum, meal) =>
    sum + meal.foods.reduce((s, f) => s + (f.protein_g || 0), 0), 0
  );
  const totalCarbs = meals.reduce((sum, meal) =>
    sum + meal.foods.reduce((s, f) => s + (f.carbs_g || 0), 0), 0
  );
  const totalFat = meals.reduce((sum, meal) =>
    sum + meal.foods.reduce((s, f) => s + (f.fat_g || 0), 0), 0
  );
  const totalFiber = meals.reduce((sum, meal) =>
    sum + meal.foods.reduce((s, f) => s + (f.fiber_g || 0), 0), 0
  );
  const totalSodium = meals.reduce((sum, meal) =>
    sum + meal.foods.reduce((s, f) => s + (f.sodium_mg || 0), 0), 0
  );

  const totalWater = waterRecords.reduce((sum, r) => sum + r.total_ml, 0);
  const avgWaterPerDay = waterRecords.length > 0 ? totalWater / waterRecords.length : 0;

  // Calcular dias do período
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Agrupar alimentos por frequência
  const foodFrequency: Record<string, number> = {};
  meals.forEach(meal => {
    meal.foods.forEach(food => {
      const name = food.name.toLowerCase();
      foodFrequency[name] = (foodFrequency[name] || 0) + 1;
    });
  });

  const topFoods = Object.entries(foodFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => `${name} (${count}x)`);

  // Agrupar refeições por tipo
  const mealsByType: Record<string, number> = {};
  meals.forEach(meal => {
    mealsByType[meal.meal_type] = (mealsByType[meal.meal_type] || 0) + 1;
  });

  // Construir prompt detalhado
  const systemPrompt = `Você é um nutricionista experiente especializado em análise de padrões alimentares.
Sua tarefa é analisar os dados de alimentação de um período específico e fornecer insights profissionais, objetivos e práticos.

DIRETRIZES:
- Seja DIRETO e OBJETIVO em todas as análises
- Use linguagem clara e acessível (evite jargões técnicos excessivos)
- Priorize insights ACIONÁVEIS sobre descrições genéricas
- Identifique padrões positivos e negativos
- Seja honesto sobre problemas, mas também reconheça acertos
- Mantenha tom profissional, mas amigável e motivador
- Limite cada seção a 2-4 frases concisas
- As sugestões devem ser ESPECÍFICAS e PRÁTICAS (não genéricas)`;

  const dataPrompt = `PERÍODO ANALISADO: ${period.start} até ${period.end} (${daysDiff} dias)

DADOS NUTRICIONAIS TOTAIS:
- Total de refeições: ${totalMeals}
- Calorias totais: ${totalCalories.toFixed(0)} kcal (média de ${(totalCalories / daysDiff).toFixed(0)} kcal/dia)
- Proteínas: ${totalProtein.toFixed(1)}g total (média de ${(totalProtein / daysDiff).toFixed(1)}g/dia)
- Carboidratos: ${totalCarbs.toFixed(1)}g total (média de ${(totalCarbs / daysDiff).toFixed(1)}g/dia)
- Gorduras: ${totalFat.toFixed(1)}g total (média de ${(totalFat / daysDiff).toFixed(1)}g/dia)
- Fibras: ${totalFiber.toFixed(1)}g total
- Sódio: ${totalSodium.toFixed(0)}mg total

HIDRATAÇÃO:
- Água total: ${(totalWater / 1000).toFixed(1)}L
- Média por dia: ${avgWaterPerDay.toFixed(0)}ml/dia
- Dias com registro de água: ${waterRecords.length}

DISTRIBUIÇÃO DE REFEIÇÕES POR TIPO:
${Object.entries(mealsByType).map(([type, count]) => `- ${type}: ${count} refeições`).join('\n')}

TOP 10 ALIMENTOS MAIS CONSUMIDOS:
${topFoods.join(', ')}

${goals ? `METAS DO USUÁRIO:
- Calorias: ${goals.calories || 'não definida'} kcal/dia
- Proteína: ${goals.protein || 'não definida'}g/dia
- Carboidratos: ${goals.carbs || 'não definida'}g/dia
- Gorduras: ${goals.fat || 'não definida'}g/dia
- Água: ${goals.water || 'não definida'}ml/dia` : ''}

ANALISE OS DADOS ACIMA E FORNEÇA:

1. **summary**: Resumo executivo do período (2-3 frases destacando os principais achados)

2. **caloric_balance**: Avalie se o consumo calórico está adequado, excessivo ou insuficiente. ${goals?.calories ? `Compare com a meta de ${goals.calories} kcal/dia.` : ''} Seja específico sobre o impacto (ex: ganho/perda de peso estimada).

3. **macronutrient_distribution**: Analise a distribuição dos macronutrientes. Calcule percentuais aproximados (proteína, carbs, gordura) e avalie se está equilibrada. Identifique se há excesso ou carência de algum macro.

4. **inflammatory_foods**: Identifique alimentos potencialmente inflamatórios nos top 10 (laticínios, glúten, frituras, processados, açúcar, etc). Se encontrar, mencione a frequência e impacto. Se não encontrar, elogie.

5. **meal_regularity**: Avalie a regularidade das refeições. Há pulos de refeição? Distribuição equilibrada ao longo do dia? Média de refeições por dia está adequada?

6. **hydration**: Avalie a hidratação. ${goals?.water ? `Compare com a meta de ${goals.water}ml/dia.` : 'O ideal é 2000-3000ml/dia.'} Seja direto sobre adequação.

7. **suggestions**: Liste 3-5 sugestões PRÁTICAS e ESPECÍFICAS (não genéricas como "coma mais vegetais"). Exemplos: "Aumente proteína no café da manhã para 25-30g", "Reduza consumo de pão branco de 7x para 2-3x por semana", "Adicione 500ml de água nos períodos entre 10h-12h e 15h-17h".

Retorne apenas o JSON estruturado, sem texto adicional.`;

  try {
    const result = await model.generateContent(systemPrompt + '\n\n' + dataPrompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as ReportAnalysisResult;
    return parsed;
  } catch (error: any) {
    logger.error('Gemini Reports Analysis API error', error);
    throw new Error(`Erro ao analisar relatório: ${error.message}`);
  }
}
