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
  X,
  ChevronRight,
  Undo2,
  Check
} from 'lucide-react';

interface SkuDeletionEngineViewProps {
  products: Product[];
  promotions: WeekPromotion[];
  onDeleteProduct?: (sku: string) => void;
  onDeleteMultipleProducts?: (skus: string[]) => void;
  onImportProducts?: (products: Product[]) => void;
  onUnlockExport?: (exportId: string, itemName: string, priceAud: number) => void;
  onOpenPricingModal?: () => void;
  userProfile?: UserProfile | null;
  currentTheme?: ThemeMode;
  embedded?: boolean;
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
  onOpenPricingModal,
  userProfile,
  currentTheme = 'light',
  embedded = false,
}) => {
  const isLight = currentTheme.includes('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'deletion_candidate' | 'renegotiate_terms' | 'optimize_margin' | 'keep_hero'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [inspectedScorecard, setInspectedScorecard] = useState<SkuHealthScorecard | null>(null);
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
        riskFactors.push(`Over-promoted (${promoWeeks} weeks) — risk of Custom Rules hiatus breach`);
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
      onImportProducts?.(previousProducts);
      setPreviousProducts(null);
      setToast(null);
    }
  };

  const handleDeleteSku = (sku: string) => {
    setPreviousProducts(products);
    if (onDeleteProduct) {
      onDeleteProduct(sku);
    } else if (onImportProducts) {
      onImportProducts(products.filter(p => p.sku !== sku));
    }
    setSelectedSkus(prev => prev.filter(s => s !== sku));
    if (inspectedScorecard?.sku === sku) {
      setInspectedScorecard(null);
    }
    showToast(`Pruned SKU ${sku} from active catalog.`, handleUndo);
  };

  const handlePruneAllCandidates = () => {
    if (deletionCandidates.length === 0) return;
    const candidateSkus = deletionCandidates.map(s => s.sku);
    setPreviousProducts(products);
    if (onDeleteMultipleProducts) {
      onDeleteMultipleProducts(candidateSkus);
    } else if (onImportProducts) {
      onImportProducts(products.filter(p => !candidateSkus.includes(p.sku)));
    }
    setSelectedSkus([]);
    setInspectedScorecard(null);
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
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-8">
      {/* Toast (lifted cleanly above mobile bottom nav) */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 inset-x-3 md:inset-x-auto md:right-6 z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-2xl border border-slate-700 text-xs font-semibold">
          <span className="min-w-0">{toast.message}</span>
          {toast.onUndo && (
            <button
              onClick={toast.onUndo}
              className="min-h-[36px] px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* Header Banner (compact action strip when embedded in Range Review tabs) */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {!embedded ? (
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  SKU Deletion &amp; Rationalization Engine
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Identify margin-dilutive lines, slow stock-turn units, and vendor renegotiation opportunities.
                </p>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Range Health &amp; Rationalization Review
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tap any tier card to filter, or tap a SKU row for full risk diagnostics and 1-tap pruning.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-row items-center gap-2 shrink-0 flex-wrap">
            {deletionCandidates.length > 0 && (
              <button
                onClick={handlePruneAllCandidates}
                className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Prune all red-ink candidates with 1 click"
              >
                <Trash2 className="w-4 h-4" />
                <span>Prune {deletionCandidates.length} Candidates</span>
              </button>
            )}

            <button
              onClick={handleDownloadDeletionReport}
              className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Health Tier Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'deletion_candidate' ? 'ALL' : 'deletion_candidate')}
            className={`text-left p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'deletion_candidate' 
                ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/50 ring-2 ring-rose-400/30' 
                : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-rose-700 dark:text-rose-300 font-bold mb-1 gap-1">
              <span className="flex items-center gap-1 truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="truncate">Deletion</span>
              </span>
              <span className="font-mono text-sm sm:text-base font-black tabular-nums">{deletionCandidates.length}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">Margin &lt; 25% or sluggish turn</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'renegotiate_terms' ? 'ALL' : 'renegotiate_terms')}
            className={`text-left p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'renegotiate_terms' 
                ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/50 ring-2 ring-amber-400/30' 
                : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 font-bold mb-1 gap-1">
              <span className="flex items-center gap-1 truncate">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">Renegotiate</span>
              </span>
              <span className="font-mono text-sm sm:text-base font-black tabular-nums">{renegotiateCandidates.length}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">Needs scan rebate or COGS relief</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'optimize_margin' ? 'ALL' : 'optimize_margin')}
            className={`text-left p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'optimize_margin' 
                ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/50 ring-2 ring-blue-400/30' 
                : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-blue-700 dark:text-blue-300 font-bold mb-1 gap-1">
              <span className="flex items-center gap-1 truncate">
                <Percent className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Optimize</span>
              </span>
              <span className="font-mono text-sm sm:text-base font-black tabular-nums">{marginCandidates.length}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">Solid turn with discount upside</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'keep_hero' ? 'ALL' : 'keep_hero')}
            className={`text-left p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'keep_hero' 
                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/50 ring-2 ring-emerald-400/30' 
                : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300 font-bold mb-1 gap-1">
              <span className="flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Protect Hero</span>
              </span>
              <span className="font-mono text-sm sm:text-base font-black tabular-nums">{heroCandidates.length}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">Top cash cows &amp; anchor SKUs</p>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU code, name, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[42px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer min-w-0 truncate"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c, idx) => (
              <option key={`cat-del-${c}-${idx}`} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="min-h-[42px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer min-w-0 truncate"
          >
            <option value="ALL">All Tiers ({products.length})</option>
            <option value="deletion_candidate">Deletion ({deletionCandidates.length})</option>
            <option value="renegotiate_terms">Renegotiate ({renegotiateCandidates.length})</option>
            <option value="optimize_margin">Optimize ({marginCandidates.length})</option>
            <option value="keep_hero">Protect ({heroCandidates.length})</option>
          </select>
        </div>
      </div>

      {/* SKU Health Diagnostic Matrix */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Range Rationalization Matrix ({filteredScorecards.length} SKUs)
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sorted by lowest health score first</span>
        </div>

        {/* Compact Mobile Health List (< md) — Tap any SKU for bottom-sheet inspection */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {filteredScorecards.length === 0 ? (
            <div className="py-10 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
              No SKUs match this health filter.
            </div>
          ) : (
            filteredScorecards.map((item, idx) => {
              const isCandidate = item.rationalizationStatus === 'deletion_candidate';
              const statusLabel =
                item.rationalizationStatus === 'deletion_candidate' ? 'Deletion' :
                item.rationalizationStatus === 'renegotiate_terms' ? 'Renegotiate' :
                item.rationalizationStatus === 'optimize_margin' ? 'Optimize' : 'Protect Hero';
              const statusColor =
                item.rationalizationStatus === 'deletion_candidate' ? 'text-rose-600 dark:text-rose-400' :
                item.rationalizationStatus === 'renegotiate_terms' ? 'text-amber-600 dark:text-amber-400' :
                item.rationalizationStatus === 'optimize_margin' ? 'text-blue-600 dark:text-blue-400' :
                'text-emerald-600 dark:text-emerald-400';

              return (
                <button
                  key={`m-scorecard-${item.sku}-${idx}`}
                  type="button"
                  onClick={() => setInspectedScorecard(item)}
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isCandidate ? 'bg-rose-50/40 dark:bg-rose-950/15' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">{item.sku}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                      <span className={`text-[11px] font-bold truncate ${statusColor}`}>{statusLabel}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">{item.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 tabular-nums">
                      ${item.rrp.toFixed(2)} RRP · {item.marginPercent.toFixed(1)}% GM · {item.weeklyUnitsBaseline} u/wk
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right tabular-nums">
                      <span className={`font-mono text-sm font-black block ${statusColor}`}>
                        {item.healthScore}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/100</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Desktop Table View (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredScorecards.map((item, idx) => {
                const isCandidate = item.rationalizationStatus === 'deletion_candidate';
                return (
                  <tr key={`sku-scorecard-${item.sku}-${idx}`} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${isCandidate ? 'bg-rose-50/30 dark:bg-rose-950/15' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>{item.category}</div>
                      <div className="text-[10px] text-slate-400">{item.subcategory}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <div className="font-bold text-slate-900 dark:text-white">${item.rrp.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">COGS: ${item.cost.toFixed(2)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span className={`font-black ${
                        item.marginPercent >= 50 ? 'text-emerald-600 dark:text-emerald-400' :
                        item.marginPercent >= 35 ? 'text-blue-600 dark:text-blue-400' :
                        item.marginPercent >= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.weeklyUnitsBaseline} u/wk</div>
                      <div className="text-[10px] text-slate-400">{formatAud(item.annualBaselineRevAud)}/yr</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono font-black text-xs border tabular-nums ${
                        item.healthScore >= 75 ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300' :
                        item.healthScore >= 55 ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300' :
                        item.healthScore >= 40 ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300' :
                        'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
                      }`}>
                        <span>{item.healthScore} / 100</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.rationalizationStatus === 'deletion_candidate' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          Delete / Prune SKU
                        </span>
                      )}
                      {item.rationalizationStatus === 'renegotiate_terms' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                          <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          Renegotiate Vendor Rebate
                        </span>
                      )}
                      {item.rationalizationStatus === 'optimize_margin' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                          <Percent className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          Reduce Promo Depth
                        </span>
                      )}
                      {item.rationalizationStatus === 'keep_hero' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Protect Hero Slot
                        </span>
                      )}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs truncate" title={item.riskFactors[0] || item.opportunityFactors[0]}>
                        {item.riskFactors[0] || item.opportunityFactors[0] || 'Standard commercial profile'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSku(item.sku)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
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

      {/* Mobile SKU Health Detail Bottom Sheet */}
      {inspectedScorecard && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xs flex items-end md:items-center md:justify-end"
          onClick={() => setInspectedScorecard(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Health details for ${inspectedScorecard.name}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-md md:h-full max-h-[88dvh] md:max-h-none bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-none p-5 overflow-y-auto shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {inspectedScorecard.sku} · {inspectedScorecard.category}
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {inspectedScorecard.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedScorecard(null)}
                aria-label="Close health details"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs tabular-nums">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Health Score</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white">{inspectedScorecard.healthScore}/100</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Base Margin</span>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{inspectedScorecard.marginPercent.toFixed(1)}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Velocity</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white">{inspectedScorecard.weeklyUnitsBaseline} u/wk</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">RRP / Unit COGS</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  ${inspectedScorecard.rrp.toFixed(2)} / ${inspectedScorecard.cost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Annual Baseline Val</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatAud(inspectedScorecard.annualBaselineRevAud)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">52-Wk Promo Slots</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {inspectedScorecard.promoWeeksCount} weeks
                </span>
              </div>
            </div>

            {inspectedScorecard.riskFactors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-1.5">
                <div className="text-xs font-bold text-rose-700 dark:text-rose-300">Risk Factors</div>
                <ul className="space-y-1 text-xs text-rose-700 dark:text-rose-200 list-disc pl-4">
                  {inspectedScorecard.riskFactors.map((rf, rIdx) => (
                    <li key={rIdx}>{rf}</li>
                  ))}
                </ul>
              </div>
            )}

            {inspectedScorecard.opportunityFactors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Commercial Strengths</div>
                <ul className="space-y-1 text-xs text-emerald-700 dark:text-emerald-200 list-disc pl-4">
                  {inspectedScorecard.opportunityFactors.map((of, oIdx) => (
                    <li key={oIdx}>{of}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleDeleteSku(inspectedScorecard.sku)}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Prune SKU</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectedScorecard(null)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
