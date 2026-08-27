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
  TrendingUp, 
  DollarSign, 
  PackageCheck, 
  RefreshCw, 
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
  Sparkles,
  Edit3,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Product, WeekPromotion, ThemeMode } from '../types';
import { formatAud } from '../utils/formatters';

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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'LOW' | 'HEALTHY' | 'OVERSTOCKED'>('ALL');
  const [sortBy, setSortBy] = useState<'stock' | 'value' | 'sku' | 'shortage'>('shortage');
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);

  // Calculate 52-week promotional demand per SKU
  const promoDemandMap = useMemo(() => {
    const map = new Map<string, { totalPromoUnits: number; peakWeekDemand: number; promoWeeksCount: number }>();
    
    products.forEach(p => {
      map.set(p.sku, { totalPromoUnits: 0, peakWeekDemand: 0, promoWeeksCount: 0 });
    });

    promotions.forEach(promo => {
      // Hero SKU
      if (promo.heroSku) {
        const cur = map.get(promo.heroSku) || { totalPromoUnits: 0, peakWeekDemand: 0, promoWeeksCount: 0 };
        cur.totalPromoUnits += (promo.projectedUnits || 0);
        cur.peakWeekDemand = Math.max(cur.peakWeekDemand, promo.projectedUnits || 0);
        cur.promoWeeksCount += 1;
        map.set(promo.heroSku, cur);
      }
      // Secondary SKUs
      if (promo.secondarySkus && promo.secondarySkus.length > 0) {
        const secUnits = Math.round((promo.projectedUnits || 0) * 0.35);
        promo.secondarySkus.forEach(sSku => {
          const cur = map.get(sSku) || { totalPromoUnits: 0, peakWeekDemand: 0, promoWeeksCount: 0 };
          cur.totalPromoUnits += secUnits;
          cur.peakWeekDemand = Math.max(cur.peakWeekDemand, secUnits);
          cur.promoWeeksCount += 1;
          map.set(sSku, cur);
        });
      }
    });

    return map;
  }, [products, promotions]);

  // Enriched SKU Inventory Items
  const inventoryItems = useMemo(() => {
    return products.map(product => {
      const promoInfo = promoDemandMap.get(product.sku) || { totalPromoUnits: 0, peakWeekDemand: 0, promoWeeksCount: 0 };
      const currentStock = product.stockLevel ?? 1200;
      const weeklyBaseline = product.weeklyUnitsBaseline || 150;
      const totalBaselineAnnual = weeklyBaseline * 52;
      
      // Reserved for 52-week promotions (scaled allocation)
      const allocatedForPromo = promoInfo.totalPromoUnits;
      const freeAvailableStock = Math.max(0, currentStock - allocatedForPromo);
      const inventoryValueAud = currentStock * product.cost;

      // Recommended safety stock (typically 4 weeks of baseline + 50% of peak promo)
      const safetyStockThreshold = Math.round(weeklyBaseline * 4 + promoInfo.peakWeekDemand * 0.5);

      // Shortage calculation
      const shortageRisk = currentStock < (allocatedForPromo + weeklyBaseline * 2);
      const criticalShortage = currentStock < allocatedForPromo;

      let stockStatus: 'CRITICAL' | 'LOW' | 'HEALTHY' | 'OVERSTOCKED' = 'HEALTHY';
      if (criticalShortage) {
        stockStatus = 'CRITICAL';
      } else if (currentStock < safetyStockThreshold) {
        stockStatus = 'LOW';
      } else if (currentStock > safetyStockThreshold * 3) {
        stockStatus = 'OVERSTOCKED';
      }

      const weeksOfSupply = weeklyBaseline > 0 ? Number((currentStock / (weeklyBaseline + (allocatedForPromo / 52))).toFixed(1)) : 0;

      return {
        ...product,
        currentStock,
        allocatedForPromo,
        freeAvailableStock,
        inventoryValueAud,
        safetyStockThreshold,
        shortageRisk,
        criticalShortage,
        stockStatus,
        weeksOfSupply,
        peakWeekDemand: promoInfo.peakWeekDemand,
        promoWeeksCount: promoInfo.promoWeeksCount,
      };
    });
  }, [products, promoDemandMap]);

  // Aggregate Metrics
  const summaryMetrics = useMemo(() => {
    const totalPhysicalUnits = inventoryItems.reduce((sum, item) => sum + item.currentStock, 0);
    const totalInventoryValueAud = inventoryItems.reduce((sum, item) => sum + item.inventoryValueAud, 0);
    const totalAllocatedPromoUnits = inventoryItems.reduce((sum, item) => sum + item.allocatedForPromo, 0);
    const totalFreeStock = inventoryItems.reduce((sum, item) => sum + item.freeAvailableStock, 0);
    const criticalStockouts = inventoryItems.filter(item => item.stockStatus === 'CRITICAL').length;
    const lowStockAlerts = inventoryItems.filter(item => item.stockStatus === 'LOW').length;
    const healthyCount = inventoryItems.filter(item => item.stockStatus === 'HEALTHY').length;

    return {
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
          const scoreA = a.stockStatus === 'CRITICAL' ? 3 : a.stockStatus === 'LOW' ? 2 : 1;
          const scoreB = b.stockStatus === 'CRITICAL' ? 3 : b.stockStatus === 'LOW' ? 2 : 1;
          return scoreB - scoreA;
        }
        if (sortBy === 'stock') return b.currentStock - a.currentStock;
        if (sortBy === 'value') return b.inventoryValueAud - a.inventoryValueAud;
        return a.sku.localeCompare(b.sku);
      });
  }, [inventoryItems, searchQuery, selectedCategory, statusFilter, sortBy]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();
  }, [products]);

  // Adjust stock level handler
  const handleAdjustStock = (sku: string, delta: number) => {
    const updated = products.map(p => {
      if (p.sku === sku) {
        const current = p.stockLevel ?? 1200;
        const newStock = Math.max(0, current + delta);
        return { ...p, stockLevel: newStock };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Set explicit stock level handler
  const handleSaveStock = (sku: string, val: number) => {
    const updated = products.map(p => {
      if (p.sku === sku) {
        return { ...p, stockLevel: Math.max(0, val) };
      }
      return p;
    });
    onUpdateProducts(updated);
    setEditingSku(null);
  };

  // Batch replenishment (+25% stock across filtered SKUs)
  const handleBatchReplenish = (multiplier: number) => {
    const targetSkus = new Set(filteredItems.map(i => i.sku));
    const updated = products.map(p => {
      if (targetSkus.has(p.sku)) {
        const current = p.stockLevel ?? 1200;
        return { ...p, stockLevel: Math.round(current * multiplier) };
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
      'Weeks of Supply',
      'Stock Status'
    ];

    const rows = inventoryItems.map(item => [
      item.sku,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      item.cost.toFixed(2),
      item.rrp.toFixed(2),
      item.currentStock,
      item.allocatedForPromo,
      item.freeAvailableStock,
      item.inventoryValueAud.toFixed(2),
      item.safetyStockThreshold,
      item.weeksOfSupply,
      item.stockStatus
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className={`w-full max-w-6xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#0f1424] border-slate-700 text-slate-100'
        }`}
      >
        {/* HEADER BAR */}
        <div className={`p-5 sm:px-8 border-b flex items-center justify-between gap-4 shrink-0 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-500 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  SKU & Warehouse Inventory Manager
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  52-Week Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track physical warehouse stock, reserve 52-week promotional units, and prevent out-of-stock retail fines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenEditRange && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditRange();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Product Range</span>
              </button>
            )}
            
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Download full stock audit CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 TOP INVENTORY KPI METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'}`}>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Stock Valuation
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {formatAud(summaryMetrics.totalInventoryValueAud)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">at COGS</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {summaryMetrics.totalPhysicalUnits.toLocaleString()} physical units
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'}`}>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              52W Promo Reserved Stock
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black font-mono text-amber-500">
                {summaryMetrics.totalAllocatedPromoUnits.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">units</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Committed to active calendar
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'}`}>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Free Unallocated Stock
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black font-mono text-emerald-500">
                {summaryMetrics.totalFreeStock.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">units</span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block font-semibold">
              Available for baseline sales
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'}`}>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Stockout Vulnerabilities
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl font-black font-mono ${summaryMetrics.criticalStockouts > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {summaryMetrics.criticalStockouts}
              </span>
              <span className="text-[11px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                Critical
              </span>
              <span className="text-xs text-amber-500 font-bold font-mono">
                {summaryMetrics.lowStockAlerts} Low
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {summaryMetrics.healthyCount} SKUs healthy
            </span>
          </div>
        </div>

        {/* CONTROLS & FILTER TOOLBAR */}
        <div className={`p-4 sm:px-8 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#12172a] border-slate-800'
        }`}>
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search SKU code, name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
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

            {/* Status Filter */}
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
            </select>

            {/* Sort Filter */}
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

            {/* Batch Replenish Dropdown */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-2">Batch:</span>
              <button
                onClick={() => handleBatchReplenish(1.2)}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                title="Increase current stock of filtered SKUs by 20%"
              >
                +20%
              </button>
              <button
                onClick={() => handleBatchReplenish(1.5)}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                title="Increase current stock of filtered SKUs by 50%"
              >
                +50%
              </button>
            </div>
          </div>
        </div>

        {/* SKU INVENTORY DATA TABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:px-8">
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
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
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Baseline: {item.weeklyUnitsBaseline} units/wk • Supply: {item.weeksOfSupply} wks
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-3.5 text-slate-600 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                            {item.category}
                          </span>
                        </td>

                        {/* Unit COGS */}
                        <td className="p-3.5 font-mono text-right text-slate-700 dark:text-slate-300">
                          ${item.cost.toFixed(2)}
                        </td>

                        {/* Warehouse Stock Level */}
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                value={editStockValue}
                                onChange={(e) => setEditStockValue(Number(e.target.value))}
                                className="w-20 px-2 py-1 rounded border text-center font-mono font-bold text-xs"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveStock(item.sku, editStockValue)}
                                className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div 
                              onClick={() => {
                                setEditingSku(item.sku);
                                setEditStockValue(item.currentStock);
                              }}
                              className="font-mono font-bold text-sm cursor-pointer hover:underline text-slate-900 dark:text-white"
                              title="Click to edit stock level"
                            >
                              {item.currentStock.toLocaleString()}
                            </div>
                          )}
                          <span className="text-[9px] text-slate-400 block font-mono">
                            Safety: {item.safetyStockThreshold}
                          </span>
                        </td>

                        {/* 52W Promo Demand */}
                        <td className="p-3.5 text-center">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {item.allocatedForPromo.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400 block">
                            across {item.promoWeeksCount} promos
                          </span>
                        </td>

                        {/* Free Stock */}
                        <td className="p-3.5 text-center">
                          <span className={`font-mono font-bold ${item.freeAvailableStock === 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {item.freeAvailableStock.toLocaleString()}
                          </span>
                        </td>

                        {/* Total Stock Value */}
                        <td className="p-3.5 font-mono font-bold text-right text-slate-900 dark:text-white">
                          ${item.inventoryValueAud.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3.5 text-center">
                          {item.stockStatus === 'CRITICAL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase tracking-wide">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Shortage
                            </span>
                          )}
                          {item.stockStatus === 'LOW' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wide">
                              Low Stock
                            </span>
                          )}
                          {item.stockStatus === 'HEALTHY' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wide">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              Healthy
                            </span>
                          )}
                          {item.stockStatus === 'OVERSTOCKED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wide">
                              Overstocked
                            </span>
                          )}
                        </td>

                        {/* Stepper Quick Adjust Buttons */}
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() => handleAdjustStock(item.sku, -100)}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              title="Decrease stock by 100 units"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(item.sku, 100)}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              title="Increase stock by 100 units"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(item.sku, 500)}
                              className="px-1.5 py-0.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold transition-colors cursor-pointer"
                              title="Add +500 bulk batch units"
                            >
                              +500
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className={`p-4 sm:px-8 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#151b30] border-slate-800'
        }`}>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Real-time sync with 52-Week promotional schedule & ACCC trade scan rebates</span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenAddSku && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddSku();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New SKU</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Done & Save Allocations
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
