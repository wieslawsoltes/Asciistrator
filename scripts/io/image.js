/**
 * Asciistrator - Image Import (ASCII Conversion)
 * 
 * Converts raster images (PNG, JPG, etc.) to ASCII art.
 * Uses brightness-to-character mapping with optional dithering.
 */

/**
 * Default ASCII character palettes for brightness mapping
 */
export const AsciiPalettes = {
    standard: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
    simple: ' .:-=+*#%@',
    blocks: ' ░▒▓█',
    minimal: ' .-:+*#@',
    detailed: ' .`^",:;I!i><~+_-?]}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$█',
    custom: null  // User-defined
};

/**
 * Image to ASCII converter
 */
export class ImageToAscii {
    constructor(options = {}) {
        this.options = {
            width: options.width || 80,
            height: options.height || 40,
            preserveAspectRatio: options.preserveAspectRatio !== false,
            palette: options.palette || 'standard',
            customPalette: options.customPalette || null,
            invert: options.invert || false,
            colorMode: options.colorMode || 'grayscale', // 'grayscale', 'color', 'threshold'
            threshold: options.threshold || 128,
            contrast: options.contrast || 1,
            brightness: options.brightness || 0,
            ditherMode: options.ditherMode || 'none', // 'none', 'floyd-steinberg', 'ordered'
            edgeDetection: options.edgeDetection || false,
            edgeChar: options.edgeChar || '*'
        };
    }

    /**
     * Convert image file to ASCII art
     * @param {File} file - Image file
     * @returns {Promise<object>} - { ascii: string, width: number, height: number, colorData?: array }
     */
    async convertFile(file) {
        const img = await this._loadImage(file);
        return this.convertImage(img);
    }

    /**
     * Convert image URL to ASCII art
     * @param {string} url - Image URL
     * @returns {Promise<object>}
     */
    async convertURL(url) {
        const img = await this._loadImageFromURL(url);
        return this.convertImage(img);
    }

    /**
     * Convert HTMLImageElement to ASCII art
     * @param {HTMLImageElement} img - Image element
     * @returns {object}
     */
    convertImage(img) {
        // Create canvas for pixel access
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate dimensions
        let targetWidth = this.options.width;
        let targetHeight = this.options.height;

        if (this.options.preserveAspectRatio) {
            const aspectRatio = img.width / img.height;
            // ASCII chars are typically ~2x taller than wide
            const charAspectRatio = 0.5;
            
            if (aspectRatio > 1) {
                targetHeight = Math.round(targetWidth / aspectRatio * charAspectRatio);
            } else {
                targetWidth = Math.round(targetHeight * aspectRatio / charAspectRatio);
            }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw scaled image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const pixels = imageData.data;

        // Apply pre-processing
        this._applyBrightnessContrast(pixels);

        // Edge detection (optional)
        let edgeMap = null;
        if (this.options.edgeDetection) {
            edgeMap = this._detectEdges(pixels, targetWidth, targetHeight);
        }

        // Apply dithering (if enabled)
        if (this.options.ditherMode === 'floyd-steinberg') {
            this._floydSteinbergDither(pixels, targetWidth, targetHeight);
        } else if (this.options.ditherMode === 'ordered') {
            this._orderedDither(pixels, targetWidth, targetHeight);
        }

        // Get palette
        const palette = this._getPalette();

        // Convert to ASCII
        const result = {
            ascii: '',
            width: targetWidth,
            height: targetHeight,
            lines: [],
            colorData: this.options.colorMode === 'color' ? [] : null
        };

        for (let y = 0; y < targetHeight; y++) {
            let line = '';
            const colorLine = this.options.colorMode === 'color' ? [] : null;

            for (let x = 0; x < targetWidth; x++) {
                const idx = (y * targetWidth + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                const a = pixels[idx + 3];

                // Check for edge
                if (edgeMap && edgeMap[y * targetWidth + x]) {
                    line += this.options.edgeChar;
                    if (colorLine) colorLine.push(null);
                    continue;
                }

                // Calculate brightness
                let brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                
                // Handle transparency
                if (a < 128) {
                    line += ' ';
                    if (colorLine) colorLine.push(null);
                    continue;
                }

                // Invert if needed
                if (this.options.invert) {
                    brightness = 255 - brightness;
                }

                // Map to character
                let char;
                if (this.options.colorMode === 'threshold') {
                    char = brightness > this.options.threshold ? ' ' : palette[palette.length - 1];
                } else {
                    const charIndex = Math.floor((brightness / 255) * (palette.length - 1));
                    char = palette[charIndex];
                }

                line += char;

                // Store color if in color mode
                if (colorLine) {
                    colorLine.push(this._rgbToHex(r, g, b));
                }
            }

            result.lines.push(line);
            if (colorLine) result.colorData.push(colorLine);
        }

        result.ascii = result.lines.join('\n');
        return result;
    }

    /**
     * Get the character palette
     * @private
     */
    _getPalette() {
        if (this.options.customPalette) {
            return this.options.customPalette.split('');
        }
        return (AsciiPalettes[this.options.palette] || AsciiPalettes.standard).split('');
    }

    /**
     * Load image from file
     * @private
     */
    _loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Load image from URL
     * @private
     */
    _loadImageFromURL(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
        });
    }

    /**
     * Apply brightness and contrast adjustments
     * @private
     */
    _applyBrightnessContrast(pixels) {
        const brightness = this.options.brightness;
        const contrast = this.options.contrast;

        for (let i = 0; i < pixels.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                let value = pixels[i + c];
                
                // Apply brightness
                value += brightness;
                
                // Apply contrast
                value = ((value - 128) * contrast) + 128;
                
                // Clamp
                pixels[i + c] = Math.max(0, Math.min(255, value));
            }
        }
    }

    /**
     * Floyd-Steinberg dithering
     * @private
     */
    _floydSteinbergDither(pixels, width, height) {
        const levels = this._getPalette().length;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                for (let c = 0; c < 3; c++) {
                    const oldVal = pixels[idx + c];
                    const newVal = Math.round(oldVal / 255 * (levels - 1)) / (levels - 1) * 255;
                    const error = oldVal - newVal;
                    
                    pixels[idx + c] = newVal;
                    
                    // Distribute error to neighbors
                    if (x + 1 < width) {
                        pixels[idx + 4 + c] += error * 7 / 16;
                    }
                    if (y + 1 < height) {
                        if (x > 0) {
                            pixels[idx + width * 4 - 4 + c] += error * 3 / 16;
                        }
                        pixels[idx + width * 4 + c] += error * 5 / 16;
                        if (x + 1 < width) {
                            pixels[idx + width * 4 + 4 + c] += error * 1 / 16;
                        }
                    }
                }
            }
        }
    }

    /**
     * Ordered (Bayer) dithering
     * @private
     */
    _orderedDither(pixels, width, height) {
        const bayerMatrix = [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5]
        ];
        const matrixSize = 4;
        const levels = this._getPalette().length;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const threshold = (bayerMatrix[y % matrixSize][x % matrixSize] / 16 - 0.5) * 255 / levels;

                for (let c = 0; c < 3; c++) {
                    const value = pixels[idx + c] + threshold;
                    pixels[idx + c] = Math.max(0, Math.min(255, Math.round(value / 255 * (levels - 1)) / (levels - 1) * 255));
                }
            }
        }
    }

    /**
     * Simple edge detection using Sobel operator
     * @private
     */
    _detectEdges(pixels, width, height) {
        const edgeMap = new Array(width * height).fill(false);
        const threshold = 50;

        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const gray = pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114;
                        
                        gx += gray * sobelX[ky + 1][kx + 1];
                        gy += gray * sobelY[ky + 1][kx + 1];
                    }
                }

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                edgeMap[y * width + x] = magnitude > threshold;
            }
        }

        return edgeMap;
    }

    /**
     * Convert RGB to hex color
     * @private
     */
    _rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }
}

/**
 * Create ASCII art text objects from image conversion result
 * @param {object} result - Result from ImageToAscii.convert*
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @returns {object[]} - Array of text object data
 */
export function createTextObjectsFromAscii(result, startX = 0, startY = 0) {
    const objects = [];

    for (let y = 0; y < result.lines.length; y++) {
        const line = result.lines[y];
        if (line.trim().length === 0) continue;

        // If we have color data, create separate objects for color runs
        if (result.colorData && result.colorData[y]) {
            let runStart = 0;
            let currentColor = result.colorData[y][0];

            for (let x = 1; x <= line.length; x++) {
                const color = x < line.length ? result.colorData[y][x] : null;

                if (color !== currentColor || x === line.length) {
                    const text = line.substring(runStart, x);
                    if (text.trim().length > 0) {
                        objects.push({
                            type: 'text',
                            x: startX + runStart,
                            y: startY + y,
                            text: text,
                            width: text.length,
                            height: 1,
                            strokeColor: currentColor
                        });
                    }
                    runStart = x;
                    currentColor = color;
                }
            }
        } else {
            // No color - create one text object per line
            objects.push({
                type: 'text',
                x: startX,
                y: startY + y,
                text: line,
                width: line.length,
                height: 1
            });
        }
    }

    return objects;
}

export default {
    AsciiPalettes,
    ImageToAscii,
    createTextObjectsFromAscii
};
