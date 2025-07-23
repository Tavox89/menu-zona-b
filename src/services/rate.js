import { rateApi } from '../lib/axios.js';

/** Devuelve la tasa USD → Bs.  Si falla → 1. */
export async function getUsdToBsRate() {
  try {
    const { data } = await rateApi.get('/wp-json/fox-rate/v1/currencies');
    return Number(data?.VEF?.rate) || 1;
  } catch (err) {
    console.error('Error al obtener tasa USD→Bs', err);
    return 1;
  }
}