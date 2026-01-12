/**
 * Asciistrator - Exporter Registry
 * 
 * Central registry for all export format handlers.
 * Provides registration, lookup, and discovery of exporters.
 * 
 * @version 1.0.0
 */

// ==========================================
// EXPORT CATEGORY ENUM
// ==========================================

/**
 * Categories for organizing exporters
 */
export const ExportCategory = Object.freeze({
    PlainText: 'plain-text',
    RichText: 'rich-text',
    Image: 'image',
    Vector: 'vector',
    Document: 'document',
    UIFramework: 'ui-framework',
    WebFramework: 'web-framework',
    DesignTool: 'design-tool'
});

// ==========================================
// EXPORT OPTIONS
// ==========================================

/**
 * Style export modes
 */
export const StyleExportMode = Object.freeze({
    Inline: 'inline',
    External: 'external',
    Both: 'both'
});

/**
 * Default export options
 */
export const DefaultExportOptions = Object.freeze({
    // General options
    includeMetadata: true,
    preserveWhitespace: true,
    indentation: '    ',
    lineEnding: '\n',
    
    // Component-specific options
    componentPrefix: '',
    namespaceMapping: new Map(),
    styleExportMode: StyleExportMode.Inline,
    
    // UI Framework options
    targetFramework: null,
    frameworkVersion: null,
    useDataBinding: false,
    generateCodeBehind: false,
    generateViewModels: false,
    viewModelNamespace: 'ViewModels',
    
    // Image options
    scale: 1,
    backgroundColor: '#1a1a2e',
    foregroundColor: '#e0e0e0',
    fontFamily: 'Consolas, monospace',
    fontSize: 14,
    padding: 20
});

// ==========================================
// VALIDATION RESULT
// ==========================================

/**
 * Validation result for export operations
 */
export class ValidationResult {
    constructor() {
        this.isValid = true;
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }
    
    /**
     * Add an error
     * @param {string} code - Error code
     * @param {string} message - Error message
     * @param {object} details - Additional details
     */
    addError(code, message, details = {}) {
        this.isValid = false;
        this.errors.push({ code, message, details, severity: 'error' });
    }
    
    /**
     * Add a warning
     * @param {string} code - Warning code
     * @param {string} message - Warning message
     * @param {object} details - Additional details
     */
    addWarning(code, message, details = {}) {
        this.warnings.push({ code, message, details, severity: 'warning' });
    }
    
    /**
     * Add info message
     * @param {string} code - Info code
     * @param {string} message - Info message
     * @param {object} details - Additional details
     */
    addInfo(code, message, details = {}) {
        this.info.push({ code, message, details, severity: 'info' });
    }
    
    /**
     * Merge another validation result
     * @param {ValidationResult} other - Other result to merge
     */
    merge(other) {
        if (!other.isValid) {
            this.isValid = false;
        }
        this.errors.push(...other.errors);
        this.warnings.push(...other.warnings);
        this.info.push(...other.info);
    }
    
    /**
     * Get all messages sorted by severity
     * @returns {Array}
     */
    getAllMessages() {
        return [...this.errors, ...this.warnings, ...this.info];
    }
}

// ==========================================
// EXPORT RESULT
// ==========================================

/**
 * Result of an export operation
 */
export class ExportResult {
    /**
     * @param {boolean} success - Whether export succeeded
     * @param {string|Blob} content - Main export content
     */
    constructor(success, content = null) {
        this.success = success;
        this.content = content;
        this.errors = [];
        this.warnings = [];
        this.metadata = {};
        this.additionalFiles = new Map();
        this.timestamp = new Date().toISOString();
    }
    
    /**
     * Create a successful result
     * @param {string|Blob} content - Export content
     * @returns {ExportResult}
     */
    static success(content) {
        return new ExportResult(true, content);
    }
    
    /**
     * Create a failed result
     * @param {Array} errors - Error messages
     * @returns {ExportResult}
     */
    static failure(errors) {
        const result = new ExportResult(false, null);
        result.errors = Array.isArray(errors) ? errors : [errors];
        return result;
    }
    
    /**
     * Add an additional output file
     * @param {string} filename - File name
     * @param {string|Blob} content - File content
     */
    addFile(filename, content) {
        this.additionalFiles.set(filename, content);
    }
    
    /**
     * Add a warning
     * @param {string} message - Warning message
     */
    addWarning(message) {
        this.warnings.push(message);
    }
    
    /**
     * Set metadata
     * @param {string} key - Metadata key
     * @param {any} value - Metadata value
     */
    setMetadata(key, value) {
        this.metadata[key] = value;
    }
    
    /**
     * Get total output size in bytes
     * @returns {number}
     */
    getTotalSize() {
        let size = 0;
        
        if (this.content) {
            if (typeof this.content === 'string') {
                size += new Blob([this.content]).size;
            } else if (this.content instanceof Blob) {
                size += this.content.size;
            }
        }
        
        for (const [, content] of this.additionalFiles) {
            if (typeof content === 'string') {
                size += new Blob([content]).size;
            } else if (content instanceof Blob) {
                size += content.size;
            }
        }
        
        return size;
    }
}

// ==========================================
// EXPORTER REGISTRY
// ==========================================

/**
 * Central registry for all exporters
 */
export class ExporterRegistry {
    constructor() {
        /** @type {Map<string, IExporter>} */
        this._exporters = new Map();
        
        /** @type {Map<string, Set<string>>} */
        this._categoryIndex = new Map();
        
        /** @type {Map<string, string>} */
        this._extensionIndex = new Map();
        
        /** @type {Map<string, string>} */
        this._mimeTypeIndex = new Map();
    }
    
    // ==========================================
    // REGISTRATION
    // ==========================================
    
    /**
     * Register an exporter
     * @param {IExporter} exporter - Exporter instance to register
     * @throws {Error} If exporter is invalid or already registered
     */
    register(exporter) {
        // Validate exporter
        this._validateExporter(exporter);
        
        const id = exporter.id;
        
        // Check for duplicate
        if (this._exporters.has(id)) {
            throw new Error(`Exporter with id '${id}' is already registered`);
        }
        
        // Register exporter
        this._exporters.set(id, exporter);
        
        // Index by category
        const category = exporter.category || ExportCategory.PlainText;
        if (!this._categoryIndex.has(category)) {
            this._categoryIndex.set(category, new Set());
        }
        this._categoryIndex.get(category).add(id);
        
        // Index by file extension
        if (exporter.fileExtension) {
            const ext = exporter.fileExtension.toLowerCase();
            this._extensionIndex.set(ext, id);
        }
        
        // Index by MIME type
        if (exporter.mimeType) {
            this._mimeTypeIndex.set(exporter.mimeType, id);
        }
        
        console.debug(`Registered exporter: ${id} (${exporter.name})`);
    }
    
    /**
     * Unregister an exporter
     * @param {string} id - Exporter ID
     * @returns {boolean} True if unregistered, false if not found
     */
    unregister(id) {
        const exporter = this._exporters.get(id);
        if (!exporter) {
            return false;
        }
        
        // Remove from main registry
        this._exporters.delete(id);
        
        // Remove from category index
        const category = exporter.category || ExportCategory.PlainText;
        const categorySet = this._categoryIndex.get(category);
        if (categorySet) {
            categorySet.delete(id);
            if (categorySet.size === 0) {
                this._categoryIndex.delete(category);
            }
        }
        
        // Remove from extension index
        if (exporter.fileExtension) {
            const ext = exporter.fileExtension.toLowerCase();
            if (this._extensionIndex.get(ext) === id) {
                this._extensionIndex.delete(ext);
            }
        }
        
        // Remove from MIME type index
        if (exporter.mimeType) {
            if (this._mimeTypeIndex.get(exporter.mimeType) === id) {
                this._mimeTypeIndex.delete(exporter.mimeType);
            }
        }
        
        console.debug(`Unregistered exporter: ${id}`);
        return true;
    }
    
    /**
     * Validate an exporter before registration
     * @private
     */
    _validateExporter(exporter) {
        if (!exporter) {
            throw new Error('Exporter cannot be null or undefined');
        }
        
        if (!exporter.id || typeof exporter.id !== 'string') {
            throw new Error('Exporter must have a valid string id');
        }
        
        if (!exporter.name || typeof exporter.name !== 'string') {
            throw new Error('Exporter must have a valid string name');
        }
        
        if (typeof exporter.export !== 'function') {
            throw new Error('Exporter must have an export() method');
        }
    }
    
    // ==========================================
    // LOOKUP
    // ==========================================
    
    /**
     * Get an exporter by ID
     * @param {string} id - Exporter ID
     * @returns {IExporter|undefined}
     */
    get(id) {
        return this._exporters.get(id);
    }
    
    /**
     * Check if an exporter is registered
     * @param {string} id - Exporter ID
     * @returns {boolean}
     */
    has(id) {
        return this._exporters.has(id);
    }
    
    /**
     * Get exporter by file extension
     * @param {string} extension - File extension (with or without dot)
     * @returns {IExporter|undefined}
     */
    getByExtension(extension) {
        const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
        const id = this._extensionIndex.get(ext);
        return id ? this._exporters.get(id) : undefined;
    }
    
    /**
     * Get exporter by MIME type
     * @param {string} mimeType - MIME type
     * @returns {IExporter|undefined}
     */
    getByMimeType(mimeType) {
        const id = this._mimeTypeIndex.get(mimeType);
        return id ? this._exporters.get(id) : undefined;
    }
    
    /**
     * Get all exporters
     * @returns {IExporter[]}
     */
    getAll() {
        return Array.from(this._exporters.values());
    }
    
    /**
     * Get all exporter IDs
     * @returns {string[]}
     */
    getAllIds() {
        return Array.from(this._exporters.keys());
    }
    
    /**
     * Get exporter count
     * @returns {number}
     */
    get count() {
        return this._exporters.size;
    }
    
    // ==========================================
    // CATEGORY QUERIES
    // ==========================================
    
    /**
     * Get exporters by category
     * @param {string} category - Export category
     * @returns {IExporter[]}
     */
    getByCategory(category) {
        const ids = this._categoryIndex.get(category);
        if (!ids) return [];
        
        return Array.from(ids).map(id => this._exporters.get(id));
    }
    
    /**
     * Get all categories with registered exporters
     * @returns {string[]}
     */
    getCategories() {
        return Array.from(this._categoryIndex.keys());
    }
    
    /**
     * Get category summary
     * @returns {Map<string, number>}
     */
    getCategorySummary() {
        const summary = new Map();
        for (const [category, ids] of this._categoryIndex) {
            summary.set(category, ids.size);
        }
        return summary;
    }
    
    // ==========================================
    // SEARCH & FILTER
    // ==========================================
    
    /**
     * Search exporters by name or description
     * @param {string} query - Search query
     * @returns {IExporter[]}
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        for (const exporter of this._exporters.values()) {
            const name = (exporter.name || '').toLowerCase();
            const description = (exporter.description || '').toLowerCase();
            const id = exporter.id.toLowerCase();
            
            if (name.includes(lowerQuery) || 
                description.includes(lowerQuery) ||
                id.includes(lowerQuery)) {
                results.push(exporter);
            }
        }
        
        return results;
    }
    
    /**
     * Filter exporters by capabilities
     * @param {object} filters - Capability filters
     * @returns {IExporter[]}
     */
    filter(filters = {}) {
        const results = [];
        
        for (const exporter of this._exporters.values()) {
            let match = true;
            
            if (filters.supportsColors !== undefined && 
                exporter.supportsColors !== filters.supportsColors) {
                match = false;
            }
            
            if (filters.supportsComponents !== undefined && 
                exporter.supportsComponents !== filters.supportsComponents) {
                match = false;
            }
            
            if (filters.supportsLayers !== undefined && 
                exporter.supportsLayers !== filters.supportsLayers) {
                match = false;
            }
            
            if (filters.supportsAnimations !== undefined && 
                exporter.supportsAnimations !== filters.supportsAnimations) {
                match = false;
            }
            
            if (filters.category && exporter.category !== filters.category) {
                match = false;
            }
            
            if (match) {
                results.push(exporter);
            }
        }
        
        return results;
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    /**
     * Get metadata for all exporters
     * @returns {Array}
     */
    getMetadata() {
        const metadata = [];
        
        for (const exporter of this._exporters.values()) {
            metadata.push({
                id: exporter.id,
                name: exporter.name,
                description: exporter.description || '',
                fileExtension: exporter.fileExtension || '',
                mimeType: exporter.mimeType || '',
                category: exporter.category || ExportCategory.PlainText,
                supportsColors: exporter.supportsColors || false,
                supportsComponents: exporter.supportsComponents || false,
                supportsLayers: exporter.supportsLayers || false,
                supportsAnimations: exporter.supportsAnimations || false
            });
        }
        
        return metadata;
    }
    
    /**
     * Get supported file formats for file picker
     * @returns {object}
     */
    getSupportedFormats() {
        const formats = {};
        
        for (const exporter of this._exporters.values()) {
            if (exporter.fileExtension && exporter.mimeType) {
                formats[exporter.fileExtension] = {
                    name: exporter.name,
                    mimeType: exporter.mimeType,
                    exporterId: exporter.id
                };
            }
        }
        
        return formats;
    }
    
    // ==========================================
    // SERIALIZATION
    // ==========================================
    
    /**
     * Export registry state to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            exporters: this.getMetadata(),
            categories: Object.fromEntries(this.getCategorySummary()),
            extensions: Object.fromEntries(this._extensionIndex),
            mimeTypes: Object.fromEntries(this._mimeTypeIndex)
        };
    }
    
    /**
     * Clear all registered exporters
     */
    clear() {
        this._exporters.clear();
        this._categoryIndex.clear();
        this._extensionIndex.clear();
        this._mimeTypeIndex.clear();
    }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

/**
 * Global exporter registry instance
 */
export const globalRegistry = new ExporterRegistry();

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    ExportCategory,
    StyleExportMode,
    DefaultExportOptions,
    ValidationResult,
    ExportResult,
    ExporterRegistry,
    globalRegistry
};
