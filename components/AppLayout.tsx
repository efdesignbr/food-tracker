'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Início', icon: '🏠' },
  { href: '/capture', label: 'Capturar', icon: '📸' },
  { href: '/history', label: 'Histórico', icon: '📋' },
  { href: '/reports', label: 'Relatórios', icon: '📊' }
];

export default function AppLayout({ children, tenantName, userName }: {
  children: React.ReactNode;
  tenantName?: string;
  userName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push('/login');
  }

  // Close menus when clicking outside
  useEffect(() => {
    function handleClick() {
      setShowMobileMenu(false);
      setShowUserMenu(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
          <div>
            <h1 style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              color: '#2196F3'
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

          {/* Desktop Navigation - Hidden on mobile */}
          <nav style={{
            display: 'none',
            gap: 8,
            alignItems: 'center'
          }}
          className="desktop-nav">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: pathname === item.href ? '#2196F3' : '#333',
                  backgroundColor: pathname === item.href ? '#E3F2FD' : 'transparent',
                  fontWeight: pathname === item.href ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.2s'
                }}
              >
                {item.label}
              </a>
            ))}

            {/* User Menu Desktop */}
            <div style={{ position: 'relative', marginLeft: 16 }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                {userName || 'Usuário'}
              </button>

              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  minWidth: 150
                }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#c62828',
                      borderRadius: 8
                    }}
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileMenu(!showMobileMenu);
            }}
            style={{
              display: 'none',
              padding: 8,
              border: 'none',
              background: 'none',
              fontSize: 24,
              cursor: 'pointer'
            }}
          >
            {showMobileMenu ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div
            className="mobile-menu"
            style={{
              display: 'none',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#fff',
              padding: '8px 0'
            }}
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
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
              </a>
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
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }

        @media (max-width: 767px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-menu {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
