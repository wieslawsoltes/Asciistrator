/**
 * Asciistrator - Text Object
 * 
 * Text rendering with ASCII art fonts and styling.
 */

import { SceneObject, Style } from './base.js';
import { Vector2D } from '../core/math/vector2d.js';

// ==========================================
// ASCII FONTS
// ==========================================

/**
 * ASCII art font definitions
 * Each character is defined as an array of strings (lines)
 */
export const AsciiFonts = {
    /**
     * Standard ASCII font (1 character = 1 cell)
     */
    STANDARD: {
        name: 'Standard',
        charWidth: 1,
        charHeight: 1,
        baseline: 0,
        chars: {} // Direct character mapping
    },
    
    /**
     * Banner font (large block letters)
     */
    BANNER: {
        name: 'Banner',
        charWidth: 6,
        charHeight: 5,
        baseline: 4,
        chars: {
            'A': [
                '  █   ',
                ' █ █  ',
                '█████ ',
                '█   █ ',
                '█   █ '
            ],
            'B': [
                '████  ',
                '█   █ ',
                '████  ',
                '█   █ ',
                '████  '
            ],
            'C': [
                ' ████ ',
                '█     ',
                '█     ',
                '█     ',
                ' ████ '
            ],
            'D': [
                '████  ',
                '█   █ ',
                '█   █ ',
                '█   █ ',
                '████  '
            ],
            'E': [
                '█████ ',
                '█     ',
                '████  ',
                '█     ',
                '█████ '
            ],
            'F': [
                '█████ ',
                '█     ',
                '████  ',
                '█     ',
                '█     '
            ],
            'G': [
                ' ████ ',
                '█     ',
                '█  ██ ',
                '█   █ ',
                ' ████ '
            ],
            'H': [
                '█   █ ',
                '█   █ ',
                '█████ ',
                '█   █ ',
                '█   █ '
            ],
            'I': [
                '█████ ',
                '  █   ',
                '  █   ',
                '  █   ',
                '█████ '
            ],
            'J': [
                '█████ ',
                '    █ ',
                '    █ ',
                '█   █ ',
                ' ███  '
            ],
            'K': [
                '█   █ ',
                '█  █  ',
                '███   ',
                '█  █  ',
                '█   █ '
            ],
            'L': [
                '█     ',
                '█     ',
                '█     ',
                '█     ',
                '█████ '
            ],
            'M': [
                '█   █ ',
                '██ ██ ',
                '█ █ █ ',
                '█   █ ',
                '█   █ '
            ],
            'N': [
                '█   █ ',
                '██  █ ',
                '█ █ █ ',
                '█  ██ ',
                '█   █ '
            ],
            'O': [
                ' ███  ',
                '█   █ ',
                '█   █ ',
                '█   █ ',
                ' ███  '
            ],
            'P': [
                '████  ',
                '█   █ ',
                '████  ',
                '█     ',
                '█     '
            ],
            'Q': [
                ' ███  ',
                '█   █ ',
                '█   █ ',
                '█  █  ',
                ' ██ █ '
            ],
            'R': [
                '████  ',
                '█   █ ',
                '████  ',
                '█  █  ',
                '█   █ '
            ],
            'S': [
                ' ████ ',
                '█     ',
                ' ███  ',
                '    █ ',
                '████  '
            ],
            'T': [
                '█████ ',
                '  █   ',
                '  █   ',
                '  █   ',
                '  █   '
            ],
            'U': [
                '█   █ ',
                '█   █ ',
                '█   █ ',
                '█   █ ',
                ' ███  '
            ],
            'V': [
                '█   █ ',
                '█   █ ',
                '█   █ ',
                ' █ █  ',
                '  █   '
            ],
            'W': [
                '█   █ ',
                '█   █ ',
                '█ █ █ ',
                '██ ██ ',
                '█   █ '
            ],
            'X': [
                '█   █ ',
                ' █ █  ',
                '  █   ',
                ' █ █  ',
                '█   █ '
            ],
            'Y': [
                '█   █ ',
                ' █ █  ',
                '  █   ',
                '  █   ',
                '  █   '
            ],
            'Z': [
                '█████ ',
                '   █  ',
                '  █   ',
                ' █    ',
                '█████ '
            ],
            '0': [
                ' ███  ',
                '█  ██ ',
                '█ █ █ ',
                '██  █ ',
                ' ███  '
            ],
            '1': [
                '  █   ',
                ' ██   ',
                '  █   ',
                '  █   ',
                '█████ '
            ],
            '2': [
                ' ███  ',
                '█   █ ',
                '  ██  ',
                ' █    ',
                '█████ '
            ],
            '3': [
                '████  ',
                '    █ ',
                ' ███  ',
                '    █ ',
                '████  '
            ],
            '4': [
                '█   █ ',
                '█   █ ',
                '█████ ',
                '    █ ',
                '    █ '
            ],
            '5': [
                '█████ ',
                '█     ',
                '████  ',
                '    █ ',
                '████  '
            ],
            '6': [
                ' ███  ',
                '█     ',
                '████  ',
                '█   █ ',
                ' ███  '
            ],
            '7': [
                '█████ ',
                '    █ ',
                '   █  ',
                '  █   ',
                '  █   '
            ],
            '8': [
                ' ███  ',
                '█   █ ',
                ' ███  ',
                '█   █ ',
                ' ███  '
            ],
            '9': [
                ' ███  ',
                '█   █ ',
                ' ████ ',
                '    █ ',
                ' ███  '
            ],
            ' ': [
                '      ',
                '      ',
                '      ',
                '      ',
                '      '
            ],
            '.': [
                '      ',
                '      ',
                '      ',
                '      ',
                '  █   '
            ],
            ',': [
                '      ',
                '      ',
                '      ',
                '  █   ',
                ' █    '
            ],
            '!': [
                '  █   ',
                '  █   ',
                '  █   ',
                '      ',
                '  █   '
            ],
            '?': [
                ' ███  ',
                '█   █ ',
                '  ██  ',
                '      ',
                '  █   '
            ],
            '-': [
                '      ',
                '      ',
                '█████ ',
                '      ',
                '      '
            ],
            ':': [
                '      ',
                '  █   ',
                '      ',
                '  █   ',
                '      '
            ]
        }
    },
    
    /**
     * Slant font (italic-like)
     */
    SLANT: {
        name: 'Slant',
        charWidth: 5,
        charHeight: 4,
        baseline: 3,
        chars: {
            'A': [
                '   /\\',
                '  /  \\',
                ' /----\\',
                '/      \\'
            ],
            'B': [
                '/==\\',
                '|__/',
                '|  \\',
                '\\==/'
            ],
            'C': [
                ' /==',
                '|',
                '|',
                ' \\=='
            ],
            ' ': [
                '    ',
                '    ',
                '    ',
                '    '
            ]
        }
    },
    
    /**
     * Box font (outlined letters)
     */
    BOX: {
        name: 'Box',
        charWidth: 5,
        charHeight: 5,
        baseline: 4,
        chars: {
            'A': [
                '┌───┐',
                '│   │',
                '├───┤',
                '│   │',
                '└   ┘'
            ],
            'B': [
                '┌───┐',
                '│   │',
                '├───┤',
                '│   │',
                '└───┘'
            ],
            'C': [
                '┌───┐',
                '│    ',
                '│    ',
                '│    ',
                '└───┘'
            ],
            'D': [
                '┌───┐',
                '│   │',
                '│   │',
                '│   │',
                '└───┘'
            ],
            'E': [
                '┌────',
                '│    ',
                '├───',
                '│    ',
                '└────'
            ],
            ' ': [
                '     ',
                '     ',
                '     ',
                '     ',
                '     '
            ]
        }
    },
    
    /**
     * Small font (3x3)
     */
    SMALL: {
        name: 'Small',
        charWidth: 3,
        charHeight: 3,
        baseline: 2,
        chars: {
            'A': ['▄█▄', '█▀█', '▀ ▀'],
            'B': ['██▄', '█▄▀', '██▀'],
            'C': ['▄█▀', '█  ', '▀█▄'],
            'D': ['██▄', '█ █', '██▀'],
            'E': ['███', '█▄ ', '███'],
            'F': ['███', '█▄ ', '█  '],
            'G': ['▄██', '█▄▄', '▀██'],
            'H': ['█ █', '███', '█ █'],
            'I': ['███', ' █ ', '███'],
            'J': ['▄██', ' ▄█', '▀█▀'],
            'K': ['█▄█', '██ ', '█ █'],
            'L': ['█  ', '█  ', '███'],
            'M': ['█▄█', '█▀█', '█ █'],
            'N': ['█▄█', '█▀█', '█ █'],
            'O': ['▄█▄', '█ █', '▀█▀'],
            'P': ['██▄', '█▀ ', '█  '],
            'Q': ['▄█▄', '█ █', '▀██'],
            'R': ['██▄', '██ ', '█ █'],
            'S': ['▄██', '▀█▄', '██▀'],
            'T': ['███', ' █ ', ' █ '],
            'U': ['█ █', '█ █', '▀█▀'],
            'V': ['█ █', '█ █', ' █ '],
            'W': ['█ █', '█▄█', '█▀█'],
            'X': ['█ █', ' █ ', '█ █'],
            'Y': ['█ █', ' █ ', ' █ '],
            'Z': ['██▄', '▄█▀', '███'],
            '0': ['▄█▄', '█ █', '▀█▀'],
            '1': ['▄█ ', ' █ ', '▄█▄'],
            '2': ['▀█▄', '▄█▀', '███'],
            '3': ['██▄', ' █▄', '██▀'],
            '4': ['█ █', '███', '  █'],
            '5': ['███', '█▄ ', '▄█▀'],
            '6': ['▄█▄', '██▄', '▀█▀'],
            '7': ['███', '  █', '  █'],
            '8': ['▄█▄', '▄█▄', '▀█▀'],
            '9': ['▄█▄', '▀██', '▀█▀'],
            ' ': ['   ', '   ', '   '],
            '.': ['   ', '   ', ' ▄ '],
            ',': ['   ', '   ', ' ▄▀'],
            '!': [' █ ', ' █ ', ' ▄ '],
            '?': ['▀█▄', ' █ ', ' ▄ '],
            '-': ['   ', '▀▀▀', '   '],
            ':': [' ▄ ', '   ', ' ▄ ']
        }
    },
    
    /**
     * Mini font (1x1 but with enhanced characters)
     */
    MINI: {
        name: 'Mini',
        charWidth: 1,
        charHeight: 1,
        baseline: 0,
        chars: {
            // Uses superscript/subscript Unicode chars
            '0': ['⁰'], '1': ['¹'], '2': ['²'], '3': ['³'], '4': ['⁴'],
            '5': ['⁵'], '6': ['⁶'], '7': ['⁷'], '8': ['⁸'], '9': ['⁹'],
            '+': ['⁺'], '-': ['⁻'], '=': ['⁼'], '(': ['⁽'], ')': ['⁾']
        }
    }
};

// ==========================================
// TEXT ALIGNMENT
// ==========================================

export const TextAlign = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
    JUSTIFY: 'justify'
};

export const VerticalAlign = {
    TOP: 'top',
    MIDDLE: 'middle',
    BOTTOM: 'bottom'
};

// ==========================================
// TEXT
// ==========================================

/**
 * Text - Text object with ASCII art font support
 */
export class Text extends SceneObject {
    /**
     * Create a text object
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'text';
        this.name = options.name || 'Text';
        
        /** @type {string} Text content */
        this.text = options.text || 'Text';
        
        /** @type {string} Font name */
        this.fontName = options.fontName || 'STANDARD';
        
        /** @type {string} Text alignment */
        this.align = options.align || TextAlign.LEFT;
        
        /** @type {string} Vertical alignment */
        this.verticalAlign = options.verticalAlign || VerticalAlign.TOP;
        
        /** @type {number} Line height multiplier */
        this.lineHeight = options.lineHeight || 1.2;
        
        /** @type {number} Letter spacing */
        this.letterSpacing = options.letterSpacing || 0;
        
        /** @type {number|null} Max width for wrapping */
        this.maxWidth = options.maxWidth || null;
        
        /** @type {boolean} Word wrap enabled */
        this.wordWrap = options.wordWrap || false;
        
        /** @type {string} Character used for text (standard font) */
        this.textChar = options.textChar || null;
        
        // Cached layout
        this._cachedLines = null;
        this._cachedBounds = null;
    }
    
    /**
     * Get font definition
     * @returns {object}
     */
    getFont() {
        return AsciiFonts[this.fontName] || AsciiFonts.STANDARD;
    }
    
    /**
     * Set text content
     * @param {string} text 
     */
    setText(text) {
        this.text = text;
        this._invalidateText();
    }
    
    /**
     * Set font
     * @param {string} fontName 
     */
    setFont(fontName) {
        this.fontName = fontName;
        this._invalidateText();
    }
    
    /**
     * Set alignment
     * @param {string} align 
     */
    setAlign(align) {
        this.align = align;
        this._invalidateText();
    }
    
    /**
     * Invalidate text layout cache
     * @private
     */
    _invalidateText() {
        this._cachedLines = null;
        this._cachedBounds = null;
        this._invalidateGeometry();
    }
    
    /**
     * Get character glyph
     * @param {string} char 
     * @returns {string[]}
     */
    getCharGlyph(char) {
        const font = this.getFont();
        
        if (font.name === 'Standard' || !font.chars) {
            return [this.textChar || char];
        }
        
        // Try uppercase
        let glyph = font.chars[char.toUpperCase()];
        if (glyph) return glyph;
        
        // Try lowercase
        glyph = font.chars[char.toLowerCase()];
        if (glyph) return glyph;
        
        // Try as-is
        glyph = font.chars[char];
        if (glyph) return glyph;
        
        // Default to space or character
        return font.chars[' '] || [char];
    }
    
    /**
     * Layout text into lines
     * @returns {Array<{text: string, width: number, y: number}>}
     */
    layoutText() {
        if (this._cachedLines) return this._cachedLines;
        
        const font = this.getFont();
        const lines = [];
        
        // Split by newlines
        const rawLines = this.text.split('\n');
        
        for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
            const line = rawLines[lineIdx];
            
            if (this.wordWrap && this.maxWidth) {
                // Word wrap
                const wrappedLines = this._wrapLine(line, font);
                lines.push(...wrappedLines);
            } else {
                lines.push({
                    text: line,
                    width: this._measureLine(line, font),
                    y: lines.length * font.charHeight * this.lineHeight
                });
            }
        }
        
        this._cachedLines = lines;
        return lines;
    }
    
    /**
     * Wrap a line to fit maxWidth
     * @private
     */
    _wrapLine(line, font) {
        const words = line.split(' ');
        const wrappedLines = [];
        let currentLine = '';
        let currentWidth = 0;
        
        for (const word of words) {
            const wordWidth = this._measureLine(word, font);
            const spaceWidth = font.charWidth + this.letterSpacing;
            
            if (currentLine && currentWidth + spaceWidth + wordWidth > this.maxWidth) {
                wrappedLines.push({
                    text: currentLine,
                    width: currentWidth,
                    y: wrappedLines.length * font.charHeight * this.lineHeight
                });
                currentLine = word;
                currentWidth = wordWidth;
            } else {
                if (currentLine) {
                    currentLine += ' ' + word;
                    currentWidth += spaceWidth + wordWidth;
                } else {
                    currentLine = word;
                    currentWidth = wordWidth;
                }
            }
        }
        
        if (currentLine) {
            wrappedLines.push({
                text: currentLine,
                width: currentWidth,
                y: wrappedLines.length * font.charHeight * this.lineHeight
            });
        }
        
        return wrappedLines;
    }
    
    /**
     * Measure line width
     * @private
     */
    _measureLine(text, font) {
        return text.length * (font.charWidth + this.letterSpacing) - this.letterSpacing;
    }
    
    /**
     * Get total text bounds
     * @returns {{width: number, height: number}}
     */
    getTextBounds() {
        if (this._cachedBounds) return this._cachedBounds;
        
        const font = this.getFont();
        const lines = this.layoutText();
        
        let maxWidth = 0;
        for (const line of lines) {
            maxWidth = Math.max(maxWidth, line.width);
        }
        
        const totalHeight = lines.length * font.charHeight * this.lineHeight;
        
        this._cachedBounds = {
            width: maxWidth,
            height: totalHeight
        };
        
        return this._cachedBounds;
    }
    
    /**
     * Get local bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        const { width, height } = this.getTextBounds();
        
        // Origin at top-left
        return {
            minX: 0,
            minY: 0,
            maxX: width,
            maxY: height
        };
    }
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        const local = this.worldToLocal(x, y);
        const bounds = this.getLocalBounds();
        
        return local.x >= bounds.minX && local.x <= bounds.maxX &&
               local.y >= bounds.minY && local.y <= bounds.maxY;
    }
    
    /**
     * Rasterize to ASCII cells
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        const cells = [];
        const font = this.getFont();
        const lines = this.layoutText();
        const { width: totalWidth, height: totalHeight } = this.getTextBounds();
        const transform = this.getWorldTransform();
        
        for (const lineData of lines) {
            // Calculate line x offset based on alignment
            let xOffset = 0;
            switch (this.align) {
                case TextAlign.CENTER:
                    xOffset = (totalWidth - lineData.width) / 2;
                    break;
                case TextAlign.RIGHT:
                    xOffset = totalWidth - lineData.width;
                    break;
            }
            
            // Render each character
            let charX = xOffset;
            
            for (const char of lineData.text) {
                const glyph = this.getCharGlyph(char);
                
                // Render glyph
                for (let gy = 0; gy < glyph.length; gy++) {
                    const glyphLine = glyph[gy];
                    
                    for (let gx = 0; gx < glyphLine.length; gx++) {
                        const glyphChar = glyphLine[gx];
                        
                        if (glyphChar && glyphChar !== ' ') {
                            const localPos = {
                                x: charX + gx,
                                y: lineData.y + gy
                            };
                            
                            const worldPos = transform.transformPoint(localPos);
                            
                            cells.push({
                                x: Math.round(worldPos.x),
                                y: Math.round(worldPos.y),
                                char: this.textChar || glyphChar,
                                color: this.style.strokeColor
                            });
                        }
                    }
                }
                
                charX += font.charWidth + this.letterSpacing;
            }
        }
        
        return cells;
    }
    
    /**
     * Render standard font (1 char = 1 cell)
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterizeStandard() {
        const cells = [];
        const lines = this.text.split('\n');
        const transform = this.getWorldTransform();
        
        for (let y = 0; y < lines.length; y++) {
            const line = lines[y];
            
            for (let x = 0; x < line.length; x++) {
                const char = line[x];
                
                if (char !== ' ') {
                    const localPos = { x, y };
                    const worldPos = transform.transformPoint(localPos);
                    
                    cells.push({
                        x: Math.round(worldPos.x),
                        y: Math.round(worldPos.y),
                        char: this.textChar || char,
                        color: this.style.strokeColor
                    });
                }
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
            text: this.text,
            fontName: this.fontName,
            align: this.align,
            verticalAlign: this.verticalAlign,
            lineHeight: this.lineHeight,
            letterSpacing: this.letterSpacing,
            maxWidth: this.maxWidth,
            wordWrap: this.wordWrap,
            textChar: this.textChar
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.text = data.text || 'Text';
        this.fontName = data.fontName || 'STANDARD';
        this.align = data.align || TextAlign.LEFT;
        this.verticalAlign = data.verticalAlign || VerticalAlign.TOP;
        this.lineHeight = data.lineHeight || 1.2;
        this.letterSpacing = data.letterSpacing || 0;
        this.maxWidth = data.maxWidth || null;
        this.wordWrap = data.wordWrap || false;
        this.textChar = data.textChar || null;
        this._invalidateText();
    }
    
    /**
     * Clone text
     * @returns {Text}
     */
    clone() {
        const cloned = new Text();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
}

// ==========================================
// TEXT ON PATH
// ==========================================

/**
 * TextOnPath - Text that follows a path
 */
export class TextOnPath extends SceneObject {
    /**
     * Create text on path
     * @param {object} [options]
     */
    constructor(options = {}) {
        super(options);
        
        this.type = 'textOnPath';
        this.name = options.name || 'Text on Path';
        
        /** @type {string} Text content */
        this.text = options.text || 'Text on Path';
        
        /** @type {string|null} Path object ID */
        this.pathId = options.pathId || null;
        
        /** @type {number} Starting offset (0-1 or absolute) */
        this.startOffset = options.startOffset || 0;
        
        /** @type {boolean} Use percent for offset */
        this.offsetPercent = options.offsetPercent !== false;
        
        /** @type {number} Letter spacing */
        this.letterSpacing = options.letterSpacing || 1;
        
        /** @type {boolean} Stretch to fit path */
        this.stretchToFit = options.stretchToFit || false;
        
        /** @type {string} Character for text */
        this.textChar = options.textChar || null;
        
        // Reference to path object
        this._pathRef = null;
    }
    
    /**
     * Set path reference
     * @param {Path} path 
     */
    setPath(path) {
        this._pathRef = path;
        this.pathId = path ? path.id : null;
        this._invalidateGeometry();
    }
    
    /**
     * Get local bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getLocalBounds() {
        if (!this._pathRef) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }
        return this._pathRef.getLocalBounds();
    }
    
    /**
     * Detailed hit test
     * @protected
     */
    _detailedHitTest(x, y) {
        // Hit test is handled by checking proximity to rendered characters
        const cells = this.rasterize();
        const local = this.worldToLocal(x, y);
        
        for (const cell of cells) {
            if (Math.abs(cell.x - local.x) < 1 && Math.abs(cell.y - local.y) < 1) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Rasterize text along path
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        if (!this._pathRef) return [];
        
        const cells = [];
        const pathLength = this._pathRef.getLength();
        const transform = this.getWorldTransform();
        
        // Calculate spacing
        let totalTextLength = this.text.length * this.letterSpacing;
        let effectiveSpacing = this.letterSpacing;
        
        if (this.stretchToFit && this.text.length > 1) {
            effectiveSpacing = pathLength / (this.text.length - 1);
            totalTextLength = pathLength;
        }
        
        // Calculate start offset
        let offset = this.offsetPercent 
            ? this.startOffset * pathLength 
            : this.startOffset;
        
        // Render each character
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            
            if (char !== ' ') {
                const distance = offset + i * effectiveSpacing;
                
                if (distance >= 0 && distance <= pathLength) {
                    const point = this._pathRef.getPointAtLength(distance);
                    
                    if (point) {
                        const worldPos = transform.transformPoint(point);
                        
                        cells.push({
                            x: Math.round(worldPos.x),
                            y: Math.round(worldPos.y),
                            char: this.textChar || char,
                            color: this.style.strokeColor
                        });
                    }
                }
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
            text: this.text,
            pathId: this.pathId,
            startOffset: this.startOffset,
            offsetPercent: this.offsetPercent,
            letterSpacing: this.letterSpacing,
            stretchToFit: this.stretchToFit,
            textChar: this.textChar
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.text = data.text || 'Text on Path';
        this.pathId = data.pathId || null;
        this.startOffset = data.startOffset || 0;
        this.offsetPercent = data.offsetPercent !== false;
        this.letterSpacing = data.letterSpacing || 1;
        this.stretchToFit = data.stretchToFit || false;
        this.textChar = data.textChar || null;
        this._invalidateGeometry();
    }
    
    /**
     * Clone
     * @returns {TextOnPath}
     */
    clone() {
        const cloned = new TextOnPath();
        cloned.fromJSON(this.toJSON());
        cloned.id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        cloned.name = this.name + ' (copy)';
        return cloned;
    }
}

export default {
    AsciiFonts,
    TextAlign,
    VerticalAlign,
    Text,
    TextOnPath
};
