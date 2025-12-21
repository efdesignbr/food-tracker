'use client';

import AppLayout from './AppLayout';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // No build mobile estático, não podemos verificar sessão no servidor.
  // A verificação de auth deve acontecer via API ou useEffect no cliente.
  // Por enquanto, renderizamos o layout assumindo sucesso, pois o middleware da API
  // vai bloquear dados se não houver token válido.
  
  return (
    <AppLayout tenantName="Food Tracker" userName="Você">
      {children}
    </AppLayout>
  );
}
