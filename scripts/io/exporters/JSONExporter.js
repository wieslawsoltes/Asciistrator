/**
 * Asciistrator - JSON Exporter
 * 
 * Exports ASCII art to JSON format with full metadata.
 * 
 * @version 1.0.0
 */

import BaseExporter from './BaseExporter.js';
import { ExportCategory } from '../ExporterRegistry.js';

// ==========================================
// JSON EXPORTER
// ==========================================

/**
 * JSON exporter for data interchange and storage
 */
export class JSONExporter extends BaseExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'json'; }
    get name() { return 'JSON'; }
    get description() { return 'Export as JSON data format (.json)'; }
    get fileExtension() { return '.json'; }
    get mimeType() { return 'application/json'; }
    get category() { return ExportCategory.Document; }
    
    // ==========================================
    // CAPABILITIES
    // ==========================================
    
    get supportsColors() { return true; }
    get supportsComponents() { return true; }
    get supportsLayers() { return true; }
    get supportsAnimations() { return false; }
    
    get defaultOptions() {
        return {
            ...super.defaultOptions,
            pretty: true,
            indentSize: 2,
            includeMetadata: true,
            includeColors: true,
            includeObjects: false,
            includeLayers: false,
            compactFormat: false, // Use array of strings vs grid
            includeStatistics: true
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        const result = {
            format: 'asciistrator-json',
            version: '1.0.0'
        };
        
        // Add metadata
        if (options.includeMetadata) {
            result.metadata = this._generateMetadata(document, buffer, options);
        }
        
        // Add content
        if (buffer) {
            const { width, height } = this._getBufferDimensions(buffer);
            result.dimensions = { width, height };
            
            if (options.compactFormat) {
                result.content = this._exportCompact(buffer, width, height, options);
            } else {
                result.content = this._exportGrid(buffer, width, height, options);
            }
            
            // Add colors
            if (options.includeColors) {
                result.colors = this._exportColors(buffer, width, height);
            }
            
            // Add statistics
            if (options.includeStatistics) {
                result.statistics = this._generateStatistics(buffer, width, height);
            }
        } else {
            result.dimensions = { width: 0, height: 0 };
            result.content = [];
        }
        
        // Add objects if available
        if (options.includeObjects && document.objects) {
            result.objects = this._exportObjects(document);
        }
        
        // Add layers if available
        if (options.includeLayers && document.layers) {
            result.layers = this._exportLayers(document);
        }
        
        // Format output
        if (options.pretty) {
            return JSON.stringify(result, null, options.indentSize);
        }
        return JSON.stringify(result);
    }
    
    /**
     * Generate metadata
     * @private
     */
    _generateMetadata(document, buffer, options) {
        return {
            generator: 'Asciistrator',
            exportDate: new Date().toISOString(),
            title: document.title || 'Untitled',
            author: document.author || null,
            description: document.description || null
        };
    }
    
    /**
     * Export in compact format (array of strings)
     * @private
     */
    _exportCompact(buffer, width, height, options) {
        const lines = [];
        for (let y = 0; y < height; y++) {
            let line = '';
            for (let x = 0; x < width; x++) {
                line += this._getChar(buffer, x, y);
            }
            lines.push(line);
        }
        return lines;
    }
    
    /**
     * Export in grid format (2D array of cells)
     * @private
     */
    _exportGrid(buffer, width, height, options) {
        const grid = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const cell = {
                    char: this._getChar(buffer, x, y)
                };
                
                if (options.includeColors) {
                    const color = this._getColor(buffer, x, y);
                    if (color) {
                        cell.color = color;
                    }
                }
                
                row.push(cell);
            }
            grid.push(row);
        }
        return grid;
    }
    
    /**
     * Export color map
     * @private
     */
    _exportColors(buffer, width, height) {
        const colorMap = {};
        const colorGrid = [];
        let colorIndex = 0;
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const color = this._getColor(buffer, x, y);
                if (color) {
                    if (!(color in colorMap)) {
                        colorMap[color] = colorIndex++;
                    }
                    row.push(colorMap[color]);
                } else {
                    row.push(null);
                }
            }
            colorGrid.push(row);
        }
        
        return {
            palette: Object.keys(colorMap),
            map: colorGrid
        };
    }
    
    /**
     * Generate statistics
     * @private
     */
    _generateStatistics(buffer, width, height) {
        const charCounts = {};
        const colorCounts = {};
        let nonSpaceCount = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = this._getChar(buffer, x, y);
                charCounts[char] = (charCounts[char] || 0) + 1;
                
                if (char !== ' ') {
                    nonSpaceCount++;
                }
                
                const color = this._getColor(buffer, x, y);
                if (color) {
                    colorCounts[color] = (colorCounts[color] || 0) + 1;
                }
            }
        }
        
        return {
            totalCells: width * height,
            nonSpaceCells: nonSpaceCount,
            fillRatio: nonSpaceCount / (width * height),
            uniqueCharacters: Object.keys(charCounts).length,
            uniqueColors: Object.keys(colorCounts).length,
            characterFrequency: charCounts,
            colorFrequency: colorCounts
        };
    }
    
    /**
     * Export objects
     * @private
     */
    _exportObjects(document) {
        if (!document.objects) return [];
        
        return document.objects.map(obj => ({
            type: obj.type,
            id: obj.id,
            bounds: obj.bounds,
            properties: obj.properties
        }));
    }
    
    /**
     * Export layers
     * @private
     */
    _exportLayers(document) {
        if (!document.layers) return [];
        
        return document.layers.map(layer => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: layer.locked,
            opacity: layer.opacity
        }));
    }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default JSONExporter;
