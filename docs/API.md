# Asciistrator API Documentation

## Table of Contents

1. [Core Modules](#core-modules)
   - [Math](#math)
   - [Canvas](#canvas)
   - [ASCII](#ascii)
   - [Document](#document)
   - [Rendering](#rendering)
   - [Performance](#performance)
2. [Objects](#objects)
3. [Tools](#tools)
4. [Charts](#charts)
5. [Flowchart](#flowchart)
6. [UI Components](#ui-components)
7. [I/O Operations](#io-operations)
8. [Utilities](#utilities)

---

## Core Modules

### Math

Location: `scripts/core/math/`

#### Vector2D

2D vector mathematics class.

```javascript
import { Vector2D } from './scripts/core/math/vector2d.js';

// Create vectors
const v1 = new Vector2D(10, 20);
const v2 = Vector2D.fromAngle(Math.PI / 4, 100);

// Operations
const sum = v1.add(v2);           // Vector addition
const diff = v1.subtract(v2);     // Vector subtraction
const scaled = v1.multiply(2);    // Scalar multiplication
const normalized = v1.normalize(); // Unit vector
const length = v1.magnitude();    // Vector length
const dot = v1.dot(v2);           // Dot product
const cross = v1.cross(v2);       // Cross product (scalar)
const angle = v1.angle();         // Angle in radians
const distance = v1.distanceTo(v2); // Distance between vectors
```

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `x` | number | X component |
| `y` | number | Y component |

**Methods:**
| Method | Returns | Description |
|--------|---------|-------------|
| `add(v)` | Vector2D | Add another vector |
| `subtract(v)` | Vector2D | Subtract another vector |
| `multiply(s)` | Vector2D | Multiply by scalar |
| `divide(s)` | Vector2D | Divide by scalar |
| `dot(v)` | number | Dot product |
| `cross(v)` | number | Cross product (2D scalar) |
| `magnitude()` | number | Vector length |
| `normalize()` | Vector2D | Unit vector |
| `angle()` | number | Angle in radians |
| `rotate(angle)` | Vector2D | Rotate by angle |
| `lerp(v, t)` | Vector2D | Linear interpolation |
| `distanceTo(v)` | number | Distance to another vector |
| `clone()` | Vector2D | Create copy |
| `equals(v)` | boolean | Equality check |

**Static Methods:**
| Method | Returns | Description |
|--------|---------|-------------|
| `fromAngle(angle, length)` | Vector2D | Create from polar coordinates |
| `zero()` | Vector2D | Zero vector (0, 0) |
| `one()` | Vector2D | Unit vector (1, 1) |
| `up()` | Vector2D | Up vector (0, -1) |
| `down()` | Vector2D | Down vector (0, 1) |
| `left()` | Vector2D | Left vector (-1, 0) |
| `right()` | Vector2D | Right vector (1, 0) |

---

#### Matrix3x3

3x3 transformation matrix for 2D affine transformations.

```javascript
import { Matrix3x3 } from './scripts/core/math/matrix3x3.js';

// Create matrices
const identity = Matrix3x3.identity();
const translation = Matrix3x3.translation(100, 50);
const rotation = Matrix3x3.rotation(Math.PI / 4);
const scale = Matrix3x3.scale(2, 2);

// Combine transformations
const transform = translation.multiply(rotation).multiply(scale);

// Apply to point
const point = new Vector2D(10, 20);
const transformed = transform.transformPoint(point);

// Inverse
const inverse = transform.inverse();
```

**Static Creation Methods:**
| Method | Returns | Description |
|--------|---------|-------------|
| `identity()` | Matrix3x3 | Identity matrix |
| `translation(tx, ty)` | Matrix3x3 | Translation matrix |
| `rotation(angle)` | Matrix3x3 | Rotation matrix (radians) |
| `rotationDegrees(angle)` | Matrix3x3 | Rotation matrix (degrees) |
| `scale(sx, sy)` | Matrix3x3 | Scale matrix |
| `skew(sx, sy)` | Matrix3x3 | Skew/shear matrix |

**Methods:**
| Method | Returns | Description |
|--------|---------|-------------|
| `multiply(m)` | Matrix3x3 | Matrix multiplication |
| `transformPoint(v)` | Vector2D | Transform a point |
| `transformVector(v)` | Vector2D | Transform a vector (no translation) |
| `inverse()` | Matrix3x3 | Inverse matrix |
| `determinant()` | number | Matrix determinant |
| `transpose()` | Matrix3x3 | Transposed matrix |
| `decompose()` | object | Extract translation, rotation, scale |
| `toArray()` | number[] | Convert to flat array |
| `clone()` | Matrix3x3 | Create copy |

---

#### Bezier

Bezier curve calculations.

```javascript
import { Bezier } from './scripts/core/math/bezier.js';

// Cubic bezier
const cubic = new Bezier.Cubic(p0, p1, p2, p3);
const point = cubic.pointAt(0.5);     // Point at t=0.5
const tangent = cubic.tangentAt(0.5); // Tangent at t=0.5
const length = cubic.length();        // Approximate length
const bbox = cubic.boundingBox();     // Bounding box
const split = cubic.split(0.5);       // Split at t=0.5

// Quadratic bezier
const quad = new Bezier.Quadratic(p0, p1, p2);

// Utilities
const closest = Bezier.closestPoint(curve, point);
const intersections = Bezier.lineIntersection(curve, lineStart, lineEnd);
```

**Cubic Bezier Methods:**
| Method | Returns | Description |
|--------|---------|-------------|
| `pointAt(t)` | Vector2D | Point at parameter t |
| `tangentAt(t)` | Vector2D | Tangent vector at t |
| `normalAt(t)` | Vector2D | Normal vector at t |
| `split(t)` | [Cubic, Cubic] | Split curve at t |
| `length(steps)` | number | Approximate arc length |
| `boundingBox()` | object | Axis-aligned bounding box |
| `flatten(tolerance)` | Vector2D[] | Convert to line segments |

---

#### Geometry

Geometric utility functions.

```javascript
import { Geometry } from './scripts/core/math/geometry.js';

// Point tests
Geometry.pointInPolygon(point, polygon);
Geometry.pointInRect(point, rect);
Geometry.pointInCircle(point, center, radius);
Geometry.pointOnLine(point, lineStart, lineEnd, tolerance);

// Intersections
Geometry.lineIntersection(a1, a2, b1, b2);
Geometry.rectIntersection(rect1, rect2);
Geometry.circleIntersection(c1, r1, c2, r2);

// Distance
Geometry.pointToLineDistance(point, lineStart, lineEnd);
Geometry.pointToSegmentDistance(point, segStart, segEnd);

// Angles
Geometry.angleBetween(v1, v2);
Geometry.normalizeAngle(angle);

// Polygons
Geometry.polygonArea(points);
Geometry.polygonCentroid(points);
Geometry.convexHull(points);
Geometry.isConvex(points);
```

---

### Canvas

Location: `scripts/core/canvas/`

#### Viewport

Manages view transformation and pan/zoom.

```javascript
import { Viewport } from './scripts/core/canvas/viewport.js';

const viewport = new Viewport({
    width: 800,
    height: 600,
    minZoom: 0.1,
    maxZoom: 10
});

// Pan and zoom
viewport.pan(100, 50);
viewport.zoom(1.5);
viewport.zoomToPoint(2.0, mouseX, mouseY);
viewport.zoomToFit(bounds);
viewport.reset();

// Coordinate conversion
const world = viewport.screenToWorld(screenX, screenY);
const screen = viewport.worldToScreen(worldX, worldY);

// Properties
const { x, y, zoom, width, height } = viewport;
```

**Events:**
| Event | Data | Description |
|-------|------|-------------|
| `change` | viewport | View changed |
| `zoom` | { zoom, center } | Zoom changed |
| `pan` | { x, y } | Position changed |

---

#### Grid

Configurable grid system.

```javascript
import { Grid } from './scripts/core/canvas/grid.js';

const grid = new Grid({
    cellWidth: 1,
    cellHeight: 1,
    majorInterval: 10,
    showMinor: true,
    snap: true
});

// Snapping
const snapped = grid.snapPoint(x, y);
const snappedX = grid.snapX(x);
const snappedY = grid.snapY(y);

// Rendering
grid.render(ctx, viewport);

// Properties
grid.visible = true;
grid.snapEnabled = true;
grid.cellWidth = 2;
```

---

### ASCII

Location: `scripts/core/ascii/`

#### Rasterizer

Converts vector graphics to ASCII.

```javascript
import { Rasterizer } from './scripts/core/ascii/rasterizer.js';

const rasterizer = new Rasterizer({
    charset: 'standard',
    width: 80,
    height: 40
});

// Rasterize objects
rasterizer.rasterize(objects);
const output = rasterizer.toString();
const grid = rasterizer.getGrid();

// Draw primitives
rasterizer.drawLine(x1, y1, x2, y2, char);
rasterizer.drawRect(x, y, w, h, style);
rasterizer.drawEllipse(cx, cy, rx, ry);
rasterizer.fillRect(x, y, w, h, char);
rasterizer.drawText(x, y, text);
```

---

#### CharSets

Character set definitions.

```javascript
import { CharSets } from './scripts/core/ascii/charsets.js';

// Built-in sets
CharSets.minimal;    // .' `:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$
CharSets.standard;   // Extended ASCII
CharSets.blocks;     // ░▒▓█▄▀
CharSets.boxDrawing; // ─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬
CharSets.arrows;     // ←↑→↓↔↕↖↗↘↙

// Get character by density
const char = CharSets.getByDensity('standard', 0.5);

// Box drawing helpers
CharSets.BoxDrawing.horizontal;     // ─
CharSets.BoxDrawing.vertical;       // │
CharSets.BoxDrawing.topLeft;        // ┌
CharSets.BoxDrawing.topRight;       // ┐
CharSets.BoxDrawing.bottomLeft;     // └
CharSets.BoxDrawing.bottomRight;    // ┘
```

---

#### Dither

Dithering algorithms for ASCII.

```javascript
import { Dither } from './scripts/core/ascii/dither.js';

// Apply dithering to grayscale values
const dithered = Dither.floydSteinberg(values, width, height);
const ordered = Dither.ordered(values, width, height);
const random = Dither.random(values, width, height);

// Convert to characters
const ascii = Dither.toAscii(dithered, charset);
```

---

### Document

Location: `scripts/core/document/`

#### Document

Main document class.

```javascript
import { Document } from './scripts/core/document/document.js';

const doc = new Document({
    width: 120,
    height: 80,
    name: 'Untitled'
});

// Layer management
const layer = doc.createLayer('Background');
doc.deleteLayer(layer.id);
doc.moveLayer(layer.id, newIndex);
doc.setActiveLayer(layer.id);

// Object management
const rect = doc.createRectangle({ x: 10, y: 5, width: 20, height: 10 });
doc.deleteObject(rect.id);
const objects = doc.getObjects();
const selected = doc.getSelectedObjects();

// Selection
doc.select(object);
doc.selectAll();
doc.deselectAll();
doc.addToSelection(object);
doc.removeFromSelection(object);

// History
doc.undo();
doc.redo();
doc.canUndo;
doc.canRedo;

// Serialization
const json = doc.toJSON();
Document.fromJSON(json);
```

**Events:**
| Event | Data | Description |
|-------|------|-------------|
| `change` | document | Document changed |
| `selection-change` | selection | Selection changed |
| `layer-change` | layers | Layers changed |
| `object-add` | object | Object added |
| `object-remove` | object | Object removed |

---

#### Layer

Layer management.

```javascript
import { Layer } from './scripts/core/document/layer.js';

const layer = new Layer({
    name: 'Layer 1',
    visible: true,
    locked: false,
    opacity: 1.0
});

// Properties
layer.name = 'Background';
layer.visible = false;
layer.locked = true;
layer.opacity = 0.5;

// Objects
layer.addObject(object);
layer.removeObject(object.id);
const objects = layer.getObjects();
const object = layer.getObjectById(id);
```

---

#### History

Undo/redo history management.

```javascript
import { History } from './scripts/core/document/history.js';

const history = new History({
    maxStates: 100
});

// Record changes
history.push({
    type: 'create',
    target: object,
    before: null,
    after: object.clone()
});

// Navigation
history.undo();
history.redo();
history.jumpTo(index);
history.clear();

// State
const canUndo = history.canUndo;
const canRedo = history.canRedo;
const states = history.getStates();
const currentIndex = history.currentIndex;
```

---

### Rendering

Location: `scripts/core/rendering/`

#### Renderer

Main rendering engine.

```javascript
import { Renderer } from './scripts/core/rendering/renderer.js';

const renderer = new Renderer({
    container: document.getElementById('canvas'),
    width: 800,
    height: 600
});

// Render
renderer.render(document);
renderer.requestRender(); // Batched render

// Settings
renderer.setTheme('dark');
renderer.setCharset('standard');
renderer.showGrid = true;
renderer.showRulers = true;

// Export
const ascii = renderer.toAscii();
const html = renderer.toHtml();
```

---

### Performance

Location: `scripts/core/performance/`

#### ObjectPool

Generic object pooling.

```javascript
import { ObjectPool } from './scripts/core/performance/index.js';

const pool = new ObjectPool(
    () => new Vector2D(0, 0),  // Factory
    (v) => { v.x = 0; v.y = 0; }, // Reset
    100 // Initial size
);

const vector = pool.acquire();
// Use vector...
pool.release(vector);

// Stats
const stats = pool.getStats();
```

---

#### QuadTree

Spatial indexing.

```javascript
import { QuadTree } from './scripts/core/performance/index.js';

const tree = new QuadTree({
    x: 0, y: 0,
    width: 1000, height: 1000
}, 10, 5); // maxObjects, maxLevels

// Add objects
tree.insert({ id: 1, bounds: { x: 10, y: 10, width: 50, height: 50 } });

// Query
const nearby = tree.query({ x: 0, y: 0, width: 100, height: 100 });

// Remove
tree.remove(objectId);
tree.clear();
```

---

#### PerformanceMonitor

FPS and timing metrics.

```javascript
import { PerformanceMonitor } from './scripts/core/performance/index.js';

const monitor = new PerformanceMonitor();

// Frame timing
monitor.beginFrame();
// ... render ...
monitor.endFrame();

// Operation timing
monitor.beginOperation('render');
// ... operation ...
monitor.endOperation('render');

// Stats
const fps = monitor.getFPS();
const stats = monitor.getStats('render');
```

---

## Objects

Location: `scripts/objects/`

### SceneObject (Base)

Abstract base class for all objects.

```javascript
import { SceneObject } from './scripts/objects/base.js';

class CustomObject extends SceneObject {
    constructor(options) {
        super(options);
    }
    
    render(rasterizer) {
        // Implement rendering
    }
    
    getBounds() {
        // Return bounding box
    }
    
    hitTest(point) {
        // Return true if point is inside
    }
}

// Common properties
object.id;          // Unique identifier
object.name;        // Display name
object.visible;     // Visibility
object.locked;      // Edit lock
object.transform;   // Transform matrix
object.style;       // Style properties
object.parent;      // Parent group/layer

// Transform methods
object.translate(dx, dy);
object.rotate(angle);
object.scale(sx, sy);
object.setPosition(x, y);
object.setRotation(angle);
object.setScale(sx, sy);

// Bounds
object.getBounds();         // Local bounds
object.getWorldBounds();    // Transformed bounds
object.getCenter();         // Center point

// Cloning
const copy = object.clone();

// Serialization
const json = object.toJSON();
SceneObject.fromJSON(json);
```

---

### Rectangle

```javascript
import { Rectangle } from './scripts/objects/shapes.js';

const rect = new Rectangle({
    x: 10,
    y: 5,
    width: 30,
    height: 15,
    cornerRadius: 2,
    style: {
        stroke: true,
        fill: false,
        strokeChar: '─',
        fillChar: ' ',
        borderStyle: 'single' // 'single', 'double', 'heavy', 'rounded'
    }
});

// Properties
rect.x;
rect.y;
rect.width;
rect.height;
rect.cornerRadius;
```

---

### Ellipse

```javascript
import { Ellipse } from './scripts/objects/shapes.js';

const ellipse = new Ellipse({
    cx: 50,
    cy: 25,
    rx: 20,
    ry: 10,
    style: {
        stroke: true,
        fill: true,
        strokeChar: '○',
        fillChar: '·'
    }
});

// Properties
ellipse.cx;  // Center X
ellipse.cy;  // Center Y
ellipse.rx;  // Radius X
ellipse.ry;  // Radius Y
```

---

### Polygon

```javascript
import { Polygon } from './scripts/objects/shapes.js';

// Regular polygon
const hexagon = Polygon.regular({
    cx: 50,
    cy: 25,
    radius: 15,
    sides: 6
});

// Custom polygon
const custom = new Polygon({
    points: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 15 },
        { x: 0, y: 15 }
    ]
});

// Properties
polygon.points;
polygon.closed;
```

---

### Path

```javascript
import { Path } from './scripts/objects/path.js';

const path = new Path();

// Build path
path.moveTo(10, 10);
path.lineTo(50, 10);
path.quadraticTo(60, 20, 50, 30);
path.cubicTo(40, 40, 20, 40, 10, 30);
path.close();

// From SVG path data
const svgPath = Path.fromSVGPath('M10,10 L50,10 Q60,20 50,30 C40,40 20,40 10,30 Z');

// Properties
path.segments;      // Path segments
path.closed;        // Is path closed
path.length;        // Total length

// Methods
path.getPointAt(t);         // Point at parameter
path.getTangentAt(t);       // Tangent at parameter
path.split(t);              // Split at parameter
path.reverse();             // Reverse direction
path.simplify(tolerance);   // Reduce points
path.flatten(tolerance);    // Convert curves to lines
```

---

### Text

```javascript
import { Text } from './scripts/objects/text.js';

const text = new Text({
    x: 10,
    y: 5,
    content: 'Hello World',
    fontSize: 1,
    alignment: 'left', // 'left', 'center', 'right'
    style: {
        char: '@',
        bold: false
    }
});

// Area text
const areaText = new Text({
    x: 10,
    y: 5,
    width: 40,
    height: 20,
    content: 'Long text that will wrap...',
    wordWrap: true
});

// ASCII art text
const artText = Text.asciiArt({
    content: 'HELLO',
    font: 'standard' // 'standard', 'block', 'banner', etc.
});
```

---

### Group

```javascript
import { Group } from './scripts/objects/group.js';

const group = new Group({
    name: 'My Group'
});

// Add/remove objects
group.add(object);
group.remove(object.id);
group.addAll([obj1, obj2, obj3]);

// Access children
group.children;
group.getChildById(id);
group.getChildByName(name);

// Transform affects all children
group.translate(10, 10);
group.rotate(Math.PI / 4);

// Ungroup
const objects = group.ungroup();
```

---

## Tools

Location: `scripts/tools/`

### Tool (Base)

```javascript
import { Tool } from './scripts/tools/base.js';

class CustomTool extends Tool {
    constructor() {
        super({
            id: 'custom',
            name: 'Custom Tool',
            icon: '✦',
            cursor: 'crosshair',
            shortcut: 'X'
        });
    }
    
    onActivate() { /* Called when tool is selected */ }
    onDeactivate() { /* Called when tool is deselected */ }
    
    onMouseDown(event) { /* Handle mouse down */ }
    onMouseMove(event) { /* Handle mouse move */ }
    onMouseUp(event) { /* Handle mouse up */ }
    
    onKeyDown(event) { /* Handle key down */ }
    onKeyUp(event) { /* Handle key up */ }
    
    render(ctx) { /* Render tool feedback */ }
}
```

---

### SelectTool

```javascript
import { SelectTool } from './scripts/tools/select.js';

const tool = new SelectTool();

// Selection modes
tool.mode = 'replace';  // Replace selection
tool.mode = 'add';      // Add to selection (Shift)
tool.mode = 'subtract'; // Remove from selection (Alt)
tool.mode = 'toggle';   // Toggle selection (Ctrl)
```

---

### ShapeTools

```javascript
import { 
    RectangleTool, 
    EllipseTool, 
    PolygonTool,
    StarTool,
    LineTool 
} from './scripts/tools/shapes.js';

const rectTool = new RectangleTool({
    cornerRadius: 0,
    borderStyle: 'single'
});

const polygonTool = new PolygonTool({
    sides: 6
});

const starTool = new StarTool({
    points: 5,
    innerRadius: 0.4
});
```

---

### PathTool (Pen)

```javascript
import { PenTool } from './scripts/tools/path.js';

const pen = new PenTool();

// Modes
pen.mode = 'create';  // Creating new path
pen.mode = 'edit';    // Editing existing path
pen.mode = 'add';     // Adding to path
```

---

## Charts

Location: `scripts/charts/`

### Chart (Base)

```javascript
import { Chart } from './scripts/charts/base.js';

const chart = new Chart({
    type: 'bar',
    x: 10,
    y: 5,
    width: 60,
    height: 20,
    data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
            label: 'Revenue',
            data: [85, 62, 95, 78]
        }]
    },
    options: {
        title: { text: 'Revenue by Quarter' },
        legend: { show: true, position: 'bottom' },
        axes: {
            x: { label: 'Quarter' },
            y: { label: 'Percentage', min: 0, max: 100 }
        }
    }
});
```

---

### BarChart

```javascript
import { BarChart } from './scripts/charts/bar.js';

const chart = new BarChart({
    data: { /* ... */ },
    options: {
        orientation: 'horizontal', // or 'vertical'
        barWidth: 0.8,
        grouped: false,
        stacked: false
    }
});
```

---

### LineChart

```javascript
import { LineChart } from './scripts/charts/line.js';

const chart = new LineChart({
    data: { /* ... */ },
    options: {
        showPoints: true,
        pointChar: '●',
        lineChar: '─',
        smooth: false,
        fill: false
    }
});
```

---

### PieChart

```javascript
import { PieChart } from './scripts/charts/pie.js';

const chart = new PieChart({
    data: { /* ... */ },
    options: {
        donut: false,
        donutRatio: 0.5,
        showLabels: true,
        showPercentages: true
    }
});
```

---

## Flowchart

Location: `scripts/flowchart/`

### FlowchartShape

```javascript
import { 
    Process, 
    Decision, 
    Terminal, 
    IO, 
    Subprocess,
    Connector as FlowConnector
} from './scripts/flowchart/shapes.js';

const process = new Process({
    x: 10, y: 5,
    width: 20, height: 5,
    label: 'Process Step'
});

const decision = new Decision({
    x: 40, y: 10,
    width: 15, height: 7,
    label: 'Condition?'
});
```

---

### Connector

```javascript
import { Connector } from './scripts/flowchart/connectors.js';

const connector = new Connector({
    from: { shape: process, port: 'right' },
    to: { shape: decision, port: 'left' },
    style: 'orthogonal', // 'straight', 'orthogonal', 'curved'
    arrow: 'end', // 'start', 'end', 'both', 'none'
    label: 'Yes'
});

// Auto-routing
connector.route();
```

---

### AutoLayout

```javascript
import { AutoLayout } from './scripts/flowchart/routing.js';

// Layout flowchart automatically
AutoLayout.layout(shapes, {
    direction: 'top-down', // 'top-down', 'left-right'
    spacing: { x: 10, y: 5 },
    alignment: 'center'
});
```

---

## UI Components

Location: `scripts/ui/`

### MenuBar

```javascript
import { MenuBar, Menu, MenuItem } from './scripts/ui/menu.js';

const menuBar = new MenuBar();

const fileMenu = new Menu('File');
fileMenu.addItem(new MenuItem({
    label: 'New',
    shortcut: 'Ctrl+N',
    action: () => { /* ... */ }
}));
fileMenu.addSeparator();
fileMenu.addItem(new MenuItem({
    label: 'Exit',
    action: () => { /* ... */ }
}));

menuBar.addMenu(fileMenu);
```

---

### Toolbar

```javascript
import { Toolbar, ToolbarButton, ToolbarGroup } from './scripts/ui/toolbar.js';

const toolbar = new Toolbar({
    orientation: 'vertical'
});

const selectGroup = new ToolbarGroup('Selection');
selectGroup.addButton(new ToolbarButton({
    id: 'select',
    icon: '↖',
    tooltip: 'Select (V)',
    action: () => selectTool()
}));

toolbar.addGroup(selectGroup);
```

---

### Panels

```javascript
import { Panel, PanelManager } from './scripts/ui/panels.js';

const panel = new Panel({
    id: 'layers',
    title: 'Layers',
    icon: '☰',
    collapsible: true,
    resizable: true
});

panel.setContent(layerListElement);

const panelManager = new PanelManager({
    container: document.getElementById('panels')
});
panelManager.addPanel(panel, 'right');
```

---

### Dialogs

```javascript
import { Dialog, alert, confirm, prompt } from './scripts/ui/dialogs.js';

// Simple dialogs
await alert('Operation complete!');
const ok = await confirm('Delete this object?');
const name = await prompt('Enter name:', 'Untitled');

// Custom dialog
const dialog = new Dialog({
    title: 'Settings',
    content: settingsForm,
    buttons: [
        { label: 'Cancel', action: 'cancel' },
        { label: 'Save', action: 'save', primary: true }
    ]
});

const result = await dialog.show();
```

---

### Tooltips

```javascript
import { TooltipManager, setTooltip } from './scripts/ui/tooltips.js';

// Using data attributes
setTooltip(element, 'Click to select', {
    shortcut: 'V',
    placement: 'right'
});

// Programmatic
const tooltips = new TooltipManager();
tooltips.register(element, {
    content: 'Tooltip text',
    delay: 500
});
```

---

### Shortcuts

```javascript
import { ShortcutManager, DefaultShortcuts } from './scripts/ui/shortcuts.js';

const shortcuts = new ShortcutManager();

// Register shortcuts
shortcuts.register('file.new', 'Ctrl+N', () => newDocument());
shortcuts.register('edit.undo', 'Ctrl+Z', () => undo());

// Load defaults
shortcuts.loadDefaults(DefaultShortcuts);

// Rebind
shortcuts.rebind('file.new', 'Ctrl+Shift+N');
```

---

### Accessibility

```javascript
import { 
    announce, 
    FocusManager, 
    makeDialogAccessible 
} from './scripts/ui/accessibility.js';

// Screen reader announcements
announce('Document saved');

// Focus trapping for dialogs
const focusTrap = new FocusManager(dialogElement);
focusTrap.activate();
// ... dialog interaction ...
focusTrap.deactivate();

// Make dialog accessible
const a11y = makeDialogAccessible(dialog, {
    labelledBy: 'dialog-title',
    closeOnEscape: true
});
```

---

## I/O Operations

Location: `scripts/io/`

### Native Format

```javascript
import { NativeFormat } from './scripts/io/native.js';

// Save
const json = NativeFormat.serialize(document);
const blob = new Blob([json], { type: 'application/json' });

// Load
const doc = NativeFormat.deserialize(jsonString);
```

---

### SVG Import/Export

```javascript
import { SVGImporter, SVGExporter } from './scripts/io/svg.js';

// Import
const objects = await SVGImporter.import(svgString);
document.addObjects(objects);

// Export
const svg = SVGExporter.export(document, {
    width: 800,
    height: 600,
    includeStyles: true
});
```

---

### Image Import

```javascript
import { ImageImporter } from './scripts/io/image.js';

// Import and convert to ASCII
const ascii = await ImageImporter.import(imageFile, {
    width: 80,
    height: 40,
    charset: 'standard',
    threshold: 128,
    invert: false
});
```

---

### Export

```javascript
import { Exporter } from './scripts/io/export.js';

// Plain text
const txt = Exporter.toText(document);

// HTML
const html = Exporter.toHtml(document, {
    includeStyles: true,
    theme: 'dark'
});

// PNG
const png = await Exporter.toPng(document, {
    scale: 2,
    backgroundColor: '#000000'
});

// Download
Exporter.download(content, 'document.txt', 'text/plain');
```

---

## Utilities

Location: `scripts/utils/`

### EventEmitter

```javascript
import { EventEmitter } from './scripts/utils/events.js';

class MyClass extends EventEmitter {
    doSomething() {
        this.emit('something', { data: 123 });
    }
}

const obj = new MyClass();
obj.on('something', (data) => console.log(data));
obj.once('something', (data) => console.log('Once:', data));
obj.off('something', handler);
```

---

### DOM Utilities

```javascript
import { 
    createElement, 
    addClass, 
    removeClass, 
    toggleClass,
    setStyles,
    getOffset,
    animate
} from './scripts/utils/dom.js';

const el = createElement('div', {
    className: 'my-class',
    id: 'my-id',
    textContent: 'Hello'
});

setStyles(el, {
    backgroundColor: 'red',
    padding: '10px'
});

await animate(el, { opacity: [0, 1] }, 300);
```

---

### Helpers

```javascript
import { 
    clamp, 
    lerp, 
    map, 
    debounce, 
    throttle,
    deepClone,
    generateId
} from './scripts/utils/helpers.js';

const clamped = clamp(value, 0, 100);
const interpolated = lerp(a, b, 0.5);
const mapped = map(value, 0, 1, 0, 100);

const debouncedFn = debounce(fn, 300);
const throttledFn = throttle(fn, 100);

const id = generateId();
const copy = deepClone(object);
```

---

## Error Handling

All modules use consistent error handling:

```javascript
try {
    const doc = Document.fromJSON(invalidJson);
} catch (error) {
    if (error instanceof ValidationError) {
        console.error('Invalid document format:', error.message);
    } else if (error instanceof ParseError) {
        console.error('Failed to parse:', error.message);
    } else {
        throw error;
    }
}
```

---

## Type Definitions

TypeScript-compatible JSDoc annotations are used throughout:

```javascript
/**
 * @typedef {Object} Bounds
 * @property {number} x - Left edge
 * @property {number} y - Top edge
 * @property {number} width - Width
 * @property {number} height - Height
 */

/**
 * @typedef {Object} Style
 * @property {boolean} stroke - Enable stroke
 * @property {boolean} fill - Enable fill
 * @property {string} strokeChar - Stroke character
 * @property {string} fillChar - Fill character
 */
```

---

*Asciistrator API v1.0.0*
