import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { getPool } from '@/lib/db';
import { z } from 'zod';

const goalsSchema = z.object({
  goal_type: z.enum(['lose_weight', 'gain_weight', 'maintain_weight']),
  height_cm: z.number().min(100).max(250),
  age: z.number().min(10).max(120),
  gender: z.enum(['male', 'female', 'other']),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  target_weight_kg: z.number().min(30).max(300).optional(),
  weekly_goal_kg: z.number().min(-2).max(2).optional(),
});

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT goal_type, height_cm, age, gender, activity_level,
              target_weight_kg, weekly_goal_kg,
              goal_calories, goal_protein_g, goal_carbs_g, goal_fat_g
       FROM users
       WHERE id = $1`,
      [session.userId]
    );

    return NextResponse.json({ ok: true, goals: rows[0] || null });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = goalsSchema.parse(body);

    const pool = getPool();

    // Atualizar objetivos do usuário
    await pool.query(
      `UPDATE users
       SET goal_type = $1,
           height_cm = $2,
           age = $3,
           gender = $4,
           activity_level = $5,
           target_weight_kg = $6,
           weekly_goal_kg = $7,
           updated_at = NOW()
       WHERE id = $8`,
      [
        validated.goal_type,
        validated.height_cm,
        validated.age,
        validated.gender,
        validated.activity_level,
        validated.target_weight_kg || null,
        validated.weekly_goal_kg || null,
        session.userId
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_error', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}
