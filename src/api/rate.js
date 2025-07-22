import axios from 'axios';

// Cliente sin autenticación para la API de tasa. La URL base debe ser el
// dominio de WordPress (VITE_WOO_URL). Los endpoints del plugin fox-rate
// se exponen bajo /wp-json/fox-rate/v1.
const rateApi = axios.create({ baseURL: `${import.meta.env.VITE_WOO_URL}` });

/**
 * Obtiene la tasa de conversión USD → BsF a partir del plugin fox-rate.
 * Devuelve un número decimal con la tasa actual. Si la divisa VEF no
 * estuviera definida se devolverá 1.
 *
 * @returns {Promise<number>} La tasa de conversión
 */
export async function getUsdToBsRate() {
  try {
    const { data } = await rateApi.get('/wp-json/fox-rate/v1/currencies');
    if (data && data.VEF && typeof data.VEF.rate === 'number') {
      return Number(data.VEF.rate);
    }
    return 1;
  } catch (error) {
    console.error('Error al obtener la tasa USD→Bs', error);
    return 1;
  }
}