/**
 * Asciistrator - Toolbar System
 * 
 * Tool buttons, groups, and icons for drawing tools.
 */

import { EventEmitter } from '../utils/events.js';

// ==========================================
// TOOLBAR BUTTON
// ==========================================

/**
 * ToolbarButton - Individual toolbar button
 */
export class ToolbarButton extends EventEmitter {
    /**
     * Create a toolbar button
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Button identifier */
        this.id = options.id || `btn_${Date.now()}`;
        
        /** @type {string} Display label */
        this.label = options.label || '';
        
        /** @type {string} Button icon (emoji/character) */
        this.icon = options.icon || '▢';
        
        /** @type {string} Tooltip text */
        this.tooltip = options.tooltip || '';
        
        /** @type {string} Keyboard shortcut */
        this.shortcut = options.shortcut || '';
        
        /** @type {string} Button type: 'button', 'toggle', 'dropdown' */
        this.type = options.type || 'button';
        
        /** @type {boolean} Is button enabled */
        this.enabled = options.enabled !== false;
        
        /** @type {boolean} Is button active/pressed */
        this.active = options.active || false;
        
        /** @type {string} Tool ID this button activates */
        this.toolId = options.toolId || '';
        
        /** @type {string} Command to execute */
        this.command = options.command || '';
        
        /** @type {Array} Dropdown items */
        this.items = options.items || [];
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
        
        /** @type {HTMLElement|null} Dropdown element */
        this.dropdown = null;
    }

    /**
     * Render button to DOM
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('button');
        this.element.className = 'toolbar-button';
        this.element.setAttribute('data-id', this.id);
        
        if (this.type === 'dropdown') {
            this.element.classList.add('has-dropdown');
        }

        // Icon
        const iconEl = document.createElement('span');
        iconEl.className = 'toolbar-button-icon';
        iconEl.textContent = this.icon;
        this.element.appendChild(iconEl);

        // Label (optional)
        if (this.label && this.type !== 'dropdown') {
            const labelEl = document.createElement('span');
            labelEl.className = 'toolbar-button-label';
            labelEl.textContent = this.label;
            this.element.appendChild(labelEl);
        }

        // Dropdown indicator
        if (this.type === 'dropdown' || this.items.length > 0) {
            const arrowEl = document.createElement('span');
            arrowEl.className = 'toolbar-button-arrow';
            arrowEl.textContent = '▼';
            this.element.appendChild(arrowEl);
        }

        // Tooltip
        if (this.tooltip || this.shortcut) {
            const tip = this.tooltip + (this.shortcut ? ` (${this.shortcut})` : '');
            this.element.title = tip;
        }

        this.update();
        this._bindEvents();

        return this.element;
    }

    /**
     * Bind event handlers
     * @private
     */
    _bindEvents() {
        this.element.addEventListener('click', (e) => {
            if (!this.enabled) return;

            if (this.items.length > 0) {
                this._toggleDropdown();
            } else {
                this.emit('click', this);
            }
        });

        // Long press for dropdown items
        if (this.items.length > 0 && this.type !== 'dropdown') {
            let pressTimer;
            
            this.element.addEventListener('mousedown', () => {
                pressTimer = setTimeout(() => {
                    this._showDropdown();
                }, 500);
            });

            this.element.addEventListener('mouseup', () => {
                clearTimeout(pressTimer);
            });

            this.element.addEventListener('mouseleave', () => {
                clearTimeout(pressTimer);
            });
        }
    }

    /**
     * Toggle dropdown visibility
     * @private
     */
    _toggleDropdown() {
        if (this.dropdown) {
            this._hideDropdown();
        } else {
            this._showDropdown();
        }
    }

    /**
     * Show dropdown menu
     * @private
     */
    _showDropdown() {
        if (this.dropdown || this.items.length === 0) return;

        this.dropdown = document.createElement('div');
        this.dropdown.className = 'toolbar-dropdown';

        for (const item of this.items) {
            const itemEl = document.createElement('button');
            itemEl.className = 'toolbar-dropdown-item';
            
            const iconEl = document.createElement('span');
            iconEl.className = 'toolbar-dropdown-icon';
            iconEl.textContent = item.icon || '';
            itemEl.appendChild(iconEl);

            const labelEl = document.createElement('span');
            labelEl.className = 'toolbar-dropdown-label';
            labelEl.textContent = item.label || '';
            itemEl.appendChild(labelEl);

            if (item.shortcut) {
                const shortcutEl = document.createElement('span');
                shortcutEl.className = 'toolbar-dropdown-shortcut';
                shortcutEl.textContent = item.shortcut;
                itemEl.appendChild(shortcutEl);
            }

            itemEl.addEventListener('click', () => {
                this.emit('itemClick', item);
                this._hideDropdown();
            });

            this.dropdown.appendChild(itemEl);
        }

        // Position dropdown
        const rect = this.element.getBoundingClientRect();
        this.dropdown.style.position = 'fixed';
        this.dropdown.style.left = `${rect.left}px`;
        this.dropdown.style.top = `${rect.bottom}px`;

        document.body.appendChild(this.dropdown);

        // Close on outside click
        const closeHandler = (e) => {
            if (!this.dropdown?.contains(e.target) && !this.element.contains(e.target)) {
                this._hideDropdown();
                document.removeEventListener('click', closeHandler);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 0);
    }

    /**
     * Hide dropdown menu
     * @private
     */
    _hideDropdown() {
        if (this.dropdown) {
            this.dropdown.remove();
            this.dropdown = null;
        }
    }

    /**
     * Update button visual state
     */
    update() {
        if (!this.element) return;

        this.element.classList.toggle('disabled', !this.enabled);
        this.element.classList.toggle('active', this.active);
        this.element.disabled = !this.enabled;
    }

    /**
     * Set active state
     * @param {boolean} active
     */
    setActive(active) {
        this.active = active;
        this.update();
    }

    /**
     * Set enabled state
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.update();
    }

    /**
     * Destroy button
     */
    destroy() {
        this._hideDropdown();
        this.element?.remove();
    }
}

// ==========================================
// TOOLBAR GROUP
// ==========================================

/**
 * ToolbarGroup - Group of related toolbar buttons
 */
export class ToolbarGroup extends EventEmitter {
    /**
     * Create a toolbar group
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Group identifier */
        this.id = options.id || `group_${Date.now()}`;
        
        /** @type {string} Group label */
        this.label = options.label || '';
        
        /** @type {string} Selection mode: 'none', 'single', 'multiple' */
        this.selectionMode = options.selectionMode || 'none';
        
        /** @type {Array<ToolbarButton>} Buttons in group */
        this.buttons = [];
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
    }

    /**
     * Add button to group
     * @param {ToolbarButton} button
     */
    addButton(button) {
        this.buttons.push(button);

        button.on('click', () => {
            if (this.selectionMode === 'single') {
                this._selectButton(button);
            }
            this.emit('buttonClick', button);
        });

        button.on('itemClick', (item) => {
            this.emit('itemClick', { button, item });
        });

        if (this.element) {
            const container = this.element.querySelector('.toolbar-group-buttons');
            container?.appendChild(button.render());
        }
    }

    /**
     * Select a button (single selection mode)
     * @private
     */
    _selectButton(selected) {
        for (const button of this.buttons) {
            button.setActive(button === selected);
        }
    }

    /**
     * Get selected button(s)
     * @returns {ToolbarButton|Array<ToolbarButton>|null}
     */
    getSelected() {
        if (this.selectionMode === 'single') {
            return this.buttons.find(b => b.active) || null;
        } else if (this.selectionMode === 'multiple') {
            return this.buttons.filter(b => b.active);
        }
        return null;
    }

    /**
     * Select button by ID
     * @param {string} id
     */
    selectById(id) {
        const button = this.buttons.find(b => b.id === id || b.toolId === id);
        if (button) {
            this._selectButton(button);
        }
    }

    /**
     * Render group to DOM
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'toolbar-group';
        this.element.setAttribute('data-id', this.id);

        if (this.label) {
            const labelEl = document.createElement('div');
            labelEl.className = 'toolbar-group-label';
            labelEl.textContent = this.label;
            this.element.appendChild(labelEl);
        }

        const container = document.createElement('div');
        container.className = 'toolbar-group-buttons';

        for (const button of this.buttons) {
            container.appendChild(button.render());
        }

        this.element.appendChild(container);

        return this.element;
    }

    /**
     * Destroy group
     */
    destroy() {
        for (const button of this.buttons) {
            button.destroy();
        }
        this.element?.remove();
    }
}

// ==========================================
// TOOLBAR SEPARATOR
// ==========================================

/**
 * ToolbarSeparator - Visual separator between groups
 */
export class ToolbarSeparator {
    constructor() {
        /** @type {HTMLElement|null} */
        this.element = null;
    }

    /**
     * Render separator
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'toolbar-separator';
        return this.element;
    }
}

// ==========================================
// TOOLBAR
// ==========================================

/**
 * Toolbar - Main toolbar container
 */
export class Toolbar extends EventEmitter {
    /**
     * Create a toolbar
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {HTMLElement|null} Container element */
        this.container = options.container || null;
        
        /** @type {string} Orientation: 'horizontal', 'vertical' */
        this.orientation = options.orientation || 'vertical';
        
        /** @type {string} Position: 'left', 'right', 'top', 'bottom' */
        this.position = options.position || 'left';
        
        /** @type {Array<ToolbarGroup|ToolbarSeparator>} Items */
        this.items = [];
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
        
        /** @type {Map<string, ToolbarButton>} Button lookup */
        this.buttonMap = new Map();
    }

    /**
     * Add group to toolbar
     * @param {ToolbarGroup} group
     */
    addGroup(group) {
        this.items.push(group);

        // Index buttons
        for (const button of group.buttons) {
            this.buttonMap.set(button.id, button);
            if (button.toolId) {
                this.buttonMap.set(button.toolId, button);
            }
        }

        group.on('buttonClick', (button) => {
            this.emit('buttonClick', button);
        });

        group.on('itemClick', ({ button, item }) => {
            this.emit('itemClick', { button, item });
        });

        if (this.element) {
            this.element.appendChild(group.render());
        }
    }

    /**
     * Add separator to toolbar
     */
    addSeparator() {
        const sep = new ToolbarSeparator();
        this.items.push(sep);
        
        if (this.element) {
            this.element.appendChild(sep.render());
        }
    }

    /**
     * Get button by ID
     * @param {string} id
     * @returns {ToolbarButton|undefined}
     */
    getButton(id) {
        return this.buttonMap.get(id);
    }

    /**
     * Select tool by ID
     * @param {string} toolId
     */
    selectTool(toolId) {
        for (const item of this.items) {
            if (item instanceof ToolbarGroup && item.selectionMode === 'single') {
                const button = item.buttons.find(b => b.toolId === toolId);
                if (button) {
                    item.selectById(toolId);
                    return;
                }
            }
        }
    }

    /**
     * Render toolbar
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = `toolbar toolbar-${this.orientation} toolbar-${this.position}`;

        for (const item of this.items) {
            this.element.appendChild(item.render());
        }

        if (this.container) {
            this.container.appendChild(this.element);
        }

        return this.element;
    }

    /**
     * Destroy toolbar
     */
    destroy() {
        for (const item of this.items) {
            if (item.destroy) item.destroy();
        }
        this.element?.remove();
    }
}

// ==========================================
// TOOL ICONS
// ==========================================

/**
 * Default tool icons mapping
 */
export const ToolIcons = {
    // Selection tools
    select: '↖',
    directSelect: '⬚',
    lasso: '〰',
    marquee: '⬜',

    // Shape tools
    rectangle: '□',
    ellipse: '○',
    polygon: '⬡',
    star: '☆',
    line: '╱',
    polyline: '⌇',
    arc: '⌒',

    // Path tools
    pen: '✒',
    pencil: '✏',
    brush: '🖌',
    eraser: '⌫',
    scissors: '✂',

    // Text tools
    text: 'T',
    asciiArt: '𝔸',

    // View tools
    hand: '✋',
    zoom: '🔍',

    // Other
    eyedropper: '💧',
    fill: '🪣',
    gradient: '▓'
};

// ==========================================
// DEFAULT TOOLBAR
// ==========================================

/**
 * Create default application toolbar
 * @param {object} handlers - Action handlers
 * @returns {Toolbar}
 */
export function createDefaultToolbar(handlers = {}) {
    const toolbar = new Toolbar({
        orientation: 'vertical',
        position: 'left'
    });

    // Selection Tools Group
    const selectionGroup = new ToolbarGroup({
        id: 'selection',
        selectionMode: 'single'
    });

    selectionGroup.addButton(new ToolbarButton({
        id: 'btn-select',
        toolId: 'select',
        icon: ToolIcons.select,
        tooltip: 'Selection Tool',
        shortcut: 'V',
        active: true,
        items: [
            { id: 'select', icon: ToolIcons.select, label: 'Selection', shortcut: 'V' },
            { id: 'directSelect', icon: ToolIcons.directSelect, label: 'Direct Selection', shortcut: 'A' },
            { id: 'lasso', icon: ToolIcons.lasso, label: 'Lasso', shortcut: 'Q' },
            { id: 'marquee', icon: ToolIcons.marquee, label: 'Marquee', shortcut: 'M' }
        ]
    }));

    toolbar.addGroup(selectionGroup);
    toolbar.addSeparator();

    // Shape Tools Group
    const shapeGroup = new ToolbarGroup({
        id: 'shapes',
        selectionMode: 'single'
    });

    shapeGroup.addButton(new ToolbarButton({
        id: 'btn-rectangle',
        toolId: 'rectangle',
        icon: ToolIcons.rectangle,
        tooltip: 'Rectangle Tool',
        shortcut: 'R',
        items: [
            { id: 'rectangle', icon: ToolIcons.rectangle, label: 'Rectangle', shortcut: 'R' },
            { id: 'ellipse', icon: ToolIcons.ellipse, label: 'Ellipse', shortcut: 'O' },
            { id: 'polygon', icon: ToolIcons.polygon, label: 'Polygon' },
            { id: 'star', icon: ToolIcons.star, label: 'Star' }
        ]
    }));

    shapeGroup.addButton(new ToolbarButton({
        id: 'btn-line',
        toolId: 'line',
        icon: ToolIcons.line,
        tooltip: 'Line Tool',
        shortcut: '\\',
        items: [
            { id: 'line', icon: ToolIcons.line, label: 'Line', shortcut: '\\' },
            { id: 'polyline', icon: ToolIcons.polyline, label: 'Polyline' },
            { id: 'arc', icon: ToolIcons.arc, label: 'Arc' }
        ]
    }));

    toolbar.addGroup(shapeGroup);
    toolbar.addSeparator();

    // Path Tools Group
    const pathGroup = new ToolbarGroup({
        id: 'paths',
        selectionMode: 'single'
    });

    pathGroup.addButton(new ToolbarButton({
        id: 'btn-pen',
        toolId: 'pen',
        icon: ToolIcons.pen,
        tooltip: 'Pen Tool',
        shortcut: 'P',
        items: [
            { id: 'pen', icon: ToolIcons.pen, label: 'Pen', shortcut: 'P' },
            { id: 'pencil', icon: ToolIcons.pencil, label: 'Pencil', shortcut: 'N' },
            { id: 'brush', icon: ToolIcons.brush, label: 'Brush', shortcut: 'B' }
        ]
    }));

    pathGroup.addButton(new ToolbarButton({
        id: 'btn-eraser',
        toolId: 'eraser',
        icon: ToolIcons.eraser,
        tooltip: 'Eraser Tool',
        shortcut: 'E'
    }));

    pathGroup.addButton(new ToolbarButton({
        id: 'btn-scissors',
        toolId: 'scissors',
        icon: ToolIcons.scissors,
        tooltip: 'Scissors Tool',
        shortcut: 'C'
    }));

    toolbar.addGroup(pathGroup);
    toolbar.addSeparator();

    // Text Tools Group
    const textGroup = new ToolbarGroup({
        id: 'text',
        selectionMode: 'single'
    });

    textGroup.addButton(new ToolbarButton({
        id: 'btn-text',
        toolId: 'text',
        icon: ToolIcons.text,
        tooltip: 'Text Tool',
        shortcut: 'T',
        items: [
            { id: 'text', icon: ToolIcons.text, label: 'Text', shortcut: 'T' },
            { id: 'asciiArt', icon: ToolIcons.asciiArt, label: 'ASCII Art Text' }
        ]
    }));

    toolbar.addGroup(textGroup);
    toolbar.addSeparator();

    // View Tools Group
    const viewGroup = new ToolbarGroup({
        id: 'view',
        selectionMode: 'single'
    });

    viewGroup.addButton(new ToolbarButton({
        id: 'btn-hand',
        toolId: 'hand',
        icon: ToolIcons.hand,
        tooltip: 'Hand Tool (Pan)',
        shortcut: 'H'
    }));

    viewGroup.addButton(new ToolbarButton({
        id: 'btn-zoom',
        toolId: 'zoom',
        icon: ToolIcons.zoom,
        tooltip: 'Zoom Tool',
        shortcut: 'Z'
    }));

    toolbar.addGroup(viewGroup);
    toolbar.addSeparator();

    // Color Tools Group
    const colorGroup = new ToolbarGroup({
        id: 'color',
        selectionMode: 'none'
    });

    colorGroup.addButton(new ToolbarButton({
        id: 'btn-eyedropper',
        toolId: 'eyedropper',
        icon: ToolIcons.eyedropper,
        tooltip: 'Eyedropper Tool',
        shortcut: 'I'
    }));

    toolbar.addGroup(colorGroup);

    // Connect handlers
    toolbar.on('buttonClick', (button) => {
        if (button.toolId && handlers.selectTool) {
            handlers.selectTool(button.toolId);
        }
    });

    toolbar.on('itemClick', ({ button, item }) => {
        if (item.id && handlers.selectTool) {
            handlers.selectTool(item.id);
            // Update button icon to match selected item
            const iconEl = button.element.querySelector('.toolbar-button-icon');
            if (iconEl && item.icon) {
                iconEl.textContent = item.icon;
            }
            button.toolId = item.id;
        }
    });

    return toolbar;
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    ToolbarButton,
    ToolbarGroup,
    ToolbarSeparator,
    Toolbar,
    ToolIcons,
    createDefaultToolbar
};
