import { AdminSettings, UserProfile } from '../types';

export interface SpinStatusResult {
  allowed: boolean;
  reason: string;
  badgeText?: string;
  dailyLimit: number;
  spinsUsedToday: number;
  freeSpinsLeft: number;
}

export function getSpinPrizesFromSettings(adminSettings?: Partial<AdminSettings> | null) {
  const amounts =
    Array.isArray(adminSettings?.spinPrizes) && adminSettings!.spinPrizes.length === 8
      ? adminSettings!.spinPrizes
      : [5, 10, 25, 50, 100, 0, 2, 15];

  const palette = [
    { color: '#10B981', textColor: '#FFFFFF' },
    { color: '#8B5CF6', textColor: '#FFFFFF' },
    { color: '#F59E0B', textColor: '#FFFFFF' },
    { color: '#EC4899', textColor: '#FFFFFF' },
    { color: '#EAB308', textColor: '#000000' },
    { color: '#06B6D4', textColor: '#FFFFFF' },
    { color: '#3B82F6', textColor: '#FFFFFF' },
    { color: '#F97316', textColor: '#FFFFFF' },
  ];

  return amounts.map((amt, idx) => {
    const safeAmt = Number(amt) || 0;
    const isScratchCard = idx === 5 && safeAmt === 0;
    return {
      label: isScratchCard ? '🎁 Scratch Card' : safeAmt >= 100 ? `₹${safeAmt} Mega` : `₹${safeAmt} Cash`,
      amount: safeAmt,
      isScratchCard,
      color: palette[idx % palette.length].color,
      textColor: palette[idx % palette.length].textColor,
    };
  });
}

function isWithinDailyHourWindow(now: Date, startHour?: string, endHour?: string): boolean {
  if (!startHour || !endHour) return true;
  const [sh, sm] = startHour.split(':').map(Number);
  const [eh, em] = endHour.split(':').map(Number);
  if (Number.isNaN(sh) || Number.isNaN(sm) || Number.isNaN(eh) || Number.isNaN(em)) return true;

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  if (startMins <= endMins) {
    return currentMins >= startMins && currentMins <= endMins;
  }
  // Overnight window (e.g., 21:00 to 06:00)
  return currentMins >= startMins || currentMins <= endMins;
}

export function getSpinStatus(
  adminSettings: Partial<AdminSettings> | null | undefined,
  user: Partial<UserProfile> | null | undefined,
  now: Date = new Date()
): SpinStatusResult {
  const dailyLimit =
    adminSettings?.dailyFreeSpins !== undefined ? Math.max(0, Number(adminSettings.dailyFreeSpins)) : 2;
  const todayStr = now.toISOString().split('T')[0];
  const spinsUsedToday = user?.lastSpinDate === todayStr ? Number(user?.dailySpinsUsed || 0) : 0;
  const freeSpinsLeft = Math.max(0, dailyLimit - spinsUsedToday);

  if (adminSettings?.spinEnabled === false) {
    return {
      allowed: false,
      reason: adminSettings?.spinDisabledMessage?.trim() || 'Spin & Win is currently paused by Admin. Please check back later!',
      badgeText: 'OFF',
      dailyLimit,
      spinsUsedToday,
      freeSpinsLeft,
    };
  }

  if (adminSettings?.spinStartDate) {
    const startMs = new Date(adminSettings.spinStartDate).getTime();
    if (!Number.isNaN(startMs) && now.getTime() < startMs) {
      const formatted = new Date(startMs).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        allowed: false,
        reason: `Spin & Win will open on ${formatted}. Stay tuned!`,
        badgeText: 'SOON',
        dailyLimit,
        spinsUsedToday,
        freeSpinsLeft,
      };
    }
  }

  if (adminSettings?.spinEndDate) {
    const endMs = new Date(adminSettings.spinEndDate).getTime();
    if (!Number.isNaN(endMs) && now.getTime() > endMs) {
      return {
        allowed: false,
        reason: adminSettings?.spinDisabledMessage?.trim() || 'This Spin & Win session has ended. Check back for the next event!',
        badgeText: 'ENDED',
        dailyLimit,
        spinsUsedToday,
        freeSpinsLeft,
      };
    }
  }

  if (adminSettings?.spinStartHour && adminSettings?.spinEndHour) {
    if (!isWithinDailyHourWindow(now, adminSettings.spinStartHour, adminSettings.spinEndHour)) {
      return {
        allowed: false,
        reason: `Spin & Win is open daily between ${adminSettings.spinStartHour} and ${adminSettings.spinEndHour}.`,
        badgeText: 'TIMED',
        dailyLimit,
        spinsUsedToday,
        freeSpinsLeft,
      };
    }
  }

  const totalLimit = Number(adminSettings?.spinTotalLimit || 0);
  const totalUsed = Number(adminSettings?.spinTotalSpinsUsed || 0);
  if (totalLimit > 0 && totalUsed >= totalLimit) {
    return {
      allowed: false,
      reason: adminSettings?.spinDisabledMessage?.trim() || `Global Spin & Win limit (${totalLimit} spins) has been reached!`,
      badgeText: 'FULL',
      dailyLimit,
      spinsUsedToday,
      freeSpinsLeft,
    };
  }

  const minVip = Number(adminSettings?.spinMinVipLevel || 0);
  const userVip = Number(user?.vipLevel || 0);
  if (minVip > 0 && userVip < minVip) {
    return {
      allowed: false,
      reason: `Spin & Win is currently reserved for VIP Level ${minVip}+ members. Upgrade your VIP plan to unlock!`,
      badgeText: `VIP ${minVip}+`,
      dailyLimit,
      spinsUsedToday,
      freeSpinsLeft,
    };
  }

  if (adminSettings?.spinRequireTasksCompleted) {
    const watchedToday = Number(user?.todayVideosWatched || 0);
    const customDone = Array.isArray(user?.completedCustomTasks) ? user!.completedCustomTasks.length : 0;
    if (watchedToday <= 0 && customDone <= 0) {
      return {
        allowed: false,
        reason: 'Complete at least 1 daily task today to unlock Spin & Win!',
        badgeText: 'TASK',
        dailyLimit,
        spinsUsedToday,
        freeSpinsLeft,
      };
    }
  }

  if (dailyLimit <= 0) {
    return {
      allowed: false,
      reason: adminSettings?.spinDisabledMessage?.trim() || 'Daily spins are currently set to 0 by Admin.',
      badgeText: '0 LEFT',
      dailyLimit,
      spinsUsedToday,
      freeSpinsLeft: 0,
    };
  }

  if (freeSpinsLeft <= 0) {
    return {
      allowed: false,
      reason: `Daily free spins limit (${dailyLimit}) reached! Come back tomorrow.`,
      dailyLimit,
      spinsUsedToday,
      freeSpinsLeft: 0,
    };
  }

  return {
    allowed: true,
    reason: '',
    dailyLimit,
    spinsUsedToday,
    freeSpinsLeft,
  };
}
