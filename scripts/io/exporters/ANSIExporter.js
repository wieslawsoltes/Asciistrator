/**
 * Asciistrator - ANSI Exporter
 * 
 * Exports ASCII art with ANSI color codes for terminal display.
 * 
 * @version 1.0.0
 */

import BaseExporter from './BaseExporter.js';
import { ExportCategory } from '../ExporterRegistry.js';

// ==========================================
// ANSI COLOR CONSTANTS
// ==========================================

/**
 * ANSI escape codes
 */
const ANSI = {
    // Control
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m',
    DIM: '\x1b[2m',
    ITALIC: '\x1b[3m',
    UNDERLINE: '\x1b[4m',
    BLINK: '\x1b[5m',
    REVERSE: '\x1b[7m',
    HIDDEN: '\x1b[8m',
    
    // Foreground colors (16 colors)
    FG_BLACK: '\x1b[30m',
    FG_RED: '\x1b[31m',
    FG_GREEN: '\x1b[32m',
    FG_YELLOW: '\x1b[33m',
    FG_BLUE: '\x1b[34m',
    FG_MAGENTA: '\x1b[35m',
    FG_CYAN: '\x1b[36m',
    FG_WHITE: '\x1b[37m',
    FG_BRIGHT_BLACK: '\x1b[90m',
    FG_BRIGHT_RED: '\x1b[91m',
    FG_BRIGHT_GREEN: '\x1b[92m',
    FG_BRIGHT_YELLOW: '\x1b[93m',
    FG_BRIGHT_BLUE: '\x1b[94m',
    FG_BRIGHT_MAGENTA: '\x1b[95m',
    FG_BRIGHT_CYAN: '\x1b[96m',
    FG_BRIGHT_WHITE: '\x1b[97m',
    
    // Background colors (16 colors)
    BG_BLACK: '\x1b[40m',
    BG_RED: '\x1b[41m',
    BG_GREEN: '\x1b[42m',
    BG_YELLOW: '\x1b[43m',
    BG_BLUE: '\x1b[44m',
    BG_MAGENTA: '\x1b[45m',
    BG_CYAN: '\x1b[46m',
    BG_WHITE: '\x1b[47m',
    BG_BRIGHT_BLACK: '\x1b[100m',
    BG_BRIGHT_RED: '\x1b[101m',
    BG_BRIGHT_GREEN: '\x1b[102m',
    BG_BRIGHT_YELLOW: '\x1b[103m',
    BG_BRIGHT_BLUE: '\x1b[104m',
    BG_BRIGHT_MAGENTA: '\x1b[105m',
    BG_BRIGHT_CYAN: '\x1b[106m',
    BG_BRIGHT_WHITE: '\x1b[107m'
};

// ==========================================
// ANSI EXPORTER
// ==========================================

/**
 * ANSI color code exporter for terminal display
 */
export class ANSIExporter extends BaseExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'ansi'; }
    get name() { return 'ANSI Terminal'; }
    get description() { return 'Export with ANSI color codes for terminal display (.ans)'; }
    get fileExtension() { return '.ans'; }
    get mimeType() { return 'text/plain'; }
    get category() { return ExportCategory.RichText; }
    
    // ==========================================
    // CAPABILITIES
    // ==========================================
    
    get supportsColors() { return true; }
    get supportsComponents() { return false; }
    get supportsLayers() { return false; }
    get supportsAnimations() { return false; }
    
    get defaultOptions() {
        return {
            ...super.defaultOptions,
            colorMode: '256',  // '16', '256', or 'truecolor'
            resetAtLineEnd: true,
            includeResetAtEnd: true
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    /**
     * Export buffer to ANSI colored text
     * @protected
     */
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return '';
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        let output = '';
        
        for (let y = 0; y < height; y++) {
            let currentColor = null;
            
            for (let x = 0; x < width; x++) {
                const char = this._getChar(buffer, x, y);
                const color = this._getColor(buffer, x, y);
                
                // Apply color change if different
                if (color !== currentColor) {
                    if (color) {
                        output += this._hexToAnsi(color, options.colorMode);
                    } else {
                        output += ANSI.RESET;
                    }
                    currentColor = color;
                }
                
                output += char;
            }
            
            // Reset at end of line if enabled
            if (options.resetAtLineEnd) {
                output += ANSI.RESET;
            }
            
            output += '\n';
        }
        
        // Add final reset if enabled
        if (options.includeResetAtEnd) {
            output += ANSI.RESET;
        }
        
        return output;
    }
    
    /**
     * Convert hex color to ANSI escape code
     * @private
     */
    _hexToAnsi(hex, colorMode = '256') {
        // Parse hex color
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        switch (colorMode) {
            case 'truecolor':
            case '24bit':
                return `\x1b[38;2;${r};${g};${b}m`;
                
            case '256':
                const ansi256 = this._rgbToAnsi256(r, g, b);
                return `\x1b[38;5;${ansi256}m`;
                
            case '16':
            default:
                return this._rgbToAnsi16(r, g, b);
        }
    }
    
    /**
     * Convert RGB to ANSI 256 color code
     * @private
     */
    _rgbToAnsi256(r, g, b) {
        // Check for grayscale
        if (r === g && g === b) {
            if (r < 8) return 16;
            if (r > 248) return 231;
            return Math.round((r - 8) / 247 * 24) + 232;
        }
        
        // Convert to 6x6x6 color cube
        const ri = Math.round(r / 255 * 5);
        const gi = Math.round(g / 255 * 5);
        const bi = Math.round(b / 255 * 5);
        
        return 16 + 36 * ri + 6 * gi + bi;
    }
    
    /**
     * Convert RGB to closest ANSI 16 color
     * @private
     */
    _rgbToAnsi16(r, g, b) {
        // Calculate brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        const bright = brightness > 128;
        
        // Determine base color
        const threshold = 128;
        const hasRed = r > threshold;
        const hasGreen = g > threshold;
        const hasBlue = b > threshold;
        
        let code = 30; // Base: black
        
        if (hasRed) code += 1;
        if (hasGreen) code += 2;
        if (hasBlue) code += 4;
        
        // Bright version
        if (bright && code === 30) {
            code = 90; // Bright black (gray)
        } else if (bright) {
            code += 60; // Bright colors start at 90
        }
        
        return `\x1b[${code}m`;
    }
    
    /**
     * Preview without ANSI codes (for display in UI)
     * @protected
     */
    _doPreview(document, options) {
        // For preview, show without ANSI codes
        const buffer = this._getBuffer(document);
        if (!buffer) return '';
        
        const { width, height } = this._getBufferDimensions(buffer);
        const lines = [];
        
        for (let y = 0; y < height; y++) {
            let line = '';
            for (let x = 0; x < width; x++) {
                line += this._getChar(buffer, x, y);
            }
            lines.push(line.trimEnd());
        }
        
        return lines.join('\n');
    }
}

// Export ANSI constants for external use
export { ANSI };

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default ANSIExporter;
