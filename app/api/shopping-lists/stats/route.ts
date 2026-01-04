import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { getShoppingStats } from '@/lib/repos/shopping-list.repo';

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

    const stats = await getShoppingStats({
      tenantId: tenant.id,
      userId: session.id
    });

    return NextResponse.json({ ok: true, stats });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}
