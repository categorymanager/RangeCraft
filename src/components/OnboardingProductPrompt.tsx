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

  // If user dismissed or already has plenty of custom-managed products and dismissed it
  if (isDismissed) {
    return (
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>Active Product Catalog: <strong className="text-slate-200">{products.length} SKUs loaded</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-medium">100% Calculated on Active Range Data</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddProductModal}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add SKU</span>
          </button>
          <button
            onClick={() => setIsDismissed(false)}
            className="text-slate-500 hover:text-slate-300 ml-2"
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
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden animate-fadeIn">
        {/* Glowing background accent */}
        <div className="absolute top-0 right-0 w-80 h-full bg-amber-500/5 blur-2xl pointer-events-none" />

        {/* Close / Minimize button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          title="Minimize onboarding prompt"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          {/* Left Column: Welcome & Value Proposition */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Quick Onboarding & Range Setup
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Mathematical Accuracy Guarantee
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Start by Adding Your Product Range for Accurate 52-Week Promotional Analysis
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              Planovate generates full 52-week retail promo calendars, gross margin waterfalls, breakeven volume lifts, and ACCC hiatus audits. To ensure all financial models and category ROI are <strong>100% grounded in accurate data</strong>, add or import your active product catalog:
            </p>

            {/* Micro badges highlighting categories supported */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1">
                <Store className="w-3 h-3 text-amber-400" /> Brick & Mortar Retail
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1">
                <Boxes className="w-3 h-3 text-blue-400" /> FMCG & Supermarkets
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-400" /> E-Commerce & Marketplaces
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-emerald-400" /> Scan Rebates & Margin Waterfalls
              </span>
            </div>
          </div>

          {/* Right Column: 3 Action Cards */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 flex-shrink-0">
            {/* Action 1: Add Custom Product */}
            <button
              onClick={onOpenAddProductModal}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer text-left"
            >
              <div>
                <div className="flex items-center gap-1.5 font-black text-slate-950">
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Single SKU</span>
                </div>
                <div className="text-[10px] text-slate-900 font-normal">Input RRP, COGS & Baseline</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-900" />
            </button>

            {/* Action 2: CSV Import (Focal Point) */}
            <button
              id="btn-onboarding-import-csv"
              onClick={onOpenCsvImportModal}
              className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black text-sm sm:text-base shadow-2xl shadow-emerald-600/45 ring-4 ring-emerald-400/90 hover:scale-[1.03] transition-all cursor-pointer text-left group animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-200 group-hover:rotate-12 transition-transform" />
                </div>
                <div>
                  <div className="text-white text-base font-black tracking-wide">
                    <span>Import Range CSV</span>
                  </div>
                  <div className="text-xs text-emerald-100 font-medium">Instant bulk upload & portfolio diagnostics</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1.5 transition-transform" />
            </button>

            {/* Action 3: Auto-Build (Secondary CTA) */}
            <button
              onClick={onOpenAutoBuildModal}
              className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-blue-950/40 hover:bg-blue-900/60 text-blue-200 border border-blue-800 hover:border-blue-600 font-bold text-sm transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-white font-bold">Auto-Build Promo Plan</div>
                  <div className="text-[11px] text-blue-300 font-normal">Generate 52-week calendar</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Action 3: Review / Explore Default Portfolio */}
            <button
              onClick={() => onNavigateTab('catalog')}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-all cursor-pointer text-left"
            >
              <div>
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Boxes className="w-4 h-4 text-amber-400" />
                  <span>View Catalog ({products.length})</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Edit active benchmark SKUs</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Modal on Data Accuracy & Calculations */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>100% Mathematical Calculation Rules</span>
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Planovate calculates all commercial insights exclusively from verified formulas:
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div>
                  <strong className="text-amber-400">1. Promotional Selling Price:</strong>
                  <div className="font-mono text-slate-300 mt-0.5">Promo RRP = Regular RRP × (1 - Discount %)</div>
                </div>
                <div>
                  <strong className="text-emerald-400">2. Net Unit Margin ($ & %):</strong>
                  <div className="font-mono text-slate-300 mt-0.5">Unit Margin = Promo RRP - (Cost - Supplier Co-op Funding)</div>
                </div>
                <div>
                  <strong className="text-blue-400">3. Breakeven Volume Lift:</strong>
                  <div className="font-mono text-slate-300 mt-0.5">Breakeven Lift % = Discount % / (Baseline Margin % - Discount %) × 100</div>
                </div>
                <div>
                  <strong className="text-rose-400">4. ACCC 4-Week Hiatus Check:</strong>
                  <div className="text-slate-300 mt-0.5">Audits the 52-week calendar to ensure 4 non-promoted weeks precede and follow major discount windows.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
