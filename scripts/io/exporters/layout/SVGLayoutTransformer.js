/**
 * Asciistrator - SVG Layout Transformer
 * 
 * Transforms auto-layout properties to SVG absolute positions.
 * Since SVG doesn't have native flexbox-like layout, this transformer
 * computes resolved positions for all elements.
 * 
 * @version 1.0.0
 */

import { 
    LayoutExportEngine, 
    LayoutMode, 
    SizingMode 
} from './LayoutExportEngine.js';

// ==========================================
// SVG LAYOUT TRANSFORMER
// ==========================================

/**
 * SVG layout transformer.
 * Converts auto-layout properties to computed absolute positions.
 * 
 * SVG doesn't have flexbox, so we compute final positions and
 * output them as transform/translate or direct x/y coordinates.
 */
export class SVGLayoutTransformer extends LayoutExportEngine {
    constructor(options = {}) {
        super({
            unit: '',  // SVG uses unitless numbers (user units)
            // Use transform for positioning
            useTransform: true,
            // Nest in group elements
            useGroups: true,
            // Add clip paths for clipping
            generateClipPaths: true,
            // Clip path ID prefix
            clipPathPrefix: 'clip-',
            // Group ID prefix
            groupPrefix: 'g-',
            ...options
        });
        
        this._clipPathCounter = 0;
        this._groupCounter = 0;
    }
    
    // ==========================================
    // CONTAINER LAYOUT TRANSFORMATION
    // ==========================================
    
    /**
     * Transform layout properties to SVG group attributes
     * @override
     * @param {LayoutProperties} props - Normalized layout properties
     * @param {Object} context - Export context
     * @returns {Object} { groupAttributes, clipPath, computedChildren }
     */
    transformContainerLayout(props, context = {}) {
        const result = {
            groupAttributes: {},
            clipPath: null,
            useGroup: this.options.useGroups,
            needsComputedPositions: props.layoutMode !== LayoutMode.NONE
        };
        
        // Generate ID for group
        if (this.options.useGroups) {
            result.groupAttributes.id = this._generateGroupId(context);
        }
        
        // Position transform if container has offset
        const containerX = context.containerX || 0;
        const containerY = context.containerY || 0;
        
        if (containerX !== 0 || containerY !== 0) {
            result.groupAttributes.transform = `translate(${this.toPixels(containerX)}, ${this.toPixels(containerY, true)})`;
        }
        
        // Clip path for clipping
        if (props.clipContent && this.options.generateClipPaths) {
            result.clipPath = this._generateClipPath(props, context);
            result.groupAttributes['clip-path'] = `url(#${result.clipPath.id})`;
        }
        
        // Data attributes for debugging
        if (this.options.includeComments) {
            result.groupAttributes['data-layout-mode'] = props.layoutMode;
            result.groupAttributes['data-width'] = props.width;
            result.groupAttributes['data-height'] = props.height;
        }
        
        return result;
    }
    
    /**
     * Generate clip path definition
     * @private
     */
    _generateClipPath(props, context) {
        const id = `${this.options.clipPathPrefix}${++this._clipPathCounter}`;
        
        return {
            id,
            element: 'clipPath',
            children: [{
                element: 'rect',
                attributes: {
                    x: 0,
                    y: 0,
                    width: this.toPixels(props.width),
                    height: this.toPixels(props.height, true)
                }
            }]
        };
    }
    
    /**
     * Generate group ID
     * @private
     */
    _generateGroupId(context) {
        const name = context.containerName || 'group';
        return `${this.options.groupPrefix}${name}-${++this._groupCounter}`;
    }
    
    // ==========================================
    // CHILD LAYOUT TRANSFORMATION
    // ==========================================
    
    /**
     * Transform child for SVG positioning
     * @override
     * @param {LayoutProperties} childProps - Child's layout properties
     * @param {LayoutProperties} parentProps - Parent's layout properties
     * @param {Object} context - Export context
     * @returns {Object} { attributes, transform }
     */
    transformChildLayout(childProps, parentProps, context = {}) {
        const result = {
            attributes: {},
            transform: null,
            computedBounds: null
        };
        
        // Use computed positions if available (from computeLayoutPositions)
        const x = childProps.computedX ?? childProps.x ?? 0;
        const y = childProps.computedY ?? childProps.y ?? 0;
        const width = childProps.computedWidth ?? childProps.width ?? 0;
        const height = childProps.computedHeight ?? childProps.height ?? 0;
        
        // Convert to pixels
        const pixelX = this.toPixels(x);
        const pixelY = this.toPixels(y, true);
        const pixelWidth = this.toPixels(width);
        const pixelHeight = this.toPixels(height, true);
        
        // Store computed bounds
        result.computedBounds = {
            x: pixelX,
            y: pixelY,
            width: pixelWidth,
            height: pixelHeight
        };
        
        // Determine positioning method
        if (this.options.useTransform) {
            result.transform = `translate(${pixelX}, ${pixelY})`;
            result.attributes.width = pixelWidth;
            result.attributes.height = pixelHeight;
        } else {
            result.attributes.x = pixelX;
            result.attributes.y = pixelY;
            result.attributes.width = pixelWidth;
            result.attributes.height = pixelHeight;
        }
        
        return result;
    }
    
    // ==========================================
    // CONSTRAINTS TRANSFORMATION
    // ==========================================
    
    /**
     * Transform constraints to SVG positioning
     * SVG doesn't support constraints natively, so we compute final positions
     * @override
     */
    transformConstraints(constraints, parentBounds, childBounds) {
        const result = {
            x: childBounds.x,
            y: childBounds.y,
            width: childBounds.width,
            height: childBounds.height
        };
        
        if (!constraints) return this._boundsToAttributes(result);
        
        // Horizontal constraint
        switch (constraints.horizontal) {
            case 'MIN':
                // Keep original x
                break;
            case 'MAX':
                result.x = parentBounds.width - childBounds.width - (parentBounds.width - childBounds.x - childBounds.width);
                break;
            case 'CENTER':
                result.x = (parentBounds.width - childBounds.width) / 2;
                break;
            case 'STRETCH':
                result.x = childBounds.x;
                result.width = parentBounds.width - childBounds.x - (parentBounds.width - childBounds.x - childBounds.width);
                break;
            case 'SCALE':
                const scaleX = parentBounds.width / (context?.originalParentWidth || parentBounds.width);
                result.x = childBounds.x * scaleX;
                result.width = childBounds.width * scaleX;
                break;
        }
        
        // Vertical constraint
        switch (constraints.vertical) {
            case 'MIN':
                // Keep original y
                break;
            case 'MAX':
                result.y = parentBounds.height - childBounds.height - (parentBounds.height - childBounds.y - childBounds.height);
                break;
            case 'CENTER':
                result.y = (parentBounds.height - childBounds.height) / 2;
                break;
            case 'STRETCH':
                result.y = childBounds.y;
                result.height = parentBounds.height - childBounds.y - (parentBounds.height - childBounds.y - childBounds.height);
                break;
            case 'SCALE':
                const scaleY = parentBounds.height / (context?.originalParentHeight || parentBounds.height);
                result.y = childBounds.y * scaleY;
                result.height = childBounds.height * scaleY;
                break;
        }
        
        return this._boundsToAttributes(result);
    }
    
    /**
     * Convert bounds to SVG attributes
     * @private
     */
    _boundsToAttributes(bounds) {
        if (this.options.useTransform) {
            return {
                transform: `translate(${this.toPixels(bounds.x)}, ${this.toPixels(bounds.y, true)})`,
                width: this.toPixels(bounds.width),
                height: this.toPixels(bounds.height, true)
            };
        }
        
        return {
            x: this.toPixels(bounds.x),
            y: this.toPixels(bounds.y, true),
            width: this.toPixels(bounds.width),
            height: this.toPixels(bounds.height, true)
        };
    }
    
    // ==========================================
    // SPACING & PADDING TRANSFORMATION
    // ==========================================
    
    /**
     * Transform spacing - SVG doesn't use spacing directly
     * @override
     */
    transformSpacing(spacing, isCounterAxis = false) {
        // Spacing is computed into positions, return pixel value for reference
        return this.toPixels(spacing, isCounterAxis);
    }
    
    /**
     * Transform padding - returns offset values for content positioning
     * @override
     */
    transformPadding(padding) {
        if (!padding) return null;
        
        return {
            left: this.toPixels(padding.left || 0),
            top: this.toPixels(padding.top || 0, true),
            right: this.toPixels(padding.right || 0),
            bottom: this.toPixels(padding.bottom || 0, true)
        };
    }
    
    // ==========================================
    // SVG-SPECIFIC METHODS
    // ==========================================
    
    /**
     * Compute all children positions for a container
     * Returns children with computed SVG positions
     * @param {Array} children - Child objects
     * @param {LayoutProperties} parentProps - Parent layout properties
     * @returns {Array} Children with computedSVG property
     */
    computeSVGPositions(children, parentProps) {
        // Use parent class layout computation
        const computed = this.computeLayoutPositions(children, parentProps);
        
        // Convert to SVG coordinates
        return computed.map(child => ({
            ...child,
            computedSVG: {
                x: this.toPixels(child.computedX),
                y: this.toPixels(child.computedY, true),
                width: this.toPixels(child.computedWidth),
                height: this.toPixels(child.computedHeight, true),
                transform: this.options.useTransform 
                    ? `translate(${this.toPixels(child.computedX)}, ${this.toPixels(child.computedY, true)})`
                    : null
            }
        }));
    }
    
    /**
     * Generate SVG group element for container
     * @param {Object} container - Container object
     * @param {Array} children - Pre-computed children
     * @param {Object} context - Export context
     * @returns {Object} SVG group structure
     */
    generateContainerGroup(container, children, context = {}) {
        const props = this.extractLayoutProperties(container);
        const layout = this.transformContainerLayout(props, {
            ...context,
            containerName: container.name || container.id,
            containerX: container.x || 0,
            containerY: container.y || 0
        });
        
        const defs = [];
        
        // Add clip path to defs if needed
        if (layout.clipPath) {
            defs.push(layout.clipPath);
        }
        
        return {
            element: 'g',
            attributes: layout.groupAttributes,
            defs,
            children: children || []
        };
    }
    
    /**
     * Generate SVG rect for container background
     * @param {LayoutProperties} props - Layout properties
     * @param {Object} fills - Fill settings
     * @returns {Object|null} SVG rect definition
     */
    generateBackgroundRect(props, fills) {
        if (!fills || fills.length === 0) return null;
        
        const fill = fills[0]; // Use first fill
        
        return {
            element: 'rect',
            attributes: {
                x: 0,
                y: 0,
                width: this.toPixels(props.width),
                height: this.toPixels(props.height, true),
                fill: fill.color ? this._colorToSVG(fill.color) : 'none',
                'fill-opacity': fill.opacity ?? 1
            }
        };
    }
    
    /**
     * Generate SVG rect for container border
     * @param {LayoutProperties} props - Layout properties
     * @param {Object} strokes - Stroke settings
     * @returns {Object|null} SVG rect definition
     */
    generateBorderRect(props, strokes) {
        if (!strokes || strokes.length === 0) return null;
        
        const stroke = strokes[0]; // Use first stroke
        
        return {
            element: 'rect',
            attributes: {
                x: 0,
                y: 0,
                width: this.toPixels(props.width),
                height: this.toPixels(props.height, true),
                fill: 'none',
                stroke: stroke.color ? this._colorToSVG(stroke.color) : 'none',
                'stroke-width': stroke.weight || 1,
                'stroke-opacity': stroke.opacity ?? 1
            }
        };
    }
    
    /**
     * Convert color to SVG format
     * @private
     */
    _colorToSVG(color) {
        if (typeof color === 'string') {
            return color;
        }
        
        // Figma-style color object { r, g, b, a }
        if (typeof color === 'object') {
            const r = Math.round((color.r || 0) * 255);
            const g = Math.round((color.g || 0) * 255);
            const b = Math.round((color.b || 0) * 255);
            
            if (color.a != null && color.a < 1) {
                return `rgba(${r}, ${g}, ${b}, ${color.a})`;
            }
            
            return `rgb(${r}, ${g}, ${b})`;
        }
        
        return 'none';
    }
    
    /**
     * Format attributes for SVG element
     * @param {Object} attributes
     * @returns {string}
     */
    formatAttributes(attributes) {
        if (!attributes || Object.keys(attributes).length === 0) return '';
        
        return Object.entries(attributes)
            .filter(([_, value]) => value != null && value !== '')
            .map(([key, value]) => `${key}="${this._escapeXml(value)}"`)
            .join(' ');
    }
    
    /**
     * Escape XML special characters
     * @private
     */
    _escapeXml(value) {
        if (typeof value !== 'string') return value;
        
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    /**
     * Reset state
     */
    reset() {
        this._clipPathCounter = 0;
        this._groupCounter = 0;
    }
}

// ==========================================
// EXPORT
// ==========================================

export default SVGLayoutTransformer;
