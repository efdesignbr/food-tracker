'use client';

import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Tipos do RevenueCat
interface CustomerInfo {
  entitlements: {
    active: Record<string, {
      identifier: string;
      isActive: boolean;
      willRenew: boolean;
      periodType: string;
      productIdentifier: string;
      isSandbox: boolean;
      expirationDate: string | null;
    }>;
  };
  activeSubscriptions: string[];
  originalAppUserId: string;
}

interface RevenueCatState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  customerInfo: CustomerInfo | null;
  isPremium: boolean;
}

const ENTITLEMENT_ID = 'premium';

/**
 * Hook para inicializar e gerenciar o RevenueCat SDK
 */
export function useRevenueCat(userId?: string): RevenueCatState & {
  initialize: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
} {
  const [state, setState] = useState<RevenueCatState>({
    isReady: false,
    isLoading: true,
    error: null,
    customerInfo: null,
    isPremium: false,
  });

  const isMobile = Capacitor.isNativePlatform();

  const initialize = useCallback(async () => {
    if (!isMobile) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isReady: false,
        error: 'RevenueCat only works on mobile',
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY;
      if (!apiKey) {
        throw new Error('NEXT_PUBLIC_REVENUECAT_API_KEY not configured');
      }

      // Import dinamico para evitar erros no SSR
      const { Purchases } = await import('@revenuecat/purchases-capacitor');

      // Configura o SDK
      await Purchases.configure({
        apiKey,
        appUserID: userId || null,
      });

      // Busca informacoes do cliente
      const { customerInfo } = await Purchases.getCustomerInfo();

      // Verifica se tem entitlement premium ativo
      const isPremium = !!customerInfo.entitlements.active[ENTITLEMENT_ID];

      setState({
        isReady: true,
        isLoading: false,
        error: null,
        customerInfo: customerInfo as CustomerInfo,
        isPremium,
      });
    } catch (err) {
      console.error('[RevenueCat] Init error:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to initialize',
      }));
    }
  }, [isMobile, userId]);

  const refreshCustomerInfo = useCallback(async () => {
    if (!isMobile || !state.isReady) return;

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.getCustomerInfo();
      const isPremium = !!customerInfo.entitlements.active[ENTITLEMENT_ID];

      setState(prev => ({
        ...prev,
        customerInfo: customerInfo as CustomerInfo,
        isPremium,
      }));
    } catch (err) {
      console.error('[RevenueCat] Refresh error:', err);
    }
  }, [isMobile, state.isReady]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...state,
    initialize,
    refreshCustomerInfo,
  };
}
