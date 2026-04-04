const STORAGE_KEY = 'tavox_usd_bs_rate_from_eur';
const STORAGE_UPDATED_KEY = 'tavox_usd_bs_rate_from_eur_updated_at';
const CACHE_TTL_MS = 30 * 60 * 1000;
const DEFAULT_RATE = null;
const TIMEOUT = 10000;
const RATE_ENDPOINT = '/wp-json/fox-rate/v1/currencies';
const FALLBACK_RATE_BASE = 'https://clubsamsve.com';
let lastKnownRate = null;
let inFlightRatePromise = null;

export function isValidUsdToBsRate(rate) {
  const numericRate = Number(rate);
  return Number.isFinite(numericRate) && numericRate > 1;
}

function normalizeBaseURL(value = '') {
  return value.trim().replace(/\/+$/, '');
}

function buildRateEndpoint(baseURL) {
  const normalized = normalizeBaseURL(baseURL);
  if (!normalized) return RATE_ENDPOINT;
  if (normalized.endsWith(RATE_ENDPOINT)) return normalized;
  if (normalized.endsWith('/wp-json/fox-rate/v1')) return `${normalized}/currencies`;
  if (normalized.endsWith('/wp-json')) return `${normalized}/fox-rate/v1/currencies`;
  return `${normalized}${RATE_ENDPOINT}`;
}

function getCandidateEndpoints() {
  const envBase = normalizeBaseURL(import.meta.env.VITE_RATE_BASE || '');
  const currentOrigin =
    typeof window !== 'undefined' ? normalizeBaseURL(window.location.origin || '') : '';

  return [
    ...new Set([FALLBACK_RATE_BASE, envBase, currentOrigin].filter(Boolean).map(buildRateEndpoint)),
  ];
}

function clearStoredRate() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_UPDATED_KEY);
}

function getStoredRate() {
  if (typeof window === 'undefined') return null;
  const rate = Number(localStorage.getItem(STORAGE_KEY));
  if (isValidUsdToBsRate(rate)) {
    return rate;
  }

  clearStoredRate();
  return null;
}

export function getCachedUsdToBsRate() {
  return getStoredRate();
}

function getFreshCachedRate() {
  const rate = getStoredRate();
  if (rate === null || typeof window === 'undefined') return null;

  const updatedAt = Number(localStorage.getItem(STORAGE_UPDATED_KEY));
  if (!Number.isFinite(updatedAt) || updatedAt <= 0) return null;

  return Date.now() - updatedAt < CACHE_TTL_MS ? rate : null;
}

function storeRate(rate) {
  if (typeof window === 'undefined' || !isValidUsdToBsRate(rate)) return;
  localStorage.setItem(STORAGE_KEY, String(rate));
  localStorage.setItem(STORAGE_UPDATED_KEY, String(Date.now()));
}

function extractUsdToBsRate(data) {
  const eurRate = Number(data?.EUR?.rate);
  if (isValidUsdToBsRate(eurRate)) {
    return eurRate;
  }

  throw new Error('Respuesta de tasa EUR->Bs invalida');
}

async function fetchRate(endpoint) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return extractUsdToBsRate(data);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/** Devuelve la tasa USD → Bs tomando el valor EUR.rate del endpoint. Si falla → null. */
export async function getUsdToBsRate() {
  const freshCachedRate = getFreshCachedRate();
  if (freshCachedRate !== null) {
    lastKnownRate = freshCachedRate;
    return freshCachedRate;
  }

  if (inFlightRatePromise) {
    return inFlightRatePromise;
  }

  inFlightRatePromise = (async () => {
    const staleCachedRate = getStoredRate() ?? lastKnownRate;
    const failures = [];

    for (const endpoint of getCandidateEndpoints()) {
      try {
        const rate = await fetchRate(endpoint);
        lastKnownRate = rate;
        storeRate(rate);
        return rate;
      } catch (err) {
        failures.push({
          endpoint,
          code: err.code ?? null,
          status: err.response?.status ?? null,
          message: err.message,
        });
      }
    }

    if (failures.length) {
      console.error('Error al obtener tasa USD→Bs', failures);
    }

    lastKnownRate = staleCachedRate ?? DEFAULT_RATE;
    return lastKnownRate;
  })();

  try {
    return await inFlightRatePromise;
  } finally {
    inFlightRatePromise = null;
  }
}
