import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Dynamically determine base path from repository
const getBasePath = () => {
  if (process.env.NODE_ENV !== 'production') return '/'

  // Try to get from GITHUB_REPOSITORY env var (format: owner/repo)
  const githubRepo = process.env.GITHUB_REPOSITORY
  if (githubRepo) {
    const repoName = githubRepo.split('/')[1]
    return `/${repoName}/`
  }

  // Fallback to reading from package.json directory name
  const dirName = path.basename(process.cwd())
  return `/${dirName}/`
}

const base = getBasePath()

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'WaniTrack',
        short_name: 'WaniTrack',
        description: 'Track your WaniKani progress with beautiful statistics and insights',
        theme_color: '#E63946',
        background_color: '#FAF9F6',
        display: 'standalone',
        start_url: base,
        icons: [
          {
            src: `${base}icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `${base}icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.wanikani\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'wanikani-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
