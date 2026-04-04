import { sanitizeFulfillmentMode } from './fulfillment.js';

export function buildCartItemId(productId, extras = [], note = '', fulfillmentMode = 'dine_in') {
  const extrasSignature = [...extras]
    .map((extra) => extra.option_id ?? extra.id ?? extra.label ?? '')
    .filter(Boolean)
    .join('|');
  const noteSignature = note ? note.trim().replace(/\s+/g, '_') : '';
  const fulfillmentSignature = sanitizeFulfillmentMode(fulfillmentMode);

  return `${productId}-${extrasSignature}-${noteSignature}-${fulfillmentSignature}`;
}
