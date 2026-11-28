import React, { useState } from 'react';
import { Product } from '../types';
import { 
  Sparkles, 
  PlusCircle, 
  FileSpreadsheet, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle, 
  X, 
  ChevronRight,
  Database,
  ArrowRight,
  Boxes,
  Store,
  Layers,
  Calculator
} from 'lucide-react';

interface OnboardingProductPromptProps {
  products: Product[];
  onOpenAddProductModal: () => void;
  onOpenCsvImportModal: () => void;
  onOpenAutoBuildModal: () => void;
  onLoadBenchmarkPortfolio: () => void;
  onNavigateTab: (tab: any) => void;
}

export const OnboardingProductPrompt: React.FC<OnboardingProductPromptProps> = ({
  products,
  onOpenAddProductModal,
  onOpenCsvImportModal,
  onOpenAutoBuildModal,
  onLoadBenchmarkPortfolio,
  onNavigateTab
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const hasProducts = products.length > 0;

  // Never collapse into a tiny bar while range is still empty
  if (isDismissed && hasProducts) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Database className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          <span>Active Product Catalog: <strong className="text-slate-900 dark:text-slate-200 tabular-nums">{products.length} SKUs loaded</strong></span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-medium">100% Calculated on Active Range Data</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenAddProductModal}
            className="min-h-[36px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add SKU</span>
          </button>
          <button
            onClick={() => setIsDismissed(false)}
            className="min-h-[36px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium cursor-pointer"
            title="Expand Onboarding Guide"
          >
            Show Guide
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-emerald-50/80 via-white to-blue-50/70 dark:from-[#101c2c] dark:via-[#111726] dark:to-[#0f172a] border border-emerald-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden animate-fadeIn">
        {/* Top vibrant gradient bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-[#2563EB] to-amber-500" />
        {/* Close / Minimize button (only when products exist) */}
        {hasProducts && (
          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Minimize onboarding prompt"
            className="absolute top-2.5 right-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-20"
            title="Minimize onboarding prompt"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 sm:gap-5 relative z-10 pt-1">
          {/* Left Column: Welcome & Value Proposition */}
          <div className="space-y-2 max-w-2xl pr-10 sm:pr-12">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Step 1 · Range &amp; Case Deal Setup
              </span>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="text-[11px] text-[#2563EB] dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>100% Mathematical Accuracy</span>
                <HelpCircle className="w-3 h-3 opacity-75" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Load Your Product Range to Unlock Automated 52-Week Schedule &amp; Profit Optimization
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Import your CSV range or add individual SKUs with optional brand/variant tags and promotional case deals ($ or %). Once loaded, customize your promotional rules or let RangeCraft auto-generate your highest-profit schedule.
            </p>

            {/* Micro badges highlighting categories supported (hidden on compact mobile) */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                <Store className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Brick &amp; Mortar Retail
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                <Boxes className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Brand &amp; Variant Clash Guard
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Optional Promo Gap Weeks
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Per-SKU Case Deals ($ / %)
              </span>
            </div>
          </div>

          {/* Right Column: Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-row items-stretch gap-2.5 flex-shrink-0">
            {/* Action 1: CSV Import (Focal Point) */}
            <button
              id="btn-onboarding-import-csv"
              onClick={onOpenCsvImportModal}
              className="min-h-[44px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-white/15 shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold truncate">
                    Import Range CSV
                  </div>
                  <div className="text-[11px] text-emerald-100 font-normal truncate">Instant bulk upload</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-100 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Action 2: Add Custom Product */}
            <button
              onClick={onOpenAddProductModal}
              className="min-h-[44px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-colors cursor-pointer text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-950">
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">Add Single SKU</span>
                </div>
                <div className="text-[10px] text-slate-900 font-medium truncate">Input RRP, COGS &amp; Case Deal</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-900 shrink-0" />
            </button>

            {/* Action 3: Auto-Build (Only active when products exist) */}
            {hasProducts && (
              <button
                onClick={onOpenAutoBuildModal}
                className="min-h-[44px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 font-bold text-xs transition-colors cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-slate-900 dark:text-white font-bold truncate">Auto-Build Promo Plan</div>
                    <div className="text-[10px] text-blue-700 dark:text-blue-300 font-normal truncate">Configure rules &amp; cadence</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Modal on Data Accuracy & Calculations */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[90] flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#111726] border-0 sm:border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-2xl max-w-lg w-full h-full sm:h-auto p-5 sm:p-6 flex flex-col justify-between sm:block space-y-4 shadow-2xl overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>100% Mathematical Calculation Rules</span>
                </h3>
                <button
                  onClick={() => setShowInfoModal(false)}
                  aria-label="Close calculation rules"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  RangeCraft calculates all commercial insights exclusively from verified formulas:
                </p>
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div>
                    <strong className="text-amber-600 dark:text-amber-400">1. Promotional Selling Price:</strong>
                    <div className="font-mono text-slate-800 dark:text-slate-300 mt-0.5">Promo RRP = Regular RRP × (1 - Discount %)</div>
                  </div>
                  <div>
                    <strong className="text-emerald-600 dark:text-emerald-400">2. Net Unit Margin ($ & %):</strong>
                    <div className="font-mono text-slate-800 dark:text-slate-300 mt-0.5">Unit Margin = Promo RRP - (Cost - Supplier Co-op Funding)</div>
                  </div>
                  <div>
                    <strong className="text-blue-600 dark:text-blue-400">3. Breakeven Volume Lift:</strong>
                    <div className="font-mono text-slate-800 dark:text-slate-300 mt-0.5">Breakeven Lift % = Discount % / (Baseline Margin % - Discount %) × 100</div>
                  </div>
                  <div>
                    <strong className="text-rose-600 dark:text-rose-400">4. Custom Rules 4-Week Hiatus Check:</strong>
                    <div className="text-slate-700 dark:text-slate-300 mt-0.5">Audits the 52-week calendar to ensure 4 non-promoted weeks precede and follow major discount windows.</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
