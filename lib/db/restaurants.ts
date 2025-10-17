import { getPool } from '@/lib/db';

export type DbRestaurant = {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function createRestaurant(args: { tenantId: string; name: string; address?: string | null }) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);
    const { rows } = await client.query<DbRestaurant>(
      `INSERT INTO restaurants (tenant_id, name, address)
       VALUES ($1, $2, $3)
       RETURNING id, tenant_id, name, address, created_at, updated_at`,
      [args.tenantId, args.name.trim(), args.address ?? null]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function listRestaurants(args: { tenantId: string; limit?: number }) {
  const pool = getPool();
  const { rows } = await pool.query<Pick<DbRestaurant, 'id' | 'name' | 'address'>>(
    `SELECT id, name, address
     FROM restaurants
     WHERE tenant_id = $1
     ORDER BY name ASC
     LIMIT $2`,
    [args.tenantId, Math.max(1, args.limit ?? 20)]
  );
  return rows;
}

export async function searchRestaurants(args: { tenantId: string; q: string; limit?: number }) {
  const pool = getPool();
  const q = args.q.trim();
  if (!q) return [] as Array<Pick<DbRestaurant, 'id' | 'name' | 'address'>>;
  const { rows } = await pool.query<Pick<DbRestaurant, 'id' | 'name' | 'address'>>(
    `SELECT id, name, address
     FROM restaurants
     WHERE tenant_id = $1 AND name ILIKE '%' || $2 || '%'
     ORDER BY name ASC
     LIMIT $3`,
    [args.tenantId, q, Math.max(1, args.limit ?? 10)]
  );
  return rows;
}
