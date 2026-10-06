import React from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import {
  User,
  Users,
  Share2,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Mail,
  Copy,
  Headphones,
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const {
    user,
    logout,
    navigate,
    copyText,
    setIsTeamModalOpen,
    setIsEditProfileOpen,
    showToast,
  } = useApp();

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-slate-50">
      {/* FIXED TOP HEADER */}
      <div className="shrink-0 z-30">
        <AppHeader title="Me" showBack={true} />
      </div>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <main className="p-4 space-y-4 max-w-md mx-auto pb-6">
          {/* User Profile Card matching Screenshot 15 */}
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white rounded-2xl p-4 shadow-md flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-300 via-amber-400 to-yellow-200 text-blue-950 font-black text-xl flex items-center justify-center shadow-md ring-4 ring-white/20 shrink-0">
              {user.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black truncate">{user.name}</h2>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-md tracking-wider">
                  {user.referralCode}
                </span>
                <button
                  onClick={() => copyText(user.referralCode, 'Referral code')}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  aria-label="Copy Referral Code"
                >
                  <Copy className="w-3 h-3 text-blue-200" />
                </button>
              </div>

              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="text-[11px] text-amber-300 font-bold hover:underline mt-1 block"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Quick Balance Preview in Profile */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Current Wallet Balance
              </span>
              <p className="text-lg font-black text-slate-900 mt-0.5">
                ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={() => navigate('wallet')}
              className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
            >
              Open Wallet
            </button>
          </div>

          {/* Menu Items List matching Screenshot 15 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* Personal Info */}
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Personal Info</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Team Report */}
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Team Report</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Invite Friends */}
            <button
              onClick={() => navigate('referral_earn')}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Share2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Invite Friends</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Help & Support (WhatsApp & Telegram) */}
            <button
              onClick={() => navigate('help_center')}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block leading-tight">Help &amp; Support</span>
                  <span className="text-[10px] text-slate-400">WhatsApp &amp; Telegram Contact</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-rose-50/60 transition-colors text-rose-600 border-t border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Logout</span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-300" />
            </button>
          </div>
        </main>
      </div>

      {/* FIXED BOTTOM NAV */}
      <div className="shrink-0 z-30">
        <BottomNav />
      </div>
    </div>
  );
};
