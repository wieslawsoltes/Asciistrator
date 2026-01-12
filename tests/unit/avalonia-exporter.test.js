/**
 * Asciistrator - Avalonia XAML Exporter Tests
 * 
 * Tests for the Avalonia XAML export system including
 * component mappings, property conversion, XAML generation,
 * style generation, and code-behind generation.
 * 
 * @version 1.0.0
 */

import {
    // Component Mappings
    PropertyConverterType,
    AVALONIA_COMPONENT_MAPPINGS,
    getMappingBySourceId,
    getMappingByControlName,
    getMappingsByCategory,
    
    // Property Converters
    PropertyConverter,
    propertyConverter,
    
    // XAML Generator
    XamlGenerator,
    XAML_NAMESPACES,
    createXamlGenerator,
    generateXaml,
    
    // Style Generator
    StyleGenerator,
    ASCII_COLORS,
    ASCII_FONTS,
    createStyleGenerator,
    generateAsciiTheme,
    
    // Code-Behind Generator
    CodeBehindGenerator,
    createCodeBehindGenerator,
    generateCodeBehind,
    generateViewModel,
    
    // Main Exporter
    AvaloniaXamlExporter,
    AvaloniaWindowExporter,
    AvaloniaUserControlExporter,
    AvaloniaProjectExporter,
    createAvaloniaExporter,
    createSpecializedExporter
} from '../scripts/io/exporters/avalonia/index.js';

// ==========================================
// TEST FRAMEWORK
// ==========================================

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    tests.push({ name, fn });
}

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
    }
}

function assertTrue(condition, message = '') {
    if (!condition) {
        throw new Error(`Expected true: ${message}`);
    }
}

function assertFalse(condition, message = '') {
    if (condition) {
        throw new Error(`Expected false: ${message}`);
    }
}

function assertContains(str, substring, message = '') {
    if (!str.includes(substring)) {
        throw new Error(`${message}\nExpected to contain: ${substring}\nActual: ${str}`);
    }
}

function assertNotNull(value, message = '') {
    if (value === null || value === undefined) {
        throw new Error(`Expected non-null value: ${message}`);
    }
}

async function runTests() {
    console.log('\n==========================================');
    console.log('AVALONIA XAML EXPORTER TESTS');
    console.log('==========================================\n');
    
    for (const { name, fn } of tests) {
        try {
            await fn();
            console.log(`✓ ${name}`);
            passed++;
        } catch (error) {
            console.log(`✗ ${name}`);
            console.log(`  Error: ${error.message}`);
            failed++;
        }
    }
    
    console.log('\n==========================================');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('==========================================\n');
    
    return { passed, failed };
}

// ==========================================
// COMPONENT MAPPING TESTS
// ==========================================

test('ComponentMappings: should have PropertyConverterType enum', () => {
    assertNotNull(PropertyConverterType, 'PropertyConverterType should exist');
    assertEqual(PropertyConverterType.String, 'String');
    assertEqual(PropertyConverterType.Boolean, 'Boolean');
    assertEqual(PropertyConverterType.Binding, 'Binding');
});

test('ComponentMappings: should have button mapping', () => {
    const mapping = getMappingBySourceId('ui-button');
    assertNotNull(mapping, 'Button mapping should exist');
    assertEqual(mapping.avaloniaControl, 'Button');
    assertEqual(mapping.namespace, 'Avalonia.Controls');
});

test('ComponentMappings: should have textbox mapping', () => {
    const mapping = getMappingBySourceId('ui-textbox');
    assertNotNull(mapping, 'TextBox mapping should exist');
    assertEqual(mapping.avaloniaControl, 'TextBox');
    assertTrue(mapping.properties.length > 0, 'Should have properties');
});

test('ComponentMappings: getMappingByControlName should work', () => {
    const mapping = getMappingByControlName('ComboBox');
    assertNotNull(mapping, 'ComboBox mapping should exist');
    assertEqual(mapping.sourceId, 'ui-combobox');
});

test('ComponentMappings: getMappingsByCategory should return controls', () => {
    const buttons = getMappingsByCategory('buttons');
    assertTrue(buttons.length > 0, 'Should have button controls');
    
    const containers = getMappingsByCategory('containers');
    assertTrue(containers.length > 0, 'Should have container controls');
});

test('ComponentMappings: should have all major control types', () => {
    const expectedTypes = [
        'ui-button', 'ui-textbox', 'ui-checkbox', 'ui-combobox',
        'ui-listbox', 'ui-slider', 'ui-progressbar', 'ui-tabcontrol',
        'layout-grid', 'layout-stackpanel', 'layout-dockpanel'
    ];
    
    for (const type of expectedTypes) {
        const mapping = getMappingBySourceId(type);
        assertNotNull(mapping, `Mapping for ${type} should exist`);
    }
});

// ==========================================
// PROPERTY CONVERTER TESTS
// ==========================================

test('PropertyConverter: should convert strings', () => {
    const result = propertyConverter.convert('Hello', PropertyConverterType.String);
    assertEqual(result, 'Hello');
});

test('PropertyConverter: should convert booleans', () => {
    assertEqual(propertyConverter.convert(true, PropertyConverterType.Boolean), 'True');
    assertEqual(propertyConverter.convert(false, PropertyConverterType.Boolean), 'False');
    assertEqual(propertyConverter.convert('true', PropertyConverterType.Boolean), 'True');
});

test('PropertyConverter: should convert integers', () => {
    assertEqual(propertyConverter.convert('42', PropertyConverterType.Integer), '42');
    assertEqual(propertyConverter.convert(42.7, PropertyConverterType.Integer), '42');
});

test('PropertyConverter: should convert doubles', () => {
    assertEqual(propertyConverter.convert('3.14', PropertyConverterType.Double), '3.14');
    assertEqual(propertyConverter.convert(3.14, PropertyConverterType.Double), '3.14');
});

test('PropertyConverter: should convert orientation', () => {
    assertEqual(propertyConverter.convert('horizontal', PropertyConverterType.Orientation), 'Horizontal');
    assertEqual(propertyConverter.convert('vertical', PropertyConverterType.Orientation), 'Vertical');
});

test('PropertyConverter: should convert dock', () => {
    assertEqual(propertyConverter.convert('left', PropertyConverterType.Dock), 'Left');
    assertEqual(propertyConverter.convert('top', PropertyConverterType.Dock), 'Top');
});

test('PropertyConverter: should convert thickness', () => {
    assertEqual(propertyConverter.convert(10, PropertyConverterType.Thickness), '10');
    assertEqual(propertyConverter.convert({ left: 5, top: 10, right: 5, bottom: 10 }, PropertyConverterType.Thickness), '5,10');
    assertEqual(propertyConverter.convert({ left: 1, top: 2, right: 3, bottom: 4 }, PropertyConverterType.Thickness), '1,2,3,4');
});

test('PropertyConverter: should convert brush colors', () => {
    assertEqual(propertyConverter.convert('#FF0000', PropertyConverterType.Brush), '#FF0000');
    assertEqual(propertyConverter.convert('Red', PropertyConverterType.Brush), 'Red');
});

test('PropertyConverter: should preserve binding expressions', () => {
    const binding = '{Binding UserName}';
    assertEqual(propertyConverter.convert(binding, PropertyConverterType.String), binding);
});

test('PropertyConverter: should handle null values', () => {
    assertEqual(propertyConverter.convert(null, PropertyConverterType.String), null);
    assertEqual(propertyConverter.convert(undefined, PropertyConverterType.Boolean), null);
});

// ==========================================
// XAML GENERATOR TESTS
// ==========================================

test('XamlGenerator: should create instance', () => {
    const generator = createXamlGenerator();
    assertNotNull(generator, 'Generator should be created');
});

test('XamlGenerator: should generate basic component', () => {
    const generator = createXamlGenerator();
    const component = {
        type: 'ui-button',
        name: 'TestButton',
        text: 'Click Me'
    };
    
    const xaml = generator.generateComponent(component);
    assertContains(xaml, '<Button');
    assertContains(xaml, 'x:Name="TestButton"');
});

test('XamlGenerator: should generate document with namespaces', () => {
    const generator = createXamlGenerator({
        includeDesignTimeData: true
    });
    
    const scene = {
        title: 'Test View',
        className: 'TestView',
        width: 800,
        height: 600,
        components: []
    };
    
    const xaml = generator.generateDocument(scene, 'UserControl');
    assertContains(xaml, '<?xml version="1.0"');
    assertContains(xaml, 'xmlns="https://github.com/avaloniaui"');
    assertContains(xaml, 'xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"');
});

test('XamlGenerator: should handle nested components', () => {
    const generator = createXamlGenerator();
    const scene = {
        className: 'TestView',
        components: [
            {
                type: 'layout-stackpanel',
                orientation: 'vertical',
                children: [
                    { type: 'ui-button', text: 'Button 1' },
                    { type: 'ui-button', text: 'Button 2' }
                ]
            }
        ]
    };
    
    const xaml = generator.generateDocument(scene, 'UserControl');
    assertContains(xaml, '<StackPanel');
    assertContains(xaml, 'Orientation="Vertical"');
    assertContains(xaml, '<Button');
});

test('XamlGenerator: should add Grid attached properties', () => {
    const generator = createXamlGenerator();
    const component = {
        type: 'ui-button',
        text: 'Grid Button',
        gridRow: 1,
        gridColumn: 2,
        gridRowSpan: 2
    };
    
    const xaml = generator.generateComponent(component);
    assertContains(xaml, 'Grid.Row="1"');
    assertContains(xaml, 'Grid.Column="2"');
    assertContains(xaml, 'Grid.RowSpan="2"');
});

test('generateXaml: factory function should work', () => {
    const scene = {
        className: 'QuickView',
        components: [{ type: 'ui-textbox', placeholder: 'Enter text' }]
    };
    
    const xaml = generateXaml(scene, { rootElement: 'UserControl' });
    assertContains(xaml, '<UserControl');
    assertContains(xaml, '<TextBox');
});

// ==========================================
// STYLE GENERATOR TESTS
// ==========================================

test('StyleGenerator: should have ASCII_COLORS', () => {
    assertNotNull(ASCII_COLORS.background, 'Background color should exist');
    assertNotNull(ASCII_COLORS.foreground, 'Foreground color should exist');
    assertNotNull(ASCII_COLORS.primary, 'Primary color should exist');
});

test('StyleGenerator: should have ASCII_FONTS', () => {
    assertNotNull(ASCII_FONTS.family, 'Font family should exist');
    assertContains(ASCII_FONTS.family, 'Consolas');
});

test('StyleGenerator: should generate theme', () => {
    const generator = createStyleGenerator();
    const theme = generator.generateTheme();
    
    assertContains(theme, '<ResourceDictionary');
    assertContains(theme, '<Color');
    assertContains(theme, '<SolidColorBrush');
    assertContains(theme, '<Style');
});

test('StyleGenerator: should generate button styles', () => {
    const generator = createStyleGenerator();
    const buttonStyle = generator.generateControlStyle('Button');
    
    assertContains(buttonStyle, 'Button.AsciiButton');
    assertContains(buttonStyle, 'Background');
    assertContains(buttonStyle, 'Foreground');
});

test('StyleGenerator: should generate ASCII-specific styles', () => {
    const generator = createStyleGenerator();
    const asciiStyles = generator.generateAsciiStyles();
    
    assertContains(asciiStyles, 'AsciiArtContainer');
    assertContains(asciiStyles, 'AsciiArt');
    assertContains(asciiStyles, 'AsciiCanvas');
});

test('StyleGenerator: should generate inline styles', () => {
    const generator = createStyleGenerator();
    const styles = generator.generateInlineStyles({
        background: '#FF0000',
        foreground: 'White',
        padding: 10,
        fontSize: 14
    });
    
    assertEqual(styles.Background, '#FF0000');
    assertEqual(styles.Foreground, 'White');
    assertEqual(styles.Padding, '10');
    assertEqual(styles.FontSize, '14');
});

test('generateAsciiTheme: factory function should work', () => {
    const theme = generateAsciiTheme();
    assertContains(theme, '<ResourceDictionary');
});

// ==========================================
// CODE-BEHIND GENERATOR TESTS
// ==========================================

test('CodeBehindGenerator: should generate code-behind', () => {
    const generator = createCodeBehindGenerator({
        namespace: 'TestApp'
    });
    
    const scene = { components: [] };
    const code = generator.generateCodeBehind(scene, 'TestView', 'UserControl');
    
    assertContains(code, 'namespace TestApp');
    assertContains(code, 'public partial class TestView');
    assertContains(code, 'InitializeComponent()');
});

test('CodeBehindGenerator: should generate ViewModel', () => {
    const generator = createCodeBehindGenerator({
        namespace: 'TestApp'
    });
    
    const scene = { components: [] };
    const code = generator.generateViewModel(scene, 'TestView');
    
    assertContains(code, 'namespace TestApp.ViewModels');
    assertContains(code, 'TestViewViewModel');
    assertContains(code, 'INotifyPropertyChanged');
});

test('CodeBehindGenerator: should generate property', () => {
    const generator = createCodeBehindGenerator();
    const property = generator.generateProperty('UserName', 'string', 'Guest');
    
    assertContains(property, '_userName');
    assertContains(property, 'public string UserName');
    assertContains(property, 'OnPropertyChanged');
});

test('CodeBehindGenerator: should generate command', () => {
    const generator = createCodeBehindGenerator();
    const command = generator.generateCommand('Save');
    
    assertContains(command, 'SaveCommand');
    assertContains(command, 'ICommand');
});

test('CodeBehindGenerator: should generate with ReactiveUI', () => {
    const generator = createCodeBehindGenerator({
        namespace: 'TestApp',
        useReactiveUI: true
    });
    
    const scene = { components: [] };
    const code = generator.generateViewModel(scene, 'TestView');
    
    assertContains(code, 'ReactiveObject');
});

test('CodeBehindGenerator: should generate converter', () => {
    const generator = createCodeBehindGenerator();
    const converter = generator.generateConverter('BoolToVisibility', 'bool', 'bool');
    
    assertContains(converter, 'IValueConverter');
    assertContains(converter, 'Convert');
    assertContains(converter, 'ConvertBack');
});

test('CodeBehindGenerator: should generate project structure', () => {
    const generator = createCodeBehindGenerator({
        namespace: 'TestApp'
    });
    
    const files = generator.generateProjectStructure('TestApp');
    
    assertNotNull(files['TestApp.csproj'], 'Should have csproj');
    assertNotNull(files['App.axaml'], 'Should have App.axaml');
    assertNotNull(files['App.axaml.cs'], 'Should have App.axaml.cs');
    assertNotNull(files['ViewModels/ViewModelBase.cs'], 'Should have ViewModelBase');
});

test('generateCodeBehind: factory function should work', () => {
    const code = generateCodeBehind({ components: [] }, 'QuickView', { namespace: 'QuickApp' });
    assertContains(code, 'QuickView');
});

test('generateViewModel: factory function should work', () => {
    const code = generateViewModel({ components: [] }, 'QuickView', { namespace: 'QuickApp' });
    assertContains(code, 'QuickViewViewModel');
});

// ==========================================
// MAIN EXPORTER TESTS
// ==========================================

test('AvaloniaXamlExporter: should create instance', () => {
    const exporter = new AvaloniaXamlExporter();
    assertNotNull(exporter, 'Exporter should be created');
    assertEqual(exporter.id, 'avalonia-xaml');
    assertEqual(exporter.name, 'Avalonia XAML');
});

test('AvaloniaXamlExporter: should have options schema', () => {
    const exporter = new AvaloniaXamlExporter();
    const schema = exporter.getOptionsSchema();
    
    assertNotNull(schema.rootElement, 'Should have rootElement option');
    assertNotNull(schema.namespace, 'Should have namespace option');
    assertNotNull(schema.className, 'Should have className option');
});

test('AvaloniaXamlExporter: should export scene', () => {
    const exporter = createAvaloniaExporter({
        namespace: 'TestApp',
        className: 'ExportedView'
    });
    
    const scene = {
        title: 'Test',
        objects: [
            { type: 'ui-button', text: 'Test Button' }
        ]
    };
    
    const result = exporter.export(scene);
    assertTrue(result.success, 'Export should succeed');
    assertNotNull(result.content, 'Should have content');
    assertContains(result.content, '<UserControl');
    assertContains(result.content, '<Button');
});

test('AvaloniaXamlExporter: should export with code-behind', () => {
    const exporter = createAvaloniaExporter({
        includeCodeBehind: true
    });
    
    const scene = { objects: [] };
    const result = exporter.export(scene);
    
    assertTrue(result.success, 'Export should succeed');
    assertNotNull(result.files['ExportedView.axaml'], 'Should have XAML file');
    assertNotNull(result.files['ExportedView.axaml.cs'], 'Should have code-behind');
});

test('AvaloniaXamlExporter: should export with ViewModel', () => {
    const exporter = createAvaloniaExporter({
        includeViewModel: true,
        className: 'LoginView'
    });
    
    const scene = { objects: [] };
    const result = exporter.export(scene);
    
    assertNotNull(result.files['LoginViewViewModel.cs'], 'Should have ViewModel');
});

test('AvaloniaXamlExporter: should generate theme when requested', () => {
    const exporter = createAvaloniaExporter({
        generateTheme: true
    });
    
    const scene = { objects: [] };
    const result = exporter.export(scene);
    
    assertNotNull(result.files['AsciiTheme.axaml'], 'Should have theme file');
});

test('AvaloniaXamlExporter: exportToString should work', () => {
    const exporter = createAvaloniaExporter();
    const scene = { objects: [] };
    
    const xaml = exporter.exportToString(scene);
    assertTrue(typeof xaml === 'string', 'Should return string');
    assertContains(xaml, '<UserControl');
});

test('AvaloniaXamlExporter: exportToBlob should work', () => {
    const exporter = createAvaloniaExporter();
    const scene = { objects: [] };
    
    const blob = exporter.exportToBlob(scene);
    assertTrue(blob instanceof Blob, 'Should return Blob');
});

test('AvaloniaXamlExporter: preview should return info', () => {
    const exporter = createAvaloniaExporter();
    const scene = {
        objects: [
            { type: 'ui-button', text: 'Button 1' },
            { type: 'ui-textbox', placeholder: 'Text' },
            { type: 'unknown-type' }
        ]
    };
    
    const preview = exporter.preview(scene);
    assertEqual(preview.componentCount, 3);
    assertEqual(preview.supportedCount, 2);
    assertTrue(preview.unsupportedTypes.includes('unknown-type'));
});

test('AvaloniaXamlExporter: should list supported components', () => {
    const exporter = createAvaloniaExporter();
    const components = exporter.getSupportedComponents();
    
    assertTrue(components.length > 0, 'Should have supported components');
    assertTrue(components.includes('ui-button'));
    assertTrue(components.includes('ui-textbox'));
});

test('AvaloniaXamlExporter: isComponentSupported should work', () => {
    const exporter = createAvaloniaExporter();
    
    assertTrue(exporter.isComponentSupported('ui-button'));
    assertTrue(exporter.isComponentSupported('ui-combobox'));
    assertFalse(exporter.isComponentSupported('unknown-component'));
});

// ==========================================
// SPECIALIZED EXPORTERS TESTS
// ==========================================

test('AvaloniaWindowExporter: should create window root', () => {
    const exporter = new AvaloniaWindowExporter();
    assertEqual(exporter.id, 'avalonia-window');
    
    const result = exporter.export({ objects: [] });
    assertContains(result.content, '<Window');
});

test('AvaloniaUserControlExporter: should create usercontrol root', () => {
    const exporter = new AvaloniaUserControlExporter();
    assertEqual(exporter.id, 'avalonia-usercontrol');
    
    const result = exporter.export({ objects: [] });
    assertContains(result.content, '<UserControl');
});

test('AvaloniaProjectExporter: should include all files', () => {
    const exporter = new AvaloniaProjectExporter();
    assertEqual(exporter.id, 'avalonia-project');
    
    const result = exporter.export({ objects: [] });
    
    assertTrue(Object.keys(result.files).length > 3, 'Should have multiple files');
});

test('createSpecializedExporter: should create correct type', () => {
    const windowExporter = createSpecializedExporter('window');
    assertTrue(windowExporter instanceof AvaloniaWindowExporter);
    
    const ucExporter = createSpecializedExporter('usercontrol');
    assertTrue(ucExporter instanceof AvaloniaUserControlExporter);
    
    const projectExporter = createSpecializedExporter('project');
    assertTrue(projectExporter instanceof AvaloniaProjectExporter);
});

// ==========================================
// INTEGRATION TESTS
// ==========================================

test('Integration: complete form export', () => {
    const exporter = createAvaloniaExporter({
        namespace: 'LoginApp',
        className: 'LoginForm',
        includeCodeBehind: true,
        includeViewModel: true
    });
    
    const scene = {
        title: 'Login Form',
        width: 400,
        height: 300,
        objects: [
            {
                type: 'layout-stackpanel',
                orientation: 'vertical',
                margin: 20,
                children: [
                    {
                        type: 'ui-textbox',
                        name: 'UsernameInput',
                        placeholder: 'Username',
                        text: '{Binding Username}'
                    },
                    {
                        type: 'ui-textbox',
                        name: 'PasswordInput',
                        placeholder: 'Password'
                    },
                    {
                        type: 'ui-checkbox',
                        name: 'RememberMe',
                        label: 'Remember me'
                    },
                    {
                        type: 'layout-stackpanel',
                        orientation: 'horizontal',
                        children: [
                            { type: 'ui-button', text: 'Cancel' },
                            { type: 'ui-button', text: 'Login' }
                        ]
                    }
                ]
            }
        ]
    };
    
    const result = exporter.export(scene);
    
    assertTrue(result.success, 'Export should succeed');
    
    // Check XAML
    assertContains(result.content, '<StackPanel');
    assertContains(result.content, '<TextBox');
    assertContains(result.content, '<CheckBox');
    assertContains(result.content, '<Button');
    
    // Check code-behind
    const codeBehind = result.files['LoginForm.axaml.cs'].content;
    assertContains(codeBehind, 'LoginForm');
    
    // Check ViewModel
    const viewModel = result.files['LoginFormViewModel.cs'].content;
    assertContains(viewModel, 'LoginFormViewModel');
});

test('Integration: nested layouts export', () => {
    const exporter = createAvaloniaExporter();
    
    const scene = {
        objects: [
            {
                type: 'layout-grid',
                rows: 'Auto,*,Auto',
                columns: '*,*',
                children: [
                    { type: 'ui-button', text: 'Header', gridRow: 0, gridColumn: 0, gridColumnSpan: 2 },
                    { type: 'layout-stackpanel', gridRow: 1, gridColumn: 0, children: [
                        { type: 'ui-textbox', placeholder: 'Left' }
                    ]},
                    { type: 'layout-stackpanel', gridRow: 1, gridColumn: 1, children: [
                        { type: 'ui-textbox', placeholder: 'Right' }
                    ]},
                    { type: 'ui-button', text: 'Footer', gridRow: 2, gridColumn: 0, gridColumnSpan: 2 }
                ]
            }
        ]
    };
    
    const result = exporter.export(scene);
    
    assertTrue(result.success, 'Export should succeed');
    assertContains(result.content, '<Grid');
    assertContains(result.content, 'Grid.Row="0"');
    assertContains(result.content, 'Grid.ColumnSpan="2"');
});

// ==========================================
// RUN TESTS
// ==========================================

runTests().then(results => {
    if (typeof process !== 'undefined') {
        process.exit(results.failed > 0 ? 1 : 0);
    }
});

export { runTests };
