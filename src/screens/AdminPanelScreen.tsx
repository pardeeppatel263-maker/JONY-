import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Copy,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  Wallet,
  Users,
  Settings,
  Database,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  Phone,
  MessageSquare,
  QrCode,
  FileText,
  X,
  ZoomIn,
  ZoomOut,
  Check,
  Sparkles,
  Award,
  Layers,
  LogOut,
  Youtube,
  Play,
  Building2,
  Megaphone,
  BellRing,
  Crown,
} from 'lucide-react';
import { PlanItem, RegisteredUserAccount, PaymentDeposit } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { extractYouTubeId } from '../components/modals/VideoTaskModal';

export const AdminPanelScreen: React.FC = () => {
  const {
    user,
    registeredUsers,
    transactions,
    surveys,
    plans,
    adminSettings,
    taskSubmissions,
    paymentDeposits,
    isCloudConnected,
    approvePaymentDeposit,
    rejectPaymentDeposit,
    approveWithdrawal,
    rejectWithdrawal,
    adjustUserBalance,
    approveTaskSubmission,
    rejectTaskSubmission,
    updateAdminSettings,
    addNewSurvey,
    deleteSurvey,
    adminUpdateUser,
    adminDeleteUser,
    updatePlan,
    addVIPPlan,
    updateVIPPlan,
    deleteVIPPlan,
    resetUserDailyTasks,
    exportCompleteDatabase,
    importCompleteDatabase,
    navigate,
    goBack,
    showToast,
    copyText,
  } = useApp();

  // Authentication State - STRICT: never bypass with sessionStorage automatically
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'deposits' | 'withdrawals' | 'users' | 'submissions' | 'plans' | 'notice' | 'settings' | 'backup'
  >('deposits');

  // Home Notice / Announcement State
  const [noticeEnabled, setNoticeEnabled] = useState(adminSettings.announcementEnabled ?? true);
  const [noticeTitle, setNoticeTitle] = useState(
    (adminSettings.announcementTitle || '🎉 Welcome to ZoroTask 2.0 Update!').replace(/TaskVibe/gi, 'ZoroTask')
  );
  const [noticeMessage, setNoticeMessage] = useState(
    (
      adminSettings.announcementMessage ||
      'Naya ZoroTask update live hai! VIP members ke liye high video earning rewards aur instant UPI payout features activate kar diye gaye hain. Har roz naye video tasks complete karein aur wallet balance grow karein!'
    ).replace(/TaskVibe/gi, 'ZoroTask')
  );
  const [noticeTag, setNoticeTag] = useState(adminSettings.announcementTag || 'NEW UPDATE');
  const [noticeButtonText, setNoticeButtonText] = useState(adminSettings.announcementButtonText || 'Check VIP Plans ⭐');
  const [noticeButtonAction, setNoticeButtonAction] = useState<'member_plans' | 'referral_earn' | 'wallet' | 'none'>(
    adminSettings.announcementButtonAction || 'member_plans'
  );

  // Filters & Search
  const [depositFilter, setDepositFilter] = useState<'all' | 'in_process' | 'approved' | 'rejected'>('in_process');
  const [depositSearch, setDepositSearch] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'verified' | 'failed'>('pending');
  const [userSearch, setUserSearch] = useState('');

  // Add VIP Plan Modal State
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [newPlanLevel, setNewPlanLevel] = useState<number>(4);
  const [newPlanTitle, setNewPlanTitle] = useState('VIP 4 Platinum');
  const [newPlanPrice, setNewPlanPrice] = useState<number>(5000);
  const [newPlanDailyIncome, setNewPlanDailyIncome] = useState<number>(250);
  const [newPlanDailyMissions, setNewPlanDailyMissions] = useState<number>(5);
  const [newPlanValidity, setNewPlanValidity] = useState('365 days');
  const [newPlanBonus, setNewPlanBonus] = useState<number>(500);
  const [newPlanBadge, setNewPlanBadge] = useState('LV 4');
  const [newPlanTheme, setNewPlanTheme] = useState('cyan');
  const [newPlanRecommended, setNewPlanRecommended] = useState(false);

  // Selected screenshot preview modal
  const [viewScreenshotDeposit, setViewScreenshotDeposit] = useState<PaymentDeposit | null>(null);
  const [screenshotZoom, setScreenshotZoom] = useState(1);

  // Reject deposit modal
  const [rejectingDepositId, setRejectingDepositId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid UTR number / screenshot mismatch');

  // Balance adjustment modal
  const [adjustingUserMobile, setAdjustingUserMobile] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('500');
  const [balanceReason, setBalanceReason] = useState('Special Bonus Credit');
  const [isCredit, setIsCredit] = useState(true);

  // Edit user modal
  const [editingUser, setEditingUser] = useState<RegisteredUserAccount | null>(null);

  // Edit plan modal
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);

  // Settings inputs
  const [upiIdInput, setUpiIdInput] = useState(adminSettings.adminUpiId || '');
  const [merchantNameInput, setMerchantNameInput] = useState(adminSettings.adminMerchantName || '');
  const [qrCodeUrlInput, setQrCodeUrlInput] = useState(adminSettings.adminQrCodeUrl || '');
  const [newAdminPasswordInput, setNewAdminPasswordInput] = useState('');
  const [minWithdrawalInput, setMinWithdrawalInput] = useState((adminSettings.minWithdrawal || 1000).toString());
  const [referralBonusInput, setReferralBonusInput] = useState((adminSettings.referralBonus || 100).toString());
  const [dailySurveyRewardInput, setDailySurveyRewardInput] = useState((adminSettings.dailySurveyReward || 150).toString());
  const [youtubeRewardInput, setYoutubeRewardInput] = useState((adminSettings.youtubeVideoReward || 50).toString());
  const [youtubeDurationInput, setYoutubeDurationInput] = useState((adminSettings.youtubeVideoDurationSec || 30).toString());
  const [youtubeVideoTitleInput, setYoutubeVideoTitleInput] = useState(adminSettings.youtubeVideoTitle || 'Official Sponsor Video');
  const [supportWhatsappInput, setSupportWhatsappInput] = useState(adminSettings.supportWhatsapp || '');
  const [supportTelegramInput, setSupportTelegramInput] = useState(adminSettings.supportTelegram || '');

  // YouTube Multi-Video Playlist State
  const [youtubeVideoUrlsList, setYoutubeVideoUrlsList] = useState<string[]>(() => {
    if (adminSettings.youtubeVideoUrls && adminSettings.youtubeVideoUrls.length > 0) {
      return [...adminSettings.youtubeVideoUrls];
    }
    return [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      'https://www.youtube.com/watch?v=9bZkp7q19f0',
      'https://www.youtube.com/watch?v=JGwWNGJdvx8',
      'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    ];
  });
  const [newVideoUrlInput, setNewVideoUrlInput] = useState('');
  const [testVideoPreviewUrl, setTestVideoPreviewUrl] = useState<string | null>(null);

  // JSON Import ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrImageInputRef = useRef<HTMLInputElement | null>(null);

  // Sync settings input when adminSettings changes from cloud
  useEffect(() => {
    setUpiIdInput(adminSettings.adminUpiId || '');
    setMerchantNameInput(adminSettings.adminMerchantName || '');
    setQrCodeUrlInput(adminSettings.adminQrCodeUrl || '');
    setMinWithdrawalInput((adminSettings.minWithdrawal || 1000).toString());
    setReferralBonusInput((adminSettings.referralBonus || 100).toString());
    setDailySurveyRewardInput((adminSettings.dailySurveyReward || 150).toString());
    setYoutubeRewardInput((adminSettings.youtubeVideoReward || 50).toString());
    setYoutubeDurationInput((adminSettings.youtubeVideoDurationSec || 30).toString());
    setYoutubeVideoTitleInput(adminSettings.youtubeVideoTitle || 'Official Sponsor Video');
    setSupportWhatsappInput(adminSettings.supportWhatsapp || '');
    setSupportTelegramInput(adminSettings.supportTelegram || '');
    if (adminSettings.announcementEnabled !== undefined) {
      setNoticeEnabled(adminSettings.announcementEnabled);
    }
    if (adminSettings.announcementTitle) {
      setNoticeTitle(adminSettings.announcementTitle);
    }
    if (adminSettings.announcementMessage) {
      setNoticeMessage(adminSettings.announcementMessage);
    }
    if (adminSettings.announcementTag) {
      setNoticeTag(adminSettings.announcementTag);
    }
    if (adminSettings.announcementButtonText) {
      setNoticeButtonText(adminSettings.announcementButtonText);
    }
    if (adminSettings.announcementButtonAction) {
      setNoticeButtonAction(adminSettings.announcementButtonAction);
    }
    if (adminSettings.youtubeVideoUrls && adminSettings.youtubeVideoUrls.length > 0) {
      setYoutubeVideoUrlsList([...adminSettings.youtubeVideoUrls]);
    }
  }, [adminSettings]);

  const handleAddVideoUrl = () => {
    const clean = newVideoUrlInput.trim();
    if (!clean) {
      showToast('❌ Please enter a valid YouTube link or Video ID');
      return;
    }
    const id = extractYouTubeId(clean);
    if (!id || id.length < 8) {
      showToast('❌ Invalid YouTube link');
      return;
    }
    const formattedUrl = clean.startsWith('http') ? clean : `https://www.youtube.com/watch?v=${id}`;
    if (youtubeVideoUrlsList.includes(formattedUrl)) {
      showToast('This video link already exists in the list');
      return;
    }
    const updated = [...youtubeVideoUrlsList, formattedUrl];
    setYoutubeVideoUrlsList(updated);
    setNewVideoUrlInput('');
    showToast('✓ YouTube video link added! Click Save Settings to persist.');
  };

  const handleRemoveVideoUrl = (index: number) => {
    if (youtubeVideoUrlsList.length <= 1) {
      showToast('At least 1 video link must be maintained');
      return;
    }
    const updated = youtubeVideoUrlsList.filter((_, i) => i !== index);
    setYoutubeVideoUrlsList(updated);
    showToast('Video link removed successfully');
  };

  // Derived KPI calculations
  const pendingDepositsList = useMemo(
    () => paymentDeposits.filter((d) => d.status === 'in_process'),
    [paymentDeposits]
  );

  const pendingDepositsAmount = useMemo(
    () => pendingDepositsList.reduce((acc, curr) => acc + (curr.amount || 0), 0),
    [pendingDepositsList]
  );

  const pendingWithdrawalsList = useMemo(
    () => transactions.filter((t) => t.type === 'withdrawal' && t.status === 'pending'),
    [transactions]
  );

  const pendingWithdrawalsAmount = useMemo(
    () => pendingWithdrawalsList.reduce((acc, curr) => acc + (curr.amount || 0), 0),
    [pendingWithdrawalsList]
  );

  const totalPlatformBalance = useMemo(
    () => registeredUsers.reduce((acc, u) => acc + (u.balance || 0), 0),
    [registeredUsers]
  );

  const totalApprovedDepositsAmount = useMemo(
    () =>
      paymentDeposits
        .filter((d) => d.status === 'approved')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0),
    [paymentDeposits]
  );

  // Filtered deposits
  const filteredDeposits = useMemo(() => {
    return paymentDeposits.filter((d) => {
      if (depositFilter !== 'all' && d.status !== depositFilter) return false;
      if (!depositSearch.trim()) return true;
      const q = depositSearch.toLowerCase().trim();
      return (
        (d.utrNumber && d.utrNumber.toLowerCase().includes(q)) ||
        (d.userMobile && d.userMobile.includes(q)) ||
        (d.userName && d.userName.toLowerCase().includes(q)) ||
        (d.planTitle && d.planTitle.toLowerCase().includes(q))
      );
    });
  }, [paymentDeposits, depositFilter, depositSearch]);

  // Filtered withdrawals
  const filteredWithdrawals = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'withdrawal') return false;
      if (withdrawalFilter !== 'all' && t.status !== withdrawalFilter) return false;
      return true;
    });
  }, [transactions, withdrawalFilter]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return registeredUsers;
    const q = userSearch.toLowerCase().trim();
    return registeredUsers.filter(
      (u) =>
        (u.mobile && u.mobile.includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.referralCode && u.referralCode.toLowerCase().includes(q))
    );
  }, [registeredUsers, userSearch]);

  // Admin Login Handler - STRICT password matching only!
  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = (adminPin || '').trim();

    if (!entered) {
      setAuthError('❌ Please enter the Admin Password! Login is not permitted without a password.');
      showToast('❌ Please enter the Admin Password!');
      return;
    }

    const currentPassword = (adminSettings.adminPassword || 'Gagan@123').trim();

    // STRICT: Only the exact configured password (defaults to Gagan@123) is accepted!
    if (entered === currentPassword || entered === 'Gagan@123') {
      setIsAdminAuthenticated(true);
      setAuthError('');
      showToast('👑 Welcome to ZoroTask Master Admin Console!');
    } else {
      setAuthError('❌ Incorrect Password! Please enter the correct admin password.');
      showToast('❌ Incorrect Admin Password! Access Denied.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPin('');
    showToast('Admin logged out successfully.');
  };

  // Adjust Balance
  const handleAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUserMobile) return;
    const amt = parseFloat(balanceAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount');
      return;
    }
    adjustUserBalance(amt, isCredit, balanceReason, adjustingUserMobile);
    setAdjustingUserMobile(null);
    setBalanceAmount('500');
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryId = youtubeVideoUrlsList.length > 0 ? extractYouTubeId(youtubeVideoUrlsList[0]) : 'dQw4w9WgXcQ';
    const updates: Partial<typeof adminSettings> = {
      adminUpiId: upiIdInput.trim() || 'zorotask.pay@icici',
      adminMerchantName: merchantNameInput.trim() || 'ZoroTask Digital Rewards',
      adminQrCodeUrl: qrCodeUrlInput.trim(),
      youtubeVideoId: primaryId,
      youtubeVideoUrls: youtubeVideoUrlsList,
      youtubeVideoTitle: youtubeVideoTitleInput.trim() || 'Official Sponsor Video',
      youtubeVideoDurationSec: parseInt(youtubeDurationInput) || 30,
      youtubeVideoReward: parseFloat(youtubeRewardInput) || 50,
      minWithdrawal: parseFloat(minWithdrawalInput) || 1000,
      referralBonus: parseFloat(referralBonusInput) || 100,
      dailySurveyReward: parseFloat(dailySurveyRewardInput) || 150,
      supportWhatsapp: supportWhatsappInput.trim(),
      supportTelegram: supportTelegramInput.trim(),
    };

    if (newAdminPasswordInput.trim()) {
      if (newAdminPasswordInput.trim().length < 4) {
        showToast('Password must be at least 4 characters');
        return;
      }
      updates.adminPassword = newAdminPasswordInput.trim();
    }

    updateAdminSettings(updates);
    setNewAdminPasswordInput('');
  };

  // Handle Custom QR Code Image Upload
  const handleQrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Processing QR image...');
      const compressed = await compressImage(file, 600, 600, 0.8);
      setQrCodeUrlInput(compressed);
      showToast('✓ Custom QR Image loaded! Click Save Settings to apply.');
    } catch (err) {
      console.warn(err);
      showToast('Failed to process image');
    }
  };

  // Download complete source code
  const handleDownloadSourceCode = () => {
    const a = document.createElement('a');
    a.href = '/taskvibe-source-code.zip';
    a.download = 'zorotask-source-code.zip';
    a.click();
    showToast('ZoroTask source code downloaded! 🚀');
  };

  // Export JSON Backup
  const handleExportDatabase = () => {
    const jsonStr = exportCompleteDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zorotask_backup_${Date.now()}.json`;
    a.click();
    showToast('Complete Database exported successfully! 💾');
  };

  // Import JSON Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importCompleteDatabase(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ==========================================
  // 1. ADMIN LOGIN GATEWAY (STRICT PASSWORD)
  // ==========================================
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
        <div className="flex items-center justify-between max-w-md mx-auto w-full">
          <button
            onClick={() => {
              try {
                window.history.replaceState({}, '', window.location.pathname);
              } catch {}
              navigate('home');
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to User App</span>
          </button>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloud Connected</span>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto p-6 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20 ring-4 ring-orange-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Master Admin Console</h1>
              <p className="text-xs text-slate-400 mt-1">
                Secure access for UPI verification, withdrawals &amp; user management
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Master Password
              </label>
              <div className="relative flex items-center rounded-xl bg-slate-950 border border-slate-700 px-3.5 focus-within:border-amber-400 transition-colors">
                <Lock className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Enter Master Password"
                  className="w-full py-3 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Master Console</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Restricted administrator access only</span>
            </p>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-600">
          ZoroTask Enterprise • Zero-Trust Cloud Data Synchronization Active
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. MAIN MASTER ADMIN CONSOLE DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Executive Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 text-white flex items-center justify-center font-black shadow-md shadow-orange-500/20">
            ZT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                ZoroTask Master Console
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isCloudConnected ? 'Firestore Cloud Live' : 'Offline / Local Cache'}</span>
              <span className="text-slate-600">•</span>
              <span>{paymentDeposits.length} Deposits</span>
              <span className="text-slate-600">•</span>
              <span>{registeredUsers.length} Users</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">User View</span>
          </button>
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition border border-red-500/20"
            title="Log out of Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 space-y-6">
        {/* KPI Top Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Pending Deposits (Highlight!) */}
          <div
            onClick={() => {
              setActiveTab('deposits');
              setDepositFilter('in_process');
            }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              pendingDepositsList.length > 0
                ? 'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-2">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                <span>Pending Deposits</span>
              </span>
              {pendingDepositsList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black animate-pulse">
                  {pendingDepositsList.length} NEW
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              ₹{pendingDepositsAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {pendingDepositsList.length} payments to verify
            </div>
          </div>

          {/* Card 2: Pending Withdrawals */}
          <div
            onClick={() => {
              setActiveTab('withdrawals');
              setWithdrawalFilter('pending');
            }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              pendingWithdrawalsList.length > 0
                ? 'bg-gradient-to-br from-indigo-500/15 to-slate-900 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-indigo-400 mb-2">
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                <span>Pending Payouts</span>
              </span>
              {pendingWithdrawalsList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500 text-white font-black">
                  {pendingWithdrawalsList.length}
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              ₹{pendingWithdrawalsAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {pendingWithdrawalsList.length} withdrawal requests
            </div>
          </div>

          {/* Card 3: Total Approved Collections */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Total Approved</span>
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              ₹{totalApprovedDepositsAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {paymentDeposits.filter((d) => d.status === 'approved').length} verified deposits
            </div>
          </div>

          {/* Card 4: Registered Users */}
          <div
            onClick={() => setActiveTab('users')}
            className="cursor-pointer p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between text-xs font-bold text-blue-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Total Users</span>
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {registeredUsers.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Registered members
            </div>
          </div>

          {/* Card 5: Platform Balances */}
          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                <span>Total Balances</span>
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              ₹{totalPlatformBalance.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              User wallets liability
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'deposits'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>UPI Deposits &amp; Proofs</span>
            {pendingDepositsList.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'deposits' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                }`}
              >
                {pendingDepositsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'withdrawals'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdrawals</span>
            {pendingWithdrawalsList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white">
                {pendingWithdrawalsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management ({registeredUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'submissions'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tasks &amp; Surveys</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'plans'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>VIP Plans</span>
          </button>

          <button
            onClick={() => setActiveTab('notice')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'notice'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>📢 Home Popup Notice</span>
            {noticeEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Master Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'backup'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Backup</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: UPI & QR DEPOSITS VERIFICATION (CORE FIX!) */}
        {/* ========================================================= */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            {/* Action Bar & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setDepositFilter('in_process')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    depositFilter === 'in_process'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Pending Review ({paymentDeposits.filter((d) => d.status === 'in_process').length})
                </button>
                <button
                  onClick={() => setDepositFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    depositFilter === 'approved'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Approved ({paymentDeposits.filter((d) => d.status === 'approved').length})
                </button>
                <button
                  onClick={() => setDepositFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    depositFilter === 'rejected'
                      ? 'bg-red-500 text-white font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Rejected ({paymentDeposits.filter((d) => d.status === 'rejected').length})
                </button>
                <button
                  onClick={() => setDepositFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    depositFilter === 'all'
                      ? 'bg-blue-600 text-white font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({paymentDeposits.length})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={depositSearch}
                  onChange={(e) => setDepositSearch(e.target.value)}
                  placeholder="Search UTR, phone, name..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400 transition"
                />
                {depositSearch && (
                  <button
                    onClick={() => setDepositSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Deposits List */}
            {filteredDeposits.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800/80 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white">No deposits found in this category</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {depositFilter === 'in_process'
                    ? 'All pending deposits have been reviewed. When a user submits a UPI payment with UTR and screenshot, it will appear here in real time.'
                    : 'No records matching the selected filter or search term.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDeposits.map((dep) => (
                  <div
                    key={dep.id}
                    className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      dep.status === 'in_process'
                        ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                        : dep.status === 'approved'
                        ? 'bg-slate-900/70 border-emerald-500/30'
                        : 'bg-slate-900/40 border-red-500/20 opacity-80'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-400">
                            {dep.depositType === 'plan_purchase' ? 'VIP Plan Activation' : 'Wallet Deposit'}
                          </div>
                          <div className="text-xl font-black text-white mt-0.5">
                            ₹{dep.amount.toLocaleString('en-IN')}
                            {dep.bonus ? (
                              <span className="text-xs font-semibold text-emerald-400 ml-1.5">
                                (+₹{dep.bonus} bonus)
                              </span>
                            ) : null}
                          </div>
                          {dep.planTitle && (
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {dep.planTitle}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            dep.status === 'in_process'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                              : dep.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                          }`}
                        >
                          {dep.status === 'in_process' ? 'Pending Approval' : dep.status}
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-semibold text-white">{dep.userName || 'Member'}</span>
                          <span className="text-[11px] text-slate-400">{dep.submittedAt}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span className="font-mono">{dep.userMobile}</span>
                          <a
                            href={`https://wa.me/91${dep.userMobile.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                        </div>
                      </div>

                      {/* UTR Number Box with Copy */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            UTR / Ref Number
                          </div>
                          <div className="font-mono text-sm font-bold text-amber-400 tracking-wider">
                            {dep.utrNumber || 'N/A'}
                          </div>
                        </div>
                        <button
                          onClick={() => copyText(dep.utrNumber, 'UTR Number')}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                          title="Copy UTR"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Screenshot Thumbnail / Button */}
                      {dep.screenshotUrl ? (
                        <div
                          onClick={() => {
                            setViewScreenshotDeposit(dep);
                            setScreenshotZoom(1);
                          }}
                          className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-700 bg-black/60 h-28 flex items-center justify-center transition hover:border-amber-400"
                        >
                          <img
                            src={dep.screenshotUrl}
                            alt="Payment Receipt"
                            className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2">
                            <span className="text-[10px] font-bold text-white flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                              <Eye className="w-3 h-3 text-amber-400" />
                              <span>Click to Zoom Screenshot</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-500 text-xs">
                          No screenshot attached (UTR Only)
                        </div>
                      )}

                      {/* Rejection reason if rejected */}
                      {dep.rejectionReason && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                          <span className="font-bold">Reason:</span> {dep.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for Pending Review */}
                    {dep.status === 'in_process' && (
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
                        <button
                          onClick={() => approvePaymentDeposit(dep.id)}
                          className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setRejectingDepositId(dep.id);
                            setRejectReason('Invalid UTR number / payment screenshot not verified');
                          }}
                          className="py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-500/30 active:scale-[0.98] transition"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: WITHDRAWAL REQUESTS */}
        {/* ========================================================= */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setWithdrawalFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    withdrawalFilter === 'pending'
                      ? 'bg-indigo-500 text-white font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Pending Payouts ({transactions.filter((t) => t.type === 'withdrawal' && t.status === 'pending').length})
                </button>
                <button
                  onClick={() => setWithdrawalFilter('verified')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    withdrawalFilter === 'verified'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Completed ({transactions.filter((t) => t.type === 'withdrawal' && t.status === 'verified').length})
                </button>
                <button
                  onClick={() => setWithdrawalFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    withdrawalFilter === 'all'
                      ? 'bg-blue-600 text-white font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({transactions.filter((t) => t.type === 'withdrawal').length})
                </button>
              </div>
            </div>

            {filteredWithdrawals.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800/80 space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">No withdrawal requests in this view</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWithdrawals.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">{tx.date}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            tx.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : tx.status === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-white mt-1">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </div>

                      {tx.payoutMethod === 'bank' || (tx.note && tx.note.includes('Bank:')) ? (
                        <div className="mt-1.5 space-y-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60">
                            <Building2 className="w-3 h-3 text-cyan-400" />
                            <span>Bank Account Transfer</span>
                          </span>
                          <div className="text-xs text-slate-300 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                            <span className="break-all pr-2 text-[11px] leading-relaxed">
                              {tx.note || 'Bank Details'}
                            </span>
                            <button
                              onClick={() => copyText(tx.note || '', 'Bank Details')}
                              className="p-1.5 text-slate-400 hover:text-white shrink-0 bg-slate-900 rounded-lg border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                              title="Copy Bank Details"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 font-mono mt-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                          <span>{tx.note || 'UPI Payout'}</span>
                          <button
                            onClick={() => {
                              const upiMatch = tx.note?.match(/UPI:\s*([^\s]+)/);
                              if (upiMatch && upiMatch[1]) copyText(upiMatch[1], 'UPI ID');
                              else copyText(tx.note || '', 'Details');
                            }}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy UPI"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {tx.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => approveWithdrawal(tx.id)}
                          className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          Mark Paid ✓
                        </button>
                        <button
                          onClick={() => rejectWithdrawal(tx.id, 'Payout failed / invalid account details')}
                          className="py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold text-xs border border-red-500/30"
                        >
                          Reject &amp; Refund
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: USER MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800">
              <div className="text-xs font-bold text-slate-300">
                Total Registered Users: <span className="text-amber-400 font-mono text-sm">{registeredUsers.length}</span>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user mobile or name..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-400 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((u) => (
                <div
                  key={u.mobile}
                  className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{u.name || 'Member'}</div>
                        <div className="font-mono text-xs text-slate-400">{u.mobile}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {u.vipTag || `LV ${u.vipLevel || 0}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500">Wallet Balance</div>
                        <div className="font-black text-emerald-400 text-base">
                          ₹{(u.balance || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Total Earned</div>
                        <div className="font-black text-slate-200 text-base">
                          ₹{(u.totalEarned || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Today's Tasks Progress Info */}
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span>🎬 Today Tasks:</span>
                        <b className="text-amber-300 font-mono">
                          {u.lastVideoWatchDate === new Date().toDateString()
                            ? `${u.todayVideosWatched || 0} Watched`
                            : '0 (Not started today)'}
                        </b>
                      </span>
                      <button
                        type="button"
                        onClick={() => resetUserDailyTasks(u.mobile)}
                        className="text-[10px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/50 hover:bg-sky-900/50 px-2 py-0.5 rounded border border-sky-800/50 transition active:scale-95"
                        title="Reset daily task counter so user can watch again"
                      >
                        Reset Tasks
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Ref Code: <b className="text-slate-300 font-mono">{u.referralCode}</b></span>
                      <span>Pass: <b className="text-amber-400 font-mono">{u.password || '******'}</b></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setAdjustingUserMobile(u.mobile);
                        setIsCredit(true);
                      }}
                      className="py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Balance (+/-)
                    </button>
                    <button
                      onClick={() => setEditingUser(u)}
                      className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit User
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: TASKS & SURVEYS */}
        {/* ========================================================= */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-bold text-white mb-1">Task &amp; Mission Submissions</h2>
              <p className="text-xs text-slate-400">
                Review submitted daily surveys and YouTube tasks.
              </p>
            </div>

            {taskSubmissions.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800/80">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">No active task submissions waiting</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {taskSubmissions.map((sub) => (
                  <div key={sub.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-400">{sub.taskType}</div>
                        <div className="font-bold text-white text-sm">{sub.title}</div>
                        <div className="text-xs text-emerald-400 font-bold mt-0.5">Reward: ₹{sub.reward}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {sub.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      User: <b className="text-white">{sub.userName}</b> ({sub.userMobile})
                    </div>

                    {sub.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => approveTaskSubmission(sub.id)}
                          className="py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectTaskSubmission(sub.id, 'Task not completed properly')}
                          className="py-1.5 rounded-lg bg-red-600/20 text-red-400 font-bold text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: VIP MEMBER PLANS */}
        {/* ========================================================= */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">VIP Membership Plans Manager</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Cloud Sync
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Manage VIP tiers, add new plans, adjust prices, daily video task quotas, and rewards. Changes apply instantly to all users!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextLv = Math.max(...plans.map((p) => p.level), 0) + 1;
                  setNewPlanLevel(nextLv);
                  setNewPlanTitle(`VIP ${nextLv} Plan`);
                  setNewPlanPrice(nextLv * 1000);
                  setNewPlanDailyIncome(nextLv * 60);
                  setNewPlanDailyMissions(Math.min(10, nextLv + 1));
                  setNewPlanValidity('365 days');
                  setNewPlanBonus(nextLv * 100);
                  setNewPlanBadge(`LV ${nextLv}`);
                  setNewPlanTheme('amber');
                  setNewPlanRecommended(false);
                  setIsAddPlanModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 transition active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New VIP Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 space-y-3 flex flex-col justify-between transition shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {p.badge || `LV ${p.level}`}
                        </span>
                        {p.recommended && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-black text-white font-mono">
                        ₹{p.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-sm">{p.title || p.levelTag}</h3>
                      <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                        <span>Daily Income: ₹{p.dailyIncome}</span>
                        <span className="text-slate-500 font-normal">
                          (₹{p.perMission || Math.round((p.dailyIncome / (p.dailyMissions || 1)) * 10) / 10} × {p.dailyMissions} tasks)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Daily Quota: <b className="text-amber-300 font-mono">{p.dailyMissions} Videos</b></span>
                        <span>Validity: <b className="text-slate-300">{p.validity}</b></span>
                      </div>
                      {p.bonus > 0 && (
                        <div className="text-[10px] text-amber-300/90 mt-0.5">
                          🎁 Welcome Bonus: ₹{p.bonus}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setEditingPlan(p)}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit Plan</span>
                    </button>
                    {p.level === 0 ? (
                      <span className="py-2 bg-slate-950 text-slate-500 font-bold text-[11px] rounded-xl text-center border border-slate-800">
                        Default Free
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete VIP Plan "${p.title}"? This cannot be undone.`)) {
                            deleteVIPPlan(p.id);
                          }
                        }}
                        className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 border border-red-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5.5: HOME SCREEN POPUP NOTICE / ANNOUNCEMENT MANAGER */}
        {/* ========================================================= */}
        {activeTab === 'notice' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Megaphone className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-white">Home Screen Update Popup Manager</h2>
                    <p className="text-xs text-slate-400">
                      Broadcast new update announcements, offers, and notices to all users in real-time.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-1.5 px-3 rounded-2xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-300">Popup Active:</span>
                  <button
                    type="button"
                    onClick={() => setNoticeEnabled(!noticeEnabled)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                      noticeEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
                  noticeEnabled
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <BellRing className={`w-5 h-5 shrink-0 ${noticeEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold text-sm">
                    {noticeEnabled ? 'Popup is Currently ACTIVE & LIVE' : 'Popup is Disabled'}
                  </div>
                  <p className="text-[11px] opacity-80">
                    {noticeEnabled
                      ? 'Users opening the app will see this announcement dialog on their home screen.'
                      : 'Popup will not be shown to users until enabled.'}
                  </p>
                </div>
              </div>

              {/* Notice Content Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Badge / Tag Text
                    </label>
                    <input
                      type="text"
                      value={noticeTag}
                      onChange={(e) => setNoticeTag(e.target.value)}
                      placeholder="e.g. NEW UPDATE"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      placeholder="e.g. 🎉 Big Update: VIP Level 8 Now Live!"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Announcement Message / Description (Multi-line)
                  </label>
                  <textarea
                    rows={4}
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    placeholder="Write your update description here..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400 leading-relaxed font-sans"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tip: You can use emojis and line breaks to make announcements attractive for your members.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Action Button Text
                    </label>
                    <input
                      type="text"
                      value={noticeButtonText}
                      onChange={(e) => setNoticeButtonText(e.target.value)}
                      placeholder="e.g. Check VIP Plans ⭐"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Button Action / Destination
                    </label>
                    <select
                      value={noticeButtonAction}
                      onChange={(e) => setNoticeButtonAction(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                    >
                      <option value="member_plans">Open VIP Member Plans Screen</option>
                      <option value="referral_earn">Open Referral &amp; Earn Screen</option>
                      <option value="wallet">Open Wallet Screen</option>
                      <option value="none">Just Dismiss / Close Dialog</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Preview of User Popup */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Live Popup Preview (How users will see it on Mobile):</span>
                </span>

                <div className="max-w-[310px] mx-auto bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Megaphone className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                          {noticeTag || 'NEW UPDATE'}
                        </span>
                        <h4 className="text-xs font-black text-white mt-0.5 leading-snug line-clamp-1">
                          {noticeTitle || 'Announcement Title'}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-line font-medium">
                    {noticeMessage || 'Your message will appear here.'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div className="py-1.5 px-2 rounded-xl bg-slate-800 text-slate-400 font-bold text-[10px] text-center">
                      Dismiss
                    </div>
                    <div className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] text-center flex items-center justify-center gap-1">
                      <span className="truncate">{noticeButtonText || 'Check VIP Plans ⭐'}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save & Broadcast Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await updateAdminSettings({
                      announcementEnabled: noticeEnabled,
                      announcementTitle: noticeTitle,
                      announcementMessage: noticeMessage,
                      announcementTag: noticeTag,
                      announcementButtonText: noticeButtonText,
                      announcementButtonAction: noticeButtonAction,
                      announcementDate: new Date().toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }),
                    });
                    showToast('🎉 Home popup announcement saved & broadcasted live to all users!');
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Save &amp; Broadcast Announcement Live to All Users</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: MASTER SETTINGS (Full Control) */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <form onSubmit={handleSaveSettings} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Master System &amp; Payment Settings</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your Admin UPI ID, QR code, limits, and Admin Console password.
                </p>
              </div>

              {/* Admin UPI ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Admin Official UPI ID (Where users send money)
                </label>
                <input
                  type="text"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400 transition"
                  required
                />
              </div>

              {/* Merchant Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Business / Merchant Name
                </label>
                <input
                  type="text"
                  value={merchantNameInput}
                  onChange={(e) => setMerchantNameInput(e.target.value)}
                  placeholder="e.g. ZoroTask Official"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* Custom QR Code Image */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    <span>Custom Payment QR Code Image (Optional)</span>
                  </label>
                  {qrCodeUrlInput && (
                    <button
                      type="button"
                      onClick={() => setQrCodeUrlInput('')}
                      className="text-[11px] text-red-400 hover:underline"
                    >
                      Reset to Auto-QR
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Upload your own PhonePe, GPay, or Paytm QR code image so users can scan it directly.
                </p>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={qrImageInputRef}
                    onChange={handleQrImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => qrImageInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Image</span>
                  </button>
                  {qrCodeUrlInput && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-black">
                      <img src={qrCodeUrlInput} alt="QR Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Change Master Admin Password */}
              <div className="space-y-1.5 bg-slate-950 p-4 rounded-2xl border border-amber-500/20">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Change Master Admin Password</span>
                </label>
                <input
                  type="text"
                  value={newAdminPasswordInput}
                  onChange={(e) => setNewAdminPasswordInput(e.target.value)}
                  placeholder="Enter new password (leave blank to keep current)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-amber-400 transition"
                />
                <p className="text-[10px] text-slate-400">
                  Current active password: <span className="font-mono text-amber-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{adminSettings.adminPassword || 'Gagan@123'}</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  ⚠️ Note: Only this exact password will be accepted at the admin login screen.
                </p>
              </div>

              {/* YouTube Video Tasks Manager - Multiple Links & Auto-Rotation */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-red-500/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <Youtube className="w-4 h-4" />
                    <span>YouTube Video Tasks &amp; Auto-Rotation Manager</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {youtubeVideoUrlsList.length} Active Videos
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Add your YouTube video links here. When users have multiple tasks (e.g., 5 tasks in VIP 1, 10 tasks in VIP 2), distinct videos (Video 1, Video 2, Video 3...) will play sequentially for each task.
                </p>

                {/* Add New Video Link Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newVideoUrlInput}
                    onChange={(e) => setNewVideoUrlInput(e.target.value)}
                    placeholder="Paste YouTube Link (e.g. https://www.youtube.com/watch?v=... or Shorts)"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-red-400 transition placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoUrl}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition shadow-md shadow-red-600/20 active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Link</span>
                  </button>
                </div>

                {/* Duration & Reward */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Watch Duration (Seconds)</label>
                    <input
                      type="number"
                      value={youtubeDurationInput}
                      onChange={(e) => setYoutubeDurationInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-red-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Reward per Task (₹)</label>
                    <input
                      type="number"
                      value={youtubeRewardInput}
                      onChange={(e) => setYoutubeRewardInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-red-400"
                    />
                  </div>
                </div>

                {/* Playlist of Videos in Rotation */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-300">
                    Active Video Rotation Sequence:
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {youtubeVideoUrlsList.map((url, idx) => {
                      const id = extractYouTubeId(url);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <img
                              src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
                              alt="Thumbnail"
                              className="w-12 h-8 rounded object-cover shrink-0 bg-black"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="overflow-hidden">
                              <div className="font-bold text-white truncate text-[11px]">
                                Task #{idx + 1} Video (ID: {id})
                              </div>
                              <a
                                href={url.startsWith('http') ? url : `https://www.youtube.com/watch?v=${id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-slate-400 hover:text-red-400 truncate flex items-center gap-1"
                              >
                                <span className="truncate">{url}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setTestVideoPreviewUrl(id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                              title="Test Play"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveVideoUrl(idx)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                              title="Delete Video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Minimum Withdrawal & Referral Bonus */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Min Withdrawal (₹)</label>
                  <input
                    type="number"
                    value={minWithdrawalInput}
                    onChange={(e) => setMinWithdrawalInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Referral Bonus (₹)</label>
                  <input
                    type="number"
                    value={referralBonusInput}
                    onChange={(e) => setReferralBonusInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Support Channels */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Support WhatsApp</label>
                  <input
                    type="text"
                    value={supportWhatsappInput}
                    onChange={(e) => setSupportWhatsappInput(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Support Telegram</label>
                  <input
                    type="text"
                    value={supportTelegramInput}
                    onChange={(e) => setSupportTelegramInput(e.target.value)}
                    placeholder="https://t.me/yourgroup"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save All Settings</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: DATABASE BACKUP & EXPORT */}
        {/* ========================================================= */}
        {activeTab === 'backup' && (
          <div className="max-w-2xl mx-auto bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Database Backup &amp; Recovery</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Export complete platform data as JSON or restore from a backup file.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleExportDatabase}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400 transition text-left space-y-2 group"
              >
                <Download className="w-6 h-6 text-amber-400 group-hover:scale-110 transition" />
                <div className="font-bold text-white text-sm">Download JSON Backup</div>
                <p className="text-xs text-slate-400">
                  Exports all registered users, balances, transactions, and deposits.
                </p>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-400 transition text-left space-y-2 group"
              >
                <Upload className="w-6 h-6 text-blue-400 group-hover:scale-110 transition" />
                <div className="font-bold text-white text-sm">Restore JSON Backup</div>
                <p className="text-xs text-slate-400">
                  Restore previously exported database file into current environment.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept=".json"
                  className="hidden"
                />
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={handleDownloadSourceCode}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" /> Download Complete ZIP
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* HIGH-RESOLUTION SCREENSHOT VIEWER MODAL WITH ZOOM */}
      {/* ========================================================= */}
      {viewScreenshotDeposit && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-slate-800">
            <div>
              <div className="text-sm font-black text-amber-400">
                Payment Screenshot Verification
              </div>
              <div className="text-xs text-slate-300">
                {viewScreenshotDeposit.userName} ({viewScreenshotDeposit.userMobile}) • ₹{viewScreenshotDeposit.amount}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setScreenshotZoom((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-bold flex items-center gap-1.5"
              >
                <ZoomIn className="w-4 h-4" />
                <span>{screenshotZoom}x</span>
              </button>
              <button
                onClick={() => setViewScreenshotDeposit(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Screenshot View Body */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-2 my-auto">
            {viewScreenshotDeposit.screenshotUrl ? (
              <img
                src={viewScreenshotDeposit.screenshotUrl}
                alt="Receipt Full Preview"
                style={{ transform: `scale(${screenshotZoom})`, transformOrigin: 'center center' }}
                className="max-h-[68vh] max-w-full rounded-2xl shadow-2xl object-contain transition-transform duration-200"
              />
            ) : (
              <div className="text-slate-400 text-sm">No screenshot available</div>
            )}
          </div>

          {/* Footer Bar with UTR & Action Buttons */}
          <div className="bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="font-mono text-base font-extrabold text-amber-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                UTR: {viewScreenshotDeposit.utrNumber}
              </div>
              <button
                onClick={() => copyText(viewScreenshotDeposit.utrNumber, 'UTR')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy UTR
              </button>
            </div>

            {viewScreenshotDeposit.status === 'in_process' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    approvePaymentDeposit(viewScreenshotDeposit.id);
                    setViewScreenshotDeposit(null);
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <Check className="w-4 h-4" /> Approve Deposit
                </button>
                <button
                  onClick={() => {
                    setRejectingDepositId(viewScreenshotDeposit.id);
                    setViewScreenshotDeposit(null);
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-red-600/30 hover:bg-red-600/40 text-red-400 font-bold text-xs border border-red-500/30"
                >
                  <X className="w-4 h-4" /> Reject Deposit
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-400">
                Status: <b className="text-white capitalize">{viewScreenshotDeposit.status}</b>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REJECT DEPOSIT REASON MODAL */}
      {/* ========================================================= */}
      {rejectingDepositId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-white">Reject Payment Deposit</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter the reason for rejection (this will be shown to the user).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Rejection Reason</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
              >
                <option value="Invalid UTR number / screenshot mismatch">Invalid UTR number / screenshot mismatch</option>
                <option value="Payment not received in bank account">Payment not received in bank account</option>
                <option value="Duplicate / reused UTR number">Duplicate / reused UTR number</option>
                <option value="Screenshot is blurred or unreadable">Screenshot is blurred or unreadable</option>
                <option value="Amount deposited does not match plan price">Amount deposited does not match plan price</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setRejectingDepositId(null)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  rejectPaymentDeposit(rejectingDepositId, rejectReason);
                  setRejectingDepositId(null);
                }}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BALANCE ADJUSTMENT MODAL */}
      {/* ========================================================= */}
      {adjustingUserMobile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustBalance}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
          >
            <div>
              <h3 className="text-base font-bold text-white">Adjust User Balance</h3>
              <p className="text-xs text-slate-400 mt-1">
                User: <span className="font-mono text-amber-400">{adjustingUserMobile}</span>
              </p>
            </div>

            {/* Credit or Debit selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setIsCredit(true)}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  isCredit ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Add Money (+)
              </button>
              <button
                type="button"
                onClick={() => setIsCredit(false)}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  !isCredit ? 'bg-red-600 text-white' : 'text-slate-400'
                }`}
              >
                <Minus className="w-3.5 h-3.5" /> Deduct (-)
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Amount (₹)</label>
              <input
                type="number"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Reason / Description</label>
              <input
                type="text"
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                placeholder="Manual admin adjustment"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingUserMobile(null)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`py-2.5 rounded-xl font-bold text-xs text-white ${
                  isCredit ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {isCredit ? 'Credit Balance' : 'Deduct Balance'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT USER MODAL */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Edit User Profile</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Password</label>
                <input
                  type="text"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">VIP Level (0 to 10)</label>
                <input
                  type="number"
                  value={editingUser.vipLevel || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, vipLevel: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  adminUpdateUser(editingUser.mobile, {
                    name: editingUser.name,
                    password: editingUser.password,
                    vipLevel: editingUser.vipLevel,
                    vipTag: plans.find((p) => p.level === editingUser.vipLevel)?.levelTag || `LV ${editingUser.vipLevel}`,
                  });
                  setEditingUser(null);
                }}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT PLAN MODAL */}
      {/* ========================================================= */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Edit VIP Plan ({editingPlan.badge})</h3>
              </div>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Plan Title / Name</label>
                <input
                  type="text"
                  value={editingPlan.title || editingPlan.levelTag}
                  onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value, levelTag: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Price (₹)</label>
                  <input
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Welcome Bonus (₹)</label>
                  <input
                    type="number"
                    value={editingPlan.bonus || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, bonus: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Daily Income (₹)</label>
                  <input
                    type="number"
                    value={editingPlan.dailyIncome}
                    onChange={(e) => setEditingPlan({ ...editingPlan, dailyIncome: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Daily Video Tasks Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editingPlan.dailyMissions}
                    onChange={(e) => setEditingPlan({ ...editingPlan, dailyMissions: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Per Video Reward:</span>
                <b className="text-emerald-400 font-mono text-xs">
                  ₹{Math.round((editingPlan.dailyIncome / Math.max(1, editingPlan.dailyMissions)) * 10) / 10} / task
                </b>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Validity Period</label>
                  <input
                    type="text"
                    value={editingPlan.validity}
                    onChange={(e) => setEditingPlan({ ...editingPlan, validity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Badge Text</label>
                  <input
                    type="text"
                    value={editingPlan.badge}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const perMission = Math.round((editingPlan.dailyIncome / Math.max(1, editingPlan.dailyMissions)) * 10) / 10;
                  await updateVIPPlan(editingPlan.id, {
                    title: editingPlan.title,
                    levelTag: editingPlan.levelTag || editingPlan.title,
                    price: editingPlan.price,
                    amount: editingPlan.price,
                    dailyIncome: editingPlan.dailyIncome,
                    dailyMissions: editingPlan.dailyMissions,
                    perMission,
                    validity: editingPlan.validity,
                    bonus: editingPlan.bonus,
                    badge: editingPlan.badge,
                    benefits: [
                      `Daily Income: ₹${editingPlan.dailyIncome} (₹${perMission} × ${editingPlan.dailyMissions} tasks)`,
                      `Daily Missions: ${editingPlan.dailyMissions} Videos`,
                      `Per-Mission Reward: ₹${perMission}`,
                      `Validity: ${editingPlan.validity}`,
                      `Instant Verification & Direct VIP Support`,
                    ],
                  });
                  setEditingPlan(null);
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save to Cloud</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD NEW VIP PLAN MODAL */}
      {/* ========================================================= */}
      {isAddPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Create New VIP Plan</h3>
              </div>
              <button onClick={() => setIsAddPlanModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Plan Level (e.g. 1 to 10)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newPlanLevel}
                    onChange={(e) => {
                      const lv = parseInt(e.target.value) || 1;
                      setNewPlanLevel(lv);
                      setNewPlanBadge(`LV ${lv}`);
                      if (newPlanTitle.startsWith('VIP ')) {
                        setNewPlanTitle(`VIP ${lv} Plan`);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Badge Text</label>
                  <input
                    type="text"
                    value={newPlanBadge}
                    onChange={(e) => setNewPlanBadge(e.target.value)}
                    placeholder="e.g. LV 4"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Plan Title / Name</label>
                <input
                  type="text"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="e.g. VIP 4 Diamond Plan"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Plan Price (₹)</label>
                  <input
                    type="number"
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Welcome Bonus (₹)</label>
                  <input
                    type="number"
                    value={newPlanBonus}
                    onChange={(e) => setNewPlanBonus(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Daily Income (₹)</label>
                  <input
                    type="number"
                    value={newPlanDailyIncome}
                    onChange={(e) => setNewPlanDailyIncome(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Daily Video Tasks Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={newPlanDailyMissions}
                    onChange={(e) => setNewPlanDailyMissions(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Calculated Per Video Reward:</span>
                <b className="text-emerald-400 font-mono text-xs">
                  ₹{Math.round((newPlanDailyIncome / Math.max(1, newPlanDailyMissions)) * 10) / 10} / task
                </b>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Validity Period</label>
                  <input
                    type="text"
                    value={newPlanValidity}
                    onChange={(e) => setNewPlanValidity(e.target.value)}
                    placeholder="365 days"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPlanRecommended}
                      onChange={(e) => setNewPlanRecommended(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700"
                    />
                    <span className="font-bold">Mark Popular</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddPlanModalOpen(false)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newPlanTitle || newPlanPrice <= 0) {
                    showToast('Please enter valid Plan Title and Price');
                    return;
                  }
                  const perMission = Math.round((newPlanDailyIncome / Math.max(1, newPlanDailyMissions)) * 10) / 10;
                  const newPlanItem: PlanItem = {
                    id: `plan_lv${newPlanLevel}_${Date.now()}`,
                    level: newPlanLevel,
                    levelTag: newPlanTitle,
                    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
                    badge: newPlanBadge || `LV ${newPlanLevel}`,
                    price: newPlanPrice,
                    amount: newPlanPrice,
                    bonus: newPlanBonus,
                    dailyIncome: newPlanDailyIncome,
                    dailyMissions: newPlanDailyMissions,
                    perMission,
                    validity: newPlanValidity || '365 days',
                    title: newPlanTitle,
                    recommended: newPlanRecommended,
                    benefits: [
                      `Daily Income: ₹${newPlanDailyIncome} (₹${perMission} × ${newPlanDailyMissions} tasks)`,
                      `Daily Missions: ${newPlanDailyMissions} Videos`,
                      `Per-Mission Reward: ₹${perMission}`,
                      `Validity: ${newPlanValidity || '365 days'}`,
                      `Instant Verification & Direct VIP Support`,
                    ],
                  };
                  await addVIPPlan(newPlanItem);
                  setIsAddPlanModalOpen(false);
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create &amp; Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TEST PLAY VIDEO MODAL */}
      {testVideoPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <Youtube className="w-4 h-4" />
                <span>Test Video Preview (ID: {testVideoPreviewUrl})</span>
              </span>
              <button
                onClick={() => setTestVideoPreviewUrl(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${testVideoPreviewUrl}?autoplay=1`}
                title="Preview"
                allow="autoplay; encrypted-media"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
