import { useEffect, useMemo, useState } from 'react';
import { fetchAndEnrichProducts } from '../api/products.js';
import { CATEGORIES } from '../constants/categories.js';

export function useProducts() {
  const categories = useMemo(
    () => CATEGORIES.filter((c) => c.enabled).sort((a, b) => a.order - b.order),
    []
  );
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchAndEnrichProducts()
           .then((list) =>
        list.map((p) => ({
          ...p,
         catIds: p.categories.map((c) => Number(c?.id ?? c)),
        }))
      )
      .then((normalized) => setProducts(normalized))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { categories, products, loading, error };
}