// Setup Page - For unauthenticated users
import { Flame, ExternalLink } from 'lucide-react'
import { APITokenInput } from '@/components/settings/api-token-input'
import { JapaneseLabel } from '@/components/shared/japanese-label'

export function Setup() {
  return (
    <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Flame className="w-12 h-12 text-vermillion-500" />
            <h1 className="text-4xl font-display font-semibold text-ink-100 dark:text-paper-100">
              WaniTrack
            </h1>
          </div>
          <JapaneseLabel text="統計" className="text-center opacity-70" />
          <p className="text-lg text-ink-400 dark:text-paper-300 max-w-md mx-auto">
            A study companion for WaniKani. Track your progress, identify problem areas, and
            forecast your journey to level 60.
          </p>
        </div>

        {/* Token Input Card */}
        <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-8 shadow-md">
          <h2 className="text-xl font-display font-semibold text-ink-100 dark:text-paper-100 mb-6">
            Connect Your Account
          </h2>
          <APITokenInput />
        </div>

        {/* Help Card */}
        <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-ink-100 dark:text-paper-100 mb-3">
            How to get your API token:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-ink-400 dark:text-paper-300">
            <li>
              Visit{' '}
              <a
                href="https://www.wanikani.com/settings/personal_access_tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-vermillion-500 dark:text-vermillion-400 hover:underline inline-flex items-center gap-1"
              >
                WaniKani Settings → API Tokens
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Click "Generate a new token"</li>
            <li>Give it a name (e.g., "WaniTrack")</li>
            <li>Ensure it has "Read" permissions</li>
            <li>Copy the token and paste it above</li>
          </ol>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-center text-ink-400 dark:text-paper-300">
          Your API token is stored locally in your browser and never sent to any third-party
          servers. All data fetching happens directly between your browser and WaniKani's API.
        </p>
      </div>
    </div>
  )
}
