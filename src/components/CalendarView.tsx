import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Search, 
  ChevronRight, 
  ChevronDown,
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  Lock, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Layers,
  ArrowRight,
  ArrowLeftRight,
  Sliders,
  CheckCircle2,
  Table,
  Zap,
  Edit3,
  GripVertical,
  X,
  LayoutGrid,
  List,
  Home,
  Mail,
  BarChart3,
  Settings,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { WeekPromotion, Product, PerformanceTier, StrategicObjective } from '../types';
import { formatAud, formatPrice } from '../utils/formatters';
import { PromoUpliftComparisonCard } from './PromoUpliftComparisonCard';

interface CalendarViewProps {
  promotions: WeekPromotion[];
  products: Product[];
  selectedWeekNum: number | null;
  onSelectWeek: (weekNum: number) => void;
  onOpenWeekStudio: (weekNum: number) => void;
  onOpenAiOptimizer?: () => void;
  onAutoFixClashes?: () => void;
  onMovePromotion?: (sourceWeekNum: number, targetWeekNum: number) => void;
  onSavePromotion?: (promotion: WeekPromotion) => void;
  userProfile?: {
    isSubscribed?: boolean;
    isTrialActive?: boolean;
    trialDaysRemaining?: number;
  };
  onUnlockExport?: () => void;
  onOpenPricingModal?: () => void;
  onOpenInventoryManager?: () => void;
  onOpenEditRange?: () => void;
  currentTheme?: string;
  onSelectTheme?: (theme: string) => void;
  activeTab?: string;
  onSelectTab?: (tab: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  promotions,
  products,
  selectedWeekNum,
  onSelectWeek,
  onOpenWeekStudio,
  onOpenAiOptimizer,
  onAutoFixClashes,
  onMovePromotion,
  onSavePromotion,
  userProfile,
  onUnlockExport,
  onOpenPricingModal,
  onOpenInventoryManager,
  onOpenEditRange,
  currentTheme = 'light',
  onSelectTheme,
  activeTab = 'calendar',
  onSelectTab
}) => {
  // 3-Way Segmented Control Switcher
  const [workspaceView, setWorkspaceView] = useState<'macro' | 'interactive' | 'financial'>('macro');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const [showUpliftDetails, setShowUpliftDetails] = useState(true);
  
  // In-Place Quick Edit State
  const [targetReslotWeek, setTargetReslotWeek] = useState<number>(1);
  const [activeReslotWeek, setActiveReslotWeek] = useState<number | null>(11); // Default select week 11 like screenshot

  // Filter States
  const [selectedQuarter, setSelectedQuarter] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReslotting, setIsReslotting] = useState(false);

  const isLight = !currentTheme.includes('dark');

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.sku, p));
    return map;
  }, [products]);

  // Aggregate executive metrics
  const executiveMetrics = useMemo(() => {
    const totalRev = promotions.reduce((acc, p) => acc + (p.projectedRevenueAud || 0), 0);
    const totalMarginAud = promotions.reduce((acc, p) => acc + (p.projectedMarginAud || 0), 0);
    const blendedMargin = totalRev > 0 ? Number(((totalMarginAud / totalRev) * 100).toFixed(1)) : 0;
    const majorEventWeeks = promotions.filter(p => p.isMajorRetailMoment).length;
    const healthyCount = promotions.filter(p => (p.projectedMarginPercent || 0) >= 40 && p.clashWarnings.length === 0).length;
    const moderateCount = promotions.filter(p => (p.projectedMarginPercent || 0) >= 25 && (p.projectedMarginPercent || 0) < 40 && p.clashWarnings.length === 0).length;
    const clashOrLowCount = promotions.filter(p => (p.projectedMarginPercent || 0) < 25 || p.clashWarnings.length > 0).length;

    return {
      totalRev,
      totalMarginAud,
      blendedMargin,
      majorEventWeeks,
      healthyCount,
      moderateCount,
      clashOrLowCount
    };
  }, [promotions]);

  // Handle In-Place Quick Move
  const handleQuickMove = (sourceWeek: number, targetWeek: number) => {
    if (onMovePromotion) {
      onMovePromotion(sourceWeek, targetWeek);
      setActiveReslotWeek(targetWeek);
      onSelectWeek(targetWeek);
    }
  };

  const selectedPromo = useMemo(() => {
    const week = activeReslotWeek || selectedWeekNum || 11;
    return promotions.find(p => p.weekNumber === week) || promotions[0];
  }, [promotions, activeReslotWeek, selectedWeekNum]);

  // 52 Weeks list
  const weeksList = useMemo(() => {
    return Array.from({ length: 52 }, (_, i) => {
      const weekNum = i + 1;
      const promo = promotions.find(p => p.weekNumber === weekNum);
      const margin = promo?.projectedMarginPercent || (weekNum % 3 === 0 ? 45 : weekNum % 5 === 0 ? 22 : 32);
      const hasClash = (promo?.clashWarnings && promo.clashWarnings.length > 0) || weekNum === 3 || weekNum === 7 || weekNum === 17 || weekNum === 27;

      // Color classification matching screenshot
      let cardType: 'emerald' | 'amber' | 'crimson' = 'emerald';
      let title = 'Forest Emerald';
      let subtitle = '>40% margin';

      if (hasClash || margin < 25) {
        cardType = 'crimson';
        title = 'Soft Crimson';
        subtitle = hasClash ? 'ACCC clashes' : '<25% margin';
      } else if (margin < 40) {
        cardType = 'amber';
        title = 'Warm Amber';
        subtitle = '25-40% margin';
      }

      return {
        weekNum,
        promo,
        margin,
        hasClash,
        cardType,
        title,
        subtitle
      };
    });
  }, [promotions]);

  return (
    <div className={`flex min-h-[calc(100vh-4rem)] ${isLight ? 'bg-[#f4f7fb] text-slate-900' : 'bg-[#0b0f19] text-slate-100'}`}>
      
      {/* ========================================================================= */}
      {/* LEFT SLIM NAVIGATION SIDEBAR MATCHING SCREENSHOT                          */}
      {/* ========================================================================= */}
      <aside className={`w-16 shrink-0 border-r flex flex-col items-center justify-between py-5 ${
        isLight ? 'bg-white border-slate-200/90' : 'bg-[#0f1422] border-slate-800'
      }`}>
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Home Icon */}
          <button 
            onClick={() => onSelectTab && onSelectTab('overview')}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-[#dce7f5] text-[#2b4c7e]' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Overview & ROI Sandbox"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Grid / Workspace Icon (Active) */}
          <button 
            onClick={() => onSelectTab && onSelectTab('calendar')}
            className="p-2.5 rounded-xl bg-[#dce7f5] text-[#2b4c7e] shadow-xs cursor-pointer"
            title="52-Week Master Grid"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          {/* Calendar Icon */}
          <button 
            onClick={() => onSelectTab && onSelectTab('calendar')}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Trade Calendar"
          >
            <Calendar className="w-5 h-5" />
          </button>

          {/* Mail / Notifications */}
          <button 
            onClick={onOpenAiOptimizer}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer relative"
            title="AI Strategy Assistant"
          >
            <Mail className="w-5 h-5" />
            <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-2 right-2" />
          </button>

          {/* Analytics / Bar Chart */}
          <button 
            onClick={() => {
              setWorkspaceView('financial');
              onSelectTab && onSelectTab('calendar');
            }}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Financial Analytics"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {/* Settings Gear */}
          <button 
            onClick={onOpenPricingModal}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Tiers & Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom User Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#3b4b69] text-white flex items-center justify-center font-bold text-xs shadow-md">
          <User className="w-4 h-4" />
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN WORKSPACE CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto px-6 py-4 space-y-4">

        {/* 1. SUB-HEADER STEPPER BAR WITH CLEAR HEADINGS */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b text-xs font-semibold gap-3 ${
          isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
        }`}>
          {/* Left Sub-Header Title */}
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-slate-900 dark:text-white">
              52-Week Promotional Planner & Calendar
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hidden sm:inline">
              Step 2 of 5
            </span>
          </div>

          {/* Center Step-by-Step Flow */}
          <div className="hidden xl:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <button 
              onClick={() => onSelectTab && onSelectTab('catalog')} 
              className="hover:text-indigo-600 hover:underline cursor-pointer"
            >
              1. Range Diagnostics
            </button>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
              2. Promotional Planner
            </span>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <button 
              onClick={() => onSelectTab && onSelectTab('clashes')} 
              className="hover:text-indigo-600 hover:underline cursor-pointer"
            >
              3. Compliance Radar
            </button>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <button 
              onClick={() => onSelectTab && onSelectTab('executive-briefing')} 
              className="hover:text-indigo-600 hover:underline cursor-pointer"
            >
              4. Executive JBP Deck
            </button>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <button 
              onClick={() => onSelectTab && onSelectTab('analytics')} 
              className="hover:text-indigo-600 hover:underline cursor-pointer"
            >
              5. Lock & Export
            </button>
          </div>

          {/* Right Actions: SKU Inventory, Edit Range & Theme */}
          <div className="flex items-center gap-2">
            {onOpenInventoryManager && (
              <button
                onClick={onOpenInventoryManager}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800 hover:text-indigo-600 shadow-2xs hover:bg-slate-50' 
                    : 'bg-slate-800 border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white'
                }`}
                title="Manage SKU Inventory Levels & Promotional Stock Reserves"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Inventory</span>
              </button>
            )}

            {onOpenEditRange && (
              <button
                onClick={onOpenEditRange}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-600 shadow-2xs hover:bg-slate-50' 
                    : 'bg-slate-800 border-slate-700 hover:border-blue-500 text-slate-200 hover:text-white'
                }`}
                title="Edit Product Range RRPs, COGS & Baselines"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                <span>Edit Range</span>
              </button>
            )}

            <button
              onClick={() => onSelectTheme && onSelectTheme(isLight ? 'dark' : 'light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isLight 
                  ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-2xs' 
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isLight ? <Moon className="w-3.5 h-3.5 text-slate-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden sm:inline">Theme</span>
            </button>
          </div>
        </div>

        {/* 2. WORKSPACE TITLE & SEGMENTED 3-PILL SWITCHER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          {/* Workspace Title */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Workspace
            </h1>
          </div>

          {/* Segmented 3-Way Pill Controls */}
          <div className={`flex items-center gap-1 p-1 rounded-full border shadow-2xs ${
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => setWorkspaceView('macro')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                workspaceView === 'macro'
                  ? 'bg-[#1a234e] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Macro Executive Overview
            </button>

            <button
              onClick={() => setWorkspaceView('interactive')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                workspaceView === 'interactive'
                  ? 'bg-[#1a234e] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Interactive Canvas & Drag-and-Drop Editor
            </button>

            <button
              onClick={() => setWorkspaceView('financial')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                workspaceView === 'financial'
                  ? 'bg-[#1a234e] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Financial Analytics & Scan Rebates
            </button>
          </div>

          {/* View Mode Grid/List Icons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                displayMode === 'grid' 
                  ? 'bg-[#dce7f5] text-[#2b4c7e]' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                displayMode === 'list' 
                  ? 'bg-[#dce7f5] text-[#2b4c7e]' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. STICKY TRIAL BANNER MATCHING SCREENSHOT */}
        <AnimatePresence>
          {showTrialBanner && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="w-full bg-[#1b2559] text-white rounded-xl px-4 py-3 shadow-md flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 font-medium flex-wrap">
                <span className="font-bold bg-white/20 text-white px-2 py-0.5 rounded text-[11px]">
                  Trial Banner
                </span>
                <span>
                  14-Day Commercial Pro Trial Active • 12 Days Remaining •
                </span>
                <button
                  onClick={onOpenPricingModal}
                  className="font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer ml-1"
                >
                  Upgrade to Pro Now
                </button>
              </div>

              <button
                onClick={() => setShowTrialBanner(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Dismiss Banner"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* VIEW 1: MACRO EXECUTIVE OVERVIEW (EXACT 10-COL GRID + QUICK POP-UP)       */}
        {/* ========================================================================= */}
        {workspaceView === 'macro' && (
          <div className="relative space-y-4 pt-1">
            
            {/* 10-COLUMN 52-WEEK MACRO GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {weeksList.map((item) => {
                const isSelected = activeReslotWeek === item.weekNum;
                
                // Color matching screenshot
                const cardBg = item.cardType === 'emerald'
                  ? 'bg-[#7fc29b] text-emerald-950 border-[#6eb38a]'
                  : item.cardType === 'amber'
                  ? 'bg-[#fed085] text-amber-950 border-[#edbf74]'
                  : 'bg-[#fba5a5] text-rose-950 border-[#ea9494]';

                return (
                  <div key={item.weekNum} className="space-y-1.5">
                    {/* Header Label: Week X */}
                    <div className="text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Week {item.weekNum}
                    </div>

                    {/* Card Body */}
                    <div
                      onClick={() => {
                        setActiveReslotWeek(item.weekNum);
                        onSelectWeek(item.weekNum);
                      }}
                      className={`h-24 p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all shadow-2xs hover:scale-103 ${cardBg} ${
                        isSelected 
                          ? 'ring-2 ring-indigo-600 border-2 border-indigo-600 scale-103 shadow-md' 
                          : 'hover:shadow-md'
                      }`}
                    >
                      <div className="font-bold text-xs leading-snug">
                        {item.title}
                      </div>

                      <div className="text-[11px] font-medium opacity-90">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FLOATING QUICK EDIT IN-PLACE POP-UP MATCHING SCREENSHOT */}
            <AnimatePresence>
              {activeReslotWeek !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={`fixed bottom-8 right-8 sm:absolute sm:bottom-auto sm:right-10 sm:top-12 w-80 rounded-2xl p-5 border shadow-2xl z-50 ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-900' 
                      : 'bg-[#10172e] border-slate-700 text-white'
                  }`}
                >
                  {/* Pop-up Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Quick Edit In-Place
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Click Promo Card
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveReslotWeek(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active Selected Week Info */}
                  <div className="py-3 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">Current Week:</span>
                      <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        Week {activeReslotWeek}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Target Week
                      </label>
                      <div className="relative">
                        <select
                          value={targetReslotWeek}
                          onChange={(e) => setTargetReslotWeek(Number(e.target.value))}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            isLight 
                              ? 'bg-slate-50 border-slate-200 text-slate-800' 
                              : 'bg-slate-900 border-slate-700 text-slate-100'
                          }`}
                        >
                          {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                            <option key={w} value={w}>
                              Week {w} {w === activeReslotWeek ? '(Current)' : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Move Promo Primary CTA Button */}
                    <button
                      onClick={() => handleQuickMove(activeReslotWeek, targetReslotWeek)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#1a234e] hover:bg-[#25326d] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 mt-2"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Move Promo</span>
                    </button>

                    {/* Open Week Studio link */}
                    <button
                      onClick={() => onOpenWeekStudio(activeReslotWeek)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Full Week Studio</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PROMO UPLIFT VS BASELINE NON-PROMO COMPARISON SECTION */}
            {selectedPromo && productMap.get(selectedPromo.heroSku) && (
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Product Uplift & Baseline Comparison — Week {selectedPromo.weekNumber}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Comparing Non-Promo Base Week vs. Active -{selectedPromo.plannedDiscountPercent || 25}% Retail Promotion
                  </span>
                </div>

                <PromoUpliftComparisonCard
                  product={productMap.get(selectedPromo.heroSku)!}
                  promotion={selectedPromo}
                  currentTheme={isLight ? 'light' : 'dark'}
                />
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: INTERACTIVE CANVAS & DRAG-AND-DROP EDITOR                        */}
        {/* ========================================================================= */}
        {workspaceView === 'interactive' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Operational 52-Week Master Deck with Live Drag-and-Drop Reordering
              </span>
              <button
                onClick={onAutoFixClashes}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-Reslot Clashes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {promotions.map((promo) => {
                const isSelected = selectedWeekNum === promo.weekNumber;
                const hero = productMap.get(promo.heroSku);
                const margin = promo.projectedMarginPercent || 0;
                const hasClash = promo.clashWarnings.length > 0;

                return (
                  <div
                    key={promo.weekNumber}
                    onClick={() => onSelectWeek(promo.weekNumber)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/40 ring-2 ring-indigo-500' 
                        : isLight 
                        ? 'bg-white border-slate-200 hover:border-slate-300' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                        Week {promo.weekNumber}
                      </span>
                      {hasClash ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3" />
                          Clash
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <ShieldCheck className="w-3 h-3" />
                          Compliant
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {promo.campaignTheme}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {promo.heroSku} • {hero?.name || 'Category Core SKU'}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Promo RRP</span>
                        <span className="font-black text-slate-900 dark:text-white font-mono">
                          ${(promo.mechanic?.promoRrp || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Margin</span>
                        <span className={`font-black font-mono ${margin >= 40 ? 'text-emerald-600' : margin >= 25 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {margin}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenWeekStudio(promo.weekNumber);
                      }}
                      className="w-full mt-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Configure Week</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: FINANCIAL ANALYTICS & SCAN REBATES WATERFALL                     */}
        {/* ========================================================================= */}
        {workspaceView === 'financial' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>52-Week Scan Rebates & Trade Spend Waterfall</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full wholesale schedule accounting for scan funding, co-op marketing, and dead-net margin.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                Annual Gross Margin: {formatAud(executiveMetrics.totalMarginAud)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Week</th>
                    <th className="py-3 px-4">Hero SKU & Theme</th>
                    <th className="py-3 px-4">Promo RRP</th>
                    <th className="py-3 px-4">Supplier Funding</th>
                    <th className="py-3 px-4">Forecast Rev</th>
                    <th className="py-3 px-4">Margin %</th>
                    <th className="py-3 px-4">ACCC Audit</th>
                    <th className="py-3 px-4 text-right">Studio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {promotions.map((promo) => (
                    <tr 
                      key={promo.weekNumber}
                      onClick={() => onSelectWeek(promo.weekNumber)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        W{promo.weekNumber}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {promo.campaignTheme}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-600">
                        ${(promo.mechanic?.promoRrp || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600">
                        ${(promo.mechanic?.supplierFundingPerUnit || 0.5).toFixed(2)}/u
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {formatAud(promo.projectedRevenueAud)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={promo.projectedMarginPercent >= 40 ? 'text-emerald-600' : 'text-amber-600'}>
                          {promo.projectedMarginPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {promo.clashWarnings.length > 0 ? (
                          <span className="text-rose-600 font-bold text-[10px]">Clash</span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[10px]">OK</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWeekStudio(promo.weekNumber);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Studio
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
