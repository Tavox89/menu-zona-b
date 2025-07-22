import axios from 'axios';
import { enrichProduct } from './extras.js';

/**
 * Cliente Axios sin autenticación para Tavox Menu API.
 *
 * La URL base debe apuntar al dominio de WordPress definido en VITE_WOO_URL.
 */
const api = axios.create({
  baseURL: `${import.meta.env.VITE_WOO_URL}`,
});

/**
 * Obtener categorías visibles desde la API Tavox Menu. Devuelve una
 * lista de objetos { id, name, slug, enabled, order, image } en el
 * orden configurado por el administrador.
 */
export const getCategories = () => api.get('/wp-json/tavox/v1/categories');

/**
 * Obtener productos filtrados por categoría. Cuando el parámetro `id` es
 * falsy se devolverán productos de todas las categorías visibles.
 *
 * @param {number|string|undefined} id Identificador de categoría
 */
export const getProductsByCategory = (id) =>
  api.get('/wp-json/tavox/v1/products', { params: { category: id } });

/**
 * Obtener todos los productos visibles. Envuelve la llamada al endpoint
 * `tavox/v1/products` sin parámetros.
 */
export const getProducts = () => api.get('/wp-json/tavox/v1/products');

/**
 * Obtener productos y enriquecer con Tavox Extras. Si la API Tavox
 * devuelve un array de productos con la propiedad `extras`,
 * `enrichProduct` normalizará estos datos para proporcionar una
 * propiedad `tavoxExtras` que coincide con el formato esperado por el UI.
 *
 * @param {number|string|undefined} category Identificador de categoría opcional
 */
export const fetchAndEnrichProducts = async (category) => {
  const { data } = category
    ? await getProductsByCategory(category)
    : await getProducts();
  return data.map(enrichProduct);
};