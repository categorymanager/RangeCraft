import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  Flashlight,
  Volume2,
  VolumeX,
  Upload,
  RefreshCw,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Mail,
  Download,
  CheckCircle2,
  AlertTriangle,
  ScanBarcode,
  Sparkles,
  FileCheck2,
  Store,
  ClipboardEdit,
  X,
  History,
} from 'lucide-react';
import {
  Product,
  ScanCatalogueItem,
  ScanPoHistoryEntry,
  ScanPoLineItem,
  ScanPoOrderMetadata,
  ScanPoOrderMode,
  ScanSupplierGroup,
  ThemeMode,
} from '../types';
import {
  convertRangeProductsToScanCatalogue,
  generatePoNumber,
  getDefaultDeliveryDate,
  groupPoLinesBySupplier,
  loadScanCatalogue,
  loadScanPoDraft,
  loadScanPoHistory,
  normalizeBarcode,
  recordSupplierPoSnapshot,
  saveScanCatalogue,
  saveScanPoDraft,
  saveScanPoHistory,
} from '../data/scanCatalogueDefaults';
import { ScanCatalogueImportModal } from './ScanCatalogueImportModal';
import { ScanPoPrintSheet } from './ScanPoPrintSheet';
import { ScanSupplierOrderHistoryModal } from './ScanSupplierOrderHistoryModal';

interface StoreScanPoBuilderViewProps {
  currentTheme: ThemeMode;
  rangeProducts: Product[];
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

const SCAN_READER_ELEMENT_ID = 'rangecraft-html5-qrcode-reader';
const SCAN_COOLDOWN_MS = 1500;

export const StoreScanPoBuilderView: React.FC<StoreScanPoBuilderViewProps> = ({
  currentTheme,
  rangeProducts,
  showToast,
}) => {
  const isLight = currentTheme.includes('light');

  // Persistent Catalogue + PO Draft + Order History State
  const [catalogue, setCatalogue] = useState<ScanCatalogueItem[]>(() => loadScanCatalogue());
  const initialDraft = useMemo(() => loadScanPoDraft(), []);
  const [metadata, setMetadata] = useState<ScanPoOrderMetadata>(initialDraft.metadata);
  const [lines, setLines] = useState<ScanPoLineItem[]>(initialDraft.lines);
  const [orderHistory, setOrderHistory] = useState<ScanPoHistoryEntry[]>(() => loadScanPoHistory());

  useEffect(() => {
    saveScanCatalogue(catalogue);
  }, [catalogue]);

  useEffect(() => {
    saveScanPoDraft({ metadata, lines });
  }, [metadata, lines]);

  useEffect(() => {
    saveScanPoHistory(orderHistory);
  }, [orderHistory]);

  // Camera & Audio Scanner Controls
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<
    'idle' | 'starting' | 'active' | 'restricted' | 'error'
  >('idle');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string>('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [audioBeepEnabled, setAudioBeepEnabled] = useState(true);
  const [scanFlashItem, setScanFlashItem] = useState<string | null>(null);

  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ barcode: string; ts: number }>({ barcode: '', ts: 0 });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Manual Search + Quick Add Unknown Barcode
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickBarcode, setQuickBarcode] = useState('');
  const [quickSku, setQuickSku] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickSupplier, setQuickSupplier] = useState('');
  const [quickSupplierEmail, setQuickSupplierEmail] = useState('');
  const [quickPackSize, setQuickPackSize] = useState('12');
  const [quickUnitCost, setQuickUnitCost] = useState('');
  const [quickGst, setQuickGst] = useState(true);

  // Import Modal + History Modal + Supplier Tabs + Print/Email Popover
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySupplierFilter, setHistorySupplierFilter] = useState<string | null>(null);
  const [activeSupplierTab, setActiveSupplierTab] = useState<'all' | string>('all');
  const [printTargetSupplier, setPrintTargetSupplier] = useState<'all' | string>('all');
  const [emailPopoverSupplier, setEmailPopoverSupplier] = useState<string | null>(null);

  // Refs for clean latest-state access inside scanner callback
  const catalogueRef = useRef(catalogue);
  catalogueRef.current = catalogue;
  const audioBeepRef = useRef(audioBeepEnabled);
  audioBeepRef.current = audioBeepEnabled;

  // Auto-focus manual/HID scanner field on desktop mount (avoid hijacking mobile virtual keyboard unnecessarily)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      searchInputRef.current?.focus();
    }
  }, []);

  const playBeep = useCallback(() => {
    if (!audioBeepRef.current || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.06);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // Ignore Web Audio autoplay blocks safely
    }
  }, []);

  const triggerScanFlash = useCallback((label: string) => {
    setScanFlashItem(label);
    window.setTimeout(() => {
      setScanFlashItem((curr) => (curr === label ? null : curr));
    }, 1800);
  }, []);

  const addCatalogueItemToPo = useCallback(
    (item: ScanCatalogueItem) => {
      setLines((prev) => {
        const existingIdx = prev.findIndex(
          (l) => normalizeBarcode(l.barcode) === normalizeBarcode(item.barcode)
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = {
            ...next[existingIdx],
            cartonQty: next[existingIdx].cartonQty + 1,
          };
          return next;
        }
        const newLine: ScanPoLineItem = {
          id: `${item.barcode}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          barcode: item.barcode,
          sku: item.sku,
          name: item.name,
          supplierName: item.supplierName,
          supplierEmail: item.supplierEmail || '',
          packSize: Math.max(1, item.packSize || 1),
          unitCostExGst: Math.max(0, item.unitCostExGst || 0),
          cartonQty: 1,
          gstApplicable: item.gstApplicable,
        };
        return [newLine, ...prev];
      });
      playBeep();
      triggerScanFlash(item.name);
      showToast(`Added +1 ctn: ${item.name}`, 'success');
    },
    [playBeep, triggerScanFlash, showToast]
  );

  const openQuickAddForBarcode = useCallback((rawBarcode: string) => {
    const normalized = normalizeBarcode(rawBarcode);
    setQuickBarcode(normalized);
    setQuickSku(normalized ? `SKU-${normalized.slice(-5)}` : '');
    setQuickName('');
    setQuickSupplier('');
    setQuickSupplierEmail('');
    setQuickPackSize('12');
    setQuickUnitCost('');
    setQuickGst(true);
    setShowQuickAdd(true);
  }, []);

  const processScannedBarcode = useCallback(
    (rawCode: string, fromCamera: boolean) => {
      const normalized = normalizeBarcode(rawCode);
      if (!normalized) return;

      if (fromCamera) {
        const now = Date.now();
        if (
          lastScannedRef.current.barcode === normalized &&
          now - lastScannedRef.current.ts < SCAN_COOLDOWN_MS
        ) {
          return;
        }
        lastScannedRef.current = { barcode: normalized, ts: now };
      }

      const match = catalogueRef.current.find(
        (c) => normalizeBarcode(c.barcode) === normalized || c.sku.toLowerCase() === normalized.toLowerCase()
      );

      if (match) {
        addCatalogueItemToPo(match);
      } else {
        playBeep();
        openQuickAddForBarcode(normalized);
        showToast(`Barcode ${normalized} not found — complete Quick Add below.`, 'info');
      }
    },
    [addCatalogueItemToPo, openQuickAddForBarcode, playBeep, showToast]
  );

  const stopCamera = useCallback(async () => {
    const qr = html5QrRef.current;
    if (qr) {
      try {
        if (qr.isScanning) {
          await qr.stop();
        }
      } catch {
        // Ignore stop errors
      }
      try {
        qr.clear();
      } catch {
        // Ignore clear errors
      }
      html5QrRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setTorchSupported(false);
    setCameraStatus((prev) => (prev === 'restricted' ? 'restricted' : 'idle'));
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    if (cameraActive) {
      await stopCamera();
      return;
    }

    setCameraErrorMsg('');
    setCameraStatus('starting');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('restricted');
      setCameraErrorMsg('Camera access unavailable in this browser or iframe preview.');
      return;
    }

    try {
      const qr = new Html5Qrcode(SCAN_READER_ELEMENT_ID, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });
      html5QrRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 130 },
          aspectRatio: 1.6,
        },
        (decodedText) => {
          processScannedBarcode(decodedText, true);
        },
        () => {
          // Per-frame non-match is normal while scanning
        }
      );

      setCameraActive(true);
      setCameraStatus('active');

      // Inspect torch capability safely
      try {
        const caps = qr.getRunningTrackCameraCapabilities();
        const torchFeature = caps?.torchFeature?.();
        setTorchSupported(Boolean(torchFeature?.isSupported?.()));
      } catch {
        setTorchSupported(false);
      }
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      const isPermissionOrIframe =
        msg.toLowerCase().includes('permission') ||
        msg.toLowerCase().includes('notallowed') ||
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('policy') ||
        msg.toLowerCase().includes('notfound');
      setCameraStatus(isPermissionOrIframe ? 'restricted' : 'error');
      setCameraErrorMsg(
        isPermissionOrIframe
          ? 'Camera blocked by browser permission or preview iframe. Use Bluetooth/Manual search or Simulate Scan below.'
          : msg || 'Unable to start camera viewfinder.'
      );
      html5QrRef.current = null;
      setCameraActive(false);
    }
  };

  const handleToggleTorch = async () => {
    const qr = html5QrRef.current;
    if (!qr || !torchSupported) return;
    try {
      const caps = qr.getRunningTrackCameraCapabilities();
      const torchFeature = caps?.torchFeature?.();
      if (torchFeature?.isSupported?.()) {
        const nextState = !torchOn;
        await torchFeature.apply(nextState);
        setTorchOn(nextState);
      }
    } catch {
      showToast('Torch control is not supported on this device camera.', 'info');
    }
  };

  // Search Dropdown Results
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return catalogue.slice(0, 6);
    return catalogue
      .filter(
        (item) =>
          item.barcode.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.supplierName.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [catalogue, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchQuery.trim();
    if (!raw) return;

    const exactBarcodeOrSku = catalogue.find(
      (c) => normalizeBarcode(c.barcode) === normalizeBarcode(raw) || c.sku.toLowerCase() === raw.toLowerCase()
    );

    if (exactBarcodeOrSku) {
      addCatalogueItemToPo(exactBarcodeOrSku);
      setSearchQuery('');
      return;
    }

    if (searchMatches.length === 1) {
      addCatalogueItemToPo(searchMatches[0]);
      setSearchQuery('');
      return;
    }

    if (/^\d{6,14}$/.test(normalizeBarcode(raw))) {
      processScannedBarcode(raw, false);
      setSearchQuery('');
      return;
    }

    if (searchMatches.length > 0) {
      addCatalogueItemToPo(searchMatches[0]);
      setSearchQuery('');
    } else {
      openQuickAddForBarcode(raw);
      setSearchQuery('');
    }
  };

  const handleSimulateRandomScan = () => {
    if (catalogue.length === 0) return;
    const picked = catalogue[Math.floor(Math.random() * catalogue.length)];
    addCatalogueItemToPo(picked);
  };

  const handleSaveQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = normalizeBarcode(quickBarcode);
    const name = quickName.trim();
    const supplierName = quickSupplier.trim();
    const unitCostExGst = parseFloat(quickUnitCost);
    const packSize = Math.max(1, parseInt(quickPackSize, 10) || 1);

    if (!barcode || !name || !supplierName || Number.isNaN(unitCostExGst)) {
      showToast('Please enter Barcode, Product Name, Supplier Name, and Unit Cost.', 'info');
      return;
    }

    const newItem: ScanCatalogueItem = {
      barcode,
      sku: quickSku.trim() || barcode,
      name,
      supplierName,
      supplierEmail: quickSupplierEmail.trim(),
      packSize,
      unitCostExGst: Math.max(0, Number(unitCostExGst.toFixed(2))),
      gstApplicable: quickGst,
      updatedAt: new Date().toISOString(),
    };

    setCatalogue((prev) => {
      const idx = prev.findIndex((i) => normalizeBarcode(i.barcode) === barcode);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newItem;
        return next;
      }
      return [newItem, ...prev];
    });

    addCatalogueItemToPo(newItem);
    setShowQuickAdd(false);
    setQuickBarcode('');
  };

  // Catalogue Merge/Replace & RangeCraft Sync
  const handleImportComplete = (importedItems: ScanCatalogueItem[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setCatalogue(importedItems);
      showToast(`Replaced barcode catalogue with ${importedItems.length} SKUs.`, 'success');
      return;
    }
    setCatalogue((prev) => {
      const map = new Map<string, ScanCatalogueItem>();
      prev.forEach((item) => map.set(normalizeBarcode(item.barcode), item));
      importedItems.forEach((item) => map.set(normalizeBarcode(item.barcode), item));
      return Array.from(map.values());
    });
    showToast(`Merged ${importedItems.length} SKUs into persistent barcode catalogue.`, 'success');
  };

  const handleSyncRangeProducts = () => {
    if (rangeProducts.length === 0) {
      showToast('Your RangeCraft Product Catalog is currently empty. Add SKUs there or import a CSV here.', 'info');
      return;
    }
    const converted = convertRangeProductsToScanCatalogue(rangeProducts);
    setCatalogue((prev) => {
      const map = new Map<string, ScanCatalogueItem>();
      prev.forEach((item) => map.set(normalizeBarcode(item.barcode), item));
      converted.forEach((item) => {
        const bySku = Array.from(map.values()).find(
          (existing) => existing.sku.toLowerCase() === item.sku.toLowerCase()
        );
        if (bySku) {
          map.set(normalizeBarcode(bySku.barcode), {
            ...bySku,
            name: item.name,
            supplierName: item.supplierName,
            packSize: item.packSize,
            unitCostExGst: item.unitCostExGst,
            updatedAt: item.updatedAt,
          });
        } else {
          map.set(normalizeBarcode(item.barcode), item);
        }
      });
      return Array.from(map.values());
    });
    showToast(`Synced ${converted.length} RangeCraft SKUs into Scan & Order catalogue.`, 'success');
  };

  // Supplier Auto-Grouping & Totals
  const supplierGroups = useMemo<ScanSupplierGroup[]>(() => groupPoLinesBySupplier(lines), [lines]);

  useEffect(() => {
    if (
      activeSupplierTab !== 'all' &&
      !supplierGroups.some((g) => g.supplierName === activeSupplierTab)
    ) {
      setActiveSupplierTab('all');
    }
  }, [supplierGroups, activeSupplierTab]);

  const visibleGroups = useMemo(
    () =>
      activeSupplierTab === 'all'
        ? supplierGroups
        : supplierGroups.filter((g) => g.supplierName === activeSupplierTab),
    [supplierGroups, activeSupplierTab]
  );

  const grandTotals = useMemo(() => {
    return supplierGroups.reduce(
      (acc, g) => ({
        cartons: acc.cartons + g.totalCartons,
        units: acc.units + g.totalUnits,
        subtotalExGst: Number((acc.subtotalExGst + g.subtotalExGst).toFixed(2)),
        gstAmount: Number((acc.gstAmount + g.gstAmount).toFixed(2)),
        totalIncGst: Number((acc.totalIncGst + g.totalIncGst).toFixed(2)),
      }),
      { cartons: 0, units: 0, subtotalExGst: 0, gstAmount: 0, totalIncGst: 0 }
    );
  }, [supplierGroups]);

  // Line Item Mutations
  const updateLineCartons = (id: string, delta: number) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, cartonQty: Math.max(1, l.cartonQty + delta) } : l))
    );
  };

  const toggleLineGst = (id: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, gstApplicable: !l.gstApplicable } : l))
    );
  };

  const deleteLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleClearPo = () => {
    setLines([]);
    setMetadata((prev) => ({ ...prev, poNumber: generatePoNumber() }));
    showToast('Cleared active Purchase Order lines and issued a fresh PO number.', 'info');
  };

  // History Tracking & Template Reload Helpers
  const openSupplierHistoryModal = (supplierName: string | null) => {
    setHistorySupplierFilter(supplierName);
    setIsHistoryModalOpen(true);
  };

  const handleSaveCurrentSupplierSnapshot = () => {
    if (!historySupplierFilter) return;
    const targetGroup = supplierGroups.find(
      (g) => g.supplierName.toLowerCase() === historySupplierFilter.toLowerCase()
    );
    if (!targetGroup) return;
    setOrderHistory((prev) => recordSupplierPoSnapshot(prev, metadata, targetGroup, 'manual'));
    showToast(`Saved ${targetGroup.supplierName} (${metadata.poNumber}) to Order History.`, 'success');
  };

  const handleLoadHistoryTemplate = (
    entry: ScanPoHistoryEntry,
    mode: 'fresh_draft' | 'merge'
  ) => {
    const clonedLines: ScanPoLineItem[] = entry.lines.map((l, idx) => ({
      ...l,
      id: `${l.barcode}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    }));

    if (mode === 'fresh_draft') {
      setLines(clonedLines);
      setMetadata((prev) => ({
        ...prev,
        orderMode: entry.orderMode,
        poNumber: generatePoNumber(),
        storeName: entry.storeName || prev.storeName,
        storeAbn: entry.storeAbn ?? prev.storeAbn,
        storeEmail: entry.storeEmail || prev.storeEmail,
        deliveryDate: getDefaultDeliveryDate(),
        notes: entry.notes || prev.notes,
      }));
      setActiveSupplierTab(entry.supplierName);
      showToast(
        `Loaded ${entry.poNumber} (${entry.supplierName}) as a fresh draft template.`,
        'success'
      );
    } else {
      setLines((prev) => {
        const next = [...prev];
        clonedLines.forEach((incoming) => {
          const existingIdx = next.findIndex(
            (l) => normalizeBarcode(l.barcode) === normalizeBarcode(incoming.barcode)
          );
          if (existingIdx >= 0) {
            next[existingIdx] = {
              ...next[existingIdx],
              cartonQty: next[existingIdx].cartonQty + incoming.cartonQty,
            };
          } else {
            next.push(incoming);
          }
        });
        return next;
      });
      setActiveSupplierTab(entry.supplierName);
      showToast(
        `Merged ${clonedLines.length} lines from ${entry.poNumber} (${entry.supplierName}) into current PO.`,
        'success'
      );
    }

    setIsHistoryModalOpen(false);
  };

  const handleDeleteHistoryEntry = (id: string) => {
    setOrderHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Removed order from history.', 'info');
  };

  // Print / Email / CSV Export Helpers
  const triggerPrint = (supplier: 'all' | string) => {
    if (lines.length === 0) {
      showToast('Scan or add at least one product before printing a PO.', 'info');
      return;
    }
    const groupsToRecord =
      supplier === 'all'
        ? supplierGroups
        : supplierGroups.filter((g) => g.supplierName === supplier);
    if (groupsToRecord.length > 0) {
      setOrderHistory((prev) =>
        groupsToRecord.reduce(
          (acc, g) => recordSupplierPoSnapshot(acc, metadata, g, 'print'),
          prev
        )
      );
    }
    setPrintTargetSupplier(supplier);
    window.setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleEmailPo = (group: ScanSupplierGroup, recipientMode: 'supplier' | 'store' | 'both') => {
    const supplierEmail = group.supplierEmail?.trim() || '';
    const storeEmail = metadata.storeEmail?.trim() || '';

    let toList: string[] = [];
    if (recipientMode === 'supplier' && supplierEmail) toList = [supplierEmail];
    else if (recipientMode === 'store' && storeEmail) toList = [storeEmail];
    else if (recipientMode === 'both') {
      toList = [supplierEmail, storeEmail].filter(Boolean);
    }

    const orderTypeLabel =
      metadata.orderMode === 'rep_draft' ? 'Rep Replenishment Draft (Pending Store Approval)' : 'Firm Order';
    const subject = `Purchase Order ${metadata.poNumber} - ${metadata.storeName || 'Store'} (${group.supplierName})`;

    const tableRows = group.lines.map((l) => {
      const units = l.cartonQty * l.packSize;
      const lineEx = units * l.unitCostExGst;
      return `${l.sku} | ${l.barcode} | ${l.name} | ${l.packSize}/ctn | ${l.cartonQty} ctn (${units} u) | $${l.unitCostExGst.toFixed(2)} | ${l.gstApplicable ? '10% GST' : 'GST-Free'} | $${lineEx.toFixed(2)}`;
    });

    const bodyLines = [
      `PURCHASE ORDER: ${metadata.poNumber}`,
      `Order Type: ${orderTypeLabel}`,
      `Store: ${metadata.storeName || 'Retail Store'}${metadata.storeAbn ? ` (ABN/Acc: ${metadata.storeAbn})` : ''}`,
      `Supplier: ${group.supplierName}`,
      `Requested Delivery Date: ${metadata.deliveryDate || 'ASAP'}`,
      '',
      'SKU | Barcode | Product | Pack | Qty | Unit Cost (ex GST) | GST | Line Total (ex GST)',
      '------------------------------------------------------------------------------------',
      ...tableRows,
      '------------------------------------------------------------------------------------',
      `Subtotal (ex GST): $${group.subtotalExGst.toFixed(2)} AUD`,
      `GST (10%): $${group.gstAmount.toFixed(2)} AUD`,
      `Total Payable (inc GST): $${group.totalIncGst.toFixed(2)} AUD`,
      '',
      metadata.notes ? `Order Notes: ${metadata.notes}` : '',
      metadata.orderMode === 'rep_draft'
        ? '\nNOTE: This is a Rep Replenishment Draft pending Store Manager approval.'
        : '',
    ]
      .filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== ''))
      .join('\n');

    const mailtoUrl = `mailto:${encodeURIComponent(toList.join(','))}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines)}`;

    setOrderHistory((prev) => recordSupplierPoSnapshot(prev, metadata, group, 'email'));
    setEmailPopoverSupplier(null);
    window.location.href = mailtoUrl;

    if (toList.length === 0) {
      showToast('Opened email draft (no email address saved yet — enter recipient in your mail app).', 'info');
    } else {
      showToast(`Opened PO email draft for ${group.supplierName}.`, 'success');
    }
  };

  const handleDownloadSupplierCsv = (group: ScanSupplierGroup) => {
    const header = [
      'PO Number',
      'Order Mode',
      'Store Name',
      'Store ABN',
      'Delivery Date',
      'Supplier Name',
      'SKU',
      'Barcode',
      'Product Name',
      'Pack Size',
      'Carton Qty',
      'Total Units',
      'Unit Cost (ex GST)',
      'GST Rate',
      'Line Total (ex GST)',
      'Line GST',
      'Line Total (inc GST)',
    ];

    const rows = group.lines.map((l) => {
      const units = l.cartonQty * l.packSize;
      const lineEx = units * l.unitCostExGst;
      const gst = l.gstApplicable ? lineEx * 0.1 : 0;
      return [
        metadata.poNumber,
        metadata.orderMode === 'rep_draft' ? 'Rep Draft - Pending Store Approval' : 'Firm Order',
        metadata.storeName,
        metadata.storeAbn,
        metadata.deliveryDate,
        group.supplierName,
        l.sku,
        l.barcode,
        l.name,
        l.packSize,
        l.cartonQty,
        units,
        l.unitCostExGst.toFixed(2),
        l.gstApplicable ? '10%' : '0%',
        lineEx.toFixed(2),
        gst.toFixed(2),
        (lineEx + gst).toFixed(2),
      ];
    });

    const csvContent = [header, ...rows]
      .map((cols) => cols.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeSupplier = group.supplierName.replace(/[^a-z0-9]/gi, '_');
    a.href = url;
    a.download = `${metadata.poNumber}_${safeSupplier}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOrderHistory((prev) => recordSupplierPoSnapshot(prev, metadata, group, 'csv'));
    showToast(`Downloaded PO CSV for ${group.supplierName}.`, 'success');
  };

  // Shared Styling Tokens
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-[#111726] border-slate-800 text-slate-100';
  const inputCls = isLight
    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white'
    : 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <>
      <div className="no-print space-y-5 pb-28 md:pb-24">
        {/* Top Module Header & Catalogue Controls */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <ScanBarcode className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Store Scan &amp; PO Builder
              </h1>
            </div>
            <div className={`flex flex-wrap items-center gap-2 text-xs ${mutedText}`}>
              <span>{catalogue.length} SKUs saved on device</span>
              <span aria-hidden="true">·</span>
              <span>EAN-13 / UPC / Code-128 ready</span>
              <span aria-hidden="true">·</span>
              <span>Auto-splits by supplier</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {rangeProducts.length > 0 && (
              <button
                type="button"
                onClick={handleSyncRangeProducts}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Sync RangeCraft SKUs ({rangeProducts.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsImporterOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Catalogue (CSV / Excel)</span>
            </button>
          </div>
        </div>

        {/* Rep Draft Watermark Banner on Workspace */}
        {metadata.orderMode === 'rep_draft' && (
          <div
            className={`rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              isLight
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-amber-950/30 border-amber-700/70 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <ClipboardEdit className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Draft – Pending Store Approval · Rep Replenishment Mode Active</span>
            </div>
            <span className="text-[11px] opacity-85">
              Printouts and emails include store manager sign-off verification
            </span>
          </div>
        )}

        {/* Main Responsive Workspace Grid (1-col mobile -> 12-col desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN (5 cols desktop): Live Camera Scanner + Manual/Bluetooth + Quick Add */}
          <div className="lg:col-span-5 space-y-4">
            {/* Scanner Card */}
            <section className={`rounded-2xl border p-4 space-y-3.5 ${cardBg}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold">Barcode Scanner</h2>
                  <p className={`text-xs ${mutedText}`}>
                    1.5s duplicate cooldown · Rear camera or Bluetooth HID
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                    cameraStatus === 'active'
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                      : cameraStatus === 'restricted' || cameraStatus === 'error'
                      ? isLight
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-amber-950/40 border-amber-700 text-amber-300'
                      : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-600'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {cameraStatus === 'active'
                    ? 'Camera Live'
                    : cameraStatus === 'starting'
                    ? 'Starting...'
                    : cameraStatus === 'restricted'
                    ? 'Preview / Fallback'
                    : cameraStatus === 'error'
                    ? 'Camera Error'
                    : 'Camera Idle'}
                </span>
              </div>

              {/* Camera Viewfinder Container */}
              <div
                className={`relative rounded-xl border overflow-hidden min-h-[190px] flex flex-col items-center justify-center ${
                  isLight ? 'bg-slate-900 border-slate-300' : 'bg-black border-slate-800'
                }`}
              >
                <div id={SCAN_READER_ELEMENT_ID} className="w-full" />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-slate-200">
                    <Camera className="w-8 h-8 text-blue-400 mb-2" />
                    <p className="text-xs font-semibold">
                      {cameraStatus === 'restricted' || cameraStatus === 'error'
                        ? 'Live camera blocked in current frame'
                        : 'Tap Start Camera to scan aisle barcodes'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      {cameraErrorMsg ||
                        'Supports EAN-13, EAN-8, UPC-A, UPC-E & Code-128 with instant beep feedback.'}
                    </p>
                  </div>
                )}

                {/* Green Confirmation Flash Overlay */}
                {scanFlashItem && (
                  <div className="absolute inset-x-3 bottom-3 z-20 rounded-xl bg-emerald-600/95 text-white px-3.5 py-2.5 shadow-lg flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">Scanned: {scanFlashItem}</span>
                  </div>
                )}
              </div>

              {/* Camera Controls Row (All >=44px touch targets) */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                    cameraActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {cameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  <span>{cameraActive ? 'Stop' : 'Start Camera'}</span>
                </button>

                <button
                  type="button"
                  disabled={!torchSupported || !cameraActive}
                  onClick={handleToggleTorch}
                  title={
                    torchSupported
                      ? 'Toggle camera torch'
                      : 'Torch available when rear camera is active on supported devices'
                  }
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap transition-colors ${
                    torchOn
                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                      : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Flashlight className="w-4 h-4" />
                  <span>{torchOn ? 'Torch On' : 'Torch'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudioBeepEnabled((v) => !v)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                    audioBeepEnabled
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-600'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {audioBeepEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  <span>{audioBeepEnabled ? 'Beep On' : 'Beep Off'}</span>
                </button>
              </div>

              {/* Manual Barcode / Bluetooth HID Input + Live Dropdown */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <form onSubmit={handleSearchSubmit} className="relative space-y-2">
                  <label className="block text-xs font-bold">
                    Manual Barcode / SKU / Product Search (Bluetooth HID Ready)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 180)}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Scan barcode or search SKU / product..."
                        className={`w-full min-h-[44px] pl-9 pr-3 rounded-xl border text-sm font-mono focus:outline-none ${inputCls}`}
                      />
                    </div>
                    <button
                      type="submit"
                      className="min-h-[44px] px-4 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>

                  {/* Live Matching Dropdown */}
                  {(isSearchFocused || searchQuery.trim().length > 0) && searchMatches.length > 0 && (
                    <div
                      className={`rounded-xl border divide-y max-h-60 overflow-y-auto shadow-lg ${
                        isLight
                          ? 'bg-white border-slate-200 divide-slate-100'
                          : 'bg-slate-950 border-slate-800 divide-slate-800'
                      }`}
                    >
                      {searchMatches.map((item) => (
                        <button
                          key={`${item.barcode}-${item.sku}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addCatalogueItemToPo(item);
                            setSearchQuery('');
                          }}
                          className={`w-full min-h-[48px] px-3 py-2 text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            isLight ? 'hover:bg-blue-50/70' : 'hover:bg-slate-900'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{item.name}</p>
                            <p className={`text-[11px] font-mono truncate ${mutedText}`}>
                              {item.barcode} · {item.sku} · {item.supplierName}
                            </p>
                          </div>
                          <div className="text-right shrink-0 tabular-nums">
                            <p className="text-xs font-mono font-bold">
                              ${item.unitCostExGst.toFixed(2)}
                            </p>
                            <p className={`text-[10px] ${mutedText}`}>{item.packSize}/ctn</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </form>

                {/* Desktop Testing Simulator + Quick Add Unknown Barcode Trigger */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateRandomScan}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                      isLight
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                        : 'bg-indigo-950/50 border-indigo-800 text-indigo-300 hover:bg-indigo-900/50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Simulate Random Scan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQuickAdd((v) => !v)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                      showQuickAdd
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>+ Quick Add Unknown Barcode</span>
                  </button>
                </div>
              </div>

              {/* Inline Quick Add Unknown Barcode Form */}
              {showQuickAdd && (
                <form
                  onSubmit={handleSaveQuickAdd}
                  className={`rounded-xl border p-3.5 space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900/80 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Quick Add Unknown Barcode to PO &amp; Catalogue
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowQuickAdd(false)}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      aria-label="Close Quick Add"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Barcode *</label>
                      <input
                        type="text"
                        required
                        value={quickBarcode}
                        onChange={(e) => setQuickBarcode(e.target.value)}
                        placeholder="9310012099999"
                        className={`w-full min-h-[40px] px-3 rounded-lg border text-xs font-mono ${inputCls}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">SKU Code</label>
                      <input
                        type="text"
                        value={quickSku}
                        onChange={(e) => setQuickSku(e.target.value)}
                        placeholder="SKU-NEW-01"
                        className={`w-full min-h-[40px] px-3 rounded-lg border text-xs font-mono ${inputCls}`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        placeholder="e.g. Byron Bay Macadamia Cookies 200g"
                        className={`w-full min-h-[40px] px-3 rounded-lg border text-xs ${inputCls}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Supplier Name *</label>
                      <input
                        type="text"
                        required
                        value={quickSupplier}
                        onChange={(e) => setQuickSupplier(e.target.value)}
                        placeholder="e.g. Northern Rivers Foods"
                        className={`w-full min-h-[40px] px-3 rounded-lg border text-xs ${inputCls}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Supplier Email</label>
                      <input
                        type="email"
                        value={quickSupplierEmail}
                        onChange={(e) => setQuickSupplierEmail(e.target.value)}
                        placeholder="orders@supplier.com.au"
                        className={`w-full min-h-[40px] px-3 rounded-lg border text-xs ${inputCls}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Pack Size (units/ctn) *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={quickPackSize}
                        onChange={(e) => setQuickPackSize(e.target.value)}
                        className={`w-full min-h-[40px] px-3 rounded-lg border text-xs font-mono ${inputCls}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Unit Cost ex GST ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        required
                        value={quickUnitCost}
                        onChange={(e) => setQuickUnitCost(e.target.value)}
                        placeholder="3.50"
                        className={`w-full min-h-[40px] px-3 rounded-lg border text-xs font-mono ${inputCls}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setQuickGst((v) => !v)}
                      className={`min-h-[38px] px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                        quickGst
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
                          : isLight
                          ? 'bg-white border-slate-300 text-slate-700'
                          : 'bg-slate-950 border-slate-700 text-slate-300'
                      }`}
                    >
                      {quickGst ? 'GST Applicable (10%)' : 'GST-Free (0%)'}
                    </button>
                    <button
                      type="submit"
                      className="min-h-[42px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Save &amp; Add to PO
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN (7 cols desktop): Order Mode, Metadata, Supplier Tabs & Lines */}
          <div className="lg:col-span-7 space-y-4">
            {/* Order Mode + Store Metadata Card */}
            <section className={`rounded-2xl border p-4 space-y-4 ${cardBg}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold">Order Mode &amp; Store Details</h2>
                  <p className={`text-xs ${mutedText}`}>
                    Switch between firm Store Staff orders and Rep Replenishment drafts
                  </p>
                </div>

                {/* Mode Toggle */}
                <div
                  className={`grid grid-cols-2 p-1 rounded-xl border text-xs font-bold shrink-0 ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {(
                    [
                      { id: 'store_order', label: 'Store Staff Order', icon: Store },
                      { id: 'rep_draft', label: 'Rep Draft', icon: ClipboardEdit },
                    ] as Array<{ id: ScanPoOrderMode; label: string; icon: React.FC<{ className?: string }> }>
                  ).map((modeOpt) => {
                    const ModeIcon = modeOpt.icon;
                    const active = metadata.orderMode === modeOpt.id;
                    return (
                      <button
                        key={modeOpt.id}
                        type="button"
                        onClick={() =>
                          setMetadata((prev) => ({ ...prev, orderMode: modeOpt.id }))
                        }
                        className={`min-h-[40px] px-3 py-1.5 rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                          active
                            ? modeOpt.id === 'rep_draft'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'bg-blue-600 text-white shadow-xs'
                            : mutedText
                        }`}
                      >
                        <ModeIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{modeOpt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">PO Number</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={metadata.poNumber}
                      onChange={(e) =>
                        setMetadata((prev) => ({ ...prev, poNumber: e.target.value }))
                      }
                      className={`flex-1 min-h-[42px] px-3 rounded-xl border text-xs font-mono font-bold ${inputCls}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMetadata((prev) => ({ ...prev, poNumber: generatePoNumber() }))
                      }
                      title="Generate new PO number"
                      className={`min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl border cursor-pointer ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                          : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">
                    Requested Delivery Date
                  </label>
                  <input
                    type="date"
                    value={metadata.deliveryDate}
                    onChange={(e) =>
                      setMetadata((prev) => ({ ...prev, deliveryDate: e.target.value }))
                    }
                    className={`w-full min-h-[42px] px-3 rounded-xl border text-xs font-mono ${inputCls}`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">Store Name *</label>
                  <input
                    type="text"
                    value={metadata.storeName}
                    onChange={(e) =>
                      setMetadata((prev) => ({ ...prev, storeName: e.target.value }))
                    }
                    placeholder="Melbourne Central Market Store"
                    className={`w-full min-h-[42px] px-3 rounded-xl border text-xs ${inputCls}`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">
                    Store ABN / Account # (optional)
                  </label>
                  <input
                    type="text"
                    value={metadata.storeAbn}
                    onChange={(e) =>
                      setMetadata((prev) => ({ ...prev, storeAbn: e.target.value }))
                    }
                    placeholder="e.g. 53 004 085 616 / ACC-402"
                    className={`w-full min-h-[42px] px-3 rounded-xl border text-xs font-mono ${inputCls}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold mb-1">
                    Store Contact Email
                  </label>
                  <input
                    type="email"
                    value={metadata.storeEmail}
                    onChange={(e) =>
                      setMetadata((prev) => ({ ...prev, storeEmail: e.target.value }))
                    }
                    placeholder="orders@store.com.au"
                    className={`w-full min-h-[42px] px-3 rounded-xl border text-xs ${inputCls}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold mb-1">Order Notes</label>
                  <textarea
                    rows={2}
                    value={metadata.notes}
                    onChange={(e) =>
                      setMetadata((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Receiving dock hours, promo display instructions..."
                    className={`w-full p-3 rounded-xl border text-xs resize-none ${inputCls}`}
                  />
                </div>
              </div>
            </section>

            {/* Supplier Auto-Split Tabs & PO Line Items */}
            <section className={`rounded-2xl border p-4 space-y-4 ${cardBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <h2 className="text-sm font-bold">
                    Purchase Order Items ({lines.length} SKUs · {supplierGroups.length} Suppliers)
                  </h2>
                  <p className={`text-xs ${mutedText}`}>
                    Automatically grouped into separate supplier POs
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {supplierGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={() => triggerPrint('all')}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print All POs</span>
                    </button>
                  )}
                  {lines.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearPo}
                      className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Clear Order
                    </button>
                  )}
                </div>
              </div>

              {/* Supplier Filter Tabs */}
              {supplierGroups.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSupplierTab('all')}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer border transition-colors ${
                      activeSupplierTab === 'all'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    All Suppliers ({supplierGroups.length})
                  </button>
                  {supplierGroups.map((group) => {
                    const active = activeSupplierTab === group.supplierName;
                    return (
                      <button
                        key={group.supplierName}
                        type="button"
                        onClick={() => setActiveSupplierTab(group.supplierName)}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer border transition-colors tabular-nums ${
                          active
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {group.supplierName} · ${group.totalIncGst.toFixed(2)}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {lines.length === 0 ? (
                <div
                  className={`rounded-2xl border border-dashed p-8 text-center space-y-3 ${
                    isLight ? 'border-slate-300 bg-slate-50/60' : 'border-slate-800 bg-slate-900/40'
                  }`}
                >
                  <FileCheck2 className="w-9 h-9 text-blue-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold">No items scanned onto this PO yet</p>
                    <p className={`text-xs max-w-md mx-auto ${mutedText}`}>
                      Start the rear camera, scan with a Bluetooth barcode reader, search above, or{' '}
                      <strong>re-load a past supplier order</strong> as a quick draft template.
                    </p>
                  </div>
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => openSupplierHistoryModal(null)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                          : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                      }`}
                    >
                      <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>View Order History ({orderHistory.length})</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {visibleGroups.map((group) => (
                    <div
                      key={group.supplierName}
                      className={`rounded-2xl border overflow-hidden ${
                        isLight ? 'border-slate-200 bg-slate-50/40' : 'border-slate-800 bg-slate-900/30'
                      }`}
                    >
                      {/* Supplier Group Header + Separate Export Actions */}
                      <div
                        className={`p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-extrabold truncate">
                              {group.supplierName}
                            </h3>
                            <span className={`text-xs tabular-nums ${mutedText}`}>
                              {group.lines.length} lines · {group.totalCartons} ctn ({group.totalUnits} units)
                            </span>
                          </div>
                          <p className={`text-[11px] mt-0.5 truncate ${mutedText}`}>
                            {group.supplierEmail || 'No supplier email mapped'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 relative">
                          {(() => {
                            const supplierHistoryCount = orderHistory.filter(
                              (h) => h.supplierName.toLowerCase() === group.supplierName.toLowerCase()
                            ).length;
                            return (
                              <button
                                type="button"
                                onClick={() => openSupplierHistoryModal(group.supplierName)}
                                className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                                  isLight
                                    ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                                    : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                                }`}
                              >
                                <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>
                                  View Order History
                                  {supplierHistoryCount > 0 ? ` (${supplierHistoryCount})` : ''}
                                </span>
                              </button>
                            );
                          })()}

                          <button
                            type="button"
                            onClick={() => triggerPrint(group.supplierName)}
                            className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                                : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                            }`}
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Print / Save PDF</span>
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setEmailPopoverSupplier((curr) =>
                                  curr === group.supplierName ? null : group.supplierName
                                )
                              }
                              className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                                  : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                              }`}
                            >
                              <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Email PO</span>
                            </button>

                            {emailPopoverSupplier === group.supplierName && (
                              <div
                                className={`absolute right-0 top-full mt-1.5 w-52 rounded-xl border shadow-xl p-1.5 z-30 space-y-1 ${
                                  isLight
                                    ? 'bg-white border-slate-200 text-slate-900'
                                    : 'bg-slate-950 border-slate-700 text-slate-100'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleEmailPo(group, 'supplier')}
                                  className={`w-full min-h-[38px] px-3 py-1.5 rounded-lg text-left text-xs font-semibold cursor-pointer ${
                                    isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                                  }`}
                                >
                                  Email Supplier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEmailPo(group, 'store')}
                                  className={`w-full min-h-[38px] px-3 py-1.5 rounded-lg text-left text-xs font-semibold cursor-pointer ${
                                    isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                                  }`}
                                >
                                  Email Store
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEmailPo(group, 'both')}
                                  className={`w-full min-h-[38px] px-3 py-1.5 rounded-lg text-left text-xs font-bold cursor-pointer text-blue-600 dark:text-blue-400 ${
                                    isLight ? 'hover:bg-blue-50' : 'hover:bg-blue-950/40'
                                  }`}
                                >
                                  Email Both
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownloadSupplierCsv(group)}
                            className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                                : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                            }`}
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Download PO CSV</span>
                          </button>
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {group.lines.map((line) => {
                          const cartonCostExGst = line.unitCostExGst * Math.max(1, line.packSize);
                          const totalUnits = line.cartonQty * Math.max(1, line.packSize);
                          const lineExGst = totalUnits * line.unitCostExGst;

                          return (
                            <div
                              key={line.id}
                              className={`p-3.5 space-y-3 ${
                                isLight ? 'bg-white' : 'bg-[#111726]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <p className="text-sm font-bold leading-snug">{line.name}</p>
                                  <div
                                    className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-mono ${mutedText}`}
                                  >
                                    <span>SKU {line.sku}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>EAN {line.barcode}</span>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-sans font-semibold text-blue-600 dark:text-blue-400">
                                      {line.supplierName}
                                    </span>
                                  </div>
                                  <div
                                    className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs tabular-nums ${mutedText}`}
                                  >
                                    <span>{line.packSize} units/ctn</span>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-mono">
                                      Unit ${line.unitCostExGst.toFixed(2)}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-mono">
                                      Carton ${cartonCostExGst.toFixed(2)} ex GST
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => deleteLine(line.id)}
                                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl cursor-pointer transition-colors shrink-0 ${
                                    isLight
                                      ? 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                                      : 'text-slate-400 hover:bg-rose-950/40 hover:text-rose-400'
                                  }`}
                                  aria-label={`Remove ${line.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Controls Row: Carton Stepper + GST Toggle + Line Total */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateLineCartons(line.id, -1)}
                                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border cursor-pointer ${
                                      isLight
                                        ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                                        : 'bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800'
                                    }`}
                                    aria-label="Decrease carton quantity"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <div className="min-w-[68px] text-center tabular-nums">
                                    <p className="text-base font-mono font-extrabold leading-none">
                                      {line.cartonQty}
                                    </p>
                                    <p className={`text-[10px] mt-0.5 ${mutedText}`}>
                                      ctn ({totalUnits} u)
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => updateLineCartons(line.id, 1)}
                                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border cursor-pointer ${
                                      isLight
                                        ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                                        : 'bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800'
                                    }`}
                                    aria-label="Increase carton quantity"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleLineGst(line.id)}
                                    className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                                      line.gstApplicable
                                        ? isLight
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                          : 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                                        : isLight
                                        ? 'bg-slate-100 border-slate-300 text-slate-700'
                                        : 'bg-slate-800 border-slate-700 text-slate-300'
                                    }`}
                                  >
                                    {line.gstApplicable ? '10% GST' : 'GST-Free'}
                                  </button>

                                  <div className="text-right tabular-nums min-w-[84px]">
                                    <p className="text-sm font-mono font-extrabold">
                                      ${lineExGst.toFixed(2)}
                                    </p>
                                    <p className={`text-[10px] ${mutedText}`}>ex GST</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Supplier Subtotal Bar */}
                      <div
                        className={`p-3.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-800'
                            : 'bg-slate-900/70 border-slate-800 text-slate-200'
                        }`}
                      >
                        <span>
                          Subtotal ex GST: <strong className="font-mono">${group.subtotalExGst.toFixed(2)}</strong>
                          <span className="mx-2" aria-hidden="true">·</span>
                          GST: <strong className="font-mono">${group.gstAmount.toFixed(2)}</strong>
                        </span>
                        <span className="text-sm font-extrabold">
                          {group.supplierName} Total:{' '}
                          <span className="font-mono text-blue-600 dark:text-blue-400">
                            ${group.totalIncGst.toFixed(2)} inc GST
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Compact Sticky Bottom Summary Bar (no-print, positioned cleanly above mobile bottom nav) */}
      <div
        className={`no-print fixed bottom-16 md:bottom-0 inset-x-0 z-30 border-t backdrop-blur-md px-3 sm:px-6 py-2.5 transition-colors ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-900'
            : 'bg-[#0b0f19]/95 border-slate-800 text-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 tabular-nums">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-extrabold truncate">
              {grandTotals.cartons} Cartons ({grandTotals.units} units) ·{' '}
              <span className="font-mono text-blue-600 dark:text-blue-400">
                ${grandTotals.totalIncGst.toFixed(2)} inc GST
              </span>
            </p>
            <p className={`text-[11px] truncate ${mutedText}`}>
              {supplierGroups.length} supplier PO{supplierGroups.length === 1 ? '' : 's'} · Ex GST $
              {grandTotals.subtotalExGst.toFixed(2)} + GST ${grandTotals.gstAmount.toFixed(2)}
            </p>
          </div>

          <button
            type="button"
            disabled={lines.length === 0}
            onClick={() => triggerPrint(activeSupplierTab)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>{activeSupplierTab === 'all' ? 'Print / Save PDF' : 'Print Supplier PO'}</span>
          </button>
        </div>
      </div>

      {/* Catalogue Importer Modal */}
      <ScanCatalogueImportModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        currentTheme={currentTheme}
        existingCount={catalogue.length}
        onImportComplete={handleImportComplete}
      />

      {/* Supplier Order History & Template Reloader Modal */}
      <ScanSupplierOrderHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        currentTheme={currentTheme}
        supplierFilter={historySupplierFilter}
        onChangeSupplierFilter={setHistorySupplierFilter}
        history={orderHistory}
        hasActiveLines={lines.length > 0}
        canSaveActiveSupplier={
          Boolean(historySupplierFilter) &&
          supplierGroups.some(
            (g) => g.supplierName.toLowerCase() === historySupplierFilter?.toLowerCase()
          )
        }
        onSaveCurrentSupplierToHistory={handleSaveCurrentSupplierSnapshot}
        onLoadTemplate={handleLoadHistoryTemplate}
        onDeleteHistoryEntry={handleDeleteHistoryEntry}
      />

      {/* A4 Australian Purchase Order Print Layout */}
      <ScanPoPrintSheet
        metadata={metadata}
        supplierGroups={supplierGroups}
        targetSupplier={printTargetSupplier}
      />
    </>
  );
};
