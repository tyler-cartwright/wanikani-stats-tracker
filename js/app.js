// Main Application Entry Point

console.log('[App] Starting imports...');

import tokenManager from './utils/token-manager.js';
import db from './storage/db.js';
import { initialDataLoad, quickRefresh } from './api/data-sync.js';
import { getCompleteLeechAnalysis } from './calculations/leech-detector.js';
import navigation from './components/navigation.js';
import Dashboard from './components/dashboard.js';
import AssignmentsTable from './components/assignments-table.js';
import LevelTimeline from './components/level-timeline.js';

console.log('[App] Imports successful!');
console.log('WaniKani Stats Tracker - Initializing...');

// DOM elements
let loadingScreen, loadingMessage, progressFill;
let tokenModal, tokenInput, tokenSubmitBtn, tokenError, rememberTokenCheckbox;
let appContainer, mainContent;

// Service worker registration
let swRegistration = null;

// Store loaded data
let appData = null;

// Current view
let currentView = 'dashboard';

// Table instance
let assignmentsTable = null;

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
    mainContent = document.getElementById('main-content');
    
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
        tokenError.classList.remove('hidden');
    }
}

// Hide token error
function hideTokenError() {
    if (tokenError) {
        tokenError.classList.add('hidden');
    }
}

// Show token modal
function showTokenModal() {
    console.log('[App] Showing token modal');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
    if (tokenModal) {
        tokenModal.classList.remove('hidden');
    }
    if (tokenInput) {
        tokenInput.focus();
    }
}

// Hide token modal
function hideTokenModal() {
    if (tokenModal) {
        tokenModal.classList.add('hidden');
    }
}

// Show app
function showApp() {
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
    if (tokenModal) {
        tokenModal.classList.add('hidden');
    }
    if (appContainer) {
        appContainer.classList.remove('hidden');
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
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
    
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
    
    // Merge accuracy data into assignments
    appData.assignments = appData.assignments.map(assignment => {
        const stats = appData.reviewStats.find(s => s.data.subject_id === assignment.data.subject_id);
        return {
            ...assignment,
            accuracy: stats?.data?.percentage_correct
        };
    });
    
    // Show the app
    showApp();
    
    // Render navigation
    renderNavigation();
    
    // Display dashboard
    navigateTo('dashboard');
}

// Render navigation
function renderNavigation() {
    const navPlaceholder = document.getElementById('navigation-placeholder');
    if (navPlaceholder) {
        navPlaceholder.innerHTML = navigation.render();
    }
}

// Navigate to view
window.navigateTo = function(view) {
    currentView = view;
    navigation.setActiveView(view);
    
    if (!mainContent || !appData) return;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    switch (view) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'leeches':
            renderLeechesView();
            break;
        case 'progress':
            renderProgressView();
            break;
        case 'accuracy':
            renderAccuracyView();
            break;
        case 'reviews':
            renderReviewsView();
            break;
        default:
            renderDashboard();
    }
};

// Render dashboard
function renderDashboard() {
    const dashboard = new Dashboard(appData);
    mainContent.innerHTML = dashboard.render();
}

// Render progress view (now with assignments table and timeline)
function renderProgressView() {
    assignmentsTable = new AssignmentsTable(appData.assignments, appData.subjects);
    const timeline = new LevelTimeline(appData.levelProgressions, appData.user);
    
    mainContent.innerHTML = `
        <div class="dashboard">
            <h1 class="dashboard-title">Ì≥à Progress Tracking</h1>
            
            <div class="card">
                <h2 class="card-title">Level Timeline</h2>
                ${timeline.render()}
            </div>
            
            <div class="card" style="margin-top: var(--spacing-lg);">
                <h2 class="card-title">All Assignments</h2>
                <div id="assignments-table-container"></div>
            </div>
        </div>
    `;
    
    // Render table after DOM is ready
    setTimeout(() => {
        const container = document.getElementById('assignments-table-container');
        if (container) {
            container.innerHTML = assignmentsTable.render();
        }
    }, 0);
}

// Table filter and sort handlers
window.updateTableFilter = function(filterType, value) {
    if (!assignmentsTable) return;
    assignmentsTable.filters[filterType] = value;
    const container = document.getElementById('assignments-table-container');
    if (container) {
        container.innerHTML = assignmentsTable.render();
    }
};

window.resetTableFilters = function() {
    if (!assignmentsTable) return;
    assignmentsTable.filters = {
        type: 'all',
        level: 'all',
        srsStage: 'all',
        search: ''
    };
    
    // Reset form elements
    const typeSelect = document.getElementById('filter-type');
    const srsSelect = document.getElementById('filter-srs');
    const searchInput = document.getElementById('filter-search');
    
    if (typeSelect) typeSelect.value = 'all';
    if (srsSelect) srsSelect.value = 'all';
    if (searchInput) searchInput.value = '';
    
    const container = document.getElementById('assignments-table-container');
    if (container) {
        container.innerHTML = assignmentsTable.render();
    }
};

window.sortTable = function(column) {
    if (!assignmentsTable) return;
    
    if (assignmentsTable.currentSort.column === column) {
        // Toggle direction
        assignmentsTable.currentSort.direction = 
            assignmentsTable.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        assignmentsTable.currentSort.column = column;
        assignmentsTable.currentSort.direction = 'asc';
    }
    
    const container = document.getElementById('assignments-table-container');
    if (container) {
        container.innerHTML = assignmentsTable.render();
    }
};

window.showItemDetail = function(subjectId) {
    // TODO: Implement in next phase
    console.log('Show item detail:', subjectId);
    alert('Item detail view coming soon!');
};

// Render leeches view (from Phase 4)
function renderLeechesView() {
    const { leeches, prioritizedStudyList, confusionPairs, rootCauses } = appData.leechAnalysis;
    
    const topLeeches = prioritizedStudyList.slice(0, 20);
    
    mainContent.innerHTML = `
        <div class="dashboard">
            <h1 class="dashboard-title">Ì¥• Leech Management</h1>
            
            ${rootCauses.length > 0 ? `
                <div class="card">
                    <h2 class="card-title">ÌæØ Root Cause Components</h2>
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
                        These components are causing problems in multiple items. Study these first!
                    </p>
                    <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                        ${rootCauses.slice(0, 5).map(rc => `
                            <div style="background: var(--bg-primary); padding: var(--spacing-lg); border-radius: var(--radius-md); border-left: 4px solid var(--color-error);">
                                <div style="font-size: 2rem; font-weight: bold; margin-bottom: var(--spacing-xs);">
                                    ${rc.subject?.data?.characters || 'N/A'}
                                </div>
                                <div style="color: var(--text-secondary);">
                                    Affecting <strong>${rc.affectedLeechCount}</strong> other leeches
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="card">
                <h2 class="card-title">Ì≥ã Priority Study List (Top 20)</h2>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-md); margin-top: var(--spacing-lg);">
                    ${topLeeches.map(leech => {
                        const char = leech.subject?.data?.characters || 'N/A';
                        const meanings = leech.subject?.data?.meanings?.map(m => m.meaning).join(', ') || 'N/A';
                        const severityColor = leech.severityCategory === 'severe' ? 'var(--color-error)' : 
                                            leech.severityCategory === 'moderate' ? 'var(--color-warning)' : 
                                            'var(--color-info)';
                        
                        return `
                            <div style="background: var(--bg-primary); padding: var(--spacing-lg); border-radius: var(--radius-md); border-left: 4px solid ${severityColor};">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
                                    <div>
                                        <span style="font-size: 2.5rem; font-weight: bold;">${char}</span>
                                        <span style="margin-left: var(--spacing-md); color: var(--text-secondary);">${meanings}</span>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Severity</div>
                                        <div style="font-size: 2rem; font-weight: bold; color: ${severityColor};">${leech.severity}</div>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--spacing-sm); margin-bottom: var(--spacing-md); font-size: var(--font-size-sm);">
                                    <div>Accuracy: <strong>${leech.accuracy.toFixed(1)}%</strong></div>
                                    <div>Reviews: <strong>${leech.totalReviews}</strong></div>
                                    <div>Type: <strong>${leech.subject_type}</strong></div>
                                </div>
                                ${leech.recommendations ? `
                                    <div style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--bg-tertiary); font-size: var(--font-size-sm);">
                                        <div style="color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                                            <strong>Focus:</strong> ${leech.recommendations.focus.join(', ')}
                                        </div>
                                        ${leech.recommendations.studyTips.length > 0 ? `
                                            <div style="color: var(--text-secondary);">
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
                <div class="card">
                    <h2 class="card-title">‚ö†Ô∏è Confusion Pairs (Top 10)</h2>
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
                        These similar items are both giving you trouble. Study the differences!
                    </p>
                    <div style="display: grid; gap: var(--spacing-md);">
                        ${confusionPairs.slice(0, 10).map(pair => `
                            <div style="background: var(--bg-primary); padding: var(--spacing-lg); border-radius: var(--radius-md);">
                                <div style="display: flex; gap: var(--spacing-2xl); align-items: center; justify-content: center;">
                                    <div style="text-align: center;">
                                        <div style="font-size: 3.5rem; font-weight: bold;">${pair.subject1.data?.data?.characters || 'N/A'}</div>
                                        <div style="font-size: var(--font-size-base); color: var(--text-secondary); margin-top: var(--spacing-xs);">
                                            ${pair.subject1.data?.data?.meanings?.[0]?.meaning || 'N/A'}
                                        </div>
                                        <div style="font-size: var(--font-size-sm); color: var(--text-tertiary); margin-top: var(--spacing-xs);">
                                            Accuracy: ${pair.subject1.leech.accuracy.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div style="font-size: 2rem; color: var(--text-tertiary);">‚öîÔ∏è</div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 3.5rem; font-weight: bold;">${pair.subject2.data?.data?.characters || 'N/A'}</div>
                                        <div style="font-size: var(--font-size-base); color: var(--text-secondary); margin-top: var(--spacing-xs);">
                                            ${pair.subject2.data?.data?.meanings?.[0]?.meaning || 'N/A'}
                                        </div>
                                        <div style="font-size: var(--font-size-sm); color: var(--text-tertiary); margin-top: var(--spacing-xs);">
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
}

// Placeholder views
function renderAccuracyView() {
    mainContent.innerHTML = `
        <div class="dashboard">
            <h1 class="dashboard-title">ÌæØ Accuracy Analysis</h1>
            <div class="card">
                <p style="text-align: center; padding: var(--spacing-2xl); color: var(--text-secondary);">
                    Detailed accuracy analysis coming soon!<br>
                    <button class="btn-primary" style="margin-top: var(--spacing-lg);" onclick="window.navigateTo('dashboard')">
                        Back to Dashboard
                    </button>
                </p>
            </div>
        </div>
    `;
}

function renderReviewsView() {
    mainContent.innerHTML = `
        <div class="dashboard">
            <h1 class="dashboard-title">Ì≥ö Review History</h1>
            <div class="card">
                <p style="text-align: center; padding: var(--spacing-2xl); color: var(--text-secondary);">
                    Review history coming soon!<br>
                    <button class="btn-primary" style="margin-top: var(--spacing-lg);" onclick="window.navigateTo('dashboard')">
                        Back to Dashboard
                    </button>
                </p>
            </div>
        </div>
    `;
}

// Refresh data
window.refreshData = async function() {
    if (!appData) return;
    
    const confirmed = confirm('Refresh data from WaniKani? This may take a moment.');
    if (!confirmed) return;
    
    // Show loading
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
        loadingMessage.textContent = 'Refreshing data...';
    }
    
    try {
        const result = await quickRefresh();
        
        if (result.success) {
            // Update app data
            appData.summary = result.summary;
            appData.assignments = result.assignments;
            appData.reviewStats = result.reviewStats;
            
            // Merge accuracy data
            appData.assignments = appData.assignments.map(assignment => {
                const stats = appData.reviewStats.find(s => s.data.subject_id === assignment.data.subject_id);
                return {
                    ...assignment,
                    accuracy: stats?.data?.percentage_correct
                };
            });
            
            // Re-analyze leeches
            const leechAnalysis = await getCompleteLeechAnalysis(
                result.reviewStats,
                appData.subjects,
                result.assignments
            );
            appData.leechAnalysis = leechAnalysis;
            
            // Re-render current view
            navigateTo(currentView);
            
            alert('Data refreshed successfully!');
        } else {
            alert('Failed to refresh data: ' + result.error);
        }
    } catch (error) {
        console.error('[App] Refresh failed:', error);
        alert('Failed to refresh data. Please try again.');
    } finally {
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }
};

// Logout function (global for onclick)
window.logout = function() {
    const confirmed = confirm('Are you sure you want to logout? This will clear your saved token.');
    if (confirmed) {
        tokenManager.clearToken();
        window.location.reload();
    }
};

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
            if (loadingScreen) loadingScreen.classList.remove('hidden');
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
