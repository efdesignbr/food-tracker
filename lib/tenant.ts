import type { NextRequest } from 'next/server';
import { getPool } from './db';

export type Tenant = { id: string; slug: string; name: string };

export function getActiveTenantSlug(req: Request | NextRequest): string {
  const header = req.headers.get('x-active-tenant') || req.headers.get('x-tenant-slug');
  return header || process.env.DEFAULT_TENANT_SLUG || 'default';
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const pool = getPool();
  const { rows } = await pool.query<Tenant>(
    'select id, slug, name from tenants where slug = $1 limit 1',
    [slug]
  );
  return rows[0] || null;
}

export async function requireTenant(req: Request | NextRequest): Promise<Tenant> {
  const slug = getActiveTenantSlug(req);
  const tenant = await getTenantBySlug(slug);
  if (!tenant) throw new Response(JSON.stringify({ error: 'tenant_not_found', slug }), { status: 404 });
  return tenant;
}

