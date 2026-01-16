// Lightweight AdMob wrapper for @capacitor-community/admob v7.2.0
// Works even if the native plugin is not installed (no-ops).

import { Capacitor } from '@capacitor/core';

type AdmobModule = any;

function getEnv(name: string, fallback?: string): string | undefined {
  // No cliente, process não existe - retorna fallback direto
  return fallback;
}

// Google's official test ad unit IDs (always return test ads)
// https://developers.google.com/admob/ios/test-ads#demo_ad_units
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/2934735716';
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/1712485313';

// Production IDs (use when app is published)
const PROD_BANNER_ID = 'ca-app-pub-1018925088575422/1014553329';
const PROD_REWARDED_ID = 'ca-app-pub-1018925088575422/2438303871';

// Toggle this to false for production builds
const USE_TEST_ADS = false;

const IOS_BANNER_ID = USE_TEST_ADS ? TEST_BANNER_ID : (getEnv('NEXT_PUBLIC_ADMOB_BANNER_ID_IOS') || PROD_BANNER_ID);
const IOS_REWARDED_ID = USE_TEST_ADS ? TEST_REWARDED_ID : (getEnv('NEXT_PUBLIC_ADMOB_REWARDED_ID_IOS') || PROD_REWARDED_ID);

let admob: AdmobModule | null = null;
let BannerAdSizeEnum: any = null;
let BannerAdPositionEnum: any = null;
let initialized = false;
let attRequested = false;

async function loadAdmob(): Promise<void> {
  if (admob) return;
  try {
    const mod = await import('@capacitor-community/admob');
    admob = mod.AdMob || null;
    BannerAdSizeEnum = mod.BannerAdSize || null;
    BannerAdPositionEnum = mod.BannerAdPosition || null;
  } catch (e) {
    console.warn('[AdMob] Community plugin not available:', e);
    admob = null;
  }
}

/**
 * Solicita permissão de App Tracking Transparency (ATT) no iOS 14.5+
 * IMPORTANTE: Esta função DEVE ser chamada ANTES de inicializar o AdMob
 * para cumprir os requisitos da Apple App Store.
 */
export async function requestTrackingPermission(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (attRequested) return;

  attRequested = true;

  await loadAdmob();
  if (!admob) return;

  try {
    // Verifica se o método existe (iOS 14.5+)
    if (typeof admob.requestTrackingAuthorization === 'function') {
      console.log('[ATT] Requesting tracking authorization...');
      const result = await admob.requestTrackingAuthorization();
      console.log('[ATT] Authorization result:', result);
    } else {
      console.log('[ATT] requestTrackingAuthorization not available (possibly Android or older iOS)');
    }
  } catch (e) {
    console.warn('[ATT] requestTrackingAuthorization error (non-fatal):', e);
  }
}

export async function initAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (initialized) return;

  // IMPORTANTE: Solicita ATT ANTES de inicializar o AdMob
  await requestTrackingPermission();

  await loadAdmob();
  if (!admob) {
    initialized = true;
    return;
  }
  try {
    if (typeof admob.initialize === 'function') {
      await admob.initialize({});
    }
  } catch (e) {
    console.warn('[AdMob] init error (non-fatal):', e);
  } finally {
    initialized = true;
  }
}

export async function showTopBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[AdMob] showTopBanner: not native platform, skipping');
    return;
  }
  await initAdMob();
  if (!admob) {
    console.warn('[AdMob] showTopBanner: admob not loaded');
    return;
  }
  try {
    console.log('[AdMob] showTopBanner: calling showBanner with id:', IOS_BANNER_ID);
    await admob.showBanner({
      adId: IOS_BANNER_ID,
      adSize: BannerAdSizeEnum?.ADAPTIVE_BANNER,
      position: BannerAdPositionEnum?.TOP_CENTER,
      margin: 0,
    });
    console.log('[AdMob] showTopBanner: success');
  } catch (e) {
    console.warn('[AdMob] showTopBanner failed:', e);
  }
}

export async function hideTopBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await initAdMob();
  if (!admob) return;
  try {
    await admob.removeBanner();
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
  if (!admob) {
    console.warn('[AdMob] showRewardedAd: admob not loaded, allowing action');
    return true;
  }
  try {
    console.log('[AdMob] showRewardedAd: preparing with id:', IOS_REWARDED_ID);
    await admob.prepareRewardVideoAd({ adId: IOS_REWARDED_ID });
    console.log('[AdMob] showRewardedAd: showing...');
    await admob.showRewardVideoAd();
    console.log('[AdMob] showRewardedAd: completed successfully');
    return true;
  } catch (e) {
    console.warn('[AdMob] showRewardedAd failed:', e);
    return false;
  }
}
