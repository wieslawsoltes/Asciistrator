/**
 * Asciistrator - Export Manager
 * 
 * Central management system for all export operations.
 * Coordinates exporters, handles export workflows, and provides
 * high-level export functionality.
 * 
 * @version 1.0.0
 */

import { ExporterRegistry, globalRegistry, ExportCategory, ExportResult, ValidationResult } from './ExporterRegistry.js';
import { createAllExporters, getExporter, ExporterClasses } from './exporters/index.js';

// ==========================================
// EXPORT JOB STATUS
// ==========================================

/**
 * Export job status enum
 */
export const ExportJobStatus = Object.freeze({
    Pending: 'pending',
    Running: 'running',
    Completed: 'completed',
    Failed: 'failed',
    Cancelled: 'cancelled'
});

// ==========================================
// EXPORT JOB
// ==========================================

/**
 * Represents an export job
 */
export class ExportJob {
    constructor(id, exporterId, document, options = {}) {
        this.id = id;
        this.exporterId = exporterId;
        this.document = document;
        this.options = options;
        this.status = ExportJobStatus.Pending;
        this.result = null;
        this.error = null;
        this.progress = 0;
        this.createdAt = new Date();
        this.startedAt = null;
        this.completedAt = null;
    }
    
    /**
     * Duration in milliseconds
     */
    get duration() {
        if (!this.startedAt) return 0;
        const end = this.completedAt || new Date();
        return end - this.startedAt;
    }
    
    /**
     * Check if job is done
     */
    get isDone() {
        return [
            ExportJobStatus.Completed,
            ExportJobStatus.Failed,
            ExportJobStatus.Cancelled
        ].includes(this.status);
    }
}

// ==========================================
// BATCH EXPORT RESULT
// ==========================================

/**
 * Result of a batch export operation
 */
export class BatchExportResult {
    constructor() {
        this.jobs = [];
        this.successful = [];
        this.failed = [];
        this.startTime = null;
        this.endTime = null;
    }
    
    /**
     * Total duration in milliseconds
     */
    get totalDuration() {
        if (!this.startTime) return 0;
        const end = this.endTime || new Date();
        return end - this.startTime;
    }
    
    /**
     * Success rate (0-1)
     */
    get successRate() {
        if (this.jobs.length === 0) return 1;
        return this.successful.length / this.jobs.length;
    }
    
    /**
     * Overall success
     */
    get isSuccess() {
        return this.failed.length === 0;
    }
    
    /**
     * Add a completed job
     */
    addJob(job) {
        this.jobs.push(job);
        if (job.status === ExportJobStatus.Completed) {
            this.successful.push(job);
        } else if (job.status === ExportJobStatus.Failed) {
            this.failed.push(job);
        }
    }
}

// ==========================================
// EXPORT MANAGER
// ==========================================

/**
 * Central export management system
 */
export class ExportManager {
    constructor(registry = null) {
        this.registry = registry || globalRegistry;
        this._initialized = false;
        this._jobIdCounter = 0;
        this._jobs = new Map();
        this._eventHandlers = new Map();
    }
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    /**
     * Initialize export manager with default exporters
     */
    initialize() {
        if (this._initialized) return;
        
        // Register all built-in exporters
        for (const ExporterClass of Object.values(ExporterClasses)) {
            try {
                const exporter = new ExporterClass();
                this.registry.register(exporter);
            } catch (e) {
                console.warn(`Failed to register exporter: ${e.message}`);
            }
        }
        
        this._initialized = true;
        this._emit('initialized');
    }
    
    /**
     * Check if initialized
     */
    get isInitialized() {
        return this._initialized;
    }
    
    // ==========================================
    // EXPORTER ACCESS
    // ==========================================
    
    /**
     * Get exporter by ID
     * @param {string} id - Exporter ID
     * @returns {BaseExporter|null}
     */
    getExporter(id) {
        return this.registry.get(id);
    }
    
    /**
     * Get exporter by file extension
     * @param {string} extension - File extension (e.g., '.png')
     * @returns {BaseExporter|null}
     */
    getExporterByExtension(extension) {
        return this.registry.getByExtension(extension);
    }
    
    /**
     * Get exporter by MIME type
     * @param {string} mimeType - MIME type
     * @returns {BaseExporter|null}
     */
    getExporterByMimeType(mimeType) {
        return this.registry.getByMimeType(mimeType);
    }
    
    /**
     * Get all exporters in a category
     * @param {ExportCategory} category - Export category
     * @returns {BaseExporter[]}
     */
    getExportersByCategory(category) {
        return this.registry.getByCategory(category);
    }
    
    /**
     * Get all available exporters
     * @returns {BaseExporter[]}
     */
    getAllExporters() {
        return this.registry.getAll();
    }
    
    /**
     * Get metadata for all exporters
     * @returns {Array<object>}
     */
    getExporterMetadata() {
        return this.registry.getAll().map(exp => ({
            id: exp.id,
            name: exp.name,
            description: exp.description,
            fileExtension: exp.fileExtension,
            mimeType: exp.mimeType,
            category: exp.category,
            supportsColors: exp.supportsColors,
            supportsComponents: exp.supportsComponents,
            supportsLayers: exp.supportsLayers,
            supportsAnimations: exp.supportsAnimations
        }));
    }
    
    // ==========================================
    // REGISTRATION
    // ==========================================
    
    /**
     * Register a custom exporter
     * @param {BaseExporter} exporter - Exporter instance
     */
    registerExporter(exporter) {
        this.registry.register(exporter);
        this._emit('exporter-registered', { exporterId: exporter.id });
    }
    
    /**
     * Unregister an exporter
     * @param {string} id - Exporter ID
     */
    unregisterExporter(id) {
        const success = this.registry.unregister(id);
        if (success) {
            this._emit('exporter-unregistered', { exporterId: id });
        }
        return success;
    }
    
    // ==========================================
    // SINGLE EXPORT
    // ==========================================
    
    /**
     * Export document using specified format
     * @param {object} document - Document to export
     * @param {string} formatId - Export format ID
     * @param {object} options - Export options
     * @returns {ExportResult}
     */
    export(document, formatId, options = {}) {
        const exporter = this.getExporter(formatId);
        
        if (!exporter) {
            return new ExportResult(
                false,
                null,
                [{ code: 'UNKNOWN_FORMAT', message: `Unknown export format: ${formatId}` }]
            );
        }
        
        this._emit('export-start', { formatId, options });
        
        try {
            const result = exporter.export(document, options);
            
            this._emit('export-complete', { 
                formatId, 
                success: true,
                output: result 
            });
            
            return new ExportResult(true, result);
        } catch (error) {
            this._emit('export-error', { formatId, error });
            
            return new ExportResult(
                false,
                null,
                [{ code: 'EXPORT_ERROR', message: error.message }]
            );
        }
    }
    
    /**
     * Export to file (triggers download)
     * @param {object} document - Document to export
     * @param {string} formatId - Export format ID
     * @param {string} filename - Output filename
     * @param {object} options - Export options
     */
    async exportToFile(document, formatId, filename = null, options = {}) {
        const exporter = this.getExporter(formatId);
        
        if (!exporter) {
            throw new Error(`Unknown export format: ${formatId}`);
        }
        
        const targetFilename = filename || `export${exporter.fileExtension}`;
        
        this._emit('export-file-start', { formatId, filename: targetFilename });
        
        try {
            await exporter.download(document, targetFilename, options);
            this._emit('export-file-complete', { formatId, filename: targetFilename });
        } catch (error) {
            this._emit('export-file-error', { formatId, error });
            throw error;
        }
    }
    
    // ==========================================
    // BATCH EXPORT
    // ==========================================
    
    /**
     * Export document to multiple formats
     * @param {object} document - Document to export
     * @param {Array<string>} formatIds - Array of format IDs
     * @param {object} options - Export options (applied to all)
     * @returns {BatchExportResult}
     */
    exportMultiple(document, formatIds, options = {}) {
        const batchResult = new BatchExportResult();
        batchResult.startTime = new Date();
        
        this._emit('batch-export-start', { formats: formatIds });
        
        for (const formatId of formatIds) {
            const job = this._createJob(formatId, document, options);
            
            try {
                job.status = ExportJobStatus.Running;
                job.startedAt = new Date();
                
                const result = this.export(document, formatId, options);
                
                job.result = result;
                job.status = result.success ? ExportJobStatus.Completed : ExportJobStatus.Failed;
                job.completedAt = new Date();
                
                if (!result.success) {
                    job.error = result.errors[0]?.message || 'Export failed';
                }
            } catch (error) {
                job.status = ExportJobStatus.Failed;
                job.error = error.message;
                job.completedAt = new Date();
            }
            
            batchResult.addJob(job);
        }
        
        batchResult.endTime = new Date();
        
        this._emit('batch-export-complete', { 
            result: batchResult,
            successRate: batchResult.successRate
        });
        
        return batchResult;
    }
    
    /**
     * Export document to all supported formats
     * @param {object} document - Document to export
     * @param {object} options - Export options
     * @returns {BatchExportResult}
     */
    exportAll(document, options = {}) {
        const allFormatIds = this.registry.getAll().map(e => e.id);
        return this.exportMultiple(document, allFormatIds, options);
    }
    
    /**
     * Export document to all formats in a category
     * @param {object} document - Document to export
     * @param {ExportCategory} category - Export category
     * @param {object} options - Export options
     * @returns {BatchExportResult}
     */
    exportCategory(document, category, options = {}) {
        const formatIds = this.registry
            .getByCategory(category)
            .map(e => e.id);
        return this.exportMultiple(document, formatIds, options);
    }
    
    // ==========================================
    // VALIDATION
    // ==========================================
    
    /**
     * Validate document for export
     * @param {object} document - Document to validate
     * @param {string} formatId - Export format ID
     * @returns {ValidationResult}
     */
    validate(document, formatId) {
        const exporter = this.getExporter(formatId);
        
        if (!exporter) {
            const result = new ValidationResult(false);
            result.addError('UNKNOWN_FORMAT', `Unknown export format: ${formatId}`);
            return result;
        }
        
        return exporter.validate(document);
    }
    
    /**
     * Validate document for multiple formats
     * @param {object} document - Document to validate
     * @param {Array<string>} formatIds - Array of format IDs
     * @returns {Map<string, ValidationResult>}
     */
    validateMultiple(document, formatIds) {
        const results = new Map();
        
        for (const formatId of formatIds) {
            results.set(formatId, this.validate(document, formatId));
        }
        
        return results;
    }
    
    // ==========================================
    // PREVIEW
    // ==========================================
    
    /**
     * Generate preview for export
     * @param {object} document - Document to preview
     * @param {string} formatId - Export format ID
     * @param {object} options - Preview options
     * @returns {string|null}
     */
    preview(document, formatId, options = {}) {
        const exporter = this.getExporter(formatId);
        
        if (!exporter) {
            return null;
        }
        
        return exporter.preview(document, options);
    }
    
    // ==========================================
    // JOB MANAGEMENT
    // ==========================================
    
    /**
     * Create an export job
     * @private
     */
    _createJob(formatId, document, options) {
        const id = ++this._jobIdCounter;
        const job = new ExportJob(id, formatId, document, options);
        this._jobs.set(id, job);
        return job;
    }
    
    /**
     * Get job by ID
     * @param {number} id - Job ID
     * @returns {ExportJob|null}
     */
    getJob(id) {
        return this._jobs.get(id) || null;
    }
    
    /**
     * Get all jobs
     * @returns {ExportJob[]}
     */
    getAllJobs() {
        return Array.from(this._jobs.values());
    }
    
    /**
     * Get recent jobs
     * @param {number} count - Number of jobs to return
     * @returns {ExportJob[]}
     */
    getRecentJobs(count = 10) {
        return Array.from(this._jobs.values())
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, count);
    }
    
    /**
     * Clear completed jobs
     */
    clearCompletedJobs() {
        for (const [id, job] of this._jobs) {
            if (job.isDone) {
                this._jobs.delete(id);
            }
        }
    }
    
    // ==========================================
    // EVENTS
    // ==========================================
    
    /**
     * Subscribe to export manager events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        if (!this._eventHandlers.has(event)) {
            this._eventHandlers.set(event, new Set());
        }
        this._eventHandlers.get(event).add(handler);
    }
    
    /**
     * Unsubscribe from events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    off(event, handler) {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }
    
    /**
     * Emit an event
     * @private
     */
    _emit(event, data = {}) {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(data);
                } catch (e) {
                    console.error(`Event handler error for ${event}:`, e);
                }
            }
        }
    }
    
    // ==========================================
    // UTILITIES
    // ==========================================
    
    /**
     * Get supported extensions
     * @returns {string[]}
     */
    getSupportedExtensions() {
        return this.registry.getAll()
            .map(e => e.fileExtension)
            .filter((ext, i, arr) => arr.indexOf(ext) === i);
    }
    
    /**
     * Get supported MIME types
     * @returns {string[]}
     */
    getSupportedMimeTypes() {
        return this.registry.getAll()
            .map(e => e.mimeType)
            .filter((mime, i, arr) => arr.indexOf(mime) === i);
    }
    
    /**
     * Check if format is supported
     * @param {string} formatId - Format ID
     * @returns {boolean}
     */
    isFormatSupported(formatId) {
        return this.registry.has(formatId);
    }
    
    /**
     * Get format for filename
     * @param {string} filename - Filename
     * @returns {string|null} Format ID or null
     */
    getFormatForFilename(filename) {
        const ext = '.' + filename.split('.').pop().toLowerCase();
        const exporter = this.registry.getByExtension(ext);
        return exporter ? exporter.id : null;
    }
    
    /**
     * Suggest filename for format
     * @param {string} baseName - Base filename (without extension)
     * @param {string} formatId - Format ID
     * @returns {string}
     */
    suggestFilename(baseName, formatId) {
        const exporter = this.getExporter(formatId);
        if (!exporter) return `${baseName}.txt`;
        return `${baseName}${exporter.fileExtension}`;
    }
}

// ==========================================
// GLOBAL INSTANCE
// ==========================================

/**
 * Global export manager instance
 */
export const exportManager = new ExportManager();

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default ExportManager;
