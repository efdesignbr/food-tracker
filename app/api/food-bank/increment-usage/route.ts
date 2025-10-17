import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { auth } from '@/lib/auth';
import { init } from '@/lib/init';
import { getSessionData } from '@/lib/types/auth';
import { incrementUsageCount } from '@/lib/repos/food-bank.repo';

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    await incrementUsageCount({
      tenantId: tenant.id,
      userId: session.userId,
      id
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error incrementing usage count:', err);
    return NextResponse.json({
      error: err.message || 'Erro ao incrementar contador de uso'
    }, { status: 400 });
  }
}
