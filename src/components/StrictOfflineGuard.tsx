import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';

interface StrictOfflineGuardProps {
  children?: React.ReactNode;
}

/**
 * Robust network probe:
 * 1. Checks navigator.onLine first (instant offline detection in mobile and browsers)
 * 2. Probes local server /api/ping and fallback Google gstatic endpoint
 */
async function probeConnectivity(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`/api/ping?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status === 204 || res.ok;
  } catch {
    try {
      const fallbackCtrl = new AbortController();
      const fbTimer = setTimeout(() => fallbackCtrl.abort(), 1800);
      await fetch(`https://connectivitycheck.gstatic.com/generate_204?_t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: fallbackCtrl.signal,
      });
      clearTimeout(fbTimer);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * StrictOfflineGuard:
 * When internet is disconnected:
 * - NO top buffering bar appears (completely removed per user request).
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

    // Continuous probe every 2.5s to instantly detect reconnection
    const interval = setInterval(() => checkStatus(false), 2500);

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
              <img
                src="/offline-popup.jpeg"
                alt="Low Internet Connection"
                className="w-full h-full object-contain block select-none pointer-events-none"
                loading="eager"
              />

              {/* Exact interactive touch/click hotspot positioned over the "OK" button in the uploaded image */}
              <button
                type="button"
                onClick={handleManualRetry}
                disabled={isChecking}
                className="absolute left-[22%] right-[22%] bottom-[13%] h-[9%] rounded-2xl bg-transparent active:bg-white/20 hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer focus:outline-none"
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
