/**
 * Asciistrator - Data Display Controls
 * 
 * Data presentation UI components: DataGrid, ListBox, ComboBox, Labels, etc.
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
    EventDefinition,
    CommonEvents
} from '../PropertySystem.js';

// ==========================================
// DATA GRID
// ==========================================

/**
 * Data grid table
 */
export class DataGrid extends UIComponent {
    static get componentType() { return 'DataGrid'; }
    static get displayName() { return 'Data Grid'; }
    static get description() { return 'A data grid table for displaying tabular data'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '▦'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 50; }
    static get defaultHeight() { return 12; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Array,
                defaultValue: [],
                description: 'Data items to display',
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
                name: 'columns',
                displayName: 'Columns',
                type: PropertyType.Array,
                defaultValue: [
                    { header: 'Column 1', binding: 'col1', width: '*' },
                    { header: 'Column 2', binding: 'col2', width: '*' },
                    { header: 'Column 3', binding: 'col3', width: '*' }
                ],
                description: 'Column definitions',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'autoGenerateColumns',
                displayName: 'Auto Generate Columns',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to auto-generate columns',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'canUserSortColumns',
                displayName: 'Can User Sort Columns',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether user can sort columns',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'canUserResizeColumns',
                displayName: 'Can User Resize Columns',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether user can resize columns',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'canUserReorderColumns',
                displayName: 'Can User Reorder Columns',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether user can reorder columns',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'selectionMode',
                displayName: 'Selection Mode',
                type: PropertyType.Enum,
                defaultValue: 'Extended',
                description: 'Row selection mode',
                category: PropertyCategory.Selection,
                enumValues: ['Single', 'Extended']
            }),
            new PropertyDefinition({
                name: 'selectedItem',
                displayName: 'Selected Item',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Currently selected item',
                category: PropertyCategory.Selection
            }),
            new PropertyDefinition({
                name: 'selectedIndex',
                displayName: 'Selected Index',
                type: PropertyType.Integer,
                defaultValue: -1,
                description: 'Index of selected row',
                category: PropertyCategory.Selection
            }),
            new PropertyDefinition({
                name: 'headerVisible',
                displayName: 'Header Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether column headers are visible',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'gridLinesVisibility',
                displayName: 'Grid Lines Visibility',
                type: PropertyType.Enum,
                defaultValue: 'All',
                description: 'Grid line visibility',
                category: PropertyCategory.Appearance,
                enumValues: ['None', 'Horizontal', 'Vertical', 'All']
            }),
            new PropertyDefinition({
                name: 'isReadOnly',
                displayName: 'Is Read Only',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the grid is read-only',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'frozenColumnCount',
                displayName: 'Frozen Column Count',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Number of frozen columns',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'rowHeight',
                displayName: 'Row Height',
                type: PropertyType.Number,
                defaultValue: 'Auto',
                description: 'Height of rows',
                category: PropertyCategory.Layout
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.selectionChanged(),
            new EventDefinition({
                name: 'sorting',
                displayName: 'Sorting',
                description: 'Occurs before sorting',
                eventArgsType: 'DataGridSortingEventArgs'
            }),
            new EventDefinition({
                name: 'cellEditEnding',
                displayName: 'Cell Edit Ending',
                description: 'Occurs when cell editing ends',
                eventArgsType: 'DataGridCellEditEndingEventArgs'
            }),
            new EventDefinition({
                name: 'rowEditEnding',
                displayName: 'Row Edit Ending',
                description: 'Occurs when row editing ends',
                eventArgsType: 'DataGridRowEditEndingEventArgs'
            }),
            new EventDefinition({
                name: 'loadingRow',
                displayName: 'Loading Row',
                description: 'Occurs when a row is loading',
                eventArgsType: 'DataGridRowEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'focused', 'disabled'];
    }
    
    static get tags() {
        return ['datagrid', 'table', 'grid', 'data', 'list', 'rows', 'columns'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const columns = this.get('columns') || [];
        const items = this.get('items') || [];
        const headerVisible = this.get('headerVisible') !== false;
        const selectedIndex = this.get('selectedIndex') || -1;
        
        const style = BorderStyle.Single;
        
        // Calculate column widths
        const colCount = columns.length || 3;
        const contentWidth = width - 2;
        const colWidth = Math.floor(contentWidth / colCount);
        
        let currentY = y;
        
        // Draw top border
        buffer[currentY][x] = style.tl;
        for (let i = 1; i < width - 1; i++) {
            if (i % colWidth === 0 && i < width - 1) {
                buffer[currentY][x + i] = style.tee;
            } else {
                buffer[currentY][x + i] = style.h;
            }
        }
        buffer[currentY][x + width - 1] = style.tr;
        currentY++;
        
        // Draw header row
        if (headerVisible && currentY < y + height - 1) {
            buffer[currentY][x] = style.v;
            for (let col = 0; col < colCount; col++) {
                const header = columns[col]?.header || `Col ${col + 1}`;
                const startX = x + 1 + col * colWidth;
                const displayText = ASCIIRenderer.truncateText(header, colWidth - 2);
                
                // Center header text
                const padding = Math.floor((colWidth - displayText.length) / 2);
                ASCIIRenderer.drawText(buffer, startX + padding, currentY, displayText);
                
                // Draw column separator
                if (col < colCount - 1) {
                    buffer[currentY][startX + colWidth - 1] = style.v;
                }
            }
            buffer[currentY][x + width - 1] = style.v;
            currentY++;
            
            // Draw header separator
            if (currentY < y + height - 1) {
                buffer[currentY][x] = style.leftTee;
                for (let i = 1; i < width - 1; i++) {
                    if (i % colWidth === 0 && i < width - 1) {
                        buffer[currentY][x + i] = style.cross;
                    } else {
                        buffer[currentY][x + i] = style.h;
                    }
                }
                buffer[currentY][x + width - 1] = style.rightTee;
                currentY++;
            }
        }
        
        // Draw data rows
        const maxRows = y + height - 2 - currentY;
        for (let row = 0; row < Math.min(items.length, maxRows); row++) {
            const item = items[row];
            const isSelected = row === selectedIndex;
            
            buffer[currentY][x] = style.v;
            for (let col = 0; col < colCount; col++) {
                const startX = x + 1 + col * colWidth;
                const binding = columns[col]?.binding;
                const cellValue = binding && item ? String(item[binding] || '') : `R${row + 1}C${col + 1}`;
                const displayText = ASCIIRenderer.truncateText(cellValue, colWidth - 2);
                
                // Fill selected row background
                if (isSelected) {
                    for (let i = 0; i < colWidth - 1; i++) {
                        buffer[currentY][startX + i] = '░';
                    }
                }
                
                ASCIIRenderer.drawText(buffer, startX + 1, currentY, displayText);
                
                // Draw column separator
                if (col < colCount - 1) {
                    buffer[currentY][startX + colWidth - 1] = style.v;
                }
            }
            buffer[currentY][x + width - 1] = style.v;
            currentY++;
        }
        
        // Draw empty rows if no data
        if (items.length === 0 && maxRows > 0) {
            for (let row = 0; row < Math.min(3, maxRows); row++) {
                buffer[currentY][x] = style.v;
                for (let col = 0; col < colCount; col++) {
                    const startX = x + 1 + col * colWidth;
                    if (col < colCount - 1) {
                        buffer[currentY][startX + colWidth - 1] = style.v;
                    }
                }
                buffer[currentY][x + width - 1] = style.v;
                currentY++;
            }
        }
        
        // Draw bottom border
        if (currentY < y + height) {
            const bottomY = y + height - 1;
            buffer[bottomY][x] = style.bl;
            for (let i = 1; i < width - 1; i++) {
                if (i % colWidth === 0 && i < width - 1) {
                    buffer[bottomY][x + i] = style.btee;
                } else {
                    buffer[bottomY][x + i] = style.h;
                }
            }
            buffer[bottomY][x + width - 1] = style.br;
        }
    }
}

// ==========================================
// LIST BOX
// ==========================================

/**
 * Scrollable list of selectable items
 */
export class ListBox extends UIComponent {
    static get componentType() { return 'ListBox'; }
    static get displayName() { return 'List Box'; }
    static get description() { return 'A scrollable list of selectable items'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '☰'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 8; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Array,
                defaultValue: ['Item 1', 'Item 2', 'Item 3'],
                description: 'List items',
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
                name: 'selectedItem',
                displayName: 'Selected Item',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Currently selected item',
                category: PropertyCategory.Selection
            }),
            new PropertyDefinition({
                name: 'selectedIndex',
                displayName: 'Selected Index',
                type: PropertyType.Integer,
                defaultValue: -1,
                description: 'Index of selected item',
                category: PropertyCategory.Selection
            }),
            new PropertyDefinition({
                name: 'selectedItems',
                displayName: 'Selected Items',
                type: PropertyType.Array,
                defaultValue: [],
                description: 'Collection of selected items',
                category: PropertyCategory.Selection
            }),
            new PropertyDefinition({
                name: 'selectionMode',
                displayName: 'Selection Mode',
                type: PropertyType.Enum,
                defaultValue: 'Single',
                description: 'Selection mode',
                category: PropertyCategory.Selection,
                enumValues: ['Single', 'Multiple', 'Toggle', 'AlwaysSelected']
            }),
            new PropertyDefinition({
                name: 'itemTemplate',
                displayName: 'Item Template',
                type: PropertyType.Template,
                defaultValue: null,
                description: 'Template for items',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'virtualizationMode',
                displayName: 'Virtualization Mode',
                type: PropertyType.Enum,
                defaultValue: 'Simple',
                description: 'Virtualization strategy',
                category: PropertyCategory.Performance,
                enumValues: ['None', 'Simple', 'Recycling']
            }),
            new PropertyDefinition({
                name: 'scrollViewer',
                displayName: 'Scroll Viewer',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Scroll viewer settings',
                category: PropertyCategory.Layout
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.selectionChanged(),
            new EventDefinition({
                name: 'itemDoubleClick',
                displayName: 'Item Double Click',
                description: 'Occurs when an item is double-clicked',
                eventArgsType: 'PointerPressedEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'focused', 'disabled'];
    }
    
    static get tags() {
        return ['listbox', 'list', 'items', 'selection', 'scroll'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const items = this.get('items') || [];
        const selectedIndex = this.get('selectedIndex') || -1;
        const style = BorderStyle.Single;
        
        // Draw border
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw items
        const maxItems = height - 2;
        const contentWidth = width - 4;
        
        for (let i = 0; i < Math.min(items.length, maxItems); i++) {
            const itemY = y + 1 + i;
            const isSelected = i === selectedIndex;
            const itemText = String(items[i]);
            const displayText = ASCIIRenderer.truncateText(itemText, contentWidth);
            
            if (isSelected) {
                // Draw selection highlight
                buffer[itemY][x + 1] = '>';
                for (let j = 2; j < width - 2; j++) {
                    buffer[itemY][x + j] = '░';
                }
            }
            
            ASCIIRenderer.drawText(buffer, x + 2, itemY, displayText);
        }
        
        // Draw scroll indicator if needed
        if (items.length > maxItems) {
            buffer[y + 1][x + width - 2] = '▲';
            buffer[y + height - 2][x + width - 2] = '▼';
        }
    }
}

// ==========================================
// COMBO BOX
// ==========================================

/**
 * Drop-down combo box
 */
export class ComboBox extends UIComponent {
    static get componentType() { return 'ComboBox'; }
    static get displayName() { return 'Combo Box'; }
    static get description() { return 'A drop-down combo box for selection'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '▼'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Array,
                defaultValue: ['Option 1', 'Option 2', 'Option 3'],
                description: 'Dropdown items',
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
                name: 'selectedItem',
                displayName: 'Selected Item',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Currently selected item',
                category: PropertyCategory.Selection
            }),
            new PropertyDefinition({
                name: 'selectedIndex',
                displayName: 'Selected Index',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Index of selected item',
                category: PropertyCategory.Selection
            }),
            new PropertyDefinition({
                name: 'placeholderText',
                displayName: 'Placeholder Text',
                type: PropertyType.String,
                defaultValue: 'Select...',
                description: 'Placeholder when nothing selected',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'isEditable',
                displayName: 'Is Editable',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether text can be edited',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isDropDownOpen',
                displayName: 'Is Drop Down Open',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether dropdown is open',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'maxDropDownHeight',
                displayName: 'Max Drop Down Height',
                type: PropertyType.Number,
                defaultValue: 200,
                description: 'Maximum dropdown height',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'displayMemberPath',
                displayName: 'Display Member Path',
                type: PropertyType.String,
                defaultValue: null,
                description: 'Path to display property',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'selectedValuePath',
                displayName: 'Selected Value Path',
                type: PropertyType.String,
                defaultValue: null,
                description: 'Path to value property',
                category: PropertyCategory.Data
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.selectionChanged(),
            new EventDefinition({
                name: 'dropDownOpened',
                displayName: 'Drop Down Opened',
                description: 'Occurs when dropdown opens',
                eventArgsType: 'EventArgs'
            }),
            new EventDefinition({
                name: 'dropDownClosed',
                displayName: 'Drop Down Closed',
                description: 'Occurs when dropdown closes',
                eventArgsType: 'EventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'focused', 'pressed', 'disabled'];
    }
    
    static get tags() {
        return ['combobox', 'dropdown', 'select', 'picker'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const items = this.get('items') || [];
        const selectedIndex = this.get('selectedIndex');
        const placeholderText = this.get('placeholderText') || 'Select...';
        const isDropDownOpen = this.get('isDropDownOpen');
        
        // Draw combo box
        const displayText = selectedIndex >= 0 && items[selectedIndex] 
            ? String(items[selectedIndex]) 
            : placeholderText;
        
        const maxTextWidth = width - 4;
        const truncatedText = ASCIIRenderer.truncateText(displayText, maxTextWidth);
        
        // Draw border
        buffer[y][x] = '[';
        
        // Draw text
        ASCIIRenderer.drawText(buffer, x + 1, y, truncatedText);
        
        // Pad with spaces
        for (let i = truncatedText.length + 1; i < width - 3; i++) {
            buffer[y][x + i] = buffer[y][x + i] || ' ';
        }
        
        // Draw dropdown arrow
        buffer[y][x + width - 3] = '|';
        buffer[y][x + width - 2] = isDropDownOpen ? '▲' : '▼';
        buffer[y][x + width - 1] = ']';
        
        // Draw dropdown if open
        if (isDropDownOpen && height > 1) {
            const dropdownHeight = Math.min(items.length + 2, height - 1);
            ASCIIRenderer.drawBox(buffer, x, y + 1, width, dropdownHeight, BorderStyle.Single);
            
            for (let i = 0; i < Math.min(items.length, dropdownHeight - 2); i++) {
                const itemText = ASCIIRenderer.truncateText(String(items[i]), width - 4);
                if (i === selectedIndex) {
                    buffer[y + 2 + i][x + 1] = '>';
                }
                ASCIIRenderer.drawText(buffer, x + 2, y + 2 + i, itemText);
            }
        }
    }
}

// ==========================================
// LABEL
// ==========================================

/**
 * Text label control
 */
export class Label extends UIComponent {
    static get componentType() { return 'Label'; }
    static get displayName() { return 'Label'; }
    static get description() { return 'A text label control'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return 'Aa'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 10; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.content('Label'),
            new PropertyDefinition({
                name: 'target',
                displayName: 'Target',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Target control for focus',
                category: PropertyCategory.Behavior
            }),
            CommonProperties.foreground('#000000'),
            CommonProperties.fontFamily(),
            CommonProperties.fontSize(12),
            CommonProperties.fontWeight('Normal'),
            CommonProperties.fontStyle('Normal'),
            new PropertyDefinition({
                name: 'textTrimming',
                displayName: 'Text Trimming',
                type: PropertyType.Enum,
                defaultValue: 'None',
                description: 'Text trimming mode',
                category: PropertyCategory.Appearance,
                enumValues: ['None', 'CharacterEllipsis', 'WordEllipsis']
            }),
            CommonProperties.horizontalContentAlignment('Left'),
            CommonProperties.verticalContentAlignment('Center')
        ];
    }
    
    static get tags() {
        return ['label', 'text', 'caption', 'heading'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || 'Label');
        const horizontalAlignment = this.get('horizontalContentAlignment') || 'Left';
        const verticalAlignment = this.get('verticalContentAlignment') || 'Center';
        
        const displayText = ASCIIRenderer.truncateText(content, width);
        
        // Calculate vertical position
        let textY = y;
        if (verticalAlignment === 'Center') {
            textY = y + Math.floor(height / 2);
        } else if (verticalAlignment === 'Bottom') {
            textY = y + height - 1;
        }
        
        // Draw text with alignment
        if (horizontalAlignment === 'Center') {
            ASCIIRenderer.drawCenteredText(buffer, textY, displayText, x, width);
        } else if (horizontalAlignment === 'Right') {
            const textX = x + width - displayText.length;
            ASCIIRenderer.drawText(buffer, textX, textY, displayText);
        } else {
            ASCIIRenderer.drawText(buffer, x, textY, displayText);
        }
    }
}

// ==========================================
// TEXT BLOCK
// ==========================================

/**
 * Rich text display block
 */
export class TextBlock extends UIComponent {
    static get componentType() { return 'TextBlock'; }
    static get displayName() { return 'Text Block'; }
    static get description() { return 'A rich text display block'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '¶'; }
    static get contentModel() { return ContentModel.Text; }
    static get defaultWidth() { return 30; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'text',
                displayName: 'Text',
                type: PropertyType.String,
                defaultValue: 'Text block content',
                description: 'Text content',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'inlines',
                displayName: 'Inlines',
                type: PropertyType.Array,
                defaultValue: null,
                description: 'Inline text elements',
                category: PropertyCategory.Content
            }),
            CommonProperties.foreground('#000000'),
            CommonProperties.background('transparent'),
            CommonProperties.fontFamily(),
            CommonProperties.fontSize(12),
            CommonProperties.fontWeight('Normal'),
            CommonProperties.fontStyle('Normal'),
            new PropertyDefinition({
                name: 'textAlignment',
                displayName: 'Text Alignment',
                type: PropertyType.Enum,
                defaultValue: 'Left',
                description: 'Text alignment',
                category: PropertyCategory.Appearance,
                enumValues: ['Left', 'Center', 'Right', 'Justify']
            }),
            new PropertyDefinition({
                name: 'textWrapping',
                displayName: 'Text Wrapping',
                type: PropertyType.Enum,
                defaultValue: 'NoWrap',
                description: 'Text wrapping mode',
                category: PropertyCategory.Appearance,
                enumValues: ['NoWrap', 'Wrap', 'WrapWithOverflow']
            }),
            new PropertyDefinition({
                name: 'textTrimming',
                displayName: 'Text Trimming',
                type: PropertyType.Enum,
                defaultValue: 'None',
                description: 'Text trimming mode',
                category: PropertyCategory.Appearance,
                enumValues: ['None', 'CharacterEllipsis', 'WordEllipsis']
            }),
            new PropertyDefinition({
                name: 'lineHeight',
                displayName: 'Line Height',
                type: PropertyType.Number,
                defaultValue: 'NaN',
                description: 'Line height',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'maxLines',
                displayName: 'Max Lines',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Maximum number of lines (0 = unlimited)',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'letterSpacing',
                displayName: 'Letter Spacing',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Spacing between characters',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'textDecorations',
                displayName: 'Text Decorations',
                type: PropertyType.Array,
                defaultValue: null,
                description: 'Text decorations (underline, strikethrough)',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get tags() {
        return ['textblock', 'text', 'paragraph', 'content', 'rich'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const text = String(this.get('text') || '');
        const textAlignment = this.get('textAlignment') || 'Left';
        const textWrapping = this.get('textWrapping') || 'NoWrap';
        const maxLines = this.get('maxLines') || 0;
        
        // Word wrap text
        const lines = [];
        if (textWrapping !== 'NoWrap') {
            const words = text.split(' ');
            let currentLine = '';
            
            for (const word of words) {
                if (currentLine.length + word.length + 1 <= width) {
                    currentLine = currentLine ? `${currentLine} ${word}` : word;
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine) lines.push(currentLine);
        } else {
            lines.push(text);
        }
        
        // Apply max lines
        const displayLines = maxLines > 0 ? lines.slice(0, maxLines) : lines.slice(0, height);
        
        // Render lines
        for (let i = 0; i < displayLines.length && i < height; i++) {
            let line = displayLines[i];
            
            // Truncate if needed
            if (line.length > width) {
                line = line.substring(0, width - 3) + '...';
            }
            
            // Apply alignment
            if (textAlignment === 'Center') {
                ASCIIRenderer.drawCenteredText(buffer, y + i, line, x, width);
            } else if (textAlignment === 'Right') {
                const textX = x + width - line.length;
                ASCIIRenderer.drawText(buffer, textX, y + i, line);
            } else {
                ASCIIRenderer.drawText(buffer, x, y + i, line);
            }
        }
    }
}

// ==========================================
// IMAGE
// ==========================================

/**
 * Image display control
 */
export class Image extends UIComponent {
    static get componentType() { return 'Image'; }
    static get displayName() { return 'Image'; }
    static get description() { return 'An image display control'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '🖼'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 10; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'source',
                displayName: 'Source',
                type: PropertyType.ImageSource,
                defaultValue: null,
                description: 'Image source',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'stretch',
                displayName: 'Stretch',
                type: PropertyType.Enum,
                defaultValue: 'Uniform',
                description: 'How image is stretched',
                category: PropertyCategory.Appearance,
                enumValues: ['None', 'Fill', 'Uniform', 'UniformToFill']
            }),
            new PropertyDefinition({
                name: 'stretchDirection',
                displayName: 'Stretch Direction',
                type: PropertyType.Enum,
                defaultValue: 'Both',
                description: 'Direction of stretching',
                category: PropertyCategory.Appearance,
                enumValues: ['UpOnly', 'DownOnly', 'Both']
            })
        ];
    }
    
    static get tags() {
        return ['image', 'picture', 'photo', 'graphic', 'bitmap'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const source = this.get('source');
        const stretch = this.get('stretch') || 'Uniform';
        
        const style = BorderStyle.Single;
        
        // Draw image placeholder
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        if (source) {
            // Draw image icon and source name
            const centerY = y + Math.floor(height / 2);
            const sourceText = typeof source === 'string' ? source : 'Image';
            const displayText = ASCIIRenderer.truncateText(`🖼 ${sourceText}`, width - 2);
            ASCIIRenderer.drawCenteredText(buffer, centerY, displayText, x + 1, width - 2);
        } else {
            // Draw placeholder pattern
            const centerY = y + Math.floor(height / 2);
            ASCIIRenderer.drawCenteredText(buffer, centerY - 1, '┌──────┐', x + 1, width - 2);
            ASCIIRenderer.drawCenteredText(buffer, centerY, '│ 🖼  │', x + 1, width - 2);
            ASCIIRenderer.drawCenteredText(buffer, centerY + 1, '└──────┘', x + 1, width - 2);
        }
        
        // Draw stretch mode indicator
        if (stretch !== 'Uniform') {
            const stretchText = `[${stretch}]`;
            ASCIIRenderer.drawText(buffer, x + 1, y + height - 2, stretchText);
        }
    }
}

// ==========================================
// AVATAR
// ==========================================

/**
 * User avatar display
 */
export class Avatar extends UIComponent {
    static get componentType() { return 'Avatar'; }
    static get displayName() { return 'Avatar'; }
    static get description() { return 'A user avatar display'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '👤'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 5; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'source',
                displayName: 'Source',
                type: PropertyType.ImageSource,
                defaultValue: null,
                description: 'Avatar image source',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'initials',
                displayName: 'Initials',
                type: PropertyType.String,
                defaultValue: 'AB',
                description: 'Initials to display',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'shape',
                displayName: 'Shape',
                type: PropertyType.Enum,
                defaultValue: 'Circle',
                description: 'Avatar shape',
                category: PropertyCategory.Appearance,
                enumValues: ['Circle', 'Square', 'Rounded']
            }),
            new PropertyDefinition({
                name: 'size',
                displayName: 'Size',
                type: PropertyType.Enum,
                defaultValue: 'Medium',
                description: 'Avatar size',
                category: PropertyCategory.Layout,
                enumValues: ['Small', 'Medium', 'Large', 'ExtraLarge']
            }),
            new PropertyDefinition({
                name: 'status',
                displayName: 'Status',
                type: PropertyType.Enum,
                defaultValue: 'None',
                description: 'Online status indicator',
                category: PropertyCategory.Data,
                enumValues: ['None', 'Online', 'Offline', 'Away', 'Busy']
            })
        ];
    }
    
    static get tags() {
        return ['avatar', 'user', 'profile', 'picture', 'person'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const initials = this.get('initials') || 'AB';
        const shape = this.get('shape') || 'Circle';
        const status = this.get('status') || 'None';
        
        // Status indicators
        const statusIcons = {
            'Online': '●',
            'Offline': '○',
            'Away': '◐',
            'Busy': '⊘'
        };
        
        if (shape === 'Circle' || shape === 'Rounded') {
            // Draw circular avatar
            if (height >= 3) {
                buffer[y][x + 1] = '╭';
                buffer[y][x + 2] = '─';
                buffer[y][x + 3] = '╮';
                
                buffer[y + 1][x] = ' ';
                buffer[y + 1][x + 1] = '│';
                buffer[y + 1][x + 2] = initials[0] || ' ';
                buffer[y + 1][x + 3] = '│';
                
                buffer[y + 2][x + 1] = '╰';
                buffer[y + 2][x + 2] = '─';
                buffer[y + 2][x + 3] = '╯';
            } else {
                buffer[y][x] = '(';
                buffer[y][x + 1] = initials.substring(0, 2);
                buffer[y][x + 3] = ')';
            }
        } else {
            // Draw square avatar
            const style = BorderStyle.Single;
            ASCIIRenderer.drawBox(buffer, x, y, 5, 3, style);
            buffer[y + 1][x + 2] = initials[0] || ' ';
        }
        
        // Draw status indicator
        if (status !== 'None' && statusIcons[status]) {
            buffer[y + height - 1][x + width - 1] = statusIcons[status];
        }
    }
}

// ==========================================
// ICON
// ==========================================

/**
 * Icon display control
 */
export class Icon extends UIComponent {
    static get componentType() { return 'Icon'; }
    static get displayName() { return 'Icon'; }
    static get description() { return 'An icon display control'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '⚙'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 3; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'data',
                displayName: 'Data',
                type: PropertyType.Geometry,
                defaultValue: null,
                description: 'Icon geometry data',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'glyph',
                displayName: 'Glyph',
                type: PropertyType.String,
                defaultValue: '★',
                description: 'Character glyph',
                category: PropertyCategory.Content
            }),
            CommonProperties.foreground('#000000')
        ];
    }
    
    static get tags() {
        return ['icon', 'glyph', 'symbol', 'graphic'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const glyph = this.get('glyph') || '★';
        
        // Center the glyph
        const centerX = x + Math.floor(width / 2);
        const centerY = y + Math.floor(height / 2);
        
        buffer[centerY][centerX] = glyph;
    }
}

// ==========================================
// FLYOUT
// ==========================================

/**
 * Flyout popup
 */
export class Flyout extends UIComponent {
    static get componentType() { return 'Flyout'; }
    static get displayName() { return 'Flyout'; }
    static get description() { return 'A flyout popup control'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '◫'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 10; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.content(null),
            new PropertyDefinition({
                name: 'placement',
                displayName: 'Placement',
                type: PropertyType.Enum,
                defaultValue: 'Bottom',
                description: 'Flyout placement',
                category: PropertyCategory.Layout,
                enumValues: ['Top', 'Bottom', 'Left', 'Right', 'Center', 'TopEdgeAlignedLeft', 'TopEdgeAlignedRight', 'BottomEdgeAlignedLeft', 'BottomEdgeAlignedRight', 'LeftEdgeAlignedTop', 'LeftEdgeAlignedBottom', 'RightEdgeAlignedTop', 'RightEdgeAlignedBottom']
            }),
            new PropertyDefinition({
                name: 'showMode',
                displayName: 'Show Mode',
                type: PropertyType.Enum,
                defaultValue: 'Standard',
                description: 'How flyout is shown',
                category: PropertyCategory.Behavior,
                enumValues: ['Standard', 'Transient', 'TransientWithDismissOnPointerMoveAway']
            }),
            new PropertyDefinition({
                name: 'isOpen',
                displayName: 'Is Open',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether flyout is open',
                category: PropertyCategory.Data
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'opened',
                displayName: 'Opened',
                description: 'Occurs when flyout opens',
                eventArgsType: 'EventArgs'
            }),
            new EventDefinition({
                name: 'closed',
                displayName: 'Closed',
                description: 'Occurs when flyout closes',
                eventArgsType: 'EventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['flyout', 'popup', 'overlay', 'panel'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const placement = this.get('placement') || 'Bottom';
        const style = BorderStyle.Rounded;
        
        // Draw flyout box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw pointer based on placement
        const centerX = x + Math.floor(width / 2);
        const centerY = y + Math.floor(height / 2);
        
        if (placement.includes('Top')) {
            buffer[y + height][centerX] = '▼';
        } else if (placement.includes('Bottom')) {
            buffer[y - 1] && (buffer[y - 1][centerX] = '▲');
        } else if (placement.includes('Left')) {
            buffer[centerY][x + width] = '▶';
        } else if (placement.includes('Right')) {
            buffer[centerY][x - 1] = '◀';
        }
        
        // Draw content placeholder
        ASCIIRenderer.drawCenteredText(buffer, centerY, 'Flyout Content', x + 1, width - 2);
    }
}

// ==========================================
// CAROUSEL
// ==========================================

/**
 * Carousel for cycling through items
 */
export class Carousel extends UIComponent {
    static get componentType() { return 'Carousel'; }
    static get displayName() { return 'Carousel'; }
    static get description() { return 'A carousel for cycling through items'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '⟨⟩'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 12; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Array,
                defaultValue: ['Slide 1', 'Slide 2', 'Slide 3'],
                description: 'Carousel items',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'selectedIndex',
                displayName: 'Selected Index',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Currently displayed index',
                category: PropertyCategory.Selection
            }),
            new PropertyDefinition({
                name: 'isVirtualized',
                displayName: 'Is Virtualized',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to virtualize items',
                category: PropertyCategory.Performance
            }),
            new PropertyDefinition({
                name: 'pageTransition',
                displayName: 'Page Transition',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Transition animation',
                category: PropertyCategory.Animation
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.selectionChanged()
        ];
    }
    
    static get tags() {
        return ['carousel', 'slideshow', 'gallery', 'slider'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const items = this.get('items') || [];
        const selectedIndex = this.get('selectedIndex') || 0;
        const style = BorderStyle.Single;
        
        // Draw carousel frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw navigation arrows
        const centerY = y + Math.floor(height / 2);
        buffer[centerY][x + 1] = '◀';
        buffer[centerY][x + width - 2] = '▶';
        
        // Draw current slide
        const currentItem = items[selectedIndex] || 'Empty';
        const contentWidth = width - 6;
        const displayText = ASCIIRenderer.truncateText(String(currentItem), contentWidth);
        ASCIIRenderer.drawCenteredText(buffer, centerY, displayText, x + 3, contentWidth);
        
        // Draw slide indicators
        const indicatorY = y + height - 2;
        const totalItems = items.length;
        const indicatorStart = x + Math.floor((width - totalItems * 2) / 2);
        
        for (let i = 0; i < totalItems; i++) {
            buffer[indicatorY][indicatorStart + i * 2] = i === selectedIndex ? '●' : '○';
        }
    }
}

// ==========================================
// TAG
// ==========================================

/**
 * Tag/chip display
 */
export class Tag extends UIComponent {
    static get componentType() { return 'Tag'; }
    static get displayName() { return 'Tag'; }
    static get description() { return 'A tag/chip display'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '🏷'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 10; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.content('Tag'),
            new PropertyDefinition({
                name: 'isClosable',
                displayName: 'Is Closable',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether tag can be closed',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'color',
                displayName: 'Color',
                type: PropertyType.Enum,
                defaultValue: 'Default',
                description: 'Tag color theme',
                category: PropertyCategory.Appearance,
                enumValues: ['Default', 'Blue', 'Green', 'Red', 'Yellow', 'Purple']
            }),
            new PropertyDefinition({
                name: 'icon',
                displayName: 'Icon',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Tag icon',
                category: PropertyCategory.Content
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'close',
                displayName: 'Close',
                description: 'Occurs when close button clicked',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['tag', 'chip', 'badge', 'label'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || 'Tag');
        const isClosable = this.get('isClosable');
        
        // Calculate available width
        const closeWidth = isClosable ? 2 : 0;
        const maxContentWidth = width - 2 - closeWidth;
        const displayContent = ASCIIRenderer.truncateText(content, maxContentWidth);
        
        // Draw tag
        buffer[y][x] = '⟨';
        ASCIIRenderer.drawText(buffer, x + 1, y, displayContent);
        
        if (isClosable) {
            buffer[y][x + 1 + displayContent.length] = '×';
            buffer[y][x + 2 + displayContent.length] = '⟩';
        } else {
            buffer[y][x + 1 + displayContent.length] = '⟩';
        }
    }
}

// ==========================================
// TREE DATA GRID
// ==========================================

/**
 * Hierarchical data grid with tree structure
 */
export class TreeDataGrid extends UIComponent {
    static get componentType() { return 'TreeDataGrid'; }
    static get displayName() { return 'Tree Data Grid'; }
    static get description() { return 'A hierarchical data grid combining tree view with tabular data'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '📊'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 50; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'source',
                displayName: 'Source',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Hierarchical data source',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'columns',
                displayName: 'Columns',
                type: PropertyType.Collection,
                defaultValue: [
                    { header: 'Name', width: '*' },
                    { header: 'Size', width: 80 },
                    { header: 'Modified', width: 120 }
                ],
                description: 'Column definitions',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'canUserResizeColumns',
                displayName: 'Can User Resize Columns',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether users can resize columns',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'canUserSortColumns',
                displayName: 'Can User Sort Columns',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether users can sort by columns',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'canUserReorderColumns',
                displayName: 'Can User Reorder Columns',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether users can reorder columns',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'showColumnHeaders',
                displayName: 'Show Column Headers',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show column headers',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'rowSelection',
                displayName: 'Row Selection',
                type: PropertyType.Enum,
                defaultValue: 'Single',
                description: 'Row selection mode',
                category: PropertyCategory.Selection,
                enumValues: ['Single', 'Multiple', 'Toggle', 'AlwaysSelected']
            }),
            new PropertyDefinition({
                name: 'autoExpandAll',
                displayName: 'Auto Expand All',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to expand all nodes by default',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'rowExpanding',
                displayName: 'Row Expanding',
                description: 'Occurs when a row is about to expand',
                eventArgsType: 'RowExpandingEventArgs'
            }),
            new EventDefinition({
                name: 'rowExpanded',
                displayName: 'Row Expanded',
                description: 'Occurs when a row has expanded',
                eventArgsType: 'RoutedEventArgs'
            }),
            new EventDefinition({
                name: 'rowCollapsing',
                displayName: 'Row Collapsing',
                description: 'Occurs when a row is about to collapse',
                eventArgsType: 'RoutedEventArgs'
            }),
            new EventDefinition({
                name: 'rowCollapsed',
                displayName: 'Row Collapsed',
                description: 'Occurs when a row has collapsed',
                eventArgsType: 'RoutedEventArgs'
            }),
            CommonEvents.selectionChanged()
        ];
    }
    
    static get tags() {
        return ['tree', 'datagrid', 'hierarchical', 'table', 'data'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const columns = this.get('columns') || [];
        const showHeaders = this.get('showColumnHeaders') !== false;
        const style = BorderStyle.Single;
        
        // Draw outer border
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Calculate column widths
        const numCols = columns.length || 3;
        const colWidth = Math.floor((width - 2) / numCols);
        
        // Draw header row
        if (showHeaders) {
            let colX = x + 1;
            for (let i = 0; i < numCols; i++) {
                const header = columns[i]?.header || `Col ${i + 1}`;
                const displayHeader = ASCIIRenderer.truncateText(header, colWidth - 1);
                ASCIIRenderer.drawText(buffer, colX, y + 1, displayHeader);
                
                if (i < numCols - 1) {
                    buffer[y + 1][colX + colWidth - 1] = '│';
                }
                colX += colWidth;
            }
            
            // Header separator
            for (let i = 1; i < width - 1; i++) {
                buffer[y + 2][x + i] = '─';
            }
            buffer[y + 2][x] = '├';
            buffer[y + 2][x + width - 1] = '┤';
        }
        
        // Draw tree data rows
        const startRow = showHeaders ? 3 : 1;
        const sampleData = [
            { indent: 0, expanded: true, name: '📁 Documents', size: '4 KB', date: '2024-01' },
            { indent: 1, expanded: false, name: '└ 📄 File1.txt', size: '2 KB', date: '2024-01' },
            { indent: 1, expanded: false, name: '└ 📄 File2.txt', size: '2 KB', date: '2024-01' },
            { indent: 0, expanded: true, name: '📁 Images', size: '8 KB', date: '2024-01' },
            { indent: 1, expanded: false, name: '└ 📷 Photo.jpg', size: '8 KB', date: '2024-01' }
        ];
        
        for (let i = 0; i < Math.min(sampleData.length, height - startRow - 1); i++) {
            const rowY = y + startRow + i;
            const row = sampleData[i];
            const indent = '  '.repeat(row.indent);
            
            let colX = x + 1;
            
            // Tree column with expand/collapse and indentation
            const treeName = indent + row.name;
            ASCIIRenderer.drawText(buffer, colX, rowY, ASCIIRenderer.truncateText(treeName, colWidth - 1));
            colX += colWidth;
            
            // Additional columns
            if (numCols > 1) {
                buffer[rowY][colX - 1] = '│';
                ASCIIRenderer.drawText(buffer, colX, rowY, ASCIIRenderer.truncateText(row.size, colWidth - 1));
                colX += colWidth;
            }
            
            if (numCols > 2) {
                buffer[rowY][colX - 1] = '│';
                ASCIIRenderer.drawText(buffer, colX, rowY, ASCIIRenderer.truncateText(row.date, colWidth - 1));
            }
        }
    }
}

// ==========================================
// ITEMS CONTROL
// ==========================================

/**
 * Base control for displaying a collection of items
 */
export class ItemsControl extends UIComponent {
    static get componentType() { return 'ItemsControl'; }
    static get displayName() { return 'Items Control'; }
    static get description() { return 'A base control for displaying a collection of items'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '≡'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 10; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Array,
                defaultValue: ['Item 1', 'Item 2', 'Item 3'],
                description: 'Collection of items to display',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'itemsSource',
                displayName: 'Items Source',
                type: PropertyType.Binding,
                defaultValue: null,
                description: 'Data binding source for items',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'itemTemplate',
                displayName: 'Item Template',
                type: PropertyType.Template,
                defaultValue: null,
                description: 'Template for rendering items',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'itemsPanel',
                displayName: 'Items Panel',
                type: PropertyType.Template,
                defaultValue: null,
                description: 'Panel template for arranging items',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'itemContainerTheme',
                displayName: 'Item Container Theme',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Theme for item containers',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'displayMemberBinding',
                displayName: 'Display Member Binding',
                type: PropertyType.Binding,
                defaultValue: null,
                description: 'Binding for display member',
                category: PropertyCategory.Data
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'containerPrepared',
                displayName: 'Container Prepared',
                description: 'Occurs when an item container is prepared',
                eventArgsType: 'ContainerPreparedEventArgs'
            }),
            new EventDefinition({
                name: 'containerIndexChanged',
                displayName: 'Container Index Changed',
                description: 'Occurs when a container index changes',
                eventArgsType: 'ContainerIndexChangedEventArgs'
            }),
            new EventDefinition({
                name: 'containerClearing',
                displayName: 'Container Clearing',
                description: 'Occurs when a container is being cleared',
                eventArgsType: 'ContainerClearingEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['items', 'control', 'collection', 'list', 'base'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const items = this.get('items') || [];
        const style = BorderStyle.Dashed;
        
        // Draw border
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw header
        ASCIIRenderer.drawCenteredText(buffer, y + 1, 'ItemsControl', x + 1, width - 2);
        
        // Draw items
        const maxItems = height - 4;
        for (let i = 0; i < Math.min(items.length, maxItems); i++) {
            const item = String(items[i]);
            const displayText = ASCIIRenderer.truncateText(item, width - 4);
            ASCIIRenderer.drawText(buffer, x + 2, y + 3 + i, `• ${displayText}`);
        }
        
        // Show count if items exceed visible space
        if (items.length > maxItems) {
            ASCIIRenderer.drawCenteredText(buffer, y + height - 2, `... +${items.length - maxItems} more`, x + 1, width - 2);
        }
    }
}

// ==========================================
// SELECTABLE TEXT BLOCK
// ==========================================

/**
 * Text block with selectable text
 */
export class SelectableTextBlock extends UIComponent {
    static get componentType() { return 'SelectableTextBlock'; }
    static get displayName() { return 'Selectable Text Block'; }
    static get description() { return 'A text block with selectable and copyable text'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '📝'; }
    static get contentModel() { return ContentModel.Text; }
    static get defaultWidth() { return 30; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'text',
                displayName: 'Text',
                type: PropertyType.String,
                defaultValue: 'Selectable text...',
                description: 'Text content',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'selectionStart',
                displayName: 'Selection Start',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Start index of selection',
                category: PropertyCategory.Selection
            }),
            new PropertyDefinition({
                name: 'selectionEnd',
                displayName: 'Selection End',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'End index of selection',
                category: PropertyCategory.Selection
            }),
            new PropertyDefinition({
                name: 'selectedText',
                displayName: 'Selected Text',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Currently selected text (read-only)',
                category: PropertyCategory.Selection,
                readOnly: true
            }),
            new PropertyDefinition({
                name: 'selectionBrush',
                displayName: 'Selection Brush',
                type: PropertyType.Brush,
                defaultValue: '#3399FF',
                description: 'Brush for selection highlight',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'textWrapping',
                displayName: 'Text Wrapping',
                type: PropertyType.Enum,
                defaultValue: 'NoWrap',
                description: 'Text wrapping mode',
                category: PropertyCategory.Layout,
                enumValues: ['NoWrap', 'Wrap', 'WrapWithOverflow']
            }),
            new PropertyDefinition({
                name: 'textAlignment',
                displayName: 'Text Alignment',
                type: PropertyType.Enum,
                defaultValue: 'Left',
                description: 'Text alignment',
                category: PropertyCategory.Layout,
                enumValues: ['Left', 'Center', 'Right', 'Justify']
            }),
            new PropertyDefinition({
                name: 'fontFamily',
                displayName: 'Font Family',
                type: PropertyType.FontFamily,
                defaultValue: 'Segoe UI',
                description: 'Font family',
                category: PropertyCategory.Typography
            }),
            new PropertyDefinition({
                name: 'fontSize',
                displayName: 'Font Size',
                type: PropertyType.Number,
                defaultValue: 14,
                description: 'Font size',
                category: PropertyCategory.Typography,
                minValue: 1
            }),
            new PropertyDefinition({
                name: 'fontWeight',
                displayName: 'Font Weight',
                type: PropertyType.Enum,
                defaultValue: 'Normal',
                description: 'Font weight',
                category: PropertyCategory.Typography,
                enumValues: ['Thin', 'Light', 'Normal', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black']
            }),
            new PropertyDefinition({
                name: 'fontStyle',
                displayName: 'Font Style',
                type: PropertyType.Enum,
                defaultValue: 'Normal',
                description: 'Font style',
                category: PropertyCategory.Typography,
                enumValues: ['Normal', 'Italic', 'Oblique']
            }),
            new PropertyDefinition({
                name: 'foreground',
                displayName: 'Foreground',
                type: PropertyType.Brush,
                defaultValue: '#000000',
                description: 'Text color',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'textDecorations',
                displayName: 'Text Decorations',
                type: PropertyType.Enum,
                defaultValue: 'None',
                description: 'Text decorations',
                category: PropertyCategory.Typography,
                enumValues: ['None', 'Underline', 'Strikethrough', 'Overline']
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'copyingToClipboard',
                displayName: 'Copying To Clipboard',
                description: 'Occurs when copying to clipboard',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['text', 'selectable', 'copy', 'textblock', 'label'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const text = String(this.get('text') || 'Selectable text...');
        const textWrapping = this.get('textWrapping') || 'NoWrap';
        const textAlignment = this.get('textAlignment') || 'Left';
        const selectionStart = this.get('selectionStart') || 0;
        const selectionEnd = this.get('selectionEnd') || 0;
        
        if (textWrapping === 'NoWrap') {
            // Single line
            const displayText = ASCIIRenderer.truncateText(text, width);
            
            // Draw with selection highlight
            for (let i = 0; i < displayText.length && i < width; i++) {
                const isSelected = i >= selectionStart && i < selectionEnd;
                buffer[y][x + i] = displayText[i];
                
                // Show selection indicator on line below
                if (isSelected && height > 1) {
                    buffer[y + 1][x + i] = '▀';
                }
            }
            
            // Show cursor if selection
            if (selectionEnd > selectionStart && width > text.length + 2) {
                buffer[y][x + width - 1] = '▌';
            }
        } else {
            // Wrapped text
            const lines = ASCIIRenderer.wrapText(text, width);
            
            for (let i = 0; i < Math.min(lines.length, height); i++) {
                const line = lines[i];
                let lineX = x;
                
                if (textAlignment === 'Center') {
                    lineX = x + Math.floor((width - line.length) / 2);
                } else if (textAlignment === 'Right') {
                    lineX = x + width - line.length;
                }
                
                ASCIIRenderer.drawText(buffer, lineX, y + i, line);
            }
        }
    }
}

// ==========================================
// CONTENT CONTROL
// ==========================================

/**
 * Control that displays a single piece of content
 */
export class ContentControl extends UIComponent {
    static get componentType() { return 'ContentControl'; }
    static get displayName() { return 'Content Control'; }
    static get description() { return 'A control that displays a single piece of content'; }
    static get category() { return UICategory.DataDisplay; }
    static get icon() { return '▢'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 5; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'content',
                displayName: 'Content',
                type: PropertyType.Object,
                defaultValue: 'Content',
                description: 'The content to display',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'contentTemplate',
                displayName: 'Content Template',
                type: PropertyType.Template,
                defaultValue: null,
                description: 'Template for displaying content',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'horizontalContentAlignment',
                displayName: 'Horizontal Content Alignment',
                type: PropertyType.Enum,
                defaultValue: 'Center',
                description: 'Horizontal content alignment',
                category: PropertyCategory.Layout,
                enumValues: ['Left', 'Center', 'Right', 'Stretch']
            }),
            new PropertyDefinition({
                name: 'verticalContentAlignment',
                displayName: 'Vertical Content Alignment',
                type: PropertyType.Enum,
                defaultValue: 'Center',
                description: 'Vertical content alignment',
                category: PropertyCategory.Layout,
                enumValues: ['Top', 'Center', 'Bottom', 'Stretch']
            }),
            new PropertyDefinition({
                name: 'padding',
                displayName: 'Padding',
                type: PropertyType.Thickness,
                defaultValue: '0',
                description: 'Padding around content',
                category: PropertyCategory.Layout
            })
        ];
    }
    
    static get tags() {
        return ['content', 'control', 'container', 'single'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || 'Content');
        const hAlign = this.get('horizontalContentAlignment') || 'Center';
        const vAlign = this.get('verticalContentAlignment') || 'Center';
        
        // Draw border
        ASCIIRenderer.drawBox(buffer, x, y, width, height, BorderStyle.Dashed);
        
        // Calculate content position based on alignment
        const contentWidth = Math.min(content.length, width - 2);
        const displayContent = ASCIIRenderer.truncateText(content, contentWidth);
        
        let contentX, contentY;
        
        // Horizontal alignment
        switch (hAlign) {
            case 'Left':
                contentX = x + 1;
                break;
            case 'Right':
                contentX = x + width - 1 - displayContent.length;
                break;
            case 'Center':
            default:
                contentX = x + Math.floor((width - displayContent.length) / 2);
                break;
        }
        
        // Vertical alignment
        switch (vAlign) {
            case 'Top':
                contentY = y + 1;
                break;
            case 'Bottom':
                contentY = y + height - 2;
                break;
            case 'Center':
            default:
                contentY = y + Math.floor(height / 2);
                break;
        }
        
        ASCIIRenderer.drawText(buffer, contentX, contentY, displayContent);
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    DataGrid,
    ListBox,
    ComboBox,
    Label,
    TextBlock,
    Image,
    Avatar,
    Icon,
    Flyout,
    Carousel,
    Tag,
    TreeDataGrid,
    ItemsControl,
    SelectableTextBlock,
    ContentControl
};
