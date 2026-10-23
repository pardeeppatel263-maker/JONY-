import React from 'react';
import { LogOut, X, ShieldAlert, ArrowLeft } from 'lucide-react';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xs bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
      >
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Exit ZoroTask
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
          <LogOut className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 id="exit-modal-title" className="text-base font-black text-white">
            Exit ZoroTask App?
          </h3>
          <p className="text-[12px] font-semibold text-slate-300">
            क्या आप ऐप से बाहर निकलना चाहते हैं?
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            Your wallet balance, daily tasks, VIP plans, and referral earnings are 100% saved in real-time.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[10.5px] text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Progress safely synced to cloud</span>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onConfirmExit}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 active:scale-98 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Yes, Exit App / बाहर निकलें</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Stay in App / वापस जाएं</span>
          </button>
        </div>
      </div>
    </div>
  );
};
