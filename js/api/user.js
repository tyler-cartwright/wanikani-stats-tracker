// User API Endpoint
// Fetches user profile and subscription data

import apiClient from './api-client.js';
import db from '../storage/db.js';

/**
 * Fetch user data
 * @param {boolean} forceRefresh - Skip cache and fetch fresh data
 * @returns {Promise<Object>}
 */
export async function fetchUser(forceRefresh = false) {
    try {
        // Check cache first unless force refresh
        if (!forceRefresh) {
            const cached = await db.get('user', 'current');
            if (cached && cached.data) {
                console.log('[User API] Using cached user data');
                return cached;
            }
        }

        // Fetch from API
        console.log('[User API] Fetching user data from API');
        const response = await apiClient.get('/user');

        // Store in database with special ID
        const userData = {
            id: 'current',
            ...response,
            cached_at: new Date().toISOString()
        };
        
        await db.put('user', userData);
        console.log('[User API] User data cached');

        return response;

    } catch (error) {
        console.error('[User API] Failed to fetch user:', error);
        throw error;
    }
}

/**
 * Get cached user data
 * @returns {Promise<Object|null>}
 */
export async function getCachedUser() {
    const cached = await db.get('user', 'current');
    return cached || null;
}
