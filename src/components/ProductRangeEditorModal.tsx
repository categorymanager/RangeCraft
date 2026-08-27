import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Edit3, 
  Plus, 
  Trash2, 
  Copy, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Percent, 
  TrendingUp, 
  DollarSign, 
  Save, 
  Sliders, 
  ShieldCheck,
  RefreshCw,
  Boxes
} from 'lucide-react';
import { Product, PerformanceTier, StrategicObjective, ThemeMode } from '../types';
import { formatAud } from '../utils/formatters';

interface ProductRangeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveProducts: (updatedProducts: Product[]) => void;
  onOpenInventoryManager?: () => void;
  currentTheme?: ThemeMode;
}

export const ProductRangeEditorModal: React.FC<ProductRangeEditorModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveProducts,
  onOpenInventoryManager,
  currentTheme = 'light'
}) => {
  const isLight = currentTheme.includes('light');
  
  // Local state for active editing
  const [productList, setProductList] = useState<Product[]>(() => JSON.parse(JSON.stringify(products)));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newSkuModalOpen, setNewSkuModalOpen] = useState(false);

  // Synchronize when products prop changes and modal opens
  React.useEffect(() => {
    if (isOpen) {
      setProductList(JSON.parse(JSON.stringify(products)));
      setHasUnsavedChanges(false);
    }
  }, [isOpen, products]);

  // Categories list
  const categories = useMemo(() => {
    return Array.from(new Set(productList.map(p => p.category).filter(Boolean))).sort();
  }, [productList]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return productList.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchTier = selectedTier === 'ALL' || p.performanceTier === selectedTier;
      return matchSearch && matchCat && matchTier;
    });
  }, [productList, searchQuery, selectedCategory, selectedTier]);

  // Update a single product field
  const handleUpdateProduct = (indexOrSku: string, field: keyof Product, value: any) => {
    setProductList(prev => prev.map(p => {
      if (p.sku === indexOrSku) {
        const updated = { ...p, [field]: value };
        // If cost or rrp changes, recalculate margin
        if (field === 'cost' || field === 'rrp') {
          const cost = field === 'cost' ? Number(value) : p.cost;
          const rrp = field === 'rrp' ? Number(value) : p.rrp;
          if (rrp > 0) {
            updated.regularMarginPercent = Number((((rrp - cost) / rrp) * 100).toFixed(1));
          }
        }
        return updated;
      }
      return p;
    }));
    setHasUnsavedChanges(true);
  };

  // Duplicate a SKU
  const handleDuplicateSku = (sku: string) => {
    const original = productList.find(p => p.sku === sku);
    if (!original) return;

    const newSkuCode = `${original.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`;
    const clonedProduct: Product = {
      ...original,
      sku: newSkuCode,
      name: `${original.name} (Copy)`
    };

    setProductList(prev => [...prev, clonedProduct]);
    setHasUnsavedChanges(true);
  };

  // Delete a SKU
  const handleDeleteSku = (sku: string) => {
    if (productList.length <= 1) {
      alert('Portfolio must contain at least 1 product.');
      return;
    }
    setProductList(prev => prev.filter(p => p.sku !== sku));
    setHasUnsavedChanges(true);
  };

  // Bulk RRP Adjustment
  const handleBulkRrpAdjust = (multiplier: number) => {
    setProductList(prev => prev.map(p => {
      const newRrp = Number((p.rrp * multiplier).toFixed(2));
      const margin = newRrp > 0 ? Number((((newRrp - p.cost) / newRrp) * 100).toFixed(1)) : p.regularMarginPercent;
      return {
        ...p,
        rrp: newRrp,
        regularMarginPercent: margin
      };
    }));
    setHasUnsavedChanges(true);
  };

  // Bulk Baseline Units Adjustment
  const handleBulkBaselineAdjust = (multiplier: number) => {
    setProductList(prev => prev.map(p => ({
      ...p,
      weeklyUnitsBaseline: Math.round((p.weeklyUnitsBaseline || 100) * multiplier)
    })));
    setHasUnsavedChanges(true);
  };

  // Save all changes
  const handleSaveAndClose = () => {
    onSaveProducts(productList);
    setHasUnsavedChanges(false);
    onClose();
  };

  // Add new Product Form State
  const [newSku, setNewSku] = useState<Partial<Product>>({
    sku: `SKU-FMC-${String(productList.length + 1).padStart(3, '0')}`,
    name: '',
    category: 'Pantry & Grocery',
    subcategory: 'Core FMCG',
    cost: 5.50,
    rrp: 12.00,
    regularMarginPercent: 54.2,
    weeklyUnitsBaseline: 180,
    hiatusWeeksRequired: 4,
    performanceTier: 'Hero',
    primaryStrategicObjective: 'Maximize Net Profit ($AUD)',
    stockLevel: 1500
  });

  const handleAddNewSkuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.name || !newSku.sku) return;

    const fullProduct: Product = {
      sku: newSku.sku || `SKU-${Date.now()}`,
      name: newSku.name,
      category: newSku.category || 'Pantry & Grocery',
      subcategory: newSku.subcategory || 'Core FMCG',
      cost: Number(newSku.cost) || 5.00,
      rrp: Number(newSku.rrp) || 12.00,
      marginPercent: Number(newSku.cost) && Number(newSku.rrp) 
        ? Number((((Number(newSku.rrp) - Number(newSku.cost)) / Number(newSku.rrp)) * 100).toFixed(1))
        : 50,
      weeklyUnitsBaseline: Number(newSku.weeklyUnitsBaseline) || 150,
      minPromoGapWeeks: Number(newSku.minPromoGapWeeks) || 4,
      performanceTier: (newSku.performanceTier as PerformanceTier) || 'tier1_hero',
      stockLevel: Number(newSku.stockLevel) || 1200,
      seasonalPeak: 'All Year',
      targetWeeks: [10, 20, 30, 40],
      tags: ['Core', 'FMCG']
    };

    setProductList(prev => [...prev, fullProduct]);
    setHasUnsavedChanges(true);
    setNewSkuModalOpen(false);
    // Reset form
    setNewSku({
      sku: `SKU-FMC-${String(productList.length + 2).padStart(3, '0')}`,
      name: '',
      category: 'Pantry & Grocery',
      subcategory: 'Core FMCG',
      cost: 5.50,
      rrp: 12.00,
      regularMarginPercent: 54.2,
      weeklyUnitsBaseline: 180,
      hiatusWeeksRequired: 4,
      performanceTier: 'Hero',
      primaryStrategicObjective: 'Maximize Net Profit ($AUD)',
      stockLevel: 1500
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
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
            <div className="w-10 h-10 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-500 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Product Range & Portfolio Editor
                </h2>
                {hasUnsavedChanges && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modify retail RRPs, baseline weekly volumes, COGS costs, and ACCC hiatus compliance rules across your range.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInventoryManager && (
              <button
                onClick={() => {
                  onClose();
                  onOpenInventoryManager();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Inventory & Stock</span>
              </button>
            )}

            <button
              onClick={() => setNewSkuModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add SKU</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS & BATCH ADJUSTMENT TOOLBAR */}
        <div className={`p-4 sm:px-8 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#12172a] border-slate-800'
        }`}>
          {/* Search bar */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-xs">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search SKU code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

            {/* Performance Tier Filter */}
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <option value="ALL">All Performance Tiers</option>
              <option value="Hero">Hero SKUs</option>
              <option value="Margin Builder">Margin Builders</option>
              <option value="Volume Driver">Volume Drivers</option>
              <option value="Niche Specialty">Niche Specialty</option>
              <option value="Clearance">Clearance</option>
            </select>

            {/* Bulk Range Multipliers */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-2">Price:</span>
              <button
                onClick={() => handleBulkRrpAdjust(1.05)}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                title="Increase RRP of all SKUs by +5%"
              >
                +5%
              </button>
              <button
                onClick={() => handleBulkRrpAdjust(0.95)}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                title="Decrease RRP of all SKUs by -5%"
              >
                -5%
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-2">Baseline Vol:</span>
              <button
                onClick={() => handleBulkBaselineAdjust(1.1)}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                title="Increase baseline weekly forecast by +10%"
              >
                +10%
              </button>
            </div>
          </div>
        </div>

        {/* PRODUCTS RANGE TABLE */}
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
                    <th className="p-3 font-bold">SKU Code</th>
                    <th className="p-3 font-bold min-w-[200px]">Product Name & Title</th>
                    <th className="p-3 font-bold">Category</th>
                    <th className="p-3 font-bold text-right">Cost (COGS)</th>
                    <th className="p-3 font-bold text-right">Retail RRP</th>
                    <th className="p-3 font-bold text-center">Gross Margin</th>
                    <th className="p-3 font-bold text-center">Baseline Units/Wk</th>
                    <th className="p-3 font-bold text-center">ACCC Hiatus</th>
                    <th className="p-3 font-bold text-center">Tier</th>
                    <th className="p-3 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredProducts.map(product => {
                    const margin = product.rrp > 0 ? (((product.rrp - product.cost) / product.rrp) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={product.sku} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                        {/* SKU Code */}
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                          {product.sku}
                        </td>

                        {/* Title (Inline editable) */}
                        <td className="p-3">
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleUpdateProduct(product.sku, 'name', e.target.value)}
                            className={`w-full px-2 py-1 rounded border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                        </td>

                        {/* Category */}
                        <td className="p-3">
                          <select
                            value={product.category}
                            onChange={(e) => handleUpdateProduct(product.sku, 'category', e.target.value)}
                            className={`px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          >
                            <option value="Pantry & Grocery">Pantry & Grocery</option>
                            <option value="Beverages & Snacking">Beverages & Snacking</option>
                            <option value="Household Essentials">Household Essentials</option>
                            <option value="Personal Care & Health">Personal Care & Health</option>
                            <option value="General Merchandise">General Merchandise</option>
                          </select>
                        </td>

                        {/* Cost COGS */}
                        <td className="p-3 text-right">
                          <div className="relative inline-block w-20">
                            <span className="absolute left-2 top-1 text-slate-400 text-xs">$</span>
                            <input
                              type="number"
                              step="0.10"
                              value={product.cost}
                              onChange={(e) => handleUpdateProduct(product.sku, 'cost', Number(e.target.value))}
                              className={`w-full pl-5 pr-2 py-1 rounded border text-right font-mono font-semibold text-xs ${
                                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                              }`}
                            />
                          </div>
                        </td>

                        {/* Retail RRP */}
                        <td className="p-3 text-right">
                          <div className="relative inline-block w-20">
                            <span className="absolute left-2 top-1 text-slate-400 text-xs">$</span>
                            <input
                              type="number"
                              step="0.50"
                              value={product.rrp}
                              onChange={(e) => handleUpdateProduct(product.sku, 'rrp', Number(e.target.value))}
                              className={`w-full pl-5 pr-2 py-1 rounded border text-right font-mono font-bold text-xs ${
                                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                              }`}
                            />
                          </div>
                        </td>

                        {/* Margin % */}
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold text-xs ${Number(margin) >= 45 ? 'text-emerald-500' : Number(margin) >= 25 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {margin}%
                          </span>
                        </td>

                        {/* Baseline Units/Wk */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            step="10"
                            value={product.weeklyUnitsBaseline || 100}
                            onChange={(e) => handleUpdateProduct(product.sku, 'weeklyUnitsBaseline', Number(e.target.value))}
                            className={`w-20 px-2 py-1 rounded border text-center font-mono font-semibold text-xs ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                        </td>

                        {/* ACCC Hiatus Required */}
                        <td className="p-3 text-center">
                          <select
                            value={product.minPromoGapWeeks || 4}
                            onChange={(e) => handleUpdateProduct(product.sku, 'minPromoGapWeeks', Number(e.target.value))}
                            className={`px-2 py-1 rounded border text-[11px] font-bold cursor-pointer ${
                              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          >
                            <option value={2}>2 Wks</option>
                            <option value={4}>4 Wks (Std)</option>
                            <option value={6}>6 Wks (Strict)</option>
                            <option value={8}>8 Wks</option>
                          </select>
                        </td>

                        {/* Performance Tier */}
                        <td className="p-3 text-center">
                          <select
                            value={product.performanceTier || 'Hero'}
                            onChange={(e) => handleUpdateProduct(product.sku, 'performanceTier', e.target.value)}
                            className={`px-2 py-1 rounded border text-[10px] font-bold cursor-pointer ${
                              product.performanceTier === 'Hero' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' :
                              product.performanceTier === 'Margin Builder' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                              'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            <option value="Hero">Hero</option>
                            <option value="Margin Builder">Margin Builder</option>
                            <option value="Volume Driver">Volume Driver</option>
                            <option value="Niche Specialty">Niche</option>
                            <option value="Clearance">Clearance</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDuplicateSku(product.sku)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                              title="Duplicate SKU"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSku(product.sku)}
                              className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Delete SKU from portfolio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            <span>Portfolio contains {productList.length} active SKUs • All edits automatically refresh 52-week margin waterfall</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveAndClose}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Apply Changes & Save Range</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* MODAL: ADD NEW SKU DIALOG */}
      <AnimatePresence>
        {newSkuModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#151b30] border-slate-700 text-white'
              }`}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  <span>Create New Product SKU</span>
                </h3>
                <button 
                  onClick={() => setNewSkuModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewSkuSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={newSku.sku}
                    onChange={(e) => setNewSku(prev => ({ ...prev, sku: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Cold-Pressed Virgin Olive Oil 500ml"
                    value={newSku.name}
                    onChange={(e) => setNewSku(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Category</label>
                    <select
                      value={newSku.category}
                      onChange={(e) => setNewSku(prev => ({ ...prev, category: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      <option value="Pantry & Grocery">Pantry & Grocery</option>
                      <option value="Beverages & Snacking">Beverages & Snacking</option>
                      <option value="Household Essentials">Household Essentials</option>
                      <option value="Personal Care & Health">Personal Care & Health</option>
                      <option value="General Merchandise">General Merchandise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Performance Tier</label>
                    <select
                      value={newSku.performanceTier}
                      onChange={(e) => setNewSku(prev => ({ ...prev, performanceTier: e.target.value as any }))}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      <option value="Hero">Hero SKU</option>
                      <option value="Margin Builder">Margin Builder</option>
                      <option value="Volume Driver">Volume Driver</option>
                      <option value="Niche Specialty">Niche Specialty</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Unit Cost COGS ($ AUD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newSku.cost}
                      onChange={(e) => setNewSku(prev => ({ ...prev, cost: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-xl border font-mono ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Retail RRP ($ AUD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newSku.rrp}
                      onChange={(e) => setNewSku(prev => ({ ...prev, rrp: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Weekly Baseline (Units)</label>
                    <input
                      type="number"
                      required
                      value={newSku.weeklyUnitsBaseline}
                      onChange={(e) => setNewSku(prev => ({ ...prev, weeklyUnitsBaseline: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-xl border font-mono ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1">Initial Stock Units</label>
                    <input
                      type="number"
                      required
                      value={newSku.stockLevel}
                      onChange={(e) => setNewSku(prev => ({ ...prev, stockLevel: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-xl border font-mono ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSkuModalOpen(false)}
                    className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md cursor-pointer"
                  >
                    Add Product to Range
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
