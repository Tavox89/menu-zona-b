import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { getCategories } from '../api/products.js';
import { fetchAndEnrichProducts } from '../api/products.js';
import CategoriesBar from '../components/category/CategoriesBar.jsx';
import ProductCard from '../components/product/ProductCard.jsx';

import ProductDialog from '../components/product/ProductDialog.jsx';
import CartFab from '../components/cart/CartFab.jsx';
import CartDrawer from '../components/cart/CartDrawer.jsx';
import CartConfirmModal from '../components/cart/CartConfirmModal.jsx';
import ErrorFallback from '../components/common/ErrorFallback.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWhatsAppLink } from '../hooks/useWhatsAppLink.js';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { items, add } = useCart();
  const waLink = useWhatsAppLink(items);

  // Fetch categories on mount
  useEffect(() => {
    setLoading(true);
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch products when category changes
  useEffect(() => {
    setLoading(true);
    fetchAndEnrichProducts(selectedCategory)
      .then((list) => setProducts(list))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    const lower = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(lower));
  }, [products, query]);

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
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#000' }}>
        <Toolbar>
          <Box
            component="img"
            src="/logo.png"
            alt="Zona B"
            sx={{ width: 32, height: 32, mr: 1 }}
          />
          <Typography variant="h6" color="primary">
            Zona B
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ px: 2, pb: 8 }}>
        {/* Search bar */}
        <Box sx={{ pt: 2, pb: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Buscar productos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Box>
      {/* Categories */}
           <CategoriesBar
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
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