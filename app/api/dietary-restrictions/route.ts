import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import {
  getUserRestrictions,
  addRestriction,
  removeRestriction,
  updateRestriction
} from '@/lib/repos/dietary-restrictions.repo';
import { z } from 'zod';

const addSchema = z.object({
  restriction_type: z.enum(['allergy', 'intolerance', 'diet', 'religious', 'medical', 'preference']),
  restriction_value: z.string().min(1).max(100),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  notes: z.string().max(500).optional()
});

const updateSchema = z.object({
  id: z.string().uuid(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  notes: z.string().max(500).optional()
});

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const restrictions = await getUserRestrictions({
      userId: session.userId,
      tenantId: tenant.id
    });

    return NextResponse.json({ ok: true, restrictions });
  } catch (err: any) {
    console.error('[dietary-restrictions GET] error:', err);
    return NextResponse.json({ error: err.message || 'Erro desconhecido' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const validated = addSchema.parse(body);

    const restriction = await addRestriction({
      userId: session.userId,
      tenantId: tenant.id,
      restrictionType: validated.restriction_type,
      restrictionValue: validated.restriction_value,
      severity: validated.severity,
      notes: validated.notes
    });

    return NextResponse.json({ ok: true, restriction });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Erro de validacao',
        details: err.errors
      }, { status: 400 });
    }
    console.error('[dietary-restrictions POST] error:', err);
    return NextResponse.json({ error: err.message || 'Erro desconhecido' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da restricao e obrigatorio' }, { status: 400 });
    }

    await removeRestriction({
      id,
      userId: session.userId,
      tenantId: tenant.id
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[dietary-restrictions DELETE] error:', err);
    return NextResponse.json({ error: err.message || 'Erro desconhecido' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const restriction = await updateRestriction({
      id: validated.id,
      userId: session.userId,
      tenantId: tenant.id,
      severity: validated.severity,
      notes: validated.notes
    });

    return NextResponse.json({ ok: true, restriction });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Erro de validacao',
        details: err.errors
      }, { status: 400 });
    }
    console.error('[dietary-restrictions PATCH] error:', err);
    return NextResponse.json({ error: err.message || 'Erro desconhecido' }, { status: 400 });
  }
}
