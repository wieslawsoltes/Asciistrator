/**
 * Asciistrator - Rendering Module Unit Tests
 * 
 * Tests for Viewport, Grid, Rasterizer, CharSets, and Renderer.
 */

import { describe, it, beforeEach, assert } from '../framework.js';
import { Vector2D, Matrix3x3 } from '../../scripts/core/math.js';
import { Viewport } from '../../scripts/canvas/Viewport.js';
import { Grid } from '../../scripts/canvas/Grid.js';
import { Rasterizer } from '../../scripts/ascii/Rasterizer.js';
import { CharSets, CharacterSet } from '../../scripts/ascii/CharSets.js';
import { Renderer } from '../../scripts/rendering/Renderer.js';
import { Document } from '../../scripts/core/Document.js';
import { Layer } from '../../scripts/core/Layer.js';

// ==========================================
// VIEWPORT TESTS
// ==========================================

describe('Viewport', () => {
    let viewport;

    beforeEach(() => {
        viewport = new Viewport({
            width: 800,
            height: 600
        });
    });

    describe('Constructor', () => {
        it('should create viewport with dimensions', () => {
            assert.equal(viewport.width, 800);
            assert.equal(viewport.height, 600);
        });

        it('should default zoom to 1', () => {
            assert.equal(viewport.zoom, 1);
        });

        it('should start centered at origin', () => {
            assert.equal(viewport.panX, 0);
            assert.equal(viewport.panY, 0);
        });
    });

    describe('Panning', () => {
        it('should pan by delta', () => {
            viewport.pan(100, 50);
            assert.equal(viewport.panX, 100);
            assert.equal(viewport.panY, 50);
        });

        it('should accumulate pan values', () => {
            viewport.pan(100, 50);
            viewport.pan(50, 25);
            assert.equal(viewport.panX, 150);
            assert.equal(viewport.panY, 75);
        });

        it('should set absolute pan position', () => {
            viewport.setPan(200, 300);
            assert.equal(viewport.panX, 200);
            assert.equal(viewport.panY, 300);
        });
    });

    describe('Zooming', () => {
        it('should set zoom level', () => {
            viewport.setZoom(2);
            assert.equal(viewport.zoom, 2);
        });

        it('should clamp zoom to min', () => {
            viewport.setZoom(0.01);
            assert.greaterThan(viewport.zoom, 0);
        });

        it('should clamp zoom to max', () => {
            viewport.setZoom(100);
            assert.lessThan(viewport.zoom, 100);
        });

        it('should zoom relative', () => {
            viewport.setZoom(1);
            viewport.zoomBy(0.5);
            assert.equal(viewport.zoom, 1.5);
        });

        it('should zoom at point', () => {
            viewport.zoomAt(2, 400, 300);
            assert.equal(viewport.zoom, 2);
            // Pan should adjust to keep point stable
        });
    });

    describe('Coordinate Transformation', () => {
        it('should convert screen to world coordinates', () => {
            viewport.setZoom(1);
            viewport.setPan(0, 0);
            
            const world = viewport.screenToWorld(400, 300);
            assert.approximately(world.x, 400, 1);
            assert.approximately(world.y, 300, 1);
        });

        it('should convert world to screen coordinates', () => {
            viewport.setZoom(1);
            viewport.setPan(0, 0);
            
            const screen = viewport.worldToScreen(400, 300);
            assert.approximately(screen.x, 400, 1);
            assert.approximately(screen.y, 300, 1);
        });

        it('should account for zoom in transformation', () => {
            viewport.setZoom(2);
            viewport.setPan(0, 0);
            
            const world = viewport.screenToWorld(200, 150);
            assert.approximately(world.x, 100, 1);
            assert.approximately(world.y, 75, 1);
        });

        it('should account for pan in transformation', () => {
            viewport.setZoom(1);
            viewport.setPan(-100, -50);
            
            const world = viewport.screenToWorld(400, 300);
            assert.approximately(world.x, 500, 1);
            assert.approximately(world.y, 350, 1);
        });

        it('should be reversible', () => {
            viewport.setZoom(2);
            viewport.setPan(100, 50);
            
            const original = new Vector2D(150, 200);
            const screen = viewport.worldToScreen(original.x, original.y);
            const back = viewport.screenToWorld(screen.x, screen.y);
            
            assert.approximately(back.x, original.x, 0.01);
            assert.approximately(back.y, original.y, 0.01);
        });
    });

    describe('View Bounds', () => {
        it('should calculate visible bounds', () => {
            viewport.setZoom(1);
            viewport.setPan(0, 0);
            
            const bounds = viewport.getVisibleBounds();
            
            assert.isDefined(bounds.x);
            assert.isDefined(bounds.y);
            assert.isDefined(bounds.width);
            assert.isDefined(bounds.height);
        });

        it('should check if point is visible', () => {
            viewport.setZoom(1);
            viewport.setPan(0, 0);
            
            assert.ok(viewport.isPointVisible(400, 300));
            assert.ok(!viewport.isPointVisible(-1000, -1000));
        });

        it('should check if rect is visible', () => {
            viewport.setZoom(1);
            viewport.setPan(0, 0);
            
            assert.ok(viewport.isRectVisible(0, 0, 100, 100));
            assert.ok(!viewport.isRectVisible(-1000, -1000, 50, 50));
        });
    });

    describe('Fit To Bounds', () => {
        it('should fit view to bounds', () => {
            viewport.fitToBounds({
                x: 0, y: 0,
                width: 400, height: 300
            }, 20);
            
            // Zoom should be adjusted to fit
            assert.ok(viewport.zoom > 0);
        });
    });

    describe('Transform Matrix', () => {
        it('should get view transform matrix', () => {
            const matrix = viewport.getTransform();
            assert.instanceOf(matrix, Matrix3x3);
        });

        it('should get inverse transform matrix', () => {
            const matrix = viewport.getInverseTransform();
            assert.instanceOf(matrix, Matrix3x3);
        });
    });
});

// ==========================================
// GRID TESTS
// ==========================================

describe('Grid', () => {
    let grid;

    beforeEach(() => {
        grid = new Grid({
            cellWidth: 10,
            cellHeight: 20,
            visible: true
        });
    });

    describe('Constructor', () => {
        it('should create grid with cell size', () => {
            assert.equal(grid.cellWidth, 10);
            assert.equal(grid.cellHeight, 20);
        });

        it('should default to visible', () => {
            const g = new Grid();
            assert.ok(g.visible);
        });
    });

    describe('Snapping', () => {
        it('should snap point to grid', () => {
            const snapped = grid.snapPoint(new Vector2D(15, 25));
            assert.equal(snapped.x, 20); // Nearest multiple of 10
            assert.equal(snapped.y, 20); // Nearest multiple of 20
        });

        it('should handle negative coordinates', () => {
            const snapped = grid.snapPoint(new Vector2D(-15, -25));
            assert.equal(snapped.x, -20);
            assert.equal(snapped.y, -20);
        });

        it('should respect snap enabled flag', () => {
            grid.snapEnabled = false;
            const point = new Vector2D(15, 25);
            const snapped = grid.snapPoint(point);
            
            assert.equal(snapped.x, 15);
            assert.equal(snapped.y, 25);
        });
    });

    describe('Cell Coordinates', () => {
        it('should get cell from point', () => {
            const cell = grid.getCellAt(new Vector2D(25, 45));
            assert.equal(cell.col, 2);
            assert.equal(cell.row, 2);
        });

        it('should get point from cell', () => {
            const point = grid.getCellPosition(3, 2);
            assert.equal(point.x, 30);
            assert.equal(point.y, 40);
        });
    });

    describe('Grid Lines', () => {
        it('should generate grid lines for bounds', () => {
            const lines = grid.getGridLines({
                x: 0, y: 0,
                width: 100, height: 100
            });
            
            assert.isDefined(lines.vertical);
            assert.isDefined(lines.horizontal);
            assert.greaterThan(lines.vertical.length, 0);
            assert.greaterThan(lines.horizontal.length, 0);
        });
    });

    describe('Subdivision', () => {
        it('should support grid subdivision', () => {
            grid.subdivisions = 4;
            assert.equal(grid.getSubCellWidth(), 2.5);
            assert.equal(grid.getSubCellHeight(), 5);
        });
    });
});

// ==========================================
// RASTERIZER TESTS
// ==========================================

describe('Rasterizer', () => {
    let rasterizer;

    beforeEach(() => {
        rasterizer = new Rasterizer({
            charWidth: 8,
            charHeight: 16
        });
    });

    describe('Constructor', () => {
        it('should create rasterizer with character dimensions', () => {
            assert.equal(rasterizer.charWidth, 8);
            assert.equal(rasterizer.charHeight, 16);
        });
    });

    describe('Line Rasterization', () => {
        it('should rasterize horizontal line', () => {
            const cells = rasterizer.rasterizeLine(
                new Vector2D(0, 0),
                new Vector2D(80, 0)
            );
            
            assert.greaterThan(cells.length, 0);
            // All cells should have same row
            const rows = new Set(cells.map(c => c.row));
            assert.equal(rows.size, 1);
        });

        it('should rasterize vertical line', () => {
            const cells = rasterizer.rasterizeLine(
                new Vector2D(0, 0),
                new Vector2D(0, 80)
            );
            
            assert.greaterThan(cells.length, 0);
            // All cells should have same column
            const cols = new Set(cells.map(c => c.col));
            assert.equal(cols.size, 1);
        });

        it('should rasterize diagonal line', () => {
            const cells = rasterizer.rasterizeLine(
                new Vector2D(0, 0),
                new Vector2D(80, 80)
            );
            
            assert.greaterThan(cells.length, 0);
        });

        it('should select correct line characters', () => {
            const cells = rasterizer.rasterizeLine(
                new Vector2D(0, 0),
                new Vector2D(80, 0)
            );
            
            cells.forEach(cell => {
                assert.ok(cell.char === '-' || cell.char === '─' || cell.char);
            });
        });
    });

    describe('Rectangle Rasterization', () => {
        it('should rasterize filled rectangle', () => {
            const cells = rasterizer.rasterizeRect({
                x: 0, y: 0,
                width: 80, height: 32
            }, { filled: true });
            
            assert.greaterThan(cells.length, 0);
        });

        it('should rasterize outline rectangle', () => {
            const cells = rasterizer.rasterizeRect({
                x: 0, y: 0,
                width: 80, height: 32
            }, { filled: false });
            
            assert.greaterThan(cells.length, 0);
            // Should have corners
            const chars = cells.map(c => c.char);
            assert.ok(chars.includes('+') || chars.includes('┌'));
        });
    });

    describe('Circle Rasterization', () => {
        it('should rasterize circle', () => {
            const cells = rasterizer.rasterizeCircle({
                x: 40, y: 40,
                radius: 32
            });
            
            assert.greaterThan(cells.length, 0);
        });

        it('should rasterize ellipse', () => {
            const cells = rasterizer.rasterizeEllipse({
                x: 40, y: 40,
                radiusX: 40,
                radiusY: 24
            });
            
            assert.greaterThan(cells.length, 0);
        });
    });

    describe('Polygon Rasterization', () => {
        it('should rasterize triangle', () => {
            const points = [
                new Vector2D(40, 0),
                new Vector2D(80, 64),
                new Vector2D(0, 64)
            ];
            
            const cells = rasterizer.rasterizePolygon(points);
            assert.greaterThan(cells.length, 0);
        });
    });

    describe('Text Rasterization', () => {
        it('should rasterize text', () => {
            const cells = rasterizer.rasterizeText({
                x: 0, y: 0,
                content: 'Hello'
            });
            
            assert.lengthOf(cells, 5); // 5 characters
        });

        it('should handle multiline text', () => {
            const cells = rasterizer.rasterizeText({
                x: 0, y: 0,
                content: 'Line1\nLine2'
            });
            
            assert.greaterThan(cells.length, 5);
        });
    });

    describe('Buffer Operations', () => {
        it('should create character buffer', () => {
            const buffer = rasterizer.createBuffer(10, 5);
            
            assert.equal(buffer.width, 10);
            assert.equal(buffer.height, 5);
        });

        it('should set and get character in buffer', () => {
            const buffer = rasterizer.createBuffer(10, 5);
            buffer.set(3, 2, '#');
            
            assert.equal(buffer.get(3, 2), '#');
        });

        it('should render buffer to string', () => {
            const buffer = rasterizer.createBuffer(3, 2);
            buffer.set(0, 0, 'A');
            buffer.set(1, 0, 'B');
            buffer.set(2, 0, 'C');
            buffer.set(0, 1, 'D');
            buffer.set(1, 1, 'E');
            buffer.set(2, 1, 'F');
            
            const str = buffer.toString();
            assert.ok(str.includes('ABC'));
            assert.ok(str.includes('DEF'));
        });
    });
});

// ==========================================
// CHARACTER SETS TESTS
// ==========================================

describe('CharSets', () => {
    describe('Built-in Sets', () => {
        it('should have ASCII set', () => {
            const set = CharSets.get('ascii');
            assert.isDefined(set);
        });

        it('should have box drawing set', () => {
            const set = CharSets.get('box');
            assert.isDefined(set);
        });

        it('should have block set', () => {
            const set = CharSets.get('block');
            assert.isDefined(set);
        });

        it('should have braille set', () => {
            const set = CharSets.get('braille');
            assert.isDefined(set);
        });
    });

    describe('Character Selection', () => {
        it('should get character for direction', () => {
            const set = CharSets.get('box');
            const char = set.getLineChar('horizontal');
            assert.isDefined(char);
        });

        it('should get corner character', () => {
            const set = CharSets.get('box');
            const char = set.getCornerChar('top-left');
            assert.isDefined(char);
        });

        it('should get shade character for intensity', () => {
            const set = CharSets.get('block');
            
            const light = set.getShadeChar(0.25);
            const medium = set.getShadeChar(0.5);
            const dark = set.getShadeChar(0.75);
            
            assert.isDefined(light);
            assert.isDefined(medium);
            assert.isDefined(dark);
        });
    });

    describe('Custom Character Set', () => {
        it('should create custom character set', () => {
            const custom = new CharacterSet({
                name: 'custom',
                horizontal: '=',
                vertical: '|',
                corners: {
                    'top-left': '+',
                    'top-right': '+',
                    'bottom-left': '+',
                    'bottom-right': '+'
                }
            });
            
            assert.equal(custom.getLineChar('horizontal'), '=');
            assert.equal(custom.getLineChar('vertical'), '|');
        });

        it('should register custom character set', () => {
            const custom = new CharacterSet({
                name: 'mySet',
                horizontal: '*'
            });
            
            CharSets.register('mySet', custom);
            const retrieved = CharSets.get('mySet');
            
            assert.equal(retrieved, custom);
        });
    });
});

// ==========================================
// RENDERER TESTS
// ==========================================

describe('Renderer', () => {
    let renderer;
    let document;
    let canvas;

    beforeEach(() => {
        // Create mock canvas
        canvas = {
            width: 800,
            height: 600,
            getContext: () => ({
                clearRect: () => {},
                fillRect: () => {},
                fillText: () => {},
                strokeRect: () => {},
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                stroke: () => {},
                fill: () => {},
                save: () => {},
                restore: () => {},
                translate: () => {},
                scale: () => {},
                rotate: () => {},
                setTransform: () => {},
                measureText: () => ({ width: 10 }),
                font: '',
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 1
            })
        };

        document = new Document({
            width: 800,
            height: 600
        });

        renderer = new Renderer({
            canvas,
            document
        });
    });

    describe('Constructor', () => {
        it('should create renderer with canvas', () => {
            assert.isDefined(renderer.canvas);
        });

        it('should create renderer with document', () => {
            assert.isDefined(renderer.document);
        });
    });

    describe('Rendering', () => {
        it('should render without errors', () => {
            assert.doesNotThrow(() => {
                renderer.render();
            });
        });

        it('should render specific layer', () => {
            const layer = new Layer({ name: 'Test' });
            document.addLayer(layer);
            
            assert.doesNotThrow(() => {
                renderer.renderLayer(layer);
            });
        });
    });

    describe('Render Options', () => {
        it('should support grid rendering toggle', () => {
            renderer.options.showGrid = true;
            assert.ok(renderer.options.showGrid);
            
            renderer.options.showGrid = false;
            assert.ok(!renderer.options.showGrid);
        });

        it('should support selection rendering toggle', () => {
            renderer.options.showSelection = true;
            assert.ok(renderer.options.showSelection);
        });

        it('should support guides rendering toggle', () => {
            renderer.options.showGuides = true;
            assert.ok(renderer.options.showGuides);
        });
    });

    describe('Performance', () => {
        it('should track render time', () => {
            renderer.render();
            assert.isDefined(renderer.lastRenderTime);
        });

        it('should support dirty regions', () => {
            renderer.markDirty({ x: 0, y: 0, width: 100, height: 100 });
            assert.ok(renderer.hasDirtyRegions());
            
            renderer.clearDirtyRegions();
            assert.ok(!renderer.hasDirtyRegions());
        });
    });
});

// ==========================================
// DOCUMENT TESTS
// ==========================================

describe('Document', () => {
    let doc;

    beforeEach(() => {
        doc = new Document({
            width: 800,
            height: 600,
            name: 'Test Document'
        });
    });

    describe('Constructor', () => {
        it('should create document with dimensions', () => {
            assert.equal(doc.width, 800);
            assert.equal(doc.height, 600);
        });

        it('should have default layer', () => {
            assert.greaterThan(doc.layers.length, 0);
        });
    });

    describe('Layer Management', () => {
        it('should add layer', () => {
            const layer = new Layer({ name: 'New Layer' });
            doc.addLayer(layer);
            
            assert.ok(doc.layers.includes(layer));
        });

        it('should remove layer', () => {
            const layer = new Layer({ name: 'To Remove' });
            doc.addLayer(layer);
            doc.removeLayer(layer);
            
            assert.ok(!doc.layers.includes(layer));
        });

        it('should get layer by name', () => {
            const layer = new Layer({ name: 'Find Me' });
            doc.addLayer(layer);
            
            const found = doc.getLayerByName('Find Me');
            assert.equal(found, layer);
        });

        it('should set active layer', () => {
            const layer = new Layer({ name: 'Active' });
            doc.addLayer(layer);
            doc.setActiveLayer(layer);
            
            assert.equal(doc.activeLayer, layer);
        });

        it('should reorder layers', () => {
            const layer1 = doc.layers[0];
            const layer2 = new Layer({ name: 'Layer 2' });
            doc.addLayer(layer2);
            
            doc.setLayerIndex(layer2, 0);
            assert.equal(doc.layers[0], layer2);
        });
    });

    describe('Serialization', () => {
        it('should serialize to JSON', () => {
            const data = doc.toJSON();
            
            assert.equal(data.width, 800);
            assert.equal(data.height, 600);
            assert.isDefined(data.layers);
        });

        it('should deserialize from JSON', () => {
            const data = {
                width: 1024,
                height: 768,
                name: 'Loaded Doc',
                layers: [
                    { name: 'Layer 1', objects: [] }
                ]
            };
            
            const loaded = Document.fromJSON(data);
            
            assert.equal(loaded.width, 1024);
            assert.equal(loaded.height, 768);
        });
    });
});

// ==========================================
// LAYER TESTS
// ==========================================

describe('Layer', () => {
    let layer;

    beforeEach(() => {
        layer = new Layer({
            name: 'Test Layer'
        });
    });

    describe('Constructor', () => {
        it('should create layer with name', () => {
            assert.equal(layer.name, 'Test Layer');
        });

        it('should start with empty objects array', () => {
            assert.lengthOf(layer.objects, 0);
        });

        it('should be visible by default', () => {
            assert.ok(layer.visible);
        });

        it('should not be locked by default', () => {
            assert.ok(!layer.locked);
        });
    });

    describe('Object Management', () => {
        it('should add object', () => {
            const obj = { id: '1', type: 'test' };
            layer.addObject(obj);
            
            assert.lengthOf(layer.objects, 1);
        });

        it('should remove object', () => {
            const obj = { id: '1', type: 'test' };
            layer.addObject(obj);
            layer.removeObject(obj);
            
            assert.lengthOf(layer.objects, 0);
        });

        it('should get object by ID', () => {
            const obj = { id: 'unique-id', type: 'test' };
            layer.addObject(obj);
            
            const found = layer.getObjectById('unique-id');
            assert.equal(found, obj);
        });

        it('should reorder objects', () => {
            const obj1 = { id: '1', type: 'test' };
            const obj2 = { id: '2', type: 'test' };
            layer.addObject(obj1);
            layer.addObject(obj2);
            
            layer.setObjectIndex(obj2, 0);
            assert.equal(layer.objects[0], obj2);
        });
    });

    describe('Layer Properties', () => {
        it('should toggle visibility', () => {
            layer.visible = false;
            assert.ok(!layer.visible);
            
            layer.visible = true;
            assert.ok(layer.visible);
        });

        it('should toggle lock', () => {
            layer.locked = true;
            assert.ok(layer.locked);
            
            layer.locked = false;
            assert.ok(!layer.locked);
        });

        it('should set opacity', () => {
            layer.opacity = 0.5;
            assert.equal(layer.opacity, 0.5);
        });

        it('should clamp opacity', () => {
            layer.opacity = 1.5;
            assert.equal(layer.opacity, 1);
            
            layer.opacity = -0.5;
            assert.equal(layer.opacity, 0);
        });
    });

    describe('Serialization', () => {
        it('should serialize layer', () => {
            layer.addObject({ id: '1', type: 'test', toJSON: () => ({ id: '1', type: 'test' }) });
            const data = layer.toJSON();
            
            assert.equal(data.name, 'Test Layer');
            assert.lengthOf(data.objects, 1);
        });
    });
});
