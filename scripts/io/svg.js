/**
 * Asciistrator - SVG Import/Export
 * 
 * Handles importing SVG files and converting to ASCII paths,
 * and exporting ASCII art as SVG.
 */

/**
 * SVG namespace
 */
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * SVG Importer - converts SVG paths to ASCII art
 */
export class SVGImporter {
    constructor(options = {}) {
        this.options = {
            scale: options.scale || 1,
            strokeChar: options.strokeChar || '*',
            fillChar: options.fillChar || '',
            preserveAspectRatio: options.preserveAspectRatio !== false,
            maxWidth: options.maxWidth || 120,
            maxHeight: options.maxHeight || 60
        };
    }

    /**
     * Import SVG from file
     * @param {File} file - SVG file
     * @returns {Promise<object[]>} - Array of parsed shapes
     */
    async importFile(file) {
        const text = await file.text();
        return this.importString(text);
    }

    /**
     * Import SVG from string
     * @param {string} svgString - SVG markup
     * @returns {object[]} - Array of parsed shapes
     */
    importString(svgString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        
        if (!svg) {
            throw new Error('Invalid SVG: No svg element found');
        }

        // Get viewBox dimensions
        const viewBox = svg.getAttribute('viewBox');
        let svgWidth = parseFloat(svg.getAttribute('width')) || 100;
        let svgHeight = parseFloat(svg.getAttribute('height')) || 100;
        
        if (viewBox) {
            const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(parseFloat);
            svgWidth = vbWidth || svgWidth;
            svgHeight = vbHeight || svgHeight;
        }

        // Calculate scale to fit within max dimensions
        const scaleX = this.options.maxWidth / svgWidth;
        const scaleY = this.options.maxHeight / svgHeight;
        const scale = Math.min(scaleX, scaleY) * this.options.scale;

        // Parse all shape elements
        const shapes = [];
        this._parseElement(svg, shapes, scale, { x: 0, y: 0 });

        return shapes;
    }

    /**
     * Parse SVG element recursively
     * @private
     */
    _parseElement(element, shapes, scale, offset) {
        // Handle groups
        if (element.tagName === 'g') {
            // Apply group transforms
            const transform = this._parseTransform(element.getAttribute('transform'));
            const newOffset = {
                x: offset.x + (transform.translateX || 0) * scale,
                y: offset.y + (transform.translateY || 0) * scale
            };
            
            for (const child of element.children) {
                this._parseElement(child, shapes, scale, newOffset);
            }
            return;
        }

        // Parse individual shapes
        let shape = null;

        switch (element.tagName) {
            case 'rect':
                shape = this._parseRect(element, scale, offset);
                break;
            case 'circle':
                shape = this._parseCircle(element, scale, offset);
                break;
            case 'ellipse':
                shape = this._parseEllipse(element, scale, offset);
                break;
            case 'line':
                shape = this._parseLine(element, scale, offset);
                break;
            case 'polyline':
                shape = this._parsePolyline(element, scale, offset);
                break;
            case 'polygon':
                shape = this._parsePolygon(element, scale, offset);
                break;
            case 'path':
                shape = this._parsePath(element, scale, offset);
                break;
            case 'text':
                shape = this._parseText(element, scale, offset);
                break;
        }

        if (shape) {
            // Apply stroke/fill from element
            const stroke = element.getAttribute('stroke');
            const fill = element.getAttribute('fill');
            
            if (stroke && stroke !== 'none') {
                shape.strokeColor = stroke;
            }
            if (fill && fill !== 'none') {
                shape.fillColor = fill;
            }
            
            shapes.push(shape);
        }

        // Process children
        for (const child of element.children) {
            this._parseElement(child, shapes, scale, offset);
        }
    }

    /**
     * Parse rectangle element
     * @private
     */
    _parseRect(element, scale, offset) {
        const x = (parseFloat(element.getAttribute('x')) || 0) * scale + offset.x;
        const y = (parseFloat(element.getAttribute('y')) || 0) * scale + offset.y;
        const width = (parseFloat(element.getAttribute('width')) || 0) * scale;
        const height = (parseFloat(element.getAttribute('height')) || 0) * scale;
        const rx = parseFloat(element.getAttribute('rx')) || 0;

        return {
            type: rx > 0 ? 'rounded-rectangle' : 'rectangle',
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height),
            cornerRadius: Math.round(rx * scale),
            strokeChar: this.options.strokeChar,
            fillChar: this.options.fillChar
        };
    }

    /**
     * Parse circle element
     * @private
     */
    _parseCircle(element, scale, offset) {
        const cx = (parseFloat(element.getAttribute('cx')) || 0) * scale + offset.x;
        const cy = (parseFloat(element.getAttribute('cy')) || 0) * scale + offset.y;
        const r = (parseFloat(element.getAttribute('r')) || 0) * scale;

        return {
            type: 'ellipse',
            x: Math.round(cx - r),
            y: Math.round(cy - r),
            width: Math.round(r * 2),
            height: Math.round(r * 2),
            radiusX: Math.round(r),
            radiusY: Math.round(r),
            strokeChar: this.options.strokeChar,
            fillChar: this.options.fillChar
        };
    }

    /**
     * Parse ellipse element
     * @private
     */
    _parseEllipse(element, scale, offset) {
        const cx = (parseFloat(element.getAttribute('cx')) || 0) * scale + offset.x;
        const cy = (parseFloat(element.getAttribute('cy')) || 0) * scale + offset.y;
        const rx = (parseFloat(element.getAttribute('rx')) || 0) * scale;
        const ry = (parseFloat(element.getAttribute('ry')) || 0) * scale;

        return {
            type: 'ellipse',
            x: Math.round(cx - rx),
            y: Math.round(cy - ry),
            width: Math.round(rx * 2),
            height: Math.round(ry * 2),
            radiusX: Math.round(rx),
            radiusY: Math.round(ry),
            strokeChar: this.options.strokeChar,
            fillChar: this.options.fillChar
        };
    }

    /**
     * Parse line element
     * @private
     */
    _parseLine(element, scale, offset) {
        const x1 = (parseFloat(element.getAttribute('x1')) || 0) * scale + offset.x;
        const y1 = (parseFloat(element.getAttribute('y1')) || 0) * scale + offset.y;
        const x2 = (parseFloat(element.getAttribute('x2')) || 0) * scale + offset.x;
        const y2 = (parseFloat(element.getAttribute('y2')) || 0) * scale + offset.y;

        return {
            type: 'line',
            x1: Math.round(x1),
            y1: Math.round(y1),
            x2: Math.round(x2),
            y2: Math.round(y2),
            x: Math.round(Math.min(x1, x2)),
            y: Math.round(Math.min(y1, y2)),
            width: Math.round(Math.abs(x2 - x1)) + 1,
            height: Math.round(Math.abs(y2 - y1)) + 1,
            strokeChar: this.options.strokeChar
        };
    }

    /**
     * Parse polyline element
     * @private
     */
    _parsePolyline(element, scale, offset) {
        const points = this._parsePoints(element.getAttribute('points'), scale, offset);
        
        if (points.length < 2) return null;

        return {
            type: 'polyline',
            points: points,
            x: Math.round(Math.min(...points.map(p => p.x))),
            y: Math.round(Math.min(...points.map(p => p.y))),
            width: Math.round(Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x))) + 1,
            height: Math.round(Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))) + 1,
            strokeChar: this.options.strokeChar
        };
    }

    /**
     * Parse polygon element
     * @private
     */
    _parsePolygon(element, scale, offset) {
        const points = this._parsePoints(element.getAttribute('points'), scale, offset);
        
        if (points.length < 3) return null;

        return {
            type: 'polygon',
            points: points,
            x: Math.round(Math.min(...points.map(p => p.x))),
            y: Math.round(Math.min(...points.map(p => p.y))),
            width: Math.round(Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x))) + 1,
            height: Math.round(Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))) + 1,
            strokeChar: this.options.strokeChar,
            fillChar: this.options.fillChar
        };
    }

    /**
     * Parse path element (simplified - handles basic commands)
     * @private
     */
    _parsePath(element, scale, offset) {
        const d = element.getAttribute('d');
        if (!d) return null;

        const commands = this._parsePathData(d);
        const points = this._pathToPoints(commands, scale, offset);

        if (points.length < 2) return null;

        return {
            type: 'path',
            commands: commands,
            points: points,
            x: Math.round(Math.min(...points.map(p => p.x))),
            y: Math.round(Math.min(...points.map(p => p.y))),
            width: Math.round(Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x))) + 1,
            height: Math.round(Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))) + 1,
            strokeChar: this.options.strokeChar,
            fillChar: this.options.fillChar
        };
    }

    /**
     * Parse text element
     * @private
     */
    _parseText(element, scale, offset) {
        const x = (parseFloat(element.getAttribute('x')) || 0) * scale + offset.x;
        const y = (parseFloat(element.getAttribute('y')) || 0) * scale + offset.y;
        const text = element.textContent || '';

        return {
            type: 'text',
            x: Math.round(x),
            y: Math.round(y),
            text: text,
            width: text.length,
            height: 1
        };
    }

    /**
     * Parse points attribute
     * @private
     */
    _parsePoints(pointsStr, scale, offset) {
        if (!pointsStr) return [];
        
        const points = [];
        const pairs = pointsStr.trim().split(/[\s,]+/);
        
        for (let i = 0; i < pairs.length - 1; i += 2) {
            const x = parseFloat(pairs[i]) * scale + offset.x;
            const y = parseFloat(pairs[i + 1]) * scale + offset.y;
            points.push({ x: Math.round(x), y: Math.round(y) });
        }
        
        return points;
    }

    /**
     * Parse SVG path data
     * @private
     */
    _parsePathData(d) {
        const commands = [];
        const regex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
        let match;

        while ((match = regex.exec(d)) !== null) {
            const command = match[1];
            const params = match[2].trim().split(/[\s,]+/).filter(Boolean).map(parseFloat);
            commands.push({ command, params });
        }

        return commands;
    }

    /**
     * Convert path commands to points (simplified)
     * @private
     */
    _pathToPoints(commands, scale, offset) {
        const points = [];
        let currentX = 0;
        let currentY = 0;
        let startX = 0;
        let startY = 0;

        for (const { command, params } of commands) {
            switch (command) {
                case 'M':
                    currentX = params[0];
                    currentY = params[1];
                    startX = currentX;
                    startY = currentY;
                    points.push({
                        x: Math.round(currentX * scale + offset.x),
                        y: Math.round(currentY * scale + offset.y)
                    });
                    break;
                case 'm':
                    currentX += params[0];
                    currentY += params[1];
                    startX = currentX;
                    startY = currentY;
                    points.push({
                        x: Math.round(currentX * scale + offset.x),
                        y: Math.round(currentY * scale + offset.y)
                    });
                    break;
                case 'L':
                    for (let i = 0; i < params.length; i += 2) {
                        currentX = params[i];
                        currentY = params[i + 1];
                        points.push({
                            x: Math.round(currentX * scale + offset.x),
                            y: Math.round(currentY * scale + offset.y)
                        });
                    }
                    break;
                case 'l':
                    for (let i = 0; i < params.length; i += 2) {
                        currentX += params[i];
                        currentY += params[i + 1];
                        points.push({
                            x: Math.round(currentX * scale + offset.x),
                            y: Math.round(currentY * scale + offset.y)
                        });
                    }
                    break;
                case 'H':
                    currentX = params[0];
                    points.push({
                        x: Math.round(currentX * scale + offset.x),
                        y: Math.round(currentY * scale + offset.y)
                    });
                    break;
                case 'h':
                    currentX += params[0];
                    points.push({
                        x: Math.round(currentX * scale + offset.x),
                        y: Math.round(currentY * scale + offset.y)
                    });
                    break;
                case 'V':
                    currentY = params[0];
                    points.push({
                        x: Math.round(currentX * scale + offset.x),
                        y: Math.round(currentY * scale + offset.y)
                    });
                    break;
                case 'v':
                    currentY += params[0];
                    points.push({
                        x: Math.round(currentX * scale + offset.x),
                        y: Math.round(currentY * scale + offset.y)
                    });
                    break;
                case 'Z':
                case 'z':
                    currentX = startX;
                    currentY = startY;
                    break;
                // C, S, Q, T, A - bezier curves would need sampling
                case 'C':
                case 'c':
                case 'S':
                case 's':
                case 'Q':
                case 'q':
                case 'T':
                case 't':
                    // Simplified: just take the end point
                    const endIdx = params.length - 2;
                    if (command === command.toLowerCase()) {
                        currentX += params[endIdx];
                        currentY += params[endIdx + 1];
                    } else {
                        currentX = params[endIdx];
                        currentY = params[endIdx + 1];
                    }
                    points.push({
                        x: Math.round(currentX * scale + offset.x),
                        y: Math.round(currentY * scale + offset.y)
                    });
                    break;
            }
        }

        return points;
    }

    /**
     * Parse transform attribute
     * @private
     */
    _parseTransform(transform) {
        const result = { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotate: 0 };
        if (!transform) return result;

        const translateMatch = transform.match(/translate\(([^)]+)\)/);
        if (translateMatch) {
            const [tx, ty] = translateMatch[1].split(/[\s,]+/).map(parseFloat);
            result.translateX = tx || 0;
            result.translateY = ty || 0;
        }

        const scaleMatch = transform.match(/scale\(([^)]+)\)/);
        if (scaleMatch) {
            const [sx, sy] = scaleMatch[1].split(/[\s,]+/).map(parseFloat);
            result.scaleX = sx || 1;
            result.scaleY = sy || sx || 1;
        }

        const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
        if (rotateMatch) {
            result.rotate = parseFloat(rotateMatch[1]) || 0;
        }

        return result;
    }
}

/**
 * SVG Exporter - converts ASCII art to SVG
 */
export class SVGExporter {
    constructor(options = {}) {
        this.options = {
            cellWidth: options.cellWidth || 10,
            cellHeight: options.cellHeight || 18,
            fontFamily: options.fontFamily || 'monospace',
            fontSize: options.fontSize || 14,
            backgroundColor: options.backgroundColor || '#1a1a2e',
            textColor: options.textColor || '#e0e0e0',
            includeBackground: options.includeBackground !== false
        };
    }

    /**
     * Export ASCII buffer to SVG string
     * @param {object} buffer - ASCII buffer with getChar/getColor methods
     * @returns {string}
     */
    exportBuffer(buffer) {
        const width = buffer.width * this.options.cellWidth;
        const height = buffer.height * this.options.cellHeight;

        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    text { font-family: ${this.options.fontFamily}; font-size: ${this.options.fontSize}px; }
  </style>`;

        if (this.options.includeBackground) {
            svg += `\n  <rect width="100%" height="100%" fill="${this.options.backgroundColor}"/>`;
        }

        // Group text by color for efficiency
        const colorGroups = new Map();

        for (let y = 0; y < buffer.height; y++) {
            for (let x = 0; x < buffer.width; x++) {
                const char = buffer.getChar(x, y);
                if (char === ' ') continue;

                const color = buffer.getColor(x, y) || this.options.textColor;
                
                if (!colorGroups.has(color)) {
                    colorGroups.set(color, []);
                }
                
                colorGroups.get(color).push({
                    x: x * this.options.cellWidth + this.options.cellWidth / 2,
                    y: y * this.options.cellHeight + this.options.cellHeight * 0.8,
                    char: this._escapeXml(char)
                });
            }
        }

        // Output grouped by color
        for (const [color, chars] of colorGroups) {
            svg += `\n  <g fill="${color}">`;
            for (const { x, y, char } of chars) {
                svg += `\n    <text x="${x}" y="${y}" text-anchor="middle">${char}</text>`;
            }
            svg += '\n  </g>';
        }

        svg += '\n</svg>';
        return svg;
    }

    /**
     * Export scene objects to SVG
     * @param {object[]} objects - Array of scene objects
     * @param {number} width - Canvas width in chars
     * @param {number} height - Canvas height in chars
     * @returns {string}
     */
    exportObjects(objects, width, height) {
        const svgWidth = width * this.options.cellWidth;
        const svgHeight = height * this.options.cellHeight;

        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NS}" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <style>
    .ascii-shape { stroke-width: 1; fill: none; }
    text { font-family: ${this.options.fontFamily}; font-size: ${this.options.fontSize}px; }
  </style>`;

        if (this.options.includeBackground) {
            svg += `\n  <rect width="100%" height="100%" fill="${this.options.backgroundColor}"/>`;
        }

        for (const obj of objects) {
            if (!obj.visible) continue;
            svg += this._objectToSVG(obj);
        }

        svg += '\n</svg>';
        return svg;
    }

    /**
     * Convert a scene object to SVG element
     * @private
     */
    _objectToSVG(obj) {
        const x = obj.x * this.options.cellWidth;
        const y = obj.y * this.options.cellHeight;
        const w = obj.width * this.options.cellWidth;
        const h = obj.height * this.options.cellHeight;
        const stroke = obj.strokeColor || this.options.textColor;
        const fill = obj.fillColor || 'none';

        switch (obj.type) {
            case 'rectangle':
                return `\n  <rect x="${x}" y="${y}" width="${w}" height="${h}" class="ascii-shape" stroke="${stroke}" fill="${fill}"/>`;
            
            case 'ellipse':
                const cx = x + w / 2;
                const cy = y + h / 2;
                const rx = w / 2;
                const ry = h / 2;
                return `\n  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="ascii-shape" stroke="${stroke}" fill="${fill}"/>`;
            
            case 'line':
                const x1 = obj.x1 * this.options.cellWidth;
                const y1 = obj.y1 * this.options.cellHeight;
                const x2 = obj.x2 * this.options.cellWidth;
                const y2 = obj.y2 * this.options.cellHeight;
                return `\n  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="ascii-shape" stroke="${stroke}"/>`;
            
            case 'text':
                const textY = y + this.options.cellHeight * 0.8;
                return `\n  <text x="${x}" y="${textY}" fill="${stroke}">${this._escapeXml(obj.text || '')}</text>`;
            
            case 'polygon':
                if (obj.points && obj.points.length > 0) {
                    const points = obj.points.map(p => 
                        `${p.x * this.options.cellWidth},${p.y * this.options.cellHeight}`
                    ).join(' ');
                    return `\n  <polygon points="${points}" class="ascii-shape" stroke="${stroke}" fill="${fill}"/>`;
                }
                return '';
            
            case 'path':
                if (obj.points && obj.points.length > 0) {
                    let d = `M ${obj.points[0].x * this.options.cellWidth} ${obj.points[0].y * this.options.cellHeight}`;
                    for (let i = 1; i < obj.points.length; i++) {
                        d += ` L ${obj.points[i].x * this.options.cellWidth} ${obj.points[i].y * this.options.cellHeight}`;
                    }
                    return `\n  <path d="${d}" class="ascii-shape" stroke="${stroke}" fill="${fill}"/>`;
                }
                return '';
            
            default:
                // For unknown types, just draw a rectangle
                return `\n  <rect x="${x}" y="${y}" width="${w}" height="${h}" class="ascii-shape" stroke="${stroke}" fill="${fill}" opacity="0.5"/>`;
        }
    }

    /**
     * Escape XML special characters
     * @private
     */
    _escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

/**
 * Download SVG file
 * @param {string} svgContent - SVG markup
 * @param {string} filename - Filename
 */
export function downloadSVG(svgContent, filename = 'export.svg') {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
}

export default {
    SVGImporter,
    SVGExporter,
    downloadSVG
};
