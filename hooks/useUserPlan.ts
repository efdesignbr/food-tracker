'use client';

import { useState, useEffect } from 'react';
import type { Plan, SubscriptionStatus } from '@/lib/types/subscription';
import { getUserPlan, getQuotaUsage, processQuotaData, type QuotaData } from '@/lib/api/subscription';

interface UserPlan {
  plan: Plan;
  subscription_status: SubscriptionStatus;
  quota: QuotaData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

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
