import React, { useMemo, useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  PlusCircle,
  Trash2,
  BookmarkPlus,
  Search,
  Package,
  Calendar,
  FileText,
} from 'lucide-react';
import { ScanPoHistoryEntry, ThemeMode } from '../types';

interface ScanSupplierOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  supplierFilter: string | null; // null = All Suppliers
  onChangeSupplierFilter: (supplier: string | null) => void;
  history: ScanPoHistoryEntry[];
  hasActiveLines: boolean;
  canSaveActiveSupplier: boolean;
  onSaveCurrentSupplierToHistory: () => void;
  onLoadTemplate: (entry: ScanPoHistoryEntry, mode: 'fresh_draft' | 'merge') => void;
  onDeleteHistoryEntry: (id: string) => void;
}

const EXPORT_SOURCE_LABELS: Record<NonNullable<ScanPoHistoryEntry['exportedVia']>, string> = {
  print: 'Printed / PDF',
  email: 'Emailed',
  csv: 'CSV Exported',
  manual: 'Saved Snapshot',
  sample: 'Past Order',
};

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export const ScanSupplierOrderHistoryModal: React.FC<ScanSupplierOrderHistoryModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  supplierFilter,
  onChangeSupplierFilter,
  history,
  hasActiveLines,
  canSaveActiveSupplier,
  onSaveCurrentSupplierToHistory,
  onLoadTemplate,
  onDeleteHistoryEntry,
}) => {
  const isLight = currentTheme.includes('light');
  const [searchTerm, setSearchTerm] = useState('');

  const availableSuppliers = useMemo(() => {
    const names = Array.from(new Set<string>(history.map((h) => h.supplierName))).sort((a, b) =>
      a.localeCompare(b)
    );
    if (supplierFilter && !names.includes(supplierFilter)) {
      names.unshift(supplierFilter);
    }
    return names;
  }, [history, supplierFilter]);

  const filteredHistory = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return history.filter((entry) => {
      if (supplierFilter && entry.supplierName.toLowerCase() !== supplierFilter.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      return (
        entry.poNumber.toLowerCase().includes(q) ||
        entry.supplierName.toLowerCase().includes(q) ||
        entry.storeName.toLowerCase().includes(q) ||
        entry.lines.some(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.sku.toLowerCase().includes(q) ||
            l.barcode.toLowerCase().includes(q)
        )
      );
    });
  }, [history, supplierFilter, searchTerm]);

  if (!isOpen) return null;

  const surfaceCls = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-[#111726] border-slate-800 text-slate-100';
  const subSurfaceCls = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-800'
    : 'bg-slate-900/70 border-slate-800 text-slate-200';
  const inputCls = isLight
    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white'
    : 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500';
  const mutedCls = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Supplier Order History"
      onClick={onClose}
    >
      <div
        className={`w-full sm:max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border shadow-2xl overflow-hidden ${surfaceCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight truncate">
                {supplierFilter ? `${supplierFilter} · Order History` : 'Supplier Order History'}
              </h2>
            </div>
            <p className={`text-xs ${mutedCls}`}>
              Re-load a past purchase order as a draft template to speed up store replenishment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Order History"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl cursor-pointer transition-colors shrink-0 ${
              isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar: Supplier Selector + Search + Save Snapshot */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              aria-label="Filter order history by supplier"
              value={supplierFilter || '__ALL__'}
              onChange={(e) =>
                onChangeSupplierFilter(e.target.value === '__ALL__' ? null : e.target.value)
              }
              className={`min-h-[42px] px-3 rounded-xl border text-xs font-semibold focus:outline-none ${inputCls}`}
            >
              <option value="__ALL__">All Suppliers ({history.length})</option>
              {availableSuppliers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search PO#, product name, or SKU..."
                className={`w-full min-h-[42px] pl-9 pr-3 rounded-xl border text-xs focus:outline-none ${inputCls}`}
              />
            </div>

            {canSaveActiveSupplier && (
              <button
                type="button"
                onClick={onSaveCurrentSupplierToHistory}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-emerald-950/40 border-emerald-700 text-emerald-300 hover:bg-emerald-900/50'
                }`}
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Save Active Order</span>
              </button>
            )}
          </div>
        </div>

        {/* History List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {filteredHistory.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-8 text-center space-y-2 ${subSurfaceCls}`}>
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold">
                {supplierFilter
                  ? `No saved order history for ${supplierFilter} yet`
                  : 'No saved order history found'}
              </p>
              <p className={`text-xs max-w-sm mx-auto ${mutedCls}`}>
                Orders are recorded automatically whenever you print, email, or export a PO CSV—or tap{' '}
                <strong>Save Active Order</strong> above to bookmark your current draft.
              </p>
            </div>
          ) : (
            filteredHistory.map((entry) => (
              <article
                key={entry.id}
                className={`rounded-2xl border p-4 space-y-3 transition-colors ${subSurfaceCls}`}
              >
                {/* Top Summary Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
                        {entry.poNumber}
                      </span>
                      <span aria-hidden="true" className={mutedCls}>·</span>
                      <span className="text-xs font-bold truncate">{entry.supplierName}</span>
                    </div>
                    <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${mutedCls}`}>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatShortDate(entry.createdAt)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {entry.orderMode === 'rep_draft' ? 'Rep Draft' : 'Firm Store Order'}
                      </span>
                      {entry.exportedVia && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{EXPORT_SOURCE_LABELS[entry.exportedVia]}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 shrink-0">
                    <div className="text-right tabular-nums">
                      <p className="text-sm font-mono font-extrabold">
                        ${entry.totalIncGst.toFixed(2)}
                      </p>
                      <p className={`text-[11px] ${mutedCls}`}>
                        {entry.totalCartons} ctn ({entry.totalUnits} u)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteHistoryEntry(entry.id)}
                      aria-label={`Delete history ${entry.poNumber}`}
                      title="Remove from order history"
                      className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
                        isLight
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/40'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Line Items Preview */}
                <div
                  className={`rounded-xl border divide-y text-xs ${
                    isLight
                      ? 'bg-white border-slate-200 divide-slate-100'
                      : 'bg-[#111726] border-slate-800 divide-slate-800'
                  }`}
                >
                  {entry.lines.map((line) => (
                    <div
                      key={`${entry.id}-${line.id}-${line.barcode}`}
                      className="px-3 py-2 flex items-center justify-between gap-2 tabular-nums"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{line.name}</p>
                          <p className={`text-[11px] font-mono truncate ${mutedCls}`}>
                            {line.sku} · {line.packSize}/ctn · ${line.unitCostExGst.toFixed(2)} ex GST
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold shrink-0">
                        {line.cartonQty} ctn
                      </span>
                    </div>
                  ))}
                </div>

                {entry.notes && (
                  <p className={`text-[11px] italic ${mutedCls}`}>Note: {entry.notes}</p>
                )}

                {/* Re-load Template Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
                  {hasActiveLines && (
                    <button
                      type="button"
                      onClick={() => onLoadTemplate(entry, 'merge')}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                          : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Merge into Active PO</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onLoadTemplate(entry, 'fresh_draft')}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{hasActiveLines ? 'Load as Fresh Draft' : 'Load as Draft Template'}</span>
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
