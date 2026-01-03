import { NextRequest, NextResponse } from 'next/server';
import { handleRevenueCatEvent } from '@/lib/services/subscription.service';
import type { RevenueCatWebhookEvent } from '@/lib/types/revenuecat';

/**
 * Webhook endpoint para receber eventos do RevenueCat
 *
 * Configurar no RevenueCat Dashboard:
 * URL: https://seu-dominio.com/api/webhooks/revenuecat
 * Authorization Header: Bearer <REVENUECAT_WEBHOOK_AUTH_KEY>
 */
export async function POST(request: NextRequest) {
  try {
    // Verifica autorizacao
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.REVENUECAT_WEBHOOK_AUTH_KEY;

    if (!expectedAuth) {
      console.error('[RevenueCat Webhook] REVENUECAT_WEBHOOK_AUTH_KEY not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // RevenueCat envia como "Bearer <token>" ou apenas "<token>"
    const token = authHeader?.replace('Bearer ', '').trim();

    if (token !== expectedAuth) {
      console.warn('[RevenueCat Webhook] Invalid authorization');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse do payload
    const payload: RevenueCatWebhookEvent = await request.json();

    // Log do evento (sem dados sensiveis)
    console.log('[RevenueCat Webhook] Received event:', {
      type: payload.event?.type,
      appUserId: payload.event?.app_user_id,
      productId: payload.event?.product_id,
      environment: payload.event?.environment,
    });

    // Valida estrutura basica do payload
    if (!payload.event || !payload.event.type || !payload.event.id) {
      console.error('[RevenueCat Webhook] Invalid payload structure');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Processa o evento
    const result = await handleRevenueCatEvent(payload);

    if (!result.processed) {
      // Evento ja foi processado antes (duplicado)
      console.log('[RevenueCat Webhook] Event already processed:', payload.event.id);
      return NextResponse.json({ ok: true, duplicate: true });
    }

    if (result.error) {
      // Evento processado mas com aviso (ex: usuario nao encontrado)
      console.warn('[RevenueCat Webhook] Processed with warning:', result.error);
    }

    console.log('[RevenueCat Webhook] Event processed successfully:', {
      eventId: payload.event.id,
      userId: result.userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[RevenueCat Webhook] Error processing event:', error);

    // Retorna 200 para evitar retries do RevenueCat em erros de processamento
    // O evento ja foi logado para investigacao
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 200 }
    );
  }
}

/**
 * Health check para verificar se o endpoint esta funcionando
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'RevenueCat Webhook',
    timestamp: new Date().toISOString(),
  });
}
