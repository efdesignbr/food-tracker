import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { auth } from '@/lib/auth';
import { init } from '@/lib/init';
import { getSessionData } from '@/lib/types/auth';
import { getPool } from '@/lib/db';

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());

    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT id, analysis_date, analysis_text,
              recommendations, insights, warnings, model_used
       FROM coach_analyses
       WHERE user_id = $1 AND tenant_id = $2
       ORDER BY analysis_date DESC
       LIMIT 20`,
      [session.userId, tenant.id]
    );

    return NextResponse.json({ ok: true, analyses: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}
