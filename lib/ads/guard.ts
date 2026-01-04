import { showRewardedAd } from '@/lib/ads/admob';

export async function callWithAdIfRequired(
  request: (extraHeaders?: Record<string, string>) => Promise<Response>,
  opts?: { feature?: string }
): Promise<Response> {
  // First attempt without ad flag
  let res = await request();
  if (res.status !== 403) return res;

  try {
    const payload = await res.clone().json().catch(() => ({}));
    if (payload?.error === 'watch_ad_required') {
      const ok = await showRewardedAd(opts?.feature);
      if (!ok) return res; // fallback: keep original response
      // Retry with header bypass
      const headers = { 'x-ad-completed': '1' };
      return await request(headers);
    }
  } catch {
    // ignore parse errors; return original res
  }
  return res;
}

