import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { PlanItem } from '../types';
import {
  Award,
  ArrowRight,
  Zap,
  CheckCircle2,
  Crown,
  Calendar,
  Sparkles,
  Table,
  CreditCard,
  Youtube,
  PlayCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const MemberPlansScreen: React.FC = () => {
  const {
    plans,
    navigate,
    user,
    activeUserPlan,
    activeUserPlans,
    maxDailyVideos,
    totalDailyIncome,
    todayVideosWatched,
    openVideoTask,
    paymentDeposits,
    isFreeTrialActive,
    freeTrialHoursLeft,
  } = useApp();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const userPurchasedIds: string[] = user.purchasedPlanIds || [];
  const activePlanIds = Array.from(
    new Set([
      ...userPurchasedIds,
      ...(user.vipLevel && user.vipLevel > 0
        ? [plans.find((p) => p.level === user.vipLevel)?.id || `plan_lv${user.vipLevel}`]
        : []),
    ])
  );

  const boughtLevels = activePlanIds
    .filter((id) => id !== 'plan_lv0')
    .map((id) => plans.find((p) => p.id === id)?.level)
    .filter(Boolean) as number[];

  const handleSelectPlan = (plan: PlanItem) => {
    navigate('plan_detail', plan);
  };

  const getLevelTheme = (level: number) => {
    switch (level) {
      case 0:
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          gradient: 'from-slate-500 to-slate-700',
          border: 'border-slate-200',
          accent: 'text-slate-700',
        };
      case 1:
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          gradient: 'from-amber-500 to-amber-700',
          border: 'border-amber-200',
          accent: 'text-amber-700',
        };
      case 2:
        return {
          badge: 'bg-slate-200 text-slate-800 border-slate-400',
          gradient: 'from-slate-600 to-slate-800',
          border: 'border-slate-300',
          accent: 'text-slate-800',
        };
      case 3:
        return {
          badge: 'bg-yellow-100 text-yellow-900 border-yellow-400',
          gradient: 'from-yellow-500 to-amber-600',
          border: 'border-yellow-200',
          accent: 'text-yellow-800',
        };
      case 4:
        return {
          badge: 'bg-cyan-100 text-cyan-900 border-cyan-300',
          gradient: 'from-cyan-600 to-blue-700',
          border: 'border-cyan-200',
          accent: 'text-cyan-800',
        };
      case 5:
        return {
          badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          gradient: 'from-indigo-600 to-indigo-800',
          border: 'border-indigo-200',
          accent: 'text-indigo-800',
        };
      case 6:
        return {
          badge: 'bg-purple-100 text-purple-900 border-purple-300',
          gradient: 'from-purple-600 to-purple-800',
          border: 'border-purple-200',
          accent: 'text-purple-800',
        };
      case 7:
        return {
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          gradient: 'from-rose-500 to-rose-700',
          border: 'border-rose-200',
          accent: 'text-rose-800',
        };
      default:
        return {
          badge: 'bg-blue-100 text-blue-900 border-blue-300',
          gradient: 'from-blue-600 to-indigo-700',
          border: 'border-blue-200',
          accent: 'text-blue-800',
        };
    }
  };

  const isAllVideosDone = todayVideosWatched >= maxDailyVideos;

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="VIP Member Plans" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-3.5 space-y-3 max-w-md mx-auto pb-6">
          {/* Top Banner with VIP Tier & User Wallet Balance */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white p-3.5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black text-amber-950 bg-white/40 px-2 py-0.5 rounded-full tracking-wider">
                  {boughtLevels.length > 0
                    ? `Active: ${boughtLevels.map((l) => `LV ${l}`).join(', ')}`
                    : 'Active: Level 0 Free'}
                </span>
                <span className="text-[10px] font-bold text-amber-100">
                  Wallet: ₹{user.balance.toLocaleString('en-IN')}
                </span>
              </div>
              <h2 className="text-sm font-black leading-tight text-white drop-shadow-xs">
                VIP Membership Plans <br />
                <span className="text-amber-100 font-semibold text-xs">Daily Video Tasks &amp; Earnings</span>
              </h2>
              <p className="text-[10px] text-amber-100/90">
                Each candidate can purchase each level once
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shadow-inner backdrop-blur-xs shrink-0">
              👑
            </div>
          </div>

          {/* ACTIVE VIP PLAN & DAILY TASKS STATUS CARD */}
          <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-amber-50 rounded-lg text-amber-600">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Your Active Plans: {activeUserPlans.map((p) => `Level ${p.level}`).join(' + ')}
                    </span>
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md">
                      {activeUserPlans.length > 1 ? `${activeUserPlans.length} Plans Active` : activeUserPlan.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Total {maxDailyVideos} Videos Daily ({activeUserPlans.map((p) => `LV${p.level}: ${p.dailyMissions} VD @ ₹${p.perMission}`).join(' + ')})
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                ₹{totalDailyIncome}/day
              </span>
            </div>

            {/* Video Progress Tracker */}
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="w-3.5 h-3.5 text-red-600" />
                <span className="text-[11px] font-bold text-slate-700">
                  Today's Video Tasks: {todayVideosWatched} / {maxDailyVideos} Done
                </span>
              </div>
              {isAllVideosDone ? (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  All Done
                </span>
              ) : (
                <button
                  onClick={() => openVideoTask()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <PlayCircle className="w-3 h-3" />
                  <span>Start Task</span>
                </button>
              )}
            </div>
          </div>

          {/* Toggle between Card View and Rate Matrix Table */}
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>VIP Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Rate Matrix Table</span>
            </button>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800">VIP Membership Rates</h3>
                  <p className="text-[10px] text-slate-500">Official Daily Income &amp; Mission Table</p>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  8 Levels
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 border-b border-slate-200">
                      <th className="p-2">Level</th>
                      <th className="p-2">Price</th>
                      <th className="p-2">Daily</th>
                      <th className="p-2 text-center">Videos</th>
                      <th className="p-2">Validity</th>
                      <th className="p-2 font-black text-amber-700">Total Income</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {plans.map((plan) => {
                      const isBought = userPurchasedIds.includes(plan.id) && plan.level > 0;
                      const isPlanPending = paymentDeposits.some(
                        (d) =>
                          d.status === 'in_process' &&
                          d.depositType === 'plan_purchase' &&
                          (d.planLevel === plan.level || d.planTitle === plan.title)
                      );
                      const daysCount = parseInt(plan.validity) || (plan.level === 0 ? 2 : 365);
                      const totalValidityIncome = plan.dailyIncome * daysCount;
                      const theme = getLevelTheme(plan.level);

                      return (
                        <tr
                          key={plan.id}
                          onClick={() => !isBought && handleSelectPlan(plan)}
                          className={`transition-colors ${
                            isBought ? 'bg-emerald-50/30' : isPlanPending ? 'bg-amber-50/40' : 'hover:bg-amber-50/50 cursor-pointer'
                          }`}
                        >
                          <td className="p-2 font-bold text-slate-900">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black border ${theme.badge}`}
                            >
                              LV {plan.level}
                            </span>
                          </td>
                          <td className="p-2 font-bold text-slate-800">
                            {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                          </td>
                          <td className="p-2 font-bold text-emerald-600">
                            ₹{plan.dailyIncome.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 text-center font-bold text-blue-700">
                            {plan.dailyMissions} VD
                          </td>
                          <td className="p-2 font-medium text-slate-500 text-[10px]">
                            {plan.validity}
                          </td>
                          <td className="p-2 font-black text-amber-900 bg-amber-50/50 text-[10px]">
                            ₹{totalValidityIncome.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 text-right">
                            {isBought ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                Active
                              </span>
                            ) : isPlanPending ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                <Clock className="w-2.5 h-2.5 animate-spin text-amber-600" />
                                In Process
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectPlan(plan);
                                }}
                                className="text-[9px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded shadow-2xs cursor-pointer"
                              >
                                Buy
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 font-medium">
                  Each membership plan can be purchased once per candidate.
                </span>
              </div>
            </div>
          ) : (
            /* SLEEK, COMPACT, AESTHETIC VIP LEVEL CARDS SECTION */
            <div className="space-y-2.5">
              {plans.map((plan) => {
                const isBought = userPurchasedIds.includes(plan.id) && plan.level > 0;
                const isPlanPending = paymentDeposits.some(
                  (d) =>
                    d.status === 'in_process' &&
                    d.depositType === 'plan_purchase' &&
                    (d.planLevel === plan.level || d.planTitle === plan.title)
                );
                const daysCount = parseInt(plan.validity) || (plan.level === 0 ? 2 : 365);
                const totalValidityIncome = plan.dailyIncome * daysCount;
                const theme = getLevelTheme(plan.level);

                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className={`group bg-white rounded-xl p-3 border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm active:scale-[0.99] ${
                      isBought
                        ? 'border-emerald-400 bg-emerald-50/20 ring-1 ring-emerald-500/30'
                        : isPlanPending
                        ? 'border-amber-400 bg-amber-50/25 ring-1 ring-amber-400/40'
                        : 'border-slate-200/90 hover:border-amber-400'
                    }`}
                  >
                    {/* Header Row: Level + Tag + Price */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-md border shadow-2xs ${theme.badge}`}
                        >
                          LV {plan.level}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-bold text-slate-800">
                            {plan.levelTag}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {plan.validity}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">
                          {plan.price === 0 ? (
                            <span className="text-blue-600">Free</span>
                          ) : (
                            `₹${plan.price.toLocaleString('en-IN')}`
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Concise 3-Pill Key Metrics Strip */}
                    <div className="grid grid-cols-3 gap-1.5 py-2">
                      <div className="bg-slate-50/90 rounded-lg p-1.5 text-center border border-slate-100">
                        <span className="text-[9px] uppercase font-semibold text-slate-400 block">Daily Income</span>
                        <span className="text-xs font-black text-emerald-600 block mt-0.5">
                          ₹{plan.dailyIncome.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="bg-slate-50/90 rounded-lg p-1.5 text-center border border-slate-100">
                        <span className="text-[9px] uppercase font-semibold text-slate-400 block">Video Tasks</span>
                        <span className="text-xs font-black text-blue-600 flex items-center justify-center gap-1 mt-0.5">
                          <Youtube className="w-3 h-3 text-red-600" />
                          <span>{plan.dailyMissions} Videos</span>
                        </span>
                      </div>

                      <div className="bg-amber-50/60 rounded-lg p-1.5 text-center border border-amber-100">
                        <span className="text-[9px] uppercase font-semibold text-amber-700 block">Total Return</span>
                        <span className="text-xs font-black text-amber-900 block mt-0.5">
                          ₹{totalValidityIncome.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Footer Row: Per Mission + Action Button */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-[10px] font-medium text-slate-500">
                        Reward: <strong className="text-slate-700">₹{plan.perMission}/video</strong>
                      </span>

                      <div>
                        {plan.level === 0 ? (
                          isFreeTrialActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>Free Active ({freeTrialHoursLeft}h)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-300">
                              <Clock className="w-3 h-3 text-rose-600" />
                              <span>Trial Expired</span>
                            </span>
                          )
                        ) : isBought ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active Plan</span>
                          </span>
                        ) : isPlanPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700 animate-spin" />
                            <span>In Process</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 group-hover:from-amber-600 group-hover:to-amber-700 px-3 py-1 rounded-lg shadow-2xs">
                            <span>Get Level {plan.level}</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* FIXED BOTTOM NAV */}
      <div className="shrink-0 z-30">
        <BottomNav />
      </div>
    </div>
  );
};
