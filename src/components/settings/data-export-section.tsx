/**
 * Data Export Section
 *
 * UI component for the Settings page that allows users to export their data
 */

import { useState, useEffect } from 'react'
import { Download, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useExportStore } from '@/stores/export-store'
import { useUserStore } from '@/stores/user-store'
import { useSettingsStore } from '@/stores/settings-store'
import {
  exportUserData,
  exportLeeches,
  estimateExportSize,
} from '@/lib/export/export-manager'
import { InfoTooltip } from '@/components/shared/info-tooltip'
import { useToast } from '@/hooks/use-toast'

export function DataExportSection() {
  const token = useUserStore((state) => state.token)
  const settingsStore = useSettingsStore()
  const userStore = useUserStore()

  const {
    defaultOptions,
    setDefaultOptions,
    lastExportAt,
    isExporting,
    setExporting,
    setExportError,
    recordExport,
  } = useExportStore()

  const { showToast, ToastContainer } = useToast()
  const [estimatedSize, setEstimatedSize] = useState<string>('Calculating...')
  const [isExportingLeeches, setIsExportingLeeches] = useState(false)

  // Update size estimate when options change
  useEffect(() => {
    const updateSizeEstimate = async () => {
      const size = await estimateExportSize(defaultOptions)
      setEstimatedSize(size)
    }
    updateSizeEstimate()
  }, [defaultOptions])

  // Check if any JSON export options are selected
  const hasJsonOptionsSelected =
    defaultOptions.includeSubjects ||
    defaultOptions.includeAssignments ||
    defaultOptions.includeReviewStats ||
    defaultOptions.includeLevelProgressions ||
    defaultOptions.includeSettings

  const handleJsonExport = async () => {
    if (!token) {
      showToast({
        message: 'No API token found. Please authenticate first.',
        type: 'error',
      })
      return
    }

    if (!hasJsonOptionsSelected && !defaultOptions.includeApiToken) {
      showToast({
        message: 'Please select at least one option to export.',
        type: 'error',
      })
      return
    }

    try {
      setExporting(true, 'Preparing export...')

      const result = await exportUserData(
        defaultOptions,
        token,
        settingsStore,
        userStore,
        (message) => setExporting(true, message)
      )

      if (result.success) {
        recordExport()
        showToast({
          message: `Export successful! File: ${result.filename} (${result.size})`,
          type: 'success',
          duration: 5000,
        })
      } else {
        setExportError(result.error || 'Unknown error')
        showToast({
          message: `Export failed: ${result.error || 'Unknown error'}`,
          type: 'error',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed'
      setExportError(message)
      showToast({
        message: `Export failed: ${message}`,
        type: 'error',
      })
    }
  }

  const handleLeechExport = async () => {
    if (!token) {
      showToast({
        message: 'No API token found. Please authenticate first.',
        type: 'error',
      })
      return
    }

    try {
      setIsExportingLeeches(true)

      const result = await exportLeeches(
        token,
        (message) => {
          // Optional: could show progress
          console.log('[LEECH EXPORT]', message)
        },
        { includeBurned: settingsStore.includeBurnedLeeches }
      )

      if (result.success) {
        showToast({
          message: `Leeches exported! File: ${result.filename} (${result.size})`,
          type: 'success',
          duration: 5000,
        })
      } else {
        showToast({
          message: `Leech export failed: ${result.error || 'Unknown error'}`,
          type: 'error',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Leech export failed'
      showToast({
        message: `Leech export failed: ${message}`,
        type: 'error',
      })
    } finally {
      setIsExportingLeeches(false)
    }
  }

  const handleOptionChange = (
    key: keyof typeof defaultOptions,
    value: boolean
  ) => {
    setDefaultOptions({ [key]: value })
  }

  return (
    <>
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
          Backup & Export
        </h2>

        <div className="space-y-6">
          {/* Description */}
          <p className="text-sm text-ink-400 dark:text-paper-300">
            Export your learning data for backup or analysis. WaniKani data is
            exported as JSON format.
          </p>

          {/* JSON Export Section */}
          <div className="space-y-4 pb-4 border-b border-paper-300 dark:border-ink-300">
            <h3 className="text-sm font-medium text-ink-100 dark:text-paper-100">
              WaniKani Data (JSON)
            </h3>

            {/* Export Options */}
            <div className="space-y-3">
              {/* Checkbox grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Subjects */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultOptions.includeSubjects}
                    onChange={(e) =>
                      handleOptionChange('includeSubjects', e.target.checked)
                    }
                    className="w-4 h-4 rounded border-paper-300 dark:border-ink-300 mt-0.5"
                    disabled={isExporting}
                  />
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-sm text-ink-100 dark:text-paper-100">
                      Subjects (kanji, vocab, radicals)
                    </span>
                    <InfoTooltip content="All item data including meanings, readings, and mnemonics (~10 MB)" />
                  </div>
                </label>

                {/* Assignments */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultOptions.includeAssignments}
                    onChange={(e) =>
                      handleOptionChange('includeAssignments', e.target.checked)
                    }
                    className="w-4 h-4 rounded border-paper-300 dark:border-ink-300 mt-0.5"
                    disabled={isExporting}
                  />
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-sm text-ink-100 dark:text-paper-100">
                      Assignments (your progress)
                    </span>
                    <InfoTooltip content="Your SRS stage and dates for each item" />
                  </div>
                </label>

                {/* Review Stats */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultOptions.includeReviewStats}
                    onChange={(e) =>
                      handleOptionChange('includeReviewStats', e.target.checked)
                    }
                    className="w-4 h-4 rounded border-paper-300 dark:border-ink-300 mt-0.5"
                    disabled={isExporting}
                  />
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-sm text-ink-100 dark:text-paper-100">
                      Review Statistics (accuracy)
                    </span>
                    <InfoTooltip content="Your correct/incorrect counts and accuracy data" />
                  </div>
                </label>

                {/* Level Progressions */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultOptions.includeLevelProgressions}
                    onChange={(e) =>
                      handleOptionChange(
                        'includeLevelProgressions',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 rounded border-paper-300 dark:border-ink-300 mt-0.5"
                    disabled={isExporting}
                  />
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-sm text-ink-100 dark:text-paper-100">
                      Level Progressions (history)
                    </span>
                    <InfoTooltip content="Your level completion timestamps" />
                  </div>
                </label>

                {/* Settings */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultOptions.includeSettings}
                    onChange={(e) =>
                      handleOptionChange('includeSettings', e.target.checked)
                    }
                    className="w-4 h-4 rounded border-paper-300 dark:border-ink-300 mt-0.5"
                    disabled={isExporting}
                  />
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-sm text-ink-100 dark:text-paper-100">
                      App Settings (preferences)
                    </span>
                    <InfoTooltip content="Your theme, display options, and calculation preferences" />
                  </div>
                </label>
              </div>

              {/* API Token Warning */}
              <div className="pt-2 border-t border-paper-300 dark:border-ink-300">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultOptions.includeApiToken}
                    onChange={(e) =>
                      handleOptionChange('includeApiToken', e.target.checked)
                    }
                    className="w-4 h-4 rounded border-paper-300 dark:border-ink-300 mt-0.5"
                    disabled={isExporting}
                  />
                  <div className="flex-1">
                    <span className="text-sm text-ink-100 dark:text-paper-100 font-medium">
                      Include API Token
                    </span>
                    <div className="flex items-start gap-2 mt-1">
                      <AlertCircle className="w-4 h-4 text-vermillion-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-vermillion-600 dark:text-vermillion-400">
                        Warning: Your API token grants full access to your
                        WaniKani account. Only include this if you need to restore
                        authentication on another device. Keep exported files
                        secure.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* JSON Export Button */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleJsonExport}
                disabled={isExporting || !hasJsonOptionsSelected}
                className="inline-flex items-center gap-2 px-4 py-2 bg-vermillion-500 text-paper-100 rounded-md font-medium hover:bg-vermillion-600 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-paper-100 border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export WaniKani Data
                  </>
                )}
              </button>
              {!hasJsonOptionsSelected && (
                <p className="text-xs text-vermillion-600 dark:text-vermillion-400">
                  Please select at least one option to export
                </p>
              )}
            </div>

            {/* Size Estimate */}
            <p className="text-xs text-ink-400 dark:text-paper-300">
              Estimated file size: {estimatedSize}
            </p>

            {/* Last Export Info */}
            {lastExportAt && (
              <p className="text-xs text-ink-400 dark:text-paper-300">
                Last exported{' '}
                {formatDistanceToNow(new Date(lastExportAt), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>

          {/* Leech Export Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-ink-100 dark:text-paper-100">
              Leech Analysis (CSV)
            </h3>

            <p className="text-sm text-ink-400 dark:text-paper-300">
              Export your problem items for analysis in spreadsheet applications.
              Leeches are items with low accuracy that may need extra attention.
              {settingsStore.includeBurnedLeeches
                ? ' Includes burned items.'
                : ' Excludes burned items.'}
            </p>

            <button
              onClick={handleLeechExport}
              disabled={isExportingLeeches}
              className="inline-flex items-center gap-2 px-4 py-2 border border-paper-300 dark:border-ink-300 text-ink-100 dark:text-paper-100 rounded-md font-medium hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingLeeches ? (
                <>
                  <div className="w-4 h-4 border-2 border-ink-100 dark:border-paper-100 border-t-transparent rounded-full animate-spin" />
                  Exporting Leeches...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Leeches (CSV)
                </>
              )}
            </button>

            <p className="text-xs text-ink-400 dark:text-paper-300">
              CSV format with columns: Character, Meaning, Type, Level, Accuracy,
              Total Reviews, Incorrect Count, Severity, and more.
            </p>
          </div>
        </div>
      </div>
      {ToastContainer}
    </>
  )
}
