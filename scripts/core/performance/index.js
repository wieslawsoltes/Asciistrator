/**
 * Asciistrator - Performance Module
 * 
 * Render optimization, memory management, large document handling,
 * and undo optimization utilities.
 */

// ==========================================
// OBJECT POOL
// ==========================================

/**
 * Generic object pool for reducing garbage collection
 * @template T
 */
export class ObjectPool {
    /**
     * @param {function(): T} factory - Factory function to create new objects
     * @param {function(T): void} reset - Reset function to clear object state
     * @param {number} initialSize - Initial pool size
     */
    constructor(factory, reset = null, initialSize = 10) {
        /** @type {function(): T} */
        this._factory = factory;
        /** @type {function(T): void} */
        this._reset = reset || (() => {});
        /** @type {T[]} */
        this._pool = [];
        /** @type {number} */
        this._created = 0;
        /** @type {number} */
        this._acquired = 0;
        /** @type {number} */
        this._released = 0;
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this._pool.push(this._factory());
            this._created++;
        }
    }

    /**
     * Acquire an object from the pool
     * @returns {T}
     */
    acquire() {
        this._acquired++;
        if (this._pool.length > 0) {
            return this._pool.pop();
        }
        this._created++;
        return this._factory();
    }

    /**
     * Release an object back to the pool
     * @param {T} obj 
     */
    release(obj) {
        this._released++;
        this._reset(obj);
        this._pool.push(obj);
    }

    /**
     * Release multiple objects
     * @param {T[]} objects 
     */
    releaseAll(objects) {
        for (const obj of objects) {
            this.release(obj);
        }
    }

    /**
     * Clear the pool
     */
    clear() {
        this._pool = [];
    }

    /**
     * Get pool statistics
     * @returns {object}
     */
    getStats() {
        return {
            poolSize: this._pool.length,
            created: this._created,
            acquired: this._acquired,
            released: this._released,
            inUse: this._acquired - this._released
        };
    }
}

// ==========================================
// SPATIAL INDEX (QUADTREE)
// ==========================================

/**
 * QuadTree for efficient spatial queries
 */
export class QuadTree {
    /**
     * @param {object} bounds - {x, y, width, height}
     * @param {number} maxObjects - Max objects before split
     * @param {number} maxDepth - Maximum tree depth
     * @param {number} depth - Current depth
     */
    constructor(bounds, maxObjects = 10, maxDepth = 6, depth = 0) {
        this.bounds = bounds;
        this.maxObjects = maxObjects;
        this.maxDepth = maxDepth;
        this.depth = depth;
        
        /** @type {Array<{id: string, bounds: object}>} */
        this.objects = [];
        /** @type {QuadTree[]} */
        this.children = null;
    }

    /**
     * Split node into 4 children
     * @private
     */
    _split() {
        const { x, y, width, height } = this.bounds;
        const halfW = width / 2;
        const halfH = height / 2;
        const nextDepth = this.depth + 1;

        this.children = [
            // Top-left
            new QuadTree({ x, y, width: halfW, height: halfH }, 
                this.maxObjects, this.maxDepth, nextDepth),
            // Top-right
            new QuadTree({ x: x + halfW, y, width: halfW, height: halfH },
                this.maxObjects, this.maxDepth, nextDepth),
            // Bottom-left
            new QuadTree({ x, y: y + halfH, width: halfW, height: halfH },
                this.maxObjects, this.maxDepth, nextDepth),
            // Bottom-right
            new QuadTree({ x: x + halfW, y: y + halfH, width: halfW, height: halfH },
                this.maxObjects, this.maxDepth, nextDepth)
        ];
    }

    /**
     * Get quadrant index for bounds
     * @private
     */
    _getIndex(bounds) {
        const { x, y, width, height } = this.bounds;
        const midX = x + width / 2;
        const midY = y + height / 2;
        
        const indices = [];
        
        // Object can fit in top quadrants
        const topQuad = bounds.y < midY;
        // Object can fit in bottom quadrants
        const bottomQuad = bounds.y + bounds.height > midY;
        // Object can fit in left quadrants
        const leftQuad = bounds.x < midX;
        // Object can fit in right quadrants
        const rightQuad = bounds.x + bounds.width > midX;

        if (topQuad && leftQuad) indices.push(0);
        if (topQuad && rightQuad) indices.push(1);
        if (bottomQuad && leftQuad) indices.push(2);
        if (bottomQuad && rightQuad) indices.push(3);

        return indices;
    }

    /**
     * Insert an object with bounds
     * @param {string} id - Object identifier
     * @param {object} bounds - {x, y, width, height}
     */
    insert(id, bounds) {
        // If we have children, add to appropriate child
        if (this.children) {
            const indices = this._getIndex(bounds);
            for (const idx of indices) {
                this.children[idx].insert(id, bounds);
            }
            return;
        }

        // Add to this node
        this.objects.push({ id, bounds });

        // Split if needed
        if (this.objects.length > this.maxObjects && this.depth < this.maxDepth) {
            this._split();
            
            // Move objects to children
            for (const obj of this.objects) {
                const indices = this._getIndex(obj.bounds);
                for (const idx of indices) {
                    this.children[idx].insert(obj.id, obj.bounds);
                }
            }
            this.objects = [];
        }
    }

    /**
     * Query objects intersecting with bounds
     * @param {object} queryBounds - {x, y, width, height}
     * @returns {Set<string>} - Set of object IDs
     */
    query(queryBounds) {
        const result = new Set();
        this._query(queryBounds, result);
        return result;
    }

    /**
     * Internal query helper
     * @private
     */
    _query(queryBounds, result) {
        // Check objects in this node
        for (const obj of this.objects) {
            if (this._intersects(queryBounds, obj.bounds)) {
                result.add(obj.id);
            }
        }

        // Check children
        if (this.children) {
            const indices = this._getIndex(queryBounds);
            for (const idx of indices) {
                this.children[idx]._query(queryBounds, result);
            }
        }
    }

    /**
     * Check if two bounds intersect
     * @private
     */
    _intersects(a, b) {
        return !(a.x + a.width < b.x ||
                 b.x + b.width < a.x ||
                 a.y + a.height < b.y ||
                 b.y + b.height < a.y);
    }

    /**
     * Remove an object by ID
     * @param {string} id 
     */
    remove(id) {
        // Remove from this node
        this.objects = this.objects.filter(obj => obj.id !== id);

        // Remove from children
        if (this.children) {
            for (const child of this.children) {
                child.remove(id);
            }
        }
    }

    /**
     * Clear all objects
     */
    clear() {
        this.objects = [];
        this.children = null;
    }

    /**
     * Get all objects
     * @returns {Array<{id: string, bounds: object}>}
     */
    getAll() {
        const result = [...this.objects];
        if (this.children) {
            for (const child of this.children) {
                result.push(...child.getAll());
            }
        }
        return result;
    }
}

// ==========================================
// RENDER CACHE
// ==========================================

/**
 * LRU Cache for rendered object results
 */
export class RenderCache {
    /**
     * @param {number} maxSize - Maximum cache entries
     */
    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
        /** @type {Map<string, {data: any, timestamp: number}>} */
        this._cache = new Map();
        this._hits = 0;
        this._misses = 0;
    }

    /**
     * Generate cache key for object
     * @param {object} obj - Scene object
     * @returns {string}
     */
    static generateKey(obj) {
        // Key based on object properties that affect rendering
        return `${obj.id}_${obj.x}_${obj.y}_${obj.width}_${obj.height}_` +
               `${obj.rotation}_${obj.scaleX}_${obj.scaleY}_` +
               `${obj.strokeChar}_${obj.fillChar}_${obj.strokeColor}_${obj.fillColor}_` +
               `${obj._renderVersion || 0}`;
    }

    /**
     * Get cached result
     * @param {string} key 
     * @returns {any|null}
     */
    get(key) {
        const entry = this._cache.get(key);
        if (entry) {
            // Move to end (most recently used)
            this._cache.delete(key);
            this._cache.set(key, entry);
            this._hits++;
            return entry.data;
        }
        this._misses++;
        return null;
    }

    /**
     * Store result in cache
     * @param {string} key 
     * @param {any} data 
     */
    set(key, data) {
        // Remove oldest entries if at capacity
        while (this._cache.size >= this.maxSize) {
            const firstKey = this._cache.keys().next().value;
            this._cache.delete(firstKey);
        }

        this._cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Invalidate cache entry
     * @param {string} key 
     */
    invalidate(key) {
        this._cache.delete(key);
    }

    /**
     * Invalidate entries matching prefix
     * @param {string} prefix 
     */
    invalidatePrefix(prefix) {
        for (const key of this._cache.keys()) {
            if (key.startsWith(prefix)) {
                this._cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clear() {
        this._cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {object}
     */
    getStats() {
        return {
            size: this._cache.size,
            maxSize: this.maxSize,
            hits: this._hits,
            misses: this._misses,
            hitRate: this._hits + this._misses > 0 
                ? (this._hits / (this._hits + this._misses) * 100).toFixed(1) + '%'
                : '0%'
        };
    }
}

// ==========================================
// MEMORY MANAGER
// ==========================================

/**
 * Memory usage tracker and management
 */
export class MemoryManager {
    constructor() {
        /** @type {Map<string, number>} */
        this._allocations = new Map();
        /** @type {number} */
        this._totalAllocated = 0;
        /** @type {number} */
        this._peakUsage = 0;
        /** @type {number} */
        this._warningThreshold = 100 * 1024 * 1024; // 100MB
        /** @type {Function[]} */
        this._onWarning = [];
    }

    /**
     * Track memory allocation
     * @param {string} category 
     * @param {number} bytes 
     */
    allocate(category, bytes) {
        const current = this._allocations.get(category) || 0;
        this._allocations.set(category, current + bytes);
        this._totalAllocated += bytes;
        this._peakUsage = Math.max(this._peakUsage, this._totalAllocated);

        if (this._totalAllocated > this._warningThreshold) {
            this._triggerWarning();
        }
    }

    /**
     * Track memory deallocation
     * @param {string} category 
     * @param {number} bytes 
     */
    deallocate(category, bytes) {
        const current = this._allocations.get(category) || 0;
        this._allocations.set(category, Math.max(0, current - bytes));
        this._totalAllocated = Math.max(0, this._totalAllocated - bytes);
    }

    /**
     * Set warning threshold
     * @param {number} bytes 
     */
    setWarningThreshold(bytes) {
        this._warningThreshold = bytes;
    }

    /**
     * Add warning listener
     * @param {Function} callback 
     */
    onWarning(callback) {
        this._onWarning.push(callback);
    }

    /**
     * Trigger warning callbacks
     * @private
     */
    _triggerWarning() {
        for (const callback of this._onWarning) {
            try {
                callback(this.getStats());
            } catch (e) {
                console.error('Memory warning callback error:', e);
            }
        }
    }

    /**
     * Estimate object size in bytes
     * @param {any} obj 
     * @returns {number}
     */
    static estimateSize(obj) {
        const seen = new WeakSet();
        
        function sizeOf(value) {
            if (value === null) return 0;
            
            const type = typeof value;
            
            if (type === 'boolean') return 4;
            if (type === 'number') return 8;
            if (type === 'string') return value.length * 2;
            if (type === 'undefined') return 0;
            
            if (type === 'object') {
                if (seen.has(value)) return 0;
                seen.add(value);
                
                let size = 0;
                
                if (Array.isArray(value)) {
                    for (const item of value) {
                        size += sizeOf(item);
                    }
                } else {
                    for (const key in value) {
                        if (value.hasOwnProperty(key)) {
                            size += key.length * 2;
                            size += sizeOf(value[key]);
                        }
                    }
                }
                
                return size;
            }
            
            return 0;
        }
        
        return sizeOf(obj);
    }

    /**
     * Get memory statistics
     * @returns {object}
     */
    getStats() {
        const byCategory = {};
        for (const [category, bytes] of this._allocations) {
            byCategory[category] = this._formatBytes(bytes);
        }

        return {
            total: this._formatBytes(this._totalAllocated),
            totalBytes: this._totalAllocated,
            peak: this._formatBytes(this._peakUsage),
            peakBytes: this._peakUsage,
            threshold: this._formatBytes(this._warningThreshold),
            byCategory,
            browserMemory: this._getBrowserMemory()
        };
    }

    /**
     * Get browser memory info if available
     * @private
     */
    _getBrowserMemory() {
        if (performance && performance.memory) {
            return {
                usedJSHeapSize: this._formatBytes(performance.memory.usedJSHeapSize),
                totalJSHeapSize: this._formatBytes(performance.memory.totalJSHeapSize),
                jsHeapSizeLimit: this._formatBytes(performance.memory.jsHeapSizeLimit)
            };
        }
        return null;
    }

    /**
     * Format bytes to human readable
     * @private
     */
    _formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    /**
     * Reset statistics
     */
    reset() {
        this._allocations.clear();
        this._totalAllocated = 0;
        this._peakUsage = 0;
    }
}

// ==========================================
// PERFORMANCE MONITOR
// ==========================================

/**
 * Performance metrics tracker
 */
export class PerformanceMonitor {
    constructor() {
        /** @type {Map<string, number[]>} */
        this._timings = new Map();
        /** @type {Map<string, number>} */
        this._counts = new Map();
        /** @type {number} */
        this._maxSamples = 100;
        /** @type {number} */
        this._frameCount = 0;
        /** @type {number} */
        this._fps = 0;
        /** @type {number} */
        this._lastFpsTime = performance.now();
        /** @type {number[]} */
        this._frameTimes = [];
    }

    /**
     * Start timing an operation
     * @param {string} name 
     * @returns {function(): void} - Stop function
     */
    time(name) {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this._addTiming(name, duration);
        };
    }

    /**
     * Record a timing value
     * @param {string} name 
     * @param {number} duration 
     */
    _addTiming(name, duration) {
        if (!this._timings.has(name)) {
            this._timings.set(name, []);
        }
        const timings = this._timings.get(name);
        timings.push(duration);
        
        // Keep only recent samples
        if (timings.length > this._maxSamples) {
            timings.shift();
        }
    }

    /**
     * Increment a counter
     * @param {string} name 
     * @param {number} amount 
     */
    count(name, amount = 1) {
        const current = this._counts.get(name) || 0;
        this._counts.set(name, current + amount);
    }

    /**
     * Mark frame rendered
     */
    markFrame() {
        this._frameCount++;
        const now = performance.now();
        this._frameTimes.push(now);
        
        // Calculate FPS every second
        if (now - this._lastFpsTime >= 1000) {
            this._fps = this._frameCount;
            this._frameCount = 0;
            this._lastFpsTime = now;
        }
        
        // Keep only recent frame times
        while (this._frameTimes.length > 60) {
            this._frameTimes.shift();
        }
    }

    /**
     * Get current FPS
     * @returns {number}
     */
    getFps() {
        return this._fps;
    }

    /**
     * Get average frame time
     * @returns {number}
     */
    getAverageFrameTime() {
        if (this._frameTimes.length < 2) return 0;
        
        let total = 0;
        for (let i = 1; i < this._frameTimes.length; i++) {
            total += this._frameTimes[i] - this._frameTimes[i - 1];
        }
        return total / (this._frameTimes.length - 1);
    }

    /**
     * Get statistics for an operation
     * @param {string} name 
     * @returns {object|null}
     */
    getStats(name) {
        const timings = this._timings.get(name);
        if (!timings || timings.length === 0) return null;

        const sorted = [...timings].sort((a, b) => a - b);
        const sum = timings.reduce((a, b) => a + b, 0);

        return {
            count: timings.length,
            min: sorted[0].toFixed(2) + 'ms',
            max: sorted[sorted.length - 1].toFixed(2) + 'ms',
            avg: (sum / timings.length).toFixed(2) + 'ms',
            p50: sorted[Math.floor(sorted.length * 0.5)].toFixed(2) + 'ms',
            p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(2) + 'ms',
            p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(2) + 'ms'
        };
    }

    /**
     * Get all statistics
     * @returns {object}
     */
    getAllStats() {
        const stats = {
            fps: this._fps,
            avgFrameTime: this.getAverageFrameTime().toFixed(2) + 'ms',
            timings: {},
            counters: {}
        };

        for (const name of this._timings.keys()) {
            stats.timings[name] = this.getStats(name);
        }

        for (const [name, count] of this._counts) {
            stats.counters[name] = count;
        }

        return stats;
    }

    /**
     * Reset all statistics
     */
    reset() {
        this._timings.clear();
        this._counts.clear();
        this._frameCount = 0;
        this._frameTimes = [];
    }
}

// ==========================================
// UNDO OPTIMIZER
// ==========================================

/**
 * Optimized undo/redo history with compression
 */
export class UndoOptimizer {
    /**
     * @param {number} maxStates - Maximum history states
     * @param {number} compressionThreshold - States before compression
     */
    constructor(maxStates = 100, compressionThreshold = 50) {
        this.maxStates = maxStates;
        this.compressionThreshold = compressionThreshold;
        
        /** @type {Array<{type: string, data: any, timestamp: number}>} */
        this._history = [];
        /** @type {number} */
        this._currentIndex = -1;
        /** @type {number} */
        this._lastSaveIndex = -1;
        /** @type {Set<string>} */
        this._compressibleTypes = new Set(['move', 'resize', 'rotate', 'property-change']);
    }

    /**
     * Push a new state
     * @param {string} type - Action type
     * @param {any} data - State data
     */
    push(type, data) {
        // Remove any redo states
        if (this._currentIndex < this._history.length - 1) {
            this._history = this._history.slice(0, this._currentIndex + 1);
        }

        // Try to merge with previous state if same type
        if (this._compressibleTypes.has(type) && this._history.length > 0) {
            const last = this._history[this._history.length - 1];
            if (last.type === type && 
                last.data.objectId === data.objectId &&
                Date.now() - last.timestamp < 500) {
                // Merge: keep first 'before', update 'after'
                last.data.after = data.after;
                last.timestamp = Date.now();
                return;
            }
        }

        // Add new state
        this._history.push({
            type,
            data: this._compress(data),
            timestamp: Date.now()
        });
        this._currentIndex = this._history.length - 1;

        // Trim history if too large
        if (this._history.length > this.maxStates) {
            const removeCount = this._history.length - this.maxStates;
            this._history = this._history.slice(removeCount);
            this._currentIndex -= removeCount;
            this._lastSaveIndex = Math.max(-1, this._lastSaveIndex - removeCount);
        }

        // Compress old states periodically
        if (this._history.length > this.compressionThreshold) {
            this._compressOldStates();
        }
    }

    /**
     * Undo to previous state
     * @returns {{type: string, data: any}|null}
     */
    undo() {
        if (this._currentIndex < 0) return null;
        
        const state = this._history[this._currentIndex];
        this._currentIndex--;
        
        return {
            type: state.type,
            data: this._decompress(state.data)
        };
    }

    /**
     * Redo to next state
     * @returns {{type: string, data: any}|null}
     */
    redo() {
        if (this._currentIndex >= this._history.length - 1) return null;
        
        this._currentIndex++;
        const state = this._history[this._currentIndex];
        
        return {
            type: state.type,
            data: this._decompress(state.data)
        };
    }

    /**
     * Check if undo is available
     * @returns {boolean}
     */
    canUndo() {
        return this._currentIndex >= 0;
    }

    /**
     * Check if redo is available
     * @returns {boolean}
     */
    canRedo() {
        return this._currentIndex < this._history.length - 1;
    }

    /**
     * Mark current state as saved
     */
    markSaved() {
        this._lastSaveIndex = this._currentIndex;
    }

    /**
     * Check if document has unsaved changes
     * @returns {boolean}
     */
    hasUnsavedChanges() {
        return this._currentIndex !== this._lastSaveIndex;
    }

    /**
     * Get history state count
     * @returns {number}
     */
    getHistoryLength() {
        return this._history.length;
    }

    /**
     * Get current position in history
     * @returns {number}
     */
    getCurrentIndex() {
        return this._currentIndex;
    }

    /**
     * Get recent history entries
     * @param {number} count 
     * @returns {Array<{type: string, timestamp: number}>}
     */
    getRecentHistory(count = 10) {
        const start = Math.max(0, this._currentIndex - count + 1);
        const end = this._currentIndex + 1;
        
        return this._history.slice(start, end).map((state, i) => ({
            type: state.type,
            timestamp: state.timestamp,
            isCurrent: start + i === this._currentIndex
        }));
    }

    /**
     * Clear history
     */
    clear() {
        this._history = [];
        this._currentIndex = -1;
        this._lastSaveIndex = -1;
    }

    /**
     * Compress state data
     * @private
     */
    _compress(data) {
        // For now, just clone. Could implement actual compression.
        return JSON.parse(JSON.stringify(data));
    }

    /**
     * Decompress state data
     * @private
     */
    _decompress(data) {
        return JSON.parse(JSON.stringify(data));
    }

    /**
     * Compress old states to save memory
     * @private
     */
    _compressOldStates() {
        // Merge consecutive similar states older than current - 10
        const threshold = this._currentIndex - 10;
        if (threshold <= 0) return;

        const compressed = [];
        let i = 0;
        
        while (i < threshold) {
            const state = this._history[i];
            
            // Try to merge similar consecutive states
            let merged = { ...state };
            while (i + 1 < threshold && 
                   this._history[i + 1].type === state.type &&
                   this._history[i + 1].data.objectId === state.data.objectId) {
                i++;
                merged.data.after = this._history[i].data.after;
                merged.timestamp = this._history[i].timestamp;
            }
            
            compressed.push(merged);
            i++;
        }

        // Append remaining states
        for (; i < this._history.length; i++) {
            compressed.push(this._history[i]);
        }

        const removed = this._history.length - compressed.length;
        if (removed > 0) {
            this._history = compressed;
            this._currentIndex -= removed;
            this._lastSaveIndex = Math.max(-1, this._lastSaveIndex - removed);
        }
    }
}

// ==========================================
// VIRTUAL LIST (FOR LARGE LISTS)
// ==========================================

/**
 * Virtual list for efficiently rendering large lists
 */
export class VirtualList {
    /**
     * @param {object} options
     * @param {number} options.itemHeight - Height of each item
     * @param {number} options.overscan - Extra items to render above/below
     * @param {HTMLElement} options.container - Scroll container
     */
    constructor(options) {
        this.itemHeight = options.itemHeight || 24;
        this.overscan = options.overscan || 5;
        this.container = options.container;
        
        /** @type {any[]} */
        this._items = [];
        /** @type {number} */
        this._scrollTop = 0;
        /** @type {Function} */
        this._renderItem = null;
        /** @type {HTMLElement} */
        this._content = null;
        /** @type {HTMLElement} */
        this._viewport = null;
        
        this._setup();
    }

    /**
     * Set up DOM structure
     * @private
     */
    _setup() {
        // Create viewport and content elements
        this._viewport = document.createElement('div');
        this._viewport.style.cssText = 'overflow-y: auto; height: 100%;';
        
        this._content = document.createElement('div');
        this._content.style.cssText = 'position: relative;';
        
        this._viewport.appendChild(this._content);
        this.container.appendChild(this._viewport);
        
        // Handle scroll
        this._viewport.addEventListener('scroll', () => {
            this._scrollTop = this._viewport.scrollTop;
            this._render();
        });
    }

    /**
     * Set items to display
     * @param {any[]} items 
     */
    setItems(items) {
        this._items = items;
        this._content.style.height = `${items.length * this.itemHeight}px`;
        this._render();
    }

    /**
     * Set item render function
     * @param {function(item: any, index: number): HTMLElement} fn 
     */
    setRenderFunction(fn) {
        this._renderItem = fn;
        this._render();
    }

    /**
     * Render visible items
     * @private
     */
    _render() {
        if (!this._renderItem) return;

        const viewportHeight = this._viewport.clientHeight;
        const startIndex = Math.max(0, Math.floor(this._scrollTop / this.itemHeight) - this.overscan);
        const endIndex = Math.min(
            this._items.length,
            Math.ceil((this._scrollTop + viewportHeight) / this.itemHeight) + this.overscan
        );

        // Clear and re-render
        this._content.innerHTML = '';
        
        for (let i = startIndex; i < endIndex; i++) {
            const item = this._items[i];
            const element = this._renderItem(item, i);
            
            element.style.position = 'absolute';
            element.style.top = `${i * this.itemHeight}px`;
            element.style.width = '100%';
            element.style.height = `${this.itemHeight}px`;
            
            this._content.appendChild(element);
        }
    }

    /**
     * Scroll to item by index
     * @param {number} index 
     */
    scrollToIndex(index) {
        this._viewport.scrollTop = index * this.itemHeight;
    }

    /**
     * Refresh render
     */
    refresh() {
        this._render();
    }

    /**
     * Get visible range
     * @returns {{start: number, end: number}}
     */
    getVisibleRange() {
        const viewportHeight = this._viewport.clientHeight;
        const start = Math.floor(this._scrollTop / this.itemHeight);
        const end = Math.ceil((this._scrollTop + viewportHeight) / this.itemHeight);
        return { start, end };
    }
}

// ==========================================
// BATCH PROCESSOR
// ==========================================

/**
 * Process large operations in batches to avoid blocking UI
 */
export class BatchProcessor {
    /**
     * @param {number} batchSize - Items per batch
     * @param {number} delayMs - Delay between batches
     */
    constructor(batchSize = 100, delayMs = 0) {
        this.batchSize = batchSize;
        this.delayMs = delayMs;
        this._cancelled = false;
    }

    /**
     * Process items in batches
     * @param {any[]} items 
     * @param {function(item: any, index: number): void} processor 
     * @param {function(progress: number): void} onProgress 
     * @returns {Promise<void>}
     */
    async process(items, processor, onProgress = null) {
        this._cancelled = false;
        const total = items.length;
        
        for (let i = 0; i < total && !this._cancelled; i += this.batchSize) {
            const end = Math.min(i + this.batchSize, total);
            
            // Process batch
            for (let j = i; j < end && !this._cancelled; j++) {
                processor(items[j], j);
            }
            
            // Report progress
            if (onProgress) {
                onProgress(end / total);
            }
            
            // Yield to UI
            if (this.delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, this.delayMs));
            } else {
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
        }
    }

    /**
     * Cancel processing
     */
    cancel() {
        this._cancelled = true;
    }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    ObjectPool,
    QuadTree,
    RenderCache,
    MemoryManager,
    PerformanceMonitor,
    UndoOptimizer,
    VirtualList,
    BatchProcessor
};
