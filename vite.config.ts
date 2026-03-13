import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // 修正：显式设置部署的子路径名
  base: '/dashboard-src/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
