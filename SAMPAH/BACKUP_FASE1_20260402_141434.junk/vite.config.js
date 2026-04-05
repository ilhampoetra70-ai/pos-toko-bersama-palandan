import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-renderer',
    emptyOutDir: true,
    // Optimizations for smaller bundle
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          xlsx: ['xlsx'],
          barcode: ['@ericblade/quagga2', 'jsbarcode'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 6173,
    strictPort: true,
    host: '127.0.0.1'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
