/**
 * Asciistrator - Character Picker Panel
 * 
 * Comprehensive ASCII character selection panel.
 */

import { Panel, TabPanel } from '../panels.js';
import { EventEmitter } from '../../utils/events.js';

// ==========================================
// CHARACTER CATEGORIES
// ==========================================

/**
 * Comprehensive ASCII character categories
 */
export const CharacterCategories = {
    // Box Drawing
    boxLight: {
        name: 'Box Drawing (Light)',
        chars: '─│┌┐└┘├┤┬┴┼╴╵╶╷'
    },
    boxHeavy: {
        name: 'Box Drawing (Heavy)',
        chars: '━┃┏┓┗┛┣┫┳┻╋╸╹╺╻'
    },
    boxDouble: {
        name: 'Box Drawing (Double)',
        chars: '═║╔╗╚╝╠╣╦╩╬'
    },
    boxRounded: {
        name: 'Box Drawing (Rounded)',
        chars: '╭╮╰╯'
    },
    boxMixed: {
        name: 'Box Drawing (Mixed)',
        chars: '╒╓╕╖╘╙╛╜╞╟╡╢╤╥╧╨╪╫'
    },

    // Block Elements
    blocks: {
        name: 'Block Elements',
        chars: '█▓▒░▀▄▌▐▖▗▘▙▚▛▜▝▞▟'
    },
    blockShade: {
        name: 'Shade Blocks',
        chars: '░▒▓█'
    },

    // Geometric Shapes
    geometric: {
        name: 'Geometric Shapes',
        chars: '■□▪▫●○◆◇▲△▼▽◀◁▶▷◈◉◊'
    },
    circles: {
        name: 'Circles',
        chars: '○●◎◉◌◍◐◑◒◓◔◕◖◗'
    },
    triangles: {
        name: 'Triangles',
        chars: '▲△▴▵▶▷▸▹►▻▼▽▾▿◀◁◂◃◄◅'
    },
    squares: {
        name: 'Squares',
        chars: '■□▢▣▤▥▦▧▨▩▪▫▬▭▮▯'
    },

    // Arrows
    arrowsSimple: {
        name: 'Arrows (Simple)',
        chars: '←↑→↓↔↕↖↗↘↙'
    },
    arrowsDouble: {
        name: 'Arrows (Double)',
        chars: '⇐⇑⇒⇓⇔⇕⇖⇗⇘⇙'
    },
    arrowsMore: {
        name: 'Arrows (More)',
        chars: '↚↛↜↝↞↟↠↡↢↣↤↥↦↧↨↩↪↫↬'
    },

    // Mathematical
    math: {
        name: 'Mathematical',
        chars: '±×÷=≠≈≡≤≥<>∞√∑∏∫∂∆∇'
    },
    superscript: {
        name: 'Superscript',
        chars: '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ'
    },
    subscript: {
        name: 'Subscript',
        chars: '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎'
    },
    fractions: {
        name: 'Fractions',
        chars: '½⅓¼⅕⅙⅐⅛⅑⅒⅔¾⅖⅗⅘⅚⅜⅝⅞'
    },

    // Symbols
    currency: {
        name: 'Currency',
        chars: '$¢£¤¥€₹₽₿₺₴₸'
    },
    punctuation: {
        name: 'Punctuation',
        chars: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
    },
    special: {
        name: 'Special Symbols',
        chars: '©®™℃℉°†‡§¶•‣⁂※'
    },

    // Stars & Decorative
    stars: {
        name: 'Stars',
        chars: '★☆✦✧✩✪✫✬✭✮✯✰✱✲✳✴✵✶✷✸✹'
    },
    hearts: {
        name: 'Hearts',
        chars: '♡♥❤❥❣❦❧💕💖💗💘💙💚💛💜💝'
    },
    flowers: {
        name: 'Flowers',
        chars: '✿❀❁❂❃✾✽✼❄❅❆❇❈❉❊❋'
    },

    // Card Suits & Games
    cards: {
        name: 'Card Suits',
        chars: '♠♡♢♣♤♥♦♧'
    },
    dice: {
        name: 'Dice',
        chars: '⚀⚁⚂⚃⚄⚅'
    },
    chess: {
        name: 'Chess',
        chars: '♔♕♖♗♘♙♚♛♜♝♞♟'
    },

    // Musical
    music: {
        name: 'Musical',
        chars: '♩♪♫♬♭♮♯𝄞𝄢'
    },

    // Weather & Nature
    weather: {
        name: 'Weather',
        chars: '☀☁☂☃☄★☼☽☾♁⛅⛈⛱'
    },
    zodiac: {
        name: 'Zodiac',
        chars: '♈♉♊♋♌♍♎♏♐♑♒♓'
    },

    // Emoticons
    faces: {
        name: 'Faces',
        chars: '☺☻☹☿〠㊀㊁㊂㊃㊄㊅㊆㊇㊈㊉'
    },

    // Technical & Computing
    technical: {
        name: 'Technical',
        chars: '⌀⌂⌃⌄⌅⌆⌇⌈⌉⌊⌋⌐⌑⌒⌓⌔⌕⌖⌗⌘⌙⌚⌛'
    },
    keyboard: {
        name: 'Keyboard',
        chars: '⌘⌥⇧⌫⌦⎋⏎⏏⌤⌨'
    },

    // Braille
    braille: {
        name: 'Braille',
        chars: '⠀⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿'
    },

    // Lines
    lines: {
        name: 'Lines',
        chars: '─━│┃┄┅┆┇┈┉┊┋'
    },

    // Dingbats
    dingbats: {
        name: 'Dingbats',
        chars: '✁✂✃✄✆✇✈✉✌✍✎✏✐✑✒✓✔✕✖✗✘✙✚✛✜✝✞✟'
    },

    // ASCII Art Essentials
    asciiArt: {
        name: 'ASCII Art Essentials',
        chars: ' .:-=+*#%@$&!?/\\|()[]{}^~`"\''
    }
};

// ==========================================
// CHARACTER GRID
// ==========================================

/**
 * CharacterGrid - Grid of selectable characters
 */
export class CharacterGrid extends EventEmitter {
    /**
     * Create character grid
     * @param {object} options
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} Characters to display */
        this.characters = options.characters || '';
        
        /** @type {number} Grid columns */
        this.columns = options.columns || 10;
        
        /** @type {string|null} Selected character */
        this.selected = options.selected || null;
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
    }

    /**
     * Render grid
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'character-grid';
        this.element.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;

        for (const char of this.characters) {
            const cell = document.createElement('button');
            cell.className = 'character-cell';
            cell.textContent = char;
            cell.title = `${char} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`;

            if (char === this.selected) {
                cell.classList.add('selected');
            }

            cell.addEventListener('click', () => {
                this._selectCharacter(char, cell);
            });

            // Double-click to insert
            cell.addEventListener('dblclick', () => {
                this.emit('insert', char);
            });

            this.element.appendChild(cell);
        }

        return this.element;
    }

    /**
     * Select character
     * @private
     */
    _selectCharacter(char, cell) {
        // Remove previous selection
        const prevSelected = this.element?.querySelector('.selected');
        prevSelected?.classList.remove('selected');

        // Set new selection
        this.selected = char;
        cell.classList.add('selected');

        this.emit('select', char);
    }

    /**
     * Set characters
     * @param {string} characters
     */
    setCharacters(characters) {
        this.characters = characters;
        if (this.element) {
            this.element.innerHTML = '';
            for (const char of characters) {
                const cell = document.createElement('button');
                cell.className = 'character-cell';
                cell.textContent = char;
                cell.title = `${char} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`;
                cell.addEventListener('click', () => this._selectCharacter(char, cell));
                cell.addEventListener('dblclick', () => this.emit('insert', char));
                this.element.appendChild(cell);
            }
        }
    }
}

// ==========================================
// CHARACTER SEARCH
// ==========================================

/**
 * CharacterSearch - Search through all characters
 */
export class CharacterSearch extends EventEmitter {
    constructor() {
        super();
        
        /** @type {string} Search query */
        this.query = '';
        
        /** @type {Array<{char: string, name: string, category: string}>} Search index */
        this.index = this._buildIndex();
        
        /** @type {HTMLElement|null} DOM element */
        this.element = null;
    }

    /**
     * Build search index
     * @private
     */
    _buildIndex() {
        const index = [];
        
        for (const [key, category] of Object.entries(CharacterCategories)) {
            for (const char of category.chars) {
                index.push({
                    char,
                    name: category.name,
                    category: key,
                    code: char.charCodeAt(0)
                });
            }
        }
        
        return index;
    }

    /**
     * Render search
     * @returns {HTMLElement}
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'character-search';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'character-search-input';
        input.placeholder = 'Search characters...';

        input.addEventListener('input', () => {
            this.query = input.value;
            this._updateResults();
        });

        this.element.appendChild(input);

        const results = document.createElement('div');
        results.className = 'character-search-results';
        this.element.appendChild(results);

        return this.element;
    }

    /**
     * Update search results
     * @private
     */
    _updateResults() {
        const results = this.element?.querySelector('.character-search-results');
        if (!results) return;

        results.innerHTML = '';

        if (!this.query || this.query.length < 2) {
            results.innerHTML = '<div class="search-hint">Enter at least 2 characters to search</div>';
            return;
        }

        const query = this.query.toLowerCase();
        const matches = this.index.filter(item => 
            item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
        );

        if (matches.length === 0) {
            results.innerHTML = '<div class="search-no-results">No matches found</div>';
            return;
        }

        // Limit results
        const limited = matches.slice(0, 50);

        for (const match of limited) {
            const cell = document.createElement('button');
            cell.className = 'character-cell search-result';
            cell.textContent = match.char;
            cell.title = `${match.char} - ${match.name}`;

            cell.addEventListener('click', () => {
                this.emit('select', match.char);
            });

            results.appendChild(cell);
        }

        if (matches.length > 50) {
            const more = document.createElement('div');
            more.className = 'search-more';
            more.textContent = `...and ${matches.length - 50} more`;
            results.appendChild(more);
        }
    }

    /**
     * Search for characters
     * @param {string} query
     * @returns {Array<{char: string, name: string}>}
     */
    search(query) {
        const q = query.toLowerCase();
        return this.index.filter(item => 
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        );
    }
}

// ==========================================
// CHARACTER PICKER PANEL
// ==========================================

/**
 * CharacterPickerPanel - Full character picker panel
 */
export class CharacterPickerPanel extends Panel {
    /**
     * Create character picker panel
     * @param {object} options
     */
    constructor(options = {}) {
        super({
            id: 'characters',
            title: 'Characters',
            icon: '🔤',
            width: 280,
            ...options
        });
        
        /** @type {string|null} Currently selected character */
        this.selectedChar = null;
        
        /** @type {string} Current category */
        this.currentCategory = 'asciiArt';
        
        /** @type {CharacterGrid|null} Main grid */
        this.grid = null;
        
        /** @type {CharacterSearch|null} Search component */
        this.search = null;
        
        /** @type {Array<string>} Favorites */
        this.favorites = options.favorites || [];
    }

    /**
     * Render panel content
     * @returns {HTMLElement}
     */
    renderContent() {
        const container = document.createElement('div');
        container.className = 'character-picker-panel';

        // Tabs
        const tabs = document.createElement('div');
        tabs.className = 'character-tabs';
        
        const tabData = [
            { id: 'browse', icon: '📁', label: 'Browse' },
            { id: 'search', icon: '🔍', label: 'Search' },
            { id: 'favorites', icon: '⭐', label: 'Favorites' }
        ];

        for (const tab of tabData) {
            const tabBtn = document.createElement('button');
            tabBtn.className = 'character-tab';
            tabBtn.dataset.tab = tab.id;
            tabBtn.innerHTML = `${tab.icon} ${tab.label}`;
            
            if (tab.id === 'browse') {
                tabBtn.classList.add('active');
            }

            tabBtn.addEventListener('click', () => {
                this._switchTab(tab.id);
            });

            tabs.appendChild(tabBtn);
        }

        container.appendChild(tabs);

        // Tab content
        const tabContent = document.createElement('div');
        tabContent.className = 'character-tab-content';

        // Browse tab
        const browseTab = document.createElement('div');
        browseTab.className = 'tab-pane active';
        browseTab.dataset.tab = 'browse';

        // Category selector
        const categorySelect = document.createElement('select');
        categorySelect.className = 'category-select';
        
        for (const [key, category] of Object.entries(CharacterCategories)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = category.name;
            if (key === this.currentCategory) option.selected = true;
            categorySelect.appendChild(option);
        }

        categorySelect.addEventListener('change', () => {
            this.currentCategory = categorySelect.value;
            this._updateGrid();
        });

        browseTab.appendChild(categorySelect);

        // Character grid
        this.grid = new CharacterGrid({
            characters: CharacterCategories[this.currentCategory]?.chars || '',
            columns: 10
        });

        this.grid.on('select', (char) => {
            this._selectCharacter(char);
        });

        this.grid.on('insert', (char) => {
            this.emit('insert', char);
        });

        browseTab.appendChild(this.grid.render());
        tabContent.appendChild(browseTab);

        // Search tab
        const searchTab = document.createElement('div');
        searchTab.className = 'tab-pane';
        searchTab.dataset.tab = 'search';

        this.search = new CharacterSearch();
        this.search.on('select', (char) => {
            this._selectCharacter(char);
        });

        searchTab.appendChild(this.search.render());
        tabContent.appendChild(searchTab);

        // Favorites tab
        const favoritesTab = document.createElement('div');
        favoritesTab.className = 'tab-pane';
        favoritesTab.dataset.tab = 'favorites';

        const favGrid = new CharacterGrid({
            characters: this.favorites.join(''),
            columns: 10
        });

        favGrid.on('select', (char) => {
            this._selectCharacter(char);
        });

        favoritesTab.appendChild(favGrid.render());
        
        if (this.favorites.length === 0) {
            const hint = document.createElement('div');
            hint.className = 'favorites-hint';
            hint.textContent = 'Click ⭐ to add characters to favorites';
            favoritesTab.appendChild(hint);
        }

        tabContent.appendChild(favoritesTab);
        container.appendChild(tabContent);

        // Selected character preview
        const preview = document.createElement('div');
        preview.className = 'character-preview';
        preview.innerHTML = `
            <div class="preview-char">-</div>
            <div class="preview-info">
                <div class="preview-unicode">U+0000</div>
                <div class="preview-name">Select a character</div>
            </div>
            <div class="preview-actions">
                <button class="preview-favorite" title="Add to favorites">⭐</button>
                <button class="preview-copy" title="Copy to clipboard">📋</button>
                <button class="preview-use" title="Use as fill/stroke">✓</button>
            </div>
        `;

        // Preview actions
        const favBtn = preview.querySelector('.preview-favorite');
        favBtn.addEventListener('click', () => {
            if (this.selectedChar) {
                this._toggleFavorite(this.selectedChar);
            }
        });

        const copyBtn = preview.querySelector('.preview-copy');
        copyBtn.addEventListener('click', () => {
            if (this.selectedChar) {
                navigator.clipboard?.writeText(this.selectedChar);
                this.emit('copy', this.selectedChar);
            }
        });

        const useBtn = preview.querySelector('.preview-use');
        useBtn.addEventListener('click', () => {
            if (this.selectedChar) {
                this.emit('use', this.selectedChar);
            }
        });

        container.appendChild(preview);

        return container;
    }

    /**
     * Switch tab
     * @private
     */
    _switchTab(tabId) {
        const tabs = this.content?.querySelectorAll('.character-tab');
        const panes = this.content?.querySelectorAll('.tab-pane');

        tabs?.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        panes?.forEach(pane => {
            pane.classList.toggle('active', pane.dataset.tab === tabId);
        });
    }

    /**
     * Update grid with current category
     * @private
     */
    _updateGrid() {
        const chars = CharacterCategories[this.currentCategory]?.chars || '';
        this.grid?.setCharacters(chars);
    }

    /**
     * Select character
     * @private
     */
    _selectCharacter(char) {
        this.selectedChar = char;

        const preview = this.content?.querySelector('.character-preview');
        if (preview) {
            const charEl = preview.querySelector('.preview-char');
            const unicodeEl = preview.querySelector('.preview-unicode');
            const nameEl = preview.querySelector('.preview-name');
            const favBtn = preview.querySelector('.preview-favorite');

            if (charEl) charEl.textContent = char;
            if (unicodeEl) {
                unicodeEl.textContent = `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
            }
            if (nameEl) {
                // Find category name
                let categoryName = 'Character';
                for (const [key, cat] of Object.entries(CharacterCategories)) {
                    if (cat.chars.includes(char)) {
                        categoryName = cat.name;
                        break;
                    }
                }
                nameEl.textContent = categoryName;
            }
            if (favBtn) {
                favBtn.classList.toggle('favorited', this.favorites.includes(char));
            }
        }

        this.emit('select', char);
    }

    /**
     * Toggle favorite
     * @private
     */
    _toggleFavorite(char) {
        const index = this.favorites.indexOf(char);
        
        if (index >= 0) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(char);
        }

        // Update favorite button state
        const favBtn = this.content?.querySelector('.preview-favorite');
        favBtn?.classList.toggle('favorited', this.favorites.includes(char));

        // Update favorites grid
        const favPane = this.content?.querySelector('[data-tab="favorites"]');
        if (favPane) {
            const grid = favPane.querySelector('.character-grid');
            if (grid) {
                grid.innerHTML = '';
                for (const c of this.favorites) {
                    const cell = document.createElement('button');
                    cell.className = 'character-cell';
                    cell.textContent = c;
                    cell.addEventListener('click', () => this._selectCharacter(c));
                    grid.appendChild(cell);
                }
            }
        }

        this.emit('favoritesChange', this.favorites);
    }

    /**
     * Get selected character
     * @returns {string|null}
     */
    getSelected() {
        return this.selectedChar;
    }

    /**
     * Get favorites
     * @returns {Array<string>}
     */
    getFavorites() {
        return [...this.favorites];
    }

    /**
     * Set favorites
     * @param {Array<string>} favorites
     */
    setFavorites(favorites) {
        this.favorites = [...favorites];
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    CharacterCategories,
    CharacterGrid,
    CharacterSearch,
    CharacterPickerPanel
};
