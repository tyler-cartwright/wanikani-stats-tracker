// Subjects API Endpoint
// Fetches all learning content (radicals, kanji, vocabulary)

import apiClient from './api-client.js';
import db from '../storage/db.js';

/**
 * Fetch all subjects (this is a large dataset ~9000 items)
 * @param {Object} options - Filter options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>}
 */
export async function fetchSubjects(options = {}, onProgress = null) {
    try {
        // Check if we have cached subjects
        const cachedCount = await db.count('subjects');
        const lastSync = await db.metadata('subjects_last_sync');
        
        // If we have cached subjects and they're recent, use incremental update
        if (cachedCount > 0 && lastSync && !options.forceRefresh) {
            const cacheAge = Date.now() - new Date(lastSync).getTime();
            const oneWeek = 7 * 24 * 60 * 60 * 1000;

            if (cacheAge < oneWeek) {
                const ageDays = Math.floor(cacheAge / (24 * 60 * 60 * 1000));
                console.log(`[Subjects API] Using cached subjects (${cachedCount} items, ${ageDays} days old)`);
                return await db.getAll('subjects');
            }

            // Try incremental update
            console.log(`[Subjects API] Have ${cachedCount} cached, fetching updates since`, lastSync);
            options.params = {
                ...options.params,
                updated_after: lastSync
            };
        } else {
            if (options.forceRefresh) {
                console.log('[Subjects API] Force refresh - fetching all subjects');
            } else if (cachedCount === 0) {
                console.log('[Subjects API] First fetch - getting all subjects');
            }
        }

        // Fetch from API
        console.log('[Subjects API] Fetching subjects from API');
        const subjects = await apiClient.getAllPages('/subjects', options, onProgress);

        if (subjects === null) {
            // Not modified
            return await db.getAll('subjects');
        }

        // Store in database
        if (subjects.length > 0) {
            console.log(`[Subjects API] Caching ${subjects.length} subjects`);
            await db.putBulk('subjects', subjects);
            
            await db.metadata('subjects_last_sync', new Date().toISOString());
        }

        return subjects;

    } catch (error) {
        console.error('[Subjects API] Failed to fetch subjects:', error);
        
        // Return cached data if available
        const cached = await db.getAll('subjects');
        if (cached.length > 0) {
            console.log('[Subjects API] Returning cached data due to error');
            return cached;
        }
        
        throw error;
    }
}

/**
 * Get cached subjects
 * @param {Object} filters - Optional filters (level, type)
 * @returns {Promise<Array>}
 */
export async function getCachedSubjects(filters = {}) {
    let subjects = await db.getAll('subjects');

    // Apply filters
    if (filters.level !== undefined) {
        const levels = Array.isArray(filters.level) ? filters.level : [filters.level];
        subjects = subjects.filter(s => levels.includes(s.data.level));
    }

    if (filters.type) {
        const types = Array.isArray(filters.type) ? filters.type : [filters.type];
        subjects = subjects.filter(s => types.includes(s.object));
    }

    return subjects;
}

/**
 * Get subject by ID
 * @param {number} subjectId
 * @returns {Promise<Object|null>}
 */
export async function getSubjectById(subjectId) {
    return await db.get('subjects', subjectId);
}

/**
 * Get multiple subjects by IDs
 * @param {Array<number>} subjectIds
 * @returns {Promise<Array>}
 */
export async function getSubjectsByIds(subjectIds) {
    const subjects = [];
    for (const id of subjectIds) {
        const subject = await db.get('subjects', id);
        if (subject) {
            subjects.push(subject);
        }
    }
    return subjects;
}
