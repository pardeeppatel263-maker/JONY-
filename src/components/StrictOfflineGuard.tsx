import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StrictOfflineGuardProps {
  children?: React.ReactNode;
}

export const StrictOfflineGuard: React.FC<StrictOfflineGuardProps> = ({ children }) => {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return !navigator.onLine;
    }
    return false;
  });

  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showReconnectedBadge, setShowReconnectedBadge] = useState<boolean>(false);

  // Active ping function to test real internet connectivity across APK and web
  const verifyConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    try {
      // 1. Android & browser standard captive portal check (mode: no-cors works everywhere without CORS restrictions)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      await fetch(`https://www.google.com/generate_204?t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return true;
    } catch {
      // 2. Fallback check against Firestore endpoint
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
        await fetch(`https://firestore.googleapis.com/?t=${Date.now()}`, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller2.signal,
        });
        clearTimeout(timeoutId2);
        return true;
      } catch {
        return typeof navigator !== 'undefined' ? navigator.onLine : false;
      }
    }
  }, []);

  const handleManualRetry = async () => {
    setIsChecking(true);
    const hasNet = await verifyConnectivity();
    setIsChecking(false);
    if (hasNet) {
      setIsOffline(false);
      setShowReconnectedBadge(true);
      setTimeout(() => setShowReconnectedBadge(false), 3000);
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      const hasNet = await verifyConnectivity();
      if (hasNet) {
        setIsOffline(false);
        setShowReconnectedBadge(true);
        setTimeout(() => setShowReconnectedBadge(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    verifyConnectivity().then((hasNet) => {
      if (!hasNet) {
        setIsOffline(true);
      }
    });

    // Periodic heartbeat check every 10 seconds
    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        const hasNet = await verifyConnectivity();
        setIsOffline(!hasNet);
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [verifyConnectivity]);

  return (
    <>
      {/* Reconnected temporary toast banner */}
      {showReconnectedBadge && !isOffline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <ShieldCheck className="w-4 h-4 text-emerald-200" />
          <span>✓ Back Online - Live ZoroTask Sync Active</span>
        </div>
      )}

      {/* Strict Full-Screen Offline Blocker */}
      {isOffline && (
        <div
          className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none"
          style={{ overscrollBehavior: 'none' }}
        >
          {/* Subtle dark ambient glow */}
          <div className="absolute w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-sm w-full flex flex-col items-center space-y-6">
            {/* Animated Wi-Fi Off Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-500/20 animate-pulse">
                <WifiOff className="w-12 h-12" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Status Badges */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-400 text-[11px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Internet Connection Required</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                You Are Currently Offline
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                ZoroTask operates strictly in <span className="text-emerald-400 font-bold">100% Live Online Mode</span> to keep your wallet balance, VIP daily tasks, and UPI withdrawals secure and synchronized.
              </p>
            </div>

            {/* Requirements Guidance Card */}
            <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs text-slate-300 space-y-2.5 shadow-lg">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-[11px] uppercase tracking-wide">
                <span>Please Check Your Device</span>
              </div>
              <ul className="text-[11px] space-y-1.5 text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Turn on Mobile Data (4G/5G) or connect to Wi-Fi.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Turn off Airplane Mode if enabled.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>The app will resume automatically once connected.</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleManualRetry}
                disabled={isChecking}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:brightness-110 active:scale-[0.98] text-white font-black text-xs shadow-xl shadow-rose-600/25 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Checking Internet Connection...' : 'Retry Connection Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 text-slate-400 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Reload Application</span>
              </button>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>All user balances and VIP memberships remain 100% safe.</span>
            </div>
          </div>
        </div>
      )}

      {/* Main app rendered underneath */}
      {children}
    </>
  );
};
