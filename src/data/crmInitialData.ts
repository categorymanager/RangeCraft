import { CrmAccount, CrmDeal, CrmActivity } from '../types';

// Default empty CRM datasets for clean user onboarding
export const INITIAL_CRM_ACCOUNTS: CrmAccount[] = [];
export const INITIAL_CRM_DEALS: CrmDeal[] = [];
export const INITIAL_CRM_ACTIVITIES: CrmActivity[] = [];

// Optional sample FMCG datasets available via "Load Sample CRM Records" button
export const SAMPLE_CRM_ACCOUNTS: CrmAccount[] = [
  {
    id: 'acc-1',
    name: 'National Supermarket Network (Coles / Woolworths)',
    companyType: 'Retailer',
    contactName: 'Sarah Jenkins (Senior Category Mgr)',
    email: 'sjenkins@nationalretailnetwork.com.au',
    phone: '+61 2 8885 9000',
    status: 'Active Partner',
    assignedSkuSkus: ['SKU-FMC-001', 'SKU-FMC-003', 'SKU-FMC-005'],
    totalPipelineValueAud: 485000,
    creditTerms: 'Net 45 Days (Scan-Based Trading)',
    notes: 'Key national grocery account. Enforce 4-week hiatus compliance between major catalogue promotions.',
    lastInteractionDate: '2026-08-10',
    marketRegion: 'Australia & New Zealand'
  },
  {
    id: 'acc-2',
    name: 'Metcash & Independent Grocers Network (IGA)',
    companyType: 'Wholesale Distributor',
    contactName: 'Liam O Connor (Category Lead)',
    email: 'liam.oconnor@metcashdealers.com.au',
    phone: '+61 3 9912 4400',
    status: 'Active Partner',
    assignedSkuSkus: ['SKU-ELE-003', 'SKU-ELE-004', 'SKU-OUT-004'],
    totalPipelineValueAud: 320000,
    creditTerms: 'Net 30 Days + Warehouse Scan Rebate',
    notes: 'High volume wholesale distributor across 1,400+ independent supermarket doors.',
    lastInteractionDate: '2026-08-12',
    marketRegion: 'Australia'
  },
  {
    id: 'acc-3',
    name: 'Metro Grocers & Convenience Chains',
    companyType: 'Retailer',
    contactName: 'Michael Thorne (Merchandising Director)',
    email: 'mthorne@metrogrocers.com.au',
    phone: '+61 3 9829 5111',
    status: 'Negotiating',
    assignedSkuSkus: ['SKU-FMC-002', 'SKU-FMC-004', 'SKU-HLT-001'],
    totalPipelineValueAud: 610000,
    creditTerms: 'Net 30 Days + Co-op Endcap Rebate',
    notes: 'Pitching Spring seasonal front-end display placements for Q3. Margin model approved.',
    lastInteractionDate: '2026-08-14',
    marketRegion: 'Australia'
  }
];

export const SAMPLE_CRM_DEALS: CrmDeal[] = [
  {
    id: 'deal-1',
    title: 'National Network Australia Day Super Feature (W4)',
    accountId: 'acc-1',
    accountName: 'National Supermarket Network (Coles / Woolworths)',
    valueAud: 95000,
    stage: 'Contracted',
    probabilityPercent: 100,
    expectedCloseDate: '2026-01-20',
    assignedSku: 'SKU-FMC-001',
    targetWeekNum: 4
  },
  {
    id: 'deal-2',
    title: 'IGA Mid-Year Mega Sale Gondola Feature',
    accountId: 'acc-2',
    accountName: 'Metcash & Independent Grocers Network (IGA)',
    valueAud: 140000,
    stage: 'Negotiation',
    probabilityPercent: 75,
    expectedCloseDate: '2026-06-15',
    assignedSku: 'SKU-ELE-003',
    targetWeekNum: 28
  },
  {
    id: 'deal-3',
    title: 'Metro Grocers Footy Finals Front-End Placement',
    accountId: 'acc-3',
    accountName: 'Metro Grocers & Convenience Chains',
    valueAud: 180000,
    stage: 'Pitch Sent',
    probabilityPercent: 60,
    expectedCloseDate: '2026-08-25',
    assignedSku: 'SKU-FMC-002',
    targetWeekNum: 38
  }
];

export const SAMPLE_CRM_ACTIVITIES: CrmActivity[] = [
  {
    id: 'act-1',
    accountId: 'acc-1',
    accountName: 'National Supermarket Network (Coles / Woolworths)',
    type: 'Range Review',
    subject: 'Q3 Range Review & ACCC Hiatus Audit',
    notes: 'Verified 4-week hiatus compliance before locking W36 front-cover catalogue feature.',
    date: '2026-08-10',
    status: 'Completed',
    userEmail: 'user@rangecraft.au'
  },
  {
    id: 'act-2',
    accountId: 'acc-3',
    accountName: 'Metro Grocers & Convenience Chains',
    type: 'Call',
    subject: 'Follow-up on Footy Finals Co-Op Agreement',
    notes: 'Agreed on scan rate rebate funding of $1.50/unit for targeted volume lift.',
    date: '2026-08-14',
    status: 'Completed',
    userEmail: 'user@rangecraft.au'
  }
];
