/**
 * Asciistrator - Component Library System
 * 
 * Provides reusable component management similar to Visio/Figma.
 * Supports custom components, built-in libraries, drag-and-drop, and import/export.
 * 
 * @version 1.0.0
 */

import { EventEmitter } from '../utils/events.js';
import { uuid, deepClone } from '../utils/helpers.js';

// ==========================================
// COMPONENT CLASS
// ==========================================

/**
 * A reusable component that can be dragged onto the canvas
 */
export class Component {
    /**
     * Create a new component
     * @param {Object} options - Component options
     * @param {string} options.name - Display name
     * @param {string} [options.description] - Description
     * @param {string} [options.category] - Category within library
     * @param {string} [options.icon] - Icon character or emoji
     * @param {string[]} [options.tags] - Searchable tags
     * @param {Object[]} options.objects - Array of scene object definitions
     * @param {string} [options.preview] - ASCII preview string
     */
    constructor(options = {}) {
        this.id = options.id || uuid();
        this.name = options.name || 'Untitled Component';
        this.description = options.description || '';
        this.category = options.category || 'General';
        this.icon = options.icon || '□';
        this.tags = options.tags || [];
        this.objects = options.objects || [];
        this.preview = options.preview || '';
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.createdAt = options.createdAt || Date.now();
        this.modifiedAt = options.modifiedAt || Date.now();
        this.isBuiltIn = options.isBuiltIn || false;
        
        // Calculate bounds if not provided
        if (!this.width || !this.height) {
            this._calculateBounds();
        }
    }
    
    /**
     * Calculate component bounds from objects
     */
    _calculateBounds() {
        if (this.objects.length === 0) return;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const obj of this.objects) {
            const bounds = this._getObjectBounds(obj);
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        }
        
        this.width = maxX - minX;
        this.height = maxY - minY;
        
        // Normalize objects to origin
        for (const obj of this.objects) {
            if (obj.x !== undefined) obj.x -= minX;
            if (obj.y !== undefined) obj.y -= minY;
            if (obj.x1 !== undefined) {
                obj.x1 -= minX;
                obj.x2 -= minX;
                obj.y1 -= minY;
                obj.y2 -= minY;
            }
            if (obj.cx !== undefined) {
                obj.cx -= minX;
                obj.cy -= minY;
            }
        }
    }
    
    /**
     * Get bounds of an object definition
     */
    _getObjectBounds(obj) {
        switch (obj.type) {
            case 'rectangle':
            case 'text':
            case 'ascii-text':
            case 'table':
            case 'chart':
                return { x: obj.x || 0, y: obj.y || 0, width: obj.width || 10, height: obj.height || 5 };
            case 'ellipse':
                return { 
                    x: obj.x || 0, 
                    y: obj.y || 0, 
                    width: (obj.radiusX || 5) * 2, 
                    height: (obj.radiusY || 3) * 2 
                };
            case 'line':
                return {
                    x: Math.min(obj.x1 || 0, obj.x2 || 0),
                    y: Math.min(obj.y1 || 0, obj.y2 || 0),
                    width: Math.abs((obj.x2 || 0) - (obj.x1 || 0)) + 1,
                    height: Math.abs((obj.y2 || 0) - (obj.y1 || 0)) + 1
                };
            case 'polygon':
            case 'star':
                const r = obj.radius || obj.outerRadius || 5;
                return { x: (obj.cx || 0) - r, y: (obj.cy || 0) - r, width: r * 2, height: r * 2 };
            default:
                // Flowchart shapes and others
                return { x: obj.x || 0, y: obj.y || 0, width: obj.width || 14, height: obj.height || 5 };
        }
    }
    
    /**
     * Generate ASCII preview
     */
    generatePreview(maxWidth = 20, maxHeight = 8) {
        // Create a simple ASCII preview from objects
        const buffer = [];
        for (let y = 0; y < maxHeight; y++) {
            buffer[y] = new Array(maxWidth).fill(' ');
        }
        
        // Simple preview - just show object outlines
        for (const obj of this.objects) {
            const bounds = this._getObjectBounds(obj);
            const scaleX = this.width > maxWidth ? maxWidth / this.width : 1;
            const scaleY = this.height > maxHeight ? maxHeight / this.height : 1;
            
            const x = Math.floor(bounds.x * scaleX);
            const y = Math.floor(bounds.y * scaleY);
            const w = Math.max(1, Math.floor(bounds.width * scaleX));
            const h = Math.max(1, Math.floor(bounds.height * scaleY));
            
            // Draw simplified shape
            for (let dy = 0; dy < h && (y + dy) < maxHeight; dy++) {
                for (let dx = 0; dx < w && (x + dx) < maxWidth; dx++) {
                    if (x + dx >= 0 && y + dy >= 0) {
                        if (dy === 0 || dy === h - 1 || dx === 0 || dx === w - 1) {
                            buffer[y + dy][x + dx] = obj.type === 'ellipse' ? '○' : '□';
                        }
                    }
                }
            }
        }
        
        this.preview = buffer.map(row => row.join('')).join('\n');
        return this.preview;
    }
    
    /**
     * Clone this component's objects for instantiation
     * @param {number} x - Target X position
     * @param {number} y - Target Y position
     * @returns {Object[]} - Cloned object definitions positioned at x,y
     */
    instantiate(x = 0, y = 0) {
        return this.objects.map(obj => {
            const clone = deepClone(obj);
            clone.id = uuid();
            
            // Offset to target position
            if (clone.x !== undefined) clone.x += x;
            if (clone.y !== undefined) clone.y += y;
            if (clone.x1 !== undefined) {
                clone.x1 += x;
                clone.x2 += x;
                clone.y1 += y;
                clone.y2 += y;
            }
            if (clone.cx !== undefined) {
                clone.cx += x;
                clone.cy += y;
            }
            
            return clone;
        });
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            category: this.category,
            icon: this.icon,
            tags: this.tags,
            objects: this.objects,
            preview: this.preview,
            width: this.width,
            height: this.height,
            createdAt: this.createdAt,
            modifiedAt: this.modifiedAt,
            isBuiltIn: this.isBuiltIn
        };
    }
    
    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new Component(json);
    }
}

// ==========================================
// COMPONENT LIBRARY CLASS
// ==========================================

/**
 * A collection of components organized by categories
 */
export class ComponentLibrary {
    /**
     * Create a new component library
     * @param {Object} options - Library options
     * @param {string} options.name - Library name
     * @param {string} [options.description] - Library description
     * @param {string} [options.icon] - Library icon
     * @param {boolean} [options.isBuiltIn] - Whether this is a built-in library
     */
    constructor(options = {}) {
        this.id = options.id || uuid();
        this.name = options.name || 'Untitled Library';
        this.description = options.description || '';
        this.icon = options.icon || '📁';
        this.isBuiltIn = options.isBuiltIn || false;
        this.isExpanded = options.isExpanded !== false;
        this.components = new Map();
        this.categories = new Set(['General']);
        this.createdAt = options.createdAt || Date.now();
        this.modifiedAt = options.modifiedAt || Date.now();
    }
    
    /**
     * Add a component to the library
     */
    addComponent(component) {
        if (!(component instanceof Component)) {
            component = new Component(component);
        }
        this.components.set(component.id, component);
        this.categories.add(component.category);
        this.modifiedAt = Date.now();
        return component;
    }
    
    /**
     * Remove a component from the library
     */
    removeComponent(componentId) {
        const deleted = this.components.delete(componentId);
        if (deleted) {
            this.modifiedAt = Date.now();
        }
        return deleted;
    }
    
    /**
     * Get a component by ID
     */
    getComponent(componentId) {
        return this.components.get(componentId);
    }
    
    /**
     * Get all components
     */
    getAllComponents() {
        return Array.from(this.components.values());
    }
    
    /**
     * Get components by category
     */
    getComponentsByCategory(category) {
        return this.getAllComponents().filter(c => c.category === category);
    }
    
    /**
     * Search components by name or tags
     */
    searchComponents(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllComponents().filter(c => 
            c.name.toLowerCase().includes(lowerQuery) ||
            c.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
            c.description.toLowerCase().includes(lowerQuery)
        );
    }
    
    /**
     * Get all categories
     */
    getCategories() {
        return Array.from(this.categories).sort();
    }
    
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            icon: this.icon,
            isBuiltIn: this.isBuiltIn,
            isExpanded: this.isExpanded,
            components: this.getAllComponents().map(c => c.toJSON()),
            createdAt: this.createdAt,
            modifiedAt: this.modifiedAt
        };
    }
    
    /**
     * Create from JSON
     */
    static fromJSON(json) {
        const library = new ComponentLibrary(json);
        if (json.components) {
            for (const compJson of json.components) {
                library.addComponent(Component.fromJSON(compJson));
            }
        }
        return library;
    }
}

// ==========================================
// COMPONENT LIBRARY MANAGER
// ==========================================

/**
 * Manages multiple component libraries
 */
export class ComponentLibraryManager extends EventEmitter {
    constructor() {
        super();
        this.libraries = new Map();
        this.activeLibraryId = null;
        this._storageKey = 'asciistrator_component_libraries';
    }
    
    /**
     * Initialize with built-in libraries
     */
    init() {
        // Load user libraries from storage
        this._loadFromStorage();
        
        // Add built-in libraries
        this._addBuiltInLibraries();
        
        this.emit('initialized');
    }
    
    /**
     * Add built-in component libraries
     */
    _addBuiltInLibraries() {
        // Flowchart library
        const flowchartLib = new ComponentLibrary({
            id: 'builtin-flowchart',
            name: 'Flowchart',
            description: 'Standard flowchart shapes and symbols',
            icon: '◇',
            isBuiltIn: true
        });
        
        flowchartLib.addComponent(new Component({
            id: 'fc-terminal',
            name: 'Terminal',
            description: 'Start/End terminal shape',
            category: 'Basic Shapes',
            icon: '⬭',
            tags: ['start', 'end', 'terminal', 'begin', 'finish'],
            isBuiltIn: true,
            width: 14,
            height: 3,
            objects: [{
                type: 'terminal-shape',
                x: 0, y: 0, width: 14, height: 3,
                label: 'Start',
                borderStyle: 'rounded'
            }],
            preview: '╭──────────╮\n│  Start   │\n╰──────────╯'
        }));
        
        flowchartLib.addComponent(new Component({
            id: 'fc-process',
            name: 'Process',
            description: 'Process/Action rectangle',
            category: 'Basic Shapes',
            icon: '▢',
            tags: ['process', 'action', 'step', 'task'],
            isBuiltIn: true,
            width: 16,
            height: 5,
            objects: [{
                type: 'process-shape',
                x: 0, y: 0, width: 16, height: 5,
                label: 'Process',
                borderStyle: 'single'
            }],
            preview: '┌────────────┐\n│            │\n│  Process   │\n│            │\n└────────────┘'
        }));
        
        flowchartLib.addComponent(new Component({
            id: 'fc-decision',
            name: 'Decision',
            description: 'Decision diamond shape',
            category: 'Basic Shapes',
            icon: '◇',
            tags: ['decision', 'condition', 'if', 'branch', 'diamond'],
            isBuiltIn: true,
            width: 17,
            height: 9,
            objects: [{
                type: 'decision-shape',
                x: 0, y: 0, width: 17, height: 9,
                label: 'Yes/No?'
            }],
            preview: '       ╱╲\n      ╱  ╲\n     ╱    ╲\n    ◇ Y/N? ◇\n     ╲    ╱\n      ╲  ╱\n       ╲╱'
        }));
        
        flowchartLib.addComponent(new Component({
            id: 'fc-io',
            name: 'Input/Output',
            description: 'Data input/output parallelogram',
            category: 'Basic Shapes',
            icon: '▱',
            tags: ['input', 'output', 'data', 'io'],
            isBuiltIn: true,
            width: 14,
            height: 5,
            objects: [{
                type: 'io-shape',
                x: 0, y: 0, width: 14, height: 5,
                label: 'I/O'
            }],
            preview: '  ╔═══════════╗\n  ║           ║\n  ║    I/O    ║\n  ║           ║\n  ╚═══════════╝'
        }));
        
        flowchartLib.addComponent(new Component({
            id: 'fc-document',
            name: 'Document',
            description: 'Document shape',
            category: 'Basic Shapes',
            icon: '📄',
            tags: ['document', 'file', 'report', 'paper'],
            isBuiltIn: true,
            width: 16,
            height: 6,
            objects: [{
                type: 'document-shape',
                x: 0, y: 0, width: 16, height: 6,
                label: 'Document'
            }],
            preview: '┌────────────┐\n│            │\n│  Document  │\n│   ═════    │\n└────────────┘'
        }));
        
        flowchartLib.addComponent(new Component({
            id: 'fc-database',
            name: 'Database',
            description: 'Database cylinder',
            category: 'Basic Shapes',
            icon: '🗄',
            tags: ['database', 'storage', 'data', 'db', 'cylinder'],
            isBuiltIn: true,
            width: 10,
            height: 6,
            objects: [{
                type: 'database-shape',
                x: 0, y: 0, width: 10, height: 6,
                label: 'DB'
            }],
            preview: '╭────────╮\n│        │\n│   DB   │\n│        │\n╰────────╯'
        }));
        
        flowchartLib.addComponent(new Component({
            id: 'fc-subprocess',
            name: 'Subprocess',
            description: 'Predefined process/subprocess',
            category: 'Basic Shapes',
            icon: '⧈',
            tags: ['subprocess', 'predefined', 'function', 'call'],
            isBuiltIn: true,
            width: 16,
            height: 6,
            objects: [{
                type: 'subprocess-shape',
                x: 0, y: 0, width: 16, height: 6,
                label: 'Subprocess'
            }],
            preview: '┌────────────┐\n│ ┌────────┐ │\n│ │Subproc │ │\n│ └────────┘ │\n└────────────┘'
        }));
        
        flowchartLib.addComponent(new Component({
            id: 'fc-connector',
            name: 'Connector',
            description: 'On-page connector circle',
            category: 'Connectors',
            icon: '○',
            tags: ['connector', 'reference', 'link'],
            isBuiltIn: true,
            width: 3,
            height: 3,
            objects: [{
                type: 'connector-circle',
                x: 0, y: 0,
                label: 'A'
            }],
            preview: '╭─╮\n│A│\n╰─╯'
        }));
        
        this.addLibrary(flowchartLib);
        
        // Basic Shapes library
        const shapesLib = new ComponentLibrary({
            id: 'builtin-shapes',
            name: 'Basic Shapes',
            description: 'Common geometric shapes',
            icon: '○',
            isBuiltIn: true
        });
        
        shapesLib.addComponent(new Component({
            id: 'shape-rect',
            name: 'Rectangle',
            category: 'Geometry',
            icon: '▢',
            tags: ['rectangle', 'box', 'square'],
            isBuiltIn: true,
            width: 12,
            height: 6,
            objects: [{
                type: 'rectangle',
                x: 0, y: 0, width: 12, height: 6,
                borderStyle: 'single'
            }],
            preview: '┌──────────┐\n│          │\n│          │\n│          │\n│          │\n└──────────┘'
        }));
        
        shapesLib.addComponent(new Component({
            id: 'shape-rounded-rect',
            name: 'Rounded Rectangle',
            category: 'Geometry',
            icon: '▢',
            tags: ['rectangle', 'rounded', 'box'],
            isBuiltIn: true,
            width: 12,
            height: 6,
            objects: [{
                type: 'rectangle',
                x: 0, y: 0, width: 12, height: 6,
                borderStyle: 'rounded'
            }],
            preview: '╭──────────╮\n│          │\n│          │\n│          │\n│          │\n╰──────────╯'
        }));
        
        shapesLib.addComponent(new Component({
            id: 'shape-double-rect',
            name: 'Double Border Rectangle',
            category: 'Geometry',
            icon: '▢',
            tags: ['rectangle', 'double', 'border'],
            isBuiltIn: true,
            width: 12,
            height: 6,
            objects: [{
                type: 'rectangle',
                x: 0, y: 0, width: 12, height: 6,
                borderStyle: 'double'
            }],
            preview: '╔══════════╗\n║          ║\n║          ║\n║          ║\n║          ║\n╚══════════╝'
        }));
        
        shapesLib.addComponent(new Component({
            id: 'shape-ellipse',
            name: 'Ellipse',
            category: 'Geometry',
            icon: '○',
            tags: ['ellipse', 'oval', 'circle'],
            isBuiltIn: true,
            width: 12,
            height: 6,
            objects: [{
                type: 'ellipse',
                x: 0, y: 0, radiusX: 6, radiusY: 3
            }],
            preview: '   ╭────╮\n  ╱      ╲\n │        │\n  ╲      ╱\n   ╰────╯'
        }));
        
        shapesLib.addComponent(new Component({
            id: 'shape-diamond',
            name: 'Diamond',
            category: 'Geometry',
            icon: '◇',
            tags: ['diamond', 'rhombus'],
            isBuiltIn: true,
            width: 11,
            height: 7,
            objects: [{
                type: 'polygon',
                cx: 5, cy: 3, radius: 5, sides: 4
            }],
            preview: '     ╱╲\n    ╱  ╲\n   ╱    ╲\n   ╲    ╱\n    ╲  ╱\n     ╲╱'
        }));
        
        shapesLib.addComponent(new Component({
            id: 'shape-hexagon',
            name: 'Hexagon',
            category: 'Geometry',
            icon: '⬡',
            tags: ['hexagon', 'polygon'],
            isBuiltIn: true,
            width: 12,
            height: 8,
            objects: [{
                type: 'polygon',
                cx: 6, cy: 4, radius: 5, sides: 6
            }],
            preview: '   ╱────╲\n  ╱      ╲\n │        │\n │        │\n  ╲      ╱\n   ╲────╱'
        }));
        
        shapesLib.addComponent(new Component({
            id: 'shape-star',
            name: 'Star',
            category: 'Geometry',
            icon: '★',
            tags: ['star', '5-point'],
            isBuiltIn: true,
            width: 12,
            height: 10,
            objects: [{
                type: 'star',
                cx: 6, cy: 5, outerRadius: 5, points: 5
            }],
            preview: '     ★\n    ╱ ╲\n   ╱   ╲\n  ★─────★\n   ╲   ╱\n    ╲ ╱\n     ★'
        }));
        
        this.addLibrary(shapesLib);
        
        // UI Elements library
        const uiLib = new ComponentLibrary({
            id: 'builtin-ui',
            name: 'UI Elements',
            description: 'User interface components',
            icon: '▤',
            isBuiltIn: true
        });
        
        uiLib.addComponent(new Component({
            id: 'ui-button',
            name: 'Button',
            category: 'Controls',
            icon: '▢',
            tags: ['button', 'control', 'click'],
            isBuiltIn: true,
            width: 12,
            height: 3,
            objects: [{
                type: 'rectangle',
                x: 0, y: 0, width: 12, height: 3,
                borderStyle: 'single'
            }, {
                type: 'text',
                x: 3, y: 1, text: 'Button'
            }],
            preview: '┌──────────┐\n│  Button  │\n└──────────┘'
        }));
        
        uiLib.addComponent(new Component({
            id: 'ui-input',
            name: 'Text Input',
            category: 'Controls',
            icon: '▢',
            tags: ['input', 'text', 'field', 'textbox'],
            isBuiltIn: true,
            width: 20,
            height: 3,
            objects: [{
                type: 'rectangle',
                x: 0, y: 0, width: 20, height: 3,
                borderStyle: 'single'
            }, {
                type: 'text',
                x: 1, y: 1, text: 'Enter text...'
            }],
            preview: '┌──────────────────┐\n│ Enter text...    │\n└──────────────────┘'
        }));
        
        uiLib.addComponent(new Component({
            id: 'ui-checkbox',
            name: 'Checkbox',
            category: 'Controls',
            icon: '☑',
            tags: ['checkbox', 'check', 'toggle'],
            isBuiltIn: true,
            width: 14,
            height: 1,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '[ ] Option'
            }],
            preview: '[ ] Option'
        }));
        
        uiLib.addComponent(new Component({
            id: 'ui-checkbox-checked',
            name: 'Checkbox (Checked)',
            category: 'Controls',
            icon: '☑',
            tags: ['checkbox', 'check', 'toggle', 'checked'],
            isBuiltIn: true,
            width: 14,
            height: 1,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '[x] Option'
            }],
            preview: '[x] Option'
        }));
        
        uiLib.addComponent(new Component({
            id: 'ui-radio',
            name: 'Radio Button',
            category: 'Controls',
            icon: '◉',
            tags: ['radio', 'option', 'select'],
            isBuiltIn: true,
            width: 14,
            height: 1,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '( ) Option'
            }],
            preview: '( ) Option'
        }));
        
        uiLib.addComponent(new Component({
            id: 'ui-radio-selected',
            name: 'Radio Button (Selected)',
            category: 'Controls',
            icon: '◉',
            tags: ['radio', 'option', 'select', 'selected'],
            isBuiltIn: true,
            width: 14,
            height: 1,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '(•) Option'
            }],
            preview: '(•) Option'
        }));
        
        uiLib.addComponent(new Component({
            id: 'ui-dropdown',
            name: 'Dropdown',
            category: 'Controls',
            icon: '▼',
            tags: ['dropdown', 'select', 'combo', 'list'],
            isBuiltIn: true,
            width: 16,
            height: 3,
            objects: [{
                type: 'rectangle',
                x: 0, y: 0, width: 16, height: 3,
                borderStyle: 'single'
            }, {
                type: 'text',
                x: 1, y: 1, text: 'Select...'
            }, {
                type: 'text',
                x: 13, y: 1, text: '▼'
            }],
            preview: '┌──────────────┐\n│ Select...  ▼ │\n└──────────────┘'
        }));
        
        uiLib.addComponent(new Component({
            id: 'ui-window',
            name: 'Window',
            category: 'Containers',
            icon: '▢',
            tags: ['window', 'dialog', 'modal', 'frame'],
            isBuiltIn: true,
            width: 30,
            height: 12,
            objects: [{
                type: 'rectangle',
                x: 0, y: 0, width: 30, height: 12,
                borderStyle: 'double'
            }, {
                type: 'text',
                x: 1, y: 1, text: ' Window Title'
            }, {
                type: 'text',
                x: 26, y: 1, text: '[X]'
            }, {
                type: 'line',
                x1: 1, y1: 2, x2: 28, y2: 2
            }],
            preview: '╔════════════════════════════╗\n║ Window Title           [X] ║\n║────────────────────────────║\n║                            ║\n║                            ║\n║                            ║\n╚════════════════════════════╝'
        }));
        
        uiLib.addComponent(new Component({
            id: 'ui-table',
            name: 'Table',
            category: 'Containers',
            icon: '▦',
            tags: ['table', 'grid', 'data'],
            isBuiltIn: true,
            width: 25,
            height: 8,
            objects: [{
                type: 'table',
                x: 0, y: 0, width: 25, height: 8, cols: 3, rows: 3
            }],
            preview: '┌───────┬───────┬───────┐\n│ Col 1 │ Col 2 │ Col 3 │\n├───────┼───────┼───────┤\n│       │       │       │\n├───────┼───────┼───────┤\n│       │       │       │\n└───────┴───────┴───────┘'
        }));
        
        uiLib.addComponent(new Component({
            id: 'ui-progress',
            name: 'Progress Bar',
            category: 'Indicators',
            icon: '▓',
            tags: ['progress', 'loading', 'bar'],
            isBuiltIn: true,
            width: 22,
            height: 3,
            objects: [{
                type: 'rectangle',
                x: 0, y: 0, width: 22, height: 3,
                borderStyle: 'single'
            }, {
                type: 'text',
                x: 1, y: 1, text: '████████░░░░░░░░░░░░'
            }],
            preview: '┌────────────────────┐\n│████████░░░░░░░░░░░░│\n└────────────────────┘'
        }));
        
        this.addLibrary(uiLib);
        
        // Network/Architecture library
        const networkLib = new ComponentLibrary({
            id: 'builtin-network',
            name: 'Network & Architecture',
            description: 'Network diagrams and system architecture',
            icon: '🖧',
            isBuiltIn: true
        });
        
        networkLib.addComponent(new Component({
            id: 'net-server',
            name: 'Server',
            category: 'Hardware',
            icon: '🖥',
            tags: ['server', 'computer', 'host'],
            isBuiltIn: true,
            width: 14,
            height: 8,
            objects: [{
                type: 'rectangle',
                x: 0, y: 0, width: 14, height: 8,
                borderStyle: 'double'
            }, {
                type: 'text',
                x: 3, y: 2, text: '┌────┐'
            }, {
                type: 'text',
                x: 3, y: 3, text: '│ ≡≡ │'
            }, {
                type: 'text',
                x: 3, y: 4, text: '└────┘'
            }, {
                type: 'text',
                x: 3, y: 6, text: 'Server'
            }],
            preview: '╔════════════╗\n║            ║\n║   ┌────┐   ║\n║   │ ≡≡ │   ║\n║   └────┘   ║\n║            ║\n║   Server   ║\n╚════════════╝'
        }));
        
        networkLib.addComponent(new Component({
            id: 'net-database',
            name: 'Database Server',
            category: 'Hardware',
            icon: '🗄',
            tags: ['database', 'db', 'storage', 'data'],
            isBuiltIn: true,
            width: 12,
            height: 8,
            objects: [{
                type: 'text',
                x: 1, y: 0, text: '╭────────╮'
            }, {
                type: 'text',
                x: 1, y: 1, text: '│╭──────╮│'
            }, {
                type: 'text',
                x: 1, y: 2, text: '││      ││'
            }, {
                type: 'text',
                x: 1, y: 3, text: '│├──────┤│'
            }, {
                type: 'text',
                x: 1, y: 4, text: '││      ││'
            }, {
                type: 'text',
                x: 1, y: 5, text: '│╰──────╯│'
            }, {
                type: 'text',
                x: 1, y: 6, text: '╰────────╯'
            }, {
                type: 'text',
                x: 4, y: 7, text: 'DB'
            }],
            preview: ' ╭────────╮\n │╭──────╮│\n ││      ││\n │├──────┤│\n ││      ││\n │╰──────╯│\n ╰────────╯\n    DB'
        }));
        
        networkLib.addComponent(new Component({
            id: 'net-cloud',
            name: 'Cloud',
            category: 'Services',
            icon: '☁',
            tags: ['cloud', 'internet', 'service', 'aws', 'azure'],
            isBuiltIn: true,
            width: 16,
            height: 6,
            objects: [{
                type: 'text',
                x: 2, y: 0, text: '  ╭───────╮'
            }, {
                type: 'text',
                x: 2, y: 1, text: '╭─╯       ╰─╮'
            }, {
                type: 'text',
                x: 2, y: 2, text: '│   Cloud   │'
            }, {
                type: 'text',
                x: 2, y: 3, text: '│           │'
            }, {
                type: 'text',
                x: 2, y: 4, text: '╰───────────╯'
            }],
            preview: '    ╭───────╮\n  ╭─╯       ╰─╮\n  │   Cloud   │\n  │           │\n  ╰───────────╯'
        }));
        
        networkLib.addComponent(new Component({
            id: 'net-firewall',
            name: 'Firewall',
            category: 'Security',
            icon: '🔥',
            tags: ['firewall', 'security', 'protection'],
            isBuiltIn: true,
            width: 6,
            height: 8,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '┬┬┬┬┬┬'
            }, {
                type: 'text',
                x: 0, y: 1, text: '││││││'
            }, {
                type: 'text',
                x: 0, y: 2, text: '││││││'
            }, {
                type: 'text',
                x: 0, y: 3, text: '├┼┼┼┼┤'
            }, {
                type: 'text',
                x: 0, y: 4, text: '││││││'
            }, {
                type: 'text',
                x: 0, y: 5, text: '││││││'
            }, {
                type: 'text',
                x: 0, y: 6, text: '┴┴┴┴┴┴'
            }, {
                type: 'text',
                x: 1, y: 7, text: 'FW'
            }],
            preview: '┬┬┬┬┬┬\n││││││\n││││││\n├┼┼┼┼┤\n││││││\n││││││\n┴┴┴┴┴┴\n  FW'
        }));
        
        networkLib.addComponent(new Component({
            id: 'net-router',
            name: 'Router',
            category: 'Hardware',
            icon: '⊕',
            tags: ['router', 'network', 'switch'],
            isBuiltIn: true,
            width: 12,
            height: 5,
            objects: [{
                type: 'rectangle',
                x: 0, y: 0, width: 12, height: 5,
                borderStyle: 'rounded'
            }, {
                type: 'text',
                x: 2, y: 2, text: '((◎))'
            }],
            preview: '╭──────────╮\n│          │\n│  ((◎))   │\n│          │\n╰──────────╯'
        }));
        
        networkLib.addComponent(new Component({
            id: 'net-user',
            name: 'User',
            category: 'Actors',
            icon: '👤',
            tags: ['user', 'person', 'actor', 'client'],
            isBuiltIn: true,
            width: 6,
            height: 6,
            objects: [{
                type: 'text',
                x: 1, y: 0, text: '╭─╮'
            }, {
                type: 'text',
                x: 1, y: 1, text: '│●│'
            }, {
                type: 'text',
                x: 1, y: 2, text: '╰┬╯'
            }, {
                type: 'text',
                x: 0, y: 3, text: '╭┴─┴╮'
            }, {
                type: 'text',
                x: 0, y: 4, text: '│   │'
            }, {
                type: 'text',
                x: 0, y: 5, text: '┴   ┴'
            }],
            preview: ' ╭─╮\n │●│\n ╰┬╯\n╭┴─┴╮\n│   │\n┴   ┴'
        }));
        
        this.addLibrary(networkLib);
        
        // Arrows & Connectors library
        const arrowsLib = new ComponentLibrary({
            id: 'builtin-arrows',
            name: 'Arrows & Lines',
            description: 'Arrows, connectors and lines',
            icon: '→',
            isBuiltIn: true
        });
        
        arrowsLib.addComponent(new Component({
            id: 'arrow-right',
            name: 'Arrow Right',
            category: 'Arrows',
            icon: '→',
            tags: ['arrow', 'right', 'direction'],
            isBuiltIn: true,
            width: 10,
            height: 1,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '─────────→'
            }],
            preview: '─────────→'
        }));
        
        arrowsLib.addComponent(new Component({
            id: 'arrow-left',
            name: 'Arrow Left',
            category: 'Arrows',
            icon: '←',
            tags: ['arrow', 'left', 'direction'],
            isBuiltIn: true,
            width: 10,
            height: 1,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '←─────────'
            }],
            preview: '←─────────'
        }));
        
        arrowsLib.addComponent(new Component({
            id: 'arrow-up',
            name: 'Arrow Up',
            category: 'Arrows',
            icon: '↑',
            tags: ['arrow', 'up', 'direction'],
            isBuiltIn: true,
            width: 1,
            height: 6,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '↑'
            }, {
                type: 'text',
                x: 0, y: 1, text: '│'
            }, {
                type: 'text',
                x: 0, y: 2, text: '│'
            }, {
                type: 'text',
                x: 0, y: 3, text: '│'
            }, {
                type: 'text',
                x: 0, y: 4, text: '│'
            }, {
                type: 'text',
                x: 0, y: 5, text: '│'
            }],
            preview: '↑\n│\n│\n│\n│\n│'
        }));
        
        arrowsLib.addComponent(new Component({
            id: 'arrow-down',
            name: 'Arrow Down',
            category: 'Arrows',
            icon: '↓',
            tags: ['arrow', 'down', 'direction'],
            isBuiltIn: true,
            width: 1,
            height: 6,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '│'
            }, {
                type: 'text',
                x: 0, y: 1, text: '│'
            }, {
                type: 'text',
                x: 0, y: 2, text: '│'
            }, {
                type: 'text',
                x: 0, y: 3, text: '│'
            }, {
                type: 'text',
                x: 0, y: 4, text: '│'
            }, {
                type: 'text',
                x: 0, y: 5, text: '↓'
            }],
            preview: '│\n│\n│\n│\n│\n↓'
        }));
        
        arrowsLib.addComponent(new Component({
            id: 'arrow-bidirectional-h',
            name: 'Bidirectional (Horizontal)',
            category: 'Arrows',
            icon: '↔',
            tags: ['arrow', 'bidirectional', 'horizontal'],
            isBuiltIn: true,
            width: 12,
            height: 1,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '←──────────→'
            }],
            preview: '←──────────→'
        }));
        
        arrowsLib.addComponent(new Component({
            id: 'arrow-bidirectional-v',
            name: 'Bidirectional (Vertical)',
            category: 'Arrows',
            icon: '↕',
            tags: ['arrow', 'bidirectional', 'vertical'],
            isBuiltIn: true,
            width: 1,
            height: 7,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '↑'
            }, {
                type: 'text',
                x: 0, y: 1, text: '│'
            }, {
                type: 'text',
                x: 0, y: 2, text: '│'
            }, {
                type: 'text',
                x: 0, y: 3, text: '│'
            }, {
                type: 'text',
                x: 0, y: 4, text: '│'
            }, {
                type: 'text',
                x: 0, y: 5, text: '│'
            }, {
                type: 'text',
                x: 0, y: 6, text: '↓'
            }],
            preview: '↑\n│\n│\n│\n│\n│\n↓'
        }));
        
        arrowsLib.addComponent(new Component({
            id: 'connector-corner-tr',
            name: 'Corner (Top-Right)',
            category: 'Connectors',
            icon: '┐',
            tags: ['corner', 'connector', 'line'],
            isBuiltIn: true,
            width: 6,
            height: 4,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '─────┐'
            }, {
                type: 'text',
                x: 5, y: 1, text: '│'
            }, {
                type: 'text',
                x: 5, y: 2, text: '│'
            }, {
                type: 'text',
                x: 5, y: 3, text: '│'
            }],
            preview: '─────┐\n     │\n     │\n     │'
        }));
        
        arrowsLib.addComponent(new Component({
            id: 'connector-corner-tl',
            name: 'Corner (Top-Left)',
            category: 'Connectors',
            icon: '┌',
            tags: ['corner', 'connector', 'line'],
            isBuiltIn: true,
            width: 6,
            height: 4,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '┌─────'
            }, {
                type: 'text',
                x: 0, y: 1, text: '│'
            }, {
                type: 'text',
                x: 0, y: 2, text: '│'
            }, {
                type: 'text',
                x: 0, y: 3, text: '│'
            }],
            preview: '┌─────\n│\n│\n│'
        }));
        
        this.addLibrary(arrowsLib);
        
        // Text & Labels library
        const textLib = new ComponentLibrary({
            id: 'builtin-text',
            name: 'Text & Labels',
            description: 'Text boxes, labels, and annotations',
            icon: 'T',
            isBuiltIn: true
        });
        
        textLib.addComponent(new Component({
            id: 'text-label',
            name: 'Label',
            category: 'Text',
            icon: 'T',
            tags: ['label', 'text', 'annotation'],
            isBuiltIn: true,
            width: 10,
            height: 1,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: 'Label'
            }],
            preview: 'Label'
        }));
        
        textLib.addComponent(new Component({
            id: 'text-note',
            name: 'Note',
            category: 'Text',
            icon: '📝',
            tags: ['note', 'comment', 'annotation'],
            isBuiltIn: true,
            width: 20,
            height: 6,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '┌─────────────────┬─╮'
            }, {
                type: 'text',
                x: 0, y: 1, text: '│ Note:           │╱│'
            }, {
                type: 'text',
                x: 0, y: 2, text: '├─────────────────┴─┤'
            }, {
                type: 'text',
                x: 0, y: 3, text: '│                   │'
            }, {
                type: 'text',
                x: 0, y: 4, text: '│                   │'
            }, {
                type: 'text',
                x: 0, y: 5, text: '└───────────────────┘'
            }],
            preview: '┌─────────────────┬─╮\n│ Note:           │╱│\n├─────────────────┴─┤\n│                   │\n│                   │\n└───────────────────┘'
        }));
        
        textLib.addComponent(new Component({
            id: 'text-callout',
            name: 'Callout',
            category: 'Text',
            icon: '💬',
            tags: ['callout', 'speech', 'bubble'],
            isBuiltIn: true,
            width: 18,
            height: 5,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '╭────────────────╮'
            }, {
                type: 'text',
                x: 0, y: 1, text: '│                │'
            }, {
                type: 'text',
                x: 0, y: 2, text: '│                │'
            }, {
                type: 'text',
                x: 0, y: 3, text: '╰──┬─────────────╯'
            }, {
                type: 'text',
                x: 0, y: 4, text: '   ╰──'
            }],
            preview: '╭────────────────╮\n│                │\n│                │\n╰──┬─────────────╯\n   ╰──'
        }));
        
        textLib.addComponent(new Component({
            id: 'text-banner',
            name: 'Banner',
            category: 'Text',
            icon: '🏷',
            tags: ['banner', 'header', 'title'],
            isBuiltIn: true,
            width: 24,
            height: 3,
            objects: [{
                type: 'text',
                x: 0, y: 0, text: '╔══════════════════════╗'
            }, {
                type: 'text',
                x: 0, y: 1, text: '║       BANNER         ║'
            }, {
                type: 'text',
                x: 0, y: 2, text: '╚══════════════════════╝'
            }],
            preview: '╔══════════════════════╗\n║       BANNER         ║\n╚══════════════════════╝'
        }));
        
        this.addLibrary(textLib);
    }
    
    /**
     * Add a library
     */
    addLibrary(library) {
        if (!(library instanceof ComponentLibrary)) {
            library = new ComponentLibrary(library);
        }
        this.libraries.set(library.id, library);
        this.emit('libraryAdded', library);
        return library;
    }
    
    /**
     * Remove a library
     */
    removeLibrary(libraryId) {
        const library = this.libraries.get(libraryId);
        if (library && !library.isBuiltIn) {
            this.libraries.delete(libraryId);
            this._saveToStorage();
            this.emit('libraryRemoved', libraryId);
            return true;
        }
        return false;
    }
    
    /**
     * Get a library by ID
     */
    getLibrary(libraryId) {
        return this.libraries.get(libraryId);
    }
    
    /**
     * Get all libraries
     */
    getAllLibraries() {
        return Array.from(this.libraries.values());
    }
    
    /**
     * Get all components across all libraries
     */
    getAllComponents() {
        const components = [];
        for (const library of this.libraries.values()) {
            components.push(...library.getAllComponents());
        }
        return components;
    }
    
    /**
     * Search components across all libraries
     */
    searchComponents(query) {
        const results = [];
        for (const library of this.libraries.values()) {
            const matches = library.searchComponents(query);
            results.push(...matches.map(c => ({ component: c, library })));
        }
        return results;
    }
    
    /**
     * Create a component from scene objects
     */
    createComponentFromObjects(objects, options = {}) {
        const component = new Component({
            ...options,
            objects: objects.map(obj => obj.toJSON ? obj.toJSON() : obj)
        });
        component.generatePreview();
        return component;
    }
    
    /**
     * Add a component to a library
     */
    addComponentToLibrary(component, libraryId) {
        const library = this.libraries.get(libraryId);
        if (library && !library.isBuiltIn) {
            library.addComponent(component);
            this._saveToStorage();
            this.emit('componentAdded', { component, library });
            return true;
        }
        return false;
    }
    
    /**
     * Create a new user library
     */
    createLibrary(name, options = {}) {
        const library = new ComponentLibrary({
            name,
            ...options,
            isBuiltIn: false
        });
        this.addLibrary(library);
        this._saveToStorage();
        return library;
    }
    
    /**
     * Export libraries to JSON
     */
    exportLibraries(libraryIds = null) {
        const libs = libraryIds 
            ? libraryIds.map(id => this.libraries.get(id)).filter(Boolean)
            : this.getAllLibraries().filter(l => !l.isBuiltIn);
        
        return JSON.stringify({
            version: '1.0',
            type: 'asciistrator-component-library',
            libraries: libs.map(l => l.toJSON())
        }, null, 2);
    }
    
    /**
     * Import libraries from JSON
     */
    importLibraries(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.type !== 'asciistrator-component-library') {
                throw new Error('Invalid library file format');
            }
            
            const imported = [];
            for (const libJson of data.libraries) {
                // Don't overwrite built-in libraries
                if (this.libraries.has(libJson.id) && this.libraries.get(libJson.id).isBuiltIn) {
                    libJson.id = uuid(); // Generate new ID
                }
                const library = ComponentLibrary.fromJSON(libJson);
                library.isBuiltIn = false; // Imported libraries are never built-in
                this.addLibrary(library);
                imported.push(library);
            }
            
            this._saveToStorage();
            this.emit('librariesImported', imported);
            return imported;
        } catch (error) {
            console.error('Failed to import libraries:', error);
            throw error;
        }
    }
    
    /**
     * Save user libraries to localStorage
     */
    _saveToStorage() {
        try {
            const userLibraries = this.getAllLibraries()
                .filter(l => !l.isBuiltIn)
                .map(l => l.toJSON());
            localStorage.setItem(this._storageKey, JSON.stringify(userLibraries));
        } catch (error) {
            console.warn('Failed to save libraries to storage:', error);
        }
    }
    
    /**
     * Load user libraries from localStorage
     */
    _loadFromStorage() {
        try {
            const stored = localStorage.getItem(this._storageKey);
            if (stored) {
                const librariesJson = JSON.parse(stored);
                for (const libJson of librariesJson) {
                    const library = ComponentLibrary.fromJSON(libJson);
                    library.isBuiltIn = false;
                    this.libraries.set(library.id, library);
                }
            }
        } catch (error) {
            console.warn('Failed to load libraries from storage:', error);
        }
    }
}

// Export singleton instance
export const componentLibraryManager = new ComponentLibraryManager();

export default {
    Component,
    ComponentLibrary,
    ComponentLibraryManager,
    componentLibraryManager
};
