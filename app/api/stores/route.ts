import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { createStore, getStoresByUser, updateStore, deleteStore } from '@/lib/repos/store.repo';

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

    const stores = await getStoresByUser({
      tenantId: tenant.id,
      userId: session.userId
    });

    return NextResponse.json({ ok: true, stores });
  } catch (err: any) {
    console.error('[stores GET] error:', err);
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
    const { name, address } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name_required' }, { status: 400 });
    }

    const store = await createStore({
      tenantId: tenant.id,
      userId: session.userId,
      name: name.trim(),
      address: address?.trim() || undefined
    });

    return NextResponse.json({ ok: true, store });
  } catch (err: any) {
    console.error('[stores POST] error:', err);
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
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

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id_required' }, { status: 400 });
    }

    const body = await req.json();
    const { name, address } = body;

    const store = await updateStore({
      tenantId: tenant.id,
      userId: session.userId,
      id,
      name: name?.trim(),
      address: address !== undefined ? (address?.trim() || null) : undefined
    });

    if (!store) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, store });
  } catch (err: any) {
    console.error('[stores PATCH] error:', err);
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
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

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id_required' }, { status: 400 });
    }

    await deleteStore({
      tenantId: tenant.id,
      userId: session.userId,
      id
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[stores DELETE] error:', err);
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}
