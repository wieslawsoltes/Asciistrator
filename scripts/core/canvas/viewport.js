/**
 * Asciistrator - Viewport Management
 * 
 * Handles view transformations including pan, zoom, and coordinate conversion
 * between screen space, world space, and character grid space.
 */

import { Vector2D } from '../math/vector2d.js';
import { Matrix3x3 } from '../math/matrix3x3.js';
import { BoundingBox } from '../math/geometry.js';
import { EventEmitter } from '../../utils/events.js';
import { clamp, lerp } from '../../utils/helpers.js';

// ==========================================
// VIEWPORT
// ==========================================

/**
 * Viewport - Manages view transformation and navigation
 */
export class Viewport extends EventEmitter {
    /**
     * Create a new viewport
     * @param {object} [options]
     * @param {number} [options.screenWidth=800] - Screen width in pixels
     * @param {number} [options.screenHeight=600] - Screen height in pixels
     * @param {number} [options.worldWidth=120] - World width
     * @param {number} [options.worldHeight=80] - World height
     */
    constructor(options = {}) {
        super();
        
        /** @type {number} Screen width in pixels */
        this.screenWidth = options.screenWidth || 800;
        
        /** @type {number} Screen height in pixels */
        this.screenHeight = options.screenHeight || 600;
        
        /** @type {number} World width */
        this.worldWidth = options.worldWidth || 120;
        
        /** @type {number} World height */
        this.worldHeight = options.worldHeight || 80;
        
        /** @type {number} Zoom level (1 = 100%) */
        this._zoom = 1;
        
        /** @type {number} Minimum zoom */
        this.minZoom = 0.1;
        
        /** @type {number} Maximum zoom */
        this.maxZoom = 10;
        
        /** @type {number} Pan X (world coordinates) */
        this._panX = 0;
        
        /** @type {number} Pan Y (world coordinates) */
        this._panY = 0;
        
        /** @type {number} Rotation angle in radians */
        this._rotation = 0;
        
        /** @type {Matrix3x3} World to screen transform */
        this._worldToScreen = Matrix3x3.identity();
        
        /** @type {Matrix3x3} Screen to world transform */
        this._screenToWorld = Matrix3x3.identity();
        
        /** @type {boolean} Whether smooth animation is enabled */
        this.smoothAnimation = true;
        
        /** @type {number} Animation duration in ms */
        this.animationDuration = 200;
        
        /** @type {object|null} Current animation state */
        this._animation = null;
        
        this._updateTransforms();
    }
    
    // ==========================================
    // PROPERTIES
    // ==========================================
    
    /**
     * Get zoom level
     * @returns {number}
     */
    get zoom() {
        return this._zoom;
    }
    
    /**
     * Set zoom level
     * @param {number} value
     */
    set zoom(value) {
        this.setZoom(value);
    }
    
    /**
     * Get pan X
     * @returns {number}
     */
    get panX() {
        return this._panX;
    }
    
    /**
     * Set pan X
     * @param {number} value
     */
    set panX(value) {
        this.setPan(value, this._panY);
    }
    
    /**
     * Get pan Y
     * @returns {number}
     */
    get panY() {
        return this._panY;
    }
    
    /**
     * Set pan Y
     * @param {number} value
     */
    set panY(value) {
        this.setPan(this._panX, value);
    }
    
    /**
     * Get rotation
     * @returns {number}
     */
    get rotation() {
        return this._rotation;
    }
    
    /**
     * Set rotation
     * @param {number} value - Angle in radians
     */
    set rotation(value) {
        this.setRotation(value);
    }
    
    // ==========================================
    // TRANSFORM MANAGEMENT
    // ==========================================
    
    /**
     * Update transformation matrices
     * @private
     */
    _updateTransforms() {
        // Build world to screen transform:
        // 1. Translate by pan (negative to move view)
        // 2. Scale by zoom
        // 3. Rotate (optional)
        // 4. Center on screen
        
        const centerX = this.screenWidth / 2;
        const centerY = this.screenHeight / 2;
        
        // Start with identity
        this._worldToScreen = Matrix3x3.identity();
        
        // Translate to center
        this._worldToScreen = Matrix3x3.translate(centerX, centerY)
            .multiply(this._worldToScreen);
        
        // Apply rotation around center
        if (this._rotation !== 0) {
            this._worldToScreen = Matrix3x3.rotate(this._rotation)
                .multiply(this._worldToScreen);
        }
        
        // Apply zoom
        this._worldToScreen = Matrix3x3.scale(this._zoom, this._zoom)
            .multiply(this._worldToScreen);
        
        // Apply pan (in world coordinates)
        this._worldToScreen = Matrix3x3.translate(-this._panX, -this._panY)
            .multiply(this._worldToScreen);
        
        // Calculate inverse
        this._screenToWorld = this._worldToScreen.inverse();
        
        this.emit('transform', {
            zoom: this._zoom,
            panX: this._panX,
            panY: this._panY,
            rotation: this._rotation
        });
    }
    
    /**
     * Set screen size
     * @param {number} width 
     * @param {number} height 
     */
    setScreenSize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        this._updateTransforms();
        this.emit('resize', { width, height });
    }
    
    /**
     * Set world size
     * @param {number} width 
     * @param {number} height 
     */
    setWorldSize(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
        this.emit('worldresize', { width, height });
    }
    
    // ==========================================
    // ZOOM CONTROL
    // ==========================================
    
    /**
     * Set zoom level
     * @param {number} zoom 
     * @param {boolean} [animate=false]
     */
    setZoom(zoom, animate = false) {
        zoom = clamp(zoom, this.minZoom, this.maxZoom);
        
        if (zoom === this._zoom) return;
        
        if (animate && this.smoothAnimation) {
            this._animateTo({ zoom });
        } else {
            this._zoom = zoom;
            this._updateTransforms();
        }
    }
    
    /**
     * Zoom by factor
     * @param {number} factor - Multiply current zoom
     * @param {number} [focusX] - Screen X to zoom towards
     * @param {number} [focusY] - Screen Y to zoom towards
     */
    zoomBy(factor, focusX, focusY) {
        const newZoom = clamp(this._zoom * factor, this.minZoom, this.maxZoom);
        
        if (focusX !== undefined && focusY !== undefined) {
            // Zoom towards focus point
            const worldBefore = this.screenToWorld(focusX, focusY);
            this._zoom = newZoom;
            this._updateTransforms();
            const worldAfter = this.screenToWorld(focusX, focusY);
            
            // Adjust pan to keep focus point stable
            this._panX += worldBefore.x - worldAfter.x;
            this._panY += worldBefore.y - worldAfter.y;
            this._updateTransforms();
        } else {
            this._zoom = newZoom;
            this._updateTransforms();
        }
    }
    
    /**
     * Zoom in
     * @param {number} [factor=1.25]
     */
    zoomIn(factor = 1.25) {
        this.zoomBy(factor);
    }
    
    /**
     * Zoom out
     * @param {number} [factor=1.25]
     */
    zoomOut(factor = 1.25) {
        this.zoomBy(1 / factor);
    }
    
    /**
     * Reset zoom to 100%
     */
    resetZoom() {
        this.setZoom(1, this.smoothAnimation);
    }
    
    /**
     * Zoom to fit world in viewport
     * @param {number} [padding=0.1] - Padding as fraction of viewport
     */
    zoomToFit(padding = 0.1) {
        const paddedWidth = this.screenWidth * (1 - padding * 2);
        const paddedHeight = this.screenHeight * (1 - padding * 2);
        
        const zoomX = paddedWidth / this.worldWidth;
        const zoomY = paddedHeight / this.worldHeight;
        
        this._zoom = Math.min(zoomX, zoomY, this.maxZoom);
        this._panX = this.worldWidth / 2;
        this._panY = this.worldHeight / 2;
        this._updateTransforms();
    }
    
    /**
     * Zoom to fit bounding box
     * @param {BoundingBox} bbox 
     * @param {number} [padding=0.1]
     */
    zoomToBounds(bbox, padding = 0.1) {
        const paddedWidth = this.screenWidth * (1 - padding * 2);
        const paddedHeight = this.screenHeight * (1 - padding * 2);
        
        const zoomX = paddedWidth / bbox.width;
        const zoomY = paddedHeight / bbox.height;
        
        this._zoom = clamp(Math.min(zoomX, zoomY), this.minZoom, this.maxZoom);
        this._panX = bbox.centerX;
        this._panY = bbox.centerY;
        this._updateTransforms();
    }
    
    // ==========================================
    // PAN CONTROL
    // ==========================================
    
    /**
     * Set pan position
     * @param {number} x - World X
     * @param {number} y - World Y
     * @param {boolean} [animate=false]
     */
    setPan(x, y, animate = false) {
        if (x === this._panX && y === this._panY) return;
        
        if (animate && this.smoothAnimation) {
            this._animateTo({ panX: x, panY: y });
        } else {
            this._panX = x;
            this._panY = y;
            this._updateTransforms();
        }
    }
    
    /**
     * Pan by delta
     * @param {number} deltaX - World delta X
     * @param {number} deltaY - World delta Y
     */
    panBy(deltaX, deltaY) {
        this._panX += deltaX;
        this._panY += deltaY;
        this._updateTransforms();
    }
    
    /**
     * Pan by screen delta
     * @param {number} screenDeltaX 
     * @param {number} screenDeltaY 
     */
    panByScreen(screenDeltaX, screenDeltaY) {
        // Convert screen delta to world delta
        const worldDeltaX = -screenDeltaX / this._zoom;
        const worldDeltaY = -screenDeltaY / this._zoom;
        this.panBy(worldDeltaX, worldDeltaY);
    }
    
    /**
     * Center view on world point
     * @param {number} worldX 
     * @param {number} worldY 
     * @param {boolean} [animate=false]
     */
    centerOn(worldX, worldY, animate = false) {
        this.setPan(worldX, worldY, animate);
    }
    
    /**
     * Reset pan to origin
     */
    resetPan() {
        this.setPan(0, 0, this.smoothAnimation);
    }
    
    // ==========================================
    // ROTATION CONTROL
    // ==========================================
    
    /**
     * Set rotation
     * @param {number} angle - Radians
     * @param {boolean} [animate=false]
     */
    setRotation(angle, animate = false) {
        if (angle === this._rotation) return;
        
        if (animate && this.smoothAnimation) {
            this._animateTo({ rotation: angle });
        } else {
            this._rotation = angle;
            this._updateTransforms();
        }
    }
    
    /**
     * Rotate by delta
     * @param {number} deltaAngle - Radians
     */
    rotateBy(deltaAngle) {
        this._rotation += deltaAngle;
        this._updateTransforms();
    }
    
    /**
     * Reset rotation
     */
    resetRotation() {
        this.setRotation(0, this.smoothAnimation);
    }
    
    // ==========================================
    // COORDINATE CONVERSION
    // ==========================================
    
    /**
     * Convert screen coordinates to world coordinates
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {{x: number, y: number}}
     */
    screenToWorld(screenX, screenY) {
        const point = this._screenToWorld.transformPoint(new Vector2D(screenX, screenY));
        return { x: point.x, y: point.y };
    }
    
    /**
     * Convert world coordinates to screen coordinates
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {{x: number, y: number}}
     */
    worldToScreen(worldX, worldY) {
        const point = this._worldToScreen.transformPoint(new Vector2D(worldX, worldY));
        return { x: point.x, y: point.y };
    }
    
    /**
     * Convert screen vector to world vector (no translation)
     * @param {number} screenDX 
     * @param {number} screenDY 
     * @returns {{x: number, y: number}}
     */
    screenToWorldVector(screenDX, screenDY) {
        return {
            x: screenDX / this._zoom,
            y: screenDY / this._zoom
        };
    }
    
    /**
     * Convert world vector to screen vector
     * @param {number} worldDX 
     * @param {number} worldDY 
     * @returns {{x: number, y: number}}
     */
    worldToScreenVector(worldDX, worldDY) {
        return {
            x: worldDX * this._zoom,
            y: worldDY * this._zoom
        };
    }
    
    /**
     * Convert screen bounds to world bounds
     * @param {BoundingBox} screenBounds 
     * @returns {BoundingBox}
     */
    screenToWorldBounds(screenBounds) {
        const topLeft = this.screenToWorld(screenBounds.minX, screenBounds.minY);
        const bottomRight = this.screenToWorld(screenBounds.maxX, screenBounds.maxY);
        return new BoundingBox(
            topLeft.x,
            topLeft.y,
            bottomRight.x - topLeft.x,
            bottomRight.y - topLeft.y
        );
    }
    
    /**
     * Convert world bounds to screen bounds
     * @param {BoundingBox} worldBounds 
     * @returns {BoundingBox}
     */
    worldToScreenBounds(worldBounds) {
        const topLeft = this.worldToScreen(worldBounds.minX, worldBounds.minY);
        const bottomRight = this.worldToScreen(worldBounds.maxX, worldBounds.maxY);
        return new BoundingBox(
            topLeft.x,
            topLeft.y,
            bottomRight.x - topLeft.x,
            bottomRight.y - topLeft.y
        );
    }
    
    /**
     * Get visible world bounds
     * @returns {BoundingBox}
     */
    getVisibleBounds() {
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.screenWidth, this.screenHeight);
        return new BoundingBox(
            topLeft.x,
            topLeft.y,
            bottomRight.x - topLeft.x,
            bottomRight.y - topLeft.y
        );
    }
    
    /**
     * Check if world point is visible
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {boolean}
     */
    isVisible(worldX, worldY) {
        const screen = this.worldToScreen(worldX, worldY);
        return screen.x >= 0 && screen.x < this.screenWidth &&
               screen.y >= 0 && screen.y < this.screenHeight;
    }
    
    /**
     * Check if world bounds are visible
     * @param {BoundingBox} bounds 
     * @returns {boolean}
     */
    areBoundsVisible(bounds) {
        const visible = this.getVisibleBounds();
        return visible.intersects(bounds);
    }
    
    // ==========================================
    // ANIMATION
    // ==========================================
    
    /**
     * Animate to target state
     * @private
     * @param {object} target 
     */
    _animateTo(target) {
        const startState = {
            zoom: this._zoom,
            panX: this._panX,
            panY: this._panY,
            rotation: this._rotation
        };
        
        const endState = {
            zoom: target.zoom ?? this._zoom,
            panX: target.panX ?? this._panX,
            panY: target.panY ?? this._panY,
            rotation: target.rotation ?? this._rotation
        };
        
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / this.animationDuration);
            
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            
            this._zoom = lerp(startState.zoom, endState.zoom, eased);
            this._panX = lerp(startState.panX, endState.panX, eased);
            this._panY = lerp(startState.panY, endState.panY, eased);
            this._rotation = lerp(startState.rotation, endState.rotation, eased);
            
            this._updateTransforms();
            
            if (progress < 1) {
                this._animation = requestAnimationFrame(animate);
            } else {
                this._animation = null;
                this.emit('animationcomplete');
            }
        };
        
        if (this._animation) {
            cancelAnimationFrame(this._animation);
        }
        
        this._animation = requestAnimationFrame(animate);
    }
    
    /**
     * Stop any running animation
     */
    stopAnimation() {
        if (this._animation) {
            cancelAnimationFrame(this._animation);
            this._animation = null;
        }
    }
    
    // ==========================================
    // RESET
    // ==========================================
    
    /**
     * Reset viewport to default state
     * @param {boolean} [animate=false]
     */
    reset(animate = false) {
        if (animate && this.smoothAnimation) {
            this._animateTo({
                zoom: 1,
                panX: this.worldWidth / 2,
                panY: this.worldHeight / 2,
                rotation: 0
            });
        } else {
            this._zoom = 1;
            this._panX = this.worldWidth / 2;
            this._panY = this.worldHeight / 2;
            this._rotation = 0;
            this._updateTransforms();
        }
    }
    
    // ==========================================
    // STATE
    // ==========================================
    
    /**
     * Get current viewport state
     * @returns {object}
     */
    getState() {
        return {
            zoom: this._zoom,
            panX: this._panX,
            panY: this._panY,
            rotation: this._rotation,
            screenWidth: this.screenWidth,
            screenHeight: this.screenHeight,
            worldWidth: this.worldWidth,
            worldHeight: this.worldHeight
        };
    }
    
    /**
     * Set viewport state
     * @param {object} state 
     * @param {boolean} [animate=false]
     */
    setState(state, animate = false) {
        if (animate && this.smoothAnimation) {
            this._animateTo({
                zoom: state.zoom,
                panX: state.panX,
                panY: state.panY,
                rotation: state.rotation
            });
        } else {
            if (state.zoom !== undefined) this._zoom = state.zoom;
            if (state.panX !== undefined) this._panX = state.panX;
            if (state.panY !== undefined) this._panY = state.panY;
            if (state.rotation !== undefined) this._rotation = state.rotation;
            this._updateTransforms();
        }
    }
    
    /**
     * Get transformation matrices
     * @returns {{worldToScreen: Matrix3x3, screenToWorld: Matrix3x3}}
     */
    getTransforms() {
        return {
            worldToScreen: this._worldToScreen,
            screenToWorld: this._screenToWorld
        };
    }
}

// ==========================================
// VIEWPORT CONTROLLER
// ==========================================

/**
 * Viewport Controller - Handles user interaction for viewport navigation
 */
export class ViewportController extends EventEmitter {
    /**
     * Create viewport controller
     * @param {Viewport} viewport 
     * @param {HTMLElement} element - Element to attach events to
     */
    constructor(viewport, element) {
        super();
        
        /** @type {Viewport} */
        this.viewport = viewport;
        
        /** @type {HTMLElement} */
        this.element = element;
        
        /** @type {boolean} */
        this.enabled = true;
        
        /** @type {boolean} */
        this.isPanning = false;
        
        /** @type {boolean} */
        this.isZooming = false;
        
        /** @type {{x: number, y: number}|null} */
        this._panStart = null;
        
        /** @type {{x: number, y: number}|null} */
        this._panViewportStart = null;
        
        /** @type {number} */
        this.zoomSpeed = 0.001;
        
        /** @type {number} */
        this.panSpeed = 1;
        
        /** @type {number} Middle mouse button */
        this.panButton = 1;
        
        /** @type {boolean} Enable keyboard controls */
        this.keyboardEnabled = true;
        
        /** @type {Set<string>} Currently pressed keys */
        this._pressedKeys = new Set();
        
        this._setupEventListeners();
    }
    
    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Mouse events
        this.element.addEventListener('mousedown', this._onMouseDown.bind(this));
        this.element.addEventListener('mousemove', this._onMouseMove.bind(this));
        this.element.addEventListener('mouseup', this._onMouseUp.bind(this));
        this.element.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
        this.element.addEventListener('contextmenu', e => e.preventDefault());
        
        // Touch events for mobile
        this.element.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this._onTouchEnd.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this._onKeyDown.bind(this));
        document.addEventListener('keyup', this._onKeyUp.bind(this));
    }
    
    /**
     * Mouse down handler
     * @private
     */
    _onMouseDown(e) {
        if (!this.enabled) return;
        
        // Middle mouse button or Space + left click for pan
        if (e.button === this.panButton || (e.button === 0 && this._pressedKeys.has(' '))) {
            e.preventDefault();
            this.isPanning = true;
            this._panStart = { x: e.clientX, y: e.clientY };
            this._panViewportStart = { 
                x: this.viewport.panX, 
                y: this.viewport.panY 
            };
            this.element.style.cursor = 'grabbing';
            this.emit('panstart');
        }
    }
    
    /**
     * Mouse move handler
     * @private
     */
    _onMouseMove(e) {
        if (!this.enabled) return;
        
        if (this.isPanning && this._panStart) {
            const deltaX = e.clientX - this._panStart.x;
            const deltaY = e.clientY - this._panStart.y;
            
            // Convert screen delta to world delta
            const worldDelta = this.viewport.screenToWorldVector(deltaX, deltaY);
            
            this.viewport.setPan(
                this._panViewportStart.x - worldDelta.x,
                this._panViewportStart.y - worldDelta.y
            );
            
            this.emit('pan', { deltaX: worldDelta.x, deltaY: worldDelta.y });
        }
    }
    
    /**
     * Mouse up handler
     * @private
     */
    _onMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this._panStart = null;
            this._panViewportStart = null;
            this.element.style.cursor = '';
            this.emit('panend');
        }
    }
    
    /**
     * Wheel handler for zoom
     * @private
     */
    _onWheel(e) {
        if (!this.enabled) return;
        
        e.preventDefault();
        
        // Get mouse position for zoom focus
        const rect = this.element.getBoundingClientRect();
        const focusX = e.clientX - rect.left;
        const focusY = e.clientY - rect.top;
        
        // Calculate zoom factor from wheel delta
        const delta = -e.deltaY * this.zoomSpeed;
        const factor = Math.exp(delta);
        
        this.viewport.zoomBy(factor, focusX, focusY);
        
        this.emit('zoom', { 
            factor, 
            zoom: this.viewport.zoom,
            focusX,
            focusY
        });
    }
    
    /**
     * Touch start handler
     * @private
     */
    _onTouchStart(e) {
        if (!this.enabled) return;
        
        if (e.touches.length === 2) {
            // Two finger gesture - prepare for pinch zoom
            e.preventDefault();
            this.isZooming = true;
            this._touchStartDistance = this._getTouchDistance(e.touches);
            this._touchStartZoom = this.viewport.zoom;
        } else if (e.touches.length === 1) {
            // Single finger pan (with two-finger scroll disabled)
            // For ASCII editor, we might want to allow single-finger drawing instead
        }
    }
    
    /**
     * Touch move handler
     * @private
     */
    _onTouchMove(e) {
        if (!this.enabled) return;
        
        if (this.isZooming && e.touches.length === 2) {
            e.preventDefault();
            const currentDistance = this._getTouchDistance(e.touches);
            const scale = currentDistance / this._touchStartDistance;
            
            // Get center point of touches
            const center = this._getTouchCenter(e.touches);
            const rect = this.element.getBoundingClientRect();
            const focusX = center.x - rect.left;
            const focusY = center.y - rect.top;
            
            this.viewport.setZoom(this._touchStartZoom * scale);
            
            this.emit('zoom', { zoom: this.viewport.zoom });
        }
    }
    
    /**
     * Touch end handler
     * @private
     */
    _onTouchEnd(e) {
        if (e.touches.length < 2) {
            this.isZooming = false;
        }
    }
    
    /**
     * Get distance between two touches
     * @private
     */
    _getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Get center point of touches
     * @private
     */
    _getTouchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }
    
    /**
     * Key down handler
     * @private
     */
    _onKeyDown(e) {
        if (!this.enabled || !this.keyboardEnabled) return;
        
        this._pressedKeys.add(e.key);
        
        // Handle keyboard pan with arrow keys
        const panAmount = e.shiftKey ? 50 : 10;
        
        switch (e.key) {
            case 'ArrowLeft':
                this.viewport.panBy(-panAmount / this.viewport.zoom, 0);
                break;
            case 'ArrowRight':
                this.viewport.panBy(panAmount / this.viewport.zoom, 0);
                break;
            case 'ArrowUp':
                this.viewport.panBy(0, -panAmount / this.viewport.zoom);
                break;
            case 'ArrowDown':
                this.viewport.panBy(0, panAmount / this.viewport.zoom);
                break;
            case '+':
            case '=':
                this.viewport.zoomIn();
                break;
            case '-':
                this.viewport.zoomOut();
                break;
            case '0':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.viewport.resetZoom();
                }
                break;
            case '1':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.viewport.zoomToFit();
                }
                break;
            case 'Home':
                this.viewport.reset(true);
                break;
        }
    }
    
    /**
     * Key up handler
     * @private
     */
    _onKeyUp(e) {
        this._pressedKeys.delete(e.key);
    }
    
    /**
     * Enable controller
     */
    enable() {
        this.enabled = true;
    }
    
    /**
     * Disable controller
     */
    disable() {
        this.enabled = false;
        this.isPanning = false;
        this.isZooming = false;
    }
    
    /**
     * Destroy controller and remove listeners
     */
    destroy() {
        this.disable();
        // Remove event listeners would go here if we stored references
    }
}

export default {
    Viewport,
    ViewportController
};
