import { getPool } from '@/lib/db';
import { getDefaultTimeBR } from '@/lib/datetime';

/**
 * Converte campo DATE do PostgreSQL para string YYYY-MM-DD
 * O driver pg retorna DATE como objeto Date JS, que ao serializar para JSON
 * usa UTC, causando erro de -1 dia em timezones negativos como São Paulo.
 */
function formatDateField(value: Date | string): string {
  if (value instanceof Date) {
    return value.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  }
  return value;
}

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

  console.log('🔍 [WEIGHT REPO] Args received:', {
    logDate: args.logDate,
    logTime: args.logTime,
    logDateType: typeof args.logDate
  });

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
    const row = result.rows[0];
    const rawDate = row.log_date as any;
    console.log('🔍 [WEIGHT REPO] Row from DB:', {
      log_date_raw: rawDate,
      log_date_type: typeof rawDate,
      log_date_isDate: rawDate instanceof Date,
      log_date_json: JSON.stringify(rawDate),
      log_time: row.log_time
    });
    const formatted = formatDateField(row.log_date);
    console.log('🔍 [WEIGHT REPO] After formatDateField:', formatted);
    return {
      ...row,
      log_date: formatted
    };
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
    return result.rows.map(row => ({
      ...row,
      log_date: formatDateField(row.log_date)
    }));
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
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...row,
      log_date: formatDateField(row.log_date)
    };
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
