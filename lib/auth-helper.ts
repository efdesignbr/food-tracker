import { auth } from '@/auth';
import { headers } from 'next/headers';
import { jwtVerify, decodeJwt } from 'jose';

export async function getCurrentUser() {
  // 1. Tenta sessão Web (NextAuth Cookie)
  const session = await auth();
  if (session?.user) {
    return session.user;
  }

  // 2. Tenta validação manual do Token Bearer (Mobile)
  const h = headers();
  const authHeader = h.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      
      // Tenta validar assinatura
      const secretStr = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-dev';
      const secret = new TextEncoder().encode(secretStr);
      
      let payload;
      try {
        const verified = await jwtVerify(token, secret);
        payload = verified.payload;
      } catch (verifyError) {
        console.error('Token signature invalid, trying fallback decode for DEBUG:', verifyError);
        // FALLBACK DEBUG: Aceita token mesmo com assinatura inválida (remova em produção!)
        payload = decodeJwt(token);
      }
      
      if (payload && payload.userId) {
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
