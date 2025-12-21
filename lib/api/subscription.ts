// API functions para subscription/quota
// Data: 2025-10-25

import type { Plan, SubscriptionStatus, UsageQuota } from '@/lib/types/subscription';
import { api } from '@/lib/api-client';

export interface UserPlanResponse {
  plan: Plan;
  subscription_status: SubscriptionStatus;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
}

export interface QuotaUsageResponse {
  month: string;
  photo_analyses: number;
  ocr_analyses: number;
  limits: {
    photo_analyses_per_month: number;
    ocr_analyses_per_month: number;
  };
}

export interface QuotaData {
  photo_analyses: {
    used: number;
    limit: number;
    percentage: number;
    remaining: number;
  };
  ocr_analyses: {
    used: number;
    limit: number;
    percentage: number;
    remaining: number;
  };
  resetDate: Date;
}

/**
 * Busca o plano do usuário logado
 */
export async function getUserPlan(): Promise<UserPlanResponse> {
  const res = await api.get('/api/user/profile');

  if (!res.ok) {
    throw new Error(`Failed to fetch user plan: ${res.status}`);
  }

  const data = await res.json();
  const user = data.user;

  return {
    plan: user.plan || 'free',
    subscription_status: user.subscription_status || 'active',
    subscription_started_at: user.subscription_started_at,
    subscription_expires_at: user.subscription_expires_at
  };
}

/**
 * Busca o uso de quota do usuário
 */
export async function getQuotaUsage(): Promise<QuotaUsageResponse> {
  const res = await api.get('/api/subscription/quota');

  if (!res.ok) {
    throw new Error(`Failed to fetch quota usage: ${res.status}`);
  }

  return res.json();
}

/**
 * Processa os dados de quota para formato usado no frontend
 */
export function processQuotaData(quota: QuotaUsageResponse): QuotaData {
  const photoPercentage = (quota.photo_analyses / quota.limits.photo_analyses_per_month) * 100;
  const ocrPercentage = (quota.ocr_analyses / quota.limits.ocr_analyses_per_month) * 100;

  // Calcula a data de reset (primeiro dia do próximo mês)
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    photo_analyses: {
      used: quota.photo_analyses,
      limit: quota.limits.photo_analyses_per_month,
      percentage: Math.round(photoPercentage),
      remaining: quota.limits.photo_analyses_per_month - quota.photo_analyses
    },
    ocr_analyses: {
      used: quota.ocr_analyses,
      limit: quota.limits.ocr_analyses_per_month,
      percentage: Math.round(ocrPercentage),
      remaining: quota.limits.ocr_analyses_per_month - quota.ocr_analyses
    },
    resetDate
  };
}

/**
 * Cria sessão de checkout (futuro - Stripe)
 */
export async function createCheckoutSession(): Promise<{ url: string }> {
  // TODO: Implementar na Fase 4 com Stripe
  console.warn('createCheckoutSession: Not implemented yet (Fase 4)');

  return {
    url: '/upgrade' // Mock por enquanto
  };
}
