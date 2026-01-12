/**
 * Asciistrator - Native Format I/O
 * 
 * Handles saving and loading of native .ascii format files.
 * The native format is JSON-based and preserves all document data.
 */

/**
 * Document version for format compatibility
 */
export const FORMAT_VERSION = '1.0.0';

/**
 * Native format document structure
 */
export class NativeDocument {
    constructor() {
        this.version = FORMAT_VERSION;
        this.metadata = {
            title: 'Untitled',
            author: '',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            description: ''
        };
        this.document = {
            width: 120,
            height: 60,
            charSet: 'unicode',
            backgroundColor: '#1a1a2e'
        };
        this.layers = [];
        this.objects = [];
        this.symbols = [];
        this.styles = {};
        this.componentLibraries = [];
    }

    /**
     * Create from app state
     * @param {object} appState - Application state
     * @param {object[]} layers - Layer data with objects
     * @returns {NativeDocument}
     */
    static fromAppState(appState, layers) {
        const doc = new NativeDocument();
        
        doc.metadata.modified = new Date().toISOString();
        doc.document.width = appState.canvasWidth || 120;
        doc.document.height = appState.canvasHeight || 60;
        
        // Serialize layers
        doc.layers = layers.map(layer => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: layer.locked,
            opacity: layer.opacity || 1,
            blendMode: layer.blendMode || 'normal'
        }));
        
        // Serialize all objects from all layers
        doc.objects = [];
        for (const layer of layers) {
            if (layer.objects) {
                for (const obj of layer.objects) {
                    const serialized = NativeDocument.serializeObject(obj);
                    serialized.layerId = layer.id;
                    doc.objects.push(serialized);
                }
            }
        }
        
        return doc;
    }

    /**
     * Serialize a scene object to JSON
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
     * Export to JSON string
     * @param {boolean} pretty - Pretty print
     * @returns {string}
     */
    toJSONString(pretty = true) {
        // Build a plain object to avoid infinite recursion
        // (toJSON is a special method called by JSON.stringify)
        const data = {
            version: this.version,
            metadata: this.metadata,
            document: this.document,
            layers: this.layers,
            objects: this.objects,
            symbols: this.symbols,
            styles: this.styles,
            componentLibraries: this.componentLibraries
        };
        return JSON.stringify(data, null, pretty ? 2 : 0);
    }

    /**
     * Parse from JSON string
     * @param {string} json - JSON string
     * @returns {NativeDocument}
     */
    static fromJSON(json) {
        const data = JSON.parse(json);
        const doc = new NativeDocument();
        
        // Validate version
        if (data.version) {
            doc.version = data.version;
        }
        
        // Copy metadata
        if (data.metadata) {
            doc.metadata = { ...doc.metadata, ...data.metadata };
        }
        
        // Copy document settings
        if (data.document) {
            doc.document = { ...doc.document, ...data.document };
        }
        
        // Copy layers
        if (data.layers) {
            doc.layers = data.layers;
        }
        
        // Copy objects
        if (data.objects) {
            doc.objects = data.objects;
        }
        
        // Copy symbols
        if (data.symbols) {
            doc.symbols = data.symbols;
        }
        
        // Copy styles
        if (data.styles) {
            doc.styles = data.styles;
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
    NativeDocument,
    ObjectFactory,
    saveNativeDocument,
    loadNativeDocument
};
