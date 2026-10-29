import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';

interface StrictOfflineGuardProps {
  children?: React.ReactNode;
}

/**
 * Lightweight real-world network probe.
 */
async function probeConnectivity(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    await fetch(`https://connectivitycheck.gstatic.com/generate_204?_t=${Date.now()}`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

/**
 * StrictOfflineGuard:
 * Non-blocking, zero-popup container.
 * When internet is turned off:
 * - NO intrusive modal or blocker popup appears.
 * - The entire app remains visible and accessible.
 * - Displays an elegant, animated top buffering bar (like WhatsApp "Connecting..." or Telegram "Updating...")
 *   so the user naturally sees that the app is waiting for network and buffering.
 * - Smoothly flashes green on reconnect and auto-hides.
 */
export const StrictOfflineGuard: React.FC<StrictOfflineGuardProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [justReconnected, setJustReconnected] = useState<boolean>(false);

  const checkStatus = useCallback(async () => {
    const active = await probeConnectivity();
    if (active && !isOnline) {
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 2200);
    }
    setIsOnline(active);
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => checkStatus();
    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkStatus();

    // Heartbeat probe every 3s
    const interval = setInterval(checkStatus, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkStatus]);

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* 1. Indeterminate Top Buffering Bar when offline */}
      {!isOnline && (
        <div className="sticky top-0 z-50 w-full bg-slate-900/95 text-amber-300 border-b border-amber-500/30 px-3 py-1.5 shadow-md backdrop-blur-xs flex items-center justify-between text-xs select-none animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 font-medium text-[11px]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
            <span className="line-clamp-1">
              Buffering... Waiting for active network connection
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/30">
              Offline
            </span>
          </div>
        </div>
      )}

      {/* 2. Reconnection Banner */}
      {justReconnected && (
        <div className="sticky top-0 z-50 w-full bg-emerald-900/95 text-emerald-200 border-b border-emerald-500/40 px-3 py-1.5 shadow-md backdrop-blur-xs flex items-center justify-between text-xs select-none animate-in slide-in-from-top-2 fade-out duration-300">
          <div className="flex items-center gap-2 font-bold text-[11px] text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Connected! Live server data synced.</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-400/30">
            Online
          </span>
        </div>
      )}

      {/* Normal app content: completely visible & accessible with ZERO blocking popup */}
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
};
