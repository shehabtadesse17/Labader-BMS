import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are loaded correctly on GitHub Pages
  server: {
    host: true,
    allowedHosts: true, // Allows ngrok to connect without security warnings
    port: 5173,
  },
})