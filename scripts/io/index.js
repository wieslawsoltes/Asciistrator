/**
 * Asciistrator - I/O Module Index
 * 
 * Exports all file import/export functionality.
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

// Export formats
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
 * Supported export formats
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
 * Export to specified format
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
    
    // Export
    TextExporter,
    HTMLExporter,
    ANSIExporter,
    PNGExporter,
    MarkdownExporter,
    PDFExporter,
    exportAs,
    
    // Unified interface
    ImportFormats,
    ExportFormats,
    detectImportFormat,
    importFile,
    exportFile
};
