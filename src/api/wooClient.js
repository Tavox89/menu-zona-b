import axios from 'axios';

/**
 * Create a pre‑configured Axios client for WooCommerce API calls.
 *
 * The base URL and authentication details are pulled from environment
 * variables defined in `.env.local`. This helper centralizes common
 * configuration (base URL, basic auth and default page size) so the rest
 * of the code can simply import this client and call `.get()` or `.post()`.
 */
const base = `${import.meta.env.VITE_WOO_URL}/wp-json/wc/v3/`;

export default axios.create({
  baseURL: base,
  params: {
    consumer_key: import.meta.env.VITE_WOO_KEY,
    consumer_secret: import.meta.env.VITE_WOO_SECRET,
    per_page: 50,
  },
});
