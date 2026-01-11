/**
 * Asciistrator - Status Bar
 * 
 * Status bar showing document info, cursor position, zoom level, etc.
 */

import { EventEmitter } from '../utils/events.js';

// ==========================================
// STATUS ITEM
// ==========================================

/**
 * StatusItem - Individual status bar item
 */
export class StatusItem extends EventEmitter {
    /**
     * Create a status item
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Item identifier */
        this.id = options.id || `status_${Date.now()}`;
        
        /** @type {string} Display text */
        this.text = options.text || '';
        
        /** @type {string} Icon (emoji/character) */
        this.icon = options.icon || '';
        
        /** @type {string} Tooltip */
        this.tooltip = options.tooltip || '';
        
        /** @type {string} Position: 'left', 'center', 'right' */
        this.position = options.position || 'left';
        
        /** @type {number} Priority (higher = more important) */
        this.priority = options.priority || 0;
        
        /** @type {boolean} Is item clickable */
        this.clickable = options.clickable || false;
        
        /** @type {boolean} Is item visible */
        this.visible = options.visible !== false;
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
    }

    /**
     * Render status item
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'status-item';
        this.element.setAttribute('data-id', this.id);

        if (this.clickable) {
            this.element.classList.add('clickable');
            this.element.tabIndex = 0;
        }

        if (this.tooltip) {
            this.element.title = this.tooltip;
        }

        this._updateContent();
        this._bindEvents();
        this.update();

        return this.element;
    }

    /**
     * Update content
     * @private
     */
    _updateContent() {
        if (!this.element) return;

        this.element.innerHTML = '';

        if (this.icon) {
            const iconEl = document.createElement('span');
            iconEl.className = 'status-item-icon';
            iconEl.textContent = this.icon;
            this.element.appendChild(iconEl);
        }

        const textEl = document.createElement('span');
        textEl.className = 'status-item-text';
        textEl.textContent = this.text;
        this.element.appendChild(textEl);
    }

    /**
     * Bind events
     * @private
     */
    _bindEvents() {
        if (this.clickable) {
            this.element.addEventListener('click', () => {
                this.emit('click', this);
            });
        }
    }

    /**
     * Update visual state
     */
    update() {
        if (!this.element) return;
        this.element.style.display = this.visible ? '' : 'none';
    }

    /**
     * Set text content
     * @param {string} text
     */
    setText(text) {
        this.text = text;
        this._updateContent();
    }

    /**
     * Set icon
     * @param {string} icon
     */
    setIcon(icon) {
        this.icon = icon;
        this._updateContent();
    }

    /**
     * Set visibility
     * @param {boolean} visible
     */
    setVisible(visible) {
        this.visible = visible;
        this.update();
    }
}

// ==========================================
// STATUS BAR
// ==========================================

/**
 * StatusBar - Application status bar
 */
export class StatusBar extends EventEmitter {
    /**
     * Create a status bar
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {HTMLElement|null} Container element */
        this.container = options.container || null;
        
        /** @type {Array<StatusItem>} Status items */
        this.items = [];
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
        
        /** @type {HTMLElement|null} Left section */
        this.leftSection = null;
        
        /** @type {HTMLElement|null} Center section */
        this.centerSection = null;
        
        /** @type {HTMLElement|null} Right section */
        this.rightSection = null;
        
        /** @type {Map<string, StatusItem>} Item lookup */
        this.itemMap = new Map();
    }

    /**
     * Add status item
     * @param {StatusItem} item
     */
    addItem(item) {
        this.items.push(item);
        this.itemMap.set(item.id, item);

        item.on('click', (clickedItem) => {
            this.emit('itemClick', clickedItem);
        });

        if (this.element) {
            this._addItemToSection(item);
        }
    }

    /**
     * Add item to appropriate section
     * @private
     */
    _addItemToSection(item) {
        const section = this._getSection(item.position);
        if (section) {
            const el = item.render();
            
            // Insert by priority
            const items = this.items.filter(i => i.position === item.position);
            const sortedItems = items.sort((a, b) => b.priority - a.priority);
            const index = sortedItems.indexOf(item);
            
            if (index < section.children.length) {
                section.insertBefore(el, section.children[index]);
            } else {
                section.appendChild(el);
            }
        }
    }

    /**
     * Get section element by position
     * @private
     */
    _getSection(position) {
        switch (position) {
            case 'left': return this.leftSection;
            case 'center': return this.centerSection;
            case 'right': return this.rightSection;
            default: return this.leftSection;
        }
    }

    /**
     * Get item by ID
     * @param {string} id
     * @returns {StatusItem|undefined}
     */
    getItem(id) {
        return this.itemMap.get(id);
    }

    /**
     * Remove item by ID
     * @param {string} id
     */
    removeItem(id) {
        const item = this.itemMap.get(id);
        if (item) {
            item.element?.remove();
            this.itemMap.delete(id);
            this.items = this.items.filter(i => i.id !== id);
        }
    }

    /**
     * Render status bar
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'status-bar';

        // Left section
        this.leftSection = document.createElement('div');
        this.leftSection.className = 'status-bar-left';
        this.element.appendChild(this.leftSection);

        // Center section
        this.centerSection = document.createElement('div');
        this.centerSection.className = 'status-bar-center';
        this.element.appendChild(this.centerSection);

        // Right section
        this.rightSection = document.createElement('div');
        this.rightSection.className = 'status-bar-right';
        this.element.appendChild(this.rightSection);

        // Add existing items
        for (const item of this.items) {
            this._addItemToSection(item);
        }

        if (this.container) {
            this.container.appendChild(this.element);
        }

        return this.element;
    }

    /**
     * Destroy status bar
     */
    destroy() {
        this.element?.remove();
    }
}

// ==========================================
// DEFAULT STATUS BAR
// ==========================================

/**
 * Create default application status bar
 * @param {object} options
 * @returns {StatusBar}
 */
export function createDefaultStatusBar(options = {}) {
    const statusBar = new StatusBar();

    // Tool status (left)
    statusBar.addItem(new StatusItem({
        id: 'tool',
        icon: '↖',
        text: 'Selection Tool',
        position: 'left',
        priority: 100
    }));

    // Selection info (left)
    statusBar.addItem(new StatusItem({
        id: 'selection',
        text: 'No selection',
        position: 'left',
        priority: 90
    }));

    // Document info (center)
    statusBar.addItem(new StatusItem({
        id: 'document',
        icon: '📄',
        text: 'Untitled',
        position: 'center',
        priority: 100,
        clickable: true,
        tooltip: 'Document info'
    }));

    // Canvas size (center)
    statusBar.addItem(new StatusItem({
        id: 'canvasSize',
        text: '80 × 40',
        position: 'center',
        priority: 90,
        tooltip: 'Canvas size (characters)'
    }));

    // Cursor position (right)
    statusBar.addItem(new StatusItem({
        id: 'cursor',
        icon: '┼',
        text: 'X: 0, Y: 0',
        position: 'right',
        priority: 100,
        tooltip: 'Cursor position'
    }));

    // Zoom level (right)
    statusBar.addItem(new StatusItem({
        id: 'zoom',
        icon: '🔍',
        text: '100%',
        position: 'right',
        priority: 90,
        clickable: true,
        tooltip: 'Zoom level (click to change)'
    }));

    // Layer info (right)
    statusBar.addItem(new StatusItem({
        id: 'layer',
        icon: '☰',
        text: 'Layer 1',
        position: 'right',
        priority: 80,
        tooltip: 'Current layer'
    }));

    // Objects count (right)
    statusBar.addItem(new StatusItem({
        id: 'objects',
        text: '0 objects',
        position: 'right',
        priority: 70,
        tooltip: 'Total objects in document'
    }));

    return statusBar;
}

// ==========================================
// STATUS BAR CONTROLLER
// ==========================================

/**
 * StatusBarController - Connects status bar to application state
 */
export class StatusBarController {
    /**
     * Create status bar controller
     * @param {StatusBar} statusBar
     */
    constructor(statusBar) {
        /** @type {StatusBar} */
        this.statusBar = statusBar;
    }

    /**
     * Update tool display
     * @param {string} toolName
     * @param {string} toolIcon
     */
    setTool(toolName, toolIcon = '↖') {
        const item = this.statusBar.getItem('tool');
        if (item) {
            item.setText(toolName);
            item.setIcon(toolIcon);
        }
    }

    /**
     * Update selection info
     * @param {number} count
     * @param {string} type
     */
    setSelection(count, type = '') {
        const item = this.statusBar.getItem('selection');
        if (item) {
            if (count === 0) {
                item.setText('No selection');
            } else if (count === 1) {
                item.setText(type || '1 object selected');
            } else {
                item.setText(`${count} objects selected`);
            }
        }
    }

    /**
     * Update document name
     * @param {string} name
     * @param {boolean} modified
     */
    setDocument(name, modified = false) {
        const item = this.statusBar.getItem('document');
        if (item) {
            item.setText(name + (modified ? ' •' : ''));
        }
    }

    /**
     * Update canvas size
     * @param {number} width
     * @param {number} height
     */
    setCanvasSize(width, height) {
        const item = this.statusBar.getItem('canvasSize');
        if (item) {
            item.setText(`${width} × ${height}`);
        }
    }

    /**
     * Update cursor position
     * @param {number} x
     * @param {number} y
     */
    setCursor(x, y) {
        const item = this.statusBar.getItem('cursor');
        if (item) {
            item.setText(`X: ${Math.round(x)}, Y: ${Math.round(y)}`);
        }
    }

    /**
     * Update zoom level
     * @param {number} zoom - Zoom percentage (100 = 100%)
     */
    setZoom(zoom) {
        const item = this.statusBar.getItem('zoom');
        if (item) {
            item.setText(`${Math.round(zoom)}%`);
        }
    }

    /**
     * Update current layer
     * @param {string} layerName
     */
    setLayer(layerName) {
        const item = this.statusBar.getItem('layer');
        if (item) {
            item.setText(layerName);
        }
    }

    /**
     * Update object count
     * @param {number} count
     */
    setObjectCount(count) {
        const item = this.statusBar.getItem('objects');
        if (item) {
            item.setText(`${count} object${count !== 1 ? 's' : ''}`);
        }
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    StatusItem,
    StatusBar,
    createDefaultStatusBar,
    StatusBarController
};
