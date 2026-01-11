/**
 * Asciistrator - Export Module
 * 
 * Export ASCII art to various formats:
 * - Plain Text (.txt)
 * - HTML (with styling)
 * - ANSI colored text (.ans)
 * - PNG image
 * - PDF document
 * - Markdown code block
 */

/**
 * Text exporter - exports plain ASCII text
 */
export class TextExporter {
    /**
     * Export buffer to plain text
     * @param {object} buffer - ASCII buffer
     * @returns {string}
     */
    static export(buffer) {
        const lines = [];
        
        for (let y = 0; y < buffer.height; y++) {
            let line = '';
            for (let x = 0; x < buffer.width; x++) {
                line += buffer.getChar(x, y);
            }
            // Trim trailing spaces but keep line structure
            lines.push(line.trimEnd());
        }
        
        // Remove trailing empty lines
        while (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop();
        }
        
        return lines.join('\n');
    }

    /**
     * Download as text file
     * @param {object} buffer - ASCII buffer
     * @param {string} filename - Filename
     */
    static download(buffer, filename = 'export.txt') {
        const text = TextExporter.export(buffer);
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

/**
 * HTML exporter - exports styled HTML
 */
export class HTMLExporter {
    constructor(options = {}) {
        this.options = {
            fontFamily: options.fontFamily || "'Courier New', Consolas, monospace",
            fontSize: options.fontSize || '14px',
            lineHeight: options.lineHeight || '1.2',
            backgroundColor: options.backgroundColor || '#1a1a2e',
            defaultColor: options.defaultColor || '#e0e0e0',
            title: options.title || 'ASCII Art',
            includeStyles: options.includeStyles !== false,
            wrapInDocument: options.wrapInDocument !== false
        };
    }

    /**
     * Export buffer to HTML
     * @param {object} buffer - ASCII buffer
     * @returns {string}
     */
    export(buffer) {
        let html = '';

        // Build HTML with color spans
        for (let y = 0; y < buffer.height; y++) {
            let currentColor = null;
            let currentSpan = '';

            for (let x = 0; x < buffer.width; x++) {
                const char = buffer.getChar(x, y);
                const color = buffer.getColor(x, y);

                if (color !== currentColor) {
                    // Close previous span
                    if (currentSpan) {
                        html += currentColor 
                            ? `<span style="color:${currentColor}">${this._escapeHtml(currentSpan)}</span>`
                            : this._escapeHtml(currentSpan);
                    }
                    currentColor = color;
                    currentSpan = char;
                } else {
                    currentSpan += char;
                }
            }

            // Close last span of line
            if (currentSpan) {
                html += currentColor 
                    ? `<span style="color:${currentColor}">${this._escapeHtml(currentSpan)}</span>`
                    : this._escapeHtml(currentSpan);
            }
            html += '\n';
        }

        // Wrap in document if needed
        if (this.options.wrapInDocument) {
            html = this._wrapInDocument(html);
        }

        return html;
    }

    /**
     * Wrap content in full HTML document
     * @private
     */
    _wrapInDocument(content) {
        const styles = this.options.includeStyles ? `
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: ${this.options.backgroundColor};
        }
        pre {
            font-family: ${this.options.fontFamily};
            font-size: ${this.options.fontSize};
            line-height: ${this.options.lineHeight};
            color: ${this.options.defaultColor};
            margin: 0;
            white-space: pre;
            overflow-x: auto;
        }
    </style>` : '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this._escapeHtml(this.options.title)}</title>${styles}
</head>
<body>
<pre>${content}</pre>
</body>
</html>`;
    }

    /**
     * Escape HTML special characters
     * @private
     */
    _escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Download as HTML file
     * @param {object} buffer - ASCII buffer
     * @param {string} filename - Filename
     */
    download(buffer, filename = 'export.html') {
        const html = this.export(buffer);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

/**
 * ANSI exporter - exports colored ANSI text
 */
export class ANSIExporter {
    /**
     * ANSI color codes (basic 16 colors)
     */
    static COLORS = {
        reset: '\x1b[0m',
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        brightBlack: '\x1b[90m',
        brightRed: '\x1b[91m',
        brightGreen: '\x1b[92m',
        brightYellow: '\x1b[93m',
        brightBlue: '\x1b[94m',
        brightMagenta: '\x1b[95m',
        brightCyan: '\x1b[96m',
        brightWhite: '\x1b[97m'
    };

    /**
     * Export buffer to ANSI colored text
     * @param {object} buffer - ASCII buffer
     * @returns {string}
     */
    static export(buffer) {
        let output = '';

        for (let y = 0; y < buffer.height; y++) {
            let currentColor = null;

            for (let x = 0; x < buffer.width; x++) {
                const char = buffer.getChar(x, y);
                const color = buffer.getColor(x, y);

                if (color !== currentColor) {
                    if (color) {
                        output += ANSIExporter._hexToAnsi(color);
                    } else {
                        output += ANSIExporter.COLORS.reset;
                    }
                    currentColor = color;
                }

                output += char;
            }

            output += ANSIExporter.COLORS.reset + '\n';
        }

        return output;
    }

    /**
     * Convert hex color to closest ANSI color code
     * @private
     */
    static _hexToAnsi(hex) {
        // Parse hex color
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        // Use 256-color ANSI if supported
        const ansiCode = ANSIExporter._rgbToAnsi256(r, g, b);
        return `\x1b[38;5;${ansiCode}m`;
    }

    /**
     * Convert RGB to ANSI 256 color code
     * @private
     */
    static _rgbToAnsi256(r, g, b) {
        // Check for grayscale
        if (r === g && g === b) {
            if (r < 8) return 16;
            if (r > 248) return 231;
            return Math.round((r - 8) / 247 * 24) + 232;
        }

        // Convert to 6x6x6 color cube
        const ri = Math.round(r / 255 * 5);
        const gi = Math.round(g / 255 * 5);
        const bi = Math.round(b / 255 * 5);

        return 16 + 36 * ri + 6 * gi + bi;
    }

    /**
     * Download as ANSI text file
     * @param {object} buffer - ASCII buffer
     * @param {string} filename - Filename
     */
    static download(buffer, filename = 'export.ans') {
        const ansi = ANSIExporter.export(buffer);
        const blob = new Blob([ansi], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

/**
 * PNG exporter - renders ASCII art to PNG image
 */
export class PNGExporter {
    constructor(options = {}) {
        this.options = {
            cellWidth: options.cellWidth || 10,
            cellHeight: options.cellHeight || 18,
            fontFamily: options.fontFamily || 'Consolas, monospace',
            fontSize: options.fontSize || 14,
            backgroundColor: options.backgroundColor || '#1a1a2e',
            defaultColor: options.defaultColor || '#e0e0e0',
            scale: options.scale || 1,
            padding: options.padding || 20
        };
    }

    /**
     * Export buffer to PNG data URL
     * @param {object} buffer - ASCII buffer
     * @returns {string} - Data URL
     */
    export(buffer) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const width = buffer.width * this.options.cellWidth * this.options.scale + this.options.padding * 2;
        const height = buffer.height * this.options.cellHeight * this.options.scale + this.options.padding * 2;

        canvas.width = width;
        canvas.height = height;

        // Background
        ctx.fillStyle = this.options.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Setup font
        ctx.font = `${this.options.fontSize * this.options.scale}px ${this.options.fontFamily}`;
        ctx.textBaseline = 'top';

        // Render each character
        for (let y = 0; y < buffer.height; y++) {
            for (let x = 0; x < buffer.width; x++) {
                const char = buffer.getChar(x, y);
                if (char === ' ') continue;

                const color = buffer.getColor(x, y) || this.options.defaultColor;
                ctx.fillStyle = color;

                const px = this.options.padding + x * this.options.cellWidth * this.options.scale;
                const py = this.options.padding + y * this.options.cellHeight * this.options.scale;

                ctx.fillText(char, px, py);
            }
        }

        return canvas.toDataURL('image/png');
    }

    /**
     * Download as PNG file
     * @param {object} buffer - ASCII buffer
     * @param {string} filename - Filename
     */
    download(buffer, filename = 'export.png') {
        const dataUrl = this.export(buffer);
        
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
    }

    /**
     * Export to Blob
     * @param {object} buffer - ASCII buffer
     * @returns {Promise<Blob>}
     */
    exportBlob(buffer) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const width = buffer.width * this.options.cellWidth * this.options.scale + this.options.padding * 2;
            const height = buffer.height * this.options.cellHeight * this.options.scale + this.options.padding * 2;

            canvas.width = width;
            canvas.height = height;

            ctx.fillStyle = this.options.backgroundColor;
            ctx.fillRect(0, 0, width, height);

            ctx.font = `${this.options.fontSize * this.options.scale}px ${this.options.fontFamily}`;
            ctx.textBaseline = 'top';

            for (let y = 0; y < buffer.height; y++) {
                for (let x = 0; x < buffer.width; x++) {
                    const char = buffer.getChar(x, y);
                    if (char === ' ') continue;

                    const color = buffer.getColor(x, y) || this.options.defaultColor;
                    ctx.fillStyle = color;

                    const px = this.options.padding + x * this.options.cellWidth * this.options.scale;
                    const py = this.options.padding + y * this.options.cellHeight * this.options.scale;

                    ctx.fillText(char, px, py);
                }
            }

            canvas.toBlob(resolve, 'image/png');
        });
    }
}

/**
 * Markdown exporter - exports as markdown code block
 */
export class MarkdownExporter {
    constructor(options = {}) {
        this.options = {
            language: options.language || '',
            includeTitle: options.includeTitle || false,
            title: options.title || 'ASCII Art'
        };
    }

    /**
     * Export buffer to markdown
     * @param {object} buffer - ASCII buffer
     * @returns {string}
     */
    export(buffer) {
        const text = TextExporter.export(buffer);
        
        let md = '';
        
        if (this.options.includeTitle) {
            md += `## ${this.options.title}\n\n`;
        }
        
        md += '```' + this.options.language + '\n';
        md += text + '\n';
        md += '```';
        
        return md;
    }

    /**
     * Download as markdown file
     * @param {object} buffer - ASCII buffer
     * @param {string} filename - Filename
     */
    download(buffer, filename = 'export.md') {
        const md = this.export(buffer);
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

/**
 * PDF Exporter - exports ASCII art to PDF
 * Note: This uses a simple approach without external libraries
 */
export class PDFExporter {
    constructor(options = {}) {
        this.options = {
            fontFamily: options.fontFamily || 'Courier',
            fontSize: options.fontSize || 10,
            backgroundColor: options.backgroundColor || '#ffffff',
            textColor: options.textColor || '#000000',
            margin: options.margin || 50,
            title: options.title || 'ASCII Art Export'
        };
    }

    /**
     * Export buffer to PDF (opens print dialog)
     * @param {object} buffer - ASCII buffer
     */
    export(buffer) {
        const text = TextExporter.export(buffer);
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>${this._escapeHtml(this.options.title)}</title>
    <style>
        @media print {
            body {
                margin: 0;
                padding: ${this.options.margin}px;
            }
        }
        body {
            font-family: ${this.options.fontFamily}, monospace;
            font-size: ${this.options.fontSize}pt;
            background-color: ${this.options.backgroundColor};
            color: ${this.options.textColor};
        }
        pre {
            white-space: pre;
            margin: 0;
            line-height: 1.2;
        }
    </style>
</head>
<body>
<pre>${this._escapeHtml(text)}</pre>
<script>
    window.onload = function() {
        window.print();
        window.onafterprint = function() {
            window.close();
        };
    };
</script>
</body>
</html>`);
        
        printWindow.document.close();
    }

    /**
     * Escape HTML special characters
     * @private
     */
    _escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}

/**
 * Universal export function
 * @param {object} buffer - ASCII buffer
 * @param {string} format - Export format ('txt', 'html', 'ansi', 'png', 'md', 'pdf')
 * @param {object} options - Format-specific options
 * @param {string} filename - Filename (optional)
 */
export function exportAs(buffer, format, options = {}, filename = null) {
    const defaultFilename = `export.${format}`;
    const targetFilename = filename || defaultFilename;

    switch (format.toLowerCase()) {
        case 'txt':
        case 'text':
            TextExporter.download(buffer, targetFilename);
            break;
            
        case 'html':
            new HTMLExporter(options).download(buffer, targetFilename);
            break;
            
        case 'ansi':
        case 'ans':
            ANSIExporter.download(buffer, targetFilename);
            break;
            
        case 'png':
        case 'image':
            new PNGExporter(options).download(buffer, targetFilename);
            break;
            
        case 'md':
        case 'markdown':
            new MarkdownExporter(options).download(buffer, targetFilename);
            break;
            
        case 'pdf':
            new PDFExporter(options).export(buffer);
            break;
            
        default:
            console.error(`Unknown export format: ${format}`);
    }
}

export default {
    TextExporter,
    HTMLExporter,
    ANSIExporter,
    PNGExporter,
    MarkdownExporter,
    PDFExporter,
    exportAs
};
