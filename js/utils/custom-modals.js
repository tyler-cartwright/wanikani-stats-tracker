// Custom Modal Utilities
// Replaces browser confirm() and alert() with styled modals

/**
 * Show a custom confirm dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Object} options - Optional configuration
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export function showConfirm(title, message, options = {}) {
    return new Promise((resolve) => {
        const {
            confirmText = 'Continue',
            cancelText = 'Cancel',
            confirmClass = 'btn-primary',
            cancelClass = 'btn-secondary',
            icon = '⚠️'
        } = options;

        // Create modal elements
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: var(--z-index-modal-backdrop);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
        `;

        const modal = document.createElement('div');
        modal.className = 'custom-confirm-modal';
        modal.style.cssText = `
            background: var(--bg-primary);
            border-radius: var(--radius-lg);
            padding: var(--spacing-xl);
            max-width: 500px;
            width: 90%;
            box-shadow: var(--shadow-xl);
            animation: slideIn 0.3s ease-out;
            border: 1px solid var(--bg-tertiary);
        `;

        modal.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
                <div style="display: flex; align-items: center; gap: var(--spacing-md);">
                    <span style="font-size: 2rem;">${icon}</span>
                    <h2 style="margin: 0; font-size: var(--font-size-xl); color: var(--text-primary);">
                        ${title}
                    </h2>
                </div>
                <p style="margin: 0; color: var(--text-secondary); line-height: 1.6;">
                    ${message}
                </p>
                <div style="display: flex; gap: var(--spacing-md); justify-content: flex-end;">
                    <button class="${cancelClass}" id="custom-modal-cancel">
                        ${cancelText}
                    </button>
                    <button class="${confirmClass}" id="custom-modal-confirm">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Add animations to CSS if not already present
        if (!document.getElementById('modal-animations')) {
            const style = document.createElement('style');
            style.id = 'modal-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Handle confirm
        const confirmBtn = modal.querySelector('#custom-modal-confirm');
        confirmBtn.addEventListener('click', () => {
            backdrop.remove();
            resolve(true);
        });

        // Handle cancel
        const cancelBtn = modal.querySelector('#custom-modal-cancel');
        cancelBtn.addEventListener('click', () => {
            backdrop.remove();
            resolve(false);
        });

        // Handle backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.remove();
                resolve(false);
            }
        });

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                backdrop.remove();
                resolve(false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus confirm button
        setTimeout(() => confirmBtn.focus(), 100);
    });
}

/**
 * Show a custom alert dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Object} options - Optional configuration
 * @returns {Promise<void>}
 */
export function showAlert(title, message, options = {}) {
    return new Promise((resolve) => {
        const {
            buttonText = 'OK',
            buttonClass = 'btn-primary',
            icon = 'ℹ️'
        } = options;

        // Create modal elements
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: var(--z-index-modal-backdrop);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
        `;

        const modal = document.createElement('div');
        modal.className = 'custom-alert-modal';
        modal.style.cssText = `
            background: var(--bg-primary);
            border-radius: var(--radius-lg);
            padding: var(--spacing-xl);
            max-width: 500px;
            width: 90%;
            box-shadow: var(--shadow-xl);
            animation: slideIn 0.3s ease-out;
            border: 1px solid var(--bg-tertiary);
        `;

        modal.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
                <div style="display: flex; align-items: center; gap: var(--spacing-md);">
                    <span style="font-size: 2rem;">${icon}</span>
                    <h2 style="margin: 0; font-size: var(--font-size-xl); color: var(--text-primary);">
                        ${title}
                    </h2>
                </div>
                <p style="margin: 0; color: var(--text-secondary); line-height: 1.6; white-space: pre-line;">
                    ${message}
                </p>
                <div style="display: flex; justify-content: flex-end;">
                    <button class="${buttonClass}" id="custom-modal-ok">
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Handle OK
        const okBtn = modal.querySelector('#custom-modal-ok');
        okBtn.addEventListener('click', () => {
            backdrop.remove();
            resolve();
        });

        // Handle backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.remove();
                resolve();
            }
        });

        // Handle escape/enter keys
        const handleKey = (e) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                backdrop.remove();
                resolve();
                document.removeEventListener('keydown', handleKey);
            }
        };
        document.addEventListener('keydown', handleKey);

        // Focus OK button
        setTimeout(() => okBtn.focus(), 100);
    });
}

export default {
    showConfirm,
    showAlert
};
