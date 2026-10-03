import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="w-full h-[100dvh] min-h-[100dvh] bg-slate-950 flex items-center justify-center p-0 md:p-4 font-sans overflow-hidden">
      {/* Responsive Container: on real mobile screens it takes exact 100% width and 100dvh height, on larger desktop screens it appears centered in a sleek phone container */}
      <div className="w-full max-w-full md:max-w-[430px] bg-slate-50 md:rounded-[40px] md:shadow-[0_0_50px_rgba(0,0,0,0.7)] overflow-hidden border-0 md:border-[7px] md:border-slate-800 flex flex-col relative h-[100dvh] md:h-[860px] md:max-h-[92dvh]">
        {/* Screen Content Container - flex column with zero outer scroll so header & footer stay fixed, min-h-0 enables nested flex scrolling */}
        <div className="flex-1 min-h-0 flex flex-col h-full w-full overflow-hidden relative bg-slate-50">
          {children}
        </div>

        {/* Bottom indicator bar for simulated phone home indicator on desktop only */}
        <div className="h-3 bg-white shrink-0 items-center justify-center select-none hidden md:flex border-t border-slate-100">
          <div className="w-24 h-1 bg-slate-300 rounded-full" />
        </div>
      </div>
    </div>
  );
};


