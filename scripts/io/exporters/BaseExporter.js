/**
 * Asciistrator - Base Exporter
 * 
 * Base class for all export format handlers.
 * Provides common functionality and interface definition.
 * 
 * @version 1.0.0
 */

import { 
    ExportCategory, 
    ExportResult, 
    ValidationResult, 
    DefaultExportOptions 
} from '../ExporterRegistry.js';

// ==========================================
// BASE EXPORTER CLASS
// ==========================================

/**
 * Base class for all exporters
 * Implements the IExporter interface with common functionality
 */
export class BaseExporter {
    /**
     * @param {object} config - Exporter configuration
     */
    constructor(config = {}) {
        // Required properties - must be overridden
        if (this.constructor === BaseExporter) {
            throw new Error('BaseExporter is abstract and cannot be instantiated directly');
        }
        
        // Store configuration
        this._config = config;
    }
    
    // ==========================================
    // METADATA (Override in subclasses)
    // ==========================================
    
    /**
     * Unique identifier for this exporter
     * @returns {string}
     */
    get id() {
        throw new Error('Subclass must implement id getter');
    }
    
    /**
     * Human-readable name
     * @returns {string}
     */
    get name() {
        throw new Error('Subclass must implement name getter');
    }
    
    /**
     * Description of the export format
     * @returns {string}
     */
    get description() {
        return '';
    }
    
    /**
     * File extension (with dot)
     * @returns {string}
     */
    get fileExtension() {
        return '.txt';
    }
    
    /**
     * MIME type for this format
     * @returns {string}
     */
    get mimeType() {
        return 'text/plain';
    }
    
    /**
     * Export category
     * @returns {string}
     */
    get category() {
        return ExportCategory.PlainText;
    }
    
    // ==========================================
    // CAPABILITIES (Override as needed)
    // ==========================================
    
    /**
     * Whether this exporter supports colors
     * @returns {boolean}
     */
    get supportsColors() {
        return false;
    }
    
    /**
     * Whether this exporter supports UI components
     * @returns {boolean}
     */
    get supportsComponents() {
        return false;
    }
    
    /**
     * Whether this exporter supports layers
     * @returns {boolean}
     */
    get supportsLayers() {
        return false;
    }
    
    /**
     * Whether this exporter supports animations
     * @returns {boolean}
     */
    get supportsAnimations() {
        return false;
    }
    
    /**
     * Whether this exporter can generate preview
     * @returns {boolean}
     */
    get supportsPreview() {
        return true;
    }
    
    /**
     * Get default options for this exporter
     * @returns {object}
     */
    get defaultOptions() {
        return { ...DefaultExportOptions };
    }
    
    // ==========================================
    // CORE EXPORT METHODS
    // ==========================================
    
    /**
     * Export a document to this format
     * @param {object} document - Document or buffer to export
     * @param {object} options - Export options
     * @returns {ExportResult}
     */
    export(document, options = {}) {
        const mergedOptions = this._mergeOptions(options);
        
        try {
            // Validate input
            const validation = this.validate(document);
            if (!validation.isValid) {
                return ExportResult.failure(validation.errors.map(e => e.message));
            }
            
            // Perform export
            const content = this._doExport(document, mergedOptions);
            
            // Create result
            const result = ExportResult.success(content);
            
            // Add metadata
            result.setMetadata('exporter', this.id);
            result.setMetadata('format', this.name);
            result.setMetadata('options', mergedOptions);
            
            // Add any warnings from validation
            validation.warnings.forEach(w => result.addWarning(w.message));
            
            return result;
            
        } catch (error) {
            console.error(`Export error in ${this.id}:`, error);
            return ExportResult.failure([`Export failed: ${error.message}`]);
        }
    }
    
    /**
     * Export a single UI component
     * @param {object} component - UI component to export
     * @param {object} options - Export options
     * @returns {string}
     */
    exportComponent(component, options = {}) {
        const mergedOptions = this._mergeOptions(options);
        return this._doExportComponent(component, mergedOptions);
    }
    
    /**
     * Export only selected objects
     * @param {object} selection - Selection containing objects to export
     * @param {object} options - Export options
     * @returns {ExportResult}
     */
    exportSelection(selection, options = {}) {
        const mergedOptions = this._mergeOptions(options);
        
        try {
            const content = this._doExportSelection(selection, mergedOptions);
            const result = ExportResult.success(content);
            result.setMetadata('selectionCount', selection.count || 0);
            return result;
        } catch (error) {
            return ExportResult.failure([`Selection export failed: ${error.message}`]);
        }
    }
    
    // ==========================================
    // PREVIEW & VALIDATION
    // ==========================================
    
    /**
     * Generate a preview of the export
     * @param {object} document - Document to preview
     * @param {object} options - Export options
     * @returns {string}
     */
    preview(document, options = {}) {
        const mergedOptions = this._mergeOptions(options);
        return this._doPreview(document, mergedOptions);
    }
    
    /**
     * Validate a document for export
     * @param {object} document - Document to validate
     * @returns {ValidationResult}
     */
    validate(document) {
        const result = new ValidationResult();
        
        // Basic validation
        if (!document) {
            result.addError('INVALID_INPUT', 'Document is null or undefined');
            return result;
        }
        
        // Check for buffer
        if (!this._hasBuffer(document)) {
            result.addWarning('NO_BUFFER', 'Document has no buffer - using empty content');
        }
        
        // Subclass-specific validation
        this._doValidate(document, result);
        
        return result;
    }
    
    // ==========================================
    // DOWNLOAD METHODS
    // ==========================================
    
    /**
     * Download the exported content as a file
     * @param {object} document - Document to export
     * @param {string} filename - Filename (optional)
     * @param {object} options - Export options
     */
    download(document, filename = null, options = {}) {
        const result = this.export(document, options);
        
        if (!result.success) {
            console.error('Export failed:', result.errors);
            return;
        }
        
        const targetFilename = filename || `export${this.fileExtension}`;
        this._downloadBlob(result.content, targetFilename, this.mimeType);
        
        // Also download additional files
        for (const [additionalFilename, content] of result.additionalFiles) {
            const ext = additionalFilename.split('.').pop();
            const mime = this._getMimeTypeForExtension(ext);
            this._downloadBlob(content, additionalFilename, mime);
        }
    }
    
    /**
     * Download content as blob
     * @protected
     */
    _downloadBlob(content, filename, mimeType) {
        let blob;
        
        if (content instanceof Blob) {
            blob = content;
        } else if (typeof content === 'string') {
            blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        } else {
            blob = new Blob([JSON.stringify(content)], { type: 'application/json' });
        }
        
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Get MIME type for file extension
     * @protected
     */
    _getMimeTypeForExtension(ext) {
        const mimeTypes = {
            txt: 'text/plain',
            html: 'text/html',
            htm: 'text/html',
            css: 'text/css',
            js: 'application/javascript',
            json: 'application/json',
            xml: 'application/xml',
            svg: 'image/svg+xml',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            pdf: 'application/pdf',
            md: 'text/markdown',
            xaml: 'application/xaml+xml',
            axaml: 'application/xaml+xml',
            cs: 'text/plain',
            jsx: 'text/javascript',
            tsx: 'text/typescript',
            vue: 'text/html'
        };
        
        return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
    }
    
    // ==========================================
    // INTERNAL METHODS (Override in subclasses)
    // ==========================================
    
    /**
     * Actual export implementation - must be overridden
     * @protected
     * @param {object} document - Document to export
     * @param {object} options - Merged options
     * @returns {string|Blob}
     */
    _doExport(document, options) {
        throw new Error('Subclass must implement _doExport()');
    }
    
    /**
     * Export a component - can be overridden
     * @protected
     * @param {object} component - Component to export
     * @param {object} options - Merged options
     * @returns {string}
     */
    _doExportComponent(component, options) {
        // Default: export component's rendered buffer
        if (component.render) {
            const buffer = component.render();
            return this._doExport({ buffer }, options);
        }
        return '';
    }
    
    /**
     * Export selection - can be overridden
     * @protected
     * @param {object} selection - Selection to export
     * @param {object} options - Merged options
     * @returns {string}
     */
    _doExportSelection(selection, options) {
        // Default: export selection as document
        return this._doExport(selection, options);
    }
    
    /**
     * Generate preview - can be overridden
     * @protected
     * @param {object} document - Document to preview
     * @param {object} options - Merged options
     * @returns {string}
     */
    _doPreview(document, options) {
        // Default: same as export with preview flag
        return this._doExport(document, { ...options, isPreview: true });
    }
    
    /**
     * Additional validation - can be overridden
     * @protected
     * @param {object} document - Document to validate
     * @param {ValidationResult} result - Result to add errors/warnings to
     */
    _doValidate(document, result) {
        // Subclasses can add specific validation
    }
    
    // ==========================================
    // HELPER METHODS
    // ==========================================
    
    /**
     * Merge options with defaults
     * @protected
     */
    _mergeOptions(options) {
        return {
            ...this.defaultOptions,
            ...options
        };
    }
    
    /**
     * Check if document has a buffer
     * @protected
     */
    _hasBuffer(document) {
        return document && (
            document.buffer ||
            document.getBuffer ||
            (typeof document.getChar === 'function')
        );
    }
    
    /**
     * Get buffer from document
     * @protected
     */
    _getBuffer(document) {
        if (!document) return null;
        
        if (document.buffer) return document.buffer;
        if (typeof document.getBuffer === 'function') return document.getBuffer();
        if (typeof document.getChar === 'function') return document;
        
        return null;
    }
    
    /**
     * Get buffer dimensions
     * @protected
     */
    _getBufferDimensions(buffer) {
        if (!buffer) return { width: 0, height: 0 };
        
        return {
            width: buffer.width || 0,
            height: buffer.height || 0
        };
    }
    
    /**
     * Get character at position
     * @protected
     */
    _getChar(buffer, x, y) {
        if (typeof buffer.getChar === 'function') {
            return buffer.getChar(x, y);
        }
        if (buffer.data && buffer.data[y]) {
            return buffer.data[y][x] || ' ';
        }
        return ' ';
    }
    
    /**
     * Get color at position
     * @protected
     */
    _getColor(buffer, x, y) {
        if (typeof buffer.getColor === 'function') {
            return buffer.getColor(x, y);
        }
        if (buffer.colors && buffer.colors[y]) {
            return buffer.colors[y][x] || null;
        }
        return null;
    }
    
    /**
     * Escape HTML special characters
     * @protected
     */
    _escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    /**
     * Escape XML special characters
     * @protected
     */
    _escapeXml(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    /**
     * Generate indentation string
     * @protected
     */
    _indent(level, indentString = '    ') {
        return indentString.repeat(level);
    }
    
    /**
     * Get exporter info
     * @returns {object}
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            fileExtension: this.fileExtension,
            mimeType: this.mimeType,
            category: this.category,
            capabilities: {
                supportsColors: this.supportsColors,
                supportsComponents: this.supportsComponents,
                supportsLayers: this.supportsLayers,
                supportsAnimations: this.supportsAnimations,
                supportsPreview: this.supportsPreview
            }
        };
    }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default BaseExporter;
