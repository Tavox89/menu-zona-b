import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE || import.meta.env.VITE_TAVOX_API_URL || '',
  timeout: 8000,
});

export const fetchCategories = async () => {
  try {
    const { data } = await api.get('/wp-json/tavox/v1/categories');
    return data;
  } catch (err) {
    console.error('fetchCategories', err);
    return [];
  }
};

export const fetchProducts = async ({ category = '', q = '' } = {}) => {
  try {
    const { data } = await api.get('/wp-json/tavox/v1/products', {
      params: { category, q },
    });
    return data;
  } catch (err) {
    console.error('fetchProducts', err);
    return [];
  }
};