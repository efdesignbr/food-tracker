import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { analyzeMealFromImage } from '@/lib/ai';
import { init } from '@/lib/init';
import { UPLOAD, IMAGE } from '@/lib/constants';
import sharp from 'sharp';

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
    if (image.size > Number(process.env.MAX_UPLOAD_BYTES || UPLOAD.MAX_BYTES)) {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
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
    const result = await analyzeMealFromImage(bytes, 'image/jpeg');
    return NextResponse.json({ ok: true, tenant, result });
  } catch (err: any) {
    const status = err instanceof Response ? err.status : 400;
    const payload = err instanceof Response ? await err.text() : JSON.stringify({ error: err.message });
    return new NextResponse(payload, { status });
  }
}
