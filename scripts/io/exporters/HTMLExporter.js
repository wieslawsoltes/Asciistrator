/**
 * Asciistrator - HTML Exporter
 * 
 * Exports ASCII art as styled HTML with color support.
 * 
 * @version 1.0.0
 */

import BaseExporter from './BaseExporter.js';
import { ExportCategory } from '../ExporterRegistry.js';

// ==========================================
// HTML EXPORTER
// ==========================================

/**
 * HTML exporter with color and styling support
 */
export class HTMLExporter extends BaseExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'html'; }
    get name() { return 'HTML'; }
    get description() { return 'Export as styled HTML with color support (.html)'; }
    get fileExtension() { return '.html'; }
    get mimeType() { return 'text/html'; }
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
            fontFamily: "'Courier New', Consolas, 'Liberation Mono', monospace",
            fontSize: '14px',
            lineHeight: '1.2',
            backgroundColor: '#1a1a2e',
            defaultColor: '#e0e0e0',
            title: 'ASCII Art',
            includeStyles: true,
            wrapInDocument: true,
            useSpans: true,
            cssClass: 'ascii-art',
            responsive: false
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    /**
     * Export buffer to HTML
     * @protected
     */
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._wrapInDocument('', options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        let html = '';
        
        // Build HTML content with color spans
        for (let y = 0; y < height; y++) {
            let currentColor = null;
            let currentSpan = '';
            
            for (let x = 0; x < width; x++) {
                const char = this._getChar(buffer, x, y);
                const color = this._getColor(buffer, x, y);
                
                if (options.useSpans && color !== currentColor) {
                    // Close previous span
                    if (currentSpan) {
                        html += this._createColorSpan(currentSpan, currentColor, options);
                    }
                    currentColor = color;
                    currentSpan = char;
                } else {
                    currentSpan += char;
                }
            }
            
            // Close last span of line
            if (currentSpan) {
                html += this._createColorSpan(currentSpan, currentColor, options);
            }
            html += '\n';
        }
        
        // Wrap in document if needed
        if (options.wrapInDocument) {
            html = this._wrapInDocument(html, options);
        } else {
            html = `<pre class="${options.cssClass}">${html}</pre>`;
        }
        
        return html;
    }
    
    /**
     * Create a color span
     * @private
     */
    _createColorSpan(text, color, options) {
        const escapedText = this._escapeHtml(text);
        
        if (color && options.useSpans) {
            return `<span style="color:${color}">${escapedText}</span>`;
        }
        
        return escapedText;
    }
    
    /**
     * Wrap content in full HTML document
     * @private
     */
    _wrapInDocument(content, options) {
        const styles = options.includeStyles ? this._generateStyles(options) : '';
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this._escapeHtml(options.title)}</title>${styles}
</head>
<body>
<pre class="${options.cssClass}">${content}</pre>
</body>
</html>`;
    }
    
    /**
     * Generate CSS styles
     * @private
     */
    _generateStyles(options) {
        let css = `
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background-color: ${options.backgroundColor};
            padding: 20px;
            min-height: 100vh;
        }
        .${options.cssClass} {
            font-family: ${options.fontFamily};
            font-size: ${options.fontSize};
            line-height: ${options.lineHeight};
            color: ${options.defaultColor};
            white-space: pre;
            overflow-x: auto;
            tab-size: 4;
        }`;
        
        if (options.responsive) {
            css += `
        @media (max-width: 768px) {
            .${options.cssClass} {
                font-size: 12px;
            }
        }
        @media (max-width: 480px) {
            .${options.cssClass} {
                font-size: 10px;
            }
        }`;
        }
        
        css += `
    </style>`;
        
        return css;
    }
    
    /**
     * Generate preview (snippet only)
     * @protected
     */
    _doPreview(document, options) {
        const previewOptions = {
            ...options,
            wrapInDocument: false
        };
        return this._doExport(document, previewOptions);
    }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default HTMLExporter;
