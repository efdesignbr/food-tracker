import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getTenantBySlug } from '@/lib/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const slug = process.env.DEFAULT_TENANT_SLUG || 'default';
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let tenant = await getTenantBySlug(slug);
    if (!tenant) {
      const ins = await client.query('INSERT INTO tenants (slug, name) VALUES ($1,$2) RETURNING id, slug, name', [slug, slug]);
      tenant = ins.rows[0] as any;
    }
    if (!tenant) throw new Error('Failed to ensure default tenant');
    // Assign orphan users to default tenant
    await client.query('UPDATE users SET tenant_id = $1 WHERE tenant_id IS NULL', [tenant.id]);
    // Optional: assign meals without tenant to default
    await client.query('UPDATE meals SET tenant_id = $1 WHERE tenant_id IS NULL', [tenant.id]);
    await client.query('UPDATE food_items SET tenant_id = $1 WHERE tenant_id IS NULL', [tenant.id]);
    await client.query('UPDATE nutrition_data SET tenant_id = $1 WHERE tenant_id IS NULL', [tenant.id]);
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, tenant });
  } catch (e: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}
