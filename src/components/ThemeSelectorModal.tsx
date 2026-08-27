import React from 'react';
import { ThemeMode } from '../types';
import { THEME_CONFIGS } from '../data/themePresets';
import { 
  Palette, 
  Check, 
  ShieldCheck, 
  Sun, 
  Moon, 
  X,
  Sparkles,
  Zap
} from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const themes = [THEME_CONFIGS.light, THEME_CONFIGS.dark];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Interface Appearance & Color Scheme
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  WCAG AAA High Contrast
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose between high-contrast Executive Light mode and focused Obsidian Dark mode.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <Sun className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Executive Light Mode</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Clean white surfaces (#FFFFFF) & crisp slate text (#0F172A). Optimized for boardroom presentations and PDF reports.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <Moon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Obsidian Dark Mode</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Deep graphite canvas (#090D16) & luminous text (#F8FAFC). Optimized for late-night modeling and financial focus.
                </p>
              </div>
            </div>
          </div>

          {/* Theme Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themes.map((theme) => {
              const isSelected = currentTheme === theme.id;
              const isLight = theme.id === 'light';

              return (
                <div
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`group relative rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500 ring-2 ring-blue-500/30 shadow-xl'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isLight ? (
                          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            <Sun className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                            <Moon className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {theme.name}
                          </h3>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTheme(theme.id);
                          }}
                          className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                        >
                          Select
                        </button>
                      )}
                    </div>

                    {/* Tagline & Description */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {theme.tagline}
                    </p>

                    {/* Color Swatch Preview */}
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 uppercase tracking-wider">
                        Color Hierarchy
                      </span>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div
                          className="w-7 h-7 rounded-lg shadow-inner border border-white/20 flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: theme.palette.bg, color: theme.palette.textPrimary }}
                          title={`Canvas: ${theme.palette.bg}`}
                        >
                          Bg
                        </div>
                        <div
                          className="w-7 h-7 rounded-lg shadow-inner border border-white/20 flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: theme.palette.card, color: theme.palette.textPrimary }}
                          title={`Card: ${theme.palette.card}`}
                        >
                          Card
                        </div>
                        <div
                          className="w-7 h-7 rounded-lg shadow-inner border border-white/20 flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: theme.palette.accent }}
                          title={`Accent: ${theme.palette.accent}`}
                        >
                          UI
                        </div>
                        <div
                          className="w-7 h-7 rounded-lg shadow-inner border border-white/20 flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: theme.palette.liftGreen }}
                          title={`Profit Green: ${theme.palette.liftGreen}`}
                        >
                          +ROI
                        </div>
                        <div className="ml-auto text-right text-[10px] text-slate-400 font-mono">
                          {theme.contrastRatio}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Best for */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{theme.bestFor}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Theme preference is saved automatically across browser sessions.</span>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
