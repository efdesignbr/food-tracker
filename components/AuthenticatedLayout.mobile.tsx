'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AppLayout from './AppLayout';
import { initAdMob, showTopBanner, hideTopBanner } from '@/lib/ads/admob';
import { api } from '@/lib/api-client';

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

    try {
      console.log('[RevenueCat] Calling logIn...');
      await Purchases.logIn({ appUserID: userId } as any);
      console.log('[RevenueCat] logIn completed');
    } catch (e: any) {
      console.log('[RevenueCat] logIn skipped or failed:', e?.message || e);
    }

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

// ─── Inline Login Form (renderizado quando não há token) ───

function InlineLoginForm({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/mobile-login', { email, password });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro no login');
      } else if (data.token) {
        localStorage.setItem('auth_token', data.token);
        onLoginSuccess(data.token);
      } else {
        setError('Erro: Token nao recebido');
      }
    } catch (e: any) {
      console.error('Erro ao fazer login:', e);
      setError('Erro ao fazer login: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      paddingTop: 'env(safe-area-inset-top)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: 32,
        backgroundColor: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        margin: 16,
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
          Food Tracker
        </h1>
        <p style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 }}>
          Faca login para continuar
        </p>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              Email
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 14,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 14,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: 12,
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: 8,
              fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/forgot-password" style={{ fontSize: 13, color: '#2196F3', textDecoration: 'none' }}>
              Esqueci minha senha
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: loading ? '#999' : '#2196F3',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, color: '#666', fontSize: 14 }}>
          Ainda nao tem conta?{' '}
          <Link href="/signup" style={{ color: '#2196F3', fontWeight: 600, textDecoration: 'none' }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Main Layout ───

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname || '';
    if (isPublicRoute(path)) return true;
    return !!localStorage.getItem('auth_token');
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  });
  const lastInitializedToken = useRef<string | null>(null);

  // Callback do login inline — atualiza state sem precisar navegar
  function handleLoginSuccess(newToken: string) {
    setToken(newToken);
    setIsAuthorized(true);
  }

  // === useEffect: Auth check + event listeners ===
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function checkAuth() {
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
        return;
      }

      setIsAuthorized(true);

      // Initialize RevenueCat & AdMob on new token
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

    checkAuth();

    // Logout events
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'auth_logout_at') {
        const t = localStorage.getItem('auth_token');
        setToken(t);
        if (!t) {
          setIsAuthorized(false);
          hideTopBanner();
          lastInitializedToken.current = null;
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
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('app:logout', onAppLogout as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app:logout', onAppLogout as EventListener);
    };
  }, [pathname]);

  // === useEffect: Banner control ===
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

  // Sem token em rota protegida: mostra login inline (sem redirect)
  if (!isAuthorized) {
    return <InlineLoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // Rota publica: renderiza sem AppLayout
  if (isPublicRoute(pathname)) {
    return (
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {children}
      </div>
    );
  }

  return (
    <AppLayout tenantName="Food Tracker" userName="Voce">
      {children}
    </AppLayout>
  );
}
