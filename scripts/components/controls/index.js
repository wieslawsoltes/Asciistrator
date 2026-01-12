/**
 * Asciistrator - UI Controls Index
 * 
 * Central export module for all UI control components.
 * This module aggregates all control categories and provides
 * a unified API for component registration and discovery.
 * 
 * @version 2.0.0 - Phase 2 Complete Control Coverage
 */

// Import all control modules
import ButtonsModule, {
    Button,
    RepeatButton,
    ToggleButton,
    SplitButton,
    DropDownButton,
    HyperlinkButton,
    RadioButton,
    ButtonSpinner
} from './buttons.js';

import InputsModule, {
    TextBox,
    PasswordBox,
    MaskedTextBox,
    AutoCompleteBox,
    NumericUpDown,
    TextArea,
    SearchBox
} from './inputs.js';

import SelectionsModule, {
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
} from './selections.js';

import DateTimeModule, {
    DatePicker,
    TimePicker,
    Calendar,
    CalendarDatePicker,
    DateRangePicker
} from './datetime.js';

import ContainersModule, {
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
} from './containers.js';

import LayoutsModule, {
    Grid,
    StackPanel,
    DockPanel,
    WrapPanel,
    UniformGrid,
    Canvas,
    RelativePanel,
    SplitView,
    Separator,
    FlexPanel,
    VirtualizingStackPanel,
    ItemsRepeater,
    StackLayout,
    UniformGridLayout
} from './layouts.js';

import NavigationModule, {
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
} from './navigation.js';

import IndicatorsModule, {
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
} from './indicators.js';

import DataDisplayModule, {
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
    Tag,
    TreeDataGrid,
    ItemsControl,
    SelectableTextBlock,
    ContentControl
} from './data-display.js';

// ==========================================
// CONTROL REGISTRY
// ==========================================

/**
 * Central registry of all available UI controls
 * Phase 2: Complete UI Control Coverage - 88 controls total
 */
export const ControlRegistry = {
    // Buttons category (8 controls)
    Button,
    RepeatButton,
    ToggleButton,
    SplitButton,
    DropDownButton,
    HyperlinkButton,
    RadioButton,
    ButtonSpinner,
    
    // Inputs category (7 controls)
    TextBox,
    PasswordBox,
    MaskedTextBox,
    AutoCompleteBox,
    NumericUpDown,
    TextArea,
    SearchBox,
    
    // Selections category (11 controls)
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
    ColorSlider,
    
    // DateTime category (5 controls)
    DatePicker,
    TimePicker,
    Calendar,
    CalendarDatePicker,
    DateRangePicker,
    
    // Containers category (15 controls)
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
    Thumb,
    
    // Layouts category (14 controls)
    Grid,
    StackPanel,
    DockPanel,
    WrapPanel,
    UniformGrid,
    Canvas,
    RelativePanel,
    SplitView,
    Separator,
    FlexPanel,
    VirtualizingStackPanel,
    ItemsRepeater,
    StackLayout,
    UniformGridLayout,
    
    // Navigation category (12 controls)
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
    Stepper,
    
    // Indicators category (12 controls)
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
    HeatMapCell,
    
    // DataDisplay category (15 controls)
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
    Tag,
    TreeDataGrid,
    ItemsControl,
    SelectableTextBlock,
    ContentControl
};

// ==========================================
// CATEGORY GROUPINGS
// ==========================================

/**
 * Controls grouped by category
 * Phase 2: Complete UI Control Coverage
 */
export const ControlCategories = {
    Buttons: {
        name: 'Buttons',
        description: 'Button controls for user actions',
        icon: '▣',
        controls: [
            Button,
            RepeatButton,
            ToggleButton,
            SplitButton,
            DropDownButton,
            HyperlinkButton,
            RadioButton,
            ButtonSpinner
        ]
    },
    
    Inputs: {
        name: 'Inputs',
        description: 'Text input and editing controls',
        icon: '✎',
        controls: [
            TextBox,
            PasswordBox,
            MaskedTextBox,
            AutoCompleteBox,
            NumericUpDown,
            TextArea,
            SearchBox
        ]
    },
    
    Selections: {
        name: 'Selections',
        description: 'Selection and value controls',
        icon: '☑',
        controls: [
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
        ]
    },
    
    DateTime: {
        name: 'Date & Time',
        description: 'Date and time picker controls',
        icon: '📅',
        controls: [
            DatePicker,
            TimePicker,
            Calendar,
            CalendarDatePicker,
            DateRangePicker
        ]
    },
    
    Containers: {
        name: 'Containers',
        description: 'Container and window controls',
        icon: '◫',
        controls: [
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
        ]
    },
    
    Layouts: {
        name: 'Layouts',
        description: 'Layout panel controls',
        icon: '▦',
        controls: [
            Grid,
            StackPanel,
            DockPanel,
            WrapPanel,
            UniformGrid,
            Canvas,
            RelativePanel,
            SplitView,
            Separator,
            FlexPanel,
            VirtualizingStackPanel,
            ItemsRepeater,
            StackLayout,
            UniformGridLayout
        ]
    },
    
    Navigation: {
        name: 'Navigation',
        description: 'Navigation and menu controls',
        icon: '☰',
        controls: [
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
        ]
    },
    
    Indicators: {
        name: 'Indicators',
        description: 'Status and progress indicators',
        icon: '▓',
        controls: [
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
        ]
    },
    
    DataDisplay: {
        name: 'Data Display',
        description: 'Data display and presentation controls',
        icon: '▤',
        controls: [
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
            Tag,
            TreeDataGrid,
            ItemsControl,
            SelectableTextBlock,
            ContentControl
        ]
    }
};

// ==========================================
// CONTROL LOOKUP UTILITIES
// ==========================================

/**
 * Get a control class by component type name
 * @param {string} componentType - The component type identifier
 * @returns {Function|null} The control class or null if not found
 */
export function getControlByType(componentType) {
    return ControlRegistry[componentType] || null;
}



/**
 * Get all controls in a specific category
 * @param {string} categoryName - The category name
 * @returns {Array} Array of control classes
 */
export function getControlsByCategory(categoryName) {
    const category = ControlCategories[categoryName];
    return category ? category.controls : [];
}

/**
 * Get all controls matching specific tags
 * @param {Array<string>} tags - Tags to search for
 * @param {boolean} matchAll - Whether to match all tags or any tag
 * @returns {Array} Array of control classes
 */
export function getControlsByTags(tags, matchAll = false) {
    const results = [];
    
    for (const controlName in ControlRegistry) {
        const control = ControlRegistry[controlName];
        const controlTags = control.tags || [];
        
        if (matchAll) {
            if (tags.every(tag => controlTags.includes(tag))) {
                results.push(control);
            }
        } else {
            if (tags.some(tag => controlTags.includes(tag))) {
                results.push(control);
            }
        }
    }
    
    return results;
}

/**
 * Search controls by name or description
 * @param {string} query - Search query
 * @returns {Array} Array of matching control classes
 */
export function searchControls(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    for (const controlName in ControlRegistry) {
        const control = ControlRegistry[controlName];
        const displayName = control.displayName?.toLowerCase() || '';
        const description = control.description?.toLowerCase() || '';
        const tags = (control.tags || []).join(' ').toLowerCase();
        
        if (displayName.includes(lowerQuery) || 
            description.includes(lowerQuery) ||
            tags.includes(lowerQuery) ||
            controlName.toLowerCase().includes(lowerQuery)) {
            results.push(control);
        }
    }
    
    return results;
}

/**
 * Get control metadata for all registered controls
 * @returns {Array} Array of control metadata objects
 */
export function getAllControlMetadata() {
    const metadata = [];
    
    for (const controlName in ControlRegistry) {
        const control = ControlRegistry[controlName];
        metadata.push({
            componentType: control.componentType,
            displayName: control.displayName,
            description: control.description,
            category: control.category,
            icon: control.icon,
            contentModel: control.contentModel,
            defaultWidth: control.defaultWidth,
            defaultHeight: control.defaultHeight,
            tags: control.tags || [],
            propertyCount: control.propertyDefinitions?.length || 0,
            eventCount: control.eventDefinitions?.length || 0
        });
    }
    
    return metadata;
}

/**
 * Get the total count of registered controls
 * @returns {number} Number of registered controls
 */
export function getControlCount() {
    return Object.keys(ControlRegistry).length;
}

/**
 * Get category summary information
 * @returns {Array} Array of category summary objects
 */
export function getCategorySummary() {
    const summaries = [];
    
    for (const categoryName in ControlCategories) {
        const category = ControlCategories[categoryName];
        summaries.push({
            name: category.name,
            description: category.description,
            icon: category.icon,
            controlCount: category.controls.length,
            controls: category.controls.map(c => c.componentType)
        });
    }
    
    return summaries;
}

// ==========================================
// CONTROL FACTORY
// ==========================================

/**
 * Factory for creating control instances
 */
export class ControlFactory {
    /**
     * Create a control instance by type
     * @param {string} componentType - The component type
     * @param {Object} properties - Initial properties
     * @returns {Object|null} The control instance or null
     */
    static create(componentType, properties = {}) {
        const ControlClass = getControlByType(componentType);
        if (!ControlClass) {
            console.warn(`Unknown control type: ${componentType}`);
            return null;
        }
        
        const instance = new ControlClass();
        
        // Apply initial properties
        for (const [key, value] of Object.entries(properties)) {
            instance.set(key, value);
        }
        
        return instance;
    }
    
    /**
     * Create a control from a serialized definition
     * @param {Object} definition - Serialized control definition
     * @returns {Object|null} The control instance or null
     */
    static fromDefinition(definition) {
        const { type, properties = {}, children = [] } = definition;
        
        const instance = ControlFactory.create(type, properties);
        if (!instance) return null;
        
        // Recursively create children
        for (const childDef of children) {
            const child = ControlFactory.fromDefinition(childDef);
            if (child) {
                instance.addChild(child);
            }
        }
        
        return instance;
    }
    
    /**
     * Clone a control instance
     * @param {Object} control - The control to clone
     * @returns {Object} The cloned control
     */
    static clone(control) {
        const definition = control.serialize();
        return ControlFactory.fromDefinition(definition);
    }
}



// ==========================================
// NAMESPACE EXPORTS
// ==========================================

/**
 * Namespace groupings for organized imports
 */
export const Buttons = ButtonsModule;
export const Inputs = InputsModule;
export const Selections = SelectionsModule;
export const DateTime = DateTimeModule;
export const Containers = ContainersModule;
export const Layouts = LayoutsModule;
export const Navigation = NavigationModule;
export const Indicators = IndicatorsModule;
export const DataDisplay = DataDisplayModule;

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    // Registry and categories
    ControlRegistry,
    ControlCategories,
    
    // Lookup utilities
    getControlByType,
    getControlsByCategory,
    getControlsByTags,
    searchControls,
    getAllControlMetadata,
    getControlCount,
    getCategorySummary,
    
    // Factory
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
    
    // All individual controls
    ...ControlRegistry
};
