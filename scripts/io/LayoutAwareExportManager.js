/**
 * Asciistrator - Layout-Aware Export Manager
 * 
 * Extends export functionality to properly handle containers and auto-layout
 * using specialized export engines for each format.
 * 
 * @version 1.0.0
 */

import {
    LayoutMode,
    PrimaryAxisAlign,
    CounterAxisAlign,
    LayoutWrap,
    SizingMode,
    createLayoutTransformer,
    createContainerEngine,
    getLayoutCapabilities
} from './exporters/layout/index.js';

// ==========================================
// LAYOUT-AWARE EXPORT RESULT
// ==========================================

/**
 * Extended export result with layout information
 */
export class LayoutAwareExportResult {
    constructor(success, output, format, layoutInfo = null) {
        this.success = success;
        this.output = output;
        this.format = format;
        this.layoutInfo = layoutInfo;
        this.errors = [];
        this.warnings = [];
        this.stats = {
            containerCount: 0,
            autoLayoutCount: 0,
            childCount: 0,
            maxDepth: 0,
            exportTime: 0
        };
    }
    
    addError(code, message) {
        this.errors.push({ code, message });
    }
    
    addWarning(code, message) {
        this.warnings.push({ code, message });
    }
}

// ==========================================
// LAYOUT EXPORT CONFIGURATION
// ==========================================

/**
 * Configuration for layout-aware export
 */
export class LayoutExportConfig {
    constructor(options = {}) {
        // Cell dimensions for conversion
        this.cellWidth = options.cellWidth || 10;
        this.cellHeight = options.cellHeight || 18;
        
        // Font settings
        this.fontFamily = options.fontFamily || 'Consolas, "Courier New", monospace';
        this.fontSize = options.fontSize || 14;
        
        // Colors
        this.backgroundColor = options.backgroundColor || '#1a1a2e';
        this.defaultColor = options.defaultColor || '#e0e0e0';
        
        // Layout handling
        this.preserveAutoLayout = options.preserveAutoLayout !== false;
        this.flattenNestedContainers = options.flattenNestedContainers || false;
        this.maxNestingDepth = options.maxNestingDepth || 50;
        
        // Optimization
        this.optimizeOutput = options.optimizeOutput !== false;
        this.mergeStyles = options.mergeStyles !== false;
        this.removeEmptyContainers = options.removeEmptyContainers || false;
        
        // Debug
        this.includeDebugInfo = options.includeDebugInfo || false;
        this.includeLayoutComments = options.includeLayoutComments || false;
        
        // Format-specific overrides
        this.formatOptions = options.formatOptions || {};
    }
    
    /**
     * Get options for specific format
     */
    getFormatOptions(format) {
        return {
            cellWidth: this.cellWidth,
            cellHeight: this.cellHeight,
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            backgroundColor: this.backgroundColor,
            defaultColor: this.defaultColor,
            includeComments: this.includeLayoutComments,
            optimize: this.optimizeOutput,
            ...(this.formatOptions[format] || {})
        };
    }
}

// ==========================================
// LAYOUT-AWARE EXPORT MANAGER
// ==========================================

/**
 * Layout-aware export manager.
 * Integrates layout engines for deterministic container and auto-layout export.
 */
export class LayoutAwareExportManager {
    constructor(config = {}) {
        this.config = new LayoutExportConfig(config);
        this._transformerCache = new Map();
        this._containerEngineCache = new Map();
    }
    
    // ==========================================
    // ENGINE ACCESS
    // ==========================================
    
    /**
     * Get layout transformer for format
     * @param {string} format - Export format
     * @returns {LayoutExportEngine}
     */
    getLayoutTransformer(format) {
        const key = format.toLowerCase();
        
        if (!this._transformerCache.has(key)) {
            const transformer = createLayoutTransformer(
                format,
                this.config.getFormatOptions(format)
            );
            this._transformerCache.set(key, transformer);
        }
        
        return this._transformerCache.get(key);
    }
    
    /**
     * Get container export engine for format
     * @param {string} format - Export format
     * @returns {ContainerExportEngine}
     */
    getContainerEngine(format) {
        const key = format.toLowerCase();
        
        if (!this._containerEngineCache.has(key)) {
            const engine = createContainerEngine(
                format,
                this.config.getFormatOptions(format)
            );
            this._containerEngineCache.set(key, engine);
        }
        
        return this._containerEngineCache.get(key);
    }
    
    /**
     * Get layout capabilities for format
     * @param {string} format - Export format
     * @returns {Object}
     */
    getCapabilities(format) {
        return getLayoutCapabilities(format);
    }
    
    // ==========================================
    // SCENE ANALYSIS
    // ==========================================
    
    /**
     * Analyze scene for layout information
     * @param {Object} document - Document or scene
     * @returns {Object} Layout analysis
     */
    analyzeScene(document) {
        const analysis = {
            hasAutoLayout: false,
            hasNestedContainers: false,
            containerCount: 0,
            autoLayoutCount: 0,
            maxDepth: 0,
            layoutModes: new Set(),
            alignments: {
                primary: new Set(),
                counter: new Set()
            },
            hasWrapping: false,
            hasConstraints: false
        };
        
        const objects = this._getSceneObjects(document);
        
        for (const obj of objects) {
            this._analyzeObject(obj, analysis, 0);
        }
        
        return {
            ...analysis,
            layoutModes: Array.from(analysis.layoutModes),
            alignments: {
                primary: Array.from(analysis.alignments.primary),
                counter: Array.from(analysis.alignments.counter)
            }
        };
    }
    
    /**
     * Analyze single object
     * @private
     */
    _analyzeObject(obj, analysis, depth) {
        if (!obj) return;
        
        // Track depth
        if (depth > analysis.maxDepth) {
            analysis.maxDepth = depth;
        }
        
        // Check for container
        const isContainer = obj.type === 'frame' || obj.type === 'group' ||
            (obj.children && obj.children.length > 0);
        
        if (isContainer) {
            analysis.containerCount++;
            
            if (depth > 0) {
                analysis.hasNestedContainers = true;
            }
        }
        
        // Check for auto-layout
        if (obj.layoutMode && obj.layoutMode !== 'NONE') {
            analysis.hasAutoLayout = true;
            analysis.autoLayoutCount++;
            analysis.layoutModes.add(obj.layoutMode);
            
            // Track alignments
            if (obj.primaryAxisAlignItems) {
                analysis.alignments.primary.add(obj.primaryAxisAlignItems);
            }
            if (obj.counterAxisAlignItems) {
                analysis.alignments.counter.add(obj.counterAxisAlignItems);
            }
            
            // Track wrapping
            if (obj.layoutWrap === 'WRAP') {
                analysis.hasWrapping = true;
            }
        }
        
        // Check for constraints
        if (obj.constraints && 
            (obj.constraints.horizontal !== 'MIN' || obj.constraints.vertical !== 'MIN')) {
            analysis.hasConstraints = true;
        }
        
        // Recurse into children
        if (obj.children) {
            for (const child of obj.children) {
                this._analyzeObject(child, analysis, depth + 1);
            }
        }
    }
    
    /**
     * Get scene objects from document
     * @private
     */
    _getSceneObjects(document) {
        if (!document) return [];
        
        // Document structure with layers
        if (document.layers) {
            return document.layers.flatMap(layer => layer.objects || []);
        }
        
        // Direct objects array
        if (document.objects) {
            return document.objects;
        }
        
        // Single object or array
        if (Array.isArray(document)) {
            return document;
        }
        
        // Single object
        if (document.type || document.id) {
            return [document];
        }
        
        return [];
    }
    
    // ==========================================
    // LAYOUT-AWARE EXPORT
    // ==========================================
    
    /**
     * Export with layout awareness
     * @param {Object} document - Document or container to export
     * @param {string} format - Target format
     * @param {Object} options - Additional options
     * @returns {LayoutAwareExportResult}
     */
    exportWithLayout(document, format, options = {}) {
        const startTime = performance.now();
        
        const result = new LayoutAwareExportResult(false, null, format);
        
        try {
            // Get capabilities
            const capabilities = this.getCapabilities(format);
            
            // Analyze scene
            const analysis = this.analyzeScene(document);
            result.stats.containerCount = analysis.containerCount;
            result.stats.autoLayoutCount = analysis.autoLayoutCount;
            result.stats.maxDepth = analysis.maxDepth;
            
            // Choose export strategy
            if (analysis.hasAutoLayout && this.config.preserveAutoLayout) {
                // Use layout-aware export
                result.output = this._exportWithLayoutEngine(document, format, options, capabilities);
                result.layoutInfo = {
                    strategy: 'layout-aware',
                    capabilities,
                    analysis
                };
            } else {
                // Use computed positions (flatten layout)
                result.output = this._exportWithComputedPositions(document, format, options);
                result.layoutInfo = {
                    strategy: 'computed-positions',
                    analysis
                };
            }
            
            result.success = true;
            
            // Add warnings for unsupported features
            this._addCapabilityWarnings(result, capabilities, analysis);
            
        } catch (error) {
            result.addError('EXPORT_ERROR', error.message);
        }
        
        result.stats.exportTime = performance.now() - startTime;
        return result;
    }
    
    /**
     * Export using layout engine
     * @private
     */
    _exportWithLayoutEngine(document, format, options, capabilities) {
        const engine = this.getContainerEngine(format);
        const objects = this._getSceneObjects(document);
        
        // Find root containers
        const rootContainers = objects.filter(obj => 
            obj.type === 'frame' || obj.type === 'group' || !obj.parentId
        );
        
        if (rootContainers.length === 0) {
            // No containers - export objects directly
            return this._exportObjectsDirectly(objects, format, options);
        }
        
        // Export each root container
        const exported = rootContainers.map(container => 
            engine.exportContainer(container, { depth: 0 })
        );
        
        return this._wrapExportedContent(exported, format, options);
    }
    
    /**
     * Export with computed positions (flatten layout)
     * @private
     */
    _exportWithComputedPositions(document, format, options) {
        const transformer = this.getLayoutTransformer(format);
        const objects = this._getSceneObjects(document);
        
        // Compute all positions
        const computedObjects = this._computeAllPositions(objects, transformer);
        
        // Export with computed positions
        const engine = this.getContainerEngine(format);
        
        // Create virtual root container with all computed objects
        const virtualRoot = {
            type: 'frame',
            id: 'root',
            name: 'Root',
            x: 0,
            y: 0,
            width: this._calculateBoundsWidth(computedObjects),
            height: this._calculateBoundsHeight(computedObjects),
            layoutMode: 'NONE', // No layout, use absolute positions
            children: computedObjects
        };
        
        return engine.exportContainer(virtualRoot, { depth: 0 });
    }
    
    /**
     * Compute positions for all objects recursively
     * @private
     */
    _computeAllPositions(objects, transformer, parentProps = null) {
        if (!objects || objects.length === 0) return [];
        
        // If parent has auto-layout, compute positions
        if (parentProps && parentProps.layoutMode !== LayoutMode.NONE) {
            return transformer.computeLayoutPositions(objects, parentProps);
        }
        
        // Process each object
        return objects.map(obj => {
            const computed = { ...obj };
            
            // Recurse into children
            if (obj.children && obj.children.length > 0) {
                const objProps = transformer.extractLayoutProperties(obj);
                
                if (objProps.layoutMode !== LayoutMode.NONE) {
                    // Compute child positions based on parent layout
                    computed.children = transformer.computeLayoutPositions(obj.children, objProps);
                } else {
                    // Recurse without layout
                    computed.children = this._computeAllPositions(obj.children, transformer, objProps);
                }
            }
            
            return computed;
        });
    }
    
    /**
     * Export objects directly without container wrapping
     * @private
     */
    _exportObjectsDirectly(objects, format, options) {
        const engine = this.getContainerEngine(format);
        
        // Create minimal container
        const container = {
            type: 'frame',
            id: 'root',
            name: 'Root',
            layoutMode: 'NONE',
            children: objects
        };
        
        return engine.exportContainer(container, { depth: 0 });
    }
    
    /**
     * Wrap exported content with format-specific structure
     * @private
     */
    _wrapExportedContent(exportedItems, format, options) {
        const formatLower = format.toLowerCase();
        
        if (exportedItems.length === 0) return '';
        
        if (exportedItems.length === 1) return exportedItems[0];
        
        // Multiple items - wrap based on format
        switch (formatLower) {
            case 'html':
            case 'web':
                return `<div class="asc-export-root">\n${exportedItems.join('\n')}\n</div>`;
                
            case 'svg':
                const width = this.config.cellWidth * 80;
                const height = this.config.cellHeight * 40;
                return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n${exportedItems.join('\n')}\n</svg>`;
                
            case 'xaml':
            case 'avalonia':
            case 'wpf':
            case 'maui':
                return `<StackPanel>\n${exportedItems.join('\n')}\n</StackPanel>`;
                
            default:
                return exportedItems.join('\n');
        }
    }
    
    /**
     * Calculate bounds width from objects
     * @private
     */
    _calculateBoundsWidth(objects) {
        if (!objects || objects.length === 0) return 80;
        
        let maxX = 0;
        for (const obj of objects) {
            const x = obj.computedX ?? obj.x ?? 0;
            const w = obj.computedWidth ?? obj.width ?? 0;
            if (x + w > maxX) maxX = x + w;
        }
        return Math.max(80, maxX + 10);
    }
    
    /**
     * Calculate bounds height from objects
     * @private
     */
    _calculateBoundsHeight(objects) {
        if (!objects || objects.length === 0) return 40;
        
        let maxY = 0;
        for (const obj of objects) {
            const y = obj.computedY ?? obj.y ?? 0;
            const h = obj.computedHeight ?? obj.height ?? 0;
            if (y + h > maxY) maxY = y + h;
        }
        return Math.max(40, maxY + 10);
    }
    
    /**
     * Add warnings for unsupported capabilities
     * @private
     */
    _addCapabilityWarnings(result, capabilities, analysis) {
        // Check for unsupported layout features
        if (analysis.hasWrapping && !capabilities.supportsNativeLayout) {
            result.addWarning(
                'WRAP_NOT_SUPPORTED',
                `${result.format} does not support native wrap layout - using computed positions`
            );
        }
        
        if (analysis.hasConstraints && !capabilities.supportsConstraints) {
            result.addWarning(
                'CONSTRAINTS_NOT_SUPPORTED',
                `${result.format} does not support constraints - using fixed positions`
            );
        }
        
        if (analysis.maxDepth > 10 && capabilities.requiresComputedPositions) {
            result.addWarning(
                'DEEP_NESTING',
                `Deep nesting (${analysis.maxDepth} levels) may impact performance`
            );
        }
    }
    
    // ==========================================
    // BATCH EXPORT
    // ==========================================
    
    /**
     * Export to multiple formats with layout awareness
     * @param {Object} document - Document to export
     * @param {Array<string>} formats - Target formats
     * @param {Object} options - Additional options
     * @returns {Map<string, LayoutAwareExportResult>}
     */
    exportToMultipleFormats(document, formats, options = {}) {
        const results = new Map();
        
        for (const format of formats) {
            results.set(format, this.exportWithLayout(document, format, options));
        }
        
        return results;
    }
    
    /**
     * Export to all supported layout-aware formats
     * @param {Object} document - Document to export
     * @param {Object} options - Additional options
     * @returns {Map<string, LayoutAwareExportResult>}
     */
    exportToAllFormats(document, options = {}) {
        const formats = ['html', 'svg', 'avalonia', 'wpf', 'maui'];
        return this.exportToMultipleFormats(document, formats, options);
    }
    
    // ==========================================
    // UTILITIES
    // ==========================================
    
    /**
     * Clear cached engines
     */
    clearCache() {
        for (const transformer of this._transformerCache.values()) {
            if (transformer.reset) transformer.reset();
        }
        
        for (const engine of this._containerEngineCache.values()) {
            if (engine.reset) engine.reset();
        }
        
        this._transformerCache.clear();
        this._containerEngineCache.clear();
    }
    
    /**
     * Update configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = new LayoutExportConfig({
            ...this.config,
            ...newConfig
        });
        
        // Clear cache when config changes
        this.clearCache();
    }
    
    /**
     * Get supported formats
     * @returns {Array<Object>}
     */
    getSupportedFormats() {
        return [
            {
                id: 'html',
                name: 'HTML',
                description: 'HTML with CSS Flexbox layout',
                capabilities: getLayoutCapabilities('html')
            },
            {
                id: 'svg',
                name: 'SVG',
                description: 'SVG with computed positions',
                capabilities: getLayoutCapabilities('svg')
            },
            {
                id: 'avalonia',
                name: 'Avalonia XAML',
                description: 'Avalonia UI with StackPanel/Grid',
                capabilities: getLayoutCapabilities('avalonia')
            },
            {
                id: 'wpf',
                name: 'WPF XAML',
                description: 'WPF with StackPanel/Grid',
                capabilities: getLayoutCapabilities('wpf')
            },
            {
                id: 'maui',
                name: '.NET MAUI XAML',
                description: '.NET MAUI with StackLayout/Grid',
                capabilities: getLayoutCapabilities('maui')
            }
        ];
    }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

/**
 * Global layout-aware export manager instance
 */
export const layoutExportManager = new LayoutAwareExportManager();

// ==========================================
// EXPORT
// ==========================================

export default LayoutAwareExportManager;
