import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { TaskVibeLogo } from '../components/TaskVibeLogo';

export const SplashScreen: React.FC = () => {
  const { navigate, isLoggedIn } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        navigate('home');
      } else {
        navigate('login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoggedIn, navigate]);

  return (
    <div className="flex flex-col items-center justify-between h-full bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 text-white p-8 select-none">
      <div className="w-full flex justify-end pt-4">
        <span className="text-[10px] uppercase tracking-widest text-blue-300 font-bold bg-white/10 px-2.5 py-1 rounded-full">
          v2.5 Official
        </span>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-amber-400 p-0.5 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
              <TaskVibeLogo size="xl" iconOnly={true} />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-slate-950 shadow-md">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white">
            Zoro<span className="text-amber-400">Task</span>
          </h1>
          <p className="text-xs text-blue-200/80 font-medium">
            Daily Tasks &bull; Instant UPI &bull; VIP Earnings
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-3 pb-6">
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Secure &amp; Verified Platform</span>
        </div>

        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-r from-blue-500 to-amber-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};
