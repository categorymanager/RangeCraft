import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  FileText,
  Layers,
  Play,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  TrendingUp,
  UserCheck,
  Wallet,
  X,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { AppTab, CheckoutPlanType, StrategyKPIs, ThemeMode, UserProfile } from '../types';
import { SEOHead } from './SEOHead';
import { PromoReslotterSandbox } from './PromoReslotterSandbox';
import { AI_TOPUP_PACK, PRICING_PLANS } from '../lib/firebase';
import { ONE_OFF_SERVICES } from '../data/adminAnalyticsData';
import { canClaimFreeTrial, hasActivePaidSubscription } from '../utils/entitlements';

import supermarketProduceImg from '../assets/images/supermarket_produce_aisle_1795331011651.jpg';
import warehousePalletImg from '../assets/images/warehouse_pallet_dispatch_1795331011441.jpg';

interface LandingPageViewProps {
  kpis: StrategyKPIs;
  currentTheme: ThemeMode;
  user: UserProfile | null;
  onNavigateTab: (tab: AppTab) => void;
  onOpenAiOptimizer: () => void;
  onOpenUploadModal: () => void;
  onAutoFixClashes: () => void;
  onOpenAuthModal: () => void;
  onOpenPricingModal: () => void;
  onOpenAboutModal?: () => void;
  onOpenEnterpriseQuote?: () => void;
  onStartCheckout?: (opts: {
    exportId: string;
    itemName: string;
    priceAud: number;
    planType: CheckoutPlanType;
    billingCycle?: 'monthly' | 'annual';
    excludesGst?: boolean;
  }) => void;
}

type RoleKey = 'sellers' | 'buyers' | 'distributors';

const GENERIC_CHANNELS = [
  { name: 'National Supermarkets', tag: 'Grocery Chains' },
  { name: 'Metro Grocery', tag: 'Urban Convenience' },
  { name: 'Independent Grocers', tag: 'Wholesale Network' },
  { name: 'Warehouse Clubs', tag: 'Bulk & Club' },
  { name: 'Online Marketplaces', tag: 'Digital Retail' },
];

const EXCEL_COMPARISON = [
  {
    capability: 'Margin & Rebate Math',
    excel: 'Manual formulas prone to silent breaks',
    rangecraft: 'Live dead-net waterfall & scan rebate guardrails',
  },
  {
    capability: '52-Week Calendar',
    excel: 'Static tabs with copy-paste errors',
    rangecraft: 'Auto-formulated 52-week plan & 1-click reslotter',
  },
  {
    capability: 'Custom Scheduling Rules',
    excel: 'Checked manually after buyer feedback',
    rangecraft: 'Automatic hiatus spacing & conflict alerts',
  },
  {
    capability: 'Trade Spend Visibility',
    excel: 'Co-op & over-and-above spend fragmented',
    rangecraft: 'Unified rebate, O&A & invoice deduction view',
  },
  {
    capability: 'Scenario Modelling',
    excel: 'Duplicate workbooks for each what-if',
    rangecraft: 'Instant discount depth & volume uplift testing',
  },
  {
    capability: 'Buyer Review Packs',
    excel: 'Hours rebuilding charts into slides',
    rangecraft: 'One-click PDF & PowerPoint executive decks',
  },
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  kpis,
  currentTheme,
  user,
  onNavigateTab,
  onOpenPricingModal,
  onOpenEnterpriseQuote,
  onStartCheckout,
}) => {
  const isLight = currentTheme.includes('light');
  const trialEligible = canClaimFreeTrial(user);
  const isPaidActive = hasActivePaidSubscription(user);
  const visiblePricingPlans = PRICING_PLANS.filter(
    (p) => (trialEligible && !isPaidActive) || p.id !== 'free_trial'
  );

  // Interactive Conversion Tools state
  const [demoMode, setDemoMode] = useState<'recovery_calc' | 'margin_audit' | 'reslotter'>('recovery_calc');

  // Profit Recovery Calculator state
  const [annualPromoRev, setAnnualPromoRev] = useState<number>(1500000);
  const [annualPromoCount, setAnnualPromoCount] = useState<number>(28);
  const [activeSkuCount, setActiveSkuCount] = useState<number>(18);

  const estimatedLeakPct = Math.min(8.5, 2.4 + annualPromoCount * 0.08 + activeSkuCount * 0.05);
  const estimatedMarginLeakageAud = Math.round(annualPromoRev * (estimatedLeakPct / 100));
  const recoverableProfitAud = Math.round(estimatedMarginLeakageAud * 0.68);
  const protectedMarginLiftPts = Number((estimatedLeakPct * 0.68).toFixed(1));

  // Promotion Profit Checker state
  const [auditDiscount, setAuditDiscount] = useState<number>(30);
  const [auditScanRebate, setAuditScanRebate] = useState<number>(1.85);
  const [auditRrp] = useState<number>(8.5);
  const [auditCogs] = useState<number>(3.1);

  const promoShelfPrice = auditRrp * (1 - auditDiscount / 100);
  const retailExGst = promoShelfPrice / 1.1;
  const retailerTargetCost = retailExGst * 0.68;
  const netSupplierInvoice = Math.max(0, retailerTargetCost - auditScanRebate);
  const supplierUnitProfit = netSupplierInvoice - auditCogs;
  const supplierNetMarginPct =
    netSupplierInvoice > 0 ? (supplierUnitProfit / netSupplierInvoice) * 100 : 0;
  const isMarginHealthy = supplierNetMarginPct >= 25;

  const [selectedRole, setSelectedRole] = useState<RoleKey>('sellers');
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const triggerCheckoutOrPricing = (opts: {
    exportId: string;
    itemName: string;
    priceAud: number;
    planType: CheckoutPlanType;
    billingCycle?: 'monthly' | 'annual';
    excludesGst?: boolean;
  }) => {
    if (onStartCheckout) {
      onStartCheckout({ ...opts, excludesGst: false });
    } else {
      onOpenPricingModal();
    }
  };

  const ROLE_CONTENT: Record<
    RoleKey,
    {
      label: string;
      eyebrow: string;
      metricTitle: string;
      metricSubtitle: string;
      metricValue: string;
      image: string;
      imageAlt: string;
      cards: {
        icon: React.ComponentType<{ className?: string }>;
        title: string;
        desc: string;
        stat: string;
      }[];
    }
  > = {
    sellers: {
      label: 'Suppliers & Brands',
      eyebrow: 'BRAND OWNERS & CATEGORY MANAGERS',
      metricTitle: 'Protect Dead-Net Take-Home on Every Deal',
      metricSubtitle:
        'Validate scan rebates, off-invoice discounts, and custom hiatus spacing before submitting a single slot.',
      metricValue: '$2.18 / unit net',
      image: supermarketProduceImg,
      imageAlt: 'Retail supermarket aisle merchandising display',
      cards: [
        {
          icon: ShieldCheck,
          title: 'Custom Scheduling Rules',
          desc: 'Enforce hiatus spacing between competing flavours and banners automatically.',
          stat: 'W5 Core -> W10 Variant · Clear',
        },
        {
          icon: Layers,
          title: 'Landed Cost & Case Math',
          desc: 'Track freight, carton breaks, and list margins across your entire SKU range.',
          stat: 'COGS $18.40 · List $31.20 · 41% GM',
        },
        {
          icon: BarChart3,
          title: 'Scan Rebate Audit',
          desc: 'Model checkout scan funding alongside active periods before deductions land.',
          stat: '$14,820 Budgeted · Verified',
        },
        {
          icon: FileText,
          title: 'Buyer-Ready JBP Packs',
          desc: 'Export full-year schedules and margin waterfalls to PDF & PowerPoint in seconds.',
          stat: 'PPTX + PDF Waterfall · Ready',
        },
      ],
    },
    buyers: {
      label: 'Buyers & Stores',
      eyebrow: 'RETAIL BUYERS & INDEPENDENT GROUPS',
      metricTitle: 'Verify Store Gross Margin & Carton Breaks',
      metricSubtitle:
        'Evaluate supplier co-funded deals, carton volume discounts, and store breakeven thresholds side by side.',
      metricValue: '34.8% Store GM',
      image: supermarketProduceImg,
      imageAlt: 'Grocery promotional shelf display',
      cards: [
        {
          icon: ShoppingCart,
          title: 'Tiered Carton Pricing',
          desc: 'Compare 5+ and 10+ carton volume breaks against expected weekly store sell-through.',
          stat: '10+ Cartons · -10% Wholesale Cost',
        },
        {
          icon: SlidersHorizontal,
          title: 'Store Breakeven Check',
          desc: 'Know exactly how many units clear handling overheads and hit category margin targets.',
          stat: '142 Units / Store · Target W3',
        },
        {
          icon: Calendar,
          title: 'Pre-Booked Promo Windows',
          desc: 'Lock seasonal supplier-funded specials cleanly across quarterly merchandising plans.',
          stat: 'Q2 + Q3 Windows · Co-Funded',
        },
        {
          icon: DollarSign,
          title: '30-Day Trade Settlement',
          desc: 'Align working capital forecasts with net invoice settlement windows.',
          stat: 'Net 30 Days · Reconciled',
        },
      ],
    },
    distributors: {
      label: 'Distributors & Reps',
      eyebrow: 'DISTRIBUTORS & FIELD SALES TEAMS',
      metricTitle: 'Track Territory Volume & Rebate Milestones',
      metricSubtitle:
        'Unify channel trading terms, dispatch schedules, and quarterly bonus targets in one workspace.',
      metricValue: '6.5% Tier-2 Rate',
      image: warehousePalletImg,
      imageAlt: 'Distribution warehouse pallet dispatch',
      cards: [
        {
          icon: Wallet,
          title: 'Rebate Tier Tracking',
          desc: 'Monitor territory carton volume toward quarterly distributor bonus thresholds.',
          stat: '84% to Tier-3 Unlock',
        },
        {
          icon: Building2,
          title: 'Channel Terms Matrix',
          desc: 'Keep buyer contacts, trading terms, and review dates organised by retail channel.',
          stat: '5 Retail Channels · Active',
        },
        {
          icon: ShoppingCart,
          title: 'Wholesale PO Pipeline',
          desc: 'Track incoming store carton orders from confirmation through dispatch.',
          stat: '98.4% On-Time Dispatch',
        },
        {
          icon: TrendingUp,
          title: 'Standardized Sell Sheets',
          desc: 'Share barcode specs, carton dimensions, and promo windows with retail buyers.',
          stat: 'GS1 + Pallet Specs · Ready',
        },
      ],
    },
  };

  const FAQS = [
    {
      q: 'How is GST shown across RangeCraft plans and packages?',
      a: 'Every price displayed across subscriptions, top-up packs, and one-off advisory packages is a single GST-inclusive AUD price (inc. GST) with no hidden add-ons at checkout.',
    },
    {
      q: 'What does the 52-week auto-formulation engine do?',
      a: 'Once you add your SKUs, RangeCraft formulates an optimal 52-week promotional calendar that respects your custom hiatus spacing rules, avoids intra-brand cannibalisation, and protects your target net margin floor.',
    },
    {
      q: 'Are Custom Scheduling Rules configurable for our business?',
      a: 'Yes. You can configure hiatus week gaps, discount depth ceilings, and category spacing thresholds inside Custom Rules. RangeCraft flags potential scheduling conflicts and margin risks automatically.',
    },
    {
      q: 'Can we switch between Monthly and Annual billing anytime?',
      a: 'Yes. Both Monthly and Annual subscriptions have zero lock-in contracts. You can upgrade, switch billing frequency, or cancel anytime directly inside Billing & Invoices.',
    },
    {
      q: 'Are Done-For-You Setup & Advisory packages separate from software plans?',
      a: 'Yes. Range Setup ($299 inc. GST), Schedule & Rule Audits ($450 inc. GST), and JBP Pitch Reviews ($899 inc. GST) are optional one-off services you can book individually.',
    },
  ];

  const pageBg = isLight ? 'bg-[#F8FAFC] text-[#0F172A]' : 'bg-[#090D16] text-slate-100';
  const cardBg = isLight
    ? 'bg-[#FFFFFF] border-[#E2E8F0] shadow-xs'
    : 'bg-[#111726] border-slate-800';
  const subText = isLight ? 'text-slate-600' : 'text-slate-400';
  const headingText = isLight ? 'text-[#0F172A]' : 'text-slate-50';
  const activeRoleData = ROLE_CONTENT[selectedRole];

  return (
    <div className={`min-h-screen w-full transition-colors duration-200 pb-20 md:pb-0 ${pageBg}`}>
      <SEOHead />

      {/* ===================================================================== */}
      {/* 1. HERO SECTION (Enterprise Split Layout + Realistic Product Preview) */}
      {/* ===================================================================== */}
      <section className="pt-10 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Copy Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2563EB] dark:text-blue-400">
              <span>AUSTRALIA&apos;S FMCG PROMOTIONAL PLANNING PLATFORM</span>
            </div>

            <h1
              className={`text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.06] ${headingText}`}
              style={{ textWrap: 'balance' }}
            >
              Stop Losing Margin to <span className="text-[#2563EB]">Retail Promotions</span>
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed max-w-xl ${subText}`}>
              Plan, validate and optimise FMCG promotions before they cost you money. Built for suppliers, distributors and category teams who need commercial clarity.
            </p>

            {/* 4 Outcome Benefits */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-1">
              {[
                'Find unprofitable promotions early',
                'Plan 52-week promotional calendars',
                'Model rebates and trade spend',
                'Generate retailer-ready review packs',
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2.5 text-sm font-medium">
                  <span className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className={headingText}>{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                id="hero-primary-trial-cta"
                onClick={() =>
                  isPaidActive
                    ? onNavigateTab('dashboard')
                    : triggerCheckoutOrPricing({
                        exportId: 'pro_planner',
                        itemName: 'Growth Plan',
                        priceAud: billingCycle === 'annual' ? 1490 : 149,
                        planType: 'pro_subscription',
                        billingCycle,
                        excludesGst: false,
                      })
                }
                className="px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>
                  {isPaidActive
                    ? 'Open Executive Dashboard'
                    : trialEligible
                    ? 'Start 14-Day Free Trial'
                    : 'View Growth Plans'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="hero-secondary-sandbox-cta"
                onClick={() => scrollToSection('roi-demonstrator-section')}
                className={`px-6 py-3.5 rounded-xl border font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                  isLight
                    ? 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Play className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Watch 2 Minute Demo</span>
              </button>
            </div>

            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium ${subText}`}>
              {trialEligible && !isPaidActive && <span>No credit card required</span>}
              {trialEligible && !isPaidActive && <span>·</span>}
              <span>Australian built</span>
              <span>·</span>
              <span>Trusted by FMCG professionals</span>
            </div>
          </div>

          {/* Right Realistic Product UI Showcase (NO marketing illustration, generic channels only) */}
          <div className="lg:col-span-6">
            <div
              className={`rounded-2xl border p-4 sm:p-5 shadow-lg space-y-4 ${
                isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#0F172A] border-slate-800'
              }`}
            >
              {/* Mock Window Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="ml-2 text-xs font-semibold text-slate-500">
                    Executive Dashboard · FY Promotional Overview
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#10B981] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  Live Forecast
                </span>
              </div>

              {/* 4 KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 tabular-nums">
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Forecast Revenue
                  </span>
                  <span className={`text-lg font-extrabold font-mono mt-0.5 block ${headingText}`}>
                    $1.24M
                  </span>
                  <span className="text-[11px] font-semibold text-[#10B981]">+12%</span>
                </div>

                <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Forecast Profit
                  </span>
                  <span className={`text-lg font-extrabold font-mono mt-0.5 block ${headingText}`}>
                    $340K
                  </span>
                  <span className="text-[11px] font-semibold text-[#10B981]">+8%</span>
                </div>

                <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Active Promos
                  </span>
                  <span className={`text-lg font-extrabold font-mono mt-0.5 block ${headingText}`}>
                    24
                  </span>
                  <span className="text-[11px] font-semibold text-[#2563EB]">52W Calendar</span>
                </div>

                <div className={`p-3 rounded-xl border ${isLight ? 'bg-rose-50/70 border-rose-200' : 'bg-rose-950/30 border-rose-900/60'}`}>
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                    SKUs At Risk
                  </span>
                  <span className="text-lg font-extrabold font-mono mt-0.5 block text-[#EF4444]">
                    4
                  </span>
                  <span className="text-[11px] font-semibold text-[#EF4444]">Below 25% GM</span>
                </div>
              </div>

              {/* Trend Curve + Channel Calendar Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Mini SVG Trend Chart */}
                <div className={`sm:col-span-6 p-3.5 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${headingText}`}>Revenue vs Net Profit</span>
                    <span className="text-[10px] font-mono text-slate-500">Q1 – Q4</span>
                  </div>
                  <svg viewBox="0 0 240 80" className="w-full h-20 overflow-visible" aria-hidden="true">
                    <defs>
                      <linearGradient id="rcHeroArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,62 C35,58 55,44 85,46 C115,48 135,28 165,24 C195,20 215,12 240,8 L240,80 L0,80 Z"
                      fill="url(#rcHeroArea)"
                    />
                    <path
                      d="M0,62 C35,58 55,44 85,46 C115,48 135,28 165,24 C195,20 215,12 240,8"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0,70 C35,66 55,58 85,60 C115,61 135,48 165,45 C195,42 215,35 240,32"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Mini Channel Calendar Bars (Generic Labels Only) */}
                <div className={`sm:col-span-6 p-3.5 rounded-xl border space-y-2 ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${headingText}`}>Channel Calendar</span>
                    <span className="text-[10px] font-semibold text-slate-500">Status</span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate text-slate-600 dark:text-slate-300">
                        National Supermarkets
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] font-semibold shrink-0">
                        On Track
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate text-slate-600 dark:text-slate-300">
                        Metro Grocery
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-[#F59E0B] font-semibold shrink-0">
                        Review
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate text-slate-600 dark:text-slate-300">
                        Independent Grocers
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] font-semibold shrink-0">
                        On Track
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate text-slate-600 dark:text-slate-300">
                        Warehouse Clubs
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-[#EF4444] font-semibold shrink-0">
                        At Risk
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commercial Insight Callout (Outcome-Focused, Non-AI Framing) */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-950/30 border-amber-800/60'}`}>
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Commercial Insight · Margin Risk Alert
                    </span>
                    <span className="text-xs font-mono font-bold text-[#EF4444] tabular-nums">
                      -$8,240
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    30% discount in Warehouse Clubs breaches 25% floor. Adjusting to 25% recovers <strong className="font-semibold text-[#10B981]">+$8,240</strong> net margin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. GENERIC CHANNEL TRUST STRIP                                        */}
        {/* ===================================================================== */}
        <div
          id="how-it-works"
          className={`mt-14 pt-10 border-t ${isLight ? 'border-[#E2E8F0]' : 'border-slate-800'}`}
        >
          <p className={`text-center text-xs font-semibold uppercase tracking-[0.14em] mb-6 ${subText}`}>
            BUILT AROUND MAJOR AUSTRALIAN RETAIL CHANNEL WORKFLOWS &amp; PROMOTIONAL STANDARDS
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {GENERIC_CHANNELS.map((ch) => (
              <div
                key={ch.name}
                className={`rounded-xl border px-4 py-3 text-center transition-colors ${cardBg}`}
              >
                <p className={`text-xs font-bold ${headingText}`}>{ch.name}</p>
                <p className={`text-[11px] mt-0.5 ${subText}`}>{ch.tag}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. WHY FMCG TEAMS OUTGROW EXCEL (PROBLEM / SOLUTION + COMPARISON)     */}
      {/* ===================================================================== */}
      <section
        id="why-rangecraft"
        className={`py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-y ${
          isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#0C111E] border-slate-800'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2563EB]">
                WHY NOT SPREADSHEETS
              </p>
              <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${headingText}`}>
                Why FMCG teams outgrow Excel
              </h2>
              <p className={`text-base ${subText}`}>
                Spreadsheets hide rebate erosion, miss spacing rules, and take days to update before buyer reviews.
              </p>
            </div>
            <div className={`lg:col-span-5 p-4 rounded-xl border ${isLight ? 'bg-blue-50/60 border-blue-200' : 'bg-blue-950/30 border-blue-900'}`}>
              <p className={`text-sm font-medium ${headingText}`}>
                Suppliers using RangeCraft typically recover <span className="font-bold text-[#2563EB]">2–5% lost promotional margin</span> within the first planning cycle.
              </p>
            </div>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={isLight ? 'bg-[#F8FAFC] border-b border-[#E2E8F0]' : 'bg-slate-900 border-b border-slate-800'}>
                    <th className={`py-3.5 px-5 font-semibold ${subText}`}>Commercial Workflow</th>
                    <th className="py-3.5 px-5 font-semibold text-rose-600 dark:text-rose-400">Spreadsheets &amp; Excel</th>
                    <th className="py-3.5 px-5 font-bold text-[#2563EB]">RangeCraft OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {EXCEL_COMPARISON.map((row) => (
                    <tr key={row.capability}>
                      <td className={`py-3.5 px-5 font-semibold ${headingText}`}>{row.capability}</td>
                      <td className={`py-3.5 px-5 ${subText}`}>
                        <span className="inline-flex items-center gap-2">
                          <X className="w-4 h-4 text-[#EF4444] shrink-0" />
                          <span>{row.excel}</span>
                        </span>
                      </td>
                      <td className={`py-3.5 px-5 font-medium ${headingText}`}>
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                          <span>{row.rangecraft}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. INTERACTIVE PROFIT RECOVERY & PROMOTION CHECKER                    */}
      {/* ===================================================================== */}
      <section id="roi-demonstrator-section" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2563EB]">
              COMMERCIAL PROFIT TOOLS
            </p>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${headingText}`}>
              Find Margin Leaks Before Approval
            </h2>
          </div>

          <div
            className={`inline-flex p-1 rounded-xl border self-start md:self-auto overflow-x-auto max-w-full ${
              isLight ? 'bg-white border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {[
              { id: 'recovery_calc', label: 'Profit Recovery Calculator' },
              { id: 'margin_audit', label: 'Promotion Profit Checker' },
              { id: 'reslotter', label: '1-Click Promo Reslotter' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDemoMode(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  demoMode === tab.id ? 'bg-[#2563EB] text-white' : subText
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {demoMode === 'recovery_calc' && (
          <div className={`rounded-2xl border p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 ${cardBg}`}>
            <div className="lg:col-span-6 space-y-5">
              <div>
                <h3 className={`text-xl font-bold ${headingText}`}>How Much Profit Are You Losing Today?</h3>
                <p className={`text-sm mt-1 ${subText}`}>
                  Adjust your promotional run rate to estimate annual margin leakage from over-discounting and rebate clashes.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className={subText}>Annual Promotional Revenue</span>
                    <span className="font-mono text-[#2563EB] tabular-nums">
                      A${annualPromoRev.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={250000}
                    max={10000000}
                    step={250000}
                    value={annualPromoRev}
                    onChange={(e) => setAnnualPromoRev(Number(e.target.value))}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className={subText}>Promotions Per Year</span>
                    <span className="font-mono text-[#2563EB] tabular-nums">{annualPromoCount} slots</span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={52}
                    step={2}
                    value={annualPromoCount}
                    onChange={(e) => setAnnualPromoCount(Number(e.target.value))}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className={subText}>Active SKUs</span>
                    <span className="font-mono text-[#2563EB] tabular-nums">{activeSkuCount} SKUs</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={80}
                    step={1}
                    value={activeSkuCount}
                    onChange={(e) => setActiveSkuCount(Number(e.target.value))}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab(user ? 'dashboard' : 'catalog')}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <span>Open Profit Recovery Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 content-center">
              <div className={`p-5 rounded-xl border ${isLight ? 'bg-rose-50/70 border-rose-200' : 'bg-rose-950/30 border-rose-900'}`}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#EF4444]">
                  Estimated Margin Leakage
                </span>
                <p className="text-3xl font-extrabold font-mono text-[#EF4444] mt-1 tabular-nums">
                  A${estimatedMarginLeakageAud.toLocaleString()}
                </p>
                <p className={`text-xs mt-1 ${subText}`}>
                  ~{estimatedLeakPct.toFixed(1)}% lost to unvalidated promo depth
                </p>
              </div>

              <div className={`p-5 rounded-xl border ${isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/30 border-emerald-900'}`}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981]">
                  Recoverable Profit / Year
                </span>
                <p className="text-3xl font-extrabold font-mono text-[#10B981] mt-1 tabular-nums">
                  +A${recoverableProfitAud.toLocaleString()}
                </p>
                <p className={`text-xs mt-1 ${subText}`}>
                  +{protectedMarginLiftPts}% net margin improvement
                </p>
              </div>

              <div className={`sm:col-span-2 p-4 rounded-xl border flex items-center justify-between gap-4 ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'}`}>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Projected ROI on Growth Plan
                  </span>
                  <p className={`text-sm font-semibold mt-0.5 ${headingText}`}>
                    {Math.max(10, Math.round(recoverableProfitAud / 1490))}x return on annual subscription
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#2563EB] tabular-nums">
                  inc. GST
                </span>
              </div>
            </div>
          </div>
        )}

        {demoMode === 'margin_audit' && (
          <div className={`rounded-2xl border p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 ${cardBg}`}>
            <div className="lg:col-span-6 space-y-5">
              <div>
                <h3 className={`text-xl font-bold ${headingText}`}>Will This Promotion Make Money?</h3>
                <p className={`text-sm mt-1 ${subText}`}>
                  Sample Pantry SKU (RRP $8.50 · COGS $3.10). Test discount depth and scan rebate funding live.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className={subText}>Promotional Discount Depth</span>
                    <span className="font-mono text-[#2563EB] tabular-nums">{auditDiscount}% Off</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    step={5}
                    value={auditDiscount}
                    onChange={(e) => setAuditDiscount(Number(e.target.value))}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className={subText}>Funded Scan Rebate / Unit</span>
                    <span className="font-mono text-[#10B981] tabular-nums">A${auditScanRebate.toFixed(2)} / unit</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={3.5}
                    step={0.15}
                    value={auditScanRebate}
                    onChange={(e) => setAuditScanRebate(Number(e.target.value))}
                    className="w-full accent-[#10B981] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateTab('promotion-builder')}
                  className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Open Promotion Builder
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('analytics')}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50'
                      : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Open Margin Simulator
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4 content-center">
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'}`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Promo Shelf Price</p>
                <p className={`text-2xl font-extrabold font-mono mt-1 tabular-nums ${headingText}`}>
                  A${promoShelfPrice.toFixed(2)}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'}`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Net Take-Home / Unit</p>
                <p className={`text-2xl font-extrabold font-mono mt-1 tabular-nums ${headingText}`}>
                  A${netSupplierInvoice.toFixed(2)}
                </p>
              </div>

              <div
                className={`col-span-2 p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isMarginHealthy
                    ? isLight
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-emerald-950/30 border-emerald-800'
                    : isLight
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-rose-950/30 border-rose-800'
                }`}
              >
                <div>
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${isMarginHealthy ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {isMarginHealthy ? 'PROMOTION APPROVED · MARGIN SAFE' : 'BELOW 25% MARGIN FLOOR'}
                  </p>
                  <p className={`text-2xl font-extrabold font-mono mt-0.5 tabular-nums ${headingText}`}>
                    {supplierNetMarginPct.toFixed(1)}% Net Margin ({supplierUnitProfit >= 0 ? '+' : ''}A${supplierUnitProfit.toFixed(2)}/u)
                  </p>
                </div>
                <span className={`text-xs font-mono font-semibold ${subText}`}>
                  52W Run: A${Math.round(kpis?.annualProjectedRevenueAud || 485000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {demoMode === 'reslotter' && (
          <PromoReslotterSandbox
            currentTheme={currentTheme}
            userProfile={user}
            onOpenPricingModal={onOpenPricingModal}
            onNavigateTab={onNavigateTab}
          />
        )}
      </section>

      {/* ===================================================================== */}
      {/* 5. ROLE-TAILORED WORKSPACE VIEWS                                      */}
      {/* ===================================================================== */}
      <section
        id="solutions-by-role"
        className={`py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-y ${
          isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#0C111E] border-slate-800'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2563EB]">
                TAILORED COMMERCIAL WORKFLOWS
              </p>
              <h2 className={`text-3xl font-bold tracking-tight ${headingText}`}>
                Built for Every Commercial Role
              </h2>
            </div>

            <div className={`inline-flex p-1 rounded-xl border self-start md:self-auto ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setSelectedRole('sellers')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedRole === 'sellers' ? 'bg-[#2563EB] text-white' : subText
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Suppliers &amp; Brands</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('buyers')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedRole === 'buyers' ? 'bg-[#2563EB] text-white' : subText
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Buyers &amp; Stores</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('distributors')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedRole === 'distributors' ? 'bg-[#2563EB] text-white' : subText
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Distributors</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className={`lg:col-span-5 rounded-2xl border overflow-hidden flex flex-col justify-between ${cardBg}`}>
              <div className="aspect-video overflow-hidden bg-slate-100">
                <img
                  src={activeRoleData.image}
                  alt={activeRoleData.imageAlt}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">
                    {activeRoleData.eyebrow}
                  </p>
                  <h3 className={`text-xl font-bold ${headingText}`}>{activeRoleData.metricTitle}</h3>
                  <p className={`text-sm ${subText}`}>{activeRoleData.metricSubtitle}</p>
                </div>
                <div className={`px-4 py-2.5 rounded-xl border font-mono font-bold text-sm tabular-nums ${isLight ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]' : 'bg-slate-900 border-slate-800 text-white'}`}>
                  {activeRoleData.metricValue}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeRoleData.cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 ${cardBg}`}>
                    <div className="space-y-2.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isLight ? 'bg-blue-50 text-[#2563EB]' : 'bg-blue-950/60 text-blue-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className={`text-base font-bold ${headingText}`}>{card.title}</h4>
                      <p className={`text-xs leading-relaxed ${subText}`}>{card.desc}</p>
                    </div>
                    <p className={`text-xs font-mono font-semibold pt-3 border-t tabular-nums ${isLight ? 'border-slate-100 text-[#0F172A]' : 'border-slate-800 text-slate-200'}`}>
                      {card.stat}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. TRANSPARENT INC. GST PRICING SECTION                               */}
      {/* ===================================================================== */}
      <section id="pricing-section" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2563EB]">
            SIMPLE, TRANSPARENT PRICING
          </p>
          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${headingText}`}>
            Plans Built for Every Stage of Growth
          </h2>
          <p className={`text-sm sm:text-base ${subText}`}>
            All prices are shown inclusive of GST (inc. GST) with no surprise fees.
          </p>

          <div className="pt-1 flex justify-center">
            <div className={`inline-flex items-center p-1 rounded-xl border ${isLight ? 'bg-white border-[#E2E8F0]' : 'bg-slate-900 border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  billingCycle === 'annual' ? 'bg-[#2563EB] text-white' : subText
                }`}
              >
                <span>Annual</span>
                <span className="px-1.5 py-0.5 rounded bg-[#10B981] text-white text-[10px] font-bold">
                  2 months free
                </span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  billingCycle === 'monthly' ? 'bg-[#2563EB] text-white' : subText
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${visiblePricingPlans.length <= 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-6 items-stretch`}>
          {visiblePricingPlans.map((plan) => {
            const isFree = plan.id === 'free_trial';
            const isPro = plan.id === 'pro_planner';
            const isEnterprise = plan.id === 'enterprise_tier';

            const displayPrice = isEnterprise
              ? 'Custom'
              : isFree
              ? '$0'
              : billingCycle === 'annual'
              ? `$${plan.annualPriceAud.toLocaleString()}`
              : `$${plan.priceAud}`;

            const handlePlanClick = () => {
              if (isFree) {
                onNavigateTab('catalog');
                return;
              }
              if (isEnterprise) {
                if (onOpenEnterpriseQuote) {
                  onOpenEnterpriseQuote();
                } else {
                  onOpenPricingModal();
                }
                return;
              }
              triggerCheckoutOrPricing({
                exportId: plan.id,
                itemName: plan.name,
                priceAud: billingCycle === 'annual' ? plan.annualPriceAud : plan.priceAud,
                planType: isPro ? 'pro_subscription' : 'starter_subscription',
                billingCycle,
                excludesGst: false,
              });
            };

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between ${
                  isPro
                    ? 'border-[#2563EB] ring-1 ring-[#2563EB] bg-white dark:bg-[#111726] shadow-md'
                    : cardBg
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">
                      {plan.badgeLabel}
                    </span>
                    {isPro && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-[#2563EB] text-[10px] font-bold">
                        Most Popular
                      </span>
                    )}
                  </div>

                  <h3 className={`text-2xl font-bold mt-2 ${headingText}`}>{plan.name}</h3>
                  <p className={`text-sm mt-1.5 ${subText}`}>{plan.tagline}</p>

                  <div className="my-6">
                    {isEnterprise ? (
                      <div className={`text-3xl font-extrabold ${headingText}`}>Custom Pricing</div>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-4xl font-extrabold font-mono tabular-nums ${headingText}`}>
                          {displayPrice}
                        </span>
                        <span className={`text-xs font-medium ${subText}`}>
                          {isFree
                            ? 'inc. GST · Forever'
                            : `/ ${billingCycle === 'annual' ? 'year' : 'mo'} inc. GST`}
                        </span>
                      </div>
                    )}
                  </div>

                  <ul className={`space-y-2.5 text-sm mb-8 ${subText}`}>
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handlePlanClick}
                  className={`w-full py-3 px-5 rounded-xl font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap ${
                    isPro
                      ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                      : isLight
                      ? 'bg-[#0F172A] hover:bg-slate-800 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {user?.subscriptionTier === plan.id
                    ? 'Current Active Plan'
                    : isPro && !trialEligible
                    ? 'Upgrade to Growth'
                    : plan.ctaText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Optional Scenario Top-Up Pack */}
        <div className={`rounded-2xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">
              OPTIONAL SCENARIO CREDITS
            </p>
            <h3 className={`text-lg font-bold mt-0.5 ${headingText}`}>
              {AI_TOPUP_PACK.name} · A${AI_TOPUP_PACK.priceAud} inc. GST
            </h3>
            <p className={`text-sm mt-1 ${subText}`}>
              Add 50 non-expiring automated scenario formulation runs anytime without changing your plan.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              triggerCheckoutOrPricing({
                exportId: AI_TOPUP_PACK.id,
                itemName: AI_TOPUP_PACK.name,
                priceAud: AI_TOPUP_PACK.priceAud,
                planType: 'ai_topup',
                excludesGst: false,
              })
            }
            className="px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Add +50 Runs (A${AI_TOPUP_PACK.priceAud} inc. GST)
          </button>
        </div>

        {/* Done-For-You Packages (Single inc. GST Pricing) */}
        <div id="advisory-section" className="pt-6 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2563EB]">
              OPTIONAL ONE-OFF PACKAGES · NO SUBSCRIPTION REQUIRED
            </p>
            <h3 className={`text-2xl font-bold ${headingText}`}>Done-For-You Setup &amp; Commercial Advisory</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ONE_OFF_SERVICES.map((srv, idx) => (
              <div key={srv.id} className={`rounded-2xl border p-6 flex flex-col justify-between ${cardBg}`}>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                      {srv.stepBadge}
                    </span>
                    <span className={`text-xs ${subText}`}>{srv.turnaround}</span>
                  </div>
                  <h4 className={`text-lg font-bold ${headingText}`}>{srv.title}</h4>
                  <div className="my-3 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-extrabold font-mono tabular-nums ${headingText}`}>
                      ${srv.priceAud}
                    </span>
                    <span className={`text-xs ${subText}`}>inc. GST</span>
                  </div>
                  <p className={`text-xs leading-relaxed mb-4 ${subText}`}>{srv.description}</p>
                  <ul className={`space-y-2 text-xs mb-6 ${subText}`}>
                    {srv.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    triggerCheckoutOrPricing({
                      exportId: srv.id,
                      itemName: srv.title,
                      priceAud: srv.priceAud,
                      planType: 'one_off_service',
                      excludesGst: false,
                    })
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs cursor-pointer whitespace-nowrap"
                >
                  Book Package {idx + 1} (${srv.priceAud} inc. GST)
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. FAQ SECTION                                                        */}
      {/* ===================================================================== */}
      <section
        id="faq-section"
        className={`py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-t ${
          isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#0C111E] border-slate-800'
        }`}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2563EB]">FAQ</p>
            <h2 className={`text-2xl sm:text-3xl font-bold ${headingText}`}>Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={faq.q} className={`rounded-xl border overflow-hidden ${cardBg}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className={`w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base cursor-pointer ${headingText}`}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#2563EB]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className={`px-5 pb-4 pt-2 text-sm border-t ${isLight ? 'border-slate-100 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. COMPACT MOBILE STICKY BAR                                          */}
      {/* ===================================================================== */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-30 border-t px-4 py-2.5 flex items-center justify-between gap-3 backdrop-blur-md ${
          isLight ? 'bg-white/95 border-[#E2E8F0]' : 'bg-[#0F172A]/95 border-slate-800'
        }`}
      >
        <span className={`text-xs font-bold whitespace-nowrap ${headingText}`}>RangeCraft OS</span>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => scrollToSection('roi-demonstrator-section')}
            className={`text-xs font-semibold cursor-pointer whitespace-nowrap ${subText}`}
          >
            Demo
          </button>
          <button
            type="button"
            onClick={() =>
              isPaidActive
                ? onNavigateTab('dashboard')
                : triggerCheckoutOrPricing({
                    exportId: 'pro_planner',
                    itemName: 'Growth Plan',
                    priceAud: billingCycle === 'annual' ? 1490 : 149,
                    planType: 'pro_subscription',
                    billingCycle,
                    excludesGst: false,
                  })
            }
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            {isPaidActive ? 'Open Dashboard' : trialEligible ? 'Start Free Trial' : 'View Plans'}
          </button>
        </div>
      </div>
    </div>
  );
};
