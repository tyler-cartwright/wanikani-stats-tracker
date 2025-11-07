// Service Worker - WaniKani Stats Tracker
// Version 1.0.0

const VERSION = '1.0.0';
const CACHE_NAME = `wanikani-stats-v${VERSION}`;

// Cache names for different strategies
const CACHES = {
    STATIC: `static-${VERSION}`,
    SUBJECTS: `subjects-${VERSION}`,
    DYNAMIC: `dynamic-${VERSION}`,
    API: `api-${VERSION}`
};

// Static assets to cache on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/variables.css',
    './css/styles.css',
    './css/components.css',
    './js/app.js',
    './js/utils/constants.js',
    './js/utils/token-manager.js',
    './js/utils/helpers.js',
    './js/utils/date-utils.js',
    './js/api/api-client.js',
    './js/api/user.js',
    './js/api/summary.js',
    './js/api/assignments.js',
    './js/api/review-statistics.js',
    './js/api/subjects.js',
    './js/api/level-progressions.js',
    './js/api/reviews.js',
    './js/api/data-sync.js',
    './js/storage/db.js',
    './js/storage/cache-manager.js'
];

// API token storage (in service worker memory)
let apiToken = null;

console.log(`[SW] Service Worker v${VERSION} loading...`);

// ============================================================================
// INSTALLATION
// ============================================================================

self.addEventListener('install', (event) => {
    console.log(`[SW] Installing version ${VERSION}...`);
    
    event.waitUntil(
        caches.open(CACHES.STATIC)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

// ============================================================================
// ACTIVATION
// ============================================================================

self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating version ${VERSION}...`);
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Delete old caches
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Keep current version caches
                        if (Object.values(CACHES).includes(cacheName)) {
                            console.log('[SW] Keeping cache:', cacheName);
                            return null;
                        }
                        
                        // Delete old version caches
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            })
            .then(() => {
                console.log('[SW] Old caches cleaned up');
                return self.clients.claim();
            })
            .then(() => {
                console.log('[SW] Service worker activated and claimed clients');
            })
    );
});

// ============================================================================
// MESSAGING (for token storage)
// ============================================================================

self.addEventListener('message', (event) => {
    const { type, token } = event.data;
    
    if (type === 'STORE_TOKEN') {
        apiToken = token;
        console.log('[SW] API token stored');
        
        // Notify client that token is stored
        event.ports[0]?.postMessage({ success: true });
    }
    
    if (type === 'CLEAR_TOKEN') {
        apiToken = null;
        console.log('[SW] API token cleared');
        
        event.ports[0]?.postMessage({ success: true });
    }
    
    if (type === 'GET_TOKEN') {
        event.ports[0]?.postMessage({ token: apiToken });
    }
    
    if (type === 'SKIP_WAITING') {
        console.log('[SW] Skip waiting requested');
        self.skipWaiting();
    }
});

// ============================================================================
// FETCH STRATEGIES
// ============================================================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests with appropriate strategies
    
    // 1. API Requests - Special handling with token injection
    if (url.origin === 'https://api.wanikani.com') {
        event.respondWith(handleAPIRequest(request));
        return;
    }
    
    // 2. Static Assets - Cache first, network fallback
    if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
        event.respondWith(cacheFirst(request, CACHES.STATIC));
        return;
    }
    
    // 3. App Shell (index.html) - Network first, cache fallback
    if (request.url.endsWith('/') || request.url.includes('index.html')) {
        event.respondWith(networkFirst(request, CACHES.STATIC));
        return;
    }
    
    // 4. Everything else - Network first with cache fallback
    event.respondWith(networkFirst(request, CACHES.DYNAMIC));
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Cache First Strategy
 * Try cache first, fall back to network
 * Good for: Static assets that don't change
 */
async function cacheFirst(request, cacheName) {
    try {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Cache hit:', request.url);
            return cachedResponse;
        }
        
        console.log('[SW] Cache miss, fetching:', request.url);
        const networkResponse = await fetch(request);
        
        // Cache the response for future use
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('[SW] Cache first failed:', error);
        throw error;
    }
}

/**
 * Network First Strategy
 * Try network first, fall back to cache
 * Good for: Dynamic content that changes frequently
 */
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Serving from cache (offline)');
            return cachedResponse;
        }
        
        // If request is for HTML, return offline page
        if (request.headers.get('accept').includes('text/html')) {
            return createOfflineResponse();
        }
        
        throw error;
    }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 * Good for: Data that changes occasionally but speed is important
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Fetch fresh version in background
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch((error) => {
        console.log('[SW] Background fetch failed:', error);
        return cachedResponse; // Return cached if fetch fails
    });
    
    // Return cached version immediately if available
    return cachedResponse || fetchPromise;
}

/**
 * Handle API Requests with Token Injection
 */
async function handleAPIRequest(request) {
    const url = new URL(request.url);
    
    // Determine caching strategy based on endpoint
    
    // Subjects: Cache first (changes rarely)
    if (url.pathname.includes('/subjects')) {
        return handleSubjectsRequest(request);
    }
    
    // Assignments & Review Statistics: Stale while revalidate
    if (url.pathname.includes('/assignments') || url.pathname.includes('/review_statistics')) {
        return handleDynamicAPIRequest(request);
    }
    
    // Summary: Network first (updates hourly)
    if (url.pathname.includes('/summary')) {
        return handleNetworkFirstAPI(request);
    }
    
    // Everything else: Network only with token injection
    return handleNetworkOnlyAPI(request);
}

/**
 * Handle Subjects API Request (Cache First)
 */
async function handleSubjectsRequest(request) {
    try {
        // Check cache first
        const cache = await caches.open(CACHES.SUBJECTS);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Subjects: Serving from cache');
            
            // Update in background if cache is old (7+ days)
            const cacheDate = new Date(cachedResponse.headers.get('date'));
            const cacheAge = Date.now() - cacheDate.getTime();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            
            if (cacheAge > sevenDays) {
                console.log('[SW] Subjects: Cache is old, updating in background');
                // Update cache in background (don't await)
                fetchAndCacheAPI(request, CACHES.SUBJECTS);
            }
            
            return cachedResponse;
        }
        
        // Not in cache, fetch and cache
        console.log('[SW] Subjects: Not cached, fetching');
        return await fetchAndCacheAPI(request, CACHES.SUBJECTS);
        
    } catch (error) {
        console.error('[SW] Subjects request failed:', error);
        throw error;
    }
}

/**
 * Handle Dynamic API Request (Stale While Revalidate)
 */
async function handleDynamicAPIRequest(request) {
    const cache = await caches.open(CACHES.API);
    const cachedResponse = await cache.match(request);
    
    // Fetch fresh version in background
    const fetchPromise = fetchAndCacheAPI(request, CACHES.API).catch((error) => {
        console.log('[SW] Background API fetch failed:', error);
        return cachedResponse;
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        console.log('[SW] API: Serving stale while revalidating');
        return cachedResponse;
    }
    
    console.log('[SW] API: No cache, waiting for network');
    return fetchPromise;
}

/**
 * Handle Network First API Request
 */
async function handleNetworkFirstAPI(request) {
    try {
        const response = await fetchWithTokenInjection(request);
        
        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHES.API);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        console.log('[SW] Network failed, trying cache');
        
        const cache = await caches.open(CACHES.API);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Serving cached API response (offline)');
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Handle Network Only API Request
 */
async function handleNetworkOnlyAPI(request) {
    return fetchWithTokenInjection(request);
}

/**
 * Fetch API request with token injection
 */
async function fetchWithTokenInjection(request) {
    // Clone request and add token header
    const headers = new Headers(request.headers);
    
    if (apiToken) {
        headers.set('Authorization', `Bearer ${apiToken}`);
        headers.set('Wanikani-Revision', '20170710');
    }
    
    const modifiedRequest = new Request(request, {
        headers: headers
    });
    
    return fetch(modifiedRequest);
}

/**
 * Fetch API and cache response
 */
async function fetchAndCacheAPI(request, cacheName) {
    const response = await fetchWithTokenInjection(request);
    
    if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
        console.log('[SW] API response cached');
    }
    
    return response;
}

/**
 * Create offline fallback response
 */
function createOfflineResponse() {
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - WaniKani Stats</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: #f5f5f5;
                    color: #212121;
                }
                .offline-container {
                    text-align: center;
                    padding: 2rem;
                    max-width: 400px;
                }
                h1 {
                    color: #aa00ff;
                    margin-bottom: 1rem;
                }
                p {
                    line-height: 1.6;
                    color: #757575;
                }
                button {
                    margin-top: 1.5rem;
                    padding: 0.75rem 1.5rem;
                    background: #aa00ff;
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    font-size: 1rem;
                    cursor: pointer;
                }
                button:hover {
                    background: #7700b3;
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <h1>í³¡ You're Offline</h1>
                <p>It looks like you've lost your internet connection. Don't worry! Your cached data is still available.</p>
                <button onclick="window.location.reload()">Try Again</button>
            </div>
        </body>
        </html>
    `;
    
    return new Response(html, {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
            'Content-Type': 'text/html'
        })
    });
}

// ============================================================================
// BACKGROUND SYNC (for future use)
// ============================================================================

self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync event:', event.tag);
    
    if (event.tag === 'sync-wanikani-data') {
        event.waitUntil(syncWaniKaniData());
    }
});

/**
 * Background sync WaniKani data
 */
async function syncWaniKaniData() {
    console.log('[SW] Background syncing WaniKani data...');
    
    // This will be used later for background updates
    // For now, just log
    
    try {
        // TODO: Implement background data sync
        console.log('[SW] Background sync complete');
        return Promise.resolve();
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
        return Promise.reject(error);
    }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clean up old caches
 */
async function cleanupCaches() {
    const cacheNames = await caches.keys();
    const currentCaches = Object.values(CACHES);
    
    return Promise.all(
        cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
                console.log('[SW] Deleting old cache:', cacheName);
                return caches.delete(cacheName);
            }
        })
    );
}

console.log('[SW] Service Worker loaded');
