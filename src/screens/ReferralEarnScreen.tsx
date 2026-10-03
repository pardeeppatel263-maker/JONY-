import React from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import {
  Copy,
  Share2,
  Users,
  Gift,
  Check,
  Sparkles,
  Award,
  TrendingUp,
  Percent,
  PlayCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const ReferralEarnScreen: React.FC = () => {
  const { user, copyText, showToast, registeredUsers, setIsTeamModalOpen } = useApp();
  const referralCode = user.referralCode || 'TV982143';
  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?invite=${referralCode}`
      : `https://taskvibe.app/?invite=${referralCode}`;

  // Calculate live team numbers
  const directTeam = registeredUsers.filter((u) => u.referredBy === referralCode);
  const directCodes = directTeam.map((u) => u.referralCode);
  const tier2Team = registeredUsers.filter((u) => u.referredBy && directCodes.includes(u.referredBy));
  const totalTeamCount = directTeam.length + tier2Team.length;

  const handleShare = () => {
    const shareMessage = `Join TaskVibe and earn daily rewards! 🎁\n\nClick my invite link to open the registration page directly with code ${referralCode} pre-filled. You get ₹100 welcome bonus immediately!\n\nLink: ${referralLink}`;

    if (navigator.share) {
      navigator
        .share({
          title: 'Join TaskVibe and Earn Daily Rewards!',
          text: shareMessage,
          url: referralLink,
        })
        .catch(() => {
          copyText(referralLink, 'Referral invite link');
        });
    } else {
      copyText(referralLink, 'Referral invite link');
      showToast('✓ Referral invite link copied! Send it on WhatsApp to invite friends.');
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="Referral & Earn" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-4 max-w-md mx-auto pb-6">
          {/* Top Banner with Commission Highlights */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-4 shadow-sm flex items-center justify-between">
            <div className="space-y-1 max-w-[65%]">
              <span className="text-[10px] uppercase font-black text-amber-300 tracking-wider">
                Multi-Tier Referral Royalty
              </span>
              <h2 className="text-base font-black leading-tight text-white">
                Invite Team <br />
                <span className="text-amber-300">Earn 4.5% + 1.6% Daily</span>
              </h2>
              <p className="text-[11px] text-blue-100">
                Plan purchase par 4.5% &amp; daily video tasks par 1.6% royalty!
              </p>
            </div>

            {/* Coin Badge */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-lg flex items-center justify-center animate-bounce">
                <div className="w-full h-full rounded-full bg-amber-400 border-2 border-yellow-200 flex flex-col items-center justify-center text-slate-950 font-black">
                  <span className="text-xs leading-none">4.5%</span>
                  <span className="text-[7px] uppercase tracking-tighter">PLAN BONUS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Team Summary */}
          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => setIsTeamModalOpen(true)}
              className="bg-white rounded-2xl p-3 border border-purple-200 shadow-xs cursor-pointer hover:border-purple-300 transition-all text-center"
            >
              <span className="text-[10px] uppercase font-bold text-purple-600 block">
                Total Team Members
              </span>
              <p className="text-xl font-black text-purple-900 mt-0.5">
                {totalTeamCount} Members
              </p>
              <span className="text-[9px] text-purple-500 underline font-medium">
                View Full Team Report →
              </span>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-emerald-200 shadow-xs text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                Referral Earnings
              </span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">
                ₹{((user.referralEarnings || 0) + (user.teamTaskEarnings || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[9px] text-emerald-600 font-medium">
                Plan &amp; Task Royalties
              </span>
            </div>
          </div>

          {/* Your Referral Code Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Aapka Unique Invite Code
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Code
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
              <span className="font-mono text-base font-black tracking-widest text-blue-700">
                {referralCode}
              </span>
              <button
                onClick={() => copyText(referralCode, 'Referral code')}
                className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 px-3 py-1 rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Each candidate has a unique invite code. New members must enter this code during registration.
            </p>
          </div>

          {/* Referral Link Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Referral Share Link
            </span>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">
                {referralLink}
              </span>
              <button
                onClick={() => copyText(referralLink, 'Referral link')}
                className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 px-3 py-1 rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0 ml-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Multi-Tier Commission Structure Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Multi-Level Commission Rules
              </h3>
            </div>

            <div className="space-y-2.5">
              {/* Level 1 Direct */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-blue-950">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>1st Person (Direct Referral)</span>
                  </div>
                  <span className="text-xs font-black text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                    4.5% + 1.6% Daily
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 leading-snug">
                  • <b>4.5% Commission:</b> Earn 4.5% whenever your direct referral purchases any VIP plan. <br />
                  • <b>1.6% Daily Task Royalty:</b> Whenever your direct referral completes daily video tasks, you receive a daily 1.6% task royalty!
                </p>
              </div>

              {/* Level 2 Friends of Friends */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-purple-950">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    <span>2nd Level (2nd Person ➔ 3rd Person)</span>
                  </div>
                  <span className="text-xs font-black text-purple-700 bg-white px-2 py-0.5 rounded-lg border border-purple-200">
                    1.5% Plan Bonus
                  </span>
                </div>
                <p className="text-[11px] text-purple-800 leading-snug">
                  • When your direct referral refers a new member, you receive a <b>1.5% plan commission</b>.
                </p>
              </div>

              {/* Level 3+ Downstream */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-emerald-950">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>3rd Level &amp; Beyond (4th Person &amp; Onwards)</span>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                    1.0% Plan Bonus
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  • For downstream members at tier 3 and beyond, earn a <b>1.0% multi-tier royalty</b> on every plan purchase!
                </p>
              </div>
            </div>
          </div>

          {/* Share Now Button */}
          <button
            onClick={handleShare}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Invite Link on WhatsApp / SMS</span>
          </button>
        </main>
      </div>

      {/* FIXED BOTTOM NAV */}
      <div className="shrink-0 z-30">
        <BottomNav />
      </div>
    </div>
  );
};
