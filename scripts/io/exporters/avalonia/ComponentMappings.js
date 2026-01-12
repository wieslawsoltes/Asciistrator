/**
 * Asciistrator - Avalonia Component Mappings
 * 
 * Comprehensive mapping configuration for UI components to Avalonia XAML.
 * Defines how Asciistrator components translate to Avalonia controls.
 * 
 * @version 1.0.0
 */

// ==========================================
// PROPERTY CONVERTERS
// ==========================================

/**
 * Property converter types
 */
export const PropertyConverterType = Object.freeze({
    String: 'string',
    Integer: 'integer',
    Double: 'double',
    Boolean: 'boolean',
    NullableBoolean: 'nullable-boolean',
    Dimension: 'dimension',
    Binding: 'binding',
    Collection: 'collection',
    Orientation: 'orientation',
    Dock: 'dock',
    ExpandDirection: 'expand-direction',
    SelectionMode: 'selection-mode',
    RowDefinitions: 'row-definitions',
    ColumnDefinitions: 'column-definitions',
    Thickness: 'thickness',
    Brush: 'brush',
    FontWeight: 'font-weight',
    FontStyle: 'font-style',
    HorizontalAlignment: 'horizontal-alignment',
    VerticalAlignment: 'vertical-alignment',
    TextAlignment: 'text-alignment',
    TextWrapping: 'text-wrapping',
    ScrollBarVisibility: 'scrollbar-visibility',
    GridLength: 'grid-length',
    CornerRadius: 'corner-radius'
});

// ==========================================
// COMPONENT MAPPINGS
// ==========================================

/**
 * Complete component mappings for Avalonia XAML export
 */
export const AVALONIA_COMPONENT_MAPPINGS = [
    // ==========================================
    // BASIC INPUT CONTROLS - BUTTONS
    // ==========================================
    
    {
        sourceId: 'ui-button',
        avaloniaControl: 'Button',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'text', target: 'Content', converter: PropertyConverterType.String },
            { source: 'content', target: 'Content', converter: PropertyConverterType.String },
            { source: 'width', target: 'Width', converter: PropertyConverterType.Dimension },
            { source: 'height', target: 'Height', converter: PropertyConverterType.Dimension },
            { source: 'enabled', target: 'IsEnabled', converter: PropertyConverterType.Boolean },
            { source: 'command', target: 'Command', converter: PropertyConverterType.Binding },
            { source: 'commandParameter', target: 'CommandParameter', converter: PropertyConverterType.Binding },
            { source: 'isDefault', target: 'IsDefault', converter: PropertyConverterType.Boolean },
            { source: 'isCancel', target: 'IsCancel', converter: PropertyConverterType.Boolean },
            { source: 'clickMode', target: 'ClickMode', converter: PropertyConverterType.String },
            { source: 'horizontalContentAlignment', target: 'HorizontalContentAlignment', converter: PropertyConverterType.HorizontalAlignment },
            { source: 'verticalContentAlignment', target: 'VerticalContentAlignment', converter: PropertyConverterType.VerticalAlignment }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiButton'
    },
    
    {
        sourceId: 'ui-repeat-button',
        avaloniaControl: 'RepeatButton',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'content', target: 'Content', converter: PropertyConverterType.String },
            { source: 'delay', target: 'Delay', converter: PropertyConverterType.Integer },
            { source: 'interval', target: 'Interval', converter: PropertyConverterType.Integer },
            { source: 'command', target: 'Command', converter: PropertyConverterType.Binding }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiRepeatButton'
    },
    
    {
        sourceId: 'ui-toggle-button',
        avaloniaControl: 'ToggleButton',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'content', target: 'Content', converter: PropertyConverterType.String },
            { source: 'isChecked', target: 'IsChecked', converter: PropertyConverterType.NullableBoolean },
            { source: 'isThreeState', target: 'IsThreeState', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiToggleButton'
    },
    
    {
        sourceId: 'ui-split-button',
        avaloniaControl: 'SplitButton',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'content', target: 'Content', converter: PropertyConverterType.String },
            { source: 'command', target: 'Command', converter: PropertyConverterType.Binding }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiSplitButton'
    },
    
    {
        sourceId: 'ui-dropdown-button',
        avaloniaControl: 'DropDownButton',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'content', target: 'Content', converter: PropertyConverterType.String }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiDropDownButton'
    },
    
    {
        sourceId: 'ui-hyperlink-button',
        avaloniaControl: 'HyperlinkButton',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'content', target: 'Content', converter: PropertyConverterType.String },
            { source: 'navigateUri', target: 'NavigateUri', converter: PropertyConverterType.String }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiHyperlinkButton'
    },
    
    // ==========================================
    // TEXT INPUT CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-textbox',
        avaloniaControl: 'TextBox',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'text', target: 'Text', converter: PropertyConverterType.String },
            { source: 'placeholder', target: 'Watermark', converter: PropertyConverterType.String },
            { source: 'watermark', target: 'Watermark', converter: PropertyConverterType.String },
            { source: 'maxLength', target: 'MaxLength', converter: PropertyConverterType.Integer },
            { source: 'multiline', target: 'AcceptsReturn', converter: PropertyConverterType.Boolean },
            { source: 'acceptsReturn', target: 'AcceptsReturn', converter: PropertyConverterType.Boolean },
            { source: 'acceptsTab', target: 'AcceptsTab', converter: PropertyConverterType.Boolean },
            { source: 'readonly', target: 'IsReadOnly', converter: PropertyConverterType.Boolean },
            { source: 'textWrapping', target: 'TextWrapping', converter: PropertyConverterType.TextWrapping },
            { source: 'horizontalScrollBarVisibility', target: 'HorizontalScrollBarVisibility', converter: PropertyConverterType.ScrollBarVisibility },
            { source: 'verticalScrollBarVisibility', target: 'VerticalScrollBarVisibility', converter: PropertyConverterType.ScrollBarVisibility }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiTextBox'
    },
    
    {
        sourceId: 'ui-password-box',
        avaloniaControl: 'TextBox',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'password', target: 'Text', converter: PropertyConverterType.String },
            { source: 'passwordChar', target: 'PasswordChar', converter: PropertyConverterType.String },
            { source: 'revealPassword', target: 'RevealPassword', converter: PropertyConverterType.Boolean },
            { source: 'maxLength', target: 'MaxLength', converter: PropertyConverterType.Integer }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiPasswordBox',
        additionalAttributes: { 'PasswordChar': '●' }
    },
    
    {
        sourceId: 'ui-masked-textbox',
        avaloniaControl: 'MaskedTextBox',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'text', target: 'Text', converter: PropertyConverterType.String },
            { source: 'mask', target: 'Mask', converter: PropertyConverterType.String },
            { source: 'promptChar', target: 'PromptChar', converter: PropertyConverterType.String }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiMaskedTextBox'
    },
    
    {
        sourceId: 'ui-autocomplete-box',
        avaloniaControl: 'AutoCompleteBox',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'text', target: 'Text', converter: PropertyConverterType.String },
            { source: 'watermark', target: 'Watermark', converter: PropertyConverterType.String },
            { source: 'items', target: 'ItemsSource', converter: PropertyConverterType.Binding },
            { source: 'filterMode', target: 'FilterMode', converter: PropertyConverterType.String },
            { source: 'minimumPrefixLength', target: 'MinimumPrefixLength', converter: PropertyConverterType.Integer },
            { source: 'minimumPopulateDelay', target: 'MinimumPopulateDelay', converter: PropertyConverterType.String }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiAutoCompleteBox'
    },
    
    // ==========================================
    // NUMERIC INPUT CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-numeric-updown',
        avaloniaControl: 'NumericUpDown',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'value', target: 'Value', converter: PropertyConverterType.Double },
            { source: 'minimum', target: 'Minimum', converter: PropertyConverterType.Double },
            { source: 'maximum', target: 'Maximum', converter: PropertyConverterType.Double },
            { source: 'increment', target: 'Increment', converter: PropertyConverterType.Double },
            { source: 'formatString', target: 'FormatString', converter: PropertyConverterType.String },
            { source: 'watermark', target: 'Watermark', converter: PropertyConverterType.String },
            { source: 'showButtonSpinner', target: 'ShowButtonSpinner', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiNumericUpDown'
    },
    
    // ==========================================
    // SELECTION CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-checkbox',
        avaloniaControl: 'CheckBox',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'label', target: 'Content', converter: PropertyConverterType.String },
            { source: 'content', target: 'Content', converter: PropertyConverterType.String },
            { source: 'checked', target: 'IsChecked', converter: PropertyConverterType.NullableBoolean },
            { source: 'isChecked', target: 'IsChecked', converter: PropertyConverterType.NullableBoolean },
            { source: 'threeState', target: 'IsThreeState', converter: PropertyConverterType.Boolean },
            { source: 'isThreeState', target: 'IsThreeState', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiCheckBox'
    },
    
    {
        sourceId: 'ui-radio-button',
        avaloniaControl: 'RadioButton',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'content', target: 'Content', converter: PropertyConverterType.String },
            { source: 'isChecked', target: 'IsChecked', converter: PropertyConverterType.Boolean },
            { source: 'groupName', target: 'GroupName', converter: PropertyConverterType.String }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiRadioButton'
    },
    
    {
        sourceId: 'ui-toggle-switch',
        avaloniaControl: 'ToggleSwitch',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'isOn', target: 'IsChecked', converter: PropertyConverterType.Boolean },
            { source: 'isChecked', target: 'IsChecked', converter: PropertyConverterType.Boolean },
            { source: 'onContent', target: 'OnContent', converter: PropertyConverterType.String },
            { source: 'offContent', target: 'OffContent', converter: PropertyConverterType.String }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiToggleSwitch'
    },
    
    // ==========================================
    // LIST CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-combobox',
        avaloniaControl: 'ComboBox',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'items', target: 'ItemsSource', converter: PropertyConverterType.Binding },
            { source: 'selectedItem', target: 'SelectedItem', converter: PropertyConverterType.Binding },
            { source: 'selectedIndex', target: 'SelectedIndex', converter: PropertyConverterType.Integer },
            { source: 'placeholder', target: 'PlaceholderText', converter: PropertyConverterType.String },
            { source: 'placeholderText', target: 'PlaceholderText', converter: PropertyConverterType.String },
            { source: 'isEditable', target: 'IsEditable', converter: PropertyConverterType.Boolean },
            { source: 'maxDropDownHeight', target: 'MaxDropDownHeight', converter: PropertyConverterType.Dimension }
        ],
        contentProperty: 'Items',
        template: null,
        styleClass: 'AsciiComboBox'
    },
    
    {
        sourceId: 'ui-listbox',
        avaloniaControl: 'ListBox',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'items', target: 'ItemsSource', converter: PropertyConverterType.Binding },
            { source: 'selectedItem', target: 'SelectedItem', converter: PropertyConverterType.Binding },
            { source: 'selectedItems', target: 'SelectedItems', converter: PropertyConverterType.Binding },
            { source: 'selectionMode', target: 'SelectionMode', converter: PropertyConverterType.SelectionMode }
        ],
        contentProperty: 'Items',
        template: null,
        styleClass: 'AsciiListBox'
    },
    
    // ==========================================
    // SLIDER CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-slider',
        avaloniaControl: 'Slider',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'value', target: 'Value', converter: PropertyConverterType.Double },
            { source: 'minimum', target: 'Minimum', converter: PropertyConverterType.Double },
            { source: 'maximum', target: 'Maximum', converter: PropertyConverterType.Double },
            { source: 'smallChange', target: 'SmallChange', converter: PropertyConverterType.Double },
            { source: 'largeChange', target: 'LargeChange', converter: PropertyConverterType.Double },
            { source: 'orientation', target: 'Orientation', converter: PropertyConverterType.Orientation },
            { source: 'isSnapToTickEnabled', target: 'IsSnapToTickEnabled', converter: PropertyConverterType.Boolean },
            { source: 'tickFrequency', target: 'TickFrequency', converter: PropertyConverterType.Double },
            { source: 'tickPlacement', target: 'TickPlacement', converter: PropertyConverterType.String }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiSlider'
    },
    
    // ==========================================
    // DATE/TIME CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-datepicker',
        avaloniaControl: 'DatePicker',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'selectedDate', target: 'SelectedDate', converter: PropertyConverterType.Binding },
            { source: 'displayDate', target: 'DisplayDate', converter: PropertyConverterType.Binding },
            { source: 'displayDateStart', target: 'DisplayDateStart', converter: PropertyConverterType.Binding },
            { source: 'displayDateEnd', target: 'DisplayDateEnd', converter: PropertyConverterType.Binding },
            { source: 'dayFormat', target: 'DayFormat', converter: PropertyConverterType.String },
            { source: 'monthFormat', target: 'MonthFormat', converter: PropertyConverterType.String },
            { source: 'yearFormat', target: 'YearFormat', converter: PropertyConverterType.String }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiDatePicker'
    },
    
    {
        sourceId: 'ui-timepicker',
        avaloniaControl: 'TimePicker',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'selectedTime', target: 'SelectedTime', converter: PropertyConverterType.Binding },
            { source: 'minuteIncrement', target: 'MinuteIncrement', converter: PropertyConverterType.Integer },
            { source: 'clockIdentifier', target: 'ClockIdentifier', converter: PropertyConverterType.String }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiTimePicker'
    },
    
    {
        sourceId: 'ui-calendar',
        avaloniaControl: 'Calendar',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'selectedDate', target: 'SelectedDate', converter: PropertyConverterType.Binding },
            { source: 'displayMode', target: 'DisplayMode', converter: PropertyConverterType.String },
            { source: 'selectionMode', target: 'SelectionMode', converter: PropertyConverterType.String },
            { source: 'firstDayOfWeek', target: 'FirstDayOfWeek', converter: PropertyConverterType.String }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiCalendar'
    },
    
    // ==========================================
    // CONTAINER CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-window',
        avaloniaControl: 'Window',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'title', target: 'Title', converter: PropertyConverterType.String },
            { source: 'width', target: 'Width', converter: PropertyConverterType.Dimension },
            { source: 'height', target: 'Height', converter: PropertyConverterType.Dimension },
            { source: 'minWidth', target: 'MinWidth', converter: PropertyConverterType.Dimension },
            { source: 'minHeight', target: 'MinHeight', converter: PropertyConverterType.Dimension },
            { source: 'maxWidth', target: 'MaxWidth', converter: PropertyConverterType.Dimension },
            { source: 'maxHeight', target: 'MaxHeight', converter: PropertyConverterType.Dimension },
            { source: 'canResize', target: 'CanResize', converter: PropertyConverterType.Boolean },
            { source: 'showInTaskbar', target: 'ShowInTaskbar', converter: PropertyConverterType.Boolean },
            { source: 'topmost', target: 'Topmost', converter: PropertyConverterType.Boolean },
            { source: 'windowStartupLocation', target: 'WindowStartupLocation', converter: PropertyConverterType.String },
            { source: 'windowState', target: 'WindowState', converter: PropertyConverterType.String },
            { source: 'systemDecorations', target: 'SystemDecorations', converter: PropertyConverterType.String },
            { source: 'extendClientAreaToDecorationsHint', target: 'ExtendClientAreaToDecorationsHint', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'ui-user-control',
        avaloniaControl: 'UserControl',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'width', target: 'Width', converter: PropertyConverterType.Dimension },
            { source: 'height', target: 'Height', converter: PropertyConverterType.Dimension }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'ui-border',
        avaloniaControl: 'Border',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'background', target: 'Background', converter: PropertyConverterType.Brush },
            { source: 'borderBrush', target: 'BorderBrush', converter: PropertyConverterType.Brush },
            { source: 'borderThickness', target: 'BorderThickness', converter: PropertyConverterType.Thickness },
            { source: 'cornerRadius', target: 'CornerRadius', converter: PropertyConverterType.CornerRadius },
            { source: 'padding', target: 'Padding', converter: PropertyConverterType.Thickness }
        ],
        contentProperty: 'Child',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'ui-panel',
        avaloniaControl: 'Panel',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'background', target: 'Background', converter: PropertyConverterType.Brush }
        ],
        contentProperty: 'Children',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'ui-tabcontrol',
        avaloniaControl: 'TabControl',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'tabPlacement', target: 'TabStripPlacement', converter: PropertyConverterType.Dock },
            { source: 'tabStripPlacement', target: 'TabStripPlacement', converter: PropertyConverterType.Dock },
            { source: 'selectedIndex', target: 'SelectedIndex', converter: PropertyConverterType.Integer },
            { source: 'selectedItem', target: 'SelectedItem', converter: PropertyConverterType.Binding }
        ],
        contentProperty: 'Items',
        template: null,
        styleClass: 'AsciiTabControl'
    },
    
    {
        sourceId: 'ui-tabitem',
        avaloniaControl: 'TabItem',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'header', target: 'Header', converter: PropertyConverterType.String },
            { source: 'isSelected', target: 'IsSelected', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiTabItem'
    },
    
    {
        sourceId: 'ui-expander',
        avaloniaControl: 'Expander',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'header', target: 'Header', converter: PropertyConverterType.String },
            { source: 'expanded', target: 'IsExpanded', converter: PropertyConverterType.Boolean },
            { source: 'isExpanded', target: 'IsExpanded', converter: PropertyConverterType.Boolean },
            { source: 'direction', target: 'ExpandDirection', converter: PropertyConverterType.ExpandDirection },
            { source: 'expandDirection', target: 'ExpandDirection', converter: PropertyConverterType.ExpandDirection }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiExpander'
    },
    
    {
        sourceId: 'ui-groupbox',
        avaloniaControl: 'HeaderedContentControl',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'header', target: 'Header', converter: PropertyConverterType.String }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiGroupBox'
    },
    
    {
        sourceId: 'ui-scrollviewer',
        avaloniaControl: 'ScrollViewer',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'horizontalScrollBarVisibility', target: 'HorizontalScrollBarVisibility', converter: PropertyConverterType.ScrollBarVisibility },
            { source: 'verticalScrollBarVisibility', target: 'VerticalScrollBarVisibility', converter: PropertyConverterType.ScrollBarVisibility },
            { source: 'allowAutoHide', target: 'AllowAutoHide', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'ui-splitview',
        avaloniaControl: 'SplitView',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'isPaneOpen', target: 'IsPaneOpen', converter: PropertyConverterType.Boolean },
            { source: 'displayMode', target: 'DisplayMode', converter: PropertyConverterType.String },
            { source: 'panePlacement', target: 'PanePlacement', converter: PropertyConverterType.String },
            { source: 'openPaneLength', target: 'OpenPaneLength', converter: PropertyConverterType.Dimension },
            { source: 'compactPaneLength', target: 'CompactPaneLength', converter: PropertyConverterType.Dimension }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: 'AsciiSplitView'
    },
    
    {
        sourceId: 'ui-flyout',
        avaloniaControl: 'Flyout',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'placement', target: 'Placement', converter: PropertyConverterType.String },
            { source: 'showMode', target: 'ShowMode', converter: PropertyConverterType.String }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'ui-popup',
        avaloniaControl: 'Popup',
        namespace: 'Avalonia.Controls.Primitives',
        properties: [
            { source: 'isOpen', target: 'IsOpen', converter: PropertyConverterType.Boolean },
            { source: 'placement', target: 'Placement', converter: PropertyConverterType.String },
            { source: 'placementTarget', target: 'PlacementTarget', converter: PropertyConverterType.Binding },
            { source: 'isLightDismissEnabled', target: 'IsLightDismissEnabled', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: 'Child',
        template: null,
        styleClass: null
    },
    
    // ==========================================
    // LAYOUT PANELS
    // ==========================================
    
    {
        sourceId: 'layout-grid',
        avaloniaControl: 'Grid',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'rows', target: 'RowDefinitions', converter: PropertyConverterType.RowDefinitions },
            { source: 'rowDefinitions', target: 'RowDefinitions', converter: PropertyConverterType.RowDefinitions },
            { source: 'columns', target: 'ColumnDefinitions', converter: PropertyConverterType.ColumnDefinitions },
            { source: 'columnDefinitions', target: 'ColumnDefinitions', converter: PropertyConverterType.ColumnDefinitions },
            { source: 'rowSpacing', target: 'RowSpacing', converter: PropertyConverterType.Dimension },
            { source: 'columnSpacing', target: 'ColumnSpacing', converter: PropertyConverterType.Dimension },
            { source: 'showGridLines', target: 'ShowGridLines', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: 'Children',
        attachedProperties: ['Grid.Row', 'Grid.Column', 'Grid.RowSpan', 'Grid.ColumnSpan'],
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'layout-stackpanel',
        avaloniaControl: 'StackPanel',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'orientation', target: 'Orientation', converter: PropertyConverterType.Orientation },
            { source: 'spacing', target: 'Spacing', converter: PropertyConverterType.Dimension }
        ],
        contentProperty: 'Children',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'layout-dockpanel',
        avaloniaControl: 'DockPanel',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'lastChildFill', target: 'LastChildFill', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: 'Children',
        attachedProperties: ['DockPanel.Dock'],
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'layout-wrappanel',
        avaloniaControl: 'WrapPanel',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'orientation', target: 'Orientation', converter: PropertyConverterType.Orientation },
            { source: 'itemWidth', target: 'ItemWidth', converter: PropertyConverterType.Dimension },
            { source: 'itemHeight', target: 'ItemHeight', converter: PropertyConverterType.Dimension }
        ],
        contentProperty: 'Children',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'layout-uniformgrid',
        avaloniaControl: 'UniformGrid',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'rows', target: 'Rows', converter: PropertyConverterType.Integer },
            { source: 'columns', target: 'Columns', converter: PropertyConverterType.Integer }
        ],
        contentProperty: 'Children',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'layout-canvas',
        avaloniaControl: 'Canvas',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'background', target: 'Background', converter: PropertyConverterType.Brush }
        ],
        contentProperty: 'Children',
        attachedProperties: ['Canvas.Left', 'Canvas.Top', 'Canvas.Right', 'Canvas.Bottom'],
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'layout-relativepanel',
        avaloniaControl: 'RelativePanel',
        namespace: 'Avalonia.Controls',
        properties: [],
        contentProperty: 'Children',
        attachedProperties: [
            'RelativePanel.Above', 'RelativePanel.Below',
            'RelativePanel.LeftOf', 'RelativePanel.RightOf',
            'RelativePanel.AlignLeftWith', 'RelativePanel.AlignRightWith',
            'RelativePanel.AlignTopWith', 'RelativePanel.AlignBottomWith',
            'RelativePanel.AlignHorizontalCenterWith', 'RelativePanel.AlignVerticalCenterWith'
        ],
        template: null,
        styleClass: null
    },
    
    // ==========================================
    // DATA DISPLAY CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-datagrid',
        avaloniaControl: 'DataGrid',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'items', target: 'ItemsSource', converter: PropertyConverterType.Binding },
            { source: 'itemsSource', target: 'ItemsSource', converter: PropertyConverterType.Binding },
            { source: 'autoGenerateColumns', target: 'AutoGenerateColumns', converter: PropertyConverterType.Boolean },
            { source: 'canUserSortColumns', target: 'CanUserSortColumns', converter: PropertyConverterType.Boolean },
            { source: 'canUserResizeColumns', target: 'CanUserResizeColumns', converter: PropertyConverterType.Boolean },
            { source: 'canUserReorderColumns', target: 'CanUserReorderColumns', converter: PropertyConverterType.Boolean },
            { source: 'gridLinesVisibility', target: 'GridLinesVisibility', converter: PropertyConverterType.String },
            { source: 'isReadOnly', target: 'IsReadOnly', converter: PropertyConverterType.Boolean },
            { source: 'selectionMode', target: 'SelectionMode', converter: PropertyConverterType.String }
        ],
        contentProperty: 'Columns',
        template: null,
        styleClass: 'AsciiDataGrid'
    },
    
    {
        sourceId: 'ui-treeview',
        avaloniaControl: 'TreeView',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'items', target: 'ItemsSource', converter: PropertyConverterType.Binding },
            { source: 'itemsSource', target: 'ItemsSource', converter: PropertyConverterType.Binding },
            { source: 'selectionMode', target: 'SelectionMode', converter: PropertyConverterType.SelectionMode },
            { source: 'selectedItem', target: 'SelectedItem', converter: PropertyConverterType.Binding }
        ],
        contentProperty: 'Items',
        template: null,
        styleClass: 'AsciiTreeView'
    },
    
    {
        sourceId: 'ui-treeviewitem',
        avaloniaControl: 'TreeViewItem',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'header', target: 'Header', converter: PropertyConverterType.String },
            { source: 'isExpanded', target: 'IsExpanded', converter: PropertyConverterType.Boolean },
            { source: 'isSelected', target: 'IsSelected', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: 'Items',
        template: null,
        styleClass: 'AsciiTreeViewItem'
    },
    
    // ==========================================
    // TEXT DISPLAY CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-textblock',
        avaloniaControl: 'TextBlock',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'text', target: 'Text', converter: PropertyConverterType.String },
            { source: 'fontFamily', target: 'FontFamily', converter: PropertyConverterType.String },
            { source: 'fontSize', target: 'FontSize', converter: PropertyConverterType.Double },
            { source: 'fontWeight', target: 'FontWeight', converter: PropertyConverterType.FontWeight },
            { source: 'fontStyle', target: 'FontStyle', converter: PropertyConverterType.FontStyle },
            { source: 'foreground', target: 'Foreground', converter: PropertyConverterType.Brush },
            { source: 'textAlignment', target: 'TextAlignment', converter: PropertyConverterType.TextAlignment },
            { source: 'textWrapping', target: 'TextWrapping', converter: PropertyConverterType.TextWrapping },
            { source: 'textTrimming', target: 'TextTrimming', converter: PropertyConverterType.String },
            { source: 'lineHeight', target: 'LineHeight', converter: PropertyConverterType.Double },
            { source: 'maxLines', target: 'MaxLines', converter: PropertyConverterType.Integer }
        ],
        contentProperty: 'Text',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'ui-label',
        avaloniaControl: 'Label',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'content', target: 'Content', converter: PropertyConverterType.String },
            { source: 'target', target: 'Target', converter: PropertyConverterType.Binding }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'ui-selectable-textblock',
        avaloniaControl: 'SelectableTextBlock',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'text', target: 'Text', converter: PropertyConverterType.String },
            { source: 'fontFamily', target: 'FontFamily', converter: PropertyConverterType.String },
            { source: 'fontSize', target: 'FontSize', converter: PropertyConverterType.Double },
            { source: 'fontWeight', target: 'FontWeight', converter: PropertyConverterType.FontWeight },
            { source: 'selectionBrush', target: 'SelectionBrush', converter: PropertyConverterType.Brush }
        ],
        contentProperty: 'Text',
        template: null,
        styleClass: null
    },
    
    // ==========================================
    // INDICATOR CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-progressbar',
        avaloniaControl: 'ProgressBar',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'value', target: 'Value', converter: PropertyConverterType.Double },
            { source: 'minimum', target: 'Minimum', converter: PropertyConverterType.Double },
            { source: 'maximum', target: 'Maximum', converter: PropertyConverterType.Double },
            { source: 'isIndeterminate', target: 'IsIndeterminate', converter: PropertyConverterType.Boolean },
            { source: 'orientation', target: 'Orientation', converter: PropertyConverterType.Orientation },
            { source: 'showProgressText', target: 'ShowProgressText', converter: PropertyConverterType.Boolean },
            { source: 'progressTextFormat', target: 'ProgressTextFormat', converter: PropertyConverterType.String }
        ],
        contentProperty: null,
        template: null,
        styleClass: 'AsciiProgressBar'
    },
    
    {
        sourceId: 'ui-tooltip',
        avaloniaControl: 'ToolTip',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'content', target: 'Content', converter: PropertyConverterType.String },
            { source: 'placement', target: 'Placement', converter: PropertyConverterType.String },
            { source: 'showDelay', target: 'ShowDelay', converter: PropertyConverterType.Integer }
        ],
        contentProperty: 'Content',
        template: null,
        styleClass: null
    },
    
    // ==========================================
    // NAVIGATION CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-menu',
        avaloniaControl: 'Menu',
        namespace: 'Avalonia.Controls',
        properties: [],
        contentProperty: 'Items',
        template: null,
        styleClass: 'AsciiMenu'
    },
    
    {
        sourceId: 'ui-menuitem',
        avaloniaControl: 'MenuItem',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'header', target: 'Header', converter: PropertyConverterType.String },
            { source: 'icon', target: 'Icon', converter: PropertyConverterType.String },
            { source: 'command', target: 'Command', converter: PropertyConverterType.Binding },
            { source: 'commandParameter', target: 'CommandParameter', converter: PropertyConverterType.Binding },
            { source: 'inputGesture', target: 'InputGesture', converter: PropertyConverterType.String },
            { source: 'isEnabled', target: 'IsEnabled', converter: PropertyConverterType.Boolean }
        ],
        contentProperty: 'Items',
        template: null,
        styleClass: 'AsciiMenuItem'
    },
    
    {
        sourceId: 'ui-contextmenu',
        avaloniaControl: 'ContextMenu',
        namespace: 'Avalonia.Controls',
        properties: [],
        contentProperty: 'Items',
        template: null,
        styleClass: 'AsciiContextMenu'
    },
    
    // ==========================================
    // IMAGE/ICON CONTROLS
    // ==========================================
    
    {
        sourceId: 'ui-image',
        avaloniaControl: 'Image',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'source', target: 'Source', converter: PropertyConverterType.String },
            { source: 'stretch', target: 'Stretch', converter: PropertyConverterType.String },
            { source: 'stretchDirection', target: 'StretchDirection', converter: PropertyConverterType.String }
        ],
        contentProperty: null,
        template: null,
        styleClass: null
    },
    
    {
        sourceId: 'ui-pathicon',
        avaloniaControl: 'PathIcon',
        namespace: 'Avalonia.Controls',
        properties: [
            { source: 'data', target: 'Data', converter: PropertyConverterType.String },
            { source: 'foreground', target: 'Foreground', converter: PropertyConverterType.Brush }
        ],
        contentProperty: null,
        template: null,
        styleClass: null
    }
];

/**
 * Get mapping by source ID
 * @param {string} sourceId - Source component ID
 * @returns {object|null}
 */
export function getMappingBySourceId(sourceId) {
    return AVALONIA_COMPONENT_MAPPINGS.find(m => m.sourceId === sourceId) || null;
}

/**
 * Get mapping by Avalonia control name
 * @param {string} controlName - Avalonia control name
 * @returns {object|null}
 */
export function getMappingByControlName(controlName) {
    return AVALONIA_COMPONENT_MAPPINGS.find(m => m.avaloniaControl === controlName) || null;
}

/**
 * Get all mappings for a category
 * @param {string} category - Category prefix (e.g., 'ui-', 'layout-')
 * @returns {Array}
 */
export function getMappingsByCategory(category) {
    return AVALONIA_COMPONENT_MAPPINGS.filter(m => m.sourceId.startsWith(category));
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    PropertyConverterType,
    AVALONIA_COMPONENT_MAPPINGS,
    getMappingBySourceId,
    getMappingByControlName,
    getMappingsByCategory
};
