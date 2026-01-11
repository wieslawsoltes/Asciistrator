/**
 * Asciistrator - ASCII Gradients
 * 
 * Creates gradient fills using varying ASCII characters.
 * Supports linear and radial gradients.
 */

/**
 * Default gradient character sets (from lightest to darkest)
 */
export const GradientPalettes = {
    blocks: ' ░▒▓█',
    standard: ' .:-=+*#%@',
    detailed: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
    simple: ' .-+*#@',
    dots: ' ·∘○●',
    minimal: '  ░█'
};

/**
 * Gradient stop definition
 */
export class GradientStop {
    /**
     * @param {number} position - Position (0-1)
     * @param {string} char - Character at this stop
     * @param {string} color - Color at this stop (optional)
     */
    constructor(position, char, color = null) {
        this.position = Math.max(0, Math.min(1, position));
        this.char = char;
        this.color = color;
    }
}

/**
 * Base Gradient class
 */
export class Gradient {
    constructor(options = {}) {
        this.stops = [];
        this.palette = options.palette || GradientPalettes.blocks;
        this.reverse = options.reverse || false;
    }

    /**
     * Add a gradient stop
     * @param {number} position - Position (0-1)
     * @param {string} char - Character
     * @param {string} color - Color (optional)
     */
    addStop(position, char, color = null) {
        this.stops.push(new GradientStop(position, char, color));
        this.stops.sort((a, b) => a.position - b.position);
        return this;
    }

    /**
     * Create stops from a palette string
     * @param {string} palette - Palette string
     */
    fromPalette(palette) {
        this.stops = [];
        const chars = palette.split('');
        
        for (let i = 0; i < chars.length; i++) {
            const position = i / (chars.length - 1);
            this.addStop(position, chars[i]);
        }
        
        return this;
    }

    /**
     * Get character and color at a given t value (0-1)
     * @param {number} t - Position (0-1)
     * @returns {{char: string, color: string|null}}
     */
    getAt(t) {
        t = Math.max(0, Math.min(1, t));
        if (this.reverse) t = 1 - t;

        if (this.stops.length === 0) {
            // Use palette
            const chars = this.palette.split('');
            const index = Math.floor(t * (chars.length - 1));
            return { char: chars[index], color: null };
        }

        // Find surrounding stops
        let lower = this.stops[0];
        let upper = this.stops[this.stops.length - 1];

        for (let i = 0; i < this.stops.length - 1; i++) {
            if (t >= this.stops[i].position && t <= this.stops[i + 1].position) {
                lower = this.stops[i];
                upper = this.stops[i + 1];
                break;
            }
        }

        // Calculate position between stops
        const range = upper.position - lower.position;
        const localT = range > 0 ? (t - lower.position) / range : 0;

        // Choose character (threshold at 0.5)
        const char = localT < 0.5 ? lower.char : upper.char;
        
        // Interpolate color if both have colors
        let color = null;
        if (lower.color && upper.color) {
            color = this._interpolateColor(lower.color, upper.color, localT);
        } else {
            color = localT < 0.5 ? lower.color : upper.color;
        }

        return { char, color };
    }

    /**
     * Interpolate between two hex colors
     * @private
     */
    _interpolateColor(color1, color2, t) {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

/**
 * Linear Gradient - gradient along a direction
 */
export class LinearGradient extends Gradient {
    /**
     * @param {object} options
     * @param {number} options.angle - Angle in degrees (0 = left to right, 90 = top to bottom)
     * @param {number} options.startX - Start X (for custom direction)
     * @param {number} options.startY - Start Y
     * @param {number} options.endX - End X
     * @param {number} options.endY - End Y
     */
    constructor(options = {}) {
        super(options);
        
        this.angle = options.angle !== undefined ? options.angle : 0;
        this.startX = options.startX;
        this.startY = options.startY;
        this.endX = options.endX;
        this.endY = options.endY;
    }

    /**
     * Fill a rectangular region
     * @param {object} buffer - ASCII buffer
     * @param {number} x - Start X
     * @param {number} y - Start Y
     * @param {number} width - Width
     * @param {number} height - Height
     */
    fillRect(buffer, x, y, width, height) {
        // Calculate gradient direction
        let dx, dy;
        
        if (this.startX !== undefined && this.endX !== undefined) {
            dx = this.endX - this.startX;
            dy = this.endY - this.startY;
        } else {
            const rad = this.angle * Math.PI / 180;
            dx = Math.cos(rad);
            dy = Math.sin(rad);
        }
        
        // Normalize direction
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }

        // Calculate gradient length (diagonal of rect projected onto direction)
        const corners = [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: 0, y: height },
            { x: width, y: height }
        ];
        
        let minProj = Infinity, maxProj = -Infinity;
        for (const corner of corners) {
            const proj = corner.x * dx + corner.y * dy;
            minProj = Math.min(minProj, proj);
            maxProj = Math.max(maxProj, proj);
        }
        
        const gradientLen = maxProj - minProj;

        // Fill
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const proj = px * dx + py * dy;
                const t = gradientLen > 0 ? (proj - minProj) / gradientLen : 0;
                
                const { char, color } = this.getAt(t);
                buffer.setChar(x + px, y + py, char, color);
            }
        }
    }

    /**
     * Fill a set of points
     * @param {object} buffer - ASCII buffer
     * @param {Set<string>|Array} points - Points to fill
     * @param {object} bounds - Bounding box {minX, minY, maxX, maxY}
     */
    fillPoints(buffer, points, bounds) {
        const pointArray = points instanceof Set ? Array.from(points) : points;
        
        // Calculate gradient direction
        let dx, dy;
        if (this.startX !== undefined && this.endX !== undefined) {
            dx = this.endX - this.startX;
            dy = this.endY - this.startY;
        } else {
            const rad = this.angle * Math.PI / 180;
            dx = Math.cos(rad);
            dy = Math.sin(rad);
        }
        
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) { dx /= len; dy /= len; }
        
        // Calculate gradient range
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const corners = [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: 0, y: height },
            { x: width, y: height }
        ];
        
        let minProj = Infinity, maxProj = -Infinity;
        for (const corner of corners) {
            const proj = corner.x * dx + corner.y * dy;
            minProj = Math.min(minProj, proj);
            maxProj = Math.max(maxProj, proj);
        }
        
        const gradientLen = maxProj - minProj;

        for (const point of pointArray) {
            let px, py;
            if (typeof point === 'string') {
                [px, py] = point.split(',').map(Number);
            } else {
                px = point.x;
                py = point.y;
            }
            
            const localX = px - bounds.minX;
            const localY = py - bounds.minY;
            const proj = localX * dx + localY * dy;
            const t = gradientLen > 0 ? (proj - minProj) / gradientLen : 0;
            
            const { char, color } = this.getAt(t);
            buffer.setChar(px, py, char, color);
        }
    }
}

/**
 * Radial Gradient - gradient radiating from center
 */
export class RadialGradient extends Gradient {
    /**
     * @param {object} options
     * @param {number} options.centerX - Center X (relative to fill area)
     * @param {number} options.centerY - Center Y
     * @param {number} options.radius - Radius (optional, auto-calculated if not set)
     */
    constructor(options = {}) {
        super(options);
        
        this.centerX = options.centerX !== undefined ? options.centerX : 0.5;
        this.centerY = options.centerY !== undefined ? options.centerY : 0.5;
        this.radius = options.radius;
    }

    /**
     * Fill a rectangular region
     * @param {object} buffer - ASCII buffer
     * @param {number} x - Start X
     * @param {number} y - Start Y
     * @param {number} width - Width
     * @param {number} height - Height
     */
    fillRect(buffer, x, y, width, height) {
        // Calculate center
        const cx = this.centerX < 1 ? this.centerX * width : this.centerX;
        const cy = this.centerY < 1 ? this.centerY * height : this.centerY;
        
        // Calculate radius (if not set, use distance to furthest corner)
        let radius = this.radius;
        if (!radius) {
            const corners = [
                { x: 0, y: 0 },
                { x: width, y: 0 },
                { x: 0, y: height },
                { x: width, y: height }
            ];
            radius = Math.max(...corners.map(c => 
                Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2)
            ));
        }

        // Fill
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
                const t = radius > 0 ? Math.min(1, dist / radius) : 0;
                
                const { char, color } = this.getAt(t);
                buffer.setChar(x + px, y + py, char, color);
            }
        }
    }

    /**
     * Fill a set of points
     * @param {object} buffer - ASCII buffer
     * @param {Set<string>|Array} points - Points to fill
     * @param {object} bounds - Bounding box
     */
    fillPoints(buffer, points, bounds) {
        const pointArray = points instanceof Set ? Array.from(points) : points;
        
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        
        // Calculate center
        const cx = bounds.minX + (this.centerX < 1 ? this.centerX * width : this.centerX);
        const cy = bounds.minY + (this.centerY < 1 ? this.centerY * height : this.centerY);
        
        // Calculate radius
        let radius = this.radius;
        if (!radius) {
            const corners = [
                { x: bounds.minX, y: bounds.minY },
                { x: bounds.maxX, y: bounds.minY },
                { x: bounds.minX, y: bounds.maxY },
                { x: bounds.maxX, y: bounds.maxY }
            ];
            radius = Math.max(...corners.map(c => 
                Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2)
            ));
        }

        for (const point of pointArray) {
            let px, py;
            if (typeof point === 'string') {
                [px, py] = point.split(',').map(Number);
            } else {
                px = point.x;
                py = point.y;
            }
            
            const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
            const t = radius > 0 ? Math.min(1, dist / radius) : 0;
            
            const { char, color } = this.getAt(t);
            buffer.setChar(px, py, char, color);
        }
    }
}

/**
 * Conical/Angular Gradient - gradient sweeping around a center point
 */
export class ConicalGradient extends Gradient {
    /**
     * @param {object} options
     * @param {number} options.centerX - Center X (relative to fill area)
     * @param {number} options.centerY - Center Y
     * @param {number} options.startAngle - Start angle in degrees
     */
    constructor(options = {}) {
        super(options);
        
        this.centerX = options.centerX !== undefined ? options.centerX : 0.5;
        this.centerY = options.centerY !== undefined ? options.centerY : 0.5;
        this.startAngle = options.startAngle || 0;
    }

    /**
     * Fill a rectangular region
     */
    fillRect(buffer, x, y, width, height) {
        const cx = this.centerX < 1 ? this.centerX * width : this.centerX;
        const cy = this.centerY < 1 ? this.centerY * height : this.centerY;
        const startRad = this.startAngle * Math.PI / 180;

        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                let angle = Math.atan2(py - cy, px - cx) - startRad;
                
                // Normalize to 0-1
                let t = (angle + Math.PI) / (2 * Math.PI);
                t = ((t % 1) + 1) % 1;
                
                const { char, color } = this.getAt(t);
                buffer.setChar(x + px, y + py, char, color);
            }
        }
    }

    /**
     * Fill a set of points
     */
    fillPoints(buffer, points, bounds) {
        const pointArray = points instanceof Set ? Array.from(points) : points;
        
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const cx = bounds.minX + (this.centerX < 1 ? this.centerX * width : this.centerX);
        const cy = bounds.minY + (this.centerY < 1 ? this.centerY * height : this.centerY);
        const startRad = this.startAngle * Math.PI / 180;

        for (const point of pointArray) {
            let px, py;
            if (typeof point === 'string') {
                [px, py] = point.split(',').map(Number);
            } else {
                px = point.x;
                py = point.y;
            }
            
            let angle = Math.atan2(py - cy, px - cx) - startRad;
            let t = (angle + Math.PI) / (2 * Math.PI);
            t = ((t % 1) + 1) % 1;
            
            const { char, color } = this.getAt(t);
            buffer.setChar(px, py, char, color);
        }
    }
}

export default {
    GradientPalettes,
    GradientStop,
    Gradient,
    LinearGradient,
    RadialGradient,
    ConicalGradient
};
