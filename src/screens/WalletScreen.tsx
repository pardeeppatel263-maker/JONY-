import React from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { Wallet, ArrowRight, ArrowUpRight, Plus, Clock, Info } from 'lucide-react';

export const WalletScreen: React.FC = () => {
  const { user, transactions, navigate } = useApp();
  const recentTransactions = transactions.slice(0, 4);

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="Wallet" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-4 max-w-md mx-auto pb-6">
          {/* Hero Blue Balance Card matching Screenshot 9 */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white p-5 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wide">
                  Total Balance
                </span>
                <div className="text-2xl font-black tracking-tight text-white mt-1">
                  ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <button
                onClick={() => navigate('withdraw')}
                className="inline-flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 px-3.5 py-1.5 rounded-full font-bold text-xs shadow-sm active:scale-95 transition-all"
              >
                <span>Withdraw</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Add Money Link */}
            <div className="mt-4 pt-3 border-t border-white/15 flex justify-between items-center text-xs">
              <span className="text-blue-100">Need more balance for tasks?</span>
              <button
                onClick={() => navigate('add_money')}
                className="text-amber-300 font-bold hover:underline inline-flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Money</span>
              </button>
            </div>
          </div>

          {/* Sub Stats Row matching Screenshot 9 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Total Earned
              </span>
              <p className="text-base font-black text-slate-900 mt-1">
                ₹{user.totalEarned.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Withdrawn
              </span>
              <p className="text-base font-black text-slate-900 mt-1">
                ₹{user.withdrawn.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Transaction History Section matching Screenshot 9 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Transaction History
              </h3>
              <button
                onClick={() => navigate('record')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.isCredit
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {tx.isCredit ? (
                        <Plus className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {tx.title}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {tx.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black ${
                        tx.isCredit ? 'text-emerald-600' : 'text-slate-700'
                      }`}
                    >
                      {tx.isCredit ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                    </span>
                    {tx.status === 'pending' && (
                      <span className="block text-[9px] font-semibold text-amber-600">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Minimum Withdrawal Info Note matching Screenshot 9 */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-[11px]">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Minimum withdrawal amount is ₹1,000</span>
          </div>
        </main>
      </div>
    </div>
  );
};
