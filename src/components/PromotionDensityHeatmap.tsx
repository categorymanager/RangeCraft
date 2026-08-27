import React, { useState, useMemo } from 'react';
import { WeekPromotion, Product } from '../types';
import { formatAud, formatNumber, formatPrice } from '../utils/formatters';
import { 
  Flame, 
  Layers, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  TrendingUp, 
  DollarSign, 
  Tag, 
  Info,
  Filter,
  Eye,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';

interface PromotionDensityHeatmapProps {
  promotions: WeekPromotion[];
  products: Product[];
  productMap: Map<string, Product>;
  selectedWeekNum: number;
  onSelectWeek: (weekNum: number) => void;
  onOpenWeekStudio: (weekNum: number) => void;
  selectedQuarter: 'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4';
}

export function getPromotionDensity(promo: WeekPromotion) {
  const activeCount = 1 + (promo.secondarySkus?.length || 0);
  let level: 'low' | 'medium' | 'high' | 'peak' = 'low';
  let label = '1 SKU (Baseline)';
  let saturationPercent = 25;
  let bgClass = 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300';
  let badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  let barClass = 'bg-emerald-500';
  let cellBg = 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60';
  let indicatorColor = '#10b981';

  if (activeCount === 2) {
    level = 'medium';
    label = '2 SKUs (Moderate)';
    saturationPercent = 50;
    bgClass = 'bg-amber-950/40 border-amber-600/40 text-amber-200';
    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    barClass = 'bg-amber-500';
    cellBg = 'bg-amber-900/45 text-amber-200 border-amber-600/50 hover:bg-amber-900/70';
    indicatorColor = '#f59e0b';
  } else if (activeCount === 3) {
    level = 'high';
    label = '3 SKUs (High Activity)';
    saturationPercent = 75;
    bgClass = 'bg-orange-950/50 border-orange-500/50 text-orange-100';
    badgeClass = 'bg-orange-500/25 text-orange-300 border-orange-500/40';
    barClass = 'bg-orange-500';
    cellBg = 'bg-orange-900/60 text-orange-100 border-orange-500/60 hover:bg-orange-900/80 shadow-sm shadow-orange-950/50';
    indicatorColor = '#f97316';
  } else if (activeCount >= 4) {
    level = 'peak';
    label = `${activeCount} SKUs (Peak Saturation)`;
    saturationPercent = 100;
    bgClass = 'bg-rose-950/60 border-rose-500/60 text-rose-100';
    badgeClass = 'bg-rose-500/30 text-rose-200 border-rose-500/50 font-bold';
    barClass = 'bg-gradient-to-r from-rose-500 to-amber-500';
    cellBg = 'bg-gradient-to-br from-rose-900/70 via-rose-950 to-orange-950/70 text-rose-100 border-rose-500/70 hover:from-rose-900/90 shadow-md shadow-rose-950/60';
    indicatorColor = '#f43f5e';
  }

  return {
    activeCount,
    level,
    label,
    saturationPercent,
    bgClass,
    badgeClass,
    barClass,
    cellBg,
    indicatorColor
  };
}

export const PromotionDensityHeatmap: React.FC<PromotionDensityHeatmapProps> = ({
  promotions,
  products,
  productMap,
  selectedWeekNum,
  onSelectWeek,
  onOpenWeekStudio,
  selectedQuarter,
}) => {
  const [densityFilter, setDensityFilter] = useState<'ALL' | 'peak' | 'high' | 'medium' | 'low'>('ALL');
  const [hoveredWeek, setHoveredWeek] = useState<WeekPromotion | null>(null);

  // Calculate high-level density metrics across the 52-week plan
  const densityStats = useMemo(() => {
    let totalActiveSkus = 0;
    let peakWeeksCount = 0;
    let highWeeksCount = 0;
    let moderateWeeksCount = 0;
    let baselineWeeksCount = 0;
    let maxConcurrency = 0;

    promotions.forEach(p => {
      const count = 1 + (p.secondarySkus?.length || 0);
      totalActiveSkus += count;
      if (count > maxConcurrency) maxConcurrency = count;

      if (count >= 4) peakWeeksCount++;
      else if (count === 3) highWeeksCount++;
      else if (count === 2) moderateWeeksCount++;
      else baselineWeeksCount++;
    });

    const avgSkusPerWeek = (totalActiveSkus / promotions.length).toFixed(1);

    return {
      totalActiveSkus,
      avgSkusPerWeek,
      peakWeeksCount,
      highWeeksCount,
      moderateWeeksCount,
      baselineWeeksCount,
      maxConcurrency,
    };
  }, [promotions]);

  const filteredWeeks = useMemo(() => {
    return promotions.filter(p => {
      if (selectedQuarter !== 'ALL' && p.quarter !== selectedQuarter) return false;
      if (densityFilter === 'ALL') return true;
      const density = getPromotionDensity(p);
      return density.level === densityFilter;
    });
  }, [promotions, selectedQuarter, densityFilter]);

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner: Density KPI Summary & Saturation Legend */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  52-Week Promotion Density Heatmap
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Live Saturation Analysis
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualizes promotional concurrency & discount intensity across the Australian retail calendar. Darker saturation indicates higher active SKU volume.
                </p>
              </div>
            </div>
          </div>

          {/* Density Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start lg:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setDensityFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                densityFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Intensities ({promotions.length})
            </button>
            <button
              onClick={() => setDensityFilter('peak')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                densityFilter === 'peak'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Peak Saturation 4+ ({densityStats.peakWeeksCount})</span>
            </button>
            <button
              onClick={() => setDensityFilter('high')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                densityFilter === 'high'
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-orange-400 hover:text-orange-300'
              }`}
            >
              <span>High 3 ({densityStats.highWeeksCount})</span>
            </button>
            <button
              onClick={() => setDensityFilter('medium')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                densityFilter === 'medium'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <span>Moderate 2 ({densityStats.moderateWeeksCount})</span>
            </button>
            <button
              onClick={() => setDensityFilter('low')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                densityFilter === 'low'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span>Baseline 1 ({densityStats.baselineWeeksCount})</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Density</div>
            <div className="text-xl font-black text-amber-400 mt-0.5">
              {densityStats.avgSkusPerWeek} <span className="text-xs text-slate-400 font-normal">SKUs / Week</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Balanced catalogue share</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span>Peak Weeks (4+ SKUs)</span>
            </div>
            <div className="text-xl font-black text-rose-400 mt-0.5">
              {densityStats.peakWeeksCount} <span className="text-xs text-slate-400 font-normal">Weeks</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Aust Day, EOFY, Black Fri, Xmas</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">High Volume (3 SKUs)</div>
            <div className="text-xl font-black text-orange-400 mt-0.5">
              {densityStats.highWeeksCount} <span className="text-xs text-slate-400 font-normal">Weeks</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Multi-item category themes</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Concurrency</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {densityStats.maxConcurrency} <span className="text-xs text-slate-400 font-normal">Active SKUs</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Peak catalogue load limit</div>
          </div>
        </div>

        {/* Visual Saturation Scale Legend */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Color Saturation Gradient:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-emerald-900/50">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
              <span className="text-[11px] text-emerald-300 font-semibold">1 SKU (25% Saturation)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-amber-900/50">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
              <span className="text-[11px] text-amber-300 font-semibold">2 SKUs (50% Saturation)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-orange-900/50">
              <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
              <span className="text-[11px] text-orange-300 font-semibold">3 SKUs (75% Saturation)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-rose-900/50">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm animate-pulse" />
              <span className="text-[11px] text-rose-300 font-bold">4+ SKUs (100% Saturation / Peak)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 52-WEEK MATRIX DENSITY MAP (Divided by Quarters) */}
      <div className="space-y-6">
        {quarters.map((q) => {
          if (selectedQuarter !== 'ALL' && selectedQuarter !== q) return null;

          const quarterPromos = promotions.filter(p => p.quarter === q);
          const qName = q === 'Q1' 
            ? 'Q1 Summer & Back-to-School (Weeks 1 - 13)'
            : q === 'Q2'
            ? "Q2 Autumn, Mother's Day & EOFY (Weeks 14 - 26)"
            : q === 'Q3'
            ? "Q3 Winter Warmers & Father's Day (Weeks 27 - 39)"
            : 'Q4 Spring Carnival, Black Friday & Christmas (Weeks 40 - 52)';

          return (
            <div key={q} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 shadow-sm">
                    {q}
                  </span>
                  <h3 className="text-sm font-black text-white">{qName}</h3>
                </div>
                <div className="text-xs text-slate-400">
                  {quarterPromos.filter(p => p.isMajorRetailMoment).length} Key AU Retail Moments
                </div>
              </div>

              {/* 13-Week Heatmap Strip Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-13 gap-2">
                {quarterPromos.map((promo) => {
                  const density = getPromotionDensity(promo);
                  const isSelected = selectedWeekNum === promo.weekNumber;
                  const heroProduct = productMap.get(promo.heroSku);
                  const hasClash = promo.clashWarnings.length > 0;
                  const isMatchFilter = densityFilter === 'ALL' || density.level === densityFilter;

                  if (!isMatchFilter) {
                    return (
                      <div 
                        key={promo.weekNumber}
                        className="opacity-25 p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-600 text-center"
                      >
                        <div className="text-[10px] font-mono">W{promo.weekNumber}</div>
                        <div className="text-[9px] truncate">{promo.campaignTheme}</div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={promo.weekNumber}
                      onClick={() => onSelectWeek(promo.weekNumber)}
                      onMouseEnter={() => setHoveredWeek(promo)}
                      onMouseLeave={() => setHoveredWeek(null)}
                      className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${density.cellBg} ${
                        isSelected 
                          ? 'ring-2 ring-amber-400 border-amber-400 scale-[1.03] z-10 shadow-lg' 
                          : 'hover:scale-[1.02]'
                      }`}
                    >
                      {/* Top row: Week & Active count */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-black">W{promo.weekNumber}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${density.badgeClass}`}>
                            {density.activeCount} {density.activeCount === 1 ? 'SKU' : 'SKUs'}
                          </span>
                        </div>

                        {/* Event / Campaign Theme */}
                        <div className="text-[11px] font-black truncate leading-tight mt-1" title={promo.australianEvent || promo.campaignTheme}>
                          {promo.australianEvent ? `🇦🇺 ${promo.australianEvent}` : promo.campaignTheme}
                        </div>

                        <div className="text-[9px] opacity-80 truncate mt-0.5">
                          {heroProduct?.name || promo.heroSku}
                        </div>
                      </div>

                      {/* Bottom Metric & Saturation Bar */}
                      <div className="mt-2.5 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-extrabold text-emerald-300">
                            ${promo.mechanic.promoRrp.toFixed(2)}
                          </span>
                          <span className="text-[9px] font-bold opacity-90 truncate max-w-[70px]">
                            {promo.mechanic.label}
                          </span>
                        </div>

                        {/* Visual Saturation Progress Bar */}
                        <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={`h-full ${density.barClass}`}
                            style={{ width: `${density.saturationPercent}%` }}
                          />
                        </div>

                        {hasClash && (
                          <div className="flex items-center gap-1 text-[9px] text-rose-300 font-bold mt-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>ACCC Alert</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

      {/* EXPANDED WEEK DETAIL INSPECTOR FOR HEATMAP */}
      {selectedWeekNum && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {(() => {
            const promo = promotions.find(p => p.weekNumber === selectedWeekNum) || promotions[0];
            const density = getPromotionDensity(promo);
            const heroProduct = productMap.get(promo.heroSku);
            const secondaryProducts = promo.secondarySkus.map(sku => productMap.get(sku)).filter(Boolean);

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
                      W{promo.weekNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {promo.startDate} – {promo.endDate} • {promo.quarter} ({promo.month})
                        </span>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${density.badgeClass}`}>
                          {density.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {promo.australianEvent ? `🇦🇺 ${promo.australianEvent} — ` : ''}{promo.campaignTheme}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenWeekStudio(promo.weekNumber)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <span>Configure in Week Studio</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Active SKUs Breakdown in this promotional week */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Hero SKU Card */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-amber-400 uppercase">⭐ Primary Hero SKU</span>
                      <span className="font-mono text-[10px]">{promo.heroSku}</span>
                    </div>
                    <div className="font-bold text-sm text-white">
                      {heroProduct?.name || 'Product Details'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {heroProduct?.category} &gt; {heroProduct?.subcategory}
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 line-through">RRP ${heroProduct?.rrp != null ? heroProduct.rrp.toFixed(2) : '0.00'}</span>
                      <span className="text-base font-black text-emerald-400">${(promo.mechanic?.promoRrp || 0).toFixed(2)} AUD</span>
                    </div>
                  </div>

                  {/* Secondary Active SKUs */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-blue-400 uppercase">Supporting Secondary SKUs</span>
                      <span className="text-[10px] font-bold text-slate-400">{promo.secondarySkus?.length || 0} active</span>
                    </div>
                    {secondaryProducts.length > 0 ? (
                      <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                        {secondaryProducts.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="font-medium text-slate-200 truncate pr-2">{p?.name || 'Product'}</span>
                            <span className="font-mono text-[10px] text-amber-400 shrink-0">${p?.rrp != null ? p.rrp.toFixed(2) : '0.00'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 py-3 text-center italic">
                        No secondary SKUs scheduled for this week.
                      </div>
                    )}
                  </div>

                  {/* Financial & Trade Spend Projections */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase">
                      Commercial Impact & Trade Spend
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Projected Rev</div>
                        <div className="font-black text-slate-100">{formatAud(promo.projectedRevenueAud)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Promo Margin</div>
                        <div className="font-black text-blue-300">{promo.projectedMarginPercent}% GP</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Projected Vol</div>
                        <div className="font-black text-slate-200">{formatNumber(promo.projectedUnits)} units</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Trade Rebate</div>
                        <div className="font-black text-emerald-400">{formatAud(promo.tradeSpendAud)}</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
};
