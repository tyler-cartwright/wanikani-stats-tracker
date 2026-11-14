import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { execSync } from 'child_process'
import packageJson from './package.json'

// Dynamically determine base path from repository
const getBasePath = () => {
  if (process.env.NODE_ENV !== 'production') return '/'

  // If using custom domain (CNAME file exists), use root path
  // Otherwise, use repository name for GitHub Pages subdirectory hosting
  if (process.env.VITE_CUSTOM_DOMAIN === 'true') {
    return '/'
  }

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

// Short commit SHA of this build: GITHUB_SHA in Actions, git locally, 'dev'
// if neither is available. Shown next to the version so bug reports and
// exports pin the exact build.
const getBuildSha = () => {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'dev'
  }
}

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.VITE_BUILD_SHA': JSON.stringify(getBuildSha()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'WaniTrack',
        short_name: 'WaniTrack',
        version: packageJson.version,
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
        // No runtime caching of API calls - always fetch fresh data
        // This ensures syncs always get current data from WaniKani API
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
