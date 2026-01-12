/**
 * Asciistrator - Export System Tests
 * 
 * Unit tests for the extensible export system (Phase 3).
 * 
 * @version 1.0.0
 */

import { TestSuite, assertEquals, assertTrue, assertFalse, assertNotNull } from '../framework.js';

// ==========================================
// TEST SUITE
// ==========================================

const ExportSystemTests = new TestSuite('Export System Tests');

// ==========================================
// MOCK DATA
// ==========================================

/**
 * Create a mock document with buffer
 */
function createMockDocument(width = 10, height = 5) {
    const buffer = {
        width,
        height,
        chars: [],
        colors: []
    };
    
    // Fill with test pattern
    for (let y = 0; y < height; y++) {
        const row = [];
        const colorRow = [];
        for (let x = 0; x < width; x++) {
            // Create a simple pattern
            if ((x + y) % 2 === 0) {
                row.push('#');
                colorRow.push('#ff0000');
            } else {
                row.push('.');
                colorRow.push('#00ff00');
            }
        }
        buffer.chars.push(row);
        buffer.colors.push(colorRow);
    }
    
    return {
        buffer,
        title: 'Test Document',
        author: 'Test Author'
    };
}

// ==========================================
// EXPORTER REGISTRY TESTS
// ==========================================

ExportSystemTests.addTest('ExporterRegistry - Create registry', async () => {
    const { ExporterRegistry } = await import('../../io/ExporterRegistry.js');
    
    const registry = new ExporterRegistry();
    assertNotNull(registry);
    assertEquals(0, registry.count);
});

ExportSystemTests.addTest('ExporterRegistry - Register exporter', async () => {
    const { ExporterRegistry } = await import('../../io/ExporterRegistry.js');
    const { TextExporter } = await import('../../io/exporters/TextExporter.js');
    
    const registry = new ExporterRegistry();
    const exporter = new TextExporter();
    
    registry.register(exporter);
    assertEquals(1, registry.count);
    assertTrue(registry.has('text'));
});

ExportSystemTests.addTest('ExporterRegistry - Get by ID', async () => {
    const { ExporterRegistry } = await import('../../io/ExporterRegistry.js');
    const { TextExporter } = await import('../../io/exporters/TextExporter.js');
    
    const registry = new ExporterRegistry();
    const exporter = new TextExporter();
    
    registry.register(exporter);
    
    const retrieved = registry.get('text');
    assertNotNull(retrieved);
    assertEquals('text', retrieved.id);
});

ExportSystemTests.addTest('ExporterRegistry - Get by extension', async () => {
    const { ExporterRegistry } = await import('../../io/ExporterRegistry.js');
    const { TextExporter } = await import('../../io/exporters/TextExporter.js');
    
    const registry = new ExporterRegistry();
    registry.register(new TextExporter());
    
    const retrieved = registry.getByExtension('.txt');
    assertNotNull(retrieved);
    assertEquals('text', retrieved.id);
});

ExportSystemTests.addTest('ExporterRegistry - Get by MIME type', async () => {
    const { ExporterRegistry } = await import('../../io/ExporterRegistry.js');
    const { HTMLExporter } = await import('../../io/exporters/HTMLExporter.js');
    
    const registry = new ExporterRegistry();
    registry.register(new HTMLExporter());
    
    const retrieved = registry.getByMimeType('text/html');
    assertNotNull(retrieved);
    assertEquals('html', retrieved.id);
});

ExportSystemTests.addTest('ExporterRegistry - Get by category', async () => {
    const { ExporterRegistry, ExportCategory } = await import('../../io/ExporterRegistry.js');
    const { TextExporter } = await import('../../io/exporters/TextExporter.js');
    const { HTMLExporter } = await import('../../io/exporters/HTMLExporter.js');
    
    const registry = new ExporterRegistry();
    registry.register(new TextExporter());
    registry.register(new HTMLExporter());
    
    const richTextExporters = registry.getByCategory(ExportCategory.RichText);
    assertTrue(richTextExporters.length >= 1);
});

ExportSystemTests.addTest('ExporterRegistry - Unregister exporter', async () => {
    const { ExporterRegistry } = await import('../../io/ExporterRegistry.js');
    const { TextExporter } = await import('../../io/exporters/TextExporter.js');
    
    const registry = new ExporterRegistry();
    registry.register(new TextExporter());
    assertEquals(1, registry.count);
    
    const success = registry.unregister('text');
    assertTrue(success);
    assertEquals(0, registry.count);
    assertFalse(registry.has('text'));
});

// ==========================================
// BASE EXPORTER TESTS
// ==========================================

ExportSystemTests.addTest('BaseExporter - Properties', async () => {
    const { TextExporter } = await import('../../io/exporters/TextExporter.js');
    
    const exporter = new TextExporter();
    
    assertEquals('text', exporter.id);
    assertEquals('Plain Text', exporter.name);
    assertEquals('.txt', exporter.fileExtension);
    assertEquals('text/plain', exporter.mimeType);
});

ExportSystemTests.addTest('BaseExporter - Default options', async () => {
    const { TextExporter } = await import('../../io/exporters/TextExporter.js');
    
    const exporter = new TextExporter();
    const options = exporter.defaultOptions;
    
    assertNotNull(options);
    assertTrue(typeof options.trimTrailingSpaces === 'boolean');
});

// ==========================================
// TEXT EXPORTER TESTS
// ==========================================

ExportSystemTests.addTest('TextExporter - Basic export', async () => {
    const { TextExporter } = await import('../../io/exporters/TextExporter.js');
    
    const exporter = new TextExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.length > 0);
    assertTrue(result.includes('#'));
    assertTrue(result.includes('.'));
});

ExportSystemTests.addTest('TextExporter - Line endings option', async () => {
    const { TextExporter } = await import('../../io/exporters/TextExporter.js');
    
    const exporter = new TextExporter();
    const doc = createMockDocument(3, 2);
    
    const resultLF = exporter.export(doc, { lineEnding: '\n' });
    const resultCRLF = exporter.export(doc, { lineEnding: '\r\n' });
    
    assertTrue(resultLF.includes('\n'));
    assertTrue(resultCRLF.includes('\r\n'));
});

// ==========================================
// HTML EXPORTER TESTS
// ==========================================

ExportSystemTests.addTest('HTMLExporter - Basic export', async () => {
    const { HTMLExporter } = await import('../../io/exporters/HTMLExporter.js');
    
    const exporter = new HTMLExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('<'));
    assertTrue(result.includes('>'));
});

ExportSystemTests.addTest('HTMLExporter - Full document mode', async () => {
    const { HTMLExporter } = await import('../../io/exporters/HTMLExporter.js');
    
    const exporter = new HTMLExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc, { wrapInDocument: true });
    
    assertTrue(result.includes('<!DOCTYPE html>'));
    assertTrue(result.includes('<html'));
    assertTrue(result.includes('</html>'));
});

ExportSystemTests.addTest('HTMLExporter - Color spans', async () => {
    const { HTMLExporter } = await import('../../io/exporters/HTMLExporter.js');
    
    const exporter = new HTMLExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc, { useSpans: true });
    
    assertTrue(result.includes('<span'));
    assertTrue(result.includes('color:'));
});

// ==========================================
// ANSI EXPORTER TESTS
// ==========================================

ExportSystemTests.addTest('ANSIExporter - Basic export', async () => {
    const { ANSIExporter } = await import('../../io/exporters/ANSIExporter.js');
    
    const exporter = new ANSIExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('\x1b['));
});

ExportSystemTests.addTest('ANSIExporter - Color modes', async () => {
    const { ANSIExporter } = await import('../../io/exporters/ANSIExporter.js');
    
    const exporter = new ANSIExporter();
    const doc = createMockDocument(5, 3);
    
    const result16 = exporter.export(doc, { colorMode: '16' });
    const result256 = exporter.export(doc, { colorMode: '256' });
    const resultTrue = exporter.export(doc, { colorMode: 'truecolor' });
    
    assertNotNull(result16);
    assertNotNull(result256);
    assertNotNull(resultTrue);
});

// ==========================================
// SVG EXPORTER TESTS
// ==========================================

ExportSystemTests.addTest('SVGExporter - Basic export', async () => {
    const { SVGExporter } = await import('../../io/exporters/SVGExporter.js');
    
    const exporter = new SVGExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('<svg'));
    assertTrue(result.includes('</svg>'));
});

ExportSystemTests.addTest('SVGExporter - XML declaration', async () => {
    const { SVGExporter } = await import('../../io/exporters/SVGExporter.js');
    
    const exporter = new SVGExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertTrue(result.includes('<?xml'));
});

// ==========================================
// MARKDOWN EXPORTER TESTS
// ==========================================

ExportSystemTests.addTest('MarkdownExporter - Basic export', async () => {
    const { MarkdownExporter } = await import('../../io/exporters/MarkdownExporter.js');
    
    const exporter = new MarkdownExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('```'));
});

ExportSystemTests.addTest('MarkdownExporter - With title', async () => {
    const { MarkdownExporter } = await import('../../io/exporters/MarkdownExporter.js');
    
    const exporter = new MarkdownExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc, { title: 'My ASCII Art' });
    
    assertTrue(result.includes('My ASCII Art'));
});

// ==========================================
// JSON EXPORTER TESTS
// ==========================================

ExportSystemTests.addTest('JSONExporter - Basic export', async () => {
    const { JSONExporter } = await import('../../io/exporters/JSONExporter.js');
    
    const exporter = new JSONExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    
    // Should be valid JSON
    const parsed = JSON.parse(result);
    assertNotNull(parsed);
});

ExportSystemTests.addTest('JSONExporter - Includes metadata', async () => {
    const { JSONExporter } = await import('../../io/exporters/JSONExporter.js');
    
    const exporter = new JSONExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc, { includeMetadata: true });
    const parsed = JSON.parse(result);
    
    assertNotNull(parsed.metadata);
    assertEquals('Asciistrator', parsed.metadata.generator);
});

ExportSystemTests.addTest('JSONExporter - Statistics', async () => {
    const { JSONExporter } = await import('../../io/exporters/JSONExporter.js');
    
    const exporter = new JSONExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc, { includeStatistics: true });
    const parsed = JSON.parse(result);
    
    assertNotNull(parsed.statistics);
    assertTrue(parsed.statistics.totalCells > 0);
});

// ==========================================
// LATEX EXPORTER TESTS
// ==========================================

ExportSystemTests.addTest('LaTeXExporter - Basic export', async () => {
    const { LaTeXExporter } = await import('../../io/exporters/LaTeXExporter.js');
    
    const exporter = new LaTeXExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('\\begin{'));
    assertTrue(result.includes('\\end{'));
});

ExportSystemTests.addTest('LaTeXExporter - Full document mode', async () => {
    const { LaTeXExporter } = await import('../../io/exporters/LaTeXExporter.js');
    
    const exporter = new LaTeXExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc, { wrapInDocument: true });
    
    assertTrue(result.includes('\\documentclass'));
    assertTrue(result.includes('\\begin{document}'));
    assertTrue(result.includes('\\end{document}'));
});

// ==========================================
// UI FRAMEWORK EXPORTER TESTS
// ==========================================

ExportSystemTests.addTest('AvaloniaExporter - Basic export', async () => {
    const { AvaloniaExporter } = await import('../../io/exporters/UIFrameworkExporters.js');
    
    const exporter = new AvaloniaExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('<?xml'));
    assertTrue(result.includes('avaloniaui'));
});

ExportSystemTests.addTest('WPFExporter - Basic export', async () => {
    const { WPFExporter } = await import('../../io/exporters/UIFrameworkExporters.js');
    
    const exporter = new WPFExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('<?xml'));
    assertTrue(result.includes('schemas.microsoft.com'));
});

ExportSystemTests.addTest('MAUIExporter - Basic export', async () => {
    const { MAUIExporter } = await import('../../io/exporters/UIFrameworkExporters.js');
    
    const exporter = new MAUIExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('ContentView'));
    assertTrue(result.includes('maui'));
});

// ==========================================
// WEB FRAMEWORK EXPORTER TESTS
// ==========================================

ExportSystemTests.addTest('ReactExporter - Basic export', async () => {
    const { ReactExporter } = await import('../../io/exporters/WebFrameworkExporters.js');
    
    const exporter = new ReactExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('import React'));
    assertTrue(result.includes('export default'));
});

ExportSystemTests.addTest('VueExporter - Basic export', async () => {
    const { VueExporter } = await import('../../io/exporters/WebFrameworkExporters.js');
    
    const exporter = new VueExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('<template>'));
    assertTrue(result.includes('<script'));
    assertTrue(result.includes('<style'));
});

ExportSystemTests.addTest('AngularExporter - Basic export', async () => {
    const { AngularExporter } = await import('../../io/exporters/WebFrameworkExporters.js');
    
    const exporter = new AngularExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('@Component'));
    assertTrue(result.includes('export class'));
});

ExportSystemTests.addTest('SvelteExporter - Basic export', async () => {
    const { SvelteExporter } = await import('../../io/exporters/WebFrameworkExporters.js');
    
    const exporter = new SvelteExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('<script>'));
    assertTrue(result.includes('<style>'));
});

ExportSystemTests.addTest('WebComponentExporter - Basic export', async () => {
    const { WebComponentExporter } = await import('../../io/exporters/WebFrameworkExporters.js');
    
    const exporter = new WebComponentExporter();
    const doc = createMockDocument(5, 3);
    
    const result = exporter.export(doc);
    
    assertNotNull(result);
    assertTrue(result.includes('extends HTMLElement'));
    assertTrue(result.includes('customElements.define'));
});

// ==========================================
// EXPORT MANAGER TESTS
// ==========================================

ExportSystemTests.addTest('ExportManager - Initialize', async () => {
    const { ExportManager } = await import('../../io/ExportManager.js');
    
    const manager = new ExportManager();
    assertFalse(manager.isInitialized);
    
    manager.initialize();
    assertTrue(manager.isInitialized);
});

ExportSystemTests.addTest('ExportManager - Get all exporters', async () => {
    const { ExportManager } = await import('../../io/ExportManager.js');
    
    const manager = new ExportManager();
    manager.initialize();
    
    const exporters = manager.getAllExporters();
    assertTrue(exporters.length > 0);
});

ExportSystemTests.addTest('ExportManager - Export single format', async () => {
    const { ExportManager } = await import('../../io/ExportManager.js');
    
    const manager = new ExportManager();
    manager.initialize();
    
    const doc = createMockDocument(5, 3);
    const result = manager.export(doc, 'text');
    
    assertTrue(result.success);
    assertNotNull(result.data);
});

ExportSystemTests.addTest('ExportManager - Export multiple formats', async () => {
    const { ExportManager } = await import('../../io/ExportManager.js');
    
    const manager = new ExportManager();
    manager.initialize();
    
    const doc = createMockDocument(5, 3);
    const result = manager.exportMultiple(doc, ['text', 'html', 'markdown']);
    
    assertEquals(3, result.jobs.length);
    assertTrue(result.successRate > 0);
});

ExportSystemTests.addTest('ExportManager - Validate document', async () => {
    const { ExportManager } = await import('../../io/ExportManager.js');
    
    const manager = new ExportManager();
    manager.initialize();
    
    const doc = createMockDocument(5, 3);
    const result = manager.validate(doc, 'text');
    
    assertNotNull(result);
    assertTrue(result.isValid !== undefined);
});

ExportSystemTests.addTest('ExportManager - Events', async () => {
    const { ExportManager } = await import('../../io/ExportManager.js');
    
    const manager = new ExportManager();
    manager.initialize();
    
    let eventFired = false;
    manager.on('export-start', () => {
        eventFired = true;
    });
    
    const doc = createMockDocument(5, 3);
    manager.export(doc, 'text');
    
    assertTrue(eventFired);
});

// ==========================================
// VALIDATION TESTS
// ==========================================

ExportSystemTests.addTest('ValidationResult - Create result', async () => {
    const { ValidationResult } = await import('../../io/ExporterRegistry.js');
    
    const result = new ValidationResult(true);
    assertTrue(result.isValid);
    assertEquals(0, result.errors.length);
    assertEquals(0, result.warnings.length);
});

ExportSystemTests.addTest('ValidationResult - Add errors', async () => {
    const { ValidationResult } = await import('../../io/ExporterRegistry.js');
    
    const result = new ValidationResult(true);
    result.addError('TEST_ERROR', 'Test error message');
    
    assertFalse(result.isValid);
    assertEquals(1, result.errors.length);
});

ExportSystemTests.addTest('ValidationResult - Add warnings', async () => {
    const { ValidationResult } = await import('../../io/ExporterRegistry.js');
    
    const result = new ValidationResult(true);
    result.addWarning('TEST_WARNING', 'Test warning message');
    
    assertTrue(result.isValid); // Warnings don't invalidate
    assertEquals(1, result.warnings.length);
});

// ==========================================
// EXPORT RESULT TESTS
// ==========================================

ExportSystemTests.addTest('ExportResult - Success result', async () => {
    const { ExportResult } = await import('../../io/ExporterRegistry.js');
    
    const result = new ExportResult(true, 'test data');
    assertTrue(result.success);
    assertEquals('test data', result.data);
    assertEquals(0, result.errors.length);
});

ExportSystemTests.addTest('ExportResult - Failure result', async () => {
    const { ExportResult } = await import('../../io/ExporterRegistry.js');
    
    const result = new ExportResult(false, null, [{ code: 'ERR', message: 'Error' }]);
    assertFalse(result.success);
    assertEquals(1, result.errors.length);
});

// ==========================================
// INTEGRATION TESTS
// ==========================================

ExportSystemTests.addTest('Integration - Full export workflow', async () => {
    const { exportManager } = await import('../../io/ExportManager.js');
    
    if (!exportManager.isInitialized) {
        exportManager.initialize();
    }
    
    const doc = createMockDocument(10, 5);
    
    // Export to multiple formats
    const formats = ['text', 'html', 'svg', 'markdown', 'json'];
    const results = {};
    
    for (const format of formats) {
        const result = exportManager.export(doc, format);
        results[format] = result;
        assertTrue(result.success, `Export to ${format} should succeed`);
    }
    
    // Verify each result has content
    for (const [format, result] of Object.entries(results)) {
        assertNotNull(result.data, `${format} should have data`);
        assertTrue(result.data.length > 0, `${format} data should not be empty`);
    }
});

ExportSystemTests.addTest('Integration - Export with custom options', async () => {
    const { exportManager } = await import('../../io/ExportManager.js');
    
    if (!exportManager.isInitialized) {
        exportManager.initialize();
    }
    
    const doc = createMockDocument(5, 3);
    
    // Text with CRLF line endings
    const textResult = exportManager.export(doc, 'text', { lineEnding: '\r\n' });
    assertTrue(textResult.success);
    assertTrue(textResult.data.includes('\r\n'));
    
    // HTML with full document
    const htmlResult = exportManager.export(doc, 'html', { wrapInDocument: true });
    assertTrue(htmlResult.success);
    assertTrue(htmlResult.data.includes('<!DOCTYPE html>'));
    
    // JSON compact format
    const jsonResult = exportManager.export(doc, 'json', { compactFormat: true });
    assertTrue(jsonResult.success);
    const parsed = JSON.parse(jsonResult.data);
    assertTrue(Array.isArray(parsed.content)); // Compact format uses array of strings
});

// ==========================================
// EXPORT
// ==========================================

export default ExportSystemTests;
