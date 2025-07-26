import { useMemo, useState, useEffect, Fragment } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ScrollTopFab from '../components/layout/ScrollTopFab.jsx';
import useMenuData from '../hooks/useMenuData.js';
import Header from '../components/layout/Header.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import Typography from '@mui/material/Typography';
import CategoryBar from '../components/category/CategoryBar.jsx';
import ProductDialog from '../components/product/ProductDialog.jsx';
import CartFooter from '../components/cart/CartFooter.jsx';
import CartDrawer from '../components/cart/CartDrawer.jsx';
import CartConfirmModal from '../components/cart/CartConfirmModal.jsx';
import { formatPrice, formatBs } from '../utils/price.js';
import { useCart } from '../context/CartContext.jsx';
import { calcLine } from '../utils/cartTotals.js';
import { useUsdToBsRate } from '../context/RateContext.jsx';
import CategoryHeader from '../components/category/CategoryHeader.jsx';

export default function Home() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm')); // tablet+

  const {
    categories,
    products,
    loadingProducts,
    activeCat,
    setActiveCat,
    query,
    setQuery,
  } = useMenuData();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { items, add } = useCart();
  const rate = useUsdToBsRate();

  /* ----- Scroll‑to‑top ----- */
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ----- Helpers ----- */
  const handleSelectCategory = (id) => {
    setActiveCat(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPrimaryCatId = (prod) => {
    const ids = prod.catIds || [];
    let primary = ids[0];
    let bestIdx = Infinity;
    ids.forEach((id) => {
      const idx = categories.findIndex((c) => c.id && +c.id === id);
      if (idx >= 0 && idx < bestIdx) {
        bestIdx = idx;
        primary = id;
      }
    });
    return primary;
  };

  /* ----- Filtro y orden ----- */
  const filteredProducts = useMemo(() => {
    const term = query.toLowerCase();
    return products.filter((p) => {
      const matches = p.name.toLowerCase().includes(term);
      if (term) return matches;
      const okCat = activeCat === '' || p.catIds?.includes(+activeCat);
      return okCat && matches;
    });
  }, [products, activeCat, query]);

  const orderedProducts = useMemo(() => {
    if (activeCat === '' && query.trim() === '') {
      const orderMap = {};
      categories.slice(1).forEach((cat, i) => (orderMap[+cat.id] = i));
      return [...filteredProducts].sort((a, b) => {
        const aIdx = Math.min(...(a.catIds || []).map((id) => orderMap[id] ?? Infinity));
        const bIdx = Math.min(...(b.catIds || []).map((id) => orderMap[id] ?? Infinity));
        return aIdx !== bIdx ? aIdx - bIdx : a.name.localeCompare(b.name);
      });
    }
    return filteredProducts;
  }, [filteredProducts, activeCat, query, categories]);

  /* ----- Construcción de tarjetas ----- */
  const productSections = useMemo(() => {
    if (loadingProducts) {
      return [
        <Grid item xs={12} key="skeleton">
          <Grid container spacing={2}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Grid item sx={{ flexBasis: 382, flexGrow: 0 }} key={i}>
                <ProductCard loading />
              </Grid>
            ))}
          </Grid>
        </Grid>,
      ];
    }

    const showHeaders = activeCat === '' && query.trim() === '';

    /* Desktop/tablet con headers separados */
    if (isDesktop && showHeaders) {
      const sections = [];
      let currentCat = null;
      let group = [];

      orderedProducts.forEach((prod, idx) => {
        const catId = getPrimaryCatId(prod);
        if (catId !== currentCat) {
          // push grupo anterior
          if (group.length) {
            sections.push(
              <Grid item xs={12} key={`group-${currentCat}`}>
                <Grid container spacing={2}>{group}</Grid>
              </Grid>
            );
            group = [];
          }
          // nuevo header
          const title = categories.find((c) => +c.id === catId)?.name || '';
          sections.push(
            <Grid item xs={12} key={`header-${catId}`}>
              <CategoryHeader title={title} />
            </Grid>
          );
          currentCat = catId;
        }
        group.push(
          <Grid item sx={{ flexBasis: 382, flexGrow: 0 }} key={prod.id}>
            <ProductCard product={prod} onOpen={setSelectedProduct} />
          </Grid>
        );
        // último grupo
        if (idx === orderedProducts.length - 1) {
          sections.push(
            <Grid item xs={12} key={`group-${currentCat}`}>
              <Grid container spacing={2}>{group}</Grid>
            </Grid>
          );
        }
      });
      return sections;
    }

    /* Mobile o filtro/búsqueda */
    return orderedProducts.map((prod, idx) => {
      const prevPrimary = idx === 0 ? null : getPrimaryCatId(orderedProducts[idx - 1]);
      const currPrimary = getPrimaryCatId(prod);
      const showHeader = showHeaders && (idx === 0 || prevPrimary !== currPrimary);
      const title = showHeader ? categories.find((c) => +c.id === currPrimary)?.name || '' : '';

      return (
        <Fragment key={`${prod.id}-wrap`}>
          {showHeader && (
            <Grid item xs={12}>
              <CategoryHeader title={title} />
            </Grid>
          )}
          <Grid item sx={{ flexBasis: 382, flexGrow: 0 }} key={prod.id}>
            <ProductCard product={prod} onOpen={setSelectedProduct} />
          </Grid>
        </Fragment>
      );
    });
  }, [loadingProducts, orderedProducts, isDesktop, activeCat, query, categories]);

  const showEmpty = !loadingProducts && orderedProducts.length === 0;

  /* ----- WhatsApp helpers (sin cambios) ----- */
  const numEmoji = (n) =>
    n >= 1 && n <= 10 ? ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'][n] : `${n}.`;

  const buildWhatsAppLink = (orderItems, note = '') => {
    if (!orderItems?.length) return '';
    const lines = orderItems.map((it, i) => {
      const extras = it.extras?.map((e) => `• ${e.label} (+${formatPrice(e.price)})`).join('\n   ') || '';
      const noteLine = it.note?.trim() ? `• 📝 ${it.note.trim()}` : '';
      const tail = [extras, noteLine].filter(Boolean).join('\n   ');
      const priceBs = formatBs(it.basePrice, rate);
      const skuTxt = it.sku ? ` (SKU: ${it.sku})` : '';
      return (
        `${numEmoji(i + 1)} ${it.name} x${it.qty} – ${formatPrice(it.basePrice)} (${priceBs})${skuTxt}` +
        (tail ? `\n   ${tail}` : '')
      );
    });
    const totalUsd = orderItems.reduce((s, it) => s + calcLine(it), 0);
    const msg =
      `*Pedido Zona B*\n${lines.join('\n')}\n--------------------\n` +
      `Subtotal: ${formatPrice(totalUsd)} | ${formatBs(totalUsd, rate)}\n` +
      `Tasa BCV: ${rate.toFixed(2)} Bs/$` + (note?.trim() ? `\n📓 Nota: ${note.trim()}` : '');
    const phone = import.meta.env.VITE_WA_PHONE || '';
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`;
  };

  const handleSendWhatsApp = (note='') => {
    const link = buildWhatsAppLink(items, note);
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
  };

  /* ----- Render ----- */
  return (
    <>
      <Header
        query={query}
        onQueryChange={(v) => { setQuery(v); if (v) setActiveCat(''); }}
        categories={categories}
        onSelectCategory={handleSelectCategory}
      />

      <CategoryBar enabledCategories={categories} active={activeCat} select={handleSelectCategory} />

      <Box component="main" sx={{ display:'flex', justifyContent:'center', px:{xs:2, sm:3}, pb:8 }}>
        <Grid container spacing={2} justifyContent="center" sx={{ maxWidth:1200 }}>
          {productSections}
        </Grid>

        {showEmpty && (
          <Box sx={{ mt:3 }}>
            <Typography align="center" color="text.secondary">
              No hay productos en esta categoría
            </Typography>
          </Box>
        )}

        {selectedProduct && (
          <ProductDialog
            open
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAdd={add}
          />
        )}

        <CartFooter onClick={() => setDrawerOpen((p)=>!p)} />

        <CartDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onReview={() => { setDrawerOpen(false); setConfirmOpen(true); }}
          onSend={() => { setDrawerOpen(false); handleSendWhatsApp(); }}
        />

        <CartConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onSubmit={handleSendWhatsApp} />

        <ScrollTopFab show={showScrollTop} drawerOpen={drawerOpen} />
      </Box>
    </>
  );
}
