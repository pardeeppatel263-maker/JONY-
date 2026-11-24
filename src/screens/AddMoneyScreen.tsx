import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { ShieldCheck, ArrowRight, Zap, Loader2, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';

interface AmountOption {
  amount: number;
  bonus: number;
  popular?: boolean;
}

export const AddMoneyScreen: React.FC = () => {
  const {
    addMoneyInitiate,
    startDirectQoPayPayment,
    qopayAutoRetryState,
    cancelQoPayAutoRetry,
    adminSettings,
    navigate,
  } = useApp();

  const defaultOptions: AmountOption[] = [
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
    { amount: 50000, bonus: 1500 },
    { amount: 100000, bonus: 3500 },
  ];

  const options: AmountOption[] =
    adminSettings?.addMoneyTiers && adminSettings.addMoneyTiers.length > 0
      ? adminSettings.addMoneyTiers
      : defaultOptions;

  const defaultSelected = options.find((o) => o.popular) || options[0] || defaultOptions[3];
  const [selectedOption, setSelectedOption] = useState<AmountOption>(defaultSelected);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [cashierUnavailable, setCashierUnavailable] = useState(false);

  React.useEffect(() => {
    setSelectedOption((curr) => {
      const matched = options.find((o) => o.amount === curr.amount);
      return matched || options.find((o) => o.popular) || options[0] || curr;
    });
  }, [adminSettings?.addMoneyTiers]);

  const isQoPayActive = Boolean(
    adminSettings.paymentGatewayProvider !== 'drampay' &&
    (adminSettings.qopayEnabled === true || adminSettings.paymentGatewayProvider === 'qopay') &&
    (adminSettings.qopayUserToken?.trim() || '1ff0e5b2dd0096245789f08a9df5cc1c')
  );

  const handleProceed = async () => {
    // If QO Pay is NOT active (e.g. DramPay selected or Manual enabled while QO Pay is off), open payment modal directly
    if (!isQoPayActive) {
      addMoneyInitiate(selectedOption.amount, selectedOption.bonus);
      return;
    }

    // Direct QO Pay cashier checkout (never fall back to manual payment if cashier fails)
    setCashierUnavailable(false);
    setIsRedirecting(true);
    const safetyTimer = setTimeout(() => {
      setIsRedirecting(false);
    }, 26000);
    try {
      const res = await startDirectQoPayPayment(selectedOption.amount, selectedOption.bonus, 'add_money');
      if (!res.success) {
        clearTimeout(safetyTimer);
        setIsRedirecting(false);
        setCashierUnavailable(true);
      }
    } catch {
      clearTimeout(safetyTimer);
      setIsRedirecting(false);
      setCashierUnavailable(true);
    }
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
                    onClick={() => {
                      setSelectedOption(opt);
                      setCashierUnavailable(false);
                      cancelQoPayAutoRetry();
                    }}
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

          {/* QO Pay Cashier Unavailable Notice (No Manual Fallback + Auto-Detect & Open) */}
          {(cashierUnavailable || qopayAutoRetryState.active) && isQoPayActive && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-black text-amber-950">
                    Payment Cashier Unavailable
                  </h4>
                  <p className="text-[11px] font-semibold text-amber-900 leading-snug">
                    Try again after some time or contact support.
                  </p>
                  {qopayAutoRetryState.active && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-800 bg-indigo-50/90 border border-indigo-200 rounded-lg px-2 py-1 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-600 shrink-0" />
                      <span>
                        {qopayAutoRetryState.checkingNow
                          ? 'Checking payment cashier availability...'
                          : qopayAutoRetryState.isLowSuccessRateHold
                          ? `Low success rate hold detected • Auto-opening cashier in ${qopayAutoRetryState.nextCheckInSec}s once cleared`
                          : `Auto-checking gateway in ${qopayAutoRetryState.nextCheckInSec}s to open cashier automatically`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={isRedirecting || qopayAutoRetryState.checkingNow}
                  className="py-2 px-3 bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${qopayAutoRetryState.checkingNow ? 'animate-spin' : ''}`} />
                  <span>Try Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cancelQoPayAutoRetry();
                    navigate('help_center');
                  }}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact Support</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sticky Bottom Proceed Button */}
      <div className="p-4 bg-white border-t border-slate-200 max-w-md mx-auto w-full space-y-2">
        <button
          onClick={handleProceed}
          disabled={isRedirecting}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-80"
        >
          {isRedirecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Proceed to Pay ₹{selectedOption.amount.toLocaleString('en-IN')}</span>
            </>
          ) : (
            <>
              <span>Proceed to Pay ₹{selectedOption.amount.toLocaleString('en-IN')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* ONLY visible when QO Pay is OFF and Admin explicitly enables Manual Payment */}
        {!isQoPayActive && adminSettings.manualPaymentEnabled === true && (
          <button
            type="button"
            onClick={() => addMoneyInitiate(selectedOption.amount, selectedOption.bonus, true)}
            className="w-full py-1 text-center text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Or Pay with Manual QR & UTR
          </button>
        )}
      </div>
    </div>
  );
};
