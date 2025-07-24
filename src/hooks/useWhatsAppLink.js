import { useMemo } from 'react';
import { formatPrice, formatBs } from '../utils/price.js';
import { calcLine } from '../utils/cartTotals.js';
import { useUsdToBsRate } from '../context/RateContext.jsx';

const numEmoji = (n) =>
  n === 10 ? '🔟' : n <= 9 ? `${n}\uFE0F\u20E3` : `${n}.`;

/**
 * Build a WhatsApp deep link message from the current cart items. The link
 * includes a formatted list of products, their quantities and selected
 * extras, plus a subtotal. Optionally includes per-product notes and a
 * global note at the end. The message is URL‑encoded using
 * `encodeURIComponent()`.
 *
 * @param {Array<object>} items Items from CartContext
 * @param {string} note Global note to append at the end of the message
 * @returns {string} A wa.me link ready for use in an <a> tag
 */
export function useWhatsAppLink(items, note = '') {
    const rate = useUsdToBsRate();
  return useMemo(() => {
    if (!items || items.length === 0) return '';
    const lines = items.map((item, index) => {
      const extrasLines =
        item.extras
         ?.map((e) => `• ${e.label} (+${formatPrice(e.price)})`)
          .join('\n    ') || '';
      const noteLine =
        item.note && item.note.trim() !== '' ? `• \uD83D\uDCDD ${item.note.trim()}` : '';
      const extrasSection = [extrasLines, noteLine].filter(Boolean).join('\n    ');
      const formattedExtras = extrasSection ? `\n    ${extrasSection}` : '';
      const skuPart = item.sku ? ` (SKU: ${item.sku})` : '';
      return `${numEmoji(index + 1)} ${item.name} x${item.qty}${skuPart}${formattedExtras}`;
    });
    const totalUsd = items.reduce((sum, i) => sum + calcLine(i), 0);
    const subtotalUsd = formatPrice(totalUsd);
    const subtotalBs = formatBs(totalUsd, rate);

    const parts = [
      '*Pedido Zona\u202FB*',
      ...lines,
      '--------------------',
      `Subtotal: ${subtotalUsd} | ${subtotalBs}`,
      `Tasa BCV: ${rate.toFixed(2)} Bs/$`,
    ];

    if (note && note.trim() !== '') {
  parts.push(`\uD83D\uDCD3 Nota: ${note.trim()}`);
    }
        const message = parts.join('\n');
    const phone = import.meta.env.VITE_WA_PHONE || '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [items, note, rate]);
}
