import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/jpegr/',
  css: {
    postcss: {
      plugins: [autoprefixer, cssnano],
    },
  },
  plugins: [
    react(),
    legacy({
      targets: ['> 0%'],
      polyfills: true,
    }),
  ],
  server: {
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
  optimizeDeps: {
    force: true,
  },
});
