import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // listen on all interfaces so the tunnel can reach it
    allowedHosts: [
      'quentin-plastered-worriedly.ngrok-free.dev',
      '.ngrok-free.dev', // allow any ngrok-free.dev subdomain
    ],
  },
})
