/**
 * Asciistrator - Line Chart
 * 
 * Line charts with markers, smooth curves, and area fill options.
 */

import { Chart, ChartChars, formatNumber, lerp } from './base.js';
import { XAxis, YAxis, CategoryAxis } from './axis.js';
import { drawLine } from '../core/ascii/rasterizer.js';

// ==========================================
// LINE CHART OPTIONS
// ==========================================

/**
 * Line chart interpolation modes
 */
export const LineInterpolation = {
    LINEAR: 'linear',
    STEP: 'step',
    STEP_BEFORE: 'step-before',
    STEP_AFTER: 'step-after',
    SMOOTH: 'smooth'
};

/**
 * Marker styles
 */
export const MarkerStyle = {
    NONE: 'none',
    CIRCLE: '●',
    CIRCLE_EMPTY: '○',
    SQUARE: '■',
    SQUARE_EMPTY: '□',
    DIAMOND: '◆',
    DIAMOND_EMPTY: '◇',
    TRIANGLE: '▲',
    TRIANGLE_DOWN: '▼',
    STAR: '★',
    PLUS: '+',
    CROSS: '×'
};

// ==========================================
// LINE CHART
// ==========================================

/**
 * Line chart implementation
 */
export class LineChart extends Chart {
    /**
     * @param {object} options - Chart options
     */
    constructor(options = {}) {
        super(options);
        
        // Line-specific options
        this.interpolation = options.interpolation ?? LineInterpolation.LINEAR;
        
        // Line styling
        this.lineStyle = {
            char: options.lineChar ?? '─',
            verticalChar: options.verticalChar ?? '│',
            diagonalUpChar: options.diagonalUpChar ?? '╱',
            diagonalDownChar: options.diagonalDownChar ?? '╲',
            showLine: options.showLine ?? true,
            lineWidth: options.lineWidth ?? 1,
            ...options.lineStyle
        };
        
        // Marker styling
        this.markerStyle = {
            show: options.showMarkers ?? true,
            char: options.markerChar ?? MarkerStyle.CIRCLE,
            size: options.markerSize ?? 1,
            ...options.markerStyle
        };
        
        // Area fill
        this.areaStyle = {
            show: options.showArea ?? false,
            char: options.areaChar ?? '░',
            stacked: options.stackedArea ?? false,
            ...options.areaStyle
        };
        
        // Data points
        this.showDataPoints = options.showDataPoints ?? false;
        
        // Initialize axes
        this.initAxes();
    }
    
    get type() {
        return 'line';
    }
    
    /**
     * Initialize axes
     */
    initAxes() {
        if (this.labels.length > 0) {
            this.axisX = new CategoryAxis(this.labels, {
                position: 'bottom',
                showLabels: true
            });
        } else {
            this.axisX = new XAxis({
                position: 'bottom',
                showLabels: true
            });
        }
        
        this.axisY = new YAxis({
            position: 'left',
            showLabels: true
        });
    }
    
    /**
     * Update axes with data range
     */
    updateAxes() {
        const bounds = this.getDataBounds();
        
        if (this.labels.length > 0) {
            this.axisX.categories = this.labels;
        } else {
            this.axisX.setRange(bounds.minX, bounds.maxX);
        }
        
        // Add padding to Y axis
        const yPadding = (bounds.maxY - bounds.minY) * 0.1 || 1;
        this.axisY.setRange(
            Math.min(0, bounds.minY - yPadding),
            bounds.maxY + yPadding
        );
    }
    
    /**
     * Convert data point to plot coordinates
     * @param {number} index - Point index
     * @param {number} value - Y value
     * @returns {object} { x, y }
     */
    getPlotPoint(index, value) {
        const plot = this.getPlotArea();
        const bounds = this.getDataBounds();
        
        // X position
        let x;
        if (this.labels.length > 0) {
            const slotWidth = plot.width / this.labels.length;
            x = plot.x + index * slotWidth + slotWidth / 2;
        } else {
            const rangeX = bounds.maxX - bounds.minX || 1;
            x = plot.x + ((index - bounds.minX) / rangeX) * plot.width;
        }
        
        // Y position (inverted)
        const rangeY = this.axisY.getMax() - this.axisY.getMin() || 1;
        const normalizedY = (value - this.axisY.getMin()) / rangeY;
        const y = plot.y + plot.height - 1 - normalizedY * (plot.height - 1);
        
        return { x: Math.round(x), y: Math.round(y) };
    }
    
    /**
     * Render chart content
     * @param {AsciiBuffer} buffer - Target buffer
     */
    renderChart(buffer) {
        this.updateAxes();
        
        const plot = this.getPlotArea();
        const visibleSeries = this.series.filter(s => s.visible);
        
        // Render area fill first (behind lines)
        if (this.areaStyle.show) {
            this.renderAreaFill(buffer, plot, visibleSeries);
        }
        
        // Render lines
        if (this.lineStyle.showLine) {
            for (let i = 0; i < visibleSeries.length; i++) {
                this.renderLine(buffer, plot, visibleSeries[i], i);
            }
        }
        
        // Render markers on top
        if (this.markerStyle.show) {
            for (let i = 0; i < visibleSeries.length; i++) {
                this.renderMarkers(buffer, plot, visibleSeries[i], i);
            }
        }
    }
    
    /**
     * Render line for a series
     */
    renderLine(buffer, plot, series, seriesIndex) {
        const points = this.getSeriesPlotPoints(series);
        
        if (points.length < 2) return;
        
        const lineChar = series.style.lineChar ?? this.lineStyle.char;
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            if (this.interpolation === LineInterpolation.STEP ||
                this.interpolation === LineInterpolation.STEP_AFTER) {
                // Step: horizontal then vertical
                this.drawStepLine(buffer, p1.x, p1.y, p2.x, p2.y, lineChar, 'after');
            } else if (this.interpolation === LineInterpolation.STEP_BEFORE) {
                // Step: vertical then horizontal
                this.drawStepLine(buffer, p1.x, p1.y, p2.x, p2.y, lineChar, 'before');
            } else {
                // Linear or smooth
                this.drawLineBetween(buffer, p1.x, p1.y, p2.x, p2.y, lineChar);
            }
        }
    }
    
    /**
     * Get plot points for a series
     */
    getSeriesPlotPoints(series) {
        const points = [];
        
        for (let i = 0; i < series.data.length; i++) {
            const point = series.data[i];
            const plotPoint = this.getPlotPoint(
                typeof point.x === 'number' ? point.x : i,
                point.y
            );
            points.push({
                ...plotPoint,
                data: point
            });
        }
        
        return points;
    }
    
    /**
     * Draw line between two points
     */
    drawLineBetween(buffer, x1, y1, x2, y2, char) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        const plot = this.getPlotArea();
        
        while (true) {
            // Only draw within plot area
            if (x >= plot.x && x < plot.x + plot.width &&
                y >= plot.y && y < plot.y + plot.height) {
                
                // Determine character based on direction
                let drawChar = char;
                if (dx === 0) {
                    drawChar = this.lineStyle.verticalChar;
                } else if (dy === 0) {
                    drawChar = this.lineStyle.char;
                } else if ((sx > 0 && sy < 0) || (sx < 0 && sy > 0)) {
                    drawChar = this.lineStyle.diagonalUpChar;
                } else {
                    drawChar = this.lineStyle.diagonalDownChar;
                }
                
                buffer.setChar(x, y, drawChar);
            }
            
            if (x === x2 && y === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }
    
    /**
     * Draw step line
     */
    drawStepLine(buffer, x1, y1, x2, y2, char, mode) {
        const plot = this.getPlotArea();
        
        if (mode === 'after') {
            // Horizontal first, then vertical
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                if (x >= plot.x && x < plot.x + plot.width && y1 >= plot.y && y1 < plot.y + plot.height) {
                    buffer.setChar(x, y1, this.lineStyle.char);
                }
            }
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                if (x2 >= plot.x && x2 < plot.x + plot.width && y >= plot.y && y < plot.y + plot.height) {
                    buffer.setChar(x2, y, this.lineStyle.verticalChar);
                }
            }
        } else {
            // Vertical first, then horizontal
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                if (x1 >= plot.x && x1 < plot.x + plot.width && y >= plot.y && y < plot.y + plot.height) {
                    buffer.setChar(x1, y, this.lineStyle.verticalChar);
                }
            }
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                if (x >= plot.x && x < plot.x + plot.width && y2 >= plot.y && y2 < plot.y + plot.height) {
                    buffer.setChar(x, y2, this.lineStyle.char);
                }
            }
        }
    }
    
    /**
     * Render markers for a series
     */
    renderMarkers(buffer, plot, series, seriesIndex) {
        const points = this.getSeriesPlotPoints(series);
        const marker = series.style.markerChar ?? this.markerStyle.char ?? 
                      this.palette[seriesIndex % this.palette.length];
        
        for (const point of points) {
            if (point.x >= plot.x && point.x < plot.x + plot.width &&
                point.y >= plot.y && point.y < plot.y + plot.height) {
                buffer.setChar(point.x, point.y, marker);
            }
        }
    }
    
    /**
     * Render area fill below lines
     */
    renderAreaFill(buffer, plot, visibleSeries) {
        const baseY = plot.y + plot.height - 1;
        
        if (this.areaStyle.stacked) {
            // Stacked area
            const stackedPoints = this.calculateStackedPoints(visibleSeries);
            
            for (let i = visibleSeries.length - 1; i >= 0; i--) {
                const points = stackedPoints[i];
                const char = visibleSeries[i].style.fillChar ?? 
                            this.areaStyle.char;
                
                const prevPoints = i > 0 ? stackedPoints[i - 1] : null;
                
                for (let j = 0; j < points.length; j++) {
                    const topY = points[j].y;
                    const bottomY = prevPoints ? prevPoints[j].y : baseY;
                    const x = points[j].x;
                    
                    for (let y = topY; y <= bottomY; y++) {
                        if (x >= plot.x && x < plot.x + plot.width &&
                            y >= plot.y && y < plot.y + plot.height) {
                            if (buffer.getChar(x, y) === ' ') {
                                buffer.setChar(x, y, char);
                            }
                        }
                    }
                }
            }
        } else {
            // Simple area fill
            for (let i = 0; i < visibleSeries.length; i++) {
                const series = visibleSeries[i];
                const points = this.getSeriesPlotPoints(series);
                const char = series.style.fillChar ?? this.areaStyle.char;
                
                for (const point of points) {
                    for (let y = point.y; y <= baseY; y++) {
                        if (point.x >= plot.x && point.x < plot.x + plot.width &&
                            y >= plot.y && y < plot.y + plot.height) {
                            if (buffer.getChar(point.x, y) === ' ') {
                                buffer.setChar(point.x, y, char);
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Calculate stacked points
     */
    calculateStackedPoints(visibleSeries) {
        const result = [];
        
        for (let i = 0; i < visibleSeries.length; i++) {
            const series = visibleSeries[i];
            const points = [];
            
            for (let j = 0; j < series.data.length; j++) {
                let stackedValue = series.data[j].y;
                
                // Add values from previous series
                for (let k = 0; k < i; k++) {
                    if (visibleSeries[k].data[j]) {
                        stackedValue += visibleSeries[k].data[j].y;
                    }
                }
                
                const plotPoint = this.getPlotPoint(
                    typeof series.data[j].x === 'number' ? series.data[j].x : j,
                    stackedValue
                );
                points.push(plotPoint);
            }
            
            result.push(points);
        }
        
        return result;
    }
    
    /**
     * Render axes
     */
    renderAxes(buffer) {
        if (!this.showAxes) return;
        
        const plot = this.getPlotArea();
        
        if (this.axisX) {
            this.axisX.render(buffer, plot);
        }
        if (this.axisY) {
            this.axisY.render(buffer, plot);
        }
    }
    
    /**
     * Hit test for line/point interaction
     */
    hitTest(x, y) {
        const plot = this.getPlotArea();
        
        if (x < plot.x || x >= plot.x + plot.width ||
            y < plot.y || y >= plot.y + plot.height) {
            return null;
        }
        
        const visibleSeries = this.series.filter(s => s.visible);
        let closest = null;
        let closestDist = Infinity;
        
        for (let i = 0; i < visibleSeries.length; i++) {
            const series = visibleSeries[i];
            const points = this.getSeriesPlotPoints(series);
            
            for (let j = 0; j < points.length; j++) {
                const p = points[j];
                const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
                
                if (dist < closestDist && dist <= 2) {
                    closestDist = dist;
                    closest = {
                        series,
                        seriesIndex: i,
                        pointIndex: j,
                        point: p.data
                    };
                }
            }
        }
        
        return closest;
    }
}

// ==========================================
// AREA CHART
// ==========================================

/**
 * Area chart (line chart with fill)
 */
export class AreaChart extends LineChart {
    constructor(options = {}) {
        super({
            ...options,
            showArea: true,
            areaChar: options.areaChar ?? '░'
        });
    }
    
    get type() {
        return 'area';
    }
}

// ==========================================
// STACKED AREA CHART
// ==========================================

/**
 * Stacked area chart
 */
export class StackedAreaChart extends LineChart {
    constructor(options = {}) {
        super({
            ...options,
            showArea: true,
            stackedArea: true
        });
    }
    
    get type() {
        return 'stacked-area';
    }
    
    /**
     * Override data bounds for stacked values
     */
    getDataBounds() {
        const visibleSeries = this.series.filter(s => s.visible);
        
        if (visibleSeries.length === 0) {
            return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
        }
        
        let maxX = 0;
        let maxStackedY = 0;
        
        // Find max data points
        for (const series of visibleSeries) {
            if (series.data.length > maxX) {
                maxX = series.data.length;
            }
        }
        
        // Calculate max stacked value
        for (let i = 0; i < maxX; i++) {
            let stackedY = 0;
            for (const series of visibleSeries) {
                if (series.data[i]) {
                    stackedY += series.data[i].y;
                }
            }
            if (stackedY > maxStackedY) {
                maxStackedY = stackedY;
            }
        }
        
        return {
            minX: 0,
            maxX: maxX - 1,
            minY: 0,
            maxY: maxStackedY
        };
    }
}

// ==========================================
// SPARKLINE
// ==========================================

/**
 * Simple inline sparkline
 */
export class SparkLine {
    /**
     * @param {number[]} data - Data values
     * @param {object} options - Options
     */
    constructor(data = [], options = {}) {
        this.data = data;
        this.width = options.width ?? data.length;
        this.height = options.height ?? 1;
        this.chars = options.chars ?? ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
        this.min = options.min ?? null;
        this.max = options.max ?? null;
    }
    
    /**
     * Render sparkline to string
     * @returns {string}
     */
    toString() {
        if (this.data.length === 0) return '';
        
        const min = this.min ?? Math.min(...this.data);
        const max = this.max ?? Math.max(...this.data);
        const range = max - min || 1;
        
        let result = '';
        
        // Resample if needed
        const step = this.data.length / this.width;
        
        for (let i = 0; i < this.width; i++) {
            const dataIndex = Math.floor(i * step);
            const value = this.data[Math.min(dataIndex, this.data.length - 1)];
            const normalized = (value - min) / range;
            const charIndex = Math.round(normalized * (this.chars.length - 1));
            result += this.chars[Math.max(0, Math.min(this.chars.length - 1, charIndex))];
        }
        
        return result;
    }
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

/**
 * Create a line chart with common presets
 * @param {string} preset - Preset name
 * @param {object} options - Additional options
 * @returns {LineChart}
 */
export function createLineChart(preset = 'default', options = {}) {
    const presets = {
        default: {},
        smooth: { interpolation: LineInterpolation.SMOOTH },
        step: { interpolation: LineInterpolation.STEP },
        'markers-only': { showLine: false, showMarkers: true },
        area: { showArea: true },
        'stacked-area': { showArea: true, stackedArea: true }
    };
    
    return new LineChart({ ...presets[preset], ...options });
}
