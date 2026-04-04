import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      manifest: {
        name: 'Zona B Club',
        short_name: 'Zona B',
        id: '/',
        start_url: '/',
        background_color: '#000',
        theme_color: '#d8ac1e',
        display: 'standalone',
        shortcuts: [
          {
            name: 'Equipo',
            short_name: 'Equipo',
            url: '/equipo',
            icons: [{ src: '/pwa/zonab-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Pedidos',
            short_name: 'Pedidos',
            url: '/equipo/pedidos',
            icons: [{ src: '/pwa/zonab-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Cocina',
            short_name: 'Cocina',
            url: '/equipo/cocina',
            icons: [{ src: '/pwa/zonab-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Barra',
            short_name: 'Barra',
            url: '/equipo/barra',
            icons: [{ src: '/pwa/zonab-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        icons: [
          {
            src: '/pwa/zonab-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa/zonab-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa/zonab-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa/zonab-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  optimizeDeps: {
    force: true,
  },
  server: {
    proxy: {
      '/wp-json': {
        target: 'https://zonabclub.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
