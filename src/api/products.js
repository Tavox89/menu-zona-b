import woo from './wooClient.js';
import { enrichProduct } from './extras.js';

/**
 * Fetch all product categories from WooCommerce.
 *
 * Categories are limited to 100 items to avoid pagination on the MVP. Each
 * category object contains an `id`, `name` and other metadata which can be
 * consumed by the UI. See https://woocommerce.github.io/woocommerce-rest-api-docs/#list-all-product-categories
 */
export const getCategories = () =>
  woo.get('/products/categories', { params: { per_page: 100 } });

/**
 * Fetch published products filtered by a specific category. When no category
 * identifier is provided you should instead call `getProducts()`.
 *
 * @param {number|string} id WooCommerce category ID
 */
export const getProductsByCategory = (id) =>
  woo.get('/products', {
    params: { category: id, status: 'publish', per_page: 100 },
  });

/**
 * Fetch all published products. This helper is useful when rendering the
 * initial list of products or the “Todos” category. The default page size
 * defined in `wooClient` limits results to 50; call `per_page` here to
 * override that limit.
 */
export const getProducts = () =>
  woo.get('/products', { params: { status: 'publish', per_page: 100 } });

/**
 * Fetch and enrich products with Tavox Extras metadata. This convenience
 * function wraps the raw WooCommerce product objects with a parsed
 * `tavoxExtras` property so components can easily render extras without
 * coupling to Woo metadata structure.
 *
 * @param {number|string|undefined} category Optional WooCommerce category ID
 */
export const fetchAndEnrichProducts = async (category) => {
  const { data } = category
    ? await getProductsByCategory(category)
    : await getProducts();
  return data.map(enrichProduct);
};