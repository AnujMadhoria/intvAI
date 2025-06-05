import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
   server: {
    // allow requests from Ngrok tunnel
    allowedHosts: [
      '7136-103-170-68-99.ngrok-free.app'
    ],
  }
})
