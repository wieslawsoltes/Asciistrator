/**
 * Asciistrator - Vector2D Class
 * 
 * A comprehensive 2D vector mathematics class for vector graphics operations.
 * Supports immutable operations (returns new vectors) and mutable operations (modifies in place).
 */

export class Vector2D {
    /**
     * Create a new 2D vector
     * @param {number} x - X component
     * @param {number} y - Y component
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // ==========================================
    // STATIC FACTORY METHODS
    // ==========================================

    /**
     * Create a zero vector (0, 0)
     * @returns {Vector2D}
     */
    static zero() {
        return new Vector2D(0, 0);
    }

    /**
     * Create a unit vector (1, 1)
     * @returns {Vector2D}
     */
    static one() {
        return new Vector2D(1, 1);
    }

    /**
     * Create a unit vector pointing up (0, -1)
     * @returns {Vector2D}
     */
    static up() {
        return new Vector2D(0, -1);
    }

    /**
     * Create a unit vector pointing down (0, 1)
     * @returns {Vector2D}
     */
    static down() {
        return new Vector2D(0, 1);
    }

    /**
     * Create a unit vector pointing left (-1, 0)
     * @returns {Vector2D}
     */
    static left() {
        return new Vector2D(-1, 0);
    }

    /**
     * Create a unit vector pointing right (1, 0)
     * @returns {Vector2D}
     */
    static right() {
        return new Vector2D(1, 0);
    }

    /**
     * Create a vector from an angle (in radians)
     * @param {number} angle - Angle in radians
     * @param {number} [length=1] - Length of the vector
     * @returns {Vector2D}
     */
    static fromAngle(angle, length = 1) {
        return new Vector2D(
            Math.cos(angle) * length,
            Math.sin(angle) * length
        );
    }

    /**
     * Create a vector from polar coordinates
     * @param {number} r - Radius (length)
     * @param {number} theta - Angle in radians
     * @returns {Vector2D}
     */
    static fromPolar(r, theta) {
        return new Vector2D(
            r * Math.cos(theta),
            r * Math.sin(theta)
        );
    }

    /**
     * Create a random unit vector
     * @returns {Vector2D}
     */
    static random() {
        const angle = Math.random() * Math.PI * 2;
        return Vector2D.fromAngle(angle);
    }

    /**
     * Create a random vector within bounds
     * @param {number} minX 
     * @param {number} maxX 
     * @param {number} minY 
     * @param {number} maxY 
     * @returns {Vector2D}
     */
    static randomInBounds(minX, maxX, minY, maxY) {
        return new Vector2D(
            minX + Math.random() * (maxX - minX),
            minY + Math.random() * (maxY - minY)
        );
    }

    /**
     * Create a vector from an array [x, y]
     * @param {number[]} arr 
     * @returns {Vector2D}
     */
    static fromArray(arr) {
        return new Vector2D(arr[0] || 0, arr[1] || 0);
    }

    /**
     * Create a vector from an object {x, y}
     * @param {{x: number, y: number}} obj 
     * @returns {Vector2D}
     */
    static fromObject(obj) {
        return new Vector2D(obj.x || 0, obj.y || 0);
    }

    // ==========================================
    // INSTANCE METHODS - IMMUTABLE (return new Vector2D)
    // ==========================================

    /**
     * Create a copy of this vector
     * @returns {Vector2D}
     */
    clone() {
        return new Vector2D(this.x, this.y);
    }

    /**
     * Add another vector
     * @param {Vector2D} v 
     * @returns {Vector2D}
     */
    add(v) {
        return new Vector2D(this.x + v.x, this.y + v.y);
    }

    /**
     * Subtract another vector
     * @param {Vector2D} v 
     * @returns {Vector2D}
     */
    subtract(v) {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }

    /**
     * Alias for subtract
     * @param {Vector2D} v 
     * @returns {Vector2D}
     */
    sub(v) {
        return this.subtract(v);
    }

    /**
     * Multiply by a scalar
     * @param {number} scalar 
     * @returns {Vector2D}
     */
    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    /**
     * Alias for multiply
     * @param {number} scalar 
     * @returns {Vector2D}
     */
    scale(scalar) {
        return this.multiply(scalar);
    }

    /**
     * Multiply component-wise by another vector
     * @param {Vector2D} v 
     * @returns {Vector2D}
     */
    multiplyVector(v) {
        return new Vector2D(this.x * v.x, this.y * v.y);
    }

    /**
     * Divide by a scalar
     * @param {number} scalar 
     * @returns {Vector2D}
     */
    divide(scalar) {
        if (scalar === 0) {
            console.warn('Vector2D: Division by zero');
            return new Vector2D(0, 0);
        }
        return new Vector2D(this.x / scalar, this.y / scalar);
    }

    /**
     * Divide component-wise by another vector
     * @param {Vector2D} v 
     * @returns {Vector2D}
     */
    divideVector(v) {
        return new Vector2D(
            v.x === 0 ? 0 : this.x / v.x,
            v.y === 0 ? 0 : this.y / v.y
        );
    }

    /**
     * Negate the vector
     * @returns {Vector2D}
     */
    negate() {
        return new Vector2D(-this.x, -this.y);
    }

    /**
     * Get the normalized (unit) vector
     * @returns {Vector2D}
     */
    normalize() {
        const len = this.length();
        if (len === 0) {
            return new Vector2D(0, 0);
        }
        return new Vector2D(this.x / len, this.y / len);
    }

    /**
     * Set the length of the vector
     * @param {number} length 
     * @returns {Vector2D}
     */
    setLength(length) {
        return this.normalize().multiply(length);
    }

    /**
     * Limit the length of the vector
     * @param {number} max 
     * @returns {Vector2D}
     */
    limit(max) {
        const len = this.length();
        if (len > max) {
            return this.setLength(max);
        }
        return this.clone();
    }

    /**
     * Clamp vector components to a range
     * @param {number} minX 
     * @param {number} maxX 
     * @param {number} minY 
     * @param {number} maxY 
     * @returns {Vector2D}
     */
    clamp(minX, maxX, minY, maxY) {
        return new Vector2D(
            Math.max(minX, Math.min(maxX, this.x)),
            Math.max(minY, Math.min(maxY, this.y))
        );
    }

    /**
     * Floor the components
     * @returns {Vector2D}
     */
    floor() {
        return new Vector2D(Math.floor(this.x), Math.floor(this.y));
    }

    /**
     * Ceil the components
     * @returns {Vector2D}
     */
    ceil() {
        return new Vector2D(Math.ceil(this.x), Math.ceil(this.y));
    }

    /**
     * Round the components
     * @returns {Vector2D}
     */
    round() {
        return new Vector2D(Math.round(this.x), Math.round(this.y));
    }

    /**
     * Get absolute values of components
     * @returns {Vector2D}
     */
    abs() {
        return new Vector2D(Math.abs(this.x), Math.abs(this.y));
    }

    /**
     * Rotate the vector by an angle (in radians)
     * @param {number} angle - Angle in radians
     * @returns {Vector2D}
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2D(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    /**
     * Rotate the vector around a point
     * @param {Vector2D} origin - Point to rotate around
     * @param {number} angle - Angle in radians
     * @returns {Vector2D}
     */
    rotateAround(origin, angle) {
        return this.subtract(origin).rotate(angle).add(origin);
    }

    /**
     * Get the perpendicular vector (rotated 90 degrees counter-clockwise)
     * @returns {Vector2D}
     */
    perpendicular() {
        return new Vector2D(-this.y, this.x);
    }

    /**
     * Get the perpendicular vector (rotated 90 degrees clockwise)
     * @returns {Vector2D}
     */
    perpendicularCW() {
        return new Vector2D(this.y, -this.x);
    }

    /**
     * Reflect the vector over a normal
     * @param {Vector2D} normal - The normal vector to reflect over
     * @returns {Vector2D}
     */
    reflect(normal) {
        const n = normal.normalize();
        const dot = this.dot(n);
        return this.subtract(n.multiply(2 * dot));
    }

    /**
     * Project this vector onto another vector
     * @param {Vector2D} v 
     * @returns {Vector2D}
     */
    project(v) {
        const len = v.lengthSquared();
        if (len === 0) return Vector2D.zero();
        const dot = this.dot(v);
        return v.multiply(dot / len);
    }

    /**
     * Get the rejection of this vector from another (perpendicular component)
     * @param {Vector2D} v 
     * @returns {Vector2D}
     */
    reject(v) {
        return this.subtract(this.project(v));
    }

    /**
     * Linear interpolation to another vector
     * @param {Vector2D} v - Target vector
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Vector2D}
     */
    lerp(v, t) {
        return new Vector2D(
            this.x + (v.x - this.x) * t,
            this.y + (v.y - this.y) * t
        );
    }

    /**
     * Smooth step interpolation
     * @param {Vector2D} v - Target vector
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Vector2D}
     */
    smoothStep(v, t) {
        t = t * t * (3 - 2 * t);
        return this.lerp(v, t);
    }

    /**
     * Get the midpoint between this and another vector
     * @param {Vector2D} v 
     * @returns {Vector2D}
     */
    midpoint(v) {
        return this.lerp(v, 0.5);
    }

    // ==========================================
    // INSTANCE METHODS - MUTABLE (modify in place)
    // ==========================================

    /**
     * Set the components
     * @param {number} x 
     * @param {number} y 
     * @returns {Vector2D} this
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Copy from another vector
     * @param {Vector2D} v 
     * @returns {Vector2D} this
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    /**
     * Add in place
     * @param {Vector2D} v 
     * @returns {Vector2D} this
     */
    addInPlace(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /**
     * Subtract in place
     * @param {Vector2D} v 
     * @returns {Vector2D} this
     */
    subtractInPlace(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /**
     * Multiply in place
     * @param {number} scalar 
     * @returns {Vector2D} this
     */
    multiplyInPlace(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Divide in place
     * @param {number} scalar 
     * @returns {Vector2D} this
     */
    divideInPlace(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    /**
     * Normalize in place
     * @returns {Vector2D} this
     */
    normalizeInPlace() {
        const len = this.length();
        if (len !== 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }

    /**
     * Rotate in place
     * @param {number} angle 
     * @returns {Vector2D} this
     */
    rotateInPlace(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }

    // ==========================================
    // SCALAR PROPERTIES & CALCULATIONS
    // ==========================================

    /**
     * Get the length (magnitude) of the vector
     * @returns {number}
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Alias for length
     * @returns {number}
     */
    magnitude() {
        return this.length();
    }

    /**
     * Get the squared length (more efficient for comparisons)
     * @returns {number}
     */
    lengthSquared() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Alias for lengthSquared
     * @returns {number}
     */
    magnitudeSquared() {
        return this.lengthSquared();
    }

    /**
     * Get the angle of the vector (in radians)
     * @returns {number}
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Get the angle to another vector (in radians)
     * @param {Vector2D} v 
     * @returns {number}
     */
    angleTo(v) {
        return Math.atan2(v.y - this.y, v.x - this.x);
    }

    /**
     * Get the angle between this and another vector (in radians)
     * @param {Vector2D} v 
     * @returns {number}
     */
    angleBetween(v) {
        const dot = this.dot(v);
        const len = this.length() * v.length();
        if (len === 0) return 0;
        return Math.acos(Math.max(-1, Math.min(1, dot / len)));
    }

    /**
     * Dot product with another vector
     * @param {Vector2D} v 
     * @returns {number}
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Cross product with another vector (returns scalar z-component)
     * @param {Vector2D} v 
     * @returns {number}
     */
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    /**
     * Get the distance to another vector
     * @param {Vector2D} v 
     * @returns {number}
     */
    distanceTo(v) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Get the squared distance to another vector
     * @param {Vector2D} v 
     * @returns {number}
     */
    distanceToSquared(v) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return dx * dx + dy * dy;
    }

    /**
     * Manhattan distance to another vector
     * @param {Vector2D} v 
     * @returns {number}
     */
    manhattanDistanceTo(v) {
        return Math.abs(v.x - this.x) + Math.abs(v.y - this.y);
    }

    /**
     * Chebyshev distance to another vector
     * @param {Vector2D} v 
     * @returns {number}
     */
    chebyshevDistanceTo(v) {
        return Math.max(Math.abs(v.x - this.x), Math.abs(v.y - this.y));
    }

    // ==========================================
    // COMPARISON & TESTING
    // ==========================================

    /**
     * Check if the vector is zero
     * @param {number} [epsilon=0.0001] - Tolerance
     * @returns {boolean}
     */
    isZero(epsilon = 0.0001) {
        return Math.abs(this.x) < epsilon && Math.abs(this.y) < epsilon;
    }

    /**
     * Check equality with another vector
     * @param {Vector2D} v 
     * @param {number} [epsilon=0.0001] - Tolerance
     * @returns {boolean}
     */
    equals(v, epsilon = 0.0001) {
        return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
    }

    /**
     * Check if the vector is normalized (unit length)
     * @param {number} [epsilon=0.0001] - Tolerance
     * @returns {boolean}
     */
    isNormalized(epsilon = 0.0001) {
        return Math.abs(this.lengthSquared() - 1) < epsilon;
    }

    /**
     * Check if parallel to another vector
     * @param {Vector2D} v 
     * @param {number} [epsilon=0.0001] - Tolerance
     * @returns {boolean}
     */
    isParallelTo(v, epsilon = 0.0001) {
        return Math.abs(this.cross(v)) < epsilon;
    }

    /**
     * Check if perpendicular to another vector
     * @param {Vector2D} v 
     * @param {number} [epsilon=0.0001] - Tolerance
     * @returns {boolean}
     */
    isPerpendicularTo(v, epsilon = 0.0001) {
        return Math.abs(this.dot(v)) < epsilon;
    }

    // ==========================================
    // CONVERSION
    // ==========================================

    /**
     * Convert to array [x, y]
     * @returns {number[]}
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * Convert to object {x, y}
     * @returns {{x: number, y: number}}
     */
    toObject() {
        return { x: this.x, y: this.y };
    }

    /**
     * Convert to string
     * @param {number} [precision=2] - Decimal places
     * @returns {string}
     */
    toString(precision = 2) {
        return `Vector2D(${this.x.toFixed(precision)}, ${this.y.toFixed(precision)})`;
    }

    /**
     * Convert to CSS transform string
     * @returns {string}
     */
    toTranslate() {
        return `translate(${this.x}px, ${this.y}px)`;
    }

    // ==========================================
    // STATIC UTILITY METHODS
    // ==========================================

    /**
     * Get the minimum components of two vectors
     * @param {Vector2D} a 
     * @param {Vector2D} b 
     * @returns {Vector2D}
     */
    static min(a, b) {
        return new Vector2D(
            Math.min(a.x, b.x),
            Math.min(a.y, b.y)
        );
    }

    /**
     * Get the maximum components of two vectors
     * @param {Vector2D} a 
     * @param {Vector2D} b 
     * @returns {Vector2D}
     */
    static max(a, b) {
        return new Vector2D(
            Math.max(a.x, b.x),
            Math.max(a.y, b.y)
        );
    }

    /**
     * Calculate the average of multiple vectors
     * @param {...Vector2D} vectors 
     * @returns {Vector2D}
     */
    static average(...vectors) {
        if (vectors.length === 0) return Vector2D.zero();
        let sumX = 0, sumY = 0;
        for (const v of vectors) {
            sumX += v.x;
            sumY += v.y;
        }
        return new Vector2D(sumX / vectors.length, sumY / vectors.length);
    }

    /**
     * Linear interpolation between two vectors
     * @param {Vector2D} a 
     * @param {Vector2D} b 
     * @param {number} t 
     * @returns {Vector2D}
     */
    static lerp(a, b, t) {
        return a.lerp(b, t);
    }

    /**
     * Get distance between two vectors
     * @param {Vector2D} a 
     * @param {Vector2D} b 
     * @returns {number}
     */
    static distance(a, b) {
        return a.distanceTo(b);
    }

    /**
     * Get angle between two vectors
     * @param {Vector2D} a 
     * @param {Vector2D} b 
     * @returns {number}
     */
    static angleBetween(a, b) {
        return a.angleBetween(b);
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees 
     * @returns {number}
     */
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Convert radians to degrees
     * @param {number} radians 
     * @returns {number}
     */
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }
}

export default Vector2D;
