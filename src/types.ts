export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  contrastRatio: string;
  bestFor: string;
  palette: {
    bg: string;
    card: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    border: string;
    liftGreen: string;
  };
}

export interface SkuCatalog {
  id: string;
  name: string;
  description?: string;
  categoryFocus?: string;
  retailerBanner?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
  products: Product[];
  promotions?: WeekPromotion[];
}

export type PerformanceTier = 'tier1_hero' | 'tier2_margin' | 'tier3_niche' | 'tier4_clearance';

export type StrategicObjective =
  | 'volume_grab'
  | 'margin_builder'
  | 'basket_driver'
  | 'clearance'
  | 'event_hero'
  | 'competitive_defense';

export type MechanicType =
  | 'percentage_off'
  | 'price_drop'
  | 'multi_buy'
  | 'bundle_gwp'
  | 'clearance_markdown'
  | 'bogo';

export type CataloguePlacement =
  | 'front_cover'
  | 'double_spread'
  | 'category_feature'
  | 'digital_app'
  | 'checkout_end';

export interface Product {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  rrp: number; // AUD Recommended Retail Price
  cost: number; // AUD Unit COGS
  marginPercent: number; // Regular Baseline Margin %
  weeklyUnitsBaseline: number; // Typical weekly unpromoted volume
  performanceTier: PerformanceTier;
  seasonalPeak: string; // e.g. "Summer / Australia Day", "Winter Warmers", "All Year"
  targetWeeks: number[]; // Recommended promotional week numbers in AU calendar
  tags: string[];
  stockLevel: number;
  competitorBenchmark?: {
    competitor: string;
    typicalPromoMechanic: string;
    typicalPromoPriceAud: number;
  };
  supplierCoOpEligible?: boolean;
  minPromoGapWeeks: number; // ACCC / baseline protection hiatus (e.g. 4-6 weeks)
  minMarginPercent?: number; // Minimum acceptable margin %
  maxDiscountDepthPercent?: number; // Max discount depth %
  targetVolumeLiftPercent?: number; // Target lift %
  description?: string;
}

export interface PromoMechanic {
  type: MechanicType;
  discountValue: number; // e.g. 25 for 25% off, or 10 for $10 off, or 2 for multi-buy
  promoRrp: number; // AUD promotional selling price
  label: string; // e.g. "Save 30%", "2 for $35", "$49 Hot Buy"
  supplierFundingPerUnit: number; // Trade scan funding AUD per unit from vendor
}

export interface WeekPromotion {
  weekNumber: number; // 1 to 52
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  month: string; // "Jan", "Feb", etc.
  startDate: string; // "06 Jan 2026"
  endDate: string; // "12 Jan 2026"
  australianEvent?: string; // "Australia Day Weekend", "EOFY Super Sale", etc.
  isMajorRetailMoment: boolean;
  campaignTheme: string;
  strategicObjective: StrategicObjective;
  heroSku: string;
  secondarySkus: string[];
  mechanic: PromoMechanic;
  cataloguePlacement: CataloguePlacement;
  activeChannels: string[]; // ['Print Catalogue', 'Digital App Push', 'In-Store Gondola', 'EDM Newsletter', 'Meta/Google Ads']
  projectedUnits: number;
  projectedRevenueAud: number;
  projectedMarginPercent: number;
  projectedMarginAud: number;
  tradeSpendAud: number;
  clashWarnings: ClashReport[];
  isAiGenerated?: boolean;
  notes?: string;
}

export interface ClashReport {
  id: string;
  weekNumber: number;
  type: 'category_cannibalization' | 'hiatus_breach' | 'seasonality_mismatch' | 'margin_dilution';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  affectedSkus: string[];
}

export interface QuarterlySummary {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  label: string;
  totalRevenueAud: number;
  totalGrossProfitAud: number;
  blendedMarginPercent: number;
  totalVolumeUnits: number;
  heroCampaignsCount: number;
  keyEvents: string[];
}

export interface StrategyKPIs {
  annualProjectedRevenueAud: number;
  baselineRevenueAud: number;
  totalIncrementalRevenueAud: number;
  overallLiftPercent: number;
  blendedPromoMarginPercent: number;
  totalGrossProfitAud: number;
  annualGrossProfitAud: number;
  annualProjectedUnits: number;
  totalTradeSpendCoOpAud: number;
  totalTradeSpendFundingAud: number;
  totalClashesCount: number;
  criticalClashesCount: number;
  promotedSkusCount: number;
}

export interface MarketIntelligenceReport {
  productAnalysed: string;
  marketOverview: string;
  competitorMechanics: {
    competitor: string;
    typicalMechanic: string;
    promoFrequency: string;
    priceRange: string;
  }[];
  optimalDiscountMechanics: {
    mechanic: string;
    discountDepth: string;
    recommendedPromoPriceAUD: number;
    expectedVolumeLiftPercent: number;
    marginProtectionScore: string;
    bestUsedDuring: string;
  }[];
  seasonalTimingRecommendations: {
    seasonOrEvent: string;
    weekNumber: number;
    rationale: string;
    priority: string;
  }[];
  acccComplianceTips: string[];
  supplierNegotiationTip: string;
}

export type AppTab = 
  | 'overview' 
  | 'commercial-journey'
  | 'calendar' 
  | 'week-studio' 
  | 'catalog' 
  | 'analytics' 
  | 'market-intel' 
  | 'clashes' 
  | 'executive-briefing' 
  | 'activity-log' 
  | 'crm' 
  | 'billing'
  | 'deletion-engine'
  | 'breakeven-basket';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  category: 'Catalog' | 'Promotion' | 'AI Strategy' | 'Compliance' | 'System' | 'Auth' | 'Export' | 'CRM' | 'Finance' | 'Subscription';
  action: string;
  description: string;
  userEmail?: string;
}

export type SubscriptionTier = 'free_trial' | 'pro_planner' | 'enterprise_tier';

export type AiAgentSuite = 
  | 'range-diagnostics' // 1. Range Diagnostics Suite (SKU Health Scoring, Margin Analyzer, Deletion Engine)
  | 'omni-crm'           // 2. Omni-Trade CRM Suite (Account Pipeline, Trade Spend Tracker, Buyer Dossiers)
  | 'master-trade'       // 3. 52-Week Master Trade Suite (52-Week Grid, ACCC Hiatus Guard, Retail Calendar)
  | 'week-pitch';        // 4. Week Studio & Pitch Suite (Breakeven Simulator, Cross-Merch Basket Builder, Pitch Generator)

export type ExportUnlockType = 
  | 'q3_q4_calendar'
  | 'sku_deletion_audit'
  | 'excel_trade_planner'
  | 'white_label_pdf'
  | 'pitch_deck_pptx';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  companyName?: string;
  jobRole?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'cancelled';
  aiGenerationsRemaining: number;
  unlimitedAi: boolean;
  canExportPdf: boolean;
  canAutoReslot: boolean;
  maxSkusAllowed: number;
  unlockedExports?: string[]; // IDs of single pay-per-export items unlocked ($19 each)
  trialExpiresAt?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  priceAud: number;
  billingPeriod: 'month' | 'year';
  popularBadge?: string;
  tagline: string;
  features: {
    text: string;
    included: boolean;
    highlight?: boolean;
  }[];
  ctaText: string;
}

export type BusinessPersona = 
  | 'independent_shop' 
  | 'amazon_ebay_seller' 
  | 'brand_sales_rep' 
  | 'retail_buyer' 
  | 'distributor' 
  | 'd2c_ecommerce_manager';

export type CrmAccountType = 
  | 'Retailer' 
  | 'Marketplace Partner' 
  | 'Wholesale Distributor' 
  | 'Direct Consumer Brand' 
  | 'Independent Shop';

export type CrmAccountStatus = 
  | 'Active Partner' 
  | 'Negotiating' 
  | 'Prospect' 
  | 'Dormant';

export interface CrmAccount {
  id: string;
  name: string;
  companyType: CrmAccountType;
  contactName: string;
  email: string;
  phone: string;
  status: CrmAccountStatus;
  assignedSkuSkus: string[];
  totalPipelineValueAud: number;
  creditTerms: string;
  notes: string;
  lastInteractionDate: string;
  marketRegion: string; // e.g. "Australia", "North America", "United Kingdom", "Global Online"
}

export type DealStage = 
  | 'Prospecting' 
  | 'Pitch Sent' 
  | 'Negotiation' 
  | 'Contracted' 
  | 'Closed Won' 
  | 'Lost';

export interface CrmDeal {
  id: string;
  title: string;
  accountId: string;
  accountName: string;
  stage: DealStage;
  valueAud: number;
  targetWeekNum: number;
  assignedSku: string;
  probabilityPercent: number;
  expectedCloseDate: string;
}

export type ActivityType = 
  | 'Call' 
  | 'Range Review' 
  | 'Sample Dispatch' 
  | 'Co-op Pitch' 
  | 'Contract Signing' 
  | 'Email';

export interface CrmActivity {
  id: string;
  accountId: string;
  accountName: string;
  type: ActivityType;
  subject: string;
  notes: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Follow-up Required';
  userEmail: string;
}

// ---------------------------------------------------------------------------
// RETAIL TRADING TERMS SPECIFICATION
// ---------------------------------------------------------------------------
export type TradingTermsSkuScope = 'all_skus' | 'category' | 'selected_skus';

export type TradingTermsRateType = 
  | 'scan_sales' 
  | 'invoice_turnover' 
  | 'off_invoice' 
  | 'settlement_discount';

export type TradingTermsIncentiveType = 
  | 'reduced_payment_terms' 
  | 'bonus_rebate_percent' 
  | 'growth_rebate' 
  | 'exclusive_co_op';

export type TradingTermsStatus = 
  | 'Draft' 
  | 'Under Negotiation' 
  | 'Signed & Binding' 
  | 'Expired';

export interface TradingTerms {
  id: string;
  title: string;
  targetAccountId: string;
  targetAccountName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // SKU / Category Scope
  skuScope: TradingTermsSkuScope;
  selectedCategories: string[]; // e.g. ["Gourmet Pantry", "Beverages"]
  selectedSkuCodes: string[]; // e.g. ["SKU-01", "SKU-05"]
  
  // Base Trading Terms
  baseRatePercent: number; // e.g. 10.0 for 10% of scan sales
  rateType: TradingTermsRateType;
  paymentTermsDays: number; // e.g. 30, 45, 60, 90 days
  settlementDiscountPercent: number; // e.g. 2.5% for prompt settlement
  settlementFrequency: 'Monthly Scan' | 'Quarterly Invoiced' | 'Annual Retrospective';
  
  // Over & Above (O&A) Spend
  overAndAboveSpendAud: number; // e.g. 50000
  overAndAboveDescription: string; // e.g. "Catalogue Front Cover, Gondola Ends, Digital Retail Media & EDM"
  promotionalPeriod: string; // e.g. "FY26 52-Week Master Cadence"
  agreedPromotionalWeeks?: number[];
  
  // Volume-Based Performance Incentives
  hasVolumeIncentive: boolean;
  volumeThresholdAud: number; // e.g. 500000
  volumeThresholdUnits?: number; // e.g. 50000
  incentiveType: TradingTermsIncentiveType;
  incentiveRewardDescription: string; // e.g. "Reduced payment terms from 60 days to 14 days for remainder of financial year when target reached"
  reducedPaymentTermsDays?: number; // e.g. 14
  bonusRebatePercent?: number; // e.g. 2.0%
  
  // Metadata & Audit
  status: TradingTermsStatus;
  effectiveFrom: string;
  effectiveTo: string;
  contractSignee?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// APP CREATOR PASSIVE INCOME, SALES & BUILDER ADMIN ANALYTICS
// ---------------------------------------------------------------------------
export type OneOffServiceType = 
  | 'service_jbp_review' 
  | 'service_accc_audit' 
  | 'service_custom_import';

export interface CreatorTransaction {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  companyName: string;
  itemDescription: string;
  itemType: 'subscription_monthly' | 'subscription_annual' | OneOffServiceType;
  amountAud: number;
  paymentMethod: 'paypal' | 'credit_card' | 'bank_transfer';
  paypalTransactionId?: string;
  status: 'completed' | 'refunded' | 'pending';
}

export interface CreatorPayoutRecord {
  id: string;
  timestamp: string;
  amountAud: number;
  payoutMethod: 'bank_transfer' | 'payid' | 'paypal';
  bankName: string;
  bsb: string;
  accountNumberMasked: string;
  accountName: string;
  reference: string;
  status: 'Settled' | 'Processing';
  settledDate: string;
}

export interface BankAccountConfig {
  accountHolder: string;
  bankName: string;
  bsb: string;
  accountNumber: string;
  payId?: string;
  paypalEmail?: string;
  country: string;
}

export interface UserDemographicStat {
  region: string;
  state: string;
  city: string;
  usersCount: number;
  percentage: number;
  revenueAud: number;
}

export interface UserTypeStat {
  type: string;
  count: number;
  percentage: number;
  avgDealSizeAud: number;
  color: string;
}

export interface AdminAnalyticsSummary {
  totalUsers: number;
  paidSubscribers: number;
  trialUsers: number;
  churnRatePercent: number;
  totalRevenueAud: number;
  mrrAud: number;
  arrAud: number;
  pendingPayoutBalanceAud: number;
  totalPaidOutAud: number;
  userTypeDistribution: UserTypeStat[];
  demographicsDistribution: UserDemographicStat[];
  recentTransactions: CreatorTransaction[];
  payoutHistory: CreatorPayoutRecord[];
}

