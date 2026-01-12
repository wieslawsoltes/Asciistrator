/**
 * Asciistrator - Date/Time Controls
 * 
 * Date and time picker UI components
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
// DATE PICKER
// ==========================================

/**
 * Date selection control
 */
export class DatePicker extends UIComponent {
    static get componentType() { return 'DatePicker'; }
    static get displayName() { return 'Date Picker'; }
    static get description() { return 'A control for selecting dates'; }
    static get category() { return UICategory.DateTime; }
    static get icon() { return '📅'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 18; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'selectedDate',
                displayName: 'Selected Date',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'The selected date',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'displayDate',
                displayName: 'Display Date',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'The date to display when opened',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'displayDateStart',
                displayName: 'Display Date Start',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'First date that can be displayed',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'displayDateEnd',
                displayName: 'Display Date End',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'Last date that can be displayed',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'firstDayOfWeek',
                displayName: 'First Day Of Week',
                type: PropertyType.Enum,
                defaultValue: 'Sunday',
                description: 'First day of the week',
                category: PropertyCategory.Behavior,
                enumValues: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            }),
            new PropertyDefinition({
                name: 'isTodayHighlighted',
                displayName: 'Is Today Highlighted',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: "Whether today's date is highlighted",
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'watermark',
                displayName: 'Watermark',
                type: PropertyType.String,
                defaultValue: 'Select date',
                description: 'Placeholder text when no date selected',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'yearVisible',
                displayName: 'Year Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether year selector is visible',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'monthVisible',
                displayName: 'Month Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether month selector is visible',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'dayVisible',
                displayName: 'Day Visible',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: 'Whether day selector is visible',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.selectedDateChanged(),
            new EventDefinition({
                name: 'calendarOpened',
                displayName: 'Calendar Opened',
                description: 'Occurs when the calendar popup opens',
                eventArgsType: 'EventArgs'
            }),
            new EventDefinition({
                name: 'calendarClosed',
                displayName: 'Calendar Closed',
                description: 'Occurs when the calendar popup closes',
                eventArgsType: 'EventArgs'
            }),
            new EventDefinition({
                name: 'dateValidationError',
                displayName: 'Date Validation Error',
                description: 'Occurs when an invalid date is entered',
                eventArgsType: 'DatePickerDateValidationErrorEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'pointerover', 'pressed', 'disabled', 'hasDate', 'empty'];
    }
    
    static get tags() {
        return ['date', 'picker', 'calendar', 'select', 'datetime'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const selectedDate = this.get('selectedDate');
        const watermark = this.get('watermark') || 'Select date';
        const isEnabled = this.get('isEnabled');
        const yearVisible = this.get('yearVisible');
        const monthVisible = this.get('monthVisible');
        const dayVisible = this.get('dayVisible');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        
        // Draw input box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Format and draw date or watermark
        const textY = y + Math.floor(height / 2);
        let displayText;
        
        if (selectedDate) {
            // Format based on visible parts
            const parts = [];
            if (monthVisible) parts.push('MM');
            if (dayVisible) parts.push('DD');
            if (yearVisible) parts.push('YYYY');
            displayText = parts.join('/');
        } else {
            displayText = watermark;
        }
        
        const maxTextWidth = width - 4;
        displayText = ASCIIRenderer.truncateText(displayText, maxTextWidth);
        ASCIIRenderer.drawText(buffer, x + 1, textY, displayText);
        
        // Draw calendar icon
        buffer[textY][x + width - 2] = '📅';
    }
}

// ==========================================
// TIME PICKER
// ==========================================

/**
 * Time selection control
 */
export class TimePicker extends UIComponent {
    static get componentType() { return 'TimePicker'; }
    static get displayName() { return 'Time Picker'; }
    static get description() { return 'A control for selecting times'; }
    static get category() { return UICategory.DateTime; }
    static get icon() { return '🕐'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 14; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'selectedTime',
                displayName: 'Selected Time',
                type: PropertyType.TimeSpan,
                defaultValue: null,
                description: 'The selected time',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'minuteIncrement',
                displayName: 'Minute Increment',
                type: PropertyType.Integer,
                defaultValue: 1,
                description: 'Increment for minute selector',
                category: PropertyCategory.Behavior,
                minValue: 1,
                maxValue: 60
            }),
            new PropertyDefinition({
                name: 'clockIdentifier',
                displayName: 'Clock Identifier',
                type: PropertyType.Enum,
                defaultValue: '12HourClock',
                description: '12 or 24 hour clock format',
                category: PropertyCategory.Appearance,
                enumValues: ['12HourClock', '24HourClock']
            }),
            new PropertyDefinition({
                name: 'watermark',
                displayName: 'Watermark',
                type: PropertyType.String,
                defaultValue: 'Select time',
                description: 'Placeholder text when no time selected',
                category: PropertyCategory.Common
            }),
            new PropertyDefinition({
                name: 'useSeconds',
                displayName: 'Use Seconds',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether to include seconds',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'selectedTimeChanged',
                displayName: 'Selected Time Changed',
                description: 'Occurs when the selected time changes',
                eventArgsType: 'TimePickerSelectedValueChangedEventArgs'
            })
        ];
    }
    
    static get visualStates() {
        return ['normal', 'pointerover', 'pressed', 'disabled', 'hasTime', 'empty'];
    }
    
    static get tags() {
        return ['time', 'picker', 'clock', 'select', 'datetime'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const selectedTime = this.get('selectedTime');
        const watermark = this.get('watermark') || 'Select time';
        const isEnabled = this.get('isEnabled');
        const clockIdentifier = this.get('clockIdentifier') || '12HourClock';
        const useSeconds = this.get('useSeconds');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        
        // Draw input box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Format and draw time or watermark
        const textY = y + Math.floor(height / 2);
        let displayText;
        
        if (selectedTime) {
            if (clockIdentifier === '12HourClock') {
                displayText = useSeconds ? 'HH:MM:SS AM' : 'HH:MM AM';
            } else {
                displayText = useSeconds ? 'HH:MM:SS' : 'HH:MM';
            }
        } else {
            displayText = watermark;
        }
        
        const maxTextWidth = width - 4;
        displayText = ASCIIRenderer.truncateText(displayText, maxTextWidth);
        ASCIIRenderer.drawText(buffer, x + 1, textY, displayText);
        
        // Draw clock icon
        buffer[textY][x + width - 2] = '🕐';
    }
}

// ==========================================
// CALENDAR
// ==========================================

/**
 * Full calendar control
 */
export class Calendar extends UIComponent {
    static get componentType() { return 'Calendar'; }
    static get displayName() { return 'Calendar'; }
    static get description() { return 'A full calendar for date selection'; }
    static get category() { return UICategory.DateTime; }
    static get icon() { return '📆'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 24; }
    static get defaultHeight() { return 11; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'selectedDate',
                displayName: 'Selected Date',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'The selected date',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'selectedDates',
                displayName: 'Selected Dates',
                type: PropertyType.Collection,
                defaultValue: [],
                description: 'Collection of selected dates',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'displayDate',
                displayName: 'Display Date',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'The date to display',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'displayDateStart',
                displayName: 'Display Date Start',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'First date that can be displayed',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'displayDateEnd',
                displayName: 'Display Date End',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'Last date that can be displayed',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'displayMode',
                displayName: 'Display Mode',
                type: PropertyType.Enum,
                defaultValue: 'Month',
                description: 'Calendar display mode',
                category: PropertyCategory.Appearance,
                enumValues: ['Month', 'Year', 'Decade']
            }),
            new PropertyDefinition({
                name: 'selectionMode',
                displayName: 'Selection Mode',
                type: PropertyType.Enum,
                defaultValue: 'SingleDate',
                description: 'Date selection mode',
                category: PropertyCategory.Behavior,
                enumValues: ['None', 'SingleDate', 'SingleRange', 'MultipleRange']
            }),
            new PropertyDefinition({
                name: 'firstDayOfWeek',
                displayName: 'First Day Of Week',
                type: PropertyType.Enum,
                defaultValue: 'Sunday',
                description: 'First day of the week',
                category: PropertyCategory.Behavior,
                enumValues: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            }),
            new PropertyDefinition({
                name: 'isTodayHighlighted',
                displayName: 'Is Today Highlighted',
                type: PropertyType.Boolean,
                defaultValue: true,
                description: "Whether today's date is highlighted",
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'blackoutDates',
                displayName: 'Blackout Dates',
                type: PropertyType.Collection,
                defaultValue: [],
                description: 'Dates that cannot be selected',
                category: PropertyCategory.Data
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            CommonEvents.selectedDateChanged(),
            new EventDefinition({
                name: 'selectedDatesChanged',
                displayName: 'Selected Dates Changed',
                description: 'Occurs when selected dates change',
                eventArgsType: 'SelectionChangedEventArgs'
            }),
            new EventDefinition({
                name: 'displayDateChanged',
                displayName: 'Display Date Changed',
                description: 'Occurs when the display date changes',
                eventArgsType: 'CalendarDateChangedEventArgs'
            }),
            new EventDefinition({
                name: 'displayModeChanged',
                displayName: 'Display Mode Changed',
                description: 'Occurs when the display mode changes',
                eventArgsType: 'CalendarModeChangedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['calendar', 'date', 'month', 'schedule', 'datetime'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const displayMode = this.get('displayMode') || 'Month';
        const firstDayOfWeek = this.get('firstDayOfWeek') || 'Sunday';
        const isEnabled = this.get('isEnabled');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        
        // Draw calendar frame
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Draw header (month/year navigation)
        const headerY = y + 1;
        buffer[headerY][x + 1] = '◄';
        const headerText = displayMode === 'Month' ? 'January 2024' : 
                          (displayMode === 'Year' ? '2024' : '2020-2029');
        const headerTextX = x + Math.floor((width - headerText.length) / 2);
        ASCIIRenderer.drawText(buffer, headerTextX, headerY, headerText);
        buffer[headerY][x + width - 2] = '►';
        
        // Draw separator
        for (let i = 1; i < width - 1; i++) {
            buffer[y + 2][x + i] = '─';
        }
        
        if (displayMode === 'Month') {
            // Draw day headers
            const days = firstDayOfWeek === 'Sunday' 
                ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
                : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
            const dayHeaderY = y + 3;
            for (let i = 0; i < 7 && x + 2 + i * 3 < x + width - 1; i++) {
                ASCIIRenderer.drawText(buffer, x + 2 + i * 3, dayHeaderY, days[i]);
            }
            
            // Draw day grid (simplified)
            let day = 1;
            for (let row = 0; row < 6 && y + 4 + row < y + height - 1; row++) {
                for (let col = 0; col < 7 && day <= 31; col++) {
                    const cellX = x + 2 + col * 3;
                    const cellY = y + 4 + row;
                    if (cellX + 2 < x + width - 1) {
                        const dayStr = day < 10 ? ' ' + day : String(day);
                        ASCIIRenderer.drawText(buffer, cellX, cellY, dayStr);
                        day++;
                    }
                }
            }
        } else if (displayMode === 'Year') {
            // Draw month grid
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 0; i < 12; i++) {
                const row = Math.floor(i / 4);
                const col = i % 4;
                const monthX = x + 2 + col * 5;
                const monthY = y + 3 + row * 2;
                if (monthY < y + height - 1) {
                    ASCIIRenderer.drawText(buffer, monthX, monthY, months[i]);
                }
            }
        } else {
            // Draw decade grid
            for (let i = 0; i < 10; i++) {
                const row = Math.floor(i / 4);
                const col = i % 4;
                const yearX = x + 2 + col * 5;
                const yearY = y + 3 + row * 2;
                if (yearY < y + height - 1) {
                    const year = 2020 + i;
                    ASCIIRenderer.drawText(buffer, yearX, yearY, String(year));
                }
            }
        }
    }
}

// ==========================================
// CALENDAR DATE PICKER
// ==========================================

/**
 * Compact calendar date picker (dropdown style)
 */
export class CalendarDatePicker extends DatePicker {
    static get componentType() { return 'CalendarDatePicker'; }
    static get displayName() { return 'Calendar Date Picker'; }
    static get description() { return 'A compact date picker with calendar dropdown'; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'isDropDownOpen',
                displayName: 'Is Drop Down Open',
                type: PropertyType.Boolean,
                defaultValue: false,
                description: 'Whether the calendar dropdown is open',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'customDateFormatString',
                displayName: 'Custom Date Format String',
                type: PropertyType.String,
                defaultValue: '',
                description: 'Custom format string for the date',
                category: PropertyCategory.Appearance
            }),
            new PropertyDefinition({
                name: 'dateFormat',
                displayName: 'Date Format',
                type: PropertyType.Enum,
                defaultValue: 'Short',
                description: 'Date display format',
                category: PropertyCategory.Appearance,
                enumValues: ['Short', 'Long', 'Custom']
            })
        ];
    }
    
    static get tags() {
        return ['date', 'picker', 'calendar', 'dropdown', 'datetime'];
    }
}

// ==========================================
// DATE RANGE PICKER
// ==========================================

/**
 * Date range selection control
 */
export class DateRangePicker extends UIComponent {
    static get componentType() { return 'DateRangePicker'; }
    static get displayName() { return 'Date Range Picker'; }
    static get description() { return 'A control for selecting date ranges'; }
    static get category() { return UICategory.DateTime; }
    static get icon() { return '📅↔'; }
    static get contentModel() { return ContentModel.None; }
    static get defaultWidth() { return 28; }
    static get defaultHeight() { return 3; }
    
    static get propertyDefinitions() {
        return [
            ...super.propertyDefinitions,
            new PropertyDefinition({
                name: 'startDate',
                displayName: 'Start Date',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'The start date of the range',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'endDate',
                displayName: 'End Date',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'The end date of the range',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'minimumDate',
                displayName: 'Minimum Date',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'Earliest selectable date',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'maximumDate',
                displayName: 'Maximum Date',
                type: PropertyType.DateTime,
                defaultValue: null,
                description: 'Latest selectable date',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'presetRanges',
                displayName: 'Preset Ranges',
                type: PropertyType.Collection,
                defaultValue: [],
                description: 'Predefined date ranges to choose from',
                category: PropertyCategory.Data
            }),
            new PropertyDefinition({
                name: 'separator',
                displayName: 'Separator',
                type: PropertyType.String,
                defaultValue: ' - ',
                description: 'Text between start and end dates',
                category: PropertyCategory.Appearance
            })
        ];
    }
    
    static get eventDefinitions() {
        return [
            ...super.eventDefinitions,
            new EventDefinition({
                name: 'dateRangeChanged',
                displayName: 'Date Range Changed',
                description: 'Occurs when the date range changes',
                eventArgsType: 'DateRangeChangedEventArgs'
            }),
            new EventDefinition({
                name: 'startDateChanged',
                displayName: 'Start Date Changed',
                description: 'Occurs when the start date changes',
                eventArgsType: 'DateChangedEventArgs'
            }),
            new EventDefinition({
                name: 'endDateChanged',
                displayName: 'End Date Changed',
                description: 'Occurs when the end date changes',
                eventArgsType: 'DateChangedEventArgs'
            })
        ];
    }
    
    static get tags() {
        return ['date', 'range', 'picker', 'period', 'span', 'datetime'];
    }
    
    _renderToBuffer(buffer, x, y, width, height, options = {}) {
        const startDate = this.get('startDate');
        const endDate = this.get('endDate');
        const separator = this.get('separator') || ' - ';
        const isEnabled = this.get('isEnabled');
        
        const style = isEnabled ? BorderStyle.Single : BorderStyle.Dashed;
        
        // Draw input box
        ASCIIRenderer.drawBox(buffer, x, y, width, height, style);
        
        // Format and draw date range
        const textY = y + Math.floor(height / 2);
        let displayText;
        
        if (startDate && endDate) {
            displayText = 'MM/DD/YYYY' + separator + 'MM/DD/YYYY';
        } else if (startDate) {
            displayText = 'MM/DD/YYYY' + separator + '...';
        } else if (endDate) {
            displayText = '...' + separator + 'MM/DD/YYYY';
        } else {
            displayText = 'Select date range';
        }
        
        const maxTextWidth = width - 4;
        displayText = ASCIIRenderer.truncateText(displayText, maxTextWidth);
        ASCIIRenderer.drawText(buffer, x + 1, textY, displayText);
        
        // Draw calendar icon
        buffer[textY][x + width - 2] = '📅';
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    DatePicker,
    TimePicker,
    Calendar,
    CalendarDatePicker,
    DateRangePicker
};
