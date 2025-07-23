import { useMemo } from 'react';
import { formatPrice } from '../utils/price.js';

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
  return useMemo(() => {
    if (!items || items.length === 0) return '';
    const lines = items.map((item, index) => {
      const extrasLines =
        item.extras
         ?.map((e) => `• ${e.label} (+${formatPrice(e.price)})`)
          .join('\n   ') || '';
      const noteLine = item.note && item.note.trim() !== '' ? `• ${item.note.trim()}` : '';
      const extrasSection = [extrasLines, noteLine].filter(Boolean).join('\n   ');
      const formattedExtras = extrasSection ? `\n   ${extrasSection}` : '';
         return `${index + 1}\u20E3 ${item.name} x${item.qty} - ${formatPrice(
        item.basePrice ?? 0
     )}${formattedExtras}`;
    });
    const subtotal = formatPrice(items.reduce((sum, i) => sum + i.lineTotal, 0));
    let message = `*Pedido Zona B*\n${lines.join('\n')}\nSubtotal ${subtotal}`;
    if (note && note.trim() !== '') {
      message += `\n📓 Nota: ${note.trim()}`;
    }
    const phone = import.meta.env.VITE_WA_PHONE || '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [items, note]);
}
