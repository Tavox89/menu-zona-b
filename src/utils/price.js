/**
 * Format a numeric price into a US‑dollar string. WooCommerce products
 * expose prices as numbers; converting them to a formatted string in one
 * place avoids repeated logic and ensures consistent formatting across
 * the application.
 *
 * @param {number} price Raw price in USD
 * @returns {string} e.g. "$19.99"
 */
export function formatPrice(price = 0) {
  const n = Number(price);
  if (Number.isNaN(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
  }

/**
 * Format a USD amount converted to bolívares using the given rate.
 * The resulting string is prefixed with "Bs" and uses two decimal digits.
 *
 * @param {number} price Price in USD
 * @param {number} rate  Conversion rate USD -> Bs
 * @returns {string} e.g. "Bs 600.00"
 */
export function formatBs(price = 0, rate = 1) {
  const n = Number(price) * Number(rate);
  if (Number.isNaN(n)) return 'Bs 0.00';
  return `Bs ${n.toFixed(2)}`;
}