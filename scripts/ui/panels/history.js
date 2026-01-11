/**
 * Asciistrator - History Panel
 * 
 * Undo/redo history panel showing action stack.
 */

import { Panel } from '../panels.js';
import { EventEmitter } from '../../utils/events.js';

// ==========================================
// HISTORY ENTRY
// ==========================================

/**
 * HistoryEntry - Single history action entry
 */
export class HistoryEntry {
    /**
     * Create history entry
     * @param {object} options
     */
    constructor(options = {}) {
        /** @type {string} Entry identifier */
        this.id = options.id || `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        /** @type {string} Action name */
        this.name = options.name || 'Action';
        
        /** @type {string} Action description */
        this.description = options.description || '';
        
        /** @type {string} Action icon */
        this.icon = options.icon || '•';
        
        /** @type {string} Action type */
        this.type = options.type || 'unknown';
        
        /** @type {number} Timestamp */
        this.timestamp = options.timestamp || Date.now();
        
        /** @type {object} State before action */
        this.beforeState = options.beforeState || null;
        
        /** @type {object} State after action */
        this.afterState = options.afterState || null;
        
        /** @type {Array<string>} Affected object IDs */
        this.affectedObjects = options.affectedObjects || [];
        
        /** @type {boolean} Can be merged with next action */
        this.mergeable = options.mergeable || false;
    }

    /**
     * Get formatted time
     * @returns {string}
     */
    getFormattedTime() {
        const date = new Date(this.timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// ==========================================
// HISTORY MANAGER
// ==========================================

/**
 * HistoryManager - Manages undo/redo stack
 */
export class HistoryManager extends EventEmitter {
    /**
     * Create history manager
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {number} Maximum history entries */
        this.maxEntries = options.maxEntries || 100;
        
        /** @type {Array<HistoryEntry>} Undo stack */
        this.undoStack = [];
        
        /** @type {Array<HistoryEntry>} Redo stack */
        this.redoStack = [];
        
        /** @type {boolean} Is recording enabled */
        this.recording = true;
        
        /** @type {HistoryEntry|null} Current entry being built */
        this.pendingEntry = null;
    }

    /**
     * Push new action to history
     * @param {HistoryEntry|object} entry
     */
    push(entry) {
        if (!this.recording) return;

        const historyEntry = entry instanceof HistoryEntry ? entry : new HistoryEntry(entry);

        // Check if can merge with previous
        if (this.undoStack.length > 0) {
            const last = this.undoStack[this.undoStack.length - 1];
            if (last.mergeable && last.type === historyEntry.type && 
                Date.now() - last.timestamp < 1000) {
                // Merge with previous entry
                last.afterState = historyEntry.afterState;
                last.timestamp = historyEntry.timestamp;
                last.description = historyEntry.description;
                this.emit('update');
                return;
            }
        }

        // Push to undo stack
        this.undoStack.push(historyEntry);

        // Clear redo stack
        this.redoStack = [];

        // Limit history size
        while (this.undoStack.length > this.maxEntries) {
            this.undoStack.shift();
        }

        this.emit('push', historyEntry);
        this.emit('update');
    }

    /**
     * Undo last action
     * @returns {HistoryEntry|null}
     */
    undo() {
        if (!this.canUndo()) return null;

        const entry = this.undoStack.pop();
        this.redoStack.push(entry);

        this.emit('undo', entry);
        this.emit('update');

        return entry;
    }

    /**
     * Redo last undone action
     * @returns {HistoryEntry|null}
     */
    redo() {
        if (!this.canRedo()) return null;

        const entry = this.redoStack.pop();
        this.undoStack.push(entry);

        this.emit('redo', entry);
        this.emit('update');

        return entry;
    }

    /**
     * Go to specific history entry
     * @param {string} entryId
     */
    goTo(entryId) {
        // Find in undo stack
        const undoIndex = this.undoStack.findIndex(e => e.id === entryId);
        
        if (undoIndex >= 0) {
            // Move entries after this to redo stack
            const toRedo = this.undoStack.splice(undoIndex + 1);
            this.redoStack = [...toRedo.reverse(), ...this.redoStack];
            
            this.emit('goTo', this.undoStack[undoIndex]);
            this.emit('update');
            return;
        }

        // Find in redo stack
        const redoIndex = this.redoStack.findIndex(e => e.id === entryId);
        
        if (redoIndex >= 0) {
            // Move entries up to this to undo stack
            const toUndo = this.redoStack.splice(redoIndex);
            this.undoStack = [...this.undoStack, ...toUndo.reverse()];
            
            this.emit('goTo', this.undoStack[this.undoStack.length - 1]);
            this.emit('update');
        }
    }

    /**
     * Check if can undo
     * @returns {boolean}
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Check if can redo
     * @returns {boolean}
     */
    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Get all history entries (newest first)
     * @returns {Array<{entry: HistoryEntry, current: boolean, canUndo: boolean}>}
     */
    getEntries() {
        const entries = [];
        
        // Redo stack (future actions)
        for (let i = this.redoStack.length - 1; i >= 0; i--) {
            entries.push({
                entry: this.redoStack[i],
                current: false,
                canUndo: false
            });
        }

        // Current position marker
        const currentIndex = entries.length;

        // Undo stack (past actions)
        for (let i = this.undoStack.length - 1; i >= 0; i--) {
            entries.push({
                entry: this.undoStack[i],
                current: i === this.undoStack.length - 1,
                canUndo: true
            });
        }

        return entries;
    }

    /**
     * Clear all history
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.emit('clear');
        this.emit('update');
    }

    /**
     * Pause recording
     */
    pause() {
        this.recording = false;
    }

    /**
     * Resume recording
     */
    resume() {
        this.recording = true;
    }

    /**
     * Begin a transaction (group multiple actions)
     * @param {string} name
     * @param {string} icon
     */
    beginTransaction(name, icon = '📦') {
        this.pendingEntry = new HistoryEntry({
            name,
            icon,
            type: 'transaction',
            description: `${name} (multiple actions)`
        });
    }

    /**
     * Commit transaction
     */
    commitTransaction() {
        if (this.pendingEntry) {
            this.push(this.pendingEntry);
            this.pendingEntry = null;
        }
    }

    /**
     * Rollback transaction
     */
    rollbackTransaction() {
        this.pendingEntry = null;
    }
}

// ==========================================
// HISTORY ACTION ICONS
// ==========================================

/**
 * Icons for different action types
 */
export const HistoryIcons = {
    // Object actions
    create: '➕',
    delete: '🗑',
    move: '↔',
    resize: '⤡',
    rotate: '🔄',
    transform: '⟲',
    
    // Style actions
    style: '🎨',
    fill: '🪣',
    stroke: '✏️',
    
    // Layer actions
    layer: '☰',
    order: '↕',
    visibility: '👁',
    lock: '🔒',
    
    // Selection actions
    select: '⬚',
    group: '📦',
    ungroup: '📭',
    
    // Edit actions
    cut: '✂',
    copy: '📋',
    paste: '📌',
    duplicate: '⧉',
    
    // Path actions
    path: '⌇',
    anchor: '◇',
    
    // Text actions
    text: 'T',
    
    // Document actions
    document: '📄',
    canvas: '🖼',
    
    // Generic
    action: '•',
    transaction: '📦'
};

/**
 * Get icon for action type
 * @param {string} type
 * @returns {string}
 */
export function getHistoryIcon(type) {
    return HistoryIcons[type] || HistoryIcons.action;
}

// ==========================================
// HISTORY PANEL
// ==========================================

/**
 * HistoryPanel - Undo/redo history panel
 */
export class HistoryPanel extends Panel {
    /**
     * Create history panel
     * @param {object} options
     */
    constructor(options = {}) {
        super({
            id: 'history',
            title: 'History',
            icon: '📜',
            width: 250,
            ...options
        });
        
        /** @type {HistoryManager|null} History manager reference */
        this.historyManager = options.historyManager || null;
        
        /** @type {HTMLElement|null} History list element */
        this.historyList = null;
    }

    /**
     * Set history manager
     * @param {HistoryManager} manager
     */
    setHistoryManager(manager) {
        this.historyManager = manager;
        
        manager.on('update', () => {
            this.refresh();
        });

        this.refresh();
    }

    /**
     * Render panel content
     * @returns {HTMLElement}
     */
    renderContent() {
        const container = document.createElement('div');
        container.className = 'history-panel';

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'history-toolbar';

        const undoBtn = document.createElement('button');
        undoBtn.className = 'history-btn';
        undoBtn.innerHTML = '↩ Undo';
        undoBtn.title = 'Undo (⌘Z)';
        undoBtn.addEventListener('click', () => {
            this.historyManager?.undo();
            this.emit('undo');
        });
        toolbar.appendChild(undoBtn);

        const redoBtn = document.createElement('button');
        redoBtn.className = 'history-btn';
        redoBtn.innerHTML = '↪ Redo';
        redoBtn.title = 'Redo (⌘⇧Z)';
        redoBtn.addEventListener('click', () => {
            this.historyManager?.redo();
            this.emit('redo');
        });
        toolbar.appendChild(redoBtn);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'history-btn history-clear';
        clearBtn.innerHTML = '🗑';
        clearBtn.title = 'Clear History';
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all history?')) {
                this.historyManager?.clear();
                this.emit('clear');
            }
        });
        toolbar.appendChild(clearBtn);

        container.appendChild(toolbar);

        // Stats
        const stats = document.createElement('div');
        stats.className = 'history-stats';
        container.appendChild(stats);

        // History list
        this.historyList = document.createElement('div');
        this.historyList.className = 'history-list';
        container.appendChild(this.historyList);

        // Initial render
        this._renderHistory();

        return container;
    }

    /**
     * Render history list
     * @private
     */
    _renderHistory() {
        if (!this.historyList) return;

        this.historyList.innerHTML = '';

        if (!this.historyManager) {
            this.historyList.innerHTML = '<div class="history-empty">No history manager connected</div>';
            return;
        }

        const entries = this.historyManager.getEntries();

        if (entries.length === 0) {
            this.historyList.innerHTML = '<div class="history-empty">No history yet</div>';
            this._updateStats();
            return;
        }

        // Current state marker
        const currentMarker = document.createElement('div');
        currentMarker.className = 'history-current-marker';
        currentMarker.innerHTML = '▶ Current State';

        let markerInserted = false;

        for (const { entry, current, canUndo } of entries) {
            // Insert current marker before the current entry
            if (current && !markerInserted) {
                this.historyList.appendChild(currentMarker);
                markerInserted = true;
            }

            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.id = entry.id;

            if (current) {
                item.classList.add('current');
            }
            if (!canUndo) {
                item.classList.add('future');
            }

            const icon = document.createElement('span');
            icon.className = 'history-icon';
            icon.textContent = entry.icon || getHistoryIcon(entry.type);
            item.appendChild(icon);

            const info = document.createElement('div');
            info.className = 'history-info';

            const name = document.createElement('span');
            name.className = 'history-name';
            name.textContent = entry.name;
            info.appendChild(name);

            if (entry.description) {
                const desc = document.createElement('span');
                desc.className = 'history-desc';
                desc.textContent = entry.description;
                info.appendChild(desc);
            }

            item.appendChild(info);

            const time = document.createElement('span');
            time.className = 'history-time';
            time.textContent = entry.getFormattedTime();
            item.appendChild(time);

            // Click to go to state
            item.addEventListener('click', () => {
                this.historyManager?.goTo(entry.id);
                this.emit('goTo', entry.id);
            });

            this.historyList.appendChild(item);
        }

        // If current is at the end (no redos), add marker at top
        if (!markerInserted) {
            this.historyList.insertBefore(currentMarker, this.historyList.firstChild);
        }

        this._updateStats();
        this._updateButtons();
    }

    /**
     * Update stats display
     * @private
     */
    _updateStats() {
        const stats = this.content?.querySelector('.history-stats');
        if (!stats || !this.historyManager) return;

        const undoCount = this.historyManager.undoStack.length;
        const redoCount = this.historyManager.redoStack.length;

        stats.textContent = `${undoCount} undo${undoCount !== 1 ? 's' : ''} | ${redoCount} redo${redoCount !== 1 ? 's' : ''}`;
    }

    /**
     * Update button states
     * @private
     */
    _updateButtons() {
        const undoBtn = this.content?.querySelector('.history-btn:first-child');
        const redoBtn = this.content?.querySelector('.history-btn:nth-child(2)');

        if (undoBtn) {
            undoBtn.disabled = !this.historyManager?.canUndo();
        }
        if (redoBtn) {
            redoBtn.disabled = !this.historyManager?.canRedo();
        }
    }

    /**
     * Refresh panel
     * @override
     */
    refresh() {
        if (this.content) {
            this._renderHistory();
        }
    }
}

// ==========================================
// HISTORY HELPERS
// ==========================================

/**
 * Create history entry for object creation
 * @param {string} objectType
 * @param {string} objectId
 * @returns {HistoryEntry}
 */
export function createObjectHistoryEntry(objectType, objectId) {
    return new HistoryEntry({
        name: `Create ${objectType}`,
        type: 'create',
        icon: HistoryIcons.create,
        description: `Created new ${objectType}`,
        affectedObjects: [objectId]
    });
}

/**
 * Create history entry for object deletion
 * @param {string} objectType
 * @param {string} objectId
 * @returns {HistoryEntry}
 */
export function deleteObjectHistoryEntry(objectType, objectId) {
    return new HistoryEntry({
        name: `Delete ${objectType}`,
        type: 'delete',
        icon: HistoryIcons.delete,
        description: `Deleted ${objectType}`,
        affectedObjects: [objectId]
    });
}

/**
 * Create history entry for transform
 * @param {string} transformType - 'move', 'resize', 'rotate'
 * @param {Array<string>} objectIds
 * @returns {HistoryEntry}
 */
export function transformHistoryEntry(transformType, objectIds) {
    const names = {
        move: 'Move',
        resize: 'Resize',
        rotate: 'Rotate',
        scale: 'Scale',
        skew: 'Skew'
    };

    return new HistoryEntry({
        name: names[transformType] || 'Transform',
        type: transformType,
        icon: HistoryIcons[transformType] || HistoryIcons.transform,
        mergeable: true,
        affectedObjects: objectIds
    });
}

/**
 * Create history entry for style change
 * @param {string} styleProperty
 * @param {Array<string>} objectIds
 * @returns {HistoryEntry}
 */
export function styleHistoryEntry(styleProperty, objectIds) {
    return new HistoryEntry({
        name: `Change ${styleProperty}`,
        type: 'style',
        icon: HistoryIcons.style,
        description: `Changed ${styleProperty}`,
        mergeable: true,
        affectedObjects: objectIds
    });
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    HistoryEntry,
    HistoryManager,
    HistoryIcons,
    getHistoryIcon,
    HistoryPanel,
    createObjectHistoryEntry,
    deleteObjectHistoryEntry,
    transformHistoryEntry,
    styleHistoryEntry
};
