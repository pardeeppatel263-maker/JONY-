import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Sparkles, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, hideToast } = useApp();

  if (!toastMessage) return null;

  const isError =
    toastMessage.startsWith('❌') ||
    toastMessage.toLowerCase().includes('delete') ||
    toastMessage.toLowerCase().includes('suspend') ||
    toastMessage.toLowerCase().includes('error') ||
    toastMessage.toLowerCase().includes('galat');

  const isWarning =
    toastMessage.startsWith('⚠️') ||
    toastMessage.toLowerCase().includes('slow') ||
    toastMessage.toLowerCase().includes('offline') ||
    toastMessage.toLowerCase().includes('warning') ||
    toastMessage.toLowerCase().includes('check');

  const isSuccess =
    toastMessage.startsWith('✓') ||
    toastMessage.toLowerCase().includes('success') ||
    toastMessage.toLowerCase().includes('safal') ||
    toastMessage.toLowerCase().includes('copied');

  // Clean decorative emoji prefix if already rendered by icon
  const cleanMessage = toastMessage.replace(/^[❌⚠️✓ℹ️]\s*/, '');

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[999999] w-[calc(100vw-2rem)] max-w-md pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <div
        onClick={hideToast}
        className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl border transition-all cursor-pointer ${
          isError
            ? 'bg-slate-950/95 border-rose-500/60 shadow-rose-950/50 text-rose-50'
            : isWarning
              ? 'bg-slate-950/95 border-amber-500/60 shadow-amber-950/50 text-amber-50'
              : isSuccess
                ? 'bg-slate-950/95 border-emerald-500/60 shadow-emerald-950/50 text-emerald-50'
                : 'bg-slate-950/95 border-indigo-500/60 shadow-indigo-950/50 text-slate-100'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="shrink-0 mt-0.5">
            {isError ? (
              <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            ) : isWarning ? (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            ) : isSuccess ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Full Message Text without line clamping or cutoffs */}
          <div className="flex-1 min-w-0 pr-1">
            <p className="text-xs sm:text-[13px] font-semibold leading-relaxed break-words whitespace-pre-line">
              {cleanMessage}
            </p>
          </div>

          {/* Close / Dismiss Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              hideToast?.();
            }}
            aria-label="Close notification"
            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ambient indicator accent line at bottom */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-0.5 ${
            isError
              ? 'bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600'
              : isWarning
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600'
                : isSuccess
                  ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600'
                  : 'bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-600'
          }`}
        />
      </div>
    </div>
  );
};
