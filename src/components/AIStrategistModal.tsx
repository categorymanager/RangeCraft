import React, { useState } from 'react';
import {
  Product,
  WeekPromotion,
  StrategicObjective,
  SchedulePreferences,
  ScheduleCadenceMode,
} from '../types';
import { safeFetch } from '../utils/api';
import scheduleAiPlannerImg from '../assets/images/schedule_ai_planner_1795833147217.jpg';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CalendarDays,
  SlidersHorizontal,
  Wand2,
  X,
  Coffee,
  TrendingUp,
} from 'lucide-react';

interface AIStrategistModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentPromotions: WeekPromotion[];
  onApplyGeneratedPlan: (promotions: WeekPromotion[]) => void;
}

export const AIStrategistModal: React.FC<AIStrategistModalProps> = ({
  isOpen,
  onClose,
  products,
  currentPromotions,
  onApplyGeneratedPlan,
}) => {
  const [strategicObjective, setStrategicObjective] = useState<string>('balanced_growth');
  const [retailerModel, setRetailerModel] = useState<string>('Supermarket & General Mass Merchant');

  // Optional Custom Scheduling Rules & Cadence Preferences
  const [preventCategoryCannibalization, setPreventCategoryCannibalization] = useState<boolean>(true);
  const [preventSubcategoryCannibalization, setPreventSubcategoryCannibalization] = useState<boolean>(true);
  const [avoidSupplierBrandClashes, setAvoidSupplierBrandClashes] = useState<boolean>(true);
  const [avoidVariantClashes, setAvoidVariantClashes] = useState<boolean>(true);
  const [cadenceMode, setCadenceMode] = useState<ScheduleCadenceMode>('every_week');
  const [gapIntervalWeeks, setGapIntervalWeeks] = useState<number>(1);
  const [minHiatusWeeks, setMinHiatusWeeks] = useState<number>(4);
  const [maxPromosPerSkuPerYear, setMaxPromosPerSkuPerYear] = useState<number>(6);
  const [aiPromptRuleText, setAiPromptRuleText] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResults, setGeneratedResults] = useState<any>(null);

  if (!isOpen) return null;

  const hasZeroProducts = products.length === 0;

  const handleRunAiOptimization = async () => {
    if (hasZeroProducts) {
      setError('Upload or add at least 1 SKU in your product catalog before generating a promotional schedule.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedResults(null);

    const preferences: SchedulePreferences = {
      preventCategoryCannibalization,
      preventSubcategoryCannibalization,
      preventBrandSupplierClash: avoidSupplierBrandClashes,
      preventVariantClash: avoidVariantClashes,
      minHiatusWeeks,
      maxPromosPerSkuPerYear,
      cadenceMode,
      gapIntervalWeeks: cadenceMode === 'with_gaps' ? gapIntervalWeeks : 0,
      strategicObjective: strategicObjective as SchedulePreferences['strategicObjective'],
      retailerModel,
      aiPromptRuleText: aiPromptRuleText.trim() || undefined,
    };

    try {
      const result = await safeFetch<any>('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          strategicObjective,
          retailerModel,
          preferences,
          customConstraints: aiPromptRuleText.trim(),
        }),
      });

      setGeneratedResults(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Schedule optimization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToPlan = () => {
    const promoList = generatedResults?.promotions || generatedResults?.recommendedPromos;
    if (!generatedResults || !promoList) return;

    const updatedMap = new Map<number, any>();
    promoList.forEach((p: any) => {
      updatedMap.set(p.weekNumber, p);
    });

    const newPromotions = currentPromotions.map((current) => {
      const aiPromo = updatedMap.get(current.weekNumber);
      if (aiPromo) {
        const isSkipped = Boolean(aiPromo.isPromoSkipped);
        const heroSku = isSkipped ? '' : aiPromo.heroSku || aiPromo.featuredSku || current.heroSku;
        const matchingProduct = products.find((prod) => prod.sku === heroSku) || products[0];
        const promoRrp =
          aiPromo.mechanic?.promoRrp ??
          aiPromo.promotionalRrp ??
          (matchingProduct ? matchingProduct.rrp * 0.75 : current.mechanic.promoRrp);
        const promoLabel = isSkipped
          ? 'Baseline Recovery (No Promo)'
          : aiPromo.mechanic?.label || aiPromo.discountDepth || current.mechanic.label;

        return {
          ...current,
          heroSku,
          isPromoSkipped: isSkipped,
          campaignTheme: aiPromo.campaignTheme || aiPromo.campaignTitle || current.campaignTheme,
          strategicObjective: (aiPromo.strategicObjective as StrategicObjective) || current.strategicObjective,
          cataloguePlacement: aiPromo.cataloguePlacement ?? current.cataloguePlacement,
          secondarySkus: aiPromo.secondarySkus ?? (isSkipped ? [] : current.secondarySkus),
          skuCaseDeals: aiPromo.skuCaseDeals ?? current.skuCaseDeals,
          activeChannels: aiPromo.activeChannels ?? current.activeChannels,
          mechanic: {
            ...current.mechanic,
            type: aiPromo.mechanic?.type ?? current.mechanic.type,
            discountValue: aiPromo.mechanic?.discountValue ?? aiPromo.discountPercent ?? current.mechanic.discountValue,
            promoRrp,
            label: promoLabel,
            supplierFundingPerUnit:
              aiPromo.mechanic?.supplierFundingPerUnit ??
              (isSkipped ? 0 : matchingProduct?.cost ? Number((matchingProduct.cost * 0.1).toFixed(2)) : 0),
            caseDealType: aiPromo.mechanic?.caseDealType ?? current.mechanic.caseDealType,
            caseDealValue: aiPromo.mechanic?.caseDealValue ?? current.mechanic.caseDealValue,
          },
          projectedUnits: aiPromo.projectedUnits ?? aiPromo.projectedWeeklyUnits ?? current.projectedUnits,
          projectedRevenueAud: aiPromo.projectedRevenueAud ?? current.projectedRevenueAud,
          projectedMarginAud: aiPromo.projectedMarginAud ?? current.projectedMarginAud,
          projectedMarginPercent:
            aiPromo.projectedMarginPercent ?? aiPromo.projectedPromoMarginPercent ?? current.projectedMarginPercent,
          tradeSpendAud: aiPromo.tradeSpendAud ?? current.tradeSpendAud,
          isAiGenerated: true,
        };
      }
      return current;
    });

    onApplyGeneratedPlan(newPromotions);
    onClose();
  };

  const generatedWeeks: WeekPromotion[] = generatedResults?.promotions || [];
  const activeWeekCount = generatedWeeks.filter((w) => !w.isPromoSkipped && w.mechanic?.discountValue > 0).length;
  const skippedWeekCount = generatedWeeks.filter((w) => w.isPromoSkipped).length;
  const totalPreviewRev = generatedWeeks.reduce((sum, w) => sum + (w.projectedRevenueAud || 0), 0);
  const totalPreviewProfit = generatedWeeks.reduce((sum, w) => sum + (w.projectedMarginAud || 0), 0);

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/75 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#111726] border-0 sm:border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-3xl max-w-3xl w-full h-[100dvh] sm:h-auto sm:max-h-[92dvh] shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white">
        {/* Top Editorial Banner */}
        <div className="shrink-0 relative h-28 sm:h-32 overflow-hidden border-b border-slate-200 dark:border-slate-800">
          <img
            src={scheduleAiPlannerImg}
            alt="Automated 52-week promotional calendar optimizer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-[#1e3a8a]/70" />
          <div className="relative z-10 h-full px-4 sm:px-7 flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-lg font-extrabold truncate">
                  Optimal 52-Week Schedule &amp; Custom Rules Studio
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-200 truncate">
                  Configure rules optionally — or leave defaults to auto-maximize revenue &amp; net profit
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Schedule Studio modal"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-7 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!generatedResults ? (
            <div className="space-y-5 text-xs">
              {/* Zero-Input Optimal Banner */}
              <div className="p-3.5 rounded-2xl border bg-gradient-to-r from-emerald-50/80 to-blue-50/70 dark:from-emerald-950/35 dark:to-blue-950/35 border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    All preferences below are optional ({products.length} SKUs ready)
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Click <strong>Generate Optimal Schedule</strong> right away with zero edits, or customize cannibalization guards, cadence gaps, frequency caps, and free-text AI prompt rules first.
                  </p>
                </div>
              </div>

              {/* 1. Primary Strategic Objective */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                  1. Primary Commercial Objective
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'balanced_growth',
                      title: 'Max Revenue & Profit (Recommended)',
                      desc: 'Balances tier-1 volume drivers with high-margin basket builders & case deals.',
                    },
                    {
                      id: 'aggressive_volume',
                      title: 'Aggressive Volume & Footfall',
                      desc: 'Prioritizes deep promotional reach on fast-moving traffic drivers.',
                    },
                    {
                      id: 'margin_preservation',
                      title: 'Margin & Premium Protection',
                      desc: 'Prioritizes higher hiatus gaps and shallow/co-funded mechanics.',
                    },
                    {
                      id: 'clearance_stocktake',
                      title: 'Inventory Clearance & EOFY',
                      desc: 'Accelerates stock liquidation ahead of seasonal range resets.',
                    },
                  ].map((obj) => (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => setStrategicObjective(obj.id)}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer min-h-[44px] ${
                        strategicObjective === obj.id
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-[#2563EB] text-slate-900 dark:text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-[#2563EB] dark:text-blue-400 text-xs">{obj.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{obj.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Optional Custom Guardrails (Cannibalization & Clash Avoidance) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>2. Optional Cannibalization &amp; Clash Guardrails</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Toggle rules freely</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      label: 'Prevent Category Cannibalization',
                      sub: 'Avoid stacking competing products in the same department week',
                      checked: preventCategoryCannibalization,
                      onChange: setPreventCategoryCannibalization,
                    },
                    {
                      label: 'Prevent Subcategory Cannibalization',
                      sub: 'Space closely related subcategory SKUs across separate cycles',
                      checked: preventSubcategoryCannibalization,
                      onChange: setPreventSubcategoryCannibalization,
                    },
                    {
                      label: 'Avoid Supplier / Brand Clashes',
                      sub: 'Stop the same supplier or brand from overlapping weeks',
                      checked: avoidSupplierBrandClashes,
                      onChange: setAvoidSupplierBrandClashes,
                    },
                    {
                      label: 'Avoid Product Variant Clashes',
                      sub: 'Prevent identical flavour/pack variant groups colliding',
                      checked: avoidVariantClashes,
                      onChange: setAvoidVariantClashes,
                    },
                  ].map((rule) => (
                    <label
                      key={rule.label}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                        rule.checked
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white block">{rule.label}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-snug">
                          {rule.sub}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={rule.checked}
                        onChange={(e) => rule.onChange(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 w-4 h-4 cursor-pointer shrink-0"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Promotional Cadence (Every Week vs Gap Weeks) & Frequency Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                    <span>3. Weekly Cadence Preference</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCadenceMode('every_week')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        cadenceMode === 'every_week'
                          ? 'bg-[#2563EB] border-[#2563EB] text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs">Every Week</div>
                      <div className={`text-[10px] mt-0.5 ${cadenceMode === 'every_week' ? 'text-blue-100' : 'text-slate-500'}`}>
                        Active slot all 52 weeks
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCadenceMode('with_gaps')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        cadenceMode === 'with_gaps'
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs">Gaps Between Promos</div>
                      <div className={`text-[10px] mt-0.5 ${cadenceMode === 'with_gaps' ? 'text-slate-900' : 'text-slate-500'}`}>
                        Baseline recovery weeks
                      </div>
                    </button>
                  </div>

                  {cadenceMode === 'with_gaps' && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Rest / Recovery Weeks Between Active Promotions
                      </label>
                      <select
                        value={gapIntervalWeeks}
                        onChange={(e) => setGapIntervalWeeks(Number(e.target.value))}
                        className="w-full min-h-[38px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value={1}>1 Baseline Week between every promo week (26 active)</option>
                        <option value={2}>2 Baseline Weeks between promos (17 active)</option>
                        <option value={3}>3 Baseline Weeks between promos (13 active)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4. Frequency &amp; Channel Anchor</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Min Hiatus (Weeks)
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={12}
                        value={minHiatusWeeks}
                        onChange={(e) => setMinHiatusWeeks(Math.max(2, Math.min(12, Number(e.target.value) || 4)))}
                        className="w-full min-h-[38px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Max Promos / SKU / Yr
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={26}
                        value={maxPromosPerSkuPerYear}
                        onChange={(e) => setMaxPromosPerSkuPerYear(Math.max(1, Math.min(26, Number(e.target.value) || 6)))}
                        className="w-full min-h-[38px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Target Channel Model
                    </label>
                    <select
                      value={retailerModel}
                      onChange={(e) => setRetailerModel(e.target.value)}
                      className="w-full min-h-[38px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="Supermarket & General Mass Merchant">National Supermarkets &amp; Grocery</option>
                      <option value="Metro Grocery & Convenience">Metro Grocery &amp; Convenience</option>
                      <option value="Independent Grocers & Wholesale">Independent Grocers &amp; Wholesale</option>
                      <option value="Warehouse Clubs & Bulk">Warehouse Clubs &amp; Bulk</option>
                      <option value="Online Marketplaces">Online Marketplaces</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. Optional Natural-Language AI Prompt Box */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>5. Optional AI Prompt Rules (Leave Blank to Auto-Optimize Revenue &amp; Profit)</span>
                </label>
                <textarea
                  rows={3}
                  value={aiPromptRuleText}
                  onChange={(e) => setAiPromptRuleText(e.target.value)}
                  placeholder="Optional: e.g. Never discount coffee SKUs over 25%, feature hero beverages in W4 &amp; W47, leave 1 recovery week between promos, protect at least 30% net margin..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-generate-optimal-schedule"
                  type="button"
                  onClick={handleRunAiOptimization}
                  disabled={isLoading || hasZeroProducts}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] via-indigo-600 to-emerald-600 hover:brightness-110 text-white font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>
                    {isLoading
                      ? 'Optimizing 52-Week Revenue & Profit...'
                      : aiPromptRuleText.trim()
                      ? 'Interpret AI Rules & Generate Schedule'
                      : 'Generate Optimal 52-Week Schedule'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Results Preview */
            <div className="space-y-4 text-xs animate-fadeIn">
              <div className="bg-emerald-50 dark:bg-slate-950 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/40 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>52-Week Schedule Optimized</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                    {activeWeekCount} Active Weeks · {skippedWeekCount} Baseline Gap Weeks
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {generatedResults.rationale ||
                    'Schedule synthesized for maximum annual revenue and net profit while honoring your spacing, clash, and cadence preferences.'}
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1 tabular-nums">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Projected Revenue</span>
                    <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                      A${Math.round(totalPreviewRev).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Projected Net Profit</span>
                    <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      A${Math.round(totalPreviewProfit).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Preview of Generated Weeks (including skipped gap weeks) */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Schedule Preview (First 10 Weeks):
                </div>
                {generatedWeeks.slice(0, 10).map((p) => (
                  <div
                    key={p.weekNumber}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                      p.isPromoSkipped
                        ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800 text-slate-500'
                        : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 truncate flex items-center gap-2">
                      <span className="font-bold font-mono text-[#2563EB] dark:text-blue-400">W{p.weekNumber}</span>
                      {p.isPromoSkipped && <Coffee className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span className="font-medium truncate">
                        {p.isPromoSkipped ? 'Baseline Recovery Week (Scheduled Gap)' : `${p.campaignTheme} (${p.heroSku})`}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold shrink-0 tabular-nums ${
                        p.isPromoSkipped ? 'text-slate-500' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {p.isPromoSkipped ? 'RRP Full Margin' : `$${Number(p.mechanic?.promoRrp || 0).toFixed(2)} (${p.mechanic?.label})`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setGeneratedResults(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Adjust Rules
                </button>
                <button
                  id="btn-apply-optimized-schedule"
                  type="button"
                  onClick={handleApplyToPlan}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Apply Schedule to 52-Week Calendar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
