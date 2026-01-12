/**
 * Asciistrator - UI Component Base Class
 * 
 * Base class for all framework-agnostic UI components.
 * Provides ASCII rendering, property management, and export capabilities.
 * Components are designed to be mapped to various UI frameworks via FrameworkMappings.
 * 
 * @version 1.0.0
 */

import { EventEmitter } from '../utils/events.js';
import { uuid, deepClone } from '../utils/helpers.js';
import { 
    PropertyType, 
    PropertyCategory, 
    PropertyDefinition, 
    PropertyStore,
    CommonProperties,
    EventDefinition,
    CommonEvents
} from './PropertySystem.js';

// ==========================================
// CONTENT MODEL TYPES
// ==========================================

/**
 * Content model types for components
 */
export const ContentModel = {
    None: 'none',           // No content allowed
    Single: 'single',       // Single child content
    Multiple: 'multiple',   // Multiple children
    Text: 'text',           // Text content only
    Items: 'items'          // ItemsSource collection
};

// ==========================================
// UI COMPONENT CATEGORY
// ==========================================

/**
 * UI component categories
 */
export const UICategory = {
    Button: 'Buttons',
    Input: 'Input Controls',
    Selection: 'Selection Controls',
    Range: 'Range Controls',
    DateTime: 'Date & Time',
    Container: 'Containers',
    Layout: 'Layout Panels',
    Navigation: 'Navigation',
    Indicator: 'Indicators',
    DataDisplay: 'Data Display',
    Menu: 'Menus',
    Dialog: 'Dialogs',
    Primitives: 'Primitives',
    Misc: 'Miscellaneous'
};

// ==========================================
// ASCII BORDER STYLES
// ==========================================

/**
 * ASCII border character sets
 */
export const BorderStyle = {
    None: {
        topLeft: ' ', top: ' ', topRight: ' ',
        left: ' ', right: ' ',
        bottomLeft: ' ', bottom: ' ', bottomRight: ' '
    },
    Single: {
        topLeft: '┌', top: '─', topRight: '┐',
        left: '│', right: '│',
        bottomLeft: '└', bottom: '─', bottomRight: '┘'
    },
    Double: {
        topLeft: '╔', top: '═', topRight: '╗',
        left: '║', right: '║',
        bottomLeft: '╚', bottom: '═', bottomRight: '╝'
    },
    Rounded: {
        topLeft: '╭', top: '─', topRight: '╮',
        left: '│', right: '│',
        bottomLeft: '╰', bottom: '─', bottomRight: '╯'
    },
    Heavy: {
        topLeft: '┏', top: '━', topRight: '┓',
        left: '┃', right: '┃',
        bottomLeft: '┗', bottom: '━', bottomRight: '┛'
    },
    Dashed: {
        topLeft: '┌', top: '┄', topRight: '┐',
        left: '┆', right: '┆',
        bottomLeft: '└', bottom: '┄', bottomRight: '┘'
    }
};

// ==========================================
// ASCII RENDERER
// ==========================================

/**
 * ASCII rendering utilities
 */
export class ASCIIRenderer {
    /**
     * Create an empty buffer
     * @param {number} width - Buffer width
     * @param {number} height - Buffer height
     * @param {string} fillChar - Fill character
     * @returns {string[][]} - 2D character array
     */
    static createBuffer(width, height, fillChar = ' ') {
        const buffer = [];
        for (let y = 0; y < height; y++) {
            buffer[y] = new Array(width).fill(fillChar);
        }
        return buffer;
    }
    
    /**
     * Convert buffer to string
     * @param {string[][]} buffer - 2D character array
     * @returns {string}
     */
    static bufferToString(buffer) {
        return buffer.map(row => row.join('')).join('\n');
    }
    
    /**
     * Draw text on buffer
     * @param {string[][]} buffer - Target buffer
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text to draw
     * @param {number} maxWidth - Maximum width (optional)
     */
    static drawText(buffer, x, y, text, maxWidth = null) {
        if (y < 0 || y >= buffer.length) return;
        
        const row = buffer[y];
        const chars = Array.from(text);
        const width = maxWidth || chars.length;
        
        for (let i = 0; i < width && i < chars.length; i++) {
            const targetX = x + i;
            if (targetX >= 0 && targetX < row.length) {
                row[targetX] = chars[i];
            }
        }
    }
    
    /**
     * Draw centered text on buffer
     * @param {string[][]} buffer - Target buffer
     * @param {number} y - Y position
     * @param {string} text - Text to draw
     * @param {number} startX - Start X (default 0)
     * @param {number} width - Area width (default buffer width)
     */
    static drawCenteredText(buffer, y, text, startX = 0, width = null) {
        if (y < 0 || y >= buffer.length) return;
        
        width = width || buffer[0].length;
        const textWidth = Array.from(text).length;
        const x = startX + Math.floor((width - textWidth) / 2);
        
        this.drawText(buffer, x, y, text);
    }
    
    /**
     * Draw a box on buffer
     * @param {string[][]} buffer - Target buffer
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Box width
     * @param {number} height - Box height
     * @param {Object} style - Border style
     */
    static drawBox(buffer, x, y, width, height, style = BorderStyle.Single) {
        if (width < 2 || height < 2) return;
        
        // Top border
        if (y >= 0 && y < buffer.length) {
            if (x >= 0 && x < buffer[0].length) buffer[y][x] = style.topLeft;
            for (let i = 1; i < width - 1; i++) {
                if (x + i >= 0 && x + i < buffer[0].length) buffer[y][x + i] = style.top;
            }
            if (x + width - 1 >= 0 && x + width - 1 < buffer[0].length) {
                buffer[y][x + width - 1] = style.topRight;
            }
        }
        
        // Side borders
        for (let row = 1; row < height - 1; row++) {
            const targetY = y + row;
            if (targetY >= 0 && targetY < buffer.length) {
                if (x >= 0 && x < buffer[0].length) buffer[targetY][x] = style.left;
                if (x + width - 1 >= 0 && x + width - 1 < buffer[0].length) {
                    buffer[targetY][x + width - 1] = style.right;
                }
            }
        }
        
        // Bottom border
        const bottomY = y + height - 1;
        if (bottomY >= 0 && bottomY < buffer.length) {
            if (x >= 0 && x < buffer[0].length) buffer[bottomY][x] = style.bottomLeft;
            for (let i = 1; i < width - 1; i++) {
                if (x + i >= 0 && x + i < buffer[0].length) buffer[bottomY][x + i] = style.bottom;
            }
            if (x + width - 1 >= 0 && x + width - 1 < buffer[0].length) {
                buffer[bottomY][x + width - 1] = style.bottomRight;
            }
        }
    }
    
    /**
     * Fill a rectangular area
     * @param {string[][]} buffer - Target buffer
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Fill width
     * @param {number} height - Fill height
     * @param {string} char - Fill character
     */
    static fillRect(buffer, x, y, width, height, char = ' ') {
        for (let row = 0; row < height; row++) {
            const targetY = y + row;
            if (targetY >= 0 && targetY < buffer.length) {
                for (let col = 0; col < width; col++) {
                    const targetX = x + col;
                    if (targetX >= 0 && targetX < buffer[0].length) {
                        buffer[targetY][targetX] = char;
                    }
                }
            }
        }
    }
    
    /**
     * Draw a horizontal line
     * @param {string[][]} buffer - Target buffer
     * @param {number} x - Start X
     * @param {number} y - Y position
     * @param {number} length - Line length
     * @param {string} char - Line character
     */
    static drawHorizontalLine(buffer, x, y, length, char = '─') {
        if (y < 0 || y >= buffer.length) return;
        
        for (let i = 0; i < length; i++) {
            const targetX = x + i;
            if (targetX >= 0 && targetX < buffer[0].length) {
                buffer[y][targetX] = char;
            }
        }
    }
    
    /**
     * Draw a vertical line
     * @param {string[][]} buffer - Target buffer
     * @param {number} x - X position
     * @param {number} y - Start Y
     * @param {number} length - Line length
     * @param {string} char - Line character
     */
    static drawVerticalLine(buffer, x, y, length, char = '│') {
        if (x < 0 || x >= buffer[0].length) return;
        
        for (let i = 0; i < length; i++) {
            const targetY = y + i;
            if (targetY >= 0 && targetY < buffer.length) {
                buffer[targetY][x] = char;
            }
        }
    }
    
    /**
     * Draw a progress bar
     * @param {string[][]} buffer - Target buffer
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Bar width
     * @param {number} value - Progress value (0-1)
     * @param {string} fillChar - Fill character
     * @param {string} emptyChar - Empty character
     */
    static drawProgressBar(buffer, x, y, width, value, fillChar = '█', emptyChar = '░') {
        if (y < 0 || y >= buffer.length) return;
        
        const filled = Math.round(width * Math.max(0, Math.min(1, value)));
        
        for (let i = 0; i < width; i++) {
            const targetX = x + i;
            if (targetX >= 0 && targetX < buffer[0].length) {
                buffer[y][targetX] = i < filled ? fillChar : emptyChar;
            }
        }
    }
    
    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxWidth - Maximum width
     * @returns {string}
     */
    static truncateText(text, maxWidth) {
        if (text.length <= maxWidth) return text;
        if (maxWidth <= 3) return text.substring(0, maxWidth);
        return text.substring(0, maxWidth - 3) + '...';
    }
    
    /**
     * Pad text to width
     * @param {string} text - Text to pad
     * @param {number} width - Target width
     * @param {string} align - Alignment ('left', 'center', 'right')
     * @param {string} padChar - Padding character
     * @returns {string}
     */
    static padText(text, width, align = 'left', padChar = ' ') {
        if (text.length >= width) return text.substring(0, width);
        
        const padding = width - text.length;
        
        switch (align) {
            case 'center':
                const left = Math.floor(padding / 2);
                const right = padding - left;
                return padChar.repeat(left) + text + padChar.repeat(right);
            case 'right':
                return padChar.repeat(padding) + text;
            default:
                return text + padChar.repeat(padding);
        }
    }
}

// ==========================================
// BASE UI COMPONENT
// ==========================================

/**
 * Base class for all UI components
 */
export class UIComponent extends EventEmitter {
    /**
     * Create a new UI component
     * @param {Object} options - Component options
     */
    constructor(options = {}) {
        super();
        
        // Identity
        this.id = options.id || uuid();
        this.componentType = this.constructor.componentType || 'UIComponent';
        
        // Initialize property schema
        this._propertySchema = new Map();
        this._initializeProperties();
        
        // Property store
        this.properties = new PropertyStore(this._propertySchema);
        
        // Apply initial property values
        if (options.properties) {
            this.properties.setAll(options.properties);
        }
        
        // Apply direct property options
        for (const [key, value] of Object.entries(options)) {
            if (this._propertySchema.has(key)) {
                this.properties.set(key, value);
            }
        }
        
        // Children (for containers)
        this.children = options.children || [];
        
        // Parent reference
        this.parent = null;
        
        // Visual state
        this._visualState = 'normal';
        
        // Render cache
        this._renderCache = null;
        this._renderCacheValid = false;
        
        // Listen for property changes to invalidate cache
        this._setupPropertyListeners();
    }
    
    // ==========================================
    // STATIC METADATA
    // ==========================================
    
    /**
     * Component type identifier
     */
    static get componentType() {
        return 'UIComponent';
    }
    
    /**
     * Display name for the component
     */
    static get displayName() {
        return 'UI Component';
    }
    
    /**
     * Component description
     */
    static get description() {
        return 'Base UI component';
    }
    
    /**
     * Component category
     */
    static get category() {
        return UICategory.Misc;
    }
    
    /**
     * Component icon (ASCII character)
     */
    static get icon() {
        return '▢';
    }
    
    /**
     * Framework-agnostic control type hint
     * Used by FrameworkMappings to find the target control
     * @deprecated Use componentType instead - framework mappings handle the rest
     */
    static get controlType() {
        return this.componentType;
    }
    
    /**
     * Content model
     */
    static get contentModel() {
        return ContentModel.None;
    }
    
    /**
     * Default width for ASCII rendering
     */
    static get defaultWidth() {
        return 12;
    }
    
    /**
     * Default height for ASCII rendering
     */
    static get defaultHeight() {
        return 3;
    }
    
    /**
     * Property definitions for this component type
     */
    static get propertyDefinitions() {
        return [
            CommonProperties.name(),
            CommonProperties.width(),
            CommonProperties.height(),
            CommonProperties.margin(),
            CommonProperties.padding(),
            CommonProperties.horizontalAlignment(),
            CommonProperties.verticalAlignment(),
            CommonProperties.isEnabled(),
            CommonProperties.isVisible(),
            CommonProperties.opacity(),
            CommonProperties.toolTip(),
            CommonProperties.gridRow(),
            CommonProperties.gridColumn(),
            CommonProperties.gridRowSpan(),
            CommonProperties.gridColumnSpan()
        ];
    }
    
    /**
     * Event definitions for this component type
     */
    static get eventDefinitions() {
        return [
            CommonEvents.pointerEnter(),
            CommonEvents.pointerLeave(),
            CommonEvents.gotFocus(),
            CommonEvents.lostFocus()
        ];
    }
    
    /**
     * Template parts (for templated controls)
     */
    static get templateParts() {
        return [];
    }
    
    /**
     * Visual states
     */
    static get visualStates() {
        return ['normal', 'disabled'];
    }
    
    /**
     * Tags for search
     */
    static get tags() {
        return [];
    }
    
    // ==========================================
    // PROPERTY MANAGEMENT
    // ==========================================
    
    /**
     * Initialize property schema
     * @protected
     */
    _initializeProperties() {
        const definitions = this.constructor.propertyDefinitions;
        for (const def of definitions) {
            this._propertySchema.set(def.name, def);
        }
    }
    
    /**
     * Setup property change listeners
     * @private
     */
    _setupPropertyListeners() {
        for (const name of this._propertySchema.keys()) {
            this.properties.addListener(name, () => {
                this._invalidateRenderCache();
                this.emit('propertyChanged', { name, value: this.properties.get(name) });
            });
        }
    }
    
    /**
     * Get a property value
     * @param {string} name - Property name
     * @returns {*}
     */
    get(name) {
        return this.properties.get(name);
    }
    
    /**
     * Set a property value
     * @param {string} name - Property name
     * @param {*} value - Value to set
     * @returns {this}
     */
    set(name, value) {
        this.properties.set(name, value);
        this._invalidateRenderCache();
        return this;
    }
    
    /**
     * Set a binding expression
     * @param {string} name - Property name
     * @param {string} binding - Binding expression
     * @returns {this}
     */
    bind(name, binding) {
        this.properties.setBinding(name, binding);
        return this;
    }
    
    // ==========================================
    // VISUAL STATE
    // ==========================================
    
    /**
     * Get current visual state
     */
    get visualState() {
        return this._visualState;
    }
    
    /**
     * Set visual state
     */
    set visualState(state) {
        if (this.constructor.visualStates.includes(state)) {
            this._visualState = state;
            this._invalidateRenderCache();
            this.emit('visualStateChanged', { state });
        }
    }
    
    // ==========================================
    // CHILDREN MANAGEMENT
    // ==========================================
    
    /**
     * Add a child component
     * @param {UIComponent} child - Child to add
     * @returns {this}
     */
    addChild(child) {
        if (this.constructor.contentModel === ContentModel.None) {
            throw new Error(`${this.componentType} does not support children`);
        }
        
        if (this.constructor.contentModel === ContentModel.Single && this.children.length > 0) {
            throw new Error(`${this.componentType} only supports a single child`);
        }
        
        child.parent = this;
        this.children.push(child);
        this._invalidateRenderCache();
        this.emit('childAdded', { child });
        return this;
    }
    
    /**
     * Remove a child component
     * @param {UIComponent|string} child - Child or child ID to remove
     * @returns {UIComponent|null}
     */
    removeChild(child) {
        const id = typeof child === 'string' ? child : child.id;
        const index = this.children.findIndex(c => c.id === id);
        
        if (index !== -1) {
            const removed = this.children.splice(index, 1)[0];
            removed.parent = null;
            this._invalidateRenderCache();
            this.emit('childRemoved', { child: removed });
            return removed;
        }
        
        return null;
    }
    
    /**
     * Get child by index
     * @param {number} index - Child index
     * @returns {UIComponent|undefined}
     */
    getChildAt(index) {
        return this.children[index];
    }
    
    /**
     * Get child by ID
     * @param {string} id - Child ID
     * @returns {UIComponent|undefined}
     */
    getChildById(id) {
        return this.children.find(c => c.id === id);
    }
    
    /**
     * Clear all children
     * @returns {this}
     */
    clearChildren() {
        for (const child of this.children) {
            child.parent = null;
        }
        this.children = [];
        this._invalidateRenderCache();
        this.emit('childrenCleared');
        return this;
    }
    
    // ==========================================
    // ASCII RENDERING
    // ==========================================
    
    /**
     * Invalidate render cache
     * @protected
     */
    _invalidateRenderCache() {
        this._renderCacheValid = false;
        this._renderCache = null;
        
        // Invalidate parent cache too
        if (this.parent) {
            this.parent._invalidateRenderCache();
        }
    }
    
    /**
     * Get render width
     * @returns {number}
     */
    getRenderWidth() {
        return this.get('width') || this.constructor.defaultWidth;
    }
    
    /**
     * Get render height
     * @returns {number}
     */
    getRenderHeight() {
        return this.get('height') || this.constructor.defaultHeight;
    }
    
    /**
     * Render the component to ASCII
     * @param {Object} options - Render options
     * @returns {string}
     */
    render(options = {}) {
        if (this._renderCacheValid && this._renderCache && !options.forceRender) {
            return this._renderCache;
        }
        
        const width = options.width || this.getRenderWidth();
        const height = options.height || this.getRenderHeight();
        
        const buffer = ASCIIRenderer.createBuffer(width, height);
        this._renderToBuffer(buffer, 0, 0, width, height, options);
        
        this._renderCache = ASCIIRenderer.bufferToString(buffer);
        this._renderCacheValid = true;
        
        return this._renderCache;
    }
    
    /**
     * Render to a buffer (override in subclasses)
     * @param {string[][]} buffer - Target buffer
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Available width
     * @param {number} height - Available height
     * @param {Object} options - Render options
     * @protected
     */
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        // Default implementation: draw a simple box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, BorderStyle.Single);
    }
    
    /**
     * Generate a preview string
     * @param {number} maxWidth - Maximum preview width
     * @param {number} maxHeight - Maximum preview height
     * @returns {string}
     */
    generatePreview(maxWidth = 20, maxHeight = 8) {
        const width = Math.min(this.getRenderWidth(), maxWidth);
        const height = Math.min(this.getRenderHeight(), maxHeight);
        
        return this.render({ width, height, preview: true });
    }
    
    // ==========================================
    // SERIALIZATION
    // ==========================================
    
    /**
     * Convert to JSON
     * @returns {Object}
     */
    toJSON() {
        const json = {
            id: this.id,
            componentType: this.componentType,
            properties: {},
            bindings: {}
        };
        
        // Save property values
        for (const [name, def] of this._propertySchema) {
            const value = this.properties.get(name);
            if (value !== def.defaultValue) {
                json.properties[name] = value;
            }
            
            const binding = this.properties.getBinding(name);
            if (binding) {
                json.bindings[name] = binding;
            }
        }
        
        // Save children
        if (this.children.length > 0) {
            json.children = this.children.map(c => c.toJSON());
        }
        
        return json;
    }
    
    /**
     * Create from JSON
     * @param {Object} json - JSON data
     * @param {Map} componentRegistry - Registry of component types
     * @returns {UIComponent}
     */
    static fromJSON(json, componentRegistry) {
        const ComponentClass = componentRegistry.get(json.componentType) || UIComponent;
        
        const component = new ComponentClass({
            id: json.id,
            properties: json.properties
        });
        
        // Restore bindings
        if (json.bindings) {
            for (const [name, binding] of Object.entries(json.bindings)) {
                component.bind(name, binding);
            }
        }
        
        // Restore children
        if (json.children) {
            for (const childJson of json.children) {
                const child = UIComponent.fromJSON(childJson, componentRegistry);
                component.addChild(child);
            }
        }
        
        return component;
    }
    
    // ==========================================
    // COMPONENT LIBRARY INTEGRATION
    // ==========================================
    
    /**
     * Convert to Component Library component definition
     * @returns {Object}
     */
    toComponentDefinition() {
        return {
            id: `ui-${this.componentType.toLowerCase()}`,
            name: this.constructor.displayName,
            description: this.constructor.description,
            category: this.constructor.category,
            icon: this.constructor.icon,
            tags: this.constructor.tags,
            isBuiltIn: true,
            width: this.constructor.defaultWidth,
            height: this.constructor.defaultHeight,
            objects: this._toSceneObjects(),
            preview: this.generatePreview(),
            
            // Component metadata
            componentType: this.constructor.componentType,
            contentModel: this.constructor.contentModel,
            properties: this.constructor.propertyDefinitions.map(p => p.toJSON()),
            events: this.constructor.eventDefinitions.map(e => e.toJSON())
        };
    }
    
    /**
     * Convert to scene objects (for ComponentLibrary integration)
     * @returns {Object[]}
     * @protected
     */
    _toSceneObjects() {
        // Default: return a text object with the preview
        return [{
            type: 'text',
            x: 0,
            y: 0,
            text: this.generatePreview()
        }];
    }
    
    // ==========================================
    // CLONING
    // ==========================================
    
    /**
     * Clone this component
     * @param {boolean} deep - Deep clone children
     * @returns {UIComponent}
     */
    clone(deep = true) {
        const json = this.toJSON();
        json.id = uuid(); // New ID
        
        if (deep && json.children) {
            json.children = json.children.map(c => ({ ...c, id: uuid() }));
        }
        
        // This requires componentRegistry, simplified version:
        const clone = new this.constructor({
            properties: json.properties
        });
        
        // Clone bindings
        for (const [name, binding] of Object.entries(json.bindings || {})) {
            clone.bind(name, binding);
        }
        
        return clone;
    }
}

// ==========================================
// EXPORTS
// ==========================================

// ContentModel, UICategory, BorderStyle, ASCIIRenderer, and UIComponent 
// are already exported at their definitions above

export default UIComponent;
