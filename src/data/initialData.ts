import { UserProfile, PlanItem, TransactionItem, TaskItem, SurveyItem, AppNotification } from '../types';

export const emptyUser: UserProfile = {
  name: '',
  mobile: '',
  email: '',
  referralCode: '',
  balance: 0,
  totalEarned: 0,
  withdrawn: 0,
  upiId: '',
  joinedDate: '',
};

export const initialUser: UserProfile = emptyUser;

export const initialPlans: PlanItem[] = [];

export const initialTransactions: TransactionItem[] = [];

export const initialSurveys: SurveyItem[] = [];

export const initialTasks: TaskItem[] = [];

export const initialNotifications: AppNotification[] = [];

export const surveyQuestions = [
  {
    id: 1,
    question: 'How often do you make online purchases via UPI (PhonePe, GPay, Paytm)?',
    options: ['Daily', '3-4 times a week', 'Once a week', 'Rarely'],
  },
  {
    id: 2,
    question: 'Which factor matters most to you when completing online reward tasks?',
    options: [
      'Instant UPI wallet payout',
      'Simplicity of tasks & surveys',
      'High referral commissions',
      'Safe and verified partner merchants',
    ],
  },
  {
    id: 3,
    question: 'Would you recommend ZoroTask to your friends and family members for daily earnings?',
    options: [
      'Definitely Yes (10/10)',
      'Very Likely',
      'Maybe later',
      'Need to test withdrawal first',
    ],
  },
  {
    id: 4,
    question: 'How would you rate the overall interface and speed of the ZoroTask app?',
    options: [
      '⭐⭐⭐⭐⭐ Outstanding',
      '⭐⭐⭐⭐ Very Good',
      '⭐⭐⭐ Satisfactory',
      '⭐⭐ Needs Improvement',
    ],
  },
];
