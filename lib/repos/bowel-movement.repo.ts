import { getPool } from '@/lib/db';
import { getCurrentDateBR } from '@/lib/datetime';

export type DbBowelMovement = {
  id: string;
  user_id: string;
  tenant_id: string;
  occurred_at: Date;
  bristol_type: number; // 1-7
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function insertBowelMovement(args: {
  tenantId: string;
  userId: string;
  occurredAt: Date;
  bristolType: number;
  notes?: string | null;
}): Promise<DbBowelMovement> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<DbBowelMovement>(
      `INSERT INTO bowel_movements (user_id, tenant_id, occurred_at, bristol_type, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [args.userId, args.tenantId, args.occurredAt, args.bristolType, args.notes || null]
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

export async function findBowelMovementsByDateRange(args: {
  tenantId: string;
  userId: string;
  start: Date;
  end: Date;
}): Promise<DbBowelMovement[]> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const { rows } = await client.query<DbBowelMovement>(
      `SELECT * FROM bowel_movements
       WHERE tenant_id = $1 AND user_id = $2
       AND occurred_at::date BETWEEN $3::date AND $4::date
       ORDER BY occurred_at DESC`,
      [args.tenantId, args.userId, args.start, args.end]
    );

    await client.query('COMMIT');
    return rows;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteBowelMovement(args: {
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
      `DELETE FROM bowel_movements
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

export async function countBowelMovementsToday(args: {
  tenantId: string;
  userId: string;
}): Promise<number> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const { rows } = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM bowel_movements
       WHERE tenant_id = $1 AND user_id = $2
       AND DATE(occurred_at AT TIME ZONE 'America/Sao_Paulo') = $3`,
      [args.tenantId, args.userId, getCurrentDateBR()]
    );

    await client.query('COMMIT');
    return parseInt(rows[0].count, 10);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
