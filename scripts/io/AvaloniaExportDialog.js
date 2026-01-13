/**
 * Asciistrator - Avalonia Export Dialog
 * 
 * Specialized dialog for exporting to Avalonia XAML with full options
 * for generating Window, UserControl, code-behind, ViewModel, and themes.
 * Enhanced with effects, transforms, and gradient export options.
 * 
 * @version 2.0.0
 */

import { createElement } from '../utils/dom.js';
import {
    AvaloniaXamlExporter,
    AvaloniaWindowExporter,
    AvaloniaUserControlExporter,
    AvaloniaProjectExporter,
    createAvaloniaExporter,
    generateAsciiTheme,
    ASCII_COLORS,
    ASCII_FONTS
} from './exporters/avalonia/index.js';

// ==========================================
// DIALOG STATE
// ==========================================

const defaultDialogState = {
    exportType: 'xaml',          // xaml, window, usercontrol, project
    namespace: 'MyApp',
    className: 'MainView',
    generateCodeBehind: true,
    generateViewModel: true,
    generateTheme: true,
    useResourceDictionary: true,
    rootElement: 'Canvas',
    includeComments: true,
    preservePositions: true,
    theme: 'dark',
    customColors: false,
    // Enhanced options
    includeEffects: true,
    includeTransforms: true,
    includeGradients: true,
    generateStyles: true,
    useAvaloniaStyles: true,
    optimizeOutput: true,
    indentSize: 4,
    useTabs: false
};

let dialogState = { ...defaultDialogState };

// ==========================================
// AVALONIA EXPORT DIALOG CLASS
// ==========================================

/**
 * Specialized dialog for Avalonia XAML export
 */
export class AvaloniaExportDialog {
    constructor() {
        this.dialogEl = null;
        this.backdropEl = null;
        this.document = null;
        this.previewContent = null;
        this._resolve = null;
        this._reject = null;
    }
    
    // ==========================================
    // PUBLIC API
    // ==========================================
    
    /**
     * Show the export dialog
     * @param {object} document - Document to export (layers, canvas data)
     * @param {object} options - Initial options
     * @returns {Promise<object>} Export result
     */
    async show(document, options = {}) {
        this.document = document;
        
        // Reset state with any provided options
        dialogState = {
            ...defaultDialogState,
            ...options
        };
        
        // Create and show dialog
        this._createDialog();
        this._updatePreview();
        
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    
    /**
     * Close the dialog
     */
    close() {
        if (this.backdropEl) {
            this.backdropEl.remove();
        }
        this.backdropEl = null;
        this.dialogEl = null;
    }
    
    // ==========================================
    // DIALOG CREATION
    // ==========================================
    
    /**
     * Create the dialog UI
     * @private
     */
    _createDialog() {
        // Create backdrop
        this.backdropEl = createElement('div', { class: 'avalonia-export-backdrop' });
        
        // Create dialog container
        this.dialogEl = createElement('div', { class: 'avalonia-export-dialog' });
        
        this.dialogEl.innerHTML = `
            <div class="dialog-header">
                <h2>Export to Avalonia</h2>
                <button class="dialog-close" title="Close">✕</button>
            </div>
            
            <div class="dialog-body">
                <div class="export-layout">
                    <!-- Left Panel: Options -->
                    <div class="export-options-panel">
                        <div class="option-group">
                            <h3>Export Type</h3>
                            <div class="export-type-selector">
                                <label class="radio-option">
                                    <input type="radio" name="exportType" value="xaml" ${dialogState.exportType === 'xaml' ? 'checked' : ''}>
                                    <span class="radio-label">XAML Document</span>
                                    <span class="radio-desc">Plain XAML file</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="exportType" value="window" ${dialogState.exportType === 'window' ? 'checked' : ''}>
                                    <span class="radio-label">Window</span>
                                    <span class="radio-desc">Full Avalonia Window</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="exportType" value="usercontrol" ${dialogState.exportType === 'usercontrol' ? 'checked' : ''}>
                                    <span class="radio-label">UserControl</span>
                                    <span class="radio-desc">Reusable control</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="exportType" value="project" ${dialogState.exportType === 'project' ? 'checked' : ''}>
                                    <span class="radio-label">Full Project</span>
                                    <span class="radio-desc">Complete project files</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="option-group">
                            <h3>Naming</h3>
                            <div class="option-row">
                                <label>Namespace:</label>
                                <input type="text" id="opt-namespace" value="${dialogState.namespace}" placeholder="MyApp">
                            </div>
                            <div class="option-row">
                                <label>Class Name:</label>
                                <input type="text" id="opt-classname" value="${dialogState.className}" placeholder="MainView">
                            </div>
                        </div>
                        
                        <div class="option-group">
                            <h3>Root Element</h3>
                            <select id="opt-root-element">
                                <option value="Canvas" ${dialogState.rootElement === 'Canvas' ? 'selected' : ''}>Canvas</option>
                                <option value="Grid" ${dialogState.rootElement === 'Grid' ? 'selected' : ''}>Grid</option>
                                <option value="StackPanel" ${dialogState.rootElement === 'StackPanel' ? 'selected' : ''}>StackPanel</option>
                                <option value="DockPanel" ${dialogState.rootElement === 'DockPanel' ? 'selected' : ''}>DockPanel</option>
                                <option value="Panel" ${dialogState.rootElement === 'Panel' ? 'selected' : ''}>Panel</option>
                            </select>
                        </div>
                        
                        <div class="option-group">
                            <h3>Code Generation</h3>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-codebehind" ${dialogState.generateCodeBehind ? 'checked' : ''}>
                                <span>Generate code-behind (.axaml.cs)</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-viewmodel" ${dialogState.generateViewModel ? 'checked' : ''}>
                                <span>Generate ViewModel</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-theme" ${dialogState.generateTheme ? 'checked' : ''}>
                                <span>Generate ASCII theme</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-resources" ${dialogState.useResourceDictionary ? 'checked' : ''}>
                                <span>Use ResourceDictionary</span>
                            </label>
                        </div>
                        
                        <div class="option-group">
                            <h3>Output Options</h3>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-comments" ${dialogState.includeComments ? 'checked' : ''}>
                                <span>Include comments</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-positions" ${dialogState.preservePositions ? 'checked' : ''}>
                                <span>Preserve positions</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-optimize" ${dialogState.optimizeOutput ? 'checked' : ''}>
                                <span>Optimize output</span>
                            </label>
                        </div>
                        
                        <div class="option-group">
                            <h3>Visual Properties</h3>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-effects" ${dialogState.includeEffects ? 'checked' : ''}>
                                <span>Include effects (shadows, blur)</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-transforms" ${dialogState.includeTransforms ? 'checked' : ''}>
                                <span>Include transforms</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-gradients" ${dialogState.includeGradients ? 'checked' : ''}>
                                <span>Include gradients</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-styles" ${dialogState.generateStyles ? 'checked' : ''}>
                                <span>Generate styles</span>
                            </label>
                        </div>
                        
                        <div class="option-group">
                            <h3>Formatting</h3>
                            <div class="option-row">
                                <label>Indent Size:</label>
                                <input type="number" id="opt-indent" value="${dialogState.indentSize}" min="1" max="8" style="width: 60px;">
                            </div>
                            <label class="checkbox-option">
                                <input type="checkbox" id="opt-tabs" ${dialogState.useTabs ? 'checked' : ''}>
                                <span>Use tabs instead of spaces</span>
                            </label>
                        </div>
                        
                        <div class="option-group">
                            <h3>Theme</h3>
                            <select id="opt-theme">
                                <option value="dark" ${dialogState.theme === 'dark' ? 'selected' : ''}>Dark (Default)</option>
                                <option value="light" ${dialogState.theme === 'light' ? 'selected' : ''}>Light</option>
                                <option value="midnight" ${dialogState.theme === 'midnight' ? 'selected' : ''}>Midnight</option>
                                <option value="solarized-dark" ${dialogState.theme === 'solarized-dark' ? 'selected' : ''}>Solarized Dark</option>
                                <option value="solarized-light" ${dialogState.theme === 'solarized-light' ? 'selected' : ''}>Solarized Light</option>
                                <option value="monokai" ${dialogState.theme === 'monokai' ? 'selected' : ''}>Monokai</option>
                                <option value="dracula" ${dialogState.theme === 'dracula' ? 'selected' : ''}>Dracula</option>
                                <option value="custom" ${dialogState.theme === 'custom' ? 'selected' : ''}>Custom...</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Right Panel: Preview -->
                    <div class="export-preview-panel">
                        <div class="preview-tabs">
                            <button class="preview-tab active" data-tab="xaml">XAML</button>
                            <button class="preview-tab" data-tab="codebehind">Code-Behind</button>
                            <button class="preview-tab" data-tab="viewmodel">ViewModel</button>
                            <button class="preview-tab" data-tab="theme">Theme</button>
                        </div>
                        <div class="preview-content" id="preview-content">
                            <pre><code><!-- Preview will appear here --></code></pre>
                        </div>
                        <div class="preview-info">
                            <span id="preview-filesize">0 bytes</span>
                            <span id="preview-elements">0 elements</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="dialog-footer">
                <div class="footer-info">
                    <span id="file-count">Files: 1</span>
                </div>
                <div class="footer-buttons">
                    <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
                    <button class="btn btn-secondary" id="btn-copy">Copy to Clipboard</button>
                    <button class="btn btn-primary" id="btn-export">Export</button>
                </div>
            </div>
        `;
        
        this.backdropEl.appendChild(this.dialogEl);
        document.body.appendChild(this.backdropEl);
        
        // Setup event listeners
        this._setupEventListeners();
    }
    
    /**
     * Setup dialog event listeners
     * @private
     */
    _setupEventListeners() {
        // Close button
        this.dialogEl.querySelector('.dialog-close').addEventListener('click', () => {
            this.close();
            if (this._reject) this._reject(new Error('Dialog cancelled'));
        });
        
        // Backdrop click
        this.backdropEl.addEventListener('click', (e) => {
            if (e.target === this.backdropEl) {
                this.close();
                if (this._reject) this._reject(new Error('Dialog cancelled'));
            }
        });
        
        // Export type radio buttons
        this.dialogEl.querySelectorAll('input[name="exportType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                dialogState.exportType = e.target.value;
                this._updateUI();
                this._updatePreview();
            });
        });
        
        // Text inputs
        this.dialogEl.querySelector('#opt-namespace').addEventListener('input', (e) => {
            dialogState.namespace = e.target.value;
            this._updatePreview();
        });
        
        this.dialogEl.querySelector('#opt-classname').addEventListener('input', (e) => {
            dialogState.className = e.target.value;
            this._updatePreview();
        });
        
        // Root element select
        this.dialogEl.querySelector('#opt-root-element').addEventListener('change', (e) => {
            dialogState.rootElement = e.target.value;
            this._updatePreview();
        });
        
        // Checkboxes
        const checkboxes = [
            { id: 'opt-codebehind', key: 'generateCodeBehind' },
            { id: 'opt-viewmodel', key: 'generateViewModel' },
            { id: 'opt-theme', key: 'generateTheme' },
            { id: 'opt-resources', key: 'useResourceDictionary' },
            { id: 'opt-comments', key: 'includeComments' },
            { id: 'opt-positions', key: 'preservePositions' },
            { id: 'opt-optimize', key: 'optimizeOutput' },
            { id: 'opt-effects', key: 'includeEffects' },
            { id: 'opt-transforms', key: 'includeTransforms' },
            { id: 'opt-gradients', key: 'includeGradients' },
            { id: 'opt-styles', key: 'generateStyles' },
            { id: 'opt-tabs', key: 'useTabs' }
        ];
        
        checkboxes.forEach(({ id, key }) => {
            const el = this.dialogEl.querySelector(`#${id}`);
            if (el) {
                el.addEventListener('change', (e) => {
                    dialogState[key] = e.target.checked;
                    this._updateUI();
                    this._updatePreview();
                });
            }
        });
        
        // Indent size input
        const indentEl = this.dialogEl.querySelector('#opt-indent');
        if (indentEl) {
            indentEl.addEventListener('change', (e) => {
                dialogState.indentSize = parseInt(e.target.value, 10) || 4;
                this._updatePreview();
            });
        }
        
        // Theme select
        this.dialogEl.querySelector('#opt-theme').addEventListener('change', (e) => {
            dialogState.theme = e.target.value;
            this._updatePreview();
        });
        
        // Preview tabs
        this.dialogEl.querySelectorAll('.preview-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.dialogEl.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._updatePreview(tab.dataset.tab);
            });
        });
        
        // Cancel button
        this.dialogEl.querySelector('#btn-cancel').addEventListener('click', () => {
            this.close();
            if (this._reject) this._reject(new Error('Export cancelled'));
        });
        
        // Copy to clipboard button
        this.dialogEl.querySelector('#btn-copy').addEventListener('click', () => {
            this._copyToClipboard();
        });
        
        // Export button
        this.dialogEl.querySelector('#btn-export').addEventListener('click', () => {
            this._doExport();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this._handleKeydown.bind(this));
    }
    
    /**
     * Handle keyboard shortcuts
     * @private
     */
    _handleKeydown(e) {
        if (!this.dialogEl) return;
        
        if (e.key === 'Escape') {
            this.close();
            if (this._reject) this._reject(new Error('Dialog cancelled'));
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            this._doExport();
        }
    }
    
    /**
     * Update UI based on current state
     * @private
     */
    _updateUI() {
        // Update file count based on options
        let fileCount = 1; // XAML always
        if (dialogState.generateCodeBehind) fileCount++;
        if (dialogState.generateViewModel) fileCount++;
        if (dialogState.generateTheme) fileCount++;
        
        if (dialogState.exportType === 'project') {
            fileCount += 2; // .csproj and Program.cs
        }
        
        this.dialogEl.querySelector('#file-count').textContent = `Files: ${fileCount}`;
        
        // Enable/disable tabs based on options
        const codebehindTab = this.dialogEl.querySelector('.preview-tab[data-tab="codebehind"]');
        const viewmodelTab = this.dialogEl.querySelector('.preview-tab[data-tab="viewmodel"]');
        const themeTab = this.dialogEl.querySelector('.preview-tab[data-tab="theme"]');
        
        codebehindTab.disabled = !dialogState.generateCodeBehind;
        viewmodelTab.disabled = !dialogState.generateViewModel;
        themeTab.disabled = !dialogState.generateTheme;
        
        codebehindTab.classList.toggle('disabled', !dialogState.generateCodeBehind);
        viewmodelTab.classList.toggle('disabled', !dialogState.generateViewModel);
        themeTab.classList.toggle('disabled', !dialogState.generateTheme);
    }
    
    /**
     * Update preview content
     * @private
     */
    _updatePreview(tab = null) {
        const activeTab = tab || this.dialogEl.querySelector('.preview-tab.active')?.dataset.tab || 'xaml';
        const previewEl = this.dialogEl.querySelector('#preview-content pre code');
        const fileSizeEl = this.dialogEl.querySelector('#preview-filesize');
        const elementsEl = this.dialogEl.querySelector('#preview-elements');
        
        try {
            const exporter = this._createExporter();
            let content = '';
            let elementCount = 0;
            
            switch (activeTab) {
                case 'xaml':
                    const result = exporter.export(this.document, this._getExportOptions());
                    content = result.content || result;
                    elementCount = this._countElements(content);
                    break;
                    
                case 'codebehind':
                    if (dialogState.generateCodeBehind) {
                        content = exporter.generateCodeBehind?.(dialogState.namespace, dialogState.className) || 
                                  this._generateBasicCodeBehind();
                    } else {
                        content = '// Code-behind generation disabled';
                    }
                    break;
                    
                case 'viewmodel':
                    if (dialogState.generateViewModel) {
                        content = exporter.generateViewModel?.(dialogState.namespace, dialogState.className + 'ViewModel') ||
                                  this._generateBasicViewModel();
                    } else {
                        content = '// ViewModel generation disabled';
                    }
                    break;
                    
                case 'theme':
                    if (dialogState.generateTheme) {
                        content = generateAsciiTheme(dialogState.theme);
                    } else {
                        content = '<!-- Theme generation disabled -->';
                    }
                    break;
            }
            
            // Syntax highlight and display
            previewEl.textContent = content;
            previewEl.className = activeTab === 'xaml' || activeTab === 'theme' ? 'language-xml' : 'language-csharp';
            
            // Update stats
            const bytes = new Blob([content]).size;
            fileSizeEl.textContent = this._formatBytes(bytes);
            elementsEl.textContent = elementCount > 0 ? `${elementCount} elements` : '';
            
            // Store preview content
            this.previewContent = content;
            
        } catch (error) {
            previewEl.textContent = `// Error generating preview: ${error.message}`;
            console.error('Preview error:', error);
        }
    }
    
    /**
     * Create appropriate exporter based on state
     * @private
     */
    _createExporter() {
        switch (dialogState.exportType) {
            case 'window':
                return new AvaloniaWindowExporter();
            case 'usercontrol':
                return new AvaloniaUserControlExporter();
            case 'project':
                return new AvaloniaProjectExporter();
            default:
                return new AvaloniaXamlExporter();
        }
    }
    
    /**
     * Get export options from current state
     * @private
     */
    _getExportOptions() {
        return {
            namespace: dialogState.namespace,
            className: dialogState.className,
            rootElement: dialogState.rootElement,
            includeComments: dialogState.includeComments,
            preservePositions: dialogState.preservePositions,
            generateCodeBehind: dialogState.generateCodeBehind,
            generateViewModel: dialogState.generateViewModel,
            generateTheme: dialogState.generateTheme,
            useResourceDictionary: dialogState.useResourceDictionary,
            theme: dialogState.theme,
            // Enhanced options
            includeEffects: dialogState.includeEffects,
            includeTransforms: dialogState.includeTransforms,
            includeGradients: dialogState.includeGradients,
            generateStyles: dialogState.generateStyles,
            optimizeOutput: dialogState.optimizeOutput,
            indentSize: dialogState.indentSize,
            useTabs: dialogState.useTabs,
            framework: 'avalonia',
            avaloniaVersion: 11
        };
    }
    
    /**
     * Generate basic code-behind file
     * @private
     */
    _generateBasicCodeBehind() {
        return `using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace ${dialogState.namespace};

public partial class ${dialogState.className} : ${dialogState.exportType === 'window' ? 'Window' : 'UserControl'}
{
    public ${dialogState.className}()
    {
        InitializeComponent();
${dialogState.generateViewModel ? `        DataContext = new ${dialogState.className}ViewModel();` : ''}
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }
}
`;
    }
    
    /**
     * Generate basic ViewModel
     * @private
     */
    _generateBasicViewModel() {
        return `using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace ${dialogState.namespace};

public class ${dialogState.className}ViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    protected bool SetField<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value)) return false;
        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }

    // Add your properties here
}
`;
    }
    
    /**
     * Count XAML elements in content
     * @private
     */
    _countElements(content) {
        const matches = content.match(/<[A-Z][^/>]*/g);
        return matches ? matches.length : 0;
    }
    
    /**
     * Format bytes to human readable
     * @private
     */
    _formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} bytes`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    
    /**
     * Copy preview to clipboard
     * @private
     */
    async _copyToClipboard() {
        if (!this.previewContent) return;
        
        try {
            await navigator.clipboard.writeText(this.previewContent);
            this._showNotification('Copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            this._showNotification('Copy failed', 'error');
        }
    }
    
    /**
     * Perform the export
     * @private
     */
    _doExport() {
        try {
            const exporter = this._createExporter();
            const options = this._getExportOptions();
            const result = exporter.export(this.document, options);
            
            // Collect all files to export
            const files = [];
            const baseFileName = dialogState.className;
            
            // Main XAML file
            const xamlContent = result.content || result;
            const xamlExt = dialogState.exportType === 'xaml' ? '.xaml' : '.axaml';
            files.push({
                name: `${baseFileName}${xamlExt}`,
                content: xamlContent,
                mimeType: 'application/xml'
            });
            
            // Code-behind
            if (dialogState.generateCodeBehind) {
                const codeBehind = exporter.generateCodeBehind?.(dialogState.namespace, dialogState.className) ||
                                   this._generateBasicCodeBehind();
                files.push({
                    name: `${baseFileName}${xamlExt}.cs`,
                    content: codeBehind,
                    mimeType: 'text/plain'
                });
            }
            
            // ViewModel
            if (dialogState.generateViewModel) {
                const viewModel = exporter.generateViewModel?.(dialogState.namespace, dialogState.className + 'ViewModel') ||
                                  this._generateBasicViewModel();
                files.push({
                    name: `${baseFileName}ViewModel.cs`,
                    content: viewModel,
                    mimeType: 'text/plain'
                });
            }
            
            // Theme
            if (dialogState.generateTheme) {
                const theme = generateAsciiTheme(dialogState.theme);
                files.push({
                    name: 'AsciiTheme.axaml',
                    content: theme,
                    mimeType: 'application/xml'
                });
            }
            
            // Project files (for project export type)
            if (dialogState.exportType === 'project') {
                files.push(...this._generateProjectFiles());
            }
            
            // Download files
            if (files.length === 1) {
                // Single file download
                this._downloadFile(files[0]);
            } else {
                // Multiple files - create ZIP or download individually
                this._downloadMultipleFiles(files);
            }
            
            this.close();
            if (this._resolve) {
                this._resolve({ success: true, files });
            }
            
        } catch (error) {
            console.error('Export failed:', error);
            this._showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
    
    /**
     * Generate additional project files
     * @private
     */
    _generateProjectFiles() {
        const files = [];
        
        // .csproj file
        files.push({
            name: `${dialogState.namespace}.csproj`,
            content: `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <BuiltInComInteropSupport>true</BuiltInComInteropSupport>
    <ApplicationManifest>app.manifest</ApplicationManifest>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Avalonia" Version="11.0.0" />
    <PackageReference Include="Avalonia.Desktop" Version="11.0.0" />
    <PackageReference Include="Avalonia.Themes.Fluent" Version="11.0.0" />
    <PackageReference Include="Avalonia.Fonts.Inter" Version="11.0.0" />
  </ItemGroup>
</Project>`,
            mimeType: 'application/xml'
        });
        
        // Program.cs
        files.push({
            name: 'Program.cs',
            content: `using System;
using Avalonia;

namespace ${dialogState.namespace};

class Program
{
    [STAThread]
    public static void Main(string[] args) => BuildAvaloniaApp()
        .StartWithClassicDesktopLifetime(args);

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()
            .WithInterFont()
            .LogToTrace();
}`,
            mimeType: 'text/plain'
        });
        
        // App.axaml
        files.push({
            name: 'App.axaml',
            content: `<Application xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             x:Class="${dialogState.namespace}.App">
    <Application.Styles>
        <FluentTheme />
        <StyleInclude Source="avares://${dialogState.namespace}/AsciiTheme.axaml"/>
    </Application.Styles>
</Application>`,
            mimeType: 'application/xml'
        });
        
        // App.axaml.cs
        files.push({
            name: 'App.axaml.cs',
            content: `using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;

namespace ${dialogState.namespace};

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
            desktop.MainWindow = new ${dialogState.className}();
        }

        base.OnFrameworkInitializationCompleted();
    }
}`,
            mimeType: 'text/plain'
        });
        
        return files;
    }
    
    /**
     * Download a single file
     * @private
     */
    _downloadFile(file) {
        const blob = new Blob([file.content], { type: file.mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Download multiple files (offers ZIP or individual)
     * @private
     */
    _downloadMultipleFiles(files) {
        // For simplicity, download files individually
        // In a production app, you'd use JSZip or similar
        files.forEach((file, index) => {
            setTimeout(() => {
                this._downloadFile(file);
            }, index * 500); // Stagger downloads
        });
        
        this._showNotification(`Downloading ${files.length} files...`);
    }
    
    /**
     * Show notification message
     * @private
     */
    _showNotification(message, type = 'success') {
        const notification = createElement('div', {
            class: `export-notification ${type}`
        }, message);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// ==========================================
// CONVENIENCE FUNCTIONS
// ==========================================

/**
 * Show Avalonia export dialog
 * @param {object} document - Document to export
 * @param {string} type - Export type (xaml, window, usercontrol, project)
 * @param {object} options - Additional options
 * @returns {Promise<object>} Export result
 */
export async function showAvaloniaExportDialog(document, type = 'xaml', options = {}) {
    const dialog = new AvaloniaExportDialog();
    return dialog.show(document, { exportType: type, ...options });
}

/**
 * Quick export to Avalonia without dialog
 * @param {object} document - Document to export
 * @param {string} type - Export type
 * @param {object} options - Export options
 * @returns {object} Export result with files
 */
export function quickAvaloniaExport(document, type = 'xaml', options = {}) {
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
    
    return exporter.export(document, options);
}

export default AvaloniaExportDialog;
