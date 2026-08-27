import { 
  AdminAnalyticsSummary, 
  BankAccountConfig, 
  CreatorPayoutRecord, 
  CreatorTransaction, 
  UserDemographicStat, 
  UserTypeStat,
  TradingTerms 
} from '../types';

export const DEFAULT_CREATOR_BANK_CONFIG: BankAccountConfig = {
  accountHolder: 'J. Zaf (App Creator & Founder)',
  bankName: 'Commonwealth Bank of Australia (CommBank)',
  bsb: '062-000',
  accountNumber: '1098 4421',
  payId: 'jzaf666@gmail.com',
  paypalEmail: 'jzaf666@gmail.com',
  country: 'Australia (AUD)'
};

export const INITIAL_BANK_ACCOUNT = DEFAULT_CREATOR_BANK_CONFIG;

export const INITIAL_TRADING_TERMS: TradingTerms[] = [
  {
    id: 'term-metro-fy26',
    title: 'Metro Grocers Supermarkets National Grocery Master Trading Agreement FY26',
    targetAccountId: 'acc-1',
    targetAccountName: 'Metro Grocers Supermarkets AU',
    contactName: 'Brendan Taylor (Category Manager - Snacking & Pantry)',
    contactEmail: 'btaylor@metro-grocers.com.au',
    contactPhone: '+61 2 8885 0000',
    skuScope: 'all_skus',
    selectedCategories: ['Pantry', 'Snacking', 'Beverages'],
    selectedSkuCodes: [],
    baseRatePercent: 10.0,
    rateType: 'scan_sales',
    paymentTermsDays: 30,
    settlementDiscountPercent: 2.0,
    settlementFrequency: 'Monthly Scan',
    overAndAboveSpendAud: 50000,
    overAndAboveDescription: 'Metro Grocers Catalogue Front & Back Half Page Feature, Gondola Ends (W14 & W38), Digital Loyalty Rewards Boost App EDM and Search Placement',
    promotionalPeriod: 'FY26 52-Week Master Cadence (July 2026 - June 2027)',
    agreedPromotionalWeeks: [4, 14, 28, 38, 48, 51],
    hasVolumeIncentive: true,
    volumeThresholdAud: 500000,
    volumeThresholdUnits: 65000,
    incentiveType: 'reduced_payment_terms',
    incentiveRewardDescription: 'Reduced payment terms from 30 days to 14 days for remainder of financial year once $500,000 AUD scan milestone is attained.',
    reducedPaymentTermsDays: 14,
    bonusRebatePercent: 1.5,
    status: 'Signed & Binding',
    effectiveFrom: '2026-07-01',
    effectiveTo: '2027-06-30',
    contractSignee: 'Brendan Taylor & J. Zaf',
    notes: 'Signed via Retailer Trade Partner Portal. Includes national DC delivery compliance.',
    createdAt: '2026-06-15T09:00:00Z',
    updatedAt: '2026-08-01T14:30:00Z'
  },
  {
    id: 'term-apex-fy26',
    title: 'Apex Retail National Confectionery & Grocery Trading Terms',
    targetAccountId: 'acc-2',
    targetAccountName: 'Apex Retail Limited',
    contactName: 'Amanda Collins (Senior Category Buyer)',
    contactEmail: 'amanda.collins@apex-retail.com.au',
    contactPhone: '+61 3 9829 5111',
    skuScope: 'category',
    selectedCategories: ['Gourmet Pantry', 'Artisan Snacking'],
    selectedSkuCodes: [],
    baseRatePercent: 8.5,
    rateType: 'scan_sales',
    paymentTermsDays: 45,
    settlementDiscountPercent: 1.5,
    settlementFrequency: 'Monthly Scan',
    overAndAboveSpendAud: 35000,
    overAndAboveDescription: 'Retail Online Hero Carousel, App Triggered Rewards banner, and Front-of-Store Display Bin Placement',
    promotionalPeriod: 'FY26 52-Week Promotional Calendar',
    agreedPromotionalWeeks: [6, 16, 26, 36, 46],
    hasVolumeIncentive: true,
    volumeThresholdAud: 350000,
    incentiveType: 'bonus_rebate_percent',
    incentiveRewardDescription: 'Additional +2.0% growth co-op funding if annual scan sales exceed $350k.',
    bonusRebatePercent: 2.0,
    status: 'Under Negotiation',
    effectiveFrom: '2026-08-01',
    effectiveTo: '2027-07-31',
    contractSignee: 'Pending Final Execution',
    notes: 'Awaiting revised scan rebate reconciliation matrix for Q2.',
    createdAt: '2026-07-20T11:15:00Z',
    updatedAt: '2026-08-10T16:00:00Z'
  },
  {
    id: 'term-independent-wholesale',
    title: 'Independent Retailers & Wholesale Network Agreement',
    targetAccountId: 'acc-3',
    targetAccountName: 'Independent Retailers & Wholesale Group',
    contactName: 'David Zhang (National Merchandising Manager)',
    contactEmail: 'david.zhang@wholesale-network.com.au',
    contactPhone: '+61 2 9741 3000',
    skuScope: 'selected_skus',
    selectedCategories: [],
    selectedSkuCodes: ['SKU-01', 'SKU-02', 'SKU-04'],
    baseRatePercent: 6.0,
    rateType: 'off_invoice',
    paymentTermsDays: 30,
    settlementDiscountPercent: 2.5,
    settlementFrequency: 'Quarterly Invoiced',
    overAndAboveSpendAud: 18000,
    overAndAboveDescription: 'National Deal Sheet, Independent Mailer, and Regional Wholesaler Floor Display Deals',
    promotionalPeriod: 'H1 FY27 Master Plan',
    agreedPromotionalWeeks: [4, 18, 30, 42],
    hasVolumeIncentive: false,
    volumeThresholdAud: 200000,
    incentiveType: 'reduced_payment_terms',
    incentiveRewardDescription: 'Reduced payment terms on case volume milestone.',
    status: 'Signed & Binding',
    effectiveFrom: '2026-07-01',
    effectiveTo: '2026-12-31',
    contractSignee: 'David Zhang & Sales Director',
    notes: 'Covering national distribution centres.',
    createdAt: '2026-06-25T10:00:00Z',
    updatedAt: '2026-07-05T09:00:00Z'
  }
];

export const INITIAL_USER_DEMOGRAPHICS: UserDemographicStat[] = [
  { region: 'Oceania', state: 'NSW', city: 'Sydney', usersCount: 184, percentage: 38.5, revenueAud: 19850 },
  { region: 'Oceania', state: 'VIC', city: 'Melbourne', usersCount: 142, percentage: 29.7, revenueAud: 14200 },
  { region: 'Oceania', state: 'QLD', city: 'Brisbane', usersCount: 68, percentage: 14.2, revenueAud: 6100 },
  { region: 'Oceania', state: 'WA', city: 'Perth', usersCount: 34, percentage: 7.1, revenueAud: 3450 },
  { region: 'Oceania', state: 'SA', city: 'Adelaide', usersCount: 22, percentage: 4.6, revenueAud: 1950 },
  { region: 'Oceania', state: 'Auckland', city: 'Auckland (NZ)', usersCount: 18, percentage: 3.8, revenueAud: 2100 },
  { region: 'International', state: 'UK', city: 'London', usersCount: 6, percentage: 1.3, revenueAud: 998 },
  { region: 'International', state: 'Singapore', city: 'Singapore', usersCount: 4, percentage: 0.8, revenueAud: 640 },
];

export const INITIAL_USER_TYPE_STATS: UserTypeStat[] = [
  { type: 'FMCG Brand Reps & KAMs', count: 204, percentage: 42.7, avgDealSizeAud: 149, color: '#3b82f6' },
  { type: 'Retail Category Buyers (Supermarkets)', count: 115, percentage: 24.1, avgDealSizeAud: 499, color: '#10b981' },
  { type: 'Wholesale & B2B Distributors', count: 86, percentage: 18.0, avgDealSizeAud: 499, color: '#8b5cf6' },
  { type: 'Amazon & Marketplace Sellers', count: 52, percentage: 10.9, avgDealSizeAud: 149, color: '#f59e0b' },
  { type: 'D2C E-Commerce & Founders', count: 21, percentage: 4.3, avgDealSizeAud: 149, color: '#ec4899' },
];

export const INITIAL_CREATOR_TRANSACTIONS: CreatorTransaction[] = [
  {
    id: 'txn-1092',
    timestamp: '2026-08-15T14:22:00.000Z',
    userEmail: 'sarah.m@campbellsfmcg.com.au',
    userName: 'Sarah Miller',
    companyName: 'Campbell FMCG Brands Australia',
    itemDescription: 'Commercial Pro Plan (Annual - $1,430/yr)',
    itemType: 'subscription_annual',
    amountAud: 1430,
    paymentMethod: 'paypal',
    paypalTransactionId: 'PP-AU-9821884210',
    status: 'completed'
  },
  {
    id: 'txn-1091',
    timestamp: '2026-08-15T11:45:00.000Z',
    userEmail: 't.harris@beveragegroup.com.au',
    userName: 'Thomas Harris',
    companyName: 'Pure Spring Beverages AU',
    itemDescription: 'Executive JBP Deck & Trade Review Service (1-on-1)',
    itemType: 'service_jbp_review',
    amountAud: 899,
    paymentMethod: 'paypal',
    paypalTransactionId: 'PP-AU-7719203819',
    status: 'completed'
  },
  {
    id: 'txn-1090',
    timestamp: '2026-08-14T19:10:00.000Z',
    userEmail: 'claire.z@national-grocer-supplier.com',
    userName: 'Claire Zhang',
    companyName: 'Organic Harvest Co',
    itemDescription: 'Enterprise Portfolio Plan (Monthly - $499/mo)',
    itemType: 'subscription_monthly',
    amountAud: 499,
    paymentMethod: 'credit_card',
    status: 'completed'
  },
  {
    id: 'txn-1089',
    timestamp: '2026-08-14T16:05:00.000Z',
    userEmail: 'dave@pacificsnackworks.com',
    userName: 'David Kelly',
    companyName: 'Pacific Snackworks Pty Ltd',
    itemDescription: 'ACCC 4-Week Hiatus Compliance Audit & Certification',
    itemType: 'service_accc_audit',
    amountAud: 450,
    paymentMethod: 'paypal',
    paypalTransactionId: 'PP-AU-5541092841',
    status: 'completed'
  },
  {
    id: 'txn-1088',
    timestamp: '2026-08-13T10:30:00.000Z',
    userEmail: 'marcus.v@distribcorp.co.nz',
    userName: 'Marcus Vance',
    companyName: 'Vance Wholesale Logistics NZ',
    itemDescription: 'Commercial Pro Plan (Monthly - $149/mo)',
    itemType: 'subscription_monthly',
    amountAud: 149,
    paymentMethod: 'credit_card',
    status: 'completed'
  },
  {
    id: 'txn-1087',
    timestamp: '2026-08-12T15:15:00.000Z',
    userEmail: 'j.bradley@healthnaturals.com.au',
    userName: 'Jessica Bradley',
    companyName: 'Aussie Health Naturals',
    itemDescription: 'Commercial Pro Plan (Annual - $1,430/yr)',
    itemType: 'subscription_annual',
    amountAud: 1430,
    paymentMethod: 'paypal',
    paypalTransactionId: 'PP-AU-3301984712',
    status: 'completed'
  },
  {
    id: 'txn-1086',
    timestamp: '2026-08-11T09:40:00.000Z',
    userEmail: 'rob.smith@bakersdelight-franchise.com',
    userName: 'Robert Smith',
    companyName: 'Gourmet Pastry Distributors',
    itemDescription: 'Custom CSV SKU Catalog Database Onboarding Service',
    itemType: 'service_custom_import',
    amountAud: 299,
    paymentMethod: 'credit_card',
    status: 'completed'
  },
  {
    id: 'txn-1085',
    timestamp: '2026-08-10T13:20:00.000Z',
    userEmail: 'elena.k@chemistbrands.com.au',
    userName: 'Elena Kostas',
    companyName: 'MediSkin Australia Pty Ltd',
    itemDescription: 'Enterprise Portfolio Plan (Annual - $4,790/yr)',
    itemType: 'subscription_annual',
    amountAud: 4790,
    paymentMethod: 'bank_transfer',
    status: 'completed'
  }
];

export const INITIAL_CREATOR_PAYOUTS: CreatorPayoutRecord[] = [
  {
    id: 'payout-104',
    timestamp: '2026-08-01T10:00:00.000Z',
    amountAud: 12500,
    payoutMethod: 'bank_transfer',
    bankName: 'Commonwealth Bank of Australia',
    bsb: '062-000',
    accountNumberMasked: '•••• 4421',
    accountName: 'J. Zaf',
    reference: 'PAYOUT-PROMOSTRAT-JULY26',
    status: 'Settled',
    settledDate: '2026-08-02'
  },
  {
    id: 'payout-103',
    timestamp: '2026-07-01T09:30:00.000Z',
    amountAud: 9800,
    payoutMethod: 'bank_transfer',
    bankName: 'Commonwealth Bank of Australia',
    bsb: '062-000',
    accountNumberMasked: '•••• 4421',
    accountName: 'J. Zaf',
    reference: 'PAYOUT-PROMOSTRAT-JUNE26',
    status: 'Settled',
    settledDate: '2026-07-02'
  },
  {
    id: 'payout-102',
    timestamp: '2026-06-01T11:15:00.000Z',
    amountAud: 8200,
    payoutMethod: 'bank_transfer',
    bankName: 'Commonwealth Bank of Australia',
    bsb: '062-000',
    accountNumberMasked: '•••• 4421',
    accountName: 'J. Zaf',
    reference: 'PAYOUT-PROMOSTRAT-MAY26',
    status: 'Settled',
    settledDate: '2026-06-02'
  }
];

export const ONE_OFF_SERVICES = [
  {
    id: 'service_jbp_review' as const,
    title: '1-on-1 Australian Retail JBP Review & Pitch Deck Audit',
    priceAud: 899,
    turnaround: '48-Hour Express',
    description: 'Direct category strategy review by Australian FMCG experts. We audit your promotional depth, scan funding model, and craft a buyer-ready slide presentation for major supermarket channels.',
    deliverables: [
      'Comprehensive margin & scan funding spreadsheet audit',
      'ACCC 4-Week Hiatus compliance certificate',
      'Buyer pitch deck (Keynote/PowerPoint + PDF)',
      '1-hour live strategy advisory video call'
    ]
  },
  {
    id: 'service_accc_audit' as const,
    title: 'ACCC 4-Week Hiatus Compliance Audit & Verification',
    priceAud: 450,
    turnaround: '24-Hour Turnaround',
    description: 'Full statutory verification ensuring all 52 promotional weeks comply with Australian Consumer Law Section 18/29 normal selling price hiatus rules.',
    deliverables: [
      'Statutory 52-week calendar compliance report',
      'Baseline gap verification for major grocery channels',
      'Audit certificate for retailer legal sign-off'
    ]
  },
  {
    id: 'service_custom_import' as const,
    title: 'Custom ERP / POS Catalog Database Onboarding',
    priceAud: 299,
    turnaround: 'Same-Day Setup',
    description: 'White-glove data migration service. We take your SAP, NetSuite, Pronto, Cin7, or Shopify CSV export and format it for RangeCraft with custom category tags.',
    deliverables: [
      'Full catalog cleanup and hierarchy structuring',
      'Baseline sales velocity calibration',
      'Custom seasonal tag configuration'
    ]
  }
];

export const ADMIN_ANALYTICS_SUMMARY_MOCK: AdminAnalyticsSummary = {
  totalUsers: 478,
  paidSubscribers: 289,
  trialUsers: 189,
  churnRatePercent: 1.8,
  totalRevenueAud: 48900,
  mrrAud: 19800,
  arrAud: 237600,
  pendingPayoutBalanceAud: 18400,
  totalPaidOutAud: 30500,
  userTypeDistribution: INITIAL_USER_TYPE_STATS,
  demographicsDistribution: INITIAL_USER_DEMOGRAPHICS,
  recentTransactions: INITIAL_CREATOR_TRANSACTIONS,
  payoutHistory: INITIAL_CREATOR_PAYOUTS
};
