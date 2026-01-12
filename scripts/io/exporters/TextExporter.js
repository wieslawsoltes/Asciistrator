/**
 * Asciistrator - Text Exporter
 * 
 * Exports ASCII art as plain text.
 * 
 * @version 1.0.0
 */

import BaseExporter from './BaseExporter.js';
import { ExportCategory } from '../ExporterRegistry.js';

// ==========================================
// TEXT EXPORTER
// ==========================================

/**
 * Plain text exporter for ASCII art
 */
export class TextExporter extends BaseExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'text'; }
    get name() { return 'Plain Text'; }
    get description() { return 'Export as plain text file (.txt)'; }
    get fileExtension() { return '.txt'; }
    get mimeType() { return 'text/plain'; }
    get category() { return ExportCategory.PlainText; }
    
    // ==========================================
    // CAPABILITIES
    // ==========================================
    
    get supportsColors() { return false; }
    get supportsComponents() { return false; }
    get supportsLayers() { return false; }
    get supportsAnimations() { return false; }
    
    get defaultOptions() {
        return {
            ...super.defaultOptions,
            trimTrailingSpaces: true,
            trimTrailingLines: true,
            lineEnding: '\n',
            preserveEmptyLines: false
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    /**
     * Export buffer to plain text
     * @protected
     */
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return '';
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const lines = [];
        
        for (let y = 0; y < height; y++) {
            let line = '';
            for (let x = 0; x < width; x++) {
                line += this._getChar(buffer, x, y);
            }
            
            // Trim trailing spaces if enabled
            if (options.trimTrailingSpaces) {
                line = line.trimEnd();
            }
            
            lines.push(line);
        }
        
        // Trim trailing empty lines if enabled
        if (options.trimTrailingLines) {
            while (lines.length > 0 && lines[lines.length - 1] === '') {
                lines.pop();
            }
        }
        
        // Remove consecutive empty lines if not preserving them
        if (!options.preserveEmptyLines) {
            const filteredLines = [];
            let prevEmpty = false;
            
            for (const line of lines) {
                const isEmpty = line.trim() === '';
                if (!isEmpty || !prevEmpty) {
                    filteredLines.push(line);
                }
                prevEmpty = isEmpty;
            }
            
            return filteredLines.join(options.lineEnding);
        }
        
        return lines.join(options.lineEnding);
    }
    
    /**
     * Preview is same as export for text
     * @protected
     */
    _doPreview(document, options) {
        return this._doExport(document, options);
    }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default TextExporter;
