/**
 * Asciistrator - Framework Mappings
 * 
 * Maps generic UI component types and properties to specific UI frameworks.
 * Supports Avalonia, WPF, WinUI, MAUI, Qt, GTK, and more.
 * 
 * @version 1.0.0
 */

// ==========================================
// SUPPORTED FRAMEWORKS
// ==========================================

/**
 * Enumeration of supported UI frameworks
 */
export const UIFramework = {
    Avalonia: 'avalonia',
    WPF: 'wpf',
    WinUI: 'winui',
    MAUI: 'maui',
    UWP: 'uwp',
    Qt: 'qt',
    GTK: 'gtk',
    SwiftUI: 'swiftui',
    Flutter: 'flutter',
    React: 'react',
    Vue: 'vue',
    Angular: 'angular',
    HTML: 'html'
};

// ==========================================
// FRAMEWORK MAPPING CLASS
// ==========================================

/**
 * Defines mapping from generic component to framework-specific implementation
 */
export class FrameworkMapping {
    constructor(options = {}) {
        this.framework = options.framework || UIFramework.Avalonia;
        this.componentType = options.componentType || '';
        this.targetType = options.targetType || '';
        this.targetNamespace = options.targetNamespace || '';
        this.targetImport = options.targetImport || '';
        this.propertyMappings = options.propertyMappings || {};
        this.eventMappings = options.eventMappings || {};
        this.styleMapping = options.styleMapping || null;
        this.converters = options.converters || {};
        this.notes = options.notes || '';
    }
}

// ==========================================
// PROPERTY MAPPING
// ==========================================

/**
 * Maps a generic property to framework-specific property
 */
export class PropertyMapping {
    constructor(options = {}) {
        this.genericName = options.genericName || '';
        this.targetName = options.targetName || '';
        this.converter = options.converter || null;
        this.targetType = options.targetType || null;
        this.isAttached = options.isAttached || false;
        this.attachedOwner = options.attachedOwner || null;
    }
}

// ==========================================
// FRAMEWORK REGISTRY
// ==========================================

/**
 * Registry of framework mappings
 */
class FrameworkMappingRegistry {
    constructor() {
        this._mappings = new Map(); // framework -> componentType -> FrameworkMapping
        this._propertyMappings = new Map(); // framework -> genericProp -> targetProp
        this._globalConverters = new Map(); // framework -> type -> converter
        this._initialized = false;
    }
    
    /**
     * Register a component mapping for a framework
     */
    registerMapping(mapping) {
        if (!this._mappings.has(mapping.framework)) {
            this._mappings.set(mapping.framework, new Map());
        }
        this._mappings.get(mapping.framework).set(mapping.componentType, mapping);
    }
    
    /**
     * Register multiple mappings
     */
    registerMappings(mappings) {
        for (const mapping of mappings) {
            this.registerMapping(mapping);
        }
    }
    
    /**
     * Register a global property mapping for a framework
     */
    registerPropertyMapping(framework, genericName, targetName, converter = null) {
        if (!this._propertyMappings.has(framework)) {
            this._propertyMappings.set(framework, new Map());
        }
        this._propertyMappings.get(framework).set(genericName, { targetName, converter });
    }
    
    /**
     * Register a type converter for a framework
     */
    registerConverter(framework, typeName, converter) {
        if (!this._globalConverters.has(framework)) {
            this._globalConverters.set(framework, new Map());
        }
        this._globalConverters.get(framework).set(typeName, converter);
    }
    
    /**
     * Get mapping for a component type and framework
     */
    getMapping(framework, componentType) {
        const frameworkMappings = this._mappings.get(framework);
        if (!frameworkMappings) return null;
        return frameworkMappings.get(componentType) || null;
    }
    
    /**
     * Get property name for a framework
     */
    getPropertyName(framework, genericName, componentType = null) {
        // First check component-specific mapping
        if (componentType) {
            const mapping = this.getMapping(framework, componentType);
            if (mapping?.propertyMappings?.[genericName]) {
                const propMapping = mapping.propertyMappings[genericName];
                return typeof propMapping === 'string' ? propMapping : propMapping.targetName;
            }
        }
        
        // Fall back to global property mapping
        const globalMappings = this._propertyMappings.get(framework);
        if (globalMappings?.has(genericName)) {
            return globalMappings.get(genericName).targetName;
        }
        
        // Default: capitalize first letter (camelCase to PascalCase)
        return genericName.charAt(0).toUpperCase() + genericName.slice(1);
    }
    
    /**
     * Get converter for a property
     */
    getConverter(framework, genericName, typeName = null, componentType = null) {
        // Check component-specific converter
        if (componentType) {
            const mapping = this.getMapping(framework, componentType);
            if (mapping?.converters?.[genericName]) {
                return mapping.converters[genericName];
            }
        }
        
        // Check global property converter
        const globalMappings = this._propertyMappings.get(framework);
        if (globalMappings?.has(genericName)) {
            const propMapping = globalMappings.get(genericName);
            if (propMapping.converter) return propMapping.converter;
        }
        
        // Check type converter
        if (typeName) {
            const typeConverters = this._globalConverters.get(framework);
            if (typeConverters?.has(typeName)) {
                return typeConverters.get(typeName);
            }
        }
        
        return null;
    }
    
    /**
     * Get target type name for a component
     */
    getTargetType(framework, componentType) {
        const mapping = this.getMapping(framework, componentType);
        return mapping?.targetType || componentType;
    }
    
    /**
     * Get target namespace for a component
     */
    getTargetNamespace(framework, componentType) {
        const mapping = this.getMapping(framework, componentType);
        return mapping?.targetNamespace || '';
    }
    
    /**
     * Get all supported frameworks
     */
    getSupportedFrameworks() {
        return Array.from(this._mappings.keys());
    }
    
    /**
     * Get all mappings for a framework
     */
    getFrameworkMappings(framework) {
        return this._mappings.get(framework) || new Map();
    }
    
    /**
     * Check if framework is supported
     */
    isFrameworkSupported(framework) {
        return this._mappings.has(framework);
    }
    
    /**
     * Initialize with default mappings
     */
    initialize() {
        if (this._initialized) return;
        
        this._registerAvaloniaMapings();
        this._registerWPFMappings();
        this._registerWinUIMappings();
        this._registerMAUIMappings();
        this._registerHTMLMappings();
        this._registerReactMappings();
        
        this._initialized = true;
    }
    
    // ==========================================
    // AVALONIA MAPPINGS
    // ==========================================
    
    _registerAvaloniaMapings() {
        const framework = UIFramework.Avalonia;
        
        // Global property mappings (generic -> Avalonia)
        const globalProps = {
            // Common
            'name': 'Name',
            'isEnabled': 'IsEnabled',
            'isVisible': 'IsVisible',
            'opacity': 'Opacity',
            'tooltip': 'ToolTip.Tip',
            'cursor': 'Cursor',
            'focusable': 'Focusable',
            'isTabStop': 'IsTabStop',
            'tabIndex': 'TabIndex',
            
            // Layout
            'width': 'Width',
            'height': 'Height',
            'minWidth': 'MinWidth',
            'minHeight': 'MinHeight',
            'maxWidth': 'MaxWidth',
            'maxHeight': 'MaxHeight',
            'margin': 'Margin',
            'padding': 'Padding',
            'horizontalAlignment': 'HorizontalAlignment',
            'verticalAlignment': 'VerticalAlignment',
            
            // Content
            'content': 'Content',
            'text': 'Text',
            'header': 'Header',
            'title': 'Title',
            'placeholder': 'Watermark',
            
            // Appearance
            'background': 'Background',
            'foreground': 'Foreground',
            'borderBrush': 'BorderBrush',
            'borderThickness': 'BorderThickness',
            'cornerRadius': 'CornerRadius',
            'fontFamily': 'FontFamily',
            'fontSize': 'FontSize',
            'fontWeight': 'FontWeight',
            'fontStyle': 'FontStyle',
            
            // Behavior
            'isChecked': 'IsChecked',
            'isSelected': 'IsSelected',
            'isExpanded': 'IsExpanded',
            'isReadOnly': 'IsReadOnly',
            'command': 'Command',
            'commandParameter': 'CommandParameter',
            'clickMode': 'ClickMode',
            
            // Data
            'items': 'Items',
            'itemsSource': 'ItemsSource',
            'selectedItem': 'SelectedItem',
            'selectedIndex': 'SelectedIndex',
            'value': 'Value',
            'minimum': 'Minimum',
            'maximum': 'Maximum'
        };
        
        for (const [generic, target] of Object.entries(globalProps)) {
            this.registerPropertyMapping(framework, generic, target);
        }
        
        // Component mappings
        const componentMappings = [
            // Buttons
            { componentType: 'Button', targetType: 'Button', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'RepeatButton', targetType: 'RepeatButton', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'ToggleButton', targetType: 'ToggleButton', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'RadioButton', targetType: 'RadioButton', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'CheckBox', targetType: 'CheckBox', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'HyperlinkButton', targetType: 'HyperlinkButton', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'DropDownButton', targetType: 'DropDownButton', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'SplitButton', targetType: 'SplitButton', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'ToggleSplitButton', targetType: 'ToggleSplitButton', targetNamespace: 'Avalonia.Controls' },
            
            // Inputs
            { componentType: 'TextBox', targetType: 'TextBox', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'TextBlock', targetType: 'TextBlock', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Label', targetType: 'Label', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'PasswordBox', targetType: 'TextBox', targetNamespace: 'Avalonia.Controls', 
              propertyMappings: { 'passwordChar': 'PasswordChar' }, notes: 'Use PasswordChar property' },
            { componentType: 'MaskedTextBox', targetType: 'MaskedTextBox', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'NumericUpDown', targetType: 'NumericUpDown', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Slider', targetType: 'Slider', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'RangeSlider', targetType: 'RangeSlider', targetNamespace: 'Avalonia.Controls' },
            
            // Selections
            { componentType: 'ComboBox', targetType: 'ComboBox', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'ListBox', targetType: 'ListBox', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'ListView', targetType: 'ListBox', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'TreeView', targetType: 'TreeView', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'DataGrid', targetType: 'DataGrid', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'AutoCompleteBox', targetType: 'AutoCompleteBox', targetNamespace: 'Avalonia.Controls' },
            
            // Containers
            { componentType: 'Window', targetType: 'Window', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'UserControl', targetType: 'UserControl', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Panel', targetType: 'Panel', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Border', targetType: 'Border', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'ScrollViewer', targetType: 'ScrollViewer', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Expander', targetType: 'Expander', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'GroupBox', targetType: 'HeaderedContentControl', targetNamespace: 'Avalonia.Controls',
              notes: 'Avalonia uses HeaderedContentControl for GroupBox functionality' },
            { componentType: 'TabControl', targetType: 'TabControl', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'TabItem', targetType: 'TabItem', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Card', targetType: 'Border', targetNamespace: 'Avalonia.Controls',
              notes: 'Style as card with CornerRadius and BoxShadow' },
            { componentType: 'Viewbox', targetType: 'Viewbox', targetNamespace: 'Avalonia.Controls' },
            
            // Layouts
            { componentType: 'StackPanel', targetType: 'StackPanel', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'DockPanel', targetType: 'DockPanel', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Grid', targetType: 'Grid', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'WrapPanel', targetType: 'WrapPanel', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'UniformGrid', targetType: 'UniformGrid', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Canvas', targetType: 'Canvas', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'RelativePanel', targetType: 'RelativePanel', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'SplitView', targetType: 'SplitView', targetNamespace: 'Avalonia.Controls' },
            
            // Indicators
            { componentType: 'ProgressBar', targetType: 'ProgressBar', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'ProgressRing', targetType: 'ProgressBar', targetNamespace: 'Avalonia.Controls',
              propertyMappings: { 'isIndeterminate': 'IsIndeterminate' },
              notes: 'Use IsIndeterminate=true for ring behavior' },
            { componentType: 'Spinner', targetType: 'ProgressBar', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Badge', targetType: 'Border', targetNamespace: 'Avalonia.Controls' },
            
            // Navigation
            { componentType: 'Menu', targetType: 'Menu', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'MenuItem', targetType: 'MenuItem', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'ContextMenu', targetType: 'ContextMenu', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'ToolBar', targetType: 'StackPanel', targetNamespace: 'Avalonia.Controls',
              notes: 'Use styled StackPanel for toolbar' },
            { componentType: 'StatusBar', targetType: 'StackPanel', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'NavigationView', targetType: 'SplitView', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Breadcrumb', targetType: 'ItemsControl', targetNamespace: 'Avalonia.Controls' },
            
            // DateTime
            { componentType: 'Calendar', targetType: 'Calendar', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'DatePicker', targetType: 'DatePicker', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'TimePicker', targetType: 'TimePicker', targetNamespace: 'Avalonia.Controls' },
            
            // Data Display
            { componentType: 'Image', targetType: 'Image', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'MediaElement', targetType: 'Image', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'PathIcon', targetType: 'PathIcon', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'SymbolIcon', targetType: 'PathIcon', targetNamespace: 'Avalonia.Controls' },
            
            // Misc
            { componentType: 'Separator', targetType: 'Separator', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'ToggleSwitch', targetType: 'ToggleSwitch', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'ColorPicker', targetType: 'ColorPicker', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Flyout', targetType: 'Flyout', targetNamespace: 'Avalonia.Controls' },
            { componentType: 'Popup', targetType: 'Popup', targetNamespace: 'Avalonia.Controls.Primitives' },
            { componentType: 'ToolTip', targetType: 'ToolTip', targetNamespace: 'Avalonia.Controls' }
        ];
        
        for (const m of componentMappings) {
            this.registerMapping(new FrameworkMapping({
                framework,
                ...m
            }));
        }
        
        // Type converters
        this.registerConverter(framework, 'thickness', (value) => {
            if (typeof value === 'number') return `${value}`;
            if (typeof value === 'object') {
                const { left = 0, top = 0, right = 0, bottom = 0 } = value;
                return `${left},${top},${right},${bottom}`;
            }
            return String(value);
        });
        
        this.registerConverter(framework, 'corner-radius', (value) => {
            if (typeof value === 'number') return `${value}`;
            if (typeof value === 'object') {
                const { topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0 } = value;
                return `${topLeft},${topRight},${bottomRight},${bottomLeft}`;
            }
            return String(value);
        });
    }
    
    // ==========================================
    // WPF MAPPINGS
    // ==========================================
    
    _registerWPFMappings() {
        const framework = UIFramework.WPF;
        
        // Global property mappings - WPF uses same names as Avalonia mostly
        const globalProps = {
            'name': 'Name',
            'isEnabled': 'IsEnabled',
            'isVisible': 'Visibility', // Different! WPF uses Visibility enum
            'opacity': 'Opacity',
            'tooltip': 'ToolTip',
            'content': 'Content',
            'text': 'Text',
            'header': 'Header',
            'title': 'Title',
            'placeholder': 'Tag', // WPF doesn't have Watermark, use custom
            'background': 'Background',
            'foreground': 'Foreground',
            'isChecked': 'IsChecked',
            'command': 'Command'
        };
        
        for (const [generic, target] of Object.entries(globalProps)) {
            this.registerPropertyMapping(framework, generic, target);
        }
        
        // Component mappings
        const componentMappings = [
            { componentType: 'Button', targetType: 'Button', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'TextBox', targetType: 'TextBox', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'TextBlock', targetType: 'TextBlock', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'Label', targetType: 'Label', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'CheckBox', targetType: 'CheckBox', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'RadioButton', targetType: 'RadioButton', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'ComboBox', targetType: 'ComboBox', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'ListBox', targetType: 'ListBox', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'ListView', targetType: 'ListView', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'TreeView', targetType: 'TreeView', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'DataGrid', targetType: 'DataGrid', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'Window', targetType: 'Window', targetNamespace: 'System.Windows' },
            { componentType: 'UserControl', targetType: 'UserControl', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'StackPanel', targetType: 'StackPanel', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'Grid', targetType: 'Grid', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'DockPanel', targetType: 'DockPanel', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'WrapPanel', targetType: 'WrapPanel', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'Canvas', targetType: 'Canvas', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'Border', targetType: 'Border', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'ScrollViewer', targetType: 'ScrollViewer', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'Expander', targetType: 'Expander', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'GroupBox', targetType: 'GroupBox', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'TabControl', targetType: 'TabControl', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'Menu', targetType: 'Menu', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'MenuItem', targetType: 'MenuItem', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'ProgressBar', targetType: 'ProgressBar', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'Slider', targetType: 'Slider', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'Image', targetType: 'Image', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'PasswordBox', targetType: 'PasswordBox', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'Calendar', targetType: 'Calendar', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'DatePicker', targetType: 'DatePicker', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'ToolBar', targetType: 'ToolBar', targetNamespace: 'System.Windows.Controls' },
            { componentType: 'StatusBar', targetType: 'StatusBar', targetNamespace: 'System.Windows.Controls.Primitives' },
            { componentType: 'ToggleButton', targetType: 'ToggleButton', targetNamespace: 'System.Windows.Controls.Primitives' },
            { componentType: 'RepeatButton', targetType: 'RepeatButton', targetNamespace: 'System.Windows.Controls.Primitives' }
        ];
        
        for (const m of componentMappings) {
            this.registerMapping(new FrameworkMapping({
                framework,
                ...m
            }));
        }
        
        // WPF Visibility converter
        this.registerConverter(framework, 'visibility', (value) => {
            if (typeof value === 'boolean') {
                return value ? 'Visible' : 'Collapsed';
            }
            return String(value);
        });
    }
    
    // ==========================================
    // WINUI MAPPINGS
    // ==========================================
    
    _registerWinUIMappings() {
        const framework = UIFramework.WinUI;
        
        // Global property mappings
        const globalProps = {
            'name': 'x:Name',
            'isEnabled': 'IsEnabled',
            'isVisible': 'Visibility',
            'tooltip': 'ToolTipService.ToolTip',
            'content': 'Content',
            'text': 'Text',
            'header': 'Header',
            'title': 'Title',
            'placeholder': 'PlaceholderText',
            'background': 'Background',
            'foreground': 'Foreground'
        };
        
        for (const [generic, target] of Object.entries(globalProps)) {
            this.registerPropertyMapping(framework, generic, target);
        }
        
        // Component mappings
        const componentMappings = [
            { componentType: 'Button', targetType: 'Button', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'TextBox', targetType: 'TextBox', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'TextBlock', targetType: 'TextBlock', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'CheckBox', targetType: 'CheckBox', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'RadioButton', targetType: 'RadioButton', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'ComboBox', targetType: 'ComboBox', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'ListView', targetType: 'ListView', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'TreeView', targetType: 'TreeView', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'NavigationView', targetType: 'NavigationView', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'Window', targetType: 'Window', targetNamespace: 'Microsoft.UI.Xaml' },
            { componentType: 'StackPanel', targetType: 'StackPanel', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'Grid', targetType: 'Grid', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'Border', targetType: 'Border', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'ScrollViewer', targetType: 'ScrollViewer', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'Expander', targetType: 'Expander', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'TabView', targetType: 'TabView', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'TabControl', targetType: 'TabView', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'ProgressBar', targetType: 'ProgressBar', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'ProgressRing', targetType: 'ProgressRing', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'Slider', targetType: 'Slider', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'ToggleSwitch', targetType: 'ToggleSwitch', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'CalendarDatePicker', targetType: 'CalendarDatePicker', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'DatePicker', targetType: 'DatePicker', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'TimePicker', targetType: 'TimePicker', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'NumberBox', targetType: 'NumberBox', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'NumericUpDown', targetType: 'NumberBox', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'AutoSuggestBox', targetType: 'AutoSuggestBox', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'AutoCompleteBox', targetType: 'AutoSuggestBox', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'SplitButton', targetType: 'SplitButton', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'DropDownButton', targetType: 'DropDownButton', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'InfoBar', targetType: 'InfoBar', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'TeachingTip', targetType: 'TeachingTip', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'ContentDialog', targetType: 'ContentDialog', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'Flyout', targetType: 'Flyout', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'MenuFlyout', targetType: 'MenuFlyout', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'MenuBar', targetType: 'MenuBar', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'Menu', targetType: 'MenuBar', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'CommandBar', targetType: 'CommandBar', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'Image', targetType: 'Image', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'SymbolIcon', targetType: 'SymbolIcon', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'FontIcon', targetType: 'FontIcon', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'PathIcon', targetType: 'PathIcon', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'ColorPicker', targetType: 'ColorPicker', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'RatingControl', targetType: 'RatingControl', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'PersonPicture', targetType: 'PersonPicture', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'BreadcrumbBar', targetType: 'BreadcrumbBar', targetNamespace: 'Microsoft.UI.Xaml.Controls' },
            { componentType: 'Breadcrumb', targetType: 'BreadcrumbBar', targetNamespace: 'Microsoft.UI.Xaml.Controls' }
        ];
        
        for (const m of componentMappings) {
            this.registerMapping(new FrameworkMapping({
                framework,
                ...m
            }));
        }
    }
    
    // ==========================================
    // MAUI MAPPINGS
    // ==========================================
    
    _registerMAUIMappings() {
        const framework = UIFramework.MAUI;
        
        // Global property mappings
        const globalProps = {
            'name': 'x:Name',
            'isEnabled': 'IsEnabled',
            'isVisible': 'IsVisible',
            'opacity': 'Opacity',
            'content': 'Content',
            'text': 'Text',
            'placeholder': 'Placeholder',
            'background': 'BackgroundColor',
            'foreground': 'TextColor',
            'fontFamily': 'FontFamily',
            'fontSize': 'FontSize'
        };
        
        for (const [generic, target] of Object.entries(globalProps)) {
            this.registerPropertyMapping(framework, generic, target);
        }
        
        // Component mappings
        const componentMappings = [
            { componentType: 'Button', targetType: 'Button', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'Label', targetType: 'Label', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'TextBlock', targetType: 'Label', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'TextBox', targetType: 'Entry', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'PasswordBox', targetType: 'Entry', targetNamespace: 'Microsoft.Maui.Controls',
              propertyMappings: { 'isPassword': 'IsPassword' } },
            { componentType: 'TextArea', targetType: 'Editor', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'CheckBox', targetType: 'CheckBox', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'RadioButton', targetType: 'RadioButton', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'ToggleSwitch', targetType: 'Switch', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'Slider', targetType: 'Slider', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'ProgressBar', targetType: 'ProgressBar', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'ProgressRing', targetType: 'ActivityIndicator', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'Spinner', targetType: 'ActivityIndicator', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'ComboBox', targetType: 'Picker', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'DatePicker', targetType: 'DatePicker', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'TimePicker', targetType: 'TimePicker', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'ListView', targetType: 'ListView', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'ListBox', targetType: 'CollectionView', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'Image', targetType: 'Image', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'Border', targetType: 'Border', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'ScrollViewer', targetType: 'ScrollView', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'StackPanel', targetType: 'StackLayout', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'Grid', targetType: 'Grid', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'WrapPanel', targetType: 'FlexLayout', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'Canvas', targetType: 'AbsoluteLayout', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'UserControl', targetType: 'ContentView', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'Window', targetType: 'ContentPage', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'TabControl', targetType: 'TabbedPage', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'NavigationView', targetType: 'FlyoutPage', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'Menu', targetType: 'MenuBarItem', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'ToolBar', targetType: 'ToolbarItem', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'SearchBox', targetType: 'SearchBar', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'NumericUpDown', targetType: 'Stepper', targetNamespace: 'Microsoft.Maui.Controls' },
            { componentType: 'WebView', targetType: 'WebView', targetNamespace: 'Microsoft.Maui.Controls' }
        ];
        
        for (const m of componentMappings) {
            this.registerMapping(new FrameworkMapping({
                framework,
                ...m
            }));
        }
    }
    
    // ==========================================
    // HTML MAPPINGS
    // ==========================================
    
    _registerHTMLMappings() {
        const framework = UIFramework.HTML;
        
        // Global property mappings
        const globalProps = {
            'name': 'name',
            'id': 'id',
            'isEnabled': 'disabled', // Inverted!
            'isVisible': 'hidden',
            'content': 'textContent',
            'text': 'value',
            'placeholder': 'placeholder',
            'isChecked': 'checked',
            'isReadOnly': 'readonly',
            'title': 'title',
            'tooltip': 'title'
        };
        
        for (const [generic, target] of Object.entries(globalProps)) {
            this.registerPropertyMapping(framework, generic, target);
        }
        
        // Component mappings
        const componentMappings = [
            { componentType: 'Button', targetType: 'button', notes: '<button>' },
            { componentType: 'TextBox', targetType: 'input', notes: '<input type="text">' },
            { componentType: 'TextBlock', targetType: 'span', notes: '<span>' },
            { componentType: 'Label', targetType: 'label', notes: '<label>' },
            { componentType: 'PasswordBox', targetType: 'input', notes: '<input type="password">' },
            { componentType: 'TextArea', targetType: 'textarea', notes: '<textarea>' },
            { componentType: 'CheckBox', targetType: 'input', notes: '<input type="checkbox">' },
            { componentType: 'RadioButton', targetType: 'input', notes: '<input type="radio">' },
            { componentType: 'ComboBox', targetType: 'select', notes: '<select>' },
            { componentType: 'ListBox', targetType: 'select', notes: '<select multiple>' },
            { componentType: 'Slider', targetType: 'input', notes: '<input type="range">' },
            { componentType: 'NumericUpDown', targetType: 'input', notes: '<input type="number">' },
            { componentType: 'DatePicker', targetType: 'input', notes: '<input type="date">' },
            { componentType: 'TimePicker', targetType: 'input', notes: '<input type="time">' },
            { componentType: 'ColorPicker', targetType: 'input', notes: '<input type="color">' },
            { componentType: 'ProgressBar', targetType: 'progress', notes: '<progress>' },
            { componentType: 'Image', targetType: 'img', notes: '<img>' },
            { componentType: 'HyperlinkButton', targetType: 'a', notes: '<a href>' },
            { componentType: 'Border', targetType: 'div', notes: '<div> with border styles' },
            { componentType: 'Panel', targetType: 'div', notes: '<div>' },
            { componentType: 'StackPanel', targetType: 'div', notes: '<div> with flexbox column' },
            { componentType: 'WrapPanel', targetType: 'div', notes: '<div> with flexbox wrap' },
            { componentType: 'Grid', targetType: 'div', notes: '<div> with CSS grid' },
            { componentType: 'ScrollViewer', targetType: 'div', notes: '<div> with overflow: auto' },
            { componentType: 'TabControl', targetType: 'div', notes: 'Tab component' },
            { componentType: 'Expander', targetType: 'details', notes: '<details><summary>' },
            { componentType: 'Menu', targetType: 'nav', notes: '<nav><ul>' },
            { componentType: 'MenuItem', targetType: 'li', notes: '<li>' },
            { componentType: 'Table', targetType: 'table', notes: '<table>' },
            { componentType: 'DataGrid', targetType: 'table', notes: '<table>' },
            { componentType: 'TreeView', targetType: 'ul', notes: 'Nested <ul><li>' },
            { componentType: 'Window', targetType: 'div', notes: 'Dialog or modal <div>' },
            { componentType: 'Dialog', targetType: 'dialog', notes: '<dialog>' },
            { componentType: 'Separator', targetType: 'hr', notes: '<hr>' },
            { componentType: 'WebView', targetType: 'iframe', notes: '<iframe>' }
        ];
        
        for (const m of componentMappings) {
            this.registerMapping(new FrameworkMapping({
                framework,
                ...m
            }));
        }
        
        // HTML-specific converters
        this.registerConverter(framework, 'boolean-inverted', (value) => !value);
    }
    
    // ==========================================
    // REACT MAPPINGS
    // ==========================================
    
    _registerReactMappings() {
        const framework = UIFramework.React;
        
        // Global property mappings (React uses camelCase)
        const globalProps = {
            'name': 'name',
            'isEnabled': 'disabled',
            'isVisible': 'hidden',
            'content': 'children',
            'text': 'value',
            'placeholder': 'placeholder',
            'isChecked': 'checked',
            'isReadOnly': 'readOnly',
            'className': 'className',
            'onClick': 'onClick',
            'onChange': 'onChange'
        };
        
        for (const [generic, target] of Object.entries(globalProps)) {
            this.registerPropertyMapping(framework, generic, target);
        }
        
        // Component mappings for common React UI libraries
        const componentMappings = [
            { componentType: 'Button', targetType: 'Button', targetImport: '@mui/material' },
            { componentType: 'TextBox', targetType: 'TextField', targetImport: '@mui/material' },
            { componentType: 'TextBlock', targetType: 'Typography', targetImport: '@mui/material' },
            { componentType: 'Label', targetType: 'FormLabel', targetImport: '@mui/material' },
            { componentType: 'CheckBox', targetType: 'Checkbox', targetImport: '@mui/material' },
            { componentType: 'RadioButton', targetType: 'Radio', targetImport: '@mui/material' },
            { componentType: 'ToggleSwitch', targetType: 'Switch', targetImport: '@mui/material' },
            { componentType: 'Slider', targetType: 'Slider', targetImport: '@mui/material' },
            { componentType: 'ComboBox', targetType: 'Select', targetImport: '@mui/material' },
            { componentType: 'AutoCompleteBox', targetType: 'Autocomplete', targetImport: '@mui/material' },
            { componentType: 'ProgressBar', targetType: 'LinearProgress', targetImport: '@mui/material' },
            { componentType: 'ProgressRing', targetType: 'CircularProgress', targetImport: '@mui/material' },
            { componentType: 'TabControl', targetType: 'Tabs', targetImport: '@mui/material' },
            { componentType: 'TabItem', targetType: 'Tab', targetImport: '@mui/material' },
            { componentType: 'Menu', targetType: 'Menu', targetImport: '@mui/material' },
            { componentType: 'MenuItem', targetType: 'MenuItem', targetImport: '@mui/material' },
            { componentType: 'Dialog', targetType: 'Dialog', targetImport: '@mui/material' },
            { componentType: 'Window', targetType: 'Dialog', targetImport: '@mui/material' },
            { componentType: 'Card', targetType: 'Card', targetImport: '@mui/material' },
            { componentType: 'Border', targetType: 'Paper', targetImport: '@mui/material' },
            { componentType: 'Expander', targetType: 'Accordion', targetImport: '@mui/material' },
            { componentType: 'ListView', targetType: 'List', targetImport: '@mui/material' },
            { componentType: 'DataGrid', targetType: 'DataGrid', targetImport: '@mui/x-data-grid' },
            { componentType: 'DatePicker', targetType: 'DatePicker', targetImport: '@mui/x-date-pickers' },
            { componentType: 'TimePicker', targetType: 'TimePicker', targetImport: '@mui/x-date-pickers' },
            { componentType: 'TreeView', targetType: 'TreeView', targetImport: '@mui/lab' },
            { componentType: 'ToolBar', targetType: 'Toolbar', targetImport: '@mui/material' },
            { componentType: 'Tooltip', targetType: 'Tooltip', targetImport: '@mui/material' },
            { componentType: 'Badge', targetType: 'Badge', targetImport: '@mui/material' },
            { componentType: 'Image', targetType: 'img', notes: 'Native HTML img' },
            { componentType: 'StackPanel', targetType: 'Stack', targetImport: '@mui/material' },
            { componentType: 'Grid', targetType: 'Grid', targetImport: '@mui/material' }
        ];
        
        for (const m of componentMappings) {
            this.registerMapping(new FrameworkMapping({
                framework,
                ...m
            }));
        }
    }
}

// Create singleton instance
const frameworkMappingRegistry = new FrameworkMappingRegistry();

// Auto-initialize on import
frameworkMappingRegistry.initialize();

export { frameworkMappingRegistry, FrameworkMappingRegistry };
export default frameworkMappingRegistry;
