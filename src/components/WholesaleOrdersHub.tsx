import React, { useMemo, useState } from 'react';
import { Product, ThemeMode, WholesaleOrder } from '../types';
import { WorkspacePageHero } from './WorkspacePageHero';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  Truck,
  Clock,
  ArrowRight,
  Download,
  Calculator,
  Package,
  X
} from 'lucide-react';

interface WholesaleOrdersHubProps {
  orders: WholesaleOrder[];
  products: Product[];
  currentTheme: ThemeMode;
  onAddOrder: (order: WholesaleOrder) => void;
  onUpdateStatus: (orderId: string, status: WholesaleOrder['status']) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const WholesaleOrdersHub: React.FC<WholesaleOrdersHubProps> = ({
  orders,
  products,
  currentTheme,
  onAddOrder,
  onUpdateStatus,
  showToast,
}) => {
  const isLight = currentTheme.includes('light');
  const [statusFilter, setStatusFilter] = useState<'All' | WholesaleOrder['status']>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // New Carton PO form state
  const defaultProduct = products[0];
  const [selectedSku, setSelectedSku] = useState<string>(defaultProduct?.sku || 'SKU-01');
  const [accountName, setAccountName] = useState<string>('Independent Retailers & Wholesale Group');
  const [cartons, setCartons] = useState<number>(10);
  const [unitsPerCarton, setUnitsPerCarton] = useState<number>(12);
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30 Days');

  const activeProduct = useMemo(
    () => products.find(p => p.sku === selectedSku) || products[0],
    [products, selectedSku]
  );

  // Auto volume break discount rules: 5+ cartons -> 5%, 10+ cartons -> 10%
  const calculatedPreview = useMemo(() => {
    const unitCost = activeProduct ? activeProduct.cost : 4.2;
    const unitRrp = activeProduct ? activeProduct.rrp : 9.5;
    const baseCartonCostAud = Number((unitCost * 1.45 * unitsPerCarton).toFixed(2));
    const volumeDiscountPercent = cartons >= 10 ? 10 : cartons >= 5 ? 5 : 0;
    const netCartonCostAud = Number((baseCartonCostAud * (1 - volumeDiscountPercent / 100)).toFixed(2));
    const totalAud = Number((netCartonCostAud * cartons).toFixed(2));
    const storeUnitBuyAud = netCartonCostAud / Math.max(1, unitsPerCarton);
    const deadNetMarginPercent = unitRrp > 0
      ? Number((((unitRrp - storeUnitBuyAud) / unitRrp) * 100).toFixed(1))
      : 32.0;
    const storeBreakevenUnits = Math.max(12, Math.round((totalAud / Math.max(0.5, unitRrp - storeUnitBuyAud)) * 0.25));

    return {
      baseCartonCostAud,
      volumeDiscountPercent,
      netCartonCostAud,
      totalAud,
      deadNetMarginPercent,
      storeBreakevenUnits,
    };
  }, [activeProduct, cartons, unitsPerCarton]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'All') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const summary = useMemo(() => {
    const totalValue = orders.reduce((acc, o) => acc + o.totalAud, 0);
    const tradeCredit30Day = orders
      .filter(o => o.status !== 'Settled')
      .reduce((acc, o) => acc + o.totalAud, 0);
    const totalCartons = orders.reduce((acc, o) => acc + o.cartons, 0);
    const avgMargin = orders.length
      ? orders.reduce((acc, o) => acc + o.deadNetMarginPercent, 0) / orders.length
      : 0;
    return {
      totalValue,
      tradeCredit30Day,
      totalCartons,
      avgMargin: Number(avgMargin.toFixed(1)),
    };
  }, [orders]);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;

    const newOrder: WholesaleOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${Math.floor(4200 + Math.random() * 5700)}`,
      accountName: accountName.trim() || 'Independent Retailers & Wholesale Group',
      sku: activeProduct.sku,
      productName: activeProduct.name,
      cartons: Math.max(1, cartons),
      unitsPerCarton: Math.max(1, unitsPerCarton),
      baseCartonCostAud: calculatedPreview.baseCartonCostAud,
      volumeDiscountPercent: calculatedPreview.volumeDiscountPercent,
      netCartonCostAud: calculatedPreview.netCartonCostAud,
      totalAud: calculatedPreview.totalAud,
      paymentTerms,
      storeBreakevenUnits: calculatedPreview.storeBreakevenUnits,
      deadNetMarginPercent: calculatedPreview.deadNetMarginPercent,
      status: 'Confirmed',
      orderDate: new Date().toISOString().split('T')[0],
    };

    onAddOrder(newOrder);
    setIsFormOpen(false);
    showToast(`Created ${newOrder.poNumber} with ${newOrder.volumeDiscountPercent}% carton break applied`, 'success');
  };

  const handleExportCsv = () => {
    const header = ['PO Number', 'Date', 'Retail Partner', 'SKU', 'Product', 'Cartons', 'Discount %', 'Net Carton AUD', 'Total AUD', 'Terms', 'Store Breakeven', 'Dead-Net Margin %', 'Status'];
    const rows = filteredOrders.map(o => [
      o.poNumber,
      o.orderDate,
      `"${o.accountName.replace(/"/g, '""')}"`,
      o.sku,
      `"${o.productName.replace(/"/g, '""')}"`,
      o.cartons,
      o.volumeDiscountPercent,
      o.netCartonCostAud.toFixed(2),
      o.totalAud.toFixed(2),
      `"${o.paymentTerms}"`,
      o.storeBreakevenUnits,
      o.deadNetMarginPercent,
      o.status,
    ].join(','));

    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rangecraft-wholesale-orders-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported wholesale carton orders CSV', 'success');
  };

  const cardSurface = isLight
    ? 'bg-white border-slate-200/90 shadow-xs'
    : 'bg-[#121624] border-slate-800';
  const subText = isLight ? 'text-slate-600' : 'text-slate-400';
  const headingText = isLight ? 'text-slate-900' : 'text-slate-50';

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Centered Header Hero */}
      <WorkspacePageHero
        stepLabel="Contracts &amp; Carton Fulfillment"
        title="Wholesale Carton Orders"
        subtitle="Track wholesale carton orders, 5+/10+ volume breaks, 30-day trade credit exposure, and dead-net margins."
        accent="amber"
        currentTheme={currentTheme}
        FallbackIcon={ShoppingCart}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCsv}
              className={`min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFormOpen(prev => !prev)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isFormOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isFormOpen ? 'Close Builder' : 'New Carton PO'}</span>
            </button>
          </>
        }
      />

      {/* High-Contrast Dark Telemetry KPI Band */}
      <div className="rounded-3xl bg-[#0F172A] border border-slate-800 text-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-slate-800 tabular-nums">
          <div className="p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order Book Total</p>
            <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-white">
              A${summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs mt-1 text-slate-400">{orders.length} active purchase orders</p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">30-Day Trade Credit</p>
            <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-indigo-400">
              A${summary.tradeCredit30Day.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs mt-1 text-slate-400">Pending store &amp; DC settlement</p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cartons Booked</p>
            <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-amber-300">
              {summary.totalCartons.toLocaleString()} ctns
            </p>
            <p className="text-xs mt-1 text-slate-400">Volume tier: 5+ (-5%) · 10+ (-10%)</p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Dead-Net Store GM</p>
            <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-emerald-400">
              {summary.avgMargin}%
            </p>
            <p className="text-xs mt-1 text-slate-400">After volume break allowances</p>
          </div>
        </div>
      </div>

      {/* Create New Carton PO Builder */}
      {isFormOpen && (
        <form onSubmit={handleCreateOrder} className={`p-6 rounded-2xl border space-y-5 ${cardSurface}`}>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${headingText}`}>Carton Volume Break &amp; Store Margin Builder</h3>
                <p className={`text-xs ${subText}`}>5+ cartons unlocks -5% off list · 10+ cartons unlocks -10% wholesale discount</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${subText}`}>Retail / Wholesale Account</label>
              <select
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              >
                <option value="Major Supermarkets & Chains">Major Supermarkets &amp; Chains</option>
                <option value="Independent Retailers & Wholesale Group">Independent Retailers &amp; Wholesale Group</option>
                <option value="National Retail Networks">National Retail Networks</option>
                <option value="Regional Grocers & Specialty">Regional Grocers &amp; Specialty</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${subText}`}>Product SKU</label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              >
                {products.slice(0, 40).map(p => (
                  <option key={p.sku} value={p.sku}>
                    {p.sku} · {p.name} (RRP ${p.rrp.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${subText}`}>Carton Quantity</label>
              <input
                type="number"
                min={1}
                max={5000}
                value={cartons}
                onChange={(e) => setCartons(Math.max(1, Number(e.target.value) || 1))}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${subText}`}>Settlement Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              >
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days (Scan-Based)</option>
                <option value="14 Days Prompt (-2.5%)">14 Days Prompt (-2.5%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tier Discount</p>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                -{calculatedPreview.volumeDiscountPercent}% Wholesale Cost
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Net Carton Rate</p>
              <p className={`text-base font-black tabular-nums ${headingText}`}>
                A${calculatedPreview.netCartonCostAud.toFixed(2)} ({unitsPerCarton} units)
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Store Breakeven</p>
              <p className={`text-base font-black tabular-nums ${headingText}`}>
                {calculatedPreview.storeBreakevenUnits} units / store
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">PO Total Value</p>
              <p className="text-base font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                A${calculatedPreview.totalAud.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${subText}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] text-xs font-bold cursor-pointer"
            >
              <span>Confirm Purchase Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`inline-flex p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          {(['All', 'Confirmed', 'Dispatched', 'Settled'] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-indigo-600 text-white'
                  : subText
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <span className={`text-xs font-mono ${subText}`}>
          {filteredOrders.length} orders · 5+ ctns (-5%) · 10+ ctns (-10%)
        </span>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className={`p-10 rounded-2xl border text-center ${cardSurface}`}>
            <ShoppingCart className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
            <p className={`text-base font-bold ${headingText}`}>No wholesale orders in this filter</p>
            <p className={`text-xs mt-1 ${subText}`}>Switch filter or create a new carton PO to model volume breaks.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const nextStatus: WholesaleOrder['status'] | null =
              order.status === 'Confirmed'
                ? 'Dispatched'
                : order.status === 'Dispatched'
                ? 'Settled'
                : null;

            return (
              <div key={order.id} className={`p-5 rounded-2xl border transition-all ${cardSurface}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className={`font-bold ${headingText}`}>{order.poNumber}</span>
                      <span className="text-slate-400">·</span>
                      <span className={subText}>{order.orderDate}</span>
                      <span className="text-slate-400">·</span>
                      <span
                        className={`font-bold ${
                          order.status === 'Settled'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : order.status === 'Dispatched'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <h3 className={`text-base font-bold ${headingText}`}>
                      {order.accountName}
                    </h3>

                    <p className={`text-xs ${subText}`}>
                      <span className="font-mono font-semibold">{order.sku}</span> · {order.productName} ·{' '}
                      <span className="font-semibold">{order.cartons} cartons</span> ({order.cartons * order.unitsPerCarton} units)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 md:text-right">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Break Tier</p>
                      <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {order.volumeDiscountPercent > 0 ? `-${order.volumeDiscountPercent}% Cost` : 'Standard Rate'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dead-Net GM</p>
                      <p className={`text-xs font-mono font-bold tabular-nums ${headingText}`}>
                        {order.deadNetMarginPercent}% · {order.storeBreakevenUnits} units/store
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{order.paymentTerms}</p>
                      <p className={`text-lg font-black tabular-nums ${headingText}`}>
                        A${order.totalAud.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {nextStatus ? (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateStatus(order.id, nextStatus);
                          showToast(`${order.poNumber} marked as ${nextStatus}`, 'success');
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isLight
                            ? 'bg-slate-50 hover:bg-indigo-50 text-indigo-700 border-slate-200'
                            : 'bg-slate-900 hover:bg-indigo-950/60 text-indigo-300 border-slate-700'
                        }`}
                      >
                        {nextStatus === 'Dispatched' ? <Truck className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Mark {nextStatus}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-2">
                        <Package className="w-3.5 h-3.5" />
                        <span>Paid</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
