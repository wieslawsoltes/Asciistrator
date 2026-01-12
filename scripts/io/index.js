/**
 * Asciistrator - I/O Module Index
 * 
 * Exports all file import/export functionality including the
 * extensible export system architecture.
 * 
 * @version 2.0.0
 */

// Native format
export {
    FORMAT_VERSION,
    NativeDocument,
    ObjectFactory,
    saveNativeDocument,
    loadNativeDocument
} from './native.js';

// SVG import/export
export {
    SVGImporter,
    SVGExporter
} from './svg.js';

// Image to ASCII conversion
export {
    AsciiPalettes,
    ImageToAscii
} from './image.js';

// Legacy export formats (for backwards compatibility)
export {
    TextExporter,
    HTMLExporter,
    ANSIExporter,
    PNGExporter,
    MarkdownExporter,
    PDFExporter,
    exportAs
} from './export.js';

// ==========================================
// EXTENSIBLE EXPORT SYSTEM (Phase 3)
// ==========================================

// Exporter Registry
export {
    ExportCategory,
    StyleExportMode,
    DefaultExportOptions,
    ValidationResult,
    ExportResult,
    ExporterRegistry,
    globalRegistry
} from './ExporterRegistry.js';

// Export Manager
export {
    ExportJobStatus,
    ExportJob,
    BatchExportResult,
    ExportManager,
    exportManager
} from './ExportManager.js';

// All Exporters
export {
    // Base
    BaseExporter,
    
    // Plain Text
    TextExporter as NewTextExporter,
    
    // Rich Text
    HTMLExporter as NewHTMLExporter,
    ANSIExporter as NewANSIExporter,
    ANSI,
    MarkdownExporter as NewMarkdownExporter,
    
    // Vector
    SVGExporter as NewSVGExporter,
    
    // Image
    PNGExporter as NewPNGExporter,
    
    // Document
    JSONExporter,
    LaTeXExporter,
    
    // UI Frameworks
    BaseXAMLExporter,
    AvaloniaExporter,
    WPFExporter,
    MAUIExporter,
    UWPExporter,
    
    // Web Frameworks
    BaseWebExporter,
    ReactExporter,
    VueExporter,
    AngularExporter,
    SvelteExporter,
    WebComponentExporter,
    
    // Collections
    ExporterClasses,
    createAllExporters,
    getExporter,
    listExporterIds,
    getExporterMetadata
} from './exporters/index.js';

// Export Dialog UI
export {
    ExportDialog,
    showExportDialog,
    quickExport,
    getExportString
} from './ExportDialog.js';

// Avalonia Export Dialog
export {
    AvaloniaExportDialog,
    showAvaloniaExportDialog,
    quickAvaloniaExport
} from './AvaloniaExportDialog.js';

// ==========================================
// UNIFIED IMPORT/EXPORT INTERFACE
// ==========================================

/**
 * Supported import formats
 */
export const ImportFormats = {
    native: {
        name: 'Native (.ascii)',
        extensions: ['.ascii', '.json'],
        mimeTypes: ['application/json'],
        handler: async (file) => {
            const { loadNativeDocument } = await import('./native.js');
            return loadNativeDocument(file);
        }
    },
    svg: {
        name: 'SVG (.svg)',
        extensions: ['.svg'],
        mimeTypes: ['image/svg+xml'],
        handler: async (file, options) => {
            const { SVGImporter } = await import('./svg.js');
            const importer = new SVGImporter(options);
            return importer.importFile(file);
        }
    },
    image: {
        name: 'Image (PNG, JPG, etc.)',
        extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
        mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'],
        handler: async (file, options) => {
            const { ImageToAscii } = await import('./image.js');
            const converter = new ImageToAscii(options);
            return converter.convertFile(file);
        }
    }
};

/**
 * Supported export formats (legacy)
 */
export const ExportFormats = {
    native: {
        name: 'Native (.ascii)',
        extension: '.ascii',
        mimeType: 'application/json'
    },
    text: {
        name: 'Plain Text (.txt)',
        extension: '.txt',
        mimeType: 'text/plain'
    },
    html: {
        name: 'HTML (.html)',
        extension: '.html',
        mimeType: 'text/html'
    },
    svg: {
        name: 'SVG (.svg)',
        extension: '.svg',
        mimeType: 'image/svg+xml'
    },
    png: {
        name: 'PNG Image (.png)',
        extension: '.png',
        mimeType: 'image/png'
    },
    ansi: {
        name: 'ANSI Text (.ans)',
        extension: '.ans',
        mimeType: 'text/plain'
    },
    markdown: {
        name: 'Markdown (.md)',
        extension: '.md',
        mimeType: 'text/markdown'
    },
    pdf: {
        name: 'PDF (Print)',
        extension: '.pdf',
        mimeType: 'application/pdf'
    },
    // New export formats (Phase 3)
    json: {
        name: 'JSON (.json)',
        extension: '.json',
        mimeType: 'application/json'
    },
    latex: {
        name: 'LaTeX (.tex)',
        extension: '.tex',
        mimeType: 'application/x-latex'
    },
    avalonia: {
        name: 'Avalonia UI (.axaml)',
        extension: '.axaml',
        mimeType: 'application/xaml+xml'
    },
    wpf: {
        name: 'WPF XAML (.xaml)',
        extension: '.xaml',
        mimeType: 'application/xaml+xml'
    },
    maui: {
        name: '.NET MAUI (.xaml)',
        extension: '.xaml',
        mimeType: 'application/xaml+xml'
    },
    uwp: {
        name: 'UWP XAML (.xaml)',
        extension: '.xaml',
        mimeType: 'application/xaml+xml'
    },
    react: {
        name: 'React Component (.jsx)',
        extension: '.jsx',
        mimeType: 'text/javascript'
    },
    vue: {
        name: 'Vue Component (.vue)',
        extension: '.vue',
        mimeType: 'text/x-vue'
    },
    angular: {
        name: 'Angular Component (.ts)',
        extension: '.ts',
        mimeType: 'text/typescript'
    },
    svelte: {
        name: 'Svelte Component (.svelte)',
        extension: '.svelte',
        mimeType: 'text/x-svelte'
    },
    webcomponent: {
        name: 'Web Component (.js)',
        extension: '.js',
        mimeType: 'text/javascript'
    }
};

/**
 * Detect import format from file
 * @param {File} file 
 * @returns {string|null} Format key or null if unknown
 */
export function detectImportFormat(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    
    for (const [format, info] of Object.entries(ImportFormats)) {
        if (info.extensions.includes(ext) || info.mimeTypes.includes(file.type)) {
            return format;
        }
    }
    
    return null;
}

/**
 * Import a file with auto-detection
 * @param {File} file 
 * @param {object} options 
 * @returns {Promise<any>}
 */
export async function importFile(file, options = {}) {
    const format = options.format || detectImportFormat(file);
    
    if (!format) {
        throw new Error(`Unknown file format: ${file.name}`);
    }
    
    const formatInfo = ImportFormats[format];
    if (!formatInfo) {
        throw new Error(`Unsupported import format: ${format}`);
    }
    
    return formatInfo.handler(file, options);
}

/**
 * Export to specified format (legacy)
 * @param {object} data - Data to export (buffer, document, etc.)
 * @param {string} format - Export format key
 * @param {object} options - Format-specific options
 * @param {string} filename - Output filename
 */
export async function exportFile(data, format, options = {}, filename = null) {
    const formatInfo = ExportFormats[format];
    if (!formatInfo) {
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    const defaultFilename = `export${formatInfo.extension}`;
    const outputFilename = filename || defaultFilename;
    
    switch (format) {
        case 'native':
            const { saveNativeDocument } = await import('./native.js');
            saveNativeDocument(data.appState, data.layers, outputFilename);
            break;
            
        case 'svg':
            const { SVGExporter } = await import('./svg.js');
            const exporter = new SVGExporter(options);
            exporter.download(data.buffer, outputFilename);
            break;
            
        default:
            const { exportAs } = await import('./export.js');
            exportAs(data.buffer, format, options, outputFilename);
            break;
    }
}

/**
 * Export using the new extensible export system (Phase 3)
 * @param {object} document - Document to export
 * @param {string} formatId - Export format ID
 * @param {object} options - Export options
 * @param {string} filename - Output filename (optional)
 * @returns {Promise<void>}
 */
export async function exportDocument(document, formatId, options = {}, filename = null) {
    const { exportManager } = await import('./ExportManager.js');
    
    if (!exportManager.isInitialized) {
        exportManager.initialize();
    }
    
    return exportManager.exportToFile(document, formatId, filename, options);
}

/**
 * Get export result without downloading (Phase 3)
 * @param {object} document - Document to export
 * @param {string} formatId - Export format ID
 * @param {object} options - Export options
 * @returns {ExportResult}
 */
export async function exportToString(document, formatId, options = {}) {
    const { exportManager } = await import('./ExportManager.js');
    
    if (!exportManager.isInitialized) {
        exportManager.initialize();
    }
    
    return exportManager.export(document, formatId, options);
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    // Native
    FORMAT_VERSION,
    NativeDocument,
    ObjectFactory,
    saveNativeDocument,
    loadNativeDocument,
    
    // SVG
    SVGImporter,
    SVGExporter,
    
    // Image
    AsciiPalettes,
    ImageToAscii,
    
    // Legacy Export
    TextExporter,
    HTMLExporter,
    ANSIExporter,
    PNGExporter,
    MarkdownExporter,
    PDFExporter,
    exportAs,
    
    // Unified interface (legacy)
    ImportFormats,
    ExportFormats,
    detectImportFormat,
    importFile,
    exportFile,
    
    // Phase 3: Extensible Export System
    ExportCategory,
    StyleExportMode,
    DefaultExportOptions,
    ValidationResult,
    ExportResult,
    ExporterRegistry,
    globalRegistry,
    ExportJobStatus,
    ExportJob,
    BatchExportResult,
    ExportManager,
    exportManager,
    BaseExporter,
    JSONExporter,
    LaTeXExporter,
    BaseXAMLExporter,
    AvaloniaExporter,
    WPFExporter,
    MAUIExporter,
    UWPExporter,
    BaseWebExporter,
    ReactExporter,
    VueExporter,
    AngularExporter,
    SvelteExporter,
    WebComponentExporter,
    ExporterClasses,
    createAllExporters,
    getExporter,
    listExporterIds,
    getExporterMetadata,
    exportDocument,
    exportToString,
    
    // Export Dialog
    ExportDialog,
    showExportDialog,
    quickExport,
    getExportString
};
