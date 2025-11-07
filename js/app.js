// Main Application Entry Point

console.log('[App] Starting imports...');

import tokenManager from './utils/token-manager.js';
import db from './storage/db.js';
import { initialDataLoad } from './api/data-sync.js';

console.log('[App] Imports successful!');
console.log('WaniKani Stats Tracker - Initializing...');

// DOM elements
let loadingScreen, loadingMessage, progressFill;
let tokenModal, tokenInput, tokenSubmitBtn, tokenError;
let appContainer;

// Initialize DOM references
function initDOMReferences() {
    console.log('[App] Getting DOM references...');
    loadingScreen = document.getElementById('loading-screen');
    loadingMessage = document.getElementById('loading-message');
    progressFill = document.getElementById('progress-fill');
    
    tokenModal = document.getElementById('token-modal');
    tokenInput = document.getElementById('api-token-input');
    tokenSubmitBtn = document.getElementById('token-submit-btn');
    tokenError = document.getElementById('token-error');
    
    appContainer = document.getElementById('app');
    
    console.log('[App] DOM references:', {
        tokenModal: !!tokenModal,
        tokenInput: !!tokenInput,
        tokenSubmitBtn: !!tokenSubmitBtn
    });
}

// Update loading progress
function updateLoadingProgress(step, total, message) {
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
    if (progressFill) {
        const percentage = (step / total) * 100;
        progressFill.style.width = `${percentage}%`;
    }
}

// Show error in token modal
function showTokenError(message) {
    if (tokenError) {
        tokenError.textContent = message;
        tokenError.style.display = 'block';
    }
}

// Hide token error
function hideTokenError() {
    if (tokenError) {
        tokenError.style.display = 'none';
    }
}

// Show token modal
function showTokenModal() {
    console.log('[App] Showing token modal');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    if (tokenModal) {
        tokenModal.style.display = 'flex';
    }
    if (tokenInput) {
        tokenInput.focus();
    }
}

// Hide token modal
function hideTokenModal() {
    if (tokenModal) {
        tokenModal.style.display = 'none';
    }
}

// Show app
function showApp() {
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    if (tokenModal) {
        tokenModal.style.display = 'none';
    }
    if (appContainer) {
        appContainer.style.display = 'flex';
    }
}

// Handle token submission
async function handleTokenSubmit() {
    console.log('[App] Token submit clicked!');
    const token = tokenInput?.value?.trim();
    
    console.log('[App] Token length:', token?.length);
    
    if (!token) {
        showTokenError('Please enter your API token');
        return;
    }

    hideTokenError();
    
    // Disable input while validating
    if (tokenInput) tokenInput.disabled = true;
    if (tokenSubmitBtn) {
        tokenSubmitBtn.disabled = true;
        tokenSubmitBtn.textContent = 'Validating...';
    }

    console.log('[App] Validating token...');

    // Validate and set token
    const result = await tokenManager.setToken(token);

    console.log('[App] Token validation result:', result);

    if (!result.success) {
        // Re-enable input
        if (tokenInput) tokenInput.disabled = false;
        if (tokenSubmitBtn) {
            tokenSubmitBtn.disabled = false;
            tokenSubmitBtn.textContent = 'Continue';
        }
        showTokenError(result.error);
        return;
    }

    // Token is valid! Start loading data
    hideTokenModal();
    if (loadingScreen) loadingScreen.style.display = 'flex';
    
    await loadInitialData();
}

// Load initial data
async function loadInitialData() {
    console.log('[App] Loading initial data...');

    const result = await initialDataLoad(updateLoadingProgress);

    if (!result.success) {
        alert(`Failed to load data: ${result.error}\n\nPlease check your internet connection and try again.`);
        showTokenModal();
        return;
    }

    console.log('[App] Initial data loaded successfully');
    
    // Show the app
    showApp();
    
    // Display loaded data
    if (appContainer) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h1>✨ Data Loaded Successfully!</h1>
                    <p>Welcome, ${result.user.data.username}!</p>
                    <p>Level: ${result.user.data.level}</p>
                    <p>Assignments: ${result.assignments.length}</p>
                    <p>Subjects: ${result.subjects.length}</p>
                    <br>
                    <p><strong>Dashboard UI coming in Phase 5!</strong></p>
                </div>
            `;
        }
    }
}

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
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[App] DOM loaded, initializing...');
    
    try {
        initDOMReferences();

        // Initialize database
        console.log('[App] Initializing database...');
        await db.init();
        console.log('[App] Database initialized successfully');

        // Set up token input handler
        console.log('[App] Setting up event listeners...');
        if (tokenSubmitBtn) {
            tokenSubmitBtn.addEventListener('click', () => {
                console.log('[App] Button clicked (from event listener)');
                handleTokenSubmit();
            });
            console.log('[App] Click event listener attached to button');
        } else {
            console.error('[App] Could not find token submit button!');
        }
        
        if (tokenInput) {
            tokenInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('[App] Enter key pressed');
                    handleTokenSubmit();
                }
            });
            console.log('[App] Keypress event listener attached to input');
        } else {
            console.error('[App] Could not find token input!');
        }

        // Check if we have a token
        // For now, always show token modal (we'll add persistence later)
        setTimeout(() => {
            showTokenModal();
        }, 500);
        
        console.log('[App] Initialization complete');
        
    } catch (error) {
        console.error('[App] Initialization error:', error);
        alert(`Initialization failed: ${error.message}`);
    }
});

console.log('[App] Setup complete (module loaded)');
