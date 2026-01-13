/**
 * Asciistrator - Serialization Unit Tests
 * 
 * Tests for object serialization to v2 format and round-trip save/load.
 * Verifies Figma-compatible format output.
 */

import { describe, it, beforeEach, assert } from '../framework.js';
import { 
    NativeDocument, 
    FORMAT_VERSION, 
    TypeMapping, 
    ColorUtils,
    ConstraintValues,
    detectVersion
} from '../../scripts/io/native.js';

// ==========================================
// MOCK OBJECTS FOR TESTING
// ==========================================

/**
 * Create a mock rectangle object
 */
function createMockRectangle(overrides = {}) {
    return {
        id: 'rect-' + Math.random().toString(36).substring(7),
        type: 'rectangle',
        name: 'Test Rectangle',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        strokeChar: '*',
        fillChar: ' ',
        strokeColor: '#ff0000',
        fillColor: '#00ff00',
        lineStyle: 'single',
        stroke: {
            color: '#000000',
            weight: 1,
            align: 'center',
            cap: 'none',
            join: 'miter',
            dashPattern: [],
            visible: true,
            opacity: 1
        },
        fills: [],
        effects: [],
        cornerRadius: {
            topLeft: 0,
            topRight: 0,
            bottomRight: 0,
            bottomLeft: 0,
            independent: false
        },
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        sizing: {
            horizontal: 'fixed',
            vertical: 'fixed',
            minWidth: null,
            maxWidth: null,
            minHeight: null,
            maxHeight: null
        },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock ellipse object
 */
function createMockEllipse(overrides = {}) {
    return {
        id: 'ellipse-' + Math.random().toString(36).substring(7),
        type: 'ellipse',
        name: 'Test Ellipse',
        x: 50,
        y: 50,
        radiusX: 30,
        radiusY: 20,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 0.8,
        blendMode: 'multiply',
        strokeChar: 'o',
        fillChar: '.',
        strokeColor: '#0000ff',
        fillColor: '#ffff00',
        lineStyle: 'double',
        stroke: {
            color: '#0000ff',
            weight: 2,
            align: 'inside',
            cap: 'round',
            join: 'round',
            dashPattern: [5, 3],
            visible: true,
            opacity: 1
        },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'CENTER',
            vertical: 'CENTER'
        },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock text object
 */
function createMockText(overrides = {}) {
    return {
        id: 'text-' + Math.random().toString(36).substring(7),
        type: 'text',
        name: 'Test Text',
        x: 0,
        y: 0,
        width: 80,
        height: 20,
        text: 'Hello World',
        fontFamily: 'monospace',
        fontSize: 12,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        strokeChar: '',
        fillChar: '',
        lineStyle: 'single',
        stroke: { weight: 0, visible: false },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock frame object with auto layout
 */
function createMockFrame(overrides = {}) {
    return {
        id: 'frame-' + Math.random().toString(36).substring(7),
        type: 'frame',
        name: 'Test Frame',
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        strokeChar: '+',
        fillChar: '',
        lineStyle: 'single',
        backgroundColor: '#ffffff',
        showBorder: true,
        borderStyle: 'single',
        title: 'Frame Title',
        autoSize: false,
        stroke: { weight: 1, visible: true },
        fills: [],
        effects: [],
        clipContent: true,
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        layoutMode: 'VERTICAL',
        primaryAxisAlignItems: 'MIN',
        counterAxisAlignItems: 'MIN',
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 8,
        paddingBottom: 8,
        itemSpacing: 4,
        counterAxisSpacing: 0,
        layoutWrap: 'NO_WRAP',
        itemReverseZIndex: false,
        autoLayout: {
            enabled: true,
            direction: 'vertical'
        },
        sizing: {
            horizontal: 'fixed',
            vertical: 'hug',
            minWidth: 100,
            maxWidth: 400,
            minHeight: null,
            maxHeight: null
        },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock line object
 */
function createMockLine(overrides = {}) {
    return {
        id: 'line-' + Math.random().toString(36).substring(7),
        type: 'line',
        name: 'Test Line',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 50,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        strokeChar: '-',
        lineStyle: 'single',
        stroke: {
            color: '#333333',
            weight: 1,
            visible: true
        },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'SCALE',
            vertical: 'SCALE'
        },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock polygon object
 */
function createMockPolygon(overrides = {}) {
    return {
        id: 'polygon-' + Math.random().toString(36).substring(7),
        type: 'polygon',
        name: 'Test Polygon',
        x: 50,
        y: 50,
        width: 60,
        height: 60,
        sides: 6,
        cx: 50,
        cy: 50,
        radius: 30,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        strokeChar: '*',
        fillChar: '',
        stroke: { weight: 1, visible: true },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock star object
 */
function createMockStar(overrides = {}) {
    return {
        id: 'star-' + Math.random().toString(36).substring(7),
        type: 'star',
        name: 'Test Star',
        x: 50,
        y: 50,
        width: 80,
        height: 80,
        numPoints: 5,
        innerRadius: 20,
        outerRadius: 40,
        cx: 50,
        cy: 50,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        strokeChar: '*',
        fillChar: '',
        stroke: { weight: 1, visible: true },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock group object
 */
function createMockGroup(children = [], overrides = {}) {
    return {
        id: 'group-' + Math.random().toString(36).substring(7),
        type: 'group',
        name: 'Test Group',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        stroke: { weight: 0, visible: false },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        children: children,
        ...overrides
    };
}

/**
 * Create a mock component object
 */
function createMockComponent(overrides = {}) {
    return {
        id: 'comp-' + Math.random().toString(36).substring(7),
        type: 'component',
        name: 'Test Component',
        componentKey: 'C:' + Math.random().toString(36).substring(7),
        description: 'A test component',
        documentationLinks: [],
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        strokeChar: '#',
        fillChar: '',
        backgroundColor: '#eeeeee',
        showBorder: true,
        borderStyle: 'double',
        stroke: { weight: 1, visible: true },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        autoLayout: { enabled: false },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock instance object
 */
function createMockInstance(componentId, overrides = {}) {
    return {
        id: 'inst-' + Math.random().toString(36).substring(7),
        type: 'instance',
        name: 'Test Instance',
        componentId: componentId,
        overrides: {},
        exposedInstances: [],
        scaleFactor: 1,
        x: 50,
        y: 50,
        width: 100,
        height: 50,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        stroke: { weight: 1, visible: true },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock table object
 */
function createMockTable(overrides = {}) {
    return {
        id: 'table-' + Math.random().toString(36).substring(7),
        type: 'table',
        name: 'Test Table',
        x: 0,
        y: 0,
        width: 80,
        height: 40,
        cols: 3,
        rows: 2,
        cellData: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']],
        columnWidths: [20, 30, 30],
        rowHeights: [20, 20],
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        strokeChar: '|',
        fillChar: '',
        stroke: { weight: 1, visible: true },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock flowchart process shape
 */
function createMockFlowchartProcess(overrides = {}) {
    return {
        id: 'process-' + Math.random().toString(36).substring(7),
        type: 'process',
        name: 'Process Step',
        label: 'Do Something',
        labelColor: '#000000',
        x: 0,
        y: 0,
        width: 80,
        height: 40,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        strokeChar: '+',
        fillChar: '',
        stroke: { weight: 1, visible: true },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        children: [],
        ...overrides
    };
}

/**
 * Create a mock connector object
 */
function createMockConnector(overrides = {}) {
    return {
        id: 'connector-' + Math.random().toString(36).substring(7),
        type: 'connector',
        name: 'Test Connector',
        fromShapeId: 'shape1',
        fromSnapPoint: 'right',
        toShapeId: 'shape2',
        toSnapPoint: 'left',
        startX: 100,
        startY: 50,
        endX: 200,
        endY: 50,
        connectorStyle: 'orthogonal',
        lineType: 'solid',
        arrowStart: 'none',
        arrowEnd: 'arrow',
        waypoints: [],
        x: 100,
        y: 50,
        width: 100,
        height: 0,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        strokeChar: '-',
        stroke: { weight: 1, visible: true },
        fills: [],
        effects: [],
        constraints: {
            horizontal: 'MIN',
            vertical: 'MIN'
        },
        children: [],
        ...overrides
    };
}

// ==========================================
// COLOR UTILS TESTS
// ==========================================

describe('ColorUtils', () => {
    describe('hexToFigma', () => {
        it('should convert 6-digit hex to Figma color', () => {
            const color = ColorUtils.hexToFigma('#ff8000');
            
            assert.isDefined(color);
            assert.equal(color.r, 1);
            assert.approximately(color.g, 0.502, 0.01);
            assert.equal(color.b, 0);
            assert.equal(color.a, 1);
        });
        
        it('should convert 3-digit hex to Figma color', () => {
            const color = ColorUtils.hexToFigma('#f80');
            
            assert.isDefined(color);
            assert.equal(color.r, 1);
            assert.approximately(color.g, 0.533, 0.01);
            assert.equal(color.b, 0);
        });
        
        it('should handle hex without hash', () => {
            const color = ColorUtils.hexToFigma('00ff00');
            
            assert.isDefined(color);
            assert.equal(color.r, 0);
            assert.equal(color.g, 1);
            assert.equal(color.b, 0);
        });
        
        it('should return null for invalid input', () => {
            assert.isNull(ColorUtils.hexToFigma(null));
            assert.isNull(ColorUtils.hexToFigma(''));
            assert.isNull(ColorUtils.hexToFigma('invalid'));
        });
    });
    
    describe('figmaToHex', () => {
        it('should convert Figma color to hex', () => {
            const hex = ColorUtils.figmaToHex({ r: 1, g: 0.5, b: 0, a: 1 });
            
            assert.equal(hex, '#ff8000');
        });
        
        it('should handle edge values', () => {
            assert.equal(ColorUtils.figmaToHex({ r: 0, g: 0, b: 0, a: 1 }), '#000000');
            assert.equal(ColorUtils.figmaToHex({ r: 1, g: 1, b: 1, a: 1 }), '#ffffff');
        });
        
        it('should return null for invalid input', () => {
            assert.isNull(ColorUtils.figmaToHex(null));
        });
    });
    
    describe('Round-trip conversion', () => {
        it('should round-trip hex → Figma → hex', () => {
            const original = '#3366cc';
            const figma = ColorUtils.hexToFigma(original);
            const result = ColorUtils.figmaToHex(figma);
            
            assert.equal(result, original);
        });
    });
});

// ==========================================
// TYPE MAPPING TESTS
// ==========================================

describe('TypeMapping', () => {
    describe('toFigma', () => {
        it('should map basic shapes', () => {
            assert.equal(TypeMapping.toFigma['rectangle'], 'RECTANGLE');
            assert.equal(TypeMapping.toFigma['ellipse'], 'ELLIPSE');
            assert.equal(TypeMapping.toFigma['line'], 'LINE');
            assert.equal(TypeMapping.toFigma['polygon'], 'REGULAR_POLYGON');
            assert.equal(TypeMapping.toFigma['star'], 'STAR');
        });
        
        it('should map containers', () => {
            assert.equal(TypeMapping.toFigma['group'], 'GROUP');
            assert.equal(TypeMapping.toFigma['frame'], 'FRAME');
        });
        
        it('should map text types', () => {
            assert.equal(TypeMapping.toFigma['text'], 'TEXT');
            assert.equal(TypeMapping.toFigma['ascii-text'], 'TEXT');
        });
        
        it('should map components', () => {
            assert.equal(TypeMapping.toFigma['component'], 'COMPONENT');
            assert.equal(TypeMapping.toFigma['instance'], 'INSTANCE');
        });
        
        it('should map flowchart shapes', () => {
            assert.equal(TypeMapping.toFigma['process'], 'FLOWCHART_PROCESS');
            assert.equal(TypeMapping.toFigma['decision'], 'FLOWCHART_DECISION');
            assert.equal(TypeMapping.toFigma['connector'], 'FLOWCHART_CONNECTOR');
        });
    });
    
    describe('fromFigma', () => {
        it('should reverse map all types', () => {
            for (const [internal, figma] of Object.entries(TypeMapping.toFigma)) {
                // Skip ascii-text as it maps to TEXT (shared mapping)
                if (internal === 'ascii-text') continue;
                assert.equal(TypeMapping.fromFigma[figma], internal);
            }
        });
    });
});

// ==========================================
// OBJECT SERIALIZATION TESTS
// ==========================================

describe('NativeDocument.serializeObjectV2', () => {
    describe('Rectangle', () => {
        it('should serialize rectangle to v2 format', () => {
            const rect = createMockRectangle();
            const node = NativeDocument.serializeObjectV2(rect);
            
            // Type mapping
            assert.equal(node.type, 'RECTANGLE');
            assert.equal(node.name, 'Test Rectangle');
            
            // Position (absoluteBoundingBox)
            assert.isDefined(node.absoluteBoundingBox);
            assert.equal(node.absoluteBoundingBox.x, 10);
            assert.equal(node.absoluteBoundingBox.y, 20);
            assert.equal(node.absoluteBoundingBox.width, 100);
            assert.equal(node.absoluteBoundingBox.height, 50);
            
            // Visibility
            assert.isTrue(node.visible);
            assert.isFalse(node.locked);
            
            // Opacity and blend
            assert.equal(node.opacity, 1);
            assert.equal(node.blendMode, 'NORMAL');
            
            // Constraints (Figma naming)
            assert.equal(node.constraints.horizontal, 'MIN');
            assert.equal(node.constraints.vertical, 'MIN');
            
            // ASCII namespace
            assert.isDefined(node.ascii);
            assert.equal(node.ascii.strokeChar, '*');
            assert.equal(node.ascii.fillChar, ' ');
            assert.equal(node.ascii.lineStyle, 'single');
        });
        
        it('should convert colors to Figma format', () => {
            const rect = createMockRectangle({
                strokeColor: '#ff0000',
                fillColor: '#00ff00'
            });
            const node = NativeDocument.serializeObjectV2(rect);
            
            // ASCII colors preserved in namespace
            assert.equal(node.ascii.strokeColor, '#ff0000');
            assert.equal(node.ascii.fillColor, '#00ff00');
            
            // Fills array should have converted color
            if (node.fills && node.fills.length > 0) {
                const fill = node.fills[0];
                assert.isDefined(fill.color);
                assert.approximately(fill.color.g, 1, 0.01);
            }
        });
        
        it('should serialize corner radius', () => {
            const rect = createMockRectangle({
                cornerRadius: {
                    topLeft: 5,
                    topRight: 10,
                    bottomRight: 5,
                    bottomLeft: 10,
                    independent: true
                }
            });
            const node = NativeDocument.serializeObjectV2(rect);
            
            assert.isDefined(node.cornerRadius);
        });
    });
    
    describe('Ellipse', () => {
        it('should serialize ellipse with radii', () => {
            const ellipse = createMockEllipse();
            const node = NativeDocument.serializeObjectV2(ellipse);
            
            assert.equal(node.type, 'ELLIPSE');
            assert.equal(node.radiusX, 30);
            assert.equal(node.radiusY, 20);
            assert.approximately(node.opacity, 0.8, 0.01);
            assert.equal(node.blendMode, 'MULTIPLY');
        });
        
        it('should serialize stroke properties', () => {
            const ellipse = createMockEllipse();
            const node = NativeDocument.serializeObjectV2(ellipse);
            
            assert.equal(node.strokeWeight, 2);
            assert.equal(node.strokeAlign, 'INSIDE');
            assert.equal(node.strokeCap, 'ROUND');
            assert.equal(node.strokeJoin, 'ROUND');
            assert.deepEqual(node.strokeDashes, [5, 3]);
        });
    });
    
    describe('Text', () => {
        it('should serialize text with characters', () => {
            const text = createMockText();
            const node = NativeDocument.serializeObjectV2(text);
            
            assert.equal(node.type, 'TEXT');
            assert.equal(node.characters, 'Hello World');
            assert.equal(node.fontFamily, 'monospace');
            assert.equal(node.fontSize, 12);
        });
        
        it('should handle ascii-text type', () => {
            const asciiText = createMockText({ type: 'ascii-text' });
            const node = NativeDocument.serializeObjectV2(asciiText);
            
            // Both map to TEXT
            assert.equal(node.type, 'TEXT');
            // But ascii namespace indicates it's ascii-text
            assert.isTrue(node.ascii.isAsciiText);
        });
    });
    
    describe('Line', () => {
        it('should serialize line with endpoints', () => {
            const line = createMockLine();
            const node = NativeDocument.serializeObjectV2(line);
            
            assert.equal(node.type, 'LINE');
            assert.equal(node.x1, 0);
            assert.equal(node.y1, 0);
            assert.equal(node.x2, 100);
            assert.equal(node.y2, 50);
        });
        
        it('should preserve SCALE constraints', () => {
            const line = createMockLine();
            const node = NativeDocument.serializeObjectV2(line);
            
            assert.equal(node.constraints.horizontal, 'SCALE');
            assert.equal(node.constraints.vertical, 'SCALE');
        });
    });
    
    describe('Polygon', () => {
        it('should serialize polygon with sides', () => {
            const polygon = createMockPolygon();
            const node = NativeDocument.serializeObjectV2(polygon);
            
            assert.equal(node.type, 'REGULAR_POLYGON');
            assert.equal(node.sides, 6);
            assert.equal(node.cx, 50);
            assert.equal(node.cy, 50);
            assert.equal(node.radius, 30);
        });
    });
    
    describe('Star', () => {
        it('should serialize star with radii', () => {
            const star = createMockStar();
            const node = NativeDocument.serializeObjectV2(star);
            
            assert.equal(node.type, 'STAR');
            assert.equal(node.starPoints, 5);
            assert.equal(node.innerRadius, 20);
            assert.equal(node.outerRadius, 40);
        });
    });
    
    describe('Frame', () => {
        it('should serialize frame with layout properties', () => {
            const frame = createMockFrame();
            const node = NativeDocument.serializeObjectV2(frame);
            
            assert.equal(node.type, 'FRAME');
            assert.equal(node.layoutMode, 'VERTICAL');
            assert.equal(node.paddingLeft, 8);
            assert.equal(node.paddingRight, 8);
            assert.equal(node.paddingTop, 8);
            assert.equal(node.paddingBottom, 8);
            assert.equal(node.itemSpacing, 4);
            assert.equal(node.layoutWrap, 'NO_WRAP');
        });
        
        it('should serialize sizing modes', () => {
            const frame = createMockFrame();
            const node = NativeDocument.serializeObjectV2(frame);
            
            assert.equal(node.primaryAxisSizingMode, 'FIXED');
            assert.equal(node.counterAxisSizingMode, 'AUTO');  // 'hug' → AUTO
            assert.equal(node.minWidth, 100);
            assert.equal(node.maxWidth, 400);
        });
        
        it('should serialize clipsContent', () => {
            const frame = createMockFrame({ clipContent: true });
            const node = NativeDocument.serializeObjectV2(frame);
            
            assert.isTrue(node.clipsContent);
        });
        
        it('should preserve ASCII frame properties', () => {
            const frame = createMockFrame();
            const node = NativeDocument.serializeObjectV2(frame);
            
            assert.equal(node.ascii.title, 'Frame Title');
            assert.isTrue(node.ascii.showBorder);
            assert.equal(node.ascii.borderStyle, 'single');
        });
    });
    
    describe('Group', () => {
        it('should serialize group with children', () => {
            const children = [
                createMockRectangle({ x: 0, y: 0 }),
                createMockEllipse({ x: 50, y: 50 })
            ];
            const group = createMockGroup(children);
            const node = NativeDocument.serializeObjectV2(group);
            
            assert.equal(node.type, 'GROUP');
            assert.lengthOf(node.children, 2);
            assert.equal(node.children[0].type, 'RECTANGLE');
            assert.equal(node.children[1].type, 'ELLIPSE');
        });
        
        it('should serialize nested groups', () => {
            const innerGroup = createMockGroup([createMockRectangle()]);
            const outerGroup = createMockGroup([innerGroup, createMockText()]);
            const node = NativeDocument.serializeObjectV2(outerGroup);
            
            assert.equal(node.type, 'GROUP');
            assert.lengthOf(node.children, 2);
            assert.equal(node.children[0].type, 'GROUP');
            assert.lengthOf(node.children[0].children, 1);
        });
    });
    
    describe('Component', () => {
        it('should serialize component with key and description', () => {
            const component = createMockComponent();
            const node = NativeDocument.serializeObjectV2(component);
            
            assert.equal(node.type, 'COMPONENT');
            assert.isDefined(node.componentKey);
            assert.equal(node.description, 'A test component');
            assert.isArray(node.documentationLinks);
        });
    });
    
    describe('Instance', () => {
        it('should serialize instance with component reference', () => {
            const component = createMockComponent();
            const instance = createMockInstance(component.id);
            const node = NativeDocument.serializeObjectV2(instance);
            
            assert.equal(node.type, 'INSTANCE');
            assert.equal(node.componentId, component.id);
            assert.isDefined(node.overrides);
            assert.equal(node.scaleFactor, 1);
        });
    });
    
    describe('Table', () => {
        it('should serialize table with data in ascii namespace', () => {
            const table = createMockTable();
            const node = NativeDocument.serializeObjectV2(table);
            
            assert.equal(node.type, 'TABLE');
            assert.equal(node.cols, 3);
            assert.equal(node.rows, 2);
            
            // ASCII-specific data in namespace
            assert.deepEqual(node.ascii.cellData, [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']]);
            assert.deepEqual(node.ascii.columnWidths, [20, 30, 30]);
            assert.deepEqual(node.ascii.rowHeights, [20, 20]);
        });
    });
    
    describe('Flowchart Shapes', () => {
        it('should serialize process shape', () => {
            const process = createMockFlowchartProcess();
            const node = NativeDocument.serializeObjectV2(process);
            
            assert.equal(node.type, 'FLOWCHART_PROCESS');
            assert.equal(node.flowchartType, 'process');
            assert.equal(node.ascii.label, 'Do Something');
        });
    });
    
    describe('Connector', () => {
        it('should serialize connector with endpoints', () => {
            const connector = createMockConnector();
            const node = NativeDocument.serializeObjectV2(connector);
            
            assert.equal(node.type, 'FLOWCHART_CONNECTOR');
            assert.equal(node.fromShapeId, 'shape1');
            assert.equal(node.toShapeId, 'shape2');
            assert.equal(node.startX, 100);
            assert.equal(node.endX, 200);
            
            // ASCII connector properties in namespace
            assert.equal(node.ascii.connectorStyle, 'orthogonal');
            assert.equal(node.ascii.arrowEnd, 'arrow');
        });
    });
    
    describe('Style References', () => {
        it('should serialize style references', () => {
            const rect = createMockRectangle({
                fillStyleId: 'S:fill123',
                strokeStyleId: 'S:stroke456',
                textStyleId: null,
                effectStyleId: 'S:effect789'
            });
            const node = NativeDocument.serializeObjectV2(rect);
            
            assert.equal(node.fillStyleId, 'S:fill123');
            assert.equal(node.strokeStyleId, 'S:stroke456');
            assert.equal(node.effectStyleId, 'S:effect789');
            assert.isUndefined(node.textStyleId);
        });
    });
});

// ==========================================
// CONSTRAINT VALUES TESTS
// ==========================================

describe('ConstraintValues', () => {
    it('should have Figma-compatible horizontal values', () => {
        assert.include(ConstraintValues.horizontal, 'MIN');
        assert.include(ConstraintValues.horizontal, 'MAX');
        assert.include(ConstraintValues.horizontal, 'STRETCH');
        assert.include(ConstraintValues.horizontal, 'CENTER');
        assert.include(ConstraintValues.horizontal, 'SCALE');
    });
    
    it('should have Figma-compatible vertical values', () => {
        assert.include(ConstraintValues.vertical, 'MIN');
        assert.include(ConstraintValues.vertical, 'MAX');
        assert.include(ConstraintValues.vertical, 'STRETCH');
        assert.include(ConstraintValues.vertical, 'CENTER');
        assert.include(ConstraintValues.vertical, 'SCALE');
    });
});

// ==========================================
// DOCUMENT ROUND-TRIP TESTS
// ==========================================

describe('Document Round-Trip', () => {
    describe('Basic Document', () => {
        it('should round-trip empty document', () => {
            const doc = new NativeDocument();
            doc.name = 'Test Document';
            doc.metadata.title = 'Test Document';
            doc.metadata.author = 'Test Author';
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            assert.equal(restored.name, 'Test Document');
            assert.equal(restored.metadata.title, 'Test Document');
            assert.equal(restored.metadata.author, 'Test Author');
            assert.equal(restored.version, FORMAT_VERSION);
        });
        
        it('should round-trip document with page', () => {
            const doc = new NativeDocument();
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: []
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            assert.lengthOf(restored.document.children, 1);
            assert.equal(restored.document.children[0].type, 'PAGE');
            assert.equal(restored.document.children[0].name, 'Page 1');
        });
    });
    
    describe('Objects Round-Trip', () => {
        it('should round-trip rectangle', () => {
            const doc = new NativeDocument();
            const rect = createMockRectangle();
            const serialized = NativeDocument.serializeObjectV2(rect);
            
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: [serialized]
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            const restoredRect = restored.document.children[0].children[0];
            assert.equal(restoredRect.type, 'RECTANGLE');
            assert.equal(restoredRect.absoluteBoundingBox.x, 10);
            assert.equal(restoredRect.absoluteBoundingBox.y, 20);
            assert.equal(restoredRect.absoluteBoundingBox.width, 100);
            assert.equal(restoredRect.absoluteBoundingBox.height, 50);
            assert.equal(restoredRect.ascii.strokeChar, '*');
        });
        
        it('should round-trip frame with children', () => {
            const doc = new NativeDocument();
            const frame = createMockFrame({
                children: [
                    createMockRectangle({ x: 10, y: 10 }),
                    createMockText({ x: 10, y: 60 })
                ]
            });
            const serialized = NativeDocument.serializeObjectV2(frame);
            
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: [serialized]
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            const restoredFrame = restored.document.children[0].children[0];
            assert.equal(restoredFrame.type, 'FRAME');
            assert.equal(restoredFrame.layoutMode, 'VERTICAL');
            assert.lengthOf(restoredFrame.children, 2);
            assert.equal(restoredFrame.children[0].type, 'RECTANGLE');
            assert.equal(restoredFrame.children[1].type, 'TEXT');
        });
        
        it('should round-trip nested groups', () => {
            const doc = new NativeDocument();
            const innerGroup = createMockGroup([
                createMockRectangle(),
                createMockEllipse()
            ]);
            const outerGroup = createMockGroup([innerGroup]);
            const serialized = NativeDocument.serializeObjectV2(outerGroup);
            
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: [serialized]
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            const restoredGroup = restored.document.children[0].children[0];
            assert.equal(restoredGroup.type, 'GROUP');
            assert.lengthOf(restoredGroup.children, 1);
            assert.equal(restoredGroup.children[0].type, 'GROUP');
            assert.lengthOf(restoredGroup.children[0].children, 2);
        });
        
        it('should round-trip all constraint types', () => {
            const doc = new NativeDocument();
            const objects = [
                createMockRectangle({ constraints: { horizontal: 'MIN', vertical: 'MIN' } }),
                createMockRectangle({ constraints: { horizontal: 'MAX', vertical: 'MAX' } }),
                createMockRectangle({ constraints: { horizontal: 'STRETCH', vertical: 'STRETCH' } }),
                createMockRectangle({ constraints: { horizontal: 'CENTER', vertical: 'CENTER' } }),
                createMockRectangle({ constraints: { horizontal: 'SCALE', vertical: 'SCALE' } })
            ];
            
            const serialized = objects.map(o => NativeDocument.serializeObjectV2(o));
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: serialized
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            const restoredObjects = restored.document.children[0].children;
            assert.equal(restoredObjects[0].constraints.horizontal, 'MIN');
            assert.equal(restoredObjects[1].constraints.horizontal, 'MAX');
            assert.equal(restoredObjects[2].constraints.horizontal, 'STRETCH');
            assert.equal(restoredObjects[3].constraints.horizontal, 'CENTER');
            assert.equal(restoredObjects[4].constraints.horizontal, 'SCALE');
        });
    });
    
    describe('Components Round-Trip', () => {
        it('should round-trip component definitions', () => {
            const doc = new NativeDocument();
            const component = createMockComponent();
            const serialized = NativeDocument.serializeObjectV2(component);
            
            // Add to components object
            doc.components[component.componentKey] = {
                key: component.componentKey,
                name: component.name,
                description: component.description
            };
            
            // Add serialized to page
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: [serialized]
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            assert.isDefined(restored.components[component.componentKey]);
            assert.equal(restored.components[component.componentKey].name, component.name);
        });
        
        it('should round-trip component instance with overrides', () => {
            const doc = new NativeDocument();
            const component = createMockComponent();
            const instance = createMockInstance(component.id, {
                overrides: {
                    'text:1': { characters: 'Modified Text' }
                }
            });
            
            const serializedInstance = NativeDocument.serializeObjectV2(instance);
            
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: [serializedInstance]
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            const restoredInstance = restored.document.children[0].children[0];
            assert.equal(restoredInstance.type, 'INSTANCE');
            assert.equal(restoredInstance.componentId, component.id);
            assert.deepEqual(restoredInstance.overrides, {
                'text:1': { characters: 'Modified Text' }
            });
        });
    });
    
    describe('Styles Round-Trip', () => {
        it('should round-trip style definitions', () => {
            const doc = new NativeDocument();
            
            doc.styles = {
                'S:fill1': {
                    key: 'S:fill1',
                    name: 'Primary Fill',
                    styleType: 'FILL',
                    fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.8, a: 1 } }]
                },
                'S:stroke1': {
                    key: 'S:stroke1',
                    name: 'Primary Stroke',
                    styleType: 'STROKE',
                    strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }],
                    strokeWeight: 2
                }
            };
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            assert.isDefined(restored.styles['S:fill1']);
            assert.equal(restored.styles['S:fill1'].name, 'Primary Fill');
            assert.equal(restored.styles['S:stroke1'].strokeWeight, 2);
        });
        
        it('should round-trip objects with style references', () => {
            const doc = new NativeDocument();
            
            doc.styles = {
                'S:fill1': {
                    key: 'S:fill1',
                    name: 'Primary Fill',
                    styleType: 'FILL',
                    fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 0.8, a: 1 } }]
                }
            };
            
            const rect = createMockRectangle({ fillStyleId: 'S:fill1' });
            const serialized = NativeDocument.serializeObjectV2(rect);
            
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: [serialized]
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            const restoredRect = restored.document.children[0].children[0];
            assert.equal(restoredRect.fillStyleId, 'S:fill1');
        });
    });
    
    describe('ASCII Properties Round-Trip', () => {
        it('should preserve ASCII rendering properties', () => {
            const doc = new NativeDocument();
            const rect = createMockRectangle({
                strokeChar: '█',
                fillChar: '░',
                lineStyle: 'double',
                strokeColor: '#ff0000',
                fillColor: '#00ff00'
            });
            const serialized = NativeDocument.serializeObjectV2(rect);
            
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: [serialized]
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            const restoredRect = restored.document.children[0].children[0];
            assert.equal(restoredRect.ascii.strokeChar, '█');
            assert.equal(restoredRect.ascii.fillChar, '░');
            assert.equal(restoredRect.ascii.lineStyle, 'double');
            assert.equal(restoredRect.ascii.strokeColor, '#ff0000');
            assert.equal(restoredRect.ascii.fillColor, '#00ff00');
        });
        
        it('should preserve table cell data', () => {
            const doc = new NativeDocument();
            const table = createMockTable();
            const serialized = NativeDocument.serializeObjectV2(table);
            
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: [serialized]
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            const restoredTable = restored.document.children[0].children[0];
            assert.deepEqual(restoredTable.ascii.cellData, [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']]);
        });
        
        it('should preserve connector waypoints', () => {
            const doc = new NativeDocument();
            const connector = createMockConnector({
                waypoints: [
                    { x: 150, y: 50 },
                    { x: 150, y: 100 },
                    { x: 200, y: 100 }
                ]
            });
            const serialized = NativeDocument.serializeObjectV2(connector);
            
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: [serialized]
            }];
            
            const json = doc.toJSONString();
            const restored = NativeDocument.fromJSON(json);
            
            const restoredConnector = restored.document.children[0].children[0];
            assert.lengthOf(restoredConnector.ascii.waypoints, 3);
            assert.equal(restoredConnector.ascii.waypoints[1].y, 100);
        });
    });
    
    describe('Double Round-Trip', () => {
        it('should survive multiple save/load cycles', () => {
            const doc = new NativeDocument();
            doc.name = 'Cycle Test';
            
            const frame = createMockFrame({
                children: [
                    createMockRectangle(),
                    createMockText(),
                    createMockGroup([createMockEllipse()])
                ]
            });
            const serialized = NativeDocument.serializeObjectV2(frame);
            
            doc.document.children = [{
                id: 'page:1',
                type: 'PAGE',
                name: 'Page 1',
                children: [serialized]
            }];
            
            // First round-trip
            let json = doc.toJSONString();
            let restored = NativeDocument.fromJSON(json);
            
            // Second round-trip
            json = restored.toJSONString();
            restored = NativeDocument.fromJSON(json);
            
            // Third round-trip
            json = restored.toJSONString();
            restored = NativeDocument.fromJSON(json);
            
            // Verify structure intact
            assert.equal(restored.name, 'Cycle Test');
            assert.lengthOf(restored.document.children, 1);
            assert.equal(restored.document.children[0].type, 'PAGE');
            
            const restoredFrame = restored.document.children[0].children[0];
            assert.equal(restoredFrame.type, 'FRAME');
            assert.lengthOf(restoredFrame.children, 3);
            assert.equal(restoredFrame.children[2].type, 'GROUP');
            assert.lengthOf(restoredFrame.children[2].children, 1);
        });
    });
});

// ==========================================
// VERSION DETECTION TESTS
// ==========================================

describe('Version Detection', () => {
    it('should detect v2 format', () => {
        const v2Data = {
            version: '2.0.0',
            document: {
                type: 'DOCUMENT',
                children: []
            }
        };
        
        assert.equal(detectVersion(v2Data), '2.0.0');
    });
    
    it('should detect v2 format without explicit version', () => {
        const v2Data = {
            document: {
                type: 'DOCUMENT',
                children: []
            }
        };
        
        assert.equal(detectVersion(v2Data), '2.0.0');
    });
    
    it('should return null for unknown format', () => {
        const unknownData = {
            foo: 'bar'
        };
        
        assert.isNull(detectVersion(unknownData));
    });
});
