import React, { useState, useMemo } from 'react';
import { Product, PerformanceTier, ThemeMode, UserProfile, WeekPromotion } from '../types';
import { formatAud, formatNumber, formatPercent } from '../utils/formatters';
import { FrostedPaywallOverlay } from './FrostedPaywallOverlay';
import { 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  Filter, 
  Search, 
  SlidersHorizontal,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Percent,
  DollarSign,
  AlertCircle,
  Undo2,
  Check
} from 'lucide-react';

interface SkuDeletionEngineViewProps {
  products: Product[];
  promotions: WeekPromotion[];
  onDeleteProduct: (sku: string) => void;
  onDeleteMultipleProducts: (skus: string[]) => void;
  onImportProducts: (products: Product[]) => void;
  onUnlockExport?: (exportId: string, itemName: string, priceAud: number) => void;
  userProfile?: UserProfile | null;
  currentTheme?: ThemeMode;
}

export interface SkuHealthScorecard {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  rrp: number;
  cost: number;
  marginPercent: number;
  annualBaselineRevAud: number;
  weeklyUnitsBaseline: number;
  healthScore: number; // 0 to 100
  rationalizationStatus: 'keep_hero' | 'optimize_margin' | 'renegotiate_terms' | 'deletion_candidate';
  riskFactors: string[];
  opportunityFactors: string[];
  promoWeeksCount: number;
}

export const SkuDeletionEngineView: React.FC<SkuDeletionEngineViewProps> = ({
  products,
  promotions,
  onDeleteProduct,
  onDeleteMultipleProducts,
  onImportProducts,
  onUnlockExport,
  userProfile,
  currentTheme = 'light'
}) => {
  const isLight = currentTheme.includes('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'deletion_candidate' | 'renegotiate_terms' | 'optimize_margin' | 'keep_hero'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);
  const [previousProducts, setPreviousProducts] = useState<Product[] | null>(null);

  // Compute promo counts per SKU
  const promoCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    promotions.forEach(promo => {
      counts[promo.heroSku] = (counts[promo.heroSku] || 0) + 1;
      (promo.secondarySkus || []).forEach(sku => {
        counts[sku] = (counts[sku] || 0) + 1;
      });
    });
    return counts;
  }, [promotions]);

  // Compute SKU Health Scorecard (0 to 100) & Rationalization Status
  const scorecards = useMemo<SkuHealthScorecard[]>(() => {
    return products.map(p => {
      const promoWeeks = promoCountMap[p.sku] || 0;
      const annualRev = p.rrp * p.weeklyUnitsBaseline * 52;
      const margin = p.marginPercent;
      
      const riskFactors: string[] = [];
      const opportunityFactors: string[] = [];

      // Scoring factors
      let score = 50; // base score

      // Margin contribution (-30 to +30)
      if (margin >= 50) {
        score += 25;
        opportunityFactors.push(`High Margin (${margin.toFixed(1)}%) protects gross profit`);
      } else if (margin >= 35) {
        score += 10;
        opportunityFactors.push(`Healthy margin benchmark (${margin.toFixed(1)}%)`);
      } else if (margin < 25) {
        score -= 25;
        riskFactors.push(`Sub-standard margin (${margin.toFixed(1)}%) below 25% floor`);
      } else {
        score -= 10;
        riskFactors.push(`Thin margin squeeze (${margin.toFixed(1)}%)`);
      }

      // Volume & Revenue velocity (-20 to +20)
      if (p.weeklyUnitsBaseline >= 150) {
        score += 20;
        opportunityFactors.push(`Top-tier sales velocity (${p.weeklyUnitsBaseline} u/wk)`);
      } else if (p.weeklyUnitsBaseline >= 50) {
        score += 5;
      } else if (p.weeklyUnitsBaseline <= 15) {
        score -= 20;
        riskFactors.push(`Sluggish baseline velocity (${p.weeklyUnitsBaseline} u/wk)`);
      }

      // Vendor Scan Co-op support
      if (p.supplierCoOpEligible) {
        score += 10;
        opportunityFactors.push('Vendor scan rebate funding available');
      } else {
        score -= 5;
        riskFactors.push('No vendor co-op rebate support');
      }

      // Promotional scheduling frequency
      if (promoWeeks > 8) {
        score -= 10;
        riskFactors.push(`Over-promoted (${promoWeeks} weeks) — risk of ACCC hiatus breach`);
      } else if (promoWeeks === 0 && p.weeklyUnitsBaseline < 30) {
        score -= 15;
        riskFactors.push('Unpromoted gap SKU with low baseline movement');
      }

      // Clamp score 0 to 100
      const finalScore = Math.min(100, Math.max(0, Math.round(score)));

      // Assign Status
      let status: SkuHealthScorecard['rationalizationStatus'] = 'keep_hero';
      if (finalScore < 40 || (margin < 20 && p.weeklyUnitsBaseline < 30)) {
        status = 'deletion_candidate';
      } else if (finalScore < 55) {
        status = 'renegotiate_terms';
      } else if (finalScore < 75) {
        status = 'optimize_margin';
      } else {
        status = 'keep_hero';
      }

      return {
        sku: p.sku,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        rrp: p.rrp,
        cost: p.cost,
        marginPercent: p.marginPercent,
        annualBaselineRevAud: annualRev,
        weeklyUnitsBaseline: p.weeklyUnitsBaseline,
        healthScore: finalScore,
        rationalizationStatus: status,
        riskFactors,
        opportunityFactors,
        promoWeeksCount: promoWeeks
      };
    });
  }, [products, promoCountMap]);

  // Aggregate Stats
  const deletionCandidates = useMemo(() => scorecards.filter(s => s.rationalizationStatus === 'deletion_candidate'), [scorecards]);
  const renegotiateCandidates = useMemo(() => scorecards.filter(s => s.rationalizationStatus === 'renegotiate_terms'), [scorecards]);
  const marginCandidates = useMemo(() => scorecards.filter(s => s.rationalizationStatus === 'optimize_margin'), [scorecards]);
  const heroCandidates = useMemo(() => scorecards.filter(s => s.rationalizationStatus === 'keep_hero'), [scorecards]);

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort(), [products]);

  // Filtered List
  const filteredScorecards = useMemo(() => {
    return scorecards.filter(s => {
      if (statusFilter !== 'ALL' && s.rationalizationStatus !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSku = s.sku.toLowerCase().includes(q);
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesCat = s.category.toLowerCase().includes(q);
        if (!matchesSku && !matchesName && !matchesCat) return false;
      }
      return true;
    }).sort((a, b) => a.healthScore - b.healthScore); // worst scores first
  }, [scorecards, statusFilter, categoryFilter, searchQuery]);

  const isUnlocked = useMemo(() => {
    if (!userProfile) return false;
    if (userProfile.subscriptionTier === 'pro_planner' || userProfile.subscriptionTier === 'enterprise_tier') return true;
    return userProfile.unlockedExports?.includes('sku_deletion_audit') || false;
  }, [userProfile]);

  const showToast = (message: string, onUndo?: () => void) => {
    setToast({ message, onUndo });
    setTimeout(() => setToast(null), 5000);
  };

  const handleUndo = () => {
    if (previousProducts) {
      onImportProducts(previousProducts);
      setPreviousProducts(null);
      setToast(null);
    }
  };

  const handleDeleteSku = (sku: string) => {
    setPreviousProducts(products);
    onDeleteProduct(sku);
    setSelectedSkus(prev => prev.filter(s => s !== sku));
    showToast(`Pruned SKU ${sku} from active catalog.`, handleUndo);
  };

  const handlePruneAllCandidates = () => {
    if (deletionCandidates.length === 0) return;
    const candidateSkus = deletionCandidates.map(s => s.sku);
    setPreviousProducts(products);
    onDeleteMultipleProducts(candidateSkus);
    setSelectedSkus([]);
    showToast(`Pruned ${candidateSkus.length} red-ink SKU deletion candidates.`, handleUndo);
  };

  const handleDownloadDeletionReport = () => {
    if (!isUnlocked && onUnlockExport) {
      onUnlockExport('sku_deletion_audit', 'SKU Deletion & Range Rationalization Audit (CSV/PDF)', 19);
      return;
    }

    const rows = [
      ['SKU Code', 'Product Name', 'Category', 'RRP (AUD)', 'Unit Cost (AUD)', 'Margin %', 'Weekly Units', 'Annual Baseline Val (AUD)', 'Health Score (0-100)', 'Rationalization Status', 'Primary Risk Factors'].join(','),
      ...scorecards.map(s => [
        `"${s.sku}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.category}"`,
        s.rrp.toFixed(2),
        s.cost.toFixed(2),
        `${s.marginPercent}%`,
        s.weeklyUnitsBaseline,
        s.annualBaselineRevAud.toFixed(2),
        s.healthScore,
        s.rationalizationStatus.toUpperCase(),
        `"${s.riskFactors.join('; ').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RangeCraft_SKU_Deletion_Rationalization_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              onClick={toast.onUndo}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>SKU Deletion & Range Rationalization Engine</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    Portfolio Health AI
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identify margin-dilutive lines, unviable stock-turn units, and recommend strategic deletions or vendor renegotiations.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {deletionCandidates.length > 0 && (
              <button
                onClick={handlePruneAllCandidates}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                title="Prune all red-ink candidates with 1 click"
              >
                <Trash2 className="w-4 h-4" />
                <span>Prune {deletionCandidates.length} Deletion Candidates</span>
              </button>
            )}

            <button
              onClick={handleDownloadDeletionReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export SKU Deletion Report (.CSV)</span>
            </button>
          </div>
        </div>

        {/* 4 Health Tier Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div 
            onClick={() => setStatusFilter('deletion_candidate')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'deletion_candidate' 
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30' 
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-700 font-bold mb-1">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Deletion Candidates
              </span>
              <span className="font-mono text-base font-black">{deletionCandidates.length}</span>
            </div>
            <p className="text-[11px] text-slate-500">Margin &lt; 25% or sluggish turn (&lt; 40 Health Score)</p>
          </div>

          <div 
            onClick={() => setStatusFilter('renegotiate_terms')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'renegotiate_terms' 
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30' 
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-700 font-bold mb-1">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Renegotiate Terms
              </span>
              <span className="font-mono text-base font-black">{renegotiateCandidates.length}</span>
            </div>
            <p className="text-[11px] text-slate-500">Requires scan funding or COGS price relief</p>
          </div>

          <div 
            onClick={() => setStatusFilter('optimize_margin')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'optimize_margin' 
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/30' 
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-blue-700 font-bold mb-1">
              <span className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-blue-600" />
                Optimize Margin
              </span>
              <span className="font-mono text-base font-black">{marginCandidates.length}</span>
            </div>
            <p className="text-[11px] text-slate-500">Solid volume lines with discount depth upside</p>
          </div>

          <div 
            onClick={() => setStatusFilter('keep_hero')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'keep_hero' 
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30' 
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Protect & Hero
              </span>
              <span className="font-mono text-base font-black">{heroCandidates.length}</span>
            </div>
            <p className="text-[11px] text-slate-500">Top-tier cash cows & front-cover anchor SKUs</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU code, name, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">All Categories ({categories.length})</option>
          {categories.map((c, idx) => (
            <option key={`cat-del-${c}-${idx}`} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">All Health Tiers ({products.length})</option>
          <option value="deletion_candidate">Deletion Candidates ({deletionCandidates.length})</option>
          <option value="renegotiate_terms">Renegotiate Terms ({renegotiateCandidates.length})</option>
          <option value="optimize_margin">Optimize Margin ({marginCandidates.length})</option>
          <option value="keep_hero">Protect & Hero ({heroCandidates.length})</option>
        </select>
      </div>

      {/* SKU Health Diagnostic Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span>Range Rationalization Matrix ({filteredScorecards.length} SKUs evaluated)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Sorted by lowest health score first</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">RRP / Cost</th>
                <th className="py-3 px-4 text-right">Margin</th>
                <th className="py-3 px-4 text-right">Velocity</th>
                <th className="py-3 px-4 text-center">Health Score</th>
                <th className="py-3 px-4">Strategic Action</th>
                <th className="py-3 px-4 text-right">Prune</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScorecards.map((item, idx) => {
                const isCandidate = item.rationalizationStatus === 'deletion_candidate';
                return (
                  <tr key={`sku-scorecard-${item.sku}-${idx}`} className={`hover:bg-slate-50/80 transition-colors ${isCandidate ? 'bg-rose-50/30' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{item.category}</div>
                      <div className="text-[10px] text-slate-400">{item.subcategory}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">${item.rrp.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">COGS: ${item.cost.toFixed(2)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className={`font-black ${
                        item.marginPercent >= 50 ? 'text-emerald-600' :
                        item.marginPercent >= 35 ? 'text-blue-600' :
                        item.marginPercent >= 25 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {item.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-800">{item.weeklyUnitsBaseline} u/wk</div>
                      <div className="text-[10px] text-slate-400">{formatAud(item.annualBaselineRevAud)}/yr</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono font-black text-xs border bg-white shadow-2xs"
                        style={{
                          borderColor: item.healthScore >= 75 ? '#86efac' : item.healthScore >= 55 ? '#93c5fd' : item.healthScore >= 40 ? '#fde047' : '#fca5a5',
                          color: item.healthScore >= 75 ? '#166534' : item.healthScore >= 55 ? '#1e40af' : item.healthScore >= 40 ? '#854d0e' : '#991b1b'
                        }}
                      >
                        <span>{item.healthScore} / 100</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.rationalizationStatus === 'deletion_candidate' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Delete / Prune SKU
                        </span>
                      )}
                      {item.rationalizationStatus === 'renegotiate_terms' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          Renegotiate Vendor Rebate
                        </span>
                      )}
                      {item.rationalizationStatus === 'optimize_margin' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          <Percent className="w-3 h-3 text-blue-600" />
                          Reduce Promo Depth
                        </span>
                      )}
                      {item.rationalizationStatus === 'keep_hero' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Protect Hero Slot
                        </span>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1 max-w-xs truncate" title={item.riskFactors[0] || item.opportunityFactors[0]}>
                        {item.riskFactors[0] || item.opportunityFactors[0] || 'Standard commercial profile'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSku(item.sku)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={`Delete ${item.sku}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
