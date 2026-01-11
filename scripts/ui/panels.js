/**
 * Asciistrator - Panel System
 * 
 * Dockable, collapsible, resizable panel framework.
 */

import { EventEmitter } from '../utils/events.js';

// ==========================================
// PANEL
// ==========================================

/**
 * Panel - Base panel class
 */
export class Panel extends EventEmitter {
    /**
     * Create a panel
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Panel identifier */
        this.id = options.id || `panel_${Date.now()}`;
        
        /** @type {string} Panel title */
        this.title = options.title || 'Panel';
        
        /** @type {string} Panel icon */
        this.icon = options.icon || '';
        
        /** @type {number} Panel width */
        this.width = options.width || 250;
        
        /** @type {number} Panel height */
        this.height = options.height || 300;
        
        /** @type {number} Minimum width */
        this.minWidth = options.minWidth || 150;
        
        /** @type {number} Minimum height */
        this.minHeight = options.minHeight || 100;
        
        /** @type {boolean} Is panel collapsed */
        this.collapsed = options.collapsed || false;
        
        /** @type {boolean} Is panel visible */
        this.visible = options.visible !== false;
        
        /** @type {boolean} Is panel closable */
        this.closable = options.closable !== false;
        
        /** @type {boolean} Is panel collapsible */
        this.collapsible = options.collapsible !== false;
        
        /** @type {boolean} Is panel resizable */
        this.resizable = options.resizable !== false;
        
        /** @type {string} Dock position: 'left', 'right', 'bottom', 'float' */
        this.dockPosition = options.dockPosition || 'right';
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
        
        /** @type {HTMLElement|null} Header element */
        this.header = null;
        
        /** @type {HTMLElement|null} Content element */
        this.content = null;
        
        /** @type {PanelContainer|null} Parent container */
        this.container = null;
    }

    /**
     * Render panel
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'panel';
        this.element.setAttribute('data-id', this.id);
        this.element.style.width = `${this.width}px`;

        // Header
        this.header = document.createElement('div');
        this.header.className = 'panel-header';

        const titleContainer = document.createElement('div');
        titleContainer.className = 'panel-title';

        if (this.icon) {
            const iconEl = document.createElement('span');
            iconEl.className = 'panel-icon';
            iconEl.textContent = this.icon;
            titleContainer.appendChild(iconEl);
        }

        const titleText = document.createElement('span');
        titleText.className = 'panel-title-text';
        titleText.textContent = this.title;
        titleContainer.appendChild(titleText);

        this.header.appendChild(titleContainer);

        // Header buttons
        const buttons = document.createElement('div');
        buttons.className = 'panel-buttons';

        if (this.collapsible) {
            const collapseBtn = document.createElement('button');
            collapseBtn.className = 'panel-button panel-collapse-btn';
            collapseBtn.innerHTML = '▼';
            collapseBtn.title = 'Collapse';
            collapseBtn.addEventListener('click', () => this.toggle());
            buttons.appendChild(collapseBtn);
        }

        if (this.closable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'panel-button panel-close-btn';
            closeBtn.innerHTML = '×';
            closeBtn.title = 'Close';
            closeBtn.addEventListener('click', () => this.close());
            buttons.appendChild(closeBtn);
        }

        this.header.appendChild(buttons);
        this.element.appendChild(this.header);

        // Content
        this.content = document.createElement('div');
        this.content.className = 'panel-content';
        this.element.appendChild(this.content);

        // Resize handle
        if (this.resizable) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'panel-resize-handle';
            this.element.appendChild(resizeHandle);
            this._bindResize(resizeHandle);
        }

        this._bindDrag();
        this.update();

        return this.element;
    }

    /**
     * Render panel content (override in subclasses)
     * @returns {HTMLElement|string}
     */
    renderContent() {
        return '';
    }

    /**
     * Refresh panel content
     */
    refresh() {
        if (this.content) {
            const rendered = this.renderContent();
            if (typeof rendered === 'string') {
                this.content.innerHTML = rendered;
            } else if (rendered instanceof HTMLElement) {
                this.content.innerHTML = '';
                this.content.appendChild(rendered);
            }
        }
    }

    /**
     * Bind drag functionality
     * @private
     */
    _bindDrag() {
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;

        this.header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.panel-button')) return;
            if (this.dockPosition !== 'float') return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = this.element.offsetLeft;
            startTop = this.element.offsetTop;

            this.element.classList.add('dragging');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            this.element.style.left = `${startLeft + dx}px`;
            this.element.style.top = `${startTop + dy}px`;
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

            // Resize based on dock position
            let newWidth = startWidth;
            let newHeight = startHeight;

            if (this.dockPosition === 'left' || this.dockPosition === 'float') {
                newWidth = startWidth + dx;
            } else if (this.dockPosition === 'right') {
                newWidth = startWidth - dx;
            }

            if (this.dockPosition === 'bottom' || this.dockPosition === 'float') {
                newHeight = startHeight + dy;
            }

            this.width = Math.max(this.minWidth, newWidth);
            this.height = Math.max(this.minHeight, newHeight);

            this.element.style.width = `${this.width}px`;
            if (this.dockPosition === 'bottom' || this.dockPosition === 'float') {
                this.element.style.height = `${this.height}px`;
            }

            this.emit('resize', { width: this.width, height: this.height });
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                this.element.classList.remove('resizing');
            }
        });
    }

    /**
     * Update visual state
     */
    update() {
        if (!this.element) return;

        this.element.classList.toggle('collapsed', this.collapsed);
        this.element.classList.toggle('hidden', !this.visible);
        this.element.classList.toggle('floating', this.dockPosition === 'float');

        // Update collapse button
        const collapseBtn = this.element.querySelector('.panel-collapse-btn');
        if (collapseBtn) {
            collapseBtn.innerHTML = this.collapsed ? '▶' : '▼';
        }
    }

    /**
     * Toggle collapsed state
     */
    toggle() {
        this.collapsed = !this.collapsed;
        this.update();
        this.emit('toggle', this.collapsed);
    }

    /**
     * Expand panel
     */
    expand() {
        if (this.collapsed) {
            this.collapsed = false;
            this.update();
            this.emit('toggle', false);
        }
    }

    /**
     * Collapse panel
     */
    collapse() {
        if (!this.collapsed) {
            this.collapsed = true;
            this.update();
            this.emit('toggle', true);
        }
    }

    /**
     * Show panel
     */
    show() {
        this.visible = true;
        this.update();
        this.emit('show');
    }

    /**
     * Hide panel
     */
    hide() {
        this.visible = false;
        this.update();
        this.emit('hide');
    }

    /**
     * Close panel
     */
    close() {
        this.hide();
        this.emit('close');
    }

    /**
     * Destroy panel
     */
    destroy() {
        this.element?.remove();
        this.emit('destroy');
    }
}

// ==========================================
// PANEL CONTAINER
// ==========================================

/**
 * PanelContainer - Container for docked panels
 */
export class PanelContainer extends EventEmitter {
    /**
     * Create a panel container
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Container identifier */
        this.id = options.id || `container_${Date.now()}`;
        
        /** @type {string} Dock position: 'left', 'right', 'bottom' */
        this.position = options.position || 'right';
        
        /** @type {number} Container width (for left/right) */
        this.width = options.width || 250;
        
        /** @type {number} Container height (for bottom) */
        this.height = options.height || 200;
        
        /** @type {number} Minimum width */
        this.minWidth = options.minWidth || 150;
        
        /** @type {number} Minimum height */
        this.minHeight = options.minHeight || 100;
        
        /** @type {boolean} Is container collapsed */
        this.collapsed = options.collapsed || false;
        
        /** @type {boolean} Is container visible */
        this.visible = options.visible !== false;
        
        /** @type {Array<Panel>} Panels in container */
        this.panels = [];
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
        
        /** @type {HTMLElement|null} Panels container */
        this.panelsEl = null;
    }

    /**
     * Add panel to container
     * @param {Panel} panel
     */
    addPanel(panel) {
        panel.container = this;
        panel.dockPosition = this.position;
        this.panels.push(panel);

        panel.on('close', () => {
            this.removePanel(panel);
        });

        if (this.panelsEl) {
            this.panelsEl.appendChild(panel.render());
            panel.refresh();
        }
    }

    /**
     * Remove panel from container
     * @param {Panel} panel
     */
    removePanel(panel) {
        const index = this.panels.indexOf(panel);
        if (index >= 0) {
            this.panels.splice(index, 1);
            panel.element?.remove();
            panel.container = null;
        }
    }

    /**
     * Get panel by ID
     * @param {string} id
     * @returns {Panel|undefined}
     */
    getPanel(id) {
        return this.panels.find(p => p.id === id);
    }

    /**
     * Render container
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = `panel-container panel-container-${this.position}`;
        this.element.setAttribute('data-id', this.id);

        if (this.position === 'left' || this.position === 'right') {
            this.element.style.width = `${this.width}px`;
        } else {
            this.element.style.height = `${this.height}px`;
        }

        // Resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'panel-container-resize';
        this.element.appendChild(resizeHandle);
        this._bindResize(resizeHandle);

        // Panels container
        this.panelsEl = document.createElement('div');
        this.panelsEl.className = 'panel-container-panels';
        this.element.appendChild(this.panelsEl);

        // Add existing panels
        for (const panel of this.panels) {
            this.panelsEl.appendChild(panel.render());
            panel.refresh();
        }

        this.update();

        return this.element;
    }

    /**
     * Bind resize functionality
     * @private
     */
    _bindResize(handle) {
        let isResizing = false;
        let startX, startY;
        let startSize;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startSize = this.position === 'bottom' ? this.height : this.width;

            this.element.classList.add('resizing');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            if (this.position === 'left') {
                const dx = e.clientX - startX;
                this.width = Math.max(this.minWidth, startSize + dx);
                this.element.style.width = `${this.width}px`;
            } else if (this.position === 'right') {
                const dx = startX - e.clientX;
                this.width = Math.max(this.minWidth, startSize + dx);
                this.element.style.width = `${this.width}px`;
            } else if (this.position === 'bottom') {
                const dy = startY - e.clientY;
                this.height = Math.max(this.minHeight, startSize + dy);
                this.element.style.height = `${this.height}px`;
            }

            this.emit('resize', { width: this.width, height: this.height });
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                this.element.classList.remove('resizing');
            }
        });
    }

    /**
     * Update visual state
     */
    update() {
        if (!this.element) return;

        this.element.classList.toggle('collapsed', this.collapsed);
        this.element.classList.toggle('hidden', !this.visible);
    }

    /**
     * Toggle collapsed state
     */
    toggle() {
        this.collapsed = !this.collapsed;
        this.update();
        this.emit('toggle', this.collapsed);
    }

    /**
     * Show container
     */
    show() {
        this.visible = true;
        this.update();
    }

    /**
     * Hide container
     */
    hide() {
        this.visible = false;
        this.update();
    }

    /**
     * Destroy container
     */
    destroy() {
        for (const panel of this.panels) {
            panel.destroy();
        }
        this.element?.remove();
    }
}

// ==========================================
// PANEL MANAGER
// ==========================================

/**
 * PanelManager - Manages all panels and containers
 */
export class PanelManager extends EventEmitter {
    /**
     * Create a panel manager
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {HTMLElement|null} Root container */
        this.root = options.root || null;
        
        /** @type {Map<string, PanelContainer>} Containers by position */
        this.containers = new Map();
        
        /** @type {Map<string, Panel>} All panels by ID */
        this.panels = new Map();
        
        /** @type {Array<Panel>} Floating panels */
        this.floatingPanels = [];
        
        /** @type {HTMLElement|null} Main area element */
        this.mainArea = null;
    }

    /**
     * Initialize panel manager
     */
    initialize() {
        if (!this.root) {
            this.root = document.body;
        }

        // Create layout structure
        this.mainArea = document.createElement('div');
        this.mainArea.className = 'panel-main-area';

        // Create default containers
        this._createContainer('left');
        this._createContainer('right');
        this._createContainer('bottom');

        // Floating panels container
        const floatingContainer = document.createElement('div');
        floatingContainer.className = 'panel-floating-container';
        this.root.appendChild(floatingContainer);
    }

    /**
     * Create a container at position
     * @private
     */
    _createContainer(position) {
        const container = new PanelContainer({
            id: `container-${position}`,
            position,
            visible: position === 'right'  // Only right is visible by default
        });

        this.containers.set(position, container);
        
        container.on('resize', () => {
            this.emit('layoutChange');
        });
    }

    /**
     * Register a panel
     * @param {Panel} panel
     * @param {string} position - Dock position
     */
    registerPanel(panel, position = 'right') {
        this.panels.set(panel.id, panel);

        if (position === 'float') {
            panel.dockPosition = 'float';
            this.floatingPanels.push(panel);
        } else {
            const container = this.containers.get(position);
            if (container) {
                container.addPanel(panel);
            }
        }

        panel.on('close', () => {
            this.hidePanel(panel.id);
        });
    }

    /**
     * Get panel by ID
     * @param {string} id
     * @returns {Panel|undefined}
     */
    getPanel(id) {
        return this.panels.get(id);
    }

    /**
     * Show panel by ID
     * @param {string} id
     */
    showPanel(id) {
        const panel = this.panels.get(id);
        if (panel) {
            panel.show();
            
            // Ensure container is visible
            if (panel.container) {
                panel.container.show();
            }
        }
    }

    /**
     * Hide panel by ID
     * @param {string} id
     */
    hidePanel(id) {
        const panel = this.panels.get(id);
        if (panel) {
            panel.hide();
        }
    }

    /**
     * Toggle panel visibility
     * @param {string} id
     */
    togglePanel(id) {
        const panel = this.panels.get(id);
        if (panel) {
            if (panel.visible) {
                this.hidePanel(id);
            } else {
                this.showPanel(id);
            }
        }
    }

    /**
     * Move panel to new position
     * @param {string} id
     * @param {string} position
     */
    movePanel(id, position) {
        const panel = this.panels.get(id);
        if (!panel) return;

        // Remove from current container
        if (panel.container) {
            panel.container.removePanel(panel);
        }

        // Remove from floating
        const floatIndex = this.floatingPanels.indexOf(panel);
        if (floatIndex >= 0) {
            this.floatingPanels.splice(floatIndex, 1);
        }

        // Add to new position
        if (position === 'float') {
            panel.dockPosition = 'float';
            this.floatingPanels.push(panel);
        } else {
            const container = this.containers.get(position);
            if (container) {
                container.addPanel(panel);
            }
        }
    }

    /**
     * Render panel manager
     * @param {HTMLElement} target
     * @returns {HTMLElement}
     */
    render(target) {
        const wrapper = document.createElement('div');
        wrapper.className = 'panel-layout';

        // Left container
        const leftContainer = this.containers.get('left');
        if (leftContainer) {
            wrapper.appendChild(leftContainer.render());
        }

        // Main area
        wrapper.appendChild(this.mainArea);

        // Right container
        const rightContainer = this.containers.get('right');
        if (rightContainer) {
            wrapper.appendChild(rightContainer.render());
        }

        // Bottom container (spans full width)
        const bottomContainer = this.containers.get('bottom');
        if (bottomContainer) {
            wrapper.appendChild(bottomContainer.render());
        }

        target.appendChild(wrapper);

        // Render floating panels
        for (const panel of this.floatingPanels) {
            document.body.appendChild(panel.render());
            panel.refresh();
        }

        return wrapper;
    }

    /**
     * Get the main content area
     * @returns {HTMLElement|null}
     */
    getMainArea() {
        return this.mainArea;
    }

    /**
     * Destroy panel manager
     */
    destroy() {
        for (const container of this.containers.values()) {
            container.destroy();
        }
        for (const panel of this.floatingPanels) {
            panel.destroy();
        }
    }
}

// ==========================================
// ACCORDION PANEL
// ==========================================

/**
 * AccordionPanel - Panel with collapsible sections
 */
export class AccordionPanel extends Panel {
    constructor(options = {}) {
        super(options);
        
        /** @type {Array<{title: string, content: string|HTMLElement}>} Sections */
        this.sections = options.sections || [];
        
        /** @type {Set<number>} Expanded section indices */
        this.expandedSections = new Set(options.expandedSections || [0]);
        
        /** @type {boolean} Allow multiple sections open */
        this.allowMultiple = options.allowMultiple !== false;
    }

    /**
     * Add section to accordion
     * @param {string} title
     * @param {string|HTMLElement} content
     */
    addSection(title, content) {
        this.sections.push({ title, content });
        this.refresh();
    }

    /**
     * Render accordion content
     * @returns {HTMLElement}
     */
    renderContent() {
        const container = document.createElement('div');
        container.className = 'accordion';

        for (let i = 0; i < this.sections.length; i++) {
            const section = this.sections[i];
            const isExpanded = this.expandedSections.has(i);

            const sectionEl = document.createElement('div');
            sectionEl.className = 'accordion-section';
            sectionEl.classList.toggle('expanded', isExpanded);

            const header = document.createElement('div');
            header.className = 'accordion-header';
            header.innerHTML = `
                <span class="accordion-arrow">${isExpanded ? '▼' : '▶'}</span>
                <span class="accordion-title">${section.title}</span>
            `;

            header.addEventListener('click', () => {
                this._toggleSection(i);
            });

            const content = document.createElement('div');
            content.className = 'accordion-content';
            
            if (typeof section.content === 'string') {
                content.innerHTML = section.content;
            } else if (section.content instanceof HTMLElement) {
                content.appendChild(section.content);
            }

            sectionEl.appendChild(header);
            sectionEl.appendChild(content);
            container.appendChild(sectionEl);
        }

        return container;
    }

    /**
     * Toggle section expansion
     * @private
     */
    _toggleSection(index) {
        if (this.expandedSections.has(index)) {
            this.expandedSections.delete(index);
        } else {
            if (!this.allowMultiple) {
                this.expandedSections.clear();
            }
            this.expandedSections.add(index);
        }
        this.refresh();
        this.emit('sectionToggle', index);
    }

    /**
     * Expand section by index
     * @param {number} index
     */
    expandSection(index) {
        if (!this.allowMultiple) {
            this.expandedSections.clear();
        }
        this.expandedSections.add(index);
        this.refresh();
    }

    /**
     * Collapse section by index
     * @param {number} index
     */
    collapseSection(index) {
        this.expandedSections.delete(index);
        this.refresh();
    }
}

// ==========================================
// TAB PANEL
// ==========================================

/**
 * TabPanel - Panel with tabbed content
 */
export class TabPanel extends Panel {
    constructor(options = {}) {
        super(options);
        
        /** @type {Array<{id: string, title: string, icon: string, content: string|HTMLElement}>} Tabs */
        this.tabs = options.tabs || [];
        
        /** @type {number} Active tab index */
        this.activeTabIndex = options.activeTabIndex || 0;
    }

    /**
     * Add tab
     * @param {string} id
     * @param {string} title
     * @param {string|HTMLElement} content
     * @param {string} icon
     */
    addTab(id, title, content, icon = '') {
        this.tabs.push({ id, title, icon, content });
        this.refresh();
    }

    /**
     * Remove tab by ID
     * @param {string} id
     */
    removeTab(id) {
        const index = this.tabs.findIndex(t => t.id === id);
        if (index >= 0) {
            this.tabs.splice(index, 1);
            if (this.activeTabIndex >= this.tabs.length) {
                this.activeTabIndex = Math.max(0, this.tabs.length - 1);
            }
            this.refresh();
        }
    }

    /**
     * Select tab by ID
     * @param {string} id
     */
    selectTab(id) {
        const index = this.tabs.findIndex(t => t.id === id);
        if (index >= 0) {
            this.activeTabIndex = index;
            this.refresh();
            this.emit('tabChange', this.tabs[index]);
        }
    }

    /**
     * Render tab content
     * @returns {HTMLElement}
     */
    renderContent() {
        const container = document.createElement('div');
        container.className = 'tab-panel';

        // Tab bar
        const tabBar = document.createElement('div');
        tabBar.className = 'tab-bar';

        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const tabEl = document.createElement('button');
            tabEl.className = 'tab';
            tabEl.classList.toggle('active', i === this.activeTabIndex);

            if (tab.icon) {
                const iconEl = document.createElement('span');
                iconEl.className = 'tab-icon';
                iconEl.textContent = tab.icon;
                tabEl.appendChild(iconEl);
            }

            const titleEl = document.createElement('span');
            titleEl.className = 'tab-title';
            titleEl.textContent = tab.title;
            tabEl.appendChild(titleEl);

            tabEl.addEventListener('click', () => {
                this.activeTabIndex = i;
                this.refresh();
                this.emit('tabChange', tab);
            });

            tabBar.appendChild(tabEl);
        }

        container.appendChild(tabBar);

        // Tab content
        const contentEl = document.createElement('div');
        contentEl.className = 'tab-content';

        const activeTab = this.tabs[this.activeTabIndex];
        if (activeTab) {
            if (typeof activeTab.content === 'string') {
                contentEl.innerHTML = activeTab.content;
            } else if (activeTab.content instanceof HTMLElement) {
                contentEl.appendChild(activeTab.content);
            }
        }

        container.appendChild(contentEl);

        return container;
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    Panel,
    PanelContainer,
    PanelManager,
    AccordionPanel,
    TabPanel
};
