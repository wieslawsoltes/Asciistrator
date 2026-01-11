/**
 * Asciistrator - Layer Compositing System
 * 
 * Blend modes, opacity handling, and compositing operations for layers.
 */

import { EventEmitter } from '../../utils/events.js';

// ==========================================
// BLEND MODES
// ==========================================

/**
 * Blend mode functions for compositing ASCII characters
 */
export const BlendModes = {
    /**
     * Normal blend - top layer replaces bottom
     */
    NORMAL: 'normal',
    
    /**
     * Multiply - darken
     */
    MULTIPLY: 'multiply',
    
    /**
     * Screen - lighten
     */
    SCREEN: 'screen',
    
    /**
     * Overlay - contrast
     */
    OVERLAY: 'overlay',
    
    /**
     * Darken - minimum
     */
    DARKEN: 'darken',
    
    /**
     * Lighten - maximum
     */
    LIGHTEN: 'lighten',
    
    /**
     * Difference
     */
    DIFFERENCE: 'difference',
    
    /**
     * Add (linear dodge)
     */
    ADD: 'add',
    
    /**
     * XOR - exclusive combination
     */
    XOR: 'xor',
    
    /**
     * Behind - draw behind existing
     */
    BEHIND: 'behind',
    
    /**
     * Erase - remove where top exists
     */
    ERASE: 'erase'
};

/**
 * Character density map for intensity-based blending
 */
const CHAR_DENSITY = ' .:-=+*#%@';
const CHAR_DENSITY_MAP = new Map();
for (let i = 0; i < CHAR_DENSITY.length; i++) {
    CHAR_DENSITY_MAP.set(CHAR_DENSITY[i], i / (CHAR_DENSITY.length - 1));
}

/**
 * Get character intensity (0-1)
 * @param {string} char 
 * @returns {number}
 */
export function getCharIntensity(char) {
    if (CHAR_DENSITY_MAP.has(char)) {
        return CHAR_DENSITY_MAP.get(char);
    }
    // Default intensity for unknown characters
    if (char === ' ' || char === '') return 0;
    return 0.5;
}

/**
 * Get character from intensity (0-1)
 * @param {number} intensity 
 * @returns {string}
 */
export function charFromIntensity(intensity) {
    const index = Math.round(intensity * (CHAR_DENSITY.length - 1));
    return CHAR_DENSITY[Math.max(0, Math.min(index, CHAR_DENSITY.length - 1))];
}

/**
 * Parse color string to RGB
 * @param {string} color 
 * @returns {{r: number, g: number, b: number, a: number}|null}
 */
export function parseColor(color) {
    if (!color) return null;
    
    // Hex color
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16),
                a: 1
            };
        } else if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: 1
            };
        } else if (hex.length === 8) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: parseInt(hex.slice(6, 8), 16) / 255
            };
        }
    }
    
    // RGB/RGBA
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3]),
            a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
        };
    }
    
    return null;
}

/**
 * Color to CSS string
 * @param {{r: number, g: number, b: number, a: number}} color 
 * @returns {string}
 */
export function colorToString(color) {
    if (color.a === 1) {
        return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
    }
    return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
}

/**
 * Blend two colors
 * @param {{r: number, g: number, b: number, a: number}} bottom 
 * @param {{r: number, g: number, b: number, a: number}} top 
 * @param {string} mode 
 * @param {number} [opacity=1]
 * @returns {{r: number, g: number, b: number, a: number}}
 */
export function blendColors(bottom, top, mode, opacity = 1) {
    if (!bottom || !top) {
        return top || bottom || { r: 0, g: 0, b: 0, a: 0 };
    }
    
    const topAlpha = top.a * opacity;
    
    // Calculate blended RGB based on mode
    let r, g, b;
    
    switch (mode) {
        case BlendModes.MULTIPLY:
            r = (bottom.r * top.r) / 255;
            g = (bottom.g * top.g) / 255;
            b = (bottom.b * top.b) / 255;
            break;
            
        case BlendModes.SCREEN:
            r = 255 - ((255 - bottom.r) * (255 - top.r)) / 255;
            g = 255 - ((255 - bottom.g) * (255 - top.g)) / 255;
            b = 255 - ((255 - bottom.b) * (255 - top.b)) / 255;
            break;
            
        case BlendModes.OVERLAY:
            r = bottom.r < 128 
                ? (2 * bottom.r * top.r) / 255 
                : 255 - (2 * (255 - bottom.r) * (255 - top.r)) / 255;
            g = bottom.g < 128 
                ? (2 * bottom.g * top.g) / 255 
                : 255 - (2 * (255 - bottom.g) * (255 - top.g)) / 255;
            b = bottom.b < 128 
                ? (2 * bottom.b * top.b) / 255 
                : 255 - (2 * (255 - bottom.b) * (255 - top.b)) / 255;
            break;
            
        case BlendModes.DARKEN:
            r = Math.min(bottom.r, top.r);
            g = Math.min(bottom.g, top.g);
            b = Math.min(bottom.b, top.b);
            break;
            
        case BlendModes.LIGHTEN:
            r = Math.max(bottom.r, top.r);
            g = Math.max(bottom.g, top.g);
            b = Math.max(bottom.b, top.b);
            break;
            
        case BlendModes.DIFFERENCE:
            r = Math.abs(bottom.r - top.r);
            g = Math.abs(bottom.g - top.g);
            b = Math.abs(bottom.b - top.b);
            break;
            
        case BlendModes.ADD:
            r = Math.min(255, bottom.r + top.r);
            g = Math.min(255, bottom.g + top.g);
            b = Math.min(255, bottom.b + top.b);
            break;
            
        default: // NORMAL
            r = top.r;
            g = top.g;
            b = top.b;
    }
    
    // Alpha compositing
    const outAlpha = topAlpha + bottom.a * (1 - topAlpha);
    
    if (outAlpha === 0) {
        return { r: 0, g: 0, b: 0, a: 0 };
    }
    
    return {
        r: (r * topAlpha + bottom.r * bottom.a * (1 - topAlpha)) / outAlpha,
        g: (g * topAlpha + bottom.g * bottom.a * (1 - topAlpha)) / outAlpha,
        b: (b * topAlpha + bottom.b * bottom.a * (1 - topAlpha)) / outAlpha,
        a: outAlpha
    };
}

// ==========================================
// COMPOSITING LAYER
// ==========================================

/**
 * CompositingLayer - Layer with blend mode and compositing support
 */
export class CompositingLayer extends EventEmitter {
    /**
     * Create a compositing layer
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} */
        this.id = options.id || `layer_${Date.now()}`;
        
        /** @type {string} */
        this.name = options.name || 'Layer';
        
        /** @type {boolean} */
        this.visible = options.visible !== false;
        
        /** @type {boolean} */
        this.locked = options.locked || false;
        
        /** @type {number} Opacity 0-1 */
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        
        /** @type {string} Blend mode */
        this.blendMode = options.blendMode || BlendModes.NORMAL;
        
        /** @type {Map<string, LayerCell>} Layer content by "x,y" */
        this._content = new Map();
        
        /** @type {Set<string>} Dirty cell keys */
        this._dirtyCells = new Set();
        
        /** @type {object|null} Cached bounds */
        this._bounds = null;
        
        /** @type {boolean} */
        this._boundsDirty = true;
        
        /** @type {string|null} Clipping mask layer ID */
        this.clipMask = options.clipMask || null;
        
        /** @type {boolean} Solo mode (only show this layer) */
        this.solo = false;
    }
    
    // ==========================================
    // CELL OPERATIONS
    // ==========================================
    
    /**
     * Set cell content
     * @param {number} x 
     * @param {number} y 
     * @param {string} char 
     * @param {string} [color]
     * @param {object} [metadata]
     */
    setCell(x, y, char, color = null, metadata = null) {
        const key = `${x},${y}`;
        
        if (char === ' ' || char === '' || char === null) {
            this._content.delete(key);
        } else {
            this._content.set(key, new LayerCell(x, y, char, color, metadata));
        }
        
        this._dirtyCells.add(key);
        this._boundsDirty = true;
        this.emit('cellchange', { x, y, char, color });
    }
    
    /**
     * Get cell content
     * @param {number} x 
     * @param {number} y 
     * @returns {LayerCell|null}
     */
    getCell(x, y) {
        return this._content.get(`${x},${y}`) || null;
    }
    
    /**
     * Clear cell
     * @param {number} x 
     * @param {number} y 
     */
    clearCell(x, y) {
        this.setCell(x, y, '');
    }
    
    /**
     * Clear all content
     */
    clear() {
        this._content.clear();
        this._dirtyCells.clear();
        this._bounds = null;
        this._boundsDirty = true;
        this.emit('clear');
    }
    
    /**
     * Get all cells
     * @returns {LayerCell[]}
     */
    getAllCells() {
        return [...this._content.values()];
    }
    
    /**
     * Get cell count
     * @returns {number}
     */
    getCellCount() {
        return this._content.size;
    }
    
    /**
     * Iterate over all cells
     * @param {function} callback - (cell, x, y) => void
     */
    forEachCell(callback) {
        for (const cell of this._content.values()) {
            callback(cell, cell.x, cell.y);
        }
    }
    
    // ==========================================
    // BOUNDS
    // ==========================================
    
    /**
     * Get layer bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}|null}
     */
    getBounds() {
        if (!this._boundsDirty && this._bounds) {
            return this._bounds;
        }
        
        if (this._content.size === 0) {
            this._bounds = null;
            this._boundsDirty = false;
            return null;
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const cell of this._content.values()) {
            minX = Math.min(minX, cell.x);
            minY = Math.min(minY, cell.y);
            maxX = Math.max(maxX, cell.x);
            maxY = Math.max(maxY, cell.y);
        }
        
        this._bounds = { minX, minY, maxX, maxY };
        this._boundsDirty = false;
        
        return this._bounds;
    }
    
    // ==========================================
    // DIRTY TRACKING
    // ==========================================
    
    /**
     * Get dirty cells
     * @returns {Set<string>}
     */
    getDirtyCells() {
        return this._dirtyCells;
    }
    
    /**
     * Clear dirty state
     */
    clearDirty() {
        this._dirtyCells.clear();
    }
    
    /**
     * Mark all cells dirty
     */
    markAllDirty() {
        for (const key of this._content.keys()) {
            this._dirtyCells.add(key);
        }
    }
    
    // ==========================================
    // PROPERTIES
    // ==========================================
    
    /**
     * Set opacity
     * @param {number} value 
     */
    setOpacity(value) {
        const clamped = Math.max(0, Math.min(1, value));
        if (this.opacity !== clamped) {
            this.opacity = clamped;
            this.markAllDirty();
            this.emit('opacitychange', { opacity: clamped });
        }
    }
    
    /**
     * Set blend mode
     * @param {string} mode 
     */
    setBlendMode(mode) {
        if (this.blendMode !== mode) {
            this.blendMode = mode;
            this.markAllDirty();
            this.emit('blendmodechange', { blendMode: mode });
        }
    }
    
    /**
     * Set visibility
     * @param {boolean} visible 
     */
    setVisible(visible) {
        if (this.visible !== visible) {
            this.visible = visible;
            this.markAllDirty();
            this.emit('visibilitychange', { visible });
        }
    }
    
    /**
     * Toggle visibility
     */
    toggleVisible() {
        this.setVisible(!this.visible);
    }
    
    /**
     * Set locked
     * @param {boolean} locked 
     */
    setLocked(locked) {
        if (this.locked !== locked) {
            this.locked = locked;
            this.emit('lockchange', { locked });
        }
    }
    
    // ==========================================
    // SERIALIZATION
    // ==========================================
    
    /**
     * Serialize layer
     * @returns {object}
     */
    toJSON() {
        const cells = [];
        for (const cell of this._content.values()) {
            cells.push(cell.toJSON());
        }
        
        return {
            id: this.id,
            name: this.name,
            visible: this.visible,
            locked: this.locked,
            opacity: this.opacity,
            blendMode: this.blendMode,
            clipMask: this.clipMask,
            cells
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        this.id = data.id;
        this.name = data.name;
        this.visible = data.visible !== false;
        this.locked = data.locked || false;
        this.opacity = data.opacity !== undefined ? data.opacity : 1;
        this.blendMode = data.blendMode || BlendModes.NORMAL;
        this.clipMask = data.clipMask || null;
        
        this._content.clear();
        if (data.cells) {
            for (const cellData of data.cells) {
                const cell = LayerCell.fromJSON(cellData);
                this._content.set(`${cell.x},${cell.y}`, cell);
            }
        }
        
        this._boundsDirty = true;
        this.markAllDirty();
    }
    
    /**
     * Clone layer
     * @returns {CompositingLayer}
     */
    clone() {
        const cloned = new CompositingLayer({
            name: this.name + ' (copy)',
            visible: this.visible,
            locked: this.locked,
            opacity: this.opacity,
            blendMode: this.blendMode,
            clipMask: this.clipMask
        });
        
        for (const cell of this._content.values()) {
            cloned._content.set(`${cell.x},${cell.y}`, cell.clone());
        }
        
        cloned._boundsDirty = true;
        
        return cloned;
    }
}

// ==========================================
// LAYER CELL
// ==========================================

/**
 * LayerCell - Single cell content
 */
export class LayerCell {
    /**
     * Create a layer cell
     * @param {number} x 
     * @param {number} y 
     * @param {string} char 
     * @param {string} [color]
     * @param {object} [metadata]
     */
    constructor(x, y, char, color = null, metadata = null) {
        /** @type {number} */
        this.x = x;
        
        /** @type {number} */
        this.y = y;
        
        /** @type {string} */
        this.char = char;
        
        /** @type {string|null} */
        this.color = color;
        
        /** @type {object|null} */
        this.metadata = metadata;
    }
    
    /**
     * Serialize
     * @returns {object}
     */
    toJSON() {
        const data = {
            x: this.x,
            y: this.y,
            char: this.char
        };
        
        if (this.color) data.color = this.color;
        if (this.metadata) data.metadata = this.metadata;
        
        return data;
    }
    
    /**
     * Create from JSON
     * @param {object} data 
     * @returns {LayerCell}
     */
    static fromJSON(data) {
        return new LayerCell(data.x, data.y, data.char, data.color, data.metadata);
    }
    
    /**
     * Clone cell
     * @returns {LayerCell}
     */
    clone() {
        return new LayerCell(
            this.x, 
            this.y, 
            this.char, 
            this.color,
            this.metadata ? { ...this.metadata } : null
        );
    }
}

// ==========================================
// LAYER COMPOSITOR
// ==========================================

/**
 * LayerCompositor - Composites multiple layers
 */
export class LayerCompositor extends EventEmitter {
    constructor() {
        super();
        
        /** @type {CompositingLayer[]} */
        this._layers = [];
        
        /** @type {Map<string, CompositedCell>} */
        this._composited = new Map();
        
        /** @type {Set<string>} */
        this._dirtyCells = new Set();
        
        /** @type {boolean} */
        this._fullCompositeNeeded = true;
        
        /** @type {string|null} Background color */
        this.backgroundColor = null;
        
        /** @type {string} Background character */
        this.backgroundChar = ' ';
    }
    
    // ==========================================
    // LAYER MANAGEMENT
    // ==========================================
    
    /**
     * Add layer
     * @param {CompositingLayer} layer 
     * @param {number} [index] - Insert index
     * @returns {CompositingLayer}
     */
    addLayer(layer, index = null) {
        if (index === null) {
            this._layers.push(layer);
        } else {
            this._layers.splice(index, 0, layer);
        }
        
        // Listen for changes
        layer.on('cellchange', () => this._onLayerChange(layer));
        layer.on('opacitychange', () => this._markLayerDirty(layer));
        layer.on('blendmodechange', () => this._markLayerDirty(layer));
        layer.on('visibilitychange', () => this._markLayerDirty(layer));
        
        this._fullCompositeNeeded = true;
        this.emit('layeradded', { layer, index });
        
        return layer;
    }
    
    /**
     * Remove layer
     * @param {CompositingLayer|string} layerOrId 
     * @returns {boolean}
     */
    removeLayer(layerOrId) {
        const index = typeof layerOrId === 'string'
            ? this._layers.findIndex(l => l.id === layerOrId)
            : this._layers.indexOf(layerOrId);
        
        if (index !== -1) {
            const layer = this._layers.splice(index, 1)[0];
            layer.off('cellchange');
            layer.off('opacitychange');
            layer.off('blendmodechange');
            layer.off('visibilitychange');
            
            this._fullCompositeNeeded = true;
            this.emit('layerremoved', { layer, index });
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Get layer by index
     * @param {number} index 
     * @returns {CompositingLayer|null}
     */
    getLayerAt(index) {
        return this._layers[index] || null;
    }
    
    /**
     * Get layer by ID
     * @param {string} id 
     * @returns {CompositingLayer|null}
     */
    getLayerById(id) {
        return this._layers.find(l => l.id === id) || null;
    }
    
    /**
     * Get layer index
     * @param {CompositingLayer} layer 
     * @returns {number}
     */
    getLayerIndex(layer) {
        return this._layers.indexOf(layer);
    }
    
    /**
     * Move layer to index
     * @param {CompositingLayer|string} layerOrId 
     * @param {number} newIndex 
     */
    moveLayer(layerOrId, newIndex) {
        const currentIndex = typeof layerOrId === 'string'
            ? this._layers.findIndex(l => l.id === layerOrId)
            : this._layers.indexOf(layerOrId);
        
        if (currentIndex !== -1 && currentIndex !== newIndex) {
            const layer = this._layers.splice(currentIndex, 1)[0];
            this._layers.splice(newIndex, 0, layer);
            
            this._fullCompositeNeeded = true;
            this.emit('layerreordered', { layer, oldIndex: currentIndex, newIndex });
        }
    }
    
    /**
     * Get all layers
     * @returns {CompositingLayer[]}
     */
    getLayers() {
        return [...this._layers];
    }
    
    /**
     * Get layer count
     * @returns {number}
     */
    getLayerCount() {
        return this._layers.length;
    }
    
    // ==========================================
    // COMPOSITING
    // ==========================================
    
    /**
     * Handle layer change
     * @private
     */
    _onLayerChange(layer) {
        const dirty = layer.getDirtyCells();
        for (const key of dirty) {
            this._dirtyCells.add(key);
        }
        layer.clearDirty();
    }
    
    /**
     * Mark all cells from layer as dirty
     * @private
     */
    _markLayerDirty(layer) {
        layer.markAllDirty();
        const dirty = layer.getDirtyCells();
        for (const key of dirty) {
            this._dirtyCells.add(key);
        }
        layer.clearDirty();
    }
    
    /**
     * Composite all layers
     * @param {object} [bounds] - Optional bounds to composite
     * @returns {Map<string, CompositedCell>}
     */
    composite(bounds = null) {
        if (this._fullCompositeNeeded) {
            return this._fullComposite(bounds);
        }
        
        // Incremental composite of dirty cells
        for (const key of this._dirtyCells) {
            const [x, y] = key.split(',').map(Number);
            this._compositeCellAt(x, y);
        }
        
        this._dirtyCells.clear();
        
        return this._composited;
    }
    
    /**
     * Full composite of all layers
     * @private
     */
    _fullComposite(bounds) {
        this._composited.clear();
        
        // Find all cell positions across all layers
        const positions = new Set();
        
        for (const layer of this._layers) {
            if (!layer.visible) continue;
            
            layer.forEachCell((cell) => {
                if (bounds) {
                    if (cell.x < bounds.minX || cell.x > bounds.maxX ||
                        cell.y < bounds.minY || cell.y > bounds.maxY) {
                        return;
                    }
                }
                positions.add(`${cell.x},${cell.y}`);
            });
        }
        
        // Composite each position
        for (const key of positions) {
            const [x, y] = key.split(',').map(Number);
            this._compositeCellAt(x, y);
        }
        
        this._dirtyCells.clear();
        this._fullCompositeNeeded = false;
        
        return this._composited;
    }
    
    /**
     * Composite single cell position
     * @private
     */
    _compositeCellAt(x, y) {
        const key = `${x},${y}`;
        let result = null;
        
        // Start with background if set
        if (this.backgroundColor) {
            result = {
                char: this.backgroundChar,
                color: parseColor(this.backgroundColor),
                intensity: 0
            };
        }
        
        // Composite layers from bottom to top
        for (const layer of this._layers) {
            if (!layer.visible || layer.opacity === 0) continue;
            
            const cell = layer.getCell(x, y);
            if (!cell || cell.char === ' ' || cell.char === '') continue;
            
            const topColor = cell.color ? parseColor(cell.color) : { r: 255, g: 255, b: 255, a: 1 };
            const topIntensity = getCharIntensity(cell.char);
            
            if (result === null) {
                // First visible cell
                result = {
                    char: cell.char,
                    color: topColor,
                    intensity: topIntensity
                };
            } else {
                // Blend with existing result
                result = this._blendCells(result, {
                    char: cell.char,
                    color: topColor,
                    intensity: topIntensity
                }, layer.blendMode, layer.opacity);
            }
        }
        
        if (result && result.char !== ' ' && result.char !== '') {
            this._composited.set(key, new CompositedCell(
                x, y,
                result.char,
                result.color ? colorToString(result.color) : null
            ));
        } else {
            this._composited.delete(key);
        }
    }
    
    /**
     * Blend two cell results
     * @private
     */
    _blendCells(bottom, top, blendMode, opacity) {
        let resultChar = top.char;
        let resultColor = top.color;
        let resultIntensity = top.intensity;
        
        switch (blendMode) {
            case BlendModes.BEHIND:
                // Draw behind - use bottom if it exists
                if (bottom.char && bottom.char !== ' ') {
                    return bottom;
                }
                break;
                
            case BlendModes.ERASE:
                // Erase - remove where top exists
                if (top.char && top.char !== ' ') {
                    return {
                        char: ' ',
                        color: null,
                        intensity: 0
                    };
                }
                return bottom;
                
            case BlendModes.XOR:
                // XOR - only show where one or the other exists, not both
                if (bottom.char !== ' ' && top.char !== ' ') {
                    return {
                        char: ' ',
                        color: null,
                        intensity: 0
                    };
                }
                break;
                
            case BlendModes.MULTIPLY:
            case BlendModes.SCREEN:
            case BlendModes.OVERLAY:
            case BlendModes.DARKEN:
            case BlendModes.LIGHTEN:
            case BlendModes.DIFFERENCE:
            case BlendModes.ADD:
                // Intensity-based blending for character
                resultIntensity = this._blendIntensities(
                    bottom.intensity, 
                    top.intensity, 
                    blendMode
                );
                resultChar = charFromIntensity(resultIntensity);
                break;
        }
        
        // Blend colors
        resultColor = blendColors(bottom.color, top.color, blendMode, opacity);
        
        return {
            char: resultChar,
            color: resultColor,
            intensity: resultIntensity
        };
    }
    
    /**
     * Blend intensity values
     * @private
     */
    _blendIntensities(bottom, top, mode) {
        switch (mode) {
            case BlendModes.MULTIPLY:
                return bottom * top;
            case BlendModes.SCREEN:
                return 1 - (1 - bottom) * (1 - top);
            case BlendModes.OVERLAY:
                return bottom < 0.5
                    ? 2 * bottom * top
                    : 1 - 2 * (1 - bottom) * (1 - top);
            case BlendModes.DARKEN:
                return Math.min(bottom, top);
            case BlendModes.LIGHTEN:
                return Math.max(bottom, top);
            case BlendModes.DIFFERENCE:
                return Math.abs(bottom - top);
            case BlendModes.ADD:
                return Math.min(1, bottom + top);
            default:
                return top;
        }
    }
    
    /**
     * Get composited cell
     * @param {number} x 
     * @param {number} y 
     * @returns {CompositedCell|null}
     */
    getCompositedCell(x, y) {
        return this._composited.get(`${x},${y}`) || null;
    }
    
    /**
     * Get all composited cells
     * @returns {CompositedCell[]}
     */
    getAllCompositedCells() {
        return [...this._composited.values()];
    }
    
    /**
     * Get composited bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}|null}
     */
    getBounds() {
        if (this._composited.size === 0) return null;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const cell of this._composited.values()) {
            minX = Math.min(minX, cell.x);
            minY = Math.min(minY, cell.y);
            maxX = Math.max(maxX, cell.x);
            maxY = Math.max(maxY, cell.y);
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Clear all
     */
    clear() {
        this._layers = [];
        this._composited.clear();
        this._dirtyCells.clear();
        this._fullCompositeNeeded = true;
        this.emit('clear');
    }
    
    /**
     * Force full recomposite
     */
    invalidate() {
        this._fullCompositeNeeded = true;
    }
}

// ==========================================
// COMPOSITED CELL
// ==========================================

/**
 * CompositedCell - Result of layer compositing
 */
export class CompositedCell {
    constructor(x, y, char, color) {
        /** @type {number} */
        this.x = x;
        
        /** @type {number} */
        this.y = y;
        
        /** @type {string} */
        this.char = char;
        
        /** @type {string|null} */
        this.color = color;
    }
}

export default {
    BlendModes,
    getCharIntensity,
    charFromIntensity,
    parseColor,
    colorToString,
    blendColors,
    CompositingLayer,
    LayerCell,
    LayerCompositor,
    CompositedCell
};
