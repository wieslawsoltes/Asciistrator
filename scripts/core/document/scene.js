/**
 * Asciistrator - Scene Graph
 * 
 * Hierarchical scene structure for managing objects and their relationships.
 */

import { Vector2D } from '../math/vector2d.js';
import { Matrix3x3 } from '../math/matrix3x3.js';
import { Geometry } from '../math/geometry.js';
import { EventEmitter } from '../../utils/events.js';

// ==========================================
// SCENE NODE
// ==========================================

/**
 * SceneNode - Base class for all scene graph nodes
 */
export class SceneNode extends EventEmitter {
    /**
     * Create a scene node
     * @param {object} [options]
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Unique identifier */
        this.id = options.id || `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        
        /** @type {string} Node name */
        this.name = options.name || 'Unnamed';
        
        /** @type {string} Node type */
        this.type = options.type || 'node';
        
        /** @type {SceneNode|null} Parent node */
        this.parent = null;
        
        /** @type {SceneNode[]} Child nodes */
        this.children = [];
        
        /** @type {boolean} Visibility */
        this.visible = options.visible !== false;
        
        /** @type {boolean} Locked state */
        this.locked = options.locked || false;
        
        /** @type {boolean} Selectability */
        this.selectable = options.selectable !== false;
        
        /** @type {number} Local X position */
        this.x = options.x || 0;
        
        /** @type {number} Local Y position */
        this.y = options.y || 0;
        
        /** @type {number} Local rotation in radians */
        this.rotation = options.rotation || 0;
        
        /** @type {number} Local scale X */
        this.scaleX = options.scaleX !== undefined ? options.scaleX : 1;
        
        /** @type {number} Local scale Y */
        this.scaleY = options.scaleY !== undefined ? options.scaleY : 1;
        
        /** @type {number} Opacity (0-1) */
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        
        /** @type {Matrix3x3|null} Cached local transform */
        this._localTransform = null;
        
        /** @type {Matrix3x3|null} Cached world transform */
        this._worldTransform = null;
        
        /** @type {boolean} Transform needs update */
        this._transformDirty = true;
        
        /** @type {object|null} Cached bounds */
        this._bounds = null;
        
        /** @type {boolean} Bounds need update */
        this._boundsDirty = true;
        
        /** @type {object} Custom user data */
        this.userData = options.userData || {};
        
        /** @type {string[]} Tags for organization */
        this.tags = options.tags || [];
    }
    
    // ==========================================
    // HIERARCHY
    // ==========================================
    
    /**
     * Add a child node
     * @param {SceneNode} child 
     * @returns {SceneNode} The added child
     */
    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        
        child.parent = this;
        this.children.push(child);
        child._invalidateTransform();
        
        this.emit('childadded', { child });
        child.emit('added', { parent: this });
        
        return child;
    }
    
    /**
     * Add multiple children
     * @param {...SceneNode} children 
     */
    addChildren(...children) {
        for (const child of children) {
            this.addChild(child);
        }
    }
    
    /**
     * Remove a child node
     * @param {SceneNode} child 
     * @returns {boolean}
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            
            this.emit('childremoved', { child });
            child.emit('removed', { parent: this });
            
            return true;
        }
        return false;
    }
    
    /**
     * Remove from parent
     */
    removeFromParent() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
    
    /**
     * Get child at index
     * @param {number} index 
     * @returns {SceneNode|null}
     */
    getChildAt(index) {
        return this.children[index] || null;
    }
    
    /**
     * Get child by ID
     * @param {string} id 
     * @returns {SceneNode|null}
     */
    getChildById(id) {
        return this.children.find(c => c.id === id) || null;
    }
    
    /**
     * Get child index
     * @param {SceneNode} child 
     * @returns {number}
     */
    getChildIndex(child) {
        return this.children.indexOf(child);
    }
    
    /**
     * Set child index (reorder)
     * @param {SceneNode} child 
     * @param {number} index 
     */
    setChildIndex(child, index) {
        const currentIndex = this.children.indexOf(child);
        if (currentIndex !== -1 && currentIndex !== index) {
            this.children.splice(currentIndex, 1);
            this.children.splice(index, 0, child);
            this.emit('childreordered', { child, oldIndex: currentIndex, newIndex: index });
        }
    }
    
    /**
     * Bring child to front
     * @param {SceneNode} child 
     */
    bringToFront(child) {
        const index = this.children.indexOf(child);
        if (index !== -1 && index < this.children.length - 1) {
            this.children.splice(index, 1);
            this.children.push(child);
            this.emit('childreordered', { child });
        }
    }
    
    /**
     * Send child to back
     * @param {SceneNode} child 
     */
    sendToBack(child) {
        const index = this.children.indexOf(child);
        if (index > 0) {
            this.children.splice(index, 1);
            this.children.unshift(child);
            this.emit('childreordered', { child });
        }
    }
    
    /**
     * Check if node is descendant of another
     * @param {SceneNode} node 
     * @returns {boolean}
     */
    isDescendantOf(node) {
        let current = this.parent;
        while (current) {
            if (current === node) return true;
            current = current.parent;
        }
        return false;
    }
    
    /**
     * Get all ancestors
     * @returns {SceneNode[]}
     */
    getAncestors() {
        const ancestors = [];
        let current = this.parent;
        while (current) {
            ancestors.push(current);
            current = current.parent;
        }
        return ancestors;
    }
    
    /**
     * Get depth in hierarchy
     * @returns {number}
     */
    getDepth() {
        let depth = 0;
        let current = this.parent;
        while (current) {
            depth++;
            current = current.parent;
        }
        return depth;
    }
    
    /**
     * Get root node
     * @returns {SceneNode}
     */
    getRoot() {
        let current = this;
        while (current.parent) {
            current = current.parent;
        }
        return current;
    }
    
    // ==========================================
    // TRANSFORMS
    // ==========================================
    
    /**
     * Get local transform matrix
     * @returns {Matrix3x3}
     */
    getLocalTransform() {
        if (this._transformDirty || !this._localTransform) {
            this._localTransform = Matrix3x3.identity()
                .translate(this.x, this.y)
                .rotate(this.rotation)
                .scale(this.scaleX, this.scaleY);
        }
        return this._localTransform;
    }
    
    /**
     * Get world transform matrix (includes all parent transforms)
     * @returns {Matrix3x3}
     */
    getWorldTransform() {
        if (this._transformDirty || !this._worldTransform) {
            const local = this.getLocalTransform();
            if (this.parent) {
                this._worldTransform = this.parent.getWorldTransform().multiply(local);
            } else {
                this._worldTransform = local.clone();
            }
            this._transformDirty = false;
        }
        return this._worldTransform;
    }
    
    /**
     * Set position
     * @param {number} x 
     * @param {number} y 
     */
    setPosition(x, y) {
        if (this.x !== x || this.y !== y) {
            this.x = x;
            this.y = y;
            this._invalidateTransform();
            this.emit('transform', { type: 'position' });
        }
    }
    
    /**
     * Translate by offset
     * @param {number} dx 
     * @param {number} dy 
     */
    translate(dx, dy) {
        this.setPosition(this.x + dx, this.y + dy);
    }
    
    /**
     * Set rotation
     * @param {number} radians 
     */
    setRotation(radians) {
        if (this.rotation !== radians) {
            this.rotation = radians;
            this._invalidateTransform();
            this.emit('transform', { type: 'rotation' });
        }
    }
    
    /**
     * Rotate by angle
     * @param {number} radians 
     */
    rotate(radians) {
        this.setRotation(this.rotation + radians);
    }
    
    /**
     * Set scale
     * @param {number} sx 
     * @param {number} [sy] 
     */
    setScale(sx, sy = sx) {
        if (this.scaleX !== sx || this.scaleY !== sy) {
            this.scaleX = sx;
            this.scaleY = sy;
            this._invalidateTransform();
            this.emit('transform', { type: 'scale' });
        }
    }
    
    /**
     * Scale by factor
     * @param {number} sx 
     * @param {number} [sy] 
     */
    scale(sx, sy = sx) {
        this.setScale(this.scaleX * sx, this.scaleY * sy);
    }
    
    /**
     * Get world position
     * @returns {Vector2D}
     */
    getWorldPosition() {
        const transform = this.getWorldTransform();
        return new Vector2D(transform.tx, transform.ty);
    }
    
    /**
     * Set world position
     * @param {number} x 
     * @param {number} y 
     */
    setWorldPosition(x, y) {
        if (this.parent) {
            const parentInverse = this.parent.getWorldTransform().inverse();
            const local = parentInverse.transformPoint({ x, y });
            this.setPosition(local.x, local.y);
        } else {
            this.setPosition(x, y);
        }
    }
    
    /**
     * Convert local point to world
     * @param {number} x 
     * @param {number} y 
     * @returns {Vector2D}
     */
    localToWorld(x, y) {
        const point = this.getWorldTransform().transformPoint({ x, y });
        return new Vector2D(point.x, point.y);
    }
    
    /**
     * Convert world point to local
     * @param {number} x 
     * @param {number} y 
     * @returns {Vector2D}
     */
    worldToLocal(x, y) {
        const inverse = this.getWorldTransform().inverse();
        const point = inverse.transformPoint({ x, y });
        return new Vector2D(point.x, point.y);
    }
    
    /**
     * Invalidate transform (mark as dirty)
     * @protected
     */
    _invalidateTransform() {
        this._transformDirty = true;
        this._localTransform = null;
        this._worldTransform = null;
        this._invalidateBounds();
        
        // Invalidate children
        for (const child of this.children) {
            child._invalidateTransform();
        }
    }
    
    // ==========================================
    // BOUNDS
    // ==========================================
    
    /**
     * Get local bounds (override in subclasses)
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}|null}
     */
    getLocalBounds() {
        // Base implementation returns bounds encompassing children
        if (this.children.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const child of this.children) {
            const childBounds = child.getBounds();
            if (childBounds) {
                // Transform child bounds to local space
                const localBounds = this._transformBoundsToLocal(childBounds, child);
                minX = Math.min(minX, localBounds.minX);
                minY = Math.min(minY, localBounds.minY);
                maxX = Math.max(maxX, localBounds.maxX);
                maxY = Math.max(maxY, localBounds.maxY);
            }
        }
        
        if (!isFinite(minX)) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Get world bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}|null}
     */
    getBounds() {
        if (this._boundsDirty || !this._bounds) {
            const localBounds = this.getLocalBounds();
            if (!localBounds) {
                this._bounds = null;
            } else {
                this._bounds = this._transformBoundsToWorld(localBounds);
            }
            this._boundsDirty = false;
        }
        return this._bounds;
    }
    
    /**
     * Transform bounds to world space
     * @private
     */
    _transformBoundsToWorld(bounds) {
        const transform = this.getWorldTransform();
        
        // Transform all four corners
        const corners = [
            transform.transformPoint({ x: bounds.minX, y: bounds.minY }),
            transform.transformPoint({ x: bounds.maxX, y: bounds.minY }),
            transform.transformPoint({ x: bounds.minX, y: bounds.maxY }),
            transform.transformPoint({ x: bounds.maxX, y: bounds.maxY })
        ];
        
        // Find axis-aligned bounding box
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const corner of corners) {
            minX = Math.min(minX, corner.x);
            minY = Math.min(minY, corner.y);
            maxX = Math.max(maxX, corner.x);
            maxY = Math.max(maxY, corner.y);
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Transform bounds from child to local space
     * @private
     */
    _transformBoundsToLocal(bounds, child) {
        const transform = child.getLocalTransform();
        
        const corners = [
            transform.transformPoint({ x: bounds.minX, y: bounds.minY }),
            transform.transformPoint({ x: bounds.maxX, y: bounds.minY }),
            transform.transformPoint({ x: bounds.minX, y: bounds.maxY }),
            transform.transformPoint({ x: bounds.maxX, y: bounds.maxY })
        ];
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const corner of corners) {
            minX = Math.min(minX, corner.x);
            minY = Math.min(minY, corner.y);
            maxX = Math.max(maxX, corner.x);
            maxY = Math.max(maxY, corner.y);
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Invalidate bounds
     * @protected
     */
    _invalidateBounds() {
        this._boundsDirty = true;
        this._bounds = null;
        
        // Propagate to parent
        if (this.parent) {
            this.parent._invalidateBounds();
        }
    }
    
    /**
     * Check if bounds contain point
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    containsPoint(x, y) {
        const bounds = this.getBounds();
        if (!bounds) return false;
        
        return x >= bounds.minX && x <= bounds.maxX &&
               y >= bounds.minY && y <= bounds.maxY;
    }
    
    /**
     * Check if bounds intersect with another bounds
     * @param {object} otherBounds 
     * @returns {boolean}
     */
    intersectsBounds(otherBounds) {
        const bounds = this.getBounds();
        if (!bounds) return false;
        
        return Geometry.boundsIntersect(bounds, otherBounds);
    }
    
    // ==========================================
    // HIT TESTING
    // ==========================================
    
    /**
     * Hit test at point (override in subclasses for precise testing)
     * @param {number} x - World X
     * @param {number} y - World Y
     * @returns {boolean}
     */
    hitTest(x, y) {
        if (!this.visible || !this.selectable) return false;
        return this.containsPoint(x, y);
    }
    
    /**
     * Hit test recursively (returns deepest hit node)
     * @param {number} x 
     * @param {number} y 
     * @returns {SceneNode|null}
     */
    hitTestRecursive(x, y) {
        if (!this.visible) return null;
        
        // Test children first (back to front, reverse order)
        for (let i = this.children.length - 1; i >= 0; i--) {
            const hit = this.children[i].hitTestRecursive(x, y);
            if (hit) return hit;
        }
        
        // Test self
        if (this.selectable && this.hitTest(x, y)) {
            return this;
        }
        
        return null;
    }
    
    // ==========================================
    // TRAVERSAL
    // ==========================================
    
    /**
     * Traverse all descendants
     * @param {function} callback - (node, depth) => void
     * @param {number} [depth=0]
     */
    traverse(callback, depth = 0) {
        callback(this, depth);
        for (const child of this.children) {
            child.traverse(callback, depth + 1);
        }
    }
    
    /**
     * Traverse visible nodes only
     * @param {function} callback 
     * @param {number} [depth=0]
     */
    traverseVisible(callback, depth = 0) {
        if (!this.visible) return;
        callback(this, depth);
        for (const child of this.children) {
            child.traverseVisible(callback, depth + 1);
        }
    }
    
    /**
     * Find nodes matching predicate
     * @param {function} predicate - (node) => boolean
     * @returns {SceneNode[]}
     */
    find(predicate) {
        const results = [];
        this.traverse((node) => {
            if (predicate(node)) {
                results.push(node);
            }
        });
        return results;
    }
    
    /**
     * Find first node matching predicate
     * @param {function} predicate 
     * @returns {SceneNode|null}
     */
    findOne(predicate) {
        let result = null;
        this.traverse((node) => {
            if (!result && predicate(node)) {
                result = node;
            }
        });
        return result;
    }
    
    /**
     * Find node by ID (recursive)
     * @param {string} id 
     * @returns {SceneNode|null}
     */
    findById(id) {
        return this.findOne(node => node.id === id);
    }
    
    /**
     * Find nodes by tag
     * @param {string} tag 
     * @returns {SceneNode[]}
     */
    findByTag(tag) {
        return this.find(node => node.tags.includes(tag));
    }
    
    /**
     * Find nodes by type
     * @param {string} type 
     * @returns {SceneNode[]}
     */
    findByType(type) {
        return this.find(node => node.type === type);
    }
    
    /**
     * Get flattened list of all descendants
     * @returns {SceneNode[]}
     */
    flatten() {
        const result = [];
        this.traverse(node => result.push(node));
        return result;
    }
    
    // ==========================================
    // VISIBILITY & LOCKING
    // ==========================================
    
    /**
     * Set visibility
     * @param {boolean} visible 
     */
    setVisible(visible) {
        if (this.visible !== visible) {
            this.visible = visible;
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
            this.emit('lockchange', { locked });
        }
    }
    
    /**
     * Toggle locked
     */
    toggleLocked() {
        this.setLocked(!this.locked);
    }
    
    /**
     * Check if effectively visible (all ancestors visible)
     * @returns {boolean}
     */
    isEffectivelyVisible() {
        let current = this;
        while (current) {
            if (!current.visible) return false;
            current = current.parent;
        }
        return true;
    }
    
    /**
     * Check if effectively locked (any ancestor locked)
     * @returns {boolean}
     */
    isEffectivelyLocked() {
        let current = this;
        while (current) {
            if (current.locked) return true;
            current = current.parent;
        }
        return false;
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
            id: this.id,
            name: this.name,
            type: this.type,
            visible: this.visible,
            locked: this.locked,
            selectable: this.selectable,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            opacity: this.opacity,
            userData: this.userData,
            tags: [...this.tags],
            children: this.children.map(c => c.toJSON())
        };
    }
    
    /**
     * Create from JSON (override in subclasses)
     * @param {object} data 
     * @returns {SceneNode}
     */
    static fromJSON(data) {
        const node = new SceneNode({
            id: data.id,
            name: data.name,
            type: data.type,
            visible: data.visible,
            locked: data.locked,
            selectable: data.selectable,
            x: data.x,
            y: data.y,
            rotation: data.rotation,
            scaleX: data.scaleX,
            scaleY: data.scaleY,
            opacity: data.opacity,
            userData: data.userData,
            tags: data.tags
        });
        
        if (data.children) {
            for (const childData of data.children) {
                node.addChild(SceneNode.fromJSON(childData));
            }
        }
        
        return node;
    }
    
    /**
     * Clone node
     * @param {boolean} [deep=true] - Clone children
     * @returns {SceneNode}
     */
    clone(deep = true) {
        const cloned = new this.constructor({
            name: this.name + ' (copy)',
            type: this.type,
            visible: this.visible,
            locked: this.locked,
            selectable: this.selectable,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            opacity: this.opacity,
            userData: JSON.parse(JSON.stringify(this.userData)),
            tags: [...this.tags]
        });
        
        if (deep) {
            for (const child of this.children) {
                cloned.addChild(child.clone(true));
            }
        }
        
        return cloned;
    }
}

// ==========================================
// SCENE GRAPH
// ==========================================

/**
 * SceneGraph - Root container and manager for scene
 */
export class SceneGraph extends SceneNode {
    constructor(options = {}) {
        super({
            ...options,
            name: options.name || 'Scene',
            type: 'scene'
        });
        
        /** @type {Map<string, SceneNode>} Node index by ID */
        this._nodeIndex = new Map();
        this._nodeIndex.set(this.id, this);
        
        /** @type {SceneNode|null} Currently selected node */
        this._selection = null;
        
        /** @type {Set<SceneNode>} Multiple selection */
        this._multiSelection = new Set();
        
        /** @type {number} Background color */
        this.backgroundColor = options.backgroundColor || null;
    }
    
    // ==========================================
    // NODE INDEX
    // ==========================================
    
    /**
     * Register node in index
     * @param {SceneNode} node 
     */
    registerNode(node) {
        this._nodeIndex.set(node.id, node);
        
        // Register children
        for (const child of node.children) {
            this.registerNode(child);
        }
    }
    
    /**
     * Unregister node from index
     * @param {SceneNode} node 
     */
    unregisterNode(node) {
        this._nodeIndex.delete(node.id);
        
        // Unregister children
        for (const child of node.children) {
            this.unregisterNode(child);
        }
    }
    
    /**
     * Get node by ID
     * @param {string} id 
     * @returns {SceneNode|null}
     */
    getNodeById(id) {
        return this._nodeIndex.get(id) || null;
    }
    
    /**
     * Get all nodes
     * @returns {SceneNode[]}
     */
    getAllNodes() {
        return [...this._nodeIndex.values()];
    }
    
    /**
     * Get node count
     * @returns {number}
     */
    getNodeCount() {
        return this._nodeIndex.size;
    }
    
    // ==========================================
    // OVERRIDES
    // ==========================================
    
    /**
     * Override addChild to register in index
     * @param {SceneNode} child 
     * @returns {SceneNode}
     */
    addChild(child) {
        super.addChild(child);
        this.registerNode(child);
        return child;
    }
    
    /**
     * Override removeChild to unregister from index
     * @param {SceneNode} child 
     * @returns {boolean}
     */
    removeChild(child) {
        const removed = super.removeChild(child);
        if (removed) {
            this.unregisterNode(child);
        }
        return removed;
    }
    
    /**
     * Add node to scene (convenience method)
     * @param {SceneNode} node 
     * @param {SceneNode} [parent] - Parent node (defaults to scene root)
     * @returns {SceneNode}
     */
    addNode(node, parent = null) {
        const targetParent = parent || this;
        return targetParent.addChild(node);
    }
    
    /**
     * Remove node from scene
     * @param {SceneNode|string} nodeOrId 
     * @returns {boolean}
     */
    removeNode(nodeOrId) {
        const node = typeof nodeOrId === 'string' 
            ? this.getNodeById(nodeOrId) 
            : nodeOrId;
        
        if (node && node.parent) {
            return node.parent.removeChild(node);
        }
        return false;
    }
    
    // ==========================================
    // SELECTION
    // ==========================================
    
    /**
     * Select a node
     * @param {SceneNode|string|null} nodeOrId 
     */
    select(nodeOrId) {
        const node = typeof nodeOrId === 'string'
            ? this.getNodeById(nodeOrId)
            : nodeOrId;
        
        if (this._selection !== node) {
            const previous = this._selection;
            this._selection = node;
            this._multiSelection.clear();
            
            if (node) {
                this._multiSelection.add(node);
            }
            
            this.emit('selectionchange', { 
                selection: node, 
                previous,
                multi: false
            });
        }
    }
    
    /**
     * Add to selection (multi-select)
     * @param {SceneNode|string} nodeOrId 
     */
    addToSelection(nodeOrId) {
        const node = typeof nodeOrId === 'string'
            ? this.getNodeById(nodeOrId)
            : nodeOrId;
        
        if (node && !this._multiSelection.has(node)) {
            this._multiSelection.add(node);
            this._selection = node;
            
            this.emit('selectionchange', {
                selection: node,
                multi: true,
                multiSelection: [...this._multiSelection]
            });
        }
    }
    
    /**
     * Remove from selection
     * @param {SceneNode|string} nodeOrId 
     */
    removeFromSelection(nodeOrId) {
        const node = typeof nodeOrId === 'string'
            ? this.getNodeById(nodeOrId)
            : nodeOrId;
        
        if (node && this._multiSelection.has(node)) {
            this._multiSelection.delete(node);
            
            if (this._selection === node) {
                this._selection = this._multiSelection.size > 0
                    ? [...this._multiSelection][0]
                    : null;
            }
            
            this.emit('selectionchange', {
                selection: this._selection,
                multi: true,
                multiSelection: [...this._multiSelection]
            });
        }
    }
    
    /**
     * Toggle selection
     * @param {SceneNode|string} nodeOrId 
     */
    toggleSelection(nodeOrId) {
        const node = typeof nodeOrId === 'string'
            ? this.getNodeById(nodeOrId)
            : nodeOrId;
        
        if (node) {
            if (this._multiSelection.has(node)) {
                this.removeFromSelection(node);
            } else {
                this.addToSelection(node);
            }
        }
    }
    
    /**
     * Clear selection
     */
    clearSelection() {
        if (this._selection || this._multiSelection.size > 0) {
            const previous = this._selection;
            this._selection = null;
            this._multiSelection.clear();
            
            this.emit('selectionchange', {
                selection: null,
                previous,
                multi: false
            });
        }
    }
    
    /**
     * Get current selection
     * @returns {SceneNode|null}
     */
    getSelection() {
        return this._selection;
    }
    
    /**
     * Get multi-selection
     * @returns {SceneNode[]}
     */
    getMultiSelection() {
        return [...this._multiSelection];
    }
    
    /**
     * Check if node is selected
     * @param {SceneNode|string} nodeOrId 
     * @returns {boolean}
     */
    isSelected(nodeOrId) {
        const node = typeof nodeOrId === 'string'
            ? this.getNodeById(nodeOrId)
            : nodeOrId;
        
        return node ? this._multiSelection.has(node) : false;
    }
    
    /**
     * Select all selectable nodes
     */
    selectAll() {
        this._multiSelection.clear();
        
        this.traverse(node => {
            if (node !== this && node.selectable && node.visible && !node.locked) {
                this._multiSelection.add(node);
            }
        });
        
        this._selection = this._multiSelection.size > 0
            ? [...this._multiSelection][0]
            : null;
        
        this.emit('selectionchange', {
            selection: this._selection,
            multi: true,
            multiSelection: [...this._multiSelection]
        });
    }
    
    // ==========================================
    // QUERY
    // ==========================================
    
    /**
     * Hit test at point
     * @param {number} x 
     * @param {number} y 
     * @returns {SceneNode|null}
     */
    hitTestAt(x, y) {
        return this.hitTestRecursive(x, y);
    }
    
    /**
     * Find nodes in bounds
     * @param {object} bounds - {minX, minY, maxX, maxY}
     * @returns {SceneNode[]}
     */
    findInBounds(bounds) {
        return this.find(node => {
            if (node === this) return false;
            return node.intersectsBounds(bounds);
        });
    }
    
    /**
     * Find visible nodes
     * @returns {SceneNode[]}
     */
    findVisible() {
        return this.find(node => node !== this && node.isEffectivelyVisible());
    }
    
    /**
     * Find selectable nodes
     * @returns {SceneNode[]}
     */
    findSelectable() {
        return this.find(node => 
            node !== this && 
            node.selectable && 
            node.isEffectivelyVisible() && 
            !node.isEffectivelyLocked()
        );
    }
    
    // ==========================================
    // SERIALIZATION
    // ==========================================
    
    /**
     * Serialize scene
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            backgroundColor: this.backgroundColor,
            selection: this._selection?.id || null,
            multiSelection: [...this._multiSelection].map(n => n.id)
        };
    }
    
    /**
     * Create scene from JSON
     * @param {object} data 
     * @returns {SceneGraph}
     */
    static fromJSON(data) {
        const scene = new SceneGraph({
            id: data.id,
            name: data.name,
            backgroundColor: data.backgroundColor,
            userData: data.userData,
            tags: data.tags
        });
        
        // Add children
        if (data.children) {
            for (const childData of data.children) {
                scene.addChild(SceneNode.fromJSON(childData));
            }
        }
        
        // Restore selection
        if (data.selection) {
            scene.select(data.selection);
        }
        
        if (data.multiSelection) {
            for (const id of data.multiSelection) {
                scene.addToSelection(id);
            }
        }
        
        return scene;
    }
    
    /**
     * Clear scene
     */
    clear() {
        // Remove all children
        while (this.children.length > 0) {
            this.removeChild(this.children[0]);
        }
        
        this.clearSelection();
        this.emit('clear');
    }
}

// ==========================================
// GROUP NODE
// ==========================================

/**
 * GroupNode - Container for grouping nodes
 */
export class GroupNode extends SceneNode {
    constructor(options = {}) {
        super({
            ...options,
            type: 'group'
        });
    }
    
    /**
     * Ungroup - move children to parent
     * @returns {SceneNode[]}
     */
    ungroup() {
        if (!this.parent) return [];
        
        const children = [...this.children];
        const parent = this.parent;
        const index = parent.getChildIndex(this);
        
        // Move each child to parent
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            
            // Apply group transform to child
            const worldPos = child.getWorldPosition();
            
            this.removeChild(child);
            parent.addChild(child);
            parent.setChildIndex(child, index + i);
            
            child.setWorldPosition(worldPos.x, worldPos.y);
        }
        
        // Remove empty group
        parent.removeChild(this);
        
        return children;
    }
    
    /**
     * Create group from JSON
     * @param {object} data 
     * @returns {GroupNode}
     */
    static fromJSON(data) {
        const group = new GroupNode({
            id: data.id,
            name: data.name,
            visible: data.visible,
            locked: data.locked,
            x: data.x,
            y: data.y,
            rotation: data.rotation,
            scaleX: data.scaleX,
            scaleY: data.scaleY,
            opacity: data.opacity,
            userData: data.userData,
            tags: data.tags
        });
        
        if (data.children) {
            for (const childData of data.children) {
                group.addChild(SceneNode.fromJSON(childData));
            }
        }
        
        return group;
    }
}

export default {
    SceneNode,
    SceneGraph,
    GroupNode
};
