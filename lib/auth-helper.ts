import { auth } from '@/auth';
import { headers } from 'next/headers';

export async function getCurrentUser() {
  // 1. Tenta pegar sessão do NextAuth (Web)
  const session = await auth();
  if (session?.user) {
    return session.user;
  }

  // 2. Tenta pegar headers injetados pelo Middleware (Mobile)
  const h = headers();
  const userId = h.get('x-user-id');
  
  if (userId) {
    // Retorna objeto compatível com a sessão do NextAuth
    return {
      id: userId,
      email: h.get('x-user-email') || '',
      role: h.get('x-user-role') || 'member',
      tenantId: h.get('x-tenant-id') || '',
      tenantSlug: h.get('x-tenant-slug') || '',
      name: 'Mobile User', // Placeholder, idealmente viria do token se necessário
    };
  }

  return null;
}
