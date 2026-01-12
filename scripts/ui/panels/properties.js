/**
 * Asciistrator - Properties Panel
 * 
 * Object properties editing panel for transforms, styles, etc.
 */

import { Panel, AccordionPanel } from '../panels.js';
import { EventEmitter } from '../../utils/events.js';

// ==========================================
// PROPERTY EDITOR
// ==========================================

/**
 * PropertyEditor - Generic property editor
 */
export class PropertyEditor extends EventEmitter {
    /**
     * Create property editor
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Property identifier */
        this.id = options.id || '';
        
        /** @type {string} Property label */
        this.label = options.label || '';
        
        /** @type {string} Property type */
        this.type = options.type || 'text';
        
        /** @type {*} Property value */
        this.value = options.value;
        
        /** @type {object} Additional options */
        this.options = options;
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
        
        /** @type {HTMLElement|null} Input element */
        this.input = null;
    }

    /**
     * Render property editor
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'property-row';

        const label = document.createElement('label');
        label.className = 'property-label';
        label.textContent = this.label;
        label.htmlFor = `prop-${this.id}`;
        this.element.appendChild(label);

        const inputContainer = document.createElement('div');
        inputContainer.className = 'property-input-container';

        this.input = this._createInput();
        this.input.id = `prop-${this.id}`;
        this.input.className = 'property-input';
        inputContainer.appendChild(this.input);

        this.element.appendChild(inputContainer);

        return this.element;
    }

    /**
     * Create appropriate input element
     * @private
     */
    _createInput() {
        let input;

        switch (this.type) {
            case 'number':
                input = document.createElement('input');
                input.type = 'number';
                input.value = this.value ?? 0;
                if (this.options.min !== undefined) input.min = this.options.min;
                if (this.options.max !== undefined) input.max = this.options.max;
                if (this.options.step !== undefined) input.step = this.options.step;
                input.addEventListener('change', () => {
                    this.value = parseFloat(input.value);
                    this.emit('change', this.value);
                });
                break;

            case 'range':
                input = document.createElement('input');
                input.type = 'range';
                input.value = this.value ?? 0;
                input.min = this.options.min ?? 0;
                input.max = this.options.max ?? 100;
                input.step = this.options.step ?? 1;
                input.addEventListener('input', () => {
                    this.value = parseFloat(input.value);
                    this.emit('change', this.value);
                });
                break;

            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = this.value ?? false;
                input.addEventListener('change', () => {
                    this.value = input.checked;
                    this.emit('change', this.value);
                });
                break;

            case 'select':
                input = document.createElement('select');
                for (const opt of (this.options.choices || [])) {
                    const option = document.createElement('option');
                    option.value = typeof opt === 'object' ? opt.value : opt;
                    option.textContent = typeof opt === 'object' ? opt.label : opt;
                    if (option.value === this.value) option.selected = true;
                    input.appendChild(option);
                }
                input.addEventListener('change', () => {
                    this.value = input.value;
                    this.emit('change', this.value);
                });
                break;

            case 'color':
                input = document.createElement('input');
                input.type = 'color';
                input.value = this.value || '#000000';
                input.addEventListener('change', () => {
                    this.value = input.value;
                    this.emit('change', this.value);
                });
                break;

            case 'text':
            default:
                input = document.createElement('input');
                input.type = 'text';
                input.value = this.value ?? '';
                if (this.options.placeholder) input.placeholder = this.options.placeholder;
                input.addEventListener('change', () => {
                    this.value = input.value;
                    this.emit('change', this.value);
                });
        }

        return input;
    }

    /**
     * Set value
     * @param {*} value
     */
    setValue(value) {
        this.value = value;
        if (this.input) {
            if (this.type === 'checkbox') {
                this.input.checked = value;
            } else {
                this.input.value = value;
            }
        }
    }

    /**
     * Get value
     * @returns {*}
     */
    getValue() {
        return this.value;
    }
}

// ==========================================
// VECTOR EDITOR
// ==========================================

/**
 * VectorEditor - X/Y coordinate editor
 */
export class VectorEditor extends EventEmitter {
    /**
     * Create vector editor
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        this.id = options.id || '';
        this.label = options.label || '';
        this.x = options.x ?? 0;
        this.y = options.y ?? 0;
        this.step = options.step ?? 1;
        this.linked = options.linked ?? false;
        
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'property-row property-vector';

        const label = document.createElement('label');
        label.className = 'property-label';
        label.textContent = this.label;
        this.element.appendChild(label);

        const container = document.createElement('div');
        container.className = 'vector-inputs';

        // X input
        const xGroup = document.createElement('div');
        xGroup.className = 'vector-input-group';
        xGroup.innerHTML = `
            <span class="vector-label">X</span>
            <input type="number" class="vector-x" value="${this.x}" step="${this.step}">
        `;
        container.appendChild(xGroup);

        // Link button (for proportional scaling)
        if (this.linked !== undefined) {
            const linkBtn = document.createElement('button');
            linkBtn.className = 'vector-link';
            linkBtn.innerHTML = this.linked ? '🔗' : '⛓';
            linkBtn.title = 'Link values';
            linkBtn.addEventListener('click', () => {
                this.linked = !this.linked;
                linkBtn.innerHTML = this.linked ? '🔗' : '⛓';
            });
            container.appendChild(linkBtn);
        }

        // Y input
        const yGroup = document.createElement('div');
        yGroup.className = 'vector-input-group';
        yGroup.innerHTML = `
            <span class="vector-label">Y</span>
            <input type="number" class="vector-y" value="${this.y}" step="${this.step}">
        `;
        container.appendChild(yGroup);

        this.element.appendChild(container);

        // Bind events
        const xInput = this.element.querySelector('.vector-x');
        const yInput = this.element.querySelector('.vector-y');

        xInput.addEventListener('change', () => {
            const newX = parseFloat(xInput.value);
            if (this.linked && this.x !== 0) {
                const ratio = newX / this.x;
                this.y *= ratio;
                yInput.value = this.y;
            }
            this.x = newX;
            this.emit('change', { x: this.x, y: this.y });
        });

        yInput.addEventListener('change', () => {
            const newY = parseFloat(yInput.value);
            if (this.linked && this.y !== 0) {
                const ratio = newY / this.y;
                this.x *= ratio;
                xInput.value = this.x;
            }
            this.y = newY;
            this.emit('change', { x: this.x, y: this.y });
        });

        return this.element;
    }

    setValue(x, y) {
        this.x = x;
        this.y = y;
        if (this.element) {
            this.element.querySelector('.vector-x').value = x;
            this.element.querySelector('.vector-y').value = y;
        }
    }

    getValue() {
        return { x: this.x, y: this.y };
    }
}

// ==========================================
// TRANSFORM SECTION
// ==========================================

/**
 * TransformSection - Transform properties section
 */
export class TransformSection extends EventEmitter {
    constructor() {
        super();
        
        this.position = new VectorEditor({ id: 'position', label: 'Position', step: 1 });
        this.size = new VectorEditor({ id: 'size', label: 'Size', step: 1, linked: true });
        this.rotation = new PropertyEditor({ id: 'rotation', label: 'Rotation', type: 'number', value: 0, step: 1, min: -360, max: 360 });
        this.skew = new VectorEditor({ id: 'skew', label: 'Skew', step: 1 });
        
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'properties-section transform-section';

        this.element.appendChild(this.position.render());
        this.element.appendChild(this.size.render());
        this.element.appendChild(this.rotation.render());
        this.element.appendChild(this.skew.render());

        // Forward events
        this.position.on('change', (v) => this.emit('change', { property: 'position', value: v }));
        this.size.on('change', (v) => this.emit('change', { property: 'size', value: v }));
        this.rotation.on('change', (v) => this.emit('change', { property: 'rotation', value: v }));
        this.skew.on('change', (v) => this.emit('change', { property: 'skew', value: v }));

        return this.element;
    }

    setValues(transform) {
        if (transform.position) this.position.setValue(transform.position.x, transform.position.y);
        if (transform.size) this.size.setValue(transform.size.x, transform.size.y);
        if (transform.rotation !== undefined) this.rotation.setValue(transform.rotation);
        if (transform.skew) this.skew.setValue(transform.skew.x, transform.skew.y);
    }
}

// ==========================================
// STYLE SECTION
// ==========================================

/**
 * StyleSection - Style properties section
 */
export class StyleSection extends EventEmitter {
    constructor() {
        super();
        
        this.fillChar = new PropertyEditor({ 
            id: 'fillChar', 
            label: 'Fill Character', 
            type: 'text', 
            value: '█',
            placeholder: 'Character'
        });
        
        this.strokeChar = new PropertyEditor({ 
            id: 'strokeChar', 
            label: 'Stroke Character', 
            type: 'text', 
            value: '─',
            placeholder: 'Character'
        });
        
        this.strokeWidth = new PropertyEditor({ 
            id: 'strokeWidth', 
            label: 'Stroke Width', 
            type: 'number', 
            value: 1,
            min: 0,
            max: 10,
            step: 1
        });
        
        this.opacity = new PropertyEditor({ 
            id: 'opacity', 
            label: 'Opacity', 
            type: 'range', 
            value: 100,
            min: 0,
            max: 100,
            step: 1
        });
        
        this.filled = new PropertyEditor({ 
            id: 'filled', 
            label: 'Fill', 
            type: 'checkbox', 
            value: true 
        });
        
        this.stroked = new PropertyEditor({ 
            id: 'stroked', 
            label: 'Stroke', 
            type: 'checkbox', 
            value: true 
        });
        
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'properties-section style-section';

        this.element.appendChild(this.filled.render());
        this.element.appendChild(this.fillChar.render());
        this.element.appendChild(this.stroked.render());
        this.element.appendChild(this.strokeChar.render());
        this.element.appendChild(this.strokeWidth.render());
        this.element.appendChild(this.opacity.render());

        // Forward events
        [this.fillChar, this.strokeChar, this.strokeWidth, this.opacity, this.filled, this.stroked].forEach(editor => {
            editor.on('change', (v) => this.emit('change', { property: editor.id, value: v }));
        });

        return this.element;
    }

    setValues(style) {
        if (style.fillChar !== undefined) this.fillChar.setValue(style.fillChar);
        if (style.strokeChar !== undefined) this.strokeChar.setValue(style.strokeChar);
        if (style.strokeWidth !== undefined) this.strokeWidth.setValue(style.strokeWidth);
        if (style.opacity !== undefined) this.opacity.setValue(style.opacity * 100);
        if (style.filled !== undefined) this.filled.setValue(style.filled);
        if (style.stroked !== undefined) this.stroked.setValue(style.stroked);
    }
}

// ==========================================
// TEXT SECTION
// ==========================================

/**
 * TextSection - Text properties section
 */
export class TextSection extends EventEmitter {
    constructor() {
        super();
        
        this.content = new PropertyEditor({ 
            id: 'content', 
            label: 'Text', 
            type: 'text', 
            value: '' 
        });
        
        this.fontFamily = new PropertyEditor({ 
            id: 'fontFamily', 
            label: 'Font', 
            type: 'select', 
            value: 'default',
            choices: [
                { value: 'default', label: 'Default' },
                { value: 'block', label: 'Block' },
                { value: 'banner', label: 'Banner' },
                { value: 'slant', label: 'Slant' },
                { value: 'mini', label: 'Mini' }
            ]
        });
        
        this.fontSize = new PropertyEditor({ 
            id: 'fontSize', 
            label: 'Size', 
            type: 'number', 
            value: 1,
            min: 1,
            max: 10,
            step: 1
        });
        
        this.textAlign = new PropertyEditor({ 
            id: 'textAlign', 
            label: 'Align', 
            type: 'select', 
            value: 'left',
            choices: ['left', 'center', 'right']
        });
        
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'properties-section text-section';

        this.element.appendChild(this.content.render());
        this.element.appendChild(this.fontFamily.render());
        this.element.appendChild(this.fontSize.render());
        this.element.appendChild(this.textAlign.render());

        // Forward events
        [this.content, this.fontFamily, this.fontSize, this.textAlign].forEach(editor => {
            editor.on('change', (v) => this.emit('change', { property: editor.id, value: v }));
        });

        return this.element;
    }

    setValues(text) {
        if (text.content !== undefined) this.content.setValue(text.content);
        if (text.fontFamily !== undefined) this.fontFamily.setValue(text.fontFamily);
        if (text.fontSize !== undefined) this.fontSize.setValue(text.fontSize);
        if (text.textAlign !== undefined) this.textAlign.setValue(text.textAlign);
    }
}

// ==========================================
// PROPERTIES PANEL
// ==========================================

/**
 * PropertiesPanel - Object properties panel
 */
export class PropertiesPanel extends Panel {
    /**
     * Create properties panel
     * @param {object} options
     */
    constructor(options = {}) {
        super({
            id: 'properties',
            title: 'Properties',
            icon: '⚙',
            width: 250,
            ...options
        });
        
        /** @type {object|null} Currently selected object */
        this.selectedObject = null;
        
        /** @type {string} Object type */
        this.objectType = '';
        
        /** @type {TransformSection} Transform section */
        this.transformSection = new TransformSection();
        
        /** @type {StyleSection} Style section */
        this.styleSection = new StyleSection();
        
        /** @type {TextSection} Text section */
        this.textSection = new TextSection();
    }

    /**
     * Render panel content
     * @returns {HTMLElement}
     */
    renderContent() {
        const container = document.createElement('div');
        container.className = 'properties-panel';

        // Object info header
        const header = document.createElement('div');
        header.className = 'properties-header';
        header.innerHTML = `
            <span class="properties-object-icon">▢</span>
            <span class="properties-object-type">No Selection</span>
        `;
        container.appendChild(header);

        // Quick actions
        const quickActions = document.createElement('div');
        quickActions.className = 'properties-quick-actions';

        const alignBtns = ['⬅', '⬛', '➡', '⬆', '◼', '⬇'];
        const alignTitles = ['Align Left', 'Align Center H', 'Align Right', 'Align Top', 'Align Center V', 'Align Bottom'];
        
        alignBtns.forEach((icon, i) => {
            const btn = document.createElement('button');
            btn.className = 'quick-action-btn';
            btn.innerHTML = icon;
            btn.title = alignTitles[i];
            btn.addEventListener('click', () => {
                const actions = ['alignLeft', 'alignCenterH', 'alignRight', 'alignTop', 'alignCenterV', 'alignBottom'];
                this.emit('quickAction', actions[i]);
            });
            quickActions.appendChild(btn);
        });

        container.appendChild(quickActions);

        // Sections accordion
        const accordion = document.createElement('div');
        accordion.className = 'properties-accordion';

        // Transform section
        const transformHeader = this._createSectionHeader('Transform', true);
        const transformContent = document.createElement('div');
        transformContent.className = 'properties-section-content';
        transformContent.appendChild(this.transformSection.render());
        
        accordion.appendChild(transformHeader);
        accordion.appendChild(transformContent);

        // Style section
        const styleHeader = this._createSectionHeader('Appearance', true);
        const styleContent = document.createElement('div');
        styleContent.className = 'properties-section-content';
        styleContent.appendChild(this.styleSection.render());
        
        accordion.appendChild(styleHeader);
        accordion.appendChild(styleContent);

        // Text section (conditional)
        const textHeader = this._createSectionHeader('Text', false);
        textHeader.classList.add('text-section-header');
        const textContent = document.createElement('div');
        textContent.className = 'properties-section-content text-section-content';
        textContent.style.display = 'none';
        textContent.appendChild(this.textSection.render());
        
        accordion.appendChild(textHeader);
        accordion.appendChild(textContent);

        container.appendChild(accordion);

        // Bind section events
        this.transformSection.on('change', (data) => {
            this.emit('propertyChange', { section: 'transform', ...data });
        });

        this.styleSection.on('change', (data) => {
            this.emit('propertyChange', { section: 'style', ...data });
        });

        this.textSection.on('change', (data) => {
            this.emit('propertyChange', { section: 'text', ...data });
        });

        return container;
    }

    /**
     * Create section header
     * @private
     */
    _createSectionHeader(title, expanded) {
        const header = document.createElement('div');
        header.className = 'properties-section-header';
        header.innerHTML = `
            <span class="section-arrow">${expanded ? '▼' : '▶'}</span>
            <span class="section-title">${title}</span>
        `;

        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const arrow = header.querySelector('.section-arrow');
            const isExpanded = content.style.display !== 'none';
            
            content.style.display = isExpanded ? 'none' : 'block';
            arrow.textContent = isExpanded ? '▶' : '▼';
        });

        return header;
    }

    /**
     * Set selected object
     * @param {object|null} object
     */
    setObject(object) {
        this.selectedObject = object;

        if (!object) {
            this._updateHeader('▢', 'No Selection');
            this._showTextSection(false);
            this._showUIComponentSection(false);
            return;
        }

        // Check if this is a UI component (avaloniaType kept for backward compatibility)
        const isUIComponent = object.uiComponentType || object.avaloniaType;
        
        // Determine object type for display
        let type = object.type || object.constructor?.name || 'Object';
        let displayType = type;
        
        if (isUIComponent) {
            displayType = object.uiComponentType || object.avaloniaType;
        }
        
        const icons = {
            Rectangle: '□',
            Ellipse: '○',
            Polygon: '⬡',
            Star: '☆',
            Line: '╱',
            Path: '⌇',
            Text: 'T',
            Group: '📦',
            default: '▢'
        };
        
        // Use Avalonia icon for UI components
        const icon = isUIComponent ? '◇' : (icons[type] || icons.default);
        this._updateHeader(icon, displayType);

        // Update transform
        this.transformSection.setValues({
            position: { x: object.x ?? 0, y: object.y ?? 0 },
            size: { x: object.width ?? 0, y: object.height ?? 0 },
            rotation: object.rotation ?? 0,
            skew: { x: object.skewX ?? 0, y: object.skewY ?? 0 }
        });

        // Update style
        if (object.style) {
            this.styleSection.setValues(object.style);
        }

        // Handle UI component properties
        if (isUIComponent) {
            this._showTextSection(false);
            this._showUIComponentSection(true);
            this._updateUIComponentProperties(object);
        } else {
            this._showUIComponentSection(false);
            
            // Update text section if applicable
            const isText = type === 'Text' || type === 'TextOnPath' || type === 'text';
            this._showTextSection(isText);
            
            if (isText) {
                this.textSection.setValues({
                    content: object.content ?? object.text ?? '',
                    fontFamily: object.fontFamily ?? 'default',
                    fontSize: object.fontSize ?? 1,
                    textAlign: object.textAlign ?? 'left'
                });
            }
        }
    }
    
    /**
     * Show/hide UI component section
     * @private
     */
    _showUIComponentSection(show) {
        let section = this.content?.querySelector('.ui-component-section');
        
        if (show && !section) {
            // Create the section if it doesn't exist
            section = document.createElement('div');
            section.className = 'ui-component-section';
            section.innerHTML = `
                <div class="accordion-header ui-component-section-header">
                    <span class="accordion-icon">▼</span>
                    <span>UI Properties</span>
                </div>
                <div class="accordion-content ui-component-section-content"></div>
            `;
            this.content?.appendChild(section);
            
            // Add toggle behavior
            const header = section.querySelector('.ui-component-section-header');
            const content = section.querySelector('.ui-component-section-content');
            header?.addEventListener('click', () => {
                const isExpanded = content.style.display !== 'none';
                content.style.display = isExpanded ? 'none' : '';
                header.querySelector('.accordion-icon').textContent = isExpanded ? '▶' : '▼';
            });
        }
        
        if (section) {
            section.style.display = show ? '' : 'none';
        }
    }
    
    /**
     * Update UI component properties display
     * @private
     */
    _updateUIComponentProperties(object) {
        const content = this.content?.querySelector('.ui-component-section-content');
        if (!content) return;
        
        content.innerHTML = '';
        
        const props = object.uiProperties || {};
        
        // Define editable properties for UI components
        const editableProps = [
            { key: 'text', label: 'Text', type: 'text' },
            { key: 'content', label: 'Content', type: 'text' },
            { key: 'header', label: 'Header', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'placeholder', label: 'Placeholder', type: 'text' },
            { key: 'isChecked', label: 'Checked', type: 'checkbox' },
            { key: 'isEnabled', label: 'Enabled', type: 'checkbox' },
            { key: 'isDefault', label: 'Default', type: 'checkbox' },
            { key: 'isCancel', label: 'Cancel', type: 'checkbox' },
            { key: 'minimum', label: 'Minimum', type: 'number' },
            { key: 'maximum', label: 'Maximum', type: 'number' },
            { key: 'value', label: 'Value', type: 'number' }
        ];
        
        for (const prop of editableProps) {
            // Only show if property exists or is relevant to this component type
            if (props[prop.key] !== undefined || this._isPropertyRelevant(object, prop.key)) {
                const row = this._createPropertyRow(prop, props[prop.key], object);
                content.appendChild(row);
            }
        }
        
        // If no properties to show, display a message
        if (content.children.length === 0) {
            content.innerHTML = '<div class="property-row"><span class="property-label" style="opacity: 0.5">No editable properties</span></div>';
        }
    }
    
    /**
     * Check if a property is relevant to the component type
     * @private
     */
    _isPropertyRelevant(object, propKey) {
        const type = object.uiComponentType || object.avaloniaType || '';
        const typeLC = type.toLowerCase();
        
        const relevantProps = {
            'text': ['button', 'textblock', 'label', 'textbox', 'hyperlinkbutton'],
            'content': ['button', 'label', 'contentcontrol', 'headeredcontentcontrol'],
            'header': ['expander', 'groupbox', 'headeredcontentcontrol', 'tabitem'],
            'title': ['window'],
            'placeholder': ['textbox', 'combobox', 'autocomplete'],
            'isChecked': ['checkbox', 'radiobutton', 'togglebutton', 'toggleswitch'],
            'isEnabled': true, // Always relevant
            'isDefault': ['button'],
            'isCancel': ['button'],
            'minimum': ['slider', 'numericupdown', 'progressbar'],
            'maximum': ['slider', 'numericupdown', 'progressbar'],
            'value': ['slider', 'numericupdown', 'progressbar']
        };
        
        const relevant = relevantProps[propKey];
        if (relevant === true) return true;
        if (Array.isArray(relevant)) {
            return relevant.some(t => typeLC.includes(t));
        }
        return false;
    }
    
    /**
     * Create a property row for UI component editing
     * @private
     */
    _createPropertyRow(prop, value, object) {
        const row = document.createElement('div');
        row.className = 'property-row';
        
        const label = document.createElement('label');
        label.className = 'property-label';
        label.textContent = prop.label;
        row.appendChild(label);
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'property-input-container';
        
        let input;
        switch (prop.type) {
            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value === true;
                input.addEventListener('change', () => {
                    this._setUIProperty(object, prop.key, input.checked);
                });
                break;
            case 'number':
                input = document.createElement('input');
                input.type = 'number';
                input.value = value ?? '';
                input.className = 'property-input';
                input.addEventListener('change', () => {
                    const numVal = input.value === '' ? undefined : parseFloat(input.value);
                    this._setUIProperty(object, prop.key, numVal);
                });
                break;
            default:
                input = document.createElement('input');
                input.type = 'text';
                input.value = value ?? '';
                input.className = 'property-input';
                input.addEventListener('change', () => {
                    const strVal = input.value === '' ? undefined : input.value;
                    this._setUIProperty(object, prop.key, strVal);
                });
        }
        
        inputContainer.appendChild(input);
        row.appendChild(inputContainer);
        
        return row;
    }
    
    /**
     * Set a UI property on the object
     * @private
     */
    _setUIProperty(object, key, value) {
        if (!object.uiProperties) {
            object.uiProperties = {};
        }
        
        if (value === undefined || value === null || value === '') {
            delete object.uiProperties[key];
        } else {
            object.uiProperties[key] = value;
        }
        
        this.emit('propertyChange', { object, property: key, value });
    }

    /**
     * Update header display
     * @private
     */
    _updateHeader(icon, type) {
        const iconEl = this.content?.querySelector('.properties-object-icon');
        const typeEl = this.content?.querySelector('.properties-object-type');
        
        if (iconEl) iconEl.textContent = icon;
        if (typeEl) typeEl.textContent = type;
    }

    /**
     * Show/hide text section
     * @private
     */
    _showTextSection(show) {
        const header = this.content?.querySelector('.text-section-header');
        const content = this.content?.querySelector('.text-section-content');
        
        if (header) header.style.display = show ? '' : 'none';
        if (content) content.style.display = show ? '' : 'none';
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.setObject(null);
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    PropertyEditor,
    VectorEditor,
    TransformSection,
    StyleSection,
    TextSection,
    PropertiesPanel
};
