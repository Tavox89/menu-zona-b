import { parseExtras } from '../utils/tavox.js';

/**
 * Normaliza un array de extras proveniente de la API Tavox. Cada
 * grupo se transforma para incluir un identificador único (`groupId`),
 * el título del grupo (`label`), el indicador `multiple` y las
 * opciones con identificadores estables.
 *
 * @param {Array} extras Array de grupos de extras ({ label, multiple, options })
 * @returns {Array<{
 *   groupId: string;
 *   label: string;
 *   multiple: boolean;
 *   options: Array<{ id: string; label: string; price: number }>;
 * }>} Normalizado
 */
export function normalizeExtras(extras) {
  if (!Array.isArray(extras)) return [];
  return extras.map((group, gIndex) => {
    const label = group?.label || '';
    const multiple = Boolean(group?.multiple);
    const options = Array.isArray(group?.options)
      ? group.options.map((opt, oIndex) => ({
          id: `${gIndex}-${oIndex}`,
          label: opt?.label || '',
          price: Number(opt?.price) || 0,
        }))
      : [];
    return {
      groupId: `group-${gIndex}`,
      label,
      multiple,
      options,
    };
  });
}

/**
 * Decora un producto con Tavox Extras. Cuando el objeto `product` incluye
 * una propiedad `extras` (proporcionada por la API Tavox Menu), se
 * normaliza mediante `normalizeExtras`. De lo contrario se delega en
 * `parseExtras`, que analiza los metadatos de WooCommerce.
 *
 * @param {object} product Producto crudo de la API
 * @returns {object} Producto extendido con `tavoxExtras`
 */
export function enrichProduct(product) {
  let tavoxExtras = [];
  if (product && Array.isArray(product.extras)) {
    tavoxExtras = normalizeExtras(product.extras);
  } else if (product && Array.isArray(product.meta_data)) {
    tavoxExtras = parseExtras(product.meta_data);
  }
  return {
    ...product,
    tavoxExtras,
  };
}