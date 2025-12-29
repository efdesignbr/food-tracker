import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { searchRestaurants } from '@/lib/db/restaurants';

export async function GET(req: Request) {
  try {
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (session.tenantId !== tenant.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const limit = url.searchParams.get('limit');
    const items = await searchRestaurants({ tenantId: tenant.id, q, limit: limit ? Number(limit) : 10 });
    return NextResponse.json({ restaurants: items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 400 });
  }
}

