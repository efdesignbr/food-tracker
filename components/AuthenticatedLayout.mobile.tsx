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

    // Garante que compras anteriores (anonimas) sejam vinculadas ao userId atual
    try {
      await Purchases.logIn({ appUserID: userId } as any);
    } catch (e) {
      // Ignora se ja estiver logado; apenas informativo
      console.log('[RevenueCat] logIn skipped or failed:', e);
    }

    console.log('[RevenueCat] Initialized with userId:', userId);
  } catch (err) {
    console.error('[RevenueCat] Init error:', err);
  }
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const revenueCatInitialized = useRef(false);

  useEffect(() => {
    // Rotas públicas que não precisam de auth
    const publicRoutes = ['/login', '/signup'];
    const isPublic = publicRoutes.some(route => pathname?.startsWith(route));

    if (typeof window === 'undefined') return;

    const currentToken = localStorage.getItem('auth_token');
    setToken(currentToken);

    if (isPublic) {
      setIsAuthorized(true);
      return;
    }

    if (!currentToken) {
      setIsAuthorized(false);
      router.replace('/login');
      return;
    }

    setIsAuthorized(true);

    // Inicializa RevenueCat com o userId do token (uma vez)
    if (!revenueCatInitialized.current && currentToken) {
      revenueCatInitialized.current = true;
      const payload = decodeJwtPayload(currentToken);
      const userId = payload?.userId as string | undefined;
      if (userId) {
        initializeRevenueCat(userId);
      }
    }
  }, [router, pathname]);

  // Reage a mudanças no token (ex: logout por 401 ou clique em "Sair")
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'auth_logout_at') {
        const t = localStorage.getItem('auth_token');
        setToken(t);
        if (!t) {
          setIsAuthorized(false);
          router.replace('/login');
        }
      }
    };

    const onAppLogout = () => {
      const t = localStorage.getItem('auth_token');
      setToken(t);
      if (!t) {
        setIsAuthorized(false);
        router.replace('/login');
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('app:logout', onAppLogout as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app:logout', onAppLogout as EventListener);
    };
  }, [router]);

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
