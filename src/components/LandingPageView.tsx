import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  BarChart3, 
  Search, 
  Flame, 
  FileText, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  DollarSign, 
  Percent, 
  ChevronRight,
  Sliders,
  Award,
  Lock,
  ArrowUpRight,
  LayoutGrid,
  Building2,
  Users,
  Target,
  Clock,
  HelpCircle,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  Play,
  Globe,
  SlidersHorizontal,
  FileCheck,
  LineChart,
  PieChart,
  Cpu,
  Check,
  Package,
  SlidersVertical
} from 'lucide-react';
import { StrategyKPIs, ThemeMode, UserProfile } from '../types';
import { SEOHead } from './SEOHead';
import { useActiveCurrency } from '../utils/currency';
import heroStrategyImg from '../assets/images/retail_strategy_hero_1786764754582.jpg';

interface LandingPageViewProps {
  kpis: StrategyKPIs;
  currentTheme: ThemeMode;
  user: UserProfile | null;
  onNavigateTab: (tab: 'overview' | 'calendar' | 'week-studio' | 'catalog' | 'analytics' | 'market-intel' | 'clashes' | 'executive-briefing' | 'activity-log' | 'crm') => void;
  onOpenAiOptimizer: () => void;
  onOpenUploadModal: () => void;
  onAutoFixClashes: () => void;
  onOpenAuthModal: () => void;
  onOpenPricingModal: () => void;
  onOpenAboutModal?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  kpis,
  currentTheme,
  user,
  onNavigateTab,
  onOpenAiOptimizer,
  onOpenUploadModal,
  onAutoFixClashes,
  onOpenAuthModal,
  onOpenPricingModal,
  onOpenAboutModal,
}) => {
  const isLight = currentTheme.includes('light');
  const { currency, format, getTierPrice } = useActiveCurrency();

  // Interactive Live ROI & Margin Simulator State
  const [testRevenueTarget, setTestRevenueTarget] = useState<number>(350000);
  const [testDiscountDepth, setTestDiscountDepth] = useState<number>(25);
  const [testScanRebatePercent, setTestScanRebatePercent] = useState<number>(10);
  const [testVolumeLiftMultiplier, setTestVolumeLiftMultiplier] = useState<number>(2.4);
  const [selectedPersonaTab, setSelectedPersonaTab] = useState<'fmcg' | 'buyers' | 'distributors' | 'ecommerce'>('fmcg');
  const [activeFaqCategory, setActiveFaqCategory] = useState<'accc' | 'rebates' | 'exports'>('accc');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activePreviewTab, setActivePreviewTab] = useState<'timeline' | 'clashes' | 'rebates' | 'ai'>('timeline');

  // Computed Live Sandbox figures
  const simulatedBaselineMargin = 42.5;
  const simulatedPromoMargin = Math.max(14, simulatedBaselineMargin - (testDiscountDepth * 0.65) + (testScanRebatePercent * 0.6));
  const simulatedIncrementalGrossProfit = Math.round((testRevenueTarget * (testVolumeLiftMultiplier - 1)) * (simulatedPromoMargin / 100));

  const FAQ_GROUPS = {
    accc: {
      title: 'ACCC Hiatus Rules & Legal Compliance',
      items: [
        {
          q: "What is the Australian ACCC 4-Week Hiatus Rule, and how does RangeCraft enforce it?",
          a: "Under Australian Competition and Consumer Commission (ACCC) retail pricing standards and supermarket codes of conduct, promotional price reductions must follow an uninterrupted 'normal price' hiatus window (typically 4 consecutive weeks) to ensure advertised discounts are genuine. RangeCraft automatically audits all 52 weeks across your SKU catalog, highlighting non-compliant promotions and auto-reslotting conflicting weeks with 1-click."
        },
        {
          q: "How does RangeCraft prevent supermarket buyer pushback on promotional gaps?",
          a: "RangeCraft models category-level density and competitor gap weeks so you can present compliant promotional schedules that satisfy retailer promotional slotting requirements without breaching ACCC regulations."
        },
        {
          q: "Does RangeCraft store an audit trail of compliance changes?",
          a: "Yes. Every calendar reslot, margin adjustment, and ACCC resolution is logged into an immutable activity log complete with user timestamps, ready for legal or commercial review."
        }
      ]
    },
    rebates: {
      title: 'Scan Rebates & Commercial Profitability',
      items: [
        {
          q: "How does RangeCraft calculate Supplier Scan Rebates vs Retail Gross Margin?",
          a: "RangeCraft separates baseline wholesale dead net costs from promotional scan rebates funded per unit scanned at supermarket checkout. This delivers crystal-clear visibility into effective post-rebate profitability and prevents margin leakage during high-volume sales peaks."
        },
        {
          q: "Can I simulate multi-tier scan rebates for different supermarket chains?",
          a: "Yes. RangeCraft allows you to customize separate trading terms, co-op promotional contributions, and scan rebates for individual retailers (e.g. Coles, Woolworths, Metcash, and Pharmacy networks)."
        },
        {
          q: "How does volume elasticity affect my final margin?",
          a: "Our financial simulator accounts for volume lift multipliers, baseline cannibalization, and fixed catalogue participation fees to show you true net profit rather than misleading top-line revenue."
        }
      ]
    },
    exports: {
      title: 'Data Ingestion & Executive Deck Exports',
      items: [
        {
          q: "Can I import my own custom SKU range and unit costs via CSV?",
          a: "Yes. You can drag and drop any CSV product catalog with SKU codes, product descriptions, standard unit costs, and baseline RRP. Our intelligent schema mapper recognizes your columns immediately."
        },
        {
          q: "What export formats are supported for Joint Business Planning (JBP)?",
          a: "Commercial Pro and Enterprise plans allow un-watermarked 1-click exports to Microsoft PowerPoint (PPTX), PDF presentation decks, and formatted Excel (XLSX/CSV) sheets tailored to Australian retail category review formats."
        },
        {
          q: "How does the 'Reverse Free Trial' work?",
          a: "You receive 14 days of full Commercial Pro access with no credit card required upfront. If you choose not to upgrade, your account automatically transitions to our Free Forever Sandbox with no data loss."
        }
      ]
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      isLight ? 'bg-[#fcfdfd] text-slate-900' : 'bg-[#0b0f19] text-slate-100'
    }`}>
      <SEOHead />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient Subtle Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[540px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/15 via-blue-600/10 to-transparent pointer-events-none -z-10" />

        {/* Top Trust Pill */}
        <div className="flex justify-center mb-6">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl border shadow-xs ${
            isLight 
              ? 'bg-indigo-50/90 text-indigo-700 border-indigo-200/80' 
              : 'bg-slate-900/80 text-indigo-300 border-indigo-500/30'
          }`}>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">🇦🇺 Australia’s Retail Promotional & SKU Strategy Suite</span>
            <span className="opacity-30">•</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-bold">100% ACCC Hiatus Compliant</span>
          </div>
        </div>

        {/* Primary Headline & Copy */}
        <div className="text-center max-w-4xl mx-auto space-y-5">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
            Protect Margins & Enforce 100% ACCC Compliance Across 52-Week Retail Schedules
          </h1>

          <p className={`text-base sm:text-lg max-w-3xl mx-auto font-normal leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}>
            Step into every retail negotiation knowing your margins are protected, your compliance is absolute, and your strategy is unassailable. Drop in your product range—we’ll take care of the math, scan rebates, ACCC hiatus guardrails, and 52-week JBP decks.
          </p>

          {/* Primary CTA Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              id="hero-primary-trial-cta"
              onClick={onOpenPricingModal}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <Zap className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="hero-secondary-sandbox-cta"
              onClick={() => scrollToSection('roi-demonstrator-section')}
              className={`w-full sm:w-auto px-6 py-4 rounded-2xl border font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50' 
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>Try Interactive Sandbox</span>
            </button>
          </div>

          {/* Clean Trust Micro-Copy Badges */}
          <div className="pt-2 flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              14-Day Pro Access Included
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              100% ACCC Hiatus Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Australian Supermarket Ready
            </span>
          </div>
        </div>

        {/* Live Commercial KPIs Bar */}
        <div className={`mt-12 p-6 sm:p-8 rounded-3xl border shadow-xl backdrop-blur-xl grid grid-cols-2 md:grid-cols-4 gap-6 ${
          isLight ? 'bg-white/90 border-slate-200' : 'bg-[#111726]/90 border-[#1f2b42]'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">52W Forecast Volume</div>
              <div className="text-lg sm:text-xl font-black font-mono text-emerald-400">
                {format(kpis?.annualProjectedRevenueAud || 485000)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Percent className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Blended Trade Margin</div>
              <div className="text-lg sm:text-xl font-black font-mono text-indigo-400">
                {kpis?.blendedPromoMarginPercent ?? 34.2}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Promoted Units</div>
              <div className="text-lg sm:text-xl font-black font-mono text-amber-400">
                {((kpis?.annualPromotedUnits || 124000) / 1000).toFixed(1)}k units
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">ACCC 4-Week Hiatus</div>
              <div className="text-sm sm:text-base font-black text-emerald-400 flex items-center gap-1">
                <span>100% Audit Safe</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE LIVE ROI & MARGIN SIMULATOR                                */}
      {/* ========================================================================= */}
      <section 
        id="roi-demonstrator-section"
        className={`py-20 px-4 sm:px-6 lg:px-8 border-y transition-colors duration-300 ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#0d121e] border-[#182338]'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Interactive ROI Value Demonstrator
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Test Your Brand's Margin Lift in Real Time ({currency})
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Adjust baseline revenue, discount depth, and supplier scan rebates to model net gross margin and incremental profit capture in your local currency.
            </p>
          </div>

          <div className={`p-6 sm:p-10 rounded-3xl border shadow-xl max-w-5xl mx-auto ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
          }`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Controls Column */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-semibold mb-2">
                    <span className="text-slate-400">Quarterly Target Baseline:</span>
                    <span className="font-mono text-emerald-400 font-bold">{format(testRevenueTarget)}</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="1000000"
                    step="25000"
                    value={testRevenueTarget}
                    onChange={(e) => setTestRevenueTarget(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{format(50000)}</span>
                    <span>{format(500000)}</span>
                    <span>{format(1000000)}+</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-semibold mb-2">
                    <span className="text-slate-400">Promotional Discount Depth:</span>
                    <span className="font-mono text-indigo-400 font-bold">{testDiscountDepth}% Off RRP</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={testDiscountDepth}
                    onChange={(e) => setTestDiscountDepth(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>10% (Minor Feature)</span>
                    <span>25% (Catalogue Feature)</span>
                    <span>50% (Half-Price Front Page)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-semibold mb-2">
                    <span className="text-slate-400">Supplier Scan Rebate Offset:</span>
                    <span className="font-mono text-purple-400 font-bold">{testScanRebatePercent}% Funded</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="2.5"
                    value={testScanRebatePercent}
                    onChange={(e) => setTestScanRebatePercent(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-semibold mb-2">
                    <span className="text-slate-400">Volume Lift Multiplier:</span>
                    <span className="font-mono text-amber-400 font-bold">{testVolumeLiftMultiplier}x Baseline</span>
                  </div>
                  <input
                    type="range"
                    min="1.2"
                    max="4.0"
                    step="0.1"
                    value={testVolumeLiftMultiplier}
                    onChange={(e) => setTestVolumeLiftMultiplier(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* High CTR Projected Outcome Card */}
              <div className={`lg:col-span-5 p-7 rounded-2xl border text-center space-y-4 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Projected Incremental Margin Gain
                </div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                  +{format(simulatedIncrementalGrossProfit)}
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-left pt-2 border-t border-slate-800/80 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Effective Promo Margin</span>
                    <span className="font-bold text-indigo-400 font-mono text-sm">{simulatedPromoMargin.toFixed(1)}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">ACCC 4-Week Hiatus</span>
                    <span className="font-bold text-emerald-400 text-sm">Protected</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onOpenPricingModal}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Start 14-Day Free Pro Access</span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Instant access to full 52-week scheduling and un-watermarked exports.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THE 5 CORE ENGINES (STRUCTURED 3x2 FEATURE GRID)                        */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
            <Layers className="w-3.5 h-3.5" />
            Unified Product Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            The 5 Engines of RangeCraft
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Everything FMCG Key Account Managers, Commercial Directors, and Brands need to audit, simulate, schedule, and present high-margin trade strategies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Engine 1 */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all hover:border-indigo-500/50 hover:shadow-xl flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
          }`}>
            <div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">52-Week Master Grid</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Interactive drag-and-drop promotional calendar featuring Australian retail holiday milestones, category density tracking, and live revenue calculations.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between cursor-pointer"
            >
              <span>Launch 52-Week Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Engine 2 */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all hover:border-emerald-500/50 hover:shadow-xl flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
          }`}>
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">ACCC Hiatus Compliance Radar</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Real-time scanner enforcing the Australian 4-week hiatus standard with 1-click automated reslotting to eliminate legal liability.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('clashes')}
              className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-between cursor-pointer"
            >
              <span>Inspect Clash Radar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Engine 3 */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all hover:border-amber-500/50 hover:shadow-xl flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
          }`}>
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">Trade Spend & Scan Rebates</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Quantify scan rebate leakage, model baseline wholesale margins, and simulate incremental unit volume lift across every SKU.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center justify-between cursor-pointer"
            >
              <span>View Financial Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Engine 4 */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all hover:border-purple-500/50 hover:shadow-xl flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
          }`}>
            <div>
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">Gemini AI Scenario Strategist</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Google Gemini AI analyzes your SKU catalog, predicts competitor promotional response, and auto-generates optimized 52-week schedules.
              </p>
            </div>
            <button
              onClick={onOpenAiOptimizer}
              className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-between cursor-pointer"
            >
              <span>Launch AI Strategist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Engine 5 */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all hover:border-blue-500/50 hover:shadow-xl flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
          }`}>
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">Omni-Trade B2B CRM Pipeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Manage retail buyer accounts, deal stages, trading terms agreements, and scan rebate contracts in one centralized hub.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('crm')}
              className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between cursor-pointer"
            >
              <span>Explore Omni-Trade CRM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Engine 6: JBP Deck Export Suite */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all hover:border-cyan-500/50 hover:shadow-xl flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
          }`}>
            <div>
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">Executive JBP Review Exporter</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                1-Click export of formatted PowerPoint/PDF presentations, CSV trade sheets, and buyer summary documents ready for national retail partner reviews.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('executive-briefing')}
              className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-between cursor-pointer"
            >
              <span>View Executive Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TRANSPARENT PRICING & REVERSE FREE TRIAL TIERS                         */}
      {/* ========================================================================= */}
      <section 
        id="pricing-section"
        className={`py-20 px-4 sm:px-6 lg:px-8 border-y transition-colors duration-300 ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#0d121e] border-[#182338]'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
              <DollarSign className="w-3.5 h-3.5" />
              Standardized Multi-Currency Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Reverse Free Trial • Start with Full Pro Power
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Enjoy 14 days of unrestricted Commercial Pro access. No credit card required upfront. Automatically degrades to Free Forever sandbox if not upgraded.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Free Forever */}
            <div className={`p-7 rounded-3xl border flex flex-col justify-between transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
            }`}>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Audit & Sandbox Tier</div>
                <h3 className="text-xl font-bold">Free Forever</h3>
                <div className="mt-3 mb-5">
                  <span className="text-3xl sm:text-4xl font-black font-mono">{format(0)}</span>
                  <span className="text-xs text-slate-400 ml-1">/ month ({currency})</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-400 mb-6">
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1 SKU Intake & Catalog sandbox</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Q1 & Q2 Promotional Calendar Previews</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Basic ACCC 4-week hiatus warnings</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1 Gemini AI Strategy Run / month</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <span className="text-slate-600">•</span>
                    <span>Watermarked PDF exports</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onNavigateTab('catalog')}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Use Free Sandbox
              </button>
            </div>

            {/* Commercial Pro (Reverse Trial Hero) */}
            <div className="p-7 rounded-3xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-950/60 via-[#111827] to-blue-950/60 shadow-2xl relative flex flex-col justify-between transform lg:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-[10px] uppercase tracking-wider shadow-md">
                14-Day Free Access Included
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">Brand Reps & KAMs</div>
                <h3 className="text-xl font-bold text-white">Commercial Pro</h3>
                <div className="mt-3 mb-5">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-indigo-400">{format(149)}</span>
                  <span className="text-xs text-slate-300 ml-1">/ month ({currency})</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-200 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Full 52-Week Promotional Master Grid</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Automated ACCC Hiatus 1-Click Auto-Reslot</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited Gemini AI Strategy Scenarios</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Un-watermarked PPTX, PDF & XLSX Exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Full Omni-Trade B2B CRM & Terms Tracker</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenPricingModal}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 cursor-pointer transition-all hover:scale-105"
              >
                Start 14-Day Free Pro Trial
              </button>
            </div>

            {/* Enterprise Suite */}
            <div className={`p-7 rounded-3xl border flex flex-col justify-between transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
            }`}>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Multi-Brand & Enterprise</div>
                <h3 className="text-xl font-bold">Enterprise Suite</h3>
                <div className="mt-3 mb-5">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-blue-400">{format(399)}</span>
                  <span className="text-xs text-slate-400 ml-1">/ month ({currency})</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-400 mb-6">
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Everything in Commercial Pro</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Multi-User Collaborative Team Seats</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Custom JBP Deck Templates & Branding</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Multi-Distributor Scan Rebate Ingestion</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Dedicated Commercial Account Manager</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onOpenPricingModal}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Contact Enterprise Sales
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ACCC & RETAIL STRATEGY FAQS (ORGANIZED ACCORDION)                      */}
      {/* ========================================================================= */}
      <section 
        id="faq-section"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            Australian Retail Knowledge & Compliance
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Category Selector Tabs */}
        <div className="flex justify-center gap-2 flex-wrap">
          {(['accc', 'rebates', 'exports'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveFaqCategory(cat);
                setOpenFaqIndex(0);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFaqCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isLight
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {FAQ_GROUPS[cat].title}
            </button>
          ))}
        </div>

        {/* Accordions */}
        <div className="space-y-3 pt-2">
          {FAQ_GROUPS[activeFaqCategory].items.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#111726] border-[#1f2b42]'
                }`}
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FINAL CONVERSION ACTION FOOTER BANNER                                 */}
      {/* ========================================================================= */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className={`p-8 sm:p-12 rounded-3xl border text-center relative overflow-hidden shadow-2xl ${
          isLight 
            ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white border-indigo-600' 
            : 'bg-gradient-to-r from-indigo-950 via-[#101726] to-blue-950 border-indigo-900/60 text-white'
        }`}>
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Transform Your Trade Strategy
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to Win at the Australian Retail Shelf?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              Step into every negotiation with unshakeable margin certainty, automated ACCC hiatus compliance, and board-ready JBP presentation decks.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onOpenPricingModal}
                className="px-6 py-3.5 rounded-xl bg-white text-slate-950 font-black text-xs sm:text-sm hover:bg-slate-100 transition-all cursor-pointer shadow-lg hover:scale-105"
              >
                Start 14-Day Free Pro Access
              </button>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
              >
                Launch 52-Week Master Grid
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
