export type ScreenType =
  | 'splash'
  | 'login'
  | 'register'
  | 'home'
  | 'add_money'
  | 'purchase_confirmed'
  | 'daily_survey'
  | 'referral_earn'
  | 'wallet'
  | 'withdraw'
  | 'member_plans'
  | 'mission'
  | 'record'
  | 'help_center'
  | 'profile'
  | 'plan_detail'
  | 'admin';

export type BottomTabType = 'home' | 'member' | 'mission' | 'record' | 'me';

export interface AdminSettings {
  adminUpiId: string;
  adminMerchantName: string;
  adminPassword?: string;
  adminQrCodeUrl?: string;
  minWithdrawal: number;
  dailySurveyReward: number;
  referralBonus: number;
  youtubeVideoId: string;
  youtubeVideoUrls?: string[];
  youtubeVideoTitle: string;
  youtubeVideoReward: number;
  youtubeVideoDurationSec: number;
  supportWhatsapp?: string;
  supportTelegram?: string;
  vipSupportTelegram?: string;
  // WhatsApp API Gateway Settings
  whatsappApiEnabled?: boolean;
  whatsappProvider?: 'meta_cloud' | 'green_api' | 'ultramsg' | 'evolution' | 'renflair' | 'custom' | 'direct';
  whatsappApiToken?: string;
  whatsappInstanceId?: string;
  whatsappPhoneNumberId?: string;
  whatsappWabaId?: string;
  whatsappApiUrl?: string;
  whatsappSupportNumber?: string;
  whatsappAutoWelcome?: boolean;
  whatsappAutoDepositNotify?: boolean;
  whatsappAutoWithdrawNotify?: boolean;
  whatsappWelcomeMessage?: string;
  // Renflair WhatsApp OTP specific
  renflairApiKey?: string;
  renflairApiUrl?: string;
  renflairMethod?: 'GET' | 'POST';
  renflairSenderId?: string;
  announcementEnabled?: boolean;
  announcementTitle?: string;
  announcementMessage?: string;
  announcementTag?: string;
  announcementButtonText?: string;
  announcementButtonAction?: 'member_plans' | 'referral_earn' | 'wallet' | 'none';
  announcementDate?: string;
  // Payment Gateway API Settings
  paymentGatewayEnabled?: boolean;
  paymentGatewayProvider?: 'phonepe' | 'razorpay' | 'cashfree' | 'paytm' | 'upi_gateway' | 'manual';
  paymentGatewayMerchantId?: string;
  paymentGatewayApiKey?: string;
  paymentGatewayApiSecret?: string;
  paymentGatewayWebhookSecret?: string;
  paymentGatewayCallbackUrl?: string;
  paymentGatewayAutoApprove?: boolean;
  paymentGatewayTestMode?: boolean;
  // Withdrawal window & timings
  withdrawalStartTime?: string;
  withdrawalEndTime?: string;
  withdrawalDaysNotice?: string;
  payoutTimingNotice?: string;
  // App Maintenance Mode
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  // App Version & Update Alert
  appVersion?: string;
  apkDownloadUrl?: string;
  forceUpdateEnabled?: boolean;
  updateChangelog?: string;
  // Add Money Extra Bonus & Tiers
  addMoneyTiers?: AddMoneyTier[];
  // VIP Plans persistent cloud backup
  plans?: PlanItem[];
}

export interface AddMoneyTier {
  amount: number;
  bonus: number;
  popular?: boolean;
}


export interface UserProfile {
  name: string;
  mobile: string;
  email: string;
  referralCode: string;
  referredBy?: string;
  balance: number;
  totalEarned: number;
  todayEarnings?: number;
  totalEarnings?: number;
  withdrawn: number;
  upiId: string;
  joinedDate: string;
  joinedTimestamp?: number;
  vipLevel?: number;
  vipTag?: string;
  password?: string;
  assignedVideoUrl?: string;
  assignedVideoTitle?: string;
  assignedReward?: number;
  todayVideosWatched?: number;
  lastVideoWatchDate?: string;
  purchasedPlanIds?: string[];
  freeTrialOverride?: 'auto' | 'enabled' | 'disabled';
  trialStartedAt?: number;
  isNewTrialEligible?: boolean;
  referralEarnings?: number;
  teamTaskEarnings?: number;
  firstPlanReferralBonusPaid?: boolean;
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  isBlocked?: boolean;
  blockedReason?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  isSuspicious?: boolean;
  suspiciousReason?: string;
  adminAlertMessage?: string;
  adminAlertTimestamp?: number;
  completedCustomTasks?: string[];
  notifications?: AppNotification[];
}

export interface RegisteredUserAccount extends UserProfile {
  password: string;
  transactions?: TransactionItem[];
}

export interface PlanItem {
  id: string;
  level: number;
  levelTag: string;
  tagColor: string;
  badge: string;
  price: number;
  amount: number;
  bonus: number;
  dailyIncome: number;
  dailyMissions: number;
  perMission: number;
  validity: string;
  title: string;
  recommended?: boolean;
  benefits: string[];
}

export interface VideoMissionDef {
  index: number;
  planLevel: number;
  planTag: string;
  levelIndex: number;
  levelTotal: number;
  reward: number;
  title: string;
}

export interface PaymentDeposit {
  id: string;
  userId?: string;
  userName: string;
  userMobile: string;
  amount: number;
  bonus: number;
  planLevel?: number;
  planTitle?: string;
  depositType: 'add_money' | 'plan_purchase';
  adminUpiId: string;
  utrNumber: string;
  screenshotUrl?: string; // Base64 or image preview URL
  submittedAt: string;
  timestamp?: number;
  status: 'in_process' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface TransactionItem {
  id: string;
  type: 'purchase_reward' | 'survey_reward' | 'referral_reward' | 'withdrawal' | 'add_money' | 'purchase' | 'video_reward' | 'promo_reward' | 'task_earning';
  title: string;
  date: string;
  timestamp?: number;
  taskDate?: string;
  amount: number;
  isCredit: boolean;
  status: 'verified' | 'completed' | 'pending' | 'failed' | 'in_process';
  orderId?: string;
  note?: string;
  screenshotUrl?: string;
  utrNumber?: string;
  payoutMethod?: 'upi' | 'bank';
  payoutDetails?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  reward: number;
  category: 'survey' | 'video' | 'referral' | 'purchase';
  status: 'all' | 'in_progress' | 'completed';
  progress: number;
  maxProgress: number;
}

export interface TaskSubmission {
  id: string;
  userId?: string;
  userName: string;
  userMobile: string;
  taskType: 'youtube_video' | 'daily_survey';
  title: string;
  reward: number;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  videoTitle?: string;
  videoUrl?: string;
  surveyAnswers?: Record<number, string>;
}

export interface SurveyItem {
  id: string;
  title: string;
  reward: number;
  date: string;
  completed: boolean;
  description: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'reward' | 'system' | 'withdrawal' | 'security';
}

export interface SupportTicket {
  id: string;
  userId?: string;
  userName: string;
  userMobile: string;
  category: 'payment' | 'withdrawal' | 'task' | 'plan' | 'other';
  subject: string;
  message: string;
  screenshotUrl?: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  adminReply?: string;
  repliedAt?: string;
}

export interface PromoCode {
  id: string;
  code: string; // Uppercase, e.g. "WELCOME50"
  rewardAmount: number; // In Rupees, e.g. 50
  usageLimit: number; // Total redemptions allowed, e.g. 500
  usedCount: number; // Current redemptions
  usedByUsers: string[]; // List of mobile numbers that redeemed
  isActive: boolean;
  createdAt: string;
  expiryDate?: string;
  description?: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: number;
  dateStr: string;
  adminAction:
    | 'balance_increase'
    | 'balance_decrease'
    | 'user_ban'
    | 'user_unban'
    | 'withdrawal_approved'
    | 'withdrawal_rejected'
    | 'deposit_approved'
    | 'deposit_rejected'
    | 'custom_notification'
    | 'clean_test_data';
  targetMobile: string;
  targetName?: string;
  oldValue?: string | number;
  newValue?: string | number;
  difference?: string | number;
  reason: string;
}

export interface CustomTaskItem {
  id: string;
  title: string;
  description: string;
  reward: number;
  link: string;
  category: 'telegram' | 'app' | 'social' | 'survey' | 'general';
  actionLabel?: string;
  status: 'active' | 'inactive';
  completionsCount?: number;
  createdAt: number;
}


