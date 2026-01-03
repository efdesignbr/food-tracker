'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from './AppLayout';

/**
 * Decodifica um JWT e retorna o payload
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Inicializa o RevenueCat SDK com o userId do usuario
 */
async function initializeRevenueCat(userId: string): Promise<void> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY;
    if (!apiKey) {
      console.warn('[RevenueCat] API key not configured');
      return;
    }

    const { Purchases } = await import('@revenuecat/purchases-capacitor');

    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });

    console.log('[RevenueCat] Initialized with userId:', userId);
  } catch (err) {
    console.error('[RevenueCat] Init error:', err);
  }
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const revenueCatInitialized = useRef(false);

  useEffect(() => {
    // Rotas públicas que não precisam de auth
    const publicRoutes = ['/login', '/signup'];
    if (publicRoutes.some(route => pathname?.startsWith(route))) {
      setIsAuthorized(true);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthorized(true);

      // Inicializa RevenueCat com o userId do token
      if (!revenueCatInitialized.current) {
        revenueCatInitialized.current = true;
        const payload = decodeJwtPayload(token);
        const userId = payload?.userId as string | undefined;
        if (userId) {
          initializeRevenueCat(userId);
        }
      }
    }
  }, [router, pathname]);

  if (!isAuthorized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        paddingTop: 'env(safe-area-inset-top)'
      }}>
        Carregando...
      </div>
    );
  }

  // Se for rota pública, renderiza sem o layout do app (header, menu)
  const publicRoutes = ['/login', '/signup'];
  if (publicRoutes.some(route => pathname?.startsWith(route))) {
    return (
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {children}
      </div>
    );
  }

  return (
    <AppLayout tenantName="Food Tracker" userName="Você">
      {children}
    </AppLayout>
  );
}
