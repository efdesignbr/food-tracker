// Client-side helpers for auth/logout handling (mobile + web)

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

    // Dispatch a custom event to allow React components to redirect via router
    try {
      window.dispatchEvent(new Event('app:logout'));
    } catch {}
  } catch {}
}

export function isMobileRuntime(): boolean {
  return process.env.NEXT_PUBLIC_IS_MOBILE === 'true';
}

