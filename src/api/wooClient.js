import axios from 'axios';

export default axios.create({
  baseURL: ${import.meta.env.VITE_WOO_URL}/wp-json/wc/v3,
  auth: {
    username: import.meta.env.VITE_WOO_KEY,
    password: import.meta.env.VITE_WOO_SECRET,
  },
  params: { per_page: 50 },
});
