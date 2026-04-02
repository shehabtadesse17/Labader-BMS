import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Labader-BMS/', // Matches the repository name for GitHub Pages
  server: {
    host: true,
    allowedHosts: true, // Allows ngrok to connect without security warnings
    port: 5173,
  },
})