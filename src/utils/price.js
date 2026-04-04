// Utilities for formatting visible monetary values in Euro and Bs.

const EURO_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BS_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(amount) {
  const num = Number(amount) || 0;
  return `€${EURO_FORMATTER.format(num)}`;
}

export function hasValidBsRate(rate) {
  const numericRate = Number(rate);
  return Number.isFinite(numericRate) && numericRate > 1;
}

/**
 * Convert a Euro visible amount into bolivars using the provided rate.
 *
 * @param {number} usd The amount displayed in Euro
 * @param {number} rate The Euro→Bs conversion rate
 * @returns {string} A string like `Bs 123.45`
 */
export function formatBs(usd, rate) {
  const u = Number(usd) || 0;
  if (!hasValidBsRate(rate)) {
    return 'Bs --';
  }

  const converted = u * Number(rate);
  return `Bs ${BS_FORMATTER.format(converted)}`;
}
