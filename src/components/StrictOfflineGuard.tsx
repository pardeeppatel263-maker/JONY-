import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, ShieldAlert, SignalZero, Smartphone } from 'lucide-react';

interface StrictOfflineGuardProps {
  children?: React.ReactNode;
}

/**
 * StrictOfflineGuard:
 * Strictly blocks all app interactions and tasks when the device is offline.
 * Tasks, video streaming, surveys, wallet sync, and payouts cannot be performed without
 * an active internet connection.
 */
export const StrictOfflineGuard: React.FC<StrictOfflineGuardProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('');

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setLastCheckedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return false;
    }

    try {
      setIsChecking(true);
      // Lightweight ping to server to confirm active data transport
      const res = await fetch(`/api/app-version?_ping=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });

      const onlineStatus = res.ok;
      setIsOnline(onlineStatus);
      setLastCheckedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return onlineStatus;
    } catch {
      // If server ping fails or times out, consider connection offline
      const fallbackStatus = typeof navigator !== 'undefined' ? navigator.onLine : false;
      setIsOnline(fallbackStatus);
      setLastCheckedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return fallbackStatus;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      // When browser signals online, perform active probe to verify real internet connectivity
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastCheckedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    checkConnectivity();

    // Periodic poll every 8 seconds if currently offline to auto-recover as soon as internet is turned on
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        setIsOnline(false);
      } else {
        checkConnectivity();
      }
    }, 8000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnectivity]);

  // When internet is disconnected, render high-priority security barrier in 100% English
  if (!isOnline) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white font-sans selection:bg-rose-500 selection:text-white">
        <div className="w-full max-w-sm bg-slate-900/95 border-2 border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-rose-950/40 text-center space-y-5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          {/* Animated Offline Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-3xl bg-rose-500/20 animate-ping opacity-60" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-white shadow-xl shadow-rose-600/30 border border-rose-400/30">
              <WifiOff className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          {/* Heading & Badge */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-wider">
              <SignalZero className="w-3.5 h-3.5" />
              <span>Internet Connection Required</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              No Internet Connection!
            </h2>
            <p className="text-sm font-semibold text-rose-300">
              Your device is currently offline
            </p>
          </div>

          {/* Core Reason Explanation */}
          <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Security Protocol:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              An active internet connection (<b>Mobile Data or Wi-Fi</b>) is strictly required to stream videos, complete surveys, verify tasks, and safely sync your wallet balance.
            </p>
            <p className="text-[10px] text-rose-300/90 font-medium">
              ⚠️ Tasks and reward credits cannot be processed while offline.
            </p>
          </div>

          {/* Troubleshooting steps */}
          <div className="text-left text-[11px] text-slate-400 space-y-2 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>How to Reconnect:</span>
            </div>
            <ul className="space-y-1.5 pl-1 text-[11px]">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                <span>Pull down your phone's notification bar and turn on <b>Mobile Data</b> or <b>Wi-Fi</b>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                <span>Ensure <b>Airplane Mode (Flight Mode)</b> is turned OFF.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                <span>Once reconnected, tap the <b>"Retry Connection"</b> button below.</span>
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => checkConnectivity()}
              disabled={isChecking}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking Internet Connection...' : 'Retry Connection'}</span>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload App</span>
            </button>
          </div>

          {lastCheckedTime && (
            <p className="text-[10px] text-slate-500 font-mono">
              Last checked: {lastCheckedTime}
            </p>
          )}
        </div>
      </div>
    );
  }

  // When online, render app normally
  return <>{children}</>;
};
