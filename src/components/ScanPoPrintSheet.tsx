import React from 'react';
import { ScanPoOrderMetadata, ScanSupplierGroup } from '../types';

interface ScanPoPrintSheetProps {
  metadata: ScanPoOrderMetadata;
  supplierGroups: ScanSupplierGroup[];
  targetSupplier: string | 'all';
}

export const ScanPoPrintSheet: React.FC<ScanPoPrintSheetProps> = ({
  metadata,
  supplierGroups,
  targetSupplier,
}) => {
  const groupsToPrint =
    targetSupplier === 'all'
      ? supplierGroups
      : supplierGroups.filter((g) => g.supplierName === targetSupplier);

  if (groupsToPrint.length === 0) return null;

  const issuedDate = new Date().toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const isDraft = metadata.orderMode === 'rep_draft';

  return (
    <div className="scan-po-print-area hidden print:block bg-white text-slate-900">
      {groupsToPrint.map((group, idx) => {
        const displayPoNumber =
          groupsToPrint.length > 1
            ? `${metadata.poNumber}-S${String(idx + 1).padStart(2, '0')}`
            : metadata.poNumber;

        return (
          <section
            key={group.supplierName}
            className="scan-po-print-page bg-white text-slate-900 p-4 space-y-5 relative"
          >
            {/* Rep Draft Watermark Banner */}
            {isDraft && (
              <div className="border-2 border-amber-700 bg-amber-50 px-4 py-2 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-900">
                  DRAFT – PENDING STORE APPROVAL (REP REPLENISHMENT)
                </p>
              </div>
            )}

            {/* Header Row */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <p className="text-xl font-extrabold tracking-tight text-slate-900">
                  RangeCraft Purchase Order
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Australian Retail Scan &amp; Replenishment Order Document
                </p>
              </div>
              <div className="text-right tabular-nums">
                <p className="text-base font-mono font-bold text-slate-900">{displayPoNumber}</p>
                <p className="text-xs text-slate-700 mt-0.5">Issued: {issuedDate}</p>
                <p className="text-xs font-bold mt-0.5 text-slate-900">
                  Order Type: {isDraft ? 'Rep Replenishment Draft' : 'Firm Order'}
                </p>
                <p className="text-xs text-slate-700 mt-0.5">
                  Requested Delivery: {metadata.deliveryDate || 'ASAP'}
                </p>
              </div>
            </div>

            {/* Store & Supplier Details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-slate-300 rounded-lg p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  To / Bill-To Store
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {metadata.storeName || 'Retail Store'}
                </p>
                {metadata.storeAbn && (
                  <p className="text-xs text-slate-700 font-mono">
                    ABN / Account: {metadata.storeAbn}
                  </p>
                )}
                {metadata.storeEmail && (
                  <p className="text-xs text-slate-700">Email: {metadata.storeEmail}</p>
                )}
              </div>

              <div className="border border-slate-300 rounded-lg p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Supplier
                </p>
                <p className="text-sm font-bold text-slate-900">{group.supplierName}</p>
                <p className="text-xs text-slate-700">
                  Dispatch Email: {group.supplierEmail || 'Not specified'}
                </p>
                <p className="text-xs text-slate-700 tabular-nums">
                  {group.lines.length} SKU lines · {group.totalCartons} cartons ({group.totalUnits}{' '}
                  units)
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full border-collapse text-[10px] tabular-nums">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-400 text-slate-900">
                  <th className="py-2 px-2 text-left font-bold">SKU</th>
                  <th className="py-2 px-2 text-left font-bold">Barcode</th>
                  <th className="py-2 px-2 text-left font-bold">Product Description</th>
                  <th className="py-2 px-2 text-right font-bold">Pack Size</th>
                  <th className="py-2 px-2 text-right font-bold">Carton Qty</th>
                  <th className="py-2 px-2 text-right font-bold">Total Units</th>
                  <th className="py-2 px-2 text-right font-bold">Unit Cost</th>
                  <th className="py-2 px-2 text-center font-bold">GST</th>
                  <th className="py-2 px-2 text-right font-bold">Line Total (ex GST)</th>
                </tr>
              </thead>
              <tbody>
                {group.lines.map((line) => {
                  const totalUnits = line.cartonQty * Math.max(1, line.packSize);
                  const lineExGst = totalUnits * line.unitCostExGst;
                  return (
                    <tr key={line.id} className="border-b border-slate-200">
                      <td className="py-2 px-2 font-mono font-semibold">{line.sku}</td>
                      <td className="py-2 px-2 font-mono">{line.barcode}</td>
                      <td className="py-2 px-2 font-medium">{line.name}</td>
                      <td className="py-2 px-2 text-right font-mono">{line.packSize}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold">{line.cartonQty}</td>
                      <td className="py-2 px-2 text-right font-mono">{totalUnits}</td>
                      <td className="py-2 px-2 text-right font-mono">
                        ${line.unitCostExGst.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {line.gstApplicable ? '10%' : 'Free'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-semibold">
                        ${lineExGst.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Notes & Financial Summary */}
            <div className="grid grid-cols-12 gap-6 pt-2">
              <div className="col-span-7 border border-slate-300 rounded-lg p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Order &amp; Delivery Notes
                </p>
                <p className="text-xs text-slate-800 whitespace-pre-line">
                  {metadata.notes || 'Standard store receiving dock instructions apply.'}
                </p>
              </div>

              <div className="col-span-5 border border-slate-900 rounded-lg p-3.5 space-y-1.5 tabular-nums">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Subtotal (ex GST)</span>
                  <span className="font-mono font-semibold">${group.subtotalExGst.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">GST (10%)</span>
                  <span className="font-mono font-semibold">${group.gstAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-300 pt-1.5 flex items-center justify-between text-sm font-extrabold">
                  <span>Total Payable (inc GST)</span>
                  <span className="font-mono">${group.totalIncGst.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Store Manager Approval Signature Line for Rep Drafts */}
            {isDraft && (
              <div className="pt-6 border-t border-dashed border-slate-400 grid grid-cols-2 gap-8">
                <div>
                  <div className="h-8 border-b border-slate-700" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-1">
                    Store Manager Approval Signature
                  </p>
                </div>
                <div>
                  <div className="h-8 border-b border-slate-700" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-1">
                    Print Name &amp; Date Approved
                  </p>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
