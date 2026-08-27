/**
 * Real-time Analytics & Telemetry Tracker for RangeCraft AU
 * Integrates:
 * 1. Google Analytics 4 (GA4)
 * 2. Firebase Analytics
 * 3. Microsoft Clarity (100% Free Session Recording & Drop-Off Heatmaps)
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    clarity?: (...args: any[]) => void;
  }
}

// Environment Configurations
export const GA4_MEASUREMENT_ID = ((import.meta as any).env?.VITE_GA4_MEASUREMENT_ID as string) || 'G-KZNE8P2GRJ';
export const CLARITY_PROJECT_ID = ((import.meta as any).env?.VITE_CLARITY_PROJECT_ID as string) || 'q4v9x2k8l1';

let isInitialized = false;

/**
 * Initialize GA4, Firebase Analytics, and Microsoft Clarity dynamically
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  // 1. Initialize GA4 (Google Analytics 4)
  try {
    if (!window.dataLayer) {
      window.dataLayer = [];
    }
    if (!window.gtag) {
      window.gtag = function () {
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', GA4_MEASUREMENT_ID, {
        send_page_view: true,
        currency: 'AUD',
        app_name: 'RangeCraft AU'
      });
    }

    // Inject Google tag script if not already present
    if (!document.getElementById('ga4-script')) {
      const script = document.createElement('script');
      script.id = 'ga4-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }
  } catch (err) {
    console.warn('GA4 init warning:', err);
  }

  // 2. Initialize Microsoft Clarity (100% Free Session Replays & Heatmaps)
  try {
    if (!window.clarity && !document.getElementById('clarity-script')) {
      (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r);
        t.id = 'clarity-script';
        t.async = 1;
        t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
    }
  } catch (err) {
    console.warn('Microsoft Clarity init warning:', err);
  }
}

/**
 * Track custom user event across GA4 and Microsoft Clarity
 */
export function trackEvent(eventName: string, params?: Record<string, any>): void {
  try {
    // GA4 Tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        ...params,
        timestamp: new Date().toISOString()
      });
    }

    // Microsoft Clarity Custom Event
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', eventName);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (typeof v === 'string' || typeof v === 'number') {
            window.clarity?.('set', k, String(v));
          }
        });
      }
    }
  } catch (e) {
    // Silent fail in offline/sandboxed environments
  }
}

/**
 * 1. Track Button Clicks with module context
 */
export function trackButtonClick(buttonName: string, module: string, metadata?: Record<string, any>): void {
  trackEvent('button_click', {
    button_name: buttonName,
    module: module,
    ...metadata
  });
}

/**
 * 2. Track Paywall Views & Micro-Checkout Triggers
 */
export function trackPaywallView(featureName: string, priceAud: number, userTier: string): void {
  trackEvent('paywall_view', {
    feature_name: featureName,
    price_aud: priceAud,
    currency: 'AUD',
    user_tier: userTier,
    value: priceAud
  });
}

/**
 * 3. Track Conversion Funnel: Begin Checkout
 */
export function trackBeginCheckout(
  exportId: string,
  itemName: string,
  priceAud: number,
  planType: 'single_export' | 'pro_subscription'
): void {
  trackEvent('begin_checkout', {
    item_id: exportId,
    item_name: itemName,
    value: priceAud,
    currency: 'AUD',
    plan_type: planType,
    items: [
      {
        item_id: exportId,
        item_name: itemName,
        price: priceAud,
        quantity: 1
      }
    ]
  });
}

/**
 * 4. Track Conversion Funnel: Purchase Complete
 */
export function trackPurchaseSuccess(
  exportId: string,
  itemName: string,
  priceAud: number,
  transactionId: string,
  paymentMethod = 'stripe_card'
): void {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: priceAud,
    currency: 'AUD',
    tax: Number((priceAud * 0.1).toFixed(2)), // 10% Australian GST
    shipping: 0,
    payment_type: paymentMethod,
    items: [
      {
        item_id: exportId,
        item_name: itemName,
        price: priceAud,
        quantity: 1
      }
    ]
  });
}

/**
 * 5. Track Real File Downloads (PDF / Excel / CSV)
 */
export function trackExportDownload(exportType: string, format: 'xlsx' | 'pdf' | 'csv' | 'pptx', filename: string): void {
  trackEvent('file_download', {
    export_type: exportType,
    file_format: format,
    file_name: filename
  });
}

/**
 * 6. Set User Identity & Session Tags for Clarity & GA4
 */
export function setUserAnalyticsContext(userId: string, tier: string, company?: string): void {
  try {
    if (window.gtag) {
      window.gtag('set', 'user_properties', {
        user_tier: tier,
        company: company || 'Australian Retailer'
      });
    }
    if (window.clarity) {
      window.clarity('identify', userId, undefined, undefined, tier);
      window.clarity('set', 'userTier', tier);
      if (company) window.clarity('set', 'company', company);
    }
  } catch (e) {}
}
