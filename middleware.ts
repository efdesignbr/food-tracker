import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function extractTenantFromHost(host: string): string | null {
  const parts = host.split('.').filter(Boolean);
  if (parts.length > 2) return parts[0];
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Check for session cookie (NextAuth uses this)
  if (!isPublicRoute) {
    const sessionToken = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token');

    if (!sessionToken) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Set tenant header
  const host = req.headers.get('host') || '';
  const devHeader = req.headers.get('x-tenant-slug') || '';

  let tenant = devHeader;
  if (!tenant) tenant = extractTenantFromHost(host) || '';
  if (!tenant) tenant = process.env.DEFAULT_TENANT_SLUG || 'default';

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-active-tenant', tenant);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Apply to all routes except static files and _next
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'
  ]
};
