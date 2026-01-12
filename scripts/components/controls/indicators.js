/**
 * Asciistrator - Indicator Controls
 * 
 * Status indicator UI components: ProgressBar, Badge, Tooltip, etc.
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
// PROGRESS BAR
// ==========================================

/**
 * Linear progress indicator
 */
export class ProgressBar extends UIComponent {
    static get componentType() { return 'ProgressBar'; }
    static get displayName() { return 'Progress Bar'; }
    static get description() { return 'A linear progress indicator'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return '▓'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 25; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Number,
                defaultValue: 50,
                description: 'Current progress value',
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
                name: 'isIndeterminate',
                displayName: 'Is Indeterminate',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether progress is indeterminate',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'orientation',
                displayName: 'Orientation',
                type: PropertyType.Enum,
                defaultValue: 'Horizontal',
                description: 'Progress bar orientation',
                category: PropertyCategory.Layout,
                enumValues: ['Horizontal', 'Vertical']
            }),
            new PropertyDefinition({
                name: 'showProgressText',
                displayName: 'Show Progress Text',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to show percentage text',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'progressTextFormat',
                displayName: 'Progress Text Format',
                type: PropertyType.String,
                defaultValue: '{0:0}%',
                description: 'Format string for progress text',
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
    
    static get visualStates() {
        return ['normal', 'indeterminate', 'completed'];
    }
    
    static get tags() {
        return ['progress', 'bar', 'loading', 'status', 'indicator'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = this.get('value') || 0;
        const minimum = this.get('minimum') || 0;
        const maximum = this.get('maximum') || 100;
        const isIndeterminate = this.get('isIndeterminate');
        const orientation = this.get('orientation') || 'Horizontal';
        const showProgressText = this.get('showProgressText');
        
        const range = maximum - minimum;
        const percent = range > 0 ? (value - minimum) / range : 0;
        
        if (orientation === 'Horizontal') {
            const barWidth = width - 2;
            const filledWidth = isIndeterminate ? 0 : Math.floor(percent * barWidth);
            
            // Draw track
            buffer[y][x] = '[';
            for (let i = 0; i < barWidth; i++) {
                if (isIndeterminate) {
                    // Animated pattern for indeterminate
                    buffer[y][x + 1 + i] = (i % 3 === 0) ? '▓' : '░';
                } else if (i < filledWidth) {
                    buffer[y][x + 1 + i] = '█';
                } else {
                    buffer[y][x + 1 + i] = '░';
                }
            }
            buffer[y][x + width - 1] = ']';
            
            // Draw percentage text
            if (showProgressText && !isIndeterminate && height > 1) {
                const percentText = Math.round(percent * 100) + '%';
                const textX = x + Math.floor((width - percentText.length) / 2);
                ASCIIRenderer.drawText(buffer, textX, y + 1, percentText);
            }
        } else {
            // Vertical progress bar
            const barHeight = height - 2;
            const filledHeight = isIndeterminate ? 0 : Math.floor(percent * barHeight);
            
            buffer[y][x] = '┬';
            for (let i = 0; i < barHeight; i++) {
                const rowY = y + 1 + i;
                const fromBottom = barHeight - 1 - i;
                
                if (isIndeterminate) {
                    buffer[rowY][x] = (i % 3 === 0) ? '▓' : '░';
                } else if (fromBottom < filledHeight) {
                    buffer[rowY][x] = '█';
                } else {
                    buffer[rowY][x] = '░';
                }
            }
            buffer[y + height - 1][x] = '┴';
        }
    }
}

// ==========================================
// PROGRESS RING
// ==========================================

/**
 * Circular progress indicator
 */
export class ProgressRing extends UIComponent {
    static get componentType() { return 'ProgressRing'; }
    static get displayName() { return 'Progress Ring'; }
    static get description() { return 'A circular progress indicator'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return '◐'; } // Note: may need custom implementation
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 5; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Number,
                defaultValue: 0,
                description: 'Current progress value',
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
                name: 'isIndeterminate',
                displayName: 'Is Indeterminate',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether progress is indeterminate',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isActive',
                displayName: 'Is Active',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether the ring is animating',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get tags() {
        return ['progress', 'ring', 'spinner', 'loading', 'circular'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = this.get('value') || 0;
        const minimum = this.get('minimum') || 0;
        const maximum = this.get('maximum') || 100;
        const isIndeterminate = this.get('isIndeterminate');
        const isActive = this.get('isActive');
        
        const range = maximum - minimum;
        const percent = range > 0 ? (value - minimum) / range : 0;
        
        // ASCII representation of a ring
        // Use different characters based on progress segments
        const segments = ['◜', '◝', '◞', '◟']; // Top-left, top-right, bottom-right, bottom-left
        const fullSegment = '●';
        const emptySegment = '○';
        
        if (width >= 5 && height >= 3) {
            // Draw a simple ring representation
            if (isIndeterminate && isActive) {
                // Spinning animation (shown as partial)
                buffer[y][x + 1] = '◠';
                buffer[y][x + 2] = '◡';
                buffer[y + 1][x] = '◜';
                buffer[y + 1][x + 3] = '◝';
                buffer[y + 2][x + 1] = '◟';
                buffer[y + 2][x + 2] = '◞';
            } else {
                // Show progress
                const filledSegments = Math.floor(percent * 8);
                const chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧'];
                
                buffer[y + 1][x + 2] = chars[Math.min(filledSegments, 7)];
            }
        } else {
            // Compact representation
            if (isIndeterminate && isActive) {
                buffer[y][x] = '◐';
            } else {
                const filledQuarters = Math.floor(percent * 4);
                const quarterChars = ['○', '◔', '◑', '◕', '●'];
                buffer[y][x] = quarterChars[filledQuarters];
            }
        }
    }
}

// ==========================================
// BADGE
// ==========================================

/**
 * Badge/notification indicator
 */
export class Badge extends UIComponent {
    static get componentType() { return 'Badge'; }
    static get displayName() { return 'Badge'; }
    static get description() { return 'A badge notification indicator'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return '●'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 3; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.content(''),
            new PropertyDefinition({
                name: 'badgeValue',
                displayName: 'Badge Value',
                type: PropertyType.Integer,
                defaultValue: 0,
                description: 'Numeric value to display',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'maxValue',
                displayName: 'Max Value',
                type: PropertyType.Integer,
                defaultValue: 99,
                description: 'Maximum displayed value',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'showZero',
                displayName: 'Show Zero',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to show badge when value is 0',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'isDot',
                displayName: 'Is Dot',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to show as dot only',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'placement',
                displayName: 'Placement',
                type: PropertyType.Enum,
                defaultValue: 'TopRight',
                description: 'Position of the badge',
                category: PropertyCategory.Layout,
                enumValues: ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight']
            }),
            new PropertyDefinition({
                name: 'status',
                displayName: 'Status',
                type: PropertyType.Enum,
                defaultValue: 'Default',
                description: 'Badge status color',
                category: PropertyCategory.Appearance,
                enumValues: ['Default', 'Success', 'Warning', 'Error', 'Processing']
            })
        ];
    }
    
    static get tags() {
        return ['badge', 'notification', 'count', 'indicator', 'alert'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const badgeValue = this.get('badgeValue') || 0;
        const maxValue = this.get('maxValue') || 99;
        const showZero = this.get('showZero');
        const isDot = this.get('isDot');
        const status = this.get('status') || 'Default';
        
        if (badgeValue === 0 && !showZero && !isDot) {
            return; // Don't show empty badge
        }
        
        if (isDot) {
            buffer[y][x] = '●';
        } else {
            let displayValue;
            if (badgeValue > maxValue) {
                displayValue = maxValue + '+';
            } else {
                displayValue = String(badgeValue);
            }
            
            // Draw badge with parentheses
            const badgeText = `(${displayValue})`;
            ASCIIRenderer.drawText(buffer, x, y, badgeText);
        }
    }
}

// ==========================================
// INFO BADGE
// ==========================================

/**
 * Informational badge
 */
export class InfoBadge extends UIComponent {
    static get componentType() { return 'InfoBadge'; }
    static get displayName() { return 'Info Badge'; }
    static get description() { return 'An informational status badge'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return 'ⓘ'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 5; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Value to display (number or string)',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'iconSource',
                displayName: 'Icon Source',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Icon to display',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'severity',
                displayName: 'Severity',
                type: PropertyType.Enum,
                defaultValue: 'Informational',
                description: 'Severity level for styling',
                category: PropertyCategory.Appearance,
                enumValues: ['Attention', 'Informational', 'Success', 'Caution', 'Critical']
            })
        ];
    }
    
    static get tags() {
        return ['info', 'badge', 'status', 'severity', 'indicator'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = this.get('value');
        const severity = this.get('severity') || 'Informational';
        
        // Severity icons
        const severityIcons = {
            'Attention': '⚠',
            'Informational': 'ⓘ',
            'Success': '✓',
            'Caution': '⚡',
            'Critical': '✕'
        };
        
        const icon = severityIcons[severity] || 'ⓘ';
        
        if (value !== null && value !== undefined) {
            const displayText = `${icon}${value}`;
            ASCIIRenderer.drawText(buffer, x, y, displayText);
        } else {
            buffer[y][x] = icon;
        }
    }
}

// ==========================================
// TOOLTIP
// ==========================================

/**
 * Tooltip popup
 */
export class Tooltip extends UIComponent {
    static get componentType() { return 'Tooltip'; }
    static get displayName() { return 'Tooltip'; }
    static get description() { return 'A tooltip popup'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return '💬'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.content('Tooltip text'),
            new PropertyDefinition({
                name: 'tip',
                displayName: 'Tip',
                type: PropertyType.Object,
                defaultValue: 'Tooltip',
                description: 'Tooltip content',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'placement',
                displayName: 'Placement',
                type: PropertyType.Enum,
                defaultValue: 'Top',
                description: 'Tooltip placement',
                category: PropertyCategory.Layout,
                enumValues: ['Top', 'Bottom', 'Left', 'Right', 'Center', 'Pointer']
            }),
            new PropertyDefinition({
                name: 'showDelay',
                displayName: 'Show Delay',
                type: PropertyType.Integer,
                defaultValue: 400,
                description: 'Delay before showing (ms)',
                category: PropertyCategory.Behavior,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'betweenShowDelay',
                displayName: 'Between Show Delay',
                type: PropertyType.Integer,
                defaultValue: 100,
                description: 'Delay between tooltips (ms)',
                category: PropertyCategory.Behavior,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'isOpen',
                displayName: 'Is Open',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether tooltip is shown',
                category: PropertyCategory.Data
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
                defaultValue: 20,
                description: 'Vertical offset from target',
                category: PropertyCategory.Layout
            })
        ];
    }
    
    static get tags() {
        return ['tooltip', 'hint', 'popup', 'help', 'hover'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const content = String(this.get('content') || this.get('tip') || 'Tooltip');
        const placement = this.get('placement') || 'Top';
        
        const style = BorderStyle.Rounded;
        const bufferHeight = buffer.length;
        const bufferWidth = buffer[0]?.length || 0;
        
        // Draw tooltip box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw content
        const textY = y + Math.floor(height / 2);
        const maxWidth = width - 4;
        const displayText = ASCIIRenderer.truncateText(content, maxWidth);
        ASCIIRenderer.drawCenteredText(buffer, textY, displayText, x + 1, width - 2);
        
        // Draw pointer based on placement (with bounds checking)
        const centerX = x + Math.floor(width / 2);
        if (placement === 'Top' || placement === 'Bottom') {
            if (placement === 'Top') {
                if (y + height < bufferHeight && centerX < bufferWidth) {
                    buffer[y + height][centerX] = '▼';
                }
            } else {
                if (y > 0 && centerX < bufferWidth) {
                    buffer[y - 1][centerX] = '▲';
                }
            }
        }
    }
}

// ==========================================
// INFO BAR
// ==========================================

/**
 * Information bar notification
 */
export class InfoBar extends UIComponent {
    static get componentType() { return 'InfoBar'; }
    static get displayName() { return 'Info Bar'; }
    static get description() { return 'An informational notification bar'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return 'ℹ'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 40; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.title('Information'),
            new PropertyDefinition({
                name: 'message',
                displayName: 'Message',
                type: PropertyType.String,
                defaultValue: 'This is an informational message.',
                description: 'Message text',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'severity',
                displayName: 'Severity',
                type: PropertyType.Enum,
                defaultValue: 'Informational',
                description: 'Severity level for styling',
                category: PropertyCategory.Appearance,
                enumValues: ['Informational', 'Success', 'Warning', 'Error']
            }),
            new PropertyDefinition({
                name: 'isOpen',
                displayName: 'Is Open',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether the info bar is visible',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'isClosable',
                displayName: 'Is Closable',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether the info bar can be closed',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'isIconVisible',
                displayName: 'Is Icon Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether the icon is visible',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'actionButton',
                displayName: 'Action Button',
                type: PropertyType.Object,
                defaultValue: null,
                description: 'Action button content',
                category: PropertyCategory.Content
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'closeButtonClick',
                displayName: 'Close Button Click',
                description: 'Occurs when the close button is clicked',
                eventArgsType: 'RoutedEventArgs'
            }),
            new EventDefinition({
                name: 'closing',
                displayName: 'Closing',
                description: 'Occurs when the info bar is closing',
                eventArgsType: 'CancelEventArgs'
            }),
            new EventDefinition({
                name: 'closed',
                displayName: 'Closed',
                description: 'Occurs when the info bar is closed',
                eventArgsType: 'EventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['info', 'bar', 'notification', 'alert', 'message'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const title = String(this.get('title') || 'Information');
        const message = this.get('message') || '';
        const severity = this.get('severity') || 'Informational';
        const isClosable = this.get('isClosable');
        const isIconVisible = this.get('isIconVisible');
        
        // Severity icons
        const severityIcons = {
            'Informational': 'ℹ',
            'Success': '✓',
            'Warning': '⚠',
            'Error': '✕'
        };
        
        const icon = severityIcons[severity] || 'ℹ';
        const style = BorderStyle.Single;
        
        // Draw frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        let textX = x + 2;
        
        // Draw icon
        if (isIconVisible) {
            buffer[y + 1][textX] = icon;
            textX += 2;
        }
        
        // Draw title
        const maxTitleWidth = isClosable ? width - textX - 5 : width - textX - 2;
        const displayTitle = ASCIIRenderer.truncateText(title, maxTitleWidth);
        ASCIIRenderer.drawText(buffer, textX, y + 1, displayTitle);
        
        // Draw message if there's space
        if (height > 2 && message) {
            const maxMsgWidth = width - 4;
            const displayMessage = ASCIIRenderer.truncateText(message, maxMsgWidth);
            ASCIIRenderer.drawText(buffer, x + 2, y + 2, displayMessage);
        }
        
        // Draw close button
        if (isClosable) {
            buffer[y + 1][x + width - 3] = '✕';
        }
    }
}

// ==========================================
// LOADING INDICATOR
// ==========================================

/**
 * Loading spinner indicator
 */
export class LoadingIndicator extends UIComponent {
    static get componentType() { return 'LoadingIndicator'; }
    static get displayName() { return 'Loading Indicator'; }
    static get description() { return 'A loading spinner indicator'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return '⟳'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 15; }
    static get defaultHeight() { return 1; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'isLoading',
                displayName: 'Is Loading',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether loading is active',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'text',
                displayName: 'Text',
                type: PropertyType.String,
                defaultValue: 'Loading...',
                description: 'Loading text message',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'spinnerStyle',
                displayName: 'Spinner Style',
                type: PropertyType.Enum,
                defaultValue: 'Dots',
                description: 'Style of the spinner animation',
                category: PropertyCategory.Appearance,
                enumValues: ['Dots', 'Spinner', 'Bar', 'Bounce']
            })
        ];
    }
    
    static get tags() {
        return ['loading', 'spinner', 'wait', 'busy', 'indicator'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const isLoading = this.get('isLoading');
        const text = this.get('text') || 'Loading...';
        const spinnerStyle = this.get('spinnerStyle') || 'Dots';
        
        if (!isLoading) {
            return;
        }
        
        // Spinner characters by style
        const spinners = {
            'Dots': '⣾⣽⣻⢿⡿⣟⣯⣷',
            'Spinner': '◐◓◑◒',
            'Bar': '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁',
            'Bounce': '⠁⠂⠄⠂'
        };
        
        const chars = spinners[spinnerStyle] || spinners['Dots'];
        // Use first char for static preview
        const spinnerChar = chars[0];
        
        // Draw spinner and text
        buffer[y][x] = spinnerChar;
        const maxTextWidth = width - 2;
        const displayText = ASCIIRenderer.truncateText(text, maxTextWidth);
        ASCIIRenderer.drawText(buffer, x + 2, y, displayText);
    }
}

// ==========================================
// SKELETON
// ==========================================

/**
 * Loading skeleton placeholder
 */
export class Skeleton extends UIComponent {
    static get componentType() { return 'Skeleton'; }
    static get displayName() { return 'Skeleton'; }
    static get description() { return 'A loading skeleton placeholder'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return '▒'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 5; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'isLoading',
                displayName: 'Is Loading',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether skeleton is shown',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'variant',
                displayName: 'Variant',
                type: PropertyType.Enum,
                defaultValue: 'Text',
                description: 'Type of skeleton',
                category: PropertyCategory.Appearance,
                enumValues: ['Text', 'Circular', 'Rectangular', 'Rounded']
            }),
            new PropertyDefinition({
                name: 'animation',
                displayName: 'Animation',
                type: PropertyType.Enum,
                defaultValue: 'Pulse',
                description: 'Animation style',
                category: PropertyCategory.Appearance,
                enumValues: ['None', 'Pulse', 'Wave']
            }),
            new PropertyDefinition({
                name: 'lines',
                displayName: 'Lines',
                type: PropertyType.Integer,
                defaultValue: 3,
                description: 'Number of text lines',
                category: PropertyCategory.Appearance,
                minValue: 1
            })
        ];
    }
    
    static get tags() {
        return ['skeleton', 'loading', 'placeholder', 'shimmer'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const isLoading = this.get('isLoading');
        const variant = this.get('variant') || 'Text';
        const lines = this.get('lines') || 3;
        
        if (!isLoading) {
            return;
        }
        
        if (variant === 'Text') {
            // Draw skeleton text lines
            for (let i = 0; i < Math.min(lines, height); i++) {
                const lineWidth = i === lines - 1 ? Math.floor(width * 0.6) : width;
                for (let j = 0; j < lineWidth; j++) {
                    buffer[y + i][x + j] = '░';
                }
            }
        } else if (variant === 'Circular') {
            // Draw circular skeleton
            const radius = Math.min(width, height) / 2;
            const centerY = y + Math.floor(height / 2);
            const centerX = x + Math.floor(width / 2);
            
            buffer[centerY][centerX] = '○';
            if (width > 2) {
                buffer[centerY][centerX - 1] = '░';
                buffer[centerY][centerX + 1] = '░';
            }
        } else if (variant === 'Rectangular' || variant === 'Rounded') {
            // Draw rectangular skeleton
            const style = variant === 'Rounded' ? BorderStyle.Rounded : BorderStyle.Single;
            
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    buffer[y + row][x + col] = '░';
                }
            }
        }
    }
}

// ==========================================
// NOTIFICATION
// ==========================================

/**
 * Notification popup
 */
export class Notification extends UIComponent {
    static get componentType() { return 'Notification'; }
    static get displayName() { return 'Notification'; }
    static get description() { return 'A notification popup message'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return '🔔'; }
    static get contentModel() { return ContentModel.Single; }
    static get defaultWidth() { return 35; }
    static get defaultHeight() { return 5; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            CommonProperties.title('Notification'),
            new PropertyDefinition({
                name: 'message',
                displayName: 'Message',
                type: PropertyType.String,
                defaultValue: 'This is a notification message.',
                description: 'Notification message',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'type',
                displayName: 'Type',
                type: PropertyType.Enum,
                defaultValue: 'Information',
                description: 'Notification type',
                category: PropertyCategory.Appearance,
                enumValues: ['Information', 'Success', 'Warning', 'Error']
            }),
            new PropertyDefinition({
                name: 'expiration',
                displayName: 'Expiration',
                type: PropertyType.TimeSpan,
                defaultValue: '00:00:05',
                description: 'Time before auto-close',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'onClick',
                displayName: 'On Click',
                type: PropertyType.Command,
                defaultValue: null,
                description: 'Action when clicked',
                category: PropertyCategory.Behavior
            }),
            new PropertyDefinition({
                name: 'onClose',
                displayName: 'On Close',
                type: PropertyType.Command,
                defaultValue: null,
                description: 'Action when closed',
                category: PropertyCategory.Behavior
            })
        ];
    }
    
    static get tags() {
        return ['notification', 'toast', 'alert', 'message', 'popup'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const title = String(this.get('title') || 'Notification');
        const message = this.get('message') || '';
        const type = this.get('type') || 'Information';
        
        // Type icons
        const typeIcons = {
            'Information': 'ℹ',
            'Success': '✓',
            'Warning': '⚠',
            'Error': '✕'
        };
        
        const icon = typeIcons[type] || 'ℹ';
        const style = BorderStyle.Rounded;
        
        // Draw notification box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw icon and title
        buffer[y + 1][x + 2] = icon;
        const maxTitleWidth = width - 8;
        const displayTitle = ASCIIRenderer.truncateText(title, maxTitleWidth);
        ASCIIRenderer.drawText(buffer, x + 4, y + 1, displayTitle);
        
        // Draw close button
        buffer[y + 1][x + width - 3] = '✕';
        
        // Draw message
        if (message && height > 3) {
            const maxMsgWidth = width - 4;
            const displayMessage = ASCIIRenderer.truncateText(message, maxMsgWidth);
            ASCIIRenderer.drawText(buffer, x + 2, y + 2, displayMessage);
        }
        
        // Draw progress bar at bottom (expiration indicator)
        if (height > 3) {
            for (let i = 1; i < width - 1; i++) {
                buffer[y + height - 2][x + i] = '▓';
            }
        }
    }
}

// ==========================================
// GAUGE
// ==========================================

/**
 * Radial gauge / dial indicator control
 */
export class Gauge extends UIComponent {
    static get componentType() { return 'Gauge'; }
    static get displayName() { return 'Gauge'; }
    static get description() { return 'A radial gauge/dial indicator for displaying values'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return '◔'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 15; }
    static get defaultHeight() { return 8; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Number,
                defaultValue: 50,
                description: 'Current gauge value',
                category: PropertyCategory.Data,
                minValue: 0,
                maxValue: 100
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
                name: 'startAngle',
                displayName: 'Start Angle',
                type: PropertyType.Number,
                defaultValue: -135,
                description: 'Start angle in degrees',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'endAngle',
                displayName: 'End Angle',
                type: PropertyType.Number,
                defaultValue: 135,
                description: 'End angle in degrees',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'showValue',
                displayName: 'Show Value',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether to show the value label',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'unit',
                displayName: 'Unit',
                type: PropertyType.String,
                defaultValue: '%',
                description: 'Unit label to display',
                category: PropertyCategory.Content
            }),
            new PropertyDefinition({
                name: 'tickCount',
                displayName: 'Tick Count',
                type: PropertyType.Integer,
                defaultValue: 5,
                description: 'Number of major ticks',
                category: PropertyCategory.Appearance,
                minValue: 0
            }),
            new PropertyDefinition({
                name: 'needleColor',
                displayName: 'Needle Color',
                type: PropertyType.Brush,
                defaultValue: '#FF0000',
                description: 'Gauge needle color',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'scaleColor',
                displayName: 'Scale Color',
                type: PropertyType.Brush,
                defaultValue: '#333333',
                description: 'Scale/track color',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'valueColor',
                displayName: 'Value Color',
                type: PropertyType.Brush,
                defaultValue: '#00FF00',
                description: 'Value arc color',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'valueChanged',
                displayName: 'Value Changed',
                description: 'Occurs when the value changes',
                eventArgsType: 'RangeBaseValueChangedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['gauge', 'dial', 'meter', 'indicator', 'speedometer', 'radial'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = this.get('value') || 50;
        const minimum = this.get('minimum') || 0;
        const maximum = this.get('maximum') || 100;
        const showValue = this.get('showValue') !== false;
        const unit = this.get('unit') || '%';
        
        const percentage = (value - minimum) / (maximum - minimum);
        
        // Draw semi-circular gauge using ASCII art
        const centerX = x + Math.floor(width / 2);
        const centerY = y + height - 2;
        const radius = Math.min(Math.floor(width / 2) - 1, height - 2);
        
        // Draw gauge arc (semicircle)
        const arcChars = '╭─────╮';
        if (width >= 9) {
            // Top arc
            ASCIIRenderer.drawCenteredText(buffer, y, '╭───────╮', x, width);
            
            // Side arcs
            if (height > 3) {
                buffer[y + 1][x + 1] = '│';
                buffer[y + 1][x + width - 2] = '│';
            }
            if (height > 4) {
                buffer[y + 2][x] = '╰';
                buffer[y + 2][x + width - 1] = '╯';
            }
        } else {
            // Simpler representation for small sizes
            ASCIIRenderer.drawCenteredText(buffer, y, '╭─╮', x, width);
        }
        
        // Draw scale markers
        if (width >= 11 && height >= 5) {
            buffer[y + 1][x + 2] = '╱';  // Left marker
            buffer[y + 1][x + width - 3] = '╲';  // Right marker
            buffer[y][centerX] = '┬';  // Top marker
        }
        
        // Draw needle indicator (simplified as position marker)
        const needlePos = Math.floor(percentage * (width - 4)) + x + 2;
        if (height >= 4) {
            buffer[y + Math.floor(height / 2)][needlePos] = '▼';
        }
        
        // Draw value at bottom center
        if (showValue) {
            const valueStr = `${value}${unit}`;
            ASCIIRenderer.drawCenteredText(buffer, y + height - 1, valueStr, x, width);
        }
        
        // Draw min/max labels
        if (width >= 13 && height >= 4) {
            ASCIIRenderer.drawText(buffer, x, y + height - 2, String(minimum));
            const maxStr = String(maximum);
            ASCIIRenderer.drawText(buffer, x + width - maxStr.length, y + height - 2, maxStr);
        }
    }
}

// ==========================================
// SPARKLINE
// ==========================================

/**
 * Small inline chart/trend indicator
 */
export class Sparkline extends UIComponent {
    static get componentType() { return 'Sparkline'; }
    static get displayName() { return 'Sparkline'; }
    static get description() { return 'A small inline chart for showing trends'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return '📈'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 20; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'data',
                displayName: 'Data',
                type: PropertyType.Array,
                defaultValue: [1, 3, 2, 5, 4, 6, 3, 7, 5, 8],
                description: 'Data points for the sparkline',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'type',
                displayName: 'Type',
                type: PropertyType.Enum,
                defaultValue: 'Line',
                description: 'Sparkline visualization type',
                category: PropertyCategory.Appearance,
                enumValues: ['Line', 'Bar', 'Area']
            }),
            new PropertyDefinition({
                name: 'showMinMax',
                displayName: 'Show Min/Max',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Highlight minimum and maximum points',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'lineColor',
                displayName: 'Line Color',
                type: PropertyType.Brush,
                defaultValue: '#0078D4',
                description: 'Line/bar color',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'fillColor',
                displayName: 'Fill Color',
                type: PropertyType.Brush,
                defaultValue: '#0078D440',
                description: 'Area fill color',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get tags() {
        return ['sparkline', 'chart', 'trend', 'mini', 'inline', 'graph'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const data = this.get('data') || [1, 3, 2, 5, 4, 6, 3, 7, 5, 8];
        const type = this.get('type') || 'Line';
        const showMinMax = this.get('showMinMax') || false;
        
        if (data.length === 0) return;
        
        const minVal = Math.min(...data);
        const maxVal = Math.max(...data);
        const range = maxVal - minVal || 1;
        
        // Map data to height
        const normalize = (val) => Math.floor(((val - minVal) / range) * (height - 1));
        
        // Sparkline characters
        const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
        
        if (type === 'Bar') {
            // Bar sparkline
            for (let i = 0; i < Math.min(data.length, width); i++) {
                const normalizedHeight = normalize(data[i]);
                const charIndex = Math.min(Math.floor((normalizedHeight / (height - 1)) * (sparkChars.length - 1)), sparkChars.length - 1);
                buffer[y + height - 1][x + i] = sparkChars[charIndex];
                
                // Highlight min/max
                if (showMinMax) {
                    if (data[i] === maxVal) {
                        buffer[y][x + i] = '▲';
                    } else if (data[i] === minVal) {
                        buffer[y + height - 1][x + i] = '▼';
                    }
                }
            }
        } else {
            // Line sparkline
            const prevY = new Array(width).fill(-1);
            
            for (let i = 0; i < Math.min(data.length, width); i++) {
                const normalizedY = y + height - 1 - normalize(data[i]);
                
                if (type === 'Area') {
                    // Fill area below the line
                    for (let fillY = normalizedY; fillY < y + height; fillY++) {
                        buffer[fillY][x + i] = fillY === normalizedY ? '▀' : '░';
                    }
                }
                
                // Draw point
                buffer[normalizedY][x + i] = showMinMax && data[i] === maxVal ? '●' : 
                                              showMinMax && data[i] === minVal ? '○' : '•';
                
                // Draw connecting line
                if (i > 0 && i < data.length) {
                    const prevNormalizedY = y + height - 1 - normalize(data[i - 1]);
                    if (Math.abs(normalizedY - prevNormalizedY) > 1) {
                        const startY = Math.min(normalizedY, prevNormalizedY);
                        const endY = Math.max(normalizedY, prevNormalizedY);
                        for (let lineY = startY + 1; lineY < endY; lineY++) {
                            if (buffer[lineY][x + i - 1] === ' ') {
                                buffer[lineY][x + i - 1] = normalizedY < prevNormalizedY ? '╱' : '╲';
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// HEAT MAP CELL
// ==========================================

/**
 * Single cell in a heat map visualization
 */
export class HeatMapCell extends UIComponent {
    static get componentType() { return 'HeatMapCell'; }
    static get displayName() { return 'Heat Map Cell'; }
    static get description() { return 'A single cell for heat map visualizations'; }
    static get category() { return UICategory.Indicator; }
    static get icon() { return '▦'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 3; }
    static get defaultHeight() { return 2; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'value',
                displayName: 'Value',
                type: PropertyType.Number,
                defaultValue: 0.5,
                description: 'Cell value (0-1)',
                category: PropertyCategory.Data,
                minValue: 0,
                maxValue: 1
            }),
            new PropertyDefinition({
                name: 'colorScheme',
                displayName: 'Color Scheme',
                type: PropertyType.Enum,
                defaultValue: 'Heat',
                description: 'Color scheme for the heat map',
                category: PropertyCategory.Appearance,
                enumValues: ['Heat', 'Cool', 'Viridis', 'Grayscale']
            }),
            new PropertyDefinition({
                name: 'showValue',
                displayName: 'Show Value',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Display the numeric value',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get tags() {
        return ['heatmap', 'cell', 'visualization', 'color', 'intensity'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const value = Math.max(0, Math.min(1, this.get('value') || 0.5));
        const showValue = this.get('showValue') || false;
        
        // Shade characters from light to dark
        const shadeChars = [' ', '░', '▒', '▓', '█'];
        const shadeIndex = Math.floor(value * (shadeChars.length - 1));
        const shadeChar = shadeChars[shadeIndex];
        
        // Fill cell with shade
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                buffer[y + row][x + col] = shadeChar;
            }
        }
        
        // Show value in center if enabled
        if (showValue && width >= 3 && height >= 1) {
            const valueStr = Math.round(value * 100).toString();
            const centerX = x + Math.floor((width - valueStr.length) / 2);
            const centerY = y + Math.floor(height / 2);
            ASCIIRenderer.drawText(buffer, centerX, centerY, valueStr);
        }
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    ProgressBar,
    ProgressRing,
    Badge,
    InfoBadge,
    Tooltip,
    InfoBar,
    LoadingIndicator,
    Skeleton,
    Notification,
    Gauge,
    Sparkline,
    HeatMapCell
};
