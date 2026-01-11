/**
 * Asciistrator - Color Panel
 * 
 * Color picker and palette management for ASCII art styles.
 */

import { Panel } from '../panels.js';
import { EventEmitter } from '../../utils/events.js';

// ==========================================
// ASCII COLOR PALETTES
// ==========================================

/**
 * Default ASCII character palettes for "shading"
 */
export const CharacterPalettes = {
    // Density-based palettes (light to dark)
    standard: [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'],
    blocks: [' ', '░', '▒', '▓', '█'],
    dots: [' ', '·', '∘', '●', '⬤'],
    lines: [' ', '─', '═', '━', '▬'],
    shading: [' ', '░', '▒', '▓', '█', '▀', '▄', '▌', '▐'],
    
    // Special character sets
    box: ['┌', '┐', '└', '┘', '─', '│', '├', '┤', '┬', '┴', '┼'],
    boxDouble: ['╔', '╗', '╚', '╝', '═', '║', '╠', '╣', '╦', '╩', '╬'],
    boxRounded: ['╭', '╮', '╰', '╯', '─', '│'],
    arrows: ['←', '→', '↑', '↓', '↖', '↗', '↘', '↙', '↔', '↕'],
    geometric: ['■', '□', '▪', '▫', '●', '○', '◆', '◇', '▲', '△'],
    
    // Decorative
    stars: ['✦', '✧', '★', '☆', '✩', '✪', '✫', '✬', '✭', '✮'],
    hearts: ['♡', '♥', '❤', '❥', '❣'],
    musical: ['♩', '♪', '♫', '♬', '♭', '♮', '♯'],
    
    // Fill characters
    fill: ['█', '▓', '▒', '░', '▀', '▄', '▌', '▐', '▆', '▇']
};

/**
 * Recent colors/characters storage
 */
export const RecentManager = {
    maxItems: 16,
    _fillRecent: [],
    _strokeRecent: [],

    addFill(char) {
        this._addRecent(this._fillRecent, char);
    },

    addStroke(char) {
        this._addRecent(this._strokeRecent, char);
    },

    _addRecent(list, char) {
        const index = list.indexOf(char);
        if (index >= 0) {
            list.splice(index, 1);
        }
        list.unshift(char);
        if (list.length > this.maxItems) {
            list.pop();
        }
    },

    getFillRecent() {
        return [...this._fillRecent];
    },

    getStrokeRecent() {
        return [...this._strokeRecent];
    }
};

// ==========================================
// COLOR/CHARACTER SWATCH
// ==========================================

/**
 * CharacterSwatch - Single character/color swatch
 */
export class CharacterSwatch extends EventEmitter {
    /**
     * Create character swatch
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Character value */
        this.character = options.character || ' ';
        
        /** @type {string} Tooltip/label */
        this.label = options.label || '';
        
        /** @type {boolean} Is selected */
        this.selected = options.selected || false;
        
        /** @type {string} Size: 'small', 'medium', 'large' */
        this.size = options.size || 'medium';
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
    }

    /**
     * Render swatch
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('button');
        this.element.className = `character-swatch swatch-${this.size}`;
        this.element.textContent = this.character;
        this.element.title = this.label || this.character;

        if (this.selected) {
            this.element.classList.add('selected');
        }

        this.element.addEventListener('click', () => {
            this.emit('select', this.character);
        });

        return this.element;
    }

    /**
     * Set selected state
     * @param {boolean} selected
     */
    setSelected(selected) {
        this.selected = selected;
        this.element?.classList.toggle('selected', selected);
    }
}

// ==========================================
// CHARACTER PALETTE
// ==========================================

/**
 * CharacterPalette - Grid of character swatches
 */
export class CharacterPalette extends EventEmitter {
    /**
     * Create character palette
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Palette name */
        this.name = options.name || 'Palette';
        
        /** @type {Array<string>} Characters in palette */
        this.characters = options.characters || [];
        
        /** @type {number} Columns in grid */
        this.columns = options.columns || 8;
        
        /** @type {string} Currently selected character */
        this.selected = options.selected || null;
        
        /** @type {Array<CharacterSwatch>} Swatches */
        this.swatches = [];
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
    }

    /**
     * Render palette
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'character-palette';

        const header = document.createElement('div');
        header.className = 'palette-header';
        header.textContent = this.name;
        this.element.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'palette-grid';
        grid.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;

        for (const char of this.characters) {
            const swatch = new CharacterSwatch({
                character: char,
                selected: char === this.selected
            });

            swatch.on('select', (selectedChar) => {
                this._selectCharacter(selectedChar);
            });

            this.swatches.push(swatch);
            grid.appendChild(swatch.render());
        }

        this.element.appendChild(grid);

        return this.element;
    }

    /**
     * Select character
     * @private
     */
    _selectCharacter(char) {
        this.selected = char;
        
        for (const swatch of this.swatches) {
            swatch.setSelected(swatch.character === char);
        }
        
        this.emit('select', char);
    }

    /**
     * Set characters
     * @param {Array<string>} characters
     */
    setCharacters(characters) {
        this.characters = characters;
        this.swatches = [];
        
        if (this.element) {
            const grid = this.element.querySelector('.palette-grid');
            if (grid) {
                grid.innerHTML = '';
                for (const char of characters) {
                    const swatch = new CharacterSwatch({
                        character: char,
                        selected: char === this.selected
                    });
                    swatch.on('select', (c) => this._selectCharacter(c));
                    this.swatches.push(swatch);
                    grid.appendChild(swatch.render());
                }
            }
        }
    }
}

// ==========================================
// COLOR PANEL
// ==========================================

/**
 * ColorPanel - Color/character selection panel
 */
export class ColorPanel extends Panel {
    /**
     * Create color panel
     * @param {object} options
     */
    constructor(options = {}) {
        super({
            id: 'colors',
            title: 'Colors',
            icon: '🎨',
            width: 250,
            ...options
        });
        
        /** @type {string} Current fill character */
        this.fillChar = options.fillChar || '█';
        
        /** @type {string} Current stroke character */
        this.strokeChar = options.strokeChar || '─';
        
        /** @type {string} Active mode: 'fill' or 'stroke' */
        this.activeMode = 'fill';
        
        /** @type {string} Current palette name */
        this.currentPalette = 'standard';
        
        /** @type {CharacterPalette|null} Main palette */
        this.mainPalette = null;
        
        /** @type {CharacterPalette|null} Recent palette */
        this.recentPalette = null;
    }

    /**
     * Render panel content
     * @returns {HTMLElement}
     */
    renderContent() {
        const container = document.createElement('div');
        container.className = 'color-panel';

        // Fill/Stroke selectors
        const colorSelectors = document.createElement('div');
        colorSelectors.className = 'color-selectors';

        // Fill box
        const fillBox = document.createElement('div');
        fillBox.className = 'color-selector fill-selector active';
        fillBox.innerHTML = `
            <div class="color-preview fill-preview">${this.fillChar}</div>
            <span class="color-label">Fill</span>
        `;
        fillBox.addEventListener('click', () => this._setActiveMode('fill'));
        colorSelectors.appendChild(fillBox);

        // Stroke box
        const strokeBox = document.createElement('div');
        strokeBox.className = 'color-selector stroke-selector';
        strokeBox.innerHTML = `
            <div class="color-preview stroke-preview">${this.strokeChar}</div>
            <span class="color-label">Stroke</span>
        `;
        strokeBox.addEventListener('click', () => this._setActiveMode('stroke'));
        colorSelectors.appendChild(strokeBox);

        // Swap button
        const swapBtn = document.createElement('button');
        swapBtn.className = 'color-swap-btn';
        swapBtn.innerHTML = '⇄';
        swapBtn.title = 'Swap fill and stroke';
        swapBtn.addEventListener('click', () => this._swapColors());
        colorSelectors.appendChild(swapBtn);

        container.appendChild(colorSelectors);

        // Palette selector
        const paletteSelector = document.createElement('div');
        paletteSelector.className = 'palette-selector';

        const paletteLabel = document.createElement('label');
        paletteLabel.textContent = 'Palette: ';
        paletteSelector.appendChild(paletteLabel);

        const paletteSelect = document.createElement('select');
        paletteSelect.className = 'palette-select';
        
        const paletteNames = Object.keys(CharacterPalettes);
        for (const name of paletteNames) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
            if (name === this.currentPalette) option.selected = true;
            paletteSelect.appendChild(option);
        }

        paletteSelect.addEventListener('change', () => {
            this._changePalette(paletteSelect.value);
        });

        paletteSelector.appendChild(paletteSelect);
        container.appendChild(paletteSelector);

        // Main palette
        this.mainPalette = new CharacterPalette({
            name: 'Characters',
            characters: CharacterPalettes[this.currentPalette] || [],
            columns: 8,
            selected: this.activeMode === 'fill' ? this.fillChar : this.strokeChar
        });

        this.mainPalette.on('select', (char) => {
            this._selectCharacter(char);
        });

        container.appendChild(this.mainPalette.render());

        // Custom character input
        const customInput = document.createElement('div');
        customInput.className = 'custom-character';
        customInput.innerHTML = `
            <label>Custom:</label>
            <input type="text" class="custom-char-input" maxlength="1" placeholder="Enter character">
            <button class="custom-char-btn">Apply</button>
        `;

        const input = customInput.querySelector('.custom-char-input');
        const applyBtn = customInput.querySelector('.custom-char-btn');

        applyBtn.addEventListener('click', () => {
            if (input.value) {
                this._selectCharacter(input.value);
                input.value = '';
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value) {
                this._selectCharacter(input.value);
                input.value = '';
            }
        });

        container.appendChild(customInput);

        // Recent characters
        this.recentPalette = new CharacterPalette({
            name: 'Recent',
            characters: this._getRecentCharacters(),
            columns: 8
        });

        this.recentPalette.on('select', (char) => {
            this._selectCharacter(char);
        });

        container.appendChild(this.recentPalette.render());

        // Quick presets
        const presets = document.createElement('div');
        presets.className = 'color-presets';
        presets.innerHTML = '<div class="presets-label">Quick Presets:</div>';

        const presetData = [
            { fill: '█', stroke: '─', label: 'Standard' },
            { fill: '▓', stroke: '│', label: 'Dense' },
            { fill: '░', stroke: '·', label: 'Light' },
            { fill: '#', stroke: '-', label: 'ASCII' },
            { fill: '●', stroke: '○', label: 'Dots' }
        ];

        for (const preset of presetData) {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.innerHTML = `<span class="preset-fill">${preset.fill}</span><span class="preset-stroke">${preset.stroke}</span>`;
            btn.title = preset.label;
            btn.addEventListener('click', () => {
                this._applyPreset(preset.fill, preset.stroke);
            });
            presets.appendChild(btn);
        }

        container.appendChild(presets);

        return container;
    }

    /**
     * Set active mode (fill/stroke)
     * @private
     */
    _setActiveMode(mode) {
        this.activeMode = mode;

        const fillSelector = this.content?.querySelector('.fill-selector');
        const strokeSelector = this.content?.querySelector('.stroke-selector');

        fillSelector?.classList.toggle('active', mode === 'fill');
        strokeSelector?.classList.toggle('active', mode === 'stroke');

        // Update palette selection
        if (this.mainPalette) {
            const selected = mode === 'fill' ? this.fillChar : this.strokeChar;
            this.mainPalette.selected = selected;
            for (const swatch of this.mainPalette.swatches) {
                swatch.setSelected(swatch.character === selected);
            }
        }
    }

    /**
     * Select character
     * @private
     */
    _selectCharacter(char) {
        if (this.activeMode === 'fill') {
            this.fillChar = char;
            RecentManager.addFill(char);
            this._updatePreview('.fill-preview', char);
        } else {
            this.strokeChar = char;
            RecentManager.addStroke(char);
            this._updatePreview('.stroke-preview', char);
        }

        // Update recent palette
        this.recentPalette?.setCharacters(this._getRecentCharacters());

        this.emit('colorChange', {
            mode: this.activeMode,
            character: char,
            fill: this.fillChar,
            stroke: this.strokeChar
        });
    }

    /**
     * Update preview display
     * @private
     */
    _updatePreview(selector, char) {
        const preview = this.content?.querySelector(selector);
        if (preview) {
            preview.textContent = char;
        }
    }

    /**
     * Swap fill and stroke
     * @private
     */
    _swapColors() {
        const temp = this.fillChar;
        this.fillChar = this.strokeChar;
        this.strokeChar = temp;

        this._updatePreview('.fill-preview', this.fillChar);
        this._updatePreview('.stroke-preview', this.strokeChar);

        this.emit('colorChange', {
            mode: 'swap',
            fill: this.fillChar,
            stroke: this.strokeChar
        });
    }

    /**
     * Change palette
     * @private
     */
    _changePalette(paletteName) {
        this.currentPalette = paletteName;
        const characters = CharacterPalettes[paletteName] || [];
        this.mainPalette?.setCharacters(characters);
    }

    /**
     * Apply preset
     * @private
     */
    _applyPreset(fill, stroke) {
        this.fillChar = fill;
        this.strokeChar = stroke;

        this._updatePreview('.fill-preview', fill);
        this._updatePreview('.stroke-preview', stroke);

        RecentManager.addFill(fill);
        RecentManager.addStroke(stroke);
        this.recentPalette?.setCharacters(this._getRecentCharacters());

        this.emit('colorChange', {
            mode: 'preset',
            fill: this.fillChar,
            stroke: this.strokeChar
        });
    }

    /**
     * Get recent characters
     * @private
     */
    _getRecentCharacters() {
        const fillRecent = RecentManager.getFillRecent();
        const strokeRecent = RecentManager.getStrokeRecent();
        
        // Merge and deduplicate
        const all = [...new Set([...fillRecent, ...strokeRecent])];
        return all.slice(0, 16);
    }

    /**
     * Get current colors
     * @returns {object}
     */
    getColors() {
        return {
            fill: this.fillChar,
            stroke: this.strokeChar
        };
    }

    /**
     * Set fill character
     * @param {string} char
     */
    setFill(char) {
        this.fillChar = char;
        this._updatePreview('.fill-preview', char);
    }

    /**
     * Set stroke character
     * @param {string} char
     */
    setStroke(char) {
        this.strokeChar = char;
        this._updatePreview('.stroke-preview', char);
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    CharacterPalettes,
    RecentManager,
    CharacterSwatch,
    CharacterPalette,
    ColorPanel
};
