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
    /** Análises de foto de refeições por mês (FREE não tem acesso) */
    photo_analyses_per_month: 0,

    /** Análises de tabela nutricional (OCR) por mês (FREE não tem acesso) */
    ocr_analyses_per_month: 0,

    /** Dias de histórico disponível (FREE limitado a 30 dias) */
    history_days: 30,

    /** Coach IA disponível? */
    coach_ai: false,

    /** Relatórios avançados disponíveis? */
    advanced_reports: false,

    /** Exportação de dados disponível? */
    data_export: false,
  },
  premium: {
    /** Análises de foto de refeições por mês (3 por dia de média) */
    photo_analyses_per_month: 90,

    /** Análises de tabela nutricional (OCR) por mês (1 por dia de média) */
    ocr_analyses_per_month: 30,

    /** Dias de histórico disponível (null = ilimitado) */
    history_days: null,

    /** Coach IA disponível? */
    coach_ai: true,

    /** Relatórios avançados disponíveis? */
    advanced_reports: true,

    /** Exportação de dados disponível? */
    data_export: true,
  },
  unlimited: {
    /** Análises ilimitadas (para admins/owners) */
    photo_analyses_per_month: 999999,

    /** Análises ilimitadas (para admins/owners) */
    ocr_analyses_per_month: 999999,

    /** Histórico ilimitado */
    history_days: null,

    /** Todos recursos disponíveis */
    coach_ai: true,
    advanced_reports: true,
    data_export: true,
  },
} as const;

export const QUOTA_TYPES = {
  PHOTO: 'photo_analyses' as const,
  OCR: 'ocr_analyses' as const,
} as const;
