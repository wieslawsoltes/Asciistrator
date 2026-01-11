/**
 * Asciistrator - UI Module Index
 * 
 * Exports all UI components and panels.
 */

// Core UI Components
export { MenuItem, Menu, MenuBar, ContextMenu as MenuContextMenu, createDefaultMenuBar } from './menu.js';
export { ToolbarButton, ToolbarGroup, ToolbarSeparator, Toolbar, ToolIcons, createDefaultToolbar } from './toolbar.js';
export { StatusItem, StatusBar, createDefaultStatusBar, StatusBarController } from './statusbar.js';
export { Panel, PanelContainer, PanelManager, AccordionPanel, TabPanel } from './panels.js';
export { 
    DialogButton, 
    Dialog, 
    AlertDialog, 
    ConfirmDialog, 
    PromptDialog, 
    FormField, 
    FormDialog,
    alert,
    confirm,
    prompt
} from './dialogs.js';

// Animation System
export { 
    Easing, 
    Tween, 
    Timeline, 
    Transition, 
    Spring,
    animationLoop,
    nextFrame,
    waitFrames,
    animate
} from './animations.js';

// Keyboard Shortcuts
export {
    ShortcutManager,
    DefaultShortcuts,
    parseShortcut,
    formatShortcut,
    matchesShortcut,
    createDefaultShortcutManager,
    Platform,
    KeyNames
} from './shortcuts.js';

// Context Menus
export {
    ContextMenu as ContextMenuWidget,
    MenuItemType,
    menuItem,
    separator,
    submenu,
    checkbox,
    radio,
    getContextMenu,
    showContextMenu,
    attachContextMenu
} from './contextmenu.js';

// Tooltips
export {
    TooltipManager,
    TooltipPlacement,
    getTooltipManager,
    setTooltip,
    removeTooltip,
    showTooltipAt
} from './tooltips.js';

// Accessibility
export {
    AriaLive,
    AriaRole,
    setAriaAttrs,
    setRole,
    makeButton,
    makeCheckbox,
    setChecked,
    announce,
    alertMessage,
    FocusManager,
    RovingTabindex,
    createSkipLink,
    prefersReducedMotion,
    prefersHighContrast,
    onPreferenceChange,
    setupArrowKeyNavigation,
    makeDialogAccessible
} from './accessibility.js';

// Panels
export { LayerItem, LayersPanel } from './panels/layers.js';
export { 
    PropertyEditor, 
    VectorEditor, 
    TransformSection, 
    StyleSection, 
    TextSection, 
    PropertiesPanel 
} from './panels/properties.js';
export { 
    CharacterPalettes, 
    RecentManager, 
    CharacterSwatch, 
    CharacterPalette, 
    ColorPanel 
} from './panels/color.js';
export { 
    CharacterCategories, 
    CharacterGrid, 
    CharacterSearch, 
    CharacterPickerPanel 
} from './panels/characters.js';
export { 
    HistoryEntry, 
    HistoryManager, 
    HistoryIcons, 
    getHistoryIcon, 
    HistoryPanel,
    createObjectHistoryEntry,
    deleteObjectHistoryEntry,
    transformHistoryEntry,
    styleHistoryEntry
} from './panels/history.js';

// ==========================================
// UI MANAGER
// ==========================================

// Import required modules for UIManager (using already exported references)
import { HistoryManager as _HistoryManager } from './panels/history.js';
import { PanelManager as _PanelManager } from './panels.js';
import { createDefaultMenuBar as _createDefaultMenuBar } from './menu.js';
import { createDefaultToolbar as _createDefaultToolbar } from './toolbar.js';
import { createDefaultStatusBar as _createDefaultStatusBar, StatusBarController as _StatusBarController } from './statusbar.js';
import { LayersPanel as _LayersPanel } from './panels/layers.js';
import { PropertiesPanel as _PropertiesPanel } from './panels/properties.js';
import { ColorPanel as _ColorPanel } from './panels/color.js';
import { CharacterPickerPanel as _CharacterPickerPanel } from './panels/characters.js';
import { HistoryPanel as _HistoryPanel } from './panels/history.js';
import { alert as _alert, confirm as _confirm, prompt as _prompt } from './dialogs.js';

/**
 * UIManager - Central manager for all UI components
 */
export class UIManager {
    /**
     * Create UI manager
     * @param {object} options
     */
    constructor(options = {}) {
        /** @type {HTMLElement} Root container */
        this.root = options.root || document.body;
        
        /** @type {MenuBar|null} Menu bar */
        this.menuBar = null;
        
        /** @type {Toolbar|null} Main toolbar */
        this.toolbar = null;
        
        /** @type {StatusBar|null} Status bar */
        this.statusBar = null;
        
        /** @type {StatusBarController|null} Status bar controller */
        this.statusController = null;
        
        /** @type {PanelManager|null} Panel manager */
        this.panelManager = null;
        
        /** @type {HistoryManager|null} History manager */
        this.historyManager = null;
        
        /** @type {Map<string, Panel>} Registered panels */
        this.panels = new Map();
        
        /** @type {object} Event handlers */
        this.handlers = options.handlers || {};
    }

    /**
     * Initialize all UI components
     */
    initialize() {
        // Create main layout structure
        this._createLayout();
        
        // Initialize history manager
        this.historyManager = new _HistoryManager();
        
        // Initialize panel manager
        this.panelManager = new _PanelManager({ root: this.root });
        this.panelManager.initialize();
        
        // Create default UI components
        this._createMenuBar();
        this._createToolbar();
        this._createStatusBar();
        this._createDefaultPanels();
    }

    /**
     * Create main layout structure
     * @private
     */
    _createLayout() {
        // Add app class to root
        this.root.classList.add('asciistrator-app');
        
        // Create header (menu bar)
        const header = document.createElement('header');
        header.className = 'app-header';
        header.id = 'app-header';
        this.root.appendChild(header);
        
        // Create main content area
        const main = document.createElement('main');
        main.className = 'app-main';
        main.id = 'app-main';
        this.root.appendChild(main);
        
        // Create toolbar area (left)
        const toolbarArea = document.createElement('aside');
        toolbarArea.className = 'app-toolbar';
        toolbarArea.id = 'app-toolbar';
        main.appendChild(toolbarArea);
        
        // Create canvas area (center)
        const canvasArea = document.createElement('div');
        canvasArea.className = 'app-canvas';
        canvasArea.id = 'app-canvas';
        main.appendChild(canvasArea);
        
        // Create panel area (right)
        const panelArea = document.createElement('aside');
        panelArea.className = 'app-panels';
        panelArea.id = 'app-panels';
        main.appendChild(panelArea);
        
        // Create footer (status bar)
        const footer = document.createElement('footer');
        footer.className = 'app-footer';
        footer.id = 'app-footer';
        this.root.appendChild(footer);
    }

    /**
     * Create menu bar
     * @private
     */
    _createMenuBar() {
        this.menuBar = _createDefaultMenuBar(this.handlers);
        
        const header = document.getElementById('app-header');
        if (header) {
            this.menuBar.container = header;
            this.menuBar.render();
        }
    }

    /**
     * Create toolbar
     * @private
     */
    _createToolbar() {
        this.toolbar = _createDefaultToolbar(this.handlers);
        
        const toolbarArea = document.getElementById('app-toolbar');
        if (toolbarArea) {
            this.toolbar.container = toolbarArea;
            this.toolbar.render();
        }
    }

    /**
     * Create status bar
     * @private
     */
    _createStatusBar() {
        this.statusBar = _createDefaultStatusBar();
        this.statusController = new _StatusBarController(this.statusBar);
        
        const footer = document.getElementById('app-footer');
        if (footer) {
            this.statusBar.container = footer;
            this.statusBar.render();
        }
    }

    /**
     * Create default panels
     * @private
     */
    _createDefaultPanels() {
        // Layers panel
        const layersPanel = new _LayersPanel();
        this.registerPanel(layersPanel, 'right');
        
        // Properties panel
        const propsPanel = new _PropertiesPanel();
        this.registerPanel(propsPanel, 'right');
        
        // Color panel
        const colorPanel = new _ColorPanel();
        this.registerPanel(colorPanel, 'right');
        
        // Character picker panel
        const charPanel = new _CharacterPickerPanel();
        this.registerPanel(charPanel, 'right');
        charPanel.hide();  // Hidden by default
        
        // History panel
        const historyPanel = new _HistoryPanel();
        historyPanel.setHistoryManager(this.historyManager);
        this.registerPanel(historyPanel, 'right');
        historyPanel.hide();  // Hidden by default
    }

    /**
     * Register a panel
     * @param {Panel} panel
     * @param {string} position
     */
    registerPanel(panel, position = 'right') {
        this.panels.set(panel.id, panel);
        
        if (this.panelManager) {
            this.panelManager.registerPanel(panel, position);
        }
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
     * Show/hide panel
     * @param {string} id
     * @param {boolean} visible
     */
    setPanelVisible(id, visible) {
        const panel = this.panels.get(id);
        if (panel) {
            if (visible) {
                panel.show();
            } else {
                panel.hide();
            }
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
                panel.hide();
            } else {
                panel.show();
            }
        }
    }

    /**
     * Get canvas area element
     * @returns {HTMLElement|null}
     */
    getCanvasArea() {
        return document.getElementById('app-canvas');
    }

    /**
     * Update tool selection in toolbar
     * @param {string} toolId
     */
    selectTool(toolId) {
        this.toolbar?.selectTool(toolId);
    }

    /**
     * Update status bar
     * @param {object} status
     */
    updateStatus(status) {
        if (!this.statusController) return;
        
        if (status.tool) {
            this.statusController.setTool(status.tool.name, status.tool.icon);
        }
        if (status.selection !== undefined) {
            this.statusController.setSelection(status.selection.count, status.selection.type);
        }
        if (status.cursor) {
            this.statusController.setCursor(status.cursor.x, status.cursor.y);
        }
        if (status.zoom !== undefined) {
            this.statusController.setZoom(status.zoom);
        }
        if (status.layer) {
            this.statusController.setLayer(status.layer);
        }
        if (status.objects !== undefined) {
            this.statusController.setObjectCount(status.objects);
        }
        if (status.document) {
            this.statusController.setDocument(status.document.name, status.document.modified);
        }
        if (status.canvasSize) {
            this.statusController.setCanvasSize(status.canvasSize.width, status.canvasSize.height);
        }
    }

    /**
     * Show alert dialog
     * @param {string} message
     * @param {string} title
     * @returns {Promise}
     */
    async alert(message, title = 'Alert') {
        return _alert(message, title);
    }

    /**
     * Show confirm dialog
     * @param {string} message
     * @param {string} title
     * @returns {Promise<boolean>}
     */
    async confirm(message, title = 'Confirm') {
        return _confirm(message, title);
    }

    /**
     * Show prompt dialog
     * @param {string} label
     * @param {string} defaultValue
     * @param {string} title
     * @returns {Promise<string|null>}
     */
    async prompt(label, defaultValue = '', title = 'Input') {
        return _prompt(label, defaultValue, title);
    }

    /**
     * Destroy UI manager
     */
    destroy() {
        this.menuBar?.destroy();
        this.toolbar?.destroy();
        this.statusBar?.destroy();
        this.panelManager?.destroy();
        
        for (const panel of this.panels.values()) {
            panel.destroy();
        }
        
        this.panels.clear();
    }
}

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Create a complete UI setup
 * @param {HTMLElement} root
 * @param {object} handlers
 * @returns {object} UI components
 */
export function createUI(root, handlers = {}) {
    return {
        menuBar: _createDefaultMenuBar(handlers),
        toolbar: _createDefaultToolbar(handlers),
        statusBar: _createDefaultStatusBar(),
        panelManager: new _PanelManager({ root }),
        historyManager: new _HistoryManager()
    };
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    // Core Components
    MenuItem,
    Menu,
    MenuBar,
    MenuContextMenu,
    createDefaultMenuBar,
    
    ToolbarButton,
    ToolbarGroup,
    Toolbar,
    ToolIcons,
    createDefaultToolbar,
    
    StatusItem,
    StatusBar,
    StatusBarController,
    createDefaultStatusBar,
    
    Panel,
    PanelContainer,
    PanelManager,
    AccordionPanel,
    TabPanel,
    
    Dialog,
    AlertDialog,
    ConfirmDialog,
    PromptDialog,
    FormDialog,
    
    // Animation
    Easing,
    Tween,
    Timeline,
    Transition,
    Spring,
    
    // Shortcuts
    ShortcutManager,
    DefaultShortcuts,
    parseShortcut,
    formatShortcut,
    
    // Context Menu
    ContextMenuWidget,
    MenuItemType,
    menuItem,
    separator,
    submenu,
    
    // Tooltips
    TooltipManager,
    TooltipPlacement,
    getTooltipManager,
    setTooltip,
    
    // Accessibility
    AriaLive,
    AriaRole,
    FocusManager,
    RovingTabindex,
    announce,
    
    // Panels
    LayersPanel,
    PropertiesPanel,
    ColorPanel,
    CharacterPickerPanel,
    HistoryPanel,
    HistoryManager,
    
    // Manager
    UIManager,
    createUI
};
