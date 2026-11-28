import React from 'react';
import {
  LayoutDashboard,
  SlidersHorizontal,
  Package,
  CalendarDays,
  Calculator,
  TrendingUp,
  FileText,
  Lightbulb,
  Users,
  Link2,
  Settings,
  ShieldCheck,
  LogOut,
  Zap,
  HelpCircle,
  Lock,
  ScanBarcode,
} from 'lucide-react';
import { AppTab, UserProfile } from '../types';
import { RangeCraftLogo } from './RangeCraftLogo';
import { canClaimFreeTrial } from '../utils/entitlements';

interface EnterpriseSidebarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  user: UserProfile | null;
  onOpenAuthModal: () => void;
  onOpenPricingModal: () => void;
  onLogout: () => void;
  skusAtRiskCount?: number;
  clashCount?: number;
  productsCount?: number;
}

export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  activeTab,
  onSelectTab,
  user,
  onOpenAuthModal,
  onOpenPricingModal,
  onLogout,
  skusAtRiskCount = 0,
  clashCount = 0,
  productsCount = 0,
}) => {
  const trialEligible = canClaimFreeTrial(user);
  const isRangeLocked = productsCount === 0;

  const mainNav: Array<{
    id: AppTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    matchTabs?: AppTab[];
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, matchTabs: ['dashboard', 'directory'] },
    { id: 'promotion-builder', label: 'Promotions', icon: SlidersHorizontal, matchTabs: ['promotion-builder', 'week-studio', 'commercial-journey'] },
    { id: 'catalog', label: 'Products', icon: Package, matchTabs: ['catalog', 'deletion-engine'] },
    { id: 'scan-order', label: 'Scan & Order', icon: ScanBarcode },
    { id: 'calendar', label: 'Retail Calendar', icon: CalendarDays },
    { id: 'breakeven-basket', label: 'Margin Simulator', icon: Calculator },
    { id: 'analytics', label: 'Trade Spend', icon: TrendingUp },
    { id: 'executive-briefing', label: 'Reports', icon: FileText },
    {
      id: 'commercial-insights',
      label: 'Commercial Insights',
      icon: Lightbulb,
      badge: skusAtRiskCount + clashCount > 0 ? skusAtRiskCount + clashCount : undefined,
      matchTabs: ['commercial-insights', 'market-intel'],
    },
  ];

  const orgNav: Array<{
    id: AppTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    matchTabs?: AppTab[];
    badge?: number;
  }> = [
    { id: 'crm', label: 'Team', icon: Users },
    { id: 'wholesale', label: 'Integrations', icon: Link2 },
    { id: 'clashes', label: 'Custom Rules', icon: ShieldCheck, badge: clashCount > 0 ? clashCount : undefined },
    { id: 'billing', label: 'Settings', icon: Settings, matchTabs: ['billing', 'activity-log'] },
  ];

  const isNavActive = (item: { id: AppTab; matchTabs?: AppTab[] }) => {
    if (activeTab === item.id) return true;
    return item.matchTabs ? item.matchTabs.includes(activeTab) : false;
  };

  const planLabel =
    user?.subscriptionTier === 'enterprise_tier'
      ? 'Enterprise'
      : user?.subscriptionTier === 'pro_planner'
      ? 'Growth'
      : user?.subscriptionTier === 'starter_plan'
      ? 'Starter'
      : 'Free Plan';

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 bg-[#0F172A] text-slate-200 border-r border-slate-800/90 min-h-[calc(100vh-4rem)] select-none">
      {/* Workspace Brand & Tenant */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className="text-left cursor-pointer focus:outline-none"
        >
          <RangeCraftLogo size="sm" themeVariant="white" showSubtitle={false} />
        </button>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <nav aria-label="Primary Workspace" className="space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item);
            const itemLocked = isRangeLocked && item.id !== 'catalog' && item.id !== 'scan-order';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                title={itemLocked ? 'Upload or add at least 1 SKU in Products to unlock' : item.label}
                className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between gap-2.5 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                    : itemLocked
                    ? 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : itemLocked ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </span>
                {itemLocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                ) : item.badge !== undefined && item.badge > 0 ? (
                  <span
                    className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                      active ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            Organisation
          </div>
          <nav aria-label="Organisation Settings" className="space-y-1">
            {orgNav.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item);
              const itemLocked = isRangeLocked && item.id !== 'billing';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  title={itemLocked ? 'Upload or add at least 1 SKU in Products to unlock' : item.label}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between gap-2.5 transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                      : itemLocked
                      ? 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : itemLocked ? 'text-slate-500' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {itemLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : item.badge !== undefined && item.badge > 0 ? (
                    <span
                      className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                        active ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Account / Plan Card */}
      <div className="p-3 border-t border-slate-800/80 space-y-2.5">
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white truncate">
              {user ? user.companyName || user.displayName || 'Commercial Team' : 'Guest Workspace'}
            </span>
            <span className="text-[11px] font-semibold text-blue-300 shrink-0">{planLabel}</span>
          </div>

          {user ? (
            <div className="text-xs text-slate-400 flex items-center justify-between tabular-nums">
              <span>Scenario credits</span>
              <span className="text-slate-200 font-semibold">
                {user.unlimitedAi ? 'Unlimited' : user.aiGenerationsRemaining ?? 0}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-snug">
              Sign in to save your SKU catalog and 52-week plan.
            </p>
          )}

          {(!user || user.subscriptionTier === 'free_trial') && (
            <button
              type="button"
              onClick={user ? onOpenPricingModal : onOpenAuthModal}
              className="w-full min-h-[36px] px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {!user
                  ? 'Sign In'
                  : trialEligible
                  ? 'Start 14-Day Free Trial'
                  : 'Upgrade Plan'}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => onSelectTab('directory')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer py-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Workspace Hub</span>
          </button>
          {user && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-red-300 flex items-center gap-1 cursor-pointer py-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
