// Token Management
// Handles secure token storage and retrieval

import apiClient from '../api/api-client.js';

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
     * Set and validate token
     * @param {string} token - API token
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async setToken(token) {
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
     * Clear token
     */
    clearToken() {
        this.token = null;
        apiClient.clearToken();
        
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
