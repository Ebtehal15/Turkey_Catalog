import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Vite proxy sadece development'ta çalışır
  // Production'da frontend doğrudan VITE_API_BASE_URL ile backend'e bağlanır
  const API_URL = env.VITE_API_BASE_URL || 'http://localhost:4000';
  // Varsayılan dev portu 5173, istenirse VITE_DEV_PORT veya PORT ile override edilebilir
  const DEV_PORT = Number(env.VITE_DEV_PORT || env.PORT || 5173);

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Dış IP'lerden erişilebilir yap
      port: DEV_PORT,
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('Proxying request:', req.method, req.url, 'to', API_URL);
            });
          },
        },
        '/uploads': {
          target: API_URL,
          changeOrigin: true,
        },
      },
    },
  };
});


















