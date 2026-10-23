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
import { PromoCodeModal } from './components/modals/PromoCodeModal';
import { ExitConfirmationModal } from './components/modals/ExitConfirmationModal';
import { Wrench, ShieldCheck, Download, Sparkles, RefreshCw, Lock, MessageSquare } from 'lucide-react';

const ScreenRouter: React.FC = () => {
  const { currentScreen, isLoggedIn, adminSettings, navigate } = useApp();

  // If maintenance mode is enabled and user is not admin
  if (adminSettings.maintenanceMode && currentScreen !== 'admin') {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10 animate-bounce">
          <Wrench className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            System Upgrade
          </span>
          <h2 className="text-xl font-black text-white">Under Scheduled Maintenance</h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            {adminSettings.maintenanceMessage ||
              'ZoroTask is undergoing scheduled server optimization. All user wallet balances, VIP plans, and referral bonuses are 100% secure. Normal operations will resume shortly!'}
          </p>
        </div>

        <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5 max-w-xs">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Data & Funds Safe</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Automated payouts & tasks will resume immediately after maintenance completion.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 w-full max-w-xs">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Page</span>
          </button>

          {(adminSettings.whatsappSupportNumber || adminSettings.supportWhatsapp) && (
            <a
              href={`https://wa.me/${(adminSettings.whatsappSupportNumber || adminSettings.supportWhatsapp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello ZoroTask Support! I need assistance regarding the current system maintenance.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>
          )}
        </div>

        <button
          onClick={() => navigate('admin')}
          className="text-[11px] text-slate-400 hover:text-amber-400 transition flex items-center gap-1.5 pt-2 underline underline-offset-4 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Admin Console Access</span>
        </button>
      </div>
    );
  }

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
  const {
    currentScreen,
    navigate,
    adminSettings,
    isPromoModalOpen,
    setIsPromoModalOpen,
    isExitModalOpen,
    setIsExitModalOpen,
    exitApp,
  } = useApp();
  const [dismissUpdateModal, setDismissUpdateModal] = React.useState(false);

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

  // When Maintenance Mode is active and not on admin, completely isolate screen from any user modals
  if (adminSettings.maintenanceMode) {
    return (
      <MobileFrame>
        <ScreenRouter />
        <Toast />
      </MobileFrame>
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
      <PromoCodeModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
      />
      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={exitApp}
      />

      {/* App Update Prompt Modal if enabled by admin */}
      {adminSettings.forceUpdateEnabled && !dismissUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/20">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                Version {adminSettings.appVersion || '2.6.0'} Available
              </span>
              <h3 className="text-base font-black text-white">Update ZoroTask App</h3>
              <p className="text-[11px] text-slate-300 leading-snug">
                {adminSettings.updateChangelog ||
                  'New version includes faster YouTube video task streaming, UPI QR proof auto-scanner, live wallet sync, and bug fixes.'}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={`${adminSettings.apkDownloadUrl || '/ZoroTask-Official.apk'}${
                  (adminSettings.apkDownloadUrl || '/ZoroTask-Official.apk').includes('?') ? '&' : '?'
                }t=${Date.now()}`}
                download={`ZoroTask-Official-v${adminSettings.appVersion || '2.6.0'}.apk`}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 active:scale-98 transition block"
              >
                <Download className="w-4 h-4" />
                <span>Download Official APK (v{adminSettings.appVersion || '2.6.0'} - 9.0MB)</span>
              </a>

              <button
                type="button"
                onClick={() => setDismissUpdateModal(true)}
                className="w-full py-2 text-[11px] font-bold text-slate-400 hover:text-white transition"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
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
