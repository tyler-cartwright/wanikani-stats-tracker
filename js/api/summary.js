// Summary API Endpoint
// Fetches current lessons/reviews summary

import apiClient from './api-client.js';
import db from '../storage/db.js';

/**
 * Fetch summary data (lessons and reviews available)
 * @param {boolean} forceRefresh - Skip cache and fetch fresh data
 * @returns {Promise<Object>}
 */
export async function fetchSummary(forceRefresh = false) {
    try {
        // Check cache (summary updates hourly, so cache for 1 hour)
        if (!forceRefresh) {
            const cached = await db.get('summary', 'current');
            if (cached && cached.data) {
                const cacheAge = Date.now() - new Date(cached.cached_at).getTime();
                const oneHour = 60 * 60 * 1000;
                
                if (cacheAge < oneHour) {
                    console.log('[Summary API] Using cached summary data');
                    return cached;
                }
            }
        }

        // Fetch from API
        console.log('[Summary API] Fetching summary from API');
        const response = await apiClient.get('/summary');

        // Store in database
        const summaryData = {
            id: 'current',
            ...response,
            cached_at: new Date().toISOString()
        };
        
        await db.put('summary', summaryData);
        console.log('[Summary API] Summary cached');

        return response;

    } catch (error) {
        console.error('[Summary API] Failed to fetch summary:', error);
        throw error;
    }
}

/**
 * Get cached summary data
 * @returns {Promise<Object|null>}
 */
export async function getCachedSummary() {
    const cached = await db.get('summary', 'current');
    return cached || null;
}
