/**
 * Asciistrator - Symbols Library
 * 
 * Reusable symbols that can be instantiated multiple times.
 * Includes predefined symbols and user-defined symbol management.
 */

/**
 * Symbol definition - a reusable collection of objects
 */
export class SymbolDefinition {
    /**
     * @param {object} options
     * @param {string} options.id - Unique symbol ID
     * @param {string} options.name - Display name
     * @param {string} options.category - Category for organization
     * @param {object[]} options.objects - Array of object definitions
     * @param {number} options.width - Symbol width
     * @param {number} options.height - Symbol height
     */
    constructor(options = {}) {
        this.id = options.id || `symbol_${Date.now()}`;
        this.name = options.name || 'Untitled Symbol';
        this.category = options.category || 'User';
        this.objects = options.objects || [];
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.description = options.description || '';
        this.tags = options.tags || [];
        this.created = options.created || new Date().toISOString();
        this.modified = options.modified || new Date().toISOString();
        
        // Calculate bounds if not provided
        if (!options.width || !options.height) {
            this._calculateBounds();
        }
    }

    /**
     * Calculate symbol bounds from objects
     * @private
     */
    _calculateBounds() {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const obj of this.objects) {
            minX = Math.min(minX, obj.x || 0);
            minY = Math.min(minY, obj.y || 0);
            maxX = Math.max(maxX, (obj.x || 0) + (obj.width || 1));
            maxY = Math.max(maxY, (obj.y || 0) + (obj.height || 1));
        }
        
        this.width = maxX - minX;
        this.height = maxY - minY;
        
        // Normalize object positions to start at 0,0
        for (const obj of this.objects) {
            obj.x = (obj.x || 0) - minX;
            obj.y = (obj.y || 0) - minY;
        }
    }

    /**
     * Create an instance of this symbol at a position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {object} options - Instance options
     * @returns {SymbolInstance}
     */
    createInstance(x, y, options = {}) {
        return new SymbolInstance({
            symbolId: this.id,
            x,
            y,
            scaleX: options.scaleX || 1,
            scaleY: options.scaleY || 1,
            rotation: options.rotation || 0,
            ...options
        });
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            objects: this.objects,
            width: this.width,
            height: this.height,
            description: this.description,
            tags: this.tags,
            created: this.created,
            modified: this.modified
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new SymbolDefinition(json);
    }
}

/**
 * Symbol instance - a placed reference to a symbol
 */
export class SymbolInstance {
    constructor(options = {}) {
        this.type = 'symbol-instance';
        this.id = options.id || `inst_${Date.now()}`;
        this.symbolId = options.symbolId;
        this.name = options.name || 'Symbol Instance';
        
        // Transform
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.scaleX = options.scaleX || 1;
        this.scaleY = options.scaleY || 1;
        this.rotation = options.rotation || 0;
        
        // Style overrides
        this.strokeColor = options.strokeColor || null;
        this.fillColor = options.fillColor || null;
        this.opacity = options.opacity || 1;
        this.visible = options.visible !== false;
        
        // Cached reference
        this._symbolDef = null;
    }

    /**
     * Link to symbol definition
     * @param {SymbolDefinition} symbolDef 
     */
    linkSymbol(symbolDef) {
        this._symbolDef = symbolDef;
    }

    /**
     * Get bounding box
     */
    getBounds() {
        const def = this._symbolDef;
        if (!def) {
            return { x: this.x, y: this.y, width: 1, height: 1 };
        }
        
        return {
            x: this.x,
            y: this.y,
            width: Math.round(def.width * this.scaleX),
            height: Math.round(def.height * this.scaleY)
        };
    }

    /**
     * Check if point is inside
     */
    containsPoint(px, py) {
        const bounds = this.getBounds();
        return px >= bounds.x && px < bounds.x + bounds.width &&
               py >= bounds.y && py < bounds.y + bounds.height;
    }

    /**
     * Render to buffer
     * @param {object} buffer - ASCII buffer
     * @param {object} objectFactory - Factory for creating renderable objects
     */
    render(buffer, objectFactory = null) {
        if (!this._symbolDef || !this.visible) return;
        
        for (const objDef of this._symbolDef.objects) {
            // Calculate transformed position
            const tx = this.x + Math.round(objDef.x * this.scaleX);
            const ty = this.y + Math.round(objDef.y * this.scaleY);
            const tw = Math.round((objDef.width || 1) * this.scaleX);
            const th = Math.round((objDef.height || 1) * this.scaleY);
            
            // Apply style overrides
            const strokeColor = this.strokeColor || objDef.strokeColor;
            const fillColor = this.fillColor || objDef.fillColor;
            
            // If we have an object factory, create proper objects
            if (objectFactory && objectFactory.create) {
                const obj = objectFactory.create({
                    ...objDef,
                    x: tx,
                    y: ty,
                    width: tw,
                    height: th,
                    strokeColor,
                    fillColor
                });
                if (obj && obj.render) {
                    obj.render(buffer);
                }
            } else {
                // Simple rendering for text objects
                if (objDef.type === 'text' && objDef.text) {
                    for (let i = 0; i < objDef.text.length; i++) {
                        buffer.setChar(tx + i, ty, objDef.text[i], strokeColor);
                    }
                }
            }
        }
    }

    /**
     * Break link - convert to regular objects
     * @param {object} objectFactory 
     * @returns {object[]} Array of objects
     */
    breakLink(objectFactory) {
        if (!this._symbolDef) return [];
        
        const objects = [];
        
        for (const objDef of this._symbolDef.objects) {
            const obj = objectFactory.create({
                ...objDef,
                x: this.x + Math.round(objDef.x * this.scaleX),
                y: this.y + Math.round(objDef.y * this.scaleY),
                width: Math.round((objDef.width || 1) * this.scaleX),
                height: Math.round((objDef.height || 1) * this.scaleY),
                strokeColor: this.strokeColor || objDef.strokeColor,
                fillColor: this.fillColor || objDef.fillColor
            });
            if (obj) objects.push(obj);
        }
        
        return objects;
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            type: this.type,
            id: this.id,
            symbolId: this.symbolId,
            name: this.name,
            x: this.x,
            y: this.y,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            rotation: this.rotation,
            strokeColor: this.strokeColor,
            fillColor: this.fillColor,
            opacity: this.opacity,
            visible: this.visible
        };
    }
}

/**
 * Symbol Library - manages symbol definitions
 */
export class SymbolLibrary {
    constructor() {
        this.symbols = new Map();
        this.categories = new Set(['User', 'Flowchart', 'Arrows', 'Boxes', 'UI']);
    }

    /**
     * Add a symbol definition
     * @param {SymbolDefinition} symbol 
     */
    add(symbol) {
        this.symbols.set(symbol.id, symbol);
        if (symbol.category) {
            this.categories.add(symbol.category);
        }
        return symbol;
    }

    /**
     * Get a symbol by ID
     * @param {string} id 
     * @returns {SymbolDefinition|null}
     */
    get(id) {
        return this.symbols.get(id) || null;
    }

    /**
     * Remove a symbol
     * @param {string} id 
     */
    remove(id) {
        this.symbols.delete(id);
    }

    /**
     * Get all symbols in a category
     * @param {string} category 
     * @returns {SymbolDefinition[]}
     */
    getByCategory(category) {
        return Array.from(this.symbols.values())
            .filter(s => s.category === category);
    }

    /**
     * Search symbols by name or tags
     * @param {string} query 
     * @returns {SymbolDefinition[]}
     */
    search(query) {
        const q = query.toLowerCase();
        return Array.from(this.symbols.values()).filter(s => 
            s.name.toLowerCase().includes(q) ||
            s.tags.some(t => t.toLowerCase().includes(q))
        );
    }

    /**
     * Create symbol from selected objects
     * @param {object[]} objects - Array of scene objects
     * @param {string} name - Symbol name
     * @param {string} category - Category
     * @returns {SymbolDefinition}
     */
    createFromObjects(objects, name, category = 'User') {
        const objDefs = objects.map(obj => obj.toJSON ? obj.toJSON() : obj);
        
        const symbol = new SymbolDefinition({
            name,
            category,
            objects: objDefs
        });
        
        this.add(symbol);
        return symbol;
    }

    /**
     * Serialize library to JSON
     */
    toJSON() {
        return {
            symbols: Array.from(this.symbols.values()).map(s => s.toJSON()),
            categories: Array.from(this.categories)
        };
    }

    /**
     * Load library from JSON
     * @param {object} json 
     */
    fromJSON(json) {
        this.symbols.clear();
        
        if (json.symbols) {
            for (const symbolJson of json.symbols) {
                const symbol = SymbolDefinition.fromJSON(symbolJson);
                this.symbols.set(symbol.id, symbol);
            }
        }
        
        if (json.categories) {
            this.categories = new Set(json.categories);
        }
    }

    /**
     * Get all symbols
     * @returns {SymbolDefinition[]}
     */
    getAll() {
        return Array.from(this.symbols.values());
    }
}

/**
 * Predefined ASCII symbols
 */
export const PredefinedSymbols = {
    // Arrow symbols
    arrowRight: new SymbolDefinition({
        id: 'arrow-right',
        name: 'Arrow Right',
        category: 'Arrows',
        objects: [{ type: 'text', x: 0, y: 0, text: '──▶', width: 3, height: 1 }],
        width: 3,
        height: 1
    }),
    
    arrowLeft: new SymbolDefinition({
        id: 'arrow-left',
        name: 'Arrow Left',
        category: 'Arrows',
        objects: [{ type: 'text', x: 0, y: 0, text: '◀──', width: 3, height: 1 }],
        width: 3,
        height: 1
    }),
    
    arrowUp: new SymbolDefinition({
        id: 'arrow-up',
        name: 'Arrow Up',
        category: 'Arrows',
        objects: [
            { type: 'text', x: 0, y: 0, text: '▲', width: 1, height: 1 },
            { type: 'text', x: 0, y: 1, text: '│', width: 1, height: 1 }
        ],
        width: 1,
        height: 2
    }),
    
    arrowDown: new SymbolDefinition({
        id: 'arrow-down',
        name: 'Arrow Down',
        category: 'Arrows',
        objects: [
            { type: 'text', x: 0, y: 0, text: '│', width: 1, height: 1 },
            { type: 'text', x: 0, y: 1, text: '▼', width: 1, height: 1 }
        ],
        width: 1,
        height: 2
    }),
    
    arrowBidirectional: new SymbolDefinition({
        id: 'arrow-bidirectional',
        name: 'Bidirectional Arrow',
        category: 'Arrows',
        objects: [{ type: 'text', x: 0, y: 0, text: '◀──▶', width: 4, height: 1 }],
        width: 4,
        height: 1
    }),
    
    // Box symbols
    boxSmall: new SymbolDefinition({
        id: 'box-small',
        name: 'Small Box',
        category: 'Boxes',
        objects: [
            { type: 'text', x: 0, y: 0, text: '┌──┐', width: 4, height: 1 },
            { type: 'text', x: 0, y: 1, text: '│  │', width: 4, height: 1 },
            { type: 'text', x: 0, y: 2, text: '└──┘', width: 4, height: 1 }
        ],
        width: 4,
        height: 3
    }),
    
    boxDouble: new SymbolDefinition({
        id: 'box-double',
        name: 'Double Box',
        category: 'Boxes',
        objects: [
            { type: 'text', x: 0, y: 0, text: '╔══╗', width: 4, height: 1 },
            { type: 'text', x: 0, y: 1, text: '║  ║', width: 4, height: 1 },
            { type: 'text', x: 0, y: 2, text: '╚══╝', width: 4, height: 1 }
        ],
        width: 4,
        height: 3
    }),
    
    boxRounded: new SymbolDefinition({
        id: 'box-rounded',
        name: 'Rounded Box',
        category: 'Boxes',
        objects: [
            { type: 'text', x: 0, y: 0, text: '╭──╮', width: 4, height: 1 },
            { type: 'text', x: 0, y: 1, text: '│  │', width: 4, height: 1 },
            { type: 'text', x: 0, y: 2, text: '╰──╯', width: 4, height: 1 }
        ],
        width: 4,
        height: 3
    }),
    
    // UI symbols
    checkbox: new SymbolDefinition({
        id: 'checkbox',
        name: 'Checkbox',
        category: 'UI',
        objects: [{ type: 'text', x: 0, y: 0, text: '☐', width: 1, height: 1 }],
        width: 1,
        height: 1
    }),
    
    checkboxChecked: new SymbolDefinition({
        id: 'checkbox-checked',
        name: 'Checkbox Checked',
        category: 'UI',
        objects: [{ type: 'text', x: 0, y: 0, text: '☑', width: 1, height: 1 }],
        width: 1,
        height: 1
    }),
    
    radioButton: new SymbolDefinition({
        id: 'radio',
        name: 'Radio Button',
        category: 'UI',
        objects: [{ type: 'text', x: 0, y: 0, text: '○', width: 1, height: 1 }],
        width: 1,
        height: 1
    }),
    
    radioButtonSelected: new SymbolDefinition({
        id: 'radio-selected',
        name: 'Radio Selected',
        category: 'UI',
        objects: [{ type: 'text', x: 0, y: 0, text: '●', width: 1, height: 1 }],
        width: 1,
        height: 1
    }),
    
    button: new SymbolDefinition({
        id: 'button',
        name: 'Button',
        category: 'UI',
        objects: [
            { type: 'text', x: 0, y: 0, text: '[ OK ]', width: 6, height: 1 }
        ],
        width: 6,
        height: 1
    }),
    
    // Status symbols
    statusOk: new SymbolDefinition({
        id: 'status-ok',
        name: 'Status OK',
        category: 'UI',
        objects: [{ type: 'text', x: 0, y: 0, text: '✓', width: 1, height: 1, strokeColor: '#00ff00' }],
        width: 1,
        height: 1
    }),
    
    statusError: new SymbolDefinition({
        id: 'status-error',
        name: 'Status Error',
        category: 'UI',
        objects: [{ type: 'text', x: 0, y: 0, text: '✗', width: 1, height: 1, strokeColor: '#ff0000' }],
        width: 1,
        height: 1
    }),
    
    statusWarning: new SymbolDefinition({
        id: 'status-warning',
        name: 'Status Warning',
        category: 'UI',
        objects: [{ type: 'text', x: 0, y: 0, text: '⚠', width: 1, height: 1, strokeColor: '#ffaa00' }],
        width: 1,
        height: 1
    }),
    
    // Flowchart symbols (simple versions)
    processSimple: new SymbolDefinition({
        id: 'flow-process',
        name: 'Process',
        category: 'Flowchart',
        objects: [
            { type: 'text', x: 0, y: 0, text: '┌────────┐', width: 10, height: 1 },
            { type: 'text', x: 0, y: 1, text: '│        │', width: 10, height: 1 },
            { type: 'text', x: 0, y: 2, text: '└────────┘', width: 10, height: 1 }
        ],
        width: 10,
        height: 3
    }),
    
    decisionSimple: new SymbolDefinition({
        id: 'flow-decision',
        name: 'Decision',
        category: 'Flowchart',
        objects: [
            { type: 'text', x: 0, y: 0, text: '    ◇    ', width: 9, height: 1 },
            { type: 'text', x: 0, y: 1, text: '  ◇   ◇  ', width: 9, height: 1 },
            { type: 'text', x: 0, y: 2, text: '    ◇    ', width: 9, height: 1 }
        ],
        width: 9,
        height: 3
    }),
    
    terminalSimple: new SymbolDefinition({
        id: 'flow-terminal',
        name: 'Terminal',
        category: 'Flowchart',
        objects: [
            { type: 'text', x: 0, y: 0, text: '╭────────╮', width: 10, height: 1 },
            { type: 'text', x: 0, y: 1, text: '│        │', width: 10, height: 1 },
            { type: 'text', x: 0, y: 2, text: '╰────────╯', width: 10, height: 1 }
        ],
        width: 10,
        height: 3
    })
};

/**
 * Create a symbol library pre-populated with predefined symbols
 * @returns {SymbolLibrary}
 */
export function createDefaultLibrary() {
    const library = new SymbolLibrary();
    
    for (const symbol of Object.values(PredefinedSymbols)) {
        library.add(symbol);
    }
    
    return library;
}

export default {
    SymbolDefinition,
    SymbolInstance,
    SymbolLibrary,
    PredefinedSymbols,
    createDefaultLibrary
};
