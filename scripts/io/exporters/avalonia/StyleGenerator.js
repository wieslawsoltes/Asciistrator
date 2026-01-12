/**
 * Asciistrator - Avalonia Style Generator
 * 
 * Generates Avalonia styles and themes for ASCII-themed components.
 * Creates reusable style resources and theme dictionaries.
 * 
 * @version 1.0.0
 */

// ==========================================
// ASCII THEME COLORS
// ==========================================

/**
 * ASCII-themed color palette
 */
export const ASCII_COLORS = {
    // Base colors
    background: '#1E1E1E',
    backgroundAlt: '#252526',
    foreground: '#D4D4D4',
    foregroundDim: '#808080',
    
    // ASCII art colors
    asciiGreen: '#00FF00',
    asciiAmber: '#FFB000',
    asciiCyan: '#00FFFF',
    asciiWhite: '#FFFFFF',
    asciiGray: '#888888',
    
    // Accent colors
    primary: '#007ACC',
    secondary: '#68217A',
    accent: '#00CC6A',
    warning: '#CE9178',
    error: '#F14C4C',
    
    // Border colors
    border: '#3E3E42',
    borderHover: '#007ACC',
    borderFocus: '#007ACC',
    
    // State colors
    hover: '#2A2D2E',
    pressed: '#094771',
    selected: '#0E639C',
    disabled: '#5A5A5A'
};

/**
 * ASCII-themed font settings
 */
export const ASCII_FONTS = {
    family: 'Consolas, "Courier New", monospace',
    sizeSmall: '11',
    sizeNormal: '13',
    sizeLarge: '16',
    sizeHeader: '20',
    lineHeight: '1.4'
};

// ==========================================
// STYLE GENERATOR CLASS
// ==========================================

/**
 * Generates Avalonia styles for ASCII theme
 */
export class StyleGenerator {
    constructor(options = {}) {
        this._options = {
            colors: { ...ASCII_COLORS, ...options.colors },
            fonts: { ...ASCII_FONTS, ...options.fonts },
            indentSize: 4,
            useTabs: false,
            generateComments: true,
            ...options
        };
    }
    
    // ==========================================
    // PUBLIC API
    // ==========================================
    
    /**
     * Generate complete theme resource dictionary
     * @returns {string} AXAML theme file content
     */
    generateTheme() {
        const lines = [];
        
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        lines.push('<ResourceDictionary');
        lines.push('    xmlns="https://github.com/avaloniaui"');
        lines.push('    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">');
        lines.push('');
        
        // Colors
        lines.push(this._generateColorResources(1));
        lines.push('');
        
        // Brushes
        lines.push(this._generateBrushResources(1));
        lines.push('');
        
        // Control styles
        lines.push(this._generateControlStyles(1));
        
        lines.push('</ResourceDictionary>');
        
        return lines.join('\n');
    }
    
    /**
     * Generate styles for a specific control type
     * @param {string} controlType - Avalonia control type
     * @returns {string}
     */
    generateControlStyle(controlType) {
        const generator = this._styleGenerators[controlType];
        if (generator) {
            return generator.call(this, 0);
        }
        return this._generateDefaultStyle(controlType, 0);
    }
    
    /**
     * Generate inline styles for a component
     * @param {object} component - Component definition
     * @returns {object} Style properties
     */
    generateInlineStyles(component) {
        const styles = {};
        
        // Background
        if (component.background) {
            styles.Background = this._convertColor(component.background);
        }
        
        // Foreground
        if (component.foreground || component.color) {
            styles.Foreground = this._convertColor(component.foreground || component.color);
        }
        
        // Border
        if (component.borderColor) {
            styles.BorderBrush = this._convertColor(component.borderColor);
        }
        if (component.borderWidth !== undefined) {
            styles.BorderThickness = String(component.borderWidth);
        }
        
        // Font
        if (component.fontFamily) {
            styles.FontFamily = component.fontFamily;
        }
        if (component.fontSize) {
            styles.FontSize = String(component.fontSize);
        }
        if (component.fontWeight) {
            styles.FontWeight = component.fontWeight;
        }
        if (component.fontStyle) {
            styles.FontStyle = component.fontStyle;
        }
        
        // Padding/Margin
        if (component.padding) {
            styles.Padding = this._convertThickness(component.padding);
        }
        
        // Corner radius
        if (component.cornerRadius !== undefined) {
            styles.CornerRadius = String(component.cornerRadius);
        }
        
        return styles;
    }
    
    /**
     * Generate styles for ASCII art rendering
     * @returns {string}
     */
    generateAsciiStyles() {
        const lines = [];
        const indent = this._indent(1);
        
        this._addComment(lines, 'ASCII Art Display Styles', 1);
        
        // ASCII art container
        lines.push(`${indent}<Style Selector="Border.AsciiArtContainer">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource AsciiBackground}" />`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource AsciiBorder}" />`);
        lines.push(`${indent}    <Setter Property="BorderThickness" Value="1" />`);
        lines.push(`${indent}    <Setter Property="CornerRadius" Value="2" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="8" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // ASCII text block
        lines.push(`${indent}<Style Selector="TextBlock.AsciiArt">`);
        lines.push(`${indent}    <Setter Property="FontFamily" Value="${this._options.fonts.family}" />`);
        lines.push(`${indent}    <Setter Property="FontSize" Value="${this._options.fonts.sizeNormal}" />`);
        lines.push(`${indent}    <Setter Property="Foreground" Value="{DynamicResource AsciiGreen}" />`);
        lines.push(`${indent}    <Setter Property="TextWrapping" Value="NoWrap" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // ASCII canvas
        lines.push(`${indent}<Style Selector="Canvas.AsciiCanvas">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource AsciiBackground}" />`);
        lines.push(`${indent}    <Setter Property="ClipToBounds" Value="True" />`);
        lines.push(`${indent}</Style>`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate App.axaml styles section
     * @returns {string}
     */
    generateAppStyles() {
        const lines = [];
        
        lines.push('<Application.Styles>');
        lines.push('    <FluentTheme />');
        lines.push('    <StyleInclude Source="avares://AsciistratorApp/Themes/AsciiTheme.axaml" />');
        lines.push('</Application.Styles>');
        
        return lines.join('\n');
    }
    
    // ==========================================
    // PRIVATE: RESOURCE GENERATION
    // ==========================================
    
    /**
     * Generate color resources
     * @private
     */
    _generateColorResources(indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        this._addComment(lines, 'Color Resources', indentLevel);
        
        for (const [name, color] of Object.entries(this._options.colors)) {
            const resourceName = this._toResourceName(name);
            lines.push(`${indent}<Color x:Key="${resourceName}Color">${color}</Color>`);
        }
        
        return lines.join('\n');
    }
    
    /**
     * Generate brush resources
     * @private
     */
    _generateBrushResources(indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        this._addComment(lines, 'Brush Resources', indentLevel);
        
        for (const [name, color] of Object.entries(this._options.colors)) {
            const resourceName = this._toResourceName(name);
            lines.push(`${indent}<SolidColorBrush x:Key="${resourceName}" Color="${color}" />`);
        }
        
        return lines.join('\n');
    }
    
    /**
     * Generate all control styles
     * @private
     */
    _generateControlStyles(indentLevel) {
        const lines = [];
        
        // Button styles
        lines.push(this._generateButtonStyles(indentLevel));
        lines.push('');
        
        // TextBox styles
        lines.push(this._generateTextBoxStyles(indentLevel));
        lines.push('');
        
        // ComboBox styles
        lines.push(this._generateComboBoxStyles(indentLevel));
        lines.push('');
        
        // ListBox styles
        lines.push(this._generateListBoxStyles(indentLevel));
        lines.push('');
        
        // Panel styles
        lines.push(this._generatePanelStyles(indentLevel));
        lines.push('');
        
        // Tab styles
        lines.push(this._generateTabStyles(indentLevel));
        lines.push('');
        
        // ASCII-specific styles
        lines.push(this.generateAsciiStyles());
        
        return lines.join('\n');
    }
    
    // ==========================================
    // PRIVATE: CONTROL-SPECIFIC STYLES
    // ==========================================
    
    /**
     * Generate button styles
     * @private
     */
    _generateButtonStyles(indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        this._addComment(lines, 'Button Styles', indentLevel);
        
        // Base ASCII button
        lines.push(`${indent}<Style Selector="Button.AsciiButton">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource BackgroundAlt}" />`);
        lines.push(`${indent}    <Setter Property="Foreground" Value="{DynamicResource Foreground}" />`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource Border}" />`);
        lines.push(`${indent}    <Setter Property="BorderThickness" Value="1" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="12,6" />`);
        lines.push(`${indent}    <Setter Property="FontFamily" Value="${this._options.fonts.family}" />`);
        lines.push(`${indent}    <Setter Property="CornerRadius" Value="2" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // Hover state
        lines.push(`${indent}<Style Selector="Button.AsciiButton:pointerover">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Hover}" />`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource BorderHover}" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // Pressed state
        lines.push(`${indent}<Style Selector="Button.AsciiButton:pressed">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Pressed}" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // Primary button
        lines.push(`${indent}<Style Selector="Button.AsciiPrimaryButton">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Primary}" />`);
        lines.push(`${indent}    <Setter Property="Foreground" Value="{DynamicResource AsciiWhite}" />`);
        lines.push(`${indent}    <Setter Property="BorderThickness" Value="0" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="16,8" />`);
        lines.push(`${indent}    <Setter Property="FontFamily" Value="${this._options.fonts.family}" />`);
        lines.push(`${indent}    <Setter Property="FontWeight" Value="SemiBold" />`);
        lines.push(`${indent}    <Setter Property="CornerRadius" Value="2" />`);
        lines.push(`${indent}</Style>`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate TextBox styles
     * @private
     */
    _generateTextBoxStyles(indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        this._addComment(lines, 'TextBox Styles', indentLevel);
        
        // ASCII TextBox
        lines.push(`${indent}<Style Selector="TextBox.AsciiTextBox">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Background}" />`);
        lines.push(`${indent}    <Setter Property="Foreground" Value="{DynamicResource Foreground}" />`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource Border}" />`);
        lines.push(`${indent}    <Setter Property="BorderThickness" Value="1" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="8,4" />`);
        lines.push(`${indent}    <Setter Property="FontFamily" Value="${this._options.fonts.family}" />`);
        lines.push(`${indent}    <Setter Property="FontSize" Value="${this._options.fonts.sizeNormal}" />`);
        lines.push(`${indent}    <Setter Property="CornerRadius" Value="2" />`);
        lines.push(`${indent}    <Setter Property="CaretBrush" Value="{DynamicResource AsciiGreen}" />`);
        lines.push(`${indent}    <Setter Property="SelectionBrush" Value="{DynamicResource Selected}" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // Focus state
        lines.push(`${indent}<Style Selector="TextBox.AsciiTextBox:focus">`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource BorderFocus}" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // Code/ASCII input
        lines.push(`${indent}<Style Selector="TextBox.AsciiCodeInput">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Background}" />`);
        lines.push(`${indent}    <Setter Property="Foreground" Value="{DynamicResource AsciiGreen}" />`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource Border}" />`);
        lines.push(`${indent}    <Setter Property="BorderThickness" Value="1" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="12,8" />`);
        lines.push(`${indent}    <Setter Property="FontFamily" Value="${this._options.fonts.family}" />`);
        lines.push(`${indent}    <Setter Property="FontSize" Value="${this._options.fonts.sizeNormal}" />`);
        lines.push(`${indent}    <Setter Property="AcceptsReturn" Value="True" />`);
        lines.push(`${indent}    <Setter Property="TextWrapping" Value="NoWrap" />`);
        lines.push(`${indent}</Style>`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate ComboBox styles
     * @private
     */
    _generateComboBoxStyles(indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        this._addComment(lines, 'ComboBox Styles', indentLevel);
        
        lines.push(`${indent}<Style Selector="ComboBox.AsciiComboBox">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource BackgroundAlt}" />`);
        lines.push(`${indent}    <Setter Property="Foreground" Value="{DynamicResource Foreground}" />`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource Border}" />`);
        lines.push(`${indent}    <Setter Property="BorderThickness" Value="1" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="8,4" />`);
        lines.push(`${indent}    <Setter Property="FontFamily" Value="${this._options.fonts.family}" />`);
        lines.push(`${indent}    <Setter Property="CornerRadius" Value="2" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        lines.push(`${indent}<Style Selector="ComboBox.AsciiComboBox:pointerover">`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource BorderHover}" />`);
        lines.push(`${indent}</Style>`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate ListBox styles
     * @private
     */
    _generateListBoxStyles(indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        this._addComment(lines, 'ListBox Styles', indentLevel);
        
        // ListBox
        lines.push(`${indent}<Style Selector="ListBox.AsciiListBox">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Background}" />`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource Border}" />`);
        lines.push(`${indent}    <Setter Property="BorderThickness" Value="1" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="2" />`);
        lines.push(`${indent}    <Setter Property="CornerRadius" Value="2" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // ListBoxItem
        lines.push(`${indent}<Style Selector="ListBoxItem.AsciiListBoxItem">`);
        lines.push(`${indent}    <Setter Property="Padding" Value="8,4" />`);
        lines.push(`${indent}    <Setter Property="FontFamily" Value="${this._options.fonts.family}" />`);
        lines.push(`${indent}    <Setter Property="Foreground" Value="{DynamicResource Foreground}" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        lines.push(`${indent}<Style Selector="ListBoxItem.AsciiListBoxItem:pointerover">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Hover}" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        lines.push(`${indent}<Style Selector="ListBoxItem.AsciiListBoxItem:selected">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Selected}" />`);
        lines.push(`${indent}</Style>`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate panel styles
     * @private
     */
    _generatePanelStyles(indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        this._addComment(lines, 'Panel Styles', indentLevel);
        
        // Basic panel
        lines.push(`${indent}<Style Selector="Border.AsciiPanel">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource BackgroundAlt}" />`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource Border}" />`);
        lines.push(`${indent}    <Setter Property="BorderThickness" Value="1" />`);
        lines.push(`${indent}    <Setter Property="CornerRadius" Value="4" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="12" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // Header panel
        lines.push(`${indent}<Style Selector="Border.AsciiHeaderPanel">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Primary}" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="16,8" />`);
        lines.push(`${indent}    <Setter Property="CornerRadius" Value="4,4,0,0" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // Card style
        lines.push(`${indent}<Style Selector="Border.AsciiCard">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource BackgroundAlt}" />`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource Border}" />`);
        lines.push(`${indent}    <Setter Property="BorderThickness" Value="1" />`);
        lines.push(`${indent}    <Setter Property="CornerRadius" Value="4" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="16" />`);
        lines.push(`${indent}    <Setter Property="BoxShadow" Value="0 2 8 0 #40000000" />`);
        lines.push(`${indent}</Style>`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate tab control styles
     * @private
     */
    _generateTabStyles(indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        this._addComment(lines, 'TabControl Styles', indentLevel);
        
        // TabControl
        lines.push(`${indent}<Style Selector="TabControl.AsciiTabControl">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Background}" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="0" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        // TabItem
        lines.push(`${indent}<Style Selector="TabItem.AsciiTabItem">`);
        lines.push(`${indent}    <Setter Property="Background" Value="Transparent" />`);
        lines.push(`${indent}    <Setter Property="Foreground" Value="{DynamicResource ForegroundDim}" />`);
        lines.push(`${indent}    <Setter Property="Padding" Value="16,8" />`);
        lines.push(`${indent}    <Setter Property="FontFamily" Value="${this._options.fonts.family}" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        lines.push(`${indent}<Style Selector="TabItem.AsciiTabItem:pointerover">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource Hover}" />`);
        lines.push(`${indent}    <Setter Property="Foreground" Value="{DynamicResource Foreground}" />`);
        lines.push(`${indent}</Style>`);
        lines.push('');
        
        lines.push(`${indent}<Style Selector="TabItem.AsciiTabItem:selected">`);
        lines.push(`${indent}    <Setter Property="Background" Value="{DynamicResource BackgroundAlt}" />`);
        lines.push(`${indent}    <Setter Property="Foreground" Value="{DynamicResource Foreground}" />`);
        lines.push(`${indent}    <Setter Property="BorderBrush" Value="{DynamicResource Primary}" />`);
        lines.push(`${indent}    <Setter Property="BorderThickness" Value="0,0,0,2" />`);
        lines.push(`${indent}</Style>`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate default style for unknown control
     * @private
     */
    _generateDefaultStyle(controlType, indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        lines.push(`${indent}<Style Selector="${controlType}.Ascii${controlType}">`);
        lines.push(`${indent}    <Setter Property="FontFamily" Value="${this._options.fonts.family}" />`);
        lines.push(`${indent}</Style>`);
        
        return lines.join('\n');
    }
    
    // ==========================================
    // PRIVATE: UTILITIES
    // ==========================================
    
    /**
     * Convert color value
     * @private
     */
    _convertColor(color) {
        if (typeof color === 'string') {
            // Check if it's a named color in our palette
            if (this._options.colors[color]) {
                return this._options.colors[color];
            }
            return color;
        }
        return String(color);
    }
    
    /**
     * Convert thickness value
     * @private
     */
    _convertThickness(value) {
        if (typeof value === 'number') {
            return String(value);
        }
        if (typeof value === 'object') {
            const { left = 0, top = 0, right = 0, bottom = 0 } = value;
            return `${left},${top},${right},${bottom}`;
        }
        return String(value);
    }
    
    /**
     * Convert to resource name
     * @private
     */
    _toResourceName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
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
     * Add comment to lines array
     * @private
     */
    _addComment(lines, text, indentLevel) {
        if (this._options.generateComments) {
            const indent = this._indent(indentLevel);
            lines.push(`${indent}<!-- ${text} -->`);
        }
    }
    
    // Style generator registry
    _styleGenerators = {
        'Button': this._generateButtonStyles,
        'TextBox': this._generateTextBoxStyles,
        'ComboBox': this._generateComboBoxStyles,
        'ListBox': this._generateListBoxStyles,
        'TabControl': this._generateTabStyles,
        'Border': this._generatePanelStyles
    };
}

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Create style generator with custom options
 */
export function createStyleGenerator(options = {}) {
    return new StyleGenerator(options);
}

/**
 * Generate complete ASCII theme
 */
export function generateAsciiTheme(options = {}) {
    const generator = new StyleGenerator(options);
    return generator.generateTheme();
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default StyleGenerator;
