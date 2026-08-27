import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CrmAccount, 
  CrmDeal, 
  CrmActivity, 
  BusinessPersona, 
  Product, 
  ThemeMode,
  TradingTerms,
  TradingTermsSkuScope
} from '../types';
import { 
  Building2, 
  Users, 
  Briefcase, 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Tag, 
  ShieldAlert, 
  Sparkles,
  Store,
  ShoppingCart,
  Truck,
  Globe,
  Award,
  FileText,
  Percent,
  Layers,
  ChevronRight,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { formatAud } from '../utils/formatters';
import { SAMPLE_CRM_ACCOUNTS, SAMPLE_CRM_DEALS, SAMPLE_CRM_ACTIVITIES } from '../data/crmInitialData';

interface CrmModuleProps {
  accounts: CrmAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<CrmAccount[]>>;
  deals: CrmDeal[];
  setDeals: React.Dispatch<React.SetStateAction<CrmDeal[]>>;
  activities: CrmActivity[];
  setActivities: React.Dispatch<React.SetStateAction<CrmActivity[]>>;
  tradingTerms?: TradingTerms[];
  setTradingTerms?: React.Dispatch<React.SetStateAction<TradingTerms[]>>;
  onOpenTradingTermsModal?: (terms?: TradingTerms | null, targetAccount?: CrmAccount) => void;
  products: Product[];
  currentTheme: ThemeMode;
  businessPersona: BusinessPersona;
  setBusinessPersona: (persona: BusinessPersona) => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
  logActivity: (category: any, action: string, description: string) => void;
}

const PERSONA_LABELS: Record<BusinessPersona, { title: string; icon: any; description: string }> = {
  independent_shop: {
    title: 'Independent Shop Owner',
    icon: Store,
    description: 'Manage local retail doors, local supplier terms, boutique margins, and weekend footfall promos.'
  },
  amazon_ebay_seller: {
    title: 'Amazon & eBay Marketplace Seller',
    icon: ShoppingCart,
    description: 'Optimize FBA inventory, Lightning Deals, Prime Day bundles, and platform commission margins.'
  },
  brand_sales_rep: {
    title: 'FMCG / Consumer Goods Sales Rep',
    icon: Briefcase,
    description: 'Pitch category reviews to major retailers, manage co-op trade spend, and secure catalog slots.'
  },
  retail_buyer: {
    title: 'Retail Category Buyer',
    icon: Users,
    description: 'Audit supplier promotional calendars, verify ACCC hiatus rules, and negotiate supplier scan rebates.'
  },
  distributor: {
    title: 'Wholesale Distributor',
    icon: Truck,
    description: 'Coordinate multi-door distribution logistics, B2B credit terms, and regional seasonal spikes.'
  },
  d2c_ecommerce_manager: {
    title: 'D2C E-commerce Manager',
    icon: Globe,
    description: 'Plan Shopify / Klaviyo EDM flash sales, multi-buy bundles, and acquisition CAC vs LTV margins.'
  }
};

export const CrmModule: React.FC<CrmModuleProps> = ({
  accounts,
  setAccounts,
  deals,
  setDeals,
  activities,
  setActivities,
  tradingTerms = [],
  setTradingTerms,
  onOpenTradingTermsModal,
  products,
  currentTheme,
  businessPersona,
  setBusinessPersona,
  showToast,
  logActivity
}) => {
  const isLight = currentTheme.includes('light');
  const [activeCrmTab, setActiveCrmTab] = useState<'accounts' | 'deals' | 'trading_terms' | 'activities' | 'persona'>('accounts');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');
  const [termsScopeFilter, setTermsScopeFilter] = useState<string>('All');

  // Modal states
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);

  // New Account Form
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<any>('Retailer');
  const [newAccContact, setNewAccContact] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPhone, setNewAccPhone] = useState('');
  const [newAccRegion, setNewAccRegion] = useState('Australia');
  const [newAccTerms, setNewAccTerms] = useState('Net 30 Days');
  const [newAccNotes, setNewAccNotes] = useState('');

  // New Deal Form
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealAccountId, setNewDealAccountId] = useState(accounts[0]?.id || '');
  const [newDealValue, setNewDealValue] = useState(50000);
  const [newDealWeek, setNewDealWeek] = useState(12);
  const [newDealSku, setNewDealSku] = useState(products[0]?.sku || '');
  const [newDealStage, setNewDealStage] = useState<any>('Prospecting');

  // New Activity Form
  const [newActAccountId, setNewActAccountId] = useState(accounts[0]?.id || '');
  const [newActType, setNewActType] = useState<any>('Call');
  const [newActSubject, setNewActSubject] = useState('');
  const [newActNotes, setNewActNotes] = useState('');
  const [newActStatus, setNewActStatus] = useState<any>('Completed');

  // Computed metrics
  const totalPipelineAud = deals.reduce((sum, d) => sum + (d.stage !== 'Lost' ? d.valueAud : 0), 0);
  const contractedAud = deals.reduce((sum, d) => sum + (d.stage === 'Contracted' || d.stage === 'Closed Won' ? d.valueAud : 0), 0);
  const activePartnersCount = accounts.filter(a => a.status === 'Active Partner').length;
  const totalOverAndAboveSpend = tradingTerms.reduce((sum, t) => sum + (t.overAndAboveSpendAud || 0), 0);
  const avgBaseScanRebate = tradingTerms.length > 0
    ? (tradingTerms.reduce((sum, t) => sum + t.baseRatePercent, 0) / tradingTerms.length).toFixed(1)
    : '10.0';

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) {
      showToast('Please enter an account or company name.', 'info');
      return;
    }
    const newAccount: CrmAccount = {
      id: `acc-${Date.now()}`,
      name: newAccName,
      companyType: newAccType,
      contactName: newAccContact || 'Primary Buyer',
      email: newAccEmail || 'contact@company.com',
      phone: newAccPhone || '+61 2 9000 0000',
      status: 'Prospect',
      assignedSkuSkus: [products[0]?.sku || 'SKU-01'],
      totalPipelineValueAud: 25000,
      creditTerms: newAccTerms,
      notes: newAccNotes || 'Created via Omni-Trade CRM Hub.',
      lastInteractionDate: new Date().toISOString().split('T')[0],
      marketRegion: newAccRegion
    };
    setAccounts([newAccount, ...accounts]);
    logActivity('System', 'Created CRM Account', `Added new account: ${newAccName} (${newAccType})`);
    showToast(`Successfully added CRM Account: ${newAccName}`);
    setIsNewAccountModalOpen(false);
    // reset form
    setNewAccName('');
    setNewAccContact('');
    setNewAccEmail('');
    setNewAccPhone('');
    setNewAccNotes('');
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle.trim()) {
      showToast('Please enter a deal title.', 'info');
      return;
    }
    const targetAcc = accounts.find(a => a.id === newDealAccountId) || accounts[0];
    const newDeal: CrmDeal = {
      id: `deal-${Date.now()}`,
      title: newDealTitle,
      accountId: targetAcc?.id || 'acc-1',
      accountName: targetAcc?.name || 'Partner Account',
      stage: newDealStage,
      valueAud: Number(newDealValue) || 10000,
      targetWeekNum: Number(newDealWeek) || 1,
      assignedSku: newDealSku,
      probabilityPercent: newDealStage === 'Contracted' || newDealStage === 'Closed Won' ? 100 : newDealStage === 'Negotiation' ? 75 : 40,
      expectedCloseDate: new Date().toISOString().split('T')[0]
    };
    setDeals([newDeal, ...deals]);
    logActivity('System', 'Created Commercial Deal', `Added deal "${newDealTitle}" valued at $${newDeal.valueAud.toLocaleString()}`);
    showToast(`Successfully created deal pipeline record.`);
    setIsNewDealModalOpen(false);
    setNewDealTitle('');
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActSubject.trim()) {
      showToast('Please enter an activity subject.', 'info');
      return;
    }
    const targetAcc = accounts.find(a => a.id === newActAccountId) || accounts[0];
    const newActivity: CrmActivity = {
      id: `act-${Date.now()}`,
      accountId: targetAcc?.id || 'acc-1',
      accountName: targetAcc?.name || 'Partner Account',
      type: newActType,
      subject: newActSubject,
      notes: newActNotes || 'Logged interaction.',
      date: new Date().toISOString().split('T')[0],
      status: newActStatus,
      userEmail: 'user@rangecraft.au'
    };
    setActivities([newActivity, ...activities]);
    logActivity('System', 'Logged CRM Activity', `Recorded ${newActType}: ${newActSubject}`);
    showToast(`Successfully logged activity.`);
    setIsNewActivityModalOpen(false);
    setNewActSubject('');
    setNewActNotes('');
  };

  // Filtered lists
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          acc.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          acc.marketRegion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'All' || acc.companyType === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          deal.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStageFilter === 'All' || deal.stage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      
      {/* ----------------------------------------------------
          1. HEADER & HIGH-LEVEL CRM KPIS
      ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-700">
              Omni-Trade B2B CRM & Pipeline
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Persona: {PERSONA_LABELS[businessPersona].title}
            </span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Consumer Goods & Retail CRM Hub
          </h1>
          <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Connect your promotional calendar directly to retail buyers, marketplace partners, wholesale distributors, and independent shop accounts. Track pipeline revenue and supplier co-op funding.
          </p>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewAccountModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner Account</span>
          </button>
          <button
            onClick={() => setIsNewDealModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
              isLight ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <span>New Commercial Deal</span>
          </button>
          <button
            onClick={() => setIsNewActivityModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
              isLight ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-purple-400" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Total Pipeline Value */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141a28] border-[#222f46]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Deal Pipeline</span>
            <div className="w-8 h-8 rounded-xl bg-blue-950 flex items-center justify-center text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-blue-400">
            ${(totalPipelineAud).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {deals.length} active promotional pitches</p>
        </div>

        {/* Contracted / Secured Revenue */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141a28] border-[#222f46]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Secured & Contracted</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            ${(contractedAud).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed buyer purchase orders</p>
        </div>

        {/* Active Partner Accounts */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141a28] border-[#222f46]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Partners</span>
            <div className="w-8 h-8 rounded-xl bg-purple-950 flex items-center justify-center text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-purple-400">
            {activePartnersCount} <span className="text-xs font-normal text-slate-400">/ {accounts.length} Total</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Retailers, Marketplaces & Distributors</p>
        </div>

        {/* Recent Activities */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141a28] border-[#222f46]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Logged Interactions</span>
            <div className="w-8 h-8 rounded-xl bg-amber-950 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {activities.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Range reviews, calls & contracts</p>
        </div>

      </div>

      {/* ----------------------------------------------------
          2. CRM NAVIGATION SUB-TABS
      ---------------------------------------------------- */}
      <div className="flex items-center gap-2 mb-6 border-b pb-3 border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveCrmTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCrmTab === 'accounts'
              ? 'bg-blue-600 text-white shadow-md shadow-lg'
              : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Accounts & Buyers ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveCrmTab('deals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCrmTab === 'deals'
              ? 'bg-blue-600 text-white shadow-md shadow-lg'
              : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Deal Pipeline ({deals.length})</span>
        </button>

        <button
          onClick={() => setActiveCrmTab('trading_terms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCrmTab === 'trading_terms'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-lg'
              : isLight ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200' : 'bg-amber-950 text-amber-300 hover:bg-amber-950 border border-amber-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Trading Terms & Scan Rebates ({tradingTerms.length})</span>
        </button>

        <button
          onClick={() => setActiveCrmTab('activities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCrmTab === 'activities'
              ? 'bg-blue-600 text-white shadow-md shadow-lg'
              : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Activity Log ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveCrmTab('persona')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCrmTab === 'persona'
              ? 'bg-purple-600 text-white shadow-md shadow-lg'
              : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-300" />
          <span>Business Persona & Audience Setup</span>
        </button>
      </div>

      {/* ----------------------------------------------------
          3. TAB 1: ACCOUNTS & BUYERS VIEW
      ---------------------------------------------------- */}
      {activeCrmTab === 'accounts' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-[#222f46]'
          }`}>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partner accounts, buyers, or regions..."
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0a0d14] border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0a0d14] border-slate-700 text-white'
                }`}
              >
                <option value="All">All Company Types</option>
                <option value="Retailer">Retailer</option>
                <option value="Marketplace Partner">Marketplace Partner</option>
                <option value="Wholesale Distributor">Wholesale Distributor</option>
                <option value="Independent Shop">Independent Shop</option>
              </select>
            </div>
          </div>

          {/* Accounts Grid */}
          {filteredAccounts.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center ${isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-[#222f46]'}`}>
              <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className={`text-base font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                No Partner Accounts Found
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                Your CRM is currently clean. You can add your own retail partner accounts (Coles, Woolworths, Metcash, Amazon) or load FMCG benchmark samples.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setIsNewAccountModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Account</span>
                </button>
                <button
                  onClick={() => {
                    setAccounts(SAMPLE_CRM_ACCOUNTS);
                    setDeals(SAMPLE_CRM_DEALS);
                    setActivities(SAMPLE_CRM_ACTIVITIES);
                    showToast('Loaded FMCG sample retail partners & deals', 'success');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Load FMCG Sample Records</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map(account => (
              <div
                key={account.id}
                className={`p-5 rounded-2xl border transition-all hover:border-blue-700 flex flex-col justify-between ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141a28] border-[#222f46]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        account.companyType === 'Retailer' ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' :
                        account.companyType === 'Marketplace Partner' ? 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' :
                        account.companyType === 'Wholesale Distributor' ? 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' :
                        'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      }`}>
                        {account.companyType}
                      </span>
                      <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {account.name}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      account.status === 'Active Partner' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' :
                      account.status === 'Negotiating' ? 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' :
                      'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                    }`}>
                      {account.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-semibold text-slate-300">{account.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={'mailto:' + account.email} className="hover:text-blue-400 transition-colors">{account.email}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{account.phone}</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl mb-4 text-xs ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-[#0e1320] border border-[#1e283d]'}`}>
                    <p className="text-[11px] text-slate-400 mb-1 font-semibold">Terms & Region:</p>
                    <p className="font-mono text-slate-300">{account.creditTerms}</p>
                    <p className="text-slate-400 mt-1">Region: <span className="text-slate-200">{account.marketRegion}</span></p>
                  </div>

                  <p className="text-xs text-slate-400 italic mb-4 line-clamp-2">
                    "{account.notes}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pipeline Value</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ${account.totalPipelineValueAud.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {onOpenTradingTermsModal && (
                      <button
                        onClick={() => onOpenTradingTermsModal(null, account)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-500 text-amber-800 hover:text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-amber-300 hover:border-amber-400 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                        title={`Manage or add Trading Terms for ${account.name}`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Terms</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        showToast(`Opened account dossier for ${account.name}`, 'info');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-600 text-blue-800 hover:text-white text-xs font-bold transition-all cursor-pointer dark:bg-blue-950 dark:text-blue-300"
                    >
                      Dossier
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          3.5 TAB: TRADING TERMS & SCAN REBATES VIEW
      ---------------------------------------------------- */}
      {activeCrmTab === 'trading_terms' && (
        <div className="space-y-6">
          {/* Header Action & Top Summary */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141a28] border-[#222f46]'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                  Commercial Agreements
                </span>
                <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Retail Trading Terms & Scan Rebate Contracts
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                Define terms by contact, select all SKUs or specific product categories, set scan rebate percentages (e.g. 10%), over & above promotional funding, and volume incentive threshold targets.
              </p>
            </div>

            {onOpenTradingTermsModal && (
              <button
                onClick={() => onOpenTradingTermsModal(null)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>New Trading Terms Agreement</span>
              </button>
            )}
          </div>

          {/* KPI Mini-Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f1422] border-[#1e2638]'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Active Agreements</div>
              <div className="text-2xl font-black font-mono text-amber-400">
                {tradingTerms.filter(t => t.status === 'Signed & Binding' || (t.status as any) === 'active').length}
                <span className="text-xs text-slate-400 font-normal ml-1">/ {tradingTerms.length} total</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f1422] border-[#1e2638]'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Average Base Scan Rate</div>
              <div className="text-2xl font-black font-mono text-blue-400">
                {avgBaseScanRebate}%
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f1422] border-[#1e2638]'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Over & Above Co-Op Budget</div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                ${totalOverAndAboveSpend.toLocaleString()}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f1422] border-[#1e2638]'}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Volume Targets Tracked</div>
              <div className="text-2xl font-black font-mono text-purple-400">
                {tradingTerms.filter(t => (t.volumeThresholdAud || (t as any).volumeIncentiveTargetAud || 0) > 0).length}
                <span className="text-xs text-slate-400 font-normal ml-1">accounts</span>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-[#222f46]'
          }`}>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search terms agreements, accounts, contacts..."
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0a0d14] border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={termsScopeFilter}
                onChange={(e) => setTermsScopeFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0a0d14] border-slate-700 text-white'
                }`}
              >
                <option value="All">All SKU Scopes</option>
                <option value="all_skus">All Portfolio SKUs</option>
                <option value="category">Specific Categories</option>
                <option value="selected_skus">Individual SKUs</option>
              </select>
            </div>
          </div>

          {/* Terms Agreement Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tradingTerms
              .filter(t => {
                const titleStr = t.title || (t as any).agreementTitle || '';
                const accStr = t.targetAccountName || (t as any).accountName || '';
                const contactStr = t.contactName || '';
                const matchSearch = (
                  titleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  accStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  contactStr.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const scope = t.skuScope || 'all_skus';
                const matchScope = termsScopeFilter === 'All' || 
                  scope === termsScopeFilter || 
                  (termsScopeFilter === 'category' && (scope === 'category' || (scope as any) === 'selected_categories')) ||
                  (termsScopeFilter === 'selected_skus' && (scope === 'selected_skus' || (scope as any) === 'individual_skus'));
                return matchSearch && matchScope;
              })
              .map(term => {
                const termTitle = term.title || (term as any).agreementTitle || 'Commercial Agreement';
                const accName = term.targetAccountName || (term as any).accountName || 'Partner Account';
                const period = term.promotionalPeriod || (term as any).agreementPeriod || 'FY26';
                const scope = term.skuScope || 'all_skus';
                const effectiveStart = term.effectiveFrom || (term as any).effectiveStartDate || '2026-01-01';
                const effectiveEnd = term.effectiveTo || (term as any).effectiveEndDate || '2026-12-31';
                const volumeTarget = term.volumeThresholdAud || (term as any).volumeIncentiveTargetAud || 0;
                const skuCodes = term.selectedSkuCodes || (term as any).selectedSkuIds || [];
                const settlement = term.settlementFrequency || `${term.paymentTermsDays || 30} Days`;

                return (
                  <div
                    key={term.id}
                    className={`p-5 rounded-2xl border transition-all hover:border-amber-700 flex flex-col justify-between ${
                      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141a28] border-[#222f46]'
                    }`}
                  >
                    <div>
                      {/* Header line */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              scope === 'all_skus' ? 'bg-blue-950 text-blue-400 border border-blue-700' :
                              scope === 'category' || (scope as any) === 'selected_categories' ? 'bg-purple-950 text-purple-400 border border-purple-700' :
                              'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            }`}>
                              {scope === 'all_skus' ? 'All Portfolio SKUs' :
                               scope === 'category' || (scope as any) === 'selected_categories' ? 'Category Specific' : 'Individual SKUs'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {period}
                            </span>
                          </div>
                          <h4 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {termTitle}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-semibold text-slate-300">{accName}</span>
                            {term.contactName && (
                              <>
                                <span>•</span>
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>{term.contactName}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                          term.status === 'Signed & Binding' || (term.status as any) === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' :
                          term.status === 'Under Negotiation' || (term.status as any) === 'under_review' ? 'bg-amber-950 text-amber-400 border border-amber-700' :
                          term.status === 'Draft' || (term.status as any) === 'draft' ? 'bg-blue-950 text-blue-400 border border-blue-700' :
                          'bg-slate-950 text-slate-400 border border-slate-700'
                        }`}>
                          {term.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Scope details pills */}
                      {(scope === 'category' || (scope as any) === 'selected_categories') && term.selectedCategories && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className="text-[11px] text-slate-400 font-semibold">Categories:</span>
                          {term.selectedCategories.map((cat, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[11px] font-mono border border-purple-700">
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}

                      {(scope === 'selected_skus' || (scope as any) === 'individual_skus') && skuCodes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className="text-[11px] text-slate-400 font-semibold">SKUs ({skuCodes.length}):</span>
                          {skuCodes.slice(0, 3).map((skuId, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[11px] font-mono border border-emerald-700">
                              {skuId}
                            </span>
                          ))}
                          {skuCodes.length > 3 && (
                            <span className="text-[11px] text-slate-400">+{skuCodes.length - 3} more</span>
                          )}
                        </div>
                      )}

                      {/* Core Financial Rates Box */}
                      <div className={`p-3.5 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3 text-xs ${
                        isLight ? 'bg-slate-50 border border-slate-200' : 'bg-[#0b101c] border border-[#1e283d]'
                      }`}>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Base Scan Rate</span>
                          <span className="text-base font-mono font-black text-amber-400">
                            {term.baseRatePercent}% <span className="text-[10px] font-normal text-slate-400">of scan</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Over & Above Spend</span>
                          <span className="text-base font-mono font-black text-emerald-400">
                            ${(term.overAndAboveSpendAud || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Settlement</span>
                          <span className="text-xs font-mono font-bold text-slate-300">
                            {settlement}
                          </span>
                        </div>
                      </div>

                      {/* Volume Incentive Target Badge (if applicable) */}
                      {volumeTarget > 0 && (
                        <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-700 text-xs mb-3 flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-purple-300">
                              Volume Target: ${volumeTarget.toLocaleString()} AUD
                            </div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                              {term.incentiveRewardDescription || (term as any).volumeIncentiveDescription || 'Volume incentive rebate tier applies'}
                            </div>
                          </div>
                        </div>
                      )}

                      {term.notes && (
                        <p className="text-xs text-slate-400 italic line-clamp-2 mb-3">
                          "{term.notes}"
                        </p>
                      )}
                    </div>

                    {/* Footer actions */}
                    <div className="pt-3 border-t border-slate-700 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        Valid: {effectiveStart} → {effectiveEnd}
                      </span>

                      <div className="flex items-center gap-2">
                        {onOpenTradingTermsModal && (
                          <button
                            onClick={() => onOpenTradingTermsModal(term)}
                            className="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold transition-all cursor-pointer"
                          >
                            Edit Terms
                          </button>
                        )}
                        <button
                          onClick={() => {
                            showToast(`Exported trading terms contract for ${accName}`, 'success');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          PDF Agreement
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          4. TAB 2: DEALS PIPELINE VIEW
      ---------------------------------------------------- */}
      {activeCrmTab === 'deals' && (
        <div className="space-y-6">
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-[#222f46]'
          }`}>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deals or partner accounts..."
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border focus:outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0a0d14] border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0a0d14] border-slate-700 text-white'
                }`}
              >
                <option value="All">All Deal Stages</option>
                <option value="Prospecting">Prospecting</option>
                <option value="Pitch Sent">Pitch Sent</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Contracted">Contracted</option>
                <option value="Closed Won">Closed Won</option>
              </select>
            </div>
          </div>

          {/* Deals Table */}
          {filteredDeals.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center ${isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-[#222f46]'}`}>
              <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className={`text-base font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                No Deal Opportunities Logged
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                No pipeline deals or promotional commitments currently tracked. Create a promotional slot deal or load FMCG samples.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setIsNewDealModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Deal</span>
                </button>
                <button
                  onClick={() => {
                    setAccounts(SAMPLE_CRM_ACCOUNTS);
                    setDeals(SAMPLE_CRM_DEALS);
                    setActivities(SAMPLE_CRM_ACTIVITIES);
                    showToast('Loaded FMCG sample deals & accounts', 'success');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Load Sample Deals</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-hidden ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141a28] border-[#222f46]'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b ${isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0e1320] text-slate-300 border-[#1e283d]'}`}>
                    <tr>
                      <th className="p-3.5 font-bold">Deal Opportunity</th>
                      <th className="p-3.5 font-bold">Partner Account</th>
                      <th className="p-3.5 font-bold">Stage</th>
                      <th className="p-3.5 font-bold">Target Week</th>
                      <th className="p-3.5 font-bold">Assigned SKU</th>
                      <th className="p-3.5 font-bold text-right">Value (AUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {filteredDeals.map(deal => (
                      <tr key={deal.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-950'}`}>
                        <td className="p-3.5 font-semibold text-white">
                          {deal.title}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {deal.accountName}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            deal.stage === 'Contracted' || deal.stage === 'Closed Won' ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' :
                            deal.stage === 'Negotiation' ? 'bg-amber-950 text-amber-400 border border-amber-700' :
                            'bg-blue-950 text-blue-400 border border-blue-700'
                          }`}>
                            {deal.stage}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-blue-400">
                          Week {deal.targetWeekNum}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {deal.assignedSku}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-right text-emerald-400">
                          ${deal.valueAud.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          5. TAB 3: ACTIVITIES & MEETING LOG
      ---------------------------------------------------- */}
      {activeCrmTab === 'activities' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map(act => (
              <div 
                key={act.id} 
                className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141a28] border-[#222f46]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-700">
                      {act.type}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{act.date}</span>
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {act.subject}
                  </h4>
                  <p className="text-xs text-blue-400 mb-2 font-semibold">
                    {act.accountName}
                  </p>
                  <p className="text-xs text-slate-400 mb-4">
                    {act.notes}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-700 text-xs">
                  <span className="text-slate-400">Logged by: {act.userEmail}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    act.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                  }`}>
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          6. TAB 4: BUSINESS PERSONA & AUDIENCE SETUP
      ---------------------------------------------------- */}
      {activeCrmTab === 'persona' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-[#222f46]'}`}>
          <div>
            <h2 className={`text-lg font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Select Your Consumer Goods Business Profile
            </h2>
            <p className="text-xs text-slate-400">
              Customize RangeCraft Omni-Trade CRM to match your exact business model, whether you run a local shop, sell on Amazon/eBay, manage brand sales reps, or buy for a major retail group.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(PERSONA_LABELS) as BusinessPersona[]).map((personaKey) => {
              const personaInfo = PERSONA_LABELS[personaKey];
              const IconComp = personaInfo.icon;
              const isSelected = businessPersona === personaKey;

              return (
                <div
                  key={personaKey}
                  onClick={() => {
                    setBusinessPersona(personaKey);
                    showToast(`Switched business persona to: ${personaInfo.title}`);
                    logActivity('System', 'Updated Business Persona', `Switched user profile persona to ${personaInfo.title}`);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-950 border-blue-500 shadow-md shadow-lg'
                      : isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-[#0e1320] border-[#1e283d] hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-blue-400'
                      }`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                          Active Profile
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {personaInfo.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {personaInfo.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-xs font-semibold text-blue-400">
                    <span>{isSelected ? 'Configured for your workflow' : 'Click to select profile'}</span>
                    <span>➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODALS FOR ADDING ACCOUNT / DEAL / ACTIVITY
      ---------------------------------------------------- */}
      {/* New Account Modal */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-[#222f46] text-white'}`}
          >
            <h3 className="text-lg font-bold mb-4">Add New Partner Account</h3>
            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Account / Company Name</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  placeholder="e.g. National Supermarkets or Boutique Shop Sydney"
                  className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Company Type</label>
                  <select
                    value={newAccType}
                    onChange={e => setNewAccType(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  >
                    <option value="Retailer">Retailer</option>
                    <option value="Marketplace Partner">Marketplace Partner</option>
                    <option value="Wholesale Distributor">Wholesale Distributor</option>
                    <option value="Independent Shop">Independent Shop</option>
                    <option value="Direct Consumer Brand">Direct Consumer Brand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Market Region</label>
                  <input
                    type="text"
                    value={newAccRegion}
                    onChange={e => setNewAccRegion(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Primary Contact Name</label>
                  <input
                    type="text"
                    value={newAccContact}
                    onChange={e => setNewAccContact(e.target.value)}
                    placeholder="e.g. John Buyer"
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={newAccEmail}
                    onChange={e => setNewAccEmail(e.target.value)}
                    placeholder="buyer@company.com"
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Credit / Payment Terms</label>
                <input
                  type="text"
                  value={newAccTerms}
                  onChange={e => setNewAccTerms(e.target.value)}
                  placeholder="e.g. Net 30 Days or Scan-Based Trading"
                  className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Notes & Requirements</label>
                <textarea
                  rows={2}
                  value={newAccNotes}
                  onChange={e => setNewAccNotes(e.target.value)}
                  placeholder="Range review notes, hiatus rules..."
                  className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-950 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-lg"
                >
                  Save Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* New Deal Modal */}
      {isNewDealModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-[#222f46] text-white'}`}
          >
            <h3 className="text-lg font-bold mb-4">Create Commercial Deal Pipeline Record</h3>
            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Deal Title / Promotion Name</label>
                <input
                  type="text"
                  required
                  value={newDealTitle}
                  onChange={e => setNewDealTitle(e.target.value)}
                  placeholder="e.g. Spring Catalogue End-Cap Placement"
                  className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Partner Account</label>
                  <select
                    value={newDealAccountId}
                    onChange={e => setNewDealAccountId(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Deal Stage</label>
                  <select
                    value={newDealStage}
                    onChange={e => setNewDealStage(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  >
                    <option value="Prospecting">Prospecting</option>
                    <option value="Pitch Sent">Pitch Sent</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Contracted">Contracted</option>
                    <option value="Closed Won">Closed Won</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Value (AUD)</label>
                  <input
                    type="number"
                    value={newDealValue}
                    onChange={e => setNewDealValue(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Target Week (1-52)</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={newDealWeek}
                    onChange={e => setNewDealWeek(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Assigned SKU</label>
                  <select
                    value={newDealSku}
                    onChange={e => setNewDealSku(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  >
                    {products.map((p, idx) => (
                      <option key={`crm-sku-${p.sku}-${idx}`} value={p.sku}>{p.sku} - {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewDealModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-950 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-lg"
                >
                  Save Deal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* New Activity Modal */}
      {isNewActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#141a28] border-[#222f46] text-white'}`}
          >
            <h3 className="text-lg font-bold mb-4">Log CRM Interaction</h3>
            <form onSubmit={handleCreateActivity} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Partner Account</label>
                  <select
                    value={newActAccountId}
                    onChange={e => setNewActAccountId(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Interaction Type</label>
                  <select
                    value={newActType}
                    onChange={e => setNewActType(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                  >
                    <option value="Call">Phone Call</option>
                    <option value="Range Review">Range Review</option>
                    <option value="Sample Dispatch">Sample Dispatch</option>
                    <option value="Co-op Pitch">Co-op Pitch</option>
                    <option value="Contract Signing">Contract Signing</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Subject</label>
                <input
                  type="text"
                  required
                  value={newActSubject}
                  onChange={e => setNewActSubject(e.target.value)}
                  placeholder="e.g. Spring Range Review Meeting"
                  className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Meeting Notes & Outcomes</label>
                <textarea
                  rows={3}
                  value={newActNotes}
                  onChange={e => setNewActNotes(e.target.value)}
                  placeholder="Summary of discussion..."
                  className={`w-full p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0a0d14] border-slate-700 text-white'}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewActivityModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-950 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-lg"
                >
                  Log Activity
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
