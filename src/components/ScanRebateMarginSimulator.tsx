import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Product } from '../types';

interface ScanRebateSimulatorProps {
  initialCost?: number;
  initialRrp?: number;
  products?: Product[];
}

export const ScanRebateMarginSimulator: React.FC<ScanRebateSimulatorProps> = ({ 
  initialCost = 10, 
  initialRrp = 20,
  products = [],
}) => {
  const [selectedSkuCode, setSelectedSkuCode] = useState<string>('');
  const [cost, setCost] = useState(initialCost);
  const [rrp, setRrp] = useState(initialRrp);
  const [promoPrice, setPromoPrice] = useState(Number((initialRrp * 0.8).toFixed(2)));
  const [scanRebate, setScanRebate] = useState(1.5);

  const handleSelectProduct = (sku: string) => {
    setSelectedSkuCode(sku);
    const match = products.find(p => p.sku === sku);
    if (match) {
      setCost(Number(match.cost.toFixed(2)));
      setRrp(Number(match.rrp.toFixed(2)));
      setPromoPrice(Number((match.rrp * 0.8).toFixed(2)));
    }
  };

  const regularMargin = rrp > 0 ? ((rrp - cost) / rrp) * 100 : 0;
  const promoMarginWithoutRebate = promoPrice > 0 ? ((promoPrice - cost) / promoPrice) * 100 : 0;
  const promoMarginWithRebate = promoPrice > 0 ? ((promoPrice - cost + scanRebate) / promoPrice) * 100 : 0;

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-500/20 shrink-0">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Scan Rebate Margin Simulator</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Calculate the impact of scan-based trade rebates on promotional margins.</p>
          </div>
        </div>

        {products.length > 0 && (
          <div className="sm:w-64 shrink-0">
            <label htmlFor="sim-pick-sku" className="sr-only">Prefill from active SKU range</label>
            <select
              id="sim-pick-sku"
              value={selectedSkuCode}
              onChange={(e) => handleSelectProduct(e.target.value)}
              className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer truncate"
            >
              <option value="">Load SKU from active range...</option>
              {products.map(p => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} · {p.name} (${p.rrp.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Cost Price ($)', value: cost, setter: setCost },
          { label: 'Regular RRP ($)', value: rrp, setter: setRrp },
          { label: 'Promo Price ($)', value: promoPrice, setter: setPromoPrice },
          { label: 'Scan Rebate ($/u)', value: scanRebate, setter: setScanRebate },
        ].map((input) => (
          <div key={input.label} className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block truncate">{input.label}</label>
            <input
              type="number"
              step="0.01"
              value={input.value}
              onChange={(e) => input.setter(Number(e.target.value))}
              className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono tabular-nums focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {[
          { label: 'Regular Margin %', value: regularMargin, color: 'text-slate-700 dark:text-slate-200' },
          { label: 'Promo Margin (No Rebate)', value: promoMarginWithoutRebate, color: 'text-rose-600 dark:text-rose-400' },
          { label: 'Promo Margin (With Rebate)', value: promoMarginWithRebate, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">{stat.label}</div>
            <div className={`text-xl sm:text-2xl font-black tabular-nums ${stat.color}`}>
              {stat.value.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
