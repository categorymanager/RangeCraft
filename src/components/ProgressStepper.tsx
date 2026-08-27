import React from 'react';
import { CheckCircle2, Circle, Layers, Calendar, ShieldCheck, FileText, Lock } from 'lucide-react';
import { AppTab } from '../types';

type Step = {
  id: string;
  label: string;
  tab: AppTab;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STEPS: Step[] = [
  { id: 'step-1', label: '1. Range Diagnostics', tab: 'catalog', badge: 'Range Master', icon: Layers },
  { id: 'step-2', label: '2. Promotional Planner', tab: 'calendar', badge: '52W Planner', icon: Calendar },
  { id: 'step-3', label: '3. Compliance Radar', tab: 'clashes', badge: 'Hiatus Radar', icon: ShieldCheck },
  { id: 'step-4', label: '4. Executive JBP Deck', tab: 'executive-briefing', badge: 'Board Ready', icon: FileText },
  { id: 'step-5', label: '5. Lock & Export', tab: 'analytics', badge: 'Financials', icon: Lock },
];

interface ProgressStepperProps {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  isLight?: boolean;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ activeTab, onNavigate, isLight = false }) => {
  const currentIndex = STEPS.findIndex(s => s.tab === activeTab);

  return (
    <div className={`w-full max-w-5xl mx-auto py-2.5 px-3 sm:px-4 rounded-2xl border shadow-md transition-colors ${
      isLight 
        ? 'bg-white border-slate-200 shadow-slate-100' 
        : 'bg-slate-900/90 border-slate-800 shadow-slate-950/40 backdrop-blur-md'
    }`}>
      <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
        {STEPS.map((step, index) => {
          const isCompleted = currentIndex !== -1 && index < currentIndex;
          const isActive = step.tab === activeTab;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onNavigate(step.tab)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50' 
                    : isCompleted
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-950/60'
                      : isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                )}
                <span>{step.label}</span>
                {step.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded hidden sm:inline ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : isLight 
                        ? 'bg-slate-100 text-slate-500' 
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {step.badge}
                  </span>
                )}
              </button>
              {index < STEPS.length - 1 && (
                <div className={`w-3 sm:w-4 h-px shrink-0 hidden md:block ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
