/**
 * Asciistrator - LaTeX Exporter
 * 
 * Exports ASCII art to LaTeX format for document embedding.
 * 
 * @version 1.0.0
 */

import BaseExporter from './BaseExporter.js';
import { ExportCategory } from '../ExporterRegistry.js';

// ==========================================
// LATEX EXPORTER
// ==========================================

/**
 * LaTeX exporter for academic and document embedding
 */
export class LaTeXExporter extends BaseExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'latex'; }
    get name() { return 'LaTeX'; }
    get description() { return 'Export as LaTeX source (.tex)'; }
    get fileExtension() { return '.tex'; }
    get mimeType() { return 'application/x-latex'; }
    get category() { return ExportCategory.Document; }
    
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
            useListings: false, // Use listings package vs verbatim
            useXcolor: true, // Enable color support
            useFancyvrb: true, // Use fancyvrb for better verbatim
            fontSize: '\\small',
            fontFamily: '\\ttfamily',
            backgroundColor: 'black',
            defaultColor: 'white',
            wrapInDocument: false,
            wrapInFigure: false,
            figureCaption: 'ASCII Art',
            figureLabel: 'fig:ascii-art',
            lineNumbers: false
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._generateEmpty(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const lines = [];
        
        // Document wrapper
        if (options.wrapInDocument) {
            lines.push('\\documentclass{article}');
            lines.push('');
            lines.push('% Required packages');
            if (options.useXcolor) {
                lines.push('\\usepackage[dvipsnames,svgnames,x11names]{xcolor}');
            }
            if (options.useFancyvrb) {
                lines.push('\\usepackage{fancyvrb}');
            }
            if (options.useListings) {
                lines.push('\\usepackage{listings}');
            }
            lines.push('');
            lines.push('% Color definitions');
            lines.push(this._generateColorDefinitions(buffer, width, height, options));
            lines.push('');
            lines.push('\\begin{document}');
            lines.push('');
        }
        
        // Figure wrapper
        if (options.wrapInFigure) {
            lines.push('\\begin{figure}[htbp]');
            lines.push('\\centering');
        }
        
        // Content
        if (options.useListings) {
            lines.push(this._exportListings(buffer, width, height, options));
        } else if (options.useFancyvrb) {
            lines.push(this._exportFancyVerbatim(buffer, width, height, options));
        } else {
            lines.push(this._exportVerbatim(buffer, width, height, options));
        }
        
        // Figure end
        if (options.wrapInFigure) {
            lines.push(`\\caption{${this._escapeLatex(options.figureCaption)}}`);
            lines.push(`\\label{${options.figureLabel}}`);
            lines.push('\\end{figure}');
        }
        
        // Document end
        if (options.wrapInDocument) {
            lines.push('');
            lines.push('\\end{document}');
        }
        
        return lines.join('\n');
    }
    
    /**
     * Generate color definitions
     * @private
     */
    _generateColorDefinitions(buffer, width, height, options) {
        const colors = new Set();
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const color = this._getColor(buffer, x, y);
                if (color) colors.add(color);
            }
        }
        
        const defs = [];
        defs.push('% Custom color definitions');
        
        for (const color of colors) {
            const name = this._colorToName(color);
            const rgb = this._hexToRgb(color);
            if (rgb) {
                defs.push(`\\definecolor{${name}}{RGB}{${rgb.r},${rgb.g},${rgb.b}}`);
            }
        }
        
        return defs.join('\n');
    }
    
    /**
     * Export using listings package
     * @private
     */
    _exportListings(buffer, width, height, options) {
        const lines = [];
        
        // Configure listings
        lines.push('\\begin{lstlisting}[');
        lines.push('  basicstyle=' + options.fontFamily + options.fontSize + ',');
        lines.push(`  backgroundcolor=\\color{${options.backgroundColor}},`);
        lines.push('  frame=single,');
        lines.push('  breaklines=true,');
        if (options.lineNumbers) {
            lines.push('  numbers=left,');
        }
        lines.push(']');
        
        // Content
        for (let y = 0; y < height; y++) {
            let line = '';
            for (let x = 0; x < width; x++) {
                line += this._getChar(buffer, x, y);
            }
            lines.push(line);
        }
        
        lines.push('\\end{lstlisting}');
        
        return lines.join('\n');
    }
    
    /**
     * Export using fancyvrb package
     * @private
     */
    _exportFancyVerbatim(buffer, width, height, options) {
        const lines = [];
        
        // Check if colors are used
        const hasColors = this._hasColors(buffer, width, height);
        
        if (hasColors && options.useXcolor) {
            lines.push('\\begin{Verbatim}[commandchars=\\\\\\{\\}]');
            
            for (let y = 0; y < height; y++) {
                let line = '';
                let currentColor = null;
                
                for (let x = 0; x < width; x++) {
                    const char = this._getChar(buffer, x, y);
                    const color = this._getColor(buffer, x, y);
                    
                    if (color !== currentColor) {
                        if (currentColor !== null) {
                            line += '}';
                        }
                        if (color) {
                            const colorName = this._colorToName(color);
                            line += `\\textcolor{${colorName}}{`;
                        }
                        currentColor = color;
                    }
                    
                    line += this._escapeVerbatim(char);
                }
                
                if (currentColor !== null) {
                    line += '}';
                }
                
                lines.push(line);
            }
            
            lines.push('\\end{Verbatim}');
        } else {
            lines.push('\\begin{Verbatim}[frame=single]');
            
            for (let y = 0; y < height; y++) {
                let line = '';
                for (let x = 0; x < width; x++) {
                    line += this._getChar(buffer, x, y);
                }
                lines.push(line);
            }
            
            lines.push('\\end{Verbatim}');
        }
        
        return lines.join('\n');
    }
    
    /**
     * Export using basic verbatim
     * @private
     */
    _exportVerbatim(buffer, width, height, options) {
        const lines = [];
        
        lines.push('\\begin{verbatim}');
        
        for (let y = 0; y < height; y++) {
            let line = '';
            for (let x = 0; x < width; x++) {
                line += this._getChar(buffer, x, y);
            }
            lines.push(line);
        }
        
        lines.push('\\end{verbatim}');
        
        return lines.join('\n');
    }
    
    /**
     * Check if buffer has any colors
     * @private
     */
    _hasColors(buffer, width, height) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this._getColor(buffer, x, y)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Convert hex color to LaTeX color name
     * @private
     */
    _colorToName(hexColor) {
        return 'ascii' + hexColor.replace('#', '').toUpperCase();
    }
    
    /**
     * Convert hex to RGB
     * @private
     */
    _hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    /**
     * Escape LaTeX special characters
     * @private
     */
    _escapeLatex(text) {
        return text
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/[&%$#_{}]/g, '\\$&')
            .replace(/~/g, '\\textasciitilde{}')
            .replace(/\^/g, '\\textasciicircum{}');
    }
    
    /**
     * Escape characters for Verbatim with commandchars
     * @private
     */
    _escapeVerbatim(char) {
        if (char === '\\') return '\\textbackslash{}';
        if (char === '{') return '\\{';
        if (char === '}') return '\\}';
        return char;
    }
    
    /**
     * Generate empty content
     * @private
     */
    _generateEmpty(options) {
        const lines = [];
        if (options.wrapInDocument) {
            lines.push('\\documentclass{article}');
            lines.push('\\begin{document}');
        }
        lines.push('\\begin{verbatim}');
        lines.push('Empty');
        lines.push('\\end{verbatim}');
        if (options.wrapInDocument) {
            lines.push('\\end{document}');
        }
        return lines.join('\n');
    }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default LaTeXExporter;
