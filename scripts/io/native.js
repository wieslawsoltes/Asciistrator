/**
 * Asciistrator - Native Format I/O
 * 
 * Handles saving and loading of native .ascii format files.
 * The native format is JSON-based and preserves all document data.
 * 
 * Format v2.0 uses a Figma-compatible nested tree structure:
 * DOCUMENT → PAGE[] → objects (frames, groups, shapes)
 * 
 * Note: Legacy v1.0 format support has been removed.
 */

/**
 * Document version for format compatibility
 * v2.0.0 - Figma-compatible nested document structure
 */
export const FORMAT_VERSION = '2.0.0';
export const SCHEMA_VERSION = 0;

/**
 * Constraint values (Figma-compatible naming used internally)
 * MIN = maintain distance from min edge (left/top)
 * MAX = maintain distance from max edge (right/bottom)  
 * STRETCH = maintain both edge distances
 * CENTER = maintain center position
 * SCALE = scale proportionally
 */
export const ConstraintValues = {
    horizontal: ['MIN', 'MAX', 'STRETCH', 'CENTER', 'SCALE'],
    vertical: ['MIN', 'MAX', 'STRETCH', 'CENTER', 'SCALE']
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
        'component': 'COMPONENT',
        'instance': 'INSTANCE',
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
        'COMPONENT': 'component',
        'INSTANCE': 'instance',
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
     * @param {object} options - Additional options (styles, etc.)
     * @returns {NativeDocument}
     */
    static fromAppState(appState, layers, options = {}) {
        const doc = new NativeDocument();
        
        doc.name = appState.filename || 'Untitled';
        doc.lastModified = new Date().toISOString();
        doc.metadata.modified = doc.lastModified;
        doc.metadata.title = doc.name;
        
        // Import styles if provided
        if (options.styles) {
            doc.styles = options.styles;
        }
        
        // Extract component definitions from all layers
        const componentDefs = new Map();
        
        /**
         * Recursively find and register component definitions
         */
        function extractComponents(objects) {
            for (const obj of objects) {
                if (obj.type === 'component' && obj.componentKey) {
                    // Store component definition
                    componentDefs.set(obj.componentKey, {
                        key: obj.componentKey,
                        name: obj.name || 'Component',
                        description: obj.description || '',
                        documentationLinks: obj.documentationLinks || []
                    });
                }
                // Recursively check children
                if (obj.children && obj.children.length > 0) {
                    extractComponents(obj.children);
                }
            }
        }
        
        // Extract components from all layers
        for (const layer of layers) {
            if (layer.objects) {
                extractComponents(layer.objects);
            }
        }
        
        // Store component definitions in document
        for (const [key, def] of componentDefs) {
            doc.components[key] = def;
        }
        
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
            
            // Constraints (already using Figma naming internally)
            constraints: {
                horizontal: obj.constraints?.horizontal || 'MIN',
                vertical: obj.constraints?.vertical || 'MIN'
            },
            
            // Clipping
            clipsContent: obj.clipContent || false,
            
            // Children (recursive)
            children: (obj.children || []).map(c => NativeDocument.serializeObjectV2(c)),
            
            // ASCII-specific properties (namespaced to preserve)
            ascii: {
                // Core ASCII rendering
                strokeChar: obj.strokeChar || '*',
                fillChar: obj.fillChar || '',
                lineStyle: obj.lineStyle || 'single',
                strokeColor: obj.strokeColor,
                fillColor: obj.fillColor,
                
                // Box/border styles (ASCII-specific)
                boxStyle: obj.boxStyle,
                borderStyle: obj.borderStyle,
                backgroundChar: obj.backgroundChar,
                
                // Frame title (ASCII-specific rendering)
                title: obj.title,
                showBorder: obj.showBorder,
                autoSize: obj.autoSize
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
        
        // Style references (Figma-style)
        if (obj.fillStyleId) node.fillStyleId = obj.fillStyleId;
        if (obj.strokeStyleId) node.strokeStyleId = obj.strokeStyleId;
        if (obj.textStyleId) node.textStyleId = obj.textStyleId;
        if (obj.effectStyleId) node.effectStyleId = obj.effectStyleId;
        
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
     * Now uses flat properties directly since internal format matches Figma
     */
    static _serializeLayoutPropertiesV2(obj) {
        return {
            // Layout mode
            layoutMode: obj.layoutMode || 'NONE',
            
            // Alignment on primary axis
            primaryAxisAlignItems: obj.primaryAxisAlignItems || 'MIN',
            
            // Alignment on counter axis
            counterAxisAlignItems: obj.counterAxisAlignItems || 'MIN',
            
            // Padding (individual properties)
            paddingLeft: obj.paddingLeft || 0,
            paddingRight: obj.paddingRight || 0,
            paddingTop: obj.paddingTop || 0,
            paddingBottom: obj.paddingBottom || 0,
            
            // Spacing
            itemSpacing: obj.itemSpacing || 0,
            counterAxisSpacing: obj.counterAxisSpacing || 0,
            
            // Wrap
            layoutWrap: obj.layoutWrap || 'NO_WRAP',
            
            // Reverse
            itemReverseZIndex: obj.itemReverseZIndex || false
        };
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
                // Standard Figma properties
                node.backgroundColor = obj.backgroundColor ? ColorUtils.hexToFigma(obj.backgroundColor) : null;
                // ASCII-specific properties are already in node.ascii from base serialization
                break;
                
            case 'component':
                // Standard Figma properties
                node.backgroundColor = obj.backgroundColor ? ColorUtils.hexToFigma(obj.backgroundColor) : null;
                // Component-specific properties
                node.componentKey = obj.componentKey;
                node.description = obj.description || '';
                node.documentationLinks = obj.documentationLinks || [];
                // ASCII-specific properties are already in node.ascii from base serialization
                break;
                
            case 'instance':
                // Instance references a component
                node.componentId = obj.componentId;
                node.overrides = obj.overrides || {};
                node.exposedInstances = obj.exposedInstances || [];
                node.scaleFactor = obj.scaleFactor ?? 1;
                break;
                
            case 'table':
                node.cols = obj.cols;
                node.rows = obj.rows;
                // Move ASCII-specific table data to ascii namespace
                node.ascii.cellData = obj.cellData;
                node.ascii.columnWidths = obj.columnWidths;
                node.ascii.rowHeights = obj.rowHeights;
                break;
                
            case 'chart':
                node.chartType = obj.chartType;
                // Move ASCII-specific chart data to ascii namespace
                node.ascii.chartData = obj.chartData;
                node.ascii.chartOptions = obj.chartOptions;
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
                node.flowchartType = obj.type;  // Preserve original type
                // Move ASCII-specific label to ascii namespace
                node.ascii.label = obj.label;
                node.ascii.labelColor = obj.labelColor;
                break;
                
            case 'connector':
                // Connection endpoint references (Figma-compatible)
                node.fromShapeId = obj.fromShapeId;
                node.fromSnapPoint = obj.fromSnapPoint;
                node.toShapeId = obj.toShapeId;
                node.toSnapPoint = obj.toSnapPoint;
                node.startX = obj.startX;
                node.startY = obj.startY;
                node.endX = obj.endX;
                node.endY = obj.endY;
                // Move ASCII-specific connector properties to ascii namespace
                node.ascii.connectorStyle = obj.connectorStyle;
                node.ascii.lineType = obj.lineType;
                node.ascii.arrowStart = obj.arrowStart;
                node.ascii.arrowEnd = obj.arrowEnd;
                node.ascii.waypoints = obj.waypoints;
                break;
        }
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
     * Parse from JSON string (v2 format only)
     * @param {string} json - JSON string
     * @returns {NativeDocument}
     */
    static fromJSON(json) {
        const data = JSON.parse(json);
        const version = detectVersion(data);
        
        if (!version) {
            throw new Error('Unknown document format. Only v2+ documents are supported.');
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
}

/**
 * Save document to native format
 * @param {object} appState - Application state
 * @param {object[]} layers - Layers with objects
 * @param {string} filename - Filename
 * @param {object[]} componentLibraries - Optional component libraries data
 * @param {object} styles - Optional shared styles data
 */
export function saveNativeDocument(appState, layers, filename = 'document.ascii', componentLibraries = null, styles = null) {
    const doc = NativeDocument.fromAppState(appState, layers, { styles });
    
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
    ConstraintValues,
