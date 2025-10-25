// Types para sistema de assinaturas
// Data: 2025-10-25

export type Plan = 'free' | 'premium' | 'unlimited';

export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trial' | 'lifetime';

export interface UserWithPlan {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  plan: Plan;
  subscription_status: SubscriptionStatus;
  subscription_started_at: Date | null;
  subscription_expires_at: Date | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UsageQuota {
  id: string;
  user_id: string;
  tenant_id: string;
  month: string; // 'YYYY-MM'
  photo_analyses: number;
  ocr_analyses: number;
  created_at: Date;
  updated_at: Date;
}

export interface QuotaLimits {
  photo_analyses_per_month: number;
  ocr_analyses_per_month: number;
  history_days: number | null; // null = ilimitado
  coach_ai: boolean;
  advanced_reports: boolean;
  data_export: boolean;
}

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}
