import { api } from '../lib/axios.js';

export async function fetchCategories() {
  try {
    const { data } = await api.get('/wp-json/tavox/v1/categories');
    return data;
  } catch (err) {
    console.error('fetchCategories', err);
    return [];
  }
}

export async function fetchProducts({ category = '', q = '' } = {}) {
  try {
    const { data } = await api.get('/wp-json/tavox/v1/products', {
      params: { category, q },
    });
    return data;
  } catch (err) {
    console.error('fetchProducts', err);
    return [];
  }
}