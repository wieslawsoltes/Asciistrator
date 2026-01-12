/**
 * Asciistrator - Components Module Index
 * 
 * Central export module for the entire components system.
 * This includes the property system, base UI component, all UI controls,
 * framework mappings, and the component library manager.
 * 
 * @version 1.0.0
 */

// ==========================================
// CORE EXPORTS
// ==========================================

// Property System
export {
    PropertyType,
    PropertyCategory,
    PropertyDefinition,
    PropertyStore,
    CommonProperties,
    EventDefinition,
    CommonEvents
} from './PropertySystem.js';

// Base UI Component
export {
    default as UIComponent,
    ContentModel,
    UICategory,
    BorderStyle,
    ASCIIRenderer
} from './UIComponent.js';

// Framework Mappings
export {
    UIFramework,
    FrameworkMapping,
    PropertyMapping,
    frameworkMappingRegistry,
    default as frameworkMappings
} from './FrameworkMappings.js';

// ==========================================
// UI CONTROLS
// ==========================================

// All controls through main index
export {
    // Registry and utilities
    ControlRegistry,
    ControlCategories,
    getControlByType,
    getControlsByCategory,
    getControlsByTags,
    searchControls,
    getAllControlMetadata,
    getControlCount,
    getCategorySummary,
    ControlFactory,
    
    // Namespace modules
    Buttons,
    Inputs,
    Selections,
    DateTime,
    Containers,
    Layouts,
    Navigation,
    Indicators,
    DataDisplay,
    
    // Individual Button Controls
    Button,
    RepeatButton,
    ToggleButton,
    SplitButton,
    DropDownButton,
    HyperlinkButton,
    RadioButton,
    
    // Individual Input Controls
    TextBox,
    PasswordBox,
    MaskedTextBox,
    AutoCompleteBox,
    NumericUpDown,
    TextArea,
    SearchBox,
    
    // Individual Selection Controls
    CheckBox,
    ToggleSwitch,
    Slider,
    RangeSlider,
    ScrollBar,
    Rating,
    ColorPicker,
    
    // Individual DateTime Controls
    DatePicker,
    TimePicker,
    Calendar,
    CalendarDatePicker,
    DateRangePicker,
    
    // Individual Container Controls
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
    
    // Individual Layout Controls
    Grid,
    StackPanel,
    DockPanel,
    WrapPanel,
    UniformGrid,
    Canvas,
    RelativePanel,
    SplitView,
    Separator,
    
    // Individual Navigation Controls
    Menu,
    MenuItem,
    ContextMenu,
    TreeView,
    TreeViewItem,
    Breadcrumb,
    NavigationView,
    TabStrip,
    
    // Individual Indicator Controls
    ProgressBar,
    ProgressRing,
    Badge,
    InfoBadge,
    Tooltip,
    InfoBar,
    LoadingIndicator,
    Skeleton,
    Notification,
    
    // Individual Data Display Controls
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
    Tag
} from './controls/index.js';

// ==========================================
// COMPONENT LIBRARY
// ==========================================

export {
    Component,
    ComponentLibrary,
    ComponentLibraryManager,
    componentLibraryManager
} from './ComponentLibrary.js';

// ==========================================
// SUMMARY INFO
// ==========================================

/**
 * Get a summary of the components module
 * @returns {Object} Module summary information
 */
export function getModuleSummary() {
    return {
        name: 'Asciistrator Components',
        version: '1.0.0',
        description: 'Framework-agnostic UI component library',
        controlCategories: [
            'Buttons (7 controls)',
            'Inputs (7 controls)',
            'Selections (7 controls)',
            'DateTime (5 controls)',
            'Containers (10 controls)',
            'Layouts (9 controls)',
            'Navigation (8 controls)',
            'Indicators (9 controls)',
            'DataDisplay (11 controls)'
        ],
        totalControls: 73,
        features: [
            'Property system with type validation',
            'ASCII preview rendering',
            'Export to multiple UI frameworks',
            'Event definitions and handlers',
            'Visual state management',
            'Component serialization',
            'Searchable tags and categories'
        ]
    };
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    // Summary
    getModuleSummary,
    
    // Property System
    PropertyType: null, // Will be populated on import
    PropertyCategory: null,
    PropertyDefinition: null,
    PropertyStore: null,
    CommonProperties: null,
    EventDefinition: null,
    CommonEvents: null,
    
    // Base Component
    UIComponent: null,
    ContentModel: null,
    UICategory: null,
    BorderStyle: null,
    ASCIIRenderer: null,
    
    // Controls
    ControlRegistry: null,
    ControlCategories: null,
    ControlFactory: null,
    
    // Library
    Component: null,
    ComponentLibrary: null,
    ComponentLibraryManager: null,
    componentLibraryManager: null
};
