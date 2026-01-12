/**
 * SmartGuides - Figma-like alignment guides, snapping, and distance indicators
 * 
 * Provides visual feedback when moving/resizing objects:
 * - Alignment guides (center, edge alignment with other objects)
 * - Distance indicators (gap measurements between objects)
 * - Smart snapping (snap to edges, centers, grid, canvas)
 */

/**
 * Configuration for snap and guide behavior
 */
const SnapConfig = {
    enabled: true,
    snapTolerance: 3,           // Pixels/chars to snap within
    showGuides: true,           // Show alignment guide lines
    showDistances: true,        // Show distance measurements
    showPositionLabel: true,    // Show position indicator during drag
    
    // Snap targets
    snapToGrid: true,
    snapToObjects: true,
    snapToObjectCenters: true,
    snapToObjectEdges: true,
    snapToCanvasEdges: true,
    snapToCanvasCenter: true,
    
    // Visual settings
    guideColor: '#ff00ff',      // Magenta for guides
    distanceColor: '#00ffff',   // Cyan for distance labels
    snapIndicatorColor: '#ffff00', // Yellow for snap indicators
    positionColor: '#ffffff',   // White for position labels
    
    // Grid
    gridSize: 4
};

/**
 * Represents a guide line for rendering
 */
class GuideLine {
    constructor(type, axis, position, start, end) {
        this.type = type;       // 'edge', 'center', 'spacing'
        this.axis = axis;       // 'horizontal', 'vertical'
        this.position = position; // The x or y coordinate of the guide
        this.start = start;     // Start position on perpendicular axis
        this.end = end;         // End position on perpendicular axis
    }
}

/**
 * Represents a distance indicator for rendering
 */
class DistanceIndicator {
    constructor(x1, y1, x2, y2, distance, axis) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.distance = distance;
        this.axis = axis;       // 'horizontal', 'vertical'
    }
}

/**
 * Represents a snap result
 */
class SnapResult {
    constructor(originalX, originalY) {
        this.originalX = originalX;
        this.originalY = originalY;
        this.snappedX = originalX;
        this.snappedY = originalY;
        this.snapTypeX = null;  // 'grid', 'edge', 'center', 'canvas'
        this.snapTypeY = null;
        this.guides = [];       // GuideLine objects to render
        this.distances = [];    // DistanceIndicator objects to render
    }
}

/**
 * Main SmartGuides class
 */
class SmartGuides {
    constructor() {
        this.config = { ...SnapConfig };
        this.activeGuides = [];
        this.activeDistances = [];
        this.lastSnapResult = null;
    }
    
    /**
     * Calculate snap position and generate guides for a moving object
     * @param {Object} movingBounds - { x, y, width, height } of the object being moved
     * @param {Array} otherObjects - Array of other objects to snap to
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @returns {SnapResult}
     */
    calculateSnap(movingBounds, otherObjects, canvasWidth, canvasHeight) {
        const result = new SnapResult(movingBounds.x, movingBounds.y);
        
        if (!this.config.enabled) {
            return result;
        }
        
        const tolerance = this.config.snapTolerance;
        
        // Calculate moving object's key positions
        const movingLeft = movingBounds.x;
        const movingRight = movingBounds.x + movingBounds.width - 1;
        const movingTop = movingBounds.y;
        const movingBottom = movingBounds.y + movingBounds.height - 1;
        const movingCenterX = Math.floor(movingBounds.x + movingBounds.width / 2);
        const movingCenterY = Math.floor(movingBounds.y + movingBounds.height / 2);
        
        let bestSnapX = null;
        let bestSnapY = null;
        let bestDistX = tolerance + 1;
        let bestDistY = tolerance + 1;
        
        // Snap to grid
        if (this.config.snapToGrid) {
            const gridSize = this.config.gridSize;
            const nearestGridX = Math.round(movingLeft / gridSize) * gridSize;
            const nearestGridY = Math.round(movingTop / gridSize) * gridSize;
            
            const distToGridX = Math.abs(movingLeft - nearestGridX);
            const distToGridY = Math.abs(movingTop - nearestGridY);
            
            if (distToGridX <= tolerance && distToGridX < bestDistX) {
                bestSnapX = nearestGridX;
                bestDistX = distToGridX;
                result.snapTypeX = 'grid';
            }
            if (distToGridY <= tolerance && distToGridY < bestDistY) {
                bestSnapY = nearestGridY;
                bestDistY = distToGridY;
                result.snapTypeY = 'grid';
            }
        }
        
        // Snap to canvas edges and center
        if (this.config.snapToCanvasEdges) {
            // Left edge
            if (Math.abs(movingLeft) <= tolerance && Math.abs(movingLeft) < bestDistX) {
                bestSnapX = 0;
                bestDistX = Math.abs(movingLeft);
                result.snapTypeX = 'canvas-edge';
                result.guides.push(new GuideLine('edge', 'vertical', 0, 0, canvasHeight - 1));
            }
            // Right edge
            if (Math.abs(movingRight - (canvasWidth - 1)) <= tolerance && Math.abs(movingRight - (canvasWidth - 1)) < bestDistX) {
                bestSnapX = canvasWidth - movingBounds.width;
                bestDistX = Math.abs(movingRight - (canvasWidth - 1));
                result.snapTypeX = 'canvas-edge';
                result.guides.push(new GuideLine('edge', 'vertical', canvasWidth - 1, 0, canvasHeight - 1));
            }
            // Top edge
            if (Math.abs(movingTop) <= tolerance && Math.abs(movingTop) < bestDistY) {
                bestSnapY = 0;
                bestDistY = Math.abs(movingTop);
                result.snapTypeY = 'canvas-edge';
                result.guides.push(new GuideLine('edge', 'horizontal', 0, 0, canvasWidth - 1));
            }
            // Bottom edge
            if (Math.abs(movingBottom - (canvasHeight - 1)) <= tolerance && Math.abs(movingBottom - (canvasHeight - 1)) < bestDistY) {
                bestSnapY = canvasHeight - movingBounds.height;
                bestDistY = Math.abs(movingBottom - (canvasHeight - 1));
                result.snapTypeY = 'canvas-edge';
                result.guides.push(new GuideLine('edge', 'horizontal', canvasHeight - 1, 0, canvasWidth - 1));
            }
        }
        
        // Snap to canvas center
        if (this.config.snapToCanvasCenter) {
            const canvasCenterX = Math.floor(canvasWidth / 2);
            const canvasCenterY = Math.floor(canvasHeight / 2);
            
            // Center horizontally
            const distToCenterX = Math.abs(movingCenterX - canvasCenterX);
            if (distToCenterX <= tolerance && distToCenterX < bestDistX) {
                bestSnapX = canvasCenterX - Math.floor(movingBounds.width / 2);
                bestDistX = distToCenterX;
                result.snapTypeX = 'canvas-center';
                result.guides.push(new GuideLine('center', 'vertical', canvasCenterX, 0, canvasHeight - 1));
            }
            
            // Center vertically
            const distToCenterY = Math.abs(movingCenterY - canvasCenterY);
            if (distToCenterY <= tolerance && distToCenterY < bestDistY) {
                bestSnapY = canvasCenterY - Math.floor(movingBounds.height / 2);
                bestDistY = distToCenterY;
                result.snapTypeY = 'canvas-center';
                result.guides.push(new GuideLine('center', 'horizontal', canvasCenterY, 0, canvasWidth - 1));
            }
        }
        
        // Snap to other objects
        if (this.config.snapToObjects && otherObjects && otherObjects.length > 0) {
            for (const other of otherObjects) {
                if (!other.visible) continue;
                
                const otherBounds = other.getBounds ? other.getBounds() : { x: other.x, y: other.y, width: other.width || 1, height: other.height || 1 };
                const otherLeft = otherBounds.x;
                const otherRight = otherBounds.x + otherBounds.width - 1;
                const otherTop = otherBounds.y;
                const otherBottom = otherBounds.y + otherBounds.height - 1;
                const otherCenterX = Math.floor(otherBounds.x + otherBounds.width / 2);
                const otherCenterY = Math.floor(otherBounds.y + otherBounds.height / 2);
                
                // Edge snapping
                if (this.config.snapToObjectEdges) {
                    // Left to left
                    if (Math.abs(movingLeft - otherLeft) <= tolerance && Math.abs(movingLeft - otherLeft) < bestDistX) {
                        bestSnapX = otherLeft;
                        bestDistX = Math.abs(movingLeft - otherLeft);
                        result.snapTypeX = 'object-edge';
                        result.guides.push(new GuideLine('edge', 'vertical', otherLeft, 
                            Math.min(movingTop, otherTop), Math.max(movingBottom, otherBottom)));
                    }
                    // Right to right
                    if (Math.abs(movingRight - otherRight) <= tolerance && Math.abs(movingRight - otherRight) < bestDistX) {
                        bestSnapX = otherRight - movingBounds.width + 1;
                        bestDistX = Math.abs(movingRight - otherRight);
                        result.snapTypeX = 'object-edge';
                        result.guides.push(new GuideLine('edge', 'vertical', otherRight, 
                            Math.min(movingTop, otherTop), Math.max(movingBottom, otherBottom)));
                    }
                    // Left to right (adjacent)
                    if (Math.abs(movingLeft - otherRight - 1) <= tolerance && Math.abs(movingLeft - otherRight - 1) < bestDistX) {
                        bestSnapX = otherRight + 1;
                        bestDistX = Math.abs(movingLeft - otherRight - 1);
                        result.snapTypeX = 'object-edge';
                    }
                    // Right to left (adjacent)
                    if (Math.abs(movingRight - otherLeft + 1) <= tolerance && Math.abs(movingRight - otherLeft + 1) < bestDistX) {
                        bestSnapX = otherLeft - movingBounds.width;
                        bestDistX = Math.abs(movingRight - otherLeft + 1);
                        result.snapTypeX = 'object-edge';
                    }
                    
                    // Top to top
                    if (Math.abs(movingTop - otherTop) <= tolerance && Math.abs(movingTop - otherTop) < bestDistY) {
                        bestSnapY = otherTop;
                        bestDistY = Math.abs(movingTop - otherTop);
                        result.snapTypeY = 'object-edge';
                        result.guides.push(new GuideLine('edge', 'horizontal', otherTop, 
                            Math.min(movingLeft, otherLeft), Math.max(movingRight, otherRight)));
                    }
                    // Bottom to bottom
                    if (Math.abs(movingBottom - otherBottom) <= tolerance && Math.abs(movingBottom - otherBottom) < bestDistY) {
                        bestSnapY = otherBottom - movingBounds.height + 1;
                        bestDistY = Math.abs(movingBottom - otherBottom);
                        result.snapTypeY = 'object-edge';
                        result.guides.push(new GuideLine('edge', 'horizontal', otherBottom, 
                            Math.min(movingLeft, otherLeft), Math.max(movingRight, otherRight)));
                    }
                    // Top to bottom (adjacent)
                    if (Math.abs(movingTop - otherBottom - 1) <= tolerance && Math.abs(movingTop - otherBottom - 1) < bestDistY) {
                        bestSnapY = otherBottom + 1;
                        bestDistY = Math.abs(movingTop - otherBottom - 1);
                        result.snapTypeY = 'object-edge';
                    }
                    // Bottom to top (adjacent)
                    if (Math.abs(movingBottom - otherTop + 1) <= tolerance && Math.abs(movingBottom - otherTop + 1) < bestDistY) {
                        bestSnapY = otherTop - movingBounds.height;
                        bestDistY = Math.abs(movingBottom - otherTop + 1);
                        result.snapTypeY = 'object-edge';
                    }
                }
                
                // Center snapping
                if (this.config.snapToObjectCenters) {
                    // Center X alignment
                    if (Math.abs(movingCenterX - otherCenterX) <= tolerance && Math.abs(movingCenterX - otherCenterX) < bestDistX) {
                        bestSnapX = otherCenterX - Math.floor(movingBounds.width / 2);
                        bestDistX = Math.abs(movingCenterX - otherCenterX);
                        result.snapTypeX = 'object-center';
                        result.guides.push(new GuideLine('center', 'vertical', otherCenterX, 
                            Math.min(movingTop, otherTop), Math.max(movingBottom, otherBottom)));
                    }
                    // Center Y alignment
                    if (Math.abs(movingCenterY - otherCenterY) <= tolerance && Math.abs(movingCenterY - otherCenterY) < bestDistY) {
                        bestSnapY = otherCenterY - Math.floor(movingBounds.height / 2);
                        bestDistY = Math.abs(movingCenterY - otherCenterY);
                        result.snapTypeY = 'object-center';
                        result.guides.push(new GuideLine('center', 'horizontal', otherCenterY, 
                            Math.min(movingLeft, otherLeft), Math.max(movingRight, otherRight)));
                    }
                }
                
                // Calculate distance indicators for nearby objects
                if (this.config.showDistances) {
                    this._addDistanceIndicators(result, movingBounds, otherBounds);
                }
            }
        }
        
        // Apply best snap positions
        if (bestSnapX !== null) {
            result.snappedX = bestSnapX;
        }
        if (bestSnapY !== null) {
            result.snappedY = bestSnapY;
        }
        
        this.lastSnapResult = result;
        return result;
    }
    
    /**
     * Add distance indicators between moving object and another object
     */
    _addDistanceIndicators(result, movingBounds, otherBounds) {
        const movingLeft = movingBounds.x;
        const movingRight = movingBounds.x + movingBounds.width - 1;
        const movingTop = movingBounds.y;
        const movingBottom = movingBounds.y + movingBounds.height - 1;
        const movingCenterY = Math.floor(movingBounds.y + movingBounds.height / 2);
        const movingCenterX = Math.floor(movingBounds.x + movingBounds.width / 2);
        
        const otherLeft = otherBounds.x;
        const otherRight = otherBounds.x + otherBounds.width - 1;
        const otherTop = otherBounds.y;
        const otherBottom = otherBounds.y + otherBounds.height - 1;
        const otherCenterY = Math.floor(otherBounds.y + otherBounds.height / 2);
        const otherCenterX = Math.floor(otherBounds.x + otherBounds.width / 2);
        
        // Check if objects are horizontally adjacent (vertically overlapping)
        const vOverlap = !(movingBottom < otherTop || movingTop > otherBottom);
        if (vOverlap) {
            const y = Math.floor((Math.max(movingTop, otherTop) + Math.min(movingBottom, otherBottom)) / 2);
            
            // Gap on the left
            if (movingLeft > otherRight) {
                const gap = movingLeft - otherRight - 1;
                if (gap > 0 && gap < 20) {
                    result.distances.push(new DistanceIndicator(
                        otherRight + 1, y, movingLeft - 1, y, gap, 'horizontal'
                    ));
                }
            }
            // Gap on the right
            if (movingRight < otherLeft) {
                const gap = otherLeft - movingRight - 1;
                if (gap > 0 && gap < 20) {
                    result.distances.push(new DistanceIndicator(
                        movingRight + 1, y, otherLeft - 1, y, gap, 'horizontal'
                    ));
                }
            }
        }
        
        // Check if objects are vertically adjacent (horizontally overlapping)
        const hOverlap = !(movingRight < otherLeft || movingLeft > otherRight);
        if (hOverlap) {
            const x = Math.floor((Math.max(movingLeft, otherLeft) + Math.min(movingRight, otherRight)) / 2);
            
            // Gap above
            if (movingTop > otherBottom) {
                const gap = movingTop - otherBottom - 1;
                if (gap > 0 && gap < 20) {
                    result.distances.push(new DistanceIndicator(
                        x, otherBottom + 1, x, movingTop - 1, gap, 'vertical'
                    ));
                }
            }
            // Gap below
            if (movingBottom < otherTop) {
                const gap = otherTop - movingBottom - 1;
                if (gap > 0 && gap < 20) {
                    result.distances.push(new DistanceIndicator(
                        x, movingBottom + 1, x, otherTop - 1, gap, 'vertical'
                    ));
                }
            }
        }
    }
    
    /**
     * Render guides and indicators to a buffer
     * @param {Object} buffer - The preview buffer to render to
     * @param {SnapResult} snapResult - The snap result with guides and distances
     * @param {Object} currentBounds - Current bounds of moving object for position label
     */
    renderGuides(buffer, snapResult, currentBounds) {
        if (!snapResult) return;
        
        const width = buffer.width;
        const height = buffer.height;
        
        // Render guide lines
        if (this.config.showGuides) {
            for (const guide of snapResult.guides) {
                const color = guide.type === 'center' ? '#ff00ff' : '#00ffff';
                const char = guide.axis === 'vertical' ? '│' : '─';
                
                if (guide.axis === 'vertical') {
                    const x = guide.position;
                    if (x >= 0 && x < width) {
                        for (let y = guide.start; y <= guide.end; y++) {
                            if (y >= 0 && y < height) {
                                buffer.setChar(x, y, char, color);
                            }
                        }
                        // Draw small indicators at ends
                        if (guide.start >= 0 && guide.start < height) {
                            buffer.setChar(x, guide.start, '┬', color);
                        }
                        if (guide.end >= 0 && guide.end < height) {
                            buffer.setChar(x, guide.end, '┴', color);
                        }
                    }
                } else {
                    const y = guide.position;
                    if (y >= 0 && y < height) {
                        for (let x = guide.start; x <= guide.end; x++) {
                            if (x >= 0 && x < width) {
                                buffer.setChar(x, y, char, color);
                            }
                        }
                        // Draw small indicators at ends
                        if (guide.start >= 0 && guide.start < width) {
                            buffer.setChar(guide.start, y, '├', color);
                        }
                        if (guide.end >= 0 && guide.end < width) {
                            buffer.setChar(guide.end, y, '┤', color);
                        }
                    }
                }
            }
        }
        
        // Render distance indicators
        if (this.config.showDistances) {
            for (const dist of snapResult.distances) {
                const color = this.config.distanceColor;
                
                if (dist.axis === 'horizontal') {
                    // Draw horizontal distance line
                    const y = dist.y1;
                    if (y >= 0 && y < height) {
                        for (let x = dist.x1; x <= dist.x2; x++) {
                            if (x >= 0 && x < width) {
                                buffer.setChar(x, y, '·', color);
                            }
                        }
                        // Draw distance label in the middle
                        const midX = Math.floor((dist.x1 + dist.x2) / 2);
                        const label = dist.distance.toString();
                        this._renderLabel(buffer, midX - Math.floor(label.length / 2), y - 1, label, color);
                    }
                } else {
                    // Draw vertical distance line
                    const x = dist.x1;
                    if (x >= 0 && x < width) {
                        for (let y = dist.y1; y <= dist.y2; y++) {
                            if (y >= 0 && y < height) {
                                buffer.setChar(x, y, '·', color);
                            }
                        }
                        // Draw distance label
                        const midY = Math.floor((dist.y1 + dist.y2) / 2);
                        const label = dist.distance.toString();
                        this._renderLabel(buffer, x + 1, midY, label, color);
                    }
                }
            }
        }
        
        // Render position label
        if (this.config.showPositionLabel && currentBounds) {
            const posLabel = `${currentBounds.x},${currentBounds.y}`;
            // Position label above the object
            const labelX = currentBounds.x;
            const labelY = currentBounds.y - 1;
            this._renderLabel(buffer, labelX, labelY, posLabel, this.config.positionColor);
            
            // If snapped, show snap indicator
            if (snapResult.snapTypeX || snapResult.snapTypeY) {
                const snapLabel = '⊙';
                buffer.setChar(currentBounds.x - 1, currentBounds.y - 1, snapLabel, this.config.snapIndicatorColor);
            }
        }
    }
    
    /**
     * Render a text label to the buffer
     */
    _renderLabel(buffer, x, y, text, color) {
        if (y < 0 || y >= buffer.height) return;
        for (let i = 0; i < text.length; i++) {
            const px = x + i;
            if (px >= 0 && px < buffer.width) {
                buffer.setChar(px, y, text[i], color);
            }
        }
    }
    
    /**
     * Toggle snapping on/off
     */
    toggleSnapping() {
        this.config.enabled = !this.config.enabled;
        return this.config.enabled;
    }
    
    /**
     * Update config
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
    }
    
    /**
     * Clear active guides
     */
    clearGuides() {
        this.activeGuides = [];
        this.activeDistances = [];
        this.lastSnapResult = null;
    }
}

/**
 * Canvas resize handler for Figma-like canvas border handles
 */
class CanvasResizeHandler {
    constructor() {
        this.isResizing = false;
        this.resizeHandle = null;  // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
        this.startWidth = 0;
        this.startHeight = 0;
        this.startMouseX = 0;
        this.startMouseY = 0;
        
        // Visual settings
        this.handleSize = 8;      // Size of resize handles in pixels
        this.handleColor = '#666';
        this.activeColor = '#00aaff';
        this.sizeIndicatorColor = '#ffffff';
    }
    
    /**
     * Check if mouse position is over a canvas resize handle
     * @param {number} mouseX - Mouse X in canvas container coordinates
     * @param {number} mouseY - Mouse Y in canvas container coordinates
     * @param {DOMRect} canvasRect - Bounding rect of the canvas element
     * @returns {string|null} Handle name or null
     */
    getHandleAt(mouseX, mouseY, canvasRect) {
        const margin = this.handleSize;
        const left = canvasRect.left;
        const right = canvasRect.right;
        const top = canvasRect.top;
        const bottom = canvasRect.bottom;
        const midX = (left + right) / 2;
        const midY = (top + bottom) / 2;
        
        // Check corners first
        if (mouseX >= left - margin && mouseX <= left + margin &&
            mouseY >= top - margin && mouseY <= top + margin) {
            return 'nw';
        }
        if (mouseX >= right - margin && mouseX <= right + margin &&
            mouseY >= top - margin && mouseY <= top + margin) {
            return 'ne';
        }
        if (mouseX >= left - margin && mouseX <= left + margin &&
            mouseY >= bottom - margin && mouseY <= bottom + margin) {
            return 'sw';
        }
        if (mouseX >= right - margin && mouseX <= right + margin &&
            mouseY >= bottom - margin && mouseY <= bottom + margin) {
            return 'se';
        }
        
        // Check edges
        if (mouseY >= top - margin && mouseY <= top + margin &&
            mouseX >= midX - 20 && mouseX <= midX + 20) {
            return 'n';
        }
        if (mouseY >= bottom - margin && mouseY <= bottom + margin &&
            mouseX >= midX - 20 && mouseX <= midX + 20) {
            return 's';
        }
        if (mouseX >= left - margin && mouseX <= left + margin &&
            mouseY >= midY - 20 && mouseY <= midY + 20) {
            return 'w';
        }
        if (mouseX >= right - margin && mouseX <= right + margin &&
            mouseY >= midY - 20 && mouseY <= midY + 20) {
            return 'e';
        }
        
        return null;
    }
    
    /**
     * Get cursor style for a handle
     */
    getCursor(handle) {
        const cursors = {
            'n': 'ns-resize',
            's': 'ns-resize',
            'e': 'ew-resize',
            'w': 'ew-resize',
            'nw': 'nwse-resize',
            'se': 'nwse-resize',
            'ne': 'nesw-resize',
            'sw': 'nesw-resize'
        };
        return cursors[handle] || 'default';
    }
    
    /**
     * Start canvas resize operation
     */
    startResize(handle, mouseX, mouseY, canvasWidth, canvasHeight) {
        this.isResizing = true;
        this.resizeHandle = handle;
        this.startWidth = canvasWidth;
        this.startHeight = canvasHeight;
        this.startMouseX = mouseX;
        this.startMouseY = mouseY;
    }
    
    /**
     * Calculate new canvas size during resize
     * @param {number} mouseX - Current mouse X
     * @param {number} mouseY - Current mouse Y
     * @param {number} charWidth - Width of a character in pixels
     * @param {number} charHeight - Height of a character in pixels
     * @returns {{ width: number, height: number }} New canvas dimensions in characters
     */
    calculateNewSize(mouseX, mouseY, charWidth, charHeight) {
        const dx = Math.round((mouseX - this.startMouseX) / charWidth);
        const dy = Math.round((mouseY - this.startMouseY) / charHeight);
        
        let newWidth = this.startWidth;
        let newHeight = this.startHeight;
        
        switch (this.resizeHandle) {
            case 'e':
            case 'ne':
            case 'se':
                newWidth = this.startWidth + dx;
                break;
            case 'w':
            case 'nw':
            case 'sw':
                newWidth = this.startWidth - dx;
                break;
        }
        
        switch (this.resizeHandle) {
            case 's':
            case 'se':
            case 'sw':
                newHeight = this.startHeight + dy;
                break;
            case 'n':
            case 'ne':
            case 'nw':
                newHeight = this.startHeight - dy;
                break;
        }
        
        // Enforce minimum size
        newWidth = Math.max(10, newWidth);
        newHeight = Math.max(5, newHeight);
        
        // Enforce reasonable maximum
        newWidth = Math.min(500, newWidth);
        newHeight = Math.min(200, newHeight);
        
        return { width: newWidth, height: newHeight };
    }
    
    /**
     * End resize operation
     */
    endResize() {
        this.isResizing = false;
        this.resizeHandle = null;
    }
    
    /**
     * Render canvas resize handles as HTML overlay
     * @param {HTMLElement} container - Container element for handles
     * @param {DOMRect} canvasRect - Canvas bounding rect
     */
    renderHandles(container, canvasRect) {
        // Remove existing handles
        const existingHandles = container.querySelectorAll('.canvas-resize-handle');
        existingHandles.forEach(h => h.remove());
        
        const handles = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
        const size = this.handleSize;
        
        for (const handle of handles) {
            const el = document.createElement('div');
            el.className = 'canvas-resize-handle';
            el.dataset.handle = handle;
            el.style.position = 'absolute';
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.background = this.handleColor;
            el.style.border = '1px solid #888';
            el.style.borderRadius = '2px';
            el.style.cursor = this.getCursor(handle);
            el.style.zIndex = '100';
            
            // Position the handle
            const containerRect = container.getBoundingClientRect();
            const relLeft = canvasRect.left - containerRect.left;
            const relTop = canvasRect.top - containerRect.top;
            const relRight = canvasRect.right - containerRect.left;
            const relBottom = canvasRect.bottom - containerRect.top;
            const midX = (relLeft + relRight) / 2;
            const midY = (relTop + relBottom) / 2;
            
            switch (handle) {
                case 'nw':
                    el.style.left = `${relLeft - size / 2}px`;
                    el.style.top = `${relTop - size / 2}px`;
                    break;
                case 'n':
                    el.style.left = `${midX - size / 2}px`;
                    el.style.top = `${relTop - size / 2}px`;
                    break;
                case 'ne':
                    el.style.left = `${relRight - size / 2}px`;
                    el.style.top = `${relTop - size / 2}px`;
                    break;
                case 'w':
                    el.style.left = `${relLeft - size / 2}px`;
                    el.style.top = `${midY - size / 2}px`;
                    break;
                case 'e':
                    el.style.left = `${relRight - size / 2}px`;
                    el.style.top = `${midY - size / 2}px`;
                    break;
                case 'sw':
                    el.style.left = `${relLeft - size / 2}px`;
                    el.style.top = `${relBottom - size / 2}px`;
                    break;
                case 's':
                    el.style.left = `${midX - size / 2}px`;
                    el.style.top = `${relBottom - size / 2}px`;
                    break;
                case 'se':
                    el.style.left = `${relRight - size / 2}px`;
                    el.style.top = `${relBottom - size / 2}px`;
                    break;
            }
            
            container.appendChild(el);
        }
    }
    
    /**
     * Create and show size indicator tooltip
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} x - Screen X position for tooltip
     * @param {number} y - Screen Y position for tooltip
     */
    showSizeIndicator(width, height, x, y) {
        let indicator = document.getElementById('canvas-size-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'canvas-size-indicator';
            indicator.style.position = 'fixed';
            indicator.style.background = 'rgba(0, 0, 0, 0.8)';
            indicator.style.color = this.sizeIndicatorColor;
            indicator.style.padding = '4px 8px';
            indicator.style.borderRadius = '4px';
            indicator.style.fontSize = '12px';
            indicator.style.fontFamily = 'monospace';
            indicator.style.zIndex = '1000';
            indicator.style.pointerEvents = 'none';
            indicator.style.whiteSpace = 'nowrap';
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = `${width} × ${height}`;
        indicator.style.left = `${x + 15}px`;
        indicator.style.top = `${y + 15}px`;
        indicator.style.display = 'block';
    }
    
    /**
     * Hide size indicator
     */
    hideSizeIndicator() {
        const indicator = document.getElementById('canvas-size-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    /**
     * Remove all handles
     */
    removeHandles(container) {
        const handles = container.querySelectorAll('.canvas-resize-handle');
        handles.forEach(h => h.remove());
    }
}

// Export for use in app.js
if (typeof window !== 'undefined') {
    window.SmartGuides = SmartGuides;
    window.CanvasResizeHandler = CanvasResizeHandler;
    window.SnapConfig = SnapConfig;
}

export { SmartGuides, CanvasResizeHandler, SnapConfig, GuideLine, DistanceIndicator, SnapResult };
