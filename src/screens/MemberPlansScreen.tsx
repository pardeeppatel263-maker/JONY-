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
  Layers,
  Sparkles,
  Table,
  CreditCard,
  Youtube,
  PlayCircle,
  ShieldCheck,
  Lock,
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

  const getLevelColorBadge = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 1:
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 2:
        return 'bg-slate-200 text-slate-800 border-slate-400';
      case 3:
        return 'bg-yellow-100 text-yellow-900 border-yellow-400';
      case 4:
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 5:
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 6:
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 7:
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-300';
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
        <main className="p-4 space-y-4 max-w-md mx-auto pb-6">
          {/* Top Banner with VIP Tier & User Wallet Balance */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white p-4 shadow-sm flex items-center justify-between">
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
              <h2 className="text-base font-black leading-tight text-white drop-shadow-xs">
                VIP Membership Plans <br />
                <span className="text-amber-100">Daily Video Tasks &amp; Income</span>
              </h2>
              <p className="text-[11px] text-amber-50">
                Each candidate can purchase each level once
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner backdrop-blur-xs shrink-0">
              👑
            </div>
          </div>

          {/* ACTIVE VIP PLAN & DAILY TASKS STATUS CARD */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 rounded-xl text-amber-600">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Aapke Active Plans: {activeUserPlans.map((p) => `Level ${p.level}`).join(' + ')}
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
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                ₹{totalDailyIncome}/day
              </span>
            </div>

            {/* Video Progress Tracker */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-600" />
                <span className="text-[11px] font-bold text-slate-700">
                  Aaj Ke Video Tasks: {todayVideosWatched} / {maxDailyVideos} Done
                </span>
              </div>
              {isAllVideosDone ? (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All Done
                </span>
              ) : (
                <button
                  onClick={() => openVideoTask()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
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
                      const daysCount = parseInt(plan.validity) || (plan.level === 0 ? 2 : 365);
                      const totalValidityIncome = plan.dailyIncome * daysCount;

                      return (
                        <tr
                          key={plan.id}
                          onClick={() => !isBought && handleSelectPlan(plan)}
                          className={`transition-colors ${
                            isBought ? 'bg-emerald-50/30' : 'hover:bg-amber-50/50 cursor-pointer'
                          }`}
                        >
                          <td className="p-2 font-bold text-slate-900">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border ${getLevelColorBadge(
                                plan.level
                              )}`}
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
                          <td className="p-2 font-medium text-slate-500 text-[11px]">
                            {plan.validity}
                          </td>
                          <td className="p-2 font-black text-amber-900 bg-amber-50/50 text-[11px]">
                            ₹{totalValidityIncome.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 text-right">
                            {isBought ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                Active
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectPlan(plan);
                                }}
                                className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded shadow-2xs cursor-pointer"
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

              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[10px] text-slate-500">
                  Ek baar khareeda gaya plan dobara buy nahi kiya ja sakta.
                </span>
              </div>
            </div>
          ) : (
            /* CARDS VIEW: Rich cards with distinct Video Quotas & Direct Buy */
            <div className="space-y-3">
              {plans.map((plan) => {
                const isBought = userPurchasedIds.includes(plan.id) && plan.level > 0;
                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-2xl p-4 border transition-all relative overflow-hidden shadow-xs ${
                      isBought
                        ? 'border-emerald-400 bg-emerald-50/20 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {/* Level Tag Ribbon */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-lg border shadow-2xs ${getLevelColorBadge(
                            plan.level
                          )}`}
                        >
                          Level {plan.level}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {plan.levelTag}
                        </span>
                        {isBought && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active (Purchased)
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{plan.validity}</span>
                      </span>
                    </div>

                    {/* Pricing, Tasks, and Daily Income Grid */}
                    <div className="grid grid-cols-3 gap-2 py-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Price
                        </span>
                        <p className="text-sm font-black text-slate-900">
                          {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Daily Videos
                        </span>
                        <p className="text-sm font-black text-blue-600 flex items-center gap-1">
                          <Youtube className="w-3.5 h-3.5 text-red-600" />
                          <span>{plan.dailyMissions} Videos</span>
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          Daily Income
                        </span>
                        <p className="text-sm font-black text-emerald-600">
                          ₹{plan.dailyIncome.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Prominent Total Validity Income Banner */}
                    <div className="my-2 p-2 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200/90 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">💰</span>
                        <div>
                          <span className="text-[10px] font-bold text-amber-950 block leading-tight">
                            Total Potential Income ({plan.validity}):
                          </span>
                          <span className="text-[11px] font-black text-emerald-700">
                            ₹{plan.dailyIncome} × {parseInt(plan.validity) || (plan.level === 0 ? 2 : 365)} days
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-950 bg-amber-300/90 px-2.5 py-0.5 rounded-lg border border-amber-400 block shadow-2xs">
                          ₹{(plan.dailyIncome * (parseInt(plan.validity) || (plan.level === 0 ? 2 : 365))).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[8px] font-bold text-amber-800 uppercase block mt-0.5">
                          TOTAL INCOME
                        </span>
                      </div>
                    </div>

                    {/* Mission Details & Action Button right on card */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-600">
                        Per-Video Reward: <b>₹{plan.perMission}</b>
                      </span>

                      {isBought ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Already Active</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan(plan)}
                          className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>{plan.price === 0 ? 'Start Free' : `Buy Level ${plan.level}`}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
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
