import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/RegioniItalia/' : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
}))
