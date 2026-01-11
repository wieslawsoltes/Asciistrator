/**
 * Asciistrator - Base Object Classes
 * 
 * Abstract base classes for all drawable scene objects.
 */

import { Vector2D } from '../core/math/vector2d.js';
import { Matrix3x3 } from '../core/math/matrix3x3.js';
import { Geometry } from '../core/math/geometry.js';
import { EventEmitter } from '../utils/events.js';

// ==========================================
// SCENE OBJECT
// ==========================================

/**
 * SceneObject - Abstract base class for all drawable objects
 */
export class SceneObject extends EventEmitter {
    /**
     * Create a scene object
     * @param {object} [options]
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Unique identifier */
        this.id = options.id || `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        
        /** @type {string} Object name */
        this.name = options.name || 'Object';
        
        /** @type {string} Object type */
        this.type = 'object';
        
        /** @type {SceneObject|null} Parent object (group) */
        this.parent = null;
        
        /** @type {boolean} Visibility */
        this.visible = options.visible !== false;
        
        /** @type {boolean} Locked state */
        this.locked = options.locked || false;
        
        /** @type {boolean} Selectability */
        this.selectable = options.selectable !== false;
        
        // Transform properties
        /** @type {number} X position */
        this._x = options.x || 0;
        
        /** @type {number} Y position */
        this._y = options.y || 0;
        
        /** @type {number} Rotation in radians */
        this._rotation = options.rotation || 0;
        
        /** @type {number} Scale X */
        this._scaleX = options.scaleX !== undefined ? options.scaleX : 1;
        
        /** @type {number} Scale Y */
        this._scaleY = options.scaleY !== undefined ? options.scaleY : 1;
        
        /** @type {number} Skew X */
        this._skewX = options.skewX || 0;
        
        /** @type {number} Skew Y */
        this._skewY = options.skewY || 0;
        
        /** @type {{x: number, y: number}} Transform origin (0-1 relative to bounds) */
        this._origin = options.origin || { x: 0.5, y: 0.5 };
        
        /** @type {number} Opacity (0-1) */
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        
        /** @type {string} Blend mode */
        this.blendMode = options.blendMode || 'normal';
        
        /** @type {Style} Object style */
        this.style = options.style || new Style();
        
        // Cached values
        /** @type {Matrix3x3|null} */
        this._transform = null;
        
        /** @type {Matrix3x3|null} */
        this._worldTransform = null;
        
        /** @type {boolean} */
        this._transformDirty = true;
        
        /** @type {{minX: number, minY: number, maxX: number, maxY: number}|null} */
        this._bounds = null;
        
        /** @type {boolean} */
        this._boundsDirty = true;
        
        /** @type {boolean} */
        this._geometryDirty = true;
        
        /** @type {object} Custom user data */
        this.userData = options.userData || {};
        
        /** @type {string[]} Tags for organization */
        this.tags = options.tags || [];
    }
    
    // ==========================================
    // POSITION PROPERTIES
    // ==========================================
    
    get x() { return this._x; }
    set x(value) {
        if (this._x !== value) {
            this._x = value;
            this._invalidateTransform();
        }
    }
    
    get y() { return this._y; }
    set y(value) {
        if (this._y !== value) {
            this._y = value;
            this._invalidateTransform();
        }
    }
    
    get rotation() { return this._rotation; }
    set rotation(value) {
        if (this._rotation !== value) {
            this._rotation = value;
            this._invalidateTransform();
        }
    }
    
    get scaleX() { return this._scaleX; }
    set scaleX(value) {
        if (this._scaleX !== value) {
            this._scaleX = value;
            this._invalidateTransform();
        }
    }
    
    get scaleY() { return this._scaleY; }
    set scaleY(value) {
        if (this._scaleY !== value) {
            this._scaleY = value;
            this._invalidateTransform();
        }
    }
    
    get skewX() { return this._skewX; }
    set skewX(value) {
        if (this._skewX !== value) {
            this._skewX = value;
            this._invalidateTransform();
        }
    }
    
    get skewY() { return this._skewY; }
    set skewY(value) {
        if (this._skewY !== value) {
            this._skewY = value;
            this._invalidateTransform();
        }
    }
    
    get origin() { return this._origin; }
    set origin(value) {
        this._origin = value;
        this._invalidateTransform();
    }
    
    // ==========================================
    // POSITION METHODS
    // ==========================================
    
    /**
     * Set position
     * @param {number} x 
     * @param {number} y 
     */
    setPosition(x, y) {
        if (this._x !== x || this._y !== y) {
            this._x = x;
            this._y = y;
            this._invalidateTransform();
            this.emit('move', { x, y });
        }
    }
    
    /**
     * Get position as vector
     * @returns {Vector2D}
     */
    getPosition() {
        return new Vector2D(this._x, this._y);
    }
    
    /**
     * Translate by offset
     * @param {number} dx 
     * @param {number} dy 
     */
    translate(dx, dy) {
        this.setPosition(this._x + dx, this._y + dy);
    }
    
    /**
     * Set rotation
     * @param {number} radians 
     * @param {number} [cx] - Center X
     * @param {number} [cy] - Center Y
     */
    setRotation(radians, cx, cy) {
        if (cx !== undefined && cy !== undefined) {
            // Rotate around specific point
            const cos = Math.cos(radians - this._rotation);
            const sin = Math.sin(radians - this._rotation);
            
            const dx = this._x - cx;
            const dy = this._y - cy;
            
            this._x = cx + dx * cos - dy * sin;
            this._y = cy + dx * sin + dy * cos;
        }
        
        this._rotation = radians;
        this._invalidateTransform();
        this.emit('rotate', { rotation: radians });
    }
    
    /**
     * Rotate by angle
     * @param {number} radians 
     * @param {number} [cx] - Center X
     * @param {number} [cy] - Center Y
     */
    rotate(radians, cx, cy) {
        this.setRotation(this._rotation + radians, cx, cy);
    }
    
    /**
     * Set scale
     * @param {number} sx 
     * @param {number} [sy] 
     * @param {number} [cx] - Center X
     * @param {number} [cy] - Center Y
     */
    setScale(sx, sy = sx, cx, cy) {
        if (cx !== undefined && cy !== undefined) {
            // Scale around specific point
            const scaleFactorX = sx / this._scaleX;
            const scaleFactorY = sy / this._scaleY;
            
            this._x = cx + (this._x - cx) * scaleFactorX;
            this._y = cy + (this._y - cy) * scaleFactorY;
        }
        
        this._scaleX = sx;
        this._scaleY = sy;
        this._invalidateTransform();
        this.emit('scale', { scaleX: sx, scaleY: sy });
    }
    
    /**
     * Scale by factor
     * @param {number} sx 
     * @param {number} [sy] 
     * @param {number} [cx] 
     * @param {number} [cy] 
     */
    scale(sx, sy = sx, cx, cy) {
        this.setScale(this._scaleX * sx, this._scaleY * sy, cx, cy);
    }
    
    // ==========================================
    // TRANSFORM MATRIX
    // ==========================================
    
    /**
     * Get local transform matrix
     * @returns {Matrix3x3}
     */
    getTransform() {
        if (this._transformDirty || !this._transform) {
            this._transform = this._calculateTransform();
            this._transformDirty = false;
        }
        return this._transform;
    }
    
    /**
     * Calculate transform matrix
     * @protected
     * @returns {Matrix3x3}
     */
    _calculateTransform() {
        const bounds = this.getLocalBounds();
        const originX = bounds ? bounds.minX + (bounds.maxX - bounds.minX) * this._origin.x : 0;
        const originY = bounds ? bounds.minY + (bounds.maxY - bounds.minY) * this._origin.y : 0;
        
        // Build transform: translate to position, then apply rotation/scale around origin
        return Matrix3x3.identity()
            .translate(this._x, this._y)
            .translate(originX, originY)
            .rotate(this._rotation)
            .scale(this._scaleX, this._scaleY)
            .skew(this._skewX, this._skewY)
            .translate(-originX, -originY);
    }
    
    /**
     * Get world transform (includes parent transforms)
     * @returns {Matrix3x3}
     */
    getWorldTransform() {
        if (this._transformDirty || !this._worldTransform) {
            const local = this.getTransform();
            if (this.parent && this.parent.getWorldTransform) {
                this._worldTransform = this.parent.getWorldTransform().multiply(local);
            } else {
                this._worldTransform = local.clone();
            }
        }
        return this._worldTransform;
    }
    
    /**
     * Apply a transformation matrix
     * @param {Matrix3x3} matrix 
     */
    applyTransform(matrix) {
        // Decompose and apply
        const decomposed = matrix.decompose();
        this._x += decomposed.translateX;
        this._y += decomposed.translateY;
        this._rotation += decomposed.rotation;
        this._scaleX *= decomposed.scaleX;
        this._scaleY *= decomposed.scaleY;
        this._invalidateTransform();
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
     * Invalidate transform cache
     * @protected
     */
    _invalidateTransform() {
        this._transformDirty = true;
        this._transform = null;
        this._worldTransform = null;
        this._invalidateBounds();
        this.emit('transform');
    }
    
    // ==========================================
    // BOUNDS
    // ==========================================
    
    /**
     * Get local bounds (untransformed) - override in subclasses
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    /**
     * Get transformed bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getBounds() {
        if (this._boundsDirty || !this._bounds) {
            this._bounds = this._calculateBounds();
            this._boundsDirty = false;
        }
        return this._bounds;
    }
    
    /**
     * Calculate transformed bounds
     * @protected
     */
    _calculateBounds() {
        const local = this.getLocalBounds();
        const transform = this.getWorldTransform();
        
        // Transform all four corners
        const corners = [
            transform.transformPoint({ x: local.minX, y: local.minY }),
            transform.transformPoint({ x: local.maxX, y: local.minY }),
            transform.transformPoint({ x: local.minX, y: local.maxY }),
            transform.transformPoint({ x: local.maxX, y: local.maxY })
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
     * Get center point
     * @returns {Vector2D}
     */
    getCenter() {
        const bounds = this.getBounds();
        return new Vector2D(
            (bounds.minX + bounds.maxX) / 2,
            (bounds.minY + bounds.maxY) / 2
        );
    }
    
    /**
     * Get width
     * @returns {number}
     */
    getWidth() {
        const bounds = this.getBounds();
        return bounds.maxX - bounds.minX;
    }
    
    /**
     * Get height
     * @returns {number}
     */
    getHeight() {
        const bounds = this.getBounds();
        return bounds.maxY - bounds.minY;
    }
    
    /**
     * Invalidate bounds cache
     * @protected
     */
    _invalidateBounds() {
        this._boundsDirty = true;
        this._bounds = null;
        if (this.parent && this.parent._invalidateBounds) {
            this.parent._invalidateBounds();
        }
    }
    
    /**
     * Invalidate geometry (forces recalculation)
     * @protected
     */
    _invalidateGeometry() {
        this._geometryDirty = true;
        this._invalidateBounds();
    }
    
    // ==========================================
    // HIT TESTING
    // ==========================================
    
    /**
     * Test if point is inside object
     * @param {number} x - World X
     * @param {number} y - World Y
     * @returns {boolean}
     */
    hitTest(x, y) {
        if (!this.visible || !this.selectable) return false;
        
        // Quick bounds check first
        const bounds = this.getBounds();
        if (x < bounds.minX || x > bounds.maxX ||
            y < bounds.minY || y > bounds.maxY) {
            return false;
        }
        
        // Detailed hit test - override in subclasses
        return this._detailedHitTest(x, y);
    }
    
    /**
     * Detailed hit test - override in subclasses
     * @protected
     */
    _detailedHitTest(x, y) {
        // Default: bounds test only
        return true;
    }
    
    /**
     * Test if object intersects with rectangle
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     * @returns {boolean}
     */
    intersectsRect(minX, minY, maxX, maxY) {
        const bounds = this.getBounds();
        return Geometry.boundsIntersect(bounds, { minX, minY, maxX, maxY });
    }
    
    /**
     * Check if completely contained in rectangle
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     * @returns {boolean}
     */
    containedInRect(minX, minY, maxX, maxY) {
        const bounds = this.getBounds();
        return bounds.minX >= minX && bounds.maxX <= maxX &&
               bounds.minY >= minY && bounds.maxY <= maxY;
    }
    
    // ==========================================
    // VISIBILITY & STATE
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
     * Check if effectively visible
     * @returns {boolean}
     */
    isEffectivelyVisible() {
        if (!this.visible) return false;
        if (this.parent && this.parent.isEffectivelyVisible) {
            return this.parent.isEffectivelyVisible();
        }
        return true;
    }
    
    /**
     * Check if effectively locked
     * @returns {boolean}
     */
    isEffectivelyLocked() {
        if (this.locked) return true;
        if (this.parent && this.parent.isEffectivelyLocked) {
            return this.parent.isEffectivelyLocked();
        }
        return false;
    }
    
    // ==========================================
    // RENDERING
    // ==========================================
    
    /**
     * Render object to ASCII buffer - override in subclasses
     * @param {object} context - Render context
     */
    render(context) {
        // Override in subclasses
    }
    
    /**
     * Get ASCII representation - override in subclasses
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        return [];
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
            x: this._x,
            y: this._y,
            rotation: this._rotation,
            scaleX: this._scaleX,
            scaleY: this._scaleY,
            skewX: this._skewX,
            skewY: this._skewY,
            origin: { ...this._origin },
            opacity: this.opacity,
            blendMode: this.blendMode,
            style: this.style.toJSON(),
            userData: this.userData,
            tags: [...this.tags]
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        this.id = data.id;
        this.name = data.name;
        this.visible = data.visible !== false;
        this.locked = data.locked || false;
        this.selectable = data.selectable !== false;
        this._x = data.x || 0;
        this._y = data.y || 0;
        this._rotation = data.rotation || 0;
        this._scaleX = data.scaleX !== undefined ? data.scaleX : 1;
        this._scaleY = data.scaleY !== undefined ? data.scaleY : 1;
        this._skewX = data.skewX || 0;
        this._skewY = data.skewY || 0;
        this._origin = data.origin || { x: 0.5, y: 0.5 };
        this.opacity = data.opacity !== undefined ? data.opacity : 1;
        this.blendMode = data.blendMode || 'normal';
        
        if (data.style) {
            this.style.fromJSON(data.style);
        }
        
        this.userData = data.userData || {};
        this.tags = data.tags || [];
        
        this._invalidateTransform();
    }
    
    /**
     * Clone object
     * @returns {SceneObject}
     */
    clone() {
        const cloned = new this.constructor();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
}

// ==========================================
// STYLE
// ==========================================

/**
 * Style - Visual styling for objects
 */
export class Style {
    constructor(options = {}) {
        // Stroke properties
        /** @type {boolean} */
        this.stroke = options.stroke !== false;
        
        /** @type {string} */
        this.strokeColor = options.strokeColor || '#ffffff';
        
        /** @type {number} */
        this.strokeWidth = options.strokeWidth || 1;
        
        /** @type {string} Single line, double line, etc. */
        this.strokeStyle = options.strokeStyle || 'single';
        
        /** @type {string} Dash pattern */
        this.strokeDash = options.strokeDash || 'solid';
        
        /** @type {string} Line cap: 'butt', 'round', 'square' */
        this.strokeCap = options.strokeCap || 'butt';
        
        /** @type {string} Line join: 'miter', 'round', 'bevel' */
        this.strokeJoin = options.strokeJoin || 'miter';
        
        // Fill properties
        /** @type {boolean} */
        this.fill = options.fill !== undefined ? options.fill : false;
        
        /** @type {string} */
        this.fillColor = options.fillColor || '#ffffff';
        
        /** @type {string} Fill character */
        this.fillChar = options.fillChar || '█';
        
        /** @type {string} Fill pattern: 'solid', 'light', 'medium', 'dark', 'pattern' */
        this.fillPattern = options.fillPattern || 'solid';
        
        /** @type {string} Custom pattern string */
        this.fillPatternChars = options.fillPatternChars || '░▒▓█';
        
        // Character properties
        /** @type {string} Character set: 'unicode', 'ascii', 'custom' */
        this.charSet = options.charSet || 'unicode';
        
        /** @type {object} Character mapping for different angles/purposes */
        this.charMap = options.charMap || {
            horizontal: '─',
            vertical: '│',
            cornerTL: '┌',
            cornerTR: '┐',
            cornerBL: '└',
            cornerBR: '┘',
            teeLeft: '├',
            teeRight: '┤',
            teeUp: '┬',
            teeDown: '┴',
            cross: '┼'
        };
        
        // Shadow
        /** @type {boolean} */
        this.shadow = options.shadow || false;
        
        /** @type {number} */
        this.shadowOffsetX = options.shadowOffsetX || 1;
        
        /** @type {number} */
        this.shadowOffsetY = options.shadowOffsetY || 1;
        
        /** @type {string} */
        this.shadowColor = options.shadowColor || '#333333';
        
        /** @type {string} */
        this.shadowChar = options.shadowChar || '░';
    }
    
    /**
     * Set stroke properties
     * @param {object} options 
     */
    setStroke(options) {
        if (options.enabled !== undefined) this.stroke = options.enabled;
        if (options.color !== undefined) this.strokeColor = options.color;
        if (options.width !== undefined) this.strokeWidth = options.width;
        if (options.style !== undefined) this.strokeStyle = options.style;
        if (options.dash !== undefined) this.strokeDash = options.dash;
    }
    
    /**
     * Set fill properties
     * @param {object} options 
     */
    setFill(options) {
        if (options.enabled !== undefined) this.fill = options.enabled;
        if (options.color !== undefined) this.fillColor = options.color;
        if (options.char !== undefined) this.fillChar = options.char;
        if (options.pattern !== undefined) this.fillPattern = options.pattern;
    }
    
    /**
     * Get line character based on style
     * @param {string} type - 'horizontal', 'vertical', etc.
     * @returns {string}
     */
    getLineChar(type) {
        const charMaps = {
            single: {
                horizontal: '─', vertical: '│',
                cornerTL: '┌', cornerTR: '┐', cornerBL: '└', cornerBR: '┘',
                teeLeft: '├', teeRight: '┤', teeUp: '┬', teeDown: '┴', cross: '┼'
            },
            double: {
                horizontal: '═', vertical: '║',
                cornerTL: '╔', cornerTR: '╗', cornerBL: '╚', cornerBR: '╝',
                teeLeft: '╠', teeRight: '╣', teeUp: '╦', teeDown: '╩', cross: '╬'
            },
            rounded: {
                horizontal: '─', vertical: '│',
                cornerTL: '╭', cornerTR: '╮', cornerBL: '╰', cornerBR: '╯',
                teeLeft: '├', teeRight: '┤', teeUp: '┬', teeDown: '┴', cross: '┼'
            },
            heavy: {
                horizontal: '━', vertical: '┃',
                cornerTL: '┏', cornerTR: '┓', cornerBL: '┗', cornerBR: '┛',
                teeLeft: '┣', teeRight: '┫', teeUp: '┳', teeDown: '┻', cross: '╋'
            },
            dashed: {
                horizontal: '┄', vertical: '┆',
                cornerTL: '┌', cornerTR: '┐', cornerBL: '└', cornerBR: '┘',
                teeLeft: '├', teeRight: '┤', teeUp: '┬', teeDown: '┴', cross: '┼'
            },
            ascii: {
                horizontal: '-', vertical: '|',
                cornerTL: '+', cornerTR: '+', cornerBL: '+', cornerBR: '+',
                teeLeft: '+', teeRight: '+', teeUp: '+', teeDown: '+', cross: '+'
            }
        };
        
        const map = charMaps[this.strokeStyle] || charMaps.single;
        return map[type] || this.charMap[type] || '?';
    }
    
    /**
     * Get fill character based on density
     * @param {number} density - 0-1
     * @returns {string}
     */
    getFillChar(density = 1) {
        if (this.fillPattern === 'solid') {
            return this.fillChar;
        }
        
        const patterns = {
            light: '░',
            medium: '▒',
            dark: '▓',
            solid: '█'
        };
        
        if (patterns[this.fillPattern]) {
            return patterns[this.fillPattern];
        }
        
        // Density-based selection from pattern chars
        const index = Math.floor(density * (this.fillPatternChars.length - 1));
        return this.fillPatternChars[index] || this.fillChar;
    }
    
    /**
     * Clone style
     * @returns {Style}
     */
    clone() {
        const cloned = new Style();
        cloned.fromJSON(this.toJSON());
        return cloned;
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            stroke: this.stroke,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            strokeStyle: this.strokeStyle,
            strokeDash: this.strokeDash,
            strokeCap: this.strokeCap,
            strokeJoin: this.strokeJoin,
            fill: this.fill,
            fillColor: this.fillColor,
            fillChar: this.fillChar,
            fillPattern: this.fillPattern,
            fillPatternChars: this.fillPatternChars,
            charSet: this.charSet,
            charMap: { ...this.charMap },
            shadow: this.shadow,
            shadowOffsetX: this.shadowOffsetX,
            shadowOffsetY: this.shadowOffsetY,
            shadowColor: this.shadowColor,
            shadowChar: this.shadowChar
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        Object.assign(this, data);
        if (data.charMap) {
            this.charMap = { ...data.charMap };
        }
    }
}

// ==========================================
// PREDEFINED STYLES
// ==========================================

export const Styles = {
    /** Single line box */
    SINGLE: () => new Style({ strokeStyle: 'single' }),
    
    /** Double line box */
    DOUBLE: () => new Style({ strokeStyle: 'double' }),
    
    /** Rounded corners */
    ROUNDED: () => new Style({ strokeStyle: 'rounded' }),
    
    /** Heavy/bold lines */
    HEAVY: () => new Style({ strokeStyle: 'heavy' }),
    
    /** Dashed lines */
    DASHED: () => new Style({ strokeStyle: 'dashed' }),
    
    /** ASCII only (no unicode) */
    ASCII: () => new Style({ strokeStyle: 'ascii', charSet: 'ascii' }),
    
    /** Filled shape */
    FILLED: () => new Style({ stroke: false, fill: true, fillChar: '█' }),
    
    /** Light shade fill */
    LIGHT_FILL: () => new Style({ stroke: false, fill: true, fillPattern: 'light' }),
    
    /** Medium shade fill */
    MEDIUM_FILL: () => new Style({ stroke: false, fill: true, fillPattern: 'medium' }),
    
    /** Dark shade fill */
    DARK_FILL: () => new Style({ stroke: false, fill: true, fillPattern: 'dark' })
};

export default {
    SceneObject,
    Style,
    Styles
};
