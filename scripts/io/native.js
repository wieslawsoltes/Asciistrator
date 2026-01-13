/**
 * Asciistrator - Native Format I/O
 * 
 * Handles saving and loading of native .ascii format files.
 * The native format is JSON-based and preserves all document data.
 * 
 * Format v2.0 uses a Figma-compatible nested tree structure:
 * DOCUMENT → PAGE[] → objects (frames, groups, shapes)
 * 
 * Format v1.0 (legacy) uses flat layers + objects arrays.
 */

/**
 * Document version for format compatibility
 * v2.0.0 - Figma-compatible nested document structure
 * v1.0.0 - Legacy flat structure (still supported for reading)
 */
export const FORMAT_VERSION = '2.0.0';
export const SCHEMA_VERSION = 0;

/**
 * Constraint value mapping (v1 ↔ v2/Figma)
 */
export const ConstraintMapping = {
    // v1 to v2 (Figma)
    toV2: {
        horizontal: {
            'left': 'MIN',
            'right': 'MAX',
            'leftRight': 'STRETCH',
            'center': 'CENTER',
            'scale': 'SCALE'
        },
        vertical: {
            'top': 'MIN',
            'bottom': 'MAX',
            'topBottom': 'STRETCH',
            'center': 'CENTER',
            'scale': 'SCALE'
        }
    },
    // v2 (Figma) to v1
    toV1: {
        horizontal: {
            'MIN': 'left',
            'MAX': 'right',
            'STRETCH': 'leftRight',
            'CENTER': 'center',
            'SCALE': 'scale'
        },
        vertical: {
            'MIN': 'top',
            'MAX': 'bottom',
            'STRETCH': 'topBottom',
            'CENTER': 'center',
            'SCALE': 'scale'
        }
    }
};

/**
 * Type mapping (internal ↔ Figma)
 */
export const TypeMapping = {
    toFigma: {
        'rectangle': 'RECTANGLE',
        'ellipse': 'ELLIPSE',
        'line': 'LINE',
        'text': 'TEXT',
        'ascii-text': 'TEXT',
        'path': 'VECTOR',
        'polygon': 'REGULAR_POLYGON',
        'star': 'STAR',
        'group': 'GROUP',
        'frame': 'FRAME',
        'table': 'TABLE',
        'chart': 'CHART',
        'process': 'FLOWCHART_PROCESS',
        'terminal': 'FLOWCHART_TERMINAL',
        'decision': 'FLOWCHART_DECISION',
        'io': 'FLOWCHART_IO',
        'document': 'FLOWCHART_DOCUMENT',
        'database': 'FLOWCHART_DATABASE',
        'subprocess': 'FLOWCHART_SUBPROCESS',
        'connector': 'FLOWCHART_CONNECTOR',
        'connector-circle': 'FLOWCHART_CONNECTOR_CIRCLE'
    },
    fromFigma: {
        'RECTANGLE': 'rectangle',
        'ELLIPSE': 'ellipse',
        'LINE': 'line',
        'TEXT': 'text',
        'VECTOR': 'path',
        'REGULAR_POLYGON': 'polygon',
        'STAR': 'star',
        'GROUP': 'group',
        'FRAME': 'frame',
        'TABLE': 'table',
        'CHART': 'chart',
        'FLOWCHART_PROCESS': 'process',
        'FLOWCHART_TERMINAL': 'terminal',
        'FLOWCHART_DECISION': 'decision',
        'FLOWCHART_IO': 'io',
        'FLOWCHART_DOCUMENT': 'document',
        'FLOWCHART_DATABASE': 'database',
        'FLOWCHART_SUBPROCESS': 'subprocess',
        'FLOWCHART_CONNECTOR': 'connector',
        'FLOWCHART_CONNECTOR_CIRCLE': 'connector-circle'
    }
};

/**
 * Color conversion utilities
 */
export const ColorUtils = {
    /**
     * Convert hex color to Figma RGBA format
     * @param {string} hex - Hex color string (#rrggbb or #rgb)
     * @returns {object} Figma color { r, g, b, a }
     */
    hexToFigma(hex) {
        if (!hex) return null;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return {
                r: parseInt(result[1], 16) / 255,
                g: parseInt(result[2], 16) / 255,
                b: parseInt(result[3], 16) / 255,
                a: 1
            };
        }
        // Try short hex
        const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
        if (short) {
            return {
                r: parseInt(short[1] + short[1], 16) / 255,
                g: parseInt(short[2] + short[2], 16) / 255,
                b: parseInt(short[3] + short[3], 16) / 255,
                a: 1
            };
        }
        return null;
    },

    /**
     * Convert Figma RGBA to hex color
     * @param {object} color - Figma color { r, g, b, a }
     * @returns {string} Hex color string
     */
    figmaToHex(color) {
        if (!color) return null;
        const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
        return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    }
};

/**
 * Detect document version
 * @param {object} data - Parsed JSON data
 * @returns {string} Version string or null
 */
export function detectVersion(data) {
    // v2+ has nested document structure with type: DOCUMENT
    if (data.document?.type === 'DOCUMENT' || data.document?.children) {
        return data.version || '2.0.0';
    }
    // v1 has flat layers/objects arrays
    if (data.layers || data.objects) {
        return data.version || '1.0.0';
    }
    return null;
}

/**
 * Native format document structure (v2.0 - Figma-compatible)
 */
export class NativeDocument {
    constructor() {
        this.version = FORMAT_VERSION;
        this.schemaVersion = SCHEMA_VERSION;
        this.name = 'Untitled';
        this.lastModified = new Date().toISOString();
        
        // Nested document structure (Figma-style)
        this.document = {
            id: '0:0',
            type: 'DOCUMENT',
            name: 'Document',
            children: []  // Array of PAGE nodes
        };
        
        // Component definitions (inline, Figma-style)
        this.components = {};
        
        // Component sets (variants)
        this.componentSets = {};
        
        // Shared styles
        this.styles = {};
        
        // Metadata
        this.metadata = {
            title: 'Untitled',
            author: '',
            created: new Date().toISOString(),
            description: '',
            tags: [],
            exportVersion: 'Asciistrator 2.0'
        };
        
        // Component libraries (for backward compat, references external libs)
        this.componentLibraries = [];
    }

    /**
     * Create from app state (v2 format)
     * @param {object} appState - Application state
     * @param {object[]} layers - Layer data with objects
     * @returns {NativeDocument}
     */
    static fromAppState(appState, layers) {
        const doc = new NativeDocument();
        
        doc.name = appState.filename || 'Untitled';
        doc.lastModified = new Date().toISOString();
        doc.metadata.modified = doc.lastModified;
        doc.metadata.title = doc.name;
        
        // Convert each layer to a PAGE node
        doc.document.children = layers.map((layer, index) => {
            const pageId = `page:${layer.id !== undefined ? layer.id : index}`;
            
            const page = {
                id: pageId,
                type: 'PAGE',
                name: layer.name || `Page ${index + 1}`,
                visible: layer.visible !== false,
                locked: layer.locked || false,
                opacity: layer.opacity || 1,
                blendMode: (layer.blendMode || 'normal').toUpperCase(),
                
                // Canvas settings (ASCII-specific, per-page)
                canvasWidth: appState.canvasWidth || 120,
                canvasHeight: appState.canvasHeight || 60,
                charSet: appState.charSet || 'unicode',
                backgroundColor: ColorUtils.hexToFigma(appState.backgroundColor || '#1a1a2e'),
                
                // Children are the objects in this layer/page
                children: []
            };
            
            // Serialize objects as children of the page
            if (layer.objects && layer.objects.length > 0) {
                page.children = layer.objects.map(obj => 
                    NativeDocument.serializeObjectV2(obj)
                );
            }
            
            return page;
        });
        
        return doc;
    }

    /**
     * Serialize a scene object to v2 format (Figma-compatible)
     * @param {object} obj - SceneObject
     * @returns {object}
     */
    static serializeObjectV2(obj) {
        // Map internal type to Figma-style type
        const figmaType = TypeMapping.toFigma[obj.type] || obj.type.toUpperCase();
        
        // Base node structure
        const node = {
            id: obj.id,
            type: figmaType,
            name: obj.name || obj.type,
            visible: obj.visible !== false,
            locked: obj.locked || false,
            
            // Absolute bounding box
            absoluteBoundingBox: {
                x: obj.x || 0,
                y: obj.y || 0,
                width: obj.width || 1,
                height: obj.height || 1
            },
            
            // Transform (basic - rotation/scale)
            rotation: obj.rotation || 0,
            
            // Opacity and blend
            opacity: obj.opacity ?? 1,
            blendMode: (obj.blendMode || 'normal').toUpperCase(),
            
            // Fills (convert to Figma format)
            fills: NativeDocument._convertFillsToV2(obj),
            
            // Strokes (convert to Figma format)
            strokes: NativeDocument._convertStrokesToV2(obj),
            strokeWeight: obj.stroke?.weight || 1,
            strokeAlign: (obj.stroke?.align || 'center').toUpperCase(),
            strokeCap: (obj.stroke?.cap || 'none').toUpperCase(),
            strokeJoin: (obj.stroke?.join || 'miter').toUpperCase(),
            strokeDashes: obj.stroke?.dashPattern || [],
            strokeMiterAngle: obj.stroke?.miterLimit ? Math.atan(1 / obj.stroke.miterLimit) * (180 / Math.PI) * 2 : 28.96,
            
            // Corner radius
            cornerRadius: NativeDocument._serializeCornerRadius(obj.cornerRadius),
            
            // Effects
            effects: obj.effects || [],
            
            // Constraints (convert to Figma naming)
            constraints: {
                horizontal: ConstraintMapping.toV2.horizontal[obj.constraints?.horizontal] || 'MIN',
                vertical: ConstraintMapping.toV2.vertical[obj.constraints?.vertical] || 'MIN'
            },
            
            // Clipping
            clipsContent: obj.clipContent || false,
            
            // Children (recursive)
            children: (obj.children || []).map(c => NativeDocument.serializeObjectV2(c)),
            
            // ASCII-specific properties (namespaced to preserve)
            ascii: {
                strokeChar: obj.strokeChar || '*',
                fillChar: obj.fillChar || '',
                lineStyle: obj.lineStyle || 'single',
                strokeColor: obj.strokeColor,
                fillColor: obj.fillColor
            }
        };
        
        // Add layout properties if auto layout is enabled or it's a frame
        if (obj.autoLayout?.enabled || obj.type === 'frame') {
            Object.assign(node, NativeDocument._serializeLayoutPropertiesV2(obj));
        }
        
        // Add sizing properties
        if (obj.sizing) {
            node.primaryAxisSizingMode = obj.sizing.horizontal === 'hug' ? 'AUTO' : 'FIXED';
            node.counterAxisSizingMode = obj.sizing.vertical === 'hug' ? 'AUTO' : 'FIXED';
            node.minWidth = obj.sizing.minWidth;
            node.maxWidth = obj.sizing.maxWidth;
            node.minHeight = obj.sizing.minHeight;
            node.maxHeight = obj.sizing.maxHeight;
        }
        
        // Add layout sizing (for children in auto layout)
        if (obj._layoutSizing) {
            node.layoutAlign = obj._layoutSizing.vertical === 'fill' ? 'STRETCH' : 'INHERIT';
            node.layoutGrow = obj._layoutSizing.horizontal === 'fill' ? 1 : 0;
        }
        
        // Type-specific properties
        NativeDocument._addTypeSpecificPropertiesV2(obj, node);
        
        // UI Component properties
        if (obj.uiComponentType) {
            node.uiComponentType = obj.uiComponentType;
            node.uiProperties = obj.uiProperties || {};
            node.uiRenderWidth = obj.uiRenderWidth;
            node.uiRenderHeight = obj.uiRenderHeight;
        }
        if (obj.avaloniaType && !obj.uiComponentType) {
            node.avaloniaType = obj.avaloniaType;
            node.avaloniaProperties = obj.avaloniaProperties || {};
        }
        
        return node;
    }
    
    /**
     * Convert fills to v2 format
     */
    static _convertFillsToV2(obj) {
        // If already has fills array, convert colors
        if (obj.fills && obj.fills.length > 0) {
            return obj.fills.map(fill => ({
                ...fill,
                color: fill.color ? (typeof fill.color === 'string' ? ColorUtils.hexToFigma(fill.color) : fill.color) : null
            }));
        }
        
        // Convert legacy fillColor
        if (obj.fillColor) {
            return [{
                type: 'SOLID',
                visible: true,
                opacity: 1,
                blendMode: 'NORMAL',
                color: ColorUtils.hexToFigma(obj.fillColor)
            }];
        }
        
        return [];
    }
    
    /**
     * Convert strokes to v2 format
     */
    static _convertStrokesToV2(obj) {
        // If has stroke object with color
        if (obj.stroke?.color) {
            return [{
                type: 'SOLID',
                visible: obj.stroke.visible !== false,
                opacity: obj.stroke.opacity ?? 1,
                blendMode: 'NORMAL',
                color: typeof obj.stroke.color === 'string' ? ColorUtils.hexToFigma(obj.stroke.color) : obj.stroke.color
            }];
        }
        
        // Convert legacy strokeColor
        if (obj.strokeColor) {
            return [{
                type: 'SOLID',
                visible: true,
                opacity: 1,
                blendMode: 'NORMAL',
                color: ColorUtils.hexToFigma(obj.strokeColor)
            }];
        }
        
        return [];
    }
    
    /**
     * Serialize corner radius
     */
    static _serializeCornerRadius(cornerRadius) {
        if (!cornerRadius) return 0;
        if (typeof cornerRadius === 'number') return cornerRadius;
        if (cornerRadius.independent) {
            return [
                cornerRadius.topLeft || 0,
                cornerRadius.topRight || 0,
                cornerRadius.bottomRight || 0,
                cornerRadius.bottomLeft || 0
            ];
        }
        return cornerRadius.topLeft || 0;
    }
    
    /**
     * Serialize layout properties to v2 format (Figma-style flat properties)
     */
    static _serializeLayoutPropertiesV2(obj) {
        const al = obj.autoLayout || {};
        const padding = al.padding || obj.padding || { top: 0, right: 0, bottom: 0, left: 0 };
        
        return {
            // Layout mode
            layoutMode: al.enabled ? (al.direction === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL') : 'NONE',
            
            // Alignment on primary axis
            primaryAxisAlignItems: NativeDocument._mapAlignmentToFigma(al.alignment, al.distribution),
            
            // Alignment on counter axis
            counterAxisAlignItems: NativeDocument._mapCounterAlignmentToFigma(al.alignment),
            
            // Padding (individual properties)
            paddingLeft: padding.left || 0,
            paddingRight: padding.right || 0,
            paddingTop: padding.top || 0,
            paddingBottom: padding.bottom || 0,
            
            // Spacing
            itemSpacing: al.spacing || 0,
            counterAxisSpacing: al.counterSpacing || al.wrapSpacing || 0,
            
            // Wrap
            layoutWrap: al.wrap ? 'WRAP' : 'NO_WRAP',
            
            // Reverse
            itemReverseZIndex: al.reversed || false,
            
            // Distribution (stored for round-trip)
            _distribution: al.distribution || 'packed'
        };
    }
    
    /**
     * Map alignment to Figma primary axis value
     */
    static _mapAlignmentToFigma(alignment, distribution) {
        if (distribution === 'space-between') return 'SPACE_BETWEEN';
        if (distribution === 'space-around') return 'SPACE_AROUND';
        if (distribution === 'space-evenly') return 'SPACE_EVENLY';
        
        switch (alignment) {
            case 'start': return 'MIN';
            case 'center': return 'CENTER';
            case 'end': return 'MAX';
            case 'stretch': return 'MIN';  // Stretch is handled differently
            case 'baseline': return 'BASELINE';
            default: return 'MIN';
        }
    }
    
    /**
     * Map alignment to Figma counter axis value
     */
    static _mapCounterAlignmentToFigma(alignment) {
        switch (alignment) {
            case 'start': return 'MIN';
            case 'center': return 'CENTER';
            case 'end': return 'MAX';
            case 'stretch': return 'STRETCH';
            case 'baseline': return 'BASELINE';
            default: return 'MIN';
        }
    }
    
    /**
     * Add type-specific properties to v2 node
     */
    static _addTypeSpecificPropertiesV2(obj, node) {
        switch (obj.type) {
            case 'text':
            case 'ascii-text':
                node.characters = obj.text || '';
                node.fontFamily = obj.fontFamily;
                node.fontSize = obj.fontSize;
                node.ascii.isAsciiText = obj.type === 'ascii-text';
                break;
                
            case 'line':
                node.x1 = obj.x1;
                node.y1 = obj.y1;
                node.x2 = obj.x2;
                node.y2 = obj.y2;
                // Update bounding box for lines
                node.absoluteBoundingBox = {
                    x: Math.min(obj.x1 || 0, obj.x2 || 0),
                    y: Math.min(obj.y1 || 0, obj.y2 || 0),
                    width: Math.abs((obj.x2 || 0) - (obj.x1 || 0)) || 1,
                    height: Math.abs((obj.y2 || 0) - (obj.y1 || 0)) || 1
                };
                break;
                
            case 'ellipse':
                node.radiusX = obj.radiusX;
                node.radiusY = obj.radiusY;
                // Ellipse uses center + radii
                node.absoluteBoundingBox = {
                    x: (obj.x || 0) - (obj.radiusX || 0),
                    y: (obj.y || 0) - (obj.radiusY || 0),
                    width: (obj.radiusX || 1) * 2,
                    height: (obj.radiusY || 1) * 2
                };
                break;
                
            case 'polygon':
                node.sides = obj.sides || 3;
                node.polygonPoints = obj.points ? [...obj.points] : undefined;
                node.cx = obj.cx;
                node.cy = obj.cy;
                node.radius = obj.radius;
                break;
                
            case 'star':
                node.starPoints = obj.points || obj.numPoints || 5;
                node.innerRadius = obj.innerRadius;
                node.outerRadius = obj.outerRadius;
                node.cx = obj.cx;
                node.cy = obj.cy;
                break;
                
            case 'path':
                node.pathCommands = obj.commands ? [...obj.commands] : undefined;
                node.segments = obj.segments;
                break;
                
            case 'frame':
                node.showBorder = obj.showBorder;
                node.borderStyle = obj.borderStyle;
                node.backgroundColor = obj.backgroundColor ? ColorUtils.hexToFigma(obj.backgroundColor) : null;
                node.backgroundChar = obj.backgroundChar;
                node.title = obj.title;
                node.autoSize = obj.autoSize;
                break;
                
            case 'table':
                node.cols = obj.cols;
                node.rows = obj.rows;
                node.cellData = obj.cellData;
                node.columnWidths = obj.columnWidths;
                node.rowHeights = obj.rowHeights;
                break;
                
            case 'chart':
                node.chartType = obj.chartType;
                node.chartData = obj.chartData;
                node.chartOptions = obj.chartOptions;
                break;
                
            // Flowchart shapes
            case 'process':
            case 'terminal':
            case 'decision':
            case 'io':
            case 'document':
            case 'database':
            case 'subprocess':
            case 'connector-circle':
                node.label = obj.label;
                node.labelColor = obj.labelColor;
                node.flowchartType = obj.type;  // Preserve original type
                break;
                
            case 'connector':
                node.fromShapeId = obj.fromShapeId;
                node.fromSnapPoint = obj.fromSnapPoint;
                node.toShapeId = obj.toShapeId;
                node.toSnapPoint = obj.toSnapPoint;
                node.startX = obj.startX;
                node.startY = obj.startY;
                node.endX = obj.endX;
                node.endY = obj.endY;
                node.connectorStyle = obj.connectorStyle;
                node.lineType = obj.lineType;
                node.arrowStart = obj.arrowStart;
                node.arrowEnd = obj.arrowEnd;
                node.waypoints = obj.waypoints;
                break;
        }
    }

    /**
     * Serialize a scene object to v1 format (legacy, for backward compat)
     * @param {object} obj - SceneObject
     * @returns {object}
     */
    static serializeObject(obj) {
        // Base properties
        const data = {
            id: obj.id,
            type: obj.type,
            name: obj.name,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            rotation: obj.rotation,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            strokeChar: obj.strokeChar,
            fillChar: obj.fillChar,
            strokeColor: obj.strokeColor,
            fillColor: obj.fillColor,
            lineStyle: obj.lineStyle,
            visible: obj.visible,
            locked: obj.locked,
            opacity: obj.opacity
        };
        
        // UI Component properties (framework-agnostic)
        if (obj.uiComponentType) {
            data.uiComponentType = obj.uiComponentType;
            data.uiProperties = obj.uiProperties || {};
            data.uiRenderWidth = obj.uiRenderWidth;
            data.uiRenderHeight = obj.uiRenderHeight;
        }
        // Legacy Avalonia type support
        if (obj.avaloniaType && !obj.uiComponentType) {
            data.avaloniaType = obj.avaloniaType;
            data.avaloniaProperties = obj.avaloniaProperties || {};
        }

        // Type-specific properties
        switch (obj.type) {
            case 'text':
                data.text = obj.text;
                data.fontFamily = obj.fontFamily;
                data.fontSize = obj.fontSize;
                break;
                
            case 'line':
                data.x1 = obj.x1;
                data.y1 = obj.y1;
                data.x2 = obj.x2;
                data.y2 = obj.y2;
                break;
                
            case 'ellipse':
                data.radiusX = obj.radiusX;
                data.radiusY = obj.radiusY;
                break;
                
            case 'polygon':
                data.sides = obj.sides;
                data.points = obj.points ? [...obj.points] : undefined;
                break;
                
            case 'star':
                data.points = obj.points;
                data.innerRadius = obj.innerRadius;
                data.outerRadius = obj.outerRadius;
                break;
                
            case 'path':
                data.commands = obj.commands ? [...obj.commands] : undefined;
                data.segments = obj.segments;
                break;
                
            case 'group':
                data.children = obj.children ? obj.children.map(c => NativeDocument.serializeObject(c)) : [];
                break;
                
            // Flowchart shapes
            case 'process':
            case 'terminal':
            case 'decision':
            case 'io':
            case 'document':
            case 'database':
            case 'subprocess':
            case 'connector-circle':
                data.label = obj.label;
                data.labelColor = obj.labelColor;
                break;
                
            case 'connector':
                data.fromShapeId = obj.fromShapeId;
                data.fromSnapPoint = obj.fromSnapPoint;
                data.toShapeId = obj.toShapeId;
                data.toSnapPoint = obj.toSnapPoint;
                data.startX = obj.startX;
                data.startY = obj.startY;
                data.endX = obj.endX;
                data.endY = obj.endY;
                data.connectorStyle = obj.connectorStyle;
                data.lineType = obj.lineType;
                data.arrowStart = obj.arrowStart;
                data.arrowEnd = obj.arrowEnd;
                data.waypoints = obj.waypoints;
                break;
        }

        return data;
    }

    /**
     * Export to JSON string (v2 format)
     * @param {boolean} pretty - Pretty print
     * @returns {string}
     */
    toJSONString(pretty = true) {
        const data = {
            version: this.version,
            schemaVersion: this.schemaVersion,
            name: this.name,
            lastModified: this.lastModified,
            document: this.document,
            components: this.components,
            componentSets: this.componentSets,
            styles: this.styles,
            metadata: this.metadata,
            componentLibraries: this.componentLibraries
        };
        return JSON.stringify(data, null, pretty ? 2 : 0);
    }

    /**
     * Parse from JSON string (handles both v1 and v2 formats)
     * @param {string} json - JSON string
     * @returns {NativeDocument}
     */
    static fromJSON(json) {
        const data = JSON.parse(json);
        const version = detectVersion(data);
        
        if (!version) {
            throw new Error('Unknown document format');
        }
        
        // Check if v1 format needs migration
        if (version.startsWith('1.')) {
            console.log(`Migrating document from v${version} to v${FORMAT_VERSION}`);
            return NativeDocument.migrateV1ToV2(data);
        }
        
        // v2 format - direct load
        const doc = new NativeDocument();
        
        doc.version = data.version || FORMAT_VERSION;
        doc.schemaVersion = data.schemaVersion || SCHEMA_VERSION;
        doc.name = data.name || 'Untitled';
        doc.lastModified = data.lastModified || new Date().toISOString();
        
        // Copy document structure
        if (data.document) {
            doc.document = data.document;
        }
        
        // Copy components
        if (data.components) {
            doc.components = data.components;
        }
        
        // Copy component sets
        if (data.componentSets) {
            doc.componentSets = data.componentSets;
        }
        
        // Copy styles
        if (data.styles) {
            doc.styles = data.styles;
        }
        
        // Copy metadata
        if (data.metadata) {
            doc.metadata = { ...doc.metadata, ...data.metadata };
        }
        
        // Copy component libraries
        if (data.componentLibraries) {
            doc.componentLibraries = data.componentLibraries;
        }
        
        return doc;
    }
    
    /**
     * Migrate v1 document to v2 format
     * @param {object} v1Data - v1 format data
     * @returns {NativeDocument}
     */
    static migrateV1ToV2(v1Data) {
        const doc = new NativeDocument();
        
        doc.version = FORMAT_VERSION;
        doc.schemaVersion = SCHEMA_VERSION;
        doc.name = v1Data.metadata?.title || 'Untitled';
        doc.lastModified = v1Data.metadata?.modified || new Date().toISOString();
        
        // Copy metadata
        if (v1Data.metadata) {
            doc.metadata = { ...doc.metadata, ...v1Data.metadata };
        }
        
        // Build object map by layerId for efficient lookup
        const objectsByLayer = new Map();
        if (v1Data.objects && Array.isArray(v1Data.objects)) {
            for (const obj of v1Data.objects) {
                const layerId = obj.layerId !== undefined ? obj.layerId : 0;
                if (!objectsByLayer.has(layerId)) {
                    objectsByLayer.set(layerId, []);
                }
                objectsByLayer.get(layerId).push(obj);
            }
        }
        
        // Convert layers to pages
        const layers = v1Data.layers || [{ id: 0, name: 'Layer 1', visible: true, locked: false }];
        
        doc.document.children = layers.map((layer, index) => {
            const pageId = `page:${layer.id !== undefined ? layer.id : index}`;
            const layerObjects = objectsByLayer.get(layer.id) || objectsByLayer.get(index) || [];
            
            const page = {
                id: pageId,
                type: 'PAGE',
                name: layer.name || `Page ${index + 1}`,
                visible: layer.visible !== false,
                locked: layer.locked || false,
                opacity: layer.opacity || 1,
                blendMode: (layer.blendMode || 'normal').toUpperCase(),
                
                // Canvas settings from v1 document
                canvasWidth: v1Data.document?.width || 120,
                canvasHeight: v1Data.document?.height || 60,
                charSet: v1Data.document?.charSet || 'unicode',
                backgroundColor: ColorUtils.hexToFigma(v1Data.document?.backgroundColor || '#1a1a2e'),
                
                // Convert objects to v2 format
                children: layerObjects.map(obj => NativeDocument.convertObjectV1ToV2(obj))
            };
            
            return page;
        });
        
        // Copy component libraries
        if (v1Data.componentLibraries) {
            doc.componentLibraries = v1Data.componentLibraries;
        }
        
        // Copy styles
        if (v1Data.styles) {
            doc.styles = v1Data.styles;
        }
        
        return doc;
    }
    
    /**
     * Convert a v1 object to v2 format
     * @param {object} v1Obj - v1 format object
     * @returns {object} v2 format object
     */
    static convertObjectV1ToV2(v1Obj) {
        // Map internal type to Figma-style type
        const figmaType = TypeMapping.toFigma[v1Obj.type] || v1Obj.type.toUpperCase();
        
        // Base node structure
        const node = {
            id: v1Obj.id,
            type: figmaType,
            name: v1Obj.name || v1Obj.type,
            visible: v1Obj.visible !== false,
            locked: v1Obj.locked || false,
            
            // Absolute bounding box
            absoluteBoundingBox: {
                x: v1Obj.x || 0,
                y: v1Obj.y || 0,
                width: v1Obj.width || 1,
                height: v1Obj.height || 1
            },
            
            // Transform
            rotation: v1Obj.rotation || 0,
            
            // Opacity and blend
            opacity: v1Obj.opacity ?? 1,
            blendMode: (v1Obj.blendMode || 'normal').toUpperCase(),
            
            // Fills (convert to Figma format)
            fills: v1Obj.fillColor ? [{
                type: 'SOLID',
                visible: true,
                opacity: 1,
                blendMode: 'NORMAL',
                color: ColorUtils.hexToFigma(v1Obj.fillColor)
            }] : (v1Obj.fills || []),
            
            // Strokes (convert to Figma format)
            strokes: v1Obj.strokeColor ? [{
                type: 'SOLID',
                visible: true,
                opacity: 1,
                blendMode: 'NORMAL',
                color: ColorUtils.hexToFigma(v1Obj.strokeColor)
            }] : (v1Obj.strokes || []),
            
            strokeWeight: v1Obj.stroke?.weight || 1,
            strokeAlign: (v1Obj.stroke?.align || 'center').toUpperCase(),
            
            // Effects
            effects: v1Obj.effects || [],
            
            // Constraints (convert to Figma naming)
            constraints: {
                horizontal: ConstraintMapping.toV2.horizontal[v1Obj.constraints?.horizontal] || 'MIN',
                vertical: ConstraintMapping.toV2.vertical[v1Obj.constraints?.vertical] || 'MIN'
            },
            
            // Clipping
            clipsContent: v1Obj.clipContent || false,
            
            // Children (recursive)
            children: (v1Obj.children || []).map(c => NativeDocument.convertObjectV1ToV2(c)),
            
            // ASCII-specific properties (namespaced)
            ascii: {
                strokeChar: v1Obj.strokeChar || '*',
                fillChar: v1Obj.fillChar || '',
                lineStyle: v1Obj.lineStyle || 'single',
                strokeColor: v1Obj.strokeColor,
                fillColor: v1Obj.fillColor
            }
        };
        
        // Add layout properties if present
        if (v1Obj.autoLayout) {
            const al = v1Obj.autoLayout;
            const padding = al.padding || { top: 0, right: 0, bottom: 0, left: 0 };
            
            node.layoutMode = al.enabled ? (al.direction === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL') : 'NONE';
            node.primaryAxisAlignItems = NativeDocument._mapAlignmentToFigma(al.alignment, al.distribution);
            node.counterAxisAlignItems = NativeDocument._mapCounterAlignmentToFigma(al.alignment);
            node.paddingLeft = padding.left || 0;
            node.paddingRight = padding.right || 0;
            node.paddingTop = padding.top || 0;
            node.paddingBottom = padding.bottom || 0;
            node.itemSpacing = al.spacing || 0;
            node.counterAxisSpacing = al.counterSpacing || al.wrapSpacing || 0;
            node.layoutWrap = al.wrap ? 'WRAP' : 'NO_WRAP';
            node.itemReverseZIndex = al.reversed || false;
            node._distribution = al.distribution || 'packed';
        }
        
        // Add sizing properties
        if (v1Obj.sizing) {
            node.primaryAxisSizingMode = v1Obj.sizing.horizontal === 'hug' ? 'AUTO' : 'FIXED';
            node.counterAxisSizingMode = v1Obj.sizing.vertical === 'hug' ? 'AUTO' : 'FIXED';
            node.minWidth = v1Obj.sizing.minWidth;
            node.maxWidth = v1Obj.sizing.maxWidth;
            node.minHeight = v1Obj.sizing.minHeight;
            node.maxHeight = v1Obj.sizing.maxHeight;
        }
        
        // Add layout sizing
        if (v1Obj._layoutSizing) {
            node.layoutAlign = v1Obj._layoutSizing.vertical === 'fill' ? 'STRETCH' : 'INHERIT';
            node.layoutGrow = v1Obj._layoutSizing.horizontal === 'fill' ? 1 : 0;
        }
        
        // Type-specific properties
        switch (v1Obj.type) {
            case 'text':
            case 'ascii-text':
                node.characters = v1Obj.text || '';
                node.fontFamily = v1Obj.fontFamily;
                node.fontSize = v1Obj.fontSize;
                node.ascii.isAsciiText = v1Obj.type === 'ascii-text';
                break;
                
            case 'line':
                node.x1 = v1Obj.x1;
                node.y1 = v1Obj.y1;
                node.x2 = v1Obj.x2;
                node.y2 = v1Obj.y2;
                node.absoluteBoundingBox = {
                    x: Math.min(v1Obj.x1 || 0, v1Obj.x2 || 0),
                    y: Math.min(v1Obj.y1 || 0, v1Obj.y2 || 0),
                    width: Math.abs((v1Obj.x2 || 0) - (v1Obj.x1 || 0)) || 1,
                    height: Math.abs((v1Obj.y2 || 0) - (v1Obj.y1 || 0)) || 1
                };
                break;
                
            case 'ellipse':
                node.radiusX = v1Obj.radiusX;
                node.radiusY = v1Obj.radiusY;
                node.absoluteBoundingBox = {
                    x: (v1Obj.x || 0) - (v1Obj.radiusX || 0),
                    y: (v1Obj.y || 0) - (v1Obj.radiusY || 0),
                    width: (v1Obj.radiusX || 1) * 2,
                    height: (v1Obj.radiusY || 1) * 2
                };
                break;
                
            case 'polygon':
                node.sides = v1Obj.sides || 3;
                node.polygonPoints = v1Obj.points ? [...v1Obj.points] : undefined;
                node.cx = v1Obj.cx;
                node.cy = v1Obj.cy;
                node.radius = v1Obj.radius;
                break;
                
            case 'star':
                node.starPoints = v1Obj.points || v1Obj.numPoints || 5;
                node.innerRadius = v1Obj.innerRadius;
                node.outerRadius = v1Obj.outerRadius;
                node.cx = v1Obj.cx;
                node.cy = v1Obj.cy;
                break;
                
            case 'path':
                node.pathCommands = v1Obj.commands ? [...v1Obj.commands] : undefined;
                node.segments = v1Obj.segments;
                break;
                
            case 'frame':
                node.showBorder = v1Obj.showBorder;
                node.borderStyle = v1Obj.borderStyle;
                node.backgroundColor = v1Obj.backgroundColor ? ColorUtils.hexToFigma(v1Obj.backgroundColor) : null;
                node.backgroundChar = v1Obj.backgroundChar;
                node.title = v1Obj.title;
                node.autoSize = v1Obj.autoSize;
                break;
                
            case 'table':
                node.cols = v1Obj.cols;
                node.rows = v1Obj.rows;
                node.cellData = v1Obj.cellData;
                node.columnWidths = v1Obj.columnWidths;
                node.rowHeights = v1Obj.rowHeights;
                break;
                
            case 'chart':
                node.chartType = v1Obj.chartType;
                node.chartData = v1Obj.chartData;
                node.chartOptions = v1Obj.chartOptions;
                break;
                
            // Flowchart shapes
            case 'process':
            case 'terminal':
            case 'decision':
            case 'io':
            case 'document':
            case 'database':
            case 'subprocess':
            case 'connector-circle':
                node.label = v1Obj.label;
                node.labelColor = v1Obj.labelColor;
                node.flowchartType = v1Obj.type;
                break;
                
            case 'connector':
                node.fromShapeId = v1Obj.fromShapeId;
                node.fromSnapPoint = v1Obj.fromSnapPoint;
                node.toShapeId = v1Obj.toShapeId;
                node.toSnapPoint = v1Obj.toSnapPoint;
                node.startX = v1Obj.startX;
                node.startY = v1Obj.startY;
                node.endX = v1Obj.endX;
                node.endY = v1Obj.endY;
                node.connectorStyle = v1Obj.connectorStyle;
                node.lineType = v1Obj.lineType;
                node.arrowStart = v1Obj.arrowStart;
                node.arrowEnd = v1Obj.arrowEnd;
                node.waypoints = v1Obj.waypoints;
                break;
        }
        
        // UI Component properties
        if (v1Obj.uiComponentType) {
            node.uiComponentType = v1Obj.uiComponentType;
            node.uiProperties = v1Obj.uiProperties || {};
            node.uiRenderWidth = v1Obj.uiRenderWidth;
            node.uiRenderHeight = v1Obj.uiRenderHeight;
        }
        if (v1Obj.avaloniaType && !v1Obj.uiComponentType) {
            node.avaloniaType = v1Obj.avaloniaType;
            node.avaloniaProperties = v1Obj.avaloniaProperties || {};
        }
        
        return node;
    }
    
    /**
     * Convert v2 document back to v1 format (for backward compat export)
     * @returns {object} v1 format data
     */
    toV1Format() {
        const v1Data = {
            version: '1.0.0',
            metadata: { ...this.metadata },
            document: {
                width: 120,
                height: 60,
                charSet: 'unicode',
                backgroundColor: '#1a1a2e'
            },
            layers: [],
            objects: [],
            symbols: [],
            styles: this.styles,
            componentLibraries: this.componentLibraries
        };
        
        // Convert pages to layers
        for (const page of this.document.children || []) {
            if (page.type !== 'PAGE') continue;
            
            // Extract layer ID from page ID
            const layerIdMatch = page.id.match(/page:(\d+)/);
            const layerId = layerIdMatch ? parseInt(layerIdMatch[1]) : v1Data.layers.length;
            
            // Update document settings from first page
            if (v1Data.layers.length === 0) {
                v1Data.document.width = page.canvasWidth || 120;
                v1Data.document.height = page.canvasHeight || 60;
                v1Data.document.charSet = page.charSet || 'unicode';
                v1Data.document.backgroundColor = page.backgroundColor ? ColorUtils.figmaToHex(page.backgroundColor) : '#1a1a2e';
            }
            
            const layer = {
                id: layerId,
                name: page.name || `Layer ${layerId + 1}`,
                visible: page.visible !== false,
                locked: page.locked || false,
                opacity: page.opacity || 1,
                blendMode: (page.blendMode || 'NORMAL').toLowerCase()
            };
            v1Data.layers.push(layer);
            
            // Convert objects back to v1 format
            for (const node of page.children || []) {
                const obj = NativeDocument.convertObjectV2ToV1(node);
                obj.layerId = layerId;
                v1Data.objects.push(obj);
            }
        }
        
        return v1Data;
    }
    
    /**
     * Convert a v2 object back to v1 format
     * @param {object} v2Node - v2 format node
     * @returns {object} v1 format object
     */
    static convertObjectV2ToV1(v2Node) {
        // Map Figma type back to internal type
        const internalType = TypeMapping.fromFigma[v2Node.type] || v2Node.flowchartType || v2Node.type.toLowerCase();
        
        const obj = {
            id: v2Node.id,
            type: internalType,
            name: v2Node.name,
            x: v2Node.absoluteBoundingBox?.x || 0,
            y: v2Node.absoluteBoundingBox?.y || 0,
            width: v2Node.absoluteBoundingBox?.width || 1,
            height: v2Node.absoluteBoundingBox?.height || 1,
            rotation: v2Node.rotation || 0,
            visible: v2Node.visible !== false,
            locked: v2Node.locked || false,
            opacity: v2Node.opacity ?? 1,
            blendMode: (v2Node.blendMode || 'NORMAL').toLowerCase(),
            
            // Restore ASCII properties
            strokeChar: v2Node.ascii?.strokeChar || '*',
            fillChar: v2Node.ascii?.fillChar || '',
            lineStyle: v2Node.ascii?.lineStyle || 'single',
            strokeColor: v2Node.ascii?.strokeColor || (v2Node.strokes?.[0]?.color ? ColorUtils.figmaToHex(v2Node.strokes[0].color) : null),
            fillColor: v2Node.ascii?.fillColor || (v2Node.fills?.[0]?.color ? ColorUtils.figmaToHex(v2Node.fills[0].color) : null),
            
            // Constraints (convert back to v1 naming)
            constraints: {
                horizontal: ConstraintMapping.toV1.horizontal[v2Node.constraints?.horizontal] || 'left',
                vertical: ConstraintMapping.toV1.vertical[v2Node.constraints?.vertical] || 'top'
            },
            
            clipContent: v2Node.clipsContent || false,
            
            // Children (recursive)
            children: (v2Node.children || []).map(c => NativeDocument.convertObjectV2ToV1(c))
        };
        
        // Restore auto layout
        if (v2Node.layoutMode && v2Node.layoutMode !== 'NONE') {
            obj.autoLayout = {
                enabled: true,
                direction: v2Node.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
                spacing: v2Node.itemSpacing || 0,
                padding: {
                    top: v2Node.paddingTop || 0,
                    right: v2Node.paddingRight || 0,
                    bottom: v2Node.paddingBottom || 0,
                    left: v2Node.paddingLeft || 0
                },
                alignment: NativeDocument._mapFigmaAlignmentToV1(v2Node.counterAxisAlignItems),
                distribution: v2Node._distribution || NativeDocument._mapFigmaDistributionToV1(v2Node.primaryAxisAlignItems),
                wrap: v2Node.layoutWrap === 'WRAP',
                wrapSpacing: v2Node.counterAxisSpacing || 0,
                reversed: v2Node.itemReverseZIndex || false
            };
        }
        
        // Restore sizing
        if (v2Node.primaryAxisSizingMode || v2Node.counterAxisSizingMode) {
            obj.sizing = {
                horizontal: v2Node.primaryAxisSizingMode === 'AUTO' ? 'hug' : 'fixed',
                vertical: v2Node.counterAxisSizingMode === 'AUTO' ? 'hug' : 'fixed',
                minWidth: v2Node.minWidth,
                maxWidth: v2Node.maxWidth,
                minHeight: v2Node.minHeight,
                maxHeight: v2Node.maxHeight
            };
        }
        
        // Restore layout sizing
        if (v2Node.layoutAlign || v2Node.layoutGrow) {
            obj._layoutSizing = {
                horizontal: v2Node.layoutGrow > 0 ? 'fill' : 'fixed',
                vertical: v2Node.layoutAlign === 'STRETCH' ? 'fill' : 'fixed'
            };
        }
        
        // Type-specific properties
        switch (internalType) {
            case 'text':
            case 'ascii-text':
                obj.text = v2Node.characters || '';
                obj.fontFamily = v2Node.fontFamily;
                obj.fontSize = v2Node.fontSize;
                if (v2Node.ascii?.isAsciiText) obj.type = 'ascii-text';
                break;
                
            case 'line':
                obj.x1 = v2Node.x1;
                obj.y1 = v2Node.y1;
                obj.x2 = v2Node.x2;
                obj.y2 = v2Node.y2;
                break;
                
            case 'ellipse':
                obj.radiusX = v2Node.radiusX;
                obj.radiusY = v2Node.radiusY;
                // Restore center-based coords
                obj.x = (v2Node.absoluteBoundingBox?.x || 0) + (v2Node.radiusX || 0);
                obj.y = (v2Node.absoluteBoundingBox?.y || 0) + (v2Node.radiusY || 0);
                break;
                
            case 'polygon':
                obj.sides = v2Node.sides;
                obj.points = v2Node.polygonPoints;
                obj.cx = v2Node.cx;
                obj.cy = v2Node.cy;
                obj.radius = v2Node.radius;
                break;
                
            case 'star':
                obj.points = v2Node.starPoints;
                obj.numPoints = v2Node.starPoints;
                obj.innerRadius = v2Node.innerRadius;
                obj.outerRadius = v2Node.outerRadius;
                obj.cx = v2Node.cx;
                obj.cy = v2Node.cy;
                break;
                
            case 'path':
                obj.commands = v2Node.pathCommands;
                obj.segments = v2Node.segments;
                break;
                
            case 'frame':
                obj.showBorder = v2Node.showBorder;
                obj.borderStyle = v2Node.borderStyle;
                obj.backgroundColor = v2Node.backgroundColor ? ColorUtils.figmaToHex(v2Node.backgroundColor) : null;
                obj.backgroundChar = v2Node.backgroundChar;
                obj.title = v2Node.title;
                obj.autoSize = v2Node.autoSize;
                break;
                
            case 'table':
                obj.cols = v2Node.cols;
                obj.rows = v2Node.rows;
                obj.cellData = v2Node.cellData;
                obj.columnWidths = v2Node.columnWidths;
                obj.rowHeights = v2Node.rowHeights;
                break;
                
            case 'chart':
                obj.chartType = v2Node.chartType;
                obj.chartData = v2Node.chartData;
                obj.chartOptions = v2Node.chartOptions;
                break;
                
            // Flowchart shapes
            case 'process':
            case 'terminal':
            case 'decision':
            case 'io':
            case 'document':
            case 'database':
            case 'subprocess':
            case 'connector-circle':
                obj.label = v2Node.label;
                obj.labelColor = v2Node.labelColor;
                break;
                
            case 'connector':
                obj.fromShapeId = v2Node.fromShapeId;
                obj.fromSnapPoint = v2Node.fromSnapPoint;
                obj.toShapeId = v2Node.toShapeId;
                obj.toSnapPoint = v2Node.toSnapPoint;
                obj.startX = v2Node.startX;
                obj.startY = v2Node.startY;
                obj.endX = v2Node.endX;
                obj.endY = v2Node.endY;
                obj.connectorStyle = v2Node.connectorStyle;
                obj.lineType = v2Node.lineType;
                obj.arrowStart = v2Node.arrowStart;
                obj.arrowEnd = v2Node.arrowEnd;
                obj.waypoints = v2Node.waypoints;
                break;
        }
        
        // UI Component properties
        if (v2Node.uiComponentType) {
            obj.uiComponentType = v2Node.uiComponentType;
            obj.uiProperties = v2Node.uiProperties || {};
            obj.uiRenderWidth = v2Node.uiRenderWidth;
            obj.uiRenderHeight = v2Node.uiRenderHeight;
        }
        if (v2Node.avaloniaType) {
            obj.avaloniaType = v2Node.avaloniaType;
            obj.avaloniaProperties = v2Node.avaloniaProperties || {};
        }
        
        return obj;
    }
    
    /**
     * Map Figma counter axis alignment to v1 alignment
     */
    static _mapFigmaAlignmentToV1(alignment) {
        switch (alignment) {
            case 'MIN': return 'start';
            case 'CENTER': return 'center';
            case 'MAX': return 'end';
            case 'STRETCH': return 'stretch';
            case 'BASELINE': return 'baseline';
            default: return 'start';
        }
    }
    
    /**
     * Map Figma primary axis alignment to v1 distribution
     */
    static _mapFigmaDistributionToV1(alignment) {
        switch (alignment) {
            case 'SPACE_BETWEEN': return 'space-between';
            case 'SPACE_AROUND': return 'space-around';
            case 'SPACE_EVENLY': return 'space-evenly';
            default: return 'packed';
        }
    }
}

/**
 * Save document to native format
 * @param {object} appState - Application state
 * @param {object[]} layers - Layers with objects
 * @param {string} filename - Filename
 * @param {object[]} componentLibraries - Optional component libraries data
 */
export function saveNativeDocument(appState, layers, filename = 'document.ascii', componentLibraries = null) {
    const doc = NativeDocument.fromAppState(appState, layers);
    
    // Include component libraries if provided
    if (componentLibraries) {
        doc.componentLibraries = componentLibraries;
    }
    
    const json = doc.toJSONString();
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.ascii') ? filename : `${filename}.ascii`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    return json;
}

/**
 * Load document from native format
 * @param {File|string} input - File object or JSON string
 * @returns {Promise<NativeDocument>}
 */
export async function loadNativeDocument(input) {
    let json;
    
    if (input instanceof File) {
        json = await input.text();
    } else {
        json = input;
    }
    
    return NativeDocument.fromJSON(json);
}

/**
 * Object factory - creates scene objects from serialized data
 */
export class ObjectFactory {
    /**
     * Register object constructors
     * @param {object} constructors - Map of type -> constructor
     */
    constructor(constructors = {}) {
        this.constructors = constructors;
    }

    /**
     * Register a constructor for a type
     * @param {string} type 
     * @param {Function} constructor 
     */
    register(type, constructor) {
        this.constructors[type] = constructor;
    }

    /**
     * Create an object from serialized data
     * @param {object} data - Serialized object data
     * @returns {object|null}
     */
    create(data) {
        const Constructor = this.constructors[data.type];
        if (!Constructor) {
            console.warn(`Unknown object type: ${data.type}`);
            return null;
        }

        const obj = new Constructor();
        
        // Apply base properties
        Object.assign(obj, {
            id: data.id,
            name: data.name,
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
            rotation: data.rotation || 0,
            scaleX: data.scaleX || 1,
            scaleY: data.scaleY || 1,
            strokeChar: data.strokeChar,
            fillChar: data.fillChar,
            strokeColor: data.strokeColor,
            fillColor: data.fillColor,
            lineStyle: data.lineStyle,
            visible: data.visible !== false,
            locked: data.locked || false,
            opacity: data.opacity || 1,
            layerId: data.layerId
        });

        // Apply type-specific properties
        switch (data.type) {
            case 'text':
                obj.text = data.text;
                obj.fontFamily = data.fontFamily;
                obj.fontSize = data.fontSize;
                break;
                
            case 'line':
                obj.x1 = data.x1;
                obj.y1 = data.y1;
                obj.x2 = data.x2;
                obj.y2 = data.y2;
                break;
                
            case 'ellipse':
                obj.radiusX = data.radiusX;
                obj.radiusY = data.radiusY;
                break;
                
            case 'polygon':
                obj.sides = data.sides;
                if (data.points) obj.points = [...data.points];
                break;
                
            case 'star':
                obj.points = data.points;
                obj.innerRadius = data.innerRadius;
                obj.outerRadius = data.outerRadius;
                break;
                
            case 'path':
                if (data.commands) obj.commands = [...data.commands];
                obj.segments = data.segments;
                break;
                
            case 'group':
                if (data.children) {
                    obj.children = data.children.map(c => this.create(c)).filter(Boolean);
                }
                break;
                
            // Flowchart shapes
            case 'process':
            case 'terminal':
            case 'decision':
            case 'io':
            case 'document':
            case 'database':
            case 'subprocess':
            case 'connector-circle':
                obj.label = data.label;
                obj.labelColor = data.labelColor;
                if (obj._updateSnapPoints) obj._updateSnapPoints();
                break;
                
            case 'connector':
                obj.fromShapeId = data.fromShapeId;
                obj.fromSnapPoint = data.fromSnapPoint;
                obj.toShapeId = data.toShapeId;
                obj.toSnapPoint = data.toSnapPoint;
                obj.startX = data.startX;
                obj.startY = data.startY;
                obj.endX = data.endX;
                obj.endY = data.endY;
                obj.connectorStyle = data.connectorStyle;
                obj.lineType = data.lineType;
                obj.arrowStart = data.arrowStart;
                obj.arrowEnd = data.arrowEnd;
                obj.waypoints = data.waypoints || [];
                break;
        }

        return obj;
    }
}

export default {
    FORMAT_VERSION,
    SCHEMA_VERSION,
    NativeDocument,
    ObjectFactory,
    saveNativeDocument,
    loadNativeDocument,
    detectVersion,
    ConstraintMapping,
    TypeMapping,
    ColorUtils
