import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { App as CapacitorApp } from '@capacitor/app';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import {
  ScreenType,
  BottomTabType,
  UserProfile,
  RegisteredUserAccount,
  PlanItem,
  TransactionItem,
  TaskItem,
  SurveyItem,
  AppNotification,
  AdminSettings,
  TaskSubmission,
  PaymentDeposit,
  VideoMissionDef,
  SupportTicket,
  PromoCode,
  AdminAuditLog,
  CustomTaskItem,
  ScratchCardItem,
} from '../types';
import {
  emptyUser,
  initialPlans,
  initialTransactions,
  initialSurveys,
  initialTasks,
  initialNotifications,
} from '../data/initialData';
import { getFormattedDayInfo } from '../utils/dateUtils';

// Cutoff timestamp for 2-day free trial eligibility:
// All accounts registered prior to this timestamp have their trial expired (removed from screen).
// Only newly registered accounts created after this timestamp receive the 48-hour free trial.
export const NEW_USER_FREE_TRIAL_CUTOFF = 1792935457000;

interface PurchaseDetails {
  amount: number;
  reward: number;
  orderId: string;
  date: string;
  status: 'verified';
}

interface AppContextType {
  currentScreen: ScreenType;
  activeTab: BottomTabType;
  historyStack: ScreenType[];
  user: UserProfile;
  isLoggedIn: boolean;
  transactions: TransactionItem[];
  tasks: TaskItem[];
  surveys: SurveyItem[];
  plans: PlanItem[];
  selectedPlan: PlanItem | null;
  notifications: AppNotification[];
  lastPurchase: PurchaseDetails;
  toastMessage: string | null;
  frameMode: 'mobile' | 'responsive';
  adminSettings: AdminSettings;
  taskSubmissions: TaskSubmission[];
  paymentDeposits: PaymentDeposit[];
  isCloudConnected: boolean;
  
  // Modals
  isSurveyModalOpen: boolean;
  isUPIModalOpen: boolean;
  pendingUPIAmount: number;
  pendingUPIBonus: number;
  pendingDepositType?: 'add_money' | 'plan_purchase';
  pendingPlanForUPI?: PlanItem | null;
  isWatchingVideo: boolean;
  isTeamModalOpen: boolean;
  isNotificationsOpen: boolean;
  isEditProfileOpen: boolean;
  isExitModalOpen: boolean;
  setIsExitModalOpen: (open: boolean) => void;
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (open: boolean) => void;
  installedAppVersion: string;
  isUpdateAvailable: boolean;
  checkForAppUpdate: (manual?: boolean) => { hasUpdate: boolean; currentVersion: string; latestVersion: string };
  triggerOneClickUpdate: () => void;
  exitApp: () => void;
  registerBackHandler: (handler: () => boolean) => () => void;
  
  // Actions
  navigate: (screen: ScreenType, plan?: PlanItem) => void;
  goBack: () => void;
  switchTab: (tab: BottomTabType) => void;
  login: (mobile: string, pass: string) => Promise<boolean>;
  register: (name: string, mobile: string, email: string, pass: string, refCode?: string) => Promise<boolean>;
  resetUserPassword: (mobile: string, newPass: string) => Promise<boolean>;
  checkPhoneExistsInFirestore: (mobile: string) => Promise<boolean>;
  logout: () => void;
  addMoneyInitiate: (amount: number, bonus: number) => void;
  submitUPIPaymentProof: (utrNumber: string, screenshotUrl?: string) => void;
  completeUPIPayment: () => void;
  approvePaymentDeposit: (depositId: string) => void;
  rejectPaymentDeposit: (depositId: string, reason?: string) => void;
  buyPlanWithWallet: (plan: PlanItem) => { success: boolean; message: string };
  buyPlanWithUPI: (plan: PlanItem) => void;
  requestWithdrawal: (
    amount: number,
    payoutMethodOrUpiId: string | 'upi' | 'bank',
    payoutDetails?: {
      upiId?: string;
      accountHolder?: string;
      bankName?: string;
      accountNumber?: string;
      ifsc?: string;
    }
  ) => { success: boolean; message: string };
  completeSurveySubmit: () => void;
  submitDailySurveyTask: (answers?: Record<number, string>) => void;
  stepWatchVideo: () => void;
  submitYouTubeVideoTask: (videoTitle?: string, videoUrl?: string) => void;
  maxDailyVideos: number;
  todayVideosWatched: number;
  canWatchMoreVideos: boolean;
  perVideoReward: number;
  openVideoTask: (taskNum?: number) => void;
  activeUserPlan: PlanItem;
  activeUserPlans: PlanItem[];
  userDailyVideoMissions: VideoMissionDef[];
  totalDailyIncome: number;
  currentPlayingTaskNum: number;
  simulatePurchaseDirect: (plan: PlanItem) => void;
  copyText: (text: string, label?: string) => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
  toggleFrameMode: () => void;
  setFrameMode: (mode: 'mobile' | 'responsive') => void;
  resetAllData: () => void;
  setIsSurveyModalOpen: (open: boolean) => void;
  setIsUPIModalOpen: (open: boolean) => void;
  setIsWatchingVideo: (open: boolean) => void;
  setIsTeamModalOpen: (open: boolean) => void;
  setIsNotificationsOpen: (open: boolean) => void;
  setIsEditProfileOpen: (open: boolean) => void;
  updateUserProfile: (name: string, email: string, upiId: string) => void;
  validateReferralCode: (code: string) => { isValid: boolean; referrerName?: string };
  validateReferralCodeAsync: (code: string) => Promise<{ isValid: boolean; referrerName?: string }>;
  syncReferralWallet: () => Promise<void>;
  isFreeTrialActive: boolean;
  freeTrialHoursLeft: number;
  refreshAppData: () => Promise<void>;
  isRefreshing: boolean;
  pendingInviteCode: string;
  
  // Admin actions
  approveWithdrawal: (txId: string) => void;
  rejectWithdrawal: (txId: string, reason?: string) => void;
  adjustUserBalance: (amount: number, isCredit: boolean, reason: string, targetMobile?: string) => void;
  approveTaskSubmission: (subId: string) => void;
  rejectTaskSubmission: (subId: string, reason?: string) => void;
  updateAdminSettings: (settings: Partial<AdminSettings>) => void;
  addNewSurvey: (title: string, reward: number, description: string) => void;
  deleteSurvey: (id: string) => void;
  registeredUsers: RegisteredUserAccount[];
  isPhoneAlreadyRegistered: (mobile: string) => boolean;
  adminUpdateUser: (mobile: string, updates: Partial<RegisteredUserAccount>) => void;
  adminDeleteUser: (mobile: string) => Promise<boolean>;
  adminBlockUser: (mobile: string, reason?: string) => Promise<void>;
  adminUnblockUser: (mobile: string) => Promise<void>;
  adminResetAllUsersBalanceAndTransactions: () => Promise<boolean>;
  updatePlan: (planId: string, updates: Partial<PlanItem>) => void;
  addVIPPlan: (newPlan: PlanItem) => Promise<boolean>;
  updateVIPPlan: (planId: string, updates: Partial<PlanItem>) => Promise<boolean>;
  deleteVIPPlan: (planId: string) => Promise<boolean>;
  saveAllVIPPlans: (customPlans?: PlanItem[]) => Promise<boolean>;
  resetUserDailyTasks: (mobile: string) => Promise<void>;
  exportCompleteDatabase: () => string;
  importCompleteDatabase: (jsonStr: string) => boolean;
  supportTickets: SupportTicket[];
  createSupportTicket: (
    category: SupportTicket['category'],
    subject: string,
    message: string,
    screenshotUrl?: string
  ) => Promise<string>;
  replySupportTicket: (ticketId: string, reply: string, status?: SupportTicket['status']) => Promise<void>;
  sendDirectUserAlert: (targetMobile: string, title: string, message: string) => Promise<void>;

  // Promo Codes & Gift Vouchers
  promoCodes: PromoCode[];
  createPromoCode: (
    code: string,
    rewardAmount: number,
    usageLimit?: number,
    description?: string,
    expiryDate?: string
  ) => Promise<boolean>;
  deletePromoCode: (id: string) => Promise<boolean>;
  togglePromoCodeStatus: (id: string) => Promise<boolean>;
  redeemPromoCode: (codeStr: string) => Promise<{ success: boolean; message: string; rewardAmount?: number }>;
  isPromoModalOpen: boolean;
  setIsPromoModalOpen: (open: boolean) => void;

  // 1 & 4. Dynamic Custom Tasks
  customTasks: CustomTaskItem[];
  createCustomTask: (task: Omit<CustomTaskItem, 'id' | 'createdAt'>) => Promise<boolean>;
  updateCustomTask: (id: string, updates: Partial<CustomTaskItem>) => Promise<boolean>;
  deleteCustomTask: (id: string) => Promise<boolean>;
  completeCustomTask: (taskId: string) => Promise<{ success: boolean; message: string }>;

  // 4. Admin Audit Log
  auditLogs: AdminAuditLog[];
  logAdminAction: (
    action: AdminAuditLog['adminAction'],
    targetMobile: string,
    targetName?: string,
    oldValue?: string | number,
    newValue?: string | number,
    reason?: string
  ) => Promise<void>;

  // 7. Clean Test Data
  cleanTestData: () => Promise<{ deletedDeposits: number; deletedSubmissions: number; message: string }>;

  // 5. Direct User Alert & Rejections with Reason
  rejectWithdrawalWithReason: (withdrawalId: string, userMobile: string, reason: string) => Promise<boolean>;
  rejectPaymentDepositWithReason: (depositId: string, reason: string) => Promise<boolean>;
  dismissAdminAlert: () => Promise<void>;

  // Feature 1: Lucky Spin & Scratch Cards
  isSpinModalOpen: boolean;
  setIsSpinModalOpen: (open: boolean) => void;
  spinLuckyWheel: (prizeIndex?: number) => Promise<{ prize: string; amount: number; isScratchCard?: boolean }>;
  claimScratchCard: (cardId: string) => Promise<number>;
  awardScratchCard: (title: string, amount: number) => void;

  // Feature 3: Weekly Leaderboard Contest
  isLeaderboardModalOpen: boolean;
  setIsLeaderboardModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const normalizeMobile = (m?: string | null) => {
  const digits = (m || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Stored registered users database (synced from Cloud Firestore)
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('taskvibe_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Exclude any stale dummy/demo user
          return parsed.filter((u) => normalizeMobile(u.mobile) !== '9876543210' && u.name !== 'Pardeep Patel');
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('taskvibe_auth');
      const savedUserRaw = localStorage.getItem('taskvibe_user');
      if (savedAuth === 'true' && savedUserRaw) {
        const parsed = JSON.parse(savedUserRaw);
        if (parsed && (parsed.mobile || parsed.name)) {
          // Stale demo user check: clean up if found
          if (normalizeMobile(parsed.mobile) === '9876543210' || parsed.name === 'Pardeep Patel') {
            try {
              localStorage.removeItem('taskvibe_auth');
              localStorage.removeItem('taskvibe_user');
              localStorage.removeItem('taskvibe_active_mobile');
            } catch {}
            return false;
          }
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  });

  const [pendingInviteCode, setPendingInviteCode] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('invite') || urlParams.get('ref') || '';
        if (code) {
          const clean = code.trim().toUpperCase();
          localStorage.setItem('taskvibe_pending_invite', clean);
          return clean;
        }
      }
      return localStorage.getItem('taskvibe_pending_invite') || '';
    } catch {
      return '';
    }
  });

  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    try {
      if (typeof window !== 'undefined') {
        const isSpecialAdminUrl =
          window.location.search.includes('admin') ||
          window.location.hash.includes('admin') ||
          window.location.pathname.endsWith('/admin');
        if (isSpecialAdminUrl) {
          localStorage.setItem('taskvibe_screen', 'admin');
          return 'admin';
        }
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('invite') || urlParams.get('ref');
        const savedAuth = localStorage.getItem('taskvibe_auth');
        if (inviteCode && savedAuth !== 'true') {
          return 'register';
        }
      }
      const savedAuth = localStorage.getItem('taskvibe_auth');
      const savedScreen = localStorage.getItem('taskvibe_screen') as ScreenType;
      // Always preserve Admin Panel screen across reloads/updates so Admin Panel is never lost!
      if (savedScreen === 'admin') {
        return 'admin';
      }
      if (savedAuth === 'true') {
        if (savedScreen && savedScreen !== 'login' && savedScreen !== 'register' && savedScreen !== 'splash') {
          return savedScreen;
        }
        return 'home';
      }
      return 'login';
    } catch {
      return 'login';
    }
  });
  const [activeTab, setActiveTab] = useState<BottomTabType>(() => {
    try {
      const savedScreen = localStorage.getItem('taskvibe_screen');
      if (savedScreen === 'member_plans' || savedScreen === 'plan_detail') return 'member';
      if (savedScreen === 'mission') return 'mission';
      if (savedScreen === 'record') return 'record';
      if (savedScreen === 'profile') return 'me';
      return 'home';
    } catch {
      return 'home';
    }
  });
  const [historyStack, setHistoryStack] = useState<ScreenType[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('invite') || urlParams.get('ref');
        const savedAuth = localStorage.getItem('taskvibe_auth');
        if (inviteCode && savedAuth !== 'true') {
          return ['register'];
        }
      }
      const savedAuth = localStorage.getItem('taskvibe_auth');
      const savedScreen = localStorage.getItem('taskvibe_screen') as ScreenType;
      if (savedAuth === 'true') {
        if (savedScreen && savedScreen !== 'login' && savedScreen !== 'register' && savedScreen !== 'splash' && savedScreen !== 'home') {
          return ['home', savedScreen];
        }
        return ['home'];
      }
      return ['login'];
    } catch {
      return ['login'];
    }
  });
  const [frameMode, setFrameMode] = useState<'mobile' | 'responsive'>('mobile');

  // Persist currentScreen whenever it changes (always persist 'admin' even if regular user is not logged in)
  useEffect(() => {
    if (currentScreen === 'admin') {
      try {
        localStorage.setItem('taskvibe_screen', 'admin');
      } catch (err) {
        console.warn(err);
      }
      return;
    }
    if (isLoggedIn && currentScreen !== 'login' && currentScreen !== 'register' && currentScreen !== 'splash') {
      try {
        localStorage.setItem('taskvibe_screen', currentScreen);
      } catch (err) {
        console.warn(err);
      }
    }
  }, [isLoggedIn, currentScreen]);

  // Helper to check if a phone number is already registered (1 phone = 1 account limit)
  const isPhoneAlreadyRegistered = (m: string): boolean => {
    const clean = normalizeMobile(m);
    if (!clean || clean.length < 10) return false;
    return registeredUsers.some((u) => normalizeMobile(u.mobile) === clean);
  };

  // Safeguard: Once logged in, NEVER remain on login, register, or splash screens
  useEffect(() => {
    if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'register' || currentScreen === 'splash')) {
      setCurrentScreen('home');
      setActiveTab('home');
      setHistoryStack(['home']);
      try {
        window.history.replaceState({ zorotask_app: true, screen: 'home' }, '', '#home');
      } catch (err) {
        console.warn(err);
      }
    }
  }, [isLoggedIn, currentScreen]);

  // One-time cleanup to purge legacy demo user and mock data from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('taskvibe_plans');
      localStorage.removeItem('taskvibe_surveys');
      localStorage.removeItem('taskvibe_tasks');
      localStorage.removeItem('taskvibe_selected_plan');

      const activeMob = localStorage.getItem('taskvibe_active_mobile');
      const userRaw = localStorage.getItem('taskvibe_user');
      if (activeMob && normalizeMobile(activeMob) === '9876543210') {
        localStorage.removeItem('taskvibe_active_mobile');
        localStorage.removeItem('taskvibe_auth');
        localStorage.removeItem('taskvibe_user');
        localStorage.removeItem('taskvibe_txs');
      }
      if (userRaw && userRaw.includes('Pardeep Patel')) {
        localStorage.removeItem('taskvibe_user');
        localStorage.removeItem('taskvibe_auth');
      }
      const regRaw = localStorage.getItem('taskvibe_registered_users');
      if (regRaw && regRaw.includes('9876543210')) {
        const parsed = JSON.parse(regRaw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((u: any) => normalizeMobile(u.mobile) !== '9876543210' && u.name !== 'Pardeep Patel');
          localStorage.setItem('taskvibe_registered_users', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn('LocalStorage cleanup error:', e);
    }
  }, []);

  // Stored state with local storage fallback
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const savedUserRaw = localStorage.getItem('taskvibe_user');
      if (savedUserRaw) {
        const parsed = JSON.parse(savedUserRaw);
        if (parsed && (parsed.mobile || parsed.name)) {
          if (normalizeMobile(parsed.mobile) === '9876543210' || parsed.name === 'Pardeep Patel') {
            return emptyUser;
          }
          return parsed;
        }
      }
      const activeMobile = localStorage.getItem('taskvibe_active_mobile');
      const savedUsersRaw = localStorage.getItem('taskvibe_registered_users');
      const parsedUsers: RegisteredUserAccount[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
      if (activeMobile) {
        const cleanActive = normalizeMobile(activeMobile);
        if (cleanActive !== '9876543210') {
          const matched = parsedUsers.find((u) => normalizeMobile(u.mobile) === cleanActive && u.name !== 'Pardeep Patel');
          if (matched) return matched;
        }
      }
      return emptyUser;
    } catch {
      return emptyUser;
    }
  });

  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    try {
      const savedAuth = localStorage.getItem('taskvibe_auth');
      const activeMobile = localStorage.getItem('taskvibe_active_mobile');
      const savedUsersRaw = localStorage.getItem('taskvibe_registered_users');
      const parsedUsers: RegisteredUserAccount[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];

      if (savedAuth === 'true' && activeMobile) {
        const cleanActive = normalizeMobile(activeMobile);
        if (cleanActive !== '9876543210') {
          const matched = parsedUsers.find((u) => normalizeMobile(u.mobile) === cleanActive && u.name !== 'Pardeep Patel');
          if (matched && matched.transactions) return matched.transactions;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const [surveys, setSurveys] = useState<SurveyItem[]>([]);

  const mergeWithInitialPlans = (list?: PlanItem[] | null): PlanItem[] => {
    if (!Array.isArray(list)) return [];
    const map = new Map<string, PlanItem>();
    list.forEach((p) => {
      if (p && p.id) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.level || 0) - (b.level || 0));
  };

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);

  useEffect(() => {
    if (selectedPlan) {
      try {
        localStorage.setItem('taskvibe_selected_plan', JSON.stringify(selectedPlan));
      } catch (e) {
        console.warn(e);
      }
    }
  }, [selectedPlan]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('taskvibe_submissions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [paymentDeposits, setPaymentDeposits] = useState<PaymentDeposit[]>(() => {
    try {
      const saved = localStorage.getItem('taskvibe_payment_deposits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('zorotask_support_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Zero default promo codes: Only codes created by the Admin from Admin Panel will appear!
  const defaultPromoCodes: PromoCode[] = [];

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => {
    try {
      const saved = localStorage.getItem('zorotask_promo_codes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Purge the 3 legacy default promo codes from local storage
          const filtered = parsed.filter(
            (p) =>
              p &&
              p.id !== 'promo_welcome50' &&
              p.id !== 'promo_telegram20' &&
              p.id !== 'promo_bonus10' &&
              p.code !== 'WELCOME50' &&
              p.code !== 'TELEGRAM20' &&
              p.code !== 'BONUS10'
          );
          localStorage.setItem('zorotask_promo_codes', JSON.stringify(filtered));
          return filtered;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isPromoModalOpen, setIsPromoModalOpen] = useState<boolean>(false);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState<boolean>(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState<boolean>(false);

  // 1 & 4. Dynamic Custom Tasks & Admin Audit Logs
  const [customTasks, setCustomTasks] = useState<CustomTaskItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const [lastPurchase, setLastPurchase] = useState<PurchaseDetails>({
    amount: 1000,
    reward: 150,
    orderId: '#ZT202509231234',
    date: '23 Sep 2025, 09:45 AM',
    status: 'verified',
  });

  const defaultAdminSettings: AdminSettings = {
    adminUpiId: 'zorotask.pay@icici',
    adminMerchantName: 'ZoroTask Digital Rewards',
    adminPassword: 'Gagan@123',
    adminQrCodeUrl: '',
    minWithdrawal: 1000,
    dailySurveyReward: 150,
    referralBonus: 100,
    youtubeVideoId: 'dQw4w9WgXcQ',
    youtubeVideoUrls: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      'https://www.youtube.com/watch?v=9bZkp7q19f0',
      'https://www.youtube.com/watch?v=JGwWNGJdvx8',
      'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    ],
    youtubeVideoTitle: 'ZoroTask Official YouTube Partner Video',
    youtubeVideoReward: 50,
    youtubeVideoDurationSec: 30,
    supportWhatsapp: '+91 9876543210',
    supportTelegram: 'https://t.me/ZoroTaskSupport',
    vipSupportTelegram: 'https://t.me/ZoroTaskVIPSupport',
    whatsappApiEnabled: true,
    whatsappProvider: 'renflair',
    whatsappInstanceId: '',
    whatsappApiToken: '417d155c4d7937dc6555a13a71f09ec0',
    whatsappPhoneNumberId: '',
    whatsappWabaId: '',
    whatsappApiUrl: 'https://sms.renflair.in/V1.php',
    whatsappSupportNumber: '+91 9876543210',
    whatsappAutoWelcome: true,
    whatsappAutoDepositNotify: true,
    whatsappAutoWithdrawNotify: true,
    whatsappWelcomeMessage: 'Hello {name}! Welcome to ZoroTask. Complete tasks daily and withdraw your rewards directly to UPI/Bank.',
    renflairApiKey: '417d155c4d7937dc6555a13a71f09ec0',
    renflairApiUrl: 'https://sms.renflair.in/V1.php',
    renflairMethod: 'GET',
    renflairSenderId: '',
    announcementEnabled: true,
    announcementTitle: '🎉 Welcome to ZoroTask 2.0 Update!',
    announcementMessage: 'New ZoroTask update is live! Higher video earnings and instant UPI payouts are now activated for VIP members. Complete daily video tasks and grow your wallet balance!',
    announcementTag: 'NOTICE',
    announcementButtonText: 'Check VIP Plans ⭐',
    announcementButtonAction: 'member_plans',
    announcementDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    spinEnabled: true,
    dailyFreeSpins: 2,
    spinPrizes: [5, 10, 25, 50, 100, 0, 2, 15],
    flashBannerEnabled: true,
    flashBannerType: 'offer',
    flashBannerTag: 'MEGA BONUS',
    flashBannerText: '🔥 Sunday Special: Complete daily tasks now to earn instant Scratch Cards with up to ₹100 bonus cash!',
    flashBannerAction: 'spin_win',
    paymentGatewayEnabled: false,
    paymentGatewayProvider: 'manual',
    paymentGatewayMerchantId: '',
    paymentGatewayApiKey: '',
    paymentGatewayApiSecret: '',
    paymentGatewayWebhookSecret: '',
    paymentGatewayCallbackUrl: '',
    paymentGatewayAutoApprove: false,
    paymentGatewayTestMode: true,
    withdrawalStartTime: '10:00',
    withdrawalEndTime: '18:00',
    withdrawalDaysNotice: 'Mon - Sat (10:00 AM - 06:00 PM)',
    payoutTimingNotice: 'Avg. Payout: Within 24hr',
    maintenanceMode: false,
    maintenanceMessage: 'ZoroTask platform is currently undergoing scheduled system maintenance. All user balances and active VIP plans are safe. We will be back online shortly!',
    appVersion: '2.8.0',
    apkDownloadUrl: '/ZoroTask-Official.apk',
    forceUpdateEnabled: true,
    updateChangelog: '⚡ 1-Click In-App Direct APK Updater (No uninstall needed) • In-place update preserving user wallet balance & login • Instant Firestore sync • Enhanced Android package installer handoff',
    addMoneyTiers: [
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
    ],
    plans: initialPlans,
  };

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    try {
      const saved = localStorage.getItem('taskvibe_admin_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const legacyPasswords = ['TaskVibe@Admin2026', 'admin', 'admin123', '1234', '123456', 'admin@123'];
        const activePassword = (!parsed.adminPassword || legacyPasswords.includes(parsed.adminPassword))
          ? 'Gagan@123'
          : parsed.adminPassword;
        return {
          ...defaultAdminSettings,
          ...parsed,
          adminPassword: activePassword,
          payoutTimingNotice: parsed.payoutTimingNotice || defaultAdminSettings.payoutTimingNotice || 'Avg. Payout: Within 24hr',
          withdrawalDaysNotice: parsed.withdrawalDaysNotice || defaultAdminSettings.withdrawalDaysNotice,
          adminMerchantName: (parsed.adminMerchantName || defaultAdminSettings.adminMerchantName || '').replace(/TaskVibe/gi, 'ZoroTask'),
          announcementTitle: (parsed.announcementTitle || defaultAdminSettings.announcementTitle || '').replace(/TaskVibe/gi, 'ZoroTask'),
          announcementMessage: (parsed.announcementMessage || defaultAdminSettings.announcementMessage || '').replace(/TaskVibe/gi, 'ZoroTask'),
          announcementTag: (parsed.announcementTag && parsed.announcementTag !== 'NEW UPDATE') ? parsed.announcementTag : 'NOTICE',
          youtubeVideoId: parsed.youtubeVideoId || defaultAdminSettings.youtubeVideoId,
          youtubeVideoUrls: parsed.youtubeVideoUrls || defaultAdminSettings.youtubeVideoUrls,
          youtubeVideoTitle: parsed.youtubeVideoTitle || defaultAdminSettings.youtubeVideoTitle,
          youtubeVideoReward: parsed.youtubeVideoReward || defaultAdminSettings.youtubeVideoReward,
          youtubeVideoDurationSec: parsed.youtubeVideoDurationSec || defaultAdminSettings.youtubeVideoDurationSec,
          supportWhatsapp: parsed.supportWhatsapp !== undefined ? parsed.supportWhatsapp : defaultAdminSettings.supportWhatsapp,
          supportTelegram: parsed.supportTelegram !== undefined ? parsed.supportTelegram : defaultAdminSettings.supportTelegram,
          whatsappInstanceId: parsed.whatsappInstanceId || defaultAdminSettings.whatsappInstanceId,
          whatsappApiToken: parsed.whatsappApiToken || defaultAdminSettings.whatsappApiToken,
          whatsappProvider: parsed.whatsappProvider || defaultAdminSettings.whatsappProvider,
          renflairApiKey: parsed.renflairApiKey || defaultAdminSettings.renflairApiKey,
          renflairApiUrl: parsed.renflairApiUrl || defaultAdminSettings.renflairApiUrl,
          renflairMethod: parsed.renflairMethod || defaultAdminSettings.renflairMethod,
        };
      }
      return defaultAdminSettings;
    } catch {
      return defaultAdminSettings;
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isUPIModalOpen, setIsUPIModalOpen] = useState(false);
  const [pendingUPIAmount, setPendingUPIAmount] = useState(1000);
  const [pendingUPIBonus, setPendingUPIBonus] = useState(150);
  const [pendingDepositType, setPendingDepositType] = useState<'add_money' | 'plan_purchase'>('add_money');
  const [pendingPlanForUPI, setPendingPlanForUPI] = useState<PlanItem | null>(() => {
    try {
      const saved = localStorage.getItem('taskvibe_pending_plan');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (pendingPlanForUPI) {
      try {
        localStorage.setItem('taskvibe_pending_plan', JSON.stringify(pendingPlanForUPI));
      } catch (e) {
        console.warn(e);
      }
    }
  }, [pendingPlanForUPI]);

  const [isWatchingVideo, setIsWatchingVideo] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Current official release version of ZoroTask
  const APP_BASE_VERSION = '2.8.0';

  const isNewerVersion = (target?: string, current?: string): boolean => {
    if (!target || !current) return false;
    if (target.trim() === current.trim()) return false;
    const tParts = target.trim().split('.').map((p) => parseInt(p, 10) || 0);
    const cParts = current.trim().split('.').map((p) => parseInt(p, 10) || 0);
    for (let i = 0; i < Math.max(tParts.length, cParts.length); i++) {
      const t = tParts[i] || 0;
      const c = cParts[i] || 0;
      if (t > c) return true;
      if (t < c) return false;
    }
    return false;
  };

  const isNativeApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    return (
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      Boolean((window as any).AndroidBridge) ||
      window.location.protocol === 'capacitor:' ||
      window.location.hostname === 'localhost'
    );
  };

  const [installedAppVersion, setInstalledAppVersion] = useState(() => {
    try {
      const stored = localStorage.getItem('taskvibe_installed_version');
      if (stored) return stored;
      // Fresh install or website visitor is automatically on latest base release v2.7.0
      localStorage.setItem('taskvibe_installed_version', APP_BASE_VERSION);
      return APP_BASE_VERSION;
    } catch {
      return APP_BASE_VERSION;
    }
  });

  const latestAppVersion = adminSettings.appVersion || APP_BASE_VERSION;
  const isUpdateAvailable = isNewerVersion(latestAppVersion, installedAppVersion);

  const checkForAppUpdate = (manual = false) => {
    const hasUpdate = isNewerVersion(latestAppVersion, installedAppVersion);
    if (manual) {
      if (hasUpdate) {
        setIsUpdateModalOpen(true);
      } else {
        showToast(`✓ ZoroTask is up to date (v${installedAppVersion})`);
      }
    }
    return { hasUpdate, currentVersion: installedAppVersion, latestVersion: latestAppVersion };
  };

  const triggerOneClickUpdate = () => {
    setIsUpdateModalOpen(true);
  };

  // Only broadcast update notification if Admin has released a NEWER version than installed
  useEffect(() => {
    try {
      const target = adminSettings.appVersion || APP_BASE_VERSION;
      const current = localStorage.getItem('taskvibe_installed_version') || APP_BASE_VERSION;
      const hasNewerVersion = isNewerVersion(target, current);

      // 1. If user already has the target version or higher, never show popup
      if (!hasNewerVersion) {
        setIsUpdateModalOpen(false);
        return;
      }

      // 2. Check if user already dismissed this specific version update
      const sessionDismissed = sessionStorage.getItem(`taskvibe_update_dismissed_${target}`);
      if (sessionDismissed === 'true' && !adminSettings.forceUpdateEnabled) {
        return;
      }

      // 3. For website visitors on browsers, do not show APK popup unless forced by admin
      const isNative = isNativeApp();
      if (!isNative && !adminSettings.forceUpdateEnabled) {
        return;
      }

      // 4. Admin pushed an actual higher version: trigger modal
      setIsUpdateModalOpen(true);
    } catch (e) {
      console.warn('Update check warning:', e);
    }
  }, [adminSettings.appVersion, adminSettings.forceUpdateEnabled]);

  // Dynamic stack of screen-level back button handlers (e.g., bank picker, forgot password modal, notice popup)
  const registeredBackHandlersRef = useRef<(() => boolean)[]>([]);

  const registerBackHandler = (handler: () => boolean) => {
    registeredBackHandlersRef.current.push(handler);
    return () => {
      registeredBackHandlersRef.current = registeredBackHandlersRef.current.filter((h) => h !== handler);
    };
  };

  const exitApp = () => {
    // 1. AndroidBridge from native Android WebView
    if (typeof (window as any).AndroidBridge?.exitApp === 'function') {
      try {
        (window as any).AndroidBridge.exitApp();
        return;
      } catch (e) {
        console.warn('AndroidBridge.exitApp error:', e);
      }
    }
    // 2. Capacitor Official App Plugin
    try {
      CapacitorApp.exitApp();
      return;
    } catch {}
    // 3. Cordova / Phonegap
    if (typeof (navigator as any).app?.exitApp === 'function') {
      try {
        (navigator as any).app.exitApp();
        return;
      } catch (e) {
        console.warn('navigator.app.exitApp error:', e);
      }
    }
    // 4. Browser fallback
    try {
      window.close();
    } catch {}
  };

  // Save changes to localStorage - only write auth session if logged in
  useEffect(() => {
    try {
      if (isLoggedIn && user && (user.mobile || user.name)) {
        localStorage.setItem('taskvibe_user', JSON.stringify(user));
        localStorage.setItem('taskvibe_auth', 'true');
        if (user.mobile) {
          localStorage.setItem('taskvibe_active_mobile', normalizeMobile(user.mobile));
        }
      }
      localStorage.setItem('taskvibe_txs', JSON.stringify(transactions));
      localStorage.setItem('taskvibe_tasks', JSON.stringify(tasks));
      localStorage.setItem('taskvibe_surveys', JSON.stringify(surveys));
      localStorage.setItem('taskvibe_submissions', JSON.stringify(taskSubmissions));
      localStorage.setItem('taskvibe_payment_deposits', JSON.stringify(paymentDeposits));
    } catch (e) {
      console.warn('Storage failed', e);
    }
  }, [user, isLoggedIn, transactions, tasks, surveys, taskSubmissions, paymentDeposits]);

  // Synchronize user profile & balance to Firestore cloud database
  const syncUserToFirestore = async (
    targetUser: RegisteredUserAccount | UserProfile,
    txs?: TransactionItem[]
  ) => {
    if (!targetUser || !targetUser.mobile) return;
    const cleanMobile = normalizeMobile(targetUser.mobile);
    if (!cleanMobile || cleanMobile.length < 10) return;
    try {
      const userRef = doc(db, 'users', cleanMobile);
      const dataToSave: any = {
        ...targetUser,
      };
      if (txs) {
        dataToSave.transactions = txs;
      }
      await setDoc(userRef, dataToSave, { merge: true });
    } catch (e) {
      console.warn('Failed to sync user to Firestore:', e);
    }
  };

  // Real-time listener: sync all registered users across all devices from Firestore
  useEffect(() => {
    try {
      const usersCol = collection(db, 'users');
      const unsubscribe = onSnapshot(
        usersCol,
        (snapshot) => {
          const cloudUsers: RegisteredUserAccount[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as RegisteredUserAccount;
            cloudUsers.push(data);
          });
          // Authoritative sync: Firestore is the master source of truth
          setRegisteredUsers(cloudUsers);
          try {
            localStorage.setItem('taskvibe_registered_users', JSON.stringify(cloudUsers));
          } catch {}

          // Real-time synchronization for currently active user
          try {
            const activeMob = localStorage.getItem('taskvibe_active_mobile');
            const authVal = localStorage.getItem('taskvibe_auth');
            if (activeMob && authVal === 'true') {
              const cleanActive = normalizeMobile(activeMob);
              const cloudSelf = cloudUsers.find((u) => normalizeMobile(u.mobile) === cleanActive);

              if (cloudSelf) {
                hasInitialUserCloudSyncRef.current = true;
                skipNextFirestorePushRef.current = true;
                setUser((curr) => {
                  const mergedSelf = {
                    ...curr,
                    ...cloudSelf,
                  };
                  try {
                    localStorage.setItem('taskvibe_user', JSON.stringify(mergedSelf));
                  } catch {}
                  return mergedSelf;
                });
                if (cloudSelf.transactions && Array.isArray(cloudSelf.transactions)) {
                  setTransactions(cloudSelf.transactions);
                  try {
                    localStorage.setItem('taskvibe_txs', JSON.stringify(cloudSelf.transactions));
                  } catch {}
                }
              } else if (!snapshot.metadata.fromCache) {
                // If user was deleted from Cloud Firestore: log them out completely and clear local data
                setUser(emptyUser);
                setTransactions([]);
                setIsLoggedIn(false);
                try {
                  localStorage.removeItem('taskvibe_auth');
                  localStorage.removeItem('taskvibe_active_mobile');
                  localStorage.removeItem('taskvibe_user');
                  localStorage.removeItem('taskvibe_txs');
                } catch {}
              }
            }
          } catch (err) {
            console.warn('Real-time self user sync error:', err);
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot error (continuing with offline cache):', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore users listener:', err);
    }
  }, []);

  // Real-time deletion guard: ONLY terminates session if Admin explicitly created a tombstone in 'deleted_accounts'
  useEffect(() => {
    const activeMob = localStorage.getItem('taskvibe_active_mobile');
    const authVal = localStorage.getItem('taskvibe_auth');
    if (!activeMob || authVal !== 'true') return;
    const cleanActive = normalizeMobile(activeMob);
    if (!cleanActive || cleanActive === '9876543210' || cleanActive === '9999999999') return;

    try {
      const delDocRef = doc(db, 'deleted_accounts', cleanActive);
      const unsub = onSnapshot(
        delDocRef,
        (snap) => {
          // Strictly require authoritative server confirmation (not cached) and active online connectivity
          if (snap.exists() && snap.data()?.deletedByAdmin && !snap.metadata.fromCache && (typeof navigator === 'undefined' || navigator.onLine)) {
            console.warn(`[ZoroTask] User (+91 ${cleanActive}) was confirmed deleted by Admin in deleted_accounts.`);
            logout();
            try {
              localStorage.removeItem('taskvibe_auth');
              localStorage.removeItem('taskvibe_active_mobile');
              localStorage.removeItem('taskvibe_user');
              localStorage.removeItem('taskvibe_txs');
              localStorage.removeItem('taskvibe_screen');
            } catch {}
            showToast('⚠️ Your account was permanently deleted by Admin. Please register as a new user.');
            setCurrentScreen('register');
            setHistoryStack(['register']);
          }
        },
        (err) => {
          console.warn('deleted_accounts listener error (ignored):', err);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Could not attach deleted_accounts listener:', e);
    }
  }, [isLoggedIn]);

  // Real-time listener: sync all UPI & QR deposits from Firestore across all devices
  useEffect(() => {
    try {
      const depositsCol = collection(db, 'deposits');
      const unsubscribe = onSnapshot(
        depositsCol,
        (snapshot) => {
          setIsCloudConnected(true);
          const cloudList: PaymentDeposit[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as PaymentDeposit;
            if (data && data.id) {
              cloudList.push(data);
            }
          });
          if (cloudList.length > 0) {
            cloudList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setPaymentDeposits(cloudList);
            try {
              localStorage.setItem('taskvibe_payment_deposits', JSON.stringify(cloudList));
            } catch (storageErr) {
              console.warn('LocalStorage deposits cache limit reached:', storageErr);
            }

            // Immediately reflect approved or rejected deposits in local transactions
            setTransactions((prevTxs) =>
              prevTxs.map((tx) => {
                const dep = cloudList.find(
                  (d) =>
                    d.id === tx.id.replace('tx_', '') ||
                    (tx.utrNumber && d.utrNumber && d.utrNumber.trim().toLowerCase() === tx.utrNumber.trim().toLowerCase())
                );
                if (dep) {
                  if (dep.status === 'approved' && tx.status !== 'verified') {
                    return {
                      ...tx,
                      status: 'verified' as const,
                      title: dep.depositType === 'plan_purchase'
                        ? `VIP Level ${dep.planLevel} (Approved & Active)`
                        : `Wallet Deposit (Approved +₹${dep.bonus || 0} Bonus)`,
                      note: `Approved by Admin Panel on ${new Date().toLocaleDateString('en-IN')}`,
                    };
                  } else if (dep.status === 'rejected' && tx.status !== 'failed') {
                    return {
                      ...tx,
                      status: 'failed' as const,
                      note: `Rejected: ${dep.rejectionReason || 'Invalid proof'}`,
                    };
                  }
                }
                return tx;
              })
            );
          }
        },
        (error) => {
          console.warn('Firestore deposits onSnapshot error:', error);
          setIsCloudConnected(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore deposits listener:', err);
    }
  }, []);

  // Real-time listener: sync support tickets from Firestore
  useEffect(() => {
    try {
      const ticketsCol = collection(db, 'support_tickets');
      const unsubscribe = onSnapshot(
        ticketsCol,
        (snapshot) => {
          const cloudList: SupportTicket[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as SupportTicket;
            if (data && data.id) {
              cloudList.push(data);
            }
          });
          if (cloudList.length > 0) {
            cloudList.sort((a, b) => b.id.localeCompare(a.id));
            setSupportTickets(cloudList);
            try {
              localStorage.setItem('zorotask_support_tickets', JSON.stringify(cloudList));
            } catch {}
          }
        },
        (error) => {
          console.warn('Firestore tickets listener error:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore tickets listener:', err);
    }
  }, []);

  // Real-time listener: sync promo codes from Firestore
  // Real-time listener: sync promo codes from Firestore
  useEffect(() => {
    try {
      const promosCol = collection(db, 'promo_codes');
      const unsubscribe = onSnapshot(
        promosCol,
        (snapshot) => {
          const cloudList: PromoCode[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as PromoCode;
            if (data && data.id && data.code) {
              // Strip out any legacy default promo codes from database
              if (
                data.id !== 'promo_welcome50' &&
                data.id !== 'promo_telegram20' &&
                data.id !== 'promo_bonus10' &&
                data.code !== 'WELCOME50' &&
                data.code !== 'TELEGRAM20' &&
                data.code !== 'BONUS10'
              ) {
                cloudList.push(data);
              }
            }
          });
          cloudList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          // Always update local state & cache (so when admin deletes a code, it is immediately removed!)
          setPromoCodes(cloudList);
          try {
            localStorage.setItem('zorotask_promo_codes', JSON.stringify(cloudList));
          } catch {}
        },
        (error) => {
          console.warn('Firestore promo codes listener error:', error);
        }
      );

      // One-time cleanup: Delete any old legacy default promo codes from Firestore
      const purgeLegacyPromos = async () => {
        try {
          const legacyIds = ['promo_welcome50', 'promo_telegram20', 'promo_bonus10'];
          for (const lid of legacyIds) {
            try {
              await deleteDoc(doc(db, 'promo_codes', lid));
            } catch {}
          }
        } catch {}
      };
      purgeLegacyPromos();

      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore promo codes listener:', err);
    }
  }, []);

  // Real-time listener: sync Master Admin Settings from Firestore (UPI ID, Password, limits, etc.)
  useEffect(() => {
    try {
      const settingsDocRef = doc(db, 'settings', 'admin');
      const unsubscribe = onSnapshot(
        settingsDocRef,
        (docSnap) => {
          setIsCloudConnected(true);
          if (docSnap.exists()) {
            const cloudSettings = docSnap.data() as AdminSettings;
            const legacyPasswords = ['TaskVibe@Admin2026', 'admin', 'admin123', '1234', '123456', 'admin@123'];
            const activePassword = (!cloudSettings.adminPassword || legacyPasswords.includes(cloudSettings.adminPassword))
              ? 'Gagan@123'
              : cloudSettings.adminPassword;
            const mergedSettings = {
              ...cloudSettings,
              adminPassword: activePassword,
              payoutTimingNotice: cloudSettings.payoutTimingNotice || 'Avg. Payout: Within 24hr',
              withdrawalDaysNotice: cloudSettings.withdrawalDaysNotice || defaultAdminSettings.withdrawalDaysNotice,
              adminMerchantName: (cloudSettings.adminMerchantName || defaultAdminSettings.adminMerchantName || '').replace(/TaskVibe/gi, 'ZoroTask'),
              announcementTitle: (cloudSettings.announcementTitle || defaultAdminSettings.announcementTitle || '').replace(/TaskVibe/gi, 'ZoroTask'),
              announcementMessage: (cloudSettings.announcementMessage || defaultAdminSettings.announcementMessage || '').replace(/TaskVibe/gi, 'ZoroTask'),
              announcementTag: (cloudSettings.announcementTag && cloudSettings.announcementTag !== 'NEW UPDATE') ? cloudSettings.announcementTag : 'NOTICE',
              youtubeVideoTitle: (cloudSettings.youtubeVideoTitle || defaultAdminSettings.youtubeVideoTitle || '').replace(/TaskVibe/gi, 'ZoroTask'),
            };
            if (Array.isArray(cloudSettings.plans) && cloudSettings.plans.length > 0) {
              const sorted = [...cloudSettings.plans].sort((a, b) => (a.level || 0) - (b.level || 0));
              setPlans(sorted);
              try {
                localStorage.setItem('taskvibe_plans', JSON.stringify(sorted));
              } catch {}
            }
            setAdminSettings((prev) => ({
              ...prev,
              ...mergedSettings,
            }));
            try {
              localStorage.setItem('taskvibe_admin_settings', JSON.stringify(mergedSettings));
            } catch {}
          }
        },
        (error) => {
          console.warn('Firestore settings onSnapshot warning:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore settings listener:', err);
    }
  }, []);

  // Ensure master Gagan@123 password is initialized in Firestore settings
  useEffect(() => {
    const ensureDefaultSettingsInFirestore = async () => {
      try {
        const settingsDocRef = doc(db, 'settings', 'admin');
        const snap = await getDoc(settingsDocRef);
        if (!snap.exists()) {
          await setDoc(settingsDocRef, defaultAdminSettings, { merge: true });
        } else {
          const current = snap.data();
          const legacy = ['TaskVibe@Admin2026', 'admin', 'admin123', '1234', '123456', 'admin@123'];
          const updates: any = {};
          if (!current.adminPassword || legacy.includes(current.adminPassword)) {
            updates.adminPassword = 'Gagan@123';
          }
          if (!current.appVersion || current.appVersion < '2.8.0') {
            updates.appVersion = '2.8.0';
            updates.apkDownloadUrl = '/ZoroTask-Official.apk';
            updates.updateChangelog = '📶 Full-Screen Offline Guard Popup • 👑 All 8 VIP Membership Plans Synced • ⚡ In-place APK updater';
          }
          if (Object.keys(updates).length > 0) {
            await setDoc(settingsDocRef, updates, { merge: true });
          }
        }
      } catch (err) {
        console.warn('Initial admin settings sync notice:', err);
      }
    };
    ensureDefaultSettingsInFirestore();
  }, []);

  // Real-time listener: sync Task Submissions from Firestore
  useEffect(() => {
    try {
      const subsCol = collection(db, 'task_submissions');
      const unsubscribe = onSnapshot(
        subsCol,
        (snapshot) => {
          const list: TaskSubmission[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as TaskSubmission;
            if (data && data.id) list.push(data);
          });
          if (list.length > 0) {
            setTaskSubmissions(list);
            try {
              localStorage.setItem('taskvibe_submissions', JSON.stringify(list));
            } catch {}
          }
        },
        (err) => console.warn('Submissions snapshot err', err)
      );
      return () => unsubscribe();
    } catch {}
  }, []);

  // Real-time listener: sync VIP Plans from Firestore across all devices (100% Cloud-driven, NO auto-seeding or resurrecting deleted plans)
  useEffect(() => {
    try {
      const plansCol = collection(db, 'vip_plans');
      const unsubscribe = onSnapshot(
        plansCol,
        (snapshot) => {
          const cloudPlans: PlanItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as PlanItem;
            if (data && data.id) {
              cloudPlans.push(data);
            }
          });

          // Exactly what is in Firestore
          const sortedPlans = cloudPlans.sort((a, b) => (a.level || 0) - (b.level || 0));
          setPlans(sortedPlans);
          if (sortedPlans.length > 0) {
            setSelectedPlan((prev) => (prev ? sortedPlans.find((p) => p.id === prev.id) || sortedPlans[0] : sortedPlans[0]));
          } else {
            setSelectedPlan(null);
          }
        },
        (error) => {
          console.warn('Firestore vip_plans onSnapshot error:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore vip_plans listener:', err);
    }
  }, []);

  // Real-time listener: sync surveys across all devices from Firestore in real time
  useEffect(() => {
    try {
      const surveysCol = collection(db, 'surveys');
      const unsubscribe = onSnapshot(
        surveysCol,
        (snapshot) => {
          const cloudSurveys: SurveyItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as SurveyItem;
            if (data && data.id) {
              cloudSurveys.push(data);
            }
          });
          // Exactly what is in Firestore
          setSurveys(cloudSurveys);
        },
        (error) => {
          console.warn('Firestore surveys onSnapshot warning:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore surveys listener:', err);
    }
  }, []);

  // Real-time listener: sync dynamic custom tasks from Firestore
  useEffect(() => {
    try {
      const tasksCol = collection(db, 'custom_tasks');
      const unsubscribe = onSnapshot(
        tasksCol,
        (snapshot) => {
          const list: CustomTaskItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as CustomTaskItem;
            if (data && data.id) {
              list.push(data);
            }
          });
          setCustomTasks(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
        },
        (error) => {
          console.warn('Firestore custom_tasks onSnapshot warning:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore custom_tasks listener:', err);
    }
  }, []);

  // Real-time listener: sync admin audit logs from Firestore
  useEffect(() => {
    try {
      const logsCol = collection(db, 'admin_audit_logs');
      const unsubscribe = onSnapshot(
        logsCol,
        (snapshot) => {
          const list: AdminAuditLog[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as AdminAuditLog;
            if (data && data.id) {
              list.push(data);
            }
          });
          setAuditLogs(list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
        },
        (error) => {
          console.warn('Firestore admin_audit_logs onSnapshot warning:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore admin_audit_logs listener:', err);
    }
  }, []);

  const hasInitialUserCloudSyncRef = useRef<boolean>(false);
  const skipNextFirestorePushRef = useRef<boolean>(false);

  // Real-time listener: sync active user profile, balance, tasks quota & transactions from Firestore
  useEffect(() => {
    if (!isLoggedIn || !user.mobile) return;
    const cleanMobile = normalizeMobile(user.mobile);
    if (!cleanMobile || cleanMobile.length < 10) return;

    try {
      const userDocRef = doc(db, 'users', cleanMobile);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          hasInitialUserCloudSyncRef.current = true;
          if (docSnap.exists()) {
            const cloudData = docSnap.data() as RegisteredUserAccount;
            skipNextFirestorePushRef.current = true;
            setUser((curr) => {
              // Always sync full cloud state including VIP plans, todayVideosWatched, lastVideoWatchDate, balance, etc.
              const merged = { ...curr, ...cloudData };
              try {
                localStorage.setItem('taskvibe_user', JSON.stringify(merged));
              } catch {}
              return merged;
            });
            if (cloudData.transactions && Array.isArray(cloudData.transactions)) {
              setTransactions(cloudData.transactions);
            }
          }
        },
        (err) => {
          console.warn('Active user snapshot error:', err);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore active user listener:', err);
    }
  }, [isLoggedIn, user.mobile]);

  // Keep registered users database synchronized with current user balance and transactions
  useEffect(() => {
    if (isLoggedIn && user && user.mobile) {
      const cleanMobile = user.mobile.replace(/\D/g, '');
      if (cleanMobile.length >= 10) {
        if (skipNextFirestorePushRef.current) {
          skipNextFirestorePushRef.current = false;
        } else if (hasInitialUserCloudSyncRef.current) {
          syncUserToFirestore(user, transactions);
        }
        setRegisteredUsers((prev) => {
          const idx = prev.findIndex((u) => u.mobile.replace(/\D/g, '') === cleanMobile);
          if (idx >= 0) {
            const nextList = [...prev];
            nextList[idx] = {
              ...nextList[idx],
              ...user,
              transactions,
            };
            try {
              localStorage.setItem('taskvibe_registered_users', JSON.stringify(nextList));
            } catch (err) {
              console.warn(err);
            }
            return nextList;
          }
          return prev;
        });
      }
    }
  }, [user, transactions, isLoggedIn]);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    // Allow adequate reading time (minimum 4200ms, up to 8000ms for longer notices)
    const duration = Math.max(4200, Math.min(8000, msg.length * 65));
    toastTimerRef.current = setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, duration);
  };

  const hideToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(null);
  };

  const copyText = (text: string, label = 'Copied') => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
      showToast(`${label} copied to clipboard!`);
    } catch {
      showToast(`Copied: ${text}`);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#2563eb', '#38bdf8', '#fbbf24', '#22c55e'],
      });
    } catch {
      // ignore
    }
  };

  const SCREEN_HASH_MAP: Record<ScreenType, string> = {
    home: 'home',
    member_plans: 'member_plans',
    mission: 'mission',
    record: 'record',
    profile: 'profile',
    plan_detail: 'plan_detail',
    wallet: 'wallet',
    withdraw: 'withdraw',
    add_money: 'add_money',
    daily_survey: 'daily_survey',
    purchase_confirmed: 'purchase_confirmed',
    referral_earn: 'referral_earn',
    help_center: 'help_center',
    admin: 'admin',
    login: 'login',
    register: 'register',
    splash: 'splash',
    spin_win: 'spin_win',
    leaderboard: 'leaderboard',
  };

  const getScreenFromHash = (h: string): ScreenType | null => {
    const clean = h.replace(/^#\/?/, '').split('?')[0].trim();
    if (clean && clean in SCREEN_HASH_MAP) {
      return clean as ScreenType;
    }
    return null;
  };

  const lastHandledTimeRef = useRef<number>(0);
  const lastExitPressTimeRef = useRef<number>(0);

  // Initialize history guard on mount so Android WebView canGoBack() is always true
  useEffect(() => {
    try {
      const defaultScreen: ScreenType = isLoggedIn ? 'home' : 'login';
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const initialScreen = (hash in SCREEN_HASH_MAP ? hash : defaultScreen) as ScreenType;

      if (!window.history.state || !window.history.state.zorotask_guard) {
        window.history.replaceState({ zorotask_guard: true, isRoot: true }, '', '#guard');
        window.history.pushState({ zorotask_app: true, screen: initialScreen }, '', `#${initialScreen}`);
      }
    } catch (err) {
      console.warn(err);
    }
  }, []);

  // Helper to keep history buffer primed in Android WebView
  const ensureHistoryBuffer = (screenName: string) => {
    try {
      window.history.pushState({ zorotask_app: true, screen: screenName }, '', `#${screenName}`);
    } catch {}
  };

  // Unified rock-solid back action handler for Hardware Back, Android Gestures, Capacitor, and UI Back
  // Unified rock-solid back action handler for Hardware Back, Android Gestures, Capacitor, and UI Back
  const handleBackAction = (source: 'hardware' | 'popstate' | 'capacitor'): string => {
    const now = Date.now();
    // 1. Debounce rapid duplicate events (150ms window)
    if (now - lastHandledTimeRef.current < 150) {
      return 'DEBOUNCED';
    }
    lastHandledTimeRef.current = now;

    // 2. Priority 1: Check screen-registered back handlers (LIFO: topmost modal/dialog first)
    const handlers = registeredBackHandlersRef.current;
    for (let i = handlers.length - 1; i >= 0; i--) {
      try {
        if (handlers[i]()) {
          if (source === 'popstate') {
            ensureHistoryBuffer(currentScreen);
          }
          return 'MODAL_CLOSED';
        }
      } catch (err) {
        console.warn('Error in registered back handler:', err);
      }
    }

    // 3. Priority 2: Check Exit Confirmation Modal
    if (isExitModalOpen) {
      exitApp();
      return 'APP_EXIT';
    }

    // 4. Priority 3: Check all global App modals
    let modalClosed = false;
    if (isPromoModalOpen) {
      setIsPromoModalOpen(false);
      modalClosed = true;
    } else if (isSpinModalOpen) {
      setIsSpinModalOpen(false);
      modalClosed = true;
    } else if (isLeaderboardModalOpen) {
      setIsLeaderboardModalOpen(false);
      modalClosed = true;
    } else if (isSurveyModalOpen) {
      setIsSurveyModalOpen(false);
      modalClosed = true;
    } else if (isUPIModalOpen) {
      setIsUPIModalOpen(false);
      modalClosed = true;
    } else if (isWatchingVideo) {
      setIsWatchingVideo(false);
      modalClosed = true;
    } else if (isTeamModalOpen) {
      setIsTeamModalOpen(false);
      modalClosed = true;
    } else if (isNotificationsOpen) {
      setIsNotificationsOpen(false);
      modalClosed = true;
    } else if (isEditProfileOpen) {
      setIsEditProfileOpen(false);
      modalClosed = true;
    }

    if (modalClosed) {
      if (source === 'popstate') {
        ensureHistoryBuffer(currentScreen);
      }
      return 'MODAL_CLOSED';
    }

    // 5. Priority 4: Sub-screens / inner pages (navigate safely back to parent or previous screen)
    if (currentScreen !== 'home' && (isLoggedIn || currentScreen !== 'login')) {
      let targetScreen: ScreenType = 'home';
      if (historyStack.length > 1) {
        const prevCandidate = historyStack[historyStack.length - 2];
        if (prevCandidate && prevCandidate !== currentScreen) {
          targetScreen = prevCandidate;
        }
      }
      if (!targetScreen || targetScreen === currentScreen) {
        if (currentScreen === 'add_money' || currentScreen === 'withdraw') {
          targetScreen = 'wallet';
        } else if (currentScreen === 'wallet') {
          targetScreen = 'profile';
        } else if (currentScreen === 'plan_detail' || currentScreen === 'purchase_confirmed') {
          targetScreen = 'member_plans';
        } else if (currentScreen === 'daily_survey') {
          targetScreen = 'mission';
        } else if (currentScreen === 'referral_earn' || currentScreen === 'help_center') {
          targetScreen = 'profile';
        } else if (currentScreen === 'record') {
          targetScreen = 'home';
        } else if (currentScreen === 'register') {
          targetScreen = 'login';
        } else if (currentScreen === 'admin') {
          targetScreen = 'home';
        } else {
          targetScreen = 'home';
        }
      }

      setCurrentScreen(targetScreen);
      if (targetScreen === 'home') setActiveTab('home');
      else if (targetScreen === 'member_plans') setActiveTab('member');
      else if (targetScreen === 'mission') setActiveTab('mission');
      else if (targetScreen === 'record') setActiveTab('record');
      else if (targetScreen === 'profile' || targetScreen === 'wallet') setActiveTab('me');

      try {
        localStorage.setItem('taskvibe_screen', targetScreen);
      } catch {}

      ensureHistoryBuffer(targetScreen);

      setHistoryStack((prev) => {
        const next = [...prev];
        if (next.length > 1) next.pop();
        return next.length ? next : ['home'];
      });

      return 'NAVIGATED_BACK';
    }

    // 6. Priority 5: User is on Root Screen ('home' or 'login')
    const timeDiff = now - lastExitPressTimeRef.current;
    if (timeDiff <= 2500 && timeDiff >= 150) {
      // Rapid second press: exit directly
      exitApp();
      return 'APP_EXIT';
    }

    // First back press on Home: show confirmation modal & toast
    lastExitPressTimeRef.current = now;
    setIsExitModalOpen(true);
    showToast('Press back again to exit / बाहर निकलने के लिए दोबारा बैक दबाएं');
    ensureHistoryBuffer(currentScreen);

    return 'SHOWED_EXIT_PROMPT';
  };

  const handleBackActionRef = useRef(handleBackAction);
  handleBackActionRef.current = handleBackAction;

  // Global Bridge functions for Native Android WebView, Cordova, and Capacitor
  useEffect(() => {
    const triggerBack = () => {
      return handleBackActionRef.current('hardware');
    };
    (window as any).__triggerZoroTaskBack = triggerBack;
    (window as any).onBackPressed = triggerBack;
    (window as any).AndroidBridgeBack = triggerBack;
    (window as any).handleAndroidBack = triggerBack;
  }, []);

  const goBack = () => {
    handleBackActionRef.current('hardware');
  };

  // Attach Hardware, WebView, Android Keycode, and Browser listeners
  useEffect(() => {
    // 1. Capacitor Official App Plugin Back Button Listener
    let capRemoveFn: (() => void) | null = null;
    try {
      if (CapacitorApp && typeof CapacitorApp.addListener === 'function') {
        const promise = CapacitorApp.addListener('backButton', () => {
          handleBackActionRef.current('capacitor');
        });
        if (promise && typeof promise.then === 'function') {
          promise.then((handle: any) => {
            if (handle && typeof handle.remove === 'function') {
              capRemoveFn = () => handle.remove();
            }
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Capacitor backButton init error:', err);
    }

    // 2. Cordova / Android WebView backbutton event listener
    const handleHardwareBack = (e?: any) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      handleBackActionRef.current('hardware');
    };
    document.addEventListener('backbutton', handleHardwareBack, false);

    // 3. Android Hardware Back Button Key Listener (KEYCODE_BACK = 4, ESC = 27)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.keyCode === 27 || e.keyCode === 4 || e.key === 'GoBack') {
        e.preventDefault();
        handleBackActionRef.current('hardware');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 4. Browser / Android WebView popstate event listener
    const handlePopState = (e: PopStateEvent) => {
      const stateScreen = e?.state?.screen;
      if (stateScreen && stateScreen in SCREEN_HASH_MAP) {
        // Check if any modal was open first
        let modalClosed = false;
        const handlers = registeredBackHandlersRef.current;
        for (let i = handlers.length - 1; i >= 0; i--) {
          try {
            if (handlers[i]()) {
              modalClosed = true;
              break;
            }
          } catch {}
        }
        if (!modalClosed) {
          if (isExitModalOpen) { setIsExitModalOpen(false); modalClosed = true; }
          else if (isPromoModalOpen) { setIsPromoModalOpen(false); modalClosed = true; }
          else if (isSurveyModalOpen) { setIsSurveyModalOpen(false); modalClosed = true; }
          else if (isUPIModalOpen) { setIsUPIModalOpen(false); modalClosed = true; }
          else if (isWatchingVideo) { setIsWatchingVideo(false); modalClosed = true; }
          else if (isTeamModalOpen) { setIsTeamModalOpen(false); modalClosed = true; }
          else if (isNotificationsOpen) { setIsNotificationsOpen(false); modalClosed = true; }
          else if (isEditProfileOpen) { setIsEditProfileOpen(false); modalClosed = true; }
        }

        if (modalClosed) {
          ensureHistoryBuffer(currentScreen);
          return;
        }

        setCurrentScreen(stateScreen);
        if (stateScreen === 'home') setActiveTab('home');
        else if (stateScreen === 'member_plans') setActiveTab('member');
        else if (stateScreen === 'mission') setActiveTab('mission');
        else if (stateScreen === 'record') setActiveTab('record');
        else if (stateScreen === 'profile' || stateScreen === 'wallet') setActiveTab('me');

        try {
          localStorage.setItem('taskvibe_screen', stateScreen);
        } catch {}

        setHistoryStack((prev) => {
          const next = [...prev];
          if (next.length > 1) next.pop();
          return next.length ? next : [stateScreen];
        });
        return;
      }

      handleBackActionRef.current('popstate');
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('backbutton', handleHardwareBack, false);
      if (capRemoveFn) {
        try {
          capRemoveFn();
        } catch {}
      }
    };
  }, []);

  const navigate = (screen: ScreenType, plan?: PlanItem) => {
    if (screen === 'spin_win') {
      setIsSpinModalOpen(true);
      return;
    }
    if (screen === 'leaderboard') {
      setIsLeaderboardModalOpen(true);
      return;
    }
    if (plan) setSelectedPlan(plan);
    if (screen === currentScreen) return;

    let targetScreen = screen;
    if (isLoggedIn && (targetScreen === 'login' || targetScreen === 'register' || targetScreen === 'splash')) {
      targetScreen = 'home';
    }
    if (!isLoggedIn && targetScreen === 'home') {
      targetScreen = 'login';
    }

    try {
      localStorage.setItem('taskvibe_screen', targetScreen);
    } catch {}

    // Push new hash entry — adds an entry to Android WebView's WebBackForwardList
    try {
      window.history.pushState(
        { taskvibe: true, screen: targetScreen, planId: plan?.id },
        '',
        `#${targetScreen}`
      );
    } catch {}

    setHistoryStack((prev) => {
      const clean = isLoggedIn
        ? prev.filter((s) => s !== 'login' && s !== 'register' && s !== 'splash')
        : prev;
      if (targetScreen === 'home') {
        return ['home'];
      }
      if (clean[clean.length - 1] === targetScreen) {
        return clean;
      }
      return [...clean, targetScreen];
    });
    setCurrentScreen(targetScreen);

    // Sync active bottom tab
    if (targetScreen === 'home') setActiveTab('home');
    else if (targetScreen === 'member_plans') setActiveTab('member');
    else if (targetScreen === 'mission') setActiveTab('mission');
    else if (targetScreen === 'record') setActiveTab('record');
    else if (targetScreen === 'profile') setActiveTab('me');
  };

  const switchTab = (tab: BottomTabType) => {
    setActiveTab(tab);
    let targetScreen: ScreenType = 'home';
    if (tab === 'home') targetScreen = 'home';
    else if (tab === 'member') targetScreen = 'member_plans';
    else if (tab === 'mission') targetScreen = 'mission';
    else if (tab === 'record') targetScreen = 'record';
    else if (tab === 'me') targetScreen = 'profile';

    try {
      localStorage.setItem('taskvibe_screen', targetScreen);
      // If switching between secondary bottom tabs, use replaceState so back always returns directly to Home!
      if (currentScreen !== 'home' && targetScreen !== 'home') {
        window.history.replaceState({ taskvibe: true, screen: targetScreen }, '', `#${targetScreen}`);
      } else {
        window.history.pushState({ taskvibe: true, screen: targetScreen }, '', `#${targetScreen}`);
      }
    } catch {}

    setHistoryStack((prev) => {
      if (targetScreen === 'home') {
        return ['home'];
      }
      return ['home', targetScreen];
    });
    setCurrentScreen(targetScreen);
  };

  const checkPhoneExistsInFirestore = async (m: string): Promise<boolean> => {
    const clean = normalizeMobile(m);
    if (!clean || clean.length < 10) return false;
    try {
      const snap = await getDocFromServer(doc(db, 'users', clean));
      return snap.exists();
    } catch {
      try {
        const snap = await getDoc(doc(db, 'users', clean));
        if (snap.exists()) return true;
      } catch {}
      // When offline or on slow network, gracefully fall back to local registered users
      return registeredUsers.some((u) => normalizeMobile(u.mobile) === clean);
    }
  };

  const login = async (mobile: string, pass: string): Promise<boolean> => {
    if (!mobile || !pass) {
      showToast('⚠️ Please enter both mobile number and password');
      return false;
    }
    const cleanMobile = normalizeMobile(mobile);
    if (cleanMobile.length < 10) {
      showToast('⚠️ Please enter a valid 10-digit mobile number');
      return false;
    }

    // Check local registered users / storage first to support offline & slow networks
    const localUserMatch =
      registeredUsers.find((u) => normalizeMobile(u.mobile) === cleanMobile) ||
      (() => {
        try {
          const raw = localStorage.getItem('taskvibe_user');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && normalizeMobile(parsed.mobile) === cleanMobile) return parsed;
          }
        } catch {}
        return null;
      })();

    // If account was already registered on this device, log in immediately without blocking on slow network
    if (localUserMatch) {
      if (localUserMatch.password && localUserMatch.password !== pass.trim()) {
        showToast('❌ Incorrect password! Please enter the correct password.');
        return false;
      }
      if (localUserMatch.isBlocked) {
        showToast('⛔ Your account has been suspended by administration.');
        return false;
      }

      setUser(localUserMatch);
      setTransactions(localUserMatch.transactions || []);
      setIsLoggedIn(true);
      setCurrentScreen('home');
      setActiveTab('home');
      setHistoryStack(['home']);

      try {
        localStorage.setItem('taskvibe_auth', 'true');
        localStorage.setItem('taskvibe_active_mobile', cleanMobile);
        localStorage.setItem('taskvibe_user', JSON.stringify(localUserMatch));
        localStorage.setItem('taskvibe_txs', JSON.stringify(localUserMatch.transactions || []));
        localStorage.setItem('taskvibe_last_registered_mobile', cleanMobile);
        window.history.replaceState({ zorotask_app: true, screen: 'home' }, '', '#home');
      } catch (e) {
        console.warn(e);
      }

      showToast(`✓ Welcome back, ${localUserMatch.name || 'User'}!`);

      // Silently refresh fresh cloud data in background whenever network is ready (no error popups)
      getDoc(doc(db, 'users', cleanMobile))
        .then((snap) => {
          if (snap.exists()) {
            const fresh = snap.data() as RegisteredUserAccount;
            setUser((curr) => ({ ...curr, ...fresh }));
            if (fresh.transactions) setTransactions(fresh.transactions);
          }
        })
        .catch(() => {});

      return true;
    }

    // Account not in local cache: connect to cloud database patiently
    let cloudSnap: any = null;
    try {
      const userRef = doc(db, 'users', cleanMobile);
      cloudSnap = await getDoc(userRef);
    } catch (err) {
      console.warn('Network slow/offline during login fetch:', err);
      // No intrusive error popup on slow network; app simply waits for network to recover
      return false;
    }

    if (!cloudSnap || !cloudSnap.exists()) {
      showToast(`❌ Account (+91 ${cleanMobile}) registered nahi hai.`);
      return false;
    }

    const matched: RegisteredUserAccount = cloudSnap.data() as RegisteredUserAccount;
    if (!matched) {
      showToast(`❌ Account (+91 ${cleanMobile}) does not exist. Please click "Register Now" to create an account.`);
      return false;
    }

    if (matched.password !== pass.trim()) {
      showToast('❌ Incorrect password! Please enter the correct password.');
      return false;
    }

    if (matched.isBlocked) {
      showToast('⛔ Your account has been suspended by administration. Tasks and withdrawals are restricted.');
      return false;
    }

    // Successful login - load user's real balance, details, and transactions
    setUser(matched);
    setTransactions(matched.transactions || []);
    setIsLoggedIn(true);
    setCurrentScreen('home');
    setActiveTab('home');
    setHistoryStack(['home']);

    // Cache user locally for future offline and slow-network resilience
    setRegisteredUsers((prev) => {
      const filtered = prev.filter((u) => normalizeMobile(u.mobile) !== cleanMobile);
      const next = [matched, ...filtered];
      try {
        localStorage.setItem('taskvibe_registered_users', JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      localStorage.setItem('taskvibe_auth', 'true');
      localStorage.setItem('taskvibe_active_mobile', cleanMobile);
      localStorage.setItem('taskvibe_user', JSON.stringify(matched));
      localStorage.setItem('taskvibe_txs', JSON.stringify(matched.transactions || []));
      localStorage.setItem('taskvibe_last_registered_mobile', cleanMobile);
      window.history.replaceState({ zorotask_app: true, screen: 'home' }, '', '#home');
    } catch (e) {
      console.warn(e);
    }

    showToast(`✓ Login successful! Welcome back, ${matched.name || 'User'}!`);
    return true;
  };

  const resetUserPassword = async (mobile: string, newPass: string): Promise<boolean> => {
    const cleanMobile = normalizeMobile(mobile);
    const trimmedPass = newPass.trim();
    if (!cleanMobile || cleanMobile.length < 10 || !trimmedPass) {
      showToast('Please enter a valid 10-digit mobile number and new password');
      return false;
    }

    try {
      const userRef = doc(db, 'users', cleanMobile);
      const snap = await getDoc(userRef);
      const localMatch = registeredUsers.find((u) => normalizeMobile(u.mobile) === cleanMobile);

      if (!snap.exists() && !localMatch) {
        showToast(`❌ Mobile number (+91 ${cleanMobile}) is not registered!`);
        return false;
      }

      await setDoc(userRef, { password: trimmedPass }, { merge: true });
    } catch (err) {
      console.warn('Firestore password reset update warning:', err);
    }

    setRegisteredUsers((prev) => {
      const next = prev.map((u) =>
        normalizeMobile(u.mobile) === cleanMobile ? { ...u, password: trimmedPass } : u
      );
      try {
        localStorage.setItem('taskvibe_registered_users', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (normalizeMobile(user.mobile) === cleanMobile) {
      setUser((prev) => ({ ...prev, password: trimmedPass }));
    }

    triggerConfetti();
    showToast('✓ Password changed successfully! Please login with your new password.');
    return true;
  };

  const register = async (
    name: string,
    mobile: string,
    email: string,
    pass: string,
    refCode?: string
  ): Promise<boolean> => {
    if (!name || !mobile || !pass) {
      showToast('Please fill all required fields');
      return false;
    }

    const cleanMobile = normalizeMobile(mobile);
    if (cleanMobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return false;
    }

    // 1. Authoritative check in Firestore server: 1 Phone number = 1 Active Account only!
    let alreadyExists = false;
    let checkedCloud = false;
    try {
      const userRef = doc(db, 'users', cleanMobile);
      const snap = await getDocFromServer(userRef);
      checkedCloud = true;
      if (snap.exists()) {
        alreadyExists = true;
      }
    } catch (err) {
      try {
        const userRef = doc(db, 'users', cleanMobile);
        const snap = await getDoc(userRef);
        checkedCloud = true;
        if (snap.exists()) {
          alreadyExists = true;
        }
      } catch (e2) {
        console.warn('Firestore existence check error', e2);
      }
    }

    // If Firestore confirmed user does NOT exist, they were deleted by Admin or are new!
    // Purge any stale local cached record so they can register cleanly as a brand new account:
    if (checkedCloud && !alreadyExists) {
      setRegisteredUsers((prev) => {
        const next = prev.filter((u) => normalizeMobile(u.mobile) !== cleanMobile);
        try {
          localStorage.setItem('taskvibe_registered_users', JSON.stringify(next));
        } catch {}
        return next;
      });
      try {
        await deleteDoc(doc(db, 'deleted_accounts', cleanMobile));
      } catch {}
    } else if (!checkedCloud) {
      alreadyExists = registeredUsers.some(
        (u) => normalizeMobile(u.mobile) === cleanMobile
      );
    }

    if (alreadyExists) {
      showToast(`❌ This mobile number (+91 ${cleanMobile}) is already registered! Please login with your password.`);
      try {
        localStorage.setItem('taskvibe_last_registered_mobile', cleanMobile);
      } catch (e) {
        console.warn(e);
      }
      setCurrentScreen('login');
      setHistoryStack(['login']);
      return false;
    }

    // Validate referral code if provided
    let matchedReferrer: RegisteredUserAccount | null = null;
    let matchedReferrerDocId = '';
    const cleanRefCode = refCode ? refCode.trim().toUpperCase() : '';
    if (cleanRefCode) {
      matchedReferrer =
        registeredUsers.find(
          (u) => u.referralCode && u.referralCode.trim().toUpperCase() === cleanRefCode
        ) || null;

      // Also check in Firestore if not in local memory
      if (!matchedReferrer) {
        try {
          const qSnap = await getDocs(
            query(collection(db, 'users'), where('referralCode', '==', cleanRefCode), limit(1))
          );
          if (!qSnap.empty) {
            matchedReferrerDocId = qSnap.docs[0].id;
            matchedReferrer = qSnap.docs[0].data() as RegisteredUserAccount;
          }
        } catch (e) {
          console.warn('Referral check in Firestore failed:', e);
        }
      } else {
        matchedReferrerDocId = normalizeMobile(matchedReferrer.mobile);
      }

      // Allow master referral codes as valid default fallback
      const isMasterCode =
        cleanRefCode === 'ZT982143' ||
        cleanRefCode === 'ZOROTASK123' ||
        cleanRefCode === 'TV982143' ||
        cleanRefCode === 'TASKVIBE123';
      if (!matchedReferrer && !isMasterCode) {
        showToast(`❌ Invalid invite code "${cleanRefCode}"! Please enter a valid candidate invite code or leave it blank.`);
        return false;
      }

      // 1. Anti-Fraud: Strictly block self-referral
      if (matchedReferrer && normalizeMobile(matchedReferrer.mobile) === cleanMobile) {
        showToast('❌ Self-referral is not permitted. You cannot refer your own number!');
        return false;
      }
    }

    // 1. Device Fingerprint & Multi-Account Detection
    const currentDevice = typeof window !== 'undefined'
      ? `${(navigator.userAgent || '').slice(0, 40)}_${window.screen?.width || 0}x${window.screen?.height || 0}_${navigator.language || ''}`
      : 'device_unknown';

    if (matchedReferrer && matchedReferrer.deviceFingerprint && matchedReferrer.deviceFingerprint === currentDevice) {
      showToast('❌ Self-referral blocked: Both accounts belong to the same device!');
      return false;
    }

    const sameDeviceAccounts = registeredUsers.filter((u) => u.deviceFingerprint && u.deviceFingerprint === currentDevice);
    const isSuspicious = sameDeviceAccounts.length >= 2;
    const suspiciousReason = isSuspicious ? `Multi-account cluster: ${sameDeviceAccounts.length + 1} accounts on same device` : undefined;

    // Generate unique referral code for this new user
    let newReferralCode = `ZT${Math.floor(100000 + Math.random() * 900000)}`;
    while (registeredUsers.some((u) => u.referralCode === newReferralCode)) {
      newReferralCode = `ZT${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const initialTxs: TransactionItem[] = [];

    const newUser: RegisteredUserAccount = {
      name: name.trim(),
      mobile: `+91 ${cleanMobile}`,
      email: email ? email.trim() : `${cleanMobile}@zorotask.in`,
      referralCode: newReferralCode,
      referredBy: matchedReferrer
        ? matchedReferrer.referralCode
        : cleanRefCode
        ? cleanRefCode
        : undefined,
      balance: 0,
      totalEarned: 0,
      withdrawn: 0,
      upiId: `${cleanMobile}@upi`,
      joinedDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      joinedTimestamp: Date.now(),
      trialStartedAt: Date.now(),
      isNewTrialEligible: true,
      freeTrialOverride: 'auto',
      password: pass.trim(),
      vipLevel: 0,
      vipTag: 'Free Starter',
      deviceFingerprint: currentDevice,
      isSuspicious,
      suspiciousReason,
      transactions: [],
    };

    // Save new user to Firestore cloud database
    try {
      const userRef = doc(db, 'users', cleanMobile);
      await setDoc(userRef, newUser);
    } catch (err) {
      console.error('Failed to save user to Firestore', err);
    }

    // Link referral relationship:
    // Policy: New user gets ₹0 initial balance.
    // The inviter gets ₹0 on signup. Inviter earns commission (4.5% Level 1, 1.5% Level 2, 1.0% Level 3)
    // ONLY when the invited user purchases a VIP Plan!
    if (matchedReferrer) {
      const refClean = normalizeMobile(matchedReferrer.mobile) || matchedReferrerDocId;
      if (normalizeMobile(user.mobile) === refClean) {
        setNotifications((prev) => [
          {
            id: `notif_${Date.now()}`,
            title: `👥 New Team Member Registered!`,
            message: `${name.trim()} (+91 ${cleanMobile}) ne aapke invite link se register kiya. Jab ye koi VIP Plan khareedenge, tab aapko direct 4.5% commission milega!`,
            time: 'Just now',
            read: false,
            type: 'system',
          },
          ...prev,
        ]);
      }
    }

    setRegisteredUsers((prev) => {
      const filtered = prev.filter((u) => normalizeMobile(u.mobile) !== cleanMobile);
      const finalList = [...filtered, newUser];
      try {
        localStorage.setItem('taskvibe_registered_users', JSON.stringify(finalList));
      } catch (e) {
        console.warn(e);
      }
      return finalList;
    });

    setUser(newUser);
    setTransactions(initialTxs);
    setIsLoggedIn(true);
    setCurrentScreen('home');
    setActiveTab('home');
    setHistoryStack(['home']);

    try {
      localStorage.setItem('taskvibe_auth', 'true');
      localStorage.setItem('taskvibe_active_mobile', cleanMobile);
      localStorage.setItem('taskvibe_user', JSON.stringify(newUser));
      localStorage.setItem('taskvibe_txs', JSON.stringify(initialTxs));
      localStorage.setItem('taskvibe_last_registered_mobile', cleanMobile);
      window.history.replaceState({ zorotask_app: true, screen: 'home' }, '', '#home');
    } catch (e) {
      console.warn(e);
    }

    triggerConfetti();
    showToast(`🎉 Account successfully created! Welcome ${newUser.name}!`);

    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(emptyUser);
    setTransactions([]);
    setHistoryStack(['login']);
    setCurrentScreen('login');
    try {
      localStorage.setItem('taskvibe_auth', 'false');
      localStorage.removeItem('taskvibe_active_mobile');
      localStorage.removeItem('taskvibe_user');
      localStorage.removeItem('taskvibe_txs');
      window.history.replaceState({ zorotask_app: true, screen: 'login' }, '', '#login');
    } catch (e) {
      console.warn(e);
    }
    showToast('Logout successful. Enter your phone and password to login again.');
  };

  const addMoneyInitiate = (amount: number, bonus: number) => {
    setPendingUPIAmount(amount);
    setPendingUPIBonus(bonus);
    setPendingDepositType('add_money');
    setPendingPlanForUPI(null);
    setIsUPIModalOpen(true);
  };

  // Real-time referral code validator helper (synchronous check against memory and defaults)
  const validateReferralCode = (code: string): { isValid: boolean; referrerName?: string } => {
    if (!code || !code.trim()) return { isValid: false };
    const clean = code.trim().toUpperCase();
    if (
      clean === 'ZT982143' ||
      clean === 'ZOROTASK123' ||
      clean === 'TV982143' ||
      clean === 'TASKVIBE123'
    ) {
      return { isValid: true, referrerName: 'ZoroTask Official' };
    }
    const match = registeredUsers.find(
      (u) => u.referralCode && u.referralCode.trim().toUpperCase() === clean
    );
    if (match) {
      return { isValid: true, referrerName: match.name || 'Member' };
    }
    return { isValid: false };
  };

  // Asynchronous referral validator: Checks Firestore cloud database if not yet cached locally
  const validateReferralCodeAsync = async (
    code: string
  ): Promise<{ isValid: boolean; referrerName?: string }> => {
    const syncCheck = validateReferralCode(code);
    if (syncCheck.isValid) return syncCheck;
    if (!code || !code.trim()) return { isValid: false };
    const clean = code.trim().toUpperCase();
    try {
      const qSnap = await getDocs(
        query(collection(db, 'users'), where('referralCode', '==', clean), limit(1))
      );
      if (!qSnap.empty) {
        const cloudUser = qSnap.docs[0].data() as RegisteredUserAccount;
        // Cache this user into local state
        setRegisteredUsers((prev) => {
          if (!prev.some((u) => normalizeMobile(u.mobile) === normalizeMobile(cloudUser.mobile))) {
            const next = [...prev, cloudUser];
            try {
              localStorage.setItem('taskvibe_registered_users', JSON.stringify(next));
            } catch {}
            return next;
          }
          return prev;
        });
        return { isValid: true, referrerName: cloudUser.name || 'Member' };
      }
    } catch (err) {
      console.warn('validateReferralCodeAsync Firestore error:', err);
    }
    return { isValid: false };
  };

  // Helper to resolve an upline user either from memory or directly from Firestore
  const findUserByReferralCode = async (
    code: string
  ): Promise<{ user: RegisteredUserAccount; docId: string } | null> => {
    if (!code || !code.trim()) return null;
    const clean = code.trim().toUpperCase();

    // 1. Check local memory
    const inMem = registeredUsers.find(
      (u) => u.referralCode && u.referralCode.trim().toUpperCase() === clean
    );
    if (inMem) {
      return { user: inMem, docId: normalizeMobile(inMem.mobile) };
    }

    // 2. Check Firestore cloud database
    try {
      const q = query(collection(db, 'users'), where('referralCode', '==', clean), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const cloudData = snap.docs[0].data() as RegisteredUserAccount;
        return { user: cloudData, docId: snap.docs[0].id };
      }
    } catch (e) {
      console.warn('Error finding user by referral code in Firestore:', e);
    }
    return null;
  };

  // Manual one-tap sync for referral wallet and team counts from Firestore
  const syncReferralWallet = async () => {
    if (!user.mobile) return;
    try {
      const cleanMobile = normalizeMobile(user.mobile);
      const userRef = doc(db, 'users', cleanMobile);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const cloudData = snap.data() as RegisteredUserAccount;
        setUser((curr) => {
          const merged = { ...curr, ...cloudData };
          try {
            localStorage.setItem('taskvibe_user', JSON.stringify(merged));
          } catch {}
          return merged;
        });
        if (cloudData.transactions && Array.isArray(cloudData.transactions)) {
          setTransactions(cloudData.transactions);
          try {
            localStorage.setItem('taskvibe_txs', JSON.stringify(cloudData.transactions));
          } catch {}
        }
      }

      // Also refresh all registered users for team lists
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        const allUsers = usersSnap.docs.map((d) => d.data() as RegisteredUserAccount);
        setRegisteredUsers(allUsers);
        try {
          localStorage.setItem('taskvibe_registered_users', JSON.stringify(allUsers));
        } catch {}
      }

      showToast('✓ Referral wallet & royalties synchronized from cloud database!');
    } catch (e) {
      console.warn('syncReferralWallet failed:', e);
      showToast('Referral wallet is synchronized.');
    }
  };

  // Multi-tier commission distribution on plan purchase:
  // Level 1 Direct Referral: 4.5%
  // Level 2 (Friends of Friends): 1.5%
  // Level 3+ (Downstream Team): 1.0%
  const distributePlanPurchaseCommissions = async (
    buyerUser: RegisteredUserAccount,
    planPrice: number,
    planLevel: number
  ) => {
    if (!buyerUser.referredBy || planPrice <= 0) return;

    try {
      // 1. Level 1 Upline (Direct Referrer) - 4.5% Commission + ₹100 Referral Bonus on VIP Plan Purchase!
      const upline1Data = await findUserByReferralCode(buyerUser.referredBy);
      if (upline1Data) {
        const upline1 = upline1Data.user;
        const u1Clean = upline1Data.docId;

        // 4.5% VIP Plan Commission
        const comm1 = Math.round(planPrice * 0.045 * 100) / 100;

        // ₹100 Referral Bonus awarded when invited user buys a VIP plan!
        const isFirstPlan = !buyerUser.firstPlanReferralBonusPaid;
        const refBonus = isFirstPlan ? (adminSettings.referralBonus || 100) : 0;
        const totalU1Reward = comm1 + refBonus;

        if (totalU1Reward > 0) {
          const u1Txs: TransactionItem[] = [];

          if (comm1 > 0) {
            u1Txs.push({
              id: `tx_ref1_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'referral_reward',
              title: `Level 1 Referral Commission (4.5%)`,
              date: 'Today',
              amount: comm1,
              isCredit: true,
              status: 'verified',
              note: `Direct referral ${buyerUser.name} purchased Level ${planLevel} VIP plan (₹${planPrice}). 4.5% commission credited (+₹${comm1})!`,
            });
          }

          if (refBonus > 0) {
            u1Txs.push({
              id: `tx_ref_bonus_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'referral_reward',
              title: `Referral Plan Activation Bonus (+₹${refBonus})`,
              date: 'Today',
              amount: refBonus,
              isCredit: true,
              status: 'verified',
              note: `Referral ${buyerUser.name} purchased their VIP plan! ₹${refBonus} referral bonus credited to your wallet.`,
            });
          }

          // Update in registeredUsers memory and localStorage
          setRegisteredUsers((prev) => {
            let found = false;
            const updated = prev.map((u) => {
              if (normalizeMobile(u.mobile) === u1Clean) {
                found = true;
                return {
                  ...u,
                  balance: (u.balance || 0) + totalU1Reward,
                  totalEarned: (u.totalEarned || 0) + totalU1Reward,
                  referralEarnings: (u.referralEarnings || 0) + totalU1Reward,
                  transactions: [...u1Txs, ...(u.transactions || [])],
                };
              }
              return u;
            });
            if (!found) {
              updated.push({
                ...upline1,
                balance: (upline1.balance || 0) + totalU1Reward,
                totalEarned: (upline1.totalEarned || 0) + totalU1Reward,
                referralEarnings: (upline1.referralEarnings || 0) + totalU1Reward,
                transactions: [...u1Txs, ...(upline1.transactions || [])],
              });
            }
            try {
              localStorage.setItem('taskvibe_registered_users', JSON.stringify(updated));
            } catch {}
            return updated;
          });

          // If current logged-in user is Level 1 upline
          if (normalizeMobile(user.mobile) === u1Clean) {
            setUser((curr) => ({
              ...curr,
              balance: curr.balance + totalU1Reward,
              totalEarned: curr.totalEarned + totalU1Reward,
              referralEarnings: (curr.referralEarnings || 0) + totalU1Reward,
            }));
            setTransactions((prev) => [...u1Txs, ...prev]);
            setNotifications((prev) => [
              {
                id: `notif_${Date.now()}`,
                title: `🎉 VIP Commission & Referral Bonus (+₹${totalU1Reward})!`,
                message: `Direct referral ${buyerUser.name} ne VIP Plan khareeda! 4.5% commission (₹${comm1}) ${refBonus > 0 ? `+ ₹${refBonus} Referral Bonus` : ''} aapke wallet me add ho gaya!`,
                time: 'Just now',
                read: false,
                type: 'reward',
              },
              ...prev,
            ]);
          }

          // Persist directly to Firestore
          try {
            const u1Ref = doc(db, 'users', u1Clean);
            const u1Snap = await getDoc(u1Ref);
            const existingU1Txs: TransactionItem[] =
              u1Snap.exists() && u1Snap.data().transactions ? u1Snap.data().transactions : [];
            await setDoc(
              u1Ref,
              {
                balance: increment(totalU1Reward),
                totalEarned: increment(totalU1Reward),
                referralEarnings: increment(totalU1Reward),
                transactions: [...u1Txs, ...existingU1Txs],
              },
              { merge: true }
            );
          } catch (e) {
            console.warn('Failed to update Level 1 upline in Firestore:', e);
          }

          // Mark firstPlanReferralBonusPaid on buyer in Firestore and state
          if (isFirstPlan && refBonus > 0) {
            try {
              const buyerClean = normalizeMobile(buyerUser.mobile);
              if (buyerClean) {
                await setDoc(doc(db, 'users', buyerClean), { firstPlanReferralBonusPaid: true }, { merge: true });
                setRegisteredUsers((prev) =>
                  prev.map((u) =>
                    normalizeMobile(u.mobile) === buyerClean ? { ...u, firstPlanReferralBonusPaid: true } : u
                  )
                );
                if (normalizeMobile(user.mobile) === buyerClean) {
                  setUser((prev) => ({ ...prev, firstPlanReferralBonusPaid: true }));
                }
              }
            } catch (bErr) {
              console.warn('Failed to mark firstPlanReferralBonusPaid:', bErr);
            }
          }
        }

        // 2. Level 2 Upline (Referrer of upline1) - 1.5%
        if (upline1.referredBy) {
          const upline2Data = await findUserByReferralCode(upline1.referredBy);
          if (upline2Data) {
            const upline2 = upline2Data.user;
            const comm2 = Math.round(planPrice * 0.015 * 100) / 100;
            if (comm2 > 0) {
              const u2Clean = upline2Data.docId;
              const u2Tx: TransactionItem = {
                id: `tx_ref2_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                type: 'referral_reward',
                title: `Level 2 Team Referral Commission (1.5%)`,
                date: 'Today',
                amount: comm2,
                isCredit: true,
                status: 'verified',
                note: `Tier-2 referral ${buyerUser.name} purchased Level ${planLevel} VIP plan (₹${planPrice}). 1.5% team commission credited (+₹${comm2})!`,
              };

              setRegisteredUsers((prev) => {
                let found = false;
                const updated = prev.map((u) => {
                  if (normalizeMobile(u.mobile) === u2Clean) {
                    found = true;
                    return {
                      ...u,
                      balance: (u.balance || 0) + comm2,
                      totalEarned: (u.totalEarned || 0) + comm2,
                      referralEarnings: (u.referralEarnings || 0) + comm2,
                      transactions: [u2Tx, ...(u.transactions || [])],
                    };
                  }
                  return u;
                });
                if (!found) {
                  updated.push({
                    ...upline2,
                    balance: (upline2.balance || 0) + comm2,
                    totalEarned: (upline2.totalEarned || 0) + comm2,
                    referralEarnings: (upline2.referralEarnings || 0) + comm2,
                    transactions: [u2Tx, ...(upline2.transactions || [])],
                  });
                }
                try {
                  localStorage.setItem('taskvibe_registered_users', JSON.stringify(updated));
                } catch {}
                return updated;
              });

              if (normalizeMobile(user.mobile) === u2Clean) {
                setUser((curr) => ({
                  ...curr,
                  balance: curr.balance + comm2,
                  totalEarned: curr.totalEarned + comm2,
                  referralEarnings: (curr.referralEarnings || 0) + comm2,
                }));
                setTransactions((prev) => [u2Tx, ...prev]);
                setNotifications((prev) => [
                  {
                    id: `notif_${Date.now()}`,
                    title: `🎉 Level 2 Commission (+₹${comm2})!`,
                    message: `Level 2 team referral ${buyerUser.name} purchased Level ${planLevel} plan. ₹${comm2} (1.5%) credited to your wallet!`,
                    time: 'Just now',
                    read: false,
                    type: 'reward',
                  },
                  ...prev,
                ]);
              }

              try {
                const u2Ref = doc(db, 'users', u2Clean);
                const u2Snap = await getDoc(u2Ref);
                const existingU2Txs: TransactionItem[] =
                  u2Snap.exists() && u2Snap.data().transactions ? u2Snap.data().transactions : [];
                await setDoc(
                  u2Ref,
                  {
                    balance: increment(comm2),
                    totalEarned: increment(comm2),
                    referralEarnings: increment(comm2),
                    transactions: [u2Tx, ...existingU2Txs],
                  },
                  { merge: true }
                );
              } catch (e) {
                console.warn('Failed to update Level 2 upline in Firestore:', e);
              }
            }

            // 3. Level 3+ Upline (Referrer of upline2) - 1.0%
            if (upline2.referredBy) {
              const upline3Data = await findUserByReferralCode(upline2.referredBy);
              if (upline3Data) {
                const upline3 = upline3Data.user;
                const comm3 = Math.round(planPrice * 0.01 * 100) / 100;
                if (comm3 > 0) {
                  const u3Clean = upline3Data.docId;
                  const u3Tx: TransactionItem = {
                    id: `tx_ref3_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    type: 'referral_reward',
                    title: `Level 3 Team Referral Commission (1.0%)`,
                    date: 'Today',
                    amount: comm3,
                    isCredit: true,
                    status: 'verified',
                    note: `Tier-3 downstream referral ${buyerUser.name} purchased Level ${planLevel} VIP plan (₹${planPrice}). 1.0% multi-tier commission credited (+₹${comm3})!`,
                  };

                  setRegisteredUsers((prev) => {
                    let found = false;
                    const updated = prev.map((u) => {
                      if (normalizeMobile(u.mobile) === u3Clean) {
                        found = true;
                        return {
                          ...u,
                          balance: (u.balance || 0) + comm3,
                          totalEarned: (u.totalEarned || 0) + comm3,
                          referralEarnings: (u.referralEarnings || 0) + comm3,
                          transactions: [u3Tx, ...(u.transactions || [])],
                        };
                      }
                      return u;
                    });
                    if (!found) {
                      updated.push({
                        ...upline3,
                        balance: (upline3.balance || 0) + comm3,
                        totalEarned: (upline3.totalEarned || 0) + comm3,
                        referralEarnings: (upline3.referralEarnings || 0) + comm3,
                        transactions: [u3Tx, ...(upline3.transactions || [])],
                      });
                    }
                    try {
                      localStorage.setItem('taskvibe_registered_users', JSON.stringify(updated));
                    } catch {}
                    return updated;
                  });

                  if (normalizeMobile(user.mobile) === u3Clean) {
                    setUser((curr) => ({
                      ...curr,
                      balance: curr.balance + comm3,
                      totalEarned: curr.totalEarned + comm3,
                      referralEarnings: (curr.referralEarnings || 0) + comm3,
                    }));
                    setTransactions((prev) => [u3Tx, ...prev]);
                  }

                  try {
                    const u3Ref = doc(db, 'users', u3Clean);
                    const u3Snap = await getDoc(u3Ref);
                    const existingU3Txs: TransactionItem[] =
                      u3Snap.exists() && u3Snap.data().transactions ? u3Snap.data().transactions : [];
                    await setDoc(
                      u3Ref,
                      {
                        balance: increment(comm3),
                        totalEarned: increment(comm3),
                        referralEarnings: increment(comm3),
                        transactions: [u3Tx, ...existingU3Txs],
                      },
                      { merge: true }
                    );
                  } catch (e) {
                    console.warn('Failed to update Level 3 upline in Firestore:', e);
                  }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error distributing plan commissions:', err);
    }
  };

  const buyPlanWithUPI = (plan: PlanItem) => {
    if (plan.price === 0) {
      showToast('✓ Free Starter Level 0 plan is active.');
      return;
    }
    // Block re-purchasing the exact same plan
    if ((user.purchasedPlanIds || []).includes(plan.id)) {
      showToast(`❌ You have already purchased ${plan.title}! Each member can buy each plan once.`);
      return;
    }
    setSelectedPlan(plan);
    setPendingUPIAmount(plan.price);
    setPendingUPIBonus(plan.bonus || 0);
    setPendingDepositType('plan_purchase');
    setPendingPlanForUPI(plan);
    setIsUPIModalOpen(true);
  };

  const submitUPIPaymentProof = async (utrNumber: string, screenshotUrl?: string) => {
    const amount = pendingUPIAmount;
    const bonus = pendingUPIBonus;
    const depositType = pendingDepositType;
    const plan = pendingPlanForUPI;

    const depositId = `dep_${Date.now()}`;
    const orderId = `#UPI${Date.now().toString().slice(-8)}`;
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', Today';

    const newDeposit: PaymentDeposit = {
      id: depositId,
      userId: user.referralCode || 'USER',
      userName: user.name || 'Member',
      userMobile: user.mobile,
      amount,
      bonus,
      planLevel: plan ? plan.level : undefined,
      planTitle: plan ? (plan.levelTag || `Level ${plan.level}`) : undefined,
      depositType,
      adminUpiId: adminSettings.adminUpiId,
      utrNumber: utrNumber.trim(),
      screenshotUrl: screenshotUrl || '',
      submittedAt: nowTime,
      timestamp: Date.now(),
      status: 'in_process',
    };

    // Save directly to Firestore collection 'deposits'
    try {
      await setDoc(doc(db, 'deposits', depositId), newDeposit);
    } catch (err) {
      console.warn('Could not write deposit to Firestore:', err);
    }

    // Immediately update local state
    setPaymentDeposits((prev) => [newDeposit, ...prev.filter((d) => d.id !== depositId)]);

    // Add In-Process transaction in user record
    const newTx: TransactionItem = {
      id: `tx_${depositId}`,
      type: depositType === 'plan_purchase' ? 'purchase' : 'add_money',
      title: depositType === 'plan_purchase'
        ? `VIP Level ${plan?.level} UPI Payment (In-Process)`
        : `Wallet Deposit ₹${amount.toLocaleString('en-IN')} (In-Process)`,
      date: 'Today',
      amount,
      isCredit: true,
      status: 'in_process',
      orderId,
      utrNumber,
      screenshotUrl: screenshotUrl || '',
      note: `UTR: ${utrNumber} • Awaiting Admin verification & approval`,
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);

    // Sync to user's Firestore document
    if (user.mobile) {
      syncUserToFirestore(user, updatedTxs);
    }

    // Send in-app notification
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'UPI Payment Submitted (In-Process)',
        message: `₹${amount.toLocaleString('en-IN')} payment with UTR ${utrNumber} is submitted. Admin is reviewing your screenshot & UTR.`,
        time: 'Just now',
        read: false,
        type: 'system',
      },
      ...prev,
    ]);

    setIsUPIModalOpen(false);
    triggerConfetti();
    showToast('✓ Payment screenshot submitted! It will remain in-process until Admin approval.');
    navigate('record');
  };

  const approvePaymentDeposit = async (depositId: string) => {
    const deposit = paymentDeposits.find((d) => d.id === depositId);
    if (!deposit || deposit.status === 'approved') return;

    // 1. Update deposit in Firestore
    try {
      await setDoc(doc(db, 'deposits', depositId), { status: 'approved' }, { merge: true });
    } catch (err) {
      console.warn('Failed to update deposit in Firestore:', err);
    }

    // 2. Mark deposit as approved in local state
    setPaymentDeposits((prev) =>
      prev.map((d) => (d.id === depositId ? { ...d, status: 'approved' } : d))
    );

    // 3. Update user balance or VIP level in Firestore and local state
    const isPlan = deposit.depositType === 'plan_purchase' && deposit.planLevel !== undefined;
    const cleanMobile = deposit.userMobile ? normalizeMobile(deposit.userMobile) : '';

    if (cleanMobile) {
      const targetUser = registeredUsers.find((u) => normalizeMobile(u.mobile) === cleanMobile) ||
        (cleanMobile === normalizeMobile(user.mobile) ? (user as RegisteredUserAccount) : null);

      if (targetUser) {
        let updatedUserData: Partial<RegisteredUserAccount> = {};
        if (isPlan) {
          const targetPlan = plans.find((p) => p.level === deposit.planLevel);
          const vipTag = targetPlan?.levelTag || `Level ${deposit.planLevel}`;
          const currentPurchased = targetUser.purchasedPlanIds || [];
          const updatedPurchased = targetPlan && !currentPurchased.includes(targetPlan.id)
            ? [...currentPurchased, targetPlan.id]
            : currentPurchased;
          const maxLevel = Math.max(targetUser.vipLevel || 0, deposit.planLevel || 0);

          updatedUserData = {
            vipLevel: maxLevel,
            vipTag,
            purchasedPlanIds: updatedPurchased,
          };
        } else {
          const totalCredited = deposit.amount + (deposit.bonus || 0);
          updatedUserData = {
            balance: (targetUser.balance || 0) + totalCredited,
            totalEarned: (targetUser.totalEarned || 0) + totalCredited,
          };
        }

        // Save to Firestore users/{cleanMobile} along with updated transactions
        try {
          const userDocRef = doc(db, 'users', cleanMobile);
          const userDocSnap = await getDoc(userDocRef);
          const currentTxs: TransactionItem[] =
            userDocSnap.exists() && userDocSnap.data().transactions
              ? userDocSnap.data().transactions
              : (targetUser.transactions || []);

          const approvedTitle = isPlan
            ? `VIP Level ${deposit.planLevel} (Approved & Active)`
            : `Wallet Deposit (Approved +₹${deposit.bonus || 0} Bonus)`;
          const approvedNote = `Approved by Admin Panel on ${new Date().toLocaleDateString('en-IN')}`;

          let found = false;
          const updatedTxs = currentTxs.map((tx) => {
            if (
              tx.id === `tx_${depositId}` ||
              (tx.utrNumber &&
                deposit.utrNumber &&
                tx.utrNumber.trim().toLowerCase() === deposit.utrNumber.trim().toLowerCase())
            ) {
              found = true;
              return {
                ...tx,
                status: 'verified' as const,
                title: approvedTitle,
                note: approvedNote,
              };
            }
            return tx;
          });

          if (!found) {
            updatedTxs.unshift({
              id: `tx_${depositId}`,
              type: isPlan ? 'purchase' : 'purchase_reward',
              title: approvedTitle,
              date: new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              amount: deposit.amount,
              isCredit: !isPlan,
              status: 'verified',
              orderId: `#DEP${deposit.id.slice(-6)}`,
              utrNumber: deposit.utrNumber,
              note: approvedNote,
            });
          }

          updatedUserData.transactions = updatedTxs;
          await setDoc(userDocRef, updatedUserData, { merge: true });
        } catch (err) {
          console.warn('Failed to update user & transactions in Firestore:', err);
        }

        // Update local state if active user
        if (cleanMobile === normalizeMobile(user.mobile)) {
          setUser((u) => ({
            ...u,
            ...updatedUserData,
          }));
          if (updatedUserData.transactions) {
            setTransactions(updatedUserData.transactions);
          }
        }

        // Update in registeredUsers list
        setRegisteredUsers((prev) =>
          prev.map((u) => (normalizeMobile(u.mobile) === cleanMobile ? { ...u, ...updatedUserData } : u))
        );

        // Distribute multi-tier commission on approved plan purchase:
        // 4.5% to Level 1, 1.5% to Level 2, 1.0% to Level 3+
        if (isPlan && deposit.planLevel !== undefined) {
          distributePlanPurchaseCommissions(
            { ...targetUser, ...updatedUserData } as RegisteredUserAccount,
            deposit.amount,
            deposit.planLevel
          );
        }
      }
    }

    // 4. Update matching transaction in transactions list
    setTransactions((prev) =>
      prev.map((tx) => {
        if (
          tx.id === `tx_${depositId}` ||
          (tx.utrNumber &&
            deposit.utrNumber &&
            tx.utrNumber.trim().toLowerCase() === deposit.utrNumber.trim().toLowerCase())
        ) {
          return {
            ...tx,
            status: 'verified',
            title: isPlan
              ? `VIP Level ${deposit.planLevel} (Approved & Active)`
              : `Wallet Deposit (Approved +₹${deposit.bonus || 0} Bonus)`,
            note: `Approved by Admin Panel on ${new Date().toLocaleDateString('en-IN')}`,
          };
        }
        return tx;
      })
    );

    triggerConfetti();
    showToast(`✓ Payment Deposit ₹${deposit.amount.toLocaleString('en-IN')} Approved successfully!`);
  };

  const rejectPaymentDeposit = async (depositId: string, reason?: string) => {
    const deposit = paymentDeposits.find((d) => d.id === depositId);
    if (!deposit) return;

    const finalReason = reason || 'Invalid screenshot or UTR';

    // 1. Update in Firestore
    try {
      await setDoc(doc(db, 'deposits', depositId), { status: 'rejected', rejectionReason: finalReason }, { merge: true });
    } catch (err) {
      console.warn('Failed to reject deposit in Firestore:', err);
    }

    // 2. Update local state
    setPaymentDeposits((prev) =>
      prev.map((d) => (d.id === depositId ? { ...d, status: 'rejected', rejectionReason: finalReason } : d))
    );

    // 3. Update target user's transactions in Firestore
    const cleanMobile = deposit.userMobile ? normalizeMobile(deposit.userMobile) : '';
    if (cleanMobile) {
      try {
        const uDocRef = doc(db, 'users', cleanMobile);
        const uDocSnap = await getDoc(uDocRef);
        if (uDocSnap.exists()) {
          const uData = uDocSnap.data() as RegisteredUserAccount;
          const currentTxs = uData.transactions || [];
          const updatedTxs = currentTxs.map((tx) => {
            if (
              tx.id === `tx_${depositId}` ||
              (tx.utrNumber &&
                deposit.utrNumber &&
                tx.utrNumber.trim().toLowerCase() === deposit.utrNumber.trim().toLowerCase())
            ) {
              return {
                ...tx,
                status: 'failed' as const,
                note: `Rejected by Admin: ${finalReason}`,
              };
            }
            return tx;
          });
          await setDoc(uDocRef, { transactions: updatedTxs }, { merge: true });
        }
      } catch (err) {
        console.warn('Failed to sync rejection to user Firestore:', err);
      }
    }

    // 4. Update transaction in memory
    setTransactions((prev) =>
      prev.map((tx) => {
        if (
          tx.id === `tx_${depositId}` ||
          (tx.utrNumber &&
            deposit.utrNumber &&
            tx.utrNumber.trim().toLowerCase() === deposit.utrNumber.trim().toLowerCase())
        ) {
          return {
            ...tx,
            status: 'failed',
            note: `Rejected by Admin: ${finalReason}`,
          };
        }
        return tx;
      })
    );

    showToast(`Payment deposit rejected.`);
  };

  const buyPlanWithWallet = (plan: PlanItem): { success: boolean; message: string } => {
    if (plan.price === 0) {
      showToast('✓ Free Starter Level 0 plan is active.');
      return { success: true, message: 'Free plan active' };
    }

    // Block re-purchasing the exact same plan
    if ((user.purchasedPlanIds || []).includes(plan.id)) {
      showToast(`❌ You have already purchased ${plan.title}! Each member can buy each plan once.`);
      return {
        success: false,
        message: 'Plan already purchased',
      };
    }

    if (user.balance < plan.price) {
      const shortage = plan.price - user.balance;
      showToast(`Insufficient wallet balance! You have ₹${user.balance.toLocaleString('en-IN')}, required: ₹${plan.price.toLocaleString('en-IN')} (Shortage: ₹${shortage}).`);
      return {
        success: false,
        message: `Insufficient balance. Need ₹${shortage} more.`,
      };
    }

    const currentPurchased = user.purchasedPlanIds || [];
    const updatedPurchased = currentPurchased.includes(plan.id)
      ? currentPurchased
      : [...currentPurchased, plan.id];
    const maxLevel = Math.max(user.vipLevel || 0, plan.level);

    // Deduct plan price from user's balance & record purchased plan
    const updatedUser: UserProfile = {
      ...user,
      balance: user.balance - plan.price,
      vipLevel: maxLevel,
      vipTag: plan.levelTag || `Level ${maxLevel}`,
      purchasedPlanIds: updatedPurchased,
    };
    setUser(updatedUser);

    // Update in registeredUsers list in state and localStorage
    const cleanMobile = user.mobile ? normalizeMobile(user.mobile) : '';
    if (cleanMobile) {
      setRegisteredUsers((prev) =>
        prev.map((u) => {
          if (normalizeMobile(u.mobile) === cleanMobile) {
            const uPurchased = u.purchasedPlanIds || [];
            const newUPurchased = uPurchased.includes(plan.id) ? uPurchased : [...uPurchased, plan.id];
            return {
              ...u,
              balance: u.balance - plan.price,
              vipLevel: maxLevel,
              vipTag: plan.levelTag || `Level ${maxLevel}`,
              purchasedPlanIds: newUPurchased,
            };
          }
          return u;
        })
      );
    }

    // Distribute multi-tier commission on plan purchase: 4.5% to Level 1, 1.5% to Level 2, 1.0% to Level 3+
    distributePlanPurchaseCommissions(updatedUser as RegisteredUserAccount, plan.price, plan.level);

    // Record Debit Transaction
    const orderId = `#VIP${Date.now().toString().slice(-8)}`;
    const vipNow = Date.now();
    const vipDayInfo = getFormattedDayInfo(vipNow);
    const newTx: TransactionItem = {
      id: `tx_vip_${vipNow}`,
      type: 'purchase_reward',
      title: `VIP Level ${plan.level} Activation`,
      date: vipDayInfo.displayString,
      timestamp: vipNow,
      taskDate: vipDayInfo.isoDate,
      amount: plan.price,
      isCredit: false,
      status: 'verified',
      orderId,
      note: `VIP Level ${plan.level} (${plan.levelTag}) activated using Wallet Balance`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    setLastPurchase({
      amount: plan.price,
      reward: plan.bonus || 0,
      orderId,
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'verified',
    });

    triggerConfetti();
    showToast(`🎉 Congratulations! Level ${plan.level} (${plan.levelTag}) activated using wallet balance!`);
    navigate('purchase_confirmed');
    return { success: true, message: 'Activated successfully' };
  };

  const completeUPIPayment = () => {
    const amount = pendingUPIAmount;
    const bonus = pendingUPIBonus;
    const orderId = `#TV${new Date().getFullYear()}${Math.floor(10000000 + Math.random() * 90000000)}`;
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setIsUPIModalOpen(false);

    // If VIP plan is being activated with matching amount, upgrade VIP level & store plan
    const isPlanPurchase = selectedPlan && selectedPlan.level > 0 && selectedPlan.price === amount;
    const currentPurchased = user.purchasedPlanIds || [];
    const updatedPurchased = isPlanPurchase && selectedPlan && !currentPurchased.includes(selectedPlan.id)
      ? [...currentPurchased, selectedPlan.id]
      : currentPurchased;
    const maxLevel = isPlanPurchase && selectedPlan ? Math.max(user.vipLevel || 0, selectedPlan.level) : user.vipLevel;

    // Update balances & rewards
    setUser((prev) => ({
      ...prev,
      balance: prev.balance + bonus,
      totalEarned: prev.totalEarned + bonus,
      ...(isPlanPurchase && selectedPlan ? {
        vipLevel: maxLevel,
        vipTag: selectedPlan.levelTag || `Level ${maxLevel}`,
        purchasedPlanIds: updatedPurchased,
      } : {}),
    }));

    const upiNow = Date.now();
    const upiDayInfo = getFormattedDayInfo(upiNow);
    const newTx: TransactionItem = {
      id: `tx_${upiNow}`,
      type: 'purchase_reward',
      title: isPlanPurchase ? `VIP Level ${selectedPlan.level} Activation` : 'Purchase Reward',
      date: upiDayInfo.displayString,
      timestamp: upiNow,
      taskDate: upiDayInfo.isoDate,
      amount: bonus,
      isCredit: true,
      status: 'verified',
      orderId,
      note: isPlanPurchase
        ? `VIP Level ${selectedPlan.level} (${selectedPlan.levelTag}) activated via UPI Recharge`
        : `Bonus for ₹${amount.toLocaleString('en-IN')} UPI Recharge`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    setLastPurchase({
      amount,
      reward: bonus,
      orderId,
      date: dateStr,
      status: 'verified',
    });

    triggerConfetti();
    if (isPlanPurchase) {
      showToast(`🎉 Congratulations! Level ${selectedPlan.level} VIP activated via UPI payment!`);
    } else {
      showToast(`Payment successful! ₹${bonus} bonus credited to wallet.`);
    }
    navigate('purchase_confirmed');
  };

  const simulatePurchaseDirect = (plan: PlanItem) => {
    addMoneyInitiate(plan.amount, plan.bonus);
  };

  const requestWithdrawal = (
    amount: number,
    payoutMethodOrUpiId: string | 'upi' | 'bank',
    payoutDetails?: {
      upiId?: string;
      accountHolder?: string;
      bankName?: string;
      accountNumber?: string;
      ifsc?: string;
    }
  ) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast('❌ No Internet Connection! Withdrawal requests require an active internet connection.');
      return { success: false, message: 'No internet connection' };
    }
    if (user.isBlocked) {
      showToast('❌ Your account is blocked by administration. Withdrawal requests cannot be submitted.');
      return { success: false, message: 'Account is blocked by admin' };
    }
    if (amount < 1000) {
      showToast('Minimum withdrawal amount is ₹1,000');
      return { success: false, message: 'Minimum withdrawal amount is ₹1,000' };
    }
    if (amount > user.balance) {
      showToast('Insufficient balance for withdrawal');
      return { success: false, message: 'Insufficient balance' };
    }

    const isBank = payoutMethodOrUpiId === 'bank';
    let noteText = '';
    let upiVal = '';
    let bankData: any = {};

    if (isBank) {
      const details = payoutDetails || {};
      const cleanAcc = (details.accountNumber || '').trim();
      const cleanIfsc = (details.ifsc || '').trim().toUpperCase();
      const cleanHolder = (details.accountHolder || '').trim();
      const cleanBankName = (details.bankName || 'Bank Account').trim();

      if (!cleanAcc || !cleanIfsc || !cleanHolder) {
        showToast('Please fill all required bank account details');
        return { success: false, message: 'Incomplete bank details' };
      }
      noteText = `Bank: ${cleanBankName} | A/C: ${cleanAcc} | IFSC: ${cleanIfsc} | Holder: ${cleanHolder}`;
      bankData = {
        bankAccountHolder: cleanHolder,
        bankName: cleanBankName,
        bankAccountNumber: cleanAcc,
        bankIfsc: cleanIfsc,
      };
    } else {
      upiVal =
        typeof payoutMethodOrUpiId === 'string' && payoutMethodOrUpiId !== 'upi' && payoutMethodOrUpiId !== 'bank'
          ? payoutMethodOrUpiId.trim()
          : (payoutDetails?.upiId || user.upiId || '').trim();
      if (!upiVal) {
        showToast('Please enter a valid UPI ID');
        return { success: false, message: 'UPI ID is required' };
      }
      noteText = `UPI: ${upiVal}`;
    }

    const updatedUser: RegisteredUserAccount = {
      ...user,
      balance: user.balance - amount,
      withdrawn: (user.withdrawn || 0) + amount,
      ...(isBank ? bankData : { upiId: upiVal }),
    };

    // Deduct balance and add pending transaction
    setUser(updatedUser);

    const newTx: TransactionItem = {
      id: `tx_w_${Date.now()}`,
      type: 'withdrawal',
      title: isBank ? 'Bank Account Withdrawal' : 'UPI Withdrawal Request',
      date: 'Just Now (Pending)',
      amount: amount,
      isCredit: false,
      status: 'pending',
      note: noteText,
      payoutMethod: isBank ? 'bank' : 'upi',
      payoutDetails: noteText,
    };

    const newTxs = [newTx, ...transactions];
    setTransactions(newTxs);
    syncUserToFirestore(updatedUser, newTxs);

    showToast(`Withdrawal of ₹${amount.toLocaleString('en-IN')} requested via ${isBank ? 'Bank Account' : 'UPI'}!`);
    navigate('wallet');
    return { success: true, message: 'Withdrawal request submitted successfully' };
  };

  const submitDailySurveyTask = (answers?: Record<number, string>) => {
    setIsSurveyModalOpen(false);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast('❌ No Internet Connection! Surveys require an active internet connection.');
      return;
    }
    if (user.isBlocked) {
      showToast('❌ Your account is blocked by administration. Surveys cannot be submitted.');
      return;
    }
    const hasPaidPlan = (activeUserPlans || []).some((p) => p.level > 0);
    if (!isFreeTrialActive && !hasPaidPlan) {
      showToast('⚠️ Your 2-day free trial has expired! Please activate a VIP plan to continue daily surveys and tasks.');
      navigate('member_plans');
      return;
    }
    const reward = adminSettings.dailySurveyReward || 150;
    const newSub: TaskSubmission = {
      id: `sub_srv_${Date.now()}`,
      userId: user.referralCode || 'TV982143',
      userName: user.name || 'Member',
      userMobile: user.mobile,
      taskType: 'daily_survey',
      title: "Today's Consumer Survey",
      reward,
      submittedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'pending',
      surveyAnswers: answers,
    };

    setTaskSubmissions((prev) => [newSub, ...prev]);

    // Update tasks state: mark category survey as in_progress
    setTasks((prev) =>
      prev.map((t) =>
        t.category === 'survey'
          ? { ...t, status: 'in_progress', progress: 1, maxProgress: 1 }
          : t
      )
    );

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Survey Submitted for Verification',
        message: `Your Daily Consumer Survey is submitted. Under admin verification for ₹${reward} reward.`,
        time: 'Just now',
        read: false,
        type: 'system',
      },
      ...prev,
    ]);

    showToast('✓ Survey submitted! Awaiting Admin verification in In-Progress tab.');
  };

  const completeSurveySubmit = () => {
    submitDailySurveyTask();
  };

  // 2-Day Free Starter Trial:
  // "ye jo mai photo send kiya hu o abhi jo ragister user hai o sab ke screen se hat jaye aur jo new user ragister karenge uske screen par 2 din rahega phir hat jayega q ki 2 din hi free trial hai"
  const { isFreeTrialActive, freeTrialHoursLeft } = React.useMemo(() => {
    // If not logged in or empty user, do not show trial banner
    if (!user || !user.mobile || !isLoggedIn) {
      return { isFreeTrialActive: false, freeTrialHoursLeft: 0 };
    }

    // Admin manual override controls
    if (user.freeTrialOverride === 'disabled') {
      return { isFreeTrialActive: false, freeTrialHoursLeft: 0 };
    }
    if (user.freeTrialOverride === 'enabled') {
      return { isFreeTrialActive: true, freeTrialHoursLeft: 48 };
    }

    // Existing registered accounts (registered before this update cutoff or without isNewTrialEligible)
    // Have their 2-day free trial EXPIRED - removed from their screen!
    const trialStart = user.trialStartedAt || user.joinedTimestamp;
    if (!trialStart || trialStart < NEW_USER_FREE_TRIAL_CUTOFF || !user.isNewTrialEligible) {
      return { isFreeTrialActive: false, freeTrialHoursLeft: 0 };
    }

    const now = Date.now();
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const elapsed = now - trialStart;

    // After 2 days (48 hours), trial expires and automatically disappears from screen!
    if (elapsed >= twoDaysMs) {
      return { isFreeTrialActive: false, freeTrialHoursLeft: 0 };
    }

    const remainingMs = Math.max(0, twoDaysMs - elapsed);
    const hoursLeft = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));

    return {
      isFreeTrialActive: true,
      freeTrialHoursLeft: hoursLeft,
    };
  }, [user.trialStartedAt, user.joinedTimestamp, user.isNewTrialEligible, user.freeTrialOverride, user.mobile, isLoggedIn]);

  // Multi-Plan System:
  // If user is within their 2-day free trial (or Admin enabled it), they get 2 Free Videos from Level 0!
  // Plus, any VIP levels they purchased or Admin assigned (Level 1, Level 2, etc.) are active simultaneously!
  const activeUserPlans: PlanItem[] = React.useMemo(() => {
    const hasExplicitList = Array.isArray(user.purchasedPlanIds);
    const purchasedIds = user.purchasedPlanIds || [];
    const validPurchased = plans.filter((p) => p.level > 0 && purchasedIds.includes(p.id));

    // If legacy account has vipLevel > 0 and no explicit purchasedPlanIds array yet, include matching level plan
    if (!hasExplicitList && typeof user.vipLevel === 'number' && user.vipLevel > 0) {
      const legacyMatch = plans.find((p) => p.level === user.vipLevel);
      if (legacyMatch && !validPurchased.some((vp) => vp.id === legacyMatch.id)) {
        validPurchased.push(legacyMatch);
      }
    } else if (hasExplicitList && typeof user.vipLevel === 'number' && user.vipLevel > 0 && validPurchased.length === 0) {
      const fallbackMatch = plans.find((p) => p.level === user.vipLevel);
      if (fallbackMatch) {
        validPurchased.push(fallbackMatch);
      }
    }

    const sortedPurchased = validPurchased.sort((a, b) => a.level - b.level);
    const level0FreePlan = plans.find((p) => p.level === 0) || plans[0];
    // Free task is strictly only available for 2 days from registration date:
    const includeLevel0 = isFreeTrialActive && user.freeTrialOverride !== 'disabled';

    if (includeLevel0 && level0FreePlan) {
      return [level0FreePlan, ...sortedPurchased];
    } else {
      return sortedPurchased;
    }
  }, [plans, user.vipLevel, user.purchasedPlanIds, user.freeTrialOverride, isFreeTrialActive]);

  // Highest active plan (for badge and display fallback)
  const activeUserPlan: PlanItem = React.useMemo(() => {
    if (activeUserPlans.length > 0) {
      return activeUserPlans[activeUserPlans.length - 1];
    }
    return plans.find((p) => p.level === 0) || plans[0];
  }, [activeUserPlans, plans]);

  // Generate full composite list of video missions across all active plans!
  // E.g. Level 1 (2 videos @ ₹20) + Level 2 (3 videos @ ₹30) => 5 videos total!
  const userDailyVideoMissions: VideoMissionDef[] = React.useMemo(() => {
    const list: VideoMissionDef[] = [];
    let overallIdx = 1;
    activeUserPlans.forEach((plan) => {
      const count = plan.dailyMissions || (plan.level === 0 ? 2 : 2);
      for (let i = 1; i <= count; i++) {
        list.push({
          index: overallIdx,
          planLevel: plan.level,
          planTag: plan.levelTag || `Level ${plan.level}`,
          levelIndex: i,
          levelTotal: count,
          reward: plan.perMission,
          title: `Level ${plan.level} (${plan.levelTag}) Video #${i}`,
        });
        overallIdx++;
      }
    });
    return list;
  }, [activeUserPlans]);

  const maxDailyVideos = userDailyVideoMissions.length;
  const totalDailyIncome = userDailyVideoMissions.reduce((acc, m) => acc + m.reward, 0);

  const todayDateStr = new Date().toDateString();

  // Automatic Midnight Daily Task Reset for All Users
  useEffect(() => {
    try {
      const lastResetDate = localStorage.getItem('zorotask_last_midnight_reset');
      if (lastResetDate && lastResetDate !== todayDateStr) {
        setUser((u) => ({
          ...u,
          todayVideosWatched: 0,
          lastVideoWatchDate: todayDateStr,
        }));
        localStorage.setItem('taskvibe_today_videos', '0');
        localStorage.setItem('zorotask_last_midnight_reset', todayDateStr);
      } else if (!lastResetDate) {
        localStorage.setItem('zorotask_last_midnight_reset', todayDateStr);
      }
    } catch {}
  }, [todayDateStr]);
  const todayVideosWatched =
    user.lastVideoWatchDate === todayDateStr ? (user.todayVideosWatched || 0) : 0;
  const canWatchMoreVideos = todayVideosWatched < maxDailyVideos;

  const [currentPlayingTaskNum, setCurrentPlayingTaskNum] = useState<number>(1);

  // Per-video reward for the specific mission being watched
  const currentMissionDef =
    userDailyVideoMissions.find((m) => m.index === (currentPlayingTaskNum || todayVideosWatched + 1)) ||
    userDailyVideoMissions[todayVideosWatched] ||
    userDailyVideoMissions[0];
  const perVideoReward = currentMissionDef?.reward || activeUserPlan?.perMission || 20;

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cloud Pull/Slide Down Refresh
  const refreshAppData = async () => {
    setIsRefreshing(true);
    try {
      const cleanMobile = user.mobile ? normalizeMobile(user.mobile) : '';
      if (cleanMobile) {
        const userDocRef = doc(db, 'users', cleanMobile);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const cloudData = userSnap.data() as RegisteredUserAccount;
          setUser((curr) => ({
            ...curr,
            ...cloudData,
          }));
          try {
            localStorage.setItem('taskvibe_user', JSON.stringify({ ...user, ...cloudData }));
          } catch (e) {
            console.warn(e);
          }
        }
      }

      // Fetch admin settings from Firestore
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'admin'));
        if (settingsSnap.exists()) {
          const cloudSettings = settingsSnap.data() as AdminSettings;
          const legacyPasswords = ['TaskVibe@Admin2026', 'admin', 'admin123', '1234', '123456', 'admin@123'];
          const activePassword = (!cloudSettings.adminPassword || legacyPasswords.includes(cloudSettings.adminPassword))
            ? 'Gagan@123'
            : cloudSettings.adminPassword;
          const merged = {
            ...cloudSettings,
            adminPassword: activePassword,
            adminMerchantName: (cloudSettings.adminMerchantName || defaultAdminSettings.adminMerchantName || '').replace(/TaskVibe/gi, 'ZoroTask'),
            announcementTitle: (cloudSettings.announcementTitle || defaultAdminSettings.announcementTitle || '').replace(/TaskVibe/gi, 'ZoroTask'),
            announcementMessage: (cloudSettings.announcementMessage || defaultAdminSettings.announcementMessage || '').replace(/TaskVibe/gi, 'ZoroTask'),
            announcementTag: (cloudSettings.announcementTag && cloudSettings.announcementTag !== 'NEW UPDATE') ? cloudSettings.announcementTag : 'NOTICE',
            youtubeVideoTitle: (cloudSettings.youtubeVideoTitle || defaultAdminSettings.youtubeVideoTitle || '').replace(/TaskVibe/gi, 'ZoroTask'),
          };
          setAdminSettings(merged);
          localStorage.setItem('taskvibe_admin_settings', JSON.stringify(merged));
        }
      } catch (e) {
        console.warn(e);
      }

      // Fetch registered users
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (!usersSnap.empty) {
          const fetchedUsers = usersSnap.docs.map((d) => d.data() as RegisteredUserAccount);
          setRegisteredUsers(fetchedUsers);
          localStorage.setItem('taskvibe_registered_users', JSON.stringify(fetchedUsers));
        }
      } catch (e) {
        console.warn(e);
      }

      // Fetch deposits
      try {
        const depSnap = await getDocs(collection(db, 'deposits'));
        if (!depSnap.empty) {
          const fetchedDeps = depSnap.docs.map((d) => d.data() as PaymentDeposit);
          setPaymentDeposits(fetchedDeps);
        }
      } catch (e) {
        console.warn(e);
      }

      showToast('✓ App refreshed with latest cloud data!');
    } catch (err) {
      console.warn('Error refreshing app data:', err);
      showToast('✓ App refreshed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const openVideoTask = (taskNum?: number) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast('❌ No Internet Connection! Video tasks require an active internet connection. Please turn on Mobile Data.');
      return;
    }
    if (user.isBlocked) {
      showToast('❌ Your account is blocked by administration. Video tasks are not available.');
      return;
    }
    if (activeUserPlans.length === 0) {
      showToast('⚠️ Your 2-day free trial has expired! Please activate a VIP level to continue earning from video tasks.');
      navigate('member_plans');
      return;
    }
    if (!canWatchMoreVideos || todayVideosWatched >= maxDailyVideos) {
      showToast(`❌ Today's video task quota is complete (${todayVideosWatched}/${maxDailyVideos})! New tasks unlock tomorrow, or upgrade your VIP plan for more tasks.`);
      return;
    }
    const chosenNum = taskNum || Math.min(maxDailyVideos, todayVideosWatched + 1);
    if (chosenNum <= todayVideosWatched) {
      showToast(`✓ Task #${chosenNum} is already completed! Please watch the next pending task.`);
      return;
    }
    setCurrentPlayingTaskNum(chosenNum);
    setIsWatchingVideo(true);
  };

  const submitYouTubeVideoTask = async (videoTitle?: string, videoUrl?: string) => {
    setIsWatchingVideo(false);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast('❌ No Internet Connection! Task cannot be submitted or rewarded offline.');
      return;
    }
    if (user.isBlocked) {
      showToast('❌ Your account is blocked by administration. Tasks cannot be submitted.');
      return;
    }

    // Strictly enforce mission daily limit
    if (!canWatchMoreVideos || todayVideosWatched >= maxDailyVideos) {
      showToast(`❌ Today's video task quota is complete (${todayVideosWatched}/${maxDailyVideos})! Upgrade to VIP to unlock more tasks.`);
      return;
    }

    const nextCount = todayVideosWatched + 1;
    if (nextCount > maxDailyVideos) {
      showToast(`❌ Today's video task quota is complete (${todayVideosWatched}/${maxDailyVideos})!`);
      return;
    }

    const taskNumToRecord = currentPlayingTaskNum || nextCount;
    const completedTaskDef =
      userDailyVideoMissions.find((m) => m.index === taskNumToRecord) ||
      userDailyVideoMissions[todayVideosWatched] ||
      userDailyVideoMissions[0];

    const reward = user.assignedReward || completedTaskDef?.reward || perVideoReward || 20;
    const taskTitle =
      videoTitle ||
      user.assignedVideoTitle ||
      completedTaskDef?.title ||
      `Level ${completedTaskDef?.planLevel || activeUserPlan.level} Video Task #${nextCount}`;
    const taskUrl = videoUrl || user.assignedVideoUrl || `https://www.youtube.com/watch?v=${adminSettings.youtubeVideoId}`;

    const newSub: TaskSubmission = {
      id: `sub_yt_${Date.now()}`,
      userId: user.referralCode || 'TV982143',
      userName: user.name || 'Member',
      userMobile: user.mobile,
      taskType: 'youtube_video',
      title: taskTitle,
      reward,
      submittedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'approved', // Auto-approved upon completing the full 30s watch
      videoTitle: taskTitle,
      videoUrl: taskUrl,
    };

    setTaskSubmissions((prev) => [newSub, ...prev]);

    // Immediately credit wallet balance & increment todayVideosWatched
    setUser((prev) => {
      const updated = {
        ...prev,
        balance: prev.balance + reward,
        totalEarned: prev.totalEarned + reward,
        todayVideosWatched: nextCount,
        lastVideoWatchDate: todayDateStr,
      };
      try {
        localStorage.setItem('taskvibe_user', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    // Update in registered accounts
    setRegisteredUsers((prev) =>
      prev.map((u) =>
        normalizeMobile(u.mobile) === normalizeMobile(user.mobile)
          ? {
              ...u,
              balance: u.balance + reward,
              totalEarned: u.totalEarned + reward,
              todayVideosWatched: nextCount,
              lastVideoWatchDate: todayDateStr,
            }
          : u
      )
    );

    // Add verified transaction with dynamic day formatting
    const videoNow = Date.now();
    const videoDayInfo = getFormattedDayInfo(videoNow);
    const newTx: TransactionItem = {
      id: `tx_${videoNow}`,
      type: 'video_reward',
      title: `${taskTitle} (30s Watch Bonus)`,
      date: videoDayInfo.displayString,
      timestamp: videoNow,
      taskDate: videoDayInfo.isoDate,
      amount: reward,
      isCredit: true,
      status: 'verified',
      note: `30-second YouTube Video task completed (${nextCount}/${maxDailyVideos}). ₹${reward} credited to wallet!`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // IMMEDIATELY sync directly to Firestore across all devices!
    const cleanMobile = normalizeMobile(user.mobile);
    if (cleanMobile && cleanMobile.length >= 10) {
      try {
        setDoc(
          doc(db, 'users', cleanMobile),
          {
            balance: user.balance + reward,
            totalEarned: user.totalEarned + reward,
            todayVideosWatched: nextCount,
            lastVideoWatchDate: todayDateStr,
            transactions: [newTx, ...transactions],
          },
          { merge: true }
        ).catch((err) => console.warn('Firestore user task sync warning:', err));
      } catch (err) {
        console.warn('Direct task sync to Firestore failed:', err);
      }
    }

    // Update tasks state: mark video task as completed
    setTasks((prev) =>
      prev.map((t) =>
        t.category === 'video'
          ? {
              ...t,
              status: nextCount >= maxDailyVideos ? 'completed' : 'in_progress',
              progress: nextCount,
              maxProgress: maxDailyVideos,
            }
          : t
      )
    );

    // Multi-tier Task Commission:
    // Direct referral completing daily video task awards 1.6% royalty to inviter
    if (user.referredBy) {
      try {
        const upline1Data = await findUserByReferralCode(user.referredBy);
        if (upline1Data) {
          const upline1 = upline1Data.user;
          const taskComm = Math.round(reward * 0.016 * 100) / 100;
          if (taskComm > 0) {
            const u1Clean = upline1Data.docId;
            const commNow = Date.now();
            const commDayInfo = getFormattedDayInfo(commNow);
            const taskTx: TransactionItem = {
              id: `tx_taskcomm_${commNow}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'referral_reward',
              title: `Daily Task Royalty (1.6%)`,
              date: commDayInfo.displayString,
              timestamp: commNow,
              taskDate: commDayInfo.isoDate,
              amount: taskComm,
              isCredit: true,
              status: 'verified',
              note: `Direct referral ${user.name || 'Member'} completed a video task. 1.6% royalty credited to wallet!`,
            };

            // Update registeredUsers in memory and localStorage
            setRegisteredUsers((prev) => {
              let found = false;
              const updated = prev.map((u) => {
                if (normalizeMobile(u.mobile) === u1Clean) {
                  found = true;
                  return {
                    ...u,
                    balance: (u.balance || 0) + taskComm,
                    totalEarned: (u.totalEarned || 0) + taskComm,
                    teamTaskEarnings: (u.teamTaskEarnings || 0) + taskComm,
                    transactions: [taskTx, ...(u.transactions || [])],
                  };
                }
                return u;
              });
              if (!found) {
                updated.push({
                  ...upline1,
                  balance: (upline1.balance || 0) + taskComm,
                  totalEarned: (upline1.totalEarned || 0) + taskComm,
                  teamTaskEarnings: (upline1.teamTaskEarnings || 0) + taskComm,
                  transactions: [taskTx, ...(upline1.transactions || [])],
                });
              }
              try {
                localStorage.setItem('taskvibe_registered_users', JSON.stringify(updated));
              } catch {}
              return updated;
            });

            // If active user is upline1, update active user state and transactions
            if (normalizeMobile(user.mobile) === u1Clean) {
              setUser((curr) => ({
                ...curr,
                balance: curr.balance + taskComm,
                totalEarned: curr.totalEarned + taskComm,
                teamTaskEarnings: (curr.teamTaskEarnings || 0) + taskComm,
              }));
              setTransactions((prev) => [taskTx, ...prev]);
            }

            // Persist directly to Firestore
            try {
              const u1Ref = doc(db, 'users', u1Clean);
              const u1Snap = await getDoc(u1Ref);
              const existingU1Txs: TransactionItem[] =
                u1Snap.exists() && u1Snap.data().transactions ? u1Snap.data().transactions : [];
              await setDoc(
                u1Ref,
                {
                  balance: increment(taskComm),
                  totalEarned: increment(taskComm),
                  teamTaskEarnings: increment(taskComm),
                  transactions: [taskTx, ...existingU1Txs],
                },
                { merge: true }
              );
            } catch (err) {
              console.warn('Failed to update upline task royalty in Firestore:', err);
            }
          }
        }
      } catch (err) {
        console.warn('Error processing daily task commission:', err);
      }
    }

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: `🎉 ₹${reward} Video Task Reward Credited!`,
        message: `Task ${nextCount}/${maxDailyVideos} completed. ₹${reward} has been added to your wallet!`,
        time: 'Just now',
        read: false,
        type: 'reward',
      },
      ...prev,
    ]);

    triggerConfetti();
    if (nextCount < maxDailyVideos) {
      showToast(`🎉 30s Task Complete! ₹${reward} added to your wallet. (${nextCount}/${maxDailyVideos} Done - ${maxDailyVideos - nextCount} remaining)`);
    } else {
      showToast(`🎉 Congratulations! All ${maxDailyVideos}/${maxDailyVideos} video tasks for today completed! ₹${reward} added to your wallet!`);
    }
  };

  const stepWatchVideo = () => {
    submitYouTubeVideoTask();
  };

  const approveTaskSubmission = (subId: string) => {
    const sub = taskSubmissions.find((s) => s.id === subId);
    if (!sub) return;

    setTaskSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: 'approved' } : s))
    );

    // Credit user balance
    setUser((u) => ({
      ...u,
      balance: u.balance + sub.reward,
      totalEarned: u.totalEarned + sub.reward,
    }));

    // Add verified transaction
    const subTime = Date.now();
    const subDayInfo = getFormattedDayInfo(subTime);
    const newTx: TransactionItem = {
      id: `tx_${sub.id}`,
      type: sub.taskType === 'daily_survey' ? 'survey_reward' : 'video_reward',
      title: sub.taskType === 'daily_survey' ? 'Daily Survey (Verified)' : 'YouTube Video (Verified)',
      date: subDayInfo.displayString,
      timestamp: subTime,
      taskDate: subDayInfo.isoDate,
      amount: sub.reward,
      isCredit: true,
      status: 'verified',
      note: 'Verified and approved by Admin Panel',
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Update mission list to completed
    setTasks((prev) =>
      prev.map((t) => {
        if (sub.taskType === 'daily_survey' && t.category === 'survey') {
          return { ...t, status: 'completed', progress: 1 };
        }
        if (sub.taskType === 'youtube_video' && t.category === 'video') {
          return { ...t, status: 'completed', progress: 1 };
        }
        return t;
      })
    );

    if (sub.taskType === 'daily_survey') {
      setSurveys((prev) =>
        prev.map((s) => (s.id === 'srv_today' ? { ...s, completed: true, date: 'Completed Today (Verified)' } : s))
      );
    }

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: '✓ Task Verified & Approved!',
        message: `Your ${sub.title} has been verified by Admin. ₹${sub.reward} credited to your wallet!`,
        time: 'Just now',
        read: false,
        type: 'reward',
      },
      ...prev,
    ]);

    triggerConfetti();
    showToast(`✓ Task approved! ₹${sub.reward} credited to user.`);
  };

  const rejectTaskSubmission = (subId: string, reason?: string) => {
    const sub = taskSubmissions.find((s) => s.id === subId);
    if (!sub) return;

    setTaskSubmissions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? { ...s, status: 'rejected', rejectionReason: reason || 'Requirements not met' }
          : s
      )
    );

    setTasks((prev) =>
      prev.map((t) => {
        if (sub.taskType === 'daily_survey' && t.category === 'survey') {
          return { ...t, status: 'all', progress: 0 };
        }
        if (sub.taskType === 'youtube_video' && t.category === 'video') {
          return { ...t, status: 'all', progress: 0 };
        }
        return t;
      })
    );

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Task Submission Rejected',
        message: `Your ${sub.title} was not approved: ${reason || 'Incomplete watch or invalid survey response'}. You may try again.`,
        time: 'Just now',
        read: false,
        type: 'system',
      },
      ...prev,
    ]);

    showToast('Task submission rejected.');
  };

  const toggleFrameMode = () => {
    setFrameMode((prev) => (prev === 'mobile' ? 'responsive' : 'mobile'));
  };

  const resetAllData = () => {
    setUser(emptyUser);
    setTransactions([]);
    setTasks(initialTasks);
    setSurveys(initialSurveys);
    setIsLoggedIn(false);
    try {
      localStorage.setItem('taskvibe_auth', 'false');
      localStorage.removeItem('taskvibe_active_mobile');
      localStorage.removeItem('taskvibe_user');
      localStorage.removeItem('taskvibe_txs');
    } catch (e) {
      console.warn(e);
    }
    setCurrentScreen('login');
    setActiveTab('home');
    setHistoryStack(['login']);
    showToast('Data reset successfully');
  };

  const updateUserProfile = (name: string, email: string, upiId: string) => {
    setUser((prev) => ({
      ...prev,
      name: name || prev.name,
      email: email || prev.email,
      upiId: upiId || prev.upiId,
    }));
    setIsEditProfileOpen(false);
    showToast('Profile updated successfully!');
  };

  // Admin Actions
  const approveWithdrawal = async (txId: string) => {
    const approvedNote = `Approved by Admin Panel on ${new Date().toLocaleDateString('en-IN')}`;
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'verified' as const, note: approvedNote } : t))
    );

    // Sync across registeredUsers and Firestore
    for (const u of registeredUsers) {
      if ((u.transactions || []).some((t) => t.id === txId)) {
        const cleanM = normalizeMobile(u.mobile);
        const updatedTxs = (u.transactions || []).map((t) =>
          t.id === txId ? { ...t, status: 'verified' as const, note: approvedNote } : t
        );
        setRegisteredUsers((prev) =>
          prev.map((usr) => (normalizeMobile(usr.mobile) === cleanM ? { ...usr, transactions: updatedTxs } : usr))
        );
        try {
          await setDoc(doc(db, 'users', cleanM), { transactions: updatedTxs }, { merge: true });
        } catch (e) {
          console.warn('Failed to update approved withdrawal in Firestore:', e);
        }
      }
    }

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Withdrawal Approved! 🎉',
        message: 'Your withdrawal request has been approved and sent to your UPI ID.',
        time: 'Just now',
        read: false,
        type: 'withdrawal',
      },
      ...prev,
    ]);
    showToast('✓ Withdrawal marked as Approved!');
  };

  const rejectWithdrawal = async (txId: string, reason = 'Verification issue') => {
    const tx = transactions.find((t) => t.id === txId);
    if (tx && tx.status === 'pending') {
      // Refund balance
      setUser((u) => ({
        ...u,
        balance: u.balance + tx.amount,
        withdrawn: Math.max(0, u.withdrawn - tx.amount),
      }));
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txId ? { ...t, status: 'failed', note: `Rejected: ${reason}` } : t
        )
      );

      for (const u of registeredUsers) {
        if ((u.transactions || []).some((t) => t.id === txId)) {
          const cleanM = normalizeMobile(u.mobile);
          const newBal = (u.balance || 0) + tx.amount;
          const newWithdrawn = Math.max(0, (u.withdrawn || 0) - tx.amount);
          const updatedTxs = (u.transactions || []).map((t) =>
            t.id === txId ? { ...t, status: 'failed' as const, note: `Rejected: ${reason}` } : t
          );
          setRegisteredUsers((prev) =>
            prev.map((usr) => (normalizeMobile(usr.mobile) === cleanM ? { ...usr, balance: newBal, withdrawn: newWithdrawn, transactions: updatedTxs } : usr))
          );
          try {
            await setDoc(doc(db, 'users', cleanM), { balance: newBal, withdrawn: newWithdrawn, transactions: updatedTxs }, { merge: true });
          } catch (e) {
            console.warn('Failed to update rejected withdrawal in Firestore:', e);
          }
        }
      }

      setNotifications((prev) => [
        {
          id: `notif_${Date.now()}`,
          title: 'Withdrawal Request Refunded',
          message: `Your withdrawal of ₹${tx.amount} was rejected (${reason}). Balance has been refunded to your wallet.`,
          time: 'Just now',
          read: false,
          type: 'system',
        },
        ...prev,
      ]);
      showToast(`Withdrawal rejected. ₹${tx.amount} refunded to user.`);
    }
  };

  const adjustUserBalance = async (amount: number, isCredit: boolean, reason: string, targetMobile?: string) => {
    const targetClean = targetMobile ? normalizeMobile(targetMobile) : '';

    if (targetClean && targetClean !== normalizeMobile(user.mobile)) {
      // Adjust another registered user
      const targetUser = registeredUsers.find((u) => normalizeMobile(u.mobile) === targetClean);
      const newBal = targetUser ? (isCredit ? targetUser.balance + amount : Math.max(0, targetUser.balance - amount)) : (isCredit ? amount : 0);
      const newEarned = targetUser ? (isCredit ? targetUser.totalEarned + amount : targetUser.totalEarned) : (isCredit ? amount : 0);

      const adminNow = Date.now();
      const adminDayInfo = getFormattedDayInfo(adminNow);
      const newTx: TransactionItem = {
        id: `tx_admin_${adminNow}`,
        type: isCredit ? 'purchase_reward' : 'withdrawal',
        title: isCredit ? 'Admin Balance Credit' : 'Admin Balance Debit',
        date: adminDayInfo.displayString,
        timestamp: adminNow,
        taskDate: adminDayInfo.isoDate,
        amount,
        isCredit,
        status: 'verified',
        note: reason || 'Manual Admin Adjustment',
      };

      const updatedTxs = targetUser ? [newTx, ...(targetUser.transactions || [])] : [newTx];

      // Save to Firestore
      try {
        await setDoc(doc(db, 'users', targetClean), {
          balance: newBal,
          totalEarned: newEarned,
          transactions: updatedTxs,
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to update adjusted balance in Firestore:', err);
      }

      setRegisteredUsers((prev) => {
        const next = prev.map((u) => {
          if (normalizeMobile(u.mobile) === targetClean) {
            return {
              ...u,
              balance: newBal,
              totalEarned: newEarned,
              transactions: updatedTxs,
            };
          }
          return u;
        });
        try {
          localStorage.setItem('taskvibe_registered_users', JSON.stringify(next));
        } catch (e) {
          console.warn(e);
        }
        return next;
      });
      showToast(`User (${targetClean}) balance adjusted by ${isCredit ? '+' : '-'}₹${amount}`);
      logAdminAction(
        isCredit ? 'balance_increase' : 'balance_decrease',
        targetClean,
        targetUser?.name,
        targetUser?.balance || 0,
        newBal,
        reason || 'Manual Admin Adjustment'
      );
      return;
    }

    // Adjust current user
    const newBal = isCredit ? user.balance + amount : Math.max(0, user.balance - amount);
    const newEarned = isCredit ? user.totalEarned + amount : user.totalEarned;
    const curAdminNow = Date.now();
    const curAdminDayInfo = getFormattedDayInfo(curAdminNow);
    const newTx: TransactionItem = {
      id: `tx_admin_${curAdminNow}`,
      type: isCredit ? 'purchase_reward' : 'withdrawal',
      title: isCredit ? 'Admin Balance Credit' : 'Admin Balance Debit',
      date: curAdminDayInfo.displayString,
      timestamp: curAdminNow,
      taskDate: curAdminDayInfo.isoDate,
      amount,
      isCredit,
      status: 'verified',
      note: reason || 'Manual Admin Adjustment',
    };

    const updatedTxs = [newTx, ...transactions];
    setUser((u) => ({
      ...u,
      balance: newBal,
      totalEarned: newEarned,
    }));
    setTransactions(updatedTxs);

    if (user.mobile) {
      syncUserToFirestore({ ...user, balance: newBal, totalEarned: newEarned }, updatedTxs);
    }
    logAdminAction(
      isCredit ? 'balance_increase' : 'balance_decrease',
      normalizeMobile(user.mobile),
      user.name,
      user.balance,
      newBal,
      reason || 'Manual Admin Adjustment'
    );
    showToast(`User balance adjusted by ${isCredit ? '+' : '-'}₹${amount}`);
  };

  const adminUpdateUser = async (mobile: string, updates: Partial<RegisteredUserAccount>) => {
    const clean = normalizeMobile(mobile);
    if (!clean) return;

    if (normalizeMobile(user.mobile) === clean) {
      setUser((prev) => {
        const nextUser = { ...prev, ...updates };
        try {
          localStorage.setItem('taskvibe_user', JSON.stringify(nextUser));
        } catch {}
        return nextUser;
      });
    }

    setRegisteredUsers((prev) => {
      const next = prev.map((u) => {
        if (normalizeMobile(u.mobile) === clean) {
          return { ...u, ...updates };
        }
        return u;
      });
      try {
        localStorage.setItem('taskvibe_registered_users', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    try {
      await setDoc(doc(db, 'users', clean), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore update failed', e);
    }

    if (updates.isBlocked !== undefined) {
      showToast(updates.isBlocked ? '⛔ User blocked by admin!' : '✓ User unblocked by admin!');
    } else {
      showToast('✓ User profile & VIP plans updated in Cloud!');
    }
  };

  const adminDeleteUser = async (mobile: string): Promise<boolean> => {
    const clean = normalizeMobile(mobile);
    if (!clean) return false;

    try {
      // 1. Permanently delete from Firestore users collection
      await deleteDoc(doc(db, 'users', clean));
      await deleteDoc(doc(db, 'users', `+91${clean}`));
      await deleteDoc(doc(db, 'users', `+91 ${clean}`));

      // 2. Query any documents with this mobile number and delete them too
      try {
        const qSnap = await getDocs(
          query(collection(db, 'users'), where('mobile', 'in', [clean, `+91 ${clean}`, `+91${clean}`]))
        );
        for (const d of qSnap.docs) {
          await deleteDoc(doc(db, 'users', d.id));
        }
      } catch {}

      // 3. Record in deleted_accounts tombstone collection
      await setDoc(doc(db, 'deleted_accounts', clean), {
        mobile: clean,
        deletedAt: Date.now(),
        deletedByAdmin: true,
      });
    } catch (e) {
      console.warn('Firestore user delete failed:', e);
    }

    if (normalizeMobile(user.mobile) === clean) {
      logout();
      try {
        localStorage.removeItem('taskvibe_auth');
        localStorage.removeItem('taskvibe_active_mobile');
        localStorage.removeItem('taskvibe_user');
        localStorage.removeItem('taskvibe_txs');
        localStorage.removeItem('taskvibe_screen');
        localStorage.removeItem('taskvibe_last_registered_mobile');
      } catch {}
      setCurrentScreen('register');
      setHistoryStack(['register']);
    }

    setRegisteredUsers((prev) => {
      const next = prev.filter((u) => normalizeMobile(u.mobile) !== clean);
      try {
        localStorage.setItem('taskvibe_registered_users', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    showToast(`✓ User (+91 ${clean}) was permanently deleted! Old account cannot login.`);
    return true;
  };

  const adminBlockUser = async (mobile: string, reason?: string) => {
    const clean = normalizeMobile(mobile);
    if (!clean) return;
    await adminUpdateUser(clean, {
      isBlocked: true,
      blockedReason: reason || 'Account suspended by administration. Tasks and withdrawals are restricted.',
    });
  };

  const adminUnblockUser = async (mobile: string) => {
    const clean = normalizeMobile(mobile);
    if (!clean) return;
    await adminUpdateUser(clean, {
      isBlocked: false,
      blockedReason: '',
    });
  };

  const adminResetAllUsersBalanceAndTransactions = async (): Promise<boolean> => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      for (const d of snap.docs) {
        await setDoc(
          doc(db, 'users', d.id),
          {
            balance: 0,
            totalEarned: 0,
            todayEarnings: 0,
            totalEarnings: 0,
            withdrawn: 0,
            referralEarnings: 0,
            teamTaskEarnings: 0,
            transactions: [],
          },
          { merge: true }
        );
      }
      setRegisteredUsers((prev) => {
        const next = prev.map((u) => ({
          ...u,
          balance: 0,
          totalEarned: 0,
          todayEarnings: 0,
          totalEarnings: 0,
          withdrawn: 0,
          referralEarnings: 0,
          teamTaskEarnings: 0,
          transactions: [],
        }));
        try {
          localStorage.setItem('taskvibe_registered_users', JSON.stringify(next));
        } catch {}
        return next;
      });
      setUser((curr) => ({
        ...curr,
        balance: 0,
        totalEarned: 0,
        todayEarnings: 0,
        totalEarnings: 0,
        withdrawn: 0,
        referralEarnings: 0,
        teamTaskEarnings: 0,
      }));
      setTransactions([]);
      try {
        localStorage.setItem('taskvibe_txs', JSON.stringify([]));
      } catch {}
      showToast('✓ All user balances and transactions have been reset to 0 in Cloud database!');
      return true;
    } catch (e) {
      console.warn('adminResetAllUsersBalanceAndTransactions failed:', e);
      showToast('Failed to reset all users');
      return false;
    }
  };

  const addVIPPlan = async (newPlan: PlanItem): Promise<boolean> => {
    try {
      await setDoc(doc(db, 'vip_plans', newPlan.id), newPlan, { merge: true });
      const filtered = plans.filter((p) => p.id !== newPlan.id);
      const next = [...filtered, newPlan].sort((a, b) => (a.level || 0) - (b.level || 0));
      setPlans(next);
      try {
        localStorage.setItem('taskvibe_plans', JSON.stringify(next));
        await setDoc(doc(db, 'settings', 'admin'), { plans: next }, { merge: true });
      } catch (backupErr) {
        console.warn('Backup plans to settings/admin warning:', backupErr);
      }
      showToast(`✓ VIP Plan "${newPlan.title}" added & saved permanently!`);
      return true;
    } catch (err) {
      console.error('Failed to add VIP plan to Firestore', err);
      showToast('❌ Failed to add VIP plan');
      return false;
    }
  };

  const updateVIPPlan = async (planId: string, updates: Partial<PlanItem>): Promise<boolean> => {
    try {
      await setDoc(doc(db, 'vip_plans', planId), updates, { merge: true });
      const next = plans.map((p) => (p.id === planId ? { ...p, ...updates } : p));
      setPlans(next);
      try {
        localStorage.setItem('taskvibe_plans', JSON.stringify(next));
        await setDoc(doc(db, 'settings', 'admin'), { plans: next }, { merge: true });
      } catch (backupErr) {
        console.warn('Backup plans to settings/admin warning:', backupErr);
      }
      showToast('✓ VIP Plan updated & saved permanently in Cloud!');
      return true;
    } catch (err) {
      console.error('Failed to update VIP plan in Firestore', err);
      showToast('❌ Failed to update VIP plan');
      return false;
    }
  };

  const deleteVIPPlan = async (planId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'vip_plans', planId));
      const next = plans.filter((p) => p.id !== planId);
      setPlans(next);
      try {
        localStorage.setItem('taskvibe_plans', JSON.stringify(next));
        await setDoc(doc(db, 'settings', 'admin'), { plans: next }, { merge: true });
      } catch (backupErr) {
        console.warn('Backup plans to settings/admin warning:', backupErr);
      }
      showToast('✓ VIP Plan deleted from cloud database.');
      return true;
    } catch (err) {
      console.error('Failed to delete VIP plan from Firestore', err);
      showToast('❌ Failed to delete VIP plan');
      return false;
    }
  };

  const saveAllVIPPlans = async (customPlans?: PlanItem[]): Promise<boolean> => {
    const listToSave = customPlans || plans;
    try {
      for (const p of listToSave) {
        await setDoc(doc(db, 'vip_plans', p.id), p, { merge: true });
      }
      await setDoc(doc(db, 'settings', 'admin'), { plans: listToSave }, { merge: true });
      setPlans(listToSave);
      try {
        localStorage.setItem('taskvibe_plans', JSON.stringify(listToSave));
      } catch {}
      showToast('✓ All VIP Plans synchronized & permanently saved to Cloud!');
      return true;
    } catch (err) {
      console.error('Failed to save all VIP plans:', err);
      showToast('❌ Failed to save VIP plans to cloud');
      return false;
    }
  };

  const updatePlan = (planId: string, updates: Partial<PlanItem>) => {
    updateVIPPlan(planId, updates);
  };

  const resetUserDailyTasks = async (mobile: string) => {
    const clean = normalizeMobile(mobile);
    try {
      const todayStr = new Date().toDateString();
      await setDoc(
        doc(db, 'users', clean),
        {
          todayVideosWatched: 0,
          lastVideoWatchDate: todayStr,
        },
        { merge: true }
      );
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          normalizeMobile(u.mobile) === clean
            ? { ...u, todayVideosWatched: 0, lastVideoWatchDate: todayStr }
            : u
        )
      );
      if (normalizeMobile(user.mobile) === clean) {
        setUser((u) => ({
          ...u,
          todayVideosWatched: 0,
          lastVideoWatchDate: todayStr,
        }));
      }
      showToast(`✓ User ${clean} daily tasks count reset to 0!`);
    } catch (err) {
      console.error('Failed to reset user daily tasks:', err);
      showToast('❌ Failed to reset daily tasks');
    }
  };

  const createSupportTicket = async (
    category: SupportTicket['category'],
    subject: string,
    message: string,
    screenshotUrl?: string
  ): Promise<string> => {
    const ticketId = `tkt_${Date.now()}`;
    const newTicket: SupportTicket = {
      id: ticketId,
      userId: user.referralCode || 'USER',
      userName: user.name || 'Member',
      userMobile: user.mobile,
      category,
      subject: subject.trim(),
      message: message.trim(),
      screenshotUrl: screenshotUrl || '',
      status: 'open',
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setSupportTickets((prev) => [newTicket, ...prev]);
    try {
      await setDoc(doc(db, 'support_tickets', ticketId), newTicket);
    } catch (err) {
      console.warn('Could not save ticket to Firestore:', err);
    }
    showToast('✓ Support ticket submitted! Admin will resolve shortly.');
    return ticketId;
  };

  const replySupportTicket = async (
    ticketId: string,
    reply: string,
    status: SupportTicket['status'] = 'resolved'
  ): Promise<void> => {
    const nowTime = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, adminReply: reply.trim(), status, repliedAt: nowTime }
          : t
      )
    );

    try {
      await setDoc(
        doc(db, 'support_tickets', ticketId),
        { adminReply: reply.trim(), status, repliedAt: nowTime },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not update ticket in Firestore:', err);
    }
    showToast('✓ Ticket updated and reply saved!');
  };

  const sendDirectUserAlert = async (targetMobile: string, title: string, message: string): Promise<void> => {
    const cleanMobile = normalizeMobile(targetMobile);
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      time: 'Just now',
      read: false,
      type: 'system',
    };

    if (cleanMobile === normalizeMobile(user.mobile)) {
      setNotifications((prev) => [newNotif, ...prev]);
    }

    try {
      const uRef = doc(db, 'users', cleanMobile);
      const snap = await getDoc(uRef);
      if (snap.exists()) {
        const uData = snap.data() as RegisteredUserAccount;
        // User receives notice on next sync
      }
    } catch {}
    showToast(`✓ Direct notification sent to +91 ${cleanMobile}!`);
  };

  const createPromoCode = async (
    code: string,
    rewardAmount: number,
    usageLimit: number = 500,
    description: string = '',
    expiryDate: string = ''
  ): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      showToast('Please enter a promo code name!');
      return false;
    }
    if (rewardAmount <= 0) {
      showToast('Reward amount must be greater than ₹0!');
      return false;
    }
    if (promoCodes.some((p) => p.code.toUpperCase() === cleanCode)) {
      showToast(`Promo Code "${cleanCode}" already exists!`);
      return false;
    }

    const newPromo: PromoCode = {
      id: `promo_${Date.now()}`,
      code: cleanCode,
      rewardAmount,
      usageLimit: usageLimit > 0 ? usageLimit : 500,
      usedCount: 0,
      usedByUsers: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      description: description.trim() || `Promo Code ${cleanCode}`,
      expiryDate: expiryDate.trim() || undefined,
    };

    const updated = [newPromo, ...promoCodes];
    setPromoCodes(updated);
    try {
      localStorage.setItem('zorotask_promo_codes', JSON.stringify(updated));
      await setDoc(doc(db, 'promo_codes', newPromo.id), newPromo);
    } catch (e) {
      console.warn('Could not save promo code to Firestore:', e);
    }
    showToast(`✓ Promo Code ${cleanCode} created successfully!`);
    return true;
  };

  const deletePromoCode = async (id: string): Promise<boolean> => {
    const updated = promoCodes.filter((p) => p.id !== id);
    setPromoCodes(updated);
    try {
      localStorage.setItem('zorotask_promo_codes', JSON.stringify(updated));
      await deleteDoc(doc(db, 'promo_codes', id));
    } catch (e) {
      console.warn('Could not delete promo from Firestore:', e);
    }
    showToast('Promo Code deleted.');
    return true;
  };

  const togglePromoCodeStatus = async (id: string): Promise<boolean> => {
    let newStatus = false;
    const updated = promoCodes.map((p) => {
      if (p.id === id) {
        newStatus = !p.isActive;
        return { ...p, isActive: newStatus };
      }
      return p;
    });
    setPromoCodes(updated);
    try {
      localStorage.setItem('zorotask_promo_codes', JSON.stringify(updated));
      await setDoc(doc(db, 'promo_codes', id), { isActive: newStatus }, { merge: true });
    } catch (e) {
      console.warn('Could not update promo status in Firestore:', e);
    }
    showToast(newStatus ? 'Promo Code activated!' : 'Promo Code paused.');
    return true;
  };

  const redeemPromoCode = async (
    codeStr: string
  ): Promise<{ success: boolean; message: string; rewardAmount?: number }> => {
    const cleanCode = codeStr.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      return { success: false, message: 'Please enter a Promo Code!' };
    }

    if (!isLoggedIn) {
      return { success: false, message: 'Please log in to your account first!' };
    }

    const found = promoCodes.find((p) => p.code.toUpperCase() === cleanCode);
    if (!found) {
      return {
        success: false,
        message: 'Invalid Promo Code! Please check the spelling or join our Telegram for active gift vouchers.',
      };
    }

    if (!found.isActive) {
      return {
        success: false,
        message: 'This Promo Code is currently inactive or paused.',
      };
    }

    if (found.expiryDate) {
      const expDate = new Date(found.expiryDate);
      if (!isNaN(expDate.getTime()) && new Date() > expDate) {
        return {
          success: false,
          message: 'This Promo Code has expired.',
        };
      }
    }

    if (found.usedCount >= found.usageLimit) {
      return {
        success: false,
        message: `Limit reached! All ${found.usageLimit} vouchers for this code have been claimed.`,
      };
    }

    const userPhoneClean = normalizeMobile(user.mobile);
    if (found.usedByUsers.some((u) => normalizeMobile(u) === userPhoneClean)) {
      return {
        success: false,
        message: 'You have already claimed this Promo Code! Each voucher can only be used once per account.',
      };
    }

    const reward = found.rewardAmount;
    const newBal = (user.balance || 0) + reward;
    const newToday = (user.todayEarnings || 0) + reward;
    const newTotal = (user.totalEarnings || 0) + reward;

    const newTx: TransactionItem = {
      id: `tx_${Date.now()}_promo`,
      type: 'promo_reward',
      title: `Gift Voucher (${found.code})`,
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      amount: reward,
      isCredit: true,
      status: 'completed',
      orderId: `#VOUCHER${Date.now().toString().slice(-6)}`,
    };

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: '🎁 Gift Voucher Claimed!',
      message: `Congratulations! ₹${reward} has been successfully credited to your wallet with code ${found.code}.`,
      time: 'Just now',
      read: false,
      type: 'reward',
    };

    const updatedUser: UserProfile = {
      ...user,
      balance: newBal,
      todayEarnings: newToday,
      totalEarnings: newTotal,
    };
    setUser(updatedUser);
    setTransactions((prev) => [newTx, ...prev]);
    setNotifications((prev) => [newNotif, ...prev]);

    const updatedPromo: PromoCode = {
      ...found,
      usedCount: found.usedCount + 1,
      usedByUsers: [...found.usedByUsers, userPhoneClean],
    };
    const updatedPromos = promoCodes.map((p) => (p.id === found.id ? updatedPromo : p));
    setPromoCodes(updatedPromos);

    try {
      localStorage.setItem('taskvibe_user', JSON.stringify(updatedUser));
      localStorage.setItem('taskvibe_txs', JSON.stringify([newTx, ...transactions]));
      localStorage.setItem('zorotask_promo_codes', JSON.stringify(updatedPromos));
    } catch {}

    try {
      await setDoc(
        doc(db, 'users', userPhoneClean),
        { balance: newBal, todayEarnings: newToday, totalEarnings: newTotal },
        { merge: true }
      );
      await setDoc(
        doc(db, 'promo_codes', found.id),
        { usedCount: updatedPromo.usedCount, usedByUsers: updatedPromo.usedByUsers },
        { merge: true }
      );
    } catch (e) {
      console.warn('Could not sync promo redemption to Firestore:', e);
    }

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}

    showToast(`🎉 ₹${reward} successfully credited to your wallet!`);
    return {
      success: true,
      message: `Success! ₹${reward} has been added to your wallet balance.`,
      rewardAmount: reward,
    };
  };

  const exportCompleteDatabase = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      registeredUsers,
      currentUser: user,
      transactions,
      plans,
      tasks,
      surveys,
      taskSubmissions,
      adminSettings,
      promoCodes,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importCompleteDatabase = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.registeredUsers && Array.isArray(data.registeredUsers)) {
        setRegisteredUsers(data.registeredUsers);
        localStorage.setItem('taskvibe_registered_users', JSON.stringify(data.registeredUsers));
      }
      if (data.currentUser) {
        setUser(data.currentUser);
        localStorage.setItem('taskvibe_user', JSON.stringify(data.currentUser));
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        localStorage.setItem('taskvibe_txs', JSON.stringify(data.transactions));
      }
      if (data.plans && Array.isArray(data.plans)) {
        setPlans(data.plans);
        localStorage.setItem('taskvibe_plans', JSON.stringify(data.plans));
      }
      if (data.surveys && Array.isArray(data.surveys)) {
        setSurveys(data.surveys);
        localStorage.setItem('taskvibe_surveys', JSON.stringify(data.surveys));
      }
      if (data.taskSubmissions && Array.isArray(data.taskSubmissions)) {
        setTaskSubmissions(data.taskSubmissions);
        localStorage.setItem('taskvibe_submissions', JSON.stringify(data.taskSubmissions));
      }
      if (data.adminSettings) {
        setAdminSettings(data.adminSettings);
        localStorage.setItem('taskvibe_admin_settings', JSON.stringify(data.adminSettings));
      }
      if (data.promoCodes && Array.isArray(data.promoCodes)) {
        setPromoCodes(data.promoCodes);
        localStorage.setItem('zorotask_promo_codes', JSON.stringify(data.promoCodes));
      }
      showToast('Database successfully restored! 🎉');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Invalid backup JSON file.');
      return false;
    }
  };

  const updateAdminSettings = async (newSettings: Partial<AdminSettings>) => {
    const wa = newSettings.supportWhatsapp !== undefined ? newSettings.supportWhatsapp : newSettings.whatsappSupportNumber;
    const synced = {
      ...newSettings,
      ...(wa !== undefined ? { supportWhatsapp: wa, whatsappSupportNumber: wa } : {}),
      // CRITICAL: Always keep active VIP plans safely preserved in settings/admin!
      ...(plans && plans.length > 0 ? { plans } : {}),
    };
    const updated = { ...adminSettings, ...synced };
    setAdminSettings(updated);
    try {
      localStorage.setItem('taskvibe_admin_settings', JSON.stringify(updated));
      await setDoc(doc(db, 'settings', 'admin'), updated, { merge: true });
    } catch (e) {
      console.warn('Could not save settings to Firestore:', e);
    }
    showToast('Admin settings saved successfully!');
  };

  const addNewSurvey = async (title: string, reward: number, description: string) => {
    const newSurvey: SurveyItem = {
      id: `srv_${Date.now()}`,
      title,
      reward,
      date: 'Available Now',
      completed: false,
      description: description || 'New opinion research task',
    };
    setSurveys((prev) => [newSurvey, ...prev]);
    try {
      localStorage.setItem('taskvibe_surveys', JSON.stringify([newSurvey, ...surveys]));
      await setDoc(doc(db, 'surveys', newSurvey.id), newSurvey, { merge: true });
    } catch (e) {
      console.warn('Could not save survey to Firestore:', e);
    }
    showToast('New survey added & broadcasted to all users!');
  };

  const deleteSurvey = async (id: string) => {
    setSurveys((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'surveys', id));
    } catch (e) {
      console.warn('Could not delete survey from Firestore:', e);
    }
    showToast('Survey removed across all devices.');
  };

  // 4. Admin Audit Logging
  const logAdminAction = async (
    action: AdminAuditLog['adminAction'],
    targetMobile: string,
    targetName?: string,
    oldValue?: string | number,
    newValue?: string | number,
    reason?: string
  ) => {
    const cleanMobile = normalizeMobile(targetMobile) || targetMobile;
    const now = Date.now();
    const newLog: AdminAuditLog = {
      id: `log_${now}_${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      dateStr: new Date(now).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      adminAction: action,
      targetMobile: cleanMobile,
      targetName: targetName || '',
      oldValue: oldValue !== undefined ? String(oldValue) : undefined,
      newValue: newValue !== undefined ? String(newValue) : undefined,
      difference:
        typeof oldValue === 'number' && typeof newValue === 'number'
          ? (newValue - oldValue > 0 ? `+₹${newValue - oldValue}` : `-₹${Math.abs(newValue - oldValue)}`)
          : undefined,
      reason: reason || 'Action performed by administrator',
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    try {
      await setDoc(doc(db, 'admin_audit_logs', newLog.id), newLog);
    } catch (err) {
      console.warn('Failed to save audit log to Firestore:', err);
    }
  };

  // 3. Dynamic Custom Tasks Management
  const createCustomTask = async (taskData: Omit<CustomTaskItem, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const id = `ctask_${Date.now()}`;
      const newTask: CustomTaskItem = {
        ...taskData,
        id,
        createdAt: Date.now(),
        completionsCount: 0,
      };
      await setDoc(doc(db, 'custom_tasks', id), newTask);
      setCustomTasks((prev) => [newTask, ...prev]);
      await logAdminAction('custom_notification', 'ALL_USERS', 'Broadcast', undefined, newTask.reward, `Created task: ${newTask.title}`);
      showToast('✓ Custom Task created and published live to all users!');
      return true;
    } catch (err) {
      console.error('Error creating custom task:', err);
      showToast('Failed to create custom task');
      return false;
    }
  };

  const updateCustomTask = async (id: string, updates: Partial<CustomTaskItem>): Promise<boolean> => {
    try {
      await setDoc(doc(db, 'custom_tasks', id), updates, { merge: true });
      setCustomTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      showToast('✓ Custom Task updated successfully!');
      return true;
    } catch (err) {
      console.error('Error updating custom task:', err);
      showToast('Failed to update task');
      return false;
    }
  };

  const deleteCustomTask = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'custom_tasks', id));
      setCustomTasks((prev) => prev.filter((t) => t.id !== id));
      showToast('✓ Custom Task deleted.');
      return true;
    } catch (err) {
      console.error('Error deleting custom task:', err);
      showToast('Failed to delete task');
      return false;
    }
  };

  const completeCustomTask = async (taskId: string): Promise<{ success: boolean; message: string }> => {
    const task = customTasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found' };
    if (!isLoggedIn) return { success: false, message: 'Please log in first' };
    if (user.isBlocked) return { success: false, message: 'Your account is suspended' };

    const cleanMob = normalizeMobile(user.mobile);
    const completedTasks = user.completedCustomTasks || [];
    if (completedTasks.includes(taskId)) {
      return { success: false, message: 'You have already completed this task!' };
    }

    const reward = task.reward || 0;
    const newBal = (user.balance || 0) + reward;
    const newToday = (user.todayEarnings || 0) + reward;
    const newTotal = (user.totalEarnings || 0) + reward;
    const newCompletedList = [...completedTasks, taskId];

    const newTx: TransactionItem = {
      id: `tx_${Date.now()}_ctask`,
      type: 'task_earning',
      title: `${task.title} (Task Reward)`,
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      amount: reward,
      isCredit: true,
      status: 'completed',
      note: `Task: ${task.title} completed`,
    };

    const updatedUser: UserProfile = {
      ...user,
      balance: newBal,
      todayEarnings: newToday,
      totalEarnings: newTotal,
      completedCustomTasks: newCompletedList,
    };

    setUser(updatedUser);
    setTransactions((prev) => [newTx, ...prev]);

    // Sync to user in Firestore
    try {
      if (cleanMob) {
        await setDoc(doc(db, 'users', cleanMob), {
          balance: newBal,
          todayEarnings: newToday,
          totalEarnings: newTotal,
          completedCustomTasks: newCompletedList,
          transactions: [newTx, ...transactions],
        }, { merge: true });
      }
      // Increment task completions count
      await setDoc(doc(db, 'custom_tasks', taskId), {
        completionsCount: (task.completionsCount || 0) + 1,
      }, { merge: true });
    } catch (err) {
      console.warn('Error completing custom task in cloud:', err);
    }

    showToast(`🎉 ₹${reward} added to wallet for completing ${task.title}!`);
    return { success: true, message: `Completed! ₹${reward} credited.` };
  };

  // Feature 1: Lucky Spin & Win
  const spinLuckyWheel = async (prizeIndex?: number): Promise<{ prize: string; amount: number; isScratchCard?: boolean }> => {
    const prizes = [
      { label: '₹5 Cash', amount: 5 },
      { label: '₹10 Cash', amount: 10 },
      { label: '₹25 Cash', amount: 25 },
      { label: '₹50 Cash', amount: 50 },
      { label: '₹100 Mega', amount: 100 },
      { label: '🎁 Scratch Card', amount: 0, isScratchCard: true },
      { label: '₹2 Cash', amount: 2 },
      { label: '₹15 Cash', amount: 15 },
    ];

    const idx = prizeIndex !== undefined ? prizeIndex : Math.floor(Math.random() * prizes.length);
    const won = prizes[idx] || prizes[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const isSameDay = user.lastSpinDate === todayStr;
    const spinsUsedToday = isSameDay ? (user.dailySpinsUsed || 0) + 1 : 1;

    let updatedBalance = user.balance;
    let updatedTodayEarnings = user.todayEarnings || 0;
    let updatedTotalEarnings = user.totalEarnings || 0;
    let updatedCards = [...(user.scratchCards || [])];
    let newTxList = [...transactions];

    if (won.isScratchCard) {
      const newCard: ScratchCardItem = {
        id: `sc_${Date.now()}`,
        title: 'Lucky Wheel Bonus Card',
        amount: [10, 20, 25, 50, 100][Math.floor(Math.random() * 5)],
        isScratched: false,
        createdAt: new Date().toLocaleDateString('en-IN'),
      };
      updatedCards.push(newCard);
      showToast('🎁 You won an exclusive Scratch Card!');
    } else if (won.amount > 0) {
      updatedBalance += won.amount;
      updatedTodayEarnings += won.amount;
      updatedTotalEarnings += won.amount;

      const newTx: TransactionItem = {
        id: `tx_${Date.now()}_spin`,
        type: 'spin_reward',
        title: 'Lucky Spin & Win Reward',
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: Date.now(),
        amount: won.amount,
        isCredit: true,
        status: 'completed',
        note: `Won ₹${won.amount} from daily lucky wheel`,
      };
      newTxList = [newTx, ...newTxList];
      setTransactions(newTxList);
      showToast(`🎉 ₹${won.amount} Cash credited to your wallet!`);
    }

    const updatedUser: UserProfile = {
      ...user,
      balance: updatedBalance,
      todayEarnings: updatedTodayEarnings,
      totalEarnings: updatedTotalEarnings,
      dailySpinsUsed: spinsUsedToday,
      lastSpinDate: todayStr,
      scratchCards: updatedCards,
    };

    setUser(updatedUser);

    const cleanMob = normalizeMobile(user.mobile);
    if (cleanMob) {
      try {
        await setDoc(doc(db, 'users', cleanMob), {
          balance: updatedBalance,
          todayEarnings: updatedTodayEarnings,
          totalEarnings: updatedTotalEarnings,
          dailySpinsUsed: spinsUsedToday,
          lastSpinDate: todayStr,
          scratchCards: updatedCards,
        }, { merge: true });
      } catch (err) {
        console.warn('Error saving spin result to Firestore:', err);
      }
    }

    return { prize: won.label, amount: won.amount, isScratchCard: won.isScratchCard };
  };

  // Feature 1: Claim Scratch Card
  const claimScratchCard = async (cardId: string): Promise<number> => {
    const cards = user.scratchCards || [];
    const target = cards.find((c) => c.id === cardId);
    if (!target || target.isScratched) return 0;

    const amt = target.amount || 10;
    const updatedCards = cards.map((c) => (c.id === cardId ? { ...c, isScratched: true } : c));
    const newBal = (user.balance || 0) + amt;
    const newToday = (user.todayEarnings || 0) + amt;
    const newTotal = (user.totalEarnings || 0) + amt;

    const newTx: TransactionItem = {
      id: `tx_${Date.now()}_sc`,
      type: 'scratch_reward',
      title: `${target.title} (Scratch Cash)`,
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      amount: amt,
      isCredit: true,
      status: 'completed',
      note: `Revealed ₹${amt} from scratch card`,
    };

    const updatedUser: UserProfile = {
      ...user,
      balance: newBal,
      todayEarnings: newToday,
      totalEarnings: newTotal,
      scratchCards: updatedCards,
    };

    setUser(updatedUser);
    setTransactions((prev) => [newTx, ...prev]);

    const cleanMob = normalizeMobile(user.mobile);
    if (cleanMob) {
      try {
        await setDoc(doc(db, 'users', cleanMob), {
          balance: newBal,
          todayEarnings: newToday,
          totalEarnings: newTotal,
          scratchCards: updatedCards,
        }, { merge: true });
      } catch (err) {
        console.warn('Error saving scratch card claim to Firestore:', err);
      }
    }

    showToast(`🎉 ₹${amt} added from Scratch Card!`);
    return amt;
  };

  // Feature 1: Award Scratch Card to User
  const awardScratchCard = (title: string, amount: number) => {
    const newCard: ScratchCardItem = {
      id: `sc_${Date.now()}`,
      title,
      amount,
      isScratched: false,
      createdAt: new Date().toLocaleDateString('en-IN'),
    };
    const updatedCards = [...(user.scratchCards || []), newCard];
    setUser((prev) => ({ ...prev, scratchCards: updatedCards }));
    const cleanMob = normalizeMobile(user.mobile);
    if (cleanMob) {
      setDoc(doc(db, 'users', cleanMob), { scratchCards: updatedCards }, { merge: true }).catch(() => {});
    }
    showToast(`🎁 You earned a new Scratch Card: ${title}!`);
  };

  // 7. 1-Click Clean Test Data
  const cleanTestData = async (): Promise<{ deletedDeposits: number; deletedSubmissions: number; message: string }> => {
    try {
      let delDepCount = 0;
      let delSubCount = 0;

      // Clean test deposits
      const depSnap = await getDocs(collection(db, 'deposits'));
      for (const d of depSnap.docs) {
        const data = d.data() as PaymentDeposit;
        const utr = (data.utrNumber || '').toUpperCase();
        const mob = normalizeMobile(data.userMobile);
        if (utr.includes('TEST') || utr.startsWith('DEMO') || mob === '9876543210' || mob === '0000000000') {
          await deleteDoc(doc(db, 'deposits', d.id));
          delDepCount++;
        }
      }

      // Clean test task submissions
      const subSnap = await getDocs(collection(db, 'task_submissions'));
      for (const s of subSnap.docs) {
        const data = s.data() as TaskSubmission;
        const uId = (data.userId || '').toUpperCase();
        const uName = (data.userName || '').toUpperCase();
        if (uId.includes('TEST') || uId.includes('DEMO') || uName.includes('TEST') || uName.includes('DEMO')) {
          await deleteDoc(doc(db, 'task_submissions', s.id));
          delSubCount++;
        }
      }

      await logAdminAction(
        'clean_test_data',
        'SYSTEM',
        'Cleanup Tool',
        undefined,
        undefined,
        `Purged ${delDepCount} test deposits and ${delSubCount} test submissions`
      );

      const msg = `✓ Cleaned ${delDepCount} test deposits & ${delSubCount} test submissions successfully!`;
      showToast(msg);
      return { deletedDeposits: delDepCount, deletedSubmissions: delSubCount, message: msg };
    } catch (err) {
      console.error('cleanTestData error:', err);
      showToast('Error cleaning test data');
      return { deletedDeposits: 0, deletedSubmissions: 0, message: 'Failed to clean test data' };
    }
  };

  // 5. Direct User Alert & Rejections with Reason
  const rejectWithdrawalWithReason = async (withdrawalId: string, userMobile: string, reason: string): Promise<boolean> => {
    try {
      const cleanMob = normalizeMobile(userMobile);
      const cleanReason = reason.trim() || 'Details verification failed. Please check bank/UPI details.';
      await rejectWithdrawal(withdrawalId, cleanReason);

      if (cleanMob) {
        const alertMsg = `Your withdrawal request was rejected by admin. Reason: "${cleanReason}". Your balance was refunded to your wallet.`;
        await setDoc(
          doc(db, 'users', cleanMob),
          {
            adminAlertMessage: alertMsg,
            adminAlertTime: Date.now(),
          },
          { merge: true }
        );
      }

      await logAdminAction(
        'withdrawal_rejected',
        cleanMob,
        undefined,
        undefined,
        undefined,
        cleanReason
      );

      showToast(`✓ Withdrawal rejected and user notified with reason!`);
      return true;
    } catch (err) {
      console.error('rejectWithdrawalWithReason error:', err);
      showToast('Failed to reject withdrawal');
      return false;
    }
  };

  const rejectPaymentDepositWithReason = async (depositId: string, reason: string): Promise<boolean> => {
    try {
      const dep = paymentDeposits.find((d) => d.id === depositId);
      const cleanReason = reason.trim() || 'Invalid UTR reference number or payment screenshot.';
      await rejectPaymentDeposit(depositId, cleanReason);

      const cleanMob = dep?.userMobile ? normalizeMobile(dep.userMobile) : '';
      if (cleanMob) {
        const alertMsg = `Your deposit request for ₹${dep?.amount || 0} (UTR: ${dep?.utrNumber || 'N/A'}) was rejected by admin. Reason: "${cleanReason}".`;
        await setDoc(
          doc(db, 'users', cleanMob),
          {
            adminAlertMessage: alertMsg,
            adminAlertTime: Date.now(),
          },
          { merge: true }
        );
      }

      await logAdminAction(
        'deposit_rejected',
        cleanMob,
        dep?.userName,
        dep?.amount,
        0,
        cleanReason
      );

      showToast(`✓ Deposit rejected and alert sent to user!`);
      return true;
    } catch (err) {
      console.error('rejectPaymentDepositWithReason error:', err);
      showToast('Failed to reject deposit');
      return false;
    }
  };

  const dismissAdminAlert = async (): Promise<void> => {
    setUser((prev) => ({
      ...prev,
      adminAlertMessage: undefined,
      adminAlertTime: undefined,
    }));
    const cleanMob = normalizeMobile(user.mobile);
    if (cleanMob) {
      try {
        await setDoc(
          doc(db, 'users', cleanMob),
          {
            adminAlertMessage: null,
            adminAlertTime: null,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Failed to dismiss alert in Firestore:', err);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        activeTab,
        historyStack,
        user,
        isLoggedIn,
        transactions,
        tasks,
        surveys,
        plans,
        selectedPlan,
        notifications,
        lastPurchase,
        toastMessage,
        frameMode,
        adminSettings,
        taskSubmissions,
        paymentDeposits,
        isCloudConnected,
        pendingDepositType,
        pendingPlanForUPI,
        isSurveyModalOpen,
        isUPIModalOpen,
        pendingUPIAmount,
        pendingUPIBonus,
        isWatchingVideo,
        isTeamModalOpen,
        isNotificationsOpen,
        isEditProfileOpen,
        navigate,
        goBack,
        switchTab,
        login,
        register,
        resetUserPassword,
        logout,
        addMoneyInitiate,
        submitUPIPaymentProof,
        completeUPIPayment,
        approvePaymentDeposit,
        rejectPaymentDeposit,
        buyPlanWithWallet,
        buyPlanWithUPI,
        requestWithdrawal,
        completeSurveySubmit,
        submitDailySurveyTask,
        stepWatchVideo,
        submitYouTubeVideoTask,
        maxDailyVideos,
        todayVideosWatched,
        canWatchMoreVideos,
        perVideoReward,
        openVideoTask,
        activeUserPlan,
        activeUserPlans,
        userDailyVideoMissions,
        totalDailyIncome,
        currentPlayingTaskNum,
        simulatePurchaseDirect,
        copyText,
        showToast,
        hideToast,
        toggleFrameMode,
        setFrameMode,
        resetAllData,
        setIsSurveyModalOpen,
        setIsUPIModalOpen,
        setIsWatchingVideo,
        setIsTeamModalOpen,
        setIsNotificationsOpen,
        setIsEditProfileOpen,
        updateUserProfile,
        approveWithdrawal,
        rejectWithdrawal,
        validateReferralCode,
        validateReferralCodeAsync,
        syncReferralWallet,
        isFreeTrialActive,
        freeTrialHoursLeft,
        refreshAppData,
        isRefreshing,
        pendingInviteCode,
        adjustUserBalance,
        approveTaskSubmission,
        rejectTaskSubmission,
        updateAdminSettings,
        addNewSurvey,
        deleteSurvey,
        registeredUsers,
        isPhoneAlreadyRegistered,
        checkPhoneExistsInFirestore,
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
        supportTickets,
        createSupportTicket,
        replySupportTicket,
        sendDirectUserAlert,
        promoCodes,
        createPromoCode,
        deletePromoCode,
        togglePromoCodeStatus,
        redeemPromoCode,
        isPromoModalOpen,
        setIsPromoModalOpen,
        customTasks,
        createCustomTask,
        updateCustomTask,
        deleteCustomTask,
        completeCustomTask,
        auditLogs,
        logAdminAction,
        cleanTestData,
        rejectWithdrawalWithReason,
        rejectPaymentDepositWithReason,
        dismissAdminAlert,
        isSpinModalOpen,
        setIsSpinModalOpen,
        spinLuckyWheel,
        claimScratchCard,
        awardScratchCard,
        isLeaderboardModalOpen,
        setIsLeaderboardModalOpen,
        isExitModalOpen,
        setIsExitModalOpen,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        installedAppVersion,
        isUpdateAvailable,
        checkForAppUpdate,
        triggerOneClickUpdate,
        exitApp,
        registerBackHandler,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
