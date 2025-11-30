// API Token Input Component
import { useState } from 'react'
import { Check, X, Loader2, ExternalLink } from 'lucide-react'
import { validateToken } from '@/lib/api/client'
import { fetchUser } from '@/lib/api/endpoints'
import { useUserStore } from '@/stores/user-store'
import { useConfirm } from '@/hooks/use-confirm'

export function APITokenInput() {
  const [token, setToken] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const { setToken: saveToken, setUser, clearAuth } = useUserStore()
  const storedToken = useUserStore((state) => state.token)
  const user = useUserStore((state) => state.user)
  const { confirm, ConfirmDialog } = useConfirm()

  const handleValidate = async () => {
    if (!token.trim()) {
      setErrorMessage('Please enter an API token')
      setValidationStatus('error')
      return
    }

    setValidating(true)
    setValidationStatus('idle')
    setErrorMessage('')

    try {
      // Validate token and fetch user data
      const isValid = await validateToken(token.trim())

      if (isValid) {
        const userData = await fetchUser(token.trim())

        // Save to store
        saveToken(token.trim())
        setUser(userData)

        setValidationStatus('success')
        setToken('') // Clear input after successful save
      } else {
        setValidationStatus('error')
        setErrorMessage('Invalid API token')
      }
    } catch (error) {
      setValidationStatus('error')
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Failed to validate token')
      }
    } finally {
      setValidating(false)
    }
  }

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Clear Token & Log Out?',
      message: 'This will clear your API token and all locally cached data.',
      confirmText: 'Clear & Log Out',
      cancelText: 'Cancel',
      variant: 'warning',
    })

    if (confirmed) {
      clearAuth()
      setValidationStatus('idle')
      setErrorMessage('')
    }
  }

  if (storedToken && user) {
    // User is authenticated
    return (
      <div className="space-y-4">
        <div className="p-4 bg-patina-500/10 dark:bg-patina-500/20 border border-patina-500/20 dark:border-patina-500/30 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Check className="w-5 h-5 text-patina-500 dark:text-patina-400" />
            <span className="font-semibold text-ink-100 dark:text-paper-100">
              Authenticated
            </span>
          </div>
          <div className="text-sm text-ink-400 dark:text-paper-300">
            <div>Username: <span className="font-medium text-ink-100 dark:text-paper-100">{user.username}</span></div>
            <div>Level: <span className="font-medium text-ink-100 dark:text-paper-100">{user.level}</span></div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm rounded-md border border-paper-300 dark:border-ink-300 bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth"
        >
          Clear Token & Log Out
        </button>
        {ConfirmDialog}
      </div>
    )
  }

  // Not authenticated - show input
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink-100 dark:text-paper-100">
          WaniKani API Token
        </label>
        <p className="text-xs text-ink-400 dark:text-paper-300">
          Get your API token from{' '}
          <a
            href="https://www.wanikani.com/settings/personal_access_tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-vermillion-500 dark:text-vermillion-400 hover:underline inline-flex items-center gap-1"
          >
            WaniKani Settings
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !validating) {
              handleValidate()
            }
          }}
          placeholder="Enter your API token..."
          className="w-full px-4 py-2 text-sm rounded-md border border-paper-300 dark:border-ink-300 bg-paper-100 dark:bg-ink-100 text-ink-100 dark:text-paper-100 placeholder:text-ink-400 dark:placeholder:text-paper-400 focus:outline-none focus:ring-2 focus:ring-vermillion-500 dark:focus:ring-vermillion-400"
          disabled={validating}
        />

        <button
          onClick={handleValidate}
          disabled={validating || !token.trim()}
          className="w-full px-4 py-2 text-sm font-medium rounded-md bg-vermillion-500 dark:bg-vermillion-400 text-paper-100 dark:text-ink-100 hover:bg-vermillion-600 dark:hover:bg-vermillion-500 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth flex items-center justify-center gap-2"
        >
          {validating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Validating...
            </>
          ) : (
            'Validate & Save Token'
          )}
        </button>
      </div>

      {/* Validation feedback */}
      {validationStatus === 'success' && (
        <div className="p-3 bg-patina-500/10 dark:bg-patina-500/20 border border-patina-500/20 dark:border-patina-500/30 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-patina-500 dark:text-patina-400" />
          <span className="text-sm text-ink-100 dark:text-paper-100">
            Token validated successfully!
          </span>
        </div>
      )}

      {validationStatus === 'error' && (
        <div className="p-3 bg-vermillion-500/10 dark:bg-vermillion-500/20 border border-vermillion-500/20 dark:border-vermillion-500/30 rounded-lg flex items-start gap-2">
          <X className="w-4 h-4 text-vermillion-500 dark:text-vermillion-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-ink-100 dark:text-paper-100">
            {errorMessage || 'Failed to validate token'}
          </div>
        </div>
      )}
      {ConfirmDialog}
    </div>
  )
}
