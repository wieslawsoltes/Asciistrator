/**
 * Asciistrator - Clipping Masks
 * 
 * Clip rendering of objects to specific regions.
 * Supports shape-based masks and rectangular clips.
 */

/**
 * Clipping region - defines an area where rendering is allowed
 */
export class ClipRegion {
    /**
     * @param {object} options
     */
    constructor(options = {}) {
        this.type = options.type || 'rectangle';
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.points = options.points || null; // For polygon clips
        this.shape = options.shape || null;   // Reference to a shape object
        this.invert = options.invert || false; // If true, clip outside the region
    }

    /**
     * Check if a point is inside the clip region
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    containsPoint(x, y) {
        let inside;
        
        switch (this.type) {
            case 'rectangle':
                inside = x >= this.x && x < this.x + this.width &&
                         y >= this.y && y < this.y + this.height;
                break;
                
            case 'ellipse':
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                const rx = this.width / 2;
                const ry = this.height / 2;
                const dx = (x - cx) / rx;
                const dy = (y - cy) / ry;
                inside = dx * dx + dy * dy <= 1;
                break;
                
            case 'polygon':
                inside = this._pointInPolygon(x, y);
                break;
                
            case 'shape':
                inside = this.shape && this.shape.containsPoint 
                    ? this.shape.containsPoint(x, y) 
                    : false;
                break;
                
            default:
                inside = true;
        }
        
        return this.invert ? !inside : inside;
    }

    /**
     * Point-in-polygon test
     * @private
     */
    _pointInPolygon(x, y) {
        if (!this.points || this.points.length < 3) return false;
        
        let inside = false;
        const n = this.points.length;
        
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = this.points[i].x, yi = this.points[i].y;
            const xj = this.points[j].x, yj = this.points[j].y;
            
            if (((yi > y) !== (yj > y)) && 
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    /**
     * Get bounding box of the clip region
     * @returns {object}
     */
    getBounds() {
        if (this.type === 'polygon' && this.points) {
            const xs = this.points.map(p => p.x);
            const ys = this.points.map(p => p.y);
            return {
                x: Math.min(...xs),
                y: Math.min(...ys),
                width: Math.max(...xs) - Math.min(...xs),
                height: Math.max(...ys) - Math.min(...ys)
            };
        }
        
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Create a rectangular clip region
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @returns {ClipRegion}
     */
    static rect(x, y, width, height) {
        return new ClipRegion({ type: 'rectangle', x, y, width, height });
    }

    /**
     * Create an elliptical clip region
     * @param {number} x - Bounding box X
     * @param {number} y - Bounding box Y
     * @param {number} width 
     * @param {number} height 
     * @returns {ClipRegion}
     */
    static ellipse(x, y, width, height) {
        return new ClipRegion({ type: 'ellipse', x, y, width, height });
    }

    /**
     * Create a polygon clip region
     * @param {Array<{x: number, y: number}>} points 
     * @returns {ClipRegion}
     */
    static polygon(points) {
        return new ClipRegion({ type: 'polygon', points });
    }

    /**
     * Create a clip region from a shape object
     * @param {object} shape - Shape with containsPoint method
     * @returns {ClipRegion}
     */
    static fromShape(shape) {
        return new ClipRegion({ type: 'shape', shape });
    }
}

/**
 * Clipping Mask - applies clipping to rendering operations
 */
export class ClippingMask {
    /**
     * @param {ClipRegion|ClipRegion[]} regions - One or more clip regions
     * @param {string} mode - 'all' (AND) or 'any' (OR)
     */
    constructor(regions = [], mode = 'all') {
        this.regions = Array.isArray(regions) ? regions : [regions];
        this.mode = mode; // 'all' = point must be in all regions, 'any' = point must be in at least one
        this.enabled = true;
    }

    /**
     * Add a clip region
     * @param {ClipRegion} region 
     */
    addRegion(region) {
        this.regions.push(region);
        return this;
    }

    /**
     * Remove a clip region by index
     * @param {number} index 
     */
    removeRegion(index) {
        this.regions.splice(index, 1);
        return this;
    }

    /**
     * Clear all regions
     */
    clear() {
        this.regions = [];
        return this;
    }

    /**
     * Check if a point is visible (inside clip regions)
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isVisible(x, y) {
        if (!this.enabled || this.regions.length === 0) {
            return true;
        }

        if (this.mode === 'all') {
            return this.regions.every(r => r.containsPoint(x, y));
        } else {
            return this.regions.some(r => r.containsPoint(x, y));
        }
    }

    /**
     * Get combined bounding box of all regions
     * @returns {object}
     */
    getBounds() {
        if (this.regions.length === 0) {
            return { x: 0, y: 0, width: Infinity, height: Infinity };
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const region of this.regions) {
            const bounds = region.getBounds();
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}

/**
 * Clipped Buffer - wraps an ASCII buffer with clipping support
 */
export class ClippedBuffer {
    /**
     * @param {object} buffer - Original ASCII buffer
     * @param {ClippingMask} mask - Clipping mask
     */
    constructor(buffer, mask) {
        this.buffer = buffer;
        this.mask = mask;
    }

    /**
     * Set character with clipping
     * @param {number} x 
     * @param {number} y 
     * @param {string} char 
     * @param {string} color 
     */
    setChar(x, y, char, color = null) {
        if (this.mask.isVisible(x, y)) {
            this.buffer.setChar(x, y, char, color);
        }
    }

    /**
     * Get character (passthrough)
     */
    getChar(x, y) {
        return this.buffer.getChar(x, y);
    }

    /**
     * Get color (passthrough)
     */
    getColor(x, y) {
        return this.buffer.getColor(x, y);
    }

    /**
     * Get buffer width
     */
    get width() {
        return this.buffer.width;
    }

    /**
     * Get buffer height
     */
    get height() {
        return this.buffer.height;
    }

    /**
     * Clear buffer (passthrough)
     */
    clear() {
        this.buffer.clear();
    }
}

/**
 * Clipping context - manages clipping state for rendering
 */
export class ClippingContext {
    constructor() {
        this.maskStack = [];
        this.currentMask = null;
    }

    /**
     * Push a new clipping mask onto the stack
     * @param {ClippingMask} mask 
     */
    push(mask) {
        if (this.currentMask) {
            this.maskStack.push(this.currentMask);
        }
        this.currentMask = mask;
    }

    /**
     * Pop the current clipping mask
     * @returns {ClippingMask|null}
     */
    pop() {
        const popped = this.currentMask;
        this.currentMask = this.maskStack.pop() || null;
        return popped;
    }

    /**
     * Check if a point is visible in the current clipping context
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isVisible(x, y) {
        if (!this.currentMask) return true;
        
        // Check current mask
        if (!this.currentMask.isVisible(x, y)) return false;
        
        // Check all masks in stack (they should all pass)
        for (const mask of this.maskStack) {
            if (!mask.isVisible(x, y)) return false;
        }
        
        return true;
    }

    /**
     * Create a clipped buffer for rendering
     * @param {object} buffer 
     * @returns {ClippedBuffer|object}
     */
    wrapBuffer(buffer) {
        if (!this.currentMask) return buffer;
        
        // Create a composite mask from all active masks
        const compositeMask = new ClippingMask([], 'all');
        
        for (const mask of this.maskStack) {
            for (const region of mask.regions) {
                compositeMask.addRegion(region);
            }
        }
        
        if (this.currentMask) {
            for (const region of this.currentMask.regions) {
                compositeMask.addRegion(region);
            }
        }
        
        return new ClippedBuffer(buffer, compositeMask);
    }

    /**
     * Reset clipping context
     */
    reset() {
        this.maskStack = [];
        this.currentMask = null;
    }
}

/**
 * Clipped Object - an object with clipping applied
 */
export class ClippedObject {
    /**
     * @param {object} object - Scene object to clip
     * @param {ClipRegion} clipRegion - Clipping region
     */
    constructor(object, clipRegion) {
        this.type = 'clipped-object';
        this.id = `clipped_${object.id || Date.now()}`;
        this.name = `Clipped ${object.name || 'Object'}`;
        this.object = object;
        this.clipRegion = clipRegion;
        this.visible = true;
    }

    getBounds() {
        // Intersection of object bounds and clip bounds
        const objBounds = this.object.getBounds();
        const clipBounds = this.clipRegion.getBounds();
        
        const minX = Math.max(objBounds.x, clipBounds.x);
        const minY = Math.max(objBounds.y, clipBounds.y);
        const maxX = Math.min(objBounds.x + objBounds.width, clipBounds.x + clipBounds.width);
        const maxY = Math.min(objBounds.y + objBounds.height, clipBounds.y + clipBounds.height);
        
        return {
            x: minX,
            y: minY,
            width: Math.max(0, maxX - minX),
            height: Math.max(0, maxY - minY)
        };
    }

    containsPoint(px, py) {
        return this.clipRegion.containsPoint(px, py) && 
               this.object.containsPoint && this.object.containsPoint(px, py);
    }

    render(buffer) {
        if (!this.visible) return;
        
        // Create a clipped buffer wrapper
        const mask = new ClippingMask([this.clipRegion]);
        const clippedBuffer = new ClippedBuffer(buffer, mask);
        
        // Render object to clipped buffer
        if (this.object.render) {
            this.object.render(clippedBuffer);
        }
    }

    toJSON() {
        return {
            type: this.type,
            id: this.id,
            name: this.name,
            object: this.object.toJSON ? this.object.toJSON() : this.object,
            clipRegion: {
                type: this.clipRegion.type,
                x: this.clipRegion.x,
                y: this.clipRegion.y,
                width: this.clipRegion.width,
                height: this.clipRegion.height,
                points: this.clipRegion.points,
                invert: this.clipRegion.invert
            },
            visible: this.visible
        };
    }
}

export default {
    ClipRegion,
    ClippingMask,
    ClippedBuffer,
    ClippingContext,
    ClippedObject
};
