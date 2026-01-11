/**
 * Asciistrator - Objects Module Index
 * 
 * Exports all object classes for the vector graphics engine.
 */

// Base classes
export { SceneObject, Style, Styles } from './base.js';

// Path objects
export { AnchorPoint, PathSegment, Path } from './path.js';

// Shape objects
export { Rectangle, Ellipse, Polygon, Star } from './shapes.js';

// Line objects
export { Line, Polyline, Connector } from './line.js';

// Text objects
export { AsciiFonts, TextAlign, VerticalAlign, Text, TextOnPath } from './text.js';

// Group objects
export { Group, ClippingGroup, Symbol, SymbolInstance } from './group.js';

// Selection system
export { 
    HandleType, 
    HandleCursor, 
    SelectionHandle, 
    BoundingBox, 
    PathHandles, 
    Selection 
} from './selection.js';

/**
 * Object factory - Creates objects from JSON data
 * Uses the already-imported classes from the top of this module.
 * @param {object} data 
 * @returns {SceneObject|null}
 */
export function createObjectFromJSON(data) {
    if (!data || !data.type) return null;
    
    let obj = null;
    
    switch (data.type) {
        case 'path':
            obj = new Path();
            break;
        case 'rectangle':
            obj = new Rectangle();
            break;
        case 'ellipse':
            obj = new Ellipse();
            break;
        case 'polygon':
            obj = new Polygon();
            break;
        case 'star':
            obj = new Star();
            break;
        case 'line':
            obj = new Line();
            break;
        case 'polyline':
            obj = new Polyline();
            break;
        case 'connector':
            obj = new Connector();
            break;
        case 'text':
            obj = new Text();
            break;
        case 'textOnPath':
            obj = new TextOnPath();
            break;
        case 'group':
            obj = new Group();
            break;
        case 'clippingGroup':
            obj = new ClippingGroup();
            break;
        case 'symbol':
            obj = new SymbolInstance();
            break;
        case 'symbolInstance':
            obj = new SymbolInstance();
            break;
        default:
            console.warn(`Unknown object type: ${data.type}`);
            return null;
    }
    
    if (obj) {
        obj.fromJSON(data, createObjectFromJSON);
    }
    
    return obj;
}

/**
 * Object type registry
 */
export const ObjectTypes = {
    PATH: 'path',
    RECTANGLE: 'rectangle',
    ELLIPSE: 'ellipse',
    POLYGON: 'polygon',
    STAR: 'star',
    LINE: 'line',
    POLYLINE: 'polyline',
    CONNECTOR: 'connector',
    TEXT: 'text',
    TEXT_ON_PATH: 'textOnPath',
    GROUP: 'group',
    CLIPPING_GROUP: 'clippingGroup',
    SYMBOL: 'symbol',
    SYMBOL_INSTANCE: 'symbolInstance'
};

export default {
    // Types
    ObjectTypes,
    
    // Factory
    createObjectFromJSON,
    
    // Classes
    SceneObject,
    Style,
    Styles,
    AnchorPoint,
    PathSegment,
    Path,
    Rectangle,
    Ellipse,
    Polygon,
    Star,
    Line,
    Polyline,
    Connector,
    Text,
    TextOnPath,
    Group,
    ClippingGroup,
    Symbol,
    SymbolInstance,
    HandleType,
    HandleCursor,
    SelectionHandle,
    BoundingBox,
    PathHandles,
    Selection
};
