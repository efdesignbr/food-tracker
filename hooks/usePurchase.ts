'use client';

import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { api } from '@/lib/api-client';

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
    console.log('[Purchase] loadOfferings called, isMobile:', isMobile);

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

      // LOG: Verifica se SDK está configurado tentando obter customerInfo
      console.log('[Purchase] Checking if SDK is configured...');
      try {
        const { customerInfo } = await Purchases.getCustomerInfo();
        console.log('[Purchase] SDK is configured, customerInfo userId:', customerInfo.originalAppUserId);
      } catch (configCheckErr) {
        console.log('[Purchase] SDK NOT configured, configuring now...');
        const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY;
        console.log('[Purchase] API Key exists:', !!apiKey);
        if (apiKey) {
          await Purchases.configure({ apiKey });
          console.log('[Purchase] SDK configured successfully');
        } else {
          console.error('[Purchase] NO API KEY FOUND!');
        }
      }

      console.log('[Purchase] Calling getOfferings...');
      const offerings = await Purchases.getOfferings();
      console.log('[Purchase] getOfferings result:', JSON.stringify({
        hasOfferings: !!offerings,
        hasCurrent: !!offerings?.current,
        currentIdentifier: offerings?.current?.identifier,
        allOfferingsKeys: offerings?.all ? Object.keys(offerings.all) : [],
        availablePackagesCount: offerings?.current?.availablePackages?.length ?? 0,
      }));

      const current = offerings.current;
      if (!current) {
        console.error('[Purchase] offerings.current is NULL! Full offerings:', JSON.stringify(offerings));
        // Não mostrar erro técnico - usar mensagem amigável
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Assinaturas temporariamente indisponíveis. Tente novamente mais tarde.',
        }));
        return;
      }

      console.log('[Purchase] Current offering found:', current.identifier, 'packages:', current.availablePackages?.length);

      setState({
        isLoading: false,
        error: null,
        offerings: current as unknown as Offering,
        packages: (current.availablePackages || []) as unknown as Package[],
      });
    } catch (err: any) {
      console.error('[Purchase] Load offerings error:', err);
      console.error('[Purchase] Error details:', JSON.stringify({
        message: err?.message,
        code: err?.code,
        underlyingErrorMessage: err?.underlyingErrorMessage,
        readableErrorCode: err?.readableErrorCode,
        stack: err?.stack,
      }));
      // Não mostrar mensagem técnica do SDK - usar mensagem amigável
      // A Apple rejeita apps que mostram erros técnicos de configuração
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Assinaturas temporariamente indisponíveis. Tente novamente mais tarde.',
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

      // Sempre sincroniza com o backend após compra bem-sucedida
      try {
        await api.post('/api/subscription/sync', {
          customerInfo: result.customerInfo,
        });
        console.log('[Purchase] Sync success');
      } catch (syncErr) {
        console.error('[Purchase] Sync error:', syncErr);
      }

      setState(prev => ({ ...prev, isLoading: false }));

      // Compra bem-sucedida (não caiu no catch) = retorna true
      // O backend já foi sincronizado e tem fallbacks robustos
      return true;
    } catch (err: any) {
      // Verifica se foi cancelamento do usuario
      if (err?.userCancelled) {
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      console.error('[Purchase] Error:', err);
      // Não mostrar mensagem técnica - usar mensagem amigável
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Não foi possível completar a compra. Tente novamente.',
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
          await api.post('/api/subscription/sync', { customerInfo });
          console.log('[Purchase] Restore sync success');
        } catch (syncErr) {
          console.error('[Purchase] Sync error:', syncErr);
        }
      }

      return isPremium;
    } catch (err) {
      console.error('[Purchase] Restore error:', err);
      // Não mostrar mensagem técnica - usar mensagem amigável
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Não foi possível restaurar compras. Tente novamente.',
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
