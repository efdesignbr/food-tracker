import { showRewardedAd } from '@/lib/ads/admob';

export type AdGuardResult = {
  response: Response;
  adShown: boolean;
  adFailed: boolean;
};

/**
 * Wraps an API request with rewarded ad logic.
 * If the API returns 403 + watch_ad_required:
 * 1. Shows a confirmation to the user
 * 2. Shows the rewarded ad
 * 3. Retries the request with x-ad-completed header
 *
 * Returns the final response along with ad status.
 */
export async function callWithAdIfRequired(
  request: (extraHeaders?: Record<string, string>) => Promise<Response>,
  opts?: { feature?: string; skipConfirmation?: boolean }
): Promise<Response> {
  console.log('[AdGuard] Starting request for feature:', opts?.feature);

  // First attempt without ad flag
  let res = await request();
  console.log('[AdGuard] First request status:', res.status);

  if (res.status !== 403) {
    console.log('[AdGuard] Not 403, returning response');
    return res;
  }

  try {
    const payload = await res.clone().json().catch(() => ({}));
    console.log('[AdGuard] 403 payload:', payload);

    if (payload?.error === 'watch_ad_required') {
      console.log('[AdGuard] watch_ad_required detected, currentPlan:', payload?.currentPlan);

      // Show confirmation unless skipped
      if (!opts?.skipConfirmation) {
        const confirmed = window.confirm(
          'Este recurso requer assistir a um anúncio curto para continuar. Deseja prosseguir?'
        );
        if (!confirmed) {
          console.log('[AdGuard] User cancelled ad');
          return new Response(JSON.stringify({ error: 'ad_cancelled' }), {
            status: 499,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Show the rewarded ad
      console.log('[AdGuard] Showing rewarded ad...');
      const adSuccess = await showRewardedAd(opts?.feature);
      console.log('[AdGuard] Ad result:', adSuccess);

      if (!adSuccess) {
        console.log('[AdGuard] Ad failed, returning 503');
        return new Response(JSON.stringify({ error: 'ad_failed' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Ad was shown successfully - retry with bypass header
      console.log('[AdGuard] Ad success, retrying with x-ad-completed header');
      const retryRes = await request({ 'x-ad-completed': '1' });
      console.log('[AdGuard] Retry response status:', retryRes.status);
      return retryRes;
    }
  } catch (e) {
    console.error('[AdGuard] Error:', e);
  }

  return res;
}

/**
 * Helper to get user-friendly error message from ad guard response
 */
export function getAdGuardErrorMessage(response: Response, json: any): string | null {
  if (response.status === 499 && json?.error === 'ad_cancelled') {
    return null; // User cancelled, no error to show
  }

  if (response.status === 503 && json?.error === 'ad_failed') {
    // Não mostrar erro ao usuário - degradar graciosamente
    // A Apple rejeita apps que mostram erros de anúncio
    return null;
  }

  if (response.status === 403) {
    if (json?.error === 'watch_ad_required') {
      return 'Anúncio indisponível no momento. Tente novamente.';
    }
    if (json?.error === 'upgrade_required') {
      return null; // Will be handled by paywall
    }
  }

  return null; // Not an ad-related error
}
