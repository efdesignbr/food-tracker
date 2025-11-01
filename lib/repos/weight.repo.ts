import { getPool } from '@/lib/db';
import { getDefaultTimeBR } from '@/lib/datetime';

export interface WeightLog {
  id: string;
  tenant_id: string;
  user_id: string;
  weight: number;
  log_date: string;
  log_time: string;
  notes: string | null;
  created_at: Date;
}

export async function insertWeightLog(args: {
  tenantId: string;
  userId: string;
  weight: number;
  logDate: string;
  logTime?: string;
  notes?: string;
}): Promise<WeightLog> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<WeightLog>(
      `INSERT INTO weight_logs (tenant_id, user_id, weight, log_date, log_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        args.tenantId,
        args.userId,
        args.weight,
        args.logDate,
        args.logTime || getDefaultTimeBR(),
        args.notes || null
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

export async function getWeightLogsByDateRange(args: {
  tenantId: string;
  userId: string;
  startDate: string;
  endDate: string;
}): Promise<WeightLog[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<WeightLog>(
      `SELECT * FROM weight_logs
       WHERE tenant_id = $1 AND user_id = $2
         AND log_date BETWEEN $3 AND $4
       ORDER BY log_date DESC, log_time DESC`,
      [args.tenantId, args.userId, args.startDate, args.endDate]
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

export async function getLatestWeightLog(args: {
  tenantId: string;
  userId: string;
}): Promise<WeightLog | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [args.tenantId]);

    const result = await client.query<WeightLog>(
      `SELECT * FROM weight_logs
       WHERE tenant_id = $1 AND user_id = $2
       ORDER BY log_date DESC, log_time DESC
       LIMIT 1`,
      [args.tenantId, args.userId]
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

export async function deleteWeightLog(args: {
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
      `DELETE FROM weight_logs
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
