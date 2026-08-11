import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    host: true,   // expose on network for mobile testing
    port: 5173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Nhật ký bé yêu',
        short_name: 'Bé yêu',
        description: 'Theo dõi lịch sinh hoạt của bé và mẹ',
        theme_color: '#f9a8d4',
        background_color: '#fff0f5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // skipWaiting handled by ReloadPrompt via updateServiceWorker(true)
        runtimeCaching: []
      }
    })
  ]
});
