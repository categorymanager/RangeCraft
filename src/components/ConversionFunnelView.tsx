import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  DollarSign, 
  Filter, 
  BarChart3,
  Globe,
  Mail,
  Smartphone,
  Layers
} from 'lucide-react';
import { ThemeMode } from '../types';

interface ConversionFunnelViewProps {
  currentTheme: ThemeMode;
  showToast: (msg: string) => void;
}

export const ConversionFunnelView: React.FC<ConversionFunnelViewProps> = ({ currentTheme, showToast }) => {
  const isLight = currentTheme.includes('light');
  const [funnelSource, setFunnelSource] = useState<'anonymous' | 'retail_buyers' | 'd2c_shoppers' | 'distributors'>('anonymous');
  const [conversionMultiplier, setConversionMultiplier] = useState<number>(1.25);

  // Funnel data calculations
  const baseVisitors = funnelSource === 'anonymous' ? 20000 : funnelSource === 'retail_buyers' ? 3500 : funnelSource === 'd2c_shoppers' ? 45000 : 8500;
  const newLeads = Math.round(baseVisitors * 0.40 * conversionMultiplier);
  const leadsEngaged = Math.round(newLeads * 0.75);
  const closedDeals = Math.round(leadsEngaged * 0.66);
  const estimatedRevenue = closedDeals * 480; // AUD per closed deal / order

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className={`p-6 rounded-3xl border ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121316] border-slate-800 shadow-xl'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Omni-Trade Conversion Funnel & Customer Acquisition Flow</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Purchase Maximisation & Lead Flow Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Model, track, and optimize customer acquisition across digital marketing channels, retail trade pitches, and ecommerce checkout funnels to maximize ROI and closed-won orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={funnelSource}
              onChange={(e) => setFunnelSource(e.target.value as any)}
              aria-label="Filter conversion funnel by target audience"
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="anonymous">Visitor Segment: All Traffic</option>
              <option value="retail_buyers">Retail Category Buyers (Supermarkets & Grocery)</option>
              <option value="d2c_shoppers">D2C E-commerce Shoppers</option>
              <option value="distributors">Wholesale & B2B Distributors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Funnel Visualization (Inspired by 3rd Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Funnel Graphic Column */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border space-y-6 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121316] border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-400" />
              <span>Conversion Funnel Pipeline</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Conversion Efficiency: {((closedDeals / baseVisitors) * 100).toFixed(1)}%
            </span>
          </div>

          {/* Funnel SVG / Tiered Blocks */}
          <div className="space-y-3 py-4 max-w-md mx-auto">
            
            {/* Stage 1: Visitors */}
            <div className="relative group">
              <div className="bg-indigo-600/90 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-lg transition-all text-center clip-funnel-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Visitors / Traffic</div>
                <div className="text-2xl font-black font-mono">{baseVisitors.toLocaleString()}</div>
                <div className="text-[10px] text-indigo-200 mt-0.5">100% of top-of-funnel reach</div>
              </div>
            </div>

            {/* Stage 2: New Leads Generated */}
            <div className="relative group px-6">
              <div className="bg-blue-600/90 hover:bg-blue-600 text-white p-4 rounded-2xl shadow-lg transition-all text-center">
                <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">New Leads Generated</div>
                <div className="text-2xl font-black font-mono">{newLeads.toLocaleString()} <span className="text-xs font-normal">({Math.round((newLeads/baseVisitors)*100)}%)</span></div>
                <div className="text-[10px] text-blue-200 mt-0.5">Captured via Email, SMS & Trade Forms</div>
              </div>
            </div>

            {/* Stage 3: Leads Engaged */}
            <div className="relative group px-12">
              <div className="bg-emerald-600/90 hover:bg-emerald-600 text-white p-4 rounded-2xl shadow-lg transition-all text-center">
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">Leads Engaged</div>
                <div className="text-2xl font-black font-mono">{leadsEngaged.toLocaleString()} <span className="text-xs font-normal">({Math.round((leadsEngaged/newLeads)*100)}%)</span></div>
                <div className="text-[10px] text-emerald-200 mt-0.5">Active product demos & category pitches</div>
              </div>
            </div>

            {/* Stage 4: Closed Won Deals */}
            <div className="relative group px-20">
              <div className="bg-amber-500 hover:bg-amber-600 text-slate-950 p-4 rounded-2xl shadow-lg transition-all text-center font-bold">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-900">Leads with Closed-Won Deals</div>
                <div className="text-2xl font-black font-mono">{closedDeals.toLocaleString()} <span className="text-xs font-normal text-slate-900">({Math.round((closedDeals/leadsEngaged)*100)}%)</span></div>
                <div className="text-[10px] text-slate-900 mt-0.5">Contracts signed & promotional slots booked</div>
              </div>
            </div>

          </div>

          {/* Financial Impact Footer */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Estimated Funnel Revenue Conversion</div>
                <div className="text-lg font-black text-emerald-400 font-mono">${estimatedRevenue.toLocaleString()} AUD</div>
              </div>
            </div>

            <button
              onClick={() => showToast('Funnel optimization strategy synced to active campaign plan.')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
            >
              Optimize Funnel Flow
            </button>
          </div>
        </div>

        {/* Funnel Optimization & Multiplier Controls */}
        <div className={`p-6 rounded-3xl border space-y-6 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121316] border-slate-800'
        }`}>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Acquisition Multipliers</span>
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-300">Conversion Velocity Multiplier</span>
                <span className="font-mono font-bold text-amber-400">{conversionMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.05"
                value={conversionMultiplier}
                onChange={(e) => setConversionMultiplier(parseFloat(e.target.value))}
                className="w-full accent-blue-600 bg-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-1">Adjusts lead conversion rates across email campaigns, SMS reminders, and trade pop-ups.</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300">Top Growth Channels</h4>
              
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>Email Campaign Flows</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">42% Leads</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>SMS Promo Reminders</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">28% Leads</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span>Landing Page Pop-Ups</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">30% Leads</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
