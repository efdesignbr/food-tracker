export type Role = 'owner' | 'admin' | 'member';

export function requireRole(userRole: Role | undefined, allowed: Role[]): void {
  if (!userRole || !allowed.includes(userRole)) {
    throw new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }
}

