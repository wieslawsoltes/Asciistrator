/**
 * Asciistrator - Input Controls
 * 
 * Text input UI components: TextBox, PasswordBox, NumericUpDown, etc.
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
// TEXT BOX
// ==========================================

/**
 * Standard single-line text input
 */
export class TextBox extends UIComponent {
    static get componentType() { return 'TextBox'; }
    static get displayName() { return 'Text Box'; }
    static get description() { return 'A single-line text input field'; }
    static get category() { return UICategory.Input; }
    static get icon() { return '⌨'; }
    static get contentModel() { return ContentModel.Text; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.text(''),
            new PropertyDefinition({
                name: 'watermark',
                displayName: 'Watermark',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Placeholder text when empty',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'acceptsReturn',
                displayName: 'Accepts Return',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether Enter key inserts a new line',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'acceptsTab',
                displayName: 'Accepts Tab',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether Tab key inserts a tab character',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'maxLength',
                displayName: 'Max Length',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Maximum number of characters (0 = unlimited)',
                category: PropertyCategory.Behavior,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'isReadOnly',
                displayName: 'Is Read Only',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the text is read-only',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isUndoEnabled',
                displayName: 'Is Undo Enabled',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether undo is enabled',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'selectionStart',
                displayName: 'Selection Start',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Starting index of selected text',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'selectionEnd',
                displayName: 'Selection End',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Ending index of selected text',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'caretIndex',
                displayName: 'Caret Index',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Position of the text cursor',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'textAlignment',
                displayName: 'Text Alignment',
                type: PropertyType.Enum,
                defaultValue: 'Left',
                description: 'Horizontal text alignment',
                category: PropertyCategory.Appearance,
                enumValues: ['Left', 'Center', 'Right']
            }),
            new PropertyDefinition({
                name: 'textWrapping',
                displayName: 'Text Wrapping',
                type: PropertyType.Enum,
                defaultValue: 'NoWrap',
                description: 'Text wrapping behavior',
                category: PropertyCategory.Appearance,
                enumValues: ['NoWrap', 'Wrap', 'WrapWithOverflow']
            }),
            new PropertyDefinition({
                name: 'innerLeftContent',
                displayName: 'Inner Left Content',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Content displayed inside on the left',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'innerRightContent',
                displayName: 'Inner Right Content',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Content displayed inside on the right',
                category: PropertyCategory.Content
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.textChanged(),
            new EventDefinition({
                name: 'textChanging',
                displayName: 'Text Changing',
                description: 'Occurs before the text changes',
                eventArgsType: 'TextChangingEventArgs'
            }),
            new EventDefinition({
                name: 'copyingToClipboard',
                displayName: 'Copying To Clipboard',
                description: 'Occurs when copying to clipboard',
                eventArgsType: 'RoutedEventArgs'
            }),
            new EventDefinition({
                name: 'cuttingToClipboard',
                displayName: 'Cutting To Clipboard',
                description: 'Occurs when cutting to clipboard',
                eventArgsType: 'RoutedEventArgs'
            }),
            new EventDefinition({
                name: 'pastingFromClipboard',
                displayName: 'Pasting From Clipboard',
                description: 'Occurs when pasting from clipboard',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'pointerover', 'focused', 'disabled'];
    }
    
    static get tags() {
        return ['input', 'text', 'field', 'edit', 'entry'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const text = String(this.get('text') || '');
        const watermark = this.get('watermark') || '';
        const isEnabled = this.get('isEnabled');
        const isReadOnly = this.get('isReadOnly');
        
        // Choose style
        let style = BorderStyle.Single;
        if (!isEnabled) {
            style = BorderStyle.Dashed;
        } else if (isReadOnly) {
            style = BorderStyle.Single;
        }
        
        // Draw input box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw text or watermark
        const textY = y + Math.floor(height / 2);
        const maxTextWidth = width - 2;
        let displayText = text || watermark;
        displayText = ASCIIRenderer.truncateText(displayText, maxTextWidth);
        
        // Show cursor indicator at the end of text in focused state
        const alignment = this.get('textAlignment');
        if (alignment === 'Center') {
            ASCIIRenderer.drawCenteredText(buffer, textY, displayText, x + 1, width - 2);
        } else if (alignment === 'Right') {
            const startX = x + width - 1 - displayText.length;
            ASCIIRenderer.drawText(buffer, startX, textY, displayText);
        } else {
            ASCIIRenderer.drawText(buffer, x + 1, textY, displayText);
        }
    }
}

// ==========================================
// PASSWORD BOX
// ==========================================

/**
 * Text input that masks entered characters
 */
export class PasswordBox extends UIComponent {
    static get componentType() { return 'PasswordBox'; }
    static get displayName() { return 'Password Box'; }
    static get description() { return 'A text input that masks characters'; }
    static get category() { return UICategory.Input; }
    static get icon() { return '🔒'; } // Avalonia uses TextBox with PasswordChar
    static get contentModel() { return ContentModel.Text; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'password',
                displayName: 'Password',
                type: PropertyType.String,
                defaultValue: '',
                description: 'The password value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'passwordChar',
                displayName: 'Password Char',
                type: PropertyType.Char,
                defaultValue: '•',
                description: 'The character used to mask the password',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'watermark',
                displayName: 'Watermark',
                type: PropertyType.String,
                defaultValue: 'Password',
                description: 'Placeholder text when empty',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'maxLength',
                displayName: 'Max Length',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Maximum number of characters (0 = unlimited)',
                category: PropertyCategory.Behavior,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'revealPassword',
                displayName: 'Reveal Password',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to show the password reveal button',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'passwordChanged',
                displayName: 'Password Changed',
                description: 'Occurs when the password changes',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['input', 'password', 'secret', 'secure', 'login'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const password = String(this.get('password') || '');
        const passwordChar = this.get('passwordChar') || '•';
        const watermark = this.get('watermark') || 'Password';
        const isEnabled = this.get('isEnabled');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        
        // Draw input box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw masked password or watermark
        const textY = y + Math.floor(height / 2);
        const maxTextWidth = width - 4;
        
        let displayText;
        if (password.length > 0) {
            displayText = passwordChar.repeat(Math.min(password.length, maxTextWidth));
        } else {
            displayText = ASCIIRenderer.truncateText(watermark, maxTextWidth);
        }
        
        ASCIIRenderer.drawText(buffer, x + 1, textY, displayText);
        
        // Draw lock icon
        buffer[textY][x + width - 2] = '🔒';
    }
}

// ==========================================
// MASKED TEXT BOX
// ==========================================

/**
 * Text input with input mask
 */
export class MaskedTextBox extends TextBox {
    static get componentType() { return 'MaskedTextBox'; }
    static get displayName() { return 'Masked Text Box'; }
    static get description() { return 'A text input with an input mask'; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'mask',
                displayName: 'Mask',
                type: PropertyType.String,
                defaultValue: '',
                description: 'The input mask pattern',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'promptChar',
                displayName: 'Prompt Char',
                type: PropertyType.Char,
                defaultValue: '_',
                description: 'The character shown for empty positions',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'hidePromptOnLeave',
                displayName: 'Hide Prompt On Leave',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to hide the prompt when unfocused',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'asciiOnly',
                displayName: 'ASCII Only',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to allow only ASCII characters',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get tags() {
        return ['input', 'text', 'mask', 'format', 'phone', 'date'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const text = String(this.get('text') || '');
        const mask = this.get('mask') || '';
        const promptChar = this.get('promptChar') || '_';
        const isEnabled = this.get('isEnabled');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        
        // Draw input box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Generate masked display
        const textY = y + Math.floor(height / 2);
        const maxTextWidth = width - 2;
        
        let displayText = '';
        if (mask) {
            // Simple mask interpretation
            let textIndex = 0;
            for (let i = 0; i < mask.length && displayText.length < maxTextWidth; i++) {
                const maskChar = mask[i];
                if (maskChar === '0' || maskChar === '9' || maskChar === 'A' || maskChar === 'a') {
                    displayText += textIndex < text.length ? text[textIndex++] : promptChar;
                } else {
                    displayText += maskChar;
                }
            }
        } else {
            displayText = ASCIIRenderer.truncateText(text, maxTextWidth);
        }
        
        ASCIIRenderer.drawText(buffer, x + 1, textY, displayText);
    }
}

// ==========================================
// AUTO COMPLETE BOX
// ==========================================

/**
 * Text input with autocomplete suggestions
 */
export class AutoCompleteBox extends TextBox {
    static get componentType() { return 'AutoCompleteBox'; }
    static get displayName() { return 'Auto Complete Box'; }
    static get description() { return 'A text input with autocomplete suggestions'; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions.filter(p => !['text'].includes(p.name)),
            CommonProperties.text(''),
            new PropertyDefinition({
                name: 'itemsSource',
                displayName: 'Items Source',
                type: PropertyType.Collection,
                defaultValue: [],
                description: 'The collection of suggestions',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'selectedItem',
                displayName: 'Selected Item',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'The currently selected item',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'filterMode',
                displayName: 'Filter Mode',
                type: PropertyType.Enum,
                defaultValue: 'StartsWith',
                description: 'How items are filtered',
                category: PropertyCategory.Behavior,
                enumValues: ['None', 'StartsWith', 'StartsWithCaseSensitive', 'StartsWithOrdinal', 'StartsWithOrdinalCaseSensitive', 'Contains', 'ContainsCaseSensitive', 'ContainsOrdinal', 'ContainsOrdinalCaseSensitive', 'Equals', 'EqualsCaseSensitive', 'EqualsOrdinal', 'EqualsOrdinalCaseSensitive', 'Custom']
            }),
            new PropertyDefinition({
                name: 'minimumPrefixLength',
                displayName: 'Minimum Prefix Length',
                type: PropertyType.Integer,
                defaultValue: 1,
                description: 'Minimum characters before showing suggestions',
                category: PropertyCategory.Behavior,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'minimumPopulateDelay',
                displayName: 'Minimum Populate Delay',
                type: PropertyType.TimeSpan,
                defaultValue: '00:00:00',
                description: 'Delay before populating suggestions',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'maxDropDownHeight',
                displayName: 'Max Drop Down Height',
                type: PropertyType.Number,
                defaultValue: 200,
                description: 'Maximum height of the dropdown',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'isDropDownOpen',
                displayName: 'Is Drop Down Open',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the dropdown is open',
                category: PropertyCategory.Data
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.selectionChanged(),
            new EventDefinition({
                name: 'searchTextChanged',
                displayName: 'Search Text Changed',
                description: 'Occurs when the search text changes',
                eventArgsType: 'AutoCompleteFilterEventArgs'
            }),
            new EventDefinition({
                name: 'populating',
                displayName: 'Populating',
                description: 'Occurs when about to populate suggestions',
                eventArgsType: 'PopulatingEventArgs'
            }),
            new EventDefinition({
                name: 'populated',
                displayName: 'Populated',
                description: 'Occurs after suggestions are populated',
                eventArgsType: 'PopulatedEventArgs'
            }),
            new EventDefinition({
                name: 'dropDownOpened',
                displayName: 'Drop Down Opened',
                description: 'Occurs when the dropdown opens',
                eventArgsType: 'EventArgs'
            }),
            new EventDefinition({
                name: 'dropDownClosed',
                displayName: 'Drop Down Closed',
                description: 'Occurs when the dropdown closes',
                eventArgsType: 'EventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['input', 'text', 'autocomplete', 'suggest', 'search'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        super._renderToBuffer(buffer, x, y, width, height, options);
        
        // Draw dropdown arrow
        const textY = y + Math.floor(height / 2);
        buffer[textY][x + width - 2] = '▼';
    }
}

// ==========================================
// NUMERIC UP DOWN
// ==========================================

/**
 * Numeric input with increment/decrement buttons
 */
export class NumericUpDown extends UIComponent {
    static get componentType() { return 'NumericUpDown'; }
    static get displayName() { return 'Numeric Up Down'; }
    static get description() { return 'A numeric input with spinner buttons'; }
    static get category() { return UICategory.Input; }
    static get icon() { return '123'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 14; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'The current numeric value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'minimum',
                displayName: 'Minimum',
                type: PropertyType.Number,
                defaultValue: null,
                description: 'Minimum allowed value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'maximum',
                displayName: 'Maximum',
                type: PropertyType.Number,
                defaultValue: null,
                description: 'Maximum allowed value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'increment',
                displayName: 'Increment',
                type: PropertyType.Number,
                defaultValue: 1,
                description: 'Amount to change per step',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'decimalPlaces',
                displayName: 'Decimal Places',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Number of decimal places to display',
                category: PropertyCategory.Appearance,
                minValue: 0,
                maxValue: 28
            }),
            new PropertyDefinition({
                name: 'formatString',
                displayName: 'Format String',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Custom format string for the value',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'watermark',
                displayName: 'Watermark',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Placeholder text when empty',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'showButtonSpinner',
                displayName: 'Show Button Spinner',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show the spinner buttons',
                category: PropertyCategory.Appearance
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
                name: 'clipValueToMinMax',
                displayName: 'Clip Value To Min Max',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to clip values to min/max',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'textAlignment',
                displayName: 'Text Alignment',
                type: PropertyType.Enum,
                defaultValue: 'Left',
                description: 'Horizontal text alignment',
                category: PropertyCategory.Appearance,
                enumValues: ['Left', 'Center', 'Right']
            }),
            new PropertyDefinition({
                name: 'spinnerLocation',
                displayName: 'Spinner Location',
                type: PropertyType.Enum,
                defaultValue: 'Right',
                description: 'Location of the spinner buttons',
                category: PropertyCategory.Appearance,
                enumValues: ['Left', 'Right']
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.valueChanged(),
            new EventDefinition({
                name: 'spinned',
                displayName: 'Spinned',
                description: 'Occurs when the spinner is used',
                eventArgsType: 'SpinEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'pointerover', 'focused', 'disabled'];
    }
    
    static get tags() {
        return ['input', 'number', 'numeric', 'spinner', 'updown'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = this.get('value');
        const decimalPlaces = this.get('decimalPlaces') || 0;
        const isEnabled = this.get('isEnabled');
        const showSpinner = this.get('showButtonSpinner');
        const spinnerLocation = this.get('spinnerLocation') || 'Right';
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        const spinnerWidth = showSpinner ? 3 : 0;
        
        // Draw main input box
        if (spinnerLocation === 'Right') {
            ASCIIRenderer.drawBox(buffer, x, y, width - spinnerWidth, height, style);
        } else {
            ASCIIRenderer.drawBox(buffer, x + spinnerWidth, y, width - spinnerWidth, height, style);
        }
        
        // Draw value
        const textY = y + Math.floor(height / 2);
        const valueStr = value !== null ? value.toFixed(decimalPlaces) : '';
        const valueX = spinnerLocation === 'Right' ? x + 1 : x + spinnerWidth + 1;
        ASCIIRenderer.drawText(buffer, valueX, textY, valueStr);
        
        // Draw spinner buttons
        if (showSpinner) {
            const spinnerX = spinnerLocation === 'Right' ? x + width - spinnerWidth : x;
            
            // Top half - up button
            buffer[y][spinnerX] = style.topLeft;
            buffer[y][spinnerX + 1] = style.top;
            buffer[y][spinnerX + 2] = style.topRight;
            
            const midY = y + Math.floor(height / 2);
            buffer[midY][spinnerX] = style.left;
            buffer[midY][spinnerX + 1] = '▲';
            buffer[midY][spinnerX + 2] = style.right;
            
            // Separator
            if (height > 2) {
                buffer[midY - 1][spinnerX] = style.left;
                buffer[midY - 1][spinnerX + 1] = '─';
                buffer[midY - 1][spinnerX + 2] = style.right;
                buffer[midY + 1][spinnerX] = style.left;
                buffer[midY + 1][spinnerX + 1] = '▼';
                buffer[midY + 1][spinnerX + 2] = style.right;
            }
            
            // Bottom
            buffer[y + height - 1][spinnerX] = style.bottomLeft;
            buffer[y + height - 1][spinnerX + 1] = style.bottom;
            buffer[y + height - 1][spinnerX + 2] = style.bottomRight;
        }
    }
}

// ==========================================
// TEXT AREA
// ==========================================

/**
 * Multi-line text input
 */
export class TextArea extends TextBox {
    static get componentType() { return 'TextArea'; }
    static get displayName() { return 'Text Area'; }
    static get description() { return 'A multi-line text input field'; }
    static get defaultWidth() { return 30; }
    static get defaultHeight() { return 8; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions.filter(p => !['acceptsReturn', 'textWrapping'].includes(p.name)),
            new PropertyDefinition({
                name: 'acceptsReturn',
                displayName: 'Accepts Return',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether Enter key inserts a new line',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'textWrapping',
                displayName: 'Text Wrapping',
                type: PropertyType.Enum,
                defaultValue: 'Wrap',
                description: 'Text wrapping behavior',
                category: PropertyCategory.Appearance,
                enumValues: ['NoWrap', 'Wrap', 'WrapWithOverflow']
            }),
            new PropertyDefinition({
                name: 'maxLines',
                displayName: 'Max Lines',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Maximum number of visible lines (0 = unlimited)',
                category: PropertyCategory.Appearance,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'minLines',
                displayName: 'Min Lines',
                type: PropertyType.Integer,
                defaultValue: 1,
                description: 'Minimum number of visible lines',
                category: PropertyCategory.Appearance,
                minValue: 1
            })
        ];
    }
    
    static get tags() {
        return ['input', 'text', 'multiline', 'area', 'memo', 'notes'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const text = String(this.get('text') || '');
        const watermark = this.get('watermark') || '';
        const isEnabled = this.get('isEnabled');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        
        // Draw text area box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Split text into lines and render
        const lines = (text || watermark).split('\n');
        const maxTextWidth = width - 2;
        const maxLines = height - 2;
        
        for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
            const displayText = ASCIIRenderer.truncateText(lines[i], maxTextWidth);
            ASCIIRenderer.drawText(buffer, x + 1, y + 1 + i, displayText);
        }
        
        // Draw scroll indicator if there are more lines
        if (lines.length > maxLines) {
            const scrollY = y + 1;
            buffer[scrollY][x + width - 1] = '▲';
            buffer[y + height - 2][x + width - 1] = '▼';
        }
    }
}

// ==========================================
// SEARCH BOX
// ==========================================

/**
 * Text input optimized for search
 */
export class SearchBox extends TextBox {
    static get componentType() { return 'SearchBox'; }
    static get displayName() { return 'Search Box'; }
    static get description() { return 'A text input optimized for search'; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions.filter(p => !['watermark'].includes(p.name)),
            new PropertyDefinition({
                name: 'watermark',
                displayName: 'Watermark',
                type: PropertyType.String,
                defaultValue: 'Search...',
                description: 'Placeholder text when empty',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'searchDelay',
                displayName: 'Search Delay',
                type: PropertyType.Integer,
                defaultValue: 300,
                description: 'Delay before triggering search (ms)',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'showClearButton',
                displayName: 'Show Clear Button',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show the clear button',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'search',
                displayName: 'Search',
                description: 'Occurs when a search is triggered',
                eventArgsType: 'SearchEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['input', 'text', 'search', 'find', 'filter', 'query'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        super._renderToBuffer(buffer, x, y, width, height, options);
        
        // Draw search icon
        const textY = y + Math.floor(height / 2);
        buffer[textY][x + 1] = '🔍';
        
        // Draw clear button if there's text
        const text = this.get('text');
        if (text && this.get('showClearButton')) {
            buffer[textY][x + width - 2] = '✕';
        }
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    TextBox,
    PasswordBox,
    MaskedTextBox,
    AutoCompleteBox,
    NumericUpDown,
    TextArea,
    SearchBox
};
