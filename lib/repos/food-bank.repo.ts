import { getPool } from '@/lib/db';

export interface FoodBankItem {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  brand: string | null;
  serving_size: string | null;
  photo_url: string | null;

  // Informações nutricionais
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
  sugar: number | null;
  saturated_fat: number | null;

  // Micronutrientes
  cholesterol: number | null;
  calcium: number | null;
  magnesium: number | null;
  phosphorus: number | null;
  iron: number | null;
  potassium: number | null;
  zinc: number | null;
  vitamin_c: number | null;
  copper: number | null;
  manganese: number | null;
  vitamin_a: number | null;
  vitamin_b1: number | null;
  vitamin_b2: number | null;
  vitamin_b3: number | null;
  vitamin_b6: number | null;

  // Classificação
  purchasable: boolean;
  category: string | null;

  // Controle de uso
  usage_count: number;
  last_used_at: Date | null;

  // Metadados
  source: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFoodBankItemArgs {
  tenantId: string;
  userId: string;
  name: string;
  brand?: string;
  servingSize?: string;
  photoUrl?: string;

  // Informações nutricionais
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  saturatedFat?: number;

  // Micronutrientes
  cholesterol?: number;
  calcium?: number;
  magnesium?: number;
  phosphorus?: number;
  iron?: number;
  potassium?: number;
  zinc?: number;
  vitaminC?: number;
  copper?: number;
  manganese?: number;
  vitaminA?: number;
  vitaminB1?: number;
  vitaminB2?: number;
  vitaminB3?: number;
  vitaminB6?: number;

  // Classificação
  purchasable?: boolean;
  category?: string;

  source?: string; // 'manual' ou 'ai_analyzed'
}

export async function createFoodBankItem(args: CreateFoodBankItemArgs): Promise<FoodBankItem> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<FoodBankItem>(
      `INSERT INTO food_bank (
        tenant_id, user_id, name, brand, serving_size, photo_url,
        calories, protein, carbs, fat, fiber, sodium, sugar, saturated_fat,
        cholesterol, calcium, magnesium, phosphorus, iron, potassium, zinc, vitamin_c,
        copper, manganese, vitamin_a, vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b6,
        purchasable, category, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
      RETURNING *`,
      [
        args.tenantId,
        args.userId,
        args.name,
        args.brand || null,
        args.servingSize || null,
        args.photoUrl || null,
        args.calories || null,
        args.protein || null,
        args.carbs || null,
        args.fat || null,
        args.fiber || null,
        args.sodium || null,
        args.sugar || null,
        args.saturatedFat || null,
        args.cholesterol || null,
        args.calcium || null,
        args.magnesium || null,
        args.phosphorus || null,
        args.iron || null,
        args.potassium || null,
        args.zinc || null,
        args.vitaminC || null,
        args.copper || null,
        args.manganese || null,
        args.vitaminA || null,
        args.vitaminB1 || null,
        args.vitaminB2 || null,
        args.vitaminB3 || null,
        args.vitaminB6 || null,
        args.purchasable ?? false,
        args.category || null,
        args.source || 'manual'
      ]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function listFoodBankItems(args: {
  tenantId: string;
  userId: string;
  orderBy?: 'name' | 'usage_count' | 'created_at';
  limit?: number;
}): Promise<FoodBankItem[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    let orderClause = 'ORDER BY name ASC';
    if (args.orderBy === 'usage_count') {
      orderClause = 'ORDER BY usage_count DESC, name ASC';
    } else if (args.orderBy === 'created_at') {
      orderClause = 'ORDER BY created_at DESC';
    }

    const limitClause = args.limit ? `LIMIT ${args.limit}` : '';

    const result = await client.query<FoodBankItem>(
      `SELECT * FROM food_bank
       WHERE tenant_id = $1 AND user_id = $2
       ${orderClause}
       ${limitClause}`,
      [args.tenantId, args.userId]
    );

    await client.query('COMMIT');
    return result.rows;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function searchFoodBankItems(args: {
  tenantId: string;
  userId: string;
  query: string;
  limit?: number;
}): Promise<FoodBankItem[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const searchPattern = `%${args.query}%`;
    const limitClause = args.limit ? `LIMIT ${args.limit}` : 'LIMIT 10';

    const result = await client.query<FoodBankItem>(
      `SELECT * FROM food_bank
       WHERE tenant_id = $1 AND user_id = $2
         AND (name ILIKE $3 OR brand ILIKE $3)
       ORDER BY usage_count DESC, name ASC
       ${limitClause}`,
      [args.tenantId, args.userId, searchPattern]
    );

    await client.query('COMMIT');
    return result.rows;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getFoodBankItemById(args: {
  tenantId: string;
  userId: string;
  id: string;
}): Promise<FoodBankItem | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<FoodBankItem>(
      `SELECT * FROM food_bank
       WHERE id = $1 AND tenant_id = $2 AND user_id = $3`,
      [args.id, args.tenantId, args.userId]
    );

    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function updateFoodBankItem(args: {
  tenantId: string;
  userId: string;
  id: string;
  name?: string;
  brand?: string;
  servingSize?: string;
  photoUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  saturatedFat?: number;
  cholesterol?: number;
  calcium?: number;
  magnesium?: number;
  phosphorus?: number;
  iron?: number;
  potassium?: number;
  zinc?: number;
  vitaminC?: number;
  copper?: number;
  manganese?: number;
  vitaminA?: number;
  vitaminB1?: number;
  vitaminB2?: number;
  vitaminB3?: number;
  vitaminB6?: number;
  purchasable?: boolean;
  category?: string;
}): Promise<FoodBankItem> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const updates: string[] = [];
    const values: any[] = [args.id, args.tenantId, args.userId];
    let paramIndex = 4;

    if (args.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(args.name);
    }
    if (args.brand !== undefined) {
      updates.push(`brand = $${paramIndex++}`);
      values.push(args.brand);
    }
    if (args.servingSize !== undefined) {
      updates.push(`serving_size = $${paramIndex++}`);
      values.push(args.servingSize);
    }
    if (args.photoUrl !== undefined) {
      updates.push(`photo_url = $${paramIndex++}`);
      values.push(args.photoUrl);
    }
    if (args.calories !== undefined) {
      updates.push(`calories = $${paramIndex++}`);
      values.push(args.calories);
    }
    if (args.protein !== undefined) {
      updates.push(`protein = $${paramIndex++}`);
      values.push(args.protein);
    }
    if (args.carbs !== undefined) {
      updates.push(`carbs = $${paramIndex++}`);
      values.push(args.carbs);
    }
    if (args.fat !== undefined) {
      updates.push(`fat = $${paramIndex++}`);
      values.push(args.fat);
    }
    if (args.fiber !== undefined) {
      updates.push(`fiber = $${paramIndex++}`);
      values.push(args.fiber);
    }
    if (args.sodium !== undefined) {
      updates.push(`sodium = $${paramIndex++}`);
      values.push(args.sodium);
    }
    if (args.sugar !== undefined) {
      updates.push(`sugar = $${paramIndex++}`);
      values.push(args.sugar);
    }
    if (args.saturatedFat !== undefined) {
      updates.push(`saturated_fat = $${paramIndex++}`);
      values.push(args.saturatedFat);
    }
    if (args.cholesterol !== undefined) {
      updates.push(`cholesterol = $${paramIndex++}`);
      values.push(args.cholesterol);
    }
    if (args.calcium !== undefined) {
      updates.push(`calcium = $${paramIndex++}`);
      values.push(args.calcium);
    }
    if (args.magnesium !== undefined) {
      updates.push(`magnesium = $${paramIndex++}`);
      values.push(args.magnesium);
    }
    if (args.phosphorus !== undefined) {
      updates.push(`phosphorus = $${paramIndex++}`);
      values.push(args.phosphorus);
    }
    if (args.iron !== undefined) {
      updates.push(`iron = $${paramIndex++}`);
      values.push(args.iron);
    }
    if (args.potassium !== undefined) {
      updates.push(`potassium = $${paramIndex++}`);
      values.push(args.potassium);
    }
    if (args.zinc !== undefined) {
      updates.push(`zinc = $${paramIndex++}`);
      values.push(args.zinc);
    }
    if (args.vitaminC !== undefined) {
      updates.push(`vitamin_c = $${paramIndex++}`);
      values.push(args.vitaminC);
    }
    if (args.copper !== undefined) {
      updates.push(`copper = $${paramIndex++}`);
      values.push(args.copper);
    }
    if (args.manganese !== undefined) {
      updates.push(`manganese = $${paramIndex++}`);
      values.push(args.manganese);
    }
    if (args.vitaminA !== undefined) {
      updates.push(`vitamin_a = $${paramIndex++}`);
      values.push(args.vitaminA);
    }
    if (args.vitaminB1 !== undefined) {
      updates.push(`vitamin_b1 = $${paramIndex++}`);
      values.push(args.vitaminB1);
    }
    if (args.vitaminB2 !== undefined) {
      updates.push(`vitamin_b2 = $${paramIndex++}`);
      values.push(args.vitaminB2);
    }
    if (args.vitaminB3 !== undefined) {
      updates.push(`vitamin_b3 = $${paramIndex++}`);
      values.push(args.vitaminB3);
    }
    if (args.vitaminB6 !== undefined) {
      updates.push(`vitamin_b6 = $${paramIndex++}`);
      values.push(args.vitaminB6);
    }
    if (args.purchasable !== undefined) {
      updates.push(`purchasable = $${paramIndex++}`);
      values.push(args.purchasable);
    }
    if (args.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(args.category);
    }

    updates.push(`updated_at = now()`);

    const result = await client.query<FoodBankItem>(
      `UPDATE food_bank
       SET ${updates.join(', ')}
       WHERE id = $1 AND tenant_id = $2 AND user_id = $3
       RETURNING *`,
      values
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteFoodBankItem(args: {
  tenantId: string;
  userId: string;
  id: string;
}): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    await client.query(
      `DELETE FROM food_bank
       WHERE id = $1 AND tenant_id = $2 AND user_id = $3`,
      [args.id, args.tenantId, args.userId]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function incrementUsageCount(args: {
  tenantId: string;
  userId: string;
  id: string;
}): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    await client.query(
      `UPDATE food_bank
       SET usage_count = usage_count + 1,
           last_used_at = now()
       WHERE id = $1 AND tenant_id = $2 AND user_id = $3`,
      [args.id, args.tenantId, args.userId]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
