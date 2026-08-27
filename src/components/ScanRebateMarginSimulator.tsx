import React, { useState } from 'react';
import { Calculator, Percent, DollarSign } from 'lucide-react';

interface ScanRebateSimulatorProps {
  initialCost?: number;
  initialRrp?: number;
}

export const ScanRebateMarginSimulator: React.FC<ScanRebateSimulatorProps> = ({ 
  initialCost = 10, 
  initialRrp = 20 
}) => {
  const [cost, setCost] = useState(initialCost);
  const [rrp, setRrp] = useState(initialRrp);
  const [promoPrice, setPromoPrice] = useState(initialRrp * 0.8);
  const [scanRebate, setScanRebate] = useState(1.5);

  const regularMargin = rrp > 0 ? ((rrp - cost) / rrp) * 100 : 0;
  const promoMarginWithoutRebate = promoPrice > 0 ? ((promoPrice - cost) / promoPrice) * 100 : 0;
  const promoMarginWithRebate = promoPrice > 0 ? ((promoPrice - cost + scanRebate) / promoPrice) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Scan Rebate Margin Simulator</h2>
          <p className="text-sm text-slate-400">Calculate the impact of scan-based trade rebates on your promotional product margins.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cost Price ($)', value: cost, setter: setCost },
          { label: 'Regular RRP ($)', value: rrp, setter: setRrp },
          { label: 'Promo Price ($)', value: promoPrice, setter: setPromoPrice },
          { label: 'Scan Rebate ($/unit)', value: scanRebate, setter: setScanRebate },
        ].map((input) => (
          <div key={input.label} className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">{input.label}</label>
            <input
              type="number"
              value={input.value}
              onChange={(e) => input.setter(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
        {[
          { label: 'Regular Margin %', value: regularMargin, color: 'text-slate-300' },
          { label: 'Promo Margin (No Rebate) %', value: promoMarginWithoutRebate, color: 'text-rose-400' },
          { label: 'Promo Margin (With Rebate) %', value: promoMarginWithRebate, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">{stat.label}</div>
            <div className={`text-2xl font-black ${stat.color}`}>
              {stat.value.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
