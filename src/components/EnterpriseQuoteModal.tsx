import React, { useState } from 'react';
import { ThemeMode } from '../types';
import { Building2, CheckCircle2, Mail, Send, X } from 'lucide-react';

interface EnterpriseQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  defaultEmail?: string;
  defaultCompany?: string;
  onSubmitQuote: (payload: {
    workEmail: string;
    companyName: string;
    brandCount: string;
    estimatedSkus: string;
    erpNotes: string;
  }) => void;
}

export const EnterpriseQuoteModal: React.FC<EnterpriseQuoteModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  defaultEmail = '',
  defaultCompany = '',
  onSubmitQuote,
}) => {
  const isLight = currentTheme.includes('light');
  const [workEmail, setWorkEmail] = useState(defaultEmail);
  const [companyName, setCompanyName] = useState(defaultCompany);
  const [brandCount, setBrandCount] = useState('2-5 Brands');
  const [estimatedSkus, setEstimatedSkus] = useState('1,000 - 2,500 SKUs');
  const [erpNotes, setErpNotes] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workEmail.trim() || !workEmail.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }
    if (!companyName.trim()) {
      setError('Please enter your company or organisation name.');
      return;
    }
    setError(null);
    onSubmitQuote({
      workEmail: workEmail.trim(),
      companyName: companyName.trim(),
      brandCount,
      estimatedSkus,
      erpNotes: erpNotes.trim(),
    });
    setSubmittedRef(`ENT-${Math.floor(10000 + Math.random() * 89999)}`);
  };

  const handleResetAndClose = () => {
    setSubmittedRef(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-lg rounded-none sm:rounded-2xl border-0 sm:border shadow-2xl flex flex-col overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121624] border-slate-800 text-slate-100'
        }`}
      >
        {/* Fixed Top Close Bar */}
        <div
          className={`shrink-0 px-4 py-3.5 sm:px-7 sm:py-5 border-b flex items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121624] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400 truncate">
                CUSTOM TAILORED SCOPE
              </p>
              <h3 className="text-base sm:text-xl font-black tracking-tight truncate">
                Request Enterprise Quote
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-5">
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Up to 5,000 SKUs · Custom ERP &amp; POS ingestion · Retailer JBP templates (inc. GST)
          </p>

          {submittedRef ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  INQUIRY LOGGED · REF {submittedRef}
                </p>
                <h4 className="text-lg font-black">Custom Scope Request Received</h4>
                <p className={`text-sm max-w-sm mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Our Australian commercial team will prepare your tailored onboarding scope for{' '}
                  <span className="font-semibold">{companyName}</span> and respond to{' '}
                  <span className="font-semibold">{workEmail}</span> within 1 business day.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] text-xs font-bold cursor-pointer"
              >
                Return to RangeCraft
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder="name@company.com.au"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        : 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Company / Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Pacific Pantry Pty Ltd"
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        : 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Brand Portfolio Size
                  </label>
                  <select
                    value={brandCount}
                    onChange={(e) => setBrandCount(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-900 border-slate-700 text-slate-100'
                    }`}
                  >
                    <option value="Single Flagship Brand">Single Flagship Brand</option>
                    <option value="2-5 Brands">2–5 Brands</option>
                    <option value="6-15 Brands">6–15 Brands</option>
                    <option value="National Distributor Portfolio">National Distributor Portfolio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Estimated Active SKU Tier
                </label>
                <select
                  value={estimatedSkus}
                  onChange={(e) => setEstimatedSkus(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                >
                  <option value="500 - 1,000 SKUs">500 – 1,000 SKUs</option>
                  <option value="1,000 - 2,500 SKUs">1,000 – 2,500 SKUs</option>
                  <option value="2,500 - 5,000 SKUs">2,500 – 5,000 SKUs</option>
                  <option value="5,000+ Enterprise SKUs">5,000+ Enterprise Portfolio</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  ERP / POS Systems &amp; Retail Scope Notes
                </label>
                <textarea
                  rows={3}
                  value={erpNotes}
                  onChange={(e) => setErpNotes(e.target.value)}
                  placeholder="Optional: e.g. NetSuite or SAP feed, multi-state distributor scan rebates, retailer JBP templates..."
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs resize-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                    isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Quote Request</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
