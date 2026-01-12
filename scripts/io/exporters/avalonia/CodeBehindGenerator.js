/**
 * Asciistrator - Avalonia Code-Behind Generator
 * 
 * Generates C# code-behind files for Avalonia XAML views.
 * Supports view models, commands, and data binding.
 * 
 * @version 1.0.0
 */

// ==========================================
// CODE-BEHIND GENERATOR CLASS
// ==========================================

/**
 * Generates C# code-behind for Avalonia views
 */
export class CodeBehindGenerator {
    constructor(options = {}) {
        this._options = {
            namespace: 'AsciistratorApp',
            useReactiveUI: false,
            useCommunityToolkit: false,
            generateComments: true,
            indentSize: 4,
            useTabs: false,
            ...options
        };
    }
    
    // ==========================================
    // PUBLIC API
    // ==========================================
    
    /**
     * Generate code-behind file
     * @param {object} scene - Scene definition
     * @param {string} className - Class name
     * @param {string} baseClass - Base class (Window, UserControl, etc.)
     * @returns {string} C# code
     */
    generateCodeBehind(scene, className, baseClass = 'UserControl') {
        const lines = [];
        
        // Usings
        lines.push(...this._generateUsings(baseClass));
        lines.push('');
        
        // Namespace
        lines.push(`namespace ${this._options.namespace}`);
        lines.push('{');
        
        // Class
        lines.push(...this._generateClass(scene, className, baseClass, 1));
        
        lines.push('}');
        
        return lines.join('\n');
    }
    
    /**
     * Generate ViewModel class
     * @param {object} scene - Scene definition
     * @param {string} className - Class name (without ViewModel suffix)
     * @returns {string} C# code
     */
    generateViewModel(scene, className) {
        const lines = [];
        const viewModelName = `${className}ViewModel`;
        
        // Usings
        lines.push(...this._generateViewModelUsings());
        lines.push('');
        
        // Namespace
        lines.push(`namespace ${this._options.namespace}.ViewModels`);
        lines.push('{');
        
        // Class
        lines.push(...this._generateViewModelClass(scene, viewModelName, 1));
        
        lines.push('}');
        
        return lines.join('\n');
    }
    
    /**
     * Generate command handler
     * @param {string} commandName - Command name
     * @param {object} options - Command options
     * @returns {string} C# code snippet
     */
    generateCommand(commandName, options = {}) {
        const indent = this._indent(2);
        const lines = [];
        
        if (this._options.useCommunityToolkit) {
            // Using CommunityToolkit.Mvvm
            lines.push(`${indent}[RelayCommand]`);
            lines.push(`${indent}private void ${commandName}()`);
            lines.push(`${indent}{`);
            lines.push(`${indent}    // TODO: Implement ${commandName}`);
            lines.push(`${indent}}`);
        } else if (this._options.useReactiveUI) {
            // Using ReactiveUI
            lines.push(`${indent}public ReactiveCommand<Unit, Unit> ${commandName}Command { get; }`);
            lines.push('');
            lines.push(`${indent}// In constructor:`);
            lines.push(`${indent}// ${commandName}Command = ReactiveCommand.Create(() => { /* implementation */ });`);
        } else {
            // Plain ICommand
            lines.push(`${indent}public ICommand ${commandName}Command { get; }`);
            lines.push('');
            lines.push(`${indent}private void Execute${commandName}()`);
            lines.push(`${indent}{`);
            lines.push(`${indent}    // TODO: Implement ${commandName}`);
            lines.push(`${indent}}`);
            lines.push('');
            lines.push(`${indent}private bool CanExecute${commandName}()`);
            lines.push(`${indent}{`);
            lines.push(`${indent}    return true;`);
            lines.push(`${indent}}`);
        }
        
        return lines.join('\n');
    }
    
    /**
     * Generate property with change notification
     * @param {string} propertyName - Property name
     * @param {string} propertyType - C# type
     * @param {any} defaultValue - Default value
     * @returns {string} C# code snippet
     */
    generateProperty(propertyName, propertyType, defaultValue = null) {
        const indent = this._indent(2);
        const lines = [];
        const fieldName = '_' + propertyName.charAt(0).toLowerCase() + propertyName.slice(1);
        
        if (this._options.useCommunityToolkit) {
            // Using CommunityToolkit.Mvvm
            const defaultValueStr = defaultValue !== null ? ` = ${this._formatCSharpValue(defaultValue, propertyType)}` : '';
            lines.push(`${indent}[ObservableProperty]`);
            lines.push(`${indent}private ${propertyType} ${fieldName}${defaultValueStr};`);
        } else if (this._options.useReactiveUI) {
            // Using ReactiveUI
            const defaultValueStr = defaultValue !== null ? ` = ${this._formatCSharpValue(defaultValue, propertyType)}` : '';
            lines.push(`${indent}private ${propertyType} ${fieldName}${defaultValueStr};`);
            lines.push(`${indent}public ${propertyType} ${propertyName}`);
            lines.push(`${indent}{`);
            lines.push(`${indent}    get => ${fieldName};`);
            lines.push(`${indent}    set => this.RaiseAndSetIfChanged(ref ${fieldName}, value);`);
            lines.push(`${indent}}`);
        } else {
            // Plain INotifyPropertyChanged
            const defaultValueStr = defaultValue !== null ? ` = ${this._formatCSharpValue(defaultValue, propertyType)}` : '';
            lines.push(`${indent}private ${propertyType} ${fieldName}${defaultValueStr};`);
            lines.push(`${indent}public ${propertyType} ${propertyName}`);
            lines.push(`${indent}{`);
            lines.push(`${indent}    get => ${fieldName};`);
            lines.push(`${indent}    set`);
            lines.push(`${indent}    {`);
            lines.push(`${indent}        if (${fieldName} != value)`);
            lines.push(`${indent}        {`);
            lines.push(`${indent}            ${fieldName} = value;`);
            lines.push(`${indent}            OnPropertyChanged(nameof(${propertyName}));`);
            lines.push(`${indent}        }`);
            lines.push(`${indent}    }`);
            lines.push(`${indent}}`);
        }
        
        return lines.join('\n');
    }
    
    /**
     * Generate converter class
     * @param {string} converterName - Converter name
     * @param {string} sourceType - Source type
     * @param {string} targetType - Target type
     * @returns {string} C# code
     */
    generateConverter(converterName, sourceType, targetType) {
        const lines = [];
        const indent = this._indent(1);
        
        lines.push(`${indent}public class ${converterName} : IValueConverter`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        if (value is ${sourceType} source)`);
        lines.push(`${indent}        {`);
        lines.push(`${indent}            // TODO: Convert ${sourceType} to ${targetType}`);
        lines.push(`${indent}            return default(${targetType});`);
        lines.push(`${indent}        }`);
        lines.push(`${indent}        return AvaloniaProperty.UnsetValue;`);
        lines.push(`${indent}    }`);
        lines.push('');
        lines.push(`${indent}    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        throw new NotImplementedException();`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}}`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate full project structure file list
     * @param {string} projectName - Project name
     * @returns {object} File structure
     */
    generateProjectStructure(projectName) {
        return {
            [`${projectName}.csproj`]: this._generateCsProj(projectName),
            'App.axaml': this._generateAppXaml(projectName),
            'App.axaml.cs': this._generateAppCodeBehind(projectName),
            'ViewModels/ViewModelBase.cs': this._generateViewModelBase(),
            'ViewModels/MainWindowViewModel.cs': this._generateMainViewModel(),
            'Views/MainWindow.axaml.cs': this._generateMainWindowCodeBehind(projectName)
        };
    }
    
    // ==========================================
    // PRIVATE: USING STATEMENTS
    // ==========================================
    
    /**
     * Generate using statements for code-behind
     * @private
     */
    _generateUsings(baseClass) {
        const usings = [
            'using Avalonia.Controls;',
            'using Avalonia.Markup.Xaml;'
        ];
        
        if (baseClass === 'Window') {
            usings.push('using Avalonia.Interactivity;');
        }
        
        return usings;
    }
    
    /**
     * Generate using statements for ViewModel
     * @private
     */
    _generateViewModelUsings() {
        const usings = [
            'using System;',
            'using System.Collections.Generic;',
            'using System.Collections.ObjectModel;',
            'using System.ComponentModel;',
            'using System.Runtime.CompilerServices;',
            'using System.Windows.Input;'
        ];
        
        if (this._options.useReactiveUI) {
            usings.push('using ReactiveUI;');
            usings.push('using System.Reactive;');
        }
        
        if (this._options.useCommunityToolkit) {
            usings.push('using CommunityToolkit.Mvvm.ComponentModel;');
            usings.push('using CommunityToolkit.Mvvm.Input;');
        }
        
        return usings;
    }
    
    // ==========================================
    // PRIVATE: CLASS GENERATION
    // ==========================================
    
    /**
     * Generate code-behind class
     * @private
     */
    _generateClass(scene, className, baseClass, indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        // Class declaration
        lines.push(`${indent}public partial class ${className} : ${baseClass}`);
        lines.push(`${indent}{`);
        
        // Constructor
        lines.push(`${indent}    public ${className}()`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        InitializeComponent();`);
        
        // Add DataContext setup if ViewModel is expected
        if (scene.hasViewModel) {
            lines.push(`${indent}        DataContext = new ${className}ViewModel();`);
        }
        
        lines.push(`${indent}    }`);
        
        // Event handlers from components
        const eventHandlers = this._extractEventHandlers(scene.components || scene.children || []);
        for (const handler of eventHandlers) {
            lines.push('');
            lines.push(...this._generateEventHandler(handler, indentLevel + 1));
        }
        
        lines.push(`${indent}}`);
        
        return lines;
    }
    
    /**
     * Generate ViewModel class
     * @private
     */
    _generateViewModelClass(scene, viewModelName, indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        // Determine base class
        let baseClass = 'INotifyPropertyChanged';
        if (this._options.useReactiveUI) {
            baseClass = 'ReactiveObject';
        } else if (this._options.useCommunityToolkit) {
            baseClass = 'ObservableObject';
        }
        
        // Class declaration
        lines.push(`${indent}public class ${viewModelName} : ${baseClass}`);
        lines.push(`${indent}{`);
        
        // Constructor
        lines.push(`${indent}    public ${viewModelName}()`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        // Initialize commands and collections`);
        lines.push(`${indent}    }`);
        lines.push('');
        
        // Extract properties from components
        const properties = this._extractBindableProperties(scene.components || scene.children || []);
        for (const prop of properties) {
            lines.push(this.generateProperty(prop.name, prop.type, prop.defaultValue));
            lines.push('');
        }
        
        // Extract commands
        const commands = this._extractCommands(scene.components || scene.children || []);
        for (const cmd of commands) {
            lines.push(this.generateCommand(cmd));
            lines.push('');
        }
        
        // INotifyPropertyChanged implementation (if not using framework)
        if (!this._options.useReactiveUI && !this._options.useCommunityToolkit) {
            lines.push(...this._generatePropertyChangedImplementation(indentLevel + 1));
        }
        
        lines.push(`${indent}}`);
        
        return lines;
    }
    
    /**
     * Generate event handler method
     * @private
     */
    _generateEventHandler(handler, indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        if (this._options.generateComments) {
            lines.push(`${indent}/// <summary>`);
            lines.push(`${indent}/// Handles ${handler.event} for ${handler.component}`);
            lines.push(`${indent}/// </summary>`);
        }
        
        lines.push(`${indent}private void ${handler.name}(object? sender, ${handler.eventArgsType} e)`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    // TODO: Implement ${handler.name}`);
        lines.push(`${indent}}`);
        
        return lines;
    }
    
    /**
     * Generate INotifyPropertyChanged implementation
     * @private
     */
    _generatePropertyChangedImplementation(indentLevel) {
        const indent = this._indent(indentLevel);
        const lines = [];
        
        lines.push(`${indent}public event PropertyChangedEventHandler? PropertyChanged;`);
        lines.push('');
        lines.push(`${indent}protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));`);
        lines.push(`${indent}}`);
        
        return lines;
    }
    
    // ==========================================
    // PRIVATE: PROJECT FILES
    // ==========================================
    
    /**
     * Generate .csproj file
     * @private
     */
    _generateCsProj(projectName) {
        const lines = [
            '<Project Sdk="Microsoft.NET.Sdk">',
            '  <PropertyGroup>',
            '    <OutputType>WinExe</OutputType>',
            '    <TargetFramework>net8.0</TargetFramework>',
            '    <Nullable>enable</Nullable>',
            '    <BuiltInComInteropSupport>true</BuiltInComInteropSupport>',
            '    <ApplicationManifest>app.manifest</ApplicationManifest>',
            '    <AvaloniaUseCompiledBindingsByDefault>true</AvaloniaUseCompiledBindingsByDefault>',
            '  </PropertyGroup>',
            '',
            '  <ItemGroup>',
            '    <PackageReference Include="Avalonia" Version="11.1.0" />',
            '    <PackageReference Include="Avalonia.Desktop" Version="11.1.0" />',
            '    <PackageReference Include="Avalonia.Themes.Fluent" Version="11.1.0" />',
            '    <PackageReference Include="Avalonia.Fonts.Inter" Version="11.1.0" />'
        ];
        
        if (this._options.useReactiveUI) {
            lines.push('    <PackageReference Include="Avalonia.ReactiveUI" Version="11.1.0" />');
        }
        
        if (this._options.useCommunityToolkit) {
            lines.push('    <PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />');
        }
        
        lines.push('  </ItemGroup>');
        lines.push('</Project>');
        
        return lines.join('\n');
    }
    
    /**
     * Generate App.axaml
     * @private
     */
    _generateAppXaml(projectName) {
        return `<Application xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             x:Class="${this._options.namespace}.App"
             RequestedThemeVariant="Dark">
    <Application.Styles>
        <FluentTheme />
    </Application.Styles>
</Application>`;
    }
    
    /**
     * Generate App.axaml.cs
     * @private
     */
    _generateAppCodeBehind(projectName) {
        return `using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using ${this._options.namespace}.Views;

namespace ${this._options.namespace}
{
    public partial class App : Application
    {
        public override void Initialize()
        {
            AvaloniaXamlLoader.Load(this);
        }

        public override void OnFrameworkInitializationCompleted()
        {
            if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
            {
                desktop.MainWindow = new MainWindow();
            }

            base.OnFrameworkInitializationCompleted();
        }
    }
}`;
    }
    
    /**
     * Generate ViewModelBase.cs
     * @private
     */
    _generateViewModelBase() {
        if (this._options.useReactiveUI) {
            return `using ReactiveUI;

namespace ${this._options.namespace}.ViewModels
{
    public class ViewModelBase : ReactiveObject
    {
    }
}`;
        }
        
        if (this._options.useCommunityToolkit) {
            return `using CommunityToolkit.Mvvm.ComponentModel;

namespace ${this._options.namespace}.ViewModels
{
    public class ViewModelBase : ObservableObject
    {
    }
}`;
        }
        
        return `using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace ${this._options.namespace}.ViewModels
{
    public class ViewModelBase : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
        {
            if (EqualityComparer<T>.Default.Equals(field, value))
                return false;

            field = value;
            OnPropertyChanged(propertyName);
            return true;
        }
    }
}`;
    }
    
    /**
     * Generate main ViewModel
     * @private
     */
    _generateMainViewModel() {
        const baseClass = this._options.useReactiveUI ? 'ViewModelBase' : 
                         this._options.useCommunityToolkit ? 'ViewModelBase' : 'ViewModelBase';
        
        return `using System;
using System.Collections.ObjectModel;

namespace ${this._options.namespace}.ViewModels
{
    public class MainWindowViewModel : ${baseClass}
    {
        public MainWindowViewModel()
        {
            // Initialize
        }
    }
}`;
    }
    
    /**
     * Generate main window code-behind
     * @private
     */
    _generateMainWindowCodeBehind(projectName) {
        return `using Avalonia.Controls;
using ${this._options.namespace}.ViewModels;

namespace ${this._options.namespace}.Views
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            DataContext = new MainWindowViewModel();
        }
    }
}`;
    }
    
    // ==========================================
    // PRIVATE: EXTRACTION HELPERS
    // ==========================================
    
    /**
     * Extract event handlers from components
     * @private
     */
    _extractEventHandlers(components, handlers = []) {
        for (const comp of components) {
            // Check for event properties
            if (comp.onClick) {
                handlers.push({
                    name: comp.onClick,
                    component: comp.name || comp.type,
                    event: 'Click',
                    eventArgsType: 'RoutedEventArgs'
                });
            }
            if (comp.onSelectionChanged) {
                handlers.push({
                    name: comp.onSelectionChanged,
                    component: comp.name || comp.type,
                    event: 'SelectionChanged',
                    eventArgsType: 'SelectionChangedEventArgs'
                });
            }
            if (comp.onTextChanged) {
                handlers.push({
                    name: comp.onTextChanged,
                    component: comp.name || comp.type,
                    event: 'TextChanged',
                    eventArgsType: 'TextChangedEventArgs'
                });
            }
            
            // Recurse into children
            if (comp.children) {
                this._extractEventHandlers(comp.children, handlers);
            }
        }
        
        return handlers;
    }
    
    /**
     * Extract bindable properties from components
     * @private
     */
    _extractBindableProperties(components, properties = []) {
        for (const comp of components) {
            // Check for binding expressions
            for (const [key, value] of Object.entries(comp)) {
                if (typeof value === 'string' && value.startsWith('{Binding ')) {
                    const match = value.match(/\{Binding\s+(\w+)/);
                    if (match) {
                        const propName = match[1];
                        if (!properties.find(p => p.name === propName)) {
                            properties.push({
                                name: propName,
                                type: this._inferCSharpType(key, comp.type),
                                defaultValue: null
                            });
                        }
                    }
                }
            }
            
            // Recurse into children
            if (comp.children) {
                this._extractBindableProperties(comp.children, properties);
            }
        }
        
        return properties;
    }
    
    /**
     * Extract commands from components
     * @private
     */
    _extractCommands(components, commands = []) {
        for (const comp of components) {
            if (comp.command) {
                const match = comp.command.match(/\{Binding\s+(\w+)Command/);
                if (match && !commands.includes(match[1])) {
                    commands.push(match[1]);
                }
            }
            
            if (comp.children) {
                this._extractCommands(comp.children, commands);
            }
        }
        
        return commands;
    }
    
    /**
     * Infer C# type from property
     * @private
     */
    _inferCSharpType(propertyName, componentType) {
        const typeMap = {
            'text': 'string',
            'content': 'string',
            'title': 'string',
            'value': 'double',
            'isChecked': 'bool?',
            'isEnabled': 'bool',
            'isVisible': 'bool',
            'selectedIndex': 'int',
            'selectedItem': 'object?',
            'items': 'ObservableCollection<object>',
            'minimum': 'double',
            'maximum': 'double',
            'date': 'DateTime?',
            'time': 'TimeSpan?'
        };
        
        return typeMap[propertyName] || 'string';
    }
    
    /**
     * Format value for C# code
     * @private
     */
    _formatCSharpValue(value, type) {
        if (value === null) return 'null';
        
        switch (type) {
            case 'string':
                return `"${value}"`;
            case 'bool':
            case 'bool?':
                return value ? 'true' : 'false';
            case 'int':
            case 'double':
                return String(value);
            default:
                if (typeof value === 'string') {
                    return `"${value}"`;
                }
                return String(value);
        }
    }
    
    // ==========================================
    // PRIVATE: UTILITIES
    // ==========================================
    
    /**
     * Generate indentation
     * @private
     */
    _indent(level) {
        const char = this._options.useTabs ? '\t' : ' ';
        const size = this._options.useTabs ? 1 : this._options.indentSize;
        return char.repeat(size * level);
    }
}

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Create code-behind generator
 */
export function createCodeBehindGenerator(options = {}) {
    return new CodeBehindGenerator(options);
}

/**
 * Generate code-behind from scene
 */
export function generateCodeBehind(scene, className, options = {}) {
    const generator = new CodeBehindGenerator(options);
    return generator.generateCodeBehind(scene, className, options.baseClass || 'UserControl');
}

/**
 * Generate ViewModel from scene
 */
export function generateViewModel(scene, className, options = {}) {
    const generator = new CodeBehindGenerator(options);
    return generator.generateViewModel(scene, className);
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default CodeBehindGenerator;
