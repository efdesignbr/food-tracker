import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import {
  getShoppingListById,
  updateShoppingList,
  deleteShoppingList,
  getShoppingItemsByList
} from '@/lib/repos/shopping-list.repo';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional()
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const list = await getShoppingListById({
      tenantId: tenant.id,
      userId: session.userId,
      id: params.id
    });

    if (!list) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const items = await getShoppingItemsByList({
      tenantId: tenant.id,
      listId: params.id
    });

    return NextResponse.json({ ok: true, list, items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validated = updateSchema.parse(body);

    const list = await updateShoppingList({
      tenantId: tenant.id,
      userId: session.userId,
      id: params.id,
      name: validated.name,
      status: validated.status
    });

    if (!list) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, list });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_error', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await deleteShoppingList({
      tenantId: tenant.id,
      userId: session.userId,
      id: params.id
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}
