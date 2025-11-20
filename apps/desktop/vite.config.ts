import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@desktop': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      external: ['electron'],
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
