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

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private lastRequestTime = 0

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()
  }
}

const rateLimiter = new RateLimiter()

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
  // Wait if needed to respect rate limits
  await rateLimiter.waitIfNeeded()

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Wanikani-Revision': '20170710', // API revision date
      },
    })

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

/**
 * Fetch all pages of a paginated collection
 * WaniKani uses cursor-based pagination with next_url
 * Returns data with id merged in for easier access
 */
export async function fetchAllPages<T>(
  initialEndpoint: string,
  token: string,
  onProgress?: (current: number, total: number) => void
): Promise<(T & { id: number })[]> {
  const allData: (T & { id: number })[] = []
  let nextUrl: string | null = initialEndpoint
  let pageCount = 0

  while (nextUrl) {
    const collection: Collection<T> = await apiRequest<Collection<T>>(nextUrl, token)

    // Extract data from resources and merge in the id field
    const pageData = collection.data.map((resource) => ({
      ...resource.data,
      id: resource.id,
    }))
    allData.push(...pageData)

    pageCount++

    // Report progress if callback provided
    if (onProgress && collection.total_count > 0) {
      onProgress(allData.length, collection.total_count)
    }

    // Move to next page
    nextUrl = collection.pages.next_url
  }

  return allData
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
