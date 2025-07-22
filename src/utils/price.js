// Utilities for formatting monetary values in both USD and Bs.
//
// The formatPrice function formats a number as a US dollar string with
// two decimal places. If a falsy value is provided it falls back to $0.00.
//
// The formatBs function takes a USD value and a conversion rate and returns
// a string formatted in bolívares. If no rate is provided the USD amount
// is returned unchanged. Two decimals are always shown.

export function formatPrice(amount) {
  const num = Number(amount) || 0;
  return `$${num.toFixed(2)}`;
}

/**
 * Convert a USD amount into bolívares using the provided rate.
 *
 * @param {number} usd The amount in US dollars
 * @param {number} rate The USD→Bs conversion rate
 * @returns {string} A string like `Bs 123.45`
 */
export function formatBs(usd, rate) {
  const u = Number(usd) || 0;
  const r = Number(rate) || 0;
  const converted = r > 0 ? u * r : u;
  return `Bs ${converted.toFixed(2)}`;
}