import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pablos-3d-resume/',
  plugins: [react(), tailwindcss()],
})