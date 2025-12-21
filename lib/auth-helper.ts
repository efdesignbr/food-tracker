import { auth } from '@/auth';
import { headers } from 'next/headers';
import { jwtVerify } from 'jose';

export async function getCurrentUser() {
  // 1. Tenta sessão Web (NextAuth Cookie)
  const session = await auth();
  if (session?.user) {
    return session.user;
  }

  // 2. Tenta validação manual do Token Bearer (Mobile)
  // Isso bypassa o middleware e valida o token gerado pelo mobile-login diretamente
  const h = headers();
  const authHeader = h.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const secretStr = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-dev';
      const secret = new TextEncoder().encode(secretStr);
      
      const { payload } = await jwtVerify(token, secret);
      
      if (payload.userId) {
        return {
          id: payload.userId as string,
          email: payload.email as string,
          role: payload.role as string || 'member',
          tenantId: payload.tenantId as string,
          tenantSlug: payload.tenantSlug as string,
          name: 'Mobile User', 
        };
      }
    } catch (e) {
      console.error('Auth helper token validation error:', e);
    }
  }

  return null;
}
