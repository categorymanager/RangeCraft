import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { formatAud, formatNumber } from '../utils/formatters';
import { Calculator, DollarSign, Percent, TrendingUp, Zap, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface SkuProfitabilityCalculatorProps {
  products: Product[];
  currentTheme: string;
}

export const SkuProfitabilityCalculator: React.FC<SkuProfitabilityCalculatorProps> = ({
  products,
  currentTheme,
}) => {
  const [selectedSkuCode, setSelectedSkuCode] = useState<string>(products[0]?.sku || '');
  const [customRrp, setCustomRrp] = useState<string>(products[0]?.rrp.toString() || '49.99');
  const [customCost, setCustomCost] = useState<string>(products[0]?.cost.toString() || '22.00');
  const [discountPercent, setDiscountPercent] = useState<number>(25); // e.g., 25% off
  const [baselineWeeklyUnits, setBaselineWeeklyUnits] = useState<string>(products[0]?.weeklyUnitsBaseline.toString() || '120');
  const [promoDurationWeeks, setPromoDurationWeeks] = useState<number>(2);
  const [supplierCoOpRebate, setSupplierCoOpRebate] = useState<number>(5.0); // $5/unit or % rebate
  const [elasticityFactor, setElasticityFactor] = useState<number>(2.2);
  const [savedScenario, setSavedScenario] = useState<any | null>(null);

  // Sync state when selected SKU changes
  const handleSelectSku = (sku: string) => {
    setSelectedSkuCode(sku);
    const found = products.find(p => p.sku === sku);
    if (found) {
      setCustomRrp(found.rrp.toString());
      setCustomCost(found.cost.toString());
      setBaselineWeeklyUnits(found.weeklyUnitsBaseline.toString());
      setElasticityFactor(2.2); // Reset to default
      setSavedScenario(null); // Clear comparison
    }
  };

  const handleSaveScenario = () => {
    setSavedScenario({
      rrp: customRrp,
      cost: customCost,
      discount: discountPercent,
      baseline: baselineWeeklyUnits,
      duration: promoDurationWeeks,
      rebate: supplierCoOpRebate,
      elasticity: elasticityFactor,
      calculations: { ...calculations }
    });
  };

  const calculations = useMemo(() => {
    const rrp = parseFloat(customRrp) || 30.00;
    const cost = parseFloat(customCost) || 12.00;
    const baselineUnits = parseInt(baselineWeeklyUnits) || 100;
    
    // Promo RRP after discount
    const discountMultiplier = (100 - discountPercent) / 100;
    const promoRrp = Number((rrp * discountMultiplier).toFixed(2));

    // Baseline financials per unit
    const baselineGrossProfit = rrp - cost;
    const baselineMarginPct = rrp > 0 ? (baselineGrossProfit / rrp) * 100 : 0;
    const baselineTotalRevWeekly = rrp * baselineUnits;
    const baselineTotalGpWeekly = baselineGrossProfit * baselineUnits;

    // Promotional financials per unit
    const promoGrossProfit = promoRrp - cost;
    const promoMarginPct = promoRrp > 0 ? (promoGrossProfit / promoRrp) * 100 : 0;

    // Price elasticity volume lift estimation (Standard retail elasticity ~2.5x for 25% discount)
    const priceCutPct = discountPercent;
    const estimatedVolumeLiftPct = Math.round(priceCutPct * elasticityFactor);
    const promoWeeklyUnits = Math.round(baselineUnits * (1 + (estimatedVolumeLiftPct / 100)));

    const promoTotalRevWeekly = promoRrp * promoWeeklyUnits;
    const netUnitContribution = promoGrossProfit + supplierCoOpRebate;
    const totalWeeklyGpWithRebate = (netUnitContribution * promoWeeklyUnits);

    // Incremental profit over baseline
    const incrementalWeeklyGp = totalWeeklyGpWithRebate - baselineTotalGpWeekly;
    const totalPromoDurationRev = promoTotalRevWeekly * promoDurationWeeks;
    const totalPromoDurationGp = totalWeeklyGpWithRebate * promoDurationWeeks;
    
    // ROI on promotion (Incremental GP / Total baseline GP during same period)
    const baselinePeriodGp = baselineTotalGpWeekly * promoDurationWeeks;
    const promoRoiPercent = baselinePeriodGp > 0 ? ((totalPromoDurationGp - baselinePeriodGp) / baselinePeriodGp) * 100 : 0;

    // Breakeven units required to match baseline GP dollars
    const breakevenUnits = promoGrossProfit > 0 ? Math.ceil(baselineTotalGpWeekly / promoGrossProfit) : baselineUnits;
    const isProfitableLift = promoWeeklyUnits >= breakevenUnits;

    return {
      rrp,
      cost,
      promoRrp,
      baselineGrossProfit,
      baselineMarginPct,
      promoGrossProfit,
      promoMarginPct,
      estimatedVolumeLiftPct,
      promoWeeklyUnits,
      netUnitContribution,
      totalWeeklyGpWithRebate,
      incrementalWeeklyGp,
      totalPromoDurationRev,
      totalPromoDurationGp,
      promoRoiPercent,
      breakevenUnits,
      isProfitableLift,
      baselineUnits,
    };
  }, [customRrp, customCost, discountPercent, baselineWeeklyUnits, promoDurationWeeks, supplierCoOpRebate, elasticityFactor]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                SKU Profitability & Unit Economics Calculator
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Live Margin & ROI Simulator
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Model wholesale costs, promotional discount depth, supplier co-op rebates, and volume lift elasticity to instantly project net contribution and ROI.
              </p>
            </div>
          </div>
        </div>

        {/* SKU Selector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium pl-1">Load Catalog SKU:</span>
          <select
            value={selectedSkuCode}
            onChange={(e) => handleSelectSku(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {products.map(p => (
              <option key={p.sku} value={p.sku}>
                {p.sku} — {p.name} (${p.rrp.toFixed(2)})
              </option>
            ))}
          </select>
          <button 
            onClick={handleSaveScenario}
            className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-500/20"
          >
            {savedScenario ? 'Update Comparison' : 'Save Scenario'}
          </button>
          {savedScenario && (
            <button 
              onClick={() => setSavedScenario(null)}
              className="text-slate-500 hover:text-slate-300 text-xs px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Input Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Standard RRP ($ AUD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
            <input
              type="number"
              step="0.01"
              value={customRrp}
              onChange={(e) => setCustomRrp(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Wholesale Cost ($)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
            <input
              type="number"
              step="0.01"
              value={customCost}
              onChange={(e) => setCustomCost(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>Promo Discount</span>
            <span className="text-amber-300 font-black">{discountPercent}% OFF</span>
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer mt-2"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>5% (Catalog)</span>
            <span>25% (Feature)</span>
            <span>50% (Half Price)</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Baseline Weekly Units</span>
            <span className="text-white font-black">{baselineWeeklyUnits} units</span>
          </label>
          <input
            type="range"
            min="0"
            max="500"
            step="10"
            value={baselineWeeklyUnits}
            onChange={(e) => setBaselineWeeklyUnits(e.target.value)}
            className="w-full accent-slate-400 cursor-pointer mt-2"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Promo Duration (Weeks)</span>
            <span className="text-white font-black">{promoDurationWeeks} weeks</span>
          </label>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={promoDurationWeeks}
            onChange={(e) => setPromoDurationWeeks(parseInt(e.target.value))}
            className="w-full accent-slate-400 cursor-pointer mt-2"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Supplier Co-Op Rebate ($)</span>
            <span className="text-emerald-300 font-black">${supplierCoOpRebate.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={supplierCoOpRebate}
            onChange={(e) => setSupplierCoOpRebate(parseFloat(e.target.value) || 0)}
            className="w-full accent-emerald-500 cursor-pointer mt-2"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
            <span>Vol. Elasticity Factor</span>
            <span className="text-blue-300 font-black">{elasticityFactor.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.1"
            value={elasticityFactor}
            onChange={(e) => setElasticityFactor(parseFloat(e.target.value) || 0)}
            className="w-full accent-blue-500 cursor-pointer mt-2"
          />
        </div>

      </div>

      {/* Output Projection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-6 border-t border-slate-800">
        
        {/* Card 1: Promo Pricing & Margin */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Promo Selling Price</span>
            <span className="text-amber-400">-{discountPercent}%</span>
          </div>
          <div className="text-2xl font-black text-white">
            ${calculations.promoRrp.toFixed(2)}
            <span className="text-xs text-slate-500 font-normal line-through ml-2">${calculations.rrp.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Promo Gross Margin:</span>
            <span className={`font-black ${calculations.promoMarginPct < 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {calculations.promoMarginPct.toFixed(1)}% (${calculations.promoGrossProfit.toFixed(2)}/unit)
            </span>
          </div>
        </div>

        {/* Card 2: Projected Volume Lift & Units */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Projected Volume Lift</span>
          </div>
          <div className="text-2xl font-black text-blue-400">
            +{calculations.estimatedVolumeLiftPct}%
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Weekly Units Sold:</span>
            <span className="font-bold text-white">
              {calculations.promoWeeklyUnits} <span className="text-[10px] text-slate-400 font-normal">(vs {calculations.baselineUnits} base)</span>
            </span>
          </div>
        </div>

        {/* Card 3: Net Unit Contribution */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3">
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Net Unit Contribution</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ${calculations.netUnitContribution.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ unit</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Includes Co-Op Subsidy:</span>
            <span className="font-bold text-emerald-300">+${supplierCoOpRebate.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 4: Promotional ROI & Profitability */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-3">
          <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Incremental Profit (ROI)</span>
          </div>
          <div className="text-2xl font-black text-purple-400">
            +{formatAud(calculations.incrementalWeeklyGp * promoDurationWeeks)}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Breakeven Lift Units:</span>
            <span className="font-bold text-amber-300">{calculations.breakevenUnits} units/wk</span>
          </div>
        </div>

      </div>

      {/* Comparison Table */}
      {savedScenario && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Scenario Comparison</h4>
            <span className="text-[10px] text-slate-500">Saved: {savedScenario.discount}% discount, {savedScenario.duration}wks, {savedScenario.rebate}$ rebate</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2">Metric</th>
                  <th className="py-2">Current</th>
                  <th className="py-2">Saved</th>
                  <th className="py-2">Variance</th>
                </tr>
              </thead>
              <tbody className="text-white">
                <tr className="border-b border-slate-800/50">
                  <td className="py-2 font-medium">Net Margin (%)</td>
                  <td className="py-2">{calculations.promoMarginPct.toFixed(1)}%</td>
                  <td className="py-2">{savedScenario.calculations.promoMarginPct.toFixed(1)}%</td>
                  <td className={`py-2 font-bold ${calculations.promoMarginPct - savedScenario.calculations.promoMarginPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(calculations.promoMarginPct - savedScenario.calculations.promoMarginPct).toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <td className="py-2 font-medium">Volume Lift</td>
                  <td className="py-2">+{calculations.estimatedVolumeLiftPct}%</td>
                  <td className="py-2">+{savedScenario.calculations.estimatedVolumeLiftPct}%</td>
                  <td className={`py-2 font-bold ${calculations.estimatedVolumeLiftPct - savedScenario.calculations.estimatedVolumeLiftPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(calculations.estimatedVolumeLiftPct - savedScenario.calculations.estimatedVolumeLiftPct).toFixed(0)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Incremental ROI</td>
                  <td className="py-2">{calculations.promoRoiPercent.toFixed(1)}%</td>
                  <td className="py-2">{savedScenario.calculations.promoRoiPercent.toFixed(1)}%</td>
                  <td className={`py-2 font-bold ${calculations.promoRoiPercent - savedScenario.calculations.promoRoiPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(calculations.promoRoiPercent - savedScenario.calculations.promoRoiPercent).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Decision Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
        calculations.isProfitableLift 
          ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200' 
          : 'bg-rose-950/40 border-rose-800/50 text-rose-200'
      }`}>
        <div className="flex items-center gap-3">
          {calculations.isProfitableLift ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <div>
            <span className="font-black">
              {calculations.isProfitableLift ? '✅ Highly Profitable Promotional Simulation: ' : '⚠️ Margin Warning: '}
            </span>
            <span>
              {calculations.isProfitableLift 
                ? `At ${discountPercent}% discount with +${calculations.estimatedVolumeLiftPct}% volume elasticity, this SKU generates an incremental gross profit of ${formatAud(calculations.incrementalWeeklyGp * promoDurationWeeks)} over the ${promoDurationWeeks}-week promotional window.` 
                : `Volume lift (+${calculations.estimatedVolumeLiftPct}%) is insufficient to offset margin dilution at ${discountPercent}% discount. Increase supplier co-op rebate or reduce discount depth.`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
