/**
 * Asciistrator - Objects Module Unit Tests
 * 
 * Tests for SceneObject, Rectangle, Ellipse, Polygon, Path, Text, Group.
 */

import { describe, it, beforeEach, assert } from '../framework.js';
import { Vector2D, Matrix3x3 } from '../../scripts/core/math.js';
import { SceneObject } from '../../scripts/objects/SceneObject.js';
import { Rectangle } from '../../scripts/objects/Rectangle.js';
import { Ellipse } from '../../scripts/objects/Ellipse.js';
import { Polygon } from '../../scripts/objects/Polygon.js';
import { Path } from '../../scripts/objects/path.js';
import { Text } from '../../scripts/objects/text.js';
import { Group } from '../../scripts/objects/group.js';

// ==========================================
// SCENE OBJECT BASE TESTS
// ==========================================

describe('SceneObject', () => {
    describe('Constructor', () => {
        it('should create object with default properties', () => {
            const obj = new SceneObject();
            assert.isDefined(obj.id);
            assert.equal(obj.x, 0);
            assert.equal(obj.y, 0);
            assert.equal(obj.rotation, 0);
            assert.equal(obj.scaleX, 1);
            assert.equal(obj.scaleY, 1);
            assert.equal(obj.visible, true);
            assert.equal(obj.locked, false);
        });

        it('should accept initial properties', () => {
            const obj = new SceneObject({ x: 10, y: 20, name: 'Test' });
            assert.equal(obj.x, 10);
            assert.equal(obj.y, 20);
            assert.equal(obj.name, 'Test');
        });

        it('should generate unique IDs', () => {
            const obj1 = new SceneObject();
            const obj2 = new SceneObject();
            assert.notEqual(obj1.id, obj2.id);
        });
    });

    describe('Transform', () => {
        it('should build transform matrix', () => {
            const obj = new SceneObject({ x: 10, y: 20 });
            const matrix = obj.getTransform();
            
            assert.instanceOf(matrix, Matrix3x3);
            
            // Transform origin point
            const p = matrix.transformPoint(new Vector2D(0, 0));
            assert.equal(p.x, 10);
            assert.equal(p.y, 20);
        });

        it('should include rotation in transform', () => {
            const obj = new SceneObject({ rotation: Math.PI / 2 });
            const matrix = obj.getTransform();
            
            const p = matrix.transformPoint(new Vector2D(1, 0));
            assert.approximately(p.x, 0, 0.0001);
            assert.approximately(p.y, 1, 0.0001);
        });

        it('should include scale in transform', () => {
            const obj = new SceneObject({ scaleX: 2, scaleY: 3 });
            const matrix = obj.getTransform();
            
            const p = matrix.transformPoint(new Vector2D(1, 1));
            assert.equal(p.x, 2);
            assert.equal(p.y, 3);
        });

        it('should get global transform with parent', () => {
            const parent = new SceneObject({ x: 100, y: 100 });
            const child = new SceneObject({ x: 10, y: 10 });
            child.parent = parent;
            
            const globalMatrix = child.getGlobalTransform();
            const p = globalMatrix.transformPoint(new Vector2D(0, 0));
            
            assert.equal(p.x, 110);
            assert.equal(p.y, 110);
        });
    });

    describe('Bounds', () => {
        it('should return empty bounds for base object', () => {
            const obj = new SceneObject();
            const bounds = obj.getBounds();
            
            assert.isDefined(bounds);
        });
    });

    describe('Serialization', () => {
        it('should serialize to JSON', () => {
            const obj = new SceneObject({ x: 10, y: 20, name: 'Test' });
            const data = obj.toJSON();
            
            assert.equal(data.x, 10);
            assert.equal(data.y, 20);
            assert.equal(data.name, 'Test');
        });

        it('should deserialize from JSON', () => {
            const data = { x: 10, y: 20, name: 'Test', rotation: 1.5 };
            const obj = SceneObject.fromJSON(data);
            
            assert.equal(obj.x, 10);
            assert.equal(obj.y, 20);
            assert.equal(obj.name, 'Test');
            assert.equal(obj.rotation, 1.5);
        });
    });

    describe('Clone', () => {
        it('should create independent copy', () => {
            const obj = new SceneObject({ x: 10, y: 20 });
            const clone = obj.clone();
            
            assert.equal(clone.x, 10);
            assert.equal(clone.y, 20);
            assert.notEqual(clone.id, obj.id);
        });
    });
});

// ==========================================
// RECTANGLE TESTS
// ==========================================

describe('Rectangle', () => {
    describe('Constructor', () => {
        it('should create rectangle with dimensions', () => {
            const rect = new Rectangle({ width: 100, height: 50 });
            assert.equal(rect.width, 100);
            assert.equal(rect.height, 50);
        });

        it('should default to 100x100', () => {
            const rect = new Rectangle();
            assert.equal(rect.width, 100);
            assert.equal(rect.height, 100);
        });

        it('should support corner radius', () => {
            const rect = new Rectangle({ cornerRadius: 10 });
            assert.equal(rect.cornerRadius, 10);
        });
    });

    describe('Bounds', () => {
        it('should calculate correct bounds', () => {
            const rect = new Rectangle({ x: 10, y: 20, width: 100, height: 50 });
            const bounds = rect.getBounds();
            
            assert.equal(bounds.x, 10);
            assert.equal(bounds.y, 20);
            assert.equal(bounds.width, 100);
            assert.equal(bounds.height, 50);
        });

        it('should include position in bounds', () => {
            const rect = new Rectangle({ x: 50, y: 50, width: 100, height: 100 });
            const bounds = rect.getBounds();
            
            assert.equal(bounds.x, 50);
            assert.equal(bounds.y, 50);
        });
    });

    describe('Hit Testing', () => {
        it('should detect point inside', () => {
            const rect = new Rectangle({ x: 0, y: 0, width: 100, height: 100 });
            assert.ok(rect.containsPoint(new Vector2D(50, 50)));
        });

        it('should detect point outside', () => {
            const rect = new Rectangle({ x: 0, y: 0, width: 100, height: 100 });
            assert.ok(!rect.containsPoint(new Vector2D(150, 50)));
        });

        it('should handle edge cases', () => {
            const rect = new Rectangle({ x: 0, y: 0, width: 100, height: 100 });
            assert.ok(rect.containsPoint(new Vector2D(0, 0)));
            assert.ok(rect.containsPoint(new Vector2D(100, 100)));
        });
    });

    describe('Path Generation', () => {
        it('should generate path points', () => {
            const rect = new Rectangle({ width: 100, height: 50 });
            const path = rect.getPath();
            
            assert.ok(Array.isArray(path));
            assert.greaterThan(path.length, 0);
        });

        it('should generate rounded corners when specified', () => {
            const rect = new Rectangle({ width: 100, height: 50, cornerRadius: 10 });
            const path = rect.getPath();
            
            // Rounded corners generate more points
            const normalRect = new Rectangle({ width: 100, height: 50 });
            const normalPath = normalRect.getPath();
            
            assert.greaterThan(path.length, normalPath.length);
        });
    });

    describe('Serialization', () => {
        it('should serialize rectangle properties', () => {
            const rect = new Rectangle({ 
                x: 10, y: 20, 
                width: 100, height: 50, 
                cornerRadius: 5 
            });
            const data = rect.toJSON();
            
            assert.equal(data.type, 'rectangle');
            assert.equal(data.width, 100);
            assert.equal(data.height, 50);
            assert.equal(data.cornerRadius, 5);
        });

        it('should deserialize rectangle', () => {
            const data = {
                type: 'rectangle',
                x: 10, y: 20,
                width: 100, height: 50
            };
            const rect = Rectangle.fromJSON(data);
            
            assert.instanceOf(rect, Rectangle);
            assert.equal(rect.width, 100);
            assert.equal(rect.height, 50);
        });
    });
});

// ==========================================
// ELLIPSE TESTS
// ==========================================

describe('Ellipse', () => {
    describe('Constructor', () => {
        it('should create ellipse with radii', () => {
            const ellipse = new Ellipse({ radiusX: 50, radiusY: 30 });
            assert.equal(ellipse.radiusX, 50);
            assert.equal(ellipse.radiusY, 30);
        });

        it('should create circle with equal radii', () => {
            const circle = new Ellipse({ radiusX: 50, radiusY: 50 });
            assert.equal(circle.radiusX, circle.radiusY);
        });
    });

    describe('Bounds', () => {
        it('should calculate correct bounds', () => {
            const ellipse = new Ellipse({ x: 100, y: 100, radiusX: 50, radiusY: 30 });
            const bounds = ellipse.getBounds();
            
            assert.equal(bounds.x, 50);  // x - radiusX
            assert.equal(bounds.y, 70);  // y - radiusY
            assert.equal(bounds.width, 100);  // 2 * radiusX
            assert.equal(bounds.height, 60);  // 2 * radiusY
        });
    });

    describe('Hit Testing', () => {
        it('should detect point inside circle', () => {
            const circle = new Ellipse({ x: 50, y: 50, radiusX: 50, radiusY: 50 });
            assert.ok(circle.containsPoint(new Vector2D(50, 50)));
            assert.ok(circle.containsPoint(new Vector2D(70, 50)));
        });

        it('should detect point outside circle', () => {
            const circle = new Ellipse({ x: 50, y: 50, radiusX: 50, radiusY: 50 });
            assert.ok(!circle.containsPoint(new Vector2D(150, 50)));
        });

        it('should handle ellipse hit testing', () => {
            const ellipse = new Ellipse({ x: 50, y: 50, radiusX: 50, radiusY: 25 });
            assert.ok(ellipse.containsPoint(new Vector2D(50, 50)));
            assert.ok(ellipse.containsPoint(new Vector2D(80, 50)));
            assert.ok(!ellipse.containsPoint(new Vector2D(50, 90)));
        });
    });

    describe('Path Generation', () => {
        it('should generate ellipse path', () => {
            const ellipse = new Ellipse({ radiusX: 50, radiusY: 30 });
            const path = ellipse.getPath();
            
            assert.ok(Array.isArray(path));
            assert.greaterThan(path.length, 4);
        });
    });

    describe('Properties', () => {
        it('should calculate area', () => {
            const ellipse = new Ellipse({ radiusX: 50, radiusY: 30 });
            const area = ellipse.getArea();
            
            assert.approximately(area, Math.PI * 50 * 30, 0.01);
        });

        it('should calculate perimeter approximately', () => {
            const circle = new Ellipse({ radiusX: 50, radiusY: 50 });
            const perimeter = circle.getPerimeter();
            
            assert.approximately(perimeter, 2 * Math.PI * 50, 1);
        });
    });
});

// ==========================================
// POLYGON TESTS
// ==========================================

describe('Polygon', () => {
    describe('Constructor', () => {
        it('should create polygon from points', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(100, 0),
                new Vector2D(100, 100),
                new Vector2D(0, 100)
            ];
            const polygon = new Polygon({ points });
            
            assert.lengthOf(polygon.points, 4);
        });

        it('should create regular polygon', () => {
            const polygon = Polygon.createRegular(6, 50);
            assert.lengthOf(polygon.points, 6);
        });

        it('should create star polygon', () => {
            const star = Polygon.createStar(5, 50, 25);
            assert.lengthOf(star.points, 10);
        });
    });

    describe('Bounds', () => {
        it('should calculate correct bounds', () => {
            const points = [
                new Vector2D(10, 20),
                new Vector2D(110, 20),
                new Vector2D(110, 120),
                new Vector2D(10, 120)
            ];
            const polygon = new Polygon({ points });
            const bounds = polygon.getBounds();
            
            assert.equal(bounds.x, 10);
            assert.equal(bounds.y, 20);
            assert.equal(bounds.width, 100);
            assert.equal(bounds.height, 100);
        });
    });

    describe('Hit Testing', () => {
        it('should detect point inside polygon', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(100, 0),
                new Vector2D(100, 100),
                new Vector2D(0, 100)
            ];
            const polygon = new Polygon({ points });
            
            assert.ok(polygon.containsPoint(new Vector2D(50, 50)));
        });

        it('should detect point outside polygon', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(100, 0),
                new Vector2D(100, 100),
                new Vector2D(0, 100)
            ];
            const polygon = new Polygon({ points });
            
            assert.ok(!polygon.containsPoint(new Vector2D(150, 50)));
        });

        it('should handle concave polygons', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(100, 0),
                new Vector2D(100, 100),
                new Vector2D(50, 50),
                new Vector2D(0, 100)
            ];
            const polygon = new Polygon({ points });
            
            // Point in concave area should be outside
            assert.ok(!polygon.containsPoint(new Vector2D(75, 75)));
        });
    });

    describe('Properties', () => {
        it('should calculate area', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(100, 0),
                new Vector2D(100, 100),
                new Vector2D(0, 100)
            ];
            const polygon = new Polygon({ points });
            
            assert.approximately(polygon.getArea(), 10000, 0.01);
        });

        it('should calculate centroid', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(100, 0),
                new Vector2D(100, 100),
                new Vector2D(0, 100)
            ];
            const polygon = new Polygon({ points });
            const centroid = polygon.getCentroid();
            
            assert.approximately(centroid.x, 50, 0.01);
            assert.approximately(centroid.y, 50, 0.01);
        });

        it('should check if convex', () => {
            const square = new Polygon({
                points: [
                    new Vector2D(0, 0),
                    new Vector2D(100, 0),
                    new Vector2D(100, 100),
                    new Vector2D(0, 100)
                ]
            });
            
            assert.ok(square.isConvex());
        });
    });

    describe('Modification', () => {
        it('should add vertex', () => {
            const polygon = new Polygon({
                points: [
                    new Vector2D(0, 0),
                    new Vector2D(100, 0),
                    new Vector2D(50, 100)
                ]
            });
            
            polygon.addVertex(new Vector2D(100, 100), 2);
            assert.lengthOf(polygon.points, 4);
        });

        it('should remove vertex', () => {
            const polygon = new Polygon({
                points: [
                    new Vector2D(0, 0),
                    new Vector2D(100, 0),
                    new Vector2D(100, 100),
                    new Vector2D(0, 100)
                ]
            });
            
            polygon.removeVertex(2);
            assert.lengthOf(polygon.points, 3);
        });
    });
});

// ==========================================
// PATH TESTS
// ==========================================

describe('Path', () => {
    describe('Constructor', () => {
        it('should create empty path', () => {
            const path = new Path();
            assert.lengthOf(path.segments, 0);
        });
    });

    describe('Path Building', () => {
        it('should add moveTo command', () => {
            const path = new Path();
            path.moveTo(10, 20);
            
            assert.lengthOf(path.segments, 1);
            assert.equal(path.segments[0].type, 'M');
        });

        it('should add lineTo command', () => {
            const path = new Path();
            path.moveTo(0, 0);
            path.lineTo(100, 100);
            
            assert.lengthOf(path.segments, 2);
            assert.equal(path.segments[1].type, 'L');
        });

        it('should add quadraticTo command', () => {
            const path = new Path();
            path.moveTo(0, 0);
            path.quadraticTo(50, 100, 100, 0);
            
            assert.lengthOf(path.segments, 2);
            assert.equal(path.segments[1].type, 'Q');
        });

        it('should add cubicTo command', () => {
            const path = new Path();
            path.moveTo(0, 0);
            path.cubicTo(33, 100, 66, 100, 100, 0);
            
            assert.lengthOf(path.segments, 2);
            assert.equal(path.segments[1].type, 'C');
        });

        it('should close path', () => {
            const path = new Path();
            path.moveTo(0, 0);
            path.lineTo(100, 0);
            path.lineTo(50, 100);
            path.close();
            
            assert.ok(path.isClosed);
        });
    });

    describe('Path String', () => {
        it('should generate SVG path string', () => {
            const path = new Path();
            path.moveTo(0, 0);
            path.lineTo(100, 100);
            
            const str = path.toPathString();
            assert.ok(str.includes('M'));
            assert.ok(str.includes('L'));
        });

        it('should parse SVG path string', () => {
            const path = Path.fromPathString('M 0 0 L 100 100 L 100 0 Z');
            
            assert.greaterThan(path.segments.length, 0);
        });
    });

    describe('Bounds', () => {
        it('should calculate bounds', () => {
            const path = new Path();
            path.moveTo(10, 20);
            path.lineTo(110, 20);
            path.lineTo(110, 120);
            path.lineTo(10, 120);
            path.close();
            
            const bounds = path.getBounds();
            
            assert.equal(bounds.x, 10);
            assert.equal(bounds.y, 20);
            assert.equal(bounds.width, 100);
            assert.equal(bounds.height, 100);
        });
    });

    describe('Path Operations', () => {
        it('should reverse path', () => {
            const path = new Path();
            path.moveTo(0, 0);
            path.lineTo(100, 0);
            path.lineTo(100, 100);
            
            const reversed = path.reverse();
            
            // First point should now be last point of original
            assert.equal(reversed.segments[0].point.x, 100);
            assert.equal(reversed.segments[0].point.y, 100);
        });

        it('should flatten path', () => {
            const path = new Path();
            path.moveTo(0, 0);
            path.cubicTo(33, 100, 66, 100, 100, 0);
            
            const points = path.flatten(1);
            
            assert.greaterThan(points.length, 2);
        });

        it('should calculate length', () => {
            const path = new Path();
            path.moveTo(0, 0);
            path.lineTo(100, 0);
            path.lineTo(100, 100);
            
            const length = path.getLength();
            
            assert.approximately(length, 200, 1);
        });

        it('should get point at length', () => {
            const path = new Path();
            path.moveTo(0, 0);
            path.lineTo(100, 0);
            
            const point = path.getPointAtLength(50);
            
            assert.approximately(point.x, 50, 1);
            assert.approximately(point.y, 0, 1);
        });
    });
});

// ==========================================
// TEXT TESTS
// ==========================================

describe('Text', () => {
    describe('Constructor', () => {
        it('should create text with content', () => {
            const text = new Text({ content: 'Hello World' });
            assert.equal(text.content, 'Hello World');
        });

        it('should support font properties', () => {
            const text = new Text({ 
                content: 'Test', 
                fontSize: 24,
                fontFamily: 'Arial'
            });
            
            assert.equal(text.fontSize, 24);
            assert.equal(text.fontFamily, 'Arial');
        });
    });

    describe('Text Lines', () => {
        it('should split text into lines', () => {
            const text = new Text({ content: 'Line 1\nLine 2\nLine 3' });
            const lines = text.getLines();
            
            assert.lengthOf(lines, 3);
        });

        it('should handle empty text', () => {
            const text = new Text({ content: '' });
            const lines = text.getLines();
            
            assert.lengthOf(lines, 1);
        });
    });

    describe('Bounds', () => {
        it('should calculate approximate bounds', () => {
            const text = new Text({ content: 'Hello', fontSize: 10 });
            const bounds = text.getBounds();
            
            assert.isDefined(bounds.width);
            assert.isDefined(bounds.height);
            assert.greaterThan(bounds.width, 0);
            assert.greaterThan(bounds.height, 0);
        });
    });

    describe('Serialization', () => {
        it('should serialize text properties', () => {
            const text = new Text({ 
                content: 'Test', 
                fontSize: 24,
                fontFamily: 'Courier'
            });
            const data = text.toJSON();
            
            assert.equal(data.type, 'text');
            assert.equal(data.content, 'Test');
            assert.equal(data.fontSize, 24);
        });
    });
});

// ==========================================
// GROUP TESTS
// ==========================================

describe('Group', () => {
    describe('Constructor', () => {
        it('should create empty group', () => {
            const group = new Group();
            assert.lengthOf(group.children, 0);
        });

        it('should create group with children', () => {
            const rect = new Rectangle({ width: 50, height: 50 });
            const ellipse = new Ellipse({ radiusX: 25, radiusY: 25 });
            const group = new Group({ children: [rect, ellipse] });
            
            assert.lengthOf(group.children, 2);
        });
    });

    describe('Child Management', () => {
        let group;

        beforeEach(() => {
            group = new Group();
        });

        it('should add child', () => {
            const rect = new Rectangle();
            group.addChild(rect);
            
            assert.lengthOf(group.children, 1);
            assert.equal(rect.parent, group);
        });

        it('should remove child', () => {
            const rect = new Rectangle();
            group.addChild(rect);
            group.removeChild(rect);
            
            assert.lengthOf(group.children, 0);
            assert.isNull(rect.parent);
        });

        it('should get child at index', () => {
            const rect = new Rectangle();
            const ellipse = new Ellipse();
            group.addChild(rect);
            group.addChild(ellipse);
            
            assert.equal(group.getChildAt(0), rect);
            assert.equal(group.getChildAt(1), ellipse);
        });

        it('should set child index', () => {
            const rect = new Rectangle();
            const ellipse = new Ellipse();
            group.addChild(rect);
            group.addChild(ellipse);
            
            group.setChildIndex(ellipse, 0);
            
            assert.equal(group.getChildAt(0), ellipse);
            assert.equal(group.getChildAt(1), rect);
        });
    });

    describe('Bounds', () => {
        it('should calculate combined bounds', () => {
            const rect1 = new Rectangle({ x: 0, y: 0, width: 50, height: 50 });
            const rect2 = new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            const group = new Group({ children: [rect1, rect2] });
            
            const bounds = group.getBounds();
            
            assert.equal(bounds.x, 0);
            assert.equal(bounds.y, 0);
            assert.equal(bounds.width, 150);
            assert.equal(bounds.height, 150);
        });

        it('should return empty bounds for empty group', () => {
            const group = new Group();
            const bounds = group.getBounds();
            
            assert.isDefined(bounds);
        });
    });

    describe('Hit Testing', () => {
        it('should hit test children', () => {
            const rect = new Rectangle({ x: 0, y: 0, width: 100, height: 100 });
            const group = new Group({ children: [rect] });
            
            assert.ok(group.containsPoint(new Vector2D(50, 50)));
            assert.ok(!group.containsPoint(new Vector2D(150, 50)));
        });
    });

    describe('Transformation', () => {
        it('should transform children', () => {
            const rect = new Rectangle({ x: 0, y: 0, width: 50, height: 50 });
            const group = new Group({ x: 100, y: 100, children: [rect] });
            
            const globalTransform = rect.getGlobalTransform();
            const point = globalTransform.transformPoint(new Vector2D(25, 25));
            
            assert.equal(point.x, 125);
            assert.equal(point.y, 125);
        });
    });

    describe('Serialization', () => {
        it('should serialize group and children', () => {
            const rect = new Rectangle({ width: 50, height: 50 });
            const group = new Group({ children: [rect] });
            const data = group.toJSON();
            
            assert.equal(data.type, 'group');
            assert.lengthOf(data.children, 1);
            assert.equal(data.children[0].type, 'rectangle');
        });

        it('should deserialize group and children', () => {
            const data = {
                type: 'group',
                x: 10, y: 20,
                children: [
                    { type: 'rectangle', width: 50, height: 50 },
                    { type: 'ellipse', radiusX: 25, radiusY: 25 }
                ]
            };
            
            const group = Group.fromJSON(data);
            
            assert.instanceOf(group, Group);
            assert.lengthOf(group.children, 2);
        });
    });

    describe('Group Operations', () => {
        it('should ungroup children', () => {
            const rect = new Rectangle({ x: 0, y: 0 });
            const ellipse = new Ellipse({ x: 100, y: 0 });
            const group = new Group({ x: 50, y: 50, children: [rect, ellipse] });
            
            const ungrouped = group.ungroup();
            
            assert.lengthOf(ungrouped, 2);
            // Children should have global positions
            assert.equal(ungrouped[0].x, 50);
            assert.equal(ungrouped[1].x, 150);
        });
    });
});
