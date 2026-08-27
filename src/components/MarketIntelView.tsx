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
      const result = await safeFetch<any>('/api/analyze-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: customName || prod?.name || 'Eco-Ignite Fast-Lighting Hardwood Fire Cubes 24-Pack',
          category: prod?.category || 'Outdoor & Hardware',
          subcategory: prod?.subcategory || 'BBQ & Fireplace',
          rrp: prod?.rrp || 9.95,
          historicalBaseline: prod?.weeklyUnitsBaseline || 420
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            <span>Australian Retail Market & Competitor Intelligence Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time market analysis, competitor benchmark mechanics across National Supermarkets, Department Stores, Big-Box Hardware & E-Commerce, price elasticity curves, and ACCC pricing compliance.
          </p>
        </div>

        <button
          onClick={() => handleRunIntelScan()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-900/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{isLoading ? 'Scanning Australian Market...' : 'Run Live Intel Scan on Selected SKU'}</span>
        </button>
      </div>

      {/* Selector & Custom Search Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Dropdown for existing SKUs (7 cols) */}
          <div className="md:col-span-7">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select SKU from Range for Competitive Deep-Dive
            </label>
            <select
              value={selectedSku}
              onChange={(e) => {
                setSelectedSku(e.target.value);
                const prod = products.find(p => p.sku === e.target.value);
                if (prod) handleRunIntelScan(prod);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {products.map((p, idx) => (
                <option key={`intel-sku-${p.sku}-${idx}`} value={p.sku}>
                  [{p.sku}] {p.name} — RRP ${p.rrp.toFixed(2)} AUD ({p.category})
                </option>
              ))}
            </select>
          </div>

          {/* Custom SKU search box (5 cols) */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Or Benchmark Any Freeform Product / Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Sourdough Crisps 3-Pack, 4K Smart TV, Down Jacket, Espresso Machine..."
                value={customProductPrompt}
                onChange={(e) => setCustomProductPrompt(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => {
                  if (customProductPrompt.trim()) {
                    handleRunIntelScan(undefined, customProductPrompt);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 cursor-pointer"
              >
                Scan
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Intel Results View */}
      {marketData ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Banner with Summary */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Market Intelligence Analysis for: {marketData.productName}</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Live AU Market Model
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              {marketData.strategicRecommendation}
            </p>
          </div>

          {/* 3-Column Intel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Competitor Benchmarking */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Competitor Mechanics</span>
              </h3>

              <div className="space-y-2 text-xs">
                {marketData.competitorDynamics?.map((comp: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span>{comp.retailer}</span>
                      <span className="text-emerald-400">${comp.typicalPromoPrice} AUD</span>
                    </div>
                    <div className="text-[11px] text-amber-300">
                      Typical Mechanic: <strong>{comp.typicalMechanic}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Frequency: {comp.promoFrequency}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Price Elasticity & Key Price Points */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Price Elasticity & Sweet Spots</span>
              </h3>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
                <div className="text-slate-300">
                  Elasticity Rating: <strong className="text-blue-300 uppercase">{marketData.priceElasticityRating || 'High'}</strong>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Estimated Volume Multiplier: <strong className="text-emerald-400">+{marketData.estimatedVolumeLiftMultiplier || '2.4x'}</strong>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-slate-300 text-[11px]">Optimal Price Points in AU:</div>
                {marketData.optimalPricePoints?.map((pp: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white">${pp.price}</strong>
                      <span className="text-[10px] text-slate-400 ml-2">({pp.tier})</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold">{pp.expectedLift}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. ACCC Compliance & Timing Triggers */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ACCC & Australian Seasonality</span>
              </h3>

              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-xs space-y-1 text-emerald-200">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ACCC Two-Price Rule Guide</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {marketData.acccComplianceNote || 'Ensure items have been sold at RRP for at least 4 continuous weeks prior to advertising "Was $X / Now $Y" savings to avoid ACCC scrutiny.'}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Peak Demand Windows</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  {marketData.peakSeasonalWindows?.map((win: string, idx: number) => (
                    <li key={idx}>{win}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Market Intel Scanned Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Select a SKU or enter a product name above to trigger a live market benchmark against Australian retailers and discover optimal discount mechanics.
            </p>
          </div>
          <button
            onClick={() => handleRunIntelScan()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
          >
            Scan "{currentProduct?.name || 'Selected SKU'}" Now
          </button>
        </div>
      )}
    </div>
  );
};
