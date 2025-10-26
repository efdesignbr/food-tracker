'use client';

import type { QuotaData } from '@/lib/api/subscription';

/**
 * Hook simplificado para verificar quotas
 *
 * Este hook utiliza os dados já carregados pelo useUserPlan()
 * e fornece helpers para verificar se pode usar recursos.
 *
 * @example
 * ```tsx
 * const { plan, quota } = useUserPlan();
 * const { canUseFeature, getQuotaInfo } = useQuota(plan, quota);
 *
 * if (canUseFeature('photo')) {
 *   // Pode usar foto
 * }
 *
 * const photoInfo = getQuotaInfo('photo');
 * // { used: 45, limit: 90, remaining: 45, percentage: 50, canUse: true }
 * ```
 */

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  canUse: boolean;
}

export interface UseQuotaResult {
  canUseFeature: (feature: 'photo' | 'ocr') => boolean;
  getQuotaInfo: (feature: 'photo' | 'ocr') => QuotaInfo;
  hasQuota: boolean;
}

export function useQuota(
  plan: 'free' | 'premium' | 'unlimited',
  quota: QuotaData | null
): UseQuotaResult {
  /**
   * Verifica se o usuário pode usar um recurso
   */
  const canUseFeature = (feature: 'photo' | 'ocr'): boolean => {
    // FREE nunca pode
    if (plan === 'free') return false;

    // UNLIMITED sempre pode
    if (plan === 'unlimited') return true;

    // PREMIUM: verifica remaining
    if (!quota) return false;

    const featureData = feature === 'photo'
      ? quota.photo_analyses
      : quota.ocr_analyses;

    return featureData.remaining > 0;
  };

  /**
   * Retorna informações detalhadas sobre a quota de um recurso
   */
  const getQuotaInfo = (feature: 'photo' | 'ocr'): QuotaInfo => {
    // FREE: sem acesso
    if (plan === 'free') {
      return {
        used: 0,
        limit: 0,
        remaining: 0,
        percentage: 0,
        canUse: false
      };
    }

    // UNLIMITED: "infinito"
    if (plan === 'unlimited') {
      const used = quota
        ? (feature === 'photo' ? quota.photo_analyses.used : quota.ocr_analyses.used)
        : 0;

      return {
        used,
        limit: 999999,
        remaining: 999999,
        percentage: 0,
        canUse: true
      };
    }

    // PREMIUM: dados reais
    if (!quota) {
      return {
        used: 0,
        limit: 0,
        remaining: 0,
        percentage: 0,
        canUse: false
      };
    }

    const featureData = feature === 'photo'
      ? quota.photo_analyses
      : quota.ocr_analyses;

    return {
      used: featureData.used,
      limit: featureData.limit,
      remaining: featureData.remaining,
      percentage: featureData.percentage,
      canUse: featureData.remaining > 0
    };
  };

  return {
    canUseFeature,
    getQuotaInfo,
    hasQuota: plan === 'premium' && quota !== null
  };
}
