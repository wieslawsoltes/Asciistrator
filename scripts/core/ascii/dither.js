/**
 * Asciistrator - Dithering Module
 * 
 * Implements various dithering algorithms for converting grayscale/color
 * values to ASCII characters with different patterns.
 */

import { getCharForDensity, DensityPalettes } from './charsets.js';

// ==========================================
// DITHER MATRICES
// ==========================================

/**
 * Bayer ordered dithering matrices
 */
export const BayerMatrices = {
    // 2x2 Bayer matrix
    bayer2: [
        [0, 2],
        [3, 1]
    ],
    
    // 4x4 Bayer matrix
    bayer4: [
        [0,  8,  2, 10],
        [12, 4, 14,  6],
        [3, 11,  1,  9],
        [15, 7, 13,  5]
    ],
    
    // 8x8 Bayer matrix
    bayer8: [
        [0,  32,  8, 40,  2, 34, 10, 42],
        [48, 16, 56, 24, 50, 18, 58, 26],
        [12, 44,  4, 36, 14, 46,  6, 38],
        [60, 28, 52, 20, 62, 30, 54, 22],
        [3,  35, 11, 43,  1, 33,  9, 41],
        [51, 19, 59, 27, 49, 17, 57, 25],
        [15, 47,  7, 39, 13, 45,  5, 37],
        [63, 31, 55, 23, 61, 29, 53, 21]
    ]
};

/**
 * Halftone pattern matrices
 */
export const HalftoneMatrices = {
    // Circle halftone
    circle4: [
        [12, 5,  6, 13],
        [4,  0,  1,  7],
        [11, 3,  2,  8],
        [15, 10, 9, 14]
    ],
    
    // Line halftone
    lines4: [
        [15, 11, 7, 3],
        [14, 10, 6, 2],
        [13,  9, 5, 1],
        [12,  8, 4, 0]
    ],
    
    // Diamond halftone
    diamond4: [
        [8,  4,  8, 12],
        [4,  0,  4,  8],
        [8,  4,  8, 12],
        [12, 8, 12, 15]
    ]
};

/**
 * Custom pattern matrices for stylized dithering
 */
export const PatternMatrices = {
    // Checker pattern
    checker: [
        [0, 1],
        [1, 0]
    ],
    
    // Cross pattern
    cross: [
        [1, 0, 1],
        [0, 0, 0],
        [1, 0, 1]
    ],
    
    // Diagonal pattern
    diagonal: [
        [0, 1, 2, 3],
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6]
    ],
    
    // Horizontal lines
    hlines: [
        [0],
        [1]
    ],
    
    // Vertical lines  
    vlines: [
        [0, 1]
    ]
};

// ==========================================
// DITHER ALGORITHMS
// ==========================================

/**
 * Threshold dithering (no dithering, just quantization)
 * @param {number} value - Value 0-1
 * @param {number} levels - Number of output levels
 * @returns {number} - Quantized value 0-1
 */
export function thresholdDither(value, levels = 2) {
    const step = 1 / levels;
    return Math.floor(value / step) * step;
}

/**
 * Ordered dithering using a matrix
 * @param {number} value - Value 0-1
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number[][]} matrix - Dither matrix
 * @param {number} levels - Number of output levels
 * @returns {number} - Dithered value 0-1
 */
export function orderedDither(value, x, y, matrix, levels = 2) {
    const size = matrix.length;
    const mx = x % size;
    const my = y % size;
    const threshold = (matrix[my][mx] + 0.5) / (size * size);
    
    const step = 1 / (levels - 1);
    const base = Math.floor(value / step) * step;
    const error = (value - base) / step;
    
    return error > threshold ? Math.min(1, base + step) : base;
}

/**
 * Bayer dithering
 * @param {number} value - Value 0-1
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} [size='4'] - Matrix size ('2', '4', '8')
 * @param {number} [levels=2] - Number of output levels
 * @returns {number}
 */
export function bayerDither(value, x, y, size = '4', levels = 2) {
    const matrix = BayerMatrices[`bayer${size}`] || BayerMatrices.bayer4;
    const matrixSize = matrix.length;
    const maxValue = matrixSize * matrixSize;
    
    const mx = x % matrixSize;
    const my = y % matrixSize;
    const threshold = matrix[my][mx] / maxValue;
    
    const step = 1 / (levels - 1);
    const base = Math.floor(value / step) * step;
    const error = (value - base) / step;
    
    return error > threshold ? Math.min(1, base + step) : base;
}

/**
 * Floyd-Steinberg error diffusion dithering
 * @param {number[][]} values - 2D array of values 0-1
 * @param {number} levels - Number of output levels
 * @returns {number[][]} - Dithered values
 */
export function floydSteinbergDither(values, levels = 2) {
    const height = values.length;
    const width = values[0].length;
    
    // Create working copy
    const result = values.map(row => [...row]);
    
    const step = 1 / (levels - 1);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const oldValue = result[y][x];
            const newValue = Math.round(oldValue / step) * step;
            result[y][x] = newValue;
            
            const error = oldValue - newValue;
            
            // Distribute error to neighbors
            // Floyd-Steinberg diffusion pattern:
            //     X  7/16
            // 3/16 5/16 1/16
            
            if (x + 1 < width) {
                result[y][x + 1] += error * 7 / 16;
            }
            if (y + 1 < height) {
                if (x > 0) {
                    result[y + 1][x - 1] += error * 3 / 16;
                }
                result[y + 1][x] += error * 5 / 16;
                if (x + 1 < width) {
                    result[y + 1][x + 1] += error * 1 / 16;
                }
            }
        }
    }
    
    return result;
}

/**
 * Jarvis-Judice-Ninke error diffusion
 * @param {number[][]} values 
 * @param {number} levels 
 * @returns {number[][]}
 */
export function jarvisDither(values, levels = 2) {
    const height = values.length;
    const width = values[0].length;
    const result = values.map(row => [...row]);
    const step = 1 / (levels - 1);
    
    // JJN diffusion pattern (divided by 48):
    //         X   7   5
    // 3   5   7   5   3
    // 1   3   5   3   1
    
    const kernel = [
        [0, 0, 0, 7, 5],
        [3, 5, 7, 5, 3],
        [1, 3, 5, 3, 1]
    ];
    const divisor = 48;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const oldValue = result[y][x];
            const newValue = Math.round(oldValue / step) * step;
            result[y][x] = Math.max(0, Math.min(1, newValue));
            
            const error = oldValue - newValue;
            
            for (let ky = 0; ky < 3; ky++) {
                for (let kx = 0; kx < 5; kx++) {
                    const nx = x + kx - 2;
                    const ny = y + ky;
                    
                    if (nx >= 0 && nx < width && ny < height && (ky > 0 || kx > 2)) {
                        result[ny][nx] += error * kernel[ky][kx] / divisor;
                    }
                }
            }
        }
    }
    
    return result;
}

/**
 * Atkinson dithering (used in original Macintosh)
 * @param {number[][]} values 
 * @param {number} levels 
 * @returns {number[][]}
 */
export function atkinsonDither(values, levels = 2) {
    const height = values.length;
    const width = values[0].length;
    const result = values.map(row => [...row]);
    const step = 1 / (levels - 1);
    
    // Atkinson diffusion pattern (divided by 8):
    //     X   1   1
    // 1   1   1
    //     1
    // Note: Only 6/8 of error is diffused (produces lighter images)
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const oldValue = result[y][x];
            const newValue = Math.round(oldValue / step) * step;
            result[y][x] = Math.max(0, Math.min(1, newValue));
            
            const error = (oldValue - newValue) / 8;
            
            // Diffuse error
            if (x + 1 < width) result[y][x + 1] += error;
            if (x + 2 < width) result[y][x + 2] += error;
            if (y + 1 < height) {
                if (x > 0) result[y + 1][x - 1] += error;
                result[y + 1][x] += error;
                if (x + 1 < width) result[y + 1][x + 1] += error;
            }
            if (y + 2 < height) {
                result[y + 2][x] += error;
            }
        }
    }
    
    return result;
}

/**
 * Sierra dithering
 * @param {number[][]} values 
 * @param {number} levels 
 * @returns {number[][]}
 */
export function sierraDither(values, levels = 2) {
    const height = values.length;
    const width = values[0].length;
    const result = values.map(row => [...row]);
    const step = 1 / (levels - 1);
    
    // Sierra diffusion pattern (divided by 32):
    //         X   5   3
    // 2   4   5   4   2
    //     2   3   2
    
    const kernel = [
        [0, 0, 0, 5, 3],
        [2, 4, 5, 4, 2],
        [0, 2, 3, 2, 0]
    ];
    const divisor = 32;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const oldValue = result[y][x];
            const newValue = Math.round(oldValue / step) * step;
            result[y][x] = Math.max(0, Math.min(1, newValue));
            
            const error = oldValue - newValue;
            
            for (let ky = 0; ky < 3; ky++) {
                for (let kx = 0; kx < 5; kx++) {
                    const nx = x + kx - 2;
                    const ny = y + ky;
                    
                    if (nx >= 0 && nx < width && ny < height && (ky > 0 || kx > 2)) {
                        result[ny][nx] += error * kernel[ky][kx] / divisor;
                    }
                }
            }
        }
    }
    
    return result;
}

/**
 * Stucki dithering
 * @param {number[][]} values 
 * @param {number} levels 
 * @returns {number[][]}
 */
export function stuckiDither(values, levels = 2) {
    const height = values.length;
    const width = values[0].length;
    const result = values.map(row => [...row]);
    const step = 1 / (levels - 1);
    
    // Stucki diffusion pattern (divided by 42):
    //         X   8   4
    // 2   4   8   4   2
    // 1   2   4   2   1
    
    const kernel = [
        [0, 0, 0, 8, 4],
        [2, 4, 8, 4, 2],
        [1, 2, 4, 2, 1]
    ];
    const divisor = 42;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const oldValue = result[y][x];
            const newValue = Math.round(oldValue / step) * step;
            result[y][x] = Math.max(0, Math.min(1, newValue));
            
            const error = oldValue - newValue;
            
            for (let ky = 0; ky < 3; ky++) {
                for (let kx = 0; kx < 5; kx++) {
                    const nx = x + kx - 2;
                    const ny = y + ky;
                    
                    if (nx >= 0 && nx < width && ny < height && (ky > 0 || kx > 2)) {
                        result[ny][nx] += error * kernel[ky][kx] / divisor;
                    }
                }
            }
        }
    }
    
    return result;
}

// ==========================================
// PATTERN DITHERING
// ==========================================

/**
 * Pattern-based dithering
 * @param {number} value - Value 0-1
 * @param {number} x 
 * @param {number} y 
 * @param {string} patternName - Pattern name
 * @returns {number}
 */
export function patternDither(value, x, y, patternName = 'checker') {
    const pattern = PatternMatrices[patternName] || PatternMatrices.checker;
    const height = pattern.length;
    const width = pattern[0].length;
    
    const maxValue = Math.max(...pattern.flat());
    const threshold = pattern[y % height][x % width] / maxValue;
    
    return value > threshold ? 1 : 0;
}

/**
 * Random/noise dithering
 * @param {number} value 
 * @param {number} [strength=0.5] - Noise strength
 * @returns {number}
 */
export function randomDither(value, strength = 0.5) {
    const noise = (Math.random() - 0.5) * strength;
    return Math.max(0, Math.min(1, value + noise)) > 0.5 ? 1 : 0;
}

/**
 * Blue noise dithering using void-and-cluster
 * @param {number} value 
 * @param {number} x 
 * @param {number} y 
 * @param {number} [seed=0] 
 * @returns {number}
 */
export function blueNoiseDither(value, x, y, seed = 0) {
    // Simple blue noise approximation using hash function
    const hash = (a, b, c) => {
        let h = seed;
        h ^= a * 374761393;
        h ^= b * 668265263;
        h ^= c * 2147483647;
        h = Math.imul(h ^ (h >>> 15), 2246822519);
        h = Math.imul(h ^ (h >>> 13), 3266489917);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    
    const threshold = hash(x, y, seed);
    return value > threshold ? 1 : 0;
}

// ==========================================
// ASCII DITHERING HELPERS
// ==========================================

/**
 * Convert a 2D grayscale array to ASCII using dithering
 * @param {number[][]} values - 2D array of values 0-1
 * @param {object} [options]
 * @param {string} [options.algorithm='bayer'] - Dithering algorithm
 * @param {string} [options.palette='standard'] - Character palette
 * @param {number} [options.levels] - Number of levels (auto from palette if not specified)
 * @returns {string[][]}
 */
export function ditherToAscii(values, options = {}) {
    const { 
        algorithm = 'bayer', 
        palette = 'standard',
        levels = null
    } = options;
    
    const paletteChars = DensityPalettes[palette] || DensityPalettes.standard;
    const numLevels = levels || paletteChars.length;
    
    const height = values.length;
    const width = values[0].length;
    
    let dithered;
    
    switch (algorithm) {
        case 'none':
        case 'threshold':
            dithered = values.map(row => row.map(v => thresholdDither(v, numLevels)));
            break;
            
        case 'bayer2':
        case 'bayer4':
        case 'bayer8':
        case 'bayer':
            const bayerSize = algorithm.replace('bayer', '') || '4';
            dithered = values.map((row, y) => 
                row.map((v, x) => bayerDither(v, x, y, bayerSize, numLevels))
            );
            break;
            
        case 'floyd-steinberg':
        case 'floydSteinberg':
            dithered = floydSteinbergDither(values, numLevels);
            break;
            
        case 'jarvis':
            dithered = jarvisDither(values, numLevels);
            break;
            
        case 'atkinson':
            dithered = atkinsonDither(values, numLevels);
            break;
            
        case 'sierra':
            dithered = sierraDither(values, numLevels);
            break;
            
        case 'stucki':
            dithered = stuckiDither(values, numLevels);
            break;
            
        case 'random':
            dithered = values.map(row => row.map(v => randomDither(v)));
            break;
            
        case 'blueNoise':
            dithered = values.map((row, y) => 
                row.map((v, x) => blueNoiseDither(v, x, y))
            );
            break;
            
        case 'ordered':
            dithered = values.map((row, y) => 
                row.map((v, x) => orderedDither(v, x, y, BayerMatrices.bayer4, numLevels))
            );
            break;
            
        default:
            dithered = values;
    }
    
    // Convert to characters
    return dithered.map(row => 
        row.map(v => getCharForDensity(Math.max(0, Math.min(1, v)), palette))
    );
}

/**
 * Apply dithering to an AsciiBuffer
 * @param {import('./rasterizer.js').AsciiBuffer} buffer 
 * @param {number[][]} values - Density values 0-1
 * @param {object} [options]
 * @param {string} [options.algorithm='bayer'] 
 * @param {string} [options.palette='standard'] 
 * @param {number} [options.z=0] 
 */
export function applyDitherToBuffer(buffer, values, options = {}) {
    const { z = 0 } = options;
    const chars = ditherToAscii(values, options);
    
    for (let y = 0; y < chars.length && y < buffer.height; y++) {
        for (let x = 0; x < chars[y].length && x < buffer.width; x++) {
            buffer.setChar(x, y, chars[y][x], null, z);
        }
    }
}

/**
 * Create a grayscale gradient for testing
 * @param {number} width 
 * @param {number} height 
 * @param {string} [direction='horizontal'] 
 * @returns {number[][]}
 */
export function createGradient(width, height, direction = 'horizontal') {
    const result = [];
    
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            switch (direction) {
                case 'horizontal':
                    row.push(x / (width - 1));
                    break;
                case 'vertical':
                    row.push(y / (height - 1));
                    break;
                case 'diagonal':
                    row.push((x + y) / (width + height - 2));
                    break;
                case 'radial':
                    const cx = width / 2;
                    const cy = height / 2;
                    const maxDist = Math.sqrt(cx * cx + cy * cy);
                    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    row.push(dist / maxDist);
                    break;
                default:
                    row.push(0.5);
            }
        }
        result.push(row);
    }
    
    return result;
}

// ==========================================
// HALFTONE EFFECTS
// ==========================================

/**
 * Create halftone pattern at position
 * @param {number} value - Intensity 0-1
 * @param {number} x 
 * @param {number} y 
 * @param {number} [cellSize=4] - Size of halftone cell
 * @param {string} [shape='circle'] - 'circle', 'square', 'diamond'
 * @returns {string}
 */
export function getHalftoneChar(value, x, y, cellSize = 4, shape = 'circle') {
    const cx = x % cellSize;
    const cy = y % cellSize;
    const center = cellSize / 2;
    
    let dist;
    switch (shape) {
        case 'square':
            dist = Math.max(Math.abs(cx - center), Math.abs(cy - center));
            break;
        case 'diamond':
            dist = Math.abs(cx - center) + Math.abs(cy - center);
            break;
        case 'circle':
        default:
            dist = Math.sqrt((cx - center) ** 2 + (cy - center) ** 2);
    }
    
    const maxDist = shape === 'diamond' ? center * 2 : center * Math.SQRT2;
    const threshold = value * maxDist;
    
    return dist < threshold ? '█' : ' ';
}

/**
 * Apply halftone effect to values
 * @param {number[][]} values 
 * @param {object} [options]
 * @param {number} [options.cellSize=4] 
 * @param {string} [options.shape='circle'] 
 * @returns {string[][]}
 */
export function applyHalftone(values, options = {}) {
    const { cellSize = 4, shape = 'circle' } = options;
    
    return values.map((row, y) => 
        row.map((v, x) => getHalftoneChar(v, x, y, cellSize, shape))
    );
}

// ==========================================
// EXPORT
// ==========================================

export default {
    // Matrices
    BayerMatrices,
    HalftoneMatrices,
    PatternMatrices,
    
    // Algorithms
    thresholdDither,
    orderedDither,
    bayerDither,
    floydSteinbergDither,
    jarvisDither,
    atkinsonDither,
    sierraDither,
    stuckiDither,
    patternDither,
    randomDither,
    blueNoiseDither,
    
    // ASCII helpers
    ditherToAscii,
    applyDitherToBuffer,
    createGradient,
    
    // Halftone
    getHalftoneChar,
    applyHalftone
};
