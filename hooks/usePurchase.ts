'use client';

import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Tipos
interface Package {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
  offeringIdentifier: string;
}

interface Offering {
  identifier: string;
  serverDescription: string;
  availablePackages: Package[];
  monthly: Package | null;
  annual: Package | null;
}

interface PurchaseState {
  isLoading: boolean;
  error: string | null;
  offerings: Offering | null;
  packages: Package[];
}

/**
 * Hook para gerenciar compras com RevenueCat
 */
export function usePurchase() {
  const [state, setState] = useState<PurchaseState>({
    isLoading: false,
    error: null,
    offerings: null,
    packages: [],
  });

  const isMobile = Capacitor.isNativePlatform();

  /**
   * Carrega as ofertas disponiveis
   */
  const loadOfferings = useCallback(async () => {
    if (!isMobile) {
      setState(prev => ({
        ...prev,
        error: 'Compras disponíveis apenas no app',
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const offerings = await Purchases.getOfferings();

      const current = offerings.current;
      if (!current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Nenhuma oferta disponível',
        }));
        return;
      }

      setState({
        isLoading: false,
        error: null,
        offerings: current as unknown as Offering,
        packages: (current.availablePackages || []) as unknown as Package[],
      });
    } catch (err) {
      console.error('[Purchase] Load offerings error:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar ofertas',
      }));
    }
  }, [isMobile]);

  /**
   * Executa uma compra
   */
  const purchase = useCallback(async (pkg: Package): Promise<boolean> => {
    if (!isMobile) return false;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { Purchases } = await import('@revenuecat/purchases-capacitor');

      const result = await Purchases.purchasePackage({ aPackage: pkg as any });

      // Verifica se a compra foi bem sucedida
      const isPremium = !!result.customerInfo.entitlements.active['premium'];

      setState(prev => ({ ...prev, isLoading: false }));

      if (isPremium) {
        // Sincroniza com o backend
        try {
          await fetch('/api/subscription/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerInfo: result.customerInfo,
            }),
          });
        } catch (syncErr) {
          console.error('[Purchase] Sync error:', syncErr);
        }
      }

      return isPremium;
    } catch (err: any) {
      // Verifica se foi cancelamento do usuario
      if (err?.userCancelled) {
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      console.error('[Purchase] Error:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro na compra',
      }));
      return false;
    }
  }, [isMobile]);

  /**
   * Restaura compras anteriores
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isMobile) return false;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.restorePurchases();

      const isPremium = !!customerInfo.entitlements.active['premium'];

      setState(prev => ({ ...prev, isLoading: false }));

      if (isPremium) {
        // Sincroniza com o backend
        try {
          await fetch('/api/subscription/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerInfo }),
          });
        } catch (syncErr) {
          console.error('[Purchase] Sync error:', syncErr);
        }
      }

      return isPremium;
    } catch (err) {
      console.error('[Purchase] Restore error:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro ao restaurar',
      }));
      return false;
    }
  }, [isMobile]);

  return {
    ...state,
    isMobile,
    loadOfferings,
    purchase,
    restorePurchases,
  };
}
