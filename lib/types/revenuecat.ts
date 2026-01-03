// Types para integracao com RevenueCat
// Data: 03/01/2026

/**
 * Tipos de eventos de webhook do RevenueCat
 * Ref: https://www.revenuecat.com/docs/integrations/webhooks
 */
export type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER'
  | 'TEST';

/**
 * Store de origem da compra
 */
export type RevenueCatStore = 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';

/**
 * Ambiente do evento
 */
export type RevenueCatEnvironment = 'SANDBOX' | 'PRODUCTION';

/**
 * Periodo de assinatura
 */
export type RevenueCatPeriodType = 'TRIAL' | 'INTRO' | 'NORMAL';

/**
 * Informacoes do subscriber no evento
 */
export interface RevenueCatSubscriberInfo {
  original_app_user_id: string;
  aliases: string[];
  first_seen: string;
  management_url: string | null;
  non_subscriptions: Record<string, unknown>;
  original_application_version: string | null;
  original_purchase_date: string | null;
  subscriptions: Record<string, RevenueCatSubscription>;
  entitlements: Record<string, RevenueCatEntitlement>;
}

/**
 * Informacoes de uma assinatura
 */
export interface RevenueCatSubscription {
  billing_issues_detected_at: string | null;
  expires_date: string | null;
  grace_period_expires_date: string | null;
  is_sandbox: boolean;
  original_purchase_date: string;
  period_type: RevenueCatPeriodType;
  purchase_date: string;
  refunded_at: string | null;
  store: RevenueCatStore;
  unsubscribe_detected_at: string | null;
}

/**
 * Informacoes de um entitlement
 */
export interface RevenueCatEntitlement {
  expires_date: string | null;
  grace_period_expires_date: string | null;
  product_identifier: string;
  purchase_date: string;
}

/**
 * Payload completo do webhook do RevenueCat
 */
export interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    aliases: string[];
    app_id: string;
    app_user_id: string;
    commission_percentage: number | null;
    country_code: string;
    currency: string;
    entitlement_id: string | null;
    entitlement_ids: string[] | null;
    environment: RevenueCatEnvironment;
    event_timestamp_ms: number;
    expiration_at_ms: number | null;
    id: string;
    is_family_share: boolean;
    offer_code: string | null;
    original_app_user_id: string;
    original_transaction_id: string;
    period_type: RevenueCatPeriodType;
    presented_offering_id: string | null;
    price: number | null;
    price_in_purchased_currency: number | null;
    product_id: string;
    purchased_at_ms: number;
    store: RevenueCatStore;
    subscriber_attributes: Record<string, { value: string; updated_at_ms: number }>;
    takehome_percentage: number | null;
    tax_percentage: number | null;
    transaction_id: string;
    type: RevenueCatEventType;
  };
}

/**
 * Dados extraidos do evento para processamento interno
 */
export interface ProcessedRevenueCatEvent {
  eventId: string;
  eventType: RevenueCatEventType;
  appUserId: string;
  originalAppUserId: string;
  productId: string;
  store: RevenueCatStore;
  environment: RevenueCatEnvironment;
  priceCents: number | null;
  currency: string;
  expirationAt: Date | null;
  purchasedAt: Date;
  originalTransactionId: string;
  isActive: boolean;
}

/**
 * Configuracao do RevenueCat para o SDK mobile
 */
export interface RevenueCatConfig {
  apiKeyIOS: string;
  apiKeyAndroid: string;
  entitlementId: string;
  productIds: {
    monthly: string;
    annual: string;
  };
}
