import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getPool } from './lib/db';
import { getTenantBySlug } from './lib/tenant';
import bcrypt from 'bcryptjs';
import { init } from './lib/init';
import { logger } from './lib/logger';
import type { AppUser, AppJWT, AppSession } from './lib/types/auth';
import { isAppUser } from './lib/types/auth';

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
        try {
          await init();
          const email = (creds?.email || '').toString().toLowerCase();
          const password = (creds?.password || '').toString();

          logger.debug('Login attempt', { email });

          if (!email || !password) {
            logger.debug('Missing credentials');
            return null;
          }

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

          logger.debug('User lookup result', { found: rows.length > 0 });

          const user = rows[0];
          if (!user || !user.password_hash) {
            logger.debug('No user or password hash found');
            return null;
          }

          const ok = await bcrypt.compare(password, user.password_hash);
          logger.debug('Password validation', { valid: ok });

          if (!ok) return null;

          logger.info('Login successful', { email });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tenantId: user.tenant_id,
            tenantSlug: user.tenant_slug,
            role: user.role || 'member'
          } satisfies AppUser;
        } catch (error) {
          logger.error('Error during login', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && isAppUser(user)) {
        (token as AppJWT).userId = user.id;
        (token as AppJWT).tenantId = user.tenantId;
        (token as AppJWT).tenantSlug = user.tenantSlug;
        (token as AppJWT).role = user.role || 'member';
      }
      return token;
    },
    async session({ session, token }) {
      const appToken = token as AppJWT;
      return {
        ...session,
        userId: appToken.userId,
        tenantId: appToken.tenantId,
        tenantSlug: appToken.tenantSlug,
        role: appToken.role || 'member',
      } as AppSession;
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
export const { GET, POST } = handlers;
