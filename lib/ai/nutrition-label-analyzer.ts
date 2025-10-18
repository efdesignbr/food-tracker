import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';

export type NutritionLabelAnalysis = {
  name: string;
  brand?: string;
  serving_size?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  saturated_fat?: number;
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
3. Sódio deve ser convertido para miligramas (mg)
4. Não invente valores - se não estiver visível, não inclua

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
  "sodium": número (miligramas, opcional),
  "sugar": número (gramas, opcional),
  "saturated_fat": número (gramas, opcional)
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
