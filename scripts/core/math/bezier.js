/**
 * Asciistrator - Bezier Curves Module
 * 
 * Comprehensive bezier curve calculations including:
 * - Quadratic and cubic bezier curves
 * - Curve evaluation, derivatives, normals
 * - Subdivision algorithms
 * - Arc length calculations
 * - Bounding box calculations
 * - Curve fitting
 */

import { Vector2D } from './vector2d.js';

/**
 * Quadratic Bezier Curve (3 control points)
 */
export class QuadraticBezier {
    /**
     * Create a quadratic bezier curve
     * @param {Vector2D} p0 - Start point
     * @param {Vector2D} p1 - Control point
     * @param {Vector2D} p2 - End point
     */
    constructor(p0, p1, p2) {
        this.p0 = p0.clone();
        this.p1 = p1.clone();
        this.p2 = p2.clone();
    }

    /**
     * Get a point on the curve at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {Vector2D}
     */
    getPoint(t) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;
        
        return new Vector2D(
            mt2 * this.p0.x + 2 * mt * t * this.p1.x + t2 * this.p2.x,
            mt2 * this.p0.y + 2 * mt * t * this.p1.y + t2 * this.p2.y
        );
    }

    /**
     * Get the derivative (tangent) at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {Vector2D}
     */
    getDerivative(t) {
        const mt = 1 - t;
        return new Vector2D(
            2 * mt * (this.p1.x - this.p0.x) + 2 * t * (this.p2.x - this.p1.x),
            2 * mt * (this.p1.y - this.p0.y) + 2 * t * (this.p2.y - this.p1.y)
        );
    }

    /**
     * Get the tangent vector (normalized) at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {Vector2D}
     */
    getTangent(t) {
        return this.getDerivative(t).normalize();
    }

    /**
     * Get the normal vector at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {Vector2D}
     */
    getNormal(t) {
        const tangent = this.getTangent(t);
        return new Vector2D(-tangent.y, tangent.x);
    }

    /**
     * Get the second derivative
     * @returns {Vector2D}
     */
    getSecondDerivative() {
        return new Vector2D(
            2 * (this.p2.x - 2 * this.p1.x + this.p0.x),
            2 * (this.p2.y - 2 * this.p1.y + this.p0.y)
        );
    }

    /**
     * Calculate curvature at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {number}
     */
    getCurvature(t) {
        const d1 = this.getDerivative(t);
        const d2 = this.getSecondDerivative();
        const cross = d1.x * d2.y - d1.y * d2.x;
        const len = d1.length();
        if (len < 1e-10) return 0;
        return cross / (len * len * len);
    }

    /**
     * Split the curve at parameter t
     * @param {number} t - Split point (0-1)
     * @returns {[QuadraticBezier, QuadraticBezier]}
     */
    split(t) {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);
        const p012 = p01.lerp(p12, t);
        
        return [
            new QuadraticBezier(this.p0, p01, p012),
            new QuadraticBezier(p012, p12, this.p2)
        ];
    }

    /**
     * Get the bounding box of the curve
     * @returns {{min: Vector2D, max: Vector2D}}
     */
    getBoundingBox() {
        const points = [this.p0, this.p2];
        
        // Find extrema for X
        const ax = this.p0.x - 2 * this.p1.x + this.p2.x;
        const bx = 2 * (this.p1.x - this.p0.x);
        if (Math.abs(ax) > 1e-10) {
            const tx = -bx / (2 * ax);
            if (tx > 0 && tx < 1) {
                points.push(this.getPoint(tx));
            }
        }
        
        // Find extrema for Y
        const ay = this.p0.y - 2 * this.p1.y + this.p2.y;
        const by = 2 * (this.p1.y - this.p0.y);
        if (Math.abs(ay) > 1e-10) {
            const ty = -by / (2 * ay);
            if (ty > 0 && ty < 1) {
                points.push(this.getPoint(ty));
            }
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        
        return {
            min: new Vector2D(minX, minY),
            max: new Vector2D(maxX, maxY)
        };
    }

    /**
     * Calculate approximate arc length using adaptive subdivision
     * @param {number} [tolerance=0.1] - Subdivision tolerance
     * @returns {number}
     */
    getLength(tolerance = 0.1) {
        return this._getLengthRecursive(0, 1, tolerance);
    }

    _getLengthRecursive(t0, t1, tolerance) {
        const p0 = this.getPoint(t0);
        const p1 = this.getPoint(t1);
        const mid = (t0 + t1) / 2;
        const pMid = this.getPoint(mid);
        
        const directDist = p0.distanceTo(p1);
        const subdivDist = p0.distanceTo(pMid) + pMid.distanceTo(p1);
        
        if (Math.abs(subdivDist - directDist) < tolerance) {
            return subdivDist;
        }
        
        return this._getLengthRecursive(t0, mid, tolerance) + 
               this._getLengthRecursive(mid, t1, tolerance);
    }

    /**
     * Get evenly spaced points along the curve
     * @param {number} count - Number of points
     * @returns {Vector2D[]}
     */
    getEvenlySpacedPoints(count) {
        const points = [];
        for (let i = 0; i <= count; i++) {
            points.push(this.getPoint(i / count));
        }
        return points;
    }

    /**
     * Find the nearest point on the curve to a given point
     * @param {Vector2D} point 
     * @param {number} [samples=50] 
     * @returns {{point: Vector2D, t: number, distance: number}}
     */
    nearestPoint(point, samples = 50) {
        let minDist = Infinity;
        let nearestT = 0;
        
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const p = this.getPoint(t);
            const dist = p.distanceTo(point);
            if (dist < minDist) {
                minDist = dist;
                nearestT = t;
            }
        }
        
        // Refine with Newton-Raphson
        for (let i = 0; i < 5; i++) {
            const p = this.getPoint(nearestT);
            const d = this.getDerivative(nearestT);
            const d2 = this.getSecondDerivative();
            
            const diff = p.subtract(point);
            const numerator = diff.dot(d);
            const denominator = d.dot(d) + diff.dot(d2);
            
            if (Math.abs(denominator) < 1e-10) break;
            
            nearestT -= numerator / denominator;
            nearestT = Math.max(0, Math.min(1, nearestT));
        }
        
        const nearestPoint = this.getPoint(nearestT);
        return {
            point: nearestPoint,
            t: nearestT,
            distance: nearestPoint.distanceTo(point)
        };
    }

    /**
     * Elevate to cubic bezier
     * @returns {CubicBezier}
     */
    toCubic() {
        // Degree elevation: quadratic to cubic
        const cp1 = new Vector2D(
            this.p0.x + (2 / 3) * (this.p1.x - this.p0.x),
            this.p0.y + (2 / 3) * (this.p1.y - this.p0.y)
        );
        const cp2 = new Vector2D(
            this.p2.x + (2 / 3) * (this.p1.x - this.p2.x),
            this.p2.y + (2 / 3) * (this.p1.y - this.p2.y)
        );
        return new CubicBezier(this.p0, cp1, cp2, this.p2);
    }

    /**
     * Clone the curve
     * @returns {QuadraticBezier}
     */
    clone() {
        return new QuadraticBezier(this.p0, this.p1, this.p2);
    }
}

/**
 * Cubic Bezier Curve (4 control points)
 */
export class CubicBezier {
    /**
     * Create a cubic bezier curve
     * @param {Vector2D} p0 - Start point
     * @param {Vector2D} p1 - First control point
     * @param {Vector2D} p2 - Second control point
     * @param {Vector2D} p3 - End point
     */
    constructor(p0, p1, p2, p3) {
        this.p0 = p0.clone();
        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.p3 = p3.clone();
    }

    /**
     * Get a point on the curve at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {Vector2D}
     */
    getPoint(t) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        
        return new Vector2D(
            mt3 * this.p0.x + 3 * mt2 * t * this.p1.x + 3 * mt * t2 * this.p2.x + t3 * this.p3.x,
            mt3 * this.p0.y + 3 * mt2 * t * this.p1.y + 3 * mt * t2 * this.p2.y + t3 * this.p3.y
        );
    }

    /**
     * Get the first derivative at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {Vector2D}
     */
    getDerivative(t) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;
        
        return new Vector2D(
            3 * mt2 * (this.p1.x - this.p0.x) + 
            6 * mt * t * (this.p2.x - this.p1.x) + 
            3 * t2 * (this.p3.x - this.p2.x),
            3 * mt2 * (this.p1.y - this.p0.y) + 
            6 * mt * t * (this.p2.y - this.p1.y) + 
            3 * t2 * (this.p3.y - this.p2.y)
        );
    }

    /**
     * Get the second derivative at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {Vector2D}
     */
    getSecondDerivative(t) {
        const mt = 1 - t;
        
        return new Vector2D(
            6 * mt * (this.p2.x - 2 * this.p1.x + this.p0.x) + 
            6 * t * (this.p3.x - 2 * this.p2.x + this.p1.x),
            6 * mt * (this.p2.y - 2 * this.p1.y + this.p0.y) + 
            6 * t * (this.p3.y - 2 * this.p2.y + this.p1.y)
        );
    }

    /**
     * Get the tangent vector (normalized) at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {Vector2D}
     */
    getTangent(t) {
        return this.getDerivative(t).normalize();
    }

    /**
     * Get the normal vector at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {Vector2D}
     */
    getNormal(t) {
        const tangent = this.getTangent(t);
        return new Vector2D(-tangent.y, tangent.x);
    }

    /**
     * Calculate curvature at parameter t
     * @param {number} t - Parameter (0-1)
     * @returns {number}
     */
    getCurvature(t) {
        const d1 = this.getDerivative(t);
        const d2 = this.getSecondDerivative(t);
        const cross = d1.x * d2.y - d1.y * d2.x;
        const len = d1.length();
        if (len < 1e-10) return 0;
        return cross / (len * len * len);
    }

    /**
     * Split the curve at parameter t (de Casteljau's algorithm)
     * @param {number} t - Split point (0-1)
     * @returns {[CubicBezier, CubicBezier]}
     */
    split(t) {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);
        const p23 = this.p2.lerp(this.p3, t);
        
        const p012 = p01.lerp(p12, t);
        const p123 = p12.lerp(p23, t);
        
        const p0123 = p012.lerp(p123, t);
        
        return [
            new CubicBezier(this.p0, p01, p012, p0123),
            new CubicBezier(p0123, p123, p23, this.p3)
        ];
    }

    /**
     * Subdivide the curve into multiple segments
     * @param {number} n - Number of subdivisions
     * @returns {CubicBezier[]}
     */
    subdivide(n) {
        if (n <= 1) return [this.clone()];
        
        const curves = [];
        let remaining = this;
        
        for (let i = 0; i < n - 1; i++) {
            const t = 1 / (n - i);
            const [left, right] = remaining.split(t);
            curves.push(left);
            remaining = right;
        }
        curves.push(remaining);
        
        return curves;
    }

    /**
     * Get the bounding box of the curve
     * @returns {{min: Vector2D, max: Vector2D}}
     */
    getBoundingBox() {
        const points = [this.p0, this.p3];
        
        // Find extrema for X and Y by solving derivative = 0
        // For cubic bezier: at² + bt + c = 0
        
        // X extrema
        const ax = -this.p0.x + 3 * this.p1.x - 3 * this.p2.x + this.p3.x;
        const bx = 2 * (this.p0.x - 2 * this.p1.x + this.p2.x);
        const cx = -this.p0.x + this.p1.x;
        
        const xRoots = solveQuadratic(ax, bx, cx);
        for (const t of xRoots) {
            if (t > 0 && t < 1) {
                points.push(this.getPoint(t));
            }
        }
        
        // Y extrema
        const ay = -this.p0.y + 3 * this.p1.y - 3 * this.p2.y + this.p3.y;
        const by = 2 * (this.p0.y - 2 * this.p1.y + this.p2.y);
        const cy = -this.p0.y + this.p1.y;
        
        const yRoots = solveQuadratic(ay, by, cy);
        for (const t of yRoots) {
            if (t > 0 && t < 1) {
                points.push(this.getPoint(t));
            }
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        
        return {
            min: new Vector2D(minX, minY),
            max: new Vector2D(maxX, maxY)
        };
    }

    /**
     * Calculate approximate arc length using Gaussian quadrature
     * @param {number} [tolerance=0.001] - Tolerance for adaptive subdivision
     * @returns {number}
     */
    getLength(tolerance = 0.001) {
        return this._getLengthRecursive(0, 1, tolerance);
    }

    _getLengthRecursive(t0, t1, tolerance) {
        const p0 = this.getPoint(t0);
        const p1 = this.getPoint(t1);
        const mid = (t0 + t1) / 2;
        const pMid = this.getPoint(mid);
        
        const directDist = p0.distanceTo(p1);
        const subdivDist = p0.distanceTo(pMid) + pMid.distanceTo(p1);
        
        if (Math.abs(subdivDist - directDist) < tolerance) {
            return subdivDist;
        }
        
        return this._getLengthRecursive(t0, mid, tolerance) + 
               this._getLengthRecursive(mid, t1, tolerance);
    }

    /**
     * Get the parameter t for a given arc length
     * @param {number} length - Target arc length
     * @param {number} [tolerance=0.001] 
     * @returns {number}
     */
    getParameterAtLength(length, tolerance = 0.001) {
        const totalLength = this.getLength(tolerance);
        if (length <= 0) return 0;
        if (length >= totalLength) return 1;
        
        // Binary search for parameter
        let low = 0, high = 1;
        while (high - low > tolerance) {
            const mid = (low + high) / 2;
            const len = this._getLengthRecursive(0, mid, tolerance);
            if (len < length) {
                low = mid;
            } else {
                high = mid;
            }
        }
        return (low + high) / 2;
    }

    /**
     * Get evenly spaced points along the curve by arc length
     * @param {number} count - Number of segments
     * @returns {Vector2D[]}
     */
    getEvenlySpacedPoints(count) {
        const totalLength = this.getLength();
        const segmentLength = totalLength / count;
        const points = [this.p0.clone()];
        
        for (let i = 1; i < count; i++) {
            const t = this.getParameterAtLength(i * segmentLength);
            points.push(this.getPoint(t));
        }
        points.push(this.p3.clone());
        
        return points;
    }

    /**
     * Find the nearest point on the curve to a given point
     * @param {Vector2D} point 
     * @param {number} [samples=50] 
     * @returns {{point: Vector2D, t: number, distance: number}}
     */
    nearestPoint(point, samples = 50) {
        let minDist = Infinity;
        let nearestT = 0;
        
        // Initial sampling
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const p = this.getPoint(t);
            const dist = p.distanceTo(point);
            if (dist < minDist) {
                minDist = dist;
                nearestT = t;
            }
        }
        
        // Refine with Newton-Raphson
        for (let i = 0; i < 10; i++) {
            const p = this.getPoint(nearestT);
            const d1 = this.getDerivative(nearestT);
            const d2 = this.getSecondDerivative(nearestT);
            
            const diff = p.subtract(point);
            const numerator = diff.dot(d1);
            const denominator = d1.dot(d1) + diff.dot(d2);
            
            if (Math.abs(denominator) < 1e-10) break;
            
            const dt = numerator / denominator;
            nearestT -= dt;
            nearestT = Math.max(0, Math.min(1, nearestT));
            
            if (Math.abs(dt) < 1e-6) break;
        }
        
        const nearestPoint = this.getPoint(nearestT);
        return {
            point: nearestPoint,
            t: nearestT,
            distance: nearestPoint.distanceTo(point)
        };
    }

    /**
     * Offset the curve by a distance (approximate)
     * @param {number} distance - Offset distance (positive = left, negative = right)
     * @param {number} [segments=20] - Number of segments for approximation
     * @returns {CubicBezier[]}
     */
    offset(distance, segments = 20) {
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const p = this.getPoint(t);
            const n = this.getNormal(t);
            points.push(p.add(n.multiply(distance)));
        }
        
        // Fit cubic beziers through the offset points
        return fitCubicBeziers(points, 1);
    }

    /**
     * Flatten curve to line segments
     * @param {number} [tolerance=0.5] - Maximum deviation from curve
     * @returns {Vector2D[]}
     */
    flatten(tolerance = 0.5) {
        const points = [this.p0.clone()];
        this._flattenRecursive(0, 1, tolerance, points);
        return points;
    }

    _flattenRecursive(t0, t1, tolerance, points) {
        const mid = (t0 + t1) / 2;
        const p0 = this.getPoint(t0);
        const p1 = this.getPoint(t1);
        const pMid = this.getPoint(mid);
        
        // Check if midpoint is close to the line between endpoints
        const line = p1.subtract(p0);
        const lineLen = line.length();
        if (lineLen < 1e-10) {
            points.push(p1.clone());
            return;
        }
        
        const toMid = pMid.subtract(p0);
        const proj = toMid.project(line);
        const deviation = toMid.subtract(proj).length();
        
        if (deviation < tolerance) {
            points.push(p1.clone());
        } else {
            this._flattenRecursive(t0, mid, tolerance, points);
            this._flattenRecursive(mid, t1, tolerance, points);
        }
    }

    /**
     * Check if curve is approximately a straight line
     * @param {number} [tolerance=0.01] 
     * @returns {boolean}
     */
    isStraight(tolerance = 0.01) {
        const line = this.p3.subtract(this.p0);
        const d1 = this.p1.subtract(this.p0).reject(line).length();
        const d2 = this.p2.subtract(this.p0).reject(line).length();
        return d1 < tolerance && d2 < tolerance;
    }

    /**
     * Clone the curve
     * @returns {CubicBezier}
     */
    clone() {
        return new CubicBezier(this.p0, this.p1, this.p2, this.p3);
    }

    /**
     * Reverse the curve direction
     * @returns {CubicBezier}
     */
    reverse() {
        return new CubicBezier(this.p3, this.p2, this.p1, this.p0);
    }

    /**
     * Convert to SVG path data
     * @returns {string}
     */
    toSVGPath() {
        return `M ${this.p0.x} ${this.p0.y} C ${this.p1.x} ${this.p1.y}, ${this.p2.x} ${this.p2.y}, ${this.p3.x} ${this.p3.y}`;
    }
}

// ==========================================
// BEZIER UTILITY FUNCTIONS
// ==========================================

/**
 * Solve quadratic equation ax² + bx + c = 0
 * @param {number} a 
 * @param {number} b 
 * @param {number} c 
 * @returns {number[]}
 */
function solveQuadratic(a, b, c) {
    if (Math.abs(a) < 1e-10) {
        if (Math.abs(b) < 1e-10) return [];
        return [-c / b];
    }
    
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];
    if (discriminant === 0) return [-b / (2 * a)];
    
    const sqrtD = Math.sqrt(discriminant);
    return [
        (-b - sqrtD) / (2 * a),
        (-b + sqrtD) / (2 * a)
    ];
}

/**
 * Solve cubic equation ax³ + bx² + cx + d = 0
 * @param {number} a 
 * @param {number} b 
 * @param {number} c 
 * @param {number} d 
 * @returns {number[]}
 */
export function solveCubic(a, b, c, d) {
    if (Math.abs(a) < 1e-10) {
        return solveQuadratic(b, c, d);
    }
    
    // Normalize
    b /= a; c /= a; d /= a;
    
    const p = c - b * b / 3;
    const q = 2 * b * b * b / 27 - b * c / 3 + d;
    
    const discriminant = q * q / 4 + p * p * p / 27;
    
    const roots = [];
    
    if (discriminant > 0) {
        const sqrtD = Math.sqrt(discriminant);
        const u = Math.cbrt(-q / 2 + sqrtD);
        const v = Math.cbrt(-q / 2 - sqrtD);
        roots.push(u + v - b / 3);
    } else if (discriminant === 0) {
        const u = Math.cbrt(-q / 2);
        roots.push(2 * u - b / 3);
        roots.push(-u - b / 3);
    } else {
        const r = Math.sqrt(-p * p * p / 27);
        const theta = Math.acos(-q / (2 * r));
        const m = 2 * Math.cbrt(r);
        roots.push(m * Math.cos(theta / 3) - b / 3);
        roots.push(m * Math.cos((theta + 2 * Math.PI) / 3) - b / 3);
        roots.push(m * Math.cos((theta + 4 * Math.PI) / 3) - b / 3);
    }
    
    return roots;
}

/**
 * Create a cubic bezier arc approximation for a quarter circle
 * @param {Vector2D} center 
 * @param {number} radius 
 * @param {number} startAngle - Start angle in radians
 * @param {number} endAngle - End angle in radians
 * @returns {CubicBezier}
 */
export function createArc(center, radius, startAngle, endAngle) {
    const deltaAngle = endAngle - startAngle;
    const k = (4 / 3) * Math.tan(deltaAngle / 4);
    
    const p0 = new Vector2D(
        center.x + radius * Math.cos(startAngle),
        center.y + radius * Math.sin(startAngle)
    );
    
    const p3 = new Vector2D(
        center.x + radius * Math.cos(endAngle),
        center.y + radius * Math.sin(endAngle)
    );
    
    const p1 = new Vector2D(
        p0.x - k * radius * Math.sin(startAngle),
        p0.y + k * radius * Math.cos(startAngle)
    );
    
    const p2 = new Vector2D(
        p3.x + k * radius * Math.sin(endAngle),
        p3.y - k * radius * Math.cos(endAngle)
    );
    
    return new CubicBezier(p0, p1, p2, p3);
}

/**
 * Create cubic bezier approximation of a circle
 * @param {Vector2D} center 
 * @param {number} radius 
 * @returns {CubicBezier[]}
 */
export function createCircle(center, radius) {
    const arcs = [];
    for (let i = 0; i < 4; i++) {
        arcs.push(createArc(
            center, radius,
            i * Math.PI / 2,
            (i + 1) * Math.PI / 2
        ));
    }
    return arcs;
}

/**
 * Create cubic bezier approximation of an ellipse
 * @param {Vector2D} center 
 * @param {number} rx - X radius
 * @param {number} ry - Y radius
 * @returns {CubicBezier[]}
 */
export function createEllipse(center, rx, ry) {
    const k = 0.5522847498; // 4/3 * tan(π/8)
    
    const arcs = [
        // Top-right quadrant
        new CubicBezier(
            new Vector2D(center.x + rx, center.y),
            new Vector2D(center.x + rx, center.y - k * ry),
            new Vector2D(center.x + k * rx, center.y - ry),
            new Vector2D(center.x, center.y - ry)
        ),
        // Top-left quadrant
        new CubicBezier(
            new Vector2D(center.x, center.y - ry),
            new Vector2D(center.x - k * rx, center.y - ry),
            new Vector2D(center.x - rx, center.y - k * ry),
            new Vector2D(center.x - rx, center.y)
        ),
        // Bottom-left quadrant
        new CubicBezier(
            new Vector2D(center.x - rx, center.y),
            new Vector2D(center.x - rx, center.y + k * ry),
            new Vector2D(center.x - k * rx, center.y + ry),
            new Vector2D(center.x, center.y + ry)
        ),
        // Bottom-right quadrant
        new CubicBezier(
            new Vector2D(center.x, center.y + ry),
            new Vector2D(center.x + k * rx, center.y + ry),
            new Vector2D(center.x + rx, center.y + k * ry),
            new Vector2D(center.x + rx, center.y)
        )
    ];
    
    return arcs;
}

/**
 * Fit cubic bezier curves through a series of points
 * @param {Vector2D[]} points 
 * @param {number} [error=1] - Maximum fitting error
 * @returns {CubicBezier[]}
 */
export function fitCubicBeziers(points, error = 1) {
    if (points.length < 2) return [];
    if (points.length === 2) {
        const mid1 = points[0].lerp(points[1], 1/3);
        const mid2 = points[0].lerp(points[1], 2/3);
        return [new CubicBezier(points[0], mid1, mid2, points[1])];
    }
    
    // Calculate tangents
    const leftTangent = points[1].subtract(points[0]).normalize();
    const rightTangent = points[points.length - 2].subtract(points[points.length - 1]).normalize();
    
    return fitCubicBezierSegment(points, leftTangent, rightTangent, error);
}

/**
 * Fit a single bezier segment to points
 * @param {Vector2D[]} points 
 * @param {Vector2D} leftTangent 
 * @param {Vector2D} rightTangent 
 * @param {number} error 
 * @returns {CubicBezier[]}
 */
function fitCubicBezierSegment(points, leftTangent, rightTangent, error) {
    if (points.length === 2) {
        const dist = points[0].distanceTo(points[1]) / 3;
        return [new CubicBezier(
            points[0],
            points[0].add(leftTangent.multiply(dist)),
            points[1].add(rightTangent.multiply(dist)),
            points[1]
        )];
    }
    
    // Parameterize points by chord length
    const u = chordLengthParameterize(points);
    
    // Generate bezier
    const bezier = generateBezier(points, u, leftTangent, rightTangent);
    
    // Check error
    const { maxError, splitPoint } = computeMaxError(points, bezier, u);
    
    if (maxError < error) {
        return [bezier];
    }
    
    // Error too large, split and recurse
    if (maxError < error * error) {
        // Try to improve with iteration
        for (let i = 0; i < 4; i++) {
            reparameterize(points, bezier, u);
            const newBezier = generateBezier(points, u, leftTangent, rightTangent);
            const { maxError: newError } = computeMaxError(points, newBezier, u);
            if (newError < error) {
                return [newBezier];
            }
        }
    }
    
    // Split at point of maximum error
    const centerTangent = points[splitPoint + 1].subtract(points[splitPoint - 1]).normalize();
    
    const left = fitCubicBezierSegment(
        points.slice(0, splitPoint + 1),
        leftTangent,
        centerTangent.negate(),
        error
    );
    
    const right = fitCubicBezierSegment(
        points.slice(splitPoint),
        centerTangent,
        rightTangent,
        error
    );
    
    return [...left, ...right];
}

function chordLengthParameterize(points) {
    const u = [0];
    for (let i = 1; i < points.length; i++) {
        u.push(u[i - 1] + points[i].distanceTo(points[i - 1]));
    }
    const total = u[u.length - 1];
    return u.map(v => v / total);
}

function generateBezier(points, u, leftTangent, rightTangent) {
    const n = points.length - 1;
    
    // Create A matrix
    const A = [];
    for (let i = 0; i <= n; i++) {
        const t = u[i];
        const mt = 1 - t;
        A.push([
            leftTangent.multiply(3 * mt * mt * t),
            rightTangent.multiply(3 * mt * t * t)
        ]);
    }
    
    // Create C and X matrices
    let C = [[0, 0], [0, 0]];
    let X = [0, 0];
    
    for (let i = 0; i <= n; i++) {
        C[0][0] += A[i][0].dot(A[i][0]);
        C[0][1] += A[i][0].dot(A[i][1]);
        C[1][0] = C[0][1];
        C[1][1] += A[i][1].dot(A[i][1]);
        
        const t = u[i];
        const mt = 1 - t;
        const mt3 = mt * mt * mt;
        const t3 = t * t * t;
        
        const tmp = points[i].subtract(
            points[0].multiply(mt3)
        ).subtract(
            points[0].multiply(3 * mt * mt * t)
        ).subtract(
            points[n].multiply(3 * mt * t * t)
        ).subtract(
            points[n].multiply(t3)
        );
        
        X[0] += A[i][0].dot(tmp);
        X[1] += A[i][1].dot(tmp);
    }
    
    // Solve for alpha
    const det = C[0][0] * C[1][1] - C[0][1] * C[1][0];
    let alpha1, alpha2;
    
    if (Math.abs(det) < 1e-10) {
        const c0 = C[0][0] + C[0][1];
        const c1 = C[1][0] + C[1][1];
        alpha1 = c0 !== 0 ? X[0] / c0 : 0;
        alpha2 = c1 !== 0 ? X[1] / c1 : 0;
    } else {
        alpha1 = (C[1][1] * X[0] - C[0][1] * X[1]) / det;
        alpha2 = (C[0][0] * X[1] - C[1][0] * X[0]) / det;
    }
    
    // Fallback for negative alphas
    const segLength = points[0].distanceTo(points[n]);
    const epsilon = 1e-6 * segLength;
    
    if (alpha1 < epsilon || alpha2 < epsilon) {
        alpha1 = alpha2 = segLength / 3;
    }
    
    return new CubicBezier(
        points[0],
        points[0].add(leftTangent.multiply(alpha1)),
        points[n].add(rightTangent.multiply(alpha2)),
        points[n]
    );
}

function computeMaxError(points, bezier, u) {
    let maxError = 0;
    let splitPoint = Math.floor(points.length / 2);
    
    for (let i = 1; i < points.length - 1; i++) {
        const p = bezier.getPoint(u[i]);
        const dist = p.distanceToSquared(points[i]);
        if (dist > maxError) {
            maxError = dist;
            splitPoint = i;
        }
    }
    
    return { maxError: Math.sqrt(maxError), splitPoint };
}

function reparameterize(points, bezier, u) {
    for (let i = 0; i < points.length; i++) {
        u[i] = newtonRaphsonRoot(bezier, points[i], u[i]);
    }
}

function newtonRaphsonRoot(bezier, point, u) {
    const d = bezier.getPoint(u).subtract(point);
    const d1 = bezier.getDerivative(u);
    const d2 = bezier.getSecondDerivative(u);
    
    const numerator = d.dot(d1);
    const denominator = d1.dot(d1) + d.dot(d2);
    
    if (Math.abs(denominator) < 1e-10) return u;
    
    return u - numerator / denominator;
}

// ==========================================
// BEZIER UTILITY CLASS
// ==========================================

/**
 * Bezier - Static utility methods for bezier curve calculations
 */
export class Bezier {
    /**
     * Calculate a point on a cubic bezier curve
     * @param {{ x: number, y: number }} p0 - Start point
     * @param {{ x: number, y: number }} p1 - Control point 1
     * @param {{ x: number, y: number }} p2 - Control point 2
     * @param {{ x: number, y: number }} p3 - End point
     * @param {number} t - Parameter (0-1)
     * @returns {{ x: number, y: number }}
     */
    static cubicPoint(p0, p1, p2, p3, t) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        
        return {
            x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
            y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
        };
    }

    /**
     * Calculate tangent of a cubic bezier curve at t
     * @param {{ x: number, y: number }} p0 - Start point
     * @param {{ x: number, y: number }} p1 - Control point 1
     * @param {{ x: number, y: number }} p2 - Control point 2
     * @param {{ x: number, y: number }} p3 - End point
     * @param {number} t - Parameter (0-1)
     * @returns {{ x: number, y: number }}
     */
    static cubicTangent(p0, p1, p2, p3, t) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;
        
        const dx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
        const dy = 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);
        
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 1e-10) {
            return { x: 1, y: 0 };
        }
        
        return { x: dx / length, y: dy / length };
    }

    /**
     * Calculate bounding box of a cubic bezier curve
     * @param {{ x: number, y: number }} p0 - Start point
     * @param {{ x: number, y: number }} p1 - Control point 1
     * @param {{ x: number, y: number }} p2 - Control point 2
     * @param {{ x: number, y: number }} p3 - End point
     * @returns {{ minX: number, minY: number, maxX: number, maxY: number }}
     */
    static cubicBounds(p0, p1, p2, p3) {
        let minX = Math.min(p0.x, p3.x);
        let maxX = Math.max(p0.x, p3.x);
        let minY = Math.min(p0.y, p3.y);
        let maxY = Math.max(p0.y, p3.y);
        
        // Find extrema in x and y
        const extrema = Bezier._cubicExtrema(p0, p1, p2, p3);
        
        for (const t of extrema) {
            if (t > 0 && t < 1) {
                const pt = Bezier.cubicPoint(p0, p1, p2, p3, t);
                minX = Math.min(minX, pt.x);
                maxX = Math.max(maxX, pt.x);
                minY = Math.min(minY, pt.y);
                maxY = Math.max(maxY, pt.y);
            }
        }
        
        return { minX, minY, maxX, maxY };
    }

    /**
     * Find extrema t values for cubic bezier
     * @private
     */
    static _cubicExtrema(p0, p1, p2, p3) {
        const result = [];
        
        // Derivative coefficients for x
        const ax = -p0.x + 3 * p1.x - 3 * p2.x + p3.x;
        const bx = 2 * p0.x - 4 * p1.x + 2 * p2.x;
        const cx = -p0.x + p1.x;
        
        // Solve quadratic for x
        const discriminantX = bx * bx - 4 * ax * cx;
        if (discriminantX >= 0 && Math.abs(ax) > 1e-10) {
            const sqrtD = Math.sqrt(discriminantX);
            result.push((-bx + sqrtD) / (2 * ax));
            result.push((-bx - sqrtD) / (2 * ax));
        } else if (Math.abs(bx) > 1e-10) {
            result.push(-cx / bx);
        }
        
        // Derivative coefficients for y
        const ay = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
        const by = 2 * p0.y - 4 * p1.y + 2 * p2.y;
        const cy = -p0.y + p1.y;
        
        // Solve quadratic for y
        const discriminantY = by * by - 4 * ay * cy;
        if (discriminantY >= 0 && Math.abs(ay) > 1e-10) {
            const sqrtD = Math.sqrt(discriminantY);
            result.push((-by + sqrtD) / (2 * ay));
            result.push((-by - sqrtD) / (2 * ay));
        } else if (Math.abs(by) > 1e-10) {
            result.push(-cy / by);
        }
        
        return result;
    }

    /**
     * Split a cubic bezier curve at parameter t (de Casteljau)
     * @param {{ x: number, y: number }} p0 - Start point
     * @param {{ x: number, y: number }} p1 - Control point 1
     * @param {{ x: number, y: number }} p2 - Control point 2
     * @param {{ x: number, y: number }} p3 - End point
     * @param {number} t - Parameter (0-1)
     * @returns {[{ p0, p1, p2, p3 }, { p0, p1, p2, p3 }]}
     */
    static splitCubic(p0, p1, p2, p3, t) {
        // de Casteljau's algorithm
        const lerp = (a, b, t) => ({
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t
        });
        
        const p01 = lerp(p0, p1, t);
        const p12 = lerp(p1, p2, t);
        const p23 = lerp(p2, p3, t);
        const p012 = lerp(p01, p12, t);
        const p123 = lerp(p12, p23, t);
        const p0123 = lerp(p012, p123, t);
        
        return [
            { p0: p0, p1: p01, p2: p012, p3: p0123 },
            { p0: p0123, p1: p123, p2: p23, p3: p3 }
        ];
    }

    /**
     * Calculate a point on a quadratic bezier curve
     * @param {{ x: number, y: number }} p0 - Start point
     * @param {{ x: number, y: number }} p1 - Control point
     * @param {{ x: number, y: number }} p2 - End point
     * @param {number} t - Parameter (0-1)
     * @returns {{ x: number, y: number }}
     */
    static quadraticPoint(p0, p1, p2, t) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;
        
        return {
            x: mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x,
            y: mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y
        };
    }
}

export default {
    QuadraticBezier,
    CubicBezier,
    Bezier,
    solveCubic,
    createArc,
    createCircle,
    createEllipse,
    fitCubicBeziers
};
