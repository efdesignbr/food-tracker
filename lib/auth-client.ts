// Client-side helpers for auth/logout handling (mobile + web)

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

/** Guard flag - prevents multiple simultaneous redirect attempts */
let _isRedirecting = false;

/**
 * Performs a hard navigation to /login.html.
 * This is the ONLY method used for auth redirects on mobile (Capacitor static export).
 * Uses window.location.href which works reliably in iOS WKWebView.
 *
 * The reentrancy guard prevents multiple 401s or rapid logout calls
 * from queueing up multiple navigations.
 */
export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  if (_isRedirecting) return;

  // Don't redirect if already on a public route
  const path = window.location.pathname || '';
  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) return;

  _isRedirecting = true;
  console.log('[Auth] redirectToLogin: navigating to /login.html');
  window.location.href = '/login.html';
}

/**
 * Returns true if a redirect to login is currently in progress.
 */
export function isRedirectingToLogin(): boolean {
  return _isRedirecting;
}

export function triggerClientLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    // Remove mobile token if present
    try {
      localStorage.removeItem('auth_token');
    } catch {}

    // Mark a logout timestamp so listeners can react even within same tab
    try {
      localStorage.setItem('auth_logout_at', String(Date.now()));
    } catch {}

    // Dispatch a custom event to allow React components to react
    try {
      window.dispatchEvent(new Event('app:logout'));
    } catch {}
  } catch {}
}

export function isMobileRuntime(): boolean {
  return process.env.NEXT_PUBLIC_IS_MOBILE === 'true';
}
