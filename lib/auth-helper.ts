import { auth } from '@/auth';
import { headers } from 'next/headers';
import { jwtVerify } from 'jose';
import type { AppSession } from '@/lib/types/auth';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // 1. Tenta sessão Web (NextAuth Cookie)
  const session = await auth() as AppSession | null;
  if (session?.userId && session?.tenantId) {
    return {
      id: session.userId,
      email: session.user?.email || '',
      name: session.user?.name || '',
      role: session.role || 'member',
      tenantId: session.tenantId,
      tenantSlug: session.tenantSlug || '',
    };
  }

  // 2. Tenta validação do Token Bearer (Mobile)
  const h = headers();
  const authHeader = h.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const secretStr = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

      if (!secretStr) {
        console.error('AUTH_SECRET not configured');
        return null;
      }

      const secret = new TextEncoder().encode(secretStr);
      const { payload } = await jwtVerify(token, secret);

      if (payload && payload.userId) {
        return {
          id: payload.userId as string,
          email: payload.email as string || '',
          name: payload.name as string || 'Mobile User',
          role: payload.role as string || 'member',
          tenantId: payload.tenantId as string,
          tenantSlug: payload.tenantSlug as string || '',
        };
      }
    } catch (e) {
      console.error('Auth helper token validation error:', e);
    }
  }

  return null;
}
