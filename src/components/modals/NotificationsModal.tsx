import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bell, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export const NotificationsModal: React.FC = () => {
  const { isNotificationsOpen, setIsNotificationsOpen, notifications } = useApp();

  if (!isNotificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-300" />
            <h3 className="text-sm font-bold">Notifications</h3>
          </div>
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="p-1 rounded-full text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-2xl border border-slate-100 bg-slate-50 space-y-1 hover:bg-slate-100/80 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {n.title}
                </span>
                <span className="text-[10px] text-slate-400">{n.time}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
