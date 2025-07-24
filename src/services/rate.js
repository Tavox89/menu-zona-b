import axios from 'axios';

const rateApi = axios.create({
  baseURL: import.meta.env.VITE_RATE_BASE || 'https://clubsamsve.com',
  timeout: 15000,
});

const STORAGE_KEY = 'tavox_usd_bs_rate';
const DEFAULT_RATE = 1;

/** Devuelve la tasa USD → Bs.  Si falla → 1. */
export async function getUsdToBsRate() {
  const cached = Number(localStorage.getItem(STORAGE_KEY));
  if (!isNaN(cached) && cached > 0) return cached;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data } = await rateApi.get('/wp-json/fox-rate/v1/currencies');
      const rate = Number(data?.VEF?.rate) || DEFAULT_RATE;
      localStorage.setItem(STORAGE_KEY, rate);
      return rate;
    } catch (err) {
      if (
        attempt === 0 &&
        ['ECONNABORTED', 'ERR_NETWORK'].includes(err.code)
      ) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      console.error('Error al obtener tasa USD→Bs', err);
      return DEFAULT_RATE;
    }
  }
  return DEFAULT_RATE;
}