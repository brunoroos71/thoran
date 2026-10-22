import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Flags sem prefixo VITE_ (como pede o brief) também são expostas ao front.
  envPrefix: ['VITE_', 'WAITLIST_MODE', 'AGENT_MODE', 'BILLING_MODE'],
  // Em dev, cotações de B3/internacional vêm do Yahoo via proxy local (em produção: Edge Function market-data).
  server: {
    proxy: {
      '/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/yahoo/, ''),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      },
    },
  },
});
