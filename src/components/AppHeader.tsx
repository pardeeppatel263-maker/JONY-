import React from 'react';
import { ArrowLeft, Bell, Menu, User as UserIcon, RefreshCw, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskVibeLogo } from './TaskVibeLogo';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showHomeActions?: boolean;
  customRight?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
  showHomeActions = false,
  customRight,
}) => {
  const {
    goBack,
    navigate,
    notifications,
    setIsNotificationsOpen,
    refreshAppData,
    isRefreshing,
    isUpdateAvailable,
    setIsUpdateModalOpen,
    adminSettings,
  } = useApp();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md px-4 py-3">
      <div className="flex items-center justify-between">
        {showBack ? (
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              aria-label="Go Back"
              className="p-1.5 -ml-1 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            {title && (
              <h1 className="text-base font-bold tracking-tight text-white line-clamp-1">
                {title}
              </h1>
            )}
          </div>
        ) : showHomeActions ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('help_center')}
              aria-label="Navigation Menu"
              className="p-1.5 -ml-1 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <TaskVibeLogo size="sm" theme="on-blue" showSubtitle={true} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <TaskVibeLogo size="sm" theme="on-blue" showSubtitle={true} />
          </div>
        )}

        <div className="flex items-center gap-2">
          {customRight}

          {showHomeActions && (
            <>
              {/* In-App 1-Click Update Button Badge */}
              {isUpdateAvailable && (
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(true)}
                  title="New ZoroTask APK update available (1-Click in-place install)"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 text-slate-950 text-[10px] font-black shadow-md shadow-orange-500/25 active:scale-95 transition cursor-pointer animate-pulse"
                >
                  <Sparkles className="w-3 h-3 text-slate-950 shrink-0" />
                  <span className="whitespace-nowrap">Update v{adminSettings.appVersion || '2.7'} ⚡</span>
                </button>
              )}

              {/* Cloud Refresh Button */}
              <button
                onClick={() => refreshAppData()}
                disabled={isRefreshing}
                aria-label="Refresh Data from Cloud"
                title="Refresh App Data"
                className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-300' : ''}`} />
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setIsNotificationsOpen(true)}
                aria-label="Notifications"
                className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95 cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-blue-700 animate-pulse" />
                )}
              </button>

              {/* Profile Avatar */}
              <button
                onClick={() => navigate('profile')}
                aria-label="User Profile"
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-300 to-amber-500 text-blue-900 font-bold text-xs flex items-center justify-center ring-2 ring-white/30 shadow-sm active:scale-95 cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-blue-950" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
