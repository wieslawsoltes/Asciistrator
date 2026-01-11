/**
 * Asciistrator - Context Menu System
 * 
 * Right-click context menus with keyboard navigation.
 */

import { Transition } from './animations.js';

// ==========================================
// CONTEXT MENU ITEM
// ==========================================

/**
 * Context menu item types
 */
export const MenuItemType = {
    ITEM: 'item',
    SEPARATOR: 'separator',
    SUBMENU: 'submenu',
    CHECKBOX: 'checkbox',
    RADIO: 'radio'
};

/**
 * Create a menu item
 * @param {object} options 
 * @returns {object}
 */
export function menuItem(options) {
    return {
        type: MenuItemType.ITEM,
        id: options.id,
        label: options.label,
        icon: options.icon || null,
        shortcut: options.shortcut || null,
        disabled: options.disabled || false,
        action: options.action || null,
        data: options.data || null
    };
}

/**
 * Create a separator
 * @returns {object}
 */
export function separator() {
    return { type: MenuItemType.SEPARATOR };
}

/**
 * Create a submenu
 * @param {object} options 
 * @returns {object}
 */
export function submenu(options) {
    return {
        type: MenuItemType.SUBMENU,
        id: options.id,
        label: options.label,
        icon: options.icon || null,
        items: options.items || [],
        disabled: options.disabled || false
    };
}

/**
 * Create a checkbox item
 * @param {object} options 
 * @returns {object}
 */
export function checkbox(options) {
    return {
        type: MenuItemType.CHECKBOX,
        id: options.id,
        label: options.label,
        checked: options.checked || false,
        disabled: options.disabled || false,
        action: options.action || null
    };
}

/**
 * Create a radio item
 * @param {object} options 
 * @returns {object}
 */
export function radio(options) {
    return {
        type: MenuItemType.RADIO,
        id: options.id,
        label: options.label,
        group: options.group,
        checked: options.checked || false,
        disabled: options.disabled || false,
        action: options.action || null
    };
}

// ==========================================
// CONTEXT MENU
// ==========================================

/**
 * Context menu manager
 */
export class ContextMenu {
    constructor(options = {}) {
        this.options = {
            animationDuration: options.animationDuration || 150,
            theme: options.theme || 'dark',
            maxHeight: options.maxHeight || 400,
            zIndex: options.zIndex || 10000,
            ...options
        };
        
        /** @type {HTMLElement|null} */
        this._element = null;
        /** @type {HTMLElement|null} */
        this._activeSubmenu = null;
        /** @type {number} */
        this._activeIndex = -1;
        /** @type {Array} */
        this._items = [];
        /** @type {Function|null} */
        this._onClose = null;
        /** @type {Function|null} */
        this._keyHandler = null;
        /** @type {Function|null} */
        this._clickHandler = null;
        
        this._createStyles();
    }

    /**
     * Create CSS styles
     * @private
     */
    _createStyles() {
        if (document.getElementById('context-menu-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'context-menu-styles';
        style.textContent = `
            .ctx-menu {
                position: fixed;
                min-width: 180px;
                max-width: 300px;
                background: var(--menu-bg, #2d2d30);
                border: 1px solid var(--menu-border, #3e3e42);
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                padding: 4px 0;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 13px;
                color: var(--menu-text, #cccccc);
                overflow-y: auto;
                outline: none;
            }
            
            .ctx-menu-item {
                display: flex;
                align-items: center;
                padding: 6px 12px;
                cursor: pointer;
                user-select: none;
                gap: 8px;
            }
            
            .ctx-menu-item:hover,
            .ctx-menu-item.active {
                background: var(--menu-hover, #094771);
            }
            
            .ctx-menu-item.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .ctx-menu-item.disabled:hover {
                background: transparent;
            }
            
            .ctx-menu-icon {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .ctx-menu-label {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .ctx-menu-shortcut {
                color: var(--menu-shortcut, #808080);
                font-size: 12px;
                margin-left: 16px;
            }
            
            .ctx-menu-arrow {
                color: var(--menu-arrow, #808080);
                margin-left: 8px;
            }
            
            .ctx-menu-separator {
                height: 1px;
                background: var(--menu-separator, #3e3e42);
                margin: 4px 8px;
            }
            
            .ctx-menu-checkbox,
            .ctx-menu-radio {
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .ctx-menu-submenu {
                position: fixed;
            }
            
            /* Light theme */
            .ctx-menu.light {
                --menu-bg: #f5f5f5;
                --menu-border: #e0e0e0;
                --menu-text: #333333;
                --menu-hover: #0078d4;
                --menu-shortcut: #666666;
                --menu-separator: #e0e0e0;
            }
            
            .ctx-menu.light .ctx-menu-item:hover,
            .ctx-menu.light .ctx-menu-item.active {
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show context menu at position
     * @param {number} x 
     * @param {number} y 
     * @param {Array} items - Menu items
     * @param {object} options
     * @returns {Promise<any>} - Selected item data or null
     */
    show(x, y, items, options = {}) {
        return new Promise((resolve) => {
            // Close any existing menu
            this.close();
            
            this._items = items;
            this._onClose = (result) => {
                resolve(result);
            };
            
            // Create menu element
            this._element = this._createMenuElement(items);
            this._element.style.left = '0';
            this._element.style.top = '0';
            this._element.style.opacity = '0';
            this._element.style.transform = 'scale(0.95)';
            this._element.style.maxHeight = this.options.maxHeight + 'px';
            this._element.style.zIndex = this.options.zIndex;
            
            if (this.options.theme === 'light') {
                this._element.classList.add('light');
            }
            
            document.body.appendChild(this._element);
            
            // Position menu (avoid viewport overflow)
            this._positionMenu(this._element, x, y);
            
            // Animate in
            requestAnimationFrame(() => {
                this._element.style.transition = `opacity ${this.options.animationDuration}ms, transform ${this.options.animationDuration}ms`;
                this._element.style.opacity = '1';
                this._element.style.transform = 'scale(1)';
            });
            
            // Setup event handlers
            this._setupEventHandlers();
            
            // Focus for keyboard nav
            this._element.setAttribute('tabindex', '-1');
            this._element.focus();
        });
    }

    /**
     * Create menu DOM element
     * @private
     */
    _createMenuElement(items) {
        const menu = document.createElement('div');
        menu.className = 'ctx-menu';
        
        items.forEach((item, index) => {
            const el = this._createItemElement(item, index);
            menu.appendChild(el);
        });
        
        return menu;
    }

    /**
     * Create item DOM element
     * @private
     */
    _createItemElement(item, index) {
        if (item.type === MenuItemType.SEPARATOR) {
            const sep = document.createElement('div');
            sep.className = 'ctx-menu-separator';
            return sep;
        }
        
        const el = document.createElement('div');
        el.className = 'ctx-menu-item';
        el.dataset.index = index;
        
        if (item.disabled) {
            el.classList.add('disabled');
        }
        
        // Icon or checkbox/radio
        if (item.type === MenuItemType.CHECKBOX) {
            const check = document.createElement('span');
            check.className = 'ctx-menu-checkbox';
            check.textContent = item.checked ? '✓' : '';
            el.appendChild(check);
        } else if (item.type === MenuItemType.RADIO) {
            const radio = document.createElement('span');
            radio.className = 'ctx-menu-radio';
            radio.textContent = item.checked ? '●' : '○';
            el.appendChild(radio);
        } else if (item.icon) {
            const icon = document.createElement('span');
            icon.className = 'ctx-menu-icon';
            icon.innerHTML = item.icon;
            el.appendChild(icon);
        }
        
        // Label
        const label = document.createElement('span');
        label.className = 'ctx-menu-label';
        label.textContent = item.label;
        el.appendChild(label);
        
        // Shortcut
        if (item.shortcut) {
            const shortcut = document.createElement('span');
            shortcut.className = 'ctx-menu-shortcut';
            shortcut.textContent = item.shortcut;
            el.appendChild(shortcut);
        }
        
        // Submenu arrow
        if (item.type === MenuItemType.SUBMENU) {
            const arrow = document.createElement('span');
            arrow.className = 'ctx-menu-arrow';
            arrow.textContent = '▶';
            el.appendChild(arrow);
        }
        
        // Event handlers
        el.addEventListener('click', (e) => {
            if (item.disabled) return;
            
            if (item.type === MenuItemType.SUBMENU) {
                this._showSubmenu(el, item);
            } else {
                this._selectItem(item);
            }
        });
        
        el.addEventListener('mouseenter', () => {
            if (item.type === MenuItemType.SUBMENU && !item.disabled) {
                this._showSubmenu(el, item);
            } else {
                this._closeSubmenu();
            }
            
            // Update active state
            this._setActiveIndex(index);
        });
        
        return el;
    }

    /**
     * Position menu within viewport
     * @private
     */
    _positionMenu(menu, x, y) {
        const rect = menu.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        // Adjust horizontal position
        if (x + rect.width > vw) {
            x = Math.max(0, vw - rect.width - 8);
        }
        
        // Adjust vertical position
        if (y + rect.height > vh) {
            y = Math.max(0, vh - rect.height - 8);
        }
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
    }

    /**
     * Show submenu
     * @private
     */
    _showSubmenu(parentEl, item) {
        this._closeSubmenu();
        
        const submenu = this._createMenuElement(item.items);
        submenu.classList.add('ctx-menu-submenu');
        submenu.style.zIndex = this.options.zIndex + 1;
        
        document.body.appendChild(submenu);
        
        // Position relative to parent item
        const parentRect = parentEl.getBoundingClientRect();
        let x = parentRect.right;
        let y = parentRect.top;
        
        // Check if submenu fits on right
        const submenuRect = submenu.getBoundingClientRect();
        if (x + submenuRect.width > window.innerWidth) {
            x = parentRect.left - submenuRect.width;
        }
        
        this._positionMenu(submenu, x, y);
        this._activeSubmenu = submenu;
    }

    /**
     * Close submenu
     * @private
     */
    _closeSubmenu() {
        if (this._activeSubmenu) {
            this._activeSubmenu.remove();
            this._activeSubmenu = null;
        }
    }

    /**
     * Set active item index
     * @private
     */
    _setActiveIndex(index) {
        // Remove previous active
        const items = this._element.querySelectorAll('.ctx-menu-item');
        items.forEach(item => item.classList.remove('active'));
        
        // Set new active
        this._activeIndex = index;
        if (index >= 0 && index < items.length) {
            items[index].classList.add('active');
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Select item
     * @private
     */
    _selectItem(item) {
        if (item.action) {
            item.action(item);
        }
        
        this.close(item);
    }

    /**
     * Setup event handlers
     * @private
     */
    _setupEventHandlers() {
        // Click outside to close
        this._clickHandler = (e) => {
            if (!this._element.contains(e.target) && 
                (!this._activeSubmenu || !this._activeSubmenu.contains(e.target))) {
                this.close();
            }
        };
        
        // Delay to avoid immediate close
        setTimeout(() => {
            document.addEventListener('click', this._clickHandler);
        }, 0);
        
        // Keyboard navigation
        this._keyHandler = (e) => {
            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    this._navigateNext();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this._navigatePrev();
                    break;
                    
                case 'ArrowRight':
                    e.preventDefault();
                    if (this._activeIndex >= 0) {
                        const item = this._items[this._activeIndex];
                        if (item && item.type === MenuItemType.SUBMENU) {
                            const itemEl = this._element.querySelectorAll('.ctx-menu-item')[this._activeIndex];
                            this._showSubmenu(itemEl, item);
                        }
                    }
                    break;
                    
                case 'ArrowLeft':
                    e.preventDefault();
                    this._closeSubmenu();
                    break;
                    
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (this._activeIndex >= 0) {
                        const item = this._items[this._activeIndex];
                        if (item && item.type !== MenuItemType.SEPARATOR) {
                            if (item.type === MenuItemType.SUBMENU) {
                                const itemEl = this._element.querySelectorAll('.ctx-menu-item')[this._activeIndex];
                                this._showSubmenu(itemEl, item);
                            } else {
                                this._selectItem(item);
                            }
                        }
                    }
                    break;
            }
        };
        
        document.addEventListener('keydown', this._keyHandler);
        
        // Scroll to close
        window.addEventListener('scroll', () => this.close(), { once: true });
    }

    /**
     * Navigate to next item
     * @private
     */
    _navigateNext() {
        let nextIndex = this._activeIndex + 1;
        
        // Skip separators
        while (nextIndex < this._items.length && 
               this._items[nextIndex].type === MenuItemType.SEPARATOR) {
            nextIndex++;
        }
        
        if (nextIndex < this._items.length) {
            this._setActiveIndex(nextIndex);
        }
    }

    /**
     * Navigate to previous item
     * @private
     */
    _navigatePrev() {
        let prevIndex = this._activeIndex - 1;
        
        // Skip separators
        while (prevIndex >= 0 && 
               this._items[prevIndex].type === MenuItemType.SEPARATOR) {
            prevIndex--;
        }
        
        if (prevIndex >= 0) {
            this._setActiveIndex(prevIndex);
        }
    }

    /**
     * Close menu
     * @param {any} result 
     */
    close(result = null) {
        this._closeSubmenu();
        
        if (this._element) {
            this._element.remove();
            this._element = null;
        }
        
        if (this._clickHandler) {
            document.removeEventListener('click', this._clickHandler);
            this._clickHandler = null;
        }
        
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
        
        if (this._onClose) {
            this._onClose(result);
            this._onClose = null;
        }
        
        this._items = [];
        this._activeIndex = -1;
    }

    /**
     * Check if menu is open
     * @returns {boolean}
     */
    isOpen() {
        return this._element !== null;
    }
}

// ==========================================
// CONTEXT MENU HELPER
// ==========================================

/**
 * Global context menu instance
 */
let globalContextMenu = null;

/**
 * Get or create global context menu
 * @returns {ContextMenu}
 */
export function getContextMenu() {
    if (!globalContextMenu) {
        globalContextMenu = new ContextMenu();
    }
    return globalContextMenu;
}

/**
 * Show context menu at event position
 * @param {MouseEvent} event 
 * @param {Array} items 
 * @returns {Promise<any>}
 */
export function showContextMenu(event, items) {
    event.preventDefault();
    return getContextMenu().show(event.clientX, event.clientY, items);
}

/**
 * Attach context menu to element
 * @param {HTMLElement} element 
 * @param {Array|Function} items - Items or function returning items
 * @param {object} options
 * @returns {Function} Cleanup function
 */
export function attachContextMenu(element, items, options = {}) {
    const handler = async (event) => {
        event.preventDefault();
        
        const menuItems = typeof items === 'function' ? items(event) : items;
        const result = await getContextMenu().show(event.clientX, event.clientY, menuItems);
        
        if (options.onSelect && result) {
            options.onSelect(result, event);
        }
    };
    
    element.addEventListener('contextmenu', handler);
    
    return () => {
        element.removeEventListener('contextmenu', handler);
    };
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    MenuItemType,
    menuItem,
    separator,
    submenu,
    checkbox,
    radio,
    ContextMenu,
    getContextMenu,
    showContextMenu,
    attachContextMenu
};
