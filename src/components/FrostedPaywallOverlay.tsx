import React from 'react';
import { Lock, Sparkles, ShieldCheck, Download, Zap, CheckCircle2 } from 'lucide-react';
import { useActiveCurrency } from '../utils/currency';

interface FrostedPaywallOverlayProps {
  title?: string;
  description?: string;
  featureBullets?: string[];
  exportId: string;
  itemName: string;
  onUnlockSingle: (exportId: string, itemName: string) => void;
  onGoPro: () => void;
  compact?: boolean;
  blurHeight?: string;
}

export const FrostedPaywallOverlay: React.FC<FrostedPaywallOverlayProps> = ({
  title = 'Premium Commercial Output Locked',
  description = 'Unlock high-yield commercial outputs, automated audits, and board-level presentations.',
  featureBullets = [
    'Complete unredacted data tables & formulas',
    'Instant board-ready download (PDF / Excel / PPTX)',
    '100% Satisfaction Guarantee & ACCC Hiatus compliant'
  ],
  exportId,
  itemName,
  onUnlockSingle,
  onGoPro,
  compact = false,
  blurHeight = 'min-h-[320px]'
}) => {
  const { currency, format } = useActiveCurrency();

  return (
    <div className={`relative w-full ${blurHeight} flex items-center justify-center p-4 sm:p-6 overflow-hidden rounded-2xl`}>
      {/* Background Frosted Glass Layer */}
      <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-950/40 backdrop-blur-md z-10" />

      {/* Foreground Elevated Card */}
      <div className="relative z-20 max-w-xl w-full bg-white dark:bg-slate-900/95 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-900/10 text-center animate-fadeIn">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-4">
          <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>PRO & REVERSE FREE TRIAL ACCESS</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        {/* Feature Checkpoints */}
        {!compact && featureBullets && featureBullets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-5 text-left text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            {featureBullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        )}

        {/* Two Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
          {/* CTA 1: Single Download */}
          <button
            type="button"
            onClick={() => onUnlockSingle(exportId, itemName)}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unlock Single Export — {format(19)}</span>
          </button>

          {/* CTA 2: 14-Day Free Trial / Pro Subscription */}
          <button
            type="button"
            onClick={onGoPro}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-600 text-white font-black text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer ring-2 ring-indigo-400/40"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Start 14-Day Free Pro Access</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Secured by Stripe & ABN
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Instant Un-watermarked Output
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            100% ACCC Hiatus Compliant
          </span>
        </div>
      </div>
    </div>
  );
};
