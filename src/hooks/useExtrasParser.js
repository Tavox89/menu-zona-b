import { useMemo } from 'react';

/**
 * Transform the current extras selections into a normalized array suitable
 * for storing in the cart. The UI collects user selections keyed by
 * groupId; this hook looks up the corresponding option details from the
 * product definition and returns an array of objects containing the
 * groupId, optionId, label and price. If no selections are present
 * returns an empty array.
 *
 * @param {object} product Enriched product with tavoxExtras
 * @param {Record<string,string|string[]>} selected Map of groupId → optionId or array of optionIds
 */
export function useExtrasParser(product, selected) {
  return useMemo(() => {
    const groups = product?.tavoxExtras || [];
    const parsed = [];
    for (const g of groups) {
      const sel = selected?.[g.groupId];
      if (!sel) continue;
      const selIds = Array.isArray(sel) ? sel : [sel];
      selIds.forEach((id) => {
        const opt = g.options.find((o) => o.id === id);
        if (opt) parsed.push({ groupId: g.groupId, optionId: opt.id, label: opt.label, price: opt.price });
      });
    }
    return parsed;
  }, [product, selected]);
}