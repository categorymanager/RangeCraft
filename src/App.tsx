import React, { useState, useMemo, useEffect } from 'react';
import { 
  Product, 
  WeekPromotion, 
  ThemeMode, 
  UserProfile, 
  SubscriptionTier, 
  ActivityLogEntry, 
  CrmAccount, 
  CrmDeal, 
  CrmActivity, 
  BusinessPersona,
  TradingTerms,
  AdminAnalyticsSummary,
  CreatorTransaction,
  CreatorPayoutRecord,
  BankAccountConfig,
  SkuCatalog,
  CheckoutContext,
  CheckoutPlanType,
  AppTab,
  WholesaleOrder
} from './types';
import { INITIAL_PRODUCTS } from './data/products';
import { INITIAL_CATALOGS } from './data/catalogsData';
import { INITIAL_CRM_ACCOUNTS, INITIAL_CRM_DEALS, INITIAL_CRM_ACTIVITIES } from './data/crmInitialData';
import { 
  INITIAL_TRADING_TERMS, 
  ADMIN_ANALYTICS_SUMMARY_MOCK, 
  INITIAL_CREATOR_TRANSACTIONS, 
  INITIAL_CREATOR_PAYOUTS, 
  INITIAL_BANK_ACCOUNT 
} from './data/adminAnalyticsData';
import { generateDefault52WeekPlan, calculateStrategyKPIs, auditClashes, autoReslotAndFixClashes } from './utils/promoPlannerEngine';
import { exportPromotionsToCsv, sanitizeProducts } from './utils/csvHelpers';
import { buildSkuPromoDemandMap, computeSkuInventoryForecast } from './utils/inventoryForecast';
import { hasUsedFreeTrial, markTrialUsedLocal } from './utils/entitlements';
import {
  initAnalytics,
  GA4_MEASUREMENT_ID,
  setUserAnalyticsContext,
  trackModuleAccess,
  trackPurchaseSuccess,
  trackSubscriptionUpgrade,
} from './utils/analytics';
import {
  auth,
  syncUserProfile,
  saveUserPlanToCloud,
  loadUserPlanFromCloud,
  saveUserCatalogsToCloud,
  loadUserCatalogsFromCloud,
  consumeAiQuotaWithProfile,
  purchaseAiTopUp
} from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Folder,
  Calendar as CalendarIcon,
  SlidersHorizontal,
  ScanBarcode,
  Menu as MenuIcon
} from 'lucide-react';

// Components
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPageView } from './components/LandingPageView';
import { CalendarView } from './components/CalendarView';
import { WeekDetailDrawer } from './components/WeekDetailDrawer';
import { ProductCatalogView } from './components/ProductCatalogView';
import { AnalyticsView } from './components/AnalyticsView';
import { MarketIntelView } from './components/MarketIntelView';
import { ClashAuditView } from './components/ClashAuditView';
import { ExecutiveReportView } from './components/ExecutiveReportView';
import { ActivityLogView } from './components/ActivityLogView';
import { CrmModule } from './components/CrmModule';
import { AIStrategistModal } from './components/AIStrategistModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { SkuRangeUploadModal } from './components/SkuRangeUploadModal';
import { AuthModal } from './components/AuthModal';
import { PricingPaywallModal } from './components/PricingPaywallModal';
import { AboutCompanyModal } from './components/AboutCompanyModal';
import { TradingTermsModal } from './components/TradingTermsModal';
import { AdminAnalyticsModal } from './components/AdminAnalyticsModal';
import { OnboardingProductPrompt } from './components/OnboardingProductPrompt';
import { BillingInvoicesHub } from './components/BillingInvoicesHub';
import { SkuDeletionEngineView } from './components/SkuDeletionEngineView';
import { BreakevenBasketPitchView } from './components/BreakevenBasketPitchView';
import { CheckoutPageView } from './components/CheckoutPageView';
import { StepNavigationFooter } from './components/StepNavigationFooter';
import { ImportTutorialModal } from './components/ImportTutorialModal';
import { TradeStrategyFunnelView } from './components/TradeStrategyFunnelView';
import { SkuInventoryManagerModal } from './components/SkuInventoryManagerModal';
import { ProductRangeEditorModal } from './components/ProductRangeEditorModal';
import { FloatingStepNavPaddles } from './components/FloatingStepNavPaddles';
import { WorkspaceDirectoryView } from './components/WorkspaceDirectoryView';
import { WholesaleOrdersHub } from './components/WholesaleOrdersHub';
import { EnterpriseQuoteModal } from './components/EnterpriseQuoteModal';
import { EnterpriseSidebar } from './components/EnterpriseSidebar';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { PromotionBuilderView } from './components/PromotionBuilderView';
import { CommercialInsightsView } from './components/CommercialInsightsView';
import { RangeFirstLockScreen } from './components/RangeFirstLockScreen';
import { StoreScanPoBuilderView } from './components/StoreScanPoBuilderView';

export default function App() {
  // Initialize analytics telemetry (GA4, Firebase Analytics, Microsoft Clarity)
  useEffect(() => {
    initAnalytics();
  }, []);

  // 1. Auth & User Profile State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [paywallFeatureTriggered, setPaywallFeatureTriggered] = useState<string>('Premium Feature');
  const [authIntendedMessage, setAuthIntendedMessage] = useState<string | undefined>(undefined);
  const [pendingTabAfterAuth, setPendingTabAfterAuth] = useState<any>(null);

  // Full-Page Friendly Checkout State
  const [checkoutContext, setCheckoutContext] = useState<CheckoutContext>({
    isOpen: false,
    exportId: '',
    itemName: '',
    priceAud: 19,
    planType: 'single_export',
    billingCycle: 'monthly',
    excludesGst: false,
    returnTab: 'overview'
  });

  const [isEnterpriseQuoteOpen, setIsEnterpriseQuoteOpen] = useState(false);
  const [preloadedPromoConfig, setPreloadedPromoConfig] = useState<{
    sku?: string;
    weekNumber?: number;
    discountPercent?: number;
    triggeredAt?: number;
  } | null>(null);

  const handleOpenPromotionBuilderPreloaded = (config: { sku: string; weekNumber?: number; discountPercent?: number }) => {
    setPreloadedPromoConfig({ ...config, triggeredAt: Date.now() });
    setActiveTab('promotion-builder');
    logActivity('Promotion', 'Insight Action Triggered', `Opened Promotion Builder preloaded for SKU ${config.sku}, Week ${config.weekNumber || 1}, Discount ${config.discountPercent || 25}%.`);
    showToast(`Pre-loaded SKU ${config.sku} and suggested modification into Promotion Builder.`, 'success');
  };

  // 2. Core Operational State & Multi-Catalogue Ranges
  const [catalogs, setCatalogs] = useState<SkuCatalog[]>(() => {
    try {
      const saved = localStorage.getItem('rangecraft_user_catalogs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any) => ({
            ...c,
            products: sanitizeProducts(c.products || [])
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load catalogs from localStorage:', e);
    }
    return INITIAL_CATALOGS.map(c => ({
      ...c,
      products: sanitizeProducts(c.products || [])
    }));
  });

  const [activeCatalogId, setActiveCatalogId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('rangecraft_active_catalog_id');
      if (savedId) return savedId;
    } catch (e) {}
    return INITIAL_CATALOGS[0]?.id || 'cat-default-range';
  });

  // Get active catalog products
  const activeCatalog = useMemo(() => {
    return catalogs.find(c => c.id === activeCatalogId) || catalogs[0] || INITIAL_CATALOGS[0] || null;
  }, [catalogs, activeCatalogId]);

  const [products, setProducts] = useState<Product[]>(() => {
    const raw = activeCatalog?.products || INITIAL_PRODUCTS;
    return sanitizeProducts(raw);
  });

  const [promotions, setPromotions] = useState<WeekPromotion[]>(() => {
    return generateDefault52WeekPlan(activeCatalog?.products || INITIAL_PRODUCTS);
  });
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const parts = hash.split('/');
      const tab = parts[0];
      const validTabs: AppTab[] = [
        'overview',
        'dashboard',
        'promotion-builder',
        'commercial-insights',
        'directory',
        'wholesale',
        'calendar',
        'week-studio',
        'catalog',
        'analytics',
        'market-intel',
        'clashes',
        'executive-briefing',
        'activity-log',
        'crm',
        'billing',
        'commercial-journey',
        'deletion-engine',
        'breakeven-basket',
        'scan-order'
      ];
      if (validTabs.includes(tab as AppTab)) {
        return tab as AppTab;
      }
    }
    return 'overview';
  });

  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const parts = hash.split('/');
      if (parts[0] === 'week-studio' && parts[1]) {
        const wNum = parseInt(parts[1].replace('w', ''), 10);
        if (!isNaN(wNum) && wNum >= 1 && wNum <= 52) return wNum;
      }
    }
    return 4;
  });

  // Sync activeTab & selectedWeekNum to URL hash and push Google Analytics page views
  useEffect(() => {
    const hash = activeTab === 'week-studio' ? `#/${activeTab}/w${selectedWeekNum}` : `#/${activeTab}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', GA4_MEASUREMENT_ID, {
        page_path: hash,
        page_title: `RangeCraft — ${activeTab.toUpperCase()}`
      });
      (window as any).gtag('event', 'page_view', {
        page_path: hash,
        page_title: `RangeCraft — ${activeTab.toUpperCase()}`
      });
    }
    trackModuleAccess(activeTab, user?.subscriptionTier || 'free_trial');
  }, [activeTab, selectedWeekNum, user?.subscriptionTier]);

  useEffect(() => {
    if (user) {
      setUserAnalyticsContext(user.uid, user.subscriptionTier, user.companyName);
    }
  }, [user]);

  // Listen to hashchange for browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const parts = hash.split('/');
      const tab = parts[0];
      const validTabs: AppTab[] = [
        'overview',
        'dashboard',
        'promotion-builder',
        'commercial-insights',
        'directory',
        'wholesale',
        'calendar',
        'week-studio',
        'catalog',
        'analytics',
        'market-intel',
        'clashes',
        'executive-briefing',
        'activity-log',
        'crm',
        'billing',
        'commercial-journey',
        'deletion-engine',
        'breakeven-basket',
        'scan-order'
      ];
      if (validTabs.includes(tab as AppTab)) {
        const resolvedTab: AppTab = tab === 'overview' && user ? 'dashboard' : (tab as AppTab);
        if (resolvedTab !== activeTab) {
          setActiveTab(resolvedTab);
        }
      }
      if (parts[0] === 'week-studio' && parts[1]) {
        const wNum = parseInt(parts[1].replace('w', ''), 10);
        if (!isNaN(wNum) && wNum >= 1 && wNum <= 52 && wNum !== selectedWeekNum) {
          setSelectedWeekNum(wNum);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, selectedWeekNum, user]);
  
  // CRM & Trading Terms State
  const [accounts, setAccounts] = useState<CrmAccount[]>(INITIAL_CRM_ACCOUNTS);
  const [deals, setDeals] = useState<CrmDeal[]>(INITIAL_CRM_DEALS);
  const [activities, setActivities] = useState<CrmActivity[]>(INITIAL_CRM_ACTIVITIES);
  const [tradingTerms, setTradingTerms] = useState<TradingTerms[]>([]);
  const [businessPersona, setBusinessPersona] = useState<BusinessPersona>('brand_sales_rep');

  // Wholesale Carton Orders State (starts completely blank unless user has persisted orders)
  const [wholesaleOrders, setWholesaleOrders] = useState<WholesaleOrder[]>(() => {
    try {
      const saved = localStorage.getItem('rangecraft_wholesale_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rangecraft_wholesale_orders', JSON.stringify(wholesaleOrders));
    } catch (e) {}
  }, [wholesaleOrders]);
  
  // Admin & Creator Analytics & Payout State
  const [isAdminAnalyticsOpen, setIsAdminAnalyticsOpen] = useState(false);
  const [isTradingTermsModalOpen, setIsTradingTermsModalOpen] = useState(false);
  const [activeTradingTermsEditing, setActiveTradingTermsEditing] = useState<TradingTerms | null>(null);
  const [preselectedAccountForTerms, setPreselectedAccountForTerms] = useState<CrmAccount | undefined>(undefined);
  const [creatorAnalytics, setCreatorAnalytics] = useState<AdminAnalyticsSummary>(ADMIN_ANALYTICS_SUMMARY_MOCK);
  const [creatorTransactions, setCreatorTransactions] = useState<CreatorTransaction[]>(INITIAL_CREATOR_TRANSACTIONS);
  const [creatorPayouts, setCreatorPayouts] = useState<CreatorPayoutRecord[]>(INITIAL_CREATOR_PAYOUTS);
  const [bankAccount, setBankAccount] = useState<BankAccountConfig>(INITIAL_BANK_ACCOUNT);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImportTutorialOpen, setIsImportTutorialOpen] = useState(false);
  const [isInventoryManagerOpen, setIsInventoryManagerOpen] = useState(false);
  const [isEditRangeOpen, setIsEditRangeOpen] = useState(false);
  const [statusToast, setStatusToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Save updated product range from ProductRangeEditorModal (recalculates 52-week plan on pricing/spec changes)
  const handleSaveRangeProducts = (updatedProducts: Product[]) => {
    const sanitized = sanitizeProducts(updatedProducts);
    setProducts(sanitized);
    setCatalogs(prev => prev.map(c => c.id === activeCatalogId ? { ...c, products: sanitized, updatedAt: new Date().toISOString() } : c));
    
    // Regenerate and audit promotions with new product pricing/costs
    const updatedPlan = generateDefault52WeekPlan(sanitized);
    const audited = auditClashes(updatedPlan, sanitized);
    setPromotions(audited);
    
    logActivity('Catalog', 'Updated Range Specifications', `Saved changes to ${sanitized.length} products across active range.`);
    showToast(`Saved specifications for ${sanitized.length} SKUs and recalculated 52-week plan!`, 'success');
  };

  // Save inventory-only updates across products without overwriting custom 52-week promotions
  const handleUpdateProductsInventory = (updatedProducts: Product[]) => {
    const sanitized = sanitizeProducts(updatedProducts);
    setProducts(sanitized);
    setCatalogs(prev => prev.map(c => c.id === activeCatalogId ? { ...c, products: sanitized, updatedAt: new Date().toISOString() } : c));
    setPromotions(prev => auditClashes(prev, sanitized));
    logActivity('Catalog', 'Updated SKU Inventory', `Updated inventory levels across ${sanitized.length} SKUs.`);
    showToast(`Saved SKU inventory levels for ${sanitized.length} SKUs.`, 'success');
  };

  // Save single inline product edit (e.g. inventory stock edit/clear) without resetting 52-week promotions
  const handleUpdateSingleProduct = (updatedProduct: Product) => {
    const nextRaw = products.map(p => (p.sku === updatedProduct.sku ? updatedProduct : p));
    const sanitized = sanitizeProducts(nextRaw);
    setProducts(sanitized);
    setCatalogs(prev => prev.map(c => c.id === activeCatalogId ? { ...c, products: sanitized, updatedAt: new Date().toISOString() } : c));
    setPromotions(prev => auditClashes(prev, sanitized));
    logActivity('Catalog', 'Updated SKU', `Updated ${updatedProduct.sku} (${updatedProduct.name}).`);
  };

  // Activity Log State
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      category: 'System',
      action: 'Platform Initialized',
      description: 'Platform initialized with empty SKU range. Add products manually or import CSV range to begin.',
      userEmail: 'system@rangecraft.au'
    }
  ]);

  const logActivity = (category: ActivityLogEntry['category'], action: string, description: string) => {
    const entry: ActivityLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      category,
      action,
      description,
      userEmail: user?.email || 'Guest User'
    };
    setActivityLogs(prev => [entry, ...prev]);
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(firebaseUser);
          setUser(profile);
          setActiveTab(prev => (prev === 'overview' ? 'dashboard' : prev));
          // Try loading cloud saved promotional plan
          const cloudPlan = await loadUserPlanFromCloud(firebaseUser.uid);
          if (cloudPlan && cloudPlan.length > 0) {
            setPromotions(cloudPlan);
          }
          // Try loading cloud saved SKU catalogs
          const cloudCatalogs = await loadUserCatalogsFromCloud(firebaseUser.uid);
          if (cloudCatalogs && cloudCatalogs.length > 0) {
            setCatalogs(cloudCatalogs);
            const active = cloudCatalogs.find(c => c.id === activeCatalogId) || cloudCatalogs[0];
            if (active) {
              setActiveCatalogId(active.id);
              setProducts(active.products || []);
            }
          }
        } catch (err) {
          console.error('Error syncing user profile on load:', err);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Always route logged-in users out of public landing page into Executive Dashboard
  useEffect(() => {
    if (user && hasUsedFreeTrial(user)) {
      markTrialUsedLocal();
    }
    if (user && activeTab === 'overview') {
      setActiveTab('dashboard');
    }
  }, [user, activeTab]);

  // 2. Stripe Checkout Post-Redirect Verification Handler
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const exportUnlocked = urlParams.get('export_unlocked');
    const plan = urlParams.get('plan');
    const canceled = urlParams.get('canceled');

    if (canceled === 'true') {
      showToast('Stripe checkout was cancelled. No charge was made.', 'info');
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      return;
    }

    if (sessionId) {
      fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}&plan=${encodeURIComponent(plan || '')}&export_unlocked=${encodeURIComponent(exportUnlocked || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data.isPaid || data.valid) {
            const isStarter = data.planType === 'starter_subscription' || plan === 'starter_subscription';
            const isPro = data.planType === 'pro_subscription' || data.planType === 'subscription_monthly' || data.planType === 'subscription_annual' || plan === 'pro_subscription';
            const isAiTopUp = data.planType === 'ai_topup' || plan === 'ai_topup';
            const targetExport = isAiTopUp ? 'ai_topup_50' : (data.exportId || exportUnlocked || 'master_52week_plan');
            const itemTitle = data.itemName || (isAiTopUp ? '+50 AI Scenario Top-Up' : isStarter ? 'Starter Plan Subscription' : isPro ? 'Growth Plan Subscription' : 'Commercial Export Package');
            const amountAud = data.amountPaidAud || (isAiTopUp ? 29 : isStarter ? 59 : isPro ? 149 : 19);

            handleCheckoutSuccess(targetExport, isPro ? 'pro_planner' : isStarter ? 'starter_plan' : undefined);
            
            handleLogCreatorTransaction(
              itemTitle,
              isAiTopUp ? 'ai_topup' : (isPro || isStarter) ? 'subscription_monthly' : 'export_single',
              amountAud,
              'credit_card',
              data.invoiceNumber || `INV-AU-${sessionId.slice(-6).toUpperCase()}`
            );

            trackPurchaseSuccess(targetExport, itemTitle, amountAud, data.invoiceNumber || sessionId, 'stripe_card');
            if (isPro || isStarter) {
              trackSubscriptionUpgrade(data.planType || (isPro ? 'pro_subscription' : 'starter_subscription'), amountAud, isPro ? 'pro_planner' : 'starter_plan');
            }

            showToast(`Stripe Payment Verified! ${isAiTopUp ? '+50 AI Scenarios credited' : isStarter ? 'Starter Plan active' : isPro ? 'Growth Plan active with unlimited exports' : 'Commercial deliverable unlocked'} (Invoice #${data.invoiceNumber || 'AU-2026'}).`, 'success');
          }
        })
        .catch(err => {
          console.warn('Stripe verification check:', err);
        })
        .finally(() => {
          // Clean the query parameters cleanly without refreshing
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        });
    }
  }, []);

  // Save changes to cloud & localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rangecraft_user_catalogs', JSON.stringify(catalogs));
      localStorage.setItem('rangecraft_active_catalog_id', activeCatalogId);
    } catch (e) {}

    if (user && auth.currentUser && auth.currentUser.uid === user.uid && catalogs.length > 0) {
      setIsSaving(true);
      saveUserCatalogsToCloud(user.uid, catalogs)
        .then(() => {
          setIsSaving(false);
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        })
        .catch(() => setIsSaving(false));
    } else {
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [catalogs, activeCatalogId, user?.uid]);

  useEffect(() => {
    if (user && auth.currentUser && auth.currentUser.uid === user.uid && promotions.length > 0) {
      setIsSaving(true);
      saveUserPlanToCloud(user.uid, promotions)
        .then(() => {
          setIsSaving(false);
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        })
        .catch(() => setIsSaving(false));
    } else {
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [promotions, user?.uid]);
  
  // Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('rangecraft_theme') as ThemeMode;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);
    root.classList.toggle('dark', currentTheme === 'dark');
  }, [currentTheme]);

  const handleSelectTheme = (theme: ThemeMode) => {
    setCurrentTheme(theme);
    logActivity('System', 'Changed UI Theme', `Switched interface color scheme to ${theme}.`);
    try {
      localStorage.setItem('rangecraft_theme', theme);
    } catch (e) {
      // ignore
    }
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setStatusToast({ message, type });
    setTimeout(() => setStatusToast(null), 4500);
  };

  // 2. Computed KPIs & Clash Auditing
  const kpis = useMemo(() => {
    return calculateStrategyKPIs(promotions, products);
  }, [promotions, products]);

  // Selected week promotion
  const selectedPromotion = useMemo(() => {
    return promotions.find(p => p.weekNumber === selectedWeekNum) || promotions[0];
  }, [promotions, selectedWeekNum]);

  // Auth check helper for accessing features & tabs
  const handleProtectedAction = (
    action: () => void, 
    intendedMessage?: string,
    targetTab?: any
  ) => {
    if (!user) {
      setAuthIntendedMessage(intendedMessage || 'Please sign in or create a free account to access this category planning feature.');
      if (targetTab) setPendingTabAfterAuth(targetTab);
      setIsAuthModalOpen(true);
      return false;
    }
    action();
    return true;
  };

  // Paywall check helper for premium paid features
  const handlePaidFeatureAction = (
    action: () => void,
    featureName: string,
    requiredTier: SubscriptionTier = 'pro_planner'
  ) => {
    if (!user) {
      setAuthIntendedMessage(`Create an account to unlock ${featureName} and commercial planning tools.`);
      setIsAuthModalOpen(true);
      return false;
    }

    const tierRank: Record<SubscriptionTier, number> = {
      free_trial: 0,
      starter_plan: 1,
      pro_planner: 2,
      enterprise_tier: 3,
    };

    if ((tierRank[user.subscriptionTier] ?? 0) < (tierRank[requiredTier] ?? 2)) {
      setPaywallFeatureTriggered(featureName);
      setIsPricingModalOpen(true);
      return false;
    }

    action();
    return true;
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setActiveTab('overview');
      logActivity('Auth', 'Signed Out', 'User signed out of their account session.');
      showToast('Signed out of your account.', 'info');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleTabNavigation = (tab: AppTab) => {
    if (tab === 'overview') {
      setActiveTab(user ? 'dashboard' : 'overview');
      return;
    }

    if (
      tab === 'dashboard' ||
      tab === 'promotion-builder' ||
      tab === 'commercial-insights' ||
      tab === 'directory' ||
      tab === 'wholesale' ||
      tab === 'scan-order'
    ) {
      setActiveTab(tab);
      return;
    }

    // Require account login to access operational workspace tabs
    if (!user) {
      setAuthIntendedMessage(`Sign in or create an account to access the ${tab === 'calendar' ? '52-Week Master Grid' : tab === 'catalog' ? 'Product Catalog' : tab === 'analytics' ? 'Trade Spend Analytics' : 'Workspace'}.`);
      setPendingTabAfterAuth(tab);
      setIsAuthModalOpen(true);
      return;
    }

    // Executive briefing requires paid Starter/Pro/Enterprise or unlocked JBP export
    if (tab === 'executive-briefing' && user.subscriptionTier === 'free_trial') {
      setPaywallFeatureTriggered('Executive JBP Deck & Export Suite');
      setIsPricingModalOpen(true);
      return;
    }

    setActiveTab(tab);
    logActivity('System', 'Tab Navigation', `Navigated to view: ${tab}`);
  };

  // 3. Handlers
  const handleUpdatePromotion = (updatedPromo: WeekPromotion) => {
    const newPromotions = promotions.map(p => 
      p.weekNumber === updatedPromo.weekNumber ? updatedPromo : p
    );
    // Re-audit clashes across the calendar
    const audited = auditClashes(newPromotions, products);
    setPromotions(audited);
    const mechanicDesc = updatedPromo.mechanic?.label || `${updatedPromo.mechanic?.discountValue || 20}% Off`;
    const totalSkus = 1 + (updatedPromo.secondarySkus?.length || 0);
    logActivity('Promotion', 'Updated Week Mechanics', `Updated Week ${updatedPromo.weekNumber} (${updatedPromo.campaignTheme}): ${totalSkus} ${totalSkus === 1 ? 'SKU' : 'SKUs'} (Hero ${updatedPromo.heroSku}), Mechanic: ${mechanicDesc}.`);
    showToast(`Saved Week ${updatedPromo.weekNumber} (${totalSkus} ${totalSkus === 1 ? 'SKU' : 'SKUs'}) & recalculated 52-week plan.`, 'success');
  };

  const handleMovePromotion = (sourceWeekNum: number, targetWeekNum: number) => {
    setPromotions(prev => {
      const next = [...prev];
      const sourceIdx = next.findIndex(p => p.weekNumber === sourceWeekNum);
      const targetIdx = next.findIndex(p => p.weekNumber === targetWeekNum);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const sourcePromo = next[sourceIdx];
      const targetPromo = next[targetIdx];

      const tempTheme = sourcePromo.campaignTheme;
      const tempHeroSku = sourcePromo.heroSku;
      const tempSecondarySkus = sourcePromo.secondarySkus;
      const tempMechanic = sourcePromo.mechanic;
      const tempObjective = sourcePromo.strategicObjective;
      const tempPlacement = sourcePromo.cataloguePlacement;
      const tempChannels = sourcePromo.activeChannels;
      const tempNotes = sourcePromo.notes;
      const tempIsAi = sourcePromo.isAiGenerated;

      next[sourceIdx] = {
        ...sourcePromo,
        campaignTheme: targetPromo.campaignTheme,
        heroSku: targetPromo.heroSku,
        secondarySkus: targetPromo.secondarySkus,
        mechanic: targetPromo.mechanic,
        strategicObjective: targetPromo.strategicObjective,
        cataloguePlacement: targetPromo.cataloguePlacement,
        activeChannels: targetPromo.activeChannels,
        notes: targetPromo.notes,
        isAiGenerated: targetPromo.isAiGenerated,
      };

      next[targetIdx] = {
        ...targetPromo,
        campaignTheme: tempTheme,
        heroSku: tempHeroSku,
        secondarySkus: tempSecondarySkus,
        mechanic: tempMechanic,
        strategicObjective: tempObjective,
        cataloguePlacement: tempPlacement,
        activeChannels: tempChannels,
        notes: tempNotes,
        isAiGenerated: tempIsAi,
      };

      return auditClashes(next, products);
    });

    logActivity('Promotion', 'Drag-and-Drop Reslot', `Swapped promotional campaign between Week ${sourceWeekNum} and Week ${targetWeekNum} via drag-and-drop. Automatically re-audited Custom Rules spacing.`);
    showToast(`Successfully moved promotion to Week ${targetWeekNum} and re-audited Custom Rules.`, 'success');
  };

  const handleSelectWeek = (weekNum: number) => {
    setSelectedWeekNum(weekNum);
  };

  const handleOpenWeekStudio = (weekNum: number) => {
    handleProtectedAction(() => {
      setSelectedWeekNum(weekNum);
      setActiveTab('week-studio');
      logActivity('Promotion', 'Opened Week Studio', `Opened Week Studio inspection for Week ${weekNum}.`);
    }, 'Log in to edit individual promotional week mechanics and co-op scan rebates.');
  };

  const handleSelectCatalog = (catId: string) => {
    const target = catalogs.find(c => c.id === catId);
    if (!target) return;
    const sanitized = sanitizeProducts(target.products || []);
    setActiveCatalogId(catId);
    setProducts(sanitized);
    const newPlan = generateDefault52WeekPlan(sanitized);
    setPromotions(auditClashes(newPlan, sanitized));
    logActivity('Catalog', 'Switched Active Catalog', `Switched active catalog range to "${target.name}" (${sanitized.length} SKUs).`);
    showToast(`Switched active catalogue to "${target.name}".`, 'info');
  };

  const handleCreateCatalog = (newCat: SkuCatalog) => {
    handleProtectedAction(() => {
      setCatalogs(prev => [...prev, newCat]);
      setActiveCatalogId(newCat.id);
      setProducts(newCat.products);
      if (newCat.products.length > 0) {
        const newPlan = generateDefault52WeekPlan(newCat.products);
        setPromotions(auditClashes(newPlan, newCat.products));
      }
      logActivity('Catalog', 'Created Catalogue Range', `Created new range catalogue "${newCat.name}" with ${newCat.products.length} SKUs.`);
      showToast(`Created new catalogue "${newCat.name}".`, 'success');
    }, 'Log in to create and manage custom SKU catalogues.');
  };

  const handleUpdateCatalog = (updatedCat: SkuCatalog) => {
    handleProtectedAction(() => {
      setCatalogs(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
      if (updatedCat.id === activeCatalogId) {
        setProducts(updatedCat.products);
        const audited = auditClashes(promotions, updatedCat.products);
        setPromotions(audited);
      }
      logActivity('Catalog', 'Updated Catalogue', `Updated catalogue "${updatedCat.name}" settings and SKU items.`);
      showToast(`Saved changes to catalogue "${updatedCat.name}".`, 'success');
    }, 'Log in to manage SKU catalogues.');
  };

  const handleDeleteCatalog = (catId: string) => {
    handleProtectedAction(() => {
      const target = catalogs.find(c => c.id === catId);
      if (!target) return;
      if (catalogs.length <= 1) {
        showToast('You must have at least one catalogue range.', 'info');
        return;
      }
      const remaining = catalogs.filter(c => c.id !== catId);
      setCatalogs(remaining);
      if (activeCatalogId === catId) {
        const nextActive = remaining[0];
        setActiveCatalogId(nextActive.id);
        setProducts(nextActive.products);
        const newPlan = generateDefault52WeekPlan(nextActive.products);
        setPromotions(auditClashes(newPlan, nextActive.products));
      }
      logActivity('Catalog', 'Deleted Catalogue', `Deleted catalogue range "${target.name}".`);
      showToast(`Deleted catalogue "${target.name}".`, 'info');
    }, 'Log in to manage SKU catalogues.');
  };

  const handleDeleteProduct = (sku: string) => {
    const nextProducts = products.filter(p => p.sku !== sku);
    setProducts(nextProducts);
    setCatalogs(prev => prev.map(c => c.id === activeCatalogId ? { ...c, products: nextProducts, updatedAt: new Date().toISOString() } : c));
    const audited = auditClashes(promotions, nextProducts);
    setPromotions(audited);
    logActivity('Catalog', 'Deleted SKU', `Deleted SKU ${sku} from catalog.`);
    showToast(`Deleted SKU ${sku} from active catalogue.`, 'info');
  };

  const handleDeleteMultipleProducts = (skus: string[]) => {
    if (skus.length === 0) return;
    const nextProducts = products.filter(p => !skus.includes(p.sku));
    setProducts(nextProducts);
    setCatalogs(prev => prev.map(c => c.id === activeCatalogId ? { ...c, products: nextProducts, updatedAt: new Date().toISOString() } : c));
    const audited = auditClashes(promotions, nextProducts);
    setPromotions(audited);
    logActivity('Catalog', 'Bulk Deleted SKUs', `Deleted ${skus.length} SKUs (${skus.slice(0, 3).join(', ')}${skus.length > 3 ? '...' : ''}) from catalog.`);
    showToast(`Deleted ${skus.length} SKUs from active catalogue.`, 'info');
  };

  const handleClearAllProducts = () => {
    setProducts([]);
    setCatalogs(prev => prev.map(c => c.id === activeCatalogId ? { ...c, products: [], updatedAt: new Date().toISOString() } : c));
    setPromotions(auditClashes(promotions, []));
    logActivity('Catalog', 'Cleared All SKUs', `Cleared all SKUs from active catalogue.`);
    showToast(`Cleared all SKUs from active catalogue.`, 'info');
  };

  const handleAddProduct = (newProduct: Product) => {
    handleProtectedAction(() => {
      const limit = user?.maxSkusAllowed ?? 1;
      if (user && !user.unlimitedAi && user.subscriptionTier !== 'enterprise_tier' && products.length >= limit) {
        setPaywallFeatureTriggered(`SKU Range Limit (${limit} SKUs on your current plan)`);
        setIsPricingModalOpen(true);
        return;
      }
      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      setCatalogs(prev => prev.map(c => c.id === activeCatalogId ? { ...c, products: updatedProducts, updatedAt: new Date().toISOString() } : c));
      logActivity('Catalog', 'Added SKU', `Added new custom SKU ${newProduct.sku} (${newProduct.name}, RRP $${newProduct.rrp}) to catalog.`);
      showToast(`Added SKU ${newProduct.sku} to range catalog.`);
    }, 'Log in to add custom SKUs to your catalog.');
  };

  const handleImportOnly = (importedProducts: Product[]) => {
    handlePaidFeatureAction(() => {
      setProducts(importedProducts);
      setCatalogs(prev => prev.map(c => c.id === activeCatalogId ? { ...c, products: importedProducts, updatedAt: new Date().toISOString() } : c));
      const audited = auditClashes(promotions, importedProducts);
      setPromotions(audited);
      logActivity('Catalog', 'Imported CSV Catalog', `Successfully imported ${importedProducts.length} SKUs via CSV range upload.`);
      showToast(`Successfully imported ${importedProducts.length} SKUs into catalog.`, 'info');
    }, 'Custom CSV Catalog Import', 'starter_plan');
  };

  const handleImportAndGeneratePlan = (importedProducts: Product[]) => {
    handlePaidFeatureAction(() => {
      setProducts(importedProducts);
      setCatalogs(prev => prev.map(c => c.id === activeCatalogId ? { ...c, products: importedProducts, updatedAt: new Date().toISOString() } : c));
      const newPlan = generateDefault52WeekPlan(importedProducts);
      setPromotions(newPlan);
      setActiveTab('calendar');
      logActivity('Promotion', 'Imported Range & Generated Plan', `Imported ${importedProducts.length} SKUs and auto-generated 52-week promotional plan.`);
      showToast(`Imported ${importedProducts.length} SKUs & auto-generated compliant 52-week promotional plan!`, 'success');
    }, 'Instant 52-Week Generation from CSV', 'starter_plan');
  };

  const handleAutoGeneratePlanFromRange = () => {
    if (products.length === 0) {
      showToast('Upload or add at least one product SKU first.', 'info');
      setActiveTab('catalog');
      return;
    }
    handlePaidFeatureAction(() => {
      const newPlan = generateDefault52WeekPlan(products);
      setPromotions(newPlan);
      setActiveTab('calendar');
      logActivity('Promotion', 'Auto-Generated 52-Week Plan', `Regenerated 52-week promotional plan using ${products.length} current catalog SKUs.`);
      showToast(`Regenerated 52-week calendar using ${products.length} current catalog SKUs.`, 'success');
    }, 'Automated Portfolio Plan Generator', 'starter_plan');
  };

  const handleAutoFixClashes = () => {
    if (products.length === 0) {
      showToast('Upload or add at least one product SKU first.', 'info');
      setActiveTab('catalog');
      return;
    }
    handlePaidFeatureAction(() => {
      const result = autoReslotAndFixClashes(promotions, products);
      setPromotions(result.repairedPromotions);
      logActivity('Compliance', 'Auto-Reslotted Custom Rules', `Ran 1-click Custom Rules auto-reslot algorithm. Resolved ${result.fixedClashesCount} potential clashes.`);
      if (result.fixedClashesCount > 0) {
        showToast(
          `Successfully auto-reslotted calendar! Resolved ${result.fixedClashesCount} clash${result.fixedClashesCount > 1 ? 'es' : ''} (100% aligned with Custom 4-Week Hiatus & category rules).`,
          'success'
        );
      } else {
        showToast(`Calendar auto-reslotted: 100% aligned with Custom 4-Week Hiatus and zero clashes.`, 'success');
      }
    }, '1-Click Auto-Reslot Algorithm (Custom Rules)');
  };

  const handleOpenCheckoutPage = (opts: {
    exportId: string;
    itemName: string;
    priceAud: number;
    planType: CheckoutPlanType;
    billingCycle?: 'monthly' | 'annual';
    excludesGst?: boolean;
  }) => {
    setCheckoutContext({
      isOpen: true,
      exportId: opts.exportId,
      itemName: opts.itemName,
      priceAud: opts.priceAud,
      planType: opts.planType,
      billingCycle: opts.billingCycle || 'monthly',
      excludesGst: false,
      returnTab: activeTab
    });
  };

  const handleOpenMicroCheckout = (
    exportId: string, 
    itemName: string, 
    priceAud = 19, 
    planType: CheckoutPlanType = 'single_export'
  ) => {
    handleOpenCheckoutPage({
      exportId,
      itemName,
      priceAud,
      planType,
      billingCycle: 'monthly',
      excludesGst: false
    });
  };

  const handleCheckoutSuccess = (exportId: string, tier?: SubscriptionTier, syncedProfile?: UserProfile) => {
    if (exportId === 'ai_topup_50') {
      const base = syncedProfile || user;
      const updatedUser: UserProfile = syncedProfile
        ? syncedProfile
        : {
            ...(base || {
              uid: 'guest_user_' + Date.now(),
              email: 'guest@retailtrade.com.au',
              displayName: 'RangeCraft User',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              subscriptionTier: 'free_trial',
              subscriptionStatus: 'active',
              aiGenerationsRemaining: 1,
              aiMonthlyAllowance: 1,
              aiTopUpCredits: 50,
              unlimitedAi: false,
              canExportPdf: false,
              canAutoReslot: false,
              maxSkusAllowed: 1,
              unlockedExports: []
            }),
            aiTopUpCredits: (base?.aiTopUpCredits || 0) + 50
          };
      setUser(updatedUser);
      if (base && !syncedProfile) {
        purchaseAiTopUp(base.uid, 50, base).then(setUser).catch(() => {});
      }
      logActivity('Subscription', 'Purchased +50 AI Top-Up', 'Added 50 non-expiring AI scenario credits to workspace.');
      showToast('+50 AI Scenario credits added to your account!', 'success');
      return;
    }

    if (tier === 'starter_plan' || tier === 'pro_planner' || tier === 'enterprise_tier') {
      const isEnterprise = tier === 'enterprise_tier';
      const isStarter = tier === 'starter_plan';
      const base = syncedProfile || user;
      const updatedUser: UserProfile = {
        ...(base || {
          uid: 'guest_pro_' + Date.now(),
          email: 'pro.subscriber@retailtrade.com.au',
          displayName: isStarter ? 'Starter Plan Subscriber' : isEnterprise ? 'Enterprise Partner' : 'Growth Plan Subscriber',
          subscriptionStatus: 'active',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          aiGenerationsRemaining: isEnterprise ? 999999 : isStarter ? 30 : 150,
          aiMonthlyAllowance: isEnterprise ? 999999 : isStarter ? 30 : 150,
          aiTopUpCredits: 0,
          unlimitedAi: isEnterprise,
          canExportPdf: true,
          canAutoReslot: !isStarter,
          maxSkusAllowed: isEnterprise ? 5000 : isStarter ? 150 : 1000,
          unlockedExports: []
        }),
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        trialUsed: true,
        unlimitedAi: syncedProfile?.unlimitedAi ?? isEnterprise,
        canExportPdf: true,
        canAutoReslot: syncedProfile?.canAutoReslot ?? !isStarter,
        maxSkusAllowed: syncedProfile?.maxSkusAllowed ?? (isEnterprise ? 5000 : isStarter ? 150 : 1000),
        aiGenerationsRemaining: syncedProfile?.aiGenerationsRemaining ?? (isEnterprise ? 999999 : isStarter ? 30 : 150),
        aiMonthlyAllowance: syncedProfile?.aiMonthlyAllowance ?? (isEnterprise ? 999999 : isStarter ? 30 : 150),
        unlockedExports: Array.from(new Set([...(base?.unlockedExports || []), exportId, 'q3_q4_calendar', 'sku_deletion_audit', 'executive_pack_pdf', 'commercial_model_xlsx']))
      };
      markTrialUsedLocal();
      setUser(updatedUser);
      syncUserProfile(updatedUser);
      const planLabel = isEnterprise ? 'Enterprise Portfolio' : isStarter ? 'Starter Plan' : 'Growth Plan';
      logActivity('Subscription', `Upgraded to ${planLabel}`, `Completed checkout for ${tier}.`);
      showToast(`Welcome to ${planLabel}! Your workspace limits and exports are unlocked.`, 'success');
    } else {
      const base = syncedProfile || user;
      const updatedUser: UserProfile = {
        ...(base || {
          uid: 'guest_user_' + Date.now(),
          email: 'guest.purchaser@retailtrade.com.au',
          displayName: 'Verified Purchaser',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          subscriptionTier: 'free_trial',
          subscriptionStatus: 'active',
          aiGenerationsRemaining: 1,
          aiMonthlyAllowance: 1,
          aiTopUpCredits: 0,
          unlimitedAi: false,
          canExportPdf: true,
          canAutoReslot: false,
          maxSkusAllowed: 1,
          unlockedExports: []
        }),
        canExportPdf: true,
        unlockedExports: Array.from(new Set([...(base?.unlockedExports || []), exportId]))
      };
      setUser(updatedUser);
      syncUserProfile(updatedUser);
      logActivity('Export', 'Unlocked Service / Deliverable', `Purchased one-time unlock or advisory booking for ${exportId}.`);
      showToast(`Purchase confirmed! Access and invoice are ready.`, 'success');
    }
  };

  const handleOpenAiStrategist = () => {
    if (products.length === 0) {
      showToast('Upload or add at least one product SKU first.', 'info');
      setActiveTab('catalog');
      return;
    }
    handleProtectedAction(() => {
      const totalAiAvailable = (user?.aiGenerationsRemaining || 0) + (user?.aiTopUpCredits || 0);
      if (user && !user.unlimitedAi && totalAiAvailable <= 0) {
        setPaywallFeatureTriggered('AI Scenario Strategist Credits');
        setIsPricingModalOpen(true);
        return;
      }
      setIsAiModalOpen(true);
      logActivity('AI Strategy', 'Opened Gemini AI Strategist', 'Opened AI strategy copilot simulation modal.');
    }, 'Sign in to run AI Promotional Strategy simulations.');
  };

  const handleApplyAiStrategy = async (aiPromotions: WeekPromotion[]) => {
    const audited = auditClashes(aiPromotions, products);
    setPromotions(audited);
    if (user && !user.unlimitedAi) {
      try {
        const res = await consumeAiQuotaWithProfile(user.uid, user);
        if (hasUsedFreeTrial(res.updatedProfile)) {
          markTrialUsedLocal();
        }
        setUser(res.updatedProfile);
      } catch (err) {
        console.warn('consumeAiQuotaWithProfile error:', err);
      }
    }
    logActivity('AI Strategy', 'Deployed AI Scenario Plan', 'Successfully deployed AI optimized promotional schedule across 52-week calendar.');
    showToast(`AI Promotional Scenario successfully deployed.`);
  };

  const handleOpenTradingTermsModal = (terms?: TradingTerms | null, targetAccount?: CrmAccount) => {
    setActiveTradingTermsEditing(terms || null);
    setPreselectedAccountForTerms(targetAccount);
    setIsTradingTermsModalOpen(true);
  };

  const handleSaveTradingTerms = (savedTerms: TradingTerms) => {
    setTradingTerms(prev => {
      const idx = prev.findIndex(t => t.id === savedTerms.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedTerms;
        return next;
      } else {
        return [savedTerms, ...prev];
      }
    });
    logActivity('CRM', 'Updated Trading Terms', `Configured terms for ${savedTerms.targetAccountName} (${savedTerms.baseRatePercent}% scan, $${savedTerms.overAndAboveSpendAud.toLocaleString()} O&A spend).`);
    showToast(`Saved trading terms agreement for ${savedTerms.targetAccountName}!`, 'success');
  };

  const handleLogCreatorTransaction = (
    itemTitleOrTx: string | Omit<CreatorTransaction, 'id' | 'timestamp'>,
    itemType?: any,
    amountAud?: number,
    paymentMethod: 'paypal' | 'credit_card' | 'bank_transfer' = 'paypal',
    paypalTxnId?: string
  ) => {
    let created: CreatorTransaction;
    if (typeof itemTitleOrTx === 'string') {
      created = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        userName: user?.displayName || 'Active FMCG Account',
        userEmail: user?.email || 'sales@fmcgbrand.com.au',
        companyName: user?.companyName || 'Australian Food & Grocery Co',
        itemType: itemType || 'subscription_monthly',
        itemDescription: itemTitleOrTx,
        amountAud: amountAud || 149,
        paymentMethod: paymentMethod,
        paypalTransactionId: paypalTxnId,
        status: 'completed'
      };
    } else {
      created = {
        ...itemTitleOrTx,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        status: itemTitleOrTx.status || 'completed'
      };
    }

    setCreatorTransactions(prev => [created, ...prev]);

    // Update creator revenue analytics in real-time
    setCreatorAnalytics(prev => {
      const newGross = (prev.totalRevenueAud || 0) + created.amountAud;
      const newBal = (prev.pendingPayoutBalanceAud || 0) + created.amountAud;
      const isSub = created.itemType.startsWith('subscription');
      const newMonthly = (prev.mrrAud || 0) + (isSub ? created.amountAud : 0);
      return {
        ...prev,
        totalRevenueAud: newGross,
        pendingPayoutBalanceAud: newBal,
        mrrAud: newMonthly,
        arrAud: newMonthly * 12,
        paidSubscribers: (prev.paidSubscribers || 0) + (isSub ? 1 : 0)
      };
    });

    logActivity('Finance', 'Revenue Received', `Received $${created.amountAud.toLocaleString()} AUD payment via ${created.paymentMethod} from ${created.userName} (${created.itemDescription}).`);
  };

  const handleProcessCreatorPayout = (amount: number, note: string) => {
    if (amount <= 0 || amount > creatorAnalytics.pendingPayoutBalanceAud) {
      showToast('Invalid withdrawal amount.', 'info');
      return;
    }

    const payoutRecord: CreatorPayoutRecord = {
      id: `payout-${Date.now()}`,
      amountAud: amount,
      payoutMethod: 'bank_transfer',
      bankName: bankAccount.bankName,
      bsb: bankAccount.bsb,
      accountNumberMasked: `•••• ${bankAccount.accountNumber.slice(-4) || '4421'}`,
      accountName: bankAccount.accountHolder,
      reference: `PAYOUT-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Processing',
      timestamp: new Date().toISOString(),
      settledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    };

    setCreatorPayouts(prev => [payoutRecord, ...prev]);
    setCreatorAnalytics(prev => ({
      ...prev,
      pendingPayoutBalanceAud: Math.max(0, prev.pendingPayoutBalanceAud - amount),
      totalPaidOutAud: prev.totalPaidOutAud + amount
    }));

    logActivity('Finance', 'Bank Payout Requested', `Initiated bank transfer of $${amount.toLocaleString()} AUD to ${bankAccount.accountHolder} (${bankAccount.bsb} / ${bankAccount.accountNumber}). Ref: ${payoutRecord.reference}`);
    showToast(`Transfer of $${amount.toLocaleString()} AUD initiated to your bank account! Ref: ${payoutRecord.reference}`, 'success');
  };

  const handleUpdateBankAccount = (updatedBank: BankAccountConfig) => {
    setBankAccount(updatedBank);
    logActivity('Finance', 'Updated Bank Account', `Updated payout bank account to ${updatedBank.bankName} (${updatedBank.bsb} / ${updatedBank.accountNumber}).`);
    showToast('Bank payout account settings updated.', 'success');
  };

  const handleExportCsv = () => {
    handlePaidFeatureAction(() => {
      const csv = exportPromotionsToCsv(promotions, products);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `RangeCraft_AU_52Week_Plan_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      logActivity('Export', 'Exported 52-Week Plan CSV', 'Downloaded full 52-week promotional plan CSV export.');
      showToast(`Exported 52-week calendar CSV.`);
    }, 'Full 52-Week Master Plan CSV Export');
  };

  const isLight = currentTheme === 'light';

  return (
    <div 
      data-theme={currentTheme}
      className={`min-h-screen flex flex-col font-sans overflow-x-hidden transition-colors duration-200 ${
        isLight 
          ? 'bg-[#f8fafc] text-slate-900 selection:bg-blue-500 selection:text-white' 
          : 'bg-[#0b0f17] text-slate-100 selection:bg-blue-500 selection:text-white'
      }`}
    >
      {/* Toast Notification */}
      {statusToast && (
        <div className="no-print fixed bottom-20 md:bottom-6 inset-x-3 md:inset-x-auto md:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md md:max-w-sm">
          <div className={`w-2 h-2 rounded-full shrink-0 ${statusToast.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
          <span className="leading-snug">{statusToast.message}</span>
        </div>
      )}

      {checkoutContext.isOpen ? (
        <CheckoutPageView
          exportId={checkoutContext.exportId}
          itemName={checkoutContext.itemName}
          priceAud={checkoutContext.priceAud}
          initialPlanType={checkoutContext.planType}
          initialBillingCycle={checkoutContext.billingCycle}
          excludesGst={checkoutContext.excludesGst}
          returnTab={checkoutContext.returnTab}
          user={user}
          onBack={() => {
            const target =
              checkoutContext.returnTab && checkoutContext.returnTab !== 'overview'
                ? checkoutContext.returnTab
                : user
                ? 'dashboard'
                : 'overview';
            setCheckoutContext(prev => ({ ...prev, isOpen: false }));
            setActiveTab(target);
          }}
          onSuccess={(updatedProfile, completedExportId, tier) => {
            handleCheckoutSuccess(completedExportId, tier, updatedProfile);
          }}
          onLogTransaction={handleLogCreatorTransaction}
          products={products}
          promotions={promotions}
          kpis={kpis}
        />
      ) : (
        <>
      {/* Global Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabNavigation}
        kpis={kpis}
        user={user}
        onOpenAuthModal={() => {
          setAuthIntendedMessage(undefined);
          setIsAuthModalOpen(true);
        }}
        onOpenPricingModal={() => {
          setPaywallFeatureTriggered('Commercial Plans & Top-Ups');
          setIsPricingModalOpen(true);
        }}
        onSignOut={handleSignOut}
        onOpenAiOptimizer={handleOpenAiStrategist}
        onExportCsv={handleExportCsv}
        onOpenAddSku={() => handleProtectedAction(() => setActiveTab('catalog'))}
        onOpenUploadModal={() => handlePaidFeatureAction(() => setIsUploadModalOpen(true), 'Custom CSV SKU Range Import')}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        onOpenAdminDashboard={() => setIsAdminAnalyticsOpen(true)}
        onOpenInventoryManager={() => setIsInventoryManagerOpen(true)}
        onOpenEditRange={() => setIsEditRangeOpen(true)}
        selectedWeekNum={selectedWeekNum}
        currentTheme={currentTheme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onSelectTheme={handleSelectTheme}
        isSaving={isSaving}
        lastSyncedTime={lastSyncedTime}
        productsCount={products.length}
      />

      {/* Main Content Area */}
      {activeTab === 'overview' ? (
        <main className="flex-1 w-full">
          <LandingPageView
            kpis={kpis}
            currentTheme={currentTheme}
            user={user}
            onNavigateTab={handleTabNavigation}
            onOpenAiOptimizer={handleOpenAiStrategist}
            onOpenUploadModal={() => handlePaidFeatureAction(() => setIsUploadModalOpen(true), 'Custom CSV SKU Range Import')}
            onAutoFixClashes={handleAutoFixClashes}
            onOpenAuthModal={() => {
              setAuthIntendedMessage(undefined);
              setIsAuthModalOpen(true);
            }}
            onOpenPricingModal={() => {
              setPaywallFeatureTriggered('Starter, Growth & Enterprise Plans');
              setIsPricingModalOpen(true);
            }}
            onOpenEnterpriseQuote={() => setIsEnterpriseQuoteOpen(true)}
            onStartCheckout={(opts) => handleOpenCheckoutPage(opts)}
            onOpenAboutModal={() => setIsAboutModalOpen(true)}
          />
        </main>
      ) : (
        <div className="flex flex-1 min-h-[calc(100vh-4rem)] w-full">
          <EnterpriseSidebar
            activeTab={activeTab}
            onSelectTab={handleTabNavigation}
            user={user}
            onOpenAuthModal={() => {
              setAuthIntendedMessage(undefined);
              setIsAuthModalOpen(true);
            }}
            onOpenPricingModal={() => {
              setPaywallFeatureTriggered('Commercial Plans & Top-Ups');
              setIsPricingModalOpen(true);
            }}
            onLogout={handleSignOut}
            skusAtRiskCount={(() => {
              if (products.length === 0) return 0;
              const riskSet = new Set<string>();
              promotions.forEach((p) => {
                if ((p.projectedMarginPercent || 0) < 25 && p.heroSku) {
                  riskSet.add(p.heroSku);
                }
              });
              const demandMap = buildSkuPromoDemandMap(products, promotions);
              products.forEach((p) => {
                const inv = computeSkuInventoryForecast(p, demandMap.get(p.sku));
                if (inv.hasInventory && inv.stockStatus === 'CRITICAL') {
                  riskSet.add(p.sku);
                }
              });
              return riskSet.size;
            })()}
            clashCount={kpis.totalClashesCount}
            productsCount={products.length}
          />
          <main className="flex-1 min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 md:pb-8 space-y-5 sm:space-y-6">
          {products.length === 0 && !['overview', 'catalog', 'billing', 'scan-order'].includes(activeTab) ? (
            <RangeFirstLockScreen
              currentTheme={currentTheme}
              targetTab={activeTab}
              onGoToCatalog={() => setActiveTab('catalog')}
              onOpenUploadModal={() => handlePaidFeatureAction(() => setIsUploadModalOpen(true), 'Custom CSV SKU Range Import')}
              onReturnOverview={() => setActiveTab('overview')}
            />
          ) : (
            <>
          {activeTab === 'scan-order' && (
            <StoreScanPoBuilderView
              currentTheme={currentTheme}
              rangeProducts={products}
              showToast={showToast}
            />
          )}

          {activeTab === 'dashboard' && (
            <ExecutiveDashboardView
              user={user}
              products={products}
              promotions={promotions}
              kpis={kpis}
              currentTheme={currentTheme}
              onSelectTab={handleTabNavigation}
              onOpenWeekStudio={handleOpenWeekStudio}
              onOpenUploadModal={() => handlePaidFeatureAction(() => setIsUploadModalOpen(true), 'Custom CSV SKU Range Import')}
              onOpenAddProductModal={() => handleTabNavigation('catalog')}
              onAutoFormulatePlan={handleOpenAiStrategist}
              onOpenPromotionBuilderWithConfig={handleOpenPromotionBuilderPreloaded}
            />
          )}

          {activeTab === 'promotion-builder' && (
            <PromotionBuilderView
              products={products}
              promotions={promotions}
              selectedWeekNum={selectedWeekNum}
              currentTheme={currentTheme}
              onSavePromotion={handleUpdatePromotion}
              onUpdateProduct={handleUpdateSingleProduct}
              onSelectTab={handleTabNavigation}
              onOpenAddProductModal={() => handleTabNavigation('catalog')}
              showToast={showToast}
              preloadedConfig={preloadedPromoConfig}
            />
          )}

          {activeTab === 'commercial-insights' && (
            <CommercialInsightsView
              products={products}
              promotions={promotions}
              kpis={kpis}
              currentTheme={currentTheme}
              onSelectTab={handleTabNavigation}
              onOpenWeekStudio={handleOpenWeekStudio}
              onAutoFixClashes={handleAutoFixClashes}
              onOpenAiOptimizer={handleOpenAiStrategist}
              onOpenAddProductModal={() => handleTabNavigation('catalog')}
              onOpenPromotionBuilderWithConfig={handleOpenPromotionBuilderPreloaded}
            />
          )}

          {activeTab === 'directory' && (
            <WorkspaceDirectoryView
              currentTheme={currentTheme}
              userProfile={user}
              productsCount={products.length}
              activeWeeksCount={promotions.filter(p => p.mechanic && p.mechanic.discountValue > 0).length}
              clashesCount={kpis.totalClashesCount}
              blendedMarginPercent={kpis.blendedPromoMarginPercent}
              crmAccountsCount={accounts.length}
              wholesaleOrdersCount={wholesaleOrders.length}
              activityLogsCount={activityLogs.length}
              onNavigateTab={handleTabNavigation}
              onOpenImportModal={() => handlePaidFeatureAction(() => setIsUploadModalOpen(true), 'Custom CSV SKU Range Import')}
              onOpenAiOptimizer={handleOpenAiStrategist}
              onOpenThemeModal={() => setIsThemeModalOpen(true)}
              onStartFreeTrial={() => setIsPricingModalOpen(true)}
              onBuyAiTopUp={() =>
                handleOpenCheckoutPage({
                  exportId: 'ai_topup_50',
                  itemName: '+50 Scenario Top-Up Pack',
                  priceAud: 29,
                  planType: 'ai_topup',
                  excludesGst: false
                })
              }
              onOpenAuthModal={() => {
                setAuthIntendedMessage(undefined);
                setIsAuthModalOpen(true);
              }}
            />
          )}

          {activeTab === 'wholesale' && (
            <WholesaleOrdersHub
              orders={wholesaleOrders}
              products={products}
              currentTheme={currentTheme}
              onAddOrder={(order) => {
                setWholesaleOrders(prev => [order, ...prev]);
                logActivity('Finance', 'Created Wholesale PO', `Created wholesale carton order ${order.id} for ${order.accountName} ($${order.totalAud.toFixed(2)}).`);
              }}
              onUpdateStatus={(orderId, status) => {
                setWholesaleOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
                logActivity('Finance', 'Updated Wholesale PO Status', `Order ${orderId} marked as ${status}.`);
              }}
              showToast={(msg, type) => showToast(msg, type === 'warning' ? 'info' : type)}
            />
          )}
          {/* Top Onboarding & Product Range Setup Banner */}
          {products.length === 0 && activeTab === 'catalog' && (
            <OnboardingProductPrompt
              products={products}
              onOpenAddProductModal={() => handleProtectedAction(() => setActiveTab('catalog'), 'Log in to add custom products to your catalog.')}
              onOpenCsvImportModal={() => handlePaidFeatureAction(() => setIsUploadModalOpen(true), 'Custom CSV SKU Range Import')}
              onOpenAutoBuildModal={() => handlePaidFeatureAction(handleAutoGeneratePlanFromRange, 'Auto-Build 52-Week Promo Plan')}
              onLoadBenchmarkPortfolio={() => {
                setProducts(INITIAL_PRODUCTS);
                const newPlan = generateDefault52WeekPlan(INITIAL_PRODUCTS);
                setPromotions(auditClashes(newPlan, INITIAL_PRODUCTS));
                showToast('Loaded benchmark portfolio across multiple industries.', 'success');
              }}
              onNavigateTab={handleTabNavigation}
            />
          )}

          {activeTab === 'commercial-journey' && (
            <TradeStrategyFunnelView
              products={products}
              promotions={promotions}
              currentTheme={currentTheme}
              user={user}
              onUpdatePromotions={(newPromos) => {
                setPromotions(newPromos);
                logActivity('Promotion', 'Updated Scenario Plan', 'Applied new promotional plan scenario.');
              }}
              onImportProducts={(newProducts) => {
                setProducts(newProducts);
                setCatalogs(prev => prev.map(c => c.id === activeCatalogId ? { ...c, products: newProducts, updatedAt: new Date().toISOString() } : c));
                logActivity('Catalog', 'Loaded Products', `Imported ${newProducts.length} SKUs into active catalog.`);
              }}
              onAutoFixClashes={handleAutoFixClashes}
              onNavigateTab={handleTabNavigation}
              onOpenPricingModal={() => {
                setPaywallFeatureTriggered('Commercial Strategy Suite');
                setIsPricingModalOpen(true);
              }}
              onOpenAuthModal={() => {
                setAuthIntendedMessage(undefined);
                setIsAuthModalOpen(true);
              }}
              showToast={showToast}
            />
          )}

          {activeTab === 'calendar' && (
            <>
              <CalendarView
                promotions={promotions}
                products={products}
                selectedWeekNum={selectedWeekNum}
                onSelectWeek={handleSelectWeek}
                onOpenWeekStudio={handleOpenWeekStudio}
                onOpenAiOptimizer={handleOpenAiStrategist}
                onAutoFixClashes={handleAutoFixClashes}
                onMovePromotion={handleMovePromotion}
                userProfile={user}
                onUnlockExport={handleOpenMicroCheckout}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('52-Week Full Calendar Access (Q3-Q4)');
                  setIsPricingModalOpen(true);
                }}
                onOpenInventoryManager={() => setIsInventoryManagerOpen(true)}
                onOpenEditRange={() => setIsEditRangeOpen(true)}
                currentTheme={currentTheme}
                onSelectTheme={handleSelectTheme}
                activeTab={activeTab}
                onSelectTab={handleTabNavigation}
              />
              <StepNavigationFooter
                currentTab={activeTab}
                onNavigateTab={handleTabNavigation}
                currentTheme={currentTheme}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('Growth Plan Workflow');
                  setIsPricingModalOpen(true);
                }}
              />
            </>
          )}

          {activeTab === 'week-studio' && selectedPromotion && (
            <WeekDetailDrawer
              weekPromotion={selectedPromotion}
              products={products}
              allPromotions={promotions}
              onSavePromotion={handleUpdatePromotion}
              onUpdateProduct={handleUpdateSingleProduct}
              onNavigateWeek={handleSelectWeek}
              onClose={() => setActiveTab('calendar')}
              onMovePromotion={handleMovePromotion}
            />
          )}

          {activeTab === 'catalog' && (
            <>
              <ProductCatalogView
                products={products}
                promotions={promotions}
                catalogs={catalogs}
                activeCatalogId={activeCatalogId}
                onSelectCatalog={handleSelectCatalog}
                onCreateCatalog={handleCreateCatalog}
                onUpdateCatalog={handleUpdateCatalog}
                onDeleteCatalog={handleDeleteCatalog}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateSingleProduct}
                onImportProducts={handleImportOnly}
                onDeleteProduct={handleDeleteProduct}
                onDeleteMultipleProducts={handleDeleteMultipleProducts}
                onClearAllProducts={handleClearAllProducts}
                onOpenUploadModal={() => handlePaidFeatureAction(() => setIsUploadModalOpen(true), 'Custom CSV SKU Range Import')}
                onAutoGeneratePlanFromRange={handleAutoGeneratePlanFromRange}
                onUnlockExport={handleOpenMicroCheckout}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('SKU Deletion Engine & Rationalisation Audit');
                  setIsPricingModalOpen(true);
                }}
                userProfile={user}
                currentTheme={currentTheme}
                onSelectTab={handleTabNavigation}
              />
              <StepNavigationFooter
                currentTab={activeTab}
                onNavigateTab={handleTabNavigation}
                currentTheme={currentTheme}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('Growth Plan Workflow');
                  setIsPricingModalOpen(true);
                }}
              />
            </>
          )}

          {activeTab === 'deletion-engine' && (
            <SkuDeletionEngineView
              products={products}
              promotions={promotions}
              onDeleteProduct={handleDeleteProduct}
              onDeleteMultipleProducts={handleDeleteMultipleProducts}
              onImportProducts={handleImportOnly}
              userProfile={user}
              currentTheme={currentTheme}
              onUnlockExport={handleOpenMicroCheckout}
              onOpenPricingModal={() => {
                setPaywallFeatureTriggered('SKU Deletion Engine & Rationalisation Audit');
                setIsPricingModalOpen(true);
              }}
            />
          )}

          {activeTab === 'breakeven-basket' && (
            <BreakevenBasketPitchView
              products={products}
              promotions={promotions}
              userProfile={user}
              onUnlockExport={handleOpenMicroCheckout}
              onOpenWeekStudio={handleOpenWeekStudio}
            />
          )}

          {activeTab === 'crm' && (
            <CrmModule
              accounts={accounts}
              setAccounts={setAccounts}
              deals={deals}
              setDeals={setDeals}
              activities={activities}
              setActivities={setActivities}
              tradingTerms={tradingTerms}
              setTradingTerms={setTradingTerms}
              onOpenTradingTermsModal={handleOpenTradingTermsModal}
              products={products}
              currentTheme={currentTheme}
              businessPersona={businessPersona}
              setBusinessPersona={setBusinessPersona}
              showToast={showToast}
              logActivity={logActivity}
            />
          )}

          {activeTab === 'market-intel' && (
            <MarketIntelView
              products={products}
            />
          )}

          {activeTab === 'analytics' && (
            <>
              <AnalyticsView
                promotions={promotions}
                products={products}
                kpis={kpis}
                currentTheme={currentTheme}
                onSelectTab={handleTabNavigation}
              />
              <StepNavigationFooter
                currentTab={activeTab}
                onNavigateTab={handleTabNavigation}
                currentTheme={currentTheme}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('Growth Plan Workflow');
                  setIsPricingModalOpen(true);
                }}
              />
            </>
          )}

          {activeTab === 'clashes' && (
            <>
              <ClashAuditView
                promotions={promotions}
                products={products}
                onOpenWeekStudio={handleOpenWeekStudio}
                onAutoFixClashes={handleAutoFixClashes}
                currentTheme={currentTheme}
                onSelectTab={handleTabNavigation}
              />
              <StepNavigationFooter
                currentTab={activeTab}
                onNavigateTab={handleTabNavigation}
                currentTheme={currentTheme}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('Growth Plan Workflow');
                  setIsPricingModalOpen(true);
                }}
              />
            </>
          )}

          {activeTab === 'executive-briefing' && (
            <>
              <ExecutiveReportView
                promotions={promotions}
                products={products}
                kpis={kpis}
                onExportCsv={handleExportCsv}
                onOpenWeekStudio={handleOpenWeekStudio}
                currentTheme={currentTheme}
                userProfile={user}
                onUnlockExport={handleOpenMicroCheckout}
                onSelectTab={handleTabNavigation}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('Executive White-Label Export Packages');
                  setIsPricingModalOpen(true);
                }}
              />
              <StepNavigationFooter
                currentTab={activeTab}
                onNavigateTab={handleTabNavigation}
                currentTheme={currentTheme}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('Growth Plan Workflow');
                  setIsPricingModalOpen(true);
                }}
              />
            </>
          )}

          {activeTab === 'billing' && (
            <BillingInvoicesHub
              user={user}
              accounts={accounts}
              deals={deals}
              promotions={promotions}
              currentTheme={currentTheme}
              onUpgradeSuccess={setUser}
              onLogTransaction={handleLogCreatorTransaction}
              onStartCheckout={(opts) => handleOpenCheckoutPage(opts)}
              showToast={showToast}
            />
          )}

          {activeTab === 'activity-log' && (
            <ActivityLogView
              logs={activityLogs}
              onClearLogs={() => {
                setActivityLogs([]);
                logActivity('System', 'Cleared History', 'User cleared all activity logs.');
                showToast('Activity log cleared', 'info');
              }}
              currentTheme={currentTheme}
            />
          )}
            </>
          )}
          </main>
        </div>
      )}

      {/* Global Responsive Website Footer */}
      <Footer
        currentTheme={currentTheme}
        onNavigateTab={handleTabNavigation}
        onOpenPricingModal={() => {
          setPaywallFeatureTriggered('Growth Plan Features');
          setIsPricingModalOpen(true);
        }}
        onOpenUploadModal={() => handlePaidFeatureAction(() => setIsUploadModalOpen(true), 'Custom CSV SKU Range Import')}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenAuthModal={() => {
          setAuthIntendedMessage(undefined);
          setIsAuthModalOpen(true);
        }}
        onOpenAiOptimizer={handleOpenAiStrategist}
      />

      {/* SKU Range Upload & Portfolio Analysis Modal */}
      <SkuRangeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportAndGeneratePlan={handleImportAndGeneratePlan}
        onImportOnly={handleImportOnly}
        onOpenImportTutorial={() => {
          setIsUploadModalOpen(false);
          setIsImportTutorialOpen(true);
        }}
        currentTheme={currentTheme}
      />

      {/* AI Strategist Optimizer Modal */}
      <AIStrategistModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        products={products}
        currentPromotions={promotions}
        onApplyGeneratedPlan={handleApplyAiStrategy}
      />

      {/* Theme & Color Schemes Explorer Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* User Sign Up / Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthIntendedMessage(undefined);
          setPendingTabAfterAuth(null);
        }}
        onSuccess={(profile) => {
          setUser(profile);
          showToast(`Welcome ${profile.displayName}! Signed in successfully.`, 'success');
          if (pendingTabAfterAuth && pendingTabAfterAuth !== 'overview') {
            setActiveTab(pendingTabAfterAuth);
            setPendingTabAfterAuth(null);
          } else {
            setPendingTabAfterAuth(null);
            setActiveTab('dashboard');
          }
        }}
        currentTheme={currentTheme}
        intendedActionMessage={authIntendedMessage}
      />

      {/* Subscription Paywall & One-Off Services Modal */}
      <PricingPaywallModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        user={user}
        onUpgradeSuccess={(updatedProfile) => {
          setUser(updatedProfile);
          showToast(`Account updated to ${updatedProfile.subscriptionTier === 'starter_plan' ? 'Starter Plan' : updatedProfile.subscriptionTier === 'pro_planner' ? 'Growth Plan' : 'Enterprise Tier'}!`, 'success');
        }}
        onLogCreatorTransaction={handleLogCreatorTransaction}
        onOpenEnterpriseQuote={() => {
          setIsPricingModalOpen(false);
          setIsEnterpriseQuoteOpen(true);
        }}
        onStartCheckout={(opts) => {
          setIsPricingModalOpen(false);
          handleOpenCheckoutPage(opts);
        }}
        onRequireAuth={() => {
          setAuthIntendedMessage('Create an account to complete your subscription upgrade or strategy service booking.');
          setIsAuthModalOpen(true);
        }}
        currentTheme={currentTheme}
        featureTriggered={paywallFeatureTriggered}
      />

      {/* Enterprise Custom Quote Modal */}
      <EnterpriseQuoteModal
        isOpen={isEnterpriseQuoteOpen}
        onClose={() => setIsEnterpriseQuoteOpen(false)}
        currentTheme={currentTheme}
        defaultEmail={user?.email || ''}
        defaultCompany={user?.companyName || ''}
        onSubmitQuote={(payload) => {
          logActivity('CRM', 'Requested Enterprise Quote', `Enterprise Custom Quote requested for ${payload.companyName} (${payload.brandCount}, ${payload.estimatedSkus}).`);
          showToast(`Enterprise Custom Quote request logged for ${payload.companyName}. We'll reach out within 1 business day.`, 'success');
        }}
      />

      {/* Retail Trading Terms & Scan Rebates Builder Modal */}
      <TradingTermsModal
        isOpen={isTradingTermsModalOpen}
        onClose={() => {
          setIsTradingTermsModalOpen(false);
          setActiveTradingTermsEditing(null);
          setPreselectedAccountForTerms(undefined);
        }}
        terms={activeTradingTermsEditing}
        existingTerms={activeTradingTermsEditing}
        onSaveTerms={handleSaveTradingTerms}
        onSaveTradingTerms={handleSaveTradingTerms}
        products={products}
        accounts={accounts}
        preselectedAccount={preselectedAccountForTerms}
        currentTheme={currentTheme}
        showToast={showToast}
      />

      {/* Admin Creator Revenue Analytics & Bank Payout Center */}
      <AdminAnalyticsModal
        isOpen={isAdminAnalyticsOpen}
        onClose={() => setIsAdminAnalyticsOpen(false)}
        user={user}
        currentTheme={currentTheme}
        analyticsData={{
          ...creatorAnalytics,
          recentTransactions: creatorTransactions,
          payoutHistory: creatorPayouts
        }}
        bankConfig={bankAccount}
        onUpdateBankConfig={handleUpdateBankAccount}
        onExecutePayout={(amount, method) => handleProcessCreatorPayout(amount, `Payout via ${method}`)}
        showToast={showToast}
      />

      {/* About Company & Mission Showcase Modal */}
      <AboutCompanyModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        currentTheme={currentTheme}
        userProfile={user}
        onOpenFreeTrial={() => {
          setIsAboutModalOpen(false);
          setIsPricingModalOpen(true);
        }}
      />

      {/* Import Tutorial Modal */}
      <ImportTutorialModal
        isOpen={isImportTutorialOpen}
        onClose={() => setIsImportTutorialOpen(false)}
        onOpenUploadModal={() => {
          setIsImportTutorialOpen(false);
          setIsUploadModalOpen(true);
        }}
        currentTheme={currentTheme}
      />

      {/* Persistent Left & Right Floating Step Navigation Paddles (Workspace step views only) */}
      {activeTab !== 'overview' && (
        <FloatingStepNavPaddles
          currentTab={activeTab}
          onSelectTab={handleTabNavigation}
          currentTheme={currentTheme}
        />
      )}

      {/* SKU & Inventory Stock Manager Modal */}
      <SkuInventoryManagerModal
        isOpen={isInventoryManagerOpen}
        onClose={() => setIsInventoryManagerOpen(false)}
        products={products}
        promotions={promotions}
        onUpdateProducts={handleUpdateProductsInventory}
        onOpenAddSku={() => {
          setIsInventoryManagerOpen(false);
          setActiveTab('catalog');
        }}
        onOpenEditRange={() => {
          setIsInventoryManagerOpen(false);
          setIsEditRangeOpen(true);
        }}
        currentTheme={currentTheme}
      />

      {/* Product Range Specs & Pricing Editor Modal */}
      <ProductRangeEditorModal
        isOpen={isEditRangeOpen}
        onClose={() => setIsEditRangeOpen(false)}
        products={products}
        onSaveProducts={handleSaveRangeProducts}
        onOpenInventoryManager={() => {
          setIsEditRangeOpen(false);
          setIsInventoryManagerOpen(true);
        }}
        currentTheme={currentTheme}
      />

      {/* Single Mobile Workspace Navigation Bar */}
      {activeTab !== 'overview' && (
        <nav
          aria-label="Workspace Mobile Navigation"
          className={`no-print fixed bottom-0 inset-x-0 z-40 md:hidden border-t h-16 px-1.5 grid grid-cols-5 items-center backdrop-blur-md ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-600'
              : 'bg-[#0b0f19]/95 border-slate-800 text-slate-400'
          }`}
        >
          {[
            { label: 'Dashboard', tab: 'dashboard' as AppTab, icon: MenuIcon },
            { label: 'Promos', tab: 'promotion-builder' as AppTab, icon: SlidersHorizontal },
            { label: 'Calendar', tab: 'calendar' as AppTab, icon: CalendarIcon },
            { label: 'Products', tab: 'catalog' as AppTab, icon: Folder },
            { label: 'Scan & Order', tab: 'scan-order' as AppTab, icon: ScanBarcode },
          ].map((item) => {
            const Icon = item.icon;
            const isDashboardChild = ['dashboard', 'directory', 'commercial-insights'].includes(activeTab);
            const isActive =
              item.tab === 'dashboard'
                ? isDashboardChild
                : item.tab === 'calendar'
                ? activeTab === 'calendar' || activeTab === 'week-studio'
                : activeTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => handleTabNavigation(item.tab)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? isLight
                      ? 'text-indigo-600 font-bold'
                      : 'text-indigo-400 font-bold'
                    : isLight
                    ? 'text-slate-500 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-[11px] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
        </>
      )}
    </div>
  );
}
