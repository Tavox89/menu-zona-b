import { useCallback, useEffect, useRef, useState } from 'react';
import { getCachedMenuBootstrap, revalidateMenuBootstrap } from '../services/tavox.js';
import { normalizeBrandScope } from '../config/brands.js';

function normalizeIds(list) {
  return Array.isArray(list)
    ? list.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)
    : [];
}

function normalizeAliases(list) {
  return Array.isArray(list)
    ? list
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
    : [];
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['0', 'false', 'off', 'no'].includes(normalized)) return false;
    if (['1', 'true', 'on', 'yes'].includes(normalized)) return true;
  }

  return Boolean(value);
}

function normalizeMenuScope(value, fallback = 'zona_b') {
  return normalizeBrandScope(value, fallback);
}

function normalizePercent(value, fallback = 50) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function getCategoryScope(categoryMap, categoryId) {
  const category = categoryMap.get(Number(categoryId));

  return category ? normalizeMenuScope(category.menuScope, '') : '';
}

function inferProductBrandScope(categoryIds, primaryCategoryId, categoryMap) {
  const primaryScope = getCategoryScope(categoryMap, primaryCategoryId);

  if (primaryScope && primaryScope !== 'common') {
    return primaryScope;
  }

  let hasZonaB = false;
  let hasIsola = false;
  let hasCommon = false;

  categoryIds.forEach((categoryId) => {
    const scope = getCategoryScope(categoryMap, categoryId);

    if (scope === 'zona_b') hasZonaB = true;
    if (scope === 'isola') hasIsola = true;
    if (scope === 'common') hasCommon = true;
  });

  if (hasZonaB && !hasIsola) return 'zona_b';
  if (hasIsola && !hasZonaB) return 'isola';
  if (hasCommon && !hasZonaB && !hasIsola) return 'common';
  if (primaryScope) return primaryScope;

  return '';
}

function normalizeProduct(product, categoryMap) {
  const rawCategoryIds = normalizeIds(product.categories);
  const menuCategoryIds = normalizeIds(product.menu_category_ids);
  const fallbackVisibleIds = rawCategoryIds.filter((id) => categoryMap.has(id));
  const resolvedMenuCategoryIds = menuCategoryIds.length ? menuCategoryIds : fallbackVisibleIds;
  const primaryMenuCategoryId =
    Number(product.primary_menu_category_id) || resolvedMenuCategoryIds[0] || 0;
  const menuScopes = Array.from(
    new Set(
      resolvedMenuCategoryIds
        .map((categoryId) => getCategoryScope(categoryMap, categoryId))
        .filter(Boolean)
    )
  );
  const inferredBrandScope = inferProductBrandScope(
    resolvedMenuCategoryIds,
    primaryMenuCategoryId,
    categoryMap
  );

  return {
    ...product,
    rawCategoryIds,
    menuCategoryIds: resolvedMenuCategoryIds,
    primaryMenuCategoryId,
    menuScopes,
    brandScope: inferredBrandScope || normalizeMenuScope(product.brand_scope, 'zona_b'),
    catIds: resolvedMenuCategoryIds,
  };
}

function buildNormalizedMenuBundle(snapshot = {}) {
  const visibleCategories = Array.isArray(snapshot?.categories) ? snapshot.categories : [];
  const normalizedCategories = visibleCategories.map((category) => ({
    ...category,
    aliases: normalizeAliases(category.aliases),
    menuScope: normalizeMenuScope(category.menu_scope, 'zona_b'),
  }));
  const normalizedCategoryMap = new Map(
    normalizedCategories.map((category) => [Number(category.id), category])
  );
  const normalizedProducts = (Array.isArray(snapshot?.products) ? snapshot.products : []).map((product) =>
    normalizeProduct(product, normalizedCategoryMap)
  );
  const normalizedPromotions = (Array.isArray(snapshot?.promotions) ? snapshot.promotions : [])
    .map((promotion) => {
      const normalizedPromotionProduct = promotion.product
        ? normalizeProduct(promotion.product, normalizedCategoryMap)
        : null;
      const explicitPromotionScope = normalizeMenuScope(promotion.brand_scope, '');

      return {
        ...promotion,
        productId: Number(promotion.product_id ?? promotion.productId) || 0,
        promo_style: String(promotion.promo_style || 'default').trim() === 'event' ? 'event' : 'default',
        event_meta: String(promotion.event_meta || '').trim(),
        event_guests: String(promotion.event_guests || '').trim(),
        image_focus_x: normalizePercent(promotion.image_focus_x, 50),
        image_focus_y: normalizePercent(promotion.image_focus_y, 50),
        show_in_search: normalizeBoolean(promotion.show_in_search, true),
        brandScope:
          explicitPromotionScope ||
          normalizedPromotionProduct?.brandScope ||
          normalizeMenuScope(promotion.brand_scope, 'zona_b'),
        product: normalizedPromotionProduct,
      };
    })
    .filter(
      (promotion) =>
        promotion.product ||
        promotion.promo_style === 'event' ||
        String(promotion.title || '').trim() ||
        String(promotion.image || '').trim()
    );

  return {
    categories: [{ id: '', name: 'Todo', aliases: [], menuScope: 'common' }, ...normalizedCategories],
    products: normalizedProducts,
    promotions: normalizedPromotions,
    settings: {
      whatsapp_phone: String(snapshot?.settings?.whatsapp_phone || '').trim(),
      multi_menu_enabled: normalizeBoolean(snapshot?.settings?.multi_menu_enabled, false),
      table_order_enabled: normalizeBoolean(snapshot?.settings?.table_order_enabled, false),
      waiter_console_enabled: normalizeBoolean(snapshot?.settings?.waiter_console_enabled, false),
      menu_frontend_url: String(snapshot?.settings?.menu_frontend_url || '').trim(),
      notification_sound_enabled: normalizeBoolean(
        snapshot?.settings?.notification_sound_enabled,
        true
      ),
    },
  };
}

function getInitialMenuState() {
  const cached = getCachedMenuBootstrap();
  const normalized = cached ? buildNormalizedMenuBundle(cached.data) : null;

  return {
    categories: normalized?.categories ?? [],
    products: normalized?.products ?? [],
    promotions: normalized?.promotions ?? [],
    settings: normalized?.settings ?? {},
    hasCachedData: Boolean(normalized),
    cachedTimestamp: Number(cached?.timestamp || 0) || 0,
  };
}

export default function useMenuData() {
  const [initialMenuState] = useState(() => getInitialMenuState());
  const [categories, setCategories] = useState(initialMenuState.categories);
  const [products, setProducts] = useState(initialMenuState.products);
  const [promotions, setPromotions] = useState(initialMenuState.promotions);
  const [settings, setSettings] = useState(initialMenuState.settings);
  const [loadingSettings, setLoadingSettings] = useState(!initialMenuState.hasCachedData);
  const [loadingCategories, setLoadingCategories] = useState(!initialMenuState.hasCachedData);
  const [loadingProducts, setLoadingProducts] = useState(!initialMenuState.hasCachedData);
  const [loadingPromotions, setLoadingPromotions] = useState(!initialMenuState.hasCachedData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(initialMenuState.cachedTimestamp);
  const [activeCat, setActiveCatState] = useState('');
  const [query, setQuery] = useState('');
  const menuSignatureRef = useRef(
    JSON.stringify({
      categories: initialMenuState.categories,
      products: initialMenuState.products,
      promotions: initialMenuState.promotions,
      settings: initialMenuState.settings,
    })
  );

  const loadMenu = useCallback(async () => {
    const cached = getCachedMenuBootstrap();
    const hasCachedSnapshot = Boolean(cached?.data);

    if (hasCachedSnapshot) {
      const normalizedCached = buildNormalizedMenuBundle(cached.data);
      const cachedSignature = JSON.stringify(normalizedCached);

      if (menuSignatureRef.current !== cachedSignature) {
        menuSignatureRef.current = cachedSignature;
        setCategories(normalizedCached.categories);
        setProducts(normalizedCached.products);
        setPromotions(normalizedCached.promotions);
        setSettings(normalizedCached.settings);
      }

      setLoadingCategories(false);
      setLoadingProducts(false);
      setLoadingPromotions(false);
      setLoadingSettings(false);
      setLastUpdatedAt(Number(cached.timestamp || 0) || Date.now());
    } else {
      setLoadingCategories(true);
      setLoadingProducts(true);
      setLoadingPromotions(true);
      setLoadingSettings(true);
    }

    setRefreshing(hasCachedSnapshot);

    const { data } = await revalidateMenuBootstrap();
    const normalizedFresh = buildNormalizedMenuBundle(data);
    const nextSignature = JSON.stringify(normalizedFresh);

    if (nextSignature !== menuSignatureRef.current) {
      menuSignatureRef.current = nextSignature;
      setCategories(normalizedFresh.categories);
      setProducts(normalizedFresh.products);
      setPromotions(normalizedFresh.promotions);
      setSettings(normalizedFresh.settings);
    }

    setLoadingCategories(false);
    setLoadingProducts(false);
    setLoadingPromotions(false);
    setLoadingSettings(false);
    setRefreshing(false);
    setLastUpdatedAt(Date.now());
  }, []);

  useEffect(() => {
    async function run() {
      await loadMenu();
    }

    run();
  }, [loadMenu]);

  const setActiveCat = (id) => {
    setActiveCatState(id === '' ? '' : String(id));
  };

  return {
    categories,
    products,
    promotions,
    settings,
    loadingCategories,
    loadingProducts,
    loadingPromotions,
    loadingSettings,
    refreshing,
    lastUpdatedAt,
    refresh: loadMenu,
    activeCat,
    setActiveCat,
    query,
    setQuery,
  };
}
