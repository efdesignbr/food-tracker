import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { ApproveMealSchema } from '@/lib/schemas/meal';
import { requireTenant } from '@/lib/tenant';
import { auth } from '@/lib/auth';
import { saveImage, saveImageWebp } from '@/lib/storage';
import { insertMealWithItems, insertMealWithItemsTx } from '@/lib/repos/meal.repo';
import { getPool } from '@/lib/db';
import { init } from '@/lib/init';
import { placeholderPng } from '@/lib/images';

export async function POST(req: Request) {
  let tenantForDiag: any = null;
  let userIdForDiag: string | null = null;
  try {
    await init();
    const tenant = await requireTenant(req);
    tenantForDiag = tenant;
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const userId = (session as any).userId as string | undefined;
    userIdForDiag = userId || null;
    const tokenTenantId = (session as any).tenantId as string | undefined;
    const tokenTenantSlug = (session as any).tenantSlug as string | undefined;
    if (!userId || tokenTenantId !== tenant.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const contentType = req.headers.get('content-type') || '';
    let input: any;
    let imageUrl: string | null = null;
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const payload = form.get('payload');
      if (typeof payload !== 'string') {
        return NextResponse.json({ error: 'payload_required' }, { status: 400 });
      }
      input = JSON.parse(payload);
      const image = form.get('image');
      // TEMPORARY FIX: Skip Supabase Storage upload due to RLS issues
      // Use a placeholder URL instead
      imageUrl = 'https://via.placeholder.com/400x300.png?text=Meal+Image';
      console.log('⚠️  Skipping image upload due to Storage RLS - using placeholder');

      // TODO: Re-enable after fixing Storage RLS:
      // if (image instanceof File) {
      //   const buf = new Uint8Array(await image.arrayBuffer());
      //   const ct = image.type || 'image/webp';
      //   const saved = await saveImage(tokenTenantSlug || tenant.slug, buf, ct);
      //   imageUrl = saved.publicUrl;
      // } else {
      //   const saved = await saveImage(tokenTenantSlug || tenant.slug, placeholderPng(), 'image/png');
      //   imageUrl = saved.publicUrl;
      // }
    } else {
      input = await req.json();
      // TEMPORARY FIX: Skip Supabase Storage upload due to RLS issues
      imageUrl = 'https://via.placeholder.com/400x300.png?text=Meal+Image';
      console.log('⚠️  Skipping image upload due to Storage RLS - using placeholder');
    }
    const data = ApproveMealSchema.parse(input);

    // Persist
    // Use route-level transaction and tenant context
    const pool = getPool();
    const client = await pool.connect();
    let meal;
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenant.id]);
      await client.query(`SET LOCAL app.tenant_id = '${tenant.id}'`);
      meal = await insertMealWithItemsTx(client, {
        tenantId: tenant.id,
        userId,
        imageUrl: imageUrl!,
        mealType: data.meal_type,
        consumedAt: data.consumed_at,
        notes: data.notes || null,
        foods: data.foods.map((f: any) => ({
          name: f.name,
          quantity: f.quantity,
          unit: f.unit,
          calories: f.calories,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,
          fat_g: f.fat_g,
          fiber_g: f.fiber_g,
          sodium_mg: f.sodium_mg,
          sugar_g: f.sugar_g
        }))
      });
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({ ok: true, id: meal.id });
  } catch (err: any) {
    // Surface underlying DB error details and diagnostics (no changes committed)
    console.error('❌ APPROVE ERROR:', err);
    console.error('Error message:', err?.message);
    console.error('Error code:', err?.code);
    console.error('Error detail:', err?.detail);
    const details: any = { error: err?.message || 'unknown_error' };
    if (err && typeof err === 'object') {
      for (const k of ['code','schema','table','constraint','detail','hint','position','routine']) {
        if (err[k]) details[k] = err[k];
      }
    }
    try {
      const { getPool } = await import('@/lib/db');
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const diagTenantId = tenantForDiag?.id;
        if (diagTenantId) {
          await client.query("SELECT set_config('app.tenant_id', $1, true)", [diagTenantId]);
        }
        const info = await client.query("SELECT current_user, current_setting('app.tenant_id', true) AS app_tenant_id");
        // dummy insert with savepoint to test policies
        await client.query('SAVEPOINT sp');
        let dummy: any = null;
        try {
          const uRes = diagTenantId ? await client.query('SELECT id FROM users WHERE tenant_id = $1 LIMIT 1', [diagTenantId]) : { rows: [] } as any;
          if (uRes.rows.length) {
            const ins = await client.query(
              `INSERT INTO meals (user_id, tenant_id, image_url, meal_type, consumed_at, status)
               VALUES ($1,$2,$3,$4,NOW(),'approved') RETURNING id`,
              [uRes.rows[0].id, diagTenantId, 'https://example.com/test.png', 'lunch']
            );
            dummy = { ok: true, id: ins.rows[0].id };
          } else {
            dummy = { ok: false, error: 'no_user_in_tenant' };
          }
        } catch (e: any) {
          dummy = { ok: false, code: e.code, message: e.message, detail: e.detail };
        } finally {
          await client.query('ROLLBACK TO SAVEPOINT sp');
          await client.query('COMMIT');
        }
        details.diagnostics = { info: info.rows[0], dummy, userId: userIdForDiag, tenant: tenantForDiag };
      } catch {}
      finally { /* eslint-disable no-empty */ }
    } catch {}
    return NextResponse.json(details, { status: 400 });
  }
}
