/**
 * Asciistrator - Geometry Module
 * 
 * Geometric primitives, intersection tests, and hit testing algorithms.
 * Includes shapes, collision detection, and spatial queries.
 */

import { Vector2D } from './vector2d.js';

// ==========================================
// CONSTANTS
// ==========================================

const EPSILON = 1e-10;
const PI2 = Math.PI * 2;

// ==========================================
// BOUNDING BOX (AABB)
// ==========================================

/**
 * Axis-Aligned Bounding Box
 */
export class BoundingBox {
    /**
     * Create a bounding box
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     */
    constructor(minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    /**
     * Create from center and size
     * @param {number} cx 
     * @param {number} cy 
     * @param {number} width 
     * @param {number} height 
     * @returns {BoundingBox}
     */
    static fromCenter(cx, cy, width, height) {
        const hw = width / 2;
        const hh = height / 2;
        return new BoundingBox(cx - hw, cy - hh, cx + hw, cy + hh);
    }

    /**
     * Create from points
     * @param {Vector2D[]} points 
     * @returns {BoundingBox}
     */
    static fromPoints(points) {
        const box = new BoundingBox();
        for (const p of points) {
            box.expandByPoint(p);
        }
        return box;
    }

    /**
     * Create from two corners
     * @param {Vector2D} p1 
     * @param {Vector2D} p2 
     * @returns {BoundingBox}
     */
    static fromCorners(p1, p2) {
        return new BoundingBox(
            Math.min(p1.x, p2.x),
            Math.min(p1.y, p2.y),
            Math.max(p1.x, p2.x),
            Math.max(p1.y, p2.y)
        );
    }

    get width() { return this.maxX - this.minX; }
    get height() { return this.maxY - this.minY; }
    get centerX() { return (this.minX + this.maxX) / 2; }
    get centerY() { return (this.minY + this.maxY) / 2; }
    get center() { return new Vector2D(this.centerX, this.centerY); }
    get min() { return new Vector2D(this.minX, this.minY); }
    get max() { return new Vector2D(this.maxX, this.maxY); }
    get area() { return this.width * this.height; }
    get perimeter() { return 2 * (this.width + this.height); }
    get diagonal() { return Math.sqrt(this.width ** 2 + this.height ** 2); }

    /**
     * Check if box is valid (non-empty)
     * @returns {boolean}
     */
    isValid() {
        return this.minX <= this.maxX && this.minY <= this.maxY;
    }

    /**
     * Check if box is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.minX > this.maxX || this.minY > this.maxY;
    }

    /**
     * Clone the box
     * @returns {BoundingBox}
     */
    clone() {
        return new BoundingBox(this.minX, this.minY, this.maxX, this.maxY);
    }

    /**
     * Reset to empty state
     * @returns {BoundingBox}
     */
    reset() {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        return this;
    }

    /**
     * Set from values
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     * @returns {BoundingBox}
     */
    set(minX, minY, maxX, maxY) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        return this;
    }

    /**
     * Expand to include a point
     * @param {Vector2D} point 
     * @returns {BoundingBox}
     */
    expandByPoint(point) {
        this.minX = Math.min(this.minX, point.x);
        this.minY = Math.min(this.minY, point.y);
        this.maxX = Math.max(this.maxX, point.x);
        this.maxY = Math.max(this.maxY, point.y);
        return this;
    }

    /**
     * Expand to include another box
     * @param {BoundingBox} box 
     * @returns {BoundingBox}
     */
    expandByBox(box) {
        this.minX = Math.min(this.minX, box.minX);
        this.minY = Math.min(this.minY, box.minY);
        this.maxX = Math.max(this.maxX, box.maxX);
        this.maxY = Math.max(this.maxY, box.maxY);
        return this;
    }

    /**
     * Expand by a scalar amount
     * @param {number} amount 
     * @returns {BoundingBox}
     */
    expand(amount) {
        this.minX -= amount;
        this.minY -= amount;
        this.maxX += amount;
        this.maxY += amount;
        return this;
    }

    /**
     * Contract by a scalar amount
     * @param {number} amount 
     * @returns {BoundingBox}
     */
    contract(amount) {
        return this.expand(-amount);
    }

    /**
     * Check if point is inside
     * @param {Vector2D} point 
     * @returns {boolean}
     */
    containsPoint(point) {
        return point.x >= this.minX && point.x <= this.maxX &&
               point.y >= this.minY && point.y <= this.maxY;
    }

    /**
     * Check if another box is fully contained
     * @param {BoundingBox} box 
     * @returns {boolean}
     */
    containsBox(box) {
        return box.minX >= this.minX && box.maxX <= this.maxX &&
               box.minY >= this.minY && box.maxY <= this.maxY;
    }

    /**
     * Check intersection with another box
     * @param {BoundingBox} box 
     * @returns {boolean}
     */
    intersectsBox(box) {
        return !(box.maxX < this.minX || box.minX > this.maxX ||
                 box.maxY < this.minY || box.minY > this.maxY);
    }

    /**
     * Get intersection with another box
     * @param {BoundingBox} box 
     * @returns {BoundingBox|null}
     */
    intersection(box) {
        if (!this.intersectsBox(box)) return null;
        return new BoundingBox(
            Math.max(this.minX, box.minX),
            Math.max(this.minY, box.minY),
            Math.min(this.maxX, box.maxX),
            Math.min(this.maxY, box.maxY)
        );
    }

    /**
     * Get union with another box
     * @param {BoundingBox} box 
     * @returns {BoundingBox}
     */
    union(box) {
        return new BoundingBox(
            Math.min(this.minX, box.minX),
            Math.min(this.minY, box.minY),
            Math.max(this.maxX, box.maxX),
            Math.max(this.maxY, box.maxY)
        );
    }

    /**
     * Get the four corner points
     * @returns {Vector2D[]}
     */
    getCorners() {
        return [
            new Vector2D(this.minX, this.minY),
            new Vector2D(this.maxX, this.minY),
            new Vector2D(this.maxX, this.maxY),
            new Vector2D(this.minX, this.maxY)
        ];
    }

    /**
     * Clamp a point to be within the box
     * @param {Vector2D} point 
     * @returns {Vector2D}
     */
    clampPoint(point) {
        return new Vector2D(
            Math.max(this.minX, Math.min(this.maxX, point.x)),
            Math.max(this.minY, Math.min(this.maxY, point.y))
        );
    }

    /**
     * Get distance from point to box edge
     * @param {Vector2D} point 
     * @returns {number}
     */
    distanceToPoint(point) {
        const clamped = this.clampPoint(point);
        return point.distanceTo(clamped);
    }
}

// ==========================================
// LINE SEGMENT
// ==========================================

/**
 * Line segment between two points
 */
export class LineSegment {
    /**
     * Create a line segment
     * @param {Vector2D} start 
     * @param {Vector2D} end 
     */
    constructor(start, end) {
        this.start = start.clone();
        this.end = end.clone();
    }

    get length() {
        return this.start.distanceTo(this.end);
    }

    get lengthSquared() {
        return this.start.distanceToSquared(this.end);
    }

    get direction() {
        return this.end.subtract(this.start).normalize();
    }

    get midpoint() {
        return this.start.midpoint(this.end);
    }

    get angle() {
        return this.start.angleTo(this.end);
    }

    /**
     * Get point at parameter t (0-1)
     * @param {number} t 
     * @returns {Vector2D}
     */
    getPoint(t) {
        return this.start.lerp(this.end, t);
    }

    /**
     * Get the nearest point on the segment to a given point
     * @param {Vector2D} point 
     * @returns {{point: Vector2D, t: number, distance: number}}
     */
    nearestPoint(point) {
        const v = this.end.subtract(this.start);
        const w = point.subtract(this.start);
        
        const c1 = w.dot(v);
        if (c1 <= 0) {
            return { point: this.start.clone(), t: 0, distance: point.distanceTo(this.start) };
        }
        
        const c2 = v.dot(v);
        if (c2 <= c1) {
            return { point: this.end.clone(), t: 1, distance: point.distanceTo(this.end) };
        }
        
        const t = c1 / c2;
        const nearest = this.start.add(v.multiply(t));
        return { point: nearest, t, distance: point.distanceTo(nearest) };
    }

    /**
     * Get distance from point to segment
     * @param {Vector2D} point 
     * @returns {number}
     */
    distanceToPoint(point) {
        return this.nearestPoint(point).distance;
    }

    /**
     * Check intersection with another segment
     * @param {LineSegment} other 
     * @returns {{intersects: boolean, point?: Vector2D, t1?: number, t2?: number}}
     */
    intersect(other) {
        const d1 = this.end.subtract(this.start);
        const d2 = other.end.subtract(other.start);
        const d = other.start.subtract(this.start);
        
        const cross = d1.cross(d2);
        
        if (Math.abs(cross) < EPSILON) {
            // Parallel or collinear
            return { intersects: false };
        }
        
        const t1 = d.cross(d2) / cross;
        const t2 = d.cross(d1) / cross;
        
        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
            return {
                intersects: true,
                point: this.getPoint(t1),
                t1,
                t2
            };
        }
        
        return { intersects: false };
    }

    /**
     * Check if segments intersect (faster than getting intersection point)
     * @param {LineSegment} other 
     * @returns {boolean}
     */
    intersects(other) {
        return this.intersect(other).intersects;
    }

    /**
     * Get bounding box
     * @returns {BoundingBox}
     */
    getBoundingBox() {
        return BoundingBox.fromCorners(this.start, this.end);
    }

    /**
     * Clone the segment
     * @returns {LineSegment}
     */
    clone() {
        return new LineSegment(this.start, this.end);
    }

    /**
     * Reverse direction
     * @returns {LineSegment}
     */
    reverse() {
        return new LineSegment(this.end, this.start);
    }
}

// ==========================================
// RAY
// ==========================================

/**
 * Ray (infinite line from origin in direction)
 */
export class Ray {
    /**
     * Create a ray
     * @param {Vector2D} origin 
     * @param {Vector2D} direction - Should be normalized
     */
    constructor(origin, direction) {
        this.origin = origin.clone();
        this.direction = direction.normalize();
    }

    /**
     * Get point at distance t from origin
     * @param {number} t 
     * @returns {Vector2D}
     */
    getPoint(t) {
        return this.origin.add(this.direction.multiply(t));
    }

    /**
     * Intersect with bounding box
     * @param {BoundingBox} box 
     * @returns {{intersects: boolean, tMin?: number, tMax?: number}}
     */
    intersectBox(box) {
        let tMin = -Infinity;
        let tMax = Infinity;
        
        // X axis
        if (Math.abs(this.direction.x) < EPSILON) {
            if (this.origin.x < box.minX || this.origin.x > box.maxX) {
                return { intersects: false };
            }
        } else {
            let t1 = (box.minX - this.origin.x) / this.direction.x;
            let t2 = (box.maxX - this.origin.x) / this.direction.x;
            if (t1 > t2) [t1, t2] = [t2, t1];
            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);
        }
        
        // Y axis
        if (Math.abs(this.direction.y) < EPSILON) {
            if (this.origin.y < box.minY || this.origin.y > box.maxY) {
                return { intersects: false };
            }
        } else {
            let t1 = (box.minY - this.origin.y) / this.direction.y;
            let t2 = (box.maxY - this.origin.y) / this.direction.y;
            if (t1 > t2) [t1, t2] = [t2, t1];
            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);
        }
        
        if (tMax < 0 || tMin > tMax) {
            return { intersects: false };
        }
        
        return { intersects: true, tMin: Math.max(0, tMin), tMax };
    }

    /**
     * Intersect with circle
     * @param {Vector2D} center 
     * @param {number} radius 
     * @returns {{intersects: boolean, t1?: number, t2?: number}}
     */
    intersectCircle(center, radius) {
        const oc = this.origin.subtract(center);
        const a = this.direction.dot(this.direction);
        const b = 2 * oc.dot(this.direction);
        const c = oc.dot(oc) - radius * radius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            return { intersects: false };
        }
        
        const sqrtD = Math.sqrt(discriminant);
        const t1 = (-b - sqrtD) / (2 * a);
        const t2 = (-b + sqrtD) / (2 * a);
        
        if (t2 < 0) {
            return { intersects: false };
        }
        
        return {
            intersects: true,
            t1: t1 >= 0 ? t1 : t2,
            t2
        };
    }

    /**
     * Intersect with line segment
     * @param {LineSegment} segment 
     * @returns {{intersects: boolean, t?: number, u?: number, point?: Vector2D}}
     */
    intersectSegment(segment) {
        const v1 = this.origin.subtract(segment.start);
        const v2 = segment.end.subtract(segment.start);
        const v3 = new Vector2D(-this.direction.y, this.direction.x);
        
        const dot = v2.dot(v3);
        if (Math.abs(dot) < EPSILON) {
            return { intersects: false };
        }
        
        const t = v2.cross(v1) / dot;
        const u = v1.dot(v3) / dot;
        
        if (t >= 0 && u >= 0 && u <= 1) {
            return {
                intersects: true,
                t,
                u,
                point: this.getPoint(t)
            };
        }
        
        return { intersects: false };
    }
}

// ==========================================
// POLYGON
// ==========================================

/**
 * Polygon (closed shape defined by vertices)
 */
export class Polygon {
    /**
     * Create a polygon
     * @param {Vector2D[]} vertices 
     */
    constructor(vertices = []) {
        this.vertices = vertices.map(v => v.clone());
    }

    /**
     * Create regular polygon
     * @param {number} sides 
     * @param {Vector2D} center 
     * @param {number} radius 
     * @param {number} [rotation=0] - Starting rotation in radians
     * @returns {Polygon}
     */
    static regular(sides, center, radius, rotation = 0) {
        const vertices = [];
        const angleStep = PI2 / sides;
        for (let i = 0; i < sides; i++) {
            const angle = rotation + i * angleStep - Math.PI / 2;
            vertices.push(new Vector2D(
                center.x + radius * Math.cos(angle),
                center.y + radius * Math.sin(angle)
            ));
        }
        return new Polygon(vertices);
    }

    /**
     * Create rectangle
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @returns {Polygon}
     */
    static rectangle(x, y, width, height) {
        return new Polygon([
            new Vector2D(x, y),
            new Vector2D(x + width, y),
            new Vector2D(x + width, y + height),
            new Vector2D(x, y + height)
        ]);
    }

    /**
     * Create star polygon
     * @param {number} points - Number of points
     * @param {Vector2D} center 
     * @param {number} outerRadius 
     * @param {number} innerRadius 
     * @param {number} [rotation=0] 
     * @returns {Polygon}
     */
    static star(points, center, outerRadius, innerRadius, rotation = 0) {
        const vertices = [];
        const angleStep = Math.PI / points;
        for (let i = 0; i < points * 2; i++) {
            const angle = rotation + i * angleStep - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            vertices.push(new Vector2D(
                center.x + radius * Math.cos(angle),
                center.y + radius * Math.sin(angle)
            ));
        }
        return new Polygon(vertices);
    }

    get vertexCount() {
        return this.vertices.length;
    }

    /**
     * Get edge at index
     * @param {number} index 
     * @returns {LineSegment}
     */
    getEdge(index) {
        const i1 = index % this.vertices.length;
        const i2 = (index + 1) % this.vertices.length;
        return new LineSegment(this.vertices[i1], this.vertices[i2]);
    }

    /**
     * Get all edges
     * @returns {LineSegment[]}
     */
    getEdges() {
        const edges = [];
        for (let i = 0; i < this.vertices.length; i++) {
            edges.push(this.getEdge(i));
        }
        return edges;
    }

    /**
     * Calculate signed area (positive = counter-clockwise)
     * @returns {number}
     */
    signedArea() {
        let area = 0;
        for (let i = 0; i < this.vertices.length; i++) {
            const j = (i + 1) % this.vertices.length;
            area += this.vertices[i].x * this.vertices[j].y;
            area -= this.vertices[j].x * this.vertices[i].y;
        }
        return area / 2;
    }

    /**
     * Calculate area
     * @returns {number}
     */
    area() {
        return Math.abs(this.signedArea());
    }

    /**
     * Calculate perimeter
     * @returns {number}
     */
    perimeter() {
        let perimeter = 0;
        for (let i = 0; i < this.vertices.length; i++) {
            const j = (i + 1) % this.vertices.length;
            perimeter += this.vertices[i].distanceTo(this.vertices[j]);
        }
        return perimeter;
    }

    /**
     * Calculate centroid
     * @returns {Vector2D}
     */
    centroid() {
        const area = this.signedArea();
        if (Math.abs(area) < EPSILON) {
            return Vector2D.average(...this.vertices);
        }
        
        let cx = 0, cy = 0;
        for (let i = 0; i < this.vertices.length; i++) {
            const j = (i + 1) % this.vertices.length;
            const cross = this.vertices[i].x * this.vertices[j].y - 
                          this.vertices[j].x * this.vertices[i].y;
            cx += (this.vertices[i].x + this.vertices[j].x) * cross;
            cy += (this.vertices[i].y + this.vertices[j].y) * cross;
        }
        
        const factor = 1 / (6 * area);
        return new Vector2D(cx * factor, cy * factor);
    }

    /**
     * Check if polygon is convex
     * @returns {boolean}
     */
    isConvex() {
        if (this.vertices.length < 3) return false;
        
        let sign = 0;
        for (let i = 0; i < this.vertices.length; i++) {
            const j = (i + 1) % this.vertices.length;
            const k = (i + 2) % this.vertices.length;
            
            const cross = this.vertices[j].subtract(this.vertices[i])
                .cross(this.vertices[k].subtract(this.vertices[j]));
            
            if (Math.abs(cross) > EPSILON) {
                if (sign === 0) {
                    sign = cross > 0 ? 1 : -1;
                } else if ((cross > 0 ? 1 : -1) !== sign) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Check if polygon is clockwise
     * @returns {boolean}
     */
    isClockwise() {
        return this.signedArea() < 0;
    }

    /**
     * Ensure counter-clockwise winding
     * @returns {Polygon}
     */
    ensureCCW() {
        if (this.isClockwise()) {
            return this.reverse();
        }
        return this;
    }

    /**
     * Check if point is inside polygon (ray casting algorithm)
     * @param {Vector2D} point 
     * @returns {boolean}
     */
    containsPoint(point) {
        let inside = false;
        
        for (let i = 0, j = this.vertices.length - 1; i < this.vertices.length; j = i++) {
            const xi = this.vertices[i].x, yi = this.vertices[i].y;
            const xj = this.vertices[j].x, yj = this.vertices[j].y;
            
            if (((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    /**
     * Check if point is on edge
     * @param {Vector2D} point 
     * @param {number} [tolerance=EPSILON] 
     * @returns {boolean}
     */
    pointOnEdge(point, tolerance = EPSILON) {
        for (const edge of this.getEdges()) {
            if (edge.distanceToPoint(point) < tolerance) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get bounding box
     * @returns {BoundingBox}
     */
    getBoundingBox() {
        return BoundingBox.fromPoints(this.vertices);
    }

    /**
     * Get nearest point on polygon boundary
     * @param {Vector2D} point 
     * @returns {{point: Vector2D, distance: number, edgeIndex: number}}
     */
    nearestPoint(point) {
        let minDist = Infinity;
        let nearest = null;
        let edgeIndex = -1;
        
        for (let i = 0; i < this.vertices.length; i++) {
            const edge = this.getEdge(i);
            const result = edge.nearestPoint(point);
            if (result.distance < minDist) {
                minDist = result.distance;
                nearest = result.point;
                edgeIndex = i;
            }
        }
        
        return { point: nearest, distance: minDist, edgeIndex };
    }

    /**
     * Check intersection with another polygon
     * @param {Polygon} other 
     * @returns {boolean}
     */
    intersects(other) {
        // SAT (Separating Axis Theorem) for convex polygons
        // For non-convex, we check edge intersections
        
        const edges1 = this.getEdges();
        const edges2 = other.getEdges();
        
        // Check if any edges intersect
        for (const e1 of edges1) {
            for (const e2 of edges2) {
                if (e1.intersects(e2)) {
                    return true;
                }
            }
        }
        
        // Check if one polygon is inside the other
        if (this.containsPoint(other.vertices[0]) || 
            other.containsPoint(this.vertices[0])) {
            return true;
        }
        
        return false;
    }

    /**
     * Offset polygon (expand/contract)
     * @param {number} distance - Positive = expand, negative = contract
     * @returns {Polygon}
     */
    offset(distance) {
        const newVertices = [];
        
        for (let i = 0; i < this.vertices.length; i++) {
            const prev = (i - 1 + this.vertices.length) % this.vertices.length;
            const next = (i + 1) % this.vertices.length;
            
            const e1 = this.vertices[i].subtract(this.vertices[prev]).normalize();
            const e2 = this.vertices[next].subtract(this.vertices[i]).normalize();
            
            const n1 = new Vector2D(-e1.y, e1.x);
            const n2 = new Vector2D(-e2.y, e2.x);
            
            const bisector = n1.add(n2).normalize();
            const dot = n1.dot(bisector);
            
            if (Math.abs(dot) < EPSILON) {
                newVertices.push(this.vertices[i].add(n1.multiply(distance)));
            } else {
                newVertices.push(this.vertices[i].add(bisector.multiply(distance / dot)));
            }
        }
        
        return new Polygon(newVertices);
    }

    /**
     * Simplify polygon (Douglas-Peucker algorithm)
     * @param {number} tolerance 
     * @returns {Polygon}
     */
    simplify(tolerance) {
        if (this.vertices.length < 4) return this.clone();
        
        const simplified = douglasPeucker(this.vertices, tolerance, true);
        return new Polygon(simplified);
    }

    /**
     * Clone the polygon
     * @returns {Polygon}
     */
    clone() {
        return new Polygon(this.vertices);
    }

    /**
     * Reverse vertex order
     * @returns {Polygon}
     */
    reverse() {
        return new Polygon([...this.vertices].reverse());
    }

    /**
     * Translate polygon
     * @param {Vector2D} offset 
     * @returns {Polygon}
     */
    translate(offset) {
        return new Polygon(this.vertices.map(v => v.add(offset)));
    }

    /**
     * Rotate polygon around a point
     * @param {number} angle - Angle in radians
     * @param {Vector2D} [center] - Rotation center (defaults to centroid)
     * @returns {Polygon}
     */
    rotate(angle, center) {
        center = center || this.centroid();
        return new Polygon(this.vertices.map(v => v.rotateAround(center, angle)));
    }

    /**
     * Scale polygon from a point
     * @param {number} sx 
     * @param {number} sy 
     * @param {Vector2D} [center] - Scale center (defaults to centroid)
     * @returns {Polygon}
     */
    scale(sx, sy = sx, center) {
        center = center || this.centroid();
        return new Polygon(this.vertices.map(v => {
            const diff = v.subtract(center);
            return center.add(new Vector2D(diff.x * sx, diff.y * sy));
        }));
    }
}

// ==========================================
// CIRCLE
// ==========================================

/**
 * Circle primitive
 */
export class Circle {
    /**
     * Create a circle
     * @param {Vector2D} center 
     * @param {number} radius 
     */
    constructor(center, radius) {
        this.center = center.clone();
        this.radius = radius;
    }

    get area() {
        return Math.PI * this.radius * this.radius;
    }

    get circumference() {
        return 2 * Math.PI * this.radius;
    }

    get diameter() {
        return 2 * this.radius;
    }

    /**
     * Get point on circle at angle
     * @param {number} angle - Angle in radians
     * @returns {Vector2D}
     */
    getPoint(angle) {
        return new Vector2D(
            this.center.x + this.radius * Math.cos(angle),
            this.center.y + this.radius * Math.sin(angle)
        );
    }

    /**
     * Check if point is inside circle
     * @param {Vector2D} point 
     * @returns {boolean}
     */
    containsPoint(point) {
        return this.center.distanceToSquared(point) <= this.radius * this.radius;
    }

    /**
     * Check if point is on circle edge
     * @param {Vector2D} point 
     * @param {number} [tolerance=EPSILON] 
     * @returns {boolean}
     */
    pointOnEdge(point, tolerance = EPSILON) {
        return Math.abs(this.center.distanceTo(point) - this.radius) < tolerance;
    }

    /**
     * Get bounding box
     * @returns {BoundingBox}
     */
    getBoundingBox() {
        return new BoundingBox(
            this.center.x - this.radius,
            this.center.y - this.radius,
            this.center.x + this.radius,
            this.center.y + this.radius
        );
    }

    /**
     * Check intersection with another circle
     * @param {Circle} other 
     * @returns {boolean}
     */
    intersectsCircle(other) {
        const dist = this.center.distanceTo(other.center);
        return dist <= this.radius + other.radius;
    }

    /**
     * Get intersection points with another circle
     * @param {Circle} other 
     * @returns {Vector2D[]}
     */
    intersectCircle(other) {
        const d = this.center.distanceTo(other.center);
        const r1 = this.radius;
        const r2 = other.radius;
        
        // No intersection
        if (d > r1 + r2 || d < Math.abs(r1 - r2)) {
            return [];
        }
        
        // Coincident circles
        if (d < EPSILON && Math.abs(r1 - r2) < EPSILON) {
            return [];
        }
        
        const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
        const h2 = r1 * r1 - a * a;
        
        if (h2 < 0) return [];
        
        const h = Math.sqrt(h2);
        const direction = other.center.subtract(this.center).normalize();
        const perp = direction.perpendicular();
        const midpoint = this.center.add(direction.multiply(a));
        
        if (h < EPSILON) {
            return [midpoint];
        }
        
        return [
            midpoint.add(perp.multiply(h)),
            midpoint.subtract(perp.multiply(h))
        ];
    }

    /**
     * Get intersection points with a line segment
     * @param {LineSegment} segment 
     * @returns {Vector2D[]}
     */
    intersectSegment(segment) {
        const d = segment.end.subtract(segment.start);
        const f = segment.start.subtract(this.center);
        
        const a = d.dot(d);
        const b = 2 * f.dot(d);
        const c = f.dot(f) - this.radius * this.radius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) return [];
        
        const sqrtD = Math.sqrt(discriminant);
        const t1 = (-b - sqrtD) / (2 * a);
        const t2 = (-b + sqrtD) / (2 * a);
        
        const points = [];
        if (t1 >= 0 && t1 <= 1) points.push(segment.getPoint(t1));
        if (t2 >= 0 && t2 <= 1 && Math.abs(t1 - t2) > EPSILON) {
            points.push(segment.getPoint(t2));
        }
        
        return points;
    }

    /**
     * Get nearest point on circle to a given point
     * @param {Vector2D} point 
     * @returns {Vector2D}
     */
    nearestPoint(point) {
        const direction = point.subtract(this.center).normalize();
        return this.center.add(direction.multiply(this.radius));
    }

    /**
     * Clone the circle
     * @returns {Circle}
     */
    clone() {
        return new Circle(this.center, this.radius);
    }

    /**
     * Convert to polygon approximation
     * @param {number} [segments=32] 
     * @returns {Polygon}
     */
    toPolygon(segments = 32) {
        const vertices = [];
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * PI2;
            vertices.push(this.getPoint(angle));
        }
        return new Polygon(vertices);
    }
}

// ==========================================
// ELLIPSE
// ==========================================

/**
 * Ellipse primitive
 */
export class Ellipse {
    /**
     * Create an ellipse
     * @param {Vector2D} center 
     * @param {number} rx - X radius
     * @param {number} ry - Y radius
     * @param {number} [rotation=0] - Rotation angle in radians
     */
    constructor(center, rx, ry, rotation = 0) {
        this.center = center.clone();
        this.rx = rx;
        this.ry = ry;
        this.rotation = rotation;
    }

    get area() {
        return Math.PI * this.rx * this.ry;
    }

    /**
     * Approximate circumference
     * @returns {number}
     */
    get circumference() {
        // Ramanujan approximation
        const a = this.rx, b = this.ry;
        const h = ((a - b) * (a - b)) / ((a + b) * (a + b));
        return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    }

    /**
     * Get point on ellipse at angle
     * @param {number} angle - Angle in radians
     * @returns {Vector2D}
     */
    getPoint(angle) {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const x = this.rx * Math.cos(angle);
        const y = this.ry * Math.sin(angle);
        
        return new Vector2D(
            this.center.x + x * cos - y * sin,
            this.center.y + x * sin + y * cos
        );
    }

    /**
     * Check if point is inside ellipse
     * @param {Vector2D} point 
     * @returns {boolean}
     */
    containsPoint(point) {
        // Transform point to ellipse local space
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        const dx = point.x - this.center.x;
        const dy = point.y - this.center.y;
        
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        return (localX * localX) / (this.rx * this.rx) + 
               (localY * localY) / (this.ry * this.ry) <= 1;
    }

    /**
     * Get bounding box
     * @returns {BoundingBox}
     */
    getBoundingBox() {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        
        const ux = this.rx * cos;
        const uy = this.rx * sin;
        const vx = this.ry * -sin;
        const vy = this.ry * cos;
        
        const halfWidth = Math.sqrt(ux * ux + vx * vx);
        const halfHeight = Math.sqrt(uy * uy + vy * vy);
        
        return new BoundingBox(
            this.center.x - halfWidth,
            this.center.y - halfHeight,
            this.center.x + halfWidth,
            this.center.y + halfHeight
        );
    }

    /**
     * Clone the ellipse
     * @returns {Ellipse}
     */
    clone() {
        return new Ellipse(this.center, this.rx, this.ry, this.rotation);
    }

    /**
     * Convert to polygon approximation
     * @param {number} [segments=32] 
     * @returns {Polygon}
     */
    toPolygon(segments = 32) {
        const vertices = [];
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * PI2;
            vertices.push(this.getPoint(angle));
        }
        return new Polygon(vertices);
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Douglas-Peucker line simplification algorithm
 * @param {Vector2D[]} points 
 * @param {number} tolerance 
 * @param {boolean} [closed=false] 
 * @returns {Vector2D[]}
 */
export function douglasPeucker(points, tolerance, closed = false) {
    if (points.length < 3) return points;
    
    // Find the point with the maximum distance from the line
    let maxDist = 0;
    let maxIndex = 0;
    
    const first = points[0];
    const last = points[points.length - 1];
    const segment = new LineSegment(first, last);
    
    for (let i = 1; i < points.length - 1; i++) {
        const dist = segment.distanceToPoint(points[i]);
        if (dist > maxDist) {
            maxDist = dist;
            maxIndex = i;
        }
    }
    
    // If max distance exceeds tolerance, recursively simplify
    if (maxDist > tolerance) {
        const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance, false);
        const right = douglasPeucker(points.slice(maxIndex), tolerance, false);
        
        // Concatenate results (avoiding duplicate point)
        return left.slice(0, -1).concat(right);
    }
    
    // All points within tolerance, return endpoints
    return [first, last];
}

/**
 * Calculate convex hull using Graham scan
 * @param {Vector2D[]} points 
 * @returns {Polygon}
 */
export function convexHull(points) {
    if (points.length < 3) {
        return new Polygon(points);
    }
    
    // Find the lowest point (and leftmost if tie)
    let start = 0;
    for (let i = 1; i < points.length; i++) {
        if (points[i].y < points[start].y || 
            (points[i].y === points[start].y && points[i].x < points[start].x)) {
            start = i;
        }
    }
    
    // Swap to first position
    [points[0], points[start]] = [points[start], points[0]];
    const pivot = points[0];
    
    // Sort by polar angle
    const sorted = points.slice(1).sort((a, b) => {
        const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
        const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
        if (Math.abs(angleA - angleB) < EPSILON) {
            return pivot.distanceToSquared(a) - pivot.distanceToSquared(b);
        }
        return angleA - angleB;
    });
    
    // Graham scan
    const hull = [pivot, sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
        while (hull.length > 1) {
            const top = hull[hull.length - 1];
            const second = hull[hull.length - 2];
            const cross = top.subtract(second).cross(sorted[i].subtract(second));
            if (cross > 0) break;
            hull.pop();
        }
        hull.push(sorted[i]);
    }
    
    return new Polygon(hull);
}

/**
 * Check if three points are collinear
 * @param {Vector2D} a 
 * @param {Vector2D} b 
 * @param {Vector2D} c 
 * @param {number} [tolerance=EPSILON] 
 * @returns {boolean}
 */
export function areCollinear(a, b, c, tolerance = EPSILON) {
    const cross = b.subtract(a).cross(c.subtract(a));
    return Math.abs(cross) < tolerance;
}

/**
 * Calculate winding number of a point relative to a polygon
 * @param {Vector2D} point 
 * @param {Polygon} polygon 
 * @returns {number}
 */
export function windingNumber(point, polygon) {
    let winding = 0;
    const vertices = polygon.vertices;
    
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        
        if (vertices[i].y <= point.y) {
            if (vertices[j].y > point.y) {
                const cross = vertices[j].subtract(vertices[i])
                    .cross(point.subtract(vertices[i]));
                if (cross > 0) winding++;
            }
        } else {
            if (vertices[j].y <= point.y) {
                const cross = vertices[j].subtract(vertices[i])
                    .cross(point.subtract(vertices[i]));
                if (cross < 0) winding--;
            }
        }
    }
    
    return winding;
}

/**
 * Calculate the minimum distance between two polygons
 * @param {Polygon} poly1 
 * @param {Polygon} poly2 
 * @returns {number}
 */
export function polygonDistance(poly1, poly2) {
    let minDist = Infinity;
    
    // Check all vertex-to-edge distances
    for (const v of poly1.vertices) {
        const { distance } = poly2.nearestPoint(v);
        minDist = Math.min(minDist, distance);
    }
    
    for (const v of poly2.vertices) {
        const { distance } = poly1.nearestPoint(v);
        minDist = Math.min(minDist, distance);
    }
    
    // Check if polygons intersect
    if (poly1.intersects(poly2)) {
        return 0;
    }
    
    return minDist;
}

// ==========================================
// GEOMETRY UTILITY CLASS
// ==========================================

/**
 * Geometry - Static utility methods for geometric calculations
 */
export class Geometry {
    /**
     * Check if two bounding boxes intersect
     * @param {{ minX: number, minY: number, maxX: number, maxY: number }} bounds1
     * @param {{ minX: number, minY: number, maxX: number, maxY: number }} bounds2
     * @returns {boolean}
     */
    static boundsIntersect(bounds1, bounds2) {
        return bounds1.minX <= bounds2.maxX &&
               bounds1.maxX >= bounds2.minX &&
               bounds1.minY <= bounds2.maxY &&
               bounds1.maxY >= bounds2.minY;
    }

    /**
     * Calculate the minimum distance from a point to a line segment
     * @param {{ x: number, y: number }} point
     * @param {{ x: number, y: number }} lineStart
     * @param {{ x: number, y: number }} lineEnd
     * @returns {number}
     */
    static pointToLineDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const lengthSq = dx * dx + dy * dy;
        
        if (lengthSq === 0) {
            // Line segment is a point
            const pdx = point.x - lineStart.x;
            const pdy = point.y - lineStart.y;
            return Math.sqrt(pdx * pdx + pdy * pdy);
        }
        
        // Project point onto line segment
        let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));
        
        const projX = lineStart.x + t * dx;
        const projY = lineStart.y + t * dy;
        const distX = point.x - projX;
        const distY = point.y - projY;
        
        return Math.sqrt(distX * distX + distY * distY);
    }

    /**
     * Calculate the nearest point on a line segment to a given point
     * @param {{ x: number, y: number }} point
     * @param {{ x: number, y: number }} lineStart
     * @param {{ x: number, y: number }} lineEnd
     * @returns {{ x: number, y: number, t: number }}
     */
    static nearestPointOnLine(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const lengthSq = dx * dx + dy * dy;
        
        if (lengthSq === 0) {
            return { x: lineStart.x, y: lineStart.y, t: 0 };
        }
        
        let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));
        
        return {
            x: lineStart.x + t * dx,
            y: lineStart.y + t * dy,
            t
        };
    }

    /**
     * Check if a point is inside a rectangle
     * @param {{ x: number, y: number }} point
     * @param {number} minX
     * @param {number} minY
     * @param {number} maxX
     * @param {number} maxY
     * @returns {boolean}
     */
    static pointInRect(point, minX, minY, maxX, maxY) {
        return point.x >= minX && point.x <= maxX &&
               point.y >= minY && point.y <= maxY;
    }

    /**
     * Check if two line segments intersect
     * @param {{ x: number, y: number }} p1 - Start of first segment
     * @param {{ x: number, y: number }} p2 - End of first segment
     * @param {{ x: number, y: number }} p3 - Start of second segment
     * @param {{ x: number, y: number }} p4 - End of second segment
     * @returns {{ intersects: boolean, point?: { x: number, y: number } }}
     */
    static lineIntersection(p1, p2, p3, p4) {
        const d1x = p2.x - p1.x;
        const d1y = p2.y - p1.y;
        const d2x = p4.x - p3.x;
        const d2y = p4.y - p3.y;
        
        const cross = d1x * d2y - d1y * d2x;
        
        if (Math.abs(cross) < EPSILON) {
            return { intersects: false };
        }
        
        const dx = p3.x - p1.x;
        const dy = p3.y - p1.y;
        
        const t = (dx * d2y - dy * d2x) / cross;
        const u = (dx * d1y - dy * d1x) / cross;
        
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                intersects: true,
                point: {
                    x: p1.x + t * d1x,
                    y: p1.y + t * d1y
                }
            };
        }
        
        return { intersects: false };
    }

    /**
     * Calculate distance between two points
     * @param {{ x: number, y: number }} p1
     * @param {{ x: number, y: number }} p2
     * @returns {number}
     */
    static distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate squared distance between two points (faster, no sqrt)
     * @param {{ x: number, y: number }} p1
     * @param {{ x: number, y: number }} p2
     * @returns {number}
     */
    static distanceSq(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return dx * dx + dy * dy;
    }
}

export default {
    BoundingBox,
    LineSegment,
    Ray,
    Polygon,
    Circle,
    Ellipse,
    Geometry,
    douglasPeucker,
    convexHull,
    areCollinear,
    windingNumber,
    polygonDistance
};
