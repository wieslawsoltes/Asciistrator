/**
 * Asciistrator - Dialog System
 * 
 * Modal dialog framework for application dialogs.
 */

import { EventEmitter } from '../utils/events.js';

// ==========================================
// DIALOG BUTTON
// ==========================================

/**
 * DialogButton - Button configuration for dialogs
 */
export class DialogButton {
    /**
     * Create a dialog button
     * @param {object} options
     */
    constructor(options = {}) {
        /** @type {string} Button identifier */
        this.id = options.id || 'button';
        
        /** @type {string} Button label */
        this.label = options.label || 'OK';
        
        /** @type {string} Button type: 'default', 'primary', 'danger' */
        this.type = options.type || 'default';
        
        /** @type {boolean} Is button enabled */
        this.enabled = options.enabled !== false;
        
        /** @type {boolean} Close dialog when clicked */
        this.closeDialog = options.closeDialog !== false;
        
        /** @type {Function} Click callback */
        this.onClick = options.onClick || null;
    }

    /**
     * Create standard OK button
     * @returns {DialogButton}
     */
    static ok(onClick) {
        return new DialogButton({
            id: 'ok',
            label: 'OK',
            type: 'primary',
            onClick
        });
    }

    /**
     * Create standard Cancel button
     * @returns {DialogButton}
     */
    static cancel(onClick) {
        return new DialogButton({
            id: 'cancel',
            label: 'Cancel',
            type: 'default',
            onClick
        });
    }

    /**
     * Create standard Yes button
     * @returns {DialogButton}
     */
    static yes(onClick) {
        return new DialogButton({
            id: 'yes',
            label: 'Yes',
            type: 'primary',
            onClick
        });
    }

    /**
     * Create standard No button
     * @returns {DialogButton}
     */
    static no(onClick) {
        return new DialogButton({
            id: 'no',
            label: 'No',
            type: 'default',
            onClick
        });
    }

    /**
     * Create standard Delete button
     * @returns {DialogButton}
     */
    static delete(onClick) {
        return new DialogButton({
            id: 'delete',
            label: 'Delete',
            type: 'danger',
            onClick
        });
    }
}

// ==========================================
// DIALOG
// ==========================================

/**
 * Dialog - Modal dialog base class
 */
export class Dialog extends EventEmitter {
    /**
     * Create a dialog
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Dialog identifier */
        this.id = options.id || `dialog_${Date.now()}`;
        
        /** @type {string} Dialog title */
        this.title = options.title || 'Dialog';
        
        /** @type {string} Dialog icon */
        this.icon = options.icon || '';
        
        /** @type {string|HTMLElement} Dialog content */
        this.content = options.content || '';
        
        /** @type {number} Dialog width */
        this.width = options.width || 400;
        
        /** @type {number} Dialog height (auto if not set) */
        this.height = options.height || null;
        
        /** @type {Array<DialogButton>} Dialog buttons */
        this.buttons = options.buttons || [];
        
        /** @type {boolean} Show close button */
        this.showClose = options.showClose !== false;
        
        /** @type {boolean} Close on overlay click */
        this.closeOnOverlay = options.closeOnOverlay !== false;
        
        /** @type {boolean} Close on Escape key */
        this.closeOnEscape = options.closeOnEscape !== false;
        
        /** @type {boolean} Is dialog modal */
        this.modal = options.modal !== false;
        
        /** @type {boolean} Is dialog draggable */
        this.draggable = options.draggable !== false;
        
        /** @type {boolean} Is dialog resizable */
        this.resizable = options.resizable || false;
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
        
        /** @type {HTMLElement|null} Overlay element */
        this.overlay = null;
        
        /** @type {HTMLElement|null} Content element */
        this.contentElement = null;
        
        /** @type {boolean} Is dialog open */
        this.isOpen = false;
        
        /** @type {Function} Keydown handler */
        this._keyHandler = null;
        
        /** @type {*} Result value */
        this.result = null;
    }

    /**
     * Render dialog content (override in subclasses)
     * @returns {string|HTMLElement}
     */
    renderContent() {
        return this.content;
    }

    /**
     * Validate dialog (override in subclasses)
     * @returns {boolean}
     */
    validate() {
        return true;
    }

    /**
     * Get dialog data (override in subclasses)
     * @returns {object}
     */
    getData() {
        return {};
    }

    /**
     * Render dialog
     * @returns {HTMLElement}
     */
    render() {
        // Overlay
        if (this.modal) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'dialog-overlay';
            
            if (this.closeOnOverlay) {
                this.overlay.addEventListener('click', () => this.close());
            }
        }

        // Dialog container
        this.element = document.createElement('div');
        this.element.className = 'dialog';
        this.element.setAttribute('data-id', this.id);
        this.element.style.width = `${this.width}px`;
        
        if (this.height) {
            this.element.style.height = `${this.height}px`;
        }

        // Header
        const header = document.createElement('div');
        header.className = 'dialog-header';

        const titleEl = document.createElement('div');
        titleEl.className = 'dialog-title';

        if (this.icon) {
            const iconEl = document.createElement('span');
            iconEl.className = 'dialog-icon';
            iconEl.textContent = this.icon;
            titleEl.appendChild(iconEl);
        }

        const titleText = document.createElement('span');
        titleText.textContent = this.title;
        titleEl.appendChild(titleText);

        header.appendChild(titleEl);

        if (this.showClose) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'dialog-close';
            closeBtn.innerHTML = '×';
            closeBtn.title = 'Close';
            closeBtn.addEventListener('click', () => this.close());
            header.appendChild(closeBtn);
        }

        this.element.appendChild(header);

        // Content
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'dialog-content';
        
        const renderedContent = this.renderContent();
        if (typeof renderedContent === 'string') {
            this.contentElement.innerHTML = renderedContent;
        } else if (renderedContent instanceof HTMLElement) {
            this.contentElement.appendChild(renderedContent);
        }

        this.element.appendChild(this.contentElement);

        // Footer with buttons
        if (this.buttons.length > 0) {
            const footer = document.createElement('div');
            footer.className = 'dialog-footer';

            for (const btn of this.buttons) {
                const btnEl = document.createElement('button');
                btnEl.className = `dialog-button dialog-button-${btn.type}`;
                btnEl.textContent = btn.label;
                btnEl.disabled = !btn.enabled;

                btnEl.addEventListener('click', () => {
                    if (btn.onClick) {
                        btn.onClick(this);
                    }
                    this.emit('buttonClick', btn);
                    
                    if (btn.closeDialog) {
                        this.result = btn.id;
                        this.close();
                    }
                });

                footer.appendChild(btnEl);
            }

            this.element.appendChild(footer);
        }

        // Draggable
        if (this.draggable) {
            this._bindDrag(header);
        }

        // Resizable
        if (this.resizable) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'dialog-resize';
            this.element.appendChild(resizeHandle);
            this._bindResize(resizeHandle);
        }

        return this.element;
    }

    /**
     * Bind drag functionality
     * @private
     */
    _bindDrag(header) {
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;

        header.style.cursor = 'move';

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.dialog-close')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = this.element.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            this.element.classList.add('dragging');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            this.element.style.left = `${startLeft + dx}px`;
            this.element.style.top = `${startTop + dy}px`;
            this.element.style.transform = 'none';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.element.classList.remove('dragging');
            }
        });
    }

    /**
     * Bind resize functionality
     * @private
     */
    _bindResize(handle) {
        let isResizing = false;
        let startX, startY;
        let startWidth, startHeight;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = this.element.offsetWidth;
            startHeight = this.element.offsetHeight;

            this.element.classList.add('resizing');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            this.width = Math.max(200, startWidth + dx);
            this.height = Math.max(100, startHeight + dy);

            this.element.style.width = `${this.width}px`;
            this.element.style.height = `${this.height}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                this.element.classList.remove('resizing');
            }
        });
    }

    /**
     * Open dialog
     * @returns {Promise<*>} Resolves with result when dialog closes
     */
    open() {
        return new Promise((resolve) => {
            if (this.isOpen) {
                resolve(this.result);
                return;
            }

            this.render();

            if (this.overlay) {
                document.body.appendChild(this.overlay);
            }
            document.body.appendChild(this.element);

            // Center dialog
            this._center();

            // Keyboard handler
            this._keyHandler = (e) => {
                if (e.key === 'Escape' && this.closeOnEscape) {
                    this.close();
                }
            };
            document.addEventListener('keydown', this._keyHandler);

            this.isOpen = true;
            this.emit('open');

            // Focus first input
            const firstInput = this.element.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 0);
            }

            // Store resolve for close
            this._resolve = resolve;
        });
    }

    /**
     * Center dialog in viewport
     * @private
     */
    _center() {
        const rect = this.element.getBoundingClientRect();
        this.element.style.left = `${(window.innerWidth - rect.width) / 2}px`;
        this.element.style.top = `${(window.innerHeight - rect.height) / 2}px`;
        this.element.style.transform = 'none';
    }

    /**
     * Close dialog
     */
    close() {
        if (!this.isOpen) return;

        document.removeEventListener('keydown', this._keyHandler);

        this.overlay?.remove();
        this.element?.remove();

        this.isOpen = false;
        this.emit('close', this.result);

        if (this._resolve) {
            this._resolve(this.result);
            this._resolve = null;
        }
    }

    /**
     * Refresh dialog content
     */
    refresh() {
        if (this.contentElement) {
            this.contentElement.innerHTML = '';
            const renderedContent = this.renderContent();
            if (typeof renderedContent === 'string') {
                this.contentElement.innerHTML = renderedContent;
            } else if (renderedContent instanceof HTMLElement) {
                this.contentElement.appendChild(renderedContent);
            }
        }
    }
}

// ==========================================
// ALERT DIALOG
// ==========================================

/**
 * AlertDialog - Simple alert message dialog
 */
export class AlertDialog extends Dialog {
    /**
     * Create an alert dialog
     * @param {object} options
     */
    constructor(options = {}) {
        super({
            title: options.title || 'Alert',
            icon: options.icon || 'ℹ️',
            content: options.message || '',
            width: options.width || 350,
            buttons: [
                DialogButton.ok()
            ],
            ...options
        });
        
        /** @type {string} Alert message */
        this.message = options.message || '';
        
        /** @type {string} Alert type: 'info', 'warning', 'error', 'success' */
        this.alertType = options.alertType || 'info';
    }

    renderContent() {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            success: '✅'
        };

        return `
            <div class="alert-dialog alert-${this.alertType}">
                <div class="alert-icon">${icons[this.alertType] || icons.info}</div>
                <div class="alert-message">${this.message}</div>
            </div>
        `;
    }
}

// ==========================================
// CONFIRM DIALOG
// ==========================================

/**
 * ConfirmDialog - Confirmation dialog
 */
export class ConfirmDialog extends Dialog {
    /**
     * Create a confirm dialog
     * @param {object} options
     */
    constructor(options = {}) {
        super({
            title: options.title || 'Confirm',
            icon: options.icon || '❓',
            width: options.width || 350,
            buttons: [
                DialogButton.cancel(),
                DialogButton.ok(() => { this.result = true; })
            ],
            ...options
        });
        
        /** @type {string} Confirm message */
        this.message = options.message || 'Are you sure?';
        
        this.result = false;
    }

    renderContent() {
        return `
            <div class="confirm-dialog">
                <div class="confirm-message">${this.message}</div>
            </div>
        `;
    }
}

// ==========================================
// PROMPT DIALOG
// ==========================================

/**
 * PromptDialog - Input prompt dialog
 */
export class PromptDialog extends Dialog {
    /**
     * Create a prompt dialog
     * @param {object} options
     */
    constructor(options = {}) {
        super({
            title: options.title || 'Input',
            icon: options.icon || '✏️',
            width: options.width || 400,
            buttons: [
                DialogButton.cancel(),
                new DialogButton({
                    id: 'ok',
                    label: 'OK',
                    type: 'primary',
                    onClick: () => {
                        this.result = this._getValue();
                    }
                })
            ],
            ...options
        });
        
        /** @type {string} Prompt label */
        this.label = options.label || 'Enter value:';
        
        /** @type {string} Default value */
        this.defaultValue = options.defaultValue || '';
        
        /** @type {string} Placeholder text */
        this.placeholder = options.placeholder || '';
        
        /** @type {string} Input type */
        this.inputType = options.inputType || 'text';
        
        /** @type {boolean} Multiline input */
        this.multiline = options.multiline || false;
        
        this.result = null;
    }

    renderContent() {
        const inputId = `prompt-input-${this.id}`;
        
        if (this.multiline) {
            return `
                <div class="prompt-dialog">
                    <label class="prompt-label" for="${inputId}">${this.label}</label>
                    <textarea 
                        id="${inputId}" 
                        class="prompt-input prompt-textarea"
                        placeholder="${this.placeholder}"
                    >${this.defaultValue}</textarea>
                </div>
            `;
        }
        
        return `
            <div class="prompt-dialog">
                <label class="prompt-label" for="${inputId}">${this.label}</label>
                <input 
                    type="${this.inputType}"
                    id="${inputId}" 
                    class="prompt-input"
                    value="${this.defaultValue}"
                    placeholder="${this.placeholder}"
                >
            </div>
        `;
    }

    /**
     * Get input value
     * @private
     */
    _getValue() {
        const input = this.contentElement?.querySelector('.prompt-input');
        return input?.value || '';
    }
}

// ==========================================
// FORM DIALOG
// ==========================================

/**
 * FormField - Form field configuration
 */
export class FormField {
    constructor(options = {}) {
        this.id = options.id || '';
        this.label = options.label || '';
        this.type = options.type || 'text';  // text, number, checkbox, select, textarea, color
        this.value = options.value ?? '';
        this.placeholder = options.placeholder || '';
        this.required = options.required || false;
        this.options = options.options || [];  // For select
        this.min = options.min;
        this.max = options.max;
        this.step = options.step;
    }
}

/**
 * FormDialog - Dialog with form fields
 */
export class FormDialog extends Dialog {
    /**
     * Create a form dialog
     * @param {object} options
     */
    constructor(options = {}) {
        super({
            title: options.title || 'Form',
            width: options.width || 450,
            buttons: [
                DialogButton.cancel(),
                new DialogButton({
                    id: 'submit',
                    label: options.submitLabel || 'Submit',
                    type: 'primary',
                    onClick: () => {
                        if (this.validate()) {
                            this.result = this.getData();
                        } else {
                            return false;  // Don't close
                        }
                    }
                })
            ],
            ...options
        });
        
        /** @type {Array<FormField>} Form fields */
        this.fields = (options.fields || []).map(f => 
            f instanceof FormField ? f : new FormField(f)
        );
        
        this.result = null;
    }

    renderContent() {
        const container = document.createElement('div');
        container.className = 'form-dialog';

        for (const field of this.fields) {
            const row = document.createElement('div');
            row.className = 'form-row';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.htmlFor = `field-${field.id}`;
            label.textContent = field.label;
            if (field.required) {
                label.innerHTML += ' <span class="form-required">*</span>';
            }
            row.appendChild(label);

            let input;

            switch (field.type) {
                case 'textarea':
                    input = document.createElement('textarea');
                    input.textContent = field.value;
                    break;

                case 'select':
                    input = document.createElement('select');
                    for (const opt of field.options) {
                        const option = document.createElement('option');
                        option.value = typeof opt === 'object' ? opt.value : opt;
                        option.textContent = typeof opt === 'object' ? opt.label : opt;
                        if (option.value === field.value) {
                            option.selected = true;
                        }
                        input.appendChild(option);
                    }
                    break;

                case 'checkbox':
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = field.value;
                    break;

                default:
                    input = document.createElement('input');
                    input.type = field.type;
                    input.value = field.value;
                    
                    if (field.min !== undefined) input.min = field.min;
                    if (field.max !== undefined) input.max = field.max;
                    if (field.step !== undefined) input.step = field.step;
            }

            input.id = `field-${field.id}`;
            input.name = field.id;
            input.className = 'form-input';
            input.placeholder = field.placeholder;
            input.required = field.required;
            input.setAttribute('data-field-id', field.id);

            row.appendChild(input);
            container.appendChild(row);
        }

        return container;
    }

    validate() {
        for (const field of this.fields) {
            if (field.required) {
                const input = this.contentElement?.querySelector(`[data-field-id="${field.id}"]`);
                if (!input || (field.type === 'checkbox' ? !input.checked : !input.value)) {
                    input?.classList.add('error');
                    return false;
                }
                input?.classList.remove('error');
            }
        }
        return true;
    }

    getData() {
        const data = {};
        
        for (const field of this.fields) {
            const input = this.contentElement?.querySelector(`[data-field-id="${field.id}"]`);
            if (input) {
                if (field.type === 'checkbox') {
                    data[field.id] = input.checked;
                } else if (field.type === 'number') {
                    data[field.id] = parseFloat(input.value) || 0;
                } else {
                    data[field.id] = input.value;
                }
            }
        }
        
        return data;
    }
}

// ==========================================
// DIALOG HELPERS
// ==========================================

/**
 * Show alert dialog
 * @param {string} message
 * @param {string} title
 * @param {string} type - 'info', 'warning', 'error', 'success'
 * @returns {Promise<void>}
 */
export async function alert(message, title = 'Alert', type = 'info') {
    const dialog = new AlertDialog({
        title,
        message,
        alertType: type
    });
    return dialog.open();
}

/**
 * Show confirm dialog
 * @param {string} message
 * @param {string} title
 * @returns {Promise<boolean>}
 */
export async function confirm(message, title = 'Confirm') {
    const dialog = new ConfirmDialog({
        title,
        message
    });
    return dialog.open();
}

/**
 * Show prompt dialog
 * @param {string} label
 * @param {string} defaultValue
 * @param {string} title
 * @returns {Promise<string|null>}
 */
export async function prompt(label, defaultValue = '', title = 'Input') {
    const dialog = new PromptDialog({
        title,
        label,
        defaultValue
    });
    return dialog.open();
}

// ==========================================
// CREATE DIALOG HELPER
// ==========================================

/**
 * Create a dialog with custom content
 * @param {object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {HTMLElement|string} options.content - Dialog content
 * @param {number} options.width - Dialog width
 * @param {number} options.height - Dialog height
 * @param {Array} options.buttons - Button configurations
 * @param {function} options.onAction - Action handler
 * @param {function} options.onClose - Close handler
 * @returns {Dialog} Dialog instance
 */
export function createDialog(options) {
    const {
        title = 'Dialog',
        content,
        width = 400,
        height = null,
        buttons = [],
        onAction,
        onClose
    } = options;
    
    // Convert button configs to DialogButton instances
    const dialogButtons = buttons.map(btn => new DialogButton({
        label: btn.text || btn.label,
        type: btn.primary ? 'primary' : (btn.secondary ? 'secondary' : 'default'),
        onClick: async () => {
            if (onAction) {
                const result = await onAction(btn.action);
                if (result !== false) {
                    dialog.close();
                }
            } else {
                dialog.close();
            }
        }
    }));
    
    const dialog = new Dialog({
        title,
        content,
        width,
        height,
        buttons: dialogButtons,
        showClose: true,
        closeOnOverlay: true,
        closeOnEscape: true
    });
    
    dialog.on('close', () => {
        if (onClose) onClose();
    });
    
    return dialog;
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    DialogButton,
    Dialog,
    AlertDialog,
    ConfirmDialog,
    PromptDialog,
    FormField,
    FormDialog,
    alert,
    confirm,
    prompt,
    createDialog
};
