import { useMemo, useState, useEffect, useRef, Fragment, useDeferredValue } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ScrollTopFab from '../components/layout/ScrollTopFab.jsx';
import useMenuData from '../hooks/useMenuData.js';
import Header from '../components/layout/Header.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import CategoryBar from '../components/category/CategoryBar.jsx';
import ProductDialog from '../components/product/ProductDialog.jsx';
import CartFooter, { FOOTER_HEIGHT } from '../components/cart/CartFooter.jsx';
import CartDrawer from '../components/cart/CartDrawer.jsx';
import CartConfirmModal from '../components/cart/CartConfirmModal.jsx';
import { useCart } from '../context/CartContext.jsx';
import CategoryHeader from '../components/category/CategoryHeader.jsx';
import { useWhatsAppOrder } from '../hooks/useWhatsAppLink.js';
import PromotionsRail from '../components/home/PromotionsRail.jsx';
import SearchPromotionCard from '../components/home/SearchPromotionCard.jsx';
import RepeatOrdersSection from '../components/history/RepeatOrdersSection.jsx';
import IntroGate from '../components/layout/IntroGate.jsx';
import useOrderHistory from '../hooks/useOrderHistory.js';
import { useBrand } from '../context/useBrand.js';
import TableRestaurantOutlinedIcon from '@mui/icons-material/TableRestaurantOutlined';
import RoomServiceOutlinedIcon from '@mui/icons-material/RoomServiceOutlined';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import {
  DEFAULT_BRAND,
  getBrandConfig,
  getOtherBrand,
  isScopeVisibleForBrand,
  normalizeBrandScope,
  resolveEffectiveBrandFromScope,
} from '../config/brands.js';
import {
  matchesProductQuery,
  normalizeSearchText,
  sortProductsByQuery,
} from '../utils/search.js';
import { getServiceStageLabel } from '../utils/teamStatus.js';
import { submitTableRequest, submitWaiterDirectOrder } from '../services/tableService.js';
import { useNavigate } from 'react-router-dom';

const CARD_ITEM_SX = {
  width: '100%',
  maxWidth: { xs: '100%', sm: 382 },
  flexBasis: { xs: '100%', sm: 382 },
  flexGrow: { xs: 1, sm: 0 },
};

const FULL_WIDTH_ITEM_SX = {
  flexBasis: '100%',
  maxWidth: '100%',
  flexShrink: 0,
};

function buildRepeatFeedback(result) {
  if (!result.items.length) {
    return {
      severity: 'warning',
      message: 'Ese pedido ya no tiene productos disponibles para repetirse.',
    };
  }

  const notes = [];
  if (result.repricedLines > 0) {
    notes.push(`${result.repricedLines} productos con precio actualizado`);
  }
  if (result.unavailableProducts.length > 0) {
    notes.push(`${result.unavailableProducts.length} productos ya no disponibles`);
  }
  if (result.unavailableExtras.length > 0) {
    notes.push(`${result.unavailableExtras.length} extras fueron omitidos`);
  }

  return notes.length
    ? {
        severity: 'warning',
        message: `Pedido cargado con revisión: ${notes.join(', ')}.`,
      }
    : {
        severity: 'success',
        message: 'Pedido anterior cargado otra vez en el carrito con precios vigentes.',
      };
}

function getSearchPromotionScore(promotion, normalizedQuery, categoryMap) {
  const product = promotion?.product;
  if (!normalizedQuery || !product) {
    return -1;
  }

  const categoryNames = (product.menuCategoryIds ?? [])
    .flatMap((id) => {
      const category = categoryMap.get(id);
      return [category?.name ?? '', ...(category?.aliases ?? [])];
    })
    .filter(Boolean)
    .join(' ');
  const haystack = normalizeSearchText(
    [
      promotion.badge,
      promotion.title,
      product.name,
      promotion.copy,
      promotion.event_meta,
      promotion.event_guests,
      categoryNames,
    ]
      .filter(Boolean)
      .join(' ')
  );
  const tokens = normalizedQuery.split(' ').filter(Boolean);

  if (!tokens.every((token) => haystack.includes(token))) {
    return -1;
  }

  let score = 0;
  const title = normalizeSearchText(promotion.title || '');
  const productName = normalizeSearchText(product.name || '');
  const eventMeta = normalizeSearchText(promotion.event_meta || '');
  const eventGuests = normalizeSearchText(promotion.event_guests || '');

  if (productName === normalizedQuery || title === normalizedQuery) score += 140;
  if (productName.startsWith(normalizedQuery) || title.startsWith(normalizedQuery)) score += 80;
  if (productName.includes(normalizedQuery) || title.includes(normalizedQuery)) score += 48;
  if (eventMeta.includes(normalizedQuery) || eventGuests.includes(normalizedQuery)) score += 36;

  tokens.forEach((token) => {
    if (productName.includes(token)) score += 14;
    if (title.includes(token)) score += 10;
    if (eventMeta.includes(token)) score += 8;
    if (eventGuests.includes(token)) score += 8;
    if (haystack.includes(token)) score += 4;
  });

  return score;
}

function sortPromotionsByPriority(a, b) {
  const orderA = Number(a.order ?? 0);
  const orderB = Number(b.order ?? 0);
  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return (a.title || a.product?.name || '').localeCompare(b.title || b.product?.name || '', 'es');
}

function getProductMenuScopes(product) {
  const scopes = Array.isArray(product?.menuScopes)
    ? product.menuScopes
        .map((scope) => normalizeBrandScope(scope, ''))
        .filter(Boolean)
    : [];

  if (scopes.length) {
    return Array.from(new Set(scopes));
  }

  return [normalizeBrandScope(product?.brandScope, DEFAULT_BRAND)];
}

function isProductVisibleInBrand(product, brandKey = DEFAULT_BRAND) {
  return getProductMenuScopes(product).some((scope) => isScopeVisibleForBrand(scope, brandKey));
}

function resolveEffectiveBrandFromProduct(product, fallbackBrand = DEFAULT_BRAND) {
  if (!product) {
    return normalizeBrandScope(fallbackBrand, DEFAULT_BRAND);
  }

  const scopes = getProductMenuScopes(product);
  if (scopes.includes('common')) {
    return normalizeBrandScope(fallbackBrand, DEFAULT_BRAND);
  }

  return resolveEffectiveBrandFromScope(product.brandScope, fallbackBrand);
}

function resolveEffectiveBrandFromPromotion(promotion, fallbackBrand = DEFAULT_BRAND) {
  if (!promotion) {
    return normalizeBrandScope(fallbackBrand, DEFAULT_BRAND);
  }

  return resolveEffectiveBrandFromScope(promotion.brandScope, fallbackBrand);
}

function normalizeDisplayHandle(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const base = raw.includes('@') ? raw.split('@')[0] : raw;
  const cleaned = base.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    return raw;
  }

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function Home({
  orderMode = 'whatsapp',
  tableContext = null,
  waiterSession = null,
  onTableRequestSuccess = null,
  onWaiterDirectOrderSuccess = null,
  onServiceContextRefresh = null,
  onOpenTableWaiterRequest = null,
  tableMessagesPendingCount = 0,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm')); // tablet+
  const { baseBrand, effectiveBrand, setBaseBrand, setEffectiveBrand, setBrandTransitionMode } = useBrand();

  const {
    categories,
    products,
    promotions,
    settings,
    loadingSettings,
    loadingProducts,
    activeCat,
    setActiveCat,
    query,
    setQuery,
  } = useMenuData();
  const deferredQuery = useDeferredValue(query);
  const normalizedDeferredQuery = useMemo(
    () => normalizeSearchText(deferredQuery),
    [deferredQuery]
  );

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [repeatFeedback, setRepeatFeedback] = useState(null);
  const [hasChosenBrand, setHasChosenBrand] = useState(orderMode !== 'whatsapp');
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [serviceSuccess, setServiceSuccess] = useState('');
  const resultsStartRef = useRef(null);
  const {
    items,
    add,
    replace,
    clear,
    fulfillmentMode,
    setFulfillmentMode,
    setItemFulfillmentMode,
  } = useCart();
  const {
    submitting: submittingOrder,
    error: whatsAppError,
    sendOrder,
    clearError: clearWhatsAppError,
  } = useWhatsAppOrder({ phone: settings?.whatsapp_phone });
  const {
    history,
    saveOrderHistory,
    repeatOrderFromHistory,
  } = useOrderHistory(products);
  const multiMenuEnabled = Boolean(settings?.multi_menu_enabled);
  const isTableMode = orderMode === 'table';
  const isWaiterMode = orderMode === 'waiter';
  const currentBrand = multiMenuEnabled ? effectiveBrand : DEFAULT_BRAND;
  const otherBrand = getOtherBrand(currentBrand);
  const otherBrandLogo = getBrandConfig(otherBrand).switchLogo || getBrandConfig(otherBrand).logo;
  const currentTableToken = String(tableContext?.table_token || tableContext?.tableToken || '').trim();
  const currentTableName = String(tableContext?.table?.name || tableContext?.table_name || '').trim();
  const waiterDisplayName = normalizeDisplayHandle(
    tableContext?.owner_display_name ||
      waiterSession?.waiter?.display_name ||
      waiterSession?.waiter?.login ||
      ''
  );
  const actionSubmitting = orderMode === 'whatsapp' ? submittingOrder : serviceSubmitting;
  const actionError = orderMode === 'whatsapp' ? whatsAppError : serviceError;
  const tableServiceStage = String(tableContext?.service_stage || '').trim();
  const explicitTableServiceLabel = String(tableContext?.service_label || '').trim();
  const tableRequestLabel = explicitTableServiceLabel || getServiceStageLabel(tableServiceStage);
  const tableLinesCount = Number(tableContext?.consumption?.lines_count ?? 0) || 0;
  const tableItemsCount = Number(tableContext?.consumption?.items_count ?? 0) || 0;
  const tableTotalAmount = Number(tableContext?.consumption?.total_amount ?? 0) || 0;
  const hasTableOperationalState =
    tableLinesCount > 0 ||
    tableItemsCount > 0 ||
    tableTotalAmount > 0 ||
    Boolean(tableServiceStage) ||
    tableMessagesPendingCount > 0;
  const showConsumptionShortcut =
    isTableMode && Boolean(currentTableToken) && currentTableName && hasTableOperationalState;
  const consumptionShortcutLabel = tableRequestLabel
    ? `Ver consumo · ${tableRequestLabel}`
    : 'Ver consumo';
  const orderActionLabel = isTableMode
    ? 'Procesar pedido en mesa'
    : isWaiterMode
      ? 'Procesar como mesero'
      : 'Enviar por WhatsApp';
  const reviewActionLabel = isTableMode
    ? 'Revisar pedido en mesa'
    : isWaiterMode
      ? 'Revisar pedido como mesero'
      : 'Revisar y enviar por WhatsApp';
  const reviewStartIcon = isTableMode
    ? <TableRestaurantOutlinedIcon />
    : isWaiterMode
      ? <RoomServiceOutlinedIcon />
      : undefined;
  const reviewButtonSx =
    orderMode === 'whatsapp'
      ? {}
      : {
          bgcolor: 'primary.main',
          color: theme.appBrand.onPrimary,
          '&:hover': {
            bgcolor: 'primary.main',
            filter: 'brightness(0.95)',
          },
        };

  /* ----- Scroll‑to‑top ----- */
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (loadingSettings) {
      return;
    }

    if (!multiMenuEnabled) {
      setHasChosenBrand(true);
      if (baseBrand !== DEFAULT_BRAND) {
        setBaseBrand(DEFAULT_BRAND);
      }
      if (effectiveBrand !== DEFAULT_BRAND) {
        setEffectiveBrand(DEFAULT_BRAND);
      }
      return;
    }

    if (!hasChosenBrand) {
      if (baseBrand !== DEFAULT_BRAND) {
        setBaseBrand(DEFAULT_BRAND);
      }
      if (effectiveBrand !== DEFAULT_BRAND) {
        setEffectiveBrand(DEFAULT_BRAND);
      }
    }
  }, [
    loadingSettings,
    multiMenuEnabled,
    hasChosenBrand,
    baseBrand,
    effectiveBrand,
    setBaseBrand,
    setEffectiveBrand,
  ]);

  useEffect(() => {
    if (items.length > 0) {
      return;
    }

    setDrawerOpen(false);
    setConfirmOpen(false);
    clearWhatsAppError();
    setServiceError('');
  }, [items.length, clearWhatsAppError]);

  useEffect(() => {
    if (!deferredQuery.trim() || !resultsStartRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      resultsStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [deferredQuery]);

  /* ----- Helpers ----- */
  const handleSelectCategory = (id) => {
    if (query) {
      setQuery('');
    }
    setActiveCat(id);
    setRepeatFeedback(null);
    setServiceSuccess('');

    if (multiMenuEnabled) {
      const category = categories.find((entry) => String(entry.id) === String(id));
      const scope = normalizeBrandScope(category?.menuScope, DEFAULT_BRAND);

      if (id !== '' && scope !== 'common') {
        if (scope !== effectiveBrand) {
          setBrandTransitionMode('soft');
        }
        setBaseBrand(scope);
        setEffectiveBrand(scope);
        setHasChosenBrand(true);
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChooseBrand = (brandKey) => {
    if (brandKey !== effectiveBrand) {
      setBrandTransitionMode('instant');
    }
    setBaseBrand(brandKey);
    setEffectiveBrand(brandKey);
    setHasChosenBrand(true);
    setActiveCat('');
    setQuery('');
    setRepeatFeedback(null);
    setServiceSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchBrand = () => {
    const nextBrand = getOtherBrand(currentBrand);
    setBrandTransitionMode('soft');
    setBaseBrand(nextBrand);
    setEffectiveBrand(nextBrand);
    setHasChosenBrand(true);
    setActiveCat('');
    setQuery('');
    setRepeatFeedback(null);
    setServiceSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ----- Filtro y orden ----- */
  const categoryMap = useMemo(
    () =>
      new Map(
        categories
          .filter((category) => category.id !== '')
          .map((category) => [Number(category.id), category])
      ),
    [categories]
  );

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.id === '' ||
          !multiMenuEnabled ||
          isScopeVisibleForBrand(category.menuScope, currentBrand)
      ),
    [categories, multiMenuEnabled, currentBrand]
  );

  const browseProducts = useMemo(() => {
    const activeCategoryId = activeCat === '' ? 0 : Number(activeCat);

    return products.filter((product) => {
      if (multiMenuEnabled && !isProductVisibleInBrand(product, currentBrand)) {
        return false;
      }

      if (activeCategoryId && !(product.menuCategoryIds ?? []).includes(activeCategoryId)) {
        return false;
      }

      return true;
    });
  }, [products, activeCat, multiMenuEnabled, currentBrand]);

  const searchProducts = useMemo(() => {
    if (!normalizedDeferredQuery) {
      return [];
    }

    const nextProducts = products.filter((product) =>
      matchesProductQuery(product, deferredQuery, categoryMap)
    );

    return sortProductsByQuery(nextProducts, deferredQuery, categoryMap);
  }, [products, deferredQuery, normalizedDeferredQuery, categoryMap]);

  const queryCategoryOptions = useMemo(() => {
    if (!normalizedDeferredQuery) {
      return [];
    }

    return categories
      .filter((category) => category.id !== '')
      .filter((category) =>
        [category.name, ...(category.aliases ?? [])]
          .map((term) => normalizeSearchText(term))
          .some((term) => term.includes(normalizedDeferredQuery))
      )
      .slice(0, 4);
  }, [normalizedDeferredQuery, categories]);

  const searchVisiblePromotions = useMemo(
    () =>
      promotions.filter(
        (promotion) => (promotion?.show_in_search ?? true) && promotion?.product
      ),
    [promotions]
  );

  const matchedSearchPromotion = useMemo(() => {
    if (!normalizedDeferredQuery) {
      return null;
    }

    return searchVisiblePromotions
      .map((promotion) => ({
        promotion,
        score: getSearchPromotionScore(promotion, normalizedDeferredQuery, categoryMap),
      }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .at(0)?.promotion ?? null;
  }, [normalizedDeferredQuery, searchVisiblePromotions, categoryMap]);

  const leaderBrand = useMemo(() => {
    if (!multiMenuEnabled) {
      return DEFAULT_BRAND;
    }

    if (!normalizedDeferredQuery) {
      return baseBrand;
    }

    if (matchedSearchPromotion) {
      return resolveEffectiveBrandFromPromotion(matchedSearchPromotion, baseBrand);
    }

    const leaderProduct = searchProducts[0];
    if (!leaderProduct) {
      return baseBrand;
    }

    return resolveEffectiveBrandFromProduct(leaderProduct, baseBrand);
  }, [
    multiMenuEnabled,
    normalizedDeferredQuery,
    baseBrand,
    matchedSearchPromotion,
    searchProducts,
  ]);

  const searchBrand = multiMenuEnabled ? leaderBrand : DEFAULT_BRAND;

  const searchPromotion = useMemo(() => {
    if (!normalizedDeferredQuery) {
      return null;
    }

    const compatiblePromotions = searchVisiblePromotions.filter(
      (promotion) =>
        !multiMenuEnabled || isScopeVisibleForBrand(promotion.brandScope, searchBrand)
    );

    if (
      matchedSearchPromotion &&
      (!multiMenuEnabled || isScopeVisibleForBrand(matchedSearchPromotion.brandScope, searchBrand))
    ) {
      return matchedSearchPromotion;
    }

    return [...compatiblePromotions].sort(sortPromotionsByPriority)[0] ?? null;
  }, [
    normalizedDeferredQuery,
    searchVisiblePromotions,
    multiMenuEnabled,
    searchBrand,
    matchedSearchPromotion,
  ]);

  useEffect(() => {
    if (loadingSettings) {
      return;
    }

    const nextBrand = !multiMenuEnabled
      ? DEFAULT_BRAND
      : normalizedDeferredQuery
        ? leaderBrand
        : baseBrand;

    if (effectiveBrand !== nextBrand) {
      setEffectiveBrand(nextBrand);
    }
  }, [
    loadingSettings,
    multiMenuEnabled,
    normalizedDeferredQuery,
    leaderBrand,
    baseBrand,
    effectiveBrand,
    setEffectiveBrand,
  ]);

  const orderedProducts = useMemo(() => {
    if (normalizedDeferredQuery) {
      return searchProducts;
    }

    if (activeCat === '') {
      const orderMap = {};
      visibleCategories.slice(1).forEach((cat, i) => (orderMap[+cat.id] = i));
      return [...browseProducts].sort((a, b) => {
        const aIdx = orderMap[a.primaryMenuCategoryId] ?? Infinity;
        const bIdx = orderMap[b.primaryMenuCategoryId] ?? Infinity;
        return aIdx !== bIdx ? aIdx - bIdx : a.name.localeCompare(b.name);
      });
    }

    return browseProducts;
  }, [browseProducts, searchProducts, activeCat, normalizedDeferredQuery, visibleCategories]);

  const displayedProducts = useMemo(() => {
    const duplicatedPromotionProductId =
      Number(searchPromotion?.productId ?? searchPromotion?.product_id) || 0;

    if (!duplicatedPromotionProductId || !normalizedDeferredQuery) {
      return orderedProducts;
    }

    return orderedProducts.filter((product) => product.id !== duplicatedPromotionProductId);
  }, [orderedProducts, searchPromotion, normalizedDeferredQuery]);

  const railPromotions = useMemo(
    () =>
      promotions.filter(
        (promotion) =>
          !multiMenuEnabled || isScopeVisibleForBrand(promotion.brandScope, currentBrand)
      ),
    [promotions, multiMenuEnabled, currentBrand]
  );

  /* ----- Construcción de tarjetas ----- */
  const productSections = useMemo(() => {
    const getPrimaryCatId = (product) => product.primaryMenuCategoryId || 0;

    if (loadingProducts) {
      return [
        <Grid item xs={12} key="skeleton">
          <Grid container spacing={{ xs: 1.25, sm: 2 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Grid item xs={12} sx={CARD_ITEM_SX} key={i}>
                <ProductCard loading />
              </Grid>
            ))}
          </Grid>
        </Grid>,
      ];
    }

    const showHeaders = activeCat === '' && !normalizedDeferredQuery;

    /* Desktop/tablet con headers separados */
    if (isDesktop && showHeaders) {
      const sections = [];
      let currentCat = null;
      let group = [];

      displayedProducts.forEach((prod, idx) => {
        const catId = getPrimaryCatId(prod);
        if (catId !== currentCat) {
          // push grupo anterior
          if (group.length) {
            sections.push(
              <Grid
                item
                xs={12}
                key={`group-${currentCat}`}
                sx={FULL_WIDTH_ITEM_SX}
              >
                <Grid container spacing={{ xs: 1.25, sm: 2 }} justifyContent="center">
                  {group}
                </Grid>
              </Grid>
            );
            group = [];
          }
          // nuevo header
          const title = visibleCategories.find((c) => +c.id === catId)?.name || '';
          if (title) {
            sections.push(
              <Grid
                item
                xs={12}
                key={`header-${catId}`}
                sx={FULL_WIDTH_ITEM_SX}
              >
                <CategoryHeader title={title} />
              </Grid>
            );
          }
          currentCat = catId;
        }
        group.push(
          <Grid item xs={12} sx={CARD_ITEM_SX} key={prod.id}>
            <ProductCard product={prod} onOpen={setSelectedProduct} />
          </Grid>
        );
        // último grupo
        if (idx === displayedProducts.length - 1) {
          sections.push(
            <Grid
              item
              xs={12}
              key={`group-${currentCat}`}
              sx={FULL_WIDTH_ITEM_SX}
            >
              <Grid container spacing={{ xs: 1.25, sm: 2 }} justifyContent="center">
                {group}
              </Grid>
            </Grid>
          );
        }
      });
      return sections;
    }

    /* Mobile o filtro/búsqueda */
    return displayedProducts.map((prod, idx) => {
      const prevPrimary = idx === 0 ? null : getPrimaryCatId(displayedProducts[idx - 1]);
      const currPrimary = getPrimaryCatId(prod);
      const showHeader = showHeaders && currPrimary > 0 && (idx === 0 || prevPrimary !== currPrimary);
      const title = showHeader ? visibleCategories.find((c) => +c.id === currPrimary)?.name || '' : '';

      return (
        <Fragment key={`${prod.id}-wrap`}>
          {showHeader && (
            <Grid item xs={12}>
              <CategoryHeader title={title} />
            </Grid>
          )}
          <Grid item xs={12} sx={CARD_ITEM_SX} key={prod.id}>
            <ProductCard product={prod} onOpen={setSelectedProduct} />
          </Grid>
        </Fragment>
      );
    });
  }, [loadingProducts, displayedProducts, isDesktop, activeCat, normalizedDeferredQuery, visibleCategories]);

  const showEmpty = !loadingProducts && displayedProducts.length === 0 && !searchPromotion;

  const handleOpenConfirm = () => {
    clearWhatsAppError();
    setServiceError('');
    setDrawerOpen(false);
    setConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    clearWhatsAppError();
    setServiceError('');
    setConfirmOpen(false);
  };

  const handleProcessOrder = async (note = '') => {
    if (orderMode === 'whatsapp') {
      const result = sendOrder({ items, note });
      if (result.ok) {
        saveOrderHistory(result.snapshot);
        setRepeatFeedback(null);
        setConfirmOpen(false);
      }
      return;
    }

    setServiceSubmitting(true);
    setServiceError('');
    setServiceSuccess('');

    try {
      if (isTableMode) {
        if (!currentTableToken) {
          throw new Error('Falta el identificador seguro de la mesa.');
        }

        const result = await submitTableRequest({
          tableToken: currentTableToken,
          items,
          note,
          brandScope: currentBrand,
          clientLabel: currentTableName || 'Cliente en mesa',
          fulfillmentMode,
        });

        setServiceSuccess('Tu pedido quedó esperando confirmación.');
        onTableRequestSuccess?.(result);
      } else if (isWaiterMode) {
        if (!currentTableToken) {
          throw new Error('Selecciona una mesa antes de procesar el pedido.');
        }

        if (!waiterSession?.session_token) {
          throw new Error('Tu acceso ya no está activo.');
        }

        const result = await submitWaiterDirectOrder({
          sessionToken: waiterSession.session_token,
          tableToken: currentTableToken,
          items,
          note,
          brandScope: currentBrand,
          clientLabel: '',
          fulfillmentMode,
        });

        setServiceSuccess('El pedido quedó agregado a la mesa.');
        onWaiterDirectOrderSuccess?.(result);
      }

      clear();
      setRepeatFeedback(null);
      setConfirmOpen(false);
      setDrawerOpen(false);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo procesar el pedido en este momento.';

      setServiceError(String(message));
    } finally {
      setServiceSubmitting(false);
    }
  };

  const handleRepeatOrder = (entry) => {
    const result = repeatOrderFromHistory(entry);
    const feedback = buildRepeatFeedback(result);
    setRepeatFeedback(feedback);

    if (!result.items.length) {
      return;
    }

    replace(result.items);
    clearWhatsAppError();
    setConfirmOpen(false);
    setDrawerOpen(true);
  };

  if (loadingSettings) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          background: theme.palette.background.default,
        }}
      />
    );
  }

  if (multiMenuEnabled && !hasChosenBrand && orderMode === 'whatsapp') {
    return <IntroGate onChoose={handleChooseBrand} />;
  }

  /* ----- Render ----- */
  return (
    <>
      <Header
        query={query}
        onQueryChange={(v) => {
          setQuery(v);
          setRepeatFeedback(null);
          if (v) setActiveCat('');
        }}
        categories={visibleCategories}
        activeCategory={activeCat}
        onSelectCategory={handleSelectCategory}
        brandKey={currentBrand}
        showBrandSwitch={multiMenuEnabled}
        switchLogo={otherBrandLogo}
        switchBrandKey={otherBrand}
        onSwitchBrand={handleSwitchBrand}
      />

      <CategoryBar enabledCategories={visibleCategories} active={activeCat} select={handleSelectCategory} />

      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { xs: 1.5, sm: 3 },
          pt: { xs: 2, sm: 2.5 },
          pb: {
            xs: `calc(${FOOTER_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 16px)`,
            sm: 8,
          },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1200 }}>
          <Box
            ref={resultsStartRef}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, sm: 3 },
              scrollMarginTop: { xs: '210px', sm: '240px' },
            }}
          >
            {isWaiterMode ? (
              <Box
                sx={{
                  position: 'sticky',
                  top: { xs: 116, sm: 132 },
                  zIndex: 6,
                  borderRadius: 3,
                  border: `1px solid ${theme.appBrand.softBorderColor}`,
                  background:
                    'radial-gradient(circle at top right, rgba(230, 189, 23, 0.12) 0%, transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 18px 34px rgba(0,0,0,0.18)',
                  p: { xs: 1.2, sm: 1.4 },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 1.2,
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', md: 'center' },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.1,
                        py: 0.85,
                        borderRadius: 2.2,
                        background:
                          'linear-gradient(135deg, rgba(230, 189, 23, 0.18) 0%, rgba(230, 189, 23, 0.07) 100%)',
                        border: `1px solid ${theme.appBrand.softBorderColor}`,
                      }}
                    >
                      <TableRestaurantOutlinedIcon sx={{ color: 'primary.main' }} />
                      <Box>
                        <Box
                          sx={{
                            fontSize: 11,
                            letterSpacing: '0.09em',
                            textTransform: 'uppercase',
                            color: theme.appBrand.faintText,
                          }}
                        >
                          Mesa activa
                        </Box>
                        <Box sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 700, lineHeight: 1.1 }}>
                          {currentTableName || 'Sin mesa seleccionada'}
                        </Box>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        mt: 1,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.8,
                      }}
                    >
                      {waiterDisplayName ? (
                        <Chip
                          icon={<BadgeRoundedIcon />}
                          size="small"
                          variant="outlined"
                          label={`Atiende ${waiterDisplayName}`}
                        />
                      ) : null}
                      {tableRequestLabel ? (
                        <Chip
                          icon={<RoomServiceOutlinedIcon />}
                          size="small"
                          variant="outlined"
                          color="info"
                          label={tableRequestLabel}
                        />
                      ) : null}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      justifyContent: { xs: 'flex-start', md: 'flex-end' },
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackRoundedIcon />}
                      onClick={() => navigate('/equipo/servicio')}
                      sx={{ borderRadius: 999, minHeight: 42, px: 1.8 }}
                    >
                      Volver al staff
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ReceiptLongRoundedIcon />}
                      onClick={() => navigate('/equipo/pedidos')}
                      sx={{ borderRadius: 999, minHeight: 42, px: 1.8 }}
                    >
                      Ver pedidos
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<RefreshRoundedIcon />}
                      onClick={() => onServiceContextRefresh?.()}
                      sx={{ borderRadius: 999, minHeight: 42, px: 1.8 }}
                    >
                      Actualizar mesa
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RoomServiceOutlinedIcon />}
                      onClick={() => onOpenTableWaiterRequest?.()}
                      sx={{ borderRadius: 999, minHeight: 42, px: 1.8 }}
                    >
                      Solicitar al mesero
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : null}

            {deferredQuery.trim() !== '' && queryCategoryOptions.length > 0 ? (
              <Box
                sx={{
                  p: { xs: 1.25, sm: 1.5 },
                  borderRadius: 3,
                  border: `1px solid ${theme.appBrand.softBorderColor}`,
                  background: theme.appBrand.frostedPanel,
                }}
              >
                <Box
                  sx={{
                    mb: 1.1,
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: theme.appBrand.faintText,
                  }}
                >
                  Categorías relacionadas
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {queryCategoryOptions.map((category) => (
                    <Button
                      key={category.id}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setQuery('');
                        handleSelectCategory(category.id);
                      }}
                      sx={{
                        minHeight: 34,
                        borderRadius: 999,
                        px: 1.6,
                      }}
                    >
                      {category.name}
                    </Button>
                  ))}
                </Box>
              </Box>
            ) : null}

            {showConsumptionShortcut ? (
              <Box
                sx={{
                  position: 'sticky',
                  top: { xs: 116, sm: 132 },
                  zIndex: 6,
                  borderRadius: 3,
                  border: `1px solid ${theme.appBrand.softBorderColor}`,
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 14px 30px rgba(0,0,0,0.14)',
                  p: { xs: 1.05, sm: 1.2 },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1,
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        fontSize: 11,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: theme.appBrand.faintText,
                      }}
                    >
                      Tu cuenta
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 0.5 }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        icon={<TableRestaurantOutlinedIcon />}
                        label={currentTableName}
                      />
                      {tableRequestLabel ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          color="info"
                          icon={<RoomServiceOutlinedIcon />}
                          label={tableRequestLabel}
                        />
                      ) : null}
                      {tableMessagesPendingCount > 0 ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          color="warning"
                          label={`${tableMessagesPendingCount} mensajes pendientes`}
                          clickable={typeof onOpenTableWaiterRequest === 'function'}
                          onClick={() => onOpenTableWaiterRequest?.()}
                          sx={{
                            cursor:
                              typeof onOpenTableWaiterRequest === 'function' ? 'pointer' : 'default',
                          }}
                        />
                      ) : null}
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    startIcon={<ReceiptLongRoundedIcon />}
                    onClick={() =>
                      navigate({
                        pathname: '/mesa',
                        search: `?table_token=${encodeURIComponent(currentTableToken)}`,
                      })
                    }
                    sx={{
                      borderRadius: 999,
                      minHeight: 40,
                      px: 1.7,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {consumptionShortcutLabel}
                  </Button>
                </Box>
              </Box>
            ) : null}

            {deferredQuery.trim() === '' ? (
              <PromotionsRail promotions={railPromotions} onOpenProduct={setSelectedProduct} />
            ) : null}

            {isWaiterMode && currentTableName ? (
              <Alert severity="success" sx={{ borderRadius: 3 }}>
                Tomando pedido en <strong>{currentTableName}</strong>
                {waiterDisplayName ? ` · Atiende: ${waiterDisplayName}` : ''}
              </Alert>
            ) : null}

            {serviceSuccess ? (
              <Alert severity="success" sx={{ borderRadius: 3 }}>
                {serviceSuccess}
              </Alert>
            ) : null}

            {deferredQuery.trim() === '' ? (
              <RepeatOrdersSection
                entries={history}
                onRepeat={handleRepeatOrder}
                feedback={repeatFeedback}
              />
            ) : null}

            {showEmpty ? (
              <Alert severity="info">
                No hay productos que coincidan con esta búsqueda o categoría.
              </Alert>
            ) : null}

            <Grid
              container
              spacing={{ xs: 1.25, sm: 2 }}
              justifyContent="center"
              sx={{ width: '100%' }}
            >
              {deferredQuery.trim() !== '' && searchPromotion ? (
                <Grid item xs={12} sx={CARD_ITEM_SX}>
                  <SearchPromotionCard
                    promotion={searchPromotion}
                    onOpenProduct={setSelectedProduct}
                  />
                </Grid>
              ) : null}
              {productSections}
            </Grid>
          </Box>
        </Box>

        {selectedProduct && (
          <ProductDialog
            open
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAdd={add}
          />
        )}

        <CartFooter
          onClick={() => setDrawerOpen((p) => !p)}
          title={
            isTableMode
              ? currentTableName
                ? `Pedido · ${currentTableName}`
                : 'Pedido en mesa'
              : isWaiterMode
                ? 'Pedido del mesero'
                : 'Ver pedido'
          }
          subtitleFormatter={({ itemCount }) =>
            isTableMode
              ? `${itemCount} artículos para enviar a revisión`
              : isWaiterMode
                ? `${itemCount} artículos para agregar`
                : `${itemCount} artículos en el carrito`
          }
        />


        <CartDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onReview={handleOpenConfirm}
          reviewLabel={reviewActionLabel}
          reviewStartIcon={reviewStartIcon}
          reviewButtonSx={reviewButtonSx}
        />

        <CartConfirmModal
          open={confirmOpen}
          onClose={handleCloseConfirm}
          onSubmit={handleProcessOrder}
          submitting={actionSubmitting}
          error={actionError}
          fulfillmentMode={fulfillmentMode}
          onFulfillmentModeChange={setFulfillmentMode}
          onItemFulfillmentModeChange={setItemFulfillmentMode}
          title={
            isTableMode
              ? `Procesar pedido en ${currentTableName || 'mesa'}`
              : isWaiterMode
                ? `Procesar como mesero en ${currentTableName || 'mesa'}`
                : 'Confirmar pedido'
          }
          noteLabel={
            isWaiterMode
              ? 'Notas para cocina o para la mesa'
              : isTableMode
                ? 'Notas para la mesa'
                : 'Notas al restaurante'
          }
          confirmLabel={orderActionLabel}
        />

        <ScrollTopFab
          show={showScrollTop}
          drawerOpen={drawerOpen || confirmOpen || Boolean(selectedProduct)}
        />
      </Box>
    </>
  );
}
