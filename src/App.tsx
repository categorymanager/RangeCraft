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
  SkuCatalog
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
import { auth, syncUserProfile, saveUserPlanToCloud, loadUserPlanFromCloud, saveUserCatalogsToCloud, loadUserCatalogsFromCloud } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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
import { MicroCheckoutModal } from './components/MicroCheckoutModal';
import { ProgressStepper } from './components/ProgressStepper';
import { StepNavigationFooter } from './components/StepNavigationFooter';
import { ImportTutorialModal } from './components/ImportTutorialModal';
import { TradeStrategyFunnelView } from './components/TradeStrategyFunnelView';
import { SkuInventoryManagerModal } from './components/SkuInventoryManagerModal';
import { ProductRangeEditorModal } from './components/ProductRangeEditorModal';
import { FloatingStepNavPaddles } from './components/FloatingStepNavPaddles';

export default function App() {
  // 1. Auth & User Profile State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [paywallFeatureTriggered, setPaywallFeatureTriggered] = useState<string>('Premium Feature');
  const [authIntendedMessage, setAuthIntendedMessage] = useState<string | undefined>(undefined);
  const [pendingTabAfterAuth, setPendingTabAfterAuth] = useState<any>(null);

  // Micro-Checkout State for Pay-Per-Export ($19) or Pro Subscription ($39/mo)
  const [microCheckoutState, setMicroCheckoutState] = useState<{
    isOpen: boolean;
    exportId: string;
    itemName: string;
    priceAud: number;
    planType: 'single_export' | 'pro_subscription';
  }>({
    isOpen: false,
    exportId: '',
    itemName: '',
    priceAud: 19,
    planType: 'single_export'
  });

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
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'week-studio' | 'catalog' | 'analytics' | 'market-intel' | 'clashes' | 'executive-briefing' | 'activity-log' | 'crm' | 'billing'>('overview');
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(4); // Default to Australia Day week
  
  // CRM & Trading Terms State
  const [accounts, setAccounts] = useState<CrmAccount[]>(INITIAL_CRM_ACCOUNTS);
  const [deals, setDeals] = useState<CrmDeal[]>(INITIAL_CRM_DEALS);
  const [activities, setActivities] = useState<CrmActivity[]>(INITIAL_CRM_ACTIVITIES);
  const [tradingTerms, setTradingTerms] = useState<TradingTerms[]>(INITIAL_TRADING_TERMS);
  const [businessPersona, setBusinessPersona] = useState<BusinessPersona>('brand_sales_rep');
  
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

  // Save updated product range from ProductRangeEditorModal or SkuInventoryManagerModal
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

  // 2. Stripe Checkout Post-Redirect Verification Handler
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const exportUnlocked = urlParams.get('export_unlocked');
    const plan = urlParams.get('plan');
    const status = urlParams.get('status');

    if (sessionId) {
      fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}&plan=${encodeURIComponent(plan || '')}&export_unlocked=${encodeURIComponent(exportUnlocked || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data.isPaid || data.valid) {
            const isPro = data.planType === 'pro_subscription' || data.planType === 'subscription_monthly' || data.planType === 'subscription_annual' || plan === 'pro_subscription';
            const targetExport = data.exportId || exportUnlocked || 'master_52week_plan';

            handleCheckoutSuccess(targetExport, isPro ? 'pro_planner' : undefined);
            
            handleLogCreatorTransaction(
              data.itemName || (isPro ? 'Commercial Pro Subscription' : 'Commercial Export Package'),
              isPro ? 'subscription_monthly' : 'export_single',
              data.amountPaidAud || (isPro ? 39 : 19),
              'credit_card',
              data.invoiceNumber || `INV-AU-${sessionId.slice(-6).toUpperCase()}`
            );

            showToast(`Stripe Payment Verified! ${isPro ? 'Commercial Pro active with unlimited exports' : 'Commercial deliverable unlocked'} (Invoice #${data.invoiceNumber || 'AU-2026'}).`, 'success');
          }
        })
        .catch(err => {
          console.warn('Stripe verification check:', err);
        })
        .finally(() => {
          // Clean the query parameters cleanly without refreshing
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

  // Save changes to cloud & localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rangecraft_user_catalogs', JSON.stringify(catalogs));
      localStorage.setItem('rangecraft_active_catalog_id', activeCatalogId);
    } catch (e) {}

    if (user && catalogs.length > 0) {
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
  }, [catalogs, activeCatalogId, user]);

  useEffect(() => {
    if (user && promotions.length > 0) {
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
  }, [promotions, user]);
  
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

    if (user.subscriptionTier === 'free_trial' && requiredTier !== 'free_trial') {
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

  const handleTabNavigation = (tab: 'overview' | 'calendar' | 'week-studio' | 'catalog' | 'analytics' | 'market-intel' | 'clashes' | 'executive-briefing' | 'activity-log' | 'crm') => {
    if (tab === 'overview') {
      setActiveTab('overview');
      return;
    }

    // Require account login to access operational workspace tabs
    if (!user) {
      setAuthIntendedMessage(`Sign in or create an account to access the ${tab === 'calendar' ? '52-Week Master Grid' : tab === 'catalog' ? 'Product Catalog' : tab === 'analytics' ? 'Trade Spend Analytics' : 'Workspace'}.`);
      setPendingTabAfterAuth(tab);
      setIsAuthModalOpen(true);
      return;
    }

    // Executive briefing requires Pro or Enterprise tier
    if (tab === 'executive-briefing' && user.subscriptionTier === 'free_trial') {
      setPaywallFeatureTriggered('C-Suite Executive Briefing & Export Suite');
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
    logActivity('Promotion', 'Updated Week Mechanics', `Updated Week ${updatedPromo.weekNumber} (${updatedPromo.campaignTheme}): Hero SKU ${updatedPromo.heroSku}, Mechanic: ${mechanicDesc}.`);
    showToast(`Saved Week ${updatedPromo.weekNumber} strategy & recalculated 52-week plan.`, 'success');
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

    logActivity('Promotion', 'Drag-and-Drop Reslot', `Swapped promotional campaign between Week ${sourceWeekNum} and Week ${targetWeekNum} via drag-and-drop. Automatically re-audited ACCC compliance clashes.`);
    showToast(`Successfully moved promotion to Week ${targetWeekNum} and re-audited ACCC compliance.`, 'success');
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
      if (user?.subscriptionTier === 'free_trial' && products.length >= (user?.maxSkusAllowed || 15)) {
        setPaywallFeatureTriggered('Unlimited Range SKU Uploads');
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
    }, 'Custom CSV Catalog Import');
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
    }, 'Instant 52-Week Generation from CSV');
  };

  const handleAutoGeneratePlanFromRange = () => {
    handlePaidFeatureAction(() => {
      const newPlan = generateDefault52WeekPlan(products);
      setPromotions(newPlan);
      setActiveTab('calendar');
      logActivity('Promotion', 'Auto-Generated 52-Week Plan', `Regenerated 52-week promotional plan using ${products.length} current catalog SKUs.`);
      showToast(`Regenerated 52-week calendar using ${products.length} current catalog SKUs.`, 'success');
    }, 'Automated Portfolio Plan Generator');
  };

  const handleAutoFixClashes = () => {
    handlePaidFeatureAction(() => {
      const result = autoReslotAndFixClashes(promotions, products);
      setPromotions(result.repairedPromotions);
      logActivity('Compliance', 'Auto-Reslotted ACCC Compliance', `Ran 1-click ACCC compliance auto-reslot algorithm. Resolved ${result.fixedClashesCount} potential clashes.`);
      if (result.fixedClashesCount > 0) {
        showToast(
          `Successfully auto-reslotted calendar! Resolved ${result.fixedClashesCount} clash${result.fixedClashesCount > 1 ? 'es' : ''} (100% compliant with ACCC 4-week hiatus & category rules).`,
          'success'
        );
      } else {
        showToast(`Calendar auto-reslotted: 100% compliant with 4-week hiatus and zero clashes.`, 'success');
      }
    }, '1-Click Auto-Reslot Algorithm (ACCC Compliance)');
  };

  const handleOpenMicroCheckout = (
    exportId: string, 
    itemName: string, 
    priceAud = 19, 
    planType: 'single_export' | 'pro_subscription' = 'single_export'
  ) => {
    setMicroCheckoutState({
      isOpen: true,
      exportId,
      itemName,
      priceAud,
      planType
    });
  };

  const handleCheckoutSuccess = (exportId: string, tier?: SubscriptionTier) => {
    if (tier === 'pro_planner') {
      const updatedUser: UserProfile = {
        ...(user || {
          uid: 'guest_pro_' + Date.now(),
          email: 'pro.subscriber@retailtrade.com.au',
          displayName: 'Commercial Pro Subscriber',
          createdAt: new Date().toISOString(),
          aiGenerationsRemaining: 9999,
          customSkusCreatedCount: 100,
          unlockedExports: []
        }),
        subscriptionTier: 'pro_planner',
        unlockedExports: Array.from(new Set([...(user?.unlockedExports || []), exportId, 'q3_q4_calendar', 'sku_deletion_audit', 'executive_pack_pdf', 'commercial_model_xlsx']))
      };
      setUser(updatedUser);
      syncUserProfile(updatedUser);
      logActivity('Subscription', 'Upgraded to Pro Planner', 'Upgraded subscription to Commercial Pro ($39/mo).');
      showToast('Welcome to Commercial Pro! All 52 weeks, SKU reports, and exports are now unlocked.', 'success');
    } else {
      const updatedUser: UserProfile = {
        ...(user || {
          uid: 'guest_user_' + Date.now(),
          email: 'guest.purchaser@retailtrade.com.au',
          displayName: 'Verified Purchaser',
          createdAt: new Date().toISOString(),
          subscriptionTier: 'free_trial',
          aiGenerationsRemaining: 3,
          customSkusCreatedCount: 5,
          unlockedExports: []
        }),
        unlockedExports: Array.from(new Set([...(user?.unlockedExports || []), exportId]))
      };
      setUser(updatedUser);
      syncUserProfile(updatedUser);
      logActivity('Export', 'Unlocked Single Asset', `Purchased one-time export unlock for ${exportId} ($19 AUD).`);
      showToast(`Export unlocked successfully! Instant download ready.`, 'success');
    }
  };

  const handleOpenAiStrategist = () => {
    handleProtectedAction(() => {
      if (user?.subscriptionTier === 'free_trial' && (user?.aiGenerationsRemaining || 0) <= 0) {
        setPaywallFeatureTriggered('Unlimited Gemini AI Strategy Copilot Runs');
        setIsPricingModalOpen(true);
        return;
      }
      setIsAiModalOpen(true);
      logActivity('AI Strategy', 'Opened Gemini AI Strategist', 'Opened Gemini AI strategy copilot simulation modal.');
    }, 'Sign in to run Gemini AI Promotional Strategy simulations.');
  };

  const handleApplyAiStrategy = (aiPromotions: WeekPromotion[]) => {
    const audited = auditClashes(aiPromotions, products);
    setPromotions(audited);
    if (user && user.subscriptionTier === 'free_trial') {
      setUser({
        ...user,
        aiGenerationsRemaining: Math.max(0, user.aiGenerationsRemaining - 1),
      });
    }
    logActivity('AI Strategy', 'Deployed Gemini AI Strategy', 'Successfully deployed Gemini AI optimized promotional schedule across 52-week calendar.');
    showToast(`Gemini AI Promotional Strategy successfully deployed.`);
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
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isLight 
          ? 'bg-[#f8fafc] text-slate-900 selection:bg-blue-500 selection:text-white' 
          : 'bg-[#0b0f17] text-slate-100 selection:bg-blue-500 selection:text-white'
      }`}
    >
      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`w-2 h-2 rounded-full ${statusToast.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'} animate-ping`} />
          <span>{statusToast.message}</span>
        </div>
      )}

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
          setPaywallFeatureTriggered('Commercial Pro Features');
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
              setPaywallFeatureTriggered('Commercial Pro & Enterprise Plans');
              setIsPricingModalOpen(true);
            }}
            onOpenAboutModal={() => setIsAboutModalOpen(true)}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          <ProgressStepper activeTab={activeTab} onNavigate={handleTabNavigation} />
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
                  setPaywallFeatureTriggered('Commercial Pro Workflow');
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
                onImportProducts={handleImportOnly}
                onDeleteProduct={handleDeleteProduct}
                onDeleteMultipleProducts={handleDeleteMultipleProducts}
                onClearAllProducts={handleClearAllProducts}
                onOpenUploadModal={() => handlePaidFeatureAction(() => setIsUploadModalOpen(true), 'Custom CSV SKU Range Import')}
                onAutoGeneratePlanFromRange={handleAutoGeneratePlanFromRange}
                currentTheme={currentTheme}
              />
              <StepNavigationFooter
                currentTab={activeTab}
                onNavigateTab={handleTabNavigation}
                currentTheme={currentTheme}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('Commercial Pro Workflow');
                  setIsPricingModalOpen(true);
                }}
              />
            </>
          )}

          {activeTab === 'deletion-engine' && (
            <SkuDeletionEngineView
              products={products}
              promotions={promotions}
              userProfile={user}
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
              />
              <StepNavigationFooter
                currentTab={activeTab}
                onNavigateTab={handleTabNavigation}
                currentTheme={currentTheme}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('Commercial Pro Workflow');
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
              />
              <StepNavigationFooter
                currentTab={activeTab}
                onNavigateTab={handleTabNavigation}
                currentTheme={currentTheme}
                onOpenPricingModal={() => {
                  setPaywallFeatureTriggered('Commercial Pro Workflow');
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
                  setPaywallFeatureTriggered('Commercial Pro Workflow');
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
        </main>
      )}

      {/* Global Responsive Website Footer */}
      <Footer
        currentTheme={currentTheme}
        onNavigateTab={handleTabNavigation}
        onOpenPricingModal={() => {
          setPaywallFeatureTriggered('Commercial Pro Features');
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
          if (pendingTabAfterAuth) {
            setActiveTab(pendingTabAfterAuth);
            setPendingTabAfterAuth(null);
          }
        }}
        currentTheme={currentTheme}
        intendedActionMessage={authIntendedMessage}
      />

      {/* Subscription Paywall & One-Off Services Modal for Income Generation (PayPal, Cards, EFT) */}
      <PricingPaywallModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        user={user}
        onUpgradeSuccess={(updatedProfile) => {
          setUser(updatedProfile);
          showToast(`Account upgraded to ${updatedProfile.subscriptionTier === 'pro_planner' ? 'Commercial Pro' : 'Enterprise Tier'}!`, 'success');
        }}
        onLogCreatorTransaction={handleLogCreatorTransaction}
        onRequireAuth={() => {
          setAuthIntendedMessage('Create an account to complete your subscription upgrade or strategy service booking.');
          setIsAuthModalOpen(true);
        }}
        currentTheme={currentTheme}
        featureTriggered={paywallFeatureTriggered}
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
        onOpenFreeTrial={() => {
          setIsAboutModalOpen(false);
          setIsPricingModalOpen(true);
        }}
      />

      {/* Pay-Per-Export ($19) and Pro Subscription ($39/mo) Micro-Checkout Modal */}
      <MicroCheckoutModal
        isOpen={microCheckoutState.isOpen}
        onClose={() => setMicroCheckoutState(prev => ({ ...prev, isOpen: false }))}
        exportId={microCheckoutState.exportId}
        itemName={microCheckoutState.itemName}
        priceAud={microCheckoutState.priceAud}
        initialPlan={microCheckoutState.planType}
        user={user}
        onSuccess={handleCheckoutSuccess}
        onRequireAuth={() => {
          setAuthIntendedMessage('Sign in or create an account to finalize your commercial export.');
          setIsAuthModalOpen(true);
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

      {/* Persistent Left & Right Floating Step Navigation Paddles */}
      <FloatingStepNavPaddles
        currentTab={activeTab}
        onSelectTab={handleTabNavigation}
        currentTheme={currentTheme}
      />

      {/* SKU & Inventory Stock Manager Modal */}
      <SkuInventoryManagerModal
        isOpen={isInventoryManagerOpen}
        onClose={() => setIsInventoryManagerOpen(false)}
        products={products}
        promotions={promotions}
        onUpdateProducts={handleSaveRangeProducts}
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
    </div>
  );
}
