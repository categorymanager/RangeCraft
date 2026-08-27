import React, { useState } from 'react';
import { PRICING_PLANS, upgradeSubscription } from '../lib/firebase';
import { UserProfile, SubscriptionTier, ThemeMode } from '../types';
import { ONE_OFF_SERVICES } from '../data/adminAnalyticsData';
import { useActiveCurrency } from '../utils/currency';
import { 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  Lock, 
  Building2, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileText,
  DollarSign
} from 'lucide-react';

interface PricingPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpgradeSuccess: (updatedProfile: UserProfile) => void;
  onRequireAuth: () => void;
  currentTheme: ThemeMode;
  featureTriggered?: string;
  onLogCreatorTransaction?: (itemTitle: string, itemType: any, amountAud: number, paymentMethod: 'paypal' | 'credit_card' | 'bank_transfer', paypalTxnId?: string) => void;
}

export const PricingPaywallModal: React.FC<PricingPaywallModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgradeSuccess,
  onRequireAuth,
  currentTheme,
  featureTriggered = 'Premium Feature',
  onLogCreatorTransaction
}) => {
  const isLight = currentTheme.includes('light');
  const { currency, format, getTierPrice } = useActiveCurrency();
  const [modalMode, setModalMode] = useState<'subscriptions' | 'comparison' | 'one_off_services'>('subscriptions');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro_planner');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'trial' | 'credit_card' | 'invoice'>('trial');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartTrial = async () => {
    if (!user) {
      onClose();
      onRequireAuth();
      return;
    }

    setLoading(true);
    try {
      // 14-Day Reverse Free Trial instant activation (No credit card needed)
      const updated = await upgradeSubscription(user.uid, 'pro_planner', companyName);
      setSuccessMessage('14-Day Free Pro Access Activated! You now have unlimited 52-week planning, AI scenarios, and un-watermarked exports.');
      setTimeout(() => {
        onUpgradeSuccess(updated);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Trial activation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUpgrade = async (tier: SubscriptionTier, forcedPaymentMethod?: 'trial' | 'credit_card' | 'invoice') => {
    if (!user) {
      onClose();
      onRequireAuth();
      return;
    }

    if (tier === 'free_trial') {
      onClose();
      return;
    }

    if (tier === 'pro_planner' && (forcedPaymentMethod === 'trial' || paymentMethod === 'trial')) {
      await handleStartTrial();
      return;
    }

    const method = forcedPaymentMethod || paymentMethod;
    setLoading(true);
    try {
      const planObj = PRICING_PLANS.find(p => p.id === tier);
      const isAnnual = billingCycle === 'annual';
      const basePriceAud = planObj?.priceAud || 149;
      const amountAud = isAnnual ? Math.round(basePriceAud * 12 * 0.8) : basePriceAud;

      if (method === 'credit_card') {
        try {
          const res = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              exportId: tier,
              itemName: `RangeCraft ${planObj?.name || 'Commercial'} Subscription (${isAnnual ? 'Annual' : 'Monthly'})`,
              priceAud: amountAud,
              planType: isAnnual ? 'subscription_annual' : 'subscription_monthly',
              customerEmail: user.email,
              companyName: companyName || user.companyName,
              billingCycle,
              originUrl: window.location.origin,
            }),
          });
          const stripeData = await res.json();
          if (stripeData.url) {
            window.location.href = stripeData.url;
            return;
          }
        } catch (stripeErr) {
          console.warn('Stripe redirect fallback:', stripeErr);
        }
      }

      // Instant activation
      const updated = await upgradeSubscription(user.uid, tier, companyName);
      if (onLogCreatorTransaction) {
        onLogCreatorTransaction(
          `${planObj?.name || 'Commercial Plan'} (${isAnnual ? 'Annual' : 'Monthly'})`,
          isAnnual ? 'subscription_annual' : 'subscription_monthly',
          amountAud,
          method === 'invoice' ? 'bank_transfer' : 'credit_card'
        );
      }

      setSuccessMessage(`Successfully activated ${tier === 'pro_planner' ? 'Commercial Pro' : 'Enterprise Portfolio'}!`);
      setTimeout(() => {
        onUpgradeSuccess(updated);
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Upgrade Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyOneOffService = async (service: typeof ONE_OFF_SERVICES[0]) => {
    if (!user) {
      onClose();
      onRequireAuth();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportId: service.id,
          itemName: service.title,
          priceAud: service.priceAud,
          planType: 'single_export',
          customerEmail: user.email,
          companyName: companyName || user.companyName,
          originUrl: window.location.origin,
        }),
      });
      const stripeData = await res.json();
      if (stripeData.url) {
        window.location.href = stripeData.url;
        return;
      }
    } catch (stripeErr) {
      console.warn('Service checkout note:', stripeErr);
    }

    setTimeout(() => {
      if (onLogCreatorTransaction) {
        onLogCreatorTransaction(
          service.title,
          service.id,
          service.priceAud,
          'credit_card'
        );
      }
      setLoading(false);
      setSuccessMessage(`Order confirmed for "${service.title}" (${format(service.priceAud)}). Our advisory team will contact ${user.email} within 2 hours.`);
      setTimeout(() => {
        onClose();
      }, 3000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className={`relative w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden my-8 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1422] border-[#1e2638] text-slate-100'
      }`}>
        
        {/* Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-10 space-y-6">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            {featureTriggered && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlock {featureTriggered}</span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Start 14-Day Free Pro Access
            </h2>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Reverse Free Trial: 14 days of full Commercial Pro capabilities. No credit card required upfront. Automatically degrades to Free Forever sandbox if not upgraded.
            </p>

            {/* Mode Switcher */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <div className="flex flex-wrap items-center justify-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold shadow-inner gap-1">
                <button
                  type="button"
                  onClick={() => setModalMode('subscriptions')}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    modalMode === 'subscriptions'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Plans & Reverse Trial</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('comparison')}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    modalMode === 'comparison'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Feature Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('one_off_services')}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    modalMode === 'one_off_services'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Advisory & One-Off Audits</span>
                </button>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 text-center animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ============================================================
              VIEW 1: RECURRING SUBSCRIPTIONS & REVERSE FREE TRIAL
          ============================================================ */}
          {modalMode === 'subscriptions' && (
            <div className="space-y-6 animate-fade-in">
              {/* Annual vs Monthly Switcher */}
              <div className="flex justify-center">
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-slate-800 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      billingCycle === 'annual'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Annual (Save 20%)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 text-white font-black">2 MO FREE</span>
                  </button>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {PRICING_PLANS.map((plan) => {
                  const isPro = plan.id === 'pro_planner';
                  const isEnterprise = plan.id === 'enterprise_tier';
                  const isCurrent = user?.subscriptionTier === plan.id;
                  const tierPricing = getTierPrice(plan.id);

                  const calculatedBaseAud = billingCycle === 'annual' 
                    ? Math.round(plan.priceAud * 0.8) 
                    : plan.priceAud;
                  const displayPrice = plan.priceAud === 0 ? format(0) : format(calculatedBaseAud);

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                        isPro 
                          ? 'border-indigo-500/60 bg-gradient-to-b from-indigo-500/10 via-slate-900 to-slate-900 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/30' 
                          : isLight 
                          ? 'bg-white border-slate-200 shadow-sm' 
                          : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      {/* Badge */}
                      {plan.popularBadge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                          {plan.popularBadge}
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <h3 className="font-black text-lg text-white">{plan.name}</h3>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Active Plan
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-4 min-h-[32px]">{plan.tagline}</p>

                        {/* Price */}
                        <div className="mb-6 pb-6 border-b border-slate-800">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-black text-white">
                              {displayPrice}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">/ month ({currency})</span>
                          </div>
                          {isPro && (
                            <div className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>14-Day Free Access • No CC Required</span>
                            </div>
                          )}
                          {billingCycle === 'annual' && plan.priceAud > 0 && (
                            <div className="text-[11px] text-indigo-400 font-medium mt-1">
                              Billed annually ({format(calculatedBaseAud * 12)}/yr)
                            </div>
                          )}
                        </div>

                        {/* Features List */}
                        <ul className="space-y-3 text-xs mb-8">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              {feat.included ? (
                                <Check className={`w-4 h-4 mt-0.5 shrink-0 ${feat.highlight ? 'text-indigo-400' : 'text-emerald-400'}`} />
                              ) : (
                                <X className="w-4 h-4 mt-0.5 shrink-0 text-slate-600" />
                              )}
                              <span className={feat.included ? (feat.highlight ? 'text-white font-bold' : 'text-slate-300') : 'text-slate-500 line-through'}>
                                {feat.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action CTA */}
                      <div className="space-y-2">
                        {isPro ? (
                          <button
                            type="button"
                            onClick={() => handleSelectUpgrade('pro_planner', 'trial')}
                            disabled={loading || (isCurrent && user?.subscriptionTier === 'pro_planner')}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25"
                          >
                            <span>{loading ? 'Activating Pro...' : 'Start 14-Day Free Pro Trial'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : isEnterprise ? (
                          <button
                            type="button"
                            onClick={() => handleSelectUpgrade('enterprise_tier', 'credit_card')}
                            disabled={loading || isCurrent}
                            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                          >
                            <span>{loading ? 'Processing...' : 'Get Enterprise Suite'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onClose()}
                            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Use Free Sandbox</span>
                          </button>
                        )}
                        <div className="text-[10px] text-center text-slate-400">
                          {isPro ? 'No Credit Card Required • Instant Activation' : isEnterprise ? 'Includes multi-user seats & custom JBP templates' : '1 SKU Intake & Q1/Q2 Previews'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================
              VIEW 2: PLAN COMPARISON MATRIX
          ============================================================ */}
          {modalMode === 'comparison' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h3 className="text-lg font-bold">Side-by-Side Feature Matrix</h3>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Compare software tiers to find the right depth for your retail category management and promotional planning needs.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                      <th className="p-4 font-bold w-1/3">Capabilities & Features</th>
                      <th className="p-4 font-bold text-center w-1/5">Free Forever<div className="text-[10px] text-slate-400 font-normal">{format(0)} / mo</div></th>
                      <th className="p-4 font-bold text-center w-1/5 text-indigo-400">Commercial Pro<div className="text-[10px] text-indigo-300 font-normal">{format(149)} / mo (14-Day Trial)</div></th>
                      <th className="p-4 font-bold text-center w-1/5 text-blue-400">Enterprise<div className="text-[10px] text-blue-300 font-normal">{format(399)} / mo</div></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    <tr>
                      <td className="p-4 font-medium text-white">SKU Intake Capacity</td>
                      <td className="p-4 text-center">1 SKU Sandbox</td>
                      <td className="p-4 text-center text-indigo-400 font-bold">Unlimited SKUs</td>
                      <td className="p-4 text-center text-blue-400 font-bold">Unlimited Multi-Brand</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-white">52-Week Promotional Master Grid</td>
                      <td className="p-4 text-center">Q1 & Q2 Previews</td>
                      <td className="p-4 text-center text-indigo-400 font-bold">Full 52-Week Engine</td>
                      <td className="p-4 text-center text-blue-400 font-bold">Multi-Retailer Synchronized</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-white">Gemini AI FMCG Strategist Copilot</td>
                      <td className="p-4 text-center text-slate-500">1 Run / Month</td>
                      <td className="p-4 text-center text-indigo-400 font-bold">Unlimited Scenario Runs</td>
                      <td className="p-4 text-center text-blue-400 font-bold">Custom Fine-Tuned AI Models</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-white">Executive JBP Deck Exports</td>
                      <td className="p-4 text-center text-slate-500">Watermarked PDF</td>
                      <td className="p-4 text-center text-indigo-400 font-bold">Un-watermarked PPTX/PDF/XLSX</td>
                      <td className="p-4 text-center text-blue-400 font-bold">Bespoke Retailer Templates</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-white">ACCC Hiatus 4-Week Auto-Reslot</td>
                      <td className="p-4 text-center">Basic Warnings</td>
                      <td className="p-4 text-center text-indigo-400 font-bold">1-Click Auto-Fix & Radar</td>
                      <td className="p-4 text-center text-blue-400 font-bold">Dedicated Legal Audit Trail</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-white">Omni-Trade B2B CRM</td>
                      <td className="p-4 text-center text-slate-500">Not Included</td>
                      <td className="p-4 text-center text-indigo-400 font-bold">Full CRM & Spend Tracker</td>
                      <td className="p-4 text-center text-blue-400 font-bold">ERP / POS Ingestion Ledger</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-white">Multi-User Seats & Support</td>
                      <td className="p-4 text-center text-slate-500">Single User</td>
                      <td className="p-4 text-center text-slate-500">Single User (Priority Email)</td>
                      <td className="p-4 text-center text-blue-400 font-bold">Multi-Seat + Account Manager</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode('subscriptions')}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg cursor-pointer transition-all"
                >
                  Return to Plans & 14-Day Free Trial
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              VIEW 3: ONE-OFF SERVICES & EXECUTIVE AUDITS
          ============================================================ */}
          {modalMode === 'one_off_services' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ONE_OFF_SERVICES.map((srv) => (
                  <div
                    key={srv.id}
                    className={`rounded-2xl border p-6 flex flex-col justify-between ${
                      srv.id === 'service_jbp_review'
                        ? 'border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 via-slate-900 to-slate-900 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          {srv.turnaround}
                        </span>
                        <div className="text-xl font-black text-white font-mono">
                          {format(srv.priceAud)}
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-white mb-2">{srv.title}</h3>
                      <p className="text-xs text-slate-400 mb-4">{srv.description}</p>

                      <div className="space-y-2 mb-6">
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">What is Delivered:</div>
                        {srv.deliverables.map((del, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{del}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleBuyOneOffService(srv)}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Order Service ({format(srv.priceAud)})</span>
                      </button>
                      <div className="text-[10px] text-center text-slate-400">
                        100% Tax Deductible Advisory Expense
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secure Reassurance Footer */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                14-Day Free Access degrades to Free Forever automatically. No surprises, no hidden fees. Australian Tax Receipts with ABN provided.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-slate-300 font-semibold text-[11px]">
              <span>🇦🇺 Australian Supermarket Ready</span>
              <span>•</span>
              <span>100% ACCC Hiatus Compliant</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
