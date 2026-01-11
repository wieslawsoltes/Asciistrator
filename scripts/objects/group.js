/**
 * Asciistrator - Group Object
 * 
 * Container for grouping multiple objects together.
 */

import { SceneObject, Style } from './base.js';
import { Vector2D } from '../core/math/vector2d.js';
import { Matrix3x3 } from '../core/math/matrix3x3.js';

// ==========================================
// GROUP
// ==========================================

/**
 * Group - Container for multiple objects
 */
export class Group extends SceneObject {
    /**
     * Create a group
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'group';
        this.name = options.name || 'Group';
        
        /** @type {SceneObject[]} */
        this.children = [];
        
        /** @type {boolean} Clip children to bounds */
        this.clipToBounds = options.clipToBounds || false;
        
        /** @type {boolean} Isolate blend mode */
        this.isolateBlending = options.isolateBlending || false;
        
        // Add initial children
        if (options.children) {
            for (const child of options.children) {
                this.add(child);
            }
        }
    }
    
    // ==========================================
    // CHILD MANAGEMENT
    // ==========================================
    
    /**
     * Add child object
     * @param {SceneObject} child 
     * @param {number} [index]
     * @returns {Group} this
     */
    add(child, index = null) {
        if (!child) return this;
        
        // Remove from previous parent
        if (child.parent) {
            child.parent.remove(child);
        }
        
        // Add to this group
        if (index === null || index >= this.children.length) {
            this.children.push(child);
        } else {
            this.children.splice(Math.max(0, index), 0, child);
        }
        
        child.parent = this;
        this._invalidateGeometry();
        this.emit('childAdded', { child, group: this });
        
        return this;
    }
    
    /**
     * Remove child object
     * @param {SceneObject} child 
     * @returns {SceneObject|null}
     */
    remove(child) {
        const index = this.children.indexOf(child);
        
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            this._invalidateGeometry();
            this.emit('childRemoved', { child, group: this });
            return child;
        }
        
        return null;
    }
    
    /**
     * Remove child at index
     * @param {number} index 
     * @returns {SceneObject|null}
     */
    removeAt(index) {
        if (index >= 0 && index < this.children.length) {
            return this.remove(this.children[index]);
        }
        return null;
    }
    
    /**
     * Remove all children
     * @returns {SceneObject[]}
     */
    clear() {
        const removed = [...this.children];
        
        for (const child of removed) {
            child.parent = null;
        }
        
        this.children = [];
        this._invalidateGeometry();
        this.emit('cleared', { children: removed, group: this });
        
        return removed;
    }
    
    /**
     * Get child at index
     * @param {number} index 
     * @returns {SceneObject|null}
     */
    getChildAt(index) {
        return this.children[index] || null;
    }
    
    /**
     * Get child by ID
     * @param {string} id 
     * @returns {SceneObject|null}
     */
    getChildById(id) {
        return this.children.find(c => c.id === id) || null;
    }
    
    /**
     * Get child by name
     * @param {string} name 
     * @returns {SceneObject|null}
     */
    getChildByName(name) {
        return this.children.find(c => c.name === name) || null;
    }
    
    /**
     * Get child index
     * @param {SceneObject} child 
     * @returns {number}
     */
    getChildIndex(child) {
        return this.children.indexOf(child);
    }
    
    /**
     * Get child count
     * @returns {number}
     */
    getChildCount() {
        return this.children.length;
    }
    
    /**
     * Check if has child
     * @param {SceneObject} child 
     * @returns {boolean}
     */
    hasChild(child) {
        return this.children.includes(child);
    }
    
    /**
     * Check if empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.children.length === 0;
    }
    
    // ==========================================
    // ORDERING
    // ==========================================
    
    /**
     * Move child to index
     * @param {SceneObject} child 
     * @param {number} index 
     */
    setChildIndex(child, index) {
        const currentIndex = this.children.indexOf(child);
        
        if (currentIndex !== -1 && currentIndex !== index) {
            this.children.splice(currentIndex, 1);
            this.children.splice(Math.max(0, Math.min(index, this.children.length)), 0, child);
            this.emit('childReordered', { child, oldIndex: currentIndex, newIndex: index });
        }
    }
    
    /**
     * Bring child to front
     * @param {SceneObject} child 
     */
    bringToFront(child) {
        this.setChildIndex(child, this.children.length - 1);
    }
    
    /**
     * Send child to back
     * @param {SceneObject} child 
     */
    sendToBack(child) {
        this.setChildIndex(child, 0);
    }
    
    /**
     * Move child forward
     * @param {SceneObject} child 
     */
    moveForward(child) {
        const index = this.children.indexOf(child);
        if (index !== -1 && index < this.children.length - 1) {
            this.setChildIndex(child, index + 1);
        }
    }
    
    /**
     * Move child backward
     * @param {SceneObject} child 
     */
    moveBackward(child) {
        const index = this.children.indexOf(child);
        if (index > 0) {
            this.setChildIndex(child, index - 1);
        }
    }
    
    /**
     * Swap two children
     * @param {SceneObject} child1 
     * @param {SceneObject} child2 
     */
    swapChildren(child1, child2) {
        const index1 = this.children.indexOf(child1);
        const index2 = this.children.indexOf(child2);
        
        if (index1 !== -1 && index2 !== -1) {
            this.children[index1] = child2;
            this.children[index2] = child1;
            this.emit('childrenSwapped', { child1, child2 });
        }
    }
    
    // ==========================================
    // ITERATION
    // ==========================================
    
    /**
     * Iterate over children
     * @param {function} callback 
     */
    forEach(callback) {
        this.children.forEach(callback);
    }
    
    /**
     * Map children
     * @param {function} callback 
     * @returns {Array}
     */
    map(callback) {
        return this.children.map(callback);
    }
    
    /**
     * Filter children
     * @param {function} predicate 
     * @returns {SceneObject[]}
     */
    filter(predicate) {
        return this.children.filter(predicate);
    }
    
    /**
     * Find child
     * @param {function} predicate 
     * @returns {SceneObject|undefined}
     */
    find(predicate) {
        return this.children.find(predicate);
    }
    
    /**
     * Get all descendants (recursive)
     * @returns {SceneObject[]}
     */
    getDescendants() {
        const descendants = [];
        
        const collect = (obj) => {
            descendants.push(obj);
            if (obj instanceof Group) {
                obj.children.forEach(collect);
            }
        };
        
        this.children.forEach(collect);
        return descendants;
    }
    
    /**
     * Walk tree (depth-first)
     * @param {function} callback 
     * @param {boolean} [preOrder=true]
     */
    walk(callback, preOrder = true) {
        const visit = (obj, depth) => {
            if (preOrder) callback(obj, depth);
            
            if (obj instanceof Group) {
                obj.children.forEach(child => visit(child, depth + 1));
            }
            
            if (!preOrder) callback(obj, depth);
        };
        
        this.children.forEach(child => visit(child, 0));
    }
    
    // ==========================================
    // BOUNDS
    // ==========================================
    
    /**
     * Get local bounds (union of children)
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        if (this.children.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const child of this.children) {
            if (!child.visible) continue;
            
            const childBounds = child.getBounds();
            
            // Transform to local coordinates
            minX = Math.min(minX, childBounds.minX);
            minY = Math.min(minY, childBounds.minY);
            maxX = Math.max(maxX, childBounds.maxX);
            maxY = Math.max(maxY, childBounds.maxY);
        }
        
        if (!isFinite(minX)) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Get center of group
     * @returns {{x: number, y: number}}
     */
    getCenter() {
        const bounds = this.getBounds();
        return {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
        };
    }
    
    /**
     * Fit bounds to children
     */
    fitBounds() {
        const bounds = this.getLocalBounds();
        const center = {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
        };
        
        // Move children to center around group origin
        for (const child of this.children) {
            child.x -= center.x;
            child.y -= center.y;
        }
        
        // Update group position
        this.x += center.x;
        this.y += center.y;
        
        this._invalidateGeometry();
    }
    
    // ==========================================
    // HIT TESTING
    // ==========================================
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        // Test children in reverse order (top to bottom)
        for (let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            
            if (!child.visible || child.locked) continue;
            
            if (child.hitTest(x, y)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Hit test with result
     * @param {number} x 
     * @param {number} y 
     * @returns {SceneObject|null}
     */
    hitTestChildren(x, y) {
        for (let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            
            if (!child.visible || child.locked) continue;
            
            // Recurse into groups
            if (child instanceof Group) {
                const hit = child.hitTestChildren(x, y);
                if (hit) return hit;
            } else if (child.hitTest(x, y)) {
                return child;
            }
        }
        
        return null;
    }
    
    /**
     * Get all objects at point
     * @param {number} x 
     * @param {number} y 
     * @returns {SceneObject[]}
     */
    getObjectsAtPoint(x, y) {
        const objects = [];
        
        const test = (obj) => {
            if (!obj.visible || obj.locked) return;
            
            if (obj instanceof Group) {
                obj.children.forEach(test);
            } else if (obj.hitTest(x, y)) {
                objects.push(obj);
            }
        };
        
        this.children.forEach(test);
        return objects;
    }
    
    /**
     * Get objects in rectangle
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {boolean} [fullyContained=false]
     * @returns {SceneObject[]}
     */
    getObjectsInRect(x, y, width, height, fullyContained = false) {
        const objects = [];
        const rect = { minX: x, minY: y, maxX: x + width, maxY: y + height };
        
        const test = (obj) => {
            if (!obj.visible || obj.locked) return;
            
            if (obj instanceof Group) {
                obj.children.forEach(test);
            } else {
                const bounds = obj.getBounds();
                
                if (fullyContained) {
                    // Must be fully inside
                    if (bounds.minX >= rect.minX && bounds.maxX <= rect.maxX &&
                        bounds.minY >= rect.minY && bounds.maxY <= rect.maxY) {
                        objects.push(obj);
                    }
                } else {
                    // Intersection check
                    if (!(bounds.maxX < rect.minX || bounds.minX > rect.maxX ||
                          bounds.maxY < rect.minY || bounds.minY > rect.maxY)) {
                        objects.push(obj);
                    }
                }
            }
        };
        
        this.children.forEach(test);
        return objects;
    }
    
    // ==========================================
    // TRANSFORM
    // ==========================================
    
    /**
     * Apply transform to all children
     * @param {Matrix3x3} transform 
     */
    applyTransformToChildren(transform) {
        for (const child of this.children) {
            const pos = transform.transformPoint({ x: child.x, y: child.y });
            child.x = pos.x;
            child.y = pos.y;
            
            // Apply rotation
            const angle = Math.atan2(transform.b, transform.a);
            child.rotation += angle;
            
            // Apply scale
            const scaleX = Math.sqrt(transform.a * transform.a + transform.b * transform.b);
            const scaleY = Math.sqrt(transform.c * transform.c + transform.d * transform.d);
            child.scaleX *= scaleX;
            child.scaleY *= scaleY;
        }
        
        this._invalidateGeometry();
    }
    
    /**
     * Reset group transform (apply to children)
     */
    flattenTransform() {
        const transform = this.getLocalTransform();
        this.applyTransformToChildren(transform);
        
        // Reset group transform
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.skewX = 0;
        this.skewY = 0;
    }
    
    // ==========================================
    // GROUPING OPERATIONS
    // ==========================================
    
    /**
     * Ungroup (move children to parent)
     * @returns {SceneObject[]}
     */
    ungroup() {
        const parent = this.parent;
        const children = [...this.children];
        const groupTransform = this.getWorldTransform();
        
        // Move children to parent
        for (const child of children) {
            // Apply group transform to child
            const worldPos = groupTransform.transformPoint({ x: child.x, y: child.y });
            child.x = worldPos.x;
            child.y = worldPos.y;
            child.rotation += this.rotation;
            child.scaleX *= this.scaleX;
            child.scaleY *= this.scaleY;
            
            child.parent = null;
            
            if (parent instanceof Group) {
                parent.add(child);
            }
        }
        
        this.children = [];
        
        // Remove this group from parent
        if (parent instanceof Group) {
            parent.remove(this);
        }
        
        return children;
    }
    
    /**
     * Create group from objects
     * @param {SceneObject[]} objects 
     * @returns {Group}
     */
    static fromObjects(objects) {
        const group = new Group();
        
        for (const obj of objects) {
            group.add(obj);
        }
        
        group.fitBounds();
        return group;
    }
    
    // ==========================================
    // RENDERING
    // ==========================================
    
    /**
     * Rasterize group (render all children)
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        const cells = [];
        
        for (const child of this.children) {
            if (!child.visible) continue;
            
            const childCells = child.rasterize();
            
            // Apply group opacity
            if (this.opacity < 1) {
                for (const cell of childCells) {
                    // Could apply opacity to color here
                }
            }
            
            cells.push(...childCells);
        }
        
        return cells;
    }
    
    // ==========================================
    // SERIALIZATION
    // ==========================================
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            children: this.children.map(c => c.toJSON()),
            clipToBounds: this.clipToBounds,
            isolateBlending: this.isolateBlending
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     * @param {function} [objectFactory] - Function to create objects from data
     */
    fromJSON(data, objectFactory = null) {
        super.fromJSON(data);
        
        this.clipToBounds = data.clipToBounds || false;
        this.isolateBlending = data.isolateBlending || false;
        
        this.children = [];
        
        if (data.children && objectFactory) {
            for (const childData of data.children) {
                const child = objectFactory(childData);
                if (child) {
                    this.add(child);
                }
            }
        }
        
        this._invalidateGeometry();
    }
    
    /**
     * Clone group
     * @param {boolean} [deep=true] - Clone children
     * @returns {Group}
     */
    clone(deep = true) {
        const cloned = new Group({
            clipToBounds: this.clipToBounds,
            isolateBlending: this.isolateBlending
        });
        
        // Copy base properties
        cloned.x = this.x;
        cloned.y = this.y;
        cloned.rotation = this.rotation;
        cloned.scaleX = this.scaleX;
        cloned.scaleY = this.scaleY;
        cloned.skewX = this.skewX;
        cloned.skewY = this.skewY;
        cloned.opacity = this.opacity;
        cloned.blendMode = this.blendMode;
        cloned.visible = this.visible;
        cloned.locked = this.locked;
        cloned.style = this.style.clone();
        
        // Clone children
        if (deep) {
            for (const child of this.children) {
                cloned.add(child.clone());
            }
        }
        
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        
        return cloned;
    }
}

// ==========================================
// CLIPPING GROUP
// ==========================================

/**
 * ClippingGroup - Group that clips children to a mask shape
 */
export class ClippingGroup extends Group {
    /**
     * Create a clipping group
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'clippingGroup';
        this.name = options.name || 'Clipping Group';
        
        /** @type {SceneObject|null} Clipping mask */
        this._mask = options.mask || null;
        
        /** @type {boolean} Invert mask */
        this.invertMask = options.invertMask || false;
    }
    
    /**
     * Set clipping mask
     * @param {SceneObject} mask 
     */
    setMask(mask) {
        this._mask = mask;
        this._invalidateGeometry();
    }
    
    /**
     * Get clipping mask
     * @returns {SceneObject|null}
     */
    getMask() {
        return this._mask;
    }
    
    /**
     * Clear mask
     */
    clearMask() {
        this._mask = null;
        this._invalidateGeometry();
    }
    
    /**
     * Check if point is inside mask
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isInsideMask(x, y) {
        if (!this._mask) return true;
        
        const inside = this._mask.hitTest(x, y);
        return this.invertMask ? !inside : inside;
    }
    
    /**
     * Rasterize with clipping
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        const cells = super.rasterize();
        
        if (!this._mask) return cells;
        
        // Filter cells by mask
        return cells.filter(cell => this.isInsideMask(cell.x, cell.y));
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            mask: this._mask ? this._mask.toJSON() : null,
            invertMask: this.invertMask
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     * @param {function} [objectFactory]
     */
    fromJSON(data, objectFactory = null) {
        super.fromJSON(data, objectFactory);
        
        this.invertMask = data.invertMask || false;
        
        if (data.mask && objectFactory) {
            this._mask = objectFactory(data.mask);
        }
    }
    
    /**
     * Clone
     * @param {boolean} [deep=true]
     * @returns {ClippingGroup}
     */
    clone(deep = true) {
        const cloned = new ClippingGroup({
            invertMask: this.invertMask
        });
        
        // Copy base properties
        Object.assign(cloned, {
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            skewX: this.skewX,
            skewY: this.skewY,
            opacity: this.opacity,
            blendMode: this.blendMode,
            visible: this.visible,
            locked: this.locked
        });
        
        cloned.style = this.style.clone();
        
        if (this._mask) {
            cloned._mask = this._mask.clone();
        }
        
        if (deep) {
            for (const child of this.children) {
                cloned.add(child.clone());
            }
        }
        
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        
        return cloned;
    }
}

// ==========================================
// SYMBOL
// ==========================================

/**
 * Symbol - Reusable group definition
 */
export class Symbol extends Group {
    /**
     * Create a symbol
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'symbol';
        this.name = options.name || 'Symbol';
        
        /** @type {string} Library name */
        this.libraryName = options.libraryName || '';
        
        /** @type {string} Symbol definition ID */
        this.definitionId = options.definitionId || this.id;
        
        /** @type {boolean} Allow individual editing */
        this.allowEditing = options.allowEditing || false;
    }
    
    /**
     * Create instance of this symbol
     * @returns {SymbolInstance}
     */
    createInstance() {
        return new SymbolInstance({
            symbolId: this.definitionId,
            name: this.name + ' Instance'
        });
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            libraryName: this.libraryName,
            definitionId: this.definitionId,
            allowEditing: this.allowEditing
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     * @param {function} [objectFactory]
     */
    fromJSON(data, objectFactory = null) {
        super.fromJSON(data, objectFactory);
        
        this.libraryName = data.libraryName || '';
        this.definitionId = data.definitionId || this.id;
        this.allowEditing = data.allowEditing || false;
    }
}

/**
 * SymbolInstance - Instance of a symbol
 */
export class SymbolInstance extends SceneObject {
    /**
     * Create a symbol instance
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'symbolInstance';
        this.name = options.name || 'Symbol Instance';
        
        /** @type {string} Reference to symbol definition */
        this.symbolId = options.symbolId || null;
        
        /** @type {Symbol|null} Cached symbol reference */
        this._symbolRef = null;
    }
    
    /**
     * Set symbol reference
     * @param {Symbol} symbol 
     */
    setSymbol(symbol) {
        this._symbolRef = symbol;
        this.symbolId = symbol ? symbol.definitionId : null;
        this._invalidateGeometry();
    }
    
    /**
     * Get symbol reference
     * @returns {Symbol|null}
     */
    getSymbol() {
        return this._symbolRef;
    }
    
    /**
     * Get local bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        if (this._symbolRef) {
            return this._symbolRef.getLocalBounds();
        }
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        if (this._symbolRef) {
            const local = this.worldToLocal(x, y);
            return this._symbolRef._detailedHitTest(local.x, local.y);
        }
        return false;
    }
    
    /**
     * Rasterize
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        if (!this._symbolRef) return [];
        
        // Get symbol cells and transform them
        const symbolCells = this._symbolRef.rasterize();
        const transform = this.getWorldTransform();
        
        return symbolCells.map(cell => {
            const transformed = transform.transformPoint({ x: cell.x, y: cell.y });
            return {
                x: Math.round(transformed.x),
                y: Math.round(transformed.y),
                char: cell.char,
                color: cell.color
            };
        });
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            symbolId: this.symbolId
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.symbolId = data.symbolId || null;
        this._symbolRef = null;
        this._invalidateGeometry();
    }
    
    /**
     * Clone
     * @returns {SymbolInstance}
     */
    clone() {
        const cloned = new SymbolInstance({
            symbolId: this.symbolId
        });
        
        cloned.x = this.x;
        cloned.y = this.y;
        cloned.rotation = this.rotation;
        cloned.scaleX = this.scaleX;
        cloned.scaleY = this.scaleY;
        cloned.opacity = this.opacity;
        cloned.visible = this.visible;
        cloned._symbolRef = this._symbolRef;
        
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        
        return cloned;
    }
}

export default {
    Group,
    ClippingGroup,
    Symbol,
    SymbolInstance
};
