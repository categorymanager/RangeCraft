import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Award, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  TrendingUp,
  Lock,
  Globe
} from 'lucide-react';
import { ThemeMode, UserProfile } from '../types';
import { canClaimFreeTrial, hasActivePaidSubscription } from '../utils/entitlements';

interface AboutCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  userProfile?: UserProfile | null;
  onOpenFreeTrial: () => void;
}

export const AboutCompanyModal: React.FC<AboutCompanyModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  userProfile,
  onOpenFreeTrial,
}) => {
  const isLight = currentTheme.includes('light');
  const trialEligible = canClaimFreeTrial(userProfile);
  const isPaidActive = hasActivePaidSubscription(userProfile);
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoChannel, setDemoChannel] = useState('Supermarket & Grocery');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-3xl rounded-none sm:rounded-3xl border-0 sm:border shadow-2xl flex flex-col overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1422] border-[#1e2638] text-white'
      }`}>
        {/* Fixed Top Close Bar */}
        <div className={`shrink-0 px-4 py-3.5 sm:px-6 sm:py-5 border-b flex items-center justify-between gap-3 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/25 shrink-0">
              AU
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black truncate">About RangeCraft & Omni-Trade AU</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Est. 2024 · Melbourne & Sydney · Enterprise Retail Strategy Platform
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close about modal"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer shrink-0 ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8 space-y-8">
          {/* Mission & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <Building2 className="w-4 h-4" />
              <span>Our Mission</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight leading-snug">
              Eliminating Trade Spend Leakage & Empowering Australian Suppliers to Win at the Shelf.
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              RangeCraft was founded by veteran Australian FMCG commercial directors, key account executives, and machine learning engineers. Our platform bridges the gap between supplier profitability and retail buyer requirements across major grocery channels, mass department store networks, wellness retailers, and independent distributor groups.
            </p>
          </div>

          {/* Core Trust Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold mb-1">Custom Rules Enforced</h4>
              <p className="text-xs text-slate-400">Built-in algorithmic validation for configurable 4-week promotional hiatus spacing and margin floors.</p>
            </div>

            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold mb-1">Commercial Forecast Engine</h4>
              <p className="text-xs text-slate-400">Simulate price elasticity, scan rebates, and volume lifts across 52 annual promotional cycles.</p>
            </div>

            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold mb-1">Australian Data Sovereignty</h4>
              <p className="text-xs text-slate-400">Encrypted trade secrets and margin ledgers hosted securely with Sydney & Melbourne failover.</p>
            </div>
          </div>

          {/* Live Numbers & Proof */}
          <div className={`p-6 rounded-2xl border ${isLight ? 'bg-blue-50/50 border-blue-200' : 'bg-blue-950/20 border-blue-800/40'}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">Platform Impact at a Glance</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">$48M+</div>
                <div className="text-xs text-slate-400 mt-0.5">Trade Spend Modelled</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-blue-400">450+</div>
                <div className="text-xs text-slate-400 mt-0.5">FMCG & Retail Brands</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400">0</div>
                <div className="text-xs text-slate-400 mt-0.5">Custom Rule Breaches</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">3.8x</div>
                <div className="text-xs text-slate-400 mt-0.5">Average Promo ROI</div>
              </div>
            </div>
          </div>

          {/* Interactive Demo Request Form */}
          <div className={`p-6 rounded-3xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold">Demo Request Received!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Our Australian Commercial Director will reach out within 2 business hours to schedule your 15-minute tailored walkthrough.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenFreeTrial();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {isPaidActive
                    ? 'View Plan & Billing'
                    : trialEligible
                    ? 'Start 14-Day Free Trial While You Wait'
                    : 'View Plans & Upgrade'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h4 className="text-base font-bold">Book a 15-Minute Tailored Strategy Demo</h4>
                  <p className="text-xs text-slate-400 mt-0.5">See how RangeCraft fits your specific retail channels and SKU range.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      placeholder="sarah@yourbrand.com.au"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Brand / Company</label>
                    <input
                      type="text"
                      required
                      value={demoCompany}
                      onChange={(e) => setDemoCompany(e.target.value)}
                      placeholder="e.g. Byron Bay Organics"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Primary Retail Channel</label>
                    <select
                      value={demoChannel}
                      onChange={(e) => setDemoChannel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Supermarket & Grocery">Supermarket & Grocery Channels</option>
                      <option value="Independent Distributors">Independent Grocers & Wholesale network</option>
                      <option value="Pharmacy & Wellness">National Pharmacy & Health networks</option>
                      <option value="Hardware & Mass Merchant">Mass Merchants & Hardware networks</option>
                      <option value="Amazon / D2C">E-commerce / Multi-Channel / D2C</option>
                      <option value="Wholesale Distributor">Wholesale & Foodservice</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>No sales pitch • Pure ROI modeling</span>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all hover:scale-105"
                  >
                    Request Free Strategy Session
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
