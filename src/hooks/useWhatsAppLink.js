import { useMemo } from 'react';

/**
 * Build a WhatsApp deep link message from the current cart items. The link
 * includes a formatted list of products, their quantities and selected
 * extras, plus a subtotal. The message is URL‑encoded using
 * `encodeURIComponent()`.
 *
 * @param {Array<object>} items Items from CartContext
 * @returns {string} A wa.me link ready for use in an <a> tag
 */
export function useWhatsAppLink(items) {
  return useMemo(() => {
    if (!items || items.length === 0) return '';
    const lines = items.map((item, index) => {
      const extrasLines = item.extras?.map((e) => `• ${e.label} (+$${e.price.toFixed(2)})`).join('\n   ') || '';
      const extrasSection = extrasLines ? `\n   ${extrasLines}` : '';
      return `${index + 1}\u20E3 ${item.name} x${item.qty} - $${item.basePrice.toFixed(2)}${extrasSection}`;
    });
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);
    const message = `*Pedido Zona B*\n${lines.join('\n')}\nSubtotal $${subtotal}`;
    const phone = import.meta.env.VITE_WA_PHONE || '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [items]);
}