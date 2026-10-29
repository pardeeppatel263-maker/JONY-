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
  KeyRound,
  MessageCircle,
} from 'lucide-react';
import { downloadApkToDevice } from '../utils/apkDownloader';
import { sendWhatsAppOtp } from '../utils/whatsappOtp';
import { TaskVibeLogo } from '../components/TaskVibeLogo';

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
    validateReferralCodeAsync,
    registeredUsers,
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
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [gatewayError, setGatewayError] = useState('');
  const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState('');
  const [asyncRefStatus, setAsyncRefStatus] = useState<{ isValid: boolean; referrerName?: string } | null>(null);
  const [isValidatingRef, setIsValidatingRef] = useState(false);

  // Live real-time referral verification with fallback to cloud database
  useEffect(() => {
    const code = referralCode.trim();
    if (!code) {
      setAsyncRefStatus(null);
      setIsValidatingRef(false);
      return;
    }
    const syncVal = validateReferralCode(code);
    if (syncVal.isValid) {
      setAsyncRefStatus(syncVal);
      setIsValidatingRef(false);
      return;
    }
    setIsValidatingRef(true);
    const timer = setTimeout(async () => {
      const asyncVal = await validateReferralCodeAsync(code);
      setAsyncRefStatus(asyncVal);
      setIsValidatingRef(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [referralCode, registeredUsers]);

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

  const handleSendOtp = async () => {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length < 10) {
      showToast('Please enter a 10-digit mobile number');
      return;
    }

    if (isPhoneAlreadyRegistered(cleanMobile)) {
      showToast(`❌ This phone number (+91 ${cleanMobile}) is already registered! Please log in.`);
      return;
    }

    // Generate random 4-digit OTP matching Renflair spec
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);
    setOtpSent(true);
    setResendTimer(30);
    setOtpError('');
    setGatewayError('');
    setIsSendingOtp(true);

    const messageText = `*ZoroTask Account Verification*\n\nYour OTP code is: *${randomOtp}*\n\nValid for 10 minutes. Do not share this OTP with anyone.\n\n- ZoroTask Security Team`;
    const directWaUrl = `https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(messageText)}`;
    setWhatsappFallbackUrl(directWaUrl);

    try {
      const res = await sendWhatsAppOtp({
        mobile: cleanMobile,
        otp: randomOtp,
        purpose: 'register',
        adminSettings,
      });
      if (res?.fallbackLink) {
        setWhatsappFallbackUrl(res?.fallbackLink);
      }
    } catch (err: any) {
      console.warn('WhatsApp dispatch error:', err);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = () => {
    const entered = otpCode.trim();
    if (!entered || entered.length < 4) {
      setOtpError('Please enter the 4-digit OTP code');
      return;
    }

    // STRICT CHECK: The entered OTP must match generatedOtp strictly!
    if (entered === generatedOtp) {
      setIsMobileVerified(true);
      setOtpError('');
      setGatewayError('');
      showToast('✓ Mobile number verified via WhatsApp OTP!');
    } else {
      setOtpError('❌ Incorrect OTP! Please enter the valid 4-digit OTP received on WhatsApp.');
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

    if (!isMobileVerified) {
      showToast('❌ Please verify your mobile number with OTP first!');
      setOtpError('Please complete OTP verification before proceeding');
      return;
    }

    if (isRegistering) return;
    setIsRegistering(true);

    try {
      // Check if this mobile number currently has an ACTIVE account in Firestore
      const existsInCloud = await checkPhoneExistsInFirestore(cleanMobile);
      if (existsInCloud) {
        showToast(`❌ This phone number (+91 ${cleanMobile}) already has an active account! Please login with your password.`);
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
        let check = validateReferralCode(referralCode.trim());
        if (!check.isValid) {
          check = await validateReferralCodeAsync(referralCode.trim());
        }
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
            onClick={(e) => {
              e.stopPropagation();
              downloadApkToDevice(
                `ZoroTask-Official-v${adminSettings.appVersion || '2.7.0'}.apk`,
                adminSettings.apkDownloadUrl || '/ZoroTask-Official.apk'
              );
              showToast(`✓ ZoroTask Official v${adminSettings.appVersion || '2.7.0'} APK download started!`);
            }}
            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download App</span>
          </button>
        </div>

        {/* Logo Card */}
        <div className="p-2.5 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl shadow-md w-full flex justify-center mb-3">
          <TaskVibeLogo size="md" theme="on-blue" showSubtitle={true} />
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
              Aapka account invite link se linked hai.
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-700">Mobile Number *</label>
            {isMobileVerified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified
              </span>
            ) : otpSent ? (
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                OTP Bheja Gaya
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 font-semibold">
                OTP Verification Zaroori
              </span>
            )}
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <div className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700 select-none">
              <span className="mr-1">🇮🇳</span> +91
            </div>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setMobile(val);
                if (isMobileVerified) setIsMobileVerified(false);
              }}
              placeholder="10-digit mobile number"
              maxLength={10}
              disabled={isMobileVerified}
              className="w-full py-2.5 px-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-600 tracking-wide"
              required
            />
            {!isMobileVerified && !isNumberAlreadyRegistered && (
              <div className="p-1 flex items-center pr-1.5 shrink-0">
                <button
                  type="button"
                  disabled={isSendingOtp || cleanMobileDigits.length < 10 || (otpSent && resendTimer > 0)}
                  onClick={() => handleSendOtp()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-xs active:scale-95 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{isSendingOtp ? 'Sending...' : otpSent ? (resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend OTP') : 'WhatsApp OTP'}</span>
                </button>
              </div>
            )}
            {isMobileVerified && (
              <div className="p-1 flex items-center pr-2 shrink-0">
                <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
            )}
          </div>

          {/* Warning banner if this phone is already registered */}
          {isNumberAlreadyRegistered && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">
                    This phone number (+91 {cleanMobileDigits}) is already registered!
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Only 1 account is permitted per mobile number. Please log in.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
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
                  className="w-full py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 active:scale-98 transition-all cursor-pointer"
                >
                  <span>Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('taskvibe_last_registered_mobile', cleanMobileDigits);
                      localStorage.setItem('taskvibe_auto_open_forgot', 'true');
                    } catch (e) {
                      console.warn(e);
                    }
                    navigate('login');
                  }}
                  className="w-full py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 active:scale-98 transition-all cursor-pointer"
                >
                  <span>Reset Password</span>
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Simple Clean OTP Box - EXACT MATCH TO USER'S PHOTO */}
          {otpSent && !isMobileVerified && (
            <div className="space-y-1.5 animate-in fade-in duration-200 pt-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setOtpCode(val);
                      if (otpError) setOtpError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleVerifyOtp();
                      }
                    }}
                    placeholder="Enter 4-digit OTP"
                    className="w-full bg-white border-2 border-[#009b55] rounded-full py-2.5 px-4 text-center text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 shadow-2xs"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="bg-[#009b55] hover:bg-[#00874a] active:scale-95 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer transition-all shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Verify OTP</span>
                </button>
              </div>

              {otpError && (
                <p className="text-[11px] text-rose-600 font-bold px-3 text-center animate-in fade-in">
                  {otpError}
                </p>
              )}
            </div>
          )}

          {/* Success Banner when Mobile is Verified */}
          {isMobileVerified && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-full flex items-center justify-between text-xs text-emerald-900 px-4 animate-in fade-in">
              <span className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>+91 {cleanMobileDigits} Verified!</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsMobileVerified(false);
                  setOtpSent(false);
                  setOtpCode('');
                }}
                className="text-[10px] text-emerald-700 hover:underline font-semibold cursor-pointer"
              >
                Change
              </button>
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

        {/* Referral Code */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-500" />
              <span>Referral Code</span>
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
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
              if (isValidatingRef) {
                return (
                  <span className="pr-3 text-xs font-bold text-amber-600 flex items-center gap-1 shrink-0 animate-pulse">
                    <span>Checking code...</span>
                  </span>
                );
              }
              const val = asyncRefStatus || validateReferralCode(referralCode.trim());
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
          <p className="text-[10px] text-slate-500 font-medium">
            Entering an invite code awards referral rewards to your inviter.
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

      {/* Switch to Login / Forgot Password */}
      <div className="text-center text-xs text-slate-600 pt-2 flex items-center justify-center gap-2">
        <span>Already have an account?</span>
        <button
          onClick={() => navigate('login')}
          className="text-blue-600 font-bold hover:underline cursor-pointer"
        >
          Login
        </button>
        <span>•</span>
        <button
          onClick={() => {
            try {
              if (cleanMobileDigits.length === 10) {
                localStorage.setItem('taskvibe_last_registered_mobile', cleanMobileDigits);
              }
              localStorage.setItem('taskvibe_auto_open_forgot', 'true');
            } catch (e) {
              console.warn(e);
            }
            navigate('login');
          }}
          className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <KeyRound className="w-3 h-3 text-emerald-600" />
          <span>Forgot Password?</span>
        </button>
      </div>
    </div>
  );
};

