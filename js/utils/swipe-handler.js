// Swipe Gesture Handler for Mobile Navigation
// Enables swipe left/right to navigate between views

export class SwipeHandler {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.distX = 0;
        this.distY = 0;
        this.threshold = 50; // Minimum swipe distance in pixels
        this.allowedTime = 300; // Maximum time for swipe in ms
        this.startTime = 0;
        this.elapsedTime = 0;

        this.views = ['dashboard', 'leeches', 'progress', 'accuracy'];
        this.init();
    }

    /**
     * Initialize swipe event listeners
     */
    init() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Touch events
        mainContent.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        mainContent.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        mainContent.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

        console.log('[SwipeHandler] Initialized');
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
    }

    /**
     * Handle touch move
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        // Prevent default only for horizontal swipes
        const touchObj = e.changedTouches[0];
        const distX = Math.abs(touchObj.pageX - this.startX);
        const distY = Math.abs(touchObj.pageY - this.startY);

        // If horizontal swipe is more prominent than vertical, we might want to navigate
        if (distX > distY && distX > 10) {
            // Allow horizontal swipe, but still let vertical scroll happen
            this.distX = touchObj.pageX - this.startX;
            this.distY = touchObj.pageY - this.startY;
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

        // Check if swipe qualifies
        if (this.isSwipe()) {
            const direction = this.getSwipeDirection();

            if (direction === 'left' || direction === 'right') {
                this.navigate(direction);
            }
        }

        // Reset
        this.startX = 0;
        this.startY = 0;
        this.distX = 0;
        this.distY = 0;
    }

    /**
     * Check if gesture qualifies as a swipe
     * @returns {boolean}
     */
    isSwipe() {
        return (
            this.elapsedTime <= this.allowedTime &&
            Math.abs(this.distX) >= this.threshold &&
            Math.abs(this.distY) <= Math.abs(this.distX) * 0.5 // Horizontal swipe must be more prominent
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
     * Navigate based on swipe direction
     * @param {string} direction - 'left' or 'right'
     */
    navigate(direction) {
        // Get current view from navigation or window
        const currentView = window.navigation?.currentView || 'dashboard';
        const currentIndex = this.views.indexOf(currentView);

        if (currentIndex === -1) return;

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
