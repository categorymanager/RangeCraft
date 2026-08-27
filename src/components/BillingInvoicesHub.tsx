import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  FileText, 
  Lock, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Printer, 
  Download, 
  Plus, 
  Search, 
  DollarSign, 
  X, 
  User, 
  MapPin, 
  AlertTriangle, 
  ChevronRight,
  RefreshCw,
  HelpCircle,
  FileCheck,
  Zap
} from 'lucide-react';
import { UserProfile, CrmAccount, CrmDeal, WeekPromotion, ThemeMode } from '../types';
import { formatAud } from '../utils/formatters';

interface BillingInvoicesHubProps {
  user: UserProfile | null;
  accounts: CrmAccount[];
  deals: CrmDeal[];
  promotions: WeekPromotion[];
  currentTheme?: ThemeMode;
  onUpgradeSuccess: (updatedProfile: UserProfile) => void;
  onLogTransaction: (itemDescription: string, itemType: any, amountAud: number, paymentMethod: 'paypal' | 'credit_card' | 'bank_transfer', paypalTxnId?: string) => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

interface PlatformInvoice {
  id: string;
  date: string;
  dueDate: string;
  itemDescription: string;
  amountAud: number;
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer';
  status: 'Paid' | 'Pending' | 'Overdue';
  abn: string;
  gstAmount: number;
}

interface TradeInvoice {
  id: string;
  clientName: string;
  skuCode: string;
  campaignWeek: number;
  campaignName: string;
  amountAud: number;
  status: 'Paid' | 'Sent (Awaiting Funds)' | 'Draft';
  paymentTerms: string;
  payoutBsb: string;
  payoutAccount: string;
  dateCreated: string;
}

export const BillingInvoicesHub: React.FC<BillingInvoicesHubProps> = ({
  user,
  accounts,
  deals,
  promotions,
  currentTheme,
  onUpgradeSuccess,
  onLogTransaction,
  showToast
}) => {
  const isLight = currentTheme.includes('light');
  const [activeTab, setActiveTab] = useState<'my_billing' | 'co_op_billing'>('my_billing');
  
  // My Billing State
  const [companyAbn, setCompanyAbn] = useState('45 809 237 194');
  const [companyAddress, setCompanyAddress] = useState('Level 14, 459 Collins Street, Melbourne VIC 3000');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTarget, setPayTarget] = useState<'pro_planner' | 'enterprise_tier' | null>(null);
  
  // Checkout Form State
  const [cardHolder, setCardHolder] = useState(user?.displayName || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [checkoutAbn, setCheckoutAbn] = useState('45 809 237 194');
  const [paymentGatewaySelected, setPaymentGatewaySelected] = useState<'credit_card' | 'paypal'>('credit_card');
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'authorizing' | 'success'>('idle');

  // Trade Invoice Builder State
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');
  const [selectedDeal, setSelectedDeal] = useState<string>('custom');
  const [tradeSku, setTradeSku] = useState('SKU-FMC-001');
  const [tradeWeek, setTradeWeek] = useState(4);
  const [tradeCampaignName, setTradeCampaignName] = useState('National Catalogue Feature Week');
  const [tradeAmount, setTradeAmount] = useState(15000);
  const [tradeTerms, setTradeTerms] = useState('Net 45 Days (Scan-Based SBT)');
  const [tradeBsb, setTradeBsb] = useState('062-000');
  const [tradeAccountNum, setTradeAccountNum] = useState('1098 4421');
  
  // Selected Invoice for PDF Viewer Modal
  const [viewingPlatformInvoice, setViewingPlatformInvoice] = useState<PlatformInvoice | null>(null);
  const [viewingTradeInvoice, setViewingTradeInvoice] = useState<TradeInvoice | null>(null);

  // Initial user-facing invoice history
  const [platformInvoices, setPlatformInvoices] = useState<PlatformInvoice[]>([
    {
      id: 'INV-2026-001',
      date: '2026-07-16',
      dueDate: '2026-07-16',
      itemDescription: 'Commercial Pro Subscription - Trial Conversion (Annual)',
      amountAud: 1430,
      paymentMethod: 'credit_card',
      status: 'Paid',
      abn: '45 809 237 194',
      gstAmount: 130
    },
    {
      id: 'INV-2026-002',
      date: '2026-08-01',
      dueDate: '2026-08-01',
      itemDescription: 'Joint Business Planning (JBP) Category Strategy Review Advisory',
      amountAud: 1500,
      paymentMethod: 'paypal',
      status: 'Paid',
      abn: '45 809 237 194',
      gstAmount: 136.36
    }
  ]);

  // Initial trade co-op invoices list (User sends to major supermarket channels)
  const [tradeInvoices, setTradeInvoices] = useState<TradeInvoice[]>([
    {
      id: 'INV-COOP-001',
      clientName: 'National Supermarket Network (Metro Grocers)',
      skuCode: 'SKU-FMC-001',
      campaignWeek: 4,
      campaignName: 'Australia Day Catalogue Double Spread Co-op',
      amountAud: 95000,
      status: 'Paid',
      paymentTerms: 'Net 45 Days (Scan-Based SBT)',
      payoutBsb: '062-000',
      payoutAccount: '1098 4421',
      dateCreated: '2026-01-28'
    },
    {
      id: 'INV-COOP-002',
      clientName: 'Metro Grocers Category Planning',
      skuCode: 'SKU-FMC-002',
      campaignWeek: 15,
      campaignName: 'Easter Choc Feature Gondola Display Funding',
      amountAud: 12500,
      status: 'Sent (Awaiting Funds)',
      paymentTerms: 'Net 30 Days + Co-op Display Rebate',
      payoutBsb: '062-000',
      payoutAccount: '1098 4421',
      dateCreated: '2026-04-12'
    }
  ]);

  // Sync SKU / Week details if Deal is selected
  const handleDealSelect = (dealId: string) => {
    setSelectedDeal(dealId);
    if (dealId === 'custom') return;
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      setTradeSku(deal.assignedSku);
      setTradeWeek(deal.targetWeekNum);
      setTradeCampaignName(deal.title);
      setTradeAmount(deal.valueAud);
      const acc = accounts.find(a => a.id === deal.accountId);
      if (acc) {
        setSelectedAccount(acc.id);
        setTradeTerms(acc.creditTerms);
      }
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format card input to 4-digit blocks
    const val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(val);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (val.length >= 2) {
      setCardExpiry(`${val.substring(0, 2)}/${val.substring(2, 4)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const handleProcessUpgradePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !payTarget) return;

    // Direct Form Validations
    if (paymentGatewaySelected === 'credit_card') {
      if (cardNumber.replace(/\s+/g, '').length < 16) {
        showToast('Please enter a valid 16-digit credit card number.', 'info');
        return;
      }
      if (cardExpiry.length < 5) {
        showToast('Please enter card expiry date (MM/YY).', 'info');
        return;
      }
      if (cardCvv.length < 3) {
        showToast('Please enter CVV code.', 'info');
        return;
      }
    }

    setCheckoutProcessing(true);
    setCheckoutStatus('authorizing');

    setTimeout(() => {
      // Create new platform invoice
      const targetPlan = payTarget === 'pro_planner' ? 'Commercial Pro' : 'Enterprise Portfolio';
      const calculatedCost = payTarget === 'pro_planner' ? 149 : 499;
      const calculatedGst = calculatedCost * 0.1;

      const newInv: PlatformInvoice = {
        id: `INV-2026-0${platformInvoices.length + 1}`,
        date: new Date().toISOString().slice(0, 10),
        dueDate: new Date().toISOString().slice(0, 10),
        itemDescription: `${targetPlan} Monthly Subscription Upgrade`,
        amountAud: calculatedCost,
        paymentMethod: paymentGatewaySelected === 'credit_card' ? 'credit_card' : 'paypal',
        status: 'Paid',
        abn: checkoutAbn,
        gstAmount: parseFloat(calculatedGst.toFixed(2))
      };

      setPlatformInvoices(prev => [newInv, ...prev]);
      
      // Call standard state synchronizers
      const simulatedPaypalId = paymentGatewaySelected === 'paypal' ? `PP-AU-${Math.floor(10000000 + Math.random() * 90000000)}` : undefined;
      onLogTransaction(
        `${targetPlan} Subscription (Invoiced Upgrade)`,
        'subscription_monthly',
        calculatedCost,
        paymentGatewaySelected === 'credit_card' ? 'credit_card' : 'paypal',
        simulatedPaypalId
      );

      // Perform actual simulated state modification
      const updatedProfile: UserProfile = {
        ...user,
        subscriptionTier: payTarget,
        subscriptionStatus: 'active',
        unlimitedAi: true,
        canExportPdf: true,
        canAutoReslot: true,
        maxSkusAllowed: payTarget === 'enterprise_tier' ? 5000 : 1000,
        aiGenerationsRemaining: 999999,
        companyName: user.companyName || 'Active Commercial Partner'
      };

      onUpgradeSuccess(updatedProfile);
      setCheckoutProcessing(false);
      setCheckoutStatus('success');

      showToast(`Subscription upgraded to ${targetPlan}! Invoice ${newInv.id} successfully paid and finalized.`, 'success');
      
      setTimeout(() => {
        setShowPayModal(false);
        setCheckoutStatus('idle');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
      }, 1000);

    }, 2500);
  };

  const handleGenerateTradeInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const account = accounts.find(a => a.id === selectedAccount);
    if (!account) return;

    const newTradeInv: TradeInvoice = {
      id: `INV-COOP-0${tradeInvoices.length + 1}`,
      clientName: account.name,
      skuCode: tradeSku,
      campaignWeek: tradeWeek,
      campaignName: tradeCampaignName,
      amountAud: tradeAmount,
      status: 'Sent (Awaiting Funds)',
      paymentTerms: tradeTerms,
      payoutBsb: tradeBsb,
      payoutAccount: tradeAccountNum,
      dateCreated: new Date().toISOString().slice(0, 10)
    };

    setTradeInvoices(prev => [newTradeInv, ...prev]);
    showToast(`Successfully drafted and routed B2B Tax Invoice ${newTradeInv.id} to ${account.name} Category Finance.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Visual Identity Title Board */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Secure Finance Control
              </span>
              <span className="text-xs text-slate-400 font-mono">100% Tax Compliant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              Secure Payments, GST Invoicing & Co-Op Billing Hub
            </h2>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('my_billing')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'my_billing'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>My Subscription Invoices</span>
          </button>
          <button
            onClick={() => setActiveTab('co_op_billing')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'co_op_billing'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Client Co-Op Trade Invoices</span>
          </button>
        </div>
      </div>

      {/* ==============================================================
          TAB 1: MY SUBSCRIPTIONS & PLATFORM INVOICING
      ============================================================== */}
      {activeTab === 'my_billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Plan and Core Subscription Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-100'
            }`}>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Current Subscription</h3>
              
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white">
                    {user?.subscriptionTier === 'free_trial' ? 'Starter Trial' : user?.subscriptionTier === 'pro_planner' ? 'Commercial Pro' : 'Enterprise Portfolio'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {user?.subscriptionStatus === 'active' ? 'Active' : 'Trialing'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {user?.subscriptionTier === 'free_trial' 
                    ? 'Explore compliance tools and standard AU retail calendar. Limit 15 SKUs.'
                    : 'Full portfolio planning, unlimited AI Strategy Copilot, and executive deck PDF exports.'}
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">ABN Filed</span>
                  <span className="font-bold text-slate-300">{companyAbn}</span>
                </div>
              </div>

              {/* Edit Corporate Details */}
              <div className="space-y-3">
                <h4 className="font-black text-xs text-slate-400">Tax Invoice / Billing Details</h4>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Company Registered ABN</label>
                  <input
                    type="text"
                    value={companyAbn}
                    onChange={(e) => setCompanyAbn(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none"
                    placeholder="e.g. 45 809 237 194"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Billing Address</label>
                  <textarea
                    rows={2}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    placeholder="Company tax registration address"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Tax billing credentials successfully updated.', 'success')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Save Invoice Details
                </button>
              </div>

              {/* Upgrade RangeCraft */}
              {user?.subscriptionTier === 'free_trial' && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setPayTarget('pro_planner');
                      setShowPayModal(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Securely Upgrade to Commercial Pro</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Columns: Platform Paid Invoices Ledger */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-white">Tax Invoice Ledger</h3>
                  <p className="text-[11px] text-slate-400">View, print, and download official Australian GST Tax Invoices.</p>
                </div>
                <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-xl border border-blue-500/20 font-bold">
                  {platformInvoices.length} Invoices Found
                </span>
              </div>

              <div className="space-y-3">
                {platformInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{inv.id}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
                            {inv.status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-300 text-[11px] line-clamp-1">{inv.itemDescription}</p>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Issued: {inv.date} • Paid via {inv.paymentMethod === 'credit_card' ? 'Visa/Mastercard' : 'PayPal'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <div className="text-right font-mono">
                        <div className="font-black text-sm text-emerald-400">{formatAud(inv.amountAud)}</div>
                        <div className="text-[9px] text-slate-500">Includes GST ${inv.gstAmount}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setViewingPlatformInvoice(inv)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Invoice</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==============================================================
          TAB 2: CLIENT CO-OP & RETAILER TRADE INVOICING
      ============================================================== */}
      {activeTab === 'co_op_billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Generate New Trade Invoice Form */}
          <div className="lg:col-span-1 space-y-6">
            <form onSubmit={handleGenerateTradeInvoice} className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-100'
            }`}>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Trade Invoice Builder</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Quickly draft catalog co-op scan rebate invoices to supermarkets.</p>
              </div>

              {/* Select Client Retailer */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Target Retailer Client</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    const acc = accounts.find(a => a.id === e.target.value);
                    if (acc) setTradeTerms(acc.creditTerms);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.companyType})</option>
                  ))}
                </select>
              </div>

              {/* Link to CRM Deal */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Link to Promotional Agreement / Deal</label>
                <select
                  value={selectedDeal}
                  onChange={(e) => handleDealSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="custom">-- Custom Trade Invoice (Unlinked) --</option>
                  {deals.map(deal => (
                    <option key={deal.id} value={deal.id}>{deal.title} (${deal.valueAud.toLocaleString()} AUD)</option>
                  ))}
                </select>
              </div>

              {/* Campaign details */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={tradeSku}
                    onChange={(e) => setTradeSku(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    placeholder="e.g. SKU-FMC-001"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Week Num</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={tradeWeek}
                    onChange={(e) => setTradeWeek(parseInt(e.target.value) || 1)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Campaign Activity / Description</label>
                <input
                  type="text"
                  value={tradeCampaignName}
                  onChange={(e) => setTradeCampaignName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  placeholder="e.g. Easter Catalogue Display Display Rebate"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Co-op Rebate Fee ($ AUD)</label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Client Credit Terms</label>
                  <input
                    type="text"
                    value={tradeTerms}
                    onChange={(e) => setTradeTerms(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    placeholder="e.g. Net 45 Days"
                  />
                </div>
              </div>

              {/* EFT payout account */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EFT Remittance instructions</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <label className="text-[9px] text-slate-500 block">Bank BSB</label>
                    <input
                      type="text"
                      value={tradeBsb}
                      onChange={(e) => setTradeBsb(e.target.value)}
                      className="w-full bg-transparent border-b border-slate-800 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block">Account Number</label>
                    <input
                      type="text"
                      value={tradeAccountNum}
                      onChange={(e) => setTradeAccountNum(e.target.value)}
                      className="w-full bg-transparent border-b border-slate-800 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Client Tax Invoice</span>
              </button>
            </form>
          </div>

          {/* Right Columns: Client Trade Invoices Ledger */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-white">Supermarket & Distributor Trade Invoices</h3>
                  <p className="text-[11px] text-slate-400">Remit co-op funds, display rebate bookings, and claim trade allowances.</p>
                </div>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-xl border border-emerald-500/20 font-bold">
                  {tradeInvoices.length} Claims Outbound
                </span>
              </div>

              <div className="space-y-3">
                {tradeInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{inv.id}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold font-mono border ${
                            inv.status === 'Paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-200 text-[11px] line-clamp-1">{inv.clientName}</p>
                        <p className="text-xs text-slate-400">{inv.campaignName} (SKU: {inv.skuCode}, W{inv.campaignWeek})</p>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Claimed: {inv.dateCreated} • Terms: {inv.paymentTerms}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <div className="text-right font-mono">
                        <div className="font-black text-sm text-emerald-400">{formatAud(inv.amountAud)}</div>
                        <div className="text-[9px] text-slate-500">+10% GST Claimable</div>
                      </div>

                      <div className="flex gap-2">
                        {inv.status !== 'Paid' && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = tradeInvoices.map(t => t.id === inv.id ? { ...t, status: 'Paid' as const } : t);
                              setTradeInvoices(next);
                              showToast(`Invoice ${inv.id} marked as settled and deposit cleared from client bank.`, 'success');
                            }}
                            className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewingTradeInvoice(inv)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Invoice PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==============================================================
          SECURE PAYROLL CHECKOUT MODAL (GATEWAY SIMULATOR)
      ============================================================== */}
      <AnimatePresence>
        {showPayModal && payTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>256-Bit SSL Encrypted Checkout</span>
                  </div>
                  <h3 className="text-lg font-black text-white">
                    Upgrade to {payTarget === 'pro_planner' ? 'Commercial Pro' : 'Enterprise Portfolio'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {checkoutStatus === 'idle' || checkoutStatus === 'authorizing' ? (
                <form onSubmit={handleProcessUpgradePay} className="space-y-4">
                  {/* Select payment method */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPaymentGatewaySelected('credit_card')}
                      className={`py-2 rounded-lg font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentGatewaySelected === 'credit_card'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Credit Card / Visa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentGatewaySelected('paypal')}
                      className={`py-2 rounded-lg font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentGatewaySelected === 'paypal'
                          ? 'bg-[#0070ba] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="italic font-black">PayPal</span>
                    </button>
                  </div>

                  {paymentGatewaySelected === 'credit_card' ? (
                    <div className="space-y-3 animate-fade-in">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                          placeholder="Name printed on card"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            className="w-full p-2.5 pl-9 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none"
                            placeholder="4111 2222 3333 4444"
                          />
                          <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Expiry Date</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">CVV Security Code</label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none"
                            placeholder="•••"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3 animate-fade-in">
                      <div className="font-bold text-white text-xs">PayPal Instant Check-Out</div>
                      <p className="text-[11px] text-slate-400">
                        Securely complete your upgrade using your connected PayPal Account balance, connected debit card, or PayPal Pay in 4.
                      </p>
                    </div>
                  )}

                  {/* Corporate invoice details inclusion */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Australian ABN</label>
                      <input
                        type="text"
                        value={checkoutAbn}
                        onChange={(e) => setCheckoutAbn(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none"
                        placeholder="ABN for Tax Invoice"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Price (AUD)</label>
                      <div className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-black text-emerald-400 font-mono">
                        ${payTarget === 'pro_planner' ? '149.00' : '499.00'} /mo
                      </div>
                    </div>
                  </div>

                  {checkoutProcessing ? (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col items-center justify-center gap-2 text-xs font-bold text-amber-400">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                      <span>Authorizing payment through Australian Bank network...</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>Process Secure payment (${payTarget === 'pro_planner' ? '149.00' : '499.00'} AUD)</span>
                    </button>
                  )}
                </form>
              ) : (
                <div className="p-8 text-center space-y-4 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-white">Payment Securely Completed!</h4>
                  <p className="text-xs text-slate-400">
                    Your active commercial planning suite is now upgraded to Commercial Pro. Official tax invoice is generated.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==============================================================
          TAX INVOICE VIEWER & PRINTING DIALOG
      ============================================================== */}
      <AnimatePresence>
        {viewingPlatformInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl p-8 sm:p-10 space-y-8 print:shadow-none print:rounded-none print:w-full print:max-w-none print:p-0"
            >
              {/* Top Action Ribbon (Hidden on Print) */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Official GST Tax Invoice (Australian Standard)</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    onClick={() => setViewingPlatformInvoice(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-all cursor-pointer"
                  >
                    Close Invoice
                  </button>
                </div>
              </div>

              {/* Printable Invoice Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <div className="text-xl font-black tracking-tight text-blue-900">RangeCraft Retail Group Pty Ltd</div>
                  <div className="text-xs text-slate-500 font-medium">ABN: 88 123 456 789 • Register # AU441920</div>
                  <div className="text-xs text-slate-500">Suite 12, Floor 5, 100 Arthur Street, North Sydney NSW 2060</div>
                  <div className="text-xs text-slate-500">Email: finance@rangecraft.au • Phone: 1300 123 456</div>
                </div>
                <div className="text-left sm:text-right space-y-1">
                  <h1 className="text-2xl font-black text-slate-900">TAX INVOICE</h1>
                  <div className="font-mono text-xs text-slate-700">Invoice ID: <strong>{viewingPlatformInvoice.id}</strong></div>
                  <div className="text-xs text-slate-500">Date Issued: {viewingPlatformInvoice.date}</div>
                  <div className="text-xs text-slate-500">Date Due: {viewingPlatformInvoice.dueDate}</div>
                  <div className="inline-block mt-2 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded">
                    PAID & SETTLED
                  </div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BILLED TO / RECIPIENT</div>
                  <div className="text-sm font-black text-slate-800 mt-1">{user?.displayName || 'Australian FMCG Merchant'}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{user?.companyName || 'Corporate Category Client'}</div>
                  <div className="text-xs text-slate-500 mt-1 max-w-xs">{companyAddress}</div>
                </div>
                <div className="sm:text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CLIENT TAX ID</div>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-1">ABN: {viewingPlatformInvoice.abn}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    Payment Method: {viewingPlatformInvoice.paymentMethod === 'credit_card' ? 'Visa Direct Credit' : 'PayPal Instant Settlement'}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="pb-3 text-left">Product / Service Description</th>
                      <th className="pb-3 text-right">Qty</th>
                      <th className="pb-3 text-right">Unit Price (ex GST)</th>
                      <th className="pb-3 text-right">Tax Rate</th>
                      <th className="pb-3 text-right">Total AUD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="py-4 font-bold text-slate-900">{viewingPlatformInvoice.itemDescription}</td>
                      <td className="py-4 text-right">1</td>
                      <td className="py-4 text-right">${(viewingPlatformInvoice.amountAud - viewingPlatformInvoice.gstAmount).toFixed(2)}</td>
                      <td className="py-4 text-right">10% GST</td>
                      <td className="py-4 text-right font-bold text-slate-900">${viewingPlatformInvoice.amountAud.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Totals */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-64 space-y-2 text-xs font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal (excluding GST)</span>
                    <span className="font-mono">${(viewingPlatformInvoice.amountAud - viewingPlatformInvoice.gstAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (10%)</span>
                    <span className="font-mono">${viewingPlatformInvoice.gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-slate-200">
                    <span>Total Paid (inc. GST)</span>
                    <span className="font-mono">${viewingPlatformInvoice.amountAud.toFixed(2)} AUD</span>
                  </div>
                </div>
              </div>

              {/* Compliance Remittance Note */}
              <div className="text-[10px] text-slate-400 text-center space-y-1">
                <p>This invoice is electronically certified. All billing satisfies ACCC and Australian Taxation Office (ATO) criteria.</p>
                <p>© 2026 RangeCraft AU. All rights reserved.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==============================================================
          B2B CLIENT TRADE INVOICE PDF VIEWER MODAL
      ============================================================== */}
      <AnimatePresence>
        {viewingTradeInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl p-8 sm:p-10 space-y-8 print:shadow-none print:rounded-none print:w-full print:max-w-none print:p-0"
            >
              {/* Top Ribbon (Hidden on Print) */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Outbound Trade Scan Rebate Co-op claim</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Trade Invoice</span>
                  </button>
                  <button
                    onClick={() => setViewingTradeInvoice(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-all cursor-pointer"
                  >
                    Close PDF
                  </button>
                </div>
              </div>

              {/* Printable Invoice Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <div className="text-xl font-black tracking-tight text-emerald-800">{user?.displayName || 'Active Category Supplier'}</div>
                  <div className="text-xs text-slate-500 font-bold">ABN: {companyAbn}</div>
                  <div className="text-xs text-slate-500">{companyAddress}</div>
                  <div className="text-xs text-slate-500">Contact: {user?.email}</div>
                </div>
                <div className="text-left sm:text-right space-y-1">
                  <h1 className="text-2xl font-black text-slate-900">TRADE TAX CLAIM</h1>
                  <div className="font-mono text-xs text-slate-700">Invoice ID: <strong>{viewingTradeInvoice.id}</strong></div>
                  <div className="text-xs text-slate-500">Date Issued: {viewingTradeInvoice.dateCreated}</div>
                  <div className="text-xs text-slate-500">Terms: {viewingTradeInvoice.paymentTerms}</div>
                  <div className={`inline-block mt-2 px-3 py-1 rounded text-[10px] font-bold border ${
                    viewingTradeInvoice.status === 'Paid' 
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                      : 'bg-amber-100 border-amber-300 text-amber-800'
                  }`}>
                    {viewingTradeInvoice.status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BILL TO / CLIENT RETAILER</div>
                  <div className="text-sm font-black text-slate-800 mt-1">{viewingTradeInvoice.clientName}</div>
                  <div className="text-xs text-slate-500 mt-1">National Retail Group Buying Operations</div>
                  <div className="text-xs text-slate-500">National Grocery Category Finance Hub</div>
                </div>
                <div className="sm:text-right space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REMITTANCE INSTRUCTIONS</div>
                  <div className="text-xs text-slate-700">Please pay EFT Direct Transfer:</div>
                  <div className="font-mono font-bold text-slate-900">BSB: {viewingTradeInvoice.payoutBsb}</div>
                  <div className="font-mono font-bold text-slate-900">Acc: {viewingTradeInvoice.payoutAccount}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-medium">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="pb-3 text-left">Promotional Co-op Campaign Description</th>
                      <th className="pb-3 text-right">Week</th>
                      <th className="pb-3 text-right">SKU Code</th>
                      <th className="pb-3 text-right">Tax Rate</th>
                      <th className="pb-3 text-right">Total Claim AUD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-4 font-bold text-slate-900">
                        {viewingTradeInvoice.campaignName}
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Agreement rebate for national catalogue display</span>
                      </td>
                      <td className="py-4 text-right font-mono">W{viewingTradeInvoice.campaignWeek}</td>
                      <td className="py-4 text-right font-mono text-amber-600 font-bold">{viewingTradeInvoice.skuCode}</td>
                      <td className="py-4 text-right">10% GST</td>
                      <td className="py-4 text-right font-bold text-slate-900">${viewingTradeInvoice.amountAud.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end pt-4 border-t border-slate-200 text-xs">
                <div className="w-64 space-y-2 font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Trade Rebate Value (ex GST)</span>
                    <span className="font-mono">${(viewingTradeInvoice.amountAud / 1.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST Rate (10%)</span>
                    <span className="font-mono">${(viewingTradeInvoice.amountAud - (viewingTradeInvoice.amountAud / 1.1)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-slate-200">
                    <span>Total Claim Value (inc. GST)</span>
                    <span className="font-mono">${viewingTradeInvoice.amountAud.toFixed(2)} AUD</span>
                  </div>
                </div>
              </div>

              {/* Payout Reminders */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">Notice to Retail Category Coordinator:</p>
                <p>This claim form is raised under the Joint Trading Terms agreement signed for FY26. Rebates are calculated scan-funding or off-invoice based on actual supermarket checkout transactions. Please route remittance slips to the supplier address above.</p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
