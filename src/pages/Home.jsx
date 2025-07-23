import { useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Container from '@mui/material/Container';
import useMenuData from '../hooks/useMenuData.js';
import Header from '../components/layout/Header.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import Typography from '@mui/material/Typography';
import CategoryBar from '../components/category/CategoryBar.jsx';
import ProductDialog from '../components/product/ProductDialog.jsx';
import CartFooter from '../components/cart/CartFooter.jsx';
import CartDrawer from '../components/cart/CartDrawer.jsx';
import CartConfirmModal from '../components/cart/CartConfirmModal.jsx';

import { useCart } from '../context/CartContext.jsx';

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
      const byCat = activeCat === '' || p.catIds?.includes(Number(activeCat));
      const byName = p.name.toLowerCase().includes(term);
      return byCat && byName;
    });
  }, [products, activeCat, query]);

  const productCards = useMemo(
    () =>
      loadingProducts
        ? Array.from({ length: 12 }).map((_, i) => (
         <Grid item sx={{ flexBasis: 365, flexGrow: 0 }} key={i}>
              <ProductCard loading />
            </Grid>
          ))
        : filteredProducts.map((product) => (
           <Grid item sx={{ flexBasis: 365, flexGrow: 0 }} key={product.id}>
              <ProductCard
                product={product}
                onOpen={(p) => setSelectedProduct(p)}
              />
            </Grid>
          )),
    [loadingProducts, filteredProducts]
  );
  const showEmpty = !loadingProducts && filteredProducts.length === 0;

  // Build WhatsApp link including optional note
  const buildWhatsAppLink = (orderItems, note = '') => {
    if (!orderItems || orderItems.length === 0) return '';
    const lines = orderItems.map((item, index) => {
      const extrasLines =
        item.extras?.map((e) => `• ${e.label} (+$${Number(e.price ?? 0).toFixed(2)})`).join('\n   ') || '';
      const noteLine =
        item.note && item.note.trim() !== ''
          ? `• ${item.note.trim()}`
          : '';
      const extrasSection = [extrasLines, noteLine].filter(Boolean).join('\n   ');
      const formattedExtras = extrasSection ? `\n   ${extrasSection}` : '';
      return `${index + 1}\u20E3 ${item.name} x${item.qty} - $${Number(
        item.basePrice ?? 0
      ).toFixed(2)}${formattedExtras}`;
    });
    const subtotal = orderItems
      .reduce((sum, i) => sum + i.lineTotal, 0)
      .toFixed(2);
    let message = `*Pedido Zona B*\n${lines.join('\n')}\nSubtotal $${subtotal}`;
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
        onQueryChange={setQuery}
        categories={categories}
        onSelectCategory={handleSelectCategory}
      />

      <CategoryBar
        enabledCategories={categories}
        active={activeCat}
        select={handleSelectCategory}
      />

      {/* Grid de productos y controles */}
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: 8 }}>
        <Grid container spacing={3} justifyContent="center" sx={{ mx: 'auto' }}>
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

        <CartFooter onClick={() => setDrawerOpen(true)} />

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
        <Fab
          color="primary"
          size="small"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, sm: 88 },
            right: 16,
            zIndex: (theme) => theme.zIndex.tooltip,
            display: showScrollTop ? 'flex' : 'none',
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Container>
    </>
  );
}
