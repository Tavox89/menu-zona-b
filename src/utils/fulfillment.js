export function sanitizeFulfillmentMode(value, fallback = 'dine_in') {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'takeaway') {
    return 'takeaway';
  }

  if (normalized === 'dine_in') {
    return 'dine_in';
  }

  return fallback === 'takeaway' ? 'takeaway' : 'dine_in';
}

export function getFulfillmentModeLabel(value) {
  return sanitizeFulfillmentMode(value) === 'takeaway' ? 'Para llevar' : 'En mesa';
}

export function getFulfillmentModeChipColor(value) {
  return sanitizeFulfillmentMode(value) === 'takeaway' ? 'warning' : 'primary';
}

export function getEffectiveItemFulfillmentMode(item, fallback = 'dine_in') {
  return sanitizeFulfillmentMode(item?.fulfillmentMode ?? item?.fulfillment_mode, fallback);
}

export function formatPrepElapsed(seconds) {
  const total = Math.max(0, Number(seconds || 0) || 0);
  const safeSeconds = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor(total / 60);

  if (minutes < 60) {
    return `${minutes}:${safeSeconds}`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = (minutes % 60).toString().padStart(2, '0');

  return `${hours}:${restMinutes}:${safeSeconds}`;
}
