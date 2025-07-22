import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import useMenuData from '../hooks/useMenuData.js';
  import Header from '../components/layout/Header.jsx';
import { useTheme } from '@mui/material/styles';
import ProductCard from '../components/product/ProductCard.jsx';
import CategoryBar from '../components/category/CategoryBar.jsx';
import ProductDialog from '../components/product/ProductDialog.jsx';
import CartFab from '../components/cart/CartFab.jsx';
import CartDrawer from '../components/cart/CartDrawer.jsx';
import CartConfirmModal from '../components/cart/CartConfirmModal.jsx';

import { useCart } from '../context/CartContext.jsx';
import { useWhatsAppLink } from '../hooks/useWhatsAppLink.js';

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
  const waLink = useWhatsAppLink(items);
    const theme = useTheme();

  const handleSelectCategory = (id) => {
     setActiveCat(id);
    window.scrollTo({ top: 0 });
  };

  const filteredProducts = products;

  const productCards = useMemo(
    () =>
      loadingProducts
        ? Array.from({ length: 12 }).map((_, i) => (
               <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <ProductCard loading />
            </Grid>
          ))
        : filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard
                product={product}
                onOpen={(p) => setSelectedProduct(p)}
              />
            </Grid>
          )),
      [loadingProducts, filteredProducts]
  );

  const handleSendWhatsApp = () => {
    if (waLink) window.open(waLink, '_blank');
  };

  // Error handling

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
      <Box sx={{ px: 2, pb: 8 }}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {productCards}
        </Grid>

        {selectedProduct && (
          <ProductDialog
            open={Boolean(selectedProduct)}
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAdd={(item) => add(item)}
          />
        )}

        <CartFab count={items.length} onClick={() => setDrawerOpen(true)} />

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
      </Box>
    </>
  );
}
