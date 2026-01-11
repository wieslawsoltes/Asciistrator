/**
 * Asciistrator - Grid System
 * 
 * Configurable grid with snap-to-grid functionality for precise alignment.
 */

import { Vector2D } from '../math/vector2d.js';
import { EventEmitter } from '../../utils/events.js';

// ==========================================
// GRID
// ==========================================

/**
 * Grid - Configurable grid system
 */
export class Grid extends EventEmitter {
    /**
     * Create a new grid
     * @param {object} [options]
     */
    constructor(options = {}) {
        super();
        
        /** @type {boolean} Grid visible */
        this.visible = options.visible !== false;
        
        /** @type {boolean} Snap to grid enabled */
        this.snapEnabled = options.snapEnabled !== false;
        
        /** @type {number} Grid spacing in world units */
        this.spacing = options.spacing || 1;
        
        /** @type {number} Major grid line interval */
        this.majorInterval = options.majorInterval || 5;
        
        /** @type {number} Subdivision count */
        this.subdivisions = options.subdivisions || 1;
        
        /** @type {string} Grid type: 'rectangular', 'isometric', 'polar' */
        this.type = options.type || 'rectangular';
        
        /** @type {string} Minor grid color */
        this.minorColor = options.minorColor || 'rgba(128, 128, 128, 0.2)';
        
        /** @type {string} Major grid color */
        this.majorColor = options.majorColor || 'rgba(128, 128, 128, 0.4)';
        
        /** @type {string} Grid character for ASCII display */
        this.minorChar = options.minorChar || '·';
        
        /** @type {string} Major grid character */
        this.majorChar = options.majorChar || '+';
        
        /** @type {number} Snap threshold in world units */
        this.snapThreshold = options.snapThreshold || 0.5;
        
        /** @type {{x: number, y: number}} Grid origin offset */
        this.origin = options.origin || { x: 0, y: 0 };
        
        /** @type {number} Grid rotation in radians (for isometric) */
        this.rotation = options.rotation || 0;
        
        /** @type {boolean} Show origin axes */
        this.showOrigin = options.showOrigin || false;
    }
    
    // ==========================================
    // CONFIGURATION
    // ==========================================
    
    /**
     * Set grid spacing
     * @param {number} spacing 
     */
    setSpacing(spacing) {
        if (spacing > 0 && spacing !== this.spacing) {
            this.spacing = spacing;
            this.emit('change', { property: 'spacing', value: spacing });
        }
    }
    
    /**
     * Set major interval
     * @param {number} interval 
     */
    setMajorInterval(interval) {
        if (interval > 0 && interval !== this.majorInterval) {
            this.majorInterval = interval;
            this.emit('change', { property: 'majorInterval', value: interval });
        }
    }
    
    /**
     * Set subdivisions
     * @param {number} count 
     */
    setSubdivisions(count) {
        if (count >= 1 && count !== this.subdivisions) {
            this.subdivisions = Math.floor(count);
            this.emit('change', { property: 'subdivisions', value: this.subdivisions });
        }
    }
    
    /**
     * Set grid type
     * @param {string} type - 'rectangular', 'isometric', 'polar'
     */
    setType(type) {
        if (['rectangular', 'isometric', 'polar'].includes(type) && type !== this.type) {
            this.type = type;
            this.emit('change', { property: 'type', value: type });
        }
    }
    
    /**
     * Set visibility
     * @param {boolean} visible 
     */
    setVisible(visible) {
        if (visible !== this.visible) {
            this.visible = visible;
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
     * Set snap enabled
     * @param {boolean} enabled 
     */
    setSnapEnabled(enabled) {
        if (enabled !== this.snapEnabled) {
            this.snapEnabled = enabled;
            this.emit('snapchange', { enabled });
        }
    }
    
    /**
     * Toggle snap
     */
    toggleSnap() {
        this.setSnapEnabled(!this.snapEnabled);
    }
    
    /**
     * Set origin
     * @param {number} x 
     * @param {number} y 
     */
    setOrigin(x, y) {
        this.origin = { x, y };
        this.emit('change', { property: 'origin', value: this.origin });
    }
    
    // ==========================================
    // SNAPPING
    // ==========================================
    
    /**
     * Snap point to grid
     * @param {number} x 
     * @param {number} y 
     * @returns {{x: number, y: number, snapped: boolean}}
     */
    snapPoint(x, y) {
        if (!this.snapEnabled) {
            return { x, y, snapped: false };
        }
        
        switch (this.type) {
            case 'isometric':
                return this._snapIsometric(x, y);
            case 'polar':
                return this._snapPolar(x, y);
            default:
                return this._snapRectangular(x, y);
        }
    }
    
    /**
     * Snap to rectangular grid
     * @private
     */
    _snapRectangular(x, y) {
        const effectiveSpacing = this.spacing / this.subdivisions;
        
        // Adjust for origin
        const relX = x - this.origin.x;
        const relY = y - this.origin.y;
        
        // Snap to nearest grid point
        const snappedRelX = Math.round(relX / effectiveSpacing) * effectiveSpacing;
        const snappedRelY = Math.round(relY / effectiveSpacing) * effectiveSpacing;
        
        // Check if within threshold
        const deltaX = Math.abs(relX - snappedRelX);
        const deltaY = Math.abs(relY - snappedRelY);
        
        const threshold = this.snapThreshold * effectiveSpacing;
        
        const result = {
            x: deltaX <= threshold ? snappedRelX + this.origin.x : x,
            y: deltaY <= threshold ? snappedRelY + this.origin.y : y,
            snapped: false
        };
        
        result.snapped = result.x !== x || result.y !== y;
        
        return result;
    }
    
    /**
     * Snap to isometric grid
     * @private
     */
    _snapIsometric(x, y) {
        const angle = Math.PI / 6; // 30 degrees for isometric
        const spacing = this.spacing;
        
        // Transform to isometric coordinates
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const relX = x - this.origin.x;
        const relY = y - this.origin.y;
        
        // Project onto isometric axes
        const isoX = relX * cos + relY * sin;
        const isoY = -relX * sin + relY * cos;
        
        // Snap
        const snappedIsoX = Math.round(isoX / spacing) * spacing;
        const snappedIsoY = Math.round(isoY / spacing) * spacing;
        
        // Transform back
        const snappedX = snappedIsoX * cos - snappedIsoY * sin + this.origin.x;
        const snappedY = snappedIsoX * sin + snappedIsoY * cos + this.origin.y;
        
        // Check threshold
        const dist = Math.sqrt((x - snappedX) ** 2 + (y - snappedY) ** 2);
        const threshold = this.snapThreshold * spacing;
        
        if (dist <= threshold) {
            return { x: snappedX, y: snappedY, snapped: true };
        }
        
        return { x, y, snapped: false };
    }
    
    /**
     * Snap to polar grid
     * @private
     */
    _snapPolar(x, y) {
        const relX = x - this.origin.x;
        const relY = y - this.origin.y;
        
        // Convert to polar
        const radius = Math.sqrt(relX * relX + relY * relY);
        const angle = Math.atan2(relY, relX);
        
        // Snap radius
        const snappedRadius = Math.round(radius / this.spacing) * this.spacing;
        
        // Snap angle (divide circle into segments based on majorInterval)
        const angleStep = (2 * Math.PI) / (this.majorInterval * 4);
        const snappedAngle = Math.round(angle / angleStep) * angleStep;
        
        // Convert back to cartesian
        const snappedX = snappedRadius * Math.cos(snappedAngle) + this.origin.x;
        const snappedY = snappedRadius * Math.sin(snappedAngle) + this.origin.y;
        
        // Check threshold
        const dist = Math.sqrt((x - snappedX) ** 2 + (y - snappedY) ** 2);
        const threshold = this.snapThreshold * this.spacing;
        
        if (dist <= threshold) {
            return { x: snappedX, y: snappedY, snapped: true };
        }
        
        return { x, y, snapped: false };
    }
    
    /**
     * Snap vector to grid
     * @param {Vector2D} point 
     * @returns {Vector2D}
     */
    snapVector(point) {
        const result = this.snapPoint(point.x, point.y);
        return new Vector2D(result.x, result.y);
    }
    
    /**
     * Snap value to grid (1D)
     * @param {number} value 
     * @returns {number}
     */
    snapValue(value) {
        if (!this.snapEnabled) return value;
        
        const effectiveSpacing = this.spacing / this.subdivisions;
        const snapped = Math.round(value / effectiveSpacing) * effectiveSpacing;
        const delta = Math.abs(value - snapped);
        const threshold = this.snapThreshold * effectiveSpacing;
        
        return delta <= threshold ? snapped : value;
    }
    
    /**
     * Snap angle to grid (for polar mode)
     * @param {number} angle - Angle in radians
     * @returns {number}
     */
    snapAngle(angle) {
        if (!this.snapEnabled) return angle;
        
        const angleStep = (2 * Math.PI) / (this.majorInterval * 4);
        const snapped = Math.round(angle / angleStep) * angleStep;
        const delta = Math.abs(angle - snapped);
        
        return delta <= angleStep * this.snapThreshold ? snapped : angle;
    }
    
    // ==========================================
    // GRID GENERATION
    // ==========================================
    
    /**
     * Get grid lines within bounds
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     * @returns {{minor: Array, major: Array}}
     */
    getGridLines(minX, minY, maxX, maxY) {
        switch (this.type) {
            case 'isometric':
                return this._getIsometricLines(minX, minY, maxX, maxY);
            case 'polar':
                return this._getPolarLines(minX, minY, maxX, maxY);
            default:
                return this._getRectangularLines(minX, minY, maxX, maxY);
        }
    }
    
    /**
     * Get rectangular grid lines
     * @private
     */
    _getRectangularLines(minX, minY, maxX, maxY) {
        const effectiveSpacing = this.spacing / this.subdivisions;
        const majorSpacing = this.spacing * this.majorInterval;
        
        const minor = [];
        const major = [];
        
        // Vertical lines
        const startX = Math.floor((minX - this.origin.x) / effectiveSpacing) * effectiveSpacing + this.origin.x;
        for (let x = startX; x <= maxX; x += effectiveSpacing) {
            const isMajor = Math.abs(((x - this.origin.x) / this.spacing) % this.majorInterval) < 0.001;
            const line = {
                type: 'vertical',
                x,
                y1: minY,
                y2: maxY
            };
            (isMajor ? major : minor).push(line);
        }
        
        // Horizontal lines
        const startY = Math.floor((minY - this.origin.y) / effectiveSpacing) * effectiveSpacing + this.origin.y;
        for (let y = startY; y <= maxY; y += effectiveSpacing) {
            const isMajor = Math.abs(((y - this.origin.y) / this.spacing) % this.majorInterval) < 0.001;
            const line = {
                type: 'horizontal',
                y,
                x1: minX,
                x2: maxX
            };
            (isMajor ? major : minor).push(line);
        }
        
        return { minor, major };
    }
    
    /**
     * Get isometric grid lines
     * @private
     */
    _getIsometricLines(minX, minY, maxX, maxY) {
        const spacing = this.spacing;
        const angle = Math.PI / 6; // 30 degrees
        
        const minor = [];
        const major = [];
        
        // Calculate bounds in isometric space
        const diagonal = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
        const count = Math.ceil(diagonal / spacing) + 2;
        
        // Lines going one direction
        for (let i = -count; i <= count; i++) {
            const isMajor = i % this.majorInterval === 0;
            
            // Positive slope lines
            const offset1 = i * spacing;
            minor.push({
                type: 'diagonal',
                angle: angle,
                offset: offset1,
                x1: minX,
                y1: minY,
                x2: maxX,
                y2: maxY
            });
            
            // Negative slope lines
            minor.push({
                type: 'diagonal',
                angle: -angle,
                offset: offset1,
                x1: minX,
                y1: minY,
                x2: maxX,
                y2: maxY
            });
        }
        
        return { minor, major };
    }
    
    /**
     * Get polar grid lines
     * @private
     */
    _getPolarLines(minX, minY, maxX, maxY) {
        const minor = [];
        const major = [];
        
        // Calculate max radius needed
        const corners = [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: minX, y: maxY },
            { x: maxX, y: maxY }
        ];
        
        let maxRadius = 0;
        for (const corner of corners) {
            const dist = Math.sqrt(
                (corner.x - this.origin.x) ** 2 + 
                (corner.y - this.origin.y) ** 2
            );
            maxRadius = Math.max(maxRadius, dist);
        }
        
        // Concentric circles
        for (let r = this.spacing; r <= maxRadius; r += this.spacing) {
            const isMajor = (r / this.spacing) % this.majorInterval === 0;
            const circle = {
                type: 'circle',
                cx: this.origin.x,
                cy: this.origin.y,
                radius: r
            };
            (isMajor ? major : minor).push(circle);
        }
        
        // Radial lines
        const angleStep = (2 * Math.PI) / (this.majorInterval * 4);
        for (let angle = 0; angle < 2 * Math.PI; angle += angleStep) {
            const isMajor = (angle / angleStep) % 4 === 0;
            const line = {
                type: 'radial',
                cx: this.origin.x,
                cy: this.origin.y,
                angle,
                radius: maxRadius
            };
            (isMajor ? major : minor).push(line);
        }
        
        return { minor, major };
    }
    
    /**
     * Get grid points within bounds (for ASCII rendering)
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     * @returns {Array<{x: number, y: number, major: boolean}>}
     */
    getGridPoints(minX, minY, maxX, maxY) {
        const points = [];
        const effectiveSpacing = this.spacing / this.subdivisions;
        
        if (this.type === 'rectangular') {
            const startX = Math.floor((minX - this.origin.x) / effectiveSpacing) * effectiveSpacing + this.origin.x;
            const startY = Math.floor((minY - this.origin.y) / effectiveSpacing) * effectiveSpacing + this.origin.y;
            
            for (let y = startY; y <= maxY; y += effectiveSpacing) {
                for (let x = startX; x <= maxX; x += effectiveSpacing) {
                    const gridX = Math.round((x - this.origin.x) / this.spacing);
                    const gridY = Math.round((y - this.origin.y) / this.spacing);
                    const isMajor = gridX % this.majorInterval === 0 && gridY % this.majorInterval === 0;
                    
                    points.push({ x, y, major: isMajor });
                }
            }
        }
        
        return points;
    }
    
    // ==========================================
    // ASCII RENDERING
    // ==========================================
    
    /**
     * Render grid to ASCII buffer
     * @param {import('../ascii/rasterizer.js').AsciiBuffer} buffer 
     * @param {import('./canvas.js').VirtualCanvas} canvas 
     * @param {object} [options]
     */
    renderToBuffer(buffer, canvas, options = {}) {
        if (!this.visible) return;
        
        const { showMinor = true, showMajor = true } = options;
        
        const effectiveSpacing = this.spacing / this.subdivisions;
        
        for (let charY = 0; charY < canvas.charHeight; charY++) {
            for (let charX = 0; charX < canvas.charWidth; charX++) {
                const world = canvas.charCenterToWorld(charX, charY);
                
                // Check if this is a grid point
                const relX = world.x - this.origin.x;
                const relY = world.y - this.origin.y;
                
                const gridX = relX / effectiveSpacing;
                const gridY = relY / effectiveSpacing;
                
                const isOnGridX = Math.abs(gridX - Math.round(gridX)) < 0.1;
                const isOnGridY = Math.abs(gridY - Math.round(gridY)) < 0.1;
                
                if (isOnGridX && isOnGridY) {
                    const roundedGridX = Math.round(gridX) * this.subdivisions;
                    const roundedGridY = Math.round(gridY) * this.subdivisions;
                    
                    const isMajorX = roundedGridX % this.majorInterval === 0;
                    const isMajorY = roundedGridY % this.majorInterval === 0;
                    const isMajor = isMajorX && isMajorY;
                    
                    // Only render if cell is empty
                    if (buffer.getChar(charX, charY) === ' ' || buffer.getChar(charX, charY) === buffer.fillChar) {
                        if (isMajor && showMajor) {
                            buffer.setChar(charX, charY, this.majorChar, this.majorColor, -1);
                        } else if (!isMajor && showMinor) {
                            buffer.setChar(charX, charY, this.minorChar, this.minorColor, -2);
                        }
                    }
                }
            }
        }
    }
    
    // ==========================================
    // SERIALIZATION
    // ==========================================
    
    /**
     * Get grid configuration
     * @returns {object}
     */
    toJSON() {
        return {
            visible: this.visible,
            snapEnabled: this.snapEnabled,
            spacing: this.spacing,
            majorInterval: this.majorInterval,
            subdivisions: this.subdivisions,
            type: this.type,
            minorColor: this.minorColor,
            majorColor: this.majorColor,
            minorChar: this.minorChar,
            majorChar: this.majorChar,
            snapThreshold: this.snapThreshold,
            origin: { ...this.origin },
            rotation: this.rotation,
            showOrigin: this.showOrigin
        };
    }
    
    /**
     * Create grid from configuration
     * @param {object} config 
     * @returns {Grid}
     */
    static fromJSON(config) {
        return new Grid(config);
    }
}

// ==========================================
// GUIDE
// ==========================================

/**
 * Guide - A draggable guide line
 */
export class Guide extends EventEmitter {
    /**
     * Create a new guide
     * @param {object} options
     * @param {string} options.type - 'horizontal' or 'vertical'
     * @param {number} options.position - Position in world units
     * @param {string} [options.color] - Guide color
     */
    constructor(options) {
        super();
        
        /** @type {string} */
        this.id = options.id || `guide_${Date.now()}`;
        
        /** @type {string} */
        this.type = options.type;
        
        /** @type {number} */
        this.position = options.position;
        
        /** @type {string} */
        this.color = options.color || '#00aaff';
        
        /** @type {boolean} */
        this.locked = options.locked || false;
        
        /** @type {boolean} */
        this.visible = options.visible !== false;
        
        /** @type {string} */
        this.char = options.char || (this.type === 'horizontal' ? '─' : '│');
    }
    
    /**
     * Set position
     * @param {number} position 
     */
    setPosition(position) {
        if (!this.locked && position !== this.position) {
            const oldPosition = this.position;
            this.position = position;
            this.emit('move', { oldPosition, newPosition: position });
        }
    }
    
    /**
     * Check if point is near guide
     * @param {number} x 
     * @param {number} y 
     * @param {number} [threshold=5]
     * @returns {boolean}
     */
    isNear(x, y, threshold = 5) {
        if (this.type === 'horizontal') {
            return Math.abs(y - this.position) <= threshold;
        } else {
            return Math.abs(x - this.position) <= threshold;
        }
    }
    
    /**
     * Snap point to guide
     * @param {number} x 
     * @param {number} y 
     * @param {number} [threshold=5]
     * @returns {{x: number, y: number, snapped: boolean}}
     */
    snapPoint(x, y, threshold = 5) {
        if (this.type === 'horizontal' && Math.abs(y - this.position) <= threshold) {
            return { x, y: this.position, snapped: true };
        } else if (this.type === 'vertical' && Math.abs(x - this.position) <= threshold) {
            return { x: this.position, y, snapped: true };
        }
        return { x, y, snapped: false };
    }
    
    /**
     * Serialize
     * @returns {object}
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            color: this.color,
            locked: this.locked,
            visible: this.visible
        };
    }
    
    /**
     * Create from JSON
     * @param {object} data 
     * @returns {Guide}
     */
    static fromJSON(data) {
        return new Guide(data);
    }
}

// ==========================================
// GUIDE MANAGER
// ==========================================

/**
 * Guide Manager - Manages multiple guides
 */
export class GuideManager extends EventEmitter {
    constructor() {
        super();
        
        /** @type {Map<string, Guide>} */
        this.guides = new Map();
        
        /** @type {boolean} */
        this.visible = true;
        
        /** @type {boolean} */
        this.snapEnabled = true;
        
        /** @type {number} */
        this.snapThreshold = 5;
    }
    
    /**
     * Add a guide
     * @param {Guide|object} guide 
     * @returns {Guide}
     */
    addGuide(guide) {
        if (!(guide instanceof Guide)) {
            guide = new Guide(guide);
        }
        
        this.guides.set(guide.id, guide);
        this.emit('guideadded', { guide });
        return guide;
    }
    
    /**
     * Remove a guide
     * @param {string} id 
     * @returns {boolean}
     */
    removeGuide(id) {
        const guide = this.guides.get(id);
        if (guide) {
            this.guides.delete(id);
            this.emit('guideremoved', { guide });
            return true;
        }
        return false;
    }
    
    /**
     * Get guide by ID
     * @param {string} id 
     * @returns {Guide|null}
     */
    getGuide(id) {
        return this.guides.get(id) || null;
    }
    
    /**
     * Get all guides
     * @returns {Guide[]}
     */
    getAllGuides() {
        return [...this.guides.values()];
    }
    
    /**
     * Get horizontal guides
     * @returns {Guide[]}
     */
    getHorizontalGuides() {
        return this.getAllGuides().filter(g => g.type === 'horizontal');
    }
    
    /**
     * Get vertical guides
     * @returns {Guide[]}
     */
    getVerticalGuides() {
        return this.getAllGuides().filter(g => g.type === 'vertical');
    }
    
    /**
     * Clear all guides
     */
    clearGuides() {
        this.guides.clear();
        this.emit('guidescleared');
    }
    
    /**
     * Snap point to nearest guide
     * @param {number} x 
     * @param {number} y 
     * @returns {{x: number, y: number, snappedX: boolean, snappedY: boolean}}
     */
    snapPoint(x, y) {
        if (!this.snapEnabled || !this.visible) {
            return { x, y, snappedX: false, snappedY: false };
        }
        
        let resultX = x;
        let resultY = y;
        let snappedX = false;
        let snappedY = false;
        
        let nearestVDist = this.snapThreshold;
        let nearestHDist = this.snapThreshold;
        
        for (const guide of this.guides.values()) {
            if (!guide.visible) continue;
            
            if (guide.type === 'vertical') {
                const dist = Math.abs(x - guide.position);
                if (dist < nearestVDist) {
                    nearestVDist = dist;
                    resultX = guide.position;
                    snappedX = true;
                }
            } else {
                const dist = Math.abs(y - guide.position);
                if (dist < nearestHDist) {
                    nearestHDist = dist;
                    resultY = guide.position;
                    snappedY = true;
                }
            }
        }
        
        return { x: resultX, y: resultY, snappedX, snappedY };
    }
    
    /**
     * Find guide at point
     * @param {number} x 
     * @param {number} y 
     * @param {number} [threshold=5]
     * @returns {Guide|null}
     */
    findGuideAt(x, y, threshold = 5) {
        for (const guide of this.guides.values()) {
            if (guide.visible && guide.isNear(x, y, threshold)) {
                return guide;
            }
        }
        return null;
    }
    
    /**
     * Set visibility
     * @param {boolean} visible 
     */
    setVisible(visible) {
        if (this.visible !== visible) {
            this.visible = visible;
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
     * Serialize
     * @returns {object}
     */
    toJSON() {
        return {
            visible: this.visible,
            snapEnabled: this.snapEnabled,
            snapThreshold: this.snapThreshold,
            guides: this.getAllGuides().map(g => g.toJSON())
        };
    }
    
    /**
     * Load from JSON
     * @param {object} data 
     */
    fromJSON(data) {
        this.visible = data.visible !== false;
        this.snapEnabled = data.snapEnabled !== false;
        this.snapThreshold = data.snapThreshold || 5;
        
        this.guides.clear();
        if (data.guides) {
            for (const guideData of data.guides) {
                this.addGuide(Guide.fromJSON(guideData));
            }
        }
    }
}

export default {
    Grid,
    Guide,
    GuideManager
};
