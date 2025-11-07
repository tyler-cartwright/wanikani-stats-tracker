// Cache Manager
// Utilities for managing service worker caches

class CacheManager {
    constructor() {
        this.cachePrefix = 'wanikani-stats-';
    }

    /**
     * Get all cache names
     * @returns {Promise<Array<string>>}
     */
    async getAllCacheNames() {
        if (!('caches' in window)) {
            return [];
        }
        return await caches.keys();
    }

    /**
     * Get total cache size (approximate)
     * @returns {Promise<number>} Size in bytes
     */
    async getCacheSize() {
        if (!('caches' in window)) {
            return 0;
        }

        const cacheNames = await this.getAllCacheNames();
        let totalSize = 0;

        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();

            for (const request of requests) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    totalSize += blob.size;
                }
            }
        }

        return totalSize;
    }

    /**
     * Format bytes to human readable
     * @param {number} bytes
     * @returns {string}
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Clear all caches
     * @returns {Promise<void>}
     */
    async clearAllCaches() {
        if (!('caches' in window)) {
            return;
        }

        const cacheNames = await this.getAllCacheNames();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );

        console.log('[CacheManager] All caches cleared');
    }

    /**
     * Clear old caches (keep current version)
     * @param {string} currentVersion
     * @returns {Promise<void>}
     */
    async clearOldCaches(currentVersion) {
        if (!('caches' in window)) {
            return;
        }

        const cacheNames = await this.getAllCacheNames();
        const currentCacheNames = [
            `static-${currentVersion}`,
            `subjects-${currentVersion}`,
            `dynamic-${currentVersion}`,
            `api-${currentVersion}`
        ];

        await Promise.all(
            cacheNames.map(cacheName => {
                if (!currentCacheNames.includes(cacheName)) {
                    console.log('[CacheManager] Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                }
            })
        );
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>}
     */
    async getCacheStats() {
        if (!('caches' in window)) {
            return {
                cacheNames: [],
                totalCaches: 0,
                totalSize: 0,
                formattedSize: '0 Bytes'
            };
        }

        const cacheNames = await this.getAllCacheNames();
        const totalSize = await this.getCacheSize();

        return {
            cacheNames,
            totalCaches: cacheNames.length,
            totalSize,
            formattedSize: this.formatBytes(totalSize)
        };
    }
}

// Export singleton instance
const cacheManager = new CacheManager();
export default cacheManager;
