import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { init } from '@/lib/init';
import { getPool } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getCurrentUser } from '@/lib/auth-helper';

/**
 * GET /api/user/profile
 * Returns current user profile with nutritional goals
 */
export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);

    const sessionData = await getCurrentUser() as any;
    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Set tenant context
      await client.query(`SET LOCAL app.tenant_id = '${sessionData.tenantId}'`);

      // Fetch user profile
      const { rows } = await client.query<{
        id: string;
        email: string;
        name: string;
        phone: string | null;
        role: string;
        goal_calories: number;
        goal_protein_g: number;
        goal_carbs_g: number;
        goal_fat_g: number;
        goal_water_ml: number;
        plan: string;
        subscription_status: string;
        subscription_started_at: string | null;
        subscription_expires_at: string | null;
        created_at: string;
      }>(
        `SELECT
          id, email, name, phone, role,
          goal_calories, goal_protein_g, goal_carbs_g, goal_fat_g, goal_water_ml,
          plan, subscription_status, subscription_started_at, subscription_expires_at,
          created_at
        FROM users
        WHERE id = $1 AND tenant_id = $2`,
        [sessionData.userId, sessionData.tenantId]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = rows[0];

      return NextResponse.json({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          plan: user.plan,
          subscription_status: user.subscription_status,
          subscription_started_at: user.subscription_started_at,
          subscription_expires_at: user.subscription_expires_at,
          goals: {
            calories: user.goal_calories,
            protein: user.goal_protein_g,
            carbs: user.goal_carbs_g,
            fat: user.goal_fat_g,
            water: user.goal_water_ml,
          },
          createdAt: user.created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    logger.error('[API] Error fetching user profile', err);
    const status = err instanceof Response ? err.status : 500;
    const payload = err instanceof Response ? await err.text() : JSON.stringify({ error: err.message });
    return new NextResponse(payload, { status });
  }
}

/**
 * PATCH /api/user/profile
 * Updates user profile and/or nutritional goals
 */
export async function PATCH(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);

    const sessionData = await getCurrentUser() as any;
    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, goals } = body;

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Set tenant context
      await client.query(`SET LOCAL app.tenant_id = '${sessionData.tenantId}'`);

      // Build dynamic UPDATE query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }

      if (phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(phone || null); // Allow clearing phone
      }

      if (goals?.calories !== undefined) {
        updates.push(`goal_calories = $${paramIndex++}`);
        values.push(goals.calories);
      }

      if (goals?.protein !== undefined) {
        updates.push(`goal_protein_g = $${paramIndex++}`);
        values.push(goals.protein);
      }

      if (goals?.carbs !== undefined) {
        updates.push(`goal_carbs_g = $${paramIndex++}`);
        values.push(goals.carbs);
      }

      if (goals?.fat !== undefined) {
        updates.push(`goal_fat_g = $${paramIndex++}`);
        values.push(goals.fat);
      }

      if (goals?.water !== undefined) {
        updates.push(`goal_water_ml = $${paramIndex++}`);
        values.push(goals.water);
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      // Add userId and tenantId to values
      values.push(sessionData.userId);
      values.push(sessionData.tenantId);

      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
        RETURNING
          id, email, name, phone, role,
          goal_calories, goal_protein_g, goal_carbs_g, goal_fat_g, goal_water_ml,
          plan, subscription_status, subscription_started_at, subscription_expires_at,
          created_at
      `;

      const { rows } = await client.query(query, values);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = rows[0];

      return NextResponse.json({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          plan: user.plan,
          subscription_status: user.subscription_status,
          subscription_started_at: user.subscription_started_at,
          subscription_expires_at: user.subscription_expires_at,
          goals: {
            calories: user.goal_calories,
            protein: user.goal_protein_g,
            carbs: user.goal_carbs_g,
            fat: user.goal_fat_g,
            water: user.goal_water_ml,
          },
          createdAt: user.created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    logger.error('[API] Error updating user profile', err);
    const status = err instanceof Response ? err.status : 500;
    const payload = err instanceof Response ? await err.text() : JSON.stringify({ error: err.message });
    return new NextResponse(payload, { status });
  }
}
