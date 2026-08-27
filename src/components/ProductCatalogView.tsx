import React, { useState, useMemo } from 'react';
import { Product, PerformanceTier, ThemeMode, WeekPromotion, SkuCatalog } from '../types';
import { 
  exportProductsToCsv, 
  generateProductCsvTemplate, 
  analyzeProductRangePortfolio 
} from '../utils/csvHelpers';
import { ScanRebateMarginSimulator } from './ScanRebateMarginSimulator';
import { formatAud, formatNumber, formatPercent } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Package, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  Sparkles,
  BarChart3,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  FolderEdit,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
  SlidersHorizontal,
  DollarSign,
  Calendar,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Tag,
  Check,
  FolderPlus,
  Copy,
  Edit3,
  Boxes,
  Store,
  Undo2
} from 'lucide-react';

interface ProductCatalogViewProps {
  products: Product[];
  promotions?: WeekPromotion[];
  catalogs?: SkuCatalog[];
  activeCatalogId?: string;
  onSelectCatalog?: (catalogId: string) => void;
  onCreateCatalog?: (catalog: SkuCatalog) => void;
  onUpdateCatalog?: (catalog: SkuCatalog) => void;
  onDeleteCatalog?: (catalogId: string) => void;
  onAddProduct: (product: Product) => void;
  onImportProducts: (products: Product[]) => void;
  onDeleteProduct?: (sku: string) => void;
  onDeleteMultipleProducts?: (skus: string[]) => void;
  onClearAllProducts?: () => void;
  onOpenUploadModal: () => void;
  onAutoGeneratePlanFromRange: () => void;
  currentTheme: ThemeMode;
}

export type SortField = 
  | 'sku' 
  | 'name' 
  | 'category' 
  | 'subcategory' 
  | 'rrp' 
  | 'cost' 
  | 'margin' 
  | 'marginDollars' 
  | 'units' 
  | 'annualBaselineRev' 
  | 'stockLevel' 
  | 'promoWeeksCount' 
  | 'projectedPromoRevenue' 
  | 'projectedPromoUnits' 
  | 'projectedPromoMargin' 
  | 'promoLift' 
  | 'minHiatus';

export interface SkuPromoStats {
  plannedWeeksCount: number;
  plannedWeeks: number[];
  totalProjectedUnits: number;
  totalProjectedRevenueAud: number;
  totalProjectedMarginAud: number;
  avgLiftMultiplier: number;
  avgDiscountPercent: number;
  isClashingHiatus: boolean;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  products,
  promotions = [],
  catalogs = [],
  activeCatalogId,
  onSelectCatalog,
  onCreateCatalog,
  onUpdateCatalog,
  onDeleteCatalog,
  onAddProduct,
  onImportProducts,
  onDeleteProduct,
  onDeleteMultipleProducts,
  onClearAllProducts,
  onOpenUploadModal,
  onAutoGeneratePlanFromRange,
  currentTheme,
}) => {
  const isLight = currentTheme.includes('light');

  // 1. Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubcategory, setSelectedSubcategory] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fundingStatus, setFundingStatus] = useState<'ALL' | 'coop' | 'retailer'>('ALL');
  const [rrpBracket, setRrpBracket] = useState<'ALL' | 'under_20' | '20_50' | '50_150' | '150_plus' | 'custom'>('ALL');
  const [customMinRrp, setCustomMinRrp] = useState<string>('');
  const [customMaxRrp, setCustomMaxRrp] = useState<string>('');
  const [marginBracket, setMarginBracket] = useState<'ALL' | 'high_50' | 'healthy_35_50' | 'squeeze_under_35'>('ALL');
  const [promoActivityFilter, setPromoActivityFilter] = useState<'ALL' | 'promoted_active' | 'unpromoted_gap' | 'high_lift' | 'top_revenue'>('ALL');
  const [seasonalPeakFilter, setSeasonalPeakFilter] = useState<string>('ALL');
  const [hiatusStatusFilter, setHiatusStatusFilter] = useState<'ALL' | 'compliant' | 'clashing'>('ALL');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  // 2. Sorting State
  const [sortBy, setSortBy] = useState<SortField>('sku');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 3. Modals & UI State
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);
  const [previousProducts, setPreviousProducts] = useState<Product[] | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedSkus, setExpandedSkus] = useState<string[]>([]);

  // Deletion Confirmation Modals
  const [skuToDelete, setSkuToDelete] = useState<Product | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Catalogue Management Modals
  const [isCreateCatalogModalOpen, setIsCreateCatalogModalOpen] = useState(false);
  const [isEditCatalogModalOpen, setIsEditCatalogModalOpen] = useState(false);
  const [catalogToDelete, setCatalogToDelete] = useState<SkuCatalog | null>(null);
  
  // Create / Edit Catalog Form State
  const [newCatalogName, setNewCatalogName] = useState('');
  const [newCatalogDescription, setNewCatalogDescription] = useState('');
  const [newCatalogCategoryFocus, setNewCatalogCategoryFocus] = useState('Grocery & FMCG');
  const [newCatalogRetailerBanner, setNewCatalogRetailerBanner] = useState('National Supermarkets & Grocery');
  const [newCatalogCloneFromCurrent, setNewCatalogCloneFromCurrent] = useState(false);

  // 4. Multi-select & Bulk Action State
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [newBulkCategory, setNewBulkCategory] = useState('Outdoor & Camping');
  const [bulkTagsModalOpen, setBulkTagsModalOpen] = useState(false);
  const [newBulkTags, setNewBulkTags] = useState('');
  const [bulkDiscountModalOpen, setBulkDiscountModalOpen] = useState(false);
  const [bulkPctChange, setBulkPctChange] = useState('-10');
  const [bulkTierModalOpen, setBulkTierModalOpen] = useState(false);
  const [newBulkTier, setNewBulkTier] = useState<PerformanceTier>('tier1_hero');

  // 5. New Product Form State
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Outdoor & Camping');
  const [newSubcategory, setNewSubcategory] = useState('BBQ & Fireplace');
  const [newRrp, setNewRrp] = useState('49.99');
  const [newCost, setNewCost] = useState('22.00');
  const [newBaselineUnits, setNewBaselineUnits] = useState('120');
  const [newPerformanceTier, setNewPerformanceTier] = useState<PerformanceTier>('tier1_hero');
  const [newSeasonalPeak, setNewSeasonalPeak] = useState('Summer / Australia Day');
  const [newMinHiatus, setNewMinHiatus] = useState('4');
  const [newCoOpEligible, setNewCoOpEligible] = useState(true);
  const [newTags, setNewTags] = useState('Australia Day, Hero, Volume');

  // Active Catalog Object
  const currentCatalog = useMemo(() => {
    return catalogs.find(c => c.id === activeCatalogId) || catalogs[0] || null;
  }, [catalogs, activeCatalogId]);

  const toggleExpandSku = (sku: string) => {
    setExpandedSkus(prev => prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]);
  };

  const showToast = (message: string, onUndo?: () => void) => {
    setToast({ message, onUndo });
    setTimeout(() => setToast(null), 5500);
  };

  const handleUndo = () => {
    if (previousProducts) {
      onImportProducts(previousProducts);
      setPreviousProducts(null);
      setToast(null);
    }
  };

  // Dynamic Metadata Extractions
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort(), [products]);
  
  const subcategories = useMemo(() => {
    const relevant = selectedCategory === 'ALL' 
      ? products 
      : products.filter(p => p.category === selectedCategory);
    return Array.from(new Set(relevant.map(p => p.subcategory).filter(Boolean))).sort();
  }, [products, selectedCategory]);

  const allTags = useMemo(() => Array.from(new Set(products.flatMap(p => p.tags).filter(Boolean))).sort(), [products]);
  const allSeasonalPeaks = useMemo(() => Array.from(new Set(products.map(p => p.seasonalPeak).filter(Boolean))).sort(), [products]);
  const portfolioAnalysis = useMemo(() => analyzeProductRangePortfolio(products), [products]);

  // Compute Promotional Performance & ACCC Hiatus Stats Per SKU
  const skuPromoStatsMap = useMemo<Record<string, SkuPromoStats>>(() => {
    const stats: Record<string, SkuPromoStats> = {};

    products.forEach(p => {
      const heroPromos = promotions.filter(promo => promo.heroSku === p.sku);
      const secondaryPromos = promotions.filter(promo => promo.secondarySkus?.includes(p.sku));
      const allFeaturedPromos = [...heroPromos, ...secondaryPromos];

      const plannedWeeks = Array.from(new Set(allFeaturedPromos.map(w => w.weekNumber))).sort((a, b) => a - b);
      
      let totalUnits = 0;
      let totalRevenue = 0;
      let totalMargin = 0;
      let totalLiftSum = 0;
      let totalDiscountSum = 0;

      heroPromos.forEach(promo => {
        const u = (promo.projectedUnits || p.weeklyUnitsBaseline * 1.5);
        const rev = (promo.projectedRevenueAud || u * (promo.mechanic?.promoRrp || p.rrp * 0.8));
        const marg = (promo.projectedMarginAud || rev * (promo.projectedMarginPercent ? promo.projectedMarginPercent / 100 : p.marginPercent / 100));
        
        totalUnits += u;
        totalRevenue += rev;
        totalMargin += marg;
        
        const lift = p.weeklyUnitsBaseline > 0 ? (u / p.weeklyUnitsBaseline) : 1;
        totalLiftSum += lift;
        totalDiscountSum += (promo.mechanic?.discountValue || 20);
      });

      const avgLiftMultiplier = heroPromos.length > 0 ? (totalLiftSum / heroPromos.length) : 1.0;
      const avgDiscountPercent = heroPromos.length > 0 ? (totalDiscountSum / heroPromos.length) : 0;

      let isClashingHiatus = false;
      if (heroPromos.length > 1) {
        for (let i = 0; i < heroPromos.length - 1; i++) {
          const gap = heroPromos[i + 1].weekNumber - heroPromos[i].weekNumber;
          if (gap <= (p.minPromoGapWeeks || 4)) {
            isClashingHiatus = true;
            break;
          }
        }
      }

      stats[p.sku] = {
        plannedWeeksCount: allFeaturedPromos.length,
        plannedWeeks,
        totalProjectedUnits: Math.round(totalUnits),
        totalProjectedRevenueAud: Math.round(totalRevenue),
        totalProjectedMarginAud: Math.round(totalMargin),
        avgLiftMultiplier: Number(avgLiftMultiplier.toFixed(2)),
        avgDiscountPercent: Number(avgDiscountPercent.toFixed(1)),
        isClashingHiatus
      };
    });

    return stats;
  }, [products, promotions]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        const matchesSub = p.subcategory.toLowerCase().includes(q);
        const matchesTags = p.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesSku && !matchesName && !matchesCat && !matchesSub && !matchesTags) {
          return false;
        }
      }

      // Department Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;

      // Subcategory filter
      if (selectedSubcategory !== 'ALL' && p.subcategory !== selectedSubcategory) return false;

      // Performance Tier filter
      if (selectedTier !== 'ALL' && p.performanceTier !== selectedTier) return false;

      // Selected Tags Filter
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(t => p.tags.includes(t));
        if (!hasAllTags) return false;
      }

      // Vendor Scan Rebate vs Retailer Funded Filter
      if (fundingStatus === 'coop' && !p.supplierCoOpEligible) return false;
      if (fundingStatus === 'retailer' && p.supplierCoOpEligible) return false;

      // RRP Bracket Filter
      if (rrpBracket === 'under_20' && p.rrp >= 20) return false;
      if (rrpBracket === '20_50' && (p.rrp < 20 || p.rrp > 50)) return false;
      if (rrpBracket === '50_150' && (p.rrp < 50 || p.rrp > 150)) return false;
      if (rrpBracket === '150_plus' && p.rrp <= 150) return false;
      if (rrpBracket === 'custom') {
        const minVal = parseFloat(customMinRrp);
        const maxVal = parseFloat(customMaxRrp);
        if (!isNaN(minVal) && p.rrp < minVal) return false;
        if (!isNaN(maxVal) && p.rrp > maxVal) return false;
      }

      // Gross Margin Bracket Filter
      if (marginBracket === 'high_50' && p.marginPercent < 50) return false;
      if (marginBracket === 'healthy_35_50' && (p.marginPercent < 35 || p.marginPercent >= 50)) return false;
      if (marginBracket === 'squeeze_under_35' && p.marginPercent >= 35) return false;

      // Promotional Activity Filter
      const stats = skuPromoStatsMap[p.sku];
      if (promoActivityFilter === 'promoted_active' && (!stats || stats.plannedWeeksCount === 0)) return false;
      if (promoActivityFilter === 'unpromoted_gap' && stats && stats.plannedWeeksCount > 0) return false;
      if (promoActivityFilter === 'high_lift' && (!stats || stats.avgLiftMultiplier < 1.5)) return false;
      if (promoActivityFilter === 'top_revenue' && (!stats || stats.totalProjectedRevenueAud < 20000)) return false;

      // Seasonal Peak Filter
      if (seasonalPeakFilter !== 'ALL' && p.seasonalPeak !== seasonalPeakFilter) return false;

      // ACCC Hiatus Status Filter
      if (hiatusStatusFilter === 'compliant' && stats && stats.isClashingHiatus) return false;
      if (hiatusStatusFilter === 'clashing' && (!stats || !stats.isClashingHiatus)) return false;

      return true;
    }).sort((a, b) => {
      let valA: any;
      let valB: any;

      const statsA = skuPromoStatsMap[a.sku];
      const statsB = skuPromoStatsMap[b.sku];

      switch (sortBy) {
        case 'sku':
          valA = a.sku;
          valB = b.sku;
          break;
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'category':
          valA = a.category.toLowerCase();
          valB = b.category.toLowerCase();
          break;
        case 'subcategory':
          valA = a.subcategory.toLowerCase();
          valB = b.subcategory.toLowerCase();
          break;
        case 'rrp':
          valA = a.rrp;
          valB = b.rrp;
          break;
        case 'cost':
          valA = a.cost;
          valB = b.cost;
          break;
        case 'margin':
          valA = a.marginPercent;
          valB = b.marginPercent;
          break;
        case 'marginDollars':
          valA = a.rrp - a.cost;
          valB = b.rrp - b.cost;
          break;
        case 'units':
          valA = a.weeklyUnitsBaseline;
          valB = b.weeklyUnitsBaseline;
          break;
        case 'annualBaselineRev':
          valA = a.weeklyUnitsBaseline * a.rrp * 52;
          valB = b.weeklyUnitsBaseline * b.rrp * 52;
          break;
        case 'stockLevel':
          valA = a.stockLevel || 0;
          valB = b.stockLevel || 0;
          break;
        case 'promoWeeksCount':
          valA = statsA ? statsA.plannedWeeksCount : 0;
          valB = statsB ? statsB.plannedWeeksCount : 0;
          break;
        case 'projectedPromoRevenue':
          valA = statsA ? statsA.totalProjectedRevenueAud : 0;
          valB = statsB ? statsB.totalProjectedRevenueAud : 0;
          break;
        case 'projectedPromoUnits':
          valA = statsA ? statsA.totalProjectedUnits : 0;
          valB = statsB ? statsB.totalProjectedUnits : 0;
          break;
        case 'projectedPromoMargin':
          valA = statsA ? statsA.totalProjectedMarginAud : 0;
          valB = statsB ? statsB.totalProjectedMarginAud : 0;
          break;
        case 'promoLift':
          valA = statsA ? statsA.avgLiftMultiplier : 1;
          valB = statsB ? statsB.avgLiftMultiplier : 1;
          break;
        case 'minHiatus':
          valA = a.minPromoGapWeeks || 4;
          valB = b.minPromoGapWeeks || 4;
          break;
        default:
          valA = a.sku;
          valB = b.sku;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [
    products, 
    searchQuery, 
    selectedCategory, 
    selectedSubcategory, 
    selectedTier, 
    selectedTags, 
    fundingStatus, 
    rrpBracket, 
    customMinRrp, 
    customMaxRrp, 
    marginBracket, 
    promoActivityFilter, 
    seasonalPeakFilter, 
    hiatusStatusFilter, 
    sortBy, 
    sortOrder, 
    skuPromoStatsMap
  ]);

  // Handle Sort Clicking
  const handleHeaderSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Quick Preset Handlers
  const handleApplyPreset = (preset: 'all' | 'high_margin' | 'volume_heroes' | 'clashing' | 'gap_skus' | 'coop_funded' | 'impulse_under_20' | 'high_ticket') => {
    handleResetFilters();
    switch (preset) {
      case 'high_margin':
        setMarginBracket('high_50');
        break;
      case 'volume_heroes':
        setSelectedTier('tier1_hero');
        break;
      case 'clashing':
        setHiatusStatusFilter('clashing');
        break;
      case 'gap_skus':
        setPromoActivityFilter('unpromoted_gap');
        break;
      case 'coop_funded':
        setFundingStatus('coop');
        break;
      case 'impulse_under_20':
        setRrpBracket('under_20');
        break;
      case 'high_ticket':
        setRrpBracket('150_plus');
        break;
      case 'all':
      default:
        break;
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedSubcategory('ALL');
    setSelectedTier('ALL');
    setSelectedTags([]);
    setFundingStatus('ALL');
    setRrpBracket('ALL');
    setCustomMinRrp('');
    setCustomMaxRrp('');
    setMarginBracket('ALL');
    setPromoActivityFilter('ALL');
    setSeasonalPeakFilter('ALL');
    setHiatusStatusFilter('ALL');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory !== 'ALL') count++;
    if (selectedSubcategory !== 'ALL') count++;
    if (selectedTier !== 'ALL') count++;
    if (selectedTags.length > 0) count++;
    if (fundingStatus !== 'ALL') count++;
    if (rrpBracket !== 'ALL') count++;
    if (marginBracket !== 'ALL') count++;
    if (promoActivityFilter !== 'ALL') count++;
    if (seasonalPeakFilter !== 'ALL') count++;
    if (hiatusStatusFilter !== 'ALL') count++;
    return count;
  }, [
    searchQuery, 
    selectedCategory, 
    selectedSubcategory, 
    selectedTier, 
    selectedTags, 
    fundingStatus, 
    rrpBracket, 
    marginBracket, 
    promoActivityFilter, 
    seasonalPeakFilter, 
    hiatusStatusFilter
  ]);

  // Bulk Selection Handlers
  const isAllSelected = useMemo(() => {
    return filteredProducts.length > 0 && filteredProducts.every(p => selectedSkus.includes(p.sku));
  }, [filteredProducts, selectedSkus]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredSkuSet = new Set(filteredProducts.map(p => p.sku));
      setSelectedSkus(selectedSkus.filter(s => !filteredSkuSet.has(s)));
    } else {
      const allFilteredSkus = filteredProducts.map(p => p.sku);
      const union = Array.from(new Set([...selectedSkus, ...allFilteredSkus]));
      setSelectedSkus(union);
    }
  };

  const handleToggleSelectSku = (sku: string) => {
    if (selectedSkus.includes(sku)) {
      setSelectedSkus(selectedSkus.filter(s => s !== sku));
    } else {
      setSelectedSkus([...selectedSkus, sku]);
    }
  };

  // Single SKU Deletion
  const handleConfirmSingleDelete = () => {
    if (!skuToDelete) return;
    setPreviousProducts(products);
    const skuCode = skuToDelete.sku;
    const skuName = skuToDelete.name;

    if (onDeleteProduct) {
      onDeleteProduct(skuCode);
    } else {
      const updated = products.filter(p => p.sku !== skuCode);
      onImportProducts(updated);
    }

    setSkuToDelete(null);
    setSelectedSkus(prev => prev.filter(s => s !== skuCode));
    showToast(`Deleted SKU ${skuCode} ("${skuName}").`, handleUndo);
  };

  // Multi-SKU Deletion
  const handleConfirmBulkDelete = () => {
    if (selectedSkus.length === 0) return;
    setPreviousProducts(products);
    const count = selectedSkus.length;

    if (onDeleteMultipleProducts) {
      onDeleteMultipleProducts(selectedSkus);
    } else {
      const updated = products.filter(p => !selectedSkus.includes(p.sku));
      onImportProducts(updated);
    }

    setIsBulkDeleteModalOpen(false);
    setSelectedSkus([]);
    showToast(`Deleted ${count} selected SKUs from catalog.`, handleUndo);
  };

  // Clear All SKUs Deletion
  const handleConfirmClearAll = () => {
    setPreviousProducts(products);
    const count = products.length;

    if (onClearAllProducts) {
      onClearAllProducts();
    } else {
      onImportProducts([]);
    }

    setIsClearAllModalOpen(false);
    setSelectedSkus([]);
    showToast(`Cleared all ${count} SKUs from this range.`, handleUndo);
  };

  // Bulk Edits
  const handleApplyBulkCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkus.length === 0) return;
    setPreviousProducts(products);
    const updated = products.map(p => {
      if (selectedSkus.includes(p.sku)) {
        return { ...p, category: newBulkCategory };
      }
      return p;
    });
    onImportProducts(updated);
    setBulkCategoryModalOpen(false);
    setSelectedSkus([]);
    showToast(`Reassigned ${selectedSkus.length} SKUs to ${newBulkCategory}.`, handleUndo);
  };

  const handleApplyBulkTags = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkus.length === 0) return;
    setPreviousProducts(products);
    const newTagsList = newBulkTags.split(',').map(t => t.trim()).filter(Boolean);
    const updated = products.map(p => {
      if (selectedSkus.includes(p.sku)) {
        const uniqueTags = Array.from(new Set([...p.tags, ...newTagsList]));
        return { ...p, tags: uniqueTags };
      }
      return p;
    });
    onImportProducts(updated);
    setBulkTagsModalOpen(false);
    setSelectedSkus([]);
    setNewBulkTags('');
    showToast(`Added tags to ${selectedSkus.length} SKUs.`, handleUndo);
  };

  const handleApplyBulkDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkus.length === 0) return;
    setPreviousProducts(products);
    const pct = parseFloat(bulkPctChange) || 0;
    const updated = products.map(p => {
      if (selectedSkus.includes(p.sku)) {
        const adjustedRrp = Math.max(1, Number((p.rrp * (1 + pct / 100)).toFixed(2)));
        const newMargin = Number((((adjustedRrp - p.cost) / adjustedRrp) * 100).toFixed(1));
        return { ...p, rrp: adjustedRrp, marginPercent: newMargin };
      }
      return p;
    });
    onImportProducts(updated);
    setBulkDiscountModalOpen(false);
    setSelectedSkus([]);
    showToast(`Applied ${bulkPctChange}% discount to ${selectedSkus.length} SKUs.`, handleUndo);
  };

  const handleApplyBulkTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkus.length === 0) return;
    const updated = products.map(p => {
      if (selectedSkus.includes(p.sku)) {
        return { ...p, performanceTier: newBulkTier };
      }
      return p;
    });
    onImportProducts(updated);
    setBulkTierModalOpen(false);
    setSelectedSkus([]);
    showToast(`Assigned performance tier to ${selectedSkus.length} SKUs.`);
  };

  // Catalogue Handlers
  const handleOpenCreateCatalog = () => {
    setNewCatalogName('');
    setNewCatalogDescription('');
    setNewCatalogCategoryFocus('Grocery & FMCG');
    setNewCatalogRetailerBanner('National Supermarkets & Grocery');
    setNewCatalogCloneFromCurrent(false);
    setIsCreateCatalogModalOpen(true);
  };

  const handleCreateCatalogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatalogName.trim()) return;

    const newId = `catalog-${Date.now().toString(36)}`;
    const newCatalog: SkuCatalog = {
      id: newId,
      name: newCatalogName.trim(),
      description: newCatalogDescription.trim() || 'Custom Australian Retail SKU Range',
      categoryFocus: newCatalogCategoryFocus,
      retailerBanner: newCatalogRetailerBanner,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      products: newCatalogCloneFromCurrent ? [...products] : [],
    };

    if (onCreateCatalog) {
      onCreateCatalog(newCatalog);
    }
    setIsCreateCatalogModalOpen(false);
    showToast(`Created new range: "${newCatalog.name}" with ${newCatalog.products.length} SKUs.`);
  };

  const handleOpenEditCatalog = () => {
    if (!currentCatalog) return;
    setNewCatalogName(currentCatalog.name);
    setNewCatalogDescription(currentCatalog.description || '');
    setNewCatalogCategoryFocus(currentCatalog.categoryFocus || 'Grocery & FMCG');
    setNewCatalogRetailerBanner(currentCatalog.retailerBanner || 'National Supermarkets & Grocery');
    setIsEditCatalogModalOpen(true);
  };

  const handleEditCatalogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCatalog || !newCatalogName.trim()) return;

    const updated: SkuCatalog = {
      ...currentCatalog,
      name: newCatalogName.trim(),
      description: newCatalogDescription.trim(),
      categoryFocus: newCatalogCategoryFocus,
      retailerBanner: newCatalogRetailerBanner,
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateCatalog) {
      onUpdateCatalog(updated);
    }
    setIsEditCatalogModalOpen(false);
    showToast(`Updated range details for "${updated.name}".`);
  };

  const handleDuplicateCatalog = () => {
    if (!currentCatalog) return;
    const duplicated: SkuCatalog = {
      id: `catalog-${Date.now().toString(36)}`,
      name: `${currentCatalog.name} (Copy)`,
      description: currentCatalog.description,
      categoryFocus: currentCatalog.categoryFocus,
      retailerBanner: currentCatalog.retailerBanner,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      products: JSON.parse(JSON.stringify(products)),
    };

    if (onCreateCatalog) {
      onCreateCatalog(duplicated);
    }
    showToast(`Duplicated range into "${duplicated.name}".`);
  };

  const handleConfirmDeleteCatalog = () => {
    if (!catalogToDelete) return;
    if (catalogs.length <= 1) {
      alert("You must keep at least one SKU range catalog.");
      setCatalogToDelete(null);
      return;
    }

    if (onDeleteCatalog) {
      onDeleteCatalog(catalogToDelete.id);
    }
    setCatalogToDelete(null);
    showToast(`Deleted catalogue range: "${catalogToDelete.name}".`);
  };

  // CSV Export & Template
  const handleExportCsv = () => {
    const csvContent = exportProductsToCsv(products);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RangeCraft_${currentCatalog ? currentCatalog.name.replace(/\s+/g, '_') : 'Product_Catalog'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const templateContent = generateProductCsvTemplate();
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RangeCraft_SKU_Range_Template_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create Product Submit
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const rrpNum = parseFloat(newRrp) || 29.99;
    const costNum = parseFloat(newCost) || 12.00;
    const margin = Number((((rrpNum - costNum) / rrpNum) * 100).toFixed(1));

    const product: Product = {
      sku: newSku || `SKU-CUST-${Date.now().toString().slice(-4)}`,
      name: newName || 'New Product Range Item',
      category: newCategory,
      subcategory: newSubcategory,
      rrp: rrpNum,
      cost: costNum,
      marginPercent: margin,
      weeklyUnitsBaseline: parseInt(newBaselineUnits) || 50,
      performanceTier: newPerformanceTier,
      seasonalPeak: newSeasonalPeak,
      targetWeeks: [4, 18, 34, 47],
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      stockLevel: 1200,
      minPromoGapWeeks: parseInt(newMinHiatus) || 4,
      supplierCoOpEligible: newCoOpEligible
    };

    onAddProduct(product);
    setIsAddModalOpen(false);
    showToast(`Added SKU ${product.sku} to range.`);
  };

  // Helper render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortBy === field) {
      return sortOrder === 'asc' 
        ? <ArrowUp className="w-3.5 h-3.5 text-blue-500 inline ml-1 flex-shrink-0" />
        : <ArrowDown className="w-3.5 h-3.5 text-blue-500 inline ml-1 flex-shrink-0" />;
    }
    return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 inline ml-1 opacity-60 flex-shrink-0" />;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              onClick={toast.onUndo}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. RANGE CATALOGUE SWITCHER & MULTI-RANGE MANAGEMENT BAR                 */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Left: Active Catalogue Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active SKU Range / Catalogue
                </span>
                <div className="flex items-center gap-2">
                  <select
                    id="select-sku-catalog"
                    value={activeCatalogId || (currentCatalog?.id)}
                    onChange={(e) => onSelectCatalog && onSelectCatalog(e.target.value)}
                    className="font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer max-w-xs truncate"
                  >
                    {catalogs.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.products ? cat.products.length : products.length} SKUs)
                      </option>
                    ))}
                  </select>
                  {currentCatalog?.retailerBanner && (
                    <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Store className="w-3 h-3 text-slate-500" />
                      <span>{currentCatalog.retailerBanner}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Catalogue Actions (New Range, Edit, Duplicate, Delete) */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="btn-create-new-range"
              onClick={handleOpenCreateCatalog}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Create a new separate SKU range"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ New Range</span>
            </button>

            <button
              id="btn-edit-active-range"
              onClick={handleOpenEditCatalog}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
              title="Edit name, retailer banner, and description"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Details</span>
            </button>

            <button
              id="btn-duplicate-range"
              onClick={handleDuplicateCatalog}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
              title="Duplicate this range into a new separate catalogue"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>

            {catalogs.length > 1 && currentCatalog && (
              <button
                id="btn-delete-range"
                onClick={() => setCatalogToDelete(currentCatalog)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 cursor-pointer transition-colors"
                title="Delete this range"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Delete Range</span>
              </button>
            )}

            {/* Clear All SKUs in Range */}
            {products.length > 0 && (
              <button
                id="btn-clear-all-skus"
                onClick={() => setIsClearAllModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer transition-colors ml-auto sm:ml-0"
                title="Remove all SKUs in this catalog"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All ({products.length})</span>
              </button>
            )}
          </div>
        </div>

        {currentCatalog?.description && (
          <p className="text-xs text-slate-500 border-t border-slate-100 pt-2.5">
            {currentCatalog.description}
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP ACTION BUTTON STRIP (CSV, TEMPLATE, AUTO PLAN, ADD SKU)           */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                <span>Range Inventory ({products.length} SKUs in "{currentCatalog?.name || 'Active Range'}")</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Data Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate trade margins, co-op scan funding, discount depth, and 52-week promotional performance across Australian retail channels.
            </p>
          </div>

          {/* Action Button Strip */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 text-xs font-semibold border border-emerald-500/40 shadow-sm cursor-pointer transition-all"
              title="Download clean CSV template with instructions"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>CSV Template</span>
            </button>

            <button
              id="btn-upload-csv-focal"
              onClick={onOpenUploadModal}
              className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white text-sm sm:text-base font-black shadow-xl shadow-emerald-600/40 ring-4 ring-emerald-400/80 hover:scale-[1.03] active:scale-100 transition-all cursor-pointer group animate-pulse"
              title="Import CSV range and run portfolio diagnostics"
            >
              <Upload className="w-5 h-5 text-emerald-200 group-hover:rotate-12 transition-transform" />
              <span>Import Range CSV</span>
            </button>

            <button
              onClick={onAutoGeneratePlanFromRange}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-900/30 hover:bg-blue-900/50 text-blue-200 border border-blue-700 hover:border-blue-500 text-sm font-bold cursor-pointer transition-all shadow-sm"
              title="Slot this SKU range into the 52-week promotional calendar"
            >
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>Auto-Build Promo Plan</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors shadow-sm"
              title="Download your current SKU catalog as a CSV"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export CSV</span>
            </button>

            <button
              id="btn-add-single-sku"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add SKU</span>
            </button>
          </div>
        </div>

        {/* Portfolio Summary Diagnostics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Active SKUs</span>
            <span className="text-base font-black text-white font-mono">{products.length}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Range RRP</span>
            <span className="text-base font-black text-white font-mono">${(portfolioAnalysis?.overallAvgRrp || 0).toFixed(2)}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Base Margin</span>
            <span className="text-base font-black text-emerald-400 font-mono">{(portfolioAnalysis?.overallAvgMargin || 0).toFixed(1)}%</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Weekly Baseline Volume</span>
            <span className="text-base font-black text-blue-400 font-mono">{formatNumber(Math.round((portfolioAnalysis?.totalAnnualBaselineUnits || 0) / 52))} u</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Annual Baseline Val</span>
            <span className="text-base font-black text-white font-mono">{formatAud(portfolioAnalysis?.totalAnnualBaselineRevenueAud || 0)}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Scan Rebate Eligible</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {products.filter(p => p.supplierCoOpEligible).length} / {products.length}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LIVE SCAN REBATE MARGIN SIMULATOR WIDGET                              */}
      {/* ========================================================================= */}
      <ScanRebateMarginSimulator />

      {/* ========================================================================= */}
      {/* 4. SEARCH, FILTERS & PRESET WORKSPACE                                    */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        
        {/* Search & Action Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU Code, Brand Name, Subcategory, or Tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isAdvancedFiltersOpen || activeFiltersCount > 0
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Filter Presets */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Quick Views:
          </span>
          <button
            onClick={() => handleApplyPreset('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              activeFiltersCount === 0 
                ? 'bg-blue-600 text-white font-bold' 
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All SKUs ({products.length})
          </button>
          <button
            onClick={() => handleApplyPreset('high_margin')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              marginBracket === 'high_50' 
                ? 'bg-emerald-600 text-white font-bold' 
                : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            High Margin (50%+)
          </button>
          <button
            onClick={() => handleApplyPreset('volume_heroes')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              selectedTier === 'tier1_hero' 
                ? 'bg-amber-600 text-white font-bold' 
                : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            Tier 1 Volume Heroes
          </button>
          <button
            onClick={() => handleApplyPreset('coop_funded')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              fundingStatus === 'coop' 
                ? 'bg-blue-600 text-white font-bold' 
                : 'bg-slate-950 text-blue-400 hover:text-blue-300 border border-slate-800'
            }`}
          >
            Vendor Scan Funded
          </button>
          <button
            onClick={() => handleApplyPreset('gap_skus')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              promoActivityFilter === 'unpromoted_gap' 
                ? 'bg-purple-600 text-white font-bold' 
                : 'bg-slate-950 text-purple-400 hover:text-purple-300 border border-slate-800'
            }`}
          >
            Unscheduled Gap SKUs
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer ml-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Category Pills Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedSubcategory('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-500 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              All Categories ({products.length})
            </button>
            {categories.map((cat, idx) => {
              const count = products.filter(p => p.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={`cat-tab-${cat}-${idx}`}
                  onClick={() => {
                    setSelectedCategory(isSelected ? 'ALL' : cat);
                    setSelectedSubcategory('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-blue-800 text-white' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters Expandable Grid */}
        {isAdvancedFiltersOpen && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            {/* Subcategory */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Subcategory ({subcategories.length})</label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Subcategories</option>
                {subcategories.map((sub, idx) => (
                  <option key={`sub-opt-${sub}-${idx}`} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Performance Tier */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Performance Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Tiers</option>
                <option value="tier1_hero">Tier 1: High Volume Hero</option>
                <option value="tier2_margin">Tier 2: Margin Builder</option>
                <option value="tier3_niche">Tier 3: Niche / Premium</option>
                <option value="tier4_clearance">Tier 4: Clearance</option>
              </select>
            </div>

            {/* RRP Bracket */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">RRP Price Bracket</label>
              <select
                value={rrpBracket}
                onChange={(e) => setRrpBracket(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Price Points</option>
                <option value="under_20">&lt; $20 AUD (Impulse)</option>
                <option value="20_50">$20 - $50 AUD (Core Mass)</option>
                <option value="50_150">$50 - $150 AUD (Mid-Tier)</option>
                <option value="150_plus">$150+ AUD (High-Ticket)</option>
              </select>
            </div>

            {/* Funding Status */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Scan Funding Mode</label>
              <select
                value={fundingStatus}
                onChange={(e) => setFundingStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Funding Models</option>
                <option value="coop">Vendor Scan Rebate Eligible</option>
                <option value="retailer">Retailer Funded Only</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. FLOATING / STICKY BULK ACTION BAR (DELETE MULTI-SKU & EDITS)           */}
      {/* ========================================================================= */}
      {selectedSkus.length > 0 && (
        <div className="sticky top-16 z-30 bg-slate-900 border border-blue-500/50 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
              {selectedSkus.length} SKU{selectedSkus.length > 1 ? 's' : ''} Selected
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Delete Selected Button */}
            <button
              id="btn-delete-selected-skus"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedSkus.length})</span>
            </button>

            {/* Reassign Category */}
            <button
              onClick={() => setBulkCategoryModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <FolderEdit className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Department</span>
            </button>

            {/* Add Tags */}
            <button
              onClick={() => setBulkTagsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Tags</span>
            </button>

            {/* Adjust Price % */}
            <button
              onClick={() => setBulkDiscountModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">% Price</span>
            </button>

            {/* Deselect All */}
            <button
              onClick={() => setSelectedSkus([])}
              className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PRODUCT RANGE DATA TABLE                                              */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    aria-label="Select all products"
                    className="rounded text-blue-500 focus:ring-blue-400 bg-slate-950 border-slate-800 cursor-pointer"
                  />
                </th>
                
                {/* SKU Code & Name */}
                <th 
                  onClick={() => handleHeaderSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-400 transition-colors select-none group"
                >
                  <div className="flex items-center">
                    <span>SKU & Product Name</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>

                {/* Category */}
                <th 
                  onClick={() => handleHeaderSort('category')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-400 transition-colors select-none group"
                >
                  <div className="flex items-center">
                    <span>Category & Subcategory</span>
                    {renderSortIndicator('category')}
                  </div>
                </th>

                {/* Performance Tier */}
                <th className="py-3.5 px-4 select-none">
                  <span>Tier</span>
                </th>

                {/* RRP */}
                <th 
                  onClick={() => handleHeaderSort('rrp')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-400 transition-colors select-none group"
                >
                  <div className="flex items-center">
                    <span>RRP (AUD)</span>
                    {renderSortIndicator('rrp')}
                  </div>
                </th>

                {/* Cost */}
                <th 
                  onClick={() => handleHeaderSort('cost')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-400 transition-colors select-none group"
                >
                  <div className="flex items-center">
                    <span>Unit Cost</span>
                    {renderSortIndicator('cost')}
                  </div>
                </th>

                {/* Base Margin % */}
                <th 
                  onClick={() => handleHeaderSort('margin')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-400 transition-colors select-none group"
                >
                  <div className="flex items-center">
                    <span>Base Margin</span>
                    {renderSortIndicator('margin')}
                  </div>
                </th>

                {/* Baseline Units */}
                <th 
                  onClick={() => handleHeaderSort('units')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-400 transition-colors select-none group"
                >
                  <div className="flex items-center">
                    <span>Baseline Volume</span>
                    {renderSortIndicator('units')}
                  </div>
                </th>

                {/* 52-Wk Promo Performance */}
                <th 
                  onClick={() => handleHeaderSort('projectedPromoRevenue')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-400 transition-colors select-none group"
                >
                  <div className="flex items-center">
                    <span>52-Wk Performance</span>
                    {renderSortIndicator('projectedPromoRevenue')}
                  </div>
                </th>

                {/* Vendor Co-Op */}
                <th className="py-3.5 px-4 select-none">
                  <span>Trade Funding</span>
                </th>

                {/* Action Buttons (Details + Single Delete) */}
                <th className="py-3.5 px-4 text-right select-none">
                  <span>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-sans">
                    <Package className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
                    <p className="font-semibold text-slate-400">No SKUs match the current range and filter criteria.</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting your filters or adding a new SKU to this range.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const isExpanded = expandedSkus.includes(p.sku);
                  const promoStats = skuPromoStatsMap[p.sku];
                  const isSelected = selectedSkus.includes(p.sku);

                  return (
                    <React.Fragment key={`prod-row-${p.sku}-${idx}`}>
                      <tr className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-blue-500/10' : ''}`}>
                        
                        {/* Checkbox */}
                        <td className="py-3.5 px-4 w-10 font-sans">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectSku(p.sku)}
                            aria-label={`Select product ${p.name}`}
                            className="rounded text-blue-500 focus:ring-blue-400 bg-slate-950 border-slate-800 cursor-pointer"
                          />
                        </td>

                        {/* SKU & Name */}
                        <td className="py-3.5 px-4 font-sans max-w-[240px]">
                          <div className="font-mono text-[11px] text-blue-400 font-bold">{p.sku}</div>
                          <div className="font-semibold text-white mt-0.5 truncate" title={p.name}>{p.name}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.tags.slice(0, 3).map((t, tIdx) => (
                              <span key={`tag-${p.sku}-${t}-${tIdx}`} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                {t}
                              </span>
                            ))}
                            {p.tags.length > 3 && (
                              <span className="text-[9px] text-slate-500">+{p.tags.length - 3}</span>
                            )}
                          </div>
                        </td>

                        {/* Category & Subcategory */}
                        <td className="py-3.5 px-4 font-sans">
                          <div className="text-white font-medium">{p.category}</div>
                          <div className="text-slate-400 text-[11px]">{p.subcategory}</div>
                        </td>

                        {/* Tier Status */}
                        <td className="py-3.5 px-4 font-sans">
                          {p.performanceTier === 'tier1_hero' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Tier 1 Hero
                            </span>
                          )}
                          {p.performanceTier === 'tier2_margin' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Tier 2 Margin
                            </span>
                          )}
                          {p.performanceTier === 'tier3_niche' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Tier 3 Niche
                            </span>
                          )}
                          {p.performanceTier === 'tier4_clearance' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Tier 4 Clearance
                            </span>
                          )}
                        </td>

                        {/* RRP */}
                        <td className="py-3.5 px-4 font-bold text-white">
                          ${p.rrp.toFixed(2)}
                        </td>

                        {/* Cost */}
                        <td className="py-3.5 px-4 text-slate-400">
                          ${p.cost.toFixed(2)}
                        </td>

                        {/* Base Margin */}
                        <td className="py-3.5 px-4 font-semibold text-emerald-400">
                          {p.marginPercent.toFixed(1)}%
                        </td>

                        {/* Baseline Volume */}
                        <td className="py-3.5 px-4 font-medium text-slate-300">
                          {p.weeklyUnitsBaseline} u/wk
                        </td>

                        {/* 52-Wk Promo Performance */}
                        <td className="py-3.5 px-4 font-sans">
                          {promoStats && promoStats.plannedWeeksCount > 0 ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-[11px]">
                                  {formatAud(promoStats.totalProjectedRevenueAud)}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-bold">
                                  {promoStats.plannedWeeksCount} wks
                                </span>
                              </div>
                              <div className="text-[10px] text-emerald-400 font-medium">
                                +{((promoStats.avgLiftMultiplier - 1) * 100).toFixed(0)}% Lift ({formatNumber(promoStats.totalProjectedUnits)} u)
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              Unscheduled Gap
                            </span>
                          )}
                        </td>

                        {/* Vendor Co-Op */}
                        <td className="py-3.5 px-4 font-sans">
                          {p.supplierCoOpEligible ? (
                            <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Scan Rebate
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Retailer Funded</span>
                          )}
                        </td>

                        {/* Action Buttons: Single SKU Delete & Expand */}
                        <td className="py-3.5 px-4 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Single SKU Delete Button */}
                            <button
                              onClick={() => setSkuToDelete(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                              title={`Delete ${p.sku}`}
                              aria-label={`Delete SKU ${p.sku}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Details Toggle */}
                            <button
                              onClick={() => toggleExpandSku(p.sku)}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-blue-400 font-bold text-[11px] border border-slate-800 flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <span>{isExpanded ? 'Hide' : 'Details'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded SKU Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/95 border-b border-slate-800">
                          <td colSpan={11} className="p-5 font-sans">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/30">
                                    {p.sku}
                                  </span>
                                  <h4 className="text-sm font-bold text-white">{p.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setSkuToDelete(p)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete this SKU</span>
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Financial Structure</span>
                                  <p className="text-slate-300">RRP: <span className="text-white font-bold">${p.rrp.toFixed(2)}</span></p>
                                  <p className="text-slate-300">Cost: <span className="text-slate-400">${p.cost.toFixed(2)}</span></p>
                                  <p className="text-slate-300">Base Margin: <span className="text-emerald-400 font-bold">${(p.rrp - p.cost).toFixed(2)} ({p.marginPercent.toFixed(1)}%)</span></p>
                                  <p className="text-slate-300">Co-Op Rebate: <span className="text-blue-400">{p.supplierCoOpEligible ? 'Eligible' : 'Not Configured'}</span></p>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Trade & Compliance</span>
                                  <p className="text-slate-300">ACCC Hiatus Requirement: <span className="text-white font-bold">{p.minPromoGapWeeks || 4} Weeks</span></p>
                                  <p className="text-slate-300">Seasonal Peak: <span className="text-amber-400 font-bold">{p.seasonalPeak || 'General'}</span></p>
                                  <p className="text-slate-300">Weekly Baseline Volume: <span className="text-blue-400 font-bold">{p.weeklyUnitsBaseline} units</span></p>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">52-Week Promo Slots</span>
                                  {promoStats && promoStats.plannedWeeks.length > 0 ? (
                                    <div className="space-y-1">
                                      <p className="text-slate-300">Planned Weeks: <span className="text-blue-400 font-bold">{promoStats.plannedWeeks.join(', ')}</span></p>
                                      <p className="text-slate-300">Projected Revenue: <span className="text-emerald-400 font-bold">{formatAud(promoStats.totalProjectedRevenueAud)}</span></p>
                                      <p className="text-slate-300">ACCC Hiatus Status: <span className={promoStats.isClashingHiatus ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{promoStats.isClashingHiatus ? 'Violation Detected' : '100% Compliant'}</span></p>
                                    </div>
                                  ) : (
                                    <p className="text-slate-500 italic">No promotional weeks assigned for this SKU yet.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. MODALS: SINGLE SKU DELETE CONFIRMATION MODAL                           */}
      {/* ========================================================================= */}
      {skuToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Delete SKU Confirmation</h3>
              </div>
              <button onClick={() => setSkuToDelete(null)} className="text-slate-400 hover:text-white cursor-pointer font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to remove SKU <span className="text-amber-400 font-mono font-bold">{skuToDelete.sku}</span> (<span className="text-white font-bold">{skuToDelete.name}</span>) from the catalog?
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Category: <span className="text-white">{skuToDelete.category} - {skuToDelete.subcategory}</span></p>
              <p className="text-slate-400">RRP: <span className="text-white">${skuToDelete.rrp.toFixed(2)} AUD</span></p>
              <p className="text-slate-400">Baseline Volume: <span className="text-white">{skuToDelete.weeklyUnitsBaseline} units/week</span></p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSkuToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODALS: BULK MULTI-SKU DELETE CONFIRMATION MODAL                       */}
      {/* ========================================================================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Bulk Delete {selectedSkus.length} SKUs</h3>
              </div>
              <button onClick={() => setIsBulkDeleteModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete the <span className="text-white font-bold">{selectedSkus.length} selected SKU(s)</span> from this range?
            </p>

            <div className="max-h-40 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
              {selectedSkus.map(sku => {
                const prod = products.find(p => p.sku === sku);
                return (
                  <div key={sku} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900">
                    <span className="text-blue-400 font-bold">{sku}</span>
                    <span className="text-slate-400 truncate max-w-[200px] font-sans">{prod?.name || sku}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {selectedSkus.length} SKUs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODALS: CLEAR ALL SKUS CONFIRMATION MODAL                              */}
      {/* ========================================================================= */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Clear All SKUs in Range</h3>
              </div>
              <button onClick={() => setIsClearAllModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              This will remove all <span className="text-white font-bold">{products.length} SKUs</span> from the current range ("<span className="text-blue-400 font-bold">{currentCatalog?.name || 'Active Range'}</span>").
            </p>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              You can restore the previous list using the Undo button that appears immediately after deletion.
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All ({products.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODALS: CREATE NEW CATALOGUE MODAL                                    */}
      {/* ========================================================================= */}
      {isCreateCatalogModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Create New SKU Range / Catalogue</h3>
              </div>
              <button onClick={() => setIsCreateCatalogModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCatalogSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Range / Catalogue Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Hardware & Garden Range"
                  value={newCatalogName}
                  onChange={(e) => setNewCatalogName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Retailer Channel / Banner</label>
                <input
                  type="text"
                  placeholder="e.g. National Supermarkets / Hardware / Independent Grocers"
                  value={newCatalogRetailerBanner}
                  onChange={(e) => setNewCatalogRetailerBanner(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Primary Category Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Hardware & Garden / Beverages / Health"
                  value={newCatalogCategoryFocus}
                  onChange={(e) => setNewCatalogCategoryFocus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Range Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief note on trade terms or channel strategy..."
                  value={newCatalogDescription}
                  onChange={(e) => setNewCatalogDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCatalogCloneFromCurrent}
                    onChange={(e) => setNewCatalogCloneFromCurrent(e.target.checked)}
                    className="rounded text-blue-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-300 font-semibold">
                    Clone current range SKUs ({products.length} items) into new range
                  </span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1 pl-5">
                  If unchecked, the new range starts with an empty slate for fresh CSV upload or custom SKUs.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCatalogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Create Range</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MODALS: EDIT ACTIVE CATALOGUE DETAILS MODAL                           */}
      {/* ========================================================================= */}
      {isEditCatalogModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Edit Range Details</h3>
              </div>
              <button onClick={() => setIsEditCatalogModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCatalogSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Range Name *</label>
                <input
                  type="text"
                  required
                  value={newCatalogName}
                  onChange={(e) => setNewCatalogName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Retailer Channel / Banner</label>
                <input
                  type="text"
                  value={newCatalogRetailerBanner}
                  onChange={(e) => setNewCatalogRetailerBanner(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category Focus</label>
                <input
                  type="text"
                  value={newCatalogCategoryFocus}
                  onChange={(e) => setNewCatalogCategoryFocus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCatalogDescription}
                  onChange={(e) => setNewCatalogDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCatalogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. MODALS: DELETE CATALOGUE MODAL                                       */}
      {/* ========================================================================= */}
      {catalogToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Delete Entire Range</h3>
              </div>
              <button onClick={() => setCatalogToDelete(null)} className="text-slate-400 hover:text-white cursor-pointer font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete the range <span className="text-white font-bold">"{catalogToDelete.name}"</span>?
            </p>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCatalogToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCatalog}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. MODALS: ADD NEW PRODUCT MODAL                                         */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <span>Add Single SKU to Range</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SKU-BEV-009"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sparkling Mineral Water 1L"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department Category</label>
                  <input
                    type="text"
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subcategory</label>
                  <input
                    type="text"
                    required
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">RRP ($ AUD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newRrp}
                      onChange={(e) => setNewRrp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unit Cost ($ AUD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Weekly Baseline Units</label>
                  <input
                    type="number"
                    value={newBaselineUnits}
                    onChange={(e) => setNewBaselineUnits(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Performance Tier</label>
                  <select
                    value={newPerformanceTier}
                    onChange={(e) => setNewPerformanceTier(e.target.value as PerformanceTier)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="tier1_hero">Tier 1: High Volume Hero</option>
                    <option value="tier2_margin">Tier 2: Margin Builder</option>
                    <option value="tier3_niche">Tier 3: Niche / Premium</option>
                    <option value="tier4_clearance">Tier 4: Clearance</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-slate-200 font-semibold block">Supplier Scan Rebate Co-Op</label>
                  <p className="text-[11px] text-slate-500">Enable vendor scan funding on this SKU during promotional weeks.</p>
                </div>
                <input
                  type="checkbox"
                  checked={newCoOpEligible}
                  onChange={(e) => setNewCoOpEligible(e.target.checked)}
                  className="rounded text-blue-500 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Add SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. MODALS: BULK CATEGORY, TAGS, DISCOUNT, TIER MODALS                    */}
      {/* ========================================================================= */}
      {bulkCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Bulk Assign Category ({selectedSkus.length} SKUs)</h3>
              <button onClick={() => setBulkCategoryModalOpen(false)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>
            <form onSubmit={handleApplyBulkCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Category</label>
                <input
                  type="text"
                  required
                  value={newBulkCategory}
                  onChange={(e) => setNewBulkCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setBulkCategoryModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkTagsModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Bulk Add Tags ({selectedSkus.length} SKUs)</h3>
              <button onClick={() => setBulkTagsModalOpen(false)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>
            <form onSubmit={handleApplyBulkTags} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Peak, Hero, Scan Deal"
                  value={newBulkTags}
                  onChange={(e) => setNewBulkTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setBulkTagsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold">Apply Tags</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkDiscountModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Bulk % Price Adjustment ({selectedSkus.length} SKUs)</h3>
              <button onClick={() => setBulkDiscountModalOpen(false)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>
            <form onSubmit={handleApplyBulkDiscount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Adjustment Percentage (e.g. -10 for 10% discount, +5 for increase)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    required
                    value={bulkPctChange}
                    onChange={(e) => setBulkPctChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setBulkDiscountModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold">Apply {bulkPctChange}%</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkTierModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Bulk Set Performance Tier ({selectedSkus.length} SKUs)</h3>
              <button onClick={() => setBulkTierModalOpen(false)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>
            <form onSubmit={handleApplyBulkTier} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Performance Tier</label>
                <select
                  value={newBulkTier}
                  onChange={(e) => setNewBulkTier(e.target.value as PerformanceTier)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="tier1_hero">Tier 1: High Volume Hero</option>
                  <option value="tier2_margin">Tier 2: Margin Builder</option>
                  <option value="tier3_niche">Tier 3: Niche / Premium</option>
                  <option value="tier4_clearance">Tier 4: Clearance</option>
                </select>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setBulkTierModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold">Apply Tier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
