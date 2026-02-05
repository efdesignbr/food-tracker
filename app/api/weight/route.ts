import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { getCurrentDateBR, toDateBR } from '@/lib/datetime';
import {
  insertWeightLog,
  getWeightLogsByDateRange,
  getLatestWeightLog,
  deleteWeightLog
} from '@/lib/repos/weight.repo';
import { z } from 'zod';

const insertSchema = z.object({
  weight: z.number().min(1).max(500),
  log_date: z.string(),
  log_time: z.string().optional(),
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
    const validated = insertSchema.parse(body);

    const weightLog = await insertWeightLog({
      tenantId: tenant.id,
      userId: session.userId,
      weight: validated.weight,
      logDate: validated.log_date,
      logTime: validated.log_time,
      notes: validated.notes
    });

    return NextResponse.json({ ok: true, weightLog });
  } catch (err: any) {
    if (err instanceof Response) {
      return err;
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation_error', details: err.errors }, { status: 400 });
    }
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
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const latest = url.searchParams.get('latest');

    // Se pedir o mais recente
    if (latest === 'true') {
      const weightLog = await getLatestWeightLog({
        tenantId: tenant.id,
        userId: session.userId
      });
      return NextResponse.json({ ok: true, weightLog });
    }

    // Se pedir por período
    if (!startDate || !endDate) {
      // Default: últimos 2 anos (histórico de peso é importante para análise)
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 2);

      const logs = await getWeightLogsByDateRange({
        tenantId: tenant.id,
        userId: session.userId,
        startDate: toDateBR(start),
        endDate: getCurrentDateBR()
      });

      return NextResponse.json({ ok: true, logs });
    }

    const logs = await getWeightLogsByDateRange({
      tenantId: tenant.id,
      userId: session.userId,
      startDate,
      endDate
    });

    return NextResponse.json({ ok: true, logs });
  } catch (err: any) {
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
      return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    }

    await deleteWeightLog({
      tenantId: tenant.id,
      userId: session.userId,
      id
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}
