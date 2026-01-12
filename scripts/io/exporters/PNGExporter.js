/**
 * Asciistrator - PNG Exporter
 * 
 * Renders ASCII art to PNG image using canvas.
 * 
 * @version 1.0.0
 */

import BaseExporter from './BaseExporter.js';
import { ExportCategory } from '../ExporterRegistry.js';

// ==========================================
// PNG EXPORTER
// ==========================================

/**
 * PNG image exporter using canvas rendering
 */
export class PNGExporter extends BaseExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'png'; }
    get name() { return 'PNG Image'; }
    get description() { return 'Export as PNG image (.png)'; }
    get fileExtension() { return '.png'; }
    get mimeType() { return 'image/png'; }
    get category() { return ExportCategory.Image; }
    
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
            cellWidth: 10,
            cellHeight: 18,
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 14,
            fontWeight: 'normal',
            backgroundColor: '#1a1a2e',
            defaultColor: '#e0e0e0',
            scale: 1,
            padding: 20,
            antiAlias: true,
            quality: 1.0
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    /**
     * Export buffer to PNG data URL
     * @protected
     */
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._createEmptyImage(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        
        // Calculate canvas size
        const canvasWidth = Math.ceil(width * options.cellWidth * options.scale + options.padding * 2);
        const canvasHeight = Math.ceil(height * options.cellHeight * options.scale + options.padding * 2);
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Configure rendering
        if (!options.antiAlias) {
            ctx.imageSmoothingEnabled = false;
        }
        
        // Draw background
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Setup font
        const scaledFontSize = options.fontSize * options.scale;
        ctx.font = `${options.fontWeight} ${scaledFontSize}px ${options.fontFamily}`;
        ctx.textBaseline = 'top';
        
        // Render characters
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = this._getChar(buffer, x, y);
                if (char === ' ') continue; // Skip spaces for performance
                
                const color = this._getColor(buffer, x, y) || options.defaultColor;
                ctx.fillStyle = color;
                
                const px = options.padding + x * options.cellWidth * options.scale;
                const py = options.padding + y * options.cellHeight * options.scale;
                
                ctx.fillText(char, px, py);
            }
        }
        
        // Return as data URL
        return canvas.toDataURL('image/png', options.quality);
    }
    
    /**
     * Export to Blob (for better file downloads)
     * @param {object} document - Document to export
     * @param {object} options - Export options
     * @returns {Promise<Blob>}
     */
    async exportBlob(document, options = {}) {
        const mergedOptions = this._mergeOptions(options);
        const buffer = this._getBuffer(document);
        
        if (!buffer) {
            return new Blob([await this._createEmptyImageBlob(mergedOptions)], { type: 'image/png' });
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        
        // Calculate canvas size
        const canvasWidth = Math.ceil(width * mergedOptions.cellWidth * mergedOptions.scale + mergedOptions.padding * 2);
        const canvasHeight = Math.ceil(height * mergedOptions.cellHeight * mergedOptions.scale + mergedOptions.padding * 2);
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Configure rendering
        if (!mergedOptions.antiAlias) {
            ctx.imageSmoothingEnabled = false;
        }
        
        // Draw background
        ctx.fillStyle = mergedOptions.backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Setup font
        const scaledFontSize = mergedOptions.fontSize * mergedOptions.scale;
        ctx.font = `${mergedOptions.fontWeight} ${scaledFontSize}px ${mergedOptions.fontFamily}`;
        ctx.textBaseline = 'top';
        
        // Render characters
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = this._getChar(buffer, x, y);
                if (char === ' ') continue;
                
                const color = this._getColor(buffer, x, y) || mergedOptions.defaultColor;
                ctx.fillStyle = color;
                
                const px = mergedOptions.padding + x * mergedOptions.cellWidth * mergedOptions.scale;
                const py = mergedOptions.padding + y * mergedOptions.cellHeight * mergedOptions.scale;
                
                ctx.fillText(char, px, py);
            }
        }
        
        // Convert to Blob
        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png', mergedOptions.quality);
        });
    }
    
    /**
     * Create empty placeholder image
     * @private
     */
    _createEmptyImage(options) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 200;
        canvas.height = 100;
        
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, 200, 100);
        
        ctx.fillStyle = options.defaultColor;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Empty', 100, 50);
        
        return canvas.toDataURL('image/png');
    }
    
    /**
     * Create empty placeholder image as Blob
     * @private
     */
    _createEmptyImageBlob(options) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 200;
            canvas.height = 100;
            
            ctx.fillStyle = options.backgroundColor;
            ctx.fillRect(0, 0, 200, 100);
            
            ctx.fillStyle = options.defaultColor;
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Empty', 100, 50);
            
            canvas.toBlob(resolve, 'image/png');
        });
    }
    
    /**
     * Download as PNG file (override for better blob handling)
     */
    async download(doc, filename = null, options = {}) {
        const blob = await this.exportBlob(doc, options);
        const targetFilename = filename || `export${this.fileExtension}`;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = targetFilename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Generate preview (returns data URL)
     * @protected
     */
    _doPreview(document, options) {
        // For preview, use smaller scale
        return this._doExport(document, { ...options, scale: 0.5 });
    }
    
    /**
     * Validation
     * @protected
     */
    _doValidate(document, result) {
        const buffer = this._getBuffer(document);
        if (buffer) {
            const { width, height } = this._getBufferDimensions(buffer);
            const options = this.defaultOptions;
            
            // Calculate estimated image size
            const pixelWidth = width * options.cellWidth * options.scale + options.padding * 2;
            const pixelHeight = height * options.cellHeight * options.scale + options.padding * 2;
            const estimatedPixels = pixelWidth * pixelHeight;
            
            // Warn about very large images
            if (estimatedPixels > 16000000) { // ~4K resolution
                result.addWarning(
                    'LARGE_IMAGE',
                    'Export will create a very large image',
                    { pixelWidth, pixelHeight, estimatedPixels }
                );
            }
            
            // Error if too large
            if (estimatedPixels > 268435456) { // Canvas limit
                result.addError(
                    'IMAGE_TOO_LARGE',
                    'Image exceeds canvas size limits',
                    { pixelWidth, pixelHeight }
                );
            }
        }
    }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default PNGExporter;
