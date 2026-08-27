import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StrategyKPIs, ThemeMode, UserProfile, AppTab } from '../types';
import { useActiveCurrency, CURRENCY_CONFIGS } from '../utils/currency';
import { 
  Building2,
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  Moon,
  Sun,
  LogIn,
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
  HelpCircle
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
}

// 5-Step Sequential Strategy Workflow
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
    badge: 'Range Master', 
    icon: Layers 
  },
  { 
    id: 'step-2', 
    stepNumber: 2, 
    title: '2. Promotional Planner', 
    subtitle: '52-Week Promo Calendar', 
    tab: 'calendar', 
    badge: '52W Planner', 
    icon: Calendar 
  },
  { 
    id: 'step-3', 
    stepNumber: 3, 
    title: '3. Compliance Radar', 
    subtitle: 'ACCC Hiatus & Clash Radar', 
    tab: 'clashes', 
    badge: 'Hiatus Radar', 
    icon: ShieldCheck 
  },
  { 
    id: 'step-4', 
    stepNumber: 4, 
    title: '4. Executive JBP Deck', 
    subtitle: 'Supermarket Pitch Deck', 
    tab: 'executive-briefing', 
    badge: 'Board Ready', 
    icon: FileText 
  },
  { 
    id: 'step-5', 
    stepNumber: 5, 
    title: '5. Lock & Export', 
    subtitle: 'Scan Rebates & Trading Terms', 
    tab: 'analytics', 
    badge: 'Finalize', 
    icon: Lock 
  },
];

// 4 Benefit-Focused Suite Navigation Groups
interface ToolItem {
  name: string;
  description: string;
  tab: AppTab;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  isNew?: boolean;
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
    title: 'Strategy & JBP',
    badge: 'Executive',
    description: 'Commercial roadmaps, funnels and buyer pitch decks',
    icon: Compass,
    items: [
      {
        name: '5-Step Commercial Journey',
        description: 'End-to-end guided strategy from channel baseline to locked plan',
        tab: 'commercial-journey',
        badge: 'Guided',
        icon: TrendingUp,
      },
      {
        name: 'Executive Overview Hub',
        description: 'Macro revenue, blended margin sandbox & category KPIs',
        tab: 'overview',
        badge: 'Macro',
        icon: BarChart3,
      },
      {
        name: 'Executive Pitch Deck Generator',
        description: 'Supermarket buyer JBP slides & cross-merchandise baskets',
        tab: 'executive-briefing',
        badge: 'JBP Deck',
        icon: FileText,
      },
    ],
  },
  {
    id: 'trade-compliance',
    title: 'Trade & Compliance',
    badge: 'ACCC Guard',
    description: '52-week scheduling, hiatus radar and week studio',
    icon: ShieldCheck,
    items: [
      {
        name: '52-Week Master Calendar',
        description: 'Interactive promotional matrix with drag-and-drop slots',
        tab: 'calendar',
        badge: '52 Weeks',
        icon: Calendar,
      },
      {
        name: 'ACCC Hiatus Radar',
        description: 'Automated 4-week gap audit & category cannibalisation checks',
        tab: 'clashes',
        badge: 'Audit',
        icon: ShieldCheck,
      },
      {
        name: 'Week Detail Studio',
        description: 'Weekly mechanics, scan rates, supplier funding & channel split',
        tab: 'week-studio',
        badge: 'Editor',
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    id: 'sku-margins',
    title: 'SKU & Margins',
    badge: 'Profit Engine',
    description: 'Product matrix, scan rebates and margin simulators',
    icon: Boxes,
    items: [
      {
        name: 'Product & SKU Matrix',
        description: 'Master SKU catalogue, COGS, baseline units & funding tiers',
        tab: 'catalog',
        badge: 'Master',
        icon: Layers,
      },
      {
        name: 'Dead Net Waterfall & Financials',
        description: 'Scan funding, co-op trade spend & dead net margin waterfalls',
        tab: 'analytics',
        badge: 'Waterfall',
        icon: BarChart3,
      },
      {
        name: 'Breakeven & Basket Simulator',
        description: 'Volume lift modeling and cross-category basket drivers',
        tab: 'breakeven-basket',
        badge: 'Simulator',
        icon: Zap,
      },
      {
        name: 'SKU Deletion Engine',
        description: 'Range rationalisation and tail SKU deletion audit',
        tab: 'deletion-engine',
        badge: 'Audit',
        icon: Tag,
      },
    ],
  },
  {
    id: 'governance-crm',
    title: 'Governance & CRM',
    badge: 'Omni-Trade',
    description: 'Retailer relationships, trading terms and activity logs',
    icon: Users,
    items: [
      {
        name: 'Omni-Trade B2B CRM',
        description: 'Coles, Woolworths & Metcash buyer dossiers and deals',
        tab: 'crm',
        badge: 'Accounts',
        icon: Users,
      },
      {
        name: 'Trading Terms & Rebates',
        description: 'Settlement discounts, scan rates and vendor agreements',
        tab: 'crm',
        badge: 'Terms',
        icon: Building2,
      },
      {
        name: 'Compliance & Audit Activity Logs',
        description: 'Timestamped audit trail of all promo moves and changes',
        tab: 'activity-log',
        badge: 'Logs',
        icon: Activity,
      },
      {
        name: 'Market Intelligence Benchmarks',
        description: 'Competitor promo depth & supermarket pricing intelligence',
        tab: 'market-intel',
        badge: 'Intel',
        icon: Sparkles,
      },
    ],
  },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuthModal,
  onOpenPricingModal,
  onOpenAiOptimizer,
  onOpenAboutModal,
  onOpenInventoryManager,
  onOpenEditRange,
  currentTheme,
  onSelectTheme,
}) => {
  const isLight = currentTheme.includes('light');
  const { currency, setCurrency } = useActiveCurrency();
  
  // State for dropdowns & mobile drawer
  const [activeSuiteDropdown, setActiveSuiteDropdown] = useState<string | null>(null);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mobileExpandedSuite, setMobileExpandedSuite] = useState<string | null>('strategy-jbp');
  
  const headerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveSuiteDropdown(null);
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
        setActiveSuiteDropdown(null);
        setIsCurrencyDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine which step is currently active
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.tab === activeTab);

  const currencyOptions = Object.values(CURRENCY_CONFIGS);

  const handleStepClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
    setActiveSuiteDropdown(null);
  };

  const handleToolItemClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
    setActiveSuiteDropdown(null);
  };

  return (
    <header 
      ref={headerRef}
      id="main-app-header"
      className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
        isLight 
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-2xs backdrop-blur-md' 
          : 'bg-[#0b0f19]/95 border-slate-800 text-slate-100 shadow-md backdrop-blur-md'
      }`}
    >
      {/* 1. TOP NAVY PURPOSE & COMPLIANCE BANNER */}
      <div className="w-full bg-[#0d1428] text-slate-200 border-b border-indigo-950/80 py-1.5 px-4 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <strong className="text-white font-bold">RangeCraft Trade Engine:</strong> Plan 52-Week Retail Schedules, Protect Margins & Enforce ACCC Hiatus Compliance for Coles, Woolworths & Metcash.
        </span>
      </div>

      {/* 2. MAIN HEADER TOOLBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* LEFT: BRAND IDENTITY & LOGO */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              id="header-brand-logo"
              onClick={() => handleStepClick('overview')}
              className="cursor-pointer text-left focus:outline-none transition-transform hover:scale-[1.02]"
              aria-label="RangeCraft Home"
            >
              <RangeCraftLogo size="md" />
            </button>
          </div>

          {/* CENTER: 4 BENEFIT-FOCUSED TOOL SUITE DROPDOWNS (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Suite Navigation">
            {TOOL_SUITES.map((suite) => {
              const isOpen = activeSuiteDropdown === suite.id;
              const isSuiteActive = suite.items.some(item => item.tab === activeTab);
              const SuiteIcon = suite.icon;

              return (
                <div key={suite.id} className="relative">
                  <button
                    id={`header-suite-${suite.id}`}
                    onClick={() => {
                      setIsCurrencyDropdownOpen(false);
                      setActiveSuiteDropdown(prev => (prev === suite.id ? null : suite.id));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isOpen || isSuiteActive
                        ? isLight
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                          : 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/80 shadow-2xs'
                        : isLight
                          ? 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100 border border-transparent'
                          : 'text-slate-300 hover:text-indigo-400 hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <SuiteIcon className={`w-3.5 h-3.5 ${isSuiteActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`} />
                    <span>{suite.title}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className={`absolute left-0 top-full mt-2 w-76 rounded-2xl border shadow-2xl p-2 z-50 ${
                          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1424] border-slate-700 text-slate-100'
                        }`}
                      >
                        <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <SuiteIcon className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              {suite.title}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {suite.badge}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {suite.items.map((item) => {
                            const isItemActive = activeTab === item.tab;
                            const ItemIcon = item.icon;

                            return (
                              <button
                                key={item.name}
                                onClick={() => handleToolItemClick(item.tab)}
                                className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                  isItemActive
                                    ? isLight
                                      ? 'bg-indigo-50/90 text-indigo-900 border border-indigo-200'
                                      : 'bg-indigo-950/80 text-indigo-100 border border-indigo-800'
                                    : isLight
                                      ? 'hover:bg-slate-100/80 text-slate-700'
                                      : 'hover:bg-slate-800/80 text-slate-300'
                                }`}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                  isItemActive 
                                    ? 'bg-indigo-600 text-white shadow-xs' 
                                    : isLight 
                                      ? 'bg-slate-100 text-slate-600' 
                                      : 'bg-slate-800 text-slate-400'
                                }`}>
                                  <ItemIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold truncate">
                                      {item.name}
                                    </span>
                                    {item.badge && (
                                      <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded shrink-0 ${
                                        isItemActive
                                          ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 font-bold'
                                          : isLight
                                            ? 'bg-slate-100 text-slate-500'
                                            : 'bg-slate-800 text-slate-400'
                                      }`}>
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                                    {item.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* RIGHT: CURRENCY, THEME, AI STRATEGIST, PRIMARY TRIAL CTA & USER */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Dynamic Multi-Currency Dropdown */}
            <div className="relative">
              <button
                id="header-currency-dropdown-btn"
                onClick={() => {
                  setActiveSuiteDropdown(null);
                  setIsCurrencyDropdownOpen(prev => !prev);
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isCurrencyDropdownOpen
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                    : isLight
                      ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      : 'bg-slate-800/90 border-slate-700 hover:bg-slate-800 text-slate-200'
                }`}
                title="Switch Display Currency"
                aria-label={`Current Currency: ${currency}`}
              >
                <span className="text-sm">{CURRENCY_CONFIGS[currency]?.flag || '🇦🇺'}</span>
                <span className="font-mono text-xs hidden sm:inline">{currency}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <AnimatePresence>
                {isCurrencyDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-2xl p-2 z-50 ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1424] border-slate-700 text-slate-100'
                    }`}
                  >
                    <div className="px-2.5 py-1 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Select Currency Base
                    </div>
                    <div className="space-y-0.5">
                      {currencyOptions.map((opt) => (
                        <button
                          key={opt.code}
                          onClick={() => {
                            setCurrency(opt.code);
                            setIsCurrencyDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                            currency === opt.code
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{opt.flag}</span>
                            <span>{opt.code} ({opt.symbol})</span>
                          </div>
                          {currency === opt.code && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle Button (Moon / Sun) */}
            <button
              id="header-theme-toggle-btn"
              onClick={() => onSelectTheme(currentTheme.includes('light') ? 'dark' : 'light')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' 
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title={currentTheme.includes('light') ? 'Switch to Obsidian Dark Mode' : 'Switch to Executive Light Mode'}
              aria-label="Toggle Theme"
            >
              {currentTheme.includes('light') ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* AI Strategist Button with pulsing badge */}
            <button
              id="header-ai-strategist-btn"
              onClick={onOpenAiOptimizer}
              className={`p-2 rounded-xl border relative transition-colors cursor-pointer hidden md:flex items-center justify-center ${
                isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-indigo-950/50 hover:text-indigo-300'
              }`}
              title="AI FMCG Strategy Co-Pilot"
              aria-label="AI FMCG Strategy Co-Pilot"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5 animate-pulse" />
            </button>

            {/* Help / ACCC Compliance Guide */}
            <button
              onClick={onOpenAboutModal}
              className={`p-2 rounded-xl border transition-colors cursor-pointer hidden xl:flex items-center justify-center ${
                isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="ACCC Guidelines & Help Documentation"
              aria-label="Help Documentation"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* QUICK ACTIONS: INVENTORY & EDIT RANGE */}
            {onOpenInventoryManager && (
              <button
                onClick={onOpenInventoryManager}
                className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                    : 'bg-slate-800/90 border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white hover:bg-slate-800'
                }`}
                title="Manage SKU stock levels & promotional reserve allocations"
              >
                <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                <span>Inventory</span>
              </button>
            )}

            {onOpenEditRange && (
              <button
                onClick={onOpenEditRange}
                className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                    : 'bg-slate-800/90 border-slate-700 hover:border-blue-500 text-slate-200 hover:text-white hover:bg-slate-800'
                }`}
                title="Edit Product Range RRPs, COGS & Baselines"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                <span>Edit Range</span>
              </button>
            )}

            {/* PRIMARY CONVERSION CTA BUTTON: "Start 14-Day Free Trial" */}
            <button
              id="header-primary-trial-cta"
              onClick={onOpenPricingModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-600 text-white font-black text-xs shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/45 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Start 14-Day Free Trial</span>
              <span className="sm:hidden">Start Trial</span>
            </button>

            {/* User Account & Subscription Menu */}
            <UserAccountMenu 
              userEmail={user?.email || 'jzaf666@gmail.com'}
              onOpenPricingModal={onOpenPricingModal}
              onOpenInventoryManager={onOpenInventoryManager}
              onOpenEditRange={onOpenEditRange}
              onSelectTab={setActiveTab}
              currentTheme={currentTheme}
            />

            {/* Mobile Menu Hamburger Button */}
            <button
              id="header-mobile-menu-toggle-btn"
              onClick={() => setIsMobileDrawerOpen(true)}
              className={`p-2 rounded-xl border lg:hidden transition-colors cursor-pointer ${
                isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>
        </div>
      </div>

      {/* 3. SEQUENTIAL PROCESS STEPPER & TOOLBAR */}
      <div className={`border-t py-2 px-4 sm:px-6 lg:px-8 transition-colors ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#090d16]/80 border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
          {WORKFLOW_STEPS.map((step, index) => {
            const isCompleted = currentStepIndex !== -1 && index < currentStepIndex;
            const isActive = step.tab === activeTab;
            const StepIcon = step.icon;

            return (
              <React.Fragment key={step.id}>
                <button
                  id={`header-nav-step-${step.stepNumber}`}
                  onClick={() => handleStepClick(step.tab)}
                  className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/50 scale-[1.02]' 
                      : isCompleted
                        ? isLight
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-950/60'
                        : isLight
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
                  }`}
                  title={`${step.title}: ${step.subtitle}`}
                  aria-label={`Workflow Step ${step.stepNumber}: ${step.title}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <StepIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                  )}
                  
                  <span className="font-extrabold">{step.title}</span>
                  
                  {step.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded hidden md:inline ${
                      isActive 
                        ? 'bg-white/20 text-white font-bold' 
                        : isLight 
                          ? 'bg-slate-200/80 text-slate-600' 
                          : 'bg-slate-800 text-slate-400'
                    }`}>
                      {step.badge}
                    </span>
                  )}
                </button>

                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className={`w-3 sm:w-6 h-px shrink-0 hidden sm:block ${
                    isCompleted 
                      ? 'bg-emerald-400/50' 
                      : isLight ? 'bg-slate-200' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 4. FULL RESPONSIVE MOBILE NAVIGATION DRAWER WITH STICKY BOTTOM CONVERSION DOCK */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col border-l shadow-2xl overflow-hidden ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b0f19] border-slate-800 text-slate-100'
              }`}
            >
              {/* Drawer Top Bar */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-xs text-white">
                    <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-base text-slate-900 dark:text-white">
                      RangeCraft
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300">
                      Sequential FMCG Trade Engine
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close Navigation Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* 5-Step Sequential Workflow Section */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Sequential 5-Step Workflow
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      Step {currentStepIndex !== -1 ? currentStepIndex + 1 : 1} of 5
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {WORKFLOW_STEPS.map((step, idx) => {
                      const isActive = step.tab === activeTab;
                      const isCompleted = currentStepIndex !== -1 && idx < currentStepIndex;
                      const StepIcon = step.icon;

                      return (
                        <button
                          key={step.id}
                          onClick={() => handleStepClick(step.tab)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left font-bold text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : isCompleted
                                ? isLight
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                                : isLight
                                  ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <StepIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            )}
                            <div>
                              <div>{step.title}</div>
                              <div className={`text-[10px] font-normal ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {step.subtitle}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : isLight ? 'bg-white text-slate-600 border border-slate-200' : 'bg-slate-900 text-slate-400'
                          }`}>
                            {step.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4 Tool-Driven Suites Section */}
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-2.5">
                    Workspace Tool Suites
                  </span>

                  <div className="space-y-3">
                    {TOOL_SUITES.map((suite) => {
                      const isExpanded = mobileExpandedSuite === suite.id;
                      const SuiteIcon = suite.icon;

                      return (
                        <div 
                          key={suite.id} 
                          className={`rounded-2xl border transition-colors overflow-hidden ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                          }`}
                        >
                          <button
                            onClick={() => setMobileExpandedSuite(prev => prev === suite.id ? null : suite.id)}
                            className="w-full flex items-center justify-between p-3 text-left font-bold text-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <SuiteIcon className="w-4 h-4 text-indigo-500" />
                              <span className="text-slate-900 dark:text-slate-100 font-extrabold">{suite.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                {suite.badge}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-2 pb-2 space-y-1 border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
                              {suite.items.map((item) => {
                                const isItemActive = activeTab === item.tab;
                                const ItemIcon = item.icon;

                                return (
                                  <button
                                    key={item.name}
                                    onClick={() => handleToolItemClick(item.tab)}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-colors ${
                                      isItemActive
                                        ? 'bg-indigo-600 text-white font-bold'
                                        : isLight
                                          ? 'hover:bg-white text-slate-700'
                                          : 'hover:bg-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <ItemIcon className={`w-3.5 h-3.5 ${isItemActive ? 'text-white' : 'text-slate-400'}`} />
                                      <span className="truncate">{item.name}</span>
                                    </div>
                                    {item.badge && (
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                        isItemActive ? 'bg-white/20 text-white' : isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'
                                      }`}>
                                        {item.badge}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* STICKY BOTTOM CONVERSION DOCK IN MOBILE DRAWER */}
              <div className={`p-4 border-t shrink-0 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090d16] border-slate-800'
              }`}>
                <div className={`p-3 rounded-2xl border mb-3 ${
                  isLight ? 'bg-white border-indigo-100 shadow-xs' : 'bg-slate-900 border-indigo-900/50'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                        14-Day Pro Trial Active
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full">
                      12 Days Left
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300">
                    Unlock unlimited SKU imports, 52-week AI calendar generation & full executive JBP exports.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenPricingModal();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>Upgrade to Pro Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </header>
  );
};
