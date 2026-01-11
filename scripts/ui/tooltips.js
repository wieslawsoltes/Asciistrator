/**
 * Asciistrator - Tooltip System
 * 
 * Configurable tooltips with smart positioning.
 */

// ==========================================
// TOOLTIP MANAGER
// ==========================================

/**
 * Tooltip placement options
 */
export const TooltipPlacement = {
    TOP: 'top',
    BOTTOM: 'bottom',
    LEFT: 'left',
    RIGHT: 'right',
    AUTO: 'auto'
};

/**
 * Tooltip manager - handles all tooltips
 */
export class TooltipManager {
    constructor(options = {}) {
        this.options = {
            delay: options.delay || 500,
            duration: options.duration || 200,
            offset: options.offset || 8,
            maxWidth: options.maxWidth || 300,
            theme: options.theme || 'dark',
            zIndex: options.zIndex || 10001,
            ...options
        };
        
        /** @type {HTMLElement|null} */
        this._element = null;
        /** @type {HTMLElement|null} */
        this._arrow = null;
        /** @type {number|null} */
        this._showTimeout = null;
        /** @type {number|null} */
        this._hideTimeout = null;
        /** @type {HTMLElement|null} */
        this._currentTarget = null;
        /** @type {Map<HTMLElement, object>} */
        this._registered = new Map();
        
        this._createStyles();
        this._createElement();
        this._setupGlobalListeners();
    }

    /**
     * Create CSS styles
     * @private
     */
    _createStyles() {
        if (document.getElementById('tooltip-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tooltip-styles';
        style.textContent = `
            .tooltip {
                position: fixed;
                padding: 6px 10px;
                background: var(--tooltip-bg, #1e1e1e);
                color: var(--tooltip-text, #ffffff);
                border: 1px solid var(--tooltip-border, #3e3e42);
                border-radius: 4px;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                white-space: pre-wrap;
                pointer-events: none;
                opacity: 0;
                transform: translateY(4px);
                transition: opacity 0.15s, transform 0.15s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            
            .tooltip.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .tooltip-arrow {
                position: absolute;
                width: 8px;
                height: 8px;
                background: var(--tooltip-bg, #1e1e1e);
                border: 1px solid var(--tooltip-border, #3e3e42);
                transform: rotate(45deg);
            }
            
            .tooltip[data-placement="top"] .tooltip-arrow {
                bottom: -5px;
                border-top: none;
                border-left: none;
            }
            
            .tooltip[data-placement="bottom"] .tooltip-arrow {
                top: -5px;
                border-bottom: none;
                border-right: none;
            }
            
            .tooltip[data-placement="left"] .tooltip-arrow {
                right: -5px;
                border-top: none;
                border-left: none;
            }
            
            .tooltip[data-placement="right"] .tooltip-arrow {
                left: -5px;
                border-bottom: none;
                border-right: none;
            }
            
            .tooltip-title {
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .tooltip-shortcut {
                margin-top: 4px;
                padding-top: 4px;
                border-top: 1px solid var(--tooltip-border, #3e3e42);
                color: var(--tooltip-shortcut, #888888);
                font-size: 11px;
            }
            
            /* Light theme */
            .tooltip.light {
                --tooltip-bg: #f5f5f5;
                --tooltip-text: #333333;
                --tooltip-border: #e0e0e0;
                --tooltip-shortcut: #666666;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Create tooltip element
     * @private
     */
    _createElement() {
        this._element = document.createElement('div');
        this._element.className = 'tooltip';
        this._element.style.zIndex = this.options.zIndex;
        
        if (this.options.theme === 'light') {
            this._element.classList.add('light');
        }
        
        this._arrow = document.createElement('div');
        this._arrow.className = 'tooltip-arrow';
        this._element.appendChild(this._arrow);
        
        this._content = document.createElement('div');
        this._content.className = 'tooltip-content';
        this._element.appendChild(this._content);
        
        document.body.appendChild(this._element);
    }

    /**
     * Setup global event listeners
     * @private
     */
    _setupGlobalListeners() {
        // Store bound handlers for cleanup
        this._boundMouseEnter = (e) => {
            const target = e.target;
            if (target instanceof HTMLElement) {
                // Check for data-tooltip attribute or registered element
                if (target.hasAttribute('data-tooltip') || this._registered.has(target)) {
                    this._handleMouseEnter(target);
                }
            }
        };
        
        this._boundMouseLeave = (e) => {
            const target = e.target;
            if (target instanceof HTMLElement) {
                if (target.hasAttribute('data-tooltip') || this._registered.has(target)) {
                    this._handleMouseLeave(target);
                }
            }
        };
        
        this._boundScroll = () => this.hide();
        
        // Use event delegation for hover
        document.addEventListener('mouseenter', this._boundMouseEnter, true);
        document.addEventListener('mouseleave', this._boundMouseLeave, true);
        
        // Hide on scroll
        document.addEventListener('scroll', this._boundScroll, true);
    }

    /**
     * Handle mouse enter on target
     * @private
     */
    _handleMouseEnter(target) {
        this._clearTimeouts();
        
        this._showTimeout = setTimeout(() => {
            this.show(target);
        }, this.options.delay);
    }

    /**
     * Handle mouse leave on target
     * @private
     */
    _handleMouseLeave(target) {
        this._clearTimeouts();
        
        this._hideTimeout = setTimeout(() => {
            this.hide();
        }, 100);
    }

    /**
     * Clear pending timeouts
     * @private
     */
    _clearTimeouts() {
        if (this._showTimeout) {
            clearTimeout(this._showTimeout);
            this._showTimeout = null;
        }
        if (this._hideTimeout) {
            clearTimeout(this._hideTimeout);
            this._hideTimeout = null;
        }
    }

    /**
     * Register tooltip for element
     * @param {HTMLElement} element 
     * @param {object} options 
     */
    register(element, options) {
        this._registered.set(element, {
            content: options.content || '',
            title: options.title || null,
            shortcut: options.shortcut || null,
            placement: options.placement || TooltipPlacement.AUTO,
            delay: options.delay || this.options.delay
        });
    }

    /**
     * Unregister tooltip
     * @param {HTMLElement} element 
     */
    unregister(element) {
        this._registered.delete(element);
    }

    /**
     * Show tooltip for target element
     * @param {HTMLElement} target 
     */
    show(target) {
        this._currentTarget = target;
        
        // Get tooltip config
        let config = this._registered.get(target);
        
        if (!config) {
            // Use data attributes
            config = {
                content: target.getAttribute('data-tooltip') || '',
                title: target.getAttribute('data-tooltip-title'),
                shortcut: target.getAttribute('data-tooltip-shortcut'),
                placement: target.getAttribute('data-tooltip-placement') || TooltipPlacement.AUTO
            };
        }
        
        if (!config.content && !config.title) return;
        
        // Build content
        this._buildContent(config);
        
        // Position and show
        this._element.style.maxWidth = this.options.maxWidth + 'px';
        this._element.classList.remove('visible');
        
        // Force layout calculation
        this._element.offsetHeight;
        
        // Calculate position
        const placement = this._calculatePlacement(target, config.placement);
        this._positionTooltip(target, placement);
        
        // Show with animation
        requestAnimationFrame(() => {
            this._element.classList.add('visible');
        });
    }

    /**
     * Build tooltip content
     * @private
     */
    _buildContent(config) {
        let html = '';
        
        if (config.title) {
            html += `<div class="tooltip-title">${this._escapeHtml(config.title)}</div>`;
        }
        
        if (config.content) {
            html += this._escapeHtml(config.content);
        }
        
        if (config.shortcut) {
            html += `<div class="tooltip-shortcut">${this._escapeHtml(config.shortcut)}</div>`;
        }
        
        this._content.innerHTML = html;
    }

    /**
     * Escape HTML special characters
     * @private
     */
    _escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Calculate best placement
     * @private
     */
    _calculatePlacement(target, preferred) {
        if (preferred !== TooltipPlacement.AUTO) {
            return preferred;
        }
        
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = this._element.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Check available space in each direction
        const spaceTop = targetRect.top;
        const spaceBottom = viewport.height - targetRect.bottom;
        const spaceLeft = targetRect.left;
        const spaceRight = viewport.width - targetRect.right;
        
        // Prefer top, then bottom, then right, then left
        if (spaceTop >= tooltipRect.height + this.options.offset) {
            return TooltipPlacement.TOP;
        }
        if (spaceBottom >= tooltipRect.height + this.options.offset) {
            return TooltipPlacement.BOTTOM;
        }
        if (spaceRight >= tooltipRect.width + this.options.offset) {
            return TooltipPlacement.RIGHT;
        }
        if (spaceLeft >= tooltipRect.width + this.options.offset) {
            return TooltipPlacement.LEFT;
        }
        
        // Default to top
        return TooltipPlacement.TOP;
    }

    /**
     * Position tooltip relative to target
     * @private
     */
    _positionTooltip(target, placement) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = this._element.getBoundingClientRect();
        const offset = this.options.offset;
        
        let x, y, arrowX, arrowY;
        
        switch (placement) {
            case TooltipPlacement.TOP:
                x = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                y = targetRect.top - tooltipRect.height - offset;
                arrowX = tooltipRect.width / 2 - 4;
                arrowY = null;
                break;
                
            case TooltipPlacement.BOTTOM:
                x = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                y = targetRect.bottom + offset;
                arrowX = tooltipRect.width / 2 - 4;
                arrowY = null;
                break;
                
            case TooltipPlacement.LEFT:
                x = targetRect.left - tooltipRect.width - offset;
                y = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                arrowX = null;
                arrowY = tooltipRect.height / 2 - 4;
                break;
                
            case TooltipPlacement.RIGHT:
                x = targetRect.right + offset;
                y = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                arrowX = null;
                arrowY = tooltipRect.height / 2 - 4;
                break;
        }
        
        // Keep within viewport
        x = Math.max(8, Math.min(x, window.innerWidth - tooltipRect.width - 8));
        y = Math.max(8, Math.min(y, window.innerHeight - tooltipRect.height - 8));
        
        this._element.style.left = x + 'px';
        this._element.style.top = y + 'px';
        this._element.setAttribute('data-placement', placement);
        
        // Position arrow
        if (arrowX !== null) {
            // Adjust arrow if tooltip was constrained
            const actualCenterX = targetRect.left + targetRect.width / 2;
            arrowX = actualCenterX - x - 4;
            arrowX = Math.max(8, Math.min(arrowX, tooltipRect.width - 16));
            this._arrow.style.left = arrowX + 'px';
            this._arrow.style.top = '';
        }
        if (arrowY !== null) {
            const actualCenterY = targetRect.top + targetRect.height / 2;
            arrowY = actualCenterY - y - 4;
            arrowY = Math.max(8, Math.min(arrowY, tooltipRect.height - 16));
            this._arrow.style.top = arrowY + 'px';
            this._arrow.style.left = '';
        }
    }

    /**
     * Hide tooltip
     */
    hide() {
        this._clearTimeouts();
        this._element.classList.remove('visible');
        this._currentTarget = null;
    }

    /**
     * Update tooltip content while visible
     * @param {string} content 
     */
    updateContent(content) {
        if (this._currentTarget) {
            this._content.textContent = content;
        }
    }

    /**
     * Destroy tooltip manager
     */
    destroy() {
        this._clearTimeouts();
        
        // Remove global event listeners
        if (this._boundMouseEnter) {
            document.removeEventListener('mouseenter', this._boundMouseEnter, true);
        }
        if (this._boundMouseLeave) {
            document.removeEventListener('mouseleave', this._boundMouseLeave, true);
        }
        if (this._boundScroll) {
            document.removeEventListener('scroll', this._boundScroll, true);
        }
        
        if (this._element) {
            this._element.remove();
        }
        this._registered.clear();
    }
}

// ==========================================
// SIMPLE TOOLTIP HELPERS
// ==========================================

/**
 * Global tooltip manager instance
 */
let globalTooltipManager = null;

/**
 * Get or create global tooltip manager
 * @returns {TooltipManager}
 */
export function getTooltipManager() {
    if (!globalTooltipManager) {
        globalTooltipManager = new TooltipManager();
    }
    return globalTooltipManager;
}

/**
 * Set tooltip on element using data attribute
 * @param {HTMLElement} element 
 * @param {string} content 
 * @param {object} options 
 */
export function setTooltip(element, content, options = {}) {
    element.setAttribute('data-tooltip', content);
    
    if (options.title) {
        element.setAttribute('data-tooltip-title', options.title);
    }
    if (options.shortcut) {
        element.setAttribute('data-tooltip-shortcut', options.shortcut);
    }
    if (options.placement) {
        element.setAttribute('data-tooltip-placement', options.placement);
    }
}

/**
 * Remove tooltip from element
 * @param {HTMLElement} element 
 */
export function removeTooltip(element) {
    element.removeAttribute('data-tooltip');
    element.removeAttribute('data-tooltip-title');
    element.removeAttribute('data-tooltip-shortcut');
    element.removeAttribute('data-tooltip-placement');
}

/**
 * Programmatically show tooltip at position
 * @param {number} x 
 * @param {number} y 
 * @param {string} content 
 * @param {object} options 
 */
export function showTooltipAt(x, y, content, options = {}) {
    const manager = getTooltipManager();
    
    // Create temporary target element
    const target = document.createElement('div');
    target.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 1px;
        height: 1px;
        pointer-events: none;
    `;
    target.setAttribute('data-tooltip', content);
    
    if (options.title) {
        target.setAttribute('data-tooltip-title', options.title);
    }
    if (options.shortcut) {
        target.setAttribute('data-tooltip-shortcut', options.shortcut);
    }
    
    document.body.appendChild(target);
    manager.show(target);
    
    // Remove temporary element after tooltip is positioned
    requestAnimationFrame(() => target.remove());
    
    return () => manager.hide();
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    TooltipPlacement,
    TooltipManager,
    getTooltipManager,
    setTooltip,
    removeTooltip,
    showTooltipAt
};
