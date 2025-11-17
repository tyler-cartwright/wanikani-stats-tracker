// Level Progressions API Endpoint
// Fetches level progression history

import apiClient from './api-client.js';
import db from '../storage/db.js';

/**
 * Fetch all level progressions
 * @param {Object} options - Fetch options
 * @param {boolean} options.forceRefresh - Force a full refresh, ignoring cache
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>}
 */
export async function fetchLevelProgressions(options = {}, onProgress = null) {
    try {
        // Check for incremental update
        const lastSync = await db.metadata('level_progressions_last_sync');
        const cachedCount = await db.count('level_progressions');
        const apiOptions = {};

        // Only use incremental update if we have data AND not forcing refresh
        if (lastSync && cachedCount > 0 && !options.forceRefresh) {
            console.log(`[Level Progressions API] Have ${cachedCount} cached, checking for updates since`, lastSync);
            apiOptions.params = {
                updated_after: lastSync
            };
        } else {
            if (options.forceRefresh) {
                console.log('[Level Progressions API] Force refresh - fetching all level progressions');
            } else {
                console.log('[Level Progressions API] First fetch - getting all level progressions');
            }
        }

        // Fetch from API (usually small dataset, 1-60 records)
        console.log('[Level Progressions API] Fetching level progressions from API');
        const progressions = await apiClient.getAllPages('/level_progressions', apiOptions, onProgress);

        if (progressions === null) {
            console.log('[Level Progressions API] Not modified, returning cached data');
            return await db.getAll('level_progressions');
        }

        // Store in database
        if (progressions.length > 0) {
            console.log(`[Level Progressions API] Storing ${progressions.length} level progressions`);

            // Log each progression for debugging
            progressions.forEach(lp => {
                console.log(`[Level Progressions API] Level ${lp.data.level}: started=${lp.data.started_at}, passed=${lp.data.passed_at}, abandoned=${lp.data.abandoned_at}`);
            });

            await db.putBulk('level_progressions', progressions);
            await db.metadata('level_progressions_last_sync', new Date().toISOString());
        } else {
            console.log('[Level Progressions API] No progressions returned from API');
            if (!lastSync) {
                // First fetch but got nothing - this is unusual
                console.warn('[Level Progressions API] WARNING: First fetch returned 0 level progressions');
            }
            await db.metadata('level_progressions_last_sync', new Date().toISOString());
        }

        // Always return ALL cached level progressions
        const allProgressions = await db.getAll('level_progressions');
        console.log(`[Level Progressions API] Returning ${allProgressions.length} total level progressions from cache`);

        // Log summary for debugging
        const completed = allProgressions.filter(lp => lp.data.passed_at && !lp.data.abandoned_at);
        const abandoned = allProgressions.filter(lp => lp.data.abandoned_at);
        const inProgress = allProgressions.filter(lp => lp.data.started_at && !lp.data.passed_at && !lp.data.abandoned_at);
        console.log(`[Level Progressions API] Summary: ${completed.length} completed, ${inProgress.length} in progress, ${abandoned.length} abandoned`);

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
