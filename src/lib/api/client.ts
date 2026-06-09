// WaniKani API v2 Client
// Handles authentication, pagination, rate limiting, and error handling

import type { Collection, APIError } from './types'

// ============================================================================
// Constants
// ============================================================================

const BASE_URL = 'https://api.wanikani.com/v2'

// Rate limiting: WaniKani allows 60 requests per minute
// We'll be conservative and limit to 1 request per second (60/min)
const MIN_REQUEST_INTERVAL = 1000 // milliseconds

// 429 handling
const MAX_RATE_LIMIT_RETRIES = 3
const DEFAULT_RETRY_AFTER_MS = 2000

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private nextSlotTime = 0

  async waitIfNeeded(): Promise<void> {
    // Reserve the next available slot synchronously (no await between read
    // and write), so concurrent callers each get a distinct slot instead of
    // racing on a shared "last request" timestamp.
    const now = Date.now()
    const slot = Math.max(now, this.nextSlotTime)
    this.nextSlotTime = slot + MIN_REQUEST_INTERVAL

    if (slot > now) {
      await new Promise(resolve => setTimeout(resolve, slot - now))
    }
  }

  /** Push all pending slots back, e.g. after the server tells us to slow down. */
  backOff(durationMs: number): void {
    this.nextSlotTime = Math.max(this.nextSlotTime, Date.now() + durationMs)
  }
}

const rateLimiter = new RateLimiter()

/**
 * Parse a Retry-After header (delay-seconds or HTTP-date) into milliseconds
 */
function parseRetryAfter(header: string | null): number {
  if (header) {
    const seconds = Number(header)
    if (Number.isFinite(seconds) && seconds >= 0) {
      return seconds * 1000
    }
    const date = Date.parse(header)
    if (!Number.isNaN(date) && date > Date.now()) {
      return date - Date.now()
    }
  }
  return DEFAULT_RETRY_AFTER_MS
}

// ============================================================================
// API Client
// ============================================================================

export class WaniKaniAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: number
  ) {
    super(message)
    this.name = 'WaniKaniAPIError'
  }
}

/**
 * Make an authenticated request to the WaniKani API
 */
export async function apiRequest<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`

  for (let attempt = 0; ; attempt++) {
    // Wait if needed to respect rate limits
    await rateLimiter.waitIfNeeded()

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Wanikani-Revision': '20170710', // API revision date
        },
      })

      if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        const retryAfterMs = parseRetryAfter(response.headers.get('Retry-After'))
        console.warn(
          `WaniKani rate limit hit (429); retrying in ${retryAfterMs}ms (attempt ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})`
        )
        rateLimiter.backOff(retryAfterMs)
        continue
      }

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`
        let errorCode: number | undefined

        try {
          const errorData: APIError = await response.json()
          errorMessage = errorData.error || errorMessage
          errorCode = errorData.code
        } catch {
          // If we can't parse the error response, use the default message
        }

        throw new WaniKaniAPIError(errorMessage, response.status, errorCode)
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      if (error instanceof WaniKaniAPIError) {
        throw error
      }

      // Network errors or other issues
      throw new WaniKaniAPIError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0
      )
    }
  }
}

export interface PaginatedFetchResult<T> {
  data: (T & { id: number })[]
  /**
   * The collection's data_updated_at: the server-side timestamp of the most
   * recently updated resource in the collection (null when the collection is
   * empty). Use this as the next delta sync's updated_after cursor.
   */
  dataUpdatedAt: string | null
}

/**
 * Fetch all pages of a paginated collection, plus the collection's
 * data_updated_at timestamp
 * WaniKani uses cursor-based pagination with next_url
 * Returns data with id merged in for easier access
 */
export async function fetchAllPagesWithMeta<T>(
  initialEndpoint: string,
  token: string,
  onProgress?: (current: number, total: number) => void
): Promise<PaginatedFetchResult<T>> {
  const allData: (T & { id: number })[] = []
  let dataUpdatedAt: string | null = null
  let nextUrl: string | null = initialEndpoint

  while (nextUrl) {
    const collection: Collection<T> = await apiRequest<Collection<T>>(nextUrl, token)

    // Extract data from resources and merge in the id field
    const pageData = collection.data.map((resource) => ({
      ...resource.data,
      id: resource.id,
    }))
    allData.push(...pageData)

    // Keep the latest data_updated_at seen across pages (ISO 8601 UTC
    // strings, so lexicographic comparison is chronological)
    if (collection.data_updated_at &&
        (!dataUpdatedAt || collection.data_updated_at > dataUpdatedAt)) {
      dataUpdatedAt = collection.data_updated_at
    }

    // Report progress if callback provided
    if (onProgress && collection.total_count > 0) {
      onProgress(allData.length, collection.total_count)
    }

    // Move to next page
    nextUrl = collection.pages.next_url
  }

  return { data: allData, dataUpdatedAt }
}

/**
 * Fetch all pages of a paginated collection (data only)
 */
export async function fetchAllPages<T>(
  initialEndpoint: string,
  token: string,
  onProgress?: (current: number, total: number) => void
): Promise<(T & { id: number })[]> {
  const result = await fetchAllPagesWithMeta<T>(initialEndpoint, token, onProgress)
  return result.data
}

/**
 * Fetch a single resource (non-paginated)
 */
export async function fetchResource<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const response = await apiRequest<{ data: T }>(endpoint, token)
  return response.data
}

/**
 * Test if an API token is valid by fetching user info
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    await apiRequest('/user', token)
    return true
  } catch (error) {
    if (error instanceof WaniKaniAPIError && error.status === 401) {
      return false
    }
    throw error
  }
}
