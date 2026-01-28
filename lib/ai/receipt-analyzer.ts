import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface ReceiptAnalysis {
  date: string | null;
  items: ReceiptItem[];
  total: number;
}

export async function analyzeReceipt(
  bytes: Uint8Array,
  mediaType: string
): Promise<ReceiptAnalysis> {
  console.log('[IA] Iniciando analise de nota fiscal...');

  try {
    const e = env();

    if (!e.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY nao configurada');
    }

    const genAI = new GoogleGenerativeAI(e.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: e.GEMINI_MODEL || 'gemini-2.0-flash',
    });

    const prompt = `Analise esta imagem de uma nota fiscal ou cupom fiscal brasileiro e extraia os itens comprados.

INSTRUCOES IMPORTANTES:
1. Identifique a data da compra (se visivel)
2. Extraia TODOS os itens comprados com:
   - Nome do produto (simplificado, sem codigos)
   - Quantidade
   - Unidade (UN, KG, L, PCT, CX, etc)
   - Preco unitario
   - Preco total do item

REGRAS DE EXTRACAO:
- Para produtos pesaveis (KG), a quantidade deve refletir o peso real (ex: 0.450 para 450g)
- Para produtos unitarios (UN), a quantidade deve ser o numero de unidades
- Normalize nomes de produtos: "ARROZ TP1 5KG TIOJOAO" -> "Arroz Tio Joao 5kg"
- NAO inclua linhas de subtotal, desconto, troco, pagamento, etc
- Se nao conseguir identificar um campo, use null ou 0

FORMATO DE RESPOSTA (JSON):
{
  "date": "YYYY-MM-DD ou null",
  "items": [
    {
      "name": "Nome do produto",
      "quantity": 1.5,
      "unit": "KG",
      "unit_price": 12.50,
      "total_price": 18.75
    }
  ],
  "total": 150.00
}

Retorne APENAS o JSON valido, sem texto adicional.`;

    const base64Data = Buffer.from(bytes).toString('base64');

    console.log('[IA] Enviando para Gemini...');

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

    console.log('[IA] Resposta recebida:', text.substring(0, 300));

    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText) as ReceiptAnalysis;

    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('Nenhum item encontrado na nota fiscal');
    }

    parsed.items = parsed.items.map(item => ({
      name: item.name || 'Produto',
      quantity: Number(item.quantity) || 1,
      unit: (item.unit || 'UN').toUpperCase(),
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || 0
    }));

    if (!parsed.total) {
      parsed.total = parsed.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    }

    console.log(`[IA] Analise concluida: ${parsed.items.length} itens encontrados`);

    return parsed;

  } catch (error: any) {
    console.error('[IA] Erro na analise de nota:', {
      message: error.message,
      stack: error.stack
    });

    throw new Error(`Falha na analise da nota fiscal: ${error.message}`);
  }
}
