import { getPool } from '@/lib/db';

export interface Store {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  address: string | null;
  created_at: Date;
}

export async function createStore(args: {
  tenantId: string;
  userId: string;
  name: string;
  address?: string;
}): Promise<Store> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<Store>(
      `INSERT INTO stores (tenant_id, user_id, name, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [args.tenantId, args.userId, args.name, args.address || null]
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

export async function getStoresByUser(args: {
  tenantId: string;
  userId: string;
}): Promise<Store[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<Store>(
      `SELECT * FROM stores
       WHERE tenant_id = $1 AND user_id = $2
       ORDER BY name ASC`,
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

export async function getStoreById(args: {
  tenantId: string;
  userId: string;
  id: string;
}): Promise<Store | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<Store>(
      `SELECT * FROM stores
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

export async function updateStore(args: {
  tenantId: string;
  userId: string;
  id: string;
  name?: string;
  address?: string | null;
}): Promise<Store | null> {
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

    if (args.address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      params.push(args.address);
    }

    if (updates.length === 0) {
      await client.query('COMMIT');
      return null;
    }

    params.push(args.id, args.tenantId, args.userId);

    const result = await client.query<Store>(
      `UPDATE stores
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

export async function deleteStore(args: {
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
      `DELETE FROM stores
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
