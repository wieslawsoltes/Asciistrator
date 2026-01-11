/**
 * Asciistrator - Layers Panel
 * 
 * Layer management panel with visibility, ordering, and naming.
 */

import { Panel } from '../panels.js';
import { EventEmitter } from '../../utils/events.js';

// ==========================================
// LAYER ITEM
// ==========================================

/**
 * LayerItem - Individual layer item in the panel
 */
export class LayerItem extends EventEmitter {
    /**
     * Create a layer item
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Layer ID */
        this.id = options.id || `layer_${Date.now()}`;
        
        /** @type {string} Layer name */
        this.name = options.name || 'Layer';
        
        /** @type {boolean} Is layer visible */
        this.visible = options.visible !== false;
        
        /** @type {boolean} Is layer locked */
        this.locked = options.locked || false;
        
        /** @type {boolean} Is layer selected */
        this.selected = options.selected || false;
        
        /** @type {string} Layer color indicator */
        this.color = options.color || '#888';
        
        /** @type {number} Object count in layer */
        this.objectCount = options.objectCount || 0;
        
        /** @type {string} Layer thumbnail/preview */
        this.thumbnail = options.thumbnail || '';
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
    }

    /**
     * Render layer item
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'layer-item';
        this.element.setAttribute('data-id', this.id);
        this.element.draggable = true;

        // Visibility toggle
        const visibilityBtn = document.createElement('button');
        visibilityBtn.className = 'layer-visibility';
        visibilityBtn.title = this.visible ? 'Hide layer' : 'Show layer';
        visibilityBtn.innerHTML = this.visible ? '👁' : '⦻';
        visibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleVisibility();
        });
        this.element.appendChild(visibilityBtn);

        // Lock toggle
        const lockBtn = document.createElement('button');
        lockBtn.className = 'layer-lock';
        lockBtn.title = this.locked ? 'Unlock layer' : 'Lock layer';
        lockBtn.innerHTML = this.locked ? '🔒' : '🔓';
        lockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLock();
        });
        this.element.appendChild(lockBtn);

        // Color indicator
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'layer-color';
        colorIndicator.style.backgroundColor = this.color;
        this.element.appendChild(colorIndicator);

        // Layer name
        const nameEl = document.createElement('span');
        nameEl.className = 'layer-name';
        nameEl.textContent = this.name;
        nameEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this._startRename();
        });
        this.element.appendChild(nameEl);

        // Object count
        const countEl = document.createElement('span');
        countEl.className = 'layer-count';
        countEl.textContent = this.objectCount > 0 ? `(${this.objectCount})` : '';
        this.element.appendChild(countEl);

        // Selection click
        this.element.addEventListener('click', () => {
            this.emit('select', this);
        });

        // Drag events
        this.element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', this.id);
            e.dataTransfer.effectAllowed = 'move';
            this.element.classList.add('dragging');
        });

        this.element.addEventListener('dragend', () => {
            this.element.classList.remove('dragging');
        });

        this.update();

        return this.element;
    }

    /**
     * Update visual state
     */
    update() {
        if (!this.element) return;

        this.element.classList.toggle('selected', this.selected);
        this.element.classList.toggle('locked', this.locked);
        this.element.classList.toggle('hidden-layer', !this.visible);

        const visibilityBtn = this.element.querySelector('.layer-visibility');
        if (visibilityBtn) {
            visibilityBtn.innerHTML = this.visible ? '👁' : '⦻';
            visibilityBtn.title = this.visible ? 'Hide layer' : 'Show layer';
        }

        const lockBtn = this.element.querySelector('.layer-lock');
        if (lockBtn) {
            lockBtn.innerHTML = this.locked ? '🔒' : '🔓';
            lockBtn.title = this.locked ? 'Unlock layer' : 'Lock layer';
        }

        const nameEl = this.element.querySelector('.layer-name');
        if (nameEl) {
            nameEl.textContent = this.name;
        }

        const countEl = this.element.querySelector('.layer-count');
        if (countEl) {
            countEl.textContent = this.objectCount > 0 ? `(${this.objectCount})` : '';
        }

        const colorEl = this.element.querySelector('.layer-color');
        if (colorEl) {
            colorEl.style.backgroundColor = this.color;
        }
    }

    /**
     * Toggle visibility
     */
    toggleVisibility() {
        this.visible = !this.visible;
        this.update();
        this.emit('visibilityChange', this.visible);
    }

    /**
     * Toggle lock
     */
    toggleLock() {
        this.locked = !this.locked;
        this.update();
        this.emit('lockChange', this.locked);
    }

    /**
     * Set selected state
     * @param {boolean} selected
     */
    setSelected(selected) {
        this.selected = selected;
        this.update();
    }

    /**
     * Start rename editing
     * @private
     */
    _startRename() {
        const nameEl = this.element.querySelector('.layer-name');
        if (!nameEl) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'layer-name-input';
        input.value = this.name;

        const finishRename = () => {
            const newName = input.value.trim();
            if (newName && newName !== this.name) {
                this.name = newName;
                this.emit('rename', newName);
            }
            input.replaceWith(nameEl);
            this.update();
        };

        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishRename();
            } else if (e.key === 'Escape') {
                input.replaceWith(nameEl);
            }
        });

        nameEl.replaceWith(input);
        input.focus();
        input.select();
    }
}

// ==========================================
// LAYERS PANEL
// ==========================================

/**
 * LayersPanel - Layer management panel
 */
export class LayersPanel extends Panel {
    /**
     * Create layers panel
     * @param {object} options
     */
    constructor(options = {}) {
        super({
            id: 'layers',
            title: 'Layers',
            icon: '☰',
            width: 250,
            ...options
        });
        
        /** @type {Array<LayerItem>} Layer items */
        this.layers = [];
        
        /** @type {LayerItem|null} Selected layer */
        this.selectedLayer = null;
        
        /** @type {HTMLElement|null} Layers list element */
        this.layersList = null;
        
        /** @type {Function} External layer data source */
        this.dataSource = options.dataSource || null;
    }

    /**
     * Render panel content
     * @returns {HTMLElement}
     */
    renderContent() {
        const container = document.createElement('div');
        container.className = 'layers-panel';

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'layers-toolbar';

        const addBtn = this._createButton('➕', 'Add Layer', () => {
            this.emit('addLayer');
        });
        toolbar.appendChild(addBtn);

        const deleteBtn = this._createButton('🗑', 'Delete Layer', () => {
            if (this.selectedLayer) {
                this.emit('deleteLayer', this.selectedLayer.id);
            }
        });
        toolbar.appendChild(deleteBtn);

        const duplicateBtn = this._createButton('📋', 'Duplicate Layer', () => {
            if (this.selectedLayer) {
                this.emit('duplicateLayer', this.selectedLayer.id);
            }
        });
        toolbar.appendChild(duplicateBtn);

        const mergeBtn = this._createButton('⊕', 'Merge Down', () => {
            if (this.selectedLayer) {
                this.emit('mergeLayer', this.selectedLayer.id);
            }
        });
        toolbar.appendChild(mergeBtn);

        container.appendChild(toolbar);

        // Layers list
        this.layersList = document.createElement('div');
        this.layersList.className = 'layers-list';

        // Drag and drop zone
        this.layersList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = this._getDragAfterElement(e.clientY);
            const dragging = this.layersList.querySelector('.dragging');
            
            if (afterElement) {
                this.layersList.insertBefore(dragging, afterElement);
            } else {
                this.layersList.appendChild(dragging);
            }
        });

        this.layersList.addEventListener('drop', (e) => {
            e.preventDefault();
            const layerId = e.dataTransfer.getData('text/plain');
            const newOrder = this._getLayerOrder();
            this.emit('reorderLayers', { layerId, newOrder });
        });

        // Render existing layers
        for (const layer of this.layers) {
            this.layersList.appendChild(layer.render());
        }

        container.appendChild(this.layersList);

        // Blend mode / opacity section (for selected layer)
        const propertiesSection = document.createElement('div');
        propertiesSection.className = 'layers-properties';

        const opacityRow = document.createElement('div');
        opacityRow.className = 'layers-property-row';
        opacityRow.innerHTML = `
            <label>Opacity:</label>
            <input type="range" class="layer-opacity" min="0" max="100" value="100">
            <span class="layer-opacity-value">100%</span>
        `;

        const opacityInput = opacityRow.querySelector('.layer-opacity');
        const opacityValue = opacityRow.querySelector('.layer-opacity-value');
        
        opacityInput.addEventListener('input', () => {
            opacityValue.textContent = `${opacityInput.value}%`;
            if (this.selectedLayer) {
                this.emit('layerOpacity', {
                    layerId: this.selectedLayer.id,
                    opacity: parseInt(opacityInput.value, 10) / 100
                });
            }
        });

        propertiesSection.appendChild(opacityRow);

        const blendRow = document.createElement('div');
        blendRow.className = 'layers-property-row';
        blendRow.innerHTML = `
            <label>Blend:</label>
            <select class="layer-blend">
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
            </select>
        `;

        const blendSelect = blendRow.querySelector('.layer-blend');
        blendSelect.addEventListener('change', () => {
            if (this.selectedLayer) {
                this.emit('layerBlend', {
                    layerId: this.selectedLayer.id,
                    blendMode: blendSelect.value
                });
            }
        });

        propertiesSection.appendChild(blendRow);
        container.appendChild(propertiesSection);

        return container;
    }

    /**
     * Create toolbar button
     * @private
     */
    _createButton(icon, title, onClick) {
        const btn = document.createElement('button');
        btn.className = 'layers-toolbar-btn';
        btn.innerHTML = icon;
        btn.title = title;
        btn.addEventListener('click', onClick);
        return btn;
    }

    /**
     * Get element to insert after during drag
     * @private
     */
    _getDragAfterElement(y) {
        const items = [...this.layersList.querySelectorAll('.layer-item:not(.dragging)')];
        
        return items.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Get current layer order from DOM
     * @private
     */
    _getLayerOrder() {
        const items = this.layersList.querySelectorAll('.layer-item');
        return Array.from(items).map(item => item.dataset.id);
    }

    /**
     * Add layer to panel
     * @param {object} layerData
     */
    addLayer(layerData) {
        const layer = new LayerItem(layerData);
        
        layer.on('select', () => {
            this.selectLayer(layer.id);
        });
        
        layer.on('visibilityChange', (visible) => {
            this.emit('layerVisibility', { layerId: layer.id, visible });
        });
        
        layer.on('lockChange', (locked) => {
            this.emit('layerLock', { layerId: layer.id, locked });
        });
        
        layer.on('rename', (name) => {
            this.emit('layerRename', { layerId: layer.id, name });
        });

        this.layers.push(layer);

        if (this.layersList) {
            // Insert at top (newest layers first)
            this.layersList.insertBefore(layer.render(), this.layersList.firstChild);
        }

        return layer;
    }

    /**
     * Remove layer from panel
     * @param {string} id
     */
    removeLayer(id) {
        const index = this.layers.findIndex(l => l.id === id);
        if (index >= 0) {
            const layer = this.layers[index];
            layer.element?.remove();
            this.layers.splice(index, 1);

            if (this.selectedLayer === layer) {
                this.selectedLayer = null;
                // Select next layer if available
                if (this.layers.length > 0) {
                    this.selectLayer(this.layers[Math.min(index, this.layers.length - 1)].id);
                }
            }
        }
    }

    /**
     * Select layer by ID
     * @param {string} id
     */
    selectLayer(id) {
        // Deselect all
        for (const layer of this.layers) {
            layer.setSelected(layer.id === id);
        }

        this.selectedLayer = this.layers.find(l => l.id === id) || null;
        this.emit('layerSelect', id);
    }

    /**
     * Update layer data
     * @param {string} id
     * @param {object} data
     */
    updateLayer(id, data) {
        const layer = this.layers.find(l => l.id === id);
        if (layer) {
            Object.assign(layer, data);
            layer.update();
        }
    }

    /**
     * Clear all layers
     */
    clearLayers() {
        this.layers = [];
        this.selectedLayer = null;
        if (this.layersList) {
            this.layersList.innerHTML = '';
        }
    }

    /**
     * Set layers from data
     * @param {Array<object>} layersData
     */
    setLayers(layersData) {
        this.clearLayers();
        for (const data of layersData) {
            this.addLayer(data);
        }
    }

    /**
     * Get layer by ID
     * @param {string} id
     * @returns {LayerItem|undefined}
     */
    getLayer(id) {
        return this.layers.find(l => l.id === id);
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    LayerItem,
    LayersPanel
};
