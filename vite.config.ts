import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:8080',
      '/crbEmss': 'http://localhost:8080',
      '/crbAbsorption': 'http://localhost:8080',
      '/geoserver': 'http://localhost:8090',
    },
  },
})
