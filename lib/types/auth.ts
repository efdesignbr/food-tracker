import { Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';

/**
 * Extended User type with tenant information
 */
export interface AppUser extends User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  tenantSlug: string;
  role: 'owner' | 'admin' | 'member';
}

/**
 * Extended JWT token with tenant and user information
 */
export interface AppJWT extends JWT {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  role: 'owner' | 'admin' | 'member';
}

/**
 * Extended Session with tenant and user information
 */
export interface AppSession extends Session {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  role: 'owner' | 'admin' | 'member';
}

/**
 * Type guard to check if a session is an AppSession
 */
export function isAppSession(session: Session | null): session is AppSession {
  return !!(
    session &&
    'userId' in session &&
    'tenantId' in session &&
    'tenantSlug' in session &&
    'role' in session &&
    typeof (session as any).userId === 'string' &&
    typeof (session as any).tenantId === 'string' &&
    typeof (session as any).tenantSlug === 'string' &&
    typeof (session as any).role === 'string'
  );
}

/**
 * Type guard to check if a user is an AppUser
 */
export function isAppUser(user: User | unknown): user is AppUser {
  return !!(
    user &&
    typeof user === 'object' &&
    'id' in user &&
    'tenantId' in user &&
    'tenantSlug' in user &&
    'role' in user
  );
}

/**
 * Type guard to check if a token is an AppJWT
 */
export function isAppJWT(token: JWT): token is AppJWT {
  return !!(
    token &&
    'userId' in token &&
    'tenantId' in token &&
    'tenantSlug' in token &&
    'role' in token
  );
}

/**
 * Extract session data with type safety
 * Returns null if session is not valid AppSession
 */
export function getSessionData(session: Session | null): AppSession | null {
  if (!isAppSession(session)) {
    return null;
  }
  return session;
}
