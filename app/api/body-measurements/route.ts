import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { getCurrentUser } from '@/lib/auth-helper';
import { init } from '@/lib/init';
import { getCurrentDateBR, toDateBR } from '@/lib/datetime';
import {
  insertBodyMeasurement,
  getBodyMeasurementsByDateRange,
  getLatestBodyMeasurement,
  deleteBodyMeasurement
} from '@/lib/repos/body-measurements.repo';
import { z } from 'zod';

const insertSchema = z.object({
  measurement_date: z.string(),
  measurement_time: z.string().optional(),
  waist: z.number().min(0).max(300).optional(),
  neck: z.number().min(0).max(150).optional(),
  chest: z.number().min(0).max(300).optional(),
  hips: z.number().min(0).max(300).optional(),
  left_thigh: z.number().min(0).max(200).optional(),
  right_thigh: z.number().min(0).max(200).optional(),
  left_bicep: z.number().min(0).max(100).optional(),
  right_bicep: z.number().min(0).max(100).optional(),
  left_calf: z.number().min(0).max(100).optional(),
  right_calf: z.number().min(0).max(100).optional(),
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
    console.log('📊 [API] Body received:', body);

    const validated = insertSchema.parse(body);
    console.log('📊 [API] Validated:', validated);

    const measurement = await insertBodyMeasurement({
      tenantId: tenant.id,
      userId: session.userId,
      measurementDate: validated.measurement_date,
      measurementTime: validated.measurement_time,
      waist: validated.waist,
      neck: validated.neck,
      chest: validated.chest,
      hips: validated.hips,
      leftThigh: validated.left_thigh,
      rightThigh: validated.right_thigh,
      leftBicep: validated.left_bicep,
      rightBicep: validated.right_bicep,
      leftCalf: validated.left_calf,
      rightCalf: validated.right_calf,
      notes: validated.notes
    });

    return NextResponse.json({ ok: true, measurement });
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
      const measurement = await getLatestBodyMeasurement({
        tenantId: tenant.id,
        userId: session.userId
      });
      return NextResponse.json({ ok: true, measurement });
    }

    // Se pedir por período
    if (!startDate || !endDate) {
      // Default: últimos 2 anos (medidas corporais são registradas esporadicamente)
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 2);

      const measurements = await getBodyMeasurementsByDateRange({
        tenantId: tenant.id,
        userId: session.userId,
        startDate: toDateBR(start),
        endDate: getCurrentDateBR()
      });

      return NextResponse.json({ ok: true, measurements });
    }

    const measurements = await getBodyMeasurementsByDateRange({
      tenantId: tenant.id,
      userId: session.userId,
      startDate,
      endDate
    });

    return NextResponse.json({ ok: true, measurements });
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

    await deleteBodyMeasurement({
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
