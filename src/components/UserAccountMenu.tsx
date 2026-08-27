import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  CheckCircle2, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  LogOut, 
  Building2, 
  DollarSign, 
  Zap, 
  Layers, 
  ExternalLink,
  Crown,
  Boxes,
  FileText,
  Sliders
} from 'lucide-react';
import { ThemeMode } from '../types';

interface UserAccountMenuProps {
  userEmail?: string;
  onOpenPricingModal?: () => void;
  onOpenInventoryManager?: () => void;
  onOpenEditRange?: () => void;
  onSelectTab?: (tab: any) => void;
  currentTheme?: ThemeMode;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  userEmail = 'jzaf666@gmail.com',
  onOpenPricingModal,
  onOpenInventoryManager,
  onOpenEditRange,
  onSelectTab,
  currentTheme = 'light'
}) => {
  const isLight = currentTheme.includes('light');
  const [isOpen, setIsOpen] = useState(false);
  const [activePlanTab, setActivePlanTab] = useState<'inclusions' | 'pricing'>('inclusions');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeInclusions = [
    { title: 'Unlimited Active SKUs & Portfolios', desc: 'No SKU limits across grocery, beverages & health' },
    { title: '52-Week Promotional Planner & Calendar', desc: 'Full drag-and-drop 52-week master trade grid' },
    { title: 'ACCC Hiatus Compliance Radar', desc: 'Real-time 4-week gap & regulatory audit verification' },
    { title: 'Executive JBP Deck & Pitch Studio', desc: '1-click export of retailer-ready PowerPoint & PDF decks' },
    { title: 'Dead Net Waterfall & Scan Funding Engine', desc: 'Live net margin calculations with supplier funding' },
    { title: 'Omni-Trade B2B CRM & Trading Terms', desc: 'Manage buyer contacts, deals & scan rebate contracts' },
    { title: 'SKU & Warehouse Inventory Stock Radar', desc: '52-week stock allocation & shortage alert radar' },
    { title: 'Priority FMCG Benchmark Updates', desc: 'Coles, Woolworths, Metcash & Amazon retail calendars' },
  ];

  const pricingTiers = [
    {
      name: 'Starter Plan',
      price: '$79',
      period: '/mo',
      badge: 'Single Brand',
      isCurrent: false,
      features: ['Up to 25 Active SKUs', '52-Week Basic Calendar', 'Standard Margin Calculator']
    },
    {
      name: 'Pro Commercial',
      price: '$199',
      period: '/mo',
      badge: 'ACTIVE PLAN',
      isCurrent: true,
      features: ['Unlimited SKUs', 'ACCC Hiatus Compliance Radar', 'Executive JBP Deck Generator', 'Dead Net Waterfall', 'Warehouse Inventory Radar']
    },
    {
      name: 'Enterprise FMCG',
      price: '$499',
      period: '/mo',
      badge: 'Custom',
      isCurrent: false,
      features: ['Multi-Account Teams', 'Direct EDI & ERP Data Sync', 'Dedicated Category Consultant', 'Custom Scan Rebate Workflows']
    }
  ];

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* USER AVATAR BUTTON TRIGGER */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl border transition-all cursor-pointer select-none ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
            : isLight
            ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs hover:bg-slate-50'
            : 'bg-[#151b2e] border-slate-700 hover:border-slate-600 text-slate-200 hover:bg-[#1a233c]'
        }`}
        title="User Profile & Active Subscription"
      >
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
          <User className="w-4 h-4" />
        </div>

        <div className="hidden md:flex flex-col text-left leading-tight pr-1">
          <span className="text-[11px] font-black truncate max-w-[120px]">
            {userEmail.split('@')[0]}
          </span>
          <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            PRO ACTIVE
          </span>
        </div>
      </button>

      {/* DROPDOWN MENU POPOVER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border shadow-2xl z-50 overflow-hidden ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f1424] border-slate-700 text-white'
            }`}
          >
            {/* USER HEADER BANNER */}
            <div className="p-5 bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white relative overflow-hidden">
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-lg border border-white/30 shadow-inner">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-sm tracking-tight truncate max-w-[180px]">
                      {userEmail}
                    </h4>
                    <span className="text-[11px] text-indigo-200 font-medium block">
                      National Commercial FMCG Account
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider mt-1.5">
                      <Crown className="w-3 h-3 text-amber-300" />
                      Pro Commercial Plan
                    </span>
                  </div>
                </div>
              </div>

              {/* Ambient Background Glow */}
              <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-indigo-500/30 blur-2xl" />
            </div>

            {/* TAB SELECTOR: INCLUSIONS VS PRICING */}
            <div className={`flex border-b text-xs font-bold ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#141a2c] border-slate-800 text-slate-400'
            }`}>
              <button
                onClick={() => setActivePlanTab('inclusions')}
                className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
                  activePlanTab === 'inclusions'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-transparent'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Plan Inclusions (8)
              </button>
              <button
                onClick={() => setActivePlanTab('pricing')}
                className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
                  activePlanTab === 'pricing'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-transparent'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pricing & Upgrades
              </button>
            </div>

            {/* CONTENT BODY */}
            <div className="p-4 max-h-[340px] overflow-y-auto space-y-3">
              {activePlanTab === 'inclusions' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>Active Features Included</span>
                    <span className="text-emerald-500">All Unlocked</span>
                  </div>

                  <div className="space-y-1.5">
                    {activeInclusions.map((item, idx) => (
                      <div 
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                          isLight ? 'bg-slate-50 border-slate-200/80 hover:bg-indigo-50/50' : 'bg-[#151b2e] border-slate-800 hover:bg-[#1a233c]'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-xs leading-tight">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePlanTab === 'pricing' && (
                <div className="space-y-3">
                  <div className="text-[11px] text-slate-400 px-1">
                    Select a tier to scale your FMCG brand account:
                  </div>

                  {pricingTiers.map((tier, idx) => (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        tier.isCurrent 
                          ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40' 
                          : isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151b2e] border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs">{tier.name}</h5>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            tier.isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            {tier.badge}
                          </span>
                        </div>
                        <div className="font-mono font-black text-sm">
                          {tier.price}<span className="text-[10px] font-normal text-slate-400">{tier.period}</span>
                        </div>
                      </div>

                      <ul className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 my-2">
                        {tier.features.map((f, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-indigo-400" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {!tier.isCurrent && onOpenPricingModal && (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onOpenPricingModal();
                          }}
                          className="w-full mt-2 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-[11px] transition-colors cursor-pointer text-slate-800 dark:text-slate-200"
                        >
                          Switch to {tier.name}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK ACTIONS FOOTER */}
            <div className={`p-3 border-t space-y-1 ${
              isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#121728] border-slate-800'
            }`}>
              {onOpenInventoryManager && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenInventoryManager();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-white text-slate-700' : 'hover:bg-[#1a233c] text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-indigo-500" />
                    <span>SKU & Warehouse Stock Manager</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {onOpenEditRange && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenEditRange();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-white text-slate-700' : 'hover:bg-[#1a233c] text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-500" />
                    <span>Edit Product Range & RRPs</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {onOpenPricingModal && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenPricingModal();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-white text-slate-700' : 'hover:bg-[#1a233c] text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span>Manage Subscription & Invoices</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
