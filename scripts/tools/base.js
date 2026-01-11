/**
 * Asciistrator - Base Tool Classes
 * 
 * Abstract base class for all drawing tools and the ToolManager.
 */

import { Vector2D } from '../core/math/vector2d.js';
import { EventEmitter } from '../utils/events.js';

// ==========================================
// TOOL STATE
// ==========================================

/**
 * ToolState - Tracks the current state of a tool interaction
 */
export class ToolState {
    constructor() {
        /** @type {boolean} Is mouse/pointer down */
        this.isDown = false;
        
        /** @type {boolean} Is dragging */
        this.isDragging = false;
        
        /** @type {Vector2D} Start position in world coordinates */
        this.startPoint = new Vector2D(0, 0);
        
        /** @type {Vector2D} Current position in world coordinates */
        this.currentPoint = new Vector2D(0, 0);
        
        /** @type {Vector2D} Previous position in world coordinates */
        this.previousPoint = new Vector2D(0, 0);
        
        /** @type {Vector2D} Start position in screen coordinates */
        this.startScreenPoint = new Vector2D(0, 0);
        
        /** @type {Vector2D} Current position in screen coordinates */
        this.currentScreenPoint = new Vector2D(0, 0);
        
        /** @type {number} Start time in ms */
        this.startTime = 0;
        
        /** @type {number} Button that was pressed (0=left, 1=middle, 2=right) */
        this.button = 0;
        
        /** @type {boolean} Shift key held */
        this.shiftKey = false;
        
        /** @type {boolean} Ctrl/Cmd key held */
        this.ctrlKey = false;
        
        /** @type {boolean} Alt key held */
        this.altKey = false;
        
        /** @type {boolean} Meta key held (Cmd on Mac, Win on Windows) */
        this.metaKey = false;
        
        /** @type {any} Tool-specific data */
        this.data = null;
    }

    /**
     * Update modifier keys from event
     * @param {PointerEvent|MouseEvent|KeyboardEvent} event
     */
    updateModifiers(event) {
        this.shiftKey = event.shiftKey;
        this.ctrlKey = event.ctrlKey;
        this.altKey = event.altKey;
        this.metaKey = event.metaKey;
    }

    /**
     * Get delta from start point
     * @returns {Vector2D}
     */
    getDelta() {
        return this.currentPoint.subtract(this.startPoint);
    }

    /**
     * Get delta from previous point
     * @returns {Vector2D}
     */
    getMoveDelta() {
        return this.currentPoint.subtract(this.previousPoint);
    }

    /**
     * Get distance from start point
     * @returns {number}
     */
    getDistance() {
        return this.currentPoint.distanceTo(this.startPoint);
    }

    /**
     * Get elapsed time since start
     * @returns {number}
     */
    getElapsedTime() {
        return Date.now() - this.startTime;
    }

    /**
     * Check if it's a quick click (not a drag)
     * @param {number} [distanceThreshold=5]
     * @param {number} [timeThreshold=200]
     * @returns {boolean}
     */
    isClick(distanceThreshold = 5, timeThreshold = 200) {
        return this.getDistance() < distanceThreshold && this.getElapsedTime() < timeThreshold;
    }

    /**
     * Reset state
     */
    reset() {
        this.isDown = false;
        this.isDragging = false;
        this.startPoint = new Vector2D(0, 0);
        this.currentPoint = new Vector2D(0, 0);
        this.previousPoint = new Vector2D(0, 0);
        this.startScreenPoint = new Vector2D(0, 0);
        this.currentScreenPoint = new Vector2D(0, 0);
        this.startTime = 0;
        this.button = 0;
        this.shiftKey = false;
        this.ctrlKey = false;
        this.altKey = false;
        this.metaKey = false;
        this.data = null;
    }
}

// ==========================================
// TOOL CURSOR
// ==========================================

/**
 * Standard tool cursors
 */
export const ToolCursors = {
    DEFAULT: 'default',
    POINTER: 'pointer',
    CROSSHAIR: 'crosshair',
    MOVE: 'move',
    GRAB: 'grab',
    GRABBING: 'grabbing',
    TEXT: 'text',
    RESIZE_NS: 'ns-resize',
    RESIZE_EW: 'ew-resize',
    RESIZE_NWSE: 'nwse-resize',
    RESIZE_NESW: 'nesw-resize',
    ROTATE: 'crosshair',
    PEN: 'crosshair',
    PENCIL: 'crosshair',
    ERASER: 'crosshair',
    EYEDROPPER: 'crosshair',
    ZOOM_IN: 'zoom-in',
    ZOOM_OUT: 'zoom-out',
    NOT_ALLOWED: 'not-allowed'
};

// ==========================================
// BASE TOOL
// ==========================================

/**
 * Tool - Abstract base class for all drawing tools
 */
export class Tool extends EventEmitter {
    /**
     * Create a tool
     * @param {ToolManager} manager - The tool manager
     * @param {object} [options]
     */
    constructor(manager, options = {}) {
        super();
        
        /** @type {ToolManager} */
        this.manager = manager;
        
        /** @type {string} Tool identifier */
        this.id = options.id || 'tool';
        
        /** @type {string} Display name */
        this.name = options.name || 'Tool';
        
        /** @type {string} Tool description */
        this.description = options.description || '';
        
        /** @type {string} Keyboard shortcut */
        this.shortcut = options.shortcut || '';
        
        /** @type {string} Icon (SVG or Unicode) */
        this.icon = options.icon || '🔧';
        
        /** @type {string} Current cursor */
        this.cursor = options.cursor || ToolCursors.DEFAULT;
        
        /** @type {ToolState} Current tool state */
        this.state = new ToolState();
        
        /** @type {boolean} Is this tool active */
        this.isActive = false;
        
        /** @type {object} Tool-specific options */
        this.options = { ...options };
    }

    /**
     * Get the document from manager
     * @returns {object|null}
     */
    get document() {
        return this.manager?.document || null;
    }

    /**
     * Get the viewport from manager
     * @returns {object|null}
     */
    get viewport() {
        return this.manager?.viewport || null;
    }

    /**
     * Get the canvas from manager
     * @returns {object|null}
     */
    get canvas() {
        return this.manager?.canvas || null;
    }

    /**
     * Get the selection from manager
     * @returns {object|null}
     */
    get selection() {
        return this.manager?.selection || null;
    }

    /**
     * Convert screen coordinates to world coordinates
     * @param {number} x
     * @param {number} y
     * @returns {Vector2D}
     */
    screenToWorld(x, y) {
        if (this.viewport) {
            return this.viewport.screenToWorld(x, y);
        }
        return new Vector2D(x, y);
    }

    /**
     * Convert world coordinates to screen coordinates
     * @param {number} x
     * @param {number} y
     * @returns {Vector2D}
     */
    worldToScreen(x, y) {
        if (this.viewport) {
            return this.viewport.worldToScreen(x, y);
        }
        return new Vector2D(x, y);
    }

    /**
     * Snap point to grid if enabled
     * @param {Vector2D} point
     * @returns {Vector2D}
     */
    snapToGrid(point) {
        if (this.manager?.snapToGrid && this.manager?.grid) {
            return this.manager.grid.snapPoint(point);
        }
        return point;
    }

    /**
     * Constrain to aspect ratio (when shift is held)
     * @param {Vector2D} start
     * @param {Vector2D} end
     * @param {number} [ratio=1] - Aspect ratio (width/height)
     * @returns {Vector2D}
     */
    constrainAspectRatio(start, end, ratio = 1) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        if (absDx / ratio > absDy) {
            // Constrain to horizontal
            return new Vector2D(end.x, start.y + Math.sign(dy) * absDx / ratio);
        } else {
            // Constrain to vertical
            return new Vector2D(start.x + Math.sign(dx) * absDy * ratio, end.y);
        }
    }

    /**
     * Constrain angle to 45-degree increments
     * @param {Vector2D} start
     * @param {Vector2D} end
     * @returns {Vector2D}
     */
    constrainAngle(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Snap to nearest 45 degrees
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        
        return new Vector2D(
            start.x + Math.cos(snappedAngle) * distance,
            start.y + Math.sin(snappedAngle) * distance
        );
    }

    // ==========================================
    // LIFECYCLE METHODS (Override in subclasses)
    // ==========================================

    /**
     * Called when tool is activated
     */
    activate() {
        this.isActive = true;
        this.state.reset();
        this.emit('activate', this);
    }

    /**
     * Called when tool is deactivated
     */
    deactivate() {
        this.isActive = false;
        this.state.reset();
        this.emit('deactivate', this);
    }

    /**
     * Called to render tool feedback (guides, preview, etc.)
     * @param {object} ctx - Rendering context
     */
    render(ctx) {
        // Override in subclasses
    }

    /**
     * Called to get current cursor
     * @returns {string}
     */
    getCursor() {
        return this.cursor;
    }

    // ==========================================
    // POINTER EVENT HANDLERS
    // ==========================================

    /**
     * Handle pointer down
     * @param {PointerEvent} event
     */
    onPointerDown(event) {
        const screenPoint = new Vector2D(event.offsetX, event.offsetY);
        const worldPoint = this.screenToWorld(event.offsetX, event.offsetY);
        
        this.state.isDown = true;
        this.state.isDragging = false;
        this.state.button = event.button;
        this.state.startTime = Date.now();
        this.state.startScreenPoint = screenPoint;
        this.state.currentScreenPoint = screenPoint;
        this.state.startPoint = worldPoint;
        this.state.currentPoint = worldPoint;
        this.state.previousPoint = worldPoint;
        this.state.updateModifiers(event);
    }

    /**
     * Handle pointer move
     * @param {PointerEvent} event
     */
    onPointerMove(event) {
        const screenPoint = new Vector2D(event.offsetX, event.offsetY);
        const worldPoint = this.screenToWorld(event.offsetX, event.offsetY);
        
        this.state.previousPoint = this.state.currentPoint;
        this.state.currentScreenPoint = screenPoint;
        this.state.currentPoint = worldPoint;
        this.state.updateModifiers(event);
        
        if (this.state.isDown && !this.state.isDragging) {
            // Check if we've moved enough to start dragging
            const distance = this.state.startScreenPoint.distanceTo(screenPoint);
            if (distance > 3) {
                this.state.isDragging = true;
                this.onDragStart(event);
            }
        }
        
        if (this.state.isDragging) {
            this.onDrag(event);
        }
    }

    /**
     * Handle pointer up
     * @param {PointerEvent} event
     */
    onPointerUp(event) {
        const screenPoint = new Vector2D(event.offsetX, event.offsetY);
        const worldPoint = this.screenToWorld(event.offsetX, event.offsetY);
        
        this.state.previousPoint = this.state.currentPoint;
        this.state.currentScreenPoint = screenPoint;
        this.state.currentPoint = worldPoint;
        this.state.updateModifiers(event);
        
        if (this.state.isDragging) {
            this.onDragEnd(event);
        } else if (this.state.isDown) {
            this.onClick(event);
        }
        
        this.state.isDown = false;
        this.state.isDragging = false;
    }

    /**
     * Handle drag start
     * @param {PointerEvent} event
     */
    onDragStart(event) {
        // Override in subclasses
    }

    /**
     * Handle drag
     * @param {PointerEvent} event
     */
    onDrag(event) {
        // Override in subclasses
    }

    /**
     * Handle drag end
     * @param {PointerEvent} event
     */
    onDragEnd(event) {
        // Override in subclasses
    }

    /**
     * Handle click (pointer down + up without significant movement)
     * @param {PointerEvent} event
     */
    onClick(event) {
        // Override in subclasses
    }

    /**
     * Handle double click
     * @param {PointerEvent} event
     */
    onDoubleClick(event) {
        // Override in subclasses
    }

    // ==========================================
    // KEYBOARD EVENT HANDLERS
    // ==========================================

    /**
     * Handle key down
     * @param {KeyboardEvent} event
     * @returns {boolean} True if event was handled
     */
    onKeyDown(event) {
        this.state.updateModifiers(event);
        return false;
    }

    /**
     * Handle key up
     * @param {KeyboardEvent} event
     * @returns {boolean} True if event was handled
     */
    onKeyUp(event) {
        this.state.updateModifiers(event);
        return false;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Request a canvas redraw
     */
    requestRedraw() {
        this.manager?.requestRedraw();
    }

    /**
     * Add object to document
     * @param {object} object
     * @param {object} [layer] - Target layer (uses active layer if not specified)
     */
    addObject(object, layer) {
        this.manager?.addObject(object, layer);
    }

    /**
     * Remove object from document
     * @param {object} object
     */
    removeObject(object) {
        this.manager?.removeObject(object);
    }

    /**
     * Commit current action to history
     * @param {string} actionName
     */
    commitAction(actionName) {
        this.manager?.commitAction(actionName);
    }

    /**
     * Begin a composite action (multiple changes as one undo step)
     * @param {string} actionName
     */
    beginAction(actionName) {
        this.manager?.beginAction(actionName);
    }

    /**
     * End a composite action
     */
    endAction() {
        this.manager?.endAction();
    }

    /**
     * Get hit test result at point
     * @param {Vector2D} point
     * @param {object} [options]
     * @returns {object|null}
     */
    hitTest(point, options = {}) {
        return this.manager?.hitTest(point, options) || null;
    }

    /**
     * Get all objects in a rectangle
     * @param {object} rect - {x, y, width, height}
     * @param {object} [options]
     * @returns {Array}
     */
    getObjectsInRect(rect, options = {}) {
        return this.manager?.getObjectsInRect(rect, options) || [];
    }

    /**
     * Serialize tool options
     * @returns {object}
     */
    serialize() {
        return {
            id: this.id,
            options: { ...this.options }
        };
    }
}

// ==========================================
// TOOL MANAGER
// ==========================================

/**
 * ToolManager - Manages all tools and routes events
 */
export class ToolManager extends EventEmitter {
    /**
     * Create a tool manager
     * @param {object} [options]
     */
    constructor(options = {}) {
        super();
        
        /** @type {Map<string, Tool>} Registered tools */
        this.tools = new Map();
        
        /** @type {Tool|null} Currently active tool */
        this.activeTool = null;
        
        /** @type {Tool|null} Previous tool (for temp switching) */
        this.previousTool = null;
        
        /** @type {object|null} Document reference */
        this.document = options.document || null;
        
        /** @type {object|null} Viewport reference */
        this.viewport = options.viewport || null;
        
        /** @type {object|null} Canvas reference */
        this.canvas = options.canvas || null;
        
        /** @type {object|null} Selection reference */
        this.selection = options.selection || null;
        
        /** @type {object|null} Grid reference */
        this.grid = options.grid || null;
        
        /** @type {object|null} History reference */
        this.history = options.history || null;
        
        /** @type {boolean} Snap to grid enabled */
        this.snapToGrid = options.snapToGrid || false;
        
        /** @type {boolean} Snap to objects enabled */
        this.snapToObjects = options.snapToObjects || false;
        
        /** @type {boolean} Snap to guides enabled */
        this.snapToGuides = options.snapToGuides || true;
        
        /** @type {number} Snap distance in pixels */
        this.snapDistance = options.snapDistance || 5;
        
        /** @type {HTMLElement|null} Canvas element for event binding */
        this.element = null;
        
        /** @type {boolean} Whether pointer is captured */
        this._pointerCaptured = false;
        
        // Bound event handlers
        this._onPointerDown = this._handlePointerDown.bind(this);
        this._onPointerMove = this._handlePointerMove.bind(this);
        this._onPointerUp = this._handlePointerUp.bind(this);
        this._onDoubleClick = this._handleDoubleClick.bind(this);
        this._onKeyDown = this._handleKeyDown.bind(this);
        this._onKeyUp = this._handleKeyUp.bind(this);
        this._onContextMenu = this._handleContextMenu.bind(this);
    }

    /**
     * Initialize the tool manager
     * @param {HTMLElement} element - Canvas element for event binding
     */
    init(element) {
        this.element = element;
        this._bindEvents();
    }

    /**
     * Destroy the tool manager
     */
    destroy() {
        this._unbindEvents();
        this.tools.clear();
        this.activeTool = null;
        this.previousTool = null;
    }

    /**
     * Bind event listeners
     * @private
     */
    _bindEvents() {
        if (!this.element) return;
        
        this.element.addEventListener('pointerdown', this._onPointerDown);
        this.element.addEventListener('pointermove', this._onPointerMove);
        this.element.addEventListener('pointerup', this._onPointerUp);
        this.element.addEventListener('pointercancel', this._onPointerUp);
        this.element.addEventListener('dblclick', this._onDoubleClick);
        this.element.addEventListener('contextmenu', this._onContextMenu);
        
        // Keyboard events on window
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    /**
     * Unbind event listeners
     * @private
     */
    _unbindEvents() {
        if (!this.element) return;
        
        this.element.removeEventListener('pointerdown', this._onPointerDown);
        this.element.removeEventListener('pointermove', this._onPointerMove);
        this.element.removeEventListener('pointerup', this._onPointerUp);
        this.element.removeEventListener('pointercancel', this._onPointerUp);
        this.element.removeEventListener('dblclick', this._onDoubleClick);
        this.element.removeEventListener('contextmenu', this._onContextMenu);
        
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
    }

    // ==========================================
    // TOOL MANAGEMENT
    // ==========================================

    /**
     * Register a tool
     * @param {Tool} tool
     */
    registerTool(tool) {
        this.tools.set(tool.id, tool);
        this.emit('toolRegistered', tool);
    }

    /**
     * Unregister a tool
     * @param {string} toolId
     */
    unregisterTool(toolId) {
        const tool = this.tools.get(toolId);
        if (tool) {
            if (this.activeTool === tool) {
                this.activeTool = null;
            }
            this.tools.delete(toolId);
            this.emit('toolUnregistered', tool);
        }
    }

    /**
     * Get a tool by ID
     * @param {string} toolId
     * @returns {Tool|undefined}
     */
    getTool(toolId) {
        return this.tools.get(toolId);
    }

    /**
     * Get all registered tools
     * @returns {Array<Tool>}
     */
    getAllTools() {
        return Array.from(this.tools.values());
    }

    /**
     * Activate a tool
     * @param {string} toolId
     * @param {boolean} [savePrevious=false] - Save current tool for temp switching
     */
    activateTool(toolId, savePrevious = false) {
        const tool = this.tools.get(toolId);
        if (!tool) {
            console.warn(`Tool not found: ${toolId}`);
            return;
        }
        
        if (this.activeTool === tool) {
            return;
        }
        
        // Deactivate current tool
        if (this.activeTool) {
            if (savePrevious) {
                this.previousTool = this.activeTool;
            }
            this.activeTool.deactivate();
        }
        
        // Activate new tool
        this.activeTool = tool;
        tool.activate();
        
        // Update cursor
        this._updateCursor();
        
        this.emit('toolChanged', tool, this.previousTool);
    }

    /**
     * Restore previous tool (after temp switch)
     */
    restorePreviousTool() {
        if (this.previousTool) {
            this.activateTool(this.previousTool.id);
            this.previousTool = null;
        }
    }

    /**
     * Temporarily switch to a tool
     * @param {string} toolId
     */
    tempActivateTool(toolId) {
        this.activateTool(toolId, true);
    }

    // ==========================================
    // EVENT HANDLERS
    // ==========================================

    /**
     * Handle pointer down
     * @private
     */
    _handlePointerDown(event) {
        if (!this.activeTool) return;
        
        // Capture pointer for reliable tracking
        if (this.element && !this._pointerCaptured) {
            this.element.setPointerCapture(event.pointerId);
            this._pointerCaptured = true;
        }
        
        this.activeTool.onPointerDown(event);
        this._updateCursor();
        this.requestRedraw();
    }

    /**
     * Handle pointer move
     * @private
     */
    _handlePointerMove(event) {
        if (!this.activeTool) return;
        
        this.activeTool.onPointerMove(event);
        this._updateCursor();
        this.requestRedraw();
    }

    /**
     * Handle pointer up
     * @private
     */
    _handlePointerUp(event) {
        if (!this.activeTool) return;
        
        // Release pointer capture
        if (this.element && this._pointerCaptured) {
            this.element.releasePointerCapture(event.pointerId);
            this._pointerCaptured = false;
        }
        
        this.activeTool.onPointerUp(event);
        this._updateCursor();
        this.requestRedraw();
    }

    /**
     * Handle double click
     * @private
     */
    _handleDoubleClick(event) {
        if (!this.activeTool) return;
        
        this.activeTool.onDoubleClick(event);
        this.requestRedraw();
    }

    /**
     * Handle key down
     * @private
     */
    _handleKeyDown(event) {
        // Check for tool shortcuts
        if (!event.repeat && !this._isInputFocused()) {
            for (const tool of this.tools.values()) {
                if (tool.shortcut && this._matchesShortcut(event, tool.shortcut)) {
                    this.activateTool(tool.id);
                    event.preventDefault();
                    return;
                }
            }
        }
        
        // Pass to active tool
        if (this.activeTool) {
            if (this.activeTool.onKeyDown(event)) {
                event.preventDefault();
            }
            this.requestRedraw();
        }
    }

    /**
     * Handle key up
     * @private
     */
    _handleKeyUp(event) {
        if (this.activeTool) {
            if (this.activeTool.onKeyUp(event)) {
                event.preventDefault();
            }
            this.requestRedraw();
        }
    }

    /**
     * Handle context menu
     * @private
     */
    _handleContextMenu(event) {
        // Prevent default context menu on canvas
        event.preventDefault();
        this.emit('contextMenu', event);
    }

    /**
     * Check if an input element is focused
     * @private
     * @returns {boolean}
     */
    _isInputFocused() {
        const active = document.activeElement;
        return active && (
            active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.tagName === 'SELECT' ||
            active.isContentEditable
        );
    }

    /**
     * Check if keyboard event matches shortcut
     * @private
     * @param {KeyboardEvent} event
     * @param {string} shortcut
     * @returns {boolean}
     */
    _matchesShortcut(event, shortcut) {
        const parts = shortcut.toLowerCase().split('+');
        const key = parts[parts.length - 1];
        const hasCtrl = parts.includes('ctrl');
        const hasShift = parts.includes('shift');
        const hasAlt = parts.includes('alt');
        const hasMeta = parts.includes('meta') || parts.includes('cmd');
        
        return event.key.toLowerCase() === key &&
               event.ctrlKey === hasCtrl &&
               event.shiftKey === hasShift &&
               event.altKey === hasAlt &&
               event.metaKey === hasMeta;
    }

    /**
     * Update cursor based on active tool
     * @private
     */
    _updateCursor() {
        if (this.element && this.activeTool) {
            this.element.style.cursor = this.activeTool.getCursor();
        }
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Request a canvas redraw
     */
    requestRedraw() {
        this.emit('redraw');
    }

    /**
     * Add object to document
     * @param {object} object
     * @param {object} [layer]
     */
    addObject(object, layer) {
        if (this.document) {
            const targetLayer = layer || this.document.activeLayer;
            if (targetLayer) {
                targetLayer.addChild(object);
            }
        }
        this.emit('objectAdded', object);
    }

    /**
     * Remove object from document
     * @param {object} object
     */
    removeObject(object) {
        if (object.parent) {
            object.parent.removeChild(object);
        }
        this.emit('objectRemoved', object);
    }

    /**
     * Commit action to history
     * @param {string} actionName
     */
    commitAction(actionName) {
        if (this.history) {
            this.history.commit(actionName);
        }
        this.emit('actionCommitted', actionName);
    }

    /**
     * Begin composite action
     * @param {string} actionName
     */
    beginAction(actionName) {
        if (this.history) {
            this.history.beginCompound(actionName);
        }
        this.emit('actionBegun', actionName);
    }

    /**
     * End composite action
     */
    endAction() {
        if (this.history) {
            this.history.endCompound();
        }
        this.emit('actionEnded');
    }

    /**
     * Hit test at point
     * @param {Vector2D} point
     * @param {object} [options]
     * @returns {object|null}
     */
    hitTest(point, options = {}) {
        if (!this.document) return null;
        
        const {
            includeHidden = false,
            includeLocked = false,
            handleTypes = null,
            tolerance = 5
        } = options;
        
        // First check selection handles
        if (this.selection && this.selection.hasSelection()) {
            const handle = this.selection.hitTestHandles(point, tolerance);
            if (handle) {
                if (!handleTypes || handleTypes.includes(handle.type)) {
                    return { type: 'handle', handle, object: handle.object };
                }
            }
        }
        
        // Then check objects
        const layers = this.document.layers || [];
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (!layer.visible && !includeHidden) continue;
            if (layer.locked && !includeLocked) continue;
            
            const object = this._hitTestLayer(layer, point, tolerance, includeHidden, includeLocked);
            if (object) {
                return { type: 'object', object, layer };
            }
        }
        
        return null;
    }

    /**
     * Hit test a layer
     * @private
     */
    _hitTestLayer(layer, point, tolerance, includeHidden, includeLocked) {
        const children = layer.children || [];
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            if (!child.visible && !includeHidden) continue;
            if (child.locked && !includeLocked) continue;
            
            if (child.hitTest && child.hitTest(point, tolerance)) {
                return child;
            }
            
            // Recursively check groups
            if (child.children) {
                const result = this._hitTestLayer(child, point, tolerance, includeHidden, includeLocked);
                if (result) return result;
            }
        }
        return null;
    }

    /**
     * Get objects in rectangle
     * @param {object} rect
     * @param {object} [options]
     * @returns {Array}
     */
    getObjectsInRect(rect, options = {}) {
        if (!this.document) return [];
        
        const {
            includeHidden = false,
            includeLocked = false,
            intersect = true // false = fully contained
        } = options;
        
        const results = [];
        const layers = this.document.layers || [];
        
        for (const layer of layers) {
            if (!layer.visible && !includeHidden) continue;
            if (layer.locked && !includeLocked) continue;
            
            this._getObjectsInRectFromLayer(layer, rect, intersect, includeHidden, includeLocked, results);
        }
        
        return results;
    }

    /**
     * Get objects in rect from a layer
     * @private
     */
    _getObjectsInRectFromLayer(layer, rect, intersect, includeHidden, includeLocked, results) {
        const children = layer.children || [];
        
        for (const child of children) {
            if (!child.visible && !includeHidden) continue;
            if (child.locked && !includeLocked) continue;
            
            const bounds = child.getBounds ? child.getBounds() : null;
            if (bounds) {
                const overlaps = intersect
                    ? this._rectsIntersect(rect, bounds)
                    : this._rectContains(rect, bounds);
                
                if (overlaps) {
                    results.push(child);
                }
            }
            
            // Recursively check groups
            if (child.children) {
                this._getObjectsInRectFromLayer(child, rect, intersect, includeHidden, includeLocked, results);
            }
        }
    }

    /**
     * Check if two rectangles intersect
     * @private
     */
    _rectsIntersect(a, b) {
        return !(
            a.x + a.width < b.minX ||
            a.x > b.maxX ||
            a.y + a.height < b.minY ||
            a.y > b.maxY
        );
    }

    /**
     * Check if rect a contains rect b
     * @private
     */
    _rectContains(a, b) {
        return (
            b.minX >= a.x &&
            b.maxX <= a.x + a.width &&
            b.minY >= a.y &&
            b.maxY <= a.y + a.height
        );
    }

    /**
     * Render all tool feedback
     * @param {object} ctx
     */
    render(ctx) {
        if (this.activeTool) {
            this.activeTool.render(ctx);
        }
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    ToolState,
    ToolCursors,
    Tool,
    ToolManager
};
