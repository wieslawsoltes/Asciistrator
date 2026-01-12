/**
 * Asciistrator - Web Framework Exporters
 * 
 * Exporters for generating code for web frameworks:
 * - React/JSX
 * - Vue
 * - Angular
 * - Svelte
 * - Web Component
 * 
 * @version 1.0.0
 */

import BaseExporter from './BaseExporter.js';
import { ExportCategory, StyleExportMode } from '../ExporterRegistry.js';

// ==========================================
// BASE WEB FRAMEWORK EXPORTER
// ==========================================

/**
 * Base class for web framework exporters
 */
export class BaseWebExporter extends BaseExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // CAPABILITIES
    // ==========================================
    
    get supportsColors() { return true; }
    get supportsComponents() { return true; }
    get supportsLayers() { return false; }
    get supportsAnimations() { return true; }
    
    get defaultOptions() {
        return {
            ...super.defaultOptions,
            styleExportMode: StyleExportMode.Inline,
            indentSize: 2,
            indentChar: ' ',
            componentName: 'AsciiArt',
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontSize: '14px',
            lineHeight: '1.2',
            backgroundColor: '#1a1a2e',
            defaultColor: '#e0e0e0',
            useTypeScript: false,
            generateStylesheet: true
        };
    }
    
    // ==========================================
    // HELPER METHODS
    // ==========================================
    
    /**
     * Generate CSS class name from color
     * @protected
     */
    _colorToClassName(color) {
        if (!color || color === 'default') return 'ascii-default';
        return `ascii-color-${color.replace('#', '')}`;
    }
    
    /**
     * Collect unique colors from buffer
     * @protected
     */
    _collectColors(buffer, width, height) {
        const colors = new Set();
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const color = this._getColor(buffer, x, y);
                if (color) colors.add(color);
            }
        }
        return Array.from(colors);
    }
    
    /**
     * Generate CSS styles
     * @protected
     */
    _generateCSS(options, colors = []) {
        const lines = [];
        
        lines.push('.ascii-container {');
        lines.push(`  font-family: ${options.fontFamily};`);
        lines.push(`  font-size: ${options.fontSize};`);
        lines.push(`  line-height: ${options.lineHeight};`);
        lines.push(`  background-color: ${options.backgroundColor};`);
        lines.push('  white-space: pre;');
        lines.push('  overflow: auto;');
        lines.push('  padding: 16px;');
        lines.push('}');
        lines.push('');
        lines.push('.ascii-line {');
        lines.push('  display: block;');
        lines.push('}');
        lines.push('');
        lines.push(`.ascii-default {`);
        lines.push(`  color: ${options.defaultColor};`);
        lines.push('}');
        
        // Generate color classes
        for (const color of colors) {
            const className = this._colorToClassName(color);
            lines.push('');
            lines.push(`.${className} {`);
            lines.push(`  color: ${color};`);
            lines.push('}');
        }
        
        return lines.join('\n');
    }
    
    /**
     * Convert buffer to line-by-line text with color spans
     * @protected
     */
    _bufferToColoredLines(buffer, width, height, options) {
        const lines = [];
        
        for (let y = 0; y < height; y++) {
            const spans = [];
            let currentColor = null;
            let currentText = '';
            
            for (let x = 0; x < width; x++) {
                const char = this._getChar(buffer, x, y);
                const color = this._getColor(buffer, x, y) || 'default';
                
                if (color !== currentColor) {
                    if (currentText) {
                        spans.push({ color: currentColor, text: currentText });
                    }
                    currentColor = color;
                    currentText = char;
                } else {
                    currentText += char;
                }
            }
            
            // Push remaining text
            if (currentText) {
                spans.push({ color: currentColor, text: currentText });
            }
            
            lines.push(spans);
        }
        
        return lines;
    }
}

// ==========================================
// REACT EXPORTER
// ==========================================

/**
 * React/JSX exporter
 */
export class ReactExporter extends BaseWebExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'react'; }
    get name() { return 'React Component'; }
    get description() { return 'Export as React JSX component (.jsx)'; }
    get fileExtension() { return '.jsx'; }
    get mimeType() { return 'text/javascript'; }
    get category() { return ExportCategory.WebFramework; }
    
    get defaultOptions() {
        return {
            ...super.defaultOptions,
            useTypeScript: false,
            useCSSModules: false,
            useStyledComponents: false
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._generateEmptyComponent(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const colors = this._collectColors(buffer, width, height);
        const coloredLines = this._bufferToColoredLines(buffer, width, height, options);
        const indent = this._indent(1, options);
        const indent2 = this._indent(2, options);
        const indent3 = this._indent(3, options);
        const indent4 = this._indent(4, options);
        
        const lines = [];
        
        // Header comment
        lines.push('/**');
        lines.push(' * Generated by Asciistrator - React Component');
        lines.push(` * Dimensions: ${width}x${height} characters`);
        lines.push(' */');
        lines.push('');
        
        // Imports
        lines.push("import React from 'react';");
        if (options.generateStylesheet) {
            lines.push(`import './${options.componentName}.css';`);
        }
        lines.push('');
        
        // Component
        const tsProps = options.useTypeScript ? ': React.FC' : '';
        lines.push(`const ${options.componentName}${tsProps} = () => {`);
        lines.push(`${indent}return (`);
        lines.push(`${indent2}<div className="ascii-container">`);
        
        // Render lines
        for (let i = 0; i < coloredLines.length; i++) {
            const spans = coloredLines[i];
            const lineContent = spans.map(({ color, text }) => {
                const className = this._colorToClassName(color);
                const escapedText = this._escapeJsx(text);
                return `<span className="${className}">${escapedText}</span>`;
            }).join('');
            
            lines.push(`${indent3}<div className="ascii-line">${lineContent}</div>`);
        }
        
        lines.push(`${indent2}</div>`);
        lines.push(`${indent});`);
        lines.push('};');
        lines.push('');
        lines.push(`export default ${options.componentName};`);
        
        // Generate CSS file content comment
        if (options.generateStylesheet) {
            lines.push('');
            lines.push('/* CSS File Content:');
            lines.push(this._generateCSS(options, colors));
            lines.push('*/');
        }
        
        return lines.join('\n');
    }
    
    /**
     * Escape JSX special characters
     * @private
     */
    _escapeJsx(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/{/g, '&#123;')
            .replace(/}/g, '&#125;');
    }
    
    /**
     * Generate empty component
     * @private
     */
    _generateEmptyComponent(options) {
        const lines = [];
        lines.push("import React from 'react';");
        lines.push('');
        lines.push(`const ${options.componentName} = () => {`);
        lines.push('  return (');
        lines.push('    <div className="ascii-container">');
        lines.push('      <span className="ascii-default">Empty</span>');
        lines.push('    </div>');
        lines.push('  );');
        lines.push('};');
        lines.push('');
        lines.push(`export default ${options.componentName};`);
        return lines.join('\n');
    }
}

// ==========================================
// VUE EXPORTER
// ==========================================

/**
 * Vue Single File Component exporter
 */
export class VueExporter extends BaseWebExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'vue'; }
    get name() { return 'Vue Component'; }
    get description() { return 'Export as Vue Single File Component (.vue)'; }
    get fileExtension() { return '.vue'; }
    get mimeType() { return 'text/x-vue'; }
    get category() { return ExportCategory.WebFramework; }
    
    get defaultOptions() {
        return {
            ...super.defaultOptions,
            useCompositionAPI: true,
            useScriptSetup: true
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._generateEmptyComponent(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const colors = this._collectColors(buffer, width, height);
        const coloredLines = this._bufferToColoredLines(buffer, width, height, options);
        const indent = this._indent(1, options);
        const indent2 = this._indent(2, options);
        
        const lines = [];
        
        // Template
        lines.push('<!--');
        lines.push('  Generated by Asciistrator - Vue Component');
        lines.push(`  Dimensions: ${width}x${height} characters`);
        lines.push('-->');
        lines.push('<template>');
        lines.push(`${indent}<div class="ascii-container">`);
        
        // Render lines
        for (let i = 0; i < coloredLines.length; i++) {
            const spans = coloredLines[i];
            const lineContent = spans.map(({ color, text }) => {
                const className = this._colorToClassName(color);
                const escapedText = this._escapeHtml(text);
                return `<span class="${className}">${escapedText}</span>`;
            }).join('');
            
            lines.push(`${indent2}<div class="ascii-line">${lineContent}</div>`);
        }
        
        lines.push(`${indent}</div>`);
        lines.push('</template>');
        lines.push('');
        
        // Script
        if (options.useScriptSetup) {
            lines.push('<script setup>');
            lines.push(`// Component: ${options.componentName}`);
            lines.push('</script>');
        } else {
            lines.push('<script>');
            lines.push('export default {');
            lines.push(`  name: '${options.componentName}'`);
            lines.push('};');
            lines.push('</script>');
        }
        lines.push('');
        
        // Style
        lines.push('<style scoped>');
        lines.push(this._generateCSS(options, colors));
        lines.push('</style>');
        
        return lines.join('\n');
    }
    
    /**
     * Generate empty component
     * @private
     */
    _generateEmptyComponent(options) {
        const lines = [];
        lines.push('<template>');
        lines.push('  <div class="ascii-container">');
        lines.push('    <span class="ascii-default">Empty</span>');
        lines.push('  </div>');
        lines.push('</template>');
        lines.push('');
        lines.push('<script setup>');
        lines.push('</script>');
        lines.push('');
        lines.push('<style scoped>');
        lines.push(this._generateCSS(options, []));
        lines.push('</style>');
        return lines.join('\n');
    }
}

// ==========================================
// ANGULAR EXPORTER
// ==========================================

/**
 * Angular Component exporter
 */
export class AngularExporter extends BaseWebExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'angular'; }
    get name() { return 'Angular Component'; }
    get description() { return 'Export as Angular component (.ts)'; }
    get fileExtension() { return '.ts'; }
    get mimeType() { return 'text/typescript'; }
    get category() { return ExportCategory.WebFramework; }
    
    get defaultOptions() {
        return {
            ...super.defaultOptions,
            selector: 'app-ascii-art',
            standalone: true
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._generateEmptyComponent(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const colors = this._collectColors(buffer, width, height);
        const coloredLines = this._bufferToColoredLines(buffer, width, height, options);
        const indent = this._indent(1, options);
        
        const lines = [];
        
        // Header comment
        lines.push('/**');
        lines.push(' * Generated by Asciistrator - Angular Component');
        lines.push(` * Dimensions: ${width}x${height} characters`);
        lines.push(' */');
        lines.push('');
        
        // Imports
        lines.push("import { Component } from '@angular/core';");
        if (options.standalone) {
            lines.push("import { CommonModule } from '@angular/common';");
        }
        lines.push('');
        
        // Component decorator
        lines.push('@Component({');
        lines.push(`${indent}selector: '${options.selector}',`);
        if (options.standalone) {
            lines.push(`${indent}standalone: true,`);
            lines.push(`${indent}imports: [CommonModule],`);
        }
        lines.push(`${indent}template: \``);
        
        // Template
        lines.push(`${indent}${indent}<div class="ascii-container">`);
        
        for (let i = 0; i < coloredLines.length; i++) {
            const spans = coloredLines[i];
            const lineContent = spans.map(({ color, text }) => {
                const className = this._colorToClassName(color);
                const escapedText = this._escapeHtml(text);
                return `<span class="${className}">${escapedText}</span>`;
            }).join('');
            
            lines.push(`${indent}${indent}${indent}<div class="ascii-line">${lineContent}</div>`);
        }
        
        lines.push(`${indent}${indent}</div>`);
        lines.push(`${indent}\`,`);
        
        // Styles
        lines.push(`${indent}styles: [\`${this._generateCSS(options, colors).replace(/\n/g, ' ')}\`]`);
        lines.push('})');
        
        // Class
        lines.push(`export class ${options.componentName}Component {`);
        lines.push('}');
        
        return lines.join('\n');
    }
    
    /**
     * Generate empty component
     * @private
     */
    _generateEmptyComponent(options) {
        const lines = [];
        lines.push("import { Component } from '@angular/core';");
        lines.push('');
        lines.push('@Component({');
        lines.push(`  selector: '${options.selector}',`);
        lines.push('  standalone: true,');
        lines.push('  template: `<div class="ascii-container"><span class="ascii-default">Empty</span></div>`,');
        lines.push(`  styles: [\`${this._generateCSS(options, []).replace(/\n/g, ' ')}\`]`);
        lines.push('})');
        lines.push(`export class ${options.componentName}Component {`);
        lines.push('}');
        return lines.join('\n');
    }
}

// ==========================================
// SVELTE EXPORTER
// ==========================================

/**
 * Svelte Component exporter
 */
export class SvelteExporter extends BaseWebExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'svelte'; }
    get name() { return 'Svelte Component'; }
    get description() { return 'Export as Svelte component (.svelte)'; }
    get fileExtension() { return '.svelte'; }
    get mimeType() { return 'text/x-svelte'; }
    get category() { return ExportCategory.WebFramework; }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._generateEmptyComponent(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const colors = this._collectColors(buffer, width, height);
        const coloredLines = this._bufferToColoredLines(buffer, width, height, options);
        const indent = this._indent(1, options);
        
        const lines = [];
        
        // Script
        lines.push('<!--');
        lines.push('  Generated by Asciistrator - Svelte Component');
        lines.push(`  Dimensions: ${width}x${height} characters`);
        lines.push('-->');
        lines.push('<script>');
        lines.push(`${indent}// ${options.componentName} Component`);
        lines.push('</script>');
        lines.push('');
        
        // Template
        lines.push('<div class="ascii-container">');
        
        for (let i = 0; i < coloredLines.length; i++) {
            const spans = coloredLines[i];
            const lineContent = spans.map(({ color, text }) => {
                const className = this._colorToClassName(color);
                const escapedText = this._escapeHtml(text);
                return `<span class="${className}">${escapedText}</span>`;
            }).join('');
            
            lines.push(`${indent}<div class="ascii-line">${lineContent}</div>`);
        }
        
        lines.push('</div>');
        lines.push('');
        
        // Style
        lines.push('<style>');
        lines.push(this._generateCSS(options, colors));
        lines.push('</style>');
        
        return lines.join('\n');
    }
    
    /**
     * Generate empty component
     * @private
     */
    _generateEmptyComponent(options) {
        const lines = [];
        lines.push('<script>');
        lines.push('</script>');
        lines.push('');
        lines.push('<div class="ascii-container">');
        lines.push('  <span class="ascii-default">Empty</span>');
        lines.push('</div>');
        lines.push('');
        lines.push('<style>');
        lines.push(this._generateCSS(options, []));
        lines.push('</style>');
        return lines.join('\n');
    }
}

// ==========================================
// WEB COMPONENT EXPORTER
// ==========================================

/**
 * Web Component (Custom Element) exporter
 */
export class WebComponentExporter extends BaseWebExporter {
    constructor(config = {}) {
        super(config);
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'webcomponent'; }
    get name() { return 'Web Component'; }
    get description() { return 'Export as Web Component (Custom Element) (.js)'; }
    get fileExtension() { return '.js'; }
    get mimeType() { return 'text/javascript'; }
    get category() { return ExportCategory.WebFramework; }
    
    get defaultOptions() {
        return {
            ...super.defaultOptions,
            tagName: 'ascii-art',
            useShadowDOM: true
        };
    }
    
    // ==========================================
    // EXPORT IMPLEMENTATION
    // ==========================================
    
    _doExport(document, options) {
        const buffer = this._getBuffer(document);
        if (!buffer) {
            return this._generateEmptyComponent(options);
        }
        
        const { width, height } = this._getBufferDimensions(buffer);
        const colors = this._collectColors(buffer, width, height);
        const coloredLines = this._bufferToColoredLines(buffer, width, height, options);
        const indent = this._indent(1, options);
        const indent2 = this._indent(2, options);
        const indent3 = this._indent(3, options);
        
        const lines = [];
        
        // Header comment
        lines.push('/**');
        lines.push(' * Generated by Asciistrator - Web Component');
        lines.push(` * Dimensions: ${width}x${height} characters`);
        lines.push(' */');
        lines.push('');
        
        // Class definition
        lines.push(`class ${options.componentName} extends HTMLElement {`);
        lines.push(`${indent}constructor() {`);
        lines.push(`${indent2}super();`);
        
        if (options.useShadowDOM) {
            lines.push(`${indent2}this.attachShadow({ mode: 'open' });`);
        }
        
        lines.push(`${indent}}`);
        lines.push('');
        
        // Connected callback
        lines.push(`${indent}connectedCallback() {`);
        
        const target = options.useShadowDOM ? 'this.shadowRoot' : 'this';
        lines.push(`${indent2}${target}.innerHTML = \``);
        
        // Style
        lines.push(`${indent3}<style>`);
        lines.push(`${indent3}${this._generateCSS(options, colors).split('\n').join(`\n${indent3}`)}`);
        lines.push(`${indent3}</style>`);
        
        // Template
        lines.push(`${indent3}<div class="ascii-container">`);
        
        for (let i = 0; i < coloredLines.length; i++) {
            const spans = coloredLines[i];
            const lineContent = spans.map(({ color, text }) => {
                const className = this._colorToClassName(color);
                // Escape backticks and ${} for template literal
                const escapedText = text
                    .replace(/\\/g, '\\\\')
                    .replace(/`/g, '\\`')
                    .replace(/\$/g, '\\$')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                return `<span class="${className}">${escapedText}</span>`;
            }).join('');
            
            lines.push(`${indent3}${indent}<div class="ascii-line">${lineContent}</div>`);
        }
        
        lines.push(`${indent3}</div>`);
        lines.push(`${indent2}\`;`);
        lines.push(`${indent}}`);
        lines.push('}');
        lines.push('');
        
        // Register custom element
        lines.push(`customElements.define('${options.tagName}', ${options.componentName});`);
        lines.push('');
        lines.push(`export default ${options.componentName};`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate empty component
     * @private
     */
    _generateEmptyComponent(options) {
        const lines = [];
        lines.push(`class ${options.componentName} extends HTMLElement {`);
        lines.push('  constructor() {');
        lines.push('    super();');
        lines.push("    this.attachShadow({ mode: 'open' });");
        lines.push('  }');
        lines.push('');
        lines.push('  connectedCallback() {');
        lines.push('    this.shadowRoot.innerHTML = `');
        lines.push('      <style>' + this._generateCSS(options, []).replace(/\n/g, ' ') + '</style>');
        lines.push('      <div class="ascii-container"><span class="ascii-default">Empty</span></div>');
        lines.push('    `;');
        lines.push('  }');
        lines.push('}');
        lines.push('');
        lines.push(`customElements.define('${options.tagName}', ${options.componentName});`);
        lines.push(`export default ${options.componentName};`);
        return lines.join('\n');
    }
}

// ==========================================
// DEFAULT EXPORTS
// ==========================================

export default {
    BaseWebExporter,
    ReactExporter,
    VueExporter,
    AngularExporter,
    SvelteExporter,
    WebComponentExporter
};
