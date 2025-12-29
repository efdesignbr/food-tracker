import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getTenantBySlug } from '@/lib/tenant';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const headers = req.headers;
    const slug = headers.get('x-tenant-slug') || process.env.DEFAULT_TENANT_SLUG || 'default';
    const tenant = await getTenantBySlug(slug);
    if (!tenant) return NextResponse.json({ error: 'tenant_not_found', slug }, { status: 404 });

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenant.id]);
      const info = await client.query(`
        SELECT current_user, session_user, current_setting('app.tenant_id', true) AS app_tenant_id
      `);
      const rls = await client.query(`
        SELECT c.relname, c.relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname IN ('tenants','users','meals','food_items','nutrition_data')
      `);
      const policies = await client.query(`
        SELECT schemaname, tablename, polname, cmd, roles, permissive, qual, with_check
        FROM pg_policies
        WHERE schemaname='public' AND tablename IN ('users','meals','food_items','nutrition_data')
        ORDER BY tablename, polname
      `);
      // Try a dummy insert inside a savepoint and rollback
      const users = await client.query('SELECT id FROM users WHERE tenant_id = $1 LIMIT 1', [tenant.id]);
      let dummyInsert: any = null;
      if (users.rows.length) {
        await client.query('SAVEPOINT sp');
        try {
          const res = await client.query(
            `INSERT INTO meals (user_id, tenant_id, image_url, meal_type, consumed_at, status)
             VALUES ($1,$2,$3,$4,NOW(),'approved') RETURNING id`,
            [users.rows[0].id, tenant.id, 'https://example.com/test.png', 'lunch']
          );
          dummyInsert = { ok: true, id: res.rows[0].id };
        } catch (e: any) {
          dummyInsert = { ok: false, error: e.message, code: e.code, detail: e.detail, hint: e.hint, routine: e.routine };
        } finally {
          await client.query('ROLLBACK TO SAVEPOINT sp');
        }
      }
      await client.query('COMMIT');
      return NextResponse.json({
        ok: true,
        tenant,
        info: info.rows[0],
        rls: rls.rows,
        policies: policies.rows,
        dummyInsert
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'unknown' }, { status: 500 });
  }
}

