/**
 * Asciistrator - Navigation Controls
 * 
 * Navigation UI components: Menu, TreeView, Breadcrumb, etc.
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
// MENU
// ==========================================

/**
 * Menu bar control
 */
export class Menu extends UIComponent {
    static get componentType() { return 'Menu'; }
    static get displayName() { return 'Menu'; }
    static get description() { return 'A menu bar with menu items'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '☰'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Collection,
                defaultValue: [
                    { header: 'File' },
                    { header: 'Edit' },
                    { header: 'View' },
                    { header: 'Help' }
                ],
                description: 'Menu items',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'itemsSource',
                displayName: 'Items Source',
                type: PropertyType.Binding,
                defaultValue: null,
                description: 'Data source for menu items',
                category: PropertyCategory.Data
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'menuOpened',
                displayName: 'Menu Opened',
                description: 'Occurs when a submenu opens',
                eventArgsType: 'RoutedEventArgs'
            }),
            new EventDefinition({
                name: 'menuClosed',
                displayName: 'Menu Closed',
                description: 'Occurs when a submenu closes',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['menu', 'menubar', 'navigation', 'dropdown'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const items = this.get('items') || [];
        
        // Draw menu bar background
        for (let i = 0; i < width; i++) {
            buffer[y][x + i] = ' ';
        }
        
        // Draw menu items
        let currentX = x + 1;
        for (const item of items) {
            const header = String(item.header || 'Menu');
            if (currentX + header.length + 2 < x + width) {
                ASCIIRenderer.drawText(buffer, currentX, y, header);
                currentX += header.length + 3;
            }
        }
        
        // Draw separator line below
        if (height > 1) {
            for (let i = 0; i < width; i++) {
                buffer[y + 1][x + i] = '─';
            }
        }
    }
}

// ==========================================
// MENU ITEM
// ==========================================

/**
 * Individual menu item
 */
export class MenuItem extends UIComponent {
    static get componentType() { return 'MenuItem'; }
    static get displayName() { return 'Menu Item'; }
    static get description() { return 'An individual menu item'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '▸'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'header',
                displayName: 'Header',
                type: PropertyType.Object,
                defaultValue: 'Menu Item',
                description: 'Content of the menu item',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'icon',
                displayName: 'Icon',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Icon displayed before the header',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'inputGesture',
                displayName: 'Input Gesture',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Keyboard shortcut text',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'command',
                displayName: 'Command',
                type: PropertyType.Command,
                defaultValue: null,
                description: 'Command to execute when clicked',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'commandParameter',
                displayName: 'Command Parameter',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Parameter for the command',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isSubMenuOpen',
                displayName: 'Is Sub Menu Open',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the submenu is open',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'isSelected',
                displayName: 'Is Selected',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the item is selected',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'staysOpenOnClick',
                displayName: 'Stays Open On Click',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether menu stays open after click',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.click(),
            new EventDefinition({
                name: 'submenuOpened',
                displayName: 'Submenu Opened',
                description: 'Occurs when a submenu opens',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['menu', 'item', 'option', 'action'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const header = String(this.get('header') || 'Menu Item');
        const inputGesture = this.get('inputGesture') || '';
        const icon = this.get('icon');
        const isSelected = this.get('isSelected');
        const hasChildren = (this._children && this._children.length > 0);
        
        // Draw selection highlight
        if (isSelected) {
            for (let i = 0; i < width; i++) {
                buffer[y][x + i] = '█';
            }
        }
        
        // Draw icon placeholder
        let textX = x + 1;
        if (icon) {
            buffer[y][textX] = '●';
            textX += 2;
        }
        
        // Draw header
        const maxHeaderWidth = width - (inputGesture.length > 0 ? inputGesture.length + 4 : 4);
        const displayHeader = ASCIIRenderer.truncateText(header, maxHeaderWidth);
        ASCIIRenderer.drawText(buffer, textX, y, displayHeader);
        
        // Draw shortcut
        if (inputGesture) {
            ASCIIRenderer.drawText(buffer, x + width - inputGesture.length - 2, y, inputGesture);
        }
        
        // Draw submenu indicator
        if (hasChildren) {
            buffer[y][x + width - 1] = '▸';
        }
    }
}

// ==========================================
// CONTEXT MENU
// ==========================================

/**
 * Context (right-click) menu
 */
export class ContextMenu extends UIComponent {
    static get componentType() { return 'ContextMenu'; }
    static get displayName() { return 'Context Menu'; }
    static get description() { return 'A right-click context menu'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '≡'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 8; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Collection,
                defaultValue: [
                    { header: 'Cut', inputGesture: 'Ctrl+X' },
                    { header: 'Copy', inputGesture: 'Ctrl+C' },
                    { header: 'Paste', inputGesture: 'Ctrl+V' },
                    { header: '-' },
                    { header: 'Delete' }
                ],
                description: 'Menu items',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'isOpen',
                displayName: 'Is Open',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the context menu is open',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'placementTarget',
                displayName: 'Placement Target',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Element to place the menu relative to',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'placement',
                displayName: 'Placement',
                type: PropertyType.Enum,
                defaultValue: 'Bottom',
                description: 'How to position the menu',
                category: PropertyCategory.Layout,
                enumValues: ['Top', 'Bottom', 'Left', 'Right', 'Center', 'TopEdgeAlignedLeft', 'TopEdgeAlignedRight', 'BottomEdgeAlignedLeft', 'BottomEdgeAlignedRight', 'LeftEdgeAlignedTop', 'LeftEdgeAlignedBottom', 'RightEdgeAlignedTop', 'RightEdgeAlignedBottom']
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'opening',
                displayName: 'Opening',
                description: 'Occurs when the context menu is opening',
                eventArgsType: 'CancelEventArgs'
            }),
            new EventDefinition({
                name: 'closing',
                displayName: 'Closing',
                description: 'Occurs when the context menu is closing',
                eventArgsType: 'CancelEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['context', 'menu', 'rightclick', 'popup'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const items = this.get('items') || [];
        
        const style = BorderStyle.Single;
        
        // Draw menu frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw menu items
        let itemY = y + 1;
        for (const item of items) {
            if (itemY >= y + height - 1) break;
            
            const header = String(item.header || '');
            
            if (header === '-') {
                // Draw separator
                for (let i = 1; i < width - 1; i++) {
                    buffer[itemY][x + i] = '─';
                }
            } else {
                // Draw item
                const maxWidth = width - 4;
                const displayHeader = ASCIIRenderer.truncateText(header, maxWidth);
                ASCIIRenderer.drawText(buffer, x + 2, itemY, displayHeader);
                
                // Draw shortcut
                if (item.inputGesture) {
                    const gestureX = x + width - item.inputGesture.length - 2;
                    if (gestureX > x + displayHeader.length + 3) {
                        ASCIIRenderer.drawText(buffer, gestureX, itemY, item.inputGesture);
                    }
                }
            }
            
            itemY++;
        }
    }
}

// ==========================================
// TREE VIEW
// ==========================================

/**
 * Hierarchical tree view control
 */
export class TreeView extends UIComponent {
    static get componentType() { return 'TreeView'; }
    static get displayName() { return 'Tree View'; }
    static get description() { return 'A hierarchical tree view'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '🌳'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Collection,
                defaultValue: [
                    { 
                        header: 'Root', 
                        isExpanded: true,
                        items: [
                            { header: 'Child 1' },
                            { header: 'Child 2', items: [{ header: 'Grandchild' }] },
                            { header: 'Child 3' }
                        ]
                    }
                ],
                description: 'Tree items',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'itemsSource',
                displayName: 'Items Source',
                type: PropertyType.Binding,
                defaultValue: null,
                description: 'Data source for tree items',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'selectedItem',
                displayName: 'Selected Item',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Currently selected item',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'selectedItems',
                displayName: 'Selected Items',
                type: PropertyType.Collection,
                defaultValue: [],
                description: 'Collection of selected items',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'selectionMode',
                displayName: 'Selection Mode',
                type: PropertyType.Enum,
                defaultValue: 'Single',
                description: 'How items can be selected',
                category: PropertyCategory.Behavior,
                enumValues: ['Single', 'Multiple', 'Toggle', 'AlwaysSelected']
            }),
            new PropertyDefinition({
                name: 'autoScrollToSelectedItem',
                displayName: 'Auto Scroll To Selected Item',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to scroll to selected item',
                category: PropertyCategory.Behavior
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
        return ['tree', 'view', 'hierarchy', 'navigation', 'folder'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const items = this.get('items') || [];
        
        const style = BorderStyle.Single;
        
        // Draw tree view frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Render tree items recursively
        let currentY = y + 1;
        const renderItem = (item, indent) => {
            if (currentY >= y + height - 1) return;
            
            const hasChildren = item.items && item.items.length > 0;
            const isExpanded = item.isExpanded !== false;
            
            // Draw indent and node
            const indentStr = '  '.repeat(indent);
            const icon = hasChildren ? (isExpanded ? '▼' : '▶') : '•';
            const header = String(item.header || 'Item');
            
            const maxWidth = width - 4 - indent * 2;
            const displayHeader = ASCIIRenderer.truncateText(header, maxWidth);
            
            ASCIIRenderer.drawText(buffer, x + 2 + indent * 2, currentY, icon + ' ' + displayHeader);
            currentY++;
            
            // Render children if expanded
            if (hasChildren && isExpanded) {
                for (const child of item.items) {
                    renderItem(child, indent + 1);
                }
            }
        };
        
        for (const item of items) {
            renderItem(item, 0);
        }
    }
}

// ==========================================
// TREE VIEW ITEM
// ==========================================

/**
 * Individual tree view item
 */
export class TreeViewItem extends UIComponent {
    static get componentType() { return 'TreeViewItem'; }
    static get displayName() { return 'Tree View Item'; }
    static get description() { return 'An individual tree view item'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '▸'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'header',
                displayName: 'Header',
                type: PropertyType.Object,
                defaultValue: 'Tree Item',
                description: 'Content of the tree item',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'isExpanded',
                displayName: 'Is Expanded',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the item is expanded',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'isSelected',
                displayName: 'Is Selected',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the item is selected',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'level',
                displayName: 'Level',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Nesting level of the item',
                category: PropertyCategory.Data
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'expanded',
                displayName: 'Expanded',
                description: 'Occurs when the item is expanded',
                eventArgsType: 'RoutedEventArgs'
            }),
            new EventDefinition({
                name: 'collapsed',
                displayName: 'Collapsed',
                description: 'Occurs when the item is collapsed',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['tree', 'item', 'node', 'branch'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const header = String(this.get('header') || 'Tree Item');
        const isExpanded = this.get('isExpanded');
        const isSelected = this.get('isSelected');
        const level = this.get('level') || 0;
        const hasChildren = this._children && this._children.length > 0;
        
        // Draw selection
        if (isSelected) {
            for (let i = 0; i < width; i++) {
                buffer[y][x + i] = '▓';
            }
        }
        
        // Draw indent
        const indent = level * 2;
        
        // Draw expand/collapse icon
        if (hasChildren) {
            const icon = isExpanded ? '▼' : '▶';
            buffer[y][x + indent] = icon;
        } else {
            buffer[y][x + indent] = '•';
        }
        
        // Draw header
        const maxWidth = width - indent - 2;
        const displayHeader = ASCIIRenderer.truncateText(header, maxWidth);
        ASCIIRenderer.drawText(buffer, x + indent + 2, y, displayHeader);
    }
}

// ==========================================
// BREADCRUMB
// ==========================================

/**
 * Breadcrumb navigation
 */
export class Breadcrumb extends UIComponent {
    static get componentType() { return 'Breadcrumb'; }
    static get displayName() { return 'Breadcrumb'; }
    static get description() { return 'Breadcrumb navigation path'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '⟩'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Collection,
                defaultValue: [
                    { text: 'Home' },
                    { text: 'Documents' },
                    { text: 'Projects' }
                ],
                description: 'Breadcrumb items',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'separator',
                displayName: 'Separator',
                type: PropertyType.String,
                defaultValue: '/',
                description: 'Separator between items',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'showHome',
                displayName: 'Show Home',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show home icon',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'itemClicked',
                displayName: 'Item Clicked',
                description: 'Occurs when a breadcrumb item is clicked',
                eventArgsType: 'BreadcrumbItemClickedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['breadcrumb', 'navigation', 'path', 'trail'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const items = this.get('items') || [];
        const separator = this.get('separator') || '/';
        const showHome = this.get('showHome');
        
        let currentX = x;
        
        // Draw home icon
        if (showHome && currentX < x + width) {
            buffer[y][currentX] = '🏠';
            currentX += 2;
        }
        
        // Draw items
        for (let i = 0; i < items.length; i++) {
            // Draw separator (except before first item if no home)
            if (i > 0 || showHome) {
                if (currentX + separator.length < x + width) {
                    ASCIIRenderer.drawText(buffer, currentX, y, ` ${separator} `);
                    currentX += separator.length + 2;
                }
            }
            
            // Draw item
            const item = items[i];
            const text = String(item.text || item);
            const remainingWidth = x + width - currentX;
            
            if (remainingWidth > 3) {
                const displayText = ASCIIRenderer.truncateText(text, remainingWidth);
                ASCIIRenderer.drawText(buffer, currentX, y, displayText);
                currentX += displayText.length;
            }
        }
    }
}

// ==========================================
// NAVIGATION VIEW
// ==========================================

/**
 * Modern navigation view with pane
 */
export class NavigationView extends UIComponent {
    static get componentType() { return 'NavigationView'; }
    static get displayName() { return 'Navigation View'; }
    static get description() { return 'A modern navigation view with menu pane'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '☰'; }
    static get contentModel() { return ContentModel.Multiple; }
    static get defaultWidth() { return 50; }
    static get defaultHeight() { return 25; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'menuItems',
                displayName: 'Menu Items',
                type: PropertyType.Collection,
                defaultValue: [
                    { icon: '🏠', content: 'Home' },
                    { icon: '📄', content: 'Documents' },
                    { icon: '⚙', content: 'Settings' }
                ],
                description: 'Navigation menu items',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'footerMenuItems',
                displayName: 'Footer Menu Items',
                type: PropertyType.Collection,
                defaultValue: [],
                description: 'Footer navigation items',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'selectedItem',
                displayName: 'Selected Item',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Currently selected item',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'isPaneOpen',
                displayName: 'Is Pane Open',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether the navigation pane is open',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'displayMode',
                displayName: 'Display Mode',
                type: PropertyType.Enum,
                defaultValue: 'Expanded',
                description: 'How the navigation is displayed',
                category: PropertyCategory.Appearance,
                enumValues: ['Minimal', 'Compact', 'Expanded']
            }),
            new PropertyDefinition({
                name: 'paneDisplayMode',
                displayName: 'Pane Display Mode',
                type: PropertyType.Enum,
                defaultValue: 'Left',
                description: 'How the pane is displayed',
                category: PropertyCategory.Appearance,
                enumValues: ['Auto', 'Left', 'LeftCompact', 'LeftMinimal', 'Top']
            }),
            new PropertyDefinition({
                name: 'isSettingsVisible',
                displayName: 'Is Settings Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether settings item is visible',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'alwaysShowHeader',
                displayName: 'Always Show Header',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether header is always visible',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'header',
                displayName: 'Header',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Header content',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'paneHeader',
                displayName: 'Pane Header',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Pane header content',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'paneFooter',
                displayName: 'Pane Footer',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Pane footer content',
                category: PropertyCategory.Content
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
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.selectionChanged(),
            new EventDefinition({
                name: 'backRequested',
                displayName: 'Back Requested',
                description: 'Occurs when back navigation is requested',
                eventArgsType: 'NavigationViewBackRequestedEventArgs'
            }),
            new EventDefinition({
                name: 'paneOpening',
                displayName: 'Pane Opening',
                description: 'Occurs when the pane starts opening',
                eventArgsType: 'CancelEventArgs'
            }),
            new EventDefinition({
                name: 'paneClosing',
                displayName: 'Pane Closing',
                description: 'Occurs when the pane starts closing',
                eventArgsType: 'CancelEventArgs'
            }),
            new EventDefinition({
                name: 'displayModeChanged',
                displayName: 'Display Mode Changed',
                description: 'Occurs when display mode changes',
                eventArgsType: 'NavigationViewDisplayModeChangedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['navigation', 'view', 'sidebar', 'menu', 'modern'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const menuItems = this.get('menuItems') || [];
        const isPaneOpen = this.get('isPaneOpen');
        const displayMode = this.get('displayMode') || 'Expanded';
        
        const style = BorderStyle.Single;
        const paneWidth = isPaneOpen ? Math.min(20, Math.floor(width * 0.3)) : 4;
        
        // Draw outer frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw pane separator
        for (let row = 1; row < height - 1; row++) {
            buffer[y + row][x + paneWidth] = '│';
        }
        buffer[y][x + paneWidth] = '┬';
        buffer[y + height - 1][x + paneWidth] = '┴';
        
        // Draw hamburger menu
        buffer[y + 1][x + 2] = '☰';
        
        // Draw menu items
        let itemY = y + 3;
        for (const item of menuItems) {
            if (itemY >= y + height - 3) break;
            
            const icon = item.icon || '•';
            buffer[itemY][x + 2] = icon.charAt(0);
            
            if (isPaneOpen && item.content) {
                const content = String(item.content);
                const maxWidth = paneWidth - 5;
                ASCIIRenderer.drawText(buffer, x + 4, itemY, ASCIIRenderer.truncateText(content, maxWidth));
            }
            
            itemY += 2;
        }
        
        // Draw settings at bottom of pane
        buffer[y + height - 3][x + 2] = '⚙';
        if (isPaneOpen) {
            ASCIIRenderer.drawText(buffer, x + 4, y + height - 3, 'Settings');
        }
        
        // Draw content area label
        const contentCenterX = x + paneWidth + Math.floor((width - paneWidth) / 2);
        ASCIIRenderer.drawText(buffer, contentCenterX - 4, y + Math.floor(height / 2), 'Content');
    }
}

// ==========================================
// TAB STRIP
// ==========================================

/**
 * Tab strip for navigation
 */
export class TabStrip extends UIComponent {
    static get componentType() { return 'TabStrip'; }
    static get displayName() { return 'Tab Strip'; }
    static get description() { return 'A strip of navigation tabs'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '⊟'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'items',
                displayName: 'Items',
                type: PropertyType.Collection,
                defaultValue: [
                    { content: 'Tab 1' },
                    { content: 'Tab 2' },
                    { content: 'Tab 3' }
                ],
                description: 'Tab strip items',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'selectedIndex',
                displayName: 'Selected Index',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Index of selected tab',
                category: PropertyCategory.Data,
                minValue: -1
            }),
            new PropertyDefinition({
                name: 'selectedItem',
                displayName: 'Selected Item',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Currently selected tab',
                category: PropertyCategory.Data
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
        return ['tab', 'strip', 'navigation', 'tabs'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const items = this.get('items') || [];
        const selectedIndex = this.get('selectedIndex') || 0;
        
        // Draw tabs
        let tabX = x;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const content = String(item.content || `Tab ${i + 1}`);
            const tabWidth = content.length + 4;
            const isSelected = i === selectedIndex;
            
            if (tabX + tabWidth > x + width) break;
            
            // Draw tab background
            if (isSelected) {
                buffer[y][tabX] = '┌';
                for (let j = 1; j < tabWidth - 1; j++) {
                    buffer[y][tabX + j] = '─';
                }
                buffer[y][tabX + tabWidth - 1] = '┐';
                
                buffer[y + 1][tabX] = '│';
                buffer[y + 1][tabX + tabWidth - 1] = '│';
                
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
            
            // Draw content
            ASCIIRenderer.drawText(buffer, tabX + 2, y + 1, content);
            
            tabX += tabWidth;
        }
        
        // Complete bottom line
        for (let i = tabX; i < x + width; i++) {
            buffer[y + 2][i] = '─';
        }
    }
}

// ==========================================
// PATH ICON
// ==========================================

/**
 * Icon rendered from path geometry data
 */
export class PathIcon extends UIComponent {
    static get componentType() { return 'PathIcon'; }
    static get displayName() { return 'Path Icon'; }
    static get description() { return 'An icon rendered from SVG path geometry data'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '⬡'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 3; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'data',
                displayName: 'Data',
                type: PropertyType.String,
                defaultValue: '',
                description: 'SVG path data string',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'foreground',
                displayName: 'Foreground',
                type: PropertyType.Brush,
                defaultValue: '#000000',
                description: 'Icon fill color',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get tags() {
        return ['icon', 'path', 'geometry', 'svg', 'vector'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        // Render as a simple icon placeholder
        const centerX = x + Math.floor(width / 2);
        const centerY = y + Math.floor(height / 2);
        
        if (width >= 3 && height >= 3) {
            // Draw a generic icon shape
            buffer[y][centerX] = '▲';
            buffer[centerY][x] = '◀';
            buffer[centerY][centerX] = '◆';
            buffer[centerY][x + width - 1] = '▶';
            buffer[y + height - 1][centerX] = '▼';
        } else if (width >= 1 && height >= 1) {
            buffer[centerY][centerX] = '◆';
        }
    }
}

// ==========================================
// HYPERLINK
// ==========================================

/**
 * Clickable hyperlink control
 */
export class Hyperlink extends UIComponent {
    static get componentType() { return 'Hyperlink'; }
    static get displayName() { return 'Hyperlink'; }
    static get description() { return 'A clickable hyperlink for navigation'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '🔗'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 15; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'text',
                displayName: 'Text',
                type: PropertyType.String,
                defaultValue: 'Click here',
                description: 'Link text',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'navigateUri',
                displayName: 'Navigate URI',
                type: PropertyType.String,
                defaultValue: '',
                description: 'URI to navigate to when clicked',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isVisited',
                displayName: 'Is Visited',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the link has been visited',
                category: PropertyCategory.State
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'click',
                displayName: 'Click',
                description: 'Occurs when the hyperlink is clicked',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return [
            ...super.visualStates,
            { name: 'Visited', group: 'CommonStates' }
        ];
    }
    
    static get tags() {
        return ['hyperlink', 'link', 'url', 'navigation', 'anchor'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const text = this.get('text') || 'Click here';
        const isVisited = this.get('isVisited');
        
        // Render underlined text to represent hyperlink
        const displayText = text.substring(0, width);
        
        for (let i = 0; i < displayText.length; i++) {
            buffer[y][x + i] = displayText[i];
        }
        
        // Draw underline to indicate it's a link
        if (height > 1) {
            for (let i = 0; i < displayText.length; i++) {
                buffer[y + 1][x + i] = '̲'; // Combining underline
            }
        }
        
        // Add link indicator
        if (width > displayText.length + 2) {
            buffer[y][x + displayText.length + 1] = isVisited ? '✓' : '↗';
        }
    }
}

// ==========================================
// PAGER
// ==========================================

/**
 * Pagination control for navigating pages
 */
export class Pager extends UIComponent {
    static get componentType() { return 'Pager'; }
    static get displayName() { return 'Pager'; }
    static get description() { return 'A pagination control for navigating through pages'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '⟨⟩'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'numberOfPages',
                displayName: 'Number Of Pages',
                type: PropertyType.Integer,
                defaultValue: 5,
                description: 'Total number of pages',
                category: PropertyCategory.Data,
                minValue: 1
            }),
            new PropertyDefinition({
                name: 'selectedPageIndex',
                displayName: 'Selected Page Index',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Currently selected page index',
                category: PropertyCategory.Data,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'maxVisiblePips',
                displayName: 'Max Visible Pips',
                type: PropertyType.Integer,
                defaultValue: 5,
                description: 'Maximum visible page indicators',
                category: PropertyCategory.Appearance,
                minValue: 1
            }),
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Horizontal',
                description: 'Pager orientation',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'buttonVisibility',
                displayName: 'Button Visibility',
                type: PropertyType.Enum,
                defaultValue: 'Visible',
                description: 'Visibility of navigation buttons',
                category: PropertyCategory.Appearance,
                enumValues: ['Visible', 'Hidden', 'HiddenOnEdge']
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'selectedIndexChanged',
                displayName: 'Selected Index Changed',
                description: 'Occurs when the selected page changes',
                eventArgsType: 'PipsPagerSelectedIndexChangedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['pager', 'pagination', 'pages', 'navigation', 'dots'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const numberOfPages = this.get('numberOfPages') || 5;
        const selectedPageIndex = this.get('selectedPageIndex') || 0;
        const orientation = this.get('orientation') || 'Horizontal';
        
        if (orientation === 'Horizontal') {
            // Draw prev button
            buffer[y][x] = '◀';
            
            // Draw page indicators
            const maxPips = Math.min(numberOfPages, Math.floor((width - 4) / 2));
            let pipX = x + 2;
            
            for (let i = 0; i < maxPips; i++) {
                buffer[y][pipX] = i === selectedPageIndex ? '●' : '○';
                pipX += 2;
            }
            
            // Draw next button
            buffer[y][x + width - 1] = '▶';
        } else {
            // Vertical orientation
            const centerX = x + Math.floor(width / 2);
            buffer[y][centerX] = '▲';
            
            const maxPips = Math.min(numberOfPages, height - 2);
            for (let i = 0; i < maxPips; i++) {
                buffer[y + 1 + i][centerX] = i === selectedPageIndex ? '●' : '○';
            }
            
            buffer[y + height - 1][centerX] = '▼';
        }
    }
}

// ==========================================
// STEPPER
// ==========================================

/**
 * Step-by-step wizard navigation control
 */
export class Stepper extends UIComponent {
    static get componentType() { return 'Stepper'; }
    static get displayName() { return 'Stepper'; }
    static get description() { return 'A step-by-step wizard navigation control'; }
    static get category() { return UICategory.Navigation; }
    static get icon() { return '①②③'; }
    static get contentModel() { return ContentModel.Items; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'steps',
                displayName: 'Steps',
                type: PropertyType.Collection,
                defaultValue: [
                    { title: 'Step 1', status: 'Completed' },
                    { title: 'Step 2', status: 'Current' },
                    { title: 'Step 3', status: 'Pending' }
                ],
                description: 'Steps configuration',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'currentStep',
                displayName: 'Current Step',
                type: PropertyType.Integer,
                defaultValue: 1,
                description: 'Currently active step (0-based index)',
                category: PropertyCategory.Data,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Horizontal',
                description: 'Stepper orientation',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'isClickable',
                displayName: 'Is Clickable',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether steps can be clicked to navigate',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'stepChanged',
                displayName: 'Step Changed',
                description: 'Occurs when the current step changes',
                eventArgsType: 'SelectionChangedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['stepper', 'wizard', 'steps', 'progress', 'navigation'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const steps = this.get('steps') || [];
        const currentStep = this.get('currentStep') || 1;
        const orientation = this.get('orientation') || 'Horizontal';
        
        const stepCount = Math.max(steps.length, 3);
        
        if (orientation === 'Horizontal') {
            const stepWidth = Math.floor(width / stepCount);
            
            for (let i = 0; i < stepCount; i++) {
                const stepX = x + i * stepWidth + Math.floor(stepWidth / 2);
                const step = steps[i] || { title: `Step ${i + 1}`, status: i < currentStep ? 'Completed' : (i === currentStep ? 'Current' : 'Pending') };
                
                // Draw step circle
                let indicator;
                if (step.status === 'Completed' || i < currentStep) {
                    indicator = '✓';
                } else if (step.status === 'Current' || i === currentStep) {
                    indicator = '●';
                } else {
                    indicator = '○';
                }
                
                buffer[y][stepX] = indicator;
                
                // Draw connector line
                if (i < stepCount - 1) {
                    const lineStart = stepX + 1;
                    const lineEnd = x + (i + 1) * stepWidth + Math.floor(stepWidth / 2) - 1;
                    for (let j = lineStart; j < lineEnd && j < x + width; j++) {
                        buffer[y][j] = '─';
                    }
                }
                
                // Draw step label
                const label = step.title || `Step ${i + 1}`;
                const labelX = stepX - Math.floor(label.length / 2);
                if (height > 1) {
                    ASCIIRenderer.drawText(buffer, Math.max(x, labelX), y + 2, label.substring(0, stepWidth));
                }
            }
        } else {
            // Vertical orientation
            const stepHeight = Math.floor(height / stepCount);
            
            for (let i = 0; i < stepCount; i++) {
                const stepY = y + i * stepHeight;
                const step = steps[i] || { title: `Step ${i + 1}` };
                
                let indicator;
                if (i < currentStep) {
                    indicator = '✓';
                } else if (i === currentStep) {
                    indicator = '●';
                } else {
                    indicator = '○';
                }
                
                buffer[stepY][x] = indicator;
                ASCIIRenderer.drawText(buffer, x + 2, stepY, step.title || `Step ${i + 1}`);
                
                // Draw connector
                if (i < stepCount - 1) {
                    for (let j = 1; j < stepHeight; j++) {
                        buffer[stepY + j][x] = '│';
                    }
                }
            }
        }
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    Menu,
    MenuItem,
    ContextMenu,
    TreeView,
    TreeViewItem,
    Breadcrumb,
    NavigationView,
    TabStrip,
    PathIcon,
    Hyperlink,
    Pager,
    Stepper
};
