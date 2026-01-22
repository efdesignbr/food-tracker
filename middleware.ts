import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // --- CORS HANDLING FOR API ROUTES ---
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin') || '';
    
    // Handle Preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
      const res = new NextResponse(null, { status: 200 });
      res.headers.set('Access-Control-Allow-Origin', origin || '*');
      res.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-ad-completed');
      res.headers.set('Access-Control-Allow-Credentials', 'true');
      return res;
    }

    // --- AUTH TOKEN VALIDATION & HEADER INJECTION ---
    const authHeader = req.headers.get('authorization');
    const requestHeaders = new Headers(req.headers);

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const secretStr = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-dev';
        const secret = new TextEncoder().encode(secretStr);
        const { payload } = await jwtVerify(token, secret);

        if (payload.userId) {
          requestHeaders.set('x-user-id', payload.userId as string);
          requestHeaders.set('x-user-email', payload.email as string);
          requestHeaders.set('x-user-role', payload.role as string);
          requestHeaders.set('x-tenant-id', payload.tenantId as string);
          if (payload.tenantSlug) requestHeaders.set('x-tenant-slug', payload.tenantSlug as string);
        }
      } catch (e) {
        console.error('Middleware token error:', e);
      }
    }

    // Handle Simple Requests (passando headers injetados)
    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
    
    res.headers.set('Access-Control-Allow-Origin', origin || '*');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-ad-completed');
    
    return res;
  }
  // -------------------------------------

  // Public routes that don't need authentication
  const isPublic = ['/login', '/signup', '/forgot-password', '/reset-password', '/api/auth'].some((route) =>
    pathname.startsWith(route)
  );

  if (isPublic) return NextResponse.next();

  // Align cookie check with auth.ts configuration and NextAuth defaults
  const sessionCookieNames = [
    '__Secure-authjs.session-token',    // NextAuth v5 default (secure)
    'authjs.session-token',             // NextAuth v5 default
    '__Secure-next-auth.session-token', // legacy/previous custom name
    'next-auth.session-token',          // legacy non-secure variant (dev)
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
