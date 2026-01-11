/**
 * Asciistrator - Helper Utilities
 * 
 * General purpose utility functions.
 */

// ==========================================
// TYPE CHECKING
// ==========================================

/**
 * Check if value is a number
 * @param {*} value 
 * @returns {boolean}
 */
export function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a string
 * @param {*} value 
 * @returns {boolean}
 */
export function isString(value) {
    return typeof value === 'string';
}

/**
 * Check if value is a function
 * @param {*} value 
 * @returns {boolean}
 */
export function isFunction(value) {
    return typeof value === 'function';
}

/**
 * Check if value is an object (not null or array)
 * @param {*} value 
 * @returns {boolean}
 */
export function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if value is an array
 * @param {*} value 
 * @returns {boolean}
 */
export function isArray(value) {
    return Array.isArray(value);
}

/**
 * Check if value is undefined or null
 * @param {*} value 
 * @returns {boolean}
 */
export function isNil(value) {
    return value === undefined || value === null;
}

// ==========================================
// MATH UTILITIES
// ==========================================

/**
 * Clamp value between min and max
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * @param {number} a 
 * @param {number} b 
 * @param {number} t 
 * @returns {number}
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Inverse linear interpolation (find t given value)
 * @param {number} a 
 * @param {number} b 
 * @param {number} value 
 * @returns {number}
 */
export function invLerp(a, b, value) {
    return (value - a) / (b - a);
}

/**
 * Remap value from one range to another
 * @param {number} value 
 * @param {number} inMin 
 * @param {number} inMax 
 * @param {number} outMin 
 * @param {number} outMax 
 * @returns {number}
 */
export function remap(value, inMin, inMax, outMin, outMax) {
    const t = invLerp(inMin, inMax, value);
    return lerp(outMin, outMax, t);
}

/**
 * Round to decimal places
 * @param {number} value 
 * @param {number} [decimals=2] 
 * @returns {number}
 */
export function round(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number}
 */
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 * @param {number} radians 
 * @returns {number}
 */
export function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

/**
 * Normalize angle to 0-2π range
 * @param {number} angle - Angle in radians
 * @returns {number}
 */
export function normalizeAngle(angle) {
    const TWO_PI = Math.PI * 2;
    return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

/**
 * Get shortest angle difference
 * @param {number} from - Start angle in radians
 * @param {number} to - End angle in radians
 * @returns {number}
 */
export function angleDiff(from, to) {
    const diff = normalizeAngle(to - from);
    return diff > Math.PI ? diff - Math.PI * 2 : diff;
}

/**
 * Check if two numbers are approximately equal
 * @param {number} a 
 * @param {number} b 
 * @param {number} [epsilon=1e-10] 
 * @returns {boolean}
 */
export function approxEqual(a, b, epsilon = 1e-10) {
    return Math.abs(a - b) < epsilon;
}

/**
 * Generate random number in range
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function random(min = 0, max = 1) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate random integer in range (inclusive)
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Snap value to grid
 * @param {number} value 
 * @param {number} gridSize 
 * @returns {number}
 */
export function snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
}

// ==========================================
// ARRAY UTILITIES
// ==========================================

/**
 * Get last element of array
 * @template T
 * @param {T[]} arr 
 * @returns {T|undefined}
 */
export function last(arr) {
    return arr[arr.length - 1];
}

/**
 * Get first element of array
 * @template T
 * @param {T[]} arr 
 * @returns {T|undefined}
 */
export function first(arr) {
    return arr[0];
}

/**
 * Remove element from array (mutates)
 * @template T
 * @param {T[]} arr 
 * @param {T} item 
 * @returns {boolean}
 */
export function remove(arr, item) {
    const index = arr.indexOf(item);
    if (index !== -1) {
        arr.splice(index, 1);
        return true;
    }
    return false;
}

/**
 * Insert element at index (mutates)
 * @template T
 * @param {T[]} arr 
 * @param {number} index 
 * @param {T} item 
 */
export function insert(arr, index, item) {
    arr.splice(index, 0, item);
}

/**
 * Move element to new index (mutates)
 * @template T
 * @param {T[]} arr 
 * @param {number} fromIndex 
 * @param {number} toIndex 
 */
export function move(arr, fromIndex, toIndex) {
    const item = arr.splice(fromIndex, 1)[0];
    arr.splice(toIndex, 0, item);
}

/**
 * Shuffle array (mutates)
 * @template T
 * @param {T[]} arr 
 * @returns {T[]}
 */
export function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Get unique values from array
 * @template T
 * @param {T[]} arr 
 * @returns {T[]}
 */
export function unique(arr) {
    return [...new Set(arr)];
}

/**
 * Flatten nested arrays
 * @param {any[]} arr 
 * @param {number} [depth=1] 
 * @returns {any[]}
 */
export function flatten(arr, depth = 1) {
    return arr.flat(depth);
}

/**
 * Group array by key
 * @template T
 * @param {T[]} arr 
 * @param {string|((item: T) => string)} key 
 * @returns {Object<string, T[]>}
 */
export function groupBy(arr, key) {
    return arr.reduce((groups, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        (groups[groupKey] = groups[groupKey] || []).push(item);
        return groups;
    }, {});
}

/**
 * Create range of numbers
 * @param {number} start 
 * @param {number} end 
 * @param {number} [step=1] 
 * @returns {number[]}
 */
export function range(start, end, step = 1) {
    const result = [];
    for (let i = start; step > 0 ? i < end : i > end; i += step) {
        result.push(i);
    }
    return result;
}

// ==========================================
// OBJECT UTILITIES
// ==========================================

/**
 * Deep clone object
 * @template T
 * @param {T} obj 
 * @returns {T}
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    const cloned = {};
    for (const key of Object.keys(obj)) {
        cloned[key] = deepClone(obj[key]);
    }
    return cloned;
}

/**
 * Deep merge objects
 * @param {object} target 
 * @param {...object} sources 
 * @returns {object}
 */
export function deepMerge(target, ...sources) {
    for (const source of sources) {
        for (const key of Object.keys(source)) {
            if (isObject(source[key]) && isObject(target[key])) {
                deepMerge(target[key], source[key]);
            } else {
                target[key] = deepClone(source[key]);
            }
        }
    }
    return target;
}

/**
 * Pick specific keys from object
 * @param {object} obj 
 * @param {string[]} keys 
 * @returns {object}
 */
export function pick(obj, keys) {
    return keys.reduce((result, key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

/**
 * Omit specific keys from object
 * @param {object} obj 
 * @param {string[]} keys 
 * @returns {object}
 */
export function omit(obj, keys) {
    const keySet = new Set(keys);
    return Object.keys(obj).reduce((result, key) => {
        if (!keySet.has(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

/**
 * Get nested value from object using path
 * @param {object} obj 
 * @param {string} path - Dot-separated path
 * @param {*} [defaultValue] 
 * @returns {*}
 */
export function get(obj, path, defaultValue) {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        if (result == null) return defaultValue;
        result = result[key];
    }
    return result !== undefined ? result : defaultValue;
}

/**
 * Set nested value in object using path
 * @param {object} obj 
 * @param {string} path - Dot-separated path
 * @param {*} value 
 */
export function set(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || !isObject(current[key])) {
            current[key] = {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}

// ==========================================
// STRING UTILITIES
// ==========================================

/**
 * Capitalize first letter
 * @param {string} str 
 * @returns {string}
 */
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert to camelCase
 * @param {string} str 
 * @returns {string}
 */
export function camelCase(str) {
    return str
        .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
        .replace(/^./, c => c.toLowerCase());
}

/**
 * Convert to kebab-case
 * @param {string} str 
 * @returns {string}
 */
export function kebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

/**
 * Truncate string with ellipsis
 * @param {string} str 
 * @param {number} length 
 * @param {string} [suffix='...'] 
 * @returns {string}
 */
export function truncate(str, length, suffix = '...') {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Pad string to length
 * @param {string|number} value 
 * @param {number} length 
 * @param {string} [char='0'] 
 * @param {boolean} [left=true] 
 * @returns {string}
 */
export function pad(value, length, char = '0', left = true) {
    const str = String(value);
    const padding = char.repeat(Math.max(0, length - str.length));
    return left ? padding + str : str + padding;
}

// ==========================================
// ID/UUID UTILITIES
// ==========================================

let _idCounter = 0;

/**
 * Generate unique ID
 * @param {string} [prefix='id'] 
 * @returns {string}
 */
export function uniqueId(prefix = 'id') {
    return `${prefix}_${++_idCounter}`;
}

/**
 * Generate UUID v4
 * @returns {string}
 */
export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Generate short unique ID
 * @param {number} [length=8] 
 * @returns {string}
 */
export function shortId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ==========================================
// COLOR UTILITIES
// ==========================================

/**
 * Parse hex color to RGB
 * @param {string} hex 
 * @returns {{r: number, g: number, b: number}}
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex
 * @param {number} r 
 * @param {number} g 
 * @param {number} b 
 * @returns {string}
 */
export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(clamp(x, 0, 255)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Convert RGB to HSL
 * @param {number} r - 0-255
 * @param {number} g - 0-255
 * @param {number} b - 0-255
 * @returns {{h: number, s: number, l: number}} - h: 0-360, s: 0-100, l: 0-100
 */
export function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    
    if (max === min) {
        return { h: 0, s: 0, l: Math.round(l * 100) };
    }
    
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    let h;
    switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
    }
    
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

/**
 * Convert HSL to RGB
 * @param {number} h - 0-360
 * @param {number} s - 0-100
 * @param {number} l - 0-100
 * @returns {{r: number, g: number, b: number}}
 */
export function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    if (s === 0) {
        const gray = Math.round(l * 255);
        return { r: gray, g: gray, b: gray };
    }
    
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    return {
        r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
        g: Math.round(hue2rgb(p, q, h) * 255),
        b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
    };
}

/**
 * Get grayscale value from RGB
 * @param {number} r 
 * @param {number} g 
 * @param {number} b 
 * @returns {number} - 0-255
 */
export function rgbToGray(r, g, b) {
    // Use luminosity formula
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

// ==========================================
// ASYNC UTILITIES
// ==========================================

/**
 * Sleep for ms milliseconds
 * @param {number} ms 
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run function on next tick
 * @param {Function} fn 
 */
export function nextTick(fn) {
    Promise.resolve().then(fn);
}

/**
 * Create async queue that processes items one at a time
 * @param {number} [concurrency=1] 
 * @returns {{push: Function, onEmpty: Function}}
 */
export function createQueue(concurrency = 1) {
    const queue = [];
    let running = 0;
    let onEmptyCallback = null;
    
    const process = async () => {
        if (running >= concurrency || queue.length === 0) return;
        
        running++;
        const { task, resolve, reject } = queue.shift();
        
        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            running--;
            process();
            
            if (running === 0 && queue.length === 0 && onEmptyCallback) {
                onEmptyCallback();
            }
        }
    };
    
    return {
        push(task) {
            return new Promise((resolve, reject) => {
                queue.push({ task, resolve, reject });
                process();
            });
        },
        onEmpty(callback) {
            onEmptyCallback = callback;
        }
    };
}

// ==========================================
// EXPORT
// ==========================================

export default {
    // Type checking
    isNumber,
    isString,
    isFunction,
    isObject,
    isArray,
    isNil,
    
    // Math
    clamp,
    lerp,
    invLerp,
    remap,
    round,
    degToRad,
    radToDeg,
    normalizeAngle,
    angleDiff,
    approxEqual,
    random,
    randomInt,
    snapToGrid,
    
    // Arrays
    last,
    first,
    remove,
    insert,
    move,
    shuffle,
    unique,
    flatten,
    groupBy,
    range,
    
    // Objects
    deepClone,
    deepMerge,
    pick,
    omit,
    get,
    set,
    
    // Strings
    capitalize,
    camelCase,
    kebabCase,
    truncate,
    pad,
    
    // IDs
    uniqueId,
    uuid,
    shortId,
    
    // Colors
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    hslToRgb,
    rgbToGray,
    
    // Async
    sleep,
    nextTick,
    createQueue
};
