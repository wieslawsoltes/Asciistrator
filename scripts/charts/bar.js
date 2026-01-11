/**
 * Asciistrator - Bar Chart
 * 
 * Vertical and horizontal bar charts with stacked and grouped variants.
 */

import { Chart, ChartChars, formatNumber } from './base.js';
import { XAxis, YAxis, CategoryAxis } from './axis.js';

// ==========================================
// BAR CHART TYPES
// ==========================================

/**
 * Bar chart orientations
 */
export const BarOrientation = {
    VERTICAL: 'vertical',
    HORIZONTAL: 'horizontal'
};

/**
 * Bar chart modes
 */
export const BarMode = {
    GROUPED: 'grouped',
    STACKED: 'stacked',
    PERCENT: 'percent'
};

// ==========================================
// BAR CHART
// ==========================================

/**
 * Bar chart implementation
 */
export class BarChart extends Chart {
    /**
     * @param {object} options - Chart options
     */
    constructor(options = {}) {
        super(options);
        
        // Bar-specific options
        this.orientation = options.orientation ?? BarOrientation.VERTICAL;
        this.mode = options.mode ?? BarMode.GROUPED;
        
        // Bar styling
        this.barStyle = {
            char: options.barChar ?? '█',
            chars: options.barChars ?? ChartChars.vBar,
            spacing: options.barSpacing ?? 1,
            groupSpacing: options.groupSpacing ?? 2,
            maxBarWidth: options.maxBarWidth ?? 8,
            minBarWidth: options.minBarWidth ?? 1,
            showValues: options.showValues ?? false,
            valuePosition: options.valuePosition ?? 'top', // 'top', 'center', 'end'
            ...options.barStyle
        };
        
        // Initialize axes
        this.initAxes();
    }
    
    get type() {
        return 'bar';
    }
    
    /**
     * Initialize axes based on orientation
     */
    initAxes() {
        if (this.orientation === BarOrientation.VERTICAL) {
            // Category axis on X, value axis on Y
            this.axisX = new CategoryAxis(this.labels, {
                position: 'bottom',
                showLabels: true
            });
            this.axisY = new YAxis({
                position: 'left',
                showLabels: true,
                min: 0
            });
        } else {
            // Value axis on X, category axis on Y
            this.axisX = new XAxis({
                position: 'bottom',
                showLabels: true,
                min: 0
            });
            this.axisY = new CategoryAxis(this.labels, {
                position: 'left',
                showLabels: true
            });
        }
    }
    
    /**
     * Update axes when data changes
     */
    updateAxes() {
        const bounds = this.getDataBounds();
        
        if (this.orientation === BarOrientation.VERTICAL) {
            this.axisX.categories = this.labels;
            this.axisY.setRange(0, bounds.maxY * 1.1);
        } else {
            this.axisY.categories = this.labels;
            this.axisX.setRange(0, bounds.maxX * 1.1);
        }
    }
    
    /**
     * Get data bounds considering stacking
     */
    getDataBounds() {
        if (this.mode === BarMode.STACKED || this.mode === BarMode.PERCENT) {
            return this.getStackedBounds();
        }
        return super.getDataBounds();
    }
    
    /**
     * Get bounds for stacked bars
     */
    getStackedBounds() {
        let maxStack = 0;
        
        // Calculate max stack for each category
        for (let i = 0; i < this.labels.length; i++) {
            let stack = 0;
            for (const series of this.series) {
                if (series.visible && series.data[i]) {
                    stack += series.data[i].y;
                }
            }
            if (stack > maxStack) maxStack = stack;
        }
        
        if (this.mode === BarMode.PERCENT) {
            return { minX: 0, maxX: this.labels.length - 1, minY: 0, maxY: 100 };
        }
        
        return { minX: 0, maxX: this.labels.length - 1, minY: 0, maxY: maxStack };
    }
    
    /**
     * Calculate bar dimensions
     */
    getBarDimensions() {
        const plot = this.getPlotArea();
        const categoryCount = this.labels.length;
        const seriesCount = this.series.filter(s => s.visible).length;
        
        if (categoryCount === 0) {
            return { barWidth: 1, categoryWidth: plot.width, offset: 0 };
        }
        
        if (this.orientation === BarOrientation.VERTICAL) {
            const categoryWidth = Math.floor(plot.width / categoryCount);
            let barWidth;
            
            if (this.mode === BarMode.GROUPED) {
                const totalSpacing = (seriesCount - 1) * this.barStyle.spacing;
                barWidth = Math.floor((categoryWidth - this.barStyle.groupSpacing * 2 - totalSpacing) / seriesCount);
            } else {
                barWidth = categoryWidth - this.barStyle.groupSpacing * 2;
            }
            
            barWidth = Math.max(this.barStyle.minBarWidth, Math.min(this.barStyle.maxBarWidth, barWidth));
            
            return { barWidth, categoryWidth, offset: this.barStyle.groupSpacing };
        } else {
            const categoryHeight = Math.floor(plot.height / categoryCount);
            let barHeight;
            
            if (this.mode === BarMode.GROUPED) {
                const totalSpacing = (seriesCount - 1) * this.barStyle.spacing;
                barHeight = Math.floor((categoryHeight - this.barStyle.groupSpacing * 2 - totalSpacing) / seriesCount);
            } else {
                barHeight = categoryHeight - this.barStyle.groupSpacing * 2;
            }
            
            barHeight = Math.max(this.barStyle.minBarWidth, Math.min(this.barStyle.maxBarWidth, barHeight));
            
            return { barWidth: barHeight, categoryWidth: categoryHeight, offset: this.barStyle.groupSpacing };
        }
    }
    
    /**
     * Render chart content
     * @param {AsciiBuffer} buffer - Target buffer
     */
    renderChart(buffer) {
        this.updateAxes();
        
        const plot = this.getPlotArea();
        const dims = this.getBarDimensions();
        const visibleSeries = this.series.filter(s => s.visible);
        
        if (this.orientation === BarOrientation.VERTICAL) {
            this.renderVerticalBars(buffer, plot, dims, visibleSeries);
        } else {
            this.renderHorizontalBars(buffer, plot, dims, visibleSeries);
        }
    }
    
    /**
     * Render vertical bars
     */
    renderVerticalBars(buffer, plot, dims, visibleSeries) {
        const bounds = this.getDataBounds();
        const maxValue = bounds.maxY || 1;
        
        for (let catIndex = 0; catIndex < this.labels.length; catIndex++) {
            const categoryX = plot.x + catIndex * dims.categoryWidth;
            let stackY = plot.y + plot.height - 1;
            
            // Calculate total for percent mode
            let total = 0;
            if (this.mode === BarMode.PERCENT) {
                for (const series of visibleSeries) {
                    if (series.data[catIndex]) {
                        total += series.data[catIndex].y;
                    }
                }
            }
            
            for (let seriesIndex = 0; seriesIndex < visibleSeries.length; seriesIndex++) {
                const series = visibleSeries[seriesIndex];
                const point = series.data[catIndex];
                
                if (!point) continue;
                
                let value = point.y;
                if (this.mode === BarMode.PERCENT && total > 0) {
                    value = (value / total) * 100;
                }
                
                const barHeight = Math.round((value / maxValue) * (plot.height - 1));
                const char = point.char ?? series.style.char ?? this.palette[seriesIndex % this.palette.length];
                
                let barX;
                if (this.mode === BarMode.GROUPED) {
                    barX = categoryX + dims.offset + seriesIndex * (dims.barWidth + this.barStyle.spacing);
                } else {
                    barX = categoryX + dims.offset;
                }
                
                // Draw bar
                if (this.mode === BarMode.STACKED || this.mode === BarMode.PERCENT) {
                    // Stacked: draw from current stack position
                    for (let h = 0; h < barHeight; h++) {
                        const y = stackY - h;
                        if (y >= plot.y) {
                            for (let w = 0; w < dims.barWidth && barX + w < plot.x + plot.width; w++) {
                                buffer.setChar(barX + w, y, char);
                            }
                        }
                    }
                    stackY -= barHeight;
                } else {
                    // Grouped: draw from bottom
                    for (let h = 0; h < barHeight; h++) {
                        const y = plot.y + plot.height - 1 - h;
                        if (y >= plot.y) {
                            for (let w = 0; w < dims.barWidth && barX + w < plot.x + plot.width; w++) {
                                buffer.setChar(barX + w, y, char);
                            }
                        }
                    }
                }
                
                // Show value label
                if (this.barStyle.showValues && barHeight > 0) {
                    const valueStr = formatNumber(point.y);
                    const labelX = barX + Math.floor((dims.barWidth - valueStr.length) / 2);
                    let labelY;
                    
                    if (this.barStyle.valuePosition === 'top') {
                        labelY = this.mode === BarMode.STACKED || this.mode === BarMode.PERCENT
                            ? stackY
                            : plot.y + plot.height - barHeight - 1;
                    } else if (this.barStyle.valuePosition === 'center') {
                        labelY = plot.y + plot.height - 1 - Math.floor(barHeight / 2);
                    } else {
                        labelY = plot.y + plot.height - 1;
                    }
                    
                    if (labelY >= plot.y) {
                        for (let i = 0; i < valueStr.length; i++) {
                            if (labelX + i >= plot.x && labelX + i < plot.x + plot.width) {
                                buffer.setChar(labelX + i, labelY, valueStr[i]);
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Render horizontal bars
     */
    renderHorizontalBars(buffer, plot, dims, visibleSeries) {
        const bounds = this.getDataBounds();
        const maxValue = bounds.maxX || 1;
        
        for (let catIndex = 0; catIndex < this.labels.length; catIndex++) {
            const categoryY = plot.y + catIndex * dims.categoryWidth;
            let stackX = plot.x;
            
            // Calculate total for percent mode
            let total = 0;
            if (this.mode === BarMode.PERCENT) {
                for (const series of visibleSeries) {
                    if (series.data[catIndex]) {
                        total += series.data[catIndex].y;
                    }
                }
            }
            
            for (let seriesIndex = 0; seriesIndex < visibleSeries.length; seriesIndex++) {
                const series = visibleSeries[seriesIndex];
                const point = series.data[catIndex];
                
                if (!point) continue;
                
                let value = point.y;
                if (this.mode === BarMode.PERCENT && total > 0) {
                    value = (value / total) * 100;
                }
                
                const barWidth = Math.round((value / maxValue) * (plot.width - 1));
                const char = point.char ?? series.style.char ?? this.palette[seriesIndex % this.palette.length];
                
                let barY;
                if (this.mode === BarMode.GROUPED) {
                    barY = categoryY + dims.offset + seriesIndex * (dims.barWidth + this.barStyle.spacing);
                } else {
                    barY = categoryY + dims.offset;
                }
                
                // Draw bar
                if (this.mode === BarMode.STACKED || this.mode === BarMode.PERCENT) {
                    for (let w = 0; w < barWidth; w++) {
                        const x = stackX + w;
                        if (x < plot.x + plot.width) {
                            for (let h = 0; h < dims.barWidth && barY + h < plot.y + plot.height; h++) {
                                buffer.setChar(x, barY + h, char);
                            }
                        }
                    }
                    stackX += barWidth;
                } else {
                    for (let w = 0; w < barWidth; w++) {
                        const x = plot.x + w;
                        if (x < plot.x + plot.width) {
                            for (let h = 0; h < dims.barWidth && barY + h < plot.y + plot.height; h++) {
                                buffer.setChar(x, barY + h, char);
                            }
                        }
                    }
                }
                
                // Show value label
                if (this.barStyle.showValues && barWidth > 0) {
                    const valueStr = formatNumber(point.y);
                    const labelY = barY + Math.floor(dims.barWidth / 2);
                    let labelX;
                    
                    if (this.barStyle.valuePosition === 'end' || this.barStyle.valuePosition === 'top') {
                        labelX = this.mode === BarMode.STACKED || this.mode === BarMode.PERCENT
                            ? stackX + 1
                            : plot.x + barWidth + 1;
                    } else {
                        labelX = plot.x + Math.floor(barWidth / 2) - Math.floor(valueStr.length / 2);
                    }
                    
                    for (let i = 0; i < valueStr.length; i++) {
                        if (labelX + i < plot.x + plot.width) {
                            buffer.setChar(labelX + i, labelY, valueStr[i]);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Render axes
     * @param {AsciiBuffer} buffer - Target buffer
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
     * Hit test for bar interaction
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {object|null}
     */
    hitTest(x, y) {
        const plot = this.getPlotArea();
        const dims = this.getBarDimensions();
        const visibleSeries = this.series.filter(s => s.visible);
        
        if (x < plot.x || x >= plot.x + plot.width ||
            y < plot.y || y >= plot.y + plot.height) {
            return null;
        }
        
        if (this.orientation === BarOrientation.VERTICAL) {
            const catIndex = Math.floor((x - plot.x) / dims.categoryWidth);
            
            if (catIndex >= 0 && catIndex < this.labels.length) {
                for (let seriesIndex = 0; seriesIndex < visibleSeries.length; seriesIndex++) {
                    const series = visibleSeries[seriesIndex];
                    const point = series.data[catIndex];
                    
                    if (point) {
                        return {
                            series,
                            seriesIndex,
                            pointIndex: catIndex,
                            point,
                            category: this.labels[catIndex]
                        };
                    }
                }
            }
        }
        
        return null;
    }
}

// ==========================================
// COLUMN CHART (ALIAS)
// ==========================================

/**
 * Column chart is just a vertical bar chart
 */
export class ColumnChart extends BarChart {
    constructor(options = {}) {
        super({
            ...options,
            orientation: BarOrientation.VERTICAL
        });
    }
    
    get type() {
        return 'column';
    }
}

// ==========================================
// HORIZONTAL BAR CHART
// ==========================================

/**
 * Horizontal bar chart
 */
export class HorizontalBarChart extends BarChart {
    constructor(options = {}) {
        super({
            ...options,
            orientation: BarOrientation.HORIZONTAL
        });
    }
    
    get type() {
        return 'horizontal-bar';
    }
}

// ==========================================
// SPARKLINE
// ==========================================

/**
 * Simple inline sparkline bar chart
 */
export class Sparkline {
    /**
     * @param {number[]} data - Data values
     * @param {object} options - Options
     */
    constructor(data = [], options = {}) {
        this.data = data;
        this.width = options.width ?? data.length;
        this.chars = options.chars ?? ChartChars.vBar;
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
        
        for (let i = 0; i < this.width && i < this.data.length; i++) {
            const value = this.data[i];
            const normalized = (value - min) / range;
            const charIndex = Math.floor(normalized * (this.chars.length - 1));
            result += this.chars[Math.max(0, Math.min(this.chars.length - 1, charIndex))];
        }
        
        return result;
    }
    
    /**
     * Render to buffer
     * @param {AsciiBuffer} buffer - Target buffer
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    render(buffer, x, y) {
        const str = this.toString();
        for (let i = 0; i < str.length; i++) {
            buffer.setChar(x + i, y, str[i]);
        }
    }
}

// ==========================================
// PROGRESS BAR
// ==========================================

/**
 * Simple progress bar
 */
export class ProgressBar {
    /**
     * @param {number} value - Progress value (0-1 or 0-100)
     * @param {object} options - Options
     */
    constructor(value = 0, options = {}) {
        this.value = value > 1 ? value / 100 : value;
        this.width = options.width ?? 20;
        this.filledChar = options.filledChar ?? '█';
        this.emptyChar = options.emptyChar ?? '░';
        this.showPercent = options.showPercent ?? true;
        this.brackets = options.brackets ?? ['[', ']'];
    }
    
    /**
     * Set progress value
     * @param {number} value - New value
     */
    setValue(value) {
        this.value = value > 1 ? value / 100 : value;
    }
    
    /**
     * Render progress bar to string
     * @returns {string}
     */
    toString() {
        const barWidth = this.width - (this.brackets ? 2 : 0);
        const filledWidth = Math.round(this.value * barWidth);
        
        let result = '';
        
        if (this.brackets) {
            result += this.brackets[0];
        }
        
        result += this.filledChar.repeat(filledWidth);
        result += this.emptyChar.repeat(barWidth - filledWidth);
        
        if (this.brackets) {
            result += this.brackets[1];
        }
        
        if (this.showPercent) {
            result += ` ${Math.round(this.value * 100)}%`;
        }
        
        return result;
    }
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

/**
 * Create a bar chart with common presets
 * @param {string} preset - Preset name
 * @param {object} options - Additional options
 * @returns {BarChart}
 */
export function createBarChart(preset = 'default', options = {}) {
    const presets = {
        default: {},
        horizontal: { orientation: BarOrientation.HORIZONTAL },
        stacked: { mode: BarMode.STACKED },
        percent: { mode: BarMode.PERCENT },
        'stacked-horizontal': { 
            orientation: BarOrientation.HORIZONTAL, 
            mode: BarMode.STACKED 
        }
    };
    
    return new BarChart({ ...presets[preset], ...options });
}
