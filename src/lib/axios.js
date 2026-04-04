import axios from 'axios';

const TIMEOUT = 8000; // ms
const DEFAULT_API_BASE = 'https://zonabclub.com';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '' : DEFAULT_API_BASE);
const RATE_BASE_URL =
  import.meta.env.VITE_RATE_BASE || (import.meta.env.DEV ? '' : 'https://clubsamsve.com');

/** 1) API Tavox / Woo ------------------------------------------- */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
});

/** 2) API Fox‑Rate ---------------------------------------------- */
export const rateApi = axios.create({
  baseURL: RATE_BASE_URL,
  timeout: TIMEOUT,
});
