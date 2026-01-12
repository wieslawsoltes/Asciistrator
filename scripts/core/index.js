/**
 * Asciistrator - Core Module Index
 * 
 * Exports all core functionality including rendering, performance,
 * math utilities, canvas, ASCII operations, and document management.
 */

// ==========================================
// PERFORMANCE
// ==========================================

export {
    ObjectPool,
    QuadTree,
    RenderCache,
    MemoryManager,
    PerformanceMonitor,
    UndoOptimizer,
    VirtualList,
    BatchProcessor
} from './performance/index.js';

// ==========================================
// SMART GUIDES & SNAPPING
// ==========================================

export {
    SmartGuides,
    CanvasResizeHandler,
    SnapConfig,
    GuideLine,
    DistanceIndicator,
    SnapResult
} from './smartguides.js';

// ==========================================
// RE-EXPORTS FROM SUBMODULES
// ==========================================

// These will be added as the modules are finalized
// export * from './ascii/index.js';
// export * from './canvas/index.js';
// export * from './document/index.js';
// export * from './math/index.js';
// export * from './rendering/index.js';

/**
 * Core module default export
 */
export default {
    // Performance module reference
    performance: () => import('./performance/index.js')
};
