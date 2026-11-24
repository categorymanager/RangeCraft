import React from 'react';
import { AppTab, ThemeMode } from '../types';
import { ArrowRight, Palette } from 'lucide-react';
import { RangeCraftLogo } from './RangeCraftLogo';

interface FooterProps {
  currentTheme: ThemeMode;
  onNavigateTab: (tab: AppTab) => void;
  onOpenPricingModal: () => void;
  onOpenUploadModal?: () => void;
  onOpenAboutModal?: () => void;
  onOpenThemeModal: () => void;
  onOpenAuthModal: () => void;
  onOpenAiOptimizer?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentTheme,
  onNavigateTab,
  onOpenPricingModal,
  onOpenAboutModal,
  onOpenThemeModal,
  onOpenAuthModal,
}) => {
  const isLight = currentTheme.includes('light');

  const navLinks: { label: string; action: () => void }[] = [
    { label: 'Executive Dashboard', action: () => onNavigateTab('dashboard') },
    { label: 'Products & Margin', action: () => onNavigateTab('catalog') },
    { label: '52-Week Calendar', action: () => onNavigateTab('calendar') },
    { label: 'Custom Rules Guard', action: () => onNavigateTab('clashes') },
    { label: 'Commercial Insights', action: () => onNavigateTab('commercial-insights') },
    { label: 'Trade Waterfall', action: () => onNavigateTab('analytics') },
    { label: 'Wholesale Orders', action: () => onNavigateTab('wholesale') },
    { label: 'Partner CRM', action: () => onNavigateTab('crm') },
    { label: 'Billing & Invoices', action: () => onNavigateTab('billing') },
  ];

  return (
    <footer
      id="global-website-footer"
      className={`border-t transition-colors print:hidden pb-20 md:pb-8 ${
        isLight
          ? 'bg-slate-50 text-slate-600 border-slate-200'
          : 'bg-[#090d16] text-slate-400 border-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <RangeCraftLogo size="sm" showSubtitle={false} />
            <p className="text-xs text-slate-500 max-w-md">
              Enterprise FMCG promotional planning, margin protection, and Custom Rules compliance workspace.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              id="footer-cta-get-started"
              onClick={() => onNavigateTab('catalog')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenPricingModal}
              className={`px-4 py-2 rounded-xl border font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              View Plans & Pricing
            </button>
          </div>
        </div>

        {/* Clean Link Strip */}
        <div className={`pt-6 border-t flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={link.action}
              className={`cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-indigo-600' : 'text-slate-400 hover:text-indigo-400'
              }`}
            >
              {link.label}
            </button>
          ))}
          {onOpenAboutModal && (
            <button
              onClick={onOpenAboutModal}
              className={`cursor-pointer transition-colors ${
                isLight ? 'text-slate-600 hover:text-indigo-600' : 'text-slate-400 hover:text-indigo-400'
              }`}
            >
              About RangeCraft AU
            </button>
          )}
          <button
            onClick={onOpenAuthModal}
            className={`cursor-pointer transition-colors ${
              isLight ? 'text-slate-600 hover:text-indigo-600' : 'text-slate-400 hover:text-indigo-400'
            }`}
          >
            Account Login
          </button>
          <button
            onClick={onOpenThemeModal}
            className={`cursor-pointer transition-colors inline-flex items-center gap-1 ${
              isLight ? 'text-slate-600 hover:text-indigo-600' : 'text-slate-400 hover:text-indigo-400'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>Theme</span>
          </button>
        </div>

        {/* Bottom Copyright */}
        <div className={`pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${
          isLight ? 'border-slate-200/80 text-slate-500' : 'border-slate-800/80 text-slate-500'
        }`}>
          <div>© 2026 RangeCraft AU Pty Ltd · Melbourne, Australia</div>
          <div>commercial@rangecraft.com.au</div>
        </div>
      </div>
    </footer>
  );
};
