import { calcLine } from './cartTotals.js';
import { buildCartItemId } from './cartItem.js';
import { normalizeSearchText } from './search.js';

const STORAGE_KEY = 'tavox_order_history_v1';
const MAX_HISTORY_ITEMS = 6;

function normalizeExtraPrice(value) {
  if (typeof value === 'string') {
    const stripped = value.replace(/[^0-9.,-]/g, '');
    return parseFloat(stripped.replace(',', '.')) || 0;
  }

  return Number(value) || 0;
}

export function readOrderHistory() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrderHistory(entries) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage write failures.
  }
}

export function appendOrderHistory(snapshot) {
  if (!snapshot?.items?.length) return readOrderHistory();

  const totalUsd = snapshot.items.reduce((sum, item) => sum + calcLine(item), 0);
  const rate = Number(snapshot.rate) || 0;
  const totalBs = rate > 0 ? totalUsd * rate : 0;
  const entry = {
    id: `${Date.now()}-${snapshot.items.length}`,
    createdAt: new Date().toISOString(),
    note: snapshot.note ?? '',
    rate,
    totals: {
      usd: totalUsd,
      bs: totalBs,
    },
    items: snapshot.items.map((item) => ({
      productId: Number(item.productId ?? item.id) || 0,
      sku: item.sku ?? '',
      name: item.name,
      qty: Number(item.qty) || 0,
      note: item.note ?? '',
      basePrice: Number(item.basePrice ?? item.price_usd ?? item.price) || 0,
      image: item.image ?? '',
      extras: (item.extras ?? []).map((extra) => ({
        id: extra.id ?? extra.option_id ?? '',
        option_id: extra.option_id ?? extra.id ?? '',
        group_id: extra.group_id ?? '',
        label: extra.label ?? '',
        price: normalizeExtraPrice(extra.price ?? extra.price_usd),
      })),
    })),
  };

  const nextEntries = [entry, ...readOrderHistory()].slice(0, MAX_HISTORY_ITEMS);
  writeOrderHistory(nextEntries);

  return nextEntries;
}

function matchExtra(savedExtra, productExtras = []) {
  const groups = Array.isArray(productExtras) ? productExtras : [];
  const byStableId = groups.flatMap((group) =>
    (group.options ?? []).map((option) => ({
      group_id: group.group_id ?? '',
      option_id: option.option_id ?? option.id ?? '',
      option,
    }))
  );

  const stableMatch = byStableId.find(
    (entry) =>
      entry.option_id &&
      entry.option_id === (savedExtra.option_id ?? savedExtra.id)
  );
  if (stableMatch) {
    return {
      id: stableMatch.option.option_id ?? stableMatch.option.id ?? stableMatch.option_id,
      option_id: stableMatch.option.option_id ?? stableMatch.option.id ?? stableMatch.option_id,
      group_id: stableMatch.option.group_id ?? stableMatch.group_id,
      label: stableMatch.option.label,
      price: normalizeExtraPrice(stableMatch.option.price),
    };
  }

  const normalizedLabel = normalizeSearchText(savedExtra.label);
  const labelMatch = byStableId.find(
    (entry) => normalizeSearchText(entry.option.label) === normalizedLabel
  );

  if (!labelMatch) return null;

  return {
    id: labelMatch.option.option_id ?? labelMatch.option.id ?? labelMatch.option_id,
    option_id: labelMatch.option.option_id ?? labelMatch.option.id ?? labelMatch.option_id,
    group_id: labelMatch.option.group_id ?? labelMatch.group_id,
    label: labelMatch.option.label,
    price: normalizeExtraPrice(labelMatch.option.price),
  };
}

export function resolveOrderHistoryEntry(entry, products = []) {
  const productMap = new Map(products.map((product) => [Number(product.id), product]));
  const unavailableProducts = [];
  const unavailableExtras = [];
  let repricedLines = 0;

  const items = (entry?.items ?? []).flatMap((savedItem) => {
    const product = productMap.get(Number(savedItem.productId));
    if (!product) {
      unavailableProducts.push(savedItem.name);
      return [];
    }

    const resolvedExtras = (savedItem.extras ?? []).flatMap((savedExtra) => {
      const nextExtra = matchExtra(savedExtra, product.extras);
      if (!nextExtra) {
        unavailableExtras.push(`${savedItem.name}: ${savedExtra.label}`);
        return [];
      }

      return [nextExtra];
    });

    const basePrice = Number(product.price_usd ?? product.price) || 0;
    const savedExtraTotal = (savedItem.extras ?? []).reduce(
      (sum, extra) => sum + normalizeExtraPrice(extra.price),
      0
    );
    const resolvedExtraTotal = resolvedExtras.reduce(
      (sum, extra) => sum + normalizeExtraPrice(extra.price),
      0
    );
    if (basePrice !== Number(savedItem.basePrice ?? 0) || savedExtraTotal !== resolvedExtraTotal) {
      repricedLines += 1;
    }

    return [{
      id: buildCartItemId(product.id, resolvedExtras, savedItem.note ?? ''),
      productId: product.id,
      sku: product.sku ?? '',
      name: product.name,
      qty: Number(savedItem.qty) || 1,
      basePrice,
      extras: resolvedExtras,
      note: savedItem.note ?? '',
      image: product.image || savedItem.image || '',
      lineTotal: 0,
    }];
  });

  return {
    items,
    unavailableProducts,
    unavailableExtras,
    repricedLines,
  };
}
