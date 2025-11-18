// Swipe Gesture Handler for Mobile Navigation
// Enables swipe left/right to navigate between views

export class SwipeHandler {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.distX = 0;
        this.distY = 0;
        this.threshold = 100; // Minimum swipe distance in pixels (increased from 50)
        this.allowedTime = 250; // Maximum time for swipe in ms (decreased from 300)
        this.startTime = 0;
        this.elapsedTime = 0;
        this.touchStartElement = null; // Track what element the touch started on

        this.views = ['dashboard', 'leeches', 'progress', 'accuracy'];
        this.init();
    }

    /**
     * Initialize swipe event listeners
     */
    init() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Touch events - use passive: false on touchmove so we can preventDefault if needed
        mainContent.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        mainContent.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        mainContent.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

        console.log('[SwipeHandler] Initialized with threshold:', this.threshold, 'allowedTime:', this.allowedTime);
    }

    /**
     * Check if element or its parents are scrollable
     * @param {Element} element - Element to check
     * @returns {boolean}
     */
    isScrollableElement(element) {
        if (!element || element === document.body) return false;

        const scrollableSelectors = [
            '.data-table',
            '.table-container',
            '.assignments-table-container',
            '.time-heatmap',
            '.heatmap-container',
            '.timeline',
            '.accuracy-heatmap',
            'table',
            '[style*="overflow"]'
        ];

        // Check if element or any parent matches scrollable selectors
        let current = element;
        while (current && current !== document.body) {
            // Check if element matches any scrollable selector
            if (scrollableSelectors.some(selector => current.matches && current.matches(selector))) {
                return true;
            }

            // Check if element has horizontal scroll
            const style = window.getComputedStyle(current);
            const hasHorizontalScroll = style.overflowX === 'scroll' ||
                                       style.overflowX === 'auto' ||
                                       current.scrollWidth > current.clientWidth;

            if (hasHorizontalScroll) {
                return true;
            }

            current = current.parentElement;
        }

        return false;
    }

    /**
     * Handle touch start
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        const touchObj = e.changedTouches[0];
        this.startX = touchObj.pageX;
        this.startY = touchObj.pageY;
        this.startTime = new Date().getTime();
        this.touchStartElement = e.target;
    }

    /**
     * Handle touch move
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        const touchObj = e.changedTouches[0];
        const distX = Math.abs(touchObj.pageX - this.startX);
        const distY = Math.abs(touchObj.pageY - this.startY);

        this.distX = touchObj.pageX - this.startX;
        this.distY = touchObj.pageY - this.startY;

        // Don't prevent default if touch started on scrollable element
        // This allows normal scrolling behavior
        if (this.isScrollableElement(this.touchStartElement)) {
            return;
        }

        // Only prevent default if it looks like a clear horizontal swipe
        // and not started on a scrollable element
        if (distX > distY && distX > 30) {
            // This is likely a navigation swipe, prevent default scroll
            e.preventDefault();
        }
    }

    /**
     * Handle touch end
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd(e) {
        const touchObj = e.changedTouches[0];
        this.distX = touchObj.pageX - this.startX;
        this.distY = touchObj.pageY - this.startY;
        this.elapsedTime = new Date().getTime() - this.startTime;

        // Don't trigger navigation if touch started on scrollable element
        if (this.isScrollableElement(this.touchStartElement)) {
            this.reset();
            return;
        }

        // Check if swipe qualifies
        if (this.isSwipe()) {
            const direction = this.getSwipeDirection();

            if (direction === 'left' || direction === 'right') {
                this.navigate(direction);
            }
        }

        this.reset();
    }

    /**
     * Reset swipe state
     */
    reset() {
        this.startX = 0;
        this.startY = 0;
        this.distX = 0;
        this.distY = 0;
        this.touchStartElement = null;
    }

    /**
     * Check if gesture qualifies as a swipe
     * @returns {boolean}
     */
    isSwipe() {
        return (
            this.elapsedTime <= this.allowedTime &&
            Math.abs(this.distX) >= this.threshold &&
            Math.abs(this.distY) <= Math.abs(this.distX) * 0.3 // Horizontal swipe must be much more prominent (was 0.5)
        );
    }

    /**
     * Get swipe direction
     * @returns {string|null} Direction or null
     */
    getSwipeDirection() {
        if (Math.abs(this.distX) >= this.threshold) {
            return this.distX < 0 ? 'left' : 'right';
        }
        return null;
    }

    /**
     * Get current view from window
     * @returns {string}
     */
    getCurrentView() {
        // Try multiple ways to get current view
        if (window.getCurrentView && typeof window.getCurrentView === 'function') {
            return window.getCurrentView();
        }

        // Check for active nav link
        const activeLink = document.querySelector('.nav-link.active');
        if (activeLink) {
            const view = activeLink.getAttribute('data-view');
            if (view) return view;
        }

        // Default to dashboard
        return 'dashboard';
    }

    /**
     * Navigate based on swipe direction
     * @param {string} direction - 'left' or 'right'
     */
    navigate(direction) {
        // Get current view
        const currentView = this.getCurrentView();
        const currentIndex = this.views.indexOf(currentView);

        if (currentIndex === -1) {
            console.log('[SwipeHandler] Unknown view:', currentView);
            return;
        }

        let targetIndex;
        if (direction === 'left') {
            // Swipe left = next view
            targetIndex = (currentIndex + 1) % this.views.length;
        } else {
            // Swipe right = previous view
            targetIndex = (currentIndex - 1 + this.views.length) % this.views.length;
        }

        const targetView = this.views[targetIndex];

        // Add visual feedback
        this.showSwipeFeedback(direction);

        // Navigate
        if (window.navigateTo) {
            window.navigateTo(targetView);
        }

        console.log(`[SwipeHandler] Navigated ${direction} from ${currentView} to ${targetView}`);
    }

    /**
     * Show visual feedback for swipe
     * @param {string} direction - 'left' or 'right'
     */
    showSwipeFeedback(direction) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Add animation class
        mainContent.style.transition = 'transform 0.3s ease-out';
        mainContent.style.transform = direction === 'left' ? 'translateX(-20px)' : 'translateX(20px)';
        mainContent.style.opacity = '0.8';

        // Reset after animation
        setTimeout(() => {
            mainContent.style.transform = '';
            mainContent.style.opacity = '';
            setTimeout(() => {
                mainContent.style.transition = '';
            }, 300);
        }, 100);
    }
}

// Auto-initialize on mobile devices
if ('ontouchstart' in window) {
    window.addEventListener('DOMContentLoaded', () => {
        window.swipeHandler = new SwipeHandler();
    });
}

export default SwipeHandler;
