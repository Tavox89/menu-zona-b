import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'


export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
            manifest: {
        name: 'Zona B Menu',
        short_name: 'Zona B',
        start_url: '/',
        background_color: '#000',
        theme_color: '#d97706',
        display: 'standalone',
        icons: [],
      },
      workbox: {
        runtimeCaching: [
          {
              urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
           cacheName: 'images',
              expiration: {
                   maxEntries: 120,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
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