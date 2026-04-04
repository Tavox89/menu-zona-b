import { sanitizeFulfillmentMode } from './fulfillment.js';

function normalizeExtra(extra) {
  return {
    groupId: String(extra?.groupId ?? extra?.group_id ?? ''),
    optionId: String(extra?.optionId ?? extra?.option_id ?? ''),
    label: String(extra?.label ?? '').trim(),
    price: Number(extra?.price ?? extra?.price_usd ?? 0) || 0,
  };
}

function normalizeItem(item, defaultFulfillmentMode = 'dine_in') {
  return {
    id: String(item?.id ?? ''),
    productId: Number(item?.productId ?? item?.product_id ?? 0) || 0,
    sku: String(item?.sku ?? '').trim(),
    name: String(item?.name ?? '').trim(),
    qty: Math.max(1, Number(item?.qty ?? 1) || 1),
    basePrice: Number(item?.basePrice ?? item?.price_usd ?? item?.price ?? 0) || 0,
    extras: Array.isArray(item?.extras) ? item.extras.map(normalizeExtra) : [],
    note: String(item?.note ?? '').trim(),
    fulfillment_mode: sanitizeFulfillmentMode(
      item?.fulfillmentMode ?? item?.fulfillment_mode,
      defaultFulfillmentMode
    ),
  };
}

export function createRequestKey(prefix = 'req') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function buildMenuOrderPayload({
  items = [],
  note = '',
  brandScope = 'zona_b',
  clientLabel = '',
  requestKey = '',
  fulfillmentMode = 'dine_in',
} = {}) {
  const normalizedFulfillmentMode = sanitizeFulfillmentMode(fulfillmentMode, 'dine_in');

  return {
    request_key: requestKey || createRequestKey('tavox'),
    items: Array.isArray(items)
      ? items
          .map((item) => normalizeItem(item, normalizedFulfillmentMode))
          .filter((item) => item.productId > 0)
      : [],
    note: String(note ?? '').trim(),
    brand_scope: String(brandScope || 'zona_b').trim(),
    client_label: String(clientLabel || '').trim(),
    fulfillment_mode: normalizedFulfillmentMode,
  };
}
