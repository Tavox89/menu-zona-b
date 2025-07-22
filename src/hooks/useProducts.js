import { useEffect, useState } from 'react';
import { getCategories, fetchAndEnrichProducts } from '../api/products.js';
import { getUsdToBsRate } from '../api/rate.js';
import { CATEGORIES } from '../constants/categories.js';

/**
 * Hook que obtiene la lista de categorías activas y los productos
 * correspondientes desde la API Tavox Menu. Combina los datos de
 * categorías con los iconos definidos en `CATEGORIES` y respeta el
 * orden configurado por el administrador.
 */
export function useProducts() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener categorías desde la API y fusionarlas con los iconos locales.
    getCategories()
      .then(({ data }) => {
        const merged = CATEGORIES.map((c) => {
          const found = data.find((cat) => Number(cat.id) === Number(c.id));
          if (found) {
            return { ...c, enabled: true, order: found.order };
          }
          return { ...c, enabled: false };
        })
          .filter((cat) => cat.enabled)
          .sort((a, b) => a.order - b.order);
        setCategories(merged);
      })
      .catch((err) => setError(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    // Cargamos productos y extras primero.
    fetchAndEnrichProducts()
      .then((list) =>
        list.map((p) => ({
          ...p,
          catIds: (p.categories || []).map((c) => Number(c?.id ?? c)),
        }))
      )
      .then(async (normalized) => {
        // Obtener la tasa USD→Bs una sola vez y mapear precios.
        const rate = await getUsdToBsRate();
        return normalized.map((p) => ({
          ...p,
          price_bs: Number((p.price_usd * rate).toFixed(2)),
        }));
      })
      .then((normalizedWithBs) => setProducts(normalizedWithBs))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { categories, products, loading, error };
}