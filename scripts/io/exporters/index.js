/**
 * Asciistrator - Exporters Index
 * 
 * Central export for all exporter modules.
 * 
 * @version 1.0.0
 */

// ==========================================
// BASE CLASSES
// ==========================================

export { BaseExporter } from './BaseExporter.js';

// ==========================================
// PLAIN TEXT EXPORTERS
// ==========================================

export { TextExporter } from './TextExporter.js';

// ==========================================
// RICH TEXT EXPORTERS
// ==========================================

export { HTMLExporter } from './HTMLExporter.js';
export { ANSIExporter, ANSI } from './ANSIExporter.js';
export { MarkdownExporter } from './MarkdownExporter.js';

// ==========================================
// VECTOR EXPORTERS
// ==========================================

export { SVGExporter } from './SVGExporter.js';

// ==========================================
// IMAGE EXPORTERS
// ==========================================

export { PNGExporter } from './PNGExporter.js';

// ==========================================
// DOCUMENT EXPORTERS
// ==========================================

export { JSONExporter } from './JSONExporter.js';
export { LaTeXExporter } from './LaTeXExporter.js';

// ==========================================
// UI FRAMEWORK EXPORTERS
// ==========================================

export { 
    BaseXAMLExporter,
    AvaloniaExporter,
    WPFExporter,
    MAUIExporter,
    UWPExporter
} from './UIFrameworkExporters.js';

// ==========================================
// AVALONIA ADVANCED EXPORTER
// ==========================================

export {
    AvaloniaXamlExporter,
    AvaloniaWindowExporter,
    AvaloniaUserControlExporter,
    AvaloniaProjectExporter,
    createAvaloniaExporter,
    createSpecializedExporter,
    PropertyConverterType,
    AVALONIA_COMPONENT_MAPPINGS,
    getMappingBySourceId,
    getMappingByControlName,
    getMappingsByCategory,
    PropertyConverter,
    propertyConverter,
    XamlGenerator,
    XAML_NAMESPACES,
    createXamlGenerator,
    generateXaml,
    StyleGenerator,
    ASCII_COLORS,
    ASCII_FONTS,
    createStyleGenerator,
    generateAsciiTheme,
    CodeBehindGenerator,
    createCodeBehindGenerator,
    generateCodeBehind,
    generateViewModel
} from './avalonia/index.js';

// ==========================================
// WEB FRAMEWORK EXPORTERS
// ==========================================

export {
    BaseWebExporter,
    ReactExporter,
    VueExporter,
    AngularExporter,
    SvelteExporter,
    WebComponentExporter
} from './WebFrameworkExporters.js';

// ==========================================
// ALL EXPORTERS COLLECTION
// ==========================================

import { TextExporter } from './TextExporter.js';
import { HTMLExporter } from './HTMLExporter.js';
import { ANSIExporter } from './ANSIExporter.js';
import { MarkdownExporter } from './MarkdownExporter.js';
import { SVGExporter } from './SVGExporter.js';
import { PNGExporter } from './PNGExporter.js';
import { JSONExporter } from './JSONExporter.js';
import { LaTeXExporter } from './LaTeXExporter.js';
import { AvaloniaExporter, WPFExporter, MAUIExporter, UWPExporter } from './UIFrameworkExporters.js';
import { ReactExporter, VueExporter, AngularExporter, SvelteExporter, WebComponentExporter } from './WebFrameworkExporters.js';
import { 
    AvaloniaXamlExporter, 
    AvaloniaWindowExporter, 
    AvaloniaUserControlExporter, 
    AvaloniaProjectExporter 
} from './avalonia/index.js';

/**
 * Collection of all available exporter classes
 */
export const ExporterClasses = {
    // Plain Text
    text: TextExporter,
    
    // Rich Text
    html: HTMLExporter,
    ansi: ANSIExporter,
    markdown: MarkdownExporter,
    
    // Vector
    svg: SVGExporter,
    
    // Image
    png: PNGExporter,
    
    // Document
    json: JSONExporter,
    latex: LaTeXExporter,
    
    // UI Frameworks (Basic)
    avalonia: AvaloniaExporter,
    wpf: WPFExporter,
    maui: MAUIExporter,
    uwp: UWPExporter,
    
    // Avalonia Advanced Exporters
    'avalonia-xaml': AvaloniaXamlExporter,
    'avalonia-window': AvaloniaWindowExporter,
    'avalonia-usercontrol': AvaloniaUserControlExporter,
    'avalonia-project': AvaloniaProjectExporter,
    
    // Web Frameworks
    react: ReactExporter,
    vue: VueExporter,
    angular: AngularExporter,
    svelte: SvelteExporter,
    webcomponent: WebComponentExporter
};

/**
 * Create instances of all exporters
 * @returns {Map<string, BaseExporter>} Map of exporter ID to instance
 */
export function createAllExporters() {
    const exporters = new Map();
    
    for (const [id, ExporterClass] of Object.entries(ExporterClasses)) {
        exporters.set(id, new ExporterClass());
    }
    
    return exporters;
}

/**
 * Get exporter by ID
 * @param {string} id - Exporter ID
 * @returns {BaseExporter|null} Exporter instance or null
 */
export function getExporter(id) {
    const ExporterClass = ExporterClasses[id];
    if (!ExporterClass) return null;
    return new ExporterClass();
}

/**
 * List all available exporter IDs
 * @returns {string[]} Array of exporter IDs
 */
export function listExporterIds() {
    return Object.keys(ExporterClasses);
}

/**
 * Get exporter metadata for all exporters
 * @returns {Array<object>} Array of exporter metadata
 */
export function getExporterMetadata() {
    const metadata = [];
    
    for (const [id, ExporterClass] of Object.entries(ExporterClasses)) {
        const instance = new ExporterClass();
        metadata.push({
            id: instance.id,
            name: instance.name,
            description: instance.description,
            fileExtension: instance.fileExtension,
            mimeType: instance.mimeType,
            category: instance.category,
            supportsColors: instance.supportsColors,
            supportsComponents: instance.supportsComponents,
            supportsLayers: instance.supportsLayers,
            supportsAnimations: instance.supportsAnimations
        });
    }
    
    return metadata;
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    ExporterClasses,
    createAllExporters,
    getExporter,
    listExporterIds,
    getExporterMetadata
};
