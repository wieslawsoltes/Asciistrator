/**
 * Asciistrator - Avalonia XAML Exporter
 * 
 * Main exporter class that coordinates XAML, style, and code-behind generation.
 * Uses FrameworkMappings for component and property name translation.
 * Extends the base exporter system for integration with the export framework.
 * Enhanced with effects, transforms, and gradient support.
 * 
 * @version 2.0.0
 */

import { BaseExporter } from '../BaseExporter.js';
import { getMappingBySourceId, AVALONIA_COMPONENT_MAPPINGS } from './ComponentMappings.js';
import { PropertyConverter, propertyConverter, ExtendedConverterTypes } from './PropertyConverters.js';
import { XamlGenerator, createXamlGenerator } from './XamlGenerator.js';
import { StyleGenerator, createStyleGenerator, ASCII_COLORS } from './StyleGenerator.js';
import { CodeBehindGenerator, createCodeBehindGenerator } from './CodeBehindGenerator.js';
import frameworkMappingRegistry, { UIFramework } from '../../../components/FrameworkMappings.js';

// ==========================================
// AVALONIA XAML EXPORTER CLASS
// ==========================================

/**
 * Avalonia XAML Exporter
 * Exports Asciistrator scenes to Avalonia XAML format
 */
export class AvaloniaXamlExporter extends BaseExporter {
    constructor(config = {}) {
        super(config);
        
        this._xamlGenerator = null;
        this._styleGenerator = null;
        this._codeBehindGenerator = null;
        
        // Export options
        this._exportOptions = {
            rootElement: 'UserControl',
            namespace: 'AsciistratorApp',
            className: 'ExportedView',
            includeStyles: true,
            includeCodeBehind: false,
            includeViewModel: false,
            useReactiveUI: false,
            useCommunityToolkit: false,
            generateTheme: false,
            indentSize: 4,
            useTabs: false,
            includeDesignTimeData: true,
            includeComments: true,
            // Enhanced options
            includeEffects: true,
            includeTransforms: true,
            includeGradients: true,
            generateStyles: true,
            optimizeOutput: true,
            framework: 'avalonia',
            avaloniaVersion: 11
        };
    }
    
    // ==========================================
    // METADATA
    // ==========================================
    
    get id() { return 'avalonia-xaml'; }
    get name() { return 'Avalonia XAML'; }
    get description() { return 'Export to Avalonia XAML UI framework format'; }
    get fileExtension() { return '.axaml'; }
    get mimeType() { return 'application/xml'; }
    get category() { return 'framework'; }
    
    // ==========================================
    // CONFIGURATION
    // ==========================================
    
    /**
     * Get export options schema for UI
     * @returns {object} Options schema
     */
    getOptionsSchema() {
        return {
            rootElement: {
                type: 'select',
                label: 'Root Element',
                options: ['Window', 'UserControl', 'ContentControl', 'Page'],
                default: 'UserControl'
            },
            namespace: {
                type: 'text',
                label: 'Namespace',
                default: 'AsciistratorApp'
            },
            className: {
                type: 'text',
                label: 'Class Name',
                default: 'ExportedView'
            },
            includeStyles: {
                type: 'boolean',
                label: 'Include Styles',
                default: true
            },
            includeCodeBehind: {
                type: 'boolean',
                label: 'Generate Code-Behind',
                default: false
            },
            includeViewModel: {
                type: 'boolean',
                label: 'Generate ViewModel',
                default: false
            },
            useReactiveUI: {
                type: 'boolean',
                label: 'Use ReactiveUI',
                default: false
            },
            useCommunityToolkit: {
                type: 'boolean',
                label: 'Use CommunityToolkit.Mvvm',
                default: false
            },
            generateTheme: {
                type: 'boolean',
                label: 'Generate Theme File',
                default: false
            },
            indentSize: {
                type: 'number',
                label: 'Indent Size',
                min: 1,
                max: 8,
                default: 4
            },
            useTabs: {
                type: 'boolean',
                label: 'Use Tabs',
                default: false
            },
            includeDesignTimeData: {
                type: 'boolean',
                label: 'Include Design-Time Data',
                default: true
            },
            // Enhanced options
            includeEffects: {
                type: 'boolean',
                label: 'Include Effects (Shadows, Blur)',
                default: true
            },
            includeTransforms: {
                type: 'boolean',
                label: 'Include Transforms',
                default: true
            },
            includeGradients: {
                type: 'boolean',
                label: 'Include Gradients',
                default: true
            },
            generateStyles: {
                type: 'boolean',
                label: 'Generate Avalonia Styles',
                default: true
            },
            optimizeOutput: {
                type: 'boolean',
                label: 'Optimize Output',
                default: true
            }
        };
    }
    
    /**
     * Configure export options
     * @param {object} options - Export options
     */
    configure(options) {
        this._exportOptions = { ...this._exportOptions, ...options };
        this._initializeGenerators();
    }
    
    /**
     * Initialize sub-generators
     * @private
     */
    _initializeGenerators() {
        this._xamlGenerator = createXamlGenerator({
            indentSize: this._exportOptions.indentSize,
            useTabs: this._exportOptions.useTabs,
            includeDesignTimeData: this._exportOptions.includeDesignTimeData,
            includeComments: this._exportOptions.includeComments,
            rootNamespace: this._exportOptions.namespace,
            // Enhanced options
            includeEffects: this._exportOptions.includeEffects,
            includeTransforms: this._exportOptions.includeTransforms,
            includeGradients: this._exportOptions.includeGradients,
            framework: this._exportOptions.framework,
            avaloniaVersion: this._exportOptions.avaloniaVersion
        });
        
        this._styleGenerator = createStyleGenerator({
            indentSize: this._exportOptions.indentSize,
            useTabs: this._exportOptions.useTabs,
            generateComments: this._exportOptions.includeComments,
            includeEffects: this._exportOptions.includeEffects,
            includeGradients: this._exportOptions.includeGradients
        });
        
        this._codeBehindGenerator = createCodeBehindGenerator({
            namespace: this._exportOptions.namespace,
            useReactiveUI: this._exportOptions.useReactiveUI,
            useCommunityToolkit: this._exportOptions.useCommunityToolkit,
            generateComments: this._exportOptions.includeComments,
            indentSize: this._exportOptions.indentSize,
            useTabs: this._exportOptions.useTabs
        });
    }
    
    // ==========================================
    // EXPORT API
    // ==========================================
    
    /**
     * Export scene to Avalonia XAML
     * @param {object} scene - Scene to export
     * @param {object} options - Export options
     * @returns {object} Export result
     */
    export(scene, options = {}) {
        // Merge options
        const exportOptions = { ...this._exportOptions, ...options };
        this.configure(exportOptions);
        
        // Prepare scene data
        const preparedScene = this._prepareScene(scene, exportOptions);
        
        // Generate files
        const result = {
            success: true,
            files: {}
        };
        
        try {
            // Main XAML file
            const xamlContent = this._xamlGenerator.generateDocument(
                preparedScene, 
                exportOptions.rootElement
            );
            result.files[`${exportOptions.className}.axaml`] = {
                content: xamlContent,
                type: 'xaml'
            };
            
            // Code-behind file
            if (exportOptions.includeCodeBehind) {
                const codeBehindContent = this._codeBehindGenerator.generateCodeBehind(
                    preparedScene,
                    exportOptions.className,
                    exportOptions.rootElement
                );
                result.files[`${exportOptions.className}.axaml.cs`] = {
                    content: codeBehindContent,
                    type: 'csharp'
                };
            }
            
            // ViewModel file
            if (exportOptions.includeViewModel) {
                const viewModelContent = this._codeBehindGenerator.generateViewModel(
                    preparedScene,
                    exportOptions.className
                );
                result.files[`${exportOptions.className}ViewModel.cs`] = {
                    content: viewModelContent,
                    type: 'csharp'
                };
            }
            
            // Theme file
            if (exportOptions.generateTheme) {
                const themeContent = this._styleGenerator.generateTheme();
                result.files['AsciiTheme.axaml'] = {
                    content: themeContent,
                    type: 'xaml'
                };
            }
            
            // Primary output (for single-file export)
            result.content = xamlContent;
            result.filename = `${exportOptions.className}.axaml`;
            
        } catch (error) {
            result.success = false;
            result.error = error.message;
            console.error('Avalonia export error:', error);
        }
        
        return result;
    }
    
    /**
     * Export to string (BaseExporter interface)
     * @param {object} scene - Scene to export
     * @param {object} options - Export options
     * @returns {string} XAML content
     */
    exportToString(scene, options = {}) {
        const result = this.export(scene, options);
        return result.content || '';
    }
    
    /**
     * Export to blob (BaseExporter interface)
     * @param {object} scene - Scene to export
     * @param {object} options - Export options
     * @returns {Blob}
     */
    exportToBlob(scene, options = {}) {
        const content = this.exportToString(scene, options);
        return new Blob([content], { type: this.metadata.mimeType });
    }
    
    /**
     * Export project files (multiple files)
     * @param {object} scene - Scene to export
     * @param {object} options - Export options
     * @returns {Map<string, string>} Map of filename to content
     */
    exportProject(scene, options = {}) {
        const result = this.export(scene, {
            ...options,
            includeCodeBehind: true,
            includeViewModel: true,
            generateTheme: true
        });
        
        const files = new Map();
        for (const [filename, file] of Object.entries(result.files)) {
            files.set(filename, file.content);
        }
        
        return files;
    }
    
    // ==========================================
    // SCENE PREPARATION
    // ==========================================
    
    /**
     * Prepare scene for export
     * @private
     */
    _prepareScene(scene, options) {
        // Extract objects from layers if present (Asciistrator document format)
        let objects = scene.objects || scene.components || scene.children || [];
        
        if (scene.layers && Array.isArray(scene.layers)) {
            // Flatten objects from all visible layers
            objects = scene.layers
                .filter(layer => layer.visible !== false)
                .flatMap(layer => layer.objects || []);
        }
        
        return {
            title: scene.title || options.className,
            className: options.className,
            width: scene.width || scene.canvas?.width || 800,
            height: scene.height || scene.canvas?.height || 600,
            hasViewModel: options.includeViewModel,
            resources: this._extractResources(scene),
            components: this._transformComponents(objects)
        };
    }
    
    /**
     * Extract resources from scene
     * @private
     */
    _extractResources(scene) {
        const resources = {};
        
        // Add ASCII theme colors as resources
        if (this._exportOptions.includeStyles) {
            for (const [name, color] of Object.entries(ASCII_COLORS)) {
                resources[name] = { type: 'brush', color };
            }
        }
        
        // Add scene-specific resources
        if (scene.resources) {
            Object.assign(resources, scene.resources);
        }
        
        return resources;
    }
    
    /**
     * Transform Asciistrator objects to component format
     * @private
     */
    _transformComponents(objects) {
        return objects.map(obj => this._transformObject(obj));
    }
    
    /**
     * Transform single object
     * @private
     */
    _transformObject(obj) {
        // Check if this is a UI component (dropped from component library)
        if (obj.uiComponentType || obj.avaloniaType) {
            // Use FrameworkMappings to get the correct Avalonia type
            const componentType = obj.uiComponentType || obj.avaloniaType;
            const frameworkMapping = frameworkMappingRegistry.getMapping(UIFramework.Avalonia, componentType);
            
            // Fall back to legacy mapping if no framework mapping found
            const legacyMapping = getMappingBySourceId(componentType);
            
            // Determine target type - prefer framework mapping
            const targetType = frameworkMapping?.targetType || obj.avaloniaType || componentType;
            const targetNamespace = frameworkMapping?.targetNamespace || obj.avaloniaNamespace;
            
            const component = {
                type: targetType,
                name: obj.name,
                avaloniaControl: targetType,
                avaloniaNamespace: targetNamespace,
                ...this._extractUIComponentProperties(obj, frameworkMapping || legacyMapping)
            };
            
            // Handle children
            if (obj.children && obj.children.length > 0) {
                component.children = obj.children.map(child => this._transformObject(child));
            }
            
            return component;
        }
        
        // Check if this is a standard mapped component
        const mapping = getMappingBySourceId(obj.type);
        
        const component = {
            type: obj.type,
            name: obj.name,
            ...this._extractProperties(obj, mapping)
        };
        
        // Handle children
        if (obj.children && obj.children.length > 0) {
            component.children = obj.children.map(child => this._transformObject(child));
        }
        
        // Handle ASCII art conversion
        if (obj.type === 'text' && obj.asciiArt) {
            component.type = 'ui-ascii-display';
            component.content = obj.text;
        }
        
        return component;
    }
    
    /**
     * Extract properties from UI component
     * Only include properties that were explicitly set (non-default values)
     * Uses FrameworkMappings to translate property names to Avalonia format
     * @private
     */
    _extractUIComponentProperties(obj, mapping) {
        const props = {};
        const componentType = obj.uiComponentType || obj.avaloniaType;
        
        // Include Canvas position from object coordinates
        if (obj.x !== undefined && obj.x !== 0) {
            props.canvasLeft = obj.x;
        }
        if (obj.y !== undefined && obj.y !== 0) {
            props.canvasTop = obj.y;
        }
        
        // Only copy explicitly set UI properties (stored in uiProperties)
        // Skip default/empty values
        if (obj.uiProperties) {
            for (const [key, value] of Object.entries(obj.uiProperties)) {
                // Skip undefined, null, empty strings, and default values
                if (value === undefined || value === null || value === '') continue;
                // Skip default boolean false values for most properties
                if (value === false && !['isChecked'].includes(key)) continue;
                // Skip zero values for numeric properties that default to 0
                if (value === 0 && ['minimum', 'value', 'gridRow', 'gridColumn'].includes(key)) continue;
                // Skip default enum values
                if (value === 'Stretch' && ['horizontalAlignment', 'verticalAlignment', 'horizontalContentAlignment', 'verticalContentAlignment'].includes(key)) continue;
                
                // Use FrameworkMappings to get the correct Avalonia property name
                const avaloniaPropertyName = frameworkMappingRegistry.getPropertyName(
                    UIFramework.Avalonia, 
                    key, 
                    componentType
                );
                
                // Apply any value converter if needed
                const converter = frameworkMappingRegistry.getConverter(
                    UIFramework.Avalonia,
                    key,
                    null, // type hint
                    componentType
                );
                
                const convertedValue = converter ? converter(value) : value;
                
                // Store with Avalonia property name
                props[avaloniaPropertyName] = convertedValue;
            }
        }
        
        return props;
    }
    
    /**
     * Extract properties from object
     * @private
     */
    _extractProperties(obj, mapping) {
        const props = {};
        
        // Copy standard properties
        const standardProps = [
            'text', 'content', 'value', 'isChecked', 'isEnabled', 'isVisible',
            'placeholder', 'minimum', 'maximum', 'items', 'selectedItem',
            'orientation', 'dock', 'width', 'height', 'margin', 'padding',
            'background', 'foreground', 'borderColor', 'borderWidth',
            'gridRow', 'gridColumn', 'gridRowSpan', 'gridColumnSpan',
            'horizontalAlignment', 'verticalAlignment', 'command', 'commandParameter'
        ];
        
        for (const prop of standardProps) {
            if (obj[prop] !== undefined) {
                props[prop] = obj[prop];
            }
        }
        
        // Handle bound position for ASCII objects
        if (obj.x !== undefined) props.canvasLeft = obj.x;
        if (obj.y !== undefined) props.canvasTop = obj.y;
        
        return props;
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Get supported component types
     * @returns {string[]}
     */
    getSupportedComponents() {
        return AVALONIA_COMPONENT_MAPPINGS.map(m => m.sourceId);
    }
    
    /**
     * Check if component type is supported
     * @param {string} type - Component type
     * @returns {boolean}
     */
    isComponentSupported(type) {
        return getMappingBySourceId(type) !== null;
    }
    
    /**
     * Get mapping for component type
     * @param {string} type - Component type
     * @returns {object|null}
     */
    getComponentMapping(type) {
        return getMappingBySourceId(type);
    }
    
    /**
     * Preview export without generating files
     * @param {object} scene - Scene to preview
     * @param {object} options - Export options
     * @returns {object} Preview information
     */
    preview(scene, options = {}) {
        const exportOptions = { ...this._exportOptions, ...options };
        const preparedScene = this._prepareScene(scene, exportOptions);
        
        return {
            componentCount: this._countComponents(preparedScene.components),
            supportedCount: this._countSupportedComponents(preparedScene.components),
            unsupportedTypes: this._getUnsupportedTypes(preparedScene.components),
            estimatedFileCount: this._getEstimatedFileCount(exportOptions),
            rootElement: exportOptions.rootElement,
            namespace: exportOptions.namespace,
            className: exportOptions.className
        };
    }
    
    /**
     * Count total components
     * @private
     */
    _countComponents(components, count = 0) {
        for (const comp of components) {
            count++;
            if (comp.children) {
                count = this._countComponents(comp.children, count);
            }
        }
        return count;
    }
    
    /**
     * Count supported components
     * @private
     */
    _countSupportedComponents(components, count = 0) {
        for (const comp of components) {
            if (this.isComponentSupported(comp.type)) {
                count++;
            }
            if (comp.children) {
                count = this._countSupportedComponents(comp.children, count);
            }
        }
        return count;
    }
    
    /**
     * Get unsupported types
     * @private
     */
    _getUnsupportedTypes(components, types = new Set()) {
        for (const comp of components) {
            if (!this.isComponentSupported(comp.type)) {
                types.add(comp.type);
            }
            if (comp.children) {
                this._getUnsupportedTypes(comp.children, types);
            }
        }
        return Array.from(types);
    }
    
    /**
     * Get estimated file count
     * @private
     */
    _getEstimatedFileCount(options) {
        let count = 1; // Main XAML
        if (options.includeCodeBehind) count++;
        if (options.includeViewModel) count++;
        if (options.generateTheme) count++;
        return count;
    }
}

// ==========================================
// SPECIALIZED EXPORTERS
// ==========================================

/**
 * Window-specific Avalonia exporter
 */
export class AvaloniaWindowExporter extends AvaloniaXamlExporter {
    constructor() {
        super();
        this._exportOptions.rootElement = 'Window';
    }
    
    get id() { return 'avalonia-window'; }
    get name() { return 'Avalonia Window'; }
}

/**
 * UserControl-specific Avalonia exporter
 */
export class AvaloniaUserControlExporter extends AvaloniaXamlExporter {
    constructor() {
        super();
        this._exportOptions.rootElement = 'UserControl';
    }
    
    get id() { return 'avalonia-usercontrol'; }
    get name() { return 'Avalonia UserControl'; }
}

/**
 * Full project exporter with all files
 */
export class AvaloniaProjectExporter extends AvaloniaXamlExporter {
    constructor() {
        super();
        this._exportOptions.includeCodeBehind = true;
        this._exportOptions.includeViewModel = true;
        this._exportOptions.generateTheme = true;
    }
    
    get id() { return 'avalonia-project'; }
    get name() { return 'Avalonia Project'; }
    get description() { return 'Export complete Avalonia project with all necessary files'; }
    
    /**
     * Export complete project
     * @param {object} scene - Scene to export
     * @param {object} options - Export options
     * @returns {object} Export result with all project files
     */
    export(scene, options = {}) {
        const result = super.export(scene, {
            ...options,
            includeCodeBehind: true,
            includeViewModel: true,
            generateTheme: true
        });
        
        // Add project file
        if (result.success) {
            const projectFiles = this._codeBehindGenerator.generateProjectStructure(
                this._exportOptions.namespace
            );
            
            for (const [filename, content] of Object.entries(projectFiles)) {
                result.files[filename] = {
                    content,
                    type: filename.endsWith('.cs') ? 'csharp' : 
                          filename.endsWith('.axaml') ? 'xaml' : 
                          filename.endsWith('.csproj') ? 'xml' : 'text'
                };
            }
        }
        
        return result;
    }
}

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Create Avalonia XAML exporter
 */
export function createAvaloniaExporter(options = {}) {
    const exporter = new AvaloniaXamlExporter();
    exporter.configure(options);
    return exporter;
}

/**
 * Create specialized exporter based on type
 */
export function createSpecializedExporter(type, options = {}) {
    let exporter;
    
    switch (type) {
        case 'window':
            exporter = new AvaloniaWindowExporter();
            break;
        case 'usercontrol':
            exporter = new AvaloniaUserControlExporter();
            break;
        case 'project':
            exporter = new AvaloniaProjectExporter();
            break;
        default:
            exporter = new AvaloniaXamlExporter();
    }
    
    exporter.configure(options);
    return exporter;
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default AvaloniaXamlExporter;
