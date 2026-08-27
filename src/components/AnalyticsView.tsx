import React, { useState } from 'react';
import { WeekPromotion, Product, StrategyKPIs } from '../types';
import { formatAud, formatNumber, formatPercent } from '../utils/formatters';
import { CategorySunburstChart } from './CategorySunburstChart';
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
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  promotions,
  products,
  kpis,
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

  // Category aggregation
  const categoryStatsMap = new Map<string, { revenue: number; units: number; profit: number; promoCount: number }>();
  promotions.forEach(promo => {
    const prod = productMap.get(promo.heroSku);
    const cat = prod?.category || 'Other';
    const current = categoryStatsMap.get(cat) || { revenue: 0, units: 0, profit: 0, promoCount: 0 };
    current.revenue += promo.projectedRevenueAud || 0;
    current.units += promo.projectedUnits || 0;
    current.profit += promo.projectedMarginAud || 0;
    current.promoCount += 1;
    categoryStatsMap.set(cat, current);
  });

  const annualRev = kpis?.annualProjectedRevenueAud || 1;
  const categoryBreakdown = Array.from(categoryStatsMap.entries()).map(([category, stats]) => ({
    category,
    ...stats,
    marginPercent: stats.revenue > 0 ? Number(((stats.profit / stats.revenue) * 100).toFixed(1)) : 0,
    sharePercent: annualRev > 0 ? Number(((stats.revenue / annualRev) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  // Performance Tier aggregation
  const tierStatsMap = new Map<string, { revenue: number; units: number; count: number }>();
  promotions.forEach(promo => {
    const prod = productMap.get(promo.heroSku);
    const tier = prod?.performanceTier || 'tier2_margin';
    const curr = tierStatsMap.get(tier) || { revenue: 0, units: 0, count: 0 };
    curr.revenue += promo.projectedRevenueAud || 0;
    curr.units += promo.projectedUnits || 0;
    curr.count += 1;
    tierStatsMap.set(tier, curr);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>52-Week Commercial & Financial Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full annual promotional performance, category mix, vendor trade spend funding, and gross profit modeling.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Total 52-Week Campaigns:</span>
          <span className="text-amber-400 font-bold">52 Weeks Scheduled</span>
        </div>
      </div>

      {/* Hero Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Projected Promo Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {formatAud(kpis?.annualProjectedRevenueAud)} <span className="text-xs font-normal text-slate-400">AUD</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Volume Lift: <strong className="text-emerald-300">+{kpis?.overallLiftPercent ?? 0}%</strong></span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Blended Gross Margin</span>
            <Percent className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-300 mt-2">
            {kpis?.blendedPromoMarginPercent ?? 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Gross Profit: <strong className="text-white">{formatAud(kpis?.annualGrossProfitAud ?? kpis?.totalGrossProfitAud)} AUD</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Units Moved</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-2">
            {formatNumber(kpis?.annualProjectedUnits)} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg <strong className="text-slate-200">{formatNumber(Math.round((kpis?.annualProjectedUnits || 0) / 52))} units/week</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Vendor Co-Op Scan Rebate</span>
            <Wallet className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2">
            {formatAud(kpis?.totalTradeSpendFundingAud ?? kpis?.totalTradeSpendCoOpAud)} <span className="text-xs font-normal text-slate-400">AUD</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Supplier funded trade investment
          </div>
        </div>
      </div>

      {/* Quarterly Performance Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Quarterly Promotional Roadmap Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div key={q.quarter} className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="text-base font-black text-amber-400">{q.quarter}</span>
                    <p className="text-[10px] text-slate-400">{quarterLabels[q.quarter]}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {q.majorEvents} Key Moments
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Revenue:</span>
                    <span className="font-bold text-emerald-400">{formatAud(q.revenue)} AUD</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Profit:</span>
                    <span className="font-bold text-slate-200">{formatAud(q.profit)} AUD</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Blended Margin:</span>
                    <span className="font-bold text-blue-300">{q.margin}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Units Sold:</span>
                    <span className="font-bold text-amber-300">{formatNumber(q.units)} u</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Vendor Funding:</span>
                    <span className="font-bold text-purple-300">{formatAud(q.tradeSpend)}</span>
                  </div>
                </div>

                {/* Progress Bar for revenue share */}
                <div className="pt-2">
                  <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                    <span>Share of Annual Target:</span>
                    <span className="font-bold text-white">{revShare}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Weekly Trade Spend vs. ROI Target Trend Analysis</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparing supplier trade investments against the benchmark 4.0x ROI target across campaigns.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setChartQuarter(q)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  chartQuarter === q
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {q === 'ALL' ? 'Full 52 Weeks' : q}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#a78bfa" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={11} domain={[0, 10]} tickFormatter={(val) => `${val}x`} tickLine={false} />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-white">
                        <div className="font-bold text-amber-400">{data.week}: {data.campaign}</div>
                        <div className="text-slate-300">Trade Spend: <span className="font-mono font-bold text-purple-300">{formatAud(data.tradeSpend)} AUD</span></div>
                        <div className="text-slate-300">Actual ROI: <span className="font-mono font-bold text-emerald-400">{data.actualRoi}x</span></div>
                        <div className="text-slate-300">Target ROI: <span className="font-mono font-bold text-blue-400">{data.targetRoi}x</span></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar yAxisId="left" dataKey="tradeSpend" name="Trade Spend ($ AUD)" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Line yAxisId="right" type="monotone" dataKey="actualRoi" name="Actual ROI (Revenue / Spend)" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3, fill: '#34d399' }} />
              <Line yAxisId="right" type="monotone" dataKey="targetRoi" name="ROI Target Benchmark (4.0x)" stroke="#60a5fa" strokeDasharray="4 4" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* D3 Sunburst Chart Section */}
      <CategorySunburstChart promotions={promotions} products={products} />

      {/* 2-Column: Category Mix & SKU Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category Contribution (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>Category Performance & Revenue Contribution</span>
          </h3>

          <div className="space-y-3">
            {categoryBreakdown.map(cat => (
              <div key={cat.category} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{cat.category}</span>
                    <span className="text-[10px] font-normal text-slate-400">({cat.promoCount} Weeks Featured)</span>
                  </div>
                  <div className="font-extrabold text-emerald-400">
                    {formatAud(cat.revenue)} AUD <span className="text-slate-400 text-[10px]">({cat.sharePercent}%)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.min(100, Math.max(0, cat.sharePercent))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Units: <strong className="text-slate-200">{formatNumber(cat.units)}</strong></span>
                  <span>Gross Profit: <strong className="text-slate-200">{formatAud(cat.profit)}</strong></span>
                  <span>Blended Margin: <strong className="text-blue-300">{cat.marginPercent}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Tiering Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>SKU Performance Tiering Distribution</span>
          </h3>

          <div className="space-y-3">
            {[
              { id: 'tier1_hero', label: 'Tier 1: High Volume Heroes', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
              { id: 'tier2_margin', label: 'Tier 2: Margin Builders', color: 'border-blue-500/40 text-blue-300 bg-blue-500/10' },
              { id: 'tier3_niche', label: 'Tier 3: Niche & Premium', color: 'border-purple-500/40 text-purple-300 bg-purple-500/10' },
              { id: 'tier4_clearance', label: 'Tier 4: Clearance & End-of-Line', color: 'border-rose-500/40 text-rose-300 bg-rose-500/10' },
            ].map(tier => {
              const data = tierStatsMap.get(tier.id) || { revenue: 0, units: 0, count: 0 };
              const share = (kpis?.annualProjectedRevenueAud || 0) > 0 
                ? ((data.revenue / (kpis.annualProjectedRevenueAud || 1)) * 100).toFixed(1) 
                : '0';

              return (
                <div key={tier.id} className={`p-3.5 rounded-xl border ${tier.color} text-xs space-y-1.5`}>
                  <div className="flex justify-between font-bold">
                    <span>{tier.label}</span>
                    <span>{data.count} Weeks</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Revenue Generated:</span>
                    <strong className="text-white">{formatAud(data.revenue)} ({share}%)</strong>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
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
