import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import {
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem
} from '@/lib/repos/shopping-list.repo';
import { z } from 'zod';

const addSchema = z.object({
  list_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  notes: z.string().optional(),
  unit_price: z.number().min(0).optional()
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  is_purchased: z.boolean().optional(),
  price: z.number().min(0).nullable().optional(),
  unit_price: z.number().min(0).nullable().optional(),
  notes: z.string().optional()
});

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
    const validated = addSchema.parse(body);

    const item = await addShoppingItem({
      tenantId: tenant.id,
      listId: validated.list_id,
      name: validated.name,
      quantity: validated.quantity,
      unit: validated.unit,
      category: validated.category,
      notes: validated.notes,
      unitPrice: validated.unit_price
    });

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_error', details: err.errors }, { status: 400 });
    }
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
      return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    }

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const item = await updateShoppingItem({
      tenantId: tenant.id,
      id,
      name: validated.name,
      quantity: validated.quantity,
      unit: validated.unit,
      category: validated.category,
      isPurchased: validated.is_purchased,
      price: validated.price,
      unitPrice: validated.unit_price,
      notes: validated.notes
    });

    if (!item) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_error', details: err.errors }, { status: 400 });
    }
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
      return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    }

    await deleteShoppingItem({
      tenantId: tenant.id,
      id
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}
