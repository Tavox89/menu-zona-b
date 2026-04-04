import { api } from '../lib/axios.js';

const MENU_BOOTSTRAP_CACHE_KEY = 'tavox_menu_bootstrap_v1';
const MENU_BOOTSTRAP_MAX_AGE_MS = 1000 * 60 * 30;

let menuBootstrapMemory = null;
let menuBootstrapPromise = null;

function getCacheNamespace() {
  return String(api.defaults.baseURL || 'relative');
}

function normalizeBootstrapSnapshot(snapshot) {
  return {
    categories: Array.isArray(snapshot?.categories) ? snapshot.categories : [],
    products: Array.isArray(snapshot?.products) ? snapshot.products : [],
    promotions: Array.isArray(snapshot?.promotions) ? snapshot.promotions : [],
    settings:
      snapshot?.settings && typeof snapshot.settings === 'object' ? snapshot.settings : {},
  };
}

function readStoredBootstrap() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(MENU_BOOTSTRAP_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const age = Date.now() - Number(parsed?.timestamp || 0);

    if (
      parsed?.namespace !== getCacheNamespace() ||
      !Number.isFinite(age) ||
      age > MENU_BOOTSTRAP_MAX_AGE_MS
    ) {
      window.localStorage.removeItem(MENU_BOOTSTRAP_CACHE_KEY);
      return null;
    }

    return {
      timestamp: Number(parsed.timestamp),
      data: normalizeBootstrapSnapshot(parsed.data),
    };
  } catch {
    return null;
  }
}

function writeStoredBootstrap(data) {
  const snapshot = {
    timestamp: Date.now(),
    data: normalizeBootstrapSnapshot(data),
  };

  menuBootstrapMemory = snapshot;

  if (typeof window === 'undefined') {
    return snapshot;
  }

  try {
    window.localStorage.setItem(
      MENU_BOOTSTRAP_CACHE_KEY,
      JSON.stringify({
        namespace: getCacheNamespace(),
        timestamp: snapshot.timestamp,
        data: snapshot.data,
      })
    );
  } catch {
    // Ignore storage quota / private mode issues and keep in-memory cache.
  }

  return snapshot;
}

export function getCachedMenuBootstrap() {
  if (menuBootstrapMemory) {
    const age = Date.now() - menuBootstrapMemory.timestamp;
    if (age <= MENU_BOOTSTRAP_MAX_AGE_MS) {
      return menuBootstrapMemory;
    }
    menuBootstrapMemory = null;
  }

  const stored = readStoredBootstrap();
  if (stored) {
    menuBootstrapMemory = stored;
  }

  return stored;
}

async function requestCategories() {
  try {
    const { data } = await api.get('/wp-json/tavox/v1/categories');
    return { ok: true, data: Array.isArray(data) ? data : [] };
  } catch (err) {
    console.error('fetchCategories', err);
    return { ok: false, data: null };
  }
}

async function requestProducts({ category = '', q = '' } = {}) {
  try {
    const { data } = await api.get('/wp-json/tavox/v1/products', {
      params: { category, q },
    });
    return { ok: true, data: Array.isArray(data) ? data : [] };
  } catch (err) {
    console.error('fetchProducts', err);
    return { ok: false, data: null };
  }
}

async function requestPromotions() {
  try {
    const { data } = await api.get('/wp-json/tavox/v1/promotions');
    return { ok: true, data: Array.isArray(data) ? data : [] };
  } catch (err) {
    if (err?.response?.status !== 404) {
      console.error('fetchPromotions', err);
      return { ok: false, data: null };
    }

    return { ok: true, data: [] };
  }
}

async function requestSettings() {
  try {
    const { data } = await api.get('/wp-json/tavox/v1/settings');
    return { ok: true, data: data && typeof data === 'object' ? data : {} };
  } catch (err) {
    if (err?.response?.status !== 404) {
      console.error('fetchSettings', err);
      return { ok: false, data: null };
    }

    return { ok: true, data: {} };
  }
}

export async function revalidateMenuBootstrap() {
  if (menuBootstrapPromise) {
    return menuBootstrapPromise;
  }

  const cached = getCachedMenuBootstrap();

  menuBootstrapPromise = Promise.all([
    requestCategories(),
    requestProducts(),
    requestPromotions(),
    requestSettings(),
  ])
    .then(([categories, products, promotions, settings]) => {
      const nextData = normalizeBootstrapSnapshot({
        categories: categories.ok ? categories.data : cached?.data.categories,
        products: products.ok ? products.data : cached?.data.products,
        promotions: promotions.ok ? promotions.data : cached?.data.promotions,
        settings: settings.ok ? settings.data : cached?.data.settings,
      });

      const hasAnyFreshData =
        categories.ok || products.ok || promotions.ok || settings.ok || !cached?.data;

      if (hasAnyFreshData) {
        writeStoredBootstrap(nextData);
      }

      return {
        data: nextData,
        fromCache: false,
        partial: !categories.ok || !products.ok || !promotions.ok || !settings.ok,
      };
    })
    .finally(() => {
      menuBootstrapPromise = null;
    });

  return menuBootstrapPromise;
}

export async function fetchCategories() {
  const result = await requestCategories();
  return result.ok ? result.data : [];
}

export async function fetchProducts({ category = '', q = '' } = {}) {
  const result = await requestProducts({ category, q });
  return result.ok ? result.data : [];
}

export async function fetchPromotions() {
  const result = await requestPromotions();
  return result.ok ? result.data : [];
}

export async function fetchSettings() {
  const result = await requestSettings();
  return result.ok ? result.data : {};
}
