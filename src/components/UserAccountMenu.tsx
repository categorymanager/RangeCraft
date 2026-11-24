import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  LogOut,
  Crown,
  Boxes,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import { ThemeMode, UserProfile } from '../types';
import { canClaimFreeTrial, hasActivePaidSubscription } from '../utils/entitlements';

interface UserAccountMenuProps {
  user?: UserProfile | null;
  userEmail?: string;
  onOpenPricingModal?: () => void;
  onOpenInventoryManager?: () => void;
  onOpenEditRange?: () => void;
  onSelectTab?: (tab: any) => void;
  currentTheme?: ThemeMode;
  onSignOut?: () => void;
  onOpenAuthModal?: () => void;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  user,
  userEmail,
  onOpenPricingModal,
  onOpenInventoryManager,
  onOpenEditRange,
  onSelectTab,
  currentTheme = 'light',
  onSignOut,
  onOpenAuthModal,
}) => {
  const isLight = currentTheme.includes('light');
  const [isOpen, setIsOpen] = useState(false);
  const [activePlanTab, setActivePlanTab] = useState<'inclusions' | 'pricing'>('inclusions');
  const menuRef = useRef<HTMLDivElement>(null);
  const mobilePortalRef = useRef<HTMLDivElement>(null);

  const effectiveEmail = user?.email || userEmail || 'Guest Session';
  const tier = user?.subscriptionTier || 'free_trial';

  const tierBadge =
    tier === 'enterprise_tier'
      ? 'ENTERPRISE'
      : tier === 'pro_planner'
      ? 'PRO ACTIVE'
      : tier === 'starter_plan'
      ? 'STARTER'
      : user
      ? 'FREE FOREVER'
      : 'GUEST';

  const tierTitle =
    tier === 'enterprise_tier'
      ? 'Enterprise Portfolio Plan'
      : tier === 'pro_planner'
      ? 'Growth Plan ($149/mo inc. GST)'
      : tier === 'starter_plan'
      ? 'Starter Plan ($59/mo inc. GST)'
      : 'Free Forever ($0)';

  const aiCreditsTotal = user?.unlimitedAi
    ? 'Unlimited'
    : `${(user?.aiGenerationsRemaining ?? 1) + (user?.aiTopUpCredits ?? 0)} credits`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideTrigger = menuRef.current?.contains(target);
      const clickedInsideMobilePortal = mobilePortalRef.current?.contains(target);
      if (!clickedInsideTrigger && !clickedInsideMobilePortal) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeInclusions =
    tier === 'enterprise_tier'
      ? [
          { title: 'Up to 5,000+ SKUs', desc: 'Multi-brand teams and shared master calendars' },
          { title: 'Unlimited AI Scenarios', desc: 'Priority strategist modeling & custom retail feeds' },
          { title: 'Full JBP PPTX & PDF Exports', desc: 'Un-watermarked executive packs & custom SSO' },
        ]
      : tier === 'pro_planner'
      ? [
          { title: '1,000 Active SKUs', desc: 'Full 52-week master planner across categories' },
          { title: '150 AI Scenarios / Month', desc: 'Promo optimisation & Schedule Guard reslotting' },
          { title: 'Un-watermarked JBP Decks', desc: 'Instant PowerPoint & Executive PDF downloads' },
          { title: '1-Click Schedule Guard', desc: 'Automated minimum hiatus compliance engine' },
        ]
      : tier === 'starter_plan'
      ? [
          { title: '150 Active SKUs', desc: 'Full 52-week promo planner & CSV import/export' },
          { title: '30 AI Scenarios / Month', desc: 'Upgradeable anytime with +50 AI Top-Up packs ($29)' },
          { title: 'Clean Excel & CSV Exports', desc: 'Watermarked PPTX previews included' },
        ]
      : [
          { title: '1 Active SKU Sandbox', desc: 'Interactive Q1 & Q2 preview & Margin Leak Audit' },
          { title: '1 Free AI Scenario Run', desc: 'Test 52-week automated slot generation' },
          { title: 'Wholesale Orders Hub', desc: 'Track carton POs and volume break tiers' },
        ];

  const trialEligible = canClaimFreeTrial(user);
  const isPaidActive = hasActivePaidSubscription(user);

  const pricingTiers = [
    ...(!trialEligible || isPaidActive
      ? []
      : [
          {
            name: 'Free Forever',
            price: '$0',
            period: '/mo',
            badge: tier === 'free_trial' ? 'CURRENT' : 'Sandbox',
            isCurrent: tier === 'free_trial',
            features: ['1 Active SKU', '1 AI Scenario', 'Q1 & Q2 preview'],
          },
        ]),
    {
      name: 'Starter Plan',
      price: '$59',
      period: '/mo inc. GST',
      badge: tier === 'starter_plan' ? 'CURRENT' : '$590/yr',
      isCurrent: tier === 'starter_plan',
      features: ['150 SKUs', '30 Scenario Runs/mo', 'Full 52W Planner & Excel'],
    },
    {
      name: 'Growth Plan',
      price: '$149',
      period: '/mo inc. GST',
      badge: tier === 'pro_planner' ? 'CURRENT' : trialEligible ? '14-Day Trial' : 'Popular',
      isCurrent: tier === 'pro_planner',
      features: ['1,000 SKUs', '150 Scenario Runs/mo', 'Un-watermarked JBP & Custom Rules'],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Quote',
      badge: tier === 'enterprise_tier' ? 'CURRENT' : 'Multi-Brand',
      isCurrent: tier === 'enterprise_tier',
      features: ['Unlimited SKUs & Teams', 'Unlimited AI Scenarios', 'ERP / POS Data Integration'],
    },
  ];

  const renderPanelContent = (isMobileSheet: boolean) => (
    <>
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-[#111338] via-indigo-900 to-indigo-800 text-white shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-white/15 text-white flex items-center justify-center font-black text-base border border-white/25 shrink-0">
              {effectiveEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm tracking-tight truncate text-[#FFFFFF]">
                {user ? effectiveEmail : 'Not signed in'}
              </h4>
              <span className="text-[11px] text-indigo-200 font-medium block truncate">
                {user?.companyName || 'RangeCraft AU Workspace'}
              </span>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold">
                  <Crown className="w-3 h-3 text-amber-300" />
                  {tierTitle}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-indigo-100 text-[10px] font-semibold">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {aiCreditsTotal}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close account sheet"
            className={`${
              isMobileSheet ? 'min-h-[44px] min-w-[44px]' : 'p-1.5'
            } flex items-center justify-center rounded-xl text-indigo-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`flex border-b text-xs font-bold shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#141a2c] border-slate-800 text-slate-400'
        }`}
      >
        <button
          type="button"
          onClick={() => setActivePlanTab('inclusions')}
          className={`flex-1 min-h-[42px] py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
            activePlanTab === 'inclusions'
              ? isLight
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-indigo-500 text-indigo-300'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Active Inclusions
        </button>
        <button
          type="button"
          onClick={() => setActivePlanTab('pricing')}
          className={`flex-1 min-h-[42px] py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
            activePlanTab === 'pricing'
              ? isLight
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-indigo-500 text-indigo-300'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Plans & Top-Ups
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="p-4 flex-1 overflow-y-auto overscroll-contain min-h-0 space-y-2.5 sm:max-h-[300px]">
        {activePlanTab === 'inclusions' ? (
          <div className="space-y-2">
            {activeInclusions.map((item, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-[#151b2e] border-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs leading-tight">
                  <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {pricingTiers.map((t, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border ${
                  t.isCurrent
                    ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/30'
                    : isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#151b2e] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h5 className={`font-bold text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.name}</h5>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                        t.isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isLight
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {t.badge}
                    </span>
                  </div>
                  <div className="font-mono font-black text-xs tabular-nums whitespace-nowrap shrink-0">
                    {t.price} <span className="text-[10px] font-normal text-slate-500">{t.period}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 my-1.5">
                  {t.features.join(' · ')}
                </p>

                {!t.isCurrent && onOpenPricingModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenPricingModal();
                    }}
                    className={`w-full mt-1.5 min-h-[38px] py-1.5 rounded-xl font-bold text-[11px] transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    Select {t.name}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Quick Actions */}
      <div
        className={`p-3 border-t space-y-1 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121728] border-slate-800'
        }`}
      >
        {onSelectTab && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onSelectTab('dashboard');
            }}
            className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isLight ? 'hover:bg-white text-slate-700' : 'hover:bg-[#1a233c] text-slate-200'
            }`}
          >
            <span>Open Executive Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}

        {onOpenInventoryManager && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenInventoryManager();
            }}
            className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isLight ? 'hover:bg-white text-slate-700' : 'hover:bg-[#1a233c] text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-500" />
              <span>SKU Stock Manager</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}

        {onOpenEditRange && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenEditRange();
            }}
            className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isLight ? 'hover:bg-white text-slate-700' : 'hover:bg-[#1a233c] text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>Edit Product Range & RRPs</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}

        {onOpenPricingModal && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenPricingModal();
            }}
            className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isLight ? 'hover:bg-white text-slate-700' : 'hover:bg-[#1a233c] text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>Plans, Top-Ups & Invoices</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}

        {user && onSignOut ? (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onSignOut();
            }}
            className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-rose-600 ${
              isLight ? 'hover:bg-rose-50' : 'hover:bg-rose-950/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
        ) : onOpenAuthModal ? (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenAuthModal();
            }}
            className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-indigo-600 ${
              isLight ? 'hover:bg-indigo-50' : 'hover:bg-indigo-950/30'
            }`}
          >
            <span>Sign In / Create Free Account</span>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        ) : null}
      </div>
    </>
  );

  const mobileAccountSheetPortal =
    typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {isOpen && (
              <div key="mobile-account-sheet-wrapper" className="sm:hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-xs"
                  aria-hidden="true"
                />
                <motion.div
                  ref={mobilePortalRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Account and Plan Sheet"
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className={`fixed inset-x-3 top-3 z-[80] max-h-[calc(100dvh-24px)] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1424] border-slate-700 text-white'
                  }`}
                >
                  {renderPanelContent(true)}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        id="header-account-menu-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Account & Plan Menu"
        className={`flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl border transition-all cursor-pointer select-none whitespace-nowrap shrink-0 ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
            : isLight
            ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
            : 'bg-[#151b2e] border-slate-700 hover:border-slate-600 text-slate-200 hover:bg-[#1a233c]'
        }`}
        title="Account & Plan Status"
      >
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
          <User className="w-4 h-4" />
        </div>

        <div className="hidden md:flex flex-col text-left leading-tight pr-1">
          <span className="text-[11px] font-bold truncate max-w-[110px]">
            {user ? effectiveEmail.split('@')[0] : 'Account'}
          </span>
          <span className={`text-[9px] font-bold ${isOpen ? 'text-indigo-100' : 'text-emerald-600'}`}>
            {tierBadge}
          </span>
        </div>
      </button>

      {/* Desktop Anchored Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="desktop-account-popover"
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.14 }}
            className={`hidden sm:flex flex-col absolute right-0 mt-2 w-96 max-w-[calc(100vw-24px)] max-h-[calc(100dvh-5.5rem)] rounded-3xl border shadow-2xl z-[80] overflow-hidden ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1424] border-slate-700 text-white'
            }`}
          >
            {renderPanelContent(false)}
          </motion.div>
        )}
      </AnimatePresence>

      {mobileAccountSheetPortal}
    </div>
  );
};
