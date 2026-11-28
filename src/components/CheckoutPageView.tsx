import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Download,
  FileText,
  Printer,
  RefreshCw,
  MessageSquare,
  X,
  Edit3,
  AlertCircle,
  Check,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  UserProfile,
  Product,
  WeekPromotion,
  StrategyKPIs,
  SubscriptionTier,
  CheckoutPlanType,
  AppTab
} from '../types';
import { useActiveCurrency } from '../utils/currency';
import { RangeCraftLogo } from './RangeCraftLogo';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, syncUserProfile, saveCheckoutBusinessProfile, upgradeSubscription, unlockSingleExport, purchaseAiTopUp } from '../lib/firebase';
import {
  trackBeginCheckout,
  trackPurchaseSuccess,
  trackSubscriptionUpgrade,
  trackButtonClick
} from '../utils/analytics';
import {
  generate52WeekCommercialPlanExcel,
  generateExecutiveJbpPdf,
  generateSkuDeletionExcel
} from '../utils/exportGenerators';

interface CheckoutPageViewProps {
  exportId: string;
  itemName: string;
  priceAud: number;
  initialPlanType: CheckoutPlanType;
  initialBillingCycle?: 'monthly' | 'annual';
  excludesGst?: boolean;
  returnTab: AppTab;
  user: UserProfile | null;
  onBack: () => void;
  onSuccess: (updatedProfile: UserProfile, exportId: string, tier?: SubscriptionTier) => void;
  onLogTransaction?: (
    itemTitle: string,
    itemType: any,
    amountAud: number,
    paymentMethod: 'paypal' | 'credit_card' | 'bank_transfer',
    txnId?: string
  ) => void;
  products?: Product[];
  promotions?: WeekPromotion[];
  kpis?: StrategyKPIs;
}

type PaymentMethodOption = 'paypal' | 'stripe_card';

const TAB_LABELS: Record<string, string> = {
  overview: 'Home',
  directory: 'Workspace Directory',
  wholesale: 'Wholesale Orders',
  'commercial-journey': 'Strategy Funnel',
  calendar: '52-Week Calendar',
  'week-studio': 'Week Studio',
  catalog: 'Product Catalog',
  analytics: 'Analytics',
  'market-intel': 'Market Intel',
  clashes: 'Compliance Audit',
  'executive-briefing': 'Executive Briefing',
  'activity-log': 'Activity Log',
  crm: 'B2B CRM',
  billing: 'Billing & Invoices',
  'deletion-engine': 'Deletion Engine',
  'breakeven-basket': 'Breakeven & Basket'
};

const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'SG', name: 'Singapore' },
  { code: 'CA', name: 'Canada' }
];

const CountryFlagBadge: React.FC<{ country: string }> = ({ country }) => {
  if (country === 'Australia') {
    return (
      <div className="w-11 h-7 rounded border border-slate-200 overflow-hidden shrink-0 shadow-2xs" aria-label="Australia flag">
        <svg viewBox="0 0 60 36" className="w-full h-full">
          <rect width="60" height="36" fill="#00008B" />
          <path d="M0 0L28 18M28 0L0 18" stroke="#FFFFFF" strokeWidth="4" />
          <path d="M0 0L28 18M28 0L0 18" stroke="#FF0000" strokeWidth="1.6" />
          <path d="M14 0V18M0 9H28" stroke="#FFFFFF" strokeWidth="6" />
          <path d="M14 0V18M0 9H28" stroke="#FF0000" strokeWidth="3.2" />
          <circle cx="14" cy="27" r="3" fill="#FFFFFF" />
          <circle cx="44" cy="10" r="2" fill="#FFFFFF" />
          <circle cx="51" cy="16" r="2" fill="#FFFFFF" />
          <circle cx="45" cy="24" r="2" fill="#FFFFFF" />
          <circle cx="38" cy="18" r="1.8" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-11 h-7 rounded border border-slate-200 bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
      {COUNTRIES.find((c) => c.name === country)?.code || 'INTL'}
    </div>
  );
};

const WelcomeLaunchIllustration: React.FC = () => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-24 h-24 sm:w-28 sm:h-28 shrink-0"
    aria-hidden="true"
  >
    {/* Soft ambient circle */}
    <circle cx="60" cy="60" r="52" fill="#EEF2FF" />
    <circle cx="60" cy="60" r="40" fill="#ECFDF5" opacity="0.85" />
    {/* Subtle growth bars behind rocket */}
    <rect x="26" y="74" width="10" height="20" rx="3" fill="#C7D2FE" />
    <rect x="40" y="64" width="10" height="30" rx="3" fill="#A5B4FC" />
    <rect x="70" y="68" width="10" height="26" rx="3" fill="#A7F3D0" />
    <rect x="84" y="56" width="10" height="38" rx="3" fill="#6EE7B7" />
    {/* Exhaust flame */}
    <path d="M54 82C54 82 57 98 60 98C63 98 66 82 66 82H54Z" fill="#10B981" />
    <path d="M56.5 82C56.5 82 58.5 92 60 92C61.5 92 63.5 82 63.5 82H56.5Z" fill="#FBBF24" />
    {/* Rocket Fins */}
    <path d="M46 65L38 78L48 75V65H46Z" fill="#4338CA" />
    <path d="M74 65L82 78L72 75V65H74Z" fill="#4338CA" />
    {/* Rocket Body */}
    <path
      d="M60 20C70 30 74 46 74 68C74 75 70 80 66 82H54C50 80 46 75 46 68C46 46 50 30 60 20Z"
      fill="#4F46E5"
    />
    {/* Nose highlight */}
    <path d="M60 20C65 25 68 33 70 42H50C52 33 55 25 60 20Z" fill="#6366F1" />
    {/* Window */}
    <circle cx="60" cy="52" r="9" fill="#FFFFFF" />
    <circle cx="60" cy="52" r="6" fill="#10B981" />
    <path d="M57 52L59.2 54.2L63.5 49.8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckoutPageView: React.FC<CheckoutPageViewProps> = ({
  exportId,
  itemName,
  priceAud,
  initialPlanType,
  initialBillingCycle = 'annual',
  excludesGst = false,
  returnTab,
  user,
  onBack,
  onSuccess,
  onLogTransaction,
  products = [],
  promotions = [],
  kpis
}) => {
  const { currency, format, getTierPrice } = useActiveCurrency();
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // Plan & Billing Cycle Selection
  const [planType, setPlanType] = useState<CheckoutPlanType>(initialPlanType);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(initialBillingCycle);

  // Determine whether Step 1 can be skipped immediately (signed-in users)
  const [createdAuthUid, setCreatedAuthUid] = useState<string | null>(null);
  const isSignedIn = Boolean((user && user.uid && !user.uid.startsWith('guest_')) || createdAuthUid);
  const [isEditingDetails, setIsEditingDetails] = useState<boolean>(!isSignedIn);
  const [isStep1Complete, setIsStep1Complete] = useState<boolean>(isSignedIn);
  const [isSubmittingStep1, setIsSubmittingStep1] = useState<boolean>(false);

  // Step 1 Form Fields (pre-filled from signed-in user if available)
  const nameParts = (user?.displayName || '').trim().split(/\s+/);
  const [firstName, setFirstName] = useState(user?.firstName || nameParts[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || nameParts.slice(1).join(' ') || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [abn, setAbn] = useState(user?.abn || '');
  const [noAbnIndividual, setNoAbnIndividual] = useState(false);
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [streetAddress, setStreetAddress] = useState(user?.streetAddress || '');
  const [houseNumber, setHouseNumber] = useState(user?.houseNumber || '');
  const [country, setCountry] = useState(user?.country || 'Australia');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(Boolean(user?.acceptedTermsAt) || isSignedIn);

  // Step 2 Payment State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Modals / Popovers
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [activePolicyModal, setActivePolicyModal] = useState<'terms' | 'privacy' | null>(null);

  // Sync if signed-in user arrives
  useEffect(() => {
    if (user && user.uid && !user.uid.startsWith('guest_')) {
      const parts = (user.displayName || '').trim().split(/\s+/);
      if (!firstName) setFirstName(user.firstName || parts[0] || '');
      if (!lastName) setLastName(user.lastName || parts.slice(1).join(' ') || '');
      if (!email) setEmail(user.email || '');
      if (!companyName && user.companyName) setCompanyName(user.companyName);
      if (!abn && user.abn) setAbn(user.abn);
      if (!phoneNumber && user.phoneNumber) setPhoneNumber(user.phoneNumber);
      if (!streetAddress && user.streetAddress) setStreetAddress(user.streetAddress);
      if (!houseNumber && user.houseNumber) setHouseNumber(user.houseNumber);
      if (user.country) setCountry(user.country);
      setIsStep1Complete(true);
      setIsEditingDetails(false);
      setAcceptedTerms(true);
    }
  }, [user?.uid]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // All prices are single GST-inclusive prices (inc. GST) without extra tax add-on
  const starterMonthlyPrice = getTierPrice('starter_plan').convertedPrice || 59;
  const proMonthlyPrice = getTierPrice('pro_planner').convertedPrice || 149;
  const enterpriseMonthlyPrice = getTierPrice('enterprise_tier').convertedPrice || 399;
  const singleExportPrice =
    currency === 'AUD' ? priceAud || 19 : currency === 'USD' ? 13 : currency === 'EUR' ? 12 : currency === 'GBP' ? 10 : 21;

  const getActiveBasePrice = (): number => {
    if (planType === 'single_export') return singleExportPrice;
    if (planType === 'ai_topup') return priceAud || 29;
    if (planType === 'one_off_service') return priceAud || 299;
    const baseMonthly =
      planType === 'starter_subscription'
        ? starterMonthlyPrice
        : planType === 'enterprise_subscription'
        ? enterpriseMonthlyPrice
        : proMonthlyPrice;
    return billingCycle === 'annual' ? Math.round(baseMonthly * 10) : baseMonthly;
  };

  const basePrice = getActiveBasePrice();
  const isPlusGst = false;
  const subtotal = Number((basePrice - basePrice / 11).toFixed(2));
  const gstAmount = Number((basePrice / 11).toFixed(2));
  const currentPrice = basePrice;

  const getPlanDisplayTitle = () => {
    if (planType === 'single_export') return itemName || 'Commercial Export Package';
    if (planType === 'one_off_service') return itemName || 'Done-For-You Advisory Service';
    if (planType === 'ai_topup') return itemName || 'Scenario Top-Up Pack (+50 Runs)';
    if (planType === 'starter_subscription') return 'Starter Plan';
    if (planType === 'enterprise_subscription') return 'Enterprise Portfolio';
    return 'Growth Plan';
  };

  const getPlanPriceLabel = () => {
    if (planType === 'single_export' || planType === 'one_off_service' || planType === 'ai_topup') {
      return `${format(currentPrice)} ${currency} inc. GST`;
    }
    return billingCycle === 'annual'
      ? `${format(currentPrice)} ${currency}/yr inc. GST`
      : `${format(currentPrice)} ${currency}/mo inc. GST`;
  };

  const getPlanBullets = () => {
    if (planType === 'single_export') {
      return [
        'Instant unredacted Excel (.xlsx) & PDF export ready immediately',
        'Complete 52-week trade spend formulas & margin breakdown',
        'ATO-compliant GST tax invoice sent straight to your email'
      ];
    }
    if (planType === 'ai_topup') {
      return [
        '+50 AI Scenario Strategist runs added to your workspace immediately',
        'Non-expiring credits that carry over across every billing cycle',
        'Works alongside Starter, Pro, and Free Forever monthly allowances'
      ];
    }
    if (planType === 'starter_subscription') {
      return [
        'Full-year 52-week promotional schedule with drag-and-drop reslotting',
        '30 AI scenario runs per month + custom scheduling rules check',
        'Un-watermarked PDF schedule exports & up to 150 active SKUs'
      ];
    }
    if (planType === 'enterprise_subscription') {
      return [
        'Up to 5,000 products & collaborative multi-brand workspaces',
        'Custom ERP / POS ingestion & retailer-specific JBP templates',
        'Dedicated implementation support & priority commercial SLA'
      ];
    }
    if (planType === 'one_off_service') {
      return [
        'Hands-on setup & audit by Australian FMCG commercial specialists',
        'Custom promotional spacing, scan rebate & margin model check',
        'Standalone one-off delivery with no recurring subscription required'
      ];
    }
    return [
      'Up to 1,000 products & 150 AI scenario runs per month',
      '1-click custom rule conflict resolution & scan rebate simulator',
      'Buyer-ready JBP decks (PPTX & PDF), Partner CRM & Wholesale Orders'
    ];
  };

  useEffect(() => {
    trackBeginCheckout(
      exportId,
      getPlanDisplayTitle(),
      currentPrice,
      planType === 'single_export' ? 'single_export' : 'pro_subscription'
    );
  }, [exportId, planType, billingCycle]);

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'Please enter your first name.';
    if (!lastName.trim()) errs.lastName = 'Please enter your last name.';
    if (!phoneNumber.trim() && !isSignedIn) errs.phoneNumber = 'Please enter a contact phone number.';
    if (!noAbnIndividual && !abn.trim() && !isSignedIn) errs.abn = 'Enter your ABN / Tax ID or select purchasing as an individual.';
    if (!companyName.trim()) errs.companyName = 'Please enter your company or trading name.';
    if (!streetAddress.trim() && !isSignedIn) errs.streetAddress = 'Please enter your street address.';
    if (!email.trim() || !email.includes('@')) errs.email = 'Please enter a valid work email address.';
    if (!isSignedIn && password.trim().length < 6) {
      errs.password = 'Create a password with at least 6 characters.';
    }
    if (!acceptedTerms) {
      errs.acceptedTerms = 'Please confirm you agree to the terms and privacy policy.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setIsSubmittingStep1(true);
    try {
      const fullDisplayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      let resolvedUid = (user?.uid && !user.uid.startsWith('guest_') ? user.uid : null) || createdAuthUid || auth.currentUser?.uid || null;
      let syncedBaseProfile = user;

      if (!resolvedUid && password.trim().length >= 6) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          resolvedUid = cred.user.uid;
          setCreatedAuthUid(resolvedUid);
          syncedBaseProfile = await syncUserProfile({
            uid: resolvedUid,
            email: cred.user.email || email.trim(),
            displayName: fullDisplayName || email.trim().split('@')[0],
          });
        } catch (authErr: any) {
          if (authErr?.code === 'auth/email-already-in-use') {
            try {
              const loginCred = await signInWithEmailAndPassword(auth, email.trim(), password);
              resolvedUid = loginCred.user.uid;
              setCreatedAuthUid(resolvedUid);
              syncedBaseProfile = await syncUserProfile({
                uid: resolvedUid,
                email: loginCred.user.email || email.trim(),
                displayName: loginCred.user.displayName || fullDisplayName,
              });
            } catch (loginErr: any) {
              if (loginErr?.code === 'auth/wrong-password' || loginErr?.code === 'auth/invalid-credential') {
                setFormErrors((prev) => ({
                  ...prev,
                  password: 'An account already exists with this email. Enter the existing password or sign in first.',
                }));
                setIsSubmittingStep1(false);
                return;
              }
            }
          } else if (authErr?.code === 'auth/operation-not-allowed') {
            // Fall back to guest billing profile when email/password auth isn't enabled in Firebase console
            resolvedUid = `checkout_user_${Date.now()}`;
          } else {
            setFormErrors((prev) => ({
              ...prev,
              email: authErr?.message || 'Unable to verify credentials. Please check your email and password.',
            }));
            setIsSubmittingStep1(false);
            return;
          }
        }
      }

      const finalUid = resolvedUid || user?.uid || `checkout_user_${Date.now()}`;
      await saveCheckoutBusinessProfile(
        finalUid,
        {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          displayName: fullDisplayName || 'Australian Category Lead',
          phoneNumber: phoneNumber.trim(),
          companyName: companyName.trim(),
          abn: noAbnIndividual ? 'Individual / Sole Trader' : abn.trim(),
          streetAddress: streetAddress.trim(),
          houseNumber: houseNumber.trim(),
          country,
          acceptedTermsAt: new Date().toISOString()
        },
        syncedBaseProfile
      );

      setIsStep1Complete(true);
      setIsEditingDetails(false);
      setTimeout(() => {
        paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } finally {
      setIsSubmittingStep1(false);
    }
  };

  const triggerRealDownload = () => {
    try {
      if (exportId.includes('pdf') || exportId.includes('executive') || exportId.includes('briefing')) {
        generateExecutiveJbpPdf(
          { documentTitle: `${new Date().getFullYear()} Commercial Strategy & Joint Business Planning Pack` },
          kpis,
          promotions,
          products,
          `RangeCraft_AU_Executive_Briefing_${new Date().getFullYear()}.pdf`,
          user
        );
      } else if (exportId.includes('deletion') || exportId.includes('audit')) {
        generateSkuDeletionExcel([], 48500, 12125);
      } else {
        generate52WeekCommercialPlanExcel(
          promotions,
          products,
          kpis,
          `RangeCraft_AU_52Week_Master_Plan_${new Date().getFullYear()}.xlsx`
        );
      }
    } catch (err) {
      console.warn('Export download note:', err);
    }
  };

  const handleExpressPayment = async (method: PaymentMethodOption) => {
    if (!isStep1Complete) {
      validateStep1();
      return;
    }

    setPaymentError(null);
    setIsProcessing(true);
    trackButtonClick(`checkout_${method}`, 'checkout_page_view', {
      exportId,
      planType,
      billingCycle,
      currentPrice
    });

    const businessPayload: Partial<UserProfile> = {
      email: email.trim() || user?.email || 'buyer@retailbrands.com.au',
      firstName: firstName.trim() || user?.firstName,
      lastName: lastName.trim() || user?.lastName,
      displayName: `${firstName} ${lastName}`.trim() || user?.displayName || 'Australian Category Lead',
      phoneNumber: phoneNumber.trim() || user?.phoneNumber,
      companyName: companyName.trim() || user?.companyName || 'Retail Brands Australia Pty Ltd',
      abn: noAbnIndividual ? 'Individual / Sole Trader' : abn.trim() || user?.abn || '45 809 237 194',
      streetAddress: streetAddress.trim() || user?.streetAddress,
      houseNumber: houseNumber.trim() || user?.houseNumber,
      country: country || user?.country || 'Australia',
      acceptedTermsAt: user?.acceptedTermsAt || new Date().toISOString()
    };

    try {
      const endpoint = method === 'stripe_card' ? '/api/stripe/create-checkout-session' : '/api/checkout/express';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportId,
          itemName: getPlanDisplayTitle(),
          priceAud: currentPrice,
          planType,
          billingCycle,
          paymentMethod: method,
          customerEmail: businessPayload.email,
          customerName: businessPayload.displayName,
          companyName: businessPayload.companyName,
          abn: businessPayload.abn,
          country: businessPayload.country,
          originUrl: window.location.origin
        })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      // Update User Profile & Entitlements in Firestore + Local State
      const activeUid = (user?.uid && !user.uid.startsWith('guest_') ? user.uid : null) || createdAuthUid || auth.currentUser?.uid || user?.uid || `user_checkout_${Date.now()}`;
      let updatedProfile: UserProfile;
      const targetTier: SubscriptionTier | undefined =
        planType === 'enterprise_subscription'
          ? 'enterprise_tier'
          : planType === 'pro_subscription'
          ? 'pro_planner'
          : planType === 'starter_subscription'
          ? 'starter_plan'
          : undefined;

      if (targetTier) {
        updatedProfile = await upgradeSubscription(
          activeUid,
          targetTier,
          businessPayload.companyName,
          businessPayload
        );
      } else if (planType === 'ai_topup') {
        const baseProfile = await saveCheckoutBusinessProfile(activeUid, businessPayload, user);
        updatedProfile = await purchaseAiTopUp(activeUid, 50, baseProfile);
      } else {
        const baseProfile = await saveCheckoutBusinessProfile(activeUid, businessPayload, user);
        updatedProfile = await unlockSingleExport(activeUid, exportId, baseProfile);
      }

      const methodLabel =
        method === 'paypal' ? 'PayPal Express' : 'Stripe Checkout';

      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        setInvoiceDetails({
          invoiceId: data.invoiceId || `INV-AU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
          transactionId: data.transactionId || `TXN-${Date.now()}`,
          date: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
          amountPaid: currentPrice,
          gst: gstAmount,
          subtotal,
          method: methodLabel,
          customer: businessPayload.displayName,
          company: businessPayload.companyName,
          buyerAbn: businessPayload.abn,
          email: businessPayload.email
        });

        trackPurchaseSuccess(
          exportId,
          getPlanDisplayTitle(),
          currentPrice,
          data.transactionId || 'tx_' + Date.now(),
          method
        );
        if (targetTier) {
          trackSubscriptionUpgrade(getPlanDisplayTitle(), currentPrice, targetTier);
        }

        if (onLogTransaction) {
          onLogTransaction(
            getPlanDisplayTitle(),
            planType === 'single_export'
              ? 'single_export'
              : planType === 'ai_topup'
              ? 'ai_topup'
              : billingCycle === 'annual'
              ? 'subscription_annual'
              : 'subscription_monthly',
            currentPrice,
            method === 'paypal' ? 'paypal' : 'credit_card',
            data.transactionId
          );
        }

        if (planType === 'single_export') {
          triggerRealDownload();
        }

        onSuccess(updatedProfile, exportId, targetTier);
      }, 900);
    } catch (err: any) {
      setIsProcessing(false);
      setPaymentError(err?.message || 'Unable to authorize payment right now. Please try again.');
    }
  };

  const backLabel = TAB_LABELS[returnTab] || 'Workspace';

  return (
    <div className="checkout-light-canvas min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      {/* Top Brand Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg"
          >
            <RangeCraftLogo size="sm" themeVariant="light" showSubtitle={false} />
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Checkout</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="hidden sm:inline">ATO Tax Invoice Included</span>
          </div>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Back Navigation Link */}
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600 underline underline-offset-4 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to {backLabel}</span>
          </button>
        </div>

        {isSuccess ? (
          /* ============================================================
             POST-PAYMENT SUCCESS & ATO TAX INVOICE SCREEN
          ============================================================ */
          <section className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border-2 border-emerald-500 bg-white p-6 sm:p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Payment Authorized · Instant Access
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {planType === 'single_export'
                    ? 'Your commercial export is ready!'
                    : `Welcome to ${getPlanDisplayTitle()}!`}
                </h1>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {planType === 'single_export'
                    ? `We unlocked "${itemName}" and started your download automatically. A tax invoice copy has been saved for ${invoiceDetails?.email}.`
                    : `All 52-week planning tools, automated hiatus guardrails, and un-watermarked JBP exports are now active on your account.`}
                </p>
              </div>
            </div>

            {/* Official Australian Tax Invoice Summary */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Official Tax Invoice (ATO Compliant)</span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                  {invoiceDetails?.invoiceId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Billed To</span>
                  <span className="font-semibold text-slate-900 block">{invoiceDetails?.customer}</span>
                  <span className="text-slate-600 block">{invoiceDetails?.company}</span>
                  <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                    ABN / Tax ID: {invoiceDetails?.buyerAbn}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Issued By</span>
                  <span className="font-semibold text-slate-900 block">RangeCraft AU Pty Ltd</span>
                  <span className="text-slate-600 block">Melbourne VIC 3000, Australia</span>
                  <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                    ABN 45 809 237 194 · ACN 648 912 340
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Payment Method</span>
                  <span className="font-semibold text-emerald-700">{invoiceDetails?.method}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Invoice Date</span>
                  <span className="font-mono text-slate-800">{invoiceDetails?.date}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Paid (inc. GST)</span>
                  <span className="font-mono tabular-nums text-emerald-700">{format(currentPrice)} {currency}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {planType === 'single_export' && (
                <button
                  type="button"
                  onClick={triggerRealDownload}
                  className="flex-1 py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File Again</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="py-3.5 px-6 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3.5 px-6 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Return to {backLabel}</span>
              </button>
            </div>
          </section>
        ) : (
          /* ============================================================
             FRIENDLY 2-STEP CHECKOUT FLOW
          ============================================================ */
          <>
            {/* Warm Welcome Headline + Emerald-Bordered Plan Value Card */}
            <section className="space-y-5">
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {isSignedIn && firstName ? `Welcome back, ${firstName}!` : 'Welcome!'}
              </h1>

              {/* Highlighted Value Summary Card (Crisp White + Emerald Border) */}
              <div className="rounded-2xl border-2 border-emerald-500 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <WelcomeLaunchIllustration />

                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div>
                      <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900">
                        {getPlanDisplayTitle()} ·{' '}
                        <span className="font-mono tabular-nums text-indigo-600">{getPlanPriceLabel()}</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {planType === 'pro_subscription'
                          ? 'Full Growth commercial access · Cancel or downgrade anytime'
                          : planType === 'single_export'
                          ? 'One-time deliverable unlock · Or upgrade to Growth Plan for unlimited packs'
                          : 'Transparent Australian B2B pricing · Includes 10% GST'}
                      </p>
                    </div>

                    <ul className="space-y-2 text-sm text-slate-700">
                      {getPlanBullets().map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-left">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Optional Inline Plan / Cycle Controls */}
                {(planType === 'single_export' ||
                  planType === 'starter_subscription' ||
                  planType === 'pro_subscription' ||
                  planType === 'enterprise_subscription') && (
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {initialPlanType === 'single_export' ? (
                      <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setPlanType('single_export')}
                          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                            planType === 'single_export'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Single Export ({format(singleExportPrice)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlanType('pro_subscription')}
                          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                            planType === 'pro_subscription'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Growth Plan ({format(proMonthlyPrice)}/mo inc. GST)
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setPlanType('starter_subscription')}
                          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                            planType === 'starter_subscription'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Starter (${starterMonthlyPrice}/mo)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlanType('pro_subscription')}
                          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                            planType === 'pro_subscription'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Pro (${proMonthlyPrice}/mo)
                        </button>
                      </div>
                    )}

                    {(planType === 'starter_subscription' || planType === 'pro_subscription') && (
                      <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                            billingCycle === 'monthly'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingCycle('annual')}
                          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                            billingCycle === 'annual'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Annual · 2 Months Free
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ============================================================
                STEP 1: BUSINESS & ACCOUNT DETAILS
            ============================================================ */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Business information
                </h2>
                {isStep1Complete && !isEditingDetails && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDetails(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit details</span>
                  </button>
                )}
              </div>

              {isStep1Complete && !isEditingDetails ? (
                /* Compact Signed-In / Completed Summary Card */
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Account & Tax Invoice Details Ready</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {[firstName, lastName].filter(Boolean).join(' ') || user?.displayName || 'Category Lead'}
                      {companyName ? ` · ${companyName}` : ''}
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{email || user?.email}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        {noAbnIndividual ? 'Individual / Sole Trader' : abn ? `ABN ${abn}` : 'ABN added on invoice'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{country}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingDetails(true)}
                    className="px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-center"
                  >
                    Update Billing Info
                  </button>
                </div>
              ) : (
                /* Full Friendly Grouped Form (No Nested Boxes — Clean Hairline Dividers) */
                <form
                  onSubmit={handleStep1Submit}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 divide-y divide-slate-200 overflow-hidden"
                  noValidate
                >
                  {/* Group 1: Contact Person */}
                  <div className="p-5 sm:p-7 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Contact person</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          <span className="text-rose-500 mr-0.5">*</span>First name of contact
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            if (formErrors.firstName) setFormErrors((p) => ({ ...p, firstName: '' }));
                          }}
                          placeholder="Sarah"
                          className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                        {formErrors.firstName && (
                          <p className="text-xs text-rose-600 mt-1">{formErrors.firstName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          <span className="text-rose-500 mr-0.5">*</span>Last name of contact
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                            if (formErrors.lastName) setFormErrors((p) => ({ ...p, lastName: '' }));
                          }}
                          placeholder="Jenkins"
                          className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                        {formErrors.lastName && (
                          <p className="text-xs text-rose-600 mt-1">{formErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        {!isSignedIn && <span className="text-rose-500 mr-0.5">*</span>}Phone number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          if (formErrors.phoneNumber) setFormErrors((p) => ({ ...p, phoneNumber: '' }));
                        }}
                        placeholder="+61 400 123 456"
                        className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                      {formErrors.phoneNumber && (
                        <p className="text-xs text-rose-600 mt-1">{formErrors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Group 2: Tax Information */}
                  <div className="p-5 sm:p-7 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900">Tax information</h3>
                      <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noAbnIndividual}
                          onChange={(e) => {
                            setNoAbnIndividual(e.target.checked);
                            if (formErrors.abn) setFormErrors((p) => ({ ...p, abn: '' }));
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Purchasing as individual (no ABN)</span>
                      </label>
                    </div>

                    {!noAbnIndividual && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          {!isSignedIn && <span className="text-rose-500 mr-0.5">*</span>}ABN / Tax number
                        </label>
                        <input
                          type="text"
                          value={abn}
                          onChange={(e) => {
                            setAbn(e.target.value);
                            if (formErrors.abn) setFormErrors((p) => ({ ...p, abn: '' }));
                          }}
                          placeholder="e.g. 45 809 237 194"
                          className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                        {formErrors.abn && (
                          <p className="text-xs text-rose-600 mt-1">{formErrors.abn}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Group 3: Business Information */}
                  <div className="p-5 sm:p-7 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Business information</h3>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        <span className="text-rose-500 mr-0.5">*</span>Company name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          if (formErrors.companyName) setFormErrors((p) => ({ ...p, companyName: '' }));
                        }}
                        placeholder="Southern Cross Brands Pty Ltd"
                        className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                      {formErrors.companyName && (
                        <p className="text-xs text-rose-600 mt-1">{formErrors.companyName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          {!isSignedIn && <span className="text-rose-500 mr-0.5">*</span>}Street
                        </label>
                        <input
                          type="text"
                          value={streetAddress}
                          onChange={(e) => {
                            setStreetAddress(e.target.value);
                            if (formErrors.streetAddress) setFormErrors((p) => ({ ...p, streetAddress: '' }));
                          }}
                          placeholder="Collins Street, Melbourne VIC"
                          className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                        {formErrors.streetAddress && (
                          <p className="text-xs text-rose-600 mt-1">{formErrors.streetAddress}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Street / Suite no.
                        </label>
                        <input
                          type="text"
                          value={houseNumber}
                          onChange={(e) => setHouseNumber(e.target.value)}
                          placeholder="Suite 14 / 459"
                          className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        <span className="text-rose-500 mr-0.5">*</span>Country
                      </label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Group 4: Credentials & Terms */}
                  <div className="p-5 sm:p-7 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Your credentials</h3>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        <span className="text-rose-500 mr-0.5">*</span>E-mail (for Tax Invoice & access)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formErrors.email) setFormErrors((p) => ({ ...p, email: '' }));
                        }}
                        placeholder="contact@business.com.au"
                        className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                      {formErrors.email && (
                        <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>
                      )}
                    </div>

                    {!isSignedIn && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          <span className="text-rose-500 mr-0.5">*</span>Create your password
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (formErrors.password) setFormErrors((p) => ({ ...p, password: '' }));
                            }}
                            placeholder="Minimum 6 characters"
                            className="w-full h-11 pl-3.5 pr-12 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-2 p-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formErrors.password && (
                          <p className="text-xs text-rose-600 mt-1">{formErrors.password}</p>
                        )}
                      </div>
                    )}

                    <div className="pt-1">
                      <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => {
                            setAcceptedTerms(e.target.checked);
                            if (formErrors.acceptedTerms) setFormErrors((p) => ({ ...p, acceptedTerms: '' }));
                          }}
                          className="w-5 h-5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                        />
                        <span className="leading-relaxed">
                          I confirm that I have read and understood the{' '}
                          <button
                            type="button"
                            onClick={() => setActivePolicyModal('terms')}
                            className="text-indigo-600 hover:text-indigo-700 underline font-medium cursor-pointer"
                          >
                            general terms and conditions of RangeCraft
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            onClick={() => setActivePolicyModal('privacy')}
                            className="text-indigo-600 hover:text-indigo-700 underline font-medium cursor-pointer"
                          >
                            privacy policy
                          </button>{' '}
                          and that I agree to them.
                        </span>
                      </label>
                      {formErrors.acceptedTerms && (
                        <p className="text-xs text-rose-600 mt-1.5">{formErrors.acceptedTerms}</p>
                      )}
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={isSubmittingStep1}
                        className="w-full py-3.5 px-6 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                      >
                        {isSubmittingStep1
                          ? 'Saving Account Details...'
                          : isSignedIn
                          ? 'Save Details & Continue to Payment'
                          : 'Create Account & Continue'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </section>

            {/* ============================================================
                STEP 2: PAYMENT (TRANSPARENT PREVIEW -> UNLOCKED)
            ============================================================ */}
            <section
              ref={paymentSectionRef}
              id="checkout-payment-step"
              className={`space-y-6 transition-opacity duration-200 ${
                isStep1Complete ? 'opacity-100' : 'opacity-45 pointer-events-none select-none'
              }`}
              aria-disabled={!isStep1Complete}
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Payment
                </h2>
                {!isStep1Complete && (
                  <span className="text-xs font-medium text-slate-500">
                    Complete business details above to unlock payment
                  </span>
                )}
              </div>

              {/* Itemized Summary (Country Flag + Subscription/Export + Billed Today) */}
              <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-200">
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <CountryFlagBadge country={country} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {getPlanDisplayTitle()} — {country}
                      </div>
                      <div className="text-xs text-slate-500">
                        {planType === 'single_export' || planType === 'one_off_service' || planType === 'ai_topup'
                          ? 'One-time commercial license (inc. GST)'
                          : billingCycle === 'annual'
                          ? 'Annual billing (2 months free applied)'
                          : 'Monthly subscription (inc. GST)'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-900 tabular-nums shrink-0">
                    {format(currentPrice)} inc. GST
                  </div>
                </div>

                <div className="p-5 flex items-center justify-between gap-4 bg-slate-50/50 rounded-b-2xl">
                  <div>
                    <div className="text-sm font-bold text-slate-900">Total billed today ({currency})</div>
                    <div className="text-xs text-slate-500">Single inclusive price (inc. GST)</div>
                  </div>
                  <div className="text-lg font-mono font-extrabold text-slate-900 tabular-nums">
                    {format(currentPrice)}
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Pay with PayPal */}
              <div className="space-y-4">
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900">Pay with PayPal</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {planType === 'single_export' || planType === 'one_off_service'
                        ? 'To complete your order, connect your PayPal account. Clicking the PayPal button below authorizes this one-time payment and unlocks your download immediately.'
                        : 'To complete your account setup, please connect your PayPal account. This is a recurring payment for your subscription. Clicking below authorizes your plan securely and returns you straight to RangeCraft.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExpressPayment('paypal')}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-6 rounded-full bg-[#FFC439] hover:bg-[#f5b922] text-[#003087] font-bold text-base transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Authorizing with PayPal...</span>
                      </>
                    ) : (
                      <>
                        <span className="font-black italic tracking-tight">PayPal</span>
                        <span className="font-semibold text-slate-900">
                          {planType === 'single_export' || planType === 'one_off_service'
                            ? `Checkout · ${format(currentPrice)}`
                            : 'Subscribe'}
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-500">The safer, easier way to pay</p>
                </div>

                {/* Secondary Stripe Hosted Card Escape Hatch */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleExpressPayment('stripe_card')}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 underline underline-offset-4 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Or pay directly by credit/debit card via Stripe</span>
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Clean Minimal Branded Footer */}
      <footer className="border-t border-indigo-200 bg-white mt-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-center space-y-3">
          <div className="flex justify-center">
            <RangeCraftLogo size="sm" themeVariant="light" showSubtitle={false} />
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} RangeCraft AU Pty Ltd · ABN 45 809 237 194 · Level 14, 459 Collins Street, Melbourne
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setActivePolicyModal('terms')}
              className="hover:text-indigo-600 underline underline-offset-2 cursor-pointer"
            >
              Terms & Conditions
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActivePolicyModal('privacy')}
              className="hover:text-indigo-600 underline underline-offset-2 cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Bottom-Right Floating Support Launcher */}
      <div className="fixed bottom-5 right-5 z-40">
        {showHelpDrawer && (
          <div className="mb-3 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl p-5 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Billing & ABN Support</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpDrawer(false)}
                aria-label="Close help"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <div>
                <span className="font-semibold text-slate-900 block">Will I receive an ATO tax invoice?</span>
                Yes. An Australian GST tax invoice with your ABN is generated automatically after checkout and stored in Billing & Invoices.
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Can I cancel or downgrade anytime?</span>
                Yes. Subscriptions have zero lock-in contracts and revert safely to the Free Sandbox without losing your saved SKUs.
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Direct finance desk</span>
                Email <span className="font-mono text-indigo-600">finance@rangecraft.com.au</span> for enterprise PO or EFT invoicing.
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowHelpDrawer((prev) => !prev)}
          aria-label="Billing support and FAQ"
          className="w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ml-auto"
        >
          {showHelpDrawer ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        </button>
      </div>

      {/* Terms / Privacy Inline Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold">
                {activePolicyModal === 'terms' ? 'RangeCraft Terms & Conditions' : 'RangeCraft Privacy Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed max-h-72 overflow-y-auto pr-1">
              {activePolicyModal === 'terms' ? (
                <>
                  <p>
                    Subscriptions and commercial exports are provided by <strong>RangeCraft AU Pty Ltd</strong> (ABN 45 809 237 194) in accordance with Australian Consumer Law (ACL).
                  </p>
                  <p>
                    Monthly and annual plans renew automatically at the end of each billing cycle and may be cancelled at any time from your Billing & Invoices hub with no cancellation penalties.
                  </p>
                  <p>
                    All pricing displayed in AUD includes 10% Goods & Services Tax (GST), itemized on your downloadable tax invoice.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    RangeCraft protects your commercial SKU pricing, cost-of-goods, and supplier co-op data under the Australian Privacy Principles (APPs).
                  </p>
                  <p>
                    Your contact, ABN, and address fields are used strictly for issuing valid ATO tax invoices and securing your workspace account. Payment credentials are processed via encrypted PayPal and Stripe gateways and are never stored on RangeCraft servers.
                  </p>
                </>
              )}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
