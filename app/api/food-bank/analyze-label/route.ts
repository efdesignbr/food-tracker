import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { analyzeNutritionLabel } from '@/lib/ai/nutrition-label-analyzer';
import { init } from '@/lib/init';
import { UPLOAD, IMAGE } from '@/lib/constants';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth-helper';
import { getPool } from '@/lib/db';
import { checkQuota, incrementQuota } from '@/lib/quota';
import type { Plan } from '@/lib/types/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  console.log('🔵 [API] Iniciando análise de rótulo nutricional');

  try {
    await init();
    const tenant = await requireTenant(req);
    console.log('✅ [API] Tenant autenticado:', tenant.id);

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
      console.error('❌ [API] Content-Type inválido:', contentType);
      return NextResponse.json({ error: 'Tipo de conteúdo inválido' }, { status: 415 });
    }

    const form = await req.formData();
    const image = form.get('image');

    if (!(image instanceof File)) {
      console.error('❌ [API] Imagem não fornecida ou inválida');
      return NextResponse.json({ error: 'Imagem é obrigatória' }, { status: 400 });
    }

    console.log('📦 [API] Imagem recebida:', {
      name: image.name,
      size: `${(image.size / 1024).toFixed(2)} KB`,
      type: image.type
    });

    if (image.size > Number(process.env.MAX_UPLOAD_BYTES || UPLOAD.MAX_BYTES)) {
      console.error('❌ [API] Imagem muito grande:', image.size);
      return NextResponse.json({ error: 'Arquivo muito grande' }, { status: 413 });
    }

    // 🔒 PAYWALL: Verificar quota de OCR
    const pool = getPool();
    const { rows: userData } = await pool.query<{ plan: Plan }>(
      'SELECT plan FROM users WHERE id = $1',
      [session.userId]
    );
    const userPlan = (userData[0]?.plan || 'free') as Plan;

    // FREE e PREMIUM: verificar quota
    const quota = await checkQuota(session.userId, tenant.id, userPlan, 'ocr');
    if (!quota.allowed) {
      // Calcular próximo reset (dia 1º do próximo mês)
      const now = new Date();
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

      return NextResponse.json(
        {
          error: 'quota_exceeded',
          message: `Você atingiu o limite de ${quota.limit} análises de tabelas este mês`,
          used: quota.used,
          limit: quota.limit,
          remaining: 0,
          resetDate: nextMonth.toISOString(),
        },
        { status: 429 }
      );
    }

    // Processa e comprime a imagem
    console.log('🔄 [API] Processando imagem...');
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

    console.log('✅ [API] Imagem processada:', {
      size: `${(processedBuffer.length / 1024).toFixed(2)} KB`,
      quality
    });

    // Analisa com IA
    console.log('🤖 [API] Enviando para análise de IA...');
    const bytes = new Uint8Array(processedBuffer);
    const result = await analyzeNutritionLabel(bytes, 'image/jpeg');

    console.log('✅ [API] Análise concluída:', result);

    // ✅ Incrementar quota de OCR APÓS sucesso (FREE e PREMIUM)
    if (userPlan !== 'unlimited') {
      await incrementQuota(session.userId, tenant.id, 'ocr');
    }

    return NextResponse.json({ ok: true, result });

  } catch (err: any) {
    console.error('❌ [API] Erro durante análise:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });

    return NextResponse.json({
      error: err.message || 'Erro ao analisar tabela nutricional',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
