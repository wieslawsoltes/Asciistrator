/**
 * Asciistrator - Container Controls
 * 
 * Container UI components: Window, Dialog, TabControl, Expander, etc.
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
// WINDOW
// ==========================================

/**
 * Window container control
 */
export class Window extends UIComponent {
    static get componentType() { return 'Window'; }
    static get displayName() { return 'Window'; }
    static get description() { return 'A window container with title bar'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '🗔'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 20; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.title('Window'),
            new PropertyDefinition({
                name: 'windowState',
                displayName: 'Window State',
                type: PropertyType.Enum,
                defaultValue: 'Normal',
                description: 'Current state of the window',
                category: PropertyCategory.Appearance,
                enumValues: ['Normal', 'Minimized', 'Maximized', 'FullScreen']
            }),
            new PropertyDefinition({
                name: 'windowStartupLocation',
                displayName: 'Startup Location',
                type: PropertyType.Enum,
                defaultValue: 'Manual',
                description: 'Initial position of the window',
                category: PropertyCategory.Layout,
                enumValues: ['Manual', 'CenterScreen', 'CenterOwner']
            }),
            new PropertyDefinition({
                name: 'canResize',
                displayName: 'Can Resize',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether the window can be resized',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'showInTaskbar',
                displayName: 'Show In Taskbar',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether shown in taskbar',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'topmost',
                displayName: 'Topmost',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether window stays on top',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'icon',
                displayName: 'Icon',
                type: PropertyType.Image,
                defaultValue: null,
                description: 'Window icon',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'systemDecorations',
                displayName: 'System Decorations',
                type: PropertyType.Enum,
                defaultValue: 'Full',
                description: 'System window decorations',
                category: PropertyCategory.Appearance,
                enumValues: ['None', 'BorderOnly', 'Full']
            }),
            new PropertyDefinition({
                name: 'extendClientAreaToDecorationsHint',
                displayName: 'Extend Client Area',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Extend content into title bar',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'transparencyLevelHint',
                displayName: 'Transparency Level',
                type: PropertyType.Enum,
                defaultValue: 'None',
                description: 'Window transparency level',
                category: PropertyCategory.Appearance,
                enumValues: ['None', 'Transparent', 'Blur', 'AcrylicBlur']
            }),
            new PropertyDefinition({
                name: 'showActivated',
                displayName: 'Show Activated',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to activate when shown',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'opened',
                displayName: 'Opened',
                description: 'Occurs when the window opens',
                eventArgsType: 'EventArgs'
            }),
            new EventDefinition({
                name: 'closing',
                displayName: 'Closing',
                description: 'Occurs when the window is closing',
                eventArgsType: 'CancelEventArgs'
            }),
            new EventDefinition({
                name: 'closed',
                displayName: 'Closed',
                description: 'Occurs when the window closes',
                eventArgsType: 'EventArgs'
            }),
            new EventDefinition({
                name: 'activated',
                displayName: 'Activated',
                description: 'Occurs when the window is activated',
                eventArgsType: 'EventArgs'
            }),
            new EventDefinition({
                name: 'deactivated',
                displayName: 'Deactivated',
                description: 'Occurs when the window is deactivated',
                eventArgsType: 'EventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['window', 'dialog', 'frame', 'container', 'toplevel'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const title = String(this.get('title') || 'Window');
        const windowState = this.get('windowState') || 'Normal';
        const canResize = this.get('canResize');
        
        const style = BorderStyle.Double;
        
        // Draw window frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw title bar
        const titleBarY = y;
        
        // Draw title
        const maxTitleWidth = width - 12;
        const displayTitle = ASCIIRenderer.truncateText(title, maxTitleWidth);
        ASCIIRenderer.drawText(buffer, x + 2, titleBarY, displayTitle);
        
        // Draw window buttons (minimize, maximize, close)
        const buttonX = x + width - 8;
        buffer[titleBarY][buttonX] = '─';
        buffer[titleBarY][buttonX + 2] = '□';
        buffer[titleBarY][buttonX + 4] = '✕';
        
        // Draw title bar separator
        for (let i = 1; i < width - 1; i++) {
            buffer[y + 1][x + i] = '─';
        }
        buffer[y + 1][x] = '╟';
        buffer[y + 1][x + width - 1] = '╢';
        
        // Draw status bar if there's space
        if (height > 5) {
            for (let i = 1; i < width - 1; i++) {
                buffer[y + height - 2][x + i] = '─';
            }
            buffer[y + height - 2][x] = '╟';
            buffer[y + height - 2][x + width - 1] = '╢';
        }
        
        // Draw resize grip if can resize
        if (canResize && height > 4) {
            buffer[y + height - 1][x + width - 2] = '◢';
        }
    }
}

// ==========================================
// DIALOG
// ==========================================

/**
 * Modal dialog window
 */
export class Dialog extends Window {
    static get componentType() { return 'Dialog'; }
    static get displayName() { return 'Dialog'; }
    static get description() { return 'A modal dialog window'; }
    static get defaultWidth() { return 35; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions.filter(p => 
                !['canResize', 'showInTaskbar', 'windowStartupLocation'].includes(p.name)
            ),
            new PropertyDefinition({
                name: 'canResize',
                displayName: 'Can Resize',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the dialog can be resized',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'showInTaskbar',
                displayName: 'Show In Taskbar',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether shown in taskbar',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'windowStartupLocation',
                displayName: 'Startup Location',
                type: PropertyType.Enum,
                defaultValue: 'CenterOwner',
                description: 'Initial position of the dialog',
                category: PropertyCategory.Layout,
                enumValues: ['Manual', 'CenterScreen', 'CenterOwner']
            }),
            new PropertyDefinition({
                name: 'dialogResult',
                displayName: 'Dialog Result',
                type: PropertyType.NullableBoolean,
                defaultValue: null,
                description: 'Result of the dialog',
                category: PropertyCategory.Data
            })
        ];
    }
    
    static get tags() {
        return ['dialog', 'modal', 'popup', 'prompt', 'message'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const title = String(this.get('title') || 'Dialog');
        
        const style = BorderStyle.Double;
        
        // Draw dialog frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw title bar
        const maxTitleWidth = width - 8;
        const displayTitle = ASCIIRenderer.truncateText(title, maxTitleWidth);
        ASCIIRenderer.drawText(buffer, x + 2, y, displayTitle);
        
        // Draw close button only
        buffer[y][x + width - 3] = '✕';
        
        // Draw title bar separator
        for (let i = 1; i < width - 1; i++) {
            buffer[y + 1][x + i] = '─';
        }
        buffer[y + 1][x] = '╟';
        buffer[y + 1][x + width - 1] = '╢';
        
        // Draw button area separator
        if (height > 6) {
            for (let i = 1; i < width - 1; i++) {
                buffer[y + height - 4][x + i] = '─';
            }
            buffer[y + height - 4][x] = '╟';
            buffer[y + height - 4][x + width - 1] = '╢';
            
            // Draw OK/Cancel buttons
            const btnWidth = 8;
            const okX = x + Math.floor(width / 2) - btnWidth - 1;
            const cancelX = x + Math.floor(width / 2) + 2;
            
            ASCIIRenderer.drawText(buffer, okX, y + height - 2, '[ OK ]');
            ASCIIRenderer.drawText(buffer, cancelX, y + height - 2, '[Cancel]');
        }
    }
}

// ==========================================
// TAB CONTROL
// ==========================================

/**
 * Tab control for multiple pages
 */
export class TabControl extends UIComponent {
    static get componentType() { return 'TabControl'; }
    static get displayName() { return 'Tab Control'; }
    static get description() { return 'A control with multiple tabbed pages'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '📑'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'selectedIndex',
                displayName: 'Selected Index',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Index of the selected tab',
                category: PropertyCategory.Data,
                minValue: -1
            }),
            new PropertyDefinition({
                name: 'selectedItem',
                displayName: 'Selected Item',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'The selected tab item',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'tabStripPlacement',
                displayName: 'Tab Strip Placement',
                type: PropertyType.Enum,
                defaultValue: 'Top',
                description: 'Position of the tab strip',
                category: PropertyCategory.Layout,
                enumValues: ['Top', 'Bottom', 'Left', 'Right']
            }),
            new PropertyDefinition({
                name: 'contentTemplate',
                displayName: 'Content Template',
                type: PropertyType.Template,
                defaultValue: null,
                description: 'Template for tab content',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'itemsSource',
                displayName: 'Items Source',
                type: PropertyType.Collection,
                defaultValue: [],
                description: 'Source collection for tabs',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'tabs',
                displayName: 'Tabs',
                type: PropertyType.Collection,
                defaultValue: [{ header: 'Tab 1' }, { header: 'Tab 2' }, { header: 'Tab 3' }],
                description: 'The tab items',
                category: PropertyCategory.Content
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
        return ['tabs', 'pages', 'navigation', 'container', 'multipage'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const tabs = this.get('tabs') || [{ header: 'Tab 1' }, { header: 'Tab 2' }];
        const selectedIndex = this.get('selectedIndex') || 0;
        const tabStripPlacement = this.get('tabStripPlacement') || 'Top';
        const isEnabled = this.get('isEnabled');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        
        if (tabStripPlacement === 'Top') {
            // Draw tabs
            let tabX = x;
            for (let i = 0; i < tabs.length; i++) {
                const tab = tabs[i];
                const header = String(tab.header || `Tab ${i + 1}`);
                const tabWidth = header.length + 4;
                const isSelected = i === selectedIndex;
                
                // Draw tab
                buffer[y][tabX] = isSelected ? '┌' : '╭';
                for (let j = 1; j < tabWidth - 1; j++) {
                    buffer[y][tabX + j] = isSelected ? '─' : '─';
                }
                buffer[y][tabX + tabWidth - 1] = isSelected ? '┐' : '╮';
                
                // Draw tab sides and content
                buffer[y + 1][tabX] = '│';
                ASCIIRenderer.drawText(buffer, tabX + 2, y + 1, header);
                buffer[y + 1][tabX + tabWidth - 1] = '│';
                
                // Draw tab bottom (connects to content)
                if (isSelected) {
                    buffer[y + 2][tabX] = '┘';
                    for (let j = 1; j < tabWidth - 1; j++) {
                        buffer[y + 2][tabX + j] = ' ';
                    }
                    buffer[y + 2][tabX + tabWidth - 1] = '└';
                } else {
                    for (let j = 0; j < tabWidth; j++) {
                        buffer[y + 2][tabX + j] = '─';
                    }
                }
                
                tabX += tabWidth;
            }
            
            // Complete the tab strip line
            for (let i = tabX; i < x + width - 1; i++) {
                buffer[y + 2][x + i - x] = '─';
            }
            
            // Draw content area
            for (let row = 3; row < height; row++) {
                buffer[y + row][x] = '│';
                buffer[y + row][x + width - 1] = '│';
            }
            
            // Draw bottom border
            buffer[y + height - 1][x] = '└';
            for (let i = 1; i < width - 1; i++) {
                buffer[y + height - 1][x + i] = '─';
            }
            buffer[y + height - 1][x + width - 1] = '┘';
            
            // Fix corners
            buffer[y + 2][x] = '┌';
            buffer[y + 2][x + width - 1] = '┐';
        } else {
            // Simplified rendering for other placements
            ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
            
            const tabText = tabs.map((t, i) => 
                i === selectedIndex ? `[${t.header || 'Tab'}]` : ` ${t.header || 'Tab'} `
            ).join(' ');
            
            ASCIIRenderer.drawText(buffer, x + 2, y, ASCIIRenderer.truncateText(tabText, width - 4));
        }
    }
}

// ==========================================
// TAB ITEM
// ==========================================

/**
 * Individual tab within a TabControl
 */
export class TabItem extends UIComponent {
    static get componentType() { return 'TabItem'; }
    static get displayName() { return 'Tab Item'; }
    static get description() { return 'An individual tab page'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '📄'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 30; }
    static get defaultHeight() { return 12; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'header',
                displayName: 'Header',
                type: PropertyType.Object,
                defaultValue: 'Tab',
                description: 'Content of the tab header',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'isSelected',
                displayName: 'Is Selected',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether this tab is selected',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'headerTemplate',
                displayName: 'Header Template',
                type: PropertyType.Template,
                defaultValue: null,
                description: 'Template for the header',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'isClosable',
                displayName: 'Is Closable',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the tab can be closed',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get tags() {
        return ['tab', 'page', 'item', 'panel'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const header = String(this.get('header') || 'Tab');
        const isSelected = this.get('isSelected');
        const isClosable = this.get('isClosable');
        
        const style = isSelected ? BorderStyle.Single : BorderStyle.Dashed;
        
        // Draw tab content area
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw header at top
        const headerText = isClosable ? header + ' ✕' : header;
        ASCIIRenderer.drawText(buffer, x + 2, y, ASCIIRenderer.truncateText(headerText, width - 4));
    }
}

// ==========================================
// EXPANDER
// ==========================================

/**
 * Collapsible content container
 */
export class Expander extends UIComponent {
    static get componentType() { return 'Expander'; }
    static get displayName() { return 'Expander'; }
    static get description() { return 'A collapsible content container'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '▼'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 8; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'header',
                displayName: 'Header',
                type: PropertyType.Object,
                defaultValue: 'Expander',
                description: 'Content of the header',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'isExpanded',
                displayName: 'Is Expanded',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether the content is expanded',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'expandDirection',
                displayName: 'Expand Direction',
                type: PropertyType.Enum,
                defaultValue: 'Down',
                description: 'Direction the expander expands',
                category: PropertyCategory.Layout,
                enumValues: ['Up', 'Down', 'Left', 'Right']
            }),
            new PropertyDefinition({
                name: 'headerTemplate',
                displayName: 'Header Template',
                type: PropertyType.Template,
                defaultValue: null,
                description: 'Template for the header',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'contentTransition',
                displayName: 'Content Transition',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Transition for expanding/collapsing',
                category: PropertyCategory.Animation
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'expanding',
                displayName: 'Expanding',
                description: 'Occurs when the expander starts expanding',
                eventArgsType: 'CancelRoutedEventArgs'
            }),
            new EventDefinition({
                name: 'expanded',
                displayName: 'Expanded',
                description: 'Occurs when the expander is fully expanded',
                eventArgsType: 'RoutedEventArgs'
            }),
            new EventDefinition({
                name: 'collapsing',
                displayName: 'Collapsing',
                description: 'Occurs when the expander starts collapsing',
                eventArgsType: 'CancelRoutedEventArgs'
            }),
            new EventDefinition({
                name: 'collapsed',
                displayName: 'Collapsed',
                description: 'Occurs when the expander is fully collapsed',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['expander', 'collapse', 'accordion', 'fold', 'toggle'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const header = String(this.get('header') || 'Expander');
        const isExpanded = this.get('isExpanded');
        const expandDirection = this.get('expandDirection') || 'Down';
        
        const style = BorderStyle.Single;
        const arrow = isExpanded ? '▼' : '►';
        
        // Draw header
        buffer[y][x] = style.topLeft;
        for (let i = 1; i < width - 1; i++) {
            buffer[y][x + i] = style.top;
        }
        buffer[y][x + width - 1] = style.topRight;
        
        buffer[y + 1][x] = style.left;
        buffer[y + 1][x + 1] = arrow;
        const maxHeaderWidth = width - 5;
        ASCIIRenderer.drawText(buffer, x + 3, y + 1, ASCIIRenderer.truncateText(header, maxHeaderWidth));
        buffer[y + 1][x + width - 1] = style.right;
        
        if (isExpanded) {
            // Draw separator
            buffer[y + 2][x] = style.left;
            for (let i = 1; i < width - 1; i++) {
                buffer[y + 2][x + i] = '─';
            }
            buffer[y + 2][x + width - 1] = style.right;
            
            // Draw content area
            for (let row = 3; row < height - 1; row++) {
                buffer[y + row][x] = style.left;
                buffer[y + row][x + width - 1] = style.right;
            }
            
            // Draw bottom
            buffer[y + height - 1][x] = style.bottomLeft;
            for (let i = 1; i < width - 1; i++) {
                buffer[y + height - 1][x + i] = style.bottom;
            }
            buffer[y + height - 1][x + width - 1] = style.bottomRight;
        } else {
            // Collapsed state - just close the header
            buffer[y + 2][x] = style.bottomLeft;
            for (let i = 1; i < width - 1; i++) {
                buffer[y + 2][x + i] = style.bottom;
            }
            buffer[y + 2][x + width - 1] = style.bottomRight;
        }
    }
}

// ==========================================
// GROUP BOX
// ==========================================

/**
 * Bordered grouping container with header
 */
export class GroupBox extends UIComponent {
    static get componentType() { return 'GroupBox'; }
    static get displayName() { return 'Group Box'; }
    static get description() { return 'A bordered container with a header'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '▢'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 10; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'header',
                displayName: 'Header',
                type: PropertyType.Object,
                defaultValue: 'Group',
                description: 'Content of the header',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'headerTemplate',
                displayName: 'Header Template',
                type: PropertyType.Template,
                defaultValue: null,
                description: 'Template for the header',
                category: PropertyCategory.Content
            })
        ];
    }
    
    static get tags() {
        return ['group', 'box', 'frame', 'container', 'border'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const header = String(this.get('header') || 'Group');
        
        const style = BorderStyle.Single;
        
        // Draw frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw header embedded in top border
        const maxHeaderWidth = width - 6;
        const displayHeader = ASCIIRenderer.truncateText(header, maxHeaderWidth);
        ASCIIRenderer.drawText(buffer, x + 3, y, ` ${displayHeader} `);
    }
}

// ==========================================
// CARD
// ==========================================

/**
 * Card-style content container
 */
export class Card extends UIComponent {
    static get componentType() { return 'Card'; }
    static get displayName() { return 'Card'; }
    static get description() { return 'A card-style content container'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '▢'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 12; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'header',
                displayName: 'Header',
                type: PropertyType.Object,
                defaultValue: 'Card Title',
                description: 'Card header content',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'subheader',
                displayName: 'Subheader',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Card subheader text',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'thumbnail',
                displayName: 'Thumbnail',
                type: PropertyType.Image,
                defaultValue: null,
                description: 'Card thumbnail image',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'actions',
                displayName: 'Actions',
                type: PropertyType.Collection,
                defaultValue: [],
                description: 'Card action buttons',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'isClickable',
                displayName: 'Is Clickable',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the card is clickable',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'elevation',
                displayName: 'Elevation',
                type: PropertyType.Integer,
                defaultValue: 1,
                description: 'Shadow elevation level',
                category: PropertyCategory.Appearance,
                minValue: 0,
                maxValue: 5
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.click()
        ];
    }
    
    static get tags() {
        return ['card', 'tile', 'panel', 'container', 'material'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const header = String(this.get('header') || 'Card');
        const subheader = this.get('subheader') || '';
        const elevation = this.get('elevation') || 1;
        
        const style = BorderStyle.Rounded;
        
        // Draw card frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw shadow based on elevation (with bounds checking)
        if (elevation > 0 && height > 3 && width > 3) {
            const bufferHeight = buffer.length;
            const bufferWidth = buffer[0]?.length || 0;
            for (let row = 1; row < height; row++) {
                if (y + row < bufferHeight && x + width < bufferWidth) {
                    buffer[y + row][x + width] = '░';
                }
            }
            for (let col = 1; col < width + 1; col++) {
                if (y + height < bufferHeight && x + col < bufferWidth) {
                    buffer[y + height][x + col] = '░';
                }
            }
        }
        
        // Draw header
        const headerY = y + 1;
        ASCIIRenderer.drawText(buffer, x + 2, headerY, ASCIIRenderer.truncateText(header, width - 4));
        
        // Draw subheader if present
        if (subheader && height > 4) {
            ASCIIRenderer.drawText(buffer, x + 2, headerY + 1, ASCIIRenderer.truncateText(subheader, width - 4));
        }
        
        // Draw separator
        if (height > 5) {
            const sepY = subheader ? headerY + 2 : headerY + 1;
            for (let i = 1; i < width - 1; i++) {
                buffer[sepY][x + i] = '─';
            }
        }
    }
}

// ==========================================
// SCROLL VIEWER
// ==========================================

/**
 * Scrollable content container
 */
export class ScrollViewer extends UIComponent {
    static get componentType() { return 'ScrollViewer'; }
    static get displayName() { return 'Scroll Viewer'; }
    static get description() { return 'A scrollable content container'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '⬍'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'horizontalScrollBarVisibility',
                displayName: 'Horizontal ScrollBar Visibility',
                type: PropertyType.Enum,
                defaultValue: 'Auto',
                description: 'Visibility of horizontal scrollbar',
                category: PropertyCategory.Appearance,
                enumValues: ['Disabled', 'Auto', 'Hidden', 'Visible']
            }),
            new PropertyDefinition({
                name: 'verticalScrollBarVisibility',
                displayName: 'Vertical ScrollBar Visibility',
                type: PropertyType.Enum,
                defaultValue: 'Auto',
                description: 'Visibility of vertical scrollbar',
                category: PropertyCategory.Appearance,
                enumValues: ['Disabled', 'Auto', 'Hidden', 'Visible']
            }),
            new PropertyDefinition({
                name: 'horizontalOffset',
                displayName: 'Horizontal Offset',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Current horizontal scroll position',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'verticalOffset',
                displayName: 'Vertical Offset',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Current vertical scroll position',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'allowAutoHide',
                displayName: 'Allow Auto Hide',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether scrollbars auto-hide',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isScrollChainingEnabled',
                displayName: 'Is Scroll Chaining Enabled',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether scroll chains to parent',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.scroll()
        ];
    }
    
    static get tags() {
        return ['scroll', 'viewer', 'container', 'overflow', 'pan'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const hScrollVisibility = this.get('horizontalScrollBarVisibility') || 'Auto';
        const vScrollVisibility = this.get('verticalScrollBarVisibility') || 'Auto';
        const showHScroll = hScrollVisibility === 'Visible' || hScrollVisibility === 'Auto';
        const showVScroll = vScrollVisibility === 'Visible' || vScrollVisibility === 'Auto';
        
        const style = BorderStyle.Single;
        
        // Calculate content area
        const contentWidth = showVScroll ? width - 1 : width;
        const contentHeight = showHScroll ? height - 1 : height;
        
        // Draw frame
        ASCIIRenderer.drawBox(buffer, x, y, contentWidth, contentHeight, style);
        
        // Draw vertical scrollbar
        if (showVScroll) {
            buffer[y][x + width - 1] = '▲';
            for (let row = 1; row < height - 2; row++) {
                buffer[y + row][x + width - 1] = '░';
            }
            buffer[y + Math.floor(height / 3)][x + width - 1] = '█';
            buffer[y + height - 2][x + width - 1] = '▼';
        }
        
        // Draw horizontal scrollbar
        if (showHScroll) {
            buffer[y + height - 1][x] = '◄';
            for (let col = 1; col < width - 2; col++) {
                buffer[y + height - 1][x + col] = '░';
            }
            buffer[y + height - 1][x + Math.floor(width / 3)] = '█';
            buffer[y + height - 1][x + width - 2] = '►';
        }
        
        // Draw corner if both scrollbars visible
        if (showHScroll && showVScroll) {
            buffer[y + height - 1][x + width - 1] = '┘';
        }
    }
}

// ==========================================
// BORDER
// ==========================================

/**
 * Simple border container
 */
export class Border extends UIComponent {
    static get componentType() { return 'Border'; }
    static get displayName() { return 'Border'; }
    static get description() { return 'A simple border container'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '▢'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 8; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'borderThickness',
                displayName: 'Border Thickness',
                type: PropertyType.Thickness,
                defaultValue: { left: 1, top: 1, right: 1, bottom: 1 },
                description: 'Thickness of the border',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'borderBrush',
                displayName: 'Border Brush',
                type: PropertyType.Brush,
                defaultValue: '#000000',
                description: 'Brush for the border',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'cornerRadius',
                displayName: 'Corner Radius',
                type: PropertyType.CornerRadius,
                defaultValue: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
                description: 'Radius of rounded corners',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'boxShadow',
                displayName: 'Box Shadow',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Shadow effect',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get tags() {
        return ['border', 'frame', 'container', 'decoration'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const cornerRadius = this.get('cornerRadius');
        const hasRadius = cornerRadius && (cornerRadius.topLeft > 0 || cornerRadius.topRight > 0);
        
        const style = hasRadius ? BorderStyle.Rounded : BorderStyle.Single;
        
        // Draw border
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
    }
}

// ==========================================
// VIEWBOX
// ==========================================

/**
 * Container that scales content to fit
 */
export class Viewbox extends UIComponent {
    static get componentType() { return 'Viewbox'; }
    static get displayName() { return 'Viewbox'; }
    static get description() { return 'A container that scales content to fit'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '⤢'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'stretch',
                displayName: 'Stretch',
                type: PropertyType.Enum,
                defaultValue: 'Uniform',
                description: 'How content is stretched to fill',
                category: PropertyCategory.Layout,
                enumValues: ['None', 'Fill', 'Uniform', 'UniformToFill']
            }),
            new PropertyDefinition({
                name: 'stretchDirection',
                displayName: 'Stretch Direction',
                type: PropertyType.Enum,
                defaultValue: 'Both',
                description: 'Direction scaling is allowed',
                category: PropertyCategory.Layout,
                enumValues: ['UpOnly', 'DownOnly', 'Both']
            })
        ];
    }
    
    static get tags() {
        return ['viewbox', 'scale', 'fit', 'container', 'stretch'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const stretch = this.get('stretch') || 'Uniform';
        
        const style = BorderStyle.Dashed;
        
        // Draw viewbox frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw stretch mode indicator
        const modeText = `[${stretch}]`;
        const textX = x + Math.floor((width - modeText.length) / 2);
        ASCIIRenderer.drawText(buffer, textX, y + Math.floor(height / 2), modeText);
        
        // Draw scale arrows
        const centerY = y + Math.floor(height / 2);
        const centerX = x + Math.floor(width / 2);
        
        buffer[y + 2][centerX] = '↑';
        buffer[y + height - 3][centerX] = '↓';
        buffer[centerY][x + 2] = '←';
        buffer[centerY][x + width - 3] = '→';
    }
}

// ==========================================
// POPUP
// ==========================================

/**
 * Popup overlay control
 */
export class Popup extends UIComponent {
    static get componentType() { return 'Popup'; }
    static get displayName() { return 'Popup'; }
    static get description() { return 'A popup overlay control'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '◫'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 10; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'child',
                displayName: 'Child',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Popup content',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'isOpen',
                displayName: 'Is Open',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether popup is open',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'placement',
                displayName: 'Placement',
                type: PropertyType.Enum,
                defaultValue: 'Bottom',
                description: 'Popup placement relative to target',
                category: PropertyCategory.Layout,
                enumValues: ['Top', 'Bottom', 'Left', 'Right', 'Center', 'Pointer', 'TopEdgeAlignedLeft', 'TopEdgeAlignedRight', 'BottomEdgeAlignedLeft', 'BottomEdgeAlignedRight', 'LeftEdgeAlignedTop', 'LeftEdgeAlignedBottom', 'RightEdgeAlignedTop', 'RightEdgeAlignedBottom', 'AnchorAndGravity']
            }),
            new PropertyDefinition({
                name: 'placementTarget',
                displayName: 'Placement Target',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Target element for placement',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'horizontalOffset',
                displayName: 'Horizontal Offset',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Horizontal offset from target',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'verticalOffset',
                displayName: 'Vertical Offset',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Vertical offset from target',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'isLightDismissEnabled',
                displayName: 'Is Light Dismiss Enabled',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to close when clicked outside',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'staysOpen',
                displayName: 'Stays Open',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether popup stays open when focus lost',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'topmost',
                displayName: 'Topmost',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether popup is topmost',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'windowManagerAddShadowHint',
                displayName: 'Add Shadow',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to add shadow effect',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'opened',
                displayName: 'Opened',
                description: 'Occurs when popup is opened',
                eventArgsType: 'EventArgs'
            }),
            new EventDefinition({
                name: 'closed',
                displayName: 'Closed',
                description: 'Occurs when popup is closed',
                eventArgsType: 'EventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['closed', 'open'];
    }
    
    static get tags() {
        return ['popup', 'overlay', 'dropdown', 'floating', 'modal'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const isOpen = this.get('isOpen');
        const placement = this.get('placement') || 'Bottom';
        
        const style = BorderStyle.Rounded;
        const bufferHeight = buffer.length;
        const bufferWidth = buffer[0]?.length || 0;
        
        // Draw popup box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw shadow effect (with bounds checking)
        for (let row = 1; row < height; row++) {
            if (y + row < bufferHeight && x + width < bufferWidth) {
                buffer[y + row][x + width] = '░';
            }
        }
        for (let col = 1; col < width + 1; col++) {
            if (y + height < bufferHeight && x + col < bufferWidth) {
                buffer[y + height][x + col] = '░';
            }
        }
        
        // Draw pointer based on placement (with bounds checking)
        const centerX = x + Math.floor(width / 2);
        const centerY = y + Math.floor(height / 2);
        
        if (placement.includes('Top')) {
            if (y + height < bufferHeight && centerX < bufferWidth) {
                buffer[y + height][centerX] = '▼';
            }
        } else if (placement.includes('Bottom')) {
            if (y > 0 && centerX < bufferWidth) buffer[y - 1][centerX] = '▲';
        } else if (placement.includes('Left')) {
            if (centerY < bufferHeight && x + width < bufferWidth) {
                buffer[centerY][x + width] = '▶';
            }
        } else if (placement.includes('Right')) {
            if (x > 0 && centerY < bufferHeight) buffer[centerY][x - 1] = '◀';
        }
        
        // Draw content placeholder
        const statusText = isOpen ? '[OPEN]' : '[CLOSED]';
        ASCIIRenderer.drawCenteredText(buffer, centerY, statusText, x + 1, width - 2);
        ASCIIRenderer.drawCenteredText(buffer, y + 1, 'Popup', x + 1, width - 2);
    }
}

// ==========================================
// FLIP VIEW
// ==========================================

/**
 * FlipView for displaying one item at a time with navigation
 */
export class FlipView extends UIComponent {
    static get componentType() { return 'FlipView'; }
    static get displayName() { return 'Flip View'; }
    static get description() { return 'A view that displays one item at a time with flip navigation'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '⟨⟩'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Array,
                defaultValue: ['Page 1', 'Page 2', 'Page 3'],
                description: 'Items to display',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'selectedIndex',
                displayName: 'Selected Index',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Index of currently displayed item',
                category: PropertyCategory.Selection
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
                name: 'showNavigationButtons',
                displayName: 'Show Navigation Buttons',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show prev/next buttons',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'showIndicators',
                displayName: 'Show Indicators',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show page indicators',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'useTouchAnimationsForAllNavigation',
                displayName: 'Use Touch Animations',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Use smooth touch animations',
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
        return ['flipview', 'carousel', 'slideshow', 'gallery', 'swipe'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const items = this.get('items') || [];
        const selectedIndex = this.get('selectedIndex') || 0;
        const showNavigationButtons = this.get('showNavigationButtons') !== false;
        const showIndicators = this.get('showIndicators') !== false;
        
        const style = BorderStyle.Single;
        
        // Draw frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw navigation buttons
        if (showNavigationButtons) {
            const navY = y + Math.floor(height / 2);
            buffer[navY][x + 1] = '◀';
            buffer[navY][x + width - 2] = '▶';
        }
        
        // Draw current item
        const currentItem = items[selectedIndex] || 'Empty';
        const contentWidth = width - 6;
        const displayText = ASCIIRenderer.truncateText(String(currentItem), contentWidth);
        const contentY = y + Math.floor(height / 2);
        ASCIIRenderer.drawCenteredText(buffer, contentY, displayText, x + 3, contentWidth);
        
        // Draw page indicators at bottom
        if (showIndicators && items.length > 1) {
            const indicatorY = y + height - 2;
            const indicatorStart = x + Math.floor((width - items.length * 2) / 2);
            
            for (let i = 0; i < Math.min(items.length, Math.floor((width - 4) / 2)); i++) {
                buffer[indicatorY][indicatorStart + i * 2] = i === selectedIndex ? '●' : '○';
            }
        }
        
        // Draw page number
        const pageText = `${selectedIndex + 1} / ${items.length}`;
        ASCIIRenderer.drawCenteredText(buffer, y + 2, pageText, x + 1, width - 2);
    }
}

// ==========================================
// HEADERED CONTENT CONTROL
// ==========================================

/**
 * Base control with header and content
 */
export class HeaderedContentControl extends UIComponent {
    static get componentType() { return 'HeaderedContentControl'; }
    static get displayName() { return 'Headered Content Control'; }
    static get description() { return 'A control with header and content areas'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '▤'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 30; }
    static get defaultHeight() { return 10; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'header',
                displayName: 'Header',
                type: PropertyType.Object,
                defaultValue: 'Header',
                description: 'Header content',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'headerTemplate',
                displayName: 'Header Template',
                type: PropertyType.Template,
                defaultValue: null,
                description: 'Template for header',
                category: PropertyCategory.Appearance
            }),
            CommonProperties.content(null)
        ];
    }
    
    static get tags() {
        return ['header', 'content', 'control', 'container'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const header = String(this.get('header') || 'Header');
        
        const style = BorderStyle.Single;
        
        // Draw frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw header
        const maxHeaderWidth = width - 4;
        const displayHeader = ASCIIRenderer.truncateText(header, maxHeaderWidth);
        ASCIIRenderer.drawText(buffer, x + 2, y + 1, displayHeader);
        
        // Draw header separator
        buffer[y + 2][x] = '├';
        for (let i = 1; i < width - 1; i++) {
            buffer[y + 2][x + i] = '─';
        }
        buffer[y + 2][x + width - 1] = '┤';
        
        // Content area placeholder
        ASCIIRenderer.drawCenteredText(buffer, y + Math.floor((height + 2) / 2), '[Content]', x + 1, width - 2);
    }
}

// ==========================================
// OVERLAY
// ==========================================

/**
 * Overlay layer for modal content
 */
export class Overlay extends UIComponent {
    static get componentType() { return 'Overlay'; }
    static get displayName() { return 'Overlay'; }
    static get description() { return 'An overlay layer for modal content'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '▦'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 20; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'isVisible',
                displayName: 'Is Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether overlay is visible',
                category: PropertyCategory.Common
            }),
            CommonProperties.background('rgba(0,0,0,0.5)'),
            CommonProperties.content(null)
        ];
    }
    
    static get tags() {
        return ['overlay', 'modal', 'backdrop', 'dim', 'cover'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const isVisible = this.get('isVisible') !== false;
        
        if (isVisible) {
            // Fill with semi-transparent overlay pattern
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    buffer[y + row][x + col] = '░';
                }
            }
            
            // Draw content area in center
            const contentWidth = Math.floor(width * 0.6);
            const contentHeight = Math.floor(height * 0.6);
            const contentX = x + Math.floor((width - contentWidth) / 2);
            const contentY = y + Math.floor((height - contentHeight) / 2);
            
            // Clear content area
            for (let row = 0; row < contentHeight; row++) {
                for (let col = 0; col < contentWidth; col++) {
                    buffer[contentY + row][contentX + col] = ' ';
                }
            }
            
            // Draw content box
            ASCIIRenderer.drawBox(buffer, contentX, contentY, contentWidth, contentHeight, BorderStyle.Double);
            ASCIIRenderer.drawCenteredText(buffer, contentY + Math.floor(contentHeight / 2), '[Content]', contentX + 1, contentWidth - 2);
        }
    }
}

// ==========================================
// THUMB
// ==========================================

/**
 * Draggable thumb control used in sliders
 */
export class Thumb extends UIComponent {
    static get componentType() { return 'Thumb'; }
    static get displayName() { return 'Thumb'; }
    static get description() { return 'A draggable thumb control'; }
    static get category() { return UICategory.Container; }
    static get icon() { return '●'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 3; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'dragStarted',
                displayName: 'Drag Started',
                description: 'Occurs when dragging starts',
                eventArgsType: 'VectorEventArgs'
            }),
            new EventDefinition({
                name: 'dragDelta',
                displayName: 'Drag Delta',
                description: 'Occurs during dragging',
                eventArgsType: 'VectorEventArgs'
            }),
            new EventDefinition({
                name: 'dragCompleted',
                displayName: 'Drag Completed',
                description: 'Occurs when dragging completes',
                eventArgsType: 'VectorEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['thumb', 'drag', 'slider', 'handle', 'grip'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        if (width >= 3 && height >= 1) {
            buffer[y][x] = '│';
            buffer[y][x + 1] = '●';
            buffer[y][x + 2] = '│';
        } else {
            buffer[y][x] = '●';
        }
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    Window,
    Dialog,
    TabControl,
    TabItem,
    Expander,
    GroupBox,
    Card,
    ScrollViewer,
    Border,
    Viewbox,
    Popup,
    FlipView,
    HeaderedContentControl,
    Overlay,
    Thumb
};
