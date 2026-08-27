import React from 'react';
import { WeekPromotion, Product, ClashReport } from '../types';
import { 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  ArrowRight, 
  Zap, 
  RefreshCw, 
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface ClashAuditViewProps {
  promotions: WeekPromotion[];
  products: Product[];
  onOpenWeekStudio: (weekNum: number) => void;
  onAutoFixClashes: () => void;
}

export const ClashAuditView: React.FC<ClashAuditViewProps> = ({
  promotions,
  products,
  onOpenWeekStudio,
  onAutoFixClashes,
}) => {
  const [isReslotting, setIsReslotting] = React.useState(false);
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
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">ACCC Hiatus Breach (&lt;4 wks)</span>;
      case 'category_cannibalization':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Category Cannibalization</span>;
      case 'seasonality_mismatch':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Seasonality Misalignment</span>;
      case 'margin_dilution':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Margin Dilution &lt;20%</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Clash Detection & ACCC Compliance Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated compliance scanner ensuring category cannibalization prevention, ACCC genuine discount hiatus periods, and seasonal temperature fit.
          </p>
        </div>

        {allClashes.length > 0 ? (
          <button
            onClick={handleReslotClick}
            disabled={isReslotting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isReslotting ? 'animate-spin' : ''}`} />
            <span>{isReslotting ? 'Auto-Reslotting Calendar...' : 'Auto-Reslot & Fix All Clashes'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>100% Compliant & Clash Free</span>
          </div>
        )}
      </div>

      {/* Audit KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-xs text-slate-400">Total Audit Issues</div>
          <div className={`text-2xl font-black mt-1 ${allClashes.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {allClashes.length} {allClashes.length === 1 ? 'Issue' : 'Issues'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across 52-week calendar</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-xs text-slate-400">Critical ACCC / Hiatus Breaches</div>
          <div className={`text-2xl font-black mt-1 ${criticalClashes.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {criticalClashes.length} Critical
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Violates two-price advertising rule</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-xs text-slate-400">Category & Seasonality Warnings</div>
          <div className={`text-2xl font-black mt-1 ${warningClashes.length === 0 ? 'text-emerald-400' : 'text-blue-400'}`}>
            {warningClashes.length} Warnings
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Subcategory cannibalization or weather mismatch</div>
        </div>
      </div>

      {/* Compliance Rule Explanations Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Australian Retail Compliance Governance Rules Enforced</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-1">
            <strong className="text-amber-400 font-bold block">1. ACCC Hiatus Rule (4+ Weeks)</strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              SKUs cannot run back-to-back promotions within 4 weeks. Under Australian Consumer Law, continuous discounts can invalidate regular RRP claims.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-1">
            <strong className="text-blue-400 font-bold block">2. Category Cannibalization</strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Prevents featuring two direct competitor SKUs in the same subcategory in the same week, which dilutes promotional impact and buyer margin.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-1">
            <strong className="text-emerald-400 font-bold block">3. Australian Seasonal Temperature</strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enforces southern-hemisphere calendar alignment (Winter Warmers in June/July; BBQ, Firelighters & Beach Gear in Dec/Jan).
            </p>
          </div>
        </div>
      </div>

      {/* List of Detected Clashes */}
      {allClashes.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Active Audit Discrepancies ({allClashes.length})</h3>
            <span className="text-xs text-slate-400">Click "Configure Week" to adjust SKU slotting</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {allClashes.map((item, idx) => {
              const hero = productMap.get(item.promo.heroSku);

              return (
                <div key={idx} className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        Week {item.weekNum} ({item.promo.month})
                      </span>
                      {getClashTypeBadge(item.clash.type)}
                      {item.promo.australianEvent && (
                        <span className="text-[11px] text-slate-300">
                          🇦🇺 {item.promo.australianEvent}
                        </span>
                      )}
                    </div>

                    <div className="text-white font-medium">
                      <span className="text-slate-400 font-mono">[{item.promo.heroSku}]</span> {hero?.name}
                    </div>

                    <p className="text-slate-300 text-[11px] bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      {item.clash.message}
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenWeekStudio(item.weekNum)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 flex items-center gap-1.5 self-start md:self-center cursor-pointer whitespace-nowrap"
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
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Zero Clashes Detected!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your 52-week promotional plan satisfies all ACCC promotional hiatus periods, avoids subcategory cannibalization, and matches seasonal peaks.
          </p>
        </div>
      )}
    </div>
  );
};
