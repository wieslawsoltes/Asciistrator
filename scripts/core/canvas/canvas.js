/**
 * Asciistrator - Virtual Canvas
 * 
 * High-resolution internal coordinate system that maps to ASCII character grid.
 * Provides abstraction between world coordinates and screen/character coordinates.
 */

import { Vector2D } from '../math/vector2d.js';
import { Matrix3x3 } from '../math/matrix3x3.js';
import { BoundingBox } from '../math/geometry.js';
import { EventEmitter } from '../../utils/events.js';

// ==========================================
// VIRTUAL CANVAS
// ==========================================

/**
 * Virtual Canvas - High-resolution coordinate system
 * Maps floating-point world coordinates to character grid
 */
export class VirtualCanvas extends EventEmitter {
    /**
     * Create a new virtual canvas
     * @param {object} [options]
     * @param {number} [options.width=120] - Width in characters
     * @param {number} [options.height=40] - Height in characters
     * @param {number} [options.charWidth=1] - World units per character width
     * @param {number} [options.charHeight=2] - World units per character height (aspect ratio)
     */
    constructor(options = {}) {
        super();
        
        /** @type {number} Width in characters */
        this.charWidth = options.width || 120;
        
        /** @type {number} Height in characters */
        this.charHeight = options.height || 40;
        
        /** @type {number} World units per character width */
        this.unitWidth = options.charWidth || 1;
        
        /** @type {number} World units per character height */
        this.unitHeight = options.charHeight || 2;
        
        /** @type {number} World width */
        this.worldWidth = this.charWidth * this.unitWidth;
        
        /** @type {number} World height */
        this.worldHeight = this.charHeight * this.unitHeight;
        
        /** @type {BoundingBox} Canvas bounds in world coordinates */
        this.bounds = new BoundingBox(0, 0, this.worldWidth, this.worldHeight);
        
        /** @type {Matrix3x3} World to character transform */
        this._worldToChar = Matrix3x3.identity();
        
        /** @type {Matrix3x3} Character to world transform */
        this._charToWorld = Matrix3x3.identity();
        
        this._updateTransforms();
    }
    
    /**
     * Update internal transforms
     * @private
     */
    _updateTransforms() {
        // World to character: scale by 1/unitWidth, 1/unitHeight
        this._worldToChar = Matrix3x3.scale(
            1 / this.unitWidth,
            1 / this.unitHeight
        );
        
        // Character to world: scale by unitWidth, unitHeight
        this._charToWorld = Matrix3x3.scale(
            this.unitWidth,
            this.unitHeight
        );
    }
    
    /**
     * Resize the canvas
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     */
    resize(width, height) {
        const oldWidth = this.charWidth;
        const oldHeight = this.charHeight;
        
        this.charWidth = width;
        this.charHeight = height;
        this.worldWidth = this.charWidth * this.unitWidth;
        this.worldHeight = this.charHeight * this.unitHeight;
        this.bounds = new BoundingBox(0, 0, this.worldWidth, this.worldHeight);
        
        this._updateTransforms();
        
        this.emit('resize', {
            oldWidth,
            oldHeight,
            width: this.charWidth,
            height: this.charHeight,
            worldWidth: this.worldWidth,
            worldHeight: this.worldHeight
        });
    }
    
    /**
     * Set character aspect ratio
     * @param {number} widthUnits - World units per character width
     * @param {number} heightUnits - World units per character height
     */
    setCharacterSize(widthUnits, heightUnits) {
        this.unitWidth = widthUnits;
        this.unitHeight = heightUnits;
        this.worldWidth = this.charWidth * this.unitWidth;
        this.worldHeight = this.charHeight * this.unitHeight;
        this.bounds = new BoundingBox(0, 0, this.worldWidth, this.worldHeight);
        
        this._updateTransforms();
        
        this.emit('aspectchange', {
            unitWidth: this.unitWidth,
            unitHeight: this.unitHeight
        });
    }
    
    /**
     * Convert world coordinates to character grid coordinates
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {{x: number, y: number}}
     */
    worldToChar(worldX, worldY) {
        return {
            x: worldX / this.unitWidth,
            y: worldY / this.unitHeight
        };
    }
    
    /**
     * Convert world point to character grid (integer)
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {{x: number, y: number}}
     */
    worldToCharInt(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.unitWidth),
            y: Math.floor(worldY / this.unitHeight)
        };
    }
    
    /**
     * Convert character grid coordinates to world coordinates
     * @param {number} charX 
     * @param {number} charY 
     * @returns {{x: number, y: number}}
     */
    charToWorld(charX, charY) {
        return {
            x: charX * this.unitWidth,
            y: charY * this.unitHeight
        };
    }
    
    /**
     * Convert character cell center to world coordinates
     * @param {number} charX 
     * @param {number} charY 
     * @returns {{x: number, y: number}}
     */
    charCenterToWorld(charX, charY) {
        return {
            x: (charX + 0.5) * this.unitWidth,
            y: (charY + 0.5) * this.unitHeight
        };
    }
    
    /**
     * Convert Vector2D from world to character
     * @param {Vector2D} point 
     * @returns {Vector2D}
     */
    worldToCharVector(point) {
        const result = this.worldToChar(point.x, point.y);
        return new Vector2D(result.x, result.y);
    }
    
    /**
     * Convert Vector2D from character to world
     * @param {Vector2D} point 
     * @returns {Vector2D}
     */
    charToWorldVector(point) {
        const result = this.charToWorld(point.x, point.y);
        return new Vector2D(result.x, result.y);
    }
    
    /**
     * Convert world bounding box to character bounding box
     * @param {BoundingBox} bbox 
     * @returns {BoundingBox}
     */
    worldToCharBounds(bbox) {
        const min = this.worldToChar(bbox.minX, bbox.minY);
        const max = this.worldToChar(bbox.maxX, bbox.maxY);
        return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y);
    }
    
    /**
     * Convert character bounding box to world bounding box
     * @param {BoundingBox} bbox 
     * @returns {BoundingBox}
     */
    charToWorldBounds(bbox) {
        const min = this.charToWorld(bbox.minX, bbox.minY);
        const max = this.charToWorld(bbox.maxX, bbox.maxY);
        return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y);
    }
    
    /**
     * Check if world point is within canvas bounds
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {boolean}
     */
    containsWorld(worldX, worldY) {
        return worldX >= 0 && worldX < this.worldWidth &&
               worldY >= 0 && worldY < this.worldHeight;
    }
    
    /**
     * Check if character coordinates are within canvas bounds
     * @param {number} charX 
     * @param {number} charY 
     * @returns {boolean}
     */
    containsChar(charX, charY) {
        return charX >= 0 && charX < this.charWidth &&
               charY >= 0 && charY < this.charHeight;
    }
    
    /**
     * Clamp world coordinates to canvas bounds
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {{x: number, y: number}}
     */
    clampWorld(worldX, worldY) {
        return {
            x: Math.max(0, Math.min(this.worldWidth - 0.001, worldX)),
            y: Math.max(0, Math.min(this.worldHeight - 0.001, worldY))
        };
    }
    
    /**
     * Clamp character coordinates to canvas bounds
     * @param {number} charX 
     * @param {number} charY 
     * @returns {{x: number, y: number}}
     */
    clampChar(charX, charY) {
        return {
            x: Math.max(0, Math.min(this.charWidth - 1, Math.floor(charX))),
            y: Math.max(0, Math.min(this.charHeight - 1, Math.floor(charY)))
        };
    }
    
    /**
     * Get character cell bounds in world coordinates
     * @param {number} charX 
     * @param {number} charY 
     * @returns {BoundingBox}
     */
    getCharCellBounds(charX, charY) {
        return new BoundingBox(
            charX * this.unitWidth,
            charY * this.unitHeight,
            this.unitWidth,
            this.unitHeight
        );
    }
    
    /**
     * Iterate over all character cells
     * @param {function} callback - Called with (charX, charY, worldX, worldY)
     */
    forEachCell(callback) {
        for (let y = 0; y < this.charHeight; y++) {
            for (let x = 0; x < this.charWidth; x++) {
                const world = this.charCenterToWorld(x, y);
                callback(x, y, world.x, world.y);
            }
        }
    }
    
    /**
     * Iterate over character cells within a world bounding box
     * @param {BoundingBox} worldBounds 
     * @param {function} callback - Called with (charX, charY, worldX, worldY)
     */
    forEachCellInBounds(worldBounds, callback) {
        const minChar = this.worldToCharInt(worldBounds.minX, worldBounds.minY);
        const maxChar = this.worldToCharInt(worldBounds.maxX, worldBounds.maxY);
        
        const startX = Math.max(0, minChar.x);
        const startY = Math.max(0, minChar.y);
        const endX = Math.min(this.charWidth - 1, maxChar.x);
        const endY = Math.min(this.charHeight - 1, maxChar.y);
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const world = this.charCenterToWorld(x, y);
                callback(x, y, world.x, world.y);
            }
        }
    }
    
    /**
     * Get canvas info
     * @returns {object}
     */
    getInfo() {
        return {
            charWidth: this.charWidth,
            charHeight: this.charHeight,
            worldWidth: this.worldWidth,
            worldHeight: this.worldHeight,
            unitWidth: this.unitWidth,
            unitHeight: this.unitHeight,
            aspectRatio: this.unitHeight / this.unitWidth
        };
    }
    
    /**
     * Create a sub-region canvas
     * @param {number} x - Start character X
     * @param {number} y - Start character Y
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     * @returns {VirtualCanvas}
     */
    createSubCanvas(x, y, width, height) {
        return new VirtualCanvas({
            width,
            height,
            charWidth: this.unitWidth,
            charHeight: this.unitHeight
        });
    }
}

// ==========================================
// CANVAS LAYER
// ==========================================

/**
 * Canvas Layer - A single layer in the canvas
 */
export class CanvasLayer extends EventEmitter {
    /**
     * Create a new canvas layer
     * @param {string} id - Unique layer ID
     * @param {object} [options]
     */
    constructor(id, options = {}) {
        super();
        
        /** @type {string} */
        this.id = id;
        
        /** @type {string} */
        this.name = options.name || `Layer ${id}`;
        
        /** @type {boolean} */
        this.visible = options.visible !== false;
        
        /** @type {boolean} */
        this.locked = options.locked || false;
        
        /** @type {number} Opacity 0-1 */
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        
        /** @type {string} Blend mode */
        this.blendMode = options.blendMode || 'normal';
        
        /** @type {Array} Objects in this layer */
        this.objects = [];
        
        /** @type {boolean} */
        this.isDirty = true;
        
        /** @type {BoundingBox|null} Cached bounds */
        this._cachedBounds = null;
    }
    
    /**
     * Add an object to the layer
     * @param {object} obj 
     * @param {number} [index] - Insert at index
     */
    addObject(obj, index) {
        if (this.locked) return;
        
        if (index !== undefined) {
            this.objects.splice(index, 0, obj);
        } else {
            this.objects.push(obj);
        }
        
        obj.layer = this;
        this.markDirty();
        this.emit('objectadded', { object: obj, index: index ?? this.objects.length - 1 });
    }
    
    /**
     * Remove an object from the layer
     * @param {object} obj 
     * @returns {boolean}
     */
    removeObject(obj) {
        if (this.locked) return false;
        
        const index = this.objects.indexOf(obj);
        if (index !== -1) {
            this.objects.splice(index, 1);
            obj.layer = null;
            this.markDirty();
            this.emit('objectremoved', { object: obj, index });
            return true;
        }
        return false;
    }
    
    /**
     * Move object to new index
     * @param {object} obj 
     * @param {number} newIndex 
     */
    moveObject(obj, newIndex) {
        if (this.locked) return;
        
        const currentIndex = this.objects.indexOf(obj);
        if (currentIndex === -1) return;
        
        this.objects.splice(currentIndex, 1);
        this.objects.splice(newIndex, 0, obj);
        this.markDirty();
        this.emit('objectmoved', { object: obj, from: currentIndex, to: newIndex });
    }
    
    /**
     * Bring object to front
     * @param {object} obj 
     */
    bringToFront(obj) {
        this.moveObject(obj, this.objects.length - 1);
    }
    
    /**
     * Send object to back
     * @param {object} obj 
     */
    sendToBack(obj) {
        this.moveObject(obj, 0);
    }
    
    /**
     * Get all objects
     * @returns {Array}
     */
    getObjects() {
        return [...this.objects];
    }
    
    /**
     * Get object at index
     * @param {number} index 
     * @returns {object|null}
     */
    getObjectAt(index) {
        return this.objects[index] || null;
    }
    
    /**
     * Get object count
     * @returns {number}
     */
    getObjectCount() {
        return this.objects.length;
    }
    
    /**
     * Find objects at world point
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {Array}
     */
    getObjectsAtPoint(worldX, worldY) {
        if (!this.visible) return [];
        
        return this.objects.filter(obj => {
            if (obj.containsPoint) {
                return obj.containsPoint(worldX, worldY);
            }
            if (obj.bounds) {
                return obj.bounds.contains(worldX, worldY);
            }
            return false;
        });
    }
    
    /**
     * Find objects intersecting bounding box
     * @param {BoundingBox} bbox 
     * @returns {Array}
     */
    getObjectsInBounds(bbox) {
        if (!this.visible) return [];
        
        return this.objects.filter(obj => {
            if (obj.bounds) {
                return bbox.intersects(obj.bounds);
            }
            return false;
        });
    }
    
    /**
     * Get layer bounds
     * @returns {BoundingBox|null}
     */
    getBounds() {
        if (this._cachedBounds && !this.isDirty) {
            return this._cachedBounds;
        }
        
        if (this.objects.length === 0) {
            this._cachedBounds = null;
            return null;
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const obj of this.objects) {
            if (obj.bounds) {
                minX = Math.min(minX, obj.bounds.minX);
                minY = Math.min(minY, obj.bounds.minY);
                maxX = Math.max(maxX, obj.bounds.maxX);
                maxY = Math.max(maxY, obj.bounds.maxY);
            }
        }
        
        if (minX === Infinity) {
            this._cachedBounds = null;
            return null;
        }
        
        this._cachedBounds = new BoundingBox(minX, minY, maxX - minX, maxY - minY);
        return this._cachedBounds;
    }
    
    /**
     * Mark layer as dirty (needs re-render)
     */
    markDirty() {
        this.isDirty = true;
        this._cachedBounds = null;
        this.emit('dirty');
    }
    
    /**
     * Mark layer as clean
     */
    markClean() {
        this.isDirty = false;
    }
    
    /**
     * Clear all objects
     */
    clear() {
        if (this.locked) return;
        
        const objects = [...this.objects];
        this.objects = [];
        this.markDirty();
        this.emit('cleared', { objects });
    }
    
    /**
     * Set visibility
     * @param {boolean} visible 
     */
    setVisible(visible) {
        if (this.visible !== visible) {
            this.visible = visible;
            this.markDirty();
            this.emit('visibilitychange', { visible });
        }
    }
    
    /**
     * Toggle visibility
     */
    toggleVisible() {
        this.setVisible(!this.visible);
    }
    
    /**
     * Set locked state
     * @param {boolean} locked 
     */
    setLocked(locked) {
        if (this.locked !== locked) {
            this.locked = locked;
            this.emit('lockedchange', { locked });
        }
    }
    
    /**
     * Set opacity
     * @param {number} opacity - 0-1
     */
    setOpacity(opacity) {
        opacity = Math.max(0, Math.min(1, opacity));
        if (this.opacity !== opacity) {
            this.opacity = opacity;
            this.markDirty();
            this.emit('opacitychange', { opacity });
        }
    }
    
    /**
     * Set blend mode
     * @param {string} mode 
     */
    setBlendMode(mode) {
        if (this.blendMode !== mode) {
            this.blendMode = mode;
            this.markDirty();
            this.emit('blendmodechange', { mode });
        }
    }
    
    /**
     * Clone the layer
     * @param {boolean} [deep=true] - Clone objects too
     * @returns {CanvasLayer}
     */
    clone(deep = true) {
        const cloned = new CanvasLayer(this.id + '_clone', {
            name: this.name + ' (copy)',
            visible: this.visible,
            locked: this.locked,
            opacity: this.opacity,
            blendMode: this.blendMode
        });
        
        if (deep) {
            for (const obj of this.objects) {
                if (obj.clone) {
                    cloned.addObject(obj.clone());
                }
            }
        }
        
        return cloned;
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            visible: this.visible,
            locked: this.locked,
            opacity: this.opacity,
            blendMode: this.blendMode,
            objects: this.objects.map(obj => obj.toJSON ? obj.toJSON() : obj)
        };
    }
    
    /**
     * Create from JSON
     * @param {object} data 
     * @returns {CanvasLayer}
     */
    static fromJSON(data) {
        const layer = new CanvasLayer(data.id, {
            name: data.name,
            visible: data.visible,
            locked: data.locked,
            opacity: data.opacity,
            blendMode: data.blendMode
        });
        
        // Objects would need to be deserialized based on type
        // This is a placeholder - actual implementation depends on object registry
        
        return layer;
    }
}

// ==========================================
// CANVAS MANAGER
// ==========================================

/**
 * Canvas Manager - Manages multiple layers and the virtual canvas
 */
export class CanvasManager extends EventEmitter {
    /**
     * Create a new canvas manager
     * @param {VirtualCanvas} canvas 
     */
    constructor(canvas) {
        super();
        
        /** @type {VirtualCanvas} */
        this.canvas = canvas;
        
        /** @type {Map<string, CanvasLayer>} */
        this.layers = new Map();
        
        /** @type {string[]} Layer order (bottom to top) */
        this.layerOrder = [];
        
        /** @type {string|null} */
        this.activeLayerId = null;
        
        /** @type {number} */
        this._layerCounter = 0;
        
        // Create default layer
        this.createLayer('default', { name: 'Layer 1' });
        this.setActiveLayer('default');
    }
    
    /**
     * Create a new layer
     * @param {string} [id] - Optional ID
     * @param {object} [options] 
     * @returns {CanvasLayer}
     */
    createLayer(id, options = {}) {
        id = id || `layer_${++this._layerCounter}`;
        
        const layer = new CanvasLayer(id, options);
        this.layers.set(id, layer);
        this.layerOrder.push(id);
        
        // Forward layer events
        layer.on('dirty', () => this.emit('layerdirty', { layer }));
        layer.on('objectadded', (e) => this.emit('objectadded', { ...e, layer }));
        layer.on('objectremoved', (e) => this.emit('objectremoved', { ...e, layer }));
        
        this.emit('layercreated', { layer });
        return layer;
    }
    
    /**
     * Delete a layer
     * @param {string} id 
     * @returns {boolean}
     */
    deleteLayer(id) {
        if (!this.layers.has(id)) return false;
        if (this.layers.size <= 1) return false; // Keep at least one layer
        
        const layer = this.layers.get(id);
        this.layers.delete(id);
        
        const index = this.layerOrder.indexOf(id);
        if (index !== -1) {
            this.layerOrder.splice(index, 1);
        }
        
        // Update active layer if needed
        if (this.activeLayerId === id) {
            this.activeLayerId = this.layerOrder[Math.max(0, index - 1)];
        }
        
        this.emit('layerdeleted', { layer, id });
        return true;
    }
    
    /**
     * Get layer by ID
     * @param {string} id 
     * @returns {CanvasLayer|null}
     */
    getLayer(id) {
        return this.layers.get(id) || null;
    }
    
    /**
     * Get active layer
     * @returns {CanvasLayer|null}
     */
    getActiveLayer() {
        return this.activeLayerId ? this.layers.get(this.activeLayerId) : null;
    }
    
    /**
     * Set active layer
     * @param {string} id 
     */
    setActiveLayer(id) {
        if (this.layers.has(id) && this.activeLayerId !== id) {
            const oldId = this.activeLayerId;
            this.activeLayerId = id;
            this.emit('activelayerchange', { 
                oldLayerId: oldId, 
                newLayerId: id,
                layer: this.layers.get(id)
            });
        }
    }
    
    /**
     * Get all layers in order (bottom to top)
     * @returns {CanvasLayer[]}
     */
    getLayers() {
        return this.layerOrder.map(id => this.layers.get(id));
    }
    
    /**
     * Get visible layers in order
     * @returns {CanvasLayer[]}
     */
    getVisibleLayers() {
        return this.getLayers().filter(layer => layer.visible);
    }
    
    /**
     * Move layer to new index
     * @param {string} id 
     * @param {number} newIndex 
     */
    moveLayer(id, newIndex) {
        const currentIndex = this.layerOrder.indexOf(id);
        if (currentIndex === -1) return;
        
        this.layerOrder.splice(currentIndex, 1);
        this.layerOrder.splice(newIndex, 0, id);
        
        this.emit('layermoved', { 
            id, 
            from: currentIndex, 
            to: newIndex,
            layer: this.layers.get(id)
        });
    }
    
    /**
     * Move layer up (towards front)
     * @param {string} id 
     */
    moveLayerUp(id) {
        const index = this.layerOrder.indexOf(id);
        if (index < this.layerOrder.length - 1) {
            this.moveLayer(id, index + 1);
        }
    }
    
    /**
     * Move layer down (towards back)
     * @param {string} id 
     */
    moveLayerDown(id) {
        const index = this.layerOrder.indexOf(id);
        if (index > 0) {
            this.moveLayer(id, index - 1);
        }
    }
    
    /**
     * Duplicate a layer
     * @param {string} id 
     * @returns {CanvasLayer|null}
     */
    duplicateLayer(id) {
        const original = this.layers.get(id);
        if (!original) return null;
        
        const cloned = original.clone(true);
        cloned.id = `layer_${++this._layerCounter}`;
        
        this.layers.set(cloned.id, cloned);
        
        const index = this.layerOrder.indexOf(id);
        this.layerOrder.splice(index + 1, 0, cloned.id);
        
        this.emit('layercreated', { layer: cloned, duplicatedFrom: id });
        return cloned;
    }
    
    /**
     * Merge layer down
     * @param {string} id 
     * @returns {boolean}
     */
    mergeLayerDown(id) {
        const index = this.layerOrder.indexOf(id);
        if (index <= 0) return false;
        
        const upperLayer = this.layers.get(id);
        const lowerLayer = this.layers.get(this.layerOrder[index - 1]);
        
        if (upperLayer.locked || lowerLayer.locked) return false;
        
        // Move objects to lower layer
        for (const obj of upperLayer.objects) {
            lowerLayer.addObject(obj);
        }
        
        // Delete upper layer
        this.deleteLayer(id);
        
        this.emit('layermerged', { upper: id, lower: lowerLayer.id });
        return true;
    }
    
    /**
     * Flatten all layers into one
     * @returns {CanvasLayer}
     */
    flattenLayers() {
        const flattened = this.createLayer(null, { name: 'Flattened' });
        
        for (const id of this.layerOrder) {
            if (id === flattened.id) continue;
            
            const layer = this.layers.get(id);
            if (!layer.visible) continue;
            
            for (const obj of layer.objects) {
                if (obj.clone) {
                    flattened.addObject(obj.clone());
                }
            }
        }
        
        // Remove old layers
        const oldIds = [...this.layerOrder].filter(id => id !== flattened.id);
        for (const id of oldIds) {
            this.layers.delete(id);
        }
        
        this.layerOrder = [flattened.id];
        this.activeLayerId = flattened.id;
        
        this.emit('layersflattened', { layer: flattened });
        return flattened;
    }
    
    /**
     * Get all objects at world point (across all visible layers)
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {Array}
     */
    getObjectsAtPoint(worldX, worldY) {
        const results = [];
        
        // Search from top to bottom
        for (let i = this.layerOrder.length - 1; i >= 0; i--) {
            const layer = this.layers.get(this.layerOrder[i]);
            const objects = layer.getObjectsAtPoint(worldX, worldY);
            results.push(...objects);
        }
        
        return results;
    }
    
    /**
     * Get topmost object at point
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {object|null}
     */
    getTopObjectAtPoint(worldX, worldY) {
        const objects = this.getObjectsAtPoint(worldX, worldY);
        return objects.length > 0 ? objects[0] : null;
    }
    
    /**
     * Check if any layer is dirty
     * @returns {boolean}
     */
    isDirty() {
        for (const layer of this.layers.values()) {
            if (layer.isDirty) return true;
        }
        return false;
    }
    
    /**
     * Mark all layers clean
     */
    markAllClean() {
        for (const layer of this.layers.values()) {
            layer.markClean();
        }
    }
    
    /**
     * Get dirty layers
     * @returns {CanvasLayer[]}
     */
    getDirtyLayers() {
        return this.getLayers().filter(layer => layer.isDirty);
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            canvas: this.canvas.getInfo(),
            layerOrder: this.layerOrder,
            activeLayerId: this.activeLayerId,
            layers: this.getLayers().map(layer => layer.toJSON())
        };
    }
}

export default {
    VirtualCanvas,
    CanvasLayer,
    CanvasManager
};
