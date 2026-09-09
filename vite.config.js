import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const isCloudflarePages = process.env.CF_PAGES === '1'

export default defineConfig({
  base: isCloudflarePages ? '/soka-good-fortune/' : '/soka-cookie/',
  build: isCloudflarePages
    ? { outDir: 'dist/soka-good-fortune' }
    : undefined,
  plugins: [vue()],
})
