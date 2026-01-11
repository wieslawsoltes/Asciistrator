/**
 * Asciistrator - Accessibility Module
 * 
 * Accessibility features including ARIA support, screen reader
 * announcements, focus management, and keyboard navigation.
 */

// ==========================================
// ARIA UTILITIES
// ==========================================

/**
 * ARIA live region modes
 */
export const AriaLive = {
    OFF: 'off',
    POLITE: 'polite',
    ASSERTIVE: 'assertive'
};

/**
 * ARIA roles for common elements
 */
export const AriaRole = {
    APPLICATION: 'application',
    BUTTON: 'button',
    CHECKBOX: 'checkbox',
    DIALOG: 'dialog',
    GRID: 'grid',
    GRIDCELL: 'gridcell',
    GROUP: 'group',
    IMG: 'img',
    LISTBOX: 'listbox',
    MENU: 'menu',
    MENUBAR: 'menubar',
    MENUITEM: 'menuitem',
    MENUITEMCHECKBOX: 'menuitemcheckbox',
    MENUITEMRADIO: 'menuitemradio',
    OPTION: 'option',
    PROGRESSBAR: 'progressbar',
    RADIO: 'radio',
    RADIOGROUP: 'radiogroup',
    REGION: 'region',
    SLIDER: 'slider',
    SPINBUTTON: 'spinbutton',
    STATUS: 'status',
    TAB: 'tab',
    TABLIST: 'tablist',
    TABPANEL: 'tabpanel',
    TEXTBOX: 'textbox',
    TOOLBAR: 'toolbar',
    TOOLTIP: 'tooltip',
    TREE: 'tree',
    TREEITEM: 'treeitem'
};

/**
 * Set ARIA attributes on element
 * @param {HTMLElement} element 
 * @param {object} attrs 
 */
export function setAriaAttrs(element, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined) {
            element.removeAttribute(`aria-${key}`);
        } else if (typeof value === 'boolean') {
            element.setAttribute(`aria-${key}`, value ? 'true' : 'false');
        } else {
            element.setAttribute(`aria-${key}`, String(value));
        }
    }
}

/**
 * Set role attribute
 * @param {HTMLElement} element 
 * @param {string} role 
 */
export function setRole(element, role) {
    element.setAttribute('role', role);
}

/**
 * Make element accessible button
 * @param {HTMLElement} element 
 * @param {string} label 
 * @param {object} options 
 */
export function makeButton(element, label, options = {}) {
    setRole(element, AriaRole.BUTTON);
    setAriaAttrs(element, {
        label: label,
        pressed: options.pressed,
        expanded: options.expanded,
        haspopup: options.hasPopup,
        disabled: options.disabled
    });
    
    if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
    }
    
    // Handle keyboard activation
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            element.click();
        }
    });
}

/**
 * Make element accessible checkbox
 * @param {HTMLElement} element 
 * @param {string} label 
 * @param {boolean} checked 
 */
export function makeCheckbox(element, label, checked = false) {
    setRole(element, AriaRole.CHECKBOX);
    setAriaAttrs(element, {
        label: label,
        checked: checked
    });
    
    if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
    }
    
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            element.click();
        }
    });
}

/**
 * Update checkbox state
 * @param {HTMLElement} element 
 * @param {boolean} checked 
 */
export function setChecked(element, checked) {
    setAriaAttrs(element, { checked });
}

// ==========================================
// SCREEN READER ANNOUNCEMENTS
// ==========================================

/**
 * Live region for screen reader announcements
 */
class LiveRegion {
    constructor() {
        this._polite = null;
        this._assertive = null;
        this._init();
    }

    /**
     * Initialize live regions
     * @private
     */
    _init() {
        // Polite region - waits for user to finish
        this._polite = document.createElement('div');
        this._polite.setAttribute('role', 'status');
        this._polite.setAttribute('aria-live', 'polite');
        this._polite.setAttribute('aria-atomic', 'true');
        this._polite.className = 'sr-only';
        
        // Assertive region - interrupts immediately
        this._assertive = document.createElement('div');
        this._assertive.setAttribute('role', 'alert');
        this._assertive.setAttribute('aria-live', 'assertive');
        this._assertive.setAttribute('aria-atomic', 'true');
        this._assertive.className = 'sr-only';
        
        // Add styles if not present
        this._addStyles();
        
        document.body.appendChild(this._polite);
        document.body.appendChild(this._assertive);
    }

    /**
     * Add screen reader only styles
     * @private
     */
    _addStyles() {
        if (document.getElementById('sr-only-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'sr-only-styles';
        style.textContent = `
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Announce message politely (waits)
     * @param {string} message 
     */
    announce(message) {
        // Clear and set to trigger announcement
        this._polite.textContent = '';
        requestAnimationFrame(() => {
            this._polite.textContent = message;
        });
    }

    /**
     * Announce message assertively (interrupts)
     * @param {string} message 
     */
    alert(message) {
        this._assertive.textContent = '';
        requestAnimationFrame(() => {
            this._assertive.textContent = message;
        });
    }

    /**
     * Clear announcements
     */
    clear() {
        this._polite.textContent = '';
        this._assertive.textContent = '';
    }
}

let liveRegion = null;

/**
 * Get live region instance
 * @returns {LiveRegion}
 */
function getLiveRegion() {
    if (!liveRegion) {
        liveRegion = new LiveRegion();
    }
    return liveRegion;
}

/**
 * Announce message to screen readers (polite)
 * @param {string} message 
 */
export function announce(message) {
    getLiveRegion().announce(message);
}

/**
 * Alert message to screen readers (assertive/interrupt)
 * @param {string} message 
 */
export function alertMessage(message) {
    getLiveRegion().alert(message);
}

// ==========================================
// FOCUS MANAGEMENT
// ==========================================

/**
 * Focus manager for complex widgets
 */
export class FocusManager {
    constructor(container, options = {}) {
        this._container = container;
        this._options = {
            loop: options.loop !== false,
            autoFocus: options.autoFocus !== false,
            restoreFocus: options.restoreFocus !== false,
            selector: options.selector || '[tabindex]:not([tabindex="-1"]), button, input, select, textarea, a[href]',
            ...options
        };
        
        /** @type {HTMLElement|null} */
        this._previousFocus = null;
        /** @type {HTMLElement[]} */
        this._focusableElements = [];
        
        this._boundKeyHandler = this._handleKeyDown.bind(this);
    }

    /**
     * Get focusable elements in container
     * @returns {HTMLElement[]}
     */
    getFocusableElements() {
        const elements = Array.from(
            this._container.querySelectorAll(this._options.selector)
        );
        
        return elements.filter(el => {
            // Filter out hidden/disabled elements
            if (el.disabled) return false;
            if (el.style.display === 'none') return false;
            if (el.style.visibility === 'hidden') return false;
            if (el.getAttribute('aria-hidden') === 'true') return false;
            
            // Check if element is visible
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        });
    }

    /**
     * Activate focus trap
     */
    activate() {
        this._previousFocus = document.activeElement;
        this._focusableElements = this.getFocusableElements();
        
        // Add key listener for tab trap
        this._container.addEventListener('keydown', this._boundKeyHandler);
        
        // Auto-focus first element
        if (this._options.autoFocus && this._focusableElements.length > 0) {
            this._focusableElements[0].focus();
        }
    }

    /**
     * Deactivate focus trap
     */
    deactivate() {
        this._container.removeEventListener('keydown', this._boundKeyHandler);
        
        // Restore previous focus
        if (this._options.restoreFocus && this._previousFocus) {
            this._previousFocus.focus();
        }
    }

    /**
     * Handle keydown for focus trap
     * @private
     */
    _handleKeyDown(e) {
        if (e.key !== 'Tab') return;
        
        this._focusableElements = this.getFocusableElements();
        if (this._focusableElements.length === 0) return;
        
        const first = this._focusableElements[0];
        const last = this._focusableElements[this._focusableElements.length - 1];
        const active = document.activeElement;
        
        if (e.shiftKey) {
            // Shift+Tab - moving backward
            if (active === first) {
                if (this._options.loop) {
                    e.preventDefault();
                    last.focus();
                }
            }
        } else {
            // Tab - moving forward
            if (active === last) {
                if (this._options.loop) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    /**
     * Focus first element
     */
    focusFirst() {
        const elements = this.getFocusableElements();
        if (elements.length > 0) {
            elements[0].focus();
        }
    }

    /**
     * Focus last element
     */
    focusLast() {
        const elements = this.getFocusableElements();
        if (elements.length > 0) {
            elements[elements.length - 1].focus();
        }
    }

    /**
     * Focus next element
     */
    focusNext() {
        const elements = this.getFocusableElements();
        const current = elements.indexOf(document.activeElement);
        const next = (current + 1) % elements.length;
        elements[next]?.focus();
    }

    /**
     * Focus previous element
     */
    focusPrevious() {
        const elements = this.getFocusableElements();
        const current = elements.indexOf(document.activeElement);
        const prev = (current - 1 + elements.length) % elements.length;
        elements[prev]?.focus();
    }
}

/**
 * Create roving tabindex for composite widgets
 */
export class RovingTabindex {
    constructor(container, options = {}) {
        this._container = container;
        this._options = {
            selector: options.selector || '[role="tab"], [role="menuitem"], [role="option"]',
            orientation: options.orientation || 'horizontal', // 'horizontal', 'vertical', 'both'
            loop: options.loop !== false,
            ...options
        };
        
        this._currentIndex = 0;
        this._init();
    }

    /**
     * Initialize roving tabindex
     * @private
     */
    _init() {
        const items = this.getItems();
        
        // Set initial tabindex
        items.forEach((item, index) => {
            item.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });
        
        // Listen for keyboard navigation
        this._container.addEventListener('keydown', this._handleKeyDown.bind(this));
        
        // Listen for focus events
        this._container.addEventListener('focus', this._handleFocus.bind(this), true);
    }

    /**
     * Get navigable items
     * @returns {HTMLElement[]}
     */
    getItems() {
        return Array.from(this._container.querySelectorAll(this._options.selector));
    }

    /**
     * Handle keydown
     * @private
     */
    _handleKeyDown(e) {
        const items = this.getItems();
        if (items.length === 0) return;
        
        let handled = false;
        let delta = 0;
        
        const isHorizontal = this._options.orientation === 'horizontal' || this._options.orientation === 'both';
        const isVertical = this._options.orientation === 'vertical' || this._options.orientation === 'both';
        
        switch (e.key) {
            case 'ArrowRight':
                if (isHorizontal) {
                    delta = 1;
                    handled = true;
                }
                break;
            case 'ArrowLeft':
                if (isHorizontal) {
                    delta = -1;
                    handled = true;
                }
                break;
            case 'ArrowDown':
                if (isVertical) {
                    delta = 1;
                    handled = true;
                }
                break;
            case 'ArrowUp':
                if (isVertical) {
                    delta = -1;
                    handled = true;
                }
                break;
            case 'Home':
                this._focusItem(0);
                handled = true;
                break;
            case 'End':
                this._focusItem(items.length - 1);
                handled = true;
                break;
        }
        
        if (delta !== 0) {
            let newIndex = this._currentIndex + delta;
            
            if (this._options.loop) {
                newIndex = (newIndex + items.length) % items.length;
            } else {
                newIndex = Math.max(0, Math.min(newIndex, items.length - 1));
            }
            
            this._focusItem(newIndex);
        }
        
        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    /**
     * Handle focus
     * @private
     */
    _handleFocus(e) {
        const items = this.getItems();
        const index = items.indexOf(e.target);
        if (index >= 0) {
            this._currentIndex = index;
        }
    }

    /**
     * Focus item by index
     * @private
     */
    _focusItem(index) {
        const items = this.getItems();
        
        // Update tabindex
        items[this._currentIndex]?.setAttribute('tabindex', '-1');
        items[index]?.setAttribute('tabindex', '0');
        items[index]?.focus();
        
        this._currentIndex = index;
    }

    /**
     * Set current item
     * @param {number} index 
     */
    setCurrentItem(index) {
        this._focusItem(index);
    }
}

// ==========================================
// SKIP LINKS
// ==========================================

/**
 * Create skip link for keyboard navigation
 * @param {string} targetId 
 * @param {string} label 
 * @returns {HTMLElement}
 */
export function createSkipLink(targetId, label) {
    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.textContent = label;
    link.className = 'skip-link';
    
    // Add styles
    if (!document.getElementById('skip-link-styles')) {
        const style = document.createElement('style');
        style.id = 'skip-link-styles';
        style.textContent = `
            .skip-link {
                position: absolute;
                top: -40px;
                left: 0;
                padding: 8px 16px;
                background: #0066cc;
                color: white;
                text-decoration: none;
                z-index: 10000;
                transition: top 0.2s;
            }
            
            .skip-link:focus {
                top: 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.setAttribute('tabindex', '-1');
            target.focus();
        }
    });
    
    return link;
}

// ==========================================
// HIGH CONTRAST / REDUCED MOTION
// ==========================================

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 * @returns {boolean}
 */
export function prefersHighContrast() {
    // Check Windows high contrast
    if (window.matchMedia('(forced-colors: active)').matches) {
        return true;
    }
    // Check prefer-contrast
    if (window.matchMedia('(prefers-contrast: more)').matches) {
        return true;
    }
    return false;
}

/**
 * Listen for preference changes
 * @param {string} preference - 'reduced-motion' or 'high-contrast'
 * @param {function} callback 
 * @returns {function} Cleanup function
 */
export function onPreferenceChange(preference, callback) {
    let query;
    
    switch (preference) {
        case 'reduced-motion':
            query = window.matchMedia('(prefers-reduced-motion: reduce)');
            break;
        case 'high-contrast':
            query = window.matchMedia('(forced-colors: active)');
            break;
        default:
            return () => {};
    }
    
    const handler = (e) => callback(e.matches);
    query.addEventListener('change', handler);
    
    return () => query.removeEventListener('change', handler);
}

// ==========================================
// KEYBOARD NAVIGATION HELPERS
// ==========================================

/**
 * Arrow key navigation for lists
 * @param {HTMLElement} container 
 * @param {object} options 
 */
export function setupArrowKeyNavigation(container, options = {}) {
    const {
        selector = '[role="option"], [role="listitem"], li',
        orientation = 'vertical',
        onSelect = null
    } = options;
    
    container.addEventListener('keydown', (e) => {
        const items = Array.from(container.querySelectorAll(selector));
        const currentIndex = items.indexOf(document.activeElement);
        
        if (currentIndex === -1) return;
        
        let newIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowUp':
                if (orientation !== 'horizontal') {
                    newIndex = Math.max(0, currentIndex - 1);
                }
                break;
            case 'ArrowDown':
                if (orientation !== 'horizontal') {
                    newIndex = Math.min(items.length - 1, currentIndex + 1);
                }
                break;
            case 'ArrowLeft':
                if (orientation !== 'vertical') {
                    newIndex = Math.max(0, currentIndex - 1);
                }
                break;
            case 'ArrowRight':
                if (orientation !== 'vertical') {
                    newIndex = Math.min(items.length - 1, currentIndex + 1);
                }
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = items.length - 1;
                break;
            case 'Enter':
            case ' ':
                if (onSelect) {
                    onSelect(items[currentIndex], currentIndex);
                }
                e.preventDefault();
                return;
            default:
                return;
        }
        
        if (newIndex !== currentIndex) {
            items[newIndex].focus();
            e.preventDefault();
        }
    });
}

// ==========================================
// ACCESSIBLE DIALOG
// ==========================================

/**
 * Make dialog accessible
 * @param {HTMLElement} dialog 
 * @param {object} options 
 */
export function makeDialogAccessible(dialog, options = {}) {
    const {
        labelledBy = null,
        describedBy = null,
        closeOnEscape = true,
        focusTrap = true
    } = options;
    
    // Set ARIA attributes
    setRole(dialog, AriaRole.DIALOG);
    setAriaAttrs(dialog, {
        modal: true,
        labelledby: labelledBy,
        describedby: describedBy
    });
    
    let focusManager = null;
    
    if (focusTrap) {
        focusManager = new FocusManager(dialog, {
            loop: true,
            autoFocus: true,
            restoreFocus: true
        });
    }
    
    // Handle escape key
    const handleKeyDown = (e) => {
        if (closeOnEscape && e.key === 'Escape') {
            dialog.dispatchEvent(new CustomEvent('close-requested'));
        }
    };
    
    dialog.addEventListener('keydown', handleKeyDown);
    
    // Return control object
    return {
        open() {
            dialog.removeAttribute('hidden');
            setAriaAttrs(dialog, { hidden: null });
            focusManager?.activate();
            announce('Dialog opened');
        },
        close() {
            dialog.setAttribute('hidden', '');
            setAriaAttrs(dialog, { hidden: true });
            focusManager?.deactivate();
            announce('Dialog closed');
        },
        destroy() {
            dialog.removeEventListener('keydown', handleKeyDown);
        }
    };
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    // ARIA
    AriaLive,
    AriaRole,
    setAriaAttrs,
    setRole,
    makeButton,
    makeCheckbox,
    setChecked,
    
    // Screen reader
    announce,
    alertMessage,
    
    // Focus management
    FocusManager,
    RovingTabindex,
    
    // Skip links
    createSkipLink,
    
    // Preferences
    prefersReducedMotion,
    prefersHighContrast,
    onPreferenceChange,
    
    // Navigation
    setupArrowKeyNavigation,
    
    // Dialog
    makeDialogAccessible
};
