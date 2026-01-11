/**
 * Asciistrator - Boolean Operations
 * 
 * Implements boolean operations on ASCII shapes:
 * - Union: Combine shapes
 * - Intersection: Keep only overlapping areas
 * - Difference: Subtract one shape from another
 * - XOR: Keep non-overlapping areas
 */

/**
 * Boolean operations on point sets
 */
export class BooleanOps {
    /**
     * Union of two shapes - combines both shapes
     * @param {object} shape1 - First shape with containsPoint method or points array
     * @param {object} shape2 - Second shape
     * @param {object} bounds - Bounding box {minX, minY, maxX, maxY}
     * @returns {Set<string>} - Set of "x,y" coordinates that are in the union
     */
    static union(shape1, shape2, bounds) {
        const result = new Set();
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const in1 = BooleanOps._isInShape(shape1, x, y);
                const in2 = BooleanOps._isInShape(shape2, x, y);
                
                if (in1 || in2) {
                    result.add(`${x},${y}`);
                }
            }
        }
        
        return result;
    }

    /**
     * Intersection of two shapes - keeps only overlapping areas
     * @param {object} shape1 - First shape
     * @param {object} shape2 - Second shape
     * @param {object} bounds - Bounding box
     * @returns {Set<string>}
     */
    static intersection(shape1, shape2, bounds) {
        const result = new Set();
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const in1 = BooleanOps._isInShape(shape1, x, y);
                const in2 = BooleanOps._isInShape(shape2, x, y);
                
                if (in1 && in2) {
                    result.add(`${x},${y}`);
                }
            }
        }
        
        return result;
    }

    /**
     * Difference - subtract shape2 from shape1
     * @param {object} shape1 - First shape (base)
     * @param {object} shape2 - Second shape (to subtract)
     * @param {object} bounds - Bounding box
     * @returns {Set<string>}
     */
    static difference(shape1, shape2, bounds) {
        const result = new Set();
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const in1 = BooleanOps._isInShape(shape1, x, y);
                const in2 = BooleanOps._isInShape(shape2, x, y);
                
                if (in1 && !in2) {
                    result.add(`${x},${y}`);
                }
            }
        }
        
        return result;
    }

    /**
     * XOR - keeps non-overlapping areas from both shapes
     * @param {object} shape1 - First shape
     * @param {object} shape2 - Second shape
     * @param {object} bounds - Bounding box
     * @returns {Set<string>}
     */
    static xor(shape1, shape2, bounds) {
        const result = new Set();
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const in1 = BooleanOps._isInShape(shape1, x, y);
                const in2 = BooleanOps._isInShape(shape2, x, y);
                
                if (in1 !== in2) {
                    result.add(`${x},${y}`);
                }
            }
        }
        
        return result;
    }

    /**
     * Check if a point is inside a shape
     * @private
     */
    static _isInShape(shape, x, y) {
        // If shape has containsPoint method, use it
        if (shape.containsPoint) {
            return shape.containsPoint(x, y);
        }
        
        // If shape has a points array (polygon), use point-in-polygon
        if (shape.points && shape.points.length > 2) {
            return BooleanOps._pointInPolygon(x, y, shape.points);
        }
        
        // If shape has bounds, use bounding box check
        if (shape.x !== undefined && shape.width !== undefined) {
            return x >= shape.x && x < shape.x + shape.width &&
                   y >= shape.y && y < shape.y + shape.height;
        }
        
        return false;
    }

    /**
     * Point-in-polygon test using ray casting
     * @private
     */
    static _pointInPolygon(x, y, points) {
        let inside = false;
        const n = points.length;
        
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            
            if (((yi > y) !== (yj > y)) && 
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    /**
     * Convert point set to array of {x, y} objects
     * @param {Set<string>} pointSet 
     * @returns {Array<{x: number, y: number}>}
     */
    static pointSetToArray(pointSet) {
        return Array.from(pointSet).map(str => {
            const [x, y] = str.split(',').map(Number);
            return { x, y };
        });
    }

    /**
     * Get combined bounds of two shapes
     * @param {object} shape1 
     * @param {object} shape2 
     * @returns {object}
     */
    static getCombinedBounds(shape1, shape2) {
        const b1 = shape1.getBounds ? shape1.getBounds() : shape1;
        const b2 = shape2.getBounds ? shape2.getBounds() : shape2;
        
        return {
            minX: Math.min(b1.x || b1.minX, b2.x || b2.minX),
            minY: Math.min(b1.y || b1.minY, b2.y || b2.minY),
            maxX: Math.max((b1.x || b1.minX || 0) + (b1.width || 0), (b2.x || b2.minX || 0) + (b2.width || 0)),
            maxY: Math.max((b1.y || b1.minY || 0) + (b1.height || 0), (b2.y || b2.minY || 0) + (b2.height || 0))
        };
    }

    /**
     * Render boolean result to buffer
     * @param {object} buffer - ASCII buffer
     * @param {Set<string>} pointSet - Result point set
     * @param {string} char - Character to use
     * @param {string} color - Color (optional)
     */
    static renderToBuffer(buffer, pointSet, char = '█', color = null) {
        for (const point of pointSet) {
            const [x, y] = point.split(',').map(Number);
            buffer.setChar(x, y, char, color);
        }
    }
}

/**
 * Outline extraction - get the outline of a boolean result
 */
export class OutlineExtractor {
    /**
     * Extract outline from point set
     * @param {Set<string>} pointSet - Set of points
     * @returns {Set<string>} - Outline points
     */
    static extract(pointSet) {
        const outline = new Set();
        
        for (const point of pointSet) {
            const [x, y] = point.split(',').map(Number);
            
            // Check if this point is on the edge (has at least one non-filled neighbor)
            const neighbors = [
                `${x-1},${y}`, `${x+1},${y}`,
                `${x},${y-1}`, `${x},${y+1}`
            ];
            
            for (const neighbor of neighbors) {
                if (!pointSet.has(neighbor)) {
                    outline.add(point);
                    break;
                }
            }
        }
        
        return outline;
    }
}

export default {
    BooleanOps,
    OutlineExtractor
};
