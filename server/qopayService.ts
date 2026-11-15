import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  runTransaction,
  increment,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFirebaseConfig() {
  const configPath = path.resolve(__dirname, '..', 'firebase-applet-config.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw);
}

const firebaseConfig = loadFirebaseConfig();
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestoreDbId = firebaseConfig.firestoreDatabaseId;
export const db =
  firestoreDbId && firestoreDbId !== '(default)'
    ? getFirestore(app, firestoreDbId)
    : getFirestore(app);

// Test Firestore connectivity on server boot
(async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error('[Firestore-Server] Client is offline. Please check Firebase configuration.');
    }
  }
})();

export function normalizeMobile(m?: string | null): string {
  const digits = String(m || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

function getFormattedDayInfo(ts = Date.now()) {
  const d = new Date(ts);
  const isoDate = d.toISOString().split('T')[0];
  const displayString = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return { isoDate, displayString };
}

function formatDisplayUtr(raw?: string): string {
  const cleaned = String(raw || '').replace(/[^a-zA-Z0-9]/g, '').trim();
  return cleaned || `QO${Date.now().toString().slice(-10)}`;
}

const FALLBACK_PLANS = [
  { id: 'plan_lv0', level: 0, levelTag: 'Free Starter (2 Days Trial)', price: 0, bonus: 0 },
  { id: 'plan_lv1', level: 1, levelTag: 'VIP 1 Bronze', price: 500, bonus: 50 },
  { id: 'plan_lv2', level: 2, levelTag: 'VIP 2 Silver', price: 1500, bonus: 150 },
  { id: 'plan_lv3', level: 3, levelTag: 'VIP 3 Gold', price: 3000, bonus: 300 },
  { id: 'plan_lv4', level: 4, levelTag: 'VIP 4 Platinum', price: 6000, bonus: 600 },
  { id: 'plan_lv5', level: 5, levelTag: 'VIP 5 Diamond', price: 12000, bonus: 1200 },
  { id: 'plan_lv6', level: 6, levelTag: 'VIP 6 Crown', price: 20000, bonus: 2000 },
  { id: 'plan_lv7', level: 7, levelTag: 'VIP 7 Grand Master', price: 30000, bonus: 3000 },
];

export interface PendingQoPayDepositInput {
  depositId: string;
  orderId: string;
  userMobile: string;
  userName?: string;
  userReferralCode?: string;
  amount: number;
  bonus?: number;
  depositType: 'add_money' | 'plan_purchase';
  planId?: string;
  planLevel?: number;
  planTitle?: string;
  utrNumber?: string;
  paymentUrl?: string;
  upiIntent?: string;
}

export async function persistPendingQoPayDeposit(input: PendingQoPayDepositInput) {
  try {
    const cleanMob = normalizeMobile(input.userMobile);
    const displayMobile =
      input.userMobile && input.userMobile.trim()
        ? input.userMobile.trim().slice(0, 32)
        : cleanMob
        ? `+91 ${cleanMob}`
        : '';

    if (!input.depositId || !displayMobile || !input.amount || input.amount <= 0) {
      return;
    }

    const depDoc = cleanFirestoreData({
      id: input.depositId,
      userId: input.userReferralCode || displayMobile || 'Member',
      userName: (input.userName && input.userName !== 'Member' ? input.userName : '') || 'Member',
      userMobile: displayMobile,
      amount: Number(input.amount),
      bonus: Number(input.bonus) || 0,
      depositType: input.depositType || 'add_money',
      ...(input.planId ? { planId: input.planId } : {}),
      ...(input.planLevel !== undefined ? { planLevel: Number(input.planLevel) } : {}),
      ...(input.planTitle ? { planTitle: input.planTitle } : {}),
      adminUpiId: 'qopay@upi',
      utrNumber: input.utrNumber || formatDisplayUtr(input.orderId.replace(/^ORD_/i, '')),
      submittedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'gateway_pending',
      gateway: 'qopay',
      gatewayOrderId: input.orderId,
      qopayOrderId: input.orderId,
      ...(input.paymentUrl ? { gatewayPayUrl: input.paymentUrl, qopayPaymentUrl: input.paymentUrl } : {}),
      ...(input.upiIntent ? { gatewayDeeplink: input.upiIntent } : {}),
    });

    await setDoc(doc(db, 'deposits', input.depositId), depDoc, { merge: true });
  } catch (err) {
    console.warn('[QO-Pay-Firestore] Failed to persist pending deposit:', err);
  }
}

export async function findQoPayDeposit(orderId?: string, depositId?: string): Promise<any | null> {
  try {
    if (depositId) {
      const snap = await getDoc(doc(db, 'deposits', depositId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    }
    if (orderId) {
      const q1 = query(collection(db, 'deposits'), where('qopayOrderId', '==', orderId));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        const d = snap1.docs[0];
        return { id: d.id, ...d.data() };
      }
      const q2 = query(collection(db, 'deposits'), where('gatewayOrderId', '==', orderId));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const d = snap2.docs[0];
        return { id: d.id, ...d.data() };
      }
    }
  } catch (err) {
    console.warn('[QO-Pay-Firestore] findQoPayDeposit error:', err);
  }
  return null;
}

export async function getPendingQoPayDepositsFromFirestore(): Promise<any[]> {
  try {
    const q = query(collection(db, 'deposits'), where('gateway', '==', 'qopay'));
    const snap = await getDocs(q);
    const now = Date.now();
    const maxAgeMs = 12 * 60 * 60 * 1000; // 12 hours
    const pending: any[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data) return;
      if (data.status !== 'gateway_pending' && data.status !== 'in_process') return;
      if (data.timestamp && now - Number(data.timestamp) > maxAgeMs) return;
      pending.push({ id: docSnap.id, ...data });
    });
    pending.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return pending;
  } catch (err) {
    console.warn('[QO-Pay-Firestore] getPendingQoPayDepositsFromFirestore error:', err);
    return [];
  }
}

export async function markQoPayDepositFailed(orderId: string, depositId?: string, reasonStatus = 'FAILED') {
  try {
    const found = await findQoPayDeposit(orderId, depositId);
    if (!found || found.status !== 'gateway_pending') return;
    await setDoc(
      doc(db, 'deposits', found.id),
      { status: 'rejected', rejectionReason: `QO Pay status: ${reasonStatus}` },
      { merge: true }
    );
  } catch (err) {
    console.warn('[QO-Pay-Firestore] markQoPayDepositFailed error:', err);
  }
}

async function findUserByReferralCodeServer(code: string): Promise<{ docId: string; user: any } | null> {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return null;
  try {
    const q = query(collection(db, 'users'), where('referralCode', '==', cleanCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { docId: d.id, user: d.data() };
    }
  } catch (err) {
    console.warn('[QO-Pay-Firestore] findUserByReferralCodeServer error:', err);
  }
  return null;
}

async function distributePlanPurchaseCommissionsServer(
  buyerUser: any,
  planPrice: number,
  planLevel: number,
  adminSettingsData: any
) {
  if (!buyerUser?.referredBy || planPrice <= 0) return;
  const buyerClean = normalizeMobile(buyerUser.mobile);
  const visitedUplines = new Set<string>();
  if (buyerClean) visitedUplines.add(buyerClean);
  const activeBonusSetting = Number(adminSettingsData?.referralBonus ?? 100);

  try {
    // Level 1 (4.5% + first-plan referral bonus)
    const upline1Data = await findUserByReferralCodeServer(buyerUser.referredBy);
    if (!upline1Data || visitedUplines.has(upline1Data.docId)) return;

    const u1Clean = upline1Data.docId;
    const upline1 = upline1Data.user;
    visitedUplines.add(u1Clean);

    const comm1 = Math.round(planPrice * 0.045 * 100) / 100;
    const isFirstPlan = !buyerUser.firstPlanReferralBonusPaid;
    const refBonus = isFirstPlan ? activeBonusSetting : 0;
    const totalU1Reward = comm1 + refBonus;

    if (totalU1Reward > 0) {
      const nowTs = Date.now();
      const dayInfo = getFormattedDayInfo(nowTs);
      const u1Txs: any[] = [];
      if (comm1 > 0) {
        u1Txs.push({
          id: `tx_ref1_${nowTs}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'referral_reward',
          title: 'Level 1 Referral Commission (4.5%)',
          date: dayInfo.displayString,
          timestamp: nowTs,
          amount: comm1,
          isCredit: true,
          status: 'verified',
          note: `Direct referral ${buyerUser.name || 'Member'} purchased Level ${planLevel} VIP plan (₹${planPrice}). 4.5% commission credited (+₹${comm1})!`,
        });
      }
      if (refBonus > 0) {
        u1Txs.push({
          id: `tx_ref_bonus_${nowTs}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'referral_reward',
          title: `Referral Plan Activation Bonus (+₹${refBonus})`,
          date: dayInfo.displayString,
          timestamp: nowTs,
          amount: refBonus,
          isCredit: true,
          status: 'verified',
          note: `Referral ${buyerUser.name || 'Member'} purchased their VIP plan! ₹${refBonus} referral bonus credited to your wallet.`,
        });
      }

      const u1Ref = doc(db, 'users', u1Clean);
      const u1Snap = await getDocFromServer(u1Ref).catch(() => getDoc(u1Ref));
      const existingU1Txs =
        u1Snap.exists() && Array.isArray(u1Snap.data().transactions) ? u1Snap.data().transactions : [];
      await setDoc(
        u1Ref,
        cleanFirestoreData({
          balance: increment(totalU1Reward),
          totalEarned: increment(totalU1Reward),
          referralEarnings: increment(totalU1Reward),
          transactions: [...u1Txs, ...existingU1Txs].slice(0, 200),
        }),
        { merge: true }
      );

      if (isFirstPlan && refBonus > 0 && buyerClean) {
        await setDoc(doc(db, 'users', buyerClean), { firstPlanReferralBonusPaid: true }, { merge: true });
      }
    }

    // Level 2 (1.5%)
    if (upline1.referredBy) {
      const upline2Data = await findUserByReferralCodeServer(upline1.referredBy);
      if (upline2Data && !visitedUplines.has(upline2Data.docId)) {
        const u2Clean = upline2Data.docId;
        const upline2 = upline2Data.user;
        visitedUplines.add(u2Clean);
        const comm2 = Math.round(planPrice * 0.015 * 100) / 100;
        if (comm2 > 0) {
          const nowTs = Date.now();
          const dayInfo = getFormattedDayInfo(nowTs);
          const u2Tx = {
            id: `tx_ref2_${nowTs}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'referral_reward',
            title: 'Level 2 Team Commission (1.5%)',
            date: dayInfo.displayString,
            timestamp: nowTs,
            amount: comm2,
            isCredit: true,
            status: 'verified',
            note: `Level 2 member ${buyerUser.name || 'Member'} purchased Level ${planLevel} VIP plan (₹${planPrice}). 1.5% commission credited (+₹${comm2})!`,
          };
          const u2Ref = doc(db, 'users', u2Clean);
          const u2Snap = await getDocFromServer(u2Ref).catch(() => getDoc(u2Ref));
          const existingU2Txs =
            u2Snap.exists() && Array.isArray(u2Snap.data().transactions) ? u2Snap.data().transactions : [];
          await setDoc(
            u2Ref,
            cleanFirestoreData({
              balance: increment(comm2),
              totalEarned: increment(comm2),
              referralEarnings: increment(comm2),
              transactions: [u2Tx, ...existingU2Txs].slice(0, 200),
            }),
            { merge: true }
          );
        }

        // Level 3+ (1.0%)
        let currentParentCode = upline2.referredBy;
        let tier = 3;
        while (currentParentCode && tier <= 10) {
          const nextUpline = await findUserByReferralCodeServer(currentParentCode);
          if (!nextUpline || visitedUplines.has(nextUpline.docId)) break;
          const uNClean = nextUpline.docId;
          visitedUplines.add(uNClean);
          const commN = Math.round(planPrice * 0.01 * 100) / 100;
          if (commN > 0) {
            const nowTs = Date.now();
            const dayInfo = getFormattedDayInfo(nowTs);
            const uNTx = {
              id: `tx_ref${tier}_${nowTs}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'referral_reward',
              title: `Level ${tier} Team Commission (1.0%)`,
              date: dayInfo.displayString,
              timestamp: nowTs,
              amount: commN,
              isCredit: true,
              status: 'verified',
              note: `Downstream member ${buyerUser.name || 'Member'} purchased Level ${planLevel} VIP plan (₹${planPrice}). 1.0% commission credited (+₹${commN})!`,
            };
            const uNRef = doc(db, 'users', uNClean);
            const uNSnap = await getDocFromServer(uNRef).catch(() => getDoc(uNRef));
            const existingUNTxs =
              uNSnap.exists() && Array.isArray(uNSnap.data().transactions) ? uNSnap.data().transactions : [];
            await setDoc(
              uNRef,
              cleanFirestoreData({
                balance: increment(commN),
                totalEarned: increment(commN),
                referralEarnings: increment(commN),
                transactions: [uNTx, ...existingUNTxs].slice(0, 200),
              }),
              { merge: true }
            );
          }
          currentParentCode = nextUpline.user.referredBy;
          tier += 1;
        }
      }
    }
  } catch (err) {
    console.warn('[QO-Pay-Firestore] Commission distribution warning:', err);
  }
}

const inFlightFulfills = new Set<string>();

export interface FulfillQoPayParams {
  orderId: string;
  depositId?: string;
  utr?: string;
  source: string;
  fallbackMeta?: {
    amount?: number;
    bonus?: number;
    depositType?: 'add_money' | 'plan_purchase';
    planId?: string;
    planLevel?: number;
    planTitle?: string;
    userMobile?: string;
    userName?: string;
    userReferralCode?: string;
  };
}

export interface FulfillQoPayResult {
  success: boolean;
  credited: boolean;
  alreadyApproved?: boolean;
  autoApprovedDisabled?: boolean;
  deposit?: any;
  depositId?: string;
  depositType?: 'add_money' | 'plan_purchase';
  amount?: number;
  bonus?: number;
  planLevel?: number;
  message?: string;
}

export async function fulfillQoPayOrder(params: FulfillQoPayParams): Promise<FulfillQoPayResult> {
  const { orderId, utr, source, fallbackMeta } = params;
  const lockKey = orderId || params.depositId || '';
  if (!lockKey) return { success: false, credited: false, message: 'Missing orderId' };

  if (inFlightFulfills.has(lockKey)) {
    return { success: true, credited: false, message: 'Fulfillment already in progress' };
  }
  inFlightFulfills.add(lockKey);

  try {
    // 1. Load admin settings for auto-approve flag, tiers & plans
    let adminSettingsData: any = {};
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'admin'));
      if (settingsSnap.exists()) {
        adminSettingsData = settingsSnap.data();
      }
    } catch {}

    const shouldAutoApprove = adminSettingsData?.qopayAutoApprove !== false;

    // 2. Locate deposit document in Firestore
    let existingDeposit = await findQoPayDeposit(orderId, params.depositId);
    let depositId = existingDeposit?.id || params.depositId;

    if (!existingDeposit && fallbackMeta?.userMobile && fallbackMeta?.amount) {
      depositId = depositId || `DEP_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      await persistPendingQoPayDeposit({
        depositId,
        orderId,
        userMobile: fallbackMeta.userMobile,
        userName: fallbackMeta.userName,
        userReferralCode: fallbackMeta.userReferralCode,
        amount: Number(fallbackMeta.amount),
        bonus: Number(fallbackMeta.bonus) || 0,
        depositType: fallbackMeta.depositType || 'add_money',
        planId: fallbackMeta.planId,
        planLevel: fallbackMeta.planLevel,
        planTitle: fallbackMeta.planTitle,
        utrNumber: utr || formatDisplayUtr(orderId.replace(/^ORD_/i, '')),
      });
      existingDeposit = await findQoPayDeposit(orderId, depositId);
    }

    if (!depositId || !existingDeposit) {
      return {
        success: false,
        credited: false,
        message: 'Deposit record not found in Firestore for order ' + orderId,
      };
    }

    if (existingDeposit.status === 'approved') {
      return {
        success: true,
        credited: false,
        alreadyApproved: true,
        deposit: existingDeposit,
        depositId,
        depositType: existingDeposit.depositType || 'add_money',
        amount: Number(existingDeposit.amount) || 0,
        bonus: Number(existingDeposit.bonus) || 0,
        planLevel: existingDeposit.planLevel,
        message: 'Already approved & credited',
      };
    }

    const finalUtr = formatDisplayUtr(utr || existingDeposit.userSubmittedUtr || existingDeposit.utrNumber || orderId.replace(/^ORD_/i, ''));

    if (!shouldAutoApprove) {
      await setDoc(
        doc(db, 'deposits', depositId),
        cleanFirestoreData({
          status: 'in_process',
          utrNumber: finalUtr,
          userSubmittedUtr: finalUtr,
          qopayOrderId: orderId,
          gatewayOrderId: orderId,
        }),
        { merge: true }
      );
      return {
        success: true,
        credited: false,
        autoApprovedDisabled: true,
        deposit: { ...existingDeposit, status: 'in_process', utrNumber: finalUtr },
        depositId,
        depositType: existingDeposit.depositType || 'add_money',
        amount: Number(existingDeposit.amount) || 0,
        bonus: Number(existingDeposit.bonus) || 0,
        planLevel: existingDeposit.planLevel,
        message: 'Marked in_process awaiting manual admin approval',
      };
    }

    const cleanMobile = normalizeMobile(existingDeposit.userMobile || fallbackMeta?.userMobile);
    if (!cleanMobile || cleanMobile.length < 10) {
      return {
        success: false,
        credited: false,
        message: 'Valid user mobile missing on deposit ' + depositId,
      };
    }

    const safePlans: any[] =
      Array.isArray(adminSettingsData?.plans) && adminSettingsData.plans.length > 0
        ? adminSettingsData.plans
        : FALLBACK_PLANS;

    const depositRef = doc(db, 'deposits', depositId);
    const userRef = doc(db, 'users', cleanMobile);

    const txResult = await runTransaction(db, async (tx) => {
      const depSnap = await tx.get(depositRef);
      const depData = depSnap.exists() ? depSnap.data() : existingDeposit;

      if (depData.status === 'approved' || depData.creditedAt) {
        return {
          alreadyApproved: true,
          deposit: depData,
          isPlan: depData.depositType === 'plan_purchase',
          finalLevel: depData.planLevel || 1,
          amount: Number(depData.amount) || 0,
          bonus: Number(depData.bonus) || 0,
          mergedUser: null as any,
          commissionDistributed: Boolean(depData.commissionDistributed),
        };
      }

      const userSnap = await tx.get(userRef);
      const existingUser = userSnap.exists() ? userSnap.data() : null;

      const resolvedUser: any = existingUser || {
        name: depData.userName || 'Member',
        mobile: `+91 ${cleanMobile}`,
        email: `${cleanMobile}@zorotask.in`,
        referralCode: `ZT${Math.floor(100000 + Math.random() * 900000)}`,
        password: cleanMobile.slice(-6),
        balance: 0,
        totalEarned: 0,
        withdrawn: 0,
        upiId: `${cleanMobile}@upi`,
        joinedDate: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        joinedTimestamp: Date.now(),
        trialStartedAt: Date.now(),
        isNewTrialEligible: true,
        freeTrialOverride: 'auto',
        vipLevel: 0,
        vipTag: 'Free Starter',
        purchasedPlanIds: [],
        transactions: [],
      };
      if (!resolvedUser.password) resolvedUser.password = cleanMobile.slice(-6);

      // Determine add_money vs plan_purchase
      let targetLevel: number | undefined = depData.depositType === 'add_money' ? undefined : depData.planLevel;
      if (targetLevel === undefined && depData.depositType !== 'add_money' && depData.planTitle) {
        const m =
          depData.planTitle.match(/Level\s*(\d+)/i) ||
          depData.planTitle.match(/LV\s*(\d+)/i) ||
          depData.planTitle.match(/VIP\s*(\d+)/i);
        if (m && m[1]) targetLevel = parseInt(m[1], 10);
      }
      if (targetLevel === undefined && depData.depositType === 'plan_purchase') {
        const matchedPlan = safePlans.find((p) => p.level > 0 && Number(p.price) === Number(depData.amount));
        targetLevel = matchedPlan ? Number(matchedPlan.level) : 1;
      }

      const isPlan =
        depData.depositType === 'plan_purchase' ||
        (!depData.depositType && targetLevel !== undefined && targetLevel > 0);

      const finalLevel = targetLevel !== undefined ? targetLevel : 1;
      const targetPlan =
        (depData.planId ? safePlans.find((p) => p.id === depData.planId) : undefined) ||
        safePlans.find((p) => Number(p.level) === finalLevel) ||
        safePlans.find((p) => p.id === `plan_lv${finalLevel}`) ||
        FALLBACK_PLANS[finalLevel] ||
        FALLBACK_PLANS[1];

      const planId = targetPlan?.id || depData.planId || `plan_lv${finalLevel}`;
      const vipTag = targetPlan?.levelTag || `Level ${finalLevel}`;
      const ensuredReferralCode =
        resolvedUser.referralCode && String(resolvedUser.referralCode).trim()
          ? String(resolvedUser.referralCode).trim()
          : `ZT${Math.floor(100000 + Math.random() * 900000)}`;
      const ensuredName =
        resolvedUser.name && resolvedUser.name !== 'Member'
          ? resolvedUser.name
          : depData.userName && depData.userName !== 'Member'
          ? depData.userName
          : resolvedUser.name || 'Member';

      const depositAmount = Number(depData.amount) || 0;
      let resolvedDepositBonus = Number(depData.bonus) || 0;
      let updatedUserData: Record<string, any> = {};

      if (isPlan) {
        const currentPurchased = Array.isArray(resolvedUser.purchasedPlanIds)
          ? [...resolvedUser.purchasedPlanIds]
          : [];
        if (!currentPurchased.includes(planId)) {
          currentPurchased.push(planId);
        }
        const maxLevel = Math.max(Number(resolvedUser.vipLevel) || 0, finalLevel);
        updatedUserData = {
          name: ensuredName,
          vipLevel: maxLevel,
          vipTag,
          purchasedPlanIds: currentPurchased,
          referralCode: ensuredReferralCode,
        };
      } else {
        if (!resolvedDepositBonus && depositAmount > 0) {
          const tiers: any[] = adminSettingsData?.addMoneyTiers || [];
          const matchedTier = tiers.find((t) => Number(t.amount) === depositAmount);
          if (matchedTier) {
            resolvedDepositBonus = Number(matchedTier.bonus) || 0;
          }
        }
        const totalCredited = depositAmount + resolvedDepositBonus;
        updatedUserData = {
          name: ensuredName,
          balance: (Number(resolvedUser.balance) || 0) + totalCredited,
          totalEarned: (Number(resolvedUser.totalEarned) || 0) + totalCredited,
          referralCode: ensuredReferralCode,
        };
      }

      const currentTxs: any[] = Array.isArray(resolvedUser.transactions) ? [...resolvedUser.transactions] : [];
      const approvedTitle = isPlan
        ? `VIP Level ${finalLevel} (Approved & Active)`
        : `Wallet Deposit (Approved +₹${resolvedDepositBonus} Bonus)`;
      const approvedNote = `Verified Automatically via QO Pay Gateway on ${new Date().toLocaleDateString('en-IN')}`;

      let foundTx = false;
      const updatedTxs = currentTxs.map((t) => {
        if (
          t.id === `tx_${depositId}` ||
          t.orderId === orderId ||
          (t.utrNumber && finalUtr && String(t.utrNumber).trim().toLowerCase() === finalUtr.toLowerCase())
        ) {
          foundTx = true;
          return {
            ...t,
            status: 'verified',
            title: approvedTitle,
            utrNumber: finalUtr,
            note: approvedNote,
          };
        }
        return t;
      });

      if (!foundTx) {
        updatedTxs.unshift({
          id: `tx_${depositId}`,
          type: isPlan ? 'purchase' : 'purchase_reward',
          title: approvedTitle,
          date: new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          timestamp: Date.now(),
          amount: depositAmount,
          isCredit: !isPlan,
          status: 'verified',
          orderId: `#DEP${depositId.slice(-6)}`,
          utrNumber: finalUtr,
          note: approvedNote,
        });
      }

      updatedUserData.transactions = updatedTxs.slice(0, 200);
      const mergedUser = cleanFirestoreData({ ...resolvedUser, ...updatedUserData });

      const approvedDeposit = cleanFirestoreData({
        ...depData,
        status: 'approved',
        utrNumber: finalUtr,
        userSubmittedUtr: finalUtr,
        qopayOrderId: orderId,
        gatewayOrderId: orderId,
        bonus: resolvedDepositBonus,
        creditedAt: Date.now(),
        creditedBy: `qopay_server_${source}`,
      });

      tx.set(depositRef, approvedDeposit, { merge: true });
      tx.set(userRef, mergedUser, { merge: true });

      return {
        alreadyApproved: false,
        deposit: approvedDeposit,
        isPlan,
        finalLevel,
        amount: depositAmount,
        bonus: resolvedDepositBonus,
        mergedUser,
        commissionDistributed: Boolean(depData.commissionDistributed),
      };
    });

    if (txResult.alreadyApproved) {
      return {
        success: true,
        credited: false,
        alreadyApproved: true,
        deposit: txResult.deposit,
        depositId,
        depositType: txResult.isPlan ? 'plan_purchase' : 'add_money',
        amount: txResult.amount,
        bonus: txResult.bonus,
        planLevel: txResult.finalLevel,
        message: 'Already approved & credited',
      };
    }

    // Distribute 3-tier VIP referral commissions after transaction commit
    if (txResult.isPlan && !txResult.commissionDistributed && txResult.mergedUser) {
      await distributePlanPurchaseCommissionsServer(
        txResult.mergedUser,
        txResult.amount,
        txResult.finalLevel,
        adminSettingsData
      );
      await setDoc(depositRef, { commissionDistributed: true }, { merge: true }).catch(() => {});
    }

    console.log(
      `[QO-Pay-AutoCredit] ✓ Credited ${cleanMobile} (${txResult.isPlan ? `VIP Level ${txResult.finalLevel}` : `₹${txResult.amount} + ₹${txResult.bonus} bonus`}) for order ${orderId} via ${source}`
    );

    return {
      success: true,
      credited: true,
      alreadyApproved: false,
      deposit: txResult.deposit,
      depositId,
      depositType: txResult.isPlan ? 'plan_purchase' : 'add_money',
      amount: txResult.amount,
      bonus: txResult.bonus,
      planLevel: txResult.finalLevel,
      message: txResult.isPlan
        ? `VIP Level ${txResult.finalLevel} activated automatically!`
        : `₹${txResult.amount} + ₹${txResult.bonus} bonus credited to wallet!`,
    };
  } catch (err: any) {
    console.error('[QO-Pay-AutoCredit] fulfillQoPayOrder error:', err);
    return {
      success: false,
      credited: false,
      message: err?.message || 'Failed to fulfill QO Pay order',
    };
  } finally {
    inFlightFulfills.delete(lockKey);
  }
}
