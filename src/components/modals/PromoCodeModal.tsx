import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Ticket,
  X,
  Sparkles,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Gift,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromoCodeModal: React.FC<PromoCodeModalProps> = ({ isOpen, onClose }) => {
  const {
    promoCodes,
    redeemPromoCode,
    adminSettings,
    user,
    isLoggedIn,
    showToast,
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const normalizePhone = (p?: string | null) => {
    const digits = (p || '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };
  const userMobileClean = normalizePhone(user.mobile);

  // Active codes that user has not yet redeemed
  const availableCodes = promoCodes.filter(
    (p) =>
      p.isActive &&
      p.usedCount < p.usageLimit &&
      !p.usedByUsers.some((u) => normalizePhone(u) === userMobileClean)
  );

  const handleApply = async (codeToUse?: string) => {
    const code = (codeToUse || inputCode).trim().toUpperCase();
    if (!code) {
      setFeedback({ type: 'error', message: 'Please enter a promo code.' });
      return;
    }

    if (!isLoggedIn) {
      setFeedback({ type: 'error', message: 'Please log in first to redeem codes.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await redeemPromoCode(code);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || `🎉 ₹${res.rewardAmount} credited to your wallet!`,
        });
        setInputCode('');
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Failed to redeem promo code.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasteCode = (code: string) => {
    setInputCode(code);
    setFeedback(null);
  };

  const telegramLink =
    adminSettings.supportTelegram || 'https://t.me/ZoroTaskSupport';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 text-white rounded-2xl w-full max-w-[340px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-white/10 animate-scaleUp">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Gift className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-1.5 leading-tight">
                Redeem Gift Voucher
                <Sparkles className="w-3 h-3 text-amber-400" />
              </h3>
              <p className="text-[10px] text-slate-300 font-medium">
                Enter code for instant wallet cash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto scrollbar-thin flex-1">
          {/* Telegram Channel Highlight Box */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-blue-500 text-white flex items-center justify-center">
                  <Send className="w-2.5 h-2.5" />
                </span>
                <span className="text-[11px] font-black text-blue-300">
                  Daily Free Codes on Telegram
                </span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Official
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
              We drop exclusive gift vouchers with ₹10 to ₹100 cash rewards on our Telegram channel every single day!
            </p>
            <a
              href={telegramLink}
              target="_blank"
              rel="noreferrer"
              className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <span>Join Telegram Channel</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Code Input Form */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Enter Promo Voucher Code</span>
              <span className="text-[9px] text-amber-400 font-semibold">Caps-friendly</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setFeedback(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApply();
                }}
                placeholder="e.g. WELCOME50"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono font-bold tracking-wider placeholder:text-slate-500 placeholder:normal-case placeholder:font-sans focus:outline-none transition pr-10"
              />
              {inputCode && (
                <button
                  type="button"
                  onClick={() => setInputCode('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] font-medium flex items-start gap-2 animate-fadeIn ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="leading-tight">{feedback.message}</div>
              </div>
            )}

            <button
              onClick={() => handleApply()}
              disabled={isSubmitting || !inputCode.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Claim Cash Reward</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </>
              )}
            </button>
          </div>

          {/* Quick Active Codes Available to User */}
          {availableCodes.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Ticket className="w-3 h-3 text-amber-400" />
                  Available Free Codes
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">
                  Tap to apply
                </span>
              </div>
              <div className="space-y-1.5">
                {availableCodes.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 hover:border-amber-500/40 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-amber-400 tracking-wider">
                          {item.code}
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          +₹{item.rewardAmount}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">
                        {item.description || 'Special gift voucher code'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        handlePasteCode(item.code);
                        handleApply(item.code);
                      }}
                      className="py-1 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-[10px] shrink-0 transition shadow-xs cursor-pointer"
                    >
                      Redeem
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-400 shrink-0">
          Each promo voucher can only be used once per account.
        </div>
      </div>
    </div>
  );
};
