import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Di produksi nginx yang mem-proxy /api. Untuk `npm run dev` / `preview`
// lokal, teruskan ke backend yang jalan di :3000.
const apiProxy = { '/api': 'http://localhost:3000' };

export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
});
