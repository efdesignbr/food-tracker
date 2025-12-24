import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { analyzeMealFromImage } from '@/lib/ai';
import { init } from '@/lib/init';
import { UPLOAD, IMAGE } from '@/lib/constants';
import sharp from 'sharp';
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
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'invalid_content_type' }, { status: 415 });
    }
    const form = await req.formData();
    const image = form.get('image');
    const contextRaw = form.get('context');
    let context: { location_type?: 'home'|'out'; restaurant_name?: string } | undefined = undefined;
    if (typeof contextRaw === 'string') {
      try {
        const parsed = JSON.parse(contextRaw);
        if (parsed && typeof parsed === 'object') {
          context = {
            location_type: parsed.location_type,
            restaurant_name: parsed.restaurant_name
          };
        }
      } catch {}
    }
    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'image_required' }, { status: 400 });
    }
    if (image.size > Number(process.env.MAX_UPLOAD_BYTES || UPLOAD.MAX_BYTES)) {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
    }

    // 🔒 PAYWALL: Verificar quota (endpoint SEMPRE usa foto)
    const pool = getPool();
    const { rows: userData } = await pool.query<{ plan: Plan }>(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );
    const userPlan = (userData[0]?.plan || 'free') as Plan;

    // Verificar quota (todos os planos têm limite, exceto UNLIMITED)
    const quota = await checkQuota(session.userId, tenant.id, userPlan, 'photo');
    if (!quota.allowed) {
      // Calcular próximo reset (dia 1º do próximo mês)
      const now = new Date();
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

      return NextResponse.json(
        {
          error: 'quota_exceeded',
          message: `Você atingiu o limite de ${quota.limit} análises de foto este mês`,
          used: quota.used,
          limit: quota.limit,
          remaining: 0,
          resetDate: nextMonth.toISOString(),
        },
        { status: 429 }
      );
    }

    // Converte e comprime a imagem para JPEG (max 100kb)
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let quality = IMAGE.INITIAL_QUALITY;
    let processedBuffer = await sharp(buffer)
      .rotate() // Auto-rotaciona baseado em EXIF
      .resize(IMAGE.MAX_DIMENSION_PX, IMAGE.MAX_DIMENSION_PX, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();

    // Reduz qualidade até ficar abaixo de 100kb
    while (processedBuffer.length > IMAGE.TARGET_MAX_SIZE_BYTES && quality > IMAGE.MIN_QUALITY) {
      quality -= IMAGE.QUALITY_STEP;
      processedBuffer = await sharp(buffer)
        .rotate()
        .resize(IMAGE.MAX_DIMENSION_PX, IMAGE.MAX_DIMENSION_PX, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();
    }

    const bytes = new Uint8Array(processedBuffer);
    const result = await analyzeMealFromImage(bytes, 'image/jpeg', context);

    // ✅ Incrementar quota APÓS sucesso (exceto UNLIMITED)
    if (userPlan !== 'unlimited') {
      await incrementQuota(session.userId, tenant.id, 'photo');
    }

    return NextResponse.json({ ok: true, tenant, result });
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 400;
    const payload = err instanceof Response ? await err.text() : JSON.stringify({ error: err.message });
    return new NextResponse(payload, { status, headers: { 'Content-Type': 'application/json' } });
  }
}
