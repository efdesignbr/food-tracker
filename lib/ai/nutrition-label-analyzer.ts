import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';

export type NutritionLabelAnalysis = {
  name: string;
  brand?: string;
  serving_size?: string;
  // Macronutrientes principais
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  saturated_fat?: number;
  // Micronutrientes expandidos
  cholesterol?: number;
  calcium?: number;
  magnesium?: number;
  phosphorus?: number;
  iron?: number;
  potassium?: number;
  zinc?: number;
  copper?: number;
  manganese?: number;
  vitamin_c?: number;
  vitamin_a?: number;
  vitamin_b1?: number;
  vitamin_b2?: number;
  vitamin_b3?: number;
  vitamin_b6?: number;
};

export async function analyzeNutritionLabel(
  bytes: Uint8Array,
  mediaType: string
): Promise<NutritionLabelAnalysis> {
  console.log('🤖 [IA] Iniciando análise...');

  try {
    const e = env();

    if (!e.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const genAI = new GoogleGenerativeAI(e.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: e.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    });

    const prompt = `Analise esta imagem de tabela nutricional brasileira e extraia as seguintes informações:

INSTRUÇÕES IMPORTANTES:
1. Extraia APENAS os valores visíveis na imagem
2. Se houver colunas "100g" e "Porção", use SEMPRE os valores da coluna "Porção"
3. Sódio, cálcio, ferro, etc. devem ser em miligramas (mg)
4. Vitaminas B1, B2, B3, B6 em miligramas (mg)
5. Vitamina A em microgramas (mcg)
6. Não invente valores - se não estiver visível, não inclua

FORMATO DE RESPOSTA (JSON):
{
  "name": "Nome do produto",
  "brand": "Marca (opcional)",
  "serving_size": "Tamanho da porção (ex: 30g)",
  "calories": número (kcal),
  "protein": número (gramas),
  "carbs": número (gramas),
  "fat": número (gramas),
  "fiber": número (gramas, opcional),
  "sodium": número (mg, opcional),
  "sugar": número (gramas, opcional),
  "saturated_fat": número (gramas, opcional),
  "cholesterol": número (mg, opcional),
  "calcium": número (mg, opcional),
  "magnesium": número (mg, opcional),
  "phosphorus": número (mg, opcional),
  "iron": número (mg, opcional),
  "potassium": número (mg, opcional),
  "zinc": número (mg, opcional),
  "copper": número (mg, opcional),
  "manganese": número (mg, opcional),
  "vitamin_c": número (mg, opcional),
  "vitamin_a": número (mcg, opcional),
  "vitamin_b1": número (mg, opcional),
  "vitamin_b2": número (mg, opcional),
  "vitamin_b3": número (mg, opcional),
  "vitamin_b6": número (mg, opcional)
}

Retorne APENAS o JSON válido, sem texto adicional.`;

    const base64Data = Buffer.from(bytes).toString('base64');

    console.log('🤖 [IA] Enviando para Gemini...');

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mediaType
        }
      }
    ]);

    const response = result.response;
    const text = response.text();

    console.log('🤖 [IA] Resposta recebida:', text.substring(0, 200));

    // Remove possíveis markdown wrappers
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText) as NutritionLabelAnalysis;

    console.log('✅ [IA] Análise concluída:', parsed);

    return parsed;

  } catch (error: any) {
    console.error('❌ [IA] Erro:', {
      message: error.message,
      stack: error.stack
    });

    throw new Error(`Falha na análise de IA: ${error.message}`);
  }
}
