import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // --- CORS HANDLING FOR API ROUTES ---
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin') || '';
    
    // Permitir todas as origens em desenvolvimento/mobile híbrido é comum,
    // mas com credentials precisa ser explícito.
    // Como capacitor://localhost é dinâmico, vamos refletir a origem se ela existir.
    
    // Handle Preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
      const res = new NextResponse(null, { status: 200 });
      res.headers.set('Access-Control-Allow-Origin', origin || '*');
      res.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
      res.headers.set('Access-Control-Allow-Credentials', 'true');
      return res;
    }

    // Handle Simple Requests
    const res = NextResponse.next();
    res.headers.set('Access-Control-Allow-Origin', origin || '*');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    
    return res;
  }
  // -------------------------------------

  // Public routes that don't need authentication
  const isPublic = ['/login', '/signup', '/api/auth'].some((route) =>
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
    // Note: removed 'api/' from exclusion to allow CORS handling
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|apple-touch-icon.png|apple-touch-icon-precomposed.png|icon-.*|workbox-.*|service-worker.js).*)'
  ]
};
