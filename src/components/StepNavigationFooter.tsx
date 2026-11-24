import React from 'react';
import { AppTab, ThemeMode } from '../types';
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Layers, Calendar, ShieldCheck, FileText, Lock } from 'lucide-react';

interface StepNavigationFooterProps {
  currentTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
  currentTheme?: ThemeMode;
  onOpenPricingModal?: () => void;
}

interface StepConfig {
  stepNumber: number;
  currentTitle: string;
  currentSubtitle: string;
  nextTab: AppTab;
  nextStepTitle: string;
  nextStepSubtitle: string;
  prevTab?: AppTab;
  prevStepTitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  nextIcon: React.ComponentType<{ className?: string }>;
}

const STEP_FLOWS: Record<string, StepConfig> = {
  catalog: {
    stepNumber: 1,
    currentTitle: 'Step 1: Channel & SKU Master Setup',
    currentSubtitle: 'Your SKUs, baseline units, and retail pricing rules are configured.',
    nextTab: 'calendar',
    nextStepTitle: 'Step 2: 52-Week Promotional Canvas',
    nextStepSubtitle: 'Map your promotional cadence across Major Supermarkets & National Retail Networks.',
    icon: Layers,
    nextIcon: Calendar,
  },
  calendar: {
    stepNumber: 2,
    currentTitle: 'Step 2: 52-Week Promotional Canvas',
    currentSubtitle: 'Your 52-week promotional matrix and discount depth are plotted.',
    nextTab: 'clashes',
    nextStepTitle: 'Step 3: Custom Rules & Clash Audit',
    nextStepSubtitle: 'Run automated checks for 4-week hiatus rules and category cannibalisation.',
    prevTab: 'catalog',
    prevStepTitle: 'Step 1: Channel Setup',
    icon: Calendar,
    nextIcon: ShieldCheck,
  },
  clashes: {
    stepNumber: 3,
    currentTitle: 'Step 3: Custom Rules & Compliance Audit',
    currentSubtitle: 'Regulatory hiatus gaps and cannibalisation warnings are resolved.',
    nextTab: 'executive-briefing',
    nextStepTitle: 'Step 4: Executive JBP Deck Generator',
    nextStepSubtitle: 'Generate board-ready retailer presentations and cross-merch pitches.',
    prevTab: 'calendar',
    prevStepTitle: 'Step 2: 52-Week Canvas',
    icon: ShieldCheck,
    nextIcon: FileText,
  },
  'executive-briefing': {
    stepNumber: 4,
    currentTitle: 'Step 4: Executive JBP Deck & Pitch Studio',
    currentSubtitle: 'Buyer pitch slides, category growth narratives, and baskets are ready.',
    nextTab: 'analytics',
    nextStepTitle: 'Step 5: Lock & Export Financials',
    nextStepSubtitle: 'Review scan rebates, dead net margin waterfalls, and export locked schedules.',
    prevTab: 'clashes',
    prevStepTitle: 'Step 3: Custom Rules Audit',
    icon: FileText,
    nextIcon: Lock,
  },
  analytics: {
    stepNumber: 5,
    currentTitle: 'Step 5: Lock & Export Final Financials',
    currentSubtitle: 'Trade margins locked, scan rebate funding calculated, and export ready.',
    nextTab: 'catalog',
    nextStepTitle: 'Workflow Complete • Re-plan or Export Another Channel',
    nextStepSubtitle: 'Start a new channel scenario or update your SKU master catalogue.',
    prevTab: 'executive-briefing',
    prevStepTitle: 'Step 4: JBP Deck',
    icon: Lock,
    nextIcon: Sparkles,
  },
};

export const StepNavigationFooter: React.FC<StepNavigationFooterProps> = ({
  currentTab,
  onNavigateTab,
  currentTheme = 'dark',
}) => {
  const isLight = currentTheme.includes('light');
  const stepInfo = STEP_FLOWS[currentTab];

  if (!stepInfo) return null;

  const NextIcon = stepInfo.nextIcon;

  return (
    <div className={`mt-6 sm:mt-10 rounded-2xl border p-4 sm:p-6 transition-all ${
      isLight 
        ? 'bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-slate-50 border-indigo-200 shadow-sm' 
        : 'bg-gradient-to-r from-[#0d1428] via-[#0f172a] to-[#090d16] border-indigo-900/50 shadow-xl'
    }`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left Info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              <span>Step {stepInfo.stepNumber} of 5</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">Guided Workflow</span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stepInfo.currentTitle}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-xl">
              {stepInfo.currentSubtitle}
            </p>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end shrink-0">
          {stepInfo.prevTab && (
            <button
              type="button"
              onClick={() => onNavigateTab(stepInfo.prevTab!)}
              className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Back: {stepInfo.prevStepTitle}</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab(stepInfo.nextTab)}
            className="min-h-[44px] flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer min-w-0"
          >
            <NextIcon className="w-4 h-4 text-white shrink-0" />
            <span className="truncate">Next: {stepInfo.nextStepTitle}</span>
            <ArrowRight className="w-4 h-4 text-white shrink-0" />
          </button>
        </div>

      </div>
    </div>
  );
};
