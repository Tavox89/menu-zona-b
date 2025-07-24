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
import { formatPrice } from '../utils/price.js';
import { useCart } from '../context/CartContext.jsx';
import { calcLine } from '../utils/cartTotals.js';
import CategoryHeader from '../components/category/CategoryHeader.jsx';
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
const orderedProducts = useMemo(() => {
    if (activeCat === '' && query.trim() === '') {
      const orderMap = {};
      categories.slice(1).forEach((cat, idx) => {
        orderMap[Number(cat.id)] = idx;
      });
      return [...filteredProducts].sort((a, b) => {
        const aIdx = Math.min(
          ...(a.catIds || []).map((id) => orderMap[id] ?? Infinity)
        );
        const bIdx = Math.min(
          ...(b.catIds || []).map((id) => orderMap[id] ?? Infinity)
        );
        if (aIdx !== bIdx) return aIdx - bIdx;
        return a.name.localeCompare(b.name);
      });
    }
    return filteredProducts;
  }, [filteredProducts, activeCat, query, categories]);

  const productCards = useMemo(() => {
    if (loadingProducts) {
      return Array.from({ length: 12 }).map((_, i) => (
        <Grid item sx={{ flexBasis: 382, flexGrow: 0 }} key={i}>
                <ProductCard loading />
        </Grid>
      ));
    }

    const showHeaders = activeCat === '' && query.trim() === '';

    return orderedProducts.map((product, index) => {
      const prevCat = orderedProducts[index - 1]?.catIds?.[0];
      const currCat = product.catIds?.[0];
      const showHeader =
        showHeaders && (index === 0 || prevCat !== currCat);
      const catName = showHeader
        ? categories.find((c) => Number(c.id) === currCat)?.name
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

  // Build WhatsApp link including optional note
  const buildWhatsAppLink = (orderItems, note = '') => {
    if (!orderItems || orderItems.length === 0) return '';
    const lines = orderItems.map((item, index) => {
      const extrasLines =
          item.extras
          ?.map((e) => `• ${e.label} (+${formatPrice(e.price)})`)
          .join('\n   ') || '';
      const noteLine = item.note && item.note.trim() !== '' ? `• ${item.note.trim()}` : '';
      const extrasSection = [extrasLines, noteLine].filter(Boolean).join('\n   ');
      const formattedExtras = extrasSection ? `\n   ${extrasSection}` : '';
      return `${index + 1}\u20E3 ${item.name} x${item.qty} - ${formatPrice(
        item.basePrice ?? 0
       )}${formattedExtras}`;
    });
    const subtotal = formatPrice(orderItems.reduce((sum, i) => sum + calcLine(i), 0));
    let message = `*Pedido Zona B*\n${lines.join('\n')}\nSubtotal ${subtotal}`;
    if (note && note.trim() !== '') {
      message += `\n📓 Nota: ${note.trim()}`;
    }
    const phone = import.meta.env.VITE_WA_PHONE || '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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
