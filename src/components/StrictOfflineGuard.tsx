import React from 'react';

interface StrictOfflineGuardProps {
  children?: React.ReactNode;
}

/**
 * StrictOfflineGuard:
 * Non-blocking pass-through container.
 * Zero popups: When internet/mobile data is turned off, no modal or blocker popup is shown.
 * The app remains open and accessible; network calls naturally wait and buffer smoothly
 * like any standard mobile app.
 */
export const StrictOfflineGuard: React.FC<StrictOfflineGuardProps> = ({ children }) => {
  return <>{children}</>;
};
