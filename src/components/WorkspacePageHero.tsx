import React, { useState } from 'react';
import { AppTab, ThemeMode } from '../types';
import { LucideIcon } from 'lucide-react';

export type HeroAccent = 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';

interface FunnelStepItem {
  step: number;
  label: string;
  tab: AppTab;
}

const FUNNEL_STEPS: FunnelStepItem[] = [
  { step: 1, label: '1. Range', tab: 'catalog' },
  { step: 2, label: '2. Planner', tab: 'calendar' },
  { step: 3, label: '3. Audit', tab: 'clashes' },
  { step: 4, label: '4. JBP Deck', tab: 'executive-briefing' },
  { step: 5, label: '5. Trade ROI', tab: 'analytics' },
];

interface WorkspacePageHeroProps {
  title: string;
  subtitle: string;
  stepLabel: string;
  accent?: HeroAccent;
  currentTheme?: ThemeMode | string;
  activeStep?: number;
  onSelectTab?: (tab: AppTab) => void;
  heroImageSrc?: string;
  heroImageAlt?: string;
  FallbackIcon?: LucideIcon;
  metaStrip?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const ACCENT_THEMES: Record<
  HeroAccent,
  {
    lightBg: string;
    darkBg: string;
    lightKicker: string;
    darkKicker: string;
    activeStepLight: string;
    activeStepDark: string;
    iconBoxLight: string;
    iconBoxDark: string;
  }
> = {
  indigo: {
    lightBg: 'bg-gradient-to-b from-indigo-50/95 via-white to-slate-50/70 border-indigo-200/80',
    darkBg: 'bg-gradient-to-b from-[#131b3a] via-[#10162b] to-[#0d1222] border-indigo-900/50',
    lightKicker: 'text-indigo-700',
    darkKicker: 'text-indigo-300',
    activeStepLight: 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
    activeStepDark: 'bg-indigo-500 text-white border-indigo-400 shadow-xs',
    iconBoxLight: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    iconBoxDark: 'bg-indigo-950/70 text-indigo-300 border-indigo-800',
  },
  blue: {
    lightBg: 'bg-gradient-to-b from-sky-50/95 via-white to-slate-50/70 border-sky-200/80',
    darkBg: 'bg-gradient-to-b from-[#0e1e36] via-[#0f172a] to-[#0c1220] border-sky-900/50',
    lightKicker: 'text-sky-700',
    darkKicker: 'text-sky-300',
    activeStepLight: 'bg-sky-600 text-white border-sky-600 shadow-xs',
    activeStepDark: 'bg-sky-500 text-white border-sky-400 shadow-xs',
    iconBoxLight: 'bg-sky-100 text-sky-700 border-sky-200',
    iconBoxDark: 'bg-sky-950/70 text-sky-300 border-sky-800',
  },
  emerald: {
    lightBg: 'bg-gradient-to-b from-emerald-50/90 via-white to-slate-50/70 border-emerald-200/80',
    darkBg: 'bg-gradient-to-b from-[#0b231d] via-[#0e1824] to-[#0c1220] border-emerald-900/50',
    lightKicker: 'text-emerald-700',
    darkKicker: 'text-emerald-300',
    activeStepLight: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    activeStepDark: 'bg-emerald-500 text-white border-emerald-400 shadow-xs',
    iconBoxLight: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    iconBoxDark: 'bg-emerald-950/70 text-emerald-300 border-emerald-800',
  },
  amber: {
    lightBg: 'bg-gradient-to-b from-amber-50/90 via-white to-slate-50/70 border-amber-200/80',
    darkBg: 'bg-gradient-to-b from-[#251a0c] via-[#151824] to-[#0d1220] border-amber-900/50',
    lightKicker: 'text-amber-700',
    darkKicker: 'text-amber-300',
    activeStepLight: 'bg-amber-600 text-white border-amber-600 shadow-xs',
    activeStepDark: 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs',
    iconBoxLight: 'bg-amber-100 text-amber-700 border-amber-200',
    iconBoxDark: 'bg-amber-950/70 text-amber-300 border-amber-800',
  },
  rose: {
    lightBg: 'bg-gradient-to-b from-rose-50/90 via-white to-slate-50/70 border-rose-200/80',
    darkBg: 'bg-gradient-to-b from-[#28121b] via-[#151624] to-[#0d1220] border-rose-900/50',
    lightKicker: 'text-rose-700',
    darkKicker: 'text-rose-300',
    activeStepLight: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    activeStepDark: 'bg-rose-500 text-white border-rose-400 shadow-xs',
    iconBoxLight: 'bg-rose-100 text-rose-700 border-rose-200',
    iconBoxDark: 'bg-rose-950/70 text-rose-300 border-rose-800',
  },
  violet: {
    lightBg: 'bg-gradient-to-b from-violet-50/90 via-white to-slate-50/70 border-violet-200/80',
    darkBg: 'bg-gradient-to-b from-[#1d1436] via-[#121629] to-[#0d1220] border-violet-900/50',
    lightKicker: 'text-violet-700',
    darkKicker: 'text-violet-300',
    activeStepLight: 'bg-violet-600 text-white border-violet-600 shadow-xs',
    activeStepDark: 'bg-violet-500 text-white border-violet-400 shadow-xs',
    iconBoxLight: 'bg-violet-100 text-violet-700 border-violet-200',
    iconBoxDark: 'bg-violet-950/70 text-violet-300 border-violet-800',
  },
};

export const WorkspacePageHero: React.FC<WorkspacePageHeroProps> = ({
  title,
  subtitle,
  stepLabel,
  accent = 'indigo',
  currentTheme = 'light',
  activeStep,
  onSelectTab,
  heroImageSrc,
  heroImageAlt,
  FallbackIcon,
  metaStrip,
  actions,
  children,
}) => {
  const isLight = !String(currentTheme).includes('dark');
  const palette = ACCENT_THEMES[accent] || ACCENT_THEMES.indigo;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section
      className={`rounded-3xl border shadow-xs overflow-hidden transition-colors ${
        isLight ? palette.lightBg : palette.darkBg
      }`}
    >
      <div className="px-4 py-6 sm:px-8 sm:py-8 space-y-5">
        {/* Optional Funnel Step Breadcrumb Rail */}
        {activeStep && onSelectTab && (
          <nav
            aria-label="Commercial Funnel Steps"
            className="flex items-center justify-center gap-1.5 flex-wrap"
          >
            {FUNNEL_STEPS.map((item, idx) => {
              const isCurrent = item.step === activeStep;
              return (
                <React.Fragment key={item.tab}>
                  <button
                    type="button"
                    onClick={() => onSelectTab(item.tab)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? isLight
                          ? palette.activeStepLight
                          : palette.activeStepDark
                        : isLight
                        ? 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                  {idx < FUNNEL_STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`text-xs hidden sm:inline ${isLight ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                      →
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* Centered Display Hero Stack */}
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p
            className={`text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.16em] ${
              isLight ? palette.lightKicker : palette.darkKicker
            }`}
          >
            {stepLabel}
          </p>

          <h1
            className={`text-2xl sm:text-4xl font-black tracking-tight leading-tight text-balance ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {title}
          </h1>

          <p
            className={`text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            {subtitle}
          </p>

          {metaStrip && (
            <div className="pt-0.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs font-mono tabular-nums">
              {metaStrip}
            </div>
          )}

          {/* Centered Custom Illustration */}
          {heroImageSrc && !imgFailed ? (
            <div className="pt-2">
              <div
                className={`w-full max-w-[220px] sm:max-w-[260px] aspect-[4/3] mx-auto rounded-2xl overflow-hidden border shadow-sm ${
                  isLight ? 'border-slate-200/90 bg-white' : 'border-slate-800 bg-slate-900'
                }`}
              >
                <img
                  src={heroImageSrc}
                  alt={heroImageAlt || title}
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : FallbackIcon ? (
            <div className="pt-1 flex justify-center">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                  isLight ? palette.iconBoxLight : palette.iconBoxDark
                }`}
              >
                <FallbackIcon className="w-6 h-6" />
              </div>
            </div>
          ) : null}

          {/* Centered Actions Row */}
          {actions && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Optional Contrast Control Tray (View switchers, range selectors, sub-tabs) */}
      {children && (
        <div
          className={`px-4 py-3.5 sm:px-6 border-t ${
            isLight
              ? 'bg-white/85 border-slate-200/80'
              : 'bg-[#0b101d]/90 border-slate-800/80'
          }`}
        >
          {children}
        </div>
      )}
    </section>
  );
};
