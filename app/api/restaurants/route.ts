import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { auth } from '@/lib/auth';
import { getSessionData } from '@/lib/types/auth';
import { listRestaurants, createRestaurant } from '@/lib/db/restaurants';

export async function GET(req: Request) {
  try {
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (session.tenantId !== tenant.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const url = new URL(req.url);
    const limit = url.searchParams.get('limit');
    const items = await listRestaurants({ tenantId: tenant.id, limit: limit ? Number(limit) : 20 });
    return NextResponse.json({ restaurants: items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (session.tenantId !== tenant.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const body = await req.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const address = typeof body?.address === 'string' ? body.address.trim() : null;
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
    }
    const item = await createRestaurant({ tenantId: tenant.id, name, address });
    return NextResponse.json({ restaurant: item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 400 });
  }
}

