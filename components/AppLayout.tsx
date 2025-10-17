'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Início', icon: '🏠' },
  { href: '/capture', label: 'Capturar', icon: '📸' },
  { href: '/history', label: 'Histórico', icon: '📋' },
  { href: '/peso', label: 'Peso', icon: '⚖️' },
  { href: '/reports', label: 'Relatórios', icon: '📊' },
  { href: '/restaurants', label: 'Restaurantes', icon: '🍽️' },
  { href: '/meus-alimentos', label: 'Meus Alimentos', icon: '🍎' },
  { href: '/account', label: 'Minha Conta', icon: '⚙️' }
];

export default function AppLayout({ children, tenantName, userName }: {
  children: React.ReactNode;
  tenantName?: string;
  userName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push('/login');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 56
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div>
              <h1 style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: '#2196F3',
                cursor: 'pointer'
              }}>
                Food Tracker
              </h1>
              {tenantName && (
                <p style={{
                  fontSize: 10,
                  color: '#666',
                  margin: 0
                }}>
                  {tenantName}
                </p>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center'
          }}>
            <div style={{ display: 'none' }} className="desktop-nav-items">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: pathname === item.href ? '#2196F3' : '#333',
                    backgroundColor: pathname === item.href ? '#E3F2FD' : 'transparent',
                    fontWeight: pathname === item.href ? 600 : 400,
                    fontSize: 14
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                style={{
                  marginLeft: 16,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#c62828'
                }}
              >
                Sair
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                display: 'block',
                padding: 8,
                border: 'none',
                background: 'none',
                fontSize: 24,
                cursor: 'pointer'
              }}
              className="mobile-menu-btn"
            >
              {showMobileMenu ? '✕' : '☰'}
            </button>
          </nav>
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
              <span style={{ fontSize: 20 }}>🚪</span>
              Sair
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      <style jsx global>{`
        @media (min-width: 768px) {
          .desktop-nav-items {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
