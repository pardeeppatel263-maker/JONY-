import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Gift,
  Zap,
  Flame,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Crown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MegaBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MegaBonusModal: React.FC<MegaBonusModalProps> = ({ isOpen, onClose }) => {
  const { adminSettings, user, isLoggedIn, claimMegaBonus, navigate, showToast } = useApp();
  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimedAmount, setJustClaimedAmount] = useState<number | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  // Countdown timer calculation
  useEffect(() => {
    if (!isOpen) return;

    const calculateTimeLeft = () => {
      if (!adminSettings.megaBonusEndDate) {
        setTimeLeftStr('');
        return;
      }

      const endMs = new Date(adminSettings.megaBonusEndDate).getTime();
      const nowMs = Date.now();
      const diff = endMs - nowMs;

      if (isNaN(endMs)) {
        setTimeLeftStr('');
        return;
      }

      if (diff <= 0) {
        setTimeLeftStr('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeftStr(`${hours.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [isOpen, adminSettings.megaBonusEndDate]);

  if (!isOpen) return null;

  const isEnabled = adminSettings.megaBonusEnabled ?? true;
  const bonusAmount = adminSettings.megaBonusAmount || 100;
  const totalLimit = adminSettings.megaBonusTotalLimit || 100;
  const claimedCount = adminSettings.megaBonusClaimedCount || 0;
  const isUnlimited = totalLimit <= 0;
  const isQuotaFull = !isUnlimited && claimedCount >= totalLimit;
  const spotsLeft = isUnlimited ? null : Math.max(0, totalLimit - claimedCount);
  const percentClaimed = isUnlimited ? 0 : Math.min(100, Math.round((claimedCount / totalLimit) * 100));

  // Check if currently before start date
  const isUpcoming = Boolean(
    adminSettings.megaBonusStartDate &&
    new Date(adminSettings.megaBonusStartDate).getTime() > Date.now()
  );

  // Check if currently after end date
  const isExpired = Boolean(
    adminSettings.megaBonusEndDate &&
    new Date(adminSettings.megaBonusEndDate).getTime() < Date.now()
  );

  // Check if user already claimed
  const hasClaimed = Boolean(
    user?.mobile &&
    (adminSettings.megaBonusClaimedUsers?.includes(user.mobile) ||
     user.claimedMegaBonusAt ||
     justClaimedAmount !== null)
  );

  // VIP Eligibility
  const minVip = adminSettings.megaBonusMinVipLevel || 0;
  const userVip = user?.vipLevel || 0;
  const isVipEligible = userVip >= minVip;

  // Task completion requirement
  const requireTasks = adminSettings.megaBonusRequireTasksCompleted || false;
  const hasDoneTask = (user?.todayVideosWatched || 0) >= 1;
  const isTaskEligible = !requireTasks || hasDoneTask;

  const canClaim =
    isLoggedIn &&
    isEnabled &&
    !isUpcoming &&
    !isExpired &&
    !isQuotaFull &&
    !hasClaimed &&
    isVipEligible &&
    isTaskEligible;

  const handleClaim = async () => {
    if (!isLoggedIn) {
      showToast('Please login to claim your Mega Bonus reward!');
      onClose();
      navigate('login');
      return;
    }

    if (!canClaim || isClaiming) return;

    setIsClaiming(true);
    try {
      const res = await claimMegaBonus();
      if (res.success) {
        setJustClaimedAmount(res.amount || bonusAmount);
      } else {
        showToast(res.message);
      }
    } catch {
      showToast('Could not claim bonus. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden text-white">
        
        {/* Glow ambient background circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="relative p-5 pb-3 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                  {adminSettings.megaBonusTag || 'MEGA BONUS'}
                </span>
                {isEnabled && !isExpired && !isQuotaFull && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-white mt-0.5">
                {adminSettings.megaBonusTitle || 'Special Mega Bonus'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Main Visual Prize Card */}
          <div className="relative rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 p-4 text-slate-950 shadow-lg shadow-amber-500/20 overflow-hidden text-center">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

            <div className="relative z-10 space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                <Gift className="w-3 h-3 text-amber-400" />
                <span>Instant Wallet Cash Reward</span>
              </div>

              <div className="pt-1">
                <span className="text-4xl font-black tracking-tight text-slate-950 drop-shadow-xs">
                  ₹{bonusAmount}
                </span>
              </div>

              <p className="text-[11px] font-extrabold text-slate-900/90 max-w-xs mx-auto leading-tight">
                {adminSettings.megaBonusDescription ||
                  'Complete tasks & claim instant cash credited directly into your wallet balance!'}
              </p>
            </div>
          </div>

          {/* Quota Limit Progress Bar */}
          {!isUnlimited && (
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  Claims Limit Quota:
                </span>
                <span className="font-extrabold text-white">
                  {claimedCount} / {totalLimit}{' '}
                  <span className="text-amber-400 text-[10px]">({percentClaimed}%)</span>
                </span>
              </div>

              {/* Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isQuotaFull
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${percentClaimed}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className={isQuotaFull ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>
                  {isQuotaFull ? '⚠️ All slots taken!' : `🔥 Only ${spotsLeft} spots remaining!`}
                </span>
                <span className="text-slate-400">Limited Period</span>
              </div>
            </div>
          )}

          {/* Countdown timer (if configured) */}
          {timeLeftStr && !isExpired && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Time Remaining:
              </span>
              <span className="text-xs font-black font-mono tracking-wider text-amber-400">
                {timeLeftStr}
              </span>
            </div>
          )}

          {/* Status notices based on conditions */}
          {hasClaimed && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-2.5 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-[11px]">
                <p className="font-black">Bonus Already Claimed!</p>
                <p className="text-emerald-400/80 text-[10px]">
                  You have already received ₹{justClaimedAmount || bonusAmount} in your wallet.
                </p>
              </div>
            </div>
          )}

          {!hasClaimed && isQuotaFull && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3 flex items-center gap-2.5 text-rose-300">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-[11px]">
                <p className="font-black">Limit Reached / Quota Full</p>
                <p className="text-rose-400/80 text-[10px]">
                  All {totalLimit} claims have been claimed by members. Stay tuned for next round!
                </p>
              </div>
            </div>
          )}

          {!hasClaimed && isUpcoming && (
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-3 flex items-center gap-2.5 text-blue-300">
              <Clock className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-[11px]">
                <p className="font-black">Scheduled Mega Bonus</p>
                <p className="text-blue-400/80 text-[10px]">
                  This bonus will unlock at {adminSettings.megaBonusStartDate}.
                </p>
              </div>
            </div>
          )}

          {!hasClaimed && isExpired && (
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-3 flex items-center gap-2.5 text-slate-300">
              <Clock className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="text-[11px]">
                <p className="font-black">Bonus Campaign Ended</p>
                <p className="text-slate-400 text-[10px]">
                  This round has ended. Admin will launch a new drop soon!
                </p>
              </div>
            </div>
          )}

          {!hasClaimed && !isVipEligible && (
            <div className="rounded-2xl bg-purple-500/10 border border-purple-500/30 p-3 flex items-center justify-between text-purple-300">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-400 shrink-0" />
                <div className="text-[11px]">
                  <p className="font-black">VIP Level {minVip}+ Required</p>
                  <p className="text-purple-400/80 text-[10px]">
                    Upgrade plan to claim this exclusive bonus.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  navigate('member_plans');
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-black hover:bg-purple-500 cursor-pointer"
              >
                Upgrade
              </button>
            </div>
          )}

          {/* Action Button */}
          {hasClaimed ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('wallet');
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>View In Wallet Balance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canClaim || isClaiming}
              onClick={handleClaim}
              className={`w-full py-3.5 rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer ${
                canClaim
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-slate-950 shadow-amber-500/25 hover:brightness-110 animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-80'
              }`}
            >
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Crediting ₹{bonusAmount} to Wallet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>
                    {isQuotaFull
                      ? 'Quota Full (All Claimed)'
                      : isExpired
                      ? 'Campaign Closed'
                      : isUpcoming
                      ? 'Not Started Yet'
                      : !isVipEligible
                      ? `VIP Level ${minVip}+ Required`
                      : `CLAIM ₹${bonusAmount} INSTANT CASH NOW`}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Guarantee Footer */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Genuine Reward • Instant Balance Credit</span>
          </div>

        </div>
      </div>
    </div>
  );
};
