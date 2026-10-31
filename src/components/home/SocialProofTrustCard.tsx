import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { liveWithdrawalsList } from '../../data/liveWithdrawalsData';

const PaymentBrandBadge: React.FC<{ method: string; size?: number }> = ({ method }) => {
  const m = method.toLowerCase();
  if (m.includes('phonepe')) {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
        <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
        <span>PhonePe</span>
      </span>
    );
  }
  if (m.includes('gpay')) {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
        <span>GPay</span>
      </span>
    );
  }
  if (m.includes('paytm')) {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
        <span>Paytm</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
      <span>UPI Fast</span>
    </span>
  );
};

export const SocialProofTrustCard: React.FC = () => {
  const { navigate, user } = useApp();

  // Pick a revolving window of 4 recent withdrawals
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!liveWithdrawalsList || liveWithdrawalsList.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % liveWithdrawalsList.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const total = liveWithdrawalsList.length || 1;
  const item1 = liveWithdrawalsList[currentIdx % total];
  const item2 = liveWithdrawalsList[(currentIdx + 1) % total];
  const item3 = liveWithdrawalsList[(currentIdx + 2) % total];

  const recentItems = [
    { ...item1, time: 'Just now' },
    { ...item2, time: '22s ago' },
    { ...item3, time: '58s ago' },
  ].filter(Boolean);

  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white p-4 shadow-xl border border-indigo-500/20 relative overflow-hidden space-y-4">
      {/* Background ambient lighting */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* TOP HEADER: Trust & Verification Badges */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          {/* Pulsing Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Payouts</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>₹2,48,500+ Paid Today</span>
          </div>
        </div>

        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>NPCI 100% Verified</span>
        </span>
      </div>

      {/* RECENT WITHDRAWALS LIVE FEED */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="font-bold flex items-center gap-1 text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real-time Transferred to Users:</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">Instant UPI</span>
        </div>

        <div className="space-y-1.5">
          {recentItems.map((item, index) => (
            <div
              key={`${item.phone}-${index}`}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-2.5 px-3 flex items-center justify-between transition-all duration-300 backdrop-blur-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                  {item.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-black text-white truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({item.phone})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Disbursed via</span>
                    <PaymentBrandBadge method={item.method} />
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <span className="text-xs font-black text-emerald-400 block tracking-tight font-mono">
                  +{item.amount}
                </span>
                <span className="text-[9px] text-slate-400 flex items-center justify-end gap-0.5 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{item.time}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STATS STRIP: PROOF & COMMUNITY */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center relative z-10">
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <span className="text-xs font-black text-white block">14,850+</span>
          <span className="text-[9px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
            <Users className="w-2.5 h-2.5 text-blue-400" />
            <span>Active Earners</span>
          </span>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <span className="text-xs font-black text-emerald-400 block">₹4.8 Cr+</span>
          <span className="text-[9px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
            <Award className="w-2.5 h-2.5 text-amber-400" />
            <span>Paid Out</span>
          </span>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <span className="text-xs font-black text-amber-300 block">99.8%</span>
          <span className="text-[9px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>Instant UPI</span>
          </span>
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="relative z-10 pt-1">
        <button
          onClick={() => navigate('withdraw')}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <span>Withdraw My Earnings (Balance: ₹{user.balance.toFixed(2)})</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
