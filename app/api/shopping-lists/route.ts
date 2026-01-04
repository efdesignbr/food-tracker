import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import {
  createShoppingList,
  getShoppingListsByUser
} from '@/lib/repos/shopping-list.repo';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100)
});

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();

    console.log('[shopping-lists POST]', { tenant, session });

    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    console.log('[shopping-lists POST] body:', body);
    const validated = createSchema.parse(body);

    const list = await createShoppingList({
      tenantId: tenant.id,
      userId: session.userId,
      name: validated.name
    });

    return NextResponse.json({ ok: true, list });
  } catch (err: any) {
    console.error('[shopping-lists POST] error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_error', details: err.errors }, { status: 400 });
    }
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}

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

    const url = new URL(req.url);
    const status = url.searchParams.get('status') as 'active' | 'completed' | 'archived' | null;

    const lists = await getShoppingListsByUser({
      tenantId: tenant.id,
      userId: session.userId,
      status: status || undefined
    });

    return NextResponse.json({ ok: true, lists });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}
