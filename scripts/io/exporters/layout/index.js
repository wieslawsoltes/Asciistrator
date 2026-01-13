/**
 * Asciistrator - Layout Export Engines
 * 
 * Module index for layout transformation and container export engines.
 * These provide deterministic layout handling for each export format.
 * 
 * @version 1.0.0
 */

// ==========================================
// BASE ENGINES
// ==========================================

export {
    // Base layout engine
    LayoutExportEngine,
    // Layout constants
    LayoutMode,
    PrimaryAxisAlign,
    CounterAxisAlign,
    LayoutWrap,
    SizingMode
} from './LayoutExportEngine.js';

export {
    // Container engine base classes
    ContainerExportEngine,
    StringContainerExportEngine,
    ASTContainerExportEngine,
    // Container constants
    ContainerType
} from './ContainerExportEngine.js';

// ==========================================
// FORMAT-SPECIFIC TRANSFORMERS
// ==========================================

export {
    CSSLayoutTransformer
} from './CSSLayoutTransformer.js';

export {
    XAMLLayoutTransformer,
    XAMLPanelType,
    XAMLAlignment
} from './XAMLLayoutTransformer.js';

export {
    SVGLayoutTransformer
} from './SVGLayoutTransformer.js';

// ==========================================
// CONTAINER EXPORT ENGINES
// ==========================================

export {
    HTMLContainerExportEngine
} from './HTMLContainerExportEngine.js';

export {
    SVGContainerExportEngine
} from './SVGContainerExportEngine.js';

export {
    XAMLContainerExportEngine
} from './XAMLContainerExportEngine.js';

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Create layout transformer for export format
 * @param {string} format - Export format ('html', 'svg', 'xaml', 'avalonia', 'wpf', 'maui')
 * @param {Object} options - Transformer options
 * @returns {LayoutExportEngine}
 */
export function createLayoutTransformer(format, options = {}) {
    switch (format.toLowerCase()) {
        case 'html':
        case 'css':
        case 'web':
        case 'react':
        case 'vue':
        case 'angular':
            return new CSSLayoutTransformer(options);
            
        case 'svg':
            return new SVGLayoutTransformer(options);
            
        case 'xaml':
        case 'avalonia':
        case 'wpf':
        case 'maui':
        case 'uwp':
            return new XAMLLayoutTransformer({
                framework: format.toLowerCase() === 'xaml' ? 'avalonia' : format.toLowerCase(),
                ...options
            });
            
        default:
            // Default to SVG (computes absolute positions)
            return new SVGLayoutTransformer(options);
    }
}

/**
 * Create container export engine for export format
 * @param {string} format - Export format
 * @param {Object} options - Engine options
 * @returns {Promise<ContainerExportEngine>}
 */
export async function createContainerExportEngineAsync(format, options = {}) {
    // Dynamic imports for async usage
    const { HTMLContainerExportEngine } = await import('./HTMLContainerExportEngine.js');
    const { SVGContainerExportEngine } = await import('./SVGContainerExportEngine.js');
    const { XAMLContainerExportEngine } = await import('./XAMLContainerExportEngine.js');
    
    switch (format.toLowerCase()) {
        case 'html':
        case 'web':
        case 'react':
        case 'vue':
        case 'angular':
            return new HTMLContainerExportEngine(options);
            
        case 'svg':
            return new SVGContainerExportEngine(options);
            
        case 'xaml':
        case 'avalonia':
        case 'wpf':
        case 'maui':
        case 'uwp':
            return new XAMLContainerExportEngine({
                framework: format.toLowerCase() === 'xaml' ? 'avalonia' : format.toLowerCase(),
                ...options
            });
            
        default:
            return new SVGContainerExportEngine(options);
    }
}

/**
 * Create container export engine synchronously
 * @param {string} format - Export format
 * @param {Object} options - Engine options
 * @returns {ContainerExportEngine}
 */
import { HTMLContainerExportEngine } from './HTMLContainerExportEngine.js';
import { SVGContainerExportEngine } from './SVGContainerExportEngine.js';
import { XAMLContainerExportEngine } from './XAMLContainerExportEngine.js';

export function createContainerEngine(format, options = {}) {
    switch (format.toLowerCase()) {
        case 'html':
        case 'web':
        case 'react':
        case 'vue':
        case 'angular':
            return new HTMLContainerExportEngine(options);
            
        case 'svg':
            return new SVGContainerExportEngine(options);
            
        case 'xaml':
        case 'avalonia':
        case 'wpf':
        case 'maui':
        case 'uwp':
            return new XAMLContainerExportEngine({
                framework: format.toLowerCase() === 'xaml' ? 'avalonia' : format.toLowerCase(),
                ...options
            });
            
        default:
            return new SVGContainerExportEngine(options);
    }
}

/**
 * Get layout capabilities for export format
 * @param {string} format - Export format
 * @returns {Object} Capability flags
 */
export function getLayoutCapabilities(format) {
    const capabilities = {
        // Whether format supports native layout (flexbox, etc.)
        supportsNativeLayout: false,
        // Whether format supports nested containers
        supportsNestedContainers: false,
        // Whether format requires computed positions
        requiresComputedPositions: true,
        // Whether format supports clipping
        supportsClipping: false,
        // Whether format supports constraints
        supportsConstraints: false,
        // Best panel type for auto-layout
        preferredLayoutPanel: null
    };
    
    switch (format.toLowerCase()) {
        case 'html':
        case 'css':
        case 'web':
        case 'react':
        case 'vue':
        case 'angular':
            capabilities.supportsNativeLayout = true;
            capabilities.supportsNestedContainers = true;
            capabilities.requiresComputedPositions = false;
            capabilities.supportsClipping = true;
            capabilities.supportsConstraints = true;
            capabilities.preferredLayoutPanel = 'flexbox';
            break;
            
        case 'svg':
            capabilities.supportsNativeLayout = false;
            capabilities.supportsNestedContainers = true;
            capabilities.requiresComputedPositions = true;
            capabilities.supportsClipping = true;
            capabilities.supportsConstraints = false;
            capabilities.preferredLayoutPanel = 'absolute';
            break;
            
        case 'xaml':
        case 'avalonia':
        case 'wpf':
        case 'maui':
        case 'uwp':
            capabilities.supportsNativeLayout = true;
            capabilities.supportsNestedContainers = true;
            capabilities.requiresComputedPositions = false;
            capabilities.supportsClipping = true;
            capabilities.supportsConstraints = true;
            capabilities.preferredLayoutPanel = 'StackPanel';
            break;
            
        case 'text':
        case 'ansi':
        case 'markdown':
            capabilities.supportsNativeLayout = false;
            capabilities.supportsNestedContainers = false;
            capabilities.requiresComputedPositions = true;
            capabilities.supportsClipping = false;
            capabilities.supportsConstraints = false;
            capabilities.preferredLayoutPanel = null;
            break;
    }
    
    return capabilities;
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    // Base engines
    LayoutExportEngine,
    ContainerExportEngine,
    StringContainerExportEngine,
    ASTContainerExportEngine,
    // Transformers
    CSSLayoutTransformer,
    XAMLLayoutTransformer,
    SVGLayoutTransformer,
    // Container engines
    HTMLContainerExportEngine,
    SVGContainerExportEngine,
    XAMLContainerExportEngine,
    // Factories
    createLayoutTransformer,
    createContainerEngine,
    getLayoutCapabilities
};
