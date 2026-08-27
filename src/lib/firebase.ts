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
  getFirestore, 
  doc, 
  getDoc, 
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

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const PRICING_PLANS = [
  {
    id: 'free_trial' as SubscriptionTier,
    name: 'Free Forever',
    priceAud: 0,
    billingPeriod: 'month' as const,
    tagline: 'Audit & Sandbox Tier for preliminary SKU assessment and compliance checks.',
    features: [
      { text: '1 Active SKU Intake & Sandbox Testing', included: true },
      { text: 'Q1 & Q2 Promotional Calendar Previews', included: true },
      { text: 'Basic ACCC 4-Week Hiatus Compliance Guard', included: true },
      { text: '1 AI Strategist Scenario Run / Month', included: true },
      { text: 'Watermarked Basic PDF Exports', included: true },
      { text: 'Full 52-Week Planning (Q3 & Q4)', included: false },
      { text: 'Board-Ready Un-watermarked PPTX/PDF JBP Decks', included: false },
    ],
    ctaText: 'Start Free Sandbox',
  },
  {
    id: 'pro_planner' as SubscriptionTier,
    name: 'Commercial Pro',
    priceAud: 149,
    billingPeriod: 'month' as const,
    popularBadge: 'MOST POPULAR • 14-DAY TRIAL',
    tagline: 'Definitive commercial engine for FMCG Brand KAMs, Category Leads & Suppliers.',
    features: [
      { text: '14-Day Full Access Trial (No Credit Card Required)', included: true, highlight: true },
      { text: 'Unlimited 52-Week Master Grid & Drag-Drop Reslotting', included: true, highlight: true },
      { text: 'Unlimited Gemini AI Scenario Copilot & Trade Strategies', included: true, highlight: true },
      { text: 'Un-watermarked PPTX & PDF JBP Executive Decks', included: true, highlight: true },
      { text: 'Trade Scan Rebate & Co-Op Margin Simulator', included: true, highlight: true },
      { text: 'Full Omni-Trade B2B CRM & Trade Spend Tracker', included: true, highlight: true },
      { text: 'Automated 1-Click ACCC Hiatus Resolution Engine', included: true, highlight: true },
    ],
    ctaText: 'Start 14-Day Free Pro Trial',
  },
  {
    id: 'enterprise_tier' as SubscriptionTier,
    name: 'Enterprise Portfolio',
    priceAud: 399,
    billingPeriod: 'month' as const,
    tagline: 'For multi-category FMCG teams, major brand portfolios, and national distributors.',
    features: [
      { text: 'Everything in Commercial Pro', included: true },
      { text: 'Multi-User Team Collaboration & Shared Workspaces', included: true, highlight: true },
      { text: 'Custom ERP / POS / Scan-Data Ingestion', included: true, highlight: true },
      { text: 'Bespoke Coles / Woolworths / Metcash JBP Templates', included: true, highlight: true },
      { text: 'Dedicated FMCG Account Manager & Priority 24/7 SLA', included: true, highlight: true },
      { text: 'Custom Legal & Trading Terms Audit Configurations', included: true },
    ],
    ctaText: 'Get Enterprise Suite',
  },
];

// Single export pay-per-item unlock ($19 AUD)
export async function unlockSingleExport(uid: string, exportId: string, currentProfile: UserProfile): Promise<UserProfile> {
  const path = `users/${uid}`;
  const existingUnlocks = currentProfile.unlockedExports || [];
  if (existingUnlocks.includes(exportId)) {
    return currentProfile;
  }
  const updatedUnlocks = [...existingUnlocks, exportId];
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, sanitizeFirestoreData({
      unlockedExports: updatedUnlocks,
      canExportPdf: true
    }));
  } catch (err) {
    console.warn('Firestore unlockSingleExport error, updating local state:', err);
  }
  const updated: UserProfile = {
    ...currentProfile,
    unlockedExports: updatedUnlocks,
    canExportPdf: true
  };
  try {
    localStorage.setItem('rangecraft_auth_user', JSON.stringify(updated));
  } catch (e) {}
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  const defaultProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Australian Category Planner',
    subscriptionTier: (user as UserProfile).subscriptionTier || 'free_trial',
    subscriptionStatus: (user as UserProfile).subscriptionStatus || 'active',
    aiGenerationsRemaining: (user as UserProfile).aiGenerationsRemaining ?? 5,
    unlimitedAi: (user as UserProfile).unlimitedAi ?? false,
    canExportPdf: (user as UserProfile).canExportPdf ?? false,
    canAutoReslot: (user as UserProfile).canAutoReslot ?? false,
    maxSkusAllowed: (user as UserProfile).maxSkusAllowed ?? 15,
    unlockedExports: (user as UserProfile).unlockedExports || [],
    trialExpiresAt: (user as UserProfile).trialExpiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: (user as UserProfile).createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  try {
    if (auth.authStateReady) {
      await auth.authStateReady();
    }
    const userRef = doc(db, 'users', user.uid);
    let snap;
    try {
      snap = await getDoc(userRef);
    } catch (err) {
      console.warn('Firestore user fetch notice, using cached/local profile:', err);
    }

    if (snap && snap.exists()) {
      const data = snap.data() as UserProfile;
      // Merge with any updated fields provided in user object
      const merged: UserProfile = {
        ...data,
        ...((user as UserProfile).subscriptionTier ? { subscriptionTier: (user as UserProfile).subscriptionTier } : {}),
        ...((user as UserProfile).unlockedExports ? { unlockedExports: (user as UserProfile).unlockedExports } : {}),
        lastLoginAt: new Date().toISOString(),
      };
      try {
        await updateDoc(userRef, sanitizeFirestoreData({
          ...merged
        }));
      } catch (err) {
        console.warn('Firestore lastLoginAt update error:', err);
      }
      try {
        localStorage.setItem('rangecraft_auth_user', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    }

    try {
      await setDoc(userRef, sanitizeFirestoreData(defaultProfile));
    } catch (err) {
      console.warn('Firestore setDoc user error:', err);
    }

    try {
      localStorage.setItem('rangecraft_auth_user', JSON.stringify(defaultProfile));
    } catch (e) {}
    return defaultProfile;
  } catch (err: any) {
    console.warn('syncUserProfile fallback to local profile:', err);
    try {
      localStorage.setItem('rangecraft_auth_user', JSON.stringify(defaultProfile));
    } catch (e) {}
    return defaultProfile;
  }
}

export async function saveUserProfileToCloud(profile: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', profile.uid);
    await setDoc(userRef, sanitizeFirestoreData(profile), { merge: true });
    localStorage.setItem('rangecraft_auth_user', JSON.stringify(profile));
  } catch (err) {
    console.warn('saveUserProfileToCloud error:', err);
  }
}

// Upgrade user subscription tier (Simulated Payment / Income Generation Integration)
export async function upgradeSubscription(
  uid: string, 
  tier: SubscriptionTier,
  companyName?: string
): Promise<UserProfile> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const isPro = tier === 'pro_planner';
    const isEnterprise = tier === 'enterprise_tier';

    const updates: Partial<UserProfile> = {
      subscriptionTier: tier,
      subscriptionStatus: 'active',
      unlimitedAi: isPro || isEnterprise,
      canExportPdf: isPro || isEnterprise,
      canAutoReslot: isPro || isEnterprise,
      maxSkusAllowed: isEnterprise ? 5000 : isPro ? 1000 : 15,
      aiGenerationsRemaining: isPro || isEnterprise ? 999999 : 5,
      ...(companyName ? { companyName } : {})
    };

    try {
      await updateDoc(userRef, sanitizeFirestoreData(updates));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }

    const updatedSnap = await getDoc(userRef);
    const updated = updatedSnap.data() as UserProfile;
    try {
      localStorage.setItem('rangecraft_auth_user', JSON.stringify(updated));
    } catch (e) {}
    return updated;
  } catch (err: any) {
    if (err.message && err.message.startsWith('{')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Decrement AI generation quota if on trial
export async function useAiQuota(uid: string, currentProfile: UserProfile): Promise<boolean> {
  if (currentProfile.unlimitedAi || currentProfile.subscriptionTier !== 'free_trial') {
    return true;
  }

  if (currentProfile.aiGenerationsRemaining <= 0) {
    return false;
  }

  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, sanitizeFirestoreData({
      aiGenerationsRemaining: Math.max(0, currentProfile.aiGenerationsRemaining - 1),
    }));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Save user's 52-week plan to Firestore
export async function saveUserPlanToCloud(uid: string, plan: WeekPromotion[]) {
  const path = `users/${uid}/plans/active_plan`;
  try {
    const planRef = doc(db, 'users', uid, 'plans', 'active_plan');
    await setDoc(planRef, sanitizeFirestoreData({
      promotions: plan,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('saveUserPlanToCloud notice:', err);
  }
}

// Load user's 52-week plan from Firestore
export async function loadUserPlanFromCloud(uid: string): Promise<WeekPromotion[] | null> {
  const path = `users/${uid}/plans/active_plan`;
  try {
    const planRef = doc(db, 'users', uid, 'plans', 'active_plan');
    const snap = await getDoc(planRef);
    if (snap.exists()) {
      return snap.data().promotions as WeekPromotion[];
    }
  } catch (err) {
    console.warn('loadUserPlanFromCloud notice:', err);
  }
  return null;
}

// Save user's multi-catalogs to Firestore
export async function saveUserCatalogsToCloud(uid: string, catalogs: SkuCatalog[]) {
  const path = `users/${uid}/catalogs/active_catalogs`;
  try {
    const catalogsRef = doc(db, 'users', uid, 'catalogs', 'active_catalogs');
    await setDoc(catalogsRef, sanitizeFirestoreData({
      catalogs,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('saveUserCatalogsToCloud notice:', err);
  }
}

// Load user's multi-catalogs from Firestore
export async function loadUserCatalogsFromCloud(uid: string): Promise<SkuCatalog[] | null> {
  const path = `users/${uid}/catalogs/active_catalogs`;
  try {
    const catalogsRef = doc(db, 'users', uid, 'catalogs', 'active_catalogs');
    const snap = await getDoc(catalogsRef);
    if (snap.exists()) {
      return snap.data().catalogs as SkuCatalog[];
    }
  } catch (err) {
    console.warn('loadUserCatalogsFromCloud notice:', err);
  }
  return null;
}
