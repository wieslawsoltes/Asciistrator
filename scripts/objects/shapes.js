/**
 * Asciistrator - Shape Objects
 * 
 * Rectangle, Ellipse, Polygon, and Star shapes.
 */

import { SceneObject, Style } from './base.js';
import { Path, AnchorPoint } from './path.js';
import { Vector2D } from '../core/math/vector2d.js';
import { Geometry } from '../core/math/geometry.js';

// ==========================================
// RECTANGLE
// ==========================================

/**
 * Rectangle - A rectangular shape with optional corner radius
 */
export class Rectangle extends SceneObject {
    /**
     * Create a rectangle
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'rectangle';
        this.name = options.name || 'Rectangle';
        
        /** @type {number} Width */
        this.width = options.width || 10;
        
        /** @type {number} Height */
        this.height = options.height || 10;
        
        /** @type {number} Corner radius (0 for sharp corners) */
        this.cornerRadius = options.cornerRadius || 0;
        
        /** @type {number[]} Individual corner radii [topLeft, topRight, bottomRight, bottomLeft] */
        this.cornerRadii = options.cornerRadii || null;
    }
    
    /**
     * Set size
     * @param {number} width 
     * @param {number} height 
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this._invalidateGeometry();
    }
    
    /**
     * Set corner radius
     * @param {number} radius 
     */
    setCornerRadius(radius) {
        this.cornerRadius = radius;
        this.cornerRadii = null;
        this._invalidateGeometry();
    }
    
    /**
     * Set individual corner radii
     * @param {number} topLeft 
     * @param {number} topRight 
     * @param {number} bottomRight 
     * @param {number} bottomLeft 
     */
    setCornerRadii(topLeft, topRight, bottomRight, bottomLeft) {
        this.cornerRadii = [topLeft, topRight, bottomRight, bottomLeft];
        this._invalidateGeometry();
    }
    
    /**
     * Get effective corner radii
     * @returns {number[]}
     */
    getCornerRadii() {
        if (this.cornerRadii) {
            return this.cornerRadii;
        }
        const r = this.cornerRadius;
        return [r, r, r, r];
    }
    
    /**
     * Get local bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        // Origin at center
        return {
            minX: -this.width / 2,
            minY: -this.height / 2,
            maxX: this.width / 2,
            maxY: this.height / 2
        };
    }
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        const local = this.worldToLocal(x, y);
        const hw = this.width / 2;
        const hh = this.height / 2;
        
        // Simple rectangle check (ignoring corner radius for now)
        if (local.x < -hw || local.x > hw || local.y < -hh || local.y > hh) {
            return false;
        }
        
        // Check corners if radius > 0
        const radii = this.getCornerRadii();
        if (radii.some(r => r > 0)) {
            return this._hitTestRoundedRect(local, hw, hh, radii);
        }
        
        return true;
    }
    
    /**
     * Hit test rounded rectangle
     * @private
     */
    _hitTestRoundedRect(point, hw, hh, radii) {
        const corners = [
            { x: -hw, y: -hh, r: radii[0], cx: -hw + radii[0], cy: -hh + radii[0] },
            { x: hw, y: -hh, r: radii[1], cx: hw - radii[1], cy: -hh + radii[1] },
            { x: hw, y: hh, r: radii[2], cx: hw - radii[2], cy: hh - radii[2] },
            { x: -hw, y: hh, r: radii[3], cx: -hw + radii[3], cy: hh - radii[3] }
        ];
        
        for (const corner of corners) {
            if (corner.r <= 0) continue;
            
            // Check if point is in corner region
            const inCornerX = (corner.x < 0) ? (point.x < corner.cx) : (point.x > corner.cx);
            const inCornerY = (corner.y < 0) ? (point.y < corner.cy) : (point.y > corner.cy);
            
            if (inCornerX && inCornerY) {
                // Check distance from corner center
                const dx = point.x - corner.cx;
                const dy = point.y - corner.cy;
                if (dx * dx + dy * dy > corner.r * corner.r) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Convert to path
     * @returns {Path}
     */
    toPath() {
        const path = new Path({ closed: true });
        const hw = this.width / 2;
        const hh = this.height / 2;
        const radii = this.getCornerRadii();
        
        // Bezier approximation of quarter circle: 0.5522847498
        const k = 0.5522847498;
        
        if (radii.every(r => r === 0)) {
            // Simple rectangle
            path.moveTo(-hw, -hh);
            path.lineTo(hw, -hh);
            path.lineTo(hw, hh);
            path.lineTo(-hw, hh);
        } else {
            // Rounded rectangle
            const [tl, tr, br, bl] = radii.map(r => Math.min(r, hw, hh));
            
            // Top left corner
            path.moveTo(-hw + tl, -hh);
            
            // Top edge and top right corner
            path.lineTo(hw - tr, -hh);
            if (tr > 0) {
                path.bezierCurveTo(
                    hw - tr * (1 - k), -hh,
                    hw, -hh + tr * (1 - k),
                    hw, -hh + tr
                );
            }
            
            // Right edge and bottom right corner
            path.lineTo(hw, hh - br);
            if (br > 0) {
                path.bezierCurveTo(
                    hw, hh - br * (1 - k),
                    hw - br * (1 - k), hh,
                    hw - br, hh
                );
            }
            
            // Bottom edge and bottom left corner
            path.lineTo(-hw + bl, hh);
            if (bl > 0) {
                path.bezierCurveTo(
                    -hw + bl * (1 - k), hh,
                    -hw, hh - bl * (1 - k),
                    -hw, hh - bl
                );
            }
            
            // Left edge and top left corner
            path.lineTo(-hw, -hh + tl);
            if (tl > 0) {
                path.bezierCurveTo(
                    -hw, -hh + tl * (1 - k),
                    -hw + tl * (1 - k), -hh,
                    -hw + tl, -hh
                );
            }
        }
        
        path.closePath();
        path.style = this.style.clone();
        
        // Copy transform
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
        const hw = this.width / 2;
        const hh = this.height / 2;
        const radii = this.getCornerRadii();
        const hasRadius = radii.some(r => r > 0);
        
        // Get style characters
        const hChar = this.style.getLineChar('horizontal');
        const vChar = this.style.getLineChar('vertical');
        const corners = this.style.getCornerChars();
        
        // Rasterize stroke
        if (this.style.stroke) {
            // Top edge
            for (let x = Math.ceil(-hw + radii[0]); x <= Math.floor(hw - radii[1]); x++) {
                const worldPos = transform.transformPoint({ x, y: -hh });
                cells.push({
                    x: Math.round(worldPos.x),
                    y: Math.round(worldPos.y),
                    char: hChar,
                    color: this.style.strokeColor
                });
            }
            
            // Bottom edge
            for (let x = Math.ceil(-hw + radii[3]); x <= Math.floor(hw - radii[2]); x++) {
                const worldPos = transform.transformPoint({ x, y: hh });
                cells.push({
                    x: Math.round(worldPos.x),
                    y: Math.round(worldPos.y),
                    char: hChar,
                    color: this.style.strokeColor
                });
            }
            
            // Left edge
            for (let y = Math.ceil(-hh + radii[0]); y <= Math.floor(hh - radii[3]); y++) {
                const worldPos = transform.transformPoint({ x: -hw, y });
                cells.push({
                    x: Math.round(worldPos.x),
                    y: Math.round(worldPos.y),
                    char: vChar,
                    color: this.style.strokeColor
                });
            }
            
            // Right edge
            for (let y = Math.ceil(-hh + radii[1]); y <= Math.floor(hh - radii[2]); y++) {
                const worldPos = transform.transformPoint({ x: hw, y });
                cells.push({
                    x: Math.round(worldPos.x),
                    y: Math.round(worldPos.y),
                    char: vChar,
                    color: this.style.strokeColor
                });
            }
            
            // Corners (if no radius)
            if (!hasRadius) {
                const cornerPositions = [
                    { x: -hw, y: -hh, char: corners.topLeft },
                    { x: hw, y: -hh, char: corners.topRight },
                    { x: hw, y: hh, char: corners.bottomRight },
                    { x: -hw, y: hh, char: corners.bottomLeft }
                ];
                
                for (const corner of cornerPositions) {
                    const worldPos = transform.transformPoint({ x: corner.x, y: corner.y });
                    cells.push({
                        x: Math.round(worldPos.x),
                        y: Math.round(worldPos.y),
                        char: corner.char,
                        color: this.style.strokeColor
                    });
                }
            } else {
                // Rounded corners - use arc characters or approximate
                this._rasterizeRoundedCorners(cells, transform, hw, hh, radii);
            }
        }
        
        // Rasterize fill
        if (this.style.fill) {
            const fillChar = this.style.getFillChar();
            const bounds = this.getBounds();
            
            for (let y = Math.ceil(bounds.minY) + 1; y < Math.floor(bounds.maxY); y++) {
                for (let x = Math.ceil(bounds.minX) + 1; x < Math.floor(bounds.maxX); x++) {
                    const local = this.worldToLocal(x, y);
                    
                    // Check if inside (excluding stroke)
                    if (Math.abs(local.x) < hw - 0.5 && Math.abs(local.y) < hh - 0.5) {
                        if (!hasRadius || this._hitTestRoundedRect(
                            local, hw - 0.5, hh - 0.5, 
                            radii.map(r => Math.max(0, r - 1))
                        )) {
                            cells.push({
                                x, y,
                                char: fillChar,
                                color: this.style.fillColor
                            });
                        }
                    }
                }
            }
        }
        
        return cells;
    }
    
    /**
     * Rasterize rounded corners
     * @private
     */
    _rasterizeRoundedCorners(cells, transform, hw, hh, radii) {
        const [tl, tr, br, bl] = radii;
        
        // Arc characters for rounded corners
        const arcChars = {
            topLeft: ['╭', '╮', '╯', '╰'][0],
            topRight: ['╭', '╮', '╯', '╰'][1],
            bottomRight: ['╭', '╮', '╯', '╰'][2],
            bottomLeft: ['╭', '╮', '╯', '╰'][3]
        };
        
        // Simple approximation: draw corner characters
        if (tl > 0) {
            const worldPos = transform.transformPoint({ x: -hw + tl, y: -hh + tl });
            cells.push({
                x: Math.round(worldPos.x) - tl,
                y: Math.round(worldPos.y) - tl,
                char: arcChars.topLeft,
                color: this.style.strokeColor
            });
        }
        
        if (tr > 0) {
            const worldPos = transform.transformPoint({ x: hw - tr, y: -hh + tr });
            cells.push({
                x: Math.round(worldPos.x) + tr,
                y: Math.round(worldPos.y) - tr,
                char: arcChars.topRight,
                color: this.style.strokeColor
            });
        }
        
        if (br > 0) {
            const worldPos = transform.transformPoint({ x: hw - br, y: hh - br });
            cells.push({
                x: Math.round(worldPos.x) + br,
                y: Math.round(worldPos.y) + br,
                char: arcChars.bottomRight,
                color: this.style.strokeColor
            });
        }
        
        if (bl > 0) {
            const worldPos = transform.transformPoint({ x: -hw + bl, y: hh - bl });
            cells.push({
                x: Math.round(worldPos.x) - bl,
                y: Math.round(worldPos.y) + bl,
                char: arcChars.bottomLeft,
                color: this.style.strokeColor
            });
        }
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            width: this.width,
            height: this.height,
            cornerRadius: this.cornerRadius,
            cornerRadii: this.cornerRadii
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.width = data.width || 10;
        this.height = data.height || 10;
        this.cornerRadius = data.cornerRadius || 0;
        this.cornerRadii = data.cornerRadii || null;
        this._invalidateGeometry();
    }
    
    /**
     * Clone rectangle
     * @returns {Rectangle}
     */
    clone() {
        const cloned = new Rectangle();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
}

// ==========================================
// ELLIPSE
// ==========================================

/**
 * Ellipse - An elliptical or circular shape
 */
export class Ellipse extends SceneObject {
    /**
     * Create an ellipse
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'ellipse';
        this.name = options.name || 'Ellipse';
        
        /** @type {number} Horizontal radius */
        this.radiusX = options.radiusX || options.radius || 5;
        
        /** @type {number} Vertical radius */
        this.radiusY = options.radiusY || options.radius || 5;
        
        /** @type {number} Start angle in radians */
        this.startAngle = options.startAngle || 0;
        
        /** @type {number} End angle in radians */
        this.endAngle = options.endAngle || Math.PI * 2;
        
        /** @type {boolean} Close path if arc */
        this.closedArc = options.closedArc !== false;
    }
    
    /**
     * Set radius (makes circle)
     * @param {number} radius 
     */
    setRadius(radius) {
        this.radiusX = radius;
        this.radiusY = radius;
        this._invalidateGeometry();
    }
    
    /**
     * Set radii
     * @param {number} radiusX 
     * @param {number} radiusY 
     */
    setRadii(radiusX, radiusY) {
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this._invalidateGeometry();
    }
    
    /**
     * Check if this is a circle
     * @returns {boolean}
     */
    isCircle() {
        return Math.abs(this.radiusX - this.radiusY) < 0.001;
    }
    
    /**
     * Check if this is a full ellipse (not an arc)
     * @returns {boolean}
     */
    isFullEllipse() {
        return Math.abs((this.endAngle - this.startAngle) - Math.PI * 2) < 0.001;
    }
    
    /**
     * Get point at angle
     * @param {number} angle 
     * @returns {Vector2D}
     */
    getPointAtAngle(angle) {
        return new Vector2D(
            Math.cos(angle) * this.radiusX,
            Math.sin(angle) * this.radiusY
        );
    }
    
    /**
     * Get local bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        if (this.isFullEllipse()) {
            return {
                minX: -this.radiusX,
                minY: -this.radiusY,
                maxX: this.radiusX,
                maxY: this.radiusY
            };
        }
        
        // For arcs, find bounding box
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        // Check start and end points
        const points = [
            this.getPointAtAngle(this.startAngle),
            this.getPointAtAngle(this.endAngle)
        ];
        
        // Check cardinal points if they're in the arc range
        const cardinals = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        for (const angle of cardinals) {
            if (this._angleInRange(angle)) {
                points.push(this.getPointAtAngle(angle));
            }
        }
        
        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Check if angle is in arc range
     * @private
     */
    _angleInRange(angle) {
        let start = this.startAngle % (Math.PI * 2);
        let end = this.endAngle % (Math.PI * 2);
        angle = angle % (Math.PI * 2);
        
        if (start < 0) start += Math.PI * 2;
        if (end < 0) end += Math.PI * 2;
        if (angle < 0) angle += Math.PI * 2;
        
        if (start <= end) {
            return angle >= start && angle <= end;
        } else {
            return angle >= start || angle <= end;
        }
    }
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        const local = this.worldToLocal(x, y);
        
        // Normalized distance from center
        const nx = local.x / this.radiusX;
        const ny = local.y / this.radiusY;
        const dist = nx * nx + ny * ny;
        
        // Check if inside ellipse
        if (dist > 1) return false;
        
        // Check if in arc range
        if (!this.isFullEllipse()) {
            const angle = Math.atan2(local.y, local.x);
            if (!this._angleInRange(angle)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Convert to path
     * @returns {Path}
     */
    toPath() {
        const path = new Path();
        
        // Approximate ellipse with bezier curves (4 segments)
        const k = 0.5522847498; // Magic number for bezier approximation
        
        if (this.isFullEllipse()) {
            const rx = this.radiusX;
            const ry = this.radiusY;
            
            path.moveTo(rx, 0);
            
            // Right to bottom
            path.bezierCurveTo(rx, ry * k, rx * k, ry, 0, ry);
            
            // Bottom to left
            path.bezierCurveTo(-rx * k, ry, -rx, ry * k, -rx, 0);
            
            // Left to top
            path.bezierCurveTo(-rx, -ry * k, -rx * k, -ry, 0, -ry);
            
            // Top to right
            path.bezierCurveTo(rx * k, -ry, rx, -ry * k, rx, 0);
            
            path.closePath();
        } else {
            // Arc - approximate with multiple segments
            const segments = 16;
            const angleRange = this.endAngle - this.startAngle;
            
            path.moveTo(
                Math.cos(this.startAngle) * this.radiusX,
                Math.sin(this.startAngle) * this.radiusY
            );
            
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const angle = this.startAngle + angleRange * t;
                const prevAngle = this.startAngle + angleRange * (t - 1/segments);
                
                // Use bezier approximation for arc segment
                const da = angleRange / segments;
                const kArc = (4/3) * Math.tan(da / 4);
                
                const cos0 = Math.cos(prevAngle);
                const sin0 = Math.sin(prevAngle);
                const cos1 = Math.cos(angle);
                const sin1 = Math.sin(angle);
                
                path.bezierCurveTo(
                    (cos0 - kArc * sin0) * this.radiusX,
                    (sin0 + kArc * cos0) * this.radiusY,
                    (cos1 + kArc * sin1) * this.radiusX,
                    (sin1 - kArc * cos1) * this.radiusY,
                    cos1 * this.radiusX,
                    sin1 * this.radiusY
                );
            }
            
            if (this.closedArc) {
                path.lineTo(0, 0);
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
        const cells = [];
        const transform = this.getWorldTransform();
        
        // Midpoint ellipse algorithm
        if (this.style.stroke) {
            const strokeCells = this._rasterizeEllipseStroke(transform);
            cells.push(...strokeCells);
        }
        
        if (this.style.fill) {
            const fillCells = this._rasterizeEllipseFill(transform);
            cells.push(...fillCells);
        }
        
        return cells;
    }
    
    /**
     * Rasterize ellipse stroke
     * @private
     */
    _rasterizeEllipseStroke(transform) {
        const cells = [];
        const rx = Math.round(this.radiusX);
        const ry = Math.round(this.radiusY);
        
        if (rx === ry) {
            // Circle - use midpoint algorithm
            return this._rasterizeCircleStroke(transform, rx);
        }
        
        // Midpoint ellipse algorithm
        let x = 0;
        let y = ry;
        
        const rx2 = rx * rx;
        const ry2 = ry * ry;
        const tworx2 = 2 * rx2;
        const twory2 = 2 * ry2;
        
        let px = 0;
        let py = tworx2 * y;
        
        // Region 1
        let p = Math.round(ry2 - (rx2 * ry) + (0.25 * rx2));
        while (px < py) {
            this._addEllipsePoints(cells, transform, x, y);
            x++;
            px += twory2;
            if (p < 0) {
                p += ry2 + px;
            } else {
                y--;
                py -= tworx2;
                p += ry2 + px - py;
            }
        }
        
        // Region 2
        p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
        while (y >= 0) {
            this._addEllipsePoints(cells, transform, x, y);
            y--;
            py -= tworx2;
            if (p > 0) {
                p += rx2 - py;
            } else {
                x++;
                px += twory2;
                p += rx2 - py + px;
            }
        }
        
        return cells;
    }
    
    /**
     * Rasterize circle stroke
     * @private
     */
    _rasterizeCircleStroke(transform, r) {
        const cells = [];
        let x = 0;
        let y = r;
        let d = 3 - 2 * r;
        
        while (x <= y) {
            this._addCirclePoints(cells, transform, x, y);
            if (d < 0) {
                d = d + 4 * x + 6;
            } else {
                d = d + 4 * (x - y) + 10;
                y--;
            }
            x++;
        }
        
        return cells;
    }
    
    /**
     * Add ellipse points (4-way symmetry)
     * @private
     */
    _addEllipsePoints(cells, transform, x, y) {
        const points = [
            { x, y },
            { x: -x, y },
            { x, y: -y },
            { x: -x, y: -y }
        ];
        
        const char = this._getEllipseChar(x, y);
        
        for (const p of points) {
            const worldPos = transform.transformPoint(p);
            cells.push({
                x: Math.round(worldPos.x),
                y: Math.round(worldPos.y),
                char,
                color: this.style.strokeColor
            });
        }
    }
    
    /**
     * Add circle points (8-way symmetry)
     * @private
     */
    _addCirclePoints(cells, transform, x, y) {
        const points = [
            { x, y },
            { x: -x, y },
            { x, y: -y },
            { x: -x, y: -y },
            { x: y, y: x },
            { x: -y, y: x },
            { x: y, y: -x },
            { x: -y, y: -x }
        ];
        
        for (const p of points) {
            const char = this._getEllipseChar(p.x, p.y);
            const worldPos = transform.transformPoint(p);
            cells.push({
                x: Math.round(worldPos.x),
                y: Math.round(worldPos.y),
                char,
                color: this.style.strokeColor
            });
        }
    }
    
    /**
     * Get character for ellipse point
     * @private
     */
    _getEllipseChar(x, y) {
        // Determine tangent direction
        const angle = Math.atan2(y * this.radiusX * this.radiusX, x * this.radiusY * this.radiusY);
        const deg = Math.abs(angle * 180 / Math.PI);
        
        if (deg < 22.5 || deg > 157.5) {
            return this.style.getLineChar('horizontal');
        } else if (deg > 67.5 && deg < 112.5) {
            return this.style.getLineChar('vertical');
        } else {
            // Use arc characters for curves
            if (x >= 0 && y >= 0) return '╮';
            if (x <= 0 && y >= 0) return '╭';
            if (x <= 0 && y <= 0) return '╰';
            return '╯';
        }
    }
    
    /**
     * Rasterize ellipse fill
     * @private
     */
    _rasterizeEllipseFill(transform) {
        const cells = [];
        const fillChar = this.style.getFillChar();
        const rx = this.radiusX;
        const ry = this.radiusY;
        
        // Scan line fill
        for (let y = -Math.floor(ry); y <= Math.floor(ry); y++) {
            // Calculate x extent at this y
            const t = y / ry;
            if (Math.abs(t) > 1) continue;
            
            const xExtent = rx * Math.sqrt(1 - t * t);
            
            for (let x = -Math.floor(xExtent); x <= Math.floor(xExtent); x++) {
                const worldPos = transform.transformPoint({ x, y });
                cells.push({
                    x: Math.round(worldPos.x),
                    y: Math.round(worldPos.y),
                    char: fillChar,
                    color: this.style.fillColor
                });
            }
        }
        
        return cells;
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            radiusX: this.radiusX,
            radiusY: this.radiusY,
            startAngle: this.startAngle,
            endAngle: this.endAngle,
            closedArc: this.closedArc
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.radiusX = data.radiusX || 5;
        this.radiusY = data.radiusY || 5;
        this.startAngle = data.startAngle || 0;
        this.endAngle = data.endAngle || Math.PI * 2;
        this.closedArc = data.closedArc !== false;
        this._invalidateGeometry();
    }
    
    /**
     * Clone ellipse
     * @returns {Ellipse}
     */
    clone() {
        const cloned = new Ellipse();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
}

// ==========================================
// POLYGON
// ==========================================

/**
 * Polygon - Regular polygon shape
 */
export class Polygon extends SceneObject {
    /**
     * Create a polygon
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'polygon';
        this.name = options.name || 'Polygon';
        
        /** @type {number} Number of sides */
        this.sides = Math.max(3, options.sides || 5);
        
        /** @type {number} Radius (circumradius) */
        this.radius = options.radius || 5;
        
        /** @type {number} Rotation offset in radians */
        this.angleOffset = options.angleOffset || -Math.PI / 2;
    }
    
    /**
     * Set number of sides
     * @param {number} sides 
     */
    setSides(sides) {
        this.sides = Math.max(3, sides);
        this._invalidateGeometry();
    }
    
    /**
     * Set radius
     * @param {number} radius 
     */
    setRadius(radius) {
        this.radius = radius;
        this._invalidateGeometry();
    }
    
    /**
     * Get vertices
     * @returns {Vector2D[]}
     */
    getVertices() {
        const vertices = [];
        const angleStep = (Math.PI * 2) / this.sides;
        
        for (let i = 0; i < this.sides; i++) {
            const angle = this.angleOffset + i * angleStep;
            vertices.push(new Vector2D(
                Math.cos(angle) * this.radius,
                Math.sin(angle) * this.radius
            ));
        }
        
        return vertices;
    }
    
    /**
     * Get local bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        const vertices = this.getVertices();
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const v of vertices) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        const local = this.worldToLocal(x, y);
        const vertices = this.getVertices();
        
        // Point in polygon test (ray casting)
        let inside = false;
        
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const vi = vertices[i];
            const vj = vertices[j];
            
            if (((vi.y > local.y) !== (vj.y > local.y)) &&
                (local.x < (vj.x - vi.x) * (local.y - vi.y) / (vj.y - vi.y) + vi.x)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    /**
     * Convert to path
     * @returns {Path}
     */
    toPath() {
        const path = new Path({ closed: true });
        const vertices = this.getVertices();
        
        if (vertices.length > 0) {
            path.moveTo(vertices[0].x, vertices[0].y);
            
            for (let i = 1; i < vertices.length; i++) {
                path.lineTo(vertices[i].x, vertices[i].y);
            }
            
            path.closePath();
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
        // Convert to path and rasterize
        return this.toPath().rasterize();
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            sides: this.sides,
            radius: this.radius,
            angleOffset: this.angleOffset
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.sides = data.sides || 5;
        this.radius = data.radius || 5;
        this.angleOffset = data.angleOffset || -Math.PI / 2;
        this._invalidateGeometry();
    }
    
    /**
     * Clone polygon
     * @returns {Polygon}
     */
    clone() {
        const cloned = new Polygon();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
}

// ==========================================
// STAR
// ==========================================

/**
 * Star - Star shape with inner and outer radius
 */
export class Star extends SceneObject {
    /**
     * Create a star
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'star';
        this.name = options.name || 'Star';
        
        /** @type {number} Number of points */
        this.points = Math.max(3, options.points || 5);
        
        /** @type {number} Outer radius */
        this.outerRadius = options.outerRadius || options.radius || 5;
        
        /** @type {number} Inner radius */
        this.innerRadius = options.innerRadius || this.outerRadius * 0.4;
        
        /** @type {number} Rotation offset in radians */
        this.angleOffset = options.angleOffset || -Math.PI / 2;
    }
    
    /**
     * Set number of points
     * @param {number} points 
     */
    setPoints(points) {
        this.points = Math.max(3, points);
        this._invalidateGeometry();
    }
    
    /**
     * Set radii
     * @param {number} outer 
     * @param {number} inner 
     */
    setRadii(outer, inner) {
        this.outerRadius = outer;
        this.innerRadius = inner;
        this._invalidateGeometry();
    }
    
    /**
     * Get vertices
     * @returns {Vector2D[]}
     */
    getVertices() {
        const vertices = [];
        const angleStep = Math.PI / this.points;
        
        for (let i = 0; i < this.points * 2; i++) {
            const angle = this.angleOffset + i * angleStep;
            const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
            
            vertices.push(new Vector2D(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            ));
        }
        
        return vertices;
    }
    
    /**
     * Get local bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        const vertices = this.getVertices();
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const v of vertices) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        const local = this.worldToLocal(x, y);
        const vertices = this.getVertices();
        
        // Point in polygon test
        let inside = false;
        
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const vi = vertices[i];
            const vj = vertices[j];
            
            if (((vi.y > local.y) !== (vj.y > local.y)) &&
                (local.x < (vj.x - vi.x) * (local.y - vi.y) / (vj.y - vi.y) + vi.x)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    /**
     * Convert to path
     * @returns {Path}
     */
    toPath() {
        const path = new Path({ closed: true });
        const vertices = this.getVertices();
        
        if (vertices.length > 0) {
            path.moveTo(vertices[0].x, vertices[0].y);
            
            for (let i = 1; i < vertices.length; i++) {
                path.lineTo(vertices[i].x, vertices[i].y);
            }
            
            path.closePath();
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
        return this.toPath().rasterize();
    }
    
    /**
     * Serialize to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            points: this.points,
            outerRadius: this.outerRadius,
            innerRadius: this.innerRadius,
            angleOffset: this.angleOffset
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.points = data.points || 5;
        this.outerRadius = data.outerRadius || 5;
        this.innerRadius = data.innerRadius || 2;
        this.angleOffset = data.angleOffset || -Math.PI / 2;
        this._invalidateGeometry();
    }
    
    /**
     * Clone star
     * @returns {Star}
     */
    clone() {
        const cloned = new Star();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
}

export default {
    Rectangle,
    Ellipse,
    Polygon,
    Star
};
