import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getPool } from './lib/db';
import { getTenantBySlug } from './lib/tenant';
import bcrypt from 'bcryptjs';
import { init } from './lib/init';

const config: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        tenant: { label: 'Tenant', type: 'text' },
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (creds, req) => {
        await init();
        const email = (creds?.email || '').toString().toLowerCase();
        const password = (creds?.password || '').toString();
        if (!email || !password) return null;

        const pool = getPool();

        // Busca o usuário e tenant pelo email (sem RLS)
        const { rows } = await pool.query(
          `select u.id, u.email, u.name, u.password_hash, u.role, u.tenant_id, t.slug as tenant_slug
           from users u
           join tenants t on t.id = u.tenant_id
           where u.email = $1
           limit 1`,
          [email]
        );

        const user = rows[0];
        if (!user || !user.password_hash) return null;

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenant_id,
          tenantSlug: user.tenant_slug,
          role: user.role || 'member'
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        token.tenantId = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
        token.role = (user as any).role || 'member';
      }
      return token as any;
    },
    async session({ session, token }) {
      (session as any).userId = (token as any).userId;
      (session as any).tenantId = (token as any).tenantId;
      (session as any).tenantSlug = (token as any).tenantSlug;
      (session as any).role = (token as any).role || 'member';
      return session;
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
export const { GET, POST } = handlers;
