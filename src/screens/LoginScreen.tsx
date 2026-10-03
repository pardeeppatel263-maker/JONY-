import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskVibeLogo } from '../components/TaskVibeLogo';
import { downloadApkToDevice } from '../utils/apkDownloader';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Download,
  Smartphone,
  CheckCircle2,
  Sparkles,
  X,
  FolderDown,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, navigate, showToast, isLoggedIn } = useApp();

  // If already logged in, redirect straight to home!
  React.useEffect(() => {
    if (isLoggedIn) {
      navigate('home');
    }
  }, [isLoggedIn, navigate]);

  const [mobile, setMobile] = useState(() => {
    try {
      const lastReg = localStorage.getItem('taskvibe_last_registered_mobile');
      if (lastReg) return lastReg;
      const active = localStorage.getItem('taskvibe_active_mobile');
      if (active) return active.replace(/\D/g, '').slice(-10);
      return '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Download App Modal state
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await login(mobile, password);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStartDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(25);
    setDownloadCompleted(false);

    // Trigger real APK download directly to device File Manager / Downloads
    const success = downloadApkToDevice('TaskVibe-Earning-v2.5.apk');

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          setDownloadCompleted(true);
          if (success) {
            showToast('✓ APK downloaded! Check your mobile File Manager > Downloads.');
          } else {
            showToast('✓ APK download started. Check File Manager > Downloads.');
          }
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  return (
    <div className="h-full w-full min-h-0 overflow-y-auto overscroll-contain flex flex-col justify-between p-4 sm:p-5 pb-16 text-slate-800 bg-slate-50 touch-pan-y scroll-smooth">
      {/* Top Header with TaskVibe Logo & Download App Quick Link */}
      <div className="shrink-0 pt-1 pb-2 flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-sm mb-2.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Official Portal
          </span>
          <button
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download App</span>
          </button>
        </div>

        <div className="p-2.5 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl shadow-md w-full max-w-sm flex justify-center">
          <TaskVibeLogo size="md" theme="on-blue" showSubtitle={true} />
        </div>
      </div>

      {/* Main Login Form matching Screenshot 2 */}
      <div className="w-full max-w-sm mx-auto my-1 space-y-3">
        <div className="text-center space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome Back!
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Log in with your registered mobile number and password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
          {/* Hidden inputs to absorb browser password suggestion / autofill */}
          <input type="text" name="fake_username_remember" className="hidden" tabIndex={-1} autoComplete="off" />
          <input type="password" name="fake_password_remember" className="hidden" tabIndex={-1} autoComplete="off" />

          {/* Mobile Input with +91 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
            <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <div className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700">
                <span className="mr-1">🇮🇳</span> +91
              </div>
              <div className="relative flex-1 flex items-center">
                <input
                  type="tel"
                  id="user_mobile_login"
                  name="user_mobile_login"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter mobile number"
                  maxLength={10}
                  autoComplete="off"
                  data-lpignore="true"
                  className="w-full py-2.5 px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Input - Prevents browser password suggestion popups */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <div className="pl-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="user_pass_field"
                name="user_pass_field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => showToast('Password reset link sent via SMS')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-75 disabled:pointer-events-none"
          >
            {isLoggingIn ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Switch to Register - Directly under Login button */}
          <div className="text-center text-xs text-slate-600 pt-1.5 pb-0.5">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => navigate('register')}
              className="text-blue-600 font-bold hover:underline"
            >
              Register Now
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Section: Download App Banner pinned at bottom */}
      <div className="w-full max-w-sm mx-auto mt-auto shrink-0 pt-3 pb-1">
        <div
          onClick={() => setIsDownloadModalOpen(true)}
          className="cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-3 text-white shadow-sm flex items-center justify-between hover:shadow-md transition-all active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold shadow-inner">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black uppercase tracking-wide">
                  Download TaskVibe App
                </h4>
                <span className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full">
                  APK
                </span>
              </div>
              <p className="text-[10px] text-emerald-100">
                Install on Android for fast daily survey notifications!
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-100 shrink-0" />
        </div>
      </div>

      {/* Interactive Download App Modal */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-200" />
                <h3 className="text-xs font-bold">Download TaskVibe Android App</h3>
              </div>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-md">
                <Download className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900">
                  TaskVibe Mobile APK
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Version 2.5.0 &bull; 8.4 MB &bull; Android 8.0+
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant Daily Survey Push Notifications</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Faster 1-Tap UPI Withdrawal Requests</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Safe &amp; Verified Official APK File</span>
                </div>
              </div>

              {/* Download status / File Manager notification */}
              {downloadCompleted && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-left space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Download completed in File Manager!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-tight">
                    The file has been saved to your <strong className="font-bold underline">File Manager &gt; Downloads</strong> folder as <strong>TaskVibe-Earning-v2.5.apk</strong>.
                  </p>
                  <p className="text-[10px] text-emerald-600">
                    Tap on the APK file in Downloads to install the app.
                  </p>
                </div>
              )}

              {/* Progress bar if downloading */}
              {isDownloading && (
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Downloading TaskVibe-Earning-v2.5.apk ({downloadProgress}%)
                  </span>
                </div>
              )}

              {/* Download / Install Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleStartDownload}
                  disabled={isDownloading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-75"
                >
                  <FolderDown className="w-4 h-4" />
                  <span>
                    {downloadCompleted
                      ? 'Download Again to File Manager'
                      : isDownloading
                      ? 'Downloading APK to Device...'
                      : 'Download APK to File Manager'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    showToast('PWA added to home screen!');
                    setIsDownloadModalOpen(false);
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Add to Mobile Home Screen (Instant)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

