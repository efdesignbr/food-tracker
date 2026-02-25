'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import AppLayout from './AppLayout';
import { initAdMob, showTopBanner, hideTopBanner } from '@/lib/ads/admob';
import { redirectToLogin, isRedirectingToLogin } from '@/lib/auth-client';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

function isPublicRoute(path: string | null): boolean {
  if (!path) return false;
  return PUBLIC_ROUTES.some(route => path.startsWith(route));
}

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
  console.log('[RevenueCat] initializeRevenueCat called with userId:', userId);
  const startTime = Date.now();

  try {
    const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY;
    console.log('[RevenueCat] API key exists:', !!apiKey);
    if (!apiKey) {
      console.warn('[RevenueCat] API key not configured');
      return;
    }

    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    console.log('[RevenueCat] Purchases module imported');

    console.log('[RevenueCat] Calling configure...');
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });
    console.log('[RevenueCat] configure completed in', Date.now() - startTime, 'ms');

    // Garante que compras anteriores (anonimas) sejam vinculadas ao userId atual
    try {
      console.log('[RevenueCat] Calling logIn...');
      await Purchases.logIn({ appUserID: userId } as any);
      console.log('[RevenueCat] logIn completed');
    } catch (e: any) {
      // Ignora se ja estiver logado; apenas informativo
      console.log('[RevenueCat] logIn skipped or failed:', e?.message || e);
    }

    // Testa se offerings estão disponíveis imediatamente após configure
    try {
      console.log('[RevenueCat] Testing getOfferings after init...');
      const offerings = await Purchases.getOfferings();
      console.log('[RevenueCat] Offerings test result:', JSON.stringify({
        hasCurrent: !!offerings?.current,
        currentId: offerings?.current?.identifier,
        packagesCount: offerings?.current?.availablePackages?.length ?? 0,
      }));
    } catch (offeringsErr: any) {
      console.error('[RevenueCat] Offerings test FAILED:', offeringsErr?.message || offeringsErr);
    }

    console.log('[RevenueCat] Initialized successfully with userId:', userId, 'total time:', Date.now() - startTime, 'ms');
  } catch (err: any) {
    console.error('[RevenueCat] Init error:', err?.message || err);
    console.error('[RevenueCat] Init error details:', JSON.stringify({
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    }));
  }
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Evita flash de "Carregando..." nas rotas públicas
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isPublicRoute(window.location.pathname);
  });
  const [token, setToken] = useState<string | null>(null);
  const lastInitializedToken = useRef<string | null>(null);

  // === useEffect: Auth check + event listeners ===
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function checkAuthAndRedirect() {
      const currentToken = localStorage.getItem('auth_token');
      setToken(currentToken);

      if (isPublicRoute(pathname)) {
        setIsAuthorized(true);
        hideTopBanner();
        return;
      }

      if (!currentToken) {
        setIsAuthorized(false);
        hideTopBanner();
        redirectToLogin();
        return;
      }

      // Token exists and route is protected — user is authorized
      setIsAuthorized(true);

      // Initialize RevenueCat & AdMob on new token (login)
      if (lastInitializedToken.current !== currentToken) {
        lastInitializedToken.current = currentToken;
        const payload = decodeJwtPayload(currentToken);
        const userId = payload?.userId as string | undefined;
        if (userId) {
          initializeRevenueCat(userId);
        }
        initAdMob();
      }
    }

    // Run immediately
    checkAuthAndRedirect();

    // Event listeners for logout triggers
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'auth_logout_at') {
        const t = localStorage.getItem('auth_token');
        setToken(t);
        if (!t) {
          setIsAuthorized(false);
          hideTopBanner();
          lastInitializedToken.current = null;
          redirectToLogin();
        }
      }
    };

    const onAppLogout = () => {
      const t = localStorage.getItem('auth_token');
      setToken(t);
      if (!t) {
        setIsAuthorized(false);
        hideTopBanner();
        lastInitializedToken.current = null;
        redirectToLogin();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('app:logout', onAppLogout as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app:logout', onAppLogout as EventListener);
    };
  }, [pathname]);

  // === useEffect: Banner control based on plan ===
  useEffect(() => {
    if (isPublicRoute(pathname)) {
      hideTopBanner();
      return;
    }

    const currentToken = localStorage.getItem('auth_token');
    if (!currentToken) {
      hideTopBanner();
      return;
    }

    const payload = decodeJwtPayload(currentToken);
    const userPlan = (payload?.plan as string) || 'free';

    if (userPlan === 'free') {
      showTopBanner();
    } else {
      hideTopBanner();
    }
  }, [token, pathname]);

  // --- Render ---

  if (!isAuthorized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        paddingTop: 'env(safe-area-inset-top)',
        flexDirection: 'column',
        gap: 16,
      }}>
        {isRedirectingToLogin() ? (
          <>
            <div style={{ fontSize: 14, color: '#666' }}>Redirecionando...</div>
            <a
              href="/login.html"
              style={{ color: '#2196F3', textDecoration: 'underline', fontSize: 14 }}
            >
              Toque aqui se nao for redirecionado
            </a>
          </>
        ) : (
          <>
            <div>Carregando...</div>
            <a
              href="/login.html"
              style={{ color: '#2196F3', textDecoration: 'underline' }}
            >
              Ir para a tela de login
            </a>
          </>
        )}
      </div>
    );
  }

  // Rota pública: renderiza sem AppLayout (header, menu)
  if (isPublicRoute(pathname)) {
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
