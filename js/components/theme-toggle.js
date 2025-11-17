// Theme Toggle Component
// Handles dark/light mode switching with localStorage persistence

export class ThemeToggle {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getPreferredTheme();
        this.applyTheme(this.currentTheme);
    }

    /**
     * Get stored theme from localStorage
     * @returns {string|null} Stored theme or null
     */
    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    /**
     * Get user's preferred theme from system
     * @returns {string} 'dark' or 'light'
     */
    getPreferredTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Apply theme to document
     * @param {string} theme - 'dark' or 'light'
     */
    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
    }

    /**
     * Toggle between dark and light themes
     */
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);

        // Dispatch event for other components to react
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: newTheme }
        }));
    }

    /**
     * Render theme toggle button
     * @returns {string} HTML string
     */
    render() {
        const isDark = this.currentTheme === 'dark';
        return `
            <button
                class="theme-toggle"
                onclick="window.toggleTheme()"
                aria-label="Toggle dark mode"
                title="${isDark ? 'Switch to light mode' : 'Switch to dark mode'}">
                <span class="theme-icon">${isDark ? '☀️' : '🌙'}</span>
            </button>
        `;
    }
}

// Initialize theme toggle globally
window.themeToggle = new ThemeToggle();

// Expose toggle function globally for onclick handlers
window.toggleTheme = () => {
    window.themeToggle.toggle();
    // Re-render navigation to update icon
    const navElement = document.querySelector('.main-nav');
    if (navElement && window.navigation) {
        navElement.innerHTML = window.navigation.render();
    }
};

export default ThemeToggle;
