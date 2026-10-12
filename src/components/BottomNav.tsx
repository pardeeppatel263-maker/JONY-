import React from 'react';
import { Home, Award, Target, History, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BottomTabType } from '../types';

export const BottomNav: React.FC = () => {
  const { activeTab, switchTab } = useApp();

  const navItems: { id: BottomTabType; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'member', label: 'VIP Member', icon: Award },
    { id: 'mission', label: 'Mission', icon: Target },
    { id: 'record', label: 'Record', icon: History },
    { id: 'me', label: 'Me', icon: User },
  ];

  return (
    <nav className="sticky bottom-0 z-30 bg-white border-t border-slate-200/80 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => switchTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {item.id === 'mission' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
