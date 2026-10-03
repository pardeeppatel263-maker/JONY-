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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 text-white rounded-2xl w-[90%] max-w-[310px] overflow-hidden shadow-2xl border border-white/10 animate-scaleUp p-4 space-y-3">
        {/* Compact Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Megaphone className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                {tag}
              </span>
              <h4 className="text-xs font-black text-white mt-0.5 leading-snug line-clamp-1">
                {title}
              </h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Message Body */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed max-h-28 overflow-y-auto whitespace-pre-line font-medium scrollbar-thin">
          {message}
        </div>

        {/* Compact Buttons Side-by-Side */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            onClick={onClose}
            className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition text-center cursor-pointer active:scale-95"
          >
            Dismiss
          </button>
          <button
            onClick={handleAction}
            className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-[11px] shadow-sm transition text-center cursor-pointer active:scale-95 flex items-center justify-center gap-1"
          >
            <span className="truncate">{buttonText}</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
