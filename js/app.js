// Main Application Entry Point

console.log('WaniKani Stats Tracker - Initializing...');

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('[App] Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.error('[App] Service Worker registration failed:', error);
            });
    });
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM loaded, starting initialization...');
    
    // Update loading message
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.textContent = 'Loading...';
    }
    
    // For now, just simulate loading
    setTimeout(() => {
        console.log('[App] Initialization complete (placeholder)');
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Show token modal (since we don't have a token yet)
        const tokenModal = document.getElementById('token-modal');
        if (tokenModal) {
            tokenModal.style.display = 'flex';
        }
    }, 1000);
});

console.log('[App] Setup complete');
