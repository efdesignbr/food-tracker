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

        const host = req.headers.get('host') || '';
        let tenantSlug = (creds?.tenant as string) || req.headers.get('x-active-tenant') || req.headers.get('x-tenant-slug') || '';
        if (!tenantSlug && host) {
          const parts = host.split('.').filter(Boolean);
          if (parts.length > 2) tenantSlug = parts[0];
        }
        if (!tenantSlug) tenantSlug = process.env.DEFAULT_TENANT_SLUG || 'default';

        const tenant = await getTenantBySlug(tenantSlug);
        if (!tenant) return null;

        const pool = getPool();
        const client = await pool.connect();
        let user: any;
        try {
          await client.query('BEGIN');
          await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenant.id]);
          const { rows } = await client.query(
            'select id, email, name, password_hash, role from users where email = $1 and tenant_id = $2 limit 1',
            [email, tenant.id]
          );
          user = rows[0];
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
        if (!user || !user.password_hash) return null;
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: tenant.id,
          tenantSlug,
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
