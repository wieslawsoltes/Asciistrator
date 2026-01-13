/**
 * Asciistrator - Container Export Engine
 * 
 * Handles exporting nested containers/frames with proper hierarchy,
 * clipping, and recursive children export for each format.
 * 
 * @version 1.0.0
 */

import { LayoutExportEngine, LayoutMode } from './LayoutExportEngine.js';

// ==========================================
// CONTAINER TYPES
// ==========================================

/**
 * Container type enum
 */
export const ContainerType = {
    FRAME: 'frame',
    GROUP: 'group',
    COMPONENT: 'component',
    INSTANCE: 'instance',
    SECTION: 'section'
};

// ==========================================
// EXPORT CONTEXT
// ==========================================

/**
 * Export context passed through the container hierarchy
 * @typedef {Object} ExportContext
 * @property {number} depth - Current nesting depth
 * @property {Object} parent - Parent container reference
 * @property {Object} rootBounds - Root canvas bounds
 * @property {Map} styleCache - Cache for shared styles
 * @property {Array} resources - Collected resources (fonts, images, etc.)
 * @property {Object} options - Export options
 */

// ==========================================
// CONTAINER EXPORT ENGINE BASE CLASS
// ==========================================

/**
 * Abstract base class for container export engines.
 * 
 * Handles the recursive traversal and export of container hierarchies,
 * including frames, groups, and components with their children.
 */
export class ContainerExportEngine {
    /**
     * @param {LayoutExportEngine} layoutEngine - Layout transformation engine
     * @param {Object} options - Export options
     */
    constructor(layoutEngine, options = {}) {
        this.layoutEngine = layoutEngine;
        this.options = {
            // Maximum nesting depth (prevent infinite recursion)
            maxDepth: 50,
            // Include hidden containers
            includeHidden: false,
            // Flatten groups (export children directly without group wrapper)
            flattenGroups: false,
            // Include empty containers
            includeEmpty: false,
            // Add debug comments
            debugComments: false,
            ...options
        };
    }
    
    // ==========================================
    // CONTAINER ANALYSIS
    // ==========================================
    
    /**
     * Check if object is a container type
     * @param {Object} obj - Scene object
     * @returns {boolean}
     */
    isContainer(obj) {
        if (!obj) return false;
        
        // Check explicit container types
        if (obj.type === ContainerType.FRAME ||
            obj.type === ContainerType.GROUP ||
            obj.type === ContainerType.COMPONENT ||
            obj.type === ContainerType.INSTANCE ||
            obj.type === ContainerType.SECTION) {
            return true;
        }
        
        // Check if has auto-layout (makes any object a container)
        if (this.layoutEngine?.hasAutoLayout(obj)) {
            return true;
        }
        
        // Check if has children
        return obj.children && obj.children.length > 0;
    }
    
    /**
     * Get container type from object
     * @param {Object} obj - Scene object
     * @returns {string|null}
     */
    getContainerType(obj) {
        if (!obj) return null;
        
        // UI Component containers
        if (obj.uiComponentType) {
            return 'ui-component';
        }
        
        // Check explicit type
        if (Object.values(ContainerType).includes(obj.type)) {
            return obj.type;
        }
        
        // Implicit container via auto-layout
        if (this.layoutEngine?.hasAutoLayout(obj)) {
            return 'auto-layout';
        }
        
        // Generic container with children
        if (obj.children && obj.children.length > 0) {
            return 'generic';
        }
        
        return null;
    }
    
    /**
     * Get children of a container
     * @param {Object} container - Container object
     * @param {ExportContext} context - Export context
     * @returns {Array}
     */
    getChildren(container, context = {}) {
        if (!container || !container.children) return [];
        
        let children = [...container.children];
        
        // Filter hidden if needed
        if (!this.options.includeHidden) {
            children = children.filter(c => c.visible !== false);
        }
        
        // Respect reverse order for auto-layout
        if (container.itemReverseZIndex) {
            children = children.reverse();
        }
        
        return children;
    }
    
    /**
     * Calculate container bounds
     * @param {Object} container - Container object
     * @returns {Object} { x, y, width, height }
     */
    getContainerBounds(container) {
        return {
            x: container.x || 0,
            y: container.y || 0,
            width: container.width || 0,
            height: container.height || 0
        };
    }
    
    /**
     * Check if container clips its children
     * @param {Object} container - Container object
     * @returns {boolean}
     */
    shouldClipContent(container) {
        return container.clipContent === true;
    }
    
    // ==========================================
    // EXPORT ORCHESTRATION
    // ==========================================
    
    /**
     * Export a container and all its children recursively
     * @param {Object} container - Container to export
     * @param {ExportContext} context - Export context
     * @returns {*} Format-specific container representation
     */
    exportContainer(container, context = {}) {
        // Initialize context if not provided
        const ctx = this._initializeContext(context, container);
        
        // Check depth limit
        if (ctx.depth > this.options.maxDepth) {
            console.warn(`Container export: Maximum depth ${this.options.maxDepth} exceeded`);
            return this._createDepthLimitMarker(container, ctx);
        }
        
        // Skip hidden containers
        if (!this.options.includeHidden && container.visible === false) {
            return null;
        }
        
        // Get container info
        const containerType = this.getContainerType(container);
        const children = this.getChildren(container, ctx);
        
        // Skip empty containers if configured
        if (!this.options.includeEmpty && children.length === 0 && !this._hasContent(container)) {
            return null;
        }
        
        // Get layout properties if auto-layout
        const layoutProps = this.layoutEngine?.hasAutoLayout(container)
            ? this.layoutEngine.extractLayoutProperties(container)
            : null;
        
        // Begin container export
        const containerStart = this._beginContainer(container, containerType, layoutProps, ctx);
        
        // Export children
        const exportedChildren = this._exportChildren(children, container, layoutProps, ctx);
        
        // End container export
        const containerEnd = this._endContainer(container, containerType, layoutProps, ctx);
        
        // Assemble final container
        return this._assembleContainer(
            containerStart,
            exportedChildren,
            containerEnd,
            container,
            ctx
        );
    }
    
    /**
     * Export multiple containers (e.g., all root-level frames)
     * @param {Array} containers - Array of containers
     * @param {ExportContext} context - Export context
     * @returns {Array}
     */
    exportContainers(containers, context = {}) {
        return containers
            .map(container => this.exportContainer(container, context))
            .filter(result => result !== null);
    }
    
    /**
     * Export children of a container
     * @private
     */
    _exportChildren(children, parent, parentLayoutProps, context) {
        if (!children || children.length === 0) return [];
        
        // Increment depth for children
        const childContext = {
            ...context,
            depth: context.depth + 1,
            parent: parent,
            parentLayout: parentLayoutProps
        };
        
        // Compute layout positions if parent has auto-layout
        const positionedChildren = parentLayoutProps && parentLayoutProps.layoutMode !== LayoutMode.NONE
            ? this.layoutEngine.computeLayoutPositions(children, parentLayoutProps)
            : children;
        
        return positionedChildren.map((child, index) => {
            // Get child's layout participation info
            const childLayoutProps = this.layoutEngine?.extractLayoutProperties(child);
            
            // Transform child layout if in auto-layout parent
            const childLayout = parentLayoutProps && this.layoutEngine
                ? this.layoutEngine.transformChildLayout(childLayoutProps, parentLayoutProps, childContext)
                : null;
            
            // Recursively export if child is a container
            if (this.isContainer(child)) {
                // Handle group flattening
                if (this.options.flattenGroups && child.type === ContainerType.GROUP) {
                    return this._exportChildren(
                        this.getChildren(child, childContext),
                        child,
                        null,
                        childContext
                    );
                }
                
                return this.exportContainer(child, childContext);
            }
            
            // Export non-container child
            return this._exportChild(child, childLayout, childContext, index);
        }).flat();
    }
    
    /**
     * Initialize export context
     * @private
     */
    _initializeContext(context, container) {
        return {
            depth: 0,
            parent: null,
            rootBounds: this.getContainerBounds(container),
            styleCache: new Map(),
            resources: [],
            options: this.options,
            ...context
        };
    }
    
    /**
     * Check if container has non-child content (background, border, etc.)
     * @private
     */
    _hasContent(container) {
        return (
            container.backgroundColor ||
            container.showBorder ||
            container.title ||
            (container.fills && container.fills.length > 0) ||
            (container.strokes && container.strokes.length > 0)
        );
    }
    
    // ==========================================
    // ABSTRACT METHODS - Must be implemented by subclasses
    // ==========================================
    
    /**
     * Begin container element/node generation
     * @abstract
     * @param {Object} container - Container object
     * @param {string} containerType - Type of container
     * @param {LayoutProperties} layoutProps - Layout properties if auto-layout
     * @param {ExportContext} context - Export context
     * @returns {*} Container start representation
     */
    _beginContainer(container, containerType, layoutProps, context) {
        throw new Error('ContainerExportEngine._beginContainer must be implemented by subclass');
    }
    
    /**
     * End container element/node generation
     * @abstract
     * @param {Object} container - Container object
     * @param {string} containerType - Type of container
     * @param {LayoutProperties} layoutProps - Layout properties if auto-layout
     * @param {ExportContext} context - Export context
     * @returns {*} Container end representation
     */
    _endContainer(container, containerType, layoutProps, context) {
        throw new Error('ContainerExportEngine._endContainer must be implemented by subclass');
    }
    
    /**
     * Export a non-container child element
     * @abstract
     * @param {Object} child - Child object
     * @param {Object} childLayout - Transformed child layout info
     * @param {ExportContext} context - Export context
     * @param {number} index - Child index
     * @returns {*} Exported child representation
     */
    _exportChild(child, childLayout, context, index) {
        throw new Error('ContainerExportEngine._exportChild must be implemented by subclass');
    }
    
    /**
     * Assemble container with its children
     * @abstract
     * @param {*} start - Container start
     * @param {Array} children - Exported children
     * @param {*} end - Container end
     * @param {Object} container - Original container
     * @param {ExportContext} context - Export context
     * @returns {*} Assembled container
     */
    _assembleContainer(start, children, end, container, context) {
        throw new Error('ContainerExportEngine._assembleContainer must be implemented by subclass');
    }
    
    /**
     * Create marker when depth limit is exceeded
     * @abstract
     * @param {Object} container - Container that exceeded limit
     * @param {ExportContext} context - Export context
     * @returns {*}
     */
    _createDepthLimitMarker(container, context) {
        throw new Error('ContainerExportEngine._createDepthLimitMarker must be implemented by subclass');
    }
}

// ==========================================
// STRING-BASED CONTAINER ENGINE
// ==========================================

/**
 * Base class for string/text-based container export (HTML, SVG, XAML, etc.)
 * Implements common patterns for string concatenation-based formats.
 */
export class StringContainerExportEngine extends ContainerExportEngine {
    constructor(layoutEngine, options = {}) {
        super(layoutEngine, {
            // Default indentation
            indentSize: 2,
            indentChar: ' ',
            // Line ending
            lineEnding: '\n',
            ...options
        });
    }
    
    /**
     * Generate indentation string
     * @param {number} depth - Nesting depth
     * @returns {string}
     */
    indent(depth) {
        return this.options.indentChar.repeat(this.options.indentSize * depth);
    }
    
    /**
     * Assemble container as string
     * @override
     */
    _assembleContainer(start, children, end, container, context) {
        const parts = [];
        
        if (start) parts.push(start);
        
        if (children && children.length > 0) {
            parts.push(...children);
        }
        
        if (end) parts.push(end);
        
        return parts.join(this.options.lineEnding);
    }
    
    /**
     * Create depth limit marker
     * @override
     */
    _createDepthLimitMarker(container, context) {
        const indent = this.indent(context.depth);
        return `${indent}<!-- Container "${container.name || container.id}" exceeds maximum depth -->`;
    }
}

// ==========================================
// AST-BASED CONTAINER ENGINE
// ==========================================

/**
 * Base class for AST/object-based container export (JSON, React components, etc.)
 * Builds tree structures instead of strings.
 */
export class ASTContainerExportEngine extends ContainerExportEngine {
    constructor(layoutEngine, options = {}) {
        super(layoutEngine, options);
    }
    
    /**
     * Assemble container as AST node
     * @override
     */
    _assembleContainer(start, children, end, container, context) {
        // start is the node, children are child nodes
        if (!start) return null;
        
        return {
            ...start,
            children: children.filter(c => c !== null)
        };
    }
    
    /**
     * Create depth limit marker
     * @override
     */
    _createDepthLimitMarker(container, context) {
        return {
            type: 'depth-limit-marker',
            containerId: container.id,
            containerName: container.name,
            depth: context.depth
        };
    }
}

// ==========================================
// EXPORT
// ==========================================

export default ContainerExportEngine;
