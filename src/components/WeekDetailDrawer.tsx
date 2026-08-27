import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { WeekPromotion, Product, MechanicType, CataloguePlacement, PromoMechanic, StrategicObjective } from '../types';
import { calculateMechanicFinancials } from '../utils/promoPlannerEngine';
import { formatAud, formatNumber, formatPercent } from '../utils/formatters';
import { safeFetch } from '../utils/api';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
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
  HelpCircle,
  Calendar,
  Building,
  Target,
  FileText,
  Sliders,
  Check,
  ArrowRightLeft
} from 'lucide-react';

interface WeekDetailDrawerProps {
  weekPromotion: WeekPromotion;
  products: Product[];
  allPromotions: WeekPromotion[];
  onSavePromotion: (updatedPromo: WeekPromotion) => void;
  onNavigateWeek: (weekNum: number) => void;
  onClose?: () => void;
  onMovePromotion?: (sourceWeekNum: number, targetWeekNum: number) => void;
}

export const WeekDetailDrawer: React.FC<WeekDetailDrawerProps> = ({
  weekPromotion,
  products,
  allPromotions,
  onSavePromotion,
  onNavigateWeek,
  onClose,
  onMovePromotion
}) => {
  // 1. Primary Editable State Fields
  const [heroSku, setHeroSku] = useState(weekPromotion.heroSku);
  const [campaignTheme, setCampaignTheme] = useState(weekPromotion.campaignTheme);
  const [mechanicType, setMechanicType] = useState<MechanicType>(weekPromotion.mechanic?.type || 'percentage_off');
  const [discountValue, setDiscountValue] = useState<number>(weekPromotion.mechanic?.discountValue || 20);
  const [promoRrp, setPromoRrp] = useState<number>(weekPromotion.mechanic?.promoRrp || 0);
  const [mechanicLabel, setMechanicLabel] = useState(weekPromotion.mechanic?.label || '');
  const [supplierFundingPerUnit, setSupplierFundingPerUnit] = useState<number>(weekPromotion.mechanic?.supplierFundingPerUnit || 0);
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
  const [targetTransferWeek, setTargetTransferWeek] = useState<number>(
    weekPromotion.weekNumber === 52 ? 1 : weekPromotion.weekNumber + 1
  );

  // Find hero product object
  const heroProduct = products.find(p => p.sku === heroSku) || products[0];

  // Sync state whenever active week promotion changes
  useEffect(() => {
    setHeroSku(weekPromotion.heroSku);
    setCampaignTheme(weekPromotion.campaignTheme);
    setMechanicType(weekPromotion.mechanic?.type || 'percentage_off');
    setDiscountValue(weekPromotion.mechanic?.discountValue || 20);
    const heroProd = products.find(p => p.sku === weekPromotion.heroSku);
    const calculatedPromo = weekPromotion.mechanic?.promoRrp || (heroProd?.rrp != null ? Number((heroProd.rrp * 0.8).toFixed(2)) : 0);
    setPromoRrp(calculatedPromo);
    setMechanicLabel(weekPromotion.mechanic?.label || '');
    setSupplierFundingPerUnit(weekPromotion.mechanic?.supplierFundingPerUnit || 0);
    setSecondarySkus(weekPromotion.secondarySkus || []);
    setCataloguePlacement(weekPromotion.cataloguePlacement || 'double_spread');
    setActiveChannels(weekPromotion.activeChannels || ['Print Catalogue', 'In-Store POS', 'Digital App Feature']);
    setStrategicObjective(weekPromotion.strategicObjective || 'volume_grab');
    setBuyerPitchNotes(weekPromotion.notes || '');
    setTargetTransferWeek(weekPromotion.weekNumber === 52 ? 1 : weekPromotion.weekNumber + 1);
    setAiAdvice(null);
    setAiError(null);
    setShowSaveSuccess(false);
  }, [weekPromotion.weekNumber, weekPromotion.heroSku, products]);

  const handleTransferPromo = () => {
    if (onMovePromotion && targetTransferWeek !== weekPromotion.weekNumber) {
      onMovePromotion(weekPromotion.weekNumber, targetTransferWeek);
      onNavigateWeek(targetTransferWeek);
    }
  };

  // Handle Hero SKU Change
  const handleHeroSkuChange = (sku: string) => {
    setHeroSku(sku);
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

  // Toggle Secondary SKU
  const toggleSecondarySku = (sku: string) => {
    if (secondarySkus.includes(sku)) {
      setSecondarySkus(secondarySkus.filter(s => s !== sku));
    } else {
      if (secondarySkus.length < 4) {
        setSecondarySkus([...secondarySkus, sku]);
      }
    }
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
    supplierFundingPerUnit
  };

  // 100% Mathematically Calculated Financials for the week
  const liveFin = heroProduct 
    ? calculateMechanicFinancials(heroProduct, currentMechanic, heroProduct.weeklyUnitsBaseline, weekPromotion.isMajorRetailMoment)
    : {
        promoRrp: 0,
        liftMultiplier: 1,
        projectedUnits: 0,
        projectedRevenueAud: 0,
        projectedMarginAud: 0,
        projectedMarginPercent: 0,
        tradeSpendAud: 0
      };

  // Calculate Mathematical Breakeven Volume Lift
  // Formula: Breakeven Lift % = (Discount %) / (Baseline Margin % - Discount %) * 100
  const baselineMarginPct = heroProduct ? heroProduct.marginPercent : 50;
  const effectiveDiscountPct = heroProduct && heroProduct.rrp > 0 
    ? Number((((heroProduct.rrp - liveFin.promoRrp) / heroProduct.rrp) * 100).toFixed(1))
    : 20;
  
  const breakevenLiftPct = (baselineMarginPct > effectiveDiscountPct && effectiveDiscountPct > 0)
    ? Number(((effectiveDiscountPct / (baselineMarginPct - effectiveDiscountPct)) * 100).toFixed(1))
    : 0;

  // ACCC 4-Week Hiatus Compliance Checker
  // Verifies if the same SKU is promoted in adjacent 4 weeks (W - 4 to W - 1 and W + 1 to W + 4)
  const currentWeekNum = weekPromotion.weekNumber;
  const adjacentClashingWeeks = allPromotions.filter(p => 
    p.weekNumber !== currentWeekNum &&
    Math.abs(p.weekNumber - currentWeekNum) <= 4 &&
    p.heroSku === heroSku
  );
  const isAcccCompliant = adjacentClashingWeeks.length === 0;

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
      heroSku,
      campaignTheme,
      strategicObjective,
      secondarySkus,
      mechanic: currentMechanic,
      cataloguePlacement,
      activeChannels,
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
    setCampaignTheme(weekPromotion.australianEvent ? `${weekPromotion.australianEvent} Feature` : 'Weekly Promotional Feature');
    setMechanicType('percentage_off');
    setDiscountValue(20);
    setPromoRrp(Number((heroProduct.rrp * 0.8).toFixed(2)));
    setMechanicLabel(`20% Off RRP`);
    setSupplierFundingPerUnit(heroProduct.supplierCoOpEligible ? Number((heroProduct.cost * 0.1).toFixed(2)) : 0);
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
      initial={{ opacity: 0, x: 25, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -25 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 pb-12"
    >
      {/* 1. TOP BANNER NAVIGATION & WEEK SELECTOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Week Info & Fast Jumper Dropdown */}
        <div className="flex items-center gap-3">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 flex flex-col items-center justify-center text-amber-400 font-black">
            <span className="text-xs uppercase font-bold text-amber-300">WK</span>
            <span className="text-lg leading-none">{weekPromotion.weekNumber}</span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Week Select Dropdown */}
              <select
                value={weekPromotion.weekNumber}
                onChange={(e) => onNavigateWeek(parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {allPromotions.map(p => (
                  <option key={p.weekNumber} value={p.weekNumber}>
                    Week {p.weekNumber} — {p.month} ({p.startDate} - {p.endDate}) {p.australianEvent ? `[${p.australianEvent}]` : ''}
                  </option>
                ))}
              </select>

              <span className="text-xs text-slate-400 font-medium">
                {weekPromotion.month} • {weekPromotion.quarter} ({weekPromotion.startDate} - {weekPromotion.endDate})
              </span>

              {weekPromotion.isMajorRetailMoment && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Key AU Retail Moment
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
              {weekPromotion.australianEvent ? (
                <>
                  <span className="text-amber-300">🇦🇺 {weekPromotion.australianEvent}</span>
                  <span className="text-slate-600">|</span>
                </>
              ) : null}
              <span className="text-slate-100">{campaignTheme}</span>
            </h2>
          </div>
        </div>

        {/* Navigation & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Target Week Transfer Action */}
          {onMovePromotion && (
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold pl-2 flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
                Move to:
              </span>
              <select
                value={targetTransferWeek}
                onChange={(e) => setTargetTransferWeek(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
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
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-40 cursor-pointer transition-all"
                title={`Move promotion from Week ${weekPromotion.weekNumber} to Week ${targetTransferWeek}`}
              >
                Move
              </button>
            </div>
          )}

          <button
            onClick={() => onNavigateWeek(Math.max(1, weekPromotion.weekNumber - 1))}
            disabled={weekPromotion.weekNumber <= 1}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
            title="Previous Week"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold text-slate-400 px-2 bg-slate-950 py-2 rounded-xl border border-slate-800">
            {weekPromotion.weekNumber} / 52
          </span>

          <button
            onClick={() => onNavigateWeek(Math.min(52, weekPromotion.weekNumber + 1))}
            disabled={weekPromotion.weekNumber >= 52}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
            title="Next Week"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            title="Reset to Event Baseline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
              showSaveSuccess
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {showSaveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{showSaveSuccess ? 'Saved to 52-Week Plan!' : 'Save Week Strategy'}</span>
          </button>
        </div>
      </div>

      {/* 2. COMPLIANCE & CLASH AUDIT BANNER */}
      {!isAcccCompliant && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-300 text-xs flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-400 text-sm">
              ACCC 4-Week Hiatus Warning for SKU: {heroSku}
            </div>
            <p className="mt-0.5 text-slate-300">
              This SKU is also scheduled for promotion in: {' '}
              <strong>{adjacentClashingWeeks.map(w => `Week ${w.weekNumber} (${w.campaignTheme})`).join(', ')}</strong>.
              Australian retail guidelines recommend at least 4 non-promoted baseline weeks between price reductions to avoid misleading "was/now" pricing claims.
            </p>
          </div>
        </div>
      )}

      {isAcccCompliant && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span><strong>ACCC Hiatus Guard:</strong> 100% Compliant. No promotion clash within 4 weeks of Week {weekPromotion.weekNumber}.</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Verified Clean Slot
          </span>
        </div>
      )}

      {/* 2.5 ADJACENT WEEKS COMPARISON SUMMARY (CLASH AVOIDANCE PANEL) */}
      <div id="three-week-flow-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>3-Week Chronological Flow & Clash Avoidance Panel</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            Comparing W-{currentWeekNum - 1} ➔ W-{currentWeekNum} ➔ W-{currentWeekNum + 1}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Previous Week Card */}
          {prevWeekPromo ? (
            <div id="prev-week-clash-card" className={`p-3.5 rounded-xl border bg-slate-950/40 relative overflow-hidden transition-all ${
              prevWeekPromo.heroSku === heroSku 
                ? 'border-rose-500/40 bg-rose-500/5' 
                : prevProduct?.category === heroProduct?.category && prevWeekPromo.heroSku !== heroSku
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-slate-800/80 hover:border-slate-700'
            }`}>
              {/* Clash badges */}
              {prevWeekPromo.heroSku === heroSku ? (
                <div className="absolute top-0 right-0 bg-rose-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-bl">
                  DIRECT SKU CLASH
                </div>
              ) : prevProduct?.category === heroProduct?.category ? (
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-bl">
                  CATEGORY CLUTTER
                </div>
              ) : null}

              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  Week {prevWeekPromo.weekNumber}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {prevWeekPromo.month}
                </span>
              </div>

              <div className="font-bold text-slate-200 text-xs truncate" title={prevProduct?.name || 'No Product'}>
                {prevProduct ? prevProduct.name : 'No Active SKU'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {prevWeekPromo.heroSku || 'N/A'}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Mechanic:</span>
                <span className={`font-bold ${prevWeekPromo.heroSku === heroSku ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {prevWeekPromo.mechanic?.label || 'No Promo'}
                </span>
              </div>
              
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>Category:</span>
                <span className={prevProduct?.category === heroProduct?.category ? 'text-amber-400 font-semibold' : ''}>
                  {prevProduct?.category || 'N/A'}
                </span>
              </div>

              <button 
                id="jump-prev-week-btn"
                type="button"
                onClick={() => onNavigateWeek(prevWeekPromo.weekNumber)}
                className="mt-2.5 w-full py-1 text-center text-[10px] font-bold rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                Jump to Week {prevWeekPromo.weekNumber}
              </button>
            </div>
          ) : (
            <div id="prev-week-empty-card" className="p-3.5 rounded-xl border border-slate-800/40 bg-slate-950/20 flex flex-col justify-center items-center text-slate-600 text-xs text-center min-h-[160px]">
              <span>No Previous Week</span>
              <span className="text-[10px] text-slate-700 mt-1">First week of the plan</span>
            </div>
          )}

          {/* Current Week Card (Active Editing context) */}
          <div id="current-week-clash-card" className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-bl">
              CURRENT FOCUS
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Week {currentWeekNum}
              </span>
              <span className="text-[10px] text-amber-400/80 font-medium">
                {weekPromotion.month}
              </span>
            </div>

            <div className="font-bold text-white text-xs truncate" title={heroProduct?.name || 'No Product'}>
              {heroProduct ? heroProduct.name : 'No Active SKU'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {heroSku || 'N/A'}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Mechanic:</span>
              <span className="font-bold text-amber-400">
                {currentMechanic.label || 'No Promo'}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Category:</span>
              <span className="text-slate-200">
                {heroProduct?.category || 'N/A'}
              </span>
            </div>

            <div className="mt-2.5 py-1 text-center text-[10px] font-bold rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 select-none">
              Editing Strategy
            </div>
          </div>

          {/* Next Week Card */}
          {nextWeekPromo ? (
            <div id="next-week-clash-card" className={`p-3.5 rounded-xl border bg-slate-950/40 relative overflow-hidden transition-all ${
              nextWeekPromo.heroSku === heroSku 
                ? 'border-rose-500/40 bg-rose-500/5' 
                : nextProduct?.category === heroProduct?.category && nextWeekPromo.heroSku !== heroSku
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-slate-800/80 hover:border-slate-700'
            }`}>
              {/* Clash badges */}
              {nextWeekPromo.heroSku === heroSku ? (
                <div className="absolute top-0 right-0 bg-rose-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-bl">
                  DIRECT SKU CLASH
                </div>
              ) : nextProduct?.category === heroProduct?.category ? (
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-bl">
                  CATEGORY CLUTTER
                </div>
              ) : null}

              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  Week {nextWeekPromo.weekNumber}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {nextWeekPromo.month}
                </span>
              </div>

              <div className="font-bold text-slate-200 text-xs truncate" title={nextProduct?.name || 'No Product'}>
                {nextProduct ? nextProduct.name : 'No Active SKU'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {nextWeekPromo.heroSku || 'N/A'}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Mechanic:</span>
                <span className={`font-bold ${nextWeekPromo.heroSku === heroSku ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {nextWeekPromo.mechanic?.label || 'No Promo'}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>Category:</span>
                <span className={nextProduct?.category === heroProduct?.category ? 'text-amber-400 font-semibold' : ''}>
                  {nextProduct?.category || 'N/A'}
                </span>
              </div>

              <button 
                id="jump-next-week-btn"
                type="button"
                onClick={() => onNavigateWeek(nextWeekPromo.weekNumber)}
                className="mt-2.5 w-full py-1 text-center text-[10px] font-bold rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                Jump to Week {nextWeekPromo.weekNumber}
              </button>
            </div>
          ) : (
            <div id="next-week-empty-card" className="p-3.5 rounded-xl border border-slate-800/40 bg-slate-950/20 flex flex-col justify-center items-center text-slate-600 text-xs text-center min-h-[160px]">
              <span>No Next Week</span>
              <span className="text-[10px] text-slate-700 mt-1">Last week of the plan</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN 2-COLUMN STUDIO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: 100% Calculated Financial Sandbox & AI Strategist (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Commercial Simulator Card */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>100% Calculated Week Financials</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Lift {liveFin.liftMultiplier ? `+${((liveFin.liftMultiplier - 1) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>

            {/* Big Revenue & Profit Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Projected Revenue</div>
                <div className="text-xl font-black text-white mt-1">
                  {formatAud(liveFin.projectedRevenueAud)}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  {formatNumber(liveFin.projectedUnits)} units projected
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">Gross Margin</div>
                <div className="text-xl font-black text-blue-400 mt-1">
                  {liveFin.projectedMarginPercent}%
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  {formatAud(liveFin.projectedMarginAud)} GP AUD
                </div>
              </div>
            </div>

            {/* Breakeven Volume Lift Box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Breakeven Volume Lift Required:</span>
                </span>
                <span className="text-sm font-black text-white">+{breakevenLiftPct}%</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                At a <strong>{effectiveDiscountPct}% discount</strong>, you need at least <strong>+{breakevenLiftPct}% unit uplift</strong> ({Math.round((heroProduct?.weeklyUnitsBaseline || 50) * (1 + breakevenLiftPct / 100))} units) to hold baseline gross profit dollars.
              </p>
            </div>

            {/* Waterfall Unit Economics Breakdown */}
            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 text-xs space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Unit Economics & Trade Spend</span>
                <span className="text-[10px] text-slate-500 lowercase font-normal">AUD currency</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Regular RRP:</span>
                <span className="text-white font-medium">${heroProduct?.rrp != null ? heroProduct.rrp.toFixed(2) : '0.00'}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Promotional Selling Price:</span>
                <span className="text-amber-400 font-bold">${(liveFin?.promoRrp || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Baseline Weekly Sales:</span>
                <span className="text-white font-medium">{formatNumber(heroProduct?.weeklyUnitsBaseline || 0)} units</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Promotional Unit Lift:</span>
                <span className="text-emerald-400 font-bold">
                  +{formatNumber(Math.max(0, (liveFin?.projectedUnits || 0) - (heroProduct?.weeklyUnitsBaseline || 0)))} units
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Unit COGS (Cost):</span>
                <span className="text-slate-300">${heroProduct?.cost != null ? heroProduct.cost.toFixed(2) : '0.00'}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Supplier Scan Funding:</span>
                <span className="text-blue-300 font-semibold">
                  +${(supplierFundingPerUnit || 0).toFixed(2)}/unit ({formatAud(liveFin?.tradeSpendAud || 0)} total)
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                <span>Total Gross Profit (GP AUD):</span>
                <span className="text-emerald-400">{formatAud(liveFin.projectedMarginAud)}</span>
              </div>
            </div>

            {/* AI Advisor Button */}
            <div className="pt-1">
              <button
                onClick={requestAiAdvice}
                disabled={isAiLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAiLoading ? 'Evaluating Category Dynamics...' : 'Ask AI Category Strategist for Week Advice'}</span>
              </button>
            </div>

            {/* AI Error */}
            {aiError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {aiError}
              </div>
            )}

            {/* AI Advice Output */}
            {aiAdvice && (
              <div className="bg-slate-950 rounded-xl p-4 border border-amber-500/40 text-xs space-y-3 shadow-md animate-fadeIn">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Recommendation for {aiAdvice.sku}</span>
                  </span>
                  <button
                    onClick={applyAiAdvice}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition-all cursor-pointer"
                  >
                    Apply All to Form
                  </button>
                </div>

                <div className="text-slate-200">
                  <strong className="text-amber-300">Campaign Headline:</strong> "{aiAdvice.marketingCopyHeadline}"
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Recommended Price:</span>
                    <strong className="text-emerald-400 text-sm">${aiAdvice.promotionalRrp} AUD</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Supplier Co-Op:</span>
                    <strong className="text-blue-300 text-sm">${aiAdvice.supplierFundingPerUnitAud}/unit</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300">
                  <strong className="text-slate-400 block mb-0.5">In-Store Merchandising Tip:</strong>
                  {aiAdvice.merchandisingTip}
                </div>

                {aiAdvice.crossSellRecommendations && (
                  <div className="text-[11px] text-slate-300">
                    <strong className="text-slate-400 block mb-0.5">Cross-Sell Basket Recommendations:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aiAdvice.crossSellRecommendations.map((item: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px]">
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
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. HERO SKU SELECTION & COMMERCIAL PROFILE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Featured Hero SKU</span>
              </h3>
              <span className="text-xs text-slate-400">Primary Promotional Anchor</span>
            </div>

            {/* SKU Search / Filter & Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Select SKU from Active Catalog ({products.length} available)
              </label>
              <select
                value={heroSku}
                onChange={(e) => handleHeroSkuChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
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
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">{heroProduct.name}</h4>
                    <p className="text-slate-400 text-xs">{heroProduct.category} &gt; {heroProduct.subcategory}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    {heroProduct.performanceTier.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center">
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <div className="text-[10px] text-slate-400">Regular RRP</div>
                    <div className="font-bold text-white">${heroProduct.rrp.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <div className="text-[10px] text-slate-400">Unit Cost</div>
                    <div className="font-bold text-slate-300">${heroProduct.cost.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <div className="text-[10px] text-slate-400">Base Margin</div>
                    <div className="font-bold text-blue-300">{heroProduct.marginPercent}%</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <div className="text-[10px] text-slate-400">Baseline Rate</div>
                    <div className="font-bold text-amber-300">{heroProduct.weeklyUnitsBaseline} u/wk</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span>Seasonal Affinity: <strong className="text-slate-200">{heroProduct.seasonalPeak}</strong></span>
                  <span>Min Hiatus: <strong className="text-slate-200">{heroProduct.minPromoGapWeeks} weeks</strong></span>
                  <span>Co-Op Rebate: <strong className="text-emerald-400">{heroProduct.supplierCoOpEligible ? 'Eligible' : 'Supplier Funded Only'}</strong></span>
                </div>
              </div>
            )}

            {/* Campaign Theme & Headline with Quick Presets */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Campaign Theme & Headline
                </label>
                <span className="text-[10px] text-slate-400">Printed on Catalogue Cover</span>
              </div>
              <input
                type="text"
                value={campaignTheme}
                onChange={(e) => setCampaignTheme(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="e.g. The Great Aussie Backyard BBQ & Camp"
              />

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickThemes.slice(0, 4).map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCampaignTheme(t)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-slate-700 cursor-pointer"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategic Objective & Target Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Strategic Objective</span>
                </label>
                <select
                  value={strategicObjective}
                  onChange={(e) => setStrategicObjective(e.target.value as StrategicObjective)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="volume_grab">Volume & Footfall Driver (volume_grab)</option>
                  <option value="margin_builder">Gross Margin Maximization (margin_builder)</option>
                  <option value="competitive_defense">Market Share Defense (competitive_defense)</option>
                  <option value="clearance">Excess Inventory Clearance (clearance)</option>
                  <option value="basket_driver">Basket Size Expansion (basket_driver)</option>
                  <option value="event_hero">Key Retail Event Hero (event_hero)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-400" />
                  <span>Target Retail Channel</span>
                </label>
                <select
                  value={targetChannel}
                  onChange={(e) => setTargetChannel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="All National Retailers">All National Retailers</option>
                  <option value="National Supermarket Chains">National Supermarket Chains</option>
                  <option value="Major Department Stores">Major Department Stores</option>
                  <option value="National Hardware & Trade Centers">National Hardware & Trade Centers</option>
                  <option value="Global E-Commerce Marketplaces">Global E-Commerce Marketplaces</option>
                  <option value="Independent & Artisan Retailers">Independent & Artisan Retailers</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. DISCOUNT MECHANIC & LIVE PRICE CONTROLS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>Discount Mechanic & Pricing Strategy</span>
              </h3>
              <span className="text-xs text-emerald-400 font-semibold">{mechanicLabel}</span>
            </div>

            {/* Mechanic Types Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'percentage_off', label: '% Off RRP' },
                { id: 'price_drop', label: 'Price Drop' },
                { id: 'multi_buy', label: 'Multi-Buy' },
                { id: 'clearance_markdown', label: 'Clearance' },
                { id: 'bogo', label: 'BOGO (Buy 1 Get 1)' },
                { id: 'bundle_gwp', label: 'Bundle / GWP' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => handleMechanicTypeChange(m.id as any)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    mechanicType === m.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Dynamic Numeric Inputs based on Mechanic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Supplier Scan Rebate (AUD/unit)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={supplierFundingPerUnit}
                  onChange={(e) => setSupplierFundingPerUnit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Custom Label Override */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Catalogue & In-Store Price Callout Label
              </label>
              <input
                type="text"
                value={mechanicLabel}
                onChange={(e) => setMechanicLabel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="e.g. Save 30% | 2 for $15 | Hot Buy $399"
              />
            </div>
          </div>

          {/* 3. SECONDARY CROSS-MERCHANDISING SKUS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Supporting Basket Builder SKUs (Cross-Merchandising)</span>
              </h3>
              <span className="text-xs text-slate-400">{secondarySkus.length} / 4 Selected</span>
            </div>

            <p className="text-xs text-slate-400">
              Select complementary lines featured on the same catalogue spread or in-store end-cap:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {products
                .filter(p => p.sku !== heroSku)
                .map((p, idx) => {
                  const isSelected = secondarySkus.includes(p.sku);
                  return (
                    <button
                      key={`sec-sku-${p.sku}-${idx}`}
                      type="button"
                      onClick={() => toggleSecondarySku(p.sku)}
                      className={`p-2 rounded-xl text-left text-xs border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400">${p.rrp.toFixed(2)} • {p.category}</div>
                      </div>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isSelected ? 'bg-blue-500 text-white font-bold' : 'border border-slate-700'
                      }`}>
                        {isSelected ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 4. OMNI-CHANNEL ACTIVATION & PLACEMENT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-purple-400" />
              <span>Omni-Channel Activation & Catalogue Placement</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Catalogue Slotting
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'front_cover', label: '⭐ Page 1 Front Cover' },
                  { id: 'double_spread', label: '📖 Centre Double Spread' },
                  { id: 'category_feature', label: '🏷️ Category Banner' },
                  { id: 'checkout_end', label: '🛒 Gondola End Cap' },
                  { id: 'digital_app', label: '📱 App Exclusive' },
                ].map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setCataloguePlacement(slot.id as any)}
                    className={`p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      cataloguePlacement === slot.id
                        ? 'bg-purple-500/20 border-purple-500 text-purple-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Active Marketing Channels
              </label>
              <div className="space-y-1.5">
                {channelOptions.map(ch => {
                  const isActive = activeChannels.includes(ch);
                  return (
                    <label
                      key={ch}
                      className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleChannel(ch)}
                        className="rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                      />
                      <span>{ch}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Buyer Pitch Notes & Talking Points */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Category Buyer Pitch Notes & Trade Terms</span>
              </label>
              <textarea
                rows={3}
                value={buyerPitchNotes}
                onChange={(e) => setBuyerPitchNotes(e.target.value)}
                placeholder="Log agreed supplier co-op funding terms, catalogue submission deadlines, pallet stock requirements, or buyer talking points..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
