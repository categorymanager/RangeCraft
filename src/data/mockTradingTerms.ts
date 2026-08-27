import { TradingTerms } from '../types';

export const INITIAL_TRADING_TERMS: TradingTerms[] = [
  {
    id: 'tt-national-retail-2026',
    title: 'National Supermarket Network Master Vendor Agreement FY26',
    targetAccountId: 'acc-1',
    targetAccountName: 'National Supermarket Network (Tier-1)',
    contactName: 'Sarah Jenkins (Senior Category Mgr)',
    contactEmail: 'sjenkins@nationalretailnetwork.com.au',
    contactPhone: '+61 2 8885 9000',
    
    skuScope: 'all_skus',
    selectedCategories: [],
    selectedSkuCodes: [],
    
    baseRatePercent: 10.0,
    rateType: 'scan_sales',
    paymentTermsDays: 45,
    settlementDiscountPercent: 2.0,
    settlementFrequency: 'Monthly Scan',
    
    overAndAboveSpendAud: 50000,
    overAndAboveDescription: 'National Fresh Catalogue Double-Spread & Loyalty App Digital Push',
    promotionalPeriod: 'FY2026 52-Week Master Cadence (Weeks 1 - 52)',
    agreedPromotionalWeeks: [4, 13, 26, 38, 48, 51],
    
    hasVolumeIncentive: true,
    volumeThresholdAud: 750000,
    volumeThresholdUnits: 85000,
    incentiveType: 'reduced_payment_terms',
    incentiveRewardDescription: 'Payment terms reduced from 45 days to 14 days (Net 14 EFT) for the remainder of FY26 once $750,000 scan sales target is reached.',
    reducedPaymentTermsDays: 14,
    bonusRebatePercent: 1.5,
    
    status: 'Signed & Binding',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    contractSignee: 'National Commercial Sales Director',
    notes: 'Binding joint business planning terms. Includes scan rebate audit rights and guaranteed 4-week ACCC baseline gap protection.',
    createdAt: '2026-01-05T09:00:00.000Z',
    updatedAt: '2026-08-10T14:30:00.000Z'
  },
  {
    id: 'tt-metro-grocery-2026',
    title: 'Metro Grocers Category Terms & Spring Co-Op Growth Tier',
    targetAccountId: 'acc-3',
    targetAccountName: 'Metro Grocers Category Planning',
    contactName: 'Michael Thorne (Merchandising Director)',
    contactEmail: 'mthorne@metrogrocers.com.au',
    contactPhone: '+61 3 9829 5111',
    
    skuScope: 'category',
    selectedCategories: ['Beverages', 'Pantry & Cooking', 'Snacks & Confectionery'],
    selectedSkuCodes: [],
    
    baseRatePercent: 8.5,
    rateType: 'scan_sales',
    paymentTermsDays: 60,
    settlementDiscountPercent: 2.5,
    settlementFrequency: 'Monthly Scan',
    
    overAndAboveSpendAud: 35000,
    overAndAboveDescription: 'Front-of-Store Gondola Endcaps (W38 & W48) + Member Digital Flyer Campaign',
    promotionalPeriod: 'Spring & Summer Peak (Weeks 36 - 52)',
    agreedPromotionalWeeks: [38, 42, 48, 50],
    
    hasVolumeIncentive: true,
    volumeThresholdAud: 450000,
    volumeThresholdUnits: 50000,
    incentiveType: 'reduced_payment_terms',
    incentiveRewardDescription: 'Reduced payment terms from 60 days to 21 days plus +1.5% retrospective bonus tier when category turnover surpasses $450,000.',
    reducedPaymentTermsDays: 21,
    bonusRebatePercent: 1.5,
    
    status: 'Under Negotiation',
    effectiveFrom: '2026-07-01',
    effectiveTo: '2026-12-31',
    contractSignee: 'Lead Category KAM',
    notes: 'Awaiting merchandising sign-off for Spring aisle expansion.',
    createdAt: '2026-06-15T11:00:00.000Z',
    updatedAt: '2026-08-14T16:00:00.000Z'
  },
  {
    id: 'tt-ecommerce-fba-2026',
    title: 'Global Online Marketplace Vendor & Mega Sale Co-Op Terms',
    targetAccountId: 'acc-2',
    targetAccountName: 'Global Online Marketplace Hub (AU/NZ/US)',
    contactName: 'Liam O Connor (Account Lead)',
    contactEmail: 'liam.oconnor@marketplacehub.seller.com',
    contactPhone: '+61 3 9912 4400',
    
    skuScope: 'selected_skus',
    selectedCategories: [],
    selectedSkuCodes: ['SKU-OUT-001', 'SKU-OUT-004', 'SKU-ELE-003', 'SKU-ELE-004'],
    
    baseRatePercent: 12.0,
    rateType: 'scan_sales',
    paymentTermsDays: 14,
    settlementDiscountPercent: 0,
    settlementFrequency: 'Monthly Scan',
    
    overAndAboveSpendAud: 18000,
    overAndAboveDescription: 'Prime Mega Deals Homepage Header & Sponsored Brand Keyword Placement',
    promotionalPeriod: 'Mid-Year Flash & Q4 Peak (Weeks 28 & 47)',
    agreedPromotionalWeeks: [28, 47],
    
    hasVolumeIncentive: true,
    volumeThresholdAud: 300000,
    volumeThresholdUnits: 25000,
    incentiveType: 'bonus_rebate_percent',
    incentiveRewardDescription: '2% extra co-op marketing credits funded by marketplace if annual GMV reaches $300,000.',
    reducedPaymentTermsDays: 7,
    bonusRebatePercent: 2.0,
    
    status: 'Signed & Binding',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    contractSignee: 'E-Commerce Growth Manager',
    notes: 'FBA direct inventory fulfillment terms with automated buy-box promotional price matching.',
    createdAt: '2026-01-10T14:00:00.000Z',
    updatedAt: '2026-08-12T10:15:00.000Z'
  }
];
