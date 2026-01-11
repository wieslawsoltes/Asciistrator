/**
 * Asciistrator - ASCII Character Sets
 * 
 * Character palettes and mappings for ASCII rendering.
 * Includes density palettes, box drawing characters, and special symbols.
 */

// ==========================================
// DENSITY PALETTES
// ==========================================

/**
 * Character palettes sorted by visual density (dark to light)
 */
export const DensityPalettes = {
    // Minimal palette (10 characters)
    minimal: ' .:-=+*#%@',
    
    // Standard palette (~70 characters) - commonly used
    standard: " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    
    // Extended ASCII density palette
    extended: ' .\'`^",:;Il!i><~+_-?][}{1)(|/\\tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$█',
    
    // Block characters only (for gradients)
    blocks: ' ░▒▓█',
    
    // Dot-based palette
    dots: ' ·∙●◉⬤',
    
    // Simple gradient
    simple: ' .+*#',
    
    // Binary (black/white)
    binary: ' █',
    
    // Numeric density
    numeric: ' 123456789',
    
    // Alphabet density (approximate)
    alpha: ' .oO0@',
    
    // Reverse (light to dark) versions
    reverseMinimal: '@%#*+=:-. ',
    reverseBlocks: '█▓▒░ '
};

// ==========================================
// BOX DRAWING CHARACTERS
// ==========================================

/**
 * Box drawing character sets
 */
export const BoxDrawing = {
    // Single line
    single: {
        horizontal: '─',
        vertical: '│',
        topLeft: '┌',
        topRight: '┐',
        bottomLeft: '└',
        bottomRight: '┘',
        teeLeft: '┤',
        teeRight: '├',
        teeUp: '┴',
        teeDown: '┬',
        cross: '┼'
    },
    
    // Double line
    double: {
        horizontal: '═',
        vertical: '║',
        topLeft: '╔',
        topRight: '╗',
        bottomLeft: '╚',
        bottomRight: '╝',
        teeLeft: '╣',
        teeRight: '╠',
        teeUp: '╩',
        teeDown: '╦',
        cross: '╬'
    },
    
    // Rounded corners
    rounded: {
        horizontal: '─',
        vertical: '│',
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯',
        teeLeft: '┤',
        teeRight: '├',
        teeUp: '┴',
        teeDown: '┬',
        cross: '┼'
    },
    
    // Heavy/bold line
    heavy: {
        horizontal: '━',
        vertical: '┃',
        topLeft: '┏',
        topRight: '┓',
        bottomLeft: '┗',
        bottomRight: '┛',
        teeLeft: '┫',
        teeRight: '┣',
        teeUp: '┻',
        teeDown: '┳',
        cross: '╋'
    },
    
    // Dashed lines
    dashed: {
        horizontal: '┄',
        vertical: '┆',
        horizontal2: '┈',
        vertical2: '┊',
        horizontalHeavy: '┅',
        verticalHeavy: '┇'
    },
    
    // ASCII fallback (no unicode)
    ascii: {
        horizontal: '-',
        vertical: '|',
        topLeft: '+',
        topRight: '+',
        bottomLeft: '+',
        bottomRight: '+',
        teeLeft: '+',
        teeRight: '+',
        teeUp: '+',
        teeDown: '+',
        cross: '+'
    },
    
    // Mixed single/double
    singleDoubleHorizontal: {
        topLeft: '╒',
        topRight: '╕',
        bottomLeft: '╘',
        bottomRight: '╛',
        teeLeft: '╡',
        teeRight: '╞',
        teeUp: '╧',
        teeDown: '╤',
        cross: '╪'
    },
    
    singleDoubleVertical: {
        topLeft: '╓',
        topRight: '╖',
        bottomLeft: '╙',
        bottomRight: '╜',
        teeLeft: '╢',
        teeRight: '╟',
        teeUp: '╨',
        teeDown: '╥',
        cross: '╫'
    }
};

// ==========================================
// ARROWS AND POINTERS
// ==========================================

export const Arrows = {
    // Simple arrows
    left: '←',
    up: '↑',
    right: '→',
    down: '↓',
    
    // Diagonal arrows
    upLeft: '↖',
    upRight: '↗',
    downRight: '↘',
    downLeft: '↙',
    
    // Bidirectional
    horizontal: '↔',
    vertical: '↕',
    
    // Double arrows
    doubleLeft: '⇐',
    doubleUp: '⇑',
    doubleRight: '⇒',
    doubleDown: '⇓',
    doubleHorizontal: '⇔',
    doubleVertical: '⇕',
    
    // Triangle arrows
    triangleLeft: '◀',
    triangleUp: '▲',
    triangleRight: '▶',
    triangleDown: '▼',
    
    // Outline triangles
    outlineLeft: '◁',
    outlineUp: '△',
    outlineRight: '▷',
    outlineDown: '▽',
    
    // Small triangles
    smallLeft: '◂',
    smallUp: '▴',
    smallRight: '▸',
    smallDown: '▾',
    
    // Pointing hands
    handRight: '☞',
    handLeft: '☜',
    
    // Chevrons
    chevronLeft: '‹',
    chevronRight: '›',
    doubleChevronLeft: '«',
    doubleChevronRight: '»'
};

// ==========================================
// BLOCK ELEMENTS
// ==========================================

export const Blocks = {
    // Full and partial blocks
    full: '█',
    darkShade: '▓',
    mediumShade: '▒',
    lightShade: '░',
    
    // Half blocks
    upperHalf: '▀',
    lowerHalf: '▄',
    leftHalf: '▌',
    rightHalf: '▐',
    
    // Quarter blocks
    lowerLeft: '▖',
    lowerRight: '▗',
    upperLeft: '▘',
    upperRight: '▝',
    
    // Three-quarter blocks
    upperLeftAndLowerLeftAndLowerRight: '▙',
    upperLeftAndUpperRightAndLowerLeft: '▛',
    upperLeftAndUpperRightAndLowerRight: '▜',
    upperRightAndLowerLeftAndLowerRight: '▟',
    
    // Rectangular blocks
    blackSquare: '■',
    whiteSquare: '□',
    blackSmallSquare: '▪',
    whiteSmallSquare: '▫',
    blackMediumSquare: '◼',
    whiteMediumSquare: '◻',
    blackLargeSquare: '⬛',
    whiteLargeSquare: '⬜'
};

// ==========================================
// GEOMETRIC SHAPES
// ==========================================

export const Shapes = {
    // Circles
    circleFilled: '●',
    circleEmpty: '○',
    circleHalfLeft: '◐',
    circleHalfRight: '◑',
    circleHalfTop: '◓',
    circleHalfBottom: '◒',
    circleDotted: '◌',
    circleDouble: '◎',
    circleBullseye: '◉',
    circleSmallFilled: '•',
    circleSmallEmpty: '◦',
    
    // Diamonds
    diamondFilled: '◆',
    diamondEmpty: '◇',
    diamondContaining: '◈',
    lozengeEmpty: '◊',
    lozengeFilled: '⬧',
    
    // Stars
    starFilled: '★',
    starEmpty: '☆',
    starFour: '✦',
    starFourEmpty: '✧',
    starSix: '✶',
    starEight: '✴',
    asterisk: '✱',
    
    // Triangles
    triangleUp: '▲',
    triangleDown: '▼',
    triangleLeft: '◀',
    triangleRight: '▶',
    triangleUpEmpty: '△',
    triangleDownEmpty: '▽',
    triangleLeftEmpty: '◁',
    triangleRightEmpty: '▷',
    triangleUpSmall: '▴',
    triangleDownSmall: '▾',
    triangleLeftSmall: '◂',
    triangleRightSmall: '▸',
    
    // Other polygons
    pentagon: '⬠',
    hexagon: '⬡',
    octagon: '⯃',
    
    // Misc shapes
    heart: '♥',
    heartEmpty: '♡',
    spade: '♠',
    club: '♣',
    diamond: '♦'
};

// ==========================================
// MATHEMATICAL SYMBOLS
// ==========================================

export const Math = {
    // Basic operators
    plusMinus: '±',
    minus: '−',
    times: '×',
    divide: '÷',
    dot: '·',
    
    // Comparisons
    notEqual: '≠',
    lessThanOrEqual: '≤',
    greaterThanOrEqual: '≥',
    almostEqual: '≈',
    identical: '≡',
    
    // Set theory
    elementOf: '∈',
    notElementOf: '∉',
    subset: '⊂',
    superset: '⊃',
    union: '∪',
    intersection: '∩',
    emptySet: '∅',
    
    // Calculus/Analysis
    infinity: '∞',
    sum: '∑',
    product: '∏',
    squareRoot: '√',
    integral: '∫',
    partial: '∂',
    delta: '∆',
    nabla: '∇',
    
    // Greek letters commonly used
    pi: 'π',
    theta: 'θ',
    phi: 'φ',
    omega: 'Ω',
    alpha: 'α',
    beta: 'β',
    gamma: 'γ',
    sigma: 'σ',
    mu: 'μ',
    lambda: 'λ',
    
    // Logic
    forAll: '∀',
    exists: '∃',
    and: '∧',
    or: '∨',
    not: '¬',
    implies: '⇒',
    iff: '⇔',
    therefore: '∴'
};

// ==========================================
// FLOWCHART SYMBOLS
// ==========================================

export const Flowchart = {
    // Basic process shapes
    processStart: '◯',
    processEnd: '◯',
    process: '▢',
    decision: '◇',
    
    // Connectors
    arrowRight: '→',
    arrowDown: '↓',
    arrowLeft: '←',
    arrowUp: '↑',
    
    // Corner connectors
    cornerDownRight: '┌',
    cornerDownLeft: '┐',
    cornerUpRight: '└',
    cornerUpLeft: '┘',
    
    // Tee connectors
    teeDown: '┬',
    teeUp: '┴',
    teeRight: '├',
    teeLeft: '┤',
    
    // Data shapes (represented with special chars)
    database: '⌸',
    document: '▭',
    
    // Boolean markers
    yes: '✓',
    no: '✗',
    checkmark: '✔',
    crossmark: '✘'
};

// ==========================================
// LINE DRAWING HELPERS
// ==========================================

/**
 * Get line characters for a specific direction
 */
export const LineChars = {
    // Horizontal lines
    horizontalThin: '─',
    horizontalThick: '━',
    horizontalDouble: '═',
    horizontalDashed: '┄',
    horizontalDotted: '┈',
    
    // Vertical lines
    verticalThin: '│',
    verticalThick: '┃',
    verticalDouble: '║',
    verticalDashed: '┆',
    verticalDotted: '┊',
    
    // Diagonal lines (approximate with slashes)
    diagonalForward: '/',
    diagonalBackward: '\\',
    diagonalCross: 'X',
    
    // ASCII fallbacks
    asciiHorizontal: '-',
    asciiVertical: '|',
    asciiCorner: '+',
    asciiDiagonalForward: '/',
    asciiDiagonalBackward: '\\'
};

// ==========================================
// SPECIAL CHARACTERS
// ==========================================

export const Special = {
    // Spaces and blanks
    space: ' ',
    nbsp: '\u00A0',
    enSpace: '\u2002',
    emSpace: '\u2003',
    
    // Dashes
    enDash: '–',
    emDash: '—',
    hyphen: '-',
    
    // Quotes
    leftSingleQuote: '\u2018',
    rightSingleQuote: '\u2019',
    leftDoubleQuote: '\u201C',
    rightDoubleQuote: '\u201D',
    
    // Bullets
    bullet: '•',
    triangleBullet: '‣',
    hyphenBullet: '⁃',
    
    // Currency
    dollar: '$',
    euro: '€',
    pound: '£',
    yen: '¥',
    
    // Misc
    degree: '°',
    copyright: '©',
    registered: '®',
    trademark: '™',
    section: '§',
    paragraph: '¶',
    ellipsis: '…'
};

// ==========================================
// CHARACTER UTILITIES
// ==========================================

/**
 * Get the density value (0-1) for a character
 * @param {string} char - Single character
 * @param {string} [palette='standard'] - Palette name
 * @returns {number}
 */
export function getCharDensity(char, palette = 'standard') {
    const paletteStr = DensityPalettes[palette] || DensityPalettes.standard;
    const index = paletteStr.indexOf(char);
    if (index === -1) return 0.5; // Default for unknown chars
    return index / (paletteStr.length - 1);
}

/**
 * Get character for a density value (0-1)
 * @param {number} density - Density value 0 (empty) to 1 (full)
 * @param {string} [palette='standard'] - Palette name
 * @returns {string}
 */
export function getCharForDensity(density, palette = 'standard') {
    const paletteStr = DensityPalettes[palette] || DensityPalettes.standard;
    const index = Math.round(density * (paletteStr.length - 1));
    return paletteStr[Math.max(0, Math.min(index, paletteStr.length - 1))];
}

/**
 * Get grayscale character for a brightness value (0-255)
 * @param {number} brightness - Brightness 0 (black) to 255 (white)
 * @param {string} [palette='standard'] - Palette name
 * @param {boolean} [invert=false] - Invert mapping
 * @returns {string}
 */
export function getCharForBrightness(brightness, palette = 'standard', invert = false) {
    let density = brightness / 255;
    if (invert) density = 1 - density;
    return getCharForDensity(density, palette);
}

/**
 * Get box drawing character for a connection pattern
 * @param {boolean} up - Has connection up
 * @param {boolean} right - Has connection right
 * @param {boolean} down - Has connection down
 * @param {boolean} left - Has connection left
 * @param {string} [style='single'] - Box style
 * @returns {string}
 */
export function getBoxChar(up, right, down, left, style = 'single') {
    const set = BoxDrawing[style] || BoxDrawing.single;
    
    const connections = (up ? 1 : 0) + (right ? 2 : 0) + (down ? 4 : 0) + (left ? 8 : 0);
    
    switch (connections) {
        case 0: return ' ';
        case 1: return set.vertical;     // up only
        case 2: return set.horizontal;   // right only
        case 3: return set.bottomLeft;   // up + right
        case 4: return set.vertical;     // down only
        case 5: return set.vertical;     // up + down
        case 6: return set.topLeft;      // right + down
        case 7: return set.teeRight;     // up + right + down
        case 8: return set.horizontal;   // left only
        case 9: return set.bottomRight;  // up + left
        case 10: return set.horizontal;  // right + left
        case 11: return set.teeUp;       // up + right + left
        case 12: return set.topRight;    // down + left
        case 13: return set.teeLeft;     // up + down + left
        case 14: return set.teeDown;     // right + down + left
        case 15: return set.cross;       // all
        default: return ' ';
    }
}

/**
 * Check if a character is a box drawing character
 * @param {string} char 
 * @returns {boolean}
 */
export function isBoxDrawingChar(char) {
    const boxChars = '─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬╭╮╰╯━┃┏┓┗┛┣┫┳┻╋┄┆┈┊┅┇╒╕╘╛╡╞╧╤╪╓╖╙╜╢╟╨╥╫';
    return boxChars.includes(char);
}

/**
 * Check if a character is printable (not a control character)
 * @param {string} char 
 * @returns {boolean}
 */
export function isPrintable(char) {
    const code = char.charCodeAt(0);
    return code >= 32 && code !== 127;
}

/**
 * Get the visual width of a character (for alignment)
 * Many Unicode characters are double-width in monospace fonts
 * @param {string} char 
 * @returns {number}
 */
export function getCharWidth(char) {
    const code = char.charCodeAt(0);
    
    // Full-width characters (CJK, etc.)
    if ((code >= 0x1100 && code <= 0x115F) ||  // Hangul Jamo
        (code >= 0x2E80 && code <= 0x9FFF) ||  // CJK
        (code >= 0xAC00 && code <= 0xD7AF) ||  // Hangul Syllables
        (code >= 0xF900 && code <= 0xFAFF) ||  // CJK Compatibility
        (code >= 0xFE10 && code <= 0xFE1F) ||  // Vertical forms
        (code >= 0xFE30 && code <= 0xFE6F) ||  // CJK Compatibility Forms
        (code >= 0xFF00 && code <= 0xFF60) ||  // Full-width forms
        (code >= 0xFFE0 && code <= 0xFFE6)) {  // Full-width signs
        return 2;
    }
    
    return 1;
}

/**
 * Create a character map from an image's brightness values
 * @param {number[][]} brightness - 2D array of brightness values (0-255)
 * @param {string} [palette='standard'] - Palette name
 * @param {boolean} [invert=false] - Invert brightness
 * @returns {string[][]}
 */
export function brightnessToCharMap(brightness, palette = 'standard', invert = false) {
    return brightness.map(row => 
        row.map(b => getCharForBrightness(b, palette, invert))
    );
}

/**
 * Convert text to a specific box style
 * Useful for converting between ASCII and Unicode box drawing
 * @param {string} text - Text containing box drawing characters
 * @param {string} fromStyle - Source style
 * @param {string} toStyle - Target style
 * @returns {string}
 */
export function convertBoxStyle(text, fromStyle, toStyle) {
    const from = BoxDrawing[fromStyle] || BoxDrawing.single;
    const to = BoxDrawing[toStyle] || BoxDrawing.single;
    
    const mapping = {};
    for (const key of Object.keys(from)) {
        if (to[key]) {
            mapping[from[key]] = to[key];
        }
    }
    
    return text.split('').map(c => mapping[c] || c).join('');
}

export default {
    DensityPalettes,
    BoxDrawing,
    Arrows,
    Blocks,
    Shapes,
    Math,
    Flowchart,
    LineChars,
    Special,
    getCharDensity,
    getCharForDensity,
    getCharForBrightness,
    getBoxChar,
    isBoxDrawingChar,
    isPrintable,
    getCharWidth,
    brightnessToCharMap,
    convertBoxStyle
};
