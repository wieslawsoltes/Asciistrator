/**
 * Asciistrator - SVG Container Export Engine
 * 
 * Concrete container export implementation for SVG output.
 * Uses computed positions and SVG groups for hierarchy.
 * 
 * @version 1.0.0
 */

import { StringContainerExportEngine, ContainerType } from './ContainerExportEngine.js';
import { SVGLayoutTransformer } from './SVGLayoutTransformer.js';
import { LayoutMode } from './LayoutExportEngine.js';

// ==========================================
// SVG CONTAINER EXPORT ENGINE
// ==========================================

/**
 * SVG container export engine.
 * Generates SVG with groups for containers and computed positions.
 */
export class SVGContainerExportEngine extends StringContainerExportEngine {
    /**
     * @param {Object} options - Export options
     */
    constructor(options = {}) {
        const layoutEngine = new SVGLayoutTransformer({
            cellWidth: options.cellWidth || 10,
            cellHeight: options.cellHeight || 18,
            useTransform: options.useTransform !== false,
            useGroups: true,
            generateClipPaths: options.generateClipPaths !== false,
            ...options.layoutOptions
        });
        
        super(layoutEngine, {
            // SVG-specific options
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 14,
            backgroundColor: '#1a1a2e',
            defaultColor: '#e0e0e0',
            generateIds: true,
            includeMetadata: true,
            optimizeOutput: true,
            ...options
        });
        
        // Collect definitions (clip paths, gradients, etc.)
        this._defs = [];
    }
    
    // ==========================================
    // CONTAINER GENERATION
    // ==========================================
    
    /**
     * Begin container element
     * @override
     */
    _beginContainer(container, containerType, layoutProps, context) {
        const ind = this.indent(context.depth);
        const lines = [];
        
        // Get layout transformation
        const layoutResult = this.layoutEngine.transformContainerLayout(
            layoutProps || this.layoutEngine.extractLayoutProperties(container),
            {
                ...context,
                containerName: container.name || container.id,
                containerX: container.x || 0,
                containerY: container.y || 0
            }
        );
        
        // Add clip path to defs if needed
        if (layoutResult.clipPath) {
            this._defs.push(layoutResult.clipPath);
        }
        
        // Build group attributes
        const groupAttrs = this._buildGroupAttributes(container, layoutResult, context);
        
        // Open group
        lines.push(`${ind}<g${groupAttrs}>`);
        
        // Background rect
        if (this._hasBackground(container)) {
            lines.push(this._generateBackgroundRect(container, layoutProps, context));
        }
        
        // Border rect
        if (this._hasBorder(container)) {
            lines.push(this._generateBorderRect(container, layoutProps, context));
        }
        
        // Title text
        if (container.title) {
            lines.push(this._generateTitleText(container, layoutProps, context));
        }
        
        return lines.join(this.options.lineEnding);
    }
    
    /**
     * End container element
     * @override
     */
    _endContainer(container, containerType, layoutProps, context) {
        const ind = this.indent(context.depth);
        return `${ind}</g>`;
    }
    
    /**
     * Export non-container child
     * @override
     */
    _exportChild(child, childLayout, context, index) {
        const ind = this.indent(context.depth);
        
        // Get computed bounds
        const bounds = childLayout?.computedBounds || {
            x: this.layoutEngine.toPixels(child.computedX ?? child.x ?? 0),
            y: this.layoutEngine.toPixels(child.computedY ?? child.y ?? 0, true),
            width: this.layoutEngine.toPixels(child.computedWidth ?? child.width ?? 0),
            height: this.layoutEngine.toPixels(child.computedHeight ?? child.height ?? 0, true)
        };
        
        // Generate SVG element based on type
        return this._generateChildSVG(child, bounds, childLayout, context);
    }
    
    // ==========================================
    // SVG ELEMENT GENERATION
    // ==========================================
    
    /**
     * Build group attributes
     * @private
     */
    _buildGroupAttributes(container, layoutResult, context) {
        const attrs = [];
        
        // ID
        if (this.options.generateIds) {
            const id = container.id || `container-${context.depth}-${Date.now()}`;
            attrs.push(`id="${this._escapeXml(id)}"`);
        }
        
        // Transform
        if (layoutResult.groupAttributes?.transform) {
            attrs.push(`transform="${layoutResult.groupAttributes.transform}"`);
        }
        
        // Clip path
        if (layoutResult.groupAttributes?.['clip-path']) {
            attrs.push(`clip-path="${layoutResult.groupAttributes['clip-path']}"`);
        }
        
        // Data attributes
        if (this.options.includeMetadata) {
            if (container.name) {
                attrs.push(`data-name="${this._escapeXml(container.name)}"`);
            }
            attrs.push(`data-type="${container.type || 'container'}"`);
        }
        
        return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    }
    
    /**
     * Check if container has background
     * @private
     */
    _hasBackground(container) {
        return container.backgroundColor || 
               container.backgroundChar !== ' ' ||
               (container.fills && container.fills.length > 0);
    }
    
    /**
     * Check if container has border
     * @private
     */
    _hasBorder(container) {
        return container.showBorder || 
               (container.strokes && container.strokes.length > 0);
    }
    
    /**
     * Generate background rect
     * @private
     */
    _generateBackgroundRect(container, layoutProps, context) {
        const ind = this.indent(context.depth + 1);
        const props = layoutProps || this.layoutEngine.extractLayoutProperties(container);
        
        const width = this.layoutEngine.toPixels(props.width);
        const height = this.layoutEngine.toPixels(props.height, true);
        
        const fill = this._getFillColor(container);
        const opacity = this._getFillOpacity(container);
        
        return `${ind}<rect x="0" y="0" width="${width}" height="${height}" fill="${fill}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''}/>`;
    }
    
    /**
     * Generate border rect
     * @private
     */
    _generateBorderRect(container, layoutProps, context) {
        const ind = this.indent(context.depth + 1);
        const props = layoutProps || this.layoutEngine.extractLayoutProperties(container);
        
        const width = this.layoutEngine.toPixels(props.width);
        const height = this.layoutEngine.toPixels(props.height, true);
        
        const stroke = this._getStrokeColor(container);
        const strokeWidth = this._getStrokeWidth(container);
        
        return `${ind}<rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
    }
    
    /**
     * Generate title text
     * @private
     */
    _generateTitleText(container, layoutProps, context) {
        const ind = this.indent(context.depth + 1);
        const props = layoutProps || this.layoutEngine.extractLayoutProperties(container);
        
        const x = this.layoutEngine.toPixels(props.padding?.left || 1);
        const y = this.options.fontSize;
        
        return `${ind}<text x="${x}" y="${y}" fill="${this.options.defaultColor}" font-family="${this.options.fontFamily}" font-size="${this.options.fontSize}">${this._escapeXml(container.title)}</text>`;
    }
    
    /**
     * Generate SVG for child element
     * @private
     */
    _generateChildSVG(child, bounds, childLayout, context) {
        const ind = this.indent(context.depth);
        
        switch (child.type) {
            case 'text':
            case 'ascii-text':
                return this._generateTextElement(child, bounds, context);
                
            case 'line':
                return this._generateLineElement(child, bounds, context);
                
            case 'rectangle':
                return this._generateRectElement(child, bounds, context);
                
            case 'ellipse':
                return this._generateEllipseElement(child, bounds, context);
                
            case 'path':
                return this._generatePathElement(child, bounds, context);
                
            default:
                // Generic rect for unknown types
                return this._generateGenericElement(child, bounds, context);
        }
    }
    
    /**
     * Generate text element
     * @private
     */
    _generateTextElement(child, bounds, context) {
        const ind = this.indent(context.depth);
        
        const text = child.text || '';
        const fill = this._getChildFillColor(child);
        
        const x = bounds.x;
        const y = bounds.y + this.options.fontSize;  // Baseline adjustment
        
        return `${ind}<text x="${x}" y="${y}" fill="${fill}" font-family="${this.options.fontFamily}" font-size="${this.options.fontSize}">${this._escapeXml(text)}</text>`;
    }
    
    /**
     * Generate line element
     * @private
     */
    _generateLineElement(child, bounds, context) {
        const ind = this.indent(context.depth);
        
        const x1 = this.layoutEngine.toPixels(child.x1 || 0);
        const y1 = this.layoutEngine.toPixels(child.y1 || 0, true);
        const x2 = this.layoutEngine.toPixels(child.x2 || 0);
        const y2 = this.layoutEngine.toPixels(child.y2 || 0, true);
        
        const stroke = this._getChildStrokeColor(child);
        const strokeWidth = child.stroke?.weight || 1;
        
        return `${ind}<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
    }
    
    /**
     * Generate rect element
     * @private
     */
    _generateRectElement(child, bounds, context) {
        const ind = this.indent(context.depth);
        
        const fill = this._getChildFillColor(child);
        const stroke = this._getChildStrokeColor(child);
        const strokeWidth = child.stroke?.weight || 0;
        
        let rx = 0;
        if (child.cornerRadius) {
            rx = typeof child.cornerRadius === 'number' 
                ? child.cornerRadius 
                : (child.cornerRadius.topLeft || 0);
        }
        
        const attrs = [
            `x="${bounds.x}"`,
            `y="${bounds.y}"`,
            `width="${bounds.width}"`,
            `height="${bounds.height}"`,
            `fill="${fill}"`
        ];
        
        if (rx > 0) {
            attrs.push(`rx="${rx}"`);
        }
        
        if (stroke !== 'none') {
            attrs.push(`stroke="${stroke}"`);
            attrs.push(`stroke-width="${strokeWidth}"`);
        }
        
        return `${ind}<rect ${attrs.join(' ')}/>`;
    }
    
    /**
     * Generate ellipse element
     * @private
     */
    _generateEllipseElement(child, bounds, context) {
        const ind = this.indent(context.depth);
        
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        const rx = bounds.width / 2;
        const ry = bounds.height / 2;
        
        const fill = this._getChildFillColor(child);
        const stroke = this._getChildStrokeColor(child);
        
        return `${ind}<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}"/>`;
    }
    
    /**
     * Generate path element
     * @private
     */
    _generatePathElement(child, bounds, context) {
        const ind = this.indent(context.depth);
        
        // Transform path data if needed
        const d = child.pathData || child.d || '';
        const fill = this._getChildFillColor(child);
        const stroke = this._getChildStrokeColor(child);
        
        const attrs = [
            `d="${d}"`,
            `fill="${fill}"`,
            `stroke="${stroke}"`
        ];
        
        if (bounds.x !== 0 || bounds.y !== 0) {
            attrs.push(`transform="translate(${bounds.x}, ${bounds.y})"`);
        }
        
        return `${ind}<path ${attrs.join(' ')}/>`;
    }
    
    /**
     * Generate generic rect for unknown types
     * @private
     */
    _generateGenericElement(child, bounds, context) {
        const ind = this.indent(context.depth);
        
        const fill = this._getChildFillColor(child);
        
        return `${ind}<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${fill}"/>`;
    }
    
    // ==========================================
    // COLOR HELPERS
    // ==========================================
    
    /**
     * Get fill color from container
     * @private
     */
    _getFillColor(obj) {
        if (obj.backgroundColor) return obj.backgroundColor;
        if (obj.fills?.length > 0) {
            return this._colorToSVG(obj.fills[0].color);
        }
        return this.options.backgroundColor;
    }
    
    /**
     * Get fill opacity from container
     * @private
     */
    _getFillOpacity(obj) {
        if (obj.fills?.length > 0) {
            return obj.fills[0].opacity ?? 1;
        }
        return 1;
    }
    
    /**
     * Get stroke color from container
     * @private
     */
    _getStrokeColor(obj) {
        if (obj.stroke?.color) return obj.stroke.color;
        if (obj.strokes?.length > 0) {
            return this._colorToSVG(obj.strokes[0].color);
        }
        return this.options.defaultColor;
    }
    
    /**
     * Get stroke width from container
     * @private
     */
    _getStrokeWidth(obj) {
        if (obj.stroke?.weight) return obj.stroke.weight;
        if (obj.strokes?.length > 0) {
            return obj.strokes[0].weight || 1;
        }
        return 1;
    }
    
    /**
     * Get fill color from child
     * @private
     */
    _getChildFillColor(child) {
        if (child.fillColor) return child.fillColor;
        if (child.fills?.length > 0) {
            return this._colorToSVG(child.fills[0].color);
        }
        return this.options.defaultColor;
    }
    
    /**
     * Get stroke color from child
     * @private
     */
    _getChildStrokeColor(child) {
        if (child.strokeColor) return child.strokeColor;
        if (child.stroke?.color) return child.stroke.color;
        if (child.strokes?.length > 0) {
            return this._colorToSVG(child.strokes[0].color);
        }
        return 'none';
    }
    
    /**
     * Convert color to SVG format
     * @private
     */
    _colorToSVG(color) {
        if (!color) return 'none';
        if (typeof color === 'string') return color;
        
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
     * Escape XML special characters
     * @private
     */
    _escapeXml(text) {
        if (typeof text !== 'string') return text;
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    // ==========================================
    // DEFS GENERATION
    // ==========================================
    
    /**
     * Get collected definitions
     * @returns {Array}
     */
    getDefs() {
        return this._defs;
    }
    
    /**
     * Generate defs section
     * @returns {string}
     */
    generateDefsSection() {
        if (this._defs.length === 0) return '';
        
        const lines = ['  <defs>'];
        
        for (const def of this._defs) {
            lines.push(this._defToString(def, 2));
        }
        
        lines.push('  </defs>');
        
        return lines.join('\n');
    }
    
    /**
     * Convert def object to string
     * @private
     */
    _defToString(def, indentLevel) {
        const ind = '  '.repeat(indentLevel);
        
        if (def.element === 'clipPath') {
            const lines = [`${ind}<clipPath id="${def.id}">`];
            
            for (const child of def.children || []) {
                const attrs = Object.entries(child.attributes || {})
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(' ');
                lines.push(`${ind}  <${child.element} ${attrs}/>`);
            }
            
            lines.push(`${ind}</clipPath>`);
            return lines.join('\n');
        }
        
        // Generic def
        const attrs = Object.entries(def.attributes || {})
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
        return `${ind}<${def.element} id="${def.id}" ${attrs}/>`;
    }
    
    /**
     * Reset state
     */
    reset() {
        this._defs = [];
        this.layoutEngine.reset();
    }
}

// ==========================================
// EXPORT
// ==========================================

export default SVGContainerExportEngine;
