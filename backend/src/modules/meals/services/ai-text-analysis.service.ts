import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../../config/environment';
import { logger } from '../../../shared/utils/logger';
import { AIAnalysisSchema, AIAnalysisInput } from '../schemas/meal.schema';
import { AppError } from '../../../shared/middleware/error-handler.middleware';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

const TEXT_ANALYSIS_PROMPT = `Analise esta descrição de refeição e retorne APENAS um JSON válido com a seguinte estrutura:

{
  "foods": [
    {
      "name": "nome do alimento em português",
      "quantity": número estimado,
      "unit": "g, ml, unidade, colher, etc",
      "confidence": 0.0 a 1.0,
      "nutrition": {
        "calories": número,
        "protein_g": número,
        "carbs_g": número,
        "fat_g": número,
        "fiber_g": número,
        "sodium_mg": número ou null,
        "sugar_g": número ou null
      }
    }
  ],
  "meal_type": "breakfast, lunch, dinner ou snack",
  "notes": "observações relevantes sobre a refeição, especialmente alimentos potencialmente inflamatórios para intestino (lactose, glúten, gorduras, alimentos processados, etc)"
}

Regras:
- Estime quantidades baseadas em porções padrão
- Para pratos brasileiros, use nomenclatura local
- Nutrição deve ser baseada na quantidade estimada
- IMPORTANTE: Identifique alimentos problemáticos para intestino inflamado (lactose, glúten, gorduras saturadas, alimentos processados, frituras, picantes, fibras insolúveis em excesso)
- Retorne APENAS o JSON, sem markdown ou texto adicional`;

export async function analyzeTextWithAI(
  description: string,
  mealType?: string
): Promise<AIAnalysisInput> {
  try {
    logger.info('Starting AI text analysis', { description });

    const prompt = `Descrição da refeição: "${description}"${mealType ? `\nTipo sugerido: ${mealType}` : ''}\n\n${TEXT_ANALYSIS_PROMPT}`;

    const response = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new AppError(500, 'No text response from AI');
    }

    // Parse JSON response
    let jsonText = textContent.text.trim();

    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const parsed = JSON.parse(jsonText);

    // Validate with Zod
    const validated = AIAnalysisSchema.parse(parsed);

    logger.info('AI text analysis completed', {
      foodCount: validated.foods.length,
      mealType: validated.meal_type,
    });

    return validated;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.error('Failed to parse AI response as JSON', { error });
      throw new AppError(500, 'Invalid AI response format');
    }

    if (error instanceof Anthropic.APIError) {
      logger.error('Anthropic API error', {
        status: error.status,
        message: error.message,
        error: error
      });
      throw new AppError(500, `AI service error: ${error.message}`);
    }

    logger.error('AI text analysis failed', { error });
    throw error;
  }
}
