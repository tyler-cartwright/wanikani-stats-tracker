export function Settings() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-semibold text-ink-100 dark:text-paper-100">
        Settings
      </h1>

      {/* Coming Soon Placeholder */}
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm relative min-h-[400px]">
        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 bg-paper-200/80 dark:bg-ink-200/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-6">
            <div className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-2">
              Coming Soon
            </div>
            <div className="text-sm text-ink-400 dark:text-paper-300">
              Settings page is under development
            </div>
          </div>
        </div>

        {/* Placeholder content (hidden behind overlay) */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
              Display & Appearance
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-paper-300 dark:bg-ink-300 rounded-md">
                <span className="text-sm text-ink-100 dark:text-paper-100">Theme</span>
                <span className="text-sm text-ink-400 dark:text-paper-300">Auto</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
              Data & Privacy
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-paper-300 dark:bg-ink-300 rounded-md">
                <span className="text-sm text-ink-100 dark:text-paper-100">API Token</span>
                <span className="text-sm text-ink-400 dark:text-paper-300">••••••••</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
