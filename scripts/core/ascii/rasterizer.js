/**
 * Asciistrator - ASCII Rasterizer
 * 
 * Core rendering engine for rasterizing vector graphics to ASCII characters.
 * Implements line drawing, shape filling, and character mapping algorithms.
 */

import { Vector2D } from '../math/vector2d.js';
import { BoundingBox } from '../math/geometry.js';
import { 
    getCharForDensity, 
    getBoxChar, 
    BoxDrawing, 
    LineChars 
} from './charsets.js';

// ==========================================
// ASCII BUFFER
// ==========================================

/**
 * ASCII character buffer for rendering
 */
export class AsciiBuffer {
    /**
     * Create a new ASCII buffer
     * @param {number} width - Width in characters
     * @param {number} height - Height in characters
     * @param {string} [fillChar=' '] - Default fill character
     */
    constructor(width, height, fillChar = ' ') {
        this.width = width;
        this.height = height;
        this.fillChar = fillChar;
        
        // Character buffer
        this.chars = new Array(height);
        // Color buffer (optional, for colored output)
        this.colors = new Array(height);
        // Z-depth buffer (for layering)
        this.depth = new Array(height);
        
        this.clear();
    }

    /**
     * Clear the buffer
     * @param {string} [fillChar] - Character to fill with
     */
    clear(fillChar) {
        fillChar = fillChar || this.fillChar;
        for (let y = 0; y < this.height; y++) {
            this.chars[y] = new Array(this.width).fill(fillChar);
            this.colors[y] = new Array(this.width).fill(null);
            this.depth[y] = new Array(this.width).fill(-Infinity);
        }
    }

    /**
     * Resize the buffer
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        const oldChars = this.chars;
        const oldColors = this.colors;
        const oldWidth = this.width;
        const oldHeight = this.height;
        
        this.width = width;
        this.height = height;
        this.clear();
        
        // Copy old content
        const copyWidth = Math.min(oldWidth, width);
        const copyHeight = Math.min(oldHeight, height);
        
        for (let y = 0; y < copyHeight; y++) {
            for (let x = 0; x < copyWidth; x++) {
                this.chars[y][x] = oldChars[y][x];
                this.colors[y][x] = oldColors[y][x];
            }
        }
    }

    /**
     * Check if coordinates are within bounds
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /**
     * Set a character at position
     * @param {number} x 
     * @param {number} y 
     * @param {string} char 
     * @param {string} [color] - CSS color string
     * @param {number} [z=0] - Depth value
     */
    setChar(x, y, char, color = null, z = 0) {
        x = Math.round(x);
        y = Math.round(y);
        
        if (!this.inBounds(x, y)) return;
        
        // Only draw if z >= current depth
        if (z >= this.depth[y][x]) {
            this.chars[y][x] = char;
            this.colors[y][x] = color;
            this.depth[y][x] = z;
        }
    }

    /**
     * Get character at position
     * @param {number} x 
     * @param {number} y 
     * @returns {string}
     */
    getChar(x, y) {
        x = Math.round(x);
        y = Math.round(y);
        
        if (!this.inBounds(x, y)) return this.fillChar;
        return this.chars[y][x];
    }

    /**
     * Get color at position
     * @param {number} x 
     * @param {number} y 
     * @returns {string|null}
     */
    getColor(x, y) {
        x = Math.round(x);
        y = Math.round(y);
        
        if (!this.inBounds(x, y)) return null;
        return this.colors[y][x];
    }

    /**
     * Draw text at position
     * @param {number} x - Start X
     * @param {number} y - Y position
     * @param {string} text - Text to draw
     * @param {string} [color] 
     * @param {number} [z=0] 
     */
    drawText(x, y, text, color = null, z = 0) {
        for (let i = 0; i < text.length; i++) {
            this.setChar(x + i, y, text[i], color, z);
        }
    }

    /**
     * Copy a region from another buffer
     * @param {AsciiBuffer} source 
     * @param {number} srcX 
     * @param {number} srcY 
     * @param {number} destX 
     * @param {number} destY 
     * @param {number} width 
     * @param {number} height 
     */
    copyFrom(source, srcX, srcY, destX, destY, width, height) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = source.getChar(srcX + x, srcY + y);
                const color = source.getColor(srcX + x, srcY + y);
                if (char !== this.fillChar) {
                    this.setChar(destX + x, destY + y, char, color);
                }
            }
        }
    }

    /**
     * Convert buffer to string
     * @returns {string}
     */
    toString() {
        return this.chars.map(row => row.join('')).join('\n');
    }

    /**
     * Convert buffer to HTML with color spans
     * @returns {string}
     */
    toHTML() {
        const rows = [];
        for (let y = 0; y < this.height; y++) {
            let rowHtml = '';
            let currentColor = null;
            let batch = '';
            
            const flushBatch = () => {
                if (batch.length === 0) return;
                if (currentColor) {
                    rowHtml += `<span style="color:${currentColor}">${batch}</span>`;
                } else {
                    rowHtml += batch;
                }
                batch = '';
            };
            
            for (let x = 0; x < this.width; x++) {
                let char = this.chars[y][x];
                const color = this.colors[y][x];
                
                // Escape special HTML characters
                if (char === '&') char = '&amp;';
                else if (char === '<') char = '&lt;';
                else if (char === '>') char = '&gt;';
                
                // Batch same-colored chars together
                if (color !== currentColor) {
                    flushBatch();
                    currentColor = color;
                }
                batch += char;
            }
            flushBatch();
            rows.push(rowHtml);
        }
        return rows.join('\n');
    }

    /**
     * Get buffer as 2D array
     * @returns {string[][]}
     */
    toArray() {
        return this.chars.map(row => [...row]);
    }
}

// ==========================================
// LINE DRAWING ALGORITHMS
// ==========================================

/**
 * Bresenham's line algorithm
 * @param {number} x0 
 * @param {number} y0 
 * @param {number} x1 
 * @param {number} y1 
 * @returns {{x: number, y: number}[]}
 */
export function bresenhamLine(x0, y0, x1, y1) {
    const points = [];
    
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
        points.push({ x: x0, y: y0 });
        
        if (x0 === x1 && y0 === y1) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
    
    return points;
}

/**
 * Get the appropriate line character for a direction
 * @param {number} dx - X direction (-1, 0, 1)
 * @param {number} dy - Y direction (-1, 0, 1)
 * @param {string} [style='single'] - Line style
 * @returns {string}
 */
export function getLineChar(dx, dy, style = 'single') {
    // Normalize
    dx = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
    dy = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
    
    // Horizontal
    if (dy === 0) {
        switch (style) {
            case 'double': return '═';
            case 'heavy': return '━';
            case 'dashed': return '┄';
            case 'ascii': return '-';
            default: return '─';
        }
    }
    
    // Vertical
    if (dx === 0) {
        switch (style) {
            case 'double': return '║';
            case 'heavy': return '┃';
            case 'dashed': return '┆';
            case 'ascii': return '|';
            default: return '│';
        }
    }
    
    // Diagonal
    if ((dx > 0 && dy > 0) || (dx < 0 && dy < 0)) {
        return '\\';
    }
    return '/';
}

/**
 * Draw a line on the buffer
 * @param {AsciiBuffer} buffer 
 * @param {number} x0 
 * @param {number} y0 
 * @param {number} x1 
 * @param {number} y1 
 * @param {object} [options]
 * @param {string} [options.char] - Character to use (auto-detect if not specified)
 * @param {string} [options.style='single'] - Line style
 * @param {string} [options.color] - Color
 * @param {number} [options.z=0] - Z depth
 */
export function drawLine(buffer, x0, y0, x1, y1, options = {}) {
    const { char, style = 'single', color = null, z = 0 } = options;
    
    const points = bresenhamLine(x0, y0, x1, y1);
    
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        let c = char;
        
        if (!c) {
            // Auto-detect character based on direction
            const prev = points[i - 1] || p;
            const next = points[i + 1] || p;
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            c = getLineChar(dx, dy, style);
        }
        
        buffer.setChar(p.x, p.y, c, color, z);
    }
}

/**
 * Draw an anti-aliased line using Xiaolin Wu's algorithm
 * @param {AsciiBuffer} buffer 
 * @param {number} x0 
 * @param {number} y0 
 * @param {number} x1 
 * @param {number} y1 
 * @param {object} [options]
 * @param {string} [options.palette='minimal'] - Density palette
 * @param {string} [options.color] 
 * @param {number} [options.z=0] 
 */
export function drawLineAA(buffer, x0, y0, x1, y1, options = {}) {
    const { palette = 'minimal', color = null, z = 0 } = options;
    
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    
    if (steep) {
        [x0, y0] = [y0, x0];
        [x1, y1] = [y1, x1];
    }
    
    if (x0 > x1) {
        [x0, x1] = [x1, x0];
        [y0, y1] = [y1, y0];
    }
    
    const dx = x1 - x0;
    const dy = y1 - y0;
    const gradient = dx === 0 ? 1 : dy / dx;
    
    // Handle first endpoint
    let xend = Math.round(x0);
    let yend = y0 + gradient * (xend - x0);
    let xgap = 1 - (x0 + 0.5) % 1;
    const xpxl1 = xend;
    const ypxl1 = Math.floor(yend);
    
    const plot = (x, y, c) => {
        const char = getCharForDensity(c, palette);
        if (steep) {
            buffer.setChar(y, x, char, color, z);
        } else {
            buffer.setChar(x, y, char, color, z);
        }
    };
    
    plot(xpxl1, ypxl1, (1 - (yend % 1)) * xgap);
    plot(xpxl1, ypxl1 + 1, (yend % 1) * xgap);
    
    let intery = yend + gradient;
    
    // Handle second endpoint
    xend = Math.round(x1);
    yend = y1 + gradient * (xend - x1);
    xgap = (x1 + 0.5) % 1;
    const xpxl2 = xend;
    const ypxl2 = Math.floor(yend);
    
    plot(xpxl2, ypxl2, (1 - (yend % 1)) * xgap);
    plot(xpxl2, ypxl2 + 1, (yend % 1) * xgap);
    
    // Main loop
    for (let x = xpxl1 + 1; x < xpxl2; x++) {
        plot(x, Math.floor(intery), 1 - (intery % 1));
        plot(x, Math.floor(intery) + 1, intery % 1);
        intery += gradient;
    }
}

// ==========================================
// SHAPE DRAWING
// ==========================================

/**
 * Draw a rectangle outline
 * @param {AsciiBuffer} buffer 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {object} [options]
 * @param {string} [options.style='single'] - Box drawing style
 * @param {string} [options.color] 
 * @param {number} [options.z=0] 
 */
export function drawRect(buffer, x, y, width, height, options = {}) {
    const { style = 'single', color = null, z = 0 } = options;
    const box = BoxDrawing[style] || BoxDrawing.single;
    
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);
    
    if (width < 1 || height < 1) return;
    
    // Single character
    if (width === 1 && height === 1) {
        buffer.setChar(x, y, box.cross, color, z);
        return;
    }
    
    // Corners
    buffer.setChar(x, y, box.topLeft, color, z);
    buffer.setChar(x + width - 1, y, box.topRight, color, z);
    buffer.setChar(x, y + height - 1, box.bottomLeft, color, z);
    buffer.setChar(x + width - 1, y + height - 1, box.bottomRight, color, z);
    
    // Horizontal edges
    for (let i = 1; i < width - 1; i++) {
        buffer.setChar(x + i, y, box.horizontal, color, z);
        buffer.setChar(x + i, y + height - 1, box.horizontal, color, z);
    }
    
    // Vertical edges
    for (let i = 1; i < height - 1; i++) {
        buffer.setChar(x, y + i, box.vertical, color, z);
        buffer.setChar(x + width - 1, y + i, box.vertical, color, z);
    }
}

/**
 * Draw a filled rectangle
 * @param {AsciiBuffer} buffer 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {object} [options]
 * @param {string} [options.fillChar=' '] - Fill character
 * @param {string} [options.style='single'] - Border style
 * @param {boolean} [options.border=true] - Draw border
 * @param {string} [options.color] 
 * @param {string} [options.fillColor] 
 * @param {number} [options.z=0] 
 */
export function fillRect(buffer, x, y, width, height, options = {}) {
    const { 
        fillChar = ' ', 
        style = 'single', 
        border = true, 
        color = null, 
        fillColor = null,
        z = 0 
    } = options;
    
    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);
    
    // Fill interior
    const startX = border ? x + 1 : x;
    const startY = border ? y + 1 : y;
    const endX = border ? x + width - 1 : x + width;
    const endY = border ? y + height - 1 : y + height;
    
    for (let iy = startY; iy < endY; iy++) {
        for (let ix = startX; ix < endX; ix++) {
            buffer.setChar(ix, iy, fillChar, fillColor, z);
        }
    }
    
    // Draw border
    if (border) {
        drawRect(buffer, x, y, width, height, { style, color, z: z + 0.1 });
    }
}

/**
 * Draw an ellipse outline using midpoint algorithm
 * @param {AsciiBuffer} buffer 
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} rx - X radius
 * @param {number} ry - Y radius
 * @param {object} [options]
 * @param {string} [options.char='*'] - Character to use
 * @param {string} [options.color] 
 * @param {number} [options.z=0] 
 */
export function drawEllipse(buffer, cx, cy, rx, ry, options = {}) {
    const { char = '*', color = null, z = 0 } = options;
    
    cx = Math.round(cx);
    cy = Math.round(cy);
    rx = Math.round(rx);
    ry = Math.round(ry);
    
    if (rx <= 0 || ry <= 0) return;
    
    // Midpoint ellipse algorithm
    let x = 0;
    let y = ry;
    
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    const twoRx2 = 2 * rx2;
    const twoRy2 = 2 * ry2;
    
    let px = 0;
    let py = twoRx2 * y;
    
    // Plot initial points
    const plotEllipsePoints = (x, y) => {
        buffer.setChar(cx + x, cy + y, char, color, z);
        buffer.setChar(cx - x, cy + y, char, color, z);
        buffer.setChar(cx + x, cy - y, char, color, z);
        buffer.setChar(cx - x, cy - y, char, color, z);
    };
    
    plotEllipsePoints(x, y);
    
    // Region 1
    let p = Math.round(ry2 - (rx2 * ry) + (0.25 * rx2));
    while (px < py) {
        x++;
        px += twoRy2;
        if (p < 0) {
            p += ry2 + px;
        } else {
            y--;
            py -= twoRx2;
            p += ry2 + px - py;
        }
        plotEllipsePoints(x, y);
    }
    
    // Region 2
    p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
    while (y > 0) {
        y--;
        py -= twoRx2;
        if (p > 0) {
            p += rx2 - py;
        } else {
            x++;
            px += twoRy2;
            p += rx2 - py + px;
        }
        plotEllipsePoints(x, y);
    }
}

/**
 * Draw a circle outline
 * @param {AsciiBuffer} buffer 
 * @param {number} cx 
 * @param {number} cy 
 * @param {number} radius 
 * @param {object} [options] 
 */
export function drawCircle(buffer, cx, cy, radius, options = {}) {
    // Adjust for character aspect ratio (typically ~2:1)
    const aspectRatio = options.aspectRatio || 2;
    drawEllipse(buffer, cx, cy, Math.round(radius * aspectRatio), radius, options);
}

/**
 * Fill an ellipse
 * @param {AsciiBuffer} buffer 
 * @param {number} cx 
 * @param {number} cy 
 * @param {number} rx 
 * @param {number} ry 
 * @param {object} [options]
 * @param {string} [options.fillChar='█'] 
 * @param {string} [options.color] 
 * @param {number} [options.z=0] 
 */
export function fillEllipse(buffer, cx, cy, rx, ry, options = {}) {
    const { fillChar = '█', color = null, z = 0 } = options;
    
    cx = Math.round(cx);
    cy = Math.round(cy);
    rx = Math.round(rx);
    ry = Math.round(ry);
    
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    
    for (let y = -ry; y <= ry; y++) {
        for (let x = -rx; x <= rx; x++) {
            if ((x * x * ry2 + y * y * rx2) <= rx2 * ry2) {
                buffer.setChar(cx + x, cy + y, fillChar, color, z);
            }
        }
    }
}

/**
 * Fill a circle
 * @param {AsciiBuffer} buffer 
 * @param {number} cx 
 * @param {number} cy 
 * @param {number} radius 
 * @param {object} [options] 
 */
export function fillCircle(buffer, cx, cy, radius, options = {}) {
    const aspectRatio = options.aspectRatio || 2;
    fillEllipse(buffer, cx, cy, Math.round(radius * aspectRatio), radius, options);
}

/**
 * Draw a polygon outline
 * @param {AsciiBuffer} buffer 
 * @param {Vector2D[]|{x: number, y: number}[]} points 
 * @param {object} [options]
 * @param {boolean} [options.closed=true] 
 * @param {string} [options.style='single'] 
 * @param {string} [options.color] 
 * @param {number} [options.z=0] 
 */
export function drawPolygon(buffer, points, options = {}) {
    const { closed = true, style = 'single', color = null, z = 0 } = options;
    
    if (points.length < 2) return;
    
    for (let i = 0; i < points.length - 1; i++) {
        drawLine(buffer, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, 
                { style, color, z });
    }
    
    if (closed && points.length > 2) {
        drawLine(buffer, points[points.length - 1].x, points[points.length - 1].y,
                points[0].x, points[0].y, { style, color, z });
    }
}

/**
 * Fill a polygon using scanline algorithm
 * @param {AsciiBuffer} buffer 
 * @param {Vector2D[]|{x: number, y: number}[]} points 
 * @param {object} [options]
 * @param {string} [options.fillChar='█'] 
 * @param {string} [options.color] 
 * @param {number} [options.z=0] 
 */
export function fillPolygon(buffer, points, options = {}) {
    const { fillChar = '█', color = null, z = 0 } = options;
    
    if (points.length < 3) return;
    
    // Find bounding box
    let minY = Infinity, maxY = -Infinity;
    for (const p of points) {
        minY = Math.min(minY, Math.floor(p.y));
        maxY = Math.max(maxY, Math.ceil(p.y));
    }
    
    minY = Math.max(0, minY);
    maxY = Math.min(buffer.height - 1, maxY);
    
    // Scanline fill
    for (let y = minY; y <= maxY; y++) {
        const intersections = [];
        
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            const p1 = points[i];
            const p2 = points[j];
            
            if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                const x = p1.x + (y - p1.y) / (p2.y - p1.y) * (p2.x - p1.x);
                intersections.push(x);
            }
        }
        
        intersections.sort((a, b) => a - b);
        
        for (let i = 0; i < intersections.length - 1; i += 2) {
            const x1 = Math.max(0, Math.ceil(intersections[i]));
            const x2 = Math.min(buffer.width - 1, Math.floor(intersections[i + 1]));
            
            for (let x = x1; x <= x2; x++) {
                buffer.setChar(x, y, fillChar, color, z);
            }
        }
    }
}

// ==========================================
// FLOOD FILL
// ==========================================

/**
 * Flood fill algorithm (bucket fill)
 * @param {AsciiBuffer} buffer 
 * @param {number} startX 
 * @param {number} startY 
 * @param {string} fillChar 
 * @param {object} [options]
 * @param {string} [options.targetChar] - Only fill this character (default: current char at start)
 * @param {string} [options.color] 
 * @param {number} [options.z=0] 
 */
export function floodFill(buffer, startX, startY, fillChar, options = {}) {
    const { color = null, z = 0 } = options;
    
    startX = Math.round(startX);
    startY = Math.round(startY);
    
    if (!buffer.inBounds(startX, startY)) return;
    
    const targetChar = options.targetChar || buffer.getChar(startX, startY);
    
    if (targetChar === fillChar) return;
    
    const stack = [{ x: startX, y: startY }];
    const visited = new Set();
    
    while (stack.length > 0) {
        const { x, y } = stack.pop();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        if (!buffer.inBounds(x, y)) continue;
        if (buffer.getChar(x, y) !== targetChar) continue;
        
        visited.add(key);
        buffer.setChar(x, y, fillChar, color, z);
        
        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
    }
}

// ==========================================
// BEZIER CURVE RENDERING
// ==========================================

/**
 * Draw a quadratic bezier curve
 * @param {AsciiBuffer} buffer 
 * @param {number} x0 - Start X
 * @param {number} y0 - Start Y
 * @param {number} x1 - Control X
 * @param {number} y1 - Control Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @param {object} [options]
 * @param {string} [options.char='*'] 
 * @param {number} [options.segments=20] 
 * @param {string} [options.color] 
 * @param {number} [options.z=0] 
 */
export function drawQuadraticBezier(buffer, x0, y0, x1, y1, x2, y2, options = {}) {
    const { char = '*', segments = 20, color = null, z = 0 } = options;
    
    let prevX = x0;
    let prevY = y0;
    
    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const mt = 1 - t;
        
        const x = mt * mt * x0 + 2 * mt * t * x1 + t * t * x2;
        const y = mt * mt * y0 + 2 * mt * t * y1 + t * t * y2;
        
        drawLine(buffer, prevX, prevY, x, y, { char, color, z });
        
        prevX = x;
        prevY = y;
    }
}

/**
 * Draw a cubic bezier curve
 * @param {AsciiBuffer} buffer 
 * @param {number} x0 - Start X
 * @param {number} y0 - Start Y
 * @param {number} x1 - Control 1 X
 * @param {number} y1 - Control 1 Y
 * @param {number} x2 - Control 2 X
 * @param {number} y2 - Control 2 Y
 * @param {number} x3 - End X
 * @param {number} y3 - End Y
 * @param {object} [options]
 * @param {string} [options.char='*'] 
 * @param {number} [options.segments=30] 
 * @param {string} [options.color] 
 * @param {number} [options.z=0] 
 */
export function drawCubicBezier(buffer, x0, y0, x1, y1, x2, y2, x3, y3, options = {}) {
    const { char = '*', segments = 30, color = null, z = 0 } = options;
    
    let prevX = x0;
    let prevY = y0;
    
    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        
        const x = mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3;
        const y = mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3;
        
        drawLine(buffer, prevX, prevY, x, y, { char, color, z });
        
        prevX = x;
        prevY = y;
    }
}

// ==========================================
// ARC DRAWING
// ==========================================

/**
 * Draw an arc
 * @param {AsciiBuffer} buffer 
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius 
 * @param {number} startAngle - Start angle in radians
 * @param {number} endAngle - End angle in radians
 * @param {object} [options]
 * @param {string} [options.char='*'] 
 * @param {number} [options.aspectRatio=2] 
 * @param {string} [options.color] 
 * @param {number} [options.z=0] 
 */
export function drawArc(buffer, cx, cy, radius, startAngle, endAngle, options = {}) {
    const { char = '*', aspectRatio = 2, color = null, z = 0 } = options;
    
    const rx = radius * aspectRatio;
    const ry = radius;
    
    // Calculate number of segments based on arc length
    const arcLength = Math.abs(endAngle - startAngle);
    const segments = Math.max(10, Math.ceil(arcLength * radius / 2));
    
    let prevX = cx + rx * Math.cos(startAngle);
    let prevY = cy + ry * Math.sin(startAngle);
    
    buffer.setChar(Math.round(prevX), Math.round(prevY), char, color, z);
    
    for (let i = 1; i <= segments; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / segments);
        const x = cx + rx * Math.cos(angle);
        const y = cy + ry * Math.sin(angle);
        
        drawLine(buffer, prevX, prevY, x, y, { char, color, z });
        
        prevX = x;
        prevY = y;
    }
}

// ==========================================
// GRADIENT AND PATTERN FILL
// ==========================================

/**
 * Fill a rectangle with a horizontal gradient
 * @param {AsciiBuffer} buffer 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {object} [options]
 * @param {string} [options.palette='blocks'] 
 * @param {boolean} [options.reverse=false] 
 * @param {number} [options.z=0] 
 */
export function fillGradientH(buffer, x, y, width, height, options = {}) {
    const { palette = 'blocks', reverse = false, z = 0 } = options;
    
    for (let ix = 0; ix < width; ix++) {
        let density = ix / (width - 1);
        if (reverse) density = 1 - density;
        const char = getCharForDensity(density, palette);
        
        for (let iy = 0; iy < height; iy++) {
            buffer.setChar(x + ix, y + iy, char, null, z);
        }
    }
}

/**
 * Fill a rectangle with a vertical gradient
 * @param {AsciiBuffer} buffer 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {object} [options]
 * @param {string} [options.palette='blocks'] 
 * @param {boolean} [options.reverse=false] 
 * @param {number} [options.z=0] 
 */
export function fillGradientV(buffer, x, y, width, height, options = {}) {
    const { palette = 'blocks', reverse = false, z = 0 } = options;
    
    for (let iy = 0; iy < height; iy++) {
        let density = iy / (height - 1);
        if (reverse) density = 1 - density;
        const char = getCharForDensity(density, palette);
        
        for (let ix = 0; ix < width; ix++) {
            buffer.setChar(x + ix, y + iy, char, null, z);
        }
    }
}

/**
 * Fill with a pattern
 * @param {AsciiBuffer} buffer 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {string[]} pattern - 2D pattern array
 * @param {object} [options]
 * @param {number} [options.z=0] 
 */
export function fillPattern(buffer, x, y, width, height, pattern, options = {}) {
    const { z = 0 } = options;
    
    const patternHeight = pattern.length;
    const patternWidth = pattern[0].length;
    
    for (let iy = 0; iy < height; iy++) {
        for (let ix = 0; ix < width; ix++) {
            const py = iy % patternHeight;
            const px = ix % patternWidth;
            const char = pattern[py][px];
            buffer.setChar(x + ix, y + iy, char, null, z);
        }
    }
}

// ==========================================
// EXPORT
// ==========================================

export default {
    AsciiBuffer,
    bresenhamLine,
    getLineChar,
    drawLine,
    drawLineAA,
    drawRect,
    fillRect,
    drawEllipse,
    drawCircle,
    fillEllipse,
    fillCircle,
    drawPolygon,
    fillPolygon,
    floodFill,
    drawQuadraticBezier,
    drawCubicBezier,
    drawArc,
    fillGradientH,
    fillGradientV,
    fillPattern
};
