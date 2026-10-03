import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { INDIAN_BANKS, POPULAR_BANKS } from '../data/indianBanksData';
import {
  Wallet,
  ArrowRight,
  Info,
  ShieldCheck,
  Building2,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Search,
  X,
  ChevronRight,
  Check,
  Loader2,
  MapPin,
} from 'lucide-react';

interface BranchLookupResult {
  branch: string;
  bank: string;
  city: string;
  state: string;
  address?: string;
}

export const WithdrawScreen: React.FC = () => {
  const { user, requestWithdrawal, showToast } = useApp();
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('bank');

  // UPI State
  const [upiId, setUpiId] = useState<string>(
    user.upiId || (user.mobile ? `${user.mobile}@upi` : '')
  );

  // Bank Account State (Strictly selected from list, no manual typing)
  const [accountHolder, setAccountHolder] = useState<string>(
    user.bankAccountHolder || user.name || ''
  );
  const [bankName, setBankName] = useState<string>(
    user.bankName || 'State Bank of India (SBI)'
  );
  const [accountNumber, setAccountNumber] = useState<string>(
    user.bankAccountNumber || ''
  );
  const [confirmAccountNumber, setConfirmAccountNumber] = useState<string>(
    user.bankAccountNumber || ''
  );
  const [ifscCode, setIfscCode] = useState<string>(
    user.bankIfsc || ''
  );

  // Bank Picker Modal / Search State
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  // IFSC Branch Auto-Lookup State
  const [branchInfo, setBranchInfo] = useState<BranchLookupResult | null>(null);
  const [isIfscLoading, setIsIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState<string | null>(null);

  const presetAmounts = [1000, 2000, 5000, 10000, 20000];

  // Filter banks based on search term
  const filteredBanks = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    if (!q) return INDIAN_BANKS;
    return INDIAN_BANKS.filter((b) => b.toLowerCase().includes(q));
  }, [bankSearch]);

  // Automatic IFSC Lookup when 11 characters are entered
  useEffect(() => {
    const cleanIfsc = ifscCode.trim().toUpperCase();
    if (cleanIfsc.length !== 11) {
      setBranchInfo(null);
      setIfscError(null);
      setIsIfscLoading(false);
      return;
    }

    let isMounted = true;
    const lookupBranch = async () => {
      setIsIfscLoading(true);
      setIfscError(null);
      try {
        const response = await fetch(`https://ifsc.razorpay.com/${cleanIfsc}`);
        if (!response.ok) {
          throw new Error('IFSC code not found');
        }
        const data = await response.json();
        if (isMounted) {
          setBranchInfo({
            branch: data.BRANCH || 'Main Branch',
            bank: data.BANK || '',
            city: data.CITY || '',
            state: data.STATE || '',
            address: data.ADDRESS || '',
          });
          setIfscError(null);
        }
      } catch (err) {
        if (isMounted) {
          setBranchInfo(null);
          setIfscError('Invalid IFSC Code. Please verify your 11-digit bank IFSC.');
        }
      } finally {
        if (isMounted) {
          setIsIfscLoading(false);
        }
      }
    };

    const timer = setTimeout(lookupBranch, 350);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [ifscCode]);

  const handleWithdraw = () => {
    if (selectedAmount < 1000) {
      showToast('❌ Minimum withdrawal amount is ₹1,000');
      return;
    }

    if (selectedAmount > user.balance) {
      showToast('❌ Insufficient balance for this withdrawal');
      return;
    }

    if (payoutMethod === 'upi') {
      const cleanUpi = upiId.trim();
      if (!cleanUpi) {
        showToast('❌ Please enter a valid UPI ID');
        return;
      }
      requestWithdrawal(selectedAmount, 'upi', { upiId: cleanUpi });
    } else {
      const cleanHolder = accountHolder.trim();
      const cleanBank = bankName.trim();
      const cleanAcc = accountNumber.trim();
      const cleanConfirm = confirmAccountNumber.trim();
      const cleanIfsc = ifscCode.trim().toUpperCase();

      if (!cleanBank) {
        showToast('❌ Please select your Bank from the list');
        setIsBankPickerOpen(true);
        return;
      }
      if (!cleanHolder) {
        showToast('❌ Please enter Account Holder Name');
        return;
      }
      if (!cleanAcc || cleanAcc.length < 8) {
        showToast('❌ Please enter a valid Bank Account Number');
        return;
      }
      if (cleanAcc !== cleanConfirm) {
        showToast('❌ Account Numbers do not match! Please check');
        return;
      }
      if (!cleanIfsc || cleanIfsc.length !== 11) {
        showToast('❌ Please enter a complete 11-digit Bank IFSC code');
        return;
      }
      if (ifscError) {
        showToast('❌ Please enter a valid IFSC code verified by RBI');
        return;
      }

      requestWithdrawal(selectedAmount, 'bank', {
        accountHolder: cleanHolder,
        bankName: cleanBank,
        accountNumber: cleanAcc,
        ifsc: cleanIfsc,
      });
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="Withdraw" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-4 max-w-md mx-auto pb-8">
          {/* Available Balance Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Available Balance
              </span>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {/* Withdrawal Amount Selection */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Withdrawal Amount
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {presetAmounts.map((amt) => {
                const isSelected = selectedAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-black shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white text-slate-700 font-bold hover:border-slate-300'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Withdrawal Method Tabs: Bank Account vs UPI */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Withdrawal Method
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold">
                Select Payout Mode
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPayoutMethod('bank')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  payoutMethod === 'bank'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Bank Account</span>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod('upi')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  payoutMethod === 'upi'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                <span>UPI Transfer</span>
              </button>
            </div>

            {/* OPTION 1: BANK ACCOUNT DETAILS (Strictly select bank from all Indian banks + Auto branch on IFSC) */}
            {payoutMethod === 'bank' && (
              <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-blue-600" />
                    <span>Bank Transfer Details</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    IMPS / NEFT 24×7
                  </span>
                </div>

                {/* 1. BANK NAME SELECTION (Read-only button, must choose from list) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Select Bank Name <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[9px] text-blue-600 font-bold">
                      (Select from List Only)
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setBankSearch('');
                      setIsBankPickerOpen(true);
                    }}
                    role="button"
                    tabIndex={0}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 p-3 text-left transition-all cursor-pointer flex items-center justify-between shadow-2xs group focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        {bankName ? (
                          <>
                            <span className="text-xs font-black text-slate-900 block truncate">
                              {bankName}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Tap to change bank
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">
                            Select your bank from list...
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 shrink-0 bg-white border border-blue-200 px-2.5 py-1 rounded-lg shadow-2xs group-hover:bg-blue-50 transition-all flex items-center gap-1">
                      <span>Change</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* 2. ACCOUNT HOLDER FULL NAME */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Account Holder Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Enter full name as per bank passbook"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {/* 3. BANK ACCOUNT NUMBER */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Bank Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 9 to 18 digit account number"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {/* 4. CONFIRM ACCOUNT NUMBER */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Confirm Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Re-enter account number"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none transition-all ${
                      confirmAccountNumber && accountNumber !== confirmAccountNumber
                        ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500'
                        : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white'
                    }`}
                  />
                  {confirmAccountNumber && accountNumber !== confirmAccountNumber && (
                    <span className="text-[10px] text-rose-500 font-bold block">
                      ⚠️ Account numbers do not match
                    </span>
                  )}
                </div>

                {/* 5. IFSC CODE WITH AUTO BRANCH DETECTION */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Bank IFSC Code <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[9px] text-slate-400 font-mono">11 Characters</span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      maxLength={11}
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="e.g. SBIN0001234 or HDFC0000240"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 uppercase outline-none focus:border-blue-500 focus:bg-white transition-all pr-9 tracking-wider"
                    />
                    <div className="absolute right-3 flex items-center">
                      {isIfscLoading ? (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : branchInfo ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : ifscError ? (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>

                  {/* BRANCH DETAILS CARD SHOWN AUTOMATICALLY ON VALID IFSC */}
                  {branchInfo && (
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-1 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-black">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Branch: {branchInfo.branch}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold pl-5">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>
                          {branchInfo.city ? `${branchInfo.city}, ` : ''}
                          {branchInfo.state}
                        </span>
                      </div>
                      {branchInfo.bank && (
                        <div className="text-[10px] text-slate-500 pl-5 font-medium">
                          Verified Bank: <b className="text-slate-700">{branchInfo.bank}</b>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ERROR MESSAGE IF INVALID IFSC */}
                  {ifscError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium animate-in fade-in duration-150">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{ifscError}</span>
                    </div>
                  )}

                  {!branchInfo && !ifscError && ifscCode.length > 0 && ifscCode.length < 11 && (
                    <span className="text-[10px] text-slate-400 block">
                      Enter complete 11 characters to automatically load bank branch.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* OPTION 2: UPI ACCOUNT INPUT */}
            {payoutMethod === 'upi' && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    UPI Account
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    PhonePe / GPay / Paytm
                  </span>
                </div>

                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. 9472487245@upi or user@okhdfcbank"
                      className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      (Registered UPI ID)
                    </span>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 ml-2 shrink-0" />
                </div>
              </div>
            )}
          </div>

          {/* Request Withdrawal Button */}
          <button
            type="button"
            onClick={handleWithdraw}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <span>
              {payoutMethod === 'bank' ? 'Request Bank Withdrawal' : 'Request UPI Withdrawal'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Info Notice */}
          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-xs leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              {payoutMethod === 'bank'
                ? 'Your withdrawal will be transferred directly to your selected Bank Account via IMPS / NEFT within 24-48 hours.'
                : 'Your withdrawal request will be processed within 24-48 hours directly to your linked UPI address.'}
            </span>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* SEARCHABLE BANK SELECTOR MODAL / BOTTOM SHEET */}
      {/* ========================================================= */}
      {isBankPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Select Your Bank
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    All RBI Approved Banks in India ({INDIAN_BANKS.length}+)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankPickerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Search bank name (e.g. SBI, HDFC, Gramin, PNB...)"
                  className="w-full bg-slate-100 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition-all"
                />
                {bankSearch && (
                  <button
                    onClick={() => setBankSearch('')}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Popular Banks Quick Tags (when search is empty) */}
            {!bankSearch && (
              <div className="px-3 pt-2.5 pb-1 bg-slate-50/50 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Popular Banks
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                  {POPULAR_BANKS.slice(0, 6).map((popBank) => (
                    <button
                      key={popBank}
                      type="button"
                      onClick={() => {
                        setBankName(popBank);
                        setIsBankPickerOpen(false);
                      }}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                        bankName === popBank
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      {popBank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Full Scrollable Bank List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 max-h-[55vh]">
              {filteredBanks.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">
                    No bank found matching "{bankSearch}"
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Please try another keyword like Bank name, state, or Gramin.
                  </p>
                </div>
              ) : (
                filteredBanks.map((item) => {
                  const isSelected = bankName === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setBankName(item);
                        setIsBankPickerOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-black'
                          : 'hover:bg-slate-50 text-slate-800 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Landmark className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs truncate">{item}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
              <span className="text-[10px] text-slate-500 font-medium">
                Showing {filteredBanks.length} of {INDIAN_BANKS.length} Indian Banks
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
