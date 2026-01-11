/**
 * Asciistrator - Chart Axis System
 * 
 * X and Y axis components for charts with labels, ticks, and grid lines.
 */

import { EventEmitter } from '../utils/events.js';
import { ChartChars, formatNumber, generateTicks } from './base.js';

// ==========================================
// AXIS OPTIONS
// ==========================================

/**
 * Default axis options
 */
export const AxisDefaults = {
    show: true,
    label: '',
    min: null,
    max: null,
    tickCount: 5,
    tickFormat: null,
    gridLines: true,
    gridChar: '·',
    axisChar: '─',
    tickChar: '┬',
    showLabels: true,
    labelPadding: 1,
    position: 'bottom', // 'bottom', 'top', 'left', 'right'
    type: 'linear', // 'linear', 'category', 'log', 'time'
    reverse: false,
    nice: true
};

// ==========================================
// BASE AXIS CLASS
// ==========================================

/**
 * Base axis class
 */
export class Axis extends EventEmitter {
    /**
     * @param {object} options - Axis configuration
     */
    constructor(options = {}) {
        super();
        
        this.show = options.show ?? AxisDefaults.show;
        this.label = options.label ?? AxisDefaults.label;
        this.min = options.min ?? AxisDefaults.min;
        this.max = options.max ?? AxisDefaults.max;
        this.tickCount = options.tickCount ?? AxisDefaults.tickCount;
        this.tickFormat = options.tickFormat ?? AxisDefaults.tickFormat;
        this.gridLines = options.gridLines ?? AxisDefaults.gridLines;
        this.gridChar = options.gridChar ?? AxisDefaults.gridChar;
        this.axisChar = options.axisChar ?? AxisDefaults.axisChar;
        this.tickChar = options.tickChar ?? AxisDefaults.tickChar;
        this.showLabels = options.showLabels ?? AxisDefaults.showLabels;
        this.labelPadding = options.labelPadding ?? AxisDefaults.labelPadding;
        this.position = options.position ?? AxisDefaults.position;
        this.type = options.type ?? AxisDefaults.type;
        this.reverse = options.reverse ?? AxisDefaults.reverse;
        this.nice = options.nice ?? AxisDefaults.nice;
        
        // Categories for category axis
        this.categories = options.categories ?? [];
        
        // Computed values
        this._computedMin = 0;
        this._computedMax = 1;
        this._ticks = [];
    }
    
    /**
     * Get axis type
     * @returns {string}
     */
    get axisType() {
        return 'base';
    }
    
    /**
     * Set data range
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     */
    setRange(min, max) {
        this._computedMin = this.min ?? min;
        this._computedMax = this.max ?? max;
        
        // Apply nice values
        if (this.nice && this.type === 'linear') {
            this._ticks = generateTicks(this._computedMin, this._computedMax, this.tickCount);
            if (this._ticks.length > 0) {
                this._computedMin = Math.min(this._computedMin, this._ticks[0]);
                this._computedMax = Math.max(this._computedMax, this._ticks[this._ticks.length - 1]);
            }
        } else {
            this._ticks = this.generateTicks();
        }
    }
    
    /**
     * Get effective min value
     * @returns {number}
     */
    getMin() {
        return this._computedMin;
    }
    
    /**
     * Get effective max value
     * @returns {number}
     */
    getMax() {
        return this._computedMax;
    }
    
    /**
     * Get range
     * @returns {number}
     */
    getRange() {
        return this._computedMax - this._computedMin;
    }
    
    /**
     * Generate tick values
     * @returns {Array}
     */
    generateTicks() {
        if (this.type === 'category') {
            return this.categories.map((cat, i) => ({
                value: i,
                label: cat
            }));
        }
        
        return generateTicks(this._computedMin, this._computedMax, this.tickCount).map(v => ({
            value: v,
            label: this.formatTick(v)
        }));
    }
    
    /**
     * Format tick value
     * @param {number} value - Tick value
     * @returns {string}
     */
    formatTick(value) {
        if (this.tickFormat) {
            return this.tickFormat(value);
        }
        return formatNumber(value);
    }
    
    /**
     * Scale value to normalized position (0-1)
     * @param {number} value - Data value
     * @returns {number}
     */
    scale(value) {
        const range = this.getRange();
        if (range === 0) return 0;
        
        let normalized = (value - this._computedMin) / range;
        
        if (this.reverse) {
            normalized = 1 - normalized;
        }
        
        return normalized;
    }
    
    /**
     * Inverse scale from normalized position to value
     * @param {number} normalized - Normalized position (0-1)
     * @returns {number}
     */
    invert(normalized) {
        if (this.reverse) {
            normalized = 1 - normalized;
        }
        
        return this._computedMin + normalized * this.getRange();
    }
    
    /**
     * Render axis (override in subclasses)
     * @param {AsciiBuffer} buffer - Target buffer
     * @param {object} plotArea - Plot area dimensions
     */
    render(buffer, plotArea) {
        // Override in subclasses
    }
}

// ==========================================
// X AXIS
// ==========================================

/**
 * Horizontal X axis
 */
export class XAxis extends Axis {
    /**
     * @param {object} options - Axis options
     */
    constructor(options = {}) {
        super({
            ...options,
            position: options.position ?? 'bottom',
            axisChar: options.axisChar ?? '─',
            tickChar: options.tickChar ?? '┬'
        });
    }
    
    get axisType() {
        return 'x';
    }
    
    /**
     * Render X axis
     * @param {AsciiBuffer} buffer - Target buffer
     * @param {object} plotArea - { x, y, width, height }
     */
    render(buffer, plotArea) {
        if (!this.show) return;
        
        const y = this.position === 'top' ? plotArea.y - 1 : plotArea.y + plotArea.height;
        
        // Draw axis line
        for (let x = plotArea.x; x < plotArea.x + plotArea.width; x++) {
            buffer.setChar(x, y, this.axisChar);
        }
        
        // Draw origin corner
        if (this.position === 'bottom') {
            buffer.setChar(plotArea.x - 1, y, ChartChars.axisOrigin);
        }
        
        // Draw ticks and labels
        const ticks = this._ticks.length > 0 ? this._ticks : this.generateTicks();
        
        for (const tick of ticks) {
            let tickX;
            
            if (this.type === 'category') {
                // Center labels for categories
                const categoryWidth = plotArea.width / this.categories.length;
                tickX = Math.floor(plotArea.x + tick.value * categoryWidth + categoryWidth / 2);
            } else {
                tickX = Math.floor(plotArea.x + this.scale(tick.value) * plotArea.width);
            }
            
            if (tickX >= plotArea.x && tickX < plotArea.x + plotArea.width) {
                // Draw tick mark
                const tickY = this.position === 'top' ? y - 1 : y;
                buffer.setChar(tickX, tickY, this.tickChar);
                
                // Draw label
                if (this.showLabels) {
                    const label = tick.label.toString();
                    const labelX = Math.floor(tickX - label.length / 2);
                    const labelY = this.position === 'top' ? y - 2 : y + 1;
                    
                    for (let i = 0; i < label.length; i++) {
                        const charX = labelX + i;
                        if (charX >= 0 && charX < buffer.width) {
                            buffer.setChar(charX, labelY, label[i]);
                        }
                    }
                }
            }
        }
        
        // Draw axis label
        if (this.label) {
            const labelX = Math.floor(plotArea.x + (plotArea.width - this.label.length) / 2);
            const labelY = this.position === 'top' ? plotArea.y - 3 : plotArea.y + plotArea.height + 2;
            
            for (let i = 0; i < this.label.length; i++) {
                buffer.setChar(labelX + i, labelY, this.label[i]);
            }
        }
    }
}

// ==========================================
// Y AXIS
// ==========================================

/**
 * Vertical Y axis
 */
export class YAxis extends Axis {
    /**
     * @param {object} options - Axis options
     */
    constructor(options = {}) {
        super({
            ...options,
            position: options.position ?? 'left',
            axisChar: options.axisChar ?? '│',
            tickChar: options.tickChar ?? '├'
        });
    }
    
    get axisType() {
        return 'y';
    }
    
    /**
     * Render Y axis
     * @param {AsciiBuffer} buffer - Target buffer
     * @param {object} plotArea - { x, y, width, height }
     */
    render(buffer, plotArea) {
        if (!this.show) return;
        
        const x = this.position === 'right' ? plotArea.x + plotArea.width : plotArea.x - 1;
        
        // Draw axis line
        for (let y = plotArea.y; y < plotArea.y + plotArea.height; y++) {
            buffer.setChar(x, y, this.axisChar);
        }
        
        // Draw ticks and labels
        const ticks = this._ticks.length > 0 ? this._ticks : this.generateTicks();
        
        for (const tick of ticks) {
            // Y axis is inverted (0 at bottom)
            const tickY = Math.floor(plotArea.y + plotArea.height - 1 - this.scale(tick.value) * (plotArea.height - 1));
            
            if (tickY >= plotArea.y && tickY < plotArea.y + plotArea.height) {
                // Draw tick mark
                buffer.setChar(x, tickY, this.tickChar);
                
                // Draw label
                if (this.showLabels) {
                    const label = tick.label.toString();
                    const labelX = this.position === 'right' 
                        ? x + 1 + this.labelPadding
                        : x - label.length - this.labelPadding;
                    
                    for (let i = 0; i < label.length; i++) {
                        const charX = labelX + i;
                        if (charX >= 0 && charX < buffer.width) {
                            buffer.setChar(charX, tickY, label[i]);
                        }
                    }
                }
            }
        }
        
        // Draw axis label (rotated for vertical text effect)
        if (this.label) {
            const labelX = this.position === 'right' 
                ? plotArea.x + plotArea.width + 4
                : 0;
            const startY = Math.floor(plotArea.y + (plotArea.height - this.label.length) / 2);
            
            for (let i = 0; i < this.label.length; i++) {
                const charY = startY + i;
                if (charY >= 0 && charY < buffer.height) {
                    buffer.setChar(labelX, charY, this.label[i]);
                }
            }
        }
    }
}

// ==========================================
// CATEGORY AXIS
// ==========================================

/**
 * Category axis for discrete values
 */
export class CategoryAxis extends XAxis {
    /**
     * @param {Array<string>} categories - Category labels
     * @param {object} options - Axis options
     */
    constructor(categories, options = {}) {
        super({
            ...options,
            type: 'category',
            categories
        });
    }
    
    /**
     * Get category index
     * @param {string} category - Category name
     * @returns {number}
     */
    getCategoryIndex(category) {
        return this.categories.indexOf(category);
    }
    
    /**
     * Get category at index
     * @param {number} index - Category index
     * @returns {string}
     */
    getCategory(index) {
        return this.categories[index];
    }
    
    /**
     * Scale category to position
     * @param {string|number} value - Category name or index
     * @returns {number}
     */
    scale(value) {
        let index = typeof value === 'string' 
            ? this.getCategoryIndex(value) 
            : value;
        
        if (this.categories.length <= 1) return 0.5;
        
        // Center of each category slot
        const slotWidth = 1 / this.categories.length;
        return (index + 0.5) * slotWidth;
    }
}

// ==========================================
// TIME AXIS
// ==========================================

/**
 * Time axis for date/time values
 */
export class TimeAxis extends XAxis {
    /**
     * @param {object} options - Axis options
     */
    constructor(options = {}) {
        super({
            ...options,
            type: 'time'
        });
        
        this.timeFormat = options.timeFormat ?? 'auto';
    }
    
    /**
     * Format time value
     * @param {number|Date} value - Time value
     * @returns {string}
     */
    formatTick(value) {
        if (this.tickFormat) {
            return this.tickFormat(value);
        }
        
        const date = value instanceof Date ? value : new Date(value);
        const range = this._computedMax - this._computedMin;
        
        // Auto-format based on range
        const day = 24 * 60 * 60 * 1000;
        const year = 365 * day;
        
        if (range > year * 2) {
            // Show years
            return date.getFullYear().toString();
        } else if (range > day * 60) {
            // Show months
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[date.getMonth()];
        } else if (range > day * 2) {
            // Show days
            return `${date.getMonth() + 1}/${date.getDate()}`;
        } else {
            // Show hours
            return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Generate time-appropriate ticks
     * @returns {Array}
     */
    generateTicks() {
        const range = this._computedMax - this._computedMin;
        const ticks = [];
        
        // Generate evenly spaced ticks
        const step = range / (this.tickCount - 1);
        
        for (let i = 0; i < this.tickCount; i++) {
            const value = this._computedMin + i * step;
            ticks.push({
                value,
                label: this.formatTick(value)
            });
        }
        
        return ticks;
    }
}

// ==========================================
// LOGARITHMIC AXIS
// ==========================================

/**
 * Logarithmic scale axis
 */
export class LogAxis extends YAxis {
    /**
     * @param {object} options - Axis options
     */
    constructor(options = {}) {
        super({
            ...options,
            type: 'log'
        });
        
        this.base = options.base ?? 10;
    }
    
    /**
     * Set range with log scale
     */
    setRange(min, max) {
        // Ensure positive values for log scale
        this._computedMin = Math.max(min, 0.001);
        this._computedMax = Math.max(max, this._computedMin * 10);
        this._ticks = this.generateTicks();
    }
    
    /**
     * Scale value with log
     */
    scale(value) {
        if (value <= 0) return 0;
        
        const logMin = Math.log(this._computedMin) / Math.log(this.base);
        const logMax = Math.log(this._computedMax) / Math.log(this.base);
        const logValue = Math.log(value) / Math.log(this.base);
        
        let normalized = (logValue - logMin) / (logMax - logMin);
        
        if (this.reverse) {
            normalized = 1 - normalized;
        }
        
        return Math.max(0, Math.min(1, normalized));
    }
    
    /**
     * Inverse log scale
     */
    invert(normalized) {
        if (this.reverse) {
            normalized = 1 - normalized;
        }
        
        const logMin = Math.log(this._computedMin) / Math.log(this.base);
        const logMax = Math.log(this._computedMax) / Math.log(this.base);
        
        return Math.pow(this.base, logMin + normalized * (logMax - logMin));
    }
    
    /**
     * Generate logarithmic ticks
     */
    generateTicks() {
        const ticks = [];
        const logMin = Math.floor(Math.log(this._computedMin) / Math.log(this.base));
        const logMax = Math.ceil(Math.log(this._computedMax) / Math.log(this.base));
        
        for (let i = logMin; i <= logMax; i++) {
            const value = Math.pow(this.base, i);
            if (value >= this._computedMin && value <= this._computedMax) {
                ticks.push({
                    value,
                    label: formatNumber(value)
                });
            }
        }
        
        return ticks;
    }
}

// ==========================================
// AXIS FACTORY
// ==========================================

/**
 * Create axis from configuration
 * @param {string} axisType - 'x' or 'y'
 * @param {object} options - Axis options
 * @returns {Axis}
 */
export function createAxis(axisType, options = {}) {
    const type = options.type ?? 'linear';
    
    if (axisType === 'x') {
        switch (type) {
            case 'category':
                return new CategoryAxis(options.categories ?? [], options);
            case 'time':
                return new TimeAxis(options);
            default:
                return new XAxis(options);
        }
    } else {
        switch (type) {
            case 'log':
                return new LogAxis(options);
            default:
                return new YAxis(options);
        }
    }
}
