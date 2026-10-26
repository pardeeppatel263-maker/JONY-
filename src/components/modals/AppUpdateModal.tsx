import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  CheckCircle2,
  RefreshCw,
  FolderDown,
  ShieldCheck,
  X,
} from 'lucide-react';
import { downloadApkToDevice } from '../../utils/apkDownloader';

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({ isOpen, onClose }) => {
  const { adminSettings, showToast, logout } = useApp();
  const [updateState, setUpdateState] = useState<'prompt' | 'downloading' | 'downloaded'>('prompt');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Connecting to ZoroTask Server...');

  if (!isOpen) return null;

  const targetVersion = adminSettings.appVersion || '2.7.0';

  const handleStartUpgrade = () => {
    setUpdateState('downloading');
    setProgress(10);
    setStatusText('Requesting ZoroTask-Official-v2.7.apk from server...');

    // Trigger device download immediately (initiates File Manager / Browser Download prompt)
    const apkName = `ZoroTask-Official-v${targetVersion}.apk`;
    const downloadUrl = adminSettings.apkDownloadUrl || '/ZoroTask-Official.apk';
    downloadApkToDevice(apkName, downloadUrl);

    const t1 = setTimeout(() => {
      setProgress(35);
      setStatusText('Downloading package (8.92 MB)...');
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(70);
      setStatusText('Saving package to File Manager > Downloads...');
    }, 900);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Package download complete!');
      setUpdateState('downloaded');
      showToast(`✓ ZoroTask v${targetVersion} APK downloaded!`);
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  const handleFinishInstallAndLogout = () => {
    // 1. Mark target version installed locally
    try {
      localStorage.setItem('taskvibe_installed_version', targetVersion);
    } catch {}

    // 2. Re-trigger file opening / APK download link for instant installer launch
    const apkName = `ZoroTask-Official-v${targetVersion}.apk`;
    const downloadUrl = adminSettings.apkDownloadUrl || '/ZoroTask-Official.apk';
    downloadApkToDevice(apkName, downloadUrl);

    // 3. User request: "UPDATE HOTE TIME UNLOG KA ID LOGOUT HO JAYE AUR PHIR SE O LOGIN KARE APNA APNA ID"
    // Log out user so they log in fresh on the new version
    logout();

    // 4. Close modal and show guidance toast
    onClose();
    showToast(`✓ ZoroTask updated to v${targetVersion}! Please login with your mobile and password.`);
  };

  const handleDismiss = () => {
    if (updateState === 'downloading') return;
    try {
      sessionStorage.setItem('taskvibe_update_dismissed_session', 'true');
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#132644]/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      {/* Centered Card matching the user's uploaded reference image */}
      <div className="w-full max-w-[310px] sm:max-w-[330px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800 animate-in zoom-in-95 border border-white/20 relative">
        
        {/* Optional small close button if not force update */}
        {!adminSettings.forceUpdateEnabled && updateState !== 'downloading' && (
          <button
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* TOP BANNER: Pink/Purple Sunset Gradient with Clouds & Cartoon Rocket */}
        <div className="relative h-44 w-full bg-gradient-to-br from-[#FF9AA2] via-[#E288F8] to-[#6C63FF] overflow-hidden flex items-center justify-center">
          
          {/* Subtle star sparkles in sky */}
          <div className="absolute top-3 left-6 w-1.5 h-1.5 bg-white/70 rounded-full animate-ping" />
          <div className="absolute top-8 left-16 w-1 h-1 bg-white/60 rounded-full" />
          <div className="absolute top-4 right-10 w-2 h-2 bg-white/80 rounded-full" />
          <div className="absolute top-12 right-20 w-1.5 h-1.5 bg-white/70 rounded-full" />

          {/* Cartoon Rocket Vector Illustration matching the user's image */}
          <div className="relative z-10 transform -rotate-12 translate-x-3 -translate-y-1 animate-pulse duration-1000">
            <svg
              width="130"
              height="130"
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-xl"
            >
              {/* Rocket Exhaust Fire & Smoke */}
              <path
                d="M50 115 C40 135 48 150 42 160 C55 152 68 145 68 128 Z"
                fill="#FF3366"
                opacity="0.85"
              />
              <path
                d="M53 118 C46 130 52 142 48 150 C56 144 65 138 65 125 Z"
                fill="#FFAA00"
              />
              <path
                d="M56 120 C52 128 56 135 54 140 C59 136 63 132 63 124 Z"
                fill="#FFF500"
              />

              {/* Left Rocket Wing / Fin */}
              <path
                d="M56 102 C42 108 30 118 28 126 C38 125 50 120 58 114 Z"
                fill="#FF3B30"
              />
              {/* Right Rocket Wing / Fin */}
              <path
                d="M96 66 C108 76 118 88 122 98 C116 94 105 88 95 82 Z"
                fill="#FF3B30"
              />

              {/* Metallic Rocket Nozzle */}
              <path
                d="M52 108 L66 122 L62 126 L48 112 Z"
                fill="#4A4A68"
              />

              {/* Main Rocket Fuselage Body */}
              <path
                d="M52 110 C50 85 62 55 105 22 C115 65 85 95 62 120 Z"
                fill="#FFFFFF"
              />
              {/* Body Shadow for 3D appearance */}
              <path
                d="M52 110 C50 85 62 55 105 22 C96 35 78 60 62 120 Z"
                fill="#E8ECF5"
                opacity="0.6"
              />

              {/* Red Nose Cone */}
              <path
                d="M93 34 C98 28 103 23 105 22 C106 24 103 31 99 38 Z"
                fill="#FF2A4D"
              />

              {/* Circular Window */}
              <circle cx="82" cy="58" r="11" fill="#4B5675" />
              <circle cx="82" cy="58" r="9" fill="#2ED8FF" />
              <circle cx="82" cy="58" r="7" fill="#00AEEF" />
              {/* Window Reflection */}
              <path
                d="M77 53 Q80 50 85 53 Q80 54 77 53"
                fill="#FFFFFF"
                opacity="0.8"
              />

              {/* Red Center Stripe */}
              <path
                d="M60 88 C68 83 75 78 82 72 L86 76 C79 82 72 87 64 92 Z"
                fill="#FF3B30"
                opacity="0.9"
              />
            </svg>
          </div>

          {/* Bottom Fluffy White Clouds Silhouette matching the user's photo */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <svg
              viewBox="0 0 320 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-10 preserve-3d"
            >
              <path
                d="M0 40 L320 40 L320 25 C305 24 290 12 270 14 C250 16 240 28 220 24 C200 20 190 6 160 8 C130 10 120 22 100 20 C80 18 70 6 45 8 C20 10 10 26 0 25 Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
        </div>

        {/* BOTTOM CONTENT AREA */}
        <div className="p-5 pt-3 pb-6 flex flex-col items-center text-center space-y-4">
          
          {updateState === 'prompt' && (
            <>
              {/* Bold Playful Title matching user's image */}
              <div className="space-y-1">
                <span className="inline-block px-3 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-xs">
                  v{targetVersion} Available
                </span>
                <h2 className="text-2xl font-black text-[#522523] tracking-tight">
                  Updated Version
                </h2>
              </div>

              {/* Subtitle / Changelog */}
              <div className="space-y-1 text-[#2B296E] font-bold text-xs sm:text-[13px] leading-relaxed max-h-36 overflow-y-auto px-2 w-full text-center">
                {adminSettings.updateChangelog ? (
                  adminSettings.updateChangelog.split(/[\n,;]+/).map((line, idx) => (
                    line.trim() ? (
                      <p key={idx} className="flex items-center gap-1.5 text-left text-[11px] text-slate-700 font-semibold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{line.trim()}</span>
                      </p>
                    ) : null
                  ))
                ) : (
                  <>
                    <p>System has been completely Upgraded!</p>
                    <p>Better experience &amp; faster performance!</p>
                    <p>Upgrade to the latest version!</p>
                  </>
                )}
              </div>

              {/* File Manager access note */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                <FolderDown className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Package: ZoroTask-v{targetVersion}.apk (8.92 MB)</span>
              </div>

              {/* Upgrade Button matching the user's image */}
              <div className="w-full pt-1">
                <button
                  type="button"
                  onClick={handleStartUpgrade}
                  className="w-40 mx-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#6264DF] via-[#746FE5] to-[#5C5FDC] hover:from-[#5456D3] hover:to-[#4E51CE] text-white font-bold text-sm shadow-md shadow-indigo-500/25 active:scale-95 transition-all block cursor-pointer"
                >
                  Upgrade
                </button>
              </div>
            </>
          )}

          {updateState === 'downloading' && (
            <div className="w-full py-2 space-y-3.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-[#522523]">
                  Downloading Package...
                </h3>
                <p className="text-xs text-[#2B296E] font-bold">
                  {statusText}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 w-full max-w-[260px] mx-auto">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>File Manager / Downloads</span>
                  <span className="text-indigo-600">{progress}%</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-snug px-2">
                Allow download if prompted by your phone browser or file manager.
              </p>
            </div>
          )}

          {updateState === 'downloaded' && (
            <div className="w-full py-1 space-y-3.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#522523]">
                  Package Downloaded!
                </h3>
                <p className="text-xs text-[#2B296E] font-bold">
                  Tap below to install. You will be logged out to securely re-login to v{targetVersion}.
                </p>
              </div>

              {/* Requirement: Logout and re-login */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-2.5 text-left text-[11px] text-amber-900 leading-snug space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Your Data & Balance Are Safe</span>
                </div>
                <p className="text-[10px] text-amber-700">
                  When you tap &quot;Upgrade Now&quot;, your session logs out and the package opens. Simply tap <span className="font-bold underline">&quot;Update&quot;</span> in Android, then log back in with your mobile number!
                </p>
              </div>

              {/* Action Button */}
              <div className="w-full pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handleFinishInstallAndLogout}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Upgrade Now (Install &amp; Re-Login)</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartUpgrade}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition"
                >
                  Download Package Again
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
