import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { StrategyKPIs, ThemeMode, UserProfile, AppTab } from '../types';
import { useActiveCurrency, CURRENCY_CONFIGS } from '../utils/currency';
import { canClaimFreeTrial, hasActivePaidSubscription } from '../utils/entitlements';
import {
  Building2,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Moon,
  Sun,
  Check,
  Menu,
  X,
  Layers,
  Calendar,
  FileText,
  Lock,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Users,
  Tag,
  Activity,
  ArrowRight,
  Zap,
  SlidersHorizontal,
  Compass,
  Boxes,
  ShoppingCart,
  LayoutGrid,
  HelpCircle,
  ScanBarcode,
} from 'lucide-react';

import { RangeCraftLogo } from './RangeCraftLogo';
import { UserAccountMenu } from './UserAccountMenu';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  kpis: StrategyKPIs;
  user: UserProfile | null;
  onOpenAuthModal: () => void;
  onOpenPricingModal: () => void;
  onSignOut: () => void;
  onOpenAiOptimizer: () => void;
  onExportCsv?: () => void;
  onOpenAddSku?: () => void;
  onOpenUploadModal?: () => void;
  onOpenAboutModal?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenInventoryManager?: () => void;
  onOpenEditRange?: () => void;
  selectedWeekNum?: number;
  currentTheme: ThemeMode;
  onOpenThemeModal?: () => void;
  onSelectTheme: (theme: ThemeMode) => void;
  isLandingPage?: boolean;
  isSaving?: boolean;
  lastSyncedTime?: string | null;
  productsCount?: number;
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  tab: AppTab;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    title: '1. Range Diagnostics',
    subtitle: 'SKUs, COGS & Margins',
    tab: 'catalog',
    badge: 'Range',
    icon: Layers,
  },
  {
    id: 'step-2',
    stepNumber: 2,
    title: '2. Promotional Planner',
    subtitle: '52-Week Calendar',
    tab: 'calendar',
    badge: '52W Grid',
    icon: Calendar,
  },
  {
    id: 'step-3',
    stepNumber: 3,
    title: '3. Schedule Guard',
    subtitle: 'Custom Rules Checks',
    tab: 'clashes',
    badge: 'Rules',
    icon: ShieldCheck,
  },
  {
    id: 'step-4',
    stepNumber: 4,
    title: '4. Executive JBP Deck',
    subtitle: 'Buyer Pitch Export',
    tab: 'executive-briefing',
    badge: 'JBP Deck',
    icon: FileText,
  },
  {
    id: 'step-5',
    stepNumber: 5,
    title: '5. Trade Waterfall',
    subtitle: 'Scan Rebates & Terms',
    tab: 'analytics',
    badge: 'Lock Plan',
    icon: Lock,
  },
];

interface ToolItem {
  name: string;
  description: string;
  tab: AppTab;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ToolSuiteGroup {
  id: string;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ToolItem[];
}

export const TOOL_SUITES: ToolSuiteGroup[] = [
  {
    id: 'strategy-jbp',
    title: 'Commercial OS',
    badge: 'Executive',
    description: 'Executive performance, promotion builder & insights',
    icon: Compass,
    items: [
      {
        name: 'Executive Dashboard',
        description: 'Forecast revenue, profit & SKUs at risk',
        tab: 'dashboard',
        badge: 'Home',
        icon: LayoutGrid,
      },
      {
        name: 'Promotion Builder',
        description: '4-step guided promotion validation & margin waterfall',
        tab: 'promotion-builder',
        badge: 'Builder',
        icon: Zap,
      },
      {
        name: 'Commercial Insights',
        description: 'Quantified profit recovery & margin risk alerts',
        tab: 'commercial-insights',
        badge: 'Insights',
        icon: TrendingUp,
      },
      {
        name: 'Executive Pitch Deck',
        description: 'Buyer JBP slides & category waterfalls',
        tab: 'executive-briefing',
        badge: 'Reports',
        icon: FileText,
      },
    ],
  },
  {
    id: 'trade-compliance',
    title: 'Calendar & Custom Rules',
    badge: 'Custom Rules',
    description: '52-week scheduling and hiatus thresholds',
    icon: ShieldCheck,
    items: [
      {
        name: '52-Week Retail Calendar',
        description: 'Interactive promo matrix with auto-formulate & reslotter',
        tab: 'calendar',
        badge: '52 Weeks',
        icon: Calendar,
      },
      {
        name: 'Custom Rules & Clash Radar',
        description: 'Automated gap audit & custom scheduling thresholds',
        tab: 'clashes',
        badge: 'Rules',
        icon: ShieldCheck,
      },
      {
        name: 'Week Detail Studio',
        description: 'Weekly mechanics, scan rebates & channel split',
        tab: 'week-studio',
        badge: 'Editor',
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    id: 'sku-margins',
    title: 'Products & Margin',
    badge: 'Profit Engine',
    description: 'Product range, trade spend & carton orders',
    icon: Boxes,
    items: [
      {
        name: 'Product & SKU Matrix',
        description: 'Master SKU catalogue, COGS, RRP & funding tiers',
        tab: 'catalog',
        badge: 'Products',
        icon: Layers,
      },
      {
        name: 'Margin Simulator & Trade Spend',
        description: 'Scan funding, co-op spend & dead net margins',
        tab: 'analytics',
        badge: 'Simulator',
        icon: BarChart3,
      },
      {
        name: 'Wholesale Carton Orders',
        description: 'Volume break tiers, breakeven & settlement tracking',
        tab: 'wholesale',
        badge: 'Orders',
        icon: ShoppingCart,
      },
      {
        name: 'Scan & Order',
        description: 'Mobile barcode scanner & supplier-split PO builder',
        tab: 'scan-order',
        badge: 'Scanner',
        icon: ScanBarcode,
      },
      {
        name: 'Breakeven & Basket Simulator',
        description: 'Volume lift modeling and basket drivers',
        tab: 'breakeven-basket',
        badge: 'Simulator',
        icon: Zap,
      },
      {
        name: 'SKU Deletion Engine',
        description: 'Range rationalisation & tail SKU audit',
        tab: 'deletion-engine',
        badge: 'Audit',
        icon: Tag,
      },
    ],
  },
  {
    id: 'governance-crm',
    title: 'CRM & Governance',
    badge: 'Channels',
    description: 'Channel terms, team & activity logs',
    icon: Users,
    items: [
      {
        name: 'Partner CRM & Terms',
        description: 'Channel buyer contacts, deals & trading terms',
        tab: 'crm',
        badge: 'Channels',
        icon: Building2,
      },
      {
        name: 'Market Intelligence',
        description: 'Category promo depth & pricing benchmarks',
        tab: 'market-intel',
        badge: 'Intel',
        icon: Sparkles,
      },
      {
        name: 'Activity History & Audit Log',
        description: 'Timestamped log of schedule edits and billing',
        tab: 'activity-log',
        badge: 'Logs',
        icon: Activity,
      },
    ],
  },
];

const CORE_STEP_TABS: AppTab[] = ['catalog', 'calendar', 'clashes', 'executive-briefing', 'analytics'];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuthModal,
  onOpenPricingModal,
  onSignOut,
  onOpenAiOptimizer,
  onOpenAboutModal,
  onOpenInventoryManager,
  onOpenEditRange,
  currentTheme,
  onSelectTheme,
  productsCount = 0,
}) => {
  const isLight = currentTheme.includes('light');
  const isRangeLocked = productsCount === 0;
  const { currency, setCurrency } = useActiveCurrency();

  const [isSuitesDropdownOpen, setIsSuitesDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'workspaces'>(user ? 'workspaces' : 'overview');

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (user) {
      setDrawerTab('workspaces');
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsSuitesDropdownOpen(false);
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
        setIsSuitesDropdownOpen(false);
        setIsCurrencyDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isMobileDrawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileDrawerOpen]);

  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.tab === activeTab);
  const currencyOptions = Object.values(CURRENCY_CONFIGS);

  const navigateTo = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
    setIsSuitesDropdownOpen(false);
  };

  const scrollToLandingSection = (sectionId: string) => {
    setIsMobileDrawerOpen(false);
    if (activeTab !== 'overview') {
      setActiveTab('overview');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const primaryLinks: { label: string; tab: AppTab }[] = [
    { label: 'Dashboard', tab: 'dashboard' },
    { label: 'Promotions', tab: 'promotion-builder' },
    { label: 'Products', tab: 'catalog' },
    { label: 'Calendar', tab: 'calendar' },
    { label: 'Scan & Order', tab: 'scan-order' },
    { label: 'Insights', tab: 'commercial-insights' },
  ];

  const isPublicOverview = activeTab === 'overview';
  const showStepBar = !isPublicOverview && CORE_STEP_TABS.includes(activeTab);

  const mobileDrawerPortal =
    typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {isMobileDrawerOpen && (
              <motion.div
                key="mobile-drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-xs"
                aria-hidden="true"
              />
            )}

            {isMobileDrawerOpen && (
              <motion.div
                key="mobile-drawer-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile Navigation Drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                  className={`fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm h-[100dvh] flex flex-col border-l shadow-2xl overflow-hidden overscroll-contain ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b0f19] border-slate-800 text-slate-100'
                  }`}
                >
                  {/* Drawer Header */}
                  <div
                    className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
                      isLight ? 'border-slate-200' : 'border-slate-800'
                    }`}
                  >
                    <RangeCraftLogo size="sm" showSubtitle={false} />
                    <button
                      type="button"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                        isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      aria-label="Close Navigation Drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Mode Switcher (hide Overview marketing anchors when signed in) */}
                  {!user && (
                    <div className="px-4 pt-3 shrink-0">
                      <div
                        className={`grid grid-cols-2 p-1 rounded-2xl border text-xs font-bold ${
                          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setDrawerTab('overview')}
                          className={`min-h-[40px] py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                            drawerTab === 'overview'
                              ? isLight
                                ? 'bg-white text-indigo-700 shadow-xs'
                                : 'bg-slate-800 text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          Overview & Plans
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawerTab('workspaces')}
                          className={`min-h-[40px] py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                            drawerTab === 'workspaces'
                              ? isLight
                                ? 'bg-white text-indigo-700 shadow-xs'
                                : 'bg-slate-800 text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          Workspaces
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scrollable Drawer Content */}
                  <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5">
                    {/* Mobile Display Preferences & AI Strategist Shortcut (Moved from Top Bar) */}
                    <div
                      className={`p-3.5 rounded-2xl border space-y-3 ${
                        isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Display Currency
                          </span>
                          <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {currency}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {currencyOptions.map((opt) => {
                            const selected = currency === opt.code;
                            return (
                              <button
                                key={opt.code}
                                type="button"
                                onClick={() => setCurrency(opt.code)}
                                className={`min-h-[38px] px-1.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex flex-col items-center justify-center border ${
                                  selected
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                    : isLight
                                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                <span className="text-xs leading-none">{opt.flag}</span>
                                <span className="font-mono text-[10px] mt-0.5 leading-none">{opt.code}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onSelectTheme(isLight ? 'dark' : 'light')}
                          className={`flex-1 min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                              : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                          }`}
                        >
                          {isLight ? (
                            <>
                              <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Dark Mode</span>
                            </>
                          ) : (
                            <>
                              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Light Mode</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMobileDrawerOpen(false);
                            onOpenAiOptimizer();
                          }}
                          className={`flex-1 min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                            isLight
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                              : 'bg-indigo-950/60 border-indigo-800 text-indigo-300 hover:bg-indigo-900/60'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span>Auto-Formulate</span>
                        </button>
                      </div>
                    </div>

                    {!user && drawerTab === 'overview' ? (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => scrollToLandingSection('how-it-works')}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 rounded-2xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                            isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-slate-900 text-slate-200'
                          }`}
                        >
                          <span>Retail Channels</span>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollToLandingSection('why-rangecraft')}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 rounded-2xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                            isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-slate-900 text-slate-200'
                          }`}
                        >
                          <span>Why Not Excel</span>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollToLandingSection('roi-demonstrator-section')}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 rounded-2xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                            isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-slate-900 text-slate-200'
                          }`}
                        >
                          <span>Profit Recovery &amp; Checker</span>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollToLandingSection('pricing-section')}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 rounded-2xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                            isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-slate-900 text-slate-200'
                          }`}
                        >
                          <span>
                            {hasActivePaidSubscription(user)
                              ? 'Plans & Billing'
                              : canClaimFreeTrial(user)
                              ? 'Pricing & 14-Day Trial'
                              : 'Commercial Plans'}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollToLandingSection('faq-section')}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 rounded-2xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                            isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-slate-900 text-slate-200'
                          }`}
                        >
                          <span>Commercial FAQs</span>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>

                        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => navigateTo('scan-order')}
                            className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 rounded-2xl text-left text-sm font-bold transition-colors cursor-pointer ${
                              isLight ? 'bg-emerald-50 text-emerald-800' : 'bg-emerald-950/50 text-emerald-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <ScanBarcode className="w-4 h-4" />
                              <span>Scan &amp; Order (PO Builder)</span>
                            </div>
                            <ArrowRight className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => navigateTo('dashboard')}
                            className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 rounded-2xl text-left text-sm font-bold transition-colors cursor-pointer ${
                              isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-950/60 text-blue-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <LayoutGrid className="w-4 h-4" />
                              <span>Open Executive Dashboard</span>
                            </div>
                            <ArrowRight className="w-4 h-4" />
                          </button>

                          {onOpenAboutModal && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileDrawerOpen(false);
                                onOpenAboutModal();
                              }}
                              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 rounded-2xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                                isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-900 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-slate-400" />
                                <span>About RangeCraft AU</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => navigateTo('dashboard')}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 rounded-2xl text-left text-sm font-bold cursor-pointer ${
                            activeTab === 'dashboard'
                              ? 'bg-[#2563EB] text-white'
                              : isLight
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-slate-900 text-slate-200'
                          }`}
                        >
                          <span>Executive Dashboard</span>
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        {primaryLinks.slice(1).map((link) => {
                          const locked = isRangeLocked && link.tab !== 'catalog' && link.tab !== 'scan-order';
                          return (
                            <button
                              key={link.tab}
                              type="button"
                              onClick={() => navigateTo(link.tab)}
                              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold cursor-pointer ${
                                activeTab === link.tab
                                  ? 'bg-indigo-600 text-white'
                                  : isLight
                                  ? 'hover:bg-slate-50 text-slate-700 border border-slate-200'
                                  : 'hover:bg-slate-900 text-slate-300 border border-slate-800'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {link.tab === 'scan-order' && <ScanBarcode className="w-3.5 h-3.5 shrink-0" />}
                                {locked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                <span>{link.label}</span>
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                            </button>
                          );
                        })}
                        <div className="pt-2 space-y-1.5">
                          {TOOL_SUITES.flatMap(s => s.items).map((item) => {
                            const ItemIcon = item.icon;
                            const locked = isRangeLocked && item.tab !== 'catalog' && item.tab !== 'scan-order';
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => navigateTo(item.tab)}
                                className={`w-full min-h-[42px] flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer ${
                                  activeTab === item.tab
                                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                                    : isLight
                                    ? 'hover:bg-slate-50 text-slate-600'
                                    : 'hover:bg-slate-900 text-slate-400'
                                }`}
                              >
                                <span className="flex items-center gap-2.5 min-w-0">
                                  <ItemIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span className="truncate">{item.name}</span>
                                </span>
                                {locked && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Drawer Footer CTA */}
                  <div
                    className={`p-4 border-t shrink-0 space-y-2.5 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090d16] border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        user ? navigateTo('billing') : onOpenAuthModal();
                      }}
                      className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl border text-xs font-bold cursor-pointer ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                          : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {user ? 'Open My Account & Billing' : 'Sign In / Create Free Account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        hasActivePaidSubscription(user) ? navigateTo('billing') : onOpenPricingModal();
                      }}
                      className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>
                        {hasActivePaidSubscription(user)
                          ? 'Manage Billing & Plan'
                          : canClaimFreeTrial(user)
                          ? 'Start 14-Day Growth Trial'
                          : 'Upgrade Plan'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <>
      <header
        ref={headerRef}
        id="main-app-header"
        className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
          isLight ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-slate-100'
        }`}
      >
        {/* Decorative blur surface placed on an isolated sibling layer so backdrop-filter never traps fixed descendants */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 -z-10 pointer-events-none backdrop-blur-md transition-colors duration-200 ${
            isLight ? 'bg-white/95' : 'bg-[#0b0f19]/95'
          }`}
        />

        {/* Main Clean 3-Zone Header Bar (Mobile keeps Logo, Account & Menu only) */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
            {/* LEFT: Single Clean Brand Mark */}
            <div className="flex items-center min-w-0 shrink-0">
              <button
                id="header-brand-logo"
                type="button"
                onClick={() => navigateTo(user ? 'dashboard' : 'overview')}
                className="cursor-pointer text-left focus:outline-none whitespace-nowrap shrink-0 min-h-[44px] flex items-center"
                aria-label={user ? 'RangeCraft Dashboard' : 'RangeCraft Home'}
              >
                <span className="inline-flex items-center sm:hidden">
                  <RangeCraftLogo size="sm" showSubtitle={false} />
                </span>
                <span className="hidden sm:inline-flex items-center">
                  <RangeCraftLogo size="md" showSubtitle={false} />
                </span>
              </button>
            </div>

            {/* CENTER: Clean Landing Links vs Concise Workspace Nav */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Primary Navigation">
              {isPublicOverview && !user ? (
                <>
                  {[
                    { label: 'How It Works', id: 'how-it-works' },
                    { label: 'Why Not Excel', id: 'why-rangecraft' },
                    { label: 'Profit Checker', id: 'roi-demonstrator-section' },
                    { label: 'Pricing', id: 'pricing-section' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToLandingSection(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isLight
                          ? 'text-slate-600 hover:text-[#2563EB] hover:bg-slate-100'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => navigateTo('scan-order')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isLight
                        ? 'text-slate-600 hover:text-[#2563EB] hover:bg-slate-100'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ScanBarcode className="w-3.5 h-3.5 shrink-0" />
                    <span>Scan &amp; Order</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('dashboard')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isLight
                        ? 'text-slate-600 hover:text-[#2563EB] hover:bg-slate-100'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Workspace
                  </button>
                </>
              ) : (
                primaryLinks.map((link) => {
                  const isActive = activeTab === link.tab;
                  const locked = isRangeLocked && link.tab !== 'catalog' && link.tab !== 'scan-order';
                  return (
                    <button
                      key={link.tab}
                      type="button"
                      onClick={() => navigateTo(link.tab)}
                      title={locked ? 'Add or import at least 1 SKU first' : link.label}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-[#2563EB] text-white shadow-xs'
                          : isLight
                          ? 'text-slate-700 hover:text-[#2563EB] hover:bg-slate-100'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {link.tab === 'scan-order' && <ScanBarcode className="w-3.5 h-3.5 shrink-0" />}
                      {locked && <Lock className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
                      <span>{link.label}</span>
                    </button>
                  );
                })
              )}

              {/* More Tools Suites Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsCurrencyDropdownOpen(false);
                    setIsSuitesDropdownOpen(prev => !prev);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSuitesDropdownOpen
                      ? isLight
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-indigo-950 text-indigo-300'
                      : isLight
                      ? 'text-slate-700 hover:text-indigo-700 hover:bg-slate-100'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>Tools</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSuitesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isSuitesDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[620px] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-3xl border shadow-2xl p-4 z-50 grid grid-cols-2 gap-3 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1424] border-slate-700 text-slate-100'
                      }`}
                    >
                      {TOOL_SUITES.map((suite) => {
                        const SuiteIcon = suite.icon;
                        return (
                          <div
                            key={suite.id}
                            className={`p-3 rounded-2xl border ${
                              isLight ? 'bg-slate-50/70 border-slate-200/70' : 'bg-slate-900/60 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2 px-1">
                              <div className="flex items-center gap-1.5">
                                <SuiteIcon className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                  {suite.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600">{suite.badge}</span>
                            </div>
                            <div className="space-y-1">
                              {suite.items.map((item) => {
                                const ItemIcon = item.icon;
                                const isItemActive = activeTab === item.tab;
                                return (
                                  <button
                                    key={item.name}
                                    type="button"
                                    onClick={() => navigateTo(item.tab)}
                                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                                      isItemActive
                                        ? 'bg-indigo-600 text-white'
                                        : isLight
                                        ? 'hover:bg-white text-slate-700'
                                        : 'hover:bg-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <ItemIcon
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isItemActive ? 'text-white' : 'text-indigo-500'
                                      }`}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold truncate">{item.name}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* RIGHT: Account & Hamburger on mobile; full utilities from md upward */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Currency Switcher (tablet & desktop; also inside mobile drawer) */}
              <div className="relative hidden md:block">
                <button
                  id="header-currency-dropdown-btn"
                  type="button"
                  onClick={() => {
                    setIsSuitesDropdownOpen(false);
                    setIsCurrencyDropdownOpen(prev => !prev);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isLight
                      ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                  }`}
                  title="Switch Display Currency"
                  aria-label={`Current Currency: ${currency}`}
                >
                  <span className="text-sm">{CURRENCY_CONFIGS[currency]?.flag || '🇦🇺'}</span>
                  <span className="font-mono text-xs">{currency}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <AnimatePresence>
                  {isCurrencyDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className={`absolute right-0 top-full mt-2 w-48 max-w-[calc(100vw-24px)] max-h-[70dvh] overflow-y-auto rounded-2xl border shadow-2xl p-2 z-50 ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1424] border-slate-700 text-slate-100'
                      }`}
                    >
                      <div className="px-2.5 py-1 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Currency
                      </div>
                      <div className="space-y-0.5">
                        {currencyOptions.map((opt) => (
                          <button
                            key={opt.code}
                            type="button"
                            onClick={() => {
                              setCurrency(opt.code);
                              setIsCurrencyDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                              currency === opt.code
                                ? 'bg-indigo-50 text-indigo-700 font-bold'
                                : isLight
                                ? 'hover:bg-slate-100 text-slate-700'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{opt.flag}</span>
                              <span>
                                {opt.code} ({opt.symbol})
                              </span>
                            </div>
                            {currency === opt.code && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Toggle (tablet & desktop; also inside mobile drawer) */}
              <button
                id="header-theme-toggle-btn"
                type="button"
                onClick={() => onSelectTheme(currentTheme.includes('light') ? 'dark' : 'light')}
                className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 hidden md:inline-flex items-center justify-center ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
                title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                aria-label="Toggle Theme"
              >
                {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Commercial Scenario Auto-Formulator Button */}
              <button
                id="header-ai-strategist-btn"
                type="button"
                onClick={onOpenAiOptimizer}
                className={`p-2 rounded-xl border transition-colors cursor-pointer hidden md:flex items-center justify-center shrink-0 ${
                  isLight
                    ? 'bg-white border-slate-200 text-[#2563EB] hover:bg-blue-50'
                    : 'bg-slate-800 border-slate-700 text-blue-300 hover:bg-blue-950/60'
                }`}
                title="Auto-Formulate 52-Week Schedule"
                aria-label="Auto-Formulate 52-Week Schedule"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Primary CTA: Manage Plan / Upgrade Plan / Start Free Trial */}
              <button
                id="header-primary-trial-cta"
                type="button"
                onClick={() => (hasActivePaidSubscription(user) ? setActiveTab('billing') : onOpenPricingModal())}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>
                  {hasActivePaidSubscription(user)
                    ? 'Manage Plan'
                    : canClaimFreeTrial(user)
                    ? 'Start Free Trial'
                    : 'Upgrade Plan'}
                </span>
              </button>

              {/* User Account Menu (Always visible on mobile & desktop) */}
              <UserAccountMenu
                user={user}
                userEmail={user?.email}
                onOpenPricingModal={onOpenPricingModal}
                onOpenInventoryManager={onOpenInventoryManager}
                onOpenEditRange={onOpenEditRange}
                onSelectTab={setActiveTab}
                currentTheme={currentTheme}
                onSignOut={onSignOut}
                onOpenAuthModal={onOpenAuthModal}
              />

              {/* Mobile Drawer Trigger */}
              <button
                id="header-mobile-menu-toggle-btn"
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border lg:hidden transition-colors cursor-pointer shrink-0 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
                aria-label="Open Navigation Drawer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tablet & Desktop 5-Step Sequential Progress Bar */}
        {showStepBar && (
          <div
            className={`hidden md:block border-t py-2 px-4 sm:px-6 lg:px-8 transition-colors ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#090d16]/80 border-slate-800'
            }`}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
              {WORKFLOW_STEPS.map((step, index) => {
                const isCompleted = currentStepIndex !== -1 && index < currentStepIndex;
                const isActive = step.tab === activeTab;
                const StepIcon = step.icon;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      id={`header-nav-step-${step.stepNumber}`}
                      type="button"
                      onClick={() => navigateTo(step.tab)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isCompleted
                          ? isLight
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                          : isLight
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <StepIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      )}
                      <span>{step.title}</span>
                    </button>
                    {index < WORKFLOW_STEPS.length - 1 && (
                      <div className={`w-4 h-px shrink-0 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {mobileDrawerPortal}
    </>
  );
};
