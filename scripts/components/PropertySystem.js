/**
 * Asciistrator - Property System
 * 
 * Defines the property schema system for UI components.
 * Supports typed properties, validation, default values, and converters.
 * 
 * @version 1.0.0
 */

// ==========================================
// PROPERTY TYPES
// ==========================================

/**
 * Enumeration of supported property types
 */
export const PropertyType = {
    String: 'string',
    Number: 'number',
    Integer: 'integer',
    Boolean: 'boolean',
    NullableBoolean: 'nullable-boolean',
    Color: 'color',
    Brush: 'brush',
    Thickness: 'thickness',
    CornerRadius: 'corner-radius',
    Dimension: 'dimension',
    GridLength: 'grid-length',
    Orientation: 'orientation',
    HorizontalAlignment: 'horizontal-alignment',
    VerticalAlignment: 'vertical-alignment',
    Dock: 'dock',
    Visibility: 'visibility',
    FontWeight: 'font-weight',
    FontStyle: 'font-style',
    TextAlignment: 'text-alignment',
    TextWrapping: 'text-wrapping',
    ScrollBarVisibility: 'scrollbar-visibility',
    SelectionMode: 'selection-mode',
    ExpandDirection: 'expand-direction',
    ClickMode: 'click-mode',
    Binding: 'binding',
    Command: 'command',
    Collection: 'collection',
    Object: 'object',
    Enum: 'enum'
};

/**
 * Property categories for UI organization
 */
export const PropertyCategory = {
    Common: 'Common',
    Layout: 'Layout',
    Appearance: 'Appearance',
    Behavior: 'Behavior',
    Text: 'Text',
    Content: 'Content',
    Data: 'Data',
    Events: 'Events',
    Accessibility: 'Accessibility',
    Transform: 'Transform',
    Brush: 'Brush',
    Misc: 'Miscellaneous'
};

// ==========================================
// PROPERTY DEFINITION
// ==========================================

/**
 * Defines a single property on a UI component
 * Properties are framework-agnostic - use FrameworkMappings for framework-specific names
 */
export class PropertyDefinition {
    /**
     * Create a property definition
     * @param {Object} options - Property options
     */
    constructor(options = {}) {
        this.name = options.name || '';
        this.displayName = options.displayName || this.name;
        this.type = options.type || PropertyType.String;
        this.defaultValue = options.defaultValue !== undefined ? options.defaultValue : null;
        this.description = options.description || '';
        this.category = options.category || PropertyCategory.Common;
        this.isAttached = options.isAttached || false;
        this.isReadOnly = options.isReadOnly || false;
        this.bindable = options.bindable !== false;
        this.browsable = options.browsable !== false;
        this.required = options.required || false;
        
        // Validation
        this.minValue = options.minValue;
        this.maxValue = options.maxValue;
        this.minLength = options.minLength;
        this.maxLength = options.maxLength;
        this.pattern = options.pattern;
        this.enumValues = options.enumValues;
        this.validator = options.validator;
        
        // UI hints
        this.editor = options.editor;
        this.editorOptions = options.editorOptions;
        
        // Framework mapping hints (optional - registry handles most mappings)
        // These allow property-specific overrides if needed
        this.frameworkHints = options.frameworkHints || {};
    }
    
    /**
     * Get property name for a specific framework
     * @param {string} framework - Target framework (e.g., 'avalonia', 'wpf')
     * @returns {string} Framework-specific property name
     */
    getFrameworkPropertyName(framework) {
        // Check for explicit framework hint
        if (this.frameworkHints[framework]) {
            return this.frameworkHints[framework];
        }
        // Default to generic name with PascalCase
        return this.name.charAt(0).toUpperCase() + this.name.slice(1);
    }
    
    /**
     * Validate a value against this property definition
     * @param {*} value - Value to validate
     * @returns {ValidationResult}
     */
    validate(value) {
        const errors = [];
        
        // Required check
        if (this.required && (value === null || value === undefined || value === '')) {
            errors.push(`${this.displayName} is required`);
            return { valid: false, errors };
        }
        
        // Skip further validation for null/undefined optional values
        if (value === null || value === undefined) {
            return { valid: true, errors: [] };
        }
        
        // Type-specific validation
        switch (this.type) {
            case PropertyType.String:
                if (typeof value !== 'string') {
                    errors.push(`${this.displayName} must be a string`);
                } else {
                    if (this.minLength !== undefined && value.length < this.minLength) {
                        errors.push(`${this.displayName} must be at least ${this.minLength} characters`);
                    }
                    if (this.maxLength !== undefined && value.length > this.maxLength) {
                        errors.push(`${this.displayName} must be at most ${this.maxLength} characters`);
                    }
                    if (this.pattern && !this.pattern.test(value)) {
                        errors.push(`${this.displayName} has invalid format`);
                    }
                }
                break;
                
            case PropertyType.Number:
            case PropertyType.Integer:
            case PropertyType.Dimension:
                const num = Number(value);
                if (isNaN(num)) {
                    errors.push(`${this.displayName} must be a number`);
                } else {
                    if (this.type === PropertyType.Integer && !Number.isInteger(num)) {
                        errors.push(`${this.displayName} must be an integer`);
                    }
                    if (this.minValue !== undefined && num < this.minValue) {
                        errors.push(`${this.displayName} must be at least ${this.minValue}`);
                    }
                    if (this.maxValue !== undefined && num > this.maxValue) {
                        errors.push(`${this.displayName} must be at most ${this.maxValue}`);
                    }
                }
                break;
                
            case PropertyType.Boolean:
                if (typeof value !== 'boolean') {
                    errors.push(`${this.displayName} must be a boolean`);
                }
                break;
                
            case PropertyType.Enum:
                if (this.enumValues && !this.enumValues.includes(value)) {
                    errors.push(`${this.displayName} must be one of: ${this.enumValues.join(', ')}`);
                }
                break;
        }
        
        // Custom validator
        if (this.validator && errors.length === 0) {
            const customResult = this.validator(value);
            if (customResult !== true) {
                errors.push(typeof customResult === 'string' ? customResult : `${this.displayName} is invalid`);
            }
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    /**
     * Convert value to target type
     * @param {*} value - Value to convert
     * @returns {*} - Converted value
     */
    coerce(value) {
        if (value === null || value === undefined) {
            return this.defaultValue;
        }
        
        switch (this.type) {
            case PropertyType.String:
                return String(value);
                
            case PropertyType.Number:
            case PropertyType.Dimension:
                return Number(value);
                
            case PropertyType.Integer:
                return Math.round(Number(value));
                
            case PropertyType.Boolean:
                return Boolean(value);
                
            case PropertyType.NullableBoolean:
                if (value === null || value === 'null' || value === 'indeterminate') {
                    return null;
                }
                return Boolean(value);
                
            default:
                return value;
        }
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            name: this.name,
            displayName: this.displayName,
            type: this.type,
            defaultValue: this.defaultValue,
            description: this.description,
            category: this.category,
            isAttached: this.isAttached,
            isReadOnly: this.isReadOnly,
            bindable: this.bindable,
            required: this.required,
            frameworkHints: this.frameworkHints
        };
    }
}

// ==========================================
// COMMON PROPERTY DEFINITIONS
// ==========================================

/**
 * Factory for creating common property definitions
 */
export const CommonProperties = {
    // Layout properties
    width: (defaultValue = null) => new PropertyDefinition({
        name: 'width',
        displayName: 'Width',
        type: PropertyType.Dimension,
        defaultValue,
        description: 'The width of the control',
        category: PropertyCategory.Layout,
        minValue: 0
    }),
    
    height: (defaultValue = null) => new PropertyDefinition({
        name: 'height',
        displayName: 'Height',
        type: PropertyType.Dimension,
        defaultValue,
        description: 'The height of the control',
        category: PropertyCategory.Layout,
        minValue: 0
    }),
    
    minWidth: (defaultValue = 0) => new PropertyDefinition({
        name: 'minWidth',
        displayName: 'Min Width',
        type: PropertyType.Dimension,
        defaultValue,
        description: 'The minimum width of the control',
        category: PropertyCategory.Layout,
        minValue: 0
    }),
    
    minHeight: (defaultValue = 0) => new PropertyDefinition({
        name: 'minHeight',
        displayName: 'Min Height',
        type: PropertyType.Dimension,
        defaultValue,
        description: 'The minimum height of the control',
        category: PropertyCategory.Layout,
        minValue: 0
    }),
    
    maxWidth: (defaultValue = Infinity) => new PropertyDefinition({
        name: 'maxWidth',
        displayName: 'Max Width',
        type: PropertyType.Dimension,
        defaultValue,
        description: 'The maximum width of the control',
        category: PropertyCategory.Layout,
        minValue: 0
    }),
    
    maxHeight: (defaultValue = Infinity) => new PropertyDefinition({
        name: 'maxHeight',
        displayName: 'Max Height',
        type: PropertyType.Dimension,
        defaultValue,
        description: 'The maximum height of the control',
        category: PropertyCategory.Layout,
        minValue: 0
    }),
    
    margin: (defaultValue = '0') => new PropertyDefinition({
        name: 'margin',
        displayName: 'Margin',
        type: PropertyType.Thickness,
        defaultValue,
        description: 'The outer margin of the control',
        category: PropertyCategory.Layout
    }),
    
    padding: (defaultValue = '0') => new PropertyDefinition({
        name: 'padding',
        displayName: 'Padding',
        type: PropertyType.Thickness,
        defaultValue,
        description: 'The inner padding of the control',
        category: PropertyCategory.Layout
    }),
    
    horizontalAlignment: (defaultValue = 'Stretch') => new PropertyDefinition({
        name: 'horizontalAlignment',
        displayName: 'Horizontal Alignment',
        type: PropertyType.Enum,
        defaultValue,
        description: 'The horizontal alignment of the control',
        category: PropertyCategory.Layout,
        enumValues: ['Left', 'Center', 'Right', 'Stretch']
    }),
    
    verticalAlignment: (defaultValue = 'Stretch') => new PropertyDefinition({
        name: 'verticalAlignment',
        displayName: 'Vertical Alignment',
        type: PropertyType.Enum,
        defaultValue,
        description: 'The vertical alignment of the control',
        category: PropertyCategory.Layout,
        enumValues: ['Top', 'Center', 'Bottom', 'Stretch']
    }),
    
    // Common properties
    name: (defaultValue = '') => new PropertyDefinition({
        name: 'name',
        displayName: 'Name',
        type: PropertyType.String,
        defaultValue,
        description: 'The name of the control',
        category: PropertyCategory.Common,
        pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/
    }),
    
    isEnabled: (defaultValue = true) => new PropertyDefinition({
        name: 'isEnabled',
        displayName: 'Is Enabled',
        type: PropertyType.Boolean,
        defaultValue,
        description: 'Whether the control is enabled',
        category: PropertyCategory.Common
    }),
    
    isVisible: (defaultValue = true) => new PropertyDefinition({
        name: 'isVisible',
        displayName: 'Is Visible',
        type: PropertyType.Boolean,
        defaultValue,
        description: 'Whether the control is visible',
        category: PropertyCategory.Common
    }),
    
    opacity: (defaultValue = 1) => new PropertyDefinition({
        name: 'opacity',
        displayName: 'Opacity',
        type: PropertyType.Number,
        defaultValue,
        description: 'The opacity of the control (0-1)',
        category: PropertyCategory.Appearance,
        minValue: 0,
        maxValue: 1
    }),
    
    // Appearance properties
    background: (defaultValue = null) => new PropertyDefinition({
        name: 'background',
        displayName: 'Background',
        type: PropertyType.Brush,
        defaultValue,
        description: 'The background brush',
        category: PropertyCategory.Appearance
    }),
    
    foreground: (defaultValue = null) => new PropertyDefinition({
        name: 'foreground',
        displayName: 'Foreground',
        type: PropertyType.Brush,
        defaultValue,
        description: 'The foreground brush',
        category: PropertyCategory.Appearance
    }),
    
    borderBrush: (defaultValue = null) => new PropertyDefinition({
        name: 'borderBrush',
        displayName: 'Border Brush',
        type: PropertyType.Brush,
        defaultValue,
        description: 'The border brush',
        category: PropertyCategory.Appearance
    }),
    
    borderThickness: (defaultValue = '0') => new PropertyDefinition({
        name: 'borderThickness',
        displayName: 'Border Thickness',
        type: PropertyType.Thickness,
        defaultValue,
        description: 'The border thickness',
        category: PropertyCategory.Appearance
    }),
    
    cornerRadius: (defaultValue = '0') => new PropertyDefinition({
        name: 'cornerRadius',
        displayName: 'Corner Radius',
        type: PropertyType.CornerRadius,
        defaultValue,
        description: 'The corner radius',
        category: PropertyCategory.Appearance
    }),
    
    // Text properties
    fontFamily: (defaultValue = null) => new PropertyDefinition({
        name: 'fontFamily',
        displayName: 'Font Family',
        type: PropertyType.String,
        defaultValue,
        description: 'The font family',
        category: PropertyCategory.Text
    }),
    
    fontSize: (defaultValue = 14) => new PropertyDefinition({
        name: 'fontSize',
        displayName: 'Font Size',
        type: PropertyType.Number,
        defaultValue,
        description: 'The font size',
        category: PropertyCategory.Text,
        minValue: 1
    }),
    
    fontWeight: (defaultValue = 'Normal') => new PropertyDefinition({
        name: 'fontWeight',
        displayName: 'Font Weight',
        type: PropertyType.Enum,
        defaultValue,
        description: 'The font weight',
        category: PropertyCategory.Text,
        enumValues: ['Thin', 'ExtraLight', 'Light', 'Normal', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black']
    }),
    
    fontStyle: (defaultValue = 'Normal') => new PropertyDefinition({
        name: 'fontStyle',
        displayName: 'Font Style',
        type: PropertyType.Enum,
        defaultValue,
        description: 'The font style',
        category: PropertyCategory.Text,
        enumValues: ['Normal', 'Italic', 'Oblique']
    }),
    
    // Content properties
    content: (defaultValue = '') => new PropertyDefinition({
        name: 'content',
        displayName: 'Content',
        type: PropertyType.Object,
        defaultValue,
        description: 'The content of the control',
        category: PropertyCategory.Content
    }),
    
    text: (defaultValue = '') => new PropertyDefinition({
        name: 'text',
        displayName: 'Text',
        type: PropertyType.String,
        defaultValue,
        description: 'The text content',
        category: PropertyCategory.Content
    }),
    
    title: (defaultValue = '') => new PropertyDefinition({
        name: 'title',
        displayName: 'Title',
        type: PropertyType.String,
        defaultValue,
        description: 'The title of the control',
        category: PropertyCategory.Content
    }),
    
    header: (defaultValue = '') => new PropertyDefinition({
        name: 'header',
        displayName: 'Header',
        type: PropertyType.Object,
        defaultValue,
        description: 'The header content',
        category: PropertyCategory.Content
    }),
    
    horizontalContentAlignment: (defaultValue = 'Stretch') => new PropertyDefinition({
        name: 'horizontalContentAlignment',
        displayName: 'Horizontal Content Alignment',
        type: PropertyType.Enum,
        defaultValue,
        description: 'The horizontal alignment of the content',
        category: PropertyCategory.Layout,
        enumValues: ['Left', 'Center', 'Right', 'Stretch']
    }),
    
    verticalContentAlignment: (defaultValue = 'Stretch') => new PropertyDefinition({
        name: 'verticalContentAlignment',
        displayName: 'Vertical Content Alignment',
        type: PropertyType.Enum,
        defaultValue,
        description: 'The vertical alignment of the content',
        category: PropertyCategory.Layout,
        enumValues: ['Top', 'Center', 'Bottom', 'Stretch']
    }),
    
    // Data properties
    dataContext: () => new PropertyDefinition({
        name: 'dataContext',
        displayName: 'Data Context',
        type: PropertyType.Object,
        defaultValue: null,
        description: 'The data context for binding',
        category: PropertyCategory.Data
    }),
    
    tag: () => new PropertyDefinition({
        name: 'tag',
        displayName: 'Tag',
        type: PropertyType.Object,
        defaultValue: null,
        description: 'User-defined data',
        category: PropertyCategory.Data
    }),
    
    // Accessibility properties
    toolTip: (defaultValue = null) => new PropertyDefinition({
        name: 'toolTip',
        displayName: 'ToolTip',
        type: PropertyType.Object,
        defaultValue,
        description: 'The tooltip content',
        category: PropertyCategory.Accessibility
    }),
    
    // Grid attached properties
    gridRow: (defaultValue = 0) => new PropertyDefinition({
        name: 'gridRow',
        displayName: 'Grid Row',
        type: PropertyType.Integer,
        defaultValue,
        description: 'The row in a Grid',
        category: PropertyCategory.Layout,
        isAttached: true,
        minValue: 0
    }),
    
    gridColumn: (defaultValue = 0) => new PropertyDefinition({
        name: 'gridColumn',
        displayName: 'Grid Column',
        type: PropertyType.Integer,
        defaultValue,
        description: 'The column in a Grid',
        category: PropertyCategory.Layout,
        isAttached: true,
        minValue: 0
    }),
    
    gridRowSpan: (defaultValue = 1) => new PropertyDefinition({
        name: 'gridRowSpan',
        displayName: 'Grid Row Span',
        type: PropertyType.Integer,
        defaultValue,
        description: 'The row span in a Grid',
        category: PropertyCategory.Layout,
        isAttached: true,
        minValue: 1
    }),
    
    gridColumnSpan: (defaultValue = 1) => new PropertyDefinition({
        name: 'gridColumnSpan',
        displayName: 'Grid Column Span',
        type: PropertyType.Integer,
        defaultValue,
        description: 'The column span in a Grid',
        category: PropertyCategory.Layout,
        isAttached: true,
        minValue: 1
    }),
    
    // DockPanel attached property
    dock: (defaultValue = 'Left') => new PropertyDefinition({
        name: 'dock',
        displayName: 'Dock',
        type: PropertyType.Enum,
        defaultValue,
        description: 'The dock position in a DockPanel',
        category: PropertyCategory.Layout,
        isAttached: true,
        enumValues: ['Left', 'Top', 'Right', 'Bottom']
    })
};

// ==========================================
// PROPERTY VALUE STORE
// ==========================================

/**
 * Stores property values for a component instance
 */
export class PropertyStore {
    constructor(schema) {
        this.schema = schema; // Map of property name to PropertyDefinition
        this.values = new Map();
        this.bindings = new Map();
        this.listeners = new Map();
    }
    
    /**
     * Get a property value
     * @param {string} name - Property name
     * @returns {*} - Property value or default
     */
    get(name) {
        if (this.values.has(name)) {
            return this.values.get(name);
        }
        const def = this.schema.get(name);
        return def ? def.defaultValue : undefined;
    }
    
    /**
     * Set a property value
     * @param {string} name - Property name
     * @param {*} value - Value to set
     * @returns {boolean} - Whether the value was set
     */
    set(name, value) {
        const def = this.schema.get(name);
        if (!def) {
            console.warn(`Unknown property: ${name}`);
            return false;
        }
        
        if (def.isReadOnly) {
            console.warn(`Property ${name} is read-only`);
            return false;
        }
        
        // Validate
        const validation = def.validate(value);
        if (!validation.valid) {
            console.warn(`Invalid value for ${name}:`, validation.errors);
            return false;
        }
        
        // Coerce and set
        const oldValue = this.get(name);
        const newValue = def.coerce(value);
        
        if (oldValue !== newValue) {
            this.values.set(name, newValue);
            this._notifyChange(name, oldValue, newValue);
        }
        
        return true;
    }
    
    /**
     * Set a binding expression
     * @param {string} name - Property name
     * @param {string} binding - Binding expression
     */
    setBinding(name, binding) {
        this.bindings.set(name, binding);
    }
    
    /**
     * Get a binding expression
     * @param {string} name - Property name
     * @returns {string|null} - Binding expression
     */
    getBinding(name) {
        return this.bindings.get(name) || null;
    }
    
    /**
     * Check if property has a binding
     * @param {string} name - Property name
     * @returns {boolean}
     */
    hasBinding(name) {
        return this.bindings.has(name);
    }
    
    /**
     * Add a change listener
     * @param {string} name - Property name
     * @param {Function} callback - Callback function
     */
    addListener(name, callback) {
        if (!this.listeners.has(name)) {
            this.listeners.set(name, new Set());
        }
        this.listeners.get(name).add(callback);
    }
    
    /**
     * Remove a change listener
     * @param {string} name - Property name
     * @param {Function} callback - Callback function
     */
    removeListener(name, callback) {
        const listeners = this.listeners.get(name);
        if (listeners) {
            listeners.delete(callback);
        }
    }
    
    /**
     * Notify listeners of a change
     * @private
     */
    _notifyChange(name, oldValue, newValue) {
        const listeners = this.listeners.get(name);
        if (listeners) {
            for (const callback of listeners) {
                callback(name, oldValue, newValue);
            }
        }
    }
    
    /**
     * Get all property values as an object
     * @returns {Object}
     */
    toObject() {
        const obj = {};
        for (const [name, def] of this.schema) {
            obj[name] = this.get(name);
        }
        return obj;
    }
    
    /**
     * Set multiple property values
     * @param {Object} values - Object with property values
     */
    setAll(values) {
        for (const [name, value] of Object.entries(values)) {
            this.set(name, value);
        }
    }
    
    /**
     * Reset all properties to defaults
     */
    reset() {
        this.values.clear();
        this.bindings.clear();
    }
    
    /**
     * Clone the property store
     * @returns {PropertyStore}
     */
    clone() {
        const clone = new PropertyStore(this.schema);
        for (const [name, value] of this.values) {
            clone.values.set(name, value);
        }
        for (const [name, binding] of this.bindings) {
            clone.bindings.set(name, binding);
        }
        return clone;
    }
}

// ==========================================
// EVENT DEFINITIONS
// ==========================================

/**
 * Defines an event on a UI component
 */
export class EventDefinition {
    constructor(options = {}) {
        this.name = options.name || '';
        this.displayName = options.displayName || this.name;
        this.description = options.description || '';
        this.eventArgsType = options.eventArgsType || 'EventArgs';
        this.isRoutedEvent = options.isRoutedEvent || false;
        this.routingStrategy = options.routingStrategy || 'Bubble';
        // Framework mapping hints (optional - registry handles most mappings)
        this.frameworkHints = options.frameworkHints || {};
    }
    
    /**
     * Get event name for a specific framework
     * @param {string} framework - Target framework (e.g., 'avalonia', 'wpf')
     * @returns {string} Framework-specific event name
     */
    getFrameworkEventName(framework) {
        // Check for explicit framework hint
        if (this.frameworkHints[framework]) {
            return this.frameworkHints[framework];
        }
        // Default to generic name with PascalCase
        return this.name.charAt(0).toUpperCase() + this.name.slice(1);
    }
    
    toJSON() {
        return {
            name: this.name,
            displayName: this.displayName,
            description: this.description,
            eventArgsType: this.eventArgsType,
            isRoutedEvent: this.isRoutedEvent,
            frameworkHints: this.frameworkHints
        };
    }
}

/**
 * Common event definitions
 * Framework-agnostic - use frameworkHints for specific event name mappings
 */
export const CommonEvents = {
    click: () => new EventDefinition({
        name: 'click',
        displayName: 'Click',
        description: 'Occurs when the control is clicked',
        eventArgsType: 'RoutedEventArgs',
        isRoutedEvent: true,
        frameworkHints: { avalonia: 'Click', wpf: 'Click', html: 'click' }
    }),
    
    doubleClick: () => new EventDefinition({
        name: 'doubleClick',
        displayName: 'Double Click',
        description: 'Occurs when the control is double-clicked',
        eventArgsType: 'RoutedEventArgs',
        isRoutedEvent: true,
        frameworkHints: { avalonia: 'DoubleTapped', wpf: 'MouseDoubleClick', html: 'dblclick' }
    }),
    
    pointerEnter: () => new EventDefinition({
        name: 'pointerEnter',
        displayName: 'Pointer Enter',
        description: 'Occurs when the pointer enters the control',
        eventArgsType: 'PointerEventArgs',
        isRoutedEvent: true,
        frameworkHints: { avalonia: 'PointerEntered', wpf: 'MouseEnter', html: 'mouseenter' }
    }),
    
    pointerLeave: () => new EventDefinition({
        name: 'pointerLeave',
        displayName: 'Pointer Leave',
        description: 'Occurs when the pointer leaves the control',
        eventArgsType: 'PointerEventArgs',
        isRoutedEvent: true,
        frameworkHints: { avalonia: 'PointerExited', wpf: 'MouseLeave', html: 'mouseleave' }
    }),
    
    gotFocus: () => new EventDefinition({
        name: 'gotFocus',
        displayName: 'Got Focus',
        description: 'Occurs when the control receives focus',
        eventArgsType: 'GotFocusEventArgs',
        isRoutedEvent: true,
        frameworkHints: { avalonia: 'GotFocus', wpf: 'GotFocus', html: 'focus' }
    }),
    
    lostFocus: () => new EventDefinition({
        name: 'lostFocus',
        displayName: 'Lost Focus',
        description: 'Occurs when the control loses focus',
        eventArgsType: 'RoutedEventArgs',
        isRoutedEvent: true,
        frameworkHints: { avalonia: 'LostFocus', wpf: 'LostFocus', html: 'blur' }
    }),
    
    keyDown: () => new EventDefinition({
        name: 'keyDown',
        displayName: 'Key Down',
        description: 'Occurs when a key is pressed',
        eventArgsType: 'KeyEventArgs',
        isRoutedEvent: true,
        frameworkHints: { avalonia: 'KeyDown', wpf: 'KeyDown', html: 'keydown' }
    }),
    
    keyUp: () => new EventDefinition({
        name: 'keyUp',
        displayName: 'Key Up',
        description: 'Occurs when a key is released',
        eventArgsType: 'KeyEventArgs',
        isRoutedEvent: true,
        frameworkHints: { avalonia: 'KeyUp', wpf: 'KeyUp', html: 'keyup' }
    }),
    
    textChanged: () => new EventDefinition({
        name: 'textChanged',
        displayName: 'Text Changed',
        description: 'Occurs when the text changes',
        eventArgsType: 'TextChangedEventArgs',
        frameworkHints: { avalonia: 'TextChanged', wpf: 'TextChanged', html: 'input' }
    }),
    
    selectionChanged: () => new EventDefinition({
        name: 'selectionChanged',
        displayName: 'Selection Changed',
        description: 'Occurs when the selection changes',
        eventArgsType: 'SelectionChangedEventArgs',
        frameworkHints: { avalonia: 'SelectionChanged', wpf: 'SelectionChanged', html: 'change' }
    }),
    
    valueChanged: () => new EventDefinition({
        name: 'valueChanged',
        displayName: 'Value Changed',
        description: 'Occurs when the value changes',
        eventArgsType: 'RangeBaseValueChangedEventArgs',
        frameworkHints: { avalonia: 'ValueChanged', wpf: 'ValueChanged', html: 'change' }
    }),
    
    checked: () => new EventDefinition({
        name: 'checked',
        displayName: 'Checked',
        description: 'Occurs when the control is checked',
        eventArgsType: 'RoutedEventArgs',
        isRoutedEvent: true,
        frameworkHints: { avalonia: 'Checked', wpf: 'Checked', html: 'change' }
    }),
    
    unchecked: () => new EventDefinition({
        name: 'unchecked',
        displayName: 'Unchecked',
        description: 'Occurs when the control is unchecked',
        eventArgsType: 'RoutedEventArgs',
        isRoutedEvent: true,
        frameworkHints: { avalonia: 'Unchecked', wpf: 'Unchecked', html: 'change' }
    })
};

export default {
    PropertyType,
    PropertyCategory,
    PropertyDefinition,
    PropertyStore,
    CommonProperties,
    EventDefinition,
    CommonEvents
};
