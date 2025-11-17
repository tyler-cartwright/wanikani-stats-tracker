// Navigation Component
// Handles app navigation and view switching

export class Navigation {
    constructor() {
        this.currentView = 'dashboard';
        this.views = {
            dashboard: 'Dashboard',
            leeches: 'Leeches',
            progress: 'Progress',
            accuracy: 'Accuracy',
            reviews: 'Reviews'
        };
    }

    /**
     * Render navigation bar
     * @returns {string} HTML string
     */
    render() {
        return `
            <nav class="main-nav">
                <div class="nav-container">
                    <div class="nav-brand">
                        <span class="nav-logo"></span>
                        <span class="nav-title">WK Stats</span>
                    </div>
                    
                    <div class="nav-links">
                        ${Object.entries(this.views).map(([key, label]) => `
                            <button 
                                class="nav-link ${key === this.currentView ? 'active' : ''}"
                                data-view="${key}"
                                onclick="window.navigateTo('${key}')"
                            >
                                ${this.getViewIcon(key)}
                                <span>${label}</span>
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="nav-actions">
                        <div class="nav-dropdown">
                            <button class="nav-link" onclick="window.toggleExportMenu()" title="Export Data">
                                <span class="nav-icon">📥</span>
                                Export
                            </button>
                            <div id="export-dropdown" class="dropdown-menu hidden">
                                <button class="dropdown-item" onclick="window.exportData('assignments')">
                                    📋 Assignments (CSV)
                                </button>
                                <button class="dropdown-item" onclick="window.exportData('review-stats')">
                                    📊 Review Stats (CSV)
                                </button>
                                <button class="dropdown-item" onclick="window.exportData('leeches')">
                                    🐛 Leeches (CSV)
                                </button>
                                <button class="dropdown-item" onclick="window.exportData('level-progressions')">
                                    📈 Level Progress (CSV)
                                </button>
                                <div class="dropdown-divider"></div>
                                <button class="dropdown-item" onclick="window.exportData('all-json')">
                                    💾 Full Backup (JSON)
                                </button>
                            </div>
                        </div>
                        <button class="nav-link" onclick="window.refreshData()" title="Refresh Data">
                            🔄 Refresh
                        </button>
                        <button class="nav-link" onclick="window.logout()" title="Logout">
                            🚪 Logout
                        </button>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Get icon for view
     * @param {string} view - View name
     * @returns {string} Icon HTML
     */
    getViewIcon(view) {
        const icons = {
            dashboard: '',
            leeches: '',
            progress: '',
            accuracy: '',
            reviews: ''
        };
        return `<span class="nav-icon">${icons[view] || ''}</span>`;
    }

    /**
     * Set active view
     * @param {string} view - View name
     */
    setActiveView(view) {
        this.currentView = view;
        
        // Update active state in DOM
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.view === view) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// Export singleton instance
const navigation = new Navigation();
export default navigation;
