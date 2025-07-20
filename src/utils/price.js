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