import { useMemo, useState, useEffect, Fragment } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
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
// Import both USD and BS formatters so we can show values in both currencies.
import { formatPrice, formatBs } from '../utils/price.js';
import { useCart } from '../context/CartContext.jsx';
import { calcLine } from '../utils/cartTotals.js';
// Pull in the exchange rate hook to compute Bs values and display the BCV rate.
import { useUsdToBsRate } from '../context/RateContext.jsx';
import CategoryHeader from '../components/category/CategoryHeader.jsx';

/**
 * Home page component for listing menu items, allowing search and category
 * filtering and sending the order via WhatsApp. This version fixes two
 * outstanding issues:
 *
 * 1. When viewing all products (the "Todo" category), category headers are
 *    determined by the primary category for each product rather than just the
 *    first listed category. This prevents repeated or missing headers when
 *    products belong to multiple categories.
 * 2. The WhatsApp message now includes extra items, per‑line notes, prices in
 *    both USD and bolívares, the current BCV exchange rate, and uses
 *    number‑emoji bullets. A global note appended via the confirmation modal
 *    is also preserved. The link uses the api.whatsapp.com deep link for
 *    consistency with the dedicated WhatsApp hook.
 */
export default function Home() {
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
  // Current exchange rate; updates whenever RateContext changes.
  const rate = useUsdToBsRate();

  // Show a floating scroll‑to‑top button when the user scrolls down a bit
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSelectCategory = (id) => {
    setActiveCat(id);
    // Smooth scroll to top when category changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter products by search term and active category. When a search term is
  // present we ignore the active category filter to search globally.
  const filteredProducts = useMemo(() => {
    const term = query.toLowerCase();
    return products.filter((p) => {
      const matchesName = p.name.toLowerCase().includes(term);
      if (term !== '') {
        return matchesName; // global search ignores active category
      }
      const byCat = activeCat === '' || p.catIds?.includes(Number(activeCat));
      return byCat && matchesName;
    });
  }, [products, activeCat, query]);

  // Sort products when viewing the "Todo" category so that they appear grouped
  // by category and then alphabetically. Otherwise, just return the filtered
  // results. The orderMap maps category IDs to their positions in the
  // categories list.
  const orderedProducts = useMemo(() => {
    if (activeCat === '' && query.trim() === '') {
      const orderMap = {};
      categories.slice(1).forEach((cat, idx) => {
        orderMap[Number(cat.id)] = idx;
      });
      return [...filteredProducts].sort((a, b) => {
        const aIdx = Math.min(...(a.catIds || []).map((id) => orderMap[id] ?? Infinity));
        const bIdx = Math.min(...(b.catIds || []).map((id) => orderMap[id] ?? Infinity));
        if (aIdx !== bIdx) return aIdx - bIdx;
        return a.name.localeCompare(b.name);
      });
    }
    return filteredProducts;
  }, [filteredProducts, activeCat, query, categories]);

  // Precompute the list of product cards. When loading, display skeletons.
  // When showing all products, insert a category header whenever the primary
  // category changes. A product’s primary category is the one with the
  // lowest index in the categories array (ignoring the empty "Todo" entry).
  const productCards = useMemo(() => {
    if (loadingProducts) {
      return Array.from({ length: 12 }).map((_, i) => (
        <Grid item sx={{ flexBasis: 382, flexGrow: 0 }} key={i}>
          <ProductCard loading />
        </Grid>
      ));
    }

    const showHeaders = activeCat === '' && query.trim() === '';

    // Helper to pick the primary category ID for a product based on the order
    // of categories. If none of the product’s categories are found, the first
    // ID is used as a fallback.
    const getPrimaryCatId = (prod) => {
      const ids = prod.catIds || [];
      let primary = ids[0];
      let bestIndex = Infinity;
      ids.forEach((id) => {
        const idx = categories.findIndex((c) => c.id !== '' && Number(c.id) === id);
        if (idx >= 0 && idx < bestIndex) {
          bestIndex = idx;
          primary = id;
        }
      });
      return primary;
    };

    return orderedProducts.map((product, index) => {
      const prevPrimary = index === 0 ? null : getPrimaryCatId(orderedProducts[index - 1]);
      const currPrimary = getPrimaryCatId(product);
      const showHeader = showHeaders && (index === 0 || prevPrimary !== currPrimary);
      const catName = showHeader
        ? (categories.find((c) => Number(c.id) === currPrimary)?.name || '')
        : '';

      return (
        <Fragment key={`${product.id}-wrapper`}>
          {showHeader && (
            <Grid item xs={12}>
              <CategoryHeader title={catName} />
            </Grid>
          )}
          <Grid item sx={{ flexBasis: 382, flexGrow: 0 }} key={product.id}>
            <ProductCard
              product={product}
              onOpen={(p) => setSelectedProduct(p)}
            />
          </Grid>
        </Fragment>
      );
    });
  }, [loadingProducts, orderedProducts, activeCat, query, categories]);

  const showEmpty = !loadingProducts && orderedProducts.length === 0;

  // Convert numbers to keycap emoji (e.g. 1 -> 1️⃣). This improves
  // readability in WhatsApp and matches the dedicated hook.
  const numEmoji = (n) => {
    const keycaps = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    return n >= 1 && n <= 10 ? keycaps[n] : `${n}.`;
  };

  /**
   * Build a WhatsApp deep link message from the current cart items. The link
   * includes a formatted list of products, their quantities and selected
   * extras, a subtotal in both currencies, and the current BCV rate. Optionally
   * includes per‑product notes and a global note at the end. The message is
   * URL‑encoded using `encodeURIComponent()`.
   *
   * @param {Array} orderItems Items from CartContext
   * @param {string} note Global note to append at the end of the message
   * @returns {string} A wa.me link ready for use in an anchor tag
   */
  const buildWhatsAppLink = (orderItems, note = '') => {
    if (!orderItems || orderItems.length === 0) return '';
    const lines = orderItems.map((item, index) => {
      const extrasLines =
        item.extras
          ?.map((e) => `• ${e.label} (+${formatPrice(e.price)})`)
          .join('\n   ') || '';
      const noteLine =
        item.note && item.note.trim() !== ''
          ? `• 📝 ${item.note.trim()}`
          : '';
      const extrasSection = [extrasLines, noteLine].filter(Boolean).join('\n   ');
      const formattedExtras = extrasSection ? `\n   ${extrasSection}` : '';

      const priceBs = formatBs(item.basePrice, rate);
      const skuTxt = item.sku ? ` (SKU: ${item.sku})` : '';
      return `${numEmoji(index + 1)} ${item.name} x${item.qty} – ${formatPrice(item.basePrice)} (${priceBs})${skuTxt}${formattedExtras}`;
    });
    const totalUsd = orderItems.reduce((sum, i) => sum + calcLine(i), 0);
    const totalBs = formatBs(totalUsd, rate);
    const totalUsdTxt = formatPrice(totalUsd);

    let message =
      `*Pedido Zona B*\n` +
      `${lines.join('\n')}\n` +
      `--------------------\n` +
      `Subtotal: ${totalUsdTxt} | ${totalBs}\n` +
      `Tasa BCV: ${rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/$`;

    if (note && note.trim() !== '') {
      message += `\n📓 Nota: ${note.trim()}`;
    }
    const phone = import.meta.env.VITE_WA_PHONE || '';
    return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  };

  const handleSendWhatsApp = (note = '') => {
    const link = buildWhatsAppLink(items, note);
    if (link) window.open(link, '_blank');
  };

  return (
    <>
      <Header
        query={query}
        onQueryChange={(val) => {
          setQuery(val);
          if (val !== '') setActiveCat('');
        }}
        categories={categories}
        onSelectCategory={handleSelectCategory}
      />

      <CategoryBar
        enabledCategories={categories}
        active={activeCat}
        select={handleSelectCategory}
      />

      {/* Grid de productos y controles */}
      <Box
        component="main"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 2, sm: 3 },
          pb: 8,
        }}
      >
        <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 1200 }}>
          {productCards}
        </Grid>
        {showEmpty && (
          <Box sx={{ mt: 3 }}>
            <Typography align="center" color="text.secondary">
              No hay productos en esta categoría
            </Typography>
          </Box>
        )}
        {selectedProduct && (
          <ProductDialog
            open={Boolean(selectedProduct)}
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAdd={(item) => add(item)}
          />
        )}

        <CartFooter onClick={() => setDrawerOpen((prev) => !prev)} />

        <CartDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onReview={() => {
            setDrawerOpen(false);
            setConfirmOpen(true);
          }}
          onSend={() => {
            setDrawerOpen(false);
            handleSendWhatsApp();
          }}
        />

        <CartConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onSubmit={handleSendWhatsApp}
        />

        {/* Floating scroll to top button */}
        <ScrollTopFab show={showScrollTop} drawerOpen={drawerOpen} />
      </Box>
    </>
  );
}