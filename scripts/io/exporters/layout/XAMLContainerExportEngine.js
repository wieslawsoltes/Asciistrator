/**
 * Asciistrator - XAML Container Export Engine
 * 
 * Concrete container export implementation for XAML output.
 * Uses StackPanel, Grid, WrapPanel for auto-layout with proper nesting.
 * 
 * @version 1.0.0
 */

import { StringContainerExportEngine, ContainerType } from './ContainerExportEngine.js';
import { XAMLLayoutTransformer, XAMLPanelType } from './XAMLLayoutTransformer.js';
import { LayoutMode } from './LayoutExportEngine.js';

// ==========================================
// XAML CONTAINER EXPORT ENGINE
// ==========================================

/**
 * XAML container export engine.
 * Generates XAML with proper layout panels for Avalonia/WPF/MAUI.
 */
export class XAMLContainerExportEngine extends StringContainerExportEngine {
    /**
     * @param {Object} options - Export options
     */
    constructor(options = {}) {
        const layoutEngine = new XAMLLayoutTransformer({
            cellWidth: options.cellWidth || 10,
            cellHeight: options.cellHeight || 18,
            framework: options.framework || 'avalonia',
            preferGrid: options.preferGrid || false,
            ...options.layoutOptions
        });
        
        super(layoutEngine, {
            // XAML-specific options
            framework: 'avalonia',
            namespace: 'Generated',
            className: 'AsciiView',
            fontFamily: 'Consolas',
            fontSize: 12,
            backgroundColor: '#1a1a2e',
            defaultColor: '#e0e0e0',
            generateComments: true,
            wrapInUserControl: true,
            indentSize: 4,
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
        
        // Get layout transformation
        const layoutResult = this.layoutEngine.transformContainerLayout(
            layoutProps || this.layoutEngine.extractLayoutProperties(container),
            { ...context, childCount: container.children?.length || 0 }
        );
        
        // Build panel element
        const panelType = layoutResult.panelType;
        const panelAttrs = this._buildPanelAttributes(container, layoutResult, context);
        
        // Add comment if enabled
        if (this.options.generateComments && container.name) {
            lines.push(`${ind}<!-- ${container.name} -->`);
        }
        
        // Wrap in Border if has background or border
        const needsBorder = this._needsBorder(container);
        
        if (needsBorder) {
            const borderAttrs = this._buildBorderAttributes(container, layoutResult);
            lines.push(`${ind}<Border${borderAttrs}>`);
        }
        
        // Open panel
        lines.push(`${ind}${needsBorder ? this.indent(1) : ''}<${panelType}${panelAttrs}>`);
        
        // Grid definitions if needed
        if (panelType === XAMLPanelType.GRID && layoutResult.definitions) {
            lines.push(this._generateGridDefinitions(layoutResult.definitions, context.depth + 1 + (needsBorder ? 1 : 0)));
        }
        
        // Store layout result for children
        context._currentLayoutResult = layoutResult;
        context._needsBorder = needsBorder;
        
        return lines.join(this.options.lineEnding);
    }
    
    /**
     * End container element
     * @override
     */
    _endContainer(container, containerType, layoutProps, context) {
        const ind = this.indent(context.depth);
        const lines = [];
        
        const layoutResult = context._currentLayoutResult || 
            this.layoutEngine.transformContainerLayout(
                layoutProps || this.layoutEngine.extractLayoutProperties(container),
                context
            );
        
        const panelType = layoutResult.panelType;
        const needsBorder = context._needsBorder || this._needsBorder(container);
        
        // Close panel
        lines.push(`${ind}${needsBorder ? this.indent(1) : ''}</${panelType}>`);
        
        // Close Border if needed
        if (needsBorder) {
            lines.push(`${ind}</Border>`);
        }
        
        return lines.join(this.options.lineEnding);
    }
    
    /**
     * Export non-container child
     * @override
     */
    _exportChild(child, childLayout, context, index) {
        const ind = this.indent(context.depth);
        
        // Get child attributes
        const attrs = childLayout?.attributes || {};
        const attachedProps = childLayout?.attachedProps || {};
        
        // Merge all attributes
        const allAttrs = { ...attrs, ...attachedProps };
        
        // Generate element based on type
        return this._generateChildXAML(child, allAttrs, context, index);
    }
    
    // ==========================================
    // XAML ELEMENT GENERATION
    // ==========================================
    
    /**
     * Check if container needs Border wrapper
     * @private
     */
    _needsBorder(container) {
        return (container.backgroundColor || container.fills?.length > 0) ||
               (container.showBorder || container.strokes?.length > 0) ||
               (container.cornerRadius && typeof container.cornerRadius !== 'object' && container.cornerRadius > 0);
    }
    
    /**
     * Build panel attributes
     * @private
     */
    _buildPanelAttributes(container, layoutResult, context) {
        const attrs = { ...layoutResult.attributes };
        
        // Name
        if (container.name || container.id) {
            attrs['x:Name'] = this._toXamlName(container.name || container.id);
        }
        
        // Padding for content
        const props = this.layoutEngine.extractLayoutProperties(container);
        const padding = this.layoutEngine.transformPadding(props.padding);
        if (padding && layoutResult.panelType !== XAMLPanelType.CANVAS) {
            // Don't add padding to Canvas
            // For other panels, padding should be on wrapper or margin on children
        }
        
        return this._formatAttributes(attrs);
    }
    
    /**
     * Build Border attributes
     * @private
     */
    _buildBorderAttributes(container, layoutResult) {
        const attrs = {};
        
        // Background
        const bgColor = this._getBackgroundColor(container);
        if (bgColor) {
            attrs.Background = bgColor;
        }
        
        // Border
        const borderColor = this._getBorderColor(container);
        if (borderColor) {
            attrs.BorderBrush = borderColor;
            attrs.BorderThickness = this._getBorderThickness(container);
        }
        
        // Corner radius
        const cornerRadius = this._getCornerRadius(container);
        if (cornerRadius) {
            attrs.CornerRadius = cornerRadius;
        }
        
        // Padding
        const props = this.layoutEngine.extractLayoutProperties(container);
        const padding = this.layoutEngine.transformPadding(props.padding);
        if (padding) {
            attrs.Padding = padding;
        }
        
        // Size from layout result
        if (layoutResult.attributes?.Width) {
            attrs.Width = layoutResult.attributes.Width;
            delete layoutResult.attributes.Width;
        }
        if (layoutResult.attributes?.Height) {
            attrs.Height = layoutResult.attributes.Height;
            delete layoutResult.attributes.Height;
        }
        
        // Clipping
        if (props.clipContent) {
            attrs.ClipToBounds = 'True';
        }
        
        return this._formatAttributes(attrs);
    }
    
    /**
     * Generate Grid row/column definitions
     * @private
     */
    _generateGridDefinitions(definitions, depth) {
        const ind = this.indent(depth);
        const lines = [];
        
        // Row definitions
        if (definitions.rows?.length > 0) {
            lines.push(`${ind}<Grid.RowDefinitions>`);
            for (const row of definitions.rows) {
                lines.push(`${ind}    <RowDefinition Height="${row.size}"/>`);
            }
            lines.push(`${ind}</Grid.RowDefinitions>`);
        }
        
        // Column definitions
        if (definitions.columns?.length > 0) {
            lines.push(`${ind}<Grid.ColumnDefinitions>`);
            for (const col of definitions.columns) {
                lines.push(`${ind}    <ColumnDefinition Width="${col.size}"/>`);
            }
            lines.push(`${ind}</Grid.ColumnDefinitions>`);
        }
        
        return lines.join(this.options.lineEnding);
    }
    
    /**
     * Generate XAML for child element
     * @private
     */
    _generateChildXAML(child, attrs, context, index) {
        const ind = this.indent(context.depth);
        
        switch (child.type) {
            case 'text':
            case 'ascii-text':
                return this._generateTextBlock(child, attrs, context);
                
            case 'line':
                return this._generateLine(child, attrs, context);
                
            case 'rectangle':
                return this._generateRectangle(child, attrs, context);
                
            case 'ellipse':
                return this._generateEllipse(child, attrs, context);
                
            case 'path':
                return this._generatePath(child, attrs, context);
                
            default:
                // Generic Border with content
                return this._generateGenericElement(child, attrs, context);
        }
    }
    
    /**
     * Generate TextBlock
     * @private
     */
    _generateTextBlock(child, attrs, context) {
        const ind = this.indent(context.depth);
        
        const textAttrs = { ...attrs };
        textAttrs.Text = this._escapeXaml(child.text || '');
        textAttrs.FontFamily = this.options.fontFamily;
        textAttrs.FontSize = this.options.fontSize;
        textAttrs.Foreground = this._getChildForeground(child);
        
        return `${ind}<TextBlock ${this._formatAttributesInline(textAttrs)}/>`;
    }
    
    /**
     * Generate Line shape
     * @private
     */
    _generateLine(child, attrs, context) {
        const ind = this.indent(context.depth);
        
        const lineAttrs = { ...attrs };
        lineAttrs.X1 = this.layoutEngine.toPixels(child.x1 || 0);
        lineAttrs.Y1 = this.layoutEngine.toPixels(child.y1 || 0, true);
        lineAttrs.X2 = this.layoutEngine.toPixels(child.x2 || 0);
        lineAttrs.Y2 = this.layoutEngine.toPixels(child.y2 || 0, true);
        lineAttrs.Stroke = this._getChildStroke(child);
        lineAttrs.StrokeThickness = child.stroke?.weight || 1;
        
        return `${ind}<Line ${this._formatAttributesInline(lineAttrs)}/>`;
    }
    
    /**
     * Generate Rectangle shape
     * @private
     */
    _generateRectangle(child, attrs, context) {
        const ind = this.indent(context.depth);
        
        const rectAttrs = { ...attrs };
        rectAttrs.Fill = this._getChildFill(child);
        
        const stroke = this._getChildStroke(child);
        if (stroke !== 'Transparent') {
            rectAttrs.Stroke = stroke;
            rectAttrs.StrokeThickness = child.stroke?.weight || 1;
        }
        
        // Corner radius
        const radius = this._getCornerRadius(child);
        if (radius) {
            rectAttrs.RadiusX = radius;
            rectAttrs.RadiusY = radius;
        }
        
        return `${ind}<Rectangle ${this._formatAttributesInline(rectAttrs)}/>`;
    }
    
    /**
     * Generate Ellipse shape
     * @private
     */
    _generateEllipse(child, attrs, context) {
        const ind = this.indent(context.depth);
        
        const ellipseAttrs = { ...attrs };
        ellipseAttrs.Fill = this._getChildFill(child);
        
        const stroke = this._getChildStroke(child);
        if (stroke !== 'Transparent') {
            ellipseAttrs.Stroke = stroke;
            ellipseAttrs.StrokeThickness = child.stroke?.weight || 1;
        }
        
        return `${ind}<Ellipse ${this._formatAttributesInline(ellipseAttrs)}/>`;
    }
    
    /**
     * Generate Path shape
     * @private
     */
    _generatePath(child, attrs, context) {
        const ind = this.indent(context.depth);
        
        const pathAttrs = { ...attrs };
        pathAttrs.Data = child.pathData || child.d || '';
        pathAttrs.Fill = this._getChildFill(child);
        
        const stroke = this._getChildStroke(child);
        if (stroke !== 'Transparent') {
            pathAttrs.Stroke = stroke;
            pathAttrs.StrokeThickness = child.stroke?.weight || 1;
        }
        
        return `${ind}<Path ${this._formatAttributesInline(pathAttrs)}/>`;
    }
    
    /**
     * Generate generic Border element
     * @private
     */
    _generateGenericElement(child, attrs, context) {
        const ind = this.indent(context.depth);
        
        const borderAttrs = { ...attrs };
        borderAttrs.Background = this._getChildFill(child);
        
        const stroke = this._getChildStroke(child);
        if (stroke !== 'Transparent') {
            borderAttrs.BorderBrush = stroke;
            borderAttrs.BorderThickness = child.stroke?.weight || 1;
        }
        
        return `${ind}<Border ${this._formatAttributesInline(borderAttrs)}/>`;
    }
    
    // ==========================================
    // ATTRIBUTE FORMATTING
    // ==========================================
    
    /**
     * Format attributes as multi-line string
     * @private
     */
    _formatAttributes(attrs) {
        if (!attrs || Object.keys(attrs).length === 0) return '';
        
        return ' ' + Object.entries(attrs)
            .filter(([_, v]) => v != null)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
    }
    
    /**
     * Format attributes inline
     * @private
     */
    _formatAttributesInline(attrs) {
        if (!attrs || Object.keys(attrs).length === 0) return '';
        
        return Object.entries(attrs)
            .filter(([_, v]) => v != null)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
    }
    
    /**
     * Convert name to valid XAML x:Name
     * @private
     */
    _toXamlName(name) {
        if (!name) return null;
        
        // Remove invalid characters, ensure starts with letter
        let xamlName = name.replace(/[^a-zA-Z0-9_]/g, '_');
        if (!/^[a-zA-Z]/.test(xamlName)) {
            xamlName = 'x_' + xamlName;
        }
        return xamlName;
    }
    
    // ==========================================
    // COLOR HELPERS
    // ==========================================
    
    /**
     * Get background color
     * @private
     */
    _getBackgroundColor(obj) {
        if (obj.backgroundColor) return obj.backgroundColor;
        if (obj.fills?.length > 0) {
            return this._colorToXaml(obj.fills[0].color);
        }
        return null;
    }
    
    /**
     * Get border color
     * @private
     */
    _getBorderColor(obj) {
        if (obj.stroke?.color) return obj.stroke.color;
        if (obj.strokes?.length > 0) {
            return this._colorToXaml(obj.strokes[0].color);
        }
        return null;
    }
    
    /**
     * Get border thickness
     * @private
     */
    _getBorderThickness(obj) {
        if (obj.stroke?.weight) return obj.stroke.weight;
        if (obj.strokes?.length > 0) {
            return obj.strokes[0].weight || 1;
        }
        return 1;
    }
    
    /**
     * Get corner radius
     * @private
     */
    _getCornerRadius(obj) {
        if (!obj.cornerRadius) return null;
        
        if (typeof obj.cornerRadius === 'number') {
            return obj.cornerRadius > 0 ? obj.cornerRadius : null;
        }
        
        if (obj.cornerRadius.independent) {
            return `${obj.cornerRadius.topLeft || 0},${obj.cornerRadius.topRight || 0},${obj.cornerRadius.bottomRight || 0},${obj.cornerRadius.bottomLeft || 0}`;
        }
        
        return obj.cornerRadius.topLeft || null;
    }
    
    /**
     * Get child foreground color
     * @private
     */
    _getChildForeground(child) {
        if (child.fillColor) return child.fillColor;
        if (child.fills?.length > 0) {
            return this._colorToXaml(child.fills[0].color);
        }
        return this.options.defaultColor;
    }
    
    /**
     * Get child fill
     * @private
     */
    _getChildFill(child) {
        if (child.fillColor) return child.fillColor;
        if (child.fills?.length > 0) {
            return this._colorToXaml(child.fills[0].color);
        }
        return 'Transparent';
    }
    
    /**
     * Get child stroke
     * @private
     */
    _getChildStroke(child) {
        if (child.strokeColor) return child.strokeColor;
        if (child.stroke?.color) return child.stroke.color;
        if (child.strokes?.length > 0) {
            return this._colorToXaml(child.strokes[0].color);
        }
        return 'Transparent';
    }
    
    /**
     * Convert color to XAML format
     * @private
     */
    _colorToXaml(color) {
        if (!color) return 'Transparent';
        if (typeof color === 'string') return color;
        
        if (typeof color === 'object') {
            const r = Math.round((color.r || 0) * 255).toString(16).padStart(2, '0');
            const g = Math.round((color.g || 0) * 255).toString(16).padStart(2, '0');
            const b = Math.round((color.b || 0) * 255).toString(16).padStart(2, '0');
            const a = Math.round((color.a ?? 1) * 255).toString(16).padStart(2, '0');
            
            if (color.a != null && color.a < 1) {
                return `#${a}${r}${g}${b}`.toUpperCase();
            }
            return `#${r}${g}${b}`.toUpperCase();
        }
        
        return 'Transparent';
    }
    
    /**
     * Escape XAML special characters
     * @private
     */
    _escapeXaml(text) {
        if (typeof text !== 'string') return text;
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    // ==========================================
    // DOCUMENT GENERATION
    // ==========================================
    
    /**
     * Generate complete XAML document
     * @param {Object} rootContainer - Root container to export
     * @param {Object} options - Additional options
     * @returns {string}
     */
    generateDocument(rootContainer, options = {}) {
        const lines = [];
        
        // XML declaration
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        
        // Comment
        if (this.options.generateComments) {
            lines.push(`<!-- Generated by Asciistrator - ${this.options.framework.toUpperCase()} XAML -->`);
            lines.push('');
        }
        
        // Root element
        if (this.options.wrapInUserControl) {
            const ns = this._getNamespaces();
            lines.push(`<UserControl ${ns}`);
            lines.push(`    x:Class="${this.options.namespace}.${this.options.className}">`);
        }
        
        // Export container
        const content = this.exportContainer(rootContainer, { depth: this.options.wrapInUserControl ? 1 : 0 });
        if (content) {
            lines.push(content);
        }
        
        // Close root
        if (this.options.wrapInUserControl) {
            lines.push('</UserControl>');
        }
        
        return lines.join('\n');
    }
    
    /**
     * Get namespace declarations
     * @private
     */
    _getNamespaces() {
        switch (this.options.framework) {
            case 'avalonia':
                return 'xmlns="https://github.com/avaloniaui"\n    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"';
            case 'wpf':
                return 'xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"\n    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"';
            case 'maui':
                return 'xmlns="http://schemas.microsoft.com/dotnet/2021/maui"\n    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"';
            default:
                return 'xmlns="https://github.com/avaloniaui"\n    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"';
        }
    }
}

// ==========================================
// EXPORT
// ==========================================

export default XAMLContainerExportEngine;
