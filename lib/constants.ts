/**
 * 📐 Application Constants
 *
 * Centralized constants to avoid magic numbers scattered across the codebase.
 * This improves maintainability and makes configuration changes easier.
 */

// 📦 File Upload Limits
export const UPLOAD = {
  /** Maximum upload file size in bytes (5MB) */
  MAX_BYTES: 5 * 1024 * 1024,
} as const;

// 🖼️ Image Processing
export const IMAGE = {
  /** Maximum dimension for resized images (width/height) */
  MAX_DIMENSION_PX: 1024,

  /** Target maximum file size after compression (100KB) */
  TARGET_MAX_SIZE_BYTES: 100 * 1024,

  /** Initial JPEG quality for compression (0-100) */
  INITIAL_QUALITY: 80,

  /** Minimum JPEG quality before giving up compression (0-100) */
  MIN_QUALITY: 20,

  /** Quality reduction step per iteration */
  QUALITY_STEP: 10,
} as const;

// 🗄️ Database Configuration
export const DATABASE = {
  /** Maximum number of connections in the pool */
  POOL_MAX_CONNECTIONS: 5,

  /** Default timezone for database connections */
  DEFAULT_TIMEZONE: 'America/Sao_Paulo',
} as const;

// 📅 Time Periods (in days)
export const PERIOD = {
  /** Week filter period */
  WEEK_DAYS: 7,

  /** Month filter period */
  MONTH_DAYS: 30,
} as const;

// 💎 Subscription Plans & Quotas
export const PLAN_LIMITS = {
  free: {
    /** Análises de foto - ilimitado (controle via rewarded ads no frontend) */
    photo_analyses_per_month: 999999,

    /** Análises de tabela nutricional (OCR) - ilimitado (controle via ads) */
    ocr_analyses_per_month: 999999,

    /** Análises de texto - ilimitado (controle via ads) */
    text_analyses_per_month: 999999,

    /** Coach IA - ilimitado (controle via ads) */
    coach_analyses_per_month: 999999,

    /** Relatórios IA - ilimitado (controle via ads) */
    report_analyses_per_month: 999999,

    /** Dias de histórico disponível (FREE limitado a 30 dias) */
    history_days: 30,

    /** Coach IA disponível? */
    coach_ai: true,

    /** Relatórios avançados disponíveis? */
    advanced_reports: true,

    /** Exportação de dados disponível? */
    data_export: false,

    /** Exibe rewarded ads antes de cada uso */
    show_ads: true,
  },
  premium: {
    /** Análises de foto de refeições por mês (5/dia × 30 dias) */
    photo_analyses_per_month: 150,

    /** Análises de tabela nutricional (OCR) por mês */
    ocr_analyses_per_month: 150,

    /** Análises de texto por mês (5/dia × 30 dias) */
    text_analyses_per_month: 150,

    /** Coach IA por mês */
    coach_analyses_per_month: 3,

    /** Relatórios IA por mês */
    report_analyses_per_month: 3,

    /** Dias de histórico disponível (null = ilimitado) */
    history_days: null,

    /** Coach IA disponível? */
    coach_ai: true,

    /** Relatórios avançados disponíveis? */
    advanced_reports: true,

    /** Exportação de dados disponível? */
    data_export: true,

    /** Sem anúncios */
    show_ads: false,
  },
  unlimited: {
    /** Análises ilimitadas (para admins/owners) */
    photo_analyses_per_month: 999999,

    /** Análises ilimitadas (para admins/owners) */
    ocr_analyses_per_month: 999999,

    /** Análises ilimitadas (para admins/owners) */
    text_analyses_per_month: 999999,

    /** Coach ilimitado */
    coach_analyses_per_month: 999999,

    /** Relatórios ilimitados */
    report_analyses_per_month: 999999,

    /** Histórico ilimitado */
    history_days: null,

    /** Todos recursos disponíveis */
    coach_ai: true,
    advanced_reports: true,
    data_export: true,

    /** Sem anúncios */
    show_ads: false,
  },
} as const;

export const QUOTA_TYPES = {
  PHOTO: 'photo_analyses' as const,
  OCR: 'ocr_analyses' as const,
  TEXT: 'text_analyses' as const,
} as const;

// 💳 RevenueCat Configuration
export const REVENUECAT = {
  /** ID do entitlement que da acesso premium */
  ENTITLEMENT_ID: 'premium',

  /** IDs dos produtos configurados no RevenueCat */
  PRODUCTS: {
    MONTHLY: 'premium_monthly',
    ANNUAL: 'premium_annual',
  },

  /** Mapeamento de store do RevenueCat para banco de dados */
  STORE_MAP: {
    APP_STORE: 'app_store',
    PLAY_STORE: 'play_store',
  } as const,

  /** Eventos que ativam a assinatura */
  ACTIVATE_EVENTS: [
    'INITIAL_PURCHASE',
    'RENEWAL',
    'UNCANCELLATION',
  ] as const,

  /** Eventos que desativam/expiram a assinatura */
  DEACTIVATE_EVENTS: [
    'EXPIRATION',
    'CANCELLATION',
  ] as const,
} as const;
