import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, syncUserProfile } from '../lib/firebase';
import { UserProfile, ThemeMode } from '../types';
import {
  Mail,
  KeyRound,
  ShieldCheck,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { RangeCraftLogo } from './RangeCraftLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  currentTheme: ThemeMode;
  initialMode?: 'login' | 'signup';
  intendedActionMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentTheme,
  initialMode = 'signup',
  intendedActionMessage,
}) => {
  const isLight = currentTheme.includes('light');
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setResetSent(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const isUserCancellation = (err: any) =>
    err?.code === 'auth/popup-closed-by-user' ||
    err?.code === 'auth/cancelled-popup-request' ||
    err?.code === 'auth/user-cancelled' ||
    err?.message?.includes('popup-closed-by-user') ||
    err?.message?.includes('cancelled-popup-request');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });
      localStorage.setItem('rangecraft_auth_user', JSON.stringify(profile));
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      if (isUserCancellation(err)) {
        setError(null);
        return;
      }
      console.error('Google Sign In Error:', err);
      if (err?.code === 'auth/popup-blocked') {
        setError('Your browser blocked the Google sign-in popup. Please allow popups or sign in with your work email below.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('This preview domain is not yet authorized for popup sign-in. Please use email & password below.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled right now. Please sign in with your work email below.');
      } else {
        setError(err?.message || 'Unable to sign in with Google right now. Please try Email & Password below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetSent(false);

    try {
      if (mode === 'signup') {
        if (!email.trim() || !password) {
          throw new Error('Please enter your work email and a password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const profile = await syncUserProfile({
            uid: userCredential.user.uid,
            email: userCredential.user.email || email.trim(),
            displayName: displayName.trim() || userCredential.user.displayName || email.trim().split('@')[0],
          });
          localStorage.setItem('rangecraft_auth_user', JSON.stringify(profile));
          onSuccess(profile);
          onClose();
        } catch (firebaseErr: any) {
          if (firebaseErr?.code === 'auth/email-already-in-use') {
            const loginCred = await signInWithEmailAndPassword(auth, email.trim(), password);
            const profile = await syncUserProfile({
              uid: loginCred.user.uid,
              email: loginCred.user.email || email.trim(),
              displayName: loginCred.user.displayName || displayName.trim() || email.trim().split('@')[0],
            });
            localStorage.setItem('rangecraft_auth_user', JSON.stringify(profile));
            onSuccess(profile);
            onClose();
            return;
          }
          throw firebaseErr;
        }
      } else if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and password.');
        }
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const profile = await syncUserProfile({
          uid: userCredential.user.uid,
          email: userCredential.user.email || email.trim(),
          displayName: userCredential.user.displayName || email.trim().split('@')[0],
        });
        localStorage.setItem('rangecraft_auth_user', JSON.stringify(profile));
        onSuccess(profile);
        onClose();
      } else if (mode === 'reset') {
        if (!email.trim()) {
          throw new Error('Please enter your work email to receive a reset link.');
        }
        await sendPasswordResetEmail(auth, email.trim());
        setResetSent(true);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      let msg = err?.message || 'Authentication error. Please check your details and try again.';
      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        msg = 'Invalid email or password. Double-check your credentials or create a new account.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err?.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a moment or reset your password.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        msg = 'Email/password sign-in is disabled for this project. Please use Continue with Google above.';
      } else if (err?.code === 'auth/network-request-failed') {
        msg = 'Network error while connecting to authentication service. Check your connection and try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full h-[100dvh] sm:h-auto sm:max-h-[92dvh] sm:max-w-md rounded-none sm:rounded-2xl border-0 sm:border shadow-2xl flex flex-col overflow-hidden ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0F172A] border-slate-800 text-slate-100'
        }`}
      >
        {/* Top Brand Bar */}
        <div
          className={`shrink-0 px-6 py-4 border-b flex items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-800'
          }`}
        >
          <RangeCraftLogo size="sm" themeVariant={isLight ? 'light' : 'white'} showSubtitle={false} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {mode === 'signup'
                ? 'Create your workspace'
                : mode === 'login'
                ? 'Sign in to RangeCraft'
                : 'Reset your password'}
            </h2>
            <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {intendedActionMessage ||
                'Plan, validate and optimise FMCG promotions with commercial clarity.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Reset Confirmation */}
          {resetSent && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>Password reset link sent. Check your inbox to continue.</span>
            </div>
          )}

          {/* Live Working Google Sign-In */}
          {mode !== 'reset' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`w-full min-h-[44px] flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                  isLight
                    ? 'bg-white border-slate-300 hover:bg-slate-50 text-slate-900 shadow-2xs'
                    : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-white'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center py-0.5">
                <div className={`flex-grow border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />
                <span className={`px-3 text-xs font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  or continue with email
                </span>
                <div className={`flex-grow border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />
              </div>
            </>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleSubmitEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Full Name
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Morgan"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-[#2563EB] ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    }`}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com.au"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-[#2563EB] ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                  }`}
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset');
                        setError(null);
                      }}
                      className="text-xs font-medium text-[#2563EB] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-[#2563EB] ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    }`}
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Signing in...'
                  : mode === 'signup'
                  ? 'Create Workspace'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Send Reset Link'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Mode Toggle */}
          <div className={`text-center text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {mode === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            ) : mode === 'login' ? (
              <p>
                New to RangeCraft?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
                >
                  Create workspace
                </button>
              </p>
            ) : (
              <p>
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setResetSent(false);
                  }}
                  className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
                >
                  Back to sign in
                </button>
              </p>
            )}
          </div>

          {/* Security Footer */}
          <div
            className={`flex items-center justify-center gap-1.5 text-xs pt-4 border-t ${
              isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Encrypted workspace · Custom Scheduling Rules ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
