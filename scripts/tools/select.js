/**
 * Asciistrator - Selection Tools
 * 
 * Tools for selecting and manipulating objects.
 */

import { Vector2D } from '../core/math/vector2d.js';
import { Tool, ToolCursors } from './base.js';

// ==========================================
// SELECT TOOL
// ==========================================

/**
 * SelectTool - Select and move objects
 */
export class SelectTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'select',
            name: 'Select',
            description: 'Select and move objects',
            shortcut: 'v',
            icon: '⬚',
            cursor: ToolCursors.DEFAULT,
            ...options
        });

        /** @type {string} Current mode */
        this.mode = 'select'; // 'select', 'move', 'resize', 'rotate'

        /** @type {object|null} Object being dragged */
        this._dragTarget = null;

        /** @type {object|null} Handle being dragged */
        this._dragHandle = null;

        /** @type {Array} Original transforms for undo */
        this._originalTransforms = [];

        /** @type {Vector2D} Transform origin for rotation/scale */
        this._transformOrigin = null;

        /** @type {number} Original rotation for undo */
        this._originalRotation = 0;

        /** @type {{x: number, y: number}} Original scale for undo */
        this._originalScale = { x: 1, y: 1 };
    }

    getCursor() {
        if (this.state.isDragging) {
            if (this.mode === 'move') {
                return ToolCursors.MOVE;
            }
            if (this.mode === 'rotate') {
                return ToolCursors.ROTATE;
            }
            if (this.mode === 'resize') {
                return this._getResizeCursor();
            }
        }

        // Check what's under cursor
        if (this.state.currentPoint && !this.state.isDown) {
            const hit = this.hitTest(this.state.currentPoint);
            if (hit) {
                if (hit.type === 'handle') {
                    if (hit.handle.type === 'rotation') {
                        return ToolCursors.ROTATE;
                    }
                    return this._getCursorForHandle(hit.handle);
                }
                if (hit.type === 'object') {
                    return ToolCursors.MOVE;
                }
            }
        }

        return ToolCursors.DEFAULT;
    }

    _getCursorForHandle(handle) {
        const position = handle.position;
        if (position === 'nw' || position === 'se') {
            return ToolCursors.RESIZE_NWSE;
        }
        if (position === 'ne' || position === 'sw') {
            return ToolCursors.RESIZE_NESW;
        }
        if (position === 'n' || position === 's') {
            return ToolCursors.RESIZE_NS;
        }
        if (position === 'e' || position === 'w') {
            return ToolCursors.RESIZE_EW;
        }
        return ToolCursors.DEFAULT;
    }

    _getResizeCursor() {
        if (!this._dragHandle) return ToolCursors.DEFAULT;
        return this._getCursorForHandle(this._dragHandle);
    }

    onClick(event) {
        const hit = this.hitTest(this.state.currentPoint);

        if (hit && hit.type === 'object') {
            const object = hit.object;

            if (this.state.shiftKey) {
                // Toggle selection
                if (this.selection) {
                    if (this.selection.isSelected(object)) {
                        this.selection.deselect(object);
                    } else {
                        this.selection.select(object, true); // Add to selection
                    }
                }
            } else {
                // Single select
                if (this.selection) {
                    this.selection.clear();
                    this.selection.select(object);
                }
            }
        } else {
            // Click on empty space - deselect all
            if (!this.state.shiftKey && this.selection) {
                this.selection.clear();
            }
        }

        this.requestRedraw();
    }

    onDoubleClick(event) {
        const hit = this.hitTest(this.state.currentPoint);

        if (hit && hit.type === 'object') {
            const object = hit.object;

            // Enter edit mode for groups or paths
            if (object.type === 'group') {
                this.emit('enterGroup', object);
            } else if (object.type === 'path') {
                // Switch to direct select tool for path editing
                this.manager.activateTool('direct-select');
            } else if (object.type === 'text') {
                // Enter text editing mode
                this.emit('editText', object);
            }
        }
    }

    onDragStart(event) {
        const hit = this.hitTest(this.state.startPoint);

        if (hit) {
            if (hit.type === 'handle') {
                this._dragHandle = hit.handle;
                this._dragTarget = hit.object;

                if (hit.handle.type === 'rotation') {
                    this.mode = 'rotate';
                    this._setupRotation();
                } else {
                    this.mode = 'resize';
                    this._setupResize();
                }
            } else if (hit.type === 'object') {
                this.mode = 'move';
                this._dragTarget = hit.object;

                // Select if not already selected
                if (this.selection && !this.selection.isSelected(hit.object)) {
                    if (!this.state.shiftKey) {
                        this.selection.clear();
                    }
                    this.selection.select(hit.object, this.state.shiftKey);
                }

                this._setupMove();
            }
        } else {
            // Start marquee selection
            this.mode = 'select';
            this._startMarquee();
        }

        this.beginAction(`${this.mode} objects`);
    }

    onDrag(event) {
        if (this.mode === 'move') {
            this._doMove();
        } else if (this.mode === 'resize') {
            this._doResize();
        } else if (this.mode === 'rotate') {
            this._doRotate();
        } else if (this.mode === 'select') {
            this._updateMarquee();
        }

        this.requestRedraw();
    }

    onDragEnd(event) {
        if (this.mode === 'select') {
            this._finishMarquee();
        }

        this._dragTarget = null;
        this._dragHandle = null;
        this._originalTransforms = [];
        this.mode = 'select';

        this.endAction();
        this.requestRedraw();
    }

    // ==========================================
    // MOVE
    // ==========================================

    _setupMove() {
        this._originalTransforms = [];

        if (this.selection) {
            for (const obj of this.selection.objects) {
                this._originalTransforms.push({
                    object: obj,
                    x: obj.x,
                    y: obj.y
                });
            }
        }
    }

    _doMove() {
        const delta = this.state.getDelta();
        let adjustedDelta = delta;

        // Apply snapping
        if (this.manager.snapToGrid) {
            const snappedStart = this.snapToGrid(this.state.startPoint);
            const snappedCurrent = this.snapToGrid(this.state.currentPoint);
            adjustedDelta = snappedCurrent.subtract(snappedStart);
        }

        // Constrain to axis if shift held
        if (this.state.shiftKey) {
            if (Math.abs(adjustedDelta.x) > Math.abs(adjustedDelta.y)) {
                adjustedDelta = new Vector2D(adjustedDelta.x, 0);
            } else {
                adjustedDelta = new Vector2D(0, adjustedDelta.y);
            }
        }

        // Apply to all selected objects
        for (const transform of this._originalTransforms) {
            transform.object.x = transform.x + adjustedDelta.x;
            transform.object.y = transform.y + adjustedDelta.y;
        }
    }

    // ==========================================
    // RESIZE
    // ==========================================

    _setupResize() {
        this._originalTransforms = [];

        if (this.selection) {
            const bounds = this.selection.getBounds();
            this._transformOrigin = this._getOppositeCorner(bounds, this._dragHandle.position);

            for (const obj of this.selection.objects) {
                this._originalTransforms.push({
                    object: obj,
                    x: obj.x,
                    y: obj.y,
                    scaleX: obj.scaleX,
                    scaleY: obj.scaleY,
                    width: obj.width,
                    height: obj.height
                });
            }
        }
    }

    _getOppositeCorner(bounds, position) {
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;

        switch (position) {
            case 'nw': return new Vector2D(bounds.maxX, bounds.maxY);
            case 'ne': return new Vector2D(bounds.minX, bounds.maxY);
            case 'sw': return new Vector2D(bounds.maxX, bounds.minY);
            case 'se': return new Vector2D(bounds.minX, bounds.minY);
            case 'n': return new Vector2D(cx, bounds.maxY);
            case 's': return new Vector2D(cx, bounds.minY);
            case 'e': return new Vector2D(bounds.minX, cy);
            case 'w': return new Vector2D(bounds.maxX, cy);
            default: return new Vector2D(cx, cy);
        }
    }

    _doResize() {
        if (!this._transformOrigin || !this._dragHandle) return;

        const position = this._dragHandle.position;
        let current = this.state.currentPoint;

        // Constrain aspect ratio if shift held
        if (this.state.shiftKey) {
            current = this.constrainAspectRatio(this._transformOrigin, current);
        }

        // Calculate scale factors
        const originalDist = this.state.startPoint.subtract(this._transformOrigin);
        const currentDist = current.subtract(this._transformOrigin);

        let scaleX = 1;
        let scaleY = 1;

        if (position === 'n' || position === 's') {
            scaleY = originalDist.y !== 0 ? currentDist.y / originalDist.y : 1;
        } else if (position === 'e' || position === 'w') {
            scaleX = originalDist.x !== 0 ? currentDist.x / originalDist.x : 1;
        } else {
            scaleX = originalDist.x !== 0 ? currentDist.x / originalDist.x : 1;
            scaleY = originalDist.y !== 0 ? currentDist.y / originalDist.y : 1;
        }

        // Alt key: scale from center
        if (this.state.altKey) {
            scaleX = 1 + (scaleX - 1) * 2;
            scaleY = 1 + (scaleY - 1) * 2;
        }

        // Apply to objects
        for (const transform of this._originalTransforms) {
            const obj = transform.object;

            // Scale position relative to origin
            const dx = transform.x - this._transformOrigin.x;
            const dy = transform.y - this._transformOrigin.y;

            obj.x = this._transformOrigin.x + dx * scaleX;
            obj.y = this._transformOrigin.y + dy * scaleY;

            // Scale object size or scale
            if (obj.width !== undefined && obj.height !== undefined) {
                obj.width = Math.abs(transform.width * scaleX);
                obj.height = Math.abs(transform.height * scaleY);
            } else {
                obj.scaleX = transform.scaleX * Math.abs(scaleX);
                obj.scaleY = transform.scaleY * Math.abs(scaleY);
            }
        }
    }

    // ==========================================
    // ROTATE
    // ==========================================

    _setupRotation() {
        this._originalTransforms = [];

        if (this.selection) {
            const bounds = this.selection.getBounds();
            this._transformOrigin = new Vector2D(
                (bounds.minX + bounds.maxX) / 2,
                (bounds.minY + bounds.maxY) / 2
            );

            for (const obj of this.selection.objects) {
                this._originalTransforms.push({
                    object: obj,
                    x: obj.x,
                    y: obj.y,
                    rotation: obj.rotation
                });
            }
        }

        // Calculate initial angle
        const startAngle = Math.atan2(
            this.state.startPoint.y - this._transformOrigin.y,
            this.state.startPoint.x - this._transformOrigin.x
        );
        this._originalRotation = startAngle;
    }

    _doRotate() {
        if (!this._transformOrigin) return;

        // Calculate rotation angle
        let currentAngle = Math.atan2(
            this.state.currentPoint.y - this._transformOrigin.y,
            this.state.currentPoint.x - this._transformOrigin.x
        );

        let deltaAngle = currentAngle - this._originalRotation;

        // Constrain to 15-degree increments if shift held
        if (this.state.shiftKey) {
            const increment = Math.PI / 12; // 15 degrees
            deltaAngle = Math.round(deltaAngle / increment) * increment;
        }

        // Apply to objects
        for (const transform of this._originalTransforms) {
            const obj = transform.object;

            // Rotate object
            obj.rotation = transform.rotation + deltaAngle;

            // Rotate position around origin
            const dx = transform.x - this._transformOrigin.x;
            const dy = transform.y - this._transformOrigin.y;

            const cos = Math.cos(deltaAngle);
            const sin = Math.sin(deltaAngle);

            obj.x = this._transformOrigin.x + dx * cos - dy * sin;
            obj.y = this._transformOrigin.y + dx * sin + dy * cos;
        }
    }

    // ==========================================
    // MARQUEE SELECTION
    // ==========================================

    _startMarquee() {
        this.state.data = {
            marquee: {
                x: this.state.startPoint.x,
                y: this.state.startPoint.y,
                width: 0,
                height: 0
            }
        };
    }

    _updateMarquee() {
        const delta = this.state.getDelta();
        const marquee = this.state.data.marquee;

        marquee.x = Math.min(this.state.startPoint.x, this.state.currentPoint.x);
        marquee.y = Math.min(this.state.startPoint.y, this.state.currentPoint.y);
        marquee.width = Math.abs(delta.x);
        marquee.height = Math.abs(delta.y);

        // Get objects in marquee
        const objects = this.getObjectsInRect(marquee, {
            intersect: !this.state.altKey // Alt key for fully contained
        });

        // Preview selection
        if (this.selection) {
            this.selection.previewObjects = objects;
        }
    }

    _finishMarquee() {
        const marquee = this.state.data?.marquee;
        if (!marquee) return;

        const objects = this.getObjectsInRect(marquee, {
            intersect: !this.state.altKey
        });

        if (this.selection) {
            if (!this.state.shiftKey) {
                this.selection.clear();
            }

            for (const obj of objects) {
                this.selection.select(obj, true);
            }

            this.selection.previewObjects = null;
        }

        this.state.data = null;
    }

    render(ctx) {
        // Render marquee selection
        if (this.mode === 'select' && this.state.data?.marquee) {
            const marquee = this.state.data.marquee;

            // ASCII marquee rendering
            if (ctx.setChar) {
                this._renderAsciiMarquee(ctx, marquee);
            }
        }
    }

    _renderAsciiMarquee(ctx, marquee) {
        const chars = {
            tl: '┌', tr: '┐', bl: '└', br: '┘',
            h: '┄', v: '┆'
        };

        const x1 = Math.floor(marquee.x);
        const y1 = Math.floor(marquee.y);
        const x2 = Math.floor(marquee.x + marquee.width);
        const y2 = Math.floor(marquee.y + marquee.height);

        // Corners
        ctx.setChar(x1, y1, chars.tl);
        ctx.setChar(x2, y1, chars.tr);
        ctx.setChar(x1, y2, chars.bl);
        ctx.setChar(x2, y2, chars.br);

        // Horizontal edges
        for (let x = x1 + 1; x < x2; x++) {
            ctx.setChar(x, y1, chars.h);
            ctx.setChar(x, y2, chars.h);
        }

        // Vertical edges
        for (let y = y1 + 1; y < y2; y++) {
            ctx.setChar(x1, y, chars.v);
            ctx.setChar(x2, y, chars.v);
        }
    }
}

// ==========================================
// DIRECT SELECT TOOL
// ==========================================

/**
 * DirectSelectTool - Select and edit individual anchor points
 */
export class DirectSelectTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'direct-select',
            name: 'Direct Select',
            description: 'Select and edit individual anchor points',
            shortcut: 'a',
            icon: '⊹',
            cursor: ToolCursors.DEFAULT,
            ...options
        });

        /** @type {object|null} Currently selected anchor */
        this._selectedAnchor = null;

        /** @type {object|null} Currently selected handle */
        this._selectedHandle = null;

        /** @type {Array} Original anchor positions for undo */
        this._originalPositions = [];

        /** @type {string} Current mode */
        this.mode = 'select'; // 'select', 'moveAnchor', 'moveHandle'
    }

    getCursor() {
        if (this.state.isDragging) {
            return ToolCursors.MOVE;
        }

        // Check what's under cursor
        if (this.state.currentPoint && !this.state.isDown) {
            const hit = this._hitTestAnchors(this.state.currentPoint);
            if (hit) {
                return ToolCursors.MOVE;
            }
        }

        return ToolCursors.DEFAULT;
    }

    activate() {
        super.activate();

        // Show anchor handles for selected paths
        if (this.selection) {
            this.selection.showPathHandles = true;
        }
    }

    deactivate() {
        super.deactivate();

        // Hide anchor handles
        if (this.selection) {
            this.selection.showPathHandles = false;
        }
    }

    _hitTestAnchors(point, tolerance = 8) {
        if (!this.selection) return null;

        for (const obj of this.selection.objects) {
            if (obj.type === 'path' && obj.anchors) {
                for (let i = 0; i < obj.anchors.length; i++) {
                    const anchor = obj.anchors[i];
                    const anchorPoint = obj.localToWorld(new Vector2D(anchor.x, anchor.y));

                    if (point.distanceTo(anchorPoint) < tolerance) {
                        return { type: 'anchor', anchor, index: i, object: obj };
                    }

                    // Check control handles
                    if (anchor.handleIn) {
                        const handleIn = obj.localToWorld(new Vector2D(
                            anchor.x + anchor.handleIn.x,
                            anchor.y + anchor.handleIn.y
                        ));
                        if (point.distanceTo(handleIn) < tolerance) {
                            return { type: 'handleIn', anchor, index: i, object: obj };
                        }
                    }

                    if (anchor.handleOut) {
                        const handleOut = obj.localToWorld(new Vector2D(
                            anchor.x + anchor.handleOut.x,
                            anchor.y + anchor.handleOut.y
                        ));
                        if (point.distanceTo(handleOut) < tolerance) {
                            return { type: 'handleOut', anchor, index: i, object: obj };
                        }
                    }
                }
            }
        }

        return null;
    }

    onClick(event) {
        const hit = this._hitTestAnchors(this.state.currentPoint);

        if (hit) {
            this._selectedAnchor = hit;

            if (this.state.shiftKey && hit.type === 'anchor') {
                // Toggle anchor selection
                hit.anchor.selected = !hit.anchor.selected;
            } else if (hit.type === 'anchor') {
                // Single anchor selection
                this._deselectAllAnchors(hit.object);
                hit.anchor.selected = true;
            }
        } else {
            // Check for object selection
            const objHit = this.hitTest(this.state.currentPoint);

            if (objHit && objHit.type === 'object') {
                if (objHit.object.type === 'path') {
                    if (!this.state.shiftKey && this.selection) {
                        this.selection.clear();
                    }
                    if (this.selection) {
                        this.selection.select(objHit.object, this.state.shiftKey);
                    }
                }
            } else if (!this.state.shiftKey) {
                // Deselect all
                if (this.selection) {
                    for (const obj of this.selection.objects) {
                        this._deselectAllAnchors(obj);
                    }
                    this.selection.clear();
                }
            }
        }

        this.requestRedraw();
    }

    onDoubleClick(event) {
        const hit = this._hitTestAnchors(this.state.currentPoint);

        if (hit && hit.type === 'anchor') {
            // Toggle anchor type (corner <-> smooth)
            const anchor = hit.anchor;
            if (anchor.type === 'corner') {
                anchor.type = 'smooth';
                // Convert to smooth by creating symmetric handles
                this._convertToSmooth(anchor, hit.object, hit.index);
            } else {
                anchor.type = 'corner';
                // Convert to corner by removing handles
                anchor.handleIn = null;
                anchor.handleOut = null;
            }

            hit.object.invalidate();
            this.commitAction('Convert anchor point');
        }

        this.requestRedraw();
    }

    _convertToSmooth(anchor, path, index) {
        // Calculate handle direction from neighboring points
        const prev = path.anchors[(index - 1 + path.anchors.length) % path.anchors.length];
        const next = path.anchors[(index + 1) % path.anchors.length];

        const dir = new Vector2D(next.x - prev.x, next.y - prev.y).normalize();
        const dist = 20; // Handle length

        anchor.handleIn = { x: -dir.x * dist, y: -dir.y * dist };
        anchor.handleOut = { x: dir.x * dist, y: dir.y * dist };
    }

    _deselectAllAnchors(object) {
        if (object.anchors) {
            for (const anchor of object.anchors) {
                anchor.selected = false;
            }
        }
    }

    onDragStart(event) {
        const hit = this._hitTestAnchors(this.state.startPoint);

        if (hit) {
            this._selectedAnchor = hit;

            if (hit.type === 'anchor') {
                this.mode = 'moveAnchor';
                this._setupAnchorMove(hit);
            } else {
                this.mode = 'moveHandle';
                this._selectedHandle = hit;
            }

            this.beginAction('Edit path');
        } else {
            // Start marquee selection for anchors
            this.mode = 'select';
            this._startMarquee();
        }
    }

    onDrag(event) {
        if (this.mode === 'moveAnchor') {
            this._doMoveAnchor();
        } else if (this.mode === 'moveHandle') {
            this._doMoveHandle();
        } else if (this.mode === 'select') {
            this._updateMarquee();
        }

        this.requestRedraw();
    }

    onDragEnd(event) {
        if (this.mode === 'select') {
            this._finishMarquee();
        }

        if (this.mode === 'moveAnchor' || this.mode === 'moveHandle') {
            this.endAction();
        }

        this._selectedAnchor = null;
        this._selectedHandle = null;
        this._originalPositions = [];
        this.mode = 'select';

        this.requestRedraw();
    }

    _setupAnchorMove(hit) {
        this._originalPositions = [];

        const object = hit.object;
        if (object.anchors) {
            for (let i = 0; i < object.anchors.length; i++) {
                const anchor = object.anchors[i];
                if (anchor.selected || i === hit.index) {
                    this._originalPositions.push({
                        index: i,
                        x: anchor.x,
                        y: anchor.y,
                        object
                    });
                }
            }
        }
    }

    _doMoveAnchor() {
        let delta = this.state.getDelta();

        // Constrain to axis if shift held
        if (this.state.shiftKey) {
            if (Math.abs(delta.x) > Math.abs(delta.y)) {
                delta = new Vector2D(delta.x, 0);
            } else {
                delta = new Vector2D(0, delta.y);
            }
        }

        // Transform delta to local coordinates
        for (const pos of this._originalPositions) {
            const anchor = pos.object.anchors[pos.index];
            const localDelta = pos.object.worldToLocalDelta(delta);

            anchor.x = pos.x + localDelta.x;
            anchor.y = pos.y + localDelta.y;
        }

        // Invalidate objects
        const objects = new Set(this._originalPositions.map(p => p.object));
        for (const obj of objects) {
            obj.invalidate();
        }
    }

    _doMoveHandle() {
        if (!this._selectedHandle) return;

        const { anchor, object, type } = this._selectedHandle;

        // Calculate handle position in local coordinates
        const localPoint = object.worldToLocal(this.state.currentPoint);
        const handleX = localPoint.x - anchor.x;
        const handleY = localPoint.y - anchor.y;

        if (type === 'handleIn') {
            anchor.handleIn = { x: handleX, y: handleY };

            // Mirror handle if smooth
            if (anchor.type === 'smooth' && anchor.handleOut) {
                const length = Math.sqrt(anchor.handleOut.x ** 2 + anchor.handleOut.y ** 2);
                const newLength = Math.sqrt(handleX ** 2 + handleY ** 2);
                const scale = newLength > 0 ? length / newLength : 1;

                anchor.handleOut = { x: -handleX * scale, y: -handleY * scale };
            }
        } else if (type === 'handleOut') {
            anchor.handleOut = { x: handleX, y: handleY };

            // Mirror handle if smooth
            if (anchor.type === 'smooth' && anchor.handleIn) {
                const length = Math.sqrt(anchor.handleIn.x ** 2 + anchor.handleIn.y ** 2);
                const newLength = Math.sqrt(handleX ** 2 + handleY ** 2);
                const scale = newLength > 0 ? length / newLength : 1;

                anchor.handleIn = { x: -handleX * scale, y: -handleY * scale };
            }
        }

        object.invalidate();
    }

    _startMarquee() {
        this.state.data = {
            marquee: {
                x: this.state.startPoint.x,
                y: this.state.startPoint.y,
                width: 0,
                height: 0
            }
        };
    }

    _updateMarquee() {
        const delta = this.state.getDelta();
        const marquee = this.state.data.marquee;

        marquee.x = Math.min(this.state.startPoint.x, this.state.currentPoint.x);
        marquee.y = Math.min(this.state.startPoint.y, this.state.currentPoint.y);
        marquee.width = Math.abs(delta.x);
        marquee.height = Math.abs(delta.y);
    }

    _finishMarquee() {
        const marquee = this.state.data?.marquee;
        if (!marquee || !this.selection) return;

        // Select anchors within marquee
        for (const obj of this.selection.objects) {
            if (obj.type === 'path' && obj.anchors) {
                for (const anchor of obj.anchors) {
                    const worldPos = obj.localToWorld(new Vector2D(anchor.x, anchor.y));

                    if (
                        worldPos.x >= marquee.x &&
                        worldPos.x <= marquee.x + marquee.width &&
                        worldPos.y >= marquee.y &&
                        worldPos.y <= marquee.y + marquee.height
                    ) {
                        anchor.selected = true;
                    } else if (!this.state.shiftKey) {
                        anchor.selected = false;
                    }
                }
            }
        }

        this.state.data = null;
    }

    render(ctx) {
        // Render anchor marquee selection
        if (this.mode === 'select' && this.state.data?.marquee) {
            const marquee = this.state.data.marquee;

            if (ctx.setChar) {
                this._renderAsciiMarquee(ctx, marquee);
            }
        }
    }

    _renderAsciiMarquee(ctx, marquee) {
        const chars = { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '┄', v: '┆' };

        const x1 = Math.floor(marquee.x);
        const y1 = Math.floor(marquee.y);
        const x2 = Math.floor(marquee.x + marquee.width);
        const y2 = Math.floor(marquee.y + marquee.height);

        ctx.setChar(x1, y1, chars.tl);
        ctx.setChar(x2, y1, chars.tr);
        ctx.setChar(x1, y2, chars.bl);
        ctx.setChar(x2, y2, chars.br);

        for (let x = x1 + 1; x < x2; x++) {
            ctx.setChar(x, y1, chars.h);
            ctx.setChar(x, y2, chars.h);
        }

        for (let y = y1 + 1; y < y2; y++) {
            ctx.setChar(x1, y, chars.v);
            ctx.setChar(x2, y, chars.v);
        }
    }
}

// ==========================================
// LASSO TOOL
// ==========================================

/**
 * LassoTool - Free-form selection tool
 */
export class LassoTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'lasso',
            name: 'Lasso',
            description: 'Free-form selection',
            shortcut: 'q',
            icon: '◌',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });

        /** @type {Array<Vector2D>} Lasso path points */
        this._points = [];
    }

    onDragStart(event) {
        this._points = [this.state.startPoint.clone()];
    }

    onDrag(event) {
        // Add points, but not too close together
        const lastPoint = this._points[this._points.length - 1];
        if (this.state.currentPoint.distanceTo(lastPoint) > 3) {
            this._points.push(this.state.currentPoint.clone());
        }

        this.requestRedraw();
    }

    onDragEnd(event) {
        // Close the lasso
        if (this._points.length > 2) {
            this._points.push(this._points[0].clone());

            // Find objects inside lasso
            const objects = this._getObjectsInLasso();

            if (this.selection) {
                if (!this.state.shiftKey) {
                    this.selection.clear();
                }

                for (const obj of objects) {
                    this.selection.select(obj, true);
                }
            }
        }

        this._points = [];
        this.requestRedraw();
    }

    _getObjectsInLasso() {
        if (!this.document) return [];

        const results = [];
        const layers = this.document.layers || [];

        for (const layer of layers) {
            if (!layer.visible || layer.locked) continue;
            this._checkLayerObjects(layer, results);
        }

        return results;
    }

    _checkLayerObjects(layer, results) {
        const children = layer.children || [];

        for (const child of children) {
            if (!child.visible || child.locked) continue;

            // Check if object center is inside lasso
            const bounds = child.getBounds ? child.getBounds() : null;
            if (bounds) {
                const center = new Vector2D(
                    (bounds.minX + bounds.maxX) / 2,
                    (bounds.minY + bounds.maxY) / 2
                );

                if (this._pointInPolygon(center, this._points)) {
                    results.push(child);
                }
            }

            if (child.children) {
                this._checkLayerObjects(child, results);
            }
        }
    }

    _pointInPolygon(point, polygon) {
        let inside = false;
        const n = polygon.length;

        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            if (((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }

    render(ctx) {
        if (this._points.length < 2) return;

        if (ctx.setChar) {
            // Render lasso path as ASCII
            for (let i = 0; i < this._points.length - 1; i++) {
                const p1 = this._points[i];
                const p2 = this._points[i + 1];
                this._renderLine(ctx, p1, p2, '·');
            }
        }
    }

    _renderLine(ctx, p1, p2, char) {
        // Bresenham line for lasso preview
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
}

// ==========================================
// MARQUEE TOOL
// ==========================================

/**
 * MarqueeTool - Rectangular/elliptical selection
 */
export class MarqueeTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'marquee',
            name: 'Marquee',
            description: 'Rectangular/elliptical selection',
            shortcut: 'm',
            icon: '▢',
            cursor: ToolCursors.CROSSHAIR,
            ...options
        });

        /** @type {string} Selection shape */
        this.shape = options.shape || 'rectangle'; // 'rectangle' or 'ellipse'

        /** @type {object} Current marquee bounds */
        this._marquee = null;
    }

    /**
     * Toggle between rectangle and ellipse mode
     */
    toggleShape() {
        this.shape = this.shape === 'rectangle' ? 'ellipse' : 'rectangle';
        this.emit('shapeChanged', this.shape);
    }

    onDragStart(event) {
        this._marquee = {
            x: this.state.startPoint.x,
            y: this.state.startPoint.y,
            width: 0,
            height: 0
        };
    }

    onDrag(event) {
        let current = this.state.currentPoint;

        // Square/circle constraint with shift
        if (this.state.shiftKey) {
            current = this.constrainAspectRatio(this.state.startPoint, current, 1);
        }

        // From center with alt
        if (this.state.altKey) {
            const dx = current.x - this.state.startPoint.x;
            const dy = current.y - this.state.startPoint.y;

            this._marquee.x = this.state.startPoint.x - dx;
            this._marquee.y = this.state.startPoint.y - dy;
            this._marquee.width = Math.abs(dx) * 2;
            this._marquee.height = Math.abs(dy) * 2;
        } else {
            this._marquee.x = Math.min(this.state.startPoint.x, current.x);
            this._marquee.y = Math.min(this.state.startPoint.y, current.y);
            this._marquee.width = Math.abs(current.x - this.state.startPoint.x);
            this._marquee.height = Math.abs(current.y - this.state.startPoint.y);
        }

        this.requestRedraw();
    }

    onDragEnd(event) {
        if (!this._marquee) return;

        const objects = this._getObjectsInMarquee();

        if (this.selection) {
            if (!this.state.shiftKey) {
                this.selection.clear();
            }

            for (const obj of objects) {
                this.selection.select(obj, true);
            }
        }

        this._marquee = null;
        this.requestRedraw();
    }

    _getObjectsInMarquee() {
        if (!this._marquee || !this.document) return [];

        const results = [];
        const layers = this.document.layers || [];

        for (const layer of layers) {
            if (!layer.visible || layer.locked) continue;
            this._checkLayerObjects(layer, results);
        }

        return results;
    }

    _checkLayerObjects(layer, results) {
        const children = layer.children || [];

        for (const child of children) {
            if (!child.visible || child.locked) continue;

            const bounds = child.getBounds ? child.getBounds() : null;
            if (bounds) {
                const center = new Vector2D(
                    (bounds.minX + bounds.maxX) / 2,
                    (bounds.minY + bounds.maxY) / 2
                );

                let inside = false;
                if (this.shape === 'rectangle') {
                    inside = this._pointInRect(center);
                } else {
                    inside = this._pointInEllipse(center);
                }

                if (inside) {
                    results.push(child);
                }
            }

            if (child.children) {
                this._checkLayerObjects(child, results);
            }
        }
    }

    _pointInRect(point) {
        const m = this._marquee;
        return (
            point.x >= m.x &&
            point.x <= m.x + m.width &&
            point.y >= m.y &&
            point.y <= m.y + m.height
        );
    }

    _pointInEllipse(point) {
        const m = this._marquee;
        const cx = m.x + m.width / 2;
        const cy = m.y + m.height / 2;
        const rx = m.width / 2;
        const ry = m.height / 2;

        if (rx === 0 || ry === 0) return false;

        const dx = (point.x - cx) / rx;
        const dy = (point.y - cy) / ry;

        return dx * dx + dy * dy <= 1;
    }

    render(ctx) {
        if (!this._marquee) return;

        if (ctx.setChar) {
            if (this.shape === 'rectangle') {
                this._renderAsciiRect(ctx, this._marquee);
            } else {
                this._renderAsciiEllipse(ctx, this._marquee);
            }
        }
    }

    _renderAsciiRect(ctx, rect) {
        const chars = { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '┄', v: '┆' };

        const x1 = Math.floor(rect.x);
        const y1 = Math.floor(rect.y);
        const x2 = Math.floor(rect.x + rect.width);
        const y2 = Math.floor(rect.y + rect.height);

        ctx.setChar(x1, y1, chars.tl);
        ctx.setChar(x2, y1, chars.tr);
        ctx.setChar(x1, y2, chars.bl);
        ctx.setChar(x2, y2, chars.br);

        for (let x = x1 + 1; x < x2; x++) {
            ctx.setChar(x, y1, chars.h);
            ctx.setChar(x, y2, chars.h);
        }

        for (let y = y1 + 1; y < y2; y++) {
            ctx.setChar(x1, y, chars.v);
            ctx.setChar(x2, y, chars.v);
        }
    }

    _renderAsciiEllipse(ctx, rect) {
        const cx = Math.floor(rect.x + rect.width / 2);
        const cy = Math.floor(rect.y + rect.height / 2);
        const rx = Math.floor(rect.width / 2);
        const ry = Math.floor(rect.height / 2);

        // Midpoint ellipse algorithm for dashed preview
        const points = [];

        let x = 0;
        let y = ry;

        // Region 1
        let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
        let dx = 2 * ry * ry * x;
        let dy = 2 * rx * rx * y;

        while (dx < dy) {
            points.push({ x: cx + x, y: cy - y });
            points.push({ x: cx - x, y: cy - y });
            points.push({ x: cx + x, y: cy + y });
            points.push({ x: cx - x, y: cy + y });

            if (d1 < 0) {
                x++;
                dx += 2 * ry * ry;
                d1 += dx + ry * ry;
            } else {
                x++;
                y--;
                dx += 2 * ry * ry;
                dy -= 2 * rx * rx;
                d1 += dx - dy + ry * ry;
            }
        }

        // Region 2
        let d2 = ry * ry * (x + 0.5) * (x + 0.5) + rx * rx * (y - 1) * (y - 1) - rx * rx * ry * ry;

        while (y >= 0) {
            points.push({ x: cx + x, y: cy - y });
            points.push({ x: cx - x, y: cy - y });
            points.push({ x: cx + x, y: cy + y });
            points.push({ x: cx - x, y: cy + y });

            if (d2 > 0) {
                y--;
                dy -= 2 * rx * rx;
                d2 += rx * rx - dy;
            } else {
                y--;
                x++;
                dx += 2 * ry * ry;
                dy -= 2 * rx * rx;
                d2 += dx - dy + rx * rx;
            }
        }

        // Render dashed
        for (let i = 0; i < points.length; i++) {
            if (i % 2 === 0) {
                ctx.setChar(points[i].x, points[i].y, '·');
            }
        }
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    SelectTool,
    DirectSelectTool,
    LassoTool,
    MarqueeTool
};
