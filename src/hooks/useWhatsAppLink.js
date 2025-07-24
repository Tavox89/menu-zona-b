import { useMemo } from 'react';
import { formatPrice, formatBs } from '../utils/price.js';
import { calcLine } from '../utils/cartTotals.js';
import { useUsdToBsRate } from '../context/RateContext.jsx';

// Map digits to their keycap emoji representation. Ensures the variation
// selector is present so WhatsApp renders the symbol instead of �.
const numEmoji = (n) => {
  const map = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  return n >= 1 && n <= 10 ? map[n] : `${n}.`;
};

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
          .join('\n   ') || '';
      const noteLine =
        item.note && item.note.trim() !== '' ? `• \uD83D\uDCDD ${item.note.trim()}` : '';
      const extrasSection = [extrasLines, noteLine].filter(Boolean).join('\n   ');
      const formattedExtras = extrasSection ? `\n   ${extrasSection}` : '';

      const priceBs = formatBs(item.basePrice, rate);
      const skuTxt = item.sku ? ` (SKU: ${item.sku})` : '';
      return `${numEmoji(index + 1)} ${item.name} x${item.qty} \u2013 ${formatPrice(item.basePrice)} (${priceBs})${skuTxt}${formattedExtras}`;
    });
    const totalUsd = items.reduce((sum, i) => sum + calcLine(i), 0);
   const totalBs = formatBs(totalUsd, rate);
    const totalUsdTxt = formatPrice(totalUsd);

     let message =
      `*Pedido Zona B*\n` +
      `${lines.join('\n')}\n` +
      `--------------------\n` +
      `Subtotal: ${totalUsdTxt} | ${totalBs}\n` +
      `Tasa BCV: ${rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/$`;

    if (note && note.trim() !== '') {
   message += `\n\uD83D\uDCD3 Nota: ${note.trim()}`;
    }

    const phone = import.meta.env.VITE_WA_PHONE || '';
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }, [items, note, rate]);
}
