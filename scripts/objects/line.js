/**
 * Asciistrator - Line Objects
 * 
 * Line, Polyline, and Arrow shapes.
 */

import { SceneObject, Style } from './base.js';
import { Path, AnchorPoint } from './path.js';
import { Vector2D } from '../core/math/vector2d.js';
import { Geometry } from '../core/math/geometry.js';

// ==========================================
// LINE
// ==========================================

/**
 * Line - A straight line between two points
 */
export class Line extends SceneObject {
    /**
     * Create a line
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'line';
        this.name = options.name || 'Line';
        
        /** @type {number} Start X (relative to position) */
        this.x1 = options.x1 || 0;
        
        /** @type {number} Start Y (relative to position) */
        this.y1 = options.y1 || 0;
        
        /** @type {number} End X (relative to position) */
        this.x2 = options.x2 || 10;
        
        /** @type {number} End Y (relative to position) */
        this.y2 = options.y2 || 0;
        
        /** @type {string|null} Start arrow type: null, 'arrow', 'circle', 'square', 'diamond' */
        this.startArrow = options.startArrow || null;
        
        /** @type {string|null} End arrow type */
        this.endArrow = options.endArrow || null;
        
        /** @type {number} Arrow size */
        this.arrowSize = options.arrowSize || 2;
    }
    
    /**
     * Set start point
     * @param {number} x 
     * @param {number} y 
     */
    setStart(x, y) {
        this.x1 = x;
        this.y1 = y;
        this._invalidateGeometry();
    }
    
    /**
     * Set end point
     * @param {number} x 
     * @param {number} y 
     */
    setEnd(x, y) {
        this.x2 = x;
        this.y2 = y;
        this._invalidateGeometry();
    }
    
    /**
     * Get start point (local coordinates)
     * @returns {Vector2D}
     */
    getStart() {
        return new Vector2D(this.x1, this.y1);
    }
    
    /**
     * Get end point (local coordinates)
     * @returns {Vector2D}
     */
    getEnd() {
        return new Vector2D(this.x2, this.y2);
    }
    
    /**
     * Get line length
     * @returns {number}
     */
    getLength() {
        return Math.sqrt(
            (this.x2 - this.x1) ** 2 +
            (this.y2 - this.y1) ** 2
        );
    }
    
    /**
     * Get line angle
     * @returns {number}
     */
    getAngle() {
        return Math.atan2(this.y2 - this.y1, this.x2 - this.x1);
    }
    
    /**
     * Get point at t (0-1)
     * @param {number} t 
     * @returns {Vector2D}
     */
    getPointAt(t) {
        return new Vector2D(
            this.x1 + (this.x2 - this.x1) * t,
            this.y1 + (this.y2 - this.y1) * t
        );
    }
    
    /**
     * Get midpoint
     * @returns {Vector2D}
     */
    getMidpoint() {
        return this.getPointAt(0.5);
    }
    
    /**
     * Get local bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        const margin = this.arrowSize;
        return {
            minX: Math.min(this.x1, this.x2) - margin,
            minY: Math.min(this.y1, this.y2) - margin,
            maxX: Math.max(this.x1, this.x2) + margin,
            maxY: Math.max(this.y1, this.y2) + margin
        };
    }
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        const local = this.worldToLocal(x, y);
        const tolerance = 2;
        
        const dist = Geometry.pointToLineDistance(
            local,
            { x: this.x1, y: this.y1 },
            { x: this.x2, y: this.y2 }
        );
        
        return dist <= tolerance;
    }
    
    /**
     * Convert to path
     * @returns {Path}
     */
    toPath() {
        const path = new Path();
        path.moveTo(this.x1, this.y1);
        path.lineTo(this.x2, this.y2);
        
        path.style = this.style.clone();
        path.x = this.x;
        path.y = this.y;
        path.rotation = this.rotation;
        path.scaleX = this.scaleX;
        path.scaleY = this.scaleY;
        
        return path;
    }
    
    /**
     * Rasterize to ASCII cells
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        const cells = [];
        const transform = this.getWorldTransform();
        
        // Transform line endpoints
        const start = transform.transformPoint({ x: this.x1, y: this.y1 });
        const end = transform.transformPoint({ x: this.x2, y: this.y2 });
        
        // Rasterize line
        const lineCells = this._rasterizeLine(
            start.x, start.y,
            end.x, end.y
        );
        cells.push(...lineCells);
        
        // Add arrows
        if (this.startArrow) {
            const arrowCells = this._rasterizeArrow(
                start, end, this.startArrow, true
            );
            cells.push(...arrowCells);
        }
        
        if (this.endArrow) {
            const arrowCells = this._rasterizeArrow(
                start, end, this.endArrow, false
            );
            cells.push(...arrowCells);
        }
        
        return cells;
    }
    
    /**
     * Rasterize line using Bresenham's algorithm
     * @private
     */
    _rasterizeLine(x0, y0, x1, y1) {
        const cells = [];
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        let x = Math.round(x0);
        let y = Math.round(y0);
        const endX = Math.round(x1);
        const endY = Math.round(y1);
        
        while (true) {
            const char = this._getLineChar(dx, dy, sx, sy);
            
            cells.push({
                x, y,
                char,
                color: this.style.strokeColor
            });
            
            if (x === endX && y === endY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return cells;
    }
    
    /**
     * Get line character based on angle
     * @private
     */
    _getLineChar(dx, dy, sx, sy) {
        if (dx === 0) return this.style.getLineChar('vertical');
        if (dy === 0) return this.style.getLineChar('horizontal');
        
        const angle = Math.atan2(dy, dx);
        const deg = Math.abs(angle * 180 / Math.PI);
        
        if (deg < 22.5 || deg > 157.5) {
            return this.style.getLineChar('horizontal');
        } else if (deg > 67.5 && deg < 112.5) {
            return this.style.getLineChar('vertical');
        } else {
            return sx === sy ? '\\' : '/';
        }
    }
    
    /**
     * Rasterize arrow head
     * @private
     */
    _rasterizeArrow(start, end, type, isStart) {
        const cells = [];
        
        // Calculate direction
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len === 0) return cells;
        
        const dirX = dx / len;
        const dirY = dy / len;
        
        // Position at start or end
        const pos = isStart ? start : end;
        const dir = isStart ? { x: -dirX, y: -dirY } : { x: dirX, y: dirY };
        
        switch (type) {
            case 'arrow':
                // Arrow head character
                const arrowChar = this._getArrowChar(dir.x, dir.y);
                cells.push({
                    x: Math.round(pos.x),
                    y: Math.round(pos.y),
                    char: arrowChar,
                    color: this.style.strokeColor
                });
                break;
                
            case 'circle':
                cells.push({
                    x: Math.round(pos.x),
                    y: Math.round(pos.y),
                    char: '●',
                    color: this.style.strokeColor
                });
                break;
                
            case 'square':
                cells.push({
                    x: Math.round(pos.x),
                    y: Math.round(pos.y),
                    char: '■',
                    color: this.style.strokeColor
                });
                break;
                
            case 'diamond':
                cells.push({
                    x: Math.round(pos.x),
                    y: Math.round(pos.y),
                    char: '◆',
                    color: this.style.strokeColor
                });
                break;
        }
        
        return cells;
    }
    
    /**
     * Get arrow character based on direction
     * @private
     */
    _getArrowChar(dx, dy) {
        const angle = Math.atan2(dy, dx);
        const deg = angle * 180 / Math.PI;
        
        // 8-direction arrows
        if (deg >= -22.5 && deg < 22.5) return '→';
        if (deg >= 22.5 && deg < 67.5) return '↘';
        if (deg >= 67.5 && deg < 112.5) return '↓';
        if (deg >= 112.5 && deg < 157.5) return '↙';
        if (deg >= 157.5 || deg < -157.5) return '←';
        if (deg >= -157.5 && deg < -112.5) return '↖';
        if (deg >= -112.5 && deg < -67.5) return '↑';
        if (deg >= -67.5 && deg < -22.5) return '↗';
        
        return '→';
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
            startArrow: this.startArrow,
            endArrow: this.endArrow,
            arrowSize: this.arrowSize
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.x1 = data.x1 || 0;
        this.y1 = data.y1 || 0;
        this.x2 = data.x2 || 10;
        this.y2 = data.y2 || 0;
        this.startArrow = data.startArrow || null;
        this.endArrow = data.endArrow || null;
        this.arrowSize = data.arrowSize || 2;
        this._invalidateGeometry();
    }
    
    /**
     * Clone line
     * @returns {Line}
     */
    clone() {
        const cloned = new Line();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
}

// ==========================================
// POLYLINE
// ==========================================

/**
 * Polyline - A series of connected line segments
 */
export class Polyline extends SceneObject {
    /**
     * Create a polyline
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'polyline';
        this.name = options.name || 'Polyline';
        
        /** @type {Array<{x: number, y: number}>} */
        this.points = options.points || [];
        
        /** @type {boolean} */
        this.closed = options.closed || false;
        
        /** @type {string|null} Start arrow */
        this.startArrow = options.startArrow || null;
        
        /** @type {string|null} End arrow */
        this.endArrow = options.endArrow || null;
        
        /** @type {number} Arrow size */
        this.arrowSize = options.arrowSize || 2;
    }
    
    /**
     * Add point
     * @param {number} x 
     * @param {number} y 
     * @param {number} [index]
     * @returns {{x: number, y: number}}
     */
    addPoint(x, y, index = null) {
        const point = { x, y };
        
        if (index === null) {
            this.points.push(point);
        } else {
            this.points.splice(index, 0, point);
        }
        
        this._invalidateGeometry();
        return point;
    }
    
    /**
     * Remove point
     * @param {number} index 
     * @returns {{x: number, y: number}|null}
     */
    removePoint(index) {
        if (index < 0 || index >= this.points.length) return null;
        
        const removed = this.points.splice(index, 1)[0];
        this._invalidateGeometry();
        return removed;
    }
    
    /**
     * Move point
     * @param {number} index 
     * @param {number} x 
     * @param {number} y 
     */
    movePoint(index, x, y) {
        if (index >= 0 && index < this.points.length) {
            this.points[index].x = x;
            this.points[index].y = y;
            this._invalidateGeometry();
        }
    }
    
    /**
     * Get point count
     * @returns {number}
     */
    getPointCount() {
        return this.points.length;
    }
    
    /**
     * Get total length
     * @returns {number}
     */
    getLength() {
        let length = 0;
        const count = this.closed ? this.points.length : this.points.length - 1;
        
        for (let i = 0; i < count; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % this.points.length];
            
            length += Math.sqrt(
                (p2.x - p1.x) ** 2 +
                (p2.y - p1.y) ** 2
            );
        }
        
        return length;
    }
    
    /**
     * Get local bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        if (this.points.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const p of this.points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        
        const margin = this.arrowSize;
        return {
            minX: minX - margin,
            minY: minY - margin,
            maxX: maxX + margin,
            maxY: maxY + margin
        };
    }
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        const local = this.worldToLocal(x, y);
        const tolerance = 2;
        
        const count = this.closed ? this.points.length : this.points.length - 1;
        
        for (let i = 0; i < count; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % this.points.length];
            
            const dist = Geometry.pointToLineDistance(local, p1, p2);
            if (dist <= tolerance) return true;
        }
        
        return false;
    }
    
    /**
     * Convert to path
     * @returns {Path}
     */
    toPath() {
        const path = new Path({ closed: this.closed });
        
        if (this.points.length > 0) {
            path.moveTo(this.points[0].x, this.points[0].y);
            
            for (let i = 1; i < this.points.length; i++) {
                path.lineTo(this.points[i].x, this.points[i].y);
            }
            
            if (this.closed) {
                path.closePath();
            }
        }
        
        path.style = this.style.clone();
        path.x = this.x;
        path.y = this.y;
        path.rotation = this.rotation;
        path.scaleX = this.scaleX;
        path.scaleY = this.scaleY;
        
        return path;
    }
    
    /**
     * Rasterize to ASCII cells
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        if (this.points.length < 2) return [];
        
        const cells = [];
        const transform = this.getWorldTransform();
        
        // Transform all points
        const worldPoints = this.points.map(p => 
            transform.transformPoint(p)
        );
        
        // Rasterize segments
        const count = this.closed ? worldPoints.length : worldPoints.length - 1;
        
        for (let i = 0; i < count; i++) {
            const p1 = worldPoints[i];
            const p2 = worldPoints[(i + 1) % worldPoints.length];
            
            const lineCells = this._rasterizeLine(
                p1.x, p1.y,
                p2.x, p2.y,
                i === 0, i === count - 1
            );
            cells.push(...lineCells);
        }
        
        // Add corner characters
        this._addCornerChars(cells, worldPoints);
        
        return cells;
    }
    
    /**
     * Rasterize line segment
     * @private
     */
    _rasterizeLine(x0, y0, x1, y1, isFirst, isLast) {
        const cells = [];
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        let x = Math.round(x0);
        let y = Math.round(y0);
        const endX = Math.round(x1);
        const endY = Math.round(y1);
        
        while (true) {
            const char = this._getLineChar(dx, dy, sx, sy);
            
            cells.push({
                x, y,
                char,
                color: this.style.strokeColor
            });
            
            if (x === endX && y === endY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return cells;
    }
    
    /**
     * Get line character
     * @private
     */
    _getLineChar(dx, dy, sx, sy) {
        if (dx === 0) return this.style.getLineChar('vertical');
        if (dy === 0) return this.style.getLineChar('horizontal');
        
        const angle = Math.atan2(dy, dx);
        const deg = Math.abs(angle * 180 / Math.PI);
        
        if (deg < 22.5 || deg > 157.5) {
            return this.style.getLineChar('horizontal');
        } else if (deg > 67.5 && deg < 112.5) {
            return this.style.getLineChar('vertical');
        } else {
            return sx === sy ? '\\' : '/';
        }
    }
    
    /**
     * Add corner characters at vertices
     * @private
     */
    _addCornerChars(cells, worldPoints) {
        const corners = this.style.getCornerChars();
        
        for (let i = 1; i < worldPoints.length - (this.closed ? 0 : 1); i++) {
            const prev = worldPoints[(i - 1 + worldPoints.length) % worldPoints.length];
            const curr = worldPoints[i];
            const next = worldPoints[(i + 1) % worldPoints.length];
            
            // Calculate incoming and outgoing directions
            const inDir = {
                x: Math.sign(curr.x - prev.x),
                y: Math.sign(curr.y - prev.y)
            };
            const outDir = {
                x: Math.sign(next.x - curr.x),
                y: Math.sign(next.y - curr.y)
            };
            
            // Determine corner character
            const cornerChar = this._getCornerChar(inDir, outDir);
            
            if (cornerChar) {
                // Find and update the cell at this position
                const cx = Math.round(curr.x);
                const cy = Math.round(curr.y);
                
                const existing = cells.find(c => c.x === cx && c.y === cy);
                if (existing) {
                    existing.char = cornerChar;
                }
            }
        }
    }
    
    /**
     * Get corner character based on directions
     * @private
     */
    _getCornerChar(inDir, outDir) {
        const corners = this.style.getCornerChars();
        
        // Determine corner type based on direction change
        if (inDir.x === 0 && inDir.y < 0) { // Coming from below
            if (outDir.x > 0) return corners.bottomLeft;
            if (outDir.x < 0) return corners.bottomRight;
        }
        if (inDir.x === 0 && inDir.y > 0) { // Coming from above
            if (outDir.x > 0) return corners.topLeft;
            if (outDir.x < 0) return corners.topRight;
        }
        if (inDir.y === 0 && inDir.x > 0) { // Coming from left
            if (outDir.y > 0) return corners.topRight;
            if (outDir.y < 0) return corners.bottomRight;
        }
        if (inDir.y === 0 && inDir.x < 0) { // Coming from right
            if (outDir.y > 0) return corners.topLeft;
            if (outDir.y < 0) return corners.bottomLeft;
        }
        
        return null;
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            points: this.points.map(p => ({ x: p.x, y: p.y })),
            closed: this.closed,
            startArrow: this.startArrow,
            endArrow: this.endArrow,
            arrowSize: this.arrowSize
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.points = (data.points || []).map(p => ({ x: p.x, y: p.y }));
        this.closed = data.closed || false;
        this.startArrow = data.startArrow || null;
        this.endArrow = data.endArrow || null;
        this.arrowSize = data.arrowSize || 2;
        this._invalidateGeometry();
    }
    
    /**
     * Clone polyline
     * @returns {Polyline}
     */
    clone() {
        const cloned = new Polyline();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
}

// ==========================================
// CONNECTOR
// ==========================================

/**
 * Connector - A line that connects two objects
 */
export class Connector extends SceneObject {
    /**
     * Create a connector
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'connector';
        this.name = options.name || 'Connector';
        
        /** @type {string|null} ID of start object */
        this.startObjectId = options.startObjectId || null;
        
        /** @type {string|null} ID of end object */
        this.endObjectId = options.endObjectId || null;
        
        /** @type {string} Connection point: 'center', 'top', 'right', 'bottom', 'left', 'auto' */
        this.startAnchor = options.startAnchor || 'auto';
        
        /** @type {string} Connection point */
        this.endAnchor = options.endAnchor || 'auto';
        
        /** @type {string} Routing: 'straight', 'orthogonal', 'curved' */
        this.routing = options.routing || 'orthogonal';
        
        /** @type {string|null} Start arrow */
        this.startArrow = options.startArrow || null;
        
        /** @type {string|null} End arrow */
        this.endArrow = options.endArrow || 'arrow';
        
        /** @type {number} Corner radius for orthogonal routing */
        this.cornerRadius = options.cornerRadius || 0;
        
        // Fallback positions if objects not connected
        /** @type {{x: number, y: number}} */
        this.startPoint = options.startPoint || { x: 0, y: 0 };
        
        /** @type {{x: number, y: number}} */
        this.endPoint = options.endPoint || { x: 10, y: 0 };
    }
    
    /**
     * Connect to start object
     * @param {string} objectId 
     * @param {string} [anchor='auto']
     */
    connectStart(objectId, anchor = 'auto') {
        this.startObjectId = objectId;
        this.startAnchor = anchor;
        this._invalidateGeometry();
    }
    
    /**
     * Connect to end object
     * @param {string} objectId 
     * @param {string} [anchor='auto']
     */
    connectEnd(objectId, anchor = 'auto') {
        this.endObjectId = objectId;
        this.endAnchor = anchor;
        this._invalidateGeometry();
    }
    
    /**
     * Disconnect start
     */
    disconnectStart() {
        this.startObjectId = null;
        this._invalidateGeometry();
    }
    
    /**
     * Disconnect end
     */
    disconnectEnd() {
        this.endObjectId = null;
        this._invalidateGeometry();
    }
    
    /**
     * Get connection points (requires scene context)
     * @param {object} scene - Scene containing objects
     * @returns {{start: {x: number, y: number}, end: {x: number, y: number}}}
     */
    getConnectionPoints(scene) {
        let start = this.startPoint;
        let end = this.endPoint;
        
        if (this.startObjectId && scene) {
            const obj = scene.findById(this.startObjectId);
            if (obj) {
                start = this._getAnchorPoint(obj, this.startAnchor, end);
            }
        }
        
        if (this.endObjectId && scene) {
            const obj = scene.findById(this.endObjectId);
            if (obj) {
                end = this._getAnchorPoint(obj, this.endAnchor, start);
            }
        }
        
        return { start, end };
    }
    
    /**
     * Get anchor point on object
     * @private
     */
    _getAnchorPoint(obj, anchor, targetPoint) {
        const bounds = obj.getBounds();
        const center = {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
        };
        
        if (anchor === 'auto') {
            // Find closest edge to target
            const dx = targetPoint.x - center.x;
            const dy = targetPoint.y - center.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                anchor = dx > 0 ? 'right' : 'left';
            } else {
                anchor = dy > 0 ? 'bottom' : 'top';
            }
        }
        
        switch (anchor) {
            case 'center': return center;
            case 'top': return { x: center.x, y: bounds.minY };
            case 'right': return { x: bounds.maxX, y: center.y };
            case 'bottom': return { x: center.x, y: bounds.maxY };
            case 'left': return { x: bounds.minX, y: center.y };
            default: return center;
        }
    }
    
    /**
     * Get routing path
     * @param {{x: number, y: number}} start 
     * @param {{x: number, y: number}} end 
     * @returns {Array<{x: number, y: number}>}
     */
    getRoutingPath(start, end) {
        switch (this.routing) {
            case 'straight':
                return [start, end];
                
            case 'orthogonal':
                return this._getOrthogonalPath(start, end);
                
            case 'curved':
                return this._getCurvedPath(start, end);
                
            default:
                return [start, end];
        }
    }
    
    /**
     * Get orthogonal routing path
     * @private
     */
    _getOrthogonalPath(start, end) {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        // Simple L-shaped routing
        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);
        
        if (dx > dy) {
            // Horizontal first
            return [
                start,
                { x: midX, y: start.y },
                { x: midX, y: end.y },
                end
            ];
        } else {
            // Vertical first
            return [
                start,
                { x: start.x, y: midY },
                { x: end.x, y: midY },
                end
            ];
        }
    }
    
    /**
     * Get curved routing path
     * @private
     */
    _getCurvedPath(start, end) {
        // Control points for smooth curve
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        
        const cp1 = {
            x: start.x + dx * 0.5,
            y: start.y
        };
        
        const cp2 = {
            x: start.x + dx * 0.5,
            y: end.y
        };
        
        // Approximate curve with points
        const points = [start];
        const steps = 10;
        
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            // Cubic bezier
            const x = (1-t)*(1-t)*(1-t)*start.x + 
                     3*(1-t)*(1-t)*t*cp1.x + 
                     3*(1-t)*t*t*cp2.x + 
                     t*t*t*end.x;
            const y = (1-t)*(1-t)*(1-t)*start.y + 
                     3*(1-t)*(1-t)*t*cp1.y + 
                     3*(1-t)*t*t*cp2.y + 
                     t*t*t*end.y;
            
            points.push({ x, y });
        }
        
        return points;
    }
    
    /**
     * Get local bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        const { start, end } = this.getConnectionPoints(null);
        const path = this.getRoutingPath(start, end);
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const p of path) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        const local = this.worldToLocal(x, y);
        const { start, end } = this.getConnectionPoints(null);
        const path = this.getRoutingPath(start, end);
        
        const tolerance = 2;
        
        for (let i = 0; i < path.length - 1; i++) {
            const dist = Geometry.pointToLineDistance(local, path[i], path[i + 1]);
            if (dist <= tolerance) return true;
        }
        
        return false;
    }
    
    /**
     * Convert to polyline
     * @param {object} [scene]
     * @returns {Polyline}
     */
    toPolyline(scene) {
        const { start, end } = this.getConnectionPoints(scene);
        const path = this.getRoutingPath(start, end);
        
        const polyline = new Polyline({
            points: path,
            startArrow: this.startArrow,
            endArrow: this.endArrow
        });
        
        polyline.style = this.style.clone();
        return polyline;
    }
    
    /**
     * Rasterize to ASCII cells
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        const polyline = this.toPolyline(null);
        return polyline.rasterize();
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            startObjectId: this.startObjectId,
            endObjectId: this.endObjectId,
            startAnchor: this.startAnchor,
            endAnchor: this.endAnchor,
            routing: this.routing,
            startArrow: this.startArrow,
            endArrow: this.endArrow,
            cornerRadius: this.cornerRadius,
            startPoint: this.startPoint,
            endPoint: this.endPoint
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.startObjectId = data.startObjectId || null;
        this.endObjectId = data.endObjectId || null;
        this.startAnchor = data.startAnchor || 'auto';
        this.endAnchor = data.endAnchor || 'auto';
        this.routing = data.routing || 'orthogonal';
        this.startArrow = data.startArrow || null;
        this.endArrow = data.endArrow || 'arrow';
        this.cornerRadius = data.cornerRadius || 0;
        this.startPoint = data.startPoint || { x: 0, y: 0 };
        this.endPoint = data.endPoint || { x: 10, y: 0 };
        this._invalidateGeometry();
    }
    
    /**
     * Clone connector
     * @returns {Connector}
     */
    clone() {
        const cloned = new Connector();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
}

export default {
    Line,
    Polyline,
    Connector
};
