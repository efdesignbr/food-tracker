import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Public routes that don't need authentication
  const isPublic = ['/login', '/signup', '/api/auth'].some((route) =>
    pathname.startsWith(route)
  );

  if (isPublic) return NextResponse.next();

  // Align cookie check with auth.ts configuration and NextAuth defaults
  const sessionCookieNames = [
    '__Secure-next-auth.session-token', // configured in auth.ts
    'next-auth.session-token',          // non-secure variant (dev)
    '__Secure-authjs.session-token',    // NextAuth v5 default (secure)
    'authjs.session-token',             // NextAuth v5 default
  ];

  const hasSession = sessionCookieNames.some((name) => req.cookies.get(name)?.value);

  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', req.url);
  const cb = `${pathname}${search || ''}`;
  loginUrl.searchParams.set('callbackUrl', cb);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Apply to all routes except static assets and Next internals
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|apple-touch-icon.png|apple-touch-icon-precomposed.png|icon-.*|workbox-.*|service-worker.js).*)'
  ]
};
