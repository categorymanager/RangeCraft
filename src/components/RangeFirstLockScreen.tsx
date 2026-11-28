import React from 'react';
import { AppTab, ThemeMode } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileSpreadsheet,
  Lock,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import rangeGateEditorialImg from '../assets/images/range_gate_editorial_1795833146894.jpg';

interface RangeFirstLockScreenProps {
  currentTheme: ThemeMode;
  targetTab?: AppTab;
  onGoToCatalog: () => void;
  onOpenUploadModal: () => void;
  onReturnOverview?: () => void;
}

const TAB_DESCRIPTIONS: Partial<Record<AppTab, string>> = {
  dashboard: 'Executive Dashboard & Profit Forecast',
  'promotion-builder': 'Guided Promotion Builder & Case Deal Engine',
  'commercial-insights': 'Commercial Margin Insights & Recovery Actions',
  calendar: '52-Week Promotional Calendar & Schedule Optimizer',
  'week-studio': 'Week Detail Studio & Scan Rebate Editor',
  analytics: 'Trade Spend & Dead-Net Margin Waterfall',
  clashes: 'Custom Rules, Hiatus & Clash Radar',
  'executive-briefing': 'Executive JBP Deck & Buyer Exports',
  crm: 'Partner CRM & Channel Trading Terms',
  wholesale: 'Wholesale Carton Orders Hub',
  'deletion-engine': 'SKU Deletion & Rationalisation Engine',
  'breakeven-basket': 'Breakeven Volume Lift & Basket Simulator',
  'market-intel': 'Category Market Intelligence',
  'commercial-journey': 'Commercial Strategy Funnel',
  directory: 'Workspace Hub Directory',
};

export const RangeFirstLockScreen: React.FC<RangeFirstLockScreenProps> = ({
  currentTheme,
  targetTab = 'dashboard',
  onGoToCatalog,
  onOpenUploadModal,
  onReturnOverview,
}) => {
  const isLight = currentTheme.includes('light');
  const blockedFeatureName = TAB_DESCRIPTIONS[targetTab] || 'Workspace Planning Tools';

  return (
    <section
      id="range-first-lock-screen"
      className={`rounded-3xl border overflow-hidden shadow-lg transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#111726] border-slate-800 text-slate-100'
      }`}
    >
      {/* Top vibrant gradient accent strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-[#2563EB] to-amber-500" />

      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Editorial Graphic Panel */}
        <div className="lg:col-span-5 relative min-h-[240px] sm:min-h-[300px] overflow-hidden bg-slate-900">
          <img
            src={rangeGateEditorialImg}
            alt="Retail merchandise range preparation before promotional planning"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/20" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 space-y-2.5 text-white">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[11px] font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Step 1 Required Before Planning</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">
              Your commercial math starts with your actual product range.
            </h2>
            <p className="text-xs text-slate-200/90 leading-relaxed">
              Every 52-week schedule, clash rule, case deal, and profit projection is calculated directly from your real SKUs.
            </p>
          </div>
        </div>

        {/* Action & Workflow Unlock Panel */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                  isLight
                    ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                    : 'bg-blue-950/60 text-blue-300 border border-blue-800/80'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlocking: {blockedFeatureName}</span>
              </span>

              {onReturnOverview && (
                <button
                  type="button"
                  onClick={onReturnOverview}
                  className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                    isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Upload or Add Your Product Range First
              </h1>
              <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Import a CSV range or add at least one SKU manually (RRP, COGS, weekly baseline, optional brand/variant &amp; case deal). Once loaded, all planning, rules, and profit analytics unlock immediately.
              </p>
            </div>

            {/* What Unlocks Next */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div
                className={`p-3.5 rounded-2xl border space-y-1.5 ${
                  isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/25 border-emerald-900/60'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span>1. Custom Rules &amp; Cadence</span>
                </div>
                <p className={`text-[11px] leading-snug ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Weekly or spaced promo weeks, category/brand clash guards, or AI prompt rules.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border space-y-1.5 ${
                  isLight ? 'bg-blue-50/60 border-blue-200' : 'bg-blue-950/25 border-blue-900/60'
                }`}
              >
                <div className="flex items-center gap-2 text-[#2563EB] dark:text-blue-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>2. Auto-Optimal Defaults</span>
                </div>
                <p className={`text-[11px] leading-snug ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Leave rules blank to auto-generate the highest-profit, clash-free 52-week plan.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border space-y-1.5 ${
                  isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/25 border-amber-900/60'
                }`}
              >
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>3. Case Deals &amp; Profit</span>
                </div>
                <p className={`text-[11px] leading-snug ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Apply $ or % promotional case deals per SKU to lift dead-net margins.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="lockscreen-upload-csv-btn"
              type="button"
              onClick={onOpenUploadModal}
              className="min-h-[46px] px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Upload CSV Range</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              id="lockscreen-add-sku-btn"
              type="button"
              onClick={onGoToCatalog}
              className="min-h-[46px] px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Open Catalog &amp; Add Single SKU</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
