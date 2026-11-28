import React from 'react';
import { AppTab, ThemeMode, UserProfile } from '../types';
import { useActiveCurrency } from '../utils/currency';
import { WorkspacePageHero } from './WorkspacePageHero';
import workspaceHubHeroImg from '../assets/images/workspace_hub_hero_1795341505723.jpg';
import {
  Sparkles,
  CreditCard,
  Layers,
  Calendar,
  ShieldCheck,
  Building2,
  ShoppingCart,
  Activity,
  ArrowRight,
  Upload,
  BarChart3,
  FileText,
  SlidersHorizontal,
  ScanBarcode,
} from 'lucide-react';

interface WorkspaceDirectoryViewProps {
  currentTheme: ThemeMode;
  userProfile: UserProfile | null;
  productsCount: number;
  activeWeeksCount: number;
  clashesCount: number;
  blendedMarginPercent: number;
  crmAccountsCount: number;
  wholesaleOrdersCount: number;
  activityLogsCount: number;
  onNavigateTab: (tab: AppTab) => void;
  onOpenImportModal: () => void;
  onOpenAiOptimizer: () => void;
  onOpenThemeModal: () => void;
  onStartFreeTrial: () => void;
  onBuyAiTopUp: () => void;
  onOpenAuthModal?: () => void;
}

interface DirectoryCardItem {
  id: string;
  title: string;
  description: string;
  meta: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTint: string;
  metaTint?: string;
  onActivate: () => void;
  showTopUp?: boolean;
}

export const WorkspaceDirectoryView: React.FC<WorkspaceDirectoryViewProps> = ({
  currentTheme,
  userProfile,
  productsCount,
  activeWeeksCount,
  clashesCount,
  blendedMarginPercent,
  crmAccountsCount,
  wholesaleOrdersCount,
  activityLogsCount,
  onNavigateTab,
  onOpenImportModal,
  onOpenAiOptimizer,
  onOpenThemeModal,
  onStartFreeTrial,
  onBuyAiTopUp,
  onOpenAuthModal,
}) => {
  const isLight = currentTheme.includes('light');
  const { currency } = useActiveCurrency();

  const planLabel =
    userProfile?.subscriptionTier === 'enterprise_tier'
      ? 'Enterprise'
      : userProfile?.subscriptionTier === 'pro_planner'
      ? 'Growth Plan'
      : userProfile?.subscriptionTier === 'starter_plan'
      ? 'Starter Plan'
      : 'Free Forever';

  const maxSkus = userProfile?.maxSkusAllowed ?? 1;
  const aiRemaining = (userProfile?.aiGenerationsRemaining ?? 1) + (userProfile?.aiTopUpCredits ?? 0);
  const firstName = userProfile?.firstName || userProfile?.displayName?.split(' ')[0];

  const cardClass = isLight
    ? 'bg-white border-slate-200/90 hover:border-indigo-300 shadow-xs'
    : 'bg-[#121624] border-slate-800 hover:border-indigo-600';

  const titleClass = isLight ? 'text-slate-900' : 'text-slate-50';
  const descClass = isLight ? 'text-slate-600' : 'text-slate-400';
  const metaClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const dividerClass = isLight ? 'border-slate-200/80' : 'border-slate-800';

  const coreTools: DirectoryCardItem[] = [
    {
      id: 'calendar',
      title: '52-Week Promotional Calendar',
      description: 'Schedule retail promotions across the full 52-week year with drag-and-drop slotting.',
      meta: `${activeWeeksCount} active weeks`,
      icon: Calendar,
      iconTint: isLight ? 'text-indigo-600' : 'text-indigo-400',
      onActivate: () => onNavigateTab('calendar'),
    },
    {
      id: 'range',
      title: 'Product Range & SKUs',
      description: 'Manage product pricing, COGS, promotional rebates, and portfolio catalogs.',
      meta: `${productsCount} / ${maxSkus} SKUs`,
      icon: Layers,
      iconTint: isLight ? 'text-blue-600' : 'text-blue-400',
      onActivate: () => onNavigateTab('catalog'),
    },
    {
      id: 'clashes',
      title: 'Schedule & Rule Check',
      description: 'Verify custom scheduling rules (promo frequency, product & customer clashes) across supermarkets.',
      meta: clashesCount > 0 ? `${clashesCount} conflicts` : '0 conflicts · Clear',
      icon: ShieldCheck,
      iconTint: clashesCount > 0 ? 'text-rose-500' : 'text-emerald-600',
      metaTint: clashesCount > 0
        ? isLight ? 'text-rose-600 font-semibold' : 'text-rose-400 font-semibold'
        : isLight ? 'text-emerald-700' : 'text-emerald-400',
      onActivate: () => onNavigateTab('clashes'),
    },
    {
      id: 'analytics',
      title: 'Trade Waterfall & Analytics',
      description: 'Analyse gross-to-net trade spend waterfalls, scan funding rebates, and promo ROI.',
      meta: `${blendedMarginPercent.toFixed(1)}% promo margin`,
      icon: BarChart3,
      iconTint: isLight ? 'text-emerald-600' : 'text-emerald-400',
      onActivate: () => onNavigateTab('analytics'),
    },
    {
      id: 'executive-briefing',
      title: 'Executive JBP Pitch Deck',
      description: 'Build retail buyer joint business plan slides, margin waterfalls, and commercial exports.',
      meta: 'Buyer JBP Studio',
      icon: FileText,
      iconTint: isLight ? 'text-violet-600' : 'text-violet-400',
      onActivate: () => onNavigateTab('executive-briefing'),
    },
    {
      id: 'commercial-insights',
      title: 'Commercial Insights & Optimizer',
      description: 'Surface profit recovery opportunities, margin risk alerts, and optimal 52-week schedules.',
      meta: userProfile?.unlimitedAi ? 'Unlimited runs' : `${aiRemaining} runs`,
      icon: Sparkles,
      iconTint: isLight ? 'text-indigo-600' : 'text-indigo-400',
      onActivate: () => onNavigateTab('commercial-insights'),
    },
    {
      id: 'crm',
      title: 'Partner CRM & Terms',
      description: 'Manage buyer relationships, range review deals, and scan-based trading terms.',
      meta: `${crmAccountsCount} accounts`,
      icon: Building2,
      iconTint: isLight ? 'text-sky-600' : 'text-sky-400',
      onActivate: () => onNavigateTab('crm'),
    },
    {
      id: 'wholesale',
      title: 'Wholesale Carton Orders',
      description: 'Track wholesale carton orders, settlement terms, and dead-net margins.',
      meta: wholesaleOrdersCount > 0 ? `${wholesaleOrdersCount} active POs` : 'Contracts & Orders',
      icon: ShoppingCart,
      iconTint: isLight ? 'text-amber-600' : 'text-amber-400',
      onActivate: () => onNavigateTab('wholesale'),
    },
    {
      id: 'scan-order',
      title: 'Scan & Order (PO Builder)',
      description: 'Scan aisle barcodes, auto-split orders by supplier, and export Australian A4 POs.',
      meta: 'Mobile Barcode Terminal',
      icon: ScanBarcode,
      iconTint: isLight ? 'text-blue-600' : 'text-blue-400',
      onActivate: () => onNavigateTab('scan-order'),
    },
  ];

  const accountAndSettingsTools: DirectoryCardItem[] = [
    {
      id: 'subscription',
      title: 'Subscription & Plan',
      description: 'Review tier inclusions, live SKU & AI usage quotas, upgrade or schedule a downgrade.',
      meta: planLabel,
      icon: Sparkles,
      iconTint: isLight ? 'text-indigo-600' : 'text-indigo-400',
      showTopUp: true,
      onActivate: () => onNavigateTab('billing'),
    },
    {
      id: 'billing',
      title: 'Billing & ATO Tax Invoices',
      description: 'Update payment methods, ABN invoice details, and download official GST tax receipts.',
      meta: userProfile ? 'Billing active' : 'PayPal · Card',
      icon: CreditCard,
      iconTint: isLight ? 'text-emerald-600' : 'text-emerald-400',
      onActivate: () => onNavigateTab('billing'),
    },
    {
      id: 'appearance',
      title: 'Appearance & Display Settings',
      description: 'Switch light or dark workspace themes and configure currency display preferences.',
      meta: `${isLight ? 'Light' : 'Dark'} · ${currency}`,
      icon: SlidersHorizontal,
      iconTint: isLight ? 'text-slate-600' : 'text-slate-300',
      onActivate: onOpenThemeModal,
    },
    {
      id: 'activity',
      title: 'Activity History',
      description: 'Inspect timestamped account changes, calendar edits, and billing updates.',
      meta: `${activityLogsCount} ${activityLogsCount === 1 ? 'entry' : 'entries'}`,
      icon: Activity,
      iconTint: isLight ? 'text-slate-600' : 'text-slate-400',
      onActivate: () => onNavigateTab('activity-log'),
    },
  ];

  const renderCard = (item: DirectoryCardItem) => {
    const Icon = item.icon;
    return (
      <div
        key={item.id}
        onClick={item.onActivate}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.onActivate();
          }
        }}
        className={`group rounded-2xl border p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${cardClass}`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <Icon className={`w-5 h-5 shrink-0 ${item.iconTint}`} />
            <span className={`text-xs font-mono tabular-nums ${item.metaTint || metaClass}`}>
              {item.meta}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${titleClass}`}>
              {item.title}
            </h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          <p className={`text-sm leading-relaxed mt-1.5 ${descClass}`}>
            {item.description}
          </p>
        </div>

        {item.showTopUp && (
          <div
            className={`pt-3 mt-1 border-t flex items-center justify-between gap-2 ${
              isLight ? 'border-slate-100' : 'border-slate-800/80'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className={`text-xs font-mono tabular-nums ${metaClass}`}>
              {userProfile?.unlimitedAi ? 'Unlimited AI runs' : `${aiRemaining} AI runs available`}
            </span>
            <button
              type="button"
              onClick={onBuyAiTopUp}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer whitespace-nowrap min-h-[32px] px-1"
            >
              +50 Insight Credits (A$29 inc. GST)
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-fade-in pb-12">
      {/* Centered Executive Hub Hero */}
      <WorkspacePageHero
        stepLabel="Workspace Hub · Commercial Suite"
        title={firstName ? `${firstName}'s Workspace` : 'Commercial Workspace Hub'}
        subtitle="Navigate your 5-step retail planning funnel, audit Custom Rules, or manage team billing and forecast quotas."
        accent="indigo"
        currentTheme={currentTheme}
        heroImageSrc={workspaceHubHeroImg}
        heroImageAlt="Commercial Retail Planning Workspace Illustration"
        FallbackIcon={Layers}
        metaStrip={
          <div className={`flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 ${metaClass}`}>
            <span>{planLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{productsCount} / {maxSkus} SKUs</span>
            <span aria-hidden="true">·</span>
            <span>{userProfile?.unlimitedAi ? 'Unlimited AI runs' : `${aiRemaining} AI runs`}</span>
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => onNavigateTab('calendar')}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Open Promo Calendar</span>
            </button>
            <button
              type="button"
              onClick={onOpenImportModal}
              className={`min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Upload className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Import Product Range</span>
            </button>
          </>
        }
      />

      {/* Band 1 (Top): Main Beneficial Planning & Commercial Tools */}
      <section aria-labelledby="workspace-core-tools-heading" className="space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
            COMMERCIAL PLANNING FUNNEL
          </p>
          <h2 id="workspace-core-tools-heading" className={`text-lg sm:text-2xl font-black tracking-tight ${titleClass}`}>
            Core Planning &amp; Trade Tools
          </h2>
          <p className={`text-sm ${descClass}`}>
            Your primary promotional calendar, SKU margins, compliance audits, and retail account workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coreTools.map(renderCard)}
        </div>
      </section>

      {/* Band 2 (Bottom): Distinctly Tinted Account, Billing, Settings & Activity Section */}
      <section
        aria-labelledby="workspace-admin-tools-heading"
        className={`rounded-3xl border p-5 sm:p-7 space-y-5 ${
          isLight
            ? 'bg-slate-100/80 border-slate-200/90'
            : 'bg-[#0d1220] border-slate-800/90'
        }`}
      >
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            WORKSPACE GOVERNANCE
          </p>
          <h2 id="workspace-admin-tools-heading" className={`text-lg sm:text-2xl font-black tracking-tight ${titleClass}`}>
            Account, Billing &amp; Settings
          </h2>
          <p className={`text-sm ${descClass}`}>
            Subscription tiers, ATO tax invoices, display preferences, and workspace activity history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accountAndSettingsTools.map(renderCard)}
        </div>
      </section>

      {/* Guest-only sign-in / trial prompt if viewed unauthenticated */}
      {!userProfile && (
        <div className={`rounded-2xl border p-6 sm:p-7 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                AU
              </div>
              <div>
                <h3 className={`text-lg font-extrabold ${titleClass}`}>Sign in to save your RangeCraft Workspace</h3>
                <p className={`text-sm mt-1 max-w-xl ${descClass}`}>
                  Sync your 52-week promotional calendar, SKU catalogs, and retail terms across sessions.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onStartFreeTrial}
                className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>View Plans</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

