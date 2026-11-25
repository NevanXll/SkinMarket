import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { proxy: {
    '/api/v1/products': 'http://localhost:8082',
    '/api/v1/admin/orders': 'http://localhost:8083',
    '/api/v1/seller/orders': 'http://localhost:8083',
    '/api/v1/cart': 'http://localhost:8083',
    '/api/v1/orders': 'http://localhost:8083',
    '/api/v1/inventory': 'http://localhost:8083',
    '/api/v1/wallet': 'http://localhost:8083',
    '/api/v1': 'http://localhost:8081',
  } },
});
