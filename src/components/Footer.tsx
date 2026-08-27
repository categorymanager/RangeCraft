import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  Building2, 
  Target, 
  ShoppingBag, 
  Globe, 
  Layers, 
  DollarSign, 
  FileText, 
  Flame, 
  Search, 
  History, 
  CreditCard, 
  ArrowRight, 
  Palette, 
  Upload, 
  Award, 
  ExternalLink,
  Lock,
  Mail,
  MapPin
} from 'lucide-react';
import { ThemeMode } from '../types';

interface FooterProps {
  currentTheme: ThemeMode;
  onNavigateTab: (tab: 'overview' | 'calendar' | 'week-studio' | 'catalog' | 'analytics' | 'market-intel' | 'clashes' | 'executive-briefing' | 'activity-log' | 'crm' | 'billing') => void;
  onOpenPricingModal: () => void;
  onOpenUploadModal?: () => void;
  onOpenAboutModal?: () => void;
  onOpenThemeModal: () => void;
  onOpenAuthModal: () => void;
  onOpenAiOptimizer?: () => void;
}

interface FooterSection {
  id: string;
  title: string;
  links: {
    label: string;
    action?: () => void;
    badge?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export const Footer: React.FC<FooterProps> = ({
  currentTheme,
  onNavigateTab,
  onOpenPricingModal,
  onOpenUploadModal,
  onOpenAboutModal,
  onOpenThemeModal,
  onOpenAuthModal,
  onOpenAiOptimizer,
}) => {
  const isLight = currentTheme.includes('light');
  
  // Track open accordion sections on mobile (allow multi or single expand)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    solutions: false,
    products: false,
    forWho: false,
    resources: false,
    company: false,
  });

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const footerSections: FooterSection[] = [
    {
      id: 'solutions',
      title: 'Solutions',
      links: [
        { label: 'For FMCG Brand Reps & KAMs', action: () => onNavigateTab('calendar'), icon: Target },
        { label: 'For Retail Category Buyers', action: () => onNavigateTab('clashes'), icon: ShoppingBag },
        { label: 'For Wholesale Distributors', action: () => onNavigateTab('crm'), icon: Building2 },
        { label: 'For D2C & Omnichannel Brands', action: () => onNavigateTab('analytics'), icon: Globe },
        { label: 'Joint Business Planning (JBP)', action: () => onNavigateTab('executive-briefing'), icon: FileText },
      ],
    },
    {
      id: 'products',
      title: 'Products',
      links: [
        { label: '52-Week Master Grid', action: () => onNavigateTab('calendar'), icon: Calendar },
        { label: 'Omni-Trade B2B CRM', action: () => onNavigateTab('crm'), icon: Building2 },
        { label: 'Trade Rebate & Margin Simulator', action: () => onNavigateTab('analytics'), icon: DollarSign },
        { label: 'Gemini AI Scenario Strategist', action: () => onOpenAiOptimizer ? onOpenAiOptimizer() : onNavigateTab('overview'), badge: 'AI', icon: Sparkles },
        { label: 'Executive JBP Deck Export', action: () => onNavigateTab('executive-briefing'), icon: FileText },
        { label: 'ACCC Compliance Radar', action: () => onNavigateTab('clashes'), badge: 'ACCC', icon: ShieldCheck },
      ],
    },
    {
      id: 'forWho',
      title: 'For Who',
      links: [
        { label: 'Supermarket Suppliers (Tier-1)', action: () => onNavigateTab('calendar') },
        { label: 'Pharmacy & Wellness Chains', action: () => onNavigateTab('overview') },
        { label: 'Home Improvement & Hardware', action: () => onNavigateTab('catalog') },
        { label: 'Mass Variety & Department', action: () => onNavigateTab('market-intel') },
        { label: 'Independent & Regional Retail Network', action: () => onNavigateTab('crm') },
      ],
    },
    {
      id: 'resources',
      title: 'Resources',
      links: [
        { label: 'Product Range & SKU Matrix', action: () => onNavigateTab('catalog'), icon: Layers },
        { label: 'Market Intelligence Radar', action: () => onNavigateTab('market-intel'), icon: Search },
        { label: 'ACCC 4-Week Hiatus Rules', action: () => onNavigateTab('clashes'), icon: ShieldCheck },
        { label: 'Activity Log & Audit Trail', action: () => onNavigateTab('activity-log'), icon: History },
        { label: 'Billing, Invoices & ATO Receipts', action: () => onNavigateTab('billing'), icon: CreditCard },
      ],
    },
    {
      id: 'company',
      title: 'Company',
      links: [
        { label: 'About RangeCraft AU', action: onOpenAboutModal },
        { label: 'Plans & Commercial Pricing', action: onOpenPricingModal, badge: 'Popular' },
        { label: 'Upload CSV SKU Range', action: onOpenUploadModal, icon: Upload },
        { label: 'Theme & Color Schemes', action: onOpenThemeModal, icon: Palette },
        { label: 'Account Login / Sign Up', action: onOpenAuthModal, icon: Lock },
      ],
    },
  ];

  return (
    <footer 
      id="global-website-footer"
      className={`border-t transition-colors print:hidden ${
        isLight 
          ? 'bg-slate-50 text-slate-700 border-slate-200' 
          : 'bg-[#0a0d14] text-slate-300 border-[#1a2336]'
      }`}
    >
      {/* Top Value Banner */}
      <div className={`border-b ${isLight ? 'bg-white border-slate-200' : 'bg-[#0d111a] border-[#1a2336]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center font-black text-sm text-white shadow-md shadow-blue-500/25 shrink-0">
              AU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-slate-900 dark:text-white">
                  RangeCraft AU
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Omni-Trade Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Australia's definitive 52-week retail promotional planning & ACCC compliance engine.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <button
              id="footer-cta-get-started"
              onClick={onOpenPricingModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="footer-cta-upload-sku"
              onClick={onOpenUploadModal}
              className={`px-4 py-2 rounded-xl font-bold text-xs border transition-all flex items-center gap-2 cursor-pointer ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800' 
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>Import SKU Range</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Section: Multi-Column on Desktop, Accordions on Mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Desktop View: Clean 5-Column Grid */}
        <div className="hidden md:grid md:grid-cols-5 gap-8">
          {footerSections.map((section) => (
            <div key={section.id} id={`footer-desktop-section-${section.id}`} className="space-y-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                {section.title}
              </h3>
              <ul className="space-y-2 text-xs">
                {section.links.map((link, idx) => {
                  const Icon = link.icon;
                  return (
                    <li key={idx}>
                      <button
                        onClick={link.action}
                        className="text-left text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 group cursor-pointer w-full"
                      >
                        {Icon && <Icon className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />}
                        <span className="group-hover:translate-x-0.5 transition-transform truncate">{link.label}</span>
                        {link.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                            {link.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile View: Collapsible Accordion Sections for Clean, Clear Navigation */}
        <div className="md:hidden space-y-2.5">
          {footerSections.map((section) => {
            const isOpen = !!openAccordions[section.id];
            return (
              <div 
                key={section.id}
                id={`footer-accordion-${section.id}`}
                className={`rounded-2xl border transition-colors overflow-hidden ${
                  isLight 
                    ? 'bg-white border-slate-200 shadow-sm' 
                    : 'bg-[#0f1422] border-[#1e2638]'
                }`}
              >
                <button
                  id={`footer-accordion-toggle-${section.id}`}
                  onClick={() => toggleAccordion(section.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="uppercase tracking-wider text-[11px] font-black">{section.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-normal">
                      {section.links.length} items
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`footer-accordion-content-${section.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className={`px-4 pb-3.5 pt-1 space-y-2 border-t text-xs ${
                        isLight ? 'border-slate-100' : 'border-[#1a2336]'
                      }`}>
                        {section.links.map((link, idx) => {
                          const Icon = link.icon;
                          return (
                            <button
                              key={idx}
                              onClick={link.action}
                              className="w-full text-left py-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />}
                                <span className="truncate">{link.label}</span>
                              </div>
                              {link.badge && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                                  {link.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Australian Compliance & Trust Strip */}
        <div className={`mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-[#1a2336] text-slate-400'
        }`}>
          <div className="flex items-center flex-wrap gap-2 text-center md:text-left">
            <span className="font-semibold text-slate-800 dark:text-slate-200">🇦🇺 Australian Retail Calendar Engine</span>
            <span>•</span>
            <span>ACCC 4-Week Hiatus Compliance Guard</span>
            <span>•</span>
            <span>Scan Rebate & JBP Margin Model</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={onOpenAboutModal}
              className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              About Company
            </button>
            <span>•</span>
            <button
              onClick={onOpenPricingModal}
              className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              Pricing & Plans
            </button>
            <span>•</span>
            <button
              onClick={onOpenThemeModal}
              className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer flex items-center gap-1"
            >
              <Palette className="w-3 h-3 text-amber-500" />
              <span>Theme</span>
            </button>
          </div>
        </div>

        {/* Bottom Copyright & Security Notice */}
        <div className={`mt-4 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] ${
          isLight ? 'border-slate-100 text-slate-400' : 'border-slate-900 text-slate-500'
        }`}>
          <div>
            © {new Date().getFullYear()} RangeCraft AU (Omni-Trade Enterprise). All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Sydney & Melbourne Tier-1 Supermarket / Retail Review Cycle Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
