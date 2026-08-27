/**
 * Safe formatting utilities to ensure zero runtime errors with undefined / NaN numbers
 */

export function formatAud(value: number | undefined | null, decimals: number = 0): string {
  if (value === undefined || value === null || isNaN(value)) return '$0';
  if (decimals > 0) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return Math.round(value).toLocaleString();
}

export function formatPercent(value: number | undefined | null, decimals: number = 1): string {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatPrice(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  return `$${value.toFixed(2)}`;
}
