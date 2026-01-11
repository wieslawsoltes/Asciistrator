/**
 * Asciistrator - Pie Chart
 * 
 * Pie and donut charts with labels and percentages.
 */

import { Chart, ChartChars, formatNumber } from './base.js';

// ==========================================
// PIE CHART CONSTANTS
// ==========================================

/**
 * ASCII characters for pie slices (by angle range)
 * Uses different characters to represent different portions
 */
export const PieChars = {
    // Quarter segments using block elements
    quarters: ['▁', '▃', '▅', '█'],
    
    // Circle segments
    segments: ['◔', '◑', '◕', '●'],
    
    // Block fills for slices
    fills: ['█', '▓', '▒', '░', '▪', '▫', '●', '○'],
    
    // Border chars for text-based rendering
    border: {
        top: '─',
        bottom: '─',
        left: '│',
        right: '│',
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯'
    }
};

/**
 * Label positions
 */
export const LabelPosition = {
    INSIDE: 'inside',
    OUTSIDE: 'outside',
    NONE: 'none'
};

// ==========================================
// PIE CHART
// ==========================================

/**
 * Pie chart implementation
 */
export class PieChart extends Chart {
    /**
     * @param {object} options - Chart options
     */
    constructor(options = {}) {
        super(options);
        
        // Pie-specific options
        this.innerRadius = options.innerRadius ?? 0; // 0 = pie, >0 = donut
        this.startAngle = options.startAngle ?? -90; // Start from top
        this.clockwise = options.clockwise ?? true;
        
        // Styling
        this.pieStyle = {
            chars: options.pieChars ?? PieChars.fills,
            showPercentage: options.showPercentage ?? true,
            showValue: options.showValue ?? false,
            showLabel: options.showLabel ?? true,
            labelPosition: options.labelPosition ?? LabelPosition.OUTSIDE,
            minSlicePercent: options.minSlicePercent ?? 2, // Minimum % to show
            ...options.pieStyle
        };
        
        // Explode effect (offset slices)
        this.explode = options.explode ?? null; // Array of slice indices or 'all'
        this.explodeOffset = options.explodeOffset ?? 1;
        
        // No axes for pie chart
        this.showAxes = false;
    }
    
    get type() {
        return 'pie';
    }
    
    /**
     * Get total value of all slices
     * @returns {number}
     */
    getTotal() {
        let total = 0;
        for (const series of this.series) {
            if (!series.visible) continue;
            for (const point of series.data) {
                total += point.y;
            }
        }
        return total;
    }
    
    /**
     * Get all slices with computed values
     * @returns {Array}
     */
    getSlices() {
        const total = this.getTotal();
        const slices = [];
        let sliceIndex = 0;
        
        for (const series of this.series) {
            if (!series.visible) continue;
            
            for (let i = 0; i < series.data.length; i++) {
                const point = series.data[i];
                const percentage = total > 0 ? (point.y / total) * 100 : 0;
                
                slices.push({
                    value: point.y,
                    percentage,
                    label: point.label ?? this.labels[sliceIndex] ?? `Slice ${sliceIndex + 1}`,
                    char: point.char ?? series.style.char ?? this.palette[sliceIndex % this.palette.length],
                    series,
                    index: sliceIndex,
                    dataIndex: i
                });
                
                sliceIndex++;
            }
        }
        
        return slices;
    }
    
    /**
     * Calculate pie dimensions
     * @returns {object} { centerX, centerY, radius }
     */
    getPieDimensions() {
        const plot = this.getPlotArea();
        
        // Account for labels on the side
        const labelSpace = this.pieStyle.labelPosition === LabelPosition.OUTSIDE ? 15 : 0;
        
        const availableWidth = plot.width - labelSpace;
        const availableHeight = plot.height;
        
        // ASCII characters are typically taller than wide, adjust aspect ratio
        const aspectRatio = 2; // Typical terminal character aspect ratio
        
        const maxRadiusX = Math.floor(availableWidth / 2);
        const maxRadiusY = Math.floor(availableHeight / 2);
        
        // Use smaller of adjusted radii
        const radius = Math.min(maxRadiusX / aspectRatio, maxRadiusY);
        
        return {
            centerX: plot.x + Math.floor(availableWidth / 2),
            centerY: plot.y + Math.floor(plot.height / 2),
            radius: Math.max(3, Math.floor(radius)),
            aspectRatio
        };
    }
    
    /**
     * Render chart content
     * @param {AsciiBuffer} buffer - Target buffer
     */
    renderChart(buffer) {
        const dims = this.getPieDimensions();
        const slices = this.getSlices();
        
        if (slices.length === 0) return;
        
        // Render pie using text-based approach
        this.renderTextPie(buffer, dims, slices);
        
        // Render labels
        if (this.pieStyle.labelPosition === LabelPosition.OUTSIDE) {
            this.renderOutsideLabels(buffer, dims, slices);
        }
    }
    
    /**
     * Render pie chart using text characters
     */
    renderTextPie(buffer, dims, slices) {
        const { centerX, centerY, radius, aspectRatio } = dims;
        
        // Pre-calculate slice angles
        let currentAngle = this.startAngle;
        const sliceAngles = slices.map(slice => {
            const angle = (slice.percentage / 100) * 360;
            const start = currentAngle;
            currentAngle += this.clockwise ? angle : -angle;
            return { start, end: currentAngle, slice };
        });
        
        // Draw filled pie using concentric approach
        for (let r = radius; r >= (this.innerRadius * radius / 100); r--) {
            for (let angle = 0; angle < 360; angle += 5) {
                const radians = (angle + this.startAngle) * Math.PI / 180;
                
                // Calculate position with aspect ratio correction
                const x = Math.round(centerX + r * aspectRatio * Math.cos(radians));
                const y = Math.round(centerY + r * Math.sin(radians));
                
                if (x >= 0 && x < buffer.width && y >= 0 && y < buffer.height) {
                    // Find which slice this angle belongs to
                    const slice = this.getSliceAtAngle(angle + this.startAngle, sliceAngles);
                    if (slice) {
                        buffer.setChar(x, y, slice.slice.char);
                    }
                }
            }
        }
        
        // Draw border
        this.renderPieBorder(buffer, dims);
        
        // Draw inner circle for donut
        if (this.innerRadius > 0) {
            this.renderDonutHole(buffer, dims);
        }
    }
    
    /**
     * Get slice at given angle
     */
    getSliceAtAngle(angle, sliceAngles) {
        // Normalize angle to 0-360
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        
        for (const { start, end, slice } of sliceAngles) {
            let normalizedStart = start;
            let normalizedEnd = end;
            
            // Normalize angles
            while (normalizedStart < 0) normalizedStart += 360;
            while (normalizedEnd < 0) normalizedEnd += 360;
            
            if (this.clockwise) {
                if (normalizedEnd < normalizedStart) {
                    // Crosses 0/360
                    if (angle >= normalizedStart || angle < normalizedEnd) {
                        return { start, end, slice };
                    }
                } else {
                    if (angle >= normalizedStart && angle < normalizedEnd) {
                        return { start, end, slice };
                    }
                }
            }
        }
        
        return sliceAngles[0]; // Default to first slice
    }
    
    /**
     * Render pie border
     */
    renderPieBorder(buffer, dims) {
        const { centerX, centerY, radius, aspectRatio } = dims;
        
        // Draw border using braille or box characters
        for (let angle = 0; angle < 360; angle += 3) {
            const radians = angle * Math.PI / 180;
            const x = Math.round(centerX + radius * aspectRatio * Math.cos(radians));
            const y = Math.round(centerY + radius * Math.sin(radians));
            
            if (x >= 0 && x < buffer.width && y >= 0 && y < buffer.height) {
                // Use different border chars based on angle
                let borderChar = '○';
                if (angle < 45 || angle > 315) borderChar = '─';
                else if (angle < 135) borderChar = '╲';
                else if (angle < 225) borderChar = '─';
                else borderChar = '╱';
                
                // Only draw if empty or lighter
                const current = buffer.getChar(x, y);
                if (current === ' ') {
                    buffer.setChar(x, y, borderChar);
                }
            }
        }
    }
    
    /**
     * Render donut hole
     */
    renderDonutHole(buffer, dims) {
        const { centerX, centerY, radius, aspectRatio } = dims;
        const innerRadius = Math.floor(radius * this.innerRadius / 100);
        
        // Clear inner circle
        for (let r = 0; r < innerRadius; r++) {
            for (let angle = 0; angle < 360; angle += 5) {
                const radians = angle * Math.PI / 180;
                const x = Math.round(centerX + r * aspectRatio * Math.cos(radians));
                const y = Math.round(centerY + r * Math.sin(radians));
                
                if (x >= 0 && x < buffer.width && y >= 0 && y < buffer.height) {
                    buffer.setChar(x, y, ' ');
                }
            }
        }
    }
    
    /**
     * Render labels outside the pie
     */
    renderOutsideLabels(buffer, dims, slices) {
        const { centerX, centerY, radius, aspectRatio } = dims;
        const labelX = centerX + Math.floor(radius * aspectRatio) + 3;
        let labelY = Math.max(1, centerY - Math.floor(slices.length / 2));
        
        for (const slice of slices) {
            if (slice.percentage < this.pieStyle.minSlicePercent) continue;
            
            // Build label text
            let labelText = `${slice.char} `;
            
            if (this.pieStyle.showLabel) {
                labelText += slice.label;
            }
            
            if (this.pieStyle.showPercentage) {
                labelText += ` ${slice.percentage.toFixed(1)}%`;
            }
            
            if (this.pieStyle.showValue) {
                labelText += ` (${formatNumber(slice.value)})`;
            }
            
            // Draw label
            for (let i = 0; i < labelText.length && labelX + i < buffer.width; i++) {
                buffer.setChar(labelX + i, labelY, labelText[i]);
            }
            
            labelY++;
        }
    }
    
    /**
     * Hit test for slice interaction
     */
    hitTest(x, y) {
        const dims = this.getPieDimensions();
        const { centerX, centerY, radius, aspectRatio } = dims;
        
        // Calculate distance from center
        const dx = (x - centerX) / aspectRatio;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if within pie
        const innerRadius = radius * this.innerRadius / 100;
        if (distance > radius || distance < innerRadius) {
            return null;
        }
        
        // Calculate angle
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        angle -= this.startAngle;
        while (angle < 0) angle += 360;
        
        // Find slice
        const slices = this.getSlices();
        let currentAngle = 0;
        
        for (const slice of slices) {
            const sliceAngle = (slice.percentage / 100) * 360;
            
            if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
                return {
                    slice,
                    sliceIndex: slice.index,
                    percentage: slice.percentage,
                    value: slice.value,
                    label: slice.label
                };
            }
            
            currentAngle += sliceAngle;
        }
        
        return null;
    }
}

// ==========================================
// DONUT CHART
// ==========================================

/**
 * Donut chart (pie with hole)
 */
export class DonutChart extends PieChart {
    /**
     * @param {object} options - Chart options
     */
    constructor(options = {}) {
        super({
            ...options,
            innerRadius: options.innerRadius ?? 50 // 50% inner radius by default
        });
        
        // Center label
        this.centerLabel = {
            show: options.showCenterLabel ?? true,
            text: options.centerText ?? null,
            showTotal: options.showTotal ?? true,
            ...options.centerLabel
        };
    }
    
    get type() {
        return 'donut';
    }
    
    /**
     * Render chart content
     */
    renderChart(buffer) {
        super.renderChart(buffer);
        
        // Render center label
        if (this.centerLabel.show) {
            this.renderCenterLabel(buffer);
        }
    }
    
    /**
     * Render center label
     */
    renderCenterLabel(buffer) {
        const dims = this.getPieDimensions();
        const { centerX, centerY } = dims;
        
        let text;
        if (this.centerLabel.text) {
            text = this.centerLabel.text;
        } else if (this.centerLabel.showTotal) {
            text = formatNumber(this.getTotal());
        } else {
            return;
        }
        
        const labelX = centerX - Math.floor(text.length / 2);
        
        for (let i = 0; i < text.length; i++) {
            buffer.setChar(labelX + i, centerY, text[i]);
        }
    }
}

// ==========================================
// SEMI-CIRCLE CHART
// ==========================================

/**
 * Half-pie / gauge style chart
 */
export class GaugeChart extends PieChart {
    /**
     * @param {object} options - Chart options
     */
    constructor(options = {}) {
        super({
            ...options,
            startAngle: options.startAngle ?? -180,
            innerRadius: options.innerRadius ?? 60
        });
        
        // Gauge-specific
        this.value = options.value ?? 0;
        this.minValue = options.minValue ?? 0;
        this.maxValue = options.maxValue ?? 100;
        this.gaugeStyle = {
            showNeedle: options.showNeedle ?? true,
            needleChar: options.needleChar ?? '▲',
            showTicks: options.showTicks ?? true,
            zones: options.zones ?? [], // [{ min, max, char }]
            ...options.gaugeStyle
        };
    }
    
    get type() {
        return 'gauge';
    }
    
    /**
     * Set gauge value
     * @param {number} value - New value
     */
    setValue(value) {
        this.value = Math.max(this.minValue, Math.min(this.maxValue, value));
        this.dirty = true;
    }
    
    /**
     * Get value as percentage
     * @returns {number}
     */
    getPercentage() {
        const range = this.maxValue - this.minValue;
        return range > 0 ? ((this.value - this.minValue) / range) * 100 : 0;
    }
    
    /**
     * Render gauge
     */
    renderChart(buffer) {
        const dims = this.getPieDimensions();
        
        // Render background arc
        this.renderGaugeArc(buffer, dims);
        
        // Render needle/indicator
        if (this.gaugeStyle.showNeedle) {
            this.renderNeedle(buffer, dims);
        }
        
        // Render value text
        this.renderGaugeValue(buffer, dims);
    }
    
    /**
     * Render gauge arc
     */
    renderGaugeArc(buffer, dims) {
        const { centerX, centerY, radius, aspectRatio } = dims;
        
        // Draw 180-degree arc
        for (let angle = -180; angle <= 0; angle += 3) {
            const radians = angle * Math.PI / 180;
            
            for (let r = radius; r >= radius * this.innerRadius / 100; r--) {
                const x = Math.round(centerX + r * aspectRatio * Math.cos(radians));
                const y = Math.round(centerY + r * Math.sin(radians));
                
                if (x >= 0 && x < buffer.width && y >= 0 && y < buffer.height) {
                    // Determine char based on zones or percentage
                    let char = '░';
                    const percentage = ((angle + 180) / 180) * 100;
                    
                    // Check zones
                    for (const zone of this.gaugeStyle.zones) {
                        if (percentage >= zone.min && percentage <= zone.max) {
                            char = zone.char;
                            break;
                        }
                    }
                    
                    // Fill based on current value
                    if (percentage <= this.getPercentage()) {
                        char = '█';
                    }
                    
                    buffer.setChar(x, y, char);
                }
            }
        }
    }
    
    /**
     * Render needle indicator
     */
    renderNeedle(buffer, dims) {
        const { centerX, centerY, radius, aspectRatio } = dims;
        const percentage = this.getPercentage();
        const angle = -180 + (percentage / 100) * 180;
        const radians = angle * Math.PI / 180;
        
        // Draw needle line
        for (let r = 0; r <= radius * 0.9; r++) {
            const x = Math.round(centerX + r * aspectRatio * Math.cos(radians));
            const y = Math.round(centerY + r * Math.sin(radians));
            
            if (x >= 0 && x < buffer.width && y >= 0 && y < buffer.height) {
                buffer.setChar(x, y, this.gaugeStyle.needleChar);
            }
        }
    }
    
    /**
     * Render gauge value
     */
    renderGaugeValue(buffer, dims) {
        const { centerX, centerY } = dims;
        const text = formatNumber(this.value);
        const labelX = centerX - Math.floor(text.length / 2);
        
        for (let i = 0; i < text.length; i++) {
            buffer.setChar(labelX + i, centerY + 2, text[i]);
        }
    }
}

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Create a pie chart
 * @param {object} options - Chart options
 * @returns {PieChart}
 */
export function createPieChart(options = {}) {
    return new PieChart(options);
}

/**
 * Create a donut chart
 * @param {object} options - Chart options
 * @returns {DonutChart}
 */
export function createDonutChart(options = {}) {
    return new DonutChart(options);
}

/**
 * Create a gauge chart
 * @param {object} options - Chart options
 * @returns {GaugeChart}
 */
export function createGaugeChart(options = {}) {
    return new GaugeChart(options);
}
