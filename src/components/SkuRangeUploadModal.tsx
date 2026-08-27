import React, { useState, useRef } from 'react';
import { safeFetch } from '../utils/api';
import { Product, ThemeMode } from '../types';
import { 
  parseProductsCsv, 
  generateProductCsvTemplate, 
  analyzeProductRangePortfolio, 
  RangePortfolioAnalysis 
} from '../utils/csvHelpers';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Package, 
  Sparkles, 
  X, 
  ArrowRight,
  ShieldCheck,
  BarChart2
} from 'lucide-react';

interface SkuRangeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAndGeneratePlan: (importedProducts: Product[]) => void;
  onImportOnly: (importedProducts: Product[]) => void;
  onOpenAiWithRange?: (importedProducts: Product[]) => void;
  onOpenImportTutorial?: () => void;
  currentTheme: ThemeMode;
}

export const SkuRangeUploadModal: React.FC<SkuRangeUploadModalProps> = ({
  isOpen,
  onClose,
  onImportAndGeneratePlan,
  onImportOnly,
  onOpenAiWithRange,
  onOpenImportTutorial,
  currentTheme,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Product[] | null>(null);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<RangePortfolioAnalysis | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAiAnalysis = async () => {
    if (!parsedProducts) return;
    setIsAnalyzing(true);
    try {
      const data = await safeFetch<any>('/api/analyze-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedProducts }),
      });
      setAiAnalysis(data);
    } catch (err) {
      setErrorMessage("Failed to perform AI analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isLight = currentTheme.includes('light');

  const handleDownloadTemplate = () => {
    const templateContent = generateProductCsvTemplate();
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RangeCraft_SKU_Range_Template_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('spreadsheet')) {
      setErrorMessage("Please upload a standard .csv file format.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const products = parseProductsCsv(text);
        if (products.length === 0) {
          setErrorMessage("No valid SKU rows could be extracted. Please ensure the CSV follows the column format in the template.");
          setParsedProducts(null);
          setPortfolioAnalysis(null);
          return;
        }

        const analysis = analyzeProductRangePortfolio(products);
        setParsedProducts(products);
        setPortfolioAnalysis(analysis);
      } catch (err: any) {
        setErrorMessage("Failed to read CSV: " + (err?.message || "Invalid formatting"));
        setParsedProducts(null);
        setPortfolioAnalysis(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setParsedProducts(null);
    setPortfolioAnalysis(null);
    setFileName(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Upload Product Range by SKU & Portfolio Analysis
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  CSV Import Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Download the standardized Australian retail template, populate your SKUs with costs & velocities, and run instant range analytics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Step 1: Download Template Helper Banner */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Need the Official CSV Format?</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Includes required columns (SKU, Name, Category, RRP, Unit Cost, Baseline Velocity, Tier, Seasonal Peak, Hiatus & Trade Co-Op flags).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onOpenImportTutorial && (
                <button
                  onClick={onOpenImportTutorial}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-blue-200 border border-blue-500/40 text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Import Tutorial</span>
                </button>
              )}
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download CSV Template</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 2: Upload Dropzone (when no file is loaded) */}
          {!parsedProducts ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Click to browse or drag and drop your product CSV file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports custom product codes, cost bases, baseline weekly sales, and retail tier allocations.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                  <span>Standard CSV (.csv) with header row</span>
                </div>
              </div>
            </div>
          ) : (
            /* Step 3: Instant Portfolio Analysis & Pre-Analysis Diagnostic Report */
            <div className="space-y-5">
              
              {/* File Info Bar & Reset */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">{fileName}</span>
                  <span className="text-slate-400">({parsedProducts.length} SKUs successfully parsed)</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-rose-400 font-medium cursor-pointer transition-colors"
                >
                  Upload different file
                </button>
              </div>

              {/* Diagnostic Metric Cards */}
              {portfolioAnalysis && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Range Breadth</div>
                    <div className="text-lg font-bold text-white mt-0.5 flex items-baseline gap-1">
                      {portfolioAnalysis.totalSkus} <span className="text-xs font-normal text-slate-400">SKUs</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      across {portfolioAnalysis.categoriesCount} categories
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Baseline Margin</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">
                      {portfolioAnalysis.overallAvgMargin}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Avg RRP: ${portfolioAnalysis.overallAvgRrp} | Cost: ${portfolioAnalysis.overallAvgCost}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Est Annual Baseline Rev</div>
                    <div className="text-lg font-bold text-blue-400 mt-0.5">
                      ${(portfolioAnalysis.totalAnnualBaselineRevenueAud / 1000000).toFixed(2)}M <span className="text-xs font-normal text-slate-400">AUD</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {portfolioAnalysis.totalAnnualBaselineUnits.toLocaleString()} unpromoted units/yr
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Vendor Co-Op Eligible</div>
                    <div className="text-lg font-bold text-amber-400 mt-0.5">
                      {portfolioAnalysis.coOpEligiblePercent}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {portfolioAnalysis.coOpEligibleCount} of {portfolioAnalysis.totalSkus} SKUs supported
                    </div>
                  </div>
                </div>
              )}

              {/* AI Analysis Section */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/30">
                {!aiAnalysis ? (
                  <button
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isAnalyzing ? "Analyzing..." : "Deep Analyze Portfolio with AI"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">AI Portfolio Insights</h4>
                    <p className="text-xs text-slate-300">{aiAnalysis.executiveSummary}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 bg-slate-950 rounded">
                        <span className="font-bold text-emerald-400">Opportunities:</span> {aiAnalysis.keyOpportunities?.join(', ')}
                      </div>
                      <div className="p-2 bg-slate-950 rounded">
                        <span className="font-bold text-rose-400">Risks:</span> {aiAnalysis.portfolioRisks?.join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Tier Breakdown */}
              {portfolioAnalysis && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      Performance Tiering Distribution
                    </span>
                    <span className="text-[10px] text-slate-400">Optimal mix: 20-30% Tier 1 Hero SKUs</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      <div className="text-[10px] uppercase font-bold">Tier 1: Hero Volume</div>
                      <div className="text-base font-bold mt-0.5">{portfolioAnalysis.tierBreakdown.tier1_hero} SKUs</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                      <div className="text-[10px] uppercase font-bold">Tier 2: Margin Builder</div>
                      <div className="text-base font-bold mt-0.5">{portfolioAnalysis.tierBreakdown.tier2_margin} SKUs</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
                      <div className="text-[10px] uppercase font-bold">Tier 3: Niche / Premium</div>
                      <div className="text-base font-bold mt-0.5">{portfolioAnalysis.tierBreakdown.tier3_niche} SKUs</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      <div className="text-[10px] uppercase font-bold">Tier 4: Clearance</div>
                      <div className="text-base font-bold mt-0.5">{portfolioAnalysis.tierBreakdown.tier4_clearance} SKUs</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Warnings (if any) */}
              {portfolioAnalysis && portfolioAnalysis.validationIssues.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    Portfolio Data Audit Notices ({portfolioAnalysis.validationIssues.length})
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                    {portfolioAnalysis.validationIssues.slice(0, 3).map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                    {portfolioAnalysis.validationIssues.length > 3 && (
                      <li>...and {portfolioAnalysis.validationIssues.length - 3} other items adjusted with safe defaults.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Sample Parsed Table Preview */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Parsed Range Preview (Top {Math.min(5, parsedProducts.length)} of {parsedProducts.length} SKUs)</span>
                  <span className="text-[10px] font-normal text-slate-400">Ready to sync</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">RRP</th>
                        <th className="py-2 px-3">Cost</th>
                        <th className="py-2 px-3">Base Margin</th>
                        <th className="py-2 px-3">Velocity</th>
                        <th className="py-2 px-3">Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {parsedProducts.slice(0, 5).map((p, idx) => (
                        <tr key={`preview-sku-${p.sku}-${idx}`} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-bold text-amber-400">{p.sku}</td>
                          <td className="py-2 px-3 font-sans font-medium text-white max-w-[200px] truncate">{p.name}</td>
                          <td className="py-2 px-3 font-sans text-slate-300">{p.category}</td>
                          <td className="py-2 px-3 text-white">${p.rrp.toFixed(2)}</td>
                          <td className="py-2 px-3 text-slate-400">${p.cost.toFixed(2)}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{p.marginPercent}%</td>
                          <td className="py-2 px-3 text-blue-300">{p.weeklyUnitsBaseline} u/w</td>
                          <td className="py-2 px-3 font-sans text-[10px]">
                            {p.performanceTier === 'tier1_hero' && <span className="text-amber-400">Tier 1 Hero</span>}
                            {p.performanceTier === 'tier2_margin' && <span className="text-blue-400">Tier 2 Margin</span>}
                            {p.performanceTier === 'tier3_niche' && <span className="text-purple-400">Tier 3 Niche</span>}
                            {p.performanceTier === 'tier4_clearance' && <span className="text-rose-400">Tier 4 Clearance</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {parsedProducts ? `${parsedProducts.length} SKUs ready to analyze` : 'Download template or upload your existing CSV'}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>

            {parsedProducts && (
              <>
                <button
                  onClick={() => {
                    onImportOnly(parsedProducts);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Import to Catalog Only
                </button>

                <button
                  onClick={() => {
                    onImportAndGeneratePlan(parsedProducts);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Map & Generate 52-Week Plan</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
