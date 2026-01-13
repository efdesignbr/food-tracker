'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import PlanBadge from '@/components/subscription/PlanBadge';
import { useUserPlan } from '@/hooks/useUserPlan';
import { triggerClientLogout } from '@/lib/auth-client';
import { Capacitor } from '@capacitor/core';

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Início', icon: '' },
  { href: '/capture', label: 'Capturar', icon: '' },
  { href: '/history', label: 'Histórico', icon: '' },
  { href: '/peso', label: 'Peso', icon: '' },
  { href: '/lista-compras', label: 'Lista de Compras', icon: '' },
  { href: '/coach', label: 'Coach IA', icon: '' },
  { href: '/reports', label: 'Relatórios', icon: '' },
  { href: '/restaurants', label: 'Restaurantes', icon: '' },
  { href: '/meus-alimentos', label: 'Meus Alimentos', icon: '' },
  { href: '/account', label: 'Minha Conta', icon: '' }
];

export default function AppLayout({ children, tenantName, userName }: {
  children: React.ReactNode;
  tenantName?: string;
  userName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { plan, isLoading: isPlanLoading } = useUserPlan();

  async function handleLogout() {
    // Mobile: Limpa token e dispara evento de logout (navegação via router)
    if (typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
      try {
        triggerClientLogout();
      } catch {}
    }

    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error('SignOut error:', e);
    }
    router.push('/login');
    router.refresh();
  }

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(Capacitor.isNativePlatform());
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Top banner spacer (mobile only - AdMob banner height + padding) */}
      {isMobile && (
        <div style={{ height: 60, background: 'transparent' }} />
      )}
      {/* Header */}
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        paddingTop: 'env(safe-area-inset-top)', // Safe Area Support
      }}>
        <div style={{
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 56
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src="/icon-192.png"
              alt="Food Tracker"
              width={36}
              height={36}
              style={{ borderRadius: 8 }}
            />
            {!isPlanLoading && <PlanBadge plan={plan} size="sm" />}
          </Link>

          {/* Menu Button (Hamburger) */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              padding: 8,
              border: 'none',
              background: 'none',
              fontSize: 24,
              cursor: 'pointer',
              lineHeight: 1
            }}
            aria-label={showMobileMenu ? 'Fechar menu' : 'Abrir menu'}
          >
            {showMobileMenu ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div style={{
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#fff',
            padding: '8px 0'
          }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: pathname === item.href ? '#2196F3' : '#333',
                  backgroundColor: pathname === item.href ? '#E3F2FD' : 'transparent',
                  fontWeight: pathname === item.href ? 600 : 400,
                  fontSize: 16
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid #e0e0e0', margin: '8px 0' }} />
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 16,
                color: '#c62828'
              }}
            >
              <span style={{ fontSize: 20 }}></span>
              Sair
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

    </div>
  );
}
