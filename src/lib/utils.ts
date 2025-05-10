import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const NUMBER_FORMATTING_TIERS = [
  { limit: 1e18, suffix: 'E' }, // Exa (or a game-specific term for 10^18)
  { limit: 1e15, suffix: 'P' }, // Peta (or a game-specific term for 10^15)
  { limit: 1e12, suffix: 'Q' }, // Quadrillion (as per user's sequence)
  { limit: 1e9,  suffix: 'T' },  // Trillion (as per user's sequence, e.g., 1,000,000,000 = 1T)
  { limit: 1e6,  suffix: 'M' },  // Million
];

export function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0'; // Handle null or undefined
  if (Number.isNaN(num)) return 'NaN'; // Handle NaN explicitly

  // Handle very small numbers that might cause issues with toFixed or toLocaleString if negative exponent
  if (Math.abs(num) < 1e-6 && num !== 0) {
    return num.toExponential(1);
  }

  for (const tier of NUMBER_FORMATTING_TIERS) {
    if (Math.abs(num) >= tier.limit) {
      const value = num / tier.limit;
      let formattedValue = value.toFixed(1);
      if (formattedValue.endsWith('.0')) {
        formattedValue = formattedValue.slice(0, -2);
      }
      return formattedValue + tier.suffix;
    }
  }

  // For numbers less than 1M (or the smallest tier limit)
  // If it's an integer, no decimals. If float, allow up to 1 decimal.
  return num.toLocaleString('en-US', { maximumFractionDigits: num % 1 === 0 && Math.abs(num) < 10000 ? 0 : 1 });
}
