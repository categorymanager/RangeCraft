import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, SubscriptionTier, WeekPromotion, Product, SkuCatalog } from '../types';

// Initialize Firebase App instance safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Ensure browser local persistence is enabled for long-lasting user sessions
try {
  setPersistence(auth, browserLocalPersistence).catch((e) => {
    console.warn('Firebase auth setPersistence notice:', e);
  });
} catch (e) {
  // Safe fallback
}

function createFirestoreInstance() {
  try {
    return initializeFirestore(
      app,
      { experimentalForceLongPolling: true },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreInstance();

export async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const AI_TOPUP_PACK = {
  id: 'ai_topup_50',
  name: 'Scenario Simulation Top-Up (+50 Runs)',
  runs: 50,
  priceAud: 29,
  description: 'Non-expiring scenario planning credits that stack cleanly on top of your monthly plan allowance.',
};

export const PRICING_PLANS = [
  {
    id: 'free_trial' as SubscriptionTier,
    name: 'Free Forever',
    priceAud: 0,
    annualPriceAud: 0,
    billingPeriod: 'month' as const,
    badgeLabel: 'RISK-FREE EVALUATION',
    tagline: 'Validate margin on 1 product and preview your promotional calendar risk-free.',
    features: [
      { text: '1 active product & margin waterfall check', included: true },
      { text: 'H1 (Q1 & Q2) promotional calendar preview', included: true },
      { text: '1 auto-formulation scenario per month', included: true },
      { text: 'Basic custom rule spacing alerts', included: true },
      { text: 'Watermarked PDF export', included: true },
    ],
    ctaText: 'Start Free',
  },
  {
    id: 'starter_plan' as SubscriptionTier,
    name: 'Starter',
    priceAud: 59,
    annualPriceAud: 590,
    billingPeriod: 'month' as const,
    badgeLabel: 'PROFIT RECOVERY ESSENTIALS',
    tagline: 'For emerging FMCG suppliers replacing brittle spreadsheets with promotional clarity.',
    features: [
      { text: 'Full 52-week calendar with drag-and-drop reslotting', included: true, highlight: true },
      { text: 'Margin simulator & live per-unit waterfall', included: true, highlight: true },
      { text: 'Custom scheduling rules check (hiatus & clashes)', included: true, highlight: true },
      { text: '30 automated scenario runs per month', included: true },
      { text: 'Up to 150 active SKUs & CSV import · clean PDF export', included: true },
    ],
    ctaText: 'Choose Starter',
  },
  {
    id: 'pro_planner' as SubscriptionTier,
    name: 'Growth',
    priceAud: 149,
    annualPriceAud: 1490,
    billingPeriod: 'month' as const,
    popularBadge: 'MOST POPULAR · 14-DAY FREE TRIAL',
    badgeLabel: 'MOST POPULAR · 14-DAY FREE TRIAL',
    tagline: 'For growing FMCG commercial teams protecting margin and winning retail buyer reviews.',
    features: [
      { text: 'Everything in Starter (up to 1,000 active SKUs)', included: true, highlight: true },
      { text: 'Trade spend & scan rebate modelling across channels', included: true, highlight: true },
      { text: 'Commercial Insights & profit recovery alerts', included: true, highlight: true },
      { text: '1-click custom rule conflict resolution (52 weeks)', included: true, highlight: true },
      { text: 'Buyer-ready JBP decks in PowerPoint (PPTX) & PDF', included: true, highlight: true },
      { text: 'B2B CRM, trading terms & wholesale order tracking', included: true, highlight: true },
    ],
    ctaText: 'Start 14-Day Free Trial',
  },
  {
    id: 'enterprise_tier' as SubscriptionTier,
    name: 'Enterprise',
    priceAud: 0,
    annualPriceAud: 0,
    billingPeriod: 'month' as const,
    badgeLabel: 'TAILORED COMMERCIAL OS',
    tagline: 'For national manufacturers and distributors managing multi-brand retail portfolios.',
    features: [
      { text: 'Everything in Growth (up to 5,000 SKUs)', included: true, highlight: true },
      { text: 'Custom ERP & POS data ingestion scoped to your team', included: true, highlight: true },
      { text: 'Custom channel rules & multi-team permissions', included: true, highlight: true },
      { text: 'Tailored JBP review packs & commercial onboarding', included: true },
      { text: 'Dedicated implementation support & SLA', included: true },
    ],
    ctaText: 'Book a Demo',
  },
];

function isPermissionDeniedError(err: unknown): boolean {
  const code = (err as any)?.code;
  const msg = err instanceof Error ? err.message : String(err || '');
  return (
    code === 'permission-denied' ||
    msg.toLowerCase().includes('missing or insufficient permissions') ||
    msg.includes('PERMISSION_DENIED')
  );
}

function clampString(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== 'string') return undefined;
  return val.slice(0, maxLen);
}

function clampNumber(val: unknown, minVal: number, maxVal: number, fallback: number): number {
  const num = typeof val === 'number' && Number.isFinite(val) ? val : fallback;
  return Math.max(minVal, Math.min(maxVal, num));
}

function buildBlueprintUserPayload(profile: Partial<UserProfile>, includeIdentity: boolean): Record<string, any> {
  const payload: Record<string, any> = {};
  if (includeIdentity) {
    if (profile.uid) payload.uid = clampString(profile.uid, 128);
    if (profile.createdAt) payload.createdAt = clampString(profile.createdAt, 64);
  }
  if (profile.email !== undefined) payload.email = clampString(profile.email, 254) || '';
  if (profile.displayName !== undefined) payload.displayName = clampString(profile.displayName, 120) || 'Australian Category Planner';
  if (profile.firstName) payload.firstName = clampString(profile.firstName, 80);
  if (profile.lastName) payload.lastName = clampString(profile.lastName, 80);
  if (profile.phoneNumber) payload.phoneNumber = clampString(profile.phoneNumber, 40);
  if (profile.companyName) payload.companyName = clampString(profile.companyName, 160);
  if (profile.abn) payload.abn = clampString(profile.abn, 32);
  if (profile.streetAddress) payload.streetAddress = clampString(profile.streetAddress, 200);
  if (profile.houseNumber) payload.houseNumber = clampString(profile.houseNumber, 40);
  if (profile.country) payload.country = clampString(profile.country, 80);
  if (profile.acceptedTermsAt) payload.acceptedTermsAt = clampString(profile.acceptedTermsAt, 64);
  if (profile.jobRole) payload.jobRole = clampString(profile.jobRole, 100);
  if (profile.subscriptionTier) payload.subscriptionTier = profile.subscriptionTier;
  if (profile.subscriptionStatus) payload.subscriptionStatus = profile.subscriptionStatus;
  if (profile.aiGenerationsRemaining !== undefined) {
    payload.aiGenerationsRemaining = clampNumber(profile.aiGenerationsRemaining, 0, 1000000, 1);
  }
  if (profile.aiMonthlyAllowance !== undefined) {
    payload.aiMonthlyAllowance = clampNumber(profile.aiMonthlyAllowance, 0, 1000000, 1);
  }
  if (profile.aiTopUpCredits !== undefined) {
    payload.aiTopUpCredits = clampNumber(profile.aiTopUpCredits, 0, 100000, 0);
  }
  if (profile.unlimitedAi !== undefined) payload.unlimitedAi = Boolean(profile.unlimitedAi);
  if (profile.canExportPdf !== undefined) payload.canExportPdf = Boolean(profile.canExportPdf);
  if (profile.canAutoReslot !== undefined) payload.canAutoReslot = Boolean(profile.canAutoReslot);
  if (profile.maxSkusAllowed !== undefined) {
    payload.maxSkusAllowed = clampNumber(profile.maxSkusAllowed, 0, 100000, 1);
  }
  if (Array.isArray(profile.unlockedExports)) {
    payload.unlockedExports = profile.unlockedExports.filter((x) => typeof x === 'string').slice(0, 100);
  }
  if (profile.trialExpiresAt) payload.trialExpiresAt = clampString(profile.trialExpiresAt, 64);
  if (profile.trialUsed !== undefined) payload.trialUsed = Boolean(profile.trialUsed);
  if (profile.lastLoginAt) payload.lastLoginAt = clampString(profile.lastLoginAt, 64);

  return sanitizeFirestoreData(payload);
}

// Single export pay-per-item unlock ($19 AUD)
export async function unlockSingleExport(uid: string, exportId: string, currentProfile: UserProfile): Promise<UserProfile> {
  const path = `users/${uid}`;
  const existingUnlocks = currentProfile.unlockedExports || [];
  if (existingUnlocks.includes(exportId)) {
    return currentProfile;
  }
  const updatedUnlocks = [...existingUnlocks, exportId].slice(0, 100);
  try {
    if (auth.currentUser && auth.currentUser.uid === uid) {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, sanitizeFirestoreData({
        unlockedExports: updatedUnlocks,
        canExportPdf: true
      }));
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
    console.warn('Firestore unlockSingleExport error, updating local state:', err);
  }
  const updated: UserProfile = {
    ...currentProfile,
    unlockedExports: updatedUnlocks,
    canExportPdf: true
  };
  try {
    localStorage.setItem('rangecraft_auth_user', JSON.stringify(updated));
  } catch {}
  return updated;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes all `undefined` values from an object or array,
 * which are rejected by Firestore setDoc and updateDoc calls.
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item)) as any;
  }
  
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeFirestoreData(value);
    }
  }
  return cleanObj as T;
}

// Helper to create or get user document
export async function syncUserProfile(user: FirebaseUser | UserProfile | { uid: string; email?: string | null; displayName?: string | null }): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const typedUser = user as Partial<UserProfile>;
  const defaultProfile: UserProfile = {
    uid: clampString(user.uid, 128) || user.uid,
    email: clampString(user.email || '', 254) || '',
    displayName: clampString(user.displayName || user.email?.split('@')[0] || 'Australian Category Planner', 120) || 'Australian Category Planner',
    ...(typedUser.firstName ? { firstName: clampString(typedUser.firstName, 80) } : {}),
    ...(typedUser.lastName ? { lastName: clampString(typedUser.lastName, 80) } : {}),
    ...(typedUser.phoneNumber ? { phoneNumber: clampString(typedUser.phoneNumber, 40) } : {}),
    ...(typedUser.companyName ? { companyName: clampString(typedUser.companyName, 160) } : {}),
    ...(typedUser.abn ? { abn: clampString(typedUser.abn, 32) } : {}),
    ...(typedUser.streetAddress ? { streetAddress: clampString(typedUser.streetAddress, 200) } : {}),
    ...(typedUser.houseNumber ? { houseNumber: clampString(typedUser.houseNumber, 40) } : {}),
    ...(typedUser.country ? { country: clampString(typedUser.country, 80) } : {}),
    ...(typedUser.acceptedTermsAt ? { acceptedTermsAt: clampString(typedUser.acceptedTermsAt, 64) } : {}),
    ...(typedUser.jobRole ? { jobRole: clampString(typedUser.jobRole, 100) } : {}),
    subscriptionTier: typedUser.subscriptionTier || 'free_trial',
    subscriptionStatus: typedUser.subscriptionStatus || 'active',
    aiGenerationsRemaining: clampNumber(typedUser.aiGenerationsRemaining, 0, 1000000, 1),
    aiMonthlyAllowance: clampNumber(
      typedUser.aiMonthlyAllowance,
      0,
      1000000,
      typedUser.subscriptionTier === 'enterprise_tier' ? 999999 :
      typedUser.subscriptionTier === 'pro_planner' ? 150 :
      typedUser.subscriptionTier === 'starter_plan' ? 30 : 1
    ),
    aiTopUpCredits: clampNumber(typedUser.aiTopUpCredits, 0, 100000, 0),
    unlimitedAi: typedUser.unlimitedAi ?? false,
    canExportPdf: typedUser.canExportPdf ?? false,
    canAutoReslot: typedUser.canAutoReslot ?? false,
    maxSkusAllowed: clampNumber(typedUser.maxSkusAllowed, 0, 100000, 1),
    unlockedExports: (typedUser.unlockedExports || []).slice(0, 100),
    trialExpiresAt: typedUser.trialExpiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    ...(typedUser.trialUsed !== undefined ? { trialUsed: typedUser.trialUsed } : {}),
    createdAt: typedUser.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  try {
    if (auth.authStateReady) {
      await auth.authStateReady();
    }
    if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
      try {
        localStorage.setItem('rangecraft_auth_user', JSON.stringify(defaultProfile));
      } catch {}
      return defaultProfile;
    }

    const userRef = doc(db, 'users', user.uid);
    let snap;
    try {
      snap = await getDoc(userRef);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      console.warn('Firestore user fetch notice, using cached/local profile:', err);
    }

    if (snap && snap.exists()) {
      const data = snap.data() as UserProfile;
      const merged: UserProfile = {
        ...data,
        ...(typedUser.subscriptionTier ? { subscriptionTier: typedUser.subscriptionTier } : {}),
        ...(typedUser.unlockedExports ? { unlockedExports: typedUser.unlockedExports.slice(0, 100) } : {}),
        ...(typedUser.firstName ? { firstName: clampString(typedUser.firstName, 80) } : {}),
        ...(typedUser.lastName ? { lastName: clampString(typedUser.lastName, 80) } : {}),
        ...(typedUser.phoneNumber ? { phoneNumber: clampString(typedUser.phoneNumber, 40) } : {}),
        ...(typedUser.companyName ? { companyName: clampString(typedUser.companyName, 160) } : {}),
        ...(typedUser.abn ? { abn: clampString(typedUser.abn, 32) } : {}),
        ...(typedUser.streetAddress ? { streetAddress: clampString(typedUser.streetAddress, 200) } : {}),
        ...(typedUser.houseNumber ? { houseNumber: clampString(typedUser.houseNumber, 40) } : {}),
        ...(typedUser.country ? { country: clampString(typedUser.country, 80) } : {}),
        ...(typedUser.acceptedTermsAt ? { acceptedTermsAt: clampString(typedUser.acceptedTermsAt, 64) } : {}),
        ...(typedUser.jobRole ? { jobRole: clampString(typedUser.jobRole, 100) } : {}),
        ...(typedUser.displayName ? { displayName: clampString(typedUser.displayName, 120)! } : {}),
        lastLoginAt: new Date().toISOString(),
      };
      try {
        const updatePayload = buildBlueprintUserPayload(merged, false);
        await updateDoc(userRef, updatePayload);
      } catch (err) {
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
        console.warn('Firestore lastLoginAt update error:', err);
      }
      try {
        localStorage.setItem('rangecraft_auth_user', JSON.stringify(merged));
      } catch {}
      return merged;
    }

    try {
      await setDoc(userRef, buildBlueprintUserPayload(defaultProfile, true));
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      console.warn('Firestore setDoc user error:', err);
    }

    try {
      localStorage.setItem('rangecraft_auth_user', JSON.stringify(defaultProfile));
    } catch {}
    return defaultProfile;
  } catch (err: any) {
    if (isPermissionDeniedError(err)) {
      throw err;
    }
    console.warn('syncUserProfile fallback to local profile:', err);
    try {
      localStorage.setItem('rangecraft_auth_user', JSON.stringify(defaultProfile));
    } catch {}
    return defaultProfile;
  }
}

export async function saveUserProfileToCloud(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    localStorage.setItem('rangecraft_auth_user', JSON.stringify(profile));
    if (auth.currentUser && auth.currentUser.uid === profile.uid) {
      const userRef = doc(db, 'users', profile.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, buildBlueprintUserPayload(profile, false));
      } else {
        await setDoc(userRef, buildBlueprintUserPayload(profile, true));
      }
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('saveUserProfileToCloud error:', err);
  }
}

export async function saveCheckoutBusinessProfile(
  uid: string,
  profileUpdates: Partial<UserProfile>,
  currentProfile?: UserProfile | null
): Promise<UserProfile> {
  const path = `users/${uid}`;
  const merged: UserProfile = {
    uid: clampString(uid, 128) || uid,
    email: clampString(profileUpdates.email || currentProfile?.email || '', 254) || '',
    displayName: clampString(
      profileUpdates.displayName ||
      [profileUpdates.firstName, profileUpdates.lastName].filter(Boolean).join(' ') ||
      currentProfile?.displayName ||
      'Australian Category Planner',
      120
    ) || 'Australian Category Planner',
    subscriptionTier: currentProfile?.subscriptionTier || 'free_trial',
    subscriptionStatus: currentProfile?.subscriptionStatus || 'active',
    aiGenerationsRemaining: currentProfile?.aiGenerationsRemaining ?? 1,
    aiMonthlyAllowance: currentProfile?.aiMonthlyAllowance ?? 1,
    aiTopUpCredits: currentProfile?.aiTopUpCredits ?? 0,
    unlimitedAi: currentProfile?.unlimitedAi ?? false,
    canExportPdf: currentProfile?.canExportPdf ?? false,
    canAutoReslot: currentProfile?.canAutoReslot ?? false,
    maxSkusAllowed: currentProfile?.maxSkusAllowed ?? 1,
    unlockedExports: (currentProfile?.unlockedExports || []).slice(0, 100),
    createdAt: currentProfile?.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    ...currentProfile,
    ...profileUpdates,
  };

  try {
    if (auth.currentUser && auth.currentUser.uid === uid) {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, buildBlueprintUserPayload(merged, false));
      } else {
        await setDoc(userRef, buildBlueprintUserPayload(merged, true));
      }
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('saveCheckoutBusinessProfile Firestore notice (using local sync):', err);
  }

  try {
    localStorage.setItem('rangecraft_auth_user', JSON.stringify(merged));
  } catch {}

  return merged;
}

// Upgrade user subscription tier
export async function upgradeSubscription(
  uid: string, 
  tier: SubscriptionTier,
  companyName?: string,
  businessDetails?: Partial<UserProfile>
): Promise<UserProfile> {
  const path = `users/${uid}`;
  const isStarter = tier === 'starter_plan';
  const isPro = tier === 'pro_planner';
  const isEnterprise = tier === 'enterprise_tier';

  const monthlyAllowance = isEnterprise ? 999999 : isPro ? 150 : isStarter ? 30 : 1;

  const updates: Partial<UserProfile> = {
    subscriptionTier: tier,
    subscriptionStatus: 'active',
    unlimitedAi: isEnterprise,
    canExportPdf: isStarter || isPro || isEnterprise,
    canAutoReslot: isPro || isEnterprise,
    maxSkusAllowed: isEnterprise ? 5000 : isPro ? 1000 : isStarter ? 150 : 1,
    aiMonthlyAllowance: monthlyAllowance,
    aiGenerationsRemaining: monthlyAllowance,
    lastLoginAt: new Date().toISOString(),
    ...(tier !== 'free_trial' ? { trialUsed: true } : {}),
    ...(companyName ? { companyName: clampString(companyName, 160) } : {}),
    ...(businessDetails || {})
  };

  try {
    if (auth.currentUser && auth.currentUser.uid === uid) {
      const userRef = doc(db, 'users', uid);
      const existingSnap = await getDoc(userRef);
      if (existingSnap.exists()) {
        await updateDoc(userRef, buildBlueprintUserPayload(updates, false));
      } else {
        const createPayload: Partial<UserProfile> = {
          uid,
          email: auth.currentUser.email || businessDetails?.email || 'buyer@retailbrands.com.au',
          displayName: auth.currentUser.displayName || businessDetails?.displayName || 'Australian Category Planner',
          createdAt: new Date().toISOString(),
          ...updates,
        };
        await setDoc(userRef, buildBlueprintUserPayload(createPayload, true));
      }
      const updatedSnap = await getDoc(userRef);
      if (updatedSnap.exists()) {
        const updated = updatedSnap.data() as UserProfile;
        try {
          localStorage.setItem('rangecraft_auth_user', JSON.stringify(updated));
        } catch {}
        return updated;
      }
    }
  } catch (err: any) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('upgradeSubscription Firestore fallback notice:', err);
  }

  // Fallback merged local profile when offline or guest session
  let existing: Partial<UserProfile> = {};
  try {
    const raw = localStorage.getItem('rangecraft_auth_user');
    if (raw) existing = JSON.parse(raw);
  } catch {}

  const fallbackUpdated: UserProfile = {
    uid,
    email: existing.email || businessDetails?.email || 'buyer@retailbrands.com.au',
    displayName: existing.displayName || businessDetails?.displayName || 'Australian Category Planner',
    createdAt: existing.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    ...existing,
    ...updates,
  } as UserProfile;

  try {
    localStorage.setItem('rangecraft_auth_user', JSON.stringify(fallbackUpdated));
  } catch {}
  return fallbackUpdated;
}

// Add non-expiring AI scenario top-up credits (+50 runs)
export async function purchaseAiTopUp(
  uid: string,
  runs: number,
  currentProfile: UserProfile
): Promise<UserProfile> {
  const path = `users/${uid}`;
  const newTopUpCredits = clampNumber((currentProfile.aiTopUpCredits ?? 0) + runs, 0, 100000, runs);
  const updated: UserProfile = {
    ...currentProfile,
    aiTopUpCredits: newTopUpCredits,
    lastLoginAt: new Date().toISOString(),
  };

  try {
    if (auth.currentUser && auth.currentUser.uid === uid) {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, sanitizeFirestoreData({
          aiTopUpCredits: newTopUpCredits,
          lastLoginAt: updated.lastLoginAt,
        }));
      } else {
        await setDoc(userRef, buildBlueprintUserPayload(updated, true));
      }
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('purchaseAiTopUp Firestore fallback notice:', err);
  }

  try {
    localStorage.setItem('rangecraft_auth_user', JSON.stringify(updated));
  } catch {}
  return updated;
}

// Consume monthly allowance first, then non-expiring top-up credits
export async function consumeAiQuotaWithProfile(
  uid: string,
  currentProfile: UserProfile
): Promise<{ allowed: boolean; updatedProfile: UserProfile }> {
  if (currentProfile.unlimitedAi || currentProfile.subscriptionTier === 'enterprise_tier') {
    return { allowed: true, updatedProfile: currentProfile };
  }

  const monthlyRemaining = currentProfile.aiGenerationsRemaining ?? 0;
  const topUpRemaining = currentProfile.aiTopUpCredits ?? 0;

  if (monthlyRemaining <= 0 && topUpRemaining <= 0) {
    return { allowed: false, updatedProfile: currentProfile };
  }

  const nextRemaining = monthlyRemaining > 0 ? monthlyRemaining - 1 : 0;
  const nextTopUp = monthlyRemaining > 0 ? topUpRemaining : Math.max(0, topUpRemaining - 1);
  const becameTrialUsed = currentProfile.trialUsed || (currentProfile.subscriptionTier === 'free_trial' && nextRemaining <= 0);

  const updatedProfile: UserProfile = {
    ...currentProfile,
    aiGenerationsRemaining: nextRemaining,
    aiTopUpCredits: nextTopUp,
    ...(becameTrialUsed ? { trialUsed: true } : {}),
  };

  const path = `users/${uid}`;
  try {
    if (auth.currentUser && auth.currentUser.uid === uid) {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, sanitizeFirestoreData({
        aiGenerationsRemaining: updatedProfile.aiGenerationsRemaining,
        aiTopUpCredits: updatedProfile.aiTopUpCredits,
        ...(becameTrialUsed ? { trialUsed: true } : {}),
      }));
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
    console.warn('consumeAiQuotaWithProfile notice:', err);
  }

  try {
    localStorage.setItem('rangecraft_auth_user', JSON.stringify(updatedProfile));
  } catch {}

  return { allowed: true, updatedProfile };
}

// Decrement AI generation quota if not unlimited
export async function useAiQuota(uid: string, currentProfile: UserProfile): Promise<boolean> {
  const result = await consumeAiQuotaWithProfile(uid, currentProfile);
  return result.allowed;
}

// Save user's 52-week plan to Firestore
export async function saveUserPlanToCloud(uid: string, plan: WeekPromotion[]) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return;
  const path = `users/${uid}/plans/active_plan`;
  try {
    const planRef = doc(db, 'users', uid, 'plans', 'active_plan');
    await setDoc(planRef, sanitizeFirestoreData({
      promotions: plan.slice(0, 60),
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('saveUserPlanToCloud notice:', err);
  }
}

// Load user's 52-week plan from Firestore
export async function loadUserPlanFromCloud(uid: string): Promise<WeekPromotion[] | null> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return null;
  const path = `users/${uid}/plans/active_plan`;
  try {
    const planRef = doc(db, 'users', uid, 'plans', 'active_plan');
    const snap = await getDoc(planRef);
    if (snap.exists()) {
      return snap.data().promotions as WeekPromotion[];
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.GET, path);
    }
    console.warn('loadUserPlanFromCloud notice:', err);
  }
  return null;
}

// Save user's multi-catalogs to Firestore
export async function saveUserCatalogsToCloud(uid: string, catalogs: SkuCatalog[]) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return;
  const path = `users/${uid}/catalogs/active_catalogs`;
  try {
    const catalogsRef = doc(db, 'users', uid, 'catalogs', 'active_catalogs');
    await setDoc(catalogsRef, sanitizeFirestoreData({
      catalogs: catalogs.slice(0, 50),
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn('saveUserCatalogsToCloud notice:', err);
  }
}

// Load user's multi-catalogs from Firestore
export async function loadUserCatalogsFromCloud(uid: string): Promise<SkuCatalog[] | null> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return null;
  const path = `users/${uid}/catalogs/active_catalogs`;
  try {
    const catalogsRef = doc(db, 'users', uid, 'catalogs', 'active_catalogs');
    const snap = await getDoc(catalogsRef);
    if (snap.exists()) {
      return snap.data().catalogs as SkuCatalog[];
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.GET, path);
    }
    console.warn('loadUserCatalogsFromCloud notice:', err);
  }
  return null;
}
