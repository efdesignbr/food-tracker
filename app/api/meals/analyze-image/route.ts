import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { analyzeMealFromImage } from '@/lib/ai';
import { init } from '@/lib/init';

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'invalid_content_type' }, { status: 415 });
    }
    const form = await req.formData();
    const image = form.get('image');
    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'image_required' }, { status: 400 });
    }
    if (image.size > Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024)) {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const mediaType = image.type || 'image/png';
    const result = await analyzeMealFromImage(bytes, mediaType);
    return NextResponse.json({ ok: true, tenant, result });
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 400;
    const payload = err instanceof Response ? await err.text() : JSON.stringify({ error: err.message });
    return new NextResponse(payload, { status });
  }
}
