/**
 * Asciistrator - HTML Container Export Engine
 * 
 * Concrete container export implementation for HTML output.
 * Uses CSS flexbox for auto-layout and proper nested div structure.
 * 
 * @version 1.0.0
 */

import { StringContainerExportEngine, ContainerType } from './ContainerExportEngine.js';
import { CSSLayoutTransformer } from './CSSLayoutTransformer.js';
import { LayoutMode, SizingMode } from './LayoutExportEngine.js';

// ==========================================
// HTML CONTAINER EXPORT ENGINE
// ==========================================

/**
 * HTML/CSS container export engine.
 * Generates semantic HTML with CSS flexbox layout.
 */
export class HTMLContainerExportEngine extends StringContainerExportEngine {
    /**
     * @param {Object} options - Export options
     */
    constructor(options = {}) {
        const layoutEngine = new CSSLayoutTransformer({
            cellWidth: options.cellWidth || 10,
            cellHeight: options.cellHeight || 18,
            useGap: options.useGap !== false,
            generateClasses: options.generateClasses || false,
            ...options.layoutOptions
        });
        
        super(layoutEngine, {
            // HTML-specific options
            useSemanticElements: true,
            generateDataAttributes: true,
            includeComments: false,
            cssMode: 'inline', // 'inline', 'classes', 'stylesheet'
            fontFamily: "'Courier New', Consolas, monospace",
            fontSize: '14px',
            backgroundColor: '#1a1a2e',
            defaultColor: '#e0e0e0',
            ...options
        });
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
        
        // Generate container styles
        const layoutResult = layoutProps 
            ? this.layoutEngine.transformContainerLayout(layoutProps, context)
            : { styles: { position: 'relative' } };
        
        // Add container-specific styles
        const styles = { ...layoutResult.styles };
        
        // Background color
        if (container.backgroundColor || container.fills?.length > 0) {
            styles.backgroundColor = this._getBackgroundColor(container);
        }
        
        // Border
        if (container.showBorder || container.strokes?.length > 0) {
            const borderColor = this._getBorderColor(container);
            styles.border = `1px solid ${borderColor}`;
        }
        
        // Font settings for ASCII content
        if (containerType === ContainerType.FRAME || context.depth === 0) {
            styles.fontFamily = this.options.fontFamily;
            styles.fontSize = this.options.fontSize;
            styles.lineHeight = '1';
            styles.whiteSpace = 'pre';
        }
        
        // Determine HTML element
        const element = this._selectElement(container, containerType);
        
        // Build attributes
        const attrs = this._buildAttributes(container, styles, context);
        
        // Opening tag
        lines.push(`${ind}<${element}${attrs}>`);
        
        // Title if present
        if (container.title) {
            lines.push(`${this.indent(context.depth + 1)}<div class="frame-title">${this._escapeHtml(container.title)}</div>`);
        }
        
        return lines.join(this.options.lineEnding);
    }
    
    /**
     * End container element
     * @override
     */
    _endContainer(container, containerType, layoutProps, context) {
        const ind = this.indent(context.depth);
        const element = this._selectElement(container, containerType);
        return `${ind}</${element}>`;
    }
    
    /**
     * Export non-container child
     * @override
     */
    _exportChild(child, childLayout, context, index) {
        const ind = this.indent(context.depth);
        
        // Build child styles
        const styles = childLayout?.styles || {};
        
        // Position for non-layout children
        if (!context.parentLayout || context.parentLayout.layoutMode === LayoutMode.NONE) {
            if (child.computedX != null || child.x != null) {
                styles.position = 'absolute';
                styles.left = this.layoutEngine.toTargetUnit(child.computedX ?? child.x);
                styles.top = this.layoutEngine.toTargetUnit(child.computedY ?? child.y, true);
            }
        }
        
        // Size
        if (child.width > 0 && childLayout?.styles?.width === undefined) {
            styles.width = this.layoutEngine.toTargetUnit(child.width);
        }
        if (child.height > 0 && childLayout?.styles?.height === undefined) {
            styles.height = this.layoutEngine.toTargetUnit(child.height, true);
        }
        
        // Color
        if (child.fillColor || child.fills?.length > 0) {
            styles.color = this._getFillColor(child);
        }
        
        // Generate element based on type
        return this._generateChildElement(child, styles, context);
    }
    
    // ==========================================
    // ELEMENT GENERATION
    // ==========================================
    
    /**
     * Select HTML element for container
     * @private
     */
    _selectElement(container, containerType) {
        if (!this.options.useSemanticElements) return 'div';
        
        switch (containerType) {
            case ContainerType.SECTION:
                return 'section';
            case ContainerType.COMPONENT:
            case ContainerType.INSTANCE:
                return 'article';
            case 'ui-component':
                return this._selectUIComponentElement(container);
            default:
                return 'div';
        }
    }
    
    /**
     * Select element for UI component
     * @private
     */
    _selectUIComponentElement(container) {
        const uiType = container.uiComponentType;
        
        const elementMap = {
            'button': 'button',
            'input': 'input',
            'text-field': 'input',
            'checkbox': 'input',
            'radio': 'input',
            'select': 'select',
            'textarea': 'textarea',
            'label': 'label',
            'link': 'a',
            'nav': 'nav',
            'header': 'header',
            'footer': 'footer',
            'main': 'main',
            'aside': 'aside'
        };
        
        return elementMap[uiType] || 'div';
    }
    
    /**
     * Build HTML attributes string
     * @private
     */
    _buildAttributes(container, styles, context) {
        const attrs = [];
        
        // ID
        if (container.id && this.options.generateDataAttributes) {
            attrs.push(`data-id="${container.id}"`);
        }
        
        // Class
        const classes = this._buildClasses(container, context);
        if (classes.length > 0) {
            attrs.push(`class="${classes.join(' ')}"`);
        }
        
        // Style
        if (Object.keys(styles).length > 0) {
            const styleStr = this.layoutEngine.stylesToString(styles);
            attrs.push(`style="${styleStr}"`);
        }
        
        // Data attributes
        if (this.options.generateDataAttributes) {
            if (container.name) {
                attrs.push(`data-name="${this._escapeHtml(container.name)}"`);
            }
            if (container.type) {
                attrs.push(`data-type="${container.type}"`);
            }
        }
        
        // Accessibility
        if (container.accessibilityLabel) {
            attrs.push(`aria-label="${this._escapeHtml(container.accessibilityLabel)}"`);
        }
        
        return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    }
    
    /**
     * Build CSS classes
     * @private
     */
    _buildClasses(container, context) {
        const classes = [];
        
        // Type-based class
        if (container.type) {
            classes.push(`asc-${container.type}`);
        }
        
        // Auto-layout class
        if (this.layoutEngine.hasAutoLayout(container)) {
            classes.push('asc-auto-layout');
            classes.push(`asc-layout-${container.layoutMode.toLowerCase()}`);
        }
        
        // Component class
        if (container.uiComponentType) {
            classes.push(`asc-ui-${container.uiComponentType}`);
        }
        
        return classes;
    }
    
    /**
     * Generate HTML element for child object
     * @private
     */
    _generateChildElement(child, styles, context) {
        const ind = this.indent(context.depth);
        
        // Build style string
        const styleAttr = Object.keys(styles).length > 0
            ? ` style="${this.layoutEngine.stylesToString(styles)}"`
            : '';
        
        switch (child.type) {
            case 'text':
            case 'ascii-text':
                return `${ind}<span${styleAttr}>${this._escapeHtml(child.text || '')}</span>`;
                
            case 'line':
                return this._generateLineElement(child, styles, context);
                
            case 'rectangle':
            case 'ellipse':
                return this._generateShapeElement(child, styles, context);
                
            default:
                // Generic element with ASCII content
                const content = child.asciiContent || child.text || '';
                return `${ind}<div${styleAttr}>${this._escapeHtml(content)}</div>`;
        }
    }
    
    /**
     * Generate SVG-in-HTML for line element
     * @private
     */
    _generateLineElement(child, styles, context) {
        const ind = this.indent(context.depth);
        
        const x1 = this.layoutEngine.toPixels(child.x1 || 0);
        const y1 = this.layoutEngine.toPixels(child.y1 || 0, true);
        const x2 = this.layoutEngine.toPixels(child.x2 || 0);
        const y2 = this.layoutEngine.toPixels(child.y2 || 0, true);
        
        const width = Math.abs(x2 - x1) || 1;
        const height = Math.abs(y2 - y1) || 1;
        
        const strokeColor = this._getStrokeColor(child) || this.options.defaultColor;
        
        return `${ind}<svg width="${width}" height="${height}" style="${this.layoutEngine.stylesToString(styles)}">
${ind}  <line x1="${Math.min(x1, x2) === x1 ? 0 : width}" y1="${Math.min(y1, y2) === y1 ? 0 : height}" x2="${Math.min(x1, x2) === x1 ? width : 0}" y2="${Math.min(y1, y2) === y1 ? height : 0}" stroke="${strokeColor}" stroke-width="1"/>
${ind}</svg>`;
    }
    
    /**
     * Generate div for shape element
     * @private
     */
    _generateShapeElement(child, styles, context) {
        const ind = this.indent(context.depth);
        
        const shapeStyles = { ...styles };
        
        if (child.type === 'ellipse') {
            shapeStyles.borderRadius = '50%';
        }
        
        const bgColor = this._getFillColor(child);
        if (bgColor) {
            shapeStyles.backgroundColor = bgColor;
        }
        
        const borderColor = this._getStrokeColor(child);
        if (borderColor) {
            shapeStyles.border = `1px solid ${borderColor}`;
        }
        
        return `${ind}<div style="${this.layoutEngine.stylesToString(shapeStyles)}"></div>`;
    }
    
    // ==========================================
    // COLOR HELPERS
    // ==========================================
    
    /**
     * Get background color from container
     * @private
     */
    _getBackgroundColor(obj) {
        if (obj.backgroundColor) return obj.backgroundColor;
        if (obj.fills?.length > 0) {
            return this._fillToCSS(obj.fills[0]);
        }
        return null;
    }
    
    /**
     * Get border color from container
     * @private
     */
    _getBorderColor(obj) {
        if (obj.stroke?.color) return obj.stroke.color;
        if (obj.strokes?.length > 0) {
            return this._fillToCSS(obj.strokes[0]);
        }
        return this.options.defaultColor;
    }
    
    /**
     * Get fill color from object
     * @private
     */
    _getFillColor(obj) {
        if (obj.fillColor) return obj.fillColor;
        if (obj.fills?.length > 0) {
            return this._fillToCSS(obj.fills[0]);
        }
        return null;
    }
    
    /**
     * Get stroke color from object
     * @private
     */
    _getStrokeColor(obj) {
        if (obj.strokeColor) return obj.strokeColor;
        if (obj.stroke?.color) return obj.stroke.color;
        if (obj.strokes?.length > 0) {
            return this._fillToCSS(obj.strokes[0]);
        }
        return null;
    }
    
    /**
     * Convert fill object to CSS color
     * @private
     */
    _fillToCSS(fill) {
        if (!fill || !fill.color) return null;
        
        const color = fill.color;
        if (typeof color === 'string') return color;
        
        // Figma-style color
        if (typeof color === 'object') {
            const r = Math.round((color.r || 0) * 255);
            const g = Math.round((color.g || 0) * 255);
            const b = Math.round((color.b || 0) * 255);
            const a = color.a ?? fill.opacity ?? 1;
            
            if (a < 1) {
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            }
            return `rgb(${r}, ${g}, ${b})`;
        }
        
        return null;
    }
    
    /**
     * Escape HTML special characters
     * @private
     */
    _escapeHtml(text) {
        if (typeof text !== 'string') return text;
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // ==========================================
    // STYLESHEET GENERATION
    // ==========================================
    
    /**
     * Generate CSS stylesheet for all exported containers
     * @returns {string}
     */
    generateStylesheet() {
        const lines = [];
        
        // Base styles
        lines.push('.asc-frame {');
        lines.push(`  font-family: ${this.options.fontFamily};`);
        lines.push(`  font-size: ${this.options.fontSize};`);
        lines.push('  line-height: 1;');
        lines.push('  white-space: pre;');
        lines.push('  box-sizing: border-box;');
        lines.push('}');
        lines.push('');
        
        // Auto-layout classes
        lines.push('.asc-auto-layout {');
        lines.push('  display: flex;');
        lines.push('}');
        lines.push('');
        
        lines.push('.asc-layout-horizontal {');
        lines.push('  flex-direction: row;');
        lines.push('}');
        lines.push('');
        
        lines.push('.asc-layout-vertical {');
        lines.push('  flex-direction: column;');
        lines.push('}');
        
        // Add generated classes from layout engine
        if (this.layoutEngine.options.generateClasses) {
            lines.push('');
            lines.push(this.layoutEngine.generateStylesheet());
        }
        
        return lines.join('\n');
    }
}

// ==========================================
// EXPORT
// ==========================================

export default HTMLContainerExportEngine;
