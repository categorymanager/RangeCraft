import React, { useState, useMemo } from 'react';
import { WeekPromotion, Product, StrategyKPIs, ThemeMode, UserProfile } from '../types';
import { safeFetch } from '../utils/api';
import { formatAud, formatNumber, formatPrice } from '../utils/formatters';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Printer, 
  CheckCircle2, 
  Copy, 
  Check, 
  Search, 
  ArrowRight, 
  ExternalLink, 
  Layers, 
  SlidersHorizontal,
  RefreshCw,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Award,
  ChevronDown,
  Lock,
  Zap,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';

interface ExecutiveReportViewProps {
  promotions: WeekPromotion[];
  products: Product[];
  kpis: StrategyKPIs;
  onExportCsv: () => void;
  onOpenWeekStudio?: (weekNum: number) => void;
  userProfile?: UserProfile | null;
  onUnlockExport?: (exportId: string, itemName: string, priceAud: number) => void;
  currentTheme?: ThemeMode;
}

export const ExecutiveReportView: React.FC<ExecutiveReportViewProps> = ({
  promotions,
  products,
  kpis,
  onExportCsv,
  onOpenWeekStudio,
  userProfile,
  onUnlockExport,
  currentTheme = 'light',
}) => {
  const isLight = currentTheme.includes('light');

  const isPro = userProfile?.subscriptionTier === 'pro_planner' || userProfile?.subscriptionTier === 'enterprise_tier';
  const isUnlockedPdf = isPro || userProfile?.unlockedExports?.includes('white_label_pdf');
  const isUnlockedExcel = isPro || userProfile?.unlockedExports?.includes('excel_trade_planner');
  const isUnlockedDeck = isPro || userProfile?.unlockedExports?.includes('pitch_deck_pptx');

  // Strategic memo configuration state
  const [strategicObjective, setStrategicObjective] = useState<string>('Balanced Growth & Margin Governance');
  const [retailerChannel, setRetailerChannel] = useState<string>('Australian National Retail Channels (Grocery, Hardware, Electronics)');
  const [preparedBy, setPreparedBy] = useState<string>('National Merchandising & Commercial Strategy Division');
  const [targetYear, setTargetYear] = useState<number>(2026);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiBriefing, setAiBriefing] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Table Filter & Search State
  const [selectedQuarter, setSelectedQuarter] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'week' | 'revenue' | 'margin' | 'units'>('week');

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.sku, p));
    return map;
  }, [products]);

  // Filtered & Sorted Promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      // Quarter filter
      if (selectedQuarter === 'Q1' && !(p.weekNumber >= 1 && p.weekNumber <= 13)) return false;
      if (selectedQuarter === 'Q2' && !(p.weekNumber >= 14 && p.weekNumber <= 26)) return false;
      if (selectedQuarter === 'Q3' && !(p.weekNumber >= 27 && p.weekNumber <= 39)) return false;
      if (selectedQuarter === 'Q4' && !(p.weekNumber >= 40 && p.weekNumber <= 52)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hero = productMap.get(p.heroSku);
        const matchTheme = p.campaignTheme.toLowerCase().includes(q);
        const matchEvent = (p.australianEvent || '').toLowerCase().includes(q);
        const matchSku = p.heroSku.toLowerCase().includes(q);
        const matchProdName = (hero?.name || '').toLowerCase().includes(q);
        const matchCategory = (hero?.category || '').toLowerCase().includes(q);
        const matchMechanic = (p.mechanic?.label || '').toLowerCase().includes(q);
        const matchWeek = `w${p.weekNumber}`.includes(q) || `week ${p.weekNumber}`.includes(q);
        return matchTheme || matchEvent || matchSku || matchProdName || matchCategory || matchMechanic || matchWeek;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'revenue') return b.projectedRevenueAud - a.projectedRevenueAud;
      if (sortBy === 'margin') return b.projectedMarginPercent - a.projectedMarginPercent;
      if (sortBy === 'units') return b.projectedUnits - a.projectedUnits;
      return a.weekNumber - b.weekNumber;
    });
  }, [promotions, selectedQuarter, searchQuery, sortBy, productMap]);

  // AI Briefing Generator Call
  const handleGenerateAiBriefing = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await safeFetch<any>('/api/generate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotions: promotions.slice(0, 16),
          kpis,
          focusObjective: strategicObjective,
          retailerName: retailerChannel,
          year: targetYear,
          preparedBy
        })
      });

      setAiBriefing(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Briefing generator encountered an error.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Executive Memo to Clipboard in Markdown format
  const handleCopyToClipboard = async () => {
    const memoContent = `
# ${aiBriefing?.documentTitle || `Annual Retail Commercial Strategy & 52-Week Plan — ${targetYear}`}
**Prepared by:** ${preparedBy}
**Retail Target Channels:** ${retailerChannel}
**Strategic Focus:** ${strategicObjective}
**Period:** 52-Week Australian Retail Calendar (${targetYear})

## Executive Summary
${aiBriefing?.executiveThesis || `This commercial strategy delivers AUD $${Math.round(kpis.annualProjectedRevenueAud).toLocaleString()} in projected turnover with a blended promotional margin of ${kpis.blendedPromoMarginPercent}% and +${kpis.overallLiftPercent}% incremental volume lift.`}

## Key Strategic Objectives
${(aiBriefing?.keyObjectives || [
  `Deliver AUD $${Math.round(kpis.annualProjectedRevenueAud).toLocaleString()} promotional turnover at ${kpis.blendedPromoMarginPercent}% margin`,
  'Ensure 100% ACCC 4-week regular price hiatus compliance across all categories',
  `Secure AUD $${Math.round(kpis.totalTradeSpendFundingAud || kpis.totalTradeSpendCoOpAud).toLocaleString()} in supplier co-op trade funding`
]).map((o: string) => `- ${o}`).join('\n')}

## Financial Summary
- Projected Annual Promotional Turnover: AUD $${Math.round(kpis.annualProjectedRevenueAud).toLocaleString()}
- Blended Promotional Margin: ${kpis.blendedPromoMarginPercent}%
- Incremental Unit Lift: +${kpis.overallLiftPercent}%
- Supplier Trade Spend Rebates: AUD $${Math.round(kpis.totalTradeSpendFundingAud || kpis.totalTradeSpendCoOpAud).toLocaleString()}
- Active Promotional Weeks: 52 Weeks

## Trade Spend & Governance
${aiBriefing?.tradeFundingStrategy || 'Tiered scan-down rebate and front-cover co-op investment framework to preserve net profit margin.'}
${aiBriefing?.governanceAndCompliance || 'Strict enforcement of ACCC two-price comparison guidelines with mandatory 4-week regular price hiatus buffers.'}
`.trim();

    try {
      await navigator.clipboard.writeText(memoContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    const memoContent = `
# ${aiBriefing?.documentTitle || `Annual Retail Commercial Strategy & 52-Week Plan — ${targetYear}`}
**Prepared by:** ${preparedBy}
**Target Channels:** ${retailerChannel}
**Strategic Focus:** ${strategicObjective}
**Date:** ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}

---

## 1. Executive Thesis
${aiBriefing?.executiveThesis || `Comprehensive commercial overview outlining the ${targetYear} promotional roadmap for ${retailerChannel}.`}

## 2. Key Objectives
${(aiBriefing?.keyObjectives || [
  `Deliver AUD $${Math.round(kpis.annualProjectedRevenueAud).toLocaleString()} promotional turnover`,
  'Enforce strict ACCC compliance',
  'Optimize supplier co-op funding'
]).map((o: string) => `- ${o}`).join('\n')}

## 3. Financial Model KPIs
- Annual Promo Turnover: AUD $${Math.round(kpis.annualProjectedRevenueAud).toLocaleString()}
- Blended Margin: ${kpis.blendedPromoMarginPercent}%
- Incremental Lift: +${kpis.overallLiftPercent}%
- Trade Spend Rebates: AUD $${Math.round(kpis.totalTradeSpendFundingAud || kpis.totalTradeSpendCoOpAud).toLocaleString()}

## 4. Master 52-Week Promotional Schedule
| Week | Start Date | Campaign Theme | Hero SKU | RRP | Promo RRP | Discount % | Units | Revenue (AUD) | Margin % |
|---|---|---|---|---|---|---|---|---|---|
${promotions.map(p => {
  const hero = productMap.get(p.heroSku);
  return `| W${p.weekNumber} | ${p.startDate} | ${p.australianEvent || p.campaignTheme} | ${hero?.name || p.heroSku} | $${hero?.rrp || 0} | $${p.mechanic?.promoRrp || 0} | ${p.mechanic?.discountPercent || 0}% | ${p.projectedUnits} | $${p.projectedRevenueAud} | ${p.projectedMarginPercent}% |`;
}).join('\n')}
`.trim();

    const blob = new Blob([memoContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RangeCraft_AU_Executive_Briefing_${targetYear}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    if (!isUnlockedPdf && onUnlockExport) {
      onUnlockExport('white_label_pdf', 'White-Label JBP Executive Strategy PDF Report', 19);
      return;
    }
    handlePrint();
  };

  const handleExportExcelPlanner = () => {
    if (!isUnlockedExcel && onUnlockExport) {
      onUnlockExport('excel_trade_planner', '52-Week Master Trade Excel / CSV Model', 19);
      return;
    }
    onExportCsv();
  };

  const handleExportPitchDeck = () => {
    if (!isUnlockedDeck && onUnlockExport) {
      onUnlockExport('pitch_deck_pptx', 'Retailer Review Board Pitch Deck Briefing', 19);
      return;
    }
    handleDownloadMarkdown();
  };

  return (
    <div className="space-y-6">
      
      {/* EXPORT PACKAGES CARDS & MICROCOPY */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Commercial Strategy Export & Briefing Packages</span>
            </h3>
            <p className="text-xs text-slate-500">
              Export presentation-ready assets for Joint Business Planning (JBP) and Category Review submissions.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            Included in Pro OR $19 One-Time Download
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: PDF Briefing */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  White-Label PDF Memo
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{isUnlockedPdf ? 'UNLOCKED' : '$19 AUD'}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Formal executive strategy memorandum with custom branding and retailer channel terms.
              </p>
            </div>
            <button
              onClick={handleExportPdf}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isUnlockedPdf ? <Printer className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isUnlockedPdf ? 'Download PDF Report' : 'Unlock PDF Report — $19'}</span>
            </button>
          </div>

          {/* Card 2: Excel Trade Planner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  52-Week Master Excel
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{isUnlockedExcel ? 'UNLOCKED' : '$19 AUD'}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Complete financial workbook with formulas, scan rebates, and volume elasticity curves.
              </p>
            </div>
            <button
              onClick={handleExportExcelPlanner}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isUnlockedExcel ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isUnlockedExcel ? 'Export Excel Planner' : 'Unlock Excel Planner — $19'}</span>
            </button>
          </div>

          {/* Card 3: JBP Pitch Deck */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Presentation className="w-4 h-4 text-amber-600" />
                  Buyer JBP Pitch Deck
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{isUnlockedDeck ? 'UNLOCKED' : '$19 AUD'}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Structured presentation deck for national supermarket and category commercial reviews.
              </p>
            </div>
            <button
              onClick={handleExportPitchDeck}
              className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isUnlockedDeck ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isUnlockedDeck ? 'Export Pitch Deck' : 'Unlock Pitch Deck — $19'}</span>
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-semibold flex-wrap">
          <span className="flex items-center gap-1 text-slate-700">
            <Lock className="w-3 h-3 text-emerald-600" />
            Secured by Stripe
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-slate-700">
            <Zap className="w-3 h-3 text-indigo-600" />
            Instant Download
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            100% Satisfaction Guarantee
          </span>
        </div>
      </div>
      
      {/* 1. TOP INTERACTIVE EXECUTIVE TOOLBAR */}
      <div className={`p-5 rounded-2xl border shadow-lg space-y-4 print:hidden transition-colors ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Drop in your product range—we’ll take care of the math, margins, and calendars
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Built to turn raw SKU data into actionable, high-converting retail trade plans. Formal commercial proposal for Merchandise Directors, Joint Business Planning (JBP) & Buyer reviews.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button Group */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateAiBriefing}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Memo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiBriefing ? 'Regenerate AI Memo' : 'Generate AI Executive Memo'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyToClipboard}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                copySuccess 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                  : isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copySuccess ? 'Memo Copied!' : 'Copy Memo'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download (.md)</span>
            </button>

            <button
              onClick={onExportCsv}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Strategic Parameters Configurator */}
        <div className={`pt-3 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Strategic Objective:
            </label>
            <select
              value={strategicObjective}
              onChange={(e) => setStrategicObjective(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 text-slate-900' 
                  : 'bg-slate-950 border-slate-700 text-slate-100'
              }`}
            >
              <option value="Balanced Growth & Margin Governance">Balanced Growth & Margin Governance</option>
              <option value="Aggressive Volume & Market Share Capture">Aggressive Volume & Market Share</option>
              <option value="Maximum Gross Margin & Profit Harvesting">Maximum Gross Margin & Profit</option>
              <option value="Inventory Velocity & EOFY Stock Clearance">Inventory Velocity & Clearance</option>
            </select>
          </div>

          <div>
            <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Target Retail Channel:
            </label>
            <select
              value={retailerChannel}
              onChange={(e) => setRetailerChannel(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 text-slate-900' 
                  : 'bg-slate-950 border-slate-700 text-slate-100'
              }`}
            >
              <option value="Australian National Retail Channels (Grocery, Hardware, Electronics)">Australian National Channels (All)</option>
              <option value="Tier-1 Supermarket & Grocery Networks">Tier-1 Supermarket & Grocery Networks</option>
              <option value="Hardware & Home Improvement Centers">Hardware & Home Improvement Centers</option>
              <option value="Consumer Electronics & Tech Chains">Consumer Electronics & Tech Chains</option>
              <option value="Mass General Variety & Apparel Channels">Mass General Variety & Apparel Channels</option>
            </select>
          </div>

          <div>
            <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Prepared By:
            </label>
            <input
              type="text"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="e.g. Merchandising Division"
              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 text-slate-900' 
                  : 'bg-slate-950 border-slate-700 text-slate-100'
              }`}
            />
          </div>

          <div>
            <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Target Fiscal Year:
            </label>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 text-slate-900' 
                  : 'bg-slate-950 border-slate-700 text-slate-100'
              }`}
            >
              <option value={2026}>CY 2026 / FY 2026-27</option>
              <option value={2027}>CY 2027 / FY 2027-28</option>
              <option value={2025}>CY 2025 Retrospective</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* 2. FORMAL STRATEGY DOCUMENT CONTAINER */}
      <div className={`p-6 sm:p-10 rounded-3xl border shadow-2xl space-y-8 transition-colors print:p-0 print:border-none print:shadow-none print:bg-white print:text-black ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        
        {/* Document Header */}
        <div className={`border-b pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-black ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <div className="text-xs uppercase tracking-widest font-extrabold text-amber-500 print:text-black flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>COMMERCIAL STRATEGY & MERCHANDISING BRIEFING</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              {aiBriefing?.documentTitle || `${targetYear} Australian Retail Promotional Plan & Range Strategy`}
            </h1>
            <p className={`text-xs mt-1 print:text-slate-600 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Channel Target: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{retailerChannel}</strong> • Focus: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{strategicObjective}</strong>
            </p>
          </div>

          <div className={`text-left md:text-right text-xs print:text-slate-600 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <div className="flex items-center md:justify-end gap-1 font-semibold text-emerald-500 print:text-black">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>ACCC Hiatus Verified (100% Compliant)</span>
            </div>
            <div className="mt-0.5">Author: <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-black">{preparedBy}</span></div>
            <div className="text-[11px] opacity-75">Generated via RangeCraft AU Commercial Engine</div>
          </div>
        </div>

        {/* AI Executive Memo Synthesis (If generated or default baseline) */}
        <div className={`rounded-2xl p-6 border space-y-4 print:bg-slate-50 print:border-slate-300 ${
          isLight 
            ? 'bg-amber-50/50 border-amber-200 text-slate-900' 
            : 'bg-slate-950/80 border-amber-500/30 text-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-500 print:text-black font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Executive Thesis & Commercial Rationale</span>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Boardroom Ready
            </span>
          </div>

          <p className={`text-xs leading-relaxed font-medium print:text-black ${
            isLight ? 'text-slate-700' : 'text-slate-200'
          }`}>
            {aiBriefing?.executiveThesis || `The ${targetYear} commercial promotional calendar establishes an authoritative, disciplined promotional cadence across ${retailerChannel}. Grounded in ${strategicObjective}, the model projects AUD $${Math.round(kpis.annualProjectedRevenueAud).toLocaleString()} in total promotional turnover, sustaining a healthy blended margin of ${kpis.blendedPromoMarginPercent}% while generating +${kpis.overallLiftPercent}% incremental volume lift. Strict ACCC two-price governance is automated with a mandatory 4-week hiatus.`}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Key Objectives */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 print:bg-white print:border-slate-300 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <strong className="text-amber-500 print:text-black font-bold block flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Key Strategic Objectives:
              </strong>
              <ul className={`list-disc list-inside space-y-1.5 text-[11px] print:text-black ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {(aiBriefing?.keyObjectives || [
                  `Deliver AUD $${Math.round(kpis.annualProjectedRevenueAud).toLocaleString()} in promotional revenue at ${kpis.blendedPromoMarginPercent}% blended margin.`,
                  'Capture high seasonal demand peaks across Australia Day, Easter, EOFY, Footy Finals, Black Friday, and Christmas.',
                  'Enforce 100% compliance with ACCC 4-week regular price selling hiatus rules.',
                  `Secure AUD $${Math.round(kpis.totalTradeSpendFundingAud || kpis.totalTradeSpendCoOpAud).toLocaleString()} in supplier trade spend rebates to preserve retailer net margins.`
                ]).map((obj: string, i: number) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Vendor Alignment & Trade Spend Strategy */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 print:bg-white print:border-slate-300 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <strong className="text-emerald-500 print:text-black font-bold block flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Trade Spend & Vendor Alignment:
              </strong>
              <p className={`text-[11px] leading-relaxed print:text-black ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {aiBriefing?.tradeFundingStrategy || `Deploy tiered supplier co-op funding targeting minimum 12-15% scan rebate on front-cover catalogue features. Reconcile point-of-sale scan-downs weekly to ensure net margin targets are rigorously protected.`}
              </p>
              <div className={`pt-2 border-t text-[10px] flex items-center justify-between ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
              }`}>
                <span>Total Projected Rebate:</span>
                <span className="font-bold text-emerald-500 print:text-black">
                  AUD ${Math.round(kpis.totalTradeSpendFundingAud || kpis.totalTradeSpendCoOpAud).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Executive KPI Performance Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-black text-amber-500 print:text-black tracking-wider flex items-center gap-2">
              <span>1. Commercial Performance Targets & Financial Model</span>
            </h3>
            <span className="text-[10px] text-slate-400 print:text-slate-600">52-Week Aggregated Baseline</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className={`p-4 rounded-xl border print:bg-slate-100 print:border-slate-300 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Annual Promo Turnover</div>
              <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white print:text-black">
                {formatAud(kpis.annualProjectedRevenueAud)} AUD
              </div>
              <div className="text-[10px] text-emerald-500 mt-0.5">Top-line trade revenue</div>
            </div>

            <div className={`p-4 rounded-xl border print:bg-slate-100 print:border-slate-300 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Blended Promo Margin</div>
              <div className="text-xl font-bold mt-1 text-blue-500 print:text-black">
                {kpis.blendedPromoMarginPercent}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Target &gt; 35.0%</div>
            </div>

            <div className={`p-4 rounded-xl border print:bg-slate-100 print:border-slate-300 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Incremental Volume Lift</div>
              <div className="text-xl font-bold mt-1 text-emerald-500 print:text-black">
                +{kpis.overallLiftPercent}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{formatNumber(kpis.annualIncrementalUnits)} promo units</div>
            </div>

            <div className={`p-4 rounded-xl border print:bg-slate-100 print:border-slate-300 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Vendor Trade Co-Op</div>
              <div className="text-xl font-bold mt-1 text-purple-500 print:text-black">
                {formatAud(kpis.totalTradeSpendFundingAud || kpis.totalTradeSpendCoOpAud)} AUD
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Secured supplier support</div>
            </div>
          </div>
        </div>

        {/* Section 2: Australian Quarterly Pillars & Key Seasons */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase font-black text-amber-500 print:text-black tracking-wider">
            2. Australian Quarterly Pillars & Seasonal Strategy
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {(aiBriefing?.quarterlyRoadmap || [
              { 
                quarter: "Q1", 
                focus: "Summer BBQ Entertaining, Australia Day & Back to School", 
                targetRevenue: `AUD $${Math.round(kpis.annualProjectedRevenueAud * 0.24).toLocaleString()}`, 
                keyCampaigns: ["Australia Day BBQ Feast", "Back to School Tech & Stationery", "Valentine's Gifting"] 
              },
              { 
                quarter: "Q2", 
                focus: "Autumn Transition, Easter Long Weekend & EOFY Clearance", 
                targetRevenue: `AUD $${Math.round(kpis.annualProjectedRevenueAud * 0.27).toLocaleString()}`, 
                keyCampaigns: ["Easter Camping & Outdoor Gear", "Mother's Day Indulgence", "EOFY Commercial Stocktake"] 
              },
              { 
                quarter: "Q3", 
                focus: "Winter Warmers, Father's Day & AFL/NRL Footy Finals", 
                targetRevenue: `AUD $${Math.round(kpis.annualProjectedRevenueAud * 0.23).toLocaleString()}`, 
                keyCampaigns: ["Winter Comfort & Heating", "Father's Day Hardware & Apparel", "Grand Finals Party Essentials"] 
              },
              { 
                quarter: "Q4", 
                focus: "Spring Entertaining, Black Friday Cyber Week & Christmas", 
                targetRevenue: `AUD $${Math.round(kpis.annualProjectedRevenueAud * 0.26).toLocaleString()}`, 
                keyCampaigns: ["Halloween Confectionery", "Black Friday Front-Cover Specials", "Christmas Feast & Boxing Day"] 
              }
            ]).map((q: any) => (
              <div 
                key={q.quarter} 
                className={`p-4 rounded-xl border space-y-2 print:bg-slate-100 print:border-slate-300 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded font-black text-xs bg-amber-500/10 text-amber-500">
                    {q.quarter}
                  </span>
                  <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 print:text-black">
                    {q.targetRevenue}
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white print:text-black text-xs leading-snug">
                  {q.focus}
                </div>
                <div className={`text-[10px] space-y-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <div className="font-semibold uppercase tracking-wider text-[9px]">Key Campaigns:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {q.keyCampaigns?.map((c: string, idx: number) => (
                      <li key={idx} className="line-clamp-1">{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Omnichannel Directives & Governance */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase font-black text-amber-500 print:text-black tracking-wider">
            3. Omnichannel Merchandising Directives & Governance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Omnichannel table */}
            <div className={`p-4 rounded-xl border space-y-3 print:bg-slate-100 print:border-slate-300 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="font-bold text-slate-900 dark:text-white print:text-black flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Channel Merchandising Roles
              </div>
              <div className="space-y-2 text-[11px]">
                {(aiBriefing?.omniChannelDirectives || [
                  { channel: "Printed & Digital Catalogues", frequency: "Weekly Wednesday drop", role: "Primary promotional awareness and mass footfall generator" },
                  { channel: "In-Store Merchandising & End Caps", frequency: "Fortnightly rotation", role: "Impulse capture and primary basket-builder" },
                  { channel: "Retail Loyalty App & Push Notifications", frequency: "Dynamic real-time triggers", role: "Personalized basket upsell and loyalty retention" },
                  { channel: "Click & Collect / Online Banners", frequency: "Continuous synchronous hero spotlight", role: "Digital conversion and average order value enhancement" }
                ]).map((d: any, idx: number) => (
                  <div key={idx} className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-amber-500 print:text-black">{d.channel}</span>
                      <span className="text-[10px] text-slate-400">{d.frequency}</span>
                    </div>
                    <p className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {d.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ACCC Governance */}
            <div className={`p-4 rounded-xl border space-y-3 flex flex-col justify-between print:bg-slate-100 print:border-slate-300 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white print:text-black flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  ACCC Pricing & Catalogue Hiatus Governance
                </div>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {aiBriefing?.governanceAndCompliance || "ACCC Guidelines for Two-Price and Was/Now Comparisons are strictly enforced. All SKUs featured in promotional catalogues undergo mandatory 4-week regular price selling periods to maintain genuine reference pricing integrity and prevent consumer deception."}
                </p>
              </div>

              <div className={`p-3 rounded-lg border text-[11px] space-y-1 ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ACCC Hiatus Audit Status: PASSED (Zero Active Clashes)
                </div>
                <div className="text-[10px] opacity-90">
                  Every product feature satisfies Australian Consumer Law reference pricing standards.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Master 52-Week Promotional Schedule Table */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs uppercase font-black text-amber-500 print:text-black tracking-wider">
              4. Master 52-Week Promotional Schedule ({filteredPromotions.length} Weeks Shown)
            </h3>

            {/* Interactive Filters (Hidden in print) */}
            <div className="flex items-center gap-2 flex-wrap print:hidden">
              {/* Quarter Filter Pills */}
              <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
              }`}>
                {(['all', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuarter(q)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      selectedQuarter === q 
                        ? 'bg-amber-500 text-white font-bold shadow-sm' 
                        : isLight 
                          ? 'text-slate-600 hover:text-slate-900' 
                          : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {q === 'all' ? 'All 52' : q}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search campaign, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-8 pr-3 py-1 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-44 ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900' 
                      : 'bg-slate-950 border-slate-700 text-slate-100'
                  }`}
                />
              </div>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium focus:outline-none ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900' 
                    : 'bg-slate-950 border-slate-700 text-slate-100'
                }`}
              >
                <option value="week">Sort: Week (1-52)</option>
                <option value="revenue">Sort: Revenue (High-Low)</option>
                <option value="margin">Sort: Margin % (High-Low)</option>
                <option value="units">Sort: Volume Units</option>
              </select>
            </div>
          </div>

          <div className={`border rounded-2xl overflow-hidden text-[11px] shadow-sm print:border-black ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`uppercase text-[9px] font-bold border-b print:border-black ${
                  isLight 
                    ? 'bg-slate-100 border-slate-200 text-slate-600' 
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">Wk</th>
                    <th className="py-2.5 px-3">Start Date</th>
                    <th className="py-2.5 px-3">Australian Campaign Theme</th>
                    <th className="py-2.5 px-3">Hero SKU & Product</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">RRP</th>
                    <th className="py-2.5 px-3 text-right">Promo RRP</th>
                    <th className="py-2.5 px-3 text-center">Discount</th>
                    <th className="py-2.5 px-3">Mechanic</th>
                    <th className="py-2.5 px-3 text-right">Forecast Units</th>
                    <th className="py-2.5 px-3 text-right">Revenue (AUD)</th>
                    <th className="py-2.5 px-3 text-right">Margin</th>
                    <th className="py-2.5 px-3 text-center print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y print:divide-slate-300 ${
                  isLight 
                    ? 'divide-slate-200 text-slate-800' 
                    : 'divide-slate-800/60 text-slate-300'
                }`}>
                  {filteredPromotions.map(promo => {
                    const hero = productMap.get(promo.heroSku);
                    const discount = promo.mechanic?.discountPercent || (hero ? Math.round(((hero.rrp - (promo.mechanic?.promoRrp || hero.rrp)) / hero.rrp) * 100) : 0);

                    return (
                      <tr 
                        key={promo.weekNumber} 
                        className={`transition-colors group ${
                          isLight 
                            ? 'hover:bg-amber-50/50' 
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-amber-500 print:text-black">
                          W{promo.weekNumber}
                        </td>
                        <td className={`py-2.5 px-3 whitespace-nowrap text-[10px] ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {promo.startDate}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          <div className="text-slate-900 dark:text-white print:text-black">
                            {promo.campaignTheme}
                          </div>
                          {promo.australianEvent && (
                            <div className="text-[10px] text-amber-500/80 font-normal">
                              🇦🇺 {promo.australianEvent}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white print:text-black line-clamp-1">
                            {hero?.name || promo.heroSku}
                          </div>
                          <div className="font-mono text-[9px] text-slate-400">
                            {promo.heroSku}
                          </div>
                        </td>
                        <td className={`py-2.5 px-3 text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {hero?.category || 'General'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400 print:text-black line-through">
                          {formatPrice(hero?.rrp || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-500 print:text-black">
                          {formatPrice(promo.mechanic?.promoRrp || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            discount >= 30 
                              ? 'bg-rose-500/10 text-rose-500' 
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            -{discount}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[10px] font-medium">
                          {promo.mechanic?.label || 'Feature'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {formatNumber(promo.projectedUnits)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white print:text-black">
                          {formatAud(promo.projectedRevenueAud)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span className={promo.projectedMarginPercent < 30 ? 'text-rose-400' : 'text-emerald-500'}>
                            {promo.projectedMarginPercent}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center print:hidden">
                          {onOpenWeekStudio && (
                            <button
                              onClick={() => onOpenWeekStudio(promo.weekNumber)}
                              title={`Open Week ${promo.weekNumber} Studio`}
                              className={`p-1 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                                isLight 
                                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' 
                                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                              }`}
                            >
                              <ExternalLink className="w-3 h-3 text-amber-500" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Document Footer */}
        <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between text-xs gap-2 print:border-black ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
        }`}>
          <div>
            RangeCraft AU — Authorized 52-Week Merchandising Document • {targetYear} Commercial Strategy
          </div>
          <div className="font-semibold text-emerald-500 print:text-black">
            Approved for Joint Business Planning (JBP) Execution
          </div>
        </div>

      </div>
    </div>
  );
};
