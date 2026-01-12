/**
 * Asciistrator - Avalonia Exporter Module Index
 * 
 * Exports all Avalonia XAML exporter components.
 * 
 * @version 1.0.0
 */

// Component Mappings
export {
    PropertyConverterType,
    AVALONIA_COMPONENT_MAPPINGS,
    getMappingBySourceId,
    getMappingByControlName,
    getMappingsByCategory
} from './ComponentMappings.js';

// Property Converters
export {
    PropertyConverter,
    propertyConverter
} from './PropertyConverters.js';

// XAML Generator
export {
    XamlGenerator,
    XAML_NAMESPACES,
    createXamlGenerator,
    generateXaml
} from './XamlGenerator.js';

// Style Generator
export {
    StyleGenerator,
    ASCII_COLORS,
    ASCII_FONTS,
    createStyleGenerator,
    generateAsciiTheme
} from './StyleGenerator.js';

// Code-Behind Generator
export {
    CodeBehindGenerator,
    createCodeBehindGenerator,
    generateCodeBehind,
    generateViewModel
} from './CodeBehindGenerator.js';

// Main Exporter
export {
    AvaloniaXamlExporter,
    AvaloniaWindowExporter,
    AvaloniaUserControlExporter,
    AvaloniaProjectExporter,
    createAvaloniaExporter,
    createSpecializedExporter
} from './AvaloniaXamlExporter.js';

// Default export
export { AvaloniaXamlExporter as default } from './AvaloniaXamlExporter.js';
