export interface FmcgTermDefinition {
  term: string;
  shortLabel: string;
  category: 'Margin & Pricing' | 'Trade Spend & Rebates' | 'Compliance & Retail' | 'Strategy & Planning';
  definition: string;
  formula?: string;
  example: string;
  proTip: string;
}

export const FMCG_GLOSSARY: Record<string, FmcgTermDefinition> = {
  'scan-rebate': {
    term: 'Scan Rebate (Scan Funding)',
    shortLabel: 'Scan Rebate',
    category: 'Trade Spend & Rebates',
    definition: 'A variable trade promotional allowance funded by the manufacturer/supplier and paid to the retailer for every unit scanned and sold at checkout during an agreed promotional week.',
    formula: 'Total Scan Spend = Units Sold × Scan Rebate AUD/Unit',
    example: 'A $2.00 scan funding on a $10 RRP item discounted to $7.50 ensures the retailer maintains their required percentage margin while driving volume lift.',
    proTip: 'Always calculate your net post-scan contribution to ensure the incremental volume delivers higher gross profit dollars.'
  },
  'baseline-volume': {
    term: 'Baseline Volume (Run-Rate)',
    shortLabel: 'Baseline Vol',
    category: 'Strategy & Planning',
    definition: 'The standard expected weekly unit sell-through for a SKU at full recommended retail price (RRP) without any promotional discount, catalogue feature, or floor display support.',
    formula: 'Annual Baseline Units = Weekly Baseline × 52',
    example: 'A SKU averaging 450 units/week at $12.00 full price represents a baseline run-rate of $5,400/week.',
    proTip: 'Accurate baseline data is crucial for measuring true incremental promotional lift vs organic sales.'
  },
  'edlp': {
    term: 'EDLP (Everyday Low Price)',
    shortLabel: 'EDLP',
    category: 'Margin & Pricing',
    definition: 'A retail pricing strategy emphasizing a consistent, stable, and competitive price point week in, week out, rather than cycling through deep high-low promotional discounts.',
    example: 'Pricing a family staple permanently at $4.50 instead of cycling between $6.00 standard and $3.50 half-price specials.',
    proTip: 'EDLP stabilizes supply chain demand but requires lower cost of goods since high promotional spikes are eliminated.'
  },
  'jbp': {
    term: 'JBP (Joint Business Planning)',
    shortLabel: 'JBP',
    category: 'Strategy & Planning',
    definition: 'A collaborative, annual strategic commercial framework established between a supplier and a retail category buyer aligning revenue targets, trade spend, promotional weeks, NPD launches, and category growth goals.',
    example: 'An annual JBP agreed with Coles or Woolworths mapping out 12 key promotional feature weeks and 4 seasonal gondola ends.',
    proTip: 'Presenting a compliance-certified 52-week plan with margin protection guarantees gives you tremendous leverage during JBP reviews.'
  },
  'dead-net-cost': {
    term: 'Dead Net Cost',
    shortLabel: 'Dead Net',
    category: 'Margin & Pricing',
    definition: 'The true final acquisition cost of goods incurred by a retailer after subtracting all trade terms, scan rebates, settlement discounts, logistics allowances, and co-op marketing deductions from the standard list cost.',
    formula: 'Dead Net Cost = List Invoice Cost - (Scan Rebate + Settlement Discount + Logistics Allowance)',
    example: 'A $5.00 list cost SKU with a $1.20 scan rebate and 2.5% settlement allowance has a Dead Net Cost of $3.675.',
    proTip: 'Retail category buyers negotiate on Dead Net Cost to determine their actual margin percentage during promotional weeks.'
  },
  'accc-hiatus': {
    term: 'ACCC 4-Week Hiatus Rule',
    shortLabel: 'ACCC Hiatus',
    category: 'Compliance & Retail',
    definition: 'Australian Competition & Consumer Commission (ACCC) regulatory requirement stipulating that promotional discount claims (e.g. "Save $3.00" or "1/2 Price") must be preceded by an uninterrupted regular price period (typically 4 weeks) so discounts are genuine.',
    example: 'A product discounted in Week 10 cannot be discounted again in Weeks 11, 12, or 13 without violating normal price hiatus standards.',
    proTip: 'RangeCraft automatically audits all 52 weeks and reslots conflicting promotions to guarantee 100% ACCC compliance.'
  },
  'margin-safety-floor': {
    term: 'Margin Safety Floor',
    shortLabel: 'Margin Floor',
    category: 'Margin & Pricing',
    definition: 'The minimum acceptable gross margin percentage threshold (e.g., 28% or 35%) set by commercial leadership below which promotional deals are blocked or flagged as margin-dilutive.',
    formula: 'Margin % = (Promo Price - Net COGS) / Promo Price × 100',
    example: 'If your safety floor is 30% and a proposed 40% discount drops margin to 22%, the safety floor gauge triggers an at-risk warning.',
    proTip: 'Protecting your margin floor ensures your trade spend generates sustainable profit rather than unprofitable volume.'
  },
  'trade-spend-waterfall': {
    term: 'Trade Spend Waterfall',
    shortLabel: 'Trade Waterfall',
    category: 'Trade Spend & Rebates',
    definition: 'A visual financial bridge showing how gross retail sales step down sequentially through retail margins, supplier discounts, scan rebates, co-op catalogue fees, and cost of goods to yield final net manufacturer profit.',
    example: 'Gross Sales ($100k) - Retailer Margin ($30k) - Trade Scan ($15k) - COGS ($35k) = Net Profit ($20k).',
    proTip: 'Use waterfall charts in your JBP decks to show retailers that value is shared transparently across the category.'
  },
  'co-op-funding': {
    term: 'Co-Op & Over-and-Above Spend',
    shortLabel: 'Co-Op Spend',
    category: 'Trade Spend & Rebates',
    definition: 'Fixed promotional investments paid to retailers for specific media placements, such as printed catalogue front covers, digital app banner takeovers, or premium gondola end displays.',
    example: 'Paying $12,000 for a national double-page catalogue spread during EOFY Super Sale week.',
    proTip: 'Only invest over-and-above co-op spend on proven Tier 1 Hero SKUs with high baseline velocity.'
  }
};
