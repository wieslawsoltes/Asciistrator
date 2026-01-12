/**
 * Asciistrator - Avalonia Property Converters
 * 
 * Converts Asciistrator component properties to Avalonia XAML property values.
 * Handles type conversion, bindings, and special property formats.
 * 
 * @version 1.0.0
 */

import { PropertyConverterType } from './ComponentMappings.js';

// ==========================================
// PROPERTY CONVERTER CLASS
// ==========================================

/**
 * Property converter for Avalonia XAML export
 */
export class PropertyConverter {
    constructor() {
        this._converters = new Map();
        this._initializeConverters();
    }
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    /**
     * Initialize all property converters
     * @private
     */
    _initializeConverters() {
        // Basic types
        this._converters.set(PropertyConverterType.String, this._convertString.bind(this));
        this._converters.set(PropertyConverterType.Integer, this._convertInteger.bind(this));
        this._converters.set(PropertyConverterType.Double, this._convertDouble.bind(this));
        this._converters.set(PropertyConverterType.Boolean, this._convertBoolean.bind(this));
        this._converters.set(PropertyConverterType.NullableBoolean, this._convertNullableBoolean.bind(this));
        this._converters.set(PropertyConverterType.Dimension, this._convertDimension.bind(this));
        
        // Bindings
        this._converters.set(PropertyConverterType.Binding, this._convertBinding.bind(this));
        this._converters.set(PropertyConverterType.Collection, this._convertCollection.bind(this));
        
        // Layout enums
        this._converters.set(PropertyConverterType.Orientation, this._convertOrientation.bind(this));
        this._converters.set(PropertyConverterType.Dock, this._convertDock.bind(this));
        this._converters.set(PropertyConverterType.ExpandDirection, this._convertExpandDirection.bind(this));
        this._converters.set(PropertyConverterType.SelectionMode, this._convertSelectionMode.bind(this));
        this._converters.set(PropertyConverterType.HorizontalAlignment, this._convertHorizontalAlignment.bind(this));
        this._converters.set(PropertyConverterType.VerticalAlignment, this._convertVerticalAlignment.bind(this));
        this._converters.set(PropertyConverterType.TextAlignment, this._convertTextAlignment.bind(this));
        this._converters.set(PropertyConverterType.TextWrapping, this._convertTextWrapping.bind(this));
        this._converters.set(PropertyConverterType.ScrollBarVisibility, this._convertScrollBarVisibility.bind(this));
        
        // Complex types
        this._converters.set(PropertyConverterType.Thickness, this._convertThickness.bind(this));
        this._converters.set(PropertyConverterType.Brush, this._convertBrush.bind(this));
        this._converters.set(PropertyConverterType.FontWeight, this._convertFontWeight.bind(this));
        this._converters.set(PropertyConverterType.FontStyle, this._convertFontStyle.bind(this));
        this._converters.set(PropertyConverterType.CornerRadius, this._convertCornerRadius.bind(this));
        
        // Grid definitions
        this._converters.set(PropertyConverterType.RowDefinitions, this._convertRowDefinitions.bind(this));
        this._converters.set(PropertyConverterType.ColumnDefinitions, this._convertColumnDefinitions.bind(this));
        this._converters.set(PropertyConverterType.GridLength, this._convertGridLength.bind(this));
    }
    
    // ==========================================
    // CONVERSION API
    // ==========================================
    
    /**
     * Convert a property value
     * @param {any} value - Source value
     * @param {string} converterType - Converter type
     * @param {object} options - Conversion options
     * @returns {string|null} Converted value or null if undefined
     */
    convert(value, converterType, options = {}) {
        if (value === undefined || value === null) {
            return null;
        }
        
        const converter = this._converters.get(converterType);
        if (!converter) {
            console.warn(`Unknown converter type: ${converterType}`);
            return String(value);
        }
        
        try {
            return converter(value, options);
        } catch (e) {
            console.error(`Conversion error for ${converterType}:`, e);
            return null;
        }
    }
    
    /**
     * Check if value needs binding syntax
     * @param {any} value - Value to check
     * @returns {boolean}
     */
    isBindingExpression(value) {
        if (typeof value !== 'string') return false;
        return value.startsWith('{Binding') || 
               value.startsWith('{x:Bind') || 
               value.startsWith('{StaticResource') ||
               value.startsWith('{DynamicResource');
    }
    
    // ==========================================
    // BASIC TYPE CONVERTERS
    // ==========================================
    
    /**
     * Convert to string
     * @private
     */
    _convertString(value, options) {
        if (this.isBindingExpression(value)) {
            return value; // Already a binding, keep as-is
        }
        return String(value);
    }
    
    /**
     * Convert to integer
     * @private
     */
    _convertInteger(value, options) {
        const num = parseInt(value, 10);
        if (isNaN(num)) return null;
        return String(num);
    }
    
    /**
     * Convert to double
     * @private
     */
    _convertDouble(value, options) {
        const num = parseFloat(value);
        if (isNaN(num)) return null;
        return String(num);
    }
    
    /**
     * Convert to boolean
     * @private
     */
    _convertBoolean(value, options) {
        if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
        }
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true' ? 'True' : 'False';
        }
        return value ? 'True' : 'False';
    }
    
    /**
     * Convert to nullable boolean (for IsChecked with three-state)
     * @private
     */
    _convertNullableBoolean(value, options) {
        if (value === null || value === undefined || value === '') {
            return '{x:Null}';
        }
        return this._convertBoolean(value, options);
    }
    
    /**
     * Convert dimension value
     * @private
     */
    _convertDimension(value, options) {
        if (value === 'Auto' || value === 'auto') {
            return 'Auto';
        }
        if (value === 'NaN' || value === '*') {
            return value;
        }
        const num = parseFloat(value);
        if (isNaN(num)) return null;
        return String(num);
    }
    
    // ==========================================
    // BINDING CONVERTERS
    // ==========================================
    
    /**
     * Convert to binding expression
     * @private
     */
    _convertBinding(value, options) {
        if (this.isBindingExpression(value)) {
            return value;
        }
        
        // If it looks like a property path, wrap in binding
        if (typeof value === 'string' && /^[A-Z][a-zA-Z0-9.]+$/.test(value)) {
            const mode = options.bindingMode || 'TwoWay';
            return `{Binding ${value}, Mode=${mode}}`;
        }
        
        return String(value);
    }
    
    /**
     * Convert collection binding
     * @private
     */
    _convertCollection(value, options) {
        if (this.isBindingExpression(value)) {
            return value;
        }
        
        if (typeof value === 'string' && /^[A-Z][a-zA-Z0-9.]+$/.test(value)) {
            return `{Binding ${value}}`;
        }
        
        return String(value);
    }
    
    // ==========================================
    // ENUM CONVERTERS
    // ==========================================
    
    /**
     * Convert orientation enum
     * @private
     */
    _convertOrientation(value, options) {
        const orientationMap = {
            'horizontal': 'Horizontal',
            'vertical': 'Vertical',
            'h': 'Horizontal',
            'v': 'Vertical'
        };
        
        const lower = String(value).toLowerCase();
        return orientationMap[lower] || value;
    }
    
    /**
     * Convert dock enum
     * @private
     */
    _convertDock(value, options) {
        const dockMap = {
            'left': 'Left',
            'top': 'Top',
            'right': 'Right',
            'bottom': 'Bottom'
        };
        
        const lower = String(value).toLowerCase();
        return dockMap[lower] || value;
    }
    
    /**
     * Convert expand direction enum
     * @private
     */
    _convertExpandDirection(value, options) {
        const directionMap = {
            'down': 'Down',
            'up': 'Up',
            'left': 'Left',
            'right': 'Right'
        };
        
        const lower = String(value).toLowerCase();
        return directionMap[lower] || value;
    }
    
    /**
     * Convert selection mode enum
     * @private
     */
    _convertSelectionMode(value, options) {
        const modeMap = {
            'single': 'Single',
            'multiple': 'Multiple',
            'extended': 'Extended',
            'toggle': 'Toggle',
            'alwaysselected': 'AlwaysSelected'
        };
        
        const lower = String(value).toLowerCase().replace(/[^a-z]/g, '');
        return modeMap[lower] || value;
    }
    
    /**
     * Convert horizontal alignment enum
     * @private
     */
    _convertHorizontalAlignment(value, options) {
        const alignMap = {
            'left': 'Left',
            'center': 'Center',
            'right': 'Right',
            'stretch': 'Stretch'
        };
        
        const lower = String(value).toLowerCase();
        return alignMap[lower] || value;
    }
    
    /**
     * Convert vertical alignment enum
     * @private
     */
    _convertVerticalAlignment(value, options) {
        const alignMap = {
            'top': 'Top',
            'center': 'Center',
            'bottom': 'Bottom',
            'stretch': 'Stretch'
        };
        
        const lower = String(value).toLowerCase();
        return alignMap[lower] || value;
    }
    
    /**
     * Convert text alignment enum
     * @private
     */
    _convertTextAlignment(value, options) {
        const alignMap = {
            'left': 'Left',
            'center': 'Center',
            'right': 'Right',
            'justify': 'Justify',
            'start': 'Start',
            'end': 'End'
        };
        
        const lower = String(value).toLowerCase();
        return alignMap[lower] || value;
    }
    
    /**
     * Convert text wrapping enum
     * @private
     */
    _convertTextWrapping(value, options) {
        const wrapMap = {
            'nowrap': 'NoWrap',
            'wrap': 'Wrap',
            'wrapwithoverflow': 'WrapWithOverflow'
        };
        
        const lower = String(value).toLowerCase().replace(/[^a-z]/g, '');
        return wrapMap[lower] || value;
    }
    
    /**
     * Convert scrollbar visibility enum
     * @private
     */
    _convertScrollBarVisibility(value, options) {
        const visMap = {
            'disabled': 'Disabled',
            'auto': 'Auto',
            'hidden': 'Hidden',
            'visible': 'Visible'
        };
        
        const lower = String(value).toLowerCase();
        return visMap[lower] || value;
    }
    
    // ==========================================
    // COMPLEX TYPE CONVERTERS
    // ==========================================
    
    /**
     * Convert thickness (margin, padding, border)
     * @private
     */
    _convertThickness(value, options) {
        if (typeof value === 'number') {
            return String(value);
        }
        
        if (typeof value === 'string') {
            // Already in correct format
            if (/^[\d.,\s]+$/.test(value)) {
                return value.replace(/\s+/g, ',');
            }
            return value;
        }
        
        if (typeof value === 'object') {
            const { left = 0, top = 0, right = 0, bottom = 0 } = value;
            
            if (left === top && top === right && right === bottom) {
                return String(left);
            }
            
            if (left === right && top === bottom) {
                return `${left},${top}`;
            }
            
            return `${left},${top},${right},${bottom}`;
        }
        
        return String(value);
    }
    
    /**
     * Convert brush (colors, gradients)
     * @private
     */
    _convertBrush(value, options) {
        if (typeof value === 'string') {
            // Check for resource reference
            if (value.startsWith('{')) {
                return value;
            }
            
            // Check for hex color
            if (value.startsWith('#')) {
                return value;
            }
            
            // Check for named color
            if (/^[A-Za-z]+$/.test(value)) {
                return value;
            }
            
            // Check for rgb/rgba
            const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (rgbMatch) {
                const [, r, g, b, a] = rgbMatch;
                if (a !== undefined) {
                    const alpha = Math.round(parseFloat(a) * 255).toString(16).padStart(2, '0');
                    return `#${alpha}${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
                }
                return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
            }
        }
        
        return String(value);
    }
    
    /**
     * Convert font weight
     * @private
     */
    _convertFontWeight(value, options) {
        const weightMap = {
            'thin': 'Thin',
            'extralight': 'ExtraLight',
            'light': 'Light',
            'regular': 'Regular',
            'normal': 'Normal',
            'medium': 'Medium',
            'semibold': 'SemiBold',
            'bold': 'Bold',
            'extrabold': 'ExtraBold',
            'black': 'Black',
            '100': 'Thin',
            '200': 'ExtraLight',
            '300': 'Light',
            '400': 'Normal',
            '500': 'Medium',
            '600': 'SemiBold',
            '700': 'Bold',
            '800': 'ExtraBold',
            '900': 'Black'
        };
        
        const lower = String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
        return weightMap[lower] || value;
    }
    
    /**
     * Convert font style
     * @private
     */
    _convertFontStyle(value, options) {
        const styleMap = {
            'normal': 'Normal',
            'italic': 'Italic',
            'oblique': 'Oblique'
        };
        
        const lower = String(value).toLowerCase();
        return styleMap[lower] || value;
    }
    
    /**
     * Convert corner radius
     * @private
     */
    _convertCornerRadius(value, options) {
        if (typeof value === 'number') {
            return String(value);
        }
        
        if (typeof value === 'string') {
            return value.replace(/\s+/g, ',');
        }
        
        if (typeof value === 'object') {
            const { topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0 } = value;
            
            if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
                return String(topLeft);
            }
            
            return `${topLeft},${topRight},${bottomRight},${bottomLeft}`;
        }
        
        return String(value);
    }
    
    // ==========================================
    // GRID DEFINITION CONVERTERS
    // ==========================================
    
    /**
     * Convert row definitions
     * @private
     */
    _convertRowDefinitions(value, options) {
        if (typeof value === 'string') {
            // Convert shorthand format "Auto,*,2*,100" to full format
            return value.split(',').map(def => this._convertGridLength(def.trim())).join(',');
        }
        
        if (Array.isArray(value)) {
            return value.map(row => {
                if (typeof row === 'object' && row.height !== undefined) {
                    return this._convertGridLength(row.height);
                }
                return this._convertGridLength(row);
            }).join(',');
        }
        
        return String(value);
    }
    
    /**
     * Convert column definitions
     * @private
     */
    _convertColumnDefinitions(value, options) {
        if (typeof value === 'string') {
            return value.split(',').map(def => this._convertGridLength(def.trim())).join(',');
        }
        
        if (Array.isArray(value)) {
            return value.map(col => {
                if (typeof col === 'object' && col.width !== undefined) {
                    return this._convertGridLength(col.width);
                }
                return this._convertGridLength(col);
            }).join(',');
        }
        
        return String(value);
    }
    
    /**
     * Convert grid length value
     * @private
     */
    _convertGridLength(value, options) {
        const str = String(value).trim();
        
        // Auto
        if (str.toLowerCase() === 'auto') {
            return 'Auto';
        }
        
        // Star values
        if (str.endsWith('*')) {
            const num = str.slice(0, -1);
            if (num === '' || num === '1') {
                return '*';
            }
            return `${num}*`;
        }
        
        // Pixel values
        const num = parseFloat(str);
        if (!isNaN(num)) {
            return String(num);
        }
        
        return str;
    }
}

// ==========================================
// GLOBAL INSTANCE
// ==========================================

/**
 * Global property converter instance
 */
export const propertyConverter = new PropertyConverter();

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default PropertyConverter;
