import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';

interface StrictOfflineGuardProps {
  children?: React.ReactNode;
}

/**
 * Universal dual probe for both Web Browsers and Android APK WebViews:
 * 1. Checks navigator.onLine first
 * 2. Attempts an uncached image DNS/HTTP probe with strict timeout (works in WebView even if navigator.onLine lags)
 * 3. Probes /api/ping or Google generate_204 endpoint
 */
function probeViaImage(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      let finished = false;

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          img.src = '';
          resolve(false);
        }
      }, 1500);

      img.onload = () => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve(true);
        }
      };

      img.onerror = () => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve(false);
        }
      };

      // Uncached image request to guarantee real network activity
      img.src = `https://www.google.com/favicon.ico?_t=${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    } catch {
      resolve(false);
    }
  });
}

async function probeViaFetch(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1600);
    // If on website, /api/ping responds in <2ms
    const res = await fetch(`/api/ping?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

async function probeConnectivity(): Promise<boolean> {
  // If browser/device explicitly says offline, it's 100% offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  // Probe via real image download (fails fast with onerror when Wi-Fi/Mobile Data is off on Android)
  const imageOk = await probeViaImage();
  if (imageOk) {
    return true;
  }

  // Secondary probe via fetch
  const fetchOk = await probeViaFetch();
  return fetchOk;
}

/**
 * StrictOfflineGuard:
 * When internet is disconnected:
 * - NO top buffering bar appears.
 * - Displays the official uploaded "Low Internet Connection" full-screen blocking popup.
 * - Entire app is disabled and blocked from user interaction until internet reconnects.
 * - Automatically dismisses as soon as active internet connection is restored.
 */
export const StrictOfflineGuard: React.FC<StrictOfflineGuardProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [justReconnected, setJustReconnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async (manual: boolean = false): Promise<boolean> => {
    if (manual) setIsChecking(true);
    const active = await probeConnectivity();
    if (manual) setIsChecking(false);

    if (active) {
      if (!isOnline) {
        setJustReconnected(true);
        setTimeout(() => setJustReconnected(false), 2500);
      }
      setIsOnline(true);
      setFeedbackMsg('');
      return true;
    } else {
      setIsOnline(false);
      if (manual) {
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        setFeedbackMsg('Internet abhi connect nahi hua hai. Kripya Wi-Fi ya Mobile Data check karein.');
        feedbackTimeoutRef.current = setTimeout(() => setFeedbackMsg(''), 3000);
      }
      return false;
    }
  }, [isOnline]);

  // Lock document body scroll when offline to guarantee no function can be used
  useEffect(() => {
    if (!isOnline) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      checkStatus(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkStatus(false);

    // Continuous probe every 2s to detect disconnect/reconnect immediately on both Android APK & Web
    const interval = setInterval(() => checkStatus(false), 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [checkStatus]);

  const handleManualRetry = () => {
    checkStatus(true);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* FULL SCREEN BLOCKING OFFLINE POPUP MODAL (When offline) */}
      {!isOnline && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="No Internet Connection"
          className="fixed inset-0 z-[999999] bg-[#020617]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none touch-none animate-in fade-in duration-200"
          style={{ pointerEvents: 'all' }}
        >
          {/* Visual Container for the Uploaded Image */}
          <div className="relative w-full max-w-[380px] flex flex-col items-center">
            {/* The Uploaded Image Card */}
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-blue-950/80 border border-blue-500/30 bg-[#070e24]">
              {/* Fallback UI in case offline image takes a moment */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#091538] to-[#040817]">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-3">
                  <WifiOff className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Low Internet Connection</h3>
                <p className="text-xs text-blue-200/80 mb-6">Please check your internet connection and try again.</p>
              </div>

              <img
                src="/offline-popup.jpeg"
                alt="Low Internet Connection"
                className="relative z-10 w-full h-full object-contain block select-none pointer-events-none"
                loading="eager"
              />

              {/* Exact interactive touch/click hotspot positioned over the "OK" button in the uploaded image */}
              <button
                type="button"
                onClick={handleManualRetry}
                disabled={isChecking}
                className="relative z-20 absolute left-[20%] right-[20%] bottom-[12%] h-[12%] rounded-2xl bg-transparent active:bg-white/20 hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer focus:outline-none"
                title="Tap OK to check connection"
              >
                {isChecking && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/90 text-white rounded-lg text-xs font-semibold shadow-lg">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Checking...
                  </span>
                )}
              </button>
            </div>

            {/* Offline Feedback message if user clicks OK while still disconnected */}
            {feedbackMsg && (
              <div className="mt-3 px-4 py-2 rounded-xl bg-red-950/90 border border-red-500/40 text-red-200 text-xs font-medium text-center animate-in fade-in slide-in-from-bottom-2 duration-150 shadow-lg max-w-[340px]">
                {feedbackMsg}
              </div>
            )}

            {/* App Lock & Auto-Reconnection Indicator */}
            <div className="mt-4 flex items-center gap-2 text-slate-300 text-[11px] font-medium bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span>App functions locked &bull; Reconnecting automatically...</span>
            </div>

            {/* Manual Retry Button below for clear accessibility */}
            <button
              type="button"
              onClick={handleManualRetry}
              disabled={isChecking}
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking Connection...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Brief Reconnection Toast (when internet comes back) */}
      {justReconnected && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] bg-emerald-950/95 text-emerald-200 border border-emerald-500/40 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-4 fade-out duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Internet Connected! App functions restored.</span>
        </div>
      )}

      {/* Normal app content: completely covered and untouchable when offline */}
      <div className={`flex-1 w-full ${!isOnline ? 'pointer-events-none select-none opacity-40 filter blur-[1px]' : ''}`}>
        {children}
      </div>
    </div>
  );
};
