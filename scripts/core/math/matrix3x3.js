/**
 * Asciistrator - Matrix3x3 Class
 * 
 * A 3x3 transformation matrix for 2D affine transformations.
 * Used for translate, rotate, scale, skew, and combined transformations.
 * 
 * Matrix layout (column-major for consistency with graphics APIs):
 * | a  c  tx |   | m[0]  m[2]  m[4] |
 * | b  d  ty | = | m[1]  m[3]  m[5] |
 * | 0  0  1  |   | 0     0     1    |
 */

import { Vector2D } from './vector2d.js';

export class Matrix3x3 {
    /**
     * Create a new 3x3 matrix
     * @param {number} a - Scale X (m[0])
     * @param {number} b - Skew Y (m[1])
     * @param {number} c - Skew X (m[2])
     * @param {number} d - Scale Y (m[3])
     * @param {number} tx - Translate X (m[4])
     * @param {number} ty - Translate Y (m[5])
     */
    constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
        // Store as flat array for performance
        this.m = new Float64Array([a, b, c, d, tx, ty]);
    }

    // ==========================================
    // GETTERS & SETTERS
    // ==========================================

    get a() { return this.m[0]; }
    set a(v) { this.m[0] = v; }

    get b() { return this.m[1]; }
    set b(v) { this.m[1] = v; }

    get c() { return this.m[2]; }
    set c(v) { this.m[2] = v; }

    get d() { return this.m[3]; }
    set d(v) { this.m[3] = v; }

    get tx() { return this.m[4]; }
    set tx(v) { this.m[4] = v; }

    get ty() { return this.m[5]; }
    set ty(v) { this.m[5] = v; }

    // ==========================================
    // STATIC FACTORY METHODS
    // ==========================================

    /**
     * Create an identity matrix
     * @returns {Matrix3x3}
     */
    static identity() {
        return new Matrix3x3(1, 0, 0, 1, 0, 0);
    }

    /**
     * Create a translation matrix
     * @param {number} tx - X translation
     * @param {number} ty - Y translation
     * @returns {Matrix3x3}
     */
    static translation(tx, ty) {
        return new Matrix3x3(1, 0, 0, 1, tx, ty);
    }

    /**
     * Create a translation matrix from a vector
     * @param {Vector2D} v 
     * @returns {Matrix3x3}
     */
    static translationFromVector(v) {
        return Matrix3x3.translation(v.x, v.y);
    }

    /**
     * Create a rotation matrix
     * @param {number} angle - Angle in radians
     * @returns {Matrix3x3}
     */
    static rotation(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Matrix3x3(cos, sin, -sin, cos, 0, 0);
    }

    /**
     * Create a rotation matrix in degrees
     * @param {number} degrees 
     * @returns {Matrix3x3}
     */
    static rotationDegrees(degrees) {
        return Matrix3x3.rotation(degrees * Math.PI / 180);
    }

    /**
     * Create a rotation matrix around a point
     * @param {number} angle - Angle in radians
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @returns {Matrix3x3}
     */
    static rotationAround(angle, cx, cy) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Matrix3x3(
            cos, sin, -sin, cos,
            cx - cos * cx + sin * cy,
            cy - sin * cx - cos * cy
        );
    }

    /**
     * Create a scaling matrix
     * @param {number} sx - X scale factor
     * @param {number} [sy=sx] - Y scale factor (defaults to sx for uniform scaling)
     * @returns {Matrix3x3}
     */
    static scaling(sx, sy = sx) {
        return new Matrix3x3(sx, 0, 0, sy, 0, 0);
    }

    /**
     * Create a scaling matrix around a point
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @returns {Matrix3x3}
     */
    static scalingAround(sx, sy, cx, cy) {
        return new Matrix3x3(
            sx, 0, 0, sy,
            cx - sx * cx,
            cy - sy * cy
        );
    }

    /**
     * Create a skew/shear matrix
     * @param {number} skewX - X skew angle in radians
     * @param {number} skewY - Y skew angle in radians
     * @returns {Matrix3x3}
     */
    static skewing(skewX, skewY) {
        return new Matrix3x3(1, Math.tan(skewY), Math.tan(skewX), 1, 0, 0);
    }

    /**
     * Create a horizontal skew matrix
     * @param {number} angle - Skew angle in radians
     * @returns {Matrix3x3}
     */
    static skewX(angle) {
        return new Matrix3x3(1, 0, Math.tan(angle), 1, 0, 0);
    }

    /**
     * Create a vertical skew matrix
     * @param {number} angle - Skew angle in radians
     * @returns {Matrix3x3}
     */
    static skewY(angle) {
        return new Matrix3x3(1, Math.tan(angle), 0, 1, 0, 0);
    }

    /**
     * Create a reflection matrix across the X axis
     * @returns {Matrix3x3}
     */
    static reflectionX() {
        return new Matrix3x3(1, 0, 0, -1, 0, 0);
    }

    /**
     * Create a reflection matrix across the Y axis
     * @returns {Matrix3x3}
     */
    static reflectionY() {
        return new Matrix3x3(-1, 0, 0, 1, 0, 0);
    }

    /**
     * Create a reflection matrix across both axes (point reflection through origin)
     * @returns {Matrix3x3}
     */
    static reflectionOrigin() {
        return new Matrix3x3(-1, 0, 0, -1, 0, 0);
    }

    /**
     * Create a reflection matrix across a line through origin at given angle
     * @param {number} angle - Line angle in radians
     * @returns {Matrix3x3}
     */
    static reflectionLine(angle) {
        const cos2 = Math.cos(2 * angle);
        const sin2 = Math.sin(2 * angle);
        return new Matrix3x3(cos2, sin2, sin2, -cos2, 0, 0);
    }

    /**
     * Create a matrix from an array [a, b, c, d, tx, ty]
     * @param {number[]} arr 
     * @returns {Matrix3x3}
     */
    static fromArray(arr) {
        return new Matrix3x3(
            arr[0] ?? 1, arr[1] ?? 0,
            arr[2] ?? 0, arr[3] ?? 1,
            arr[4] ?? 0, arr[5] ?? 0
        );
    }

    /**
     * Create a matrix from CSS transform string
     * @param {string} transform - CSS transform matrix string
     * @returns {Matrix3x3}
     */
    static fromCSSMatrix(transform) {
        const match = transform.match(/matrix\(([^)]+)\)/);
        if (!match) return Matrix3x3.identity();
        const values = match[1].split(',').map(v => parseFloat(v.trim()));
        return Matrix3x3.fromArray(values);
    }

    /**
     * Create a matrix that transforms from one set of points to another
     * @param {Vector2D[]} from - Source points (3 points)
     * @param {Vector2D[]} to - Destination points (3 points)
     * @returns {Matrix3x3}
     */
    static fromPoints(from, to) {
        // Solve for affine transformation from 3 point pairs
        const x0 = from[0].x, y0 = from[0].y;
        const x1 = from[1].x, y1 = from[1].y;
        const x2 = from[2].x, y2 = from[2].y;
        
        const u0 = to[0].x, v0 = to[0].y;
        const u1 = to[1].x, v1 = to[1].y;
        const u2 = to[2].x, v2 = to[2].y;
        
        const det = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
        if (Math.abs(det) < 1e-10) return Matrix3x3.identity();
        
        const a = ((u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / det);
        const c = ((u0 * (x2 - x1) + u1 * (x0 - x2) + u2 * (x1 - x0)) / det);
        const tx = ((u0 * (x1 * y2 - x2 * y1) + u1 * (x2 * y0 - x0 * y2) + u2 * (x0 * y1 - x1 * y0)) / det);
        
        const b = ((v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / det);
        const d = ((v0 * (x2 - x1) + v1 * (x0 - x2) + v2 * (x1 - x0)) / det);
        const ty = ((v0 * (x1 * y2 - x2 * y1) + v1 * (x2 * y0 - x0 * y2) + v2 * (x0 * y1 - x1 * y0)) / det);
        
        return new Matrix3x3(a, b, c, d, tx, ty);
    }

    // ==========================================
    // INSTANCE METHODS - IMMUTABLE
    // ==========================================

    /**
     * Create a copy of this matrix
     * @returns {Matrix3x3}
     */
    clone() {
        return new Matrix3x3(
            this.m[0], this.m[1],
            this.m[2], this.m[3],
            this.m[4], this.m[5]
        );
    }

    /**
     * Multiply this matrix by another (this * other)
     * @param {Matrix3x3} other 
     * @returns {Matrix3x3}
     */
    multiply(other) {
        const a = this.m[0] * other.m[0] + this.m[2] * other.m[1];
        const b = this.m[1] * other.m[0] + this.m[3] * other.m[1];
        const c = this.m[0] * other.m[2] + this.m[2] * other.m[3];
        const d = this.m[1] * other.m[2] + this.m[3] * other.m[3];
        const tx = this.m[0] * other.m[4] + this.m[2] * other.m[5] + this.m[4];
        const ty = this.m[1] * other.m[4] + this.m[3] * other.m[5] + this.m[5];
        return new Matrix3x3(a, b, c, d, tx, ty);
    }

    /**
     * Pre-multiply this matrix by another (other * this)
     * @param {Matrix3x3} other 
     * @returns {Matrix3x3}
     */
    preMultiply(other) {
        return other.multiply(this);
    }

    /**
     * Apply translation
     * @param {number} tx 
     * @param {number} ty 
     * @returns {Matrix3x3}
     */
    translate(tx, ty) {
        return this.multiply(Matrix3x3.translation(tx, ty));
    }

    /**
     * Apply rotation
     * @param {number} angle - Angle in radians
     * @returns {Matrix3x3}
     */
    rotate(angle) {
        return this.multiply(Matrix3x3.rotation(angle));
    }

    /**
     * Apply rotation in degrees
     * @param {number} degrees 
     * @returns {Matrix3x3}
     */
    rotateDegrees(degrees) {
        return this.multiply(Matrix3x3.rotationDegrees(degrees));
    }

    /**
     * Apply rotation around a point
     * @param {number} angle - Angle in radians
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @returns {Matrix3x3}
     */
    rotateAround(angle, cx, cy) {
        return this.multiply(Matrix3x3.rotationAround(angle, cx, cy));
    }

    /**
     * Apply scaling
     * @param {number} sx 
     * @param {number} [sy=sx] 
     * @returns {Matrix3x3}
     */
    scale(sx, sy = sx) {
        return this.multiply(Matrix3x3.scaling(sx, sy));
    }

    /**
     * Apply scaling around a point
     * @param {number} sx 
     * @param {number} sy 
     * @param {number} cx 
     * @param {number} cy 
     * @returns {Matrix3x3}
     */
    scaleAround(sx, sy, cx, cy) {
        return this.multiply(Matrix3x3.scalingAround(sx, sy, cx, cy));
    }

    /**
     * Apply skew/shear
     * @param {number} skewX - X skew angle in radians
     * @param {number} skewY - Y skew angle in radians
     * @returns {Matrix3x3}
     */
    skew(skewX, skewY) {
        return this.multiply(Matrix3x3.skewing(skewX, skewY));
    }

    /**
     * Get the inverse of this matrix
     * @returns {Matrix3x3|null} - Returns null if matrix is not invertible
     */
    invert() {
        const det = this.determinant();
        if (Math.abs(det) < 1e-10) {
            return null;
        }
        
        const invDet = 1 / det;
        return new Matrix3x3(
            this.m[3] * invDet,
            -this.m[1] * invDet,
            -this.m[2] * invDet,
            this.m[0] * invDet,
            (this.m[2] * this.m[5] - this.m[3] * this.m[4]) * invDet,
            (this.m[1] * this.m[4] - this.m[0] * this.m[5]) * invDet
        );
    }

    /**
     * Get the transpose of this matrix (swap rows and columns)
     * @returns {Matrix3x3}
     */
    transpose() {
        return new Matrix3x3(
            this.m[0], this.m[2],
            this.m[1], this.m[3],
            this.m[4], this.m[5]
        );
    }

    // ==========================================
    // INSTANCE METHODS - MUTABLE
    // ==========================================

    /**
     * Reset to identity matrix
     * @returns {Matrix3x3} this
     */
    reset() {
        this.m[0] = 1; this.m[1] = 0;
        this.m[2] = 0; this.m[3] = 1;
        this.m[4] = 0; this.m[5] = 0;
        return this;
    }

    /**
     * Set matrix values
     * @param {number} a 
     * @param {number} b 
     * @param {number} c 
     * @param {number} d 
     * @param {number} tx 
     * @param {number} ty 
     * @returns {Matrix3x3} this
     */
    set(a, b, c, d, tx, ty) {
        this.m[0] = a; this.m[1] = b;
        this.m[2] = c; this.m[3] = d;
        this.m[4] = tx; this.m[5] = ty;
        return this;
    }

    /**
     * Copy from another matrix
     * @param {Matrix3x3} other 
     * @returns {Matrix3x3} this
     */
    copy(other) {
        this.m[0] = other.m[0]; this.m[1] = other.m[1];
        this.m[2] = other.m[2]; this.m[3] = other.m[3];
        this.m[4] = other.m[4]; this.m[5] = other.m[5];
        return this;
    }

    /**
     * Multiply in place
     * @param {Matrix3x3} other 
     * @returns {Matrix3x3} this
     */
    multiplyInPlace(other) {
        const a = this.m[0] * other.m[0] + this.m[2] * other.m[1];
        const b = this.m[1] * other.m[0] + this.m[3] * other.m[1];
        const c = this.m[0] * other.m[2] + this.m[2] * other.m[3];
        const d = this.m[1] * other.m[2] + this.m[3] * other.m[3];
        const tx = this.m[0] * other.m[4] + this.m[2] * other.m[5] + this.m[4];
        const ty = this.m[1] * other.m[4] + this.m[3] * other.m[5] + this.m[5];
        
        this.m[0] = a; this.m[1] = b;
        this.m[2] = c; this.m[3] = d;
        this.m[4] = tx; this.m[5] = ty;
        return this;
    }

    /**
     * Translate in place
     * @param {number} tx 
     * @param {number} ty 
     * @returns {Matrix3x3} this
     */
    translateInPlace(tx, ty) {
        this.m[4] += this.m[0] * tx + this.m[2] * ty;
        this.m[5] += this.m[1] * tx + this.m[3] * ty;
        return this;
    }

    /**
     * Rotate in place
     * @param {number} angle - Angle in radians
     * @returns {Matrix3x3} this
     */
    rotateInPlace(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const a = this.m[0] * cos + this.m[2] * sin;
        const b = this.m[1] * cos + this.m[3] * sin;
        const c = this.m[0] * -sin + this.m[2] * cos;
        const d = this.m[1] * -sin + this.m[3] * cos;
        
        this.m[0] = a; this.m[1] = b;
        this.m[2] = c; this.m[3] = d;
        return this;
    }

    /**
     * Scale in place
     * @param {number} sx 
     * @param {number} [sy=sx] 
     * @returns {Matrix3x3} this
     */
    scaleInPlace(sx, sy = sx) {
        this.m[0] *= sx; this.m[1] *= sx;
        this.m[2] *= sy; this.m[3] *= sy;
        return this;
    }

    /**
     * Invert in place
     * @returns {Matrix3x3|null} this or null if not invertible
     */
    invertInPlace() {
        const det = this.determinant();
        if (Math.abs(det) < 1e-10) {
            return null;
        }
        
        const invDet = 1 / det;
        const a = this.m[3] * invDet;
        const b = -this.m[1] * invDet;
        const c = -this.m[2] * invDet;
        const d = this.m[0] * invDet;
        const tx = (this.m[2] * this.m[5] - this.m[3] * this.m[4]) * invDet;
        const ty = (this.m[1] * this.m[4] - this.m[0] * this.m[5]) * invDet;
        
        this.m[0] = a; this.m[1] = b;
        this.m[2] = c; this.m[3] = d;
        this.m[4] = tx; this.m[5] = ty;
        return this;
    }

    // ==========================================
    // TRANSFORMATION APPLICATION
    // ==========================================

    /**
     * Transform a point (Vector2D)
     * @param {Vector2D} point 
     * @returns {Vector2D}
     */
    transformPoint(point) {
        return new Vector2D(
            this.m[0] * point.x + this.m[2] * point.y + this.m[4],
            this.m[1] * point.x + this.m[3] * point.y + this.m[5]
        );
    }

    /**
     * Transform a point in place
     * @param {Vector2D} point 
     * @returns {Vector2D}
     */
    transformPointInPlace(point) {
        const x = this.m[0] * point.x + this.m[2] * point.y + this.m[4];
        const y = this.m[1] * point.x + this.m[3] * point.y + this.m[5];
        point.x = x;
        point.y = y;
        return point;
    }

    /**
     * Transform a vector (direction only, no translation)
     * @param {Vector2D} vector 
     * @returns {Vector2D}
     */
    transformVector(vector) {
        return new Vector2D(
            this.m[0] * vector.x + this.m[2] * vector.y,
            this.m[1] * vector.x + this.m[3] * vector.y
        );
    }

    /**
     * Transform an array of points
     * @param {Vector2D[]} points 
     * @returns {Vector2D[]}
     */
    transformPoints(points) {
        return points.map(p => this.transformPoint(p));
    }

    /**
     * Transform coordinates (inline)
     * @param {number} x 
     * @param {number} y 
     * @returns {{x: number, y: number}}
     */
    transform(x, y) {
        return {
            x: this.m[0] * x + this.m[2] * y + this.m[4],
            y: this.m[1] * x + this.m[3] * y + this.m[5]
        };
    }

    /**
     * Inverse transform a point
     * @param {Vector2D} point 
     * @returns {Vector2D|null}
     */
    inverseTransformPoint(point) {
        const inv = this.invert();
        if (!inv) return null;
        return inv.transformPoint(point);
    }

    // ==========================================
    // PROPERTIES & CALCULATIONS
    // ==========================================

    /**
     * Calculate the determinant
     * @returns {number}
     */
    determinant() {
        return this.m[0] * this.m[3] - this.m[1] * this.m[2];
    }

    /**
     * Check if the matrix is invertible
     * @returns {boolean}
     */
    isInvertible() {
        return Math.abs(this.determinant()) > 1e-10;
    }

    /**
     * Check if this is an identity matrix
     * @param {number} [epsilon=0.0001] 
     * @returns {boolean}
     */
    isIdentity(epsilon = 0.0001) {
        return Math.abs(this.m[0] - 1) < epsilon &&
               Math.abs(this.m[1]) < epsilon &&
               Math.abs(this.m[2]) < epsilon &&
               Math.abs(this.m[3] - 1) < epsilon &&
               Math.abs(this.m[4]) < epsilon &&
               Math.abs(this.m[5]) < epsilon;
    }

    /**
     * Check equality with another matrix
     * @param {Matrix3x3} other 
     * @param {number} [epsilon=0.0001] 
     * @returns {boolean}
     */
    equals(other, epsilon = 0.0001) {
        return Math.abs(this.m[0] - other.m[0]) < epsilon &&
               Math.abs(this.m[1] - other.m[1]) < epsilon &&
               Math.abs(this.m[2] - other.m[2]) < epsilon &&
               Math.abs(this.m[3] - other.m[3]) < epsilon &&
               Math.abs(this.m[4] - other.m[4]) < epsilon &&
               Math.abs(this.m[5] - other.m[5]) < epsilon;
    }

    /**
     * Get the translation component
     * @returns {Vector2D}
     */
    getTranslation() {
        return new Vector2D(this.m[4], this.m[5]);
    }

    /**
     * Get the scale component (approximate)
     * @returns {Vector2D}
     */
    getScale() {
        const sx = Math.sqrt(this.m[0] * this.m[0] + this.m[1] * this.m[1]);
        const sy = Math.sqrt(this.m[2] * this.m[2] + this.m[3] * this.m[3]);
        return new Vector2D(sx, sy);
    }

    /**
     * Get the rotation angle (approximate)
     * @returns {number} Angle in radians
     */
    getRotation() {
        return Math.atan2(this.m[1], this.m[0]);
    }

    /**
     * Decompose the matrix into translation, rotation, scale, and skew
     * @returns {{translation: Vector2D, rotation: number, scale: Vector2D, skew: number}}
     */
    decompose() {
        const sx = Math.sqrt(this.m[0] * this.m[0] + this.m[1] * this.m[1]);
        const sy = Math.sqrt(this.m[2] * this.m[2] + this.m[3] * this.m[3]);
        
        // Handle negative scale
        const det = this.determinant();
        const signX = det < 0 ? -1 : 1;
        
        const rotation = Math.atan2(this.m[1], this.m[0]);
        
        // Calculate skew
        const skew = Math.atan2(
            this.m[0] * this.m[2] + this.m[1] * this.m[3],
            sx * sy
        );
        
        return {
            translation: new Vector2D(this.m[4], this.m[5]),
            rotation: rotation,
            scale: new Vector2D(sx * signX, sy),
            skew: skew
        };
    }

    // ==========================================
    // CONVERSION
    // ==========================================

    /**
     * Convert to array [a, b, c, d, tx, ty]
     * @returns {number[]}
     */
    toArray() {
        return [this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]];
    }

    /**
     * Convert to CSS matrix transform string
     * @returns {string}
     */
    toCSSMatrix() {
        return `matrix(${this.m[0]}, ${this.m[1]}, ${this.m[2]}, ${this.m[3]}, ${this.m[4]}, ${this.m[5]})`;
    }

    /**
     * Convert to SVG transform string
     * @returns {string}
     */
    toSVGTransform() {
        return `matrix(${this.m[0]} ${this.m[1]} ${this.m[2]} ${this.m[3]} ${this.m[4]} ${this.m[5]})`;
    }

    /**
     * Convert to string
     * @param {number} [precision=4] 
     * @returns {string}
     */
    toString(precision = 4) {
        const f = (n) => n.toFixed(precision);
        return `Matrix3x3[\n  ${f(this.m[0])}, ${f(this.m[2])}, ${f(this.m[4])}\n  ${f(this.m[1])}, ${f(this.m[3])}, ${f(this.m[5])}\n  0, 0, 1\n]`;
    }

    /**
     * Convert to Float32Array (for WebGL)
     * @returns {Float32Array} 3x3 matrix in column-major order
     */
    toFloat32Array() {
        return new Float32Array([
            this.m[0], this.m[1], 0,
            this.m[2], this.m[3], 0,
            this.m[4], this.m[5], 1
        ]);
    }

    // ==========================================
    // STATIC UTILITY METHODS
    // ==========================================

    /**
     * Multiply multiple matrices together
     * @param {...Matrix3x3} matrices 
     * @returns {Matrix3x3}
     */
    static multiply(...matrices) {
        if (matrices.length === 0) return Matrix3x3.identity();
        let result = matrices[0].clone();
        for (let i = 1; i < matrices.length; i++) {
            result = result.multiply(matrices[i]);
        }
        return result;
    }

    /**
     * Interpolate between two matrices
     * @param {Matrix3x3} a 
     * @param {Matrix3x3} b 
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Matrix3x3}
     */
    static lerp(a, b, t) {
        return new Matrix3x3(
            a.m[0] + (b.m[0] - a.m[0]) * t,
            a.m[1] + (b.m[1] - a.m[1]) * t,
            a.m[2] + (b.m[2] - a.m[2]) * t,
            a.m[3] + (b.m[3] - a.m[3]) * t,
            a.m[4] + (b.m[4] - a.m[4]) * t,
            a.m[5] + (b.m[5] - a.m[5]) * t
        );
    }
}

export default Matrix3x3;
