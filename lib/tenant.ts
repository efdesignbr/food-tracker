import type { NextRequest } from 'next/server';
import { getPool } from './db';
import { auth } from '../auth';
import { isAppSession } from './types/auth';

export type Tenant = { id: string; slug: string; name: string };

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const pool = getPool();
  const { rows } = await pool.query<Tenant>(
    'select id, slug, name from tenants where slug = $1 limit 1',
    [slug]
  );
  return rows[0] || null;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const pool = getPool();
  const { rows } = await pool.query<Tenant>(
    'select id, slug, name from tenants where id = $1 limit 1',
    [id]
  );
  return rows[0] || null;
}

export async function requireTenant(req: Request | NextRequest): Promise<Tenant> {
  const session = await auth();

  if (!isAppSession(session)) {
    throw new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const tenant = await getTenantById(session.tenantId);

  if (!tenant) {
    throw new Response(JSON.stringify({ error: 'tenant_not_found' }), { status: 404 });
  }

  return tenant;
}
