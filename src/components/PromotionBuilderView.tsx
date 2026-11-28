import React, { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Save,
  RotateCcw,
  Plus,
  Edit3,
  Boxes,
  Check,
  X,
} from 'lucide-react';
import { AppTab, CaseDealType, MechanicType, Product, ThemeMode, WeekPromotion } from '../types';
import { formatAud, formatNumber } from '../utils/formatters';
import { calculateCaseDealUnitSavings } from '../utils/promoPlannerEngine';
import {
  buildSkuPromoDemandMap,
  computeSkuInventoryForecast,
  normalizeOptionalStock,
} from '../utils/inventoryForecast';

interface PromotionBuilderViewProps {
  products: Product[];
  promotions: WeekPromotion[];
  selectedWeekNum: number;
  currentTheme: ThemeMode;
  onSavePromotion: (updatedWeek: WeekPromotion) => void;
  onUpdateProduct?: (product: Product) => void;
  onSelectTab: (tab: AppTab) => void;
  onOpenAddProductModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
  preloadedConfig?: {
    sku?: string;
    weekNumber?: number;
    discountPercent?: number;
    triggeredAt?: number;
  } | null;
}

const GENERIC_CHANNELS = [
  { id: 'national_supermarkets', name: 'National Supermarkets', minMargin: 25, liftBonus: 1.35 },
  { id: 'metro_grocery', name: 'Metro Grocery', minMargin: 24, liftBonus: 1.2 },
  { id: 'independent_grocers', name: 'Independent Grocers', minMargin: 22, liftBonus: 1.1 },
  { id: 'warehouse_clubs', name: 'Warehouse Clubs', minMargin: 20, liftBonus: 1.45 },
  { id: 'online_marketplaces', name: 'Online Marketplaces', minMargin: 22, liftBonus: 1.25 },
];

export const PromotionBuilderView: React.FC<PromotionBuilderViewProps> = ({
  products,
  promotions,
  selectedWeekNum,
  currentTheme,
  onSavePromotion,
  onUpdateProduct,
  onSelectTab,
  onOpenAddProductModal,
  showToast,
  preloadedConfig,
}) => {
  const isLight = currentTheme.includes('light');

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSku, setSelectedSku] = useState<string>(products[0]?.sku || '');
  const [channelId, setChannelId] = useState<string>(GENERIC_CHANNELS[0].id);
  const [targetWeek, setTargetWeek] = useState<number>(selectedWeekNum || 1);

  // Ad-hoc scratch SKU values if catalog is empty so user can still simulate immediately
  const [scratchName, setScratchName] = useState('Choc Protein Bar 200g');
  const [scratchRrp, setScratchRrp] = useState<number>(8.5);
  const [scratchCost, setScratchCost] = useState<number>(3.3);
  const [scratchWeeklyUnits, setScratchWeeklyUnits] = useState<number>(400);
  const [scratchStockLevel, setScratchStockLevel] = useState<string>('');

  // Quick inline inventory editor for active catalog SKU
  const [isEditingCatalogStock, setIsEditingCatalogStock] = useState(false);
  const [catalogStockDraft, setCatalogStockDraft] = useState<string>('');

  // Promo configuration inputs
  const [promoType, setPromoType] = useState<MechanicType>('percentage_off');
  const [discountPercent, setDiscountPercent] = useState<number>(25);
  const [scanRebatePerUnit, setScanRebatePerUnit] = useState<number>(1.05);
  const [tradeSpendTotal, setTradeSpendTotal] = useState<number>(1500);
  const [otherCostsPerUnit, setOtherCostsPerUnit] = useState<number>(0.45);
  const [targetMarginFloor, setTargetMarginFloor] = useState<number>(25);
  const [caseDealType, setCaseDealType] = useState<CaseDealType>('none');
  const [caseDealValue, setCaseDealValue] = useState<number>(0);

  useEffect(() => {
    if (preloadedConfig) {
      if (preloadedConfig.sku && products.some((p) => p.sku === preloadedConfig.sku)) {
        setSelectedSku(preloadedConfig.sku);
      }
      if (preloadedConfig.weekNumber) {
        setTargetWeek(preloadedConfig.weekNumber);
      }
      if (preloadedConfig.discountPercent !== undefined) {
        setDiscountPercent(preloadedConfig.discountPercent);
      }
      // Always jump straight to Step 3 (Promotion Mechanics) when launched from an Insight CTA
      setStep(3);
    }
  }, [preloadedConfig, products]);

  useEffect(() => {
    if (products.length > 0 && !products.some((p) => p.sku === selectedSku)) {
      setSelectedSku(products[0].sku);
    }
  }, [products, selectedSku]);

  const activeProduct: Product = useMemo(() => {
    const match = products.find((p) => p.sku === selectedSku);
    if (match) return match;
    const parsedScratchStock = normalizeOptionalStock(scratchStockLevel);
    return {
      sku: 'SCENARIO-SKU',
      name: scratchName || 'Custom SKU',
      category: 'Grocery & FMCG',
      subcategory: 'Core Range',
      rrp: Math.max(0.5, scratchRrp),
      cost: Math.max(0.1, scratchCost),
      marginPercent:
        scratchRrp > 0 ? Number((((scratchRrp - scratchCost) / scratchRrp) * 100).toFixed(1)) : 40,
      weeklyUnitsBaseline: Math.max(10, scratchWeeklyUnits),
      performanceTier: 'tier1_hero' as const,
      seasonalPeak: 'All Year',
      targetWeeks: [targetWeek],
      tags: [],
      minPromoGapWeeks: 4,
      ...(parsedScratchStock !== undefined ? { stockLevel: parsedScratchStock } : {}),
    };
  }, [products, selectedSku, scratchName, scratchRrp, scratchCost, scratchWeeklyUnits, scratchStockLevel, targetWeek]);

  useEffect(() => {
    setCatalogStockDraft(
      activeProduct.stockLevel !== undefined && activeProduct.stockLevel !== null
        ? String(activeProduct.stockLevel)
        : ''
    );
    setIsEditingCatalogStock(false);
    setCaseDealType(activeProduct.defaultCaseDealType || 'none');
    setCaseDealValue(activeProduct.defaultCaseDealValue || 0);
  }, [activeProduct.sku, activeProduct.stockLevel, activeProduct.defaultCaseDealType, activeProduct.defaultCaseDealValue]);

  const activeChannel = useMemo(
    () => GENERIC_CHANNELS.find((c) => c.id === channelId) || GENERIC_CHANNELS[0],
    [channelId]
  );

  const selectedWeekObj = useMemo(
    () => promotions.find((p) => p.weekNumber === targetWeek) || promotions[0],
    [promotions, targetWeek]
  );

  // Live Waterfall & Forecast Engine (Case Deal reduces unit COGS before profit calculation)
  const calc = useMemo(() => {
    const rrp = Math.max(0.01, activeProduct.rrp);
    const discountDollar = Number((rrp * (discountPercent / 100)).toFixed(2));
    const shelfPrice = Math.max(0.01, Number((rrp - discountDollar).toFixed(2)));

    const elasticityLift = 1 + (discountPercent / 100) * 2.1 * activeChannel.liftBonus;
    const unitsForecast = Math.max(
      1,
      Math.round((activeProduct.weeklyUnitsBaseline || 100) * elasticityLift)
    );
    const revenueForecast = Number((unitsForecast * shelfPrice).toFixed(2));

    const caseDealUnitSavings = calculateCaseDealUnitSavings(activeProduct, caseDealType, caseDealValue);
    const effectiveUnitCost = Number(Math.max(0.01, activeProduct.cost - caseDealUnitSavings).toFixed(2));
    const caseDealSavingsTotalAud = Number((unitsForecast * caseDealUnitSavings).toFixed(2));

    const tradeSpendPerUnit = Number((tradeSpendTotal / Math.max(1, unitsForecast)).toFixed(2));
    const totalUnitCostAndDeductions = Number(
      (effectiveUnitCost + scanRebatePerUnit + tradeSpendPerUnit + otherCostsPerUnit).toFixed(2)
    );

    const netProfitPerUnit = Number((shelfPrice - totalUnitCostAndDeductions).toFixed(2));
    const netMarginPct = shelfPrice > 0 ? Number(((netProfitPerUnit / shelfPrice) * 100).toFixed(1)) : 0;
    const projectedProfit = Number((netProfitPerUnit * unitsForecast).toFixed(2));

    // Check Custom 4-Week Hiatus Clash against existing schedule
    const minGap = activeProduct.minPromoGapWeeks || 4;
    const clashingWeeks = promotions.filter(
      (p) =>
        !p.isPromoSkipped &&
        p.weekNumber !== targetWeek &&
        Math.abs(p.weekNumber - targetWeek) <= minGap &&
        (p.heroSku === activeProduct.sku || (p.secondarySkus || []).includes(activeProduct.sku))
    );

    let approvalState: 'approved' | 'review' | 'at_risk' = 'approved';
    if (netMarginPct < targetMarginFloor - 4 || projectedProfit <= 0 || clashingWeeks.length > 0) {
      approvalState = 'at_risk';
    } else if (netMarginPct < targetMarginFloor) {
      approvalState = 'review';
    }

    const suggestedSafeDiscount = Math.max(
      10,
      Math.min(45, Math.floor(discountPercent - Math.max(0, (targetMarginFloor - netMarginPct) * 0.6)))
    );

    return {
      rrp,
      discountDollar,
      shelfPrice,
      unitsForecast,
      revenueForecast,
      caseDealUnitSavings,
      effectiveUnitCost,
      caseDealSavingsTotalAud,
      tradeSpendPerUnit,
      netProfitPerUnit,
      netMarginPct,
      projectedProfit,
      clashingWeeks,
      approvalState,
      suggestedSafeDiscount,
    };
  }, [
    activeProduct,
    activeChannel,
    discountPercent,
    caseDealType,
    caseDealValue,
    scanRebatePerUnit,
    tradeSpendTotal,
    otherCostsPerUnit,
    targetMarginFloor,
    promotions,
    targetWeek,
  ]);

  const skuPromoDemandMap = useMemo(
    () => buildSkuPromoDemandMap(products, promotions),
    [products, promotions]
  );

  const invForecast = useMemo(
    () =>
      computeSkuInventoryForecast(
        activeProduct,
        skuPromoDemandMap.get(activeProduct.sku),
        calc.unitsForecast
      ),
    [activeProduct, skuPromoDemandMap, calc.unitsForecast]
  );

  const handleSaveInlineStock = (rawValue: string) => {
    const normalized = normalizeOptionalStock(rawValue);
    if (products.length === 0 || activeProduct.sku === 'SCENARIO-SKU') {
      setScratchStockLevel(normalized !== undefined ? String(normalized) : '');
      setIsEditingCatalogStock(false);
      return;
    }
    const updated: Product = { ...activeProduct };
    if (normalized !== undefined) {
      updated.stockLevel = normalized;
    } else {
      delete updated.stockLevel;
    }
    if (onUpdateProduct) {
      onUpdateProduct(updated);
    }
    setIsEditingCatalogStock(false);
    showToast(
      normalized === undefined
        ? `${activeProduct.sku} inventory cleared (unconstrained supply).`
        : `Updated ${activeProduct.sku} inventory to ${formatNumber(normalized)} units.`,
      'info'
    );
  };

  const handleSaveToCalendar = () => {
    if (products.length === 0) {
      onOpenAddProductModal();
      showToast('Add at least one SKU to your catalog before saving to the 52-week plan.', 'info');
      return;
    }

    const base = selectedWeekObj;
    if (!base) return;

    const nextSkuCaseDeals = { ...(base.skuCaseDeals || {}) };
    if (caseDealType !== 'none' && caseDealValue > 0) {
      nextSkuCaseDeals[activeProduct.sku] = { type: caseDealType, value: caseDealValue };
    } else {
      delete nextSkuCaseDeals[activeProduct.sku];
    }

    const updated: WeekPromotion = {
      ...base,
      isPromoSkipped: false,
      heroSku: activeProduct.sku,
      campaignTheme: `${activeChannel.name}: ${activeProduct.name} (${discountPercent}% Off)`,
      mechanic: {
        type: promoType,
        discountValue: discountPercent,
        promoRrp: calc.shelfPrice,
        label:
          promoType === 'multi_buy'
            ? `2 for $${(calc.shelfPrice * 2).toFixed(2)}`
            : promoType === 'bundle_gwp'
            ? `Bundle Save ${discountPercent}%`
            : `${discountPercent}% Off RRP`,
        supplierFundingPerUnit: scanRebatePerUnit,
        caseDealType,
        caseDealValue: caseDealType === 'none' ? 0 : caseDealValue,
      },
      skuCaseDeals: Object.keys(nextSkuCaseDeals).length > 0 ? nextSkuCaseDeals : undefined,
      projectedUnits: calc.unitsForecast,
      projectedRevenueAud: calc.revenueForecast,
      projectedMarginPercent: calc.netMarginPct,
      projectedMarginAud: calc.projectedProfit,
      tradeSpendAud: Number((scanRebatePerUnit * calc.unitsForecast + tradeSpendTotal).toFixed(2)),
    };

    onSavePromotion(updated);
    showToast(`Saved ${activeProduct.name} promotion to Week ${targetWeek} (${activeChannel.name}).`, 'success');
  };

  const handleReset = () => {
    setPromoType('percentage_off');
    setDiscountPercent(25);
    setScanRebatePerUnit(1.05);
    setTradeSpendTotal(1500);
    setOtherCostsPerUnit(0.45);
    setTargetMarginFloor(25);
    setCaseDealType('none');
    setCaseDealValue(0);
  };

  const cardClass = isLight
    ? 'bg-white border border-[#E2E8F0] shadow-2xs'
    : 'bg-[#111726] border border-slate-800';

  const steps = [
    { id: 1 as const, label: 'Product', sub: 'Select a product' },
    { id: 2 as const, label: 'Channel', sub: 'Choose retail channel' },
    { id: 3 as const, label: 'Promotion', sub: 'Set discount & spend' },
    { id: 4 as const, label: 'Review', sub: 'Validate commercial impact' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className="hover:text-[#2563EB] cursor-pointer"
            >
              Dashboard
            </button>
            <span>/</span>
            <span>Promotions</span>
            <span>/</span>
            <span className={isLight ? 'text-[#0F172A] font-semibold' : 'text-white font-semibold'}>
              New Promotion
            </span>
          </div>
          <h1 className={`text-2xl font-bold tracking-tight mt-1 ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
            Create a New Promotion
          </h1>
          <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            See the commercial impact and net margin waterfall before you commit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSaveToCalendar}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Week {targetWeek}</span>
          </button>
        </div>
      </div>

      {/* 4-Step Interactive Stepper */}
      <div className={`rounded-xl p-2 grid grid-cols-2 lg:grid-cols-4 gap-2 ${cardClass}`}>
        {steps.map((s) => {
          const active = step === s.id;
          const completed = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`p-3 rounded-lg text-left flex items-center gap-3 transition-colors cursor-pointer ${
                active
                  ? isLight
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-blue-950/60 border border-blue-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : completed
                    ? 'bg-[#10B981] text-white'
                    : isLight
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {s.id}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-semibold truncate ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{s.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Two-Column Flagship Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Guided Step Form */}
        <div className={`lg:col-span-5 rounded-xl p-6 space-y-5 ${cardClass}`}>
          {step === 1 && (
            <div className="space-y-4">
              <h2 className={`text-base font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                1. Select Product
              </h2>

              {products.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Catalog Product
                    </label>
                    <select
                      value={selectedSku}
                      onChange={(e) => setSelectedSku(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      {products.map((p) => (
                        <option key={p.sku} value={p.sku}>
                          {p.name} ({p.sku}) · RRP ${p.rrp.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums ${
                      isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-slate-500 block">Regular RRP</span>
                      <span className="font-bold text-sm">${activeProduct.rrp.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Unit Cost</span>
                      <span className="font-bold text-sm">${activeProduct.cost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Base Margin</span>
                      <span className="font-bold text-sm text-[#10B981]">
                        {activeProduct.marginPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Inventory</span>
                      <span className="font-bold text-sm">
                        {invForecast.hasInventory
                          ? `${formatNumber(invForecast.currentStock || 0)} u`
                          : 'Blank'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                    <span>Catalog empty — model any test SKU below or add to catalog.</span>
                    <button
                      type="button"
                      onClick={onOpenAddProductModal}
                      className="font-semibold underline shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add SKU
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={scratchName}
                      onChange={(e) => setScratchName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        RRP ($)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={scratchRrp}
                        onChange={(e) => setScratchRrp(Number(e.target.value) || 0)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm tabular-nums ${
                          isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Unit Cost ($)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={scratchCost}
                        onChange={(e) => setScratchCost(Number(e.target.value) || 0)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm tabular-nums ${
                          isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Base Units/Wk
                      </label>
                      <input
                        type="number"
                        step="10"
                        value={scratchWeeklyUnits}
                        onChange={(e) => setScratchWeeklyUnits(Number(e.target.value) || 0)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm tabular-nums ${
                          isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Stock (Opt.)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Blank"
                        value={scratchStockLevel}
                        onChange={(e) => setScratchStockLevel(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm tabular-nums ${
                          isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className={`text-base font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                2. Select Channel & Period
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Retail Channel
                </label>
                <select
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  {GENERIC_CHANNELS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Promotion Week (52-Week Calendar)
                </label>
                <select
                  value={targetWeek}
                  onChange={(e) => setTargetWeek(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium tabular-nums ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  {promotions.map((w) => (
                    <option key={w.weekNumber} value={w.weekNumber}>
                      Week {w.weekNumber} ({w.startDate} – {w.endDate})
                      {w.australianEvent ? ` · ${w.australianEvent}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className={`text-base font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                3. Configure Promotion Mechanics
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Discount Type
                </label>
                <select
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value as MechanicType)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <option value="percentage_off">Percentage Off</option>
                  <option value="price_drop">Temporary Price Reduction ($ Off)</option>
                  <option value="multi_buy">Multi-Buy Bundle</option>
                  <option value="bundle_gwp">Gift With Purchase / Bundle</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Discount Depth</span>
                  <span className="tabular-nums text-[#2563EB] font-bold">{discountPercent}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={1}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Scan Rebate ($/unit)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min={0}
                    value={scanRebatePerUnit}
                    onChange={(e) => setScanRebatePerUnit(Math.max(0, Number(e.target.value) || 0))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm tabular-nums ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Fixed Trade Spend ($)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min={0}
                    value={tradeSpendTotal}
                    onChange={(e) => setTradeSpendTotal(Math.max(0, Number(e.target.value) || 0))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm tabular-nums ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Other Costs ($/unit)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min={0}
                    value={otherCostsPerUnit}
                    onChange={(e) => setOtherCostsPerUnit(Math.max(0, Number(e.target.value) || 0))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm tabular-nums ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Margin Floor Target (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min={5}
                    max={70}
                    value={targetMarginFloor}
                    onChange={(e) => setTargetMarginFloor(Math.max(5, Number(e.target.value) || 25))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm tabular-nums ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>
              </div>

              {/* Promotional Case Deal ($ or % Cost Reduction) */}
              <div
                className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                    Promotional Case Deal ($ or % Cost Reduction)
                  </span>
                  {calc.caseDealUnitSavings > 0 && (
                    <span className="text-[11px] font-bold font-mono tabular-nums text-[#10B981]">
                      -${calc.caseDealUnitSavings.toFixed(2)}/unit COGS
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Case Deal Type
                    </label>
                    <select
                      value={caseDealType}
                      onChange={(e) => {
                        const nextType = e.target.value as CaseDealType;
                        setCaseDealType(nextType);
                        if (nextType === 'none') setCaseDealValue(0);
                      }}
                      className={`w-full px-3 py-2 rounded-lg border text-xs font-medium ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      <option value="none">No Case Deal</option>
                      <option value="dollar_off_unit">$ Off Per Unit</option>
                      <option value="dollar_off_case">
                        $ Off Per Carton ({activeProduct.unitsPerCarton || 12} u/ctn)
                      </option>
                      <option value="percent_off_cost">% Off Unit Cost</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {caseDealType === 'percent_off_cost' ? 'Discount (%)' : 'Allowance ($ AUD)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      disabled={caseDealType === 'none'}
                      value={caseDealType === 'none' ? 0 : caseDealValue}
                      onChange={(e) => setCaseDealValue(Math.max(0, Number(e.target.value) || 0))}
                      className={`w-full px-3 py-2 rounded-lg border text-xs tabular-nums disabled:opacity-50 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className={`text-base font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                4. Commercial Review & Sign-Off
              </h2>

              <div
                className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                  isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-slate-500">Product</span>
                  <span className="font-semibold">{activeProduct.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Channel</span>
                  <span className="font-semibold">{activeChannel.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Calendar Slot</span>
                  <span className="font-semibold tabular-nums">Week {targetWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Custom 4-Week Hiatus Rule</span>
                  <span
                    className={`font-semibold ${
                      calc.clashingWeeks.length === 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {calc.clashingWeeks.length === 0
                      ? 'Clear (No conflict)'
                      : `Conflict in W${calc.clashingWeeks.map((w) => w.weekNumber).join(', W')}`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveToCalendar}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Commit Promotion to Week {targetWeek}</span>
              </button>
            </div>
          )}

          {/* Step Navigation Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1) as any)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={step === 4}
              onClick={() => setStep((s) => Math.min(4, s + 1) as any)}
              className="px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Projected Outcome & Live Per-Unit Waterfall */}
        <div className={`lg:col-span-7 rounded-xl p-6 space-y-6 ${cardClass}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className={`text-base font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                Projected Outcome
              </h2>
              <p className="text-xs text-slate-500">
                Updates live as you adjust product, channel, discount, or trade spend
              </p>
            </div>

            {/* Promotion Approval State Badge */}
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                calc.approvalState === 'approved'
                  ? 'bg-emerald-500/10 text-[#10B981] border border-emerald-500/30'
                  : calc.approvalState === 'review'
                  ? 'bg-amber-500/10 text-[#F59E0B] border border-amber-500/30'
                  : 'bg-red-500/10 text-[#EF4444] border border-red-500/30'
              }`}
            >
              {calc.approvalState === 'approved' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : calc.approvalState === 'review' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
              <span>
                {calc.approvalState === 'approved'
                  ? 'Promotion Approved'
                  : calc.approvalState === 'review'
                  ? 'Review Required'
                  : 'Promotion At Risk'}
              </span>
            </div>
          </div>

          {/* 5 Outcome Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <span className="text-[11px] text-slate-500 block">Shelf Price</span>
              <span className="text-lg font-bold tabular-nums">${calc.shelfPrice.toFixed(2)}</span>
              <span className="text-[11px] text-slate-400 block tabular-nums">Was ${calc.rrp.toFixed(2)}</span>
            </div>
            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <span className="text-[11px] text-slate-500 block">Units Forecast</span>
              <span className="text-lg font-bold tabular-nums">{formatNumber(calc.unitsForecast)}</span>
              <span className="text-[11px] text-[#10B981] block">Volume lift</span>
            </div>
            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <span className="text-[11px] text-slate-500 block">Revenue</span>
              <span className="text-lg font-bold tabular-nums">{formatAud(calc.revenueForecast)}</span>
              <span className="text-[11px] text-slate-400 block">{activeChannel.name}</span>
            </div>
            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <span className="text-[11px] text-slate-500 block">Net Margin</span>
              <span
                className={`text-lg font-bold tabular-nums ${
                  calc.netMarginPct >= targetMarginFloor
                    ? 'text-[#10B981]'
                    : calc.netMarginPct >= targetMarginFloor - 4
                    ? 'text-[#F59E0B]'
                    : 'text-[#EF4444]'
                }`}
              >
                {calc.netMarginPct.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 block tabular-nums">Floor {targetMarginFloor}%</span>
            </div>
            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <span className="text-[11px] text-slate-500 block">Projected Profit</span>
              <span className="text-lg font-bold tabular-nums">{formatAud(calc.projectedProfit)}</span>
              <span className="text-[11px] text-slate-400 block tabular-nums">
                ${calc.netProfitPerUnit.toFixed(2)}/unit
              </span>
            </div>
          </div>

          {/* Inventory & Supply Cover Strip */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
              !invForecast.hasInventory
                ? isLight
                  ? 'bg-[#F8FAFC] border-slate-200'
                  : 'bg-slate-900/60 border-slate-800'
                : invForecast.periodShortfallUnits > 0 || invForecast.stockStatus === 'CRITICAL'
                ? 'bg-red-500/5 border-red-500/30'
                : invForecast.stockStatus === 'LOW'
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-emerald-500/5 border-emerald-500/25'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <Boxes
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  !invForecast.hasInventory
                    ? 'text-slate-400'
                    : invForecast.periodShortfallUnits > 0 || invForecast.stockStatus === 'CRITICAL'
                    ? 'text-[#EF4444]'
                    : invForecast.stockStatus === 'LOW'
                    ? 'text-[#F59E0B]'
                    : 'text-[#10B981]'
                }`}
              />
              <div className="min-w-0">
                <div className={`font-semibold flex flex-wrap items-center gap-2 ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                  <span>
                    {invForecast.hasInventory
                      ? `Inventory On Hand: ${formatNumber(invForecast.currentStock || 0)} units`
                      : 'Inventory: Unconstrained (Blank)'}
                  </span>
                  {invForecast.hasInventory && (
                    <span className="tabular-nums text-[11px] font-bold px-2 py-0.5 rounded bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {invForecast.weeksOfCover} wks cover
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 tabular-nums">
                  {!invForecast.hasInventory
                    ? 'Stock left blank — forecasting assumes unconstrained supply with zero stockout warnings.'
                    : invForecast.periodShortfallUnits > 0
                    ? `Stockout Warning: Week demand (${formatNumber(calc.unitsForecast)} u) exceeds entered stock by ${formatNumber(invForecast.periodShortfallUnits)} units.`
                    : invForecast.stockStatus === 'CRITICAL' || invForecast.stockStatus === 'LOW'
                    ? `Low Stock Cover: Covers Week ${targetWeek} (${formatNumber(calc.unitsForecast)} u), but falls below safety cover across the plan.`
                    : `Supply Verified: Covers Week ${targetWeek} demand (${formatNumber(calc.unitsForecast)} u) with ${invForecast.weeksOfCover} weeks cover.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isEditingCatalogStock ? (
                <>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Blank"
                    value={catalogStockDraft}
                    onChange={(e) => setCatalogStockDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveInlineStock(catalogStockDraft);
                      } else if (e.key === 'Escape') {
                        setIsEditingCatalogStock(false);
                      }
                    }}
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-[#2563EB] text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveInlineStock(catalogStockDraft)}
                    className="p-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white cursor-pointer"
                    title="Save stock"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveInlineStock('')}
                    className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCatalogStock(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogStockDraft(
                        invForecast.hasInventory ? String(invForecast.currentStock) : ''
                      );
                      setIsEditingCatalogStock(true);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{invForecast.hasInventory ? 'Edit Stock' : 'Set Stock'}</span>
                  </button>
                  {invForecast.hasInventory && (
                    <button
                      type="button"
                      onClick={() => handleSaveInlineStock('')}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Clear
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Enhanced Live Per-Unit Waterfall */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                Live Per-Unit Margin Waterfall
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                RRP ${calc.rrp.toFixed(2)} → Net Take Home ${calc.netProfitPerUnit.toFixed(2)}
              </span>
            </div>

            {/* Proportional Bar Bridge */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
              <div
                style={{ width: `${Math.min(100, (calc.discountDollar / calc.rrp) * 100)}%` }}
                className="bg-[#EF4444]"
                title={`Discount -$${calc.discountDollar.toFixed(2)}`}
              />
              <div
                style={{ width: `${Math.min(100, (scanRebatePerUnit / calc.rrp) * 100)}%` }}
                className="bg-[#F59E0B]"
                title={`Scan Rebate -$${scanRebatePerUnit.toFixed(2)}`}
              />
              <div
                style={{
                  width: `${Math.min(100, ((calc.tradeSpendPerUnit + otherCostsPerUnit + calc.effectiveUnitCost) / calc.rrp) * 100)}%`,
                }}
                className="bg-slate-400"
                title="Trade Spend + Net COGS + Other Costs"
              />
              <div
                style={{ width: `${Math.max(0, (calc.netProfitPerUnit / calc.rrp) * 100)}%` }}
                className="bg-[#10B981]"
                title={`Net Take Home $${calc.netProfitPerUnit.toFixed(2)}`}
              />
            </div>

            {calc.caseDealSavingsTotalAud > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs tabular-nums">
                <span className="font-semibold text-[#10B981]">
                  Case Deal Cost Reduction Active (-${calc.caseDealUnitSavings.toFixed(2)}/unit)
                </span>
                <span className="font-bold text-[#10B981]">
                  Total Savings: +{formatAud(calc.caseDealSavingsTotalAud)} profit lift
                </span>
              </div>
            )}

            {/* Detailed Per-Unit Step Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-1 text-xs tabular-nums">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">RRP</span>
                <span className="font-bold text-sm">${calc.rrp.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">Promo Disc.</span>
                <span className="font-bold text-sm text-[#EF4444]">-${calc.discountDollar.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">Scan Rebate</span>
                <span className="font-bold text-sm text-[#F59E0B]">-${scanRebatePerUnit.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">Trade Spend</span>
                <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                  -${calc.tradeSpendPerUnit.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">
                  {calc.caseDealUnitSavings > 0 ? 'Net COGS & Other' : 'COGS & Other'}
                </span>
                <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                  -${(calc.effectiveUnitCost + otherCostsPerUnit).toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-500/5">
                <span className="text-[11px] text-slate-500 block">Net Take Home</span>
                <span
                  className={`font-bold text-sm ${
                    calc.netProfitPerUnit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  ${calc.netProfitPerUnit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Commercial Guardrail Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              calc.approvalState === 'approved'
                ? 'bg-emerald-500/5 border-emerald-500/25'
                : calc.approvalState === 'review'
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-red-500/5 border-red-500/30'
            }`}
          >
            <div className="text-xs space-y-1">
              <div className={`font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                {calc.approvalState === 'approved'
                  ? `Above your ${targetMarginFloor}% margin floor`
                  : calc.clashingWeeks.length > 0
                  ? `Custom 4-week hiatus conflict with Week ${calc.clashingWeeks.map((w) => w.weekNumber).join(', ')}`
                  : `Below your ${targetMarginFloor}% margin floor (${calc.netMarginPct.toFixed(1)}%)`}
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                {calc.approvalState === 'approved'
                  ? `Projected to deliver ${calc.netMarginPct.toFixed(1)}% net margin and ${formatAud(calc.projectedProfit)} profit.`
                  : `Consider adjusting discount depth toward ${calc.suggestedSafeDiscount}% or negotiating co-op funding to protect margin.`}
              </p>
            </div>
            {calc.approvalState !== 'approved' && discountPercent > calc.suggestedSafeDiscount && (
              <button
                type="button"
                onClick={() => setDiscountPercent(calc.suggestedSafeDiscount)}
                className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap"
              >
                Apply {calc.suggestedSafeDiscount}% Discount
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
