import { Product, WeekPromotion, PerformanceTier } from '../types';

export interface RangePortfolioAnalysis {
  totalSkus: number;
  categoriesCount: number;
  overallAvgRrp: number;
  overallAvgCost: number;
  overallAvgMargin: number;
  totalAnnualBaselineUnits: number;
  totalAnnualBaselineRevenueAud: number;
  tierBreakdown: {
    tier1_hero: number;
    tier2_margin: number;
    tier3_niche: number;
    tier4_clearance: number;
  };
  coOpEligibleCount: number;
  coOpEligiblePercent: number;
  categoryStats: Array<{
    category: string;
    skuCount: number;
    avgRrp: number;
    avgCost: number;
    avgMargin: number;
    totalWeeklyUnits: number;
    estAnnualRevenue: number;
  }>;
  validationIssues: string[];
}

export function exportPromotionsToCsv(promotions: WeekPromotion[], products: Product[]): string {
  const getProduct = (sku: string) => products.find(p => p.sku === sku);

  const headers = [
    'Week #',
    'Quarter',
    'Month',
    'Date Range',
    'Australian Retail Event',
    'Campaign Theme',
    'Strategic Objective',
    'Hero SKU',
    'Hero Product Name',
    'Category',
    'Subcategory',
    'Regular RRP (AUD)',
    'Promo RRP (AUD)',
    'Discount Mechanic',
    'Projected Units',
    'Projected Revenue (AUD)',
    'Gross Margin %',
    'Gross Profit (AUD)',
    'Supplier Co-Op Funding (AUD)',
    'Catalogue Placement',
    'Secondary SKUs',
    'Active Channels',
    'Clash Warnings'
  ];

  const rows = promotions.map(p => {
    const hero = getProduct(p.heroSku);
    return [
      p.weekNumber,
      p.quarter,
      p.month,
      `"${p.startDate} - ${p.endDate}"`,
      `"${p.australianEvent || 'Standard Trade'}"`,
      `"${(p.campaignTheme || '').replace(/"/g, '""')}"`,
      p.strategicObjective,
      p.heroSku,
      `"${hero ? hero.name.replace(/"/g, '""') : 'Unknown'}"`,
      `"${hero ? hero.category : ''}"`,
      `"${hero ? hero.subcategory : ''}"`,
      hero ? hero.rrp.toFixed(2) : '0.00',
      p.mechanic.promoRrp.toFixed(2),
      `"${p.mechanic.label}"`,
      p.projectedUnits,
      p.projectedRevenueAud.toFixed(2),
      `${p.projectedMarginPercent}%`,
      p.projectedMarginAud.toFixed(2),
      p.tradeSpendAud.toFixed(2),
      p.cataloguePlacement,
      `"${p.secondarySkus.join(', ')}"`,
      `"${p.activeChannels.join(', ')}"`,
      `"${p.clashWarnings.map(c => c.message).join(' | ').replace(/"/g, '""')}"`
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportProductsToCsv(products: Product[]): string {
  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Subcategory',
    'RRP (AUD)',
    'Unit Cost (AUD)',
    'Margin %',
    'Baseline Weekly Units',
    'Performance Tier',
    'Seasonal Peak',
    'Target Weeks',
    'Min Hiatus Weeks',
    'Supplier Co-Op Eligible',
    'Tags',
    'Min Margin %',
    'Max Discount Depth %',
    'Target Volume Lift %'
  ];

  const rows = products.map(p => [
    p.sku,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.category}"`,
    `"${p.subcategory}"`,
    p.rrp.toFixed(2),
    p.cost.toFixed(2),
    p.marginPercent.toFixed(1),
    p.weeklyUnitsBaseline,
    p.performanceTier,
    `"${p.seasonalPeak}"`,
    `"${p.targetWeeks.join(';')}"`,
    p.minPromoGapWeeks,
    p.supplierCoOpEligible ? 'YES' : 'NO',
    `"${p.tags.join(';')}"`,
    p.minMarginPercent?.toFixed(1) || '',
    p.maxDiscountDepthPercent?.toFixed(1) || '',
    p.targetVolumeLiftPercent?.toFixed(1) || ''
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Generates an official, ready-to-fill CSV template with header definitions and sample Australian retail SKUs
 */
export function generateProductCsvTemplate(): string {
  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Subcategory',
    'RRP (AUD)',
    'Unit Cost (AUD)',
    'Margin %',
    'Baseline Weekly Units',
    'Performance Tier',
    'Seasonal Peak',
    'Target Weeks',
    'Min Hiatus Weeks',
    'Supplier Co-Op Eligible',
    'Tags',
    'Min Margin %',
    'Max Discount Depth %',
    'Target Volume Lift %'
  ];

  const sampleRows = [
    [
      'SKU-OUT-001',
      '"Premium Hardwood BBQ Lump Charcoal 4kg"',
      '"Outdoor & Hardware"',
      '"BBQ & Fireplace"',
      '24.95',
      '11.50',
      '53.9',
      '140',
      'tier1_hero',
      '"Summer / Australia Day"',
      '"4;13;22;37;47"',
      '4',
      'YES',
      '"Australia Day; BBQ; Hero; High Volume"',
      '45.0',
      '25.0',
      '15.0'
    ],
    [
      'SKU-HOM-001',
      '"2400W Precision Oil Column Radiant Heater"',
      '"Home & Appliances"',
      '"Heating & Cooling"',
      '229.00',
      '128.00',
      '44.1',
      '65',
      'tier1_hero',
      '"Winter Warmers"',
      '"18;20;24;28"',
      '4',
      'YES',
      '"Winter; Heating; Energy Efficient; High Value"'
    ],
    [
      'SKU-FMC-001',
      '"Artisan Sweet Chilli Kettle Cooked Chips 165g"',
      '"Food & FMCG"',
      '"Snacks & Confectionery"',
      '5.95',
      '2.40',
      '59.7',
      '380',
      'tier2_margin',
      '"Footy Finals / Summer"',
      '"4;13;36;37;49;51"',
      '3',
      'YES',
      '"Multi-Buy; Footy Finals; Impulse; High Margin"'
    ],
    [
      'SKU-ELE-001',
      '"Heavy-Duty Waterproof Portable Bluetooth Speaker"',
      '"Consumer Tech & Audio"',
      '"Audio & Visual"',
      '199.95',
      '118.00',
      '41.0',
      '85',
      'tier1_hero',
      '"Spring / Black Friday / Xmas"',
      '"13;34;47;48;50"',
      '4',
      'YES',
      '"Black Friday; Gifting; Father\'s Day; Hero"'
    ],
    [
      'SKU-APP-001',
      '"Thermal 600-Fill Goose Down Winter Jacket"',
      '"Apparel & Footwear"',
      '"Winter Outerwear"',
      '299.95',
      '115.00',
      '61.7',
      '70',
      'tier2_margin',
      '"Winter Snow & Chill"',
      '"18;20;25;30"',
      '4',
      'NO',
      '"Winter Warmers; Premium Margin; Outerwear"'
    ],
    [
      'SKU-CLR-001',
      '"Sunseeker UV50+ Pop-Up Beach Shelter 2m"',
      '"Clearance & Seasonal"',
      '"Beach & Camping"',
      '79.95',
      '32.00',
      '59.9',
      '40',
      'tier4_clearance',
      '"Late Summer Stocktake"',
      '"8;25;26"',
      '4',
      'NO',
      '"Clearance; EOFY; Markdown; Seasonal Exit"'
    ]
  ];

  return [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
}

/**
 * Strips HTML tags and unescapes common HTML entities from raw strings
 */
export function stripHtml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust RFC 4180 compliant CSV tokenizer that handles multi-line quoted fields,
 * escaped double quotes (""), and varied line breaks (\r\n, \r, \n).
 */
export function parseCsvRecords(csvText: string): string[][] {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = csvText.length;

  while (i < len) {
    const char = csvText[i];
    const nextChar = i + 1 < len ? csvText[i + 1] : '';

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRecord.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRecord.push(currentField.trim());
        currentField = '';
        if (currentRecord.some(f => f.length > 0)) {
          records.push(currentRecord);
        }
        currentRecord = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRecord.push(currentField.trim());
        currentField = '';
        if (currentRecord.some(f => f.length > 0)) {
          records.push(currentRecord);
        }
        currentRecord = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push final field/record if remaining
  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    if (currentRecord.some(f => f.length > 0)) {
      records.push(currentRecord);
    }
  }

  return records;
}

/**
 * Sanitizes any list of products to guarantee:
 * 1. 100% unique, non-empty, non-HTML SKUs
 * 2. Cleaned display names with stripped HTML
 * 3. Valid non-negative numbers for pricing, margins, baseline units
 * 4. Safe tags array
 */
export function sanitizeProducts(products: Product[]): Product[] {
  if (!Array.isArray(products)) return [];
  const seenSkus = new Set<string>();

  return products.map((p, index) => {
    let cleanSku = stripHtml(p.sku || '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[^\w\d\-_.]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toUpperCase();

    if (!cleanSku || cleanSku.length < 2) {
      cleanSku = `SKU-PROD-${index + 1}`;
    }

    // Ensure uniqueness
    let finalSku = cleanSku;
    let counter = 1;
    while (seenSkus.has(finalSku)) {
      counter++;
      finalSku = `${cleanSku}-${counter}`;
    }
    seenSkus.add(finalSku);

    let cleanName = stripHtml(p.name || '').slice(0, 140);
    if (!cleanName) {
      cleanName = `Range Product ${index + 1}`;
    }

    let cleanCategory = stripHtml(p.category || '').slice(0, 60);
    if (!cleanCategory || cleanCategory.toLowerCase().includes('http') || cleanCategory.startsWith('<')) {
      cleanCategory = 'General Merchandise';
    }

    let cleanSubcategory = stripHtml(p.subcategory || '').slice(0, 60);
    if (!cleanSubcategory || cleanSubcategory.startsWith('<')) {
      cleanSubcategory = 'General Range';
    }

    const rrp = Math.max(0.01, typeof p.rrp === 'number' && !isNaN(p.rrp) ? p.rrp : 29.99);
    const cost = Math.max(0.01, typeof p.cost === 'number' && !isNaN(p.cost) ? p.cost : Number((rrp * 0.5).toFixed(2)));
    
    let marginPercent = typeof p.marginPercent === 'number' && !isNaN(p.marginPercent) ? p.marginPercent : 0;
    if (marginPercent <= 0 && rrp > 0) {
      marginPercent = Number((((rrp - cost) / rrp) * 100).toFixed(1));
    }

    const weeklyUnitsBaseline = Math.max(1, typeof p.weeklyUnitsBaseline === 'number' && !isNaN(p.weeklyUnitsBaseline) ? Math.round(p.weeklyUnitsBaseline) : 50);

    const tags = Array.isArray(p.tags) 
      ? p.tags.map(t => stripHtml(t)).filter(t => t.length > 0 && t.length < 40).slice(0, 8)
      : [cleanCategory, 'Active Trade'];

    return {
      ...p,
      sku: finalSku,
      name: cleanName,
      category: cleanCategory,
      subcategory: cleanSubcategory,
      rrp,
      cost,
      marginPercent,
      weeklyUnitsBaseline,
      tags: tags.length > 0 ? tags : [cleanCategory],
      stockLevel: typeof p.stockLevel === 'number' && !isNaN(p.stockLevel) ? p.stockLevel : 1000,
      minPromoGapWeeks: typeof p.minPromoGapWeeks === 'number' && !isNaN(p.minPromoGapWeeks) ? Math.max(2, Math.min(12, p.minPromoGapWeeks)) : 4,
      seasonalPeak: p.seasonalPeak ? stripHtml(p.seasonalPeak).slice(0, 50) : 'All Year Trade',
      targetWeeks: Array.isArray(p.targetWeeks) && p.targetWeeks.length > 0 ? p.targetWeeks.filter(w => typeof w === 'number' && w >= 1 && w <= 52) : [4, 18, 34, 47],
    };
  });
}

/**
 * Robust parser that cleans dollar signs, percentages, quotes, and empty fields
 * with intelligent column mapping for standard, Shopify, WooCommerce and generic CSV formats.
 */
export function parseProductsCsv(csvText: string): Product[] {
  const records = parseCsvRecords(csvText);
  if (records.length < 2) return [];

  const rawHeaders = records[0].map(h => stripHtml(h).toLowerCase());
  
  // Find column indexes based on header keywords
  const findCol = (keywords: string[]): number => {
    return rawHeaders.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const skuIdx = findCol(['variant sku', 'sku', 'item code', 'barcode', 'product code', 'id', 'handle']);
  const titleIdx = findCol(['title', 'product name', 'item name', 'name', 'description']);
  const categoryIdx = findCol(['type', 'product category', 'category', 'department', 'vendor']);
  const subcategoryIdx = findCol(['subcategory', 'sub category', 'sub-category', 'collection', 'tags']);
  const rrpIdx = findCol(['variant price', 'price', 'rrp', 'retail price', 'unit price', 'selling price']);
  const costIdx = findCol(['cost per item', 'variant cost', 'cost', 'cogs', 'unit cost', 'wholesale']);
  const marginIdx = findCol(['margin %', 'margin', 'gross margin']);
  const baselineIdx = findCol(['baseline', 'weekly units', 'units', 'volume', 'qty', 'inventory', 'variant inventory qty']);
  const tierIdx = findCol(['tier', 'performance tier', 'priority']);
  const tagsIdx = findCol(['tags', 'keywords']);
  const promoWeeksIdx = findCol(['target weeks', 'weeks', 'promotional weeks']);
  const hiatusIdx = findCol(['min promo gap', 'hiatus', 'gap']);
  const coopIdx = findCol(['co-op', 'coop', 'supplier funding', 'rebate eligible']);

  const cleanNum = (val: string | undefined, defaultVal: number): number => {
    if (!val) return defaultVal;
    const cleaned = val.replace(/[\$,%]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? defaultVal : num;
  };

  const rawProducts: Product[] = [];

  for (let i = 1; i < records.length; i++) {
    const tokens = records[i];
    if (tokens.length === 0 || tokens.every(t => !t || t.trim().length === 0)) continue;

    // Extract fields using detected columns or positional fallbacks
    let rawSku = skuIdx !== -1 && tokens[skuIdx] ? tokens[skuIdx] : tokens[0] || '';
    let rawName = titleIdx !== -1 && tokens[titleIdx] ? tokens[titleIdx] : tokens[1] || `Range Product ${i}`;
    
    // If SKU looks like HTML or is too long, derive fallback
    if (rawSku.includes('<') || rawSku.includes('>') || rawSku.length > 50) {
      rawSku = `SKU-IMP-${i}`;
    }

    let cleanSku = stripHtml(rawSku).replace(/[^\w\d\-_.]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();
    if (!cleanSku || cleanSku.length < 2) {
      cleanSku = `SKU-IMP-${i}`;
    }

    let cleanName = stripHtml(rawName);
    if (cleanName.length > 120) {
      cleanName = cleanName.slice(0, 120);
    }
    if (!cleanName) {
      cleanName = `Range Product ${i}`;
    }

    let rawCategory = categoryIdx !== -1 && tokens[categoryIdx] ? tokens[categoryIdx] : tokens[2] || 'General Merchandise';
    let cleanCategory = stripHtml(rawCategory);
    if (!cleanCategory || cleanCategory.length > 50 || cleanCategory.includes('http')) {
      cleanCategory = 'General Merchandise';
    }

    let rawSubcategory = subcategoryIdx !== -1 && tokens[subcategoryIdx] ? tokens[subcategoryIdx] : tokens[3] || 'General Range';
    let cleanSubcategory = stripHtml(rawSubcategory);
    if (!cleanSubcategory || cleanSubcategory.length > 50) {
      cleanSubcategory = 'General Range';
    }

    const rrp = cleanNum(rrpIdx !== -1 ? tokens[rrpIdx] : tokens[4], 29.99);
    const cost = cleanNum(costIdx !== -1 ? tokens[costIdx] : tokens[5], Number((rrp * 0.5).toFixed(2)));

    let marginPercent = cleanNum(marginIdx !== -1 ? tokens[marginIdx] : tokens[6], 0);
    if (marginPercent <= 0 && rrp > 0) {
      marginPercent = Number((((rrp - cost) / rrp) * 100).toFixed(1));
    }

    const weeklyUnitsBaseline = Math.max(1, Math.round(cleanNum(baselineIdx !== -1 ? tokens[baselineIdx] : tokens[7], 50)));

    // Tier parsing
    const rawTier = (tierIdx !== -1 && tokens[tierIdx] ? tokens[tierIdx] : tokens[8] || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    let performanceTier: PerformanceTier = 'tier2_margin';
    if (rawTier.includes('hero') || rawTier.includes('tier1') || rawTier.includes('1')) {
      performanceTier = 'tier1_hero';
    } else if (rawTier.includes('clearance') || rawTier.includes('tier4') || rawTier.includes('4')) {
      performanceTier = 'tier4_clearance';
    } else if (rawTier.includes('niche') || rawTier.includes('tier3') || rawTier.includes('3') || rawTier.includes('premium')) {
      performanceTier = 'tier3_niche';
    } else {
      performanceTier = 'tier2_margin';
    }

    // Target weeks
    let targetWeeks: number[] = [4, 18, 34, 47];
    const rawWeeks = promoWeeksIdx !== -1 ? tokens[promoWeeksIdx] : tokens[10];
    if (rawWeeks) {
      const parsedWeeks = rawWeeks.replace(/^"|"$/g, '').split(/[;,-]/)
        .map(w => parseInt(w.trim()))
        .filter(w => !isNaN(w) && w >= 1 && w <= 52);
      if (parsedWeeks.length > 0) {
        targetWeeks = parsedWeeks;
      }
    }

    const minPromoGapWeeks = Math.max(2, Math.min(12, Math.round(cleanNum(hiatusIdx !== -1 ? tokens[hiatusIdx] : tokens[11], 4))));

    // Co-op
    const rawCoop = (coopIdx !== -1 && tokens[coopIdx] ? tokens[coopIdx] : tokens[12] || '').toUpperCase();
    const supplierCoOpEligible = rawCoop.includes('Y') || rawCoop.includes('TRUE') || rawCoop.includes('1');

    // Tags
    const rawTags = tagsIdx !== -1 && tokens[tagsIdx] ? tokens[tagsIdx] : tokens[13] || '';
    const tags = rawTags 
      ? rawTags.split(/[;,]/).map(t => stripHtml(t)).filter(t => t.length > 0 && t.length < 40).slice(0, 6)
      : [cleanCategory, 'Imported'];

    rawProducts.push({
      sku: cleanSku,
      name: cleanName,
      category: cleanCategory,
      subcategory: cleanSubcategory,
      rrp: Math.max(0.01, rrp),
      cost: Math.max(0.01, cost),
      marginPercent,
      weeklyUnitsBaseline,
      performanceTier,
      seasonalPeak: 'All Year Trade',
      targetWeeks,
      stockLevel: 1000,
      minPromoGapWeeks,
      supplierCoOpEligible,
      tags: tags.length > 0 ? tags : [cleanCategory],
    });
  }

  // Pass through sanitizer for guaranteed uniqueness and valid fields
  return sanitizeProducts(rawProducts);
}

/**
 * Analyzes an imported or existing product range and calculates portfolio diagnostics
 */
export function analyzeProductRangePortfolio(products: Product[]): RangePortfolioAnalysis {
  const totalSkus = products.length;
  if (totalSkus === 0) {
    return {
      totalSkus: 0,
      categoriesCount: 0,
      overallAvgRrp: 0,
      overallAvgCost: 0,
      overallAvgMargin: 0,
      totalAnnualBaselineUnits: 0,
      totalAnnualBaselineRevenueAud: 0,
      tierBreakdown: { tier1_hero: 0, tier2_margin: 0, tier3_niche: 0, tier4_clearance: 0 },
      coOpEligibleCount: 0,
      coOpEligiblePercent: 0,
      categoryStats: [],
      validationIssues: ['No products in range.']
    };
  }

  const validationIssues: string[] = [];
  const tierBreakdown = { tier1_hero: 0, tier2_margin: 0, tier3_niche: 0, tier4_clearance: 0 };
  let totalRrp = 0;
  let totalCost = 0;
  let totalMargin = 0;
  let totalWeeklyUnits = 0;
  let totalAnnualBaselineRevenueAud = 0;
  let coOpEligibleCount = 0;

  const categoryMap: { [cat: string]: Product[] } = {};

  products.forEach(p => {
    totalRrp += p.rrp;
    totalCost += p.cost;
    totalMargin += p.marginPercent;
    totalWeeklyUnits += p.weeklyUnitsBaseline;
    totalAnnualBaselineRevenueAud += (p.weeklyUnitsBaseline * 52 * p.rrp);

    if (p.performanceTier in tierBreakdown) {
      tierBreakdown[p.performanceTier]++;
    }

    if (p.supplierCoOpEligible) {
      coOpEligibleCount++;
    }

    if (p.cost >= p.rrp) {
      validationIssues.push(`SKU ${p.sku} (${p.name}): Cost ($${p.cost}) is equal to or higher than RRP ($${p.rrp}), resulting in negative or 0% gross margin.`);
    }

    if (p.rrp <= 0) {
      validationIssues.push(`SKU ${p.sku} (${p.name}): Has $0.00 RRP.`);
    }

    const cat = p.category || 'Uncategorized';
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(p);
  });

  const categoryStats = Object.keys(categoryMap).map(category => {
    const items = categoryMap[category];
    const skuCount = items.length;
    const catAvgRrp = items.reduce((acc, i) => acc + i.rrp, 0) / skuCount;
    const catAvgCost = items.reduce((acc, i) => acc + i.cost, 0) / skuCount;
    const catAvgMargin = items.reduce((acc, i) => acc + i.marginPercent, 0) / skuCount;
    const catTotalWeeklyUnits = items.reduce((acc, i) => acc + i.weeklyUnitsBaseline, 0);
    const estAnnualRevenue = catTotalWeeklyUnits * 52 * catAvgRrp;

    return {
      category,
      skuCount,
      avgRrp: Number(catAvgRrp.toFixed(2)),
      avgCost: Number(catAvgCost.toFixed(2)),
      avgMargin: Number(catAvgMargin.toFixed(1)),
      totalWeeklyUnits: catTotalWeeklyUnits,
      estAnnualRevenue: Number(estAnnualRevenue.toFixed(2))
    };
  }).sort((a, b) => b.estAnnualRevenue - a.estAnnualRevenue);

  return {
    totalSkus,
    categoriesCount: Object.keys(categoryMap).length,
    overallAvgRrp: totalSkus > 0 ? Number((totalRrp / totalSkus).toFixed(2)) : 0,
    overallAvgCost: totalSkus > 0 ? Number((totalCost / totalSkus).toFixed(2)) : 0,
    overallAvgMargin: totalSkus > 0 ? Number((totalMargin / totalSkus).toFixed(1)) : 0,
    totalAnnualBaselineUnits: totalWeeklyUnits * 52,
    totalAnnualBaselineRevenueAud: totalSkus > 0 ? Number(totalAnnualBaselineRevenueAud.toFixed(2)) : 0,
    tierBreakdown,
    coOpEligibleCount,
    coOpEligiblePercent: totalSkus > 0 ? Number(((coOpEligibleCount / totalSkus) * 100).toFixed(1)) : 0,
    categoryStats,
    validationIssues
  };
}
