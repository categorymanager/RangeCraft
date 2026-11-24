import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Boxes,
  Search,
  X,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Download,
  SlidersHorizontal,
  Edit3,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { Product, WeekPromotion, ThemeMode } from '../types';
import { formatAud } from '../utils/formatters';
import {
  buildSkuPromoDemandMap,
  computeSkuInventoryForecast,
  InventoryStatus,
  normalizeOptionalStock,
} from '../utils/inventoryForecast';

interface SkuInventoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  promotions: WeekPromotion[];
  onUpdateProducts: (updated: Product[]) => void;
  onOpenAddSku?: () => void;
  onOpenEditRange?: () => void;
  currentTheme?: ThemeMode;
}

export const SkuInventoryManagerModal: React.FC<SkuInventoryManagerModalProps> = ({
  isOpen,
  onClose,
  products,
  promotions,
  onUpdateProducts,
  onOpenAddSku,
  onOpenEditRange,
  currentTheme = 'light'
}) => {
  const isLight = currentTheme.includes('light');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InventoryStatus>('ALL');
  const [sortBy, setSortBy] = useState<'stock' | 'value' | 'sku' | 'shortage'>('shortage');
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState<string>('');

  // Mobile progressive-disclosure state
  const [isMobileKpisExpanded, setIsMobileKpisExpanded] = useState(false);
  const [isMobileFilterSheetOpen, setIsMobileFilterSheetOpen] = useState(false);

  // Calculate 52-week promotional demand per SKU
  const promoDemandMap = useMemo(
    () => buildSkuPromoDemandMap(products, promotions),
    [products, promotions]
  );

  // Enriched SKU Inventory Items
  const inventoryItems = useMemo(() => {
    return products.map(product => {
      const promoInfo = promoDemandMap.get(product.sku) || { totalPromoUnits: 0, peakWeekDemand: 0, promoWeeksCount: 0 };
      const forecast = computeSkuInventoryForecast(product, promoInfo);

      return {
        ...product,
        hasInventory: forecast.hasInventory,
        currentStock: forecast.currentStock,
        allocatedForPromo: forecast.allocatedForPromo,
        freeAvailableStock: forecast.freeAvailableStock,
        inventoryValueAud: forecast.inventoryValueAud,
        safetyStockThreshold: forecast.safetyStockThreshold,
        shortageRisk: forecast.hasStockoutWarning,
        criticalShortage: forecast.stockStatus === 'CRITICAL',
        stockStatus: forecast.stockStatus,
        weeksOfSupply: forecast.weeksOfCover,
        peakWeekDemand: promoInfo.peakWeekDemand,
        promoWeeksCount: promoInfo.promoWeeksCount,
      };
    });
  }, [products, promoDemandMap]);

  // Aggregate Metrics (only sum entered/tracked physical inventory; untracked SKUs never skew totals or shortages)
  const summaryMetrics = useMemo(() => {
    const trackedItems = inventoryItems.filter(item => item.hasInventory);
    const totalPhysicalUnits = trackedItems.reduce((sum, item) => sum + (item.currentStock || 0), 0);
    const totalInventoryValueAud = trackedItems.reduce((sum, item) => sum + (item.inventoryValueAud || 0), 0);
    const totalAllocatedPromoUnits = inventoryItems.reduce((sum, item) => sum + item.allocatedForPromo, 0);
    const totalFreeStock = trackedItems.reduce((sum, item) => sum + (item.freeAvailableStock || 0), 0);
    const criticalStockouts = trackedItems.filter(item => item.stockStatus === 'CRITICAL').length;
    const lowStockAlerts = trackedItems.filter(item => item.stockStatus === 'LOW').length;
    const healthyCount = trackedItems.filter(item => item.stockStatus === 'HEALTHY').length;

    return {
      trackedCount: trackedItems.length,
      untrackedCount: inventoryItems.length - trackedItems.length,
      totalPhysicalUnits,
      totalInventoryValueAud,
      totalAllocatedPromoUnits,
      totalFreeStock,
      criticalStockouts,
      lowStockAlerts,
      healthyCount
    };
  }, [inventoryItems]);

  // Filtered and Sorted Items
  const filteredItems = useMemo(() => {
    return inventoryItems
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        const matchesStatus = statusFilter === 'ALL' || item.stockStatus === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'shortage') {
          const rank = (s: InventoryStatus) =>
            s === 'CRITICAL' ? 4 : s === 'LOW' ? 3 : s === 'HEALTHY' ? 2 : s === 'OVERSTOCKED' ? 1 : 0;
          return rank(b.stockStatus) - rank(a.stockStatus);
        }
        if (sortBy === 'stock') return (b.currentStock ?? -1) - (a.currentStock ?? -1);
        if (sortBy === 'value') return (b.inventoryValueAud ?? -1) - (a.inventoryValueAud ?? -1);
        return a.sku.localeCompare(b.sku);
      });
  }, [inventoryItems, searchQuery, selectedCategory, statusFilter, sortBy]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();
  }, [products]);

  const activeFilterCount =
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (statusFilter !== 'ALL' ? 1 : 0) +
    (sortBy !== 'shortage' ? 1 : 0);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setStatusFilter('ALL');
    setSortBy('shortage');
  };

  // Adjust stock level handler
  const handleAdjustStock = (sku: string, delta: number) => {
    const updated = products.map(p => {
      if (p.sku === sku) {
        const existing = normalizeOptionalStock(p.stockLevel);
        if (existing === undefined && delta <= 0) {
          return p;
        }
        const current = existing ?? 0;
        const newStock = Math.max(0, current + delta);
        return { ...p, stockLevel: newStock };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Set explicit stock level handler (blank string clears back to unconstrained)
  const handleSaveStock = (sku: string, rawVal: string) => {
    const normalized = normalizeOptionalStock(rawVal);
    const updated = products.map(p => {
      if (p.sku === sku) {
        const next = { ...p };
        if (normalized !== undefined) {
          next.stockLevel = normalized;
        } else {
          delete next.stockLevel;
        }
        return next;
      }
      return p;
    });
    onUpdateProducts(updated);
    setEditingSku(null);
  };

  // Clear stock back to blank / unconstrained
  const handleClearStock = (sku: string) => {
    const updated = products.map(p => {
      if (p.sku === sku) {
        const next = { ...p };
        delete next.stockLevel;
        return next;
      }
      return p;
    });
    onUpdateProducts(updated);
    if (editingSku === sku) {
      setEditingSku(null);
    }
  };

  // Batch replenishment (+20% / +50% across filtered SKUs that have inventory entered)
  const handleBatchReplenish = (multiplier: number) => {
    const targetSkus = new Set(filteredItems.filter(i => i.hasInventory).map(i => i.sku));
    if (targetSkus.size === 0) return;
    const updated = products.map(p => {
      if (targetSkus.has(p.sku) && typeof p.stockLevel === 'number' && Number.isFinite(p.stockLevel)) {
        return { ...p, stockLevel: Math.round(p.stockLevel * multiplier) };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Export inventory CSV
  const handleExportCsv = () => {
    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Unit Cost (AUD)',
      'RRP (AUD)',
      'Current Stock Units',
      'Allocated Promo Units (52W)',
      'Free Available Stock',
      'Inventory Value (AUD)',
      'Safety Stock Threshold',
      'Weeks of Cover',
      'Stock Status'
    ];

    const rows = inventoryItems.map(item => [
      item.sku,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      item.cost.toFixed(2),
      item.rrp.toFixed(2),
      item.currentStock !== null ? item.currentStock : '',
      item.allocatedForPromo,
      item.freeAvailableStock !== null ? item.freeAvailableStock : '',
      item.inventoryValueAud !== null ? item.inventoryValueAud.toFixed(2) : '',
      item.safetyStockThreshold,
      item.weeksOfSupply !== null ? item.weeksOfSupply : 'Unconstrained',
      item.stockStatus === 'UNTRACKED' ? 'Unconstrained (Blank)' : item.stockStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RangeCraft_SKU_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col sm:items-center sm:justify-center p-0 sm:p-6 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full h-[100dvh] sm:h-auto sm:max-h-[92dvh] sm:max-w-6xl rounded-none sm:rounded-3xl border-0 sm:border shadow-2xl overflow-hidden flex flex-col ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#0f1424] border-slate-700 text-slate-100'
        }`}
      >
        {/* FIXED TOP HEADER BAR */}
        <div className={`px-3.5 py-2.5 sm:px-8 sm:py-5 border-b flex items-center justify-between gap-2.5 shrink-0 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-500 flex items-center justify-center font-bold shrink-0">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 min-w-0">
                <h2 className="text-[15px] sm:text-xl font-black tracking-tight truncate">
                  <span className="sm:hidden">Warehouse Inventory</span>
                  <span className="hidden sm:inline">SKU & Warehouse Inventory Manager</span>
                </h2>
                <span className="sm:hidden text-[11px] font-mono tabular-nums font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                  {filteredItems.length}/{products.length}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">
                Track warehouse stock & reserve 52-week promo units.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenEditRange && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditRange();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Product Range</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
              title="Download full stock audit CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close inventory manager"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MOBILE 1-LINE COMPACT KPI SUMMARY STRIP */}
        <div className={`md:hidden px-3.5 py-2 border-b flex items-center justify-between gap-2 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#12172a] border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 overflow-x-auto no-scrollbar text-[11px] whitespace-nowrap">
            <span className="inline-flex items-baseline gap-1">
              <span className="text-slate-500 dark:text-slate-400">Val</span>
              <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                {formatAud(summaryMetrics.totalInventoryValueAud)}
              </span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="inline-flex items-baseline gap-1">
              <span className="text-slate-500 dark:text-slate-400">Res</span>
              <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                {summaryMetrics.totalAllocatedPromoUnits.toLocaleString()}
              </span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="inline-flex items-baseline gap-1">
              <span className="text-slate-500 dark:text-slate-400">Free</span>
              <span className={`font-mono tabular-nums font-bold ${
                summaryMetrics.trackedCount === 0
                  ? 'text-slate-400'
                  : summaryMetrics.totalFreeStock === 0
                  ? 'text-rose-500'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {summaryMetrics.trackedCount > 0 ? summaryMetrics.totalFreeStock.toLocaleString() : '—'}
              </span>
            </span>
            {summaryMetrics.criticalStockouts > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {summaryMetrics.criticalStockouts} Crit
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileKpisExpanded(prev => !prev)}
            className={`min-h-[34px] px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer transition-colors ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
            aria-expanded={isMobileKpisExpanded}
          >
            <span>{isMobileKpisExpanded ? 'Hide' : 'KPIs'}</span>
            {isMobileKpisExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 4 TOP INVENTORY KPI METRICS CARDS (Collapsed on mobile unless expanded; always visible on md+) */}
        <div className={`${isMobileKpisExpanded ? 'grid' : 'hidden md:grid'} grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 p-3.5 sm:px-8 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0`}>
          <div className={`p-3 sm:p-3.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'}`}>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Stock Valuation
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                {summaryMetrics.trackedCount > 0 ? formatAud(summaryMetrics.totalInventoryValueAud) : '—'}
              </span>
              {summaryMetrics.trackedCount > 0 && (
                <span className="text-[10px] text-slate-400 font-mono">at COGS</span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5 block">
              {summaryMetrics.trackedCount > 0
                ? `${summaryMetrics.totalPhysicalUnits.toLocaleString()} units (${summaryMetrics.trackedCount} tracked)`
                : 'No inventory entered yet'}
            </span>
          </div>

          <div className={`p-3 sm:p-3.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'}`}>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              52W Promo Reserved
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-amber-500">
                {summaryMetrics.totalAllocatedPromoUnits.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">units</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Committed to active calendar
            </span>
          </div>

          <div className={`p-3 sm:p-3.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'}`}>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Free Unallocated Stock
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-emerald-500">
                {summaryMetrics.trackedCount > 0 ? summaryMetrics.totalFreeStock.toLocaleString() : '—'}
              </span>
              {summaryMetrics.trackedCount > 0 && <span className="text-[10px] text-slate-400">units</span>}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block font-mono tabular-nums">
              {summaryMetrics.untrackedCount} SKU{summaryMetrics.untrackedCount === 1 ? '' : 's'} unconstrained (blank)
            </span>
          </div>

          <div className={`p-3 sm:p-3.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'}`}>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Stockout Vulnerabilities
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-lg sm:text-xl font-black font-mono tabular-nums ${summaryMetrics.criticalStockouts > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {summaryMetrics.criticalStockouts}
              </span>
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                Critical
              </span>
              <span className="text-xs text-amber-500 font-bold font-mono tabular-nums">
                {summaryMetrics.lowStockAlerts} Low
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5 block">
              {summaryMetrics.healthyCount} healthy · blank SKUs ignored
            </span>
          </div>
        </div>

        {/* CONTROLS & FILTER TOOLBAR */}
        <div className={`px-3.5 py-2.5 sm:px-8 sm:py-3.5 border-b flex items-center justify-between gap-2 sm:gap-3 shrink-0 ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#12172a] border-slate-800'
        }`}>
          {/* Search Input (shared mobile + desktop) */}
          <div className="flex items-center gap-2 flex-1 min-w-0 md:max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search SKU code, name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full min-h-[44px] md:min-h-0 pl-9 pr-8 py-2 md:py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Single Filters & Batch Sheet Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterSheetOpen(true)}
            className={`md:hidden min-h-[44px] px-3.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition-colors ${
              activeFilterCount > 0
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span>Filters &amp; Batch</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Desktop Inline Controls */}
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="CRITICAL">Critical Stockout Risk</option>
              <option value="LOW">Low Safety Stock</option>
              <option value="HEALTHY">Healthy Buffer</option>
              <option value="OVERSTOCKED">Overstocked</option>
              <option value="UNTRACKED">Blank / Unconstrained</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <option value="shortage">Sort: Shortage Priority</option>
              <option value="stock">Sort: Stock High → Low</option>
              <option value="value">Sort: Stock Value $</option>
              <option value="sku">Sort: SKU Code</option>
            </select>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-2">Batch:</span>
              <button
                type="button"
                onClick={() => handleBatchReplenish(1.2)}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                title="Increase current stock of filtered SKUs by 20%"
              >
                +20%
              </button>
              <button
                type="button"
                onClick={() => handleBatchReplenish(1.5)}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                title="Increase current stock of filtered SKUs by 50%"
              >
                +50%
              </button>
            </div>
          </div>
        </div>

        {/* SKU INVENTORY BODY (MOBILE CARDS + DESKTOP TABLE) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:px-8 sm:py-4">
          {filteredItems.length === 0 ? (
            <div className={`rounded-2xl border p-8 text-center ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-slate-800'
            }`}>
              <p className="text-sm font-bold">No matching SKUs found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try clearing your search query or adjusting your stock status filter.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 min-h-[40px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <>
              {/* MOBILE COMPACT SKU CARDS (< md) */}
              <div className="md:hidden space-y-2.5">
                {filteredItems.map(item => {
                  const isEditing = editingSku === item.sku;

                  return (
                    <div
                      key={item.sku}
                      className={`rounded-2xl border p-3.5 transition-colors ${
                        item.stockStatus === 'CRITICAL'
                          ? isLight
                            ? 'bg-rose-50/40 border-rose-200'
                            : 'bg-rose-950/20 border-rose-900/50'
                          : isLight
                            ? 'bg-white border-slate-200'
                            : 'bg-[#141a28] border-slate-800'
                      }`}
                    >
                      {/* Top Metadata Row: SKU · Category + Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 truncate text-[11px]">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                            {item.sku}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 dark:text-slate-400 truncate font-medium">
                            {item.category}
                          </span>
                        </div>

                        <div className="shrink-0">
                          {item.stockStatus === 'CRITICAL' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              Stockout Risk
                            </span>
                          )}
                          {item.stockStatus === 'LOW' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Low Cover
                            </span>
                          )}
                          {item.stockStatus === 'HEALTHY' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              Healthy
                            </span>
                          )}
                          {item.stockStatus === 'OVERSTOCKED' && (
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              Overstocked
                            </span>
                          )}
                          {item.stockStatus === 'UNTRACKED' && (
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              Unconstrained
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Name + Velocity Meta */}
                      <div className="mt-1">
                        <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-white truncate" title={item.name}>
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                          {item.weeklyUnitsBaseline}/wk · {item.weeksOfSupply !== null ? `${item.weeksOfSupply} wks cover` : 'Cover unconstrained'} · ${item.cost.toFixed(2)} COGS
                        </p>
                      </div>

                      {/* 3-Column Metrics Strip: On Hand | 52W Demand | Free Stock */}
                      <div className={`grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t ${
                        isLight ? 'border-slate-100' : 'border-slate-800/80'
                      }`}>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                            On Hand
                          </span>
                          {isEditing ? (
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="number"
                                min={0}
                                placeholder="Blank"
                                value={editStockValue}
                                onChange={(e) => setEditStockValue(e.target.value)}
                                className={`w-full min-w-0 px-2 py-1 rounded-lg border font-mono tabular-nums font-bold text-xs ${
                                  isLight ? 'bg-white border-indigo-400 text-slate-900' : 'bg-slate-900 border-indigo-500 text-white'
                                }`}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSku(item.sku);
                                setEditStockValue(item.currentStock !== null ? String(item.currentStock) : '');
                              }}
                              className="mt-0.5 inline-flex items-center gap-1 font-mono tabular-nums font-black text-sm text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                              title="Tap to edit or leave blank"
                            >
                              <span>{item.currentStock !== null ? item.currentStock.toLocaleString() : '—'}</span>
                              <Edit3 className="w-3 h-3 text-slate-400 shrink-0" />
                            </button>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums block">
                            {item.hasInventory ? `Safe ${item.safetyStockThreshold.toLocaleString()}` : 'Leave blank = open'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                            52W Demand
                          </span>
                          <span className="mt-0.5 block font-mono tabular-nums font-black text-sm text-amber-600 dark:text-amber-400">
                            {item.allocatedForPromo.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums block">
                            {item.promoWeeksCount} promos
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                            Free Stock
                          </span>
                          <span className={`mt-0.5 block font-mono tabular-nums font-black text-sm ${
                            !item.hasInventory
                              ? 'text-slate-400'
                              : item.freeAvailableStock === 0
                              ? 'text-rose-500'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {item.freeAvailableStock !== null ? item.freeAvailableStock.toLocaleString() : '—'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums block">
                            {item.inventoryValueAud !== null ? formatAud(item.inventoryValueAud) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Strip */}
                      <div className="mt-2.5 flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveStock(item.sku, editStockValue)}
                              className="flex-1 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearStock(item.sku)}
                              className="min-h-[40px] px-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSku(null)}
                              className={`min-h-[40px] px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                                isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
                              }`}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item.sku, -100)}
                              disabled={!item.hasInventory}
                              className={`flex-1 min-h-[40px] rounded-xl border text-xs font-mono tabular-nums font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                isLight
                                  ? 'bg-slate-50 border-slate-200 text-slate-700 active:bg-slate-200'
                                  : 'bg-slate-900 border-slate-700 text-slate-200 active:bg-slate-800'
                              }`}
                            >
                              <Minus className="w-3 h-3" />
                              100
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item.sku, 100)}
                              className={`flex-1 min-h-[40px] rounded-xl border text-xs font-mono tabular-nums font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                isLight
                                  ? 'bg-slate-50 border-slate-200 text-slate-700 active:bg-slate-200'
                                  : 'bg-slate-900 border-slate-700 text-slate-200 active:bg-slate-800'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                              100
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item.sku, 500)}
                              className={`flex-1 min-h-[40px] rounded-xl border text-xs font-mono tabular-nums font-bold inline-flex items-center justify-center cursor-pointer transition-colors ${
                                isLight
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 active:bg-indigo-100'
                                  : 'bg-indigo-950/60 border-indigo-800 text-indigo-300 active:bg-indigo-900/60'
                              }`}
                            >
                              +500
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSku(item.sku);
                                setEditStockValue(item.currentStock !== null ? String(item.currentStock) : '');
                              }}
                              className={`min-h-[40px] px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center cursor-pointer transition-colors ${
                                isLight
                                  ? 'bg-white border-slate-200 text-slate-600 active:bg-slate-100'
                                  : 'bg-slate-900 border-slate-700 text-slate-300 active:bg-slate-800'
                              }`}
                              aria-label={`Edit exact stock for ${item.sku}`}
                            >
                              {item.hasInventory ? 'Edit' : 'Set'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP FULL 9-COLUMN TABLE (md+) */}
              <div className={`hidden md:block rounded-2xl border overflow-hidden shadow-xs ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-slate-800'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b font-bold tracking-wider ${
                      isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-[#0d1220] text-slate-300 border-slate-800'
                    }`}>
                      <tr>
                        <th className="p-3.5 font-bold">SKU & Product Name</th>
                        <th className="p-3.5 font-bold">Category</th>
                        <th className="p-3.5 font-bold text-right">Unit COGS</th>
                        <th className="p-3.5 font-bold text-center">Warehouse Stock</th>
                        <th className="p-3.5 font-bold text-center">52W Promo Demand</th>
                        <th className="p-3.5 font-bold text-center">Free Stock</th>
                        <th className="p-3.5 font-bold text-right">Total Value</th>
                        <th className="p-3.5 font-bold text-center">Status</th>
                        <th className="p-3.5 font-bold text-center">Quick Adjust</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filteredItems.map(item => {
                        const isEditing = editingSku === item.sku;

                        return (
                          <tr
                            key={item.sku}
                            className={`transition-colors ${
                              item.stockStatus === 'CRITICAL'
                                ? isLight ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'bg-rose-950/20 hover:bg-rose-950/30'
                                : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                            }`}
                          >
                            {/* SKU Name & Code */}
                            <td className="p-3.5">
                              <div className="font-bold font-mono text-indigo-600 dark:text-indigo-400 text-[11px]">
                                {item.sku}
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-white max-w-xs truncate" title={item.name}>
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums">
                                Baseline: {item.weeklyUnitsBaseline} u/wk ·{' '}
                                {item.weeksOfSupply !== null ? `${item.weeksOfSupply} wks cover` : 'Cover unconstrained'}
                              </div>
                            </td>

                            {/* Category */}
                            <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                              {item.category}
                            </td>

                            {/* Unit COGS */}
                            <td className="p-3.5 font-mono tabular-nums text-right text-slate-700 dark:text-slate-300">
                              ${item.cost.toFixed(2)}
                            </td>

                            {/* Warehouse Stock Level */}
                            <td className="p-3.5 text-center">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    placeholder="Blank"
                                    value={editStockValue}
                                    onChange={(e) => setEditStockValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveStock(item.sku, editStockValue);
                                      if (e.key === 'Escape') setEditingSku(null);
                                    }}
                                    className="w-20 px-2 py-1 rounded border text-center font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveStock(item.sku, editStockValue)}
                                    className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleClearStock(item.sku)}
                                    className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[10px] font-bold cursor-pointer"
                                    title="Clear stock back to blank"
                                  >
                                    Clear
                                  </button>
                                </div>
                              ) : item.currentStock !== null ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSku(item.sku);
                                    setEditStockValue(String(item.currentStock));
                                  }}
                                  className="font-mono tabular-nums font-bold text-sm cursor-pointer hover:underline text-slate-900 dark:text-white inline-flex items-center gap-1"
                                  title="Click to edit or clear stock level"
                                >
                                  <span>{item.currentStock.toLocaleString()}</span>
                                  <Edit3 className="w-3 h-3 text-slate-400" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSku(item.sku);
                                    setEditStockValue('');
                                  }}
                                  className="font-mono tabular-nums text-xs font-semibold cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center gap-1"
                                  title="Click to enter physical stock units"
                                >
                                  <span>—</span>
                                  <span className="text-[10px] underline">Set Stock</span>
                                </button>
                              )}
                              <span className="text-[9px] text-slate-400 block font-mono tabular-nums">
                                {item.hasInventory ? `Safety: ${item.safetyStockThreshold}` : 'Blank = unconstrained'}
                              </span>
                            </td>

                            {/* 52W Promo Demand */}
                            <td className="p-3.5 text-center">
                              <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                                {item.allocatedForPromo.toLocaleString()}
                              </span>
                              <span className="text-[9px] text-slate-400 block">
                                across {item.promoWeeksCount} promos
                              </span>
                            </td>

                            {/* Free Stock */}
                            <td className="p-3.5 text-center">
                              {item.freeAvailableStock !== null ? (
                                <span className={`font-mono tabular-nums font-bold ${item.freeAvailableStock === 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {item.freeAvailableStock.toLocaleString()}
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400">—</span>
                              )}
                            </td>

                            {/* Total Stock Value */}
                            <td className="p-3.5 font-mono tabular-nums font-bold text-right text-slate-900 dark:text-white">
                              {item.inventoryValueAud !== null
                                ? `$${item.inventoryValueAud.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                : <span className="text-slate-400 font-normal">—</span>}
                            </td>

                            {/* Status Indicator */}
                            <td className="p-3.5 text-center">
                              {item.stockStatus === 'CRITICAL' && (
                                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-[11px] font-bold whitespace-nowrap">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  Stockout Risk
                                </span>
                              )}
                              {item.stockStatus === 'LOW' && (
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px] font-bold whitespace-nowrap">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  Low Cover
                                </span>
                              )}
                              {item.stockStatus === 'HEALTHY' && (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold whitespace-nowrap">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  Healthy
                                </span>
                              )}
                              {item.stockStatus === 'OVERSTOCKED' && (
                                <span className="text-blue-600 dark:text-blue-400 text-[11px] font-bold whitespace-nowrap">
                                  Overstocked
                                </span>
                              )}
                              {item.stockStatus === 'UNTRACKED' && (
                                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium whitespace-nowrap">
                                  Unconstrained
                                </span>
                              )}
                            </td>

                            {/* Stepper Quick Adjust Buttons */}
                            <td className="p-3.5 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(item.sku, -100)}
                                  disabled={!item.hasInventory}
                                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                                  title="Decrease stock by 100 units"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(item.sku, 100)}
                                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                  title="Increase stock by 100 units"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(item.sku, 500)}
                                  className="px-1.5 py-0.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold font-mono transition-colors cursor-pointer"
                                  title="Add +500 bulk batch units"
                                >
                                  +500
                                </button>
                                {item.hasInventory && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearStock(item.sku)}
                                    className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                    title="Clear stock back to blank (unconstrained)"
                                    aria-label={`Clear stock for ${item.sku}`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className={`px-3.5 py-2.5 sm:px-8 sm:py-4 border-t flex items-center justify-between gap-2.5 shrink-0 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'
        }`}>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Real-time sync with 52-Week promotional schedule &amp; Custom Rules trade scan rebates</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {onOpenAddSku && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddSku();
                }}
                className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Add SKU</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              Done &amp; Save
            </button>
          </div>
        </div>

        {/* MOBILE FILTERS, SORT & BATCH BOTTOM SHEET */}
        <AnimatePresence>
          {isMobileFilterSheetOpen && (
            <div className="md:hidden fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.2 }}
                className={`w-full max-h-[85dvh] rounded-t-3xl border-t shadow-2xl flex flex-col overflow-hidden ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#151b30] border-slate-700 text-slate-100'
                }`}
              >
                <div className={`px-4 py-3.5 border-b flex items-center justify-between ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <div>
                    <h3 className="text-sm font-black">Filters, Sort &amp; Batch Stock</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Showing {filteredItems.length} of {products.length} SKUs
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterSheetOpen(false)}
                    aria-label="Close filter sheet"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto">
                  {/* Sort Order */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className={`w-full min-h-[44px] px-3 rounded-xl text-xs font-semibold border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
                      }`}
                    >
                      <option value="shortage">Shortage Priority</option>
                      <option value="stock">Stock High → Low</option>
                      <option value="value">Stock Value $</option>
                      <option value="sku">SKU Code</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className={`w-full min-h-[44px] px-3 rounded-xl text-xs font-semibold border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
                      }`}
                    >
                      <option value="ALL">All Categories ({categories.length})</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Status Filter */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Stock Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className={`w-full min-h-[44px] px-3 rounded-xl text-xs font-semibold border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
                      }`}
                    >
                      <option value="ALL">All Stock Statuses</option>
                      <option value="CRITICAL">Critical Stockout Risk</option>
                      <option value="LOW">Low Safety Stock</option>
                      <option value="HEALTHY">Healthy Buffer</option>
                      <option value="OVERSTOCKED">Overstocked</option>
                      <option value="UNTRACKED">Blank / Unconstrained</option>
                    </select>
                  </div>

                  {/* Batch Replenish */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Batch Replenish ({filteredItems.length} filtered SKUs)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleBatchReplenish(1.2)}
                        className={`min-h-[44px] rounded-xl border text-xs font-bold font-mono cursor-pointer ${
                          isLight
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 active:bg-indigo-100'
                            : 'bg-indigo-950/60 border-indigo-800 text-indigo-300 active:bg-indigo-900'
                        }`}
                      >
                        +20% Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchReplenish(1.5)}
                        className={`min-h-[44px] rounded-xl border text-xs font-bold font-mono cursor-pointer ${
                          isLight
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 active:bg-indigo-100'
                            : 'bg-indigo-950/60 border-indigo-800 text-indigo-300 active:bg-indigo-900'
                        }`}
                      >
                        +50% Stock
                      </button>
                    </div>
                  </div>

                  {/* Utility Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className={`min-h-[44px] px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                        isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>

                    {onOpenEditRange && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileFilterSheetOpen(false);
                          onClose();
                          onOpenEditRange();
                        }}
                        className={`min-h-[44px] px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                          isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Range</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sheet Bottom CTA */}
                <div className={`p-4 border-t flex items-center gap-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1424] border-slate-800'
                }`}>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className={`min-h-[44px] px-4 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                      isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterSheetOpen(false)}
                    className="flex-1 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Show {filteredItems.length} SKUs
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

