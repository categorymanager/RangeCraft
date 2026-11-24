import { Product, WeekPromotion } from '../types';

export type InventoryStatus = 'UNTRACKED' | 'CRITICAL' | 'LOW' | 'HEALTHY' | 'OVERSTOCKED';

export interface SkuPromoDemand {
  totalPromoUnits: number;
  peakWeekDemand: number;
  promoWeeksCount: number;
}

export interface SkuInventoryForecast {
  hasInventory: boolean;
  currentStock: number | null;
  allocatedForPromo: number;
  freeAvailableStock: number | null;
  inventoryValueAud: number | null;
  safetyStockThreshold: number;
  effectiveWeeklyDemand: number;
  weeksOfCover: number | null;
  periodShortfallUnits: number;
  annualShortfallUnits: number;
  stockStatus: InventoryStatus;
  hasStockoutWarning: boolean;
}

/**
 * Normalizes optional stock inputs: blank / null / undefined / NaN -> undefined.
 * Preserves explicit 0 as 0 (out of stock).
 */
export function normalizeOptionalStock(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed.replace(/,/g, ''));
    if (!Number.isFinite(parsed)) return undefined;
    return Math.max(0, Math.round(parsed));
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined;
    return Math.max(0, Math.round(value));
  }
  return undefined;
}

/**
 * Aggregates 52-week promotional unit demand per SKU across active promotions.
 */
export function buildSkuPromoDemandMap(
  products: Product[],
  promotions: WeekPromotion[]
): Map<string, SkuPromoDemand> {
  const map = new Map<string, SkuPromoDemand>();
  const validSkus = new Set(products.map((p) => p.sku));

  promotions.forEach((promo) => {
    if (promo.heroSku && validSkus.has(promo.heroSku)) {
      const existing = map.get(promo.heroSku) || {
        totalPromoUnits: 0,
        peakWeekDemand: 0,
        promoWeeksCount: 0,
      };
      const units = promo.projectedUnits || 0;
      existing.totalPromoUnits += units;
      existing.peakWeekDemand = Math.max(existing.peakWeekDemand, units);
      existing.promoWeeksCount += 1;
      map.set(promo.heroSku, existing);
    }

    if (promo.secondarySkus && promo.secondarySkus.length > 0) {
      const secUnits = Math.round((promo.projectedUnits || 0) * 0.35);
      promo.secondarySkus.forEach((secSku) => {
        if (!validSkus.has(secSku)) return;
        const existing = map.get(secSku) || {
          totalPromoUnits: 0,
          peakWeekDemand: 0,
          promoWeeksCount: 0,
        };
        existing.totalPromoUnits += secUnits;
        existing.peakWeekDemand = Math.max(existing.peakWeekDemand, secUnits);
        existing.promoWeeksCount += 1;
        map.set(secSku, existing);
      });
    }
  });

  return map;
}

/**
 * Evaluates SKU inventory against baseline and promotional demand.
 * - Blank inventory (`undefined` / `null`) => UNTRACKED (unconstrained supply, no stockout warnings).
 * - Entered inventory (`>= 0`) => computes Weeks of Cover, Free Stock, Shortfall & Stockout Warnings.
 */
export function computeSkuInventoryForecast(
  product: Product,
  promoDemand?: SkuPromoDemand,
  periodForecastUnits?: number
): SkuInventoryForecast {
  const hasInventory =
    typeof product.stockLevel === 'number' && Number.isFinite(product.stockLevel);
  const currentStock = hasInventory ? Math.max(0, Math.round(product.stockLevel!)) : null;

  const weeklyBaseline = Math.max(0, product.weeklyUnitsBaseline || 0);
  const allocatedForPromo = promoDemand?.totalPromoUnits || 0;
  const peakWeekDemand = promoDemand?.peakWeekDemand || 0;
  const effectiveWeeklyDemand = weeklyBaseline + allocatedForPromo / 52;
  const safetyStockThreshold = Math.round(weeklyBaseline * 4 + peakWeekDemand * 0.5);

  if (!hasInventory || currentStock === null) {
    return {
      hasInventory: false,
      currentStock: null,
      allocatedForPromo,
      freeAvailableStock: null,
      inventoryValueAud: null,
      safetyStockThreshold,
      effectiveWeeklyDemand,
      weeksOfCover: null,
      periodShortfallUnits: 0,
      annualShortfallUnits: 0,
      stockStatus: 'UNTRACKED',
      hasStockoutWarning: false,
    };
  }

  const freeAvailableStock = Math.max(0, currentStock - allocatedForPromo);
  const inventoryValueAud = currentStock * product.cost;

  const demandRate =
    periodForecastUnits !== undefined && periodForecastUnits > 0
      ? Math.max(effectiveWeeklyDemand, periodForecastUnits)
      : effectiveWeeklyDemand;

  const weeksOfCover =
    effectiveWeeklyDemand > 0
      ? Number((currentStock / effectiveWeeklyDemand).toFixed(1))
      : currentStock > 0
      ? 999
      : 0;

  const periodShortfallUnits =
    periodForecastUnits !== undefined
      ? Math.max(0, Math.round(periodForecastUnits) - currentStock)
      : 0;

  const annualShortfallUnits = Math.max(0, allocatedForPromo - currentStock);

  let stockStatus: InventoryStatus = 'HEALTHY';
  const periodCoverWeeks =
    demandRate > 0 ? Number((currentStock / demandRate).toFixed(1)) : weeksOfCover;

  if (
    currentStock === 0 ||
    annualShortfallUnits > 0 ||
    periodShortfallUnits > 0 ||
    (weeksOfCover !== null && weeksOfCover < 2)
  ) {
    stockStatus = 'CRITICAL';
  } else if (
    currentStock < safetyStockThreshold ||
    (weeksOfCover !== null && weeksOfCover < 4) ||
    periodCoverWeeks < 2
  ) {
    stockStatus = 'LOW';
  } else if (safetyStockThreshold > 0 && currentStock > safetyStockThreshold * 3) {
    stockStatus = 'OVERSTOCKED';
  }

  return {
    hasInventory: true,
    currentStock,
    allocatedForPromo,
    freeAvailableStock,
    inventoryValueAud,
    safetyStockThreshold,
    effectiveWeeklyDemand,
    weeksOfCover,
    periodShortfallUnits,
    annualShortfallUnits,
    stockStatus,
    hasStockoutWarning: stockStatus === 'CRITICAL' || stockStatus === 'LOW',
  };
}
