/**
 * Asciistrator - Markdown Exporter
 * 
 * Exports ASCII art as Markdown code blocks.
 * 
 * @version 1.0.0
 */

import BaseExporter from './BaseExporter.js';
import { ExportCategory } from '../ExporterRegistry.js';
import TextExporter from './TextExporter.js';

// ==========================================
// MARKDOWN EXPORTER
// ==========================================

/**
 * Markdown code block exporter
 */
export class MarkdownExporter extends BaseExporter {
    constructor(config = {}) {
        super(config);
        this._textExporter = new TextExporter();
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'markdown'; }
    get name() { return 'Markdown'; }
    get description() { return 'Export as Markdown code block (.md)'; }
    get fileExtension() { return '.md'; }
    get mimeType() { return 'text/markdown'; }
    get category() { return ExportCategory.Document; }
    
    // ==========================================
    // CAPABILITIES
    // ==========================================
    
    get supportsColors() { return false; }
    get supportsComponents() { return false; }
    get supportsLayers() { return false; }
    get supportsAnimations() { return false; }
    
    get defaultOptions() {
        return {
            ...super.defaultOptions,
            language: '',
            title: '',
            titleLevel: 2,
            includeTitle: false,
            includeTimestamp: false,
            includeFooter: false,
            fenceStyle: 'backticks',  // 'backticks' or 'tildes'
            wrapInDetails: false,
            detailsSummary: 'ASCII Art'
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    /**
     * Export buffer to Markdown
     * @protected
     */
    _doExport(document, options) {
        // Get plain text content
        const textResult = this._textExporter.export(document, {
            trimTrailingSpaces: true,
            trimTrailingLines: true
        });
        
        const text = textResult.success ? textResult.content : '';
        
        // Build markdown
        let md = '';
        
        // Add title if enabled
        if (options.includeTitle && options.title) {
            const hashes = '#'.repeat(options.titleLevel);
            md += `${hashes} ${options.title}\n\n`;
        }
        
        // Add timestamp if enabled
        if (options.includeTimestamp) {
            md += `*Generated: ${new Date().toLocaleString()}*\n\n`;
        }
        
        // Get fence character
        const fence = options.fenceStyle === 'tildes' ? '~~~' : '```';
        
        // Build code block
        let codeBlock = `${fence}${options.language}\n`;
        codeBlock += text + '\n';
        codeBlock += fence;
        
        // Wrap in details if requested
        if (options.wrapInDetails) {
            md += `<details>\n<summary>${this._escapeHtml(options.detailsSummary)}</summary>\n\n`;
            md += codeBlock + '\n\n';
            md += '</details>';
        } else {
            md += codeBlock;
        }
        
        // Add footer if enabled
        if (options.includeFooter) {
            md += '\n\n---\n*Created with Asciistrator*';
        }
        
        return md;
    }
    
    /**
     * Export component as inline code
     * @protected
     */
    _doExportComponent(component, options) {
        const text = this._textExporter.exportComponent(component, options);
        const fence = options.fenceStyle === 'tildes' ? '~~~' : '```';
        return `${fence}${options.language}\n${text}\n${fence}`;
    }
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default MarkdownExporter;
