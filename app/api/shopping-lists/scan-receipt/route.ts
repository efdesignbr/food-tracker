import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { analyzeReceipt } from '@/lib/ai/receipt-analyzer';
import { createListFromReceipt } from '@/lib/repos/shopping-list.repo';
import { init } from '@/lib/init';
import { UPLOAD, IMAGE } from '@/lib/constants';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth-helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  console.log('[API] Iniciando scan de nota fiscal');

  try {
    await init();
    const tenant = await requireTenant(req);

    // Autenticacao
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Tipo de conteudo invalido' }, { status: 415 });
    }

    const form = await req.formData();
    const image = form.get('image');
    const listName = form.get('name') as string || `Compras ${new Date().toLocaleDateString('pt-BR')}`;
    const storeId = form.get('store_id') as string || null;

    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'Imagem e obrigatoria' }, { status: 400 });
    }

    console.log('[API] Imagem recebida:', {
      name: image.name,
      size: `${(image.size / 1024).toFixed(2)} KB`,
      type: image.type
    });

    if (image.size > Number(process.env.MAX_UPLOAD_BYTES || UPLOAD.MAX_BYTES)) {
      return NextResponse.json({ error: 'Arquivo muito grande' }, { status: 413 });
    }

    // Processa e comprime a imagem
    console.log('[API] Processando imagem...');
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let quality = IMAGE.INITIAL_QUALITY;
    let processedBuffer = await sharp(buffer)
      .rotate()
      .resize(IMAGE.MAX_DIMENSION_PX, IMAGE.MAX_DIMENSION_PX, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();

    while (processedBuffer.length > IMAGE.TARGET_MAX_SIZE_BYTES && quality > IMAGE.MIN_QUALITY) {
      quality -= IMAGE.QUALITY_STEP;
      processedBuffer = await sharp(buffer)
        .rotate()
        .resize(IMAGE.MAX_DIMENSION_PX, IMAGE.MAX_DIMENSION_PX, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();
    }

    console.log('[API] Imagem processada:', {
      size: `${(processedBuffer.length / 1024).toFixed(2)} KB`,
      quality
    });

    // Analisa com IA
    console.log('[API] Enviando para analise de IA...');
    const bytes = new Uint8Array(processedBuffer);
    const analysis = await analyzeReceipt(bytes, 'image/jpeg');

    console.log(`[API] Analise concluida: ${analysis.items.length} itens`);

    // Criar lista completa com os itens
    const list = await createListFromReceipt({
      tenantId: tenant.id,
      userId: session.userId,
      name: listName,
      storeId: storeId,
      items: analysis.items
    });

    return NextResponse.json({
      ok: true,
      list: {
        id: list.id,
        name: list.name
      },
      analysis: {
        items_count: analysis.items.length,
        total: analysis.total,
        date: analysis.date
      }
    });

  } catch (err: any) {
    console.error('[API] Erro durante scan:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });

    return NextResponse.json({
      error: err.message || 'Erro ao analisar nota fiscal',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
