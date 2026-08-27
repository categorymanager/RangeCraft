import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Product, 
  WeekPromotion, 
  ThemeMode, 
  UserProfile, 
  StrategicObjective,
  PromoMechanic,
  StrategyKPIs
} from '../types';
import { 
  calculateStrategyKPIs, 
  generateScenarioPlan, 
  ScenarioType, 
  auditAcccCompliance, 
  calculateDeadNetCost,
  calculateTradeSpendWaterfall,
  calculateMechanicFinancials
} from '../utils/promoPlannerEngine';
import { formatAud, formatPercent, formatNumber } from '../utils/formatters';
import { FmcgTooltip } from './FmcgTooltip';
import { 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  FileText, 
  Download, 
  SlidersHorizontal, 
  Building2, 
  ShoppingBag, 
  BarChart3, 
  Layers, 
  Calendar, 
  Percent, 
  DollarSign, 
  Upload, 
  RefreshCw, 
  Check, 
  ChevronRight, 
  AlertCircle, 
  Eye, 
  Plus, 
  ExternalLink,
  Target,
  FileCheck,
  Zap,
  HelpCircle
} from 'lucide-react';

interface TradeStrategyFunnelViewProps {
  products: Product[];
  promotions: WeekPromotion[];
  currentTheme: ThemeMode;
  user: UserProfile | null;
  onUpdatePromotions: (newPromos: WeekPromotion[]) => void;
  onImportProducts: (newProducts: Product[]) => void;
  onAutoFixClashes: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenPricingModal: () => void;
  onOpenAuthModal: () => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

export const TradeStrategyFunnelView: React.FC<TradeStrategyFunnelViewProps> = ({
  products,
  promotions,
  currentTheme,
  user,
  onUpdatePromotions,
  onImportProducts,
  onAutoFixClashes,
  onNavigateTab,
  onOpenPricingModal,
  onOpenAuthModal,
  showToast
}) => {
  const isLight = currentTheme.includes('light');

  // Step state (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Channel selection & fast onboarding state
  const [selectedChannel, setSelectedChannel] = useState<string>('woolworths');
  const [selectedCategory, setSelectedCategory] = useState<string>('Grocery & FMCG');
  const [targetAnnualRevenue, setTargetAnnualRevenue] = useState<number>(1250000);

  // Step 2: Canvas Scenario & Margin Safety Floor Simulation
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('baseline');
  const [marginFloorThreshold, setMarginFloorThreshold] = useState<number>(28);
  const [interactiveDiscountDepth, setInteractiveDiscountDepth] = useState<number>(25);
  const [interactiveScanRebateAud, setInteractiveScanRebateAud] = useState<number>(1.50);
  const [interactiveVolumeLiftMultiplier, setInteractiveVolumeLiftMultiplier] = useState<number>(2.4);

  // Step 5: Lock & Celebration State
  const [isStrategyLocked, setIsStrategyLocked] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [lockedTimestamp, setLockedTimestamp] = useState<string | null>(null);

  // Channels metadata
  const CHANNELS = [
    { id: 'woolworths', name: 'Woolworths Supermarkets', type: 'Supermarket Leader', icon: '🟢', minMargin: 32, hiatusWeeks: 4 },
    { id: 'coles', name: 'Coles Supermarkets', type: 'Supermarket Major', icon: '🔴', minMargin: 30, hiatusWeeks: 4 },
    { id: 'metcash', name: 'Metcash / IGA Independent Network', type: 'Wholesale & Independent', icon: '🔵', minMargin: 26, hiatusWeeks: 3 },
    { id: 'chemist_wh', name: 'Chemist Warehouse', type: 'National Pharmacy', icon: '🟡', minMargin: 35, hiatusWeeks: 4 },
    { id: 'amazon_au', name: 'Amazon Australia / D2C', type: 'Digital Marketplace', icon: '📦', minMargin: 25, hiatusWeeks: 2 },
    { id: 'bunnings', name: 'Bunnings Warehouse', type: 'Home Improvement & DIY', icon: '🔨', minMargin: 30, hiatusWeeks: 4 },
  ];

  // Selected Channel Object
  const currentChannelObj = CHANNELS.find(c => c.id === selectedChannel) || CHANNELS[0];

  // Multi-scenario promotions
  const scenarioPromos = useMemo(() => {
    if (activeScenario === 'baseline') return promotions;
    return generateScenarioPlan(products, activeScenario);
  }, [promotions, products, activeScenario]);

  // Current scenario KPIs
  const currentKPIs = useMemo(() => {
    return calculateStrategyKPIs(scenarioPromos, products);
  }, [scenarioPromos, products]);

  // Baseline KPIs for comparison
  const baselineKPIs = useMemo(() => {
    return calculateStrategyKPIs(promotions, products);
  }, [promotions, products]);

  // ACCC compliance audit
  const acccAudit = useMemo(() => {
    return auditAcccCompliance(scenarioPromos, products);
  }, [scenarioPromos, products]);

  // Selected sample product for live interactive sandbox
  const sampleProduct = useMemo(() => {
    return products[0] || {
      sku: 'SKU-SAMPLE-101',
      name: 'Sample Brand Hero SKU 500g',
      category: 'Grocery & FMCG',
      subcategory: 'Pantry Essentials',
      rrp: 12.00,
      cost: 5.50,
      marginPercent: 54.2,
      weeklyUnitsBaseline: 450,
      performanceTier: 'tier1_hero',
      seasonalPeak: 'All Year',
      targetWeeks: [4, 18, 26, 42, 50],
      tags: ['Hero', 'Core Range'],
      stockLevel: 4500,
      minPromoGapWeeks: 4
    };
  }, [products]);

  // Real-time Net Margin & Dead Net Cost Calculation
  const livePromoPrice = Number((sampleProduct.rrp * (1 - interactiveDiscountDepth / 100)).toFixed(2));
  const liveDeadNet = useMemo(() => {
    return calculateDeadNetCost(sampleProduct, livePromoPrice, interactiveScanRebateAud, 2.5, 0.25);
  }, [sampleProduct, livePromoPrice, interactiveScanRebateAud]);

  // Margin Safety Floor live status
  const isMarginSafe = liveDeadNet.supplierMarginPercent >= marginFloorThreshold;
  const isMarginAtRisk = liveDeadNet.supplierMarginPercent < marginFloorThreshold && liveDeadNet.supplierMarginPercent >= (marginFloorThreshold - 6);
  const isMarginViolated = liveDeadNet.supplierMarginPercent < (marginFloorThreshold - 6);

  // Handle scenario switch
  const handleSelectScenario = (sc: ScenarioType) => {
    setActiveScenario(sc);
    const newPlan = generateScenarioPlan(products, sc);
    onUpdatePromotions(newPlan);
    showToast(`Activated ${sc === 'baseline' ? 'Standard Baseline Plan' : sc === 'volume_growth' ? 'Scenario A: Aggressive Growth & Volume' : 'Scenario B: Margin Maximizer & Profit Focus'}`, 'info');
  };

  // Handle Strategy Lock (Step 5)
  const handleLockStrategy = () => {
    setIsStrategyLocked(true);
    setShowCelebration(true);
    const now = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setLockedTimestamp(now);
    showToast('Commercial 52-Week Strategy successfully locked and baseline saved!', 'success');
    setTimeout(() => {
      setShowCelebration(false);
    }, 4500);
  };

  // Load sample Australian FMCG products if catalog is empty
  const handleLoadSampleCatalog = () => {
    const SAMPLE_RANGE: Product[] = [
      {
        sku: 'SKU-AUS-001',
        name: 'Organic Australian Native Honey 500g',
        category: 'Grocery & FMCG',
        subcategory: 'Pantry & Spreads',
        rrp: 14.50,
        cost: 6.20,
        marginPercent: 57.2,
        weeklyUnitsBaseline: 620,
        performanceTier: 'tier1_hero',
        seasonalPeak: 'Winter Warmers / Autumn',
        targetWeeks: [4, 12, 20, 26, 36, 48],
        tags: ['Hero SKU', 'Australian Made', 'Pantry'],
        stockLevel: 12000,
        minPromoGapWeeks: 4
      },
      {
        sku: 'SKU-AUS-002',
        name: 'Artisan Sourdough Crisps Olive Oil & Sea Salt 175g',
        category: 'Grocery & FMCG',
        subcategory: 'Snacking & Entertaining',
        rrp: 6.50,
        cost: 2.80,
        marginPercent: 56.9,
        weeklyUnitsBaseline: 1100,
        performanceTier: 'tier1_hero',
        seasonalPeak: 'Summer & Footy Finals',
        targetWeeks: [4, 16, 26, 38, 44, 51],
        tags: ['Entertaining', 'High Velocity', 'Snack'],
        stockLevel: 25000,
        minPromoGapWeeks: 4
      },
      {
        sku: 'SKU-AUS-003',
        name: 'Sparkling Cold Brew Botanical Tea 4x330ml',
        category: 'Grocery & FMCG',
        subcategory: 'Beverages & Sodas',
        rrp: 11.00,
        cost: 4.80,
        marginPercent: 56.4,
        weeklyUnitsBaseline: 480,
        performanceTier: 'tier2_margin',
        seasonalPeak: 'Summer / Australia Day',
        targetWeeks: [2, 6, 18, 42, 50],
        tags: ['Beverage', 'Summer Hero', '4-Pack'],
        stockLevel: 8500,
        minPromoGapWeeks: 4
      },
      {
        sku: 'SKU-AUS-004',
        name: 'Pure Plant Protein Bar Salted Caramel 60g',
        category: 'Health & Wellness',
        subcategory: 'Active Nutrition',
        rrp: 4.50,
        cost: 1.75,
        marginPercent: 61.1,
        weeklyUnitsBaseline: 1450,
        performanceTier: 'tier1_hero',
        seasonalPeak: 'New Year / Back-to-Gym',
        targetWeeks: [1, 3, 14, 22, 34, 46],
        tags: ['On-The-Go', 'Healthy Snack', 'High Repeat'],
        stockLevel: 32000,
        minPromoGapWeeks: 4
      }
    ];

    onImportProducts(SAMPLE_RANGE);
    const newPlan = generateScenarioPlan(SAMPLE_RANGE, activeScenario);
    onUpdatePromotions(newPlan);
    showToast('Loaded 4 Australian sample FMCG SKUs into your master canvas!', 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* ----------------------------------------------------
          1. EMOTIVE BRAND BANNER: CALM & PRECISION
      ---------------------------------------------------- */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden backdrop-blur-xl shadow-2xl transition-all ${
        isLight 
          ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border-blue-900/40' 
          : 'bg-gradient-to-br from-slate-950 via-[#0F172A] to-slate-950 text-white border-slate-800'
      }`}>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>RangeCraft Commercial Strategy Journey</span>
              <span className="opacity-40">•</span>
              <span className="text-white">Certainty & Growth</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Trade Strategy Built on Certainty, Growth Driven by Calm.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              Step into every retail negotiation knowing your margins are protected, your compliance is absolute, and your strategy is unassailable. Follow this sequential 5-step funnel to master your annual commercial plan.
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex flex-row lg:flex-col gap-3 shrink-0">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3.5 min-w-[140px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Projected Sales</div>
              <div className="text-xl font-mono font-black text-emerald-400">
                {formatAud(currentKPIs.annualProjectedRevenueAud)}
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3.5 min-w-[140px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">ACCC Compliance</div>
              <div className="flex items-center gap-1.5 text-xl font-mono font-black text-blue-400">
                <span>{acccAudit.score}%</span>
                {acccAudit.score >= 95 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          2. SEQUENTIAL 5-STEP FUNNEL NAVIGATOR
      ---------------------------------------------------- */}
      <div className={`p-4 sm:p-5 rounded-3xl border ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { 
              step: 1, 
              title: '1. Channel & Setup', 
              desc: 'Select banner & baseline SKUs',
              badge: currentChannelObj.name.split(' ')[0]
            },
            { 
              step: 2, 
              title: '2. Trade Canvas & Margin', 
              desc: '52-week plan & safety floor',
              badge: `${marginFloorThreshold}% Floor`
            },
            { 
              step: 3, 
              title: '3. ACCC Risk Guardrail', 
              desc: '4-Week hiatus audit & fix',
              badge: acccAudit.score === 100 ? '100% Compliant' : `${acccAudit.violations.length} Clash`
            },
            { 
              step: 4, 
              title: '4. Executive JBP Deck', 
              desc: 'Commercial presentation',
              badge: 'Export Ready'
            },
            { 
              step: 5, 
              title: '5. Lock & Convert', 
              desc: 'Lock baseline & export',
              badge: isStrategyLocked ? 'Locked' : 'Action Required'
            },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step || isStrategyLocked;

            return (
              <button
                key={item.step}
                onClick={() => setCurrentStep(item.step)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30 scale-[1.02]' 
                    : isCompleted
                      ? isLight ? 'bg-blue-50/70 border-blue-200 text-slate-800' : 'bg-slate-950/70 border-slate-800 text-slate-300'
                      : isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/40 border-slate-900 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    Step {item.step} of 5
                  </span>
                  {isCompleted && !isActive && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                  )}
                </div>

                <div>
                  <div className="font-bold text-xs sm:text-sm">{item.title}</div>
                  <div className={`text-[11px] leading-tight ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {item.desc}
                  </div>
                </div>

                <div className="pt-1">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md inline-block ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------
          3. ACTIVE STEP CONTENT SWITCHER
      ---------------------------------------------------- */}

      {/* STEP 1: ONBOARDING & ACCOUNT SETUP */}
      {currentStep === 1 && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-500 mb-1">
                <Building2 className="w-4 h-4" />
                <span>STEP 1: CHANNEL CONFIGURATION & SKU BASELINE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                Select Target Retailer Channel & Load Product Baseline
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Every Australian retail banner enforces unique margin hurdle rates and promotional hiatus rules.
              </p>
            </div>

            <button
              onClick={handleLoadSampleCatalog}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Sample FMCG Catalog</span>
            </button>
          </div>

          {/* Retailer Channel Selection Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Choose Retailer Banner / Commercial Account
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CHANNELS.map((ch) => {
                const isSelected = selectedChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-500 shadow-md ring-2 ring-blue-500/30' 
                        : isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-950 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{ch.icon}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800/60 text-slate-300">
                        {ch.type}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{ch.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Target Margin: <strong>{ch.minMargin}%</strong> • Hiatus: <strong>{ch.hiatusWeeks} wks</strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Baseline Upload & Current Catalog Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Instant Range Upload (CSV / Excel)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload your master SKU price file including SKU codes, unit COGS, recommended retail price (RRP), and baseline run-rate.
              </p>
              
              <div 
                onClick={() => onNavigateTab('catalog')}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-900/40 group"
              >
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
                <div className="text-xs font-bold text-white">Click to Import CSV Range</div>
                <div className="text-[10px] text-slate-400 mt-1">Supports UTF-8 CSV, XLSX from SAP, NetSuite, Pronto</div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>Loaded Product Portfolio ({products.length} SKUs)</span>
                </h3>
                <button
                  onClick={() => onNavigateTab('catalog')}
                  className="text-xs text-blue-400 hover:underline font-bold"
                >
                  Manage SKUs →
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No SKUs currently loaded. Click "Load Sample FMCG Catalog" above or import your CSV.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {products.slice(0, 4).map((p, idx) => (
                    <div key={`funnel-sku-${p.sku}-${idx}`} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white truncate max-w-[200px]">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.sku} • RRP: ${p.rrp.toFixed(2)} • Cost: ${p.cost.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          {p.marginPercent.toFixed(1)}% Margin
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 1 Next Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Continue to Trade Canvas & Margin Floor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: INTERACTIVE PROMOTIONAL & TRADE SPEND CANVAS */}
      {currentStep === 2 && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-500 mb-1">
                <SlidersHorizontal className="w-4 h-4" />
                <span>STEP 2: 52-WEEK TRADE CANVAS & LIVE MARGIN SAFETY FLOOR</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                Model Scenarios & Guard Your Margin Safety Floor
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Toggle multi-scenario models in real-time and observe exact supplier vs. retailer net margins.
              </p>
            </div>

            {/* Multi-Scenario Switcher */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
              {[
                { id: 'baseline', label: 'Baseline Plan', badge: 'Balanced' },
                { id: 'volume_growth', label: 'Scenario A: Volume Grab', badge: 'High Lift' },
                { id: 'margin_maximizer', label: 'Scenario B: Margin Focus', badge: 'Max Profit' },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc.id as ScenarioType)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeScenario === sc.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{sc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Margin Safety Floor Gauge & Sandbox */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Live Interactive Slider Controls */}
            <div className={`p-6 rounded-2xl border space-y-5 lg:col-span-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                  <span>Sandbox Controls</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Live Recalculation</span>
              </div>

              {/* Sample SKU Selected */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Tested SKU</div>
                <div className="text-xs font-bold text-white truncate">{sampleProduct.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  RRP: ${sampleProduct.rrp.toFixed(2)} • COGS: ${sampleProduct.cost.toFixed(2)}
                </div>
              </div>

              {/* Slider 1: Discount Depth % */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Promotional Discount Depth</span>
                  <span className="font-mono font-bold text-amber-400">{interactiveDiscountDepth}% Off</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={interactiveDiscountDepth}
                  onChange={(e) => setInteractiveDiscountDepth(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>5% (Light Feature)</span>
                  <span>25% (Standard)</span>
                  <span>50% (1/2 Price)</span>
                </div>
              </div>

              {/* Slider 2: Vendor Scan Rebate */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <FmcgTooltip termKey="scan-rebate">
                    <span className="font-semibold text-slate-300">Supplier Scan Rebate</span>
                  </FmcgTooltip>
                  <span className="font-mono font-bold text-blue-400">${interactiveScanRebateAud.toFixed(2)} / unit</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.25"
                  value={interactiveScanRebateAud}
                  onChange={(e) => setInteractiveScanRebateAud(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Slider 3: Minimum Margin Floor */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <FmcgTooltip termKey="margin-safety-floor">
                    <span className="font-semibold text-slate-300">Margin Safety Floor</span>
                  </FmcgTooltip>
                  <span className="font-mono font-bold text-emerald-400">{marginFloorThreshold}% Min</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  step="1"
                  value={marginFloorThreshold}
                  onChange={(e) => setMarginFloorThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Right Column: Margin Floor Gauge & Commercial Waterfall Breakdown */}
            <div className={`p-6 rounded-2xl border space-y-6 lg:col-span-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Margin Safety Floor Gauge</span>
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                  isMarginSafe 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : isMarginAtRisk
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {isMarginSafe ? 'SAFE (Above Floor)' : isMarginAtRisk ? 'AT RISK (Near Floor)' : 'VIOLATION (Dilutive)'}
                </span>
              </div>

              {/* Visual Margin Comparison Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Promo Retail Price</div>
                  <div className="text-2xl font-black font-mono text-white mt-1">
                    ${livePromoPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Save ${ (sampleProduct.rrp - livePromoPrice).toFixed(2) } ({interactiveDiscountDepth}%)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    <FmcgTooltip termKey="dead-net-cost">Dead Net Cost to Buyer</FmcgTooltip>
                  </div>
                  <div className="text-2xl font-black font-mono text-blue-400 mt-1">
                    ${liveDeadNet.deadNetCostAud.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Retailer Margin: <strong>{liveDeadNet.retailerMarginPercent.toFixed(1)}%</strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Supplier Promo Margin</div>
                  <div className={`text-2xl font-black font-mono mt-1 ${
                    isMarginSafe ? 'text-emerald-400' : isMarginAtRisk ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {liveDeadNet.supplierMarginPercent.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Floor: <strong>{marginFloorThreshold}%</strong> (Δ {(liveDeadNet.supplierMarginPercent - marginFloorThreshold).toFixed(1)}%)
                  </div>
                </div>
              </div>

              {/* Trade Spend Step Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Unit Profit & Trade Spend Bridge
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Invoice Cost</span>
                    <span className="font-bold text-white">${liveDeadNet.listInvoiceCostAud.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Scan Funding</span>
                    <span className="font-bold text-rose-400">-${liveDeadNet.scanRebateAud.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Settlement (2.5%)</span>
                    <span className="font-bold text-rose-400">-${liveDeadNet.settlementDiscountAud.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Net Unit Margin $</span>
                    <span className="font-bold text-emerald-400">${liveDeadNet.supplierNetProfitAud.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
            >
              ← Back to Step 1
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Continue to ACCC Compliance Guardrail</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AUTOMATED ACCC COMPLIANCE & RISK GUARDRAIL */}
      {currentStep === 3 && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-500 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>STEP 3: AUTOMATED ACCC 4-WEEK HIATUS & CLASH GUARDRAIL</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                ACCC Hiatus Compliance Audit & Risk Resolution
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Under Australian retail pricing standards, promotional discounts require a 4-week regular price hiatus.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onAutoFixClashes();
                  showToast('Auto-reslotted conflicting weeks to achieve 100% ACCC compliance!', 'success');
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 cursor-pointer transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>1-Click Auto-Reslot & Fix Clashes</span>
              </button>
            </div>
          </div>

          {/* Compliance Score Gauge & Audit Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl border text-center space-y-3 ${
              acccAudit.score >= 95 
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
            }`}>
              <div className="text-xs font-bold uppercase tracking-wider">ACCC Compliance Score</div>
              <div className="text-5xl font-black font-mono">
                {acccAudit.score}%
              </div>
              <div className="text-xs font-semibold">
                {acccAudit.score === 100 
                  ? '✓ 100% Compliant with Retail Standards' 
                  : `⚠️ ${acccAudit.violations.length} Hiatus Conflicts Detected`}
              </div>
            </div>

            <div className={`p-6 rounded-2xl border lg:col-span-2 space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <span>Compliance Audit Checklist</span>
              </h3>
              <div className="space-y-2 text-xs">
                {acccAudit.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Violation Details List */}
          {acccAudit.violations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Detected Hiatus & Frequency Breaches
              </h3>
              <div className="space-y-2">
                {acccAudit.violations.map((v, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white">{v.skuName}</div>
                        <div className="text-amber-300 text-[11px]">{v.message}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      Gap: {v.gapWeeks} wks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
            >
              ← Back to Step 2
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Continue to One-Click Commercial JBP Deck</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: ONE-CLICK COMMERCIAL DECK & BUSINESS CASE GENERATION */}
      {currentStep === 4 && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-500 mb-1">
                <FileText className="w-4 h-4" />
                <span>STEP 4: EXECUTIVE JBP PITCH DECK & BUSINESS CASE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                Executive JBP Pitch Presentation & Commercial Review
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Formatted specifically for Australian category buyers, commercial directors, and joint business reviews.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigateTab('executive-briefing')}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 cursor-pointer transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Open Full Executive Deck View</span>
              </button>
            </div>
          </div>

          {/* JBP Summary Deck Card Preview */}
          <div className={`p-6 rounded-2xl border space-y-6 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                  Joint Business Planning (JBP) FY27
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  52-Week Category Promotional Growth Proposal
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Target Account: {currentChannelObj.name}
              </span>
            </div>

            {/* Commercial Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Proposed Turnover</span>
                <div className="text-xl font-mono font-black text-white mt-1">
                  {formatAud(currentKPIs.annualProjectedRevenueAud)}
                </div>
                <span className="text-[10px] text-emerald-400">+{currentKPIs.overallLiftPercent}% Vol Lift</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Trade Investment</span>
                <div className="text-xl font-mono font-black text-amber-400 mt-1">
                  {formatAud(currentKPIs.totalTradeSpendCoOpAud)}
                </div>
                <span className="text-[10px] text-slate-400">Scan + Co-Op Spend</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Retailer Blended Margin</span>
                <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                  {currentKPIs.blendedPromoMarginPercent}%
                </div>
                <span className="text-[10px] text-emerald-400">Exceeds {currentChannelObj.minMargin}% Hurdle</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">ACCC Compliance Status</span>
                <div className="text-xl font-mono font-black text-blue-400 mt-1">
                  {acccAudit.score}% Certified
                </div>
                <span className="text-[10px] text-emerald-400">4-Week Hiatus Passed</span>
              </div>
            </div>
          </div>

          {/* Step 4 Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
            >
              ← Back to Step 3
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Continue to Step 5: Lock & Convert</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CONVERSION & RETENTION TRIGGERS */}
      {currentStep === 5 && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`}>
          {/* Confetti / Celebration Visual Overlay */}
          {showCelebration && (
            <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-sm z-20 flex items-center justify-center animate-fade-in pointer-events-none">
              <div className="text-center p-8 rounded-3xl bg-slate-900 border border-blue-500 shadow-2xl space-y-3">
                <Sparkles className="w-12 h-12 text-amber-300 mx-auto animate-bounce" />
                <h3 className="text-2xl font-black text-white">Commercial Calendar Locked!</h3>
                <p className="text-sm text-slate-300">Baseline saved. You are ready to present with absolute confidence.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>STEP 5: STRATEGY LOCK & RETENTION ENGINE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                Lock In Commercial Strategy & Finalize Presentation
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Locking preserves your baseline comparisons, generates executive PDF certificates, and activates real-time variance tracking.
              </p>
            </div>

            {isStrategyLocked && (
              <span className="px-4 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>LOCKED ON {lockedTimestamp}</span>
              </span>
            )}
          </div>

          {/* Strategy Lock Hero Card */}
          <div className={`p-6 sm:p-8 rounded-2xl border text-center space-y-6 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              {isStrategyLocked ? <Lock className="w-8 h-8" /> : <Sparkles className="w-8 h-8 text-amber-400" />}
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-xl font-black text-white">
                {isStrategyLocked 
                  ? 'Your 52-Week Master Commercial Strategy is Active & Locked' 
                  : 'Ready to Lock In Commercial Strategy?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {isStrategyLocked 
                  ? 'All promotional mechanics, scan rebate allowances, and ACCC hiatus guardrails are locked into your baseline registry.' 
                  : 'Click below to lock in your strategy, establish your baseline revenue hurdle, and enable PDF exports.'}
              </p>
            </div>

            {/* Lock Action Button */}
            {!isStrategyLocked ? (
              <button
                id="lock-commercial-strategy-btn"
                onClick={handleLockStrategy}
                className="px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-2xl shadow-emerald-600/40 hover:scale-105 active:scale-100 transition-all flex items-center justify-center gap-3 cursor-pointer mx-auto"
              >
                <Lock className="w-5 h-5 text-emerald-200" />
                <span>Save & Lock 52-Week Commercial Strategy</span>
                <Sparkles className="w-5 h-5 text-amber-300" />
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => onNavigateTab('executive-briefing')}
                  className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Executive JBP Presentation (PDF)</span>
                </button>
                <button
                  onClick={() => onNavigateTab('calendar')}
                  className="px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>View 52-Week Live Calendar Grid</span>
                </button>
              </div>
            )}
          </div>

          {/* Step 5 Navigation Back */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
            >
              ← Back to Step 4
            </button>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs text-blue-400 hover:underline font-bold"
            >
              Go to Full 52-Week Calendar Master View →
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
