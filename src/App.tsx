/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileFrame } from './components/MobileFrame';
import { Toast } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

// All 16 Screens matching the provided image
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AddMoneyScreen } from './screens/AddMoneyScreen';
import { PurchaseProductsScreen } from './screens/PurchaseProductsScreen';
import { DailySurveyScreen } from './screens/DailySurveyScreen';
import { ReferralEarnScreen } from './screens/ReferralEarnScreen';
import { WalletScreen } from './screens/WalletScreen';
import { WithdrawScreen } from './screens/WithdrawScreen';
import { MemberPlansScreen } from './screens/MemberPlansScreen';
import { MissionTasksScreen } from './screens/MissionTasksScreen';
import { RecordScreen } from './screens/RecordScreen';
import { HelpCenterScreen } from './screens/HelpCenterScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { PlanDetailScreen } from './screens/PlanDetailScreen';
import { AdminPanelScreen } from './screens/AdminPanelScreen';

// Interactive Modals
import { SurveyModal } from './components/modals/SurveyModal';
import { UPIPaymentModal } from './components/modals/UPIPaymentModal';
import { VideoTaskModal } from './components/modals/VideoTaskModal';
import { TeamModal } from './components/modals/TeamModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { EditProfileModal } from './components/modals/EditProfileModal';

const ScreenRouter: React.FC = () => {
  const { currentScreen, isLoggedIn } = useApp();

  // Enforce login for unauthenticated users
  if (!isLoggedIn) {
    if (currentScreen === 'register') {
      return <RegisterScreen />;
    }
    if (currentScreen === 'splash') {
      return <SplashScreen />;
    }
    return <LoginScreen />;
  }

  switch (currentScreen) {
    case 'splash':
    case 'login':
    case 'register':
    case 'home':
      return <HomeScreen />;
    case 'add_money':
      return <AddMoneyScreen />;
    case 'purchase_confirmed':
      return <PurchaseProductsScreen />;
    case 'daily_survey':
      return <DailySurveyScreen />;
    case 'referral_earn':
      return <ReferralEarnScreen />;
    case 'wallet':
      return <WalletScreen />;
    case 'withdraw':
      return <WithdrawScreen />;
    case 'member_plans':
      return <MemberPlansScreen />;
    case 'mission':
      return <MissionTasksScreen />;
    case 'record':
      return <RecordScreen />;
    case 'help_center':
      return <HelpCenterScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'plan_detail':
      return <PlanDetailScreen />;
    case 'admin':
      return <AdminPanelScreen />;
    default:
      return <HomeScreen />;
  }
};

const MainApp: React.FC = () => {
  const { currentScreen, navigate } = useApp();

  // Check if URL has ?admin or #admin or /admin on initial mount for direct admin access
  React.useEffect(() => {
    const isSpecialAdminUrl =
      window.location.search.includes('admin') ||
      window.location.hash.includes('admin') ||
      window.location.pathname.endsWith('/admin');
    if (isSpecialAdminUrl) {
      navigate('admin');
    }
  }, []);

  // If Admin screen is active, show full-screen professional Admin Dashboard (not inside mobile frame)
  if (currentScreen === 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <AdminPanelScreen />
        <Toast />
      </div>
    );
  }

  return (
    <MobileFrame>
      <ScreenRouter />
      <Toast />
      <SurveyModal />
      <UPIPaymentModal />
      <VideoTaskModal />
      <TeamModal />
      <NotificationsModal />
      <EditProfileModal />
    </MobileFrame>
  );
};

export function App() {
  return (
    <ErrorBoundary fallbackTitle="ZoroTask Initialization Issue">
      <AppProvider>
        <ErrorBoundary fallbackTitle="ZoroTask View Error">
          <MainApp />
        </ErrorBoundary>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
