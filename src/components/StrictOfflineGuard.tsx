import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WifiOff, RefreshCw, ShieldAlert, SignalZero, Smartphone, CheckCircle2, ArrowRight } from 'lucide-react';
import { TaskVibeLogo } from './TaskVibeLogo';

interface StrictOfflineGuardProps {
  children?: React.ReactNode;
}

/**
 * Robust active probe to verify real-time data connectivity across Web and Android APK/Capacitor.
 * Like PhonePe, Paytm, and Dream11, it strictly blocks access to stale cached data when offline.
 */
async function probeRealInternet(): Promise<boolean> {
  // If the device hardware reports offline, it is 100% offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const isLocalOrApk =
      typeof window !== 'undefined' &&
      (window.location.protocol === 'capacitor:' ||
        window.location.hostname === 'localhost' ||
        window.location.protocol === 'file:');

    // Official zero-latency Android connectivity check endpoint used by Android OS
    const probes: Promise<any>[] = [
      fetch(`https://connectivitycheck.gstatic.com/generate_204?_t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      }),
    ];

    // On standard web / browser, also probe app server health
    if (!isLocalOrApk) {
      probes.push(
        fetch(`/api/health?_t=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        })
      );
    }

    await Promise.any(probes);
    clearTimeout(timeoutId);
    return true;
  } catch {
    clearTimeout(timeoutId);
    // CRITICAL: When probe fails, mobile data is OFF or blocked. Never fall back to navigator.onLine!
    return false;
  }
}

/**
 * StrictOfflineGuard:
 * Zero stale data policy: Exactly like PhonePe, Paytm, and Dream11, ZoroTask strictly
 * blocks all app interactions, dashboard, and wallet data whenever Mobile Data / Wi-Fi is disconnected.
 */
export const StrictOfflineGuard: React.FC<StrictOfflineGuardProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('');
  const [justReconnected, setJustReconnected] = useState<boolean>(false);
  const isCheckingRef = useRef<boolean>(false);

  const checkConnectivity = useCallback(async (manual = false): Promise<boolean> => {
    if (isCheckingRef.current && !manual) return isOnline;
    isCheckingRef.current = true;
    if (manual) setIsChecking(true);

    const nowStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLastCheckedTime(nowStr);

    const active = await probeRealInternet();
    isCheckingRef.current = false;
    if (manual) setIsChecking(false);

    if (active && !isOnline) {
      // Transition animation when coming back online
      setJustReconnected(true);
      setTimeout(() => {
        setIsOnline(true);
        setJustReconnected(false);
      }, 700);
    } else {
      setIsOnline(active);
    }

    return active;
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      checkConnectivity(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastCheckedTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    checkConnectivity();

    // Fast 2-second heartbeat probe to auto-unblock the second the user turns on Mobile Data
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
      } else {
        checkConnectivity();
      }
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnectivity]);

  // If internet is disconnected, render PhonePe / Paytm / Dream11 style full-screen security blocker
  if (!isOnline || justReconnected) {
    return (
      <div className="fixed inset-0 z-50 min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-[#0a1120] to-[#040812] text-white font-sans select-none overflow-y-auto">
        <div className="w-full max-w-sm bg-slate-900/95 border-2 border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Logo */}
          <div className="flex justify-center pb-1">
            <TaskVibeLogo size="sm" theme="dark" showSubtitle={false} />
          </div>

          {justReconnected ? (
            /* Reconnection Success Feedback */
            <div className="py-8 space-y-4 animate-in zoom-in-90 duration-300">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-emerald-400">
                  Internet Connected!
                </h3>
                <p className="text-xs text-slate-300">
                  Syncing live data from ZoroTask Cloud...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Animated Offline Icon */}
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-3xl bg-rose-500/20 animate-ping opacity-60" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-white shadow-xl shadow-rose-600/30 border border-rose-400/40">
                  <WifiOff className="w-10 h-10 animate-pulse" />
                </div>
              </div>

              {/* Heading & Badge */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-wider">
                  <SignalZero className="w-3.5 h-3.5" />
                  <span>No Internet Connection</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  इंटरनेट कनेक्शन नहीं है!
                </h2>
                <p className="text-xs font-semibold text-rose-300">
                  Your Mobile Data or Wi-Fi is turned OFF
                </p>
              </div>

              {/* Policy Explanation (PhonePe / Dream11 standard) */}
              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Security & Live Sync Protocol:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  PhonePe, Paytm aur Dream11 ki tarah, <b>ZoroTask sirf active internet par kaam karta hai</b> taaki aapka wallet balance, daily tasks aur payments hamesha 100% live aur verified rahein. Offline rehne par purana data access nahi hoga.
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span className="font-bold text-emerald-400">🔒 100% Safe:</span>
                  <span>Aapka account aur funds cloud par surakshit hain.</span>
                </div>
              </div>

              {/* Troubleshooting steps */}
              <div className="text-left text-[11px] text-slate-400 space-y-2 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kaise connect karein:</span>
                </div>
                <ul className="space-y-1.5 pl-1 text-[11px]">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                    <span>Phone ka notification drawer niche karke <b>Mobile Data</b> ya <b>Wi-Fi</b> chalu karein.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                    <span>Dekhein ki <b>Flight Mode (Airplane Mode)</b> band ho.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                    <span>Internet aate hi app <b>apne aap</b> khul jayega, ya niche button dabayein.</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => checkConnectivity(true)}
                  disabled={isChecking}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking Internet Connection...' : 'Retry Connection (पुनः प्रयास करें)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload App</span>
                </button>
              </div>

              {lastCheckedTime && (
                <p className="text-[10px] text-slate-500 font-mono">
                  Last checked: {lastCheckedTime} &bull; Auto-detecting every 2s
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // When active internet is verified, render the live application
  return <>{children}</>;
};
