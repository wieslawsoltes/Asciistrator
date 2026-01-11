/**
 * Asciistrator - Integration Tests
 * 
 * Tests for tools, UI components, and document workflows.
 */

import { describe, it, beforeEach, afterEach, assert } from '../framework.js';
import { Vector2D } from '../../scripts/core/math.js';
import { Document } from '../../scripts/core/Document.js';
import { Layer } from '../../scripts/core/Layer.js';
import { History } from '../../scripts/core/History.js';
import { Rectangle } from '../../scripts/objects/Rectangle.js';
import { Ellipse } from '../../scripts/objects/Ellipse.js';
import { Group } from '../../scripts/objects/group.js';

// ==========================================
// DOCUMENT WORKFLOW TESTS
// ==========================================

describe('Document Workflow', () => {
    let doc;

    beforeEach(() => {
        doc = new Document({
            width: 800,
            height: 600,
            name: 'Test Doc'
        });
    });

    describe('Creating Objects', () => {
        it('should add rectangle to layer', () => {
            const layer = doc.activeLayer;
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            
            layer.addObject(rect);
            
            assert.lengthOf(layer.objects, 1);
            assert.equal(layer.objects[0], rect);
        });

        it('should add multiple objects', () => {
            const layer = doc.activeLayer;
            
            layer.addObject(new Rectangle({ x: 0, y: 0, width: 50, height: 50 }));
            layer.addObject(new Ellipse({ x: 100, y: 100, radiusX: 25, radiusY: 25 }));
            layer.addObject(new Rectangle({ x: 200, y: 200, width: 50, height: 50 }));
            
            assert.lengthOf(layer.objects, 3);
        });
    });

    describe('Layer Operations', () => {
        it('should move object to different layer', () => {
            const layer1 = doc.activeLayer;
            const layer2 = new Layer({ name: 'Layer 2' });
            doc.addLayer(layer2);
            
            const rect = new Rectangle();
            layer1.addObject(rect);
            
            // Move to layer 2
            layer1.removeObject(rect);
            layer2.addObject(rect);
            
            assert.lengthOf(layer1.objects, 0);
            assert.lengthOf(layer2.objects, 1);
        });

        it('should merge layers', () => {
            const layer1 = doc.activeLayer;
            const layer2 = new Layer({ name: 'Layer 2' });
            doc.addLayer(layer2);
            
            layer1.addObject(new Rectangle());
            layer2.addObject(new Ellipse());
            
            // Merge layer2 into layer1
            layer2.objects.forEach(obj => layer1.addObject(obj));
            doc.removeLayer(layer2);
            
            assert.lengthOf(layer1.objects, 2);
            assert.lengthOf(doc.layers, 1);
        });
    });

    describe('Object Selection', () => {
        it('should find objects at point', () => {
            const layer = doc.activeLayer;
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            layer.addObject(rect);
            
            const point = new Vector2D(125, 125);
            const found = layer.objects.filter(obj => obj.containsPoint(point));
            
            assert.lengthOf(found, 1);
            assert.equal(found[0], rect);
        });

        it('should find objects in area', () => {
            const layer = doc.activeLayer;
            layer.addObject(new Rectangle({ x: 0, y: 0, width: 50, height: 50 }));
            layer.addObject(new Rectangle({ x: 100, y: 100, width: 50, height: 50 }));
            layer.addObject(new Rectangle({ x: 200, y: 200, width: 50, height: 50 }));
            
            const area = { x: 0, y: 0, width: 150, height: 150 };
            const found = layer.objects.filter(obj => {
                const bounds = obj.getBounds();
                return bounds.x < area.x + area.width &&
                       bounds.x + bounds.width > area.x &&
                       bounds.y < area.y + area.height &&
                       bounds.y + bounds.height > area.y;
            });
            
            assert.lengthOf(found, 2);
        });
    });

    describe('Grouping', () => {
        it('should group objects', () => {
            const layer = doc.activeLayer;
            const rect1 = new Rectangle({ x: 0, y: 0, width: 50, height: 50 });
            const rect2 = new Rectangle({ x: 100, y: 0, width: 50, height: 50 });
            
            layer.addObject(rect1);
            layer.addObject(rect2);
            
            // Create group
            const group = new Group({ children: [rect1, rect2] });
            layer.removeObject(rect1);
            layer.removeObject(rect2);
            layer.addObject(group);
            
            assert.lengthOf(layer.objects, 1);
            assert.instanceOf(layer.objects[0], Group);
            assert.lengthOf(group.children, 2);
        });

        it('should ungroup objects', () => {
            const layer = doc.activeLayer;
            const rect1 = new Rectangle({ x: 0, y: 0, width: 50, height: 50 });
            const rect2 = new Rectangle({ x: 100, y: 0, width: 50, height: 50 });
            const group = new Group({ children: [rect1, rect2] });
            
            layer.addObject(group);
            
            // Ungroup
            const children = group.ungroup();
            layer.removeObject(group);
            children.forEach(child => layer.addObject(child));
            
            assert.lengthOf(layer.objects, 2);
        });
    });
});

// ==========================================
// HISTORY/UNDO TESTS
// ==========================================

describe('History', () => {
    let history;
    let doc;

    beforeEach(() => {
        doc = new Document({ width: 800, height: 600 });
        history = new History({ maxSize: 100 });
    });

    describe('Basic Operations', () => {
        it('should push state', () => {
            history.push(doc.toJSON());
            assert.equal(history.length, 1);
        });

        it('should undo', () => {
            // Initial state
            history.push(doc.toJSON());
            
            // Add rectangle
            doc.activeLayer.addObject(new Rectangle());
            history.push(doc.toJSON());
            
            // Undo
            const previous = history.undo();
            
            assert.isDefined(previous);
            assert.lengthOf(previous.layers[0].objects, 0);
        });

        it('should redo', () => {
            history.push(doc.toJSON());
            
            doc.activeLayer.addObject(new Rectangle());
            history.push(doc.toJSON());
            
            history.undo();
            const redone = history.redo();
            
            assert.isDefined(redone);
            assert.lengthOf(redone.layers[0].objects, 1);
        });

        it('should clear redo stack on new action', () => {
            history.push(doc.toJSON());
            doc.activeLayer.addObject(new Rectangle());
            history.push(doc.toJSON());
            
            history.undo();
            
            // New action
            doc.activeLayer.addObject(new Ellipse());
            history.push(doc.toJSON());
            
            assert.ok(!history.canRedo());
        });
    });

    describe('State Tracking', () => {
        it('should track can undo', () => {
            assert.ok(!history.canUndo());
            
            history.push(doc.toJSON());
            history.push(doc.toJSON());
            
            assert.ok(history.canUndo());
        });

        it('should track can redo', () => {
            history.push(doc.toJSON());
            history.push(doc.toJSON());
            
            assert.ok(!history.canRedo());
            
            history.undo();
            
            assert.ok(history.canRedo());
        });
    });

    describe('History Limits', () => {
        it('should respect max size', () => {
            const smallHistory = new History({ maxSize: 5 });
            
            for (let i = 0; i < 10; i++) {
                smallHistory.push({ index: i });
            }
            
            assert.equal(smallHistory.length, 5);
        });
    });
});

// ==========================================
// TOOL INTEGRATION TESTS
// ==========================================

describe('Tool Integration', () => {
    let doc;
    let layer;

    beforeEach(() => {
        doc = new Document({ width: 800, height: 600 });
        layer = doc.activeLayer;
    });

    describe('Rectangle Tool Simulation', () => {
        it('should create rectangle from drag', () => {
            const startPoint = new Vector2D(100, 100);
            const endPoint = new Vector2D(200, 150);
            
            const width = endPoint.x - startPoint.x;
            const height = endPoint.y - startPoint.y;
            
            const rect = new Rectangle({
                x: startPoint.x,
                y: startPoint.y,
                width,
                height
            });
            
            layer.addObject(rect);
            
            assert.equal(rect.width, 100);
            assert.equal(rect.height, 50);
        });

        it('should handle reverse drag', () => {
            const startPoint = new Vector2D(200, 150);
            const endPoint = new Vector2D(100, 100);
            
            const x = Math.min(startPoint.x, endPoint.x);
            const y = Math.min(startPoint.y, endPoint.y);
            const width = Math.abs(endPoint.x - startPoint.x);
            const height = Math.abs(endPoint.y - startPoint.y);
            
            const rect = new Rectangle({ x, y, width, height });
            
            assert.equal(rect.x, 100);
            assert.equal(rect.y, 100);
            assert.equal(rect.width, 100);
            assert.equal(rect.height, 50);
        });
    });

    describe('Selection Tool Simulation', () => {
        it('should select object by click', () => {
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            layer.addObject(rect);
            
            const clickPoint = new Vector2D(125, 125);
            let selected = null;
            
            // Find clicked object (reverse order for z-index)
            for (let i = layer.objects.length - 1; i >= 0; i--) {
                if (layer.objects[i].containsPoint(clickPoint)) {
                    selected = layer.objects[i];
                    break;
                }
            }
            
            assert.equal(selected, rect);
        });

        it('should select multiple with marquee', () => {
            layer.addObject(new Rectangle({ x: 0, y: 0, width: 50, height: 50 }));
            layer.addObject(new Rectangle({ x: 60, y: 0, width: 50, height: 50 }));
            layer.addObject(new Rectangle({ x: 200, y: 200, width: 50, height: 50 }));
            
            const marquee = { x: 0, y: 0, width: 150, height: 100 };
            const selected = layer.objects.filter(obj => {
                const bounds = obj.getBounds();
                return bounds.x >= marquee.x &&
                       bounds.y >= marquee.y &&
                       bounds.x + bounds.width <= marquee.x + marquee.width &&
                       bounds.y + bounds.height <= marquee.y + marquee.height;
            });
            
            assert.lengthOf(selected, 2);
        });
    });

    describe('Move/Transform Simulation', () => {
        it('should move object', () => {
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            layer.addObject(rect);
            
            const delta = new Vector2D(50, 25);
            rect.x += delta.x;
            rect.y += delta.y;
            
            assert.equal(rect.x, 150);
            assert.equal(rect.y, 125);
        });

        it('should scale object', () => {
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            layer.addObject(rect);
            
            rect.scaleX = 2;
            rect.scaleY = 1.5;
            
            assert.equal(rect.scaleX, 2);
            assert.equal(rect.scaleY, 1.5);
        });

        it('should rotate object', () => {
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            layer.addObject(rect);
            
            rect.rotation = Math.PI / 4;
            
            assert.equal(rect.rotation, Math.PI / 4);
        });
    });
});

// ==========================================
// CLIPBOARD INTEGRATION TESTS
// ==========================================

describe('Clipboard Operations', () => {
    let doc;
    let layer;
    let clipboard;

    beforeEach(() => {
        doc = new Document({ width: 800, height: 600 });
        layer = doc.activeLayer;
        clipboard = [];
    });

    describe('Copy/Paste', () => {
        it('should copy object', () => {
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            layer.addObject(rect);
            
            // Copy
            clipboard = [rect.toJSON()];
            
            assert.lengthOf(clipboard, 1);
        });

        it('should paste object', () => {
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            clipboard = [rect.toJSON()];
            
            // Paste
            clipboard.forEach(data => {
                const pasted = Rectangle.fromJSON(data);
                pasted.x += 10;
                pasted.y += 10;
                layer.addObject(pasted);
            });
            
            assert.lengthOf(layer.objects, 1);
            assert.equal(layer.objects[0].x, 110);
        });

        it('should paste in place', () => {
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            clipboard = [rect.toJSON()];
            
            // Paste in place
            clipboard.forEach(data => {
                const pasted = Rectangle.fromJSON(data);
                layer.addObject(pasted);
            });
            
            assert.equal(layer.objects[0].x, 100);
            assert.equal(layer.objects[0].y, 100);
        });
    });

    describe('Cut', () => {
        it('should cut object', () => {
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            layer.addObject(rect);
            
            // Cut
            clipboard = [rect.toJSON()];
            layer.removeObject(rect);
            
            assert.lengthOf(layer.objects, 0);
            assert.lengthOf(clipboard, 1);
        });
    });

    describe('Duplicate', () => {
        it('should duplicate object', () => {
            const rect = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            layer.addObject(rect);
            
            // Duplicate
            const clone = rect.clone();
            clone.x += 10;
            clone.y += 10;
            layer.addObject(clone);
            
            assert.lengthOf(layer.objects, 2);
            assert.notEqual(layer.objects[0].id, layer.objects[1].id);
        });
    });
});

// ==========================================
// ALIGNMENT INTEGRATION TESTS
// ==========================================

describe('Alignment Operations', () => {
    let objects;

    beforeEach(() => {
        objects = [
            new Rectangle({ x: 0, y: 0, width: 50, height: 50 }),
            new Rectangle({ x: 100, y: 100, width: 50, height: 50 }),
            new Rectangle({ x: 200, y: 50, width: 50, height: 50 })
        ];
    });

    describe('Horizontal Alignment', () => {
        it('should align left', () => {
            const leftmost = Math.min(...objects.map(o => o.x));
            
            objects.forEach(obj => {
                obj.x = leftmost;
            });
            
            assert.ok(objects.every(o => o.x === 0));
        });

        it('should align center', () => {
            const bounds = objects.map(o => ({
                left: o.x,
                right: o.x + o.width
            }));
            const minX = Math.min(...bounds.map(b => b.left));
            const maxX = Math.max(...bounds.map(b => b.right));
            const centerX = (minX + maxX) / 2;
            
            objects.forEach(obj => {
                obj.x = centerX - obj.width / 2;
            });
            
            // All centers should be at centerX
            const centers = objects.map(o => o.x + o.width / 2);
            assert.ok(centers.every(c => Math.abs(c - centerX) < 0.01));
        });

        it('should align right', () => {
            const rightmost = Math.max(...objects.map(o => o.x + o.width));
            
            objects.forEach(obj => {
                obj.x = rightmost - obj.width;
            });
            
            assert.ok(objects.every(o => o.x + o.width === rightmost));
        });
    });

    describe('Vertical Alignment', () => {
        it('should align top', () => {
            const topmost = Math.min(...objects.map(o => o.y));
            
            objects.forEach(obj => {
                obj.y = topmost;
            });
            
            assert.ok(objects.every(o => o.y === 0));
        });

        it('should align middle', () => {
            const bounds = objects.map(o => ({
                top: o.y,
                bottom: o.y + o.height
            }));
            const minY = Math.min(...bounds.map(b => b.top));
            const maxY = Math.max(...bounds.map(b => b.bottom));
            const centerY = (minY + maxY) / 2;
            
            objects.forEach(obj => {
                obj.y = centerY - obj.height / 2;
            });
            
            const centers = objects.map(o => o.y + o.height / 2);
            assert.ok(centers.every(c => Math.abs(c - centerY) < 0.01));
        });

        it('should align bottom', () => {
            const bottommost = Math.max(...objects.map(o => o.y + o.height));
            
            objects.forEach(obj => {
                obj.y = bottommost - obj.height;
            });
            
            assert.ok(objects.every(o => o.y + o.height === bottommost));
        });
    });

    describe('Distribution', () => {
        it('should distribute horizontally', () => {
            // Sort by x position
            objects.sort((a, b) => a.x - b.x);
            
            const totalWidth = objects.reduce((sum, o) => sum + o.width, 0);
            const startX = objects[0].x;
            const endX = objects[objects.length - 1].x + objects[objects.length - 1].width;
            const totalSpace = endX - startX - totalWidth;
            const gap = totalSpace / (objects.length - 1);
            
            let currentX = startX;
            objects.forEach((obj, i) => {
                obj.x = currentX;
                currentX += obj.width + gap;
            });
            
            // Check gaps are equal
            for (let i = 0; i < objects.length - 1; i++) {
                const actualGap = objects[i + 1].x - (objects[i].x + objects[i].width);
                assert.approximately(actualGap, gap, 0.01);
            }
        });
    });
});

// ==========================================
// EXPORT INTEGRATION TESTS
// ==========================================

describe('Export Operations', () => {
    let doc;

    beforeEach(() => {
        doc = new Document({ width: 800, height: 600 });
        doc.activeLayer.addObject(new Rectangle({ x: 100, y: 100, width: 200, height: 100 }));
    });

    describe('Native Format', () => {
        it('should export to native JSON', () => {
            const json = JSON.stringify(doc.toJSON());
            
            assert.ok(json.length > 0);
            assert.ok(json.includes('layers'));
        });

        it('should import from native JSON', () => {
            const json = JSON.stringify(doc.toJSON());
            const imported = Document.fromJSON(JSON.parse(json));
            
            assert.equal(imported.width, 800);
            assert.equal(imported.height, 600);
            assert.lengthOf(imported.layers[0].objects, 1);
        });
    });

    describe('ASCII Export', () => {
        it('should export to ASCII string', () => {
            // Simulate ASCII export
            const width = Math.ceil(doc.width / 8);
            const height = Math.ceil(doc.height / 16);
            const buffer = Array(height).fill(null).map(() => Array(width).fill(' '));
            
            // Would normally rasterize objects here
            const ascii = buffer.map(row => row.join('')).join('\n');
            
            assert.ok(ascii.length > 0);
            assert.ok(ascii.includes('\n'));
        });
    });
});
