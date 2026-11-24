import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  RotateCcw, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  DollarSign, 
  Calendar, 
  Layers, 
  Check, 
  AlertCircle, 
  Clock, 
  ArrowUpRight,
  Split,
  Package,
  ShoppingBag,
  Percent,
  Tag
} from 'lucide-react';
import { AppTab, ThemeMode, UserProfile } from '../types';
import { useActiveCurrency } from '../utils/currency';
import { canClaimFreeTrial, hasActivePaidSubscription } from '../utils/entitlements';

interface PromoReslotterSandboxProps {
  currentTheme: ThemeMode;
  userProfile?: UserProfile | null;
  onOpenPricingModal: () => void;
  onNavigateTab: (tab: AppTab) => void;
}

type PromoStrategyType = 'tpr' | 'multibuy' | 'catalogue';

export const PromoReslotterSandbox: React.FC<PromoReslotterSandboxProps> = ({
  currentTheme,
  userProfile,
  onOpenPricingModal,
  onNavigateTab,
}) => {
  const isLight = currentTheme.includes('light');
  const { currency, format } = useActiveCurrency();
  const trialEligible = canClaimFreeTrial(userProfile);
  const isPaidActive = hasActivePaidSubscription(userProfile);

  const [isOptimized, setIsOptimized] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [activeStrategy, setActiveStrategy] = useState<PromoStrategyType>('tpr');

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setIsOptimized(true);
    }, 850);
  };

  const handleReset = () => {
    setIsOptimized(false);
    setIsOptimizing(false);
  };

  // Strategy specific configurations
  const STRATEGY_DATA = {
    tpr: {
      label: 'Temporary Price Reduction (TPR)',
      desc: '30% Off National Feature with Volume Scan Rebate Protection',
      corePromo: '30% Off TPR',
      variantPromoBefore: '35% Off Clash',
      variantPromoAfter: '25% Off Feature',
      netMarginGain: '+18.6%',
      profitLift: 16450,
      rebateFunding: '8.5% Co-Invested',
    },
    multibuy: {
      label: 'Multi-Buy Basket Driver',
      desc: '2 for $12 Bundle Mechanics across Complementary Subcategory SKUs',
      corePromo: '2 for $12 Bundle',
      variantPromoBefore: '2 for $10 Clash',
      variantPromoAfter: '2 for $12 Safe Slot',
      netMarginGain: '+21.4%',
      profitLift: 19800,
      rebateFunding: 'Fully Funded',
    },
    catalogue: {
      label: 'Co-Funded Front-Page Feature',
      desc: 'Front-Page Banner Feature with 4-Week Post-Promo Hiatus Guarantee',
      corePromo: 'Catalogue Feature',
      variantPromoBefore: 'Off-Location Clash',
      variantPromoAfter: 'Gondola End W8',
      netMarginGain: '+23.8%',
      profitLift: 22600,
      rebateFunding: 'Tier-1 Co-Funded',
    }
  };

  const currentStrat = STRATEGY_DATA[activeStrategy];

  return (
    <section 
      id="roi-demonstrator-section"
      className={`py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y transition-colors duration-300 relative overflow-hidden ${
        isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#0a0f1d] border-[#182338]'
      }`}
    >
      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[550px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive 1-Click Promo Reslotter</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Flawed Excel Plan vs RangeCraft Auto-Fix
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            Retail category managers enforce strict mandatory hiatus intervals and variant spacing. See how RangeCraft eliminates subcategory cannibalization, resolves trade compliance conflicts, and reclaims lost scan margin in one click.
          </p>

          {/* Interactive Promo Strategy Selector Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            {(['tpr', 'multibuy', 'catalogue'] as const).map((stratKey) => {
              const isSelected = activeStrategy === stratKey;
              return (
                <button
                  key={stratKey}
                  onClick={() => {
                    setActiveStrategy(stratKey);
                    setIsOptimized(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                      : isLight
                        ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {stratKey === 'tpr' && <Percent className="w-3.5 h-3.5" />}
                  {stratKey === 'multibuy' && <ShoppingBag className="w-3.5 h-3.5" />}
                  {stratKey === 'catalogue' && <Tag className="w-3.5 h-3.5" />}
                  <span>{STRATEGY_DATA[stratKey].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABLET DEVICE MOCKUP CONTAINER (CONCEPT 2 INTERACTIVE 1-CLICK PROMO RESLOTTER) */}
        {/* ========================================================================= */}
        <div className="max-w-4xl mx-auto">
          {/* Tablet Outer Bezel */}
          <div className={`p-3 sm:p-5 md:p-6 rounded-[2.5rem] border-2 shadow-2xl transition-all duration-300 relative ${
            isLight 
              ? 'bg-slate-900/95 border-slate-700 shadow-slate-300/60' 
              : 'bg-[#0f1422] border-slate-700/80 shadow-black/80'
          }`}>
            
            {/* Tablet Camera Dot */}
            <div className="flex justify-center mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700/80" />
            </div>

            {/* Tablet Screen Canvas */}
            <div className={`p-4 sm:p-6 md:p-8 rounded-[1.8rem] border transition-all duration-300 space-y-6 ${
              isLight ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-[#0d121f] text-slate-100 border-slate-800/90'
            }`}>

              {/* Tablet App Top Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                    RC
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                      <span>8 Week Promotional Calendar</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        isOptimized 
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                          : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                      }`}>
                        {isOptimized ? '100% Compliant & Harmonized' : '2 Critical Red Flags'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Subcategory Variant Cannibalization & Mandatory Hiatus Balancer
                    </p>
                  </div>
                </div>

                {/* Status Switcher & Replay */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isOptimized ? (
                    <button
                      onClick={handleReset}
                      className="min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Reset back to flawed spreadsheet plan"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Replay Comparison</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-rose-400 bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-800/50 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Trade Conflicts Detected
                    </span>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* TOP SWIMLANE: FLAWED SPREADSHEET PLAN (BEFORE STATE)                      */}
              {/* ========================================================================= */}
              <div className={`p-4 sm:p-6 rounded-3xl border transition-all duration-300 relative backdrop-blur-xl ${
                isOptimized 
                  ? 'bg-slate-900/30 border-slate-800/40 opacity-40 grayscale-[20%]' 
                  : 'bg-gradient-to-b from-slate-900/90 to-slate-950/95 border-amber-500/30 shadow-xl shadow-amber-950/10'
              }`}>
                
                {/* Flawed Plan Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 text-xs">
                  <div className="flex items-center gap-2.5 font-bold text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                    <span className="tracking-wide uppercase text-[11px] font-extrabold text-amber-400">Before: Unsynchronized Spreadsheet Plan</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <span className="text-slate-400">Net Scan Margin:</span>
                    <span className="bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-400 font-black tabular-nums">
                      -4.2% Deficit
                    </span>
                  </div>
                </div>

                {/* 8-Week Multi-Swimlane Grid */}
                <div className="overflow-x-auto pb-1">
                <div className="space-y-2.5 min-w-[560px]">
                  {/* Timeline Week Numbers Header */}
                  <div className="grid grid-cols-9 gap-2 text-center text-xs">
                    <div className="text-[10px] sm:text-xs font-mono font-bold text-slate-400 text-left pl-1">Channel / SKU</div>
                    {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'].map((w, idx) => (
                      <div key={w} className={`text-[10px] sm:text-xs font-mono font-semibold pb-1 ${
                        idx === 3 || idx === 5 ? 'text-amber-400 font-bold' : 'text-slate-400'
                      }`}>
                        {w}
                      </div>
                    ))}
                  </div>

                  {/* Swimlane 1: Core Line (Account Alpha) */}
                  <div className="grid grid-cols-9 gap-2 items-center text-center text-xs">
                    <div className="text-[10px] font-bold text-slate-300 text-left pl-1 truncate" title="Core Line (Original 330ml)">
                      <span className="block text-slate-100 font-bold">Core Line</span>
                      <span className="text-[9px] text-slate-400 font-normal">Account A</span>
                    </div>

                    {/* W1 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-200 shadow-xs">
                      <span className="font-bold text-indigo-300">15% Off</span>
                      <span className="text-[8px] text-slate-400">TPR</span>
                    </div>
                    {/* W2 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                      <span className="text-slate-500 font-medium">Base</span>
                    </div>
                    {/* W3 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                      <span className="text-slate-500 font-medium">Base</span>
                    </div>
                    {/* W4 - Core Line Promo */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-gradient-to-b from-indigo-950/80 to-slate-900 border-2 border-indigo-500/70 flex flex-col justify-center items-center p-1 text-[9px] text-indigo-200 relative shadow-md shadow-indigo-950/30">
                      <span className="font-black text-white">{currentStrat.corePromo}</span>
                      <span className="text-[8px] text-indigo-300">Account A</span>
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[8px] font-black flex items-center justify-center">!</span>
                    </div>
                    {/* W5 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[8px] text-slate-500">
                      <span className="text-slate-500 font-medium">Base</span>
                    </div>
                    {/* W6 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[8px] text-slate-500">
                      <span className="text-slate-500 font-medium">Base</span>
                    </div>
                    {/* W7 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                      <span className="text-slate-500 font-medium">Base</span>
                    </div>
                    {/* W8 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-600">
                      <span className="text-slate-600">Open</span>
                    </div>
                  </div>

                  {/* Swimlane 2: Variant Line (Account Beta) */}
                  <div className="grid grid-cols-9 gap-2 items-center text-center text-xs">
                    <div className="text-[10px] font-bold text-slate-300 text-left pl-1 truncate" title="Variant Line (Flavour 330ml)">
                      <span className="block text-slate-100 font-bold">Variant Line</span>
                      <span className="text-[9px] text-slate-400 font-normal">Account B</span>
                    </div>

                    {/* W1 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                      <span className="text-slate-500 font-medium">Base</span>
                    </div>
                    {/* W2 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                      <span className="text-slate-500 font-medium">Base</span>
                    </div>
                    {/* W3 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                      <span className="text-slate-500 font-medium">Base</span>
                    </div>
                    {/* W4 - Gap / Cannibalized */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-amber-950/30 border border-amber-600/40 flex flex-col justify-center items-center p-1 text-[8px] text-amber-300">
                      <span className="font-mono font-bold text-amber-400">Cannibalized</span>
                      <span className="text-[7px] text-amber-300/80">-$4.2k Vol</span>
                    </div>
                    {/* W5 - Hiatus Gap (Only 1 week buffer!) */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-amber-950/20 border border-amber-600/30 flex flex-col justify-center items-center p-1 text-[8px] text-amber-300/80">
                      <span className="font-mono font-bold">1W Gap</span>
                      <span className="text-[7px] text-amber-400">Breach</span>
                    </div>
                    {/* W6 - Conflicting Variant Promo (CLASH with Core W4) */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-gradient-to-b from-amber-950/90 to-rose-950/90 border-2 border-amber-500 flex flex-col justify-center items-center p-1 text-[9px] text-amber-100 relative shadow-lg shadow-amber-950/50">
                      <span className="font-black text-white">{currentStrat.variantPromoBefore}</span>
                      <span className="text-[8px] text-amber-300">Account B</span>
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[8px] font-black flex items-center justify-center">!</span>
                    </div>
                    {/* W7 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                      <span className="text-slate-500 font-medium">Base</span>
                    </div>
                    {/* W8 */}
                    <div className="h-12 sm:h-14 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-600">
                      <span className="text-slate-600">Open</span>
                    </div>
                  </div>
                </div>
                </div>

                {/* Two Explicit Callout Flags (Modern Amber/Slate Styling) */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Flag 1: Subcategory Variant Clash & Hiatus Breach */}
                  <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3 text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-100 leading-tight">
                        Subcategory Variant Clash & Hiatus Violation (W4 vs W6)
                      </div>
                      <div className="text-[10px] text-amber-300/80 mt-0.5">
                        Promoting competing variants 1 week apart cannibalizes baseline volume and breaches standard trade hiatus rules.
                      </div>
                    </div>
                  </div>

                  {/* Flag 2: Negative Net Scan Margin */}
                  <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3 text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-100 leading-tight">
                        Unfunded Trade Margin Leakage (-4.2% Deficit)
                      </div>
                      <div className="text-[10px] text-rose-300/80 mt-0.5">
                        Unbalanced promotional scan rebates create compounding trade spend losses on volume lifts.
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* INTERACTIVE ACTION BUTTON (CENTER CONTROLLER)                             */}
              {/* ========================================================================= */}
              <div className="py-2 flex flex-col items-center justify-center gap-2">
                {!isOptimized ? (
                  <motion.button
                    id="btn-run-rangecraft-autofix"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRunOptimizer}
                    disabled={isOptimizing}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-600/40 border border-indigo-400/30 flex items-center justify-center gap-3 cursor-pointer transition-all"
                  >
                    {isOptimizing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Harmonizing Swimlanes & Balancing Scan Rebates...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 text-amber-300 shrink-0" />
                        <span>Run 1-Click RangeCraft Auto-Optimize</span>
                        <Sparkles className="w-4 h-4 text-indigo-200 shrink-0" />
                      </>
                    )}
                  </motion.button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Variant Conflict Resolved & Margin Rebalanced</span>
                    </div>
                    <button
                      onClick={handleReset}
                      className="min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Replay Simulation</span>
                    </button>
                  </div>
                )}
                <div className="text-[11px] text-slate-400 text-center">
                  {!isOptimized 
                    ? 'Click to see RangeCraft automatically enforce the 4-week hiatus, eliminate variant cannibalization, and fund scan rebates.' 
                    : 'Variant Line successfully reslotted from Week 6 to Week 8. Full 4-week hiatus buffer restored.'}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* BOTTOM SWIMLANE: RANGECRAFT OPTIMIZED RESULT (AFTER STATE)                */}
              {/* ========================================================================= */}
              <AnimatePresence mode="wait">
                {isOptimized && (
                  <motion.div
                    key="optimized-result-card"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="p-4 sm:p-5 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/60 shadow-xl shadow-emerald-950/40 relative space-y-3.5"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-sm font-black text-emerald-400">Result: 100% Compliant & Harmonized Swimlanes</span>
                      </div>
                      
                      {/* Green Flipped Margin Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-mono text-xs font-semibold">Net Realized Margin:</span>
                        <div className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black font-mono text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1 tabular-nums">
                          <TrendingUp className="w-3.5 h-3.5 text-slate-950" />
                          <span>{currentStrat.netMarginGain} Net Margin Gain</span>
                        </div>
                      </div>
                    </div>

                    {/* Harmonized 8-Week Multi-Swimlane Grid */}
                    <div className="overflow-x-auto pb-1">
                    <div className="space-y-2 min-w-[560px]">
                      {/* Timeline Week Numbers Header */}
                      <div className="grid grid-cols-9 gap-1.5 sm:gap-2 text-center text-xs">
                        <div className="text-[10px] sm:text-xs font-mono font-bold text-slate-400 text-left pl-1">Channel / SKU</div>
                        {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'].map((w, idx) => (
                          <div key={w} className={`text-[10px] sm:text-xs font-mono font-medium pb-1 ${
                            idx === 3 || idx === 7 ? 'text-emerald-400 font-bold' : 'text-slate-400'
                          }`}>
                            {w}
                          </div>
                        ))}
                      </div>

                      {/* Swimlane 1: Core Line (Account A) */}
                      <div className="grid grid-cols-9 gap-1.5 sm:gap-2 items-center text-center text-xs">
                        <div className="text-[10px] font-bold text-slate-300 text-left pl-1 truncate">
                          <span className="block text-emerald-300 font-bold">Core Line</span>
                          <span className="text-[9px] text-slate-400 font-normal">Account A</span>
                        </div>

                        {/* W1 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-center items-center p-1 text-[9px] text-slate-300">
                          <span className="font-bold">15% Off</span>
                          <span className="text-[8px] text-slate-400">TPR</span>
                        </div>
                        {/* W2 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                          <span>Base</span>
                        </div>
                        {/* W3 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                          <span>Base</span>
                        </div>
                        {/* W4 - Approved Core Promo */}
                        <div className="h-12 sm:h-14 rounded-xl bg-emerald-950/60 border-2 border-emerald-500/70 flex flex-col justify-center items-center p-1 text-[9px] text-emerald-200 shadow-sm">
                          <span className="font-black text-white">{currentStrat.corePromo}</span>
                          <span className="text-[8px] text-emerald-400 font-mono">Approved</span>
                        </div>
                        {/* W5 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[8px] text-slate-400">
                          <span>Base</span>
                        </div>
                        {/* W6 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[8px] text-slate-400">
                          <span>Base</span>
                        </div>
                        {/* W7 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-400">
                          <span>Base</span>
                        </div>
                        {/* W8 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-400">
                          <span>Base</span>
                        </div>
                      </div>

                      {/* Swimlane 2: Variant Line (Account B) - Harmonized & Reslotted */}
                      <div className="grid grid-cols-9 gap-1.5 sm:gap-2 items-center text-center text-xs">
                        <div className="text-[10px] font-bold text-slate-300 text-left pl-1 truncate">
                          <span className="block text-emerald-300 font-bold">Variant Line</span>
                          <span className="text-[9px] text-slate-400 font-normal">Account B</span>
                        </div>

                        {/* W1 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                          <span>Base</span>
                        </div>
                        {/* W2 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                          <span>Base</span>
                        </div>
                        {/* W3 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[9px] text-slate-500">
                          <span>Base</span>
                        </div>
                        {/* W4 - Baseline Protected */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[8px] text-slate-300">
                          <span className="font-mono text-emerald-400">Protected</span>
                          <span className="text-[7px] text-slate-400">Full Price</span>
                        </div>
                        {/* W5 - Hiatus 1 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[8px] text-slate-400">
                          <span className="font-mono text-emerald-400">Hiatus 1</span>
                        </div>
                        {/* W6 - Hiatus 2 (Resolved Clash!) */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/70 border border-emerald-900/50 flex flex-col justify-center items-center p-1 text-[8px] text-emerald-300">
                          <span className="font-mono text-emerald-400">Hiatus 2</span>
                          <span className="text-[7px] text-emerald-400 font-bold">Cleared</span>
                        </div>
                        {/* W7 - Hiatus 3 */}
                        <div className="h-12 sm:h-14 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-center items-center p-1 text-[8px] text-slate-400">
                          <span className="font-mono text-emerald-400">Hiatus 3</span>
                        </div>
                        {/* W8 - AUTO-RESLOTTED VARIANT PROMO (Clean 4-Week Hiatus Respected) */}
                        <motion.div 
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.15, type: 'spring' }}
                          className="h-12 sm:h-14 rounded-xl bg-gradient-to-b from-emerald-600 to-teal-700 border-2 border-emerald-400 flex flex-col justify-center items-center p-1 text-[9px] text-white shadow-lg shadow-emerald-500/30 relative"
                        >
                          <span className="font-black text-white">{currentStrat.variantPromoAfter}</span>
                          <span className="text-[8px] text-emerald-100 font-mono">Reslotted W8</span>
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 text-[8px] font-black flex items-center justify-center">
                            ✓
                          </span>
                        </motion.div>
                      </div>
                    </div>
                    </div>

                    {/* Result Summary Callouts */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 flex items-center gap-2 text-emerald-200">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white leading-tight">Trade Hiatus Enforced</div>
                          <div className="text-[10px] text-emerald-300/80">4-week separation between brand runs</div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 flex items-center gap-2 text-emerald-200">
                        <Split className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white leading-tight">Zero Variant Cannibalization</div>
                          <div className="text-[10px] text-emerald-300/80">Full price volume retained in W4</div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 flex items-center gap-2 text-emerald-200">
                        <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white leading-tight">+{format(currentStrat.profitLift)} Net Profit</div>
                          <div className="text-[10px] text-emerald-300/80">{currentStrat.rebateFunding}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HIGH-CONVERSION CTA FOOTER STRIP                                          */}
        {/* ========================================================================= */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
        }`}>
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-black tracking-tight">
              Ready to Audit Your Brand's Full 52-Week Multi-Channel Plan?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              {trialEligible
                ? 'Upload your SKU catalog or test with our pre-built FMCG category templates. Full 14-day Pro access with no credit card required.'
                : 'Upload your SKU catalog or test with our pre-built FMCG category templates across all 52 weeks.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={isPaidActive ? () => onNavigateTab('billing') : onOpenPricingModal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>
                {isPaidActive
                  ? 'Manage Billing & Plan'
                  : trialEligible
                  ? 'Start 14-Day Free Pro Trial'
                  : 'Upgrade Commercial Plan'}
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('calendar')}
              className={`w-full sm:w-auto px-5 py-3.5 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Open 52-Week Planner</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
