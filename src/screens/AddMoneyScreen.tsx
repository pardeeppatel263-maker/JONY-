import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { ShieldCheck, ArrowRight, Check, Zap, Clock } from 'lucide-react';
import { PhonePeIcon, GPayIcon, PaytmIcon, BhimIcon } from '../components/PaymentIcons';

interface AmountOption {
  amount: number;
  bonus: number;
  popular?: boolean;
}

export const AddMoneyScreen: React.FC = () => {
  const { addMoneyInitiate, paymentDeposits, navigate } = useApp();
  const pendingDeposit = paymentDeposits.find(
    (d) => d.status === 'in_process' && d.depositType === 'add_money'
  );

  const options: AmountOption[] = [
    { amount: 100, bonus: 15 },
    { amount: 200, bonus: 30 },
    { amount: 500, bonus: 75 },
    { amount: 1000, bonus: 150, popular: true },
    { amount: 2000, bonus: 250 },
    { amount: 5000, bonus: 350 },
    { amount: 7000, bonus: 400 },
    { amount: 10000, bonus: 500 },
    { amount: 20000, bonus: 650 },
    { amount: 30000, bonus: 850 },
  ];

  const [selectedOption, setSelectedOption] = useState<AmountOption>(options[3]); // ₹1000
  const [selectedUPIApp, setSelectedUPIApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'bhim'>('phonepe');

  const upiApps = [
    { id: 'phonepe', name: 'PhonePe', renderIcon: () => <PhonePeIcon size={36} className="rounded-xl shadow-xs" /> },
    { id: 'gpay', name: 'Google Pay', renderIcon: () => <GPayIcon size={36} className="rounded-xl shadow-xs" /> },
    { id: 'paytm', name: 'Paytm', renderIcon: () => <PaytmIcon size={36} className="rounded-xl shadow-xs" /> },
    { id: 'bhim', name: 'BHIM UPI', renderIcon: () => <BhimIcon size={36} className="rounded-xl shadow-xs" /> },
  ];

  const handleProceed = () => {
    addMoneyInitiate(selectedOption.amount, selectedOption.bonus);
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="Add Money" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-4 max-w-md mx-auto pb-6">
          {/* Pending In-Process Deposit Card */}
          {pendingDeposit && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span className="text-xs font-black text-amber-900">
                    Deposit In-Process (₹{pendingDeposit.amount})
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  Admin Review
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Aapka UTR <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-200">{pendingDeposit.utrNumber}</span> submission admin verification ke under hai. Approval milte hi balance add ho jayega.
              </p>
              <button
                type="button"
                onClick={() => navigate('record')}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Transaction in Records</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* UPI Payment Banner matching Screenshot 5 */}
          <div className="rounded-2xl bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-900 text-white p-3.5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white px-2.5 py-1.5 rounded-lg flex items-center justify-center font-black text-slate-900 text-xs tracking-tight shadow-inner">
                <span className="text-orange-600">U</span>
                <span className="text-emerald-600">P</span>
                <span className="text-blue-600">I</span>
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">UPI Payment</h3>
                <p className="text-[10px] text-blue-200">Quick • Safe • Secure</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          </div>

          {/* Select Amount Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Select Amount
              </h2>
              <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3 fill-blue-600" />
                Extra Bonus Added
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {options.map((opt) => {
                const isSelected = selectedOption.amount === opt.amount;
                return (
                  <button
                    key={opt.amount}
                    onClick={() => setSelectedOption(opt)}
                    className={`relative p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {opt.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full tracking-wider">
                        Popular
                      </span>
                    )}
                    <div className="text-sm font-black text-slate-900">
                      ₹{opt.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                      Get ₹{opt.bonus} Bonus
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pay via UPI Section matching Screenshot 5 */}
          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Pay via UPI
            </h3>

            <div className="grid grid-cols-4 gap-2">
              {upiApps.map((app) => {
                const isSelected = selectedUPIApp === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedUPIApp(app.id as any)}
                    className={`p-2 py-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/30 shadow-sm scale-102'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-center">{app.renderIcon()}</div>
                    <span className="text-[10px] font-extrabold text-slate-800 text-center leading-tight truncate w-full">
                      {app.name}
                    </span>
                    {isSelected ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    ) : (
                      <div className="w-1.5 h-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-400 text-center pt-1">
              Pay securely using UPI. After payment, click on verify.
            </p>
          </div>

          {/* Payment Summary Box */}
          <div className="bg-slate-100/90 rounded-xl p-3 border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>You Pay (UPI)</span>
              <span className="font-bold text-slate-900">
                ₹{selectedOption.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700">
              <span className="font-medium">You Will Get</span>
              <span className="font-black text-emerald-600">
                ₹{selectedOption.bonus} Bonus
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* Sticky Bottom Proceed Button */}
      <div className="p-4 bg-white border-t border-slate-200 max-w-md mx-auto w-full">
        <button
          onClick={handleProceed}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <span>Proceed to Pay</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
