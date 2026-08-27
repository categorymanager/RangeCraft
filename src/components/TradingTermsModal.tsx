import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TradingTerms, 
  TradingTermsSkuScope, 
  TradingTermsRateType, 
  TradingTermsIncentiveType, 
  TradingTermsStatus, 
  CrmAccount, 
  Product, 
  ThemeMode 
} from '../types';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  DollarSign, 
  Percent, 
  Calendar, 
  Layers, 
  Building2, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  Award, 
  Check, 
  AlertCircle, 
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { formatAud } from '../utils/formatters';

interface TradingTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  terms?: TradingTerms | null; // if null, creating new
  existingTerms?: TradingTerms | null;
  onSaveTerms?: (terms: TradingTerms) => void;
  onSaveTradingTerms?: (terms: TradingTerms) => void;
  accounts: CrmAccount[];
  products: Product[];
  currentTheme: ThemeMode;
  preselectedAccount?: CrmAccount;
  showToast?: (msg: string, type?: 'success' | 'info') => void;
}

export const TradingTermsModal: React.FC<TradingTermsModalProps> = ({
  isOpen,
  onClose,
  terms,
  existingTerms,
  onSaveTerms,
  onSaveTradingTerms,
  accounts,
  products,
  currentTheme,
  preselectedAccount,
  showToast = (_msg: string, _type?: 'success' | 'info') => {}
}) => {
  const isLight = currentTheme.includes('light');
  const activeTerms = existingTerms !== undefined ? existingTerms : terms;

  // Form State
  const [title, setTitle] = useState('National Retail Trading Terms Agreement FY26');
  const [targetAccountId, setTargetAccountId] = useState('acc-1');
  const [contactName, setContactName] = useState('Category Buyer');
  const [contactEmail, setContactEmail] = useState('buyer@retailer.com.au');
  const [contactPhone, setContactPhone] = useState('+61 2 9000 0000');
  
  // Scope State
  const [skuScope, setSkuScope] = useState<TradingTermsSkuScope>('all_skus');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkuCodes, setSelectedSkuCodes] = useState<string[]>([]);
  const [skuSearchQuery, setSkuSearchQuery] = useState('');

  // Base Terms State
  const [baseRatePercent, setBaseRatePercent] = useState<number>(10.0);
  const [rateType, setRateType] = useState<TradingTermsRateType>('scan_sales');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(45);
  const [settlementDiscountPercent, setSettlementDiscountPercent] = useState<number>(2.0);
  const [settlementFrequency, setSettlementFrequency] = useState<any>('Monthly Scan');

  // Over & Above Spend State
  const [overAndAboveSpendAud, setOverAndAboveSpendAud] = useState<number>(50000);
  const [overAndAboveDescription, setOverAndAboveDescription] = useState(
    'Catalogue Front Cover, Gondola Ends, Retail Media Banner & EDM Placement'
  );
  const [promotionalPeriod, setPromotionalPeriod] = useState('FY26 52-Week Master Plan (Weeks 1 - 52)');

  // Volume-Based Incentive State
  const [hasVolumeIncentive, setHasVolumeIncentive] = useState<boolean>(true);
  const [volumeThresholdAud, setVolumeThresholdAud] = useState<number>(500000);
  const [volumeThresholdUnits, setVolumeThresholdUnits] = useState<number>(60000);
  const [incentiveType, setIncentiveType] = useState<TradingTermsIncentiveType>('reduced_payment_terms');
  const [reducedPaymentTermsDays, setReducedPaymentTermsDays] = useState<number>(14);
  const [bonusRebatePercent, setBonusRebatePercent] = useState<number>(1.5);
  const [incentiveRewardDescription, setIncentiveRewardDescription] = useState(
    'Reduced payment terms from 60 days to 14 days (Net 14 EFT) for the remainder of the financial year once $500,000 target scan sales reached.'
  );

  // Status and Meta
  const [status, setStatus] = useState<TradingTermsStatus>('Signed & Binding');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-01-01');
  const [effectiveTo, setEffectiveTo] = useState('2026-12-31');
  const [notes, setNotes] = useState('Binding joint business planning terms. Verified against ACCC 4-week hiatus baseline protection rules.');

  // Sync state whenever modal opens or terms/account prop changes
  React.useEffect(() => {
    if (isOpen) {
      if (activeTerms) {
        setTitle(activeTerms.title || 'National Retail Trading Terms Agreement FY26');
        setTargetAccountId(activeTerms.targetAccountId || accounts[0]?.id || 'acc-1');
        setContactName(activeTerms.contactName || accounts[0]?.contactName || 'Category Buyer');
        setContactEmail(activeTerms.contactEmail || accounts[0]?.email || 'buyer@retailer.com.au');
        setContactPhone(activeTerms.contactPhone || accounts[0]?.phone || '+61 2 9000 0000');
        setSkuScope(activeTerms.skuScope || 'all_skus');
        setSelectedCategories(activeTerms.selectedCategories || []);
        setSelectedSkuCodes(activeTerms.selectedSkuCodes || []);
        setBaseRatePercent(activeTerms.baseRatePercent ?? 10.0);
        setRateType(activeTerms.rateType || 'scan_sales');
        setPaymentTermsDays(activeTerms.paymentTermsDays ?? 45);
        setSettlementDiscountPercent(activeTerms.settlementDiscountPercent ?? 2.0);
        setSettlementFrequency(activeTerms.settlementFrequency || 'Monthly Scan');
        setOverAndAboveSpendAud(activeTerms.overAndAboveSpendAud ?? 50000);
        setOverAndAboveDescription(activeTerms.overAndAboveDescription || 'Catalogue Front Cover, Gondola Ends, Retail Media Banner & EDM Placement');
        setPromotionalPeriod(activeTerms.promotionalPeriod || 'FY26 52-Week Master Plan (Weeks 1 - 52)');
        setHasVolumeIncentive(activeTerms.hasVolumeIncentive ?? true);
        setVolumeThresholdAud(activeTerms.volumeThresholdAud ?? 500000);
        setVolumeThresholdUnits(activeTerms.volumeThresholdUnits ?? 60000);
        setIncentiveType(activeTerms.incentiveType || 'reduced_payment_terms');
        setReducedPaymentTermsDays(activeTerms.reducedPaymentTermsDays ?? 14);
        setBonusRebatePercent(activeTerms.bonusRebatePercent ?? 1.5);
        setIncentiveRewardDescription(activeTerms.incentiveRewardDescription || 'Reduced payment terms from 60 days to 14 days (Net 14 EFT) for the remainder of the financial year once $500,000 target scan sales reached.');
        setStatus(activeTerms.status || 'Signed & Binding');
        setEffectiveFrom(activeTerms.effectiveFrom || '2026-01-01');
        setEffectiveTo(activeTerms.effectiveTo || '2026-12-31');
        setNotes(activeTerms.notes || 'Binding joint business planning terms. Verified against ACCC 4-week hiatus baseline protection rules.');
      } else {
        const defaultAcc = preselectedAccount || accounts[0];
        setTitle(defaultAcc ? `${defaultAcc.name} Master Trading Agreement FY26` : 'National Retail Trading Terms Agreement FY26');
        setTargetAccountId(defaultAcc?.id || 'acc-1');
        setContactName(defaultAcc?.contactName || 'Category Buyer');
        setContactEmail(defaultAcc?.email || 'buyer@retailer.com.au');
        setContactPhone(defaultAcc?.phone || '+61 2 9000 0000');
        setSkuScope('all_skus');
        setSelectedCategories([]);
        setSelectedSkuCodes([]);
        setBaseRatePercent(10.0);
        setRateType('scan_sales');
        setPaymentTermsDays(45);
        setSettlementDiscountPercent(2.0);
        setSettlementFrequency('Monthly Scan');
        setOverAndAboveSpendAud(50000);
        setOverAndAboveDescription('Catalogue Front Cover, Gondola Ends, Retail Media Banner & EDM Placement');
        setPromotionalPeriod('FY26 52-Week Master Plan (Weeks 1 - 52)');
        setHasVolumeIncentive(true);
        setVolumeThresholdAud(500000);
        setVolumeThresholdUnits(60000);
        setIncentiveType('reduced_payment_terms');
        setReducedPaymentTermsDays(14);
        setBonusRebatePercent(1.5);
        setIncentiveRewardDescription('Reduced payment terms from 60 days to 14 days (Net 14 EFT) for the remainder of the financial year once $500,000 target scan sales reached.');
        setStatus('Signed & Binding');
        setEffectiveFrom('2026-01-01');
        setEffectiveTo('2026-12-31');
        setNotes('Binding joint business planning terms. Verified against ACCC 4-week hiatus baseline protection rules.');
      }
    }
  }, [isOpen, activeTerms, preselectedAccount, accounts]);

  // Active sub-tab in modal
  const [activeSubTab, setActiveSubTab] = useState<'scope_base' | 'over_above' | 'volume_incentive' | 'summary_export'>('scope_base');

  // Available unique categories
  const allCategories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  }, [products]);

  // Sync contact info when target account changes
  const handleAccountChange = (accId: string) => {
    setTargetAccountId(accId);
    const matched = accounts.find(a => a.id === accId);
    if (matched) {
      setContactName(matched.contactName);
      setContactEmail(matched.email);
      setContactPhone(matched.phone);
    }
  };

  // Calculate covered SKUs based on scope
  const coveredProducts = useMemo(() => {
    if (skuScope === 'all_skus') {
      return products;
    }
    if (skuScope === 'category') {
      return products.filter(p => selectedCategories.includes(p.category));
    }
    return products.filter(p => selectedSkuCodes.includes(p.sku));
  }, [skuScope, selectedCategories, selectedSkuCodes, products]);

  // Financial calculations
  const totalAnnualBaselineTurnover = useMemo(() => {
    return coveredProducts.reduce((sum, p) => sum + (p.weeklyUnitsBaseline * 52 * p.rrp), 0);
  }, [coveredProducts]);

  const estimatedBaseRebateAud = useMemo(() => {
    return Math.round(totalAnnualBaselineTurnover * (baseRatePercent / 100));
  }, [totalAnnualBaselineTurnover, baseRatePercent]);

  const totalVendorInvestmentAud = useMemo(() => {
    return estimatedBaseRebateAud + Number(overAndAboveSpendAud || 0);
  }, [estimatedBaseRebateAud, overAndAboveSpendAud]);

  const effectiveBlendedTradeRate = useMemo(() => {
    if (totalAnnualBaselineTurnover === 0) return 0;
    return Number(((totalVendorInvestmentAud / totalAnnualBaselineTurnover) * 100).toFixed(2));
  }, [totalVendorInvestmentAud, totalAnnualBaselineTurnover]);

  // SKU Multi-select handlers
  const handleToggleSku = (skuCode: string) => {
    setSelectedSkuCodes(prev => 
      prev.includes(skuCode) ? prev.filter(c => c !== skuCode) : [...prev, skuCode]
    );
  };

  const handleSelectAllSkusInScope = () => {
    setSelectedSkuCodes(products.map(p => p.sku));
    showToast(`Selected all ${products.length} SKUs in catalog`);
  };

  const handleClearAllSkusInScope = () => {
    setSelectedSkuCodes([]);
  };

  const handleToggleCategory = (catName: string) => {
    setSelectedCategories(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  // Save Agreement
  const handleSave = () => {
    if (!title.trim()) {
      showToast('Please enter an agreement title.', 'info');
      return;
    }

    const matchedAcc = accounts.find(a => a.id === targetAccountId) || accounts[0];

    const updatedTerms: TradingTerms = {
      id: activeTerms?.id || `tt-${Date.now()}`,
      title,
      targetAccountId,
      targetAccountName: matchedAcc?.name || 'Retail Partner',
      contactName,
      contactEmail,
      contactPhone,
      
      skuScope,
      selectedCategories: skuScope === 'category' ? selectedCategories : [],
      selectedSkuCodes: skuScope === 'selected_skus' ? selectedSkuCodes : [],
      
      baseRatePercent: Number(baseRatePercent) || 10,
      rateType,
      paymentTermsDays: Number(paymentTermsDays) || 30,
      settlementDiscountPercent: Number(settlementDiscountPercent) || 0,
      settlementFrequency,
      
      overAndAboveSpendAud: Number(overAndAboveSpendAud) || 0,
      overAndAboveDescription,
      promotionalPeriod,
      
      hasVolumeIncentive,
      volumeThresholdAud: Number(volumeThresholdAud) || 0,
      volumeThresholdUnits: Number(volumeThresholdUnits) || 0,
      incentiveType,
      incentiveRewardDescription,
      reducedPaymentTermsDays: Number(reducedPaymentTermsDays) || 14,
      bonusRebatePercent: Number(bonusRebatePercent) || 1.5,
      
      status,
      effectiveFrom,
      effectiveTo,
      contractSignee: contactName,
      notes,
      createdAt: activeTerms?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onSaveTerms) {
      onSaveTerms(updatedTerms);
    } else if (onSaveTradingTerms) {
      onSaveTradingTerms(updatedTerms);
    }
    showToast(`Trading Terms "${title}" saved successfully!`, 'success');
    onClose();
  };

  const handleExportAgreementCsv = () => {
    const matchedAcc = accounts.find(a => a.id === targetAccountId) || accounts[0];
    const headers = [
      'Agreement Title',
      'Target Partner',
      'Contact Name',
      'Contact Email',
      'SKU Scope',
      'Covered SKUs Count',
      'Base Trading Rate %',
      'Rate Mechanism',
      'Standard Payment Terms (Days)',
      'Over & Above Spend (AUD)',
      'O&A Description',
      'Volume Incentive Target (AUD)',
      'Incentive Reward',
      'Estimated Turnover (AUD)',
      'Estimated Total Trade Investment (AUD)',
      'Effective Trading %',
      'Status',
      'Effective Period'
    ];

    const row = [
      `"${title}"`,
      `"${matchedAcc?.name || 'Retail Partner'}"`,
      `"${contactName}"`,
      `"${contactEmail}"`,
      `"${skuScope}"`,
      coveredProducts.length,
      `${baseRatePercent}%`,
      `"${rateType}"`,
      `${paymentTermsDays} Days`,
      `"$${overAndAboveSpendAud.toLocaleString()}"`,
      `"${overAndAboveDescription}"`,
      `"$${volumeThresholdAud.toLocaleString()}"`,
      `"${incentiveRewardDescription}"`,
      `"$${totalAnnualBaselineTurnover.toLocaleString()}"`,
      `"$${totalVendorInvestmentAud.toLocaleString()}"`,
      `${effectiveBlendedTradeRate}%`,
      `"${status}"`,
      `"${effectiveFrom} to ${effectiveTo}"`
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Trading_Terms_${title.replace(/[^a-z0-9]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded Trading Terms Agreement CSV.');
  };

  const handlePrintAgreement = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className={`relative w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh] ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1422] border-[#1e2638] text-white'
      }`}>
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600/15 via-purple-600/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Australian Retail Trading Terms
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  status === 'Signed & Binding' 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  {status}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                {terms ? 'Edit Commercial Trading Terms Agreement' : 'New Retail Trading Terms & Margin Structure'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Calculation Metric Bar */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b text-xs ${
          isLight ? 'bg-blue-50/60 border-blue-100 text-slate-800' : 'bg-[#0d101a] border-[#1a2336] text-slate-200'
        }`}>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Covered SKU Scope</div>
            <div className="font-black text-sm text-blue-400 mt-0.5">
              {coveredProducts.length} SKUs ({skuScope === 'all_skus' ? 'All Catalog' : skuScope === 'category' ? `${selectedCategories.length} Categories` : `${selectedSkuCodes.length} Selected`})
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Est. Annual Turnover</div>
            <div className="font-black text-sm text-emerald-400 mt-0.5">
              {formatAud(totalAnnualBaselineTurnover)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Base ({baseRatePercent}%) + O&A Spend</div>
            <div className="font-black text-sm text-amber-400 mt-0.5">
              {formatAud(totalVendorInvestmentAud)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Effective Trade %</div>
            <div className="font-black text-sm text-purple-400 mt-0.5 flex items-center gap-1">
              <span>{effectiveBlendedTradeRate}% of Scan</span>
              {hasVolumeIncentive && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">+Incentive</span>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className={`flex items-center gap-2 px-6 pt-3 border-b text-xs font-semibold ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0f1422]'
        }`}>
          <button
            onClick={() => setActiveSubTab('scope_base')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'scope_base'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Target Partner & SKU Scope</span>
          </button>

          <button
            onClick={() => setActiveSubTab('over_above')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'over_above'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>2. Over & Above (O&A) Spend</span>
          </button>

          <button
            onClick={() => setActiveSubTab('volume_incentive')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'volume_incentive'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>3. Volume Growth Incentives</span>
          </button>

          <button
            onClick={() => setActiveSubTab('summary_export')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'summary_export'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>4. Agreement Summary & Export</span>
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* ============================================================
              TAB 1: TARGET PARTNER & SKU SCOPE (SELECT ALL / CATEGORY / SKU)
          ============================================================ */}
          {activeSubTab === 'scope_base' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Partner & Agreement Identification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Agreement Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Metro Grocers Supermarkets Master Trading Terms FY26"
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Target Retailer / Wholesale Partner Account
                  </label>
                  <select
                    value={targetAccountId}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.companyType}) - {acc.contactName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Primary Buyer / Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Buyer Email & Phone
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="buyer@retailer.com.au"
                      className={`p-2.5 rounded-xl border text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+61 2 9000 0000"
                      className={`p-2.5 rounded-xl border text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* SKU Scope Selector (Select All SKUs / By Category / Individual Selection) */}
              <div className={`p-5 rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-black text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span>SKU Coverage & Product Range Scope</span>
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Apply terms across the entire range, target specific product categories, or select individual SKU lines.
                    </p>
                  </div>

                  {/* 3 Scope Options */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSkuScope('all_skus')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        skuScope === 'all_skus'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Select All SKUs ({products.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSkuScope('category')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        skuScope === 'category'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      By Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setSkuScope('selected_skus')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        skuScope === 'selected_skus'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Individual SKUs ({selectedSkuCodes.length})
                    </button>
                  </div>
                </div>

                {/* Scope: Select All SKUs Banner */}
                {skuScope === 'all_skus' && (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-blue-300">All {products.length} Products Active in Agreement</div>
                        <div className="text-[11px] text-slate-400">
                          Terms automatically apply to all current and future SKUs in your Australian master catalogue.
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      {formatAud(totalAnnualBaselineTurnover)} Annual Baseline
                    </span>
                  </div>
                )}

                {/* Scope: By Category Selector */}
                {skuScope === 'category' && (
                  <div className="space-y-3">
                    <div className="text-[11px] text-slate-400">Select which retail product categories are governed by this agreement:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {allCategories.map(cat => {
                        const isSelected = selectedCategories.includes(cat);
                        const catProductCount = products.filter(p => p.category === cat).length;
                        return (
                          <div
                            key={cat}
                            onClick={() => handleToggleCategory(cat)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-600/15 border-blue-500/60 text-white shadow-sm'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700'
                              }`}>
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <span className="font-bold text-xs">{cat}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{catProductCount} SKUs</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Scope: Individual SKU Selector */}
                {skuScope === 'selected_skus' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={skuSearchQuery}
                          onChange={(e) => setSkuSearchQuery(e.target.value)}
                          placeholder="Search SKUs by name or code..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllSkusInScope}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllSkusInScope}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {products
                        .filter(p => p.name.toLowerCase().includes(skuSearchQuery.toLowerCase()) || p.sku.toLowerCase().includes(skuSearchQuery.toLowerCase()))
                        .map(product => {
                          const isSelected = selectedSkuCodes.includes(product.sku);
                          return (
                            <div
                              key={product.sku}
                              onClick={() => handleToggleSku(product.sku)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-600/15 border-blue-500/50 text-white'
                                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                  isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3" />}
                                </div>
                                <div>
                                  <div className="font-bold text-xs">{product.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{product.sku} • {product.category}</div>
                                </div>
                              </div>
                              <div className="text-right font-mono">
                                <div className="font-bold text-emerald-400">${product.rrp.toFixed(2)} RRP</div>
                                <div className="text-[10px] text-slate-400">{product.weeklyUnitsBaseline} units/wk</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Base Trading Terms Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Base Trading Terms Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={baseRatePercent}
                      onChange={(e) => setBaseRatePercent(parseFloat(e.target.value) || 0)}
                      className={`w-full p-2.5 pr-8 rounded-xl border text-xs font-bold font-mono focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                    <Percent className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">e.g. 10.0% of scan sales</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Rate Mechanism
                  </label>
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value="scan_sales">Scan Sales (% of POS Sell-Through)</option>
                    <option value="invoice_turnover">Invoice Turnover (% of B2B Wholesale)</option>
                    <option value="off_invoice">Off-Invoice Direct Allowance</option>
                    <option value="settlement_discount">Settlement Discount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Payment Terms (Days)
                  </label>
                  <select
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(parseInt(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value={14}>Net 14 Days (Fast EFT)</option>
                    <option value={30}>Net 30 Days (Standard AU)</option>
                    <option value={45}>Net 45 Days (Supermarket Standard)</option>
                    <option value={60}>Net 60 Days (Wholesale Distribution)</option>
                    <option value={90}>Net 90 Days (Department Store)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Rebate Settlement Cadence
                  </label>
                  <select
                    value={settlementFrequency}
                    onChange={(e) => setSettlementFrequency(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Monthly Scan">Monthly Scan (Automated EDI)</option>
                    <option value="Quarterly Invoiced">Quarterly Invoiced</option>
                    <option value="Annual Retrospective">Annual Retrospective</option>
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================
              TAB 2: OVER & ABOVE (O&A) CO-OP MARKETING & PROMO SPEND
          ============================================================ */}
          {activeSubTab === 'over_above' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span>Over & Above (O&A) Trade Marketing Spend</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Fixed co-op investments committed over the agreed promotional period for guaranteed catalogue placements, digital retail media network ads, gondola endcaps, and member EDM boosts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Over & Above Spend Amount ($ AUD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={overAndAboveSpendAud}
                      onChange={(e) => setOverAndAboveSpendAud(parseFloat(e.target.value) || 0)}
                      className={`w-full p-3 pl-8 rounded-xl border text-base font-black font-mono focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-amber-400'
                      }`}
                    />
                    <DollarSign className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">e.g. $50,000 for annual catalogue feature slots</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Agreed Promotional Period
                  </label>
                  <input
                    type="text"
                    value={promotionalPeriod}
                    onChange={(e) => setPromotionalPeriod(e.target.value)}
                    placeholder="e.g. FY26 52-Week Master Plan (Weeks 1 - 52)"
                    className={`w-full p-3 rounded-xl border text-xs font-semibold focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Over & Above Deliverables & Asset Allocation
                </label>
                <textarea
                  rows={3}
                  value={overAndAboveDescription}
                  onChange={(e) => setOverAndAboveDescription(e.target.value)}
                  placeholder="Specify exact marketing commitments (e.g. 2x Double-Spread Catalogues in Q1/Q4, 4x National Gondola Endcaps, Retail Media App Push banner during EOFY Sale)"
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              {/* Combined Impact Card */}
              <div className={`p-4 rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="font-bold text-xs mb-3 text-slate-300">Total Trade Spend Breakdown for Agreement:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">1. Base Scan Rebate ({baseRatePercent}%)</div>
                    <div className="font-black text-sm text-blue-400 mt-1">{formatAud(estimatedBaseRebateAud)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">2. Over & Above Co-Op Spend</div>
                    <div className="font-black text-sm text-amber-400 mt-1">{formatAud(overAndAboveSpendAud)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Total Commercial Investment</div>
                    <div className="font-black text-sm text-purple-400 mt-1">{formatAud(totalVendorInvestmentAud)}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================
              TAB 3: VOLUME-BASED PERFORMANCE INCENTIVES
          ============================================================ */}
          {activeSubTab === 'volume_incentive' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs text-purple-300">Performance Volume Growth Incentives</div>
                    <div className="text-[11px] text-slate-400">
                      Reward high-velocity retail accounts with reduced payment terms or bonus rebate tiers upon reaching volume milestones.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hasVolumeIncentive} 
                    onChange={(e) => setHasVolumeIncentive(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {hasVolumeIncentive ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Volume Target Threshold ($ AUD)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="10000"
                          value={volumeThresholdAud}
                          onChange={(e) => setVolumeThresholdAud(parseFloat(e.target.value) || 0)}
                          className={`w-full p-2.5 pl-8 rounded-xl border text-xs font-bold font-mono focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-purple-400'
                          }`}
                        />
                        <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">e.g. $500,000 in scan sales</span>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Incentive Reward Type
                      </label>
                      <select
                        value={incentiveType}
                        onChange={(e) => setIncentiveType(e.target.value as any)}
                        className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      >
                        <option value="reduced_payment_terms">Reduced Payment Terms (e.g. Net 14 Days EFT)</option>
                        <option value="bonus_rebate_percent">Bonus Growth Rebate % Tier</option>
                        <option value="growth_rebate">Retrospective Dollar Bonus</option>
                        <option value="exclusive_co_op">Guaranteed Subsidized Catalogue Feature</option>
                      </select>
                    </div>

                    {incentiveType === 'reduced_payment_terms' ? (
                      <div>
                        <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                          Reduced Payment Terms (Days)
                        </label>
                        <select
                          value={reducedPaymentTermsDays}
                          onChange={(e) => setReducedPaymentTermsDays(parseInt(e.target.value))}
                          className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        >
                          <option value={7}>Net 7 Days (Ultra Fast)</option>
                          <option value={14}>Net 14 Days (Fast EFT)</option>
                          <option value={21}>Net 21 Days</option>
                          <option value={30}>Net 30 Days</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                          Bonus Rebate Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={bonusRebatePercent}
                          onChange={(e) => setBonusRebatePercent(parseFloat(e.target.value) || 0)}
                          className={`w-full p-2.5 rounded-xl border text-xs font-bold font-mono focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Incentive Contract Clause Description
                    </label>
                    <textarea
                      rows={3}
                      value={incentiveRewardDescription}
                      onChange={(e) => setIncentiveRewardDescription(e.target.value)}
                      placeholder="Specify exact condition (e.g. Payment terms reduced from 60 days to 14 days for the remainder of FY26 once $500,000 threshold reached)."
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
                  Volume incentives currently disabled for this agreement. Toggle above to add milestone rewards.
                </div>
              )}

            </div>
          )}

          {/* ============================================================
              TAB 4: AGREEMENT SUMMARY & OFFICIAL EXPORT
          ============================================================ */}
          {activeSubTab === 'summary_export' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Official Agreement Sheet Preview */}
              <div className={`p-6 rounded-3xl border shadow-lg ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0a0d14] border-[#1e2638] text-white'
              }`}>
                <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                      Commercial Joint Business Planning Agreement
                    </div>
                    <h3 className="text-lg font-black mt-0.5">{title}</h3>
                    <p className="text-xs text-slate-400">
                      Between Supplier & <strong>{accounts.find(a => a.id === targetAccountId)?.name}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Period: {effectiveFrom} to {effectiveTo}
                    </div>
                  </div>
                </div>

                {/* Key Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs mb-6">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Base Rate</span>
                    <div className="font-bold text-sm text-blue-400">{baseRatePercent}% ({rateType.replace('_', ' ')})</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Standard Payment Terms</span>
                    <div className="font-bold text-sm text-slate-200">Net {paymentTermsDays} Days ({settlementFrequency})</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Over & Above Spend</span>
                    <div className="font-bold text-sm text-amber-400">{formatAud(overAndAboveSpendAud)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Covered SKUs</span>
                    <div className="font-bold text-sm text-slate-200">{coveredProducts.length} Products Active</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Est. Baseline Turnover</span>
                    <div className="font-bold text-sm text-emerald-400">{formatAud(totalAnnualBaselineTurnover)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Total Trade Spend Commitment</span>
                    <div className="font-bold text-sm text-purple-400">{formatAud(totalVendorInvestmentAud)} ({effectiveBlendedTradeRate}%)</div>
                  </div>
                </div>

                {/* Performance Incentive Section */}
                {hasVolumeIncentive && (
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 mb-4 text-xs">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                      <Award className="w-4 h-4" />
                      <span>Volume Performance Incentive Milestone ({formatAud(volumeThresholdAud)} Target)</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {incentiveRewardDescription}
                    </p>
                  </div>
                )}

                {/* Notes & Legal */}
                <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>ACCC 4-Week Hiatus & Australian Consumer Law Section 18/29 Compliant</span>
                  </div>
                  <div className="font-mono text-[10px]">
                    Contract Signee: {contactName}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Export */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportAgreementCsv}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer shadow"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Download Agreement CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintAgreement}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer shadow"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Print Official Terms Summary</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Trading Terms Agreement</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
