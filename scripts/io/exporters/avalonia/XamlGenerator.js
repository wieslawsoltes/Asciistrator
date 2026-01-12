/**
 * Asciistrator - XAML Generator
 * 
 * Generates Avalonia XAML markup from component definitions.
 * Handles indentation, namespaces, elements, and content properties.
 * 
 * @version 1.0.0
 */

import { getMappingBySourceId, getMappingByControlName } from './ComponentMappings.js';
import { propertyConverter } from './PropertyConverters.js';

// ==========================================
// XAML NAMESPACE DEFINITIONS
// ==========================================

/**
 * Standard Avalonia XML namespaces
 */
export const XAML_NAMESPACES = {
    default: 'https://github.com/avaloniaui',
    x: 'http://schemas.microsoft.com/winfx/2006/xaml',
    d: 'http://schemas.microsoft.com/expression/blend/2008',
    mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    local: 'clr-namespace:',
    controls: 'clr-namespace:Avalonia.Controls;assembly=Avalonia.Controls'
};

// ==========================================
// XAML GENERATOR CLASS
// ==========================================

/**
 * XAML generator for Avalonia
 */
export class XamlGenerator {
    constructor(options = {}) {
        this._options = {
            indentSize: 4,
            useTabs: false,
            includeDesignTimeData: true,
            includeComments: true,
            rootNamespace: 'AsciistratorApp',
            styleResourceKey: 'AsciiStyles',
            ...options
        };
        
        this._usedNamespaces = new Set(['default', 'x']);
        this._resourceReferences = new Set();
    }
    
    // ==========================================
    // PUBLIC API
    // ==========================================
    
    /**
     * Generate complete XAML document
     * @param {object} scene - Scene definition with components
     * @param {string} rootElement - Root element type (Window, UserControl, etc.)
     * @returns {string} Complete XAML document
     */
    generateDocument(scene, rootElement = 'Window') {
        this._usedNamespaces.clear();
        this._usedNamespaces.add('default');
        this._usedNamespaces.add('x');
        this._resourceReferences.clear();
        
        const content = this._generateContent(scene.components || scene.children || []);
        
        const lines = [];
        
        // XML declaration
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        
        // Root element with namespaces
        lines.push(this._generateRootElement(rootElement, scene));
        
        // Design-time properties
        if (this._options.includeDesignTimeData && (rootElement === 'Window' || rootElement === 'UserControl')) {
            lines.push(this._indent(1) + `d:DesignWidth="${scene.width || 800}" d:DesignHeight="${scene.height || 600}"`);
        }
        
        // Class name
        if (scene.className) {
            lines.push(this._indent(1) + `x:Class="${this._options.rootNamespace}.${scene.className}"`);
        }
        
        // Title for windows
        if (rootElement === 'Window' && scene.title) {
            lines.push(this._indent(1) + `Title="${this._escapeXml(scene.title)}"`);
        }
        
        // Close root opening tag
        const lastLine = lines[lines.length - 1];
        if (!lastLine.endsWith('>')) {
            lines[lines.length - 1] = lastLine + '>';
        }
        
        // Main content
        if (content) {
            lines.push('');
            lines.push(content);
        }
        
        // Close root element
        lines.push(`</${rootElement}>`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate XAML for a single component
     * @param {object} component - Component definition
     * @param {number} indentLevel - Current indentation level
     * @returns {string} XAML markup
     */
    generateComponent(component, indentLevel = 0) {
        // Check if this is a UI component with a direct Avalonia control type
        if (component.avaloniaControl) {
            return this._generateUIComponent(component, indentLevel);
        }
        
        const mapping = getMappingBySourceId(component.type);
        
        if (!mapping) {
            // Fallback for unmapped components
            return this._generateGenericComponent(component, indentLevel);
        }
        
        return this._generateMappedComponent(component, mapping, indentLevel);
    }
    
    /**
     * Generate XAML for a UI component (from component library)
     * @private
     */
    _generateUIComponent(component, indentLevel) {
        const indent = this._indent(indentLevel);
        const tagName = component.avaloniaControl;
        const lines = [];
        
        // Check if namespace prefix needed
        let fullTagName = tagName;
        if (component.avaloniaNamespace && component.avaloniaNamespace !== 'Avalonia.Controls') {
            // Extract namespace alias for non-standard namespaces
            const nsAlias = this._getNamespaceAlias(component.avaloniaNamespace);
            if (nsAlias) {
                fullTagName = `${nsAlias}:${tagName}`;
                this._usedNamespaces.add(nsAlias);
            }
        }
        
        // Collect attributes
        const attributes = this._buildUIComponentAttributes(component);
        
        // Get children/content
        const children = component.children || [];
        const contentValue = component.content || component.text;
        
        // Determine if self-closing
        const hasContent = children.length > 0 || contentValue;
        
        // Build element
        if (attributes.length === 0 && !hasContent) {
            lines.push(`${indent}<${fullTagName} />`);
        } else if (attributes.length <= 2 && !hasContent) {
            lines.push(`${indent}<${fullTagName} ${attributes.join(' ')} />`);
        } else {
            lines.push(`${indent}<${fullTagName}`);
            
            for (const attr of attributes) {
                lines.push(`${indent}${this._indent(1)}${attr}`);
            }
            
            if (hasContent) {
                lines[lines.length - 1] += '>';
                
                if (children.length > 0) {
                    for (const child of children) {
                        lines.push(this.generateComponent(child, indentLevel + 1));
                    }
                } else if (contentValue) {
                    lines.push(`${indent}${this._indent(1)}${this._escapeXml(contentValue)}`);
                }
                
                lines.push(`${indent}</${fullTagName}>`);
            } else {
                lines[lines.length - 1] += ' />';
            }
        }
        
        return lines.join('\n');
    }
    
    /**
     * Build attributes for UI component
     * Only outputs properties that were explicitly set
     * @private
     */
    _buildUIComponentAttributes(component) {
        const attributes = [];
        
        // Canvas attached properties (position)
        if (component.canvasLeft !== undefined) {
            attributes.push(`Canvas.Left="${component.canvasLeft}"`);
        }
        if (component.canvasTop !== undefined) {
            attributes.push(`Canvas.Top="${component.canvasTop}"`);
        }
        
        // Property name mapping from internal to XAML
        const propMap = {
            'text': 'Text',
            'content': 'Content',
            'value': 'Value',
            'isChecked': 'IsChecked',
            'isEnabled': 'IsEnabled',
            'isVisible': 'IsVisible',
            'placeholder': 'Watermark',
            'minimum': 'Minimum',
            'maximum': 'Maximum',
            'selectedItem': 'SelectedItem',
            'orientation': 'Orientation',
            'width': 'Width',
            'height': 'Height',
            'minWidth': 'MinWidth',
            'minHeight': 'MinHeight',
            'maxWidth': 'MaxWidth',
            'maxHeight': 'MaxHeight',
            'horizontalAlignment': 'HorizontalAlignment',
            'verticalAlignment': 'VerticalAlignment',
            'horizontalContentAlignment': 'HorizontalContentAlignment',
            'verticalContentAlignment': 'VerticalContentAlignment',
            'header': 'Header',
            'title': 'Title',
            'icon': 'Icon',
            'isDefault': 'IsDefault',
            'isCancel': 'IsCancel',
            'command': 'Command',
            'commandParameter': 'CommandParameter',
            'margin': 'Margin',
            'padding': 'Padding'
        };
        
        // Only output properties that exist in the component object
        // (these were set by _extractUIComponentProperties which already filtered defaults)
        for (const [src, target] of Object.entries(propMap)) {
            if (component[src] !== undefined && component[src] !== null && component[src] !== '') {
                let value = component[src];
                // Convert booleans to XAML format
                if (typeof value === 'boolean') {
                    value = value ? 'True' : 'False';
                }
                // Handle Thickness (margin/padding)
                if ((src === 'margin' || src === 'padding') && typeof value !== 'string') {
                    value = propertyConverter.convert(value, 'thickness');
                }
                attributes.push(`${target}="${this._escapeXml(String(value))}"`);
            }
        }
        
        return attributes;
    }
    
    /**
     * Get namespace alias for a CLR namespace
     * @private
     */
    _getNamespaceAlias(namespace) {
        // Map common namespaces to aliases
        const namespaceAliases = {
            'Avalonia.Controls.Primitives': 'primitives',
            'Avalonia.Controls.Shapes': 'shapes',
            'Avalonia.Media': 'media',
            'Avalonia.Layout': 'layout',
            'Avalonia.Data': 'data',
            'Avalonia.Interactivity': 'interactivity'
        };
        return namespaceAliases[namespace] || null;
    }
    
    /**
     * Generate XAML for layout container
     * @param {object} container - Container definition
     * @param {number} indentLevel - Indentation level
     * @returns {string}
     */
    generateContainer(container, indentLevel = 0) {
        return this.generateComponent(container, indentLevel);
    }
    
    /**
     * Get list of used namespaces
     * @returns {Set<string>}
     */
    getUsedNamespaces() {
        return new Set(this._usedNamespaces);
    }
    
    /**
     * Get resource references
     * @returns {Set<string>}
     */
    getResourceReferences() {
        return new Set(this._resourceReferences);
    }
    
    // ==========================================
    // PRIVATE: ELEMENT GENERATION
    // ==========================================
    
    /**
     * Generate root element opening tag with namespaces
     * @private
     */
    _generateRootElement(elementType, scene) {
        const namespaces = this._buildNamespaceDeclarations();
        return `<${elementType}\n${this._indent(1)}${namespaces.join('\n' + this._indent(1))}`;
    }
    
    /**
     * Build namespace declarations
     * @private
     */
    _buildNamespaceDeclarations() {
        const declarations = [];
        
        // Default namespace
        declarations.push(`xmlns="${XAML_NAMESPACES.default}"`);
        
        // XAML namespace
        declarations.push(`xmlns:x="${XAML_NAMESPACES.x}"`);
        
        // Design-time namespaces
        if (this._options.includeDesignTimeData) {
            declarations.push(`xmlns:d="${XAML_NAMESPACES.d}"`);
            declarations.push(`xmlns:mc="${XAML_NAMESPACES.mc}"`);
            declarations.push(`mc:Ignorable="d"`);
        }
        
        // Local namespace
        if (this._options.rootNamespace) {
            declarations.push(`xmlns:local="clr-namespace:${this._options.rootNamespace}"`);
        }
        
        return declarations;
    }
    
    /**
     * Generate mapped component XAML
     * @private
     */
    _generateMappedComponent(component, mapping, indentLevel) {
        const indent = this._indent(indentLevel);
        const tagName = mapping.avaloniaControl;
        const lines = [];
        
        // Collect attributes
        const attributes = this._buildAttributes(component, mapping);
        
        // Collect attached properties
        const attachedProps = this._buildAttachedProperties(component);
        
        // Get children/content
        const children = component.children || [];
        const contentValue = component.content || component.text;
        
        // Determine if self-closing
        const hasContent = children.length > 0 || contentValue;
        
        // Build opening tag
        if (attributes.length === 0 && attachedProps.length === 0 && !hasContent) {
            lines.push(`${indent}<${tagName} />`);
        } else if (attributes.length <= 2 && attachedProps.length === 0 && !hasContent) {
            // Single line with attributes
            lines.push(`${indent}<${tagName} ${attributes.join(' ')} />`);
        } else {
            // Multi-line format
            lines.push(`${indent}<${tagName}`);
            
            // Add attributes
            for (const attr of attributes) {
                lines.push(`${indent}${this._indent(1)}${attr}`);
            }
            
            // Add attached properties
            for (const prop of attachedProps) {
                lines.push(`${indent}${this._indent(1)}${prop}`);
            }
            
            if (hasContent) {
                // Close opening tag
                lines[lines.length - 1] += '>';
                
                // Add content
                if (children.length > 0) {
                    for (const child of children) {
                        lines.push(this.generateComponent(child, indentLevel + 1));
                    }
                } else if (contentValue) {
                    // Simple text content
                    if (mapping.contentProperty && mapping.contentProperty !== 'Content') {
                        lines.push(`${indent}${this._indent(1)}<${tagName}.${mapping.contentProperty}>`);
                        lines.push(`${indent}${this._indent(2)}${this._escapeXml(contentValue)}`);
                        lines.push(`${indent}${this._indent(1)}</${tagName}.${mapping.contentProperty}>`);
                    } else {
                        lines.push(`${indent}${this._indent(1)}${this._escapeXml(contentValue)}`);
                    }
                }
                
                // Closing tag
                lines.push(`${indent}</${tagName}>`);
            } else {
                // Self-closing
                lines[lines.length - 1] += ' />';
            }
        }
        
        return lines.join('\n');
    }
    
    /**
     * Generate generic component for unmapped types
     * @private
     */
    _generateGenericComponent(component, indentLevel) {
        const indent = this._indent(indentLevel);
        
        // Add comment about unmapped component
        if (this._options.includeComments) {
            const comment = `${indent}<!-- Unmapped component: ${component.type} -->`;
            return comment + '\n' + `${indent}<ContentControl Tag="${component.type}" />`;
        }
        
        return `${indent}<ContentControl Tag="${component.type}" />`;
    }
    
    // ==========================================
    // PRIVATE: ATTRIBUTE BUILDING
    // ==========================================
    
    /**
     * Build attribute list for component
     * @private
     */
    _buildAttributes(component, mapping) {
        const attributes = [];
        
        // Add name/key if present
        if (component.name) {
            attributes.push(`x:Name="${component.name}"`);
        }
        
        // Add style class if present
        if (component.styleClass || mapping.styleClass) {
            const styleClass = component.styleClass || mapping.styleClass;
            attributes.push(`Classes="${styleClass}"`);
        }
        
        // Convert properties
        for (const propMapping of (mapping.properties || [])) {
            const sourceValue = this._getPropertyValue(component, propMapping.source);
            
            if (sourceValue !== undefined && sourceValue !== null) {
                const convertedValue = propertyConverter.convert(
                    sourceValue, 
                    propMapping.converter,
                    { propertyName: propMapping.target }
                );
                
                if (convertedValue !== null) {
                    // Check for complex property (needs element syntax)
                    if (this._isComplexValue(convertedValue)) {
                        // Will be handled in content generation
                        continue;
                    }
                    
                    attributes.push(`${propMapping.target}="${this._escapeXml(convertedValue)}"`);
                }
            }
        }
        
        // Add common layout properties
        if (component.width !== undefined) {
            attributes.push(`Width="${component.width}"`);
        }
        if (component.height !== undefined) {
            attributes.push(`Height="${component.height}"`);
        }
        if (component.minWidth !== undefined) {
            attributes.push(`MinWidth="${component.minWidth}"`);
        }
        if (component.minHeight !== undefined) {
            attributes.push(`MinHeight="${component.minHeight}"`);
        }
        if (component.maxWidth !== undefined) {
            attributes.push(`MaxWidth="${component.maxWidth}"`);
        }
        if (component.maxHeight !== undefined) {
            attributes.push(`MaxHeight="${component.maxHeight}"`);
        }
        if (component.margin !== undefined) {
            const margin = propertyConverter.convert(component.margin, 'Thickness');
            attributes.push(`Margin="${margin}"`);
        }
        if (component.padding !== undefined) {
            const padding = propertyConverter.convert(component.padding, 'Thickness');
            attributes.push(`Padding="${padding}"`);
        }
        if (component.horizontalAlignment) {
            const align = propertyConverter.convert(component.horizontalAlignment, 'HorizontalAlignment');
            attributes.push(`HorizontalAlignment="${align}"`);
        }
        if (component.verticalAlignment) {
            const align = propertyConverter.convert(component.verticalAlignment, 'VerticalAlignment');
            attributes.push(`VerticalAlignment="${align}"`);
        }
        if (component.isEnabled !== undefined) {
            attributes.push(`IsEnabled="${component.isEnabled ? 'True' : 'False'}"`);
        }
        if (component.isVisible !== undefined) {
            attributes.push(`IsVisible="${component.isVisible ? 'True' : 'False'}"`);
        }
        if (component.opacity !== undefined) {
            attributes.push(`Opacity="${component.opacity}"`);
        }
        
        return attributes;
    }
    
    /**
     * Build attached properties
     * @private
     */
    _buildAttachedProperties(component) {
        const attached = [];
        
        // Grid attached properties
        if (component.gridRow !== undefined) {
            attached.push(`Grid.Row="${component.gridRow}"`);
        }
        if (component.gridColumn !== undefined) {
            attached.push(`Grid.Column="${component.gridColumn}"`);
        }
        if (component.gridRowSpan !== undefined && component.gridRowSpan > 1) {
            attached.push(`Grid.RowSpan="${component.gridRowSpan}"`);
        }
        if (component.gridColumnSpan !== undefined && component.gridColumnSpan > 1) {
            attached.push(`Grid.ColumnSpan="${component.gridColumnSpan}"`);
        }
        
        // DockPanel attached property
        if (component.dock !== undefined) {
            const dock = propertyConverter.convert(component.dock, 'Dock');
            attached.push(`DockPanel.Dock="${dock}"`);
        }
        
        // Canvas attached properties
        if (component.canvasLeft !== undefined) {
            attached.push(`Canvas.Left="${component.canvasLeft}"`);
        }
        if (component.canvasTop !== undefined) {
            attached.push(`Canvas.Top="${component.canvasTop}"`);
        }
        if (component.canvasRight !== undefined) {
            attached.push(`Canvas.Right="${component.canvasRight}"`);
        }
        if (component.canvasBottom !== undefined) {
            attached.push(`Canvas.Bottom="${component.canvasBottom}"`);
        }
        
        // ZIndex
        if (component.zIndex !== undefined) {
            attached.push(`Panel.ZIndex="${component.zIndex}"`);
        }
        
        return attached;
    }
    
    /**
     * Get property value from component with path support
     * @private
     */
    _getPropertyValue(component, path) {
        if (!path) return undefined;
        
        const parts = path.split('.');
        let value = component;
        
        for (const part of parts) {
            if (value === undefined || value === null) {
                return undefined;
            }
            value = value[part];
        }
        
        return value;
    }
    
    /**
     * Check if value is complex (needs element syntax)
     * @private
     */
    _isComplexValue(value) {
        return typeof value === 'object' && value !== null;
    }
    
    // ==========================================
    // PRIVATE: CONTENT GENERATION
    // ==========================================
    
    /**
     * Generate content from components
     * @private
     */
    _generateContent(components) {
        if (!components || components.length === 0) {
            return '';
        }
        
        // Check if any component has Canvas position
        const hasPositionedComponents = components.some(comp => 
            comp.canvasLeft !== undefined || comp.canvasTop !== undefined
        );
        
        // Wrap in Canvas if components have positions
        if (hasPositionedComponents) {
            const indent = this._indent(1);
            const lines = [];
            lines.push(`${indent}<Canvas>`);
            for (const comp of components) {
                lines.push(this.generateComponent(comp, 2));
            }
            lines.push(`${indent}</Canvas>`);
            return lines.join('\n');
        }
        
        return components
            .map(comp => this.generateComponent(comp, 1))
            .join('\n');
    }
    
    /**
     * Generate resources section
     * @private
     */
    _generateResourcesSection(resources, rootElement, indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        lines.push(`${indent}<${rootElement}.Resources>`);
        
        // Add resource dictionary if needed
        if (resources && Object.keys(resources).length > 0) {
            for (const [key, resource] of Object.entries(resources)) {
                lines.push(this._generateResource(key, resource, indentLevel + 1));
            }
        }
        
        lines.push(`${indent}</${rootElement}.Resources>`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate individual resource
     * @private
     */
    _generateResource(key, resource, indentLevel) {
        const indent = this._indent(indentLevel);
        
        if (typeof resource === 'string') {
            // Simple string resource
            if (resource.startsWith('#')) {
                return `${indent}<SolidColorBrush x:Key="${key}" Color="${resource}" />`;
            }
            return `${indent}<x:String x:Key="${key}">${this._escapeXml(resource)}</x:String>`;
        }
        
        if (resource.type === 'brush' || resource.color) {
            return `${indent}<SolidColorBrush x:Key="${key}" Color="${resource.color}" />`;
        }
        
        if (resource.type === 'style') {
            return this._generateStyleResource(key, resource, indentLevel);
        }
        
        return `${indent}<!-- Resource: ${key} -->`;
    }
    
    /**
     * Generate style resource
     * @private
     */
    _generateStyleResource(key, style, indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        const selector = style.selector || style.targetType;
        
        lines.push(`${indent}<Style Selector="${selector}">`);
        
        for (const [prop, value] of Object.entries(style.setters || {})) {
            const convertedValue = this._escapeXml(String(value));
            lines.push(`${indent}${this._indent(1)}<Setter Property="${prop}" Value="${convertedValue}" />`);
        }
        
        lines.push(`${indent}</Style>`);
        
        return lines.join('\n');
    }
    
    // ==========================================
    // PRIVATE: UTILITIES
    // ==========================================
    
    /**
     * Generate indentation
     * @private
     */
    _indent(level) {
        const char = this._options.useTabs ? '\t' : ' ';
        const size = this._options.useTabs ? 1 : this._options.indentSize;
        return char.repeat(size * level);
    }
    
    /**
     * Escape XML special characters
     * @private
     */
    _escapeXml(text) {
        if (typeof text !== 'string') {
            return String(text);
        }
        
        // Don't escape binding expressions
        if (text.startsWith('{') && text.endsWith('}')) {
            return text;
        }
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Create XAML generator with default options
 */
export function createXamlGenerator(options = {}) {
    return new XamlGenerator(options);
}

/**
 * Quick generate XAML from scene
 */
export function generateXaml(scene, options = {}) {
    const generator = new XamlGenerator(options);
    return generator.generateDocument(scene, options.rootElement || 'UserControl');
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default XamlGenerator;
