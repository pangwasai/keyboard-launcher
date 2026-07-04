import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    electron([
      { entry: 'electron/main.js', vite: { build: { outDir: 'dist-electron', rollupOptions: { external: ['electron'] } } } },
      { entry: 'electron/preload.js', onstart(options) { options.reload() }, vite: { build: { outDir: 'dist-electron', rollupOptions: { external: ['electron'] } } } },
      { entry: 'electron/screenshot.js', vite: { build: { outDir: 'dist-electron', rollupOptions: { external: ['electron'] } } } },
      { entry: 'electron/screenshot-preload.js', vite: { build: { outDir: 'dist-electron', rollupOptions: { external: ['electron'] } } } }
    ])
  ],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173 }
})
