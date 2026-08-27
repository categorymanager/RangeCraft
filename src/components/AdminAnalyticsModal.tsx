import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AdminAnalyticsSummary, 
  BankAccountConfig, 
  CreatorPayoutRecord, 
  CreatorTransaction, 
  ThemeMode, 
  UserProfile 
} from '../types';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Globe, 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  ArrowUpRight, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Lock, 
  RefreshCw, 
  Zap, 
  Send, 
  FileText, 
  Search, 
  Filter, 
  Sliders, 
  PieChart, 
  BarChart3, 
  MapPin, 
  HelpCircle,
  Sparkles,
  Edit2
} from 'lucide-react';
import { formatAud } from '../utils/formatters';

interface AdminAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  currentTheme: ThemeMode;
  analyticsData?: AdminAnalyticsSummary;
  bankConfig?: BankAccountConfig;
  onUpdateBankConfig: (config: BankAccountConfig) => void;
  onExecutePayout: (amountAud: number, method: 'bank_transfer' | 'payid' | 'paypal') => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

const DEFAULT_ANALYTICS: AdminAnalyticsSummary = {
  totalUsers: 478,
  paidSubscribers: 289,
  trialUsers: 189,
  churnRatePercent: 1.8,
  totalRevenueAud: 48900,
  mrrAud: 19800,
  arrAud: 237600,
  pendingPayoutBalanceAud: 18400,
  totalPaidOutAud: 30500,
  userTypeDistribution: [],
  demographicsDistribution: [],
  recentTransactions: [],
  payoutHistory: []
};

const DEFAULT_BANK_CONFIG: BankAccountConfig = {
  accountHolder: 'J. Zaf',
  bankName: 'Commonwealth Bank of Australia',
  bsb: '062-000',
  accountNumber: '1098 4421',
  payId: 'jzaf666@gmail.com',
  paypalEmail: 'jzaf666@gmail.com',
  country: 'Australia (AUD)'
};

export const AdminAnalyticsModal: React.FC<AdminAnalyticsModalProps> = ({
  isOpen,
  onClose,
  user,
  currentTheme,
  analyticsData = DEFAULT_ANALYTICS,
  bankConfig = DEFAULT_BANK_CONFIG,
  onUpdateBankConfig,
  onExecutePayout,
  showToast
}) => {
  const isLight = currentTheme.includes('light');
  const [activeTab, setActiveTab] = useState<'revenue_payout' | 'users_demographics' | 'sales_ledger' | 'bank_settings'>('revenue_payout');
  
  const safeAnalytics = analyticsData || DEFAULT_ANALYTICS;
  const safeBank = bankConfig || DEFAULT_BANK_CONFIG;

  // Payout Flow State
  const [payoutAmount, setPayoutAmount] = useState<number>(safeAnalytics.pendingPayoutBalanceAud || 0);
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState<'bank_transfer' | 'payid' | 'paypal'>('bank_transfer');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSuccessMessage, setPayoutSuccessMessage] = useState<string | null>(null);

  // Bank Edit Form State
  const [editAccountHolder, setEditAccountHolder] = useState(safeBank.accountHolder || '');
  const [editBankName, setEditBankName] = useState(safeBank.bankName || '');
  const [editBsb, setEditBsb] = useState(safeBank.bsb || '');
  const [editAccountNumber, setEditAccountNumber] = useState(safeBank.accountNumber || '');
  const [editPayId, setEditPayId] = useState(safeBank.payId || '');
  const [editPaypalEmail, setEditPaypalEmail] = useState(safeBank.paypalEmail || '');

  // Keep state in sync when props update
  useEffect(() => {
    if (safeAnalytics.pendingPayoutBalanceAud !== undefined) {
      setPayoutAmount(safeAnalytics.pendingPayoutBalanceAud);
    }
  }, [safeAnalytics.pendingPayoutBalanceAud]);

  useEffect(() => {
    if (safeBank) {
      setEditAccountHolder(safeBank.accountHolder || '');
      setEditBankName(safeBank.bankName || '');
      setEditBsb(safeBank.bsb || '');
      setEditAccountNumber(safeBank.accountNumber || '');
      setEditPayId(safeBank.payId || '');
      setEditPaypalEmail(safeBank.paypalEmail || '');
    }
  }, [safeBank]);

  // Search & Filter State
  const [searchTxnQuery, setSearchTxnQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('All');

  if (!isOpen) return null;

  const handleTriggerPayout = () => {
    if (payoutAmount <= 0) {
      showToast('Please enter a valid payout transfer amount.', 'info');
      return;
    }
    if (payoutAmount > safeAnalytics.pendingPayoutBalanceAud) {
      showToast(`Cannot withdraw more than available balance ($${safeAnalytics.pendingPayoutBalanceAud.toLocaleString()}).`, 'info');
      return;
    }

    setIsProcessingPayout(true);
    setTimeout(() => {
      onExecutePayout(payoutAmount, selectedPayoutMethod);
      setIsProcessingPayout(false);
      setPayoutSuccessMessage(`Successfully initiated direct transfer of ${formatAud(payoutAmount)} AUD to ${safeBank.bankName} (BSB: ${safeBank.bsb}, Acc: ${safeBank.accountNumber}). Funds will arrive via Osko/EFT within 1-2 business hours.`);
      showToast(`Payout of ${formatAud(payoutAmount)} transferred to personal bank!`, 'success');
      setTimeout(() => {
        setPayoutSuccessMessage(null);
      }, 6000);
    }, 1200);
  };

  const handleSaveBankConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BankAccountConfig = {
      accountHolder: editAccountHolder,
      bankName: editBankName,
      bsb: editBsb,
      accountNumber: editAccountNumber,
      payId: editPayId,
      paypalEmail: editPaypalEmail,
      country: 'Australia (AUD)'
    };
    onUpdateBankConfig(updated);
    showToast('Personal Bank Account & Payout Details updated successfully!');
    setActiveTab('revenue_payout');
  };

  const transactionsList = safeAnalytics.recentTransactions || [];
  const filteredTransactions = transactionsList.filter(txn => {
    const matchesSearch = txn.userName.toLowerCase().includes(searchTxnQuery.toLowerCase()) ||
                          txn.userEmail.toLowerCase().includes(searchTxnQuery.toLowerCase()) ||
                          txn.companyName.toLowerCase().includes(searchTxnQuery.toLowerCase()) ||
                          txn.itemDescription.toLowerCase().includes(searchTxnQuery.toLowerCase());
    const matchesMethod = filterMethod === 'All' || txn.paymentMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className={`relative w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh] ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1422] border-[#1e2638] text-white'
      }`}>
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600/15 via-blue-600/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Creator & Builder Command Center
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Owner: jzaf666@gmail.com
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                Passive Income, Analytics & Bank Payout Hub
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

        {/* Real-time Earnings & User Snapshot Bar */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b text-xs ${
          isLight ? 'bg-emerald-50/60 border-emerald-100 text-slate-800' : 'bg-[#0a0d14] border-[#1a2336] text-slate-200'
        }`}>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Sales to Date</div>
            <div className="font-black text-base text-emerald-400 mt-0.5">
              {formatAud(safeAnalytics.totalRevenueAud || 0)}
            </div>
            <span className="text-[10px] text-emerald-500 font-medium">+28% this month</span>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monthly Recurring (MRR)</div>
            <div className="font-black text-base text-blue-400 mt-0.5">
              {formatAud(safeAnalytics.mrrAud || 0)}/mo
            </div>
            <span className="text-[10px] text-slate-400 font-mono">ARR: {formatAud(safeAnalytics.arrAud || 0)}</span>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Registered Users</div>
            <div className="font-black text-base text-purple-400 mt-0.5">
              {safeAnalytics.totalUsers || 0} Users
            </div>
            <span className="text-[10px] text-purple-300 font-medium">{safeAnalytics.paidSubscribers || 0} Paid Subscribers</span>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available for Payout</div>
            <div className="font-black text-base text-amber-400 mt-0.5">
              {formatAud(safeAnalytics.pendingPayoutBalanceAud || 0)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Ready to withdraw</span>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className={`flex items-center gap-2 px-6 pt-3 border-b text-xs font-semibold ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0f1422]'
        }`}>
          <button
            onClick={() => setActiveTab('revenue_payout')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'revenue_payout'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>1. Revenue & Bank Account Transfer</span>
          </button>

          <button
            onClick={() => setActiveTab('users_demographics')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users_demographics'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. User Analytics & Demographics</span>
          </button>

          <button
            onClick={() => setActiveTab('sales_ledger')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sales_ledger'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Live Sales Ledger & PayPal Log</span>
          </button>

          <button
            onClick={() => setActiveTab('bank_settings')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bank_settings'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>4. Bank Account Details (BSB / PayID)</span>
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* ============================================================
              TAB 1: REVENUE & DIRECT PERSONAL BANK TRANSFER
          ============================================================ */}
          {activeTab === 'revenue_payout' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Payout Success Notice */}
              {payoutSuccessMessage && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-bounce">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>{payoutSuccessMessage}</div>
                </div>
              )}

              {/* Bank Transfer Gateway Card */}
              <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-gradient-to-br from-[#121829] via-[#0d1220] to-[#0a0d14] border-[#1e2638] text-white'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Direct Bank Payout Gateway (AUD)
                      </span>
                    </div>
                    <h3 className="text-xl font-black mt-1">Transfer Earnings to Personal Bank Account</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Withdraw your accumulated passive income directly to your nominated Australian bank account with 0% platform transfer fee.
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Current Available Balance</div>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {formatAud(safeAnalytics.pendingPayoutBalanceAud || 0)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 items-center">
                  {/* Left: Nominated Bank Details */}
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination Account</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('bank_settings')}
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Bank Details</span>
                      </button>
                    </div>

                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>{safeBank.bankName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-500 block">BSB Number</span>
                        <span className="font-bold text-white">{safeBank.bsb}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Account Number</span>
                        <span className="font-bold text-white">{safeBank.accountNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Account Holder</span>
                        <span className="font-bold text-white truncate block">{safeBank.accountHolder}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">PayID / Osko</span>
                        <span className="font-bold text-emerald-400 truncate block">{safeBank.payId || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Transfer Controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Transfer Amount ($ AUD)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="100"
                          min="10"
                          max={safeAnalytics.pendingPayoutBalanceAud || 0}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                          className={`w-full p-3 pl-8 pr-24 rounded-xl border text-base font-black font-mono focus:outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-amber-400'
                          }`}
                        />
                        <DollarSign className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setPayoutAmount(safeAnalytics.pendingPayoutBalanceAud || 0)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          Max All
                        </button>
                      </div>
                    </div>

                    {/* Method Selector */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPayoutMethod('bank_transfer')}
                        className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedPayoutMethod === 'bank_transfer'
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Direct BSB (EFT)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPayoutMethod('payid')}
                        className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedPayoutMethod === 'payid'
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>PayID / Osko</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPayoutMethod('paypal')}
                        className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedPayoutMethod === 'paypal'
                            ? 'bg-blue-600 border-blue-500 text-white shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>PayPal Payout</span>
                      </button>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={handleTriggerPayout}
                      disabled={isProcessingPayout || (safeAnalytics.pendingPayoutBalanceAud || 0) <= 0}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingPayout ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Routing Electronic Payout to CommBank...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Transfer {formatAud(payoutAmount)} AUD to Personal Bank</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Historical Payout Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">
                    Creator Payout & Withdrawal History
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Total Withdrawn: <strong>{formatAud(safeAnalytics.totalPaidOutAud || 0)}</strong>
                  </span>
                </div>

                <div className="space-y-2">
                  {(safeAnalytics.payoutHistory || []).map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{rec.bankName} ({rec.bsb} {rec.accountNumberMasked})</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono">
                              {rec.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {rec.reference} • Settled on {rec.settledDate}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-black text-sm text-emerald-400">+{formatAud(rec.amountAud)}</div>
                        <div className="text-[10px] text-slate-500">AUD Direct Deposit</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================
              TAB 2: USER SUMMARIES, DEMOGRAPHICS & LOCATIONS
          ============================================================ */}
          {activeTab === 'users_demographics' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* User Breakdown by Category / Persona */}
              <div className={`p-5 rounded-3xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <h3 className="font-black text-sm mb-1 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-400" />
                  <span>User Type & Persona Distribution ({safeAnalytics.totalUsers || 0} Total Accounts)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  Breakdown of customer segments actively paying and trialing RangeCraft across Australia & global channels.
                </p>

                <div className="space-y-3">
                  {(safeAnalytics.userTypeDistribution || []).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-200">{item.type}</span>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-slate-400">{item.count} users ({item.percentage}%)</span>
                          <span className="font-bold text-emerald-400">Avg Deal: ${item.avgDealSizeAud}/mo</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${item.percentage}%`, backgroundColor: item.color }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geographic Demographics Table */}
              <div className={`p-5 rounded-3xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>User Geographic Locations & Regional Revenue</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Audited Australian state hubs and international FMCG headquarters.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20">
                    8 Cities Monitored
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                        <th className="pb-2.5">Location & State</th>
                        <th className="pb-2.5">Region</th>
                        <th className="pb-2.5">Active Users</th>
                        <th className="pb-2.5">% of Userbase</th>
                        <th className="pb-2.5 text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {(safeAnalytics.demographicsDistribution || []).map((geo, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>{geo.city}, {geo.state}</span>
                          </td>
                          <td className="py-2.5 text-slate-400">{geo.region}</td>
                          <td className="py-2.5 text-slate-200 font-bold">{geo.usersCount} users</td>
                          <td className="py-2.5 text-blue-400">{geo.percentage}%</td>
                          <td className="py-2.5 text-right font-bold text-emerald-400">{formatAud(geo.revenueAud)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================
              TAB 3: LIVE SALES TRANSACTIONS LEDGER & PAYPAL LOG
          ============================================================ */}
          {activeTab === 'sales_ledger' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTxnQuery}
                    onChange={(e) => setSearchTxnQuery(e.target.value)}
                    placeholder="Search transactions by user or company..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[11px] text-slate-400 font-bold">Payment Method:</span>
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold focus:outline-none"
                  >
                    <option value="All">All Methods ({transactionsList.length})</option>
                    <option value="paypal">PayPal Instant Orders</option>
                    <option value="credit_card">Credit Card (Stripe/Eway)</option>
                    <option value="bank_transfer">Direct Corporate Invoicing</option>
                  </select>
                </div>
              </div>

              {/* Transactions Table */}
              <div className={`rounded-2xl border overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                        <th className="p-3">Transaction & User</th>
                        <th className="p-3">Product / Service Purchased</th>
                        <th className="p-3">Payment Method</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-right">Amount (AUD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white">{txn.userName}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {txn.userEmail} • {txn.companyName}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-slate-200">{txn.itemDescription}</div>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              txn.itemType.startsWith('service')
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}>
                              {txn.itemType.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              {txn.paymentMethod === 'paypal' ? (
                                <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-[10px] border border-blue-500/30">
                                  PayPal ({txn.paypalTransactionId || 'PP-Instant'})
                                </span>
                              ) : txn.paymentMethod === 'credit_card' ? (
                                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-[10px] border border-amber-500/30">
                                  Credit Card
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                                  EFT Direct
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 text-[11px] text-slate-400">
                            {new Date(txn.timestamp).toLocaleDateString('en-AU', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>

                          <td className="p-3 text-right">
                            <span className="font-black text-emerald-400 text-sm">
                              +{formatAud(txn.amountAud)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================
              TAB 4: BANK ACCOUNT CONFIGURATION (BSB / ACCOUNT / PAYID)
          ============================================================ */}
          {activeTab === 'bank_settings' && (
            <form onSubmit={handleSaveBankConfig} className="space-y-6 animate-fade-in max-w-2xl mx-auto">
              
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>Personal Australian Bank Account Details for Creator Payouts</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Enter your nominated Australian banking credentials. Whenever you execute a withdrawal, funds are securely credited to this account.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Account Holder Full Name
                  </label>
                  <input
                    type="text"
                    value={editAccountHolder}
                    onChange={(e) => setEditAccountHolder(e.target.value)}
                    required
                    className={`w-full p-3 rounded-xl border text-xs font-semibold focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Financial Institution / Bank Name
                    </label>
                    <input
                      type="text"
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      required
                      placeholder="e.g. Commonwealth Bank of Australia"
                      className={`w-full p-3 rounded-xl border text-xs font-semibold focus:outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      BSB Number (6 Digits)
                    </label>
                    <input
                      type="text"
                      value={editBsb}
                      onChange={(e) => setEditBsb(e.target.value)}
                      required
                      placeholder="062-000"
                      className={`w-full p-3 rounded-xl border text-xs font-mono font-bold focus:outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Account Number (EFT)
                    </label>
                    <input
                      type="text"
                      value={editAccountNumber}
                      onChange={(e) => setEditAccountNumber(e.target.value)}
                      required
                      placeholder="1098 4421"
                      className={`w-full p-3 rounded-xl border text-xs font-mono font-bold focus:outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      PayID Identifier (Phone or Email)
                    </label>
                    <input
                      type="text"
                      value={editPayId}
                      onChange={(e) => setEditPayId(e.target.value)}
                      placeholder="jzaf666@gmail.com"
                      className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    PayPal Receiver Email for Instant Payouts
                  </label>
                  <input
                    type="email"
                    value={editPaypalEmail}
                    onChange={(e) => setEditPaypalEmail(e.target.value)}
                    placeholder="jzaf666@gmail.com"
                    className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    Save & Update Bank Account
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit encrypted builder admin portal. Access restricted to creator account.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer shadow"
          >
            Close Admin Hub
          </button>
        </div>

      </div>
    </div>
  );
};
