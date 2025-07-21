import axios from 'axios';

/**
 * Cliente Axios configurado para acceder a la API de WooCommerce.
 * Obtiene la URL base y las credenciales desde variables de entorno
 * definidas en `.env.local`, utilizando autenticación básica con una
 * Application Password de WordPress. Así, el resto del código sólo debe
 * importar este cliente para realizar peticiones.
 */
const woo = axios.create({
  baseURL: `${import.meta.env.VITE_WOO_URL}/wp-json/wc/v3/`,
  auth: {
    username: import.meta.env.VITE_WP_USER,
    password: import.meta.env.VITE_WP_APP_PWD,
  },
    params: { per_page: 50 },
});

export default woo;