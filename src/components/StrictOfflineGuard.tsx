import React from 'react';

interface StrictOfflineGuardProps {
  children?: React.ReactNode;
}

/**
 * StrictOfflineGuard:
 * The blocking offline popup modal has been completely turned off / disabled.
 * The app renders smoothly without interrupting the user with full-screen network error popups.
 */
export const StrictOfflineGuard: React.FC<StrictOfflineGuardProps> = ({ children }) => {
  return <>{children}</>;
};

export default StrictOfflineGuard;
