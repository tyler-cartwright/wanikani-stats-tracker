// Level Progressions API Endpoint
// Fetches level progression history

import apiClient from './api-client.js';
import db from '../storage/db.js';

/**
 * Fetch all level progressions
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>}
 */
export async function fetchLevelProgressions(onProgress = null) {
    try {
        // Check for incremental update
        const lastSync = await db.metadata('level_progressions_last_sync');
        const options = {};
        
        if (lastSync) {
            console.log('[Level Progressions API] Fetching updates since', lastSync);
            options.params = {
                updated_after: lastSync
            };
        }

        // Fetch from API (usually small dataset, 1-60 records)
        console.log('[Level Progressions API] Fetching level progressions');
        const progressions = await apiClient.getAllPages('/level_progressions', options, onProgress);

        if (progressions === null) {
            console.log('[Level Progressions API] Not modified, returning cached data');
            return await db.getAll('level_progressions');
        }

        // Store in database
        if (progressions.length > 0) {
            console.log(`[Level Progressions API] Caching ${progressions.length} level progression updates`);
            await db.putBulk('level_progressions', progressions);
            
            await db.metadata('level_progressions_last_sync', new Date().toISOString());
        } else {
            console.log('[Level Progressions API] No updates found');
            await db.metadata('level_progressions_last_sync', new Date().toISOString());
        }

        // Always return ALL cached level progressions
        const allProgressions = await db.getAll('level_progressions');
        console.log(`[Level Progressions API] Returning ${allProgressions.length} total level progressions`);
        return allProgressions;

    } catch (error) {
        console.error('[Level Progressions API] Failed to fetch level progressions:', error);
        
        const cached = await db.getAll('level_progressions');
        if (cached.length > 0) {
            console.log('[Level Progressions API] Returning cached data due to error');
            return cached;
        }
        
        throw error;
    }
}

/**
 * Get cached level progressions
 * @returns {Promise<Array>}
 */
export async function getCachedLevelProgressions() {
    return await db.getAll('level_progressions');
}

/**
 * Get level progression for specific level
 * @param {number} level
 * @returns {Promise<Object|null>}
 */
export async function getLevelProgression(level) {
    const progressions = await db.getByIndex('level_progressions', 'level', level);
    return progressions.length > 0 ? progressions[0] : null;
}
