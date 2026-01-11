/**
 * Asciistrator - Main Application Entry Point
 * 
 * ASCII Vector Graphics Editor
 * A powerful, state-of-the-art ASCII-based vector graphics engine and editor.
 * 
 * @version 0.1.0
 * @license MIT
 */

import { Vector2D } from './core/math/vector2d.js';
import { Matrix3x3 } from './core/math/matrix3x3.js';
import { QuadraticBezier, CubicBezier } from './core/math/bezier.js';
import { BoundingBox, LineSegment, Polygon, Circle, Ellipse } from './core/math/geometry.js';
import { DensityPalettes, BoxDrawing, getCharForDensity, getBoxChar } from './core/ascii/charsets.js';
import { 
    AsciiBuffer, 
    drawLine, 
    drawRect, 
    fillRect, 
    drawCircle, 
    fillCircle,
    drawPolygon,
    fillPolygon,
    floodFill 
} from './core/ascii/rasterizer.js';
import { ditherToAscii, bayerDither, floydSteinbergDither } from './core/ascii/dither.js';
import { EventEmitter, globalEventBus } from './utils/events.js';
import { $, $$, createElement, domReady, getMousePos, debounce, throttle } from './utils/dom.js';
import { clamp, uniqueId, uuid, deepClone, hexToRgb, rgbToHex } from './utils/helpers.js';
import { componentLibraryManager, Component, ComponentLibrary } from './components/ComponentLibrary.js';

// ==========================================
// SPATIAL INDEXING - QUADTREE
// ==========================================

/**
 * AABB (Axis-Aligned Bounding Box) for spatial queries
 */
class AABB {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }
    get right() { return this.x + this.width; }
    get bottom() { return this.y + this.height; }
    
    containsPoint(px, py) {
        return px >= this.x && px < this.right &&
               py >= this.y && py < this.bottom;
    }
    
    intersects(other) {
        return !(other.x >= this.right || other.right <= this.x ||
                 other.y >= this.bottom || other.bottom <= this.y);
    }
    
    contains(other) {
        return other.x >= this.x && other.right <= this.right &&
               other.y >= this.y && other.bottom <= this.bottom;
    }
}

/**
 * QuadTree for efficient spatial queries
 * Supports insert, remove, query by point, query by region
 */
class QuadTree {
    constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
        this.bounds = bounds;
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        this.objects = [];
        this.nodes = null; // Child quadrants [NW, NE, SW, SE]
    }
    
    /**
     * Clear the quadtree
     */
    clear() {
        this.objects = [];
        if (this.nodes) {
            for (const node of this.nodes) {
                node.clear();
            }
            this.nodes = null;
        }
    }
    
    /**
     * Split node into 4 quadrants
     */
    _split() {
        const x = this.bounds.x;
        const y = this.bounds.y;
        const hw = this.bounds.width / 2;
        const hh = this.bounds.height / 2;
        const nextLevel = this.level + 1;
        
        this.nodes = [
            new QuadTree(new AABB(x, y, hw, hh), this.maxObjects, this.maxLevels, nextLevel),       // NW
            new QuadTree(new AABB(x + hw, y, hw, hh), this.maxObjects, this.maxLevels, nextLevel),  // NE
            new QuadTree(new AABB(x, y + hh, hw, hh), this.maxObjects, this.maxLevels, nextLevel),  // SW
            new QuadTree(new AABB(x + hw, y + hh, hw, hh), this.maxObjects, this.maxLevels, nextLevel) // SE
        ];
    }
    
    /**
     * Get index of quadrant(s) that contain the bounds
     * Returns array of indices for objects spanning multiple quadrants
     */
    _getIndices(bounds) {
        const indices = [];
        const midX = this.bounds.x + this.bounds.width / 2;
        const midY = this.bounds.y + this.bounds.height / 2;
        
        const inNorth = bounds.y < midY;
        const inSouth = bounds.y + bounds.height > midY;
        const inWest = bounds.x < midX;
        const inEast = bounds.x + bounds.width > midX;
        
        if (inNorth && inWest) indices.push(0); // NW
        if (inNorth && inEast) indices.push(1); // NE
        if (inSouth && inWest) indices.push(2); // SW
        if (inSouth && inEast) indices.push(3); // SE
        
        return indices;
    }
    
    /**
     * Insert an object with its bounds
     */
    insert(obj, bounds) {
        // If we have child nodes, try to insert into them
        if (this.nodes) {
            const indices = this._getIndices(bounds);
            // If object fits entirely in one quadrant, insert there
            if (indices.length === 1) {
                this.nodes[indices[0]].insert(obj, bounds);
                return;
            }
        }
        
        // Store object at this level
        this.objects.push({ obj, bounds });
        
        // Split if needed and redistribute
        if (!this.nodes && this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            this._split();
            
            // Redistribute objects to children if they fit in one quadrant
            const remaining = [];
            for (const item of this.objects) {
                const indices = this._getIndices(item.bounds);
                if (indices.length === 1) {
                    this.nodes[indices[0]].insert(item.obj, item.bounds);
                } else {
                    remaining.push(item);
                }
            }
            this.objects = remaining;
        }
    }
    
    /**
     * Remove an object from the tree
     */
    remove(obj) {
        // Try to remove from this node's objects
        const idx = this.objects.findIndex(item => item.obj === obj || item.obj.id === obj.id);
        if (idx !== -1) {
            this.objects.splice(idx, 1);
            return true;
        }
        
        // Try child nodes
        if (this.nodes) {
            for (const node of this.nodes) {
                if (node.remove(obj)) return true;
            }
        }
        
        return false;
    }
    
    /**
     * Query objects at a point
     */
    queryPoint(x, y, results = []) {
        // Check if point is within this node's bounds
        if (!this.bounds.containsPoint(x, y)) {
            return results;
        }
        
        // Check objects at this level
        for (const item of this.objects) {
            if (item.bounds.containsPoint(x, y)) {
                results.push(item.obj);
            }
        }
        
        // Check child nodes
        if (this.nodes) {
            for (const node of this.nodes) {
                node.queryPoint(x, y, results);
            }
        }
        
        return results;
    }
    
    /**
     * Query objects in a region (AABB)
     */
    queryRegion(region, results = []) {
        // Check if region intersects this node
        if (!this.bounds.intersects(region)) {
            return results;
        }
        
        // Check objects at this level
        for (const item of this.objects) {
            if (item.bounds.intersects(region)) {
                results.push(item.obj);
            }
        }
        
        // Check child nodes
        if (this.nodes) {
            for (const node of this.nodes) {
                node.queryRegion(region, results);
            }
        }
        
        return results;
    }
    
    /**
     * Get all objects in the tree
     */
    getAllObjects(results = []) {
        for (const item of this.objects) {
            results.push(item.obj);
        }
        
        if (this.nodes) {
            for (const node of this.nodes) {
                node.getAllObjects(results);
            }
        }
        
        return results;
    }
}

// ==========================================
// SCENE OBJECT MODEL
// ==========================================

/**
 * Base class for all scene objects (vector objects)
 */
class SceneObject {
    constructor(type = 'object') {
        this.id = uuid();
        this.type = type;
        this.name = `${type}_${this.id.slice(0, 6)}`;
        
        // Transform
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        
        // Style
        this.strokeChar = '*';
        this.fillChar = '';
        this.strokeColor = null;
        this.fillColor = null;
        this.lineStyle = 'single';
        this.visible = true;
        this.locked = false;
        this.opacity = 1;
        
        // Layer reference
        this.layerId = null;
    }
    
    /**
     * Get bounding box
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * Check if point is inside this object
     * @param {number} px 
     * @param {number} py 
     * @returns {boolean}
     */
    containsPoint(px, py) {
        const b = this.getBounds();
        return px >= b.x && px < b.x + b.width &&
               py >= b.y && py < b.y + b.height;
    }
    
    /**
     * Render this object to a buffer
     * @param {AsciiBuffer} buffer 
     */
    render(buffer) {
        // Override in subclasses
    }
    
    /**
     * Clone this object
     * @returns {SceneObject}
     */
    clone() {
        const copy = new this.constructor();
        Object.assign(copy, deepClone(this));
        copy.id = uuid();
        return copy;
    }
    
    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rotation: this.rotation,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            strokeChar: this.strokeChar,
            fillChar: this.fillChar,
            strokeColor: this.strokeColor,
            fillColor: this.fillColor,
            lineStyle: this.lineStyle,
            visible: this.visible,
            locked: this.locked,
            opacity: this.opacity,
            layerId: this.layerId
        };
    }
    
    /**
     * Create from JSON
     * @param {Object} json 
     * @returns {SceneObject}
     */
    static fromJSON(json) {
        const obj = new SceneObject(json.type);
        Object.assign(obj, json);
        return obj;
    }
}

/**
 * Rectangle object
 */
class RectangleObject extends SceneObject {
    constructor(x = 0, y = 0, width = 10, height = 5) {
        super('rectangle');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.cornerRadius = 0;
        this.filled = false;
        this.boxStyle = null; // single, double, rounded - for box drawing style
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        // Determine style: boxStyle takes precedence, then cornerRadius, then lineStyle
        let style = this.lineStyle;
        if (this.boxStyle) {
            style = this.boxStyle;
        } else if (this.cornerRadius > 0) {
            style = 'rounded';
        }
        
        if (this.filled && this.fillChar) {
            fillRect(buffer, this.x, this.y, this.width, this.height, {
                char: this.fillChar,
                color: this.fillColor
            });
        }
        
        drawRect(buffer, this.x, this.y, this.width, this.height, {
            style: style,
            color: this.strokeColor
        });
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            cornerRadius: this.cornerRadius,
            filled: this.filled,
            boxStyle: this.boxStyle
        };
    }
}

/**
 * Ellipse object
 * x,y is top-left of bounding box, radiusX/radiusY define the size
 * Note: ASCII rendering applies 2:1 aspect ratio correction
 */
class EllipseObject extends SceneObject {
    static ASPECT_RATIO = 2; // Character aspect ratio (width:height)
    
    constructor(x = 0, y = 0, radiusX = 5, radiusY = 3) {
        super('ellipse');
        this.x = x;
        this.y = y;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this._updateBounds();
        this.filled = false;
    }
    
    _updateBounds() {
        // Calculate the actual rendered size
        // When rendering, drawCircle applies aspectRatio to X
        // So actual rendered width = radius * aspectRatio * 2 + 1
        const effectiveRadiusX = Math.round(Math.max(this.radiusX, this.radiusY) * EllipseObject.ASPECT_RATIO);
        const effectiveRadiusY = Math.max(this.radiusX, this.radiusY);
        this.width = effectiveRadiusX * 2 + 1;
        this.height = effectiveRadiusY * 2 + 1;
    }
    
    // Get center of ellipse (in canvas coordinates)
    getCenterX() {
        // Center is at x + effectiveRadiusX (accounting for aspect ratio)
        const effectiveRadiusX = Math.round(Math.max(this.radiusX, this.radiusY) * EllipseObject.ASPECT_RATIO);
        return this.x + effectiveRadiusX;
    }
    
    getCenterY() {
        const effectiveRadiusY = Math.max(this.radiusX, this.radiusY);
        return this.y + effectiveRadiusY;
    }
    
    getBounds() {
        this._updateBounds();
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    containsPoint(px, py) {
        // Calculate using actual rendered ellipse dimensions
        const cx = this.getCenterX();
        const cy = this.getCenterY();
        const effectiveRadiusX = Math.round(Math.max(this.radiusX, this.radiusY) * EllipseObject.ASPECT_RATIO);
        const effectiveRadiusY = Math.max(this.radiusX, this.radiusY);
        
        const dx = px - cx;
        const dy = py - cy;
        const rx = effectiveRadiusX || 1;
        const ry = effectiveRadiusY || 1;
        
        // Standard ellipse equation with tolerance for easier selection
        const normalizedDist = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        return normalizedDist <= 1.2; // Slightly larger for easier selection
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        const cx = this.getCenterX();
        const cy = this.getCenterY();
        const r = Math.max(this.radiusX, this.radiusY) || 1;
        
        if (this.filled && this.fillChar) {
            fillCircle(buffer, cx, cy, r, {
                char: this.fillChar,
                color: this.fillColor
            });
        }
        
        drawCircle(buffer, cx, cy, r, {
            char: this.strokeChar,
            color: this.strokeColor
        });
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            radiusX: this.radiusX,
            radiusY: this.radiusY,
            filled: this.filled
        };
    }
}

/**
 * Line object
 */
class LineObject extends SceneObject {
    constructor(x1 = 0, y1 = 0, x2 = 10, y2 = 0) {
        super('line');
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this._updateBounds();
    }
    
    _updateBounds() {
        this.x = Math.min(this.x1, this.x2);
        this.y = Math.min(this.y1, this.y2);
        this.width = Math.abs(this.x2 - this.x1) + 1;
        this.height = Math.abs(this.y2 - this.y1) + 1;
    }
    
    getBounds() {
        this._updateBounds();
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    containsPoint(px, py) {
        // Check if point is near the line (within 1.5 chars for easier selection)
        const dist = this._pointToLineDistance(px, py);
        return dist <= 1.5;
    }
    
    _pointToLineDistance(px, py) {
        const A = px - this.x1;
        const B = py - this.y1;
        const C = this.x2 - this.x1;
        const D = this.y2 - this.y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        
        let xx, yy;
        if (param < 0) {
            xx = this.x1;
            yy = this.y1;
        } else if (param > 1) {
            xx = this.x2;
            yy = this.y2;
        } else {
            xx = this.x1 + param * C;
            yy = this.y1 + param * D;
        }
        
        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        drawLine(buffer, this.x1, this.y1, this.x2, this.y2, {
            style: this.lineStyle,
            color: this.strokeColor
        });
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2
        };
    }
}

/**
 * Text object
 */
class TextObject extends SceneObject {
    constructor(x = 0, y = 0, text = 'Text') {
        super('text');
        this.x = x;
        this.y = y;
        this.text = text;
        this._updateBounds();
    }
    
    _updateBounds() {
        this.width = this.text ? this.text.length : 1;
        this.height = 1;
    }
    
    getBounds() {
        this._updateBounds();
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    containsPoint(px, py) {
        // Use larger hit area for easier selection
        const b = this.getBounds();
        const padding = 1; // Add 1 character padding around text
        return px >= b.x - padding && px < b.x + b.width + padding &&
               py >= b.y - padding && py < b.y + b.height + padding;
    }
    
    render(buffer) {
        if (!this.visible) return;
        buffer.drawText(this.x, this.y, this.text, this.strokeColor);
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            text: this.text
        };
    }
}

/**
 * ASCII Art Text object (large banner-style text)
 */
class AsciiTextObject extends SceneObject {
    constructor(x = 0, y = 0, text = 'TEXT') {
        super('ascii-text');
        this.x = x;
        this.y = y;
        this.text = text;
        this._updateBounds();
    }
    
    _updateBounds() {
        // Each character is 6 wide x 5 tall
        this.width = this.text ? this.text.length * 6 : 6;
        this.height = 5;
    }
    
    getBounds() {
        this._updateBounds();
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    containsPoint(px, py) {
        // Use larger hit area for easier selection
        const b = this.getBounds();
        const padding = 1; // Add 1 character padding
        return px >= b.x - padding && px < b.x + b.width + padding &&
               py >= b.y - padding && py < b.y + b.height + padding;
    }
    
    _getCharArt(char) {
        // Simple 5x5 ASCII art for letters
        const arts = {
            'A': ['  █  ', ' █ █ ', '█████', '█   █', '█   █'],
            'B': ['████ ', '█   █', '████ ', '█   █', '████ '],
            'C': [' ████', '█    ', '█    ', '█    ', ' ████'],
            'D': ['████ ', '█   █', '█   █', '█   █', '████ '],
            'E': ['█████', '█    ', '████ ', '█    ', '█████'],
            'F': ['█████', '█    ', '████ ', '█    ', '█    '],
            'G': [' ████', '█    ', '█  ██', '█   █', ' ████'],
            'H': ['█   █', '█   █', '█████', '█   █', '█   █'],
            'I': ['█████', '  █  ', '  █  ', '  █  ', '█████'],
            'J': ['█████', '   █ ', '   █ ', '█  █ ', ' ██  '],
            'K': ['█   █', '█  █ ', '███  ', '█  █ ', '█   █'],
            'L': ['█    ', '█    ', '█    ', '█    ', '█████'],
            'M': ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
            'N': ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
            'O': [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
            'P': ['████ ', '█   █', '████ ', '█    ', '█    '],
            'Q': [' ███ ', '█   █', '█   █', '█  █ ', ' ██ █'],
            'R': ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
            'S': [' ████', '█    ', ' ███ ', '    █', '████ '],
            'T': ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
            'U': ['█   █', '█   █', '█   █', '█   █', ' ███ '],
            'V': ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
            'W': ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
            'X': ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
            'Y': ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
            'Z': ['█████', '   █ ', '  █  ', ' █   ', '█████'],
            '0': [' ███ ', '█  ██', '█ █ █', '██  █', ' ███ '],
            '1': ['  █  ', ' ██  ', '  █  ', '  █  ', '█████'],
            '2': [' ███ ', '█   █', '  ██ ', ' █   ', '█████'],
            '3': ['█████', '   █ ', '  ██ ', '   █ ', '████ '],
            '4': ['█   █', '█   █', '█████', '    █', '    █'],
            '5': ['█████', '█    ', '████ ', '    █', '████ '],
            '6': [' ███ ', '█    ', '████ ', '█   █', ' ███ '],
            '7': ['█████', '    █', '   █ ', '  █  ', '  █  '],
            '8': [' ███ ', '█   █', ' ███ ', '█   █', ' ███ '],
            '9': [' ███ ', '█   █', ' ████', '    █', ' ███ '],
            ' ': ['     ', '     ', '     ', '     ', '     '],
            '!': ['  █  ', '  █  ', '  █  ', '     ', '  █  '],
            '?': [' ███ ', '█   █', '  █  ', '     ', '  █  '],
            '.': ['     ', '     ', '     ', '     ', '  █  '],
            ',': ['     ', '     ', '     ', '  █  ', ' █   '],
            '-': ['     ', '     ', '████ ', '     ', '     '],
            '+': ['     ', '  █  ', '█████', '  █  ', '     '],
            '=': ['     ', '█████', '     ', '█████', '     '],
        };
        return arts[char.toUpperCase()] || ['     ', '     ', '  █  ', '     ', '     '];
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        const chars = this.text.toUpperCase().split('');
        let offsetX = 0;
        
        chars.forEach(char => {
            const art = this._getCharArt(char);
            art.forEach((line, row) => {
                for (let col = 0; col < line.length; col++) {
                    if (line[col] !== ' ') {
                        buffer.setChar(this.x + offsetX + col, this.y + row, line[col], this.strokeColor);
                    }
                }
            });
            offsetX += 6; // Character width + spacing
        });
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            text: this.text
        };
    }
}

/**
 * Polygon object
 */
class PolygonObject extends SceneObject {
    constructor(cx = 0, cy = 0, radius = 5, sides = 6) {
        super('polygon');
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.sides = sides;
        this.filled = false;
        this._updateBounds();
    }
    
    _updateBounds() {
        this.x = Math.round(this.cx - this.radius);
        this.y = Math.round(this.cy - this.radius * 0.5);
        this.width = Math.round(this.radius * 2) + 1;
        this.height = Math.round(this.radius) + 1;
    }
    
    getBounds() {
        this._updateBounds();
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    _getPoints() {
        const points = [];
        for (let i = 0; i < this.sides; i++) {
            const angle = (i * 2 * Math.PI / this.sides) - Math.PI / 2;
            points.push({
                x: Math.round(this.cx + this.radius * Math.cos(angle)),
                y: Math.round(this.cy + this.radius * Math.sin(angle) * 0.5)
            });
        }
        return points;
    }
    
    _isPointInPolygon(px, py, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;
            
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }
    
    containsPoint(px, py) {
        // Check if point is inside polygon or near any edge
        const points = this._getPoints();
        if (this._isPointInPolygon(px, py, points)) {
            return true;
        }
        // Also check distance to edges for easier selection
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const dist = this._pointToSegmentDistance(px, py, p1.x, p1.y, p2.x, p2.y);
            if (dist <= 1.5) return true;
        }
        return false;
    }
    
    _pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        const points = this._getPoints();
        
        // Fill if needed
        if (this.filled && this.fillChar) {
            for (let y = this.y; y < this.y + this.height; y++) {
                for (let x = this.x; x < this.x + this.width; x++) {
                    if (this._isPointInPolygon(x, y, points)) {
                        if (buffer[y] && x >= 0 && x < buffer[y].length) {
                            buffer[y][x] = { char: this.fillChar, color: this.fillColor };
                        }
                    }
                }
            }
        }
        
        // Draw outline
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            drawLine(buffer, p1.x, p1.y, p2.x, p2.y, {
                style: this.lineStyle,
                color: this.strokeColor
            });
        }
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            cx: this.cx,
            cy: this.cy,
            radius: this.radius,
            sides: this.sides,
            filled: this.filled
        };
    }
}

/**
 * Star object
 */
class StarObject extends SceneObject {
    constructor(cx = 0, cy = 0, outerRadius = 5, points = 5, innerRatio = 0.4) {
        super('star');
        this.cx = cx;
        this.cy = cy;
        this.outerRadius = outerRadius;
        this.numPoints = points;
        this.innerRatio = innerRatio;
        this.filled = false;
        this._updateBounds();
    }
    
    _updateBounds() {
        this.x = Math.round(this.cx - this.outerRadius);
        this.y = Math.round(this.cy - this.outerRadius * 0.5);
        this.width = Math.round(this.outerRadius * 2) + 1;
        this.height = Math.round(this.outerRadius) + 1;
    }
    
    _getVertices() {
        const innerRadius = this.outerRadius * this.innerRatio;
        const vertices = [];
        
        for (let i = 0; i < this.numPoints * 2; i++) {
            const angle = (i * Math.PI / this.numPoints) - Math.PI / 2;
            const radius = i % 2 === 0 ? this.outerRadius : innerRadius;
            vertices.push({
                x: Math.round(this.cx + radius * Math.cos(angle)),
                y: Math.round(this.cy + radius * Math.sin(angle) * 0.5)
            });
        }
        return vertices;
    }
    
    _isPointInPolygon(px, py, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;
            
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        const vertices = this._getVertices();
        
        // Fill if needed
        if (this.filled && this.fillChar) {
            for (let y = this.y; y < this.y + this.height; y++) {
                for (let x = this.x; x < this.x + this.width; x++) {
                    if (this._isPointInPolygon(x, y, vertices)) {
                        if (buffer[y] && x >= 0 && x < buffer[y].length) {
                            buffer[y][x] = { char: this.fillChar, color: this.fillColor };
                        }
                    }
                }
            }
        }
        
        // Draw outline
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % vertices.length];
            drawLine(buffer, p1.x, p1.y, p2.x, p2.y, {
                char: this.strokeChar,
                color: this.strokeColor
            });
        }
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            cx: this.cx,
            cy: this.cy,
            outerRadius: this.outerRadius,
            numPoints: this.numPoints,
            innerRatio: this.innerRatio,
            filled: this.filled
        };
    }
}

/**
 * Table object
 */
class TableObject extends SceneObject {
    constructor(x = 0, y = 0, width = 30, height = 10, cols = 3, rows = 3) {
        super('table');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.cols = cols;
        this.rows = rows;
        this.cellContents = []; // 2D array of cell contents
        
        // Initialize empty cell contents
        for (let r = 0; r < rows; r++) {
            this.cellContents[r] = [];
            for (let c = 0; c < cols; c++) {
                this.cellContents[r][c] = '';
            }
        }
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        const cellWidth = Math.floor(this.width / this.cols);
        const cellHeight = Math.floor(this.height / this.rows);
        
        // Draw outer border
        drawRect(buffer, this.x, this.y, this.width, this.height, { 
            style: 'single',
            color: this.strokeColor 
        });
        
        // Draw vertical dividers
        for (let i = 1; i < this.cols; i++) {
            const x = this.x + i * cellWidth;
            for (let y = this.y; y < this.y + this.height; y++) {
                const char = y === this.y ? '┬' : (y === this.y + this.height - 1 ? '┴' : '│');
                buffer.setChar(x, y, char, this.strokeColor);
            }
        }
        
        // Draw horizontal dividers
        for (let i = 1; i < this.rows; i++) {
            const y = this.y + i * cellHeight;
            for (let x = this.x; x < this.x + this.width; x++) {
                const char = x === this.x ? '├' : (x === this.x + this.width - 1 ? '┤' : '─');
                buffer.setChar(x, y, char, this.strokeColor);
            }
            // Fix intersections
            for (let j = 1; j < this.cols; j++) {
                buffer.setChar(this.x + j * cellWidth, y, '┼', this.strokeColor);
            }
        }
        
        // Draw cell contents
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const content = this.cellContents[r][c];
                if (content) {
                    const cellX = this.x + c * cellWidth + 1;
                    const cellY = this.y + r * cellHeight + 1;
                    for (let i = 0; i < content.length && i < cellWidth - 2; i++) {
                        buffer.setChar(cellX + i, cellY, content[i], this.strokeColor);
                    }
                }
            }
        }
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            cols: this.cols,
            rows: this.rows,
            cellContents: this.cellContents
        };
    }
}

/**
 * Chart object with improved rendering
 */
class ChartObject extends SceneObject {
    constructor(x = 0, y = 0, width = 30, height = 15) {
        super('chart');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.chartType = 'bar'; // bar, line, pie, scatter
        this.data = [0.3, 0.7, 0.5, 0.9, 0.4, 0.6]; // Sample data (values 0-1)
        this.labels = ['A', 'B', 'C', 'D', 'E', 'F'];
        this.title = '';
        this.showAxes = true;
        this.showLabels = true;
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        switch (this.chartType) {
            case 'line':
                this._renderLineChart(buffer);
                break;
            case 'pie':
                this._renderPieChart(buffer);
                break;
            case 'scatter':
                this._renderScatterChart(buffer);
                break;
            default:
                this._renderBarChart(buffer);
        }
    }
    
    _renderBarChart(buffer) {
        const chartHeight = this.height - 3; // Leave room for axis and labels
        const chartWidth = this.width - 3;   // Leave room for Y axis
        
        // Draw title if present
        if (this.title) {
            const titleX = this.x + Math.floor((this.width - this.title.length) / 2);
            buffer.drawText(titleX, this.y, this.title, this.strokeColor);
        }
        
        // Draw Y axis
        for (let i = 0; i < chartHeight; i++) {
            buffer.setChar(this.x + 2, this.y + 1 + i, '│', this.strokeColor);
        }
        
        // Draw X axis
        buffer.setChar(this.x + 2, this.y + chartHeight + 1, '└', this.strokeColor);
        for (let i = 1; i < chartWidth; i++) {
            buffer.setChar(this.x + 2 + i, this.y + chartHeight + 1, '─', this.strokeColor);
        }
        
        // Draw Y axis labels
        buffer.drawText(this.x, this.y + 1, '1', this.strokeColor);
        buffer.drawText(this.x, this.y + Math.floor(chartHeight / 2), '.5', this.strokeColor);
        buffer.drawText(this.x, this.y + chartHeight, '0', this.strokeColor);
        
        // Draw bars with better spacing
        const barAreaWidth = chartWidth - 1;
        const numBars = this.data.length;
        const totalBarSpace = barAreaWidth;
        const barWidth = Math.max(1, Math.floor(totalBarSpace / numBars) - 1);
        const spacing = Math.floor((totalBarSpace - barWidth * numBars) / (numBars + 1));
        
        this.data.forEach((value, i) => {
            const barHeight = Math.max(1, Math.round(value * (chartHeight - 1)));
            const barX = this.x + 3 + spacing + i * (barWidth + spacing);
            
            // Draw bar using block characters
            for (let h = 0; h < barHeight; h++) {
                const barY = this.y + chartHeight - h;
                for (let w = 0; w < barWidth; w++) {
                    // Use different shading for visual interest
                    const char = h === barHeight - 1 ? '▀' : '█';
                    buffer.setChar(barX + w, barY, char, this.strokeColor);
                }
            }
            
            // Draw label below
            if (this.showLabels && this.labels[i]) {
                buffer.setChar(barX, this.y + chartHeight + 2, this.labels[i][0], this.strokeColor);
            }
        });
    }
    
    _renderLineChart(buffer) {
        const chartHeight = this.height - 3;
        const chartWidth = this.width - 3;
        
        // Draw axes
        for (let i = 0; i < chartHeight; i++) {
            buffer.setChar(this.x + 2, this.y + 1 + i, '│', this.strokeColor);
        }
        buffer.setChar(this.x + 2, this.y + chartHeight + 1, '└', this.strokeColor);
        for (let i = 1; i < chartWidth; i++) {
            buffer.setChar(this.x + 2 + i, this.y + chartHeight + 1, '─', this.strokeColor);
        }
        
        // Plot points and connect with lines
        const points = [];
        const numPoints = this.data.length;
        const stepX = Math.floor((chartWidth - 2) / Math.max(1, numPoints - 1));
        
        this.data.forEach((value, i) => {
            const px = this.x + 3 + i * stepX;
            const py = this.y + chartHeight - Math.round(value * (chartHeight - 1));
            points.push({ x: px, y: py });
            
            // Draw point marker
            buffer.setChar(px, py, '●', this.strokeColor);
        });
        
        // Connect points with lines
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            drawLine(buffer, p1.x, p1.y, p2.x, p2.y, { char: '·', color: this.strokeColor });
            // Redraw points on top
            buffer.setChar(p1.x, p1.y, '●', this.strokeColor);
        }
        if (points.length > 0) {
            buffer.setChar(points[points.length - 1].x, points[points.length - 1].y, '●', this.strokeColor);
        }
    }
    
    _renderPieChart(buffer) {
        const cx = this.x + Math.floor(this.width / 2);
        const cy = this.y + Math.floor(this.height / 2);
        const radius = Math.min(Math.floor(this.width / 2) - 2, Math.floor(this.height / 2) - 1);
        
        // Draw circular outline
        const pieChars = ['█', '▓', '▒', '░', '▪', '○'];
        let total = this.data.reduce((a, b) => a + b, 0);
        let currentAngle = -Math.PI / 2;
        
        // Draw filled segments
        this.data.forEach((value, i) => {
            const angleSpan = (value / total) * 2 * Math.PI;
            const midAngle = currentAngle + angleSpan / 2;
            const char = pieChars[i % pieChars.length];
            
            // Fill segment area
            for (let r = 1; r <= radius; r++) {
                for (let a = currentAngle; a < currentAngle + angleSpan; a += 0.2) {
                    const px = Math.round(cx + r * Math.cos(a) * 2);
                    const py = Math.round(cy + r * Math.sin(a));
                    if (px >= this.x && px < this.x + this.width && 
                        py >= this.y && py < this.y + this.height) {
                        buffer.setChar(px, py, char, this.strokeColor);
                    }
                }
            }
            
            currentAngle += angleSpan;
        });
        
        // Draw circle outline
        drawCircle(buffer, cx, cy, radius, { char: '○', color: this.strokeColor });
    }
    
    _renderScatterChart(buffer) {
        const chartHeight = this.height - 3;
        const chartWidth = this.width - 3;
        
        // Draw axes
        for (let i = 0; i < chartHeight; i++) {
            buffer.setChar(this.x + 2, this.y + 1 + i, '│', this.strokeColor);
        }
        buffer.setChar(this.x + 2, this.y + chartHeight + 1, '└', this.strokeColor);
        for (let i = 1; i < chartWidth; i++) {
            buffer.setChar(this.x + 2 + i, this.y + chartHeight + 1, '─', this.strokeColor);
        }
        
        // Plot scattered points
        const markers = ['●', '○', '◆', '◇', '■', '□'];
        this.data.forEach((value, i) => {
            const px = this.x + 3 + Math.floor((i / (this.data.length - 1 || 1)) * (chartWidth - 2));
            const py = this.y + chartHeight - Math.round(value * (chartHeight - 1));
            buffer.setChar(px, py, markers[i % markers.length], this.strokeColor);
        });
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            chartType: this.chartType,
            data: this.data,
            labels: this.labels,
            title: this.title,
            showAxes: this.showAxes,
            showLabels: this.showLabels
        };
    }
}

/**
 * Freehand path object (pencil strokes)
 */
class PathObject extends SceneObject {
    constructor() {
        super('path');
        this.points = []; // Array of {x, y}
        this.brushSize = 0; // 0 = thin line, >0 = brush with radius
    }
    
    addPoint(x, y) {
        this.points.push({ x, y });
        this._updateBounds();
    }
    
    _updateBounds() {
        if (this.points.length === 0) {
            this.width = 0;
            this.height = 0;
            return;
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        // Account for brush size in bounds calculation
        const padding = this.brushSize || 0;
        
        for (const p of this.points) {
            minX = Math.min(minX, p.x - padding);
            minY = Math.min(minY, p.y - padding);
            maxX = Math.max(maxX, p.x + padding);
            maxY = Math.max(maxY, p.y + padding);
        }
        
        this.x = minX;
        this.y = minY;
        this.width = maxX - minX + 1;
        this.height = maxY - minY + 1;
    }
    
    getBounds() {
        this._updateBounds();
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    containsPoint(px, py) {
        // Check if point is near any segment of the path
        if (this.points.length === 0) return false;
        
        const hitRadius = Math.max(1.5, this.brushSize || 0);
        
        // Single point
        if (this.points.length === 1) {
            const p = this.points[0];
            return Math.abs(px - p.x) <= hitRadius && Math.abs(py - p.y) <= hitRadius;
        }
        
        // Check distance to each line segment
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            const dist = this._pointToSegmentDistance(px, py, p1.x, p1.y, p2.x, p2.y);
            if (dist <= hitRadius) return true;
        }
        return false;
    }
    
    _pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
    }
    
    render(buffer) {
        if (!this.visible || this.points.length === 0) return;
        
        const brushSize = this.brushSize || 0;
        
        if (brushSize > 0) {
            // Brush mode: draw filled circles along the path
            for (let i = 0; i < this.points.length; i++) {
                const p = this.points[i];
                
                // Draw filled circle at each point
                this._drawBrushPoint(buffer, p.x, p.y, brushSize);
                
                // Fill in between consecutive points for smooth stroke
                if (i > 0) {
                    const prev = this.points[i - 1];
                    this._drawBrushLine(buffer, prev.x, prev.y, p.x, p.y, brushSize);
                }
            }
        } else {
            // Thin line mode: draw simple lines
            for (let i = 0; i < this.points.length; i++) {
                const p = this.points[i];
                if (i > 0) {
                    const prev = this.points[i - 1];
                    drawLine(buffer, prev.x, prev.y, p.x, p.y, {
                        char: this.strokeChar,
                        color: this.strokeColor
                    });
                }
                buffer.setChar(p.x, p.y, this.strokeChar, this.strokeColor);
            }
        }
    }
    
    _drawBrushPoint(buffer, x, y, size) {
        // Draw a filled circle at the position
        for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
                if (dx * dx + dy * dy <= size * size) {
                    buffer.setChar(x + dx, y + dy, this.strokeChar, this.strokeColor);
                }
            }
        }
    }
    
    _drawBrushLine(buffer, x1, y1, x2, y2, size) {
        // Draw brush points along the line for smooth coverage
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 1) return;
        
        // Step along the line, drawing brush points
        const steps = Math.ceil(dist);
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = Math.round(x1 + dx * t);
            const y = Math.round(y1 + dy * t);
            this._drawBrushPoint(buffer, x, y, size);
        }
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            points: this.points,
            brushSize: this.brushSize
        };
    }
}

/**
 * Group object (container for multiple objects)
 */
class GroupObject extends SceneObject {
    constructor() {
        super('group');
        this.children = [];
    }
    
    add(obj) {
        obj.layerId = this.id;
        this.children.push(obj);
        this._updateBounds();
    }
    
    remove(obj) {
        const idx = this.children.indexOf(obj);
        if (idx > -1) {
            this.children.splice(idx, 1);
            this._updateBounds();
        }
    }
    
    _updateBounds() {
        if (this.children.length === 0) {
            this.width = 0;
            this.height = 0;
            return;
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const child of this.children) {
            const b = child.getBounds();
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.width);
            maxY = Math.max(maxY, b.y + b.height);
        }
        
        this.x = minX;
        this.y = minY;
        this.width = maxX - minX;
        this.height = maxY - minY;
    }
    
    getBounds() {
        this._updateBounds();
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    containsPoint(px, py) {
        // Check if any child contains the point
        for (const child of this.children) {
            if (child.containsPoint && child.containsPoint(px, py)) {
                return true;
            }
        }
        return false;
    }
    
    render(buffer) {
        if (!this.visible) return;
        for (const child of this.children) {
            child.render(buffer);
        }
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            children: this.children.map(c => c.toJSON())
        };
    }
}

// ==========================================
// FLOWCHART SHAPES
// ==========================================

/**
 * Base class for flowchart shapes
 */
class FlowchartShape extends SceneObject {
    constructor(type = 'flowchart-shape') {
        super(type);
        this.label = '';
        this.labelColor = null;
        // Snap points for connectors (relative to x,y)
        this.snapPoints = [];
    }
    
    /**
     * Get absolute snap point positions
     */
    getSnapPoints() {
        return this.snapPoints.map(sp => ({
            id: sp.id,
            x: this.x + sp.relX,
            y: this.y + sp.relY,
            direction: sp.direction // 'top', 'bottom', 'left', 'right'
        }));
    }
    
    /**
     * Find closest snap point to a position
     */
    getClosestSnapPoint(px, py) {
        const points = this.getSnapPoints();
        let closest = null;
        let minDist = Infinity;
        
        for (const sp of points) {
            const dist = Math.sqrt((sp.x - px) ** 2 + (sp.y - py) ** 2);
            if (dist < minDist) {
                minDist = dist;
                closest = sp;
            }
        }
        return closest;
    }
    
    /**
     * Draw centered label inside shape
     */
    _renderLabel(buffer) {
        if (!this.label) return;
        
        const lines = this.label.split('\n');
        const centerY = Math.floor(this.y + this.height / 2) - Math.floor(lines.length / 2);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const centerX = Math.floor(this.x + this.width / 2 - line.length / 2);
            buffer.drawText(centerX, centerY + i, line, this.labelColor || this.strokeColor);
        }
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            label: this.label,
            labelColor: this.labelColor
        };
    }
}

/**
 * Process shape (rectangle)
 * ┌──────────┐
 * │ Process  │
 * └──────────┘
 */
class ProcessShape extends FlowchartShape {
    constructor(x = 0, y = 0, width = 14, height = 5) {
        super('process');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this._updateSnapPoints();
    }
    
    _updateSnapPoints() {
        const w = this.width;
        const h = this.height;
        this.snapPoints = [
            { id: 'top', relX: Math.floor(w / 2), relY: 0, direction: 'top' },
            { id: 'bottom', relX: Math.floor(w / 2), relY: h - 1, direction: 'bottom' },
            { id: 'left', relX: 0, relY: Math.floor(h / 2), direction: 'left' },
            { id: 'right', relX: w - 1, relY: Math.floor(h / 2), direction: 'right' }
        ];
    }
    
    render(buffer) {
        if (!this.visible) return;
        drawRect(buffer, this.x, this.y, this.width, this.height, {
            style: this.lineStyle || 'single',
            color: this.strokeColor
        });
        this._renderLabel(buffer);
    }
}

/**
 * Terminal shape (rounded rectangle / stadium)
 * ╭──────────╮
 * │  Start   │
 * ╰──────────╯
 */
class TerminalShape extends FlowchartShape {
    constructor(x = 0, y = 0, width = 14, height = 3) {
        super('terminal');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this._updateSnapPoints();
    }
    
    _updateSnapPoints() {
        const w = this.width;
        const h = this.height;
        this.snapPoints = [
            { id: 'top', relX: Math.floor(w / 2), relY: 0, direction: 'top' },
            { id: 'bottom', relX: Math.floor(w / 2), relY: h - 1, direction: 'bottom' },
            { id: 'left', relX: 0, relY: Math.floor(h / 2), direction: 'left' },
            { id: 'right', relX: w - 1, relY: Math.floor(h / 2), direction: 'right' }
        ];
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        // Draw rounded rectangle
        const x = this.x, y = this.y;
        const w = this.width, h = this.height;
        
        // Top line with rounded corners
        buffer.setChar(x, y, '╭', this.strokeColor);
        for (let i = 1; i < w - 1; i++) {
            buffer.setChar(x + i, y, '─', this.strokeColor);
        }
        buffer.setChar(x + w - 1, y, '╮', this.strokeColor);
        
        // Middle lines
        for (let j = 1; j < h - 1; j++) {
            buffer.setChar(x, y + j, '│', this.strokeColor);
            buffer.setChar(x + w - 1, y + j, '│', this.strokeColor);
        }
        
        // Bottom line with rounded corners
        buffer.setChar(x, y + h - 1, '╰', this.strokeColor);
        for (let i = 1; i < w - 1; i++) {
            buffer.setChar(x + i, y + h - 1, '─', this.strokeColor);
        }
        buffer.setChar(x + w - 1, y + h - 1, '╯', this.strokeColor);
        
        this._renderLabel(buffer);
    }
}

/**
 * Decision shape (diamond)
 *       ╱╲
 *      ╱  ╲
 *     ╱    ╲
 *    ◇ text ◇
 *     ╲    ╱
 *      ╲  ╱
 *       ╲╱
 */
class DecisionShape extends FlowchartShape {
    constructor(x = 0, y = 0, width = 17, height = 9) {
        super('decision');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this._updateSnapPoints();
    }
    
    _updateSnapPoints() {
        const w = this.width;
        const h = this.height;
        this.snapPoints = [
            { id: 'top', relX: Math.floor(w / 2), relY: 0, direction: 'top' },
            { id: 'bottom', relX: Math.floor(w / 2), relY: h - 1, direction: 'bottom' },
            { id: 'left', relX: 0, relY: Math.floor(h / 2), direction: 'left' },
            { id: 'right', relX: w - 1, relY: Math.floor(h / 2), direction: 'right' }
        ];
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        const w = this.width;
        const h = this.height;
        const cx = this.x + Math.floor(w / 2);
        const cy = this.y + Math.floor(h / 2);
        
        // Calculate scale factors for drawing diamond
        const halfW = Math.floor(w / 2);
        const halfH = Math.floor(h / 2);
        
        // Draw diamond outline using line-by-line approach
        for (let row = 0; row < h; row++) {
            // Calculate horizontal span at this row
            const distFromCenter = Math.abs(row - halfH);
            const rowProgress = halfH > 0 ? 1 - (distFromCenter / halfH) : 1;
            const span = Math.floor(halfW * rowProgress);
            
            if (span > 0) {
                const leftX = cx - span;
                const rightX = cx + span;
                
                // Draw left and right edges
                if (row < halfH) {
                    // Top half
                    buffer.setChar(leftX, this.y + row, '╱', this.strokeColor);
                    buffer.setChar(rightX, this.y + row, '╲', this.strokeColor);
                } else if (row > halfH) {
                    // Bottom half
                    buffer.setChar(leftX, this.y + row, '╲', this.strokeColor);
                    buffer.setChar(rightX, this.y + row, '╱', this.strokeColor);
                } else {
                    // Middle row - widest point
                    buffer.setChar(leftX, this.y + row, '<', this.strokeColor);
                    buffer.setChar(rightX, this.y + row, '>', this.strokeColor);
                }
            } else {
                // Single point (top or bottom vertex)
                if (row === 0) {
                    buffer.setChar(cx, this.y + row, '^', this.strokeColor);
                } else if (row === h - 1) {
                    buffer.setChar(cx, this.y + row, 'v', this.strokeColor);
                }
            }
        }
        
        // Fill interior if needed
        if (this.filled && this.fillChar) {
            for (let row = 1; row < h - 1; row++) {
                const distFromCenter = Math.abs(row - halfH);
                const rowProgress = halfH > 0 ? 1 - (distFromCenter / halfH) : 1;
                const span = Math.floor(halfW * rowProgress);
                
                for (let xi = -span + 1; xi < span; xi++) {
                    const fillX = cx + xi;
                    const fillY = this.y + row;
                    const currentChar = buffer.getChar(fillX, fillY);
                    if (currentChar === ' ' || currentChar === null) {
                        buffer.setChar(fillX, fillY, this.fillChar, this.fillColor);
                    }
                }
            }
        }
        
        this._renderLabel(buffer);
    }
}

/**
 * I/O shape (parallelogram)
 * ╔══════════╗
 * ║   I/O    ║
 * ╚══════════╝
 */
class IOShape extends FlowchartShape {
    constructor(x = 0, y = 0, width = 14, height = 5) {
        super('io');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this._updateSnapPoints();
    }
    
    _updateSnapPoints() {
        const w = this.width;
        const h = this.height;
        this.snapPoints = [
            { id: 'top', relX: Math.floor(w / 2), relY: 0, direction: 'top' },
            { id: 'bottom', relX: Math.floor(w / 2), relY: h - 1, direction: 'bottom' },
            { id: 'left', relX: 0, relY: Math.floor(h / 2), direction: 'left' },
            { id: 'right', relX: w - 1, relY: Math.floor(h / 2), direction: 'right' }
        ];
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        // Draw parallelogram using double lines
        drawRect(buffer, this.x, this.y, this.width, this.height, {
            style: 'double',
            color: this.strokeColor
        });
        this._renderLabel(buffer);
    }
}

/**
 * Document shape
 * ┌──────────────┐
 * │              │
 * │   Document   │
 * │    ═══════   │
 * └──────────────┘
 */
class DocumentShape extends FlowchartShape {
    constructor(x = 0, y = 0, width = 16, height = 6) {
        super('document');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this._updateSnapPoints();
    }
    
    _updateSnapPoints() {
        const w = this.width;
        const h = this.height;
        this.snapPoints = [
            { id: 'top', relX: Math.floor(w / 2), relY: 0, direction: 'top' },
            { id: 'bottom', relX: Math.floor(w / 2), relY: h - 1, direction: 'bottom' },
            { id: 'left', relX: 0, relY: Math.floor(h / 2), direction: 'left' },
            { id: 'right', relX: w - 1, relY: Math.floor(h / 2), direction: 'right' }
        ];
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        drawRect(buffer, this.x, this.y, this.width, this.height, {
            style: 'single',
            color: this.strokeColor
        });
        
        // Draw wavy bottom line
        const bottomY = this.y + this.height - 2;
        for (let i = 2; i < this.width - 2; i++) {
            buffer.setChar(this.x + i, bottomY, '═', this.strokeColor);
        }
        
        this._renderLabel(buffer);
    }
}

/**
 * Database shape (cylinder)
 * ╭────╮
 * │    │
 * │    │
 * ╰────╯
 */
class DatabaseShape extends FlowchartShape {
    constructor(x = 0, y = 0, width = 10, height = 6) {
        super('database');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this._updateSnapPoints();
    }
    
    _updateSnapPoints() {
        const w = this.width;
        const h = this.height;
        this.snapPoints = [
            { id: 'top', relX: Math.floor(w / 2), relY: 0, direction: 'top' },
            { id: 'bottom', relX: Math.floor(w / 2), relY: h - 1, direction: 'bottom' },
            { id: 'left', relX: 0, relY: Math.floor(h / 2), direction: 'left' },
            { id: 'right', relX: w - 1, relY: Math.floor(h / 2), direction: 'right' }
        ];
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        const x = this.x, y = this.y;
        const w = this.width, h = this.height;
        
        // Top ellipse
        buffer.setChar(x, y, '╭', this.strokeColor);
        for (let i = 1; i < w - 1; i++) {
            buffer.setChar(x + i, y, '─', this.strokeColor);
        }
        buffer.setChar(x + w - 1, y, '╮', this.strokeColor);
        
        // Second line (ellipse bottom)
        buffer.setChar(x, y + 1, '│', this.strokeColor);
        for (let i = 1; i < w - 1; i++) {
            buffer.setChar(x + i, y + 1, '─', this.strokeColor);
        }
        buffer.setChar(x + w - 1, y + 1, '│', this.strokeColor);
        
        // Sides
        for (let j = 2; j < h - 1; j++) {
            buffer.setChar(x, y + j, '│', this.strokeColor);
            buffer.setChar(x + w - 1, y + j, '│', this.strokeColor);
        }
        
        // Bottom
        buffer.setChar(x, y + h - 1, '╰', this.strokeColor);
        for (let i = 1; i < w - 1; i++) {
            buffer.setChar(x + i, y + h - 1, '─', this.strokeColor);
        }
        buffer.setChar(x + w - 1, y + h - 1, '╯', this.strokeColor);
        
        this._renderLabel(buffer);
    }
}

/**
 * Subprocess shape (rectangle with double side lines)
 * ┌─────────────┐
 * │  ┌───────┐  │
 * │  │       │  │
 * │  └───────┘  │
 * └─────────────┘
 */
class SubprocessShape extends FlowchartShape {
    constructor(x = 0, y = 0, width = 16, height = 6) {
        super('subprocess');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this._updateSnapPoints();
    }
    
    _updateSnapPoints() {
        const w = this.width;
        const h = this.height;
        this.snapPoints = [
            { id: 'top', relX: Math.floor(w / 2), relY: 0, direction: 'top' },
            { id: 'bottom', relX: Math.floor(w / 2), relY: h - 1, direction: 'bottom' },
            { id: 'left', relX: 0, relY: Math.floor(h / 2), direction: 'left' },
            { id: 'right', relX: w - 1, relY: Math.floor(h / 2), direction: 'right' }
        ];
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        // Outer rectangle
        drawRect(buffer, this.x, this.y, this.width, this.height, {
            style: 'single',
            color: this.strokeColor
        });
        
        // Inner vertical lines (double-sided indicator)
        for (let j = 1; j < this.height - 1; j++) {
            buffer.setChar(this.x + 2, this.y + j, '│', this.strokeColor);
            buffer.setChar(this.x + this.width - 3, this.y + j, '│', this.strokeColor);
        }
        
        this._renderLabel(buffer);
    }
}

/**
 * Connector circle shape
 * ◯
 */
class ConnectorCircleShape extends FlowchartShape {
    constructor(x = 0, y = 0) {
        super('connector-circle');
        this.x = x;
        this.y = y;
        this.width = 3;
        this.height = 3;
        this.connectorId = ''; // Label like 'A', 'B', '1', etc.
        this._updateSnapPoints();
    }
    
    _updateSnapPoints() {
        this.snapPoints = [
            { id: 'top', relX: 1, relY: 0, direction: 'top' },
            { id: 'bottom', relX: 1, relY: 2, direction: 'bottom' },
            { id: 'left', relX: 0, relY: 1, direction: 'left' },
            { id: 'right', relX: 2, relY: 1, direction: 'right' }
        ];
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        // Simple circle representation
        buffer.setChar(this.x + 1, this.y, '◯', this.strokeColor);
        buffer.setChar(this.x, this.y + 1, '◯', this.strokeColor);
        buffer.setChar(this.x + 2, this.y + 1, '◯', this.strokeColor);
        buffer.setChar(this.x + 1, this.y + 2, '◯', this.strokeColor);
        
        // Center label
        if (this.connectorId) {
            buffer.setChar(this.x + 1, this.y + 1, this.connectorId.charAt(0), this.labelColor || this.strokeColor);
        }
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            connectorId: this.connectorId
        };
    }
}

/**
 * Flowchart Connector (arrow/line between shapes)
 */
class FlowchartConnector extends SceneObject {
    constructor() {
        super('connector');
        this.fromShapeId = null;
        this.fromSnapPoint = null;
        this.toShapeId = null;
        this.toSnapPoint = null;
        
        // If not connected to shapes, use coordinates
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        
        // Connector style
        this.connectorStyle = 'straight'; // 'straight', 'orthogonal', 'curved'
        this.lineType = 'solid'; // 'solid', 'dashed', 'double'
        this.arrowStart = false;
        this.arrowEnd = true;
        
        // For orthogonal routing
        this.waypoints = [];
    }
    
    /**
     * Set connection endpoints from shape snap points
     */
    setFromShape(shape, snapPointId) {
        this.fromShapeId = shape.id;
        this.fromSnapPoint = snapPointId;
        const sp = shape.getSnapPoints().find(p => p.id === snapPointId);
        if (sp) {
            this.startX = sp.x;
            this.startY = sp.y;
        }
    }
    
    setToShape(shape, snapPointId) {
        this.toShapeId = shape.id;
        this.toSnapPoint = snapPointId;
        const sp = shape.getSnapPoints().find(p => p.id === snapPointId);
        if (sp) {
            this.endX = sp.x;
            this.endY = sp.y;
        }
    }
    
    /**
     * Update endpoint positions from connected shapes
     */
    updateFromShapes(shapes) {
        if (this.fromShapeId) {
            const fromShape = shapes.find(s => s.id === this.fromShapeId);
            if (fromShape) {
                const sp = fromShape.getSnapPoints().find(p => p.id === this.fromSnapPoint);
                if (sp) {
                    this.startX = sp.x;
                    this.startY = sp.y;
                }
            }
        }
        if (this.toShapeId) {
            const toShape = shapes.find(s => s.id === this.toShapeId);
            if (toShape) {
                const sp = toShape.getSnapPoints().find(p => p.id === this.toSnapPoint);
                if (sp) {
                    this.endX = sp.x;
                    this.endY = sp.y;
                }
            }
        }
        
        // Recalculate waypoints for orthogonal routing
        if (this.connectorStyle === 'orthogonal') {
            this._calculateOrthogonalRoute();
        }
    }
    
    /**
     * Calculate orthogonal routing waypoints
     */
    _calculateOrthogonalRoute() {
        const x1 = this.startX, y1 = this.startY;
        const x2 = this.endX, y2 = this.endY;
        
        this.waypoints = [];
        
        // Simple orthogonal routing: go horizontal then vertical, or vertical then horizontal
        // Choose based on start direction
        const midX = Math.floor((x1 + x2) / 2);
        const midY = Math.floor((y1 + y2) / 2);
        
        if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
            // Prefer horizontal-vertical-horizontal
            this.waypoints = [
                { x: midX, y: y1 },
                { x: midX, y: y2 }
            ];
        } else {
            // Prefer vertical-horizontal-vertical
            this.waypoints = [
                { x: x1, y: midY },
                { x: x2, y: midY }
            ];
        }
    }
    
    getBounds() {
        const allX = [this.startX, this.endX, ...this.waypoints.map(w => w.x)];
        const allY = [this.startY, this.endY, ...this.waypoints.map(w => w.y)];
        const minX = Math.min(...allX);
        const minY = Math.min(...allY);
        const maxX = Math.max(...allX);
        const maxY = Math.max(...allY);
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }
    
    containsPoint(px, py) {
        // Check if point is near any segment of the connector
        const points = [
            { x: this.startX, y: this.startY },
            ...this.waypoints,
            { x: this.endX, y: this.endY }
        ];
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const dist = this._pointToSegmentDistance(px, py, p1.x, p1.y, p2.x, p2.y);
            if (dist <= 1) return true;
        }
        return false;
    }
    
    _pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        
        let xx, yy;
        if (param < 0) {
            xx = x1; yy = y1;
        } else if (param > 1) {
            xx = x2; yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
    }
    
    render(buffer) {
        if (!this.visible) return;
        
        const lineChar = this.lineType === 'dashed' ? '┄' : 
                         this.lineType === 'double' ? '═' : '─';
        
        if (this.connectorStyle === 'orthogonal' && this.waypoints.length > 0) {
            // Draw orthogonal path
            const points = [
                { x: this.startX, y: this.startY },
                ...this.waypoints,
                { x: this.endX, y: this.endY }
            ];
            
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                this._drawSegment(buffer, p1.x, p1.y, p2.x, p2.y);
            }
            
            // Draw corner characters
            for (let i = 1; i < points.length - 1; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                const next = points[i + 1];
                const corner = this._getCornerChar(prev, curr, next);
                buffer.setChar(curr.x, curr.y, corner, this.strokeColor);
            }
        } else {
            // Draw straight line
            drawLine(buffer, this.startX, this.startY, this.endX, this.endY, {
                style: this.lineType === 'dashed' ? 'dashed' : 
                       this.lineType === 'double' ? 'double' : 'single',
                color: this.strokeColor
            });
        }
        
        // Draw arrows
        if (this.arrowEnd) {
            this._drawArrow(buffer, this.endX, this.endY, this._getEndDirection());
        }
        if (this.arrowStart) {
            this._drawArrow(buffer, this.startX, this.startY, this._getStartDirection());
        }
    }
    
    _drawSegment(buffer, x1, y1, x2, y2) {
        if (y1 === y2) {
            // Horizontal line
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const char = this.lineType === 'dashed' ? '┄' : 
                        this.lineType === 'double' ? '═' : '─';
            for (let x = minX; x <= maxX; x++) {
                buffer.setChar(x, y1, char, this.strokeColor);
            }
        } else if (x1 === x2) {
            // Vertical line
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            const char = this.lineType === 'dashed' ? '┆' : 
                        this.lineType === 'double' ? '║' : '│';
            for (let y = minY; y <= maxY; y++) {
                buffer.setChar(x1, y, char, this.strokeColor);
            }
        } else {
            // Diagonal - use regular line drawing
            drawLine(buffer, x1, y1, x2, y2, {
                style: this.lineType === 'dashed' ? 'dashed' : 'single',
                color: this.strokeColor
            });
        }
    }
    
    _getCornerChar(prev, curr, next) {
        const fromLeft = prev.x < curr.x;
        const fromRight = prev.x > curr.x;
        const fromTop = prev.y < curr.y;
        const fromBottom = prev.y > curr.y;
        
        const toLeft = next.x < curr.x;
        const toRight = next.x > curr.x;
        const toTop = next.y < curr.y;
        const toBottom = next.y > curr.y;
        
        // Determine corner type
        if ((fromLeft && toBottom) || (fromBottom && toLeft)) return '┐';
        if ((fromRight && toBottom) || (fromBottom && toRight)) return '┌';
        if ((fromLeft && toTop) || (fromTop && toLeft)) return '┘';
        if ((fromRight && toTop) || (fromTop && toRight)) return '└';
        if ((fromLeft && toRight) || (fromRight && toLeft)) return '─';
        if ((fromTop && toBottom) || (fromBottom && toTop)) return '│';
        
        return '┼';
    }
    
    _getEndDirection() {
        if (this.waypoints.length > 0) {
            const last = this.waypoints[this.waypoints.length - 1];
            if (this.endX > last.x) return 'right';
            if (this.endX < last.x) return 'left';
            if (this.endY > last.y) return 'down';
            if (this.endY < last.y) return 'up';
        }
        if (this.endX > this.startX) return 'right';
        if (this.endX < this.startX) return 'left';
        if (this.endY > this.startY) return 'down';
        return 'up';
    }
    
    _getStartDirection() {
        if (this.waypoints.length > 0) {
            const first = this.waypoints[0];
            if (this.startX > first.x) return 'right';
            if (this.startX < first.x) return 'left';
            if (this.startY > first.y) return 'down';
            if (this.startY < first.y) return 'up';
        }
        if (this.startX > this.endX) return 'right';
        if (this.startX < this.endX) return 'left';
        if (this.startY > this.endY) return 'down';
        return 'up';
    }
    
    _drawArrow(buffer, x, y, direction) {
        const arrows = {
            'right': '▶',
            'left': '◀',
            'down': '▼',
            'up': '▲'
        };
        buffer.setChar(x, y, arrows[direction] || '▶', this.strokeColor);
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            fromShapeId: this.fromShapeId,
            fromSnapPoint: this.fromSnapPoint,
            toShapeId: this.toShapeId,
            toSnapPoint: this.toSnapPoint,
            startX: this.startX,
            startY: this.startY,
            endX: this.endX,
            endY: this.endY,
            connectorStyle: this.connectorStyle,
            lineType: this.lineType,
            arrowStart: this.arrowStart,
            arrowEnd: this.arrowEnd,
            waypoints: this.waypoints
        };
    }
}

/**
 * Flowchart auto-layout engine
 */
class FlowchartLayout {
    constructor() {
        this.horizontalSpacing = 20;
        this.verticalSpacing = 8;
    }
    
    /**
     * Auto-layout flowchart shapes in a top-down hierarchy
     * @param {Array} shapes - Array of FlowchartShape objects
     * @param {Array} connectors - Array of FlowchartConnector objects
     * @param {number} startX - Starting X position
     * @param {number} startY - Starting Y position
     */
    layoutTopDown(shapes, connectors, startX = 10, startY = 5) {
        if (shapes.length === 0) return;
        
        // Build adjacency list from connectors
        const graph = new Map();
        const inDegree = new Map();
        
        for (const shape of shapes) {
            graph.set(shape.id, []);
            inDegree.set(shape.id, 0);
        }
        
        for (const conn of connectors) {
            if (conn.fromShapeId && conn.toShapeId) {
                const edges = graph.get(conn.fromShapeId);
                if (edges) edges.push(conn.toShapeId);
                inDegree.set(conn.toShapeId, (inDegree.get(conn.toShapeId) || 0) + 1);
            }
        }
        
        // Topological sort to determine levels
        const levels = [];
        const queue = [];
        
        for (const [id, degree] of inDegree.entries()) {
            if (degree === 0) queue.push(id);
        }
        
        while (queue.length > 0) {
            const level = [];
            const nextQueue = [];
            
            for (const id of queue) {
                level.push(id);
                const edges = graph.get(id) || [];
                for (const toId of edges) {
                    const newDegree = (inDegree.get(toId) || 0) - 1;
                    inDegree.set(toId, newDegree);
                    if (newDegree === 0) nextQueue.push(toId);
                }
            }
            
            levels.push(level);
            queue.length = 0;
            queue.push(...nextQueue);
        }
        
        // Position shapes by level
        let currentY = startY;
        
        for (const level of levels) {
            const levelShapes = level.map(id => shapes.find(s => s.id === id)).filter(Boolean);
            const totalWidth = levelShapes.reduce((sum, s) => sum + s.width + this.horizontalSpacing, -this.horizontalSpacing);
            let currentX = startX + Math.max(0, (80 - totalWidth) / 2); // Center on assumed 80-char width
            
            let maxHeight = 0;
            for (const shape of levelShapes) {
                shape.x = currentX;
                shape.y = currentY;
                if (shape._updateSnapPoints) shape._updateSnapPoints();
                currentX += shape.width + this.horizontalSpacing;
                maxHeight = Math.max(maxHeight, shape.height);
            }
            
            currentY += maxHeight + this.verticalSpacing;
        }
        
        // Update connector waypoints
        for (const conn of connectors) {
            conn.updateFromShapes(shapes);
        }
    }
    
    /**
     * Auto-layout in left-to-right fashion
     */
    layoutLeftRight(shapes, connectors, startX = 10, startY = 5) {
        // Similar to topDown but swap X and Y logic
        if (shapes.length === 0) return;
        
        const graph = new Map();
        const inDegree = new Map();
        
        for (const shape of shapes) {
            graph.set(shape.id, []);
            inDegree.set(shape.id, 0);
        }
        
        for (const conn of connectors) {
            if (conn.fromShapeId && conn.toShapeId) {
                const edges = graph.get(conn.fromShapeId);
                if (edges) edges.push(conn.toShapeId);
                inDegree.set(conn.toShapeId, (inDegree.get(conn.toShapeId) || 0) + 1);
            }
        }
        
        const levels = [];
        const queue = [];
        
        for (const [id, degree] of inDegree.entries()) {
            if (degree === 0) queue.push(id);
        }
        
        while (queue.length > 0) {
            const level = [];
            const nextQueue = [];
            
            for (const id of queue) {
                level.push(id);
                const edges = graph.get(id) || [];
                for (const toId of edges) {
                    const newDegree = (inDegree.get(toId) || 0) - 1;
                    inDegree.set(toId, newDegree);
                    if (newDegree === 0) nextQueue.push(toId);
                }
            }
            
            levels.push(level);
            queue.length = 0;
            queue.push(...nextQueue);
        }
        
        let currentX = startX;
        
        for (const level of levels) {
            const levelShapes = level.map(id => shapes.find(s => s.id === id)).filter(Boolean);
            let currentY = startY;
            let maxWidth = 0;
            
            for (const shape of levelShapes) {
                shape.x = currentX;
                shape.y = currentY;
                if (shape._updateSnapPoints) shape._updateSnapPoints();
                currentY += shape.height + this.verticalSpacing;
                maxWidth = Math.max(maxWidth, shape.width);
            }
            
            currentX += maxWidth + this.horizontalSpacing;
        }
        
        for (const conn of connectors) {
            conn.updateFromShapes(shapes);
        }
    }
}

/**
 * Flowchart diagram validator
 */
class FlowchartValidator {
    /**
     * Validate a flowchart diagram
     * @param {Array} shapes - Flowchart shapes
     * @param {Array} connectors - Flowchart connectors
     * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
     */
    static validate(shapes, connectors) {
        const errors = [];
        const warnings = [];
        
        // Check for at least one terminal (start)
        const terminals = shapes.filter(s => s.type === 'terminal');
        if (terminals.length === 0) {
            warnings.push('No terminal (Start/End) shapes found');
        }
        
        // Check for orphan shapes (no connections)
        const connectedIds = new Set();
        for (const conn of connectors) {
            if (conn.fromShapeId) connectedIds.add(conn.fromShapeId);
            if (conn.toShapeId) connectedIds.add(conn.toShapeId);
        }
        
        for (const shape of shapes) {
            if (!connectedIds.has(shape.id) && shapes.length > 1) {
                warnings.push(`Shape "${shape.label || shape.name}" is not connected to any other shape`);
            }
        }
        
        // Check decision shapes have at least 2 outgoing connections
        const decisionShapes = shapes.filter(s => s.type === 'decision');
        for (const decision of decisionShapes) {
            const outgoing = connectors.filter(c => c.fromShapeId === decision.id);
            if (outgoing.length < 2) {
                errors.push(`Decision shape "${decision.label || decision.name}" should have at least 2 outgoing paths (Yes/No)`);
            }
        }
        
        // Check for cycles (potential infinite loops)
        const hasCycle = this._detectCycle(shapes, connectors);
        if (hasCycle) {
            warnings.push('Flowchart contains a cycle (loop). Make sure this is intentional.');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    static _detectCycle(shapes, connectors) {
        const visited = new Set();
        const recStack = new Set();
        
        const graph = new Map();
        for (const shape of shapes) {
            graph.set(shape.id, []);
        }
        for (const conn of connectors) {
            if (conn.fromShapeId && conn.toShapeId) {
                const edges = graph.get(conn.fromShapeId);
                if (edges) edges.push(conn.toShapeId);
            }
        }
        
        const dfs = (id) => {
            visited.add(id);
            recStack.add(id);
            
            const neighbors = graph.get(id) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (dfs(neighbor)) return true;
                } else if (recStack.has(neighbor)) {
                    return true;
                }
            }
            
            recStack.delete(id);
            return false;
        };
        
        for (const shape of shapes) {
            if (!visited.has(shape.id)) {
                if (dfs(shape.id)) return true;
            }
        }
        
        return false;
    }
}

/**
 * Flowchart templates
 */
const FlowchartTemplates = {
    /**
     * Simple linear process
     */
    linearProcess: (app) => {
        const start = new TerminalShape(40, 2, 12, 3);
        start.label = 'Start';
        start.name = 'Start';
        app.addObject(start);
        
        const process1 = new ProcessShape(38, 8, 16, 5);
        process1.label = 'Process 1';
        process1.name = 'Process 1';
        app.addObject(process1);
        
        const process2 = new ProcessShape(38, 16, 16, 5);
        process2.label = 'Process 2';
        process2.name = 'Process 2';
        app.addObject(process2);
        
        const end = new TerminalShape(40, 24, 12, 3);
        end.label = 'End';
        end.name = 'End';
        app.addObject(end);
        
        // Connectors
        const conn1 = new FlowchartConnector();
        conn1.setFromShape(start, 'bottom');
        conn1.setToShape(process1, 'top');
        conn1.connectorStyle = 'orthogonal';
        app.addObject(conn1);
        
        const conn2 = new FlowchartConnector();
        conn2.setFromShape(process1, 'bottom');
        conn2.setToShape(process2, 'top');
        conn2.connectorStyle = 'orthogonal';
        app.addObject(conn2);
        
        const conn3 = new FlowchartConnector();
        conn3.setFromShape(process2, 'bottom');
        conn3.setToShape(end, 'top');
        conn3.connectorStyle = 'orthogonal';
        app.addObject(conn3);
    },
    
    /**
     * Decision flowchart
     */
    decisionFlow: (app) => {
        const start = new TerminalShape(40, 2, 12, 3);
        start.label = 'Start';
        app.addObject(start);
        
        const input = new IOShape(37, 8, 18, 5);
        input.label = 'Input X';
        app.addObject(input);
        
        const decision = new DecisionShape(36, 16, 20, 7);
        decision.label = 'X > 0?';
        app.addObject(decision);
        
        const yesProcess = new ProcessShape(15, 26, 16, 5);
        yesProcess.label = 'Positive';
        app.addObject(yesProcess);
        
        const noProcess = new ProcessShape(60, 26, 16, 5);
        noProcess.label = 'Negative';
        app.addObject(noProcess);
        
        const end = new TerminalShape(40, 34, 12, 3);
        end.label = 'End';
        app.addObject(end);
        
        // Connectors
        const c1 = new FlowchartConnector();
        c1.setFromShape(start, 'bottom');
        c1.setToShape(input, 'top');
        c1.connectorStyle = 'orthogonal';
        app.addObject(c1);
        
        const c2 = new FlowchartConnector();
        c2.setFromShape(input, 'bottom');
        c2.setToShape(decision, 'top');
        c2.connectorStyle = 'orthogonal';
        app.addObject(c2);
        
        const c3 = new FlowchartConnector();
        c3.setFromShape(decision, 'left');
        c3.setToShape(yesProcess, 'top');
        c3.connectorStyle = 'orthogonal';
        app.addObject(c3);
        
        const c4 = new FlowchartConnector();
        c4.setFromShape(decision, 'right');
        c4.setToShape(noProcess, 'top');
        c4.connectorStyle = 'orthogonal';
        app.addObject(c4);
        
        const c5 = new FlowchartConnector();
        c5.setFromShape(yesProcess, 'bottom');
        c5.setToShape(end, 'left');
        c5.connectorStyle = 'orthogonal';
        app.addObject(c5);
        
        const c6 = new FlowchartConnector();
        c6.setFromShape(noProcess, 'bottom');
        c6.setToShape(end, 'right');
        c6.connectorStyle = 'orthogonal';
        app.addObject(c6);
    }
};

// ==========================================
// APPLICATION STATE
// ==========================================


/**
 * Global application state
 */
const AppState = {
    // Canvas settings
    canvasWidth: 120,
    canvasHeight: 40,
    aspectRatio: 2, // Character aspect ratio (height/width)
    
    // Viewport
    zoom: 1,
    panX: 0,
    panY: 0,
    
    // Current tool
    activeTool: 'select',
    
    // Selection
    selectedObjects: [],
    
    // Drawing settings
    strokeChar: '*',
    fillChar: '█',
    strokeColor: null,
    fillColor: null,
    lineStyle: 'single',
    
    // Grid
    showGrid: true,
    snapToGrid: true,
    gridSize: 1,
    
    // Layers
    layers: [],
    activeLayerId: null,
    
    // History
    undoStack: [],
    redoStack: [],
    maxHistorySize: 50,
    
    // Clipboard
    clipboard: [],
    
    // Theme
    theme: 'dark',
    
    // Palettes
    activePalette: 'standard',
    
    // Document
    document: null,
    modified: false,
    filename: 'untitled.asc'
};

// ==========================================
// ASCII CANVAS RENDERER
// ==========================================

/**
 * ASCII Canvas Renderer
 * Manages the ASCII display canvas with pan and zoom support
 */
class AsciiCanvasRenderer extends EventEmitter {
    constructor(container) {
        super();
        
        this.container = container;
        this.buffer = new AsciiBuffer(AppState.canvasWidth, AppState.canvasHeight);
        this.previewBuffer = new AsciiBuffer(AppState.canvasWidth, AppState.canvasHeight);
        
        this.element = null;
        this.viewport = null;
        this.wrapper = null;
        this.cursorX = 0;
        this.cursorY = 0;
        
        // Character dimensions (will be measured)
        this.charWidth = 0;
        this.charHeight = 0;
        
        // Pan and zoom state
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.minZoom = 0.25;
        this.maxZoom = 4;
        
        // Panning state
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.panStartPanX = 0;
        this.panStartPanY = 0;
        
        // Pointer tracking for multi-touch
        this.activePointers = new Map();
        this.lastPinchDistance = 0;
        
        // Scrollbar elements
        this.hScrollbar = null;
        this.hScrollThumb = null;
        this.vScrollbar = null;
        this.vScrollThumb = null;
        this.isDraggingScrollbar = false;
        
        // Dirty region tracking for optimized rendering
        this._dirtyRegions = [];
        this._fullRedrawNeeded = true;
        this._lastRenderedHTML = '';
        
        this._init();
    }
    
    _init() {
        // Get viewport and wrapper elements
        this.viewport = $('#viewport');
        this.wrapper = $('#canvas-wrapper');
        
        // Use existing ascii-canvas element or create a new one
        this.element = $('#ascii-canvas');
        
        if (!this.element) {
            // Fallback: create canvas display element
            this.element = createElement('pre', {
                class: 'ascii-canvas-display',
                id: 'ascii-canvas',
                style: {
                    fontFamily: 'monospace',
                    lineHeight: '1',
                    margin: '0',
                    padding: '0',
                    userSelect: 'none',
                    cursor: 'crosshair'
                }
            });
            this.container.appendChild(this.element);
        }
        // Don't override CSS styles - let the stylesheet handle font, line-height, padding
        
        // Create grid overlay element
        this.gridOverlay = createElement('div', { class: 'grid-overlay' });
        if (this.wrapper) {
            this.wrapper.appendChild(this.gridOverlay);
        }
        
        // Initialize scrollbars
        this._initScrollbars();
        
        // Measure character dimensions
        this._measureCharDimensions();
        
        // Add pointer event listeners to viewport for pan/zoom
        if (this.viewport) {
            this.viewport.addEventListener('pointerdown', this._onPointerDown.bind(this));
            this.viewport.addEventListener('pointermove', this._onPointerMove.bind(this));
            this.viewport.addEventListener('pointerup', this._onPointerUp.bind(this));
            this.viewport.addEventListener('pointercancel', this._onPointerUp.bind(this));
            this.viewport.addEventListener('pointerleave', this._onPointerLeave.bind(this));
            this.viewport.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
            this.viewport.addEventListener('contextmenu', e => e.preventDefault());
        }
        
        // Initial render and transform
        this.render();
        
        // Center canvas on initial load (defer to allow DOM to settle)
        requestAnimationFrame(() => {
            this._centerCanvas();
        });
    }
    
    /**
     * Center the canvas in the viewport
     */
    _centerCanvas() {
        if (!this.viewport) {
            this._updateTransform();
            return;
        }
        
        const viewportRect = this.viewport.getBoundingClientRect();
        const base = this.getBaseCanvasSize();
        
        // Center the canvas
        this.panX = Math.max(0, (viewportRect.width - base.width) / 2);
        this.panY = Math.max(0, (viewportRect.height - base.height) / 2);
        
        this._updateTransform();
    }
    
    /**
     * Initialize custom scrollbars
     */
    _initScrollbars() {
        this.hScrollbar = $('#scrollbar-horizontal');
        this.vScrollbar = $('#scrollbar-vertical');
        
        if (this.hScrollbar) {
            this.hScrollThumb = this.hScrollbar.querySelector('.scrollbar-thumb');
            this.hScrollbar.addEventListener('pointerdown', this._onHScrollbarDown.bind(this));
        }
        
        if (this.vScrollbar) {
            this.vScrollThumb = this.vScrollbar.querySelector('.scrollbar-thumb');
            this.vScrollbar.addEventListener('pointerdown', this._onVScrollbarDown.bind(this));
        }
    }
    
    /**
     * Measure character dimensions by creating a test element
     */
    _measureCharDimensions() {
        // Create a hidden measuring element that matches the canvas styles
        const computedStyle = getComputedStyle(this.element);
        const measure = document.createElement('span');
        measure.style.cssText = `
            position: absolute;
            visibility: hidden;
            font-family: ${computedStyle.fontFamily};
            font-size: 14px;
            white-space: pre;
        `;
        measure.textContent = 'X';
        document.body.appendChild(measure);
        
        // Store base dimensions (at zoom = 1, font-size = 14px)
        this._baseCharWidth = measure.getBoundingClientRect().width;
        this._baseCharHeight = 14; // 14px font-size with line-height: 1
        
        // Current dimensions (will be updated by _updateTransform)
        this.charWidth = this._baseCharWidth * this.zoom;
        this.charHeight = this._baseCharHeight * this.zoom;
        
        document.body.removeChild(measure);
        
        // Fallback if measurement failed
        if (this._baseCharWidth === 0) this._baseCharWidth = 8.4;
        if (this._baseCharHeight === 0) this._baseCharHeight = 14;
        this.charWidth = this._baseCharWidth * this.zoom;
        this.charHeight = this._baseCharHeight * this.zoom;
    }
    
    /**
     * Convert pointer coordinates to canvas coordinates
     * @param {PointerEvent} event 
     * @returns {{x: number, y: number}}
     */
    pointerToCanvas(event) {
        if (!this.viewport || !this.element) {
            return { x: 0, y: 0 };
        }
        
        const viewportRect = this.viewport.getBoundingClientRect();
        
        // Get pointer position relative to viewport
        const viewportX = event.clientX - viewportRect.left;
        const viewportY = event.clientY - viewportRect.top;
        
        // Since we use font-size scaling (no transform scale), we only need to undo translation
        // Transform is: translate(panX, panY) - no scale
        const wrapperX = viewportX - this.panX;
        const wrapperY = viewportY - this.panY;
        
        // Get canvas element offset within wrapper (border)
        const computedStyle = getComputedStyle(this.element);
        const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
        const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 16;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 16;
        
        // Wrapper contains canvas at position (0,0), so wrapperX/Y is relative to canvas top-left
        // Account for border and padding to get content area
        const contentX = wrapperX - borderLeft - paddingLeft;
        const contentY = wrapperY - borderTop - paddingTop;
        
        // Convert to character coordinates using current (zoomed) char dimensions
        const x = Math.floor(contentX / this.charWidth);
        const y = Math.floor(contentY / this.charHeight);
        
        return {
            x: clamp(x, 0, AppState.canvasWidth - 1),
            y: clamp(y, 0, AppState.canvasHeight - 1)
        };
    }
    
    // Alias for backwards compatibility
    mouseToCanvas(event) {
        return this.pointerToCanvas(event);
    }
    
    /**
     * Get canvas size in pixels at zoom=1 (base size)
     */
    getBaseCanvasSize() {
        // Default values
        let paddingH = 32; // 16px * 2
        let paddingV = 32;
        let borderH = 2;   // 1px * 2
        let borderV = 2;
        
        if (this.element) {
            const cs = getComputedStyle(this.element);
            paddingH = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
            paddingV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
            borderH = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
            borderV = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
        }
        
        // Use base char dimensions (at zoom=1)
        const baseCharW = this._baseCharWidth || 8.4;
        const baseCharH = this._baseCharHeight || 14;
        
        return {
            width: AppState.canvasWidth * baseCharW + paddingH + borderH,
            height: AppState.canvasHeight * baseCharH + paddingV + borderV
        };
    }
    
    /**
     * Get canvas size in pixels (with zoom applied - actual current size)
     */
    getCanvasSize() {
        // Default values
        let paddingH = 32;
        let paddingV = 32;
        let borderH = 2;
        let borderV = 2;
        
        if (this.element) {
            const cs = getComputedStyle(this.element);
            paddingH = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
            paddingV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
            borderH = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
            borderV = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
        }
        
        // Since we use font-size scaling, charWidth/charHeight already include zoom
        return {
            width: AppState.canvasWidth * this.charWidth + paddingH + borderH,
            height: AppState.canvasHeight * this.charHeight + paddingV + borderV
        };
    }
    
    /**
     * Update the canvas transform (pan and zoom)
     */
    _updateTransform() {
        if (!this.wrapper) return;
        
        // Use font-size scaling for crisp text instead of transform scale
        const baseFontSize = 14; // Base font size in px
        const scaledFontSize = baseFontSize * this.zoom;
        
        // Apply font-size to canvas element for crisp text
        this.element.style.fontSize = `${scaledFontSize}px`;
        
        // Apply only translation transform (no scale)
        this.wrapper.style.transform = `translate(${this.panX}px, ${this.panY}px)`;
        
        // Update character dimensions based on new font size
        this.charWidth = this._baseCharWidth * this.zoom;
        this.charHeight = scaledFontSize; // Matches line-height: 1
        
        // Update grid overlay for new zoom level
        this._updateGridOverlay();
        
        // Update scrollbars
        this._updateScrollbars();
        
        // Update AppState
        AppState.zoom = this.zoom;
        AppState.panX = this.panX;
        AppState.panY = this.panY;
        
        // Update status bar zoom
        this._updateZoomStatus();
        
        // Emit transform event for rulers and other listeners
        this.emit('transform', { zoom: this.zoom, panX: this.panX, panY: this.panY });
    }
    
    /**
     * Update scrollbar thumb positions and sizes
     */
    _updateScrollbars() {
        if (!this.viewport || !this.hScrollbar || !this.vScrollbar) return;
        
        const viewportRect = this.viewport.getBoundingClientRect();
        const canvasSize = this.getCanvasSize();
        
        // Calculate visible ratio
        const hRatio = viewportRect.width / canvasSize.width;
        const vRatio = viewportRect.height / canvasSize.height;
        
        // Show/hide scrollbars based on whether content overflows
        const needsHScroll = hRatio < 1;
        const needsVScroll = vRatio < 1;
        
        this.hScrollbar.classList.toggle('visible', needsHScroll);
        this.vScrollbar.classList.toggle('visible', needsVScroll);
        
        if (needsHScroll && this.hScrollThumb) {
            const thumbWidth = Math.max(30, viewportRect.width * hRatio);
            const maxScroll = canvasSize.width - viewportRect.width;
            const scrollRatio = maxScroll > 0 ? -this.panX / maxScroll : 0;
            const trackWidth = viewportRect.width - thumbWidth;
            
            this.hScrollThumb.style.width = `${thumbWidth}px`;
            this.hScrollThumb.style.left = `${scrollRatio * trackWidth}px`;
        }
        
        if (needsVScroll && this.vScrollThumb) {
            const thumbHeight = Math.max(30, viewportRect.height * vRatio);
            const maxScroll = canvasSize.height - viewportRect.height;
            const scrollRatio = maxScroll > 0 ? -this.panY / maxScroll : 0;
            const trackHeight = viewportRect.height - thumbHeight;
            
            this.vScrollThumb.style.height = `${thumbHeight}px`;
            this.vScrollThumb.style.top = `${scrollRatio * trackHeight}px`;
        }
    }
    
    /**
     * Constrain pan values to keep canvas within viewport
     * @param {boolean} [soft=false] - If true, use softer constraints for zoom operations
     */
    _constrainPan(soft = false) {
        if (!this.viewport) return;
        
        const viewportRect = this.viewport.getBoundingClientRect();
        const canvasSize = this.getCanvasSize();
        
        // Allow some padding when panning
        const padding = soft ? 200 : 50;
        
        // Calculate min/max pan values
        // When canvas is smaller than viewport, center it
        if (canvasSize.width <= viewportRect.width) {
            // Allow free movement when zoomed out
            const minPanX = -padding;
            const maxPanX = viewportRect.width - canvasSize.width + padding;
            this.panX = clamp(this.panX, minPanX, maxPanX);
        } else {
            // Canvas is larger than viewport
            const minPanX = viewportRect.width - canvasSize.width - padding;
            const maxPanX = padding;
            this.panX = clamp(this.panX, minPanX, maxPanX);
        }
        
        if (canvasSize.height <= viewportRect.height) {
            const minPanY = -padding;
            const maxPanY = viewportRect.height - canvasSize.height + padding;
            this.panY = clamp(this.panY, minPanY, maxPanY);
        } else {
            const minPanY = viewportRect.height - canvasSize.height - padding;
            const maxPanY = padding;
            this.panY = clamp(this.panY, minPanY, maxPanY);
        }
    }
    
    /**
     * Set zoom level
     * @param {number} newZoom - New zoom level
     * @param {number} [centerX] - Center point X in viewport coordinates
     * @param {number} [centerY] - Center point Y in viewport coordinates
     */
    setZoom(newZoom, centerX, centerY) {
        const oldZoom = this.zoom;
        const clampedZoom = clamp(newZoom, this.minZoom, this.maxZoom);
        
        // If no actual zoom change, skip
        if (clampedZoom === oldZoom) return;
        
        // If center point provided, zoom toward that point
        if (centerX !== undefined && centerY !== undefined) {
            // The point under cursor in canvas content space (before any transforms)
            // Formula: contentPoint = (viewportPoint - pan) / zoom
            const contentX = (centerX - this.panX) / oldZoom;
            const contentY = (centerY - this.panY) / oldZoom;
            
            // Apply new zoom
            this.zoom = clampedZoom;
            
            // Calculate new pan to keep the same content point under cursor
            // Formula: pan = viewportPoint - contentPoint * zoom
            this.panX = centerX - contentX * this.zoom;
            this.panY = centerY - contentY * this.zoom;
        } else {
            this.zoom = clampedZoom;
        }
        
        // Use soft constraints during zoom to allow zoom-to-point to work
        this._constrainPan(true);
        this._updateTransform();
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        if (!this.viewport) {
            this.setZoom(this.zoom * 1.25);
            return;
        }
        const viewportRect = this.viewport.getBoundingClientRect();
        // Zoom toward center of viewport
        this.setZoom(this.zoom * 1.25, viewportRect.width / 2, viewportRect.height / 2);
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        if (!this.viewport) {
            this.setZoom(this.zoom / 1.25);
            return;
        }
        const viewportRect = this.viewport.getBoundingClientRect();
        // Zoom toward center of viewport
        this.setZoom(this.zoom / 1.25, viewportRect.width / 2, viewportRect.height / 2);
    }
    
    /**
     * Reset zoom to 100%
     */
    zoomReset() {
        if (!this.viewport) {
            this.zoom = 1;
            this.panX = 0;
            this.panY = 0;
            this._updateTransform();
            return;
        }
        
        // Reset to 100% and center the canvas
        const viewportRect = this.viewport.getBoundingClientRect();
        const base = this.getBaseCanvasSize();
        
        this.zoom = 1;
        this.panX = Math.max(0, (viewportRect.width - base.width) / 2);
        this.panY = Math.max(0, (viewportRect.height - base.height) / 2);
        
        this._updateTransform();
    }
    
    /**
     * Fit canvas to viewport
     */
    zoomFit() {
        if (!this.viewport) return;
        
        const viewportRect = this.viewport.getBoundingClientRect();
        const base = this.getBaseCanvasSize();
        
        // Calculate zoom to fit with some margin
        const margin = 40;
        const zoomX = (viewportRect.width - margin) / base.width;
        const zoomY = (viewportRect.height - margin) / base.height;
        this.zoom = clamp(Math.min(zoomX, zoomY), this.minZoom, this.maxZoom);
        
        // Center the canvas
        const scaledWidth = base.width * this.zoom;
        const scaledHeight = base.height * this.zoom;
        this.panX = (viewportRect.width - scaledWidth) / 2;
        this.panY = (viewportRect.height - scaledHeight) / 2;
        
        this._updateTransform();
    }
    
    /**
     * Handle pointer down event
     */
    _onPointerDown(event) {
        // Track pointer
        this.activePointers.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
            pointerType: event.pointerType
        });
        
        // Capture pointer for reliable tracking
        this.viewport.setPointerCapture(event.pointerId);
        
        // Check for pan mode (middle mouse button, space+click, or two-finger touch)
        const isPanButton = event.button === 1; // Middle mouse
        const isSpacePan = event.button === 0 && this._spacePressed;
        const isTwoFingerTouch = this.activePointers.size === 2;
        
        if (isPanButton || isSpacePan || isTwoFingerTouch) {
            this.isPanning = true;
            this.panStartX = event.clientX;
            this.panStartY = event.clientY;
            this.panStartPanX = this.panX;
            this.panStartPanY = this.panY;
            
            if (isTwoFingerTouch) {
                // Setup for pinch-to-zoom
                const pointers = Array.from(this.activePointers.values());
                this.lastPinchDistance = this._getDistance(pointers[0], pointers[1]);
                // Calculate initial center for panning
                this.panStartX = (pointers[0].x + pointers[1].x) / 2;
                this.panStartY = (pointers[0].y + pointers[1].y) / 2;
            }
            
            this.viewport.classList.add('panning');
            event.preventDefault();
            return;
        }
        
        // Regular drawing/selection interaction (single touch or mouse click)
        // Touch events have button=0, pointerType='touch'
        const isLeftClick = event.button === 0;
        const isRightClick = event.button === 2;
        const isTouch = event.pointerType === 'touch';
        
        if (isLeftClick || isRightClick || isTouch) {
            const pos = this.pointerToCanvas(event);
            // For touch, treat as left click (button 0)
            const button = isTouch ? 0 : event.button;
            this.emit('mousedown', { ...pos, button, event, isTouch });
        }
    }
    
    /**
     * Handle pointer move event
     */
    _onPointerMove(event) {
        // Update tracked pointer position
        if (this.activePointers.has(event.pointerId)) {
            const existing = this.activePointers.get(event.pointerId);
            this.activePointers.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY,
                pointerType: existing?.pointerType || event.pointerType
            });
        }
        
        if (this.isPanning) {
            if (this.activePointers.size === 2) {
                // Pinch-to-zoom
                const pointers = Array.from(this.activePointers.values());
                const currentDistance = this._getDistance(pointers[0], pointers[1]);
                
                if (this.lastPinchDistance > 0) {
                    const scale = currentDistance / this.lastPinchDistance;
                    const centerX = (pointers[0].x + pointers[1].x) / 2;
                    const centerY = (pointers[0].y + pointers[1].y) / 2;
                    const viewportRect = this.viewport.getBoundingClientRect();
                    
                    this.setZoom(
                        this.zoom * scale,
                        centerX - viewportRect.left,
                        centerY - viewportRect.top
                    );
                }
                
                this.lastPinchDistance = currentDistance;
                
                // Also pan with two fingers
                const avgX = (pointers[0].x + pointers[1].x) / 2;
                const avgY = (pointers[0].y + pointers[1].y) / 2;
                const deltaX = avgX - this.panStartX;
                const deltaY = avgY - this.panStartY;
                
                this.panX = this.panStartPanX + deltaX;
                this.panY = this.panStartPanY + deltaY;
                this._constrainPan();
                this._updateTransform();
                
                this.panStartX = avgX;
                this.panStartY = avgY;
                this.panStartPanX = this.panX;
                this.panStartPanY = this.panY;
            } else {
                // Single pointer pan (only for space+drag or middle mouse, not touch)
                const deltaX = event.clientX - this.panStartX;
                const deltaY = event.clientY - this.panStartY;
                
                this.panX = this.panStartPanX + deltaX;
                this.panY = this.panStartPanY + deltaY;
                this._constrainPan();
                this._updateTransform();
            }
            return;
        }
        
        // Regular drawing/selection interaction
        const pos = this.pointerToCanvas(event);
        this.cursorX = pos.x;
        this.cursorY = pos.y;
        const isTouch = event.pointerType === 'touch';
        this.emit('mousemove', { ...pos, event, isTouch });
        this._updateStatusBar();
    }
    
    /**
     * Handle pointer up event
     */
    _onPointerUp(event) {
        // Release pointer capture
        try {
            this.viewport.releasePointerCapture(event.pointerId);
        } catch (e) {
            // Ignore errors if pointer was never captured
        }
        
        // Get pointer info before removing
        const pointerInfo = this.activePointers.get(event.pointerId);
        const isTouch = pointerInfo?.pointerType === 'touch' || event.pointerType === 'touch';
        
        // Remove from tracked pointers
        this.activePointers.delete(event.pointerId);
        
        if (this.isPanning) {
            if (this.activePointers.size === 0) {
                this.isPanning = false;
                this.viewport.classList.remove('panning');
            } else if (this.activePointers.size === 1) {
                // Went from 2 fingers to 1, stop panning but don't start drawing
                this.isPanning = false;
                this.viewport.classList.remove('panning');
            }
            this.lastPinchDistance = 0;
            return;
        }
        
        // Regular drawing/selection interaction
        const pos = this.pointerToCanvas(event);
        const button = isTouch ? 0 : event.button;
        this.emit('mouseup', { ...pos, button, event, isTouch });
    }
    
    /**
     * Handle pointer leave event
     */
    _onPointerLeave(event) {
        if (!this.isPanning) {
            this.emit('mouseleave', { event });
        }
    }
    
    /**
     * Handle wheel event for zoom
     */
    _onWheel(event) {
        event.preventDefault();
        
        // Ctrl+wheel or pinch gesture for zoom
        if (event.ctrlKey || event.metaKey) {
            const viewportRect = this.viewport.getBoundingClientRect();
            const centerX = event.clientX - viewportRect.left;
            const centerY = event.clientY - viewportRect.top;
            
            // Calculate new zoom
            const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
            this.setZoom(this.zoom * zoomFactor, centerX, centerY);
        } else {
            // Regular scroll for panning
            this.panX -= event.deltaX;
            this.panY -= event.deltaY;
            this._constrainPan();
            this._updateTransform();
        }
    }
    
    /**
     * Handle horizontal scrollbar interaction
     */
    _onHScrollbarDown(event) {
        if (!this.hScrollThumb) return;
        
        const thumbRect = this.hScrollThumb.getBoundingClientRect();
        const clickedOnThumb = event.clientX >= thumbRect.left && event.clientX <= thumbRect.right;
        
        if (clickedOnThumb) {
            // Start dragging thumb
            this.isDraggingScrollbar = true;
            this.scrollDragStartX = event.clientX;
            this.scrollDragStartPanX = this.panX;
            this.hScrollThumb.classList.add('active');
            this.hScrollbar.classList.add('dragging');
            
            const onMove = (e) => {
                const viewportRect = this.viewport.getBoundingClientRect();
                const canvasSize = this.getCanvasSize();
                const maxScroll = canvasSize.width - viewportRect.width;
                const thumbWidth = parseFloat(this.hScrollThumb.style.width) || 30;
                const trackWidth = viewportRect.width - thumbWidth;
                
                const deltaX = e.clientX - this.scrollDragStartX;
                const scrollDelta = (deltaX / trackWidth) * maxScroll;
                this.panX = clamp(this.scrollDragStartPanX - scrollDelta, -maxScroll, 0);
                this._updateTransform();
            };
            
            const onUp = () => {
                this.isDraggingScrollbar = false;
                this.hScrollThumb.classList.remove('active');
                this.hScrollbar.classList.remove('dragging');
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
            };
            
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
        } else {
            // Click on track - jump to position
            const trackRect = this.hScrollbar.getBoundingClientRect();
            const viewportRect = this.viewport.getBoundingClientRect();
            const canvasSize = this.getCanvasSize();
            const maxScroll = canvasSize.width - viewportRect.width;
            const ratio = (event.clientX - trackRect.left) / trackRect.width;
            this.panX = -ratio * maxScroll;
            this._constrainPan();
            this._updateTransform();
        }
        
        event.preventDefault();
    }
    
    /**
     * Handle vertical scrollbar interaction
     */
    _onVScrollbarDown(event) {
        if (!this.vScrollThumb) return;
        
        const thumbRect = this.vScrollThumb.getBoundingClientRect();
        const clickedOnThumb = event.clientY >= thumbRect.top && event.clientY <= thumbRect.bottom;
        
        if (clickedOnThumb) {
            // Start dragging thumb
            this.isDraggingScrollbar = true;
            this.scrollDragStartY = event.clientY;
            this.scrollDragStartPanY = this.panY;
            this.vScrollThumb.classList.add('active');
            this.vScrollbar.classList.add('dragging');
            
            const onMove = (e) => {
                const viewportRect = this.viewport.getBoundingClientRect();
                const canvasSize = this.getCanvasSize();
                const maxScroll = canvasSize.height - viewportRect.height;
                const thumbHeight = parseFloat(this.vScrollThumb.style.height) || 30;
                const trackHeight = viewportRect.height - thumbHeight;
                
                const deltaY = e.clientY - this.scrollDragStartY;
                const scrollDelta = (deltaY / trackHeight) * maxScroll;
                this.panY = clamp(this.scrollDragStartPanY - scrollDelta, -maxScroll, 0);
                this._updateTransform();
            };
            
            const onUp = () => {
                this.isDraggingScrollbar = false;
                this.vScrollThumb.classList.remove('active');
                this.vScrollbar.classList.remove('dragging');
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
            };
            
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
        } else {
            // Click on track - jump to position
            const trackRect = this.vScrollbar.getBoundingClientRect();
            const viewportRect = this.viewport.getBoundingClientRect();
            const canvasSize = this.getCanvasSize();
            const maxScroll = canvasSize.height - viewportRect.height;
            const ratio = (event.clientY - trackRect.top) / trackRect.height;
            this.panY = -ratio * maxScroll;
            this._constrainPan();
            this._updateTransform();
        }
        
        event.preventDefault();
    }
    
    /**
     * Calculate distance between two points
     */
    _getDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Update zoom display in status bar
     */
    _updateZoomStatus() {
        const zoomElement = $('#status-zoom');
        if (zoomElement) {
            zoomElement.textContent = `Zoom: ${Math.round(this.zoom * 100)}%`;
        }
    }
    
    _updateStatusBar() {
        const posElement = $('#status-position');
        if (posElement) {
            posElement.textContent = `Pos: (${this.cursorX}, ${this.cursorY})`;
        }
    }
    
    /**
     * Clear the buffer
     */
    clear() {
        this.buffer.clear();
    }
    
    /**
     * Clear the preview buffer
     */
    clearPreview() {
        this.previewBuffer.clear();
    }
    
    /**
     * Mark a region as dirty (needs re-render)
     * @param {number} x 
     * @param {number} y 
     * @param {number} [width=1] 
     * @param {number} [height=1] 
     */
    markDirty(x, y, width = 1, height = 1) {
        this._dirtyRegions.push({ x, y, width, height });
        // Merge if too many small regions
        if (this._dirtyRegions.length > 50) {
            this._fullRedrawNeeded = true;
            this._dirtyRegions = [];
        }
    }
    
    /**
     * Mark entire canvas as dirty
     */
    markFullDirty() {
        this._fullRedrawNeeded = true;
        this._dirtyRegions = [];
    }
    
    /**
     * Render the canvas - optimized for performance
     * @param {boolean} [syncLayer=true] - Whether to sync buffer to active layer
     */
    render(syncLayer = true) {
        // Sync to active layer before rendering (keeps layers in sync with drawing)
        if (syncLayer && this._syncCallback) {
            this._syncCallback();
        }
        
        // Use requestAnimationFrame to batch renders
        if (this._renderPending) return;
        this._renderPending = true;
        
        requestAnimationFrame(() => {
            this._renderPending = false;
            this._doRender();
            // Reset dirty state after render
            this._fullRedrawNeeded = false;
            this._dirtyRegions = [];
        });
    }
    
    /**
     * Force immediate render (bypasses requestAnimationFrame)
     */
    renderImmediate() {
        if (this._syncCallback) {
            this._syncCallback();
        }
        this._doRender();
        this._fullRedrawNeeded = false;
        this._dirtyRegions = [];
    }
    
    /**
     * Set callback for syncing buffer to active layer
     * @param {Function} callback 
     */
    setSyncCallback(callback) {
        this._syncCallback = callback;
    }
    
    _doRender() {
        const width = this.buffer.width;
        const height = this.buffer.height;
        
        // Cache buffer arrays
        const mainChars = this.buffer.chars;
        const mainColors = this.buffer.colors;
        const previewChars = this.previewBuffer.chars;
        const previewColors = this.previewBuffer.colors;
        
        // Build rows
        const rows = [];
        
        for (let y = 0; y < height; y++) {
            const mainRow = mainChars[y];
            const mainColorRow = mainColors[y];
            const previewRow = previewChars[y];
            const previewColorRow = previewColors[y];
            
            const parts = [];
            let color = null;
            let batch = '';
            
            for (let x = 0; x < width; x++) {
                const pc = previewRow[x];
                const hasP = pc !== ' ';
                const ch = hasP ? pc : mainRow[x];
                const col = hasP ? previewColorRow[x] : mainColorRow[x];
                
                // Color change - flush batch
                if (col !== color) {
                    if (batch) {
                        parts.push(color ? `<span style="color:${color}">${batch}</span>` : batch);
                        batch = '';
                    }
                    color = col;
                }
                
                // Escape and append
                batch += ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch;
            }
            
            // Flush remaining
            if (batch) {
                parts.push(color ? `<span style="color:${color}">${batch}</span>` : batch);
            }
            
            rows.push(parts.join(''));
        }
        
        const result = rows.join('\n');
        
        if (result !== this._lastRenderedHTML) {
            this.element.innerHTML = result;
            this._lastRenderedHTML = result;
        }
        
        // Update CSS grid overlay
        this._updateGridOverlay();
    }
    
    _updateGridOverlay() {
        if (!this.gridOverlay) return;
        
        if (AppState.showGrid) {
            const spacing = AppState.gridSize || 5;
            const charW = this.charWidth;
            const charH = this.charHeight;
            const dotSize = Math.max(1, Math.min(charW, charH) * 0.12);
            
            // Position grid over content area (inside padding/border)
            const cs = this.element ? getComputedStyle(this.element) : null;
            const padL = cs ? parseFloat(cs.paddingLeft) || 0 : 16;
            const padT = cs ? parseFloat(cs.paddingTop) || 0 : 16;
            const borderL = cs ? parseFloat(cs.borderLeftWidth) || 0 : 1;
            const borderT = cs ? parseFloat(cs.borderTopWidth) || 0 : 1;
            
            // Create SVG pattern for grid dots
            const cellW = spacing * charW;
            const cellH = spacing * charH;
            
            // Content dimensions
            const contentW = AppState.canvasWidth * charW;
            const contentH = AppState.canvasHeight * charH;
            
            this.gridOverlay.style.left = `${borderL + padL}px`;
            this.gridOverlay.style.top = `${borderT + padT}px`;
            this.gridOverlay.style.width = `${contentW}px`;
            this.gridOverlay.style.height = `${contentH}px`;
            this.gridOverlay.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${cellW}' height='${cellH}'%3E%3Ccircle cx='${charW/2}' cy='${charH/2}' r='${dotSize}' fill='%23888'/%3E%3C/svg%3E")`;
            this.gridOverlay.style.backgroundSize = `${cellW}px ${cellH}px`;
            this.gridOverlay.style.display = 'block';
        } else {
            this.gridOverlay.style.display = 'none';
        }
    }

    /**
     * Resize the canvas
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        this.buffer.resize(width, height);
        this.previewBuffer.resize(width, height);
        AppState.canvasWidth = width;
        AppState.canvasHeight = height;
        this.render();
    }

    /**
     * Get buffer as string
     * @returns {string}
     */
    toString() {
        return this.buffer.toString();
    }
    
    /**
     * Export as text
     * @returns {string}
     */
    exportText() {
        return this.buffer.toString();
    }
    
    /**
     * Export as HTML
     * @returns {string}
     */
    exportHTML() {
        return this.buffer.toHTML();
    }
}

// ==========================================
// TOOL SYSTEM
// ==========================================

/**
 * Base Tool class
 */
class Tool {
    constructor(name, icon, shortcut) {
        this.name = name;
        this.icon = icon;
        this.shortcut = shortcut;
        this.isActive = false;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
    }
    
    activate() {
        this.isActive = true;
    }
    
    deactivate() {
        this.isActive = false;
        this.isDragging = false;
    }
    
    onMouseDown(x, y, button, renderer) {}
    onMouseMove(x, y, renderer) {}
    onMouseUp(x, y, button, renderer) {}
    onKeyDown(key, renderer) {}
}

/**
 * Selection Tool - select SceneObjects
 */
class SelectTool extends Tool {
    constructor() {
        super('select', 'V', 'v');
        this.isMoving = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.resizeStartBounds = null;
        this.moveOffsetX = 0;
        this.moveOffsetY = 0;
        this.selectionRect = null; // For marquee selection
        this.lastClickTime = 0;
        this.lastClickX = 0;
        this.lastClickY = 0;
        this.isEditingText = false;
        this.editingObject = null;
    }
    
    onMouseDown(x, y, button, renderer, app) {
        if (button === 0) {
            // Check for double-click to edit text
            const now = Date.now();
            const isDoubleClick = (now - this.lastClickTime < 400) && 
                                  Math.abs(x - this.lastClickX) < 2 && 
                                  Math.abs(y - this.lastClickY) < 2;
            this.lastClickTime = now;
            this.lastClickX = x;
            this.lastClickY = y;
            
            if (isDoubleClick && AppState.selectedObjects.length === 1) {
                const obj = AppState.selectedObjects[0];
                // Check if it's a text object, ascii-text object, or flowchart shape with label
                if (obj.type === 'text' || obj.type === 'ascii-text' || obj.label !== undefined) {
                    this._startInlineTextEdit(obj, app);
                    return;
                }
            }
            
            // First check for resize handles
            if (app && AppState.selectedObjects.length === 1) {
                const handleInfo = app._getResizeHandleAt(x, y);
                if (handleInfo) {
                    this.isResizing = true;
                    this.resizeHandle = handleInfo.handle;
                    this.resizeStartX = x;
                    this.resizeStartY = y;
                    this.resizeStartBounds = { ...handleInfo.obj.getBounds() };
                    this.resizeObj = handleInfo.obj;
                    if (app.saveStateForUndo) app.saveStateForUndo();
                    return;
                }
            }
            
            // Check if clicking on already selected object to move it
            if (AppState.selectedObjects.length > 0) {
                for (const obj of AppState.selectedObjects) {
                    if (obj.containsPoint && obj.containsPoint(x, y)) {
                        this.isMoving = true;
                        // Store the initial click position - offset will be relative to first object
                        this.moveStartX = x;
                        this.moveStartY = y;
                        // Store initial positions of all selected objects
                        this.initialPositions = AppState.selectedObjects.map(o => this._captureObjectPosition(o));
                        // Save undo state for movement
                        if (app && app.saveStateForUndo) app.saveStateForUndo();
                        return;
                    }
                }
            }
            
            // Try to select object at click position
            if (app && app.findObjectAt) {
                const obj = app.findObjectAt(x, y);
                if (obj) {
                    AppState.selectedObjects = [obj];
                    this._updatePropertiesPanel(obj);
                    if (app.renderAllObjects) app.renderAllObjects();
                    this._updateStatus(`Selected: ${obj.name || obj.type}`);
                    
                    // Start moving immediately after selection
                    this.isMoving = true;
                    this.moveStartX = x;
                    this.moveStartY = y;
                    this.initialPositions = AppState.selectedObjects.map(o => this._captureObjectPosition(o));
                    if (app.saveStateForUndo) app.saveStateForUndo();
                    return;
                }
            }
            
            // Start marquee selection
            AppState.selectedObjects = [];
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    _startInlineTextEdit(obj, app) {
        this.isEditingText = true;
        this.editingObject = obj;
        
        // Get the current text
        const currentText = (obj.type === 'text' || obj.type === 'ascii-text') ? (obj.text || '') : (obj.label || '');
        
        // Create inline input overlay
        const canvas = document.querySelector('#ascii-canvas');
        if (!canvas) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const charWidth = canvasRect.width / AppState.canvasWidth;
        const charHeight = canvasRect.height / AppState.canvasHeight;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-text-edit';
        input.value = currentText;
        input.style.position = 'absolute';
        input.style.left = `${canvasRect.left + obj.x * charWidth}px`;
        input.style.top = `${canvasRect.top + obj.y * charHeight}px`;
        input.style.width = `${Math.max(100, obj.width * charWidth)}px`;
        input.style.height = `${charHeight * 1.5}px`;
        input.style.fontSize = `${charHeight * 0.9}px`;
        input.style.fontFamily = 'monospace';
        input.style.background = 'var(--ui-bg)';
        input.style.color = 'var(--ui-text)';
        input.style.border = '2px solid var(--ui-accent)';
        input.style.borderRadius = '2px';
        input.style.padding = '2px 4px';
        input.style.zIndex = '1000';
        input.style.outline = 'none';
        
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        const finishEdit = () => {
            const newText = input.value;
            if (obj.type === 'text') {
                obj.text = newText;
                obj.width = newText.length || 1;
            } else if (obj.type === 'ascii-text') {
                obj.text = newText;
                // ASCII text width is 6 chars per letter
            } else {
                // Flowchart shapes use label
                obj.label = newText;
            }
            if (obj._updateBounds) obj._updateBounds();
            
            input.remove();
            this.isEditingText = false;
            this.editingObject = null;
            
            if (app) {
                app._spatialIndexDirty = true;
                app.renderAllObjects();
                app._updateLayerList();
            }
            
            // Update properties panel
            this._updatePropertiesPanel(obj);
            this._updateStatus(`Updated text: ${newText}`);
        };
        
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEdit();
            } else if (e.key === 'Escape') {
                input.remove();
                this.isEditingText = false;
                this.editingObject = null;
            }
        });
    }
    
    /**
     * Capture all position data for an object (including children for groups)
     */
    _captureObjectPosition(obj) {
        const pos = {
            obj: obj,
            x: obj.x,
            y: obj.y,
            // For lines
            x1: obj.x1,
            y1: obj.y1,
            x2: obj.x2,
            y2: obj.y2,
            // For paths, store points
            points: obj.points ? obj.points.map(p => ({ x: p.x, y: p.y })) : null,
            // For polygons, store center
            cx: obj.cx,
            cy: obj.cy,
            // For connectors
            startX: obj.startX,
            startY: obj.startY,
            endX: obj.endX,
            endY: obj.endY,
            waypoints: obj.waypoints ? obj.waypoints.map(w => ({ x: w.x, y: w.y })) : null,
            // For groups, recursively capture children
            children: obj.children ? obj.children.map(c => this._captureObjectPosition(c)) : null
        };
        return pos;
    }
    
    /**
     * Apply movement delta to an object (including children for groups)
     */
    _applyMoveDelta(pos, dx, dy) {
        const obj = pos.obj;
        obj.x = pos.x + dx;
        obj.y = pos.y + dy;
        
        // Update line endpoints
        if (pos.x1 !== undefined) {
            obj.x1 = pos.x1 + dx;
            obj.y1 = pos.y1 + dy;
            obj.x2 = pos.x2 + dx;
            obj.y2 = pos.y2 + dy;
        }
        
        // Update path points
        if (pos.points && obj.points) {
            for (let i = 0; i < pos.points.length; i++) {
                obj.points[i].x = pos.points[i].x + dx;
                obj.points[i].y = pos.points[i].y + dy;
            }
        }
        
        // Update polygon center
        if (pos.cx !== undefined) {
            obj.cx = pos.cx + dx;
            obj.cy = pos.cy + dy;
            if (obj._updateBounds) obj._updateBounds();
        }
        
        // Update connector endpoints
        if (pos.startX !== undefined) {
            obj.startX = pos.startX + dx;
            obj.startY = pos.startY + dy;
            obj.endX = pos.endX + dx;
            obj.endY = pos.endY + dy;
        }
        
        // Update connector waypoints
        if (pos.waypoints && obj.waypoints) {
            for (let i = 0; i < pos.waypoints.length; i++) {
                obj.waypoints[i].x = pos.waypoints[i].x + dx;
                obj.waypoints[i].y = pos.waypoints[i].y + dy;
            }
        }
        
        // Recursively move group children
        if (pos.children && obj.children) {
            for (let i = 0; i < pos.children.length; i++) {
                this._applyMoveDelta(pos.children[i], dx, dy);
            }
            // Update group bounds after moving children
            if (obj._updateBounds) obj._updateBounds();
        }
    }
    
    onMouseMove(x, y, renderer, app) {
        if (this.isDragging) {
            // Drawing selection rectangle
            renderer.clearPreview();
            const minX = Math.min(this.startX, x);
            const minY = Math.min(this.startY, y);
            const maxX = Math.max(this.startX, x);
            const maxY = Math.max(this.startY, y);
            
            // Draw selection border
            this._drawSelectionRect(renderer.previewBuffer, minX, minY, maxX - minX + 1, maxY - minY + 1);
            renderer.render();
        } else if (this.isResizing && this.resizeObj) {
            // Handle resizing
            const dx = x - this.resizeStartX;
            const dy = y - this.resizeStartY;
            const obj = this.resizeObj;
            const start = this.resizeStartBounds;
            
            let newX = start.x;
            let newY = start.y;
            let newW = start.width;
            let newH = start.height;
            
            switch (this.resizeHandle) {
                case 'nw':
                    newX = start.x + dx;
                    newY = start.y + dy;
                    newW = start.width - dx;
                    newH = start.height - dy;
                    break;
                case 'ne':
                    newY = start.y + dy;
                    newW = start.width + dx;
                    newH = start.height - dy;
                    break;
                case 'sw':
                    newX = start.x + dx;
                    newW = start.width - dx;
                    newH = start.height + dy;
                    break;
                case 'se':
                    newW = start.width + dx;
                    newH = start.height + dy;
                    break;
                case 'n':
                    newY = start.y + dy;
                    newH = start.height - dy;
                    break;
                case 's':
                    newH = start.height + dy;
                    break;
                case 'w':
                    newX = start.x + dx;
                    newW = start.width - dx;
                    break;
                case 'e':
                    newW = start.width + dx;
                    break;
            }
            
            // Enforce minimum size
            if (newW >= 2 && newH >= 1) {
                obj.x = newX;
                obj.y = newY;
                obj.width = newW;
                obj.height = newH;
                
                // Update related properties for specific object types
                if (obj.type === 'ellipse') {
                    obj.radiusX = Math.max(1, Math.floor(newW / 2));
                    obj.radiusY = Math.max(1, Math.floor(newH / 2));
                } else if (obj.type === 'line') {
                    // Resize line by adjusting endpoints
                    const lineW = obj.x2 - obj.x1;
                    const lineH = obj.y2 - obj.y1;
                    const scaleX = newW / Math.max(1, start.width);
                    const scaleY = newH / Math.max(1, start.height);
                    obj.x1 = newX;
                    obj.y1 = newY;
                    obj.x2 = newX + Math.round(lineW * scaleX);
                    obj.y2 = newY + Math.round(lineH * scaleY);
                }
                
                if (obj._updateBounds) obj._updateBounds();
                if (obj._updateSnapPoints) obj._updateSnapPoints();
                
                if (app && app.renderAllObjects) app.renderAllObjects();
            }
        } else if (this.isMoving && this.initialPositions) {
            // Calculate delta from start position
            const dx = Math.round(x - this.moveStartX);
            const dy = Math.round(y - this.moveStartY);
            
            // Apply delta to all objects using the helper method
            for (const pos of this.initialPositions) {
                this._applyMoveDelta(pos, dx, dy);
            }
            
            if (app && app.renderAllObjects) app.renderAllObjects();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isResizing) {
            this.isResizing = false;
            this.resizeHandle = null;
            this.resizeObj = null;
            this.resizeStartBounds = null;
            // Invalidate spatial index
            if (app && app.invalidateSpatialIndex) app.invalidateSpatialIndex();
            if (AppState.selectedObjects.length > 0) {
                this._updatePropertiesPanel(AppState.selectedObjects[0]);
                this._updateStatus(`Resized object`);
            }
            return;
        }
        
        if (this.isDragging) {
            this.isDragging = false;
            const minX = Math.min(this.startX, x);
            const minY = Math.min(this.startY, y);
            const maxX = Math.max(this.startX, x);
            const maxY = Math.max(this.startY, y);
            
            // Find all objects in selection region
            if (app && app.findObjectsInRegion) {
                const objects = app.findObjectsInRegion(minX, minY, maxX, maxY);
                AppState.selectedObjects = objects;
                
                if (objects.length > 0) {
                    this._updatePropertiesPanel(objects[0]);
                    this._updateStatus(`Selected ${objects.length} object(s)`);
                } else {
                    this._updateStatus('No objects selected');
                }
            }
            
            renderer.clearPreview();
            if (app && app.renderAllObjects) app.renderAllObjects();
        } else if (this.isMoving) {
            this.isMoving = false;
            this.initialPositions = null;
            // Invalidate spatial index after moving objects
            if (app && app.invalidateSpatialIndex) {
                app.invalidateSpatialIndex();
            }
            if (app && app._updateLayerList) {
                app._updateLayerList();
            }
            if (AppState.selectedObjects.length > 0) {
                this._updatePropertiesPanel(AppState.selectedObjects[0]);
                this._updateStatus(`Moved ${AppState.selectedObjects.length} object(s)`);
            }
        }
    }
    
    onKeyDown(key, renderer, app) {
        if (AppState.selectedObjects.length > 0) {
            if (key === 'Delete' || key === 'Backspace') {
                // Delete selected objects
                for (const obj of AppState.selectedObjects) {
                    if (app && app.removeObject) {
                        app.removeObject(obj.id);
                    }
                }
                AppState.selectedObjects = [];
                this._updateStatus('Deleted selected objects');
                if (app && app.renderAllObjects) app.renderAllObjects();
            } else if (key === 'Escape') {
                AppState.selectedObjects = [];
                this._updateStatus('Selection cleared');
                if (app && app.renderAllObjects) app.renderAllObjects();
            } else if (key === 'ArrowUp') {
                this._moveSelection(0, -1, app);
            } else if (key === 'ArrowDown') {
                this._moveSelection(0, 1, app);
            } else if (key === 'ArrowLeft') {
                this._moveSelection(-1, 0, app);
            } else if (key === 'ArrowRight') {
                this._moveSelection(1, 0, app);
            }
        }
    }
    
    _moveSelection(dx, dy, app) {
        for (const obj of AppState.selectedObjects) {
            this._moveObjectByDelta(obj, dx, dy);
        }
        // Invalidate spatial index after moving
        if (app && app.invalidateSpatialIndex) {
            app.invalidateSpatialIndex();
        }
        if (app && app.renderAllObjects) app.renderAllObjects();
    }
    
    /**
     * Move a single object by delta (used for arrow key movement)
     */
    _moveObjectByDelta(obj, dx, dy) {
        obj.x += dx;
        obj.y += dy;
        
        // Update line endpoints
        if (obj.x1 !== undefined) {
            obj.x1 += dx;
            obj.y1 += dy;
            obj.x2 += dx;
            obj.y2 += dy;
        }
        
        // Update path points
        if (obj.points) {
            for (const p of obj.points) {
                p.x += dx;
                p.y += dy;
            }
        }
        
        // Update polygon center
        if (obj.cx !== undefined) {
            obj.cx += dx;
            obj.cy += dy;
            if (obj._updateBounds) obj._updateBounds();
        }
        
        // Update connector endpoints
        if (obj.startX !== undefined) {
            obj.startX += dx;
            obj.startY += dy;
            obj.endX += dx;
            obj.endY += dy;
        }
        
        // Update connector waypoints
        if (obj.waypoints) {
            for (const w of obj.waypoints) {
                w.x += dx;
                w.y += dy;
            }
        }
        
        // Recursively move group children
        if (obj.children) {
            for (const child of obj.children) {
                this._moveObjectByDelta(child, dx, dy);
            }
            // Update group bounds after moving children
            if (obj._updateBounds) obj._updateBounds();
        }
    }
    
    _drawSelectionRect(buffer, x, y, width, height) {
        // Draw marching ants style selection (dashed border)
        for (let i = 0; i < width; i++) {
            const char = (i % 2 === 0) ? '─' : ' ';
            buffer.setChar(x + i, y - 1, char, '#4a9eff');
            buffer.setChar(x + i, y + height, char, '#4a9eff');
        }
        for (let i = 0; i < height; i++) {
            const char = (i % 2 === 0) ? '│' : ' ';
            buffer.setChar(x - 1, y + i, char, '#4a9eff');
            buffer.setChar(x + width, y + i, char, '#4a9eff');
        }
        // Corners
        buffer.setChar(x - 1, y - 1, '┌', '#4a9eff');
        buffer.setChar(x + width, y - 1, '┐', '#4a9eff');
        buffer.setChar(x - 1, y + height, '└', '#4a9eff');
        buffer.setChar(x + width, y + height, '┘', '#4a9eff');
    }
    
    _updatePropertiesPanel(obj) {
        if (!obj) return;
        
        // Update position inputs
        const xInput = $('#prop-x');
        const yInput = $('#prop-y');
        const wInput = $('#prop-width');
        const hInput = $('#prop-height');
        
        if (xInput) xInput.value = obj.x || 0;
        if (yInput) yInput.value = obj.y || 0;
        if (wInput) wInput.value = obj.width || 0;
        if (hInput) hInput.value = obj.height || 0;
        
        // Update text input (for text objects and flowchart shapes)
        const propText = $('#prop-text');
        const propTextGroup = $('#prop-text-group');
        if (propText && propTextGroup) {
            if ((obj.type === 'text' || obj.type === 'ascii-text') && obj.text !== undefined) {
                propTextGroup.style.display = 'block';
                propText.value = obj.text || '';
            } else if (obj.label !== undefined) {
                // Flowchart shapes have label
                propTextGroup.style.display = 'block';
                propText.value = obj.label || '';
            } else {
                propTextGroup.style.display = 'none';
                propText.value = '';
            }
        }
        
        // Update color inputs
        const strokeColorInput = $('#prop-stroke-color');
        const fillColorInput = $('#prop-fill-color');
        
        if (strokeColorInput) strokeColorInput.value = obj.strokeColor || '#ffffff';
        if (fillColorInput) fillColorInput.value = obj.fillColor || '#ffffff';
        
        // Update fill char
        const fillCharInput = $('#prop-fill-char');
        if (fillCharInput) fillCharInput.value = obj.fillChar || '';
        
        // Update border style
        const borderStyle = $('#prop-border-style');
        if (borderStyle) borderStyle.value = obj.lineStyle || 'single';
    }
    
    _updateStatus(msg) {
        const statusText = document.querySelector('#status-message');
        if (statusText) statusText.textContent = msg;
    }
}

/**
 * Pencil Tool (freehand drawing)
 */
class PencilTool extends Tool {
    constructor() {
        super('pencil', 'P', 'p');
        this.lastX = -1;
        this.lastY = -1;
        this.currentPath = null;
    }
    
    onMouseDown(x, y, button, renderer, app) {
        if (button === 0) {
            this.isDragging = true;
            this.lastX = x;
            this.lastY = y;
            
            // Create new path object
            this.currentPath = new PathObject();
            this.currentPath.strokeChar = AppState.strokeChar;
            this.currentPath.strokeColor = AppState.strokeColor;
            this.currentPath.addPoint(x, y);
            this.currentPath.name = `Path ${Date.now() % 10000}`;
            
            // Preview while drawing
            renderer.previewBuffer.setChar(x, y, AppState.strokeChar, AppState.strokeColor);
            renderer.render();
        }
    }
    
    onMouseMove(x, y, renderer, app) {
        if (this.isDragging && this.currentPath) {
            this.currentPath.addPoint(x, y);
            
            // Draw preview
            if (this.lastX !== -1) {
                drawLine(renderer.previewBuffer, this.lastX, this.lastY, x, y, {
                    char: AppState.strokeChar,
                    color: AppState.strokeColor
                });
            }
            this.lastX = x;
            this.lastY = y;
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging && this.currentPath) {
            renderer.clearPreview();
            
            // Add path to scene
            if (app && app.addObject) {
                app.addObject(this.currentPath, true);
            }
            
            this.currentPath = null;
        }
        this.isDragging = false;
        this.lastX = -1;
        this.lastY = -1;
    }
}

/**
 * Line Tool
 */
class LineTool extends Tool {
    constructor() {
        super('line', 'L', 'l');
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    onMouseMove(x, y, renderer) {
        if (this.isDragging) {
            renderer.clearPreview();
            drawLine(renderer.previewBuffer, this.startX, this.startY, x, y, {
                style: AppState.lineStyle,
                color: AppState.strokeColor
            });
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            
            // Create LineObject instead of drawing directly
            const line = new LineObject();
            line.x1 = this.startX;
            line.y1 = this.startY;
            line.x2 = x;
            line.y2 = y;
            line.x = Math.min(this.startX, x);
            line.y = Math.min(this.startY, y);
            line.width = Math.abs(x - this.startX) + 1;
            line.height = Math.abs(y - this.startY) + 1;
            line.strokeChar = AppState.strokeChar;
            line.strokeColor = AppState.strokeColor;
            line.lineStyle = AppState.lineStyle;
            line.name = `Line ${Date.now() % 10000}`;
            
            // Add to active layer
            if (app && app.addObject) {
                app.addObject(line, true);
            } else {
                // Fallback: draw directly
                drawLine(renderer.buffer, this.startX, this.startY, x, y, {
                    style: AppState.lineStyle,
                    color: AppState.strokeColor
                });
                renderer.render();
            }
            
            this.isDragging = false;
        }
    }
}

/**
 * Rectangle Tool
 */
class RectangleTool extends Tool {
    constructor() {
        super('rectangle', 'R', 'r');
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    onMouseMove(x, y, renderer) {
        if (this.isDragging) {
            renderer.clearPreview();
            const minX = Math.min(this.startX, x);
            const minY = Math.min(this.startY, y);
            const width = Math.abs(x - this.startX) + 1;
            const height = Math.abs(y - this.startY) + 1;
            
            // Auto-fill if fillChar is set
            const shouldFill = AppState.fillChar && AppState.fillChar !== '';
            
            if (shouldFill) {
                fillRect(renderer.previewBuffer, minX, minY, width, height, {
                    style: AppState.lineStyle,
                    fillChar: AppState.fillChar,
                    color: AppState.strokeColor,
                    fillColor: AppState.fillColor
                });
            } else {
                drawRect(renderer.previewBuffer, minX, minY, width, height, {
                    style: AppState.lineStyle,
                    color: AppState.strokeColor
                });
            }
            
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            const minX = Math.min(this.startX, x);
            const minY = Math.min(this.startY, y);
            const width = Math.abs(x - this.startX) + 1;
            const height = Math.abs(y - this.startY) + 1;
            
            // Auto-fill if fillChar is set
            const shouldFill = AppState.fillChar && AppState.fillChar !== '';
            
            // Create RectangleObject
            const rect = new RectangleObject();
            rect.x = minX;
            rect.y = minY;
            rect.width = width;
            rect.height = height;
            rect.filled = shouldFill;
            rect.strokeChar = AppState.strokeChar;
            rect.fillChar = AppState.fillChar;
            rect.strokeColor = AppState.strokeColor;
            rect.fillColor = AppState.fillColor;
            rect.lineStyle = AppState.lineStyle;
            rect.name = `Rectangle ${Date.now() % 10000}`;
            
            // Add to active layer
            if (app && app.addObject) {
                app.addObject(rect, true);
            }
            
            this.isDragging = false;
        }
    }
}

/**
 * Ellipse Tool
 */
class EllipseTool extends Tool {
    constructor() {
        super('ellipse', 'E', 'e');
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    onMouseMove(x, y, renderer) {
        if (this.isDragging) {
            renderer.clearPreview();
            
            // Calculate center and radius from drag bounds
            const cx = Math.round((this.startX + x) / 2);
            const cy = Math.round((this.startY + y) / 2);
            // Use half the height as radius (the rendering will apply aspect ratio)
            const radius = Math.abs(y - this.startY) / 2;
            
            // Auto-fill if fillChar is set
            const shouldFill = AppState.fillChar && AppState.fillChar !== '';
            
            if (shouldFill && radius > 0) {
                fillCircle(renderer.previewBuffer, cx, cy, radius, {
                    fillChar: AppState.fillChar,
                    color: AppState.fillColor
                });
            }
            if (radius > 0) {
                drawCircle(renderer.previewBuffer, cx, cy, radius, {
                    char: AppState.strokeChar,
                    color: AppState.strokeColor
                });
            }
            
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            
            // Calculate center and radius
            const cx = Math.round((this.startX + x) / 2);
            const cy = Math.round((this.startY + y) / 2);
            const radius = Math.abs(y - this.startY) / 2;
            
            if (radius < 1) {
                this.isDragging = false;
                return;
            }
            
            // Auto-fill if fillChar is set
            const shouldFill = AppState.fillChar && AppState.fillChar !== '';
            
            // Create EllipseObject
            // Calculate top-left position accounting for aspect ratio
            const aspectRatio = EllipseObject.ASPECT_RATIO;
            const effectiveRadiusX = Math.round(radius * aspectRatio);
            const effectiveRadiusY = Math.round(radius);
            
            const ellipse = new EllipseObject();
            ellipse.x = cx - effectiveRadiusX;
            ellipse.y = cy - effectiveRadiusY;
            ellipse.radiusX = radius;
            ellipse.radiusY = radius;
            ellipse._updateBounds(); // Ensure bounds are calculated
            ellipse.filled = shouldFill;
            ellipse.strokeChar = AppState.strokeChar;
            ellipse.fillChar = AppState.fillChar;
            ellipse.strokeColor = AppState.strokeColor;
            ellipse.fillColor = AppState.fillColor;
            ellipse.name = `Circle ${Date.now() % 10000}`;
            
            // Add to active layer
            if (app && app.addObject) {
                app.addObject(ellipse, true);
            }
            
            this.isDragging = false;
        }
    }
}

/**
 * Text Tool
 */
class TextTool extends Tool {
    constructor() {
        super('text', 'T', 't');
        this.textX = 0;
        this.textY = 0;
        this.isTyping = false;
        this.text = '';
        this.app = null; // Will be set when tool is used
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.textX = x;
            this.textY = y;
            this.isTyping = true;
            this.text = '';
        }
    }
    
    onKeyDown(key, renderer, app) {
        if (!this.isTyping) return;
        
        if (key === 'Enter' || key === 'Escape') {
            if (this.text.length > 0) {
                // Create TextObject instead of drawing directly
                const textObj = new TextObject();
                textObj.x = this.textX;
                textObj.y = this.textY;
                textObj.width = this.text.length;
                textObj.height = 1;
                textObj.text = this.text;
                textObj.strokeColor = AppState.strokeColor;
                textObj.name = `Text ${Date.now() % 10000}`;
                
                // Add to active layer
                if (app && app.addObject) {
                    app.addObject(textObj, true);
                } else {
                    // Fallback: draw directly
                    renderer.buffer.drawText(this.textX, this.textY, this.text, AppState.strokeColor);
                    renderer.render();
                }
            }
            this.isTyping = false;
            renderer.clearPreview();
            renderer.render();
        } else if (key === 'Backspace') {
            this.text = this.text.slice(0, -1);
        } else if (key.length === 1) {
            this.text += key;
        }
        
        // Update preview
        renderer.clearPreview();
        renderer.previewBuffer.drawText(this.textX, this.textY, this.text + '│', AppState.strokeColor);
        renderer.render();
    }
}

/**
 * Fill (Bucket) Tool
 */
class FillTool extends Tool {
    constructor() {
        super('fill', 'G', 'g');
    }
    
    onMouseDown(x, y, button, renderer, app) {
        if (button === 0) {
            // Check if clicking on an object that supports filling
            if (app) {
                const obj = app.findObjectAt(x, y);
                if (obj && (obj.type === 'rectangle' || obj.type === 'ellipse' || 
                    obj.type === 'polygon' || obj.type === 'star')) {
                    app.saveStateForUndo();
                    obj.filled = true;
                    obj.fillChar = AppState.fillChar;
                    obj.fillColor = AppState.fillColor;
                    app.renderAllObjects();
                    return;
                }
            }
            
            // Otherwise do flood fill on buffer
            floodFill(renderer.buffer, x, y, AppState.fillChar, {
                color: AppState.fillColor
            });
            renderer.render();
        }
    }
}

/**
 * Eraser Tool
 */
class EraserTool extends Tool {
    constructor() {
        super('eraser', 'X', 'x');
        this.size = 1;
        this.erasedObjects = new Set();
    }
    
    onMouseDown(x, y, button, renderer, app) {
        if (button === 0) {
            this.isDragging = true;
            this.erasedObjects = new Set();
            this._erase(x, y, renderer, app);
        }
    }
    
    onMouseMove(x, y, renderer, app) {
        if (this.isDragging) {
            this._erase(x, y, renderer, app);
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging && this.erasedObjects.size > 0 && app) {
            app.saveStateForUndo();
            // Remove all erased objects
            for (const objId of this.erasedObjects) {
                app.removeObject(objId);
            }
            app.renderAllObjects();
        }
        this.isDragging = false;
        this.erasedObjects = new Set();
    }
    
    _erase(x, y, renderer, app) {
        // Check if any objects are at this position
        if (app) {
            const obj = app.findObjectAt(x, y);
            if (obj && !this.erasedObjects.has(obj.id)) {
                this.erasedObjects.add(obj.id);
                // Visual feedback - temporarily hide
                obj.visible = false;
                app.renderAllObjects();
                return;
            }
        }
        
        // Also erase from buffer (for non-object content)
        for (let dy = -Math.floor(this.size / 2); dy <= Math.floor(this.size / 2); dy++) {
            for (let dx = -Math.floor(this.size / 2); dx <= Math.floor(this.size / 2); dx++) {
                renderer.buffer.setChar(x + dx, y + dy, ' ');
            }
        }
        renderer.render();
    }
}

/**
 * Direct Select Tool (select individual points/characters)
 */
class DirectSelectTool extends Tool {
    constructor() {
        super('direct-select', 'A', 'a');
        this.selectedChar = null;
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            // Select character at position
            const char = renderer.buffer.getChar(x, y);
            const color = renderer.buffer.getColor(x, y);
            
            this.selectedChar = { x, y, char, color };
            AppState.selectedObjects = [this.selectedChar];
            
            this._highlightSelection(x, y, renderer);
            this._updatePropertiesPanel();
        }
    }
    
    onMouseMove(x, y, renderer) {
        // Show hover highlight
        if (!this.isDragging) {
            renderer.clearPreview();
            const char = renderer.buffer.getChar(x, y);
            if (char !== ' ') {
                renderer.previewBuffer.setChar(x, y, char, '#4a9eff');
            }
            // Keep selection visible
            if (this.selectedChar) {
                this._drawSelectionBox(renderer.previewBuffer, this.selectedChar.x, this.selectedChar.y);
            }
            renderer.render();
        }
    }
    
    _highlightSelection(x, y, renderer) {
        renderer.clearPreview();
        this._drawSelectionBox(renderer.previewBuffer, x, y);
        renderer.render();
    }
    
    _drawSelectionBox(buffer, x, y) {
        // Draw selection handles around the character
        buffer.setChar(x - 1, y - 1, '┌', '#4a9eff');
        buffer.setChar(x + 1, y - 1, '┐', '#4a9eff');
        buffer.setChar(x - 1, y + 1, '└', '#4a9eff');
        buffer.setChar(x + 1, y + 1, '┘', '#4a9eff');
        buffer.setChar(x, y - 1, '─', '#4a9eff');
        buffer.setChar(x, y + 1, '─', '#4a9eff');
        buffer.setChar(x - 1, y, '│', '#4a9eff');
        buffer.setChar(x + 1, y, '│', '#4a9eff');
    }
    
    _updatePropertiesPanel() {
        if (!this.selectedChar) return;
        
        const propX = document.querySelector('#prop-x');
        const propY = document.querySelector('#prop-y');
        const propWidth = document.querySelector('#prop-width');
        const propHeight = document.querySelector('#prop-height');
        
        if (propX) propX.value = this.selectedChar.x;
        if (propY) propY.value = this.selectedChar.y;
        if (propWidth) propWidth.value = 1;
        if (propHeight) propHeight.value = 1;
        
        // Update status bar
        const statusText = document.querySelector('#status-message');
        if (statusText) {
            statusText.textContent = `Selected: '${this.selectedChar.char}' at (${this.selectedChar.x}, ${this.selectedChar.y})`;
        }
    }
    
    onKeyDown(key, renderer) {
        if (this.selectedChar) {
            if (key === 'Delete' || key === 'Backspace') {
                renderer.buffer.setChar(this.selectedChar.x, this.selectedChar.y, ' ', null);
                renderer.clearPreview();
                renderer.render();
                this.selectedChar = null;
                AppState.selectedObjects = [];
            } else if (key === 'Escape') {
                renderer.clearPreview();
                renderer.render();
                this.selectedChar = null;
                AppState.selectedObjects = [];
            }
        }
    }
}

/**
 * Pen Tool (bezier curves - simplified for ASCII)
 */
class PenTool extends Tool {
    constructor() {
        super('pen', 'P', 'p');
        this.points = [];
        this.currentPath = null;
    }
    
    onMouseDown(x, y, button, renderer, app) {
        if (button === 0) {
            this.points.push({ x, y });
            
            // Create path object on first click
            if (this.points.length === 1) {
                this.currentPath = new PathObject();
                this.currentPath.strokeChar = AppState.strokeChar;
                this.currentPath.strokeColor = AppState.strokeColor;
                this.currentPath.lineStyle = AppState.lineStyle;
                this.currentPath.name = `Pen Path ${Date.now() % 10000}`;
                this.currentPath.addPoint(x, y);
            } else if (this.currentPath) {
                this.currentPath.addPoint(x, y);
            }
            
            // Draw preview
            if (this.points.length > 1) {
                const p1 = this.points[this.points.length - 2];
                const p2 = this.points[this.points.length - 1];
                drawLine(renderer.previewBuffer, p1.x, p1.y, p2.x, p2.y, {
                    style: AppState.lineStyle,
                    color: AppState.strokeColor
                });
                renderer.render();
            }
        } else if (button === 2) {
            // Right click to finish - add path object to scene
            if (this.currentPath && this.points.length > 1 && app && app.addObject) {
                renderer.clearPreview();
                app.addObject(this.currentPath, true);
            }
            this.points = [];
            this.currentPath = null;
        }
    }
    
    onKeyDown(key, renderer, app) {
        if ((key === 'Enter' || key === 'Escape') && this.currentPath && this.points.length > 1) {
            // Finish path on Enter or Escape
            renderer.clearPreview();
            if (app && app.addObject) {
                app.addObject(this.currentPath, true);
            }
            this.points = [];
            this.currentPath = null;
        }
    }
    
    deactivate() {
        super.deactivate();
        this.points = [];
        this.currentPath = null;
    }
}

/**
 * Brush Tool (variable width drawing)
 */
class BrushTool extends Tool {
    constructor() {
        super('brush', 'B', 'b');
        this.size = 2;
        this.lastX = -1;
        this.lastY = -1;
        this.currentPath = null;
    }
    
    onMouseDown(x, y, button, renderer, app) {
        if (button === 0) {
            this.isDragging = true;
            this.lastX = x;
            this.lastY = y;
            
            // Create new path object
            this.currentPath = new PathObject();
            this.currentPath.strokeChar = AppState.strokeChar;
            this.currentPath.strokeColor = AppState.strokeColor;
            this.currentPath.brushSize = this.size;
            this.currentPath.name = `Brush ${Date.now() % 10000}`;
            
            // Add initial point
            this.currentPath.addPoint(x, y);
            
            // Preview
            this._drawBrush(x, y, renderer.previewBuffer);
            renderer.render();
        }
    }
    
    onMouseMove(x, y, renderer, app) {
        if (this.isDragging && this.currentPath) {
            this.currentPath.addPoint(x, y);
            
            // Draw preview line between last and current position
            if (this.lastX !== -1) {
                drawLine(renderer.previewBuffer, this.lastX, this.lastY, x, y, {
                    char: AppState.strokeChar,
                    color: AppState.strokeColor
                });
            }
            this._drawBrush(x, y, renderer.previewBuffer);
            this.lastX = x;
            this.lastY = y;
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging && this.currentPath) {
            renderer.clearPreview();
            
            // Add path to scene
            if (app && app.addObject) {
                app.addObject(this.currentPath, true);
            }
            
            this.currentPath = null;
        }
        this.isDragging = false;
        this.lastX = -1;
        this.lastY = -1;
    }
    
    _drawBrush(x, y, buffer) {
        // Draw a circle/blob at the position
        for (let dy = -this.size; dy <= this.size; dy++) {
            for (let dx = -this.size; dx <= this.size; dx++) {
                if (dx * dx + dy * dy <= this.size * this.size) {
                    buffer.setChar(x + dx, y + dy, AppState.strokeChar, AppState.strokeColor);
                }
            }
        }
    }
}

/**
 * Polygon Tool
 */
class PolygonTool extends Tool {
    constructor() {
        super('polygon', '⬡', null);
        this.sides = 6;
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    onMouseMove(x, y, renderer) {
        if (this.isDragging) {
            renderer.clearPreview();
            const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
            this._drawPolygon(renderer.previewBuffer, this.startX, this.startY, radius, this.sides);
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
            
            if (radius >= 1) {
                const polygon = new PolygonObject(this.startX, this.startY, radius, this.sides);
                polygon.strokeChar = AppState.strokeChar;
                polygon.strokeColor = AppState.strokeColor;
                polygon.lineStyle = AppState.lineStyle;
                
                // Auto-fill based on AppState.fillChar
                const shouldFill = AppState.fillChar && AppState.fillChar !== '';
                polygon.filled = shouldFill;
                if (shouldFill) {
                    polygon.fillChar = AppState.fillChar;
                    polygon.fillColor = AppState.fillColor;
                }
                
                if (app && app.addObject) {
                    app.addObject(polygon, true);
                }
            }
            
            renderer.render();
            this.isDragging = false;
        }
    }
    
    _drawPolygon(buffer, cx, cy, radius, sides) {
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            points.push({
                x: Math.round(cx + radius * Math.cos(angle)),
                y: Math.round(cy + radius * Math.sin(angle) * 0.5) // Aspect ratio adjustment
            });
        }
        
        // Draw lines between consecutive points
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            drawLine(buffer, p1.x, p1.y, p2.x, p2.y, {
                style: AppState.lineStyle,
                color: AppState.strokeColor
            });
        }
    }
}

/**
 * Star Tool
 */
class StarTool extends Tool {
    constructor() {
        super('star', '☆', null);
        this.points = 5;
        this.innerRatio = 0.4;
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    onMouseMove(x, y, renderer) {
        if (this.isDragging) {
            renderer.clearPreview();
            const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
            this._drawStar(renderer.previewBuffer, this.startX, this.startY, radius);
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
            
            if (radius >= 1) {
                const star = new StarObject(this.startX, this.startY, radius, this.points, this.innerRatio);
                star.strokeChar = AppState.strokeChar;
                star.strokeColor = AppState.strokeColor;
                
                // Auto-fill based on AppState.fillChar
                const shouldFill = AppState.fillChar && AppState.fillChar !== '';
                star.filled = shouldFill;
                if (shouldFill) {
                    star.fillChar = AppState.fillChar;
                    star.fillColor = AppState.fillColor;
                }
                
                if (app && app.addObject) {
                    app.addObject(star, true);
                }
            }
            
            renderer.render();
            this.isDragging = false;
        }
    }
    
    _drawStar(buffer, cx, cy, outerRadius) {
        const innerRadius = outerRadius * this.innerRatio;
        const vertices = [];
        
        for (let i = 0; i < this.points * 2; i++) {
            const angle = (i * Math.PI / this.points) - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            vertices.push({
                x: Math.round(cx + radius * Math.cos(angle)),
                y: Math.round(cy + radius * Math.sin(angle) * 0.5)
            });
        }
        
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % vertices.length];
            drawLine(buffer, p1.x, p1.y, p2.x, p2.y, {
                char: AppState.strokeChar,
                color: AppState.strokeColor
            });
        }
    }
}

/**
 * ASCII Text Tool (large ASCII art text)
 */
class AsciiTextTool extends Tool {
    constructor() {
        super('ascii-text', 'Ⓐ', null);
        this.textX = 0;
        this.textY = 0;
        this.isTyping = false;
        this.text = '';
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.textX = x;
            this.textY = y;
            this.isTyping = true;
            this.text = '';
        }
    }
    
    onKeyDown(key, renderer, app) {
        if (!this.isTyping) return;
        
        if (key === 'Enter' || key === 'Escape') {
            if (this.text.length > 0) {
                // Create AsciiTextObject instead of drawing directly
                const textObj = new AsciiTextObject();
                textObj.x = this.textX;
                textObj.y = this.textY;
                textObj.text = this.text;
                textObj.strokeColor = AppState.strokeColor;
                textObj.name = `ASCII Text ${Date.now() % 10000}`;
                textObj._updateBounds();
                
                // Add to active layer
                if (app && app.addObject) {
                    app.addObject(textObj, true);
                } else {
                    // Fallback: draw directly
                    this._drawAsciiText(renderer.buffer, this.textX, this.textY, this.text);
                    renderer.render();
                }
            }
            this.isTyping = false;
            renderer.clearPreview();
            renderer.render();
        } else if (key === 'Backspace') {
            this.text = this.text.slice(0, -1);
        } else if (key.length === 1) {
            this.text += key;
        }
        
        // Update preview
        renderer.clearPreview();
        this._drawAsciiText(renderer.previewBuffer, this.textX, this.textY, this.text + '│');
        renderer.render();
    }
    
    _drawAsciiText(buffer, x, y, text) {
        // Simple banner-style ASCII text
        const chars = text.toUpperCase().split('');
        let offsetX = 0;
        
        chars.forEach(char => {
            const art = this._getCharArt(char);
            art.forEach((line, row) => {
                for (let col = 0; col < line.length; col++) {
                    if (line[col] !== ' ') {
                        buffer.setChar(x + offsetX + col, y + row, line[col], AppState.strokeColor);
                    }
                }
            });
            offsetX += 6; // Character width + spacing
        });
    }
    
    _getCharArt(char) {
        // Simple 5x5 ASCII art for letters
        const arts = {
            'A': ['  █  ', ' █ █ ', '█████', '█   █', '█   █'],
            'B': ['████ ', '█   █', '████ ', '█   █', '████ '],
            'C': [' ████', '█    ', '█    ', '█    ', ' ████'],
            'D': ['████ ', '█   █', '█   █', '█   █', '████ '],
            'E': ['█████', '█    ', '████ ', '█    ', '█████'],
            'F': ['█████', '█    ', '████ ', '█    ', '█    '],
            'G': [' ████', '█    ', '█  ██', '█   █', ' ████'],
            'H': ['█   █', '█   █', '█████', '█   █', '█   █'],
            'I': ['█████', '  █  ', '  █  ', '  █  ', '█████'],
            'J': ['█████', '   █ ', '   █ ', '█  █ ', ' ██  '],
            'K': ['█   █', '█  █ ', '███  ', '█  █ ', '█   █'],
            'L': ['█    ', '█    ', '█    ', '█    ', '█████'],
            'M': ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
            'N': ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
            'O': [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
            'P': ['████ ', '█   █', '████ ', '█    ', '█    '],
            'Q': [' ███ ', '█   █', '█   █', '█  █ ', ' ██ █'],
            'R': ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
            'S': [' ████', '█    ', ' ███ ', '    █', '████ '],
            'T': ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
            'U': ['█   █', '█   █', '█   █', '█   █', ' ███ '],
            'V': ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
            'W': ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
            'X': ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
            'Y': ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
            'Z': ['█████', '   █ ', '  █  ', ' █   ', '█████'],
            ' ': ['     ', '     ', '     ', '     ', '     '],
            '│': ['  │  ', '  │  ', '  │  ', '  │  ', '  │  ']
        };
        return arts[char] || ['     ', '     ', '     ', '     ', '     '];
    }
}

/**
 * Box Draw Tool
 */
class BoxDrawTool extends Tool {
    constructor() {
        super('box-draw', '┌┐', null);
        this.style = 'single'; // single, double, rounded
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    onMouseMove(x, y, renderer) {
        if (this.isDragging) {
            renderer.clearPreview();
            const minX = Math.min(this.startX, x);
            const minY = Math.min(this.startY, y);
            const width = Math.abs(x - this.startX) + 1;
            const height = Math.abs(y - this.startY) + 1;
            
            drawRect(renderer.previewBuffer, minX, minY, width, height, {
                style: this.style,
                color: AppState.strokeColor
            });
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            const minX = Math.min(this.startX, x);
            const minY = Math.min(this.startY, y);
            const width = Math.abs(x - this.startX) + 1;
            const height = Math.abs(y - this.startY) + 1;
            
            if (width >= 2 && height >= 2) {
                // Create RectangleObject with box style
                const rect = new RectangleObject(minX, minY, width, height);
                rect.strokeChar = AppState.strokeChar;
                rect.strokeColor = AppState.strokeColor;
                rect.boxStyle = this.style; // single, double, rounded
                rect.name = `Box ${Date.now() % 10000}`;
                
                // Auto-fill based on AppState.fillChar
                const shouldFill = AppState.fillChar && AppState.fillChar !== '';
                rect.filled = shouldFill;
                if (shouldFill) {
                    rect.fillChar = AppState.fillChar;
                    rect.fillColor = AppState.fillColor;
                }
                
                if (app && app.addObject) {
                    app.addObject(rect, true);
                }
            }
            
            this.isDragging = false;
        }
    }
}

/**
 * Table Tool
 */
class TableTool extends Tool {
    constructor() {
        super('table', '▦', null);
        this.cols = 3;
        this.rows = 3;
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    onMouseMove(x, y, renderer) {
        if (this.isDragging) {
            renderer.clearPreview();
            this._drawTable(renderer.previewBuffer, this.startX, this.startY, x, y);
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            const minX = Math.min(this.startX, x);
            const minY = Math.min(this.startY, y);
            const width = Math.abs(x - this.startX) + 1;
            const height = Math.abs(y - this.startY) + 1;
            
            if (width >= 5 && height >= 3) {
                // Create TableObject
                const table = new TableObject(minX, minY, width, height, this.cols, this.rows);
                table.strokeChar = AppState.strokeChar;
                table.strokeColor = AppState.strokeColor;
                table.name = `Table ${Date.now() % 10000}`;
                
                if (app && app.addObject) {
                    app.addObject(table, true);
                }
            }
            
            this.isDragging = false;
        }
    }
    
    _drawTable(buffer, x1, y1, x2, y2) {
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const width = Math.abs(x2 - x1) + 1;
        const height = Math.abs(y2 - y1) + 1;
        
        const cellWidth = Math.floor(width / this.cols);
        const cellHeight = Math.floor(height / this.rows);
        
        // Draw outer border
        drawRect(buffer, minX, minY, width, height, { style: 'single' });
        
        // Draw vertical dividers
        for (let i = 1; i < this.cols; i++) {
            const x = minX + i * cellWidth;
            for (let y = minY; y < minY + height; y++) {
                const char = y === minY ? '┬' : (y === minY + height - 1 ? '┴' : '│');
                buffer.setChar(x, y, char, AppState.strokeColor);
            }
        }
        
        // Draw horizontal dividers
        for (let i = 1; i < this.rows; i++) {
            const y = minY + i * cellHeight;
            for (let x = minX; x < minX + width; x++) {
                const char = x === minX ? '├' : (x === minX + width - 1 ? '┤' : '─');
                buffer.setChar(x, y, char, AppState.strokeColor);
            }
            // Fix intersections
            for (let j = 1; j < this.cols; j++) {
                buffer.setChar(minX + j * cellWidth, y, '┼', AppState.strokeColor);
            }
        }
    }
}

/**
 * Tree Tool (ASCII directory tree)
 */
class TreeTool extends Tool {
    constructor() {
        super('tree', '├', null);
        this.nodes = [];
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.nodes.push({ x, y, level: this.nodes.length === 0 ? 0 : this.nodes[this.nodes.length - 1].level });
            this._drawTree(renderer.buffer);
            renderer.render();
        } else if (button === 2) {
            // Right click to increase indent level
            if (this.nodes.length > 0) {
                this.nodes[this.nodes.length - 1].level++;
            }
        }
    }
    
    _drawTree(buffer) {
        const indent = '    ';
        const branch = '├── ';
        const lastBranch = '└── ';
        const pipe = '│   ';
        
        this.nodes.forEach((node, i) => {
            const isLast = i === this.nodes.length - 1 || 
                          (i < this.nodes.length - 1 && this.nodes[i + 1].level <= node.level);
            
            let prefix = '';
            for (let l = 0; l < node.level; l++) {
                prefix += pipe;
            }
            prefix += isLast ? lastBranch : branch;
            
            buffer.drawText(node.x, node.y, prefix + 'item', AppState.strokeColor);
        });
    }
    
    deactivate() {
        super.deactivate();
        this.nodes = [];
    }
}

/**
 * Flowchart Tool
 */
class FlowchartTool extends Tool {
    constructor() {
        super('flowchart', '◇', null);
        this.shapeType = 'process'; // process, decision, terminal, io, document, database, subprocess
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    onMouseMove(x, y, renderer) {
        if (this.isDragging) {
            renderer.clearPreview();
            this._drawShapePreview(renderer.previewBuffer, this.startX, this.startY, x, y);
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            
            const minX = Math.min(this.startX, x);
            const minY = Math.min(this.startY, y);
            const width = Math.max(10, Math.abs(x - this.startX) + 1);
            const height = Math.max(3, Math.abs(y - this.startY) + 1);
            
            // Create appropriate FlowchartShape object
            let shape;
            switch (this.shapeType) {
                case 'terminal':
                    shape = new TerminalShape(minX, minY, width, height);
                    shape.label = 'Terminal';
                    break;
                case 'decision':
                    shape = new DecisionShape(minX, minY, width, Math.max(5, height));
                    shape.label = 'Yes/No?';
                    break;
                case 'io':
                    shape = new IOShape(minX, minY, width, height);
                    shape.label = 'Input/Output';
                    break;
                case 'document':
                    shape = new DocumentShape(minX, minY, width, height);
                    shape.label = 'Document';
                    break;
                case 'database':
                    shape = new DatabaseShape(minX, minY, width, height);
                    shape.label = 'Database';
                    break;
                case 'subprocess':
                    shape = new SubprocessShape(minX, minY, width, height);
                    shape.label = 'Subprocess';
                    break;
                case 'process':
                default:
                    shape = new ProcessShape(minX, minY, width, height);
                    shape.label = 'Process';
                    break;
            }
            
            shape.strokeColor = AppState.strokeColor;
            shape.name = `${this.shapeType} ${Date.now() % 10000}`;
            
            if (app && app.addObject) {
                app.addObject(shape, true);
            }
            
            this.isDragging = false;
        }
    }
    
    _drawShapePreview(buffer, x1, y1, x2, y2) {
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const width = Math.max(10, Math.abs(x2 - x1) + 1);
        const height = Math.max(3, Math.abs(y2 - y1) + 1);
        
        switch (this.shapeType) {
            case 'process':
                drawRect(buffer, minX, minY, width, height, { style: 'single', color: '#4a9eff' });
                break;
            case 'decision':
                this._drawDiamond(buffer, minX, minY, width, height);
                break;
            case 'terminal':
                this._drawRoundedRect(buffer, minX, minY, width, height);
                break;
            case 'io':
                drawRect(buffer, minX, minY, width, height, { style: 'double', color: '#4a9eff' });
                break;
            case 'document':
                drawRect(buffer, minX, minY, width, height, { style: 'single', color: '#4a9eff' });
                break;
            case 'database':
                this._drawRoundedRect(buffer, minX, minY, width, height);
                break;
            case 'subprocess':
                drawRect(buffer, minX, minY, width, height, { style: 'single', color: '#4a9eff' });
                break;
        }
    }
    
    _drawDiamond(buffer, x, y, width, height) {
        const cx = x + Math.floor(width / 2);
        const cy = y + Math.floor(height / 2);
        
        buffer.setChar(cx, y, '◇', '#4a9eff');
        buffer.setChar(x, cy, '◇', '#4a9eff');
        buffer.setChar(x + width - 1, cy, '◇', '#4a9eff');
        buffer.setChar(cx, y + height - 1, '◇', '#4a9eff');
        
        // Draw diagonals
        const hw = Math.floor(width / 2);
        const hh = Math.floor(height / 2);
        for (let i = 1; i < hh; i++) {
            const offset = Math.floor((hw * i) / hh);
            buffer.setChar(cx - offset, y + i, '╱', '#4a9eff');
            buffer.setChar(cx + offset, y + i, '╲', '#4a9eff');
            buffer.setChar(cx - offset, cy + i, '╲', '#4a9eff');
            buffer.setChar(cx + offset, cy + i, '╱', '#4a9eff');
        }
    }
    
    _drawRoundedRect(buffer, x, y, width, height) {
        buffer.setChar(x, y, '╭', '#4a9eff');
        buffer.setChar(x + width - 1, y, '╮', '#4a9eff');
        buffer.setChar(x, y + height - 1, '╰', '#4a9eff');
        buffer.setChar(x + width - 1, y + height - 1, '╯', '#4a9eff');
        
        for (let i = x + 1; i < x + width - 1; i++) {
            buffer.setChar(i, y, '─', '#4a9eff');
            buffer.setChar(i, y + height - 1, '─', '#4a9eff');
        }
        for (let i = y + 1; i < y + height - 1; i++) {
            buffer.setChar(x, i, '│', '#4a9eff');
            buffer.setChar(x + width - 1, i, '│', '#4a9eff');
        }
    }
}

/**
 * Connector Tool (arrows and lines)
 */
class ConnectorTool extends Tool {
    constructor() {
        super('connector', '→', null);
        this.connectorStyle = 'orthogonal'; // 'straight', 'orthogonal'
        this.lineType = 'solid'; // 'solid', 'dashed', 'double'
        this.arrowEnd = true;
        this.arrowStart = false;
        
        // For connecting to shapes
        this.fromShape = null;
        this.fromSnapPoint = null;
    }
    
    onMouseDown(x, y, button, renderer, app) {
        if (button === 0) {
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
            
            // Check if clicking on a flowchart shape snap point
            this.fromShape = null;
            this.fromSnapPoint = null;
            
            if (app) {
                const obj = app.findObjectAt(x, y);
                if (obj && obj instanceof FlowchartShape) {
                    const snapPoint = obj.getClosestSnapPoint(x, y);
                    if (snapPoint) {
                        this.fromShape = obj;
                        this.fromSnapPoint = snapPoint.id;
                        this.startX = snapPoint.x;
                        this.startY = snapPoint.y;
                    }
                }
            }
        }
    }
    
    onMouseMove(x, y, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            
            // Show snap point highlights for nearby shapes
            if (app) {
                const obj = app.findObjectAt(x, y);
                if (obj && obj instanceof FlowchartShape) {
                    const snapPoint = obj.getClosestSnapPoint(x, y);
                    if (snapPoint) {
                        // Highlight snap point
                        renderer.previewBuffer.setChar(snapPoint.x, snapPoint.y, '◉', '#00ff00');
                    }
                }
            }
            
            this._drawConnectorPreview(renderer.previewBuffer, this.startX, this.startY, x, y);
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            
            // Check if ending on a shape
            let toShape = null;
            let toSnapPoint = null;
            let endX = x, endY = y;
            
            if (app) {
                const obj = app.findObjectAt(x, y);
                if (obj && obj instanceof FlowchartShape) {
                    const snapPoint = obj.getClosestSnapPoint(x, y);
                    if (snapPoint) {
                        toShape = obj;
                        toSnapPoint = snapPoint.id;
                        endX = snapPoint.x;
                        endY = snapPoint.y;
                    }
                }
            }
            
            // Create FlowchartConnector object
            const connector = new FlowchartConnector();
            connector.connectorStyle = this.connectorStyle;
            connector.lineType = this.lineType;
            connector.arrowEnd = this.arrowEnd;
            connector.arrowStart = this.arrowStart;
            connector.strokeColor = AppState.strokeColor;
            connector.name = `Connector ${Date.now() % 10000}`;
            
            if (this.fromShape) {
                connector.setFromShape(this.fromShape, this.fromSnapPoint);
            } else {
                connector.startX = this.startX;
                connector.startY = this.startY;
            }
            
            if (toShape) {
                connector.setToShape(toShape, toSnapPoint);
            } else {
                connector.endX = endX;
                connector.endY = endY;
            }
            
            // Calculate waypoints for orthogonal routing
            if (this.connectorStyle === 'orthogonal') {
                connector._calculateOrthogonalRoute();
            }
            
            if (app && app.addObject) {
                app.addObject(connector, true);
            }
            
            this.isDragging = false;
            this.fromShape = null;
            this.fromSnapPoint = null;
        }
    }
    
    _drawConnectorPreview(buffer, x1, y1, x2, y2) {
        if (this.connectorStyle === 'orthogonal') {
            // Draw orthogonal connector (L-shaped)
            const midX = Math.round((x1 + x2) / 2);
            
            // Horizontal line from start
            this._drawLineSegment(buffer, x1, y1, midX, y1);
            // Vertical line
            this._drawLineSegment(buffer, midX, y1, midX, y2);
            // Horizontal line to end
            this._drawLineSegment(buffer, midX, y2, x2, y2);
            
            // Fix corners
            if (y1 !== y2) {
                const corner1 = y2 > y1 ? '┐' : '┘';
                const corner2 = y2 > y1 ? '└' : '┌';
                buffer.setChar(midX, y1, x2 > x1 ? corner1 : (y2 > y1 ? '┌' : '└'), '#4a9eff');
                buffer.setChar(midX, y2, x2 > x1 ? corner2 : (y2 > y1 ? '┘' : '┐'), '#4a9eff');
            }
        } else {
            // Straight line
            drawLine(buffer, x1, y1, x2, y2, { 
                style: this.lineType === 'dashed' ? 'dashed' : 'single',
                color: '#4a9eff' 
            });
        }
        
        // Draw arrow at end
        if (this.arrowEnd) {
            const arrowChar = x2 > x1 ? '▶' : (x2 < x1 ? '◀' : (y2 > y1 ? '▼' : '▲'));
            buffer.setChar(x2, y2, arrowChar, '#4a9eff');
        }
    }
    
    _drawLineSegment(buffer, x1, y1, x2, y2) {
        if (y1 === y2) {
            // Horizontal
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const char = this.lineType === 'dashed' ? '┄' : '─';
            for (let x = minX; x <= maxX; x++) {
                buffer.setChar(x, y1, char, '#4a9eff');
            }
        } else if (x1 === x2) {
            // Vertical
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            const char = this.lineType === 'dashed' ? '┆' : '│';
            for (let y = minY; y <= maxY; y++) {
                buffer.setChar(x1, y, char, '#4a9eff');
            }
        }
    }
}

/**
 * Chart Tool
 */
class ChartTool extends Tool {
    constructor() {
        super('chart', '▊', null);
        this.chartType = 'bar'; // bar, line, pie
    }
    
    onMouseDown(x, y, button, renderer) {
        if (button === 0) {
            this.isDragging = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    onMouseMove(x, y, renderer) {
        if (this.isDragging) {
            renderer.clearPreview();
            this._drawChart(renderer.previewBuffer, this.startX, this.startY, x, y);
            renderer.render();
        }
    }
    
    onMouseUp(x, y, button, renderer, app) {
        if (this.isDragging) {
            renderer.clearPreview();
            const minX = Math.min(this.startX, x);
            const minY = Math.min(this.startY, y);
            const width = Math.abs(x - this.startX) + 1;
            const height = Math.abs(y - this.startY) + 1;
            
            if (width >= 10 && height >= 5) {
                // Create ChartObject
                const chart = new ChartObject(minX, minY, width, height);
                chart.chartType = this.chartType;
                chart.strokeChar = AppState.strokeChar;
                chart.strokeColor = AppState.strokeColor;
                chart.name = `Chart ${Date.now() % 10000}`;
                
                if (app && app.addObject) {
                    app.addObject(chart, true);
                }
            }
            
            this.isDragging = false;
        }
    }
    
    _drawChart(buffer, x1, y1, x2, y2) {
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const width = Math.abs(x2 - x1) + 1;
        const height = Math.abs(y2 - y1) + 1;
        
        // Sample data
        const data = [0.3, 0.7, 0.5, 0.9, 0.4, 0.6];
        const barWidth = Math.floor((width - 2) / data.length);
        
        // Draw axes
        buffer.setChar(minX, minY + height - 1, '└', AppState.strokeColor);
        for (let i = 1; i < width; i++) {
            buffer.setChar(minX + i, minY + height - 1, '─', AppState.strokeColor);
        }
        for (let i = 0; i < height - 1; i++) {
            buffer.setChar(minX, minY + i, '│', AppState.strokeColor);
        }
        
        // Draw bars
        data.forEach((value, i) => {
            const barHeight = Math.round(value * (height - 2));
            const barX = minX + 1 + i * barWidth;
            
            for (let h = 0; h < barHeight; h++) {
                for (let w = 0; w < barWidth - 1; w++) {
                    buffer.setChar(barX + w, minY + height - 2 - h, '█', AppState.strokeColor);
                }
            }
        });
    }
}

// ==========================================
// TOOL MANAGER
// ==========================================

/**
 * Tool Manager
 */
class ToolManager extends EventEmitter {
    constructor() {
        super();
        
        this.tools = new Map();
        this.activeTool = null;
        
        // Register all tools
        this.register(new SelectTool());
        this.register(new DirectSelectTool());
        this.register(new PenTool());
        this.register(new PencilTool());
        this.register(new BrushTool());
        this.register(new LineTool());
        this.register(new RectangleTool());
        this.register(new EllipseTool());
        this.register(new PolygonTool());
        this.register(new StarTool());
        this.register(new TextTool());
        this.register(new AsciiTextTool());
        this.register(new BoxDrawTool());
        this.register(new TableTool());
        this.register(new TreeTool());
        this.register(new FlowchartTool());
        this.register(new ConnectorTool());
        this.register(new ChartTool());
        this.register(new FillTool());
        this.register(new EraserTool());
        
        // Set default tool
        this.setActiveTool('select');
    }
    
    register(tool) {
        this.tools.set(tool.name, tool);
    }
    
    setActiveTool(name) {
        if (this.activeTool) {
            this.activeTool.deactivate();
        }
        
        this.activeTool = this.tools.get(name);
        if (this.activeTool) {
            this.activeTool.activate();
            AppState.activeTool = name;
            this.emit('toolchange', { tool: this.activeTool });
            this._updateToolbarUI();
        }
    }
    
    _updateToolbarUI() {
        // Update toolbar button states
        $$('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === AppState.activeTool);
        });
        
        // Update status bar
        const toolElement = $('#status-tool');
        if (toolElement) {
            toolElement.textContent = AppState.activeTool.charAt(0).toUpperCase() + AppState.activeTool.slice(1);
        }
    }
    
    handleMouseDown(x, y, button, renderer, app) {
        if (this.activeTool) {
            this.activeTool.onMouseDown(x, y, button, renderer, app);
        }
    }
    
    handleMouseMove(x, y, renderer, app) {
        if (this.activeTool) {
            this.activeTool.onMouseMove(x, y, renderer, app);
        }
    }
    
    handleMouseUp(x, y, button, renderer, app) {
        if (this.activeTool) {
            this.activeTool.onMouseUp(x, y, button, renderer, app);
        }
    }
    
    handleKeyDown(key, renderer, app) {
        if (this.activeTool) {
            this.activeTool.onKeyDown(key, renderer, app);
        }
    }
}

// ==========================================
// APPLICATION
// ==========================================

/**
 * Main Application Class
 */
class Asciistrator extends EventEmitter {
    constructor() {
        super();
        
        this.renderer = null;
        this.toolManager = null;
        this.initialized = false;
        
        // Spatial index for fast hit-testing
        this.spatialIndex = null;
        this._spatialIndexDirty = true;
    }
    
    /**
     * Initialize the application
     */
    async init() {
        await domReady();
        
        console.log('🎨 Asciistrator initializing...');
        
        // Initialize canvas
        const canvasContainer = $('#viewport');
        if (!canvasContainer) {
            console.error('Canvas container not found');
            return;
        }
        
        this.renderer = new AsciiCanvasRenderer(canvasContainer);
        this.toolManager = new ToolManager();
        
        // Set up layer sync callback
        this.renderer.setSyncCallback(() => this.syncToActiveLayer());
        
        // Connect renderer events to tool manager
        this.renderer.on('mousedown', ({ x, y, button }) => {
            this.toolManager.handleMouseDown(x, y, button, this.renderer, this);
        });
        
        this.renderer.on('mousemove', ({ x, y }) => {
            this.toolManager.handleMouseMove(x, y, this.renderer, this);
        });
        
        this.renderer.on('mouseup', ({ x, y, button }) => {
            this.toolManager.handleMouseUp(x, y, button, this.renderer, this);
        });
        
        // Listen for transform changes to update rulers
        this.renderer.on('transform', () => {
            this._updateRulers();
        });
        
        // Setup keyboard shortcuts
        this._setupKeyboardShortcuts();
        
        // Setup toolbar
        this._setupToolbar();
        
        // Setup header bar (undo/redo, zoom, theme)
        this._setupHeaderBar();
        
        // Setup menus
        this._setupMenus();
        
        // Setup panels
        this._setupPanels();
        
        // Setup status bar
        this._setupStatusBar();
        
        // Setup context menu
        this._setupContextMenu();
        
        // Setup rulers
        this._setupRulers();
        
        // Setup mobile UI
        this._setupMobileUI();
        
        this.initialized = true;
        console.log('✅ Asciistrator initialized');
        
        this.emit('ready');
    }
    
    _setupContextMenu() {
        const contextMenu = $('#context-menu');
        if (!contextMenu) return;
        
        // Define context menu items
        const menuItems = [
            { label: 'Cut', action: () => this.cut(), shortcut: 'Ctrl+X' },
            { label: 'Copy', action: () => this.copy(), shortcut: 'Ctrl+C' },
            { label: 'Paste', action: () => this.paste(), shortcut: 'Ctrl+V' },
            { type: 'separator' },
            { label: 'Duplicate', action: () => this.duplicate(), shortcut: 'Ctrl+D' },
            { label: 'Delete', action: () => this.deleteSelected(), shortcut: 'Del' },
            { type: 'separator' },
            { label: 'Bring to Front', action: () => this.bringToFront() },
            { label: 'Send to Back', action: () => this.sendToBack() },
            { type: 'separator' },
            { label: 'Group', action: () => this.groupSelected(), shortcut: 'Ctrl+G' },
            { label: 'Ungroup', action: () => this.ungroupSelected(), shortcut: 'Ctrl+Shift+G' },
            { type: 'separator' },
            { label: 'Create Component...', action: () => this._showCreateComponentDialog() },
        ];
        
        // Handle right-click on canvas
        const viewport = $('#viewport');
        if (viewport) {
            viewport.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this._showContextMenu(e.clientX, e.clientY, menuItems);
            });
            
            // Long press for touch devices (context menu alternative)
            let longPressTimer = null;
            let longPressTriggered = false;
            const LONG_PRESS_DURATION = 500; // ms
            
            viewport.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    longPressTriggered = false;
                    const touch = e.touches[0];
                    longPressTimer = setTimeout(() => {
                        longPressTriggered = true;
                        this._showContextMenu(touch.clientX, touch.clientY, menuItems);
                        // Vibrate if supported
                        if (navigator.vibrate) {
                            navigator.vibrate(50);
                        }
                    }, LONG_PRESS_DURATION);
                }
            }, { passive: true });
            
            viewport.addEventListener('touchmove', () => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }, { passive: true });
            
            viewport.addEventListener('touchend', (e) => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                // Prevent click if long press was triggered
                if (longPressTriggered) {
                    e.preventDefault();
                    longPressTriggered = false;
                }
            });
        }
        
        // Close context menu on click anywhere
        document.addEventListener('click', () => {
            contextMenu.classList.add('hidden');
        });
        
        // Close on touch outside
        document.addEventListener('touchstart', (e) => {
            if (!contextMenu.contains(e.target) && !contextMenu.classList.contains('hidden')) {
                contextMenu.classList.add('hidden');
            }
        }, { passive: true });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                contextMenu.classList.add('hidden');
            }
        });
    }
    
    _showContextMenu(x, y, items) {
        const contextMenu = $('#context-menu');
        if (!contextMenu) return;
        
        // Build menu HTML
        contextMenu.innerHTML = '';
        
        items.forEach(item => {
            if (item.type === 'separator') {
                const sep = createElement('div', { class: 'context-menu-separator' });
                contextMenu.appendChild(sep);
            } else {
                const menuItem = createElement('button', { class: 'context-menu-item' });
                
                const labelSpan = createElement('span', {}, item.label);
                menuItem.appendChild(labelSpan);
                
                if (item.shortcut) {
                    const shortcutSpan = createElement('span', { class: 'context-menu-shortcut' }, item.shortcut);
                    menuItem.appendChild(shortcutSpan);
                }
                
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.action();
                    contextMenu.classList.add('hidden');
                });
                
                contextMenu.appendChild(menuItem);
            }
        });
        
        // Position menu
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.classList.remove('hidden');
        
        // Adjust if off-screen
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
    }
    
    _setupRulers() {
        this.rulerH = $('#ruler-horizontal');
        this.rulerV = $('#ruler-vertical');
        
        // Initial render
        this._updateRulers();
    }
    
    /**
     * Update rulers to follow pan and zoom
     */
    _updateRulers() {
        if (this.rulerH) {
            this._renderHorizontalRuler(this.rulerH);
        }
        
        if (this.rulerV) {
            this._renderVerticalRuler(this.rulerV);
        }
    }
    
    _renderHorizontalRuler(element) {
        const zoom = this.renderer ? this.renderer.zoom : 1;
        const panX = this.renderer ? this.renderer.panX : 0;
        const charWidth = this.renderer ? this.renderer.charWidth : 8;
        
        // Calculate the scaled character width
        const scaledCharWidth = charWidth * zoom;
        
        // Calculate visible range based on ruler width and pan
        const rulerWidth = element.offsetWidth || 800;
        
        // Determine tick interval based on zoom level
        let tickInterval = 10;
        let majorInterval = 50;
        if (zoom < 0.5) {
            tickInterval = 20;
            majorInterval = 100;
        } else if (zoom > 2) {
            tickInterval = 5;
            majorInterval = 25;
        }
        
        // Calculate start and end positions in canvas coordinates
        const startX = Math.floor(-panX / scaledCharWidth);
        const endX = Math.ceil((rulerWidth - panX) / scaledCharWidth);
        
        // Align to tick interval
        const alignedStart = Math.floor(startX / tickInterval) * tickInterval;
        const alignedEnd = Math.ceil(endX / tickInterval) * tickInterval + tickInterval;
        
        let html = '<div class="ruler-ticks" style="position: relative; width: 100%; height: 100%;">';
        
        for (let i = alignedStart; i <= alignedEnd; i += tickInterval) {
            if (i < 0) continue; // Don't show negative numbers
            
            const isMajor = i % majorInterval === 0;
            // Calculate pixel position: canvas coord * charWidth * zoom + panX
            const pixelPos = i * scaledCharWidth + panX;
            
            // Skip ticks outside visible area
            if (pixelPos < -50 || pixelPos > rulerWidth + 50) continue;
            
            html += `<div class="ruler-tick${isMajor ? ' major' : ''}" style="position: absolute; left: ${pixelPos}px;">`;
            if (isMajor) {
                html += `<span class="ruler-label">${i}</span>`;
            }
            html += '</div>';
        }
        html += '</div>';
        element.innerHTML = html;
    }
    
    _renderVerticalRuler(element) {
        const zoom = this.renderer ? this.renderer.zoom : 1;
        const panY = this.renderer ? this.renderer.panY : 0;
        const charHeight = this.renderer ? this.renderer.charHeight : 16;
        
        // Calculate the scaled character height
        const scaledCharHeight = charHeight * zoom;
        
        // Calculate visible range based on ruler height and pan
        const rulerHeight = element.offsetHeight || 600;
        
        // Determine tick interval based on zoom level
        let tickInterval = 10;
        let majorInterval = 50;
        if (zoom < 0.5) {
            tickInterval = 20;
            majorInterval = 100;
        } else if (zoom > 2) {
            tickInterval = 5;
            majorInterval = 25;
        }
        
        // Calculate start and end positions in canvas coordinates
        const startY = Math.floor(-panY / scaledCharHeight);
        const endY = Math.ceil((rulerHeight - panY) / scaledCharHeight);
        
        // Align to tick interval
        const alignedStart = Math.floor(startY / tickInterval) * tickInterval;
        const alignedEnd = Math.ceil(endY / tickInterval) * tickInterval + tickInterval;
        
        let html = '<div class="ruler-ticks" style="position: relative; width: 100%; height: 100%;">';
        
        for (let i = alignedStart; i <= alignedEnd; i += tickInterval) {
            if (i < 0) continue; // Don't show negative numbers
            
            const isMajor = i % majorInterval === 0;
            // Calculate pixel position: canvas coord * charHeight * zoom + panY
            const pixelPos = i * scaledCharHeight + panY;
            
            // Skip ticks outside visible area
            if (pixelPos < -50 || pixelPos > rulerHeight + 50) continue;
            
            html += `<div class="ruler-tick${isMajor ? ' major' : ''}" style="position: absolute; top: ${pixelPos}px;">`;
            if (isMajor) {
                html += `<span class="ruler-label">${i}</span>`;
            }
            html += '</div>';
        }
        html += '</div>';
        element.innerHTML = html;
    }
    
    /**
     * Setup mobile UI toggles and event handlers
     */
    _setupMobileUI() {
        // Mobile menu toggle
        const mobileMenuToggle = $('#mobile-menu-toggle');
        const menuItems = document.querySelector('.menu-items');
        
        if (mobileMenuToggle && menuItems) {
            mobileMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                menuItems.classList.toggle('open');
                mobileMenuToggle.classList.toggle('active');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!menuItems.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    menuItems.classList.remove('open');
                    mobileMenuToggle.classList.remove('active');
                }
            });
            
            // Close menu when menu item is clicked
            menuItems.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    // Delay closing to allow menu action to process
                    setTimeout(() => {
                        menuItems.classList.remove('open');
                        mobileMenuToggle.classList.remove('active');
                    }, 100);
                });
            });
        }
        
        // Mobile toolbar toggle
        const mobileToolbarToggle = $('#mobile-toolbar-toggle');
        const toolbar = $('#toolbar');
        
        if (mobileToolbarToggle && toolbar) {
            mobileToolbarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toolbar.classList.toggle('open');
                mobileToolbarToggle.classList.toggle('active');
                
                // Close panel if toolbar is opened
                const panel = $('#panel-right');
                const panelToggle = $('#mobile-panel-toggle');
                if (toolbar.classList.contains('open') && panel?.classList.contains('open')) {
                    panel.classList.remove('open');
                    panelToggle?.classList.remove('active');
                }
            });
            
            // Close toolbar when tool is selected
            toolbar.querySelectorAll('.tool-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        setTimeout(() => {
                            toolbar.classList.remove('open');
                            mobileToolbarToggle.classList.remove('active');
                        }, 150);
                    }
                });
            });
        }
        
        // Mobile panel toggle
        const mobilePanelToggle = $('#mobile-panel-toggle');
        const panelRight = $('#panel-right');
        
        if (mobilePanelToggle && panelRight) {
            mobilePanelToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                panelRight.classList.toggle('open');
                mobilePanelToggle.classList.toggle('active');
                
                // Close toolbar if panel is opened
                if (panelRight.classList.contains('open') && toolbar?.classList.contains('open')) {
                    toolbar.classList.remove('open');
                    mobileToolbarToggle?.classList.remove('active');
                }
            });
            
            // Close panel when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    if (!panelRight.contains(e.target) && 
                        !mobilePanelToggle.contains(e.target) &&
                        panelRight.classList.contains('open')) {
                        panelRight.classList.remove('open');
                        mobilePanelToggle.classList.remove('active');
                    }
                }
            });
        }
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            // Close all mobile panels on orientation change
            setTimeout(() => {
                toolbar?.classList.remove('open');
                panelRight?.classList.remove('open');
                menuItems?.classList.remove('open');
                mobileToolbarToggle?.classList.remove('active');
                mobilePanelToggle?.classList.remove('active');
                mobileMenuToggle?.classList.remove('active');
            }, 100);
        });
        
        // Handle resize to reset mobile states
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                toolbar?.classList.remove('open');
                panelRight?.classList.remove('open');
                menuItems?.classList.remove('open');
                mobileToolbarToggle?.classList.remove('active');
                mobilePanelToggle?.classList.remove('active');
                mobileMenuToggle?.classList.remove('active');
            }
        });
        
        // Prevent double-tap zoom on buttons
        document.querySelectorAll('button, .tool-btn, .menu-item, .panel-tab').forEach(el => {
            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                el.click();
            });
        });
        
        // Add touch feedback class
        this._setupTouchFeedback();
    }
    
    /**
     * Setup touch feedback for better UX
     */
    _setupTouchFeedback() {
        const interactiveElements = document.querySelectorAll(
            'button, .tool-btn, .menu-item, .panel-tab, .layer-item, .icon-btn, .context-menu-item'
        );
        
        interactiveElements.forEach(el => {
            el.addEventListener('touchstart', () => {
                el.classList.add('touch-active');
            }, { passive: true });
            
            el.addEventListener('touchend', () => {
                el.classList.remove('touch-active');
            }, { passive: true });
            
            el.addEventListener('touchcancel', () => {
                el.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    _setupKeyboardShortcuts() {
        // Track space key for pan mode
        document.addEventListener('keydown', (e) => {
            // Track space key for panning
            if (e.code === 'Space' && !e.repeat) {
                if (this.renderer) {
                    this.renderer._spacePressed = true;
                    this.renderer.viewport?.classList.add('panning');
                }
            }
            
            // Don't handle shortcuts when typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Zoom shortcuts
            if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
                e.preventDefault();
                this.renderer?.zoomIn();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                this.renderer?.zoomOut();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                this.renderer?.zoomReset();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '1') {
                e.preventDefault();
                this.renderer?.zoomFit();
                return;
            }
            
            // Tool shortcuts (based on SPECIFICATION.md)
            // Skip shortcuts if current tool is in typing mode
            const activeTool = this.toolManager?.activeTool;
            const isToolTyping = activeTool && activeTool.isTyping;
            
            if (!e.ctrlKey && !e.metaKey && !e.altKey && !isToolTyping) {
                const shortcuts = {
                    'v': 'select',       // Select tool
                    'a': 'direct-select',// Direct Select
                    'p': 'pen',          // Pen tool
                    'n': 'pencil',       // Pencil
                    'b': 'brush',        // Brush
                    'r': 'rectangle',    // Rectangle
                    'o': 'ellipse',      // Ellipse
                    't': 'text',         // Text
                    'e': 'eraser',       // Eraser
                    '\\': 'line',        // Line
                    'l': 'line',         // Line (alternative)
                };
                
                if (shortcuts[e.key.toLowerCase()]) {
                    e.preventDefault();
                    this.toolManager.setActiveTool(shortcuts[e.key.toLowerCase()]);
                    return;
                }
                
                // X key to swap colors
                if (e.key.toLowerCase() === 'x') {
                    e.preventDefault();
                    this.swapColors();
                    return;
                }
            }
            
            // Pass key to active tool
            this.toolManager.handleKeyDown(e.key, this.renderer, this);
            
            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.newDocument();
                        break;
                    case 's':
                        e.preventDefault();
                        this.save();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.export();
                        break;
                    case 'x':
                        e.preventDefault();
                        this.cut();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.copy();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.paste();
                        break;
                    case 'g':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.ungroupSelected();
                        } else {
                            this.groupSelected();
                        }
                        break;
                    case 'a':
                        e.preventDefault();
                        this.selectAll();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.duplicate();
                        break;
                }
            }
            
            // Delete/Backspace to delete selected objects
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (AppState.selectedObjects.length > 0 && 
                    e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.deleteSelected();
                }
            }
        });
        
        // Track space key release for pan mode
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                if (this.renderer) {
                    this.renderer._spacePressed = false;
                    if (!this.renderer.isPanning) {
                        this.renderer.viewport?.classList.remove('panning');
                    }
                }
            }
        });
    }
    
    _setupToolbar() {
        // Tool buttons
        $$('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                if (tool) {
                    this.toolManager.setActiveTool(tool);
                }
            });
        });
        
        // Color swatches with HTML5 color picker
        const strokeColor = $('#stroke-color');
        const fillColor = $('#fill-color');
        const swapColors = $('#swap-colors');
        
        // Create hidden color inputs for picker functionality
        const strokeColorInput = document.createElement('input');
        strokeColorInput.type = 'color';
        strokeColorInput.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:0;height:0;';
        strokeColorInput.value = AppState.strokeColor || '#ffffff';
        
        const fillColorInput = document.createElement('input');
        fillColorInput.type = 'color';
        fillColorInput.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:0;height:0;';
        fillColorInput.value = AppState.fillColor || '#ffffff';
        
        if (strokeColor) {
            strokeColor.appendChild(strokeColorInput);
            strokeColor.style.backgroundColor = AppState.strokeColor || '#ffffff';
            
            strokeColor.addEventListener('click', (e) => {
                e.stopPropagation();
                strokeColorInput.click();
            });
            
            strokeColorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                AppState.strokeColor = color;
                strokeColor.style.backgroundColor = color;
            });
            
            strokeColorInput.addEventListener('change', (e) => {
                const color = e.target.value;
                AppState.strokeColor = color;
                strokeColor.style.backgroundColor = color;
            });
        }
        
        if (fillColor) {
            fillColor.appendChild(fillColorInput);
            // Show transparency pattern if no fill
            this._updateFillColorDisplay(fillColor, AppState.fillColor);
            
            fillColor.addEventListener('click', (e) => {
                e.stopPropagation();
                fillColorInput.click();
            });
            
            fillColor.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                // Double-click to clear fill (make transparent)
                AppState.fillColor = null;
                this._updateFillColorDisplay(fillColor, null);
            });
            
            fillColorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                AppState.fillColor = color;
                this._updateFillColorDisplay(fillColor, color);
            });
            
            fillColorInput.addEventListener('change', (e) => {
                const color = e.target.value;
                AppState.fillColor = color;
                this._updateFillColorDisplay(fillColor, color);
            });
        }
        
        if (swapColors) {
            swapColors.addEventListener('click', (e) => {
                e.stopPropagation();
                this.swapColors();
            });
        }
        
        // Update initial state
        this.toolManager._updateToolbarUI();
    }
    
    _setupHeaderBar() {
        // Undo/Redo buttons
        const undoBtn = $('#btn-undo');
        const redoBtn = $('#btn-redo');
        
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
        
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }
        
        // Initialize undo/redo button states
        this._updateUndoRedoButtons();
        
        // Zoom buttons
        const zoomInBtn = $('#btn-zoom-in');
        const zoomOutBtn = $('#btn-zoom-out');
        const zoomLevel = $('#zoom-level');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        
        if (zoomLevel) {
            zoomLevel.addEventListener('click', () => this.zoomReset());
            zoomLevel.addEventListener('dblclick', () => this.zoomFit());
            zoomLevel.style.cursor = 'pointer';
            zoomLevel.title = 'Click to reset zoom, double-click to fit';
        }
        
        // Theme selector
        const themeSelect = $('#theme-select');
        if (themeSelect) {
            themeSelect.value = AppState.theme;
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }
    }
    
    _setupStatusBar() {
        // Update status bar periodically
        this._updateStatusBar();
        
        // Add click handlers for interactive status bar items
        const statusZoom = $('#status-zoom');
        if (statusZoom) {
            statusZoom.addEventListener('click', () => this.zoomReset());
            statusZoom.addEventListener('dblclick', () => this.zoomFit());
            statusZoom.title = 'Click to reset zoom, double-click to fit';
        }
    }
    
    _updateStatusBar() {
        const statusObjects = $('#status-objects');
        const statusLayers = $('#status-layers');
        const statusZoom = $('#status-zoom');
        const statusGrid = $('#status-grid');
        const statusCanvasSize = $('#status-canvas-size');
        
        if (statusObjects) {
            let objectCount = 0;
            for (const layer of AppState.layers) {
                if (layer.objects) objectCount += layer.objects.length;
            }
            statusObjects.textContent = `Objects: ${objectCount}`;
        }
        
        if (statusLayers) {
            statusLayers.textContent = `Layers: ${AppState.layers.length}`;
        }
        
        if (statusZoom) {
            statusZoom.textContent = `Zoom: ${Math.round(AppState.zoom * 100)}%`;
        }
        
        if (statusGrid) {
            statusGrid.textContent = `Grid: ${AppState.gridSize}×${AppState.gridSize}`;
        }
        
        if (statusCanvasSize) {
            statusCanvasSize.textContent = `Canvas: ${AppState.canvasWidth}×${AppState.canvasHeight}`;
        }
        
        // Update zoom level display in header
        const zoomLevel = $('#zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(AppState.zoom * 100)}%`;
        }
    }

    _setupMenus() {
        // Menu definitions
        const menuDefinitions = {
            file: [
                { label: 'New', action: 'new', shortcut: 'Ctrl+N' },
                { label: 'Open...', action: 'open', shortcut: 'Ctrl+O' },
                { label: 'Save', action: 'save', shortcut: 'Ctrl+S' },
                { type: 'separator' },
                { label: 'Page Size...', action: 'page-size' },
                { type: 'separator' },
                { label: 'Export as Text', action: 'export-txt' },
                { label: 'Export as HTML', action: 'export-html' },
            ],
            edit: [
                { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
                { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
                { type: 'separator' },
                { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
                { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
                { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' },
                { type: 'separator' },
                { label: 'Copy as Text', action: 'copy-as-text' },
                { label: 'Copy as HTML', action: 'copy-as-html' },
                { type: 'separator' },
                { label: 'Clear Canvas', action: 'clear' },
            ],
            view: [
                { label: 'Toggle Grid', action: 'grid-toggle' },
                { label: 'Grid Spacing...', action: 'grid-spacing' },
                { type: 'separator' },
                { label: 'Zoom In', action: 'zoom-in', shortcut: 'Ctrl++' },
                { label: 'Zoom Out', action: 'zoom-out', shortcut: 'Ctrl+-' },
                { label: 'Zoom 100%', action: 'zoom-reset', shortcut: 'Ctrl+0' },
                { label: 'Fit to Window', action: 'zoom-fit', shortcut: 'Ctrl+1' },
            ],
            object: [
                { label: 'Group', action: 'group', shortcut: 'Ctrl+G' },
                { label: 'Ungroup', action: 'ungroup', shortcut: 'Ctrl+Shift+G' },
                { type: 'separator' },
                { label: 'Bring to Front', action: 'bring-front' },
                { label: 'Send to Back', action: 'send-back' },
                { type: 'separator' },
                { label: 'Create Component...', action: 'create-component' },
            ],
            charts: [
                { label: 'Insert Bar Chart', action: 'chart-bar' },
                { label: 'Insert Line Chart', action: 'chart-line' },
                { label: 'Insert Pie Chart', action: 'chart-pie' },
                { label: 'Insert Scatter Plot', action: 'chart-scatter' },
            ],
            flow: [
                { label: 'Insert Process', action: 'flow-process' },
                { label: 'Insert Decision', action: 'flow-decision' },
                { label: 'Insert Terminator', action: 'flow-terminator' },
                { type: 'separator' },
                { label: 'Auto-layout', action: 'flow-autolayout' },
            ],
            window: [
                { label: 'Layers Panel', action: 'panel-layers' },
                { label: 'Properties Panel', action: 'panel-properties' },
                { label: 'Components Panel', action: 'panel-components' },
                { label: 'Characters Panel', action: 'panel-chars' },
            ],
            help: [
                { label: 'Keyboard Shortcuts', action: 'shortcuts' },
                { label: 'Documentation', action: 'docs' },
                { type: 'separator' },
                { label: 'About Asciistrator', action: 'about' },
            ]
        };

        // Setup menu button click handlers
        $$('.menu-item[data-menu]').forEach(btn => {
            const menuName = btn.dataset.menu;
            const menuItems = menuDefinitions[menuName];
            
            if (!menuItems) return;
            
            // Create dropdown element
            const dropdown = createElement('div', { class: 'menu-dropdown' });
            
            menuItems.forEach(item => {
                if (item.type === 'separator') {
                    dropdown.appendChild(createElement('div', { class: 'menu-separator' }));
                } else {
                    const menuItem = createElement('button', {
                        class: 'menu-dropdown-item',
                        'data-action': item.action
                    });
                    
                    const labelSpan = createElement('span', {}, item.label);
                    menuItem.appendChild(labelSpan);
                    
                    if (item.shortcut) {
                        const shortcutSpan = createElement('span', { class: 'menu-shortcut' }, item.shortcut);
                        menuItem.appendChild(shortcutSpan);
                    }
                    
                    menuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this._handleMenuAction(item.action);
                        this._closeAllDropdowns();
                    });
                    
                    dropdown.appendChild(menuItem);
                }
            });
            
            // Wrap button and dropdown together
            const wrapper = createElement('div', { class: 'menu-item-wrapper' });
            btn.parentNode.insertBefore(wrapper, btn);
            wrapper.appendChild(btn);
            wrapper.appendChild(dropdown);
            
            // Toggle dropdown on click
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('show');
                this._closeAllDropdowns();
                if (!isOpen) {
                    dropdown.classList.add('show');
                }
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item-wrapper')) {
                this._closeAllDropdowns();
            }
        });
    }
    
    _closeAllDropdowns() {
        $$('.menu-dropdown.show').forEach(d => d.classList.remove('show'));
    }
    
    _handleMenuAction(action) {
        // Support both function and string actions
        if (typeof action === 'function') {
            action();
            return;
        }
        
        switch (action) {
            case 'new':
                this.newDocument();
                break;
            case 'open':
                this.open();
                break;
            case 'save':
                this.save();
                break;
            case 'page-size':
                this.showPageSizeDialog();
                break;
            case 'export-txt':
                this.export('txt');
                break;
            case 'export-html':
                this.export('html');
                break;
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
            case 'clear':
                this.clear();
                break;
            case 'copy-as-text':
                this.copyAsText();
                break;
            case 'copy-as-html':
                this.copyAsHtml();
                break;
            case 'theme-dark':
                this.setTheme('dark');
                break;
            case 'theme-light':
                this.setTheme('light');
                break;
            case 'theme-midnight':
                this.setTheme('midnight');
                break;
            case 'grid-toggle':
                this.toggleGrid();
                break;
            case 'grid-spacing':
                this.showGridSpacingDialog();
                break;
            // View - Zoom
            case 'zoom-in':
                this.zoomIn();
                break;
            case 'zoom-out':
                this.zoomOut();
                break;
            case 'zoom-reset':
                this.zoomReset();
                break;
            case 'zoom-fit':
                this.zoomFit();
                break;
            // Edit - Clipboard
            case 'cut':
                this.cut();
                break;
            case 'copy':
                this.copy();
                break;
            case 'paste':
                this.paste();
                break;
            // Object
            case 'group':
                this.groupSelected();
                break;
            case 'ungroup':
                this.ungroupSelected();
                break;
            case 'bring-front':
                this.bringToFront();
                break;
            case 'send-back':
                this.sendToBack();
                break;
            case 'create-component':
                this._showCreateComponentDialog();
                break;
            // Charts
            case 'chart-bar':
                this.insertChart('bar');
                break;
            case 'chart-line':
                this.insertChart('line');
                break;
            case 'chart-pie':
                this.insertChart('pie');
                break;
            case 'chart-scatter':
                this.insertChart('scatter');
                break;
            // Flowchart
            case 'flow-process':
                this.insertFlowchartShape('process');
                break;
            case 'flow-decision':
                this.insertFlowchartShape('decision');
                break;
            case 'flow-terminator':
                this.insertFlowchartShape('terminator');
                break;
            case 'flow-autolayout':
                this.autoLayoutFlowchart();
                break;
            // Window - Panels
            case 'panel-layers':
                this.togglePanel('layers');
                break;
            case 'panel-properties':
                this.togglePanel('properties');
                break;
            case 'panel-components':
                this.togglePanel('components');
                break;
            case 'panel-chars':
                this.togglePanel('chars');
                break;
            // Help
            case 'shortcuts':
                this.showShortcuts();
                break;
            case 'docs':
                this.showDocumentation();
                break;
            case 'about':
                this.showAbout();
                break;
        }
    }
    
    _setupPanels() {
        // Setup panel tab switching
        this._setupPanelTabs();
        
        // Character palette
        this._setupCharacterPalette();
        
        // Properties panel
        this._setupPropertiesPanel();
        
        // Layers panel
        this._setupLayersPanel();
        
        // Components panel
        this._setupComponentsPanel();
    }
    
    _setupPanelTabs() {
        // Handle panel tab clicks
        $$('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const panelName = tab.dataset.panel;
                
                // Update tab active states
                $$('.panel-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update panel content visibility
                $$('.panel-content').forEach(panel => {
                    panel.classList.remove('active');
                });
                
                const targetPanel = $(`#panel-${panelName}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }
    
    _setupCharacterPalette() {
        // Setup character grids in the Chars panel
        // Full printable ASCII (32-126)
        const asciiPrintable = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
        
        const charGrids = {
            'chars-ascii': asciiPrintable,
            'chars-box': '─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬╭╮╰╯━┃┏┓┗┛┣┫┳┻╋┄┆┈┊',
            'chars-blocks': '█▓▒░▀▄▌▐▖▗▘▝▙▛▜▟■□▪▫◼◻⬛⬜',
            'chars-arrows': '←↑→↓↔↕↖↗↘↙⇐⇑⇒⇓⇔⇕◀▲▶▼◁△▷▽◂▴▸▾‹›«»',
            'chars-shapes': '●○◐◑◒◓◔◕◖◗◆◇◈❖★☆✦✧✩✪✫✬♠♣♥♦♡',
            'chars-math': '±−×÷≠≤≥≈≡∞∑∏√∫∂∆∇∀∃∈∉∪∩⊂⊃∧∨¬πθφωαβγσμλ',
            'chars-misc': '·•°†‡§¶©®™¢£¥€¤¦¨ª¬¯²³µ¹º¼½¾¿÷'
        };
        
        Object.entries(charGrids).forEach(([id, chars]) => {
            const grid = $(`#${id}`);
            if (grid) {
                grid.innerHTML = '';
                chars.split('').forEach(char => {
                    const btn = createElement('button', {
                        class: 'char-btn',
                        title: `Character: ${char} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`,
                        onClick: () => {
                            AppState.strokeChar = char;
                            $$('.char-btn.active').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                        }
                    }, char);
                    grid.appendChild(btn);
                });
            }
        });
        
        // Also setup the old char-palette if it exists
        const palette = $('#char-palette');
        if (palette) {
            const chars = DensityPalettes.standard;
            palette.innerHTML = '';
            
            chars.forEach(char => {
                const btn = createElement('button', {
                    class: 'char-btn',
                    title: `Character: ${char}`,
                    onClick: () => {
                        AppState.strokeChar = char;
                        $$('.char-btn.active').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    }
                }, char);
                palette.appendChild(btn);
            });
        }
    }
    
    _setupPropertiesPanel() {
        const self = this;
        
        // Helper to update selected object and re-render
        const updateSelectedObject = (prop, value) => {
            if (AppState.selectedObjects.length > 0) {
                const obj = AppState.selectedObjects[0];
                const oldValue = obj[prop];
                
                // For lines, also update x1,y1 when x,y changes
                if (prop === 'x' && obj.x1 !== undefined) {
                    const dx = value - (oldValue || 0);
                    obj.x1 += dx;
                    obj.x2 += dx;
                    obj.x = value;
                } else if (prop === 'y' && obj.y1 !== undefined) {
                    const dy = value - (oldValue || 0);
                    obj.y1 += dy;
                    obj.y2 += dy;
                    obj.y = value;
                } else {
                    obj[prop] = value;
                }
                
                // Update bounds after property change
                if (obj._updateBounds) {
                    obj._updateBounds();
                }
                
                // Mark spatial index as dirty
                self._spatialIndexDirty = true;
                self.renderAllObjects();
            }
        };
        
        // Text input for text/flowchart objects
        const propText = $('#prop-text');
        const propTextGroup = $('#prop-text-group');
        if (propText) {
            propText.addEventListener('change', (e) => {
                if (AppState.selectedObjects.length > 0) {
                    const obj = AppState.selectedObjects[0];
                    if (obj.type === 'text' || obj.type === 'ascii-text') {
                        obj.text = e.target.value;
                        obj._updateBounds();
                    } else if (obj.label !== undefined) {
                        // Flowchart shapes have label property
                        obj.label = e.target.value;
                    }
                    self._spatialIndexDirty = true;
                    self.renderAllObjects();
                    self._updateLayerList();
                }
            });
            
            // Also handle input event for real-time preview
            propText.addEventListener('input', (e) => {
                if (AppState.selectedObjects.length > 0) {
                    const obj = AppState.selectedObjects[0];
                    if (obj.type === 'text' || obj.type === 'ascii-text') {
                        obj.text = e.target.value;
                        obj._updateBounds();
                        self.renderAllObjects();
                    }
                }
            });
        }
        
        // Position inputs
        const propX = $('#prop-x');
        const propY = $('#prop-y');
        const propWidth = $('#prop-width');
        const propHeight = $('#prop-height');
        
        if (propX) {
            propX.addEventListener('change', (e) => {
                updateSelectedObject('x', parseInt(e.target.value) || 0);
            });
        }
        
        if (propY) {
            propY.addEventListener('change', (e) => {
                updateSelectedObject('y', parseInt(e.target.value) || 0);
            });
        }
        
        if (propWidth) {
            propWidth.addEventListener('change', (e) => {
                updateSelectedObject('width', parseInt(e.target.value) || 1);
            });
        }
        
        if (propHeight) {
            propHeight.addEventListener('change', (e) => {
                updateSelectedObject('height', parseInt(e.target.value) || 1);
            });
        }
        
        // Color inputs
        const strokeColorInput = $('#prop-stroke-color');
        const fillColorInput = $('#prop-fill-color');
        
        if (strokeColorInput) {
            strokeColorInput.addEventListener('change', (e) => {
                updateSelectedObject('strokeColor', e.target.value);
            });
            strokeColorInput.addEventListener('input', (e) => {
                // Real-time preview
                updateSelectedObject('strokeColor', e.target.value);
            });
        }
        
        if (fillColorInput) {
            fillColorInput.addEventListener('change', (e) => {
                updateSelectedObject('fillColor', e.target.value);
            });
            fillColorInput.addEventListener('input', (e) => {
                // Real-time preview
                updateSelectedObject('fillColor', e.target.value);
            });
        }
        
        // Fill character select
        const fillCharInput = $('#prop-fill-char');
        if (fillCharInput) {
            fillCharInput.addEventListener('change', (e) => {
                const value = e.target.value || '';
                updateSelectedObject('fillChar', value);
                // Also set filled to true if fillChar is set, false if empty
                updateSelectedObject('filled', value !== '');
            });
        }
        
        // Border style selector
        const borderStyle = $('#prop-border-style');
        if (borderStyle) {
            borderStyle.addEventListener('change', (e) => {
                AppState.lineStyle = e.target.value;
                updateSelectedObject('lineStyle', e.target.value);
            });
        }
        
        // Line style selector (legacy)
        const styleSelect = $('#line-style');
        if (styleSelect) {
            styleSelect.addEventListener('change', (e) => {
                AppState.lineStyle = e.target.value;
            });
        }
    }
    
    _setupLayersPanel() {
        // Initialize layers with buffers and object arrays
        if (AppState.layers.length === 0) {
            AppState.layers = [{
                id: 0,
                name: 'Layer 1',
                visible: true,
                locked: false,
                buffer: null, // Will be initialized when first used
                objects: []   // Array of SceneObjects
            }];
            AppState.activeLayerId = 0;
        }
        
        // Initialize layer buffers
        this._initializeLayerBuffers();
        
        // New layer button
        const newLayerBtn = $('#btn-new-layer');
        if (newLayerBtn) {
            newLayerBtn.addEventListener('click', () => {
                const newId = Math.max(...AppState.layers.map(l => l.id)) + 1;
                const newLayer = {
                    id: newId,
                    name: `Layer ${newId + 1}`,
                    visible: true,
                    locked: false,
                    buffer: new AsciiBuffer(AppState.canvasWidth, AppState.canvasHeight),
                    objects: []
                };
                AppState.layers.push(newLayer);
                AppState.activeLayerId = newId;
                this._updateLayerList();
                this._updateStatus(`Created Layer ${newId + 1}`);
            });
        }
        
        // Delete layer button
        const deleteLayerBtn = $('#btn-delete-layer');
        if (deleteLayerBtn) {
            deleteLayerBtn.addEventListener('click', () => {
                if (AppState.layers.length > 1) {
                    const idx = AppState.layers.findIndex(l => l.id === AppState.activeLayerId);
                    if (idx > -1) {
                        const deletedName = AppState.layers[idx].name;
                        AppState.layers.splice(idx, 1);
                        AppState.activeLayerId = AppState.layers[Math.min(idx, AppState.layers.length - 1)].id;
                        // Invalidate spatial index and re-render
                        this._spatialIndexDirty = true;
                        this.renderAllObjects();
                        this._updateLayerList();
                        this._updateStatus(`Deleted ${deletedName}`);
                    }
                }
            });
        }
        
        // Setup initial layer list
        this._updateLayerList();
    }
    
    _initializeLayerBuffers() {
        // Ensure all layers have buffers and objects arrays
        AppState.layers.forEach(layer => {
            if (!layer.buffer) {
                layer.buffer = new AsciiBuffer(AppState.canvasWidth, AppState.canvasHeight);
            }
            if (!layer.objects) {
                layer.objects = [];
            }
        });
        
        // Copy current buffer content to first layer if it has content
        if (AppState.layers.length > 0 && this.renderer && this.renderer.buffer) {
            const firstLayer = AppState.layers[0];
            if (firstLayer.buffer) {
                // Copy main buffer to first layer
                for (let y = 0; y < this.renderer.buffer.height; y++) {
                    for (let x = 0; x < this.renderer.buffer.width; x++) {
                        const char = this.renderer.buffer.getChar(x, y);
                        const color = this.renderer.buffer.getColor(x, y);
                        firstLayer.buffer.setChar(x, y, char, color);
                    }
                }
            }
        }
    }
    
    _compositeAllLayers() {
        // For single layer, just sync buffer to it first
        if (AppState.layers.length === 1) {
            this._syncBufferToActiveLayer();
        }
        
        const mainBuffer = this.renderer.buffer;
        const width = mainBuffer.width;
        const height = mainBuffer.height;
        
        // Clear main buffer
        mainBuffer.clear();
        
        // Composite all visible layers (bottom to top) using direct array access
        for (const layer of AppState.layers) {
            if (!layer.visible || !layer.buffer) continue;
            
            const srcChars = layer.buffer.chars;
            const srcColors = layer.buffer.colors;
            const dstChars = mainBuffer.chars;
            const dstColors = mainBuffer.colors;
            
            for (let y = 0; y < height; y++) {
                const srcRow = srcChars[y];
                const srcColorRow = srcColors[y];
                const dstRow = dstChars[y];
                const dstColorRow = dstColors[y];
                
                for (let x = 0; x < width; x++) {
                    const char = srcRow[x];
                    if (char !== ' ') {
                        dstRow[x] = char;
                        dstColorRow[x] = srcColorRow[x];
                    }
                }
            }
        }
        
        this.renderer.markFullDirty();
        this.renderer.render();
    }
    
    _syncBufferToActiveLayer() {
        const activeLayer = AppState.layers.find(l => l.id === AppState.activeLayerId);
        if (!activeLayer || !activeLayer.buffer) return;
        
        // Skip if buffers are the same size and layer is already in sync
        const srcBuffer = this.renderer.buffer;
        const dstBuffer = activeLayer.buffer;
        
        if (srcBuffer.width !== dstBuffer.width || srcBuffer.height !== dstBuffer.height) {
            dstBuffer.resize(srcBuffer.width, srcBuffer.height);
        }
        
        // Direct array copy for better performance
        for (let y = 0; y < srcBuffer.height; y++) {
            dstBuffer.chars[y] = [...srcBuffer.chars[y]];
            dstBuffer.colors[y] = [...srcBuffer.colors[y]];
        }
    }
    
    // Call this after any drawing operation to keep layer in sync
    syncToActiveLayer() {
        const activeLayer = AppState.layers.find(l => l.id === AppState.activeLayerId);
        if (!activeLayer || !activeLayer.buffer) return;
        
        // Direct array reference copy for performance
        const srcBuffer = this.renderer.buffer;
        const dstBuffer = activeLayer.buffer;
        
        for (let y = 0; y < srcBuffer.height; y++) {
            dstBuffer.chars[y] = [...srcBuffer.chars[y]];
            dstBuffer.colors[y] = [...srcBuffer.colors[y]];
        }
    }
    
    // Add object to active layer
    addObject(obj, saveUndo = false) {
        if (saveUndo) {
            this.saveStateForUndo();
        }
        const activeLayer = AppState.layers.find(l => l.id === AppState.activeLayerId);
        if (!activeLayer) return;
        if (!activeLayer.objects) activeLayer.objects = [];
        activeLayer.objects.push(obj);
        this._spatialIndexDirty = true; // Mark spatial index as needing rebuild
        this.renderAllObjects();
        this._updateStatusBar();
        this._updateLayerList(); // Update tree view
    }
    
    // Remove object from its layer
    removeObject(objId, saveUndo = false) {
        if (saveUndo) {
            this.saveStateForUndo();
        }
        for (const layer of AppState.layers) {
            if (!layer.objects) continue;
            const idx = layer.objects.findIndex(o => o.id === objId);
            if (idx !== -1) {
                layer.objects.splice(idx, 1);
                this._spatialIndexDirty = true; // Mark spatial index as needing rebuild
                this.renderAllObjects();
                this._updateStatusBar();
                this._updateLayerList(); // Update tree view
                return true;
            }
        }
        return false;
    }
    
    /**
     * Rebuild the spatial index (QuadTree)
     */
    _rebuildSpatialIndex() {
        const width = this.renderer ? this.renderer.buffer.width : 200;
        const height = this.renderer ? this.renderer.buffer.height : 100;
        
        // Create new QuadTree covering the entire canvas with some padding
        this.spatialIndex = new QuadTree(
            new AABB(-100, -100, width + 200, height + 200),
            8,  // maxObjects per node
            6   // maxLevels
        );
        
        // Insert all visible objects from all layers
        for (const layer of AppState.layers) {
            if (!layer.visible || layer.locked || !layer.objects) continue;
            
            for (const obj of layer.objects) {
                if (!obj.visible) continue;
                const bounds = obj.getBounds();
                this.spatialIndex.insert(obj, new AABB(bounds.x, bounds.y, bounds.width, bounds.height));
            }
        }
        
        this._spatialIndexDirty = false;
    }
    
    /**
     * Mark spatial index as dirty (needs rebuild)
     */
    invalidateSpatialIndex() {
        this._spatialIndexDirty = true;
    }
    
    // Find object at position (for selection) - uses QuadTree for fast queries
    findObjectAt(x, y) {
        // Rebuild spatial index if dirty
        if (this._spatialIndexDirty || !this.spatialIndex) {
            this._rebuildSpatialIndex();
        }
        
        // Query QuadTree for candidate objects at this point
        const candidates = this.spatialIndex.queryPoint(x, y);
        
        // Filter candidates by actual containsPoint test and find topmost
        // We need to check layer order and object order within layers
        let topObject = null;
        let topLayerIndex = -1;
        let topObjectIndex = -1;
        
        for (const obj of candidates) {
            if (!obj.containsPoint(x, y)) continue;
            
            // Find which layer this object belongs to and its index
            for (let li = 0; li < AppState.layers.length; li++) {
                const layer = AppState.layers[li];
                if (!layer.visible || layer.locked || !layer.objects) continue;
                
                const objIndex = layer.objects.indexOf(obj);
                if (objIndex !== -1) {
                    // Higher layer index = on top, higher object index within layer = on top
                    if (li > topLayerIndex || (li === topLayerIndex && objIndex > topObjectIndex)) {
                        topObject = obj;
                        topLayerIndex = li;
                        topObjectIndex = objIndex;
                    }
                    break;
                }
            }
        }
        
        return topObject;
    }
    
    // Find all objects in a region (for marquee selection) - uses QuadTree
    findObjectsInRegion(x1, y1, x2, y2) {
        // Rebuild spatial index if dirty
        if (this._spatialIndexDirty || !this.spatialIndex) {
            this._rebuildSpatialIndex();
        }
        
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        
        // Query QuadTree for candidate objects in region
        const region = new AABB(minX, minY, maxX - minX, maxY - minY);
        const candidates = this.spatialIndex.queryRegion(region);
        
        // Filter to only include objects whose bounds actually intersect
        const results = [];
        for (const obj of candidates) {
            const bounds = obj.getBounds();
            // Check if object bounds intersect selection region
            if (bounds.x < maxX && bounds.x + bounds.width > minX &&
                bounds.y < maxY && bounds.y + bounds.height > minY) {
                results.push(obj);
            }
        }
        
        return results;
    }
    
    // Render all objects from all visible layers to buffer
    renderAllObjects() {
        const mainBuffer = this.renderer.buffer;
        const width = mainBuffer.width;
        const height = mainBuffer.height;
        
        // Clear main buffer once
        mainBuffer.clear();
        
        // Track which layers need buffer clear
        const layersToRender = AppState.layers.filter(l => l.visible && l.objects && l.objects.length > 0);
        
        // If single layer or no intermediate buffers needed, render directly to main
        if (layersToRender.length === 1) {
            const layer = layersToRender[0];
            for (const obj of layer.objects) {
                if (obj.visible) {
                    obj.render(mainBuffer);
                }
            }
        } else {
            // Multi-layer: composite from bottom to top
            for (const layer of AppState.layers) {
                if (!layer.visible || !layer.objects || layer.objects.length === 0) continue;
                
                // Clear layer buffer
                if (layer.buffer) {
                    layer.buffer.clear();
                }
                
                // Render each object to the layer's buffer
                const targetBuffer = layer.buffer || mainBuffer;
                for (const obj of layer.objects) {
                    if (obj.visible) {
                        obj.render(targetBuffer);
                    }
                }
                
                // Composite layer buffer to main buffer using direct array access
                if (layer.buffer && layer.buffer !== mainBuffer) {
                    const srcChars = layer.buffer.chars;
                    const srcColors = layer.buffer.colors;
                    const dstChars = mainBuffer.chars;
                    const dstColors = mainBuffer.colors;
                    
                    for (let y = 0; y < height; y++) {
                        const srcRow = srcChars[y];
                        const srcColorRow = srcColors[y];
                        const dstRow = dstChars[y];
                        const dstColorRow = dstColors[y];
                        
                        for (let x = 0; x < width; x++) {
                            const char = srcRow[x];
                            if (char !== ' ') {
                                dstRow[x] = char;
                                dstColorRow[x] = srcColorRow[x];
                            }
                        }
                    }
                }
            }
        }
        
        // Render selection indicators for selected objects
        this._renderSelectionIndicators();
        
        // Mark full redraw needed and render
        this.renderer.markFullDirty();
        this.renderer.render();
    }
    
    // Draw selection handles around selected objects
    _renderSelectionIndicators() {
        // Always clear preview buffer first to remove old selection indicators
        const buffer = this.renderer.previewBuffer;
        buffer.clear();
        
        if (AppState.selectedObjects.length === 0) return;
        
        // Use preview buffer for selection indicators so they don't overwrite objects
        const width = buffer.width;
        const height = buffer.height;
        const selColor = '#00ff88';
        const handleColor = '#ffaa00';
        
        for (const obj of AppState.selectedObjects) {
            const bounds = obj.getBounds();
            // Expand bounds by 1 for selection border
            const x1 = bounds.x - 1;
            const y1 = bounds.y - 1;
            const x2 = bounds.x + bounds.width;
            const y2 = bounds.y + bounds.height;
            
            // Draw corners with resize handles
            const corners = [
                { x: x1, y: y1, char: '◢', handle: 'nw' },
                { x: x2, y: y1, char: '◣', handle: 'ne' },
                { x: x1, y: y2, char: '◥', handle: 'sw' },
                { x: x2, y: y2, char: '◤', handle: 'se' }
            ];
            
            for (const c of corners) {
                if (c.x >= 0 && c.x < width && c.y >= 0 && c.y < height) {
                    buffer.setChar(c.x, c.y, c.char, handleColor);
                }
            }
            
            // Draw edge resize handles (mid-points)
            const midX = Math.floor((x1 + x2) / 2);
            const midY = Math.floor((y1 + y2) / 2);
            
            // Top and bottom edge handles
            if (midX >= 0 && midX < width) {
                if (y1 >= 0 && y1 < height) buffer.setChar(midX, y1, '◆', handleColor);
                if (y2 >= 0 && y2 < height) buffer.setChar(midX, y2, '◆', handleColor);
            }
            
            // Left and right edge handles
            if (midY >= 0 && midY < height) {
                if (x1 >= 0 && x1 < width) buffer.setChar(x1, midY, '◆', handleColor);
                if (x2 >= 0 && x2 < width) buffer.setChar(x2, midY, '◆', handleColor);
            }
            
            // Draw dashed edges if object is large enough
            if (bounds.width > 3) {
                for (let x = x1 + 2; x < x2 - 1; x++) {
                    if (x >= 0 && x < width && x !== midX) {
                        if (y1 >= 0 && y1 < height && (x % 2 === 0)) {
                            buffer.setChar(x, y1, '─', selColor);
                        }
                        if (y2 >= 0 && y2 < height && (x % 2 === 0)) {
                            buffer.setChar(x, y2, '─', selColor);
                        }
                    }
                }
            }
            if (bounds.height > 3) {
                for (let y = y1 + 2; y < y2 - 1; y++) {
                    if (y >= 0 && y < height && y !== midY) {
                        if (x1 >= 0 && x1 < width && (y % 2 === 0)) {
                            buffer.setChar(x1, y, '│', selColor);
                        }
                        if (x2 >= 0 && x2 < width && (y % 2 === 0)) {
                            buffer.setChar(x2, y, '│', selColor);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Get resize handle at position for selected objects
     * Returns: { obj, handle: 'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w' } or null
     */
    _getResizeHandleAt(x, y) {
        if (AppState.selectedObjects.length !== 1) return null;
        
        const obj = AppState.selectedObjects[0];
        const bounds = obj.getBounds();
        const x1 = bounds.x - 1;
        const y1 = bounds.y - 1;
        const x2 = bounds.x + bounds.width;
        const y2 = bounds.y + bounds.height;
        const midX = Math.floor((x1 + x2) / 2);
        const midY = Math.floor((y1 + y2) / 2);
        
        // Check corner handles (1 char tolerance)
        if (Math.abs(x - x1) <= 1 && Math.abs(y - y1) <= 1) return { obj, handle: 'nw' };
        if (Math.abs(x - x2) <= 1 && Math.abs(y - y1) <= 1) return { obj, handle: 'ne' };
        if (Math.abs(x - x1) <= 1 && Math.abs(y - y2) <= 1) return { obj, handle: 'sw' };
        if (Math.abs(x - x2) <= 1 && Math.abs(y - y2) <= 1) return { obj, handle: 'se' };
        
        // Check edge handles
        if (Math.abs(x - midX) <= 1 && Math.abs(y - y1) <= 1) return { obj, handle: 'n' };
        if (Math.abs(x - midX) <= 1 && Math.abs(y - y2) <= 1) return { obj, handle: 's' };
        if (Math.abs(x - x1) <= 1 && Math.abs(y - midY) <= 1) return { obj, handle: 'w' };
        if (Math.abs(x - x2) <= 1 && Math.abs(y - midY) <= 1) return { obj, handle: 'e' };
        
        return null;
    }
    
    _getActiveLayerBuffer() {
        const activeLayer = AppState.layers.find(l => l.id === AppState.activeLayerId);
        return activeLayer ? activeLayer.buffer : this.renderer.buffer;
    }
    
    _getActiveLayer() {
        return AppState.layers.find(l => l.id === AppState.activeLayerId);
    }
    
    _updateStatus(msg) {
        const statusText = document.querySelector('#status-message');
        if (statusText) statusText.textContent = msg;
    }
    
    _updateLayerList() {
        const layerList = $('#layer-list');
        if (!layerList) return;
        
        // Preserve expanded state
        if (!this._layerExpandedState) this._layerExpandedState = {};
        
        layerList.innerHTML = '';
        
        // Render layers in reverse order (top layer first)
        [...AppState.layers].reverse().forEach(layer => {
            const layerContainer = document.createElement('div');
            layerContainer.className = 'layer-tree-node';
            
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item${layer.id === AppState.activeLayerId ? ' active' : ''}`;
            layerItem.dataset.layer = layer.id;
            
            const hasObjects = layer.objects && layer.objects.length > 0;
            const isExpanded = this._layerExpandedState[layer.id] !== false; // Default to expanded
            const expandIcon = hasObjects ? (isExpanded ? '▼' : '▶') : '  ';
            const visibilityIcon = layer.visible ? '👁' : '👁‍🗨';
            const lockIcon = layer.locked ? '🔒' : '🔓';
            const objectCount = layer.objects ? layer.objects.length : 0;
            
            layerItem.innerHTML = `
                <button class="layer-expand" title="Expand/Collapse">${expandIcon}</button>
                <button class="layer-visibility" title="Toggle Visibility">${visibilityIcon}</button>
                <button class="layer-lock" title="Toggle Lock">${lockIcon}</button>
                <span class="layer-name">${layer.name}</span>
                <span class="layer-count">(${objectCount})</span>
            `;
            
            // Expand/collapse toggle
            const expandBtn = layerItem.querySelector('.layer-expand');
            if (hasObjects) {
                expandBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._layerExpandedState[layer.id] = !isExpanded;
                    this._updateLayerList();
                });
            }
            
            // Double-click to rename layer
            const layerNameSpan = layerItem.querySelector('.layer-name');
            layerNameSpan.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this._startLayerRename(layer, layerNameSpan);
            });
            
            // Click to select layer
            layerItem.addEventListener('click', (e) => {
                if (!e.target.closest('.layer-expand') && !e.target.closest('.layer-visibility') && !e.target.closest('.layer-lock') && !e.target.closest('.layer-name-input')) {
                    AppState.activeLayerId = layer.id;
                    this._updateLayerList();
                    this._updateStatus(`Active: ${layer.name}`);
                }
            });
            
            // Visibility toggle
            const visBtn = layerItem.querySelector('.layer-visibility');
            visBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                layer.visible = !layer.visible;
                visBtn.textContent = layer.visible ? '👁' : '👁‍🗨';
                this._spatialIndexDirty = true;
                this.renderAllObjects();
                this._updateStatus(layer.visible ? `${layer.name} visible` : `${layer.name} hidden`);
            });
            
            // Lock toggle
            const lockBtn = layerItem.querySelector('.layer-lock');
            lockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                layer.locked = !layer.locked;
                lockBtn.textContent = layer.locked ? '🔒' : '🔓';
                this._spatialIndexDirty = true;
                this._updateStatus(layer.locked ? `${layer.name} locked` : `${layer.name} unlocked`);
            });
            
            layerContainer.appendChild(layerItem);
            
            // Add object children if expanded
            if (hasObjects && isExpanded) {
                const objectList = document.createElement('div');
                objectList.className = 'layer-objects';
                
                layer.objects.forEach(obj => {
                    this._createObjectTreeNode(obj, objectList, 1);
                });
                
                layerContainer.appendChild(objectList);
            }
            
            layerList.appendChild(layerContainer);
        });
    }
    
    _createObjectTreeNode(obj, parent, depth) {
        const objItem = document.createElement('div');
        objItem.className = `object-tree-item${AppState.selectedObjects.includes(obj) ? ' selected' : ''}`;
        objItem.style.paddingLeft = `${depth * 16}px`;
        objItem.dataset.objectId = obj.id;
        
        const hasChildren = obj.children && obj.children.length > 0;
        const isExpanded = this._layerExpandedState[`obj_${obj.id}`] !== false;
        const expandIcon = hasChildren ? (isExpanded ? '▼' : '▶') : '  ';
        
        // Get object icon based on type
        const typeIcon = this._getObjectTypeIcon(obj.type);
        const objName = obj.name || obj.text || `${obj.type} ${obj.id}`;
        
        objItem.innerHTML = `
            <span class="object-expand">${expandIcon}</span>
            <span class="object-icon">${typeIcon}</span>
            <span class="object-name" title="${objName}">${objName}</span>
        `;
        
        // Expand/collapse for groups
        if (hasChildren) {
            const expandSpan = objItem.querySelector('.object-expand');
            expandSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this._layerExpandedState[`obj_${obj.id}`] = !isExpanded;
                this._updateLayerList();
            });
        }
        
        // Click to select object
        objItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                // Multi-select
                const idx = AppState.selectedObjects.indexOf(obj);
                if (idx >= 0) {
                    AppState.selectedObjects.splice(idx, 1);
                } else {
                    AppState.selectedObjects.push(obj);
                }
            } else {
                AppState.selectedObjects = [obj];
            }
            this._updateLayerList();
            this.renderAllObjects();
            this._updateStatus(`Selected: ${objName}`);
            
            // Update properties panel - use toolManager's active tool
            const activeTool = this.toolManager?.activeTool;
            if (activeTool && activeTool._updatePropertiesPanel) {
                activeTool._updatePropertiesPanel(obj);
            }
        });
        
        // Double-click to rename object
        const nameSpan = objItem.querySelector('.object-name');
        nameSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this._startObjectRename(obj, nameSpan);
        });
        
        parent.appendChild(objItem);
        
        // Add children if expanded
        if (hasChildren && isExpanded) {
            obj.children.forEach(child => {
                this._createObjectTreeNode(child, parent, depth + 1);
            });
        }
    }
    
    _getObjectTypeIcon(type) {
        const icons = {
            'rectangle': '▭',
            'ellipse': '◯',
            'line': '╱',
            'text': 'T',
            'ascii-text': '𝔸',
            'flowchart': '⬡',
            'flowchart-process': '▭',
            'flowchart-decision': '◇',
            'flowchart-terminal': '⬭',
            'flowchart-io': '▱',
            'flowchart-connector': '○',
            'connector': '→',
            'group': '▦',
            'chart': '📊',
            'table': '▤',
            'tree': '🌳',
            'freehand': '✎',
            // Flowchart shape type aliases
            'process': '▭',
            'decision': '◇',
            'terminal': '⬭',
            'io': '▱',
            'document': '📄',
            'database': '🛢',
            'subprocess': '⬚',
            'path': '✎',
            'polygon': '⬡',
            'star': '★'
        };
        return icons[type] || '•';
    }
    
    _startObjectRename(obj, nameSpan) {
        const currentName = obj.name || obj.text || `${obj.type} ${obj.id}`;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'object-name-input';
        input.value = currentName;
        
        nameSpan.style.display = 'none';
        nameSpan.parentNode.insertBefore(input, nameSpan.nextSibling);
        input.focus();
        input.select();
        
        const finishRename = () => {
            const newName = input.value.trim() || currentName;
            obj.name = newName;
            input.remove();
            nameSpan.style.display = '';
            nameSpan.textContent = newName;
            nameSpan.title = newName;
            this._updateStatus(`Renamed to ${newName}`);
        };
        
        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRename();
            } else if (e.key === 'Escape') {
                input.value = currentName;
                finishRename();
            }
        });
    }
    
    _startLayerRename(layer, nameSpan) {
        const currentName = layer.name;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'layer-name-input';
        input.value = currentName;
        
        // Replace span with input
        nameSpan.style.display = 'none';
        nameSpan.parentNode.insertBefore(input, nameSpan.nextSibling);
        input.focus();
        input.select();
        
        const finishRename = () => {
            const newName = input.value.trim() || currentName;
            layer.name = newName;
            input.remove();
            nameSpan.style.display = '';
            nameSpan.textContent = newName;
            this._updateStatus(`Renamed to ${newName}`);
        };
        
        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                input.value = currentName;
                input.blur();
            }
        });
    }
    
    // ==========================================
    // COMPONENTS PANEL
    // ==========================================
    
    _setupComponentsPanel() {
        const self = this;
        
        // Initialize component library manager
        componentLibraryManager.init();
        
        // Render initial library list
        this._renderComponentLibraries();
        
        // Setup search
        const searchInput = $('#component-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                const query = e.target.value.trim();
                if (query) {
                    this._renderComponentSearchResults(query);
                } else {
                    this._renderComponentLibraries();
                }
            }, 200));
        }
        
        // Create component button
        const createBtn = $('#btn-create-component');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this._showCreateComponentDialog();
            });
        }
        
        // Import library button
        const importBtn = $('#btn-import-library');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this._importComponentLibrary();
            });
        }
        
        // Export library button
        const exportBtn = $('#btn-export-library');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this._showExportLibraryDialog();
            });
        }
        
        // New library button
        const newLibBtn = $('#btn-new-library');
        if (newLibBtn) {
            newLibBtn.addEventListener('click', () => {
                this._showCreateLibraryDialog();
            });
        }
        
        // Setup drag and drop on viewport
        this._setupComponentDragDrop();
        
        // Listen for library manager events
        componentLibraryManager.on('libraryAdded', () => this._renderComponentLibraries());
        componentLibraryManager.on('libraryRemoved', () => this._renderComponentLibraries());
        componentLibraryManager.on('componentAdded', () => this._renderComponentLibraries());
        componentLibraryManager.on('librariesImported', () => this._renderComponentLibraries());
    }
    
    _renderComponentLibraries() {
        const container = $('#component-libraries');
        if (!container) return;
        
        container.innerHTML = '';
        
        const libraries = componentLibraryManager.getAllLibraries();
        
        for (const library of libraries) {
            const libEl = this._createLibraryElement(library);
            container.appendChild(libEl);
        }
    }
    
    _createLibraryElement(library) {
        const libDiv = createElement('div', {
            class: `component-library${library.isExpanded ? ' expanded' : ''}`,
            'data-library-id': library.id
        });
        
        // Header
        const header = createElement('div', { class: 'component-library-header' });
        header.innerHTML = `
            <span class="component-library-expand">▶</span>
            <span class="component-library-icon">${library.icon}</span>
            <span class="component-library-name">${library.name}</span>
            <span class="component-library-count">${library.components.size}</span>
            <div class="component-library-actions">
                ${!library.isBuiltIn ? `
                    <button class="icon-btn small" title="Export Library">📤</button>
                    <button class="icon-btn small" title="Delete Library">🗑</button>
                ` : ''}
            </div>
        `;
        
        // Toggle expand
        header.addEventListener('click', (e) => {
            if (e.target.closest('.component-library-actions')) return;
            library.isExpanded = !library.isExpanded;
            libDiv.classList.toggle('expanded');
        });
        
        // Export button
        const exportBtn = header.querySelector('[title="Export Library"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._exportLibrary(library);
            });
        }
        
        // Delete button
        const deleteBtn = header.querySelector('[title="Delete Library"]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete library "${library.name}"?`)) {
                    componentLibraryManager.removeLibrary(library.id);
                }
            });
        }
        
        libDiv.appendChild(header);
        
        // Content
        const content = createElement('div', { class: 'component-library-content' });
        
        // Group components by category
        const categories = library.getCategories();
        for (const category of categories) {
            const components = library.getComponentsByCategory(category);
            if (components.length === 0) continue;
            
            const categoryDiv = createElement('div', { class: 'component-category' });
            categoryDiv.innerHTML = `<div class="component-category-header">${category}</div>`;
            
            const grid = createElement('div', { class: 'component-grid' });
            
            for (const component of components) {
                const compEl = this._createComponentElement(component, library);
                grid.appendChild(compEl);
            }
            
            categoryDiv.appendChild(grid);
            content.appendChild(categoryDiv);
        }
        
        libDiv.appendChild(content);
        
        return libDiv;
    }
    
    _createComponentElement(component, library) {
        const compDiv = createElement('div', {
            class: 'component-item',
            'data-component-id': component.id,
            'data-library-id': library.id,
            draggable: 'true',
            title: component.description || component.name
        });
        
        // Use preview if available, otherwise icon
        if (component.preview) {
            compDiv.innerHTML = `
                <div class="component-preview">${this._escapeHtml(component.preview)}</div>
                <span class="component-name">${component.name}</span>
            `;
        } else {
            compDiv.innerHTML = `
                <span class="component-icon">${component.icon}</span>
                <span class="component-name">${component.name}</span>
            `;
        }
        
        // Drag start (mouse)
        compDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/x-asciistrator-component', JSON.stringify({
                componentId: component.id,
                libraryId: library.id
            }));
            e.dataTransfer.effectAllowed = 'copy';
            compDiv.classList.add('dragging');
            
            // Auto-hide panel on mobile when drag starts
            if (window.innerWidth <= 768) {
                const panelRight = document.getElementById('panel-right');
                const panelToggle = document.getElementById('mobile-panel-toggle');
                if (panelRight?.classList.contains('open')) {
                    panelRight.classList.remove('open');
                    panelToggle?.classList.remove('active');
                }
            }
            
            // Create custom drag image
            const ghost = createElement('div', { class: 'component-drag-ghost' });
            ghost.textContent = component.preview || component.name;
            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, 0, 0);
            
            // Clean up ghost after drag
            setTimeout(() => ghost.remove(), 0);
        });
        
        compDiv.addEventListener('dragend', () => {
            compDiv.classList.remove('dragging');
        });
        
        // Touch drag support for mobile
        let touchDragGhost = null;
        let touchStartTime = 0;
        const TOUCH_HOLD_THRESHOLD = 150; // ms to distinguish tap from drag
        
        compDiv.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
        }, { passive: true });
        
        compDiv.addEventListener('touchmove', (e) => {
            // Only start drag if held for a moment (not a tap)
            if (Date.now() - touchStartTime < TOUCH_HOLD_THRESHOLD) return;
            
            e.preventDefault();
            const touch = e.touches[0];
            
            // Create ghost if not exists
            if (!touchDragGhost) {
                touchDragGhost = createElement('div', { class: 'component-drag-ghost touch-drag' });
                touchDragGhost.textContent = component.preview || component.name;
                document.body.appendChild(touchDragGhost);
                compDiv.classList.add('dragging');
                
                // Store component data for drop
                touchDragGhost.dataset.componentId = component.id;
                touchDragGhost.dataset.libraryId = library.id;
                
                // Auto-hide panel on mobile when drag starts
                if (window.innerWidth <= 768) {
                    const panelRight = document.getElementById('panel-right');
                    const panelToggle = document.getElementById('mobile-panel-toggle');
                    if (panelRight?.classList.contains('open')) {
                        panelRight.classList.remove('open');
                        panelToggle?.classList.remove('active');
                    }
                }
            }
            
            // Update ghost position
            touchDragGhost.style.left = `${touch.clientX - 20}px`;
            touchDragGhost.style.top = `${touch.clientY - 20}px`;
        });
        
        compDiv.addEventListener('touchend', (e) => {
            if (touchDragGhost) {
                const touch = e.changedTouches[0];
                
                // Check if dropped on viewport
                const viewport = document.getElementById('viewport');
                if (viewport) {
                    const rect = viewport.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        // Convert to canvas coordinates and insert
                        const pos = this.renderer.pointerToCanvas({
                            clientX: touch.clientX,
                            clientY: touch.clientY
                        });
                        this._insertComponent(component, pos.x, pos.y);
                    }
                }
                
                // Cleanup
                touchDragGhost.remove();
                touchDragGhost = null;
                compDiv.classList.remove('dragging');
            } else if (Date.now() - touchStartTime < TOUCH_HOLD_THRESHOLD) {
                // Short tap - treat as tap (could show preview or insert at center)
            }
        });
        
        compDiv.addEventListener('touchcancel', () => {
            if (touchDragGhost) {
                touchDragGhost.remove();
                touchDragGhost = null;
                compDiv.classList.remove('dragging');
            }
        });
        
        // Double-click/tap to insert at center
        compDiv.addEventListener('dblclick', () => {
            this._insertComponentAtCenter(component);
        });
        
        return compDiv;
    }
    
    _setupComponentDragDrop() {
        const viewport = $('#viewport');
        if (!viewport) return;
        
        viewport.addEventListener('dragover', (e) => {
            if (e.dataTransfer.types.includes('application/x-asciistrator-component')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            }
        });
        
        viewport.addEventListener('drop', (e) => {
            const data = e.dataTransfer.getData('application/x-asciistrator-component');
            if (!data) return;
            
            e.preventDefault();
            
            try {
                const { componentId, libraryId } = JSON.parse(data);
                const library = componentLibraryManager.getLibrary(libraryId);
                if (!library) return;
                
                const component = library.getComponent(componentId);
                if (!component) return;
                
                // Convert drop position to canvas coordinates
                const pos = this.renderer.pointerToCanvas(e);
                
                // Insert component at drop position
                this._insertComponent(component, pos.x, pos.y);
                
            } catch (error) {
                console.error('Failed to drop component:', error);
            }
        });
    }
    
    _insertComponent(component, x, y) {
        this.saveStateForUndo();
        
        // Instantiate component objects at position
        const objectDefs = component.instantiate(x, y);
        
        for (const objDef of objectDefs) {
            const obj = this._createObjectFromDefinition(objDef);
            if (obj) {
                this.addObject(obj);
            }
        }
        
        this._updateStatus(`Inserted: ${component.name}`);
    }
    
    _insertComponentAtCenter(component) {
        // Calculate center of visible viewport
        const viewportWidth = AppState.canvasWidth;
        const viewportHeight = AppState.canvasHeight;
        
        const x = Math.floor(viewportWidth / 2 - component.width / 2);
        const y = Math.floor(viewportHeight / 2 - component.height / 2);
        
        this._insertComponent(component, x, y);
    }
    
    _createObjectFromDefinition(def) {
        // Create scene object from definition
        switch (def.type) {
            case 'rectangle':
                const rect = new RectangleObject(def.x, def.y, def.width, def.height);
                rect.lineStyle = def.borderStyle || def.lineStyle || 'single';
                rect.fillChar = def.fillChar;
                if (def.name) rect.name = def.name;
                return rect;
                
            case 'ellipse':
                const ellipse = new EllipseObject(def.x, def.y, def.radiusX, def.radiusY);
                if (def.name) ellipse.name = def.name;
                return ellipse;
                
            case 'line':
                const line = new LineObject(def.x1, def.y1, def.x2, def.y2);
                line.lineStyle = def.lineStyle || 'single';
                if (def.name) line.name = def.name;
                return line;
                
            case 'text':
                const text = new TextObject(def.x, def.y, def.text);
                if (def.name) text.name = def.name;
                return text;
                
            case 'ascii-text':
                const asciiText = new AsciiTextObject(def.x, def.y, def.text);
                if (def.name) asciiText.name = def.name;
                return asciiText;
                
            case 'polygon':
                const polygon = new PolygonObject(def.cx, def.cy, def.radius, def.sides);
                if (def.name) polygon.name = def.name;
                return polygon;
                
            case 'star':
                const star = new StarObject(def.cx, def.cy, def.outerRadius, def.points);
                if (def.name) star.name = def.name;
                return star;
                
            case 'table':
                const table = new TableObject(def.x, def.y, def.width, def.height, def.cols, def.rows);
                if (def.name) table.name = def.name;
                return table;
                
            case 'chart':
                const chart = new ChartObject(def.x, def.y, def.width, def.height);
                chart.chartType = def.chartType || 'bar';
                if (def.data) chart.data = def.data;
                if (def.name) chart.name = def.name;
                return chart;
                
            // Flowchart shapes
            case 'terminal-shape':
                const terminal = new TerminalShape(def.x, def.y, def.width, def.height);
                terminal.label = def.label || '';
                if (def.name) terminal.name = def.name;
                return terminal;
                
            case 'process-shape':
                const process = new ProcessShape(def.x, def.y, def.width, def.height);
                process.label = def.label || '';
                if (def.name) process.name = def.name;
                return process;
                
            case 'decision-shape':
                const decision = new DecisionShape(def.x, def.y, def.width, def.height);
                decision.label = def.label || '';
                if (def.name) decision.name = def.name;
                return decision;
                
            case 'io-shape':
                const io = new IOShape(def.x, def.y, def.width, def.height);
                io.label = def.label || '';
                if (def.name) io.name = def.name;
                return io;
                
            case 'document-shape':
                const doc = new DocumentShape(def.x, def.y, def.width, def.height);
                doc.label = def.label || '';
                if (def.name) doc.name = def.name;
                return doc;
                
            case 'database-shape':
                const db = new DatabaseShape(def.x, def.y, def.width, def.height);
                db.label = def.label || '';
                if (def.name) db.name = def.name;
                return db;
                
            case 'subprocess-shape':
                const subprocess = new SubprocessShape(def.x, def.y, def.width, def.height);
                subprocess.label = def.label || '';
                if (def.name) subprocess.name = def.name;
                return subprocess;
                
            case 'connector-circle':
                const connector = new ConnectorCircleShape(def.x, def.y);
                connector.label = def.label || '';
                if (def.name) connector.name = def.name;
                return connector;
                
            default:
                // Try to create a text object for unknown types
                if (def.text) {
                    return new TextObject(def.x || 0, def.y || 0, def.text);
                }
                console.warn('Unknown object type:', def.type);
                return null;
        }
    }
    
    _renderComponentSearchResults(query) {
        const container = $('#component-libraries');
        if (!container) return;
        
        const results = componentLibraryManager.searchComponents(query);
        
        container.innerHTML = '';
        
        if (results.length === 0) {
            container.innerHTML = '<div class="no-results">No components found</div>';
            return;
        }
        
        const resultsDiv = createElement('div', { class: 'component-search-results' });
        resultsDiv.innerHTML = `<div class="component-category-header">Search Results (${results.length})</div>`;
        
        const grid = createElement('div', { class: 'component-grid' });
        
        for (const { component, library } of results) {
            const compEl = this._createComponentElement(component, library);
            grid.appendChild(compEl);
        }
        
        resultsDiv.appendChild(grid);
        container.appendChild(resultsDiv);
    }
    
    _showCreateComponentDialog() {
        if (AppState.selectedObjects.length === 0) {
            this._updateStatus('Select objects to create a component');
            return;
        }
        
        const userLibraries = componentLibraryManager.getAllLibraries().filter(l => !l.isBuiltIn);
        
        // If no user libraries exist, create one first
        if (userLibraries.length === 0) {
            const newLib = componentLibraryManager.createLibrary('My Components', {
                icon: '📁',
                description: 'Custom components'
            });
            userLibraries.push(newLib);
        }
        
        const dialogHtml = `
            <div class="create-component-form">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="comp-name" placeholder="Component name" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="comp-description" placeholder="Optional description"></textarea>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" id="comp-category" placeholder="General" value="General">
                </div>
                <div class="form-group">
                    <label>Icon</label>
                    <input type="text" id="comp-icon" placeholder="📦" value="📦" maxlength="2">
                </div>
                <div class="form-group">
                    <label>Tags (comma-separated)</label>
                    <input type="text" id="comp-tags" placeholder="tag1, tag2">
                </div>
                <div class="form-group">
                    <label>Library</label>
                    <div class="library-select-wrapper">
                        <select id="comp-library">
                            ${userLibraries.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        this._showDialog('Create Component', dialogHtml, [
            {
                label: 'Cancel',
                action: () => {}
            },
            {
                label: 'Create',
                primary: true,
                action: () => {
                    const name = $('#comp-name').value.trim();
                    if (!name) {
                        this._updateStatus('Component name is required');
                        return false;
                    }
                    
                    const description = $('#comp-description').value.trim();
                    const category = $('#comp-category').value.trim() || 'General';
                    const icon = $('#comp-icon').value.trim() || '📦';
                    const tags = $('#comp-tags').value.split(',').map(t => t.trim()).filter(Boolean);
                    const libraryId = $('#comp-library').value;
                    
                    // Create component from selected objects
                    const component = componentLibraryManager.createComponentFromObjects(
                        AppState.selectedObjects,
                        { name, description, category, icon, tags }
                    );
                    
                    // Add to library
                    componentLibraryManager.addComponentToLibrary(component, libraryId);
                    
                    this._updateStatus(`Created component: ${name}`);
                    this._renderComponentLibraries();
                    
                    return true;
                }
            }
        ]);
        
        // Focus name input
        setTimeout(() => $('#comp-name')?.focus(), 100);
    }
    
    _showCreateLibraryDialog() {
        const dialogHtml = `
            <div class="create-component-form">
                <div class="form-group">
                    <label>Library Name</label>
                    <input type="text" id="lib-name" placeholder="My Library" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="lib-description" placeholder="Optional description"></textarea>
                </div>
                <div class="form-group">
                    <label>Icon</label>
                    <input type="text" id="lib-icon" placeholder="📁" value="📁" maxlength="2">
                </div>
            </div>
        `;
        
        this._showDialog('Create Library', dialogHtml, [
            {
                label: 'Cancel',
                action: () => {}
            },
            {
                label: 'Create',
                primary: true,
                action: () => {
                    const name = $('#lib-name').value.trim();
                    if (!name) {
                        this._updateStatus('Library name is required');
                        return false;
                    }
                    
                    const description = $('#lib-description').value.trim();
                    const icon = $('#lib-icon').value.trim() || '📁';
                    
                    componentLibraryManager.createLibrary(name, { description, icon });
                    
                    this._updateStatus(`Created library: ${name}`);
                    this._renderComponentLibraries();
                    
                    return true;
                }
            }
        ]);
        
        setTimeout(() => $('#lib-name')?.focus(), 100);
    }
    
    _importComponentLibrary() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const imported = componentLibraryManager.importLibraries(text);
                this._updateStatus(`Imported ${imported.length} library(s)`);
            } catch (error) {
                this._updateStatus(`Import failed: ${error.message}`);
            }
        });
        
        input.click();
    }
    
    _showExportLibraryDialog() {
        const libraries = componentLibraryManager.getAllLibraries();
        
        if (libraries.length === 0) {
            this._updateStatus('No libraries to export');
            return;
        }
        
        const libraryOptions = libraries.map(lib => 
            `<label class="checkbox-option">
                <input type="checkbox" name="export-lib" value="${lib.id}" ${!lib.isBuiltIn ? 'checked' : ''}>
                <span>${this._escapeHtml(lib.name)}${lib.isBuiltIn ? ' (built-in)' : ''}</span>
            </label>`
        ).join('');
        
        this._showDialog(
            'Export Libraries',
            `<div class="export-library-form">
                <p>Select libraries to export:</p>
                <div class="library-checkboxes">
                    ${libraryOptions}
                </div>
            </div>`,
            [
                { label: 'Cancel', action: () => true },
                {
                    label: 'Export',
                    primary: true,
                    action: (dialog) => {
                        const checkboxes = dialog.querySelectorAll('input[name="export-lib"]:checked');
                        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
                        
                        if (selectedIds.length === 0) {
                            this._updateStatus('No libraries selected');
                            return true;
                        }
                        
                        const selectedLibs = libraries.filter(lib => selectedIds.includes(lib.id));
                        const json = componentLibraryManager.exportLibraries(selectedIds);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        
                        const a = document.createElement('a');
                        a.href = url;
                        const filename = selectedLibs.length === 1 
                            ? `${selectedLibs[0].name.toLowerCase().replace(/\s+/g, '-')}-library.json`
                            : 'component-libraries.json';
                        a.download = filename;
                        a.click();
                        
                        URL.revokeObjectURL(url);
                        this._updateStatus(`Exported ${selectedLibs.length} library(s)`);
                        
                        return true;
                    }
                }
            ]
        );
    }
    
    _exportLibrary(library) {
        const json = componentLibraryManager.exportLibraries([library.id]);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${library.name.toLowerCase().replace(/\s+/g, '-')}-library.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this._updateStatus(`Exported: ${library.name}`);
    }
    
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Show a dialog with custom content and buttons
     * @param {string} title - Dialog title
     * @param {string} contentHtml - HTML content for dialog body
     * @param {Array} buttons - Array of button objects: { label, action, primary }
     */
    _showDialog(title, contentHtml, buttons = []) {
        const container = $('#dialogs');
        if (!container) return;
        
        // Create backdrop
        const backdrop = createElement('div', { class: 'dialog-backdrop' });
        
        // Create dialog
        const dialog = createElement('div', { class: 'dialog' });
        
        // Header
        const header = createElement('div', { class: 'dialog-header' });
        header.innerHTML = `
            <span class="dialog-title">${title}</span>
            <button class="dialog-close" title="Close">✕</button>
        `;
        
        // Content
        const content = createElement('div', { class: 'dialog-content' });
        content.innerHTML = contentHtml;
        
        // Footer with buttons
        const footer = createElement('div', { class: 'dialog-footer' });
        const btnGroup = createElement('div', { class: 'btn-group' });
        
        for (const btn of buttons) {
            const button = createElement('button', {
                class: `btn ${btn.primary ? 'btn-primary' : 'btn-secondary'}`
            }, btn.label);
            
            button.addEventListener('click', () => {
                const result = btn.action();
                if (result !== false) {
                    backdrop.remove();
                }
            });
            
            btnGroup.appendChild(button);
        }
        
        footer.appendChild(btnGroup);
        
        // Assemble dialog
        dialog.appendChild(header);
        dialog.appendChild(content);
        dialog.appendChild(footer);
        backdrop.appendChild(dialog);
        
        // Close handlers
        const closeBtn = header.querySelector('.dialog-close');
        closeBtn.addEventListener('click', () => backdrop.remove());
        
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) backdrop.remove();
        });
        
        // Escape key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                backdrop.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        container.appendChild(backdrop);
        
        return backdrop;
    }
    
    _drawDemoContent() {
        // Create demo SceneObjects to show the capabilities
        
        // Title text
        const title1 = new TextObject();
        title1.x = 5; title1.y = 1;
        title1.text = '╔══════════════════════════════════════════════════════════════════════╗';
        title1.name = 'Title Top';
        this.addObject(title1);
        
        
        const title2 = new TextObject();
        title2.x = 5; title2.y = 2;
        title2.text = '║                      ASCIISTRATOR - ASCII Editor                     ║';
        title2.name = 'Title Middle';
        this.addObject(title2);
        
        const title3 = new TextObject();
        title3.x = 5; title3.y = 3;
        title3.text = '╚══════════════════════════════════════════════════════════════════════╝';
        title3.name = 'Title Bottom';
        this.addObject(title3);
        
        // Demo rectangle (single)
        const rect1 = new RectangleObject();
        rect1.x = 10; rect1.y = 6;
        rect1.width = 20; rect1.height = 8;
        rect1.lineStyle = 'single';
        rect1.name = 'Demo Rectangle';
        this.addObject(rect1);
        
        const rectLabel = new TextObject();
        rectLabel.x = 14; rectLabel.y = 9;
        rectLabel.text = 'Rectangle';
        rectLabel.name = 'Rectangle Label';
        this.addObject(rectLabel);
        
        // Demo rectangle (double)
        const rect2 = new RectangleObject();
        rect2.x = 35; rect2.y = 6;
        rect2.width = 20; rect2.height = 8;
        rect2.lineStyle = 'double';
        rect2.name = 'Demo Double Box';
        this.addObject(rect2);
        
        const doubleLabel = new TextObject();
        doubleLabel.x = 39; doubleLabel.y = 9;
        doubleLabel.text = 'Double Box';
        doubleLabel.name = 'Double Box Label';
        this.addObject(doubleLabel);
        
        // Demo ellipse
        const ellipse = new EllipseObject();
        ellipse.x = 70; ellipse.y = 5;
        ellipse.width = 10; ellipse.height = 10;
        ellipse.radiusX = 5; ellipse.radiusY = 5;
        ellipse.strokeChar = '*';
        ellipse.name = 'Demo Circle';
        this.addObject(ellipse);
        
        const circleLabel = new TextObject();
        circleLabel.x = 70; circleLabel.y = 15;
        circleLabel.text = 'Circle';
        circleLabel.name = 'Circle Label';
        this.addObject(circleLabel);
        
        // Line style header
        const lineHeader = new TextObject();
        lineHeader.x = 10; lineHeader.y = 18;
        lineHeader.text = 'Line Styles:';
        lineHeader.name = 'Line Styles Header';
        this.addObject(lineHeader);
        
        // Demo lines
        const line1 = new LineObject();
        line1.x1 = 10; line1.y1 = 20; line1.x2 = 30; line1.y2 = 20;
        line1.lineStyle = 'single';
        line1.name = 'Single Line';
        line1.x = 10; line1.y = 20; line1.width = 21; line1.height = 1;
        this.addObject(line1);
        
        const line2 = new LineObject();
        line2.x1 = 10; line2.y1 = 22; line2.x2 = 30; line2.y2 = 22;
        line2.lineStyle = 'double';
        line2.name = 'Double Line';
        line2.x = 10; line2.y = 22; line2.width = 21; line2.height = 1;
        this.addObject(line2);
        
        const line3 = new LineObject();
        line3.x1 = 10; line3.y1 = 24; line3.x2 = 30; line3.y2 = 24;
        line3.lineStyle = 'dashed';
        line3.name = 'Dashed Line';
        line3.x = 10; line3.y = 24; line3.width = 21; line3.height = 1;
        this.addObject(line3);
        
        const line4 = new LineObject();
        line4.x1 = 10; line4.y1 = 26; line4.x2 = 30; line4.y2 = 26;
        line4.lineStyle = 'ascii';
        line4.name = 'ASCII Line';
        line4.x = 10; line4.y = 26; line4.width = 21; line4.height = 1;
        this.addObject(line4);
        
        // Line labels
        const lbl1 = new TextObject();
        lbl1.x = 32; lbl1.y = 20; lbl1.text = '─ single'; this.addObject(lbl1);
        
        const lbl2 = new TextObject();
        lbl2.x = 32; lbl2.y = 22; lbl2.text = '═ double'; this.addObject(lbl2);
        
        const lbl3 = new TextObject();
        lbl3.x = 32; lbl3.y = 24; lbl3.text = '┄ dashed'; this.addObject(lbl3);
        
        const lbl4 = new TextObject();
        lbl4.x = 32; lbl4.y = 26; lbl4.text = '- ascii'; this.addObject(lbl4);
        
        // Density palette header
        const densityHeader = new TextObject();
        densityHeader.x = 50; densityHeader.y = 18;
        densityHeader.text = 'Density Palette:';
        densityHeader.name = 'Density Header';
        this.addObject(densityHeader);
        
        const densityChars = DensityPalettes.blocks;
        const densityText = new TextObject();
        densityText.x = 50; densityText.y = 20;
        densityText.text = densityChars.join('');
        densityText.name = 'Density Palette';
        this.addObject(densityText);
        
        // Instructions
        const instr1 = new TextObject();
        instr1.x = 10; instr1.y = 30;
        instr1.text = 'Use keyboard shortcuts: [V]select [P]pencil [L]ine [R]ect [E]llipse [T]ext [G]fill [X]erase';
        instr1.name = 'Instructions 1';
        this.addObject(instr1);
        
        const instr2 = new TextObject();
        instr2.x = 10; instr2.y = 32;
        instr2.text = 'Click and drag to draw. Press Ctrl+Z to undo, Ctrl+S to save.';
        instr2.name = 'Instructions 2';
        this.addObject(instr2);
    }
    
    // Document operations
    newDocument() {
        if (AppState.modified) {
            // Would show confirmation dialog
        }
        // Clear selection first
        AppState.selectedObjects = [];
        // Clear all objects from all layers
        for (const layer of AppState.layers) {
            layer.objects = [];
            if (layer.buffer) layer.buffer.clear();
        }
        this.renderer.clear();
        // Use renderAllObjects to properly clear selection indicators
        this.renderAllObjects();
        this._updateLayerList();
        AppState.modified = false;
        AppState.filename = 'untitled.asc';
        this._updateStatus('New document created');
    }
    
    open() {
        // File open dialog
        const input = createElement('input', {
            type: 'file',
            accept: '.asc,.txt',
            style: { display: 'none' }
        });
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const text = await file.text();
                this._loadFromText(text);
                AppState.filename = file.name;
            }
        });
        
        input.click();
    }
    
    _loadFromText(text) {
        this.renderer.clear();
        const lines = text.split('\n');
        for (let y = 0; y < lines.length && y < AppState.canvasHeight; y++) {
            for (let x = 0; x < lines[y].length && x < AppState.canvasWidth; x++) {
                this.renderer.buffer.setChar(x, y, lines[y][x]);
            }
        }
        this.renderer.render();
    }
    
    save() {
        const text = this.renderer.exportText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = createElement('a', {
            href: url,
            download: AppState.filename
        });
        a.click();
        
        URL.revokeObjectURL(url);
        AppState.modified = false;
    }
    
    export(format = 'txt') {
        let content, mimeType, extension;
        
        switch (format) {
            case 'html':
                content = `<!DOCTYPE html>
<html>
<head>
<style>
pre { font-family: monospace; line-height: 1; background: #1a1a2e; color: #eee; padding: 20px; }
</style>
</head>
<body>
<pre>${this.renderer.exportHTML()}</pre>
</body>
</html>`;
                mimeType = 'text/html';
                extension = 'html';
                break;
            default:
                content = this.renderer.exportText();
                mimeType = 'text/plain';
                extension = 'txt';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = createElement('a', {
            href: url,
            download: AppState.filename.replace(/\.[^.]+$/, `.${extension}`)
        });
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    undo() {
        if (AppState.undoStack.length === 0) {
            this._updateStatus('Nothing to undo');
            return;
        }
        
        // Save current state to redo stack
        const currentState = this._captureState();
        AppState.redoStack.push(currentState);
        
        // Restore previous state
        const previousState = AppState.undoStack.pop();
        this._restoreState(previousState);
        
        this._updateStatus('Undo');
        this._updateUndoRedoButtons();
    }
    
    redo() {
        if (AppState.redoStack.length === 0) {
            this._updateStatus('Nothing to redo');
            return;
        }
        
        // Save current state to undo stack
        const currentState = this._captureState();
        AppState.undoStack.push(currentState);
        
        // Restore redo state
        const redoState = AppState.redoStack.pop();
        this._restoreState(redoState);
        
        this._updateStatus('Redo');
        this._updateUndoRedoButtons();
    }
    
    // Save current state for undo
    saveStateForUndo() {
        const state = this._captureState();
        AppState.undoStack.push(state);
        
        // Limit stack size
        if (AppState.undoStack.length > AppState.maxHistorySize) {
            AppState.undoStack.shift();
        }
        
        // Clear redo stack when new action is performed
        AppState.redoStack = [];
        
        AppState.modified = true;
        this._updateUndoRedoButtons();
    }
    
    _captureState() {
        // Capture all objects from all layers
        const layersData = AppState.layers.map(layer => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: layer.locked,
            objects: layer.objects ? layer.objects.map(obj => obj.toJSON()) : []
        }));
        
        return {
            layers: layersData,
            activeLayerId: AppState.activeLayerId,
            selectedObjectIds: AppState.selectedObjects.map(obj => obj.id)
        };
    }
    
    _restoreState(state) {
        // Restore layers and objects
        AppState.layers.forEach((layer, index) => {
            if (state.layers[index]) {
                const savedLayer = state.layers[index];
                layer.visible = savedLayer.visible;
                layer.locked = savedLayer.locked;
                layer.objects = savedLayer.objects.map(json => this._createObjectFromJSON(json)).filter(obj => obj !== null);
            }
        });
        
        AppState.activeLayerId = state.activeLayerId;
        
        // Restore selection
        AppState.selectedObjects = [];
        if (state.selectedObjectIds) {
            for (const id of state.selectedObjectIds) {
                const obj = this._findObjectById(id);
                if (obj) {
                    AppState.selectedObjects.push(obj);
                }
            }
        }
        
        this.renderAllObjects();
        this._updateLayerList();
        this._updateStatusBar();
    }
    
    _findObjectById(id) {
        for (const layer of AppState.layers) {
            if (layer.objects) {
                const obj = layer.objects.find(o => o.id === id);
                if (obj) return obj;
            }
        }
        return null;
    }
    
    _updateUndoRedoButtons() {
        const undoBtn = $('#btn-undo');
        const redoBtn = $('#btn-redo');
        
        if (undoBtn) {
            undoBtn.disabled = AppState.undoStack.length === 0;
            undoBtn.style.opacity = AppState.undoStack.length === 0 ? '0.5' : '1';
        }
        
        if (redoBtn) {
            redoBtn.disabled = AppState.redoStack.length === 0;
            redoBtn.style.opacity = AppState.redoStack.length === 0 ? '0.5' : '1';
        }
    }
    
    _updateFillColorDisplay(fillElement, color) {
        if (!fillElement) return;
        
        if (color) {
            // Show solid color
            fillElement.style.backgroundColor = color;
            fillElement.style.background = color;
        } else {
            // Show transparency checkerboard pattern
            fillElement.style.backgroundColor = 'transparent';
            fillElement.style.background = 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px';
        }
    }
    
    swapColors() {
        const tempStroke = AppState.strokeColor;
        const tempFill = AppState.fillColor;
        
        // Swap - if fill is null/transparent, stroke becomes white
        AppState.strokeColor = tempFill || '#ffffff';
        AppState.fillColor = tempStroke;
        
        // Update UI displays
        const strokeColor = $('#stroke-color');
        const fillColor = $('#fill-color');
        
        if (strokeColor) {
            strokeColor.style.backgroundColor = AppState.strokeColor;
        }
        if (fillColor) {
            this._updateFillColorDisplay(fillColor, AppState.fillColor);
        }
        
        this._updateStatus('Colors swapped');
    }
    
    clear() {
        this.renderer.clear();
        this.renderer.render();
    }
    
    setTheme(theme) {
        document.body.dataset.theme = theme;
        AppState.theme = theme;
    }
    
    toggleGrid() {
        AppState.showGrid = !AppState.showGrid;
        this.renderer.render();
        this._updateStatus(AppState.showGrid ? 'Grid enabled' : 'Grid disabled');
    }
    
    // Page size dialog
    showPageSizeDialog() {
        const currentWidth = AppState.canvasWidth;
        const currentHeight = AppState.canvasHeight;
        
        const backdrop = createElement('div', { class: 'dialog-backdrop' });
        backdrop.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <span class="dialog-title">Page Size</span>
                    <button class="dialog-close">×</button>
                </div>
                <div class="dialog-content">
                    <div class="form-group">
                        <label>Width (characters):</label>
                        <input type="number" id="page-width" value="${currentWidth}" min="20" max="500">
                    </div>
                    <div class="form-group">
                        <label>Height (characters):</label>
                        <input type="number" id="page-height" value="${currentHeight}" min="10" max="200">
                    </div>
                    <div class="form-group">
                        <label>Presets:</label>
                        <select id="page-preset">
                            <option value="">Custom</option>
                            <option value="80x24">Terminal (80×24)</option>
                            <option value="120x40">Default (120×40)</option>
                            <option value="160x50">Large (160×50)</option>
                            <option value="200x60">Extra Large (200×60)</option>
                        </select>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" id="page-cancel">Cancel</button>
                    <button class="btn btn-primary" id="page-apply">Apply</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(backdrop);
        
        const widthInput = backdrop.querySelector('#page-width');
        const heightInput = backdrop.querySelector('#page-height');
        const presetSelect = backdrop.querySelector('#page-preset');
        
        presetSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                const [w, h] = e.target.value.split('x').map(Number);
                widthInput.value = w;
                heightInput.value = h;
            }
        });
        
        backdrop.querySelector('.dialog-close').addEventListener('click', () => backdrop.remove());
        backdrop.querySelector('#page-cancel').addEventListener('click', () => backdrop.remove());
        backdrop.querySelector('#page-apply').addEventListener('click', () => {
            const newWidth = parseInt(widthInput.value) || currentWidth;
            const newHeight = parseInt(heightInput.value) || currentHeight;
            this.resizeCanvas(newWidth, newHeight);
            backdrop.remove();
        });
    }
    
    // Resize canvas
    resizeCanvas(width, height) {
        AppState.canvasWidth = Math.max(20, Math.min(500, width));
        AppState.canvasHeight = Math.max(10, Math.min(200, height));
        
        // Resize main buffer
        if (this.renderer && this.renderer.buffer) {
            this.renderer.buffer.resize(AppState.canvasWidth, AppState.canvasHeight);
            this.renderer.previewBuffer.resize(AppState.canvasWidth, AppState.canvasHeight);
        }
        
        // Resize layer buffers
        for (const layer of AppState.layers) {
            if (layer.buffer) {
                layer.buffer.resize(AppState.canvasWidth, AppState.canvasHeight);
            }
        }
        
        // Update spatial index
        this._spatialIndexDirty = true;
        
        // Re-render
        this.renderAllObjects();
        this._updateStatusBar();
        this._updateStatus(`Canvas resized to ${AppState.canvasWidth}×${AppState.canvasHeight}`);
    }
    
    // Grid spacing dialog
    showGridSpacingDialog() {
        const currentSpacing = AppState.gridSize || 1;
        
        const backdrop = createElement('div', { class: 'dialog-backdrop' });
        backdrop.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <span class="dialog-title">Grid Spacing</span>
                    <button class="dialog-close">×</button>
                </div>
                <div class="dialog-content">
                    <div class="form-group">
                        <label>Grid spacing:</label>
                        <input type="number" id="grid-spacing" value="${currentSpacing}" min="1" max="20">
                    </div>
                    <div class="form-group">
                        <label>Presets:</label>
                        <div class="btn-group">
                            <button class="btn btn-small" data-spacing="1">1</button>
                            <button class="btn btn-small" data-spacing="2">2</button>
                            <button class="btn btn-small" data-spacing="4">4</button>
                            <button class="btn btn-small" data-spacing="5">5</button>
                            <button class="btn btn-small" data-spacing="8">8</button>
                            <button class="btn btn-small" data-spacing="10">10</button>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" id="grid-cancel">Cancel</button>
                    <button class="btn btn-primary" id="grid-apply">Apply</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(backdrop);
        
        const spacingInput = backdrop.querySelector('#grid-spacing');
        
        backdrop.querySelectorAll('[data-spacing]').forEach(btn => {
            btn.addEventListener('click', () => {
                spacingInput.value = btn.dataset.spacing;
            });
        });
        
        backdrop.querySelector('.dialog-close').addEventListener('click', () => backdrop.remove());
        backdrop.querySelector('#grid-cancel').addEventListener('click', () => backdrop.remove());
        backdrop.querySelector('#grid-apply').addEventListener('click', () => {
            const newSpacing = parseInt(spacingInput.value) || 1;
            AppState.gridSize = Math.max(1, Math.min(20, newSpacing));
            this.renderer.render();
            this._updateStatusBar();
            this._updateStatus(`Grid spacing set to ${AppState.gridSize}`);
            backdrop.remove();
        });
    }
    
    // Copy as text to clipboard
    copyAsText() {
        const text = this.renderer.exportText();
        navigator.clipboard.writeText(text).then(() => {
            this._updateStatus('Copied canvas as plain text');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this._updateStatus('Failed to copy to clipboard');
        });
    }
    
    // Copy as HTML to clipboard
    copyAsHtml() {
        const htmlContent = this.renderer.exportHTML();
        const html = `<pre style="font-family: monospace; line-height: 1; background: #1a1a2e; color: #eee; padding: 10px; white-space: pre;">${htmlContent}</pre>`;
        const plainText = this.renderer.exportText();
        
        // Try using ClipboardItem API (modern browsers)
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
            const htmlBlob = new Blob([html], { type: 'text/html' });
            const textBlob = new Blob([plainText], { type: 'text/plain' });
            
            navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                })
            ]).then(() => {
                this._updateStatus('Copied canvas as HTML');
            }).catch(err => {
                console.error('Clipboard API failed:', err);
                this._copyHtmlFallback(html, plainText);
            });
        } else {
            this._copyHtmlFallback(html, plainText);
        }
    }
    
    _copyHtmlFallback(html, plainText) {
        // Fallback: Copy using a textarea with the HTML source
        const textarea = document.createElement('textarea');
        textarea.value = html;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            this._updateStatus('Copied canvas as HTML (source code)');
        } catch (err) {
            console.error('Copy failed:', err);
            this._updateStatus('Failed to copy to clipboard');
        }
        
        document.body.removeChild(textarea);
    }
    
    // Auto-layout flowchart objects
    autoLayoutFlowchart() {
        // Find all flowchart shapes and connectors
        const shapes = [];
        const connectors = [];
        
        for (const layer of AppState.layers) {
            if (!layer.visible || !layer.objects) continue;
            for (const obj of layer.objects) {
                if (obj instanceof FlowchartShape) {
                    shapes.push(obj);
                } else if (obj instanceof FlowchartConnector) {
                    connectors.push(obj);
                }
            }
        }
        
        if (shapes.length === 0) {
            this._updateStatus('No flowchart shapes to layout');
            return;
        }
        
        this.saveStateForUndo();
        
        // Simple grid-based auto layout
        const startX = 10;
        const startY = 5;
        const horizontalSpacing = 25;
        const verticalSpacing = 10;
        const maxCols = 4;
        
        // Build dependency graph from connectors
        const incoming = new Map(); // shape -> list of shapes pointing to it
        const outgoing = new Map(); // shape -> list of shapes it points to
        
        shapes.forEach(s => {
            incoming.set(s, []);
            outgoing.set(s, []);
        });
        
        // Analyze connectors to build graph
        for (const conn of connectors) {
            let startShape = null, endShape = null;
            
            for (const shape of shapes) {
                const bounds = shape.getBounds();
                // Check if connector starts from this shape
                if (conn.startX >= bounds.x && conn.startX <= bounds.x + bounds.width &&
                    conn.startY >= bounds.y && conn.startY <= bounds.y + bounds.height) {
                    startShape = shape;
                }
                // Check if connector ends at this shape
                if (conn.endX >= bounds.x && conn.endX <= bounds.x + bounds.width &&
                    conn.endY >= bounds.y && conn.endY <= bounds.y + bounds.height) {
                    endShape = shape;
                }
            }
            
            if (startShape && endShape && startShape !== endShape) {
                outgoing.get(startShape).push(endShape);
                incoming.get(endShape).push(startShape);
            }
        }
        
        // Find root nodes (no incoming connections)
        const roots = shapes.filter(s => incoming.get(s).length === 0);
        
        // If no clear roots, use first shape
        if (roots.length === 0 && shapes.length > 0) {
            roots.push(shapes[0]);
        }
        
        // BFS layout from roots
        const visited = new Set();
        const levels = []; // Array of arrays, each level contains shapes at that depth
        let queue = [...roots];
        
        while (queue.length > 0) {
            const currentLevel = [];
            const nextQueue = [];
            
            for (const shape of queue) {
                if (visited.has(shape)) continue;
                visited.add(shape);
                currentLevel.push(shape);
                
                // Add children to next level
                for (const child of outgoing.get(shape)) {
                    if (!visited.has(child)) {
                        nextQueue.push(child);
                    }
                }
            }
            
            if (currentLevel.length > 0) {
                levels.push(currentLevel);
            }
            queue = nextQueue;
        }
        
        // Add any unvisited shapes
        for (const shape of shapes) {
            if (!visited.has(shape)) {
                if (levels.length === 0) levels.push([]);
                levels[levels.length - 1].push(shape);
            }
        }
        
        // Position shapes by level
        levels.forEach((level, levelIdx) => {
            const levelY = startY + levelIdx * verticalSpacing;
            const levelWidth = level.length * horizontalSpacing;
            const levelStartX = startX + Math.max(0, (maxCols * horizontalSpacing - levelWidth) / 2);
            
            level.forEach((shape, idx) => {
                const newX = levelStartX + idx * horizontalSpacing;
                const newY = levelY;
                
                // Calculate movement delta
                const dx = newX - shape.x;
                const dy = newY - shape.y;
                
                shape.x = newX;
                shape.y = newY;
                
                // Update snap points
                if (shape._updateSnapPoints) {
                    shape._updateSnapPoints();
                }
            });
        });
        
        // Update connector positions based on new shape positions
        for (const conn of connectors) {
            // Find connected shapes and update connector endpoints
            for (const shape of shapes) {
                const snapPoints = shape.getSnapPoints ? shape.getSnapPoints() : [];
                for (const sp of snapPoints) {
                    const spX = shape.x + sp.relX;
                    const spY = shape.y + sp.relY;
                    
                    // If connector was attached, update to new position
                    // This is a simplified approach - just try to maintain relative positions
                }
            }
        }
        
        this._spatialIndexDirty = true;
        this.renderAllObjects();
        this._updateStatus(`Auto-layout applied to ${shapes.length} shapes`);
    }
    
    // Zoom methods - delegate to renderer
    zoomIn() {
        if (this.renderer) {
            this.renderer.zoomIn();
            this._updateStatus(`Zoom: ${Math.round(this.renderer.zoom * 100)}%`);
        }
    }
    
    zoomOut() {
        if (this.renderer) {
            this.renderer.zoomOut();
            this._updateStatus(`Zoom: ${Math.round(this.renderer.zoom * 100)}%`);
        }
    }
    
    zoomReset() {
        if (this.renderer) {
            this.renderer.zoomReset();
            this._updateStatus('Zoom reset to 100%');
        }
    }
    
    zoomFit() {
        if (this.renderer) {
            this.renderer.zoomFit();
            this._updateStatus(`Zoom: ${Math.round(this.renderer.zoom * 100)}%`);
        }
    }
    
    // Clipboard methods
    cut() {
        if (AppState.selectedObjects.length > 0) {
            this.saveStateForUndo();
            this.copy();
            for (const obj of AppState.selectedObjects) {
                this.removeObject(obj.id);
            }
            AppState.selectedObjects = [];
            this.renderAllObjects();
            this._updateStatus('Cut to clipboard');
        }
    }
    
    copy() {
        if (AppState.selectedObjects.length > 0) {
            AppState.clipboard = AppState.selectedObjects.map(obj => obj.toJSON());
            this._updateStatus(`Copied ${AppState.clipboard.length} object(s)`);
        }
    }
    
    paste() {
        if (AppState.clipboard && AppState.clipboard.length > 0) {
            this.saveStateForUndo();
            AppState.selectedObjects = [];
            for (const json of AppState.clipboard) {
                const obj = this._createObjectFromJSON(json);
                if (obj) {
                    // Offset pasted objects slightly
                    obj.x += 2;
                    obj.y += 1;
                    obj.id = uuid();
                    this.addObject(obj);
                    AppState.selectedObjects.push(obj);
                }
            }
            this.renderAllObjects();
            this._updateStatus(`Pasted ${AppState.clipboard.length} object(s)`);
        }
    }
    
    _createObjectFromJSON(json) {
        switch (json.type) {
            case 'rectangle': {
                const obj = new RectangleObject(json.x, json.y, json.width, json.height);
                Object.assign(obj, json);
                return obj;
            }
            case 'ellipse': {
                const obj = new EllipseObject(json.x, json.y, json.radiusX, json.radiusY);
                Object.assign(obj, json);
                return obj;
            }
            case 'line': {
                const obj = new LineObject(json.x1, json.y1, json.x2, json.y2);
                Object.assign(obj, json);
                return obj;
            }
            case 'text': {
                const obj = new TextObject(json.x, json.y, json.text);
                Object.assign(obj, json);
                return obj;
            }
            case 'ascii-text': {
                const obj = new AsciiTextObject(json.x, json.y, json.text);
                Object.assign(obj, json);
                return obj;
            }
            case 'path': {
                const obj = new PathObject();
                Object.assign(obj, json);
                return obj;
            }
            case 'polygon': {
                const obj = new PolygonObject(json.cx, json.cy, json.radius, json.sides);
                Object.assign(obj, json);
                return obj;
            }
            case 'star': {
                const obj = new StarObject(json.cx, json.cy, json.outerRadius, json.numPoints, json.innerRatio);
                Object.assign(obj, json);
                return obj;
            }
            case 'table': {
                const obj = new TableObject(json.x, json.y, json.width, json.height, json.cols, json.rows);
                Object.assign(obj, json);
                return obj;
            }
            case 'chart': {
                const obj = new ChartObject(json.x, json.y, json.width, json.height);
                Object.assign(obj, json);
                return obj;
            }
            case 'group': {
                const obj = new GroupObject();
                Object.assign(obj, json);
                if (json.children) {
                    obj.children = json.children.map(c => this._createObjectFromJSON(c));
                }
                return obj;
            }
            case 'flowchart-process':
            case 'process': {
                const obj = new ProcessShape(json.x, json.y, json.width, json.height);
                Object.assign(obj, json);
                return obj;
            }
            case 'flowchart-terminal':
            case 'terminal': {
                const obj = new TerminalShape(json.x, json.y, json.width, json.height);
                Object.assign(obj, json);
                return obj;
            }
            case 'flowchart-decision':
            case 'decision': {
                const obj = new DecisionShape(json.x, json.y, json.width, json.height);
                Object.assign(obj, json);
                return obj;
            }
            case 'flowchart-io':
            case 'io': {
                const obj = new IOShape(json.x, json.y, json.width, json.height);
                Object.assign(obj, json);
                return obj;
            }
            case 'flowchart-document':
            case 'document': {
                const obj = new DocumentShape(json.x, json.y, json.width, json.height);
                Object.assign(obj, json);
                return obj;
            }
            case 'flowchart-database':
            case 'database': {
                const obj = new DatabaseShape(json.x, json.y, json.width, json.height);
                Object.assign(obj, json);
                return obj;
            }
            case 'flowchart-subprocess':
            case 'subprocess': {
                const obj = new SubprocessShape(json.x, json.y, json.width, json.height);
                Object.assign(obj, json);
                return obj;
            }
            case 'flowchart-connector':
            case 'connector': {
                const obj = new FlowchartConnector();
                Object.assign(obj, json);
                return obj;
            }
            default:
                return null;
        }
    }
    
    // Object operations
    groupSelected() {
        if (AppState.selectedObjects.length > 1) {
            this.saveStateForUndo();
            const group = new GroupObject();
            for (const obj of AppState.selectedObjects) {
                this.removeObject(obj.id);
                group.add(obj);
            }
            this.addObject(group);
            AppState.selectedObjects = [group];
            this.renderAllObjects();
            this._updateStatus('Objects grouped');
        }
    }
    
    ungroupSelected() {
        if (AppState.selectedObjects.length === 0) return;
        this.saveStateForUndo();
        const newSelection = [];
        for (const obj of AppState.selectedObjects) {
            if (obj.type === 'group') {
                this.removeObject(obj.id);
                for (const child of obj.children) {
                    this.addObject(child);
                    newSelection.push(child);
                }
            } else {
                newSelection.push(obj);
            }
        }
        AppState.selectedObjects = newSelection;
        this.renderAllObjects();
        this._updateStatus('Objects ungrouped');
    }
    
    bringToFront() {
        if (AppState.selectedObjects.length > 0) {
            this.saveStateForUndo();
            const activeLayer = this._getActiveLayer();
            if (activeLayer && activeLayer.objects) {
                for (const obj of AppState.selectedObjects) {
                    const idx = activeLayer.objects.indexOf(obj);
                    if (idx > -1) {
                        activeLayer.objects.splice(idx, 1);
                        activeLayer.objects.push(obj);
                    }
                }
                this.renderAllObjects();
                this._updateStatus('Brought to front');
            }
        }
    }
    
    sendToBack() {
        if (AppState.selectedObjects.length > 0) {
            this.saveStateForUndo();
            const activeLayer = this._getActiveLayer();
            if (activeLayer && activeLayer.objects) {
                for (const obj of AppState.selectedObjects) {
                    const idx = activeLayer.objects.indexOf(obj);
                    if (idx > -1) {
                        activeLayer.objects.splice(idx, 1);
                        activeLayer.objects.unshift(obj);
                    }
                }
                this.renderAllObjects();
                this._updateStatus('Sent to back');
            }
        }
    }
    
    // Chart insertion
    insertChart(type) {
        const x = 10, y = 10;
        const width = 40, height = 15;
        
        // Create a simple ASCII chart representation
        const chartText = this._generateChartASCII(type, width, height);
        const textObj = new TextObject(x, y, chartText);
        textObj.name = `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`;
        this.addObject(textObj);
        this._updateStatus(`Inserted ${type} chart`);
    }
    
    _generateChartASCII(type, width, height) {
        // Generate a simple ASCII chart representation
        switch (type) {
            case 'bar':
                return `┌${'─'.repeat(width - 2)}┐
│ ████  Bar Chart       │
│ ████ ██               │
│ ████ ██ ███           │
│ ████ ██ ███ █         │
└${'─'.repeat(width - 2)}┘`;
            case 'line':
                return `┌${'─'.repeat(width - 2)}┐
│        ╭──╮  Line     │
│     ╭──╯  ╰──╮        │
│  ╭──╯        ╰──      │
│──╯                    │
└${'─'.repeat(width - 2)}┘`;
            case 'pie':
                return `┌${'─'.repeat(width - 2)}┐
│    ╭────╮  Pie Chart  │
│   ╱ 30% ╲             │
│  │ 40%   │ 30%        │
│   ╲     ╱             │
│    ╰────╯             │
└${'─'.repeat(width - 2)}┘`;
            case 'scatter':
                return `┌${'─'.repeat(width - 2)}┐
│  ·    ·   Scatter     │
│    ·  · ·             │
│  · ·  ·               │
│ ·  ·                  │
└${'─'.repeat(width - 2)}┘`;
            default:
                return `┌${'─'.repeat(width - 2)}┐
│ Chart                 │
└${'─'.repeat(width - 2)}┘`;
        }
    }
    
    // Flowchart insertion
    insertFlowchartShape(type) {
        const x = 20, y = 10;
        let shape;
        
        switch (type) {
            case 'process':
                shape = new ProcessShape(x, y, 16, 5);
                shape.label = 'Process';
                break;
            case 'decision':
                shape = new DecisionShape(x, y, 14, 7);
                shape.label = 'Decision?';
                break;
            case 'terminator':
                shape = new TerminalShape(x, y, 12, 3);
                shape.label = 'Start/End';
                break;
            default:
                return;
        }
        
        this.addObject(shape);
        AppState.selectedObjects = [shape];
        this.renderAllObjects();
        this._updateStatus(`Inserted ${type} shape`);
    }
    
    // Panel operations
    togglePanel(panelName) {
        // Map panel names to their content IDs
        const panelMap = {
            'layers': 'panel-layers',
            'properties': 'panel-properties',
            'components': 'panel-components',
            'chars': 'panel-chars'
        };
        
        const panelId = panelMap[panelName];
        if (!panelId) return;
        
        const panel = $(`#${panelId}`);
        const tab = $(`.panel-tab[data-panel="${panelName}"]`);
        
        if (panel && tab) {
            // Check if this panel is currently active
            const isActive = panel.classList.contains('active');
            
            if (isActive) {
                // Hide the panel (deactivate)
                panel.classList.remove('active');
                tab.classList.remove('active');
                this._updateStatus(`${panelName} panel hidden`);
            } else {
                // Show the panel (activate it and hide others)
                $$('.panel-content').forEach(p => p.classList.remove('active'));
                $$('.panel-tab').forEach(t => t.classList.remove('active'));
                panel.classList.add('active');
                tab.classList.add('active');
                this._updateStatus(`${panelName} panel shown`);
            }
        }
    }
    
    // Help dialogs
    showShortcuts() {
        const shortcuts = `
╔══════════════════════════════════════════╗
║         KEYBOARD SHORTCUTS               ║
╠══════════════════════════════════════════╣
║  TOOLS                                   ║
║  V - Select Tool                         ║
║  A - Direct Select                       ║
║  P - Pen Tool                            ║
║  N - Pencil Tool                         ║
║  B - Brush Tool                          ║
║  R - Rectangle Tool                      ║
║  O - Ellipse Tool                        ║
║  L or \\ - Line Tool                      ║
║  T - Text Tool                           ║
║  E - Eraser Tool                         ║
╠══════════════════════════════════════════╣
║  FILE                                    ║
║  Ctrl+N - New Document                   ║
║  Ctrl+S - Save                           ║
║  Ctrl+E - Export                         ║
╠══════════════════════════════════════════╣
║  EDIT                                    ║
║  Ctrl+Z - Undo                           ║
║  Ctrl+Y / Ctrl+Shift+Z - Redo            ║
║  Ctrl+X - Cut                            ║
║  Ctrl+C - Copy                           ║
║  Ctrl+V - Paste                          ║
║  Ctrl+A - Select All                     ║
║  Ctrl+D - Duplicate                      ║
║  Delete - Delete Selection               ║
╠══════════════════════════════════════════╣
║  OBJECT                                  ║
║  Ctrl+G - Group                          ║
║  Ctrl+Shift+G - Ungroup                  ║
╚══════════════════════════════════════════╝`;
        alert(shortcuts);
    }
    
    showDocumentation() {
        window.open('docs/USER_MANUAL.md', '_blank');
    }
    
    showAbout() {
        alert('Asciistrator v0.1.0\nASCII Vector Graphics Editor\n\nA powerful, zero-dependency ASCII art creation tool.');
    }
    
    // Selection operations
    selectAll() {
        AppState.selectedObjects = [];
        for (const layer of AppState.layers) {
            if (layer.visible && !layer.locked && layer.objects) {
                for (const obj of layer.objects) {
                    if (obj.visible) {
                        AppState.selectedObjects.push(obj);
                    }
                }
            }
        }
        this.renderAllObjects();
        this._updateStatus(`Selected ${AppState.selectedObjects.length} objects`);
    }
    
    duplicate() {
        if (AppState.selectedObjects.length > 0) {
            this.saveStateForUndo();
            const newObjects = [];
            for (const obj of AppState.selectedObjects) {
                const clone = obj.clone();
                // Offset clone
                clone.x += 2;
                clone.y += 1;
                if (clone.x1 !== undefined) {
                    clone.x1 += 2;
                    clone.x2 += 2;
                    clone.y1 += 1;
                    clone.y2 += 1;
                }
                this.addObject(clone);
                newObjects.push(clone);
            }
            AppState.selectedObjects = newObjects;
            this.renderAllObjects();
            this._updateStatus(`Duplicated ${newObjects.length} objects`);
        }
    }
    
    deleteSelected() {
        if (AppState.selectedObjects.length > 0) {
            this.saveStateForUndo();
            const count = AppState.selectedObjects.length;
            for (const obj of AppState.selectedObjects) {
                this.removeObject(obj.id);
            }
            AppState.selectedObjects = [];
            this.renderAllObjects();
            this._updateStatusBar();
            this._updateStatus(`Deleted ${count} objects`);
        }
    }
}

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

const app = new Asciistrator();
app.init();

// Export for debugging
window.Asciistrator = {
    app,
    AppState,
    Vector2D,
    Matrix3x3,
    AsciiBuffer,
    drawLine,
    drawRect,
    fillRect,
    drawCircle,
    fillCircle
};

export default app;
