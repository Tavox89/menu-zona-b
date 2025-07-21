import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'


export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/zonabclub\.com\/wp-content\/uploads\/.*\.(png|jpe?g|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-images',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
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