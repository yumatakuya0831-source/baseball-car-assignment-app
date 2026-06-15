import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/chouseisan-proxy": {
        target: "https://chouseisan.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/chouseisan-proxy/, ""),
      },
    },
  },
})
