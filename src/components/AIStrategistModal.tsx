import React, { useState } from 'react';
import { Product, WeekPromotion, StrategicObjective } from '../types';
import { safeFetch } from '../utils/api';
import { 
  Sparkles, 
  RefreshCw, 
  Layers, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  ShoppingBag,
  Flame,
  ShieldCheck
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
  const [customConstraints, setCustomConstraints] = useState<string>(
    'Optimize hero promotional placement during key national retail events (W4 Australia Day, W13 Easter, W26 EOFY, W47 Black Friday, W51 Christmas). Maximize gross margin dollars while strictly enforcing the mandatory ACCC 4-week pricing hiatus and avoiding intra-category cannibalization.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResults, setGeneratedResults] = useState<any>(null);

  if (!isOpen) return null;

  const handleRunAiOptimization = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedResults(null);

    try {
      const result = await safeFetch<any>('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          strategicObjective,
          retailerModel,
          customConstraints,
        })
      });

      setGeneratedResults(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AI Strategy generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToPlan = () => {
    const promoList = generatedResults?.promotions || generatedResults?.recommendedPromos;
    if (!generatedResults || !promoList) return;

    // Merge AI generated weeks into current promotions
    const updatedMap = new Map<number, any>();
    promoList.forEach((p: any) => {
      updatedMap.set(p.weekNumber, p);
    });

    const newPromotions = currentPromotions.map(current => {
      const aiPromo = updatedMap.get(current.weekNumber);
      if (aiPromo) {
        const heroSku = aiPromo.heroSku || aiPromo.featuredSku || current.heroSku;
        const matchingProduct = products.find(prod => prod.sku === heroSku) || products[0];
        const promoRrp = aiPromo.promotionalRrp || aiPromo.mechanic?.promoRrp || (matchingProduct ? matchingProduct.rrp * 0.75 : current.mechanic.promoRrp);
        const promoLabel = aiPromo.discountDepth || aiPromo.mechanic?.label || current.mechanic.label;

        return {
          ...current,
          heroSku,
          campaignTheme: aiPromo.campaignTheme || aiPromo.campaignTitle || current.campaignTheme,
          strategicObjective: (aiPromo.strategicObjective as StrategicObjective) || current.strategicObjective,
          cataloguePlacement: aiPromo.cataloguePlacement || current.cataloguePlacement,
          secondarySkus: aiPromo.secondarySkus || current.secondarySkus,
          mechanic: {
            ...current.mechanic,
            type: aiPromo.mechanic?.type || current.mechanic.type,
            discountValue: aiPromo.mechanic?.discountValue || aiPromo.discountPercent || current.mechanic.discountValue,
            promoRrp,
            label: promoLabel,
            supplierFundingPerUnit: aiPromo.mechanic?.supplierFundingPerUnit || (matchingProduct?.cost ? matchingProduct.cost * 0.1 : 0),
          },
          projectedUnits: aiPromo.projectedUnits || aiPromo.projectedWeeklyUnits || current.projectedUnits,
          projectedRevenueAud: aiPromo.projectedRevenueAud || (promoRrp * (aiPromo.projectedUnits || current.projectedUnits)),
          projectedMarginAud: aiPromo.projectedMarginAud || current.projectedMarginAud,
          projectedMarginPercent: aiPromo.projectedMarginPercent || aiPromo.projectedPromoMarginPercent || current.projectedMarginPercent,
          tradeSpendAud: aiPromo.tradeSpendAud || current.tradeSpendAud,
        };
      }
      return current;
    });

    onApplyGeneratedPlan(newPromotions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                AI 52-Week Promotional Strategy Optimizer
              </h3>
              <p className="text-xs text-slate-400">
                Powered by Gemini 3.7 Flash • Australian Seasonal & ACCC Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!generatedResults ? (
          <div className="space-y-4 text-xs">
            {/* 1. Commercial Strategic Objective */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                1. Primary Commercial Strategic Objective
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'balanced_growth',
                    title: 'Balanced Growth & Margin',
                    desc: 'Standard Australian retail mix: hero volume drivers balanced with high-margin basket builders.'
                  },
                  {
                    id: 'aggressive_volume',
                    title: 'Aggressive Volume & Footfall',
                    desc: 'Deep discounts on Tier 1 heroes to capture market share and maximize catalogue traffic.'
                  },
                  {
                    id: 'margin_preservation',
                    title: 'Margin & Premium Protection',
                    desc: 'Enforce strict 6-week hiatus, focus on Multi-Buy and Gift-with-Purchase mechanics.'
                  },
                  {
                    id: 'clearance_stocktake',
                    title: 'Inventory Clearance & EOFY',
                    desc: 'Aggressively markdown slow-moving Tier 4 inventory before financial year end.'
                  }
                ].map(obj => (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => setStrategicObjective(obj.id)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      strategicObjective === obj.id
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-amber-400 text-xs">{obj.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-snug">{obj.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Retailer Model Anchor */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                2. Target Australian Retail Channel Anchor
              </label>
              <select
                value={retailerModel}
                onChange={(e) => setRetailerModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Supermarket & General Mass Merchant">
                  Supermarket & General Mass Merchant — Weekly catalogues, Wednesday cycle
                </option>
                <option value="Hardware, Trade & DIY Networks">
                  Hardware, Trade & DIY Networks — Project-based, Spring garden, Summer DIY
                </option>
                <option value="Department & Apparel Chains">
                  Department & Apparel Chains — Seasonal fashion drops, Mother's Day, Boxing Day
                </option>
                <option value="Consumer Electronics & Appliance Retailers">
                  Consumer Electronics & Appliance Retailers — EOFY Tax Time, Black Friday, Footy Finals
                </option>
              </select>
            </div>

            {/* 3. Custom Strategy Constraints */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                3. Custom Range Rules, Specific SKU Mandates & Timing Constraints
              </label>
              <textarea
                rows={3}
                value={customConstraints}
                onChange={(e) => setCustomConstraints(e.target.value)}
                placeholder="e.g. Put firelighters on Australia Day week 4, jackets in June, strictly enforce 4 week hiatus..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunAiOptimization}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold shadow-md shadow-rose-900/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isLoading ? 'Synthesizing 52-Week Strategy...' : 'Generate 52-Week Strategy Plan'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-4 text-xs animate-fadeIn">
            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>AI Strategy Generation Complete</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {generatedResults.rationale || 'Successfully scheduled SKU campaigns across all 52 weeks in compliance with Australian seasonal peaks and ACCC hiatus guidelines.'}
              </p>
            </div>

            {/* Quick Preview of Generated Weeks */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Sample Generated Campaigns ({generatedResults.promotions?.length || 0} Weeks):
              </div>
              {generatedResults.promotions?.slice(0, 8).map((p: any) => (
                <div key={p.weekNumber} className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-400 mr-2">W{p.weekNumber}</span>
                    <span className="text-white font-medium">{p.campaignTheme}</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${p.mechanic?.promoRrp} ({p.mechanic?.label})
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setGeneratedResults(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Back to Settings
              </button>
              <button
                type="button"
                onClick={handleApplyToPlan}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-md cursor-pointer"
              >
                Apply AI Strategy to 52-Week Calendar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
