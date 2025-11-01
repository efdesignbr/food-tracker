import { getPool } from '@/lib/db';
import { getDefaultTimeBR } from '@/lib/datetime';

export interface BodyMeasurement {
  id: string;
  tenant_id: string;
  user_id: string;
  measurement_date: string;
  measurement_time: string;
  waist: number | null;
  neck: number | null;
  chest: number | null;
  hips: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
  left_bicep: number | null;
  right_bicep: number | null;
  left_calf: number | null;
  right_calf: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

// Tipo que representa os dados como vêm do banco (DECIMAL vem como string)
interface BodyMeasurementRow {
  id: string;
  tenant_id: string;
  user_id: string;
  measurement_date: string;
  measurement_time: string;
  waist: string | null;
  neck: string | null;
  chest: string | null;
  hips: string | null;
  left_thigh: string | null;
  right_thigh: string | null;
  left_bicep: string | null;
  right_bicep: string | null;
  left_calf: string | null;
  right_calf: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InsertBodyMeasurementParams {
  tenantId: string;
  userId: string;
  measurementDate: string;
  measurementTime?: string;
  waist?: number;
  neck?: number;
  chest?: number;
  hips?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftBicep?: number;
  rightBicep?: number;
  leftCalf?: number;
  rightCalf?: number;
  notes?: string;
}

export async function insertBodyMeasurement(params: InsertBodyMeasurementParams): Promise<BodyMeasurement> {
  const pool = getPool();
  const client = await pool.connect();

  console.log('📊 [REPO] Params received:', params);

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [params.tenantId]);

    const result = await client.query<BodyMeasurementRow>(
      `INSERT INTO body_measurements (
        tenant_id, user_id, measurement_date, measurement_time,
        waist, neck, chest, hips,
        left_thigh, right_thigh, left_bicep, right_bicep,
        left_calf, right_calf, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        params.tenantId,
        params.userId,
        params.measurementDate,
        params.measurementTime ?? getDefaultTimeBR(),
        params.waist ?? null,
        params.neck ?? null,
        params.chest ?? null,
        params.hips ?? null,
        params.leftThigh ?? null,
        params.rightThigh ?? null,
        params.leftBicep ?? null,
        params.rightBicep ?? null,
        params.leftCalf ?? null,
        params.rightCalf ?? null,
        params.notes ?? null
      ]
    );

    await client.query('COMMIT');
    const row = result.rows[0];
    console.log('📊 [REPO] Data returned from INSERT (raw):', row);

    // Converter DECIMALs de string para number
    const converted = {
      ...row,
      waist: row.waist ? parseFloat(row.waist) : null,
      neck: row.neck ? parseFloat(row.neck) : null,
      chest: row.chest ? parseFloat(row.chest) : null,
      hips: row.hips ? parseFloat(row.hips) : null,
      left_thigh: row.left_thigh ? parseFloat(row.left_thigh) : null,
      right_thigh: row.right_thigh ? parseFloat(row.right_thigh) : null,
      left_bicep: row.left_bicep ? parseFloat(row.left_bicep) : null,
      right_bicep: row.right_bicep ? parseFloat(row.right_bicep) : null,
      left_calf: row.left_calf ? parseFloat(row.left_calf) : null,
      right_calf: row.right_calf ? parseFloat(row.right_calf) : null,
    };

    console.log('📊 [REPO] Data converted to numbers:', converted);
    return converted;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('📊 [REPO] INSERT ERROR:', e);
    throw e;
  } finally {
    client.release();
  }
}

export async function getBodyMeasurementsByDateRange(params: {
  tenantId: string;
  userId: string;
  startDate: string;
  endDate: string;
}): Promise<BodyMeasurement[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [params.tenantId]);

    const result = await client.query<BodyMeasurementRow>(
      `SELECT * FROM body_measurements
       WHERE tenant_id = $1 AND user_id = $2
         AND measurement_date BETWEEN $3 AND $4
       ORDER BY measurement_date DESC, measurement_time DESC`,
      [params.tenantId, params.userId, params.startDate, params.endDate]
    );

    await client.query('COMMIT');
    console.log('📊 [REPO] Data returned from SELECT (first row raw):', result.rows[0]);

    // Converter DECIMALs de string para number em todos os registros
    const converted = result.rows.map(row => ({
      ...row,
      waist: row.waist ? parseFloat(row.waist) : null,
      neck: row.neck ? parseFloat(row.neck) : null,
      chest: row.chest ? parseFloat(row.chest) : null,
      hips: row.hips ? parseFloat(row.hips) : null,
      left_thigh: row.left_thigh ? parseFloat(row.left_thigh) : null,
      right_thigh: row.right_thigh ? parseFloat(row.right_thigh) : null,
      left_bicep: row.left_bicep ? parseFloat(row.left_bicep) : null,
      right_bicep: row.right_bicep ? parseFloat(row.right_bicep) : null,
      left_calf: row.left_calf ? parseFloat(row.left_calf) : null,
      right_calf: row.right_calf ? parseFloat(row.right_calf) : null,
    }));

    console.log('📊 [REPO] Data converted (first row):', converted[0]);
    return converted;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getLatestBodyMeasurement(params: {
  tenantId: string;
  userId: string;
}): Promise<BodyMeasurement | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [params.tenantId]);

    const result = await client.query<BodyMeasurementRow>(
      `SELECT * FROM body_measurements
       WHERE tenant_id = $1 AND user_id = $2
       ORDER BY measurement_date DESC, measurement_time DESC
       LIMIT 1`,
      [params.tenantId, params.userId]
    );

    await client.query('COMMIT');

    if (!result.rows[0]) return null;

    // Converter DECIMALs de string para number
    const row = result.rows[0];
    return {
      ...row,
      waist: row.waist ? parseFloat(row.waist) : null,
      neck: row.neck ? parseFloat(row.neck) : null,
      chest: row.chest ? parseFloat(row.chest) : null,
      hips: row.hips ? parseFloat(row.hips) : null,
      left_thigh: row.left_thigh ? parseFloat(row.left_thigh) : null,
      right_thigh: row.right_thigh ? parseFloat(row.right_thigh) : null,
      left_bicep: row.left_bicep ? parseFloat(row.left_bicep) : null,
      right_bicep: row.right_bicep ? parseFloat(row.right_bicep) : null,
      left_calf: row.left_calf ? parseFloat(row.left_calf) : null,
      right_calf: row.right_calf ? parseFloat(row.right_calf) : null,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteBodyMeasurement(params: {
  tenantId: string;
  userId: string;
  id: string;
}): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [params.tenantId]);

    await client.query(
      `DELETE FROM body_measurements
       WHERE id = $1 AND tenant_id = $2 AND user_id = $3`,
      [params.id, params.tenantId, params.userId]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
