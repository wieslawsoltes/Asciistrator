/**
 * Asciistrator - Selection System
 * 
 * Selection handles, bounding boxes, and selection management.
 */

import { Vector2D } from '../core/math/vector2d.js';
import { Matrix3x3 } from '../core/math/matrix3x3.js';
import { EventEmitter } from '../utils/events.js';

// ==========================================
// SELECTION HANDLE TYPES
// ==========================================

export const HandleType = {
    // Corner handles
    TOP_LEFT: 'topLeft',
    TOP_RIGHT: 'topRight',
    BOTTOM_LEFT: 'bottomLeft',
    BOTTOM_RIGHT: 'bottomRight',
    
    // Edge handles
    TOP: 'top',
    RIGHT: 'right',
    BOTTOM: 'bottom',
    LEFT: 'left',
    
    // Center handles
    CENTER: 'center',
    ROTATION: 'rotation',
    
    // Anchor point handles
    ANCHOR: 'anchor',
    HANDLE_IN: 'handleIn',
    HANDLE_OUT: 'handleOut'
};

export const HandleCursor = {
    [HandleType.TOP_LEFT]: 'nwse-resize',
    [HandleType.TOP_RIGHT]: 'nesw-resize',
    [HandleType.BOTTOM_LEFT]: 'nesw-resize',
    [HandleType.BOTTOM_RIGHT]: 'nwse-resize',
    [HandleType.TOP]: 'ns-resize',
    [HandleType.RIGHT]: 'ew-resize',
    [HandleType.BOTTOM]: 'ns-resize',
    [HandleType.LEFT]: 'ew-resize',
    [HandleType.CENTER]: 'move',
    [HandleType.ROTATION]: 'crosshair',
    [HandleType.ANCHOR]: 'move',
    [HandleType.HANDLE_IN]: 'pointer',
    [HandleType.HANDLE_OUT]: 'pointer'
};

// ==========================================
// SELECTION HANDLE
// ==========================================

/**
 * SelectionHandle - A draggable handle for transforming objects
 */
export class SelectionHandle {
    /**
     * Create a selection handle
     * @param {object} options
     */
    constructor(options = {}) {
        /** @type {string} Handle type */
        this.type = options.type || HandleType.CENTER;
        
        /** @type {number} X position (screen coords) */
        this.x = options.x || 0;
        
        /** @type {number} Y position (screen coords) */
        this.y = options.y || 0;
        
        /** @type {number} Handle size */
        this.size = options.size || 6;
        
        /** @type {string} Handle shape: 'square', 'circle', 'diamond' */
        this.shape = options.shape || 'square';
        
        /** @type {string} Fill color */
        this.fillColor = options.fillColor || '#ffffff';
        
        /** @type {string} Stroke color */
        this.strokeColor = options.strokeColor || '#0066cc';
        
        /** @type {boolean} Is handle visible */
        this.visible = options.visible !== false;
        
        /** @type {boolean} Is handle active/hoverable */
        this.active = options.active !== false;
        
        /** @type {*} Custom data */
        this.data = options.data || null;
        
        /** @type {number} Index for path handles */
        this.index = options.index || 0;
    }
    
    /**
     * Get cursor for this handle
     * @returns {string}
     */
    getCursor() {
        return HandleCursor[this.type] || 'default';
    }
    
    /**
     * Get position as vector
     * @returns {Vector2D}
     */
    getPosition() {
        return new Vector2D(this.x, this.y);
    }
    
    /**
     * Set position
     * @param {number} x 
     * @param {number} y 
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Hit test handle
     * @param {number} x 
     * @param {number} y 
     * @param {number} [tolerance=0]
     * @returns {boolean}
     */
    hitTest(x, y, tolerance = 0) {
        if (!this.visible || !this.active) return false;
        
        const halfSize = this.size / 2 + tolerance;
        
        return Math.abs(x - this.x) <= halfSize && 
               Math.abs(y - this.y) <= halfSize;
    }
    
    /**
     * Get bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getBounds() {
        const halfSize = this.size / 2;
        return {
            minX: this.x - halfSize,
            minY: this.y - halfSize,
            maxX: this.x + halfSize,
            maxY: this.y + halfSize
        };
    }
    
    /**
     * Rasterize handle for ASCII display
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        if (!this.visible) return [];
        
        const cells = [];
        const char = this._getHandleChar();
        
        cells.push({
            x: Math.round(this.x),
            y: Math.round(this.y),
            char,
            color: this.strokeColor
        });
        
        return cells;
    }
    
    /**
     * Get handle character based on type
     * @private
     */
    _getHandleChar() {
        switch (this.shape) {
            case 'circle': return '○';
            case 'diamond': return '◇';
            case 'filled-circle': return '●';
            case 'filled-diamond': return '◆';
            case 'filled-square': return '■';
            case 'cross': return '╳';
            case 'plus': return '✚';
            default: return '□';
        }
    }
    
    /**
     * Clone handle
     * @returns {SelectionHandle}
     */
    clone() {
        return new SelectionHandle({
            type: this.type,
            x: this.x,
            y: this.y,
            size: this.size,
            shape: this.shape,
            fillColor: this.fillColor,
            strokeColor: this.strokeColor,
            visible: this.visible,
            active: this.active,
            data: this.data,
            index: this.index
        });
    }
}

// ==========================================
// BOUNDING BOX
// ==========================================

/**
 * BoundingBox - Visual bounding box with handles
 */
export class BoundingBox {
    /**
     * Create a bounding box
     * @param {object} [options]
     */
    constructor(options = {}) {
        /** @type {number} */
        this.minX = options.minX || 0;
        
        /** @type {number} */
        this.minY = options.minY || 0;
        
        /** @type {number} */
        this.maxX = options.maxX || 0;
        
        /** @type {number} */
        this.maxY = options.maxY || 0;
        
        /** @type {number} Rotation in radians */
        this.rotation = options.rotation || 0;
        
        /** @type {{x: number, y: number}} Rotation center */
        this.center = options.center || null;
        
        /** @type {SelectionHandle[]} */
        this.handles = [];
        
        /** @type {boolean} Show corner handles */
        this.showCorners = options.showCorners !== false;
        
        /** @type {boolean} Show edge handles */
        this.showEdges = options.showEdges !== false;
        
        /** @type {boolean} Show rotation handle */
        this.showRotation = options.showRotation || false;
        
        /** @type {string} Stroke color */
        this.strokeColor = options.strokeColor || '#0066cc';
        
        /** @type {string} Handle fill color */
        this.handleFillColor = options.handleFillColor || '#ffffff';
        
        /** @type {string} Handle stroke color */
        this.handleStrokeColor = options.handleStrokeColor || '#0066cc';
        
        /** @type {number} Handle size */
        this.handleSize = options.handleSize || 6;
        
        /** @type {number} Rotation handle distance */
        this.rotationHandleDistance = options.rotationHandleDistance || 15;
        
        this._updateHandles();
    }
    
    /**
     * Set bounds
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     */
    setBounds(minX, minY, maxX, maxY) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        this._updateHandles();
    }
    
    /**
     * Set from object bounds
     * @param {{minX: number, minY: number, maxX: number, maxY: number}} bounds 
     */
    fromBounds(bounds) {
        this.setBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
    }
    
    /**
     * Get width
     * @returns {number}
     */
    getWidth() {
        return this.maxX - this.minX;
    }
    
    /**
     * Get height
     * @returns {number}
     */
    getHeight() {
        return this.maxY - this.minY;
    }
    
    /**
     * Get center point
     * @returns {{x: number, y: number}}
     */
    getCenter() {
        if (this.center) return this.center;
        return {
            x: (this.minX + this.maxX) / 2,
            y: (this.minY + this.maxY) / 2
        };
    }
    
    /**
     * Update handle positions
     * @private
     */
    _updateHandles() {
        this.handles = [];
        
        const center = this.getCenter();
        const hw = this.getWidth() / 2;
        const hh = this.getHeight() / 2;
        
        // Helper to rotate point around center
        const rotatePoint = (x, y) => {
            if (this.rotation === 0) return { x, y };
            
            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);
            const dx = x - center.x;
            const dy = y - center.y;
            
            return {
                x: center.x + dx * cos - dy * sin,
                y: center.y + dx * sin + dy * cos
            };
        };
        
        // Corner handles
        if (this.showCorners) {
            const corners = [
                { type: HandleType.TOP_LEFT, x: this.minX, y: this.minY },
                { type: HandleType.TOP_RIGHT, x: this.maxX, y: this.minY },
                { type: HandleType.BOTTOM_RIGHT, x: this.maxX, y: this.maxY },
                { type: HandleType.BOTTOM_LEFT, x: this.minX, y: this.maxY }
            ];
            
            for (const corner of corners) {
                const pos = rotatePoint(corner.x, corner.y);
                this.handles.push(new SelectionHandle({
                    type: corner.type,
                    x: pos.x,
                    y: pos.y,
                    size: this.handleSize,
                    shape: 'square',
                    fillColor: this.handleFillColor,
                    strokeColor: this.handleStrokeColor
                }));
            }
        }
        
        // Edge handles
        if (this.showEdges) {
            const edges = [
                { type: HandleType.TOP, x: center.x, y: this.minY },
                { type: HandleType.RIGHT, x: this.maxX, y: center.y },
                { type: HandleType.BOTTOM, x: center.x, y: this.maxY },
                { type: HandleType.LEFT, x: this.minX, y: center.y }
            ];
            
            for (const edge of edges) {
                const pos = rotatePoint(edge.x, edge.y);
                this.handles.push(new SelectionHandle({
                    type: edge.type,
                    x: pos.x,
                    y: pos.y,
                    size: this.handleSize,
                    shape: 'square',
                    fillColor: this.handleFillColor,
                    strokeColor: this.handleStrokeColor
                }));
            }
        }
        
        // Rotation handle
        if (this.showRotation) {
            const rotPos = rotatePoint(center.x, this.minY - this.rotationHandleDistance);
            this.handles.push(new SelectionHandle({
                type: HandleType.ROTATION,
                x: rotPos.x,
                y: rotPos.y,
                size: this.handleSize,
                shape: 'circle',
                fillColor: this.handleFillColor,
                strokeColor: this.handleStrokeColor
            }));
        }
    }
    
    /**
     * Hit test bounding box border
     * @param {number} x 
     * @param {number} y 
     * @param {number} [tolerance=2]
     * @returns {boolean}
     */
    hitTestBorder(x, y, tolerance = 2) {
        // Check if near edges
        const center = this.getCenter();
        const hw = this.getWidth() / 2;
        const hh = this.getHeight() / 2;
        
        // Transform point to local (unrotated) coordinates
        let localX = x, localY = y;
        if (this.rotation !== 0) {
            const cos = Math.cos(-this.rotation);
            const sin = Math.sin(-this.rotation);
            const dx = x - center.x;
            const dy = y - center.y;
            localX = center.x + dx * cos - dy * sin;
            localY = center.y + dx * sin + dy * cos;
        }
        
        // Check if on edge
        const onLeft = Math.abs(localX - this.minX) <= tolerance && localY >= this.minY && localY <= this.maxY;
        const onRight = Math.abs(localX - this.maxX) <= tolerance && localY >= this.minY && localY <= this.maxY;
        const onTop = Math.abs(localY - this.minY) <= tolerance && localX >= this.minX && localX <= this.maxX;
        const onBottom = Math.abs(localY - this.maxY) <= tolerance && localX >= this.minX && localX <= this.maxX;
        
        return onLeft || onRight || onTop || onBottom;
    }
    
    /**
     * Hit test handles
     * @param {number} x 
     * @param {number} y 
     * @param {number} [tolerance=0]
     * @returns {SelectionHandle|null}
     */
    hitTestHandle(x, y, tolerance = 0) {
        for (const handle of this.handles) {
            if (handle.hitTest(x, y, tolerance)) {
                return handle;
            }
        }
        return null;
    }
    
    /**
     * Hit test interior
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    hitTestInterior(x, y) {
        const center = this.getCenter();
        
        // Transform point to local coordinates
        let localX = x, localY = y;
        if (this.rotation !== 0) {
            const cos = Math.cos(-this.rotation);
            const sin = Math.sin(-this.rotation);
            const dx = x - center.x;
            const dy = y - center.y;
            localX = center.x + dx * cos - dy * sin;
            localY = center.y + dx * sin + dy * cos;
        }
        
        return localX >= this.minX && localX <= this.maxX &&
               localY >= this.minY && localY <= this.maxY;
    }
    
    /**
     * Rasterize bounding box
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        const cells = [];
        const center = this.getCenter();
        
        // Get corner positions
        const corners = [
            { x: this.minX, y: this.minY },
            { x: this.maxX, y: this.minY },
            { x: this.maxX, y: this.maxY },
            { x: this.minX, y: this.maxY }
        ];
        
        // Rotate corners
        if (this.rotation !== 0) {
            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);
            
            for (const corner of corners) {
                const dx = corner.x - center.x;
                const dy = corner.y - center.y;
                corner.x = center.x + dx * cos - dy * sin;
                corner.y = center.y + dx * sin + dy * cos;
            }
        }
        
        // Draw edges using dashed characters
        const dashChars = ['┄', '┆'];
        
        for (let i = 0; i < 4; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 4];
            
            const edgeCells = this._rasterizeLine(
                p1.x, p1.y, p2.x, p2.y, 
                i % 2 === 0 ? dashChars[0] : dashChars[1]
            );
            cells.push(...edgeCells);
        }
        
        // Draw handles
        for (const handle of this.handles) {
            cells.push(...handle.rasterize());
        }
        
        // Draw rotation line
        if (this.showRotation) {
            const rotHandle = this.handles.find(h => h.type === HandleType.ROTATION);
            if (rotHandle) {
                const topCenter = {
                    x: (corners[0].x + corners[1].x) / 2,
                    y: (corners[0].y + corners[1].y) / 2
                };
                
                const lineCells = this._rasterizeLine(
                    topCenter.x, topCenter.y,
                    rotHandle.x, rotHandle.y,
                    '│'
                );
                cells.push(...lineCells);
            }
        }
        
        return cells;
    }
    
    /**
     * Rasterize line
     * @private
     */
    _rasterizeLine(x0, y0, x1, y1, char) {
        const cells = [];
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        let x = Math.round(x0);
        let y = Math.round(y0);
        const endX = Math.round(x1);
        const endY = Math.round(y1);
        
        while (true) {
            cells.push({
                x, y,
                char,
                color: this.strokeColor
            });
            
            if (x === endX && y === endY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return cells;
    }
    
    /**
     * Clone bounding box
     * @returns {BoundingBox}
     */
    clone() {
        return new BoundingBox({
            minX: this.minX,
            minY: this.minY,
            maxX: this.maxX,
            maxY: this.maxY,
            rotation: this.rotation,
            center: this.center ? { ...this.center } : null,
            showCorners: this.showCorners,
            showEdges: this.showEdges,
            showRotation: this.showRotation,
            strokeColor: this.strokeColor,
            handleFillColor: this.handleFillColor,
            handleStrokeColor: this.handleStrokeColor,
            handleSize: this.handleSize,
            rotationHandleDistance: this.rotationHandleDistance
        });
    }
}

// ==========================================
// PATH HANDLES
// ==========================================

/**
 * PathHandles - Handles for editing path anchor points
 */
export class PathHandles {
    /**
     * Create path handles
     * @param {object} [options]
     */
    constructor(options = {}) {
        /** @type {Path} Reference to path */
        this.path = options.path || null;
        
        /** @type {SelectionHandle[]} Anchor handles */
        this.anchorHandles = [];
        
        /** @type {SelectionHandle[]} Control handles */
        this.controlHandles = [];
        
        /** @type {number|null} Selected anchor index */
        this.selectedAnchor = options.selectedAnchor || null;
        
        /** @type {number} Anchor handle size */
        this.anchorSize = options.anchorSize || 6;
        
        /** @type {number} Control handle size */
        this.controlSize = options.controlSize || 4;
        
        /** @type {string} Anchor color */
        this.anchorColor = options.anchorColor || '#0066cc';
        
        /** @type {string} Control color */
        this.controlColor = options.controlColor || '#cc6600';
        
        /** @type {string} Selected color */
        this.selectedColor = options.selectedColor || '#cc0066';
        
        /** @type {boolean} Show control handles */
        this.showControls = options.showControls !== false;
        
        if (this.path) {
            this._updateHandles();
        }
    }
    
    /**
     * Set path
     * @param {Path} path 
     */
    setPath(path) {
        this.path = path;
        this._updateHandles();
    }
    
    /**
     * Select anchor point
     * @param {number|null} index 
     */
    selectAnchor(index) {
        this.selectedAnchor = index;
        this._updateHandles();
    }
    
    /**
     * Update handles from path
     * @private
     */
    _updateHandles() {
        this.anchorHandles = [];
        this.controlHandles = [];
        
        if (!this.path) return;
        
        const transform = this.path.getWorldTransform();
        
        for (let i = 0; i < this.path.points.length; i++) {
            const point = this.path.points[i];
            const isSelected = this.selectedAnchor === i;
            
            // Transform anchor point to world coords
            const worldPos = transform.transformPoint({ x: point.x, y: point.y });
            
            // Create anchor handle
            this.anchorHandles.push(new SelectionHandle({
                type: HandleType.ANCHOR,
                x: worldPos.x,
                y: worldPos.y,
                size: this.anchorSize,
                shape: isSelected ? 'filled-square' : 'square',
                strokeColor: isSelected ? this.selectedColor : this.anchorColor,
                fillColor: isSelected ? this.selectedColor : '#ffffff',
                index: i,
                data: { anchorIndex: i }
            }));
            
            // Create control handles for selected anchor
            if (isSelected && this.showControls) {
                if (point.handleIn) {
                    const handleInWorld = transform.transformPoint(point.handleIn);
                    this.controlHandles.push(new SelectionHandle({
                        type: HandleType.HANDLE_IN,
                        x: handleInWorld.x,
                        y: handleInWorld.y,
                        size: this.controlSize,
                        shape: 'circle',
                        strokeColor: this.controlColor,
                        fillColor: '#ffffff',
                        index: i,
                        data: { anchorIndex: i, handleType: 'in' }
                    }));
                }
                
                if (point.handleOut) {
                    const handleOutWorld = transform.transformPoint(point.handleOut);
                    this.controlHandles.push(new SelectionHandle({
                        type: HandleType.HANDLE_OUT,
                        x: handleOutWorld.x,
                        y: handleOutWorld.y,
                        size: this.controlSize,
                        shape: 'circle',
                        strokeColor: this.controlColor,
                        fillColor: '#ffffff',
                        index: i,
                        data: { anchorIndex: i, handleType: 'out' }
                    }));
                }
            }
        }
    }
    
    /**
     * Get all handles
     * @returns {SelectionHandle[]}
     */
    getHandles() {
        return [...this.anchorHandles, ...this.controlHandles];
    }
    
    /**
     * Hit test handles
     * @param {number} x 
     * @param {number} y 
     * @param {number} [tolerance=0]
     * @returns {SelectionHandle|null}
     */
    hitTestHandle(x, y, tolerance = 0) {
        // Check control handles first (they're on top)
        for (const handle of this.controlHandles) {
            if (handle.hitTest(x, y, tolerance)) {
                return handle;
            }
        }
        
        // Then anchor handles
        for (const handle of this.anchorHandles) {
            if (handle.hitTest(x, y, tolerance)) {
                return handle;
            }
        }
        
        return null;
    }
    
    /**
     * Rasterize path handles
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        const cells = [];
        
        if (!this.path || this.selectedAnchor === null) {
            // Just draw anchor points
            for (const handle of this.anchorHandles) {
                cells.push(...handle.rasterize());
            }
            return cells;
        }
        
        // Draw control handle lines
        const selectedAnchorHandle = this.anchorHandles[this.selectedAnchor];
        if (selectedAnchorHandle) {
            for (const controlHandle of this.controlHandles) {
                // Draw line from anchor to control handle
                const lineCells = this._rasterizeLine(
                    selectedAnchorHandle.x,
                    selectedAnchorHandle.y,
                    controlHandle.x,
                    controlHandle.y
                );
                cells.push(...lineCells.map(c => ({
                    ...c,
                    color: this.controlColor
                })));
            }
        }
        
        // Draw control handles
        for (const handle of this.controlHandles) {
            cells.push(...handle.rasterize());
        }
        
        // Draw anchor handles
        for (const handle of this.anchorHandles) {
            cells.push(...handle.rasterize());
        }
        
        return cells;
    }
    
    /**
     * Rasterize line
     * @private
     */
    _rasterizeLine(x0, y0, x1, y1) {
        const cells = [];
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        let x = Math.round(x0);
        let y = Math.round(y0);
        const endX = Math.round(x1);
        const endY = Math.round(y1);
        
        while (true) {
            cells.push({ x, y, char: '·' });
            
            if (x === endX && y === endY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return cells;
    }
    
    /**
     * Refresh handles
     */
    refresh() {
        this._updateHandles();
    }
}

// ==========================================
// SELECTION
// ==========================================

/**
 * Selection - Manages selected objects
 */
export class Selection extends EventEmitter {
    /**
     * Create a selection
     */
    constructor() {
        super();
        
        /** @type {SceneObject[]} */
        this.objects = [];
        
        /** @type {BoundingBox|null} */
        this.boundingBox = null;
        
        /** @type {PathHandles|null} */
        this.pathHandles = null;
        
        /** @type {boolean} Show bounding box */
        this.showBoundingBox = true;
        
        /** @type {boolean} Show path handles when single path selected */
        this.showPathHandles = true;
        
        /** @type {boolean} Allow rotation */
        this.allowRotation = true;
    }
    
    /**
     * Select object(s)
     * @param {SceneObject|SceneObject[]} objects 
     * @param {boolean} [add=false] Add to selection
     */
    select(objects, add = false) {
        const objArray = Array.isArray(objects) ? objects : [objects];
        
        if (!add) {
            this.objects = objArray.filter(o => o && !o.locked);
        } else {
            for (const obj of objArray) {
                if (obj && !obj.locked && !this.objects.includes(obj)) {
                    this.objects.push(obj);
                }
            }
        }
        
        this._updateBoundingBox();
        this._updatePathHandles();
        
        this.emit('changed', { selection: this.objects });
    }
    
    /**
     * Deselect object(s)
     * @param {SceneObject|SceneObject[]} [objects] If not provided, deselects all
     */
    deselect(objects) {
        if (!objects) {
            this.objects = [];
        } else {
            const objArray = Array.isArray(objects) ? objects : [objects];
            this.objects = this.objects.filter(o => !objArray.includes(o));
        }
        
        this._updateBoundingBox();
        this._updatePathHandles();
        
        this.emit('changed', { selection: this.objects });
    }
    
    /**
     * Toggle object selection
     * @param {SceneObject} object 
     */
    toggle(object) {
        if (this.isSelected(object)) {
            this.deselect(object);
        } else {
            this.select(object, true);
        }
    }
    
    /**
     * Select all objects
     * @param {SceneObject[]} objects 
     */
    selectAll(objects) {
        this.select(objects.filter(o => !o.locked));
    }
    
    /**
     * Check if object is selected
     * @param {SceneObject} object 
     * @returns {boolean}
     */
    isSelected(object) {
        return this.objects.includes(object);
    }
    
    /**
     * Check if selection is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.objects.length === 0;
    }
    
    /**
     * Get selection count
     * @returns {number}
     */
    getCount() {
        return this.objects.length;
    }
    
    /**
     * Get first selected object
     * @returns {SceneObject|null}
     */
    getFirst() {
        return this.objects[0] || null;
    }
    
    /**
     * Get all selected objects
     * @returns {SceneObject[]}
     */
    getAll() {
        return [...this.objects];
    }
    
    /**
     * Get selection bounds
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}|null}
     */
    getBounds() {
        if (this.objects.length === 0) return null;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const obj of this.objects) {
            const bounds = obj.getBounds();
            minX = Math.min(minX, bounds.minX);
            minY = Math.min(minY, bounds.minY);
            maxX = Math.max(maxX, bounds.maxX);
            maxY = Math.max(maxY, bounds.maxY);
        }
        
        return { minX, minY, maxX, maxY };
    }
    
    /**
     * Get selection center
     * @returns {{x: number, y: number}|null}
     */
    getCenter() {
        const bounds = this.getBounds();
        if (!bounds) return null;
        
        return {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
        };
    }
    
    /**
     * Update bounding box
     * @private
     */
    _updateBoundingBox() {
        if (this.objects.length === 0 || !this.showBoundingBox) {
            this.boundingBox = null;
            return;
        }
        
        const bounds = this.getBounds();
        
        this.boundingBox = new BoundingBox({
            ...bounds,
            showRotation: this.allowRotation,
            rotation: this.objects.length === 1 ? this.objects[0].rotation : 0
        });
    }
    
    /**
     * Update path handles
     * @private
     */
    _updatePathHandles() {
        if (!this.showPathHandles || this.objects.length !== 1) {
            this.pathHandles = null;
            return;
        }
        
        const obj = this.objects[0];
        if (obj.type === 'path') {
            this.pathHandles = new PathHandles({ path: obj });
        } else {
            this.pathHandles = null;
        }
    }
    
    /**
     * Hit test selection handles
     * @param {number} x 
     * @param {number} y 
     * @returns {{type: string, handle: SelectionHandle}|null}
     */
    hitTestHandles(x, y) {
        // Test path handles first
        if (this.pathHandles) {
            const handle = this.pathHandles.hitTestHandle(x, y, 2);
            if (handle) {
                return { type: 'path', handle };
            }
        }
        
        // Then bounding box handles
        if (this.boundingBox) {
            const handle = this.boundingBox.hitTestHandle(x, y, 2);
            if (handle) {
                return { type: 'bounds', handle };
            }
        }
        
        return null;
    }
    
    /**
     * Hit test bounding box
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    hitTestBounds(x, y) {
        if (!this.boundingBox) return false;
        return this.boundingBox.hitTestInterior(x, y);
    }
    
    /**
     * Refresh selection visuals
     */
    refresh() {
        this._updateBoundingBox();
        if (this.pathHandles) {
            this.pathHandles.refresh();
        }
    }
    
    /**
     * Rasterize selection visuals
     * @returns {Array<{x: number, y: number, char: string, color: string}>}
     */
    rasterize() {
        const cells = [];
        
        // Draw bounding box
        if (this.boundingBox) {
            cells.push(...this.boundingBox.rasterize());
        }
        
        // Draw path handles
        if (this.pathHandles) {
            cells.push(...this.pathHandles.rasterize());
        }
        
        return cells;
    }
}

export default {
    HandleType,
    HandleCursor,
    SelectionHandle,
    BoundingBox,
    PathHandles,
    Selection
};
