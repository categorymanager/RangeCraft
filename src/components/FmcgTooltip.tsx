import React, { useState } from 'react';
import { HelpCircle, Info, CheckCircle2, DollarSign, ShieldCheck } from 'lucide-react';
import { FMCG_GLOSSARY, FmcgTermDefinition } from '../data/fmcgGlossary';

interface FmcgTooltipProps {
  termKey: keyof typeof FMCG_GLOSSARY | string;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export const FmcgTooltip: React.FC<FmcgTooltipProps> = ({
  termKey,
  children,
  showIcon = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const data: FmcgTermDefinition | undefined = FMCG_GLOSSARY[termKey];

  if (!data) {
    return <span className={className}>{children || termKey}</span>;
  }

  return (
    <span 
      className={`relative inline-flex items-center gap-1 cursor-help group ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      <span className="border-b border-dotted border-blue-400/80 group-hover:border-blue-400 font-medium">
        {children || data.shortLabel}
      </span>
      {showIcon && (
        <HelpCircle className="w-3.5 h-3.5 text-blue-400/80 group-hover:text-blue-400 inline-block shrink-0 transition-colors" />
      )}

      {/* Floating Rich Tooltip Box */}
      {isOpen && (
        <div 
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 sm:w-96 p-4 rounded-2xl bg-slate-900/98 text-slate-100 text-xs shadow-2xl border border-slate-700/80 backdrop-blur-xl animate-fade-in pointer-events-none"
          style={{ filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.45))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>{data.term}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {data.category}
            </span>
          </div>

          {/* Definition */}
          <p className="text-slate-300 text-[11px] leading-relaxed mb-2.5">
            {data.definition}
          </p>

          {/* Formula if available */}
          {data.formula && (
            <div className="mb-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-[10px] text-emerald-300">
              <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Formula:</span>
              {data.formula}
            </div>
          )}

          {/* Practical Example */}
          <div className="mb-2 text-[10.5px] text-slate-400">
            <span className="font-semibold text-slate-300">Practical Example:</span> {data.example}
          </div>

          {/* KAM Pro Tip */}
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-amber-200/90 flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>KAM Pro Tip:</strong> {data.proTip}</span>
          </div>

          {/* Arrow indicator */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900/98" />
        </div>
      )}
    </span>
  );
};
