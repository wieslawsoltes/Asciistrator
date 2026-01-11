/**
 * Asciistrator - Path Object
 * 
 * Vector path with bezier curves, anchor points, and path operations.
 */

import { SceneObject, Style } from './base.js';
import { Vector2D } from '../core/math/vector2d.js';
import { Bezier } from '../core/math/bezier.js';
import { Geometry } from '../core/math/geometry.js';

// ==========================================
// ANCHOR POINT
// ==========================================

/**
 * AnchorPoint - A point on a path with control handles
 */
export class AnchorPoint {
    /**
     * Create an anchor point
     * @param {number} x 
     * @param {number} y 
     * @param {object} [options]
     */
    constructor(x, y, options = {}) {
        /** @type {number} */
        this.x = x;
        
        /** @type {number} */
        this.y = y;
        
        /** @type {string} Point type: 'corner', 'smooth', 'symmetric' */
        this.type = options.type || 'corner';
        
        /** @type {{x: number, y: number}|null} Handle in (before this point) */
        this.handleIn = options.handleIn || null;
        
        /** @type {{x: number, y: number}|null} Handle out (after this point) */
        this.handleOut = options.handleOut || null;
        
        /** @type {boolean} */
        this.selected = false;
    }
    
    /**
     * Get position as vector
     * @returns {Vector2D}
     */
    getPosition() {
        return new Vector2D(this.x, this.y);
    }
    
    /**
     * Set position
     * @param {number} x 
     * @param {number} y 
     */
    setPosition(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        
        this.x = x;
        this.y = y;
        
        // Move handles with point
        if (this.handleIn) {
            this.handleIn.x += dx;
            this.handleIn.y += dy;
        }
        if (this.handleOut) {
            this.handleOut.x += dx;
            this.handleOut.y += dy;
        }
    }
    
    /**
     * Get absolute handle in position
     * @returns {Vector2D|null}
     */
    getHandleIn() {
        if (!this.handleIn) return null;
        return new Vector2D(this.handleIn.x, this.handleIn.y);
    }
    
    /**
     * Get absolute handle out position
     * @returns {Vector2D|null}
     */
    getHandleOut() {
        if (!this.handleOut) return null;
        return new Vector2D(this.handleOut.x, this.handleOut.y);
    }
    
    /**
     * Set handle in (absolute coordinates)
     * @param {number} x 
     * @param {number} y 
     */
    setHandleIn(x, y) {
        this.handleIn = { x, y };
        
        // For smooth/symmetric, adjust handle out
        if (this.type === 'smooth' || this.type === 'symmetric') {
            this._mirrorHandle('out');
        }
    }
    
    /**
     * Set handle out (absolute coordinates)
     * @param {number} x 
     * @param {number} y 
     */
    setHandleOut(x, y) {
        this.handleOut = { x, y };
        
        // For smooth/symmetric, adjust handle in
        if (this.type === 'smooth' || this.type === 'symmetric') {
            this._mirrorHandle('in');
        }
    }
    
    /**
     * Mirror handle
     * @private
     */
    _mirrorHandle(which) {
        const source = which === 'in' ? this.handleOut : this.handleIn;
        if (!source) return;
        
        const dx = source.x - this.x;
        const dy = source.y - this.y;
        
        if (this.type === 'symmetric') {
            // Same length, opposite direction
            if (which === 'in') {
                this.handleIn = { x: this.x - dx, y: this.y - dy };
            } else {
                this.handleOut = { x: this.x - dx, y: this.y - dy };
            }
        } else if (this.type === 'smooth') {
            // Same direction, preserve length
            const targetHandle = which === 'in' ? this.handleIn : this.handleOut;
            if (targetHandle) {
                const targetLen = Math.sqrt(
                    (targetHandle.x - this.x) ** 2 + 
                    (targetHandle.y - this.y) ** 2
                );
                const sourceLen = Math.sqrt(dx * dx + dy * dy);
                
                if (sourceLen > 0) {
                    const scale = targetLen / sourceLen;
                    if (which === 'in') {
                        this.handleIn = { 
                            x: this.x - dx * scale, 
                            y: this.y - dy * scale 
                        };
                    } else {
                        this.handleOut = { 
                            x: this.x - dx * scale, 
                            y: this.y - dy * scale 
                        };
                    }
                }
            }
        }
    }
    
    /**
     * Make point a corner (independent handles)
     */
    makeCorner() {
        this.type = 'corner';
    }
    
    /**
     * Make point smooth (handles in line, different lengths)
     */
    makeSmooth() {
        this.type = 'smooth';
        if (this.handleIn && this.handleOut) {
            this._mirrorHandle('out');
        }
    }
    
    /**
     * Make point symmetric (handles in line, same length)
     */
    makeSymmetric() {
        this.type = 'symmetric';
        if (this.handleIn && this.handleOut) {
            this._mirrorHandle('out');
        }
    }
    
    /**
     * Clear handles (make line segment)
     */
    clearHandles() {
        this.handleIn = null;
        this.handleOut = null;
    }
    
    /**
     * Check if point has curves
     * @returns {boolean}
     */
    hasCurves() {
        return this.handleIn !== null || this.handleOut !== null;
    }
    
    /**
     * Clone anchor point
     * @returns {AnchorPoint}
     */
    clone() {
        return new AnchorPoint(this.x, this.y, {
            type: this.type,
            handleIn: this.handleIn ? { ...this.handleIn } : null,
            handleOut: this.handleOut ? { ...this.handleOut } : null
        });
    }
    
    /**
     * Serialize
     * @returns {object}
     */
    toJSON() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            handleIn: this.handleIn ? { ...this.handleIn } : null,
            handleOut: this.handleOut ? { ...this.handleOut } : null
        };
    }
    
    /**
     * Create from JSON
     * @param {object} data 
     * @returns {AnchorPoint}
     */
    static fromJSON(data) {
        return new AnchorPoint(data.x, data.y, {
            type: data.type,
            handleIn: data.handleIn,
            handleOut: data.handleOut
        });
    }
}

// ==========================================
// PATH SEGMENT
// ==========================================

/**
 * PathSegment - A segment between two anchor points
 */
export class PathSegment {
    /**
     * Create a path segment
     * @param {AnchorPoint} start 
     * @param {AnchorPoint} end 
     */
    constructor(start, end) {
        /** @type {AnchorPoint} */
        this.start = start;
        
        /** @type {AnchorPoint} */
        this.end = end;
    }
    
    /**
     * Check if segment is a line (no curves)
     * @returns {boolean}
     */
    isLine() {
        return !this.start.handleOut && !this.end.handleIn;
    }
    
    /**
     * Check if segment is a curve
     * @returns {boolean}
     */
    isCurve() {
        return this.start.handleOut !== null || this.end.handleIn !== null;
    }
    
    /**
     * Get point at t (0-1)
     * @param {number} t 
     * @returns {Vector2D}
     */
    getPointAt(t) {
        if (this.isLine()) {
            return new Vector2D(
                this.start.x + (this.end.x - this.start.x) * t,
                this.start.y + (this.end.y - this.start.y) * t
            );
        }
        
        // Cubic bezier
        const p0 = { x: this.start.x, y: this.start.y };
        const p1 = this.start.handleOut || p0;
        const p2 = this.end.handleIn || { x: this.end.x, y: this.end.y };
        const p3 = { x: this.end.x, y: this.end.y };
        
        return Bezier.cubicPoint(p0, p1, p2, p3, t);
    }
    
    /**
     * Get tangent at t (0-1)
     * @param {number} t 
     * @returns {Vector2D}
     */
    getTangentAt(t) {
        if (this.isLine()) {
            return new Vector2D(
                this.end.x - this.start.x,
                this.end.y - this.start.y
            ).normalize();
        }
        
        const p0 = { x: this.start.x, y: this.start.y };
        const p1 = this.start.handleOut || p0;
        const p2 = this.end.handleIn || { x: this.end.x, y: this.end.y };
        const p3 = { x: this.end.x, y: this.end.y };
        
        return Bezier.cubicTangent(p0, p1, p2, p3, t);
    }
    
    /**
     * Get segment length
     * @param {number} [samples=20]
     * @returns {number}
     */
    getLength(samples = 20) {
        if (this.isLine()) {
            return Math.sqrt(
                (this.end.x - this.start.x) ** 2 +
                (this.end.y - this.start.y) ** 2
            );
        }
        
        let length = 0;
        let prev = this.getPointAt(0);
        
        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const curr = this.getPointAt(t);
            length += Math.sqrt(
                (curr.x - prev.x) ** 2 +
                (curr.y - prev.y) ** 2
            );
            prev = curr;
        }
        
        return length;
    }
    
    /**
     * Get bounding box
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getBounds() {
        if (this.isLine()) {
            return {
                minX: Math.min(this.start.x, this.end.x),
                minY: Math.min(this.start.y, this.end.y),
                maxX: Math.max(this.start.x, this.end.x),
                maxY: Math.max(this.start.y, this.end.y)
            };
        }
        
        const p0 = { x: this.start.x, y: this.start.y };
        const p1 = this.start.handleOut || p0;
        const p2 = this.end.handleIn || { x: this.end.x, y: this.end.y };
        const p3 = { x: this.end.x, y: this.end.y };
        
        return Bezier.cubicBounds(p0, p1, p2, p3);
    }
    
    /**
     * Split segment at t
     * @param {number} t 
     * @returns {[PathSegment, PathSegment]}
     */
    split(t) {
        if (this.isLine()) {
            const mid = this.getPointAt(t);
            const midPoint = new AnchorPoint(mid.x, mid.y);
            
            return [
                new PathSegment(this.start.clone(), midPoint),
                new PathSegment(midPoint.clone(), this.end.clone())
            ];
        }
        
        const p0 = { x: this.start.x, y: this.start.y };
        const p1 = this.start.handleOut || p0;
        const p2 = this.end.handleIn || { x: this.end.x, y: this.end.y };
        const p3 = { x: this.end.x, y: this.end.y };
        
        const [left, right] = Bezier.splitCubic(p0, p1, p2, p3, t);
        
        const startPoint = new AnchorPoint(left.p0.x, left.p0.y, {
            handleOut: left.p1
        });
        
        const midPoint1 = new AnchorPoint(left.p3.x, left.p3.y, {
            handleIn: left.p2
        });
        
        const midPoint2 = new AnchorPoint(right.p0.x, right.p0.y, {
            handleOut: right.p1
        });
        
        const endPoint = new AnchorPoint(right.p3.x, right.p3.y, {
            handleIn: right.p2
        });
        
        return [
            new PathSegment(startPoint, midPoint1),
            new PathSegment(midPoint2, endPoint)
        ];
    }
}

// ==========================================
// PATH
// ==========================================

/**
 * Path - Vector path with bezier curves
 */
export class Path extends SceneObject {
    /**
     * Create a path
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'path';
        this.name = options.name || 'Path';
        
        /** @type {AnchorPoint[]} */
        this.points = [];
        
        /** @type {boolean} */
        this.closed = options.closed || false;
        
        /** @type {string} Fill rule: 'nonzero', 'evenodd' */
        this.fillRule = options.fillRule || 'nonzero';
        
        // Initialize with points if provided
        if (options.points) {
            for (const p of options.points) {
                if (p instanceof AnchorPoint) {
                    this.points.push(p);
                } else {
                    this.points.push(new AnchorPoint(p.x, p.y, p));
                }
            }
        }
    }
    
    // ==========================================
    // POINT MANAGEMENT
    // ==========================================
    
    /**
     * Add anchor point
     * @param {AnchorPoint|{x: number, y: number}} point 
     * @param {number} [index] - Insert index
     * @returns {AnchorPoint}
     */
    addPoint(point, index = null) {
        const anchor = point instanceof AnchorPoint 
            ? point 
            : new AnchorPoint(point.x, point.y, point);
        
        if (index === null) {
            this.points.push(anchor);
        } else {
            this.points.splice(index, 0, anchor);
        }
        
        this._invalidateGeometry();
        return anchor;
    }
    
    /**
     * Remove anchor point
     * @param {number} index 
     * @returns {AnchorPoint|null}
     */
    removePoint(index) {
        if (index < 0 || index >= this.points.length) return null;
        
        const removed = this.points.splice(index, 1)[0];
        this._invalidateGeometry();
        return removed;
    }
    
    /**
     * Get anchor point
     * @param {number} index 
     * @returns {AnchorPoint|null}
     */
    getPoint(index) {
        // Handle negative indices and wrapping
        if (this.closed && this.points.length > 0) {
            index = ((index % this.points.length) + this.points.length) % this.points.length;
        }
        return this.points[index] || null;
    }
    
    /**
     * Get point count
     * @returns {number}
     */
    getPointCount() {
        return this.points.length;
    }
    
    /**
     * Move all points
     * @param {number} dx 
     * @param {number} dy 
     */
    movePoints(dx, dy) {
        for (const point of this.points) {
            point.setPosition(point.x + dx, point.y + dy);
        }
        this._invalidateGeometry();
    }
    
    // ==========================================
    // PATH BUILDING
    // ==========================================
    
    /**
     * Move to point (start new subpath)
     * @param {number} x 
     * @param {number} y 
     * @returns {Path} this
     */
    moveTo(x, y) {
        this.addPoint(new AnchorPoint(x, y));
        return this;
    }
    
    /**
     * Line to point
     * @param {number} x 
     * @param {number} y 
     * @returns {Path} this
     */
    lineTo(x, y) {
        this.addPoint(new AnchorPoint(x, y));
        return this;
    }
    
    /**
     * Quadratic curve to point
     * @param {number} cpx - Control point X
     * @param {number} cpy - Control point Y
     * @param {number} x - End point X
     * @param {number} y - End point Y
     * @returns {Path} this
     */
    quadraticCurveTo(cpx, cpy, x, y) {
        const last = this.points[this.points.length - 1];
        if (last) {
            // Convert quadratic to cubic control points
            const cp1x = last.x + (2/3) * (cpx - last.x);
            const cp1y = last.y + (2/3) * (cpy - last.y);
            const cp2x = x + (2/3) * (cpx - x);
            const cp2y = y + (2/3) * (cpy - y);
            
            last.setHandleOut(cp1x, cp1y);
            
            const endPoint = new AnchorPoint(x, y, {
                handleIn: { x: cp2x, y: cp2y }
            });
            this.addPoint(endPoint);
        }
        return this;
    }
    
    /**
     * Cubic curve to point
     * @param {number} cp1x - Control point 1 X
     * @param {number} cp1y - Control point 1 Y
     * @param {number} cp2x - Control point 2 X
     * @param {number} cp2y - Control point 2 Y
     * @param {number} x - End point X
     * @param {number} y - End point Y
     * @returns {Path} this
     */
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        const last = this.points[this.points.length - 1];
        if (last) {
            last.setHandleOut(cp1x, cp1y);
        }
        
        const endPoint = new AnchorPoint(x, y, {
            handleIn: { x: cp2x, y: cp2y }
        });
        this.addPoint(endPoint);
        return this;
    }
    
    /**
     * Arc to point
     * @param {number} x - End X
     * @param {number} y - End Y
     * @param {number} radius 
     * @returns {Path} this
     */
    arcTo(x, y, radius) {
        // Approximate arc with bezier curves
        const last = this.points[this.points.length - 1];
        if (!last) return this;
        
        // Simple implementation - add curved segment
        const midX = (last.x + x) / 2;
        const midY = (last.y + y) / 2;
        
        // Perpendicular offset for arc
        const dx = x - last.x;
        const dy = y - last.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len > 0) {
            const bulge = radius * 0.5;
            const perpX = -dy / len * bulge;
            const perpY = dx / len * bulge;
            
            return this.quadraticCurveTo(
                midX + perpX, 
                midY + perpY, 
                x, y
            );
        }
        
        return this.lineTo(x, y);
    }
    
    /**
     * Close the path
     * @returns {Path} this
     */
    closePath() {
        this.closed = true;
        this._invalidateGeometry();
        return this;
    }
    
    // ==========================================
    // SEGMENTS
    // ==========================================
    
    /**
     * Get all segments
     * @returns {PathSegment[]}
     */
    getSegments() {
        const segments = [];
        const count = this.closed ? this.points.length : this.points.length - 1;
        
        for (let i = 0; i < count; i++) {
            const start = this.points[i];
            const end = this.points[(i + 1) % this.points.length];
            segments.push(new PathSegment(start, end));
        }
        
        return segments;
    }
    
    /**
     * Get segment at index
     * @param {number} index 
     * @returns {PathSegment|null}
     */
    getSegment(index) {
        const segments = this.getSegments();
        return segments[index] || null;
    }
    
    /**
     * Get total path length
     * @returns {number}
     */
    getLength() {
        let length = 0;
        for (const segment of this.getSegments()) {
            length += segment.getLength();
        }
        return length;
    }
    
    /**
     * Get point at distance along path
     * @param {number} distance 
     * @returns {Vector2D|null}
     */
    getPointAtLength(distance) {
        const segments = this.getSegments();
        let accumulated = 0;
        
        for (const segment of segments) {
            const segLength = segment.getLength();
            
            if (accumulated + segLength >= distance) {
                const t = (distance - accumulated) / segLength;
                return segment.getPointAt(t);
            }
            
            accumulated += segLength;
        }
        
        return null;
    }
    
    /**
     * Get tangent at distance
     * @param {number} distance 
     * @returns {Vector2D|null}
     */
    getTangentAtLength(distance) {
        const segments = this.getSegments();
        let accumulated = 0;
        
        for (const segment of segments) {
            const segLength = segment.getLength();
            
            if (accumulated + segLength >= distance) {
                const t = (distance - accumulated) / segLength;
                return segment.getTangentAt(t);
            }
            
            accumulated += segLength;
        }
        
        return null;
    }
    
    // ==========================================
    // PATH OPERATIONS
    // ==========================================
    
    /**
     * Reverse path direction
     * @returns {Path} this
     */
    reverse() {
        this.points.reverse();
        
        // Swap handles
        for (const point of this.points) {
            const temp = point.handleIn;
            point.handleIn = point.handleOut;
            point.handleOut = temp;
        }
        
        this._invalidateGeometry();
        return this;
    }
    
    /**
     * Flatten path (convert curves to line segments)
     * @param {number} [flatness=0.5] - Maximum error
     * @returns {Path} new flattened path
     */
    flatten(flatness = 0.5) {
        const flattened = new Path();
        
        if (this.points.length === 0) return flattened;
        
        flattened.moveTo(this.points[0].x, this.points[0].y);
        
        for (const segment of this.getSegments()) {
            if (segment.isLine()) {
                flattened.lineTo(segment.end.x, segment.end.y);
            } else {
                // Subdivide curve
                const points = this._flattenCurve(segment, flatness);
                for (const p of points) {
                    flattened.lineTo(p.x, p.y);
                }
            }
        }
        
        if (this.closed) {
            flattened.closePath();
        }
        
        flattened.style = this.style.clone();
        return flattened;
    }
    
    /**
     * Flatten a curve segment
     * @private
     */
    _flattenCurve(segment, flatness, depth = 0) {
        if (depth > 10) {
            return [segment.end.getPosition()];
        }
        
        // Check if flat enough
        const mid = segment.getPointAt(0.5);
        const linear = new Vector2D(
            (segment.start.x + segment.end.x) / 2,
            (segment.start.y + segment.end.y) / 2
        );
        
        const error = Math.sqrt(
            (mid.x - linear.x) ** 2 + 
            (mid.y - linear.y) ** 2
        );
        
        if (error <= flatness) {
            return [segment.end.getPosition()];
        }
        
        // Subdivide
        const [left, right] = segment.split(0.5);
        return [
            ...this._flattenCurve(left, flatness, depth + 1),
            ...this._flattenCurve(right, flatness, depth + 1)
        ];
    }
    
    /**
     * Simplify path (reduce points while preserving shape)
     * @param {number} [tolerance=1]
     * @returns {Path}
     */
    simplify(tolerance = 1) {
        if (this.points.length < 3) return this.clone();
        
        // Flatten first
        const flat = this.flatten(tolerance / 2);
        
        // Ramer-Douglas-Peucker simplification
        const simplified = this._rdpSimplify(flat.points, tolerance);
        
        const result = new Path({ closed: this.closed });
        for (const p of simplified) {
            result.addPoint(new AnchorPoint(p.x, p.y));
        }
        
        result.style = this.style.clone();
        return result;
    }
    
    /**
     * RDP simplification
     * @private
     */
    _rdpSimplify(points, tolerance) {
        if (points.length < 3) return points;
        
        // Find point with max distance
        let maxDist = 0;
        let maxIndex = 0;
        
        const first = points[0];
        const last = points[points.length - 1];
        
        for (let i = 1; i < points.length - 1; i++) {
            const dist = Geometry.pointToLineDistance(
                points[i],
                first,
                last
            );
            
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }
        
        if (maxDist > tolerance) {
            // Recurse
            const left = this._rdpSimplify(points.slice(0, maxIndex + 1), tolerance);
            const right = this._rdpSimplify(points.slice(maxIndex), tolerance);
            
            return [...left.slice(0, -1), ...right];
        }
        
        return [first, last];
    }
    
    /**
     * Offset path
     * @param {number} distance 
     * @returns {Path}
     */
    offset(distance) {
        const result = new Path({ closed: this.closed });
        
        // Simple offset - move points along normals
        const segments = this.getSegments();
        
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            
            // Get average normal at this point
            let normal = new Vector2D(0, 0);
            let count = 0;
            
            // From previous segment
            if (i > 0 || this.closed) {
                const prevIdx = (i - 1 + this.points.length) % this.points.length;
                const seg = new PathSegment(this.points[prevIdx], point);
                const tangent = seg.getTangentAt(1);
                normal = normal.add(new Vector2D(-tangent.y, tangent.x));
                count++;
            }
            
            // From next segment
            if (i < this.points.length - 1 || this.closed) {
                const nextIdx = (i + 1) % this.points.length;
                const seg = new PathSegment(point, this.points[nextIdx]);
                const tangent = seg.getTangentAt(0);
                normal = normal.add(new Vector2D(-tangent.y, tangent.x));
                count++;
            }
            
            if (count > 0) {
                normal = normal.scale(1 / count).normalize();
            }
            
            result.addPoint(new AnchorPoint(
                point.x + normal.x * distance,
                point.y + normal.y * distance
            ));
        }
        
        result.style = this.style.clone();
        return result;
    }
    
    // ==========================================
    // BOUNDS
    // ==========================================
    
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
        
        for (const segment of this.getSegments()) {
            const bounds = segment.getBounds();
            minX = Math.min(minX, bounds.minX);
            minY = Math.min(minY, bounds.minY);
            maxX = Math.max(maxX, bounds.maxX);
            maxY = Math.max(maxY, bounds.maxY);
        }
        
        // Include last point if not closed
        if (!this.closed && this.points.length > 0) {
            const last = this.points[this.points.length - 1];
            minX = Math.min(minX, last.x);
            minY = Math.min(minY, last.y);
            maxX = Math.max(maxX, last.x);
            maxY = Math.max(maxY, last.y);
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    // ==========================================
    // HIT TESTING
    // ==========================================
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        const local = this.worldToLocal(x, y);
        const hitDistance = 3; // Tolerance in local units
        
        // Check if near any segment
        for (const segment of this.getSegments()) {
            if (this._isPointNearSegment(local, segment, hitDistance)) {
                return true;
            }
        }
        
        // Check if inside filled path
        if (this.style.fill && this.closed) {
            return this._isPointInside(local);
        }
        
        return false;
    }
    
    /**
     * Check if point is near segment
     * @private
     */
    _isPointNearSegment(point, segment, distance) {
        // Sample along segment
        const samples = segment.isCurve() ? 20 : 2;
        
        for (let i = 0; i < samples; i++) {
            const t = i / (samples - 1);
            const p = segment.getPointAt(t);
            const dist = Math.sqrt(
                (point.x - p.x) ** 2 + 
                (point.y - p.y) ** 2
            );
            
            if (dist <= distance) return true;
        }
        
        return false;
    }
    
    /**
     * Check if point is inside closed path
     * @private
     */
    _isPointInside(point) {
        // Ray casting algorithm
        let inside = false;
        const flat = this.flatten(1);
        
        for (let i = 0, j = flat.points.length - 1; i < flat.points.length; j = i++) {
            const pi = flat.points[i];
            const pj = flat.points[j];
            
            if (((pi.y > point.y) !== (pj.y > point.y)) &&
                (point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y) + pi.x)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    // ==========================================
    // RENDERING
    // ==========================================
    
    /**
     * Rasterize path to ASCII cells
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        const cells = [];
        const transform = this.getWorldTransform();
        
        // Rasterize stroke
        if (this.style.stroke) {
            const flat = this.flatten(0.5);
            const segments = flat.getSegments();
            
            for (const segment of segments) {
                const start = transform.transformPoint(segment.start);
                const end = transform.transformPoint(segment.end);
                
                const lineCells = this._rasterizeLine(
                    start.x, start.y,
                    end.x, end.y
                );
                
                cells.push(...lineCells);
            }
        }
        
        // Rasterize fill
        if (this.style.fill && this.closed) {
            const fillCells = this._rasterizeFill();
            cells.push(...fillCells);
        }
        
        return cells;
    }
    
    /**
     * Rasterize line segment
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
            // Determine character based on direction
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
     * Get line character based on direction
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
            // Diagonal
            return sx === sy ? '\\' : '/';
        }
    }
    
    /**
     * Rasterize fill
     * @private
     */
    _rasterizeFill() {
        const cells = [];
        const bounds = this.getBounds();
        const transform = this.getWorldTransform();
        
        // Scan line fill
        for (let y = Math.floor(bounds.minY); y <= Math.ceil(bounds.maxY); y++) {
            for (let x = Math.floor(bounds.minX); x <= Math.ceil(bounds.maxX); x++) {
                const local = this.worldToLocal(x, y);
                
                if (this._isPointInside(local)) {
                    cells.push({
                        x, y,
                        char: this.style.getFillChar(),
                        color: this.style.fillColor
                    });
                }
            }
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
            points: this.points.map(p => p.toJSON()),
            closed: this.closed,
            fillRule: this.fillRule
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        
        this.points = [];
        if (data.points) {
            for (const p of data.points) {
                this.points.push(AnchorPoint.fromJSON(p));
            }
        }
        
        this.closed = data.closed || false;
        this.fillRule = data.fillRule || 'nonzero';
        
        this._invalidateGeometry();
    }
    
    /**
     * Clone path
     * @returns {Path}
     */
    clone() {
        const cloned = new Path();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
    
    /**
     * Create path from SVG path data
     * @param {string} d - SVG path d attribute
     * @returns {Path}
     */
    static fromSVGPath(d) {
        const path = new Path();
        // Basic SVG path parser - handles M, L, C, Q, Z commands
        const commands = d.match(/[MLCQZmlcqz][^MLCQZmlcqz]*/g) || [];
        
        let currentX = 0;
        let currentY = 0;
        
        for (const cmd of commands) {
            const type = cmd[0];
            const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
            
            switch (type.toUpperCase()) {
                case 'M':
                    if (type === 'm') {
                        currentX += args[0];
                        currentY += args[1];
                    } else {
                        currentX = args[0];
                        currentY = args[1];
                    }
                    path.moveTo(currentX, currentY);
                    break;
                    
                case 'L':
                    if (type === 'l') {
                        currentX += args[0];
                        currentY += args[1];
                    } else {
                        currentX = args[0];
                        currentY = args[1];
                    }
                    path.lineTo(currentX, currentY);
                    break;
                    
                case 'C':
                    if (type === 'c') {
                        path.bezierCurveTo(
                            currentX + args[0], currentY + args[1],
                            currentX + args[2], currentY + args[3],
                            currentX + args[4], currentY + args[5]
                        );
                        currentX += args[4];
                        currentY += args[5];
                    } else {
                        path.bezierCurveTo(
                            args[0], args[1],
                            args[2], args[3],
                            args[4], args[5]
                        );
                        currentX = args[4];
                        currentY = args[5];
                    }
                    break;
                    
                case 'Q':
                    if (type === 'q') {
                        path.quadraticCurveTo(
                            currentX + args[0], currentY + args[1],
                            currentX + args[2], currentY + args[3]
                        );
                        currentX += args[2];
                        currentY += args[3];
                    } else {
                        path.quadraticCurveTo(
                            args[0], args[1],
                            args[2], args[3]
                        );
                        currentX = args[2];
                        currentY = args[3];
                    }
                    break;
                    
                case 'Z':
                    path.closePath();
                    break;
            }
        }
        
        return path;
    }
}

export default {
    AnchorPoint,
    PathSegment,
    Path
};
