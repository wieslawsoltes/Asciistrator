/**
 * Asciistrator - Chart Legend & Tooltip
 * 
 * Legend and tooltip components for charts.
 */

import { EventEmitter } from '../utils/events.js';

// ==========================================
// LEGEND
// ==========================================

/**
 * Legend positions
 */
export const LegendPosition = {
    TOP: 'top',
    BOTTOM: 'bottom',
    LEFT: 'left',
    RIGHT: 'right',
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_RIGHT: 'bottom-right',
    NONE: 'none'
};

/**
 * Legend item
 */
export class LegendItem {
    /**
     * @param {string} label - Item label
     * @param {string} char - Display character/symbol
     * @param {boolean} visible - Whether series is visible
     */
    constructor(label, char, visible = true) {
        this.label = label;
        this.char = char;
        this.visible = visible;
        this.enabled = true;
    }
    
    /**
     * Toggle visibility
     */
    toggle() {
        this.visible = !this.visible;
    }
    
    /**
     * Get display string
     * @returns {string}
     */
    toString() {
        const visChar = this.visible ? this.char : '○';
        return `${visChar} ${this.label}`;
    }
}

/**
 * Chart legend component
 */
export class Legend extends EventEmitter {
    /**
     * @param {object} options - Legend options
     */
    constructor(options = {}) {
        super();
        
        this.show = options.show ?? true;
        this.position = options.position ?? LegendPosition.RIGHT;
        this.items = [];
        
        // Style options
        this.style = {
            padding: options.padding ?? 1,
            itemSpacing: options.itemSpacing ?? 1,
            symbolWidth: options.symbolWidth ?? 1,
            maxWidth: options.maxWidth ?? 20,
            maxHeight: options.maxHeight ?? 10,
            borderChar: options.borderChar ?? null,
            ...options.style
        };
        
        // Interactive
        this.interactive = options.interactive ?? true;
        this.selectedIndex = -1;
    }
    
    /**
     * Set items from chart series
     * @param {Array} series - Data series array
     */
    setFromSeries(series) {
        this.items = series.map(s => new LegendItem(
            s.name,
            s.style.char ?? '█',
            s.visible
        ));
        
        this.emit('update', { legend: this });
    }
    
    /**
     * Add an item
     * @param {string} label - Item label
     * @param {string} char - Symbol character
     * @param {boolean} visible - Visibility
     * @returns {LegendItem}
     */
    addItem(label, char, visible = true) {
        const item = new LegendItem(label, char, visible);
        this.items.push(item);
        this.emit('update', { legend: this });
        return item;
    }
    
    /**
     * Remove an item
     * @param {number} index - Item index
     */
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            this.emit('update', { legend: this });
        }
    }
    
    /**
     * Clear all items
     */
    clear() {
        this.items = [];
        this.emit('update', { legend: this });
    }
    
    /**
     * Toggle item visibility
     * @param {number} index - Item index
     */
    toggleItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items[index].toggle();
            this.emit('toggle', { legend: this, index, item: this.items[index] });
        }
    }
    
    /**
     * Calculate legend dimensions
     * @returns {object} { width, height }
     */
    getDimensions() {
        if (!this.show || this.items.length === 0) {
            return { width: 0, height: 0 };
        }
        
        const isHorizontal = this.position === LegendPosition.TOP || 
                            this.position === LegendPosition.BOTTOM;
        
        if (isHorizontal) {
            // Horizontal layout
            let width = this.style.padding * 2;
            for (let i = 0; i < this.items.length; i++) {
                width += this.items[i].toString().length;
                if (i < this.items.length - 1) {
                    width += this.style.itemSpacing + 1; // +1 for separator
                }
            }
            return {
                width: Math.min(width, this.style.maxWidth),
                height: 1 + this.style.padding * 2
            };
        } else {
            // Vertical layout
            let maxWidth = 0;
            for (const item of this.items) {
                const len = item.toString().length;
                if (len > maxWidth) maxWidth = len;
            }
            return {
                width: Math.min(maxWidth + this.style.padding * 2, this.style.maxWidth),
                height: Math.min(this.items.length + this.style.padding * 2, this.style.maxHeight)
            };
        }
    }
    
    /**
     * Render legend to buffer
     * @param {AsciiBuffer} buffer - Target buffer
     * @param {object} area - { x, y, width, height } available area
     */
    render(buffer, area) {
        if (!this.show || this.items.length === 0) return;
        
        const dims = this.getDimensions();
        let startX, startY;
        
        // Calculate position based on legend position
        switch (this.position) {
            case LegendPosition.TOP:
                startX = area.x + Math.floor((area.width - dims.width) / 2);
                startY = area.y;
                break;
            case LegendPosition.BOTTOM:
                startX = area.x + Math.floor((area.width - dims.width) / 2);
                startY = area.y + area.height - dims.height;
                break;
            case LegendPosition.LEFT:
                startX = area.x;
                startY = area.y + Math.floor((area.height - dims.height) / 2);
                break;
            case LegendPosition.RIGHT:
                startX = area.x + area.width - dims.width;
                startY = area.y + Math.floor((area.height - dims.height) / 2);
                break;
            case LegendPosition.TOP_LEFT:
                startX = area.x;
                startY = area.y;
                break;
            case LegendPosition.TOP_RIGHT:
                startX = area.x + area.width - dims.width;
                startY = area.y;
                break;
            case LegendPosition.BOTTOM_LEFT:
                startX = area.x;
                startY = area.y + area.height - dims.height;
                break;
            case LegendPosition.BOTTOM_RIGHT:
                startX = area.x + area.width - dims.width;
                startY = area.y + area.height - dims.height;
                break;
            default:
                return;
        }
        
        // Draw border if specified
        if (this.style.borderChar) {
            this.renderBorder(buffer, startX, startY, dims.width, dims.height);
        }
        
        // Render items
        const isHorizontal = this.position === LegendPosition.TOP || 
                            this.position === LegendPosition.BOTTOM;
        
        let x = startX + this.style.padding;
        let y = startY + this.style.padding;
        
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const text = item.toString();
            
            // Check if selected for highlight
            const highlight = i === this.selectedIndex;
            
            if (isHorizontal) {
                // Horizontal layout
                for (let j = 0; j < text.length && x + j < buffer.width; j++) {
                    buffer.setChar(x + j, y, text[j]);
                }
                x += text.length + this.style.itemSpacing + 1;
                
                // Draw separator
                if (i < this.items.length - 1 && x - 1 < buffer.width) {
                    buffer.setChar(x - this.style.itemSpacing - 1, y, '│');
                }
            } else {
                // Vertical layout
                for (let j = 0; j < text.length && x + j < buffer.width; j++) {
                    buffer.setChar(x + j, y, text[j]);
                }
                y++;
            }
        }
    }
    
    /**
     * Render border
     * @param {AsciiBuffer} buffer - Target buffer
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     */
    renderBorder(buffer, x, y, width, height) {
        const bc = this.style.borderChar;
        
        // Top and bottom
        for (let i = 1; i < width - 1; i++) {
            buffer.setChar(x + i, y, '─');
            buffer.setChar(x + i, y + height - 1, '─');
        }
        
        // Left and right
        for (let i = 1; i < height - 1; i++) {
            buffer.setChar(x, y + i, '│');
            buffer.setChar(x + width - 1, y + i, '│');
        }
        
        // Corners
        buffer.setChar(x, y, '┌');
        buffer.setChar(x + width - 1, y, '┐');
        buffer.setChar(x, y + height - 1, '└');
        buffer.setChar(x + width - 1, y + height - 1, '┘');
    }
    
    /**
     * Hit test for interaction
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {object} area - Legend area
     * @returns {number} Item index or -1
     */
    hitTest(x, y, area) {
        if (!this.interactive || !this.show) return -1;
        
        // Check bounds
        const dims = this.getDimensions();
        // ... implement hit testing based on position
        
        return -1;
    }
}

// ==========================================
// TOOLTIP
// ==========================================

/**
 * Tooltip component for showing data point information
 */
export class Tooltip extends EventEmitter {
    /**
     * @param {object} options - Tooltip options
     */
    constructor(options = {}) {
        super();
        
        this.show = options.show ?? true;
        this.visible = false;
        this.x = 0;
        this.y = 0;
        
        // Content
        this.title = '';
        this.content = [];
        
        // Style
        this.style = {
            padding: options.padding ?? 1,
            borderChar: options.borderChar ?? '│',
            cornerChars: options.cornerChars ?? ['┌', '┐', '└', '┘'],
            maxWidth: options.maxWidth ?? 30,
            offset: options.offset ?? { x: 2, y: 1 },
            ...options.style
        };
        
        // Format function
        this.format = options.format ?? null;
    }
    
    /**
     * Show tooltip at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {object} data - Data to display
     */
    showAt(x, y, data) {
        if (!this.show) return;
        
        this.x = x + this.style.offset.x;
        this.y = y + this.style.offset.y;
        this.visible = true;
        
        // Format content
        if (this.format) {
            const result = this.format(data);
            if (typeof result === 'string') {
                this.title = '';
                this.content = [result];
            } else {
                this.title = result.title ?? '';
                this.content = result.content ?? [result.toString()];
            }
        } else {
            this.formatDefault(data);
        }
        
        this.emit('show', { tooltip: this, x, y, data });
    }
    
    /**
     * Hide tooltip
     */
    hide() {
        if (this.visible) {
            this.visible = false;
            this.emit('hide', { tooltip: this });
        }
    }
    
    /**
     * Default formatting
     * @param {object} data - Data object
     */
    formatDefault(data) {
        this.title = data.series?.name ?? '';
        this.content = [];
        
        if (data.point) {
            const p = data.point;
            if (p.label) {
                this.content.push(p.label);
            }
            this.content.push(`X: ${p.x}`);
            this.content.push(`Y: ${p.y}`);
        } else if (data.value !== undefined) {
            this.content.push(`Value: ${data.value}`);
        }
        
        if (data.percentage !== undefined) {
            this.content.push(`${data.percentage.toFixed(1)}%`);
        }
    }
    
    /**
     * Get tooltip dimensions
     * @returns {object} { width, height }
     */
    getDimensions() {
        if (!this.visible) return { width: 0, height: 0 };
        
        let maxWidth = this.title.length;
        for (const line of this.content) {
            if (line.length > maxWidth) maxWidth = line.length;
        }
        
        return {
            width: Math.min(maxWidth + this.style.padding * 2 + 2, this.style.maxWidth),
            height: (this.title ? 1 : 0) + this.content.length + this.style.padding * 2 + 2
        };
    }
    
    /**
     * Render tooltip to buffer
     * @param {AsciiBuffer} buffer - Target buffer
     */
    render(buffer) {
        if (!this.visible || !this.show) return;
        
        const dims = this.getDimensions();
        let x = this.x;
        let y = this.y;
        
        // Adjust position to stay within buffer
        if (x + dims.width > buffer.width) {
            x = buffer.width - dims.width;
        }
        if (y + dims.height > buffer.height) {
            y = buffer.height - dims.height;
        }
        x = Math.max(0, x);
        y = Math.max(0, y);
        
        // Draw border
        const [tl, tr, bl, br] = this.style.cornerChars;
        
        // Top border
        buffer.setChar(x, y, tl);
        for (let i = 1; i < dims.width - 1; i++) {
            buffer.setChar(x + i, y, '─');
        }
        buffer.setChar(x + dims.width - 1, y, tr);
        
        // Bottom border
        buffer.setChar(x, y + dims.height - 1, bl);
        for (let i = 1; i < dims.width - 1; i++) {
            buffer.setChar(x + i, y + dims.height - 1, '─');
        }
        buffer.setChar(x + dims.width - 1, y + dims.height - 1, br);
        
        // Side borders and background
        for (let i = 1; i < dims.height - 1; i++) {
            buffer.setChar(x, y + i, '│');
            for (let j = 1; j < dims.width - 1; j++) {
                buffer.setChar(x + j, y + i, ' ');
            }
            buffer.setChar(x + dims.width - 1, y + i, '│');
        }
        
        // Draw content
        let lineY = y + 1 + this.style.padding;
        const contentX = x + 1 + this.style.padding;
        
        // Title
        if (this.title) {
            for (let i = 0; i < this.title.length; i++) {
                buffer.setChar(contentX + i, lineY, this.title[i]);
            }
            lineY++;
            
            // Separator
            for (let i = 1; i < dims.width - 1; i++) {
                buffer.setChar(x + i, lineY, '─');
            }
            lineY++;
        }
        
        // Content lines
        for (const line of this.content) {
            for (let i = 0; i < line.length && contentX + i < x + dims.width - 1; i++) {
                buffer.setChar(contentX + i, lineY, line[i]);
            }
            lineY++;
        }
    }
}

// ==========================================
// CROSSHAIR
// ==========================================

/**
 * Crosshair overlay for chart interaction
 */
export class Crosshair extends EventEmitter {
    /**
     * @param {object} options - Crosshair options
     */
    constructor(options = {}) {
        super();
        
        this.show = options.show ?? true;
        this.visible = false;
        this.x = 0;
        this.y = 0;
        
        // Style
        this.style = {
            horizontalChar: options.horizontalChar ?? '┄',
            verticalChar: options.verticalChar ?? '┆',
            intersectChar: options.intersectChar ?? '┼',
            showLabels: options.showLabels ?? true,
            ...options.style
        };
    }
    
    /**
     * Set crosshair position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.visible = true;
        this.emit('move', { crosshair: this, x, y });
    }
    
    /**
     * Hide crosshair
     */
    hide() {
        this.visible = false;
        this.emit('hide', { crosshair: this });
    }
    
    /**
     * Render crosshair to buffer
     * @param {AsciiBuffer} buffer - Target buffer
     * @param {object} plotArea - Plot area dimensions
     */
    render(buffer, plotArea) {
        if (!this.visible || !this.show) return;
        
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        
        // Check bounds
        if (x < plotArea.x || x >= plotArea.x + plotArea.width ||
            y < plotArea.y || y >= plotArea.y + plotArea.height) {
            return;
        }
        
        // Draw horizontal line
        for (let i = plotArea.x; i < plotArea.x + plotArea.width; i++) {
            if (i !== x) {
                const current = buffer.getChar(i, y);
                if (current === ' ' || current === '·') {
                    buffer.setChar(i, y, this.style.horizontalChar);
                }
            }
        }
        
        // Draw vertical line
        for (let i = plotArea.y; i < plotArea.y + plotArea.height; i++) {
            if (i !== y) {
                const current = buffer.getChar(x, i);
                if (current === ' ' || current === '·') {
                    buffer.setChar(x, i, this.style.verticalChar);
                }
            }
        }
        
        // Draw intersection
        buffer.setChar(x, y, this.style.intersectChar);
    }
}

// ==========================================
// ANNOTATION
// ==========================================

/**
 * Chart annotation for labels and markers
 */
export class Annotation extends EventEmitter {
    /**
     * @param {object} options - Annotation options
     */
    constructor(options = {}) {
        super();
        
        this.type = options.type ?? 'label'; // 'label', 'line', 'region'
        this.x = options.x ?? 0;
        this.y = options.y ?? 0;
        this.text = options.text ?? '';
        
        // For lines
        this.x2 = options.x2 ?? this.x;
        this.y2 = options.y2 ?? this.y;
        
        // For regions
        this.width = options.width ?? 0;
        this.height = options.height ?? 0;
        
        // Style
        this.style = {
            char: options.char ?? '*',
            lineChar: options.lineChar ?? '─',
            fillChar: options.fillChar ?? '░',
            ...options.style
        };
        
        // Data coordinates vs plot coordinates
        this.useDataCoords = options.useDataCoords ?? true;
        
        this.visible = options.visible ?? true;
    }
    
    /**
     * Render annotation
     * @param {AsciiBuffer} buffer - Target buffer
     * @param {Chart} chart - Parent chart for coordinate conversion
     */
    render(buffer, chart) {
        if (!this.visible) return;
        
        let x = this.x;
        let y = this.y;
        
        // Convert from data to plot coordinates if needed
        if (this.useDataCoords && chart) {
            const pos = chart.dataToPlot(this.x, this.y);
            x = Math.round(pos.x);
            y = Math.round(pos.y);
        }
        
        switch (this.type) {
            case 'label':
                this.renderLabel(buffer, x, y);
                break;
            case 'line':
                this.renderLine(buffer, x, y, chart);
                break;
            case 'region':
                this.renderRegion(buffer, x, y, chart);
                break;
            case 'marker':
                buffer.setChar(x, y, this.style.char);
                break;
        }
    }
    
    /**
     * Render label annotation
     */
    renderLabel(buffer, x, y) {
        for (let i = 0; i < this.text.length; i++) {
            if (x + i >= 0 && x + i < buffer.width) {
                buffer.setChar(x + i, y, this.text[i]);
            }
        }
    }
    
    /**
     * Render line annotation
     */
    renderLine(buffer, x, y, chart) {
        let x2 = this.x2;
        let y2 = this.y2;
        
        if (this.useDataCoords && chart) {
            const pos = chart.dataToPlot(this.x2, this.y2);
            x2 = Math.round(pos.x);
            y2 = Math.round(pos.y);
        }
        
        // Simple horizontal/vertical line
        if (y === y2) {
            // Horizontal
            const startX = Math.min(x, x2);
            const endX = Math.max(x, x2);
            for (let i = startX; i <= endX; i++) {
                buffer.setChar(i, y, this.style.lineChar);
            }
        } else if (x === x2) {
            // Vertical
            const startY = Math.min(y, y2);
            const endY = Math.max(y, y2);
            for (let i = startY; i <= endY; i++) {
                buffer.setChar(x, i, '│');
            }
        }
    }
    
    /**
     * Render region annotation
     */
    renderRegion(buffer, x, y, chart) {
        let width = this.width;
        let height = this.height;
        
        if (this.useDataCoords && chart) {
            // Calculate dimensions in plot coordinates
            const pos2 = chart.dataToPlot(this.x + this.width, this.y - this.height);
            width = Math.round(pos2.x - x);
            height = Math.round(pos2.y - y);
        }
        
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const px = x + dx;
                const py = y + dy;
                if (px >= 0 && px < buffer.width && py >= 0 && py < buffer.height) {
                    buffer.setChar(px, py, this.style.fillChar);
                }
            }
        }
    }
}
