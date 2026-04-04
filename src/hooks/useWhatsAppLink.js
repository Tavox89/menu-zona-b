import { useEffect, useRef, useState } from 'react';
import { formatBs, formatPrice, hasValidBsRate } from '../utils/price.js';
import { calcLine } from '../utils/cartTotals.js';
import { useUsdToBsRate } from '../context/RateContext.jsx';

const DEFAULT_PHONE = import.meta.env.VITE_WA_PHONE || '';
const WHATSAPP_OPEN_COOLDOWN_MS = 1500;

// Map digits to their keycap emoji representation. Ensures the variation
// selector is present so WhatsApp renders the symbol instead of �.
const numEmoji = (n) => {
  const keycaps = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  return n >= 1 && n <= 10 ? keycaps[n] : `${n}.`;
};

function normalizePrice(value) {
  if (typeof value === 'string') {
    const stripped = value.replace(/[^0-9.,-]/g, '');
    return parseFloat(stripped.replace(',', '.')) || 0;
  }

  return Number(value) || 0;
}

function getItemExtras(item) {
  return Array.isArray(item.extras) ? item.extras.map((extra) => ({ ...extra })) : [];
}

function getItemUnitUsd(item) {
  const basePrice = Number(item.basePrice ?? item.price_usd ?? item.price) || 0;
  const extrasTotal = getItemExtras(item).reduce(
    (sum, extra) => sum + normalizePrice(extra.price ?? extra.price_usd),
    0
  );

  return basePrice + extrasTotal;
}

export function createWhatsAppOrderSnapshot({
  items = [],
  note = '',
  rate,
  phone = DEFAULT_PHONE,
}) {
  const normalizedRate = Number(rate);

  return {
    items: items.map((item) => ({
      ...item,
      extras: getItemExtras(item),
    })),
    note: note.trim(),
    rate:
      hasValidBsRate(normalizedRate)
        ? normalizedRate
        : 0,
    phone: phone.trim(),
  };
}

export function buildWhatsAppOrderMessage(snapshot) {
  if (!snapshot?.items?.length) return '';

  const lines = snapshot.items.map((item, index) => {
    const extras = getItemExtras(item)
      .map((extra) => `• ${extra.label} (+${formatPrice(normalizePrice(extra.price ?? extra.price_usd))})`)
      .join('\n   ');
    const noteLine =
      item.note && item.note.trim() !== '' ? `• \uD83D\uDCDD ${item.note.trim()}` : '';
    const extrasSection = [extras, noteLine].filter(Boolean).join('\n   ');
    const formattedExtras = extrasSection ? `\n   ${extrasSection}` : '';
    const unitUsd = getItemUnitUsd(item);
    const unitBs = formatBs(unitUsd, snapshot.rate);
    const skuTxt = item.sku ? ` (SKU: ${item.sku})` : '';

    return `${numEmoji(index + 1)} ${item.name} x${item.qty} \u2013 ${formatPrice(unitUsd)} (${unitBs})${skuTxt}${formattedExtras}`;
  });

  const totalUsd = snapshot.items.reduce((sum, item) => sum + calcLine(item), 0);
  const totalBs = formatBs(totalUsd, snapshot.rate);
  const totalUsdTxt = formatPrice(totalUsd);
  const rateText =
    snapshot.rate > 0
      ? snapshot.rate.toLocaleString('es-VE', {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        })
      : 'No disponible';

  let message =
    `*Pedido del menú digital*\n` +
    `${lines.join('\n')}\n` +
    `--------------------\n` +
    `Subtotal: ${totalUsdTxt} | ${totalBs}\n` +
    `Tasa Euro: ${rateText} Bs/€`;

  if (snapshot.note) {
    message += `\n\uD83D\uDCD3 Nota: ${snapshot.note}`;
  }

  return message;
}

export function buildWhatsAppOrderLink(snapshot) {
  const message = buildWhatsAppOrderMessage(snapshot);
  if (!message || !snapshot?.phone) return '';

  return `https://api.whatsapp.com/send/?phone=${snapshot.phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
}

export function useWhatsAppOrder(options = {}) {
  const rate = useUsdToBsRate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const cooldownUntilRef = useRef(0);
  const timerRef = useRef(null);
  const configuredPhone =
    typeof options.phone === 'string' && options.phone.trim() !== ''
      ? options.phone.trim()
      : DEFAULT_PHONE;

  useEffect(() => () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
  }, []);

  const clearError = () => {
    setError('');
  };

  const sendOrder = ({ items, note = '' }) => {
    const now = Date.now();
    if (submitting || now < cooldownUntilRef.current) {
      return { ok: false, reason: 'locked' };
    }

    const snapshot = createWhatsAppOrderSnapshot({ items, note, rate, phone: configuredPhone });

    if (!snapshot.items.length) {
      setError('Agrega productos antes de enviar el pedido.');
      return { ok: false, reason: 'empty_cart' };
    }

    if (!snapshot.phone) {
      setError('Falta configurar el número de WhatsApp.');
      return { ok: false, reason: 'missing_phone' };
    }

    if (!hasValidBsRate(snapshot.rate)) {
      setError('La Tasa Euro aún no está disponible. Espera unos segundos y vuelve a intentar.');
      return { ok: false, reason: 'missing_rate' };
    }

    const link = buildWhatsAppOrderLink(snapshot);
    if (!link) {
      setError('No se pudo construir el mensaje del pedido.');
      return { ok: false, reason: 'invalid_payload' };
    }

    cooldownUntilRef.current = now + WHATSAPP_OPEN_COOLDOWN_MS;
    setSubmitting(true);
    setError('');

    const popup =
      typeof window !== 'undefined'
        ? window.open(link, '_blank', 'noopener,noreferrer')
        : null;

    if (!popup) {
      cooldownUntilRef.current = 0;
      setSubmitting(false);
      setError('No se pudo abrir WhatsApp. Revisa el bloqueo de ventanas emergentes.');
      return { ok: false, reason: 'popup_blocked', snapshot, link };
    }

    timerRef.current = window.setTimeout(() => {
      setSubmitting(false);
      timerRef.current = null;
    }, WHATSAPP_OPEN_COOLDOWN_MS);

    return { ok: true, snapshot, link };
  };

  return { submitting, error, sendOrder, clearError };
}
