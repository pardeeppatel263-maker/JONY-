import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { compressImage } from '../../utils/imageCompressor';
import {
  X,
  Copy,
  Check,
  UploadCloud,
  FileImage,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

export const UPIPaymentModal: React.FC = () => {
  const {
    isUPIModalOpen,
    setIsUPIModalOpen,
    pendingUPIAmount,
    pendingUPIBonus,
    pendingDepositType,
    pendingPlanForUPI,
    adminSettings,
    submitUPIPaymentProof,
    copyText,
    showToast,
  } = useApp();

  const [step, setStep] = useState<'pay' | 'proof'>('pay');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes countdown

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active admin UPI ID & merchant from backend / settings
  const adminUpiId = adminSettings.adminUpiId || 'taskvibe.pay@icici';
  const adminMerchantName = adminSettings.adminMerchantName || 'TaskVibe Pay';

  // Standard UPI URI format
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(adminUpiId)}&pn=${encodeURIComponent(
    adminMerchantName
  )}&am=${encodeURIComponent(pendingUPIAmount)}&cu=INR&tn=${encodeURIComponent(
    pendingDepositType === 'plan_purchase' ? `VIP Level ${pendingPlanForUPI?.level || 1} Plan` : 'TaskVibe Deposit'
  )}`;

  // Dynamic QR Code: use custom Admin QR image if configured, otherwise generate from UPI ID
  const qrCodeUrl =
    adminSettings.adminQrCodeUrl && adminSettings.adminQrCodeUrl.trim() !== ''
      ? adminSettings.adminQrCodeUrl.trim()
      : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
          upiIntentUri
        )}&margin=1`;

  useEffect(() => {
    if (!isUPIModalOpen) {
      setStep('pay');
      setUtrNumber('');
      setScreenshotData(null);
      setScreenshotName(null);
      setIsSubmitting(false);
      return;
    }
    setSecondsLeft(600);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isUPIModalOpen]);

  // Auto-switch to proof step when returning from UPI payment app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isUPIModalOpen) {
        setStep('proof');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isUPIModalOpen]);

  if (!isUPIModalOpen) return null;

  const handleLaunchUPIApp = () => {
    try {
      // 1. Ensure user session & plan are 100% saved in localStorage before exiting to UPI app
      localStorage.setItem('taskvibe_auth', 'true');
      localStorage.setItem('taskvibe_screen', 'plan_detail');
      if (pendingPlanForUPI) {
        localStorage.setItem('taskvibe_pending_plan', JSON.stringify(pendingPlanForUPI));
        localStorage.setItem('taskvibe_selected_plan', JSON.stringify(pendingPlanForUPI));
      }

      // Switch to proof step so when returning, user enters UTR
      setStep('proof');

      // Launch UPI deep link
      window.location.href = upiIntentUri;
    } catch {
      window.open(upiIntentUri, '_blank');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyUpi = () => {
    copyText(adminUpiId, 'Admin UPI ID');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('❌ Please upload an image file (JPG, PNG) only');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('❌ Screenshot size must be less than 10MB');
      return;
    }

    setScreenshotName(file.name);
    try {
      showToast('Processing screenshot...');
      const compressed = await compressImage(file, 800, 800, 0.72);
      setScreenshotData(compressed);
      showToast('✓ Payment screenshot selected');
    } catch (err) {
      console.warn('Image compression fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setScreenshotData(reader.result);
          showToast('✓ Payment screenshot selected');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      showToast('❌ Please enter the 12-digit UPI Ref / UTR number');
      return;
    }

    if (cleanUtr.length < 8) {
      showToast('❌ Please enter a valid UPI Ref / UTR number (at least 8-12 digits)');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      submitUPIPaymentProof(cleanUtr, screenshotData || undefined);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100 my-auto">
        {/* UPI Gateway Header */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-900 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white px-2 py-0.5 rounded-md text-[11px] font-black text-slate-900 tracking-wider shadow-xs">
              UPI
            </div>
            <div>
              <h3 className="text-xs font-bold leading-tight">
                {pendingDepositType === 'plan_purchase'
                  ? `Buy VIP Level ${pendingPlanForUPI?.level} (${pendingPlanForUPI?.levelTag})`
                  : 'Fast UPI Payment Gateway'}
              </h3>
              <p className="text-[10px] text-blue-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>256-bit Secured • Verified QR</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUPIModalOpen(false)}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Close UPI Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: SCAN QR CODE & PAY VIA UPI */}
        {step === 'pay' && (
          <div className="p-4 space-y-3.5 text-center">
            {/* Amount Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Amount To Pay
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{pendingUPIAmount.toLocaleString('en-IN')}
              </div>
              {pendingDepositType === 'plan_purchase' && pendingPlanForUPI ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  <Sparkles className="w-3 h-3" />
                  <span>VIP Plan: Level {pendingPlanForUPI.level} ({pendingPlanForUPI.levelTag})</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Sparkles className="w-3 h-3" />
                  <span>Includes +₹{pendingUPIBonus} Bonus Credit</span>
                </div>
              )}
            </div>

            {/* AUTOMATIC QR CODE GENERATED FROM BACKEND UPI ID */}
            <div className="bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-3 flex flex-col items-center justify-center space-y-2 relative shadow-xs">
              <div className="w-44 h-44 bg-white p-2 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center relative">
                <img
                  src={qrCodeUrl}
                  alt={`UPI QR Code for ${adminUpiId}`}
                  className="w-40 h-40 object-contain rounded"
                  loading="eager"
                />
              </div>

              {/* Verified Badge */}
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Auto QR • Scan with Any UPI App</span>
              </div>
            </div>

            {/* BACKEND ADMIN UPI ID WITH 1-CLICK COPY */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-left">
              <div className="min-w-0 pr-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Admin Official UPI ID
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                  {adminUpiId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                  copiedUpi
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy UPI</span>
                  </>
                )}
              </button>
            </div>

            {/* Apps & Timer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
              <span className="flex items-center gap-1">
                <span>🟣 PhonePe</span> &bull; <span>🟢 GPay</span> &bull; <span>🔷 Paytm</span>
              </span>
              <span className="flex items-center gap-1 font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Clock className="w-3 h-3" />
                <span>{formatTime(secondsLeft)}</span>
              </span>
            </div>

            {/* Action Buttons: Direct UPI open OR Next to upload Screenshot */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleLaunchUPIApp}
                className="w-full py-3 px-3 bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-purple-200 active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                <Smartphone className="w-4 h-4 text-purple-700" />
                <span>Open in PhonePe / GPay / Paytm App</span>
                <ExternalLink className="w-3.5 h-3.5 text-purple-500" />
              </button>

              <button
                onClick={() => setStep('proof')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <span>Payment Done? Upload Screenshot &amp; UTR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SUBMIT PAYMENT SCREENSHOT & UTR NUMBER */}
        {step === 'proof' && (
          <form onSubmit={handleSubmitProof} className="p-4 space-y-3.5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold">Submit payment screenshot after completing payment:</p>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  The transaction remains <b>In-Process</b> until approved by Admin.
                </p>
              </div>
            </div>

            {/* Amount details */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-semibold">Submitted Amount</span>
              <span className="font-black text-slate-900 text-sm">
                ₹{pendingUPIAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* UTR / UPI Ref ID Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center justify-between">
                <span>12-Digit UTR / UPI Ref Number *</span>
                <span className="text-[9px] text-blue-600 lowercase font-medium">required</span>
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 427819283749"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-600 focus:bg-white"
                required
              />
              <span className="text-[9px] text-slate-400 block">
                Found on your PhonePe/GPay/Paytm successful receipt (12 digits).
              </span>
            </div>

            {/* SCREENSHOT UPLOAD BOX */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide block">
                Payment Screenshot *
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {screenshotData ? (
                <div className="relative border-2 border-emerald-500 rounded-2xl p-2 bg-emerald-50/50 flex items-center gap-3">
                  <img
                    src={screenshotData}
                    alt="Payment screenshot preview"
                    className="w-14 h-14 object-cover rounded-lg border border-emerald-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-emerald-900 truncate block">
                      {screenshotName || 'Screenshot selected'}
                    </span>
                    <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Ready to Submit</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotData(null);
                      setScreenshotName(null);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 bg-slate-50 hover:bg-blue-50/40 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Click to Upload Screenshot
                  </div>
                  <span className="text-[10px] text-slate-400">
                    PNG, JPG, WebP supported (Max 5MB)
                  </span>
                </div>
              )}
            </div>

            {/* Submission Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('pay')}
                className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Back to QR
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !utrNumber.trim()}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Proof...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Payment Proof (In-Process)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
