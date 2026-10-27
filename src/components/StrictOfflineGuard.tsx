import React from 'react';

interface StrictOfflineGuardProps {
  children?: React.ReactNode;
}

/**
 * StrictOfflineGuard: Non-blocking wrapper.
 * Ensures the app never blocks the user with full-screen error overlays
 * when internet is slow or temporarily offline. The app continues to operate
 * smoothly and synchronizes in the background when network improves.
 */
export const StrictOfflineGuard: React.FC<StrictOfflineGuardProps> = ({ children }) => {
  return <>{children}</>;
};
