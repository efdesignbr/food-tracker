import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { AnalyzeTextSchema } from '@/lib/schemas/meal';
import { requireTenant } from '@/lib/tenant';
import { analyzeMealFromText } from '@/lib/ai';
import { init } from '@/lib/init';
import { getCurrentUser } from '@/lib/auth-helper';
import { getPool } from '@/lib/db';
import { checkQuota, incrementQuota } from '@/lib/quota';
import type { Plan } from '@/lib/types/subscription';

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);

    // Autenticação
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Gate por anúncio (FREE sempre; PREMIUM quando excede)
    const pool = getPool();
    const { rows: userData } = await pool.query<{ plan: Plan }>(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );
    const userPlan = (userData[0]?.plan || 'free') as Plan;

    const adCompleted = (req.headers.get('x-ad-completed') || '').trim() === '1';
    if (userPlan !== 'unlimited') {
      const quota = await checkQuota(session.userId, tenant.id, userPlan, 'text');
      const needsAd = (userPlan === 'free') || (userPlan === 'premium' && !quota.allowed);
      if (needsAd && !adCompleted) {
        return NextResponse.json(
          {
            error: 'watch_ad_required',
            feature: 'text_analysis',
            currentPlan: userPlan,
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const input = AnalyzeTextSchema.parse(body);

    const result = await analyzeMealFromText(input.description, input.meal_type, {
      location_type: input.location_type,
      restaurant_name: input.restaurant_name
    });
    // ✅ Incrementar quota APÓS sucesso (exceto UNLIMITED)
    if (userPlan !== 'unlimited') {
      await incrementQuota(session.userId, tenant.id, 'text');
    }

    return NextResponse.json({ ok: true, tenant, result });
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 400;
    const payload = err instanceof Response ? await err.text() : JSON.stringify({ error: err.message });
    return new NextResponse(payload, { status, headers: { 'Content-Type': 'application/json' } });
  }
}
