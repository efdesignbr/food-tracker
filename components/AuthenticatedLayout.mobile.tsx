'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from './AppLayout';
import { initAdMob, showTopBanner, hideTopBanner } from '@/lib/ads/admob';

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
  const router = useRouter();
  const pathname = usePathname();
  // Rotas públicas globais
  const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

  // Evita flash de "Carregando..." nas rotas públicas
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname || '';
    return PUBLIC_ROUTES.some(route => path.startsWith(route));
  });
  const [token, setToken] = useState<string | null>(null);
  const lastInitializedToken = useRef<string | null>(null);
  const FALLBACK_LOGIN_TIMEOUT_MS = 1500;

  useEffect(() => {
    // Rotas públicas que não precisam de auth
    const isPublic = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));

    if (typeof window === 'undefined') return;

    const currentToken = localStorage.getItem('auth_token');
    setToken(currentToken);

    if (isPublic) {
      setIsAuthorized(true);
      // Hide banner on public routes
      hideTopBanner();
      return;
    }

    if (!currentToken) {
      setIsAuthorized(false);
      // Hide banner when logged out
      hideTopBanner();
      router.replace('/login');
      // Fallback duro caso a navegação não ocorra (evita spinner "infinito")
      try {
        setTimeout(() => {
          try {
            if (typeof window !== 'undefined') {
              const now = window.location.pathname || '';
              if (!PUBLIC_ROUTES.some(route => now.startsWith(route))) {
                // Em export estático, a rota pública existe como /login.html
                window.location.replace('/login.html');
              }
            }
          } catch {}
        }, FALLBACK_LOGIN_TIMEOUT_MS);
      } catch {}
      return;
    }

    setIsAuthorized(true);

    // Inicializa RevenueCat e AdMob quando o token muda (novo login)
    if (lastInitializedToken.current !== currentToken) {
      lastInitializedToken.current = currentToken;
      const payload = decodeJwtPayload(currentToken);
      const userId = payload?.userId as string | undefined;
      if (userId) {
        initializeRevenueCat(userId);
      }
      // Apenas inicializa AdMob (banner será controlado pelo useEffect do plano)
      initAdMob();
    }
  }, [router, pathname]);

  // Controla exibição do banner baseado no plano do usuário (extraído do JWT)
  useEffect(() => {
    // Rotas públicas NUNCA mostram banner
    const isPublic = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));

    if (isPublic) {
      hideTopBanner();
      return;
    }

    // Sem token = sem banner
    const currentToken = localStorage.getItem('auth_token');
    if (!currentToken) {
      hideTopBanner();
      return;
    }

    // Extrai o plano do JWT
    const payload = decodeJwtPayload(currentToken);
    const userPlan = (payload?.plan as string) || 'free';

    // Só mostra banner para FREE
    if (userPlan === 'free') {
      showTopBanner();
    } else {
      hideTopBanner();
    }
  }, [token, pathname]);

  // Reage a mudanças no token (ex: logout por 401 ou clique em "Sair")
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'auth_logout_at') {
        const t = localStorage.getItem('auth_token');
        setToken(t);
        if (!t) {
          setIsAuthorized(false);
          hideTopBanner();
          lastInitializedToken.current = null; // Reset para re-inicializar no próximo login
          router.replace('/login');
        }
      }
    };

    const onAppLogout = () => {
      const t = localStorage.getItem('auth_token');
      setToken(t);
      if (!t) {
        setIsAuthorized(false);
        hideTopBanner();
        lastInitializedToken.current = null; // Reset para re-inicializar no próximo login
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
        paddingTop: 'env(safe-area-inset-top)',
        flexDirection: 'column',
        gap: 12
      }}>
        <div>Carregando...</div>
        {/* Link manual para garantir saída do estado de loading em caso de falha de navegação */}
        <a href="/login.html" style={{ color: '#2196F3', textDecoration: 'underline' }}>
          Ir para a tela de login
        </a>
      </div>
    );
  }

  // Se for rota pública, renderiza sem o layout do app (header, menu)
  if (PUBLIC_ROUTES.some(route => pathname?.startsWith(route))) {
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
