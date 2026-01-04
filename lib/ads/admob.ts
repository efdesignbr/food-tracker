// Lightweight AdMob wrapper with safe fallbacks.
// Works even if the native plugin is not installed (no-ops).

import { Capacitor } from '@capacitor/core';

type AdmobModule = any;

function getEnv(name: string, fallback?: string): string | undefined {
  const v = (process as any).env?.[name];
  return v || fallback;
}

const IOS_APP_ID = getEnv('NEXT_PUBLIC_ADMOB_APP_ID_IOS', 'ca-app-pub-1018925088575422~2172895788');
const IOS_BANNER_ID = getEnv('NEXT_PUBLIC_ADMOB_BANNER_ID_IOS', 'ca-app-pub-1018925088575422/1014553329');
const IOS_REWARDED_ID = getEnv('NEXT_PUBLIC_ADMOB_REWARDED_ID_IOS', 'ca-app-pub-1018925088575422/2438303871');

let admob: AdmobModule | null = null;
let initialized = false;

async function loadAdmob(): Promise<void> {
  if (admob) return;
  try {
    const mod = await import('@capacitor-community/admob');
    admob = (mod as any).AdMob;
  } catch (e) {
    console.warn('[AdMob] Community plugin not available:', e);
    admob = null;
  }
}

export async function initAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (initialized) return;
  await loadAdmob();
  if (!admob) {
    initialized = true;
    return;
  }
  try {
    // Some versions of the community plugin don't require appId here.
    await admob.initialize({ requestTrackingAuthorization: true });
  } catch (e) {
    console.warn('[AdMob] init error (non-fatal):', e);
  } finally {
    initialized = true;
  }
}

export async function showTopBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await initAdMob();
  if (!admob) return;
  try {
    if (typeof admob.showBannerAd === 'function') {
      await admob.showBannerAd({ adId: IOS_BANNER_ID, position: 'TOP_CENTER' });
    } else if (typeof admob.showBanner === 'function') {
      await admob.showBanner({ adId: IOS_BANNER_ID, position: 'TOP_CENTER' });
    }
  } catch (e) {
    console.warn('[AdMob] showTopBanner failed:', e);
  }
}

export async function hideTopBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await initAdMob();
  if (!admob) return;
  try {
    if (typeof admob.removeBannerAd === 'function') {
      await admob.removeBannerAd();
    } else if (typeof admob.removeBanner === 'function') {
      await admob.removeBanner();
    }
  } catch (e) {
    console.warn('[AdMob] hideTopBanner failed:', e);
  }
}

export async function showRewardedAd(feature?: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[AdMob] Not native, simulating rewarded ad for dev');
    return true;
  }
  await initAdMob();
  if (!admob) return true; // graceful success to avoid blocking
  try {
    if (typeof admob.showRewardedAd === 'function') {
      await admob.showRewardedAd({ adId: IOS_REWARDED_ID });
      return true;
    }
    if (typeof admob.showRewardVideoAd === 'function') {
      await admob.showRewardVideoAd({ adId: IOS_REWARDED_ID });
      return true;
    }
    console.warn('[AdMob] No rewarded method available');
    return false;
  } catch (e) {
    console.warn('[AdMob] showRewardedAd failed:', e);
    return false;
  }
}
