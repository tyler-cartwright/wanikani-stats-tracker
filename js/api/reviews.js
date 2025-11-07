// Reviews API Endpoint
// Fetches historical review data (optional, for advanced analytics)

import apiClient from './api-client.js';
import db from '../storage/db.js';

/**
 * Fetch reviews (potentially large dataset)
 * @param {Object} options - Filter options (ids, assignment_ids, subject_ids, updated_after)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>}
 */
export async function fetchReviews(options = {}, onProgress = null) {
    try {
        console.log('[Reviews API] Fetching reviews');
        const reviews = await apiClient.getAllPages('/reviews', options, onProgress);

        if (reviews === null) {
            return await db.getAll('reviews');
        }

        // Store in database
        if (reviews.length > 0) {
            console.log(`[Reviews API] Caching ${reviews.length} reviews`);
            await db.putBulk('reviews', reviews);
        }

        return reviews;

    } catch (error) {
        console.error('[Reviews API] Failed to fetch reviews:', error);
        
        const cached = await db.getAll('reviews');
        if (cached.length > 0) {
            console.log('[Reviews API] Returning cached data due to error');
            return cached;
        }
        
        throw error;
    }
}

/**
 * Get cached reviews
 * @returns {Promise<Array>}
 */
export async function getCachedReviews() {
    return await db.getAll('reviews');
}
