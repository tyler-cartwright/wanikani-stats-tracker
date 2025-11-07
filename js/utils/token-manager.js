// Token Management
// Handles secure token storage and retrieval with persistence

import apiClient from '../api/api-client.js';

const STORAGE_KEY = 'wk_stats_token';

class TokenManager {
    constructor() {
        this.token = null;
        this.serviceWorkerReady = false;
        this.initServiceWorkerCommunication();
    }

    /**
     * Initialize service worker communication
     */
    async initServiceWorkerCommunication() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                this.serviceWorkerReady = true;
                console.log('[TokenManager] Service worker ready for communication');
            } catch (error) {
                console.warn('[TokenManager] Service worker not available:', error);
            }
        }
    }

    /**
     * Validate token format
     * @param {string} token - Token to validate
     * @returns {boolean}
     */
    validateFormat(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }
        
        // UUID format: 8-4-4-4-12
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(token.trim());
    }

    /**
     * Load token from localStorage
     * @returns {string|null}
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                console.log('[TokenManager] Token found in storage');
                return stored;
            }
        } catch (error) {
            console.error('[TokenManager] Failed to load token from storage:', error);
        }
        return null;
    }

    /**
     * Save token to localStorage
     * @param {string} token - Token to save
     * @param {boolean} remember - Whether to persist token
     */
    saveToStorage(token, remember = true) {
        if (!remember) {
            console.log('[TokenManager] Token not persisted (remember=false)');
            return;
        }

        try {
            localStorage.setItem(STORAGE_KEY, token);
            console.log('[TokenManager] Token saved to storage');
        } catch (error) {
            console.error('[TokenManager] Failed to save token to storage:', error);
        }
    }

    /**
     * Remove token from localStorage
     */
    removeFromStorage() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('[TokenManager] Token removed from storage');
        } catch (error) {
            console.error('[TokenManager] Failed to remove token from storage:', error);
        }
    }

    /**
     * Restore token from storage and validate
     * @returns {Promise<boolean>} True if token restored successfully
     */
    async restoreToken() {
        const storedToken = this.loadFromStorage();
        
        if (!storedToken) {
            return false;
        }

        // Validate format
        if (!this.validateFormat(storedToken)) {
            console.warn('[TokenManager] Stored token has invalid format, clearing');
            this.removeFromStorage();
            return false;
        }

        // Set in API client
        apiClient.setToken(storedToken);

        // Test token
        try {
            const isValid = await apiClient.testToken();
            
            if (!isValid) {
                console.warn('[TokenManager] Stored token is invalid, clearing');
                this.removeFromStorage();
                apiClient.clearToken();
                return false;
            }

            // Token is valid
            this.token = storedToken;
            await this.sendTokenToServiceWorker(storedToken);
            console.log('[TokenManager] Token restored successfully');
            return true;

        } catch (error) {
            console.error('[TokenManager] Failed to validate stored token:', error);
            // Don't clear on network error - might be offline
            return false;
        }
    }

    /**
     * Set and validate token
     * @param {string} token - API token
     * @param {boolean} remember - Whether to persist token
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async setToken(token, remember = true) {
        const trimmedToken = token.trim();

        // Validate format
        if (!this.validateFormat(trimmedToken)) {
            return {
                success: false,
                error: 'Invalid token format. Token should be a UUID (e.g., 12345678-1234-1234-1234-123456789abc)'
            };
        }

        // Set token in API client
        apiClient.setToken(trimmedToken);

        // Test token by making API request
        try {
            const isValid = await apiClient.testToken();
            
            if (!isValid) {
                apiClient.clearToken();
                return {
                    success: false,
                    error: 'Token is invalid or expired. Please check your token and try again.'
                };
            }

            // Token is valid, store it
            this.token = trimmedToken;
            
            // Save to localStorage if remember is true
            this.saveToStorage(trimmedToken, remember);
            
            // Send to service worker for request interception
            await this.sendTokenToServiceWorker(trimmedToken);

            console.log('[TokenManager] Token validated and stored');
            return { success: true };

        } catch (error) {
            console.error('[TokenManager] Token validation failed:', error);
            apiClient.clearToken();
            return {
                success: false,
                error: 'Failed to validate token. Please check your internet connection and try again.'
            };
        }
    }

    /**
     * Send token to service worker
     * @param {string} token - API token
     */
    async sendTokenToServiceWorker(token) {
        if (!this.serviceWorkerReady) {
            console.warn('[TokenManager] Service worker not ready, waiting...');
            await this.initServiceWorkerCommunication();
        }

        if (navigator.serviceWorker.controller) {
            // Send message to service worker
            navigator.serviceWorker.controller.postMessage({
                type: 'STORE_TOKEN',
                token: token
            });
            console.log('[TokenManager] Token sent to service worker');
        } else {
            console.warn('[TokenManager] No service worker controller available');
        }
    }

    /**
     * Get current token
     * @returns {string|null}
     */
    getToken() {
        return this.token;
    }

    /**
     * Check if token is set
     * @returns {boolean}
     */
    hasToken() {
        return this.token !== null;
    }

    /**
     * Clear token (from memory and storage)
     */
    clearToken() {
        this.token = null;
        apiClient.clearToken();
        this.removeFromStorage();
        
        // Notify service worker
        if (this.serviceWorkerReady && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CLEAR_TOKEN'
            });
        }
        
        console.log('[TokenManager] Token cleared');
    }
}

// Export singleton instance
const tokenManager = new TokenManager();
export default tokenManager;
