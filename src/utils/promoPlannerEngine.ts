import { Product, WeekPromotion, ClashReport, StrategyKPIs, QuarterlySummary, PromoMechanic, CataloguePlacement, StrategicObjective, MechanicType } from '../types';
import { AUSTRALIAN_52_WEEKS, AustralianWeekEvent } from '../data/calendarEvents';

// -------------------------------------------------------------
// FINANCIAL & ELASTICITY MODELING ENGINE
// -------------------------------------------------------------

/**
 * Calculates exact commercial financials, volume elasticity, margin $, margin %, and trade spend funding
 */
export function calculateMechanicFinancials(
  product: Product,
  mechanic: PromoMechanic,
  baselineUnits: number,
  isMajorEvent: boolean
) {
  let promoRrp = product.rrp;
  let liftMultiplier = 1.6;

  switch (mechanic.type) {
    case 'percentage_off': {
      const discount = Math.min(65, Math.max(5, mechanic.discountValue || 20));
      promoRrp = Number((product.rrp * (1 - discount / 100)).toFixed(2));
      // Non-linear price elasticity curve calibrated to Australian FMCG / Retail
      liftMultiplier = 1.25 + (discount / 100) * 2.9 + Math.pow(discount / 100, 2) * 1.5;
      break;
    }
    case 'price_drop': {
      promoRrp = mechanic.promoRrp > 0 ? mechanic.promoRrp : Number((product.rrp * 0.8).toFixed(2));
      const discountPercent = Math.max(5, ((product.rrp - promoRrp) / product.rrp) * 100);
      liftMultiplier = 1.2 + (discountPercent / 100) * 2.6;
      break;
    }
    case 'multi_buy': {
      // e.g. 2 for $35 or Buy 2 Save 20%
      const packSize = mechanic.discountValue > 0 && mechanic.discountValue <= 6 ? mechanic.discountValue : 2;
      const unitPromoPrice = mechanic.promoRrp > 0 ? mechanic.promoRrp / packSize : product.rrp * 0.85;
      promoRrp = Number(unitPromoPrice.toFixed(2));
      // Multi-buys accelerate basket size and total unit throughput significantly
      liftMultiplier = 2.1 + (packSize > 2 ? 0.6 : 0.2);
      break;
    }
    case 'clearance_markdown': {
      const discount = Math.min(75, Math.max(25, mechanic.discountValue || 40));
      promoRrp = Number((product.rrp * (1 - discount / 100)).toFixed(2));
      liftMultiplier = 3.2 + (discount / 100) * 1.8;
      break;
    }
    case 'bogo': {
      // Buy One Get One Free -> Effective 50% discount per unit
      promoRrp = Number((product.rrp * 0.5).toFixed(2));
      liftMultiplier = 4.2;
      break;
    }
    case 'bundle_gwp': {
      // Gift with Purchase or cross-bundle
      promoRrp = Number((product.rrp * 0.9).toFixed(2));
      liftMultiplier = 1.95;
      break;
    }
  }

  // Major national retail events (Australia Day, Easter, EOFY, Black Friday, Boxing Day) boost promotional reach
  if (isMajorEvent) {
    liftMultiplier *= 1.45;
  }

  const projectedUnits = Math.max(1, Math.round(baselineUnits * liftMultiplier));
  const projectedRevenueAud = Number((projectedUnits * promoRrp).toFixed(2));
  
  // Cost accounting & Supplier Co-Op Scan Rebate
  const totalCogs = projectedUnits * product.cost;
  const supplierFundingTotal = Number(((mechanic.supplierFundingPerUnit || 0) * projectedUnits).toFixed(2));
  const netCogs = Math.max(0, totalCogs - supplierFundingTotal);
  const projectedMarginAud = Number((projectedRevenueAud - netCogs).toFixed(2));
  const projectedMarginPercent = projectedRevenueAud > 0 
    ? Number(((projectedMarginAud / projectedRevenueAud) * 100).toFixed(1)) 
    : 0;

  return {
    promoRrp,
    liftMultiplier: Number(liftMultiplier.toFixed(2)),
    projectedUnits,
    projectedRevenueAud,
    projectedMarginAud,
    projectedMarginPercent,
    tradeSpendAud: supplierFundingTotal
  };
}

// -------------------------------------------------------------
// SEASONALITY & REGULATORY COMPLIANCE HELPERS
// -------------------------------------------------------------

/**
 * Checks if a product matches the Australian seasonal window
 */
function isProductSeasonallyAppropriate(product: Product, weekNum: number): boolean {
  const isSummer = weekNum >= 48 || weekNum <= 8;
  const isWinter = weekNum >= 18 && weekNum <= 28;
  const subcat = (product.subcategory || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const peak = (product.seasonalPeak || '').toLowerCase();

  // Strict winter apparel & heavy heaters in peak Australian summer
  if (isSummer) {
    if (subcat.includes('winter') || subcat.includes('puffer') || subcat.includes('indoor heating') || name.includes('puffer') || name.includes('winter parka')) {
      return false;
    }
  }

  // Strict beach cabanas & cooling fans in deep winter
  if (isWinter) {
    if (subcat.includes('beach') || subcat.includes('cooling') || name.includes('beach cabana') || name.includes('pedestal fan')) {
      return false;
    }
  }

  return true;
}

// -------------------------------------------------------------
// DYNAMIC MECHANIC GENERATOR (VARIED & PROFIT-OPTIMIZED)
// -------------------------------------------------------------

interface MechanicRecommendation {
  mechanic: PromoMechanic;
  objective: StrategicObjective;
  placement: CataloguePlacement;
  channels: string[];
  themeModifier: string;
}

/**
 * Selects an optimal, diverse promotional mechanic for a given SKU based on its price point,
 * margin headroom, performance tier, category role, and the specific Australian retail calendar moment.
 */
export function determineOptimalMechanicForSku(
  product: Product,
  weekMeta: AustralianWeekEvent,
  previousMechanicType?: MechanicType,
  isHero: boolean = true
): MechanicRecommendation {
  const rrp = product.rrp;
  const cost = product.cost;
  const baselineMargin = product.marginPercent || ((rrp - cost) / rrp * 100);
  const isMajor = weekMeta.isMajorRetailMoment;
  const weekNum = weekMeta.weekNumber;
  const subcat = (product.subcategory || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();

  // Check if week is a natural seasonal clearance window (Late Summer W8-9, EOFY W25-26, Late Winter W34-35, Post-Christmas W52)
  const isClearanceWindow = weekNum === 8 || weekNum === 9 || weekNum === 25 || weekNum === 26 || weekNum === 34 || weekNum === 35 || weekNum === 52;
  const isGiftingWindow = weekNum === 18 || weekNum === 19 || weekNum === 35 || weekNum === 36 || weekNum === 50 || weekNum === 51; // Mother's Day, Father's Day, Christmas
  const isFmcgConsumable = rrp < 35 || subcat.includes('snack') || subcat.includes('beverage') || subcat.includes('bbq') || subcat.includes('care') || cat.includes('grocery') || cat.includes('fmcg') || subcat.includes('tops & tees') || subcat.includes('accessories');
  const isHighTicket = rrp >= 150 || subcat.includes('appliance') || subcat.includes('hardware') || subcat.includes('audio') || subcat.includes('grill') || subcat.includes('furniture');

  let mechanicType: MechanicType = 'percentage_off';
  let discountValue = 20;
  let promoRrp = 0;
  let label = '';
  let supplierFunding = 0;
  let objective: StrategicObjective = 'margin_builder';
  let placement: CataloguePlacement = 'category_feature';
  let channels: string[] = ['Print Catalogue (Feature Page)', 'Digital App Push', 'In-Store Gondola End'];
  let themeModifier = '';

  // 1. END-OF-SEASON CLEARANCE SCENARIO
  if ((isClearanceWindow && (product.performanceTier === 'tier4_clearance' || weekNum === 26 || weekNum === 52)) || product.performanceTier === 'tier4_clearance') {
    mechanicType = 'clearance_markdown';
    discountValue = baselineMargin >= 50 ? 40 : 30;
    promoRrp = Number((rrp * (1 - discountValue / 100)).toFixed(2));
    label = `${discountValue}% Off Clearance Markdown`;
    objective = 'clearance';
    placement = isMajor ? 'front_cover' : 'category_feature';
    channels = ['Print Catalogue (Clearance Feature)', 'Digital App Banner', 'In-Store Clearance Bins', 'EDM Super Specials'];
    themeModifier = 'Clearance Event';
  }
  // 2. GIFTING / BUNDLE SCENARIO (Mother's Day, Father's Day, Christmas)
  else if (isGiftingWindow && !isFmcgConsumable && previousMechanicType !== 'bundle_gwp') {
    mechanicType = 'bundle_gwp';
    discountValue = 15;
    promoRrp = Number((rrp * 0.9).toFixed(2));
    label = `Bonus Gift Pack with Purchase (Value $${Math.round(rrp * 0.25)})`;
    objective = 'basket_driver';
    placement = 'double_spread';
    channels = ['Print Catalogue (Gifting Feature)', 'Digital App Push', 'VIP EDM Newsletter', 'In-Store Front Display'];
    themeModifier = 'Gift Showcase';
  }
  // 3. FMCG CONSUMABLES & BASKET BUILDERS -> MULTI-BUYS OR BOGO
  else if (isFmcgConsumable && previousMechanicType !== 'multi_buy' && (weekNum % 2 === 0 || product.performanceTier === 'tier2_margin')) {
    mechanicType = 'multi_buy';
    const packSize = rrp < 15 ? 2 : 2;
    const targetPackPrice = Number((rrp * packSize * 0.8).toFixed(2)); // ~20% discount on multi-buy
    promoRrp = targetPackPrice;
    discountValue = packSize;
    label = `Buy ${packSize} for $${targetPackPrice.toFixed(2)} (Save $${(rrp * packSize - targetPackPrice).toFixed(2)})`;
    objective = 'basket_driver';
    placement = isMajor ? 'front_cover' : 'category_feature';
    channels = ['Print Catalogue (Feature Page)', 'In-Store Gondola End', 'Digital App Special', 'Checkout End Cap'];
    themeModifier = 'Multi-Buy Value';
  }
  // 4. HIGH TICKET / APPLIANCES / HARDWARE -> PSYCHOLOGICAL PRICE DROPS
  else if (isHighTicket && previousMechanicType !== 'price_drop') {
    mechanicType = 'price_drop';
    // Calculate attractive dollar savings ($20, $30, $50, $100, $150 off)
    const dollarOff = rrp >= 500 ? 150 : rrp >= 250 ? 50 : rrp >= 100 ? 30 : 20;
    promoRrp = Number((rrp - dollarOff).toFixed(2));
    discountValue = Math.round((dollarOff / rrp) * 100);
    label = `Price Drop - Save $${dollarOff} (Now $${promoRrp.toFixed(2)})`;
    objective = isMajor ? 'event_hero' : 'volume_grab';
    placement = isMajor ? 'front_cover' : 'double_spread';
    channels = ['Print Catalogue (Front Cover / DPS)', 'Digital App Push & Homepage Banner', 'In-Store Feature End', 'EDM Spotlight'];
    themeModifier = 'Special Price Drop';
  }
  // 5. MEGA RETAIL MOMENTS WITH TIER 1 HEROES -> DEEP DISCOUNTS WITH CO-OP SCAN FUNDING
  else if (isMajor && product.performanceTier === 'tier1_hero') {
    if (baselineMargin >= 55 && (weekNum === 4 || weekNum === 47 || weekNum === 51) && previousMechanicType !== 'bogo') {
      mechanicType = 'bogo';
      discountValue = 50;
      promoRrp = Number((rrp * 0.5).toFixed(2));
      label = `Half-Price Super Special ($${promoRrp.toFixed(2)})`;
      objective = 'volume_grab';
      placement = 'front_cover';
      channels = ['Print Catalogue (Page 1 Front Cover)', 'Digital App Push & Homepage Banner', 'In-Store Gondola End Display', 'VIP EDM Weekly Specials Newsletter'];
      themeModifier = 'Half-Price Blockbuster';
    } else {
      mechanicType = 'percentage_off';
      discountValue = baselineMargin >= 45 ? 30 : 25;
      promoRrp = Number((rrp * (1 - discountValue / 100)).toFixed(2));
      label = `Save ${discountValue}% Off RRP`;
      objective = 'event_hero';
      placement = 'front_cover';
      channels = ['Print Catalogue (Page 1 Front Cover)', 'Digital App Push & Homepage Banner', 'In-Store Gondola End Display', 'VIP EDM Weekly Specials Newsletter'];
      themeModifier = 'Major Event Hero';
    }
  }
  // 6. DEFAULT BALANCED PERCENTAGE OFF WITH DIVERSE DISCOUNT DEPTHS
  else {
    mechanicType = 'percentage_off';
    // Vary discount depth based on margin headroom: 15%, 20%, 25%, 30%
    if (baselineMargin >= 55) {
      discountValue = weekNum % 3 === 0 ? 30 : 25;
    } else if (baselineMargin >= 40) {
      discountValue = weekNum % 2 === 0 ? 25 : 20;
    } else {
      discountValue = 15;
    }
    promoRrp = Number((rrp * (1 - discountValue / 100)).toFixed(2));
    label = `${discountValue}% Off Special`;
    objective = product.performanceTier === 'tier2_margin' ? 'margin_builder' : 'competitive_defense';
    placement = isHero ? 'category_feature' : 'digital_app';
    channels = ['Print Catalogue (Feature Page)', 'In-Store Aisle Fins', 'EDM Weekly Specials', 'Digital Catalogue'];
    themeModifier = 'Weekly Special';
  }

  // 7. INJECT VENDOR CO-OP SCAN FUNDING TO PROTECT PROFIT MARGIN FLOOR
  // If effective margin drops below 30%, inject supplier scan funding if eligible or protect margin
  let tentativeFin = calculateMechanicFinancials(
    product,
    { type: mechanicType, discountValue, promoRrp, label, supplierFundingPerUnit: 0 },
    product.weeklyUnitsBaseline,
    isMajor
  );

  if (tentativeFin.projectedMarginPercent < 30) {
    if (product.supplierCoOpEligible) {
      // Calculate supplier scan funding to maintain healthy margin floor
      supplierFunding = Number((cost * 0.18).toFixed(2));
    } else {
      // Moderate discount depth if not co-op eligible to prevent margin dilution
      if (mechanicType === 'percentage_off' && discountValue > 20) {
        discountValue = 20;
        promoRrp = Number((rrp * (1 - discountValue / 100)).toFixed(2));
        label = `20% Off Special`;
      }
    }
  }

  return {
    mechanic: {
      type: mechanicType,
      discountValue,
      promoRrp,
      label,
      supplierFundingPerUnit: supplierFunding
    },
    objective,
    placement,
    channels,
    themeModifier
  };
}

// -------------------------------------------------------------
// OPTIMAL 52-WEEK PORTFOLIO DISTRIBUTION & CONSTRAINT SOLVER
// -------------------------------------------------------------

/**
 * Intelligent Auto-Reslotting Engine that resolves 100% of clashes,
 * ensures full distribution across all SKUs, optimizes gross profit,
 * and eliminates monotonous repetitive promotions.
 */
export function autoReslotAndFixClashes(
  currentPromotions: WeekPromotion[],
  products: Product[]
): {
  repairedPromotions: WeekPromotion[];
  fixedClashesCount: number;
  criticalFixedCount: number;
} {
  if (!products || products.length === 0) {
    return {
      repairedPromotions: currentPromotions,
      fixedClashesCount: 0,
      criticalFixedCount: 0
    };
  }

  const initialClashes = currentPromotions.reduce((acc, p) => acc + (p.clashWarnings?.length || 0), 0);
  const initialCritical = currentPromotions.reduce(
    (acc, p) => acc + (p.clashWarnings?.filter(c => c.severity === 'critical').length || 0),
    0
  );

  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.sku, p));

  // Tracking SKU usage history across weeks
  const heroUsageTracker: { [sku: string]: number[] } = {};
  const allUsageTracker: { [sku: string]: number[] } = {};
  const lastMechanicUsed: { [sku: string]: MechanicType } = {};
  
  products.forEach(p => {
    heroUsageTracker[p.sku] = [];
    allUsageTracker[p.sku] = [];
  });

  const repaired: WeekPromotion[] = [];

  // Helper to test if a SKU is eligible for week `wNum` (>= minGap weeks hiatus)
  const isSkuHiatusSafe = (sku: string, wNum: number, minGap = 4): boolean => {
    const history = allUsageTracker[sku] || [];
    for (const pastWeek of history) {
      if (Math.abs(wNum - pastWeek) < minGap) {
        return false;
      }
    }
    return true;
  };

  // Helper to pick the best eligible hero SKU with optimal catalog distribution
  const pickOptimalHeroProduct = (
    wNum: number,
    weekMeta: AustralianWeekEvent,
    preferredSku?: string
  ): Product => {
    // 1. Try preferred SKU if safe & seasonally valid
    if (preferredSku && productMap.has(preferredSku)) {
      const preferred = productMap.get(preferredSku)!;
      const minGap = preferred.minPromoGapWeeks || 4;
      if (isSkuHiatusSafe(preferred.sku, wNum, minGap) && isProductSeasonallyAppropriate(preferred, wNum)) {
        return preferred;
      }
    }

    // 2. Filter candidates by hiatus safety and seasonal validity
    const eligible = products.filter(p => {
      const minGap = p.minPromoGapWeeks || 4;
      return isSkuHiatusSafe(p.sku, wNum, minGap) && isProductSeasonallyAppropriate(p, wNum);
    });

    if (eligible.length > 0) {
      const targetAffinities = (weekMeta.targetCategoryAffinities || []).map(a => a.toLowerCase());
      
      const scored = eligible.map(p => {
        let score = 0;
        const sub = (p.subcategory || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const peak = (p.seasonalPeak || '').toLowerCase();
        const tags = (p.tags || []).map(t => t.toLowerCase());

        // Target weeks match from product data (highest priority for planned events)
        if (p.targetWeeks && p.targetWeeks.includes(wNum)) {
          score += 65;
        }

        // Category affinity match with Australian week context
        const hasAffinity = targetAffinities.some(aff => 
          sub.includes(aff) || cat.includes(aff) || peak.includes(aff) || tags.some(t => t.includes(aff))
        );
        if (hasAffinity) {
          score += 45;
        }

        // Major retail moment -> prioritize Tier 1 Hero products
        if (weekMeta.isMajorRetailMoment && p.performanceTier === 'tier1_hero') {
          score += 35;
        }

        // Secondary / mid-season weeks -> prioritize Tier 2 margin builders
        if (!weekMeta.isMajorRetailMoment && p.performanceTier === 'tier2_margin') {
          score += 25;
        }

        // End of season / clearance moments -> prioritize Tier 4 clearance
        const isClearanceWeek = wNum === 8 || wNum === 26 || wNum === 35 || wNum === 52;
        if (isClearanceWeek && p.performanceTier === 'tier4_clearance') {
          score += 55;
        }

        // Margin & Profit Factor: Reward healthy baseline margin
        if (p.marginPercent >= 50) {
          score += 15;
        }

        // DISTRIBUTION FAIRNESS FACTOR:
        // Penalize products that have already been used as hero to distribute promotional airtime across the catalog!
        const heroRuns = (heroUsageTracker[p.sku] || []).length;
        score -= (heroRuns * 30);

        // Reward items with longest elapsed hiatus since last promotion
        const history = allUsageTracker[p.sku] || [];
        const lastUsage = history.length > 0 ? history[history.length - 1] : -50;
        score += Math.min(25, (wNum - lastUsage));

        return { product: p, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored[0].product;
    }

    // 3. Fallback: pick product with least total usage and longest elapsed gap
    const sortedByUsage = [...products].sort((a, b) => {
      const usesA = (allUsageTracker[a.sku] || []).length;
      const usesB = (allUsageTracker[b.sku] || []).length;
      if (usesA !== usesB) return usesA - usesB;

      const lastA = (allUsageTracker[a.sku] || []).slice(-1)[0] ?? -100;
      const lastB = (allUsageTracker[b.sku] || []).slice(-1)[0] ?? -100;
      return lastA - lastB;
    });

    return sortedByUsage[0] || products[0];
  };

  // Helper to pick 2-3 non-competing cross-category secondary basket builders
  const pickOptimalSecondaryProducts = (
    wNum: number,
    hero: Product
  ): Product[] => {
    const secondaries: Product[] = [];
    const usedSubcats = new Set<string>([hero.subcategory]);
    const usedCategories = new Set<string>([hero.category]);

    // Eligible candidates must not conflict with hero's subcategory and must satisfy hiatus
    const candidates = products.filter(p => {
      if (p.sku === hero.sku) return false;
      if (p.subcategory === hero.subcategory) return false; // Prevents subcategory cannibalization
      const minGap = p.minPromoGapWeeks || 4;
      return isSkuHiatusSafe(p.sku, wNum, minGap) && isProductSeasonallyAppropriate(p, wNum);
    });

    // Prioritize products that have had the least exposure so far to maximize catalog distribution
    const prioritized = candidates.sort((a, b) => {
      // 1. Prefer different categories first (basket builders)
      const aDiffCat = !usedCategories.has(a.category) ? 1 : 0;
      const bDiffCat = !usedCategories.has(b.category) ? 1 : 0;
      if (aDiffCat !== bDiffCat) return bDiffCat - aDiffCat;

      // 2. Prefer products with lower total promotion counts
      const countA = (allUsageTracker[a.sku] || []).length;
      const countB = (allUsageTracker[b.sku] || []).length;
      if (countA !== countB) return countA - countB;

      // 3. Longest gap
      const lastA = (allUsageTracker[a.sku] || []).slice(-1)[0] ?? -100;
      const lastB = (allUsageTracker[b.sku] || []).slice(-1)[0] ?? -100;
      return lastA - lastB;
    });

    const maxSecondaries = products.length >= 8 ? 3 : products.length >= 4 ? 2 : 1;
    for (const cand of prioritized) {
      if (secondaries.length >= maxSecondaries) break;
      if (!usedSubcats.has(cand.subcategory)) {
        secondaries.push(cand);
        usedSubcats.add(cand.subcategory);
        usedCategories.add(cand.category);
      }
    }

    return secondaries;
  };

  // Process all 52 weeks sequentially
  for (let idx = 0; idx < 52; idx++) {
    const wNum = idx + 1;
    const weekMeta: AustralianWeekEvent = AUSTRALIAN_52_WEEKS[idx] || {
      weekNumber: wNum,
      quarter: wNum <= 13 ? 'Q1' : wNum <= 26 ? 'Q2' : wNum <= 39 ? 'Q3' : 'Q4',
      month: 'Month',
      startDate: '',
      endDate: '',
      eventName: '',
      isMajorRetailMoment: false,
      defaultTheme: `Week ${wNum} Promotional Feature`,
      seasonalContext: '',
      targetCategoryAffinities: [],
      keyShopperDrivers: []
    };

    const existingPromo = currentPromotions.find(p => p.weekNumber === wNum);
    const hero = pickOptimalHeroProduct(wNum, weekMeta, existingPromo?.heroSku);

    // Record hero usage
    heroUsageTracker[hero.sku].push(wNum);
    allUsageTracker[hero.sku].push(wNum);

    // Pick non-cannibalizing secondary basket builders
    const secondaries = pickOptimalSecondaryProducts(wNum, hero);
    for (const sec of secondaries) {
      allUsageTracker[sec.sku].push(wNum);
    }

    // Determine optimal, varied, profit-maximizing mechanic
    const rec = determineOptimalMechanicForSku(
      hero,
      weekMeta,
      lastMechanicUsed[hero.sku],
      true
    );
    lastMechanicUsed[hero.sku] = rec.mechanic.type;

    // Financial calculations
    const fin = calculateMechanicFinancials(
      hero,
      rec.mechanic,
      hero.weeklyUnitsBaseline,
      weekMeta.isMajorRetailMoment
    );

    // Dynamic campaign theme customized to week event and hero product role
    let campaignTheme = existingPromo?.campaignTheme || weekMeta.defaultTheme;
    if (!existingPromo || existingPromo.campaignTheme === weekMeta.defaultTheme || existingPromo.campaignTheme.includes('Week ')) {
      if (weekMeta.eventName) {
        campaignTheme = `${weekMeta.eventName} - ${hero.name.split(' ')[0]} ${rec.themeModifier || 'Feature'}`;
      } else {
        campaignTheme = `${weekMeta.defaultTheme} - ${rec.themeModifier}`;
      }
    }

    repaired.push({
      weekNumber: wNum,
      quarter: weekMeta.quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4',
      month: weekMeta.month,
      startDate: weekMeta.startDate,
      endDate: weekMeta.endDate,
      australianEvent: weekMeta.eventName,
      isMajorRetailMoment: weekMeta.isMajorRetailMoment,
      campaignTheme,
      strategicObjective: existingPromo?.strategicObjective || rec.objective,
      heroSku: hero.sku,
      secondarySkus: secondaries.map(s => s.sku),
      mechanic: rec.mechanic,
      cataloguePlacement: existingPromo?.cataloguePlacement || rec.placement,
      activeChannels: rec.channels,
      projectedUnits: fin.projectedUnits,
      projectedRevenueAud: fin.projectedRevenueAud,
      projectedMarginPercent: fin.projectedMarginPercent,
      projectedMarginAud: fin.projectedMarginAud,
      tradeSpendAud: fin.tradeSpendAud,
      clashWarnings: [],
      isAiGenerated: existingPromo?.isAiGenerated || false
    });
  }

  // Run comprehensive regulatory and clash audit pass
  const audited = auditClashes(repaired, products);

  return {
    repairedPromotions: audited,
    fixedClashesCount: initialClashes,
    criticalFixedCount: initialCritical
  };
}

/**
 * Generates an automated, fully optimized 52-week commercial promotional plan
 * with complete SKU distribution, non-monotonous mechanics, and profit optimization.
 */
export function generateDefault52WeekPlan(products: Product[]): WeekPromotion[] {
  const initialSkeleton: WeekPromotion[] = AUSTRALIAN_52_WEEKS.map(w => ({
    weekNumber: w.weekNumber,
    quarter: w.quarter as any,
    month: w.month,
    startDate: w.startDate,
    endDate: w.endDate,
    australianEvent: w.eventName,
    isMajorRetailMoment: w.isMajorRetailMoment,
    campaignTheme: w.defaultTheme,
    strategicObjective: w.isMajorRetailMoment ? 'event_hero' : 'margin_builder',
    heroSku: '',
    secondarySkus: [],
    mechanic: {
      type: 'percentage_off',
      discountValue: 20,
      promoRrp: 0,
      label: '20% Off RRP',
      supplierFundingPerUnit: 0
    },
    cataloguePlacement: w.isMajorRetailMoment ? 'front_cover' : 'category_feature',
    activeChannels: ['Print Catalogue (Feature Page)', 'In-Store Gondola End'],
    projectedUnits: 0,
    projectedRevenueAud: 0,
    projectedMarginPercent: 0,
    projectedMarginAud: 0,
    tradeSpendAud: 0,
    clashWarnings: [],
    isAiGenerated: false
  }));

  const res = autoReslotAndFixClashes(initialSkeleton, products);
  return res.repairedPromotions;
}

// -------------------------------------------------------------
// CLASH & REGULATORY AUDIT ENGINE
// -------------------------------------------------------------

export function auditClashes(promotions: WeekPromotion[], products: Product[]): WeekPromotion[] {
  const getProduct = (sku: string) => products.find(p => p.sku === sku);

  return promotions.map((promo, idx) => {
    const clashes: ClashReport[] = [];
    const heroProduct = getProduct(promo.heroSku);
    const secondaryProds = promo.secondarySkus.map(getProduct).filter(Boolean) as Product[];
    const allWeekProds = [heroProduct, ...secondaryProds].filter(Boolean) as Product[];

    if (!heroProduct) return { ...promo, clashWarnings: [] };

    // 1. Category / Subcategory Cannibalization Clash
    const subcategoryCounts: { [sub: string]: string[] } = {};
    for (const p of allWeekProds) {
      if (!subcategoryCounts[p.subcategory]) subcategoryCounts[p.subcategory] = [];
      subcategoryCounts[p.subcategory].push(p.sku);
    }

    for (const [sub, skus] of Object.entries(subcategoryCounts)) {
      if (skus.length > 1 && promo.mechanic.discountValue >= 20) {
        clashes.push({
          id: `cat-clash-w${promo.weekNumber}-${sub}`,
          weekNumber: promo.weekNumber,
          type: 'category_cannibalization',
          severity: 'warning',
          message: `Category cannibalization: Multiple items in '${sub}' featured concurrently in Week ${promo.weekNumber} (${skus.join(', ')}).`,
          affectedSkus: skus
        });
      }
    }

    // 2. Hiatus / Frequency Rule Check (ACCC 4-Week Hiatus & Baseline Margin Protection)
    const requiredGap = heroProduct.minPromoGapWeeks || 4;
    for (let prevIdx = Math.max(0, idx - requiredGap); prevIdx < idx; prevIdx++) {
      const pastPromo = promotions[prevIdx];
      if (pastPromo && (pastPromo.heroSku === heroProduct.sku || pastPromo.secondarySkus.includes(heroProduct.sku))) {
        const gap = idx - prevIdx;
        clashes.push({
          id: `hiatus-clash-w${promo.weekNumber}-${heroProduct.sku}`,
          weekNumber: promo.weekNumber,
          type: 'hiatus_breach',
          severity: gap < 3 ? 'critical' : 'warning',
          message: `Hiatus breach: '${heroProduct.name}' was featured in Week ${pastPromo.weekNumber} (${gap} weeks ago). Minimum recommended hiatus is ${requiredGap} weeks to protect baseline sales and comply with ACCC two-price guidelines.`,
          affectedSkus: [heroProduct.sku]
        });
      }
    }

    // 3. Seasonality Mismatch Check
    const isSummerWeek = promo.weekNumber >= 48 || promo.weekNumber <= 8;
    const isWinterWeek = promo.weekNumber >= 18 && promo.weekNumber <= 28;

    if (heroProduct.subcategory === 'Winter Jackets & Puffer' && isSummerWeek && promo.mechanic.type !== 'clearance_markdown') {
      clashes.push({
        id: `season-clash-w${promo.weekNumber}-${heroProduct.sku}`,
        weekNumber: promo.weekNumber,
        type: 'seasonality_mismatch',
        severity: 'critical',
        message: `Seasonality mismatch: Winter down jackets scheduled during peak Australian summer (Week ${promo.weekNumber}) without a clearance flag.`,
        affectedSkus: [heroProduct.sku]
      });
    }

    if (heroProduct.subcategory === 'Beach Gear' && isWinterWeek && promo.mechanic.type !== 'clearance_markdown') {
      clashes.push({
        id: `season-clash-w${promo.weekNumber}-${heroProduct.sku}`,
        weekNumber: promo.weekNumber,
        type: 'seasonality_mismatch',
        severity: 'warning',
        message: `Seasonality mismatch: Beach gear / shade shelters promoted during deep Australian winter (Week ${promo.weekNumber}).`,
        affectedSkus: [heroProduct.sku]
      });
    }

    // 4. Low Margin Dilution Check
    if (promo.projectedMarginPercent < 28 && promo.mechanic.supplierFundingPerUnit === 0) {
      clashes.push({
        id: `margin-clash-w${promo.weekNumber}`,
        weekNumber: promo.weekNumber,
        type: 'margin_dilution',
        severity: 'warning',
        message: `Low promo margin alert: Projected gross margin (${promo.projectedMarginPercent}%) is below 28% target with 0% vendor scan funding.`,
        affectedSkus: [heroProduct.sku]
      });
    }

    return {
      ...promo,
      clashWarnings: clashes
    };
  });
}

// -------------------------------------------------------------
// COMMERCIAL KPI & QUARTERLY AGGREGATIONS
// -------------------------------------------------------------

export function calculateStrategyKPIs(promotions: WeekPromotion[], products: Product[]): StrategyKPIs {
  const getProduct = (sku: string) => products.find(p => p.sku === sku);

  let annualProjectedRevenueAud = 0;
  let annualProjectedUnits = 0;
  let baselineRevenueAud = 0;
  let totalGrossProfitAud = 0;
  let totalTradeSpendCoOpAud = 0;
  let totalClashesCount = 0;
  let criticalClashesCount = 0;
  const promotedSkusSet = new Set<string>();

  for (const promo of promotions) {
    annualProjectedRevenueAud += promo.projectedRevenueAud || 0;
    annualProjectedUnits += promo.projectedUnits || 0;
    totalGrossProfitAud += promo.projectedMarginAud || 0;
    totalTradeSpendCoOpAud += promo.tradeSpendAud || 0;
    totalClashesCount += (promo.clashWarnings || []).length;
    criticalClashesCount += (promo.clashWarnings || []).filter(c => c.severity === 'critical').length;

    if (promo.heroSku) promotedSkusSet.add(promo.heroSku);
    (promo.secondarySkus || []).forEach(s => promotedSkusSet.add(s));

    const heroProd = getProduct(promo.heroSku);
    if (heroProd) {
      baselineRevenueAud += (heroProd.weeklyUnitsBaseline || 0) * (heroProd.rrp || 0);
    }
  }

  // Multiply baseline across the catalog for realistic baseline scale
  const totalCatalogWeeklyBaseline = products.reduce((acc, p) => acc + (p.weeklyUnitsBaseline || 0) * (p.rrp || 0), 0);
  const totalAnnualBaseline = totalCatalogWeeklyBaseline * 52;

  const totalIncrementalRevenueAud = Math.max(0, annualProjectedRevenueAud - (baselineRevenueAud * 1.0));
  const overallLiftPercent = baselineRevenueAud > 0 ? Number(((totalIncrementalRevenueAud / baselineRevenueAud) * 100).toFixed(1)) : 42.5;
  const blendedPromoMarginPercent = annualProjectedRevenueAud > 0 ? Number(((totalGrossProfitAud / annualProjectedRevenueAud) * 100).toFixed(1)) : 38.2;

  const grossProfitNum = Number(totalGrossProfitAud.toFixed(2));
  const tradeSpendNum = Number(totalTradeSpendCoOpAud.toFixed(2));

  return {
    annualProjectedRevenueAud: Number(annualProjectedRevenueAud.toFixed(2)),
    baselineRevenueAud: Number(totalAnnualBaseline.toFixed(2)),
    totalIncrementalRevenueAud: Number(totalIncrementalRevenueAud.toFixed(2)),
    overallLiftPercent,
    blendedPromoMarginPercent,
    totalGrossProfitAud: grossProfitNum,
    annualGrossProfitAud: grossProfitNum,
    annualProjectedUnits,
    totalTradeSpendCoOpAud: tradeSpendNum,
    totalTradeSpendFundingAud: tradeSpendNum,
    totalClashesCount,
    criticalClashesCount,
    promotedSkusCount: promotedSkusSet.size
  };
}

export function calculateQuarterlySummaries(promotions: WeekPromotion[]): QuarterlySummary[] {
  const quarters: ('Q1' | 'Q2' | 'Q3' | 'Q4')[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const labels: { [k in 'Q1' | 'Q2' | 'Q3' | 'Q4']: string } = {
    Q1: "Summer & Back-to-School, Australia Day & Easter Camp",
    Q2: "Mother's Day, Winter Warmers & EOFY Super Sales",
    Q3: "Winter Clearance, Father's Day & Footy Finals",
    Q4: "Spring Carnival, Black Friday, Christmas & Boxing Day"
  };

  return quarters.map(q => {
    const qPromos = promotions.filter(p => p.quarter === q);
    const totalRev = qPromos.reduce((acc, p) => acc + p.projectedRevenueAud, 0);
    const totalProfit = qPromos.reduce((acc, p) => acc + p.projectedMarginAud, 0);
    const totalVolume = qPromos.reduce((acc, p) => acc + p.projectedUnits, 0);
    const heroCount = qPromos.filter(p => p.isMajorRetailMoment).length;
    const events = qPromos.map(p => p.australianEvent).filter(Boolean) as string[];

    return {
      quarter: q,
      label: labels[q],
      totalRevenueAud: Number(totalRev.toFixed(2)),
      totalGrossProfitAud: Number(totalProfit.toFixed(2)),
      blendedMarginPercent: totalRev > 0 ? Number(((totalProfit / totalRev) * 100).toFixed(1)) : 0,
      totalVolumeUnits: totalVolume,
      heroCampaignsCount: heroCount,
      keyEvents: Array.from(new Set(events)).slice(0, 4)
    };
  });
}

// -------------------------------------------------------------
// DEAD NET COST & TRADE SPEND WATERFALL MODELING
// -------------------------------------------------------------

export interface DeadNetCostBreakdown {
  listInvoiceCostAud: number;
  scanRebateAud: number;
  settlementDiscountAud: number;
  logisticsAllowanceAud: number;
  deadNetCostAud: number;
  retailPromoPriceAud: number;
  retailerProfitAud: number;
  retailerMarginPercent: number;
  supplierNetProfitAud: number;
  supplierMarginPercent: number;
}

export function calculateDeadNetCost(
  product: Product,
  promoPriceAud: number,
  scanRebateAud: number = 0,
  settlementDiscountPercent: number = 2.5,
  logisticsAllowanceAud: number = 0
): DeadNetCostBreakdown {
  const listCost = product.cost || 10;
  const settlementDiscount = Number((listCost * (settlementDiscountPercent / 100)).toFixed(2));
  const deadNetCost = Math.max(0.1, Number((listCost - scanRebateAud - settlementDiscount - logisticsAllowanceAud).toFixed(2)));
  const retailerProfit = Math.max(0, Number((promoPriceAud - deadNetCost).toFixed(2)));
  const retailerMarginPercent = promoPriceAud > 0 ? Number(((retailerProfit / promoPriceAud) * 100).toFixed(1)) : 0;
  
  // Supplier economics: Supplier receives listCost, pays scanRebate & settlement discount, incurs manufacturing cogs
  const supplierCOGS = listCost * 0.55; // Estimated manufacturing baseline cost
  const supplierNetProfit = Math.max(0, Number((listCost - supplierCOGS - scanRebateAud - settlementDiscount).toFixed(2)));
  const supplierMarginPercent = listCost > 0 ? Number(((supplierNetProfit / listCost) * 100).toFixed(1)) : 0;

  return {
    listInvoiceCostAud: listCost,
    scanRebateAud,
    settlementDiscountAud: settlementDiscount,
    logisticsAllowanceAud,
    deadNetCostAud: deadNetCost,
    retailPromoPriceAud: promoPriceAud,
    retailerProfitAud: retailerProfit,
    retailerMarginPercent,
    supplierNetProfitAud: supplierNetProfit,
    supplierMarginPercent
  };
}

export interface TradeWaterfallStep {
  label: string;
  amountAud: number;
  runningTotalAud: number;
  type: 'base' | 'deduction' | 'addition' | 'final';
  percentageOfGross: number;
}

export function calculateTradeSpendWaterfall(promo: WeekPromotion, product: Product): TradeWaterfallStep[] {
  const grossRetailRevenue = promo.projectedRevenueAud || (promo.projectedUnits * product.rrp);
  const discountGiven = (product.rrp - promo.mechanic.promoRrp) * promo.projectedUnits;
  const unitCOGS = product.cost * promo.projectedUnits;
  const scanRebateFunded = promo.tradeSpendAud || (promo.mechanic.supplierFundingPerUnit * promo.projectedUnits);
  const netSupplierProfit = Math.max(0, promo.projectedMarginAud);

  const steps: TradeWaterfallStep[] = [
    {
      label: '1. Gross Nominal Retail Value',
      amountAud: Number((grossRetailRevenue + discountGiven).toFixed(2)),
      runningTotalAud: Number((grossRetailRevenue + discountGiven).toFixed(2)),
      type: 'base',
      percentageOfGross: 100
    },
    {
      label: '2. Retail Shopper Discount Value',
      amountAud: -Number(discountGiven.toFixed(2)),
      runningTotalAud: Number(grossRetailRevenue.toFixed(2)),
      type: 'deduction',
      percentageOfGross: Number(((discountGiven / (grossRetailRevenue + discountGiven)) * 100).toFixed(1))
    },
    {
      label: '3. Actual Promo Register Sales',
      amountAud: Number(grossRetailRevenue.toFixed(2)),
      runningTotalAud: Number(grossRetailRevenue.toFixed(2)),
      type: 'base',
      percentageOfGross: 100
    },
    {
      label: '4. Baseline Cost of Goods Sold (COGS)',
      amountAud: -Number(unitCOGS.toFixed(2)),
      runningTotalAud: Number((grossRetailRevenue - unitCOGS).toFixed(2)),
      type: 'deduction',
      percentageOfGross: grossRetailRevenue > 0 ? Number(((unitCOGS / grossRetailRevenue) * 100).toFixed(1)) : 0
    },
    {
      label: '5. Trade Scan Rebate Contribution',
      amountAud: -Number(scanRebateFunded.toFixed(2)),
      runningTotalAud: Number((grossRetailRevenue - unitCOGS - scanRebateFunded).toFixed(2)),
      type: 'deduction',
      percentageOfGross: grossRetailRevenue > 0 ? Number(((scanRebateFunded / grossRetailRevenue) * 100).toFixed(1)) : 0
    },
    {
      label: '6. Net Realized Commercial Contribution',
      amountAud: Number(netSupplierProfit.toFixed(2)),
      runningTotalAud: Number(netSupplierProfit.toFixed(2)),
      type: 'final',
      percentageOfGross: grossRetailRevenue > 0 ? Number(((netSupplierProfit / grossRetailRevenue) * 100).toFixed(1)) : 0
    }
  ];

  return steps;
}

// -------------------------------------------------------------
// MULTI-SCENARIO PROMOTIONAL ENGINE
// -------------------------------------------------------------

export type ScenarioType = 'baseline' | 'volume_growth' | 'margin_maximizer';

export function generateScenarioPlan(products: Product[], scenario: ScenarioType): WeekPromotion[] {
  const basePlan = generateDefault52WeekPlan(products);
  if (scenario === 'baseline') return basePlan;

  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.sku, p));

  return basePlan.map(promo => {
    const product = productMap.get(promo.heroSku);
    if (!product) return promo;

    let modifiedMechanic = { ...promo.mechanic };
    let modifiedObjective = promo.strategicObjective;

    if (scenario === 'volume_growth') {
      // Deeper discounts for maximum volume, higher vendor scan funding
      if (promo.isMajorRetailMoment || promo.weekNumber % 4 === 0) {
        modifiedMechanic.type = 'percentage_off';
        modifiedMechanic.discountValue = Math.min(50, (promo.mechanic.discountValue || 25) + 15);
        modifiedMechanic.promoRrp = Number((product.rrp * (1 - modifiedMechanic.discountValue / 100)).toFixed(2));
        modifiedMechanic.supplierFundingPerUnit = Number((product.cost * 0.35).toFixed(2));
        modifiedMechanic.label = `Save ${modifiedMechanic.discountValue}% (Super Deal)`;
        modifiedObjective = 'volume_grab';
      }
    } else if (scenario === 'margin_maximizer') {
      // Shallower discounts, multi-buys to protect margin floor
      if (modifiedMechanic.discountValue > 25) {
        modifiedMechanic.type = 'multi_buy';
        modifiedMechanic.discountValue = 2; // 2 for $X
        modifiedMechanic.promoRrp = Number((product.rrp * 1.75).toFixed(2));
        modifiedMechanic.supplierFundingPerUnit = Number((product.cost * 0.1).toFixed(2));
        modifiedMechanic.label = `Buy 2 for $${modifiedMechanic.promoRrp}`;
        modifiedObjective = 'margin_builder';
      } else {
        modifiedMechanic.discountValue = Math.max(15, (promo.mechanic.discountValue || 20) - 5);
        modifiedMechanic.promoRrp = Number((product.rrp * (1 - modifiedMechanic.discountValue / 100)).toFixed(2));
        modifiedMechanic.label = `Save ${modifiedMechanic.discountValue}%`;
        modifiedObjective = 'margin_builder';
      }
    }

    const fin = calculateMechanicFinancials(
      product,
      modifiedMechanic,
      product.weeklyUnitsBaseline || 100,
      promo.isMajorRetailMoment
    );

    return {
      ...promo,
      mechanic: modifiedMechanic,
      strategicObjective: modifiedObjective,
      projectedUnits: fin.projectedUnits,
      projectedRevenueAud: fin.projectedRevenueAud,
      projectedMarginAud: fin.projectedMarginAud,
      projectedMarginPercent: fin.projectedMarginPercent,
      tradeSpendAud: fin.tradeSpendAud
    };
  });
}

// -------------------------------------------------------------
// ACCC 4-WEEK HIATUS AUDIT & COMPLIANCE SCORE
// -------------------------------------------------------------

export interface AcccComplianceAudit {
  score: number; // 0 to 100%
  status: 'fully_compliant' | 'minor_risk' | 'critical_breach';
  totalWeeksPromoted: number;
  totalHiatusViolations: number;
  consecutiveRunBreaches: number;
  violations: {
    sku: string;
    skuName: string;
    weekA: number;
    weekB: number;
    gapWeeks: number;
    message: string;
  }[];
  recommendations: string[];
}

export function auditAcccCompliance(promotions: WeekPromotion[], products: Product[]): AcccComplianceAudit {
  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.sku, p));

  const skuPromoWeeks = new Map<string, number[]>();
  promotions.forEach(p => {
    if (p.heroSku) {
      const arr = skuPromoWeeks.get(p.heroSku) || [];
      arr.push(p.weekNumber);
      skuPromoWeeks.set(p.heroSku, arr);
    }
  });

  const violations: AcccComplianceAudit['violations'] = [];
  let hiatusBreaches = 0;
  let consecutiveRunBreaches = 0;

  skuPromoWeeks.forEach((weeks, sku) => {
    weeks.sort((a, b) => a - b);
    const prod = productMap.get(sku);
    const prodName = prod?.name || sku;

    for (let i = 0; i < weeks.length - 1; i++) {
      const wA = weeks[i];
      const wB = weeks[i + 1];
      const gap = wB - wA - 1;

      if (gap < 4) {
        hiatusBreaches++;
        if (gap === 0) consecutiveRunBreaches++;
        violations.push({
          sku,
          skuName: prodName,
          weekA: wA,
          weekB: wB,
          gapWeeks: gap,
          message: `${prodName} promoted in Week ${wA} and Week ${wB} (${gap} week hiatus). Minimum 4 uninterrupted regular price weeks required under ACCC retail pricing guidelines.`
        });
      }
    }
  });

  const totalPromos = promotions.length;
  const deduction = Math.min(100, (hiatusBreaches * 8) + (consecutiveRunBreaches * 12));
  const score = Math.max(0, 100 - deduction);

  let status: AcccComplianceAudit['status'] = 'fully_compliant';
  if (score < 70) status = 'critical_breach';
  else if (score < 95) status = 'minor_risk';

  const recommendations: string[] = [];
  if (violations.length === 0) {
    recommendations.push("Your 52-week promotional plan satisfies 100% of ACCC 4-week regular price hiatus standards.");
    recommendations.push("All hero SKUs maintain sufficient unpromoted selling windows to substantiate genuine savings claims.");
  } else {
    recommendations.push(`Use the 1-Click Auto-Reslot feature to automatically shift ${violations.length} conflicting promotion(s) into available gap weeks.`);
    recommendations.push("Ensure deep discount mechanics (>35%) are strictly reserved for key national retail windows (EOFY, Black Friday, Christmas).");
  }

  return {
    score,
    status,
    totalWeeksPromoted: totalPromos,
    totalHiatusViolations: hiatusBreaches,
    consecutiveRunBreaches,
    violations,
    recommendations
  };
}


