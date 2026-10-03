import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Info,
  Wallet,
  QrCode,
  Smartphone,
  AlertCircle,
} from 'lucide-react';

export const PlanDetailScreen: React.FC = () => {
  const {
    selectedPlan,
    plans,
    user,
    buyPlanWithWallet,
    buyPlanWithUPI,
    showToast,
    navigate,
  } = useApp();
  const plan = selectedPlan || plans[1] || plans[0];
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'upi'>('wallet');
  const [isProcessing, setIsProcessing] = useState(false);

  const isAlreadyPurchased = (user.purchasedPlanIds || []).includes(plan.id) && plan.level > 0;
  const hasEnoughWalletBalance = user.balance >= plan.price;
  const balanceDifference = plan.price - user.balance;

  const handleWalletPay = () => {
    if (isAlreadyPurchased) {
      showToast(`❌ You have already purchased ${plan.title}! Each member can buy each plan once.`);
      return;
    }
    if (plan.price === 0) {
      showToast('✓ Level 0 Free Plan already active on your account!');
      navigate('mission');
      return;
    }
    if (!hasEnoughWalletBalance) {
      showToast(`Insufficient wallet balance by ₹${balanceDifference}! Please recharge or pay via UPI.`);
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      buyPlanWithWallet(plan);
    }, 600);
  };

  const handleUPIPay = () => {
    if (isAlreadyPurchased) {
      showToast(`❌ You have already purchased ${plan.title}! Each member can buy each plan once.`);
      return;
    }
    if (plan.price === 0) {
      showToast('✓ Level 0 Free Plan already active on your account!');
      navigate('mission');
      return;
    }
    buyPlanWithUPI(plan);
  };

  const benefitsToDisplay = plan.benefits || [
    `Daily Income: ₹${plan.dailyIncome}`,
    `Daily Missions: ${plan.dailyMissions} Missions`,
    `Per-Mission Reward: ₹${plan.perMission}`,
    `Validity: ${plan.validity}`,
    'Instant Activation & Verified Rewards',
  ];

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="VIP Plan Details" showBack={true} />
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-4 max-w-md mx-auto pb-8">
          {/* Hero Plan Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-600 text-white p-5 shadow-md text-center space-y-2">
            <div className="inline-block bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-xs">
              Level {plan.level} &bull; {plan.levelTag}
            </div>

            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-xs">
              {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1 text-xs">
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                Daily: ₹{plan.dailyIncome}
              </span>
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                {plan.validity}
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Daily Missions
              </span>
              <span className="text-sm font-black text-slate-800">
                {plan.dailyMissions}
              </span>
            </div>
            <div className="p-2 bg-blue-50/60 rounded-xl">
              <span className="text-[10px] text-blue-500 font-semibold uppercase block">
                Per-Mission
              </span>
              <span className="text-sm font-black text-blue-600">
                ₹{plan.perMission}
              </span>
            </div>
            <div className="p-2 bg-emerald-50/60 rounded-xl">
              <span className="text-[10px] text-emerald-500 font-semibold uppercase block">
                Daily Income
              </span>
              <span className="text-sm font-black text-emerald-600">
                ₹{plan.dailyIncome}
              </span>
            </div>
          </div>

          {/* Prominent Total Validity Income Banner */}
          {(() => {
            const daysCount = parseInt(plan.validity) || (plan.level === 0 ? 2 : 365);
            const totalValidityIncome = plan.dailyIncome * daysCount;
            return (
              <div className="p-3 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-300 rounded-2xl shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-2xs">
                    💰
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-950 block leading-tight">
                      Total income during validity period ({plan.validity}):
                    </span>
                    <span className="text-[11px] font-black text-emerald-700">
                      ₹{plan.dailyIncome} × {daysCount} days = Total ₹{totalValidityIncome.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-950 bg-amber-300/90 px-2.5 py-1 rounded-xl border border-amber-400 block shadow-2xs">
                    ₹{totalValidityIncome.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[8px] font-bold text-amber-800 uppercase block mt-0.5">
                    TOTAL INCOME
                  </span>
                </div>
              </div>
            );
          })()}

          {/* TWO PAYMENT OPTIONS SECTION */}
          {plan.price > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Select Payment Method (2 Options)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">100% Safe</span>
              </div>

              {/* OPTION 1: WALLET BALANCE */}
              <div
                onClick={() => setSelectedMethod('wallet')}
                className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative ${
                  selectedMethod === 'wallet'
                    ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        hasEnoughWalletBalance
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">
                          Option 1: Wallet Balance
                        </h4>
                        <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">
                          Instant
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Current Balance:{' '}
                        <span className="font-black text-slate-900">
                          ₹{user.balance.toLocaleString('en-IN')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedMethod === 'wallet'}
                      onChange={() => setSelectedMethod('wallet')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Balance validation alert inside wallet card */}
                {selectedMethod === 'wallet' && (
                  <div className="mt-3 pt-3 border-t border-blue-100/80">
                    {hasEnoughWalletBalance ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sufficient Balance
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Remaining: ₹{(user.balance - plan.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>
                            Insufficient balance! ₹{balanceDifference.toLocaleString('en-IN')} more needed.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('add_money');
                          }}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Add Money to Wallet</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* OPTION 2: UPI PAYMENT GATEWAY */}
              <div
                onClick={() => setSelectedMethod('upi')}
                className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative ${
                  selectedMethod === 'upi'
                    ? 'border-purple-600 bg-purple-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">
                          Option 2: Direct UPI Gateway
                        </h4>
                        <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md">
                          Fast UPI
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        PhonePe, Google Pay, Paytm, BHIM QR
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedMethod === 'upi'}
                      onChange={() => setSelectedMethod('upi')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                {selectedMethod === 'upi' && (
                  <div className="mt-3 pt-3 border-t border-purple-100/80 flex items-center justify-between text-xs">
                    <span className="text-purple-700 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      +{plan.bonus || 50} Extra Bonus Credit
                    </span>
                    <span className="text-[11px] text-slate-500">QR &amp; VPA Direct</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Benefits Section */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Plan Benefits &amp; Validity</span>
            </h3>

            <div className="space-y-2">
              {benefitsToDisplay.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.8]" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* DYNAMIC ACTION BUTTON BASED ON SELECTED PAYMENT METHOD */}
          {isAlreadyPurchased ? (
            <div className="space-y-2">
              <div className="w-full py-3.5 px-4 bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-sm rounded-xl shadow-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Plan is Already Active (Purchased)</span>
              </div>
              <button
                onClick={() => navigate('member_plans')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Higher Level Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : plan.price === 0 ? (
            <button
              onClick={() => {
                showToast('✓ Level 0 Free Plan already active on your account!');
                navigate('mission');
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span>Start Free Missions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : selectedMethod === 'wallet' ? (
            <button
              onClick={handleWalletPay}
              disabled={isProcessing}
              className={`w-full py-3.5 px-4 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all ${
                hasEnoughWalletBalance
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 shadow-blue-500/25 cursor-pointer'
                  : 'bg-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Processing...'
                  : hasEnoughWalletBalance
                  ? `Pay ₹${plan.price.toLocaleString('en-IN')} from Wallet`
                  : `Insufficient Balance (Add at least ₹${balanceDifference})`}
              </span>
            </button>
          ) : (
            <button
              onClick={handleUPIPay}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-800 text-white font-black text-sm rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>
                Pay ₹{plan.price.toLocaleString('en-IN')} via UPI / QR Code
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Verification Note */}
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-amber-900 text-[11px] leading-tight border border-amber-100">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Plan activation is verified instantly and valid for {plan.validity}.
            </span>
          </div>
        </main>
      </div>
    </div>
  );
};

