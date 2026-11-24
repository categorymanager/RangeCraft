import React, { useState, useMemo } from 'react';
import { Product, WeekPromotion, UserProfile, ThemeMode } from '../types';
import { formatAud, formatNumber, formatPercent } from '../utils/formatters';
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Layers, 
  Target, 
  Copy, 
  Check, 
  Download, 
  Sliders, 
  Percent, 
  ShieldCheck, 
  Building2, 
  ArrowRight,
  Plus,
  Trash2,
  Lock
} from 'lucide-react';
import { FrostedPaywallOverlay } from './FrostedPaywallOverlay';

interface BreakevenBasketPitchViewProps {
  products: Product[];
  promotions: WeekPromotion[];
  onUnlockExport?: (exportId: string, itemName: string, priceAud: number) => void;
  userProfile?: UserProfile | null;
  currentTheme?: ThemeMode;
}

export const BreakevenBasketPitchView: React.FC<BreakevenBasketPitchViewProps> = ({
  products,
  promotions,
  onUnlockExport,
  userProfile,
  currentTheme = 'light'
}) => {
  const [activeTab, setActiveTab] = useState<'breakeven' | 'basket' | 'pitch'>('breakeven');
  const [selectedSku, setSelectedSku] = useState<string>(products[0]?.sku || '');
  
  // Breakeven Simulator State
  const [discountPercent, setDiscountPercent] = useState<number>(25);
  const [supplierScanRebate, setSupplierScanRebate] = useState<number>(1.50);
  const [projectedLiftPercent, setProjectedLiftPercent] = useState<number>(120);

  // Basket Multiplier State
  const [basketSecondarySkus, setBasketSecondarySkus] = useState<string[]>(
    products.slice(1, 4).map(p => p.sku)
  );

  // Pitch Generator State
  const [targetBuyerAccount, setTargetBuyerAccount] = useState('National Supermarket Network (Tier-1)');
  const [pitchTheme, setPitchTheme] = useState('National Seasonal Promotional Showcase');
  const [isCopied, setIsCopied] = useState(false);

  const heroProduct = useMemo(() => {
    return products.find(p => p.sku === selectedSku) || products[0] || null;
  }, [products, selectedSku]);

  // Breakeven Math
  const breakevenMetrics = useMemo(() => {
    if (!heroProduct) {
      return {
        regularRrp: 0,
        promoRrp: 0,
        regularMarginDollars: 0,
        promoMarginDollars: 0,
        requiredBreakevenUnits: 0,
        requiredLiftPercent: 0,
        projectedUnits: 0,
        projectedRevenue: 0,
        projectedGrossProfit: 0,
        baselineGrossProfit: 0,
        netIncrementalProfit: 0,
        isProfitableLift: false
      };
    }

    const regularRrp = heroProduct.rrp;
    const unitCost = heroProduct.cost;
    const baselineUnits = heroProduct.weeklyUnitsBaseline || 50;

    const promoRrp = Number((regularRrp * (1 - discountPercent / 100)).toFixed(2));
    const regularMarginDollars = regularRrp - unitCost;
    
    // Promo margin = Promo RRP - (Cost - Vendor Scan Rebate)
    const effectiveCost = Math.max(0, unitCost - supplierScanRebate);
    const promoMarginDollars = Math.max(0.1, promoRrp - effectiveCost);

    const baselineGrossProfit = regularMarginDollars * baselineUnits;
    
    // Required units to match baseline gross profit: Baseline GP / Promo Margin Dollars
    const requiredBreakevenUnits = Math.ceil(baselineGrossProfit / promoMarginDollars);
    const requiredLiftPercent = Number((((requiredBreakevenUnits - baselineUnits) / baselineUnits) * 100).toFixed(1));

    // Simulated outcomes at selected projected lift
    const projectedUnits = Math.round(baselineUnits * (1 + projectedLiftPercent / 100));
    const projectedRevenue = projectedUnits * promoRrp;
    const projectedGrossProfit = projectedUnits * promoMarginDollars;
    const netIncrementalProfit = projectedGrossProfit - baselineGrossProfit;

    return {
      regularRrp,
      promoRrp,
      regularMarginDollars,
      promoMarginDollars,
      requiredBreakevenUnits,
      requiredLiftPercent,
      projectedUnits,
      projectedRevenue,
      projectedGrossProfit,
      baselineGrossProfit,
      netIncrementalProfit,
      isProfitableLift: netIncrementalProfit >= 0
    };
  }, [heroProduct, discountPercent, supplierScanRebate, projectedLiftPercent]);

  // Basket Multiplier Math
  const basketMetrics = useMemo(() => {
    if (!heroProduct) return { totalRrp: 0, totalCost: 0, basketMarginPercent: 0, attachedItems: [] };
    
    const attached = products.filter(p => basketSecondarySkus.includes(p.sku));
    const allItems = [heroProduct, ...attached];
    
    const totalRrp = allItems.reduce((acc, p) => acc + p.rrp, 0);
    const totalCost = allItems.reduce((acc, p) => acc + p.cost, 0);
    const basketMarginDollars = totalRrp - totalCost;
    const basketMarginPercent = totalRrp > 0 ? Number(((basketMarginDollars / totalRrp) * 100).toFixed(1)) : 0;

    return {
      totalRrp,
      totalCost,
      basketMarginDollars,
      basketMarginPercent,
      attachedItems: attached
    };
  }, [heroProduct, basketSecondarySkus, products]);

  // Generated Pitch Text
  const generatedPitchText = useMemo(() => {
    if (!heroProduct) return '';
    return `EXECUTIVE JOINT BUSINESS PLANNING (JBP) PROMOTIONAL PROPOSAL
Prepared for: ${targetBuyerAccount} Category Review Board
Campaign Theme: ${pitchTheme}
Featured Anchor SKU: [${heroProduct.sku}] ${heroProduct.name}

1. COMMERCIAL HIGHLIGHTS & MECHANIC
- Regular RRP: $${heroProduct.rrp.toFixed(2)} AUD
- Proposed Promotional RRP: $${breakevenMetrics.promoRrp.toFixed(2)} AUD (${discountPercent}% Off RRP)
- Vendor Scan Allowance: $${supplierScanRebate.toFixed(2)} AUD / unit support
- Projected Promotional Units: ${formatNumber(breakevenMetrics.projectedUnits)} units (+${projectedLiftPercent}% lift over baseline)
- Total Event Retail Dollar Sales: ${formatAud(breakevenMetrics.projectedRevenue)} AUD

2. RETAILER MARGIN & BASKET EXPANSION
- Retailer Event Gross Profit: ${formatAud(breakevenMetrics.projectedGrossProfit)} AUD (+${formatAud(Math.max(0, breakevenMetrics.netIncrementalProfit))} incremental profit)
- Cross-Merchandised Basket Size: ${basketMetrics.attachedItems.length + 1} SKUs totalling $${basketMetrics.totalRrp.toFixed(2)} RRP at ${basketMetrics.basketMarginPercent}% blended gross margin.

3. CUSTOM RULES & PROMOTIONAL INTEGRITY
- Confirmed 4-week regular pricing hiatus prior to promotional execution.
- Full POS in-store end-cap and digital app banner co-investment.`;
  }, [heroProduct, targetBuyerAccount, pitchTheme, breakevenMetrics, discountPercent, supplierScanRebate, projectedLiftPercent, basketMetrics]);

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(generatedPitchText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const isPro = userProfile?.subscriptionTier === 'pro_planner' || userProfile?.subscriptionTier === 'enterprise_tier';

  const handleUnlockPitch = () => {
    if (onUnlockExport) {
      onUnlockExport('pitch_deck_pptx', 'Retailer Buyer JBP Pitch Deck & Slide Briefing', 19);
    }
  };

  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm my-4 sm:my-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <Target className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Commercial Breakeven &amp; Pitch Studio</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your catalog is currently empty. Upload your SKU range or add products to simulate promotional breakeven lift, build cross-merchandised baskets, and generate buyer proposals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Week Studio &amp; Pitch Suite
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 whitespace-nowrap">
                  Trade Simulator
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Model breakeven volume lifts, engineer cross-merchandising baskets, and synthesize buyer pitch briefings.
              </p>
            </div>
          </div>

          {/* Sub-Tab Navigation Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('breakeven')}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'breakeven' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Breakeven Simulator
            </button>
            <button
              onClick={() => setActiveTab('basket')}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'basket' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Basket Builder
            </button>
            <button
              onClick={() => setActiveTab('pitch')}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'pitch' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Buyer Pitch Generator
            </button>
          </div>
        </div>

        {/* Anchor SKU Selector */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Anchor SKU:</span>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full sm:max-w-sm min-w-0 min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
            >
              {products.map((p, idx) => (
                <option key={`opt-anchor-${p.sku}-${idx}`} value={p.sku}>
                  [{p.sku}] {p.name} — RRP ${p.rrp.toFixed(2)} ({p.category})
                </option>
              ))}
            </select>
          </div>

          {heroProduct && (
            <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] tabular-nums">
              <span>RRP: <strong className="text-slate-800 dark:text-slate-200">${heroProduct.rrp.toFixed(2)}</strong></span>
              <span>COGS: <strong className="text-slate-800 dark:text-slate-200">${heroProduct.cost.toFixed(2)}</strong></span>
              <span>Rate: <strong className="text-slate-800 dark:text-slate-200">{heroProduct.weeklyUnitsBaseline} u/wk</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BREAKEVEN SIMULATOR TAB                                                */}
      {/* ========================================================================= */}
      {activeTab === 'breakeven' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 animate-fadeIn">
          {/* Left: Interactive Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Promotional Elasticity Inputs</span>
            </h3>

            {/* Discount Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Promotional Discount Depth:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm tabular-nums">{discountPercent}% OFF</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>5% (Light)</span>
                <span>25% (Standard)</span>
                <span>60% (Clearance)</span>
              </div>
            </div>

            {/* Vendor Scan Rebate */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Supplier Scan Rebate Allowance (AUD / unit):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={supplierScanRebate}
                  onChange={(e) => setSupplierScanRebate(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[42px] pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 tabular-nums"
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Direct trade spend rebate paid by supplier to protect retailer gross margin.</p>
            </div>

            {/* Projected Volume Lift Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Simulated Volume Lift (% over base):</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm tabular-nums">+{projectedLiftPercent}% Lift</span>
              </div>
              <input
                type="range"
                min="0"
                max="400"
                step="10"
                value={projectedLiftPercent}
                onChange={(e) => setProjectedLiftPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% (Base)</span>
                <span>+150% (Catalog)</span>
                <span>+400% (Front Page)</span>
              </div>
            </div>

            {/* Breakeven Threshold Callout Box */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-200">
                <span>Required Breakeven Lift:</span>
                <span className="text-sm font-black font-mono tabular-nums">+{breakevenMetrics.requiredLiftPercent}%</span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                To break even on gross profit dollars at {discountPercent}% off, sales must reach at least{' '}
                <strong>{breakevenMetrics.requiredBreakevenUnits} units/wk</strong> (vs {heroProduct?.weeklyUnitsBaseline} base units).
              </p>
            </div>
          </div>

          {/* Right: Live Breakeven Financial Model (7 Cols) */}
          <div className="lg:col-span-7 space-y-4 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Trade Financial Impact Comparison</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                breakevenMetrics.isProfitableLift 
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' 
                  : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
              }`}>
                {breakevenMetrics.isProfitableLift ? 'Profitable Lift Target' : 'Sub-Breakeven Warning'}
              </span>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs tabular-nums">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                  Baseline (Unpromoted Week)
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Retail Price:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">${breakevenMetrics.regularRrp.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Weekly Units:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{heroProduct?.weeklyUnitsBaseline} u</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Baseline Revenue:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatAud(breakevenMetrics.regularRrp * (heroProduct?.weeklyUnitsBaseline || 0))}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Gross Profit:</span>
                  <span className="text-emerald-700 dark:text-emerald-400">{formatAud(breakevenMetrics.baselineGrossProfit)}</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 ${
                breakevenMetrics.isProfitableLift 
                  ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' 
                  : 'bg-rose-50/50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
              }`}>
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                  Simulated Event (+{projectedLiftPercent}% Lift)
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Promo Selling Price:</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">${breakevenMetrics.promoRrp.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Projected Units:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatNumber(breakevenMetrics.projectedUnits)} u</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Promo Revenue:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatAud(breakevenMetrics.projectedRevenue)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Event Gross Profit:</span>
                  <span className={`font-mono text-sm ${breakevenMetrics.isProfitableLift ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {formatAud(breakevenMetrics.projectedGrossProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Incremental Profit Summary Banner */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              breakevenMetrics.isProfitableLift 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200' 
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <TrendingUp className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold block">
                    {breakevenMetrics.isProfitableLift ? 'Net Incremental Gross Profit Gain:' : 'Projected Profit Erosion Deficit:'}
                  </span>
                  <span className="text-[11px] opacity-80">
                    Calculated after scan rebates and promotional volume lift.
                  </span>
                </div>
              </div>
              <div className="font-black text-base font-mono tabular-nums whitespace-nowrap">
                {breakevenMetrics.isProfitableLift ? '+' : ''}{formatAud(breakevenMetrics.netIncrementalProfit)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CROSS-MERCH BASKET BUILDER TAB                                         */}
      {/* ========================================================================= */}
      {activeTab === 'basket' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 animate-fadeIn">
          {/* Left: Basket Item Selector (6 Cols) */}
          <div className="lg:col-span-6 space-y-4 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Select Cross-Merchandised Basket Attachments</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pair your featured anchor SKU with high-margin impulse items for in-store gondola and digital checkout cross-selling.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {products
                .filter(p => p.sku !== selectedSku)
                .map((p, idx) => {
                  const isSelected = basketSecondarySkus.includes(p.sku);
                  return (
                    <button
                      key={`basket-item-${p.sku}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setBasketSecondarySkus(basketSecondarySkus.filter(s => s !== p.sku));
                        } else {
                          setBasketSecondarySkus([...basketSecondarySkus, p.sku]);
                        }
                      }}
                      className={`w-full min-h-[48px] p-3 rounded-2xl text-left text-xs border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected 
                          ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-400/30' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          ${p.rrp.toFixed(2)} RRP · {p.marginPercent}% Margin · {p.category}
                        </div>
                      </div>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {isSelected ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right: Basket Multiplier Financial Scorecard (6 Cols) */}
          <div className="lg:col-span-6 space-y-4 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Combined Basket Economics</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
                {basketMetrics.attachedItems.length + 1} SKUs in Basket
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Total Basket RRP</span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">${basketMetrics.totalRrp.toFixed(2)} AUD</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">Blended Margin</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono">{basketMetrics.basketMarginPercent}%</span>
              </div>
            </div>

            {/* Included Items List */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-300">Basket Composition:</div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <span className="font-black text-indigo-700 dark:text-indigo-400 block truncate">[Anchor] {heroProduct?.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono tabular-nums">RRP ${heroProduct?.rrp.toFixed(2)} · {heroProduct?.marginPercent}% Margin</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 whitespace-nowrap shrink-0">Anchor</span>
              </div>

              {basketMetrics.attachedItems.map((item, idx) => (
                <div key={`attached-item-${item.sku}-${idx}`} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono tabular-nums">RRP ${item.rrp.toFixed(2)} · {item.marginPercent}% Margin</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 whitespace-nowrap shrink-0">Attachment</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BUYER PITCH GENERATOR TAB                                              */}
      {/* ========================================================================= */}
      {activeTab === 'pitch' && (
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Executive Retailer Buyer Pitch Memo</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pre-formatted commercial rationale ready to paste into buyer pitch decks or JBP submissions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleCopyPitch}
                className="min-h-[42px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                <span>{isCopied ? 'Copied!' : 'Copy Briefing'}</span>
              </button>

              <button
                onClick={handleUnlockPitch}
                className="min-h-[42px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Export Deck (.PPTX / PDF)</span>
              </button>
            </div>
          </div>

          {/* Config row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Retailer Account:</label>
              <select
                value={targetBuyerAccount}
                onChange={(e) => setTargetBuyerAccount(e.target.value)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="National Supermarket Network (Tier-1)">National Supermarket Network (Tier-1)</option>
                <option value="Major Grocery & Department Banner">Major Grocery &amp; Department Banner</option>
                <option value="Independent Retail & Wholesale Network">Independent Retail &amp; Wholesale Network</option>
                <option value="Specialty Liquor & Beverage Group">Specialty Liquor &amp; Beverage Group</option>
                <option value="Hardware, Trade & Outdoor Retail Chain">Hardware, Trade &amp; Outdoor Retail Chain</option>
                <option value="Health, Beauty & Pharmacy Network">Health, Beauty &amp; Pharmacy Network</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Pitch Campaign Headline:</label>
              <input
                type="text"
                value={pitchTheme}
                onChange={(e) => setPitchTheme(e.target.value)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Pitch Memo Content Card */}
          <div className="relative">
            <pre className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-200 dark:border-slate-800 shadow-inner">
              {generatedPitchText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
