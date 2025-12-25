import { getPool } from '@/lib/db';

/**
 * Interface para alimentos da tabela TACO
 * Valores nutricionais são por 100g do alimento
 */
export interface TacoFood {
  id: number;
  taco_number: number;
  name: string;
  category: string | null;

  // Valores por 100g
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
  cholesterol: number | null;

  // Minerais extras
  calcium: number | null;
  magnesium: number | null;
  iron: number | null;
  potassium: number | null;
  zinc: number | null;

  // Vitaminas
  vitamin_c: number | null;
}

/**
 * Busca alimentos na tabela TACO por nome
 * Estratégia: busca pelo termo principal, ignora modificadores comuns
 */
export async function searchTacoFoods(
  query: string,
  limit: number = 5
): Promise<TacoFood[]> {
  const pool = getPool();

  // Normaliza a query
  const normalizedQuery = query.toLowerCase().trim();

  // Palavras a ignorar na busca (modificadores comuns)
  const stopWords = ['de', 'com', 'sem', 'do', 'da', 'em', 'para', 'ao', 'a', 'o', 'e', 'branco', 'branca', 'integral', 'natural', 'fresco', 'fresca'];

  // Regex para identificar quantidades (ex: 150g, 200ml, 2kg, 100, etc)
  const quantityPattern = /^\d+(\.\d+)?(g|mg|kg|ml|l|un|unidade|unidades|colher|colheres|xicara|xicaras|fatia|fatias|pedaco|pedacos)?$/i;

  // Extrai termos significativos (ignora stopwords e quantidades)
  const terms = normalizedQuery
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopWords.includes(t) && !quantityPattern.test(t));

  if (terms.length === 0) {
    return [];
  }

  // Estratégia 1: Busca com o primeiro termo principal (mais comum)
  const mainTerm = terms[0];

  // Estratégia 2: Se tiver segundo termo, usa para refinar
  const secondTerm = terms.length > 1 ? terms[1] : null;

  let result;

  if (secondTerm) {
    // Tenta com dois termos primeiro
    result = await pool.query<TacoFood>(
      `SELECT
        id, taco_number, name, category,
        calories, protein, carbs, fat, fiber, sodium, cholesterol,
        calcium, magnesium, iron, potassium, zinc, vitamin_c
      FROM taco_foods
      WHERE LOWER(name) ILIKE $1 AND LOWER(name) ILIKE $2
      ORDER BY LENGTH(name)
      LIMIT $3`,
      [`%${mainTerm}%`, `%${secondTerm}%`, limit]
    );

    // Se encontrou, retorna
    if (result.rows.length > 0) {
      return result.rows;
    }
  }

  // Fallback: busca apenas com termo principal
  // Prioriza: começa com termo > cozido > grelhado > assado > cru > outros
  result = await pool.query<TacoFood>(
    `SELECT
      id, taco_number, name, category,
      calories, protein, carbs, fat, fiber, sodium, cholesterol,
      calcium, magnesium, iron, potassium, zinc, vitamin_c
    FROM taco_foods
    WHERE LOWER(name) ILIKE $1
    ORDER BY
      CASE
        WHEN LOWER(name) ILIKE '%cozido%' THEN 1
        WHEN LOWER(name) ILIKE '%grelhado%' THEN 2
        WHEN LOWER(name) ILIKE '%assado%' THEN 3
        WHEN LOWER(name) ILIKE '%refogado%' THEN 4
        WHEN LOWER(name) ILIKE '%frito%' THEN 5
        WHEN LOWER(name) ILIKE '%cru%' THEN 6
        ELSE 7
      END,
      CASE WHEN LOWER(name) LIKE $2 THEN 0 ELSE 1 END,
      LENGTH(name)
    LIMIT $3`,
    [`%${mainTerm}%`, `${mainTerm}%`, limit]
  );

  return result.rows;
}

/**
 * Busca um alimento específico na TACO por nome
 * Retorna o melhor match ou null se não encontrar
 */
export async function searchTacoByName(
  name: string
): Promise<TacoFood | null> {
  const results = await searchTacoFoods(name, 1);
  return results.length > 0 ? results[0] : null;
}

/**
 * Busca alimento por ID da TACO
 */
export async function getTacoFoodById(
  tacoNumber: number
): Promise<TacoFood | null> {
  const pool = getPool();

  const result = await pool.query<TacoFood>(
    `SELECT
      id, taco_number, name, category,
      calories, protein, carbs, fat, fiber, sodium, cholesterol,
      calcium, magnesium, iron, potassium, zinc, vitamin_c
    FROM taco_foods
    WHERE taco_number = $1`,
    [tacoNumber]
  );

  return result.rows[0] || null;
}

/**
 * Lista alimentos por categoria
 */
export async function listTacoFoodsByCategory(
  category: string,
  limit: number = 50
): Promise<TacoFood[]> {
  const pool = getPool();

  const result = await pool.query<TacoFood>(
    `SELECT
      id, taco_number, name, category,
      calories, protein, carbs, fat, fiber, sodium, cholesterol,
      calcium, magnesium, iron, potassium, zinc, vitamin_c
    FROM taco_foods
    WHERE category = $1
    ORDER BY name
    LIMIT $2`,
    [category, limit]
  );

  return result.rows;
}

/**
 * Lista todas as categorias disponíveis
 */
export async function listTacoCategories(): Promise<string[]> {
  const pool = getPool();

  const result = await pool.query<{ category: string }>(
    `SELECT DISTINCT category
    FROM taco_foods
    WHERE category IS NOT NULL
    ORDER BY category`
  );

  return result.rows.map(r => r.category);
}
