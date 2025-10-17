import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';
import { logger } from './logger';

export type AiFood = {
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
};

export type AiMealAnalysis = {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: AiFood[];
  notes?: string;
};

function getClient() {
  const e = env();
  return new GoogleGenerativeAI(e.GEMINI_API_KEY);
}

// Schema JSON para forçar resposta estruturada
const responseSchema = {
  type: 'object',
  properties: {
    meal_type: {
      type: 'string',
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      description: 'Tipo da refeição'
    },
    foods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome do alimento' },
          quantity: { type: 'number', description: 'Quantidade' },
          unit: { type: 'string', description: 'Unidade (g, ml, unidade, colher, etc)' },
          calories: { type: 'number', description: 'Calorias totais' },
          protein_g: { type: 'number', description: 'Proteínas em gramas' },
          carbs_g: { type: 'number', description: 'Carboidratos em gramas' },
          fat_g: { type: 'number', description: 'Gorduras em gramas' },
          fiber_g: { type: 'number', description: 'Fibras em gramas' },
          sodium_mg: { type: 'number', description: 'Sódio em miligramas' },
          sugar_g: { type: 'number', description: 'Açúcares em gramas' }
        },
        required: ['name', 'quantity', 'unit']
      }
    },
    notes: { type: 'string', description: 'Observações sobre a refeição' }
  },
  required: ['meal_type', 'foods']
};

const systemPrompt = `Você é um assistente especializado em nutrição. Sua tarefa é analisar refeições e retornar informações nutricionais precisas.

IMPORTANTE:
- Sempre retorne valores realistas e precisos
- Use a tabela TACO (Tabela Brasileira de Composição de Alimentos) como referência quando possível
- Se não tiver certeza dos valores exatos, faça estimativas conservadoras baseadas em alimentos similares
- Normalize as porções para valores comuns (ex: 100g, 200ml, 1 unidade)
- Inclua TODOS os nutrientes quando possível: calorias, proteínas, carboidratos, gorduras, fibras, sódio e açúcares

ANÁLISE NUTRICIONAL:
- Além dos valores nutricionais, forneça uma opinião profissional como nutricionista sobre a qualidade da refeição
- Avalie aspectos como potencial inflamatório, impacto no ganho de peso, equilíbrio nutricional
- Seja objetivo, claro e educativo nas observações
`;

export async function analyzeMealFromText(
  description: string,
  mealType?: string,
  context?: { location_type?: 'home'|'out'; restaurant_name?: string }
): Promise<AiMealAnalysis> {
  const e = env();
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: e.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as any,
      temperature: 0.1,
    }
  });

  const ctxLines: string[] = [];
  if (context?.location_type === 'out') {
    ctxLines.push(`Contexto: a refeição ocorreu FORA DE CASA${context.restaurant_name ? `, no restaurante "${context.restaurant_name}"` : ''}. Considere porções e preparos típicos de restaurante.`);
  } else if (context?.location_type === 'home') {
    ctxLines.push('Contexto: a refeição ocorreu EM CASA.');
  }

  const prompt = `${systemPrompt}

Analise a seguinte descrição de refeição e retorne um JSON estruturado com os alimentos e seus valores nutricionais:

Descrição: ${description}
${mealType ? `Tipo sugerido: ${mealType}` : ''}
${ctxLines.length ? `\n${ctxLines.join('\n')}` : ''}

Para cada alimento, forneça:
- Nome do alimento
- Quantidade e unidade (use unidades comuns: g, ml, unidade, colher, etc)
- Calorias totais
- Macronutrientes: proteína (g), carboidratos (g), gorduras (g)
- Micronutrientes: fibras (g), sódio (mg), açúcares (g)

No campo 'notes', inclua uma análise nutricional CONCISA (máximo 400 caracteres):
- Mencione se há alimentos inflamatórios ou ultraprocessados
- Comente sobre potencial de ganho de peso
- Avalie qualidade nutricional geral
- Seja BREVE e OBJETIVO

Retorne apenas o JSON, sem texto adicional.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as AiMealAnalysis;
    // Trunca notes para evitar erro de limite do banco (500 chars)
    if (parsed.notes && parsed.notes.length > 490) {
      parsed.notes = parsed.notes.substring(0, 487) + '...';
    }
    return parsed;
  } catch (error: any) {
    logger.error('Gemini API error', error);
    throw new Error(`Erro ao analisar refeição: ${error.message}`);
  }
}

export async function analyzeMealFromImage(
  bytes: Uint8Array,
  mediaType: string,
  context?: { location_type?: 'home'|'out'; restaurant_name?: string }
): Promise<AiMealAnalysis> {
  const e = env();
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: e.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as any,
      temperature: 0.1,
    }
  });

  const ctxLines: string[] = [];
  if (context?.location_type === 'out') {
    ctxLines.push(`Contexto: a refeição ocorreu FORA DE CASA${context.restaurant_name ? `, no restaurante "${context.restaurant_name}"` : ''}. Considere porções e preparos típicos de restaurante.`);
  } else if (context?.location_type === 'home') {
    ctxLines.push('Contexto: a refeição ocorreu EM CASA.');
  }

  const prompt = `${systemPrompt}

Analise a imagem desta refeição e identifique todos os alimentos visíveis.
${ctxLines.length ? `\n${ctxLines.join('\n')}` : ''}

Para cada alimento identificado, forneça:
- Nome do alimento
- Quantidade estimada e unidade (g, ml, unidade, etc)
- Calorias totais estimadas
- Macronutrientes estimados: proteína (g), carboidratos (g), gorduras (g)
- Micronutrientes estimados: fibras (g), sódio (mg), açúcares (g)

Também identifique o tipo de refeição (breakfast, lunch, dinner, snack) baseado nos alimentos e horário típico.

No campo 'notes', inclua uma análise nutricional CONCISA (máximo 400 caracteres):
- Mencione se há alimentos inflamatórios ou ultraprocessados
- Comente sobre potencial de ganho de peso
- Avalie qualidade nutricional geral
- Seja BREVE e OBJETIVO

Retorne apenas o JSON estruturado, sem texto adicional.`;

  try {
    // Converte para base64
    const base64Data = Buffer.from(bytes).toString('base64');

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mediaType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const parsed = JSON.parse(text) as AiMealAnalysis;
    // Trunca notes para evitar erro de limite do banco (500 chars)
    if (parsed.notes && parsed.notes.length > 490) {
      parsed.notes = parsed.notes.substring(0, 487) + '...';
    }
    return parsed;
  } catch (error: any) {
    logger.error('Gemini Vision API error', error);
    throw new Error(`Erro ao analisar imagem: ${error.message}`);
  }
}

/**
 * Analyzes food based on description and optional image in base64 format
 */
export async function analyzeFood(
  description: string,
  imageBase64?: string
): Promise<AiMealAnalysis> {
  const e = env();
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: e.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    }
  });

  const prompt = `Analise esta refeição e retorne os valores nutricionais em JSON válido.

${description}

FORMATO EXATO (copie a estrutura):
{
  "meal_type": "lunch",
  "foods": [
    {
      "name": "nome do alimento",
      "quantity": 100,
      "unit": "g",
      "calories": 200,
      "protein_g": 10.5,
      "carbs_g": 30.2,
      "fat_g": 5.1,
      "fiber_g": 3,
      "sodium_mg": 150,
      "sugar_g": 2
    }
  ],
  "notes": "observação breve (max 100 chars)"
}

REGRAS:
- Use números inteiros ou decimais com NO MÁXIMO 2 casas (ex: 10.5, não 10.500000)
- Mantenha valores já informados do banco
- ESTIME valores nutricionais para alimentos novos (use tabela TACO)
- meal_type: breakfast, lunch, dinner ou snack
- notes: ANÁLISE NUTRICIONAL baseada APENAS nos dados fornecidos (máx 200 chars)
  * Analise os VALORES NUTRICIONAIS reais (calorias, macros, açúcar, sódio)
  * NÃO faça suposições sobre processamento sem informação clara
  * Comente sobre equilíbrio de macros, densidade calórica, fibras
  * Avalie impacto no ganho de peso baseado nos números reais
- Retorne APENAS o JSON, sem markdown ou texto extra`;

  try {
    let result;

    if (imageBase64) {
      // Se tem imagem, usa análise multimodal
      const [metadata, base64Data] = imageBase64.split(',');
      const mimeType = metadata.match(/:(.*?);/)?.[1] || 'image/jpeg';

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      result = await model.generateContent([prompt, imagePart]);
    } else {
      // Sem imagem, apenas texto
      result = await model.generateContent(prompt);
    }

    let text = result.response.text();

    // Tenta limpar o JSON caso tenha markdown ou texto extra
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```\s*$/, '');
    }

    let parsed: AiMealAnalysis;
    try {
      parsed = JSON.parse(text);
    } catch (parseError: any) {
      // Se der erro de parsing, loga o texto completo para debug
      logger.error('JSON parse error', { text, error: parseError.message });
      throw new Error(`Erro ao processar resposta da IA: JSON inválido - ${parseError.message}`);
    }

    // Trunca notes para evitar erro de limite do banco (500 chars)
    if (parsed.notes && parsed.notes.length > 490) {
      parsed.notes = parsed.notes.substring(0, 487) + '...';
    }

    return parsed;
  } catch (error: any) {
    logger.error('Gemini API error', error);
    throw new Error(`Erro ao analisar alimento: ${error.message}`);
  }
}
