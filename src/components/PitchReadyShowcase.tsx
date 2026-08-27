import React from 'react';
import { FileCheck, BarChart2, CalendarDays } from 'lucide-react';

export const PitchReadyShowcase: React.FC = () => (
  <div className="grid md:grid-cols-3 gap-6">
    {[
      { icon: CalendarDays, title: "Retail-Ready Calendars", desc: "Clean, professional 52-week views for buyer meetings." },
      { icon: BarChart2, title: "Net Margin Waterfalls", desc: "Data-backed margin visualizations that protect your profitability." },
      { icon: FileCheck, title: "Volume Lift Scenarios", desc: "Evidence-based scenarios that buyers trust and approve." }
    ].map((item, i) => (
      <div key={i} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <item.icon className="w-8 h-8 text-amber-500 mb-4" />
        <h4 className="font-bold mb-2">{item.title}</h4>
        <p className="text-slate-400 text-sm">{item.desc}</p>
      </div>
    ))}
  </div>
);
