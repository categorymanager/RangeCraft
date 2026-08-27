import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  DollarSign,
  Package,
  Check
} from 'lucide-react';
import { ThemeMode } from '../types';
import { generateProductCsvTemplate } from '../utils/csvHelpers';

interface ImportTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUploadModal?: () => void;
  currentTheme: ThemeMode;
}

export const ImportTutorialModal: React.FC<ImportTutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenUploadModal,
  currentTheme,
}) => {
  const isLight = currentTheme.includes('light');
  const [activeTab, setActiveTab] = useState<'steps' | 'schema' | 'faq'>('steps');

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateContent = generateProductCsvTemplate();
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Planovate_SKU_Import_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className={`relative w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden my-8 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121829] border-[#1e2638] text-slate-100'
      }`}>
        
        {/* Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-10 space-y-6">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold mb-3">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Catalog Import Masterclass</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                How to Import Your SKU Catalog & Financials
              </h2>
              <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Step-by-step guidance on formatting CSV files to power your 52-week promotional calendar, scan rebate margins, and ACCC hiatus audits.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('steps')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'steps' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>1. Step-by-Step Guide</span>
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'schema' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>2. CSV Column Schema</span>
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'faq' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>3. Troubleshooting & FAQ</span>
            </button>
          </div>

          {/* Tab Content 1: Steps */}
          {activeTab === 'steps' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold flex items-center justify-center mb-3 text-sm">
                    1
                  </div>
                  <h3 className="text-sm font-bold mb-1">Download Template</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Click the official CSV template button below. It pre-populates required headers for SKU names, wholesale cost, RSP, and category.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center mb-3 text-sm">
                    2
                  </div>
                  <h3 className="text-sm font-bold mb-1">Populate Your Data</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Open in Excel or Google Sheets. Add your active product range with accurate wholesale case costs and recommended retail selling prices.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center mb-3 text-sm">
                    3
                  </div>
                  <h3 className="text-sm font-bold mb-1">Upload & Auto-Analyze</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Drag and drop your saved CSV file into Planovate. Our engine instantly validates margins, portfolio mix, and generates simulation matrices.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-blue-300">Ready to start importing?</div>
                  <div className="text-xs text-blue-200/80">Get our official validated CSV template right now.</div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV Template</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab Content 2: Schema */}
          {activeTab === 'schema' && (
            <div className="space-y-4 animate-fade-in">
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Your CSV file must include the following column headers (case-insensitive, supporting standard comma separation):
              </p>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 font-mono text-xs">
                <div className="grid grid-cols-4 bg-slate-900 p-3 font-bold text-slate-300 border-b border-slate-800">
                  <div>Column Header</div>
                  <div>Type</div>
                  <div>Example Value</div>
                  <div>Description</div>
                </div>
                <div className="grid grid-cols-4 p-3 border-b border-slate-900 text-slate-300">
                  <div className="text-blue-400 font-bold">sku_name</div>
                  <div>Text</div>
                  <div>Organic Oat Milk 1L</div>
                  <div>Product commercial title</div>
                </div>
                <div className="grid grid-cols-4 p-3 border-b border-slate-900 text-slate-300">
                  <div className="text-blue-400 font-bold">category</div>
                  <div>Text</div>
                  <div>Dairy & Alternatives</div>
                  <div>Supermarket category tag</div>
                </div>
                <div className="grid grid-cols-4 p-3 border-b border-slate-900 text-slate-300">
                  <div className="text-blue-400 font-bold">wholesale_cost</div>
                  <div>Numeric ($)</div>
                  <div>2.40</div>
                  <div>Cost price to retailer / wholesale</div>
                </div>
                <div className="grid grid-cols-4 p-3 border-b border-slate-900 text-slate-300">
                  <div className="text-blue-400 font-bold">rsp</div>
                  <div>Numeric ($)</div>
                  <div>4.50</div>
                  <div>Recommended retail selling price</div>
                </div>
                <div className="grid grid-cols-4 p-3 text-slate-300">
                  <div className="text-blue-400 font-bold">default_discount_pct</div>
                  <div>Percentage (%)</div>
                  <div>25</div>
                  <div>Standard promotional discount %</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3 animate-fade-in">
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                <h4 className="text-sm font-bold mb-1 text-slate-200">What if my currency is not AUD?</h4>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Planovate's monetary fields default to AUD for Australian supermarket compliance, but you can input values in any currency; the margin ratios and percentage lifts remain exact.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                <h4 className="text-sm font-bold mb-1 text-slate-200">Is there a maximum SKU limit?</h4>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Free tier supports up to 25 SKUs. Pro and Enterprise tiers support unlimited SKUs with bulk multi-category grouping.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                <h4 className="text-sm font-bold mb-1 text-slate-200">What if my CSV fails to parse?</h4>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Ensure your file is saved as standard UTF-8 CSV without hidden formula macros. Download our official template to guarantee correct header matching.
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Secure local parsing with instant validation</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Close Tutorial
              </button>
              {onOpenUploadModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUploadModal();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <span>Open SKU Importer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
