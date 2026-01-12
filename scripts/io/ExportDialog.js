/**
 * Asciistrator - Export Dialog
 * 
 * User interface for the extensible export system.
 * Provides format selection, options configuration, and preview.
 * 
 * @version 1.0.0
 */

import { exportManager, ExportCategory } from './ExportManager.js';
import { createDialog } from '../ui/dialogs.js';

// ==========================================
// EXPORT DIALOG STATE
// ==========================================

/**
 * Export dialog state
 */
const dialogState = {
    selectedFormat: 'text',
    options: {},
    previewContent: null,
    isExporting: false
};

// ==========================================
// EXPORT DIALOG CLASS
// ==========================================

/**
 * Export dialog for selecting format and options
 */
export class ExportDialog {
    constructor() {
        this.dialog = null;
        this.document = null;
        this.onExport = null;
        this._initialized = false;
    }
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    /**
     * Initialize the export manager if needed
     */
    _ensureInitialized() {
        if (!exportManager.isInitialized) {
            exportManager.initialize();
        }
        this._initialized = true;
    }
    
    // ==========================================
    // DIALOG CREATION
    // ==========================================
    
    /**
     * Show export dialog
     * @param {object} document - Document to export
     * @param {object} options - Dialog options
     * @returns {Promise<void>}
     */
    async show(document, options = {}) {
        this._ensureInitialized();
        this.document = document;
        this.onExport = options.onExport;
        
        const content = this._createDialogContent();
        
        this.dialog = createDialog({
            title: 'Export',
            content,
            width: 600,
            height: 500,
            buttons: [
                { text: 'Cancel', action: 'cancel' },
                { text: 'Preview', action: 'preview', secondary: true },
                { text: 'Export', action: 'export', primary: true }
            ],
            onAction: (action) => this._handleAction(action),
            onClose: () => this._cleanup()
        });
        
        // Initialize format list
        this._updateFormatList();
        this._updateOptions();
        
        return this.dialog.show();
    }
    
    /**
     * Create dialog content
     * @private
     */
    _createDialogContent() {
        const container = document.createElement('div');
        container.className = 'export-dialog';
        
        container.innerHTML = `
            <div class="export-dialog-layout">
                <div class="export-sidebar">
                    <div class="export-categories">
                        <label>Category:</label>
                        <select id="export-category">
                            <option value="all">All Formats</option>
                            <option value="${ExportCategory.PlainText}">Plain Text</option>
                            <option value="${ExportCategory.RichText}">Rich Text</option>
                            <option value="${ExportCategory.Image}">Image</option>
                            <option value="${ExportCategory.Vector}">Vector</option>
                            <option value="${ExportCategory.Document}">Document</option>
                            <option value="${ExportCategory.UIFramework}">UI Frameworks</option>
                            <option value="${ExportCategory.WebFramework}">Web Frameworks</option>
                        </select>
                    </div>
                    <div class="export-format-list" id="export-format-list">
                        <!-- Format items populated dynamically -->
                    </div>
                </div>
                <div class="export-main">
                    <div class="export-format-info" id="export-format-info">
                        <h3 id="export-format-name">Select a format</h3>
                        <p id="export-format-desc">Choose an export format from the list.</p>
                        <div class="export-format-details">
                            <span class="export-format-ext" id="export-format-ext"></span>
                            <span class="export-format-category" id="export-format-category"></span>
                        </div>
                    </div>
                    <div class="export-options" id="export-options">
                        <!-- Options populated dynamically -->
                    </div>
                    <div class="export-preview" id="export-preview">
                        <label>Preview:</label>
                        <div class="export-preview-content" id="export-preview-content">
                            <span class="placeholder">Click Preview to see output</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        const categorySelect = container.querySelector('#export-category');
        categorySelect.addEventListener('change', () => this._updateFormatList());
        
        return container;
    }
    
    /**
     * Create CSS styles for dialog
     * @private
     */
    _getDialogStyles() {
        return `
            .export-dialog-layout {
                display: flex;
                height: 100%;
                gap: 16px;
            }
            
            .export-sidebar {
                width: 200px;
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .export-categories select {
                width: 100%;
                padding: 8px;
                border-radius: 4px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
            }
            
            .export-format-list {
                flex: 1;
                overflow-y: auto;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--bg-secondary);
            }
            
            .export-format-item {
                padding: 10px 12px;
                cursor: pointer;
                border-bottom: 1px solid var(--border-color);
                transition: background 0.15s;
            }
            
            .export-format-item:hover {
                background: var(--bg-hover);
            }
            
            .export-format-item.selected {
                background: var(--accent-color);
                color: white;
            }
            
            .export-format-item .format-name {
                font-weight: 500;
            }
            
            .export-format-item .format-ext {
                font-size: 11px;
                opacity: 0.7;
            }
            
            .export-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .export-format-info {
                padding: 12px;
                background: var(--bg-secondary);
                border-radius: 4px;
            }
            
            .export-format-info h3 {
                margin: 0 0 4px 0;
                font-size: 16px;
            }
            
            .export-format-info p {
                margin: 0 0 8px 0;
                font-size: 13px;
                opacity: 0.8;
            }
            
            .export-format-details {
                display: flex;
                gap: 12px;
                font-size: 12px;
            }
            
            .export-format-details span {
                padding: 2px 8px;
                background: var(--bg-tertiary);
                border-radius: 3px;
            }
            
            .export-options {
                padding: 12px;
                background: var(--bg-secondary);
                border-radius: 4px;
            }
            
            .export-option {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            
            .export-option label {
                flex: 1;
            }
            
            .export-option input[type="checkbox"] {
                width: 16px;
                height: 16px;
            }
            
            .export-option input[type="text"],
            .export-option input[type="number"],
            .export-option select {
                width: 150px;
                padding: 4px 8px;
                border-radius: 3px;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
                color: var(--text-primary);
            }
            
            .export-preview {
                flex: 1;
                min-height: 100px;
                display: flex;
                flex-direction: column;
            }
            
            .export-preview label {
                margin-bottom: 8px;
                font-weight: 500;
            }
            
            .export-preview-content {
                flex: 1;
                overflow: auto;
                padding: 8px;
                background: var(--bg-secondary);
                border-radius: 4px;
                font-family: monospace;
                font-size: 11px;
                white-space: pre;
            }
            
            .export-preview-content .placeholder {
                opacity: 0.5;
                font-style: italic;
            }
        `;
    }
    
    // ==========================================
    // FORMAT LIST
    // ==========================================
    
    /**
     * Update format list based on selected category
     * @private
     */
    _updateFormatList() {
        const categorySelect = this.dialog.element.querySelector('#export-category');
        const formatList = this.dialog.element.querySelector('#export-format-list');
        const selectedCategory = categorySelect.value;
        
        let exporters;
        if (selectedCategory === 'all') {
            exporters = exportManager.getAllExporters();
        } else {
            exporters = exportManager.getExportersByCategory(selectedCategory);
        }
        
        formatList.innerHTML = '';
        
        for (const exporter of exporters) {
            const item = document.createElement('div');
            item.className = 'export-format-item';
            if (exporter.id === dialogState.selectedFormat) {
                item.classList.add('selected');
            }
            
            item.innerHTML = `
                <div class="format-name">${exporter.name}</div>
                <div class="format-ext">${exporter.fileExtension}</div>
            `;
            
            item.addEventListener('click', () => {
                this._selectFormat(exporter.id);
            });
            
            formatList.appendChild(item);
        }
        
        // Select first if current selection not in list
        if (!exporters.find(e => e.id === dialogState.selectedFormat) && exporters.length > 0) {
            this._selectFormat(exporters[0].id);
        }
    }
    
    /**
     * Select a format
     * @private
     */
    _selectFormat(formatId) {
        dialogState.selectedFormat = formatId;
        
        // Update selection UI
        const items = this.dialog.element.querySelectorAll('.export-format-item');
        items.forEach(item => item.classList.remove('selected'));
        
        const selectedItem = Array.from(items).find(item => 
            item.querySelector('.format-name').textContent === 
            exportManager.getExporter(formatId)?.name
        );
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        // Update format info
        this._updateFormatInfo();
        
        // Update options
        this._updateOptions();
        
        // Clear preview
        this._clearPreview();
    }
    
    /**
     * Update format info display
     * @private
     */
    _updateFormatInfo() {
        const exporter = exportManager.getExporter(dialogState.selectedFormat);
        if (!exporter) return;
        
        const nameEl = this.dialog.element.querySelector('#export-format-name');
        const descEl = this.dialog.element.querySelector('#export-format-desc');
        const extEl = this.dialog.element.querySelector('#export-format-ext');
        const catEl = this.dialog.element.querySelector('#export-format-category');
        
        nameEl.textContent = exporter.name;
        descEl.textContent = exporter.description;
        extEl.textContent = exporter.fileExtension;
        catEl.textContent = exporter.category;
    }
    
    // ==========================================
    // OPTIONS
    // ==========================================
    
    /**
     * Update options panel for selected format
     * @private
     */
    _updateOptions() {
        const exporter = exportManager.getExporter(dialogState.selectedFormat);
        if (!exporter) return;
        
        const optionsEl = this.dialog.element.querySelector('#export-options');
        const defaultOptions = exporter.defaultOptions;
        
        // Reset stored options
        dialogState.options = { ...defaultOptions };
        
        optionsEl.innerHTML = '<label style="font-weight: 500; margin-bottom: 8px; display: block;">Options:</label>';
        
        // Generate option controls
        for (const [key, value] of Object.entries(defaultOptions)) {
            // Skip internal options
            if (key.startsWith('_')) continue;
            
            const optionEl = document.createElement('div');
            optionEl.className = 'export-option';
            
            const label = document.createElement('label');
            label.textContent = this._formatOptionName(key);
            optionEl.appendChild(label);
            
            const input = this._createOptionInput(key, value);
            optionEl.appendChild(input);
            
            optionsEl.appendChild(optionEl);
        }
    }
    
    /**
     * Format option name for display
     * @private
     */
    _formatOptionName(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
    
    /**
     * Create input element for option
     * @private
     */
    _createOptionInput(key, value) {
        let input;
        
        if (typeof value === 'boolean') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = value;
            input.addEventListener('change', () => {
                dialogState.options[key] = input.checked;
            });
        } else if (typeof value === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.value = value;
            input.addEventListener('change', () => {
                dialogState.options[key] = parseFloat(input.value) || 0;
            });
        } else if (Array.isArray(value)) {
            input = document.createElement('select');
            for (const option of value) {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                input.appendChild(opt);
            }
            input.addEventListener('change', () => {
                dialogState.options[key] = input.value;
            });
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = value || '';
            input.addEventListener('change', () => {
                dialogState.options[key] = input.value;
            });
        }
        
        return input;
    }
    
    // ==========================================
    // PREVIEW
    // ==========================================
    
    /**
     * Generate preview
     * @private
     */
    _generatePreview() {
        const previewEl = this.dialog.element.querySelector('#export-preview-content');
        
        try {
            const preview = exportManager.preview(
                this.document,
                dialogState.selectedFormat,
                dialogState.options
            );
            
            if (preview) {
                previewEl.textContent = preview.substring(0, 5000);
                if (preview.length > 5000) {
                    previewEl.textContent += '\n\n... (truncated)';
                }
            } else {
                previewEl.innerHTML = '<span class="placeholder">No preview available</span>';
            }
        } catch (error) {
            previewEl.innerHTML = `<span style="color: var(--error-color);">Preview error: ${error.message}</span>`;
        }
    }
    
    /**
     * Clear preview
     * @private
     */
    _clearPreview() {
        const previewEl = this.dialog.element.querySelector('#export-preview-content');
        previewEl.innerHTML = '<span class="placeholder">Click Preview to see output</span>';
    }
    
    // ==========================================
    // ACTIONS
    // ==========================================
    
    /**
     * Handle dialog action
     * @private
     */
    async _handleAction(action) {
        switch (action) {
            case 'cancel':
                this.dialog.close();
                break;
                
            case 'preview':
                this._generatePreview();
                break;
                
            case 'export':
                await this._doExport();
                break;
        }
    }
    
    /**
     * Perform export
     * @private
     */
    async _doExport() {
        if (dialogState.isExporting) return;
        
        dialogState.isExporting = true;
        
        try {
            const exporter = exportManager.getExporter(dialogState.selectedFormat);
            const filename = `export${exporter.fileExtension}`;
            
            await exportManager.exportToFile(
                this.document,
                dialogState.selectedFormat,
                filename,
                dialogState.options
            );
            
            if (this.onExport) {
                this.onExport({
                    format: dialogState.selectedFormat,
                    filename,
                    options: dialogState.options
                });
            }
            
            this.dialog.close();
        } catch (error) {
            console.error('Export failed:', error);
            // Show error in dialog
            const previewEl = this.dialog.element.querySelector('#export-preview-content');
            previewEl.innerHTML = `<span style="color: var(--error-color);">Export failed: ${error.message}</span>`;
        } finally {
            dialogState.isExporting = false;
        }
    }
    
    /**
     * Cleanup
     * @private
     */
    _cleanup() {
        this.dialog = null;
        this.document = null;
        this.onExport = null;
    }
}

// ==========================================
// QUICK EXPORT FUNCTIONS
// ==========================================

/**
 * Show export dialog
 * @param {object} document - Document to export
 * @param {object} options - Dialog options
 * @returns {Promise<void>}
 */
export async function showExportDialog(document, options = {}) {
    const dialog = new ExportDialog();
    return dialog.show(document, options);
}

/**
 * Quick export to format without dialog
 * @param {object} document - Document to export
 * @param {string} formatId - Export format ID
 * @param {string} filename - Output filename
 * @param {object} options - Export options
 */
export async function quickExport(document, formatId, filename = null, options = {}) {
    if (!exportManager.isInitialized) {
        exportManager.initialize();
    }
    
    return exportManager.exportToFile(document, formatId, filename, options);
}

/**
 * Get export string without download
 * @param {object} document - Document to export
 * @param {string} formatId - Export format ID
 * @param {object} options - Export options
 * @returns {ExportResult}
 */
export function getExportString(document, formatId, options = {}) {
    if (!exportManager.isInitialized) {
        exportManager.initialize();
    }
    
    return exportManager.export(document, formatId, options);
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    ExportDialog,
    showExportDialog,
    quickExport,
    getExportString
};
