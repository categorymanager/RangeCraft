import React, { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';

export const InteractiveLeadWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [channel, setChannel] = useState('');
  
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl max-w-lg mx-auto">
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Step 1: Select Your Retail Channel</h3>
          <div className="grid gap-3">
            {['Supermarket', 'Liquor', 'Apparel', 'General Retail'].map(c => (
              <button key={c} onClick={() => { setChannel(c); setStep(2); }} className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-left font-bold flex justify-between items-center">
                {c} <ChevronRight className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Step 2: Estimate Your Margin Leakage</h3>
          <p className="text-slate-400 text-sm">Use the slider to estimate your annual promotional revenue impact.</p>
          <input type="range" className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          <button onClick={() => setStep(3)} className="w-full p-4 rounded-xl bg-amber-500 text-slate-950 font-bold">Calculate Impact</button>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-6 text-center">
          <h3 className="text-xl font-bold">Your Potential Savings</h3>
          <div className="text-4xl font-black text-emerald-400">$85,000</div>
          <p className="text-slate-400 text-sm">Annual margin leakage in {channel}. Enter your email to receive your full 52-week promotional audit.</p>
          <input type="email" placeholder="Work Email" className="w-full p-4 rounded-xl bg-slate-800 text-white" />
          <button className="w-full p-4 rounded-xl bg-amber-500 text-slate-950 font-bold">Unlock Report</button>
        </div>
      )}
    </div>
  );
};
