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
  Sun,
  Moon
} from 'lucide-react';
import { WeekPromotion, Product, UserProfile, AppTab, CheckoutPlanType } from '../types';
import { formatAud } from '../utils/formatters';
import { calculateQuarterlySummaries } from '../utils/promoPlannerEngine';
import { PromoUpliftComparisonCard } from './PromoUpliftComparisonCard';
import { WorkspacePageHero } from './WorkspacePageHero';
import promoPlannerHeroImg from '../assets/images/promo_planner_hero_1795341506267.jpg';

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
  userProfile?: UserProfile | null;
  onUnlockExport?: (exportId: string, itemName: string, priceAud?: number, planType?: CheckoutPlanType) => void;
  onOpenPricingModal?: () => void;
  onOpenInventoryManager?: () => void;
  onOpenEditRange?: () => void;
  currentTheme?: string;
  onSelectTheme?: (theme: string) => void;
  activeTab?: string;
  onSelectTab?: (tab: AppTab) => void;
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
  // 4-Way Segmented Control Switcher — Default to easy-to-read Summary view
  const [workspaceView, setWorkspaceView] = useState<'summary' | 'macro' | 'interactive' | 'financial'>('summary');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'major' | 'clashes'>('all');

  // In-Place Quick Edit State (open on tap on mobile so the grid isn't covered on first load)
  const [targetReslotWeek, setTargetReslotWeek] = useState<number>(1);
  const [activeReslotWeek, setActiveReslotWeek] = useState<number | null>(null);

  // Filter States
  const [selectedQuarter, setSelectedQuarter] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isLight = !currentTheme.includes('dark');

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.sku, p));
    return map;
  }, [products]);

  const quarterlySummaries = useMemo(() => {
    return calculateQuarterlySummaries(promotions);
  }, [promotions]);

  // Aggregate executive metrics (exclude baseline gap weeks from promo clash/margin counts)
  const executiveMetrics = useMemo(() => {
    const activeWeeks = promotions.filter(p => !p.isPromoSkipped && Boolean(p.heroSku));
    const totalRev = activeWeeks.reduce((acc, p) => acc + (p.projectedRevenueAud || 0), 0);
    const totalMarginAud = activeWeeks.reduce((acc, p) => acc + (p.projectedMarginAud || 0), 0);
    const blendedMargin = totalRev > 0 ? Number(((totalMarginAud / totalRev) * 100).toFixed(1)) : 0;
    const majorEventWeeks = activeWeeks.filter(p => p.isMajorRetailMoment).length;
    const healthyCount = activeWeeks.filter(p => (p.projectedMarginPercent || 0) >= 40 && p.clashWarnings.length === 0).length;
    const moderateCount = activeWeeks.filter(p => (p.projectedMarginPercent || 0) >= 25 && (p.projectedMarginPercent || 0) < 40 && p.clashWarnings.length === 0).length;
    const clashOrLowCount = activeWeeks.filter(p => (p.projectedMarginPercent || 0) < 25 || p.clashWarnings.length > 0).length;

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
    const week = activeReslotWeek || selectedWeekNum || 1;
    return promotions.find(p => p.weekNumber === week) || promotions[0];
  }, [promotions, activeReslotWeek, selectedWeekNum]);

  // 52 Weeks normalized view list (with multi-SKU metadata & baseline gap week styling)
  const weeksList = useMemo(() => {
    return Array.from({ length: 52 }, (_, i) => {
      const weekNum = i + 1;
      const promo = promotions.find(p => p.weekNumber === weekNum);
      const isGapWeek = Boolean(promo?.isPromoSkipped);
      const heroProduct = !isGapWeek && promo ? productMap.get(promo.heroSku) : undefined;
      const extraSkus = isGapWeek ? [] : (promo?.secondarySkus || []).filter(s => s && s !== promo?.heroSku);
      const totalSkusCount = isGapWeek ? 0 : (promo?.heroSku ? 1 : 0) + extraSkus.length;
      const extraSkuNames = extraSkus
        .map(s => productMap.get(s)?.name || s)
        .filter(Boolean);

      const margin = promo?.projectedMarginPercent || 0;
      const hasClash = !isGapWeek && Boolean(promo?.clashWarnings && promo.clashWarnings.length > 0);

      let cardType: 'emerald' | 'amber' | 'crimson' | 'slate' = 'emerald';
      if (isGapWeek) {
        cardType = 'slate';
      } else if (hasClash || margin < 25) {
        cardType = 'crimson';
      } else if (margin < 40) {
        cardType = 'amber';
      }

      const title = isGapWeek
        ? 'Baseline Recovery Week (Gap)'
        : promo?.campaignTheme || promo?.australianEvent || (heroProduct ? heroProduct.name : (promo?.heroSku ? `SKU: ${promo.heroSku}` : `Week ${weekNum} Open`));
      const skuBadgeText = totalSkusCount > 1 ? `${totalSkusCount} SKUs` : (heroProduct?.sku || promo?.heroSku || '1 SKU');
      const subtitle = isGapWeek
        ? 'No Promo · RRP Full Margin'
        : heroProduct
        ? `${skuBadgeText} · ${margin}% GM`
        : (promo?.mechanic?.label ? `${promo.mechanic.label} · ${margin}%` : `Margin: ${margin}%`);

      return {
        weekNum,
        promo,
        isGapWeek,
        heroProduct,
        extraSkuNames,
        totalSkusCount,
        margin,
        hasClash,
        cardType,
        title,
        subtitle
      };
    });
  }, [promotions, productMap]);

  const filteredSummaryWeeks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return weeksList.filter(item => {
      if (selectedQuarter === 'Q1' && item.weekNum > 13) return false;
      if (selectedQuarter === 'Q2' && (item.weekNum < 14 || item.weekNum > 26)) return false;
      if (selectedQuarter === 'Q3' && (item.weekNum < 27 || item.weekNum > 39)) return false;
      if (selectedQuarter === 'Q4' && item.weekNum < 40) return false;

      if (statusFilter === 'major' && !item.promo?.isMajorRetailMoment) return false;
      if (statusFilter === 'clashes' && !item.hasClash) return false;

      if (!q) return true;
      const heroName = item.heroProduct?.name?.toLowerCase() || '';
      const heroCode = item.promo?.heroSku?.toLowerCase() || '';
      const eventName = item.promo?.australianEvent?.toLowerCase() || '';
      const theme = item.title.toLowerCase();
      const extraText = item.extraSkuNames.join(' ').toLowerCase();
      return (
        `w${item.weekNum}`.includes(q) ||
        `week ${item.weekNum}`.includes(q) ||
        heroName.includes(q) ||
        heroCode.includes(q) ||
        eventName.includes(q) ||
        theme.includes(q) ||
        extraText.includes(q)
      );
    });
  }, [weeksList, selectedQuarter, statusFilter, searchQuery]);

  const hasAutoFormulated = useMemo(
    () => promotions.some((p) => p.isAiGenerated),
    [promotions]
  );

  return (
    <div className="flex flex-col min-w-0">
      {/* ========================================================================= */}
      {/* MAIN WORKSPACE CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 space-y-5 sm:space-y-6">

        {/* 1. CENTERED TOOL HERO & VIEW SWITCHER TRAY (Trial banner removed) */}
        <WorkspacePageHero
          stepLabel="Step 2 of 5 · Promotional Engine"
          title="52-Week Promo Planner"
          subtitle="Map weekly catalogue slots, scan rebate funding, and retail gross margin guardrails across the full commercial calendar."
          accent="indigo"
          currentTheme={currentTheme}
          activeStep={2}
          onSelectTab={onSelectTab}
          heroImageSrc={promoPlannerHeroImg}
          heroImageAlt="52-Week Promotional Calendar Grid Visual"
          FallbackIcon={Calendar}
          actions={
            <>
              {onOpenInventoryManager && (
                <button
                  type="button"
                  onClick={onOpenInventoryManager}
                  className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800 hover:text-indigo-600 shadow-2xs hover:bg-slate-50'
                      : 'bg-slate-800 border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white'
                  }`}
                  title="Manage SKU Inventory Levels & Promotional Stock Reserves"
                >
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Inventory</span>
                </button>
              )}

              {onOpenEditRange && (
                <button
                  type="button"
                  onClick={onOpenEditRange}
                  className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-600 shadow-2xs hover:bg-slate-50'
                      : 'bg-slate-800 border-slate-700 hover:border-blue-500 text-slate-200 hover:text-white'
                  }`}
                  title="Edit Product Range RRPs, COGS & Baselines"
                >
                  <Sliders className="w-4 h-4 text-blue-500" />
                  <span>Edit Range</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onSelectTheme && onSelectTheme(isLight ? 'dark' : 'light')}
                className={`hidden md:inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isLight
                    ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-2xs'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isLight ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <span>Theme</span>
              </button>
            </>
          }
        >
          {/* 2. SEGMENTED 4-WAY VIEW SWITCHER + QUARTER FILTER */}
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2.5">
            <div className={`flex items-center gap-1 p-1 rounded-2xl border shadow-2xs overflow-x-auto no-scrollbar max-w-full ${
              isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-slate-900 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setWorkspaceView('summary')}
                className={`min-h-[38px] px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  workspaceView === 'summary'
                    ? 'bg-[#1a234e] dark:bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Summary
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceView('macro')}
                className={`min-h-[38px] px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  workspaceView === 'macro'
                    ? 'bg-[#1a234e] dark:bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Macro Grid
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceView('interactive')}
                className={`min-h-[38px] px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  workspaceView === 'interactive'
                    ? 'bg-[#1a234e] dark:bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="sm:hidden">Canvas</span>
                <span className="hidden sm:inline">Interactive Canvas</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceView('financial')}
                className={`min-h-[38px] px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  workspaceView === 'financial'
                    ? 'bg-[#1a234e] dark:bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="sm:hidden">Financials</span>
                <span className="hidden sm:inline">Financials &amp; Rebates</span>
              </button>
            </div>

            {/* Quarter Filter & Macro Grid/List Switcher */}
            <div className="flex items-center gap-1.5 shrink-0">
              {(workspaceView === 'summary' || workspaceView === 'macro') && (
                <select
                  aria-label="Filter by quarter"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value as any)}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                    isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <option value="ALL">All 52 Wks</option>
                  <option value="Q1">Q1 (W1–13)</option>
                  <option value="Q2">Q2 (W14–26)</option>
                  <option value="Q3">Q3 (W27–39)</option>
                  <option value="Q4">Q4 (W40–52)</option>
                </select>
              )}

              {workspaceView === 'macro' && (
                <>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('grid')}
                    className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                      displayMode === 'grid'
                        ? 'bg-[#dce7f5] dark:bg-indigo-950 text-[#2b4c7e] dark:text-indigo-300'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('list')}
                    className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                      displayMode === 'list'
                        ? 'bg-[#dce7f5] dark:bg-indigo-950 text-[#2b4c7e] dark:text-indigo-300'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </WorkspacePageHero>

        {/* AUTO-FORMULATE-FIRST WORKFLOW PROMPT BANNER */}
        {(products.length === 0 || !hasAutoFormulated) && (
          <div
            className={`rounded-2xl border p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
              isLight
                ? 'bg-blue-50/70 border-blue-200 text-[#0F172A]'
                : 'bg-blue-950/30 border-blue-900 text-slate-100'
            }`}
          >
            <div className="space-y-1 max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2563EB] dark:text-blue-400">
                STEP 1 · AUTO-FORMULATE OPTIMAL SCHEDULE
              </p>
              <h2 className="text-base sm:text-lg font-bold">
                {products.length === 0
                  ? 'Add your SKUs first, then auto-formulate your optimal 52-week promotional calendar'
                  : 'Auto-formulate your optimal 52-week promotional program before auditing weeks'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {products.length === 0
                  ? 'Start by adding your SKU costs, shelf prices, and target margins so RangeCraft can formulate conflict-free promotional weeks.'
                  : 'Generate a profit-maximising 52-week promotional schedule calibrated to your catalog margins and custom hiatus spacing rules.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {products.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('catalog')}
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <Layers className="w-4 h-4" />
                  <span>Add Products First</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  {onOpenAiOptimizer && (
                    <button
                      type="button"
                      onClick={onOpenAiOptimizer}
                      className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shadow-xs"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-Formulate Optimal 52-Week Calendar</span>
                    </button>
                  )}
                  {onAutoFixClashes && (
                    <button
                      type="button"
                      onClick={onAutoFixClashes}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
                        isLight
                          ? 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50'
                          : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                      <span>Run Custom Rules Audit</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 0 (DEFAULT): DARK TELEMETRY BAND + QUARTERLY & WEEKLY SCHEDULE       */}
        {/* ========================================================================= */}
        {workspaceView === 'summary' && (
          <div className="space-y-6 pt-1">
            {/* High-Contrast Dark Telemetry Band */}
            <div className="rounded-3xl bg-[#0F172A] border border-slate-800 text-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 tabular-nums">
                <div className="p-4 sm:p-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    52-Week Projected Revenue
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-1 block">
                    {formatAud(executiveMetrics.totalRev)}
                  </span>
                </div>
                <div className="p-4 sm:p-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Blended Gross Margin
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1 block">
                    {executiveMetrics.blendedMargin}%
                  </span>
                </div>
                <div className="p-4 sm:p-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Compliance &amp; Margin Watch
                  </span>
                  <span className={`text-2xl sm:text-3xl font-black font-mono mt-1 block ${executiveMetrics.clashOrLowCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {executiveMetrics.clashOrLowCount > 0 ? `${executiveMetrics.clashOrLowCount} flagged wks` : 'All 52 wks clean'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quarter Summary Cards (Q1 - Q4) */}
            <section aria-label="Quarterly Promotional Summary" className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Quarterly Rollup (Click a quarter to filter weeks)
                </h2>
                {selectedQuarter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedQuarter('ALL')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Show All 52 Weeks
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {quarterlySummaries.map(qs => {
                  const isActiveQuarter = selectedQuarter === qs.quarter;
                  const quarterWeeks = promotions.filter(p => p.quarter === qs.quarter);
                  const clashWeeksCount = quarterWeeks.filter(p => (p.clashWarnings || []).length > 0).length;

                  return (
                    <button
                      key={qs.quarter}
                      type="button"
                      onClick={() => setSelectedQuarter(isActiveQuarter ? 'ALL' : qs.quarter)}
                      className={`text-left rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isActiveQuarter
                          ? isLight
                            ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500'
                            : 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
                          : 'bg-slate-900 border-slate-800 hover:border-indigo-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                            {qs.quarter}
                          </span>
                          <span className={`text-xs font-mono tabular-nums ${clashWeeksCount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}`}>
                            {clashWeeksCount > 0 ? `${clashWeeksCount} clash` : 'Clean'}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">
                          {qs.label}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs tabular-nums">
                        <div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Revenue</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatAud(qs.totalRevenueAud)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Blended GM</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{qs.blendedMarginPercent}%</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Search & Quick Filter Bar */}
            <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search week, AU event, SKU name, or theme..."
                  className={`w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {[
                  { id: 'all', label: 'All Weeks' },
                  { id: 'major', label: 'Major Events' },
                  { id: 'clashes', label: 'Conflicts Only' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatusFilter(opt.id as any)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === opt.id
                        ? 'bg-indigo-600 text-white'
                        : isLight
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Readable Weekly Schedule List */}
            <div className={`rounded-2xl border divide-y overflow-hidden ${
              isLight ? 'bg-white border-slate-200 divide-slate-100' : 'bg-slate-900 border-slate-800 divide-slate-800'
            }`}>
              {filteredSummaryWeeks.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No promotional weeks match your current search or filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedQuarter('ALL');
                      setStatusFilter('all');
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredSummaryWeeks.map(item => {
                  const promo = item.promo;
                  const rev = promo?.projectedRevenueAud || 0;
                  const clashCount = promo?.clashWarnings?.length || 0;
                  const isMajor = Boolean(promo?.isMajorRetailMoment);

                  return (
                    <div
                      key={item.weekNum}
                      className="p-4 sm:px-5 sm:py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Left: Week Info + Campaign & Participating SKUs */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                            W{String(item.weekNum).padStart(2, '0')}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            {promo?.startDate} – {promo?.endDate} · {promo?.quarter}
                          </span>
                          {isMajor && promo?.australianEvent && (
                            <span className="font-bold text-amber-700 dark:text-amber-300">
                              · {promo.australianEvent}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                          {item.title}
                        </h3>

                        {item.isGapWeek ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Scheduled non-promo cadence gap · Baseline RRP pricing protects price perception &amp; hiatus rules.
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                {item.totalSkusCount} {item.totalSkusCount === 1 ? 'SKU' : 'SKUs'} on promo:
                              </span>
                              <span className="truncate max-w-full">
                                {item.heroProduct ? item.heroProduct.name : (promo?.heroSku || 'None')}
                                {item.extraSkuNames.length > 0 && (
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {' '}+ {item.extraSkuNames.slice(0, 2).join(', ')}
                                    {item.extraSkuNames.length > 2 ? ` (+${item.extraSkuNames.length - 2} more)` : ''}
                                  </span>
                                )}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>
                                Offer: <span className="font-semibold text-slate-700 dark:text-slate-200">{promo?.mechanic?.label || '20% Off RRP'}</span>
                                {promo?.mechanic?.promoRrp ? ` · Hero $${promo.mechanic.promoRrp.toFixed(2)}` : ''}
                              </span>
                              {promo?.mechanic?.caseDealType && promo.mechanic.caseDealType !== 'none' && (promo.mechanic.caseDealValue || 0) > 0 && (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  · Case Deal Active ({promo.mechanic.caseDealType === 'percent_off_cost' ? `-${promo.mechanic.caseDealValue}% COGS` : `-$${promo.mechanic.caseDealValue}`})
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right: Tabular Financials, Semantic Audit & Direct Edit Button */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                        {item.isGapWeek ? (
                          <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Gap Week · Baseline</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 tabular-nums">
                            <div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Revenue</span>
                              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                {formatAud(rev)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Margin</span>
                              <span className={`font-mono font-black text-sm ${
                                item.margin >= 40
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : item.margin >= 25
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {item.margin}%
                              </span>
                            </div>
                            <div className="min-w-[82px]">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Status</span>
                              {clashCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{clashCount} Clash</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                  <span>Compliant</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenWeekStudio(item.weekNum)}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit SKUs &amp; Week</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        {workspaceView === 'macro' && (
          <div className="relative space-y-4 pt-1">

            {/* Quick Summary KPI Strip for Instant Clarity */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">52-Wk Revenue</span>
                <span className="text-sm sm:text-base font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatAud(executiveMetrics.totalRev)}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Blended GM</span>
                <span className="text-sm sm:text-base font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {executiveMetrics.blendedMargin}%
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Clashes / Risks</span>
                <span className={`text-sm sm:text-base font-black font-mono tabular-nums ${executiveMetrics.clashOrLowCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {executiveMetrics.clashOrLowCount} wks
                </span>
              </div>
            </div>

            {displayMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 sm:gap-3">
                {weeksList
                  .filter(item => {
                    if (selectedQuarter === 'Q1') return item.weekNum <= 13;
                    if (selectedQuarter === 'Q2') return item.weekNum >= 14 && item.weekNum <= 26;
                    if (selectedQuarter === 'Q3') return item.weekNum >= 27 && item.weekNum <= 39;
                    if (selectedQuarter === 'Q4') return item.weekNum >= 40;
                    return true;
                  })
                  .map((item) => {
                  const isSelected = activeReslotWeek === item.weekNum;
                  
                  const cardBg = item.cardType === 'slate'
                    ? 'bg-slate-200/80 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    : item.cardType === 'emerald'
                    ? 'bg-[#7fc29b] text-emerald-950 border-[#6eb38a]'
                    : item.cardType === 'amber'
                    ? 'bg-[#fed085] text-amber-950 border-[#edbf74]'
                    : 'bg-[#fba5a5] text-rose-950 border-[#ea9494]';

                  return (
                    <div key={item.weekNum} className="space-y-1">
                      <div className="text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Week {item.weekNum}
                      </div>

                      <div
                        onClick={() => {
                          setActiveReslotWeek(item.weekNum);
                          onSelectWeek(item.weekNum);
                        }}
                        className={`h-24 p-2.5 sm:p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all shadow-2xs ${cardBg} ${
                          isSelected 
                            ? 'ring-2 ring-indigo-600 border-2 border-indigo-600 shadow-md' 
                            : 'hover:shadow-md'
                        }`}
                      >
                        <div className="font-bold text-xs leading-snug line-clamp-2" title={item.title}>
                          {item.title}
                        </div>

                        <div className="text-[11px] font-semibold opacity-90 truncate" title={item.subtitle}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`rounded-2xl border divide-y overflow-hidden ${isLight ? 'bg-white border-slate-200 divide-slate-100' : 'bg-slate-900 border-slate-800 divide-slate-800'}`}>
                {weeksList
                  .filter(item => {
                    if (selectedQuarter === 'Q1') return item.weekNum <= 13;
                    if (selectedQuarter === 'Q2') return item.weekNum >= 14 && item.weekNum <= 26;
                    if (selectedQuarter === 'Q3') return item.weekNum >= 27 && item.weekNum <= 39;
                    if (selectedQuarter === 'Q4') return item.weekNum >= 40;
                    return true;
                  })
                  .map((item) => {
                  const statusDot =
                    item.cardType === 'slate'
                      ? 'bg-slate-400'
                      : item.cardType === 'emerald'
                      ? 'bg-emerald-500'
                      : item.cardType === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-rose-500';
                  return (
                    <button
                      key={item.weekNum}
                      type="button"
                      onClick={() => {
                        setActiveReslotWeek(item.weekNum);
                        onSelectWeek(item.weekNum);
                      }}
                      className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot}`} />
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                          W{item.weekNum}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* FLOATING QUICK EDIT IN-PLACE SHEET (Positioned cleanly above bottom nav on mobile) */}
            <AnimatePresence>
              {activeReslotWeek !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  className={`fixed inset-x-3 bottom-20 w-auto sm:w-80 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-12 rounded-2xl p-4 sm:p-5 border shadow-2xl z-50 max-h-[calc(100dvh-10rem)] overflow-y-auto ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-900' 
                      : 'bg-[#10172e] border-slate-700 text-white'
                  }`}
                >
                  {/* Pop-up Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Quick Edit Week {activeReslotWeek}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Re-slot promo or open full week studio
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveReslotWeek(null)}
                      aria-label="Close quick editor"
                      className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
                        Move to Target Week
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

                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 pt-1">
                      <button
                        onClick={() => handleQuickMove(activeReslotWeek, targetReslotWeek)}
                        className="min-h-[44px] w-full py-2.5 px-3 rounded-xl bg-[#1a234e] dark:bg-indigo-600 hover:bg-[#25326d] text-white font-bold text-xs tracking-wide shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>Move Promo</span>
                      </button>

                      <button
                        onClick={() => onOpenWeekStudio(activeReslotWeek)}
                        className="min-h-[44px] w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Week Studio</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PROMO UPLIFT VS BASELINE NON-PROMO COMPARISON SECTION */}
            {selectedPromo && productMap.get(selectedPromo.heroSku) && (
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Product Uplift &amp; Baseline — Week {selectedPromo.weekNumber}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Non-Promo Base vs. -{selectedPromo.mechanic?.discountValue ?? 25}% Retail Promo
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Operational 52-Week Master Deck · Tap any week to edit
              </span>
              <button
                onClick={onAutoFixClashes}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Auto-Reslot Clashes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {promotions.map((promo) => {
                const isSelected = selectedWeekNum === promo.weekNumber;
                const isGapWeek = Boolean(promo.isPromoSkipped);
                const hero = !isGapWeek ? productMap.get(promo.heroSku) : undefined;
                const margin = promo.projectedMarginPercent || 0;
                const hasClash = !isGapWeek && promo.clashWarnings.length > 0;

                return (
                  <div
                    key={promo.weekNumber}
                    onClick={() => onSelectWeek(promo.weekNumber)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/40 ring-2 ring-indigo-500' 
                        : isGapWeek
                        ? isLight
                          ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        : isLight 
                        ? 'bg-white border-slate-200 hover:border-slate-300' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                        Week {promo.weekNumber}
                      </span>
                      {isGapWeek ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          Gap Week
                        </span>
                      ) : hasClash ? (
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
                      {isGapWeek ? 'Baseline Recovery Week' : promo.campaignTheme}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                      {isGapWeek
                        ? 'Regular RRP · Full Margin Window'
                        : `${1 + (promo.secondarySkus?.length || 0)} ${(1 + (promo.secondarySkus?.length || 0)) === 1 ? 'SKU' : 'SKUs'} · ${promo.heroSku} ${hero?.name ? `(${hero.name})` : ''}`}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Promo RRP</span>
                        <span className="font-black text-slate-900 dark:text-white font-mono">
                          {isGapWeek ? 'Baseline' : `$${(promo.mechanic?.promoRrp || 0).toFixed(2)}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Margin</span>
                        <span className={`font-black font-mono ${isGapWeek ? 'text-slate-500' : margin >= 40 ? 'text-emerald-600' : margin >= 25 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {isGapWeek ? 'Full RRP' : `${margin}%`}
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
                    <th className="py-3 px-4">SKUs &amp; Theme</th>
                    <th className="py-3 px-4">Promo RRP</th>
                    <th className="py-3 px-4">Supplier Funding</th>
                    <th className="py-3 px-4">Forecast Rev</th>
                    <th className="py-3 px-4">Margin %</th>
                    <th className="py-3 px-4">Custom Rules</th>
                    <th className="py-3 px-4 text-right">Studio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {promotions.map((promo) => {
                    const isGapWeek = Boolean(promo.isPromoSkipped);
                    const totalSkus = isGapWeek ? 0 : 1 + (promo.secondarySkus?.length || 0);
                    return (
                    <tr 
                      key={promo.weekNumber}
                      onClick={() => onSelectWeek(promo.weekNumber)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        W{promo.weekNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {isGapWeek ? 'Baseline Recovery Week (Gap)' : promo.campaignTheme}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {isGapWeek
                            ? 'Regular RRP · No active promo'
                            : `${totalSkus} ${totalSkus === 1 ? 'SKU' : 'SKUs'} · Hero ${promo.heroSku}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-600">
                        {isGapWeek ? 'RRP' : `$${(promo.mechanic?.promoRrp || 0).toFixed(2)}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600">
                        {isGapWeek ? '—' : `$${(promo.mechanic?.supplierFundingPerUnit || 0).toFixed(2)}/u`}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {isGapWeek ? 'Baseline' : formatAud(promo.projectedRevenueAud)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={isGapWeek ? 'text-slate-500' : promo.projectedMarginPercent >= 40 ? 'text-emerald-600' : 'text-amber-600'}>
                          {isGapWeek ? 'Full RRP' : `${promo.projectedMarginPercent}%`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isGapWeek ? (
                          <span className="text-slate-500 font-bold text-[10px]">Gap</span>
                        ) : promo.clashWarnings.length > 0 ? (
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
