// Setup Page - Landing page for unauthenticated users
import {
  Flame,
  ExternalLink,
  LayoutDashboard,
  TrendingUp,
  Target,
  Bug,
  CalendarDays,
  BookOpen,
  Key,
  ClipboardList,
  BarChart2,
  Shield,
  Github,
} from 'lucide-react'
import { APITokenInput } from '@/components/settings/api-token-input'
import { JapaneseLabel } from '@/components/shared/japanese-label'

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description:
      'Get an at-a-glance overview of your WaniKani stats — SRS stage breakdown, level progress, and upcoming reviews.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description:
      'Visualize your level progression over time and see how your review velocity is trending.',
  },
  {
    icon: Target,
    title: 'Accuracy Analysis',
    description:
      'Break down your accuracy by item type (radicals, kanji, vocabulary) and separate reading vs. meaning performance.',
  },
  {
    icon: Bug,
    title: 'Leech Detection',
    description:
      'Identify your most troublesome items — the leeches that keep coming back — so you can focus your study.',
  },
  {
    icon: CalendarDays,
    title: 'Forecast',
    description:
      'Predict your journey to level 60 with a workload forecast and deterministic level-up estimates.',
  },
  {
    icon: BookOpen,
    title: 'Kanji & JLPT Readiness',
    description:
      'Track kanji mastery across all WaniKani levels and see how close you are to each JLPT tier.',
  },
]

const steps = [
  {
    step: '1',
    icon: Key,
    title: 'Get your API token',
    description:
      'Visit WaniKani Settings → API Tokens and generate a read-only personal access token.',
  },
  {
    step: '2',
    icon: ClipboardList,
    title: 'Paste it below',
    description:
      "Enter your token in the form below. It's stored only in your browser — nothing is sent to any server.",
  },
  {
    step: '3',
    icon: BarChart2,
    title: 'See your stats',
    description:
      "WaniTrack fetches your data directly from WaniKani's API and renders detailed statistics instantly.",
  },
]

export function Setup() {
  return (
    <div className="min-h-screen bg-paper-100 dark:bg-ink-100">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">
        {/* Hero */}
        <section className="text-center space-y-5">
          <div className="flex items-center justify-center gap-3">
            <Flame className="w-12 h-12 text-vermillion-500" />
            <h1 className="text-4xl font-display font-semibold text-ink-100 dark:text-paper-100">
              WaniTrack
            </h1>
          </div>
          <JapaneseLabel text="統計" className="text-center opacity-70" />
          <p className="text-xl font-display text-ink-300 dark:text-paper-200">
            WaniKani Statistics Dashboard
          </p>
          <p className="text-lg text-ink-400 dark:text-paper-300 max-w-2xl mx-auto">
            Detailed statistics and insights for your WaniKani journey. Track accuracy, find
            leeches, forecast your progress to level 60, and more.
          </p>
          <div className="pt-2">
            <a
              href="#connect"
              className="inline-block px-6 py-3 rounded-md bg-vermillion-500 text-white font-medium hover:bg-vermillion-600 transition-colors"
            >
              Connect Your Account
            </a>
          </div>
        </section>

        {/* Feature Showcase */}
        <section>
          <h2 className="text-2xl font-display font-semibold text-ink-100 dark:text-paper-100 text-center mb-8">
            Everything you need to understand your WaniKani journey
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm"
              >
                <Icon className="w-6 h-6 text-vermillion-500 mb-3" />
                <h3 className="font-display font-semibold text-ink-100 dark:text-paper-100 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-ink-400 dark:text-paper-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-2xl font-display font-semibold text-ink-100 dark:text-paper-100 text-center mb-2">
            How it works
          </h2>
          <p className="text-center text-sm text-ink-400 dark:text-paper-300 mb-10 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-vermillion-500 shrink-0" />
            Runs entirely in your browser. No server, no cookies, no personal data collected.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="text-center space-y-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-vermillion-500/10 border border-vermillion-500/30 mx-auto">
                  <span className="text-vermillion-500 font-display font-semibold text-lg">
                    {step}
                  </span>
                </div>
                <Icon className="w-5 h-5 text-vermillion-500 mx-auto" />
                <h3 className="font-display font-semibold text-ink-100 dark:text-paper-100">
                  {title}
                </h3>
                <p className="text-sm text-ink-400 dark:text-paper-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Connect Your Account */}
        <section id="connect" className="max-w-2xl mx-auto space-y-6">
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
        </section>

        {/* Footer */}
        <footer className="text-center space-y-3 pb-4">
          <p className="text-xs text-ink-400 dark:text-paper-300">
            Your API token is stored locally in your browser and never sent to any third-party
            servers. All data fetching happens directly between your browser and WaniKani's API.
          </p>
          <a
            href="https://github.com/tyler-cartwright/wanikani-stats-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100 transition-colors"
          >
            <Github className="w-4 h-4" />
            View on GitHub
          </a>
        </footer>
      </div>
    </div>
  )
}
