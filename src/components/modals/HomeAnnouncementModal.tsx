import React from 'react';
import { useApp } from '../../context/AppContext';
import { Megaphone, X, ArrowRight, Sparkles, Check, BellRing } from 'lucide-react';

interface HomeAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HomeAnnouncementModal: React.FC<HomeAnnouncementModalProps> = ({ isOpen, onClose }) => {
  const { adminSettings, navigate } = useApp();

  if (!isOpen || !adminSettings.announcementEnabled) return null;

  const title = adminSettings.announcementTitle || 'System Announcement';
  const message =
    adminSettings.announcementMessage ||
    'Welcome to the updated TaskVibe application! Complete your daily video tasks to earn real rewards.';
  const tag = adminSettings.announcementTag || 'NEW UPDATE';
  const buttonText = adminSettings.announcementButtonText || 'Check VIP Plans ⭐';
  const action = adminSettings.announcementButtonAction || 'member_plans';
  const dateStr = adminSettings.announcementDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const handleAction = () => {
    onClose();
    if (action === 'member_plans') {
      navigate('member_plans');
    } else if (action === 'referral_earn') {
      navigate('referral_earn');
    } else if (action === 'wallet') {
      navigate('wallet');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-white/10 animate-scaleUp flex flex-col max-h-[85vh]">
        {/* Top Header Card with Sparkles Banner */}
        <div className="relative p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white shrink-0 overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-white/20 backdrop-blur-xs text-amber-300 shadow-inner">
                <BellRing className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                  {tag}
                </span>
                <span className="text-[10px] text-blue-200 block mt-0.5">{dateStr}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-base font-black text-white mt-3 leading-snug relative z-10">
            {title}
          </h3>
        </div>

        {/* Message Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-white/5 space-y-2">
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-medium">
              {message}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Official TaskVibe Announcement</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-2 border-t border-slate-800 space-y-2 shrink-0 bg-slate-950">
          <button
            onClick={handleAction}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-xs transition active:scale-95 cursor-pointer"
          >
            Dismiss / Got It
          </button>
        </div>
      </div>
    </div>
  );
};
