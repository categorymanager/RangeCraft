import React, { useState } from 'react';
import { AI_TOPUP_PACK, PRICING_PLANS, upgradeSubscription } from '../lib/firebase';
import { UserProfile, SubscriptionTier, ThemeMode, CheckoutPlanType } from '../types';
import { ONE_OFF_SERVICES } from '../data/adminAnalyticsData';
import { canClaimFreeTrial, hasActivePaidSubscription } from '../utils/entitlements';
import {
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Layers,
  FileText
} from 'lucide-react';

interface PricingPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpgradeSuccess: (updatedProfile: UserProfile) => void;
  onRequireAuth: () => void;
  currentTheme: ThemeMode;
  featureTriggered?: string;
  onLogCreatorTransaction?: (
    itemTitle: string,
    itemType: any,
    amountAud: number,
    paymentMethod: 'paypal' | 'credit_card' | 'bank_transfer',
    paypalTxnId?: string
  ) => void;
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

export const PricingPaywallModal: React.FC<PricingPaywallModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgradeSuccess,
  onRequireAuth,
  currentTheme,
  featureTriggered = 'Commercial Tools',
  onOpenEnterpriseQuote,
  onStartCheckout,
}) => {
  const isLight = currentTheme.includes('light');
  const [modalMode, setModalMode] = useState<'subscriptions' | 'comparison' | 'one_off_services'>('subscriptions');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const trialEligible = canClaimFreeTrial(user);
  const isPaidActive = hasActivePaidSubscription(user);
  const visiblePlans = PRICING_PLANS.filter((p) => (trialEligible && !isPaidActive) || p.id !== 'free_trial');

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === 'free_trial') {
      onClose();
      return;
    }

    if (tier === 'enterprise_tier') {
      onClose();
      if (onOpenEnterpriseQuote) {
        onOpenEnterpriseQuote();
      }
      return;
    }

    const planObj = PRICING_PLANS.find((p) => p.id === tier);
    const priceAud = billingCycle === 'annual' ? (planObj?.annualPriceAud || 590) : (planObj?.priceAud || 59);

    if (onStartCheckout) {
      onClose();
      onStartCheckout({
        exportId: tier,
        itemName: planObj?.name || (tier === 'starter_plan' ? 'Starter Plan' : 'Pro'),
        priceAud,
        planType: tier === 'starter_plan' ? 'starter_subscription' : 'pro_subscription',
        billingCycle,
        excludesGst: false,
      });
      return;
    }

    if (!user) {
      onClose();
      onRequireAuth();
      return;
    }

    setLoading(true);
    try {
      const updated = await upgradeSubscription(user.uid, tier, user.companyName);
      setSuccessMessage(`Activated ${planObj?.name || 'Commercial Plan'}!`);
      setTimeout(() => {
        onUpgradeSuccess(updated);
        onClose();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTopUp = () => {
    if (onStartCheckout) {
      onClose();
      onStartCheckout({
        exportId: AI_TOPUP_PACK.id,
        itemName: AI_TOPUP_PACK.name,
        priceAud: AI_TOPUP_PACK.priceAud,
        planType: 'ai_topup',
        excludesGst: false,
      });
    } else if (!user) {
      onClose();
      onRequireAuth();
    }
  };

  const handleBuyOneOffService = (service: (typeof ONE_OFF_SERVICES)[number]) => {
    if (onStartCheckout) {
      onClose();
      onStartCheckout({
        exportId: service.id,
        itemName: service.title,
        priceAud: service.priceAud,
        planType: 'one_off_service',
        excludesGst: false,
      });
      return;
    }
    if (!user) {
      onClose();
      onRequireAuth();
    }
  };

  const modalBg = isLight
    ? 'bg-[#FFFFFF] border-slate-200 text-slate-900'
    : 'bg-[#0F1422] border-slate-800 text-slate-100';
  const cardBg = isLight ? 'bg-slate-50/60 border-slate-200' : 'bg-[#131A2C] border-slate-800';
  const headingText = isLight ? 'text-slate-900' : 'text-slate-50';
  const subText = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <div className="fixed inset-0 z-[90] flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-6xl rounded-none sm:rounded-3xl border-0 sm:border shadow-2xl flex flex-col overflow-hidden ${modalBg}`}>
        {/* Fixed Top Close Bar */}
        <div
          className={`shrink-0 px-4 py-3 sm:px-8 sm:py-4 border-b flex items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0F1422] border-slate-800'
          }`}
        >
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#4F46E5] dark:text-indigo-400 truncate">
            {featureTriggered ? `UNLOCK · ${featureTriggered.toUpperCase()}` : 'COMMERCIAL PRICING & PLANS'}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pricing modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8 space-y-7">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${headingText}`}>
              Plans Built for Every Stage of Retail Growth
            </h2>
            <p className={`text-xs sm:text-sm ${subText}`}>
              {trialEligible
                ? 'Start with 14-day Growth access or pick the commercial tier and one-off package your team needs. All prices include GST (inc. GST).'
                : 'Choose or upgrade your commercial tier, add scenario top-up credits, or book advisory support. All prices include GST (inc. GST).'}
            </p>

            {/* Mode Switcher */}
            <div className="pt-2 flex justify-center">
              <div
                className={`inline-flex flex-wrap items-center justify-center p-1 rounded-2xl border gap-1 text-xs font-bold ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setModalMode('subscriptions')}
                  className={`px-4 py-2 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    modalMode === 'subscriptions'
                      ? 'bg-[#4F46E5] text-[#FFFFFF] shadow-xs'
                      : subText
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Plans &amp; Top-Ups</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('comparison')}
                  className={`px-4 py-2 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    modalMode === 'comparison'
                      ? 'bg-[#059669] text-[#FFFFFF] shadow-xs'
                      : subText
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Feature Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('one_off_services')}
                  className={`px-4 py-2 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    modalMode === 'one_off_services'
                      ? 'bg-[#2563EB] text-[#FFFFFF] shadow-xs'
                      : subText
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>3-Step Advisory Services</span>
                </button>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: PLANS & AI TOP-UP */}
          {modalMode === 'subscriptions' && (
            <div className="space-y-6">
              {/* Annual vs Monthly Toggle */}
              <div className="flex justify-center">
                <div
                  className={`inline-flex items-center p-1 rounded-2xl border text-xs font-bold ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer ${
                      billingCycle === 'annual' ? 'bg-[#4F46E5] text-[#FFFFFF]' : subText
                    }`}
                  >
                    <span>Annual Billing</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#10B981] text-[#FFFFFF] text-[9px] font-black">
                      2 MONTHS FREE
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
                      billingCycle === 'monthly'
                        ? isLight
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'bg-slate-800 text-white'
                        : subText
                    }`}
                  >
                    Monthly Billing
                  </button>
                </div>
              </div>

              {/* Tier Grid */}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${visiblePlans.length <= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-5 items-stretch`}>
                {visiblePlans.map((plan) => {
                  const isFree = plan.id === 'free_trial';
                  const isStarter = plan.id === 'starter_plan';
                  const isPro = plan.id === 'pro_planner';
                  const isEnterprise = plan.id === 'enterprise_tier';
                  const isCurrent = user?.subscriptionTier === plan.id;

                  const priceLabel = isEnterprise
                    ? 'Custom Quote'
                    : isFree
                    ? '$0'
                    : billingCycle === 'annual'
                    ? `$${plan.annualPriceAud.toLocaleString()}`
                    : `$${plan.priceAud}`;

                  if (isPro) {
                    return (
                      <div
                        key={plan.id}
                        className="rounded-2xl border-2 border-[#4F46E5] bg-[#111338] p-6 flex flex-col justify-between text-[#F8FAFC] shadow-xl"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#A5B4FC]">
                              {trialEligible ? plan.badgeLabel : 'MOST POPULAR · COMMERCIAL PRO'}
                            </p>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1E2356] text-[#A5B4FC]">
                                Active
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-black mt-1.5 text-[#FFFFFF]">{plan.name}</h3>
                          <p className="text-xs text-[#CBD5E1] mt-1.5">{plan.tagline}</p>

                          <div className="my-5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-black font-mono tabular-nums text-[#A5B4FC]">
                                {priceLabel}
                              </span>
                              <span className="text-xs text-[#CBD5E1]">
                                / {billingCycle === 'annual' ? 'year' : 'mo'} inc. GST
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-[#34D399] mt-1">
                              {billingCycle === 'annual' ? '2 months free ($149/mo standard)' : 'Or $1,490/yr (2 months free)'}
                            </p>
                          </div>

                          <ul className="space-y-2 text-xs text-[#E2E8F0] mb-6">
                            {plan.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                <span>{feat.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectPlan(plan.id)}
                          disabled={loading || isCurrent}
                          className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-colors ${
                            isCurrent
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] cursor-pointer'
                          }`}
                        >
                          {isCurrent
                            ? 'Current Active Plan'
                            : trialEligible
                            ? plan.ctaText
                            : 'Upgrade to Growth Plan'}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={plan.id} className={`rounded-2xl border p-6 flex flex-col justify-between ${cardBg}`}>
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {plan.badgeLabel}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                              Active
                            </span>
                          )}
                        </div>
                        <h3 className={`text-xl font-black mt-1.5 ${headingText}`}>{plan.name}</h3>
                        <p className={`text-xs mt-1.5 ${subText}`}>{plan.tagline}</p>

                        <div className="my-5">
                          {isEnterprise ? (
                            <>
                              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">Custom Quote</div>
                              <p className={`text-[11px] mt-1 ${subText}`}>Scoped to your brands &amp; systems (inc. GST)</p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-baseline gap-1.5">
                                <span className={`text-3xl font-black font-mono tabular-nums ${headingText}`}>
                                  {priceLabel}
                                </span>
                                <span className={`text-xs ${subText}`}>
                                  {isFree ? 'inc. GST · Forever' : `/ ${billingCycle === 'annual' ? 'year' : 'mo'} inc. GST`}
                                </span>
                              </div>
                              {isStarter && (
                                <p className="text-[11px] font-bold text-[#059669] dark:text-emerald-400 mt-1">
                                  {billingCycle === 'annual' ? '2 months free ($59/mo standard)' : 'Or $590/yr (2 months free)'}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        <ul className={`space-y-2 text-xs mb-6 ${subText}`}>
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                              <span>{feat.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={loading || isCurrent}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-colors inline-flex items-center justify-center gap-1.5 ${
                          isCurrent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 cursor-default'
                            : isEnterprise
                            ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] cursor-pointer'
                            : isStarter
                            ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] cursor-pointer'
                            : isLight
                            ? 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 cursor-pointer'
                            : 'bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 cursor-pointer'
                        }`}
                      >
                        <span>{isCurrent ? 'Current Active Plan' : plan.ctaText}</span>
                        {!isCurrent && (isFree || isStarter) && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* AI Top-Up Bar */}
              <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className={`text-sm font-extrabold ${headingText}`}>
                      {AI_TOPUP_PACK.name} · A${AI_TOPUP_PACK.priceAud} inc. GST
                    </h4>
                    <p className={`text-xs mt-0.5 ${subText}`}>{AI_TOPUP_PACK.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBuyTopUp}
                  className="px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] text-xs font-bold whitespace-nowrap cursor-pointer shrink-0"
                >
                  Buy +50 Runs (A${AI_TOPUP_PACK.priceAud} inc. GST)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: COMPARISON MATRIX */}
          {modalMode === 'comparison' && (
            <div className="space-y-5">
              <div className={`overflow-x-auto rounded-2xl border ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950'}`}>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={isLight ? 'bg-slate-50 border-b border-slate-200 text-slate-700' : 'bg-slate-900 border-b border-slate-800 text-slate-200'}>
                      <th className="p-4 font-bold">Capability</th>
                      <th className="p-4 font-bold text-center">Free Forever ($0)</th>
                      <th className="p-4 font-bold text-center text-[#4F46E5]">Starter ($59/mo)</th>
                      <th className="p-4 font-bold text-center text-emerald-600">Pro ($149/mo)</th>
                      <th className="p-4 font-bold text-center text-blue-600">Enterprise (Custom)</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-100 text-slate-700' : 'divide-slate-800 text-slate-300'}`}>
                    <tr>
                      <td className="p-4 font-semibold">Active Product Capacity</td>
                      <td className="p-4 text-center">1 Product</td>
                      <td className="p-4 text-center font-bold">Up to 150 SKUs</td>
                      <td className="p-4 text-center font-bold text-emerald-600">Up to 1,000 SKUs</td>
                      <td className="p-4 text-center font-bold text-blue-600">Up to 5,000 SKUs</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Promotional Calendar</td>
                      <td className="p-4 text-center">H1 Preview</td>
                      <td className="p-4 text-center font-bold">Full 52-Week Grid</td>
                      <td className="p-4 text-center font-bold text-emerald-600">52-Week + Conflict Fix</td>
                      <td className="p-4 text-center font-bold text-blue-600">Multi-Banner Sync</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">AI Scenario Runs / Month</td>
                      <td className="p-4 text-center">1 / month</td>
                      <td className="p-4 text-center font-bold">30 / month</td>
                      <td className="p-4 text-center font-bold text-emerald-600">150 / month</td>
                      <td className="p-4 text-center font-bold text-blue-600">Custom Portfolio</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Exports &amp; Pitch Decks</td>
                      <td className="p-4 text-center">Watermarked PDF</td>
                      <td className="p-4 text-center font-bold">Clean PDF</td>
                      <td className="p-4 text-center font-bold text-emerald-600">PPTX &amp; PDF JBP Packs</td>
                      <td className="p-4 text-center font-bold text-blue-600">Retailer Templates</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">CRM, Wholesale &amp; Spend Tracker</td>
                      <td className="p-4 text-center text-slate-400">Preview only</td>
                      <td className="p-4 text-center text-slate-400">Basic view</td>
                      <td className="p-4 text-center font-bold text-emerald-600">Full Access</td>
                      <td className="p-4 text-center font-bold text-blue-600">ERP &amp; POS Ingestion</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setModalMode('subscriptions')}
                  className="px-6 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] text-xs font-bold cursor-pointer"
                >
                  Back to Plans
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 3-STEP DONE-FOR-YOU SERVICES */}
          {modalMode === 'one_off_services' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {ONE_OFF_SERVICES.map((srv, idx) => (
                  <div key={srv.id} className={`rounded-2xl border p-6 flex flex-col justify-between ${cardBg}`}>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                          {srv.stepBadge}
                        </span>
                        <span className={`text-xs ${subText}`}>{srv.turnaround}</span>
                      </div>
                      <h3 className={`text-base font-black ${headingText}`}>{srv.title}</h3>
                      <div className="mt-2 mb-3 flex items-baseline gap-1.5">
                        <span className={`text-2xl font-black font-mono tabular-nums ${headingText}`}>
                          ${srv.priceAud}
                        </span>
                        <span className={`text-xs ${subText}`}>inc. GST (One-Off)</span>
                      </div>
                      <p className={`text-xs leading-relaxed mb-4 ${subText}`}>{srv.description}</p>
                      <ul className={`space-y-2 text-xs mb-6 ${subText}`}>
                        {srv.deliverables.map((del) => (
                          <li key={del} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                            <span>{del}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyOneOffService(srv)}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Book Step {idx + 1} (${srv.priceAud} inc. GST)</span>
                    </button>
                  </div>
                ))}
              </div>
              <p className={`text-center text-xs ${subText}`}>
                Professional service fees may be tax deductible. Please seek advice from your accountant.
              </p>
            </div>
          )}

          {/* Reassurance Footer */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${cardBg}`}>
            <div className={`flex items-center gap-2.5 ${subText}`}>
              <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>
                {trialEligible
                  ? '14-day Pro confidence guarantee · Australian GST tax invoices with ABN generated automatically.'
                  : 'Instant tier activation · Australian GST tax invoices with ABN generated automatically.'}
              </span>
            </div>
            <span className={`text-[11px] font-semibold shrink-0 ${subText}`}>Major Supermarkets &amp; Chains Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
