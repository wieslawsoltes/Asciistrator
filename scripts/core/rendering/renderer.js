/**
 * Asciistrator - Rendering Pipeline
 * 
 * Dirty rectangle optimization, double buffering, and render queue management.
 */

import { EventEmitter } from '../../utils/events.js';

// ==========================================
// DIRTY RECTANGLE TRACKER
// ==========================================

/**
 * DirtyRectTracker - Tracks regions that need re-rendering
 */
export class DirtyRectTracker {
    constructor() {
        /** @type {Set<string>} Dirty cells by "x,y" key */
        this._dirtyCells = new Set();
        
        /** @type {Array<{minX: number, minY: number, maxX: number, maxY: number}>} */
        this._dirtyRects = [];
        
        /** @type {boolean} Full redraw needed */
        this._fullRedraw = true;
        
        /** @type {number} Maximum rects before merging */
        this.maxRects = 20;
        
        /** @type {number} Merge threshold (cells apart to merge) */
        this.mergeThreshold = 3;
    }
    
    /**
     * Mark a cell as dirty
     * @param {number} x 
     * @param {number} y 
     */
    markCell(x, y) {
        if (this._fullRedraw) return;
        this._dirtyCells.add(`${x},${y}`);
    }
    
    /**
     * Mark multiple cells as dirty
     * @param {Array<{x: number, y: number}>} cells 
     */
    markCells(cells) {
        if (this._fullRedraw) return;
        for (const cell of cells) {
            this._dirtyCells.add(`${cell.x},${cell.y}`);
        }
    }
    
    /**
     * Mark a rectangular region as dirty
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     */
    markRect(minX, minY, maxX, maxY) {
        if (this._fullRedraw) return;
        
        this._dirtyRects.push({
            minX: Math.floor(minX),
            minY: Math.floor(minY),
            maxX: Math.ceil(maxX),
            maxY: Math.ceil(maxY)
        });
        
        // Merge if too many rects
        if (this._dirtyRects.length > this.maxRects) {
            this._mergeRects();
        }
    }
    
    /**
     * Mark entire canvas as dirty (full redraw)
     */
    markFullRedraw() {
        this._fullRedraw = true;
        this._dirtyCells.clear();
        this._dirtyRects = [];
    }
    
    /**
     * Check if full redraw is needed
     * @returns {boolean}
     */
    needsFullRedraw() {
        return this._fullRedraw;
    }
    
    /**
     * Check if any region is dirty
     * @returns {boolean}
     */
    isDirty() {
        return this._fullRedraw || this._dirtyCells.size > 0 || this._dirtyRects.length > 0;
    }
    
    /**
     * Get dirty rectangles (converts cells to rects if needed)
     * @returns {Array<{minX: number, minY: number, maxX: number, maxY: number}>}
     */
    getDirtyRects() {
        if (this._fullRedraw) {
            return null; // Indicates full redraw
        }
        
        // Convert dirty cells to rects
        if (this._dirtyCells.size > 0) {
            this._cellsToRects();
        }
        
        return [...this._dirtyRects];
    }
    
    /**
     * Check if cell is in dirty region
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isCellDirty(x, y) {
        if (this._fullRedraw) return true;
        
        if (this._dirtyCells.has(`${x},${y}`)) return true;
        
        for (const rect of this._dirtyRects) {
            if (x >= rect.minX && x <= rect.maxX &&
                y >= rect.minY && y <= rect.maxY) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Clear dirty state
     */
    clear() {
        this._fullRedraw = false;
        this._dirtyCells.clear();
        this._dirtyRects = [];
    }
    
    /**
     * Convert dirty cells to rectangles
     * @private
     */
    _cellsToRects() {
        if (this._dirtyCells.size === 0) return;
        
        // Simple approach: create bounding rect for all cells
        // More sophisticated would do connected component analysis
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const key of this._dirtyCells) {
            const [x, y] = key.split(',').map(Number);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        
        this._dirtyRects.push({ minX, minY, maxX, maxY });
        this._dirtyCells.clear();
    }
    
    /**
     * Merge overlapping/nearby rectangles
     * @private
     */
    _mergeRects() {
        if (this._dirtyRects.length <= 1) return;
        
        const merged = [];
        const used = new Set();
        
        for (let i = 0; i < this._dirtyRects.length; i++) {
            if (used.has(i)) continue;
            
            let rect = { ...this._dirtyRects[i] };
            used.add(i);
            
            // Try to merge with other rects
            let mergedSomething = true;
            while (mergedSomething) {
                mergedSomething = false;
                
                for (let j = 0; j < this._dirtyRects.length; j++) {
                    if (used.has(j)) continue;
                    
                    const other = this._dirtyRects[j];
                    
                    // Check if rects overlap or are close enough
                    if (this._shouldMerge(rect, other)) {
                        rect = {
                            minX: Math.min(rect.minX, other.minX),
                            minY: Math.min(rect.minY, other.minY),
                            maxX: Math.max(rect.maxX, other.maxX),
                            maxY: Math.max(rect.maxY, other.maxY)
                        };
                        used.add(j);
                        mergedSomething = true;
                    }
                }
            }
            
            merged.push(rect);
        }
        
        this._dirtyRects = merged;
    }
    
    /**
     * Check if two rects should be merged
     * @private
     */
    _shouldMerge(a, b) {
        const threshold = this.mergeThreshold;
        
        // Expand both rects by threshold
        const aExpanded = {
            minX: a.minX - threshold,
            minY: a.minY - threshold,
            maxX: a.maxX + threshold,
            maxY: a.maxY + threshold
        };
        
        // Check if expanded rect intersects other
        return !(b.maxX < aExpanded.minX || b.minX > aExpanded.maxX ||
                 b.maxY < aExpanded.minY || b.minY > aExpanded.maxY);
    }
    
    /**
     * Get statistics
     * @returns {object}
     */
    getStats() {
        return {
            fullRedraw: this._fullRedraw,
            dirtyCells: this._dirtyCells.size,
            dirtyRects: this._dirtyRects.length,
            totalDirtyArea: this._calculateTotalArea()
        };
    }
    
    /**
     * Calculate total dirty area
     * @private
     */
    _calculateTotalArea() {
        let area = this._dirtyCells.size;
        for (const rect of this._dirtyRects) {
            area += (rect.maxX - rect.minX + 1) * (rect.maxY - rect.minY + 1);
        }
        return area;
    }
}

// ==========================================
// DOUBLE BUFFER
// ==========================================

/**
 * DoubleBuffer - Off-screen buffer for flicker-free rendering
 */
export class DoubleBuffer {
    /**
     * Create double buffer
     * @param {number} width - Character width
     * @param {number} height - Character height
     */
    constructor(width, height) {
        /** @type {number} */
        this.width = width;
        
        /** @type {number} */
        this.height = height;
        
        /** @type {BufferCell[][]} Front buffer (currently displayed) */
        this._frontBuffer = this._createBuffer(width, height);
        
        /** @type {BufferCell[][]} Back buffer (being rendered to) */
        this._backBuffer = this._createBuffer(width, height);
        
        /** @type {string} Default fill character */
        this.fillChar = ' ';
        
        /** @type {string|null} Default fill color */
        this.fillColor = null;
    }
    
    /**
     * Create a buffer
     * @private
     */
    _createBuffer(width, height) {
        const buffer = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push(new BufferCell());
            }
            buffer.push(row);
        }
        return buffer;
    }
    
    /**
     * Resize buffers
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        if (width === this.width && height === this.height) return;
        
        this.width = width;
        this.height = height;
        this._frontBuffer = this._createBuffer(width, height);
        this._backBuffer = this._createBuffer(width, height);
    }
    
    /**
     * Clear back buffer
     */
    clear() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this._backBuffer[y][x].set(this.fillChar, this.fillColor);
            }
        }
    }
    
    /**
     * Clear region in back buffer
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     */
    clearRect(minX, minY, maxX, maxY) {
        const startX = Math.max(0, minX);
        const startY = Math.max(0, minY);
        const endX = Math.min(this.width - 1, maxX);
        const endY = Math.min(this.height - 1, maxY);
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                this._backBuffer[y][x].set(this.fillChar, this.fillColor);
            }
        }
    }
    
    /**
     * Set cell in back buffer
     * @param {number} x 
     * @param {number} y 
     * @param {string} char 
     * @param {string} [color]
     */
    setCell(x, y, char, color = null) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        this._backBuffer[y][x].set(char, color);
    }
    
    /**
     * Get cell from front buffer
     * @param {number} x 
     * @param {number} y 
     * @returns {BufferCell|null}
     */
    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this._frontBuffer[y][x];
    }
    
    /**
     * Get cell from back buffer
     * @param {number} x 
     * @param {number} y 
     * @returns {BufferCell|null}
     */
    getBackCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this._backBuffer[y][x];
    }
    
    /**
     * Swap buffers and return changed cells
     * @returns {Array<{x: number, y: number, cell: BufferCell}>}
     */
    swap() {
        const changes = [];
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const front = this._frontBuffer[y][x];
                const back = this._backBuffer[y][x];
                
                if (!front.equals(back)) {
                    changes.push({ x, y, cell: back.clone() });
                    front.copyFrom(back);
                }
            }
        }
        
        return changes;
    }
    
    /**
     * Swap only specific region
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     * @returns {Array<{x: number, y: number, cell: BufferCell}>}
     */
    swapRect(minX, minY, maxX, maxY) {
        const changes = [];
        
        const startX = Math.max(0, minX);
        const startY = Math.max(0, minY);
        const endX = Math.min(this.width - 1, maxX);
        const endY = Math.min(this.height - 1, maxY);
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const front = this._frontBuffer[y][x];
                const back = this._backBuffer[y][x];
                
                if (!front.equals(back)) {
                    changes.push({ x, y, cell: back.clone() });
                    front.copyFrom(back);
                }
            }
        }
        
        return changes;
    }
    
    /**
     * Force full swap (no diff)
     * @returns {Array<{x: number, y: number, cell: BufferCell}>}
     */
    forceSwap() {
        const changes = [];
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const back = this._backBuffer[y][x];
                changes.push({ x, y, cell: back.clone() });
                this._frontBuffer[y][x].copyFrom(back);
            }
        }
        
        return changes;
    }
    
    /**
     * Copy back to front without returning changes
     */
    syncBuffers() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this._frontBuffer[y][x].copyFrom(this._backBuffer[y][x]);
            }
        }
    }
    
    /**
     * Get front buffer as 2D array of characters
     * @returns {string[][]}
     */
    toCharArray() {
        const result = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(this._frontBuffer[y][x].char);
            }
            result.push(row);
        }
        return result;
    }
    
    /**
     * Get front buffer as string
     * @returns {string}
     */
    toString() {
        const lines = [];
        for (let y = 0; y < this.height; y++) {
            let line = '';
            for (let x = 0; x < this.width; x++) {
                line += this._frontBuffer[y][x].char;
            }
            lines.push(line.trimEnd());
        }
        return lines.join('\n');
    }
}

// ==========================================
// BUFFER CELL
// ==========================================

/**
 * BufferCell - Single cell in buffer
 */
export class BufferCell {
    constructor(char = ' ', color = null) {
        /** @type {string} */
        this.char = char;
        
        /** @type {string|null} */
        this.color = color;
    }
    
    /**
     * Set cell values
     * @param {string} char 
     * @param {string} [color]
     */
    set(char, color = null) {
        this.char = char;
        this.color = color;
    }
    
    /**
     * Copy from another cell
     * @param {BufferCell} other 
     */
    copyFrom(other) {
        this.char = other.char;
        this.color = other.color;
    }
    
    /**
     * Check equality
     * @param {BufferCell} other 
     * @returns {boolean}
     */
    equals(other) {
        return this.char === other.char && this.color === other.color;
    }
    
    /**
     * Clone cell
     * @returns {BufferCell}
     */
    clone() {
        return new BufferCell(this.char, this.color);
    }
}

// ==========================================
// RENDER QUEUE
// ==========================================

/**
 * RenderTask - A task in the render queue
 */
export class RenderTask {
    /**
     * Create render task
     * @param {object} options
     */
    constructor(options) {
        /** @type {string} */
        this.id = options.id || `task_${Date.now()}`;
        
        /** @type {number} Priority (higher = earlier) */
        this.priority = options.priority || 0;
        
        /** @type {string} Type: 'layer', 'object', 'overlay', 'grid', 'guides' */
        this.type = options.type || 'object';
        
        /** @type {function} Render function */
        this.render = options.render;
        
        /** @type {object|null} Target bounds */
        this.bounds = options.bounds || null;
        
        /** @type {boolean} Whether task can be batched */
        this.batchable = options.batchable !== false;
        
        /** @type {any} Associated data */
        this.data = options.data || null;
        
        /** @type {number} Creation timestamp */
        this.timestamp = Date.now();
    }
}

/**
 * RenderQueue - Manages and prioritizes render tasks
 */
export class RenderQueue extends EventEmitter {
    constructor() {
        super();
        
        /** @type {RenderTask[]} */
        this._queue = [];
        
        /** @type {boolean} */
        this._processing = false;
        
        /** @type {number|null} */
        this._frameRequest = null;
        
        /** @type {number} Batch size limit */
        this.batchLimit = 100;
        
        /** @type {number} Time limit per frame (ms) */
        this.frameTimeLimit = 16; // ~60fps
        
        /** @type {boolean} Auto-process on next frame */
        this.autoProcess = true;
        
        // Priority levels
        this.PRIORITY_BACKGROUND = -100;
        this.PRIORITY_GRID = -50;
        this.PRIORITY_LAYER = 0;
        this.PRIORITY_OBJECT = 50;
        this.PRIORITY_SELECTION = 100;
        this.PRIORITY_GUIDES = 150;
        this.PRIORITY_OVERLAY = 200;
        this.PRIORITY_CURSOR = 250;
    }
    
    /**
     * Add task to queue
     * @param {RenderTask|object} task 
     * @returns {RenderTask}
     */
    add(task) {
        if (!(task instanceof RenderTask)) {
            task = new RenderTask(task);
        }
        
        this._queue.push(task);
        
        // Sort by priority (descending) and timestamp
        this._queue.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return a.timestamp - b.timestamp;
        });
        
        if (this.autoProcess && !this._frameRequest) {
            this._scheduleProcess();
        }
        
        return task;
    }
    
    /**
     * Remove task from queue
     * @param {string} taskId 
     * @returns {boolean}
     */
    remove(taskId) {
        const index = this._queue.findIndex(t => t.id === taskId);
        if (index !== -1) {
            this._queue.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Remove tasks by type
     * @param {string} type 
     */
    removeByType(type) {
        this._queue = this._queue.filter(t => t.type !== type);
    }
    
    /**
     * Clear queue
     */
    clear() {
        this._queue = [];
        if (this._frameRequest) {
            cancelAnimationFrame(this._frameRequest);
            this._frameRequest = null;
        }
    }
    
    /**
     * Get queue length
     * @returns {number}
     */
    get length() {
        return this._queue.length;
    }
    
    /**
     * Check if queue is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this._queue.length === 0;
    }
    
    /**
     * Schedule processing
     * @private
     */
    _scheduleProcess() {
        this._frameRequest = requestAnimationFrame(() => {
            this._frameRequest = null;
            this.process();
        });
    }
    
    /**
     * Process queue
     * @param {object} [context] - Render context to pass to tasks
     * @returns {number} Number of tasks processed
     */
    process(context = null) {
        if (this._processing || this._queue.length === 0) {
            return 0;
        }
        
        this._processing = true;
        const startTime = performance.now();
        let processed = 0;
        
        this.emit('processstart', { queueLength: this._queue.length });
        
        while (this._queue.length > 0) {
            // Check time limit
            if (performance.now() - startTime > this.frameTimeLimit) {
                break;
            }
            
            // Check batch limit
            if (processed >= this.batchLimit) {
                break;
            }
            
            const task = this._queue.shift();
            
            try {
                task.render(context);
                processed++;
            } catch (error) {
                console.error('Render task error:', error);
                this.emit('taskerror', { task, error });
            }
        }
        
        this._processing = false;
        
        const elapsed = performance.now() - startTime;
        this.emit('processend', { 
            processed, 
            remaining: this._queue.length,
            elapsed 
        });
        
        // Schedule next frame if more tasks remain
        if (this._queue.length > 0 && this.autoProcess) {
            this._scheduleProcess();
        }
        
        return processed;
    }
    
    /**
     * Process all tasks immediately (blocking)
     * @param {object} [context]
     * @returns {number}
     */
    processAll(context = null) {
        const oldLimit = this.batchLimit;
        const oldTimeLimit = this.frameTimeLimit;
        
        this.batchLimit = Infinity;
        this.frameTimeLimit = Infinity;
        
        const processed = this.process(context);
        
        this.batchLimit = oldLimit;
        this.frameTimeLimit = oldTimeLimit;
        
        return processed;
    }
    
    /**
     * Flush queue and cancel pending frame
     */
    flush() {
        this.processAll();
        if (this._frameRequest) {
            cancelAnimationFrame(this._frameRequest);
            this._frameRequest = null;
        }
    }
}

// ==========================================
// ASCII RENDERER
// ==========================================

/**
 * AsciiRenderer - Main rendering orchestrator
 */
export class AsciiRenderer extends EventEmitter {
    /**
     * Create renderer
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {number} */
        this.width = options.width || 80;
        
        /** @type {number} */
        this.height = options.height || 24;
        
        /** @type {DoubleBuffer} */
        this.buffer = new DoubleBuffer(this.width, this.height);
        
        /** @type {DirtyRectTracker} */
        this.dirtyTracker = new DirtyRectTracker();
        
        /** @type {RenderQueue} */
        this.queue = new RenderQueue();
        
        /** @type {HTMLElement|null} */
        this._displayElement = null;
        
        /** @type {HTMLElement[][]} */
        this._cellElements = [];
        
        /** @type {boolean} */
        this._initialized = false;
        
        /** @type {string} */
        this.fontFamily = options.fontFamily || 'monospace';
        
        /** @type {number} */
        this.fontSize = options.fontSize || 14;
        
        /** @type {number} */
        this.lineHeight = options.lineHeight || 1.2;
        
        /** @type {string} */
        this.backgroundColor = options.backgroundColor || '#1e1e1e';
        
        /** @type {string} */
        this.defaultColor = options.defaultColor || '#d4d4d4';
        
        // Auto-start queue processing
        this.queue.autoProcess = true;
    }
    
    /**
     * Initialize renderer with display element
     * @param {HTMLElement} container 
     */
    initialize(container) {
        // Create display element
        this._displayElement = document.createElement('div');
        this._displayElement.className = 'ascii-renderer';
        this._displayElement.style.cssText = `
            font-family: ${this.fontFamily};
            font-size: ${this.fontSize}px;
            line-height: ${this.lineHeight};
            background-color: ${this.backgroundColor};
            white-space: pre;
            overflow: hidden;
            user-select: none;
        `;
        
        container.appendChild(this._displayElement);
        
        // Create cell grid
        this._createCellGrid();
        
        this._initialized = true;
        this.dirtyTracker.markFullRedraw();
        
        this.emit('initialized');
    }
    
    /**
     * Create cell grid elements
     * @private
     */
    _createCellGrid() {
        this._cellElements = [];
        this._displayElement.innerHTML = '';
        
        for (let y = 0; y < this.height; y++) {
            const row = document.createElement('div');
            row.className = 'ascii-row';
            
            const cellRow = [];
            
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('span');
                cell.className = 'ascii-cell';
                cell.textContent = ' ';
                cell.style.color = this.defaultColor;
                row.appendChild(cell);
                cellRow.push(cell);
            }
            
            this._displayElement.appendChild(row);
            this._cellElements.push(cellRow);
        }
    }
    
    /**
     * Resize renderer
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        if (width === this.width && height === this.height) return;
        
        this.width = width;
        this.height = height;
        
        this.buffer.resize(width, height);
        
        if (this._initialized) {
            this._createCellGrid();
        }
        
        this.dirtyTracker.markFullRedraw();
        this.emit('resize', { width, height });
    }
    
    /**
     * Begin frame - clear back buffer
     */
    beginFrame() {
        if (this.dirtyTracker.needsFullRedraw()) {
            this.buffer.clear();
        } else {
            const dirtyRects = this.dirtyTracker.getDirtyRects();
            if (dirtyRects) {
                for (const rect of dirtyRects) {
                    this.buffer.clearRect(rect.minX, rect.minY, rect.maxX, rect.maxY);
                }
            }
        }
    }
    
    /**
     * Set cell in back buffer
     * @param {number} x 
     * @param {number} y 
     * @param {string} char 
     * @param {string} [color]
     */
    setCell(x, y, char, color = null) {
        this.buffer.setCell(x, y, char, color);
    }
    
    /**
     * End frame - swap buffers and update display
     */
    endFrame() {
        let changes;
        
        if (this.dirtyTracker.needsFullRedraw()) {
            changes = this.buffer.forceSwap();
        } else {
            const dirtyRects = this.dirtyTracker.getDirtyRects();
            if (dirtyRects && dirtyRects.length > 0) {
                changes = [];
                for (const rect of dirtyRects) {
                    changes.push(...this.buffer.swapRect(
                        rect.minX, rect.minY, rect.maxX, rect.maxY
                    ));
                }
            } else {
                changes = this.buffer.swap();
            }
        }
        
        // Update display
        this._updateDisplay(changes);
        
        // Clear dirty tracking
        this.dirtyTracker.clear();
        
        this.emit('frameend', { changesCount: changes.length });
    }
    
    /**
     * Update display elements
     * @private
     */
    _updateDisplay(changes) {
        if (!this._initialized) return;
        
        for (const change of changes) {
            const { x, y, cell } = change;
            
            if (y < this._cellElements.length && x < this._cellElements[y].length) {
                const element = this._cellElements[y][x];
                element.textContent = cell.char || ' ';
                element.style.color = cell.color || this.defaultColor;
            }
        }
    }
    
    /**
     * Render immediately (bypass queue)
     * @param {function} renderFn - (renderer) => void
     */
    renderImmediate(renderFn) {
        this.beginFrame();
        renderFn(this);
        this.endFrame();
    }
    
    /**
     * Queue a render task
     * @param {object} taskOptions 
     * @returns {RenderTask}
     */
    queueRender(taskOptions) {
        return this.queue.add({
            ...taskOptions,
            render: (context) => {
                taskOptions.render(this, context);
            }
        });
    }
    
    /**
     * Process render queue
     * @param {object} [context]
     */
    processQueue(context = null) {
        if (this.queue.isEmpty()) return;
        
        this.beginFrame();
        this.queue.processAll(context);
        this.endFrame();
    }
    
    /**
     * Mark region as dirty
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     */
    markDirty(minX, minY, maxX, maxY) {
        this.dirtyTracker.markRect(minX, minY, maxX, maxY);
    }
    
    /**
     * Mark full redraw
     */
    markFullRedraw() {
        this.dirtyTracker.markFullRedraw();
    }
    
    /**
     * Get buffer as string
     * @returns {string}
     */
    toString() {
        return this.buffer.toString();
    }
    
    /**
     * Dispose renderer
     */
    dispose() {
        this.queue.clear();
        
        if (this._displayElement && this._displayElement.parentNode) {
            this._displayElement.parentNode.removeChild(this._displayElement);
        }
        
        this._displayElement = null;
        this._cellElements = [];
        this._initialized = false;
        
        this.emit('disposed');
    }
}

export default {
    DirtyRectTracker,
    DoubleBuffer,
    BufferCell,
    RenderTask,
    RenderQueue,
    AsciiRenderer
};
