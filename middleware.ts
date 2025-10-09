import { NextResponse } from 'next/server';
import { auth } from './auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes that don't need authentication
  const isPublic = ['/login', '/signup', '/api/auth'].some((route) =>
    pathname.startsWith(route)
  );

  if (isPublic) return NextResponse.next();

  // For all other routes, require an authenticated session
  if (req.auth) return NextResponse.next();

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    // Apply to all routes except static assets and Next internals
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon-.*|manifest.json|workbox-.*|service-worker.js).*)'
  ]
};
