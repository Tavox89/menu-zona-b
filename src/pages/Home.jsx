import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import { useProducts } from '../hooks/useProducts.js';
import Header from '../components/layout/Header.jsx'
import ProductCard from '../components/product/ProductCard.jsx';
import CategoryChips from '../components/category/CategoryChips.jsx';
import ProductDialog from '../components/product/ProductDialog.jsx';
import CartFab from '../components/cart/CartFab.jsx';
import CartDrawer from '../components/cart/CartDrawer.jsx';
import CartConfirmModal from '../components/cart/CartConfirmModal.jsx';
import ErrorFallback from '../components/common/ErrorFallback.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWhatsAppLink } from '../hooks/useWhatsAppLink.js';

export default function Home() {
  const { categories, products, loading, error } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { items, add } = useCart();
  const waLink = useWhatsAppLink(items);

  const handleSelectCategory = (id) => {
    setSelectedCategory(id);
    setQuery('');
  };


  const filteredProducts = useMemo(() => {
     const term = query.toLowerCase();
    return products.filter((p) => {
      const catMatch =
        selectedCategory === 0 ||
        p.categories.some((id) => Number(id) === selectedCategory);
      const nameMatch = p.name.toLowerCase().includes(term);
      return catMatch && nameMatch;
    });
  }, [products, selectedCategory, query]);

  const productCards = useMemo(
    () =>
      loading
        ? Array.from({ length: 12 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <ProductCard loading />
            </Grid>
          ))
        : filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <ProductCard
                product={product}
                onOpen={(p) => setSelectedProduct(p)}
              />
            </Grid>
          )),
    [loading, filteredProducts]
  );
  const handleSendWhatsApp = () => {
    if (waLink) {
      window.open(waLink, '_blank');
    }
  };

  // Error handling
  if (error) {
    return <ErrorFallback error={error} />;
  }


  return (
    <>
    <Header
        query={query}
        onQueryChange={setQuery}
        categories={categories}
              selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />
        <Container maxWidth="sm">
        <CategoryChips
          categories={categories}
          selected={selectedCategory}
          onSelect={handleSelectCategory}
        />
      </Container>
      <Box sx={{ px: 2, pb: 8 }}>
      {/* Product grid */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
   {productCards}
      </Grid>
      {/* Product dialog */}
      {selectedProduct && (
        <ProductDialog
          open={Boolean(selectedProduct)}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(item) => add(item)}
        />
      )}
      {/* Cart */}
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
        onSubmit={() => handleSendWhatsApp()}
      />
    </Box>
      </>
  );
}