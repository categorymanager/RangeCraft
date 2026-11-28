import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ScanCatalogueItem, ThemeMode } from '../types';
import { buildSampleCatalogueCsv, normalizeBarcode } from '../data/scanCatalogueDefaults';

interface ScanCatalogueImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  existingCount: number;
  onImportComplete: (items: ScanCatalogueItem[], mode: 'merge' | 'replace') => void;
}

type TargetFieldKey =
  | 'barcode'
  | 'sku'
  | 'name'
  | 'supplierName'
  | 'supplierEmail'
  | 'packSize'
  | 'unitCostExGst'
  | 'gstApplicable';

interface FieldSpec {
  key: TargetFieldKey;
  label: string;
  required: boolean;
  hint: string;
}

const TARGET_FIELDS: FieldSpec[] = [
  { key: 'barcode', label: 'Barcode (EAN/UPC)', required: true, hint: 'EAN-13, EAN-8, UPC, or Code-128' },
  { key: 'sku', label: 'SKU / Product Code', required: false, hint: 'Defaults to Barcode if unmapped' },
  { key: 'name', label: 'Product Name', required: true, hint: 'Item description shown on PO' },
  { key: 'supplierName', label: 'Supplier Name', required: true, hint: 'Used for automatic PO splitting' },
  { key: 'supplierEmail', label: 'Supplier Email', required: false, hint: 'Optional dispatch address' },
  { key: 'packSize', label: 'Carton Pack Size', required: false, hint: 'Defaults to 1 unit/ctn if unmapped' },
  { key: 'unitCostExGst', label: 'Unit Cost (ex GST)', required: true, hint: 'AUD wholesale cost per unit' },
  { key: 'gstApplicable', label: 'GST Applicable', required: false, hint: 'Yes/No — defaults to Yes (10%)' },
];

function guessColumnIndex(headers: string[], key: TargetFieldKey): number {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  const matchers: Record<TargetFieldKey, string[]> = {
    barcode: ['barcode', 'ean', 'upc', 'gtin', 'scan'],
    sku: ['sku', 'product code', 'item code', 'code'],
    name: ['product name', 'description', 'item name', 'title', 'name'],
    supplierName: ['supplier name', 'supplier', 'vendor', 'brand', 'wholesaler'],
    supplierEmail: ['supplier email', 'vendor email', 'email', 'order email'],
    packSize: ['pack size', 'carton', 'units per', 'ctn qty', 'pack', 'case size'],
    unitCostExGst: ['unit cost', 'cost', 'buy price', 'wholesale', 'price ex'],
    gstApplicable: ['gst', 'taxable', 'tax'],
  };

  const candidates = matchers[key];
  for (const cand of candidates) {
    const idx = normalized.findIndex((h) => h.includes(cand));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseGstFlag(raw: unknown): boolean {
  if (raw === undefined || raw === null || String(raw).trim() === '') return true;
  const val = String(raw).toLowerCase().trim();
  if (['no', 'false', '0', 'n', 'gst-free', 'gst free', 'free', 'exempt'].includes(val)) {
    return false;
  }
  return true;
}

function parseNumber(raw: unknown, fallback: number): number {
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  const cleaned = String(raw ?? '').replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? fallback : num;
}

export const ScanCatalogueImportModal: React.FC<ScanCatalogueImportModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  existingCount,
  onImportComplete,
}) => {
  const isLight = currentTheme.includes('light');

  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<unknown[][]>([]);
  const [mapping, setMapping] = useState<Record<TargetFieldKey, number>>({
    barcode: -1,
    sku: -1,
    name: -1,
    supplierName: -1,
    supplierEmail: -1,
    packSize: -1,
    unitCostExGst: -1,
    gstApplicable: -1,
  });
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [parseError, setParseError] = useState<string | null>(null);

  const parsedItems = useMemo<ScanCatalogueItem[]>(() => {
    if (
      rawRows.length === 0 ||
      mapping.barcode < 0 ||
      mapping.name < 0 ||
      mapping.supplierName < 0 ||
      mapping.unitCostExGst < 0
    ) {
      return [];
    }

    const items: ScanCatalogueItem[] = [];
    for (const row of rawRows) {
      const rawBarcode = row[mapping.barcode];
      const barcode = normalizeBarcode(String(rawBarcode ?? ''));
      const name = String(row[mapping.name] ?? '').trim();
      const supplierName = String(row[mapping.supplierName] ?? '').trim();

      if (!barcode || !name || !supplierName) continue;

      const sku =
        mapping.sku >= 0 && String(row[mapping.sku] ?? '').trim()
          ? String(row[mapping.sku]).trim()
          : barcode;
      const supplierEmail =
        mapping.supplierEmail >= 0 ? String(row[mapping.supplierEmail] ?? '').trim() : '';
      const packSize =
        mapping.packSize >= 0 ? Math.max(1, Math.round(parseNumber(row[mapping.packSize], 1))) : 1;
      const unitCostExGst = Math.max(0, Number(parseNumber(row[mapping.unitCostExGst], 0).toFixed(2)));
      const gstApplicable =
        mapping.gstApplicable >= 0 ? parseGstFlag(row[mapping.gstApplicable]) : true;

      items.push({
        barcode,
        sku,
        name,
        supplierName,
        supplierEmail,
        packSize,
        unitCostExGst,
        gstApplicable,
        updatedAt: new Date().toISOString(),
      });
    }
    return items;
  }, [rawRows, mapping]);

  if (!isOpen) return null;

  const missingRequired = TARGET_FIELDS.filter((f) => f.required && mapping[f.key] < 0);

  const handleFileSelected = async (file: File) => {
    setParseError(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setParseError('The selected workbook does not contain any readable sheets.');
        return;
      }
      const sheet = workbook.Sheets[firstSheetName];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      const nonEmptyRows = matrix.filter(
        (r) => Array.isArray(r) && r.some((cell) => String(cell ?? '').trim() !== '')
      );
      if (nonEmptyRows.length < 2) {
        setParseError('File must include a header row and at least one product row.');
        return;
      }

      const detectedHeaders = (nonEmptyRows[0] as unknown[]).map((h, i) =>
        String(h ?? '').trim() || `Column ${i + 1}`
      );
      const dataRows = nonEmptyRows.slice(1);

      setFileName(file.name);
      setHeaders(detectedHeaders);
      setRawRows(dataRows);
      setMapping({
        barcode: guessColumnIndex(detectedHeaders, 'barcode'),
        sku: guessColumnIndex(detectedHeaders, 'sku'),
        name: guessColumnIndex(detectedHeaders, 'name'),
        supplierName: guessColumnIndex(detectedHeaders, 'supplierName'),
        supplierEmail: guessColumnIndex(detectedHeaders, 'supplierEmail'),
        packSize: guessColumnIndex(detectedHeaders, 'packSize'),
        unitCostExGst: guessColumnIndex(detectedHeaders, 'unitCostExGst'),
        gstApplicable: guessColumnIndex(detectedHeaders, 'gstApplicable'),
      });
    } catch (err: any) {
      setParseError(err?.message || 'Could not parse spreadsheet file. Please check the format.');
    }
  };

  const handleDownloadSampleCsv = () => {
    const csv = buildSampleCatalogueCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rangecraft_scan_catalogue_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setParseError(null);
  };

  const handleCommitImport = () => {
    if (parsedItems.length === 0 || missingRequired.length > 0) return;
    onImportComplete(parsedItems, importMode);
    resetUpload();
    onClose();
  };

  return (
    <div
      className="no-print fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Import Barcode Catalogue CSV or Excel"
    >
      <div
        className={`w-full sm:max-w-3xl max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-2xl border shadow-2xl overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1424] border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between gap-3 px-5 py-4 border-b shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-900/60'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">
                Import Catalogue (CSV / Excel)
              </h2>
              <p className={`text-xs truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Upload `.csv`, `.xlsx`, or `.xls` price lists and map columns cleanly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
            }`}
            aria-label="Close Importer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {headers.length === 0 ? (
            <div className="space-y-4">
              <label
                className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-colors text-center ${
                  isLight
                    ? 'border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/40'
                    : 'border-slate-700 bg-slate-900/60 hover:border-blue-500 hover:bg-blue-950/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold">
                    Tap to choose a CSV or Excel price list
                  </p>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Supports .csv, .xlsx, and .xls files with custom column headers
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                />
              </label>

              {parseError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">Need a starting price list?</p>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Download our sample Australian FMCG CSV template with EAN-13 barcodes and pack sizes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Summary + Reset */}
              <div
                className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                  isLight ? 'bg-blue-50/60 border-blue-200' : 'bg-blue-950/30 border-blue-800/60'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{fileName}</p>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {rawRows.length} data rows · {headers.length} columns detected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetUpload}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </button>
              </div>

              {/* Column Mapper */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold">Map Spreadsheet Columns</h3>
                  <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Fields marked * are required
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TARGET_FIELDS.map((field) => {
                    const selectedIdx = mapping[field.key];
                    const isMissing = field.required && selectedIdx < 0;
                    return (
                      <div
                        key={field.key}
                        className={`p-3 rounded-xl border ${
                          isMissing
                            ? isLight
                              ? 'bg-amber-50/70 border-amber-300'
                              : 'bg-amber-950/20 border-amber-800'
                            : isLight
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-slate-900/60 border-slate-800'
                        }`}
                      >
                        <label className="block text-xs font-bold mb-1">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        <select
                          value={selectedIdx}
                          onChange={(e) =>
                            setMapping((prev) => ({
                              ...prev,
                              [field.key]: Number(e.target.value),
                            }))
                          }
                          className={`w-full min-h-[40px] px-3 rounded-lg border text-xs font-medium ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900'
                              : 'bg-slate-950 border-slate-700 text-slate-100'
                          }`}
                        >
                          <option value={-1}>
                            {field.required ? '— Select column —' : '— Skip / Use default —'}
                          </option>
                          {headers.map((h, i) => (
                            <option key={`${h}-${i}`} value={i}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {field.hint}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Merge vs Replace Mode */}
              <div
                className={`p-4 rounded-xl border space-y-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <p className="text-xs font-bold">
                  Catalogue Import Behaviour (Current saved SKUs: {existingCount})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`min-h-[44px] p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      importMode === 'merge'
                        ? 'border-blue-600 bg-blue-600/10 text-blue-700 dark:text-blue-300'
                        : isLight
                        ? 'bg-white border-slate-200 text-slate-700'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">Merge &amp; Update by Barcode</p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Updates matching barcodes and adds new SKUs
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`min-h-[44px] p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      importMode === 'replace'
                        ? 'border-blue-600 bg-blue-600/10 text-blue-700 dark:text-blue-300'
                        : isLight
                        ? 'bg-white border-slate-200 text-slate-700'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">Replace Saved Catalogue</p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Clears current list and loads only this file
                    </p>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              {parsedItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ready to import {parsedItems.length} valid SKUs</span>
                    </p>
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Previewing first {Math.min(3, parsedItems.length)}
                    </span>
                  </div>
                  <div
                    className={`rounded-xl border overflow-x-auto ${
                      isLight ? 'border-slate-200' : 'border-slate-800'
                    }`}
                  >
                    <table className="w-full text-left text-xs tabular-nums">
                      <thead
                        className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-slate-300'}
                      >
                        <tr>
                          <th className="py-2 px-3 font-semibold">Barcode</th>
                          <th className="py-2 px-3 font-semibold">Product</th>
                          <th className="py-2 px-3 font-semibold">Supplier</th>
                          <th className="py-2 px-3 font-semibold text-right">Pack</th>
                          <th className="py-2 px-3 font-semibold text-right">Unit ex GST</th>
                          <th className="py-2 px-3 font-semibold text-center">GST</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedItems.slice(0, 3).map((item) => (
                          <tr
                            key={`${item.barcode}-${item.sku}`}
                            className={`border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}
                          >
                            <td className="py-2 px-3 font-mono">{item.barcode}</td>
                            <td className="py-2 px-3 font-medium">{item.name}</td>
                            <td className="py-2 px-3">{item.supplierName}</td>
                            <td className="py-2 px-3 text-right font-mono">{item.packSize}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              ${item.unitCostExGst.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.gstApplicable ? '10%' : 'Free'}
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
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-end gap-2.5 px-5 py-4 border-t shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-900/60'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Cancel
          </button>
          {headers.length > 0 && (
            <button
              type="button"
              disabled={parsedItems.length === 0 || missingRequired.length > 0}
              onClick={handleCommitImport}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <span>
                {importMode === 'merge' ? 'Merge Into Catalogue' : 'Replace Catalogue'} ({parsedItems.length})
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
