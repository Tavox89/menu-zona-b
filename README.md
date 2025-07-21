# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## WooCommerce API

Configure las variables `VITE_WOO_URL`, `VITE_WP_USER` y `VITE_WP_APP_PWD` para
conectar con tu tienda WooCommerce. Las credenciales corresponden a una
Application Password de WordPress y se utilizan mediante autenticación básica.
Durante el desarrollo, las peticiones bajo `/wp-json` se proxyan a
`https://zonabclub.com` para evitar problemas de CORS.

Ejemplo de `.env.local`:

```ini
VITE_WOO_URL=https://zonabclub.com
VITE_WP_USER=tu_usuario
VITE_WP_APP_PWD=tu_app_password
```
changes take effect.
La Application Password se genera en **Users ▸ Profile ▸ Application Passwords** dentro del escritorio de WordPress. Tras modificar `vite.config.js` debes reiniciar el servidor de desarrollo para que los cambios en el proxy surtan efecto.
changes take effect.
## Renderizado esquelético & PWA

Para generar la versión de producción con soporte offline ejecuta:

```bash
npm run build && npm run preview
```

El build incluye un Service Worker que cachea las imágenes de productos y muestra pantallas en modo esqueleto mientras se cargan los datos.