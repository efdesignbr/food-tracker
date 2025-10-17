import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';
import { logger } from '../logger';

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

function getClient() {
  const e = env();
  return new GoogleGenerativeAI(e.GEMINI_API_KEY);
}

// Schema JSON para análise de tabela nutricional
const nutritionLabelSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Nome do alimento/produto conforme aparece na embalagem'
    },
    brand: {
      type: 'string',
      description: 'Marca do produto'
    },
    serving_size: {
      type: 'string',
      description: 'Tamanho da porção (ex: 100g, 200ml, 1 unidade)'
    },
    calories: {
      type: 'number',
      description: 'Calorias por porção'
    },
    protein: {
      type: 'number',
      description: 'Proteínas em gramas por porção'
    },
    carbs: {
      type: 'number',
      description: 'Carboidratos em gramas por porção'
    },
    fat: {
      type: 'number',
      description: 'Gorduras totais em gramas por porção'
    },
    fiber: {
      type: 'number',
      description: 'Fibras em gramas por porção'
    },
    sodium: {
      type: 'number',
      description: 'Sódio em miligramas por porção'
    },
    sugar: {
      type: 'number',
      description: 'Açúcares em gramas por porção'
    },
    saturated_fat: {
      type: 'number',
      description: 'Gorduras saturadas em gramas por porção'
    }
  },
  required: ['name']
};

const systemPrompt = `Você é um especialista em OCR e análise de tabelas nutricionais brasileiras.
Sua missão é extrair TODOS os valores nutricionais visíveis na imagem com máxima precisão.

🎯 OBJETIVO PRINCIPAL:
Extrair 100% dos dados nutricionais visíveis, mesmo que parcialmente legíveis.

📋 ESTRUTURA PADRÃO DE TABELAS NUTRICIONAIS BRASILEIRAS:
As tabelas geralmente contêm estas linhas (em ordem):
1. Porção (ex: "30g", "200ml", "2 colheres de sopa (30g)")
2. Valor energético / Calorias (kcal ou kJ)
3. Carboidratos totais (g)
   - dos quais açúcares (g) [sub-item]
4. Proteínas (g)
5. Gorduras totais (g)
   - das quais saturadas (g) [sub-item]
   - das quais trans (g) [sub-item]
6. Fibra alimentar (g)
7. Sódio (mg ou g)

⚠️ REGRAS CRÍTICAS:
1. SEMPRE extraia TODOS os valores visíveis, mesmo que estejam borrados ou parciais
2. Se houver 2 colunas (100g e porção), use SEMPRE a coluna "Porção"
3. NUNCA invente valores - apenas extraia o que está visível
4. Valores podem ser decimais (2.5g, 150.3mg) ou inteiros (25g, 150mg)
5. Se um campo não estiver visível, NÃO inclua no JSON

🔢 CONVERSÕES OBRIGATÓRIAS:
- Sódio: se estiver em g, MULTIPLIQUE por 1000 para mg (ex: 0.5g = 500mg)
- Calorias: se estiver em kJ, DIVIDA por 4.184 para kcal (ex: 418kJ = 100kcal)
- Porção: mantenha exatamente como aparece (ex: "30g", "200ml", "2 col. sopa (30g)")

📍 ONDE PROCURAR OS DADOS:
- Nome/Marca: topo da embalagem, logotipo, título principal
- Porção: primeira linha da tabela nutricional
- Nutrientes: linhas da tabela, podem ter recuo (sub-itens)
- Valores: coluna à direita, procure números seguidos de unidades (g, mg, kcal)`;

export async function analyzeNutritionLabel(
  bytes: Uint8Array,
  mediaType: string
): Promise<NutritionLabelAnalysis> {
  const e = env();
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: e.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: nutritionLabelSchema as any,
      temperature: 0,  // Temperatura 0 para máxima precisão e consistência
    }
  });

  const prompt = `${systemPrompt}

📸 ANALISE ESTA IMAGEM:
Examine cuidadosamente a foto da tabela nutricional brasileira e extraia TODOS os dados visíveis.

📝 PROCEDIMENTO DE EXTRAÇÃO (SIGA EXATAMENTE):

PASSO 1 - Identifique o produto:
- "name": Nome completo do produto (procure no topo da embalagem)
- "brand": Marca (logotipo ou nome do fabricante)

PASSO 2 - Localize a linha "Porção" (primeira linha da tabela):
- "serving_size": Copie exatamente como está escrito (ex: "30g", "200ml", "2 colheres (30g)")

PASSO 3 - Procure "Valor energético" ou "Calorias":
- "calories": Valor em kcal por PORÇÃO (não por 100g!)
- Se estiver em kJ, divida por 4.184

PASSO 4 - Localize "Carboidratos" ou "Carboidratos totais":
- "carbs": Valor em gramas por PORÇÃO
- Abaixo pode ter "dos quais açúcares" (sub-item):
  - "sugar": Valor de açúcares em gramas

PASSO 5 - Procure "Proteínas":
- "protein": Valor em gramas por PORÇÃO

PASSO 6 - Localize "Gorduras totais":
- "fat": Valor em gramas por PORÇÃO
- Abaixo pode ter "das quais saturadas" (sub-item):
  - "saturated_fat": Valor de gorduras saturadas em gramas

PASSO 7 - Procure "Fibra alimentar" ou "Fibras":
- "fiber": Valor em gramas por PORÇÃO

PASSO 8 - Localize "Sódio":
- "sodium": Valor em MILIGRAMAS por PORÇÃO
- ATENÇÃO: Se estiver em g, multiplique por 1000 (ex: 0.25g = 250mg)

⚠️ REGRAS FINAIS:
✓ Use SEMPRE os valores da coluna "Porção" (NÃO da coluna 100g)
✓ Inclua TODOS os campos que conseguir ler
✓ NÃO invente valores - apenas o que está visível
✓ Valores podem ser decimais (2.5) ou inteiros (25)
✓ Se não conseguir ler, omita o campo

Retorne APENAS o JSON, sem explicações.`;

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
    const response = result.response;

    // Log completo da resposta para debug
    console.log('===== GEMINI RESPONSE DEBUG =====');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('=================================');

    const text = response.text();
    console.log('===== TEXT RECEIVED =====');
    console.log(text);
    console.log('=========================');

    const parsed = JSON.parse(text) as NutritionLabelAnalysis;

    return parsed;
  } catch (error: any) {
    console.error('===== ERROR DETAILS =====');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=========================');

    logger.error('Nutrition label analysis error', error);
    throw new Error(`Erro ao analisar tabela nutricional: ${error.message}`);
  }
}
