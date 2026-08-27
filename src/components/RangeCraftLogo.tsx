import React from 'react';

interface RangeCraftLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon-only';
  themeVariant?: 'auto' | 'light' | 'dark' | 'white';
  className?: string;
  showSubtitle?: boolean;
}

export const RangeCraftLogo: React.FC<RangeCraftLogoProps> = ({
  size = 'md',
  variant = 'full',
  themeVariant = 'auto',
  className = '',
  showSubtitle = true,
}) => {
  // Dimensions map
  const iconSizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
    '2xl': 'w-18 h-18',
  };

  const textTitleSizeMap = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
  };

  const textSubtitleSizeMap = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
    '2xl': 'text-base',
  };

  const isWhite = themeVariant === 'white';
  const isLight = themeVariant === 'light';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Precision FMCG Retail Matrix & Growth Vertex Emblem */}
      <div 
        className={`relative shrink-0 ${iconSizeMap[size]} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105 ${
          isWhite 
            ? 'bg-white text-indigo-900 shadow-white/20' 
            : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white shadow-indigo-600/30 border border-indigo-400/30'
        }`}
      >
        {/* SVG Emblem */}
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5"
        >
          {/* Layered Promotional Tier Shelves */}
          <rect x="6" y="28" width="28" height="4.5" rx="2.25" fill="currentColor" fillOpacity={isWhite ? '0.35' : '0.4'} />
          <rect x="9" y="21" width="22" height="4.5" rx="2.25" fill="currentColor" fillOpacity={isWhite ? '0.65' : '0.7'} />
          <rect x="13" y="14" width="14" height="4.5" rx="2.25" fill="currentColor" fillOpacity="1" />
          
          {/* Upward Commercial Trajectory Diamond Chevron */}
          <path 
            d="M20 5L26 11.5H22V14H18V11.5H14L20 5Z" 
            fill={isWhite ? '#4f46e5' : '#38bdf8'} 
          />
          
          {/* Apex Growth Sparkle Node */}
          <circle cx="20" cy="5" r="2" fill="#fbbf24" />
        </svg>

        {/* Ambient Subtle Glow */}
        <div className="absolute -inset-0.5 rounded-xl sm:rounded-2xl bg-indigo-500/20 blur-[2px] -z-10" />
      </div>

      {/* Brand Typography */}
      {variant === 'full' && (
        <div className="flex flex-col text-left leading-tight">
          <div className={`font-black tracking-tight flex items-center gap-1 ${textTitleSizeMap[size]}`}>
            <span className={isWhite ? 'text-white' : isLight ? 'text-slate-900' : 'text-slate-900 dark:text-white'}>
              Range
            </span>
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 dark:from-indigo-400 dark:via-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
              Craft
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 -ml-0.5" />
          </div>

          {showSubtitle && (
            <div className={`font-semibold tracking-wide flex items-center gap-1.5 -mt-0.5 ${textSubtitleSizeMap[size]} ${
              isWhite ? 'text-indigo-200' : isLight ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'
            }`}>
              <span>FMCG Trade & Promotional Engine</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
