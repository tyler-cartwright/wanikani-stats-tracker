// IndexedDB Database Manager
// Handles all database operations for WaniKani data

const DB_NAME = 'WaniKaniStatsDB';
const DB_VERSION = 1;

class Database {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize and open the database
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[DB] Error opening database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[DB] Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('[DB] Upgrading database schema...');

                // Create object stores if they don't exist

                // User data - single record
                if (!db.objectStoreNames.contains('user')) {
                    const userStore = db.createObjectStore('user', { keyPath: 'id' });
                    console.log('[DB] Created user store');
                }

                // Summary data - single record, updated hourly
                if (!db.objectStoreNames.contains('summary')) {
                    db.createObjectStore('summary', { keyPath: 'id' });
                    console.log('[DB] Created summary store');
                }

                // Subjects - 9000+ records (radicals, kanji, vocabulary)
                if (!db.objectStoreNames.contains('subjects')) {
                    const subjectsStore = db.createObjectStore('subjects', { keyPath: 'id' });
                    subjectsStore.createIndex('level', 'data.level', { unique: false });
                    subjectsStore.createIndex('subject_type', 'object', { unique: false });
                    console.log('[DB] Created subjects store with indexes');
                }

                // Assignments - user's progress on each subject
                if (!db.objectStoreNames.contains('assignments')) {
                    const assignmentsStore = db.createObjectStore('assignments', { keyPath: 'id' });
                    assignmentsStore.createIndex('subject_id', 'data.subject_id', { unique: false });
                    assignmentsStore.createIndex('srs_stage', 'data.srs_stage', { unique: false });
                    assignmentsStore.createIndex('subject_type', 'data.subject_type', { unique: false });
                    assignmentsStore.createIndex('level', 'data.level', { unique: false });
                    console.log('[DB] Created assignments store with indexes');
                }

                // Review Statistics - accuracy data per subject
                if (!db.objectStoreNames.contains('review_statistics')) {
                    const reviewStatsStore = db.createObjectStore('review_statistics', { keyPath: 'id' });
                    reviewStatsStore.createIndex('subject_id', 'data.subject_id', { unique: false });
                    reviewStatsStore.createIndex('percentage_correct', 'data.percentage_correct', { unique: false });
                    reviewStatsStore.createIndex('subject_type', 'data.subject_type', { unique: false });
                    console.log('[DB] Created review_statistics store with indexes');
                }

                // Reviews - historical review events (optional, for advanced analytics)
                if (!db.objectStoreNames.contains('reviews')) {
                    const reviewsStore = db.createObjectStore('reviews', { keyPath: 'id' });
                    reviewsStore.createIndex('created_at', 'data.created_at', { unique: false });
                    reviewsStore.createIndex('assignment_id', 'data.assignment_id', { unique: false });
                    console.log('[DB] Created reviews store with indexes');
                }

                // Level Progressions - timeline of level ups
                if (!db.objectStoreNames.contains('level_progressions')) {
                    const levelProgressionsStore = db.createObjectStore('level_progressions', { keyPath: 'id' });
                    levelProgressionsStore.createIndex('level', 'data.level', { unique: false });
                    console.log('[DB] Created level_progressions store with indexes');
                }

                // Metadata - track last sync times and other app state
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                    console.log('[DB] Created metadata store');
                }

                console.log('[DB] Database schema upgrade complete');
            };
        });
    }

    /**
     * Get a single record by ID from a store
     * @param {string} storeName - Name of the object store
     * @param {number|string} id - Record ID
     * @returns {Promise<any>}
     */
    async get(storeName, id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all records from a store
     * @param {string} storeName - Name of the object store
     * @returns {Promise<Array>}
     */
    async getAll(storeName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get records by index value
     * @param {string} storeName - Name of the object store
     * @param {string} indexName - Name of the index
     * @param {any} value - Value to search for
     * @returns {Promise<Array>}
     */
    async getByIndex(storeName, indexName, value) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Put (insert or update) a single record
     * @param {string} storeName - Name of the object store
     * @param {any} data - Data to store
     * @returns {Promise<number>}
     */
    async put(storeName, data) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Put multiple records in bulk (efficient)
     * @param {string} storeName - Name of the object store
     * @param {Array} dataArray - Array of records to store
     * @returns {Promise<void>}
     */
    async putBulk(storeName, dataArray) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);

            dataArray.forEach(data => {
                store.put(data);
            });
        });
    }

    /**
     * Delete a record by ID
     * @param {string} storeName - Name of the object store
     * @param {number|string} id - Record ID
     * @returns {Promise<void>}
     */
    async delete(storeName, id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all records from a store
     * @param {string} storeName - Name of the object store
     * @returns {Promise<void>}
     */
    async clear(storeName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => {
                console.log(`[DB] Cleared ${storeName} store`);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all data from all stores (hard reset)
     * @returns {Promise<void>}
     */
    async clearAll() {
        const db = await this.init();
        const storeNames = Array.from(db.objectStoreNames);

        console.log('[DB] Clearing all stores:', storeNames);

        return new Promise((resolve, reject) => {
            // Use a single transaction to clear all stores
            const transaction = db.transaction(storeNames, 'readwrite');

            transaction.oncomplete = () => {
                console.log('[DB] All stores cleared successfully');
                resolve();
            };

            transaction.onerror = () => {
                console.error('[DB] Failed to clear stores:', transaction.error);
                reject(transaction.error);
            };

            // Clear each store within the transaction
            for (const storeName of storeNames) {
                try {
                    const store = transaction.objectStore(storeName);
                    store.clear();
                    console.log(`[DB] Clearing ${storeName} store...`);
                } catch (error) {
                    console.error(`[DB] Error clearing ${storeName}:`, error);
                }
            }
        });
    }

    /**
     * Count records in a store
     * @param {string} storeName - Name of the object store
     * @returns {Promise<number>}
     */
    async count(storeName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get or set metadata values (for tracking sync times, etc.)
     * @param {string} key - Metadata key
     * @param {any} value - Value to set (if undefined, will get instead)
     * @returns {Promise<any>}
     */
    async metadata(key, value) {
        if (value !== undefined) {
            // Set metadata
            return this.put('metadata', { key, value, updated_at: new Date().toISOString() });
        } else {
            // Get metadata
            const result = await this.get('metadata', key);
            return result ? result.value : null;
        }
    }

    /**
     * Close the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('[DB] Database connection closed');
        }
    }
}

// Export singleton instance
const db = new Database();
export default db;
