import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { WeekPromotion, Product, MechanicType, CataloguePlacement, PromoMechanic, StrategicObjective, CaseDealType } from '../types';
import { calculateWeekMultiSkuFinancials, calculateCaseDealUnitSavings } from '../utils/promoPlannerEngine';
import { formatAud, formatNumber, formatPercent } from '../utils/formatters';
import { safeFetch } from '../utils/api';
import {
  buildSkuPromoDemandMap,
  computeSkuInventoryForecast,
  normalizeOptionalStock,
} from '../utils/inventoryForecast';
import {
  X,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Tag,
  Megaphone,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Save,
  Building,
  Target,
  FileText,
  Sliders,
  Check,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Boxes,
  Edit3
} from 'lucide-react';

interface WeekDetailDrawerProps {
  weekPromotion: WeekPromotion;
  products: Product[];
  allPromotions: WeekPromotion[];
  onSavePromotion: (updatedPromo: WeekPromotion) => void;
  onUpdateProduct?: (product: Product) => void;
  onNavigateWeek: (weekNum: number) => void;
  onClose?: () => void;
  onMovePromotion?: (sourceWeekNum: number, targetWeekNum: number) => void;
}

export const WeekDetailDrawer: React.FC<WeekDetailDrawerProps> = ({
  weekPromotion,
  products,
  allPromotions,
  onSavePromotion,
  onUpdateProduct,
  onNavigateWeek,
  onClose,
  onMovePromotion
}) => {
  // 1. Primary Editable State Fields
  const [heroSku, setHeroSku] = useState(weekPromotion.heroSku);
  const [isPromoSkipped, setIsPromoSkipped] = useState<boolean>(Boolean(weekPromotion.isPromoSkipped));
  const [campaignTheme, setCampaignTheme] = useState(weekPromotion.campaignTheme);
  const [mechanicType, setMechanicType] = useState<MechanicType>(weekPromotion.mechanic?.type || 'percentage_off');
  const [discountValue, setDiscountValue] = useState<number>(weekPromotion.mechanic?.discountValue || 20);
  const [promoRrp, setPromoRrp] = useState<number>(weekPromotion.mechanic?.promoRrp || 0);
  const [mechanicLabel, setMechanicLabel] = useState(weekPromotion.mechanic?.label || '');
  const [supplierFundingPerUnit, setSupplierFundingPerUnit] = useState<number>(weekPromotion.mechanic?.supplierFundingPerUnit || 0);
  const [caseDealType, setCaseDealType] = useState<CaseDealType>(weekPromotion.mechanic?.caseDealType || 'none');
  const [caseDealValue, setCaseDealValue] = useState<number>(weekPromotion.mechanic?.caseDealValue || 0);
  const [skuCaseDeals, setSkuCaseDeals] = useState<Record<string, { type: CaseDealType; value: number }>>(
    weekPromotion.skuCaseDeals || {}
  );
  const [secondarySkus, setSecondarySkus] = useState<string[]>(weekPromotion.secondarySkus || []);
  const [cataloguePlacement, setCataloguePlacement] = useState<CataloguePlacement>(weekPromotion.cataloguePlacement || 'double_spread');
  const [activeChannels, setActiveChannels] = useState<string[]>(
    weekPromotion.activeChannels || ['Print Catalogue', 'In-Store POS', 'Digital App Feature']
  );
  const [targetChannel, setTargetChannel] = useState<string>('All National Retailers');
  const [strategicObjective, setStrategicObjective] = useState<StrategicObjective>(
    weekPromotion.strategicObjective || 'volume_grab'
  );
  const [buyerPitchNotes, setBuyerPitchNotes] = useState<string>(weekPromotion.notes || '');

  // 2. AI Advisor & UI State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [skuSearchQuery, setSkuSearchQuery] = useState('');
  const [isFlowPanelOpen, setIsFlowPanelOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'plan' | 'skus' | 'financials' | 'channels'>('plan');
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isEditingHeroStock, setIsEditingHeroStock] = useState(false);
  const [heroStockDraft, setHeroStockDraft] = useState<string>('');
  const [targetTransferWeek, setTargetTransferWeek] = useState<number>(
    weekPromotion.weekNumber === 52 ? 1 : weekPromotion.weekNumber + 1
  );

  // Find hero product object
  const heroProduct = products.find(p => p.sku === heroSku) || products[0];

  // Sync state whenever active week promotion changes
  useEffect(() => {
    setHeroSku(weekPromotion.heroSku);
    setIsPromoSkipped(Boolean(weekPromotion.isPromoSkipped));
    setCampaignTheme(weekPromotion.campaignTheme);
    setMechanicType(weekPromotion.mechanic?.type || 'percentage_off');
    setDiscountValue(weekPromotion.mechanic?.discountValue || 20);
    const heroProd = products.find(p => p.sku === weekPromotion.heroSku);
    const calculatedPromo = weekPromotion.mechanic?.promoRrp || (heroProd?.rrp != null ? Number((heroProd.rrp * 0.8).toFixed(2)) : 0);
    setPromoRrp(calculatedPromo);
    setMechanicLabel(weekPromotion.mechanic?.label || '');
    setSupplierFundingPerUnit(weekPromotion.mechanic?.supplierFundingPerUnit || 0);
    setCaseDealType(weekPromotion.mechanic?.caseDealType || heroProd?.defaultCaseDealType || 'none');
    setCaseDealValue(weekPromotion.mechanic?.caseDealValue ?? heroProd?.defaultCaseDealValue ?? 0);
    setSkuCaseDeals(weekPromotion.skuCaseDeals || {});
    setSecondarySkus(weekPromotion.secondarySkus || []);
    setCataloguePlacement(weekPromotion.cataloguePlacement || 'double_spread');
    setActiveChannels(weekPromotion.activeChannels || ['Print Catalogue', 'In-Store POS', 'Digital App Feature']);
    setStrategicObjective(weekPromotion.strategicObjective || 'volume_grab');
    setBuyerPitchNotes(weekPromotion.notes || '');
    setTargetTransferWeek(weekPromotion.weekNumber === 52 ? 1 : weekPromotion.weekNumber + 1);
    setAiAdvice(null);
    setAiError(null);
    setShowSaveSuccess(false);
  }, [weekPromotion.weekNumber, weekPromotion.heroSku, weekPromotion.isPromoSkipped, products]);

  useEffect(() => {
    setHeroStockDraft(
      heroProduct?.stockLevel !== undefined && heroProduct?.stockLevel !== null
        ? String(heroProduct.stockLevel)
        : ''
    );
    setIsEditingHeroStock(false);
  }, [heroProduct?.sku, heroProduct?.stockLevel]);

  const handleTransferPromo = () => {
    if (onMovePromotion && targetTransferWeek !== weekPromotion.weekNumber) {
      onMovePromotion(weekPromotion.weekNumber, targetTransferWeek);
      onNavigateWeek(targetTransferWeek);
    }
  };

  // Handle Hero SKU Change (ensure hero SKU is not duplicated in secondarySkus)
  const handleHeroSkuChange = (sku: string) => {
    setHeroSku(sku);
    setSecondarySkus(prev => prev.filter(s => s !== sku));
    const prod = products.find(p => p.sku === sku);
    if (prod) {
      const disc = discountValue || 20;
      const calculatedPromoPrice = Number((prod.rrp * (1 - disc / 100)).toFixed(2));
      setPromoRrp(calculatedPromoPrice);
      if (!mechanicLabel || mechanicLabel.includes('% Off') || mechanicLabel.includes('Special')) {
        setMechanicLabel(`${disc}% Off RRP`);
      }
      if (prod.supplierCoOpEligible && supplierFundingPerUnit === 0) {
        setSupplierFundingPerUnit(Number((prod.cost * 0.1).toFixed(2)));
      }
      if (prod.defaultCaseDealType && prod.defaultCaseDealType !== 'none') {
        setCaseDealType(prod.defaultCaseDealType);
        setCaseDealValue(prod.defaultCaseDealValue || 0);
      }
    }
  };

  // Handle Mechanic Type Change
  const handleMechanicTypeChange = (type: MechanicType) => {
    setMechanicType(type);
    if (!heroProduct) return;

    if (type === 'percentage_off') {
      const disc = discountValue || 25;
      const price = Number((heroProduct.rrp * (1 - disc / 100)).toFixed(2));
      setPromoRrp(price);
      setMechanicLabel(`${disc}% Off RRP`);
    } else if (type === 'price_drop') {
      const price = Number((heroProduct.rrp * 0.75).toFixed(2));
      setPromoRrp(price);
      setMechanicLabel(`Special $${price.toFixed(2)}`);
    } else if (type === 'multi_buy') {
      const bundlePrice = Number((heroProduct.rrp * 1.6).toFixed(2));
      setPromoRrp(bundlePrice);
      setMechanicLabel(`Buy 2 for $${bundlePrice.toFixed(2)}`);
    } else if (type === 'clearance_markdown') {
      const price = Number((heroProduct.rrp * 0.5).toFixed(2));
      setPromoRrp(price);
      setDiscountValue(50);
      setMechanicLabel(`Clearance 50% Off $${price.toFixed(2)}`);
    } else if (type === 'bogo') {
      setPromoRrp(heroProduct.rrp);
      setDiscountValue(50);
      setMechanicLabel(`Buy 1 Get 1 Free`);
    } else if (type === 'bundle_gwp') {
      setPromoRrp(heroProduct.rrp);
      setMechanicLabel(`Bonus Gift with Purchase`);
    }
  };

  // Clean normalized list of supporting SKUs (min 1 SKU enforced via heroProduct; up to max catalog SKUs)
  const activeSecondarySkus = Array.from(new Set(secondarySkus.filter(s => s && s !== heroSku && products.some(p => p.sku === s))));
  const allNonHeroProducts = products.filter(p => p.sku !== heroSku);
  const areAllSkusSelected = allNonHeroProducts.length > 0 && activeSecondarySkus.length >= allNonHeroProducts.length;
  const totalPromotedSkusCount = (heroProduct ? 1 : 0) + activeSecondarySkus.length;

  // Toggle Secondary SKU (no upper cap — 1 to catalog max)
  const toggleSecondarySku = (sku: string) => {
    if (sku === heroSku) return;
    if (activeSecondarySkus.includes(sku)) {
      setSecondarySkus(activeSecondarySkus.filter(s => s !== sku));
    } else {
      setSecondarySkus([...activeSecondarySkus, sku]);
    }
  };

  // Bulk Select All SKUs or Reset to Hero Only (Min 1 SKU)
  const handleSelectAllSkus = () => {
    setSecondarySkus(allNonHeroProducts.map(p => p.sku));
  };

  const handleClearExtraSkus = () => {
    setSecondarySkus([]);
  };

  // Toggle Marketing Channel
  const toggleChannel = (channelName: string) => {
    if (activeChannels.includes(channelName)) {
      setActiveChannels(activeChannels.filter(c => c !== channelName));
    } else {
      setActiveChannels([...activeChannels, channelName]);
    }
  };

  // Construct current dynamic mechanic
  const currentMechanic: PromoMechanic = {
    type: mechanicType,
    discountValue,
    promoRrp: promoRrp || (heroProduct ? Number((heroProduct.rrp * 0.8).toFixed(2)) : 0),
    label: mechanicLabel || `${discountValue}% Off RRP`,
    supplierFundingPerUnit,
    caseDealType,
    caseDealValue: caseDealType === 'none' ? 0 : caseDealValue,
  };

  const secondaryProductsList = activeSecondarySkus
    .map(sku => products.find(p => p.sku === sku))
    .filter((p): p is Product => Boolean(p));

  const effectiveSkuCaseDeals: Record<string, { type: CaseDealType; value: number }> = {
    ...skuCaseDeals,
    ...(heroProduct && caseDealType !== 'none' && caseDealValue > 0
      ? { [heroProduct.sku]: { type: caseDealType, value: caseDealValue } }
      : {}),
  };

  // 100% Mathematically Calculated Combined Financials for all active SKUs in the week
  const liveFin = !isPromoSkipped && heroProduct
    ? calculateWeekMultiSkuFinancials(
        heroProduct,
        secondaryProductsList,
        currentMechanic,
        weekPromotion.isMajorRetailMoment,
        effectiveSkuCaseDeals
      )
    : {
        promoRrp: 0,
        liftMultiplier: 1,
        projectedUnits: 0,
        projectedRevenueAud: 0,
        projectedMarginAud: 0,
        projectedMarginPercent: 0,
        tradeSpendAud: 0,
        caseDealSavingsTotalAud: 0,
        totalSkusCount: 0,
        skuBreakdown: []
      };

  const totalWeekBaselineUnits = (heroProduct?.weeklyUnitsBaseline || 0) +
    secondaryProductsList.reduce((acc, p) => acc + (p.weeklyUnitsBaseline || 0), 0);

  // Calculate Mathematical Breakeven Volume Lift
  const baselineMarginPct = heroProduct ? heroProduct.marginPercent : 50;
  const effectiveDiscountPct = heroProduct && heroProduct.rrp > 0 
    ? Number((((heroProduct.rrp - liveFin.promoRrp) / heroProduct.rrp) * 100).toFixed(1))
    : 20;
  
  const breakevenLiftPct = (baselineMarginPct > effectiveDiscountPct && effectiveDiscountPct > 0)
    ? Number(((effectiveDiscountPct / (baselineMarginPct - effectiveDiscountPct)) * 100).toFixed(1))
    : 0;

  // Custom Rules 4-Week Hiatus Compliance Checker across ALL active SKUs in this week
  const currentWeekNum = weekPromotion.weekNumber;
  const currentWeekSkuSet = new Set([heroSku, ...activeSecondarySkus].filter(Boolean));
  const adjacentClashingWeeks = isPromoSkipped
    ? []
    : allPromotions.filter(p => {
        if (p.isPromoSkipped || p.weekNumber === currentWeekNum || Math.abs(p.weekNumber - currentWeekNum) > 4) return false;
        const otherSkus = [p.heroSku, ...(p.secondarySkus || [])].filter(Boolean);
        return otherSkus.some(s => currentWeekSkuSet.has(s));
      });
  const isAcccCompliant = adjacentClashingWeeks.length === 0;

  // Inventory Forecasting across Active Week SKUs (ignores SKUs with blank stockLevel)
  const skuPromoDemandMap = buildSkuPromoDemandMap(products, allPromotions);
  const skuForecastBySku = new Map(
    liveFin.skuBreakdown.map((row) => {
      const prod = products.find((p) => p.sku === row.sku);
      return [
        row.sku,
        prod
          ? computeSkuInventoryForecast(prod, skuPromoDemandMap.get(prod.sku), row.projectedUnits)
          : null,
      ] as const;
    })
  );
  const heroInvForecast = heroProduct
    ? skuForecastBySku.get(heroProduct.sku) ||
      computeSkuInventoryForecast(heroProduct, skuPromoDemandMap.get(heroProduct.sku), liveFin.projectedUnits)
    : null;
  const activeWeekSkuStockAlerts = liveFin.skuBreakdown
    .map((row) => ({
      row,
      forecast: skuForecastBySku.get(row.sku) || null,
    }))
    .filter(
      (item): item is { row: (typeof liveFin.skuBreakdown)[number]; forecast: NonNullable<(typeof item)['forecast']> } =>
        Boolean(item.forecast && item.forecast.hasInventory && (item.forecast.hasStockoutWarning || item.forecast.periodShortfallUnits > 0))
    );

  const handleSaveHeroStock = (rawValue: string) => {
    if (!heroProduct || !onUpdateProduct) return;
    const normalized = normalizeOptionalStock(rawValue);
    const updated: Product = { ...heroProduct };
    if (normalized !== undefined) {
      updated.stockLevel = normalized;
    } else {
      delete updated.stockLevel;
    }
    onUpdateProduct(updated);
    setIsEditingHeroStock(false);
  };

  // Adjacent week context for chronological flow & clash avoidance panel
  const prevWeekPromo = allPromotions.find(p => p.weekNumber === currentWeekNum - 1);
  const nextWeekPromo = allPromotions.find(p => p.weekNumber === currentWeekNum + 1);
  const prevProduct = prevWeekPromo ? products.find(p => p.sku === prevWeekPromo.heroSku) : null;
  const nextProduct = nextWeekPromo ? products.find(p => p.sku === nextWeekPromo.heroSku) : null;

  // Request AI Recommendation
  const requestAiAdvice = async () => {
    if (!heroProduct) return;
    setIsAiLoading(true);
    setAiError(null);

    try {
      const result = await safeFetch<any>('/api/sku-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: heroProduct,
          targetWeek: weekPromotion.weekNumber,
          australianEvent: weekPromotion.australianEvent,
          objective: strategicObjective,
        })
      });

      setAiAdvice(result);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'AI Strategy advisor temporarily unavailable.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI Advice to form
  const applyAiAdvice = () => {
    if (!aiAdvice) return;
    if (aiAdvice.promotionalRrp) setPromoRrp(aiAdvice.promotionalRrp);
    if (aiAdvice.discountPercent) setDiscountValue(aiAdvice.discountPercent);
    if (aiAdvice.marketingCopyHeadline) setCampaignTheme(aiAdvice.marketingCopyHeadline);
    if (aiAdvice.supplierFundingPerUnitAud) setSupplierFundingPerUnit(aiAdvice.supplierFundingPerUnitAud);
    if (aiAdvice.marketingCallout) setMechanicLabel(aiAdvice.marketingCallout);
  };

  // Save changes to 52-week plan
  const handleSave = () => {
    const updated: WeekPromotion = {
      ...weekPromotion,
      isPromoSkipped,
      heroSku: isPromoSkipped ? '' : heroSku,
      campaignTheme: isPromoSkipped ? 'Regular Price / Baseline Recovery Week' : campaignTheme,
      strategicObjective,
      secondarySkus: isPromoSkipped ? [] : activeSecondarySkus,
      mechanic: isPromoSkipped
        ? {
            type: 'percentage_off',
            discountValue: 0,
            promoRrp: 0,
            label: 'No Active Promo (Gap Week)',
            supplierFundingPerUnit: 0,
            caseDealType: 'none',
            caseDealValue: 0,
          }
        : currentMechanic,
      skuCaseDeals: Object.keys(effectiveSkuCaseDeals).length > 0 ? effectiveSkuCaseDeals : undefined,
      cataloguePlacement,
      activeChannels: isPromoSkipped ? [] : activeChannels,
      projectedUnits: liveFin.projectedUnits,
      projectedRevenueAud: liveFin.projectedRevenueAud,
      projectedMarginPercent: liveFin.projectedMarginPercent,
      projectedMarginAud: liveFin.projectedMarginAud,
      tradeSpendAud: liveFin.tradeSpendAud,
      notes: buyerPitchNotes
    };

    onSavePromotion(updated);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Reset to default
  const handleReset = () => {
    if (!heroProduct) return;
    setIsPromoSkipped(false);
    setCampaignTheme(weekPromotion.australianEvent ? `${weekPromotion.australianEvent} Feature` : 'Weekly Promotional Feature');
    setMechanicType('percentage_off');
    setDiscountValue(20);
    setPromoRrp(Number((heroProduct.rrp * 0.8).toFixed(2)));
    setMechanicLabel(`20% Off RRP`);
    setSupplierFundingPerUnit(heroProduct.supplierCoOpEligible ? Number((heroProduct.cost * 0.1).toFixed(2)) : 0);
    setCaseDealType('none');
    setCaseDealValue(0);
    setSkuCaseDeals({});
    setCataloguePlacement('double_spread');
  };

  const channelOptions = [
    'National Print Catalogue',
    'In-Store Point of Sale (POS) Shelf Talkers',
    'Retailer App Digital Special & Push Notification',
    'Homepage Banner & E-Commerce Spotlight',
    'Direct Customer EDM Newsletter',
    'Social Media Sponsored Video Ads',
    'Gondola End-Cap Display Header'
  ];

  const quickThemes = [
    'Australia Day & Summer BBQ Extravaganza',
    'Back to School & University Mega Value',
    'Autumn Home & Outdoor Refresh',
    'Easter Long Weekend Essentials',
    'Mother\'s Day Pamper & Gifting Guide',
    'Winter Warmers & Hearth Comforts',
    'EOFY Tax Time & Stocktake Frenzy',
    'Father\'s Day Tech & Tool Showcase',
    'Footy Finals Super Weekend Blitz',
    'Spring Entertaining & Garden Refresh',
    'Black Friday Cyber Week Mega Deals',
    'Christmas Festive Feast & Gifting Peak',
    'Boxing Day Ultimate Stock Markdown'
  ];

  return (
    <motion.div
      key={weekPromotion.weekNumber}
      initial={{ opacity: 0, x: 20, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-3 sm:space-y-5 pb-36 md:pb-24 lg:pb-8"
    >
      {/* MOBILE COMPACT HEADER, 1-LINE LIVE METRIC STRIP & 4 SECTION TABS (< lg) */}
      <div className="lg:hidden bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-2.5">
        {/* Compact Week Nav Bar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigateWeek(Math.max(1, weekPromotion.weekNumber - 1))}
            disabled={weekPromotion.weekNumber <= 1}
            aria-label="Previous week"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <select
            value={weekPromotion.weekNumber}
            onChange={(e) => onNavigateWeek(parseInt(e.target.value, 10))}
            aria-label="Select week"
            className="flex-1 min-w-0 min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 text-xs font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer truncate"
          >
            {allPromotions.map(p => (
              <option key={p.weekNumber} value={p.weekNumber}>
                W{p.weekNumber}/52 · {p.startDate}–{p.endDate} {p.australianEvent ? `(${p.australianEvent})` : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onNavigateWeek(Math.min(52, weekPromotion.weekNumber + 1))}
            disabled={weekPromotion.weekNumber >= 52}
            aria-label="Next week"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(true)}
            aria-label="More week actions"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer shrink-0"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Concise Campaign Title & Date Context */}
        <div className="min-w-0 px-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span className="font-mono tabular-nums font-semibold">{weekPromotion.quarter}</span>
            <span>·</span>
            <span>{weekPromotion.month}</span>
            {weekPromotion.australianEvent && (
              <>
                <span>·</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 truncate">
                  {weekPromotion.australianEvent}
                </span>
              </>
            )}
          </div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
            {campaignTheme}
          </h2>
        </div>

        {/* 1-Line Live Revenue, GM%, Active SKUs & Custom Rules Strip */}
        <button
          type="button"
          onClick={() => setMobileTab('financials')}
          className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between gap-2 text-[11px] cursor-pointer text-left"
        >
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar whitespace-nowrap font-mono tabular-nums">
            <span className="font-black text-slate-900 dark:text-white">
              {formatAud(liveFin.projectedRevenueAud)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {liveFin.projectedMarginPercent}% GM
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {totalPromotedSkusCount} {totalPromotedSkusCount === 1 ? 'SKU' : 'SKUs'}
            </span>
          </div>

          <span className={`inline-flex items-center gap-1 font-bold shrink-0 whitespace-nowrap ${
            isAcccCompliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isAcccCompliant ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Rules Clean</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{adjacentClashingWeeks.length} Clash</span>
              </>
            )}
          </span>
        </button>

        {/* 4 Segmented Section Sub-Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          {[
            { id: 'plan', label: 'Plan' },
            { id: 'skus', label: `SKUs (${totalPromotedSkusCount})` },
            { id: 'financials', label: 'Financials' },
            { id: 'channels', label: 'Channels' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id as any)}
              className={`min-h-[40px] px-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap truncate ${
                mobileTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP 1. TOP BANNER NAVIGATION & WEEK SELECTOR (lg+) */}
      <div className="hidden lg:flex bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        
        {/* Week Info & Fast Jumper Dropdown */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 flex flex-col items-center justify-center text-amber-600 dark:text-amber-400 font-black shrink-0 tabular-nums">
            <span className="text-[10px] uppercase font-bold text-amber-500 dark:text-amber-300">WK</span>
            <span className="text-base sm:text-lg leading-none">{weekPromotion.weekNumber}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Week Select Dropdown */}
              <select
                value={weekPromotion.weekNumber}
                onChange={(e) => onNavigateWeek(parseInt(e.target.value, 10))}
                className="w-full sm:w-auto max-w-full min-h-[38px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer truncate"
              >
                {allPromotions.map(p => (
                  <option key={p.weekNumber} value={p.weekNumber}>
                    Week {p.weekNumber} — {p.month} ({p.startDate} - {p.endDate}) {p.australianEvent ? `[${p.australianEvent}]` : ''}
                  </option>
                ))}
              </select>

              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                {weekPromotion.month} · {weekPromotion.quarter} ({weekPromotion.startDate} - {weekPromotion.endDate})
              </span>

              {weekPromotion.isMajorRetailMoment && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
                  Key AU Retail Moment
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 mt-1.5">
              {weekPromotion.australianEvent ? (
                <>
                  <span className="text-amber-600 dark:text-amber-300">{weekPromotion.australianEvent}</span>
                  <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
                </>
              ) : null}
              <span className="text-slate-800 dark:text-slate-100 break-words">{campaignTheme}</span>
            </h2>
          </div>
        </div>

        {/* Navigation & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Target Week Transfer Action */}
          {onMovePromotion && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold pl-2 flex items-center gap-1 whitespace-nowrap">
                <ArrowRightLeft className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                Move:
              </span>
              <select
                value={targetTransferWeek}
                onChange={(e) => setTargetTransferWeek(parseInt(e.target.value, 10))}
                className="min-h-[34px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>
                    W{w} {w === weekPromotion.weekNumber ? '(Here)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleTransferPromo}
                disabled={targetTransferWeek === weekPromotion.weekNumber}
                className="min-h-[34px] px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-40 cursor-pointer transition-all"
                title={`Move promotion from Week ${weekPromotion.weekNumber} to Week ${targetTransferWeek}`}
              >
                Move
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigateWeek(Math.max(1, weekPromotion.weekNumber - 1))}
              disabled={weekPromotion.weekNumber <= 1}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
              title="Previous Week"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 tabular-nums whitespace-nowrap">
              {weekPromotion.weekNumber} / 52
            </span>

            <button
              onClick={() => onNavigateWeek(Math.min(52, weekPromotion.weekNumber + 1))}
              disabled={weekPromotion.weekNumber >= 52}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
              title="Next Week"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Reset to Event Baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            className={`w-full sm:w-auto min-h-[42px] flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap ${
              showSaveSuccess
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {showSaveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{showSaveSuccess ? 'Saved to 52-Week Plan!' : 'Save Week Strategy'}</span>
          </button>
        </div>
      </div>

      {/* 2. COMPLIANCE & CLASH AUDIT BANNER (Visible on mobile Financials tab + always on lg+) */}
      {!isAcccCompliant && (
        <div className={`${mobileTab === 'financials' ? 'flex' : 'hidden'} lg:flex bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 text-rose-800 dark:text-rose-300 text-xs items-start gap-3 animate-fadeIn`}>
          <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-700 dark:text-rose-400 text-sm">
              Custom Rules 4-Week Hiatus Warning across Active Week SKUs ({totalPromotedSkusCount} SKUs)
            </div>
            <p className="mt-0.5 text-rose-700/90 dark:text-slate-300">
              One or more selected SKUs are also promoted in:{' '}
              <strong>{adjacentClashingWeeks.map(w => `Week ${w.weekNumber} (${w.campaignTheme})`).join(', ')}</strong>.
              Custom promotional rules recommend at least 4 non-promoted baseline weeks between price reductions.
            </p>
          </div>
        </div>
      )}

      {isAcccCompliant && (
        <div className={`${mobileTab === 'financials' ? 'flex' : 'hidden'} lg:flex bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2.5 text-emerald-800 dark:text-emerald-300 text-xs flex-wrap items-center justify-between gap-2`}>
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span><strong>Custom Rules Hiatus Guard:</strong> Clean slot — no clash within 4 weeks of Week {weekPromotion.weekNumber}.</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
            Verified Clean Slot
          </span>
        </div>
      )}

      {/* 2.1 PROMOTIONAL STOCKOUT RISK BANNER (Only shown for SKUs with entered inventory) */}
      {activeWeekSkuStockAlerts.length > 0 && (
        <div className={`${mobileTab === 'financials' ? 'flex' : 'hidden'} lg:flex bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4 text-amber-900 dark:text-amber-200 text-xs items-start gap-3 animate-fadeIn`}>
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              Inventory Stockout Warning ({activeWeekSkuStockAlerts.length} tracked {activeWeekSkuStockAlerts.length === 1 ? 'SKU' : 'SKUs'})
            </div>
            <p className="text-amber-800/90 dark:text-slate-300">
              {activeWeekSkuStockAlerts.slice(0, 3).map(({ row, forecast }) => (
                forecast.periodShortfallUnits > 0
                  ? `${row.name} (${row.sku}) needs ${formatNumber(row.projectedUnits)} units vs. ${formatNumber(forecast.currentStock || 0)} on hand (short ${formatNumber(forecast.periodShortfallUnits)} u).`
                  : `${row.name} (${row.sku}) sits at ${forecast.weeksOfCover} weeks cover.`
              )).join(' ')}
            </p>
          </div>
        </div>
      )}

      {/* 2.5 ADJACENT WEEKS COMPARISON SUMMARY (Inside Financials on mobile, always visible on lg+) */}
      <div id="three-week-flow-panel" className={`${mobileTab === 'financials' ? 'block' : 'hidden'} lg:block bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
            <span>3-Week Chronological Flow</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              W-{currentWeekNum - 1} ➔ W-{currentWeekNum} ➔ W-{currentWeekNum + 1}
            </span>
            <button
              type="button"
              onClick={() => setIsFlowPanelOpen(prev => !prev)}
              className="md:hidden min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{isFlowPanelOpen ? 'Hide Flow' : 'Compare Weeks'}</span>
              {isFlowPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className={`${isFlowPanelOpen ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4`}>
          {/* Previous Week Card */}
          {prevWeekPromo ? (
            <div id="prev-week-clash-card" className={`p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950/40 relative overflow-hidden transition-all ${
              prevWeekPromo.heroSku === heroSku 
                ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/60 dark:bg-rose-500/5' 
                : prevProduct?.category === heroProduct?.category && prevWeekPromo.heroSku !== heroSku
                ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/5'
                : 'border-slate-200 dark:border-slate-800/80'
            }`}>
              {/* Clash badges */}
              {prevWeekPromo.heroSku === heroSku ? (
                <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl">
                  DIRECT SKU CLASH
                </div>
              ) : prevProduct?.category === heroProduct?.category ? (
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-bl">
                  CATEGORY CLUTTER
                </div>
              ) : null}

              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Week {prevWeekPromo.weekNumber}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {prevWeekPromo.month}
                </span>
              </div>

              <div className="font-bold text-slate-900 dark:text-slate-200 text-xs truncate" title={prevProduct?.name || 'No Product'}>
                {prevProduct ? prevProduct.name : 'No Active SKU'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {prevWeekPromo.heroSku || 'N/A'}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Mechanic:</span>
                <span className={`font-bold ${prevWeekPromo.heroSku === heroSku ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {prevWeekPromo.mechanic?.label || 'No Promo'}
                </span>
              </div>
              
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Category:</span>
                <span className={prevProduct?.category === heroProduct?.category ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}>
                  {prevProduct?.category || 'N/A'}
                </span>
              </div>

              <button 
                id="jump-prev-week-btn"
                type="button"
                onClick={() => onNavigateWeek(prevWeekPromo.weekNumber)}
                className="mt-2.5 w-full min-h-[34px] py-1 text-center text-[10px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Jump to Week {prevWeekPromo.weekNumber}
              </button>
            </div>
          ) : (
            <div id="prev-week-empty-card" className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-center items-center text-slate-400 dark:text-slate-600 text-xs text-center min-h-[140px]">
              <span>No Previous Week</span>
              <span className="text-[10px] mt-1">First week of the plan</span>
            </div>
          )}

          {/* Current Week Card (Active Editing context) */}
          <div id="current-week-clash-card" className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-bl">
              CURRENT FOCUS
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                Week {currentWeekNum}
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400/80 font-medium">
                {weekPromotion.month}
              </span>
            </div>

            <div className="font-bold text-slate-900 dark:text-white text-xs truncate" title={heroProduct?.name || 'No Product'}>
              {heroProduct ? heroProduct.name : 'No Active SKU'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              {heroSku || 'N/A'}
            </div>

            <div className="mt-2 pt-2 border-t border-amber-200/70 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Mechanic:</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {currentMechanic.label || 'No Promo'}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>Category:</span>
              <span className="text-slate-800 dark:text-slate-200">
                {heroProduct?.category || 'N/A'}
              </span>
            </div>

            <div className="mt-2.5 min-h-[34px] flex items-center justify-center py-1 text-center text-[10px] font-bold rounded-lg bg-amber-100/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 select-none">
              Editing Strategy
            </div>
          </div>

          {/* Next Week Card */}
          {nextWeekPromo ? (
            <div id="next-week-clash-card" className={`p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950/40 relative overflow-hidden transition-all ${
              nextWeekPromo.heroSku === heroSku 
                ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/60 dark:bg-rose-500/5' 
                : nextProduct?.category === heroProduct?.category && nextWeekPromo.heroSku !== heroSku
                ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/5'
                : 'border-slate-200 dark:border-slate-800/80'
            }`}>
              {/* Clash badges */}
              {nextWeekPromo.heroSku === heroSku ? (
                <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl">
                  DIRECT SKU CLASH
                </div>
              ) : nextProduct?.category === heroProduct?.category ? (
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-bl">
                  CATEGORY CLUTTER
                </div>
              ) : null}

              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Week {nextWeekPromo.weekNumber}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {nextWeekPromo.month}
                </span>
              </div>

              <div className="font-bold text-slate-900 dark:text-slate-200 text-xs truncate" title={nextProduct?.name || 'No Product'}>
                {nextProduct ? nextProduct.name : 'No Active SKU'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {nextWeekPromo.heroSku || 'N/A'}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Mechanic:</span>
                <span className={`font-bold ${nextWeekPromo.heroSku === heroSku ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {nextWeekPromo.mechanic?.label || 'No Promo'}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Category:</span>
                <span className={nextProduct?.category === heroProduct?.category ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}>
                  {nextProduct?.category || 'N/A'}
                </span>
              </div>

              <button 
                id="jump-next-week-btn"
                type="button"
                onClick={() => onNavigateWeek(nextWeekPromo.weekNumber)}
                className="mt-2.5 w-full min-h-[34px] py-1 text-center text-[10px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Jump to Week {nextWeekPromo.weekNumber}
              </button>
            </div>
          ) : (
            <div id="next-week-empty-card" className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-center items-center text-slate-400 dark:text-slate-600 text-xs text-center min-h-[140px]">
              <span>No Next Week</span>
              <span className="text-[10px] mt-1">Last week of the plan</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN 2-COLUMN STUDIO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* LEFT COLUMN: 100% Calculated Financial Sandbox & AI Strategist (5 Cols) */}
        <div className={`${mobileTab === 'financials' ? 'block' : 'hidden'} lg:block lg:col-span-5 space-y-4 sm:space-y-6`}>
          
          {/* Live Commercial Simulator Card */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>Combined Week Financials ({totalPromotedSkusCount} {totalPromotedSkusCount === 1 ? 'SKU' : 'SKUs'})</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap tabular-nums">
                Lift {liveFin.liftMultiplier ? `+${((liveFin.liftMultiplier - 1) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>

            {/* Big Revenue & Profit Metrics */}
            <div className="grid grid-cols-2 gap-3 tabular-nums">
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 min-w-0">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Projected Revenue</div>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 truncate">
                  {formatAud(liveFin.projectedRevenueAud)}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  {formatNumber(liveFin.projectedUnits)} units across {totalPromotedSkusCount} {totalPromotedSkusCount === 1 ? 'SKU' : 'SKUs'}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 min-w-0">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Blended Gross Margin</div>
                <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  {liveFin.projectedMarginPercent}%
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 truncate">
                  {formatAud(liveFin.projectedMarginAud)} GP AUD
                </div>
              </div>
            </div>

            {/* Breakeven Volume Lift Box */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300 gap-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>Breakeven Volume Lift:</span>
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">+{breakevenLiftPct}%</span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-slate-300 leading-relaxed">
                At a <strong>{effectiveDiscountPct}% discount</strong>, you need at least <strong>+{breakevenLiftPct}% uplift</strong> ({Math.round((totalWeekBaselineUnits || 50) * (1 + breakevenLiftPct / 100))} combined units) to hold baseline gross profit dollars.
              </p>
            </div>

            {/* Waterfall Unit Economics Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-xs space-y-2 tabular-nums">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Week Economics &amp; Trade Spend</span>
                <span className="text-[10px] text-slate-500 lowercase font-normal">AUD</span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Hero Regular RRP / Promo:</span>
                <span className="text-slate-900 dark:text-white font-semibold">
                  ${heroProduct?.rrp != null ? heroProduct.rrp.toFixed(2) : '0.00'} ➔ <span className="text-amber-600 dark:text-amber-400 font-bold">${(liveFin?.promoRrp || 0).toFixed(2)}</span>
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Combined Baseline Sales ({totalPromotedSkusCount} SKUs):</span>
                <span className="text-slate-900 dark:text-white font-semibold">{formatNumber(totalWeekBaselineUnits)} units</span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Combined Promotional Lift:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  +{formatNumber(Math.max(0, (liveFin?.projectedUnits || 0) - totalWeekBaselineUnits))} units
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Supplier Scan Funding:</span>
                <span className="text-blue-600 dark:text-blue-300 font-semibold">
                  +${(supplierFundingPerUnit || 0).toFixed(2)}/u ({formatAud(liveFin?.tradeSpendAud || 0)})
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                <span>Total Gross Profit (GP AUD):</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatAud(liveFin.projectedMarginAud)}</span>
              </div>
            </div>

            {/* Per-SKU Breakdown when Multiple SKUs Active */}
            {liveFin.skuBreakdown.length > 1 && (
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-xs space-y-2 tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Multi-SKU Contribution ({liveFin.skuBreakdown.length} SKUs)
                  </span>
                  <span className="text-[10px] text-slate-500">Shared Mechanic</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800/80 pr-1">
                  {liveFin.skuBreakdown.map((row) => {
                    const rowInv = skuForecastBySku.get(row.sku);
                    return (
                      <div key={row.sku} className="py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {row.name}
                            {row.isHero && (
                              <span className="ml-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                (Hero)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex flex-wrap items-center gap-1.5">
                            <span>{row.sku} · ${row.promoRrp.toFixed(2)} · {formatNumber(row.projectedUnits)} u</span>
                            {rowInv && rowInv.hasInventory && (
                              <span
                                className={
                                  rowInv.periodShortfallUnits > 0 || rowInv.stockStatus === 'CRITICAL'
                                    ? 'font-bold text-rose-600 dark:text-rose-400'
                                    : rowInv.stockStatus === 'LOW'
                                    ? 'font-bold text-amber-600 dark:text-amber-400'
                                    : 'font-semibold text-emerald-600 dark:text-emerald-400'
                                }
                              >
                                · {rowInv.periodShortfallUnits > 0 ? `Short ${formatNumber(rowInv.periodShortfallUnits)} u` : `${rowInv.weeksOfCover}w cover`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-900 dark:text-white">{formatAud(row.projectedRevenueAud)}</div>
                          <div className={`text-[10px] font-bold ${row.projectedMarginPercent >= 35 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {row.projectedMarginPercent}% GM
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Advisor Button */}
            <div className="pt-1">
              <button
                onClick={requestAiAdvice}
                disabled={isAiLoading}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{isAiLoading ? 'Evaluating Category Dynamics...' : 'Ask AI Strategist for Week Advice'}</span>
              </button>
            </div>

            {/* AI Error */}
            {aiError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                {aiError}
              </div>
            )}

            {/* AI Advice Output */}
            {aiAdvice && (
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-amber-300 dark:border-amber-500/40 text-xs space-y-3 shadow-sm animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 text-amber-700 dark:text-amber-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Recommendation for {aiAdvice.sku}</span>
                  </span>
                  <button
                    onClick={applyAiAdvice}
                    className="min-h-[34px] text-[10px] px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition-all cursor-pointer"
                  >
                    Apply All to Form
                  </button>
                </div>

                <div className="text-slate-700 dark:text-slate-200">
                  <strong className="text-amber-700 dark:text-amber-300">Campaign Headline:</strong> &quot;{aiAdvice.marketingCopyHeadline}&quot;
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 tabular-nums">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Recommended Price:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm">${aiAdvice.promotionalRrp} AUD</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Supplier Co-Op:</span>
                    <strong className="text-blue-600 dark:text-blue-300 text-sm">${aiAdvice.supplierFundingPerUnitAud}/unit</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-800 dark:text-slate-400 block mb-0.5">In-Store Merchandising Tip:</strong>
                  {aiAdvice.merchandisingTip}
                </div>

                {aiAdvice.crossSellRecommendations && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-slate-400 block mb-0.5">Cross-Sell Basket Recommendations:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aiAdvice.crossSellRecommendations.map((item: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[10px]">
                          + {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Promotion Editor (7 Cols) */}
        <div className={`${mobileTab !== 'financials' ? 'block' : 'hidden'} lg:block lg:col-span-7 space-y-4 sm:space-y-6`}>
          
          {/* 1. HERO SKU SELECTION & COMMERCIAL PROFILE */}
          <div className={`${mobileTab === 'plan' ? 'block' : 'hidden'} lg:block bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4`}>
            {/* Week Active vs Baseline Recovery Gap Week Toggle */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Week {weekPromotion.weekNumber} Scheduling Mode
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isPromoSkipped
                    ? 'Marked as a Baseline Recovery Gap Week (full RRP margin protection).'
                    : 'Active promotional week with mechanic, case deal, and multi-SKU support.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPromoSkipped((prev) => !prev)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer whitespace-nowrap transition-colors ${
                  isPromoSkipped
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isPromoSkipped ? 'Resume Promotion in Week' : 'Pause as Gap Week'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Featured Hero SKU</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Primary Promotional Anchor</span>
            </div>

            {/* SKU Search / Filter & Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select SKU from Active Catalog ({products.length} available)
              </label>
              <select
                value={heroSku}
                onChange={(e) => handleHeroSkuChange(e.target.value)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer truncate"
              >
                {products.map((p, idx) => (
                  <option key={`week-hero-${p.sku}-${idx}`} value={p.sku}>
                    [{p.sku}] {p.name} — RRP ${p.rrp.toFixed(2)} AUD ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected SKU Commercial Snapshot */}
            {heroProduct && (
              <div className="bg-slate-50 dark:bg-slate-950/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{heroProduct.name}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{heroProduct.category} &gt; {heroProduct.subcategory}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 uppercase whitespace-nowrap">
                    {heroProduct.performanceTier.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-center tabular-nums">
                  <div className="bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Regular RRP</div>
                    <div className="font-bold text-slate-900 dark:text-white">${heroProduct.rrp.toFixed(2)}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Unit Cost</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">${heroProduct.cost.toFixed(2)}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Base Margin</div>
                    <div className="font-bold text-blue-600 dark:text-blue-300">{heroProduct.marginPercent}%</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Baseline Rate</div>
                    <div className="font-bold text-amber-600 dark:text-amber-300">{heroProduct.weeklyUnitsBaseline} u/wk</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Inventory &amp; Cover</div>
                    <div
                      className={`font-bold ${
                        !heroInvForecast || !heroInvForecast.hasInventory
                          ? 'text-slate-500 dark:text-slate-400'
                          : heroInvForecast.hasStockoutWarning
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {heroInvForecast && heroInvForecast.hasInventory
                        ? `${formatNumber(heroInvForecast.currentStock || 0)} u (${heroInvForecast.weeksOfCover}w)`
                        : 'Unconstrained'}
                    </div>
                  </div>
                </div>

                {onUpdateProduct && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        {heroInvForecast && heroInvForecast.hasInventory
                          ? `On-hand stock tracked (${formatNumber(heroInvForecast.currentStock || 0)} units)`
                          : 'Inventory blank (assumes unconstrained supply)'}
                      </span>
                    </span>

                    {isEditingHeroStock ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Blank"
                          value={heroStockDraft}
                          onChange={(e) => setHeroStockDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveHeroStock(heroStockDraft);
                            } else if (e.key === 'Escape') {
                              setIsEditingHeroStock(false);
                            }
                          }}
                          className="w-24 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-500 text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveHeroStock(heroStockDraft)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveHeroStock('')}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingHeroStock(false)}
                          className="px-1.5 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setHeroStockDraft(
                              heroInvForecast?.hasInventory ? String(heroInvForecast.currentStock) : ''
                            );
                            setIsEditingHeroStock(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{heroInvForecast?.hasInventory ? 'Edit Stock' : 'Set Stock'}</span>
                        </button>
                        {heroInvForecast?.hasInventory && (
                          <button
                            type="button"
                            onClick={() => handleSaveHeroStock('')}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold cursor-pointer hover:text-slate-800 dark:hover:text-white"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span>Seasonal Affinity: <strong className="text-slate-800 dark:text-slate-200">{heroProduct.seasonalPeak}</strong></span>
                  <span>Min Hiatus: <strong className="text-slate-800 dark:text-slate-200">{heroProduct.minPromoGapWeeks} weeks</strong></span>
                  <span>Co-Op Rebate: <strong className="text-emerald-600 dark:text-emerald-400">{heroProduct.supplierCoOpEligible ? 'Eligible' : 'Supplier Funded Only'}</strong></span>
                </div>
              </div>
            )}

            {/* Campaign Theme & Headline with Quick Presets */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Campaign Theme &amp; Headline
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Catalogue Cover</span>
              </div>
              <input
                type="text"
                value={campaignTheme}
                onChange={(e) => setCampaignTheme(e.target.value)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                placeholder="e.g. The Great Aussie Backyard BBQ & Camp"
              />

              {/* Quick Preset Buttons (horizontally scrollable strip on mobile) */}
              <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5 pt-1 pb-0.5">
                {quickThemes.slice(0, 4).map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCampaignTheme(t)}
                    className="min-h-[34px] text-[10px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategic Objective & Target Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Strategic Objective</span>
                </label>
                <select
                  value={strategicObjective}
                  onChange={(e) => setStrategicObjective(e.target.value as StrategicObjective)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="volume_grab">Volume &amp; Footfall Driver</option>
                  <option value="margin_builder">Gross Margin Maximization</option>
                  <option value="competitive_defense">Market Share Defense</option>
                  <option value="clearance">Excess Inventory Clearance</option>
                  <option value="basket_driver">Basket Size Expansion</option>
                  <option value="event_hero">Key Retail Event Hero</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>Target Retail Channel</span>
                </label>
                <select
                  value={targetChannel}
                  onChange={(e) => setTargetChannel(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="All National Retailers">All National Retailers</option>
                  <option value="National Supermarket Chains">National Supermarket Chains</option>
                  <option value="Major Department Stores">Major Department Stores</option>
                  <option value="National Hardware & Trade Centers">National Hardware &amp; Trade Centers</option>
                  <option value="Global E-Commerce Marketplaces">Global E-Commerce Marketplaces</option>
                  <option value="Independent & Artisan Retailers">Independent &amp; Artisan Retailers</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. DISCOUNT MECHANIC & LIVE PRICE CONTROLS */}
          <div className={`${mobileTab === 'plan' ? 'block' : 'hidden'} lg:block bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Discount Mechanic &amp; Pricing Strategy</span>
              </h3>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{mechanicLabel}</span>
            </div>

            {/* Mechanic Types Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { id: 'percentage_off', label: '% Off RRP' },
                { id: 'price_drop', label: 'Price Drop' },
                { id: 'multi_buy', label: 'Multi-Buy' },
                { id: 'clearance_markdown', label: 'Clearance' },
                { id: 'bogo', label: 'BOGO' },
                { id: 'bundle_gwp', label: 'Bundle / GWP' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => handleMechanicTypeChange(m.id as any)}
                  className={`min-h-[40px] p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    mechanicType === m.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Dynamic Numeric Inputs based on Mechanic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {mechanicType === 'multi_buy' ? 'Pack Size (e.g. 2 for $X)' : 'Discount Depth (%)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={discountValue}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDiscountValue(val);
                    if (heroProduct && mechanicType === 'percentage_off') {
                      const p = Number((heroProduct.rrp * (1 - val / 100)).toFixed(2));
                      setPromoRrp(p);
                      setMechanicLabel(`${val}% Off RRP`);
                    }
                  }}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Promotional Price (AUD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={promoRrp}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setPromoRrp(val);
                    if (heroProduct && heroProduct.rrp > 0) {
                      const disc = Number((((heroProduct.rrp - val) / heroProduct.rrp) * 100).toFixed(1));
                      setDiscountValue(Math.max(0, disc));
                    }
                    setMechanicLabel(`Special $${val.toFixed(2)}`);
                  }}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Scan Rebate (AUD/u)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={supplierFundingPerUnit}
                  onChange={(e) => setSupplierFundingPerUnit(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 tabular-nums"
                />
              </div>
            </div>

            {/* Custom Label Override */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catalogue &amp; In-Store Price Callout Label
              </label>
              <input
                type="text"
                value={mechanicLabel}
                onChange={(e) => setMechanicLabel(e.target.value)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                placeholder="e.g. Save 30% | 2 for $15 | Hot Buy $399"
              />
            </div>

            {/* Promotional Case Deal ($ or % Cost Reduction) */}
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/20 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Promotional Case Deal ($ or % Off COGS)
                </span>
                {heroProduct && caseDealType !== 'none' && caseDealValue > 0 && (
                  <span className="text-[11px] font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    -{formatAud(calculateCaseDealUnitSavings(heroProduct, caseDealType, caseDealValue))}/u · Week Lift: +{formatAud(liveFin.caseDealSavingsTotalAud)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Case Deal Allowance Type
                  </label>
                  <select
                    value={caseDealType}
                    onChange={(e) => {
                      const next = e.target.value as CaseDealType;
                      setCaseDealType(next);
                      if (next === 'none') setCaseDealValue(0);
                    }}
                    className="w-full min-h-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="none">No Case Deal</option>
                    <option value="dollar_off_unit">$ Off Per Unit</option>
                    <option value="dollar_off_case">$ Off Per Carton ({heroProduct?.unitsPerCarton || 12} u/ctn)</option>
                    <option value="percent_off_cost">% Off Unit Cost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {caseDealType === 'percent_off_cost' ? 'Cost Reduction (%)' : 'Allowance Amount ($ AUD)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    disabled={caseDealType === 'none'}
                    value={caseDealType === 'none' ? 0 : caseDealValue}
                    onChange={(e) => setCaseDealValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full min-h-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 tabular-nums disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. MULTI-SKU PROMOTIONAL RANGE SELECTOR (Min 1 up to Catalog Max) */}
          <div className={`${mobileTab === 'skus' ? 'block' : 'hidden'} lg:block bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                  <span>Promotional SKUs in Week {weekPromotion.weekNumber}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hero SKU is always active (minimum 1). Select any additional SKUs up to your full catalog ({products.length} max).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums whitespace-nowrap">
                {totalPromotedSkusCount} / {products.length} SKUs Active
              </span>
            </div>

            {/* Hero SKU Indicator + Search & Select All Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="search"
                value={skuSearchQuery}
                onChange={(e) => setSkuSearchQuery(e.target.value)}
                placeholder="Filter SKUs by name, code, or category..."
                className="flex-1 min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {allNonHeroProducts.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={areAllSkusSelected ? handleClearExtraSkus : handleSelectAllSkus}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      areAllSkusSelected
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white shadow-xs'
                    }`}
                  >
                    {areAllSkusSelected
                      ? 'Keep Hero Only (Min 1)'
                      : `Select All SKUs (${products.length})`}
                  </button>
                  {activeSecondarySkus.length > 0 && !areAllSkusSelected && (
                    <button
                      type="button"
                      onClick={handleClearExtraSkus}
                      className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                    >
                      Clear Extra
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Active Hero Anchor (Locked Minimum 1) */}
            {heroProduct && (
              <div className="p-2.5 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-500/10 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white truncate">{heroProduct.name}</div>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    {heroProduct.sku} · ${heroProduct.rrp.toFixed(2)} · {heroProduct.category}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 whitespace-nowrap shrink-0">
                  Hero Anchor (Min 1)
                </span>
              </div>
            )}

            {/* Unrestricted Multi-Select SKU Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[52vh] lg:max-h-64 overflow-y-auto pr-1">
              {allNonHeroProducts
                .filter(p => {
                  const q = skuSearchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q) ||
                    p.category.toLowerCase().includes(q)
                  );
                })
                .map((p, idx) => {
                  const isSelected = activeSecondarySkus.includes(p.sku);
                  return (
                    <button
                      key={`sec-sku-${p.sku}-${idx}`}
                      type="button"
                      onClick={() => toggleSecondarySku(p.sku)}
                      className={`min-h-[44px] p-2.5 rounded-xl text-left text-xs border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/50 text-blue-900 dark:text-blue-200'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="truncate min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {p.sku} · ${p.rrp.toFixed(2)} · {p.category}
                        </div>
                      </div>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white font-bold' : 'border border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}>
                        {isSelected ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 4. OMNI-CHANNEL ACTIVATION & PLACEMENT */}
          <div className={`${mobileTab === 'channels' ? 'block' : 'hidden'} lg:block bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span>Omni-Channel Activation &amp; Placement</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Catalogue Slotting
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'front_cover', label: 'Page 1 Front Cover' },
                  { id: 'double_spread', label: 'Centre Double Spread' },
                  { id: 'category_feature', label: 'Category Banner' },
                  { id: 'checkout_end', label: 'Gondola End Cap' },
                  { id: 'digital_app', label: 'App Exclusive' },
                ].map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setCataloguePlacement(slot.id as any)}
                    className={`min-h-[40px] p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      cataloguePlacement === slot.id
                        ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500 text-purple-800 dark:text-purple-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Active Marketing Channels
              </label>
              <div className="space-y-1.5">
                {channelOptions.map(ch => {
                  const isActive = activeChannels.includes(ch);
                  return (
                    <label
                      key={ch}
                      className="flex items-center gap-2.5 min-h-[40px] text-xs text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleChannel(ch)}
                        className="rounded text-amber-500 focus:ring-amber-400 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                      <span>{ch}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Buyer Pitch Notes & Talking Points */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Category Buyer Pitch Notes &amp; Trade Terms</span>
              </label>
              <textarea
                rows={3}
                value={buyerPitchNotes}
                onChange={(e) => setBuyerPitchNotes(e.target.value)}
                placeholder="Log agreed supplier co-op funding terms, catalogue submission deadlines, pallet stock requirements, or buyer talking points..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM SAVE BAR (< lg, anchored above mobile workspace nav) */}
      <div className="fixed bottom-16 md:bottom-0 inset-x-0 z-30 lg:hidden px-3.5 py-2 border-t backdrop-blur-md bg-white/95 dark:bg-[#0f1523]/95 border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 shadow-lg">
        <div className="min-w-0">
          <div className="text-[11px] font-mono tabular-nums font-bold text-slate-900 dark:text-white truncate">
            W{weekPromotion.weekNumber} · {formatAud(liveFin.projectedRevenueAud)}
          </div>
          <div className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
            {liveFin.projectedMarginPercent}% GM · {totalPromotedSkusCount} {totalPromotedSkusCount === 1 ? 'SKU' : 'SKUs'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            showSaveSuccess
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
          }`}
        >
          {showSaveSuccess ? <Check className="w-4 h-4 shrink-0" /> : <Save className="w-4 h-4 shrink-0" />}
          <span>{showSaveSuccess ? 'Saved to Plan!' : 'Save Week Strategy'}</span>
        </button>
      </div>

      {/* MOBILE MORE OPTIONS ACTION SHEET (Move Week, Flow, Reset, Back to Calendar) */}
      {isMobileMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full rounded-t-3xl border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151b30] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5" />
            <div className="px-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black">Week {weekPromotion.weekNumber} Actions</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Move week slot, reset baseline, or return to calendar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                aria-label="Close week actions"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {onMovePromotion && (
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Move Promotion to Another Week</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={targetTransferWeek}
                      onChange={(e) => setTargetTransferWeek(parseInt(e.target.value, 10))}
                      className="flex-1 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl px-3 focus:outline-none cursor-pointer"
                    >
                      {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                        <option key={w} value={w}>
                          Week {w} {w === weekPromotion.weekNumber ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        handleTransferPromo();
                        setIsMobileMoreOpen(false);
                      }}
                      disabled={targetTransferWeek === weekPromotion.weekNumber}
                      className="min-h-[44px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-40 cursor-pointer whitespace-nowrap"
                    >
                      Move Week
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileTab('financials');
                  setIsFlowPanelOpen(true);
                  setIsMobileMoreOpen(false);
                }}
                className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-bold flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>Compare 3-Week Chronological Flow</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Baseline</span>
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMoreOpen(false);
                      onClose();
                    }}
                    className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>Back to Calendar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
