import { RegisteredUserAccount, UserProfile } from '../types';

export function normalizeMobile10(m?: string | null): string {
  const digits = String(m || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function normalizeInviteCode(raw?: string | null): string {
  if (!raw) return '';
  let val = raw.trim();
  const match = val.match(/[?&](?:invite|ref)=([^&#\s]+)/i);
  if (match && match[1]) {
    val = decodeURIComponent(match[1]);
  }
  return val.replace(/\s/g, '').toUpperCase();
}

/**
 * Returns all normalized candidate referral identifiers that can represent a given user
 * (their ZTxxxxxx code, legacy TVxxxxxx equivalent, 6-digit numeric suffix, and 10-digit mobile).
 */
export function buildReferrerIdentifiers(
  u: Pick<UserProfile | RegisteredUserAccount, 'referralCode' | 'mobile'> | null | undefined
): Set<string> {
  const ids = new Set<string>();
  if (!u) return ids;

  const cleanMob = normalizeMobile10(u.mobile);
  const storedCode = normalizeInviteCode(u.referralCode);

  if (storedCode) {
    ids.add(storedCode);
    if (storedCode.startsWith('ZT') || storedCode.startsWith('TV')) {
      const suffix = storedCode.slice(2);
      if (suffix) {
        ids.add(suffix);
        ids.add(`ZT${suffix}`);
        ids.add(`TV${suffix}`);
      }
    }
    if (/^\d{6}$/.test(storedCode)) {
      ids.add(`ZT${storedCode}`);
      ids.add(`TV${storedCode}`);
    }
    if (storedCode === 'ZT982143' || storedCode === 'TV982143') {
      ids.add('ZOROTASK123');
      ids.add('TASKVIBE123');
    }
  }

  if (cleanMob.length >= 10) {
    ids.add(cleanMob);
    const tail6 = cleanMob.slice(-6);
    if (!storedCode) {
      ids.add(`ZT${tail6}`);
      ids.add(`TV${tail6}`);
      ids.add(tail6);
    }
  }

  return ids;
}

export function doesReferredByMatchUser(
  referredBy: string | undefined,
  parentIdentifiers: Set<string>
): boolean {
  const cleanRef = normalizeInviteCode(referredBy);
  if (!cleanRef || parentIdentifiers.size === 0) return false;
  if (parentIdentifiers.has(cleanRef)) return true;

  if (cleanRef.startsWith('ZT') || cleanRef.startsWith('TV')) {
    const suffix = cleanRef.slice(2);
    if (suffix && (parentIdentifiers.has(suffix) || parentIdentifiers.has(`ZT${suffix}`) || parentIdentifiers.has(`TV${suffix}`))) {
      return true;
    }
  }

  const digits = cleanRef.replace(/\D/g, '');
  if (digits.length >= 10 && parentIdentifiers.has(digits.slice(-10))) {
    return true;
  }
  if (digits.length === 6 && (parentIdentifiers.has(digits) || parentIdentifiers.has(`ZT${digits}`) || parentIdentifiers.has(`TV${digits}`))) {
    return true;
  }

  return false;
}

export interface TeamHierarchyResult {
  directTeam: RegisteredUserAccount[];
  tier2Team: RegisteredUserAccount[];
  tier3PlusTeam: RegisteredUserAccount[];
  totalMembers: number;
}

/**
 * Computes Level 1 (Direct), Level 2 (Friends of Friends), and Level 3+ (Downstream up to 10 levels)
 * using normalized ZT/TV/6-digit/10-digit mobile equivalence with cycle protection.
 */
export function buildTeamHierarchy(
  currentUser: Pick<UserProfile | RegisteredUserAccount, 'referralCode' | 'mobile'>,
  registeredUsers: RegisteredUserAccount[]
): TeamHierarchyResult {
  const visitedMobiles = new Set<string>();
  const selfMob = normalizeMobile10(currentUser.mobile);
  if (selfMob) visitedMobiles.add(selfMob);

  const rootIds = buildReferrerIdentifiers(currentUser);
  const directTeam: RegisteredUserAccount[] = [];
  for (const u of registeredUsers) {
    const uMob = normalizeMobile10(u.mobile);
    if (uMob && visitedMobiles.has(uMob)) continue;
    if (doesReferredByMatchUser(u.referredBy, rootIds)) {
      directTeam.push(u);
      if (uMob) visitedMobiles.add(uMob);
    }
  }

  const l1Ids = new Set<string>();
  for (const u of directTeam) {
    buildReferrerIdentifiers(u).forEach((id) => l1Ids.add(id));
  }

  const tier2Team: RegisteredUserAccount[] = [];
  if (l1Ids.size > 0) {
    for (const u of registeredUsers) {
      const uMob = normalizeMobile10(u.mobile);
      if (uMob && visitedMobiles.has(uMob)) continue;
      if (doesReferredByMatchUser(u.referredBy, l1Ids)) {
        tier2Team.push(u);
        if (uMob) visitedMobiles.add(uMob);
      }
    }
  }

  const tier3PlusTeam: RegisteredUserAccount[] = [];
  let frontierIds = new Set<string>();
  for (const u of tier2Team) {
    buildReferrerIdentifiers(u).forEach((id) => frontierIds.add(id));
  }

  for (let depth = 3; depth <= 10 && frontierIds.size > 0; depth++) {
    const nextFrontierIds = new Set<string>();
    for (const u of registeredUsers) {
      const uMob = normalizeMobile10(u.mobile);
      if (uMob && visitedMobiles.has(uMob)) continue;
      if (doesReferredByMatchUser(u.referredBy, frontierIds)) {
        tier3PlusTeam.push(u);
        if (uMob) visitedMobiles.add(uMob);
        buildReferrerIdentifiers(u).forEach((id) => nextFrontierIds.add(id));
      }
    }
    frontierIds = nextFrontierIds;
  }

  return {
    directTeam,
    tier2Team,
    tier3PlusTeam,
    totalMembers: directTeam.length + tier2Team.length + tier3PlusTeam.length,
  };
}
