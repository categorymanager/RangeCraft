import React, { useState } from 'react';
import { Product } from '../types';
import { safeFetch } from '../utils/api';
import {
  Search,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Tag,
  AlertCircle,
  DollarSign,
  ChevronRight,
  RefreshCw,
  Award
} from 'lucide-react';

interface MarketIntelViewProps {
  products: Product[];
  onSelectProductToPlan?: (sku: string) => void;
}

export const MarketIntelView: React.FC<MarketIntelViewProps> = ({
  products,
}) => {
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '');
  const [customProductPrompt, setCustomProductPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const currentProduct = products.find(p => p.sku === selectedSku);

  const handleRunIntelScan = async (productToScan?: Product, customName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const prod = productToScan || currentProduct;
      const targetName = customName?.trim() || prod?.name || 'FMCG Retail Product';
      const result = await safeFetch<any>('/api/analyze-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: prod?.sku || '',
          productName: targetName,
          category: prod?.category || 'General Merchandise',
          subcategory: prod?.subcategory || 'All',
          currentRrp: prod?.rrp || 49.95,
          rrp: prod?.rrp || 49.95,
          historicalBaseline: prod?.weeklyUnitsBaseline || 0
        })
      });

      setMarketData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Market intelligence scanner unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const productTitle = marketData?.productAnalysed || marketData?.productName || currentProduct?.name || 'Retail Category Benchmark';
  const overviewCopy = marketData?.marketOverview || marketData?.strategicRecommendation || '';
  const competitorList: any[] = marketData?.competitorMechanics || marketData?.competitorDynamics || [];
  const mechanicsList: any[] = marketData?.optimalDiscountMechanics || marketData?.optimalPricePoints || [];
  const seasonalList: any[] = marketData?.seasonalTimingRecommendations || marketData?.peakSeasonalWindows || [];
  const complianceTips: string[] = Array.isArray(marketData?.acccComplianceTips)
    ? marketData.acccComplianceTips
    : marketData?.acccComplianceNote
    ? [marketData.acccComplianceNote]
    : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span>Australian Retail Market &amp; Competitor Intelligence</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Competitor benchmark mechanics across National Supermarkets, Department Stores, Big-Box Retail &amp; Online Marketplaces, price elasticity curves, and Custom Rules compliance.
          </p>
        </div>

        <button
          onClick={() => handleRunIntelScan(undefined, customProductPrompt || undefined)}
          disabled={isLoading || (products.length === 0 && !customProductPrompt.trim())}
          className="w-full md:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{isLoading ? 'Scanning Australian Market...' : 'Run Live Intel Scan'}</span>
        </button>
      </div>

      {/* Selector & Custom Search Controls */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Dropdown for existing SKUs (7 cols) */}
          <div className="md:col-span-7 min-w-0">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select SKU from Range for Competitive Deep-Dive
            </label>
            <select
              value={selectedSku}
              disabled={products.length === 0}
              onChange={(e) => {
                setSelectedSku(e.target.value);
                const prod = products.find(p => p.sku === e.target.value);
                if (prod) handleRunIntelScan(prod);
              }}
              className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer truncate disabled:opacity-60"
            >
              {products.length === 0 ? (
                <option value="">No catalog SKUs added yet — enter a product keyword on the right</option>
              ) : (
                products.map((p, idx) => (
                  <option key={`intel-sku-${p.sku}-${idx}`} value={p.sku}>
                    [{p.sku}] {p.name} — RRP ${p.rrp.toFixed(2)} AUD ({p.category})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Custom SKU search box (5 cols) */}
          <div className="md:col-span-5 min-w-0">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Or Benchmark Any Freeform Product / Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Choc Protein Bar 200g, Sparkling Water 12-Pack..."
                value={customProductPrompt}
                onChange={(e) => setCustomProductPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customProductPrompt.trim()) {
                    handleRunIntelScan(undefined, customProductPrompt);
                  }
                }}
                className="flex-1 min-w-0 min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                disabled={isLoading || !customProductPrompt.trim()}
                onClick={() => {
                  if (customProductPrompt.trim()) {
                    handleRunIntelScan(undefined, customProductPrompt);
                  }
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 font-bold text-xs border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                Scan
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Intel Results View */}
      {marketData ? (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
          {/* Top Banner with Summary */}
          <div className="bg-white dark:bg-[#111726] border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm min-w-0">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="truncate">Market Intel: {productTitle}</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-semibold whitespace-nowrap shrink-0">
                Live AU Market Model
              </span>
            </div>

            {overviewCopy && (
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {overviewCopy}
              </p>
            )}

            {marketData.supplierNegotiationTip && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-900 dark:text-white">Trade Negotiation Lever:</strong>{' '}
                  {marketData.supplierNegotiationTip}
                </span>
              </div>
            )}
          </div>

          {/* 3-Column Intel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Competitor Benchmarking */}
            <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Competitor Mechanics</span>
              </h3>

              <div className="space-y-2 text-xs">
                {competitorList.length > 0 ? (
                  competitorList.map((comp: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <div className="flex justify-between font-bold text-slate-900 dark:text-slate-200 gap-2">
                        <span>{comp.competitor || comp.retailer || 'Retail Channel'}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                          {comp.priceRange || (comp.typicalPromoPrice ? `$${comp.typicalPromoPrice} AUD` : 'Benchmark')}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-300">
                        Typical Mechanic: <strong>{comp.typicalMechanic || 'Rotational Feature'}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Frequency: {comp.promoFrequency || 'Quarterly cycle'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Run a scan on an active SKU to view channel mechanic benchmarks.
                  </p>
                )}
              </div>
            </div>

            {/* 2. Optimal Discount Mechanics & Price Points */}
            <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>Optimal Discount Mechanics</span>
              </h3>

              <div className="space-y-2 text-xs">
                {mechanicsList.length > 0 ? (
                  mechanicsList.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.mechanic || item.tier || 'Promotional Mechanic'}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums whitespace-nowrap">
                          {item.recommendedPromoPriceAUD != null
                            ? `$${Number(item.recommendedPromoPriceAUD).toFixed(2)} AUD`
                            : item.price
                            ? `$${item.price}`
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                        <span>{item.discountDepth || 'Targeted Offer'}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                          {item.expectedVolumeLiftPercent != null
                            ? `+${item.expectedVolumeLiftPercent}% Lift`
                            : item.expectedLift || ''}
                        </span>
                      </div>
                      {(item.marginProtectionScore || item.bestUsedDuring) && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 pt-0.5">
                          <span>Margin Protection: <strong>{item.marginProtectionScore || 'High'}</strong></span>
                          {item.bestUsedDuring && <span className="truncate">{item.bestUsedDuring}</span>}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    No discount mechanics returned for this query.
                  </p>
                )}
              </div>
            </div>

            {/* 3. Custom Rules Compliance & Timing Triggers */}
            <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Custom Rules &amp; Seasonality</span>
              </h3>

              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3.5 rounded-xl text-xs space-y-1.5 text-emerald-800 dark:text-emerald-200">
                <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Custom Rules Hiatus &amp; Pricing Guide</span>
                </div>
                {complianceTips.length > 0 ? (
                  <ul className="text-[11px] leading-relaxed space-y-1 list-disc list-inside">
                    {complianceTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] leading-relaxed">
                    Ensure items have been sold at RRP for at least 4 continuous weeks prior to advertising &quot;Was $X / Now $Y&quot; savings to maintain price integrity.
                  </p>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Peak Demand Windows</span>
                </div>
                <div className="space-y-2">
                  {seasonalList.length > 0 ? (
                    seasonalList.map((win: any, idx: number) =>
                      typeof win === 'string' ? (
                        <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-300">• {win}</div>
                      ) : (
                        <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 border-b last:border-b-0 border-slate-200 dark:border-slate-800 pb-1.5 last:pb-0">
                          <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                            <span>{win.seasonOrEvent}</span>
                            {win.weekNumber && <span className="font-mono text-blue-600 dark:text-blue-400">W{win.weekNumber}</span>}
                          </div>
                          {win.rationale && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{win.rationale}</p>}
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Peak demand periods will display here after scanning.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Market Intel Scanned Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              {products.length > 0
                ? 'Select a SKU or enter a product name above to trigger a live market benchmark and discover optimal discount mechanics.'
                : 'Add SKUs to your Product Catalog or type any product name above to benchmark Australian promotional mechanics.'}
            </p>
          </div>
          {(currentProduct || customProductPrompt.trim()) && (
            <button
              onClick={() => handleRunIntelScan(undefined, customProductPrompt || undefined)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              Scan &quot;{customProductPrompt.trim() || currentProduct?.name}&quot; Now
            </button>
          )}
        </div>
      )}
    </div>
  );
};
