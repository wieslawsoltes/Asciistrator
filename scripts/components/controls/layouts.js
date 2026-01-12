/**
 * Asciistrator - Layout Controls
 * 
 * Layout panel UI components: Grid, StackPanel, DockPanel, etc.
 * 
 * @version 1.0.0
 */

import UIComponent, { 
    ContentModel, 
    UICategory, 
    BorderStyle, 
    ASCIIRenderer 
} from '../UIComponent.js';
import { 
    PropertyDefinition, 
    PropertyType, 
    PropertyCategory,
    CommonProperties,
    EventDefinition
} from '../PropertySystem.js';

// ==========================================
// GRID
// ==========================================

/**
 * Grid layout panel
 */
export class Grid extends UIComponent {
    static get componentType() { return 'Grid'; }
    static get displayName() { return 'Grid'; }
    static get description() { return 'A flexible grid layout panel'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '▦'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 20; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'columnDefinitions',
                displayName: 'Column Definitions',
                type: PropertyType.String,
                defaultValue: '*,*,*',
                description: 'Column width definitions (e.g., "Auto,*,100")',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'rowDefinitions',
                displayName: 'Row Definitions',
                type: PropertyType.String,
                defaultValue: '*,*,*',
                description: 'Row height definitions (e.g., "Auto,*,100")',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'showGridLines',
                displayName: 'Show Grid Lines',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to show grid lines (debug)',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    // Attached properties for children
    static get attachedProperties() {
        return [
            new PropertyDefinition({
                name: 'Grid.Row',
                displayName: 'Grid Row',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Row position in grid',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'Grid.Column',
                displayName: 'Grid Column',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Column position in grid',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'Grid.RowSpan',
                displayName: 'Grid Row Span',
                type: PropertyType.Integer,
                defaultValue: 1,
                description: 'Number of rows to span',
                category: PropertyCategory.Layout,
                minValue: 1
            }),
            new PropertyDefinition({
                name: 'Grid.ColumnSpan',
                displayName: 'Grid Column Span',
                type: PropertyType.Integer,
                defaultValue: 1,
                description: 'Number of columns to span',
                category: PropertyCategory.Layout,
                minValue: 1
            })
        ];
    }
    
    static get tags() {
        return ['grid', 'layout', 'panel', 'table', 'cells'];
    }
    
    _parseDefinitions(defString) {
        if (!defString) return ['*'];
        return defString.split(',').map(d => d.trim());
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const colDefs = this._parseDefinitions(this.get('columnDefinitions'));
        const rowDefs = this._parseDefinitions(this.get('rowDefinitions'));
        const showGridLines = this.get('showGridLines');
        
        const numCols = colDefs.length;
        const numRows = rowDefs.length;
        
        // Calculate cell sizes (simplified - equal distribution for * columns)
        const cellWidth = Math.floor(width / numCols);
        const cellHeight = Math.floor(height / numRows);
        
        // Draw grid lines if enabled
        if (showGridLines) {
            // Draw vertical lines
            for (let col = 0; col <= numCols; col++) {
                const lineX = x + col * cellWidth;
                if (lineX < x + width) {
                    for (let row = 0; row < height; row++) {
                        buffer[y + row][lineX] = '│';
                    }
                }
            }
            
            // Draw horizontal lines
            for (let row = 0; row <= numRows; row++) {
                const lineY = y + row * cellHeight;
                if (lineY < y + height) {
                    for (let col = 0; col < width; col++) {
                        const existingChar = buffer[lineY][x + col];
                        if (existingChar === '│') {
                            buffer[lineY][x + col] = '┼';
                        } else {
                            buffer[lineY][x + col] = '─';
                        }
                    }
                }
            }
            
            // Fix corners
            buffer[y][x] = '┌';
            buffer[y][x + width - 1] = '┐';
            buffer[y + height - 1][x] = '└';
            buffer[y + height - 1][x + width - 1] = '┘';
        } else {
            // Draw outer border only
            ASCIIRenderer.drawBox(buffer, x, y, width, height, BorderStyle.Single);
        }
        
        // Draw cell indicators
        const centerY = y + Math.floor(height / 2);
        const centerX = x + Math.floor(width / 2);
        const label = `${numCols}×${numRows}`;
        ASCIIRenderer.drawCenteredText(buffer, centerY, label, x, width);
    }
}

// ==========================================
// STACK PANEL
// ==========================================

/**
 * Stacking layout panel
 */
export class StackPanel extends UIComponent {
    static get componentType() { return 'StackPanel'; }
    static get displayName() { return 'Stack Panel'; }
    static get description() { return 'A panel that stacks children vertically or horizontally'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '▤'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Vertical',
                description: 'Direction children are stacked',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'spacing',
                displayName: 'Spacing',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Space between children',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'areHorizontalSnapPointsRegular',
                displayName: 'Regular Horizontal Snap Points',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether horizontal snap points are regular',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'areVerticalSnapPointsRegular',
                displayName: 'Regular Vertical Snap Points',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether vertical snap points are regular',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get tags() {
        return ['stack', 'panel', 'layout', 'vertical', 'horizontal'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const orientation = this.get('orientation') || 'Vertical';
        const spacing = this.get('spacing') || 0;
        
        const style = BorderStyle.Dashed;
        
        // Draw panel frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw orientation indicator
        const centerY = y + Math.floor(height / 2);
        const centerX = x + Math.floor(width / 2);
        
        if (orientation === 'Vertical') {
            // Draw stacked boxes
            const boxHeight = 3;
            const numBoxes = Math.min(3, Math.floor((height - 2) / (boxHeight + spacing)));
            let currentY = y + 1;
            
            for (let i = 0; i < numBoxes && currentY + boxHeight <= y + height - 1; i++) {
                buffer[currentY][x + 2] = '┌';
                for (let j = 3; j < width - 3; j++) {
                    buffer[currentY][x + j] = '─';
                }
                buffer[currentY][x + width - 3] = '┐';
                
                buffer[currentY + 1][x + 2] = '│';
                buffer[currentY + 1][x + width - 3] = '│';
                
                buffer[currentY + 2][x + 2] = '└';
                for (let j = 3; j < width - 3; j++) {
                    buffer[currentY + 2][x + j] = '─';
                }
                buffer[currentY + 2][x + width - 3] = '┘';
                
                currentY += boxHeight + spacing;
            }
            
            // Draw arrow
            buffer[y][centerX] = '▼';
        } else {
            // Draw horizontal stacked boxes
            const boxWidth = 6;
            const numBoxes = Math.min(3, Math.floor((width - 2) / (boxWidth + spacing)));
            let currentX = x + 2;
            
            for (let i = 0; i < numBoxes && currentX + boxWidth <= x + width - 1; i++) {
                for (let row = 1; row < Math.min(4, height - 1); row++) {
                    buffer[y + row][currentX] = '│';
                    buffer[y + row][currentX + boxWidth - 1] = '│';
                }
                buffer[y + 1][currentX] = '┌';
                buffer[y + 1][currentX + boxWidth - 1] = '┐';
                buffer[y + Math.min(3, height - 2)][currentX] = '└';
                buffer[y + Math.min(3, height - 2)][currentX + boxWidth - 1] = '┘';
                
                currentX += boxWidth + spacing;
            }
            
            // Draw arrow
            buffer[centerY][x] = '►';
        }
    }
}

// ==========================================
// DOCK PANEL
// ==========================================

/**
 * Docking layout panel
 */
export class DockPanel extends UIComponent {
    static get componentType() { return 'DockPanel'; }
    static get displayName() { return 'Dock Panel'; }
    static get description() { return 'A panel that docks children to edges'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '▣'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 30; }
    static get defaultHeight() { return 20; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'lastChildFill',
                displayName: 'Last Child Fill',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether the last child fills remaining space',
                category: PropertyCategory.Layout
            })
        ];
    }
    
    static get attachedProperties() {
        return [
            new PropertyDefinition({
                name: 'DockPanel.Dock',
                displayName: 'Dock',
                type: PropertyType.Enum,
                defaultValue: 'Left',
                description: 'Edge to dock to',
                category: PropertyCategory.Layout,
                enumValues: ['Left', 'Top', 'Right', 'Bottom']
            })
        ];
    }
    
    static get tags() {
        return ['dock', 'panel', 'layout', 'edge', 'fill'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const lastChildFill = this.get('lastChildFill');
        
        const style = BorderStyle.Single;
        
        // Draw panel frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw dock regions
        const topHeight = 3;
        const bottomHeight = 3;
        const leftWidth = 8;
        const rightWidth = 8;
        
        // Top dock
        for (let i = 1; i < width - 1; i++) {
            buffer[y + topHeight][x + i] = '─';
        }
        ASCIIRenderer.drawCenteredText(buffer, y + 1, 'Top', x, width);
        
        // Bottom dock
        for (let i = 1; i < width - 1; i++) {
            buffer[y + height - topHeight - 1][x + i] = '─';
        }
        ASCIIRenderer.drawCenteredText(buffer, y + height - 2, 'Bottom', x, width);
        
        // Left dock
        for (let row = topHeight + 1; row < height - bottomHeight - 1; row++) {
            buffer[y + row][x + leftWidth] = '│';
        }
        ASCIIRenderer.drawText(buffer, x + 2, y + Math.floor(height / 2), 'Left');
        
        // Right dock
        for (let row = topHeight + 1; row < height - bottomHeight - 1; row++) {
            buffer[y + row][x + width - rightWidth - 1] = '│';
        }
        ASCIIRenderer.drawText(buffer, x + width - rightWidth + 1, y + Math.floor(height / 2), 'Right');
        
        // Center (fill)
        if (lastChildFill) {
            const centerX = x + leftWidth + Math.floor((width - leftWidth - rightWidth) / 2) - 2;
            ASCIIRenderer.drawText(buffer, centerX, y + Math.floor(height / 2), 'Fill');
        }
    }
}

// ==========================================
// WRAP PANEL
// ==========================================

/**
 * Wrapping layout panel
 */
export class WrapPanel extends UIComponent {
    static get componentType() { return 'WrapPanel'; }
    static get displayName() { return 'Wrap Panel'; }
    static get description() { return 'A panel that wraps children to new rows/columns'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '↩'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 30; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Horizontal',
                description: 'Primary flow direction',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'itemWidth',
                displayName: 'Item Width',
                type: PropertyType.Number,
                defaultValue: NaN,
                description: 'Fixed width for items',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'itemHeight',
                displayName: 'Item Height',
                type: PropertyType.Number,
                defaultValue: NaN,
                description: 'Fixed height for items',
                category: PropertyCategory.Layout
            })
        ];
    }
    
    static get tags() {
        return ['wrap', 'panel', 'layout', 'flow', 'multiline'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const orientation = this.get('orientation') || 'Horizontal';
        
        const style = BorderStyle.Dashed;
        
        // Draw panel frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw wrapped items to show concept
        const itemWidth = 5;
        const itemHeight = 2;
        const spacing = 1;
        
        if (orientation === 'Horizontal') {
            let currentX = x + 1;
            let currentY = y + 1;
            
            for (let i = 0; i < 8; i++) {
                if (currentX + itemWidth > x + width - 1) {
                    currentX = x + 1;
                    currentY += itemHeight + spacing;
                }
                
                if (currentY + itemHeight > y + height - 1) break;
                
                // Draw small box
                buffer[currentY][currentX] = '┌';
                buffer[currentY][currentX + itemWidth - 1] = '┐';
                buffer[currentY + 1][currentX] = '└';
                buffer[currentY + 1][currentX + itemWidth - 1] = '┘';
                
                currentX += itemWidth + spacing;
            }
        } else {
            let currentX = x + 1;
            let currentY = y + 1;
            
            for (let i = 0; i < 8; i++) {
                if (currentY + itemHeight > y + height - 1) {
                    currentY = y + 1;
                    currentX += itemWidth + spacing;
                }
                
                if (currentX + itemWidth > x + width - 1) break;
                
                // Draw small box
                buffer[currentY][currentX] = '┌';
                buffer[currentY][currentX + itemWidth - 1] = '┐';
                buffer[currentY + 1][currentX] = '└';
                buffer[currentY + 1][currentX + itemWidth - 1] = '┘';
                
                currentY += itemHeight + spacing;
            }
        }
        
        // Draw wrap indicator
        buffer[y][x + width - 2] = '↩';
    }
}

// ==========================================
// UNIFORM GRID
// ==========================================

/**
 * Equal-sized cell grid
 */
export class UniformGrid extends UIComponent {
    static get componentType() { return 'UniformGrid'; }
    static get displayName() { return 'Uniform Grid'; }
    static get description() { return 'A grid with equal-sized cells'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '▦'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 30; }
    static get defaultHeight() { return 20; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'rows',
                displayName: 'Rows',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Number of rows (0 = auto)',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'columns',
                displayName: 'Columns',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Number of columns (0 = auto)',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'firstColumn',
                displayName: 'First Column',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Starting column for first row',
                category: PropertyCategory.Layout,
                minValue: 0
            })
        ];
    }
    
    static get tags() {
        return ['uniform', 'grid', 'layout', 'equal', 'cells'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const rows = this.get('rows') || 3;
        const columns = this.get('columns') || 3;
        
        const cellWidth = Math.floor((width - 1) / columns);
        const cellHeight = Math.floor((height - 1) / rows);
        
        // Draw grid
        for (let row = 0; row <= rows; row++) {
            const lineY = y + row * cellHeight;
            if (lineY < y + height) {
                for (let col = 0; col < width; col++) {
                    buffer[lineY][x + col] = '─';
                }
            }
        }
        
        for (let col = 0; col <= columns; col++) {
            const lineX = x + col * cellWidth;
            if (lineX < x + width) {
                for (let row = 0; row < height; row++) {
                    const existingChar = buffer[y + row][lineX];
                    if (existingChar === '─') {
                        buffer[y + row][lineX] = '┼';
                    } else {
                        buffer[y + row][lineX] = '│';
                    }
                }
            }
        }
        
        // Fix corners
        buffer[y][x] = '┌';
        buffer[y][x + width - 1] = '┐';
        buffer[y + height - 1][x] = '└';
        buffer[y + height - 1][x + width - 1] = '┘';
        
        // Fix edges
        for (let row = 1; row < rows; row++) {
            buffer[y + row * cellHeight][x] = '├';
            buffer[y + row * cellHeight][x + width - 1] = '┤';
        }
        for (let col = 1; col < columns; col++) {
            buffer[y][x + col * cellWidth] = '┬';
            buffer[y + height - 1][x + col * cellWidth] = '┴';
        }
    }
}

// ==========================================
// CANVAS
// ==========================================

/**
 * Absolute positioning panel
 */
export class Canvas extends UIComponent {
    static get componentType() { return 'Canvas'; }
    static get displayName() { return 'Canvas'; }
    static get description() { return 'A panel for absolute positioning'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '⬚'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 25; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions
        ];
    }
    
    static get attachedProperties() {
        return [
            new PropertyDefinition({
                name: 'Canvas.Left',
                displayName: 'Canvas Left',
                type: PropertyType.Number,
                defaultValue: NaN,
                description: 'Distance from left edge',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'Canvas.Top',
                displayName: 'Canvas Top',
                type: PropertyType.Number,
                defaultValue: NaN,
                description: 'Distance from top edge',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'Canvas.Right',
                displayName: 'Canvas Right',
                type: PropertyType.Number,
                defaultValue: NaN,
                description: 'Distance from right edge',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'Canvas.Bottom',
                displayName: 'Canvas Bottom',
                type: PropertyType.Number,
                defaultValue: NaN,
                description: 'Distance from bottom edge',
                category: PropertyCategory.Layout
            })
        ];
    }
    
    static get tags() {
        return ['canvas', 'absolute', 'layout', 'position', 'free'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const style = BorderStyle.Dashed;
        
        // Draw canvas frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw coordinate indicators
        buffer[y + 1][x + 1] = '0';
        buffer[y + 1][x + 2] = ',';
        buffer[y + 1][x + 3] = '0';
        
        // Draw some positioned elements to show concept
        const items = [
            { x: 5, y: 3, char: '□' },
            { x: 15, y: 5, char: '○' },
            { x: 25, y: 8, char: '△' },
            { x: 10, y: 12, char: '◇' }
        ];
        
        for (const item of items) {
            if (x + item.x < x + width - 1 && y + item.y < y + height - 1) {
                buffer[y + item.y][x + item.x] = item.char;
                // Draw coordinate
                const coord = `(${item.x},${item.y})`;
                if (x + item.x + coord.length < x + width - 1) {
                    ASCIIRenderer.drawText(buffer, x + item.x + 1, y + item.y, coord);
                }
            }
        }
    }
}

// ==========================================
// RELATIVE PANEL
// ==========================================

/**
 * Relative positioning panel
 */
export class RelativePanel extends UIComponent {
    static get componentType() { return 'RelativePanel'; }
    static get displayName() { return 'Relative Panel'; }
    static get description() { return 'A panel for relative positioning'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '⇔'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 25; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions
        ];
    }
    
    static get attachedProperties() {
        return [
            new PropertyDefinition({
                name: 'RelativePanel.AlignLeftWithPanel',
                displayName: 'Align Left With Panel',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Align left edge with panel',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'RelativePanel.AlignTopWithPanel',
                displayName: 'Align Top With Panel',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Align top edge with panel',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'RelativePanel.AlignRightWithPanel',
                displayName: 'Align Right With Panel',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Align right edge with panel',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'RelativePanel.AlignBottomWithPanel',
                displayName: 'Align Bottom With Panel',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Align bottom edge with panel',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'RelativePanel.AlignHorizontalCenterWithPanel',
                displayName: 'Align Horizontal Center With Panel',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Align horizontal center with panel',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'RelativePanel.AlignVerticalCenterWithPanel',
                displayName: 'Align Vertical Center With Panel',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Align vertical center with panel',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'RelativePanel.LeftOf',
                displayName: 'Left Of',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Place left of another element',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'RelativePanel.Above',
                displayName: 'Above',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Place above another element',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'RelativePanel.RightOf',
                displayName: 'Right Of',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Place right of another element',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'RelativePanel.Below',
                displayName: 'Below',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Place below another element',
                category: PropertyCategory.Layout
            })
        ];
    }
    
    static get tags() {
        return ['relative', 'panel', 'layout', 'constraint', 'responsive'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const style = BorderStyle.Single;
        
        // Draw panel frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw relationship arrows
        const centerX = x + Math.floor(width / 2);
        const centerY = y + Math.floor(height / 2);
        
        // Center element
        ASCIIRenderer.drawText(buffer, centerX - 1, centerY, '[A]');
        
        // Relative elements
        if (centerX - 8 > x) {
            ASCIIRenderer.drawText(buffer, centerX - 8, centerY, '[B]←');
        }
        if (centerX + 5 < x + width - 3) {
            ASCIIRenderer.drawText(buffer, centerX + 3, centerY, '→[C]');
        }
        if (centerY - 2 > y) {
            ASCIIRenderer.drawText(buffer, centerX - 1, centerY - 2, '[D]');
            buffer[centerY - 1][centerX] = '↑';
        }
        if (centerY + 2 < y + height - 1) {
            buffer[centerY + 1][centerX] = '↓';
            ASCIIRenderer.drawText(buffer, centerX - 1, centerY + 2, '[E]');
        }
    }
}

// ==========================================
// SPLIT VIEW
// ==========================================

/**
 * Split view with resizable panes
 */
export class SplitView extends UIComponent {
    static get componentType() { return 'SplitView'; }
    static get displayName() { return 'Split View'; }
    static get description() { return 'A split view with pane and content areas'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '⊟'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 50; }
    static get defaultHeight() { return 25; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'isPaneOpen',
                displayName: 'Is Pane Open',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether the pane is open',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'displayMode',
                displayName: 'Display Mode',
                type: PropertyType.Enum,
                defaultValue: 'Inline',
                description: 'How the pane is displayed',
                category: PropertyCategory.Appearance,
                enumValues: ['Inline', 'Overlay', 'CompactInline', 'CompactOverlay']
            }),
            new PropertyDefinition({
                name: 'panePlacement',
                displayName: 'Pane Placement',
                type: PropertyType.Enum,
                defaultValue: 'Left',
                description: 'Position of the pane',
                category: PropertyCategory.Layout,
                enumValues: ['Left', 'Right']
            }),
            new PropertyDefinition({
                name: 'openPaneLength',
                displayName: 'Open Pane Length',
                type: PropertyType.Number,
                defaultValue: 320,
                description: 'Width of the pane when open',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'compactPaneLength',
                displayName: 'Compact Pane Length',
                type: PropertyType.Number,
                defaultValue: 48,
                description: 'Width of the pane when compact',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'pane',
                displayName: 'Pane',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Content for the pane',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'paneBackground',
                displayName: 'Pane Background',
                type: PropertyType.Brush,
                defaultValue: null,
                description: 'Background brush for the pane',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'useLightDismissOverlayMode',
                displayName: 'Use Light Dismiss Overlay Mode',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether clicking outside closes the pane',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'paneOpening',
                displayName: 'Pane Opening',
                description: 'Occurs when the pane starts opening',
                eventArgsType: 'CancelRoutedEventArgs'
            }),
            new EventDefinition({
                name: 'paneOpened',
                displayName: 'Pane Opened',
                description: 'Occurs when the pane finishes opening',
                eventArgsType: 'RoutedEventArgs'
            }),
            new EventDefinition({
                name: 'paneClosing',
                displayName: 'Pane Closing',
                description: 'Occurs when the pane starts closing',
                eventArgsType: 'CancelRoutedEventArgs'
            }),
            new EventDefinition({
                name: 'paneClosed',
                displayName: 'Pane Closed',
                description: 'Occurs when the pane finishes closing',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['split', 'view', 'pane', 'navigation', 'sidebar'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const isPaneOpen = this.get('isPaneOpen');
        const panePlacement = this.get('panePlacement') || 'Left';
        const displayMode = this.get('displayMode') || 'Inline';
        
        const style = BorderStyle.Single;
        const paneWidth = isPaneOpen ? Math.floor(width * 0.3) : 3;
        
        // Draw outer frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw pane
        const paneX = panePlacement === 'Left' ? x : x + width - paneWidth;
        const contentX = panePlacement === 'Left' ? x + paneWidth : x;
        
        // Draw pane separator
        const sepX = panePlacement === 'Left' ? x + paneWidth - 1 : x + width - paneWidth;
        for (let row = 1; row < height - 1; row++) {
            buffer[y + row][sepX] = '│';
        }
        buffer[y][sepX] = '┬';
        buffer[y + height - 1][sepX] = '┴';
        
        // Draw pane label
        const paneLabel = isPaneOpen ? 'Pane' : '☰';
        if (panePlacement === 'Left') {
            ASCIIRenderer.drawText(buffer, x + 2, y + 2, paneLabel);
        } else {
            ASCIIRenderer.drawText(buffer, x + width - paneWidth + 2, y + 2, paneLabel);
        }
        
        // Draw content label
        const contentLabel = 'Content';
        const contentCenterX = contentX + Math.floor((width - paneWidth) / 2) - Math.floor(contentLabel.length / 2);
        ASCIIRenderer.drawText(buffer, contentCenterX, y + Math.floor(height / 2), contentLabel);
    }
}

// ==========================================
// SEPARATOR
// ==========================================

/**
 * Visual separator line
 */
export class Separator extends UIComponent {
    static get componentType() { return 'Separator'; }
    static get displayName() { return 'Separator'; }
    static get description() { return 'A visual separator line'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '─'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Horizontal',
                description: 'Orientation of the separator',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            })
        ];
    }
    
    static get tags() {
        return ['separator', 'divider', 'line', 'hr'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const orientation = this.get('orientation') || 'Horizontal';
        
        if (orientation === 'Horizontal') {
            for (let i = 0; i < width; i++) {
                buffer[y][x + i] = '─';
            }
        } else {
            for (let i = 0; i < height; i++) {
                buffer[y + i][x] = '│';
            }
        }
    }
}

// ==========================================
// FLEX PANEL (Custom)
// ==========================================

/**
 * Flexible layout panel similar to CSS Flexbox
 */
export class FlexPanel extends UIComponent {
    static get componentType() { return 'FlexPanel'; }
    static get displayName() { return 'Flex Panel'; }
    static get description() { return 'A flexible layout panel similar to CSS Flexbox'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '⇄'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'direction',
                displayName: 'Direction',
                type: PropertyType.Enum,
                defaultValue: 'Row',
                description: 'Main axis direction',
                category: PropertyCategory.Layout,
                enumValues: ['Row', 'RowReverse', 'Column', 'ColumnReverse']
            }),
            new PropertyDefinition({
                name: 'wrap',
                displayName: 'Wrap',
                type: PropertyType.Enum,
                defaultValue: 'NoWrap',
                description: 'Whether items wrap to new lines',
                category: PropertyCategory.Layout,
                enumValues: ['NoWrap', 'Wrap', 'WrapReverse']
            }),
            new PropertyDefinition({
                name: 'justifyContent',
                displayName: 'Justify Content',
                type: PropertyType.Enum,
                defaultValue: 'FlexStart',
                description: 'Main axis alignment',
                category: PropertyCategory.Layout,
                enumValues: ['FlexStart', 'FlexEnd', 'Center', 'SpaceBetween', 'SpaceAround', 'SpaceEvenly']
            }),
            new PropertyDefinition({
                name: 'alignItems',
                displayName: 'Align Items',
                type: PropertyType.Enum,
                defaultValue: 'Stretch',
                description: 'Cross axis alignment',
                category: PropertyCategory.Layout,
                enumValues: ['FlexStart', 'FlexEnd', 'Center', 'Stretch', 'Baseline']
            }),
            new PropertyDefinition({
                name: 'alignContent',
                displayName: 'Align Content',
                type: PropertyType.Enum,
                defaultValue: 'Stretch',
                description: 'Multi-line cross axis alignment',
                category: PropertyCategory.Layout,
                enumValues: ['FlexStart', 'FlexEnd', 'Center', 'Stretch', 'SpaceBetween', 'SpaceAround']
            }),
            new PropertyDefinition({
                name: 'rowGap',
                displayName: 'Row Gap',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Gap between rows',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'columnGap',
                displayName: 'Column Gap',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Gap between columns',
                category: PropertyCategory.Layout,
                minValue: 0
            })
        ];
    }
    
    static get attachedProperties() {
        return [
            new PropertyDefinition({
                name: 'FlexPanel.Grow',
                displayName: 'Flex Grow',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Grow factor',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'FlexPanel.Shrink',
                displayName: 'Flex Shrink',
                type: PropertyType.Number,
                defaultValue: 1,
                description: 'Shrink factor',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'FlexPanel.Basis',
                displayName: 'Flex Basis',
                type: PropertyType.String,
                defaultValue: 'Auto',
                description: 'Initial size before growing/shrinking',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'FlexPanel.AlignSelf',
                displayName: 'Align Self',
                type: PropertyType.Enum,
                defaultValue: 'Auto',
                description: 'Override align items for this child',
                category: PropertyCategory.Layout,
                enumValues: ['Auto', 'FlexStart', 'FlexEnd', 'Center', 'Stretch', 'Baseline']
            }),
            new PropertyDefinition({
                name: 'FlexPanel.Order',
                displayName: 'Order',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Display order',
                category: PropertyCategory.Layout
            })
        ];
    }
    
    static get tags() {
        return ['flex', 'flexbox', 'layout', 'panel', 'responsive'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const direction = this.get('direction') || 'Row';
        const justifyContent = this.get('justifyContent') || 'FlexStart';
        
        const style = BorderStyle.Dashed;
        
        // Draw panel border
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw label
        ASCIIRenderer.drawCenteredText(buffer, y + 1, 'FlexPanel', x + 1, width - 2);
        
        // Draw direction indicator
        const directionIndicator = {
            'Row': '→',
            'RowReverse': '←',
            'Column': '↓',
            'ColumnReverse': '↑'
        }[direction] || '→';
        
        const centerY = y + Math.floor(height / 2);
        const centerX = x + Math.floor(width / 2);
        
        // Draw sample flex items
        const itemWidth = Math.floor((width - 6) / 3);
        const itemHeight = 3;
        const itemY = centerY - 1;
        
        if (direction === 'Row' || direction === 'RowReverse') {
            for (let i = 0; i < 3; i++) {
                const ix = direction === 'Row' ? x + 2 + i * (itemWidth + 1) : x + width - 4 - (i + 1) * (itemWidth + 1);
                ASCIIRenderer.drawBox(buffer, ix, itemY, itemWidth, itemHeight, BorderStyle.Single);
                buffer[itemY + 1][ix + Math.floor(itemWidth / 2)] = String(i + 1);
            }
        } else {
            const itemY2 = direction === 'Column' ? y + 3 : y + height - 6;
            for (let i = 0; i < 2; i++) {
                const iy = direction === 'Column' ? itemY2 + i * 4 : itemY2 - i * 4;
                if (iy > y && iy + 3 < y + height) {
                    ASCIIRenderer.drawBox(buffer, x + 2, iy, width - 4, 3, BorderStyle.Single);
                    buffer[iy + 1][centerX] = String(i + 1);
                }
            }
        }
        
        // Draw direction arrow
        buffer[y + height - 2][x + 2] = directionIndicator;
        ASCIIRenderer.drawText(buffer, x + 4, y + height - 2, direction);
    }
}

// ==========================================
// VIRTUALIZING STACK PANEL
// ==========================================

/**
 * Virtualized stack panel for large lists
 */
export class VirtualizingStackPanel extends UIComponent {
    static get componentType() { return 'VirtualizingStackPanel'; }
    static get displayName() { return 'Virtualizing Stack Panel'; }
    static get description() { return 'A virtualized stack panel for efficient rendering of large lists'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '⋮'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Vertical',
                description: 'Stack orientation',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'areHorizontalSnapPointsRegular',
                displayName: 'Are Horizontal Snap Points Regular',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether horizontal snap points are regular',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'areVerticalSnapPointsRegular',
                displayName: 'Are Vertical Snap Points Regular',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether vertical snap points are regular',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get tags() {
        return ['virtualizing', 'stack', 'panel', 'list', 'performance', 'scroll'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const orientation = this.get('orientation') || 'Vertical';
        
        const style = BorderStyle.Single;
        
        // Draw panel border
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw title
        const title = 'VirtualStack';
        ASCIIRenderer.drawCenteredText(buffer, y + 1, title, x + 1, width - 2);
        
        if (orientation === 'Vertical') {
            // Draw virtualized items (some visible, some placeholder)
            const itemHeight = 2;
            const maxItems = Math.floor((height - 4) / itemHeight);
            
            // Draw visible items
            for (let i = 0; i < Math.min(3, maxItems); i++) {
                const itemY = y + 3 + i * itemHeight;
                ASCIIRenderer.drawText(buffer, x + 2, itemY, `├─ Item ${i + 1}`);
            }
            
            // Draw virtualized indicator
            if (height > 10) {
                const ellipsisY = y + Math.floor(height * 0.6);
                ASCIIRenderer.drawCenteredText(buffer, ellipsisY, '⋮ (virtualized)', x + 1, width - 2);
            }
            
            // Draw scroll indicator
            const scrollY = y + 2;
            const scrollHeight = height - 4;
            buffer[scrollY][x + width - 2] = '▲';
            for (let i = 1; i < scrollHeight - 1; i++) {
                buffer[scrollY + i][x + width - 2] = i < scrollHeight / 3 ? '▓' : '░';
            }
            buffer[scrollY + scrollHeight - 1][x + width - 2] = '▼';
        } else {
            // Horizontal virtualization
            ASCIIRenderer.drawCenteredText(buffer, y + Math.floor(height / 2), '◀ ░░▓▓░░ ▶', x + 1, width - 2);
        }
    }
}

// ==========================================
// ITEMS REPEATER
// ==========================================

/**
 * Flexible items repeater for custom layouts
 */
export class ItemsRepeater extends UIComponent {
    static get componentType() { return 'ItemsRepeater'; }
    static get displayName() { return 'Items Repeater'; }
    static get description() { return 'A flexible items repeater for custom virtualized layouts'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '∷'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 30; }
    static get defaultHeight() { return 12; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Array,
                defaultValue: [],
                description: 'Items to repeat',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'itemsSource',
                displayName: 'Items Source',
                type: PropertyType.Binding,
                defaultValue: null,
                description: 'Data source binding',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'itemTemplate',
                displayName: 'Item Template',
                type: PropertyType.Template,
                defaultValue: null,
                description: 'Template for each item',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'layout',
                displayName: 'Layout',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Layout algorithm',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'horizontalCacheLength',
                displayName: 'Horizontal Cache Length',
                type: PropertyType.Number,
                defaultValue: 2,
                description: 'Horizontal virtualization cache',
                category: PropertyCategory.Performance
            }),
            new PropertyDefinition({
                name: 'verticalCacheLength',
                displayName: 'Vertical Cache Length',
                type: PropertyType.Number,
                defaultValue: 2,
                description: 'Vertical virtualization cache',
                category: PropertyCategory.Performance
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'elementPrepared',
                displayName: 'Element Prepared',
                description: 'Occurs when an element is prepared',
                eventArgsType: 'ItemsRepeaterElementPreparedEventArgs'
            }),
            new EventDefinition({
                name: 'elementClearing',
                displayName: 'Element Clearing',
                description: 'Occurs when an element is being cleared',
                eventArgsType: 'ItemsRepeaterElementClearingEventArgs'
            }),
            new EventDefinition({
                name: 'elementIndexChanged',
                displayName: 'Element Index Changed',
                description: 'Occurs when an element index changes',
                eventArgsType: 'ItemsRepeaterElementIndexChangedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['items', 'repeater', 'virtualize', 'list', 'custom', 'layout'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const style = BorderStyle.Dashed;
        
        // Draw panel border
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw title
        ASCIIRenderer.drawCenteredText(buffer, y + 1, 'ItemsRepeater', x + 1, width - 2);
        
        // Draw sample repeated items in a grid-like pattern
        const itemWidth = Math.floor((width - 4) / 3);
        const itemHeight = 3;
        const rows = Math.floor((height - 4) / itemHeight);
        
        let itemNum = 1;
        for (let row = 0; row < Math.min(rows, 2); row++) {
            for (let col = 0; col < 3; col++) {
                const ix = x + 2 + col * itemWidth;
                const iy = y + 3 + row * itemHeight;
                
                if (ix + itemWidth <= x + width - 1 && iy + itemHeight <= y + height - 1) {
                    ASCIIRenderer.drawBox(buffer, ix, iy, itemWidth - 1, itemHeight, BorderStyle.Single);
                    buffer[iy + 1][ix + Math.floor(itemWidth / 2) - 1] = String(itemNum);
                    itemNum++;
                }
            }
        }
        
        // Draw virtualization indicator
        if (height > 8) {
            ASCIIRenderer.drawCenteredText(buffer, y + height - 2, '∷ more items...', x + 1, width - 2);
        }
    }
}

// ==========================================
// STACK LAYOUT (for ItemsRepeater)
// ==========================================

/**
 * Stack layout for ItemsRepeater
 */
export class StackLayout extends UIComponent {
    static get componentType() { return 'StackLayout'; }
    static get displayName() { return 'Stack Layout'; }
    static get description() { return 'A stack layout for ItemsRepeater'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '═'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 10; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Vertical',
                description: 'Layout orientation',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'spacing',
                displayName: 'Spacing',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Spacing between items',
                category: PropertyCategory.Layout,
                minValue: 0
            })
        ];
    }
    
    static get tags() {
        return ['stack', 'layout', 'repeater', 'items'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const orientation = this.get('orientation') || 'Vertical';
        const spacing = this.get('spacing') || 0;
        
        ASCIIRenderer.drawBox(buffer, x, y, width, height, BorderStyle.Dashed);
        
        const centerY = y + Math.floor(height / 2);
        if (orientation === 'Vertical') {
            ASCIIRenderer.drawCenteredText(buffer, centerY - 1, 'StackLayout', x + 1, width - 2);
            ASCIIRenderer.drawCenteredText(buffer, centerY + 1, `↓ spacing: ${spacing}`, x + 1, width - 2);
        } else {
            ASCIIRenderer.drawCenteredText(buffer, centerY - 1, 'StackLayout', x + 1, width - 2);
            ASCIIRenderer.drawCenteredText(buffer, centerY + 1, `→ spacing: ${spacing}`, x + 1, width - 2);
        }
    }
}

// ==========================================
// UNIFORM GRID LAYOUT (for ItemsRepeater)
// ==========================================

/**
 * Uniform grid layout for ItemsRepeater
 */
export class UniformGridLayout extends UIComponent {
    static get componentType() { return 'UniformGridLayout'; }
    static get displayName() { return 'Uniform Grid Layout'; }
    static get description() { return 'A uniform grid layout for ItemsRepeater'; }
    static get category() { return UICategory.Layout; }
    static get icon() { return '▦'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 10; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Horizontal',
                description: 'Primary axis',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'minItemWidth',
                displayName: 'Min Item Width',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Minimum item width',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'minItemHeight',
                displayName: 'Min Item Height',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Minimum item height',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'minRowSpacing',
                displayName: 'Min Row Spacing',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Minimum row spacing',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'minColumnSpacing',
                displayName: 'Min Column Spacing',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Minimum column spacing',
                category: PropertyCategory.Layout,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'itemsJustification',
                displayName: 'Items Justification',
                type: PropertyType.Enum,
                defaultValue: 'Start',
                description: 'Items justification',
                category: PropertyCategory.Layout,
                enumValues: ['Start', 'Center', 'End', 'SpaceAround', 'SpaceBetween', 'SpaceEvenly']
            }),
            new PropertyDefinition({
                name: 'itemsStretch',
                displayName: 'Items Stretch',
                type: PropertyType.Enum,
                defaultValue: 'None',
                description: 'How items are stretched',
                category: PropertyCategory.Layout,
                enumValues: ['None', 'Fill', 'Uniform']
            }),
            new PropertyDefinition({
                name: 'maximumRowsOrColumns',
                displayName: 'Maximum Rows Or Columns',
                type: PropertyType.Integer,
                defaultValue: -1,
                description: 'Maximum number of rows or columns (-1 for unlimited)',
                category: PropertyCategory.Layout
            })
        ];
    }
    
    static get tags() {
        return ['uniform', 'grid', 'layout', 'repeater', 'items'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const style = BorderStyle.Dashed;
        
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw uniform grid preview
        const cellWidth = Math.floor((width - 2) / 3);
        const cellHeight = Math.floor((height - 2) / 2);
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                const cx = x + 1 + col * cellWidth;
                const cy = y + 1 + row * cellHeight;
                
                if (cx + cellWidth <= x + width && cy + cellHeight <= y + height) {
                    buffer[cy][cx] = '┌';
                    buffer[cy][cx + cellWidth - 1] = '┐';
                    buffer[cy + cellHeight - 1][cx] = '└';
                    buffer[cy + cellHeight - 1][cx + cellWidth - 1] = '┘';
                }
            }
        }
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    Grid,
    StackPanel,
    DockPanel,
    WrapPanel,
    UniformGrid,
    Canvas,
    RelativePanel,
    SplitView,
    Separator,
    FlexPanel,
    VirtualizingStackPanel,
    ItemsRepeater,
    StackLayout,
    UniformGridLayout
};
