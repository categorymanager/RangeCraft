import React, { useState, useMemo, useEffect } from 'react';
import { AppTab, Product, PerformanceTier, ThemeMode, WeekPromotion, SkuCatalog, UserProfile } from '../types';
import { 
  exportProductsToCsv, 
  generateProductCsvTemplate, 
  analyzeProductRangePortfolio 
} from '../utils/csvHelpers';
import {
  buildSkuPromoDemandMap,
  computeSkuInventoryForecast,
  normalizeOptionalStock,
} from '../utils/inventoryForecast';
import { ScanRebateMarginSimulator } from './ScanRebateMarginSimulator';
import { SkuDeletionEngineView } from './SkuDeletionEngineView';
import { WorkspacePageHero } from './WorkspacePageHero';
import rangeInventoryHeroImg from '../assets/images/range_inventory_hero_1795341506551.jpg';
import { formatAud, formatNumber } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Package, 
  Layers, 
  CheckCircle2, 
  FileSpreadsheet,
  TrendingUp,
  Percent,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  FolderEdit,
  ChevronRight,
  RotateCcw,
  X,
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  Tag,
  FolderPlus,
  Copy,
  Edit3,
  Boxes,
  Store,
  Undo2,
  Calculator,
  HeartPulse,
  Wrench,
  Check
} from 'lucide-react';

export type RangeSubTab = 'catalog' | 'health' | 'simulator';

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
  onUpdateProduct?: (product: Product) => void;
  onImportProducts: (products: Product[]) => void;
  onDeleteProduct?: (sku: string) => void;
  onDeleteMultipleProducts?: (skus: string[]) => void;
  onClearAllProducts?: () => void;
  onOpenUploadModal: () => void;
  onAutoGeneratePlanFromRange: () => void;
  onUnlockExport?: (exportId: string, itemName: string, priceAud: number) => void;
  onOpenPricingModal?: () => void;
  userProfile?: UserProfile | null;
  initialSubTab?: RangeSubTab;
  currentTheme: ThemeMode;
  onSelectTab?: (tab: AppTab) => void;
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
  onUpdateProduct,
  onImportProducts,
  onDeleteProduct,
  onDeleteMultipleProducts,
  onClearAllProducts,
  onOpenUploadModal,
  onAutoGeneratePlanFromRange,
  onUnlockExport,
  onOpenPricingModal,
  userProfile,
  initialSubTab = 'catalog',
  currentTheme,
  onSelectTab,
}) => {
  const isLight = currentTheme.includes('light');

  // 0. Segmented Sub-Tab & Drawer State
  const [rangeSubTab, setRangeSubTab] = useState<RangeSubTab>(initialSubTab);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);
  const [isFilterSortSheetOpen, setIsFilterSortSheetOpen] = useState(false);
  const [inspectedSku, setInspectedSku] = useState<Product | null>(null);
  const [editingStockSku, setEditingStockSku] = useState<string | null>(null);
  const [editingStockDraft, setEditingStockDraft] = useState<string>('');
  const [drawerStockDraft, setDrawerStockDraft] = useState<string>('');

  useEffect(() => {
    setRangeSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    setDrawerStockDraft(
      inspectedSku?.stockLevel !== undefined && inspectedSku?.stockLevel !== null
        ? String(inspectedSku.stockLevel)
        : ''
    );
  }, [inspectedSku]);

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
  const [newStockLevel, setNewStockLevel] = useState('');
  const [newCoOpEligible, setNewCoOpEligible] = useState(true);
  const [newTags, setNewTags] = useState('Australia Day, Hero, Volume');

  // Active Catalog Object
  const currentCatalog = useMemo(() => {
    return catalogs.find(c => c.id === activeCatalogId) || catalogs[0] || null;
  }, [catalogs, activeCatalogId]);

  // Quick Health Flag Count for Segmented Health Review Badge
  const healthFlaggedCount = useMemo(() => {
    return products.filter(p => {
      const margin = p.marginPercent;
      const units = p.weeklyUnitsBaseline;
      let score = 50;
      if (margin >= 50) score += 25;
      else if (margin >= 35) score += 10;
      else if (margin < 25) score -= 25;
      else score -= 10;
      if (units >= 150) score += 20;
      else if (units >= 50) score += 5;
      else if (units <= 15) score -= 20;
      if (p.supplierCoOpEligible) score += 10;
      else score -= 5;
      const finalScore = Math.min(100, Math.max(0, Math.round(score)));
      return finalScore < 40 || (margin < 20 && units < 30);
    }).length;
  }, [products]);

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

  const allSeasonalPeaks = useMemo(() => Array.from(new Set(products.map(p => p.seasonalPeak).filter(Boolean))).sort(), [products]);
  const portfolioAnalysis = useMemo(() => analyzeProductRangePortfolio(products), [products]);
  const skuPromoDemandMap = useMemo(() => buildSkuPromoDemandMap(products, promotions), [products, promotions]);

  // Compute Promotional Performance & Custom Rules Hiatus Stats Per SKU
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

      // Custom Rules Hiatus Status Filter
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
          valA = typeof a.stockLevel === 'number' ? a.stockLevel : -1;
          valB = typeof b.stockLevel === 'number' ? b.stockLevel : -1;
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
      showToast("You must keep at least one SKU range catalog.");
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

  // Inline & Inspector Stock Edit Handler (preserves blank/undefined as unconstrained supply)
  const handleSaveInlineStock = (product: Product, rawValue: string) => {
    const normalized = normalizeOptionalStock(rawValue);
    const updated: Product = { ...product };
    if (normalized !== undefined) {
      updated.stockLevel = normalized;
    } else {
      delete updated.stockLevel;
    }

    if (onUpdateProduct) {
      onUpdateProduct(updated);
    } else {
      onImportProducts(products.map(item => (item.sku === product.sku ? updated : item)));
    }

    if (inspectedSku?.sku === product.sku) {
      setInspectedSku(updated);
    }
    setEditingStockSku(null);
    showToast(
      normalized === undefined
        ? `${product.sku} inventory cleared (unconstrained supply).`
        : `Updated ${product.sku} stock to ${formatNumber(normalized)} units.`
    );
  };

  // Create Product Submit
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const rrpNum = parseFloat(newRrp) || 29.99;
    const costNum = parseFloat(newCost) || 12.00;
    const margin = Number((((rrpNum - costNum) / rrpNum) * 100).toFixed(1));
    const parsedStock = normalizeOptionalStock(newStockLevel);

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
      minPromoGapWeeks: parseInt(newMinHiatus) || 4,
      supplierCoOpEligible: newCoOpEligible,
      ...(parsedStock !== undefined ? { stockLevel: parsedStock } : {}),
    };

    onAddProduct(product);
    setNewStockLevel('');
    setNewSku('');
    setNewName('');
    setIsAddModalOpen(false);
    showToast(`Added SKU ${product.sku} to range.`);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortBy === field) {
      return sortOrder === 'asc'
        ? <ArrowUp className="w-3.5 h-3.5 text-blue-500 inline ml-1 flex-shrink-0" />
        : <ArrowDown className="w-3.5 h-3.5 text-blue-500 inline ml-1 flex-shrink-0" />;
    }
    return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 inline ml-1 opacity-60 flex-shrink-0" />;
  };

  const sortLabelMap: Record<SortField, string> = {
    sku: 'SKU Code',
    name: 'Product Name',
    category: 'Category',
    subcategory: 'Subcategory',
    rrp: 'RRP ($)',
    cost: 'Unit Cost',
    margin: 'Margin %',
    marginDollars: 'Margin $',
    units: 'Weekly Units',
    annualBaselineRev: 'Annual Base Val',
    stockLevel: 'Stock Level',
    promoWeeksCount: 'Promo Weeks',
    projectedPromoRevenue: '52-Wk Promo Rev',
    projectedPromoUnits: 'Promo Units',
    projectedPromoMargin: 'Promo Margin',
    promoLift: 'Promo Lift',
    minHiatus: 'Hiatus Gap',
  };

  const getTierShortLabel = (tier: PerformanceTier) => {
    switch (tier) {
      case 'tier1_hero':
        return 'Tier 1 Hero';
      case 'tier2_margin':
        return 'Tier 2 Margin';
      case 'tier3_niche':
        return 'Tier 3 Niche';
      case 'tier4_clearance':
        return 'Tier 4 Clearance';
      default:
        return 'Standard';
    }
  };

  const getSkuHealthSummary = (p: Product) => {
    const promoStats = skuPromoStatsMap[p.sku];
    const promoWeeks = promoStats?.plannedWeeksCount || 0;
    const riskFactors: string[] = [];
    const opportunityFactors: string[] = [];
    let score = 50;

    if (p.marginPercent >= 50) {
      score += 25;
      opportunityFactors.push(`High margin (${p.marginPercent.toFixed(1)}%) protects gross profit`);
    } else if (p.marginPercent >= 35) {
      score += 10;
      opportunityFactors.push(`Healthy margin benchmark (${p.marginPercent.toFixed(1)}%)`);
    } else if (p.marginPercent < 25) {
      score -= 25;
      riskFactors.push(`Margin (${p.marginPercent.toFixed(1)}%) below 25% floor`);
    } else {
      score -= 10;
      riskFactors.push(`Thin margin (${p.marginPercent.toFixed(1)}%)`);
    }

    if (p.weeklyUnitsBaseline >= 150) {
      score += 20;
      opportunityFactors.push(`Strong baseline velocity (${p.weeklyUnitsBaseline} u/wk)`);
    } else if (p.weeklyUnitsBaseline >= 50) {
      score += 5;
    } else if (p.weeklyUnitsBaseline <= 15) {
      score -= 20;
      riskFactors.push(`Slow baseline velocity (${p.weeklyUnitsBaseline} u/wk)`);
    }

    if (p.supplierCoOpEligible) {
      score += 10;
      opportunityFactors.push('Vendor scan rebate funding eligible');
    } else {
      score -= 5;
      riskFactors.push('No vendor co-op rebate support');
    }

    if (promoWeeks > 8) {
      score -= 10;
      riskFactors.push(`Over-promoted (${promoWeeks} wks)`);
    } else if (promoWeeks === 0 && p.weeklyUnitsBaseline < 30) {
      score -= 15;
      riskFactors.push('Unpromoted gap SKU with low baseline volume');
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(score)));
    const statusLabel =
      finalScore < 40 || (p.marginPercent < 20 && p.weeklyUnitsBaseline < 30)
        ? 'Deletion Candidate'
        : finalScore < 55
        ? 'Renegotiate Terms'
        : finalScore < 75
        ? 'Optimize Margin'
        : 'Protect Hero';

    return { finalScore, statusLabel, riskFactors, opportunityFactors };
  };

  return (
    <div className="space-y-3 sm:space-y-5 animate-fadeIn">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 inset-x-3 md:inset-x-auto md:right-6 z-50 flex items-center justify-between md:justify-start gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-xs font-semibold">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              onClick={toast.onUndo}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CENTERED RANGE HERO + CATALOG BAR + SEGMENTED SUB-TABS                 */}
      {/* ========================================================================= */}
      <WorkspacePageHero
        stepLabel="Step 1 of 5 · Range Setup"
        title="Product Range & SKUs"
        subtitle="Manage unit costs, retail RRPs, baseline demand velocity, and range health before slotting your 52-week calendar."
        accent="blue"
        currentTheme={currentTheme}
        activeStep={1}
        onSelectTab={onSelectTab}
        heroImageSrc={rangeInventoryHeroImg}
        heroImageAlt="Product Range and Inventory Shelves Illustration"
        FallbackIcon={Boxes}
        actions={
          <>
            <button
              id="btn-add-single-sku"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add SKU</span>
            </button>

            <button
              id="btn-upload-csv-focal"
              type="button"
              onClick={onOpenUploadModal}
              className="hidden sm:flex min-h-[44px] items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>Import CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsToolsDrawerOpen(true)}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Wrench className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Range &amp; Tools</span>
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {/* Active Range Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="hidden sm:flex p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <select
                  id="select-sku-catalog"
                  aria-label="Active SKU range catalog"
                  value={activeCatalogId || (currentCatalog?.id)}
                  onChange={(e) => onSelectCatalog && onSelectCatalog(e.target.value)}
                  className="w-full sm:max-w-xs min-w-0 min-h-[42px] font-bold text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
                >
                  {catalogs.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.products ? cat.products.length : products.length} SKUs)
                    </option>
                  ))}
                </select>
                {currentCatalog?.retailerBanner && (
                  <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                    <Store className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{currentCatalog.retailerBanner}</span>
                  </span>
                )}
              </div>
            </div>

            {/* 3-Way Segmented Sub-Tab Switcher */}
            <div
              role="tablist"
              aria-label="Inventory and Range Review Sections"
              className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 sm:min-w-[340px]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={rangeSubTab === 'catalog'}
                onClick={() => setRangeSubTab('catalog')}
                className={`min-h-[38px] px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  rangeSubTab === 'catalog'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Catalog</span>
                <span className="font-mono text-[11px] opacity-75 tabular-nums">({products.length})</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={rangeSubTab === 'health'}
                onClick={() => setRangeSubTab('health')}
                className={`min-h-[38px] px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  rangeSubTab === 'health'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                <span>Health Review</span>
                {healthFlaggedCount > 0 && (
                  <span className="font-mono text-[11px] font-black text-rose-600 dark:text-rose-400 tabular-nums">
                    ({healthFlaggedCount})
                  </span>
                )}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={rangeSubTab === 'simulator'}
                onClick={() => setRangeSubTab('simulator')}
                className={`min-h-[38px] px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  rangeSubTab === 'simulator'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 shrink-0" />
                <span>Simulator</span>
              </button>
            </div>
          </div>
        </div>
      </WorkspacePageHero>

      {/* ========================================================================= */}
      {/* SUB-TAB 2: RANGE HEALTH REVIEW (EMBEDDED RATIONALIZATION ENGINE)          */}
      {/* ========================================================================= */}
      {rangeSubTab === 'health' && (
        <SkuDeletionEngineView
          embedded
          products={products}
          promotions={promotions}
          onDeleteProduct={onDeleteProduct}
          onDeleteMultipleProducts={onDeleteMultipleProducts}
          onImportProducts={onImportProducts}
          onUnlockExport={onUnlockExport}
          onOpenPricingModal={onOpenPricingModal}
          userProfile={userProfile}
          currentTheme={currentTheme}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SCAN REBATE MARGIN SIMULATOR                                   */}
      {/* ========================================================================= */}
      {rangeSubTab === 'simulator' && (
        <ScanRebateMarginSimulator products={products} />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CATALOG (SKU-FIRST MOBILE + DARK CONTRAST KPI BAND)            */}
      {/* ========================================================================= */}
      {rangeSubTab === 'catalog' && (
        <>
          {/* Dark Contrast Portfolio Telemetry Band (on mobile, lives in Range & Tools Drawer) */}
          <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 divide-x divide-slate-800 bg-[#0F172A] border border-slate-800 rounded-3xl text-xs text-white shadow-sm overflow-hidden">
            <div className="p-4">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Active SKUs</span>
              <span className="text-xl font-black text-white font-mono tabular-nums mt-1 block">{products.length}</span>
            </div>
            <div className="p-4">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Avg RRP</span>
              <span className="text-xl font-black text-white font-mono tabular-nums mt-1 block">${(portfolioAnalysis?.overallAvgRrp || 0).toFixed(2)}</span>
            </div>
            <div className="p-4">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Avg Margin</span>
              <span className="text-xl font-black text-emerald-400 font-mono tabular-nums mt-1 block">{(portfolioAnalysis?.overallAvgMargin || 0).toFixed(1)}%</span>
            </div>
            <div className="p-4">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Weekly Units</span>
              <span className="text-xl font-black text-sky-400 font-mono tabular-nums mt-1 block">{formatNumber(Math.round((portfolioAnalysis?.totalAnnualBaselineUnits || 0) / 52))} u</span>
            </div>
            <div className="p-4">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Annual Base Val</span>
              <span className="text-xl font-black text-white font-mono tabular-nums mt-1 block">{formatAud(portfolioAnalysis?.totalAnnualBaselineRevenueAud || 0)}</span>
            </div>
            <div className="p-4">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Scan Eligible</span>
              <span className="text-xl font-black text-emerald-400 font-mono tabular-nums mt-1 block">
                {products.filter(p => p.supplierCoOpEligible).length} / {products.length}
              </span>
            </div>
          </div>

          {/* Compact Search + Sort & Filter Row */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search SKU code, name, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Sort & Filter Sheet Button */}
              <button
                type="button"
                onClick={() => setIsFilterSortSheetOpen(true)}
                className={`md:hidden min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  activeFiltersCount > 0 || sortBy !== 'sku'
                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/40'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Sort &amp; Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="font-mono text-[11px] font-black text-blue-600 dark:text-blue-300 tabular-nums">
                    ({activeFiltersCount})
                  </span>
                )}
              </button>

              {/* Desktop Filters Toggle */}
              <button
                type="button"
                onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                className={`hidden md:flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  isAdvancedFiltersOpen || activeFiltersCount > 0
                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/40'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="font-mono text-[11px] font-black text-blue-600 dark:text-blue-300 tabular-nums">
                    ({activeFiltersCount})
                  </span>
                )}
              </button>
            </div>

            {/* Desktop Quick Filter Presets & Category Strip */}
            <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleApplyPreset('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  activeFiltersCount === 0
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                All SKUs ({products.length})
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('high_margin')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  marginBracket === 'high_50'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                High Margin (50%+)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('volume_heroes')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedTier === 'tier1_hero'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Tier 1 Heroes
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('coop_funded')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  fundingStatus === 'coop'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-900 text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Scan Funded
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('gap_skus')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  promoActivityFilter === 'unpromoted_gap'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-900 text-purple-700 dark:text-purple-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Unscheduled Gaps
              </button>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer ml-auto flex items-center gap-1 whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {isAdvancedFiltersOpen && (
              <div className="hidden md:grid pt-3 border-t border-slate-100 dark:border-slate-800 grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Department Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSubcategory('ALL');
                    }}
                    className="w-full min-h-[40px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Categories ({products.length})</option>
                    {categories.map((cat, idx) => (
                      <option key={`dcat-${cat}-${idx}`} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Subcategory ({subcategories.length})</label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full min-h-[40px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Subcategories</option>
                    {subcategories.map((sub, idx) => (
                      <option key={`sub-opt-${sub}-${idx}`} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">RRP Price Bracket</label>
                  <select
                    value={rrpBracket}
                    onChange={(e) => setRrpBracket(e.target.value as any)}
                    className="w-full min-h-[40px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Price Points</option>
                    <option value="under_20">&lt; $20 AUD (Impulse)</option>
                    <option value="20_50">$20 - $50 AUD (Core Mass)</option>
                    <option value="50_150">$50 - $150 AUD (Mid-Tier)</option>
                    <option value="150_plus">$150+ AUD (High-Ticket)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Scan Funding Mode</label>
                  <select
                    value={fundingStatus}
                    onChange={(e) => setFundingStatus(e.target.value as any)}
                    className="w-full min-h-[40px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Funding Models</option>
                    <option value="coop">Vendor Scan Rebate Eligible</option>
                    <option value="retailer">Retailer Funded Only</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* FLOATING / STICKY BULK ACTION BAR (DELETE MULTI-SKU & EDITS)         */}
          {/* ===================================================================== */}
          {selectedSkus.length > 0 && (
            <div className="fixed bottom-[68px] inset-x-3 md:static z-30 bg-white dark:bg-slate-900 border border-blue-500/60 rounded-2xl px-3 py-2.5 shadow-xl md:shadow-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-black text-blue-700 dark:text-blue-300 tabular-nums whitespace-nowrap">
                  {selectedSkus.length} selected
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  id="btn-delete-selected-skus"
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkCategoryModalOpen(true)}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  title="Assign category"
                >
                  <FolderEdit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">Category</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkTagsModalOpen(true)}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  title="Add tags"
                >
                  <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">Tags</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkDiscountModalOpen(true)}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  title="Bulk % price adjustment"
                >
                  <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">% Price</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkTierModalOpen(true)}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  title="Assign performance tier"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="hidden sm:inline">Tier</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSkus([])}
                  aria-label="Clear selection"
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* PRODUCT RANGE LIST (COMPACT MOBILE ROWS + DESKTOP TABLE)             */}
          {/* ===================================================================== */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Compact Mobile List View (< md) */}
            <div className="md:hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                <label className="min-h-[36px] flex items-center gap-2.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    aria-label="Select all products"
                    className="rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 w-4 h-4 cursor-pointer"
                  />
                  <span>Select All ({filteredProducts.length})</span>
                </label>

                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="min-h-[36px] flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 cursor-pointer whitespace-nowrap"
                >
                  <span>{sortLabelMap[sortBy]}</span>
                  {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
                  <Package className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2 opacity-70" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No SKUs match your filters.</p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-3 min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((p, idx) => {
                    const promoStats = skuPromoStatsMap[p.sku];
                    const invForecast = computeSkuInventoryForecast(p, skuPromoDemandMap.get(p.sku));
                    const isSelected = selectedSkus.includes(p.sku);

                    return (
                      <div
                        key={`mob-sku-${p.sku}-${idx}`}
                        className={`px-4 py-3 flex items-center gap-2 transition-colors ${isSelected ? 'bg-blue-50/60 dark:bg-blue-500/10' : ''}`}
                      >
                        <label className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectSku(p.sku)}
                            aria-label={`Select product ${p.name}`}
                            className="rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 w-4 h-4 cursor-pointer"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setInspectedSku(p)}
                          className="flex-1 min-w-0 text-left flex items-center justify-between gap-3 py-0.5 cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{p.sku}</span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{getTierShortLabel(p.performanceTier)}</span>
                              <span aria-hidden="true">·</span>
                              <span>{p.supplierCoOpEligible ? 'Scan' : 'Retailer'}</span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">{p.name}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 tabular-nums">
                              {p.category} · {p.weeklyUnitsBaseline} u/wk ·{' '}
                              {invForecast.hasInventory ? (
                                <span
                                  className={
                                    invForecast.stockStatus === 'CRITICAL'
                                      ? 'font-bold text-rose-600 dark:text-rose-400'
                                      : invForecast.stockStatus === 'LOW'
                                      ? 'font-bold text-amber-600 dark:text-amber-400'
                                      : 'font-semibold text-emerald-600 dark:text-emerald-400'
                                  }
                                >
                                  {formatNumber(invForecast.currentStock || 0)} u ({invForecast.weeksOfCover}w)
                                </span>
                              ) : (
                                <span>Unconstrained</span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right tabular-nums">
                              <div className="font-mono text-sm font-black text-slate-900 dark:text-white">
                                ${p.rrp.toFixed(2)}
                              </div>
                              <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {p.marginPercent.toFixed(1)}% · {promoStats && promoStats.plannedWeeksCount > 0 ? `${promoStats.plannedWeeksCount}w` : 'Gap'}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Table View (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        aria-label="Select all products"
                        className="rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 cursor-pointer"
                      />
                    </th>
                    
                    <th 
                      onClick={() => handleHeaderSort('name')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                    >
                      <div className="flex items-center">
                        <span>SKU &amp; Product Name</span>
                        {renderSortIndicator('name')}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleHeaderSort('category')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                    >
                      <div className="flex items-center">
                        <span>Category &amp; Subcategory</span>
                        {renderSortIndicator('category')}
                      </div>
                    </th>

                    <th className="py-3.5 px-4 select-none">
                      <span>Tier</span>
                    </th>

                    <th 
                      onClick={() => handleHeaderSort('rrp')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                    >
                      <div className="flex items-center">
                        <span>RRP (AUD)</span>
                        {renderSortIndicator('rrp')}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleHeaderSort('cost')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                    >
                      <div className="flex items-center">
                        <span>Unit Cost</span>
                        {renderSortIndicator('cost')}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleHeaderSort('margin')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                    >
                      <div className="flex items-center">
                        <span>Base Margin</span>
                        {renderSortIndicator('margin')}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleHeaderSort('units')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                    >
                      <div className="flex items-center">
                        <span>Baseline Volume</span>
                        {renderSortIndicator('units')}
                      </div>
                    </th>

                    <th
                      onClick={() => handleHeaderSort('stockLevel')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                    >
                      <div className="flex items-center">
                        <span>Inventory &amp; Cover</span>
                        {renderSortIndicator('stockLevel')}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleHeaderSort('projectedPromoRevenue')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none group"
                    >
                      <div className="flex items-center">
                        <span>52-Wk Performance</span>
                        {renderSortIndicator('projectedPromoRevenue')}
                      </div>
                    </th>

                    <th className="py-3.5 px-4 select-none">
                      <span>Trade Funding</span>
                    </th>

                    <th className="py-3.5 px-4 text-right select-none">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-500 dark:text-slate-400 font-sans">
                        <Package className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2 opacity-60" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No SKUs match the current range and filter criteria.</p>
                        <p className="text-xs text-slate-500 mt-1">Try resetting your filters or adding a new SKU to this range.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p, idx) => {
                      const promoStats = skuPromoStatsMap[p.sku];
                      const invForecast = computeSkuInventoryForecast(p, skuPromoDemandMap.get(p.sku));
                      const isSelected = selectedSkus.includes(p.sku);
                      const isEditingStock = editingStockSku === p.sku;

                      return (
                        <tr
                          key={`prod-row-${p.sku}-${idx}`}
                          onClick={() => setInspectedSku(p)}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/70 dark:bg-blue-500/10' : ''}`}
                        >
                          <td className="py-3.5 px-4 w-10 font-sans" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectSku(p.sku)}
                              aria-label={`Select product ${p.name}`}
                              className="rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 cursor-pointer"
                            />
                          </td>

                          <td className="py-3.5 px-4 font-sans max-w-[240px]">
                            <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">{p.sku}</div>
                            <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate" title={p.name}>{p.name}</div>
                            {p.tags.length > 0 && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {p.tags.slice(0, 3).join(' · ')}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-sans">
                            <div className="text-slate-900 dark:text-white font-medium">{p.category}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-[11px]">{p.subcategory}</div>
                          </td>

                          <td className="py-3.5 px-4 font-sans whitespace-nowrap text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {getTierShortLabel(p.performanceTier)}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white tabular-nums">
                            ${p.rrp.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 tabular-nums">
                            ${p.cost.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {p.marginPercent.toFixed(1)}%
                          </td>

                          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                            {p.weeklyUnitsBaseline} u/wk
                          </td>

                          <td
                            className="py-3.5 px-4 font-sans whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isEditingStock ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  autoFocus
                                  placeholder="Blank"
                                  value={editingStockDraft}
                                  onChange={(e) => setEditingStockDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveInlineStock(p, editingStockDraft);
                                    } else if (e.key === 'Escape') {
                                      setEditingStockSku(null);
                                    }
                                  }}
                                  className="w-24 px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-blue-500 text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineStock(p, editingStockDraft)}
                                  title="Save inventory"
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineStock(p, '')}
                                  title="Clear inventory (unconstrained)"
                                  className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                                >
                                  Clear
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingStockSku(null)}
                                  title="Cancel edit"
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : invForecast.hasInventory ? (
                              <div className="space-y-0.5 tabular-nums">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                    {formatNumber(invForecast.currentStock || 0)} u
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingStockSku(p.sku);
                                      setEditingStockDraft(String(invForecast.currentStock ?? ''));
                                    }}
                                    title="Edit inventory on hand"
                                    className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineStock(p, '')}
                                    title="Clear inventory (leave blank)"
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                <div
                                  className={`text-[10px] font-semibold flex items-center gap-1 ${
                                    invForecast.stockStatus === 'CRITICAL'
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : invForecast.stockStatus === 'LOW'
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {invForecast.hasStockoutWarning ? (
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  )}
                                  <span>
                                    {invForecast.stockStatus === 'CRITICAL'
                                      ? `Stockout Risk (${invForecast.weeksOfCover}w)`
                                      : invForecast.stockStatus === 'LOW'
                                      ? `Low Cover (${invForecast.weeksOfCover}w)`
                                      : `${invForecast.weeksOfCover}w cover`}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                  — Unconstrained
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStockSku(p.sku);
                                    setEditingStockDraft('');
                                  }}
                                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/20 text-[10px] font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                                >
                                  Set
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-sans">
                            {promoStats && promoStats.plannedWeeksCount > 0 ? (
                              <div className="space-y-0.5 tabular-nums">
                                <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                                  {formatAud(promoStats.totalProjectedRevenueAud)} · {promoStats.plannedWeeksCount} wks
                                </div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  +{((promoStats.avgLiftMultiplier - 1) * 100).toFixed(0)}% Lift ({formatNumber(promoStats.totalProjectedUnits)} u)
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                Unscheduled Gap
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                            {p.supplierCoOpEligible ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Scan Rebate
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Retailer Funded</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSkuToDelete(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title={`Delete ${p.sku}`}
                                aria-label={`Delete SKU ${p.sku}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setInspectedSku(p)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <span>Inspect</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* DRAWER A: RANGE & TOOLS DRAWER (PORTFOLIO KPIs, CSV, CATALOGUE CRUD)      */}
      {/* ========================================================================= */}
      {isToolsDrawerOpen && (
        <div
          className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-xs flex items-end md:items-center md:justify-end"
          onClick={() => setIsToolsDrawerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Range Management and Commercial Tools"
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-md md:h-full max-h-[88dvh] md:max-h-none bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-none p-5 overflow-y-auto shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Range &amp; Commercial Tools</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {currentCatalog?.name || 'Active Catalogue'} · {products.length} SKUs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsToolsDrawerOpen(false)}
                aria-label="Close tools drawer"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Range Metrics */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Portfolio Metrics</h4>
              <div className="grid grid-cols-2 gap-2.5 text-xs tabular-nums">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Avg RRP / Margin</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    ${(portfolioAnalysis?.overallAvgRrp || 0).toFixed(2)} · {(portfolioAnalysis?.overallAvgMargin || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Annual Baseline Val</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {formatAud(portfolioAnalysis?.totalAnnualBaselineRevenueAud || 0)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Weekly Units</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                    {formatNumber(Math.round((portfolioAnalysis?.totalAnnualBaselineUnits || 0) / 52))} u/wk
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Scan Rebate Eligible</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {products.filter(p => p.supplierCoOpEligible).length} / {products.length} SKUs
                  </span>
                </div>
              </div>
            </div>

            {/* CSV & Auto-Plan Tools */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Data &amp; Planning Actions</h4>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    onOpenUploadModal();
                  }}
                  className="min-h-[44px] w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Import Range CSV</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    onAutoGeneratePlanFromRange();
                  }}
                  className="min-h-[44px] w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Auto-Build 52-Week Promo Plan</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>CSV Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Catalogue Management */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Manage Catalogue Ranges</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-create-new-range"
                  type="button"
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    handleOpenCreateCatalog();
                  }}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>New Range</span>
                </button>
                <button
                  id="btn-edit-active-range"
                  type="button"
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    handleOpenEditCatalog();
                  }}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>
                <button
                  id="btn-duplicate-range"
                  type="button"
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    handleDuplicateCatalog();
                  }}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate</span>
                </button>
                {catalogs.length > 1 && currentCatalog && (
                  <button
                    id="btn-delete-range"
                    type="button"
                    onClick={() => {
                      setIsToolsDrawerOpen(false);
                      setCatalogToDelete(currentCatalog);
                    }}
                    className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Range</span>
                  </button>
                )}
              </div>

              {products.length > 0 && (
                <button
                  id="btn-clear-all-skus"
                  type="button"
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    setIsClearAllModalOpen(true);
                  }}
                  className="min-h-[44px] w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200/70 dark:border-rose-500/20 text-xs font-bold cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All SKUs in Range ({products.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER B: MOBILE SORT & FILTER BOTTOM SHEET                               */}
      {/* ========================================================================= */}
      {isFilterSortSheetOpen && (
        <div
          className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-xs flex items-end md:items-center md:justify-center"
          onClick={() => setIsFilterSortSheetOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Sort and Filter SKUs"
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-lg max-h-[88dvh] bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Sort &amp; Filter SKUs</h3>
              <button
                type="button"
                onClick={() => setIsFilterSortSheetOpen(false)}
                aria-label="Close sort and filter sheet"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Sort Order */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Sort By</span>
                  <button
                    type="button"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['sku', 'name', 'rrp', 'margin', 'units', 'projectedPromoRevenue'] as SortField[]).map((field) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => setSortBy(field)}
                      className={`min-h-[40px] px-3 py-2 rounded-xl border text-left font-semibold cursor-pointer transition-colors ${
                        sortBy === field
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {sortLabelMap[field]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Filter Presets */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Quick Views</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('all')}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border font-semibold cursor-pointer ${
                      activeFiltersCount === 0
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    All SKUs ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('high_margin')}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border font-semibold cursor-pointer ${
                      marginBracket === 'high_50'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    High Margin 50%+
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('volume_heroes')}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border font-semibold cursor-pointer ${
                      selectedTier === 'tier1_hero'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Tier 1 Heroes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('gap_skus')}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border font-semibold cursor-pointer ${
                      promoActivityFilter === 'unpromoted_gap'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Unscheduled Gaps
                  </button>
                </div>
              </div>

              {/* Filter Selects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSubcategory('ALL');
                    }}
                    className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="ALL">All Categories ({products.length})</option>
                    {categories.map((cat, idx) => (
                      <option key={`mcat-${cat}-${idx}`} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Subcategory</label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="ALL">All Subcategories</option>
                    {subcategories.map((sub, idx) => (
                      <option key={`msub-${sub}-${idx}`} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">RRP Bracket</label>
                  <select
                    value={rrpBracket}
                    onChange={(e) => setRrpBracket(e.target.value as any)}
                    className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="ALL">All Price Points</option>
                    <option value="under_20">&lt; $20 AUD (Impulse)</option>
                    <option value="20_50">$20 - $50 AUD (Core Mass)</option>
                    <option value="50_150">$50 - $150 AUD (Mid-Tier)</option>
                    <option value="150_plus">$150+ AUD (High-Ticket)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Trade Funding</label>
                  <select
                    value={fundingStatus}
                    onChange={(e) => setFundingStatus(e.target.value as any)}
                    className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="ALL">All Funding Models</option>
                    <option value="coop">Vendor Scan Rebate Eligible</option>
                    <option value="retailer">Retailer Funded Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 shrink-0 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSortSheetOpen(false)}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer tabular-nums"
              >
                Show {filteredProducts.length} SKUs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER C: SKU DETAIL BOTTOM SHEET (MOBILE) / SLIDE-OVER DRAWER (DESKTOP)  */}
      {/* ========================================================================= */}
      {inspectedSku && (() => {
        const promoStats = skuPromoStatsMap[inspectedSku.sku];
        const health = getSkuHealthSummary(inspectedSku);
        const invForecast = computeSkuInventoryForecast(inspectedSku, skuPromoDemandMap.get(inspectedSku.sku));
        return (
          <div
            className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-xs flex items-end md:items-center md:justify-end"
            onClick={() => setInspectedSku(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Details for ${inspectedSku.name}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-lg md:h-full max-h-[88dvh] md:max-h-none bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-none p-5 overflow-y-auto shadow-2xl space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{inspectedSku.sku}</span>
                    <span aria-hidden="true">·</span>
                    <span>{getTierShortLabel(inspectedSku.performanceTier)}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {inspectedSku.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {inspectedSku.category} · {inspectedSku.subcategory}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedSku(null)}
                  aria-label="Close SKU details"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Financial & Volume Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-xs tabular-nums">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">RRP / Cost</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white block mt-0.5">
                    ${inspectedSku.rrp.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ${inspectedSku.cost.toFixed(2)} cost
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Base Margin</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {inspectedSku.marginPercent.toFixed(1)}%
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ${(inspectedSku.rrp - inspectedSku.cost).toFixed(2)}/u
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Baseline</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400 block mt-0.5">
                    {inspectedSku.weeklyUnitsBaseline} u/wk
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatAud(inspectedSku.rrp * inspectedSku.weeklyUnitsBaseline * 52)}/yr
                  </span>
                </div>
              </div>

              {/* Inventory & Supply Forecast Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Inventory &amp; Supply Forecast</span>
                  </span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      !invForecast.hasInventory
                        ? 'text-slate-500 dark:text-slate-400'
                        : invForecast.stockStatus === 'CRITICAL'
                        ? 'text-rose-600 dark:text-rose-400'
                        : invForecast.stockStatus === 'LOW'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {!invForecast.hasInventory ? (
                      <span>Unconstrained</span>
                    ) : invForecast.hasStockoutWarning ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>
                          {invForecast.stockStatus === 'CRITICAL' ? 'Stockout Risk' : 'Low Cover'} · {invForecast.weeksOfCover}w cover
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Healthy · {invForecast.weeksOfCover}w cover</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Leave blank (unconstrained)"
                    value={drawerStockDraft}
                    onChange={(e) => setDrawerStockDraft(e.target.value)}
                    className="flex-1 min-h-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveInlineStock(inspectedSku, drawerStockDraft)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
                  >
                    Save
                  </button>
                  {invForecast.hasInventory && (
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerStockDraft('');
                        handleSaveInlineStock(inspectedSku, '');
                      }}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs cursor-pointer whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {invForecast.hasInventory ? (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] tabular-nums">
                    <div>
                      <span className="text-slate-500 block">Promo Allocated</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatNumber(invForecast.allocatedForPromo)} u
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Free Stock</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatNumber(invForecast.freeAvailableStock || 0)} u
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Weeks of Cover</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {invForecast.weeksOfCover} wks
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Inventory is left blank — stockout alerts are ignored and forecasting assumes unconstrained supply.
                  </p>
                )}

                {invForecast.hasInventory && invForecast.annualShortfallUnits > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      52-week promo demand ({formatNumber(invForecast.allocatedForPromo)} u) exceeds on-hand stock by{' '}
                      <strong className="font-mono">{formatNumber(invForecast.annualShortfallUnits)} units</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* 52-Week Plan & Compliance */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">52-Week Promotional Schedule</span>
                  <span className={`font-bold flex items-center gap-1 ${promoStats?.isClashingHiatus ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {promoStats?.isClashingHiatus ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{promoStats?.isClashingHiatus ? 'Hiatus Breach' : 'Rules Compliant'}</span>
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-500">Min Hiatus Gap</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{inspectedSku.minPromoGapWeeks || 4} Weeks</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-500">Co-Op Scan Rebate</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{inspectedSku.supplierCoOpEligible ? 'Eligible' : 'Retailer Funded'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-500">Seasonal Peak</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{inspectedSku.seasonalPeak || 'General'}</span>
                </div>
                {promoStats && promoStats.plannedWeeks.length > 0 ? (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-200/70 dark:border-slate-800">
                      <span className="text-slate-500">Scheduled Weeks</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{promoStats.plannedWeeks.join(', ')}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Projected Promo Rev</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatAud(promoStats.totalProjectedRevenueAud)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 pt-1">No promotional weeks assigned yet.</p>
                )}
              </div>

              {/* Health Verdict Snapshot */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Range Health Verdict</span>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {health.finalScore}/100 · {health.statusLabel}
                  </span>
                </div>
                {(health.riskFactors.length > 0 || health.opportunityFactors.length > 0) && (
                  <p className="text-slate-600 dark:text-slate-300">
                    {health.riskFactors[0] || health.opportunityFactors[0]}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setInspectedSku(null);
                    setRangeSubTab('health');
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Open full Health Review →
                </button>
              </div>

              {/* Sheet Action Bar */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectedSku;
                    setInspectedSku(null);
                    setSkuToDelete(target);
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete SKU</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedSku(null)}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 7. MODALS: SINGLE SKU DELETE CONFIRMATION MODAL                           */}
      {/* ========================================================================= */}
      {skuToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete SKU Confirmation</h3>
              </div>
              <button onClick={() => setSkuToDelete(null)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove SKU <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">{skuToDelete.sku}</span> (<span className="text-slate-900 dark:text-white font-bold">{skuToDelete.name}</span>) from the catalog?
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <p className="text-slate-500 dark:text-slate-400">Category: <span className="text-slate-900 dark:text-white font-medium">{skuToDelete.category} - {skuToDelete.subcategory}</span></p>
              <p className="text-slate-500 dark:text-slate-400">RRP: <span className="text-slate-900 dark:text-white font-mono font-semibold">${skuToDelete.rrp.toFixed(2)} AUD</span></p>
              <p className="text-slate-500 dark:text-slate-400">Baseline Volume: <span className="text-slate-900 dark:text-white font-mono">{skuToDelete.weeklyUnitsBaseline} units/week</span></p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSkuToDelete(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk Delete {selectedSkus.length} SKUs</h3>
              </div>
              <button onClick={() => setIsBulkDeleteModalOpen(false)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete the <span className="text-slate-900 dark:text-white font-bold">{selectedSkus.length} selected SKU(s)</span> from this range?
            </p>

            <div className="max-h-40 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 font-mono text-[11px]">
              {selectedSkus.map(sku => {
                const prod = products.find(p => p.sku === sku);
                return (
                  <div key={sku} className="flex items-center justify-between text-slate-700 dark:text-slate-300 py-0.5 border-b border-slate-200 dark:border-slate-900">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{sku}</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-[180px] font-sans">{prod?.name || sku}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Clear All SKUs in Range</h3>
              </div>
              <button onClick={() => setIsClearAllModalOpen(false)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              This will remove all <span className="text-slate-900 dark:text-white font-bold">{products.length} SKUs</span> from the current range ("<span className="text-blue-600 dark:text-blue-400 font-bold">{currentCatalog?.name || 'Active Range'}</span>").
            </p>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
              You can restore the previous list using the Undo button that appears immediately after deletion.
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New SKU Range</h3>
              </div>
              <button onClick={() => setIsCreateCatalogModalOpen(false)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCatalogSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Range / Catalogue Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Hardware & Garden Range"
                  value={newCatalogName}
                  onChange={(e) => setNewCatalogName(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Retailer Channel / Banner</label>
                <input
                  type="text"
                  placeholder="e.g. National Supermarkets / Hardware"
                  value={newCatalogRetailerBanner}
                  onChange={(e) => setNewCatalogRetailerBanner(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Category Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Hardware & Garden / Beverages"
                  value={newCatalogCategoryFocus}
                  onChange={(e) => setNewCatalogCategoryFocus(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Range Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief note on trade terms or channel strategy..."
                  value={newCatalogDescription}
                  onChange={(e) => setNewCatalogDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCatalogCloneFromCurrent}
                    onChange={(e) => setNewCatalogCloneFromCurrent(e.target.checked)}
                    className="rounded text-blue-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">
                    Clone current range SKUs ({products.length} items) into new range
                  </span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1 pl-5">
                  If unchecked, the new range starts with an empty slate for fresh CSV upload or custom SKUs.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCatalogModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Range Details</h3>
              </div>
              <button onClick={() => setIsEditCatalogModalOpen(false)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCatalogSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Range Name *</label>
                <input
                  type="text"
                  required
                  value={newCatalogName}
                  onChange={(e) => setNewCatalogName(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Retailer Channel / Banner</label>
                <input
                  type="text"
                  value={newCatalogRetailerBanner}
                  onChange={(e) => setNewCatalogRetailerBanner(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Focus</label>
                <input
                  type="text"
                  value={newCatalogCategoryFocus}
                  onChange={(e) => setNewCatalogCategoryFocus(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCatalogDescription}
                  onChange={(e) => setNewCatalogDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCatalogModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md cursor-pointer"
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Entire Range</h3>
              </div>
              <button onClick={() => setCatalogToDelete(null)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete the range <span className="text-slate-900 dark:text-white font-bold">"{catalogToDelete.name}"</span>?
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCatalogToDelete(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCatalog}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Add Single SKU to Range</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SKU-BEV-009"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sparkling Mineral Water 1L"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Category</label>
                  <input
                    type="text"
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subcategory</label>
                  <input
                    type="text"
                    required
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">RRP ($ AUD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newRrp}
                      onChange={(e) => setNewRrp(e.target.value)}
                      className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-7 pr-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Cost ($ AUD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-7 pr-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Weekly Baseline Units</label>
                  <input
                    type="number"
                    value={newBaselineUnits}
                    onChange={(e) => setNewBaselineUnits(e.target.value)}
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Inventory On Hand (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Leave blank (unconstrained)"
                    value={newStockLevel}
                    onChange={(e) => setNewStockLevel(e.target.value)}
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Performance Tier</label>
                  <select
                    value={newPerformanceTier}
                    onChange={(e) => setNewPerformanceTier(e.target.value as PerformanceTier)}
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="tier1_hero">Tier 1: High Volume Hero</option>
                    <option value="tier2_margin">Tier 2: Margin Builder</option>
                    <option value="tier3_niche">Tier 3: Niche / Premium</option>
                    <option value="tier4_clearance">Tier 4: Clearance</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <label className="text-slate-800 dark:text-slate-200 font-semibold block">Supplier Scan Rebate Co-Op</label>
                  <p className="text-[11px] text-slate-500">Enable vendor scan funding on this SKU during promotional weeks.</p>
                </div>
                <input
                  type="checkbox"
                  checked={newCoOpEligible}
                  onChange={(e) => setNewCoOpEligible(e.target.checked)}
                  className="rounded text-blue-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 w-4 h-4 cursor-pointer shrink-0"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk Assign Category ({selectedSkus.length} SKUs)</h3>
              <button onClick={() => setBulkCategoryModalOpen(false)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleApplyBulkCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Category</label>
                <input
                  type="text"
                  required
                  value={newBulkCategory}
                  onChange={(e) => setNewBulkCategory(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setBulkCategoryModalOpen(false)} className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 text-white font-bold">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkTagsModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk Add Tags ({selectedSkus.length} SKUs)</h3>
              <button onClick={() => setBulkTagsModalOpen(false)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleApplyBulkTags} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Peak, Hero, Scan Deal"
                  value={newBulkTags}
                  onChange={(e) => setNewBulkTags(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setBulkTagsModalOpen(false)} className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" className="min-h-[40px] px-5 py-2 rounded-xl bg-amber-600 text-white font-bold">Apply Tags</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkDiscountModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk % Price Adjustment ({selectedSkus.length} SKUs)</h3>
              <button onClick={() => setBulkDiscountModalOpen(false)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleApplyBulkDiscount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Adjustment Percentage (e.g. -10 for 10% discount, +5 for increase)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    required
                    value={bulkPctChange}
                    onChange={(e) => setBulkPctChange(e.target.value)}
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setBulkDiscountModalOpen(false)} className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" className="min-h-[40px] px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold">Apply {bulkPctChange}%</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkTierModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk Set Performance Tier ({selectedSkus.length} SKUs)</h3>
              <button onClick={() => setBulkTierModalOpen(false)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleApplyBulkTier} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Performance Tier</label>
                <select
                  value={newBulkTier}
                  onChange={(e) => setNewBulkTier(e.target.value as PerformanceTier)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="tier1_hero">Tier 1: High Volume Hero</option>
                  <option value="tier2_margin">Tier 2: Margin Builder</option>
                  <option value="tier3_niche">Tier 3: Niche / Premium</option>
                  <option value="tier4_clearance">Tier 4: Clearance</option>
                </select>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setBulkTierModalOpen(false)} className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 text-white font-bold">Apply Tier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
