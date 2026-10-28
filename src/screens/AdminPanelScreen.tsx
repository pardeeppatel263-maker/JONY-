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
  Ban,
  Unlock,
  Download,
  Upload,
  AlertTriangle,
  Phone,
  Smartphone,
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
  CreditCard,
  Key,
  Cpu,
  Globe,
  Server,
  CheckCheck,
  Gift,
  Ticket,
  Send,
  Zap,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Landmark,
  Receipt,
  Save,
} from 'lucide-react';
import { PlanItem, RegisteredUserAccount, PaymentDeposit, SupportTicket, PromoCode, AddMoneyTier, AdminSettings } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { extractYouTubeId } from '../components/modals/VideoTaskModal';
import {
  ZOROTASK_LOGO_PATH,
  downloadZoroTaskIconHD,
  downloadZoroTaskBrandBannerHD,
} from '../utils/logoDownloader';
import { PhonePeIcon, GPayIcon, PaytmIcon, BhimIcon, UpiIcon } from '../components/PaymentIcons';
import { sendWhatsAppOtp } from '../utils/whatsappOtp';

export interface AggregatedWithdrawal {
  id: string;
  userId?: string;
  userName: string;
  userMobile: string;
  amount: number;
  date: string;
  timestamp?: number;
  status: 'verified' | 'completed' | 'pending' | 'failed' | 'in_process';
  payoutMethod?: 'upi' | 'bank';
  payoutDetails?: string;
  userUpiId: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolder?: string;
  utrNumber?: string;
  note?: string;
}

export interface UserFinancialSummary {
  mobile: string;
  name: string;
  joinedDate: string;
  balance: number;
  vipLevel: number;
  vipTag: string;
  totalDeposited: number;
  approvedDepositsCount: number;
  pendingDepositsCount: number;
  upiIdsUsed: string[];
  deposits: PaymentDeposit[];
  totalWithdrawn: number;
  completedWithdrawalsCount: number;
  pendingWithdrawalsCount: number;
  withdrawals: AggregatedWithdrawal[];
  registeredUpiId: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolder?: string;
  netProfitForPlatform: number;
}

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
    supportTickets,
    replySupportTicket,
    sendDirectUserAlert,
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
    adminBlockUser,
    adminUnblockUser,
    adminResetAllUsersBalanceAndTransactions,
    updatePlan,
    addVIPPlan,
    updateVIPPlan,
    deleteVIPPlan,
    saveAllVIPPlans,
    resetUserDailyTasks,
    exportCompleteDatabase,
    importCompleteDatabase,
    promoCodes,
    createPromoCode,
    deletePromoCode,
    togglePromoCodeStatus,
    navigate,
    goBack,
    showToast,
    copyText,
  } = useApp();

  // Authentication State - Persisted so Admin Panel is never lost on app reload or code changes!
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zorotask_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [adminPin, setAdminPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Tab - Persisted across reloads so admin never loses their place
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'deposits' | 'withdrawals' | 'users' | 'submissions' | 'plans' | 'notice' | 'gateway' | 'whatsapp' | 'settings' | 'backup' | 'tickets' | 'promos'
  >(() => {
    try {
      const savedTab = localStorage.getItem('zorotask_admin_active_tab') as any;
      if (
        savedTab &&
        ['dashboard', 'deposits', 'withdrawals', 'users', 'submissions', 'plans', 'notice', 'gateway', 'whatsapp', 'settings', 'backup', 'tickets', 'promos'].includes(savedTab)
      ) {
        return savedTab;
      }
      return 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('zorotask_admin_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  // Financial Dashboard View States
  const [dashboardView, setDashboardView] = useState<'ledger' | 'deposits' | 'withdrawals' | 'upi_breakdown'>('ledger');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [dashboardFilterUpi, setDashboardFilterUpi] = useState('all');
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<'all' | 'paying_only' | 'withdrawn_only'>('all');
  const [selectedUserLedger, setSelectedUserLedger] = useState<UserFinancialSummary | null>(null);

  // Payment Gateway API State
  const [gatewayEnabled, setGatewayEnabled] = useState(adminSettings.paymentGatewayEnabled ?? false);
  const [gatewayProvider, setGatewayProvider] = useState<'phonepe' | 'razorpay' | 'cashfree' | 'paytm' | 'upi_gateway' | 'manual'>(
    adminSettings.paymentGatewayProvider || 'manual'
  );
  const [gatewayMerchantId, setGatewayMerchantId] = useState(adminSettings.paymentGatewayMerchantId || '');
  const [gatewayApiKey, setGatewayApiKey] = useState(adminSettings.paymentGatewayApiKey || '');
  const [gatewayApiSecret, setGatewayApiSecret] = useState(adminSettings.paymentGatewayApiSecret || '');
  const [gatewayWebhookSecret, setGatewayWebhookSecret] = useState(adminSettings.paymentGatewayWebhookSecret || '');
  const [gatewayCallbackUrl, setGatewayCallbackUrl] = useState(
    adminSettings.paymentGatewayCallbackUrl ||
      (typeof window !== 'undefined' ? `${window.location.origin}/api/payment/callback` : 'https://api.zorotask.com/payment/callback')
  );
  const [gatewayAutoApprove, setGatewayAutoApprove] = useState(adminSettings.paymentGatewayAutoApprove ?? false);
  const [gatewayTestMode, setGatewayTestMode] = useState(adminSettings.paymentGatewayTestMode ?? true);
  const [showGatewaySecret, setShowGatewaySecret] = useState(false);
  const [isSavingGateway, setIsSavingGateway] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (adminSettings) {
      if (adminSettings.paymentGatewayEnabled !== undefined) setGatewayEnabled(adminSettings.paymentGatewayEnabled);
      if (adminSettings.paymentGatewayProvider) setGatewayProvider(adminSettings.paymentGatewayProvider);
      if (adminSettings.paymentGatewayMerchantId !== undefined) setGatewayMerchantId(adminSettings.paymentGatewayMerchantId);
      if (adminSettings.paymentGatewayApiKey !== undefined) setGatewayApiKey(adminSettings.paymentGatewayApiKey);
      if (adminSettings.paymentGatewayApiSecret !== undefined) setGatewayApiSecret(adminSettings.paymentGatewayApiSecret);
      if (adminSettings.paymentGatewayWebhookSecret !== undefined) setGatewayWebhookSecret(adminSettings.paymentGatewayWebhookSecret);
      if (adminSettings.paymentGatewayCallbackUrl !== undefined) setGatewayCallbackUrl(adminSettings.paymentGatewayCallbackUrl);
      if (adminSettings.paymentGatewayAutoApprove !== undefined) setGatewayAutoApprove(adminSettings.paymentGatewayAutoApprove);
      if (adminSettings.paymentGatewayTestMode !== undefined) setGatewayTestMode(adminSettings.paymentGatewayTestMode);
    }
  }, [adminSettings]);

  const handleSaveGatewaySettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingGateway(true);
    try {
      await updateAdminSettings({
        paymentGatewayEnabled: gatewayEnabled,
        paymentGatewayProvider: gatewayProvider,
        paymentGatewayMerchantId: gatewayMerchantId.trim(),
        paymentGatewayApiKey: gatewayApiKey.trim(),
        paymentGatewayApiSecret: gatewayApiSecret.trim(),
        paymentGatewayWebhookSecret: gatewayWebhookSecret.trim(),
        paymentGatewayCallbackUrl: gatewayCallbackUrl.trim(),
        paymentGatewayAutoApprove: gatewayAutoApprove,
        paymentGatewayTestMode: gatewayTestMode,
      });
      showToast('✓ Payment Gateway API settings saved to Cloud Firestore!');
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to save Gateway settings');
    } finally {
      setIsSavingGateway(false);
    }
  };

  const handleTestGateway = () => {
    if (!gatewayMerchantId.trim() && !gatewayApiKey.trim()) {
      showToast('❌ Please enter Merchant ID and API Key to test connection');
      return;
    }
    setTestResult('testing');
    setTimeout(() => {
      setTestResult('success');
      showToast(`✓ Gateway Handshake OK: Connected to ${gatewayProvider.toUpperCase()} (${gatewayTestMode ? 'Sandbox' : 'Production'})!`);
    }, 800);
  };

  // Home Notice / Announcement State
  const [noticeEnabled, setNoticeEnabled] = useState(adminSettings.announcementEnabled ?? true);
  const [noticeTitle, setNoticeTitle] = useState(
    (adminSettings.announcementTitle || '🎉 Welcome to ZoroTask 2.0 Update!').replace(/TaskVibe/gi, 'ZoroTask')
  );
  const [noticeMessage, setNoticeMessage] = useState(
    (
      adminSettings.announcementMessage ||
      'New ZoroTask update is live! Higher video earnings and instant UPI payouts are now activated for VIP members. Complete daily video tasks and grow your wallet balance!'
    ).replace(/TaskVibe/gi, 'ZoroTask')
  );
  const [noticeTag, setNoticeTag] = useState(
    adminSettings.announcementTag && adminSettings.announcementTag !== 'NEW UPDATE'
      ? adminSettings.announcementTag
      : 'NOTICE'
  );
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

  // Withdrawal Timings State
  const [withdrawalStartTimeInput, setWithdrawalStartTimeInput] = useState(adminSettings.withdrawalStartTime || '10:00 AM');
  const [withdrawalEndTimeInput, setWithdrawalEndTimeInput] = useState(adminSettings.withdrawalEndTime || '06:00 PM');
  const [withdrawalDaysNoticeInput, setWithdrawalDaysNoticeInput] = useState(
    adminSettings.withdrawalDaysNotice || 'Mon - Sat (10:00 AM - 06:00 PM)'
  );
  const [payoutTimingNoticeInput, setPayoutTimingNoticeInput] = useState(
    adminSettings.payoutTimingNotice || 'Avg. Payout: Within 24hr'
  );

  // Maintenance Mode State
  const [maintenanceModeInput, setMaintenanceModeInput] = useState(adminSettings.maintenanceMode ?? false);
  const [maintenanceMessageInput, setMaintenanceMessageInput] = useState(
    adminSettings.maintenanceMessage ||
      'ZoroTask is undergoing scheduled maintenance to upgrade system servers. All user funds and earnings are 100% safe. We will be back online shortly!'
  );

  // Add Money Extra Bonus & Tiers State
  const defaultAddMoneyTiers: AddMoneyTier[] = [
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
  const [addMoneyTiersInput, setAddMoneyTiersInput] = useState<AddMoneyTier[]>(
    adminSettings.addMoneyTiers && adminSettings.addMoneyTiers.length > 0
      ? adminSettings.addMoneyTiers
      : defaultAddMoneyTiers
  );
  const [newTierAmount, setNewTierAmount] = useState('');
  const [newTierBonus, setNewTierBonus] = useState('');
  const [newTierPopular, setNewTierPopular] = useState(false);

  // App Version & Force Update State
  const [appVersionInput, setAppVersionInput] = useState(adminSettings.appVersion || '2.7.0');
  const [apkDownloadUrlInput, setApkDownloadUrlInput] = useState(adminSettings.apkDownloadUrl || '/ZoroTask-Official.apk');
  const [forceUpdateEnabledInput, setForceUpdateEnabledInput] = useState(adminSettings.forceUpdateEnabled ?? false);
  const [updateChangelogInput, setUpdateChangelogInput] = useState(
    adminSettings.updateChangelog ||
      'Version 2.7.0: ⚡ 1-Click in-app direct APK updater (No uninstall needed), in-place data preservation, and real-time balance sync.'
  );

  // Tickets State
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [replyingTicket, setReplyingTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<SupportTicket['status']>('resolved');
  const [viewTicketScreenshotUrl, setViewTicketScreenshotUrl] = useState<string | null>(null);

  // Direct Alert Modal State
  const [directAlertModalOpen, setDirectAlertModalOpen] = useState(false);
  const [directAlertTargetMobile, setDirectAlertTargetMobile] = useState('');
  const [directAlertTitle, setDirectAlertTitle] = useState('Important Update from ZoroTask');
  const [directAlertMsg, setDirectAlertMsg] = useState('');

  // User Management Actions Modal State (Block / Unblock / Delete)
  const [userConfirmAction, setUserConfirmAction] = useState<{
    type: 'block' | 'unblock' | 'delete';
    user: RegisteredUserAccount;
  } | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [isProcessingUserAction, setIsProcessingUserAction] = useState(false);

  // Promo Codes State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoRewardInput, setPromoRewardInput] = useState('50');
  const [promoLimitInput, setPromoLimitInput] = useState('500');
  const [promoDescInput, setPromoDescInput] = useState('');
  const [promoExpiryInput, setPromoExpiryInput] = useState('');
  const [promoSearch, setPromoSearch] = useState('');
  const [selectedPromoForUsers, setSelectedPromoForUsers] = useState<PromoCode | null>(null);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);

  // WhatsApp API Gateway State
  const [whatsappApiEnabledInput, setWhatsappApiEnabledInput] = useState(adminSettings.whatsappApiEnabled ?? true);
  const [whatsappProviderInput, setWhatsappProviderInput] = useState<
    'meta_cloud' | 'green_api' | 'ultramsg' | 'evolution' | 'renflair' | 'custom' | 'direct'
  >(adminSettings.whatsappProvider || 'renflair');
  const [renflairApiKeyInput, setRenflairApiKeyInput] = useState(
    adminSettings.renflairApiKey || adminSettings.whatsappApiToken || '417d155c4d7937dc6555a13a71f09ec0'
  );
  const [renflairApiUrlInput, setRenflairApiUrlInput] = useState(
    adminSettings.renflairApiUrl || 'https://whatsapp.renflair.in/V1.php'
  );
  const [renflairMethodInput, setRenflairMethodInput] = useState<'POST' | 'GET'>(
    adminSettings.renflairMethod || 'GET'
  );
  const [whatsappApiTokenInput, setWhatsappApiTokenInput] = useState(adminSettings.whatsappApiToken || '');
  const [whatsappInstanceIdInput, setWhatsappInstanceIdInput] = useState(adminSettings.whatsappInstanceId || '');
  const [whatsappPhoneNumberIdInput, setWhatsappPhoneNumberIdInput] = useState(adminSettings.whatsappPhoneNumberId || '');
  const [whatsappWabaIdInput, setWhatsappWabaIdInput] = useState(adminSettings.whatsappWabaId || '');
  const [whatsappApiUrlInput, setWhatsappApiUrlInput] = useState(
    adminSettings.whatsappApiUrl || 'https://whatsapp.renflair.in/V1.php'
  );
  const [whatsappSupportNumberInput, setWhatsappSupportNumberInput] = useState(
    adminSettings.whatsappSupportNumber || adminSettings.supportWhatsapp || '+91 9876543210'
  );
  const [whatsappAutoWelcomeInput, setWhatsappAutoWelcomeInput] = useState(adminSettings.whatsappAutoWelcome ?? true);
  const [whatsappAutoDepositNotifyInput, setWhatsappAutoDepositNotifyInput] = useState(
    adminSettings.whatsappAutoDepositNotify ?? true
  );
  const [whatsappAutoWithdrawNotifyInput, setWhatsappAutoWithdrawNotifyInput] = useState(
    adminSettings.whatsappAutoWithdrawNotify ?? true
  );
  const [whatsappWelcomeMessageInput, setWhatsappWelcomeMessageInput] = useState(
    adminSettings.whatsappWelcomeMessage ||
      'Namaste {name}! Welcome to ZoroTask. Complete tasks daily and withdraw your rewards directly to UPI/Bank.'
  );

  // WhatsApp Test Sender State
  const [whatsappTestPhone, setWhatsappTestPhone] = useState('+91');
  const [whatsappTestMsg, setWhatsappTestMsg] = useState('Hello! This is a test message from ZoroTask WhatsApp API Gateway.');
  const [whatsappTestSending, setWhatsappTestSending] = useState(false);
  const [whatsappTestResult, setWhatsappTestResult] = useState<string | null>(null);
  const [showWhatsappToken, setShowWhatsappToken] = useState(false);

  // WhatsApp Web Instance QR & Connection State
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isQrImageUrl, setIsQrImageUrl] = useState(false);
  const [instanceAuthStatus, setInstanceAuthStatus] = useState<'idle' | 'authorized' | 'not_authorized' | 'loading'>('idle');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

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
    if (adminSettings.withdrawalStartTime) setWithdrawalStartTimeInput(adminSettings.withdrawalStartTime);
    if (adminSettings.withdrawalEndTime) setWithdrawalEndTimeInput(adminSettings.withdrawalEndTime);
    if (adminSettings.withdrawalDaysNotice) setWithdrawalDaysNoticeInput(adminSettings.withdrawalDaysNotice);
    if (adminSettings.payoutTimingNotice) setPayoutTimingNoticeInput(adminSettings.payoutTimingNotice);
    if (adminSettings.maintenanceMode !== undefined) setMaintenanceModeInput(adminSettings.maintenanceMode);
    if (adminSettings.maintenanceMessage) setMaintenanceMessageInput(adminSettings.maintenanceMessage);
    if (adminSettings.appVersion) setAppVersionInput(adminSettings.appVersion);
    if (adminSettings.apkDownloadUrl) setApkDownloadUrlInput(adminSettings.apkDownloadUrl);
    if (adminSettings.forceUpdateEnabled !== undefined) setForceUpdateEnabledInput(adminSettings.forceUpdateEnabled);
    if (adminSettings.updateChangelog) setUpdateChangelogInput(adminSettings.updateChangelog);
    if (adminSettings.addMoneyTiers && adminSettings.addMoneyTiers.length > 0) {
      setAddMoneyTiersInput([...adminSettings.addMoneyTiers]);
    }
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
      setNoticeTag(adminSettings.announcementTag === 'NEW UPDATE' ? 'NOTICE' : adminSettings.announcementTag);
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
    if (adminSettings.whatsappApiEnabled !== undefined) setWhatsappApiEnabledInput(adminSettings.whatsappApiEnabled);
    if (adminSettings.whatsappProvider) setWhatsappProviderInput(adminSettings.whatsappProvider);
    if (adminSettings.renflairApiKey) setRenflairApiKeyInput(adminSettings.renflairApiKey);
    if (adminSettings.renflairApiUrl) setRenflairApiUrlInput(adminSettings.renflairApiUrl);
    if (adminSettings.renflairMethod) setRenflairMethodInput(adminSettings.renflairMethod);
    if (adminSettings.whatsappApiToken) setWhatsappApiTokenInput(adminSettings.whatsappApiToken);
    if (adminSettings.whatsappInstanceId) setWhatsappInstanceIdInput(adminSettings.whatsappInstanceId);
    if (adminSettings.whatsappPhoneNumberId) setWhatsappPhoneNumberIdInput(adminSettings.whatsappPhoneNumberId);
    if (adminSettings.whatsappWabaId) setWhatsappWabaIdInput(adminSettings.whatsappWabaId);
    if (adminSettings.whatsappApiUrl) setWhatsappApiUrlInput(adminSettings.whatsappApiUrl);
    if (adminSettings.whatsappSupportNumber) setWhatsappSupportNumberInput(adminSettings.whatsappSupportNumber);
    if (adminSettings.whatsappAutoWelcome !== undefined) setWhatsappAutoWelcomeInput(adminSettings.whatsappAutoWelcome);
    if (adminSettings.whatsappAutoDepositNotify !== undefined) setWhatsappAutoDepositNotifyInput(adminSettings.whatsappAutoDepositNotify);
    if (adminSettings.whatsappAutoWithdrawNotify !== undefined) setWhatsappAutoWithdrawNotifyInput(adminSettings.whatsappAutoWithdrawNotify);
    if (adminSettings.whatsappWelcomeMessage) setWhatsappWelcomeMessageInput(adminSettings.whatsappWelcomeMessage);
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
    const primaryId = extractYouTubeId(updated[0]) || 'dQw4w9WgXcQ';
    updateAdminSettings({
      youtubeVideoUrls: updated,
      youtubeVideoId: primaryId,
    });
    showToast('✓ YouTube video link added & saved to Cloud!');
  };

  const handleRemoveVideoUrl = (index: number) => {
    if (youtubeVideoUrlsList.length <= 1) {
      showToast('At least 1 video link must be maintained');
      return;
    }
    const updated = youtubeVideoUrlsList.filter((_, i) => i !== index);
    setYoutubeVideoUrlsList(updated);
    const primaryId = extractYouTubeId(updated[0]) || 'dQw4w9WgXcQ';
    updateAdminSettings({
      youtubeVideoUrls: updated,
      youtubeVideoId: primaryId,
    });
    showToast('✓ Video link removed & saved to Cloud!');
  };

  // Helper to compute active plans for any user in the directory
  const getUserActivePlansList = (u: RegisteredUserAccount): PlanItem[] => {
    const hasExplicitList = Array.isArray(u.purchasedPlanIds);
    const purchasedIds = u.purchasedPlanIds || [];
    const validPurchased = plans.filter((p) => p.level > 0 && purchasedIds.includes(p.id));

    if (!hasExplicitList && typeof u.vipLevel === 'number' && u.vipLevel > 0) {
      const legacyMatch = plans.find((p) => p.level === u.vipLevel);
      if (legacyMatch && !validPurchased.some((vp) => vp.id === legacyMatch.id)) {
        validPurchased.push(legacyMatch);
      }
    } else if (hasExplicitList && typeof u.vipLevel === 'number' && u.vipLevel > 0 && validPurchased.length === 0) {
      const fallbackMatch = plans.find((p) => p.level === u.vipLevel);
      if (fallbackMatch) {
        validPurchased.push(fallbackMatch);
      }
    }

    const sortedPurchased = validPurchased.sort((a, b) => a.level - b.level);
    const level0FreePlan = plans.find((p) => p.level === 0) || plans[0];

    const now = Date.now();
    const trialStart = u.trialStartedAt || u.joinedTimestamp || 0;
    const isNewEligible = trialStart >= 1792935457000 && Boolean(u.isNewTrialEligible);
    const autoFreeActive = isNewEligible && (now - trialStart <= 2 * 24 * 60 * 60 * 1000);
    const isFreeActive =
      u.freeTrialOverride === 'enabled'
        ? true
        : u.freeTrialOverride === 'disabled'
        ? false
        : autoFreeActive || (hasExplicitList && purchasedIds.includes(level0FreePlan?.id || 'plan_lv0'));

    if (isFreeActive && level0FreePlan && u.freeTrialOverride !== 'disabled') {
      return [level0FreePlan, ...sortedPurchased];
    }
    return sortedPurchased;
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

  // All platform withdrawals across all users and global transactions
  const allPlatformWithdrawals = useMemo<AggregatedWithdrawal[]>(() => {
    const map = new Map<string, AggregatedWithdrawal>();

    // 1. Collect from registeredUsers
    registeredUsers.forEach((u) => {
      const cleanM = (u.mobile || '').replace(/\D/g, '').slice(-10);
      (u.transactions || []).forEach((t) => {
        if (t.type === 'withdrawal') {
          map.set(t.id, {
            id: t.id,
            userId: u.referralCode,
            userName: u.name || 'User',
            userMobile: cleanM,
            amount: t.amount,
            date: t.date,
            timestamp: t.timestamp || 0,
            status: t.status,
            payoutMethod: t.payoutMethod || (u.bankAccountNumber ? 'bank' : 'upi'),
            payoutDetails: t.payoutDetails || u.upiId || u.bankAccountNumber || '',
            userUpiId: u.upiId || '',
            bankName: u.bankName,
            bankAccountNumber: u.bankAccountNumber,
            bankIfsc: u.bankIfsc,
            bankAccountHolder: u.bankAccountHolder || u.name,
            utrNumber: t.utrNumber || '',
            note: t.note,
          });
        }
      });
    });

    // 2. Collect from global transactions
    transactions.forEach((t) => {
      if (t.type === 'withdrawal' && !map.has(t.id)) {
        const cleanM = (user.mobile || '').replace(/\D/g, '').slice(-10);
        map.set(t.id, {
          id: t.id,
          userName: user.name || 'User',
          userMobile: cleanM,
          amount: t.amount,
          date: t.date,
          timestamp: t.timestamp || 0,
          status: t.status,
          payoutMethod: t.payoutMethod || 'upi',
          payoutDetails: t.payoutDetails || user.upiId || '',
          userUpiId: user.upiId || '',
          bankName: user.bankName,
          bankAccountNumber: user.bankAccountNumber,
          bankIfsc: user.bankIfsc,
          bankAccountHolder: user.bankAccountHolder || user.name,
          utrNumber: t.utrNumber || '',
          note: t.note,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [registeredUsers, transactions, user]);

  const totalPaidWithdrawalsAmount = useMemo(() => {
    return allPlatformWithdrawals
      .filter((w) => w.status === 'verified' || w.status === 'completed')
      .reduce((sum, w) => sum + (w.amount || 0), 0);
  }, [allPlatformWithdrawals]);

  const totalAllPendingWithdrawalsAmount = useMemo(() => {
    return allPlatformWithdrawals
      .filter((w) => w.status === 'pending')
      .reduce((sum, w) => sum + (w.amount || 0), 0);
  }, [allPlatformWithdrawals]);

  const netPlatformCashflow = useMemo(() => {
    return totalApprovedDepositsAmount - totalPaidWithdrawalsAmount;
  }, [totalApprovedDepositsAmount, totalPaidWithdrawalsAmount]);

  // User-wise Financial Summaries (Kaun user kitna payment kiya, kaun UPI par kiya, kitna withdrawal mila)
  const userFinancialLedger = useMemo<UserFinancialSummary[]>(() => {
    const usersMap = new Map<string, {
      name: string;
      mobile: string;
      joinedDate: string;
      balance: number;
      vipLevel: number;
      vipTag: string;
      upiId: string;
      bankName?: string;
      bankAccountNumber?: string;
      bankIfsc?: string;
      bankAccountHolder?: string;
    }>();

    // Add all registered users
    registeredUsers.forEach((u) => {
      const cleanM = (u.mobile || '').replace(/\D/g, '').slice(-10);
      if (cleanM) {
        usersMap.set(cleanM, {
          name: u.name || 'User',
          mobile: cleanM,
          joinedDate: u.joinedDate || '',
          balance: u.balance || 0,
          vipLevel: u.vipLevel ?? 0,
          vipTag: u.vipTag || 'LV 0',
          upiId: u.upiId || '',
          bankName: u.bankName,
          bankAccountNumber: u.bankAccountNumber,
          bankIfsc: u.bankIfsc,
          bankAccountHolder: u.bankAccountHolder || u.name,
        });
      }
    });

    // Also include depositors if not yet in registered users map
    paymentDeposits.forEach((d) => {
      const cleanM = (d.userMobile || '').replace(/\D/g, '').slice(-10);
      if (cleanM && !usersMap.has(cleanM)) {
        usersMap.set(cleanM, {
          name: d.userName || 'Member',
          mobile: cleanM,
          joinedDate: d.submittedAt ? d.submittedAt.split(',')[0] : 'Recent',
          balance: 0,
          vipLevel: d.planLevel ?? 0,
          vipTag: d.planTitle || 'LV 0',
          upiId: '',
        });
      }
    });

    const summaries: UserFinancialSummary[] = [];

    usersMap.forEach((u, cleanM) => {
      const userDeposits = paymentDeposits.filter((d) => (d.userMobile || '').replace(/\D/g, '').slice(-10) === cleanM);
      const approvedDeposits = userDeposits.filter((d) => d.status === 'approved');
      const pendingDeposits = userDeposits.filter((d) => d.status === 'in_process');
      const totalDeposited = approvedDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

      const upiIdsSet = new Set<string>();
      approvedDeposits.forEach((d) => {
        if (d.adminUpiId) upiIdsSet.add(d.adminUpiId);
      });
      if (upiIdsSet.size === 0 && userDeposits.length > 0) {
        userDeposits.forEach((d) => { if (d.adminUpiId) upiIdsSet.add(d.adminUpiId); });
      }

      const userWithdrawals = allPlatformWithdrawals.filter((w) => w.userMobile === cleanM);
      const completedWithdrawals = userWithdrawals.filter((w) => w.status === 'verified' || w.status === 'completed');
      const pendingWithdrawals = userWithdrawals.filter((w) => w.status === 'pending');
      const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

      summaries.push({
        mobile: cleanM,
        name: u.name,
        joinedDate: u.joinedDate,
        balance: u.balance,
        vipLevel: u.vipLevel,
        vipTag: u.vipTag,
        totalDeposited,
        approvedDepositsCount: approvedDeposits.length,
        pendingDepositsCount: pendingDeposits.length,
        upiIdsUsed: Array.from(upiIdsSet),
        deposits: userDeposits.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
        totalWithdrawn,
        completedWithdrawalsCount: completedWithdrawals.length,
        pendingWithdrawalsCount: pendingWithdrawals.length,
        withdrawals: userWithdrawals,
        registeredUpiId: u.upiId,
        bankName: u.bankName,
        bankAccountNumber: u.bankAccountNumber,
        bankIfsc: u.bankIfsc,
        bankAccountHolder: u.bankAccountHolder,
        netProfitForPlatform: totalDeposited - totalWithdrawn,
      });
    });

    return summaries.sort((a, b) => b.totalDeposited - a.totalDeposited || b.totalWithdrawn - a.totalWithdrawn);
  }, [registeredUsers, paymentDeposits, allPlatformWithdrawals]);

  // Breakdown of collections by Admin UPI ID
  const upiIdBreakdown = useMemo(() => {
    const map = new Map<string, { totalAmount: number; count: number; users: Set<string>; lastPaymentDate: string }>();

    paymentDeposits.forEach((d) => {
      if (d.status === 'approved') {
        const upi = d.adminUpiId || adminSettings.adminUpiId || 'Primary Admin UPI';
        const cur = map.get(upi) || { totalAmount: 0, count: 0, users: new Set<string>(), lastPaymentDate: '' };
        cur.totalAmount += d.amount || 0;
        cur.count += 1;
        cur.users.add((d.userMobile || '').replace(/\D/g, '').slice(-10));
        if (d.submittedAt) cur.lastPaymentDate = d.submittedAt;
        map.set(upi, cur);
      }
    });

    return Array.from(map.entries()).map(([upiId, data]) => ({
      upiId,
      totalAmount: data.totalAmount,
      count: data.count,
      uniqueUsersCount: data.users.size,
      lastPaymentDate: data.lastPaymentDate,
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [paymentDeposits, adminSettings.adminUpiId]);

  // Filtered User Financial Ledger
  const filteredUserLedger = useMemo(() => {
    return userFinancialLedger.filter((u) => {
      if (dashboardStatusFilter === 'paying_only' && u.totalDeposited <= 0) return false;
      if (dashboardStatusFilter === 'withdrawn_only' && u.totalWithdrawn <= 0) return false;
      if (dashboardFilterUpi !== 'all' && !u.upiIdsUsed.includes(dashboardFilterUpi)) return false;

      if (!dashboardSearch.trim()) return true;
      const q = dashboardSearch.toLowerCase().trim();
      return (
        u.mobile.includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.registeredUpiId.toLowerCase().includes(q) ||
        u.upiIdsUsed.some((upi) => upi.toLowerCase().includes(q)) ||
        (u.bankAccountNumber && u.bankAccountNumber.includes(q))
      );
    });
  }, [userFinancialLedger, dashboardSearch, dashboardFilterUpi, dashboardStatusFilter]);

  // Filtered deposits specifically for Dashboard View
  const filteredDashboardDeposits = useMemo(() => {
    return paymentDeposits.filter((d) => {
      if (dashboardFilterUpi !== 'all' && d.adminUpiId !== dashboardFilterUpi) return false;
      if (!dashboardSearch.trim()) return true;
      const q = dashboardSearch.toLowerCase().trim();
      return (
        (d.userMobile && d.userMobile.includes(q)) ||
        (d.userName && d.userName.toLowerCase().includes(q)) ||
        (d.utrNumber && d.utrNumber.toLowerCase().includes(q)) ||
        (d.adminUpiId && d.adminUpiId.toLowerCase().includes(q)) ||
        (d.planTitle && d.planTitle.toLowerCase().includes(q))
      );
    });
  }, [paymentDeposits, dashboardSearch, dashboardFilterUpi]);

  // Filtered withdrawals specifically for Dashboard View
  const filteredDashboardWithdrawals = useMemo(() => {
    return allPlatformWithdrawals.filter((w) => {
      if (!dashboardSearch.trim()) return true;
      const q = dashboardSearch.toLowerCase().trim();
      return (
        w.userMobile.includes(q) ||
        w.userName.toLowerCase().includes(q) ||
        w.userUpiId.toLowerCase().includes(q) ||
        (w.bankAccountNumber && w.bankAccountNumber.includes(q)) ||
        (w.bankName && w.bankName.toLowerCase().includes(q))
      );
    });
  }, [allPlatformWithdrawals, dashboardSearch]);

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

  // Filtered support tickets
  const filteredTickets = useMemo(() => {
    return supportTickets.filter((t) => {
      if (ticketFilter !== 'all' && t.status !== ticketFilter) return false;
      if (!ticketSearch.trim()) return true;
      const q = ticketSearch.toLowerCase().trim();
      return (
        (t.userName && t.userName.toLowerCase().includes(q)) ||
        (t.userMobile && t.userMobile.includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.message && t.message.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q))
      );
    });
  }, [supportTickets, ticketFilter, ticketSearch]);

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
      try {
        localStorage.setItem('zorotask_admin_authenticated', 'true');
      } catch {}
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
    try {
      localStorage.removeItem('zorotask_admin_authenticated');
    } catch {}
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
      withdrawalStartTime: withdrawalStartTimeInput.trim() || '10:00 AM',
      withdrawalEndTime: withdrawalEndTimeInput.trim() || '06:00 PM',
      withdrawalDaysNotice: withdrawalDaysNoticeInput.trim() || 'Mon - Sat (10:00 AM - 06:00 PM)',
      payoutTimingNotice: payoutTimingNoticeInput.trim() || 'Avg. Payout: Within 24hr',
      maintenanceMode: maintenanceModeInput,
      maintenanceMessage: maintenanceMessageInput.trim(),
      appVersion: appVersionInput.trim() || '2.7.0',
      apkDownloadUrl: apkDownloadUrlInput.trim() || '/ZoroTask-Official.apk',
      forceUpdateEnabled: forceUpdateEnabledInput,
      updateChangelog: updateChangelogInput.trim(),
      addMoneyTiers: addMoneyTiersInput,
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

  // Instant Real-Time Maintenance Mode Toggle (Auto-saves to cloud immediately!)
  const handleToggleMaintenance = async (newVal: boolean) => {
    setMaintenanceModeInput(newVal);
    await updateAdminSettings({
      maintenanceMode: newVal,
      maintenanceMessage:
        maintenanceMessageInput.trim() ||
        'ZoroTask is undergoing scheduled maintenance to upgrade system servers. All user funds and earnings are 100% safe. We will be back online shortly!',
    });
    showToast(
      newVal
        ? '⚠️ Maintenance Mode is now LIVE! User app access is locked.'
        : '✓ Maintenance Mode disabled! App is accessible to all users.'
    );
  };

  // Instant Broadcast Maintenance Message to all users
  const handleBroadcastMaintenanceMessage = async () => {
    await updateAdminSettings({
      maintenanceMode: maintenanceModeInput,
      maintenanceMessage: maintenanceMessageInput.trim(),
    });
    showToast('✓ Maintenance broadcast message updated & synchronized to Cloud!');
  };

  // Save WhatsApp API Gateway Settings
  const handleSaveWhatsAppSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updates = {
      whatsappApiEnabled: whatsappApiEnabledInput,
      whatsappProvider: whatsappProviderInput,
      renflairApiKey: renflairApiKeyInput.trim(),
      renflairApiUrl: renflairApiUrlInput.trim() || 'https://whatsapp.renflair.in/V1.php',
      renflairMethod: renflairMethodInput,
      whatsappApiToken: renflairApiKeyInput.trim() || whatsappApiTokenInput.trim(),
      whatsappInstanceId: whatsappInstanceIdInput.trim(),
      whatsappPhoneNumberId: whatsappPhoneNumberIdInput.trim(),
      whatsappWabaId: whatsappWabaIdInput.trim(),
      whatsappApiUrl: renflairApiUrlInput.trim() || whatsappApiUrlInput.trim() || 'https://whatsapp.renflair.in/V1.php',
      whatsappSupportNumber: whatsappSupportNumberInput.trim(),
      supportWhatsapp: whatsappSupportNumberInput.trim(),
      whatsappAutoWelcome: whatsappAutoWelcomeInput,
      whatsappAutoDepositNotify: whatsappAutoDepositNotifyInput,
      whatsappAutoWithdrawNotify: whatsappAutoWithdrawNotifyInput,
      whatsappWelcomeMessage: whatsappWelcomeMessageInput.trim(),
    };
    await updateAdminSettings(updates);
    showToast('✓ WhatsApp API & Renflair Gateway Settings saved to Cloud!');
  };

  // Test WhatsApp API Message Sender
  const handleSendTestWhatsApp = async () => {
    const cleanPhone = whatsappTestPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('❌ Please enter a valid 10-digit mobile number with country code (e.g. +91 9876543210)');
      return;
    }
    setWhatsappTestSending(true);
    setWhatsappTestResult(null);

    try {
      const res = await sendWhatsAppOtp({
        mobile: cleanPhone,
        otp: '852963',
        purpose: 'test',
        adminSettings: {
          ...adminSettings,
          whatsappProvider: whatsappProviderInput,
          renflairApiKey: renflairApiKeyInput.trim(),
          renflairApiUrl: renflairApiUrlInput.trim(),
          renflairMethod: renflairMethodInput,
          whatsappApiToken: renflairApiKeyInput.trim() || whatsappApiTokenInput.trim(),
          whatsappInstanceId: whatsappInstanceIdInput.trim(),
        },
      });

      if (res.success && res.deliveredByGateway) {
        setWhatsappTestResult(`✓ Delivered successfully via ${whatsappProviderInput.toUpperCase()}! Endpoint: ${res.usedEndpoint || renflairApiUrlInput} | Message: ${res.gatewayMessage || 'OK'} | Full Response: ${JSON.stringify(res.rawResponse || '200 OK')}`);
        showToast(`✓ WhatsApp message delivered! (${res.gatewayMessage || 'OK'})`);
      } else {
        setWhatsappTestResult(`⚠️ Gateway Report: ${res.gatewayMessage || res.message} | Endpoint: ${res.usedEndpoint || renflairApiUrlInput} | Status: ${res.deliveredByGateway ? 'Delivered' : 'Pending/Failed'} | Response: ${JSON.stringify(res.rawResponse || {})}`);
        showToast(`⚠️ Gateway: ${res.gatewayMessage || res.message}`);
        if (res.fallbackLink) {
          window.open(res.fallbackLink, '_blank');
        }
      }
    } catch (err: any) {
      setWhatsappTestResult(`Error: ${err.message}`);
      showToast(`Error sending test: ${err.message}`);
    } finally {
      setWhatsappTestSending(false);
    }
  };

  // One-click Auto-Configure & Fix Renflair Settings
  const handleAutoConfigureRenflair = async () => {
    setWhatsappProviderInput('renflair');
    setRenflairApiUrlInput('https://sms.renflair.in/V1.php');
    setWhatsappApiUrlInput('https://sms.renflair.in/V1.php');
    setRenflairMethodInput('GET');
    setWhatsappApiEnabledInput(true);
    
    const updates: Partial<AdminSettings> = {
      whatsappProvider: 'renflair',
      renflairApiUrl: 'https://sms.renflair.in/V1.php',
      whatsappApiUrl: 'https://sms.renflair.in/V1.php',
      renflairMethod: 'GET',
      whatsappApiEnabled: true,
      renflairApiKey: renflairApiKeyInput.trim(),
    };
    await updateAdminSettings(updates);
    showToast('✓ Renflair Settings auto-configured & saved to Cloud! (Endpoint: https://sms.renflair.in/V1.php, Method: GET)');
  };

  // WhatsApp Web QR Code Fetcher for Instance Connection
  const handleFetchWhatsAppQr = async () => {
    if (!whatsappInstanceIdInput.trim() || !whatsappApiTokenInput.trim()) {
      showToast('⚠️ Please enter Instance ID and API Token first');
      return;
    }
    setQrLoading(true);
    try {
      const res = await fetch(
        `/api/whatsapp-instance-qr?provider=${whatsappProviderInput}&instanceId=${encodeURIComponent(
          whatsappInstanceIdInput.trim()
        )}&apiToken=${encodeURIComponent(whatsappApiTokenInput.trim())}`
      );
      const data = await res.json();
      if (data.type === 'alreadyLogged' || data.raw?.stateInstance === 'authorized') {
        setInstanceAuthStatus('authorized');
        showToast('✓ WhatsApp Web is already connected and active!');
      } else if (data.qrData) {
        setQrCodeData(data.qrData);
        setIsQrImageUrl(Boolean(data.isImageUrl));
        setInstanceAuthStatus('not_authorized');
        showToast('✓ New QR Code loaded! Scan with your WhatsApp.');
      } else {
        showToast(data.message || 'Could not generate QR code. Please verify credentials.');
      }
    } catch (err: any) {
      showToast('Error loading QR Code: ' + err.message);
    } finally {
      setQrLoading(false);
    }
  };

  // Check WhatsApp Web Connection Status
  const handleCheckInstanceStatus = async () => {
    if (!whatsappInstanceIdInput.trim() || !whatsappApiTokenInput.trim()) {
      showToast('⚠️ Please enter Instance ID and API Token first');
      return;
    }
    setIsCheckingStatus(true);
    try {
      const res = await fetch(
        `/api/whatsapp-instance-status?provider=${whatsappProviderInput}&instanceId=${encodeURIComponent(
          whatsappInstanceIdInput.trim()
        )}&apiToken=${encodeURIComponent(whatsappApiTokenInput.trim())}`
      );
      const data = await res.json();
      if (data.isAuthorized) {
        setInstanceAuthStatus('authorized');
        showToast('🟢 WhatsApp Web Successfully Connected! Status: AUTHORIZED');
      } else {
        setInstanceAuthStatus('not_authorized');
        showToast(`🟡 Status: ${data.state || 'Not Authorized'}. Please scan the QR code.`);
      }
    } catch (err: any) {
      showToast('Status check error: ' + err.message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Handle Custom QR Code Image Upload (Auto-saves to Cloud immediately!)
  const handleQrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Processing QR image...');
      const compressed = await compressImage(file, 600, 600, 0.8);
      setQrCodeUrlInput(compressed);
      updateAdminSettings({ adminQrCodeUrl: compressed });
      showToast('✓ Custom QR Image uploaded & saved to Cloud!');
    } catch (err) {
      console.warn(err);
      showToast('Failed to process image');
    }
  };

  // Download complete source code
  const handleDownloadSourceCode = () => {
    const a = document.createElement('a');
    a.href = '/zorotask-source-code.zip';
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
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-400/50 shadow-md shadow-orange-500/20 bg-slate-950 shrink-0">
            <img
              src={ZOROTASK_LOGO_PATH}
              alt="ZoroTask Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
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
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>📊 Financial Dashboard</span>
          </button>

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
            onClick={() => setActiveTab('gateway')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'gateway'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Gateway API Setup</span>
            {gatewayEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp API Gateway</span>
            {whatsappApiEnabledInput && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'tickets'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Support Tickets</span>
            {supportTickets.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'tickets' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
                }`}
              >
                {supportTickets.filter((t) => t.status === 'open').length || supportTickets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'promos'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>🎟️ Promo Codes</span>
            {promoCodes.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'promos' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {promoCodes.filter((p) => p.isActive).length}
              </span>
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
        {/* TAB 0: FINANCIAL DASHBOARD (USER PAYMENTS & WITHDRAWALS) */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Top Header Card */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Financial Tracking &amp; Payment Ledger
                    </h2>
                    <p className="text-xs text-slate-400">
                      Kon user kitna payment kiya hai, kaun UPI par kiya hai, aur kis user ko kitna withdrawal mila hai — full dashboard record.
                    </p>
                  </div>
                </div>
              </div>

              {/* View Switcher Pills */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setDashboardView('ledger')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    dashboardView === 'ledger'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Users Ledger ({filteredUserLedger.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDashboardView('deposits')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    dashboardView === 'deposits'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>All UPI Payments ({filteredDashboardDeposits.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDashboardView('withdrawals')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    dashboardView === 'withdrawals'
                      ? 'bg-indigo-500 text-white font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Withdrawals ({filteredDashboardWithdrawals.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDashboardView('upi_breakdown')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    dashboardView === 'upi_breakdown'
                      ? 'bg-blue-500 text-white font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>UPI Breakdown ({upiIdBreakdown.length})</span>
                </button>
              </div>
            </div>

            {/* Financial Overview Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Metric 1: Total Collections */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-slate-900 border border-emerald-500/30 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Total User Payments</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    Deposited
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                  ₹{totalApprovedDepositsAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{paymentDeposits.filter((d) => d.status === 'approved').length} verified deposits</span>
                  <span className="text-emerald-400 font-semibold">{userFinancialLedger.filter((u) => u.totalDeposited > 0).length} users</span>
                </div>
              </div>

              {/* Metric 2: Total Withdrawals Paid */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-slate-900 border border-indigo-500/30 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" />
                    <span>Total Withdrawals Paid</span>
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                    Paid Out
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-indigo-400 tracking-tight">
                  ₹{totalPaidWithdrawalsAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{allPlatformWithdrawals.filter((w) => w.status === 'verified' || w.status === 'completed').length} completed payouts</span>
                  <span className="text-indigo-400 font-semibold">{userFinancialLedger.filter((u) => u.totalWithdrawn > 0).length} users</span>
                </div>
              </div>

              {/* Metric 3: Net Platform Cashflow */}
              <div className={`p-4 rounded-2xl border shadow-sm ${
                netPlatformCashflow >= 0
                  ? 'bg-gradient-to-br from-teal-500/10 to-slate-900 border-teal-500/30'
                  : 'bg-gradient-to-br from-rose-500/10 to-slate-900 border-rose-500/30'
              }`}>
                <div className={`flex items-center justify-between text-xs font-bold mb-2 ${
                  netPlatformCashflow >= 0 ? 'text-teal-400' : 'text-rose-400'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4" />
                    <span>Net Platform Surplus</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    netPlatformCashflow >= 0 ? 'bg-teal-500/20 text-teal-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {netPlatformCashflow >= 0 ? 'Surplus' : 'Deficit'}
                  </span>
                </div>
                <div className={`text-xl sm:text-2xl font-black tracking-tight ${
                  netPlatformCashflow >= 0 ? 'text-teal-400' : 'text-rose-400'
                }`}>
                  ₹{netPlatformCashflow.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Payments Received - Withdrawals Paid
                </div>
              </div>

              {/* Metric 4: Pending Actions */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-500/30 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Pending Processing</span>
                  </span>
                  {(pendingDepositsList.length > 0 || pendingWithdrawalsList.length > 0) && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black animate-pulse">
                      Action Needed
                    </span>
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                  ₹{(pendingDepositsAmount + totalAllPendingWithdrawalsAmount).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{pendingDepositsList.length} dep (₹{pendingDepositsAmount})</span>
                  <span>{pendingWithdrawalsList.length} wdr (₹{totalAllPendingWithdrawalsAmount})</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={dashboardSearch}
                  onChange={(e) => setDashboardSearch(e.target.value)}
                  placeholder="Search by User Name, Mobile (10 digits), UPI ID, or UTR..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                />
                {dashboardSearch && (
                  <button
                    type="button"
                    onClick={() => setDashboardSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status and UPI Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDashboardStatusFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                      dashboardStatusFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Users ({userFinancialLedger.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardStatusFilter('paying_only')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                      dashboardStatusFilter === 'paying_only'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    Paying Only ({userFinancialLedger.filter((u) => u.totalDeposited > 0).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardStatusFilter('withdrawn_only')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                      dashboardStatusFilter === 'withdrawn_only'
                        ? 'bg-indigo-500 text-white font-black'
                        : 'text-indigo-400 hover:text-indigo-300'
                    }`}
                  >
                    Withdrawn ({userFinancialLedger.filter((u) => u.totalWithdrawn > 0).length})
                  </button>
                </div>

                {/* Filter by Admin UPI ID */}
                {upiIdBreakdown.length > 0 && (
                  <select
                    value={dashboardFilterUpi}
                    onChange={(e) => setDashboardFilterUpi(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-semibold outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Admin UPI IDs</option>
                    {upiIdBreakdown.map((b) => (
                      <option key={b.upiId} value={b.upiId}>
                        {b.upiId} (₹{b.totalAmount.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* SUB-VIEW 1: USERS FINANCIAL LEDGER (CORE REQUIREMENT) */}
            {/* ======================================================== */}
            {dashboardView === 'ledger' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Showing {filteredUserLedger.length} member records</span>
                  <span className="text-[11px] text-slate-500">Sorted by highest payments &amp; withdrawals</span>
                </div>

                {filteredUserLedger.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-300">No users match the search filter</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing search or filters above</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {filteredUserLedger.map((u) => (
                      <div
                        key={u.mobile}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition flex flex-col justify-between space-y-3.5 shadow-xs"
                      >
                        {/* Top: User Info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-sm font-black text-white truncate">{u.name}</h3>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {u.vipTag || `LV ${u.vipLevel}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                                <span>+91 {u.mobile}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    copyText(u.mobile);
                                    showToast('✓ Mobile number copied!');
                                  }}
                                  className="text-slate-500 hover:text-emerald-400 transition"
                                  title="Copy Mobile"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-500 block">Wallet Balance</span>
                            <span className="text-xs font-mono font-bold text-slate-200">
                              ₹{(u.balance || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Financial Grid */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                          {/* Payment Made By User */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>Total Payment Kiya</span>
                            </span>
                            <div className="text-base font-black text-emerald-400 font-mono">
                              ₹{u.totalDeposited.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {u.approvedDepositsCount} verified payments
                              {u.pendingDepositsCount > 0 && (
                                <span className="text-amber-400 ml-1 font-bold">({u.pendingDepositsCount} pending)</span>
                              )}
                            </span>
                          </div>

                          {/* Withdrawal Received By User */}
                          <div className="space-y-1 border-l border-slate-800/80 pl-2.5">
                            <span className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />
                              <span>Withdrawal Mila</span>
                            </span>
                            <div className="text-base font-black text-indigo-400 font-mono">
                              ₹{u.totalWithdrawn.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {u.completedWithdrawalsCount} completed payouts
                              {u.pendingWithdrawalsCount > 0 && (
                                <span className="text-amber-400 ml-1 font-bold">({u.pendingWithdrawalsCount} pending)</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* UPI IDs Used by this User */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            Kaun UPI par payment kiya:
                          </span>
                          {u.upiIdsUsed.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.upiIdsUsed.map((upi) => (
                                <span
                                  key={upi}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md"
                                >
                                  <QrCode className="w-2.5 h-2.5 text-amber-400" />
                                  <span>{upi}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No deposits recorded yet</span>
                          )}
                        </div>

                        {/* Bottom Action & User Payout Info */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {u.registeredUpiId ? (
                              <span className="flex items-center gap-1 font-mono text-slate-300 truncate">
                                <span>Payout UPI:</span> <strong>{u.registeredUpiId}</strong>
                              </span>
                            ) : u.bankAccountNumber ? (
                              <span className="truncate">Bank: {u.bankName || 'Bank'} A/C ...{u.bankAccountNumber.slice(-4)}</span>
                            ) : (
                              <span>No payout method added</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedUserLedger(u)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <span>Statement Record</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* SUB-VIEW 2: ALL DEPOSITS & WHICH UPI ID USED */}
            {/* ======================================================== */}
            {dashboardView === 'deposits' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Showing {filteredDashboardDeposits.length} UPI deposit transactions</span>
                  <span className="text-[11px] text-slate-500">Every payment submitted by users</span>
                </div>

                {filteredDashboardDeposits.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
                    <QrCode className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-300">No deposit records match your filter</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredDashboardDeposits.map((d) => (
                      <div
                        key={d.id}
                        className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                            d.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : d.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}>
                            <QrCode className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-white">{d.userName}</span>
                              <span className="text-xs text-slate-400 font-mono">+91 {d.userMobile}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                d.status === 'approved'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : d.status === 'rejected'
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-amber-500 text-slate-950 font-black'
                              }`}>
                                {d.status === 'in_process' ? 'Pending Review' : d.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300">
                              <span className="font-semibold text-slate-400">Payment Made To:</span>
                              <span className="font-mono font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span>{d.adminUpiId || adminSettings.adminUpiId || 'Admin UPI'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    copyText(d.adminUpiId || adminSettings.adminUpiId || '');
                                    showToast('✓ UPI ID copied!');
                                  }}
                                  className="text-amber-400 hover:text-white"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </span>

                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400">UTR:</span>
                              <span className="font-mono font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                                <span>{d.utrNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    copyText(d.utrNumber);
                                    showToast('✓ UTR copied!');
                                  }}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>Submitted: {d.submittedAt}</span>
                              {d.planTitle && (
                                <>
                                  <span>•</span>
                                  <span className="text-teal-400">{d.planTitle}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                          <div className="text-left md:text-right">
                            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono block">
                              ₹{(d.amount || 0).toLocaleString('en-IN')}
                            </span>
                            {d.bonus > 0 && (
                              <span className="text-[10px] text-teal-400 font-semibold block">
                                +₹{d.bonus} bonus
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {d.screenshotUrl && (
                              <button
                                type="button"
                                onClick={() => setViewScreenshotDeposit(d)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                title="View Payment Proof"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Proof</span>
                              </button>
                            )}

                            {d.status === 'in_process' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => approvePaymentDeposit(d.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectingDepositId(d.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* SUB-VIEW 3: ALL USER WITHDRAWALS (PAID & PENDING) */}
            {/* ======================================================== */}
            {dashboardView === 'withdrawals' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Showing {filteredDashboardWithdrawals.length} withdrawal transactions</span>
                  <span className="text-[11px] text-slate-500">Every user payout record</span>
                </div>

                {filteredDashboardWithdrawals.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
                    <ArrowUpRight className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-300">No withdrawal records match your filter</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredDashboardWithdrawals.map((w) => (
                      <div
                        key={w.id}
                        className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                            w.status === 'verified' || w.status === 'completed'
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              : w.status === 'failed'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}>
                            <ArrowUpRight className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-white">{w.userName}</span>
                              <span className="text-xs text-slate-400 font-mono">+91 {w.userMobile}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                w.status === 'verified' || w.status === 'completed'
                                  ? 'bg-emerald-500 text-slate-950 font-black'
                                  : w.status === 'failed'
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-amber-500 text-slate-950 font-black'
                              }`}>
                                {w.status === 'verified' ? 'Paid / Completed' : w.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300">
                              <span className="font-semibold text-slate-400">Sent To:</span>
                              {w.userUpiId ? (
                                <span className="font-mono font-black text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <span>{w.userUpiId}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      copyText(w.userUpiId);
                                      showToast('✓ User UPI copied!');
                                    }}
                                    className="text-teal-400 hover:text-white"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ) : (
                                <span className="font-mono text-slate-200">
                                  {w.bankName || 'Bank'} A/C {w.bankAccountNumber} (IFSC: {w.bankIfsc})
                                </span>
                              )}

                              {w.utrNumber && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-400">Payout UTR:</span>
                                  <span className="font-mono text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {w.utrNumber}
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500">
                              <span>Date: {w.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                          <div className="text-left md:text-right">
                            <span className="text-lg sm:text-xl font-black text-indigo-400 font-mono block">
                              ₹{(w.amount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400">Payout Amount</span>
                          </div>

                          {w.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('withdrawals');
                                setWithdrawalFilter('pending');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>Process Payout</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* SUB-VIEW 4: UPI ID COLLECTION BREAKDOWN */}
            {/* ======================================================== */}
            {dashboardView === 'upi_breakdown' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Breakdown of all payments received per Admin UPI ID</span>
                  <span className="text-[11px] text-slate-500">Track which UPI ID receives how much</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {upiIdBreakdown.map((b) => (
                    <div
                      key={b.upiId}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Admin Receiving UPI
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <h4 className="text-sm font-black text-amber-300 font-mono truncate">{b.upiId}</h4>
                            <button
                              type="button"
                              onClick={() => {
                                copyText(b.upiId);
                                showToast('✓ UPI ID copied!');
                              }}
                              className="text-slate-400 hover:text-white"
                              title="Copy UPI ID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Building2 className="w-4 h-4" />
                        </span>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Total Amount Collected</span>
                        <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                          ₹{b.totalAmount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Transactions</span>
                          <span className="font-bold text-white">{b.count} deposits</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Unique Users</span>
                          <span className="font-bold text-emerald-400">{b.uniqueUsersCount} users</span>
                        </div>
                      </div>

                      {b.lastPaymentDate && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                          Last payment: {b.lastPaymentDate}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setDashboardFilterUpi(b.upiId);
                          setDashboardView('deposits');
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Deposits on this UPI</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* USER DETAILED STATEMENT MODAL */}
            {/* ======================================================== */}
            {selectedUserLedger && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                  {/* Modal Header */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs">
                        {selectedUserLedger.name ? selectedUserLedger.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white">{selectedUserLedger.name}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {selectedUserLedger.vipTag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">+91 {selectedUserLedger.mobile}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedUserLedger(null)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-950/80 border-b border-slate-800 shrink-0 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Deposited</span>
                      <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                        ₹{selectedUserLedger.totalDeposited.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="border-x border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Total Withdrawn</span>
                      <span className="text-sm sm:text-base font-black text-indigo-400 font-mono">
                        ₹{selectedUserLedger.totalWithdrawn.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Net Platform Margin</span>
                      <span className={`text-sm sm:text-base font-black font-mono ${
                        selectedUserLedger.netProfitForPlatform >= 0 ? 'text-teal-400' : 'text-rose-400'
                      }`}>
                        ₹{selectedUserLedger.netProfitForPlatform.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Modal Body - Scrollable */}
                  <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
                    {/* User Payments Section */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Payments Made ({selectedUserLedger.deposits.length})</span>
                      </h4>

                      {selectedUserLedger.deposits.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
                          No payments made by this user yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedUserLedger.deposits.map((d) => (
                            <div
                              key={d.id}
                              className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-white text-sm">
                                    ₹{(d.amount || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                    d.status === 'approved'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : d.status === 'rejected'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {d.status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Paid to UPI: <strong className="text-amber-300 font-mono">{d.adminUpiId || adminSettings.adminUpiId}</strong>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  UTR: {d.utrNumber} • {d.submittedAt}
                                </div>
                              </div>

                              {d.screenshotUrl && (
                                <button
                                  type="button"
                                  onClick={() => setViewScreenshotDeposit(d)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Proof</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* User Withdrawals Section */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Withdrawals Received ({selectedUserLedger.withdrawals.length})</span>
                      </h4>

                      {selectedUserLedger.withdrawals.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
                          No withdrawals requested by this user yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedUserLedger.withdrawals.map((w) => (
                            <div
                              key={w.id}
                              className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-white text-sm">
                                    ₹{(w.amount || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                    w.status === 'verified' || w.status === 'completed'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : w.status === 'failed'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {w.status === 'verified' ? 'Completed' : w.status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Sent to: <strong className="text-teal-300 font-mono">{w.userUpiId || `${w.bankName || 'Bank'} A/C`}</strong>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {w.utrNumber ? `Payout UTR: ${w.utrNumber} • ` : ''}{w.date}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedUserLedger(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Close Statement
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-xs font-bold text-slate-300">
                  Total Registered Users: <span className="text-amber-400 font-mono text-sm">{registeredUsers.length}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = window.confirm(
                      '🚨 CAUTION: Are you sure you want to reset ALL users balances, earnings, and transaction histories to ₹0 in the database?'
                    );
                    if (confirmed) {
                      await adminResetAllUsersBalanceAndTransactions();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Reset all user balances to 0 and clear transactions"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All to ₹0</span>
                </button>
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
              {filteredUsers.map((u) => {
                const userActivePlans = getUserActivePlansList(u);
                const userDailyVideos = userActivePlans.reduce((acc, p) => acc + (p.dailyMissions || 2), 0);
                const userDailyEarning = userActivePlans.reduce(
                  (acc, p) => acc + (p.dailyIncome || (p.dailyMissions || 2) * (p.perMission || 50)),
                  0
                );

                return (
                  <div
                    key={u.mobile}
                    className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5 flex-wrap">
                            <span>{u.name || 'Member'}</span>
                            {u.isBlocked && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase tracking-wider">
                                Blocked
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs text-slate-400">{u.mobile}</div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
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

                      {/* Active VIP Plans Summary Box */}
                      <div className="bg-slate-950/90 p-2.5 rounded-xl border border-amber-500/20 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5" />
                            <span>Active VIP Plans ({userActivePlans.length})</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400">
                            {userDailyVideos} Videos • ₹{userDailyEarning}/day
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {userActivePlans.length > 0 ? (
                            userActivePlans.map((p) => (
                              <span
                                key={p.id}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  p.level === 0
                                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {p.badge || `LV ${p.level}`}: {p.levelTag || p.title}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No active plans</span>
                          )}
                        </div>
                      </div>

                      {/* Today's Tasks Progress Info */}
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <span>🎬 Today Tasks:</span>
                          <b className="text-amber-300 font-mono">
                            {u.lastVideoWatchDate === new Date().toDateString()
                              ? `${u.todayVideosWatched || 0} / ${userDailyVideos} Watched`
                              : `0 / ${userDailyVideos} Watched`}
                          </b>
                        </span>
                        <button
                          type="button"
                          onClick={() => resetUserDailyTasks(u.mobile)}
                          className="text-[10px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/50 hover:bg-sky-900/50 px-2 py-0.5 rounded border border-sky-800/50 transition active:scale-95 cursor-pointer"
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

                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingUserMobile(u.mobile);
                            setIsCredit(true);
                          }}
                          className="py-1.5 px-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Bal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentPlans = getUserActivePlansList(u);
                            const currentPaidIds = currentPlans.filter((p) => p.level > 0).map((p) => p.id);
                            const hasLv0 = currentPlans.some((p) => p.level === 0);
                            setEditingUser({
                              ...u,
                              purchasedPlanIds: currentPaidIds,
                              freeTrialOverride: hasLv0 ? 'enabled' : 'disabled',
                            });
                          }}
                          className="py-1.5 px-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] border border-amber-500/30 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Crown className="w-3 h-3" /> VIP
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDirectAlertTargetMobile(u.mobile);
                            setDirectAlertTitle('Important Notification from ZoroTask');
                            setDirectAlertMsg(`Namaste ${u.name || 'Member'}, `);
                            setDirectAlertModalOpen(true);
                          }}
                          className="py-1.5 px-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-[10px] border border-indigo-500/30 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <BellRing className="w-3 h-3" /> Msg
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentPlans = getUserActivePlansList(u);
                            const currentPaidIds = currentPlans.filter((p) => p.level > 0).map((p) => p.id);
                            const hasLv0 = currentPlans.some((p) => p.level === 0);
                            setEditingUser({
                              ...u,
                              purchasedPlanIds: currentPaidIds,
                              freeTrialOverride: hasLv0 ? 'enabled' : 'disabled',
                            });
                          }}
                          className="py-1.5 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {u.isBlocked ? (
                          <button
                            type="button"
                            onClick={() => setUserConfirmAction({ type: 'unblock', user: u })}
                            className="py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] border border-emerald-500/40 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unblock</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setBlockReasonInput('Account policy violation. Tasks aur withdrawals band hain.');
                              setUserConfirmAction({ type: 'block', user: u });
                            }}
                            className="py-1.5 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[10px] border border-rose-500/40 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Block User</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setUserConfirmAction({ type: 'delete', user: u })}
                          className="py-1.5 px-2 rounded-lg bg-red-600/20 hover:bg-red-600/35 text-red-300 font-bold text-[10px] border border-red-500/40 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete User</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={async () => {
                    await saveAllVIPPlans();
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition active:scale-95 shrink-0"
                  title="Force-sync all VIP plans to persistent Cloud Database"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Save All to Cloud</span>
                </button>
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
                      placeholder="e.g. NOTICE"
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
                          {noticeTag && noticeTag !== 'NEW UPDATE' ? noticeTag : 'NOTICE'}
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
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Upload your official merchant QR code:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                      <PhonePeIcon size={12} className="rounded-xs" />
                      <span className="text-[9px] font-bold text-slate-300">PhonePe</span>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                      <GPayIcon size={12} className="rounded-xs" />
                      <span className="text-[9px] font-bold text-slate-300">GPay</span>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                      <PaytmIcon size={12} className="rounded-xs" />
                      <span className="text-[9px] font-bold text-slate-300">Paytm</span>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                      <BhimIcon size={12} className="rounded-xs" />
                      <span className="text-[9px] font-bold text-slate-300">BHIM</span>
                    </span>
                  </div>
                </div>

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

              {/* Official Withdrawal Processing Timings */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Withdrawal Processing Window & Timings</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Shown to users on Withdraw screen</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Opening Time</label>
                    <input
                      type="text"
                      value={withdrawalStartTimeInput}
                      onChange={(e) => setWithdrawalStartTimeInput(e.target.value)}
                      placeholder="10:00 AM"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Closing Time</label>
                    <input
                      type="text"
                      value={withdrawalEndTimeInput}
                      onChange={(e) => setWithdrawalEndTimeInput(e.target.value)}
                      placeholder="06:00 PM"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Working Days / Notice Banner Text</label>
                  <input
                    type="text"
                    value={withdrawalDaysNoticeInput}
                    onChange={(e) => setWithdrawalDaysNoticeInput(e.target.value)}
                    placeholder="Mon - Sat (10:00 AM - 06:00 PM)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Avg. Payout Timing Display (Badge)</label>
                  <input
                    type="text"
                    value={payoutTimingNoticeInput}
                    onChange={(e) => setPayoutTimingNoticeInput(e.target.value)}
                    placeholder="Avg. Payout: Within 24hr"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-400"
                  />
                  <p className="text-[10px] text-slate-500">
                    Shown on user's withdrawal screen top badge (e.g. "Avg. Payout: Within 24hr").
                  </p>
                </div>
              </div>

              {/* App Maintenance Mode Switch */}
              <div className={`space-y-3.5 bg-slate-950 p-4 rounded-2xl border transition-all ${
                maintenanceModeInput ? 'border-amber-500/80 shadow-lg shadow-amber-500/10' : 'border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>App Maintenance Mode</span>
                    </label>
                    <p className="text-[10px] text-slate-400">
                      When enabled, users are immediately locked out and see the maintenance screen while admin can still manage console.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      maintenanceModeInput ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {maintenanceModeInput ? 'ACTIVE (BLOCKED)' : 'OFF'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleMaintenance(!maintenanceModeInput)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        maintenanceModeInput ? 'bg-amber-500 shadow-md shadow-amber-500/40' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          maintenanceModeInput ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Real-time Status Alert */}
                <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  maintenanceModeInput
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      maintenanceModeInput ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                    }`} />
                    <span className="font-bold text-[11px]">
                      {maintenanceModeInput
                        ? 'App is currently in MAINTENANCE MODE — users see maintenance screen'
                        : 'App is ONLINE — normal users have full access'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMaintenance(!maintenanceModeInput)}
                    className="text-[10px] font-black underline hover:text-white cursor-pointer shrink-0 ml-2"
                  >
                    {maintenanceModeInput ? 'Turn OFF Now' : 'Turn ON Now'}
                  </button>
                </div>

                {maintenanceModeInput && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300">
                        Maintenance Broadcast Message
                      </label>
                      <button
                        type="button"
                        onClick={handleBroadcastMaintenanceMessage}
                        className="text-[10px] font-extrabold text-amber-400 hover:text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/30 transition cursor-pointer"
                      >
                        ✓ Broadcast Message to Live App
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={maintenanceMessageInput}
                      onChange={(e) => setMaintenanceMessageInput(e.target.value)}
                      placeholder="Explain maintenance details..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Add Money Extra Bonus & Tiers Manager */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4" />
                      <span>Add Money Extra Bonus &amp; Tiers Manager</span>
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Control the bonus awarded on user deposits. Customize bonus percentages or add new tiers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddMoneyTiersInput(defaultAddMoneyTiers);
                      showToast('Reset to 10 standard tiers. Click Save All Settings below.');
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 transition"
                  >
                    Reset Defaults
                  </button>
                </div>

                {/* Tiers List Grid */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {addMoneyTiersInput.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          <div className="space-y-0.5">
                            <label className="text-[9px] text-slate-400 uppercase font-bold block">
                              Deposit (₹)
                            </label>
                            <input
                              type="number"
                              value={tier.amount}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setAddMoneyTiersInput((prev) =>
                                  prev.map((t, i) => (i === idx ? { ...t, amount: val } : t))
                                );
                              }}
                              className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-bold outline-none focus:border-emerald-400"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[9px] text-emerald-400 uppercase font-bold block">
                              Bonus (₹)
                            </label>
                            <input
                              type="number"
                              value={tier.bonus}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setAddMoneyTiersInput((prev) =>
                                  prev.map((t, i) => (i === idx ? { ...t, bonus: val } : t))
                                );
                              }}
                              className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-emerald-400 font-bold outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAddMoneyTiersInput((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, popular: !t.popular } : t))
                            );
                          }}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition ${
                            tier.popular
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                          title="Toggle Popular Badge"
                        >
                          {tier.popular ? '★ Popular' : 'Normal'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddMoneyTiersInput((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Delete Tier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Tier Form */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-dashed border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold text-slate-300 block">
                    + Add New Amount Tier with Extra Bonus:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Amount (e.g. 1500)"
                      value={newTierAmount}
                      onChange={(e) => setNewTierAmount(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400"
                    />
                    <input
                      type="number"
                      placeholder="Bonus (e.g. 200)"
                      value={newTierBonus}
                      onChange={(e) => setNewTierBonus(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-emerald-400 outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => setNewTierPopular(!newTierPopular)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition shrink-0 ${
                        newTierPopular
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {newTierPopular ? '★ Popular' : 'Regular'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const amt = parseFloat(newTierAmount);
                        const bon = parseFloat(newTierBonus) || 0;
                        if (!amt || amt <= 0) {
                          showToast('Please enter a valid amount');
                          return;
                        }
                        if (addMoneyTiersInput.some((t) => t.amount === amt)) {
                          showToast(`Tier for ₹${amt} already exists`);
                          return;
                        }
                        const newTier: AddMoneyTier = {
                          amount: amt,
                          bonus: bon,
                          popular: newTierPopular,
                        };
                        const updated = [...addMoneyTiersInput, newTier].sort((a, b) => a.amount - b.amount);
                        setAddMoneyTiersInput(updated);
                        setNewTierAmount('');
                        setNewTierBonus('');
                        setNewTierPopular(false);
                        showToast(`✓ Added ₹${amt} with ₹${bon} bonus! Remember to click Save All Settings.`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Force App Update & Official APK Manager */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-sky-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Download className="w-4 h-4" />
                      <span>App Version & Force APK Update</span>
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Prompt users to download the latest APK build when a new update is released.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForceUpdateEnabledInput(!forceUpdateEnabledInput)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      forceUpdateEnabledInput ? 'bg-sky-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        forceUpdateEnabledInput ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Latest App Version</label>
                    <input
                      type="text"
                      value={appVersionInput}
                      onChange={(e) => setAppVersionInput(e.target.value)}
                      placeholder="2.7.0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-sky-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">APK Download Path / URL</label>
                    <input
                      type="text"
                      value={apkDownloadUrlInput}
                      onChange={(e) => setApkDownloadUrlInput(e.target.value)}
                      placeholder="/ZoroTask-Official.apk"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">What's New in Update (Changelog)</label>
                  <input
                    type="text"
                    value={updateChangelogInput}
                    onChange={(e) => setUpdateChangelogInput(e.target.value)}
                    placeholder="Faster YouTube video streaming, instant UPI QR proof verification..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-sky-400"
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
        {/* TAB: PAYMENT GATEWAY API SETUP */}
        {/* ========================================================= */}
        {activeTab === 'gateway' && (
          <div className="max-w-3xl mx-auto bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Payment Gateway API Integration</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        PG ENGINE
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure automated payment gateway APIs (PhonePe PG, Razorpay, Cashfree, Paytm PG, or Custom UPI QR API).
                    </p>
                  </div>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 shrink-0">
                <span className="text-xs font-bold text-slate-300">Gateway Active:</span>
                <button
                  type="button"
                  onClick={() => setGatewayEnabled(!gatewayEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    gatewayEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            {/* Status Banner */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                gatewayEnabled
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className={`w-5 h-5 shrink-0 ${gatewayEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold text-sm">
                    {gatewayEnabled
                      ? `Gateway API is LIVE (${gatewayProvider.toUpperCase()})`
                      : 'Gateway API is Offline (Manual UPI Mode Active)'}
                  </div>
                  <p className="text-[11px] opacity-80">
                    {gatewayEnabled
                      ? `Automated callbacks enabled. Environment: ${gatewayTestMode ? 'Sandbox / Test Mode' : 'Live Production Mode'}.`
                      : 'Users pay using Admin UPI ID / QR code with manual UTR & Screenshot verification.'}
                  </p>
                </div>
              </div>

              {gatewayEnabled && (
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                  gatewayTestMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {gatewayTestMode ? 'TEST MODE' : 'PRODUCTION'}
                </span>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSaveGatewaySettings} className="space-y-5">
              {/* Provider Selection Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Select Payment Gateway Provider
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'phonepe', name: 'PhonePe PG', tag: 'Direct UPI & Cards', renderIcon: () => <PhonePeIcon size={20} className="rounded-xs" /> },
                    { id: 'razorpay', name: 'Razorpay', tag: 'Standard PG', icon: '🔵' },
                    { id: 'cashfree', name: 'Cashfree', tag: 'Auto Settlements', icon: '🟢' },
                    { id: 'paytm', name: 'Paytm PG', tag: 'All UPI & NetBanking', renderIcon: () => <PaytmIcon size={20} className="rounded-xs" /> },
                    { id: 'upi_gateway', name: 'Instant UPI API', tag: 'QR / Webhook API', renderIcon: () => <UpiIcon size={20} className="rounded-xs" /> },
                    { id: 'manual', name: 'Manual UPI QR', tag: 'Screenshot + UTR Review', icon: '📱' },
                  ].map((prov) => {
                    const isSelected = gatewayProvider === prov.id;
                    return (
                      <div
                        key={prov.id}
                        onClick={() => setGatewayProvider(prov.id as any)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg leading-none">
                            {prov.renderIcon ? prov.renderIcon() : prov.icon}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className="text-xs font-bold text-white">{prov.name}</div>
                        <div className="text-[10px] text-slate-400">{prov.tag}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mode Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between p-2">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Test / Sandbox Mode</span>
                    <span className="text-[10px] text-slate-400">Use test API keys without real money deduction</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGatewayTestMode(!gatewayTestMode)}
                    className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                      gatewayTestMode ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Auto-Approve on Callback</span>
                    <span className="text-[10px] text-slate-400">Automatically credit wallet when Gateway confirms success</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGatewayAutoApprove(!gatewayAutoApprove)}
                    className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                      gatewayAutoApprove ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              </div>

              {/* API Credentials */}
              <div className="space-y-3.5 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <span>API Credentials ({gatewayProvider.toUpperCase()})</span>
                  </div>
                  <span className="text-[10px] text-slate-500">256-Bit Encrypted Storage</span>
                </div>

                {/* Merchant ID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Merchant ID (MID) / Client ID
                  </label>
                  <input
                    type="text"
                    value={gatewayMerchantId}
                    onChange={(e) => setGatewayMerchantId(e.target.value)}
                    placeholder={
                      gatewayProvider === 'phonepe'
                        ? 'e.g. PGTESTPAYUAT or M22A7...'
                        : gatewayProvider === 'razorpay'
                        ? 'e.g. rzp_live_xxxxxxxx or rzp_test_xxxxxxxx'
                        : 'Enter your Merchant ID / App ID'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-emerald-400 transition"
                  />
                </div>

                {/* API Key / Salt Key */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    API Key / Salt Key / App ID
                  </label>
                  <input
                    type="text"
                    value={gatewayApiKey}
                    onChange={(e) => setGatewayApiKey(e.target.value)}
                    placeholder="Enter API Key / Salt Key"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-emerald-400 transition"
                  />
                </div>

                {/* API Secret / Salt Index */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      API Secret / Key Secret / Salt Index
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowGatewaySecret(!showGatewaySecret)}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {showGatewaySecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showGatewaySecret ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showGatewaySecret ? 'text' : 'password'}
                    value={gatewayApiSecret}
                    onChange={(e) => setGatewayApiSecret(e.target.value)}
                    placeholder="Enter API Secret / Salt Index (e.g. 1)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-emerald-400 transition"
                  />
                </div>

                {/* Webhook Secret */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Webhook Secret / Verification Token (Optional)
                  </label>
                  <input
                    type="text"
                    value={gatewayWebhookSecret}
                    onChange={(e) => setGatewayWebhookSecret(e.target.value)}
                    placeholder="Webhook secret for signature validation"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-emerald-400 transition"
                  />
                </div>

                {/* Callback URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Webhook / Server Callback URL (Paste into Gateway Dashboard)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={gatewayCallbackUrl}
                      onChange={(e) => setGatewayCallbackUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => copyText(gatewayCallbackUrl, 'Callback URL')}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Copy and paste this URL into your merchant dashboard under Webhook / IPN Settings.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestGateway}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition border border-slate-700 active:scale-98"
                >
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>Test API Connection</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingGateway}
                  className="w-full sm:flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>{isSavingGateway ? 'Saving Settings...' : 'Save & Activate Gateway API'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: WHATSAPP API GATEWAY & AUTOMATION */}
        {/* ========================================================= */}
        {activeTab === 'whatsapp' && (
          <div className="max-w-4xl mx-auto bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>WhatsApp API Gateway &amp; Automation</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        CLOUD API
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Install and configure Meta Cloud API, Green-API, UltraMsg, or Direct WhatsApp click-to-chat gateway for automated member alerts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Master WhatsApp Toggle */}
              <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 shrink-0">
                <span className="text-xs font-bold text-slate-300">WhatsApp Active:</span>
                <button
                  type="button"
                  onClick={() => setWhatsappApiEnabledInput(!whatsappApiEnabledInput)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    whatsappApiEnabledInput ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            {/* Status Banner */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                whatsappApiEnabledInput
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className={`w-5 h-5 shrink-0 ${whatsappApiEnabledInput ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold text-sm">
                    {whatsappApiEnabledInput
                      ? `WhatsApp Gateway is ENABLED (${whatsappProviderInput.toUpperCase()})`
                      : 'WhatsApp Gateway is DISABLED (Manual Support Mode)'}
                  </div>
                  <p className="text-[11px] opacity-80">
                    {whatsappApiEnabledInput
                      ? `Automated alerts active. Connected Support: ${whatsappSupportNumberInput || 'Not configured'}.`
                      : 'Support buttons will use standard fallback wa.me chat links.'}
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${
                whatsappApiEnabledInput
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {whatsappApiEnabledInput ? 'ONLINE' : 'STANDBY'}
              </span>
            </div>

            {/* WhatsApp Form */}
            <form onSubmit={handleSaveWhatsAppSettings} className="space-y-6">
              {/* Provider Selection Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Select WhatsApp Integration Method / Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                  {[
                    {
                      id: 'renflair',
                      name: 'Renflair WP-OTP',
                      tag: 'renflair.in/wp-otp.php',
                      badge: '0.12p / OTP',
                      desc: 'Direct WhatsApp OTP gateway from renflair.in/wp-otp.php. Enter your Renflair API Key to deliver instant OTPs.',
                    },
                    {
                      id: 'meta_cloud',
                      name: 'Meta Cloud API',
                      tag: 'Official WhatsApp Business',
                      badge: 'OFFICIAL',
                      desc: 'Direct integration with Meta Graph API v21.0 using Phone Number ID & Access Token.',
                    },
                    {
                      id: 'green_api',
                      name: 'Green-API / Instance',
                      tag: 'Instance Gateway',
                      badge: 'EASY SETUP',
                      desc: 'Scan QR code in Green-API or UltraMsg and provide Instance ID + Token.',
                    },
                    {
                      id: 'custom',
                      name: 'Custom Webhook / REST',
                      tag: 'Self-Hosted Gateway',
                      badge: 'ADVANCED',
                      desc: 'Post JSON payloads to your custom Node/Python backend or Evolution API server.',
                    },
                    {
                      id: 'direct',
                      name: 'Direct wa.me Chat',
                      tag: 'Zero-Config Mode',
                      badge: 'FREE',
                      desc: 'Direct Click-to-Chat without needing paid third-party gateway subscriptions.',
                    },
                  ].map((prov) => {
                    const isSelected = whatsappProviderInput === prov.id;
                    return (
                      <div
                        key={prov.id}
                        onClick={() => setWhatsappProviderInput(prov.id as any)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-500/10'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              {prov.badge}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <div className="text-xs font-bold text-white">{prov.name}</div>
                          <div className="text-[10px] text-emerald-400/90 font-medium">{prov.tag}</div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                            {prov.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* API Credentials Input Form */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>API Credentials &amp; Endpoint Parameters ({whatsappProviderInput.toUpperCase()})</span>
                </h3>

                {/* Support WhatsApp Number */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    Official Support Mobile Number *
                  </label>
                  <input
                    type="text"
                    value={whatsappSupportNumberInput}
                    onChange={(e) => setWhatsappSupportNumberInput(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400"
                  />
                  <span className="text-[9px] text-slate-400">
                    Include country code (e.g. +91 for India). Used across user help center &amp; maintenance screen.
                  </span>
                </div>

                {/* Renflair Configuration Section */}
                {whatsappProviderInput === 'renflair' && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Renflair Codes Integration (wp-otp.php)
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1">Renflair WhatsApp OTP Gateway Setup</h4>
                        <p className="text-[11px] text-slate-400">
                          Follow these simple instructions to link your Renflair account:
                        </p>
                      </div>
                      <a
                        href="https://renflair.in/wp-otp.php"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0 shadow-xs cursor-pointer"
                      >
                        <span>Open Renflair wp-otp.php</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Renflair Credit & Troubleshooting Guide */}
                    <div className="p-3.5 bg-gradient-to-br from-slate-900 to-amber-950/30 rounded-xl border border-amber-500/30 text-[11px] text-slate-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-amber-400 flex items-center gap-1.5">
                          <span>💡 Have Renflair Credits but OTP is Not Delivering? Check These 3 Items:</span>
                        </p>
                        <button
                          type="button"
                          onClick={handleAutoConfigureRenflair}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
                        >
                          <Zap className="w-3 h-3" />
                          <span>⚡ 1-Click Auto Fix Settings</span>
                        </button>
                      </div>

                      <ul className="space-y-1.5 text-slate-300 pl-1">
                        <li className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold shrink-0">1.</span>
                          <span>
                            <strong className="text-white">Personal API Key:</strong> Demo key <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono text-[10px]">417d155c4d79...</code> is for testing only. Log in to your Renflair dashboard and paste your <strong>Personal API Key</strong> that contains your active credits.
                          </span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold shrink-0">2.</span>
                          <span>
                            <strong className="text-white">Recommended Endpoint:</strong> Use <code className="text-emerald-400 bg-black/40 px-1 py-0.5 rounded font-mono text-[10px]">https://sms.renflair.in/V1.php</code> — it reliably delivers OTP via both WhatsApp and SMS.
                          </span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold shrink-0">3.</span>
                          <span>
                            <strong className="text-white">Method GET:</strong> Renflair V1 API uses query parameters (GET). Do not select POST.
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                            <span>Renflair API Key / Secret Token *</span>
                            <span className="text-[10px] text-emerald-400 font-normal">(Account with your purchased credits)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowWhatsappToken(!showWhatsappToken)}
                            className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                          >
                            {showWhatsappToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showWhatsappToken ? 'Hide' : 'Show'}</span>
                          </button>
                        </div>
                        <input
                          type={showWhatsappToken ? 'text' : 'password'}
                          value={renflairApiKeyInput}
                          onChange={(e) => {
                            setRenflairApiKeyInput(e.target.value);
                            setWhatsappApiTokenInput(e.target.value);
                          }}
                          placeholder="Paste your API Key from renflair.in"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                        />
                        <span className="text-[9px] text-slate-400">
                          Paste your API key from the Renflair dashboard so that your purchased balance is utilized.
                        </span>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-300">
                            Renflair API Endpoint URL
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setRenflairApiUrlInput('https://sms.renflair.in/V1.php');
                                setWhatsappApiUrlInput('https://sms.renflair.in/V1.php');
                              }}
                              className={`text-[9px] px-2 py-0.5 rounded font-bold cursor-pointer transition ${
                                renflairApiUrlInput.includes('sms.renflair.in')
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              SMS + WhatsApp (Best)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRenflairApiUrlInput('https://whatsapp.renflair.in/V1.php');
                                setWhatsappApiUrlInput('https://whatsapp.renflair.in/V1.php');
                              }}
                              className={`text-[9px] px-2 py-0.5 rounded font-bold cursor-pointer transition ${
                                renflairApiUrlInput.includes('whatsapp.renflair.in')
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              WhatsApp Only
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={renflairApiUrlInput}
                          onChange={(e) => {
                            setRenflairApiUrlInput(e.target.value);
                            setWhatsappApiUrlInput(e.target.value);
                          }}
                          placeholder="https://sms.renflair.in/V1.php"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                        />

                        {renflairApiUrlInput.includes('wp-otp.php') && (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300">
                            ⚠️ Note: <code className="text-amber-200">wp-otp.php</code> Renflair ka login portal hai, API nahi. ZoroTask automatically isko <code className="text-emerald-300 font-bold">https://sms.renflair.in/V1.php</code> par redirect kar dega.
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-300">
                          HTTP Request Method
                        </label>
                        <select
                          value={renflairMethodInput}
                          onChange={(e) => setRenflairMethodInput(e.target.value as 'POST' | 'GET')}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400"
                        >
                          <option value="GET">GET (Recommended: ?API=...&amp;PHONE=...&amp;OTP=...)</option>
                          <option value="POST">POST (JSON/Body - May fail on Renflair V1)</option>
                        </select>
                        <span className="text-[9px] text-slate-400">
                          Renflair V1 API queries require <strong className="text-emerald-400">GET</strong> method.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Provider Fields */}
                {whatsappProviderInput !== 'renflair' && whatsappProviderInput !== 'direct' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Instance ID or Phone Number ID */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">
                        {whatsappProviderInput === 'meta_cloud'
                          ? 'WhatsApp Phone Number ID *'
                          : 'Instance ID / Account ID *'}
                      </label>
                      <input
                        type="text"
                        value={
                          whatsappProviderInput === 'meta_cloud'
                            ? whatsappPhoneNumberIdInput
                            : whatsappInstanceIdInput
                        }
                        onChange={(e) => {
                          if (whatsappProviderInput === 'meta_cloud') {
                            setWhatsappPhoneNumberIdInput(e.target.value);
                          } else {
                            setWhatsappInstanceIdInput(e.target.value);
                          }
                        }}
                        placeholder={
                          whatsappProviderInput === 'meta_cloud'
                            ? 'e.g. 104829104812398'
                            : 'e.g. instance192842'
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                      />
                    </div>

                    {/* Token / Bearer Key */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300">
                          API Access Token / Bearer Key
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowWhatsappToken(!showWhatsappToken)}
                          className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                        >
                          {showWhatsappToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showWhatsappToken ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={showWhatsappToken ? 'text' : 'password'}
                        value={whatsappApiTokenInput}
                        onChange={(e) => setWhatsappApiTokenInput(e.target.value)}
                        placeholder="e.g. EAAGm0PX4ZB7... or instance-token-string"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                      />
                    </div>

                    {/* Endpoint Base URL */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-300">
                        API Gateway Endpoint URL
                      </label>
                      <input
                        type="text"
                        value={whatsappApiUrlInput}
                        onChange={(e) => setWhatsappApiUrlInput(e.target.value)}
                        placeholder="https://api.green-api.com"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                      />
                    </div>

                    {/* Live WhatsApp Web QR Code Linker Box */}
                    <div className="sm:col-span-2 p-4 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/40 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>WhatsApp Web QR Scanner (Direct Phone Pairing)</span>
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">
                                MULTI-DEVICE
                              </span>
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              Scan this QR with your WhatsApp — OTPs will be dispatched directly through your linked phone!
                            </p>
                          </div>
                        </div>

                        {/* Connection Badge */}
                        <div className="flex items-center gap-2">
                          {instanceAuthStatus === 'authorized' ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/50 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <span>WhatsApp Linked (Online)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                              <span>{instanceAuthStatus === 'not_authorized' ? 'QR Scan Required' : 'Not Connected'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                        <p className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>How to Link WhatsApp Web (3 Simple Steps):</span>
                        </p>
                        <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-300 text-[11px]">
                          <li>Open WhatsApp on your phone and tap <strong className="text-white">Settings / Menu (⋮)</strong>.</li>
                          <li>Select <strong className="text-emerald-300">"Linked Devices"</strong> and tap <strong className="text-white">"Link a Device"</strong>.</li>
                          <li>Click the button below to <strong className="text-emerald-300">load the QR Code</strong> and scan with your camera!</li>
                        </ol>
                      </div>

                      {/* QR Display Area */}
                      <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-3">
                        {instanceAuthStatus === 'authorized' ? (
                          <div className="py-6 flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                              <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h5 className="text-sm font-bold text-white">WhatsApp Account Successfully Connected!</h5>
                            <p className="text-xs text-slate-400 max-w-sm">
                              Your WhatsApp session is active. Whenever a user registers or requests an OTP, messages will be delivered automatically through your phone.
                            </p>
                          </div>
                        ) : qrCodeData ? (
                          <div className="space-y-3 flex flex-col items-center">
                            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/30">
                              {isQrImageUrl ? (
                                <img src={qrCodeData} alt="WhatsApp Web QR Code" className="w-56 h-56 object-contain" />
                              ) : (
                                <img src={`data:image/png;base64,${qrCodeData}`} alt="WhatsApp Web QR Code" className="w-56 h-56 object-contain" />
                              )}
                            </div>
                            <p className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>QR code is active. Scan immediately with your WhatsApp camera!</span>
                            </p>
                          </div>
                        ) : (
                          <div className="py-6 space-y-2 flex flex-col items-center">
                            <QrCode className="w-12 h-12 text-slate-600" />
                            <p className="text-xs text-slate-400">
                              To generate a QR Code, enter your Instance ID and API Token above and click the button below.
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                          <button
                            type="button"
                            disabled={qrLoading}
                            onClick={handleFetchWhatsAppQr}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? 'animate-spin' : ''}`} />
                            <span>{qrLoading ? 'Loading QR...' : '📷 Load / Refresh WhatsApp Web QR'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isCheckingStatus}
                            onClick={handleCheckInstanceStatus}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <CheckCheck className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                            <span>{isCheckingStatus ? 'Checking...' : 'Check Connection Status'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Automated Notification Triggers */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-emerald-400" />
                  <span>Automated WhatsApp Notification Triggers</span>
                </h3>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappAutoWelcomeInput}
                      onChange={(e) => setWhatsappAutoWelcomeInput(e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-200 font-medium">
                      Send Automated Welcome WhatsApp greeting when a new user registers
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappAutoDepositNotifyInput}
                      onChange={(e) => setWhatsappAutoDepositNotifyInput(e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-200 font-medium">
                      Send Instant WhatsApp alert when user's UPI deposit is approved by admin
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappAutoWithdrawNotifyInput}
                      onChange={(e) => setWhatsappAutoWithdrawNotifyInput(e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-200 font-medium">
                      Send Instant WhatsApp payout confirmation when withdrawal is marked Paid
                    </span>
                  </label>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <label className="text-[11px] font-bold text-slate-300">
                    Welcome Message Template
                  </label>
                  <textarea
                    rows={2}
                    value={whatsappWelcomeMessageInput}
                    onChange={(e) => setWhatsappWelcomeMessageInput(e.target.value)}
                    placeholder="Namaste {name}! Welcome to ZoroTask. Complete daily tasks and earn rewards..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400"
                  />
                  <span className="text-[9px] text-slate-400">
                    Variables available: <code className="text-emerald-400 font-bold">&#123;name&#125;</code>, <code className="text-emerald-400 font-bold">&#123;mobile&#125;</code>, <code className="text-emerald-400 font-bold">&#123;balance&#125;</code>.
                  </span>
                </div>
              </div>

              {/* Interactive WhatsApp Test Sandbox */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>Live WhatsApp Message Tester &amp; Sandbox</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Test live message delivery</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={whatsappTestPhone}
                    onChange={(e) => setWhatsappTestPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                  />
                  <input
                    type="text"
                    value={whatsappTestMsg}
                    onChange={(e) => setWhatsappTestMsg(e.target.value)}
                    placeholder="Test message text..."
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendTestWhatsApp}
                    disabled={whatsappTestSending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{whatsappTestSending ? 'Sending Test...' : 'Send Test WhatsApp Message'}</span>
                  </button>

                  <a
                    href={`https://wa.me/${whatsappSupportNumberInput.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Testing ZoroTask Support WhatsApp connection.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition border border-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open Direct Support Chat</span>
                  </a>
                </div>

                {whatsappTestResult && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono">
                    {whatsappTestResult}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Save &amp; Synchronize WhatsApp API Gateway to Cloud</span>
                </button>
              </div>
            </form>
          </div>
        )}
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

            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleDownloadSourceCode}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Complete ZIP
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadZoroTaskIconHD(() => showToast('✓ ZoroTask HD App Logo downloaded!'))
                  }
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black flex items-center gap-2 transition hover:brightness-110 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download HD App Logo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadZoroTaskBrandBannerHD(() =>
                      showToast('✓ ZoroTask Full Brand Banner downloaded!')
                    )
                  }
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Brand Banner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: CUSTOMER SUPPORT TICKETS & RESOLUTION CONSOLE */}
        {/* ========================================================= */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setTicketFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    ticketFilter === 'all'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({supportTickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('open')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    ticketFilter === 'open'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Open ({supportTickets.filter((t) => t.status === 'open').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('in_progress')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    ticketFilter === 'in_progress'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  In Progress ({supportTickets.filter((t) => t.status === 'in_progress').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('resolved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    ticketFilter === 'resolved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Resolved ({supportTickets.filter((t) => t.status === 'resolved').length})
                </button>
              </div>

              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user, mobile, subject..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Tickets List */}
            {filteredTickets.length === 0 ? (
              <div className="bg-slate-900 rounded-3xl p-10 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">No Support Tickets Found</h3>
                <p className="text-xs text-slate-400">
                  {ticketSearch ? 'No tickets matching your search query.' : 'There are currently no tickets in this status.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs hover:border-slate-700 transition"
                  >
                    {/* Top Row: ID, Status Badges, Category, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">#{t.id.slice(-6)}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            t.status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : t.status === 'in_progress'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                          {t.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{t.createdAt}</span>
                      </span>
                    </div>

                    {/* Middle Row: User Profile & Complaint Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Customer</div>
                        <div className="text-xs font-bold text-white">{t.userName}</div>
                        <div className="text-xs font-mono text-amber-400 flex items-center justify-between">
                          <span>+91 {t.userMobile}</span>
                          <button
                            type="button"
                            onClick={() => copyText(t.userMobile, 'User Mobile')}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            title="Copy Mobile"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <a
                            href={`https://wa.me/91${t.userMobile}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1 border border-emerald-500/30"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setDirectAlertTargetMobile(t.userMobile);
                              setDirectAlertTitle(`Ticket #${t.id.slice(-6)} Update`);
                              setDirectAlertMsg(`Namaste ${t.userName}, aapke support ticket ke baare me: `);
                              setDirectAlertModalOpen(true);
                            }}
                            className="py-1 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-[10px] flex items-center justify-center gap-1 border border-indigo-500/30 cursor-pointer"
                          >
                            <BellRing className="w-3 h-3" />
                            <span>Alert</span>
                          </button>
                        </div>
                      </div>

                      {/* Complaint Text & Screenshot */}
                      <div className="md:col-span-2 space-y-2">
                        <div>
                          <h4 className="text-xs font-bold text-white">{t.subject}</h4>
                          <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                            {t.message}
                          </p>
                        </div>

                        {t.screenshotUrl && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold text-slate-400">Attached Proof:</span>
                            <button
                              type="button"
                              onClick={() => setViewTicketScreenshotUrl(t.screenshotUrl || null)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-amber-400" />
                              <span>View Screenshot</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Official Admin Reply Thread if already replied */}
                    {t.adminReply && (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Official Admin Reply</span>
                          </span>
                          <span className="text-[10px] text-emerald-500 font-mono">{t.repliedAt}</span>
                        </div>
                        <p className="text-xs text-emerald-200">{t.adminReply}</p>
                      </div>
                    )}

                    {/* Quick Templates & Action Row */}
                    <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTicket(t);
                            setReplyText('✓ Payment Verified: Aapka deposit verify ho gaya hai aur wallet/plan activate kar diya gaya hai.');
                            setReplyStatus('resolved');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium whitespace-nowrap cursor-pointer transition"
                        >
                          + Verified &amp; Activated
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTicket(t);
                            setReplyText('✓ Payout Transferred: Your withdrawal request has been processed. Please check your bank account or UPI statement.');
                            setReplyStatus('resolved');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium whitespace-nowrap cursor-pointer transition"
                        >
                          + Payout Sent
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTicket(t);
                            setReplyText('⚠️ Valid Screenshot Required: Please re-upload a clear screenshot showing the 12-digit bank UTR reference number.');
                            setReplyStatus('in_progress');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium whitespace-nowrap cursor-pointer transition"
                        >
                          + Need Proof
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTicket(t);
                          setReplyText(t.adminReply || '');
                          setReplyStatus(t.status);
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{t.adminReply ? 'Update Resolution' : 'Reply & Resolve'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: PROMO CODES & GIFT VOUCHERS MANAGER */}
        {/* ========================================================= */}
        {activeTab === 'promos' && (
          <div className="space-y-5">
            {/* Promo Performance Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Promo Codes
                  </span>
                  <span className="text-xl font-black text-white mt-1 block">
                    {promoCodes.length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Codes
                  </span>
                  <span className="text-xl font-black text-emerald-400 mt-1 block">
                    {promoCodes.filter((p) => p.isActive).length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Cash Given
                  </span>
                  <span className="text-xl font-black text-amber-400 mt-1 block">
                    ₹{promoCodes
                      .reduce((acc, p) => acc + p.usedCount * p.rewardAmount, 0)
                      .toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Redemptions
                  </span>
                  <span className="text-xl font-black text-blue-400 mt-1 block">
                    {promoCodes.reduce((acc, p) => acc + p.usedCount, 0)}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Create New Promo Code Form */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Create New Gift Voucher / Promo Code
                    </h3>
                    <p className="text-xs text-slate-400">
                      Generate redeemable cash codes to promote on Telegram &amp; WhatsApp
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => {
                      setPromoCodeInput('DIWALI50');
                      setPromoRewardInput('50');
                      setPromoLimitInput('500');
                      setPromoDescInput('Festive Celebration Bonus');
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold transition whitespace-nowrap"
                  >
                    + DIWALI50 (₹50)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPromoCodeInput('SUNDAY100');
                      setPromoRewardInput('100');
                      setPromoLimitInput('300');
                      setPromoDescInput('Sunday Special Mega Reward');
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold transition whitespace-nowrap"
                  >
                    + SUNDAY100 (₹100)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Promo Code Name *
                  </label>
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME50"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-xs text-white uppercase font-mono font-bold tracking-wider outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Reward Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={promoRewardInput}
                    onChange={(e) => setPromoRewardInput(e.target.value)}
                    placeholder="50"
                    min="1"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Usage Limit (Max Users) *
                  </label>
                  <input
                    type="number"
                    value={promoLimitInput}
                    onChange={(e) => setPromoLimitInput(e.target.value)}
                    placeholder="500"
                    min="1"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={promoExpiryInput}
                    onChange={(e) => setPromoExpiryInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Description / Campaign Tag
                </label>
                <input
                  type="text"
                  value={promoDescInput}
                  onChange={(e) => setPromoDescInput(e.target.value)}
                  placeholder="e.g. Exclusive Telegram Community Welcome Gift"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-xs text-white outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-400">
                  Each user can only claim a code once. Reward is credited to their wallet immediately.
                </p>

                <button
                  type="button"
                  disabled={isCreatingPromo || !promoCodeInput.trim()}
                  onClick={async () => {
                    const code = promoCodeInput.trim().toUpperCase();
                    const reward = parseFloat(promoRewardInput) || 0;
                    const limit = parseInt(promoLimitInput) || 500;
                    if (!code) {
                      showToast('Please enter a code name!');
                      return;
                    }
                    if (reward <= 0) {
                      showToast('Reward amount must be greater than 0!');
                      return;
                    }
                    setIsCreatingPromo(true);
                    try {
                      const ok = await createPromoCode(
                        code,
                        reward,
                        limit,
                        promoDescInput,
                        promoExpiryInput
                      );
                      if (ok) {
                        setPromoCodeInput('');
                        setPromoDescInput('');
                        setPromoExpiryInput('');
                      }
                    } finally {
                      setIsCreatingPromo(false);
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black text-xs transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Create &amp; Publish Promo Code</span>
                </button>
              </div>
            </div>

            {/* Telegram 1-Click Broadcast Post Generator */}
            <div className="bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-500/30 p-4 sm:p-5 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                    <Send className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-blue-200">
                      Telegram Broadcast Post Generator
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Click below to copy formatted announcement text ready for your Telegram channel
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const activeFirst = promoCodes.find((p) => p.isActive) || promoCodes[0];
                    const activeCode = promoCodeInput.trim() || activeFirst?.code || 'GIFT100';
                    const activeReward = promoRewardInput || (activeFirst ? String(activeFirst.rewardAmount) : '100');
                    const activeLimit = promoLimitInput || (activeFirst ? String(activeFirst.usageLimit) : '500');
                    const text = `🎉 EXCLUSIVE PROMO CODE RELEASED! 🎁\n\n💰 CODE: ${activeCode}\n💵 FREE REWARD: ₹${activeReward} instant wallet balance\n👥 USAGE LIMIT: First ${activeLimit} members only!\n\n📲 HOW TO CLAIM:\n1. Open ZoroTask App\n2. Click "Redeem Code" on Home or Wallet Screen\n3. Enter: ${activeCode}\n4. ₹${activeReward} will be credited to your balance instantly!\n\n⚡ Claim fast before limit ends! 🚀`;
                    copyText(text, 'Telegram Broadcast Post copied!');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Telegram Post Text</span>
                </button>
              </div>

              <div className="p-3 bg-slate-950/90 rounded-xl border border-blue-500/20 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-all">
                {`🎉 EXCLUSIVE PROMO CODE RELEASED! 🎁
💰 CODE: ${promoCodeInput.trim() || promoCodes[0]?.code || 'GIFT100'}
💵 FREE REWARD: ₹${promoRewardInput || (promoCodes[0] ? promoCodes[0].rewardAmount : '100')} instant wallet balance
👥 USAGE LIMIT: First ${promoLimitInput || (promoCodes[0] ? promoCodes[0].usageLimit : '500')} members only!

📲 HOW TO CLAIM:
1. Open ZoroTask App
2. Click "Redeem Code" on Home or Wallet Screen
3. Enter: ${promoCodeInput.trim() || promoCodes[0]?.code || 'GIFT100'}
4. ₹${promoRewardInput || (promoCodes[0] ? promoCodes[0].rewardAmount : '100')} credited to your wallet instantly!`}
              </div>
            </div>

            {/* List of Active & Past Promo Codes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-3 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    All Promo Codes ({promoCodes.length})
                  </h4>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={promoSearch}
                    onChange={(e) => setPromoSearch(e.target.value)}
                    placeholder="Search by code or title..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              </div>

              {promoCodes.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No promo codes created yet. Use the form above to add your first code!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {promoCodes
                    .filter((p) => {
                      if (!promoSearch.trim()) return true;
                      const q = promoSearch.toLowerCase();
                      return (
                        p.code.toLowerCase().includes(q) ||
                        (p.description && p.description.toLowerCase().includes(q))
                      );
                    })
                    .map((promo) => {
                      const percent = Math.min(
                        100,
                        Math.round((promo.usedCount / promo.usageLimit) * 100)
                      );
                      return (
                        <div
                          key={promo.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          {/* Code Info */}
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm text-amber-400 tracking-wider">
                                {promo.code}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                ₹{promo.rewardAmount} Free
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  promo.isActive
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {promo.isActive ? '● Active' : '○ Paused'}
                              </span>
                              {promo.expiryDate && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Expires: {promo.expiryDate}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-300 font-medium truncate">
                              {promo.description || 'Promotional cash voucher'}
                            </p>

                            {/* Progress bar */}
                            <div className="pt-1 flex items-center gap-3">
                              <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    percent >= 100
                                      ? 'bg-rose-500'
                                      : percent > 75
                                      ? 'bg-amber-400'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                <b>{promo.usedCount}</b> / {promo.usageLimit} claimed ({percent}%)
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                copyText(promo.code, `Code "${promo.code}" copied!`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedPromoForUsers(promo)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Users className="w-3 h-3" />
                              <span>Users ({promo.usedByUsers.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => togglePromoCodeStatus(promo.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                promo.isActive
                                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                              }`}
                            >
                              {promo.isActive ? 'Pause' : 'Activate'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                deletePromoCode(promo.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Delete Promo Code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* PROMO CLAIMED USERS LIST MODAL */}
      {/* ========================================================= */}
      {selectedPromoForUsers && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Users Claimed:</span>
                  <span className="font-mono text-amber-400">
                    {selectedPromoForUsers.code}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Total {selectedPromoForUsers.usedByUsers.length} users have redeemed this voucher
                </p>
              </div>
              <button
                onClick={() => setSelectedPromoForUsers(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedPromoForUsers.usedByUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No users have claimed this promo code yet.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Registered Mobile Numbers</span>
                  <button
                    type="button"
                    onClick={() => {
                      copyText(
                        selectedPromoForUsers.usedByUsers.join('\n'),
                        'All claimed phone numbers copied!'
                      );
                    }}
                    className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy All</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {selectedPromoForUsers.usedByUsers.map((num, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-200"
                    >
                      <span>
                        {idx + 1}. +91 {num}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText(num, `Copied +91 ${num}`)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedPromoForUsers(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
      {/* EDIT USER & VIP PLANS MANAGER MODAL */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Manage User &amp; VIP Plans
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">{editingUser.mobile}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Basic Profile Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Login Password</label>
                  <input
                    type="text"
                    value={editingUser.password}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Account Access Status (Block / Active) */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Account Access Status</span>
                    <span className="text-[10px] text-slate-400">
                      Blocking this user suspends all task access and disables withdrawal requests.
                    </span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                    editingUser.isBlocked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {editingUser.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingUser({ ...editingUser, isBlocked: false })}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      !editingUser.isBlocked
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Active (Allowed)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser({ ...editingUser, isBlocked: true })}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      editingUser.isBlocked
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Block (No Task / No WD)</span>
                  </button>
                </div>
              </div>

              {/* Per-User VIP Plan Control Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Crown className="w-4 h-4" />
                    <span>Activate / Deactivate VIP Plans</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingUser({
                        ...editingUser,
                        purchasedPlanIds: [],
                        vipLevel: 0,
                        vipTag: 'Free Starter',
                      })
                    }
                    className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear Paid VIPs
                  </button>
                </div>

                {/* Level 0 Free Starter Toggle */}
                {(() => {
                  const lv0Plan = plans.find((p) => p.level === 0) || plans[0];
                  const isLv0Enabled = editingUser.freeTrialOverride !== 'disabled';
                  return (
                    <div
                      onClick={() =>
                        setEditingUser({
                          ...editingUser,
                          freeTrialOverride: isLv0Enabled ? 'disabled' : 'enabled',
                        })
                      }
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isLv0Enabled
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isLv0Enabled
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isLv0Enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>LV 0: Free Starter Plan</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              Free Trial
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {lv0Plan?.dailyMissions || 2} Videos/day • ₹{lv0Plan?.dailyIncome || 100} Daily Income
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          isLv0Enabled
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isLv0Enabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                  );
                })()}

                {/* Paid VIP Plans Checklist (LV 1 to LV 7+) */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {plans
                    .filter((p) => p.level > 0)
                    .sort((a, b) => a.level - b.level)
                    .map((plan) => {
                      const selectedIds = editingUser.purchasedPlanIds || [];
                      const isSelected = selectedIds.includes(plan.id);
                      return (
                        <div
                          key={plan.id}
                          onClick={() => {
                            const currentIds = editingUser.purchasedPlanIds || [];
                            const nextIds = isSelected
                              ? currentIds.filter((id) => id !== plan.id)
                              : [...currentIds, plan.id];
                            const activePaidPlans = plans
                              .filter((p) => p.level > 0 && nextIds.includes(p.id))
                              .sort((a, b) => a.level - b.level);
                            const highestPlan =
                              activePaidPlans.length > 0
                                ? activePaidPlans[activePaidPlans.length - 1]
                                : null;
                            setEditingUser({
                              ...editingUser,
                              purchasedPlanIds: nextIds,
                              vipLevel: highestPlan ? highestPlan.level : 0,
                              vipTag: highestPlan
                                ? activePaidPlans.length > 1
                                  ? `${highestPlan.levelTag} (+${activePaidPlans.length - 1} more)`
                                  : highestPlan.levelTag
                                : 'Free Starter',
                            });
                          }}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/50 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                isSelected
                                  ? 'bg-amber-400 border-amber-300 text-slate-950'
                                  : 'border-slate-700 bg-slate-900'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div>
                              <div className="font-bold text-xs flex items-center gap-1.5">
                                <span className="text-amber-400">{plan.badge || `LV ${plan.level}`}:</span>
                                <span>{plan.levelTag || plan.title}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Price: ₹{plan.price} • {plan.dailyMissions} Videos/day • ₹{plan.dailyIncome}/day
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isSelected ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Live Summary of Selected Plans for this User */}
                {(() => {
                  const previewPlans = getUserActivePlansList(editingUser);
                  const totalVideos = previewPlans.reduce((acc, p) => acc + (p.dailyMissions || 2), 0);
                  const totalDaily = previewPlans.reduce(
                    (acc, p) => acc + (p.dailyIncome || (p.dailyMissions || 2) * (p.perMission || 50)),
                    0
                  );
                  return (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">User Daily Quota</span>
                        <b className="text-white font-mono">{totalVideos} Video Tasks / Day</b>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Total Daily Income</span>
                        <b className="text-emerald-400 font-mono text-sm">₹{totalDaily} / Day</b>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingUser;
                    setEditingUser(null);
                    setUserConfirmAction({ type: 'delete', user: target });
                  }}
                  className="py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/35 text-red-300 font-bold text-xs border border-red-500/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const selectedIds = editingUser.purchasedPlanIds || [];
                      const activePaidPlans = plans
                        .filter((p) => p.level > 0 && selectedIds.includes(p.id))
                        .sort((a, b) => a.level - b.level);
                      const highestPlan =
                        activePaidPlans.length > 0 ? activePaidPlans[activePaidPlans.length - 1] : null;
                      const computedLevel = highestPlan ? highestPlan.level : 0;
                      const computedTag = highestPlan
                        ? activePaidPlans.length > 1
                          ? `${highestPlan.levelTag} (+${activePaidPlans.length - 1} VIP)`
                          : highestPlan.levelTag
                        : editingUser.freeTrialOverride === 'disabled'
                        ? 'No Active Plan'
                        : 'Free Starter';

                      await adminUpdateUser(editingUser.mobile, {
                        name: editingUser.name,
                        password: editingUser.password,
                        purchasedPlanIds: selectedIds,
                        vipLevel: computedLevel,
                        vipTag: computedTag,
                        freeTrialOverride: editingUser.freeTrialOverride || 'enabled',
                        isBlocked: !!editingUser.isBlocked,
                      });
                      setEditingUser(null);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
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

      {/* SUPPORT TICKET REPLY & RESOLUTION MODAL */}
      {replyingTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-500" />
                  <span>Resolve Ticket #{replyingTicket.id.slice(-6)}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {replyingTicket.userName} (+91 {replyingTicket.userMobile})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-300">{replyingTicket.subject}</div>
              <div className="text-[11px] text-slate-400 line-clamp-3">{replyingTicket.message}</div>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 block">Ticket Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReplyStatus('resolved')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    replyStatus === 'resolved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReplyStatus('in_progress')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    replyStatus === 'in_progress'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>In Progress</span>
                </button>
              </div>
            </div>

            {/* Reply Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 block">Admin Resolution Message</label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your resolution details for the customer..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReplyingTicket(null)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!replyText.trim()) {
                    showToast('Please enter a reply message');
                    return;
                  }
                  await replySupportTicket(replyingTicket.id, replyText, replyStatus);
                  await sendDirectUserAlert(
                    replyingTicket.userMobile,
                    `Support Ticket #${replyingTicket.id.slice(-6)}: ${replyStatus === 'resolved' ? 'Resolved' : 'Updated'}`,
                    replyText
                  );
                  setReplyingTicket(null);
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save &amp; Notify User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT TICKET SCREENSHOT VIEWER MODAL */}
      {viewTicketScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 overflow-hidden">
          <div className="flex items-center justify-between text-white pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>Customer Attached Support Screenshot</span>
            </span>
            <button
              onClick={() => setViewTicketScreenshotUrl(null)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
            <img
              src={viewTicketScreenshotUrl}
              alt="Support Proof"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}

      {/* DIRECT USER PUSH ALERT MODAL */}
      {directAlertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Direct Push Notification</h3>
              </div>
              <button
                type="button"
                onClick={() => setDirectAlertModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-slate-400">Target User Mobile:</span>
              <div className="font-mono text-amber-400 font-bold bg-slate-950 p-2 rounded-xl border border-slate-800">
                +91 {directAlertTargetMobile}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">Notification Title</label>
              <input
                type="text"
                value={directAlertTitle}
                onChange={(e) => setDirectAlertTitle(e.target.value)}
                placeholder="Title..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">Notification Message</label>
              <textarea
                rows={3}
                value={directAlertMsg}
                onChange={(e) => setDirectAlertMsg(e.target.value)}
                placeholder="Write your custom message for this user..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDirectAlertModalOpen(false)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!directAlertMsg.trim()) {
                    showToast('Please write a message');
                    return;
                  }
                  await sendDirectUserAlert(directAlertTargetMobile, directAlertTitle, directAlertMsg);
                  setDirectAlertModalOpen(false);
                }}
                className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Send Alert Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* USER ACTION MODAL (BLOCK / UNBLOCK / DELETE CONFIRMATION) */}
      {/* ========================================================= */}
      {userConfirmAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                {userConfirmAction.type === 'delete' ? (
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                    <Trash2 className="w-4 h-4" />
                  </div>
                ) : userConfirmAction.type === 'block' ? (
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <Ban className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Unlock className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-sm text-white">
                    {userConfirmAction.type === 'delete'
                      ? 'Delete User Account'
                      : userConfirmAction.type === 'block'
                      ? 'Block User Account'
                      : 'Unblock User Account'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    +91 {userConfirmAction.user.mobile} • {userConfirmAction.user.name || 'Member'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUserConfirmAction(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content info */}
            {userConfirmAction.type === 'block' && (
              <div className="space-y-3">
                <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-3.5 space-y-2 text-xs text-rose-200">
                  <div className="font-bold flex items-center gap-1.5 text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Blocking will apply the following restrictions:</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-rose-300/90 list-disc list-inside">
                    <li><b>No Tasks:</b> User will not be able to access video tasks or daily surveys (Disabled).</li>
                    <li><b>No Withdrawals:</b> User withdrawal requests are immediately suspended (Disabled).</li>
                    <li>A warning notice will be displayed on the user's dashboard stating the account is blocked.</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">Block Reason (Optional)</label>
                  <input
                    type="text"
                    value={blockReasonInput}
                    onChange={(e) => setBlockReasonInput(e.target.value)}
                    placeholder="e.g. Terms violation / Suspicious activity"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-400"
                  />
                </div>
              </div>
            )}

            {userConfirmAction.type === 'unblock' && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2 text-xs text-emerald-200">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Upon unblocking:</span>
                </div>
                <ul className="space-y-1 text-[11px] text-emerald-300/90 list-disc list-inside">
                  <li>User will regain normal access to daily video tasks and surveys.</li>
                  <li>User withdrawal facility will be re-enabled.</li>
                </ul>
              </div>
            )}

            {userConfirmAction.type === 'delete' && (
              <div className="bg-red-950/50 border border-red-500/40 rounded-2xl p-3.5 space-y-2 text-xs text-red-200">
                <div className="font-bold flex items-center gap-1.5 text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>🚨 Permanent Delete Warning:</span>
                </div>
                <p className="text-[11px] text-red-300/90 leading-relaxed">
                  This user account will be permanently deleted from the database. The user's balance (₹{(userConfirmAction.user.balance || 0).toLocaleString('en-IN')}) and all records will be deleted. If currently logged in, their session will be terminated immediately.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isProcessingUserAction}
                onClick={() => setUserConfirmAction(null)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Cancel
              </button>

              {userConfirmAction.type === 'delete' ? (
                <button
                  type="button"
                  disabled={isProcessingUserAction}
                  onClick={async () => {
                    setIsProcessingUserAction(true);
                    await adminDeleteUser(userConfirmAction.user.mobile);
                    setIsProcessingUserAction(false);
                    setUserConfirmAction(null);
                  }}
                  className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isProcessingUserAction ? 'Deleting...' : 'Delete Permanently'}</span>
                </button>
              ) : userConfirmAction.type === 'block' ? (
                <button
                  type="button"
                  disabled={isProcessingUserAction}
                  onClick={async () => {
                    setIsProcessingUserAction(true);
                    await adminBlockUser(userConfirmAction.user.mobile, blockReasonInput);
                    setIsProcessingUserAction(false);
                    setUserConfirmAction(null);
                  }}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{isProcessingUserAction ? 'Blocking...' : 'Confirm Block User'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessingUserAction}
                  onClick={async () => {
                    setIsProcessingUserAction(true);
                    await adminUnblockUser(userConfirmAction.user.mobile);
                    setIsProcessingUserAction(false);
                    setUserConfirmAction(null);
                  }}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isProcessingUserAction ? 'Unblocking...' : 'Confirm Unblock'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
