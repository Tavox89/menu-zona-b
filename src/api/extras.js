import { parseExtras } from '../utils/tavox.js';

/**
 * Decorate a WooCommerce product with Tavox Extras. When WooCommerce
 * returns a product it includes a `meta_data` array where third‑party
 * plugins store arbitrary metadata. Our custom Tavox plugin serializes
 * the extras definition into the `_tavox_groups` key. This helper reads
 * that metadata and returns a copy of the product with a `tavoxExtras`
 * property that contains a normalized array of groups ready for rendering.
 *
 * @param {object} product Raw WooCommerce product object
 * @returns {object} Extended product
 */
export const enrichProduct = (product) => {
  return {
    ...product,
    tavoxExtras: parseExtras(product.meta_data || []),
  };
};