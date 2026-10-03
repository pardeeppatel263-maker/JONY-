import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-full shadow-xl border border-slate-700/80 flex items-center gap-2 max-w-xs text-xs font-semibold text-center">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="line-clamp-2">{toastMessage}</span>
      </div>
    </div>
  );
};
