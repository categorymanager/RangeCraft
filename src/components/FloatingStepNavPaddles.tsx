import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, CheckCircle2, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { ThemeMode } from '../types';

interface FloatingStepNavPaddlesProps {
  currentTab: string;
  onSelectTab: (tab: any) => void;
  currentTheme?: ThemeMode;
}

interface StepConfig {
  id: string;
  stepNum: number;
  label: string;
  shortLabel: string;
  tab: string;
  description: string;
}

export const WORKFLOW_STEPS: StepConfig[] = [
  {
    id: 'step-1',
    stepNum: 1,
    label: 'Range Diagnostics & Setup',
    shortLabel: 'Range Diagnostics',
    tab: 'overview',
    description: 'Portfolio baseline, margin rules & channel profile'
  },
  {
    id: 'step-2',
    stepNum: 2,
    label: '52-Week Promotional Planner',
    shortLabel: 'Promo Planner',
    tab: 'calendar',
    description: '52-week master trade grid & seasonal slots'
  },
  {
    id: 'step-3',
    stepNum: 3,
    label: 'Compliance & ACCC Hiatus Radar',
    shortLabel: 'Compliance Radar',
    tab: 'clashes',
    description: 'Audit 4-week hiatus breaches & retail scan fines'
  },
  {
    id: 'step-4',
    stepNum: 4,
    label: 'Executive JBP Deck & Pitch Studio',
    shortLabel: 'Executive JBP Deck',
    tab: 'executive-briefing',
    description: 'Retail buyer JBP pitch deck & category waterfalls'
  },
  {
    id: 'step-5',
    stepNum: 5,
    label: 'Lock Plan & Commercial Export',
    shortLabel: 'Lock & Export',
    tab: 'market-intel',
    description: 'Lock FY26 trade plan & download buyer deliverables'
  }
];

export const FloatingStepNavPaddles: React.FC<FloatingStepNavPaddlesProps> = ({
  currentTab,
  onSelectTab,
  currentTheme = 'light'
}) => {
  const isLight = currentTheme.includes('light');

  // Determine current active step index (0 to 4)
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.tab === currentTab);
  
  // If user is on a sub-view (e.g. week-studio, crm, billing, catalog), map to nearest logical step
  const effectiveIndex = currentStepIndex !== -1 
    ? currentStepIndex 
    : currentTab === 'catalog' || currentTab === 'analytics' ? 0 
    : currentTab === 'week-studio' ? 1 
    : currentTab === 'crm' ? 3 
    : 1;

  const prevStep = effectiveIndex > 0 ? WORKFLOW_STEPS[effectiveIndex - 1] : null;
  const nextStep = effectiveIndex < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[effectiveIndex + 1] : null;

  // Keyboard shortcut support (Alt + ArrowLeft / Alt + ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea/select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.altKey && e.key === 'ArrowLeft' && prevStep) {
        e.preventDefault();
        onSelectTab(prevStep.tab);
      } else if (e.altKey && e.key === 'ArrowRight' && nextStep) {
        e.preventDefault();
        onSelectTab(nextStep.tab);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevStep, nextStep, onSelectTab]);

  return (
    <>
      {/* LEFT FLOATING PADDLE: PREVIOUS STEP */}
      <AnimatePresence>
        {prevStep && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 group pointer-events-auto"
          >
            <button
              onClick={() => onSelectTab(prevStep.tab)}
              className={`flex items-center gap-2 p-2 sm:px-3 sm:py-2.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer ${
                isLight 
                  ? 'bg-white/90 border-slate-200/90 text-slate-700 hover:bg-white hover:border-indigo-400 hover:shadow-indigo-500/20 hover:text-indigo-600' 
                  : 'bg-[#121829]/90 border-slate-700/80 text-slate-200 hover:bg-[#182038] hover:border-indigo-500 hover:text-white'
              }`}
              title={`Previous: Step ${prevStep.stepNum} - ${prevStep.label} (Alt + ←)`}
            >
              <div className="w-7 h-7 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
                <ChevronLeft className="w-4 h-4" />
              </div>

              <div className="hidden lg:flex flex-col text-left leading-tight pr-1 max-w-[130px] group-hover:max-w-[190px] transition-all overflow-hidden">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  Step {prevStep.stepNum} of 5
                </span>
                <span className="text-xs font-bold truncate">
                  {prevStep.shortLabel}
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT FLOATING PADDLE: NEXT STEP */}
      <AnimatePresence>
        {nextStep && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 group pointer-events-auto"
          >
            <button
              onClick={() => onSelectTab(nextStep.tab)}
              className={`flex items-center gap-2 p-2 sm:px-3 sm:py-2.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer ${
                isLight 
                  ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 hover:shadow-indigo-500/30' 
                  : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 hover:shadow-indigo-500/40'
              }`}
              title={`Next: Step ${nextStep.stepNum} - ${nextStep.label} (Alt + →)`}
            >
              <div className="hidden lg:flex flex-col text-right leading-tight pl-1 max-w-[130px] group-hover:max-w-[190px] transition-all overflow-hidden">
                <span className="text-[10px] uppercase font-black tracking-wider text-indigo-200">
                  Next Step {nextStep.stepNum}
                </span>
                <span className="text-xs font-bold truncate">
                  {nextStep.shortLabel}
                </span>
              </div>

              <div className="w-7 h-7 rounded-xl bg-white/20 text-white flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-110 group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
