import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  CalendarDays,
  AlertTriangle,
  Plus,
  Upload,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { AppTab, Product, StrategyKPIs, ThemeMode, UserProfile, WeekPromotion } from '../types';
import { formatAud, formatNumber } from '../utils/formatters';
import { buildSkuPromoDemandMap, computeSkuInventoryForecast } from '../utils/inventoryForecast';

interface ExecutiveDashboardViewProps {
  user: UserProfile | null;
  products: Product[];
  promotions: WeekPromotion[];
  kpis: StrategyKPIs;
  currentTheme: ThemeMode;
  onSelectTab: (tab: AppTab) => void;
  onOpenWeekStudio: (weekNum: number) => void;
  onOpenUploadModal: () => void;
  onOpenAddProductModal: () => void;
  onAutoFormulatePlan: () => void;
}

const GENERIC_CHANNELS = [
  'National Supermarkets',
  'Metro Grocery',
  'Independent Grocers',
  'Warehouse Clubs',
  'Online Marketplaces',
];

const MONTHS_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  user,
  products,
  promotions,
  kpis,
  currentTheme,
  onSelectTab,
  onOpenWeekStudio,
  onOpenUploadModal,
  onOpenAddProductModal,
  onAutoFormulatePlan,
}) => {
  const isLight = currentTheme.includes('light');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'H1' | 'H2'>('all');

  const hasData = products.length > 0;
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.sku, p));
    return map;
  }, [products]);

  const skuPromoDemandMap = useMemo(
    () => buildSkuPromoDemandMap(products, promotions),
    [products, promotions]
  );

  const filteredPromos = useMemo(() => {
    if (timeframeFilter === 'H1') return promotions.filter((p) => p.weekNumber <= 26);
    if (timeframeFilter === 'H2') return promotions.filter((p) => p.weekNumber > 26);
    return promotions;
  }, [promotions, timeframeFilter]);

  const activePromos = useMemo(
    () => filteredPromos.filter((p) => Boolean(p.heroSku) && productMap.has(p.heroSku)),
    [filteredPromos, productMap]
  );

  // Compute monthly trend series from actual promotions
  const monthlySeries = useMemo(() => {
    const bucket = new Map<string, { month: string; revenue: number; profit: number }>();
    MONTHS_ORDER.forEach((m) => bucket.set(m, { month: m, revenue: 0, profit: 0 }));

    activePromos.forEach((p) => {
      const m = MONTHS_ORDER.includes(p.month) ? p.month : MONTHS_ORDER[Math.min(11, Math.floor((p.weekNumber - 1) / 4.34))];
      const entry = bucket.get(m)!;
      entry.revenue += p.projectedRevenueAud || 0;
      entry.profit += p.projectedMarginAud || 0;
    });

    return MONTHS_ORDER.filter((m) => {
      if (timeframeFilter === 'H1') return MONTHS_ORDER.indexOf(m) < 6;
      if (timeframeFilter === 'H2') return MONTHS_ORDER.indexOf(m) >= 6;
      return true;
    }).map((m) => {
      const entry = bucket.get(m)!;
      return {
        month: entry.month,
        revenue: Math.round(entry.revenue),
        profit: Math.round(entry.profit),
      };
    });
  }, [activePromos, timeframeFilter]);

  // Promotion status breakdown
  const statusCounts = useMemo(() => {
    let onTrack = 0;
    let atRisk = 0;
    let conflict = 0;
    let completed = 0;

    activePromos.forEach((p, idx) => {
      const hasClash = (p.clashWarnings || []).length > 0;
      const isLowMargin = (p.projectedMarginPercent || 0) < 28;
      if (hasClash) conflict++;
      else if (isLowMargin) atRisk++;
      else if (idx < 2 && p.weekNumber <= 4) completed++;
      else onTrack++;
    });

    return { onTrack, atRisk, conflict, completed, total: activePromos.length };
  }, [activePromos]);

  const donutData = useMemo(
    () =>
      [
        { name: 'On Track', value: statusCounts.onTrack, color: '#10B981' },
        { name: 'At Risk', value: statusCounts.atRisk, color: '#F59E0B' },
        { name: 'Conflict', value: statusCounts.conflict, color: '#EF4444' },
        { name: 'Completed', value: statusCounts.completed, color: '#64748B' },
      ].filter((d) => d.value > 0),
    [statusCounts]
  );

  const skusAtRisk = useMemo(() => {
    const riskSet = new Set<string>();
    products.forEach((p) => {
      if (p.marginPercent < (p.minMarginPercent || 28)) riskSet.add(p.sku);
      const inv = computeSkuInventoryForecast(p, skuPromoDemandMap.get(p.sku));
      if (inv.hasInventory && inv.stockStatus === 'CRITICAL') {
        riskSet.add(p.sku);
      }
    });
    activePromos.forEach((promo) => {
      if ((promo.projectedMarginPercent || 0) < 28) {
        if (promo.heroSku) riskSet.add(promo.heroSku);
      }
      (promo.clashWarnings || []).forEach((w) => {
        (w.affectedSkus || []).forEach((s) => riskSet.add(s));
      });
    });
    return riskSet.size;
  }, [products, activePromos, skuPromoDemandMap]);

  // Upcoming promotions table rows
  const upcomingRows = useMemo(() => {
    return activePromos.slice(0, 6).map((p, idx) => {
      const hero = productMap.get(p.heroSku);
      const hasClash = (p.clashWarnings || []).length > 0;
      const isRisk = (p.projectedMarginPercent || 0) < 28;
      const discountPct =
        hero && hero.rrp > 0 && p.mechanic?.promoRrp
          ? Math.max(0, Math.round(((hero.rrp - p.mechanic.promoRrp) / hero.rrp) * 100))
          : p.mechanic?.discountValue || 20;

      const status: 'On Track' | 'Review' | 'At Risk' = hasClash
        ? 'At Risk'
        : isRisk
        ? 'Review'
        : 'On Track';

      return {
        weekNumber: p.weekNumber,
        productName: hero?.name || p.heroSku,
        channel: GENERIC_CHANNELS[idx % GENERIC_CHANNELS.length],
        period: `${p.startDate} – ${p.endDate}`,
        discount: `${discountPct}%`,
        margin: `${Number(p.projectedMarginPercent || 0).toFixed(1)}%`,
        status,
      };
    });
  }, [activePromos, productMap]);

  // Commercial Insights (Quantified outcomes, never AI-first)
  const insights = useMemo(() => {
    const list: Array<{
      id: string;
      kind: 'Margin Risk Alert' | 'Stockout Risk Alert' | 'Profit Recovery Opportunity' | 'Promotion Clash' | 'Revenue Impact Analysis';
      tone: 'red' | 'amber' | 'blue' | 'green';
      headline: string;
      detail: string;
      impactLabel: string;
      actionLabel: string;
      onAction: () => void;
    }> = [];

    const lowMarginPromo = activePromos.find((p) => (p.projectedMarginPercent || 0) < 28);
    if (lowMarginPromo) {
      const hero = productMap.get(lowMarginPromo.heroSku);
      const gapPct = Math.max(2, Math.round(28 - (lowMarginPromo.projectedMarginPercent || 20)));
      const estRecovery = Math.round(((lowMarginPromo.projectedRevenueAud || 18000) * gapPct) / 100);
      list.push({
        id: `risk-w${lowMarginPromo.weekNumber}`,
        kind: 'Margin Risk Alert',
        tone: 'red',
        headline: `${hero?.name || lowMarginPromo.heroSku} projected below target margin`,
        detail: `Week ${lowMarginPromo.weekNumber} runs at ${lowMarginPromo.projectedMarginPercent}% gross margin. Reduce discount depth by 5% or add scan co-op.`,
        impactLabel: `Potential recovery: +${formatAud(estRecovery)}`,
        actionLabel: 'Fix in Promotion Builder',
        onAction: () => onSelectTab('promotion-builder'),
      });
    }

    const stockoutSku = products.find((p) => {
      const inv = computeSkuInventoryForecast(p, skuPromoDemandMap.get(p.sku));
      return inv.hasInventory && inv.stockStatus === 'CRITICAL';
    });
    if (stockoutSku) {
      const inv = computeSkuInventoryForecast(stockoutSku, skuPromoDemandMap.get(stockoutSku.sku));
      list.push({
        id: `stockout-${stockoutSku.sku}`,
        kind: 'Stockout Risk Alert',
        tone: 'red',
        headline: `${stockoutSku.name} inventory threatens promotional supply`,
        detail:
          inv.currentStock === 0
            ? `${stockoutSku.sku} is entered at 0 units on hand with ${formatNumber(inv.allocatedForPromo)} promo units forecasted.`
            : `${formatNumber(inv.currentStock || 0)} units on hand covers ${inv.weeksOfCover} weeks vs. ${formatNumber(inv.allocatedForPromo)} forecasted promo units.`,
        impactLabel:
          inv.annualShortfallUnits > 0
            ? `Short ${formatNumber(inv.annualShortfallUnits)} units`
            : `${inv.weeksOfCover} wks cover`,
        actionLabel: 'Adjust SKU Inventory',
        onAction: () => onSelectTab('catalog'),
      });
    }

    const clashPromo = activePromos.find((p) => (p.clashWarnings || []).length > 0);
    if (clashPromo) {
      list.push({
        id: `clash-w${clashPromo.weekNumber}`,
        kind: 'Promotion Clash',
        tone: 'amber',
        headline: `Rule spacing conflict detected in Week ${clashPromo.weekNumber}`,
        detail: clashPromo.clashWarnings[0]?.message || 'Adjacent promotional hiatus rule requires reslotting.',
        impactLabel: `${kpis.totalClashesCount} active conflict${kpis.totalClashesCount === 1 ? '' : 's'}`,
        actionLabel: 'Resolve Conflicts',
        onAction: () => onSelectTab('clashes'),
      });
    }

    const highMarginCandidate = products.find((p) => p.marginPercent >= 45 && !activePromos.some((a) => a.heroSku === p.sku));
    if (highMarginCandidate) {
      const potentialRev = Math.round(highMarginCandidate.weeklyUnitsBaseline * highMarginCandidate.rrp * 1.45);
      list.push({
        id: `unscheduled-${highMarginCandidate.sku}`,
        kind: 'Profit Recovery Opportunity',
        tone: 'green',
        headline: `${highMarginCandidate.name} has unscheduled high-margin capacity`,
        detail: `${highMarginCandidate.marginPercent}% baseline margin with zero scheduled feature weeks.`,
        impactLabel: `Revenue upside: +${formatAud(potentialRev)}`,
        actionLabel: 'Schedule Promotion',
        onAction: () => onSelectTab('promotion-builder'),
      });
    }

    if (list.length === 0 && hasData) {
      list.push({
        id: 'healthy-portfolio',
        kind: 'Revenue Impact Analysis',
        tone: 'blue',
        headline: 'Active promotional schedule meets margin guardrails',
        detail: `Blended promotional margin sits at ${kpis.blendedPromoMarginPercent.toFixed(1)}% across ${activePromos.length} active weeks.`,
        impactLabel: `Forecast profit: ${formatAud(kpis.totalGrossProfitAud)}`,
        actionLabel: 'Review Full Insights',
        onAction: () => onSelectTab('commercial-insights'),
      });
    }

    return list.slice(0, 3);
  }, [activePromos, products, productMap, skuPromoDemandMap, kpis, hasData, onSelectTab]);

  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';

  const cardClass = isLight
    ? 'bg-white border border-[#E2E8F0] shadow-2xs'
    : 'bg-[#111726] border border-slate-800';

  const forecastRev = activePromos.reduce((s, p) => s + (p.projectedRevenueAud || 0), 0);
  const forecastProfit = activePromos.reduce((s, p) => s + (p.projectedMarginAud || 0), 0);
  const blendedMargin = forecastRev > 0 ? ((forecastProfit / forecastRev) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
            {user ? `Good morning, ${firstName}` : 'Commercial Executive Dashboard'}
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Monitor forecast profit, spot at-risk promotions early, and recover leaking margin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Horizon Segmented Filter */}
          <div
            className={`inline-flex items-center p-1 rounded-lg border ${
              isLight ? 'bg-white border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {(['all', 'H1', 'H2'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframeFilter(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  timeframeFilter === tf
                    ? 'bg-[#0F172A] text-white dark:bg-[#2563EB]'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf === 'all' ? 'Full Year (52W)' : tf === 'H1' ? 'H1 (W1–26)' : 'H2 (W27–52)'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('promotion-builder')}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Promotion</span>
          </button>
        </div>
      </div>

      {/* Empty Catalog Onboarding Banner (Zero Preloaded Mock Data) */}
      {!hasData && (
        <div className={`rounded-2xl p-6 sm:p-8 ${cardClass}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
                Clean Workspace Ready
              </div>
              <h2 className={`text-xl font-bold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                Add your SKUs to calculate live revenue, profit, and promotional risk
              </h2>
              <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Your catalog starts completely blank with zero preloaded mock entities. Add a single product, upload your CSV range, or run a live scenario inside the Promotion Builder.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onOpenAddProductModal}
                className="min-h-[42px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add First SKU</span>
              </button>
              <button
                type="button"
                onClick={onOpenUploadModal}
                className={`min-h-[42px] px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Import CSV Range</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('promotion-builder')}
                className={`min-h-[42px] px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>Open Promotion Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Forecast Revenue */}
        <div className={`rounded-xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Forecast Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#10B981] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold mt-2 tabular-nums ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
            {formatAud(forecastRev)}
          </div>
          <div className="text-xs mt-1.5 flex items-center gap-1.5 tabular-nums">
            <span className="font-semibold text-[#10B981]">
              {hasData ? `+${Math.round(kpis.overallLiftPercent)}% lift` : 'Awaiting SKUs'}
            </span>
            <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>vs. baseline run-rate</span>
          </div>
        </div>

        {/* KPI 2: Forecast Profit */}
        <div className={`rounded-xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Forecast Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[#2563EB] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold mt-2 tabular-nums ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
            {formatAud(forecastProfit)}
          </div>
          <div className="text-xs mt-1.5 flex items-center gap-1.5 tabular-nums">
            <span className="font-semibold text-[#2563EB]">{blendedMargin}% blended margin</span>
            <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>net of rebates</span>
          </div>
        </div>

        {/* KPI 3: Active Promotions */}
        <div className={`rounded-xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Active Promotions
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-[#F59E0B] flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold mt-2 tabular-nums ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
            {formatNumber(activePromos.length)}
          </div>
          <div className="text-xs mt-1.5 flex items-center gap-1.5 tabular-nums">
            <span className={`font-semibold ${statusCounts.atRisk + statusCounts.conflict > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
              {statusCounts.atRisk + statusCounts.conflict > 0
                ? `${statusCounts.atRisk + statusCounts.conflict} need review`
                : 'Schedule clear'}
            </span>
            <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>
              across {products.length} SKUs
            </span>
          </div>
        </div>

        {/* KPI 4: SKUs At Risk */}
        <div className={`rounded-xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              SKUs At Risk
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-[#EF4444] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold mt-2 tabular-nums ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
            {formatNumber(skusAtRisk)}
          </div>
          <div className="text-xs mt-1.5 flex items-center gap-1.5">
            <span className={`font-semibold ${skusAtRisk > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
              {skusAtRisk > 0 ? 'Action required' : 'Margin floor protected'}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row: Profit Forecast Trend + Promotion Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Profit Forecast Trend */}
        <div className={`lg:col-span-8 rounded-xl p-5 sm:p-6 ${cardClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className={`text-base font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                Profit Forecast Trend
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Projected promotional revenue vs. net commercial profit over time
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
                Net Profit
              </span>
            </div>
          </div>

          {hasData && activePromos.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dashProfitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#1E293B'} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: isLight ? '#64748B' : '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: isLight ? '#64748B' : '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
                  />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      formatAud(val),
                      name === 'revenue' ? 'Revenue' : 'Net Profit',
                    ]}
                    contentStyle={{
                      backgroundColor: isLight ? '#FFFFFF' : '#0F172A',
                      borderColor: isLight ? '#E2E8F0' : '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    strokeWidth={2.25}
                    fill="url(#dashRevGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10B981"
                    strokeWidth={2.25}
                    fill="url(#dashProfitGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <p className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                No promotional forecast plotted yet
              </p>
              <p className={`text-xs mt-1 mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Add products and auto-formulate your 52-week schedule to inspect monthly revenue and margin curves.
              </p>
              <button
                type="button"
                onClick={() => (hasData ? onAutoFormulatePlan() : onOpenAddProductModal())}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{hasData ? 'Auto-Formulate 52-Week Calendar' : 'Add Products'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Promotion Status Donut */}
        <div className={`lg:col-span-4 rounded-xl p-5 sm:p-6 flex flex-col justify-between ${cardClass}`}>
          <div>
            <h2 className={`text-base font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
              Promotion Status
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Rule and margin health across active weeks
            </p>
          </div>

          {donutData.length > 0 ? (
            <div className="my-2 flex items-center justify-center relative h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string) => [`${val} promos`, name]}
                    contentStyle={{
                      backgroundColor: isLight ? '#FFFFFF' : '#0F172A',
                      borderColor: isLight ? '#E2E8F0' : '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-2xl font-bold tabular-nums ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                  {statusCounts.total}
                </span>
                <span className="text-[11px] text-slate-500">Promotions</span>
              </div>
            </div>
          ) : (
            <div className="my-4 h-44 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              0 active promotions scheduled
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {[
              { label: 'On Track', count: statusCounts.onTrack, color: '#10B981' },
              { label: 'At Risk', count: statusCounts.atRisk, color: '#F59E0B' },
              { label: 'Conflict', count: statusCounts.conflict, color: '#EF4444' },
              { label: 'Completed', count: statusCounts.completed, color: '#64748B' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </span>
                <span className={`font-semibold tabular-nums ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming Promotions Table + Commercial Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Upcoming Promotions Table */}
        <div className={`lg:col-span-7 rounded-xl overflow-hidden ${cardClass}`}>
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h2 className={`text-base font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                Upcoming Promotions
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Next scheduled retail channel events and estimated margins
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('calendar')}
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>View all promotions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={isLight ? 'bg-[#F8FAFC] text-slate-500' : 'bg-slate-900/60 text-slate-400'}>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 font-semibold">Product</th>
                    <th className="py-3 px-3 font-semibold">Channel</th>
                    <th className="py-3 px-3 font-semibold">Period</th>
                    <th className="py-3 px-3 font-semibold text-right">Discount</th>
                    <th className="py-3 px-3 font-semibold text-right">Est. Margin</th>
                    <th className="py-3 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {upcomingRows.map((row) => (
                    <tr
                      key={row.weekNumber}
                      onClick={() => onOpenWeekStudio(row.weekNumber)}
                      className={`cursor-pointer transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className={`py-3 px-4 font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                        {row.productName}
                      </td>
                      <td className={`py-3 px-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {row.channel}
                      </td>
                      <td className="py-3 px-3 text-slate-500 tabular-nums whitespace-nowrap">{row.period}</td>
                      <td className="py-3 px-3 text-right font-semibold tabular-nums">{row.discount}</td>
                      <td className="py-3 px-3 text-right font-semibold tabular-nums">{row.margin}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            row.status === 'On Track'
                              ? 'text-[#10B981]'
                              : row.status === 'Review'
                              ? 'text-[#F59E0B]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {row.status === 'On Track' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          )}
                          <span>{row.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No upcoming promotions scheduled. Add SKUs or open the Promotion Builder to create one.
            </div>
          )}
        </div>

        {/* Commercial Insights Panel */}
        <div className={`lg:col-span-5 rounded-xl p-5 sm:p-6 flex flex-col justify-between ${cardClass}`}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#2563EB]" />
              <h2 className={`text-base font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                Commercial Insights
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('commercial-insights')}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>

          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((ins) => (
                <div
                  key={ins.id}
                  className={`p-3.5 rounded-xl border ${
                    isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                    <span
                      className={
                        ins.tone === 'red'
                          ? 'text-[#EF4444]'
                          : ins.tone === 'amber'
                          ? 'text-[#F59E0B]'
                          : ins.tone === 'green'
                          ? 'text-[#10B981]'
                          : 'text-[#2563EB]'
                      }
                    >
                      {ins.kind}
                    </span>
                    <span className={`tabular-nums ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                      {ins.impactLabel}
                    </span>
                  </div>
                  <div className={`text-xs font-semibold mt-1 ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                    {ins.headline}
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {ins.detail}
                  </p>
                  <button
                    type="button"
                    onClick={ins.onAction}
                    className="mt-2.5 text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>{ins.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              Commercial profit recovery alerts and margin risk flags will appear here as soon as your range is added.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
