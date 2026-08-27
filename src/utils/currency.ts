import { useState, useEffect } from 'react';
import { SubscriptionTier } from '../types';

export type CurrencyCode = 'AUD' | 'USD' | 'EUR' | 'GBP' | 'NZD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rateFromAud: number; // 1 AUD in target currency
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  AUD: {
    code: 'AUD',
    symbol: '$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    rateFromAud: 1.0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    rateFromAud: 0.664, // $149 AUD = ~$99 USD, $399 AUD = ~$265 USD
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    rateFromAud: 0.615, // $149 AUD = ~€92 EUR, $399 AUD = ~€245 EUR
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    rateFromAud: 0.523, // $149 AUD = ~£78 GBP, $399 AUD = ~£209 GBP
  },
  NZD: {
    code: 'NZD',
    symbol: '$',
    name: 'New Zealand Dollar',
    flag: '🇳🇿',
    rateFromAud: 1.087, // $149 AUD = ~$162 NZD, $399 AUD = ~$434 NZD
  },
};

// Base AUD Pricing Tiers
export const BASE_PRICING_AUD: Record<SubscriptionTier, number> = {
  free_trial: 0,
  pro_planner: 149,
  enterprise_tier: 399,
};

/**
 * Automatically detect user currency from timezone or locale
 */
export function detectDefaultCurrency(): CurrencyCode {
  try {
    const saved = localStorage.getItem('rangecraft_active_currency');
    if (saved && Object.keys(CURRENCY_CONFIGS).includes(saved)) {
      return saved as CurrencyCode;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone.includes('Auckland') || timeZone.includes('Pacific/Chatham')) {
      return 'NZD';
    }
    if (timeZone.includes('London') || timeZone.includes('Belfast') || timeZone.includes('Europe/London')) {
      return 'GBP';
    }
    if (timeZone.includes('Europe/')) {
      return 'EUR';
    }
    if (timeZone.includes('America/') || timeZone.includes('US/')) {
      return 'USD';
    }
  } catch (e) {
    // fallback safely
  }
  return 'AUD';
}

/**
 * Convert an AUD amount to the active currency
 */
export function convertAudToCurrency(amountAud: number, currency: CurrencyCode): number {
  if (amountAud === 0) return 0;
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.AUD;
  return Math.round(amountAud * config.rateFromAud);
}

/**
 * Format any AUD amount dynamically in the active currency with symbols
 */
export function formatCurrency(
  amountAud: number | undefined | null,
  currency: CurrencyCode = 'AUD',
  options?: {
    showCode?: boolean;
    decimals?: number;
    compact?: boolean;
  }
): string {
  if (amountAud === undefined || amountAud === null || isNaN(amountAud)) {
    const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.AUD;
    return `${config.symbol}0 ${options?.showCode ? config.code : ''}`.trim();
  }

  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.AUD;
  const converted = amountAud * config.rateFromAud;
  const decimals = options?.decimals !== undefined ? options.decimals : 0;

  let formattedNumber: string;
  if (options?.compact && Math.abs(converted) >= 1000) {
    formattedNumber = (converted / 1000).toFixed(decimals > 0 ? decimals : 1) + 'k';
  } else {
    formattedNumber = converted.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  const codeSuffix = options?.showCode ? ` ${config.code}` : '';
  return `${config.symbol}${formattedNumber}${codeSuffix}`;
}

/**
 * Get tier pricing details for current currency
 */
export function getTierPricing(tier: SubscriptionTier, currency: CurrencyCode = 'AUD') {
  const baseAud = BASE_PRICING_AUD[tier] ?? 0;
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.AUD;
  const convertedPrice = convertAudToCurrency(baseAud, currency);

  return {
    priceAud: baseAud,
    convertedPrice,
    symbol: config.symbol,
    currencyCode: config.code,
    currencyName: config.name,
    formatted: baseAud === 0 ? `${config.symbol}0` : `${config.symbol}${convertedPrice}`,
    formattedWithCode: baseAud === 0 ? `${config.symbol}0 ${config.code}` : `${config.symbol}${convertedPrice} ${config.code}`,
  };
}

const CURRENCY_CHANGE_EVENT = 'rangecraft_currency_change';

/**
 * Broadcast currency change across components
 */
export function setActiveCurrency(currency: CurrencyCode) {
  try {
    localStorage.setItem('rangecraft_active_currency', currency);
    window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: currency }));
  } catch (e) {
    console.warn('Could not save active currency:', e);
  }
}

/**
 * React Hook for dynamic currency state across all components
 */
export function useActiveCurrency() {
  const [activeCurrency, setCurrencyState] = useState<CurrencyCode>(() => detectDefaultCurrency());

  useEffect(() => {
    const handleCurrencyChange = (e: any) => {
      if (e.detail && Object.keys(CURRENCY_CONFIGS).includes(e.detail)) {
        setCurrencyState(e.detail as CurrencyCode);
      }
    };

    window.addEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    return () => window.removeEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
  }, []);

  const changeCurrency = (currency: CurrencyCode) => {
    setCurrencyState(currency);
    setActiveCurrency(currency);
  };

  return {
    currency: activeCurrency,
    config: CURRENCY_CONFIGS[activeCurrency] || CURRENCY_CONFIGS.AUD,
    setCurrency: changeCurrency,
    format: (amountAud: number | undefined | null, options?: { showCode?: boolean; decimals?: number; compact?: boolean }) =>
      formatCurrency(amountAud, activeCurrency, options),
    getTierPrice: (tier: SubscriptionTier) => getTierPricing(tier, activeCurrency),
  };
}
