// WaniKani API Client
// Handles all API communication with rate limiting and error handling

import { API_BASE_URL, API_REVISION, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } from '../utils/constants.js';

class APIClient {
    constructor() {
        this.token = null;
        this.rateLimitRemaining = RATE_LIMIT_MAX;
        this.rateLimitReset = Date.now() + RATE_LIMIT_WINDOW;
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Set the API token
     * @param {string} token - WaniKani API token
     */
    setToken(token) {
        this.token = token;
        console.log('[API] Token set');
    }

    /**
     * Get the current API token
     * @returns {string|null}
     */
    getToken() {
        return this.token;
    }

    /**
     * Clear the API token
     */
    clearToken() {
        this.token = null;
        console.log('[API] Token cleared');
    }

    /**
     * Build request headers
     * @returns {Object}
     */
    getHeaders() {
        if (!this.token) {
            throw new Error('API token not set');
        }

        return {
            'Authorization': `Bearer ${this.token}`,
            'Wanikani-Revision': API_REVISION
        };
    }

    /**
     * Update rate limit info from response headers
     * @param {Response} response - Fetch response object
     */
    updateRateLimit(response) {
        const remaining = response.headers.get('RateLimit-Remaining');
        const reset = response.headers.get('RateLimit-Reset');

        if (remaining !== null) {
            this.rateLimitRemaining = parseInt(remaining, 10);
        }

        if (reset !== null) {
            this.rateLimitReset = parseInt(reset, 10) * 1000; // Convert to milliseconds
        }

        console.log(`[API] Rate limit: ${this.rateLimitRemaining} remaining, resets at ${new Date(this.rateLimitReset).toLocaleTimeString()}`);
    }

    /**
     * Wait if rate limit is low
     * @returns {Promise<void>}
     */
    async respectRateLimit() {
        // If we have very few requests left, wait until reset
        if (this.rateLimitRemaining < 5) {
            const waitTime = this.rateLimitReset - Date.now();
            if (waitTime > 0) {
                console.log(`[API] Rate limit low, waiting ${Math.ceil(waitTime / 1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                // Reset counter after waiting
                this.rateLimitRemaining = RATE_LIMIT_MAX;
            }
        }
    }

    /**
     * Make a GET request to the API
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {Object} options - Additional options (params, etag, etc.)
     * @returns {Promise<Object>}
     */
    async get(endpoint, options = {}) {
        await this.respectRateLimit();

        // Build URL with query parameters
        let url = `${API_BASE_URL}${endpoint}`;
        if (options.params) {
            const params = new URLSearchParams();
            Object.entries(options.params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => params.append(key, v));
                } else if (value !== undefined && value !== null) {
                    params.append(key, value);
                }
            });
            const paramString = params.toString();
            if (paramString) {
                url += `?${paramString}`;
            }
        }

        // Build headers
        const headers = this.getHeaders();
        
        // Add conditional request headers if provided
        if (options.etag) {
            headers['If-None-Match'] = options.etag;
        }
        if (options.ifModifiedSince) {
            headers['If-Modified-Since'] = options.ifModifiedSince;
        }

        try {
            console.log(`[API] GET ${endpoint}`);
            const response = await fetch(url, { headers });

            // Update rate limit tracking
            this.updateRateLimit(response);

            // Handle 304 Not Modified
            if (response.status === 304) {
                console.log('[API] Resource not modified (304)');
                return { notModified: true };
            }

            // Handle 429 Too Many Requests
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
                console.warn(`[API] Rate limited (429), retrying after ${retryAfter}s`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                return this.get(endpoint, options); // Retry
            }

            // Handle other error statuses
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            // Parse JSON response
            const data = await response.json();

            // Store ETag for future conditional requests
            const etag = response.headers.get('ETag');
            if (etag) {
                data._etag = etag;
            }

            return data;

        } catch (error) {
            console.error('[API] Request failed:', error);
            throw error;
        }
    }

    /**
     * Fetch all pages from a paginated endpoint
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @param {Function} onProgress - Progress callback (current, total)
     * @returns {Promise<Array>}
     */
    async getAllPages(endpoint, options = {}, onProgress = null) {
        let allData = [];
        let nextUrl = endpoint;
        let pageCount = 0;
        let totalPages = null;

        while (nextUrl) {
            pageCount++;
            
            // For first request, use provided options
            // For subsequent requests, extract endpoint from nextUrl
            const response = pageCount === 1 
                ? await this.get(nextUrl, options)
                : await this.get(nextUrl.replace(API_BASE_URL, ''));

            if (response.notModified) {
                console.log('[API] Data not modified, using cached version');
                return null; // Caller should use cached data
            }

            // Add data from this page
            if (response.data) {
                allData = allData.concat(response.data);
            }

            // Update progress
            if (response.total_count && !totalPages) {
                totalPages = Math.ceil(response.total_count / (response.pages?.per_page || 500));
            }
            
            if (onProgress && totalPages) {
                onProgress(pageCount, totalPages);
            }

            // Get next page URL
            nextUrl = response.pages?.next_url || null;

            // Small delay between pages to be respectful
            if (nextUrl) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`[API] Fetched ${allData.length} items across ${pageCount} pages`);
        return allData;
    }

    /**
     * Validate API token format
     * @param {string} token - Token to validate
     * @returns {boolean}
     */
    static validateToken(token) {
        // WaniKani tokens are UUIDs: 8-4-4-4-12 hex format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(token);
    }

    /**
     * Test if API token is valid by making a test request
     * @returns {Promise<boolean>}
     */
    async testToken() {
        try {
            const response = await this.get('/user');
            return response && response.data && response.data.username;
        } catch (error) {
            console.error('[API] Token test failed:', error);
            return false;
        }
    }
}

// Export singleton instance
const apiClient = new APIClient();
export default apiClient;
