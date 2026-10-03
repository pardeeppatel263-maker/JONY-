import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import {
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { getFormattedDayInfo, FormattedDayInfo } from '../utils/dateUtils';
import { TransactionItem } from '../types';

export const RecordScreen: React.FC = () => {
  const { transactions, paymentDeposits } = useApp();
  const [activeCategoryTab, setActiveCategoryTab] = useState<
    'all' | 'earning' | 'withdrawal' | 'purchase'
  >('all');

  // Filter by category
  const categoryFiltered = useMemo(() => {
    return transactions.filter((t) => {
      if (activeCategoryTab === 'all') return true;
      if (activeCategoryTab === 'earning') {
        return (
          t.type === 'survey_reward' ||
          t.type === 'video_reward' ||
          t.type === 'referral_reward'
        );
      }
      if (activeCategoryTab === 'withdrawal') return t.type === 'withdrawal';
      if (activeCategoryTab === 'purchase') {
        return (
          t.type === 'purchase_reward' ||
          t.type === 'purchase' ||
          t.type === 'add_money'
        );
      }
      return true;
    });
  }, [transactions, activeCategoryTab]);

  // Enrich transactions with day info
  const enrichedTransactions = useMemo(() => {
    return categoryFiltered.map((tx) => {
      const dayInfo: FormattedDayInfo = getFormattedDayInfo(tx);

      // Cross-reference with live paymentDeposits from cloud
      const matchingDeposit = paymentDeposits.find(
        (d) =>
          d.id === tx.id.replace('tx_', '') ||
          (tx.utrNumber &&
            d.utrNumber &&
            d.utrNumber.trim().toLowerCase() === tx.utrNumber.trim().toLowerCase())
      );

      let displayStatus: 'verified' | 'in_process' | 'pending' | 'failed' | 'completed' = tx.status;
      let displayTitle = tx.title;
      let displayNote = tx.note;

      if (matchingDeposit) {
        if (matchingDeposit.status === 'approved') {
          displayStatus = 'verified';
          if (!displayTitle.includes('Approved')) {
            displayTitle =
              matchingDeposit.depositType === 'plan_purchase'
                ? `VIP Level ${matchingDeposit.planLevel} (Approved & Active)`
                : `Wallet Deposit (Approved +₹${matchingDeposit.bonus || 0} Bonus)`;
          }
        } else if (matchingDeposit.status === 'rejected') {
          displayStatus = 'failed';
          displayNote = `Rejected: ${matchingDeposit.rejectionReason || 'Invalid UTR'}`;
        }
      }

      return {
        ...tx,
        dayInfo,
        displayStatus,
        displayTitle,
        displayNote,
      };
    });
  }, [categoryFiltered, paymentDeposits]);

  // Group by day categories for structured display
  const groupedSections = useMemo(() => {
    const todayList = enrichedTransactions.filter(
      (tx) => tx.dayInfo.dayCategory === 'today'
    );
    const yesterdayList = enrichedTransactions.filter(
      (tx) => tx.dayInfo.dayCategory === 'yesterday'
    );
    const earlierList = enrichedTransactions.filter(
      (tx) => tx.dayInfo.dayCategory === 'earlier'
    );

    const sections = [];
    if (todayList.length > 0) {
      const totalTodayEarnings = todayList
        .filter((t) => t.isCredit)
        .reduce((sum, t) => sum + t.amount, 0);
      sections.push({
        key: 'today',
        title: 'Today',
        badgeText: 'Today',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        items: todayList,
        totalEarnings: totalTodayEarnings,
      });
    }

    if (yesterdayList.length > 0) {
      const totalYesterdayEarnings = yesterdayList
        .filter((t) => t.isCredit)
        .reduce((sum, t) => sum + t.amount, 0);
      sections.push({
        key: 'yesterday',
        title: 'Yesterday',
        badgeText: 'Yesterday',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        items: yesterdayList,
        totalEarnings: totalYesterdayEarnings,
      });
    }

    if (earlierList.length > 0) {
      const totalEarlierEarnings = earlierList
        .filter((t) => t.isCredit)
        .reduce((sum, t) => sum + t.amount, 0);
      sections.push({
        key: 'earlier',
        title: 'Earlier Records',
        badgeText: 'Past Days',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        items: earlierList,
        totalEarnings: totalEarlierEarnings,
      });
    }

    return sections;
  }, [enrichedTransactions]);

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="Record & History" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-3.5 max-w-md mx-auto pb-8">
          {/* CATEGORY TABS: All, Earning, Withdrawal, Purchase */}
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
            {(['all', 'earning', 'withdrawal', 'purchase'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCategoryTab(tab)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                  activeCategoryTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'earning' ? 'Earning' : tab}
              </button>
            ))}
          </div>

          {/* Grouped Day Sections */}
          <div className="space-y-4">
            {groupedSections.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-1">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  No records found
                </p>
                <p className="text-[11px] text-slate-400">
                  Complete video tasks or transactions to view your activity history here.
                </p>
              </div>
            ) : (
              groupedSections.map((sec) => (
                <div key={sec.key} className="space-y-2">
                  {/* Day Header with Date & Day Badge */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sec.badgeColor}`}
                      >
                        {sec.badgeText}
                      </span>
                      <h3 className="text-xs font-black text-slate-800 tracking-tight">
                        {sec.title}
                      </h3>
                    </div>
                    {sec.totalEarnings > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        +₹{sec.totalEarnings} Earned
                      </span>
                    )}
                  </div>

                  {/* List of Transactions for this Day */}
                  <div className="space-y-2">
                    {sec.items.map((tx) => {
                      const isReferralReward = tx.type === 'referral_reward';
                      const isVideoReward = tx.type === 'video_reward';
                      const isSurveyReward = tx.type === 'survey_reward';

                      return (
                        <div
                          key={tx.id}
                          className={`bg-white rounded-2xl p-3 border transition-all shadow-xs flex items-center justify-between ${
                            tx.displayStatus === 'verified'
                              ? 'border-slate-200/90'
                              : tx.displayStatus === 'in_process'
                              ? 'border-purple-200 bg-purple-50/20 ring-1 ring-purple-300/40'
                              : tx.displayStatus === 'failed'
                              ? 'border-rose-200 bg-rose-50/20'
                              : 'border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                tx.isCredit
                                  ? isVideoReward
                                    ? 'bg-red-50 text-red-600 border border-red-200'
                                    : isReferralReward
                                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-600 border border-rose-100'
                              }`}
                            >
                              {tx.isCredit ? (
                                isVideoReward ? (
                                  <span className="text-sm font-black">▶</span>
                                ) : (
                                  <Plus className="w-4 h-4 stroke-[3]" />
                                )
                              ) : (
                                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-800 truncate">
                                  {tx.displayTitle}
                                </h4>
                              </div>

                              {tx.displayNote && (
                                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                  {tx.displayNote}
                                </p>
                              )}

                              {/* Exact Day, Date & Time */}
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 flex-wrap">
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{tx.dayInfo.displayString}</span>
                                </span>
                                {tx.orderId && (
                                  <span className="font-mono text-[9px] text-slate-400">
                                    {tx.orderId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs font-black ${
                                tx.isCredit ? 'text-emerald-600' : 'text-slate-700'
                              }`}
                            >
                              {tx.isCredit ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                            </span>

                            <span
                              className={`block text-[9px] font-bold mt-0.5 px-2 py-0.5 rounded-md ${
                                tx.displayStatus === 'verified' || tx.displayStatus === 'completed'
                                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                  : tx.displayStatus === 'in_process'
                                  ? 'text-purple-700 bg-purple-50 ring-1 ring-purple-300 font-black animate-pulse'
                                  : tx.displayStatus === 'pending'
                                  ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                  : 'text-rose-700 bg-rose-50 border border-rose-200'
                              }`}
                            >
                              {tx.displayStatus === 'verified' || tx.displayStatus === 'completed'
                                ? '✓ Approved'
                                : tx.displayStatus === 'in_process'
                                ? '⏳ In Process'
                                : tx.displayStatus === 'pending'
                                ? '⏳ Pending'
                                : '❌ Rejected'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* FIXED BOTTOM NAV */}
      <div className="shrink-0 z-30">
        <BottomNav />
      </div>
    </div>
  );
};
