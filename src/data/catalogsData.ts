import { SkuCatalog } from '../types';

/**
 * INITIAL PRODUCT CATALOGS / RANGES
 * Clean master range container with 0 mock SKUs.
 * Prompts the user to upload their own range data via CSV/XLSX or create custom SKUs.
 */
export const INITIAL_CATALOGS: SkuCatalog[] = [
  {
    id: 'cat-default-range',
    name: 'Primary Retail Range',
    description: 'Master promotional trade range.',
    retailerBanner: 'National Supermarkets & Grocery',
    categoryFocus: 'Grocery & FMCG',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    products: [],
  }
];
