import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // A malha territorial (src/lib/brasilMalhaUf.json, ~176 KB) entra no bundle
  // como JSON.parse de uma string em vez de literal de objeto: o parser de JSON
  // do V8 é bem mais rápido nesse volume que a avaliação de um literal com
  // ~9 mil números, e o mapa monta sem travar a thread principal.
  json: {
    stringify: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
