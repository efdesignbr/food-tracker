'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from './AppLayout';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

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
    }
  }, [router, pathname]);

  if (!isAuthorized) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  }

  // Se for rota pública, renderiza sem o layout do app (header, menu)
  const publicRoutes = ['/login', '/signup'];
  if (publicRoutes.some(route => pathname?.startsWith(route))) {
    return <>{children}</>;
  }

  return (
    <AppLayout tenantName="Food Tracker" userName="Você">
      {children}
    </AppLayout>
  );
}
