import { getPool } from '@/lib/db';
import { DietaryRestriction, RestrictionType, Severity } from '@/lib/constants/dietary-restrictions';

export async function getUserRestrictions(params: {
  userId: string;
  tenantId: string;
}): Promise<DietaryRestriction[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [params.tenantId]);

    const result = await client.query<DietaryRestriction>(
      `SELECT * FROM user_dietary_restrictions
       WHERE user_id = $1 AND tenant_id = $2
       ORDER BY restriction_type, restriction_value`,
      [params.userId, params.tenantId]
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

export async function addRestriction(params: {
  userId: string;
  tenantId: string;
  restrictionType: RestrictionType;
  restrictionValue: string;
  severity?: Severity;
  notes?: string;
}): Promise<DietaryRestriction> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [params.tenantId]);

    const result = await client.query<DietaryRestriction>(
      `INSERT INTO user_dietary_restrictions (user_id, tenant_id, restriction_type, restriction_value, severity, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, tenant_id, restriction_type, restriction_value) DO UPDATE
       SET severity = EXCLUDED.severity, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING *`,
      [
        params.userId,
        params.tenantId,
        params.restrictionType,
        params.restrictionValue,
        params.severity || 'moderate',
        params.notes || null
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

export async function removeRestriction(params: {
  id: string;
  userId: string;
  tenantId: string;
}): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [params.tenantId]);

    await client.query(
      `DELETE FROM user_dietary_restrictions
       WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
      [params.id, params.userId, params.tenantId]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function updateRestriction(params: {
  id: string;
  userId: string;
  tenantId: string;
  severity?: Severity;
  notes?: string;
}): Promise<DietaryRestriction | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [params.tenantId]);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.severity !== undefined) {
      updates.push(`severity = $${paramIndex++}`);
      values.push(params.severity);
    }

    if (params.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(params.notes);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      await client.query('COMMIT');
      return null;
    }

    values.push(params.id, params.userId, params.tenantId);

    const result = await client.query<DietaryRestriction>(
      `UPDATE user_dietary_restrictions
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND tenant_id = $${paramIndex}
       RETURNING *`,
      values
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
