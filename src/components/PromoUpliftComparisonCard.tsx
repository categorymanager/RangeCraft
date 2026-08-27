import React from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  DollarSign, 
  Percent, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  BarChart3,
  Zap
} from 'lucide-react';
import { Product, WeekPromotion, ThemeMode } from '../types';
import { formatAud, formatPrice } from '../utils/formatters';

interface PromoUpliftComparisonCardProps {
  product: Product;
  promotion?: WeekPromotion | null;
  customDiscountPercent?: number;
  customPromoUnits?: number;
  currentTheme?: ThemeMode;
  className?: string;
}

export const PromoUpliftComparisonCard: React.FC<PromoUpliftComparisonCardProps> = ({
  product,
  promotion,
  customDiscountPercent,
  customPromoUnits,
  currentTheme = 'light',
  className = ''
}) => {
  const isLight = currentTheme.includes('light');

  // Baseline Non-Promo Calculations
  const baselinePrice = product.rrp;
  const baselineUnits = product.weeklyUnitsBaseline || 150;
  const baselineCost = product.cost;
  const baselineRevenue = baselinePrice * baselineUnits;
  const baselineMarginAud = (baselinePrice - baselineCost) * baselineUnits;
  const baselineMarginPercent = baselinePrice > 0 ? ((baselinePrice - baselineCost) / baselinePrice) * 100 : 0;

  // Promo Calculations
  const discountDepth = customDiscountPercent ?? (promotion?.plannedDiscountPercent || 25);
  const promoPrice = baselinePrice * (1 - discountDepth / 100);
  
  // Calculate or use forecast promo units
  const defaultLiftMultiplier = discountDepth >= 50 ? 4.5 : discountDepth >= 30 ? 3.0 : discountDepth >= 20 ? 2.2 : 1.6;
  const promoUnits = customPromoUnits ?? (promotion?.projectedUnits || Math.round(baselineUnits * defaultLiftMultiplier));
  
  const unitUpliftAbsolute = Math.max(0, promoUnits - baselineUnits);
  const unitUpliftPercent = baselineUnits > 0 ? Math.round(((promoUnits - baselineUnits) / baselineUnits) * 100) : 0;
  const unitLiftMultiplier = baselineUnits > 0 ? Number((promoUnits / baselineUnits).toFixed(1)) : 1;

  const promoRevenue = promoPrice * promoUnits;
  const incrementalRevenue = promoRevenue - baselineRevenue;

  // Scan funding & net margins
  const scanRatePerUnit = promotion?.scanDealRateAud ?? (baselinePrice * (discountDepth / 100) * 0.4); // typical supplier scan funding
  const netSupplierRevenuePerUnit = baselinePrice - scanRatePerUnit;
  const promoMarginPerUnit = netSupplierRevenuePerUnit - baselineCost;
  const promoTotalMarginAud = promoMarginPerUnit * promoUnits;
  const promoMarginPercent = promoRevenue > 0 ? (promoTotalMarginAud / (netSupplierRevenuePerUnit * promoUnits)) * 100 : 0;
  const incrementalProfitAud = promoTotalMarginAud - baselineMarginAud;

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-xs ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#13192a] border-slate-800 text-white'
    } ${className}`}>
      {/* HEADER WITH PRODUCT & BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              Promo Uplift Benchmark
            </span>
            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
              {product.sku}
            </span>
          </div>
          <h4 className="font-black text-sm text-slate-900 dark:text-white truncate max-w-md">
            {product.name}
          </h4>
        </div>

        {/* Uplift Summary Pill */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">Forecast Volume Lift</span>
            <span className="text-sm font-black font-mono text-emerald-500">
              +{unitUpliftPercent}% ({unitLiftMultiplier}x Multiplier)
            </span>
          </div>
        </div>
      </div>

      {/* SIDE-BY-SIDE COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* 1. NON-PROMO BASELINE */}
        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1422] border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Non-Promo Standard Week
            </span>
            <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
              Regular Shelf
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Shelf RRP:</span>
              <span className="font-mono font-bold">{formatPrice(baselinePrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Weekly Baseline Volume:</span>
              <span className="font-mono font-bold">{baselineUnits.toLocaleString()} units</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Weekly Revenue:</span>
              <span className="font-mono font-bold">{formatAud(baselineRevenue)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold">Gross Profit Margin:</span>
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                {formatAud(baselineMarginAud)} ({baselineMarginPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* 2. ON-PROMOTION ACTIVE PROGRAM */}
        <div className={`p-3.5 rounded-xl border relative overflow-hidden ${
          isLight ? 'bg-indigo-50/40 border-indigo-200' : 'bg-indigo-950/20 border-indigo-800/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                2. On-Promo Program
              </span>
              <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded">
                -{discountDepth}% OFF
              </span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
              +{unitUpliftAbsolute.toLocaleString()} extra units
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Promo Selling Price:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300">
                {formatPrice(promoPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Total Promo Demand:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {promoUnits.toLocaleString()} units
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Total Promo Revenue:</span>
              <span className="font-mono font-bold">{formatAud(promoRevenue)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-indigo-200 dark:border-indigo-800/50">
              <span className="text-slate-500 font-semibold">Net Promo Margin:</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                {formatAud(promoTotalMarginAud)} ({promoMarginPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARATIVE IMPACT BAR & ROI METRICS */}
      <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-[#0e1320] border-slate-800'
      }`}>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Incremental Revenue</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              +{formatAud(incrementalRevenue)}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Net Dollar Profit Lift</span>
            <span className={`font-mono font-bold ${incrementalProfitAud >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {incrementalProfitAud >= 0 ? '+' : ''}{formatAud(incrementalProfitAud)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Vendor scan funding: {formatPrice(scanRatePerUnit)}/unit to fund shelf promo</span>
        </div>
      </div>
    </div>
  );
};
