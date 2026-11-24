import { UserProfile } from '../types';

const TRIAL_USED_STORAGE_KEY = 'rc_trial_used';

export function hasActivePaidSubscription(user?: UserProfile | null): boolean {
  if (!user) return false;
  const isPaidTier =
    user.subscriptionTier === 'starter_plan' ||
    user.subscriptionTier === 'pro_planner' ||
    user.subscriptionTier === 'enterprise_tier';
  return isPaidTier && user.subscriptionStatus === 'active';
}

export function markTrialUsedLocal(): void {
  try {
    localStorage.setItem(TRIAL_USED_STORAGE_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

export function hasUsedFreeTrial(user?: UserProfile | null): boolean {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem(TRIAL_USED_STORAGE_KEY) === '1') {
      return true;
    }
  } catch {
    // ignore storage errors
  }

  if (!user) return false;

  if (user.trialUsed) return true;
  if (hasActivePaidSubscription(user)) return true;
  if (user.subscriptionStatus === 'trialing') return true;
  if (user.subscriptionTier && user.subscriptionTier !== 'free_trial') return true;

  if (user.trialExpiresAt) {
    const expiresMs = Date.parse(user.trialExpiresAt);
    if (!Number.isNaN(expiresMs) && expiresMs <= Date.now()) {
      return true;
    }
  }

  if (!user.unlimitedAi && (user.aiGenerationsRemaining ?? 1) <= 0) {
    return true;
  }

  return false;
}

export function canClaimFreeTrial(user?: UserProfile | null): boolean {
  if (hasActivePaidSubscription(user)) return false;
  if (hasUsedFreeTrial(user)) return false;
  return true;
}
