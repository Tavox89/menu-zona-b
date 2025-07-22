import { useEffect, useState } from 'react';
import { fetchCategories, fetchProducts } from '../api/tavox.js';

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
        setCategories(data);
        if (data.length > 0) setActiveCat(data[0].id);
      })
      .finally(() => mounted && setLoadingCategories(false));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeCat && query === '') return;
    let mounted = true;
    setLoadingProducts(true);
    fetchProducts({ category: activeCat, q: query })
      .then((data) => {
        if (mounted) setProducts(data);
      })
      .finally(() => mounted && setLoadingProducts(false));
    return () => {
      mounted = false;
    };
  }, [activeCat, query]);

  const setActiveCat = (id) => {
    setActiveCatState(id);
    setQuery('');
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