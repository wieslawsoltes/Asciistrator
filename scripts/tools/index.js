/**
 * Asciistrator - Tools Module Index
 * 
 * Exports all drawing tools and the tool manager.
 */

// Base classes
export {
    ToolState,
    ToolCursors,
    Tool,
    ToolManager
} from './base.js';

// Selection tools
export {
    SelectTool,
    DirectSelectTool,
    LassoTool,
    MarqueeTool
} from './select.js';

// Shape tools
export {
    ShapeTool,
    RectangleTool,
    RoundedRectangleTool,
    EllipseTool,
    PolygonTool,
    StarTool,
    LineTool,
    PolylineTool,
    ArcTool
} from './shapes.js';

// Path tools
export {
    PenTool,
    PencilTool,
    BrushTool,
    EraserTool,
    ScissorsTool
} from './path.js';

// Text tools
export {
    TextTool,
    AsciiArtTextTool
} from './text.js';

// Boolean operations
export {
    BooleanOps,
    OutlineExtractor
} from './boolean.js';

// Pattern fills
export {
    Patterns,
    PatternFill,
    createPattern,
    createCharPattern
} from './patterns.js';

// Gradients
export {
    GradientPalettes,
    GradientStop,
    Gradient,
    LinearGradient,
    RadialGradient,
    ConicalGradient
} from './gradients.js';

// Symbols library
export {
    SymbolDefinition,
    SymbolInstance,
    SymbolLibrary,
    PredefinedSymbols,
    createDefaultLibrary
} from './symbols.js';

// Clipping masks
export {
    ClipRegion,
    ClippingMask,
    ClippedBuffer,
    ClippingContext,
    ClippedObject
} from './clipping.js';

// ==========================================
// TOOL REGISTRY
// ==========================================

/**
 * All available tool classes mapped by ID
 */
export const ToolRegistry = {
    // Selection tools
    'select': () => import('./select.js').then(m => m.SelectTool),
    'direct-select': () => import('./select.js').then(m => m.DirectSelectTool),
    'lasso': () => import('./select.js').then(m => m.LassoTool),
    'marquee': () => import('./select.js').then(m => m.MarqueeTool),
    
    // Shape tools
    'rectangle': () => import('./shapes.js').then(m => m.RectangleTool),
    'rounded-rectangle': () => import('./shapes.js').then(m => m.RoundedRectangleTool),
    'ellipse': () => import('./shapes.js').then(m => m.EllipseTool),
    'polygon': () => import('./shapes.js').then(m => m.PolygonTool),
    'star': () => import('./shapes.js').then(m => m.StarTool),
    'line': () => import('./shapes.js').then(m => m.LineTool),
    'polyline': () => import('./shapes.js').then(m => m.PolylineTool),
    'arc': () => import('./shapes.js').then(m => m.ArcTool),
    
    // Path tools
    'pen': () => import('./path.js').then(m => m.PenTool),
    'pencil': () => import('./path.js').then(m => m.PencilTool),
    'brush': () => import('./path.js').then(m => m.BrushTool),
    'eraser': () => import('./path.js').then(m => m.EraserTool),
    'scissors': () => import('./path.js').then(m => m.ScissorsTool),
    
    // Text tools
    'text': () => import('./text.js').then(m => m.TextTool),
    'ascii-art-text': () => import('./text.js').then(m => m.AsciiArtTextTool)
};

/**
 * Tool categories for UI organization
 */
export const ToolCategories = {
    selection: {
        name: 'Selection',
        tools: ['select', 'direct-select', 'lasso', 'marquee']
    },
    shapes: {
        name: 'Shapes',
        tools: ['rectangle', 'rounded-rectangle', 'ellipse', 'polygon', 'star']
    },
    lines: {
        name: 'Lines',
        tools: ['line', 'polyline', 'arc']
    },
    paths: {
        name: 'Paths',
        tools: ['pen', 'pencil', 'brush']
    },
    editing: {
        name: 'Editing',
        tools: ['eraser', 'scissors']
    },
    text: {
        name: 'Text',
        tools: ['text', 'ascii-art-text']
    }
};

/**
 * Default tool shortcuts mapping
 */
export const ToolShortcuts = {
    'v': 'select',
    'a': 'direct-select',
    'q': 'lasso',
    'm': 'marquee',
    'r': 'rectangle',
    'shift+r': 'rounded-rectangle',
    'o': 'ellipse',
    'shift+o': 'polygon',
    '*': 'star',
    '\\': 'line',
    'shift+\\': 'polyline',
    'p': 'pen',
    'n': 'pencil',
    'b': 'brush',
    'e': 'eraser',
    'c': 'scissors',
    't': 'text',
    'ctrl+t': 'ascii-art-text'
};

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Create and register all default tools
 * Uses already-imported tool classes from the top of this module.
 * @param {ToolManager} manager
 * @returns {Map<string, Tool>}
 */
export function createDefaultTools(manager) {
    const tools = new Map();
    
    // Create and register tools using the already-imported classes
    const toolClasses = [
        SelectTool,
        DirectSelectTool,
        LassoTool,
        MarqueeTool,
        RectangleTool,
        RoundedRectangleTool,
        EllipseTool,
        PolygonTool,
        StarTool,
        LineTool,
        PolylineTool,
        ArcTool,
        PenTool,
        PencilTool,
        BrushTool,
        EraserTool,
        ScissorsTool,
        TextTool,
        AsciiArtTextTool
    ];
    
    for (const ToolClass of toolClasses) {
        const tool = new ToolClass(manager);
        tools.set(tool.id, tool);
        manager.registerTool(tool);
    }
    
    return tools;
}

/**
 * Create default tools using ES modules (async)
 * @param {ToolManager} manager
 * @returns {Promise<Map<string, Tool>>}
 */
export async function createDefaultToolsAsync(manager) {
    const tools = new Map();
    
    // Import all tool modules
    const [selectModule, shapesModule, pathModule, textModule] = await Promise.all([
        import('./select.js'),
        import('./shapes.js'),
        import('./path.js'),
        import('./text.js')
    ]);
    
    // Create and register selection tools
    const selectionTools = [
        new selectModule.SelectTool(manager),
        new selectModule.DirectSelectTool(manager),
        new selectModule.LassoTool(manager),
        new selectModule.MarqueeTool(manager)
    ];
    
    // Create and register shape tools
    const shapeTools = [
        new shapesModule.RectangleTool(manager),
        new shapesModule.RoundedRectangleTool(manager),
        new shapesModule.EllipseTool(manager),
        new shapesModule.PolygonTool(manager),
        new shapesModule.StarTool(manager),
        new shapesModule.LineTool(manager),
        new shapesModule.PolylineTool(manager),
        new shapesModule.ArcTool(manager)
    ];
    
    // Create and register path tools
    const pathTools = [
        new pathModule.PenTool(manager),
        new pathModule.PencilTool(manager),
        new pathModule.BrushTool(manager),
        new pathModule.EraserTool(manager),
        new pathModule.ScissorsTool(manager)
    ];
    
    // Create and register text tools
    const textTools = [
        new textModule.TextTool(manager),
        new textModule.AsciiArtTextTool(manager)
    ];
    
    // Register all tools
    const allTools = [
        ...selectionTools,
        ...shapeTools,
        ...pathTools,
        ...textTools
    ];
    
    for (const tool of allTools) {
        tools.set(tool.id, tool);
        manager.registerTool(tool);
    }
    
    return tools;
}

/**
 * Create a specific tool by ID
 * @param {string} toolId
 * @param {ToolManager} manager
 * @param {object} [options]
 * @returns {Promise<Tool>}
 */
export async function createTool(toolId, manager, options = {}) {
    const loader = ToolRegistry[toolId];
    if (!loader) {
        throw new Error(`Unknown tool: ${toolId}`);
    }
    
    const ToolClass = await loader();
    return new ToolClass(manager, options);
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    // Base
    ToolState: () => import('./base.js').then(m => m.ToolState),
    ToolCursors: () => import('./base.js').then(m => m.ToolCursors),
    Tool: () => import('./base.js').then(m => m.Tool),
    ToolManager: () => import('./base.js').then(m => m.ToolManager),
    
    // Selection
    SelectTool: () => import('./select.js').then(m => m.SelectTool),
    DirectSelectTool: () => import('./select.js').then(m => m.DirectSelectTool),
    LassoTool: () => import('./select.js').then(m => m.LassoTool),
    MarqueeTool: () => import('./select.js').then(m => m.MarqueeTool),
    
    // Shapes
    ShapeTool: () => import('./shapes.js').then(m => m.ShapeTool),
    RectangleTool: () => import('./shapes.js').then(m => m.RectangleTool),
    RoundedRectangleTool: () => import('./shapes.js').then(m => m.RoundedRectangleTool),
    EllipseTool: () => import('./shapes.js').then(m => m.EllipseTool),
    PolygonTool: () => import('./shapes.js').then(m => m.PolygonTool),
    StarTool: () => import('./shapes.js').then(m => m.StarTool),
    LineTool: () => import('./shapes.js').then(m => m.LineTool),
    PolylineTool: () => import('./shapes.js').then(m => m.PolylineTool),
    ArcTool: () => import('./shapes.js').then(m => m.ArcTool),
    
    // Paths
    PenTool: () => import('./path.js').then(m => m.PenTool),
    PencilTool: () => import('./path.js').then(m => m.PencilTool),
    BrushTool: () => import('./path.js').then(m => m.BrushTool),
    EraserTool: () => import('./path.js').then(m => m.EraserTool),
    ScissorsTool: () => import('./path.js').then(m => m.ScissorsTool),
    
    // Text
    TextTool: () => import('./text.js').then(m => m.TextTool),
    AsciiArtTextTool: () => import('./text.js').then(m => m.AsciiArtTextTool),
    
    // Boolean operations
    BooleanOps: () => import('./boolean.js').then(m => m.BooleanOps),
    OutlineExtractor: () => import('./boolean.js').then(m => m.OutlineExtractor),
    
    // Patterns
    Patterns: () => import('./patterns.js').then(m => m.Patterns),
    PatternFill: () => import('./patterns.js').then(m => m.PatternFill),
    createPattern: () => import('./patterns.js').then(m => m.createPattern),
    createCharPattern: () => import('./patterns.js').then(m => m.createCharPattern),
    
    // Gradients
    GradientPalettes: () => import('./gradients.js').then(m => m.GradientPalettes),
    LinearGradient: () => import('./gradients.js').then(m => m.LinearGradient),
    RadialGradient: () => import('./gradients.js').then(m => m.RadialGradient),
    ConicalGradient: () => import('./gradients.js').then(m => m.ConicalGradient),
    
    // Symbols
    SymbolDefinition: () => import('./symbols.js').then(m => m.SymbolDefinition),
    SymbolInstance: () => import('./symbols.js').then(m => m.SymbolInstance),
    SymbolLibrary: () => import('./symbols.js').then(m => m.SymbolLibrary),
    PredefinedSymbols: () => import('./symbols.js').then(m => m.PredefinedSymbols),
    createDefaultLibrary: () => import('./symbols.js').then(m => m.createDefaultLibrary),
    
    // Clipping
    ClipRegion: () => import('./clipping.js').then(m => m.ClipRegion),
    ClippingMask: () => import('./clipping.js').then(m => m.ClippingMask),
    ClippedBuffer: () => import('./clipping.js').then(m => m.ClippedBuffer),
    ClippingContext: () => import('./clipping.js').then(m => m.ClippingContext),
    ClippedObject: () => import('./clipping.js').then(m => m.ClippedObject),
    
    // Utilities
    ToolRegistry,
    ToolCategories,
    ToolShortcuts,
    createDefaultTools,
    createDefaultToolsAsync,
    createTool
};
