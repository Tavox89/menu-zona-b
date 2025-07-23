import { useEffect, useState } from 'react';
import { fetchCategories, fetchProducts } from '../services/tavox.js';

export default function useMenuData() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeCat, setActiveCatState] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoadingCategories(true);
    fetchCategories()
      .then((data) => {
        if (!mounted) return;
        const all = { id: '', name: 'Todo' };
        setCategories([all, ...data]);
        setActiveCat('');
      })
      .finally(() => mounted && setLoadingCategories(false));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {

    let mounted = true;
    setLoadingProducts(true);
  fetchProducts()
      .then((data) => {
       if (!mounted) return;
        const normalized = Array.isArray(data)
          ? data.map((p) => ({
              ...p,
              catIds: (p.categories || []).map((c) => Number(c?.id ?? c)),
            }))
          : [];
        setProducts(normalized);
      })
      .finally(() => mounted && setLoadingProducts(false));
    return () => {
      mounted = false;
    };
  }, []);

  const setActiveCat = (id) => {
    setActiveCatState(id);

  };

  return {
    categories,
    products,
    loadingCategories,
    loadingProducts,
    activeCat,
    setActiveCat,
    query,
    setQuery,
  };
}