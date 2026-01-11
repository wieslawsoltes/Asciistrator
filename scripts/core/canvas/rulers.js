/**
 * Asciistrator - Rulers System
 * 
 * Rulers along canvas edges with measurement markers and tick marks.
 */

import { Vector2D } from '../math/vector2d.js';
import { EventEmitter } from '../../utils/events.js';

// ==========================================
// RULER
// ==========================================

/**
 * Ruler - A measurement ruler along canvas edge
 */
export class Ruler extends EventEmitter {
    /**
     * Create a new ruler
     * @param {object} options
     * @param {'horizontal'|'vertical'} options.orientation
     * @param {number} [options.size=20] - Ruler thickness in pixels
     */
    constructor(options = {}) {
        super();
        
        /** @type {'horizontal'|'vertical'} */
        this.orientation = options.orientation || 'horizontal';
        
        /** @type {number} Size in pixels */
        this.size = options.size || 20;
        
        /** @type {boolean} */
        this.visible = options.visible !== false;
        
        /** @type {string} Background color */
        this.backgroundColor = options.backgroundColor || '#1e1e1e';
        
        /** @type {string} Text color */
        this.textColor = options.textColor || '#888888';
        
        /** @type {string} Tick color */
        this.tickColor = options.tickColor || '#555555';
        
        /** @type {string} Cursor indicator color */
        this.cursorColor = options.cursorColor || '#ff6600';
        
        /** @type {number} Font size */
        this.fontSize = options.fontSize || 9;
        
        /** @type {string} Font family */
        this.fontFamily = options.fontFamily || 'monospace';
        
        /** @type {number|null} Current cursor position */
        this.cursorPosition = null;
        
        /** @type {HTMLCanvasElement|null} */
        this._canvas = null;
        
        /** @type {CanvasRenderingContext2D|null} */
        this._ctx = null;
    }
    
    /**
     * Initialize ruler with canvas element
     * @param {HTMLElement} container 
     * @returns {HTMLCanvasElement}
     */
    initialize(container) {
        this._canvas = document.createElement('canvas');
        this._canvas.className = `ruler ruler-${this.orientation}`;
        
        if (this.orientation === 'horizontal') {
            this._canvas.style.position = 'absolute';
            this._canvas.style.top = '0';
            this._canvas.style.left = `${this.size}px`;
            this._canvas.style.height = `${this.size}px`;
        } else {
            this._canvas.style.position = 'absolute';
            this._canvas.style.top = `${this.size}px`;
            this._canvas.style.left = '0';
            this._canvas.style.width = `${this.size}px`;
        }
        
        this._ctx = this._canvas.getContext('2d');
        container.appendChild(this._canvas);
        
        return this._canvas;
    }
    
    /**
     * Resize ruler
     * @param {number} length - Length in pixels
     */
    resize(length) {
        if (!this._canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        
        if (this.orientation === 'horizontal') {
            this._canvas.width = length * dpr;
            this._canvas.height = this.size * dpr;
            this._canvas.style.width = `${length}px`;
            this._canvas.style.height = `${this.size}px`;
        } else {
            this._canvas.width = this.size * dpr;
            this._canvas.height = length * dpr;
            this._canvas.style.width = `${this.size}px`;
            this._canvas.style.height = `${length}px`;
        }
        
        this._ctx.scale(dpr, dpr);
    }
    
    /**
     * Render ruler
     * @param {import('./viewport.js').Viewport} viewport 
     */
    render(viewport) {
        if (!this._canvas || !this._ctx || !this.visible) return;
        
        const ctx = this._ctx;
        const dpr = window.devicePixelRatio || 1;
        
        // Clear
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        
        if (this.orientation === 'horizontal') {
            this._renderHorizontal(ctx, viewport);
        } else {
            this._renderVertical(ctx, viewport);
        }
    }
    
    /**
     * Render horizontal ruler
     * @private
     */
    _renderHorizontal(ctx, viewport) {
        const width = this._canvas.width / (window.devicePixelRatio || 1);
        const height = this.size;
        
        // Background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Calculate tick spacing based on zoom
        const { majorSpacing, minorSpacing, labelInterval } = this._calculateTickSpacing(viewport.zoom);
        
        // Get visible range in world coordinates
        const startWorld = viewport.screenToWorld(0, 0);
        const endWorld = viewport.screenToWorld(width, 0);
        
        // Find first tick position
        const firstTick = Math.floor(startWorld.x / minorSpacing) * minorSpacing;
        
        // Draw ticks
        ctx.strokeStyle = this.tickColor;
        ctx.fillStyle = this.textColor;
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        
        let labelCount = 0;
        for (let worldX = firstTick; worldX <= endWorld.x; worldX += minorSpacing) {
            const screenPos = viewport.worldToScreen(worldX, 0);
            const x = screenPos.x;
            
            if (x < 0 || x > width) continue;
            
            // Determine tick size
            const isMajor = Math.abs(worldX % majorSpacing) < 0.0001;
            const tickHeight = isMajor ? height * 0.6 : height * 0.3;
            
            // Draw tick
            ctx.beginPath();
            ctx.moveTo(x, height);
            ctx.lineTo(x, height - tickHeight);
            ctx.stroke();
            
            // Draw label for major ticks
            if (isMajor && labelCount % labelInterval === 0) {
                const label = this._formatLabel(worldX);
                ctx.fillText(label, x, height - tickHeight - 2);
            }
            
            if (isMajor) labelCount++;
        }
        
        // Draw cursor indicator
        if (this.cursorPosition !== null) {
            const screenX = viewport.worldToScreen(this.cursorPosition, 0).x;
            if (screenX >= 0 && screenX <= width) {
                ctx.fillStyle = this.cursorColor;
                ctx.beginPath();
                ctx.moveTo(screenX - 4, height);
                ctx.lineTo(screenX + 4, height);
                ctx.lineTo(screenX, height - 8);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        // Border
        ctx.strokeStyle = this.tickColor;
        ctx.beginPath();
        ctx.moveTo(0, height - 0.5);
        ctx.lineTo(width, height - 0.5);
        ctx.stroke();
    }
    
    /**
     * Render vertical ruler
     * @private
     */
    _renderVertical(ctx, viewport) {
        const width = this.size;
        const height = this._canvas.height / (window.devicePixelRatio || 1);
        
        // Background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Calculate tick spacing
        const { majorSpacing, minorSpacing, labelInterval } = this._calculateTickSpacing(viewport.zoom);
        
        // Get visible range
        const startWorld = viewport.screenToWorld(0, 0);
        const endWorld = viewport.screenToWorld(0, height);
        
        // Find first tick position
        const firstTick = Math.floor(startWorld.y / minorSpacing) * minorSpacing;
        
        // Draw ticks
        ctx.strokeStyle = this.tickColor;
        ctx.fillStyle = this.textColor;
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        let labelCount = 0;
        for (let worldY = firstTick; worldY <= endWorld.y; worldY += minorSpacing) {
            const screenPos = viewport.worldToScreen(0, worldY);
            const y = screenPos.y;
            
            if (y < 0 || y > height) continue;
            
            const isMajor = Math.abs(worldY % majorSpacing) < 0.0001;
            const tickWidth = isMajor ? width * 0.6 : width * 0.3;
            
            // Draw tick
            ctx.beginPath();
            ctx.moveTo(width, y);
            ctx.lineTo(width - tickWidth, y);
            ctx.stroke();
            
            // Draw label (rotated)
            if (isMajor && labelCount % labelInterval === 0) {
                ctx.save();
                ctx.translate(width - tickWidth - 2, y);
                ctx.rotate(-Math.PI / 2);
                ctx.textAlign = 'center';
                const label = this._formatLabel(worldY);
                ctx.fillText(label, 0, 0);
                ctx.restore();
            }
            
            if (isMajor) labelCount++;
        }
        
        // Draw cursor indicator
        if (this.cursorPosition !== null) {
            const screenY = viewport.worldToScreen(0, this.cursorPosition).y;
            if (screenY >= 0 && screenY <= height) {
                ctx.fillStyle = this.cursorColor;
                ctx.beginPath();
                ctx.moveTo(width, screenY - 4);
                ctx.lineTo(width, screenY + 4);
                ctx.lineTo(width - 8, screenY);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        // Border
        ctx.strokeStyle = this.tickColor;
        ctx.beginPath();
        ctx.moveTo(width - 0.5, 0);
        ctx.lineTo(width - 0.5, height);
        ctx.stroke();
    }
    
    /**
     * Calculate tick spacing based on zoom level
     * @private
     */
    _calculateTickSpacing(zoom) {
        // Base spacing in world units
        const baseSpacing = 10;
        
        // Adjust based on zoom to maintain readable spacing
        const pixelsPerUnit = zoom;
        const targetPixelSpacing = 50; // Target pixels between major ticks
        
        // Find appropriate spacing
        const scales = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
        
        let majorSpacing = 1;
        for (const scale of scales) {
            if (scale * pixelsPerUnit >= targetPixelSpacing) {
                majorSpacing = scale;
                break;
            }
        }
        
        const minorSpacing = majorSpacing / 5;
        
        // Label interval - skip labels if too crowded
        const labelInterval = majorSpacing * pixelsPerUnit < 30 ? 2 : 1;
        
        return { majorSpacing, minorSpacing, labelInterval };
    }
    
    /**
     * Format label value
     * @private
     */
    _formatLabel(value) {
        if (Math.abs(value) < 0.01) return '0';
        if (Math.abs(value) >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        if (Math.abs(value) < 1) {
            return value.toFixed(2);
        }
        if (value === Math.floor(value)) {
            return value.toString();
        }
        return value.toFixed(1);
    }
    
    /**
     * Update cursor position
     * @param {number|null} position - World coordinate or null
     */
    setCursorPosition(position) {
        this.cursorPosition = position;
    }
    
    /**
     * Set visibility
     * @param {boolean} visible 
     */
    setVisible(visible) {
        if (this.visible !== visible) {
            this.visible = visible;
            if (this._canvas) {
                this._canvas.style.display = visible ? 'block' : 'none';
            }
            this.emit('visibilitychange', { visible });
        }
    }
    
    /**
     * Get position from screen coordinate
     * @param {number} screenPos - Screen X (horizontal) or Y (vertical)
     * @param {import('./viewport.js').Viewport} viewport
     * @returns {number} World coordinate
     */
    getWorldPosition(screenPos, viewport) {
        if (this.orientation === 'horizontal') {
            return viewport.screenToWorld(screenPos, 0).x;
        } else {
            return viewport.screenToWorld(0, screenPos).y;
        }
    }
    
    /**
     * Dispose ruler
     */
    dispose() {
        if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        this._canvas = null;
        this._ctx = null;
    }
}

// ==========================================
// RULER MANAGER
// ==========================================

/**
 * Ruler Manager - Manages horizontal and vertical rulers
 */
export class RulerManager extends EventEmitter {
    /**
     * Create ruler manager
     * @param {object} [options]
     */
    constructor(options = {}) {
        super();
        
        /** @type {Ruler} */
        this.horizontal = new Ruler({ 
            orientation: 'horizontal',
            size: options.rulerSize || 20
        });
        
        /** @type {Ruler} */
        this.vertical = new Ruler({ 
            orientation: 'vertical',
            size: options.rulerSize || 20
        });
        
        /** @type {boolean} */
        this.visible = options.visible !== false;
        
        /** @type {number} */
        this.size = options.rulerSize || 20;
        
        /** @type {HTMLElement|null} */
        this._container = null;
        
        /** @type {HTMLElement|null} */
        this._corner = null;
    }
    
    /**
     * Initialize rulers
     * @param {HTMLElement} container 
     */
    initialize(container) {
        this._container = container;
        
        // Create corner piece (where rulers meet)
        this._corner = document.createElement('div');
        this._corner.className = 'ruler-corner';
        this._corner.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: ${this.size}px;
            height: ${this.size}px;
            background-color: ${this.horizontal.backgroundColor};
            border-right: 1px solid ${this.horizontal.tickColor};
            border-bottom: 1px solid ${this.horizontal.tickColor};
            z-index: 1001;
        `;
        container.appendChild(this._corner);
        
        // Initialize rulers
        this.horizontal.initialize(container);
        this.vertical.initialize(container);
        
        // Set up click handlers for creating guides
        this._setupGuideCreation();
    }
    
    /**
     * Setup guide creation from ruler clicks
     * @private
     */
    _setupGuideCreation() {
        if (!this.horizontal._canvas || !this.vertical._canvas) return;
        
        this.horizontal._canvas.addEventListener('click', (e) => {
            const rect = this.horizontal._canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            this.emit('createguide', { 
                type: 'vertical',
                screenPosition: x + this.size
            });
        });
        
        this.vertical._canvas.addEventListener('click', (e) => {
            const rect = this.vertical._canvas.getBoundingClientRect();
            const y = e.clientY - rect.top;
            this.emit('createguide', { 
                type: 'horizontal',
                screenPosition: y + this.size
            });
        });
    }
    
    /**
     * Resize rulers
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    resize(width, height) {
        this.horizontal.resize(width - this.size);
        this.vertical.resize(height - this.size);
    }
    
    /**
     * Render rulers
     * @param {import('./viewport.js').Viewport} viewport 
     */
    render(viewport) {
        if (!this.visible) return;
        this.horizontal.render(viewport);
        this.vertical.render(viewport);
    }
    
    /**
     * Update cursor position
     * @param {number|null} worldX 
     * @param {number|null} worldY 
     */
    setCursorPosition(worldX, worldY) {
        this.horizontal.setCursorPosition(worldX);
        this.vertical.setCursorPosition(worldY);
    }
    
    /**
     * Set visibility
     * @param {boolean} visible 
     */
    setVisible(visible) {
        if (this.visible !== visible) {
            this.visible = visible;
            this.horizontal.setVisible(visible);
            this.vertical.setVisible(visible);
            
            if (this._corner) {
                this._corner.style.display = visible ? 'block' : 'none';
            }
            
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
     * Get ruler offset (size of rulers)
     * @returns {{x: number, y: number}}
     */
    getOffset() {
        return this.visible ? { x: this.size, y: this.size } : { x: 0, y: 0 };
    }
    
    /**
     * Dispose rulers
     */
    dispose() {
        this.horizontal.dispose();
        this.vertical.dispose();
        
        if (this._corner && this._corner.parentNode) {
            this._corner.parentNode.removeChild(this._corner);
        }
        
        this._container = null;
        this._corner = null;
    }
}

// ==========================================
// SMART GUIDES
// ==========================================

/**
 * Smart Guide - Dynamic alignment guide
 */
export class SmartGuide {
    /**
     * Create smart guide
     * @param {object} options
     */
    constructor(options) {
        /** @type {'horizontal'|'vertical'} */
        this.type = options.type;
        
        /** @type {number} */
        this.position = options.position;
        
        /** @type {string} */
        this.source = options.source || 'object'; // 'object', 'center', 'edge'
        
        /** @type {string|null} */
        this.sourceObjectId = options.sourceObjectId || null;
        
        /** @type {number} */
        this.startExtent = options.startExtent || -Infinity;
        
        /** @type {number} */
        this.endExtent = options.endExtent || Infinity;
        
        /** @type {string} */
        this.color = options.color || '#ff00ff';
    }
}

/**
 * Smart Guide System - Automatic alignment guides
 */
export class SmartGuideSystem extends EventEmitter {
    constructor() {
        super();
        
        /** @type {boolean} */
        this.enabled = true;
        
        /** @type {SmartGuide[]} */
        this.activeGuides = [];
        
        /** @type {number} */
        this.snapThreshold = 5;
        
        /** @type {Set<string>} */
        this.enabledTypes = new Set(['edges', 'centers', 'spacing']);
    }
    
    /**
     * Calculate smart guides for objects
     * @param {Array} objects - Scene objects
     * @param {string} [excludeId] - ID of object to exclude (dragging object)
     * @returns {SmartGuide[]}
     */
    calculateGuides(objects, excludeId = null) {
        if (!this.enabled) return [];
        
        const guides = [];
        
        for (const obj of objects) {
            if (obj.id === excludeId || !obj.bounds) continue;
            
            const bounds = obj.bounds;
            
            // Edge guides
            if (this.enabledTypes.has('edges')) {
                // Left edge
                guides.push(new SmartGuide({
                    type: 'vertical',
                    position: bounds.minX,
                    source: 'edge',
                    sourceObjectId: obj.id
                }));
                
                // Right edge
                guides.push(new SmartGuide({
                    type: 'vertical',
                    position: bounds.maxX,
                    source: 'edge',
                    sourceObjectId: obj.id
                }));
                
                // Top edge
                guides.push(new SmartGuide({
                    type: 'horizontal',
                    position: bounds.minY,
                    source: 'edge',
                    sourceObjectId: obj.id
                }));
                
                // Bottom edge
                guides.push(new SmartGuide({
                    type: 'horizontal',
                    position: bounds.maxY,
                    source: 'edge',
                    sourceObjectId: obj.id
                }));
            }
            
            // Center guides
            if (this.enabledTypes.has('centers')) {
                // Horizontal center
                guides.push(new SmartGuide({
                    type: 'vertical',
                    position: (bounds.minX + bounds.maxX) / 2,
                    source: 'center',
                    sourceObjectId: obj.id
                }));
                
                // Vertical center
                guides.push(new SmartGuide({
                    type: 'horizontal',
                    position: (bounds.minY + bounds.maxY) / 2,
                    source: 'center',
                    sourceObjectId: obj.id
                }));
            }
        }
        
        return guides;
    }
    
    /**
     * Find snapping guides for a point
     * @param {number} x 
     * @param {number} y 
     * @param {SmartGuide[]} guides 
     * @returns {{x: number, y: number, snappedGuides: SmartGuide[]}}
     */
    snapToGuides(x, y, guides) {
        let resultX = x;
        let resultY = y;
        const snappedGuides = [];
        
        let nearestVDist = this.snapThreshold;
        let nearestHDist = this.snapThreshold;
        
        for (const guide of guides) {
            if (guide.type === 'vertical') {
                const dist = Math.abs(x - guide.position);
                if (dist < nearestVDist) {
                    nearestVDist = dist;
                    resultX = guide.position;
                    // Remove previous vertical snapped guides
                    for (let i = snappedGuides.length - 1; i >= 0; i--) {
                        if (snappedGuides[i].type === 'vertical') {
                            snappedGuides.splice(i, 1);
                        }
                    }
                    snappedGuides.push(guide);
                }
            } else {
                const dist = Math.abs(y - guide.position);
                if (dist < nearestHDist) {
                    nearestHDist = dist;
                    resultY = guide.position;
                    // Remove previous horizontal snapped guides
                    for (let i = snappedGuides.length - 1; i >= 0; i--) {
                        if (snappedGuides[i].type === 'horizontal') {
                            snappedGuides.splice(i, 1);
                        }
                    }
                    snappedGuides.push(guide);
                }
            }
        }
        
        this.activeGuides = snappedGuides;
        
        return { x: resultX, y: resultY, snappedGuides };
    }
    
    /**
     * Snap bounds to guides
     * @param {object} bounds - {minX, minY, maxX, maxY}
     * @param {SmartGuide[]} guides 
     * @returns {{dx: number, dy: number, snappedGuides: SmartGuide[]}}
     */
    snapBoundsToGuides(bounds, guides) {
        const snappedGuides = [];
        let dx = 0;
        let dy = 0;
        
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        let nearestVDist = this.snapThreshold;
        let nearestHDist = this.snapThreshold;
        
        for (const guide of guides) {
            if (guide.type === 'vertical') {
                // Check left edge
                const leftDist = Math.abs(bounds.minX - guide.position);
                if (leftDist < nearestVDist) {
                    nearestVDist = leftDist;
                    dx = guide.position - bounds.minX;
                    snappedGuides.push(guide);
                }
                
                // Check right edge
                const rightDist = Math.abs(bounds.maxX - guide.position);
                if (rightDist < nearestVDist) {
                    nearestVDist = rightDist;
                    dx = guide.position - bounds.maxX;
                    snappedGuides.push(guide);
                }
                
                // Check center
                const centerDist = Math.abs(centerX - guide.position);
                if (centerDist < nearestVDist) {
                    nearestVDist = centerDist;
                    dx = guide.position - centerX;
                    snappedGuides.push(guide);
                }
            } else {
                // Check top edge
                const topDist = Math.abs(bounds.minY - guide.position);
                if (topDist < nearestHDist) {
                    nearestHDist = topDist;
                    dy = guide.position - bounds.minY;
                    snappedGuides.push(guide);
                }
                
                // Check bottom edge
                const bottomDist = Math.abs(bounds.maxY - guide.position);
                if (bottomDist < nearestHDist) {
                    nearestHDist = bottomDist;
                    dy = guide.position - bounds.maxY;
                    snappedGuides.push(guide);
                }
                
                // Check center
                const centerDist = Math.abs(centerY - guide.position);
                if (centerDist < nearestHDist) {
                    nearestHDist = centerDist;
                    dy = guide.position - centerY;
                    snappedGuides.push(guide);
                }
            }
        }
        
        this.activeGuides = snappedGuides;
        
        return { dx, dy, snappedGuides };
    }
    
    /**
     * Clear active guides
     */
    clearActiveGuides() {
        this.activeGuides = [];
    }
    
    /**
     * Set enabled state
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearActiveGuides();
        }
    }
}

export default {
    Ruler,
    RulerManager,
    SmartGuide,
    SmartGuideSystem
};
