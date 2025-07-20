# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## WooCommerce API

Set the `VITE_WOO_URL` environment variable to the base URL of your WooCommerce
store when building for production. During development, requests under
`/wp-json` are proxied to `https://zonabclub.com` so components can keep using
relative paths without CORS issues.

Example `.env.local`:

```ini
VITE_WOO_URL=https://zonabclub.com
VITE_WOO_KEY=your_consumer_key
VITE_WOO_SECRET=your_consumer_secret
```