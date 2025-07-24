/**
 * Calculate the total USD for a single line item. Extra prices may come
 * from either a numeric `price` property, a `price_usd` property or a
 * formatted string such as "$1.00". We normalise the value by
 * stripping currency symbols and separators before converting to a
 * number. The total for the line is the unit cost (base price plus
 * extras) multiplied by the quantity.
 *
 * @param {object} item Cart line item
 * @returns {number} The computed line total in USD
 */
export function calcLine(item) {
  const extrasTotal = (item.extras ?? []).reduce((t, e) => {
    const raw = e.price ?? e.price_usd ?? 0;
    let val = 0;
    if (typeof raw === 'string') {
      const stripped = raw.replace(/[^0-9.,-]/g, '');
      val = parseFloat(stripped.replace(',', '.')) || 0;
    } else {
      val = Number(raw) || 0;
    }
    return t + val;
  }, 0);
  const unit = Number(item.basePrice ?? 0) + extrasTotal;
  return unit * (item.qty || 0);
}

/**
 * Sum the totals of all line items. Non-array arguments return 0.
 *
 * @param {Array} items
 * @returns {number}
 */
export function calcSubtotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((t, it) => t + calcLine(it), 0);
}