import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': new URL('./src/components/', import.meta.url).pathname,
      '@data': new URL('./src/data/', import.meta.url).pathname,
      '@state': new URL('./src/state/', import.meta.url).pathname,
      '@utils': new URL('./src/utils/', import.meta.url).pathname,
      '@types': new URL('./src/types/', import.meta.url).pathname,
    },
  },
});


