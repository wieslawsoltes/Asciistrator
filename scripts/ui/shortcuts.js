/**
 * Asciistrator - Keyboard Shortcuts System
 * 
 * Comprehensive keyboard shortcut management with customization support.
 */

// ==========================================
// KEY CODES
// ==========================================

/**
 * Key name mapping
 */
export const KeyNames = {
    // Special keys
    'Backspace': 'Backspace',
    'Tab': 'Tab',
    'Enter': 'Enter',
    'Escape': 'Escape',
    'Space': ' ',
    'Delete': 'Delete',
    
    // Arrow keys
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right',
    
    // Modifier display names
    'Control': 'Ctrl',
    'Meta': '⌘',
    'Alt': 'Alt',
    'Shift': 'Shift'
};

/**
 * Platform detection
 */
export const Platform = {
    isMac: typeof navigator !== 'undefined' && /Mac/.test(navigator.platform),
    isWindows: typeof navigator !== 'undefined' && /Win/.test(navigator.platform),
    isLinux: typeof navigator !== 'undefined' && /Linux/.test(navigator.platform)
};

// ==========================================
// SHORTCUT PARSER
// ==========================================

/**
 * Parse shortcut string to normalized format
 * @param {string} shortcut - e.g., "Ctrl+S", "⌘S", "Cmd+Shift+P"
 * @returns {object} Parsed shortcut object
 */
export function parseShortcut(shortcut) {
    const parts = shortcut.replace(/\s+/g, '').split(/[+]/);
    
    const result = {
        ctrl: false,
        meta: false,
        alt: false,
        shift: false,
        key: ''
    };
    
    for (const part of parts) {
        const lower = part.toLowerCase();
        
        if (lower === 'ctrl' || lower === 'control') {
            result.ctrl = true;
        } else if (lower === 'cmd' || lower === 'meta' || lower === '⌘' || lower === 'command') {
            result.meta = true;
        } else if (lower === 'alt' || lower === 'option' || lower === '⌥') {
            result.alt = true;
        } else if (lower === 'shift' || lower === '⇧') {
            result.shift = true;
        } else {
            result.key = part.length === 1 ? part.toUpperCase() : part;
        }
    }
    
    return result;
}

/**
 * Convert parsed shortcut to display string
 * @param {object} parsed 
 * @param {boolean} useMacSymbols 
 * @returns {string}
 */
export function formatShortcut(parsed, useMacSymbols = Platform.isMac) {
    const parts = [];
    
    if (useMacSymbols) {
        if (parsed.ctrl) parts.push('⌃');
        if (parsed.alt) parts.push('⌥');
        if (parsed.shift) parts.push('⇧');
        if (parsed.meta) parts.push('⌘');
    } else {
        if (parsed.ctrl) parts.push('Ctrl');
        if (parsed.alt) parts.push('Alt');
        if (parsed.shift) parts.push('Shift');
        if (parsed.meta) parts.push('Win');
    }
    
    // Format key
    let keyDisplay = parsed.key;
    if (keyDisplay === ' ') keyDisplay = 'Space';
    if (keyDisplay.length === 1) keyDisplay = keyDisplay.toUpperCase();
    
    parts.push(keyDisplay);
    
    return useMacSymbols ? parts.join('') : parts.join('+');
}

/**
 * Check if keyboard event matches shortcut
 * @param {KeyboardEvent} event 
 * @param {object} shortcut - Parsed shortcut
 * @returns {boolean}
 */
export function matchesShortcut(event, shortcut) {
    // Normalize the key
    let eventKey = event.key;
    if (eventKey.length === 1) {
        eventKey = eventKey.toUpperCase();
    }
    
    // Handle Cmd/Ctrl swap on Mac
    const useCmd = Platform.isMac;
    const primaryMod = useCmd ? event.metaKey : event.ctrlKey;
    const secondaryMod = useCmd ? event.ctrlKey : event.metaKey;
    
    // Check modifiers
    if (shortcut.ctrl && !primaryMod) return false;
    if (shortcut.meta && !secondaryMod) return false;
    if (shortcut.alt !== event.altKey) return false;
    if (shortcut.shift !== event.shiftKey) return false;
    
    // Check key
    return shortcut.key === eventKey || 
           shortcut.key === event.code ||
           shortcut.key.toLowerCase() === eventKey.toLowerCase();
}

// ==========================================
// SHORTCUT MANAGER
// ==========================================

/**
 * Keyboard shortcut manager
 */
export class ShortcutManager {
    constructor() {
        /** @type {Map<string, {callback: Function, context: string, description: string}>} */
        this._shortcuts = new Map();
        /** @type {Map<string, object>} */
        this._parsedShortcuts = new Map();
        /** @type {Set<string>} */
        this._activeContexts = new Set(['global']);
        /** @type {boolean} */
        this._enabled = true;
        /** @type {Function|null} */
        this._handler = null;
        
        this._setupListener();
    }

    /**
     * Set up keyboard listener
     * @private
     */
    _setupListener() {
        this._handler = (event) => {
            if (!this._enabled) return;
            
            // Don't handle shortcuts when typing in inputs
            const target = event.target;
            if (target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.isContentEditable) {
                // Allow some shortcuts in inputs
                const parsed = this._findMatchingShortcut(event);
                if (!parsed || !['save', 'undo', 'redo', 'selectAll'].includes(parsed.id)) {
                    return;
                }
            }
            
            this._handleKeydown(event);
        };
        
        document.addEventListener('keydown', this._handler);
    }

    /**
     * Handle keydown event
     * @private
     */
    _handleKeydown(event) {
        const match = this._findMatchingShortcut(event);
        
        if (match) {
            event.preventDefault();
            event.stopPropagation();
            
            try {
                match.callback(event);
            } catch (error) {
                console.error(`Shortcut handler error for ${match.id}:`, error);
            }
        }
    }

    /**
     * Find matching shortcut for event
     * @private
     */
    _findMatchingShortcut(event) {
        for (const [id, shortcut] of this._shortcuts) {
            // Check context
            if (!this._activeContexts.has(shortcut.context) && shortcut.context !== 'global') {
                continue;
            }
            
            const parsed = this._parsedShortcuts.get(id);
            if (parsed && matchesShortcut(event, parsed)) {
                return { id, ...shortcut };
            }
        }
        return null;
    }

    /**
     * Register a keyboard shortcut
     * @param {string} id - Unique identifier
     * @param {string} shortcut - Shortcut string (e.g., "Ctrl+S")
     * @param {Function} callback - Handler function
     * @param {object} options - Options
     * @returns {this}
     */
    register(id, shortcut, callback, options = {}) {
        const parsed = parseShortcut(shortcut);
        
        this._shortcuts.set(id, {
            shortcut,
            callback,
            context: options.context || 'global',
            description: options.description || '',
            category: options.category || 'General'
        });
        
        this._parsedShortcuts.set(id, parsed);
        
        return this;
    }

    /**
     * Unregister a shortcut
     * @param {string} id 
     * @returns {this}
     */
    unregister(id) {
        this._shortcuts.delete(id);
        this._parsedShortcuts.delete(id);
        return this;
    }

    /**
     * Update shortcut binding
     * @param {string} id 
     * @param {string} newShortcut 
     * @returns {this}
     */
    rebind(id, newShortcut) {
        const existing = this._shortcuts.get(id);
        if (existing) {
            existing.shortcut = newShortcut;
            this._parsedShortcuts.set(id, parseShortcut(newShortcut));
        }
        return this;
    }

    /**
     * Check if shortcut is already registered
     * @param {string} shortcut 
     * @param {string} excludeId - ID to exclude from check
     * @returns {string|null} - Conflicting shortcut ID or null
     */
    checkConflict(shortcut, excludeId = null) {
        const parsed = parseShortcut(shortcut);
        
        for (const [id, info] of this._shortcuts) {
            if (id === excludeId) continue;
            
            const existing = this._parsedShortcuts.get(id);
            if (existing && 
                existing.ctrl === parsed.ctrl &&
                existing.meta === parsed.meta &&
                existing.alt === parsed.alt &&
                existing.shift === parsed.shift &&
                existing.key === parsed.key) {
                return id;
            }
        }
        
        return null;
    }

    /**
     * Enable/disable shortcut handling
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this._enabled = enabled;
    }

    /**
     * Set active context
     * @param {string} context 
     */
    setContext(context) {
        this._activeContexts.clear();
        this._activeContexts.add('global');
        this._activeContexts.add(context);
    }

    /**
     * Add context
     * @param {string} context 
     */
    addContext(context) {
        this._activeContexts.add(context);
    }

    /**
     * Remove context
     * @param {string} context 
     */
    removeContext(context) {
        if (context !== 'global') {
            this._activeContexts.delete(context);
        }
    }

    /**
     * Get all registered shortcuts
     * @returns {Array<{id: string, shortcut: string, description: string, category: string}>}
     */
    getAll() {
        const result = [];
        
        for (const [id, info] of this._shortcuts) {
            result.push({
                id,
                shortcut: info.shortcut,
                displayShortcut: formatShortcut(this._parsedShortcuts.get(id)),
                description: info.description,
                category: info.category,
                context: info.context
            });
        }
        
        return result;
    }

    /**
     * Get shortcuts by category
     * @returns {Map<string, Array>}
     */
    getByCategory() {
        const categories = new Map();
        
        for (const shortcut of this.getAll()) {
            if (!categories.has(shortcut.category)) {
                categories.set(shortcut.category, []);
            }
            categories.get(shortcut.category).push(shortcut);
        }
        
        return categories;
    }

    /**
     * Export shortcuts as JSON (for customization)
     * @returns {object}
     */
    export() {
        const result = {};
        
        for (const [id, info] of this._shortcuts) {
            result[id] = info.shortcut;
        }
        
        return result;
    }

    /**
     * Import shortcuts from JSON
     * @param {object} shortcuts 
     */
    import(shortcuts) {
        for (const [id, shortcut] of Object.entries(shortcuts)) {
            if (this._shortcuts.has(id)) {
                this.rebind(id, shortcut);
            }
        }
    }

    /**
     * Destroy manager
     */
    destroy() {
        if (this._handler) {
            document.removeEventListener('keydown', this._handler);
            this._handler = null;
        }
        this._shortcuts.clear();
        this._parsedShortcuts.clear();
    }
}

// ==========================================
// DEFAULT SHORTCUTS
// ==========================================

/**
 * Default application shortcuts
 */
export const DefaultShortcuts = {
    // File operations
    'file.new': { shortcut: 'Ctrl+N', description: 'New Document', category: 'File' },
    'file.open': { shortcut: 'Ctrl+O', description: 'Open', category: 'File' },
    'file.save': { shortcut: 'Ctrl+S', description: 'Save', category: 'File' },
    'file.saveAs': { shortcut: 'Ctrl+Shift+S', description: 'Save As', category: 'File' },
    'file.export': { shortcut: 'Ctrl+E', description: 'Export', category: 'File' },
    'file.print': { shortcut: 'Ctrl+P', description: 'Print', category: 'File' },
    
    // Edit operations
    'edit.undo': { shortcut: 'Ctrl+Z', description: 'Undo', category: 'Edit' },
    'edit.redo': { shortcut: 'Ctrl+Shift+Z', description: 'Redo', category: 'Edit' },
    'edit.cut': { shortcut: 'Ctrl+X', description: 'Cut', category: 'Edit' },
    'edit.copy': { shortcut: 'Ctrl+C', description: 'Copy', category: 'Edit' },
    'edit.paste': { shortcut: 'Ctrl+V', description: 'Paste', category: 'Edit' },
    'edit.duplicate': { shortcut: 'Ctrl+D', description: 'Duplicate', category: 'Edit' },
    'edit.delete': { shortcut: 'Delete', description: 'Delete', category: 'Edit' },
    'edit.selectAll': { shortcut: 'Ctrl+A', description: 'Select All', category: 'Edit' },
    'edit.deselectAll': { shortcut: 'Ctrl+Shift+A', description: 'Deselect All', category: 'Edit' },
    
    // View operations
    'view.zoomIn': { shortcut: 'Ctrl+=', description: 'Zoom In', category: 'View' },
    'view.zoomOut': { shortcut: 'Ctrl+-', description: 'Zoom Out', category: 'View' },
    'view.zoomFit': { shortcut: 'Ctrl+0', description: 'Fit to Window', category: 'View' },
    'view.zoomActual': { shortcut: 'Ctrl+1', description: 'Actual Size', category: 'View' },
    'view.toggleGrid': { shortcut: "Ctrl+'", description: 'Toggle Grid', category: 'View' },
    'view.toggleRulers': { shortcut: 'Ctrl+R', description: 'Toggle Rulers', category: 'View' },
    'view.toggleGuides': { shortcut: 'Ctrl+;', description: 'Toggle Guides', category: 'View' },
    
    // Tools
    'tool.select': { shortcut: 'V', description: 'Select Tool', category: 'Tools' },
    'tool.directSelect': { shortcut: 'A', description: 'Direct Select Tool', category: 'Tools' },
    'tool.lasso': { shortcut: 'Q', description: 'Lasso Tool', category: 'Tools' },
    'tool.marquee': { shortcut: 'M', description: 'Marquee Tool', category: 'Tools' },
    'tool.rectangle': { shortcut: 'R', description: 'Rectangle Tool', category: 'Tools' },
    'tool.ellipse': { shortcut: 'O', description: 'Ellipse Tool', category: 'Tools' },
    'tool.polygon': { shortcut: 'Shift+O', description: 'Polygon Tool', category: 'Tools' },
    'tool.line': { shortcut: '\\', description: 'Line Tool', category: 'Tools' },
    'tool.pen': { shortcut: 'P', description: 'Pen Tool', category: 'Tools' },
    'tool.pencil': { shortcut: 'N', description: 'Pencil Tool', category: 'Tools' },
    'tool.brush': { shortcut: 'B', description: 'Brush Tool', category: 'Tools' },
    'tool.eraser': { shortcut: 'E', description: 'Eraser Tool', category: 'Tools' },
    'tool.text': { shortcut: 'T', description: 'Text Tool', category: 'Tools' },
    
    // Object operations
    'object.group': { shortcut: 'Ctrl+G', description: 'Group', category: 'Object' },
    'object.ungroup': { shortcut: 'Ctrl+Shift+G', description: 'Ungroup', category: 'Object' },
    'object.bringToFront': { shortcut: 'Ctrl+Shift+]', description: 'Bring to Front', category: 'Object' },
    'object.sendToBack': { shortcut: 'Ctrl+Shift+[', description: 'Send to Back', category: 'Object' },
    'object.bringForward': { shortcut: 'Ctrl+]', description: 'Bring Forward', category: 'Object' },
    'object.sendBackward': { shortcut: 'Ctrl+[', description: 'Send Backward', category: 'Object' },
    'object.lock': { shortcut: 'Ctrl+2', description: 'Lock', category: 'Object' },
    'object.unlockAll': { shortcut: 'Ctrl+Alt+2', description: 'Unlock All', category: 'Object' },
    'object.hide': { shortcut: 'Ctrl+3', description: 'Hide', category: 'Object' },
    'object.showAll': { shortcut: 'Ctrl+Alt+3', description: 'Show All', category: 'Object' },
    
    // Transform
    'transform.move': { shortcut: 'Ctrl+Shift+M', description: 'Move', category: 'Transform' },
    'transform.rotate': { shortcut: 'Ctrl+Shift+R', description: 'Rotate', category: 'Transform' },
    'transform.scale': { shortcut: 'Ctrl+Alt+S', description: 'Scale', category: 'Transform' },
    'transform.flip.horizontal': { shortcut: 'Ctrl+Shift+H', description: 'Flip Horizontal', category: 'Transform' },
    'transform.flip.vertical': { shortcut: 'Ctrl+Shift+V', description: 'Flip Vertical', category: 'Transform' }
};

/**
 * Create shortcut manager with default shortcuts
 * @param {object} actions - Map of action ID to handler function
 * @returns {ShortcutManager}
 */
export function createDefaultShortcutManager(actions = {}) {
    const manager = new ShortcutManager();
    
    for (const [id, config] of Object.entries(DefaultShortcuts)) {
        const handler = actions[id] || (() => console.log(`Shortcut: ${id}`));
        manager.register(id, config.shortcut, handler, {
            description: config.description,
            category: config.category
        });
    }
    
    return manager;
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    KeyNames,
    Platform,
    parseShortcut,
    formatShortcut,
    matchesShortcut,
    ShortcutManager,
    DefaultShortcuts,
    createDefaultShortcutManager
};
