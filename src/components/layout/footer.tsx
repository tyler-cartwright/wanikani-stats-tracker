import { Github } from 'lucide-react'
import packageJson from '../../../package.json'

export function Footer() {
  return (
    <footer className="border-t border-paper-300 dark:border-ink-300 bg-paper-200 dark:bg-ink-200">
      <div className="container mx-auto px-8 py-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-400 dark:text-paper-300">
          <div className="flex items-center gap-2">
            <span>WaniTrack</span>
            <span className="opacity-50">·</span>
            <span className="opacity-70">v{packageJson.version}</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/tyler-cartwright/wanikani-stats-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-ink-100 dark:hover:text-paper-100 transition-smooth"
            >
              <Github className="w-4 h-4" />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
