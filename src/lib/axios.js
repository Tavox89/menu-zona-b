import axios from 'axios';

const TIMEOUT = 8000; // ms

/** 1) API Tavox / Woo ------------------------------------------- */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: TIMEOUT,
});

/** 2) API Fox‑Rate ---------------------------------------------- */
export const rateApi = axios.create({
  baseURL: import.meta.env.VITE_RATE_BASE || '',
  timeout: TIMEOUT,
});