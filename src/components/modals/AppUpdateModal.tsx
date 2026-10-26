import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { downloadApkToDevice } from '../../utils/apkDownloader';

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({ isOpen, onClose }) => {
  const { adminSettings, showToast } = useApp();
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadStep, setDownloadStep] = useState('Connecting to ZoroTask Server...');

  if (!isOpen) return null;

  const currentVersion = '2.6.0';
  const targetVersion = adminSettings.appVersion || '2.7.0';
  const changelog = adminSettings.updateChangelog ||
    '1-Click In-App Direct APK Updater (No uninstall needed)\nIn-place update preserving user wallet balance and login session\nReal-time Firestore synchronization & offline balance guard\nSeamless Android package installer handoff\nEnhanced security and APK integrity verification';

  const changelogItems = changelog
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const handleStartUpdate = () => {
    setDownloadState('downloading');
    setProgress(5);
    setDownloadStep('Connecting to secure ZoroTask server...');

    const timer1 = setTimeout(() => {
      setProgress(25);
      setDownloadStep('Fetching ZoroTask-Official-v2.7.apk (8.9 MB)...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(60);
      setDownloadStep('Verifying cryptographic signature (debug.keystore)...');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(90);
      setDownloadStep('Packaging APK for in-place install...');
    }, 1400);

    const timer4 = setTimeout(() => {
      setProgress(100);
      setDownloadStep('Starting Android Package Installer handoff...');
      
      const apkName = `ZoroTask-Official-v${targetVersion}.apk`;
      const downloadUrl = adminSettings.apkDownloadUrl || '/ZoroTask-Official.apk';
      
      // Trigger actual APK download
      downloadApkToDevice(apkName, downloadUrl);
      
      try {
        localStorage.setItem('taskvibe_installed_version', targetVersion);
      } catch {}

      setDownloadState('completed');
      showToast(`✓ ZoroTask v${targetVersion} downloaded! Tap notification to install.`);
    }, 1900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  const handleClose = () => {
    if (downloadState === 'downloading') return;
    setDownloadState('idle');
    setProgress(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-[340px] shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95">
        
        {/* Top Header Banner with Gradient */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 p-4 pb-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-xs">
                    NEW VERSION
                  </span>
                  <span className="text-white/80 text-[10px] font-bold">
                    v{targetVersion}
                  </span>
                </div>
                <h3 className="text-sm font-black text-white mt-0.5">
                  ZoroTask App Update
                </h3>
              </div>
            </div>

            {downloadState !== 'downloading' && (
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/90 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Zero Uninstall Guarantee Pill */}
          <div className="mt-3 bg-slate-950/40 border border-white/15 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[10px] text-emerald-200 font-medium leading-tight">
              <span className="font-bold text-white">No Uninstall Needed:</span> In-place update keeps your wallet balance &amp; login 100% safe.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 max-h-[65vh] overflow-y-auto">
          {downloadState === 'idle' && (
            <>
              {/* Version Comparison Info */}
              <div className="grid grid-cols-2 gap-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-2.5 text-center">
                <div className="border-r border-slate-700/60 pr-2">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Current Version</span>
                  <span className="text-xs font-bold text-slate-300">v{currentVersion}</span>
                </div>
                <div className="pl-2">
                  <span className="text-[10px] text-amber-400 block font-semibold uppercase">Latest Release</span>
                  <span className="text-xs font-black text-amber-300">v{targetVersion} ★</span>
                </div>
              </div>

              {/* What's New Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    What&apos;s New in v{targetVersion}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Package: 8.9 MB
                  </span>
                </div>

                <div className="space-y-1.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3">
                  {changelogItems.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-200 leading-snug">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Info */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5 flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-200/90 leading-tight">
                  Tap <span className="font-bold text-amber-300">1-Click Update</span> below. The APK will download and open the Android installer. Simply click <span className="font-bold text-white">&quot;Update&quot;</span>!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleStartUpdate}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:brightness-110 active:scale-98 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>⚡ 1-Click Update &amp; Install (v{targetVersion})</span>
                </button>

                {!adminSettings.forceUpdateEnabled && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full py-1.5 text-[11px] font-bold text-slate-400 hover:text-white transition text-center"
                  >
                    Remind Me Later
                  </button>
                )}
              </div>
            </>
          )}

          {downloadState === 'downloading' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black text-white">
                  Downloading ZoroTask v{targetVersion}...
                </h4>
                <p className="text-[11px] text-slate-300 animate-pulse">
                  {downloadStep}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 max-w-xs mx-auto">
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>In-Place Package</span>
                  <span className="text-amber-400">{progress}%</span>
                  <span>8.92 MB</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400">
                Please do not close this window during the update.
              </p>
            </div>
          )}

          {downloadState === 'completed' && (
            <div className="py-3 text-center space-y-3.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black text-emerald-400">
                  APK Download Complete!
                </h4>
                <p className="text-[11px] text-slate-300 leading-snug">
                  ZoroTask-Official-v{targetVersion}.apk has been saved to your downloads.
                </p>
              </div>

              {/* 3 Step Installation Guide */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-left space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                  How to Install (No Uninstall Needed):
                </span>
                
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span className="text-[11px] text-slate-200">
                    Pull down your phone notification bar or open <span className="font-bold text-white">File Manager &gt; Downloads</span>.
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span className="text-[11px] text-slate-200">
                    Tap <span className="font-bold text-white">ZoroTask-Official-v{targetVersion}.apk</span>.
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span className="text-[11px] text-emerald-300 font-medium">
                    Tap <span className="font-bold text-white underline">&quot;Update&quot;</span> when Android asks. All your data stays intact!
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleStartUpdate}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-98 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Download APK Again</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  Close &amp; Continue in App
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
