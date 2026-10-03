import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { HomeAnnouncementModal } from '../components/modals/HomeAnnouncementModal';
import { liveWithdrawalsList } from '../data/liveWithdrawalsData';
import rewardsHeroImg from '../assets/images/rewards_hero_badge_1790931179815.jpg';
import {
  Wallet,
  ShoppingBag,
  Gift,
  ArrowUpRight,
  Receipt,
  HelpCircle,
  User,
  ArrowRight,
  TrendingUp,
  Download,
  Youtube,
  CheckCircle2,
  Clock,
  Crown,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Megaphone,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const app = useApp() as any;
  const user = app.user || { name: 'User', balance: 0 };
  const navigate = app.navigate;
  const showToast = app.showToast || console.log;
  const openVideoTask = app.openVideoTask || (() => navigate?.('mission'));
  const taskSubmissions: any[] = app.taskSubmissions || [];
  const adminSettings: any = app.adminSettings || {};
  const plans: any[] = app.plans || [];
  const refreshAppData = app.refreshAppData;
  const isRefreshing = app.isRefreshing;
  const isFreeTrialActive = app.isFreeTrialActive ?? true;
  const freeTrialHoursLeft = app.freeTrialHoursLeft ?? 48;
  const maxDailyVideos = app.maxDailyVideos || 2;
  const todayVideosWatched = app.todayVideosWatched || 0;

  // Home Screen Announcement / Notice Popup state
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(() => {
    try {
      if (adminSettings.announcementEnabled === false) return false;
      const key = `taskvibe_notice_seen_${adminSettings.announcementTitle || 'v2'}`;
      const seen = sessionStorage.getItem(key);
      return seen !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismissNotice = () => {
    setIsNoticeModalOpen(false);
    try {
      const key = `taskvibe_notice_seen_${adminSettings.announcementTitle || 'v2'}`;
      sessionStorage.setItem(key, 'true');
    } catch {}
  };

  // Pull / Slide Down to Refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 5) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    } else {
      setIsPulling(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop > 5) {
      setPullDistance(0);
      return;
    }
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      // Gentle resistance curve
      const distance = Math.min(diff * 0.45, 95);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance >= 50 && !isRefreshing && refreshAppData) {
      setPullDistance(52);
      await refreshAppData();
      setTimeout(() => setPullDistance(0), 400);
    } else {
      setPullDistance(0);
    }
  };

  // Record of all VIP member plans purchased by user (e.g., Level 1, Level 2, etc.)
  const userPurchasedIds: string[] = user.purchasedPlanIds || [];
  const activePlanIds = Array.from(
    new Set([
      ...userPurchasedIds,
      ...(user.vipLevel && user.vipLevel > 0
        ? [plans.find((p: any) => p.level === user.vipLevel)?.id || `plan_lv${user.vipLevel}`]
        : []),
    ])
  );
  const boughtPlans = plans.filter((p: any) => activePlanIds.includes(p.id) && p.level > 0);

  const isVideoPending = taskSubmissions.some((s: any) => s.status === 'pending' && s.taskType === 'youtube_video');
  const isVideoApproved = taskSubmissions.some((s: any) => s.status === 'approved' && s.taskType === 'youtube_video');

  // Compact Auto-Scrolling Live Withdrawals Feed with 850 diverse names (700-1000 range)
  const liveWithdrawals = liveWithdrawalsList;

  const [activeWithdrawalIdx, setActiveWithdrawalIdx] = useState(() =>
    Math.floor(Math.random() * liveWithdrawalsList.length)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWithdrawalIdx((prev) => (prev + 1) % liveWithdrawals.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [liveWithdrawals.length]);

  const handleDownloadApp = () => {
    try {
      const readme = `TaskVibe Mobile Official App v2.5.0\nSaved in your Mobile Device's Downloads.\nUse the web app or add to Home Screen.`;
      const blob = new Blob([readme], { type: 'application/vnd.android.package-archive' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'TaskVibe-Earning-v2.5.apk';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 2000);
      showToast('✓ APK download started!');
    } catch {
      showToast('Downloading TaskVibe APK...');
    }
  };

  const quickActions = [
    {
      id: 'purchase',
      label: 'Purchase & Earn',
      icon: ShoppingBag,
      color: 'bg-orange-50 text-orange-600 border-orange-100',
      action: () => navigate('member_plans'),
    },
    {
      id: 'video_task',
      label: 'Watch Video',
      icon: Youtube,
      color: 'bg-red-50 text-red-600 border-red-100',
      action: () => openVideoTask(),
    },
    {
      id: 'referral',
      label: 'Referral & Earn',
      icon: Gift,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      action: () => navigate('referral_earn'),
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      action: () => navigate('wallet'),
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      icon: ArrowUpRight,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      action: () => navigate('withdraw'),
    },
    {
      id: 'transactions',
      label: 'My Transactions',
      icon: Receipt,
      color: 'bg-teal-50 text-teal-600 border-teal-100',
      action: () => navigate('record'),
    },
    {
      id: 'help',
      label: 'Help Center',
      icon: HelpCircle,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
      action: () => navigate('help_center'),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      action: () => navigate('profile'),
    },
  ];

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader showHomeActions={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT WITH SLIDE/PULL DOWN TO REFRESH */}
      <div
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto overscroll-contain relative"
      >
        {/* Animated Pull-To-Refresh Top Indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div
            className="flex items-center justify-center transition-all duration-200 overflow-hidden bg-gradient-to-b from-blue-100/70 to-transparent py-2 select-none shrink-0"
            style={{ height: `${isRefreshing ? 52 : pullDistance}px` }}
          >
            <div className="flex items-center gap-2 bg-white/95 px-4 py-1.5 rounded-full shadow-md border border-blue-200 text-blue-900 text-xs font-black">
              <RefreshCw
                className={`w-4 h-4 text-blue-600 ${
                  isRefreshing ? 'animate-spin' : pullDistance >= 50 ? 'rotate-180 transition-transform' : ''
                }`}
              />
              <span>
                {isRefreshing
                  ? 'Refreshing...'
                  : pullDistance >= 50
                  ? 'Release to refresh'
                  : 'Pull down to refresh'}
              </span>
            </div>
          </div>
        )}

        <main className="p-4 space-y-4 max-w-md mx-auto pb-6">
          {/* 2-Day Free Trial / VIP Status Notice */}
          {isFreeTrialActive ? (
            <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 p-3 rounded-2xl shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/30 backdrop-blur-xs flex items-center justify-center font-black text-sm">
                  🎁
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black">2-Day Free Starter Active</span>
                    <span className="text-[9px] font-black bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded">
                      {freeTrialHoursLeft} hrs left
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-900 leading-tight">
                    Aapko 2 din tak 2 Free videos rozana milenge!
                  </p>
                </div>
              </div>
              <button
                onClick={() => openVideoTask()}
                className="bg-slate-950 text-amber-300 hover:bg-slate-900 font-black text-[10px] px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                Watch VD
              </button>
            </div>
          ) : boughtPlans.length === 0 ? (
            <div className="bg-gradient-to-r from-rose-500 to-red-600 text-white p-3 rounded-2xl shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-200 shrink-0" />
                <div>
                  <span className="text-xs font-black block">2-Day Free Trial Expired!</span>
                  <p className="text-[10px] text-rose-100">
                    Activate a VIP plan to continue earning from daily video tasks.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('member_plans')}
                className="bg-white text-rose-700 hover:bg-rose-50 font-black text-[10px] px-3 py-1.5 rounded-xl shrink-0 shadow-xs active:scale-95 cursor-pointer"
              >
                Buy VIP
              </button>
            </div>
          ) : null}

          {/* Announcement / Notice Ticker if enabled */}
          {adminSettings.announcementEnabled && (
            <div
              onClick={() => setIsNoticeModalOpen(true)}
              className="bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-900 border border-indigo-500/30 text-white p-2.5 rounded-2xl shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-400/50 transition active:scale-98"
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                <span className="p-1.5 rounded-xl bg-amber-400 text-slate-950 shrink-0 shadow-2xs">
                  <Megaphone className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.2 rounded text-amber-300 shrink-0">
                  {adminSettings.announcementTag || 'NOTICE'}
                </span>
                <span className="text-xs font-bold text-slate-200 truncate">
                  {adminSettings.announcementTitle || 'Check latest update'}
                </span>
              </div>
              <span className="text-[10px] font-black text-amber-400 hover:underline shrink-0 flex items-center gap-0.5">
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          )}

          {/* Hero Banner matching Screenshot 4 */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-4 shadow-md">
            {/* Background design elements */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute right-12 top-2 w-16 h-16 bg-amber-400/20 rounded-full blur-lg pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1.5 max-w-[62%]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-white/10 px-2 py-0.5 rounded-full inline-block">
                  Earn Everyday
                </span>
                <h2 className="text-lg font-black leading-tight text-white">
                  Welcome to <br />
                  <span className="text-amber-300">TaskVibe</span>
                </h2>
                <p className="text-[11px] text-blue-100/90 leading-snug">
                  Complete Tasks, Share Views &amp; Earn Rewards
                </p>

                <div className="pt-1.5">
                  <button
                    onClick={() => navigate('member_plans')}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-sm hover:from-amber-300 hover:to-yellow-300 active:scale-95 transition-all"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Ultra-Attractive 3D Floating Rewards Card */}
              <div className="w-28 h-28 relative flex items-center justify-center shrink-0">
                {/* Ambient Glow */}
                <div className="absolute inset-0 bg-amber-400/25 blur-xl rounded-full pointer-events-none"></div>

                {/* 3D Glassmorphic Badge with Golden Border */}
                <div className="relative w-24 h-24 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-2xl shadow-amber-500/30 transform hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer">
                  <div className="w-full h-full rounded-[14px] overflow-hidden relative bg-slate-900 border border-amber-300/40 flex flex-col items-center justify-between">
                    <img
                      src={rewardsHeroImg}
                      alt="TaskVibe Daily Rewards"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Bottom floating badge */}
                    <div className="absolute bottom-1 inset-x-1 py-0.5 px-1 bg-black/80 backdrop-blur-md rounded-md border border-amber-400/50 flex items-center justify-center gap-1 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse shrink-0" />
                      <span className="text-[9px] font-black tracking-tight text-amber-300">
                        Daily Rewards
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dual Status Cards matching Screenshot 4 */}
          <div className="grid grid-cols-2 gap-3">
            {/* Balance Card */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">
                    My Balance
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>

              <button
                onClick={() => navigate('add_money')}
                className="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-sm active:scale-95 transition-all text-center"
              >
                Add Money
              </button>
            </div>

            {/* My VIP Plans & Membership Record Card */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">
                      My VIP Plans (Membership)
                    </span>
                    <div className="text-xs font-black text-slate-900 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="truncate">
                        {boughtPlans.length > 0
                          ? `${boughtPlans.length} VIP Plan Active`
                          : 'Free Starter (LV 0)'}
                      </span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>

                {/* List of Purchased Plans (Level 1, Level 2, etc.) */}
                <div className="mt-2.5 space-y-1">
                  {boughtPlans.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {boughtPlans.map((bp) => (
                        <span
                          key={bp.id}
                          className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200"
                        >
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          <span>LV {bp.level} (₹{bp.price.toLocaleString('en-IN')})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500 block leading-tight">
                      Free Starter Plan Active. Buy VIP Plan for daily income.
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate('member_plans')}
                className="mt-3 w-full py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-[11px] rounded-lg shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{boughtPlans.length > 0 ? 'View All Plans' : 'Buy VIP Plan'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 8-Grid Quick Actions matching Screenshot 4 */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Quick Actions
            </h3>

            <div className="grid grid-cols-4 gap-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-slate-50 active:scale-95 transition-all group"
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs mb-1.5 group-hover:scale-105 transition-transform ${action.color}`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 leading-tight line-clamp-2">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Auto-Scrolling Recent Payouts Ticker (Single Sleek Bar with 30 names) */}
          <div
            onClick={() => navigate('withdraw')}
            className="cursor-pointer bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/90 rounded-2xl p-2.5 px-3 border border-emerald-200 shadow-xs flex items-center justify-between overflow-hidden hover:border-emerald-300 transition-all active:scale-98"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Pulsing Live Dot & Label */}
              <div className="flex items-center gap-1 shrink-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>LIVE</span>
              </div>

              {/* Ticker Item rotating 1-by-1 */}
              <div
                key={activeWithdrawalIdx}
                className="flex items-center gap-1.5 min-w-0 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300 truncate"
              >
                <span className="text-xs font-bold text-slate-800 truncate">
                  {liveWithdrawals[activeWithdrawalIdx].name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  ({liveWithdrawals[activeWithdrawalIdx].phone})
                </span>
                <span className="text-[9px] text-emerald-700 bg-white/90 border border-emerald-200 px-1.5 py-0.2 rounded font-medium shrink-0 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  {liveWithdrawals[activeWithdrawalIdx].method}
                </span>
              </div>
            </div>

            {/* Amount Badge (₹1,000, ₹2,000, ₹3,000) */}
            <div className="shrink-0 pl-2 flex items-center gap-1 text-right">
              <span className="text-xs font-black text-emerald-600 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full shadow-2xs">
                {liveWithdrawals[activeWithdrawalIdx].amount}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>
          </div>

          {/* Download Official App Banner */}
          <div
            onClick={handleDownloadApp}
            className="cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-3 text-white shadow-sm flex items-center justify-between hover:shadow-md transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold shadow-inner">
                <Download className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wide">
                    Download TaskVibe APK
                  </h4>
                  <span className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full">
                    Direct File
                  </span>
                </div>
                <p className="text-[10px] text-emerald-100">
                  Download to mobile File Manager &gt; Downloads
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-100 shrink-0" />
          </div>
        </main>
      </div>

      {/* FIXED BOTTOM NAV */}
      <div className="shrink-0 z-30">
        <BottomNav />
      </div>

      {/* ANNOUNCEMENT POPUP MODAL CONTROLLED BY ADMIN */}
      <HomeAnnouncementModal
        isOpen={isNoticeModalOpen}
        onClose={handleDismissNotice}
      />
    </div>
  );
};
