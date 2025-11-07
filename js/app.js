// Main Application Entry Point

console.log('[App] Starting imports...');

import tokenManager from './utils/token-manager.js';
import db from './storage/db.js';
import { initialDataLoad } from './api/data-sync.js';
import { getCompleteLeechAnalysis } from './calculations/leech-detector.js';

console.log('[App] Imports successful!');
console.log('WaniKani Stats Tracker - Initializing...');

// DOM elements
let loadingScreen, loadingMessage, progressFill;
let tokenModal, tokenInput, tokenSubmitBtn, tokenError, rememberTokenCheckbox;
let appContainer;

// Service worker registration
let swRegistration = null;

// Store loaded data
let appData = null;

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
    rememberTokenCheckbox = document.getElementById('remember-token');
    
    appContainer = document.getElementById('app');
    
    console.log('[App] DOM references:', {
        tokenModal: !!tokenModal,
        tokenInput: !!tokenInput,
        tokenSubmitBtn: !!tokenSubmitBtn,
        rememberTokenCheckbox: !!rememberTokenCheckbox
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
    const remember = rememberTokenCheckbox?.checked ?? true;
    
    console.log('[App] Token length:', token?.length, 'Remember:', remember);
    
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
    if (rememberTokenCheckbox) rememberTokenCheckbox.disabled = true;

    console.log('[App] Validating token...');

    // Validate and set token
    const result = await tokenManager.setToken(token, remember);

    console.log('[App] Token validation result:', result);

    if (!result.success) {
        // Re-enable input
        if (tokenInput) tokenInput.disabled = false;
        if (tokenSubmitBtn) {
            tokenSubmitBtn.disabled = false;
            tokenSubmitBtn.textContent = 'Continue';
        }
        if (rememberTokenCheckbox) rememberTokenCheckbox.disabled = false;
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
    
    // Store data globally
    appData = result;
    
    // Analyze leeches
    updateLoadingProgress(7, 7, 'Analyzing leeches...');
    const leechAnalysis = await getCompleteLeechAnalysis(
        result.reviewStats,
        result.subjects,
        result.assignments
    );
    
    appData.leechAnalysis = leechAnalysis;
    
    // Show the app
    showApp();
    
    // Display loaded data with leech information
    displayDashboard();
}

// Display dashboard
function displayDashboard() {
    if (!appContainer || !appData) return;
    
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    const { user, assignments, subjects, leechAnalysis } = appData;
    
    mainContent.innerHTML = `
        <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 3rem;">
                <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem;">‚ú® Welcome Back!</h1>
                <p style="font-size: 1.25rem; color: var(--text-secondary);">
                    ${user.data.username} - Level ${user.data.level}
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
                    <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">TOTAL ITEMS</h3>
                    <p style="font-size: 2.5rem; font-weight: bold; color: var(--color-primary);">${assignments.length}</p>
                </div>
                
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
                    <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">SUBJECTS</h3>
                    <p style="font-size: 2.5rem; font-weight: bold; color: var(--color-primary);">${subjects.length}</p>
                </div>
                
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
                    <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">LEECHES DETECTED</h3>
                    <p style="font-size: 2.5rem; font-weight: bold; color: var(--color-error);">${leechAnalysis.stats.totalLeeches}</p>
                </div>
            </div>
            
            ${leechAnalysis.stats.totalLeeches > 0 ? `
                <div style="background: linear-gradient(135deg, var(--color-error) 0%, #c62828 100%); padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 2rem; color: white; box-shadow: var(--shadow-lg);">
                    <h2 style="margin-bottom: 1rem; font-size: 1.5rem;">Ì¥• Leech Analysis</h2>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Severe</div>
                            <div style="font-size: 2rem; font-weight: bold;">${leechAnalysis.stats.bySeverity.severe}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Moderate</div>
                            <div style="font-size: 2rem; font-weight: bold;">${leechAnalysis.stats.bySeverity.moderate}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Mild</div>
                            <div style="font-size: 2rem; font-weight: bold;">${leechAnalysis.stats.bySeverity.mild}</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">By Type:</div>
                        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
                            ${leechAnalysis.stats.byType.radical > 0 ? `<span>Radicals: <strong>${leechAnalysis.stats.byType.radical}</strong></span>` : ''}
                            ${leechAnalysis.stats.byType.kanji > 0 ? `<span>Kanji: <strong>${leechAnalysis.stats.byType.kanji}</strong></span>` : ''}
                            ${leechAnalysis.stats.byType.vocabulary > 0 ? `<span>Vocabulary: <strong>${leechAnalysis.stats.byType.vocabulary}</strong></span>` : ''}
                        </div>
                    </div>
                    
                    ${leechAnalysis.stats.confusionPairs > 0 ? `
                        <div style="margin-bottom: 1rem;">
                            <span style="font-size: 1.5rem; margin-right: 0.5rem;">‚ö†Ô∏è</span>
                            <strong>${leechAnalysis.stats.confusionPairs}</strong> confusion pairs detected
                        </div>
                    ` : ''}
                    
                    ${leechAnalysis.stats.rootCauses > 0 ? `
                        <div style="margin-bottom: 1rem;">
                            <span style="font-size: 1.5rem; margin-right: 0.5rem;">ÌæØ</span>
                            <strong>${leechAnalysis.stats.rootCauses}</strong> root cause components found
                        </div>
                    ` : ''}
                    
                    <button onclick="showLeechDetails()" class="btn-primary" style="background: white; color: var(--color-error); margin-top: 1rem;">
                        View Detailed Analysis
                    </button>
                </div>
            ` : `
                <div style="background: var(--color-success); padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 2rem; color: white; box-shadow: var(--shadow-lg); text-align: center;">
                    <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">Ìæâ No Leeches Detected!</h2>
                    <p style="font-size: 1.125rem; opacity: 0.9;">Your accuracy is looking great. Keep up the excellent work!</p>
                </div>
            `}
            
            <div style="text-align: center; padding: 2rem; background: var(--bg-secondary); border-radius: var(--radius-lg);">
                <h2 style="margin-bottom: 1rem;">Phase 4 Complete! ÌæØ</h2>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                    Leech detection system is fully operational.<br>
                    Dashboard UI (Phase 5) coming next!
                </p>
                <div style="color: var(--text-tertiary); font-size: 0.875rem; margin-top: 1rem;">
                    Service Worker: ${swRegistration ? '‚úÖ Active' : '‚ùå Inactive'}<br>
                    Offline support enabled
                </div>
                <button onclick="logout()" class="btn-secondary" style="margin-top: 1.5rem;">Logout</button>
            </div>
        </div>
    `;
}

// Show leech details (placeholder for Phase 5)
window.showLeechDetails = function() {
    if (!appData || !appData.leechAnalysis) return;
    
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    const { leeches, prioritizedStudyList, confusionPairs, rootCauses } = appData.leechAnalysis;
    
    // Display top 20 priority leeches
    const topLeeches = prioritizedStudyList.slice(0, 20);
    
    mainContent.innerHTML = `
        <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
            <div style="margin-bottom: 2rem;">
                <button onclick="displayDashboard()" class="btn-secondary">‚Üê Back to Dashboard</button>
            </div>
            
            <h1 style="margin-bottom: 2rem;">Ì¥• Leech Details</h1>
            
            ${rootCauses.length > 0 ? `
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-lg); margin-bottom: 2rem;">
                    <h2 style="margin-bottom: 1rem; color: var(--color-error);">ÌæØ Root Cause Components</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                        These components are causing problems in multiple items. Study these first!
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${rootCauses.slice(0, 5).map(rc => `
                            <div style="background: var(--bg-primary); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid var(--color-error);">
                                <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                                    ${rc.subject?.data?.characters || 'N/A'}
                                </div>
                                <div style="color: var(--text-secondary); font-size: 0.875rem;">
                                    Affecting <strong>${rc.affectedLeechCount}</strong> other leeches
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-lg); margin-bottom: 2rem;">
                <h2 style="margin-bottom: 1rem;">Ì≥ã Priority Study List (Top 20)</h2>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${topLeeches.map(leech => {
                        const char = leech.subject?.data?.characters || 'N/A';
                        const meanings = leech.subject?.data?.meanings?.map(m => m.meaning).join(', ') || 'N/A';
                        const severityColor = leech.severityCategory === 'severe' ? 'var(--color-error)' : 
                                            leech.severityCategory === 'moderate' ? 'var(--color-warning)' : 
                                            'var(--color-info)';
                        
                        return `
                            <div style="background: var(--bg-primary); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid ${severityColor};">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                    <div>
                                        <span style="font-size: 2rem; font-weight: bold;">${char}</span>
                                        <span style="margin-left: 1rem; color: var(--text-secondary);">${meanings}</span>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 0.75rem; color: var(--text-tertiary);">Severity</div>
                                        <div style="font-size: 1.5rem; font-weight: bold; color: ${severityColor};">${leech.severity}</div>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem;">
                                    <div>Accuracy: <strong>${leech.accuracy.toFixed(1)}%</strong></div>
                                    <div>Reviews: <strong>${leech.totalReviews}</strong></div>
                                    <div>Type: <strong>${leech.subject_type}</strong></div>
                                </div>
                                ${leech.recommendations ? `
                                    <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--bg-tertiary); font-size: 0.875rem;">
                                        <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">
                                            <strong>Focus:</strong> ${leech.recommendations.focus.join(', ')}
                                        </div>
                                        ${leech.recommendations.studyTips.length > 0 ? `
                                            <div style="color: var(--text-secondary); margin-top: 0.5rem;">
                                                ${leech.recommendations.studyTips[0]}
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            ${confusionPairs.length > 0 ? `
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-lg);">
                    <h2 style="margin-bottom: 1rem;">‚ö†Ô∏è Confusion Pairs (Top 10)</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                        These similar items are both giving you trouble. Study the differences!
                    </p>
                    <div style="display: grid; gap: 1rem;">
                        ${confusionPairs.slice(0, 10).map(pair => `
                            <div style="background: var(--bg-primary); padding: 1rem; border-radius: var(--radius-md);">
                                <div style="display: flex; gap: 2rem; align-items: center; justify-content: center;">
                                    <div style="text-align: center;">
                                        <div style="font-size: 3rem; font-weight: bold;">${pair.subject1.data?.data?.characters || 'N/A'}</div>
                                        <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                            ${pair.subject1.data?.data?.meanings?.[0]?.meaning || 'N/A'}
                                        </div>
                                        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                                            Accuracy: ${pair.subject1.leech.accuracy.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div style="font-size: 2rem; color: var(--text-tertiary);">‚öîÔ∏è</div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 3rem; font-weight: bold;">${pair.subject2.data?.data?.characters || 'N/A'}</div>
                                        <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                            ${pair.subject2.data?.data?.meanings?.[0]?.meaning || 'N/A'}
                                        </div>
                                        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                                            Accuracy: ${pair.subject2.leech.accuracy.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
};

// Logout function (global for onclick)
window.logout = function() {
    const confirmed = confirm('Are you sure you want to logout? This will clear your saved token.');
    if (confirmed) {
        tokenManager.clearToken();
        window.location.reload();
    }
};

// Make displayDashboard global
window.displayDashboard = displayDashboard;

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            swRegistration = await navigator.serviceWorker.register('./sw.js');
            console.log('[App] Service Worker registered:', swRegistration.scope);

            // Check for updates
            swRegistration.addEventListener('updatefound', () => {
                const newWorker = swRegistration.installing;
                console.log('[App] Service Worker update found');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('[App] New service worker installed, update available');
                        showUpdateNotification();
                    }
                });
            });

        } catch (error) {
            console.error('[App] Service Worker registration failed:', error);
        }
    });
}

// Show update notification
function showUpdateNotification() {
    const shouldUpdate = confirm(
        'A new version of WaniKani Stats is available! Would you like to update now?'
    );

    if (shouldUpdate) {
        if (swRegistration && swRegistration.waiting) {
            swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
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

        // Try to restore saved token
        console.log('[App] Checking for saved token...');
        const tokenRestored = await tokenManager.restoreToken();
        
        if (tokenRestored) {
            console.log('[App] Token restored from storage');
            // Show loading screen and load data
            if (loadingScreen) loadingScreen.style.display = 'flex';
            await loadInitialData();
        } else {
            console.log('[App] No saved token found, showing token modal');
            // Show token modal after brief delay
            setTimeout(() => {
                showTokenModal();
            }, 500);
        }
        
        console.log('[App] Initialization complete');
        
    } catch (error) {
        console.error('[App] Initialization error:', error);
        alert(`Initialization failed: ${error.message}`);
    }
});

console.log('[App] Setup complete (module loaded)');
