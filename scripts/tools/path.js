/**
 * Asciistrator - Path Drawing Tools
 * 
 * Tools for creating and editing bezier paths.
 */

import { Vector2D } from '../core/math/vector2d.js';
import { Tool, ToolCursors } from './base.js';
import { Path, AnchorPoint } from '../objects/path.js';

// ==========================================
// PEN TOOL
// ==========================================

/**
 * PenTool - Create bezier curves point by point
 */
export class PenTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'pen',
            name: 'Pen',
            description: 'Create bezier curves',
            shortcut: 'p',
            icon: '✒',
            cursor: ToolCursors.PEN,
            ...options
        });

        /** @type {Path|null} Path being created */
        this._path = null;

        /** @type {AnchorPoint|null} Current anchor being edited */
        this._currentAnchor = null;

        /** @type {boolean} Is adjusting handles */
        this._adjustingHandles = false;

        /** @type {Vector2D|null} Preview line end point */
        this._previewEnd = null;

        /** @type {string} Current mode */
        this.mode = 'create'; // 'create', 'continue', 'close', 'edit'
    }

    getCursor() {
        if (this.mode === 'close') {
            return 'crosshair'; // Could use custom cursor
        }
        if (this.mode === 'continue') {
            return 'crosshair';
        }
        if (this._adjustingHandles) {
            return ToolCursors.MOVE;
        }
        return ToolCursors.PEN;
    }

    activate() {
        super.activate();
        this._path = null;
        this._currentAnchor = null;
        this._adjustingHandles = false;
        this._previewEnd = null;
        this.mode = 'create';
    }

    deactivate() {
        // Finish any in-progress path
        this._finishPath();
        super.deactivate();
    }

    onPointerMove(event) {
        super.onPointerMove(event);

        if (this._path && this._path.anchors.length > 0) {
            let point = this.state.currentPoint;

            if (this.manager.snapToGrid) {
                point = this.snapToGrid(point);
            }

            // Check if near start point for closing
            const firstAnchor = this._path.anchors[0];
            const firstPoint = new Vector2D(firstAnchor.x, firstAnchor.y);
            const dist = point.distanceTo(firstPoint);

            if (this._path.anchors.length > 2 && dist < 10) {
                this.mode = 'close';
            } else {
                this.mode = this._path ? 'continue' : 'create';
            }

            this._previewEnd = point;
            this.requestRedraw();
        }
    }

    onPointerDown(event) {
        super.onPointerDown(event);

        let point = this.state.currentPoint;

        if (this.manager.snapToGrid) {
            point = this.snapToGrid(point);
        }

        // Check for closing the path
        if (this._path && this._path.anchors.length > 2) {
            const firstAnchor = this._path.anchors[0];
            const firstPoint = new Vector2D(firstAnchor.x, firstAnchor.y);
            const dist = point.distanceTo(firstPoint);

            if (dist < 10) {
                this._closePath();
                return;
            }
        }

        // Create new anchor
        const anchor = new AnchorPoint({
            x: point.x,
            y: point.y,
            type: 'corner'
        });

        if (!this._path) {
            // Start new path
            this._path = new Path({ closed: false });
            this._path.isPreview = true;
            this.beginAction('Create path');
        }

        this._path.addAnchor(anchor);
        this._currentAnchor = anchor;
        this._adjustingHandles = false;
    }

    onDragStart(event) {
        // User is dragging - start creating handles
        if (this._currentAnchor) {
            this._adjustingHandles = true;
            this._currentAnchor.type = 'smooth';
        }
    }

    onDrag(event) {
        if (!this._currentAnchor || !this._adjustingHandles) return;

        let point = this.state.currentPoint;

        if (this.manager.snapToGrid) {
            point = this.snapToGrid(point);
        }

        // Calculate handle offset
        const dx = point.x - this._currentAnchor.x;
        const dy = point.y - this._currentAnchor.y;

        // Set symmetric handles
        this._currentAnchor.handleOut = { x: dx, y: dy };
        this._currentAnchor.handleIn = { x: -dx, y: -dy };

        this._path.invalidate();
        this.requestRedraw();
    }

    onDragEnd(event) {
        this._adjustingHandles = false;
        this._currentAnchor = null;
    }

    onClick(event) {
        // Click without drag - corner point (handled in onPointerDown/Up)
        this._currentAnchor = null;
        this.requestRedraw();
    }

    onDoubleClick(event) {
        // Finish path on double click
        this._finishPath();
    }

    onKeyDown(event) {
        if (event.key === 'Escape') {
            // Cancel path
            this._cancelPath();
            return true;
        }

        if (event.key === 'Enter') {
            // Finish path
            this._finishPath();
            return true;
        }

        if (event.key === 'Backspace' || event.key === 'Delete') {
            // Remove last anchor
            if (this._path && this._path.anchors.length > 0) {
                this._path.removeAnchor(this._path.anchors.length - 1);
                if (this._path.anchors.length === 0) {
                    this._cancelPath();
                } else {
                    this._path.invalidate();
                    this.requestRedraw();
                }
            }
            return true;
        }

        // Alt key - toggle anchor type
        if (event.key === 'Alt' && this._currentAnchor) {
            this._currentAnchor.type = this._currentAnchor.type === 'corner' ? 'smooth' : 'corner';
            this._path.invalidate();
            this.requestRedraw();
            return true;
        }

        return super.onKeyDown(event);
    }

    _closePath() {
        if (!this._path || this._path.anchors.length < 3) return;

        this._path.closed = true;
        this._path.invalidate();
        this._finishPath();
    }

    _finishPath() {
        if (!this._path) return;

        if (this._path.anchors.length >= 2) {
            this._path.isPreview = false;
            this.addObject(this._path);

            if (this.selection) {
                this.selection.clear();
                this.selection.select(this._path);
            }

            this.endAction();
        } else {
            this._cancelPath();
        }

        this._path = null;
        this._currentAnchor = null;
        this._adjustingHandles = false;
        this._previewEnd = null;
        this.mode = 'create';

        this.requestRedraw();
    }

    _cancelPath() {
        this._path = null;
        this._currentAnchor = null;
        this._adjustingHandles = false;
        this._previewEnd = null;
        this.mode = 'create';
        this.endAction();
        this.requestRedraw();
    }

    render(ctx) {
        // Render preview path
        if (this._path && this._path.rasterize) {
            this._path.rasterize(ctx);
        }

        // Render preview line to next point
        if (this._path && this._path.anchors.length > 0 && this._previewEnd && ctx.setChar) {
            const lastAnchor = this._path.anchors[this._path.anchors.length - 1];

            // Draw preview line
            this._renderPreviewLine(ctx,
                new Vector2D(lastAnchor.x, lastAnchor.y),
                this._previewEnd
            );

            // Draw close indicator
            if (this.mode === 'close') {
                const firstAnchor = this._path.anchors[0];
                ctx.setChar(Math.floor(firstAnchor.x), Math.floor(firstAnchor.y), '◉');
            }
        }

        // Render anchor points
        if (this._path && ctx.setChar) {
            for (let i = 0; i < this._path.anchors.length; i++) {
                const anchor = this._path.anchors[i];
                const char = i === 0 ? '◉' : '○';
                ctx.setChar(Math.floor(anchor.x), Math.floor(anchor.y), char);

                // Draw handles
                if (anchor.handleIn) {
                    const hx = anchor.x + anchor.handleIn.x;
                    const hy = anchor.y + anchor.handleIn.y;
                    ctx.setChar(Math.floor(hx), Math.floor(hy), '•');
                }
                if (anchor.handleOut) {
                    const hx = anchor.x + anchor.handleOut.x;
                    const hy = anchor.y + anchor.handleOut.y;
                    ctx.setChar(Math.floor(hx), Math.floor(hy), '•');
                }
            }
        }
    }

    _renderPreviewLine(ctx, start, end) {
        // Dashed line preview using Bresenham
        let x1 = Math.floor(start.x);
        let y1 = Math.floor(start.y);
        const x2 = Math.floor(end.x);
        const y2 = Math.floor(end.y);

        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        let step = 0;

        while (true) {
            // Dashed pattern
            if (step % 3 !== 2) {
                ctx.setChar(x1, y1, '·');
            }
            step++;

            if (x1 === x2 && y1 === y2) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
        }
    }
}

// ==========================================
// PENCIL TOOL
// ==========================================

/**
 * PencilTool - Freehand drawing
 */
export class PencilTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'pencil',
            name: 'Pencil',
            description: 'Freehand drawing',
            shortcut: 'n',
            icon: '✏',
            cursor: ToolCursors.PENCIL,
            ...options
        });

        /** @type {Array<{x: number, y: number}>} Points being drawn */
        this._points = [];

        /** @type {Path|null} Preview path */
        this._previewPath = null;

        /** @type {number} Smoothing factor (0-1) */
        this.smoothing = options.smoothing !== undefined ? options.smoothing : 0.5;

        /** @type {number} Minimum distance between points */
        this.minDistance = options.minDistance || 3;
    }

    onDragStart(event) {
        let point = this.state.startPoint;

        if (this.manager.snapToGrid) {
            point = this.snapToGrid(point);
        }

        this._points = [{ x: point.x, y: point.y }];
        this.beginAction('Draw freehand');
    }

    onDrag(event) {
        let point = this.state.currentPoint;

        if (this.manager.snapToGrid) {
            point = this.snapToGrid(point);
        }

        // Only add point if far enough from last
        const lastPoint = this._points[this._points.length - 1];
        const dist = Math.sqrt(
            (point.x - lastPoint.x) ** 2 +
            (point.y - lastPoint.y) ** 2
        );

        if (dist >= this.minDistance) {
            this._points.push({ x: point.x, y: point.y });
            this._updatePreview();
            this.requestRedraw();
        }
    }

    onDragEnd(event) {
        if (this._points.length < 2) {
            this._points = [];
            this._previewPath = null;
            this.endAction();
            return;
        }

        // Create final path
        const path = this._createPathFromPoints();

        if (path) {
            this.addObject(path);

            if (this.selection) {
                this.selection.clear();
                this.selection.select(path);
            }
        }

        this._points = [];
        this._previewPath = null;
        this.endAction();
        this.requestRedraw();
    }

    _updatePreview() {
        if (this._points.length < 2) {
            this._previewPath = null;
            return;
        }

        this._previewPath = this._createPathFromPoints(true);
    }

    _createPathFromPoints(isPreview = false) {
        if (this._points.length < 2) return null;

        // Simplify points if smoothing enabled
        const points = this.smoothing > 0
            ? this._simplifyPoints(this._points)
            : this._points;

        if (points.length < 2) return null;

        const path = new Path({ closed: false });

        if (this.smoothing > 0) {
            // Create smooth path with handles
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                const anchor = new AnchorPoint({
                    x: p.x,
                    y: p.y,
                    type: i === 0 || i === points.length - 1 ? 'corner' : 'smooth'
                });

                // Calculate handles based on neighbors
                if (i > 0 && i < points.length - 1) {
                    const prev = points[i - 1];
                    const next = points[i + 1];

                    const dx = next.x - prev.x;
                    const dy = next.y - prev.y;
                    const len = Math.sqrt(dx * dx + dy * dy);

                    if (len > 0) {
                        const handleLen = len * 0.25 * this.smoothing;
                        const nx = dx / len * handleLen;
                        const ny = dy / len * handleLen;

                        anchor.handleIn = { x: -nx, y: -ny };
                        anchor.handleOut = { x: nx, y: ny };
                    }
                }

                path.addAnchor(anchor);
            }
        } else {
            // Create polyline (corner points only)
            for (const p of points) {
                path.addAnchor(new AnchorPoint({
                    x: p.x,
                    y: p.y,
                    type: 'corner'
                }));
            }
        }

        path.isPreview = isPreview;
        return path;
    }

    _simplifyPoints(points, tolerance = 2) {
        // Douglas-Peucker simplification
        if (points.length < 3) return points;

        const result = this._douglasPeucker(points, tolerance);
        return result;
    }

    _douglasPeucker(points, tolerance) {
        if (points.length < 3) return points;

        // Find point with max distance from line between first and last
        const first = points[0];
        const last = points[points.length - 1];

        let maxDist = 0;
        let maxIndex = 0;

        for (let i = 1; i < points.length - 1; i++) {
            const dist = this._pointLineDistance(points[i], first, last);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }

        // If max distance is greater than tolerance, recursively simplify
        if (maxDist > tolerance) {
            const left = this._douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
            const right = this._douglasPeucker(points.slice(maxIndex), tolerance);

            return left.slice(0, -1).concat(right);
        } else {
            return [first, last];
        }
    }

    _pointLineDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) {
            return Math.sqrt(
                (point.x - lineStart.x) ** 2 +
                (point.y - lineStart.y) ** 2
            );
        }

        const t = Math.max(0, Math.min(1,
            ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq
        ));

        const projX = lineStart.x + t * dx;
        const projY = lineStart.y + t * dy;

        return Math.sqrt(
            (point.x - projX) ** 2 +
            (point.y - projY) ** 2
        );
    }

    render(ctx) {
        // Render preview path
        if (this._previewPath && this._previewPath.rasterize) {
            this._previewPath.rasterize(ctx);
        } else if (this._points.length > 1 && ctx.setChar) {
            // Simple line preview
            for (let i = 0; i < this._points.length - 1; i++) {
                const p1 = this._points[i];
                const p2 = this._points[i + 1];
                this._renderLine(ctx, p1, p2, '·');
            }
        }
    }

    _renderLine(ctx, p1, p2, char) {
        let x1 = Math.floor(p1.x);
        let y1 = Math.floor(p1.y);
        const x2 = Math.floor(p2.x);
        const y2 = Math.floor(p2.y);

        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            ctx.setChar(x1, y1, char);

            if (x1 === x2 && y1 === y2) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
        }
    }

    /**
     * Set smoothing factor
     * @param {number} value
     */
    setSmoothing(value) {
        this.smoothing = Math.max(0, Math.min(1, value));
        this.emit('smoothingChanged', this.smoothing);
    }
}

// ==========================================
// BRUSH TOOL
// ==========================================

/**
 * BrushTool - Variable width strokes
 */
export class BrushTool extends PencilTool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'brush',
            name: 'Brush',
            description: 'Variable width strokes',
            shortcut: 'b',
            icon: '🖌',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });

        /** @type {number} Brush size */
        this.size = options.size || 3;

        /** @type {boolean} Use pressure sensitivity */
        this.pressureSensitive = options.pressureSensitive !== false;

        /** @type {Array<{x: number, y: number, pressure: number}>} Points with pressure */
        this._pointsWithPressure = [];
    }

    onDragStart(event) {
        super.onDragStart(event);

        const pressure = event.pressure !== undefined ? event.pressure : 0.5;
        this._pointsWithPressure = [{
            ...this._points[0],
            pressure
        }];
    }

    onDrag(event) {
        const lastPoint = this._points[this._points.length - 1];
        let point = this.state.currentPoint;

        if (this.manager.snapToGrid) {
            point = this.snapToGrid(point);
        }

        const dist = Math.sqrt(
            (point.x - lastPoint.x) ** 2 +
            (point.y - lastPoint.y) ** 2
        );

        if (dist >= this.minDistance) {
            const pressure = event.pressure !== undefined ? event.pressure : 0.5;
            this._points.push({ x: point.x, y: point.y });
            this._pointsWithPressure.push({
                x: point.x,
                y: point.y,
                pressure
            });
            this._updatePreview();
            this.requestRedraw();
        }
    }

    render(ctx) {
        if (!ctx.setChar) {
            super.render(ctx);
            return;
        }

        // Render with variable width based on pressure
        for (let i = 0; i < this._pointsWithPressure.length; i++) {
            const p = this._pointsWithPressure[i];
            const radius = this.pressureSensitive
                ? Math.max(1, Math.floor(this.size * p.pressure))
                : this.size;

            // Draw circle at point
            this._renderBrushPoint(ctx, p.x, p.y, radius);
        }
    }

    _renderBrushPoint(ctx, cx, cy, radius) {
        const chars = ['░', '▒', '▓', '█'];
        const x = Math.floor(cx);
        const y = Math.floor(cy);

        if (radius <= 1) {
            ctx.setChar(x, y, '█');
            return;
        }

        // Draw filled circle
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    // Gradient based on distance
                    const charIndex = Math.floor((1 - dist / radius) * (chars.length - 1));
                    ctx.setChar(x + dx, y + dy, chars[Math.min(charIndex, chars.length - 1)]);
                }
            }
        }
    }

    /**
     * Set brush size
     * @param {number} size
     */
    setSize(size) {
        this.size = Math.max(1, Math.min(20, size));
        this.emit('sizeChanged', this.size);
    }

    onKeyDown(event) {
        // [ and ] to adjust size
        if (event.key === '[') {
            this.setSize(this.size - 1);
            return true;
        }
        if (event.key === ']') {
            this.setSize(this.size + 1);
            return true;
        }

        return super.onKeyDown(event);
    }
}

// ==========================================
// ERASER TOOL
// ==========================================

/**
 * EraserTool - Erase parts of paths
 */
export class EraserTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'eraser',
            name: 'Eraser',
            description: 'Erase parts of paths',
            shortcut: 'e',
            icon: '⌫',
            cursor: ToolCursors.ERASER,
            ...options
        });

        /** @type {number} Eraser size */
        this.size = options.size || 5;

        /** @type {Array<Vector2D>} Eraser path */
        this._eraserPath = [];
    }

    onDragStart(event) {
        this._eraserPath = [this.state.startPoint.clone()];
        this.beginAction('Erase');
    }

    onDrag(event) {
        const lastPoint = this._eraserPath[this._eraserPath.length - 1];
        const dist = this.state.currentPoint.distanceTo(lastPoint);

        if (dist >= this.size / 2) {
            this._eraserPath.push(this.state.currentPoint.clone());

            // Erase objects under eraser
            this._eraseAtPoint(this.state.currentPoint);

            this.requestRedraw();
        }
    }

    onDragEnd(event) {
        this._eraserPath = [];
        this.endAction();
        this.requestRedraw();
    }

    _eraseAtPoint(point) {
        // Find objects intersecting with eraser
        const rect = {
            x: point.x - this.size / 2,
            y: point.y - this.size / 2,
            width: this.size,
            height: this.size
        };

        const objects = this.getObjectsInRect(rect);

        for (const obj of objects) {
            if (obj.type === 'path') {
                this._eraseFromPath(obj, point);
            } else {
                // For other objects, check center distance
                const bounds = obj.getBounds ? obj.getBounds() : null;
                if (bounds) {
                    const center = new Vector2D(
                        (bounds.minX + bounds.maxX) / 2,
                        (bounds.minY + bounds.maxY) / 2
                    );
                    if (center.distanceTo(point) < this.size) {
                        this.removeObject(obj);
                    }
                }
            }
        }
    }

    _eraseFromPath(path, point) {
        if (!path.anchors || path.anchors.length < 2) {
            this.removeObject(path);
            return;
        }

        // Find anchors to remove
        const toRemove = [];

        for (let i = 0; i < path.anchors.length; i++) {
            const anchor = path.anchors[i];
            const anchorPoint = new Vector2D(anchor.x, anchor.y);

            if (point.distanceTo(anchorPoint) < this.size) {
                toRemove.push(i);
            }
        }

        // Remove anchors (in reverse order to maintain indices)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            path.removeAnchor(toRemove[i]);
        }

        // Remove path if too few anchors
        if (path.anchors.length < 2) {
            this.removeObject(path);
        } else {
            path.invalidate();
        }
    }

    render(ctx) {
        if (!ctx.setChar) return;

        // Render eraser cursor
        if (this.state.currentPoint) {
            const x = Math.floor(this.state.currentPoint.x);
            const y = Math.floor(this.state.currentPoint.y);
            const r = Math.floor(this.size / 2);

            // Draw eraser outline
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (Math.abs(dist - r) < 0.5) {
                        ctx.setChar(x + dx, y + dy, '░');
                    }
                }
            }
        }

        // Render eraser path
        if (this._eraserPath.length > 0) {
            for (const p of this._eraserPath) {
                ctx.setChar(Math.floor(p.x), Math.floor(p.y), '×');
            }
        }
    }

    /**
     * Set eraser size
     * @param {number} size
     */
    setSize(size) {
        this.size = Math.max(1, Math.min(50, size));
        this.emit('sizeChanged', this.size);
    }

    onKeyDown(event) {
        if (event.key === '[') {
            this.setSize(this.size - 1);
            return true;
        }
        if (event.key === ']') {
            this.setSize(this.size + 1);
            return true;
        }

        return super.onKeyDown(event);
    }
}

// ==========================================
// SCISSORS TOOL
// ==========================================

/**
 * ScissorsTool - Cut paths at points
 */
export class ScissorsTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'scissors',
            name: 'Scissors',
            description: 'Cut paths at points',
            shortcut: 'c',
            icon: '✂',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });

        /** @type {object|null} Highlight hit result */
        this._highlight = null;
    }

    onPointerMove(event) {
        super.onPointerMove(event);

        // Find path segment under cursor
        this._highlight = this._findPathSegment(this.state.currentPoint);
        this.requestRedraw();
    }

    onClick(event) {
        if (!this._highlight) return;

        const { path, segmentIndex, t } = this._highlight;

        // Split path at this point
        this._splitPath(path, segmentIndex, t);

        this._highlight = null;
        this.commitAction('Cut path');
        this.requestRedraw();
    }

    _findPathSegment(point, tolerance = 10) {
        if (!this.document) return null;

        const layers = this.document.layers || [];

        for (const layer of layers) {
            if (!layer.visible || layer.locked) continue;

            const result = this._findInLayer(layer, point, tolerance);
            if (result) return result;
        }

        return null;
    }

    _findInLayer(layer, point, tolerance) {
        const children = layer.children || [];

        for (const child of children) {
            if (!child.visible || child.locked) continue;

            if (child.type === 'path' && child.anchors) {
                const result = this._hitTestPathSegments(child, point, tolerance);
                if (result) return result;
            }

            if (child.children) {
                const result = this._findInLayer(child, point, tolerance);
                if (result) return result;
            }
        }

        return null;
    }

    _hitTestPathSegments(path, point, tolerance) {
        if (!path.anchors || path.anchors.length < 2) return null;

        for (let i = 0; i < path.anchors.length - 1; i++) {
            const a1 = path.anchors[i];
            const a2 = path.anchors[i + 1];

            // Simple line segment test
            const p1 = new Vector2D(a1.x, a1.y);
            const p2 = new Vector2D(a2.x, a2.y);

            const result = this._pointToSegmentDistance(point, p1, p2);

            if (result.distance < tolerance) {
                return {
                    path,
                    segmentIndex: i,
                    t: result.t,
                    point: result.closest
                };
            }
        }

        // Check closing segment if closed
        if (path.closed && path.anchors.length > 2) {
            const a1 = path.anchors[path.anchors.length - 1];
            const a2 = path.anchors[0];

            const p1 = new Vector2D(a1.x, a1.y);
            const p2 = new Vector2D(a2.x, a2.y);

            const result = this._pointToSegmentDistance(point, p1, p2);

            if (result.distance < tolerance) {
                return {
                    path,
                    segmentIndex: path.anchors.length - 1,
                    t: result.t,
                    point: result.closest
                };
            }
        }

        return null;
    }

    _pointToSegmentDistance(point, p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;

        let t = 0;
        if (lenSq > 0) {
            t = Math.max(0, Math.min(1,
                ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lenSq
            ));
        }

        const closest = new Vector2D(
            p1.x + t * dx,
            p1.y + t * dy
        );

        return {
            distance: point.distanceTo(closest),
            t,
            closest
        };
    }

    _splitPath(path, segmentIndex, t) {
        if (!path.anchors || path.anchors.length < 2) return;

        const a1 = path.anchors[segmentIndex];
        const a2Index = (segmentIndex + 1) % path.anchors.length;
        const a2 = path.anchors[a2Index];

        // Calculate split point
        const splitX = a1.x + (a2.x - a1.x) * t;
        const splitY = a1.y + (a2.y - a1.y) * t;

        if (path.closed) {
            // Open the path at split point
            path.closed = false;

            // Reorder anchors so split is at start/end
            const newAnchor = new AnchorPoint({
                x: splitX,
                y: splitY,
                type: 'corner'
            });

            // Insert new anchor
            path.anchors.splice(segmentIndex + 1, 0, newAnchor);

            // Duplicate the split anchor at start
            const startAnchor = new AnchorPoint({
                x: splitX,
                y: splitY,
                type: 'corner'
            });

            // Rotate anchors so split point is at both ends
            const before = path.anchors.slice(0, segmentIndex + 2);
            const after = path.anchors.slice(segmentIndex + 2);

            path.anchors.length = 0;
            path.anchors.push(startAnchor, ...after, ...before.slice(0, -1));
        } else {
            // Split open path into two paths
            const newAnchor = new AnchorPoint({
                x: splitX,
                y: splitY,
                type: 'corner'
            });

            // Create second path
            const path2 = new Path({ closed: false });

            // Add split point and remaining anchors to new path
            path2.addAnchor(new AnchorPoint({
                x: splitX,
                y: splitY,
                type: 'corner'
            }));

            for (let i = segmentIndex + 1; i < path.anchors.length; i++) {
                const a = path.anchors[i];
                path2.addAnchor(new AnchorPoint({
                    x: a.x,
                    y: a.y,
                    type: a.type,
                    handleIn: a.handleIn ? { ...a.handleIn } : null,
                    handleOut: a.handleOut ? { ...a.handleOut } : null
                }));
            }

            // Truncate original path
            path.anchors.length = segmentIndex + 1;
            path.addAnchor(newAnchor);

            // Add second path
            this.addObject(path2);
        }

        path.invalidate();
    }

    render(ctx) {
        if (!ctx.setChar || !this._highlight) return;

        // Highlight split point
        const p = this._highlight.point;
        ctx.setChar(Math.floor(p.x), Math.floor(p.y), '✂');
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    PenTool,
    PencilTool,
    BrushTool,
    EraserTool,
    ScissorsTool
};
