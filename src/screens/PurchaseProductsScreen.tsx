import React from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { CheckCircle2, Gift, ArrowRight, Info, Sparkles, ShieldCheck } from 'lucide-react';

export const PurchaseProductsScreen: React.FC = () => {
  const { lastPurchase, navigate } = useApp();

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="Purchase Products" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-4 max-w-md mx-auto pb-6">
          {/* Top Success Banner matching Screenshot 6 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <Gift className="w-8 h-8 text-emerald-600 animate-bounce" />
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Purchase Confirmed!
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Your product purchase has been verified successfully. You are now eligible for rewards.
            </p>
          </div>

          {/* Purchase Details Card matching Screenshot 6 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Purchase Details</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 py-1 border-y border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-medium">Purchase Amount</span>
                <p className="text-base font-black text-slate-900">
                  ₹{lastPurchase.amount.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium">Reward Earned</span>
                <p className="text-base font-black text-emerald-600 flex items-center gap-1">
                  <span>₹{lastPurchase.reward}</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Order ID</span>
                <span className="font-mono font-bold text-slate-800">
                  {lastPurchase.orderId}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-500">
                <span>Status</span>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-500">
                <span>Date</span>
                <span className="font-medium text-slate-800">
                  {lastPurchase.date}
                </span>
              </div>
            </div>
          </div>

          {/* Reward Added Notice Card matching Screenshot 6 */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="p-1.5 bg-amber-400 text-slate-950 rounded-xl mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">Reward Added</h4>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-snug">
                ₹{lastPurchase.reward} has been credited to your wallet for this purchase.
              </p>
            </div>
          </div>

          {/* View Wallet Button */}
          <button
            onClick={() => navigate('wallet')}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <span>View Wallet</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Bottom Info Note matching Screenshot 6 */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-800 text-[11px] leading-tight">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              After your first purchase, you can complete daily surveys and earn more rewards.
            </span>
          </div>
        </main>
      </div>
    </div>
  );
};
