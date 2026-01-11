/**
 * Asciistrator - Menu Bar System
 * 
 * Dropdown menu bar with keyboard navigation and shortcuts.
 */

import { EventEmitter } from '../utils/events.js';

// ==========================================
// MENU ITEM
// ==========================================

/**
 * MenuItem - Individual menu item
 */
export class MenuItem {
    /**
     * Create a menu item
     * @param {object} options
     */
    constructor(options = {}) {
        /** @type {string} Unique identifier */
        this.id = options.id || `item_${Date.now()}`;
        
        /** @type {string} Display label */
        this.label = options.label || '';
        
        /** @type {string} Icon (emoji or character) */
        this.icon = options.icon || '';
        
        /** @type {string} Keyboard shortcut display */
        this.shortcut = options.shortcut || '';
        
        /** @type {string} Item type: 'item', 'separator', 'submenu', 'checkbox', 'radio' */
        this.type = options.type || 'item';
        
        /** @type {boolean} Is item enabled */
        this.enabled = options.enabled !== false;
        
        /** @type {boolean} Is item checked (for checkbox/radio) */
        this.checked = options.checked || false;
        
        /** @type {string} Radio group name */
        this.group = options.group || '';
        
        /** @type {Array<MenuItem>} Submenu items */
        this.items = options.items || [];
        
        /** @type {Function} Action callback */
        this.action = options.action || null;
        
        /** @type {string} Command ID to execute */
        this.command = options.command || '';
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
        
        /** @type {Menu|null} Parent menu */
        this.parent = null;
    }

    /**
     * Create separator menu item
     * @returns {MenuItem}
     */
    static separator() {
        return new MenuItem({ type: 'separator' });
    }

    /**
     * Execute the menu item action
     */
    execute() {
        if (!this.enabled) return;
        
        if (this.type === 'checkbox') {
            this.checked = !this.checked;
        }
        
        if (this.action) {
            this.action(this);
        }
    }

    /**
     * Render menu item to DOM
     * @returns {HTMLElement}
     */
    render() {
        if (this.type === 'separator') {
            this.element = document.createElement('div');
            this.element.className = 'menu-separator';
            return this.element;
        }

        this.element = document.createElement('div');
        this.element.className = 'menu-item';
        this.element.setAttribute('data-id', this.id);
        
        if (!this.enabled) {
            this.element.classList.add('disabled');
        }
        
        if (this.items.length > 0) {
            this.element.classList.add('has-submenu');
        }

        // Icon
        if (this.icon || this.type === 'checkbox' || this.type === 'radio') {
            const iconEl = document.createElement('span');
            iconEl.className = 'menu-item-icon';
            
            if (this.type === 'checkbox') {
                iconEl.textContent = this.checked ? '☑' : '☐';
            } else if (this.type === 'radio') {
                iconEl.textContent = this.checked ? '◉' : '○';
            } else {
                iconEl.textContent = this.icon;
            }
            
            this.element.appendChild(iconEl);
        }

        // Label
        const labelEl = document.createElement('span');
        labelEl.className = 'menu-item-label';
        labelEl.textContent = this.label;
        this.element.appendChild(labelEl);

        // Shortcut
        if (this.shortcut) {
            const shortcutEl = document.createElement('span');
            shortcutEl.className = 'menu-item-shortcut';
            shortcutEl.textContent = this.shortcut;
            this.element.appendChild(shortcutEl);
        }

        // Submenu arrow
        if (this.items.length > 0) {
            const arrowEl = document.createElement('span');
            arrowEl.className = 'menu-item-arrow';
            arrowEl.textContent = '▶';
            this.element.appendChild(arrowEl);
        }

        return this.element;
    }

    /**
     * Update visual state
     */
    update() {
        if (!this.element) return;
        
        this.element.classList.toggle('disabled', !this.enabled);
        this.element.classList.toggle('checked', this.checked);
        
        const iconEl = this.element.querySelector('.menu-item-icon');
        if (iconEl && (this.type === 'checkbox' || this.type === 'radio')) {
            if (this.type === 'checkbox') {
                iconEl.textContent = this.checked ? '☑' : '☐';
            } else {
                iconEl.textContent = this.checked ? '◉' : '○';
            }
        }
    }
}

// ==========================================
// MENU
// ==========================================

/**
 * Menu - Dropdown menu container
 */
export class Menu extends EventEmitter {
    /**
     * Create a menu
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Menu identifier */
        this.id = options.id || `menu_${Date.now()}`;
        
        /** @type {string} Menu label */
        this.label = options.label || '';
        
        /** @type {Array<MenuItem>} Menu items */
        this.items = [];
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
        
        /** @type {HTMLElement|null} Items container */
        this.container = null;
        
        /** @type {boolean} Is menu open */
        this.isOpen = false;
        
        /** @type {number} Currently focused item index */
        this.focusedIndex = -1;
        
        /** @type {Menu|null} Active submenu */
        this.activeSubmenu = null;
        
        /** @type {Menu|null} Parent menu */
        this.parent = null;
        
        // Add initial items
        if (options.items) {
            for (const item of options.items) {
                this.addItem(item instanceof MenuItem ? item : new MenuItem(item));
            }
        }
    }

    /**
     * Add menu item
     * @param {MenuItem} item
     */
    addItem(item) {
        item.parent = this;
        this.items.push(item);
        
        if (this.container && item.type !== 'separator') {
            this.container.appendChild(item.render());
        }
    }

    /**
     * Add separator
     */
    addSeparator() {
        this.addItem(MenuItem.separator());
    }

    /**
     * Get item by ID
     * @param {string} id
     * @returns {MenuItem|null}
     */
    getItem(id) {
        for (const item of this.items) {
            if (item.id === id) return item;
            if (item.items.length > 0) {
                const submenu = new Menu({ items: item.items });
                const found = submenu.getItem(id);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Render menu
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'menu';
        this.element.setAttribute('data-id', this.id);

        this.container = document.createElement('div');
        this.container.className = 'menu-items';

        for (const item of this.items) {
            this.container.appendChild(item.render());
        }

        this.element.appendChild(this.container);
        this._bindEvents();

        return this.element;
    }

    /**
     * Bind event handlers
     * @private
     */
    _bindEvents() {
        this.container.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.menu-item');
            if (!itemEl) return;

            const item = this.items.find(i => i.element === itemEl);
            if (item && item.enabled && item.items.length === 0) {
                item.execute();
                this.emit('itemClick', item);
                this.close();
            }
        });

        this.container.addEventListener('mouseenter', (e) => {
            if (e.target.classList.contains('menu-item')) {
                this._handleItemHover(e.target);
            }
        }, true);
    }

    /**
     * Handle item hover
     * @private
     */
    _handleItemHover(itemEl) {
        const item = this.items.find(i => i.element === itemEl);
        if (!item) return;

        // Update focus
        const index = this.items.indexOf(item);
        this._setFocusedIndex(index);

        // Handle submenu
        if (this.activeSubmenu) {
            this.activeSubmenu.close();
            this.activeSubmenu = null;
        }

        if (item.items.length > 0 && item.enabled) {
            this._openSubmenu(item);
        }
    }

    /**
     * Open submenu for item
     * @private
     */
    _openSubmenu(item) {
        const submenu = new Menu({
            id: `${item.id}_submenu`,
            items: item.items
        });
        submenu.parent = this;

        const el = submenu.render();
        document.body.appendChild(el);

        // Position submenu
        const rect = item.element.getBoundingClientRect();
        el.style.position = 'fixed';
        el.style.left = `${rect.right}px`;
        el.style.top = `${rect.top}px`;

        // Adjust if off-screen
        const menuRect = el.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            el.style.left = `${rect.left - menuRect.width}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            el.style.top = `${window.innerHeight - menuRect.height}px`;
        }

        submenu.isOpen = true;
        this.activeSubmenu = submenu;

        submenu.on('itemClick', (clickedItem) => {
            this.emit('itemClick', clickedItem);
        });
    }

    /**
     * Set focused item index
     * @private
     */
    _setFocusedIndex(index) {
        // Remove previous focus
        if (this.focusedIndex >= 0 && this.items[this.focusedIndex]?.element) {
            this.items[this.focusedIndex].element.classList.remove('focused');
        }

        this.focusedIndex = index;

        // Add new focus
        if (this.focusedIndex >= 0 && this.items[this.focusedIndex]?.element) {
            this.items[this.focusedIndex].element.classList.add('focused');
        }
    }

    /**
     * Open menu at position
     * @param {number} x
     * @param {number} y
     */
    open(x, y) {
        if (!this.element) {
            this.render();
            document.body.appendChild(this.element);
        }

        this.element.style.position = 'fixed';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.display = 'block';

        // Adjust if off-screen
        const rect = this.element.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.element.style.left = `${window.innerWidth - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this.element.style.top = `${window.innerHeight - rect.height}px`;
        }

        this.isOpen = true;
        this.focusedIndex = -1;
        this.emit('open');
    }

    /**
     * Close menu
     */
    close() {
        if (this.activeSubmenu) {
            this.activeSubmenu.close();
            this.activeSubmenu = null;
        }

        if (this.element) {
            this.element.style.display = 'none';
            this.element.remove();
            this.element = null;
            this.container = null;
        }

        this.isOpen = false;
        this.focusedIndex = -1;
        this.emit('close');
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} event
     * @returns {boolean} True if handled
     */
    handleKeyDown(event) {
        if (!this.isOpen) return false;

        switch (event.key) {
            case 'ArrowDown':
                this._focusNext();
                return true;

            case 'ArrowUp':
                this._focusPrev();
                return true;

            case 'ArrowRight':
                if (this.focusedIndex >= 0) {
                    const item = this.items[this.focusedIndex];
                    if (item.items.length > 0 && item.enabled) {
                        this._openSubmenu(item);
                        this.activeSubmenu?._focusNext();
                    }
                }
                return true;

            case 'ArrowLeft':
                if (this.parent) {
                    this.close();
                }
                return true;

            case 'Enter':
            case ' ':
                if (this.focusedIndex >= 0) {
                    const item = this.items[this.focusedIndex];
                    if (item.enabled) {
                        if (item.items.length > 0) {
                            this._openSubmenu(item);
                            this.activeSubmenu?._focusNext();
                        } else {
                            item.execute();
                            this.emit('itemClick', item);
                            this.close();
                        }
                    }
                }
                return true;

            case 'Escape':
                this.close();
                return true;
        }

        return false;
    }

    /**
     * Focus next enabled item
     * @private
     */
    _focusNext() {
        let index = this.focusedIndex;
        do {
            index = (index + 1) % this.items.length;
        } while (
            this.items[index].type === 'separator' &&
            index !== this.focusedIndex
        );
        this._setFocusedIndex(index);
    }

    /**
     * Focus previous enabled item
     * @private
     */
    _focusPrev() {
        let index = this.focusedIndex;
        do {
            index = (index - 1 + this.items.length) % this.items.length;
        } while (
            this.items[index].type === 'separator' &&
            index !== this.focusedIndex
        );
        this._setFocusedIndex(index);
    }
}

// ==========================================
// MENU BAR
// ==========================================

/**
 * MenuBar - Horizontal menu bar
 */
export class MenuBar extends EventEmitter {
    /**
     * Create a menu bar
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {HTMLElement|null} Container element */
        this.container = options.container || null;
        
        /** @type {Array<{label: string, menu: Menu}>} Menu bar items */
        this.menus = [];
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
        
        /** @type {number} Active menu index */
        this.activeIndex = -1;
        
        /** @type {boolean} Is menu bar active (menu open) */
        this.isActive = false;
        
        /** @type {Function} Document click handler */
        this._documentClickHandler = null;
        
        /** @type {Function} Document keydown handler */
        this._documentKeyHandler = null;
    }

    /**
     * Add menu to menu bar
     * @param {string} label
     * @param {Menu} menu
     */
    addMenu(label, menu) {
        this.menus.push({ label, menu });
        
        menu.on('itemClick', (item) => {
            this.emit('itemClick', item);
            this._deactivate();
        });
        
        menu.on('close', () => {
            if (!this.isActive) {
                this._updateActiveState();
            }
        });
    }

    /**
     * Get menu by label
     * @param {string} label
     * @returns {Menu|null}
     */
    getMenu(label) {
        const entry = this.menus.find(m => m.label === label);
        return entry?.menu || null;
    }

    /**
     * Get menu item by ID across all menus
     * @param {string} id
     * @returns {MenuItem|null}
     */
    getItem(id) {
        for (const { menu } of this.menus) {
            const item = menu.getItem(id);
            if (item) return item;
        }
        return null;
    }

    /**
     * Render menu bar
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'menu-bar';

        for (let i = 0; i < this.menus.length; i++) {
            const { label } = this.menus[i];
            
            const button = document.createElement('button');
            button.className = 'menu-bar-item';
            button.textContent = label;
            button.setAttribute('data-index', i.toString());
            
            this.element.appendChild(button);
        }

        this._bindEvents();

        if (this.container) {
            this.container.appendChild(this.element);
        }

        return this.element;
    }

    /**
     * Bind event handlers
     * @private
     */
    _bindEvents() {
        this.element.addEventListener('click', (e) => {
            const button = e.target.closest('.menu-bar-item');
            if (!button) return;

            const index = parseInt(button.dataset.index, 10);
            
            if (this.isActive && this.activeIndex === index) {
                this._deactivate();
            } else {
                this._activateMenu(index);
            }
        });

        this.element.addEventListener('mouseenter', (e) => {
            if (!this.isActive) return;
            
            const button = e.target.closest('.menu-bar-item');
            if (!button) return;

            const index = parseInt(button.dataset.index, 10);
            if (index !== this.activeIndex) {
                this._activateMenu(index);
            }
        }, true);

        // Document handlers
        this._documentClickHandler = (e) => {
            if (!this.isActive) return;
            
            if (!this.element.contains(e.target) && 
                !document.querySelector('.menu')?.contains(e.target)) {
                this._deactivate();
            }
        };

        this._documentKeyHandler = (e) => {
            if (!this.isActive) return;
            
            const menu = this.menus[this.activeIndex]?.menu;
            
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this._activateMenu((this.activeIndex - 1 + this.menus.length) % this.menus.length);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this._activateMenu((this.activeIndex + 1) % this.menus.length);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this._deactivate();
            } else if (menu) {
                menu.handleKeyDown(e);
            }
        };

        document.addEventListener('click', this._documentClickHandler);
        document.addEventListener('keydown', this._documentKeyHandler);
    }

    /**
     * Activate menu at index
     * @private
     */
    _activateMenu(index) {
        // Close current menu
        if (this.activeIndex >= 0) {
            const currentMenu = this.menus[this.activeIndex]?.menu;
            currentMenu?.close();
        }

        this.activeIndex = index;
        this.isActive = true;
        this._updateActiveState();

        // Open new menu
        const { menu } = this.menus[index];
        const button = this.element.children[index];
        const rect = button.getBoundingClientRect();
        
        menu.open(rect.left, rect.bottom);
    }

    /**
     * Deactivate menu bar
     * @private
     */
    _deactivate() {
        if (this.activeIndex >= 0) {
            const menu = this.menus[this.activeIndex]?.menu;
            menu?.close();
        }
        
        this.activeIndex = -1;
        this.isActive = false;
        this._updateActiveState();
    }

    /**
     * Update active state on buttons
     * @private
     */
    _updateActiveState() {
        const buttons = this.element.querySelectorAll('.menu-bar-item');
        buttons.forEach((btn, i) => {
            btn.classList.toggle('active', i === this.activeIndex);
        });
    }

    /**
     * Destroy menu bar
     */
    destroy() {
        document.removeEventListener('click', this._documentClickHandler);
        document.removeEventListener('keydown', this._documentKeyHandler);
        
        for (const { menu } of this.menus) {
            menu.close();
        }
        
        this.element?.remove();
    }
}

// ==========================================
// CONTEXT MENU
// ==========================================

/**
 * ContextMenu - Right-click context menu
 */
export class ContextMenu extends Menu {
    /**
     * Show context menu at event position
     * @param {MouseEvent} event
     */
    showAt(event) {
        event.preventDefault();
        this.open(event.clientX, event.clientY);
    }
}

// ==========================================
// DEFAULT MENUS
// ==========================================

/**
 * Create default application menu bar
 * @param {object} handlers - Action handlers
 * @returns {MenuBar}
 */
export function createDefaultMenuBar(handlers = {}) {
    const menuBar = new MenuBar();

    // File Menu
    const fileMenu = new Menu({
        id: 'file',
        items: [
            { id: 'new', label: 'New Document', shortcut: '⌘N', icon: '📄', command: 'file.new' },
            { id: 'open', label: 'Open...', shortcut: '⌘O', icon: '📂', command: 'file.open' },
            { type: 'separator' },
            { id: 'save', label: 'Save', shortcut: '⌘S', icon: '💾', command: 'file.save' },
            { id: 'saveAs', label: 'Save As...', shortcut: '⌘⇧S', command: 'file.saveAs' },
            { type: 'separator' },
            { id: 'export', label: 'Export', shortcut: '⌘E', icon: '📤', command: 'file.export', items: [
                { id: 'exportPng', label: 'PNG Image...', command: 'file.export.png' },
                { id: 'exportSvg', label: 'SVG...', command: 'file.export.svg' },
                { id: 'exportTxt', label: 'Plain Text...', command: 'file.export.txt' },
                { id: 'exportHtml', label: 'HTML...', command: 'file.export.html' }
            ]},
            { type: 'separator' },
            { id: 'print', label: 'Print...', shortcut: '⌘P', command: 'file.print' }
        ]
    });

    // Edit Menu
    const editMenu = new Menu({
        id: 'edit',
        items: [
            { id: 'undo', label: 'Undo', shortcut: '⌘Z', icon: '↩', command: 'edit.undo' },
            { id: 'redo', label: 'Redo', shortcut: '⌘⇧Z', icon: '↪', command: 'edit.redo' },
            { type: 'separator' },
            { id: 'cut', label: 'Cut', shortcut: '⌘X', icon: '✂', command: 'edit.cut' },
            { id: 'copy', label: 'Copy', shortcut: '⌘C', icon: '📋', command: 'edit.copy' },
            { id: 'paste', label: 'Paste', shortcut: '⌘V', icon: '📌', command: 'edit.paste' },
            { id: 'duplicate', label: 'Duplicate', shortcut: '⌘D', command: 'edit.duplicate' },
            { id: 'delete', label: 'Delete', shortcut: '⌫', command: 'edit.delete' },
            { type: 'separator' },
            { id: 'selectAll', label: 'Select All', shortcut: '⌘A', command: 'edit.selectAll' },
            { id: 'deselectAll', label: 'Deselect All', shortcut: '⌘⇧A', command: 'edit.deselectAll' }
        ]
    });

    // View Menu
    const viewMenu = new Menu({
        id: 'view',
        items: [
            { id: 'zoomIn', label: 'Zoom In', shortcut: '⌘+', icon: '🔍', command: 'view.zoomIn' },
            { id: 'zoomOut', label: 'Zoom Out', shortcut: '⌘-', icon: '🔍', command: 'view.zoomOut' },
            { id: 'zoomFit', label: 'Fit to Window', shortcut: '⌘0', command: 'view.zoomFit' },
            { id: 'zoomActual', label: 'Actual Size', shortcut: '⌘1', command: 'view.zoomActual' },
            { type: 'separator' },
            { id: 'showGrid', label: 'Show Grid', shortcut: "⌘'", type: 'checkbox', checked: true, command: 'view.toggleGrid' },
            { id: 'showRulers', label: 'Show Rulers', shortcut: '⌘R', type: 'checkbox', checked: true, command: 'view.toggleRulers' },
            { id: 'showGuides', label: 'Show Guides', shortcut: '⌘;', type: 'checkbox', checked: true, command: 'view.toggleGuides' },
            { type: 'separator' },
            { id: 'snapToGrid', label: 'Snap to Grid', type: 'checkbox', command: 'view.snapToGrid' },
            { id: 'snapToGuides', label: 'Snap to Guides', type: 'checkbox', checked: true, command: 'view.snapToGuides' }
        ]
    });

    // Object Menu
    const objectMenu = new Menu({
        id: 'object',
        items: [
            { id: 'group', label: 'Group', shortcut: '⌘G', icon: '📦', command: 'object.group' },
            { id: 'ungroup', label: 'Ungroup', shortcut: '⌘⇧G', command: 'object.ungroup' },
            { type: 'separator' },
            { id: 'bringToFront', label: 'Bring to Front', shortcut: '⌘⇧]', command: 'object.bringToFront' },
            { id: 'bringForward', label: 'Bring Forward', shortcut: '⌘]', command: 'object.bringForward' },
            { id: 'sendBackward', label: 'Send Backward', shortcut: '⌘[', command: 'object.sendBackward' },
            { id: 'sendToBack', label: 'Send to Back', shortcut: '⌘⇧[', command: 'object.sendToBack' },
            { type: 'separator' },
            { id: 'alignObjects', label: 'Align', icon: '⬛', items: [
                { id: 'alignLeft', label: 'Align Left', command: 'object.align.left' },
                { id: 'alignCenter', label: 'Align Center', command: 'object.align.center' },
                { id: 'alignRight', label: 'Align Right', command: 'object.align.right' },
                { type: 'separator' },
                { id: 'alignTop', label: 'Align Top', command: 'object.align.top' },
                { id: 'alignMiddle', label: 'Align Middle', command: 'object.align.middle' },
                { id: 'alignBottom', label: 'Align Bottom', command: 'object.align.bottom' }
            ]},
            { id: 'transform', label: 'Transform', icon: '🔄', items: [
                { id: 'flipHorizontal', label: 'Flip Horizontal', command: 'object.flip.horizontal' },
                { id: 'flipVertical', label: 'Flip Vertical', command: 'object.flip.vertical' },
                { type: 'separator' },
                { id: 'rotate90cw', label: 'Rotate 90° CW', command: 'object.rotate.90cw' },
                { id: 'rotate90ccw', label: 'Rotate 90° CCW', command: 'object.rotate.90ccw' }
            ]}
        ]
    });

    // Window Menu
    const windowMenu = new Menu({
        id: 'window',
        items: [
            { id: 'panelLayers', label: 'Layers', type: 'checkbox', checked: true, command: 'window.panel.layers' },
            { id: 'panelProperties', label: 'Properties', type: 'checkbox', checked: true, command: 'window.panel.properties' },
            { id: 'panelColors', label: 'Colors', type: 'checkbox', checked: true, command: 'window.panel.colors' },
            { id: 'panelCharacters', label: 'Characters', type: 'checkbox', checked: true, command: 'window.panel.characters' },
            { id: 'panelHistory', label: 'History', type: 'checkbox', command: 'window.panel.history' }
        ]
    });

    // Help Menu
    const helpMenu = new Menu({
        id: 'help',
        items: [
            { id: 'helpDocs', label: 'Documentation', icon: '📚', command: 'help.docs' },
            { id: 'helpShortcuts', label: 'Keyboard Shortcuts', shortcut: '⌘/', command: 'help.shortcuts' },
            { type: 'separator' },
            { id: 'helpAbout', label: 'About Asciistrator', icon: 'ℹ️', command: 'help.about' }
        ]
    });

    menuBar.addMenu('📁 File', fileMenu);
    menuBar.addMenu('✏️ Edit', editMenu);
    menuBar.addMenu('👁 View', viewMenu);
    menuBar.addMenu('🎨 Object', objectMenu);
    menuBar.addMenu('🪟 Window', windowMenu);
    menuBar.addMenu('❓ Help', helpMenu);

    // Connect handlers
    menuBar.on('itemClick', (item) => {
        if (item.command && handlers[item.command]) {
            handlers[item.command](item);
        }
    });

    return menuBar;
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    MenuItem,
    Menu,
    MenuBar,
    ContextMenu,
    createDefaultMenuBar
};
