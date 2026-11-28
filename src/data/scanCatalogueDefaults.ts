import {
  Product,
  ScanCatalogueItem,
  ScanPoHistoryEntry,
  ScanPoLineItem,
  ScanPoOrderMetadata,
  ScanSupplierGroup,
} from '../types';

export const SCAN_CATALOGUE_STORAGE_KEY = 'rangecraft_scan_catalogue_v1';
export const SCAN_PO_DRAFT_STORAGE_KEY = 'rangecraft_scan_po_draft_v1';
export const SCAN_PO_HISTORY_STORAGE_KEY = 'rangecraft_scan_po_history_v1';

export const INITIAL_AU_SCAN_CATALOGUE: ScanCatalogueItem[] = [
  {
    barcode: '9310012045018',
    sku: 'AU-PAN-001',
    name: 'SunHarvest Extra Virgin Olive Oil 750ml',
    supplierName: 'Southern Cross Pantry Co.',
    supplierEmail: 'orders@southerncrosspantry.com.au',
    packSize: 6,
    unitCostExGst: 9.8,
    gstApplicable: false,
  },
  {
    barcode: '9310012045025',
    sku: 'AU-PAN-002',
    name: 'SunHarvest Organic Rolled Oats 1kg',
    supplierName: 'Southern Cross Pantry Co.',
    supplierEmail: 'orders@southerncrosspantry.com.au',
    packSize: 12,
    unitCostExGst: 3.15,
    gstApplicable: false,
  },
  {
    barcode: '9321456001122',
    sku: 'AU-BEV-104',
    name: 'Murray Valley Sparkling Spring Water 6x375ml',
    supplierName: 'Murray Valley Beverages Pty Ltd',
    supplierEmail: 'dispatch@murrayvalleybev.com.au',
    packSize: 4,
    unitCostExGst: 4.4,
    gstApplicable: true,
  },
  {
    barcode: '9321456001139',
    sku: 'AU-BEV-109',
    name: 'Murray Valley Cold Brew Oat Latte 250ml',
    supplierName: 'Murray Valley Beverages Pty Ltd',
    supplierEmail: 'dispatch@murrayvalleybev.com.au',
    packSize: 12,
    unitCostExGst: 2.45,
    gstApplicable: true,
  },
  {
    barcode: '9330088102041',
    sku: 'AU-SNK-201',
    name: 'Tasman Sea Salt Kettle Crisps 165g',
    supplierName: 'Tasman Craft Snacks',
    supplierEmail: 'trade@tasmancraftsnacks.com.au',
    packSize: 16,
    unitCostExGst: 2.6,
    gstApplicable: true,
  },
  {
    barcode: '9330088102058',
    sku: 'AU-SNK-204',
    name: 'Tasman Dark Chocolate Pretzel Bites 140g',
    supplierName: 'Tasman Craft Snacks',
    supplierEmail: 'trade@tasmancraftsnacks.com.au',
    packSize: 12,
    unitCostExGst: 3.2,
    gstApplicable: true,
  },
];

export function normalizeBarcode(raw: string): string {
  return raw.replace(/\s+/g, '').trim();
}

export function generatePoNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(100 + Math.random() * 900));
  return `PO-RC-${y}${m}${d}-${rand}`;
}

export function getDefaultDeliveryDate(): string {
  const target = new Date();
  target.setDate(target.getDate() + 3);
  return target.toISOString().slice(0, 10);
}

export function getDefaultPoMetadata(): ScanPoOrderMetadata {
  return {
    orderMode: 'store_order',
    poNumber: generatePoNumber(),
    storeName: 'Melbourne Central Market Store',
    storeAbn: '',
    storeEmail: 'orders@centralmarketstore.com.au',
    deliveryDate: getDefaultDeliveryDate(),
    notes: 'Deliver to rear loading dock between 6:00 AM and 11:00 AM. Include carton packing slip.',
  };
}

export function loadScanCatalogue(): ScanCatalogueItem[] {
  if (typeof window === 'undefined') return INITIAL_AU_SCAN_CATALOGUE;
  try {
    const raw = localStorage.getItem(SCAN_CATALOGUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          barcode: normalizeBarcode(String(item.barcode || '')),
          sku: String(item.sku || item.barcode || ''),
          name: String(item.name || 'Unnamed Product'),
          supplierName: String(item.supplierName || 'General Supplier'),
          supplierEmail: item.supplierEmail ? String(item.supplierEmail) : '',
          packSize: Math.max(1, Number(item.packSize) || 1),
          unitCostExGst: Math.max(0, Number(item.unitCostExGst) || 0),
          gstApplicable: item.gstApplicable !== false,
          updatedAt: item.updatedAt,
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to load scan catalogue from localStorage:', err);
  }
  return INITIAL_AU_SCAN_CATALOGUE;
}

export function saveScanCatalogue(items: ScanCatalogueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCAN_CATALOGUE_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to persist scan catalogue:', err);
  }
}

export interface PersistedScanPoDraft {
  metadata: ScanPoOrderMetadata;
  lines: ScanPoLineItem[];
}

export function loadScanPoDraft(): PersistedScanPoDraft {
  if (typeof window === 'undefined') {
    return { metadata: getDefaultPoMetadata(), lines: [] };
  }
  try {
    const raw = localStorage.getItem(SCAN_PO_DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const defaults = getDefaultPoMetadata();
      return {
        metadata: {
          orderMode: parsed?.metadata?.orderMode === 'rep_draft' ? 'rep_draft' : 'store_order',
          poNumber: parsed?.metadata?.poNumber || defaults.poNumber,
          storeName: parsed?.metadata?.storeName ?? defaults.storeName,
          storeAbn: parsed?.metadata?.storeAbn ?? defaults.storeAbn,
          storeEmail: parsed?.metadata?.storeEmail ?? defaults.storeEmail,
          deliveryDate: parsed?.metadata?.deliveryDate || defaults.deliveryDate,
          notes: parsed?.metadata?.notes ?? defaults.notes,
        },
        lines: Array.isArray(parsed?.lines)
          ? parsed.lines.map((line: any) => ({
              id: String(line.id || `${line.barcode}-${Date.now()}`),
              barcode: normalizeBarcode(String(line.barcode || '')),
              sku: String(line.sku || ''),
              name: String(line.name || 'Product'),
              supplierName: String(line.supplierName || 'General Supplier'),
              supplierEmail: line.supplierEmail ? String(line.supplierEmail) : '',
              packSize: Math.max(1, Number(line.packSize) || 1),
              unitCostExGst: Math.max(0, Number(line.unitCostExGst) || 0),
              cartonQty: Math.max(1, Number(line.cartonQty) || 1),
              gstApplicable: line.gstApplicable !== false,
            }))
          : [],
      };
    }
  } catch (err) {
    console.warn('Failed to load scan PO draft from localStorage:', err);
  }
  return { metadata: getDefaultPoMetadata(), lines: [] };
}

export function saveScanPoDraft(draft: PersistedScanPoDraft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCAN_PO_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (err) {
    console.warn('Failed to save scan PO draft:', err);
  }
}

function buildSeedHistoryEntry(
  id: string,
  poNumber: string,
  daysAgo: number,
  supplierName: string,
  supplierEmail: string,
  orderMode: 'store_order' | 'rep_draft',
  exportedVia: ScanPoHistoryEntry['exportedVia'],
  notes: string,
  lines: ScanPoLineItem[]
): ScanPoHistoryEntry {
  const created = new Date();
  created.setDate(created.getDate() - daysAgo);
  const delivery = new Date(created);
  delivery.setDate(delivery.getDate() + 3);

  let totalCartons = 0;
  let totalUnits = 0;
  let subtotalExGst = 0;
  let gstAmount = 0;

  lines.forEach((line) => {
    const units = line.cartonQty * Math.max(1, line.packSize);
    const ex = units * line.unitCostExGst;
    const gst = line.gstApplicable ? ex * 0.1 : 0;
    totalCartons += line.cartonQty;
    totalUnits += units;
    subtotalExGst += ex;
    gstAmount += gst;
  });

  return {
    id,
    poNumber,
    supplierName,
    supplierEmail,
    orderMode,
    storeName: 'Melbourne Central Market Store',
    storeAbn: '53 004 085 616',
    storeEmail: 'orders@centralmarketstore.com.au',
    deliveryDate: delivery.toISOString().slice(0, 10),
    notes,
    createdAt: created.toISOString(),
    exportedVia,
    lines,
    totalCartons,
    totalUnits,
    subtotalExGst: Number(subtotalExGst.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    totalIncGst: Number((subtotalExGst + gstAmount).toFixed(2)),
  };
}

export const INITIAL_SCAN_PO_HISTORY: ScanPoHistoryEntry[] = [
  buildSeedHistoryEntry(
    'hist-scp-01',
    'PO-RC-20261118-412',
    9,
    'Southern Cross Pantry Co.',
    'orders@southerncrosspantry.com.au',
    'store_order',
    'email',
    'Weekly pantry replenishment — priority end-cap olive oil restock.',
    [
      {
        id: 'hist-line-scp-1',
        barcode: '9310012045018',
        sku: 'AU-PAN-001',
        name: 'SunHarvest Extra Virgin Olive Oil 750ml',
        supplierName: 'Southern Cross Pantry Co.',
        supplierEmail: 'orders@southerncrosspantry.com.au',
        packSize: 6,
        unitCostExGst: 9.8,
        cartonQty: 4,
        gstApplicable: false,
      },
      {
        id: 'hist-line-scp-2',
        barcode: '9310012045025',
        sku: 'AU-PAN-002',
        name: 'SunHarvest Organic Rolled Oats 1kg',
        supplierName: 'Southern Cross Pantry Co.',
        supplierEmail: 'orders@southerncrosspantry.com.au',
        packSize: 12,
        unitCostExGst: 3.15,
        cartonQty: 3,
        gstApplicable: false,
      },
    ]
  ),
  buildSeedHistoryEntry(
    'hist-scp-02',
    'PO-RC-20261104-189',
    23,
    'Southern Cross Pantry Co.',
    'orders@southerncrosspantry.com.au',
    'rep_draft',
    'print',
    'Catalogue promo build ahead of pantry feature week.',
    [
      {
        id: 'hist-line-scp-3',
        barcode: '9310012045018',
        sku: 'AU-PAN-001',
        name: 'SunHarvest Extra Virgin Olive Oil 750ml',
        supplierName: 'Southern Cross Pantry Co.',
        supplierEmail: 'orders@southerncrosspantry.com.au',
        packSize: 6,
        unitCostExGst: 9.8,
        cartonQty: 6,
        gstApplicable: false,
      },
    ]
  ),
  buildSeedHistoryEntry(
    'hist-mvb-01',
    'PO-RC-20261121-705',
    6,
    'Murray Valley Beverages Pty Ltd',
    'dispatch@murrayvalleybev.com.au',
    'store_order',
    'email',
    'Chilled grab-and-go fridge top-up + sparkling multipack.',
    [
      {
        id: 'hist-line-mvb-1',
        barcode: '9321456001122',
        sku: 'AU-BEV-104',
        name: 'Murray Valley Sparkling Spring Water 6x375ml',
        supplierName: 'Murray Valley Beverages Pty Ltd',
        supplierEmail: 'dispatch@murrayvalleybev.com.au',
        packSize: 4,
        unitCostExGst: 4.4,
        cartonQty: 8,
        gstApplicable: true,
      },
      {
        id: 'hist-line-mvb-2',
        barcode: '9321456001139',
        sku: 'AU-BEV-109',
        name: 'Murray Valley Cold Brew Oat Latte 250ml',
        supplierName: 'Murray Valley Beverages Pty Ltd',
        supplierEmail: 'dispatch@murrayvalleybev.com.au',
        packSize: 12,
        unitCostExGst: 2.45,
        cartonQty: 5,
        gstApplicable: true,
      },
    ]
  ),
  buildSeedHistoryEntry(
    'hist-tcs-01',
    'PO-RC-20261114-318',
    13,
    'Tasman Craft Snacks',
    'trade@tasmancraftsnacks.com.au',
    'store_order',
    'csv',
    'Weekend snack aisle fill — include clip-strips if available.',
    [
      {
        id: 'hist-line-tcs-1',
        barcode: '9330088102041',
        sku: 'AU-SNK-201',
        name: 'Tasman Sea Salt Kettle Crisps 165g',
        supplierName: 'Tasman Craft Snacks',
        supplierEmail: 'trade@tasmancraftsnacks.com.au',
        packSize: 16,
        unitCostExGst: 2.6,
        cartonQty: 4,
        gstApplicable: true,
      },
      {
        id: 'hist-line-tcs-2',
        barcode: '9330088102058',
        sku: 'AU-SNK-204',
        name: 'Tasman Dark Chocolate Pretzel Bites 140g',
        supplierName: 'Tasman Craft Snacks',
        supplierEmail: 'trade@tasmancraftsnacks.com.au',
        packSize: 12,
        unitCostExGst: 3.2,
        cartonQty: 3,
        gstApplicable: true,
      },
    ]
  ),
];

export function loadScanPoHistory(): ScanPoHistoryEntry[] {
  if (typeof window === 'undefined') return INITIAL_SCAN_PO_HISTORY;
  try {
    const raw = localStorage.getItem(SCAN_PO_HISTORY_STORAGE_KEY);
    if (raw === null) {
      return INITIAL_SCAN_PO_HISTORY;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load scan PO history from localStorage:', err);
  }
  return INITIAL_SCAN_PO_HISTORY;
}

export function saveScanPoHistory(entries: ScanPoHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCAN_PO_HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save scan PO history:', err);
  }
}

export function recordSupplierPoSnapshot(
  history: ScanPoHistoryEntry[],
  metadata: ScanPoOrderMetadata,
  group: ScanSupplierGroup,
  exportedVia: ScanPoHistoryEntry['exportedVia']
): ScanPoHistoryEntry[] {
  const cleanPoNumber = metadata.poNumber.trim() || generatePoNumber();
  const entry: ScanPoHistoryEntry = {
    id: `hist-${cleanPoNumber}-${group.supplierName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}-${Date.now()}`,
    poNumber: cleanPoNumber,
    supplierName: group.supplierName,
    supplierEmail: group.supplierEmail || '',
    orderMode: metadata.orderMode,
    storeName: metadata.storeName || 'Retail Store',
    storeAbn: metadata.storeAbn || '',
    storeEmail: metadata.storeEmail || '',
    deliveryDate: metadata.deliveryDate || getDefaultDeliveryDate(),
    notes: metadata.notes || '',
    createdAt: new Date().toISOString(),
    exportedVia,
    lines: group.lines.map((l) => ({ ...l })),
    totalCartons: group.totalCartons,
    totalUnits: group.totalUnits,
    subtotalExGst: group.subtotalExGst,
    gstAmount: group.gstAmount,
    totalIncGst: group.totalIncGst,
  };

  const existingIdx = history.findIndex(
    (h) =>
      h.poNumber.toLowerCase() === cleanPoNumber.toLowerCase() &&
      h.supplierName.toLowerCase() === group.supplierName.toLowerCase()
  );

  if (existingIdx >= 0) {
    const next = [...history];
    next[existingIdx] = { ...entry, id: history[existingIdx].id };
    return next;
  }

  return [entry, ...history].slice(0, 100);
}

/**
 * Computes a deterministic valid EAN-13 barcode with Australian '93' prefix
 * for RangeCraft main catalog products that don't yet have an explicit barcode.
 */
export function generateDeterministicAuBarcode(sku: string, index: number): string {
  const digitsOnly = sku.replace(/\D/g, '');
  const hashSeed = Array.from(sku).reduce((acc, ch) => acc + ch.charCodeAt(0) * 7, index * 31);
  const rawBody = `93${digitsOnly}${String(hashSeed).padStart(10, '0')}`.slice(0, 12).padEnd(12, '0');
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const num = Number(rawBody[i]);
    sum += i % 2 === 0 ? num : num * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${rawBody}${checkDigit}`;
}

export function convertRangeProductsToScanCatalogue(products: Product[]): ScanCatalogueItem[] {
  return products.map((p, idx) => {
    const possibleBarcode = p.tags.find((t) => /^\d{8,14}$/.test(t.trim()));
    const barcode = possibleBarcode
      ? normalizeBarcode(possibleBarcode)
      : generateDeterministicAuBarcode(p.sku, idx);

    return {
      barcode,
      sku: p.sku,
      name: p.name,
      supplierName: p.supplierBrand?.trim() || `${p.category || 'FMCG'} Supply Co.`,
      supplierEmail: '',
      packSize: Math.max(1, p.unitsPerCarton || 12),
      unitCostExGst: Math.max(0, Number(p.cost) || 0),
      gstApplicable: true,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function groupPoLinesBySupplier(lines: ScanPoLineItem[]): ScanSupplierGroup[] {
  const map = new Map<string, ScanPoLineItem[]>();

  lines.forEach((line) => {
    const key = line.supplierName.trim() || 'Unassigned Supplier';
    const existing = map.get(key) || [];
    existing.push(line);
    map.set(key, existing);
  });

  const groups: ScanSupplierGroup[] = [];
  map.forEach((groupLines, supplierName) => {
    let totalCartons = 0;
    let totalUnits = 0;
    let subtotalExGst = 0;
    let gstAmount = 0;
    let supplierEmail = '';

    groupLines.forEach((line) => {
      if (!supplierEmail && line.supplierEmail) {
        supplierEmail = line.supplierEmail;
      }
      const units = line.cartonQty * Math.max(1, line.packSize);
      const lineEx = units * line.unitCostExGst;
      const lineGst = line.gstApplicable ? lineEx * 0.1 : 0;
      totalCartons += line.cartonQty;
      totalUnits += units;
      subtotalExGst += lineEx;
      gstAmount += lineGst;
    });

    groups.push({
      supplierName,
      supplierEmail,
      lines: groupLines,
      totalCartons,
      totalUnits,
      subtotalExGst: Number(subtotalExGst.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      totalIncGst: Number((subtotalExGst + gstAmount).toFixed(2)),
    });
  });

  return groups.sort((a, b) => a.supplierName.localeCompare(b.supplierName));
}

export function buildSampleCatalogueCsv(): string {
  const header = [
    'Barcode (EAN/UPC)',
    'SKU / Product Code',
    'Product Name',
    'Supplier Name',
    'Supplier Email',
    'Carton Pack Size',
    'Unit Cost (ex GST)',
    'GST Applicable',
  ];

  const rows = [
    [
      '9310012045018',
      'AU-PAN-001',
      'SunHarvest Extra Virgin Olive Oil 750ml',
      'Southern Cross Pantry Co.',
      'orders@southerncrosspantry.com.au',
      '6',
      '9.80',
      'No',
    ],
    [
      '9321456001122',
      'AU-BEV-104',
      'Murray Valley Sparkling Spring Water 6x375ml',
      'Murray Valley Beverages Pty Ltd',
      'dispatch@murrayvalleybev.com.au',
      '4',
      '4.40',
      'Yes',
    ],
    [
      '9330088102041',
      'AU-SNK-201',
      'Tasman Sea Salt Kettle Crisps 165g',
      'Tasman Craft Snacks',
      'trade@tasmancraftsnacks.com.au',
      '16',
      '2.60',
      'Yes',
    ],
  ];

  return [header, ...rows]
    .map((cols) => cols.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
