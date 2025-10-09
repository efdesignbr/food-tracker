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
