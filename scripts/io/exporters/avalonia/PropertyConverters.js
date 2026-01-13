/**
 * Asciistrator - Avalonia Property Converters
 * 
 * Converts Asciistrator component properties to Avalonia XAML property values.
 * Handles type conversion, bindings, effects, transforms, and special property formats.
 * 
 * @version 2.0.0
 */

import { PropertyConverterType } from './ComponentMappings.js';

// ==========================================
// ADDITIONAL CONVERTER TYPES
// ==========================================

export const ExtendedConverterTypes = {
    // Effects
    DropShadow: 'dropShadow',
    BlurEffect: 'blurEffect',
    
    // Transforms
    RotateTransform: 'rotateTransform',
    ScaleTransform: 'scaleTransform',
    SkewTransform: 'skewTransform',
    TranslateTransform: 'translateTransform',
    TransformGroup: 'transformGroup',
    
    // Brushes
    LinearGradientBrush: 'linearGradientBrush',
    RadialGradientBrush: 'radialGradientBrush',
    ImageBrush: 'imageBrush',
    
    // Geometry
    PathGeometry: 'pathGeometry',
    RectangleGeometry: 'rectangleGeometry',
    EllipseGeometry: 'ellipseGeometry',
    
    // Layout
    Point: 'point',
    Rect: 'rect',
    Size: 'size'
};

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
        
        // Extended converters - Effects
        this._converters.set(ExtendedConverterTypes.DropShadow, this._convertDropShadow.bind(this));
        this._converters.set(ExtendedConverterTypes.BlurEffect, this._convertBlurEffect.bind(this));
        
        // Extended converters - Transforms
        this._converters.set(ExtendedConverterTypes.RotateTransform, this._convertRotateTransform.bind(this));
        this._converters.set(ExtendedConverterTypes.ScaleTransform, this._convertScaleTransform.bind(this));
        this._converters.set(ExtendedConverterTypes.SkewTransform, this._convertSkewTransform.bind(this));
        this._converters.set(ExtendedConverterTypes.TranslateTransform, this._convertTranslateTransform.bind(this));
        this._converters.set(ExtendedConverterTypes.TransformGroup, this._convertTransformGroup.bind(this));
        
        // Extended converters - Brushes
        this._converters.set(ExtendedConverterTypes.LinearGradientBrush, this._convertLinearGradientBrush.bind(this));
        this._converters.set(ExtendedConverterTypes.RadialGradientBrush, this._convertRadialGradientBrush.bind(this));
        this._converters.set(ExtendedConverterTypes.ImageBrush, this._convertImageBrush.bind(this));
        
        // Extended converters - Geometry
        this._converters.set(ExtendedConverterTypes.Point, this._convertPoint.bind(this));
        this._converters.set(ExtendedConverterTypes.Rect, this._convertRect.bind(this));
        this._converters.set(ExtendedConverterTypes.Size, this._convertSize.bind(this));
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
    
    // ==========================================
    // EFFECT CONVERTERS
    // ==========================================
    
    /**
     * Convert drop shadow effect
     * @private
     */
    _convertDropShadow(value, options) {
        if (!value) return null;
        
        const attrs = [];
        
        // Color
        if (value.color) {
            attrs.push(`Color="${this._convertBrush(value.color)}"`);
        }
        
        // Direction (angle in degrees)
        if (value.offset || value.direction !== undefined) {
            if (value.offset) {
                const angle = Math.atan2(value.offset.y, value.offset.x) * (180 / Math.PI);
                attrs.push(`Direction="${Math.round(angle)}"`);
                const depth = Math.sqrt(value.offset.x ** 2 + value.offset.y ** 2);
                attrs.push(`ShadowDepth="${depth}"`);
            } else if (value.direction !== undefined) {
                attrs.push(`Direction="${value.direction}"`);
            }
        }
        
        // Blur radius
        if (value.radius !== undefined || value.blurRadius !== undefined) {
            attrs.push(`BlurRadius="${value.radius ?? value.blurRadius}"`);
        }
        
        // Opacity
        if (value.opacity !== undefined) {
            attrs.push(`Opacity="${value.opacity}"`);
        }
        
        return `<DropShadowEffect ${attrs.join(' ')}/>`;
    }
    
    /**
     * Convert blur effect
     * @private
     */
    _convertBlurEffect(value, options) {
        if (!value) return null;
        
        const radius = value.radius ?? value;
        return `<BlurEffect Radius="${radius}"/>`;
    }
    
    // ==========================================
    // TRANSFORM CONVERTERS
    // ==========================================
    
    /**
     * Convert rotate transform
     * @private
     */
    _convertRotateTransform(value, options) {
        if (value === null || value === undefined) return null;
        
        const attrs = [];
        
        if (typeof value === 'number') {
            attrs.push(`Angle="${value}"`);
        } else if (typeof value === 'object') {
            if (value.angle !== undefined) attrs.push(`Angle="${value.angle}"`);
            if (value.centerX !== undefined) attrs.push(`CenterX="${value.centerX}"`);
            if (value.centerY !== undefined) attrs.push(`CenterY="${value.centerY}"`);
        }
        
        return `<RotateTransform ${attrs.join(' ')}/>`;
    }
    
    /**
     * Convert scale transform
     * @private
     */
    _convertScaleTransform(value, options) {
        if (!value) return null;
        
        const attrs = [];
        
        if (typeof value === 'number') {
            attrs.push(`ScaleX="${value}"`);
            attrs.push(`ScaleY="${value}"`);
        } else if (typeof value === 'object') {
            if (value.scaleX !== undefined || value.x !== undefined) {
                attrs.push(`ScaleX="${value.scaleX ?? value.x}"`);
            }
            if (value.scaleY !== undefined || value.y !== undefined) {
                attrs.push(`ScaleY="${value.scaleY ?? value.y}"`);
            }
            if (value.centerX !== undefined) attrs.push(`CenterX="${value.centerX}"`);
            if (value.centerY !== undefined) attrs.push(`CenterY="${value.centerY}"`);
        }
        
        return `<ScaleTransform ${attrs.join(' ')}/>`;
    }
    
    /**
     * Convert skew transform
     * @private
     */
    _convertSkewTransform(value, options) {
        if (!value) return null;
        
        const attrs = [];
        
        if (typeof value === 'object') {
            if (value.angleX !== undefined || value.x !== undefined) {
                attrs.push(`AngleX="${value.angleX ?? value.x}"`);
            }
            if (value.angleY !== undefined || value.y !== undefined) {
                attrs.push(`AngleY="${value.angleY ?? value.y}"`);
            }
            if (value.centerX !== undefined) attrs.push(`CenterX="${value.centerX}"`);
            if (value.centerY !== undefined) attrs.push(`CenterY="${value.centerY}"`);
        }
        
        return `<SkewTransform ${attrs.join(' ')}/>`;
    }
    
    /**
     * Convert translate transform
     * @private
     */
    _convertTranslateTransform(value, options) {
        if (!value) return null;
        
        const attrs = [];
        
        if (typeof value === 'object') {
            if (value.x !== undefined) attrs.push(`X="${value.x}"`);
            if (value.y !== undefined) attrs.push(`Y="${value.y}"`);
        }
        
        return `<TranslateTransform ${attrs.join(' ')}/>`;
    }
    
    /**
     * Convert transform group
     * @private
     */
    _convertTransformGroup(value, options) {
        if (!value || !Array.isArray(value)) return null;
        
        const transforms = [];
        
        for (const transform of value) {
            if (transform.type === 'rotate' || transform.rotation !== undefined) {
                transforms.push(this._convertRotateTransform(transform.rotation ?? transform));
            } else if (transform.type === 'scale' || transform.scale !== undefined) {
                transforms.push(this._convertScaleTransform(transform.scale ?? transform));
            } else if (transform.type === 'skew' || transform.skew !== undefined) {
                transforms.push(this._convertSkewTransform(transform.skew ?? transform));
            } else if (transform.type === 'translate' || transform.translate !== undefined) {
                transforms.push(this._convertTranslateTransform(transform.translate ?? transform));
            }
        }
        
        const validTransforms = transforms.filter(t => t);
        if (validTransforms.length === 0) return null;
        if (validTransforms.length === 1) return validTransforms[0];
        
        return `<TransformGroup>\n    ${validTransforms.join('\n    ')}\n</TransformGroup>`;
    }
    
    // ==========================================
    // ADVANCED BRUSH CONVERTERS
    // ==========================================
    
    /**
     * Convert linear gradient brush
     * @private
     */
    _convertLinearGradientBrush(value, options) {
        if (!value) return null;
        
        const attrs = [];
        const stops = [];
        
        // Start/end points
        if (value.startPoint) {
            attrs.push(`StartPoint="${value.startPoint.x ?? 0},${value.startPoint.y ?? 0}"`);
        }
        if (value.endPoint) {
            attrs.push(`EndPoint="${value.endPoint.x ?? 1},${value.endPoint.y ?? 1}"`);
        } else if (value.angle !== undefined) {
            // Convert angle to start/end points
            const rad = (value.angle * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            attrs.push(`StartPoint="0.5,0.5"`);
            attrs.push(`EndPoint="${0.5 + cos * 0.5},${0.5 + sin * 0.5}"`);
        }
        
        // Gradient handles from Figma
        if (value.gradientHandlePositions?.length >= 2) {
            const start = value.gradientHandlePositions[0];
            const end = value.gradientHandlePositions[1];
            attrs.push(`StartPoint="${start.x},${start.y}"`);
            attrs.push(`EndPoint="${end.x},${end.y}"`);
        }
        
        // Spread method
        if (value.spreadMethod) {
            attrs.push(`SpreadMethod="${value.spreadMethod}"`);
        }
        
        // Gradient stops
        const gradientStops = value.gradientStops || value.stops || [];
        for (const stop of gradientStops) {
            const color = this._convertBrush(stop.color);
            const offset = stop.position ?? stop.offset ?? 0;
            stops.push(`<GradientStop Offset="${offset}" Color="${color}"/>`);
        }
        
        if (stops.length === 0) {
            stops.push('<GradientStop Offset="0" Color="White"/>');
            stops.push('<GradientStop Offset="1" Color="Black"/>');
        }
        
        return `<LinearGradientBrush ${attrs.join(' ')}>\n    ${stops.join('\n    ')}\n</LinearGradientBrush>`;
    }
    
    /**
     * Convert radial gradient brush
     * @private
     */
    _convertRadialGradientBrush(value, options) {
        if (!value) return null;
        
        const attrs = [];
        const stops = [];
        
        // Center point
        if (value.center) {
            attrs.push(`Center="${value.center.x ?? 0.5},${value.center.y ?? 0.5}"`);
        }
        
        // Gradient origin
        if (value.origin || value.gradientOrigin) {
            const origin = value.origin || value.gradientOrigin;
            attrs.push(`GradientOrigin="${origin.x ?? 0.5},${origin.y ?? 0.5}"`);
        }
        
        // Radius
        if (value.radiusX !== undefined) attrs.push(`RadiusX="${value.radiusX}"`);
        if (value.radiusY !== undefined) attrs.push(`RadiusY="${value.radiusY}"`);
        if (value.radius !== undefined && value.radiusX === undefined) {
            attrs.push(`RadiusX="${value.radius}"`);
            attrs.push(`RadiusY="${value.radius}"`);
        }
        
        // Spread method
        if (value.spreadMethod) {
            attrs.push(`SpreadMethod="${value.spreadMethod}"`);
        }
        
        // Gradient stops
        const gradientStops = value.gradientStops || value.stops || [];
        for (const stop of gradientStops) {
            const color = this._convertBrush(stop.color);
            const offset = stop.position ?? stop.offset ?? 0;
            stops.push(`<GradientStop Offset="${offset}" Color="${color}"/>`);
        }
        
        if (stops.length === 0) {
            stops.push('<GradientStop Offset="0" Color="White"/>');
            stops.push('<GradientStop Offset="1" Color="Black"/>');
        }
        
        return `<RadialGradientBrush ${attrs.join(' ')}>\n    ${stops.join('\n    ')}\n</RadialGradientBrush>`;
    }
    
    /**
     * Convert image brush
     * @private
     */
    _convertImageBrush(value, options) {
        if (!value) return null;
        
        const attrs = [];
        
        // Source
        if (value.source || value.src || value.imageRef) {
            attrs.push(`ImageSource="${value.source || value.src || value.imageRef}"`);
        }
        
        // Stretch mode
        const stretchMap = {
            'FILL': 'Fill',
            'FIT': 'Uniform',
            'CROP': 'UniformToFill',
            'TILE': 'None',
            'fill': 'Fill',
            'cover': 'UniformToFill',
            'contain': 'Uniform',
            'none': 'None'
        };
        
        if (value.stretch || value.scaleMode) {
            const stretch = stretchMap[value.stretch || value.scaleMode] || 'UniformToFill';
            attrs.push(`Stretch="${stretch}"`);
        }
        
        // Tile mode
        if (value.tileMode || (value.scaleMode === 'TILE')) {
            attrs.push(`TileMode="${value.tileMode || 'Tile'}"`);
        }
        
        // Viewport/viewbox for tiling
        if (value.viewport) {
            attrs.push(`Viewport="${value.viewport}"`);
        }
        if (value.viewbox) {
            attrs.push(`Viewbox="${value.viewbox}"`);
        }
        
        // Opacity
        if (value.opacity !== undefined && value.opacity !== 1) {
            attrs.push(`Opacity="${value.opacity}"`);
        }
        
        return `<ImageBrush ${attrs.join(' ')}/>`;
    }
    
    // ==========================================
    // GEOMETRY CONVERTERS
    // ==========================================
    
    /**
     * Convert point
     * @private
     */
    _convertPoint(value, options) {
        if (!value) return null;
        
        if (typeof value === 'string') return value;
        
        const x = value.x ?? 0;
        const y = value.y ?? 0;
        return `${x},${y}`;
    }
    
    /**
     * Convert rect
     * @private
     */
    _convertRect(value, options) {
        if (!value) return null;
        
        if (typeof value === 'string') return value;
        
        const x = value.x ?? 0;
        const y = value.y ?? 0;
        const width = value.width ?? 0;
        const height = value.height ?? 0;
        return `${x},${y},${width},${height}`;
    }
    
    /**
     * Convert size
     * @private
     */
    _convertSize(value, options) {
        if (!value) return null;
        
        if (typeof value === 'string') return value;
        
        const width = value.width ?? 0;
        const height = value.height ?? 0;
        return `${width},${height}`;
    }
    
    // ==========================================
    // HELPER METHODS
    // ==========================================
    
    /**
     * Convert fills array to appropriate brush
     * @param {Array|Object} fills - Fill definitions
     * @returns {string} XAML brush string or element
     */
    convertFills(fills) {
        if (!fills) return 'Transparent';
        
        const fillArray = Array.isArray(fills) ? fills : [fills];
        if (fillArray.length === 0) return 'Transparent';
        
        const fill = fillArray.find(f => f.visible !== false) || fillArray[0];
        
        switch (fill.type) {
            case 'SOLID':
            case 'solid':
                return this._convertBrush(fill.color);
                
            case 'LINEAR_GRADIENT':
            case 'linearGradient':
                return this._convertLinearGradientBrush(fill);
                
            case 'RADIAL_GRADIENT':
            case 'radialGradient':
                return this._convertRadialGradientBrush(fill);
                
            case 'IMAGE':
            case 'image':
                return this._convertImageBrush(fill);
                
            default:
                if (fill.color) {
                    return this._convertBrush(fill.color);
                }
                return 'Transparent';
        }
    }
    
    /**
     * Convert strokes array to stroke properties
     * @param {Array|Object} strokes - Stroke definitions
     * @returns {Object} { stroke, strokeThickness, strokeDashArray, etc. }
     */
    convertStrokes(strokes) {
        const result = {};
        
        if (!strokes) return result;
        
        const strokeArray = Array.isArray(strokes) ? strokes : [strokes];
        if (strokeArray.length === 0) return result;
        
        const stroke = strokeArray.find(s => s.visible !== false) || strokeArray[0];
        
        // Color
        result.stroke = this.convertFills(stroke.color ? [{ type: 'SOLID', color: stroke.color }] : stroke);
        
        // Thickness
        if (stroke.weight !== undefined || stroke.strokeWeight !== undefined) {
            result.strokeThickness = stroke.weight ?? stroke.strokeWeight;
        }
        
        // Dash pattern
        if (stroke.dashPattern?.length > 0) {
            result.strokeDashArray = stroke.dashPattern.join(' ');
        }
        
        // Line cap
        if (stroke.strokeCap) {
            const capMap = { 'NONE': 'Flat', 'ROUND': 'Round', 'SQUARE': 'Square' };
            result.strokeLineCap = capMap[stroke.strokeCap] || stroke.strokeCap;
        }
        
        // Line join
        if (stroke.strokeJoin) {
            const joinMap = { 'MITER': 'Miter', 'ROUND': 'Round', 'BEVEL': 'Bevel' };
            result.strokeLineJoin = joinMap[stroke.strokeJoin] || stroke.strokeJoin;
        }
        
        return result;
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
