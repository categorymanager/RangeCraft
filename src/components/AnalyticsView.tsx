import React, { useState } from 'react';
import { AppTab, WeekPromotion, Product, StrategyKPIs, ThemeMode } from '../types';
import { formatAud, formatNumber, formatPercent } from '../utils/formatters';
import { CategorySunburstChart } from './CategorySunburstChart';
import { WorkspacePageHero } from './WorkspacePageHero';
import tradeAnalyticsHeroImg from '../assets/images/trade_analytics_hero_1795341506158.jpg';
import { 
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Layers, 
  PieChart, 
  ArrowUpRight, 
  Award,
  Flame,
  Calendar,
  Wallet
} from 'lucide-react';

interface AnalyticsViewProps {
  promotions: WeekPromotion[];
  products: Product[];
  kpis: StrategyKPIs;
  currentTheme?: ThemeMode | string;
  onSelectTab?: (tab: AppTab) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  promotions,
  products,
  kpis,
  currentTheme = 'light',
  onSelectTab,
}) => {
  const [chartQuarter, setChartQuarter] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');

  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.sku, p));

  // Quarterly aggregation
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
  const quarterStats = quarters.map(q => {
    const qPromos = promotions.filter(p => p.quarter === q);
    const revenue = qPromos.reduce((sum, p) => sum + (p.projectedRevenueAud || 0), 0);
    const profit = qPromos.reduce((sum, p) => sum + (p.projectedMarginAud || 0), 0);
    const tradeSpend = qPromos.reduce((sum, p) => sum + (p.tradeSpendAud || 0), 0);
    const units = qPromos.reduce((sum, p) => sum + (p.projectedUnits || 0), 0);
    const margin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0;
    const majorEvents = qPromos.filter(p => p.isMajorRetailMoment).length;

    return {
      quarter: q,
      weeksCount: qPromos.length,
      revenue,
      profit,
      tradeSpend,
      units,
      margin,
      majorEvents,
    };
  });

  // Trend data for Recharts
  const trendData = promotions
    .filter(p => chartQuarter === 'ALL' || p.quarter === chartQuarter)
    .map(p => {
      const tradeSpend = p.tradeSpendAud || 0;
      const revenue = p.projectedRevenueAud || 0;
      const actualRoi = tradeSpend > 0 ? Number((revenue / tradeSpend).toFixed(2)) : 0;
      return {
        week: `W${p.weekNumber}`,
        weekNum: p.weekNumber,
        campaign: p.campaignTheme,
        tradeSpend,
        actualRoi,
        targetRoi: 4.0,
      };
    });

  const activePromos = promotions.filter(p => Boolean(p.heroSku) && productMap.has(p.heroSku));

  // Category aggregation (only active scheduled weeks with assigned SKUs)
  const categoryStatsMap = new Map<string, { revenue: number; units: number; profit: number; promoCount: number }>();
  activePromos.forEach(promo => {
    const prod = productMap.get(promo.heroSku);
    const cat = prod?.category || 'Uncategorized';
    const current = categoryStatsMap.get(cat) || { revenue: 0, units: 0, profit: 0, promoCount: 0 };
    current.revenue += promo.projectedRevenueAud || 0;
    current.units += promo.projectedUnits || 0;
    current.profit += promo.projectedMarginAud || 0;
    current.promoCount += 1;
    categoryStatsMap.set(cat, current);
  });

  const annualRev = kpis?.annualProjectedRevenueAud || 0;
  const categoryBreakdown = Array.from(categoryStatsMap.entries()).map(([category, stats]) => ({
    category,
    ...stats,
    marginPercent: stats.revenue > 0 ? Number(((stats.profit / stats.revenue) * 100).toFixed(1)) : 0,
    sharePercent: annualRev > 0 ? Number(((stats.revenue / annualRev) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  // Performance Tier aggregation
  const tierStatsMap = new Map<string, { revenue: number; units: number; count: number }>();
  activePromos.forEach(promo => {
    const prod = productMap.get(promo.heroSku);
    if (!prod) return;
    const tier = prod.performanceTier || 'tier2_margin';
    const curr = tierStatsMap.get(tier) || { revenue: 0, units: 0, count: 0 };
    curr.revenue += promo.projectedRevenueAud || 0;
    curr.units += promo.projectedUnits || 0;
    curr.count += 1;
    tierStatsMap.set(tier, curr);
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Centered Funnel Tool Hero */}
      <WorkspacePageHero
        stepLabel="Step 5 of 5 · Trade Waterfall & ROI"
        title="Trade Waterfall & Analytics"
        subtitle="Audit annual promotional uplift, category mix contribution, vendor scan rebates, and gross-to-net ROI curves."
        accent="emerald"
        currentTheme={currentTheme}
        activeStep={5}
        onSelectTab={onSelectTab}
        heroImageSrc={tradeAnalyticsHeroImg}
        heroImageAlt="Trade Waterfall Revenue and Margin Analytics"
        FallbackIcon={BarChart3}
        metaStrip={
          <span className="text-emerald-700 dark:text-emerald-300 font-bold">
            Horizon: 52 Weeks Scheduled · {products.length} Active SKUs
          </span>
        }
      />

      {/* High-Contrast Dark Financial Telemetry Band */}
      <div className="rounded-3xl bg-[#0F172A] border border-slate-800 text-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-slate-800 tabular-nums">
          <div className="p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 gap-1">
              <span className="truncate">Projected Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1.5 truncate">
              {formatAud(kpis?.annualProjectedRevenueAud)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Lift: <strong className="text-emerald-300">+{kpis?.overallLiftPercent ?? 0}%</strong></span>
            </div>
          </div>

          <div className="p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 gap-1">
              <span className="truncate">Blended Margin</span>
              <Percent className="w-4 h-4 text-sky-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-sky-300 mt-1.5">
              {kpis?.blendedPromoMarginPercent ?? 0}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              Profit: <strong className="text-white">{formatAud(kpis?.annualGrossProfitAud ?? kpis?.totalGrossProfitAud)}</strong>
            </div>
          </div>

          <div className="p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 gap-1">
              <span className="truncate">Total Units Moved</span>
              <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-1.5 truncate">
              {formatNumber(kpis?.annualProjectedUnits)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              Avg <strong className="text-slate-200">{formatNumber(Math.round((kpis?.annualProjectedUnits || 0) / 52))}/wk</strong>
            </div>
          </div>

          <div className="p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 gap-1">
              <span className="truncate">Co-Op Scan Rebate</span>
              <Wallet className="w-4 h-4 text-violet-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-violet-300 mt-1.5 truncate">
              {formatAud(kpis?.totalTradeSpendFundingAud ?? kpis?.totalTradeSpendCoOpAud)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              Supplier trade investment
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Performance Grid */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Quarterly Promotional Roadmap Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quarterStats.map(q => {
            const quarterLabels: Record<string, string> = {
              Q1: 'Summer, Australia Day & Easter',
              Q2: 'Mother\'s Day, Winter & EOFY',
              Q3: 'Winter Clearance & Footy Finals',
              Q4: 'Spring, Black Friday & Christmas'
            };

            const revShare = (kpis?.annualProjectedRevenueAud || 0) > 0 
              ? ((q.revenue / (kpis.annualProjectedRevenueAud || 1)) * 100).toFixed(1) 
              : '0';

            return (
              <div key={q.quarter} className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2 gap-2">
                  <div className="min-w-0">
                    <span className="text-base font-black text-amber-600 dark:text-amber-400">{q.quarter}</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{quarterLabels[q.quarter]}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                    {q.majorEvents} Moments
                  </span>
                </div>

                <div className="space-y-2 text-xs tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Revenue:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatAud(q.revenue)} AUD</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Gross Profit:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatAud(q.profit)} AUD</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Blended Margin:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-300">{q.margin}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Units Sold:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-300">{formatNumber(q.units)} u</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Vendor Funding:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-300">{formatAud(q.tradeSpend)}</span>
                  </div>
                </div>

                {/* Progress Bar for revenue share */}
                <div className="pt-2">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 flex justify-between tabular-nums">
                    <span>Share of Annual Target:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{revShare}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                      style={{ width: `${Math.min(100, Math.max(0, Number(revShare)))}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Trade Spend vs ROI Target Trend Analysis */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Weekly Trade Spend vs. ROI Target Trend</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparing supplier trade investments against the benchmark 4.0x ROI target across campaigns.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto no-scrollbar max-w-full">
            {(['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setChartQuarter(q)}
                className={`min-h-[36px] px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  chartQuarter === q
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {q === 'ALL' ? '52 Weeks' : q}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
              <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#7c3aed" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} domain={[0, 10]} tickFormatter={(val) => `${val}x`} tickLine={false} />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 text-slate-900 dark:text-white">
                        <div className="font-bold text-amber-600 dark:text-amber-400">{data.week}: {data.campaign}</div>
                        <div className="text-slate-600 dark:text-slate-300">Trade Spend: <span className="font-mono font-bold text-purple-600 dark:text-purple-300">{formatAud(data.tradeSpend)} AUD</span></div>
                        <div className="text-slate-600 dark:text-slate-300">Actual ROI: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{data.actualRoi}x</span></div>
                        <div className="text-slate-600 dark:text-slate-300">Target ROI: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{data.targetRoi}x</span></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar yAxisId="left" dataKey="tradeSpend" name="Trade Spend ($ AUD)" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.75} />
              <Line yAxisId="right" type="monotone" dataKey="actualRoi" name="Actual ROI" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2.5, fill: '#10b981' }} />
              <Line yAxisId="right" type="monotone" dataKey="targetRoi" name="Target ROI (4.0x)" stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* D3 Sunburst Chart Section */}
      <CategorySunburstChart promotions={promotions} products={products} />

      {/* 2-Column: Category Mix & SKU Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Category Contribution (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Category Performance &amp; Revenue Contribution</span>
          </h3>

          <div className="space-y-3">
            {categoryBreakdown.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                No active promotional SKUs scheduled yet. Add products and auto-formulate your 52-week calendar to see category performance.
              </div>
            ) : (
              categoryBreakdown.map(cat => (
                <div key={cat.category} className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
                      <span className="truncate">{cat.category}</span>
                      <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 whitespace-nowrap">({cat.promoCount} Wks)</span>
                    </div>
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                      {formatAud(cat.revenue)} AUD <span className="text-slate-500 dark:text-slate-400 text-[10px]">({cat.sharePercent}%)</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(0, cat.sharePercent))}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 tabular-nums">
                    <span>Units: <strong className="text-slate-800 dark:text-slate-200">{formatNumber(cat.units)}</strong></span>
                    <span>Profit: <strong className="text-slate-800 dark:text-slate-200">{formatAud(cat.profit)}</strong></span>
                    <span>Margin: <strong className="text-blue-600 dark:text-blue-300">{cat.marginPercent}%</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Tiering Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>SKU Performance Tiering Distribution</span>
          </h3>

          <div className="space-y-3">
            {[
              { id: 'tier1_hero', label: 'Tier 1: High Volume Heroes', color: 'border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-500/10' },
              { id: 'tier2_margin', label: 'Tier 2: Margin Builders', color: 'border-blue-200 dark:border-blue-500/40 text-blue-800 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-500/10' },
              { id: 'tier3_niche', label: 'Tier 3: Niche & Premium', color: 'border-purple-200 dark:border-purple-500/40 text-purple-800 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-500/10' },
              { id: 'tier4_clearance', label: 'Tier 4: Clearance & End-of-Line', color: 'border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-500/10' },
            ].map(tier => {
              const data = tierStatsMap.get(tier.id) || { revenue: 0, units: 0, count: 0 };
              const share = (kpis?.annualProjectedRevenueAud || 0) > 0 
                ? ((data.revenue / (kpis.annualProjectedRevenueAud || 1)) * 100).toFixed(1) 
                : '0';

              return (
                <div key={tier.id} className={`p-3.5 rounded-xl border ${tier.color} text-xs space-y-1.5 tabular-nums`}>
                  <div className="flex justify-between font-bold gap-2">
                    <span>{tier.label}</span>
                    <span className="whitespace-nowrap">{data.count} Wks</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 gap-2">
                    <span>Revenue Generated:</span>
                    <strong className="text-slate-900 dark:text-white">{formatAud(data.revenue)} ({share}%)</strong>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px] gap-2">
                    <span>Total Volume:</span>
                    <span>{formatNumber(data.units)} units</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
