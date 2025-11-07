// Review Statistics API Endpoint
// Fetches accuracy data for subjects

import apiClient from './api-client.js';
import db from '../storage/db.js';

/**
 * Fetch all review statistics
 * @param {Object} options - Filter options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>}
 */
export async function fetchReviewStatistics(options = {}, onProgress = null) {
    try {
        // Check for incremental update
        const lastSync = await db.metadata('review_statistics_last_sync');
        
        if (lastSync && !options.forceRefresh) {
            console.log('[Review Statistics API] Fetching updates since', lastSync);
            options.params = {
                ...options.params,
                updated_after: lastSync
            };
        }

        // Fetch from API
        console.log('[Review Statistics API] Fetching review statistics');
        const stats = await apiClient.getAllPages('/review_statistics', options, onProgress);

        if (stats === null) {
            // Not modified
            return await db.getAll('review_statistics');
        }

        // Store in database
        if (stats.length > 0) {
            console.log(`[Review Statistics API] Caching ${stats.length} review statistics`);
            await db.putBulk('review_statistics', stats);
            
            await db.metadata('review_statistics_last_sync', new Date().toISOString());
        }

        return stats;

    } catch (error) {
        console.error('[Review Statistics API] Failed to fetch review statistics:', error);
        
        // Return cached data if available
        const cached = await db.getAll('review_statistics');
        if (cached.length > 0) {
            console.log('[Review Statistics API] Returning cached data due to error');
            return cached;
        }
        
        throw error;
    }
}

/**
 * Get cached review statistics
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>}
 */
export async function getCachedReviewStatistics(filters = {}) {
    let stats = await db.getAll('review_statistics');

    // Apply filters
    if (filters.percentages_less_than !== undefined) {
        stats = stats.filter(s => s.data.percentage_correct < filters.percentages_less_than);
    }

    if (filters.subject_type) {
        stats = stats.filter(s => s.data.subject_type === filters.subject_type);
    }

    return stats;
}

/**
 * Get review statistics by subject ID
 * @param {number} subjectId
 * @returns {Promise<Object|null>}
 */
export async function getReviewStatisticsBySubjectId(subjectId) {
    const stats = await db.getByIndex('review_statistics', 'subject_id', subjectId);
    return stats.length > 0 ? stats[0] : null;
}
