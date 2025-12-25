import { getPool } from '@/lib/db';

export interface ShoppingList {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShoppingItem {
  id: string;
  list_id: string;
  tenant_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  is_purchased: boolean;
  purchased_at: Date | null;
  price: number | null;
  source: 'manual' | 'suggestion' | 'taco' | 'food_bank';
  source_id: string | null;
  suggestion_status: 'pending' | 'accepted' | 'rejected' | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============ SHOPPING LISTS ============

export async function createShoppingList(args: {
  tenantId: string;
  userId: string;
  name: string;
}): Promise<ShoppingList> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<ShoppingList>(
      `INSERT INTO shopping_lists (tenant_id, user_id, name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [args.tenantId, args.userId, args.name]
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

export async function getShoppingListsByUser(args: {
  tenantId: string;
  userId: string;
  status?: 'active' | 'completed' | 'archived';
}): Promise<ShoppingList[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    let query = `SELECT * FROM shopping_lists WHERE tenant_id = $1 AND user_id = $2`;
    const params: any[] = [args.tenantId, args.userId];

    if (args.status) {
      query += ` AND status = $3`;
      params.push(args.status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await client.query<ShoppingList>(query, params);

    await client.query('COMMIT');
    return result.rows;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getShoppingListById(args: {
  tenantId: string;
  userId: string;
  id: string;
}): Promise<ShoppingList | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<ShoppingList>(
      `SELECT * FROM shopping_lists
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

export async function updateShoppingList(args: {
  tenantId: string;
  userId: string;
  id: string;
  name?: string;
  status?: 'active' | 'completed' | 'archived';
}): Promise<ShoppingList | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (args.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(args.name);
    }

    if (args.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(args.status);

      if (args.status === 'completed') {
        updates.push(`completed_at = NOW()`);
      }
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Apenas updated_at, nada a atualizar
      await client.query('COMMIT');
      return null;
    }

    params.push(args.id, args.tenantId, args.userId);

    const result = await client.query<ShoppingList>(
      `UPDATE shopping_lists
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      params
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

export async function deleteShoppingList(args: {
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
      `DELETE FROM shopping_lists
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

// ============ SHOPPING ITEMS ============

export async function addShoppingItem(args: {
  tenantId: string;
  listId: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  source?: 'manual' | 'suggestion' | 'taco' | 'food_bank';
  sourceId?: string;
  suggestionStatus?: 'pending' | 'accepted' | 'rejected';
  notes?: string;
}): Promise<ShoppingItem> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<ShoppingItem>(
      `INSERT INTO shopping_items (tenant_id, list_id, name, quantity, unit, category, source, source_id, suggestion_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        args.tenantId,
        args.listId,
        args.name,
        args.quantity ?? 1,
        args.unit ?? null,
        args.category ?? null,
        args.source ?? 'manual',
        args.sourceId ?? null,
        args.suggestionStatus ?? null,
        args.notes ?? null
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

export async function getShoppingItemsByList(args: {
  tenantId: string;
  listId: string;
}): Promise<ShoppingItem[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<ShoppingItem>(
      `SELECT * FROM shopping_items
       WHERE list_id = $1 AND tenant_id = $2
       ORDER BY is_purchased ASC, created_at ASC`,
      [args.listId, args.tenantId]
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

export async function updateShoppingItem(args: {
  tenantId: string;
  id: string;
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  isPurchased?: boolean;
  price?: number | null;
  suggestionStatus?: 'pending' | 'accepted' | 'rejected';
  notes?: string;
}): Promise<ShoppingItem | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (args.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(args.name);
    }

    if (args.quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`);
      params.push(args.quantity);
    }

    if (args.unit !== undefined) {
      updates.push(`unit = $${paramIndex++}`);
      params.push(args.unit);
    }

    if (args.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(args.category);
    }

    if (args.isPurchased !== undefined) {
      updates.push(`is_purchased = $${paramIndex++}`);
      params.push(args.isPurchased);

      if (args.isPurchased) {
        updates.push(`purchased_at = NOW()`);
      } else {
        updates.push(`purchased_at = NULL`);
      }
    }

    if (args.price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      params.push(args.price);
    }

    if (args.suggestionStatus !== undefined) {
      updates.push(`suggestion_status = $${paramIndex++}`);
      params.push(args.suggestionStatus);
    }

    if (args.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(args.notes);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      await client.query('COMMIT');
      return null;
    }

    params.push(args.id, args.tenantId);

    const result = await client.query<ShoppingItem>(
      `UPDATE shopping_items
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
       RETURNING *`,
      params
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

export async function deleteShoppingItem(args: {
  tenantId: string;
  id: string;
}): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    await client.query(
      `DELETE FROM shopping_items
       WHERE id = $1 AND tenant_id = $2`,
      [args.id, args.tenantId]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ============ SUGGESTIONS ============

export interface FoodSuggestion {
  food_name: string;
  consumption_count: number;
  days_consumed: number;
  avg_quantity: number;
  common_unit: string | null;
  last_consumed: Date;
}

export async function getFoodSuggestions(args: {
  tenantId: string;
  userId: string;
  limit?: number;
}): Promise<FoodSuggestion[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<FoodSuggestion>(
      `WITH food_consumption AS (
        SELECT
          LOWER(TRIM(fi.name)) as food_name,
          COUNT(*) as consumption_count,
          COUNT(DISTINCT DATE(m.consumed_at)) as days_consumed,
          AVG(fi.quantity) as avg_quantity,
          MAX(fi.unit) as common_unit,
          MAX(m.consumed_at) as last_consumed
        FROM food_items fi
        JOIN meals m ON fi.meal_id = m.id
        WHERE m.user_id = $1
          AND m.tenant_id = $2
          AND m.status = 'approved'
          AND m.consumed_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY LOWER(TRIM(fi.name))
        HAVING COUNT(*) >= 2
      )
      SELECT * FROM food_consumption
      ORDER BY consumption_count DESC, days_consumed DESC
      LIMIT $3`,
      [args.userId, args.tenantId, args.limit || 10]
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

export interface PreviousListSuggestion {
  food_name: string;
  list_count: number;
  last_quantity: number;
  common_unit: string | null;
}

export async function duplicateShoppingList(args: {
  tenantId: string;
  userId: string;
  sourceListId: string;
  newName: string;
}): Promise<ShoppingList> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    // Criar nova lista
    const listResult = await client.query<ShoppingList>(
      `INSERT INTO shopping_lists (tenant_id, user_id, name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [args.tenantId, args.userId, args.newName]
    );
    const newList = listResult.rows[0];

    // Copiar itens da lista original (resetando is_purchased)
    await client.query(
      `INSERT INTO shopping_items (tenant_id, list_id, name, quantity, unit, category, source, source_id, notes)
       SELECT $1, $2, name, quantity, unit, category, source, source_id, notes
       FROM shopping_items
       WHERE list_id = $3 AND tenant_id = $1`,
      [args.tenantId, newList.id, args.sourceListId]
    );

    await client.query('COMMIT');
    return newList;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getSuggestionsFromPreviousLists(args: {
  tenantId: string;
  userId: string;
  limit?: number;
}): Promise<PreviousListSuggestion[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<PreviousListSuggestion>(
      `SELECT
        LOWER(TRIM(si.name)) as food_name,
        COUNT(DISTINCT sl.id) as list_count,
        MAX(si.quantity) as last_quantity,
        MAX(si.unit) as common_unit
      FROM shopping_items si
      JOIN shopping_lists sl ON si.list_id = sl.id
      WHERE sl.user_id = $1
        AND sl.tenant_id = $2
        AND sl.status = 'completed'
      GROUP BY LOWER(TRIM(si.name))
      HAVING COUNT(DISTINCT sl.id) >= 2
      ORDER BY list_count DESC
      LIMIT $3`,
      [args.userId, args.tenantId, args.limit || 10]
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
