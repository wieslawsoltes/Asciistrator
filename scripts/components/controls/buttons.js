/**
 * Asciistrator - Button Controls
 * 
 * Button-related UI components: Button, RepeatButton, ToggleButton, etc.
 * Framework-agnostic - use FrameworkMappings for export to specific frameworks.
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
// BUTTON
// ==========================================

/**
 * Standard button control
 * Framework-agnostic - maps to native button controls in each target framework
 */
export class Button extends UIComponent {
    static get componentType() { return 'Button'; }
    static get displayName() { return 'Button'; }
    static get description() { return 'A standard clickable button'; }
    static get category() { return UICategory.Button; }
    static get icon() { return '▢'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 12; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.content('Button'),
            new PropertyDefinition({
                name: 'command',
                displayName: 'Command',
                type: PropertyType.Command,
                defaultValue: null,
                description: 'The command to execute when clicked',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'commandParameter',
                displayName: 'Command Parameter',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'The parameter to pass to the command',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isDefault',
                displayName: 'Is Default',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether this is the default button',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isCancel',
                displayName: 'Is Cancel',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether this is the cancel button',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'clickMode',
                displayName: 'Click Mode',
                type: PropertyType.Enum,
                defaultValue: 'Release',
                description: 'When the Click event is raised',
                category: PropertyCategory.Behavior,
                enumValues: ['Release', 'Press', 'Hover']
            }),
            new PropertyDefinition({
                name: 'horizontalContentAlignment',
                displayName: 'Horizontal Content Alignment',
                type: PropertyType.Enum,
                defaultValue: 'Center',
                description: 'Horizontal alignment of content',
                category: PropertyCategory.Layout,
                enumValues: ['Left', 'Center', 'Right', 'Stretch']
            }),
            new PropertyDefinition({
                name: 'verticalContentAlignment',
                displayName: 'Vertical Content Alignment',
                type: PropertyType.Enum,
                defaultValue: 'Center',
                description: 'Vertical alignment of content',
                category: PropertyCategory.Layout,
                enumValues: ['Top', 'Center', 'Bottom', 'Stretch']
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.click()
        ];
    }
    
    static get visualStates() {
        return ['normal', 'pointerover', 'pressed', 'disabled'];
    }
    
    static get tags() {
        return ['button', 'click', 'action', 'submit', 'command'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || 'Button');
        const isEnabled = this.get('isEnabled');
        const state = this.visualState;
        
        // Choose border style based on state
        let style = BorderStyle.Single;
        if (state === 'pressed') {
            style = BorderStyle.Heavy;
        } else if (!isEnabled) {
            style = BorderStyle.Dashed;
        }
        
        // Draw button box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw content centered
        const textY = y + Math.floor(height / 2);
        const maxTextWidth = width - 4;
        const displayText = ASCIIRenderer.truncateText(content, maxTextWidth);
        ASCIIRenderer.drawCenteredText(buffer, textY, displayText, x + 1, width - 2);
    }
}

// ==========================================
// REPEAT BUTTON
// ==========================================

/**
 * Button that repeatedly fires while pressed
 */
export class RepeatButton extends Button {
    static get componentType() { return 'RepeatButton'; }
    static get displayName() { return 'Repeat Button'; }
    static get description() { return 'A button that repeatedly fires while held'; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'delay',
                displayName: 'Delay',
                type: PropertyType.Integer,
                defaultValue: 500,
                description: 'Initial delay before repeating (ms)',
                category: PropertyCategory.Behavior,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'interval',
                displayName: 'Interval',
                type: PropertyType.Integer,
                defaultValue: 100,
                description: 'Repeat interval (ms)',
                category: PropertyCategory.Behavior,
                minValue: 0
            })
        ];
    }
    
    static get tags() {
        return ['button', 'repeat', 'hold', 'increment', 'decrement'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        super._renderToBuffer(buffer, x, y, width, height, options);
        
        // Add repeat indicator
        if (width > 4 && height >= 3) {
            buffer[y][x + 1] = '◀';
        }
    }
}

// ==========================================
// TOGGLE BUTTON
// ==========================================

/**
 * Button that toggles between checked/unchecked states
 */
export class ToggleButton extends Button {
    static get componentType() { return 'ToggleButton'; }
    static get displayName() { return 'Toggle Button'; }
    static get description() { return 'A button that toggles between states'; }
    
    static get propertyDefinitions() {
        return [
            ...Button.propertyDefinitions.filter(p => p.name !== 'content'),
            CommonProperties.content('Toggle'),
            new PropertyDefinition({
                name: 'isChecked',
                displayName: 'Is Checked',
                type: PropertyType.NullableBoolean,
                defaultValue: false,
                description: 'Whether the button is checked',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'isThreeState',
                displayName: 'Is Three State',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether null is a valid state',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.checked(),
            CommonEvents.unchecked(),
            new EventDefinition({
                name: 'indeterminate',
                displayName: 'Indeterminate',
                description: 'Occurs when the button becomes indeterminate',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'pointerover', 'pressed', 'disabled', 'checked', 'unchecked', 'indeterminate'];
    }
    
    static get tags() {
        return ['button', 'toggle', 'switch', 'checked', 'state'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || 'Toggle');
        const isChecked = this.get('isChecked');
        const isEnabled = this.get('isEnabled');
        
        // Choose style based on checked state
        let style = BorderStyle.Single;
        if (isChecked === true) {
            style = BorderStyle.Double;
        } else if (isChecked === null) {
            style = BorderStyle.Dashed;
        }
        
        if (!isEnabled) {
            style = BorderStyle.Dashed;
        }
        
        // Draw button box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw check indicator
        const indicator = isChecked === true ? '☑' : (isChecked === null ? '☐' : '☐');
        if (width > 4 && height >= 3) {
            const textY = y + Math.floor(height / 2);
            buffer[textY][x + 1] = indicator;
            
            // Draw content
            const maxTextWidth = width - 5;
            const displayText = ASCIIRenderer.truncateText(content, maxTextWidth);
            ASCIIRenderer.drawText(buffer, x + 3, textY, displayText);
        }
    }
}

// ==========================================
// SPLIT BUTTON
// ==========================================

/**
 * Button with a dropdown arrow for additional actions
 */
export class SplitButton extends Button {
    static get componentType() { return 'SplitButton'; }
    static get displayName() { return 'Split Button'; }
    static get description() { return 'A button with a dropdown for additional actions'; }
    static get defaultWidth() { return 16; }
    
    static get propertyDefinitions() {
        return [
            ...Button.propertyDefinitions.filter(p => p.name !== 'content'),
            CommonProperties.content('Action'),
            new PropertyDefinition({
                name: 'flyout',
                displayName: 'Flyout',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'The flyout to show when dropdown is clicked',
                category: PropertyCategory.Content
            })
        ];
    }
    
    static get tags() {
        return ['button', 'split', 'dropdown', 'menu', 'action'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || 'Action');
        const isEnabled = this.get('isEnabled');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        const dropdownWidth = 3;
        const mainWidth = width - dropdownWidth;
        
        // Draw main button area
        ASCIIRenderer.drawBox(buffer, x, y, mainWidth + 1, height, style);
        
        // Draw dropdown area
        for (let row = 0; row < height; row++) {
            const targetY = y + row;
            if (row === 0) {
                buffer[targetY][x + mainWidth] = style.top;
                buffer[targetY][x + width - 1] = style.topRight;
            } else if (row === height - 1) {
                buffer[targetY][x + mainWidth] = style.bottom;
                buffer[targetY][x + width - 1] = style.bottomRight;
            } else {
                buffer[targetY][x + mainWidth] = '│';
                buffer[targetY][x + width - 1] = style.right;
            }
        }
        
        // Draw content
        const textY = y + Math.floor(height / 2);
        const maxTextWidth = mainWidth - 3;
        const displayText = ASCIIRenderer.truncateText(content, maxTextWidth);
        ASCIIRenderer.drawCenteredText(buffer, textY, displayText, x + 1, mainWidth - 1);
        
        // Draw dropdown arrow
        buffer[textY][x + mainWidth + 1] = '▼';
    }
}

// ==========================================
// DROPDOWN BUTTON
// ==========================================

/**
 * Button that opens a dropdown menu
 */
export class DropDownButton extends SplitButton {
    static get componentType() { return 'DropDownButton'; }
    static get displayName() { return 'Dropdown Button'; }
    static get description() { return 'A button that opens a dropdown menu'; }
    
    static get propertyDefinitions() {
        return [
            ...SplitButton.propertyDefinitions.filter(p => p.name !== 'content'),
            CommonProperties.content('Menu')
        ];
    }
    
    static get tags() {
        return ['button', 'dropdown', 'menu', 'popup'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || 'Menu');
        const isEnabled = this.get('isEnabled');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        
        // Draw single box (no split)
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw content with dropdown arrow
        const textY = y + Math.floor(height / 2);
        const maxTextWidth = width - 5;
        const displayText = ASCIIRenderer.truncateText(content, maxTextWidth);
        ASCIIRenderer.drawText(buffer, x + 2, textY, displayText);
        
        // Draw dropdown arrow at the end
        buffer[textY][x + width - 3] = '▼';
    }
}

// ==========================================
// HYPERLINK BUTTON
// ==========================================

/**
 * Button styled as a hyperlink
 */
export class HyperlinkButton extends Button {
    static get componentType() { return 'HyperlinkButton'; }
    static get displayName() { return 'Hyperlink Button'; }
    static get description() { return 'A button styled as a hyperlink'; }
    static get defaultWidth() { return 14; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...Button.propertyDefinitions.filter(p => p.name !== 'content'),
            CommonProperties.content('Link'),
            new PropertyDefinition({
                name: 'navigateUri',
                displayName: 'Navigate URI',
                type: PropertyType.String,
                defaultValue: '',
                description: 'The URI to navigate to',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get tags() {
        return ['button', 'hyperlink', 'link', 'url', 'navigate'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || 'Link');
        const isEnabled = this.get('isEnabled');
        
        // Draw underlined text (simulating hyperlink)
        const displayText = ASCIIRenderer.truncateText(content, width);
        ASCIIRenderer.drawText(buffer, x, y, displayText);
        
        // Draw underline on next row if available
        if (height > 1) {
            const underline = '─'.repeat(displayText.length);
            ASCIIRenderer.drawText(buffer, x, y + 1, underline);
        }
    }
}

// ==========================================
// RADIO BUTTON (also a button variant)
// ==========================================

/**
 * Radio button for single selection from a group
 */
export class RadioButton extends ToggleButton {
    static get componentType() { return 'RadioButton'; }
    static get displayName() { return 'Radio Button'; }
    static get description() { return 'A radio button for single selection'; }
    static get defaultWidth() { return 14; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...UIComponent.propertyDefinitions,
            CommonProperties.content('Option'),
            new PropertyDefinition({
                name: 'isChecked',
                displayName: 'Is Checked',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the radio button is selected',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'groupName',
                displayName: 'Group Name',
                type: PropertyType.String,
                defaultValue: '',
                description: 'The name of the radio button group',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get tags() {
        return ['radio', 'option', 'select', 'single', 'group'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || 'Option');
        const isChecked = this.get('isChecked');
        const isEnabled = this.get('isEnabled');
        
        // Draw radio indicator
        const indicator = isChecked ? '(•)' : '( )';
        ASCIIRenderer.drawText(buffer, x, y, indicator);
        
        // Draw label
        const maxTextWidth = width - 4;
        const displayText = ASCIIRenderer.truncateText(content, maxTextWidth);
        ASCIIRenderer.drawText(buffer, x + 4, y, displayText);
    }
}

// ==========================================
// BUTTON SPINNER
// ==========================================

/**
 * Button with spinner arrows for increment/decrement
 */
export class ButtonSpinner extends UIComponent {
    static get componentType() { return 'ButtonSpinner'; }
    static get displayName() { return 'Button Spinner'; }
    static get description() { return 'A button with increment/decrement spinner controls'; }
    static get category() { return UICategory.Button; }
    static get icon() { return '▲▼'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 14; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.content('0'),
            new PropertyDefinition({
                name: 'spinnerLocation',
                displayName: 'Spinner Location',
                type: PropertyType.Enum,
                defaultValue: 'Right',
                description: 'Location of spinner buttons',
                category: PropertyCategory.Layout,
                enumValues: ['Left', 'Right']
            }),
            new PropertyDefinition({
                name: 'allowSpin',
                displayName: 'Allow Spin',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether spinning is allowed',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'showButtonSpinner',
                displayName: 'Show Button Spinner',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show spinner buttons',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'validSpinDirection',
                displayName: 'Valid Spin Direction',
                type: PropertyType.Enum,
                defaultValue: 'Increase,Decrease',
                description: 'Valid spin directions',
                category: PropertyCategory.Behavior,
                enumValues: ['None', 'Increase', 'Decrease', 'Increase,Decrease']
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'spin',
                displayName: 'Spin',
                description: 'Occurs when a spin button is clicked',
                eventArgsType: 'SpinEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'increase', 'decrease', 'disabled'];
    }
    
    static get tags() {
        return ['spinner', 'button', 'increment', 'decrement', 'updown'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || '0');
        const spinnerLocation = this.get('spinnerLocation') || 'Right';
        const showButtonSpinner = this.get('showButtonSpinner') !== false;
        const style = BorderStyle.Single;
        
        // Draw main box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        if (showButtonSpinner) {
            if (spinnerLocation === 'Right') {
                // Content on left
                const maxContentWidth = width - 5;
                const displayContent = ASCIIRenderer.truncateText(content, maxContentWidth);
                const centerY = y + Math.floor(height / 2);
                ASCIIRenderer.drawText(buffer, x + 2, centerY, displayContent);
                
                // Spinner on right
                const spinnerX = x + width - 3;
                buffer[y][spinnerX] = '┬';
                buffer[y + height - 1][spinnerX] = '┴';
                for (let row = 1; row < height - 1; row++) {
                    buffer[y + row][spinnerX] = '│';
                }
                buffer[centerY - 1] && (buffer[centerY - 1][spinnerX + 1] = '▲');
                buffer[centerY + 1] && (buffer[centerY + 1][spinnerX + 1] = '▼');
                if (height === 3) {
                    buffer[centerY][spinnerX + 1] = '◆';
                }
            } else {
                // Spinner on left
                const spinnerX = x + 2;
                buffer[y][spinnerX] = '┬';
                buffer[y + height - 1][spinnerX] = '┴';
                for (let row = 1; row < height - 1; row++) {
                    buffer[y + row][spinnerX] = '│';
                }
                const centerY = y + Math.floor(height / 2);
                buffer[centerY - 1] && (buffer[centerY - 1][x + 1] = '▲');
                buffer[centerY + 1] && (buffer[centerY + 1][x + 1] = '▼');
                if (height === 3) {
                    buffer[centerY][x + 1] = '◆';
                }
                
                // Content on right
                const maxContentWidth = width - 5;
                const displayContent = ASCIIRenderer.truncateText(content, maxContentWidth);
                ASCIIRenderer.drawText(buffer, x + 4, centerY, displayContent);
            }
        } else {
            // Just content
            const centerY = y + Math.floor(height / 2);
            const displayContent = ASCIIRenderer.truncateText(content, width - 4);
            ASCIIRenderer.drawCenteredText(buffer, centerY, displayContent, x + 1, width - 2);
        }
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    Button,
    RepeatButton,
    ToggleButton,
    SplitButton,
    DropDownButton,
    HyperlinkButton,
    RadioButton,
    ButtonSpinner
};
