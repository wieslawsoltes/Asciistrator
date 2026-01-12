/**
 * Asciistrator - Selection Controls
 * 
 * Selection UI components: CheckBox, ToggleSwitch, Slider, etc.
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
// CHECKBOX
// ==========================================

/**
 * Checkbox for binary/ternary selection
 */
export class CheckBox extends UIComponent {
    static get componentType() { return 'CheckBox'; }
    static get displayName() { return 'Check Box'; }
    static get description() { return 'A checkbox for boolean selection'; }
    static get category() { return UICategory.Selection; }
    static get icon() { return '☑'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 15; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.content('Check Box'),
            new PropertyDefinition({
                name: 'isChecked',
                displayName: 'Is Checked',
                type: PropertyType.NullableBoolean,
                defaultValue: false,
                description: 'Whether the checkbox is checked',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'isThreeState',
                displayName: 'Is Three State',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether null (indeterminate) is a valid state',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.click(),
            CommonEvents.checked(),
            CommonEvents.unchecked(),
            new EventDefinition({
                name: 'indeterminate',
                displayName: 'Indeterminate',
                description: 'Occurs when the checkbox becomes indeterminate',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'pointerover', 'pressed', 'disabled', 'checked', 'unchecked', 'indeterminate'];
    }
    
    static get tags() {
        return ['checkbox', 'check', 'toggle', 'boolean', 'option'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || 'Check Box');
        const isChecked = this.get('isChecked');
        const isEnabled = this.get('isEnabled');
        
        // Draw checkbox indicator
        let indicator;
        if (isChecked === true) {
            indicator = '[✓]';
        } else if (isChecked === null) {
            indicator = '[▪]';
        } else {
            indicator = '[ ]';
        }
        
        ASCIIRenderer.drawText(buffer, x, y, indicator);
        
        // Draw label
        const maxTextWidth = width - 4;
        const displayText = ASCIIRenderer.truncateText(content, maxTextWidth);
        ASCIIRenderer.drawText(buffer, x + 4, y, displayText);
    }
}

// ==========================================
// TOGGLE SWITCH
// ==========================================

/**
 * Modern toggle switch control
 */
export class ToggleSwitch extends UIComponent {
    static get componentType() { return 'ToggleSwitch'; }
    static get displayName() { return 'Toggle Switch'; }
    static get description() { return 'A modern toggle switch'; }
    static get category() { return UICategory.Selection; }
    static get icon() { return '◐'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.content('Toggle Switch'),
            new PropertyDefinition({
                name: 'isChecked',
                displayName: 'Is Checked',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the switch is on',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'onContent',
                displayName: 'On Content',
                type: PropertyType.Object,
                defaultValue: 'On',
                description: 'Content displayed when on',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'offContent',
                displayName: 'Off Content',
                type: PropertyType.Object,
                defaultValue: 'Off',
                description: 'Content displayed when off',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'knobTransitions',
                displayName: 'Knob Transitions',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Animation for knob transition',
                category: PropertyCategory.Animation
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.checked(),
            CommonEvents.unchecked(),
            new EventDefinition({
                name: 'isCheckedChanged',
                displayName: 'Is Checked Changed',
                description: 'Occurs when the checked state changes',
                eventArgsType: 'RoutedEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'pointerover', 'pressed', 'disabled', 'checked', 'unchecked'];
    }
    
    static get tags() {
        return ['toggle', 'switch', 'on', 'off', 'boolean'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || '');
        const isChecked = this.get('isChecked');
        const onContent = this.get('onContent') || 'On';
        const offContent = this.get('offContent') || 'Off';
        const isEnabled = this.get('isEnabled');
        
        // Draw content label first
        if (content) {
            ASCIIRenderer.drawText(buffer, x, y, content);
        }
        
        // Draw toggle track
        const trackX = content ? x + content.length + 1 : x;
        const trackWidth = 6;
        
        // Draw track frame
        buffer[y][trackX] = '(';
        for (let i = 1; i < trackWidth - 1; i++) {
            buffer[y][trackX + i] = isChecked ? '=' : '-';
        }
        buffer[y][trackX + trackWidth - 1] = ')';
        
        // Draw knob position
        const knobPos = isChecked ? trackX + trackWidth - 2 : trackX + 1;
        buffer[y][knobPos] = isChecked ? '●' : '○';
        
        // Draw state text
        const stateText = isChecked ? String(onContent) : String(offContent);
        if (trackX + trackWidth + 1 + stateText.length <= x + width) {
            ASCIIRenderer.drawText(buffer, trackX + trackWidth + 1, y, stateText);
        }
    }
}

// ==========================================
// SLIDER
// ==========================================

/**
 * Slider for selecting a value from a range
 */
export class Slider extends UIComponent {
    static get componentType() { return 'Slider'; }
    static get displayName() { return 'Slider'; }
    static get description() { return 'A slider for selecting a value from a range'; }
    static get category() { return UICategory.Range; }
    static get icon() { return '━●━'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'The current slider value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'minimum',
                displayName: 'Minimum',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Minimum allowed value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'maximum',
                displayName: 'Maximum',
                type: PropertyType.Number,
                defaultValue: 100,
                description: 'Maximum allowed value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'tickFrequency',
                displayName: 'Tick Frequency',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Interval between ticks',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'tickPlacement',
                displayName: 'Tick Placement',
                type: PropertyType.Enum,
                defaultValue: 'None',
                description: 'Position of tick marks',
                category: PropertyCategory.Appearance,
                enumValues: ['None', 'TopLeft', 'BottomRight', 'Both']
            }),
            new PropertyDefinition({
                name: 'isSnapToTickEnabled',
                displayName: 'Is Snap To Tick Enabled',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether values snap to tick marks',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Horizontal',
                description: 'Slider orientation',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'isDirectionReversed',
                displayName: 'Is Direction Reversed',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the direction is reversed',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'largeChange',
                displayName: 'Large Change',
                type: PropertyType.Number,
                defaultValue: 10,
                description: 'Amount to change for a large step',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'smallChange',
                displayName: 'Small Change',
                type: PropertyType.Number,
                defaultValue: 1,
                description: 'Amount to change for a small step',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.valueChanged()
        ];
    }
    
    static get visualStates() {
        return ['normal', 'pointerover', 'pressed', 'disabled'];
    }
    
    static get tags() {
        return ['slider', 'range', 'value', 'track', 'thumb'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = this.get('value') || 0;
        const minimum = this.get('minimum') || 0;
        const maximum = this.get('maximum') || 100;
        const orientation = this.get('orientation') || 'Horizontal';
        const tickPlacement = this.get('tickPlacement') || 'None';
        const tickFrequency = this.get('tickFrequency') || 0;
        
        const range = maximum - minimum;
        const percent = range > 0 ? (value - minimum) / range : 0;
        
        if (orientation === 'Horizontal') {
            const trackWidth = width - 2;
            const thumbPos = Math.floor(percent * (trackWidth - 1));
            
            // Draw track
            buffer[y][x] = '[';
            for (let i = 0; i < trackWidth; i++) {
                if (i === thumbPos) {
                    buffer[y][x + 1 + i] = '●';
                } else if (i < thumbPos) {
                    buffer[y][x + 1 + i] = '═';
                } else {
                    buffer[y][x + 1 + i] = '─';
                }
            }
            buffer[y][x + width - 1] = ']';
            
            // Draw ticks if needed
            if (tickPlacement !== 'None' && tickFrequency > 0 && height > 1) {
                const tickRow = tickPlacement === 'TopLeft' ? y - 1 : y + 1;
                if (tickRow >= 0 && tickRow < buffer.length) {
                    for (let v = minimum; v <= maximum; v += tickFrequency) {
                        const tickPercent = (v - minimum) / range;
                        const tickX = x + 1 + Math.floor(tickPercent * (trackWidth - 1));
                        if (tickX < x + width) {
                            buffer[tickRow][tickX] = '│';
                        }
                    }
                }
            }
        } else {
            // Vertical orientation
            const trackHeight = height - 2;
            const thumbPos = Math.floor((1 - percent) * (trackHeight - 1));
            
            buffer[y][x] = '┬';
            for (let i = 0; i < trackHeight; i++) {
                const targetY = y + 1 + i;
                if (i === thumbPos) {
                    buffer[targetY][x] = '●';
                } else if (i > thumbPos) {
                    buffer[targetY][x] = '║';
                } else {
                    buffer[targetY][x] = '│';
                }
            }
            buffer[y + height - 1][x] = '┴';
        }
    }
}

// ==========================================
// RANGE SLIDER
// ==========================================

/**
 * Slider with two thumbs for range selection
 */
export class RangeSlider extends Slider {
    static get componentType() { return 'RangeSlider'; }
    static get displayName() { return 'Range Slider'; }
    static get description() { return 'A slider with two thumbs for range selection'; }
    static get defaultWidth() { return 25; }
    
    static get propertyDefinitions() {
        return [
            ...UIComponent.propertyDefinitions,
            new PropertyDefinition({
                name: 'lowerValue',
                displayName: 'Lower Value',
                type: PropertyType.Number,
                defaultValue: 20,
                description: 'The lower selected value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'upperValue',
                displayName: 'Upper Value',
                type: PropertyType.Number,
                defaultValue: 80,
                description: 'The upper selected value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'minimum',
                displayName: 'Minimum',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Minimum allowed value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'maximum',
                displayName: 'Maximum',
                type: PropertyType.Number,
                defaultValue: 100,
                description: 'Maximum allowed value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'minimumRange',
                displayName: 'Minimum Range',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Minimum distance between thumbs',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Horizontal',
                description: 'Slider orientation',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'lowerValueChanged',
                displayName: 'Lower Value Changed',
                description: 'Occurs when the lower value changes',
                eventArgsType: 'RoutedPropertyChangedEventArgs<double>'
            }),
            new EventDefinition({
                name: 'upperValueChanged',
                displayName: 'Upper Value Changed',
                description: 'Occurs when the upper value changes',
                eventArgsType: 'RoutedPropertyChangedEventArgs<double>'
            })
        ];
    }
    
    static get tags() {
        return ['slider', 'range', 'dual', 'selection', 'bounds'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const lowerValue = this.get('lowerValue') || 20;
        const upperValue = this.get('upperValue') || 80;
        const minimum = this.get('minimum') || 0;
        const maximum = this.get('maximum') || 100;
        
        const range = maximum - minimum;
        const lowerPercent = range > 0 ? (lowerValue - minimum) / range : 0;
        const upperPercent = range > 0 ? (upperValue - minimum) / range : 0;
        
        const trackWidth = width - 2;
        const lowerPos = Math.floor(lowerPercent * (trackWidth - 1));
        const upperPos = Math.floor(upperPercent * (trackWidth - 1));
        
        // Draw track
        buffer[y][x] = '[';
        for (let i = 0; i < trackWidth; i++) {
            if (i === lowerPos || i === upperPos) {
                buffer[y][x + 1 + i] = '●';
            } else if (i > lowerPos && i < upperPos) {
                buffer[y][x + 1 + i] = '═';
            } else {
                buffer[y][x + 1 + i] = '─';
            }
        }
        buffer[y][x + width - 1] = ']';
    }
}

// ==========================================
// SCROLLBAR
// ==========================================

/**
 * Scrollbar control
 */
export class ScrollBar extends UIComponent {
    static get componentType() { return 'ScrollBar'; }
    static get displayName() { return 'Scroll Bar'; }
    static get description() { return 'A scrollbar for scrollable content'; }
    static get category() { return UICategory.Range; }
    static get icon() { return '▮'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 1; }
    static get defaultHeight() { return 10; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Current scroll position',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'minimum',
                displayName: 'Minimum',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Minimum scroll value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'maximum',
                displayName: 'Maximum',
                type: PropertyType.Number,
                defaultValue: 100,
                description: 'Maximum scroll value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'viewportSize',
                displayName: 'Viewport Size',
                type: PropertyType.Number,
                defaultValue: 10,
                description: 'Size of the visible viewport',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Vertical',
                description: 'Scrollbar orientation',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'visibility',
                displayName: 'Visibility',
                type: PropertyType.Enum,
                defaultValue: 'Visible',
                description: 'Scrollbar visibility mode',
                category: PropertyCategory.Appearance,
                enumValues: ['Visible', 'Hidden', 'Auto', 'Disabled']
            }),
            new PropertyDefinition({
                name: 'allowAutoHide',
                displayName: 'Allow Auto Hide',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to auto-hide when not in use',
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
        return ['scrollbar', 'scroll', 'navigate', 'viewport'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = this.get('value') || 0;
        const minimum = this.get('minimum') || 0;
        const maximum = this.get('maximum') || 100;
        const viewportSize = this.get('viewportSize') || 10;
        const orientation = this.get('orientation') || 'Vertical';
        
        const range = maximum - minimum;
        const percent = range > 0 ? (value - minimum) / range : 0;
        const thumbSize = Math.max(1, Math.floor(viewportSize / (range + viewportSize) * (orientation === 'Vertical' ? height - 2 : width - 2)));
        
        if (orientation === 'Vertical') {
            const trackHeight = height - 2;
            const thumbPos = Math.floor(percent * (trackHeight - thumbSize));
            
            // Draw up arrow
            buffer[y][x] = '▲';
            
            // Draw track and thumb
            for (let i = 0; i < trackHeight; i++) {
                const targetY = y + 1 + i;
                if (i >= thumbPos && i < thumbPos + thumbSize) {
                    buffer[targetY][x] = '█';
                } else {
                    buffer[targetY][x] = '░';
                }
            }
            
            // Draw down arrow
            buffer[y + height - 1][x] = '▼';
        } else {
            const trackWidth = width - 2;
            const thumbPos = Math.floor(percent * (trackWidth - thumbSize));
            
            // Draw left arrow
            buffer[y][x] = '◄';
            
            // Draw track and thumb
            for (let i = 0; i < trackWidth; i++) {
                if (i >= thumbPos && i < thumbPos + thumbSize) {
                    buffer[y][x + 1 + i] = '█';
                } else {
                    buffer[y][x + 1 + i] = '░';
                }
            }
            
            // Draw right arrow
            buffer[y][x + width - 1] = '►';
        }
    }
}

// ==========================================
// RATING
// ==========================================

/**
 * Star rating control
 */
export class Rating extends UIComponent {
    static get componentType() { return 'Rating'; }
    static get displayName() { return 'Rating'; }
    static get description() { return 'A star rating control'; }
    static get category() { return UICategory.Selection; }
    static get icon() { return '★'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 10; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Current rating value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'maximum',
                displayName: 'Maximum',
                type: PropertyType.Integer,
                defaultValue: 5,
                description: 'Maximum number of stars',
                category: PropertyCategory.Data,
                minValue: 1
            }),
            new PropertyDefinition({
                name: 'allowHalf',
                displayName: 'Allow Half',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether half ratings are allowed',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isReadOnly',
                displayName: 'Is Read Only',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the rating can be changed',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'emptyChar',
                displayName: 'Empty Char',
                type: PropertyType.Char,
                defaultValue: '☆',
                description: 'Character for empty stars',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'filledChar',
                displayName: 'Filled Char',
                type: PropertyType.Char,
                defaultValue: '★',
                description: 'Character for filled stars',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'halfChar',
                displayName: 'Half Char',
                type: PropertyType.Char,
                defaultValue: '⯪',
                description: 'Character for half stars',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.valueChanged()
        ];
    }
    
    static get tags() {
        return ['rating', 'stars', 'score', 'review', 'feedback'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = this.get('value') || 0;
        const maximum = this.get('maximum') || 5;
        const allowHalf = this.get('allowHalf');
        const emptyChar = this.get('emptyChar') || '☆';
        const filledChar = this.get('filledChar') || '★';
        const halfChar = this.get('halfChar') || '⯪';
        
        for (let i = 0; i < maximum && x + i * 2 < x + width; i++) {
            const starValue = i + 1;
            let char;
            
            if (value >= starValue) {
                char = filledChar;
            } else if (allowHalf && value >= starValue - 0.5) {
                char = halfChar;
            } else {
                char = emptyChar;
            }
            
            buffer[y][x + i * 2] = char;
            if (x + i * 2 + 1 < x + width) {
                buffer[y][x + i * 2 + 1] = ' ';
            }
        }
    }
}

// ==========================================
// COLOR PICKER
// ==========================================

/**
 * Color selection control
 */
export class ColorPicker extends UIComponent {
    static get componentType() { return 'ColorPicker'; }
    static get displayName() { return 'Color Picker'; }
    static get description() { return 'A color selection control'; }
    static get category() { return UICategory.Selection; }
    static get icon() { return '🎨'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 12; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'color',
                displayName: 'Color',
                type: PropertyType.Color,
                defaultValue: '#FF0000',
                description: 'The selected color',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'isAlphaEnabled',
                displayName: 'Is Alpha Enabled',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether alpha channel is editable',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isAlphaVisible',
                displayName: 'Is Alpha Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether alpha slider is visible',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'isHexInputVisible',
                displayName: 'Is Hex Input Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether hex input is visible',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'colorModel',
                displayName: 'Color Model',
                type: PropertyType.Enum,
                defaultValue: 'Rgba',
                description: 'The color model to use',
                category: PropertyCategory.Appearance,
                enumValues: ['Rgba', 'Hsva']
            }),
            new PropertyDefinition({
                name: 'paletteColors',
                displayName: 'Palette Colors',
                type: PropertyType.Collection,
                defaultValue: [],
                description: 'Preset color palette',
                category: PropertyCategory.Data
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.colorChanged()
        ];
    }
    
    static get tags() {
        return ['color', 'picker', 'palette', 'rgb', 'hue'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const color = this.get('color') || '#FF0000';
        const isEnabled = this.get('isEnabled');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        
        // Draw box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw color swatch
        const textY = y + Math.floor(height / 2);
        buffer[textY][x + 1] = '█';
        buffer[textY][x + 2] = '█';
        
        // Draw color hex value
        const maxTextWidth = width - 5;
        const displayText = ASCIIRenderer.truncateText(color, maxTextWidth);
        ASCIIRenderer.drawText(buffer, x + 4, textY, displayText);
    }
}

// ==========================================
// TRACK
// ==========================================

/**
 * Track control used by Slider and ScrollBar
 */
export class Track extends UIComponent {
    static get componentType() { return 'Track'; }
    static get displayName() { return 'Track'; }
    static get description() { return 'A track control for sliders and scrollbars'; }
    static get category() { return UICategory.Selection; }
    static get icon() { return '─●─'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Current value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'minimum',
                displayName: 'Minimum',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Minimum value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'maximum',
                displayName: 'Maximum',
                type: PropertyType.Number,
                defaultValue: 100,
                description: 'Maximum value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Horizontal',
                description: 'Track orientation',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'isDirectionReversed',
                displayName: 'Is Direction Reversed',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether direction is reversed',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'viewportSize',
                displayName: 'Viewport Size',
                type: PropertyType.Number,
                defaultValue: 'NaN',
                description: 'Size of the viewport (for scrollbars)',
                category: PropertyCategory.Layout
            }),
            new PropertyDefinition({
                name: 'thumb',
                displayName: 'Thumb',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'The thumb control',
                category: PropertyCategory.Content
            })
        ];
    }
    
    static get tags() {
        return ['track', 'slider', 'scrollbar', 'thumb', 'range'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = this.get('value') || 0;
        const minimum = this.get('minimum') || 0;
        const maximum = this.get('maximum') || 100;
        const orientation = this.get('orientation') || 'Horizontal';
        
        const range = maximum - minimum;
        const percent = range > 0 ? (value - minimum) / range : 0;
        
        if (orientation === 'Horizontal') {
            const trackWidth = width;
            const thumbPos = Math.floor(percent * (trackWidth - 1));
            
            // Draw track
            for (let i = 0; i < trackWidth; i++) {
                if (i === thumbPos) {
                    buffer[y][x + i] = '●';
                } else if (i === 0) {
                    buffer[y][x + i] = '├';
                } else if (i === trackWidth - 1) {
                    buffer[y][x + i] = '┤';
                } else {
                    buffer[y][x + i] = '─';
                }
            }
        } else {
            const trackHeight = height;
            const thumbPos = Math.floor(percent * (trackHeight - 1));
            
            // Draw vertical track
            for (let i = 0; i < trackHeight; i++) {
                if (i === thumbPos) {
                    buffer[y + i][x] = '●';
                } else if (i === 0) {
                    buffer[y + i][x] = '┬';
                } else if (i === trackHeight - 1) {
                    buffer[y + i][x] = '┴';
                } else {
                    buffer[y + i][x] = '│';
                }
            }
        }
    }
}

// ==========================================
// COLOR VIEW
// ==========================================

/**
 * Full color selection view with spectrum
 */
export class ColorView extends UIComponent {
    static get componentType() { return 'ColorView'; }
    static get displayName() { return 'Color View'; }
    static get description() { return 'A full color selection view with spectrum and components'; }
    static get category() { return UICategory.Selection; }
    static get icon() { return '🎨'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 30; }
    static get defaultHeight() { return 15; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'color',
                displayName: 'Color',
                type: PropertyType.Color,
                defaultValue: '#FF0000',
                description: 'Selected color',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'hueColor',
                displayName: 'Hue Color',
                type: PropertyType.Color,
                defaultValue: '#FF0000',
                description: 'Current hue color',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'colorModel',
                displayName: 'Color Model',
                type: PropertyType.Enum,
                defaultValue: 'Hsva',
                description: 'Color model to use',
                category: PropertyCategory.Appearance,
                enumValues: ['Hsva', 'Rgba']
            }),
            new PropertyDefinition({
                name: 'colorSpectrumShape',
                displayName: 'Color Spectrum Shape',
                type: PropertyType.Enum,
                defaultValue: 'Box',
                description: 'Shape of the color spectrum',
                category: PropertyCategory.Appearance,
                enumValues: ['Box', 'Ring']
            }),
            new PropertyDefinition({
                name: 'colorSpectrumComponents',
                displayName: 'Color Spectrum Components',
                type: PropertyType.Enum,
                defaultValue: 'SaturationValue',
                description: 'Components shown in spectrum',
                category: PropertyCategory.Appearance,
                enumValues: ['HueSaturation', 'HueValue', 'SaturationHue', 'SaturationValue', 'ValueHue', 'ValueSaturation']
            }),
            new PropertyDefinition({
                name: 'isColorSpectrumVisible',
                displayName: 'Is Color Spectrum Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show color spectrum',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'isColorPaletteVisible',
                displayName: 'Is Color Palette Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show color palette',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'isColorComponentsVisible',
                displayName: 'Is Color Components Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show color components (RGB/HSV sliders)',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'isHexInputVisible',
                displayName: 'Is Hex Input Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show hex input',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'isAlphaVisible',
                displayName: 'Is Alpha Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show alpha channel',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.colorChanged()
        ];
    }
    
    static get tags() {
        return ['color', 'view', 'spectrum', 'picker', 'hsv', 'rgb'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const color = this.get('color') || '#FF0000';
        const colorSpectrumShape = this.get('colorSpectrumShape') || 'Box';
        const isColorSpectrumVisible = this.get('isColorSpectrumVisible') !== false;
        const isHexInputVisible = this.get('isHexInputVisible') !== false;
        
        const style = BorderStyle.Single;
        
        // Draw outer frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Title
        ASCIIRenderer.drawCenteredText(buffer, y + 1, 'Color View', x + 1, width - 2);
        
        // Draw color spectrum area
        if (isColorSpectrumVisible && height > 8) {
            const spectrumY = y + 3;
            const spectrumHeight = Math.min(8, height - 6);
            const spectrumWidth = Math.min(15, width - 4);
            
            // Draw spectrum box
            ASCIIRenderer.drawBox(buffer, x + 2, spectrumY, spectrumWidth, spectrumHeight, BorderStyle.Single);
            
            // Fill with gradient representation
            const gradientChars = ['░', '▒', '▓', '█'];
            for (let row = 1; row < spectrumHeight - 1; row++) {
                for (let col = 1; col < spectrumWidth - 1; col++) {
                    const charIndex = Math.floor((col / (spectrumWidth - 2)) * (gradientChars.length - 1));
                    buffer[spectrumY + row][x + 2 + col] = gradientChars[charIndex];
                }
            }
            
            // Draw hue slider to the right
            if (width > spectrumWidth + 8) {
                const hueX = x + spectrumWidth + 4;
                ASCIIRenderer.drawText(buffer, hueX, spectrumY, 'H');
                for (let row = 1; row < spectrumHeight - 1; row++) {
                    buffer[spectrumY + row][hueX] = '│';
                }
            }
        }
        
        // Draw hex input at bottom
        if (isHexInputVisible && height > 4) {
            const hexY = y + height - 2;
            const hexLabel = `Hex: ${color}`;
            ASCIIRenderer.drawText(buffer, x + 2, hexY, hexLabel);
        }
        
        // Draw color preview swatch
        const previewX = x + width - 6;
        const previewY = y + 2;
        if (width > 12) {
            buffer[previewY][previewX] = '█';
            buffer[previewY][previewX + 1] = '█';
            buffer[previewY][previewX + 2] = '█';
            buffer[previewY + 1] && (buffer[previewY + 1][previewX] = '█');
            buffer[previewY + 1] && (buffer[previewY + 1][previewX + 1] = '█');
            buffer[previewY + 1] && (buffer[previewY + 1][previewX + 2] = '█');
        }
    }
}

// ==========================================
// COLOR SPECTRUM
// ==========================================

/**
 * Color spectrum control for hue/saturation selection
 */
export class ColorSpectrum extends UIComponent {
    static get componentType() { return 'ColorSpectrum'; }
    static get displayName() { return 'Color Spectrum'; }
    static get description() { return 'A color spectrum for selecting hue and saturation'; }
    static get category() { return UICategory.Selection; }
    static get icon() { return '◐'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 10; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'color',
                displayName: 'Color',
                type: PropertyType.Color,
                defaultValue: '#FF0000',
                description: 'Selected color',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'hsvColor',
                displayName: 'HSV Color',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Color in HSV format',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'shape',
                displayName: 'Shape',
                type: PropertyType.Enum,
                defaultValue: 'Box',
                description: 'Shape of the spectrum',
                category: PropertyCategory.Appearance,
                enumValues: ['Box', 'Ring']
            }),
            new PropertyDefinition({
                name: 'components',
                displayName: 'Components',
                type: PropertyType.Enum,
                defaultValue: 'SaturationValue',
                description: 'Which color components to display',
                category: PropertyCategory.Appearance,
                enumValues: ['HueSaturation', 'HueValue', 'SaturationHue', 'SaturationValue', 'ValueHue', 'ValueSaturation']
            }),
            new PropertyDefinition({
                name: 'minHue',
                displayName: 'Min Hue',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Minimum hue value',
                category: PropertyCategory.Data,
                minValue: 0,
                maxValue: 359
            }),
            new PropertyDefinition({
                name: 'maxHue',
                displayName: 'Max Hue',
                type: PropertyType.Integer,
                defaultValue: 359,
                description: 'Maximum hue value',
                category: PropertyCategory.Data,
                minValue: 0,
                maxValue: 359
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.colorChanged()
        ];
    }
    
    static get tags() {
        return ['color', 'spectrum', 'hue', 'saturation', 'picker'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const shape = this.get('shape') || 'Box';
        
        if (shape === 'Box') {
            // Draw box spectrum
            const style = BorderStyle.Single;
            ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
            
            // Fill with gradient
            const gradientChars = ['░', '▒', '▓', '█'];
            for (let row = 1; row < height - 1; row++) {
                for (let col = 1; col < width - 1; col++) {
                    const colRatio = col / (width - 2);
                    const rowRatio = 1 - (row / (height - 2));
                    const charIndex = Math.floor(colRatio * (gradientChars.length - 1));
                    buffer[y + row][x + col] = gradientChars[charIndex];
                }
            }
            
            // Draw selection cursor
            const cursorX = x + Math.floor(width / 2);
            const cursorY = y + Math.floor(height / 2);
            buffer[cursorY][cursorX] = '◎';
        } else {
            // Draw ring spectrum (simplified)
            const centerX = x + Math.floor(width / 2);
            const centerY = y + Math.floor(height / 2);
            const radius = Math.min(width / 2, height / 2) - 1;
            
            // Draw ring approximation
            buffer[centerY - radius][centerX] = '◡';
            buffer[centerY + radius][centerX] = '◠';
            buffer[centerY][centerX - radius * 2] = '(';
            buffer[centerY][centerX + radius * 2] = ')';
            
            // Center marker
            buffer[centerY][centerX] = '●';
        }
    }
}

// ==========================================
// COLOR SLIDER
// ==========================================

/**
 * Color slider for individual color component
 */
export class ColorSlider extends UIComponent {
    static get componentType() { return 'ColorSlider'; }
    static get displayName() { return 'Color Slider'; }
    static get description() { return 'A slider for selecting individual color components'; }
    static get category() { return UICategory.Selection; }
    static get icon() { return '━●'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Current value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'color',
                displayName: 'Color',
                type: PropertyType.Color,
                defaultValue: '#FF0000',
                description: 'Current color',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'colorComponent',
                displayName: 'Color Component',
                type: PropertyType.Enum,
                defaultValue: 'Hue',
                description: 'Which color component this slider controls',
                category: PropertyCategory.Data,
                enumValues: ['Hue', 'Saturation', 'Value', 'Alpha', 'Red', 'Green', 'Blue']
            }),
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Horizontal',
                description: 'Slider orientation',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'isRoundingEnabled',
                displayName: 'Is Rounding Enabled',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to round values',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.colorChanged()
        ];
    }
    
    static get tags() {
        return ['color', 'slider', 'hue', 'saturation', 'alpha'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = this.get('value') || 0;
        const colorComponent = this.get('colorComponent') || 'Hue';
        const orientation = this.get('orientation') || 'Horizontal';
        
        // Get max value based on component
        let maxValue = 100;
        if (colorComponent === 'Hue') maxValue = 360;
        else if (['Red', 'Green', 'Blue', 'Alpha'].includes(colorComponent)) maxValue = 255;
        
        const percent = value / maxValue;
        
        if (orientation === 'Horizontal') {
            const trackWidth = width;
            const thumbPos = Math.floor(percent * (trackWidth - 1));
            
            // Draw gradient track
            const gradientChars = ['░', '▒', '▓', '█'];
            for (let i = 0; i < trackWidth; i++) {
                if (i === thumbPos) {
                    buffer[y][x + i] = '●';
                } else {
                    const charIndex = Math.floor((i / trackWidth) * (gradientChars.length - 1));
                    buffer[y][x + i] = gradientChars[charIndex];
                }
            }
        } else {
            const trackHeight = height;
            const thumbPos = Math.floor(percent * (trackHeight - 1));
            
            const gradientChars = ['░', '▒', '▓', '█'];
            for (let i = 0; i < trackHeight; i++) {
                if (i === thumbPos) {
                    buffer[y + i][x] = '●';
                } else {
                    const charIndex = Math.floor((i / trackHeight) * (gradientChars.length - 1));
                    buffer[y + i][x] = gradientChars[charIndex];
                }
            }
        }
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    CheckBox,
    ToggleSwitch,
    Slider,
    RangeSlider,
    ScrollBar,
    Rating,
    ColorPicker,
    Track,
    ColorView,
    ColorSpectrum,
    ColorSlider
};
