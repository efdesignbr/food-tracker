import { getPool } from '@/lib/db';
import type { RevenueCatEventType, RevenueCatStore, RevenueCatEnvironment } from '@/lib/types/revenuecat';

export interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  user_id: string | null;
  app_user_id: string;
  product_id: string | null;
  store: string | null;
  environment: string | null;
  price_cents: number | null;
  currency: string | null;
  expiration_at: Date | null;
  raw_payload: Record<string, unknown>;
  processed_at: Date;
  created_at: Date;
}

export interface SaveWebhookEventArgs {
  eventId: string;
  eventType: RevenueCatEventType;
  userId: string | null;
  appUserId: string;
  productId: string | null;
  store: RevenueCatStore | null;
  environment: RevenueCatEnvironment | null;
  priceCents: number | null;
  currency: string | null;
  expirationAt: Date | null;
  rawPayload: Record<string, unknown>;
}

/**
 * Verifica se um evento ja foi processado (evitar duplicidade)
 */
export async function getEventById(eventId: string): Promise<WebhookEvent | null> {
  const pool = getPool();

  const result = await pool.query<WebhookEvent>(
    `SELECT * FROM webhook_events WHERE event_id = $1`,
    [eventId]
  );

  return result.rows[0] || null;
}

/**
 * Salva um evento de webhook do RevenueCat
 */
export async function saveWebhookEvent(args: SaveWebhookEventArgs): Promise<WebhookEvent> {
  const pool = getPool();

  const result = await pool.query<WebhookEvent>(
    `INSERT INTO webhook_events (
      event_id,
      event_type,
      user_id,
      app_user_id,
      product_id,
      store,
      environment,
      price_cents,
      currency,
      expiration_at,
      raw_payload
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      args.eventId,
      args.eventType,
      args.userId,
      args.appUserId,
      args.productId,
      args.store,
      args.environment,
      args.priceCents,
      args.currency,
      args.expirationAt,
      JSON.stringify(args.rawPayload),
    ]
  );

  return result.rows[0];
}

/**
 * Atualiza o user_id de um evento (quando conseguimos identificar o usuario)
 */
export async function updateEventUserId(eventId: string, userId: string): Promise<void> {
  const pool = getPool();

  await pool.query(
    `UPDATE webhook_events SET user_id = $1 WHERE event_id = $2`,
    [userId, eventId]
  );
}

/**
 * Busca eventos recentes de um app_user_id
 */
export async function getEventsByAppUserId(
  appUserId: string,
  limit: number = 10
): Promise<WebhookEvent[]> {
  const pool = getPool();

  const result = await pool.query<WebhookEvent>(
    `SELECT * FROM webhook_events
     WHERE app_user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [appUserId, limit]
  );

  return result.rows;
}
