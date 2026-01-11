/**
 * Asciistrator - Chart Base Classes
 * 
 * Foundation classes for the ASCII charting engine.
 */

import { EventEmitter } from '../utils/events.js';
import { BoundingBox } from '../core/math/geometry.js';
import { AsciiBuffer } from '../core/ascii/rasterizer.js';

// ==========================================
// CHART CONSTANTS
// ==========================================

/**
 * Default chart characters
 */
export const ChartChars = {
    // Bars
    barFull: '█',
    barDark: '▓',
    barMedium: '▒',
    barLight: '░',
    barEmpty: ' ',
    
    // Horizontal bars
    hBar: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'],
    
    // Vertical bars
    vBar: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
    
    // Lines
    lineHorizontal: '─',
    lineVertical: '│',
    lineDiagonalUp: '╱',
    lineDiagonalDown: '╲',
    lineCross: '┼',
    
    // Points/markers
    pointFilled: '●',
    pointEmpty: '○',
    pointSquare: '■',
    pointDiamond: '◆',
    pointTriangle: '▲',
    pointStar: '★',
    pointPlus: '+',
    pointCross: '×',
    
    // Axes
    axisHorizontal: '─',
    axisVertical: '│',
    axisOrigin: '└',
    axisTick: '┬',
    axisTickVert: '├',
    
    // Grid
    gridDot: '·',
    gridPlus: '+',
    gridCross: '┼',
    
    // Pie/donut
    pieSlice: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
    pieChars: ['◔', '◑', '◕', '●'],
    
    // Arrows
    arrowUp: '▲',
    arrowDown: '▼',
    arrowLeft: '◀',
    arrowRight: '▶'
};

/**
 * Chart color palettes (using different fill characters)
 */
export const ChartPalettes = {
    default: ['█', '▓', '▒', '░', '▪', '▫', '●', '○'],
    blocks: ['█', '▇', '▆', '▅', '▄', '▃', '▂', '▁'],
    dots: ['●', '◐', '◑', '○', '◔', '◕', '◖', '◗'],
    geometric: ['■', '▲', '●', '◆', '★', '▼', '◀', '▶'],
    shades: ['█', '▓', '▒', '░'],
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8']
};

// ==========================================
// DATA SERIES
// ==========================================

/**
 * Represents a data point in a chart
 */
export class DataPoint {
    /**
     * @param {number|string} x - X value or label
     * @param {number} y - Y value
     * @param {object} options - Additional options
     */
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.label = options.label ?? null;
        this.color = options.color ?? null;
        this.char = options.char ?? null;
        this.metadata = options.metadata ?? {};
    }
    
    /**
     * Clone this data point
     * @returns {DataPoint}
     */
    clone() {
        return new DataPoint(this.x, this.y, {
            label: this.label,
            color: this.color,
            char: this.char,
            metadata: { ...this.metadata }
        });
    }
}

/**
 * Represents a series of data points
 */
export class DataSeries extends EventEmitter {
    /**
     * @param {string} name - Series name
     * @param {Array} data - Array of data points or [x, y] pairs
     * @param {object} options - Series options
     */
    constructor(name, data = [], options = {}) {
        super();
        
        this.name = name;
        this.data = [];
        this.visible = options.visible ?? true;
        
        // Style options
        this.style = {
            char: options.char ?? '█',
            markerChar: options.markerChar ?? '●',
            lineChar: options.lineChar ?? '─',
            fillChar: options.fillChar ?? null,
            showMarkers: options.showMarkers ?? true,
            showLine: options.showLine ?? true,
            showArea: options.showArea ?? false,
            smooth: options.smooth ?? false,
            ...options.style
        };
        
        // Add initial data
        if (data.length > 0) {
            this.setData(data);
        }
    }
    
    /**
     * Set all data points
     * @param {Array} data - Array of data points or [x, y] pairs
     */
    setData(data) {
        this.data = data.map((d, i) => {
            if (d instanceof DataPoint) {
                return d;
            }
            if (Array.isArray(d)) {
                return new DataPoint(d[0], d[1], d[2] || {});
            }
            if (typeof d === 'number') {
                return new DataPoint(i, d);
            }
            return new DataPoint(d.x ?? i, d.y ?? d.value, d);
        });
        
        this.emit('dataChange', { series: this });
    }
    
    /**
     * Add a data point
     * @param {DataPoint|Array|object} point - Data point
     */
    addPoint(point) {
        if (point instanceof DataPoint) {
            this.data.push(point);
        } else if (Array.isArray(point)) {
            this.data.push(new DataPoint(point[0], point[1], point[2] || {}));
        } else {
            this.data.push(new DataPoint(point.x, point.y, point));
        }
        
        this.emit('dataChange', { series: this });
    }
    
    /**
     * Remove a data point by index
     * @param {number} index - Point index
     */
    removePoint(index) {
        if (index >= 0 && index < this.data.length) {
            this.data.splice(index, 1);
            this.emit('dataChange', { series: this });
        }
    }
    
    /**
     * Update a data point
     * @param {number} index - Point index
     * @param {DataPoint|object} point - New point data
     */
    updatePoint(index, point) {
        if (index >= 0 && index < this.data.length) {
            if (point instanceof DataPoint) {
                this.data[index] = point;
            } else {
                const existing = this.data[index];
                if (point.x !== undefined) existing.x = point.x;
                if (point.y !== undefined) existing.y = point.y;
                if (point.label !== undefined) existing.label = point.label;
                if (point.char !== undefined) existing.char = point.char;
            }
            this.emit('dataChange', { series: this });
        }
    }
    
    /**
     * Get min/max values
     * @returns {object} { minX, maxX, minY, maxY }
     */
    getBounds() {
        if (this.data.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        }
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const point of this.data) {
            const x = typeof point.x === 'number' ? point.x : 0;
            const y = point.y;
            
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
        
        return { minX, maxX, minY, maxY };
    }
    
    /**
     * Get sum of all Y values
     * @returns {number}
     */
    getSum() {
        return this.data.reduce((sum, p) => sum + p.y, 0);
    }
    
    /**
     * Get average Y value
     * @returns {number}
     */
    getAverage() {
        return this.data.length > 0 ? this.getSum() / this.data.length : 0;
    }
    
    /**
     * Toggle visibility
     */
    toggleVisibility() {
        this.visible = !this.visible;
        this.emit('visibilityChange', { series: this, visible: this.visible });
    }
}

// ==========================================
// CHART BASE CLASS
// ==========================================

/**
 * Base class for all charts
 */
export class Chart extends EventEmitter {
    /**
     * @param {object} options - Chart configuration
     */
    constructor(options = {}) {
        super();
        
        // Dimensions
        this.width = options.width ?? 60;
        this.height = options.height ?? 20;
        
        // Position
        this.x = options.x ?? 0;
        this.y = options.y ?? 0;
        
        // Data
        this.series = [];
        this.labels = options.labels ?? [];
        
        // Title
        this.title = {
            text: options.title?.text ?? '',
            position: options.title?.position ?? 'top',
            char: options.title?.char ?? null
        };
        
        // Padding
        this.padding = {
            top: options.padding?.top ?? 2,
            right: options.padding?.right ?? 2,
            bottom: options.padding?.bottom ?? 3,
            left: options.padding?.left ?? 6,
            ...options.padding
        };
        
        // Axes (can be overridden by subclasses)
        this.showAxes = options.showAxes ?? true;
        this.axisX = null;
        this.axisY = null;
        
        // Legend
        this.legend = {
            show: options.legend?.show ?? true,
            position: options.legend?.position ?? 'right',
            ...options.legend
        };
        
        // Grid
        this.grid = {
            show: options.grid?.show ?? true,
            char: options.grid?.char ?? '·',
            xLines: options.grid?.xLines ?? 5,
            yLines: options.grid?.yLines ?? 5,
            ...options.grid
        };
        
        // Tooltip
        this.tooltip = {
            show: options.tooltip?.show ?? true,
            format: options.tooltip?.format ?? null,
            ...options.tooltip
        };
        
        // Animation
        this.animation = {
            enabled: options.animation?.enabled ?? false,
            duration: options.animation?.duration ?? 500,
            ...options.animation
        };
        
        // Render buffer
        this.buffer = null;
        this.dirty = true;
        
        // Palette
        this.palette = options.palette ?? ChartPalettes.default;
        
        // Interactivity
        this.hoveredPoint = null;
        this.selectedPoints = [];
    }
    
    /**
     * Get chart type
     * @returns {string}
     */
    get type() {
        return 'base';
    }
    
    /**
     * Get plot area dimensions
     * @returns {object} { x, y, width, height }
     */
    getPlotArea() {
        return {
            x: this.padding.left,
            y: this.padding.top,
            width: this.width - this.padding.left - this.padding.right,
            height: this.height - this.padding.top - this.padding.bottom
        };
    }
    
    /**
     * Add a data series
     * @param {DataSeries|object} series - Series to add
     * @returns {DataSeries}
     */
    addSeries(series) {
        if (!(series instanceof DataSeries)) {
            series = new DataSeries(
                series.name ?? `Series ${this.series.length + 1}`,
                series.data ?? [],
                series
            );
        }
        
        // Assign palette color if not specified
        if (!series.style.char) {
            series.style.char = this.palette[this.series.length % this.palette.length];
        }
        
        // Listen for data changes
        series.on('dataChange', () => {
            this.dirty = true;
            this.emit('dataChange', { chart: this, series });
        });
        
        this.series.push(series);
        this.dirty = true;
        this.emit('seriesAdd', { chart: this, series });
        
        return series;
    }
    
    /**
     * Remove a data series
     * @param {number|string|DataSeries} series - Series index, name, or instance
     */
    removeSeries(series) {
        let index = -1;
        
        if (typeof series === 'number') {
            index = series;
        } else if (typeof series === 'string') {
            index = this.series.findIndex(s => s.name === series);
        } else {
            index = this.series.indexOf(series);
        }
        
        if (index >= 0) {
            const removed = this.series.splice(index, 1)[0];
            this.dirty = true;
            this.emit('seriesRemove', { chart: this, series: removed });
        }
    }
    
    /**
     * Get a series by name
     * @param {string} name - Series name
     * @returns {DataSeries|null}
     */
    getSeries(name) {
        return this.series.find(s => s.name === name) ?? null;
    }
    
    /**
     * Set data from raw values
     * @param {object} config - Data configuration
     */
    setData(config) {
        // Clear existing series
        this.series = [];
        
        // Set labels
        if (config.labels) {
            this.labels = config.labels;
        }
        
        // Add datasets
        if (config.datasets) {
            for (const dataset of config.datasets) {
                this.addSeries(dataset);
            }
        } else if (config.data) {
            // Single series shorthand
            this.addSeries({ name: 'Data', data: config.data });
        }
        
        this.dirty = true;
    }
    
    /**
     * Get combined bounds of all series
     * @returns {object} { minX, maxX, minY, maxY }
     */
    getDataBounds() {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const series of this.series) {
            if (!series.visible) continue;
            
            const bounds = series.getBounds();
            if (bounds.minX < minX) minX = bounds.minX;
            if (bounds.maxX > maxX) maxX = bounds.maxX;
            if (bounds.minY < minY) minY = bounds.minY;
            if (bounds.maxY > maxY) maxY = bounds.maxY;
        }
        
        // Handle empty data
        if (minX === Infinity) {
            return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
        }
        
        return { minX, maxX, minY, maxY };
    }
    
    /**
     * Map data value to plot coordinates
     * @param {number} dataX - Data X value
     * @param {number} dataY - Data Y value
     * @returns {object} { x, y }
     */
    dataToPlot(dataX, dataY) {
        const plot = this.getPlotArea();
        const bounds = this.getDataBounds();
        
        const rangeX = bounds.maxX - bounds.minX || 1;
        const rangeY = bounds.maxY - bounds.minY || 1;
        
        return {
            x: plot.x + ((dataX - bounds.minX) / rangeX) * plot.width,
            y: plot.y + plot.height - ((dataY - bounds.minY) / rangeY) * plot.height
        };
    }
    
    /**
     * Map plot coordinates to data value
     * @param {number} plotX - Plot X coordinate
     * @param {number} plotY - Plot Y coordinate
     * @returns {object} { x, y }
     */
    plotToData(plotX, plotY) {
        const plot = this.getPlotArea();
        const bounds = this.getDataBounds();
        
        const rangeX = bounds.maxX - bounds.minX || 1;
        const rangeY = bounds.maxY - bounds.minY || 1;
        
        return {
            x: bounds.minX + ((plotX - plot.x) / plot.width) * rangeX,
            y: bounds.maxY - ((plotY - plot.y) / plot.height) * rangeY
        };
    }
    
    /**
     * Create render buffer
     * @returns {AsciiBuffer}
     */
    createBuffer() {
        return new AsciiBuffer(this.width, this.height);
    }
    
    /**
     * Clear the buffer
     * @param {AsciiBuffer} buffer - Buffer to clear
     */
    clearBuffer(buffer) {
        buffer.clear(' ');
    }
    
    /**
     * Render title
     * @param {AsciiBuffer} buffer - Target buffer
     */
    renderTitle(buffer) {
        if (!this.title.text) return;
        
        const text = this.title.text;
        const x = Math.floor((this.width - text.length) / 2);
        
        let y = 0;
        if (this.title.position === 'bottom') {
            y = this.height - 1;
        }
        
        for (let i = 0; i < text.length && x + i < this.width; i++) {
            buffer.setChar(x + i, y, text[i]);
        }
    }
    
    /**
     * Render grid lines
     * @param {AsciiBuffer} buffer - Target buffer
     */
    renderGrid(buffer) {
        if (!this.grid.show) return;
        
        const plot = this.getPlotArea();
        const char = this.grid.char;
        
        // Vertical grid lines
        for (let i = 1; i < this.grid.xLines; i++) {
            const x = Math.floor(plot.x + (plot.width * i) / this.grid.xLines);
            for (let y = plot.y; y < plot.y + plot.height; y++) {
                if (buffer.getChar(x, y) === ' ') {
                    buffer.setChar(x, y, char);
                }
            }
        }
        
        // Horizontal grid lines
        for (let i = 1; i < this.grid.yLines; i++) {
            const y = Math.floor(plot.y + (plot.height * i) / this.grid.yLines);
            for (let x = plot.x; x < plot.x + plot.width; x++) {
                if (buffer.getChar(x, y) === ' ') {
                    buffer.setChar(x, y, char);
                }
            }
        }
    }
    
    /**
     * Render chart (to be overridden by subclasses)
     * @param {AsciiBuffer} buffer - Target buffer
     */
    renderChart(buffer) {
        // Override in subclasses
    }
    
    /**
     * Render axes
     * @param {AsciiBuffer} buffer - Target buffer
     */
    renderAxes(buffer) {
        if (!this.showAxes) return;
        
        if (this.axisX) {
            this.axisX.render(buffer);
        }
        
        if (this.axisY) {
            this.axisY.render(buffer);
        }
    }
    
    /**
     * Render legend
     * @param {AsciiBuffer} buffer - Target buffer
     */
    renderLegend(buffer) {
        if (!this.legend.show || this.series.length === 0) return;
        
        // Legend implementation will be in legend.js
    }
    
    /**
     * Main render method
     * @returns {AsciiBuffer}
     */
    render() {
        if (!this.dirty && this.buffer) {
            return this.buffer;
        }
        
        this.buffer = this.createBuffer();
        this.clearBuffer(this.buffer);
        
        // Render in order
        this.renderTitle(this.buffer);
        this.renderGrid(this.buffer);
        this.renderAxes(this.buffer);
        this.renderChart(this.buffer);
        this.renderLegend(this.buffer);
        
        this.dirty = false;
        this.emit('render', { chart: this, buffer: this.buffer });
        
        return this.buffer;
    }
    
    /**
     * Get chart as string
     * @returns {string}
     */
    toString() {
        return this.render().toString();
    }
    
    /**
     * Hit test for data points
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {object|null} { series, pointIndex, point }
     */
    hitTest(x, y) {
        // Override in subclasses for specific hit testing
        return null;
    }
    
    /**
     * Handle mouse move for tooltips
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    onMouseMove(x, y) {
        const hit = this.hitTest(x, y);
        
        if (hit !== this.hoveredPoint) {
            this.hoveredPoint = hit;
            this.emit('hover', { chart: this, point: hit });
        }
    }
    
    /**
     * Handle click for selection
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    onClick(x, y) {
        const hit = this.hitTest(x, y);
        
        if (hit) {
            this.emit('click', { chart: this, point: hit });
        }
    }
    
    /**
     * Get bounding box
     * @returns {BoundingBox}
     */
    getBoundingBox() {
        return new BoundingBox(
            this.x,
            this.y,
            this.x + this.width,
            this.y + this.height
        );
    }
    
    /**
     * Resize chart
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.dirty = true;
        this.emit('resize', { chart: this, width, height });
    }
    
    /**
     * Export chart configuration
     * @returns {object}
     */
    toJSON() {
        return {
            type: this.type,
            width: this.width,
            height: this.height,
            x: this.x,
            y: this.y,
            title: { ...this.title },
            padding: { ...this.padding },
            legend: { ...this.legend },
            grid: { ...this.grid },
            tooltip: { ...this.tooltip },
            labels: [...this.labels],
            series: this.series.map(s => ({
                name: s.name,
                data: s.data.map(p => ({ x: p.x, y: p.y, label: p.label })),
                style: { ...s.style },
                visible: s.visible
            }))
        };
    }
    
    /**
     * Import chart configuration
     * @param {object} config - Configuration object
     */
    fromJSON(config) {
        if (config.width) this.width = config.width;
        if (config.height) this.height = config.height;
        if (config.x) this.x = config.x;
        if (config.y) this.y = config.y;
        if (config.title) this.title = { ...this.title, ...config.title };
        if (config.padding) this.padding = { ...this.padding, ...config.padding };
        if (config.legend) this.legend = { ...this.legend, ...config.legend };
        if (config.grid) this.grid = { ...this.grid, ...config.grid };
        if (config.tooltip) this.tooltip = { ...this.tooltip, ...config.tooltip };
        if (config.labels) this.labels = [...config.labels];
        
        if (config.series) {
            this.series = [];
            for (const s of config.series) {
                this.addSeries(s);
            }
        }
        
        this.dirty = true;
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Format a number for display
 * @param {number} value - Value to format
 * @param {number} precision - Decimal places
 * @returns {string}
 */
export function formatNumber(value, precision = 1) {
    if (Math.abs(value) >= 1000000) {
        return (value / 1000000).toFixed(precision) + 'M';
    }
    if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(precision) + 'K';
    }
    if (Number.isInteger(value)) {
        return value.toString();
    }
    return value.toFixed(precision);
}

/**
 * Generate nice tick values for an axis
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} count - Desired tick count
 * @returns {number[]}
 */
export function generateTicks(min, max, count = 5) {
    const range = max - min;
    if (range === 0) {
        return [min];
    }
    
    // Calculate nice step size
    const roughStep = range / (count - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    
    let niceStep;
    if (normalized <= 1) niceStep = 1;
    else if (normalized <= 2) niceStep = 2;
    else if (normalized <= 5) niceStep = 5;
    else niceStep = 10;
    
    niceStep *= magnitude;
    
    // Generate ticks
    const ticks = [];
    const niceMin = Math.floor(min / niceStep) * niceStep;
    
    for (let tick = niceMin; tick <= max + niceStep * 0.5; tick += niceStep) {
        if (tick >= min - niceStep * 0.5) {
            ticks.push(tick);
        }
    }
    
    return ticks;
}

/**
 * Linear interpolation
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number}
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Map value from one range to another
 * @param {number} value - Input value
 * @param {number} inMin - Input minimum
 * @param {number} inMax - Input maximum
 * @param {number} outMin - Output minimum
 * @param {number} outMax - Output maximum
 * @returns {number}
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
