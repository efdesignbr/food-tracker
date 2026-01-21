'use client';

import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import type { Plan, SubscriptionStatus } from '@/lib/types/subscription';
import { getUserPlan, getQuotaUsage, processQuotaData, type QuotaData } from '@/lib/api/subscription';
import { api } from '@/lib/api-client';

interface UserPlan {
  plan: Plan;
  subscription_status: SubscriptionStatus;
  quota: QuotaData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Sincroniza o status da assinatura do RevenueCat com o backend
 * Chamado apenas no mobile quando o app inicializa
 */
async function syncRevenueCatSubscription(): Promise<void> {
  try {
    console.log('[useUserPlan] Starting RevenueCat sync...');
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();

    console.log('[useUserPlan] CustomerInfo received:', JSON.stringify({
      originalAppUserId: customerInfo.originalAppUserId,
      activeSubscriptions: customerInfo.activeSubscriptions,
      hasActiveEntitlements: Object.keys(customerInfo.entitlements?.active || {}).length > 0,
    }));

    const response = await api.post('/api/subscription/sync', { customerInfo });
    console.log('[useUserPlan] Sync response:', JSON.stringify(response));
  } catch (err: any) {
    // Silently fail - sync is best effort
    console.warn('[useUserPlan] Sync error:', err?.message || err);
  }
}

/**
 * Hook para buscar plano e quota do usuário logado
 *
 * @example
 * ```tsx
 * const { plan, quota, isLoading } = useUserPlan();
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <div>
 *     <PlanBadge plan={plan} />
 *     {plan === 'premium' && quota && (
 *       <QuotaCard {...quota.photo_analyses} />
 *     )}
 *   </div>
 * );
 * ```
 */
export function useUserPlan(): UserPlan {
  const [plan, setPlan] = useState<Plan>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('active');
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Ref para evitar multiplas sincronizacoes
  const hasSynced = useRef(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // No mobile, sincroniza com RevenueCat antes de buscar o plano
      // Isso garante que o banco esta atualizado com o estado real da assinatura
      const isMobile = Capacitor.isNativePlatform();
      if (isMobile && !hasSynced.current) {
        hasSynced.current = true;
        await syncRevenueCatSubscription();
      }

      // Busca o plano do usuário
      const userPlan = await getUserPlan();
      setPlan(userPlan.plan);
      setSubscriptionStatus(userPlan.subscription_status);

      // Se for premium, busca também a quota
      if (userPlan.plan === 'premium') {
        const quotaData = await getQuotaUsage();
        const processedQuota = processQuotaData(quotaData);
        setQuota(processedQuota);
      } else {
        setQuota(null);
      }
    } catch (err) {
      console.error('Error fetching user plan:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));

      // Fallback para free em caso de erro
      setPlan('free');
      setQuota(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    plan,
    subscription_status: subscriptionStatus,
    quota,
    isLoading,
    error,
    refetch: fetchData
  };
}
