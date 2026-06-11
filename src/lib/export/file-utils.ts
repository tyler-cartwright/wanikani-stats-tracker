/**
 * File Utilities
 *
 * Browser file download utilities for exporting data
 */

/**
 * Download data as a JSON file
 *
 * Creates a blob from the data, generates a download link, and triggers
 * the browser's download mechanism.
 *
 * @param data - The data to export (will be JSON stringified)
 * @param filename - The name of the file to download
 */
export function downloadJsonFile(data: any, filename: string): void {
  try {
    // Pretty-print JSON for human readability (2-space indentation)
    const json = JSON.stringify(data, null, 2)

    // Create blob with JSON MIME type
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })

    // Create object URL for the blob
    const url = URL.createObjectURL(blob)

    // Create temporary anchor element
    const link = document.createElement('a')
    link.href = url
    link.download = filename

    // Append to document (required for Firefox)
    document.body.appendChild(link)

    // Trigger download
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download file:', error)
    throw new Error('Failed to create download file')
  }
}

/**
 * Download an existing blob as a file (e.g. a share-card PNG)
 *
 * Same anchor/objectURL mechanism as the JSON/CSV helpers, for callers
 * that already have a Blob in hand.
 */
export function downloadBlobFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  // Append to document (required for Firefox)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate a filename for a share-card PNG
 *
 * Format: wanitrack-{kind}-{username}-{date}.png
 */
export function generateShareCardFilename(username: string, kind: string): string {
  const sanitizedUsername = username
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const date = new Date().toISOString().split('T')[0]

  return `wanitrack-${kind}-${sanitizedUsername}-${date}.png`
}

/**
 * Calculate the size of data when serialized to JSON
 *
 * @param data - The data to calculate size for
 * @returns Object with bytes and formatted string
 */
export function calculateDataSize(data: any): {
  bytes: number
  formatted: string
} {
  try {
    const json = JSON.stringify(data)
    const blob = new Blob([json])
    const bytes = blob.size

    let formatted: string
    if (bytes < 1024) {
      formatted = `${bytes} B`
    } else if (bytes < 1024 * 1024) {
      formatted = `${(bytes / 1024).toFixed(1)} KB`
    } else {
      formatted = `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return { bytes, formatted }
  } catch (error) {
    console.error('Failed to calculate data size:', error)
    return { bytes: 0, formatted: 'Unknown' }
  }
}

/**
 * Generate a filename for the export
 *
 * Format: wanikani-{exportType}-{username}-{date}.json
 * Example: wanikani-full-username-2025-12-02.json
 *
 * @param username - WaniKani username
 * @param exportType - Type of export (full, progress, settings)
 * @returns Generated filename
 */
export function generateExportFilename(
  username: string,
  exportType: 'full' | 'progress' | 'settings' | 'history'
): string {
  // Sanitize username (remove special characters, lowercase)
  const sanitizedUsername = username
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // Get current date in YYYY-MM-DD format
  const date = new Date().toISOString().split('T')[0]

  return `wanikani-${exportType}-${sanitizedUsername}-${date}.json`
}

/**
 * Download data as a CSV file
 *
 * Creates a CSV blob from array data and triggers browser download
 *
 * @param data - Array of objects to export as CSV
 * @param filename - The name of the file to download
 * @param headers - Optional custom headers (if not provided, uses object keys)
 */
export function downloadCsvFile(
  data: Record<string, any>[],
  filename: string,
  headers?: string[]
): void {
  try {
    if (data.length === 0) {
      throw new Error('No data to export')
    }

    // Determine headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0])

    // Create CSV content
    const csvRows: string[] = []

    // Add header row
    csvRows.push(csvHeaders.map((header) => escapeCSVValue(header)).join(','))

    // Add data rows
    for (const row of data) {
      const values = csvHeaders.map((header) => {
        const value = row[header]
        return escapeCSVValue(value)
      })
      csvRows.push(values.join(','))
    }

    const csvContent = csvRows.join('\n')

    // Create blob with CSV MIME type
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // Create object URL for the blob
    const url = URL.createObjectURL(blob)

    // Create temporary anchor element
    const link = document.createElement('a')
    link.href = url
    link.download = filename

    // Append to document (required for Firefox)
    document.body.appendChild(link)

    // Trigger download
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download CSV file:', error)
    throw new Error('Failed to create CSV download file')
  }
}

/**
 * Escape CSV value to handle commas, quotes, and newlines
 *
 * @param value - The value to escape
 * @returns Escaped CSV value
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Generate a filename for CSV export
 *
 * Format: wanikani-leeches-{username}-{date}.csv
 *
 * @param username - WaniKani username
 * @returns Generated filename
 */
export function generateLeechesFilename(username: string): string {
  // Sanitize username (remove special characters, lowercase)
  const sanitizedUsername = username
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // Get current date in YYYY-MM-DD format
  const date = new Date().toISOString().split('T')[0]

  return `wanikani-leeches-${sanitizedUsername}-${date}.csv`
}
