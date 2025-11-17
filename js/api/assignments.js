// Assignments API Endpoint
// Fetches user progress on subjects

import apiClient from './api-client.js';
import db from '../storage/db.js';

/**
 * Fetch all assignments with optional filters
 * @param {Object} options - Filter options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>}
 */
export async function fetchAssignments(options = {}, onProgress = null) {
    try {
        // Check for incremental update
        const lastSync = await db.metadata('assignments_last_sync');
        const cachedCount = await db.count('assignments');

        // Only use incremental update if we have data AND not forcing refresh
        if (lastSync && cachedCount > 0 && !options.forceRefresh) {
            console.log(`[Assignments API] Have ${cachedCount} cached, fetching updates since`, lastSync);
            options.params = {
                ...options.params,
                updated_after: lastSync
            };
        } else {
            if (options.forceRefresh) {
                console.log('[Assignments API] Force refresh - fetching all assignments');
            } else {
                console.log('[Assignments API] First fetch - getting all assignments');
            }
        }

        // Fetch from API
        console.log('[Assignments API] Fetching assignments');
        const assignments = await apiClient.getAllPages('/assignments', options, onProgress);

        if (assignments === null) {
            // Not modified, return cached data
            console.log('[Assignments API] Not modified, returning cached data');
            return await db.getAll('assignments');
        }

        // Store in database (merge updates)
        if (assignments.length > 0) {
            console.log(`[Assignments API] Caching ${assignments.length} assignment updates`);
            await db.putBulk('assignments', assignments);
            
            // Update last sync time
            await db.metadata('assignments_last_sync', new Date().toISOString());
        } else {
            console.log('[Assignments API] No updates found');
            // Still update last sync time even if no changes
            await db.metadata('assignments_last_sync', new Date().toISOString());
        }

        // Always return ALL cached assignments (not just the updates)
        const allAssignments = await db.getAll('assignments');
        console.log(`[Assignments API] Returning ${allAssignments.length} total assignments`);
        return allAssignments;

    } catch (error) {
        console.error('[Assignments API] Failed to fetch assignments:', error);
        
        // Return cached data if available
        const cached = await db.getAll('assignments');
        if (cached.length > 0) {
            console.log('[Assignments API] Returning cached data due to error');
            return cached;
        }
        
        throw error;
    }
}

/**
 * Get cached assignments
 * @param {Object} filters - Optional filters (srs_stage, level, subject_type)
 * @returns {Promise<Array>}
 */
export async function getCachedAssignments(filters = {}) {
    let assignments = await db.getAll('assignments');

    // Apply filters
    if (filters.srs_stage !== undefined) {
        const stages = Array.isArray(filters.srs_stage) ? filters.srs_stage : [filters.srs_stage];
        assignments = assignments.filter(a => stages.includes(a.data.srs_stage));
    }

    if (filters.level !== undefined) {
        const levels = Array.isArray(filters.level) ? filters.level : [filters.level];
        assignments = assignments.filter(a => levels.includes(a.data.level));
    }

    if (filters.subject_type) {
        assignments = assignments.filter(a => a.data.subject_type === filters.subject_type);
    }

    return assignments;
}

/**
 * Get assignment by subject ID
 * @param {number} subjectId
 * @returns {Promise<Object|null>}
 */
export async function getAssignmentBySubjectId(subjectId) {
    const assignments = await db.getByIndex('assignments', 'subject_id', subjectId);
    return assignments.length > 0 ? assignments[0] : null;
}
