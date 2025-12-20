/**
 * Export Manager
 *
 * Main orchestration for the data export process
 */

import { fetchUser } from '@/lib/api/endpoints'
import {
  collectIndexedDBData,
  collectSettings,
  estimateExportSize as estimateSize,
} from './data-collectors'
import {
  downloadJsonFile,
  downloadCsvFile,
  calculateDataSize,
  generateExportFilename,
  generateLeechesFilename,
} from './file-utils'
import { detectLeeches } from '@/lib/calculations/leeches'
import type { ExportOptions, ExportData, ExportResult } from './export-types'

/**
 * Main export function - orchestrates the entire export process
 *
 * @param options - Export options specifying what to include
 * @param token - WaniKani API token
 * @param settingsStore - Zustand settings store
 * @param userStore - Zustand user store
 * @param onProgress - Optional callback for progress updates
 * @returns Export result with filename and size
 */
export async function exportUserData(
  options: ExportOptions,
  token: string,
  settingsStore: any,
  userStore: any,
  onProgress?: (message: string) => void
): Promise<ExportResult> {
  try {
    // Step 1: Fetch fresh user data for metadata
    onProgress?.('Gathering user information...')
    console.log('[EXPORT] Fetching user data...')

    const user = await fetchUser(token)
    console.log('[EXPORT] User data fetched:', user.username, 'Level', user.level)

    // Step 2: Collect data from IndexedDB
    onProgress?.('Reading local data...')
    console.log('[EXPORT] Collecting IndexedDB data...')

    const indexedDBData = await collectIndexedDBData(options)
    console.log('[EXPORT] IndexedDB data collected:', {
      subjects: indexedDBData.subjects?.length ?? 0,
      assignments: indexedDBData.assignments?.length ?? 0,
      reviewStatistics: indexedDBData.reviewStatistics?.length ?? 0,
      levelProgressions: indexedDBData.levelProgressions?.length ?? 0,
    })

    // Step 3: Collect settings
    onProgress?.('Collecting settings...')
    console.log('[EXPORT] Collecting settings...')

    const settings = collectSettings(options, settingsStore, userStore)

    // Step 4: Determine export type based on options
    const exportType = determineExportType(options)
    console.log('[EXPORT] Export type:', exportType)

    // Step 5: Build complete export structure
    const exportData: ExportData = {
      metadata: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        appVersion: import.meta.env.VITE_APP_VERSION || '2.3.0',
        username: user.username,
        level: user.level,
        exportType,
        options,
      },
      settings,
      data: indexedDBData,
    }

    // Step 6: Calculate actual size
    onProgress?.('Calculating file size...')
    const { formatted: sizeFormatted } = calculateDataSize(exportData)
    console.log('[EXPORT] Export size:', sizeFormatted)

    // Step 7: Generate filename
    const filename = generateExportFilename(user.username, exportType)
    console.log('[EXPORT] Filename:', filename)

    // Step 8: Trigger download
    onProgress?.('Downloading file...')
    console.log('[EXPORT] Triggering download...')

    downloadJsonFile(exportData, filename)

    console.log('[EXPORT] Export complete!')

    return {
      success: true,
      filename,
      size: sizeFormatted,
    }
  } catch (error) {
    console.error('[EXPORT] Export failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      filename: '',
      size: '',
      error: errorMessage,
    }
  }
}

/**
 * Determine the export type based on options
 *
 * @param options - Export options
 * @returns Export type classification
 */
function determineExportType(
  options: ExportOptions
): 'full' | 'progress' | 'settings' {
  const hasData =
    options.includeSubjects ||
    options.includeAssignments ||
    options.includeReviewStats ||
    options.includeLevelProgressions

  if (hasData && options.includeSettings) return 'full'
  if (hasData) return 'progress'
  return 'settings'
}

/**
 * Export leeches as CSV
 *
 * @param token - WaniKani API token
 * @param onProgress - Optional callback for progress updates
 * @param options - Export options (includeBurned)
 * @returns Export result with filename and count
 */
export async function exportLeeches(
  token: string,
  onProgress?: (message: string) => void,
  options?: { includeBurned?: boolean }
): Promise<ExportResult> {
  try {
    // Step 1: Fetch user data for filename
    onProgress?.('Gathering user information...')
    console.log('[EXPORT] Fetching user data for leeches export...')

    const user = await fetchUser(token)
    console.log('[EXPORT] User data fetched:', user.username)

    // Step 2: Collect data from IndexedDB
    onProgress?.('Reading local data...')
    console.log('[EXPORT] Collecting data for leech detection...')

    const indexedDBData = await collectIndexedDBData({
      includeSubjects: true,
      includeAssignments: true,
      includeReviewStats: true,
      includeLevelProgressions: false,
      includeSyncMetadata: false,
      includeSettings: false,
      includeApiToken: false,
    })

    if (
      !indexedDBData.subjects ||
      !indexedDBData.assignments ||
      !indexedDBData.reviewStatistics
    ) {
      throw new Error('Missing required data for leech detection')
    }

    // Step 3: Calculate leeches
    onProgress?.('Calculating leeches...')
    console.log('[EXPORT] Detecting leeches...')

    // Extract subjects with IDs
    const subjects = indexedDBData.subjects.map((s) => ({
      ...s.data,
      id: s.id,
    }))

    // Extract assignments and review stats from cached format
    const assignments = indexedDBData.assignments.map((a) => a.data)
    const reviewStats = indexedDBData.reviewStatistics.map((rs) => rs.data)

    const leeches = detectLeeches(reviewStats, subjects, assignments, {
      includeBurned: options?.includeBurned ?? false,
    })

    console.log('[EXPORT] Leeches detected:', leeches.length)

    if (leeches.length === 0) {
      return {
        success: false,
        filename: '',
        size: '',
        error: 'No leeches found to export',
      }
    }

    // Step 4: Convert to CSV format
    onProgress?.('Preparing CSV file...')

    // Define custom headers for better readability
    const csvHeaders = [
      'Character',
      'Meaning',
      'Type',
      'Level',
      'On\'yomi',
      'Kun\'yomi',
      'Reading',
      'Accuracy (%)',
      'Total Reviews',
      'Incorrect Count',
      'Severity',
      'Meaning Accuracy (%)',
      'Reading Accuracy (%)',
      'Current SRS Stage',
    ]

    // Map leeches to CSV rows
    const csvData = leeches.map((leech) => ({
      'Character': leech.character,
      'Meaning': leech.meaning,
      'Type': leech.type,
      'Level': leech.level,
      'On\'yomi': leech.type === 'kanji' ? leech.readings.onyomi.join(', ') : 'N/A',
      'Kun\'yomi': leech.type === 'kanji' ? leech.readings.kunyomi.join(', ') : 'N/A',
      'Reading': leech.type === 'vocabulary' ? leech.readings.vocabulary.join(', ') : 'N/A',
      'Accuracy (%)': leech.accuracy,
      'Total Reviews': leech.totalReviews,
      'Incorrect Count': leech.incorrectCount,
      'Severity': leech.severity,
      'Meaning Accuracy (%)': leech.meaningAccuracy,
      'Reading Accuracy (%)': leech.readingAccuracy,
      'Current SRS Stage': leech.currentSRS,
    }))

    // Step 5: Generate filename
    const filename = generateLeechesFilename(user.username)
    console.log('[EXPORT] Filename:', filename)

    // Step 6: Trigger download
    onProgress?.('Downloading CSV file...')
    console.log('[EXPORT] Triggering CSV download...')

    downloadCsvFile(csvData, filename, csvHeaders)

    console.log('[EXPORT] Leeches export complete!')

    return {
      success: true,
      filename,
      size: `${leeches.length} items`,
    }
  } catch (error) {
    console.error('[EXPORT] Leeches export failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      filename: '',
      size: '',
      error: errorMessage,
    }
  }
}

/**
 * Export the estimateExportSize function
 */
export { estimateSize as estimateExportSize }
