/**
 * Asciistrator - Math Module Unit Tests
 * 
 * Tests for Vector2D, Matrix3x3, Bezier, and Geometry utilities.
 */

import { describe, it, beforeEach, assert } from '../framework.js';
import { Vector2D, Matrix3x3 } from '../../scripts/core/math.js';
import { QuadraticBezier, CubicBezier, BezierUtils } from '../../scripts/core/bezier.js';
import { 
    lineIntersection, 
    pointInPolygon, 
    polygonArea, 
    convexHull,
    nearestPointOnLine,
    distanceToLine
} from '../../scripts/core/geometry.js';

// ==========================================
// VECTOR2D TESTS
// ==========================================

describe('Vector2D', () => {
    describe('Constructor', () => {
        it('should create a vector with given coordinates', () => {
            const v = new Vector2D(3, 4);
            assert.equal(v.x, 3);
            assert.equal(v.y, 4);
        });

        it('should default to zero vector', () => {
            const v = new Vector2D();
            assert.equal(v.x, 0);
            assert.equal(v.y, 0);
        });

        it('should create from object', () => {
            const v = Vector2D.fromObject({ x: 5, y: 6 });
            assert.equal(v.x, 5);
            assert.equal(v.y, 6);
        });

        it('should create from angle', () => {
            const v = Vector2D.fromAngle(0, 1);
            assert.approximately(v.x, 1, 0.0001);
            assert.approximately(v.y, 0, 0.0001);
        });

        it('should create from angle at 90 degrees', () => {
            const v = Vector2D.fromAngle(Math.PI / 2, 1);
            assert.approximately(v.x, 0, 0.0001);
            assert.approximately(v.y, 1, 0.0001);
        });
    });

    describe('Basic Operations', () => {
        let v1, v2;

        beforeEach(() => {
            v1 = new Vector2D(3, 4);
            v2 = new Vector2D(1, 2);
        });

        it('should add vectors', () => {
            const result = v1.add(v2);
            assert.equal(result.x, 4);
            assert.equal(result.y, 6);
        });

        it('should subtract vectors', () => {
            const result = v1.subtract(v2);
            assert.equal(result.x, 2);
            assert.equal(result.y, 2);
        });

        it('should multiply by scalar', () => {
            const result = v1.multiply(2);
            assert.equal(result.x, 6);
            assert.equal(result.y, 8);
        });

        it('should divide by scalar', () => {
            const result = v1.divide(2);
            assert.equal(result.x, 1.5);
            assert.equal(result.y, 2);
        });

        it('should not mutate original vectors', () => {
            v1.add(v2);
            assert.equal(v1.x, 3);
            assert.equal(v1.y, 4);
        });
    });

    describe('Vector Properties', () => {
        it('should calculate magnitude', () => {
            const v = new Vector2D(3, 4);
            assert.equal(v.magnitude(), 5);
        });

        it('should calculate magnitude squared', () => {
            const v = new Vector2D(3, 4);
            assert.equal(v.magnitudeSquared(), 25);
        });

        it('should normalize vector', () => {
            const v = new Vector2D(3, 4);
            const n = v.normalize();
            assert.approximately(n.x, 0.6, 0.0001);
            assert.approximately(n.y, 0.8, 0.0001);
            assert.approximately(n.magnitude(), 1, 0.0001);
        });

        it('should handle zero vector normalization', () => {
            const v = new Vector2D(0, 0);
            const n = v.normalize();
            assert.equal(n.x, 0);
            assert.equal(n.y, 0);
        });

        it('should calculate angle', () => {
            const v = new Vector2D(1, 0);
            assert.approximately(v.angle(), 0, 0.0001);
        });

        it('should calculate angle at 90 degrees', () => {
            const v = new Vector2D(0, 1);
            assert.approximately(v.angle(), Math.PI / 2, 0.0001);
        });
    });

    describe('Vector Operations', () => {
        it('should calculate dot product', () => {
            const v1 = new Vector2D(2, 3);
            const v2 = new Vector2D(4, 5);
            assert.equal(v1.dot(v2), 23); // 2*4 + 3*5
        });

        it('should calculate cross product', () => {
            const v1 = new Vector2D(2, 3);
            const v2 = new Vector2D(4, 5);
            assert.equal(v1.cross(v2), -2); // 2*5 - 3*4
        });

        it('should calculate distance', () => {
            const v1 = new Vector2D(0, 0);
            const v2 = new Vector2D(3, 4);
            assert.equal(v1.distance(v2), 5);
        });

        it('should calculate distance squared', () => {
            const v1 = new Vector2D(0, 0);
            const v2 = new Vector2D(3, 4);
            assert.equal(v1.distanceSquared(v2), 25);
        });

        it('should calculate angle between vectors', () => {
            const v1 = new Vector2D(1, 0);
            const v2 = new Vector2D(0, 1);
            assert.approximately(v1.angleBetween(v2), Math.PI / 2, 0.0001);
        });

        it('should lerp between vectors', () => {
            const v1 = new Vector2D(0, 0);
            const v2 = new Vector2D(10, 10);
            const result = v1.lerp(v2, 0.5);
            assert.equal(result.x, 5);
            assert.equal(result.y, 5);
        });

        it('should project onto another vector', () => {
            const v1 = new Vector2D(3, 4);
            const v2 = new Vector2D(1, 0);
            const proj = v1.project(v2);
            assert.approximately(proj.x, 3, 0.0001);
            assert.approximately(proj.y, 0, 0.0001);
        });

        it('should reflect across normal', () => {
            const v = new Vector2D(1, -1);
            const normal = new Vector2D(0, 1);
            const reflected = v.reflect(normal);
            assert.approximately(reflected.x, 1, 0.0001);
            assert.approximately(reflected.y, 1, 0.0001);
        });

        it('should rotate around origin', () => {
            const v = new Vector2D(1, 0);
            const rotated = v.rotate(Math.PI / 2);
            assert.approximately(rotated.x, 0, 0.0001);
            assert.approximately(rotated.y, 1, 0.0001);
        });

        it('should rotate around point', () => {
            const v = new Vector2D(2, 0);
            const rotated = v.rotateAround(new Vector2D(1, 0), Math.PI);
            assert.approximately(rotated.x, 0, 0.0001);
            assert.approximately(rotated.y, 0, 0.0001);
        });

        it('should get perpendicular vector', () => {
            const v = new Vector2D(1, 0);
            const perp = v.perpendicular();
            assert.equal(perp.x, 0);
            assert.equal(perp.y, 1);
        });

        it('should negate vector', () => {
            const v = new Vector2D(3, -4);
            const neg = v.negate();
            assert.equal(neg.x, -3);
            assert.equal(neg.y, 4);
        });

        it('should clone vector', () => {
            const v = new Vector2D(3, 4);
            const clone = v.clone();
            assert.equal(clone.x, 3);
            assert.equal(clone.y, 4);
            assert.notEqual(v, clone);
        });

        it('should check equality', () => {
            const v1 = new Vector2D(3, 4);
            const v2 = new Vector2D(3, 4);
            const v3 = new Vector2D(3, 5);
            assert.ok(v1.equals(v2));
            assert.ok(!v1.equals(v3));
        });
    });

    describe('Static Methods', () => {
        it('should calculate min component-wise', () => {
            const v1 = new Vector2D(1, 5);
            const v2 = new Vector2D(3, 2);
            const min = Vector2D.min(v1, v2);
            assert.equal(min.x, 1);
            assert.equal(min.y, 2);
        });

        it('should calculate max component-wise', () => {
            const v1 = new Vector2D(1, 5);
            const v2 = new Vector2D(3, 2);
            const max = Vector2D.max(v1, v2);
            assert.equal(max.x, 3);
            assert.equal(max.y, 5);
        });

        it('should create zero vector', () => {
            const v = Vector2D.zero();
            assert.equal(v.x, 0);
            assert.equal(v.y, 0);
        });

        it('should create unit vectors', () => {
            const up = Vector2D.up();
            const right = Vector2D.right();
            assert.equal(up.x, 0);
            assert.equal(up.y, -1);
            assert.equal(right.x, 1);
            assert.equal(right.y, 0);
        });
    });
});

// ==========================================
// MATRIX3X3 TESTS
// ==========================================

describe('Matrix3x3', () => {
    describe('Constructor', () => {
        it('should create identity matrix by default', () => {
            const m = new Matrix3x3();
            assert.deepEqual(m.values, [
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            ]);
        });

        it('should create matrix from values', () => {
            const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const m = new Matrix3x3(values);
            assert.deepEqual(m.values, values);
        });
    });

    describe('Static Constructors', () => {
        it('should create identity matrix', () => {
            const m = Matrix3x3.identity();
            assert.equal(m.values[0], 1);
            assert.equal(m.values[4], 1);
            assert.equal(m.values[8], 1);
        });

        it('should create translation matrix', () => {
            const m = Matrix3x3.translation(10, 20);
            const v = m.transformPoint(new Vector2D(0, 0));
            assert.equal(v.x, 10);
            assert.equal(v.y, 20);
        });

        it('should create rotation matrix', () => {
            const m = Matrix3x3.rotation(Math.PI / 2);
            const v = m.transformPoint(new Vector2D(1, 0));
            assert.approximately(v.x, 0, 0.0001);
            assert.approximately(v.y, 1, 0.0001);
        });

        it('should create scale matrix', () => {
            const m = Matrix3x3.scale(2, 3);
            const v = m.transformPoint(new Vector2D(5, 10));
            assert.equal(v.x, 10);
            assert.equal(v.y, 30);
        });

        it('should create shear matrix', () => {
            const m = Matrix3x3.shear(1, 0);
            const v = m.transformPoint(new Vector2D(0, 1));
            assert.equal(v.x, 1);
            assert.equal(v.y, 1);
        });
    });

    describe('Matrix Operations', () => {
        it('should multiply matrices', () => {
            const t = Matrix3x3.translation(10, 0);
            const s = Matrix3x3.scale(2, 2);
            const combined = t.multiply(s);
            
            // Scale then translate
            const v = combined.transformPoint(new Vector2D(5, 5));
            assert.equal(v.x, 20); // 5 * 2 + 10
            assert.equal(v.y, 10); // 5 * 2
        });

        it('should calculate determinant', () => {
            const m = Matrix3x3.scale(2, 3);
            assert.equal(m.determinant(), 6);
        });

        it('should invert matrix', () => {
            const m = Matrix3x3.translation(10, 20);
            const inv = m.inverse();
            const v = inv.transformPoint(new Vector2D(10, 20));
            assert.approximately(v.x, 0, 0.0001);
            assert.approximately(v.y, 0, 0.0001);
        });

        it('should transpose matrix', () => {
            const m = new Matrix3x3([
                1, 2, 3,
                4, 5, 6,
                7, 8, 9
            ]);
            const t = m.transpose();
            assert.deepEqual(t.values, [
                1, 4, 7,
                2, 5, 8,
                3, 6, 9
            ]);
        });

        it('should clone matrix', () => {
            const m = Matrix3x3.translation(10, 20);
            const clone = m.clone();
            assert.deepEqual(m.values, clone.values);
            assert.notEqual(m, clone);
        });
    });

    describe('Transform Operations', () => {
        it('should transform point', () => {
            const m = Matrix3x3.translation(5, 10);
            const v = m.transformPoint(new Vector2D(3, 4));
            assert.equal(v.x, 8);
            assert.equal(v.y, 14);
        });

        it('should transform vector (no translation)', () => {
            const m = Matrix3x3.translation(5, 10);
            const v = m.transformVector(new Vector2D(3, 4));
            assert.equal(v.x, 3);
            assert.equal(v.y, 4);
        });

        it('should transform direction', () => {
            const m = Matrix3x3.rotation(Math.PI / 2);
            const v = m.transformDirection(new Vector2D(1, 0));
            assert.approximately(v.magnitude(), 1, 0.0001);
        });

        it('should decompose into translation, rotation, scale', () => {
            const t = Matrix3x3.translation(10, 20);
            const r = Matrix3x3.rotation(Math.PI / 4);
            const s = Matrix3x3.scale(2, 3);
            const combined = t.multiply(r).multiply(s);
            
            const { translation, rotation, scale } = combined.decompose();
            assert.approximately(translation.x, 10, 0.01);
            assert.approximately(translation.y, 20, 0.01);
            assert.approximately(rotation, Math.PI / 4, 0.01);
            assert.approximately(scale.x, 2, 0.01);
            assert.approximately(scale.y, 3, 0.01);
        });
    });

    describe('Rotation Around Point', () => {
        it('should rotate around arbitrary point', () => {
            const m = Matrix3x3.rotationAround(Math.PI, new Vector2D(5, 5));
            const v = m.transformPoint(new Vector2D(10, 5));
            assert.approximately(v.x, 0, 0.0001);
            assert.approximately(v.y, 5, 0.0001);
        });
    });
});

// ==========================================
// BEZIER CURVE TESTS
// ==========================================

describe('QuadraticBezier', () => {
    let curve;

    beforeEach(() => {
        curve = new QuadraticBezier(
            new Vector2D(0, 0),
            new Vector2D(50, 100),
            new Vector2D(100, 0)
        );
    });

    describe('Point Calculation', () => {
        it('should return start point at t=0', () => {
            const p = curve.pointAt(0);
            assert.equal(p.x, 0);
            assert.equal(p.y, 0);
        });

        it('should return end point at t=1', () => {
            const p = curve.pointAt(1);
            assert.equal(p.x, 100);
            assert.equal(p.y, 0);
        });

        it('should return midpoint at t=0.5', () => {
            const p = curve.pointAt(0.5);
            assert.equal(p.x, 50);
            assert.equal(p.y, 50); // Quadratic goes through this point
        });
    });

    describe('Derivative', () => {
        it('should calculate derivative at t=0', () => {
            const d = curve.derivativeAt(0);
            assert.equal(d.x, 100);
            assert.equal(d.y, 200);
        });

        it('should calculate derivative at t=1', () => {
            const d = curve.derivativeAt(1);
            assert.equal(d.x, 100);
            assert.equal(d.y, -200);
        });
    });

    describe('Curve Properties', () => {
        it('should calculate length', () => {
            const length = curve.length();
            assert.greaterThan(length, 100);
            assert.lessThan(length, 250);
        });

        it('should calculate bounding box', () => {
            const bbox = curve.boundingBox();
            assert.equal(bbox.min.x, 0);
            assert.equal(bbox.max.x, 100);
            assert.equal(bbox.min.y, 0);
            assert.equal(bbox.max.y, 50); // Peak of quadratic
        });

        it('should split curve', () => {
            const [left, right] = curve.split(0.5);
            
            // Left curve should end at split point
            const leftEnd = left.pointAt(1);
            const mid = curve.pointAt(0.5);
            assert.approximately(leftEnd.x, mid.x, 0.0001);
            assert.approximately(leftEnd.y, mid.y, 0.0001);
            
            // Right curve should start at split point
            const rightStart = right.pointAt(0);
            assert.approximately(rightStart.x, mid.x, 0.0001);
            assert.approximately(rightStart.y, mid.y, 0.0001);
        });
    });

    describe('Closest Point', () => {
        it('should find closest point on curve', () => {
            const point = new Vector2D(50, 0);
            const { t, point: closest, distance } = curve.closestPoint(point);
            
            assert.approximately(t, 0.5, 0.1);
            assert.approximately(closest.x, 50, 1);
            assert.approximately(closest.y, 50, 1);
            assert.approximately(distance, 50, 1);
        });
    });
});

describe('CubicBezier', () => {
    let curve;

    beforeEach(() => {
        curve = new CubicBezier(
            new Vector2D(0, 0),
            new Vector2D(33, 100),
            new Vector2D(66, 100),
            new Vector2D(100, 0)
        );
    });

    describe('Point Calculation', () => {
        it('should return start point at t=0', () => {
            const p = curve.pointAt(0);
            assert.equal(p.x, 0);
            assert.equal(p.y, 0);
        });

        it('should return end point at t=1', () => {
            const p = curve.pointAt(1);
            assert.equal(p.x, 100);
            assert.equal(p.y, 0);
        });

        it('should interpolate smoothly', () => {
            const p = curve.pointAt(0.5);
            assert.equal(p.x, 50);
            // Y will be influenced by control points
            assert.greaterThan(p.y, 0);
        });
    });

    describe('Curve Properties', () => {
        it('should calculate length', () => {
            const length = curve.length();
            assert.greaterThan(length, 100);
            assert.lessThan(length, 300);
        });

        it('should calculate bounding box', () => {
            const bbox = curve.boundingBox();
            assert.equal(bbox.min.x, 0);
            assert.equal(bbox.max.x, 100);
            assert.equal(bbox.min.y, 0);
        });

        it('should flatten to polyline', () => {
            const points = curve.flatten(1);
            assert.greaterThan(points.length, 2);
            
            // First point should be start
            assert.approximately(points[0].x, 0, 0.01);
            assert.approximately(points[0].y, 0, 0.01);
            
            // Last point should be end
            const last = points[points.length - 1];
            assert.approximately(last.x, 100, 0.01);
            assert.approximately(last.y, 0, 0.01);
        });
    });

    describe('Curvature', () => {
        it('should calculate curvature at midpoint', () => {
            const k = curve.curvatureAt(0.5);
            assert.typeOf(k, 'number');
        });
    });
});

describe('BezierUtils', () => {
    describe('Fit Curve', () => {
        it('should fit curve through points', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(25, 50),
                new Vector2D(50, 75),
                new Vector2D(75, 50),
                new Vector2D(100, 0)
            ];
            
            const curves = BezierUtils.fitCurve(points, 5);
            assert.ok(curves.length > 0);
        });
    });

    describe('Simplify Path', () => {
        it('should simplify path with redundant points', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(10, 0),
                new Vector2D(20, 0),
                new Vector2D(30, 0),
                new Vector2D(100, 0)
            ];
            
            const simplified = BezierUtils.simplifyPath(points, 1);
            assert.lessThan(simplified.length, points.length);
        });
    });
});

// ==========================================
// GEOMETRY TESTS
// ==========================================

describe('Geometry', () => {
    describe('Line Intersection', () => {
        it('should find intersection of crossing lines', () => {
            const p = lineIntersection(
                new Vector2D(0, 0),
                new Vector2D(10, 10),
                new Vector2D(0, 10),
                new Vector2D(10, 0)
            );
            
            assert.isNotNull(p);
            assert.approximately(p.x, 5, 0.0001);
            assert.approximately(p.y, 5, 0.0001);
        });

        it('should return null for parallel lines', () => {
            const p = lineIntersection(
                new Vector2D(0, 0),
                new Vector2D(10, 0),
                new Vector2D(0, 10),
                new Vector2D(10, 10)
            );
            
            assert.isNull(p);
        });

        it('should handle vertical lines', () => {
            const p = lineIntersection(
                new Vector2D(5, 0),
                new Vector2D(5, 10),
                new Vector2D(0, 5),
                new Vector2D(10, 5)
            );
            
            assert.isNotNull(p);
            assert.approximately(p.x, 5, 0.0001);
            assert.approximately(p.y, 5, 0.0001);
        });
    });

    describe('Point in Polygon', () => {
        let square;

        beforeEach(() => {
            square = [
                new Vector2D(0, 0),
                new Vector2D(10, 0),
                new Vector2D(10, 10),
                new Vector2D(0, 10)
            ];
        });

        it('should detect point inside polygon', () => {
            assert.ok(pointInPolygon(new Vector2D(5, 5), square));
        });

        it('should detect point outside polygon', () => {
            assert.ok(!pointInPolygon(new Vector2D(15, 5), square));
        });

        it('should handle concave polygons', () => {
            const concave = [
                new Vector2D(0, 0),
                new Vector2D(10, 0),
                new Vector2D(10, 10),
                new Vector2D(5, 5),
                new Vector2D(0, 10)
            ];
            
            assert.ok(!pointInPolygon(new Vector2D(8, 8), concave));
        });
    });

    describe('Polygon Area', () => {
        it('should calculate area of square', () => {
            const square = [
                new Vector2D(0, 0),
                new Vector2D(10, 0),
                new Vector2D(10, 10),
                new Vector2D(0, 10)
            ];
            
            assert.approximately(Math.abs(polygonArea(square)), 100, 0.0001);
        });

        it('should calculate area of triangle', () => {
            const triangle = [
                new Vector2D(0, 0),
                new Vector2D(10, 0),
                new Vector2D(5, 10)
            ];
            
            assert.approximately(Math.abs(polygonArea(triangle)), 50, 0.0001);
        });
    });

    describe('Convex Hull', () => {
        it('should compute convex hull', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(10, 0),
                new Vector2D(10, 10),
                new Vector2D(0, 10),
                new Vector2D(5, 5) // Interior point
            ];
            
            const hull = convexHull(points);
            assert.lengthOf(hull, 4);
        });

        it('should handle collinear points', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(5, 0),
                new Vector2D(10, 0),
                new Vector2D(10, 10),
                new Vector2D(0, 10)
            ];
            
            const hull = convexHull(points);
            assert.ok(hull.length >= 4);
        });
    });

    describe('Distance to Line', () => {
        it('should calculate perpendicular distance', () => {
            const d = distanceToLine(
                new Vector2D(5, 5),
                new Vector2D(0, 0),
                new Vector2D(10, 0)
            );
            
            assert.approximately(d, 5, 0.0001);
        });

        it('should handle point on line', () => {
            const d = distanceToLine(
                new Vector2D(5, 0),
                new Vector2D(0, 0),
                new Vector2D(10, 0)
            );
            
            assert.approximately(d, 0, 0.0001);
        });
    });

    describe('Nearest Point on Line', () => {
        it('should find nearest point', () => {
            const p = nearestPointOnLine(
                new Vector2D(5, 5),
                new Vector2D(0, 0),
                new Vector2D(10, 0)
            );
            
            assert.approximately(p.x, 5, 0.0001);
            assert.approximately(p.y, 0, 0.0001);
        });

        it('should clamp to line segment ends', () => {
            const p = nearestPointOnLine(
                new Vector2D(-5, 0),
                new Vector2D(0, 0),
                new Vector2D(10, 0),
                true // clamp to segment
            );
            
            assert.approximately(p.x, 0, 0.0001);
            assert.approximately(p.y, 0, 0.0001);
        });
    });
});
