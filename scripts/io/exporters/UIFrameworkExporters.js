/**
 * Asciistrator - UI Framework Exporters
 * 
 * Exporters for generating XAML code for various UI frameworks:
 * - Avalonia UI
 * - WPF
 * - MAUI
 * - UWP
 * 
 * @version 1.0.0
 */

import BaseExporter from './BaseExporter.js';
import { ExportCategory, StyleExportMode } from '../ExporterRegistry.js';

// ==========================================
// BASE XAML EXPORTER
// ==========================================

/**
 * Base class for XAML-based UI framework exporters
 */
export class BaseXAMLExporter extends BaseExporter {
    constructor(config = {}) {
        super(config);
    }
    
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
            styleExportMode: StyleExportMode.Inline,
            indentSize: 4,
            indentChar: ' ',
            useResourceDictionary: false,
            generateCodeBehind: false,
            namespace: 'Generated',
            className: 'AsciiArtView',
            fontFamily: 'Consolas',
            fontSize: 12,
            cellWidth: 8,
            cellHeight: 16,
            backgroundColor: '#1a1a2e',
            defaultColor: '#e0e0e0',
            wrapInUserControl: true,
            generateComments: true
        };
    }
    
    // ==========================================
    // XAML NAMESPACE DECLARATIONS
    // ==========================================
    
    /**
     * Get namespace declarations - override in subclasses
     * @protected
     */
    _getNamespaceDeclarations() {
        return {
            '': 'http://schemas.microsoft.com/winfx/2006/xaml/presentation',
            'x': 'http://schemas.microsoft.com/winfx/2006/xaml'
        };
    }
    
    /**
     * Get root element name - override in subclasses
     * @protected
     */
    _getRootElementName() {
        return 'UserControl';
    }
    
    /**
     * Get canvas element name - override in subclasses
     * @protected
     */
    _getCanvasElementName() {
        return 'Canvas';
    }
    
    /**
     * Get text element name - override in subclasses
     * @protected
     */
    _getTextElementName() {
        return 'TextBlock';
    }
    
    // ==========================================
    // HELPER METHODS
    // ==========================================
    
    /**
     * Build namespace string from declarations
     * @protected
     */
    _buildNamespaceString() {
        const ns = this._getNamespaceDeclarations();
        return Object.entries(ns)
            .map(([prefix, uri]) => prefix ? `xmlns:${prefix}="${uri}"` : `xmlns="${uri}"`)
            .join('\n    ');
    }
    
    /**
     * Convert hex color to XAML format
     * @protected
     */
    _toXamlColor(hexColor) {
        if (!hexColor) return null;
        // XAML uses #AARRGGBB format, but also supports #RRGGBB
        return hexColor.startsWith('#') ? hexColor : `#${hexColor}`;
    }
    
    /**
     * Generate inline style attributes
     * @protected
     */
    _generateInlineStyle(options) {
        const attrs = [];
        attrs.push(`FontFamily="${options.fontFamily}"`);
        attrs.push(`FontSize="${options.fontSize}"`);
        return attrs.join(' ');
    }
    
    /**
     * Generate resource key
     * @protected
     */
    _generateResourceKey(color) {
        // Convert color to valid resource key
        return `Color_${color.replace('#', '').toUpperCase()}`;
    }
}

// ==========================================
// AVALONIA EXPORTER
// ==========================================

/**
 * Avalonia UI XAML exporter
 */
export class AvaloniaExporter extends BaseXAMLExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'avalonia'; }
    get name() { return 'Avalonia UI XAML'; }
    get description() { return 'Export as Avalonia UI XAML (.axaml)'; }
    get fileExtension() { return '.axaml'; }
    get mimeType() { return 'application/xaml+xml'; }
    get category() { return ExportCategory.UIFramework; }
    
    // ==========================================
    // AVALONIA-SPECIFIC
    // ==========================================
    
    _getNamespaceDeclarations() {
        return {
            '': 'https://github.com/avaloniaui',
            'x': 'http://schemas.microsoft.com/winfx/2006/xaml'
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._generateEmptyControl(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const indent = this._indent(1, options);
        const indent2 = this._indent(2, options);
        const indent3 = this._indent(3, options);
        const indent4 = this._indent(4, options);
        
        const lines = [];
        
        // XML declaration
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        
        // Generate header comment if enabled
        if (options.generateComments) {
            lines.push('<!-- Generated by Asciistrator - Avalonia UI XAML -->');
            lines.push(`<!-- Dimensions: ${width}x${height} characters -->`);
            lines.push('');
        }
        
        // Root element
        if (options.wrapInUserControl) {
            lines.push(`<UserControl ${this._buildNamespaceString()}`);
            lines.push(`    x:Class="${options.namespace}.${options.className}">`);
        }
        
        // Background panel
        lines.push(`${indent}<Border Background="${this._toXamlColor(options.backgroundColor)}">`);
        lines.push(`${indent2}<Canvas Width="${width * options.cellWidth}" Height="${height * options.cellHeight}">`);
        
        // Render characters
        const colorGroups = this._groupByColor(buffer, width, height);
        
        for (const [color, chars] of colorGroups) {
            if (options.generateComments && chars.length > 10) {
                lines.push(`${indent3}<!-- Color: ${color} (${chars.length} characters) -->`);
            }
            
            for (const { x, y, char } of chars) {
                const left = x * options.cellWidth;
                const top = y * options.cellHeight;
                const xamlColor = this._toXamlColor(color) || this._toXamlColor(options.defaultColor);
                
                lines.push(`${indent3}<TextBlock Canvas.Left="${left}" Canvas.Top="${top}" Text="${this._escapeXml(char)}" Foreground="${xamlColor}" ${this._generateInlineStyle(options)}/>`);
            }
        }
        
        lines.push(`${indent2}</Canvas>`);
        lines.push(`${indent}</Border>`);
        
        if (options.wrapInUserControl) {
            lines.push('</UserControl>');
        }
        
        return lines.join('\n');
    }
    
    /**
     * Group characters by color for optimized output
     * @private
     */
    _groupByColor(buffer, width, height) {
        const groups = new Map();
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = this._getChar(buffer, x, y);
                if (char === ' ') continue;
                
                const color = this._getColor(buffer, x, y) || 'default';
                
                if (!groups.has(color)) {
                    groups.set(color, []);
                }
                groups.get(color).push({ x, y, char });
            }
        }
        
        return groups;
    }
    
    /**
     * Generate empty control
     * @private
     */
    _generateEmptyControl(options) {
        const lines = [];
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        lines.push(`<UserControl ${this._buildNamespaceString()}`);
        lines.push(`    x:Class="${options.namespace}.${options.className}">`);
        lines.push(`    <Border Background="${this._toXamlColor(options.backgroundColor)}">`);
        lines.push(`        <TextBlock Text="Empty" Foreground="${this._toXamlColor(options.defaultColor)}" ${this._generateInlineStyle(options)}/>`);
        lines.push('    </Border>');
        lines.push('</UserControl>');
        return lines.join('\n');
    }
}

// ==========================================
// WPF EXPORTER
// ==========================================

/**
 * WPF XAML exporter
 */
export class WPFExporter extends BaseXAMLExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'wpf'; }
    get name() { return 'WPF XAML'; }
    get description() { return 'Export as WPF XAML (.xaml)'; }
    get fileExtension() { return '.xaml'; }
    get mimeType() { return 'application/xaml+xml'; }
    get category() { return ExportCategory.UIFramework; }
    
    // ==========================================
    // WPF-SPECIFIC
    // ==========================================
    
    _getNamespaceDeclarations() {
        return {
            '': 'http://schemas.microsoft.com/winfx/2006/xaml/presentation',
            'x': 'http://schemas.microsoft.com/winfx/2006/xaml',
            'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
            'd': 'http://schemas.microsoft.com/expression/blend/2008'
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._generateEmptyControl(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const indent = this._indent(1, options);
        const indent2 = this._indent(2, options);
        const indent3 = this._indent(3, options);
        
        const lines = [];
        
        // XML declaration
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        
        // Generate header comment if enabled
        if (options.generateComments) {
            lines.push('<!-- Generated by Asciistrator - WPF XAML -->');
            lines.push(`<!-- Dimensions: ${width}x${height} characters -->`);
            lines.push('');
        }
        
        // Root element
        if (options.wrapInUserControl) {
            lines.push(`<UserControl ${this._buildNamespaceString()}`);
            lines.push('    mc:Ignorable="d"');
            lines.push(`    d:DesignWidth="${width * options.cellWidth + 40}"`);
            lines.push(`    d:DesignHeight="${height * options.cellHeight + 40}"`);
            lines.push(`    x:Class="${options.namespace}.${options.className}">`);
        }
        
        // Background grid
        lines.push(`${indent}<Grid Background="${this._toXamlColor(options.backgroundColor)}">`);
        lines.push(`${indent2}<Canvas Width="${width * options.cellWidth}" Height="${height * options.cellHeight}">`);
        
        // Render characters
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = this._getChar(buffer, x, y);
                if (char === ' ') continue;
                
                const color = this._getColor(buffer, x, y);
                const left = x * options.cellWidth;
                const top = y * options.cellHeight;
                const xamlColor = this._toXamlColor(color) || this._toXamlColor(options.defaultColor);
                
                lines.push(`${indent3}<TextBlock Canvas.Left="${left}" Canvas.Top="${top}" Text="${this._escapeXml(char)}" Foreground="${xamlColor}" ${this._generateInlineStyle(options)}/>`);
            }
        }
        
        lines.push(`${indent2}</Canvas>`);
        lines.push(`${indent}</Grid>`);
        
        if (options.wrapInUserControl) {
            lines.push('</UserControl>');
        }
        
        return lines.join('\n');
    }
    
    /**
     * Generate empty control
     * @private
     */
    _generateEmptyControl(options) {
        const lines = [];
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        lines.push(`<UserControl ${this._buildNamespaceString()}`);
        lines.push('    mc:Ignorable="d"');
        lines.push(`    x:Class="${options.namespace}.${options.className}">`);
        lines.push(`    <Grid Background="${this._toXamlColor(options.backgroundColor)}">`);
        lines.push(`        <TextBlock Text="Empty" Foreground="${this._toXamlColor(options.defaultColor)}" ${this._generateInlineStyle(options)}/>`);
        lines.push('    </Grid>');
        lines.push('</UserControl>');
        return lines.join('\n');
    }
}

// ==========================================
// MAUI EXPORTER
// ==========================================

/**
 * .NET MAUI XAML exporter
 */
export class MAUIExporter extends BaseXAMLExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'maui'; }
    get name() { return '.NET MAUI XAML'; }
    get description() { return 'Export as .NET MAUI XAML (.xaml)'; }
    get fileExtension() { return '.xaml'; }
    get mimeType() { return 'application/xaml+xml'; }
    get category() { return ExportCategory.UIFramework; }
    
    // ==========================================
    // MAUI-SPECIFIC
    // ==========================================
    
    _getNamespaceDeclarations() {
        return {
            '': 'http://schemas.microsoft.com/dotnet/2021/maui',
            'x': 'http://schemas.microsoft.com/winfx/2009/xaml'
        };
    }
    
    _getRootElementName() {
        return 'ContentView';
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._generateEmptyControl(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const indent = this._indent(1, options);
        const indent2 = this._indent(2, options);
        const indent3 = this._indent(3, options);
        
        const lines = [];
        
        // XML declaration
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        
        // Generate header comment
        if (options.generateComments) {
            lines.push('<!-- Generated by Asciistrator - .NET MAUI XAML -->');
            lines.push(`<!-- Dimensions: ${width}x${height} characters -->`);
            lines.push('');
        }
        
        // Root element
        if (options.wrapInUserControl) {
            lines.push(`<ContentView ${this._buildNamespaceString()}`);
            lines.push(`    x:Class="${options.namespace}.${options.className}">`);
        }
        
        // Background grid with AbsoluteLayout for MAUI
        lines.push(`${indent}<Grid BackgroundColor="${this._toXamlColor(options.backgroundColor)}">`);
        lines.push(`${indent2}<AbsoluteLayout>`);
        
        // Render characters
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = this._getChar(buffer, x, y);
                if (char === ' ') continue;
                
                const color = this._getColor(buffer, x, y);
                const left = x * options.cellWidth;
                const top = y * options.cellHeight;
                const xamlColor = this._toXamlColor(color) || this._toXamlColor(options.defaultColor);
                
                lines.push(`${indent3}<Label AbsoluteLayout.LayoutBounds="${left},${top},AutoSize,AutoSize" AbsoluteLayout.LayoutFlags="None" Text="${this._escapeXml(char)}" TextColor="${xamlColor}" FontFamily="${options.fontFamily}" FontSize="${options.fontSize}"/>`);
            }
        }
        
        lines.push(`${indent2}</AbsoluteLayout>`);
        lines.push(`${indent}</Grid>`);
        
        if (options.wrapInUserControl) {
            lines.push('</ContentView>');
        }
        
        return lines.join('\n');
    }
    
    /**
     * Generate empty control
     * @private
     */
    _generateEmptyControl(options) {
        const lines = [];
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        lines.push(`<ContentView ${this._buildNamespaceString()}`);
        lines.push(`    x:Class="${options.namespace}.${options.className}">`);
        lines.push(`    <Grid BackgroundColor="${this._toXamlColor(options.backgroundColor)}">`);
        lines.push(`        <Label Text="Empty" TextColor="${this._toXamlColor(options.defaultColor)}" FontFamily="${options.fontFamily}" FontSize="${options.fontSize}"/>`);
        lines.push('    </Grid>');
        lines.push('</ContentView>');
        return lines.join('\n');
    }
}

// ==========================================
// UWP EXPORTER
// ==========================================

/**
 * UWP XAML exporter
 */
export class UWPExporter extends BaseXAMLExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'uwp'; }
    get name() { return 'UWP XAML'; }
    get description() { return 'Export as Universal Windows Platform XAML (.xaml)'; }
    get fileExtension() { return '.xaml'; }
    get mimeType() { return 'application/xaml+xml'; }
    get category() { return ExportCategory.UIFramework; }
    
    // ==========================================
    // UWP-SPECIFIC
    // ==========================================
    
    _getNamespaceDeclarations() {
        return {
            '': 'http://schemas.microsoft.com/winfx/2006/xaml/presentation',
            'x': 'http://schemas.microsoft.com/winfx/2006/xaml',
            'd': 'http://schemas.microsoft.com/expression/blend/2008',
            'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006'
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._generateEmptyControl(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const indent = this._indent(1, options);
        const indent2 = this._indent(2, options);
        const indent3 = this._indent(3, options);
        
        const lines = [];
        
        // XML declaration
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        
        // Generate header comment
        if (options.generateComments) {
            lines.push('<!-- Generated by Asciistrator - UWP XAML -->');
            lines.push(`<!-- Dimensions: ${width}x${height} characters -->`);
            lines.push('');
        }
        
        // Root element
        if (options.wrapInUserControl) {
            lines.push(`<UserControl ${this._buildNamespaceString()}`);
            lines.push('    mc:Ignorable="d"');
            lines.push(`    x:Class="${options.namespace}.${options.className}">`);
        }
        
        // Background grid
        lines.push(`${indent}<Grid Background="${this._toXamlColor(options.backgroundColor)}">`);
        lines.push(`${indent2}<Canvas Width="${width * options.cellWidth}" Height="${height * options.cellHeight}">`);
        
        // Render characters
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = this._getChar(buffer, x, y);
                if (char === ' ') continue;
                
                const color = this._getColor(buffer, x, y);
                const left = x * options.cellWidth;
                const top = y * options.cellHeight;
                const xamlColor = this._toXamlColor(color) || this._toXamlColor(options.defaultColor);
                
                lines.push(`${indent3}<TextBlock Canvas.Left="${left}" Canvas.Top="${top}" Text="${this._escapeXml(char)}" Foreground="${xamlColor}" ${this._generateInlineStyle(options)}/>`);
            }
        }
        
        lines.push(`${indent2}</Canvas>`);
        lines.push(`${indent}</Grid>`);
        
        if (options.wrapInUserControl) {
            lines.push('</UserControl>');
        }
        
        return lines.join('\n');
    }
    
    /**
     * Generate empty control
     * @private
     */
    _generateEmptyControl(options) {
        const lines = [];
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        lines.push(`<UserControl ${this._buildNamespaceString()}`);
        lines.push('    mc:Ignorable="d"');
        lines.push(`    x:Class="${options.namespace}.${options.className}">`);
        lines.push(`    <Grid Background="${this._toXamlColor(options.backgroundColor)}">`);
        lines.push(`        <TextBlock Text="Empty" Foreground="${this._toXamlColor(options.defaultColor)}" ${this._generateInlineStyle(options)}/>`);
        lines.push('    </Grid>');
        lines.push('</UserControl>');
        return lines.join('\n');
    }
}

// ==========================================
// DEFAULT EXPORTS
// ==========================================

export default {
    BaseXAMLExporter,
    AvaloniaExporter,
    WPFExporter,
    MAUIExporter,
    UWPExporter
};
