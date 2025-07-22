# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Tavox Menu API

Configura la variable `VITE_TAVOX_API_URL` con la URL base de tu sitio WordPress.
Los datos de categorías y productos se obtienen desde los endpoints públicos
`/wp-json/tavox/v1/*` y no requieren autenticación.

Ejemplo de `.env.local`:

```ini
VITE_TAVOX_API_URL=https://zonabclub.com
```

Las credenciales de WooCommerce se mantienen sólo para el checkout y se
encuentran comentadas en `src/api/wooClient.js`.
## Renderizado esquelético & PWA

Para generar la versión de producción con soporte offline ejecuta:

```bash
npm run build && npm run preview
```

El build incluye un Service Worker que cachea las imágenes de productos y muestra pantallas en modo esqueleto mientras se cargan los datos.