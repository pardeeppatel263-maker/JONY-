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
  whatsappInstanceId?: string;
  whatsappApiToken?: string;
  announcementEnabled?: boolean;
  announcementTitle?: string;
  announcementMessage?: string;
  announcementTag?: string;
  announcementButtonText?: string;
  announcementButtonAction?: 'member_plans' | 'referral_earn' | 'wallet' | 'none';
  announcementDate?: string;
}


export interface UserProfile {
  name: string;
  mobile: string;
  email: string;
  referralCode: string;
  referredBy?: string;
  balance: number;
  totalEarned: number;
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
  referralEarnings?: number;
  teamTaskEarnings?: number;
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
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
  type: 'purchase_reward' | 'survey_reward' | 'referral_reward' | 'withdrawal' | 'add_money' | 'purchase' | 'video_reward';
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
