/**
 * Asciistrator - Shape Drawing Tools
 * 
 * Tools for creating geometric shapes.
 */

import { Vector2D } from '../core/math/vector2d.js';
import { Tool, ToolCursors } from './base.js';
import { Rectangle as RectangleShape } from '../objects/shapes.js';
import { Ellipse as EllipseShape } from '../objects/shapes.js';
import { Polygon as PolygonShape } from '../objects/shapes.js';
import { Star as StarShape } from '../objects/shapes.js';
import { Line as LineShape, Polyline } from '../objects/line.js';

// ==========================================
// BASE SHAPE TOOL
// ==========================================

/**
 * ShapeTool - Base class for shape creation tools
 */
export class ShapeTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, options);
        
        /** @type {object|null} Shape being created */
        this._previewShape = null;
        
        /** @type {boolean} Draw from center (alt key) */
        this.fromCenter = false;
        
        /** @type {boolean} Constrain proportions (shift key) */
        this.constrain = false;
    }

    /**
     * Create the shape object (override in subclasses)
     * @param {Vector2D} start
     * @param {Vector2D} end
     * @returns {object}
     */
    createShape(start, end) {
        throw new Error('createShape must be implemented');
    }

    /**
     * Update shape during drag (override if needed)
     * @param {object} shape
     * @param {Vector2D} start
     * @param {Vector2D} end
     */
    updateShape(shape, start, end) {
        // Default implementation for rectangular shapes
        const bounds = this._calculateBounds(start, end);
        shape.x = bounds.x;
        shape.y = bounds.y;
        shape.width = bounds.width;
        shape.height = bounds.height;
    }

    /**
     * Calculate bounds from start and end points
     * @protected
     */
    _calculateBounds(start, end) {
        let x, y, width, height;

        if (this.fromCenter) {
            const dx = Math.abs(end.x - start.x);
            const dy = Math.abs(end.y - start.y);
            
            if (this.constrain) {
                const size = Math.max(dx, dy);
                width = size * 2;
                height = size * 2;
            } else {
                width = dx * 2;
                height = dy * 2;
            }
            
            x = start.x - width / 2;
            y = start.y - height / 2;
        } else {
            if (this.constrain) {
                const dx = Math.abs(end.x - start.x);
                const dy = Math.abs(end.y - start.y);
                const size = Math.max(dx, dy);
                
                width = size;
                height = size;
                x = start.x < end.x ? start.x : start.x - size;
                y = start.y < end.y ? start.y : start.y - size;
            } else {
                x = Math.min(start.x, end.x);
                y = Math.min(start.y, end.y);
                width = Math.abs(end.x - start.x);
                height = Math.abs(end.y - start.y);
            }
        }

        return { x, y, width, height };
    }

    onDragStart(event) {
        this.fromCenter = this.state.altKey;
        this.constrain = this.state.shiftKey;
        
        // Create preview shape
        this._previewShape = this.createShape(
            this.state.startPoint,
            this.state.currentPoint
        );
        
        if (this._previewShape) {
            this._previewShape.isPreview = true;
        }
        
        this.beginAction(`Create ${this.name}`);
    }

    onDrag(event) {
        this.fromCenter = this.state.altKey;
        this.constrain = this.state.shiftKey;
        
        if (this._previewShape) {
            let end = this.state.currentPoint;
            
            // Apply grid snapping
            if (this.manager.snapToGrid) {
                end = this.snapToGrid(end);
            }
            
            this.updateShape(this._previewShape, this.state.startPoint, end);
        }
        
        this.requestRedraw();
    }

    onDragEnd(event) {
        if (this._previewShape) {
            // Only add if shape has reasonable size
            const bounds = this._previewShape.getBounds ? this._previewShape.getBounds() : null;
            
            if (bounds && (bounds.maxX - bounds.minX > 1 || bounds.maxY - bounds.minY > 1)) {
                this._previewShape.isPreview = false;
                this.addObject(this._previewShape);
                
                // Select the new shape
                if (this.selection) {
                    this.selection.clear();
                    this.selection.select(this._previewShape);
                }
            }
        }
        
        this._previewShape = null;
        this.endAction();
        this.requestRedraw();
    }

    render(ctx) {
        // Render preview shape
        if (this._previewShape && this._previewShape.rasterize) {
            // Temporarily set preview style
            const originalOpacity = this._previewShape.opacity;
            this._previewShape.opacity = 0.7;
            
            this._previewShape.rasterize(ctx);
            
            this._previewShape.opacity = originalOpacity;
        }
    }

    onKeyDown(event) {
        // Update modifiers
        this.fromCenter = event.altKey;
        this.constrain = event.shiftKey;
        
        if (this.state.isDragging && this._previewShape) {
            let end = this.state.currentPoint;
            if (this.manager.snapToGrid) {
                end = this.snapToGrid(end);
            }
            this.updateShape(this._previewShape, this.state.startPoint, end);
            this.requestRedraw();
        }
        
        return false;
    }

    onKeyUp(event) {
        this.fromCenter = event.altKey;
        this.constrain = event.shiftKey;
        
        if (this.state.isDragging && this._previewShape) {
            let end = this.state.currentPoint;
            if (this.manager.snapToGrid) {
                end = this.snapToGrid(end);
            }
            this.updateShape(this._previewShape, this.state.startPoint, end);
            this.requestRedraw();
        }
        
        return false;
    }
}

// ==========================================
// RECTANGLE TOOL
// ==========================================

/**
 * RectangleTool - Draw rectangles and squares
 */
export class RectangleTool extends ShapeTool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'rectangle',
            name: 'Rectangle',
            description: 'Draw rectangles and squares',
            shortcut: 'r',
            icon: '▢',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });
        
        /** @type {number} Corner radius */
        this.cornerRadius = options.cornerRadius || 0;
    }

    createShape(start, end) {
        const bounds = this._calculateBounds(start, end);
        
        return new RectangleShape({
            x: bounds.x,
            y: bounds.y,
            width: Math.max(bounds.width, 1),
            height: Math.max(bounds.height, 1),
            cornerRadius: this.cornerRadius
        });
    }

    /**
     * Set corner radius
     * @param {number} radius
     */
    setCornerRadius(radius) {
        this.cornerRadius = Math.max(0, radius);
        this.emit('cornerRadiusChanged', this.cornerRadius);
    }
}

// ==========================================
// ROUNDED RECTANGLE TOOL
// ==========================================

/**
 * RoundedRectangleTool - Draw rectangles with rounded corners
 */
export class RoundedRectangleTool extends RectangleTool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'rounded-rectangle',
            name: 'Rounded Rectangle',
            description: 'Draw rectangles with rounded corners',
            shortcut: 'shift+r',
            icon: '▢',
            cornerRadius: options.cornerRadius || 3,
            ...options
        });
    }
}

// ==========================================
// ELLIPSE TOOL
// ==========================================

/**
 * EllipseTool - Draw ellipses and circles
 */
export class EllipseTool extends ShapeTool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'ellipse',
            name: 'Ellipse',
            description: 'Draw ellipses and circles',
            shortcut: 'o',
            icon: '○',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });
    }

    createShape(start, end) {
        const bounds = this._calculateBounds(start, end);
        
        return new EllipseShape({
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2,
            radiusX: Math.max(bounds.width / 2, 0.5),
            radiusY: Math.max(bounds.height / 2, 0.5)
        });
    }

    updateShape(shape, start, end) {
        const bounds = this._calculateBounds(start, end);
        
        shape.x = bounds.x + bounds.width / 2;
        shape.y = bounds.y + bounds.height / 2;
        shape.radiusX = Math.max(bounds.width / 2, 0.5);
        shape.radiusY = Math.max(bounds.height / 2, 0.5);
        shape.invalidate();
    }
}

// ==========================================
// POLYGON TOOL
// ==========================================

/**
 * PolygonTool - Draw regular polygons
 */
export class PolygonTool extends ShapeTool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'polygon',
            name: 'Polygon',
            description: 'Draw regular polygons',
            shortcut: 'shift+o',
            icon: '⬡',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });
        
        /** @type {number} Number of sides */
        this.sides = options.sides || 6;
    }

    createShape(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        const rotation = Math.atan2(dy, dx) - Math.PI / 2;
        
        return new PolygonShape({
            x: start.x,
            y: start.y,
            radius: Math.max(radius, 1),
            sides: this.sides,
            rotation: rotation
        });
    }

    updateShape(shape, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        shape.x = start.x;
        shape.y = start.y;
        shape.radius = Math.max(radius, 1);
        
        // Rotate to follow mouse unless shift is held
        if (!this.constrain) {
            shape.rotation = Math.atan2(dy, dx) - Math.PI / 2;
        }
        
        shape.invalidate();
    }

    /**
     * Set number of sides
     * @param {number} sides
     */
    setSides(sides) {
        this.sides = Math.max(3, Math.min(100, sides));
        this.emit('sidesChanged', this.sides);
    }

    onKeyDown(event) {
        // Up/Down to change sides
        if (event.key === 'ArrowUp') {
            this.setSides(this.sides + 1);
            if (this._previewShape) {
                this._previewShape.sides = this.sides;
                this._previewShape.invalidate();
                this.requestRedraw();
            }
            return true;
        }
        if (event.key === 'ArrowDown') {
            this.setSides(this.sides - 1);
            if (this._previewShape) {
                this._previewShape.sides = this.sides;
                this._previewShape.invalidate();
                this.requestRedraw();
            }
            return true;
        }
        
        return super.onKeyDown(event);
    }
}

// ==========================================
// STAR TOOL
// ==========================================

/**
 * StarTool - Draw multi-pointed stars
 */
export class StarTool extends ShapeTool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'star',
            name: 'Star',
            description: 'Draw multi-pointed stars',
            shortcut: '*',
            icon: '★',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });
        
        /** @type {number} Number of points */
        this.points = options.points || 5;
        
        /** @type {number} Inner radius ratio (0-1) */
        this.innerRadiusRatio = options.innerRadiusRatio || 0.5;
    }

    createShape(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const outerRadius = Math.sqrt(dx * dx + dy * dy);
        const innerRadius = outerRadius * this.innerRadiusRatio;
        const rotation = Math.atan2(dy, dx) - Math.PI / 2;
        
        return new StarShape({
            x: start.x,
            y: start.y,
            outerRadius: Math.max(outerRadius, 1),
            innerRadius: Math.max(innerRadius, 0.5),
            points: this.points,
            rotation: rotation
        });
    }

    updateShape(shape, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const outerRadius = Math.sqrt(dx * dx + dy * dy);
        
        shape.x = start.x;
        shape.y = start.y;
        shape.outerRadius = Math.max(outerRadius, 1);
        shape.innerRadius = Math.max(outerRadius * this.innerRadiusRatio, 0.5);
        
        // Rotate to follow mouse unless shift is held
        if (!this.constrain) {
            shape.rotation = Math.atan2(dy, dx) - Math.PI / 2;
        }
        
        shape.invalidate();
    }

    /**
     * Set number of points
     * @param {number} points
     */
    setPoints(points) {
        this.points = Math.max(3, Math.min(50, points));
        this.emit('pointsChanged', this.points);
    }

    /**
     * Set inner radius ratio
     * @param {number} ratio
     */
    setInnerRadiusRatio(ratio) {
        this.innerRadiusRatio = Math.max(0.1, Math.min(0.9, ratio));
        this.emit('innerRadiusChanged', this.innerRadiusRatio);
    }

    onKeyDown(event) {
        // Up/Down to change points
        if (event.key === 'ArrowUp') {
            this.setPoints(this.points + 1);
            if (this._previewShape) {
                this._previewShape.points = this.points;
                this._previewShape.invalidate();
                this.requestRedraw();
            }
            return true;
        }
        if (event.key === 'ArrowDown') {
            this.setPoints(this.points - 1);
            if (this._previewShape) {
                this._previewShape.points = this.points;
                this._previewShape.invalidate();
                this.requestRedraw();
            }
            return true;
        }
        
        // Left/Right to change inner radius
        if (event.key === 'ArrowLeft') {
            this.setInnerRadiusRatio(this.innerRadiusRatio - 0.05);
            if (this._previewShape) {
                this._previewShape.innerRadius = this._previewShape.outerRadius * this.innerRadiusRatio;
                this._previewShape.invalidate();
                this.requestRedraw();
            }
            return true;
        }
        if (event.key === 'ArrowRight') {
            this.setInnerRadiusRatio(this.innerRadiusRatio + 0.05);
            if (this._previewShape) {
                this._previewShape.innerRadius = this._previewShape.outerRadius * this.innerRadiusRatio;
                this._previewShape.invalidate();
                this.requestRedraw();
            }
            return true;
        }
        
        return super.onKeyDown(event);
    }
}

// ==========================================
// LINE TOOL
// ==========================================

/**
 * LineTool - Draw straight lines
 */
export class LineTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'line',
            name: 'Line',
            description: 'Draw straight lines',
            shortcut: '\\',
            icon: '╱',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });
        
        /** @type {object|null} Line being created */
        this._previewLine = null;
        
        /** @type {string} Start arrow type */
        this.startArrow = options.startArrow || 'none';
        
        /** @type {string} End arrow type */
        this.endArrow = options.endArrow || 'none';
    }

    onDragStart(event) {
        let start = this.state.startPoint;
        
        if (this.manager.snapToGrid) {
            start = this.snapToGrid(start);
        }
        
        this._previewLine = new LineShape({
            x1: start.x,
            y1: start.y,
            x2: start.x,
            y2: start.y,
            startArrow: this.startArrow,
            endArrow: this.endArrow
        });
        
        this._previewLine.isPreview = true;
        this.beginAction('Create line');
    }

    onDrag(event) {
        if (!this._previewLine) return;
        
        let end = this.state.currentPoint;
        
        if (this.manager.snapToGrid) {
            end = this.snapToGrid(end);
        }
        
        // Constrain to 45-degree angles if shift held
        if (this.state.shiftKey) {
            end = this.constrainAngle(this.state.startPoint, end);
        }
        
        this._previewLine.x2 = end.x;
        this._previewLine.y2 = end.y;
        this._previewLine.invalidate();
        
        this.requestRedraw();
    }

    onDragEnd(event) {
        if (this._previewLine) {
            // Only add if line has reasonable length
            const length = Math.sqrt(
                (this._previewLine.x2 - this._previewLine.x1) ** 2 +
                (this._previewLine.y2 - this._previewLine.y1) ** 2
            );
            
            if (length > 1) {
                this._previewLine.isPreview = false;
                this.addObject(this._previewLine);
                
                if (this.selection) {
                    this.selection.clear();
                    this.selection.select(this._previewLine);
                }
            }
        }
        
        this._previewLine = null;
        this.endAction();
        this.requestRedraw();
    }

    render(ctx) {
        if (this._previewLine && this._previewLine.rasterize) {
            const originalOpacity = this._previewLine.opacity;
            this._previewLine.opacity = 0.7;
            this._previewLine.rasterize(ctx);
            this._previewLine.opacity = originalOpacity;
        }
    }

    /**
     * Set arrow styles
     * @param {string} start
     * @param {string} end
     */
    setArrows(start, end) {
        this.startArrow = start;
        this.endArrow = end;
        this.emit('arrowsChanged', { start, end });
    }
}

// ==========================================
// POLYLINE TOOL
// ==========================================

/**
 * PolylineTool - Draw connected line segments
 */
export class PolylineTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'polyline',
            name: 'Polyline',
            description: 'Draw connected line segments',
            shortcut: 'shift+\\',
            icon: '╲╱',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });
        
        /** @type {Array<{x: number, y: number}>} Points being drawn */
        this._points = [];
        
        /** @type {object|null} Preview polyline */
        this._previewLine = null;
        
        /** @type {Vector2D|null} Current mouse position */
        this._currentPos = null;
        
        /** @type {boolean} Is closed polyline */
        this.closed = options.closed || false;
    }

    onClick(event) {
        let point = this.state.currentPoint;
        
        if (this.manager.snapToGrid) {
            point = this.snapToGrid(point);
        }
        
        // Check if clicking near start point to close
        if (this._points.length > 2) {
            const firstPoint = this._points[0];
            const dist = point.distanceTo(new Vector2D(firstPoint.x, firstPoint.y));
            
            if (dist < 10) {
                this._finishPolyline(true);
                return;
            }
        }
        
        // Add point
        this._points.push({ x: point.x, y: point.y });
        
        if (this._points.length === 1) {
            this.beginAction('Create polyline');
        }
        
        this._updatePreview();
        this.requestRedraw();
    }

    onPointerMove(event) {
        super.onPointerMove(event);
        
        if (this._points.length > 0) {
            this._currentPos = this.state.currentPoint;
            
            if (this.manager.snapToGrid) {
                this._currentPos = this.snapToGrid(this._currentPos);
            }
            
            if (this.state.shiftKey && this._points.length > 0) {
                const lastPoint = this._points[this._points.length - 1];
                this._currentPos = this.constrainAngle(
                    new Vector2D(lastPoint.x, lastPoint.y),
                    this._currentPos
                );
            }
            
            this._updatePreview();
            this.requestRedraw();
        }
    }

    onDoubleClick(event) {
        if (this._points.length > 1) {
            this._finishPolyline(false);
        }
    }

    onKeyDown(event) {
        if (event.key === 'Escape') {
            // Cancel polyline
            this._points = [];
            this._previewLine = null;
            this._currentPos = null;
            this.endAction();
            this.requestRedraw();
            return true;
        }
        
        if (event.key === 'Enter') {
            if (this._points.length > 1) {
                this._finishPolyline(false);
            }
            return true;
        }
        
        if (event.key === 'Backspace' || event.key === 'Delete') {
            // Remove last point
            if (this._points.length > 0) {
                this._points.pop();
                this._updatePreview();
                this.requestRedraw();
            }
            return true;
        }
        
        return super.onKeyDown(event);
    }

    _updatePreview() {
        if (this._points.length === 0) {
            this._previewLine = null;
            return;
        }
        
        const points = [...this._points];
        
        // Add current mouse position as preview point
        if (this._currentPos) {
            points.push({ x: this._currentPos.x, y: this._currentPos.y });
        }
        
        this._previewLine = new Polyline({
            points: points,
            closed: false
        });
        this._previewLine.isPreview = true;
    }

    _finishPolyline(closed) {
        if (this._points.length < 2) {
            this._points = [];
            this._previewLine = null;
            this._currentPos = null;
            return;
        }
        
        const polyline = new Polyline({
            points: this._points.map(p => ({ x: p.x, y: p.y })),
            closed: closed
        });
        
        this.addObject(polyline);
        
        if (this.selection) {
            this.selection.clear();
            this.selection.select(polyline);
        }
        
        this._points = [];
        this._previewLine = null;
        this._currentPos = null;
        
        this.endAction();
        this.requestRedraw();
    }

    render(ctx) {
        if (this._previewLine && this._previewLine.rasterize) {
            this._previewLine.rasterize(ctx);
        }
        
        // Render points
        if (ctx.setChar && this._points.length > 0) {
            for (let i = 0; i < this._points.length; i++) {
                const p = this._points[i];
                const char = i === 0 ? '◉' : '○';
                ctx.setChar(Math.floor(p.x), Math.floor(p.y), char);
            }
        }
    }

    deactivate() {
        // Finish any in-progress polyline
        if (this._points.length > 1) {
            this._finishPolyline(false);
        } else {
            this._points = [];
            this._previewLine = null;
            this._currentPos = null;
        }
        
        super.deactivate();
    }
}

// ==========================================
// ARC TOOL
// ==========================================

/**
 * ArcTool - Draw arc segments
 */
export class ArcTool extends ShapeTool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'arc',
            name: 'Arc',
            description: 'Draw arc segments',
            shortcut: 'shift+\\',
            icon: '◜',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });
        
        /** @type {number} Start angle in radians */
        this.startAngle = options.startAngle || 0;
        
        /** @type {number} Sweep angle in radians */
        this.sweepAngle = options.sweepAngle || Math.PI;
    }

    createShape(start, end) {
        const bounds = this._calculateBounds(start, end);
        
        return new EllipseShape({
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2,
            radiusX: Math.max(bounds.width / 2, 0.5),
            radiusY: Math.max(bounds.height / 2, 0.5),
            startAngle: this.startAngle,
            endAngle: this.startAngle + this.sweepAngle
        });
    }

    updateShape(shape, start, end) {
        const bounds = this._calculateBounds(start, end);
        
        shape.x = bounds.x + bounds.width / 2;
        shape.y = bounds.y + bounds.height / 2;
        shape.radiusX = Math.max(bounds.width / 2, 0.5);
        shape.radiusY = Math.max(bounds.height / 2, 0.5);
        shape.invalidate();
    }

    /**
     * Set arc angles
     * @param {number} startAngle
     * @param {number} sweepAngle
     */
    setAngles(startAngle, sweepAngle) {
        this.startAngle = startAngle;
        this.sweepAngle = sweepAngle;
        this.emit('anglesChanged', { startAngle, sweepAngle });
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    ShapeTool,
    RectangleTool,
    RoundedRectangleTool,
    EllipseTool,
    PolygonTool,
    StarTool,
    LineTool,
    PolylineTool,
    ArcTool
};
