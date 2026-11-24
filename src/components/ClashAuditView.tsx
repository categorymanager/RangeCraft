import React from 'react';
import { AppTab, WeekPromotion, Product, ClashReport, ThemeMode } from '../types';
import { WorkspacePageHero } from './WorkspacePageHero';
import { 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  ArrowRight, 
  Zap, 
  RefreshCw, 
  SlidersHorizontal,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ClashAuditViewProps {
  promotions: WeekPromotion[];
  products: Product[];
  onOpenWeekStudio: (weekNum: number) => void;
  onAutoFixClashes: () => void;
  currentTheme?: ThemeMode | string;
  onSelectTab?: (tab: AppTab) => void;
}

export const ClashAuditView: React.FC<ClashAuditViewProps> = ({
  promotions,
  products,
  onOpenWeekStudio,
  onAutoFixClashes,
  currentTheme = 'light',
  onSelectTab,
}) => {
  const [isReslotting, setIsReslotting] = React.useState(false);
  const [showRulesOnMobile, setShowRulesOnMobile] = React.useState(false);
  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.sku, p));

  const handleReslotClick = () => {
    setIsReslotting(true);
    setTimeout(() => {
      onAutoFixClashes();
      setIsReslotting(false);
    }, 250);
  };

  // Collect all clashes across 52 weeks
  const allClashes: { weekNum: number; promo: WeekPromotion; clash: ClashReport }[] = [];
  promotions.forEach(promo => {
    promo.clashWarnings.forEach(clash => {
      allClashes.push({
        weekNum: promo.weekNumber,
        promo,
        clash,
      });
    });
  });

  const criticalClashes = allClashes.filter(c => c.clash.severity === 'critical');
  const warningClashes = allClashes.filter(c => c.clash.severity === 'warning');

  const getClashTypeBadge = (type: ClashReport['type']) => {
    switch (type) {
      case 'hiatus_breach':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 whitespace-nowrap">Custom Rule Hiatus Breach (&lt;4 wks)</span>;
      case 'category_cannibalization':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">Category Cannibalization</span>;
      case 'seasonality_mismatch':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 whitespace-nowrap">Seasonality Misalignment</span>;
      case 'margin_dilution':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 whitespace-nowrap">Margin Dilution &lt;20%</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Centered Funnel Tool Hero */}
      <WorkspacePageHero
        stepLabel="Step 3 of 5 · Compliance Radar"
        title="Compliance & Clash Audit"
        subtitle="Verify Custom Rules discount hiatus spacing, prevent subcategory cannibalization, and align seasonal campaigns."
        accent={allClashes.length > 0 ? 'rose' : 'emerald'}
        currentTheme={currentTheme}
        activeStep={3}
        onSelectTab={onSelectTab}
        FallbackIcon={allClashes.length > 0 ? AlertTriangle : ShieldCheck}
        actions={
          allClashes.length > 0 ? (
            <button
              type="button"
              onClick={handleReslotClick}
              disabled={isReslotting}
              className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isReslotting ? 'animate-spin' : ''}`} />
              <span>{isReslotting ? 'Auto-Reslotting Calendar...' : 'Auto-Reslot & Fix All Clashes'}</span>
            </button>
          ) : (
            <div className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% Compliant &amp; Clash Free</span>
            </div>
          )
        }
      />

      {/* High-Contrast Dark Telemetry Audit Band */}
      <div className="rounded-3xl bg-[#0F172A] border border-slate-800 text-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 tabular-nums">
          <div className="p-4 sm:p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Audit Issues</div>
            <div className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${allClashes.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {allClashes.length} {allClashes.length === 1 ? 'Issue' : 'Issues'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across 52-week calendar</div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Critical Custom Rules / Hiatus Breaches</div>
            <div className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${criticalClashes.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {criticalClashes.length} Critical
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Violates promotional hiatus spacing rule</div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Category &amp; Seasonality Warnings</div>
            <div className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${warningClashes.length === 0 ? 'text-emerald-400' : 'text-sky-400'}`}>
              {warningClashes.length} Warnings
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Subcategory cannibalization or seasonal mismatch</div>
          </div>
        </div>
      </div>

      {/* Compliance Rule Explanations Card (Collapsible on mobile so clash list sits higher) */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            <span>Australian Retail Governance Rules</span>
          </h3>
          <button
            type="button"
            onClick={() => setShowRulesOnMobile(prev => !prev)}
            className="md:hidden min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>{showRulesOnMobile ? 'Hide Rules' : 'View Rules (3)'}</span>
            {showRulesOnMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className={`${showRulesOnMobile ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-3 gap-3 text-xs`}>
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 space-y-1">
            <strong className="text-amber-600 dark:text-amber-400 font-bold block">1. Custom Rules Hiatus (4+ Weeks)</strong>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              SKUs cannot run back-to-back promotions within 4 weeks. Continuous discounting erodes regular RRP credibility and promotional margin.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 space-y-1">
            <strong className="text-blue-600 dark:text-blue-400 font-bold block">2. Category Cannibalization</strong>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Prevents featuring two direct competitor SKUs in the same subcategory in the same week, which dilutes promotional impact and buyer margin.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 space-y-1">
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold block">3. Australian Seasonal Temperature</strong>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Enforces southern-hemisphere calendar alignment (Winter Warmers in June/July; BBQ, Firelighters &amp; Beach Gear in Dec/Jan).
            </p>
          </div>
        </div>
      </div>

      {/* List of Detected Clashes */}
      {allClashes.length > 0 ? (
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Audit Discrepancies ({allClashes.length})</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Tap &quot;Configure Week&quot; to adjust SKU slotting</span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {allClashes.map((item, idx) => {
              const hero = productMap.get(item.promo.heroSku);

              return (
                <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 text-xs">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-slate-700 tabular-nums whitespace-nowrap">
                        Week {item.weekNum} ({item.promo.month})
                      </span>
                      {getClashTypeBadge(item.clash.type)}
                      {item.promo.australianEvent && (
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          {item.promo.australianEvent}
                        </span>
                      )}
                    </div>

                    <div className="text-slate-900 dark:text-white font-semibold break-words">
                      <span className="text-slate-500 dark:text-slate-400 font-mono">[{item.promo.heroSku}]</span> {hero?.name}
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-[11px] bg-slate-50 dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      {item.clash.message}
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenWeekStudio(item.weekNum)}
                    className="w-full md:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Configure Week {item.weekNum}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111726] border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero Clashes Detected!</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your 52-week promotional plan satisfies all Custom Rules hiatus periods, avoids subcategory cannibalization, and matches seasonal peaks.
          </p>
        </div>
      )}
    </div>
  );
};
