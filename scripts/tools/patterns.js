/**
 * Asciistrator - Pattern Fill
 * 
 * Fill shapes with repeating ASCII patterns.
 * Includes predefined patterns and custom pattern support.
 */

/**
 * Predefined ASCII fill patterns
 */
export const Patterns = {
    // Solid fills
    solid: {
        width: 1,
        height: 1,
        pattern: ['█']
    },
    
    // Density patterns
    light: {
        width: 1,
        height: 1,
        pattern: ['░']
    },
    medium: {
        width: 1,
        height: 1,
        pattern: ['▒']
    },
    dark: {
        width: 1,
        height: 1,
        pattern: ['▓']
    },
    
    // Checkerboard patterns
    checker: {
        width: 2,
        height: 2,
        pattern: [
            '█ ',
            ' █'
        ]
    },
    checkerSmall: {
        width: 2,
        height: 2,
        pattern: [
            '▓░',
            '░▓'
        ]
    },
    
    // Stripe patterns
    horizontalStripes: {
        width: 1,
        height: 2,
        pattern: [
            '─',
            ' '
        ]
    },
    verticalStripes: {
        width: 2,
        height: 1,
        pattern: ['│ ']
    },
    diagonalStripes: {
        width: 4,
        height: 4,
        pattern: [
            '╲   ',
            ' ╲  ',
            '  ╲ ',
            '   ╲'
        ]
    },
    diagonalStripesReverse: {
        width: 4,
        height: 4,
        pattern: [
            '   ╱',
            '  ╱ ',
            ' ╱  ',
            '╱   '
        ]
    },
    
    // Crosshatch patterns
    crosshatch: {
        width: 4,
        height: 4,
        pattern: [
            '┼───',
            '│   ',
            '│   ',
            '│   '
        ]
    },
    crosshatchDense: {
        width: 2,
        height: 2,
        pattern: [
            '┼─',
            '│ '
        ]
    },
    
    // Dot patterns
    dots: {
        width: 2,
        height: 2,
        pattern: [
            '· ',
            '  '
        ]
    },
    dotsDense: {
        width: 2,
        height: 2,
        pattern: [
            '· ',
            ' ·'
        ]
    },
    
    // Circle patterns
    circles: {
        width: 4,
        height: 2,
        pattern: [
            '○   ',
            '  ○ '
        ]
    },
    
    // Star patterns
    stars: {
        width: 4,
        height: 4,
        pattern: [
            '*   ',
            '    ',
            '  * ',
            '    '
        ]
    },
    
    // Wave patterns
    waves: {
        width: 6,
        height: 2,
        pattern: [
            '∼∼∼   ',
            '   ∼∼∼'
        ]
    },
    
    // Brick patterns
    brick: {
        width: 6,
        height: 3,
        pattern: [
            '█████ ',
            '██ ███',
            '█████ '
        ]
    },
    brickSmall: {
        width: 4,
        height: 2,
        pattern: [
            '▓▓▓ ',
            ' ▓▓▓'
        ]
    },
    
    // Diamond pattern
    diamond: {
        width: 4,
        height: 4,
        pattern: [
            '  ◆ ',
            ' ◆ ◆',
            '  ◆ ',
            ' ◆ ◆'
        ]
    },
    
    // Hash pattern
    hash: {
        width: 1,
        height: 1,
        pattern: ['#']
    },
    
    // Plus pattern
    plus: {
        width: 3,
        height: 3,
        pattern: [
            ' + ',
            '+++',
            ' + '
        ]
    },
    
    // Zigzag
    zigzag: {
        width: 4,
        height: 2,
        pattern: [
            '/\\/\\',
            '\\  /'
        ]
    },
    
    // Noise/random-like
    noise: {
        width: 4,
        height: 4,
        pattern: [
            '·  .',
            ' .· ',
            '.  ·',
            ' ·. '
        ]
    }
};

/**
 * Pattern Fill class - applies patterns to shapes
 */
export class PatternFill {
    /**
     * Create a pattern fill
     * @param {object} pattern - Pattern definition {width, height, pattern: string[]}
     * @param {object} options - Options
     */
    constructor(pattern, options = {}) {
        this.pattern = pattern;
        this.options = {
            offsetX: options.offsetX || 0,
            offsetY: options.offsetY || 0,
            color: options.color || null,
            transparent: options.transparent || ' '  // Character to treat as transparent
        };
    }

    /**
     * Get character at position
     * @param {number} x 
     * @param {number} y 
     * @returns {string}
     */
    getCharAt(x, y) {
        const px = ((x + this.options.offsetX) % this.pattern.width + this.pattern.width) % this.pattern.width;
        const py = ((y + this.options.offsetY) % this.pattern.height + this.pattern.height) % this.pattern.height;
        
        const row = this.pattern.pattern[py];
        return row ? row[px] || ' ' : ' ';
    }

    /**
     * Fill a region in the buffer
     * @param {object} buffer - ASCII buffer
     * @param {number} x - Start X
     * @param {number} y - Start Y
     * @param {number} width - Width
     * @param {number} height - Height
     */
    fillRect(buffer, x, y, width, height) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const char = this.getCharAt(x + dx, y + dy);
                if (char !== this.options.transparent) {
                    buffer.setChar(x + dx, y + dy, char, this.options.color);
                }
            }
        }
    }

    /**
     * Fill a set of points
     * @param {object} buffer - ASCII buffer
     * @param {Set<string>|Array} points - Points to fill ("x,y" strings or {x,y} objects)
     */
    fillPoints(buffer, points) {
        const pointArray = points instanceof Set ? Array.from(points) : points;
        
        for (const point of pointArray) {
            let x, y;
            if (typeof point === 'string') {
                [x, y] = point.split(',').map(Number);
            } else {
                x = point.x;
                y = point.y;
            }
            
            const char = this.getCharAt(x, y);
            if (char !== this.options.transparent) {
                buffer.setChar(x, y, char, this.options.color);
            }
        }
    }

    /**
     * Fill a shape using containsPoint method
     * @param {object} buffer - ASCII buffer
     * @param {object} shape - Shape with containsPoint and getBounds methods
     */
    fillShape(buffer, shape) {
        const bounds = shape.getBounds();
        
        for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
            for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
                if (shape.containsPoint(x, y)) {
                    const char = this.getCharAt(x, y);
                    if (char !== this.options.transparent) {
                        buffer.setChar(x, y, char, this.options.color);
                    }
                }
            }
        }
    }
}

/**
 * Create a custom pattern from string array
 * @param {string[]} lines - Array of strings defining the pattern
 * @returns {object} - Pattern definition
 */
export function createPattern(lines) {
    const height = lines.length;
    const width = Math.max(...lines.map(l => l.length));
    
    // Pad lines to consistent width
    const pattern = lines.map(line => line.padEnd(width, ' '));
    
    return {
        width,
        height,
        pattern
    };
}

/**
 * Create a pattern from a single character with spacing
 * @param {string} char - Character to use
 * @param {number} spacingX - Horizontal spacing
 * @param {number} spacingY - Vertical spacing
 * @returns {object} - Pattern definition
 */
export function createCharPattern(char, spacingX = 2, spacingY = 2) {
    const pattern = [];
    
    for (let y = 0; y < spacingY; y++) {
        let row = '';
        for (let x = 0; x < spacingX; x++) {
            row += (x === 0 && y === 0) ? char : ' ';
        }
        pattern.push(row);
    }
    
    return {
        width: spacingX,
        height: spacingY,
        pattern
    };
}

export default {
    Patterns,
    PatternFill,
    createPattern,
    createCharPattern
};
