import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/components'),
      '@data': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/data'),
      '@state': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/state'),
      '@utils': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/utils'),
      '@types': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/types'),
    },
  },
});


