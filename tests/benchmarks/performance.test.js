/**
 * Asciistrator - Performance Benchmarks
 * 
 * Benchmarks for rendering, object operations, and memory usage.
 */

import { describe, it, beforeEach, assert } from '../framework.js';
import { Vector2D } from '../../scripts/core/math.js';
import { Document } from '../../scripts/core/Document.js';
import { Layer } from '../../scripts/core/Layer.js';
import { Rectangle } from '../../scripts/objects/Rectangle.js';
import { Ellipse } from '../../scripts/objects/Ellipse.js';
import { Polygon } from '../../scripts/objects/Polygon.js';
import { Path } from '../../scripts/objects/path.js';
import { Group } from '../../scripts/objects/group.js';

// ==========================================
// BENCHMARK UTILITIES
// ==========================================

/**
 * Run benchmark
 */
function benchmark(name, fn, iterations = 1000) {
    // Warmup
    for (let i = 0; i < 10; i++) {
        fn();
    }

    // Measure
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = performance.now();

    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    const opsPerSecond = 1000 / avgTime;

    return {
        name,
        iterations,
        totalTime,
        avgTime,
        opsPerSecond
    };
}

/**
 * Report benchmark results
 */
function reportBenchmark(result) {
    console.log(`
📊 ${result.name}
   Iterations: ${result.iterations}
   Total Time: ${result.totalTime.toFixed(2)}ms
   Avg Time: ${result.avgTime.toFixed(4)}ms
   Ops/Second: ${result.opsPerSecond.toFixed(0)}
    `);
}

// ==========================================
// VECTOR PERFORMANCE BENCHMARKS
// ==========================================

describe('Vector Performance', () => {
    describe('Basic Operations', () => {
        it('should benchmark vector addition', () => {
            const v1 = new Vector2D(100, 200);
            const v2 = new Vector2D(50, 75);
            
            const result = benchmark('Vector Addition', () => {
                v1.add(v2);
            }, 100000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.01, 'Vector addition should be < 0.01ms');
        });

        it('should benchmark vector normalization', () => {
            const v = new Vector2D(100, 200);
            
            const result = benchmark('Vector Normalization', () => {
                v.normalize();
            }, 100000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.01, 'Normalization should be < 0.01ms');
        });

        it('should benchmark dot product', () => {
            const v1 = new Vector2D(100, 200);
            const v2 = new Vector2D(50, 75);
            
            const result = benchmark('Dot Product', () => {
                v1.dot(v2);
            }, 100000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.001, 'Dot product should be < 0.001ms');
        });
    });
});

// ==========================================
// OBJECT CREATION BENCHMARKS
// ==========================================

describe('Object Creation Performance', () => {
    describe('Shape Creation', () => {
        it('should benchmark rectangle creation', () => {
            const result = benchmark('Rectangle Creation', () => {
                new Rectangle({ x: 100, y: 100, width: 50, height: 50 });
            }, 10000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.1, 'Rectangle creation should be < 0.1ms');
        });

        it('should benchmark ellipse creation', () => {
            const result = benchmark('Ellipse Creation', () => {
                new Ellipse({ x: 100, y: 100, radiusX: 50, radiusY: 30 });
            }, 10000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.1, 'Ellipse creation should be < 0.1ms');
        });

        it('should benchmark polygon creation', () => {
            const points = [
                new Vector2D(0, 0),
                new Vector2D(100, 0),
                new Vector2D(100, 100),
                new Vector2D(50, 150),
                new Vector2D(0, 100)
            ];
            
            const result = benchmark('Polygon Creation', () => {
                new Polygon({ points });
            }, 10000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.2, 'Polygon creation should be < 0.2ms');
        });

        it('should benchmark complex path creation', () => {
            const result = benchmark('Path Creation', () => {
                const path = new Path();
                path.moveTo(0, 0);
                path.lineTo(100, 0);
                path.cubicTo(150, 0, 150, 50, 150, 100);
                path.lineTo(50, 100);
                path.quadraticTo(0, 100, 0, 50);
                path.close();
            }, 10000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.5, 'Path creation should be < 0.5ms');
        });
    });
});

// ==========================================
// HIT TESTING BENCHMARKS
// ==========================================

describe('Hit Testing Performance', () => {
    let rectangles;
    let ellipses;
    let polygons;

    beforeEach(() => {
        // Create test objects
        rectangles = [];
        ellipses = [];
        polygons = [];
        
        for (let i = 0; i < 100; i++) {
            rectangles.push(new Rectangle({
                x: Math.random() * 1000,
                y: Math.random() * 1000,
                width: 50 + Math.random() * 50,
                height: 50 + Math.random() * 50
            }));
            
            ellipses.push(new Ellipse({
                x: Math.random() * 1000,
                y: Math.random() * 1000,
                radiusX: 25 + Math.random() * 25,
                radiusY: 25 + Math.random() * 25
            }));
            
            polygons.push(Polygon.createRegular(
                5 + Math.floor(Math.random() * 5),
                30 + Math.random() * 20
            ));
        }
    });

    describe('Rectangle Hit Test', () => {
        it('should benchmark single rectangle hit test', () => {
            const rect = rectangles[0];
            const point = new Vector2D(rect.x + 25, rect.y + 25);
            
            const result = benchmark('Rectangle Hit Test', () => {
                rect.containsPoint(point);
            }, 100000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.001, 'Rectangle hit test should be < 0.001ms');
        });

        it('should benchmark 100 rectangle hit tests', () => {
            const point = new Vector2D(500, 500);
            
            const result = benchmark('100 Rectangle Hit Tests', () => {
                rectangles.forEach(rect => rect.containsPoint(point));
            }, 1000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.5, '100 hit tests should be < 0.5ms');
        });
    });

    describe('Ellipse Hit Test', () => {
        it('should benchmark ellipse hit test', () => {
            const ellipse = ellipses[0];
            const point = new Vector2D(ellipse.x, ellipse.y);
            
            const result = benchmark('Ellipse Hit Test', () => {
                ellipse.containsPoint(point);
            }, 100000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.01, 'Ellipse hit test should be < 0.01ms');
        });
    });

    describe('Polygon Hit Test', () => {
        it('should benchmark polygon hit test', () => {
            const polygon = polygons[0];
            const centroid = polygon.getCentroid();
            
            const result = benchmark('Polygon Hit Test', () => {
                polygon.containsPoint(centroid);
            }, 10000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.1, 'Polygon hit test should be < 0.1ms');
        });
    });
});

// ==========================================
// BOUNDS CALCULATION BENCHMARKS
// ==========================================

describe('Bounds Calculation Performance', () => {
    describe('Simple Bounds', () => {
        it('should benchmark rectangle bounds', () => {
            const rect = new Rectangle({ x: 100, y: 100, width: 200, height: 150 });
            
            const result = benchmark('Rectangle Bounds', () => {
                rect.getBounds();
            }, 100000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.001, 'Rectangle bounds should be < 0.001ms');
        });
    });

    describe('Complex Bounds', () => {
        it('should benchmark path bounds', () => {
            const path = new Path();
            path.moveTo(0, 0);
            path.cubicTo(50, 100, 100, 100, 150, 0);
            path.cubicTo(200, -100, 250, -100, 300, 0);
            
            const result = benchmark('Path Bounds', () => {
                path.getBounds();
            }, 10000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.5, 'Path bounds should be < 0.5ms');
        });

        it('should benchmark group bounds', () => {
            const children = [];
            for (let i = 0; i < 50; i++) {
                children.push(new Rectangle({
                    x: Math.random() * 500,
                    y: Math.random() * 500,
                    width: 50,
                    height: 50
                }));
            }
            const group = new Group({ children });
            
            const result = benchmark('Group Bounds (50 children)', () => {
                group.getBounds();
            }, 1000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 1, 'Group bounds should be < 1ms');
        });
    });
});

// ==========================================
// DOCUMENT PERFORMANCE BENCHMARKS
// ==========================================

describe('Document Performance', () => {
    describe('Serialization', () => {
        it('should benchmark document serialization', () => {
            const doc = new Document({ width: 1920, height: 1080 });
            
            // Add 100 objects
            for (let i = 0; i < 100; i++) {
                doc.activeLayer.addObject(new Rectangle({
                    x: Math.random() * 1000,
                    y: Math.random() * 1000,
                    width: 50,
                    height: 50
                }));
            }
            
            const result = benchmark('Document Serialize (100 objects)', () => {
                doc.toJSON();
            }, 100);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 10, 'Serialization should be < 10ms');
        });

        it('should benchmark document deserialization', () => {
            const doc = new Document({ width: 1920, height: 1080 });
            for (let i = 0; i < 100; i++) {
                doc.activeLayer.addObject(new Rectangle({
                    x: Math.random() * 1000,
                    y: Math.random() * 1000,
                    width: 50,
                    height: 50
                }));
            }
            const json = doc.toJSON();
            
            const result = benchmark('Document Deserialize (100 objects)', () => {
                Document.fromJSON(json);
            }, 100);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 20, 'Deserialization should be < 20ms');
        });
    });

    describe('Layer Operations', () => {
        it('should benchmark object addition', () => {
            const layer = new Layer({ name: 'Test' });
            
            const result = benchmark('Object Addition', () => {
                const rect = new Rectangle({ width: 50, height: 50 });
                layer.addObject(rect);
            }, 10000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.1, 'Object addition should be < 0.1ms');
            
            // Cleanup
            layer.objects = [];
        });

        it('should benchmark object lookup by ID', () => {
            const layer = new Layer({ name: 'Test' });
            const objects = [];
            
            for (let i = 0; i < 1000; i++) {
                const rect = new Rectangle({ width: 50, height: 50 });
                layer.addObject(rect);
                objects.push(rect);
            }
            
            const targetId = objects[500].id;
            
            const result = benchmark('Object Lookup by ID (1000 objects)', () => {
                layer.getObjectById(targetId);
            }, 10000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.5, 'Object lookup should be < 0.5ms');
        });
    });
});

// ==========================================
// TRANSFORM BENCHMARKS
// ==========================================

describe('Transform Performance', () => {
    describe('Matrix Operations', () => {
        it('should benchmark transform matrix creation', () => {
            const obj = new Rectangle({ 
                x: 100, y: 100, 
                rotation: 0.5, 
                scaleX: 2, scaleY: 1.5 
            });
            
            const result = benchmark('Transform Matrix Creation', () => {
                obj.getTransform();
            }, 100000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.01, 'Matrix creation should be < 0.01ms');
        });

        it('should benchmark global transform', () => {
            const grandparent = new Group({ x: 100, y: 100, rotation: 0.1 });
            const parent = new Group({ x: 50, y: 50, rotation: 0.2 });
            const child = new Rectangle({ x: 25, y: 25, rotation: 0.3 });
            
            grandparent.addChild(parent);
            parent.addChild(child);
            
            const result = benchmark('Global Transform (3 levels)', () => {
                child.getGlobalTransform();
            }, 10000);
            
            reportBenchmark(result);
            assert.lessThan(result.avgTime, 0.1, 'Global transform should be < 0.1ms');
        });
    });
});

// ==========================================
// MEMORY BENCHMARKS
// ==========================================

describe('Memory Usage', () => {
    describe('Object Memory', () => {
        it('should test memory for 10000 rectangles', () => {
            const before = performance.memory?.usedJSHeapSize || 0;
            
            const objects = [];
            for (let i = 0; i < 10000; i++) {
                objects.push(new Rectangle({
                    x: Math.random() * 10000,
                    y: Math.random() * 10000,
                    width: 50,
                    height: 50
                }));
            }
            
            const after = performance.memory?.usedJSHeapSize || 0;
            const used = (after - before) / 1024 / 1024;
            
            console.log(`
📊 Memory for 10000 Rectangles
   Memory Used: ${used.toFixed(2)} MB
   Per Object: ${((after - before) / 10000).toFixed(0)} bytes
            `);
            
            // Cleanup
            objects.length = 0;
            
            // Memory test - 10000 objects should use < 50MB
            if (performance.memory) {
                assert.lessThan(used, 50, '10000 objects should use < 50MB');
            }
        });
    });

    describe('Document Memory', () => {
        it('should test memory for large document', () => {
            const before = performance.memory?.usedJSHeapSize || 0;
            
            const doc = new Document({ width: 4000, height: 4000 });
            
            // Add 10 layers with 500 objects each
            for (let l = 0; l < 10; l++) {
                const layer = new Layer({ name: `Layer ${l}` });
                for (let i = 0; i < 500; i++) {
                    layer.addObject(new Rectangle({
                        x: Math.random() * 4000,
                        y: Math.random() * 4000,
                        width: 50,
                        height: 50
                    }));
                }
                doc.addLayer(layer);
            }
            
            const after = performance.memory?.usedJSHeapSize || 0;
            const used = (after - before) / 1024 / 1024;
            
            console.log(`
📊 Large Document Memory (10 layers × 500 objects)
   Total Objects: 5000
   Memory Used: ${used.toFixed(2)} MB
            `);
            
            // Should use less than 100MB
            if (performance.memory) {
                assert.lessThan(used, 100, 'Large document should use < 100MB');
            }
        });
    });
});

// ==========================================
// RENDER TIME SIMULATION BENCHMARKS
// ==========================================

describe('Render Time Targets', () => {
    describe('Frame Budget', () => {
        it('should complete operations within 16ms frame budget', () => {
            const doc = new Document({ width: 1920, height: 1080 });
            
            // Add 200 objects
            for (let i = 0; i < 200; i++) {
                doc.activeLayer.addObject(new Rectangle({
                    x: Math.random() * 1920,
                    y: Math.random() * 1080,
                    width: 50 + Math.random() * 100,
                    height: 50 + Math.random() * 100
                }));
            }
            
            // Simulate render operations
            const start = performance.now();
            
            // Get all bounds
            doc.layers.forEach(layer => {
                layer.objects.forEach(obj => {
                    obj.getBounds();
                    obj.getTransform();
                });
            });
            
            const elapsed = performance.now() - start;
            
            console.log(`
📊 Frame Budget Test (200 objects)
   Operations Time: ${elapsed.toFixed(2)}ms
   Budget Remaining: ${(16 - elapsed).toFixed(2)}ms
   Status: ${elapsed < 16 ? '✅ Within budget' : '❌ Over budget'}
            `);
            
            assert.lessThan(elapsed, 16, 'Operations should complete within 16ms frame');
        });
    });

    describe('Startup Time', () => {
        it('should initialize within 2 seconds', () => {
            const start = performance.now();
            
            // Simulate initialization
            const doc = new Document({ width: 1920, height: 1080 });
            
            // Initialize multiple layers
            for (let i = 0; i < 5; i++) {
                doc.addLayer(new Layer({ name: `Layer ${i}` }));
            }
            
            // Pre-create some objects
            for (let i = 0; i < 100; i++) {
                doc.activeLayer.addObject(new Rectangle({
                    width: 100,
                    height: 100
                }));
            }
            
            const elapsed = performance.now() - start;
            
            console.log(`
📊 Startup Time
   Initialization: ${elapsed.toFixed(2)}ms
   Target: < 2000ms
   Status: ${elapsed < 2000 ? '✅ Pass' : '❌ Fail'}
            `);
            
            assert.lessThan(elapsed, 2000, 'Startup should complete within 2 seconds');
        });
    });
});

// ==========================================
// BENCHMARK SUMMARY
// ==========================================

describe('Performance Summary', () => {
    it('should display all performance targets', () => {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    PERFORMANCE TARGETS                        ║
╠══════════════════════════════════════════════════════════════╣
║  Target                          │ Requirement               ║
╠══════════════════════════════════╪═══════════════════════════╣
║  Frame render time               │ < 16ms (60 FPS)           ║
║  Application startup             │ < 2 seconds               ║
║  Memory usage                    │ < 500MB                   ║
║  Object hit test                 │ < 0.01ms                  ║
║  Bounds calculation              │ < 0.1ms                   ║
║  Document serialization          │ < 100ms                   ║
║  Object creation                 │ < 0.1ms                   ║
╚══════════════════════════════════════════════════════════════╝
        `);
        
        assert.ok(true);
    });
});
