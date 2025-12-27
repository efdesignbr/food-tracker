import { getPool } from '@/lib/db';

export interface ShoppingList {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  store_id: string | null;
  store_name?: string | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  total_price?: number;
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
  unit_price: number | null;
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

    let query = `
      SELECT
        sl.*,
        s.name as store_name,
        COALESCE(SUM(si.price), 0) as total_price
      FROM shopping_lists sl
      LEFT JOIN stores s ON sl.store_id = s.id
      LEFT JOIN shopping_items si ON sl.id = si.list_id AND si.is_purchased = true
      WHERE sl.tenant_id = $1 AND sl.user_id = $2`;
    const params: any[] = [args.tenantId, args.userId];

    if (args.status) {
      query += ` AND sl.status = $3`;
      params.push(args.status);
    }

    query += ` GROUP BY sl.id, s.name ORDER BY sl.created_at DESC`;

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
      `SELECT sl.*, s.name as store_name
       FROM shopping_lists sl
       LEFT JOIN stores s ON sl.store_id = s.id
       WHERE sl.id = $1 AND sl.tenant_id = $2 AND sl.user_id = $3`,
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
  storeId?: string | null;
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

    if (args.storeId !== undefined) {
      updates.push(`store_id = $${paramIndex++}`);
      params.push(args.storeId);
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
  unitPrice?: number;
}): Promise<ShoppingItem> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<ShoppingItem>(
      `INSERT INTO shopping_items (tenant_id, list_id, name, quantity, unit, category, source, source_id, suggestion_status, notes, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        args.notes ?? null,
        args.unitPrice ?? null
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
  unitPrice?: number | null;
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

    if (args.unitPrice !== undefined) {
      updates.push(`unit_price = $${paramIndex++}`);
      params.push(args.unitPrice);
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
      `SELECT 
        LOWER(TRIM(si.name)) as food_name,
        COUNT(*) as consumption_count,
        COUNT(DISTINCT DATE(si.created_at)) as days_consumed,
        MAX(si.created_at) as last_consumed,
        MODE() WITHIN GROUP (ORDER BY si.unit) as common_unit,
        AVG(si.quantity) as avg_quantity
      FROM shopping_items si
      JOIN shopping_lists sl ON si.list_id = sl.id
      WHERE si.tenant_id = $2
        AND sl.user_id = $1 -- Apenas listas do usuário
        AND si.is_purchased = true
        AND si.created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY 1
      HAVING COUNT(*) >= 2 -- Item comprado pelo menos 2x nos últimos 90 dias
      ORDER BY consumption_count DESC, last_consumed DESC
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
      `INSERT INTO shopping_items (tenant_id, list_id, name, quantity, unit, category, source, source_id, notes, unit_price)
       SELECT $1, $2, name, quantity, unit, category, source, source_id, notes, unit_price
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

// ============ STATS ============

export interface ShoppingStats {
  monthly: { month: string; total: number }[];
  byStore: { storeName: string; total: number }[];
  topItemsPriceHistory: {
    itemName: string;
    history: { date: Date; price: number }[];
  }[];
}

export async function getShoppingStats(args: {
  tenantId: string;
  userId: string;
}): Promise<ShoppingStats> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    // 1. Gastos por Mês (últimos 12 meses)
    const monthlyRes = await client.query(
      `SELECT 
         TO_CHAR(sl.completed_at, 'YYYY-MM') as month, 
         SUM(si.price) as total
       FROM shopping_lists sl
       JOIN shopping_items si ON sl.id = si.list_id
       WHERE sl.tenant_id = $1 
         AND sl.user_id = $2
         AND sl.status = 'completed'
         AND si.is_purchased = true
         AND sl.completed_at >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY 1
       ORDER BY 1 ASC`,
      [args.tenantId, args.userId]
    );

    // 2. Gastos por Loja (Top 10)
    const storeRes = await client.query(
      `SELECT 
         COALESCE(s.name, 'Outros') as store_name, 
         SUM(si.price) as total
       FROM shopping_lists sl
       JOIN shopping_items si ON sl.id = si.list_id
       LEFT JOIN stores s ON sl.store_id = s.id
       WHERE sl.tenant_id = $1 
         AND sl.user_id = $2
         AND sl.status = 'completed'
         AND si.is_purchased = true
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT 10`,
      [args.tenantId, args.userId]
    );

    // 3. Histórico de Preços (Top 5 itens mais frequentes com preço unitário)
    // Primeiro identificamos os itens
    const topItemsRes = await client.query(
      `SELECT LOWER(TRIM(si.name)) as name
       FROM shopping_items si
       JOIN shopping_lists sl ON si.list_id = sl.id
       WHERE sl.tenant_id = $1 
         AND sl.user_id = $2
         AND si.is_purchased = true
         AND si.unit_price IS NOT NULL
       GROUP BY 1
       ORDER BY COUNT(*) DESC
       LIMIT 10`,
      [args.tenantId, args.userId]
    );

    const topItemNames = topItemsRes.rows.map(r => r.name);
    let priceHistory: ShoppingStats['topItemsPriceHistory'] = [];

    if (topItemNames.length > 0) {
      // Para cada item, pegamos o histórico
      const historyRes = await client.query(
        `SELECT 
           LOWER(TRIM(si.name)) as name,
           sl.completed_at as date,
           si.unit_price as price
         FROM shopping_items si
         JOIN shopping_lists sl ON si.list_id = sl.id
         WHERE sl.tenant_id = $1 
           AND sl.user_id = $2
           AND si.is_purchased = true
           AND si.unit_price IS NOT NULL
           AND LOWER(TRIM(si.name)) = ANY($3)
         ORDER BY sl.completed_at ASC`,
        [args.tenantId, args.userId, topItemNames]
      );

      // Agrupar por item
      const historyMap = new Map<string, { date: Date; price: number }[]>();
      topItemNames.forEach(name => historyMap.set(name, []));

      historyRes.rows.forEach(row => {
        const itemHistory = historyMap.get(row.name);
        if (itemHistory) {
          itemHistory.push({
            date: row.date,
            price: Number(row.price)
          });
        }
      });

      priceHistory = Array.from(historyMap.entries()).map(([name, history]) => ({
        itemName: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
        history
      }));
    }

    await client.query('COMMIT');

    return {
      monthly: monthlyRes.rows.map(r => ({ month: r.month, total: Number(r.total) })),
      byStore: storeRes.rows.map(r => ({ storeName: r.store_name, total: Number(r.total) })),
      topItemsPriceHistory: priceHistory
    };

  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
