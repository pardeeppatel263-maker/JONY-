import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
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
  adminDeleteUser: (mobile: string) => void;
  updatePlan: (planId: string, updates: Partial<PlanItem>) => void;
  addVIPPlan: (newPlan: PlanItem) => Promise<boolean>;
  updateVIPPlan: (planId: string, updates: Partial<PlanItem>) => Promise<boolean>;
  deleteVIPPlan: (planId: string) => Promise<boolean>;
  resetUserDailyTasks: (mobile: string) => Promise<void>;
  exportCompleteDatabase: () => string;
  importCompleteDatabase: (jsonStr: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const normalizeMobile = (m?: string | null) => {
  const digits = (m || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Stored registered users database
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('taskvibe_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Demo initial registered account
      const defaultAcc: RegisteredUserAccount = {
        name: 'Pardeep Patel',
        mobile: '+91 9876543210',
        email: 'pardeep@taskvibe.in',
        referralCode: 'TV982143',
        balance: 500,
        totalEarned: 500,
        withdrawn: 0,
        upiId: '9876543210@upi',
        joinedDate: '27 Sep 2026',
        joinedTimestamp: Date.now() - 1000 * 60 * 60 * 6,
        password: 'admin',
        vipLevel: 0,
        vipTag: 'Free Starter',
        transactions: [],
      };
      localStorage.setItem('taskvibe_registered_users', JSON.stringify([defaultAcc]));
      return [defaultAcc];
    } catch {
      return [];
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('taskvibe_auth');
      const savedUserRaw = localStorage.getItem('taskvibe_user');
      if (savedAuth === 'true') {
        if (savedUserRaw) {
          const parsed = JSON.parse(savedUserRaw);
          if (parsed && (parsed.mobile || parsed.name)) {
            return true;
          }
        }
        return true;
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
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('invite') || urlParams.get('ref');
        const savedAuth = localStorage.getItem('taskvibe_auth');
        if (inviteCode && savedAuth !== 'true') {
          return 'register';
        }
      }
      const savedAuth = localStorage.getItem('taskvibe_auth');
      const savedScreen = localStorage.getItem('taskvibe_screen') as ScreenType;
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

  // Persist currentScreen whenever it changes
  useEffect(() => {
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
        window.history.replaceState({ taskvibe: true, screen: 'home' }, '', window.location.pathname);
      } catch (err) {
        console.warn(err);
      }
    }
  }, [isLoggedIn, currentScreen]);

  // Keep a forward history state when on home to trap phone back button
  useEffect(() => {
    if (isLoggedIn && currentScreen === 'home') {
      try {
        window.history.pushState({ taskvibe: true, screen: 'home' }, '', window.location.pathname);
      } catch (err) {
        console.warn(err);
      }
    }
  }, [isLoggedIn, currentScreen]);

  // Stored state with local storage fallback
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const savedUserRaw = localStorage.getItem('taskvibe_user');
      if (savedUserRaw) {
        const parsed = JSON.parse(savedUserRaw);
        if (parsed && (parsed.mobile || parsed.name)) {
          return parsed;
        }
      }
      const activeMobile = localStorage.getItem('taskvibe_active_mobile');
      const savedUsersRaw = localStorage.getItem('taskvibe_registered_users');
      const parsedUsers: RegisteredUserAccount[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
      if (activeMobile) {
        const cleanActive = normalizeMobile(activeMobile);
        const matched = parsedUsers.find((u) => normalizeMobile(u.mobile) === cleanActive);
        if (matched) return matched;
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
        const matched = parsedUsers.find((u) => normalizeMobile(u.mobile) === cleanActive);
        if (matched && matched.transactions) return matched.transactions;
      }
      return initialTransactions;
    } catch {
      return initialTransactions;
    }
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('taskvibe_tasks');
      return saved ? JSON.parse(saved) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [surveys, setSurveys] = useState<SurveyItem[]>(() => {
    try {
      const saved = localStorage.getItem('taskvibe_surveys');
      return saved ? JSON.parse(saved) : initialSurveys;
    } catch {
      return initialSurveys;
    }
  });

  const [plans, setPlans] = useState<PlanItem[]>(() => {
    try {
      const saved = localStorage.getItem('taskvibe_plans');
      return saved ? JSON.parse(saved) : initialPlans;
    } catch {
      return initialPlans;
    }
  });
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(() => {
    try {
      const saved = localStorage.getItem('taskvibe_selected_plan');
      return saved ? JSON.parse(saved) : initialPlans[0];
    } catch {
      return initialPlans[0];
    }
  });

  useEffect(() => {
    if (selectedPlan) {
      try {
        localStorage.setItem('taskvibe_selected_plan', JSON.stringify(selectedPlan));
      } catch (e) {
        console.warn(e);
      }
    }
  }, [selectedPlan]);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

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

  const [lastPurchase, setLastPurchase] = useState<PurchaseDetails>({
    amount: 1000,
    reward: 150,
    orderId: '#TV202509231234',
    date: '23 Sep 2025, 09:45 AM',
    status: 'verified',
  });

  const defaultAdminSettings: AdminSettings = {
    adminUpiId: 'taskvibe.pay@icici',
    adminMerchantName: 'TaskVibe Digital Rewards',
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
    youtubeVideoTitle: 'TaskVibe Official YouTube Partner Video',
    youtubeVideoReward: 50,
    youtubeVideoDurationSec: 30,
    supportWhatsapp: '+91 9876543210',
    supportTelegram: 'https://t.me/TaskVibeSupport',
    whatsappInstanceId: 'instance192672',
    whatsappApiToken: 'zwsvwyr1pqa8ztxa',
    announcementEnabled: true,
    announcementTitle: '🎉 Welcome to TaskVibe 2.0 Update!',
    announcementMessage: 'Naya TaskVibe update live hai! VIP members ke liye high video earning rewards aur instant UPI payout features activate kar diye gaye hain. Har roz naye video tasks complete karein aur wallet balance grow karein!',
    announcementTag: 'NEW UPDATE',
    announcementButtonText: 'Check VIP Plans ⭐',
    announcementButtonAction: 'member_plans',
    announcementDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
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
          youtubeVideoId: parsed.youtubeVideoId || defaultAdminSettings.youtubeVideoId,
          youtubeVideoUrls: parsed.youtubeVideoUrls || defaultAdminSettings.youtubeVideoUrls,
          youtubeVideoTitle: parsed.youtubeVideoTitle || defaultAdminSettings.youtubeVideoTitle,
          youtubeVideoReward: parsed.youtubeVideoReward || defaultAdminSettings.youtubeVideoReward,
          youtubeVideoDurationSec: parsed.youtubeVideoDurationSec || defaultAdminSettings.youtubeVideoDurationSec,
          supportWhatsapp: parsed.supportWhatsapp !== undefined ? parsed.supportWhatsapp : defaultAdminSettings.supportWhatsapp,
          supportTelegram: parsed.supportTelegram !== undefined ? parsed.supportTelegram : defaultAdminSettings.supportTelegram,
          whatsappInstanceId: parsed.whatsappInstanceId || defaultAdminSettings.whatsappInstanceId,
          whatsappApiToken: parsed.whatsappApiToken || defaultAdminSettings.whatsappApiToken,
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
          if (cloudUsers.length > 0) {
            setRegisteredUsers((prev) => {
              const map = new Map<string, RegisteredUserAccount>();
              prev.forEach((u) => {
                const k = normalizeMobile(u.mobile);
                if (k) map.set(k, u);
              });
              cloudUsers.forEach((u) => {
                const k = normalizeMobile(u.mobile);
                if (k) map.set(k, u);
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('taskvibe_registered_users', JSON.stringify(merged));
              } catch {}
              return merged;
            });

            // Real-time synchronization for currently active user when Admin approves or adjusts
            try {
              const activeMob = localStorage.getItem('taskvibe_active_mobile');
              if (activeMob) {
                const cleanActive = normalizeMobile(activeMob);
                const cloudSelf = cloudUsers.find((u) => normalizeMobile(u.mobile) === cleanActive);
                if (cloudSelf) {
                  setUser((curr) => ({
                    ...curr,
                    ...cloudSelf,
                  }));
                  if (cloudSelf.transactions && Array.isArray(cloudSelf.transactions)) {
                    setTransactions(cloudSelf.transactions);
                    try {
                      localStorage.setItem('taskvibe_txs', JSON.stringify(cloudSelf.transactions));
                    } catch {}
                  }
                }
              }
            } catch (err) {
              console.warn('Real-time self user sync error:', err);
            }
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot error:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not attach Firestore users listener:', err);
    }
  }, []);

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
            };
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
          if (!current.adminPassword || legacy.includes(current.adminPassword)) {
            await setDoc(settingsDocRef, { adminPassword: 'Gagan@123' }, { merge: true });
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

  // Real-time listener: sync VIP Plans from Firestore across all devices
  useEffect(() => {
    try {
      const plansCol = collection(db, 'vip_plans');
      const unsubscribe = onSnapshot(
        plansCol,
        async (snapshot) => {
          const cloudPlans: PlanItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as PlanItem;
            if (data && data.id) {
              cloudPlans.push(data);
            }
          });

          // Ensure all base plans (Level 0 through Level 7) are ALWAYS preserved!
          // Admin edits or new additions (e.g. Level 8+) in cloudPlans take precedence.
          const planMap = new Map<string, PlanItem>();
          initialPlans.forEach((p) => planMap.set(p.id, p));
          cloudPlans.forEach((p) => planMap.set(p.id, p));
          const mergedPlans = Array.from(planMap.values()).sort((a, b) => (a.level || 0) - (b.level || 0));

          setPlans(mergedPlans);
          try {
            localStorage.setItem('taskvibe_plans', JSON.stringify(mergedPlans));
          } catch (e) {
            console.warn(e);
          }

          // If any base plan was missing in Firestore, seed it in background
          try {
            for (const p of initialPlans) {
              if (!cloudPlans.some((cp) => cp.id === p.id)) {
                await setDoc(doc(db, 'vip_plans', p.id), p, { merge: true });
              }
            }
          } catch (seedErr) {
            console.warn('Syncing base plans to Firestore:', seedErr);
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
          if (docSnap.exists()) {
            const cloudData = docSnap.data() as RegisteredUserAccount;
            setUser((curr) => {
              // Always sync full cloud state including todayVideosWatched, lastVideoWatchDate, balance, etc.
              return { ...curr, ...cloudData };
            });
            try {
              localStorage.setItem('taskvibe_user', JSON.stringify({ ...user, ...cloudData }));
            } catch {}
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
        syncUserToFirestore(user, transactions);
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
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

  const lastBackPressTimeRef = useRef<number>(0);

  // Initialize and handle mobile device physical / browser back button (popstate)
  useEffect(() => {
    // Seed an initial history state
    if (!window.history.state || !window.history.state.taskvibe) {
      window.history.replaceState(
        { taskvibe: true, screen: currentScreen },
        '',
        window.location.pathname
      );
    }

    const handlePopState = () => {
      // 1. If any modal is currently open, dismiss modal on back press
      if (isSurveyModalOpen) {
        setIsSurveyModalOpen(false);
        window.history.pushState({ taskvibe: true, screen: currentScreen }, '', window.location.pathname);
        return;
      }
      if (isUPIModalOpen) {
        setIsUPIModalOpen(false);
        // User requested: "JAB KOI PAYMENT KARE KISI UPI AUR BACK AAYE TOO WAHI JAHA JOPALNE O BUY KAR RHA HO"
        if (pendingPlanForUPI || selectedPlan) {
          setCurrentScreen('plan_detail');
          setActiveTab('member');
          setHistoryStack((prev) => {
            const clean = prev.filter((s) => s !== 'login' && s !== 'register');
            return clean.includes('member_plans') ? ['home', 'member_plans', 'plan_detail'] : ['home', 'plan_detail'];
          });
          window.history.pushState({ taskvibe: true, screen: 'plan_detail' }, '', window.location.pathname);
          showToast('✓ You are on the Plans page');
          return;
        }
        window.history.pushState({ taskvibe: true, screen: currentScreen }, '', window.location.pathname);
        return;
      }
      if (isWatchingVideo) {
        setIsWatchingVideo(false);
        window.history.pushState({ taskvibe: true, screen: currentScreen }, '', window.location.pathname);
        return;
      }
      if (isTeamModalOpen) {
        setIsTeamModalOpen(false);
        window.history.pushState({ taskvibe: true, screen: currentScreen }, '', window.location.pathname);
        return;
      }
      if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
        window.history.pushState({ taskvibe: true, screen: currentScreen }, '', window.location.pathname);
        return;
      }
      if (isEditProfileOpen) {
        setIsEditProfileOpen(false);
        window.history.pushState({ taskvibe: true, screen: currentScreen }, '', window.location.pathname);
        return;
      }

      // 2. If logged in: User MUST NEVER see Login or Register on back button!
      // Back navigates 1 step backwards, but stops at HomeScreen and never logs out!
      if (isLoggedIn) {
        if (currentScreen === 'home') {
          // Home screen is the absolute end of back navigation!
          window.history.pushState({ taskvibe: true, screen: 'home' }, '', window.location.pathname);
          showToast('✓ You are on the Home screen');
          return;
        }

        // On any sub-screen (wallet, withdraw, member_plans, mission, record, profile, etc.)
        // Step back 1 step, but once reaching Home, stop at Home
        setHistoryStack((prev) => {
          const cleanStack = prev.filter((s) => s !== 'login' && s !== 'register' && s !== 'splash');
          if (cleanStack.length > 1) {
            const nextStack = [...cleanStack];
            nextStack.pop(); // step back 1 step
            const targetScreen = nextStack[nextStack.length - 1] || 'home';
            setCurrentScreen(targetScreen);

            // sync tab
            if (targetScreen === 'home') setActiveTab('home');
            else if (targetScreen === 'member_plans') setActiveTab('member');
            else if (targetScreen === 'mission') setActiveTab('mission');
            else if (targetScreen === 'record') setActiveTab('record');
            else if (targetScreen === 'profile') setActiveTab('me');

            if (targetScreen === 'home') {
              window.history.pushState({ taskvibe: true, screen: 'home' }, '', window.location.pathname);
            }
            return nextStack;
          } else {
            // Reached Home screen! Stop here!
            setCurrentScreen('home');
            setActiveTab('home');
            window.history.pushState({ taskvibe: true, screen: 'home' }, '', window.location.pathname);
            showToast('✓ You are on the Home screen');
            return ['home'];
          }
        });
        return;
      }

      // 3. If unauthenticated
      if (currentScreen === 'register') {
        setCurrentScreen('login');
        setHistoryStack(['login']);
        return;
      }

      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        return;
      } else {
        lastBackPressTimeRef.current = now;
        window.history.pushState({ taskvibe: true, screen: 'login' }, '', window.location.pathname);
        setToastMessage('Press back again to exit');
        setTimeout(() => {
          setToastMessage(null);
        }, 2500);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isSurveyModalOpen,
    isUPIModalOpen,
    isWatchingVideo,
    isTeamModalOpen,
    isNotificationsOpen,
    isEditProfileOpen,
    currentScreen,
    isLoggedIn,
  ]);

  const navigate = (screen: ScreenType, plan?: PlanItem) => {
    if (plan) setSelectedPlan(plan);
    if (screen === currentScreen) return;

    let targetScreen = screen;
    // When logged in, never navigate to login/register/splash
    if (isLoggedIn && (targetScreen === 'login' || targetScreen === 'register' || targetScreen === 'splash')) {
      targetScreen = 'home';
    }

    // Push state into browser history so phone back button works
    try {
      window.history.pushState({ taskvibe: true, screen: targetScreen, planId: plan?.id }, '', window.location.pathname);
    } catch {
      // ignore
    }

    setHistoryStack((prev) => {
      const clean = isLoggedIn
        ? prev.filter((s) => s !== 'login' && s !== 'register' && s !== 'splash')
        : prev;
      return [...clean, targetScreen];
    });
    setCurrentScreen(targetScreen);

    // Sync active bottom tab if screen matches a tab
    if (targetScreen === 'home') setActiveTab('home');
    else if (targetScreen === 'member_plans') setActiveTab('member');
    else if (targetScreen === 'mission') setActiveTab('mission');
    else if (targetScreen === 'record') setActiveTab('record');
    else if (targetScreen === 'profile') setActiveTab('me');
  };

  const goBack = () => {
    if (isSurveyModalOpen) { setIsSurveyModalOpen(false); return; }
    if (isUPIModalOpen) {
      setIsUPIModalOpen(false);
      if (pendingPlanForUPI || selectedPlan) {
        setCurrentScreen('plan_detail');
        setActiveTab('member');
      }
      return;
    }
    if (isWatchingVideo) { setIsWatchingVideo(false); return; }
    if (isTeamModalOpen) { setIsTeamModalOpen(false); return; }
    if (isNotificationsOpen) { setIsNotificationsOpen(false); return; }
    if (isEditProfileOpen) { setIsEditProfileOpen(false); return; }

    if (isLoggedIn) {
      if (currentScreen === 'home') {
        showToast('✓ You are on the Home screen');
        return;
      }
      setHistoryStack((prev) => {
        const cleanStack = prev.filter((s) => s !== 'login' && s !== 'register' && s !== 'splash');
        if (cleanStack.length > 1) {
          const nextStack = [...cleanStack];
          nextStack.pop();
          const target = nextStack[nextStack.length - 1] || 'home';
          setCurrentScreen(target);
          if (target === 'home') setActiveTab('home');
          else if (target === 'member_plans') setActiveTab('member');
          else if (target === 'mission') setActiveTab('mission');
          else if (target === 'record') setActiveTab('record');
          else if (target === 'profile') setActiveTab('me');
          return nextStack;
        } else {
          setCurrentScreen('home');
          setActiveTab('home');
          return ['home'];
        }
      });
    } else {
      if (currentScreen === 'register') {
        setCurrentScreen('login');
        setHistoryStack(['login']);
      }
    }
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
      window.history.pushState({ taskvibe: true, screen: targetScreen }, '', window.location.pathname);
    } catch {
      // ignore
    }

    setHistoryStack((prev) => {
      const clean = isLoggedIn
        ? prev.filter((s) => s !== 'login' && s !== 'register' && s !== 'splash')
        : prev;
      return [...clean, targetScreen];
    });
    setCurrentScreen(targetScreen);
  };

  const checkPhoneExistsInFirestore = async (m: string): Promise<boolean> => {
    const clean = normalizeMobile(m);
    if (!clean || clean.length < 10) return false;
    if (registeredUsers.some((u) => normalizeMobile(u.mobile) === clean)) return true;
    try {
      const snap = await getDoc(doc(db, 'users', clean));
      return snap.exists();
    } catch {
      return false;
    }
  };

  const login = async (mobile: string, pass: string): Promise<boolean> => {
    if (!mobile || !pass) {
      showToast('Please enter both mobile number and password');
      return false;
    }
    const cleanMobile = normalizeMobile(mobile);
    if (cleanMobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return false;
    }

    let matched: RegisteredUserAccount | null = null;

    // 1. Fetch directly from Firestore cloud database so any device can log in!
    try {
      const userRef = doc(db, 'users', cleanMobile);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        matched = snap.data() as RegisteredUserAccount;
      }
    } catch (err) {
      console.warn('Firestore fetch failed, checking local state', err);
    }

    // 2. Fallback to locally synced registeredUsers
    if (!matched) {
      matched =
        registeredUsers.find(
          (u) => normalizeMobile(u.mobile) === cleanMobile
        ) || null;
    }

    if (!matched) {
      showToast(`❌ Phone number (+91 ${cleanMobile}) is not registered. Please click "Register Now" to create an account.`);
      return false;
    }

    if (matched.password !== pass.trim()) {
      showToast('❌ Incorrect password! Please enter the correct password.');
      return false;
    }

    // Sync account to Firestore if not already there
    try {
      const userRef = doc(db, 'users', cleanMobile);
      await setDoc(userRef, matched, { merge: true });
    } catch (e) {
      console.warn(e);
    }

    // Successful login - load user's real balance, details, and transactions
    setUser(matched);
    setTransactions(matched.transactions || []);
    setIsLoggedIn(true);
    setCurrentScreen('home');
    setActiveTab('home');
    setHistoryStack(['home']);

    try {
      localStorage.setItem('taskvibe_auth', 'true');
      localStorage.setItem('taskvibe_active_mobile', cleanMobile);
      localStorage.setItem('taskvibe_user', JSON.stringify(matched));
      localStorage.setItem('taskvibe_txs', JSON.stringify(matched.transactions || []));
      localStorage.setItem('taskvibe_last_registered_mobile', cleanMobile);
      window.history.replaceState({ taskvibe: true, screen: 'home' }, '', window.location.pathname);
    } catch (e) {
      console.warn(e);
    }

    showToast(`✓ Login successful! Welcome back, ${matched.name}!`);
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

    // 1. Check in Firestore: 1 Phone number = 1 Account only!
    let alreadyExists = false;
    try {
      const userRef = doc(db, 'users', cleanMobile);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        alreadyExists = true;
      }
    } catch (err) {
      console.warn('Firestore existence check error', err);
    }

    if (!alreadyExists) {
      alreadyExists = registeredUsers.some(
        (u) => normalizeMobile(u.mobile) === cleanMobile
      );
    }

    if (alreadyExists) {
      showToast(`❌ This mobile number (+91 ${cleanMobile}) is already registered! Only 1 account is allowed per phone number. Please login with your password.`);
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
    const cleanRefCode = refCode ? refCode.trim().toUpperCase() : '';
    if (cleanRefCode) {
      matchedReferrer =
        registeredUsers.find(
          (u) => u.referralCode && u.referralCode.toUpperCase() === cleanRefCode
        ) || null;

      // Also check in Firestore if not in local memory
      if (!matchedReferrer) {
        try {
          const qSnap = await getDocs(
            query(collection(db, 'users'), where('referralCode', '==', cleanRefCode), limit(1))
          );
          if (!qSnap.empty) {
            matchedReferrer = qSnap.docs[0].data() as RegisteredUserAccount;
          }
        } catch (e) {
          console.warn('Referral check in Firestore failed:', e);
        }
      }

      // Allow master referral codes as valid default fallback
      const isMasterCode = cleanRefCode === 'TV982143' || cleanRefCode === 'TASKVIBE123';
      if (!matchedReferrer && !isMasterCode) {
        showToast(`❌ Invalid invite code "${cleanRefCode}"! Please enter a valid candidate invite code or leave it blank.`);
        return false;
      }
    }

    // Generate unique referral code for this new user
    let newReferralCode = `TV${Math.floor(100000 + Math.random() * 900000)}`;
    while (registeredUsers.some((u) => u.referralCode === newReferralCode)) {
      newReferralCode = `TV${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const initialBonus = cleanRefCode ? 100 : 0;
    const initialTxs: TransactionItem[] = cleanRefCode
      ? [
          {
            id: `tx_${Date.now()}`,
            type: 'referral_reward',
            title: 'Referral Signup Bonus',
            date: 'Today',
            amount: 100,
            isCredit: true,
            status: 'verified',
            note: `Referral code applied: ${cleanRefCode}`,
          },
        ]
      : [];

    const newUser: RegisteredUserAccount = {
      name: name.trim(),
      mobile: `+91 ${cleanMobile}`,
      email: email ? email.trim() : `${cleanMobile}@taskvibe.in`,
      referralCode: newReferralCode,
      referredBy: matchedReferrer
        ? matchedReferrer.referralCode
        : cleanRefCode
        ? cleanRefCode
        : undefined,
      balance: initialBonus,
      totalEarned: initialBonus,
      withdrawn: 0,
      upiId: `${cleanMobile}@upi`,
      joinedDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      joinedTimestamp: Date.now(),
      password: pass.trim(),
      vipLevel: 0,
      vipTag: 'Free Starter',
      transactions: initialTxs,
    };

    // Save to Firestore cloud database so any other device immediately has this account
    try {
      const userRef = doc(db, 'users', cleanMobile);
      await setDoc(userRef, newUser);
    } catch (err) {
      console.error('Failed to save user to Firestore', err);
    }

    // AUTOMATIC REFERRAL REWARD FOR INVITER:
    // When someone signs up via invite link, the inviter receives an instant reward!
    const refReward = adminSettings.referralBonus || 100;
    if (matchedReferrer) {
      const refClean = normalizeMobile(matchedReferrer.mobile);
      const refTx: TransactionItem = {
        id: `tx_ref_reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'referral_reward',
        title: `Referral Signup Reward (+₹${refReward})`,
        date: 'Today',
        amount: refReward,
        isCredit: true,
        status: 'verified',
        note: `New friend ${name.trim()} (+91 ${cleanMobile}) registered via your invite link! Automatic ₹${refReward} bonus credited to your wallet.`,
      };

      // 1. Update in local registeredUsers
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          normalizeMobile(u.mobile) === refClean
            ? {
                ...u,
                balance: (u.balance || 0) + refReward,
                totalEarned: (u.totalEarned || 0) + refReward,
                referralEarnings: (u.referralEarnings || 0) + refReward,
                transactions: [refTx, ...(u.transactions || [])],
              }
            : u
        )
      );

      // 2. If referrer is currently active user on this device
      if (normalizeMobile(user.mobile) === refClean) {
        setUser((curr) => ({
          ...curr,
          balance: curr.balance + refReward,
          totalEarned: curr.totalEarned + refReward,
          referralEarnings: (curr.referralEarnings || 0) + refReward,
        }));
        setTransactions((prev) => [refTx, ...prev]);
        setNotifications((prev) => [
          {
            id: `notif_${Date.now()}`,
            title: `🎉 ₹${refReward} Referral Signup Bonus!`,
            message: `${name.trim()} ne aapke invite link se register kiya. ₹${refReward} aapke wallet me add ho gaya!`,
            time: 'Just now',
            read: false,
            type: 'reward',
          },
          ...prev,
        ]);
      }

      // 3. Persist reward & transaction to Firestore for referrer
      try {
        const refUserRef = doc(db, 'users', refClean);
        const refSnap = await getDoc(refUserRef);
        const existingRefTxs: TransactionItem[] =
          refSnap.exists() && refSnap.data().transactions ? refSnap.data().transactions : [];
        await setDoc(
          refUserRef,
          {
            balance: increment(refReward),
            totalEarned: increment(refReward),
            referralEarnings: increment(refReward),
            transactions: [refTx, ...existingRefTxs],
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Failed to reward referrer in Firestore:', err);
      }
    }

    const updatedUsers = [...registeredUsers.filter((u) => normalizeMobile(u.mobile) !== cleanMobile), newUser];
    setRegisteredUsers(updatedUsers);
    setUser(newUser);
    setTransactions(initialTxs);
    setIsLoggedIn(true);
    setCurrentScreen('home');
    setActiveTab('home');
    setHistoryStack(['home']);

    try {
      localStorage.setItem('taskvibe_registered_users', JSON.stringify(updatedUsers));
      localStorage.setItem('taskvibe_auth', 'true');
      localStorage.setItem('taskvibe_active_mobile', cleanMobile);
      localStorage.setItem('taskvibe_user', JSON.stringify(newUser));
      localStorage.setItem('taskvibe_txs', JSON.stringify(initialTxs));
      localStorage.setItem('taskvibe_last_registered_mobile', cleanMobile);
      window.history.replaceState({ taskvibe: true, screen: 'home' }, '', window.location.pathname);
    } catch (e) {
      console.warn(e);
    }

    if (refCode) {
      triggerConfetti();
      showToast(`🎉 Account created! ₹100 welcome bonus received. Welcome ${newUser.name}!`);
    } else {
      triggerConfetti();
      showToast(`🎉 Account successfully created! Welcome ${newUser.name}!`);
    }

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
      window.history.replaceState({ taskvibe: true, screen: 'login' }, '', window.location.pathname);
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

  // Real-time referral code validator helper
  const validateReferralCode = (code: string): { isValid: boolean; referrerName?: string } => {
    if (!code || !code.trim()) return { isValid: false };
    const clean = code.trim().toUpperCase();
    if (clean === 'TV982143' || clean === 'TASKVIBE123') {
      return { isValid: true, referrerName: 'TaskVibe Official' };
    }
    const match = registeredUsers.find((u) => u.referralCode && u.referralCode.toUpperCase() === clean);
    if (match) {
      return { isValid: true, referrerName: match.name || 'Member' };
    }
    return { isValid: false };
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
      // 1. Level 1 Upline (Direct Referrer) - 4.5%
      const upline1 = registeredUsers.find((u) => u.referralCode === buyerUser.referredBy);
      if (upline1) {
        const comm1 = Math.round(planPrice * 0.045 * 100) / 100;
        if (comm1 > 0) {
          const u1Clean = normalizeMobile(upline1.mobile);
          const u1Tx: TransactionItem = {
            id: `tx_ref1_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'referral_reward',
            title: `Level 1 Referral Commission (4.5%)`,
            date: 'Today',
            amount: comm1,
            isCredit: true,
            status: 'verified',
            note: `Direct referral ${buyerUser.name} purchased Level ${planLevel} VIP plan (₹${planPrice}). 4.5% commission credited (+₹${comm1})!`,
          };

          setRegisteredUsers((prev) =>
            prev.map((u) =>
              normalizeMobile(u.mobile) === u1Clean
                ? {
                    ...u,
                    balance: u.balance + comm1,
                    totalEarned: u.totalEarned + comm1,
                    referralEarnings: (u.referralEarnings || 0) + comm1,
                    transactions: [u1Tx, ...(u.transactions || [])],
                  }
                : u
            )
          );

          if (normalizeMobile(user.mobile) === u1Clean) {
            setUser((curr) => ({
              ...curr,
              balance: curr.balance + comm1,
              totalEarned: curr.totalEarned + comm1,
              referralEarnings: (curr.referralEarnings || 0) + comm1,
            }));
            setTransactions((prev) => [u1Tx, ...prev]);
            setNotifications((prev) => [
              {
                id: `notif_${Date.now()}`,
                title: `🎉 Level 1 Commission (+₹${comm1})!`,
                message: `Direct referral ${buyerUser.name} purchased Level ${planLevel} plan. ₹${comm1} (4.5%) credited to your wallet!`,
                time: 'Just now',
                read: false,
                type: 'reward',
              },
              ...prev,
            ]);
          }

          try {
            const u1Ref = doc(db, 'users', u1Clean);
            const u1Snap = await getDoc(u1Ref);
            const existingU1Txs = u1Snap.exists() && u1Snap.data().transactions ? u1Snap.data().transactions : [];
            await setDoc(
              u1Ref,
              {
                balance: increment(comm1),
                totalEarned: increment(comm1),
                referralEarnings: increment(comm1),
                transactions: [u1Tx, ...existingU1Txs],
              },
              { merge: true }
            );
          } catch (e) {
            console.warn('Failed to update Level 1 upline in Firestore:', e);
          }
        }

        // 2. Level 2 Upline (Referrer of upline1) - 1.5%
        if (upline1.referredBy) {
          const upline2 = registeredUsers.find((u) => u.referralCode === upline1.referredBy);
          if (upline2) {
            const comm2 = Math.round(planPrice * 0.015 * 100) / 100;
            if (comm2 > 0) {
              const u2Clean = normalizeMobile(upline2.mobile);
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

              setRegisteredUsers((prev) =>
                prev.map((u) =>
                  normalizeMobile(u.mobile) === u2Clean
                    ? {
                        ...u,
                        balance: u.balance + comm2,
                        totalEarned: u.totalEarned + comm2,
                        referralEarnings: (u.referralEarnings || 0) + comm2,
                        transactions: [u2Tx, ...(u.transactions || [])],
                      }
                    : u
                )
              );

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
                const existingU2Txs = u2Snap.exists() && u2Snap.data().transactions ? u2Snap.data().transactions : [];
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

            // 3. Level 3+ Upline (Referrer of upline2 & downstream) - 1.0%
            if (upline2.referredBy) {
              const upline3 = registeredUsers.find((u) => u.referralCode === upline2.referredBy);
              if (upline3) {
                const comm3 = Math.round(planPrice * 0.01 * 100) / 100;
                if (comm3 > 0) {
                  const u3Clean = normalizeMobile(upline3.mobile);
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

                  setRegisteredUsers((prev) =>
                    prev.map((u) =>
                      normalizeMobile(u.mobile) === u3Clean
                        ? {
                            ...u,
                            balance: u.balance + comm3,
                            totalEarned: u.totalEarned + comm3,
                            referralEarnings: (u.referralEarnings || 0) + comm3,
                            transactions: [u3Tx, ...(u.transactions || [])],
                          }
                        : u
                    )
                  );

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
                    const existingU3Txs = u3Snap.exists() && u3Snap.data().transactions ? u3Snap.data().transactions : [];
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
  // "AUR 2 DIN TAK FREE WALA BHI 2 VD MILE TASK KE RUP ME"
  const { isFreeTrialActive, freeTrialHoursLeft } = React.useMemo(() => {
    if (!user) return { isFreeTrialActive: true, freeTrialHoursLeft: 48 };
    const now = Date.now();
    let joinedMs = user.joinedTimestamp;
    if (!joinedMs && user.joinedDate) {
      try {
        const parsed = new Date(user.joinedDate).getTime();
        if (!isNaN(parsed)) joinedMs = parsed;
      } catch {}
    }
    if (!joinedMs) joinedMs = now;

    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const elapsed = now - joinedMs;
    const remainingMs = Math.max(0, twoDaysMs - elapsed);
    const hoursLeft = Math.ceil(remainingMs / (60 * 60 * 1000));
    return {
      isFreeTrialActive: elapsed <= twoDaysMs,
      freeTrialHoursLeft: hoursLeft,
    };
  }, [user.joinedTimestamp, user.joinedDate]);

  // Multi-Plan System:
  // If user is within their 2-day free trial, they get 2 Free Videos from Level 0!
  // Plus, any VIP levels they purchased (Level 1, Level 2, etc.) are active simultaneously!
  const activeUserPlans: PlanItem[] = React.useMemo(() => {
    const purchasedIds = user.purchasedPlanIds || [];
    const validPurchased = plans.filter((p) => p.level > 0 && purchasedIds.includes(p.id));
    const sortedPurchased = validPurchased.sort((a, b) => a.level - b.level);
    const level0FreePlan = plans.find((p) => p.level === 0) || plans[0];

    if (isFreeTrialActive) {
      // Free 2-day trial is active! Include Level 0 Free Plan (2 videos) + any purchased VIP plans
      return [level0FreePlan, ...sortedPurchased];
    } else {
      // 2-day free trial expired!
      if (sortedPurchased.length > 0) {
        return sortedPurchased;
      }
      if (typeof user.vipLevel === 'number' && user.vipLevel > 0) {
        const match = plans.find((p) => p.level === user.vipLevel);
        if (match) return [match];
      }
      return [];
    }
  }, [plans, user.vipLevel, user.purchasedPlanIds, isFreeTrialActive]);

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
          const merged = { ...cloudSettings, adminPassword: activePassword };
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
    if (activeUserPlans.length === 0) {
      showToast('⚠️ Your 2-day free trial has expired! Please activate a VIP level to continue earning from video tasks.');
      navigate('member_plans');
      return;
    }
    if (!canWatchMoreVideos || todayVideosWatched >= maxDailyVideos) {
      showToast(`❌ Aaj ka video task quota pura ho chuka hai (${todayVideosWatched}/${maxDailyVideos})! Naye tasks kal milenge ya aur task pane ke liye VIP upgrade karein.`);
      return;
    }
    const chosenNum = taskNum || Math.min(maxDailyVideos, todayVideosWatched + 1);
    if (chosenNum <= todayVideosWatched) {
      showToast(`✓ Task #${chosenNum} pehle hi complete ho chuka hai! Agla pending task dekhein.`);
      return;
    }
    setCurrentPlayingTaskNum(chosenNum);
    setIsWatchingVideo(true);
  };

  const submitYouTubeVideoTask = (videoTitle?: string, videoUrl?: string) => {
    setIsWatchingVideo(false);

    // Strictly enforce mission daily limit
    if (!canWatchMoreVideos || todayVideosWatched >= maxDailyVideos) {
      showToast(`❌ Aaj ka video task quota complete ho chuka hai (${todayVideosWatched}/${maxDailyVideos})! Aur task dekhne ke liye VIP upgrade karein.`);
      return;
    }

    const nextCount = todayVideosWatched + 1;
    if (nextCount > maxDailyVideos) {
      showToast(`❌ Aaj ka video task quota complete ho chuka hai (${todayVideosWatched}/${maxDailyVideos})!`);
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
    // "AUR 2ND PERSION TASK KAREGA KO 1ST PERSION KO ROJ KE TO 1.6% MILEGA"
    if (user.referredBy) {
      const upline1 = registeredUsers.find((u) => u.referralCode === user.referredBy);
      if (upline1) {
        const taskComm = Math.round(reward * 0.016 * 100) / 100;
        if (taskComm > 0) {
          const u1Clean = normalizeMobile(upline1.mobile);
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

          setRegisteredUsers((prev) =>
            prev.map((u) =>
              normalizeMobile(u.mobile) === u1Clean
                ? {
                    ...u,
                    balance: u.balance + taskComm,
                    totalEarned: u.totalEarned + taskComm,
                    teamTaskEarnings: (u.teamTaskEarnings || 0) + taskComm,
                    transactions: [taskTx, ...(u.transactions || [])],
                  }
                : u
            )
          );

          if (normalizeMobile(user.mobile) === u1Clean) {
            setUser((curr) => ({
              ...curr,
              balance: curr.balance + taskComm,
              totalEarned: curr.totalEarned + taskComm,
              teamTaskEarnings: (curr.teamTaskEarnings || 0) + taskComm,
            }));
            setTransactions((prev) => [taskTx, ...prev]);
          }

          try {
            updateDoc(doc(db, 'users', u1Clean), {
              balance: increment(taskComm),
              totalEarned: increment(taskComm),
              teamTaskEarnings: increment(taskComm),
            }).catch(() => {});
          } catch {}
        }
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
    showToast(`User balance adjusted by ${isCredit ? '+' : '-'}₹${amount}`);
  };

  const adminUpdateUser = (mobile: string, updates: Partial<RegisteredUserAccount>) => {
    const clean = normalizeMobile(mobile);
    try {
      setDoc(doc(db, 'users', clean), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore update failed', e);
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

    if (normalizeMobile(user.mobile) === clean) {
      setUser((prev) => ({ ...prev, ...updates }));
    }
    showToast('User record updated successfully!');
  };

  const adminDeleteUser = (mobile: string) => {
    const clean = normalizeMobile(mobile);
    try {
      deleteDoc(doc(db, 'users', clean));
    } catch (e) {
      console.warn('Firestore delete failed', e);
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
    showToast('User deleted from database.');
  };

  const addVIPPlan = async (newPlan: PlanItem): Promise<boolean> => {
    try {
      await setDoc(doc(db, 'vip_plans', newPlan.id), newPlan, { merge: true });
      setPlans((prev) => {
        const filtered = prev.filter((p) => p.id !== newPlan.id);
        const next = [...filtered, newPlan].sort((a, b) => (a.level || 0) - (b.level || 0));
        try {
          localStorage.setItem('taskvibe_plans', JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`✓ VIP Plan "${newPlan.title}" added to cloud!`);
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
      setPlans((prev) => {
        const next = prev.map((p) => (p.id === planId ? { ...p, ...updates } : p));
        try {
          localStorage.setItem('taskvibe_plans', JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast('✓ VIP Plan updated in cloud database!');
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
      setPlans((prev) => {
        const next = prev.filter((p) => p.id !== planId);
        try {
          localStorage.setItem('taskvibe_plans', JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast('✓ VIP Plan deleted from cloud database.');
      return true;
    } catch (err) {
      console.error('Failed to delete VIP plan from Firestore', err);
      showToast('❌ Failed to delete VIP plan');
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
      showToast('Database successfully restored! 🎉');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Invalid backup JSON file.');
      return false;
    }
  };

  const updateAdminSettings = async (newSettings: Partial<AdminSettings>) => {
    const updated = { ...adminSettings, ...newSettings };
    setAdminSettings(updated);
    try {
      localStorage.setItem('taskvibe_admin_settings', JSON.stringify(updated));
      await setDoc(doc(db, 'settings', 'admin'), updated, { merge: true });
    } catch (e) {
      console.warn('Could not save settings to Firestore:', e);
    }
    showToast('Admin settings saved successfully!');
  };

  const addNewSurvey = (title: string, reward: number, description: string) => {
    const newSurvey: SurveyItem = {
      id: `srv_${Date.now()}`,
      title,
      reward,
      date: 'Available Now',
      completed: false,
      description: description || 'New opinion research task',
    };
    setSurveys((prev) => [newSurvey, ...prev]);
    showToast('New survey added to user dashboard!');
  };

  const deleteSurvey = (id: string) => {
    setSurveys((prev) => prev.filter((s) => s.id !== id));
    showToast('Survey removed.');
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
        updatePlan,
        addVIPPlan,
        updateVIPPlan,
        deleteVIPPlan,
        resetUserDailyTasks,
        exportCompleteDatabase,
        importCompleteDatabase,
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
