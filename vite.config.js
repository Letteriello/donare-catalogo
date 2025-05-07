import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api/olist': {
        target: 'https://api.olist.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/olist/, '')
      },
      '/api/tiny': {
        target: 'https://erp.tiny.com.br/webhook/api/v1/parceiro/8471',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tiny/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
}) 