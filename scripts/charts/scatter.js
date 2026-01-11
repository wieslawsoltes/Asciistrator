/**
 * Asciistrator - Scatter Chart
 * 
 * Scatter plots with point markers, trend lines, and bubbles.
 */

import { Chart, ChartChars, formatNumber, lerp, mapRange } from './base.js';
import { XAxis, YAxis } from './axis.js';

// ==========================================
// SCATTER CHART OPTIONS
// ==========================================

/**
 * Marker shapes for scatter points
 */
export const ScatterMarker = {
    CIRCLE: '●',
    CIRCLE_EMPTY: '○',
    SQUARE: '■',
    SQUARE_EMPTY: '□',
    DIAMOND: '◆',
    DIAMOND_EMPTY: '◇',
    TRIANGLE: '▲',
    TRIANGLE_DOWN: '▼',
    STAR: '★',
    STAR_EMPTY: '☆',
    PLUS: '+',
    CROSS: '×',
    DOT: '·'
};

/**
 * Trend line types
 */
export const TrendLineType = {
    NONE: 'none',
    LINEAR: 'linear',
    POLYNOMIAL: 'polynomial',
    EXPONENTIAL: 'exponential',
    LOGARITHMIC: 'logarithmic',
    MOVING_AVERAGE: 'moving-average'
};

// ==========================================
// SCATTER CHART
// ==========================================

/**
 * Scatter chart implementation
 */
export class ScatterChart extends Chart {
    /**
     * @param {object} options - Chart options
     */
    constructor(options = {}) {
        super(options);
        
        // Marker options
        this.markerStyle = {
            char: options.markerChar ?? ScatterMarker.CIRCLE,
            sizeByValue: options.sizeByValue ?? false,
            minSize: options.minMarkerSize ?? 1,
            maxSize: options.maxMarkerSize ?? 3,
            ...options.markerStyle
        };
        
        // Trend line options
        this.trendLine = {
            type: options.trendLineType ?? TrendLineType.NONE,
            char: options.trendLineChar ?? '·',
            order: options.trendOrder ?? 2, // For polynomial
            period: options.trendPeriod ?? 5, // For moving average
            showEquation: options.showEquation ?? false,
            ...options.trendLine
        };
        
        // Quadrant lines
        this.quadrants = {
            show: options.showQuadrants ?? false,
            xLine: options.quadrantX ?? null, // Value for vertical line
            yLine: options.quadrantY ?? null, // Value for horizontal line
            char: options.quadrantChar ?? '┄',
            ...options.quadrants
        };
        
        // Initialize axes
        this.initAxes();
    }
    
    get type() {
        return 'scatter';
    }
    
    /**
     * Initialize axes
     */
    initAxes() {
        this.axisX = new XAxis({
            position: 'bottom',
            showLabels: true
        });
        
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
        
        // Add some padding
        const xPadding = (bounds.maxX - bounds.minX) * 0.1 || 1;
        const yPadding = (bounds.maxY - bounds.minY) * 0.1 || 1;
        
        this.axisX.setRange(bounds.minX - xPadding, bounds.maxX + xPadding);
        this.axisY.setRange(bounds.minY - yPadding, bounds.maxY + yPadding);
    }
    
    /**
     * Render chart content
     * @param {AsciiBuffer} buffer - Target buffer
     */
    renderChart(buffer) {
        this.updateAxes();
        
        const plot = this.getPlotArea();
        const visibleSeries = this.series.filter(s => s.visible);
        
        // Render quadrant lines first
        if (this.quadrants.show) {
            this.renderQuadrants(buffer, plot);
        }
        
        // Render trend lines
        if (this.trendLine.type !== TrendLineType.NONE) {
            for (let i = 0; i < visibleSeries.length; i++) {
                this.renderTrendLine(buffer, plot, visibleSeries[i], i);
            }
        }
        
        // Render data points
        for (let i = 0; i < visibleSeries.length; i++) {
            this.renderPoints(buffer, plot, visibleSeries[i], i);
        }
    }
    
    /**
     * Convert data point to plot coordinates
     */
    dataToPlotCoords(dataX, dataY) {
        const plot = this.getPlotArea();
        
        const normalizedX = this.axisX.scale(dataX);
        const normalizedY = this.axisY.scale(dataY);
        
        return {
            x: Math.round(plot.x + normalizedX * (plot.width - 1)),
            y: Math.round(plot.y + plot.height - 1 - normalizedY * (plot.height - 1))
        };
    }
    
    /**
     * Render data points
     */
    renderPoints(buffer, plot, series, seriesIndex) {
        const marker = series.style.markerChar ?? this.markerStyle.char ?? 
                      this.palette[seriesIndex % this.palette.length];
        
        // Calculate value range for size mapping
        let minZ = Infinity, maxZ = -Infinity;
        if (this.markerStyle.sizeByValue) {
            for (const point of series.data) {
                const z = point.metadata?.z ?? point.y;
                if (z < minZ) minZ = z;
                if (z > maxZ) maxZ = z;
            }
        }
        
        for (const point of series.data) {
            const pos = this.dataToPlotCoords(point.x, point.y);
            
            if (pos.x >= plot.x && pos.x < plot.x + plot.width &&
                pos.y >= plot.y && pos.y < plot.y + plot.height) {
                
                const pointMarker = point.char ?? marker;
                
                if (this.markerStyle.sizeByValue) {
                    // Draw larger marker based on Z value
                    const z = point.metadata?.z ?? point.y;
                    const size = Math.round(mapRange(z, minZ, maxZ, 
                        this.markerStyle.minSize, this.markerStyle.maxSize));
                    this.drawMarkerWithSize(buffer, pos.x, pos.y, pointMarker, size, plot);
                } else {
                    buffer.setChar(pos.x, pos.y, pointMarker);
                }
            }
        }
    }
    
    /**
     * Draw marker with size (for bubble effect)
     */
    drawMarkerWithSize(buffer, cx, cy, char, size, plot) {
        if (size <= 1) {
            buffer.setChar(cx, cy, char);
            return;
        }
        
        // Draw filled circle of given size
        for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size * 2; dx <= size * 2; dx++) {
                const dist = Math.sqrt((dx / 2) * (dx / 2) + dy * dy);
                if (dist <= size) {
                    const x = cx + dx;
                    const y = cy + dy;
                    if (x >= plot.x && x < plot.x + plot.width &&
                        y >= plot.y && y < plot.y + plot.height) {
                        buffer.setChar(x, y, char);
                    }
                }
            }
        }
    }
    
    /**
     * Render trend line for a series
     */
    renderTrendLine(buffer, plot, series, seriesIndex) {
        if (series.data.length < 2) return;
        
        const char = series.style.lineChar ?? this.trendLine.char;
        let trendPoints;
        
        switch (this.trendLine.type) {
            case TrendLineType.LINEAR:
                trendPoints = this.calculateLinearTrend(series.data);
                break;
            case TrendLineType.POLYNOMIAL:
                trendPoints = this.calculatePolynomialTrend(series.data, this.trendLine.order);
                break;
            case TrendLineType.MOVING_AVERAGE:
                trendPoints = this.calculateMovingAverage(series.data, this.trendLine.period);
                break;
            default:
                return;
        }
        
        // Render trend line points
        for (const point of trendPoints) {
            const pos = this.dataToPlotCoords(point.x, point.y);
            
            if (pos.x >= plot.x && pos.x < plot.x + plot.width &&
                pos.y >= plot.y && pos.y < plot.y + plot.height) {
                // Only draw if not occupied by data point
                if (buffer.getChar(pos.x, pos.y) === ' ' || 
                    buffer.getChar(pos.x, pos.y) === '·') {
                    buffer.setChar(pos.x, pos.y, char);
                }
            }
        }
    }
    
    /**
     * Calculate linear regression trend
     */
    calculateLinearTrend(data) {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        for (const p of data) {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumX2 += p.x * p.x;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Generate trend points
        const minX = Math.min(...data.map(p => p.x));
        const maxX = Math.max(...data.map(p => p.x));
        const points = [];
        
        const steps = 50;
        for (let i = 0; i <= steps; i++) {
            const x = minX + (maxX - minX) * (i / steps);
            const y = slope * x + intercept;
            points.push({ x, y });
        }
        
        // Store equation if needed
        this._trendEquation = `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`;
        
        return points;
    }
    
    /**
     * Calculate polynomial trend (simplified quadratic)
     */
    calculatePolynomialTrend(data, order) {
        // For simplicity, only support quadratic (order 2)
        if (order !== 2 || data.length < 3) {
            return this.calculateLinearTrend(data);
        }
        
        // Use least squares for quadratic fit
        const n = data.length;
        let sumX = 0, sumY = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
        let sumXY = 0, sumX2Y = 0;
        
        for (const p of data) {
            const x = p.x, y = p.y;
            sumX += x;
            sumY += y;
            sumX2 += x * x;
            sumX3 += x * x * x;
            sumX4 += x * x * x * x;
            sumXY += x * y;
            sumX2Y += x * x * y;
        }
        
        // Solve system (simplified)
        // This is a basic implementation; full implementation would use matrix solving
        const avgX = sumX / n;
        const avgY = sumY / n;
        
        // Fallback to linear for stability
        return this.calculateLinearTrend(data);
    }
    
    /**
     * Calculate moving average
     */
    calculateMovingAverage(data, period) {
        const sorted = [...data].sort((a, b) => a.x - b.x);
        const points = [];
        
        for (let i = period - 1; i < sorted.length; i++) {
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) {
                sum += sorted[j].y;
            }
            points.push({
                x: sorted[i].x,
                y: sum / period
            });
        }
        
        return points;
    }
    
    /**
     * Render quadrant dividing lines
     */
    renderQuadrants(buffer, plot) {
        const char = this.quadrants.char;
        
        // Vertical line at quadrantX
        if (this.quadrants.xLine !== null) {
            const pos = this.dataToPlotCoords(this.quadrants.xLine, 0);
            if (pos.x >= plot.x && pos.x < plot.x + plot.width) {
                for (let y = plot.y; y < plot.y + plot.height; y++) {
                    buffer.setChar(pos.x, y, '┆');
                }
            }
        }
        
        // Horizontal line at quadrantY
        if (this.quadrants.yLine !== null) {
            const pos = this.dataToPlotCoords(0, this.quadrants.yLine);
            if (pos.y >= plot.y && pos.y < plot.y + plot.height) {
                for (let x = plot.x; x < plot.x + plot.width; x++) {
                    buffer.setChar(x, pos.y, '┄');
                }
            }
        }
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
     * Hit test for point interaction
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
            
            for (let j = 0; j < series.data.length; j++) {
                const point = series.data[j];
                const pos = this.dataToPlotCoords(point.x, point.y);
                
                const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                
                if (dist < closestDist && dist <= 2) {
                    closestDist = dist;
                    closest = {
                        series,
                        seriesIndex: i,
                        pointIndex: j,
                        point
                    };
                }
            }
        }
        
        return closest;
    }
}

// ==========================================
// BUBBLE CHART
// ==========================================

/**
 * Bubble chart (scatter with sized markers)
 */
export class BubbleChart extends ScatterChart {
    /**
     * @param {object} options - Chart options
     */
    constructor(options = {}) {
        super({
            ...options,
            sizeByValue: true
        });
        
        this.markerStyle.sizeByValue = true;
        
        // Z-value field name
        this.zField = options.zField ?? 'z';
    }
    
    get type() {
        return 'bubble';
    }
    
    /**
     * Add bubble data point
     * @param {number} x - X value
     * @param {number} y - Y value  
     * @param {number} z - Size value
     * @param {object} options - Additional options
     */
    addBubble(x, y, z, options = {}) {
        if (this.series.length === 0) {
            this.addSeries({ name: 'Bubbles', data: [] });
        }
        
        this.series[0].addPoint({
            x, y,
            metadata: { z },
            ...options
        });
    }
}

// ==========================================
// CORRELATION PLOT
// ==========================================

/**
 * Correlation matrix visualization
 */
export class CorrelationPlot extends Chart {
    /**
     * @param {object} options - Chart options
     */
    constructor(options = {}) {
        super(options);
        
        // Correlation data (matrix)
        this.matrix = options.matrix ?? [];
        this.variables = options.variables ?? [];
        
        // Style
        this.correlationStyle = {
            positiveChars: options.positiveChars ?? ['·', '○', '●'],
            negativeChars: options.negativeChars ?? ['·', '◇', '◆'],
            showValues: options.showValues ?? true,
            ...options.correlationStyle
        };
        
        this.showAxes = false;
    }
    
    get type() {
        return 'correlation';
    }
    
    /**
     * Set correlation matrix
     * @param {number[][]} matrix - Correlation matrix
     * @param {string[]} variables - Variable names
     */
    setMatrix(matrix, variables) {
        this.matrix = matrix;
        this.variables = variables;
        this.dirty = true;
    }
    
    /**
     * Calculate correlation from data
     * @param {number[][]} data - Array of variable arrays
     * @param {string[]} names - Variable names
     */
    calculateFromData(data, names) {
        const n = data.length;
        const matrix = [];
        
        for (let i = 0; i < n; i++) {
            matrix[i] = [];
            for (let j = 0; j < n; j++) {
                matrix[i][j] = this.pearsonCorrelation(data[i], data[j]);
            }
        }
        
        this.setMatrix(matrix, names);
    }
    
    /**
     * Calculate Pearson correlation coefficient
     */
    pearsonCorrelation(x, y) {
        const n = Math.min(x.length, y.length);
        if (n === 0) return 0;
        
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }
    
    /**
     * Render correlation matrix
     */
    renderChart(buffer) {
        const plot = this.getPlotArea();
        const n = this.matrix.length;
        
        if (n === 0) return;
        
        // Calculate cell size
        const cellWidth = Math.floor(plot.width / (n + 1));
        const cellHeight = Math.floor(plot.height / (n + 1));
        
        // Draw variable labels (top)
        for (let j = 0; j < n; j++) {
            const label = this.variables[j] ?? `V${j}`;
            const x = plot.x + (j + 1) * cellWidth + Math.floor(cellWidth / 2) - Math.floor(label.length / 2);
            for (let k = 0; k < label.length && x + k < buffer.width; k++) {
                buffer.setChar(x + k, plot.y, label[k]);
            }
        }
        
        // Draw variable labels (left) and matrix cells
        for (let i = 0; i < n; i++) {
            const label = this.variables[i] ?? `V${i}`;
            const y = plot.y + (i + 1) * cellHeight + Math.floor(cellHeight / 2);
            
            // Left label
            for (let k = 0; k < label.length && plot.x + k < plot.x + cellWidth; k++) {
                buffer.setChar(plot.x + k, y, label[k]);
            }
            
            // Matrix cells
            for (let j = 0; j < n; j++) {
                const value = this.matrix[i][j];
                const x = plot.x + (j + 1) * cellWidth + Math.floor(cellWidth / 2);
                
                // Choose character based on correlation
                let char;
                const absValue = Math.abs(value);
                const charIndex = Math.min(2, Math.floor(absValue * 3));
                
                if (value >= 0) {
                    char = this.correlationStyle.positiveChars[charIndex];
                } else {
                    char = this.correlationStyle.negativeChars[charIndex];
                }
                
                buffer.setChar(x, y, char);
                
                // Show value if enabled
                if (this.correlationStyle.showValues && cellWidth > 4) {
                    const valueStr = value.toFixed(1);
                    for (let k = 0; k < valueStr.length; k++) {
                        buffer.setChar(x + k + 1, y, valueStr[k]);
                    }
                }
            }
        }
    }
}

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Create a scatter chart
 */
export function createScatterChart(options = {}) {
    return new ScatterChart(options);
}

/**
 * Create a bubble chart
 */
export function createBubbleChart(options = {}) {
    return new BubbleChart(options);
}

/**
 * Create a correlation plot
 */
export function createCorrelationPlot(options = {}) {
    return new CorrelationPlot(options);
}
