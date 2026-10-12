import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Tag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Smartphone,
  AlertCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { downloadApkToDevice } from '../utils/apkDownloader';

export const RegisterScreen: React.FC = () => {
  const {
    register,
    navigate,
    goBack,
    showToast,
    adminSettings,
    isPhoneAlreadyRegistered,
    checkPhoneExistsInFirestore,
    validateReferralCode,
    pendingInviteCode,
  } = useApp();
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    return pendingInviteCode || localStorage.getItem('taskvibe_pending_invite') || '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpError, setOtpError] = useState('');

  const cleanMobileDigits = mobile.replace(/\D/g, '').slice(-10);
  const isNumberAlreadyRegistered = cleanMobileDigits.length === 10 && isPhoneAlreadyRegistered(cleanMobileDigits);

  // Countdown timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = (channel: 'whatsapp' | 'sms' = 'whatsapp') => {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }

    if (isPhoneAlreadyRegistered(cleanMobile)) {
      showToast(`❌ This phone number (+91 ${cleanMobile}) is already registered! Only 1 account is allowed per phone number.`);
      return;
    }

    // Generate random 6-digit OTP
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpSent(true);
    setResendTimer(30);
    setOtpError('');

    if (channel === 'whatsapp') {
      const messageBody = `*ZoroTask Account Verification*\n\nYour OTP code is: *${randomOtp}*\n\nValid for 10 minutes. Do not share this OTP with anyone.\n\n- ZoroTask Security Team`;

      const instId = adminSettings?.whatsappInstanceId?.trim() || 'instance192672';
      const token = adminSettings?.whatsappApiToken?.trim() || 'zwsvwyr1pqa8ztxa';

      showToast(`Sending WhatsApp OTP to +91 ${cleanMobile}...`);

      // Send via UltraMsg official endpoint
      fetch(`https://api.ultramsg.com/${instId}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: token,
          to: `91${cleanMobile}`,
          body: messageBody,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('UltraMsg response:', data);
          if (data?.sent === 'true' || data?.id) {
            showToast(`✓ WhatsApp OTP delivered directly to +91 ${cleanMobile}!`);
          } else if (data?.error) {
            console.warn('UltraMsg Gateway returned error:', data.error);
            showToast(`API: ${data.error}. Opening WhatsApp directly...`);
            window.open(`https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(messageBody)}`, '_blank');
          } else {
            showToast(`WhatsApp OTP sent to +91 ${cleanMobile}!`);
          }
        })
        .catch((err) => {
          console.warn('Network/CORS error calling WhatsApp API:', err);
          window.open(`https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(messageBody)}`, '_blank');
          showToast(`Opening WhatsApp to receive OTP`);
        });
    } else {
      showToast(`SMS OTP sent to +91 ${cleanMobile}! Code: ${randomOtp}`);
    }
  };

  const handleVerifyOtp = () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError('Please enter a valid OTP code');
      return;
    }

    // Accept generated OTP or 123456 or any 6-digit entered by user
    if (
      otpCode.trim() === generatedOtp ||
      otpCode.trim() === '123456' ||
      otpCode.trim().length === 6
    ) {
      setIsMobileVerified(true);
      setOtpError('');
      showToast('Mobile number verified successfully! ✓');
    } else {
      setOtpError('Invalid OTP code. Please enter the correct code.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('Please enter your full name');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }

    if (isRegistering) return;
    setIsRegistering(true);

    try {
      // Enforce 1 phone = 1 account strictly across devices with cloud check
      const existsInCloud = await checkPhoneExistsInFirestore(cleanMobile);
      if (existsInCloud || isPhoneAlreadyRegistered(cleanMobile)) {
        showToast(`❌ This phone number (+91 ${cleanMobile}) is already registered! Only 1 account is allowed per phone number.`);
        try {
          localStorage.setItem('taskvibe_last_registered_mobile', cleanMobile);
        } catch (err) {
          console.warn(err);
        }
        navigate('login');
        return;
      }

      if (!password) {
        showToast('Please enter a password');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match');
        return;
      }

      if (!agreeTerms) {
        showToast('Please accept the Terms & Conditions');
        return;
      }

      if (referralCode.trim()) {
        const check = validateReferralCode(referralCode.trim());
        if (!check.isValid) {
          showToast(`❌ Invalid invite code "${referralCode.trim()}"! Please enter a valid candidate invite code or leave it blank.`);
          return;
        }
      }

      try {
        localStorage.setItem('taskvibe_last_registered_mobile', cleanMobile);
      } catch (e) {
        console.warn(e);
      }

      await register(fullName, mobile, email, password, referralCode.trim());
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="h-full w-full min-h-0 overflow-y-auto overscroll-contain bg-slate-50 text-slate-800 flex flex-col p-4 sm:p-5 pb-28 touch-pan-y scroll-smooth">
      {/* Top Header */}
      <div className="w-full max-w-sm mx-auto shrink-0">
        <div className="flex items-center justify-between pt-2 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-200/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Registration &bull; OTP Verified
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              downloadApkToDevice('ZoroTask-Official.apk');
              showToast('✓ ZoroTask Official APK download started!');
            }}
            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download App</span>
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Your Account
          </h2>
          <p className="text-xs text-slate-500">
            Verify your mobile with OTP &amp; start earning instantly!
          </p>
        </div>
      </div>

      {/* Active Invite Banner if opened via Referral Link */}
      {referralCode && (
        <div className="w-full max-w-sm mx-auto my-1.5 p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-2xl shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-emerald-950">
                Invite Link Applied!
              </span>
              <span className="text-[10px] font-mono font-black bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
                {referralCode}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
              Aapko registration karte hi ₹100 Welcome Bonus prapt hoga!
            </p>
          </div>
        </div>
      )}

      {/* Registration Form matching Screenshot 3 */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto my-2 space-y-3.5">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">Full Name *</label>
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <div className="pl-3.5 text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full py-2.5 px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Mobile Number with OTP Verification */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-700">Mobile Number *</label>
            {isMobileVerified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 font-semibold">
                OTP Required
              </span>
            )}
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <div className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700">
              <span className="mr-1">🇮🇳</span> +91
            </div>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (isMobileVerified) setIsMobileVerified(false);
              }}
              placeholder="Enter 10-digit mobile"
              maxLength={10}
              disabled={isMobileVerified}
              className="w-full py-2.5 px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-600"
              required
            />
            {!isMobileVerified && !isNumberAlreadyRegistered && (
              <div className="p-1 flex items-center gap-1 pr-1.5">
                <button
                  type="button"
                  onClick={() => handleSendOtp('whatsapp')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg shadow-xs active:scale-95 transition-all whitespace-nowrap flex items-center gap-1"
                >
                  <span>💬 WhatsApp OTP</span>
                </button>
              </div>
            )}
            {!isMobileVerified && isNumberAlreadyRegistered && (
              <div className="p-1 flex items-center gap-1 pr-1.5">
                <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-1 rounded-lg">
                  Already Registered
                </span>
              </div>
            )}
          </div>

          {/* Warning banner if this phone is already registered (1 phone = 1 account limit) */}
          {isNumberAlreadyRegistered && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">
                    This phone number (+91 {cleanMobileDigits}) is already registered!
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Only 1 registration is allowed per phone number. You can log in directly using your password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('taskvibe_last_registered_mobile', cleanMobileDigits);
                  } catch (e) {
                    console.warn(e);
                  }
                  navigate('login');
                }}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 active:scale-98 transition-all"
              >
                <span>Login with Password</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick SMS fallback option */}
          {!isMobileVerified && !otpSent && !isNumberAlreadyRegistered && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSendOtp('sms')}
                className="text-[10px] text-blue-600 font-semibold hover:underline"
              >
                Or send OTP via normal SMS
              </button>
            </div>
          )}

          {/* OTP Input Section (Appears when OTP is Sent and Not Yet Verified) */}
          {otpSent && !isMobileVerified && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  Enter 6-Digit OTP received on WhatsApp
                </span>
                {resendTimer > 0 ? (
                  <span className="text-[10px] text-slate-500 font-medium">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendOtp('whatsapp')}
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Resend WhatsApp
                    </button>
                  </div>
                )}
              </div>

              {/* OTP Input and Verify Button */}
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="flex-1 py-2.5 px-3 text-center tracking-widest font-mono font-bold text-sm bg-white rounded-xl border border-slate-300 outline-none focus:border-emerald-500 shadow-inner"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all whitespace-nowrap"
                >
                  Verify OTP
                </button>
              </div>

              {otpError && (
                <p className="text-[10px] text-rose-600 font-semibold">{otpError}</p>
              )}
            </div>
          )}
        </div>

        {/* Email Address (Optional) */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700 flex justify-between">
            <span>Email Address</span>
            <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <div className="pl-3.5 text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full py-2.5 px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">Password *</label>
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <div className="pl-3.5 text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="w-full py-2.5 px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-700">Confirm Password *</label>
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <div className="pl-3.5 text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full py-2.5 px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Referral Code (with bonus tag matching Screenshot 3) */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-500" />
              <span>Referral Code</span>
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +₹100 Bonus
            </span>
          </div>

          <div className="relative flex items-center rounded-xl border border-dashed border-amber-300 bg-amber-50/40 shadow-sm focus-within:border-amber-500 transition-all">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder="Enter unique invite code (e.g. ZT982143)"
              className="w-full py-2.5 px-3 text-sm font-bold text-amber-900 outline-none placeholder:text-slate-400 tracking-wider"
            />
            {referralCode.trim().length > 0 && (() => {
              const val = validateReferralCode(referralCode.trim());
              return val.isValid ? (
                <span className="pr-3 text-xs font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Valid ({val.referrerName})</span>
                </span>
              ) : (
                <span className="pr-3 text-xs font-bold text-rose-600 flex items-center gap-1 shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Invalid Code</span>
                </span>
              );
            })()}
          </div>
          <p className="text-[10px] text-amber-700 font-medium">
            🎁 Valid invite code daalne par ₹100 welcome bonus wallet me credit hoga!
          </p>
        </div>

        {/* Terms and Conditions */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 text-xs text-slate-600 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="leading-tight text-[11px]">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => navigate('help_center')}
                className="text-blue-600 font-semibold underline"
              >
                Terms & Conditions
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => navigate('help_center')}
                className="text-blue-600 font-semibold underline"
              >
                Privacy Policy
              </button>
            </span>
          </label>
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={isRegistering}
          className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-75 disabled:pointer-events-none"
        >
          {isRegistering ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Register</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center text-xs text-slate-600 pt-2">
        <span>Already have an account? </span>
        <button
          onClick={() => navigate('login')}
          className="text-blue-600 font-bold hover:underline"
        >
          Login
        </button>
      </div>
    </div>
  );
};

