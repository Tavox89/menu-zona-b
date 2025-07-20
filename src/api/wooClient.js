import axios from 'axios';

/**
 * Create a pre‑configured Axios client for WooCommerce API calls.
 *
 * The base URL and authentication details are pulled from environment
 * variables defined in `.env.local`. This helper centralizes common
 * configuration (base URL, basic auth and default page size) so the rest
 * of the code can simply import this client and call `.get()` or `.post()`.
 */
const woo = axios.create({
  baseURL: `${import.meta.env.VITE_WOO_URL}/wp-json/wc/v3`,
  auth: {
    username: import.meta.env.VITE_WOO_KEY,
    password: import.meta.env.VITE_WOO_SECRET,
  },
  params: { per_page: 50 },
});

export default woo;
