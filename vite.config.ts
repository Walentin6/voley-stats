import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Configuración de Vite (servidor de desarrollo y compilación)
// y de Vitest (pruebas automáticas).
export default defineConfig({
  plugins: [
    react(),
    // Convierte la app en una PWA: se puede instalar y funciona sin internet.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'VoleyStats',
        short_name: 'VoleyStats',
        description: 'Scouting y estadísticas de vóley en vivo',
        lang: 'es',
        theme_color: '#1d4ed8',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
